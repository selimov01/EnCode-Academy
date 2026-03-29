lucide.createIcons();

function copyText(id, button) {
    const text = document.getElementById(id).innerText;
    navigator.clipboard.writeText(text);
    button.innerText = "copied";
    setTimeout(() => {
        button.innerText = "copy";
    }, 1000);
}

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

// --- VALIDATION ---
lucide.createIcons();

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const button = form.querySelector('button');

    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const subject = document.getElementById('subject');
    const message = document.getElementById('message');
    const consent = document.getElementById('consent');

    const consentBox = document.getElementById('consent-box');
    const consentError = document.getElementById('consent-error');

    // --- SUBMIT ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        clearErrors();

        let isValid = true;

        // --- NAME ---
        const nameRegex = /^[A-Za-zА-Яа-яЁё\s]+$/;
        if (name.value.trim().length < 2 || !nameRegex.test(name.value)) {
            showError(name, "Только буквы, минимум 2 символа");
            isValid = false;
        } else {
            showSuccess(name);
        }

        // --- EMAIL ---
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value.trim())) {
            showError(email, "Некорректный email");
            isValid = false;
        } else {
            showSuccess(email);
        }

        // --- SUBJECT ---
        if (subject.value.trim() === "") {
            showError(subject, "Введите тему");
            isValid = false;
        } else {
            showSuccess(subject);
        }

        // --- MESSAGE ---
        if (message.value.trim().length < 10) {
            showError(message, "Минимум 10 символов");
            isValid = false;
        } else {
            showSuccess(message);
        }

        // --- CHECKBOX ---
        if (!consent.checked) {
            consentError.classList.remove('hidden');
            consentBox.classList.add('border-red-500', 'input-error');
            isValid = false;
        } else {
            consentError.classList.add('hidden');
            consentBox.classList.remove('border-red-500', 'input-error');
        }

        if (!isValid) return;

        button.innerText = "Отправка...";
        button.disabled = true;

        setTimeout(() => {
            showGlobalSuccess();
            form.reset();
            button.innerText = "Отправить";
            button.disabled = false;
            clearErrors();
        }, 1200);
    });

    // --- LIVE VALIDATION ---
    name.addEventListener('input', () => validateName());
    email.addEventListener('input', () => validateEmail());
    subject.addEventListener('input', () => validateSubject());
    message.addEventListener('input', () => validateMessage());

    consent.addEventListener('change', () => {
        if (consent.checked) {
            consentError.classList.add('hidden');
            consentBox.classList.remove('border-red-500', 'input-error');
        }
    });

    // --- VALIDATION ---

    function validateName() {
        const regex = /^[A-Za-zА-Яа-яЁё\s]+$/;
        if (name.value.trim().length >= 2 && regex.test(name.value)) {
            clearFieldError(name);
            showSuccess(name);
        }
    }

    function validateEmail() {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (regex.test(email.value.trim())) {
            clearFieldError(email);
            showSuccess(email);
        }
    }

    function validateSubject() {
        if (subject.value.trim() !== "") {
            clearFieldError(subject);
            showSuccess(subject);
        }
    }

    function validateMessage() {
        if (message.value.trim().length >= 10) {
            clearFieldError(message);
            showSuccess(message);
        }
    }

    // --- UI ---

    function showError(input, message) {
        input.classList.add('border-red-500', 'input-error');

        let error = input.parentElement.querySelector('.error-text');
        if (!error) {
            error = document.createElement('p');
            error.className = "error-text text-red-500 text-xs mt-1 font-mono";
            input.parentElement.appendChild(error);
        }

        error.innerText = message;
    }

    function showSuccess(input) {
        input.classList.add('border-it-cyan', 'shadow-[0_0_8px_#00F0FF]');
    }

    function clearErrors() {
        document.querySelectorAll('.error-text').forEach(el => el.remove());

        [name, email, subject, message].forEach(input => {
            input.classList.remove(
                'border-red-500',
                'border-it-cyan',
                'input-error',
                'shadow-[0_0_8px_#00F0FF]'
            );
        });

        consentError.classList.add('hidden');
        consentBox.classList.remove('border-red-500', 'input-error');
    }

    function clearFieldError(input) {
        input.classList.remove('border-red-500', 'input-error');

        const error = input.parentElement.querySelector('.error-text');
        if (error) error.remove();
    }

    function showGlobalSuccess() {
        const success = document.createElement('div');
        success.innerText = "Сообщение отправлено 🚀";
        success.className = "text-it-cyan font-mono text-sm mt-4";

        form.appendChild(success);

        setTimeout(() => success.remove(), 3000);
    }
});