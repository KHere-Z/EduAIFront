"""
PDF → Word 试卷重排转换服务
参考 https://github.com/ArtifexSoftware/pdf2docx（MIT）
启动：pip install pdf2docx && python pdf2docx_server.py
"""
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import uvicorn, tempfile, os

try:
    from pdf2docx import Converter
    PDF2DOCX_READY = True
except ImportError:
    PDF2DOCX_READY = False

app = FastAPI(title="PDF2DOCX Converter")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.post("/convert")
async def convert_pdf(file: UploadFile = File(...)):
    """上传 PDF，返回转换后的 Word（.docx）二进制流。失败时返回 JSON {error}。"""
    if not PDF2DOCX_READY:
        return {"error": "服务端未安装 pdf2docx，请先 pip install pdf2docx"}

    name = file.filename or "doc.pdf"
    if not name.lower().endswith(".pdf"):
        return {"error": "仅支持 PDF 文件"}

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        pdf_path = tmp.name
    docx_path = pdf_path + ".docx"

    try:
        cv = Converter(pdf_path)
        cv.convert(docx_path)  # 默认转换全部页
        cv.close()

        with open(docx_path, "rb") as f:
            content = f.read()

        out_name = os.path.splitext(name)[0] + ".docx"
        # UTF-8 编码文件名，兼容中文
        import urllib.parse
        quoted = urllib.parse.quote(out_name)
        return Response(
            content,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quoted}"},
        )
    except Exception as e:
        return {"error": f"转换失败: {e}"}
    finally:
        for p in (pdf_path, docx_path):
            try:
                if os.path.exists(p):
                    os.unlink(p)
            except Exception:
                pass


@app.get("/health")
def health():
    return {"status": "ok", "pdf2docx": PDF2DOCX_READY}


if __name__ == "__main__":
    print("PDF2DOCX converter ready: http://localhost:8766")
    uvicorn.run(app, host="0.0.0.0", port=8766, log_level="warning")
