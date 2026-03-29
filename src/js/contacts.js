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

//header
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split("/").pop();

    document.querySelectorAll('.nav-link').forEach(link => {
        const hrefPage = link.getAttribute('href');

        if (hrefPage === currentPage || (hrefPage === "contacts.html" && currentPage === "")) {
            link.classList.add('text-gray-500', 'cursor-default');
            link.removeAttribute('href');
        }
    });
});