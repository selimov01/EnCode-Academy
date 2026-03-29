// Инициализация иконок
lucide.createIcons();

// Copy-to-clipboard
function copyText(id, button) {
    const text = document.getElementById(id).innerText;
    navigator.clipboard.writeText(text);

    // UI feedback
    button.innerText = "copied";
    setTimeout(() => {
        button.innerText = "copy";
    }, 1000);
}