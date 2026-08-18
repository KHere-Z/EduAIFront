"""
PaddleOCR 在线 API 代理
启动：pip install requests && python ocr_server.py
"""
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, tempfile, os, requests, time, json

JOB_URL = "https://paddleocr.aistudio-app.com/api/v2/ocr/jobs"
TOKEN = "9050dafb2f695af932ddbe16f1b97c80ec094588"
MODEL = "PaddleOCR-VL-1.6"

app = FastAPI(title="PaddleOCR Proxy")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/ocr")
async def ocr_image(file: UploadFile = File(...)):
    """上传图片，返回 OCR 识别文字"""
    suffix = os.path.splitext(file.filename or "img.png")[1] or ".png"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # 1. 提交 OCR 任务
        headers = {"Authorization": f"bearer {TOKEN}"}
        # 跳过配图识别、文档矫正、方向检测，只做纯文字OCR
        data = {"model": MODEL, "optionalPayload": json.dumps({
            "useDocOrientationClassify": False,
            "useDocUnwarping": False,
            "useChartRecognition": False
        })}
        with open(tmp_path, "rb") as f:
            resp = requests.post(JOB_URL, headers=headers, data=data, files={"file": f})
        resp.raise_for_status()
        job_id = resp.json()["data"]["jobId"]

        # 2. 轮询等待结果
        for _ in range(60):  # 最多等 5 分钟
            r = requests.get(f"{JOB_URL}/{job_id}", headers=headers)
            r.raise_for_status()
            state = r.json()["data"]["state"]
            if state == "done":
                json_url = r.json()["data"]["resultUrl"]["jsonUrl"]
                break
            elif state == "failed":
                return {"text": "", "error": r.json()["data"].get("errorMsg", "OCR failed")}
            time.sleep(3)
        else:
            return {"text": "", "error": "OCR timeout"}

        # 3. 下载结果，提取文字 + 图片
        result = requests.get(json_url)
        result.raise_for_status()
        texts = []
        images = []
        for line in result.text.strip().split("\n"):
            if not line.strip(): continue
            obj = json.loads(line)
            for res in obj.get("result", {}).get("layoutParsingResults", []):
                md = res.get("markdown", {})
                md_text = md.get("text", "")
                if md_text.strip():
                    texts.append(md_text.strip())
                # 提取 PaddleOCR 检测到的图片（已自动裁剪）
                for img_path, img_url in md.get("images", {}).items():
                    images.append({"name": img_path, "url": img_url})

        return {"text": "\n\n".join(texts), "lines": len(texts), "images": images}
    except Exception as e:
        # 远程 OCR 服务不可用 / Token 失效等：返回 JSON 而非 500，前端可优雅降级
        return {"text": "", "lines": 0, "images": [], "error": f"OCR 调用失败: {e}"}
    finally:
        os.unlink(tmp_path)

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    print("PaddleOCR online proxy ready: http://localhost:8765")
    uvicorn.run(app, host="0.0.0.0", port=8765, log_level="warning")
