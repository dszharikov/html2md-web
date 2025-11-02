(function () {
  // Самодиагностика
  console.log("[html2md] app.js loaded");

  function qs(id) { return document.getElementById(id); }
  function on(el, ev, fn){ if (el) el.addEventListener(ev, fn); }

  function setStatus(msg){
    const statusEl = qs("status");
    if (statusEl) statusEl.textContent = msg || "";
  }

  async function convert(){
    const htmlInput = qs("html-input");
    const mdOutput  = qs("md-output");
    const btn       = qs("convert-btn");
    if (!htmlInput || !mdOutput || !btn) {
      console.error("[html2md] missing DOM nodes for convert()");
      return;
    }
    setStatus("Конвертируем…");
    btn.disabled = true;
    try{
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: htmlInput.value || "" })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Ошибка конвертации");
      mdOutput.value = data.markdown || "";
      localStorage.setItem("html2md_last_html", htmlInput.value || "");
      localStorage.setItem("html2md_last_md", mdOutput.value || "");
      setStatus("Готово ✅");
    }catch(e){
      console.error("[html2md] convert error:", e);
      setStatus(`Ошибка: ${e.message}`);
    }finally{
      btn.disabled = false;
    }
  }

  function clearAll(){
    const htmlInput = qs("html-input");
    const mdOutput  = qs("md-output");
    if (htmlInput) htmlInput.value = "";
    if (mdOutput)  mdOutput.value  = "";
    setStatus("");
    localStorage.removeItem("html2md_last_html");
    localStorage.removeItem("html2md_last_md");
    if (htmlInput) htmlInput.focus();
  }

  async function copyMD(){
    const mdOutput = qs("md-output");
    try{
      await navigator.clipboard.writeText((mdOutput && mdOutput.value) || "");
      setStatus("Скопировано 📋");
    }catch{
      setStatus("Не удалось скопировать");
    }
  }

  function downloadMD(){
    const mdOutput = qs("md-output");
    const blob = new Blob([(mdOutput && mdOutput.value) || ""], { type:"text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "note.md";
    document.body.appendChild(a); a.click(); a.remove();
    setStatus("Скачано как note.md");
  }

  function copyBySelector(sel){
    const el = document.querySelector(sel);
    if (!el) return;
    const text = (el.tagName === "PRE" || el.tagName === "TEXTAREA") ? el.textContent : el.innerText;
    navigator.clipboard.writeText(text)
      .then(() => setStatus("Скопировано 📋"))
      .catch(() => setStatus("Не удалось скопировать"));
  }

  // Навешиваем после построения DOM
  document.addEventListener("DOMContentLoaded", function(){
    console.log("[html2md] DOM ready");

    const htmlInput = qs("html-input");
    const mdOutput  = qs("md-output");
    const convertBtn= qs("convert-btn");
    const clearBtn  = qs("clear-btn");
    const copyBtn   = qs("copy-btn");
    const downloadBtn = qs("download-btn");
    const themeToggle = qs("theme-toggle");

    // Восстановим последний ввод
    if (htmlInput) htmlInput.value = localStorage.getItem("html2md_last_html") || "";
    if (mdOutput)  mdOutput.value  = localStorage.getItem("html2md_last_md")  || "";

    on(convertBtn, "click", convert);
    on(clearBtn,   "click", clearAll);
    on(copyBtn,    "click", copyMD);
    on(downloadBtn,"click", downloadMD);

    document.querySelectorAll("[data-copy]").forEach(btn=>{
      on(btn, "click", () => copyBySelector(btn.getAttribute("data-copy")));
    });

    // Горячая клавиша
    document.addEventListener("keydown", (e)=>{
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter"){
        e.preventDefault(); convert();
      }
    });

    // Переключатель темы (опционально можно дописать)
    on(themeToggle, "click", () => {
      const k = "html2md_theme";
      const cur = localStorage.getItem(k) || "auto";
      const next = cur === "dark" ? "light" : cur === "light" ? "auto" : "dark";
      localStorage.setItem(k, next);
      console.log("[html2md] theme:", next);
    });
  });

  // Глобальный ловец ошибок JS
  window.addEventListener("error", (e)=> console.error("[html2md] error:", e.message));
})();
