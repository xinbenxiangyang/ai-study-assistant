import fitz
import io
from fastapi import APIRouter, UploadFile, File, Depends
from routers.auth import get_current_user

router = APIRouter()


@router.post("/extract")
async def extract_text(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Extract text from uploaded PDF file."""
    if not file.filename.endswith(".pdf"):
        return {"error": "仅支持 PDF 文件", "text": ""}

    contents = await file.read()
    doc = fitz.open(stream=contents, filetype="pdf")

    text_parts = []
    for page in doc:
        text = page.get_text()
        if text.strip():
            text_parts.append(text.strip())
    doc.close()

    full_text = "\n\n".join(text_parts)
    return {
        "text": full_text,
        "char_count": len(full_text),
        "page_count": len(text_parts),
        "filename": file.filename,
    }
