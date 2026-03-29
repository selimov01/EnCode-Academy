function toggleFaq(element) {
    const item = element.parentElement;
    const allItems = document.querySelectorAll('.faq-item');

    // Закрываем все остальные
    allItems.forEach(i => {
        if (i !== item) {
            i.classList.remove('open');
        }
    });

    // Переключаем текущий
    item.classList.toggle('open');
}