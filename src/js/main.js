lucide.createIcons();

function handleCourseAction(courseId, button) {
    const currentSaved = getSavedCourseIds();
    if (!currentSaved.includes(courseId)) {
        const nextSaved = [...currentSaved, courseId];
        setSavedCourseIds(nextSaved);
        updateActionButton(button, true);
    }
}

function initCourseActionButtons() {
    const actionButtons = document.querySelectorAll('.course-action-btn');
    const savedCourses = getSavedCourseIds();

    actionButtons.forEach(button => {
        const courseId = button.dataset.courseId;
        const isSaved = savedCourses.includes(courseId);
        updateActionButton(button, isSaved);

        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            handleCourseAction(courseId, button);
        });
    });
}

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

        if (hrefPage === currentPage || (hrefPage === "index.html" && currentPage === "")) {
            link.classList.add('text-gray-500', 'cursor-default');
            link.removeAttribute('href');
        }
    });

    initCourseActionButtons();
});

if (document.readyState !== 'loading') {
    initCourseActionButtons();
}

function getSavedCourseIds() {
    const raw = localStorage.getItem('savedCourses');
    try {
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function setSavedCourseIds(courseIds) {
    localStorage.setItem('savedCourses', JSON.stringify(courseIds));
}

function updateSaveButton(button, saved) {
    if (!button) return;
    button.classList.toggle('saved', saved);
    button.textContent = saved ? 'Сохранено' : 'Сохранить';
}

function updateActionButton(button, studying) {
    if (!button) return;
    button.classList.toggle('studying', studying);
    button.textContent = studying ? 'Изучается' : 'Изучить путь';
    button.disabled = studying;
}

window.handleCourseAction = handleCourseAction;
