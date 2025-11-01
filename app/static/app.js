const htmlInput = document.getElementById("html-input");
const mdOutput  = document.getElementById("md-output");
const statusEl  = document.getElementById("status");
const convertBtn = document.getElementById("convert-btn");
const clearBtn   = document.getElementById("clear-btn");
const copyBtn    = document.getElementById("copy-btn");
const downloadBtn= document.getElementById("download-btn");

function setStatus(msg) { statusEl.textContent = msg || ""; }

async function convert() {
  setStatus("Конвертируем…");
  convertBtn.disabled = true;
  try {
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
  } catch (e) {
    mdOutput.value = "";
    setStatus(`Ошибка: ${e.message}`);
  } finally {
    convertBtn.disabled = false;
  }
}

function clearAll() {
  htmlInput.value = "";
  mdOutput.value = "";
  setStatus("");
  localStorage.removeItem("html2md_last_html");
  localStorage.removeItem("html2md_last_md");
  htmlInput.focus();
}

async function copyMD() {
  try {
    await navigator.clipboard.writeText(mdOutput.value || "");
    setStatus("Скопировано 📋");
  } catch {
    setStatus("Не удалось скопировать");
  }
}

function downloadMD() {
  const blob = new Blob([mdOutput.value || ""], { type: "text/markdown;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "note.md";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setStatus("Скачано как note.md");
}

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault(); convert();
  }
});

convertBtn.addEventListener("click", convert);
clearBtn.addEventListener("click", clearAll);
copyBtn.addEventListener("click", copyMD);
downloadBtn.addEventListener("click", downloadMD);

// восстановим последний ввод
htmlInput.value = localStorage.getItem("html2md_last_html") || "";
mdOutput.value  = localStorage.getItem("html2md_last_md") || "";
