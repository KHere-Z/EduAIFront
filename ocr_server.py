"""
PaddleOCR 代理：PaddleOCR-VL 官方优先，失败自动降级 DeepSeek-OCR（高可用，无本地依赖）。
启动：pip install requests fastapi uvicorn && python ocr_server.py
凭证通过 .env 文件或系统环境变量注入（不硬编码，避免提交进 git）。
"""
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, tempfile, os, requests, time, json, base64, re, ast


# ---------- 加载 .env（本地凭证，已被 .gitignore 忽略） ----------
def _load_env(path=".env"):
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())


_load_env()

# ---------- L1：PaddleOCR-VL 官方（完整版面解析 + 配图） ----------
PADDLE_JOB_URL = "https://paddleocr.aistudio-app.com/api/v2/ocr/jobs"
PADDLE_TOKEN = os.environ.get("PADDLEOCR_TOKEN", "")
PADDLE_MODEL = "PaddleOCR-VL-1.6"

# ---------- L2：DeepSeek-OCR（SiliconFlow 云端，OpenAI 兼容，支持 PDF） ----------
DS_OCR_URL = "https://api.siliconflow.cn/v1/chat/completions"
DS_OCR_KEY = os.environ.get("DEEPSEEK_OCR_API_KEY", "")
DS_OCR_MODEL = "deepseek-ai/DeepSeek-OCR"

app = FastAPI(title="PaddleOCR Proxy")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ---------- 熔断器：连续失败 N 次熔断，冷却后恢复 ----------
CIRCUIT_THRESHOLD = 3
CIRCUIT_COOLDOWN = 30
_circuit = {
    "paddle": {"fails": 0, "open_until": 0.0},
    "deepseek": {"fails": 0, "open_until": 0.0},
}


def _is_open(name):
    return time.time() < _circuit[name]["open_until"]


def _record_fail(name):
    c = _circuit[name]
    c["fails"] += 1
    if c["fails"] >= CIRCUIT_THRESHOLD:
        c["open_until"] = time.time() + CIRCUIT_COOLDOWN
        c["fails"] = 0


def _record_ok(name):
    c = _circuit[name]
    c["fails"] = 0
    c["open_until"] = 0.0


# ---------- L1：PaddleOCR-VL 官方 ----------
def call_paddle(tmp_path):
    headers = {"Authorization": f"bearer {PADDLE_TOKEN}"}
    data = {"model": PADDLE_MODEL, "optionalPayload": json.dumps({
        "useDocOrientationClassify": False,
        "useDocUnwarping": False,
        "useChartRecognition": False
    })}
    with open(tmp_path, "rb") as f:
        resp = requests.post(PADDLE_JOB_URL, headers=headers, data=data,
                             files={"file": f}, timeout=8)
    resp.raise_for_status()
    job_id = resp.json()["data"]["jobId"]

    for _ in range(20):  # 最多约 60 秒
        r = requests.get(f"{PADDLE_JOB_URL}/{job_id}", headers=headers, timeout=8)
        r.raise_for_status()
        state = r.json()["data"]["state"]
        if state == "done":
            json_url = r.json()["data"]["resultUrl"]["jsonUrl"]
            break
        elif state == "failed":
            raise RuntimeError(r.json()["data"].get("errorMsg", "OCR failed"))
        time.sleep(3)
    else:
        raise TimeoutError("PaddleOCR timeout")

    result = requests.get(json_url, timeout=15)
    result.raise_for_status()
    texts, images, pages = [], [], []
    for line in result.text.strip().split("\n"):
        if not line.strip():
            continue
        obj = json.loads(line)
        result_obj = obj.get("result", {}) or {}
        data_info = result_obj.get("dataInfo", {}) or {}
        width, height = data_info.get("width"), data_info.get("height")
        for res in result_obj.get("layoutParsingResults", []):
            pruned = res.get("prunedResult", {}) or {}
            md = res.get("markdown", {}) or {}
            if not width:
                width = pruned.get("width")
            if not height:
                height = pruned.get("height")
            image_urls = list((md.get("images") or {}).values())
            image_idx = 0
            blocks = []
            for b in (pruned.get("parsing_res_list") or []):
                content = (b.get("block_content") or "").strip()
                label = b.get("block_label")
                image_url = None
                if label == "image" and image_idx < len(image_urls):
                    image_url = image_urls[image_idx]
                    image_idx += 1
                    images.append({"name": "block_{}".format(b.get("block_id")), "url": image_url})
                if content:
                    texts.append(content)
                blocks.append({
                    "label": label,
                    "content": content,
                    "bbox": b.get("block_bbox"),
                    "order": b.get("block_order"),
                    "imageUrl": image_url,
                })
            if not any(b.get("content") for b in blocks):
                md_text = (md.get("text") or "").strip()
                if md_text:
                    texts.append(md_text)
            pages.append({"width": width, "height": height, "blocks": blocks})

    return {"text": "\n\n".join(texts), "lines": len(texts), "images": images,
            "pages": pages, "source": "paddle"}


# ---------- L2：DeepSeek-OCR（grounding 定位，输出 blocks 带 bbox，支持 PDF） ----------
_MIME = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".bmp": "image/bmp", ".webp": "image/webp", ".pdf": "application/pdf",
}

# DeepSeek-OCR grounding 格式：<|ref|>文本<|/ref|><|det|>[[x1,y1,x2,y2]]<|/det|>，坐标 0-999 归一化
_GROUND_RE = re.compile(
    r"<\|ref\|>(.*?)<\|/ref\|>\s*<\|det\|>\s*\[\[(.*?)\]\](?:\s*<\|/det\|>)",
    re.DOTALL,
)


def _parse_deepseek(raw):
    """把 grounding 输出解析成 blocks（label/content/bbox），并返回去标签后的干净文本。"""
    blocks, clean, last_end = [], [], 0
    for m in _GROUND_RE.finditer(raw):
        clean.append(raw[last_end:m.start()])
        content = m.group(1).strip()
        bbox = None
        try:
            coords = ast.literal_eval("[[" + m.group(2) + "]]")[0]
            bbox = [int(round(float(v))) for v in coords[:4]]
        except Exception:
            bbox = None
        if content and bbox:
            blocks.append({"label": "text", "content": content, "bbox": bbox,
                           "order": len(blocks), "imageUrl": None})
        clean.append(content)
        last_end = m.end()
    clean.append(raw[last_end:])
    text = "".join(clean).strip()
    return blocks, text


def call_deepseek(tmp_path):
    ext = os.path.splitext(tmp_path)[1].lower()
    mime = _MIME.get(ext, "image/png")
    with open(tmp_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()

    payload = {
        "model": DS_OCR_MODEL,
        "messages": [{"role": "user", "content": [
            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
            {"type": "text", "text": "<image>\n<|grounding|>Convert the document to markdown."}
        ]}],
    }
    r = requests.post(DS_OCR_URL, json=payload,
                      headers={"Authorization": f"Bearer {DS_OCR_KEY}"}, timeout=30)
    r.raise_for_status()
    raw = (r.json()["choices"][0]["message"]["content"] or "").strip()
    blocks, text = _parse_deepseek(raw)
    # 坐标是 0-999 归一化，width/height 统一 999，前端 bboxToPct 直接得到百分比
    pages = [{"width": 999, "height": 999, "blocks": blocks}] if blocks else []
    return {"text": text, "lines": text.count("\n") + 1, "images": [],
            "pages": pages, "source": "deepseek"}


@app.post("/ocr")
async def ocr_image(file: UploadFile = File(...)):
    """上传图片/PDF，返回 OCR 识别文字。PaddleOCR-VL 优先，失败降级 DeepSeek-OCR。"""
    suffix = os.path.splitext(file.filename or "img.png")[1] or ".png"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # L1：PaddleOCR-VL
        try:
            if _is_open("paddle"):
                raise RuntimeError("paddle circuit open")
            result = call_paddle(tmp_path)
            _record_ok("paddle")
            return result
        except Exception as e1:
            _record_fail("paddle")
            # L2：DeepSeek-OCR
            try:
                if _is_open("deepseek"):
                    raise RuntimeError("deepseek circuit open")
                result = call_deepseek(tmp_path)
                _record_ok("deepseek")
                return result
            except Exception as e2:
                _record_fail("deepseek")
                return {"text": "", "lines": 0, "images": [], "pages": [],
                        "error": f"OCR 调用失败(Paddle:{e1}; DeepSeek:{e2})"}
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


@app.get("/health")
def health():
    return {
        "status": "ok",
        "paddle": "open" if not _is_open("paddle") else "circuit-open",
        "deepseek": "open" if not _is_open("deepseek") else "circuit-open",
    }


if __name__ == "__main__":
    print("PaddleOCR proxy ready: http://localhost:8765")
    uvicorn.run(app, host="0.0.0.0", port=8765, log_level="warning")
