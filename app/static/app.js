const htmlInput   = document.getElementById("html-input");
const mdOutput    = document.getElementById("md-output");
const statusEl    = document.getElementById("status");
const convertBtn  = document.getElementById("convert-btn");
const clearBtn    = document.getElementById("clear-btn");
const copyBtn     = document.getElementById("copy-btn");
const downloadBtn = document.getElementById("download-btn");
const themeToggle = document.getElementById("theme-toggle");

// ===== Theme =====
const THEME_KEY = "html2md_theme";
function applyTheme(v){
  if (!v || v === "auto"){ document.documentElement.setAttribute("data-theme",""); return; }
  document.documentElement.setAttribute("data-theme", v);
  if (v === "dark"){
    document.documentElement.style.setProperty("--bg", "#0f0f10");
    document.documentElement.style.setProperty("--fg", "#e9e9ea");
  }
}
function toggleTheme(){
  const current = localStorage.getItem(THEME_KEY) || "auto";
  const next = current === "dark" ? "light" : current === "light" ? "auto" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  themeToggle.textContent = next === "dark" ? "Тема: тёмная" : next === "light" ? "Тема: светлая" : "Тема: авто";
}
applyTheme(localStorage.getItem(THEME_KEY) || "auto");
themeToggle.textContent = (localStorage.getItem(THEME_KEY) || "auto") === "dark" ? "Тема: тёмная" :
  (localStorage.getItem(THEME_KEY) || "auto") === "light" ? "Тема: светлая" : "Тема: авто";
themeToggle.addEventListener("click", toggleTheme);

// ===== Convert =====
function setStatus(msg){ statusEl.textContent = msg || ""; }

async function convert(){
  setStatus("Конвертируем…");
  convertBtn.disabled = true;
  try{
    const res = await fetch("/api/convert", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ html: htmlInput.value || "" })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Ошибка конвертации");
    mdOutput.value = data.markdown || "";
    localStorage.setItem("html2md_last_html", htmlInput.value || "");
    localStorage.setItem("html2md_last_md", mdOutput.value || "");
    setStatus("Готово ✅");
  }catch(e){
    mdOutput.value = "";
    setStatus(`Ошибка: ${e.message}`);
  }finally{
    convertBtn.disabled = false;
  }
}

function clearAll(){
  htmlInput.value = "";
  mdOutput.value = "";
  setStatus("");
  localStorage.removeItem("html2md_last_html");
  localStorage.removeItem("html2md_last_md");
  htmlInput.focus();
}

async function copyMD(){
  try{
    await navigator.clipboard.writeText(mdOutput.value || "");
    setStatus("Скопировано 📋");
  }catch{
    setStatus("Не удалось скопировать");
  }
}

function downloadMD(){
  const blob = new Blob([mdOutput.value || ""], { type:"text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "note.md";
  document.body.appendChild(a);
  a.click(); a.remove();
  setStatus("Скачано как note.md");
}

// Copy helpers for snippets
function copyBySelector(sel){
  const el = document.querySelector(sel);
  if (!el) return;
  const text = el.tagName === "PRE" || el.tagName === "TEXTAREA" ? el.textContent : el.innerText;
  navigator.clipboard.writeText(text).then(()=> setStatus("Скопировано 📋")).catch(()=> setStatus("Не удалось скопировать"));
}
document.querySelectorAll("[data-copy]").forEach(btn=>{
  btn.addEventListener("click", ()=> copyBySelector(btn.getAttribute("data-copy")));
});

// Hotkeys
document.addEventListener("keydown", (e)=>{
  if ((e.ctrlKey||e.metaKey) && e.key === "Enter"){ e.preventDefault(); convert(); }
});

convertBtn.addEventListener("click", convert);
clearBtn.addEventListener("click", clearAll);
copyBtn.addEventListener("click", copyMD);
downloadBtn.addEventListener("click", downloadMD);

// Restore last
htmlInput.value = localStorage.getItem("html2md_last_html") || "";
mdOutput.value  = localStorage.getItem("html2md_last_md") || "";
