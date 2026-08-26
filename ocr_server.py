"""
PaddleOCR 代理：官方在线 API 优先，失败时回退本地 PP-OCR（纯文字 OCR 兜底）。

安装（本地兜底依赖）：
    pip install requests fastapi uvicorn
    pip install paddlepaddle paddleocr pillow

说明：
- 官方 API 可用时走 PaddleOCR-VL（含版面解析 + 配图），功能完整；
- 官方 API 挂掉/超时/token 失效时，自动降级本地 PP-OCR（仅纯文字 + 文字框，
  无配图、无版面分类），保证题目识别不中断。
"""
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, tempfile, os, requests, time, json

JOB_URL = "https://paddleocr.aistudio-app.com/api/v2/ocr/jobs"
TOKEN = os.environ.get("PADDLEOCR_TOKEN", "")
MODEL = "PaddleOCR-VL-1.6"

app = FastAPI(title="PaddleOCR Proxy")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ============================================================
# 本地 PP-OCR 兜底（懒加载，避免启动就占内存 / 下载模型）
# ============================================================
_local_ocr = None

def get_local_ocr():
    global _local_ocr
    if _local_ocr is None:
        from paddleocr import PaddleOCR
        _local_ocr = PaddleOCR(use_angle_cls=True, lang='ch', show_log=False)
    return _local_ocr

def _call_local(img_path):
    """本地 PP-OCR 推理。兼容 PaddleOCR 2.x(.ocr) 与 3.x(.predict)。"""
    ocr = get_local_ocr()
    # 3.x 返回 [Result]，Result 含 rec_texts/rec_polys；2.x 返回 [[[box,(text,score)],...],...]
    if hasattr(ocr, 'predict'):
        res = ocr.predict(img_path)
        r = res[0]
        texts = list(getattr(r, 'rec_texts', []) or [])
        polys = list(getattr(r, 'rec_polys', []) or getattr(r, 'dt_polys', []) or [])
        lines = []
        for i, t in enumerate(texts):
            box = polys[i] if i < len(polys) else None
            lines.append((box, (t, None)))
    else:
        raw = ocr.ocr(img_path, cls=True)
        lines = []
        for page in (raw or []):
            for line in (page or []):
                box = line[0]
                txt, score = line[1]
                lines.append((box, (txt, score)))
    return lines

def local_ocr_image(img_path):
    """把本地 PP-OCR 结果转成与官方 API 兼容的 blocks 结构（纯文字，无配图）。"""
    lines = _call_local(img_path)

    from PIL import Image
    with Image.open(img_path) as im:
        w, h = im.size

    blocks = []
    texts = []
    for idx, (box, (txt, _score)) in enumerate(lines):
        txt = (txt or '').strip()
        if not txt:
            continue
        bbox = None
        if box:
            xs = [p[0] for p in box]
            ys = [p[1] for p in box]
            bbox = [min(xs), min(ys), max(xs), max(ys)]
        blocks.append({
            "label": "text",
            "content": txt,
            "bbox": bbox,
            "order": idx,
            "imageUrl": None,
        })
        texts.append(txt)

    return {
        "text": "\n".join(texts),
        "lines": len(texts),
        "images": [],
        "pages": [{"width": w, "height": h, "blocks": blocks}],
        "source": "local",  # 标记来源，便于排查
    }


# ============================================================
# 官方在线 API（原逻辑，补 timeout）
# ============================================================
def call_remote(tmp_path):
    headers = {"Authorization": f"bearer {TOKEN}"}
    data = {"model": MODEL, "optionalPayload": json.dumps({
        "useDocOrientationClassify": False,
        "useDocUnwarping": False,
        "useChartRecognition": False
    })}
    with open(tmp_path, "rb") as f:
        resp = requests.post(JOB_URL, headers=headers, data=data,
                             files={"file": f}, timeout=30)
    resp.raise_for_status()
    job_id = resp.json()["data"]["jobId"]

    for _ in range(40):  # 最多约 2 分钟
        r = requests.get(f"{JOB_URL}/{job_id}", headers=headers, timeout=10)
        r.raise_for_status()
        state = r.json()["data"]["state"]
        if state == "done":
            json_url = r.json()["data"]["resultUrl"]["jsonUrl"]
            break
        elif state == "failed":
            raise RuntimeError(r.json()["data"].get("errorMsg", "OCR failed"))
        time.sleep(3)
    else:
        raise TimeoutError("OCR timeout")

    result = requests.get(json_url, timeout=30)
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

    return {"text": "\n\n".join(texts), "lines": len(texts),
            "images": images, "pages": pages, "source": "remote"}


@app.post("/ocr")
async def ocr_image(file: UploadFile = File(...)):
    """上传图片，返回 OCR 识别文字。官方 API 失败自动降级本地 PP-OCR。"""
    suffix = os.path.splitext(file.filename or "img.png")[1] or ".png"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        try:
            return call_remote(tmp_path)
        except Exception as e:
            # 官方 API 不可用：降级本地 PP-OCR
            try:
                return local_ocr_image(tmp_path)
            except Exception as e2:
                return {"text": "", "lines": 0, "images": [], "pages": [],
                        "error": f"OCR 调用失败(官方:{e}; 本地:{e2})"}
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    print("PaddleOCR proxy ready: http://localhost:8765")
    uvicorn.run(app, host="0.0.0.0", port=8765, log_level="warning")
