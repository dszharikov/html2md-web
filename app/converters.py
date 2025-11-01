from bs4 import BeautifulSoup
import html2text
from markdownify import markdownify as md

def sanitize_html(html: str) -> str:
    soup = BeautifulSoup(html, "html5lib")

    for tag in soup.find_all(True):
        if not tag.attrs:
            continue
        for attr in list(tag.attrs.keys()):
            if attr.startswith("data-") or attr in ("style", "class"):
                del tag.attrs[attr]

    for p in soup.select("li > p"):
        p.unwrap()

    for p in soup.find_all("p"):
        if not p.get_text(strip=True):
            p.decompose()

    return str(soup.body or soup)

def html_to_md_safe(html: str) -> str:
    # 1) прямая попытка
    try:
        return md(
            html,
            heading_style="ATX",
            bullets="*",
            code_language_detection=True,
            strip=["style", "script"],
            convert=["a", "img", "table", "pre", "code"],
        ).strip() + "\n"
    except Exception:
        pass

    # 2) через санитайз
    clean_html = sanitize_html(html)
    try:
        return md(
            clean_html,
            heading_style="ATX",
            bullets="*",
            code_language_detection=True,
            strip=["style", "script"],
            convert=["a", "img", "table", "pre", "code"],
        ).strip() + "\n"
    except Exception:
        pass

    # 3) fallback — html2text
    h = html2text.HTML2Text()
    h.ignore_images = False
    h.ignore_links = False
    h.body_width = 0
    return h.handle(clean_html).strip() + "\n"
