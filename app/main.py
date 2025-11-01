from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from .converters import html_to_md_safe

app = FastAPI(title="HTML → Markdown Converter")

app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

class ConvertIn(BaseModel):
    html: str

@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/convert", response_class=JSONResponse)
def convert(payload: ConvertIn):
    try:
        md_text = html_to_md_safe(payload.html or "")
        return {"ok": True, "markdown": md_text}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": f"{type(e).__name__}: {e}"}
        )
