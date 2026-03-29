function toggleFaq(element) {
    const item = element.parentElement;
    const allItems = document.querySelectorAll('.faq-item');
    allItems.forEach(i => {
        if (i !== item) {
            i.classList.remove('open');
        }
    });

    item.classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split("/").pop();

    document.querySelectorAll('.nav-link').forEach(link => {
        const hrefPage = link.getAttribute('href');

        if (hrefPage === currentPage || (hrefPage === "faq.html" && currentPage === "")) {
            link.classList.add('text-gray-500', 'cursor-default');
            link.removeAttribute('href');
        }
    });
});