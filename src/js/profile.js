const AUTH_TOKEN_KEY = 'encodeAuthToken';
const API_BASE = '';
const savedCoursesKey = 'savedCourses';
const profilePhotoKey = 'profilePhoto';

const authPanel = document.getElementById('auth-panel');
const profilePanel = document.getElementById('profile-panel');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authError = document.getElementById('auth-error');
const interestOptions = document.querySelectorAll('.interest-option');
const interestsInput = document.getElementById('register-interests');
const profileName = document.getElementById('profile-name');
const profileUsername = document.getElementById('profile-username');
const profileEmail = document.getElementById('profile-email');
const profileTags = document.getElementById('profile-tags');
const profileAvatar = document.getElementById('profile-avatar');
const changePhotoButton = document.getElementById('change-photo-btn');
const profilePhotoInput = document.getElementById('profile-photo-input');
const courseCount = document.getElementById('course-count');
const coursesList = document.getElementById('courses-list');
const logoutButton = document.getElementById('logout-btn');
const profileHeroText = document.getElementById('profile-hero-text');

let selectedInterests = [];

const allCourses = [
    {
        id: 'backend',
        title: 'Backend-разработка',
        category: 'Backend',
        progress: 72,
        completed: 18,
        total: 25,
        next: 'Следующий модуль: Docker и инфраструктуру',
    },
    {
        id: 'datascience',
        title: 'Data Science',
        category: 'Data Science',
        progress: 46,
        completed: 11,
        total: 24,
        next: 'Следующий модуль: Введение в линейную регрессию',
    },
    {
        id: 'dsp',
        title: 'Цифровая обработка сигналов',
        category: 'Embeded',
        progress: 88,
        completed: 22,
        total: 25,
        next: 'Следующий модуль: FFT и спектральный анализ',
    },
];

function showError(message) {
    if (authError) {
        authError.textContent = message;
        authError.classList.remove('hidden');
    }
}

function clearError() {
    if (authError) {
        authError.textContent = '';
        authError.classList.add('hidden');
    }
}

function switchMode(mode) {
    clearError();

    const targetForm = document.getElementById(`${mode}-form`);
    if (!targetForm) return;

    document.querySelectorAll('.auth-form').forEach(panel => panel.classList.add('hidden'));
    document.querySelectorAll('[data-mode]').forEach(button => button.classList.remove('is-active'));

    targetForm.classList.remove('hidden');
    const targetButton = document.querySelector(`[data-mode="${mode}"]`);
    if (targetButton) {
        targetButton.classList.add('is-active');
    }
}

function updateInterestsInput() {
    if (!interestsInput) return;

    interestsInput.value = selectedInterests.join(', ');
    interestOptions.forEach(option => {
        const isActive = selectedInterests.includes(option.dataset.interest);
        option.classList.toggle('active', isActive);
        option.setAttribute('aria-pressed', String(isActive));
    });
}

function toggleInterestSelection(value) {
    if (!interestsInput) return;

    const index = selectedInterests.indexOf(value);
    if (index === -1) {
        selectedInterests.push(value);
    } else {
        selectedInterests.splice(index, 1);
    }
    updateInterestsInput();
}

function getSavedCourseIds() {
    const raw = localStorage.getItem(savedCoursesKey);
    try {
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function setSavedCourseIds(ids) {
    localStorage.setItem(savedCoursesKey, JSON.stringify(ids));
}

function renderSavedCourses() {
    if (!coursesList) return;

    const savedIds = getSavedCourseIds();
    const saved = allCourses.filter(course => savedIds.includes(course.id));

    if (courseCount) {
        courseCount.textContent = `${saved.length} в работе`;
    }

    if (!saved.length) {
        coursesList.innerHTML = `
            <div class="empty-saved-courses">
                <p>У вас ещё нет сохранённых курсов.</p>
                <p>Сохраните курс на главной странице, чтобы он появился здесь.</p>
                <a href="/#catalog" class="btn-primary empty-cta">Выбрать курс</a>
            </div>
        `;
        return;
    }

    coursesList.innerHTML = saved.map(course => `
        <article class="course-study-card saved">
            <div class="course-study-card__head">
                <div>
                    <strong>${course.title}</strong>
                    <p class="course-study-card__category">${course.category}</p>
                </div>
                <span class="course-study-card__value">${course.progress}%</span>
            </div>
            <div class="course-study-card__meta">
                <span>Пройдено ${course.completed} из ${course.total} модулей</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: ${course.progress}%"></div>
            </div>
            <div class="course-footer">
                <span>${course.next}</span>
                <a href="/backend-roadmap" class="card-link" style="display: ${course.id === 'backend' ? 'inline-flex' : 'none'};">Продолжить →</a>
            </div>
        </article>
    `).join('');
}

function applyProfilePhoto(photoData) {
    if (!profileAvatar) return;
    profileAvatar.style.backgroundImage = `url(${photoData})`;
    profileAvatar.classList.add('image');
    profileAvatar.textContent = '';
}

function applyProfileInitials(name) {
    if (!profileAvatar) return;
    const initials = name
        .split(' ')
        .filter(Boolean)
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    profileAvatar.style.backgroundImage = '';
    profileAvatar.classList.remove('image');
    profileAvatar.textContent = initials || 'AS';
}

function renderProfileTags(interests) {
    if (!profileTags) return;

    profileTags.innerHTML = '';
    const items = Array.isArray(interests)
        ? interests
        : String(interests).split(',').map(item => item.trim()).filter(Boolean);

    if (!items.length) {
        profileTags.innerHTML = '<span class="tag">Интересы не указаны</span>';
        return;
    }

    items.forEach(interest => {
        const chip = document.createElement('span');
        chip.className = 'tag';
        chip.textContent = interest;
        profileTags.appendChild(chip);
    });
}

function loadProfilePhoto() {
    const storedPhoto = localStorage.getItem(profilePhotoKey);
    if (storedPhoto) {
        applyProfilePhoto(storedPhoto);
    }
}

function showProfile(user) {
    if (authPanel) authPanel.classList.add('hidden');
    if (profilePanel) profilePanel.classList.remove('hidden');

    if (profileName) profileName.textContent = user.full_name;
    if (profileUsername) profileUsername.textContent = `@${user.username}`;
    if (profileEmail) profileEmail.textContent = user.email;
    if (profileHeroText) {
        profileHeroText.textContent = `Добро пожаловать, ${user.full_name}! Ниже вы можете посмотреть сохранённые курсы и интересы.`;
    }

    const interests = typeof user.interests === 'string'
        ? user.interests.split(',').map(interest => interest.trim()).filter(Boolean)
        : Array.isArray(user.interests)
            ? user.interests
            : [];

    renderProfileTags(interests);

    const storedPhoto = localStorage.getItem(profilePhotoKey);
    if (storedPhoto) {
        applyProfilePhoto(storedPhoto);
    } else {
        applyProfileInitials(user.full_name);
    }

    renderSavedCourses();
}

function showAuth() {
    if (authPanel) authPanel.classList.remove('hidden');
    if (profilePanel) profilePanel.classList.add('hidden');
    if (profileHeroText) {
        profileHeroText.textContent = 'Войдите в аккаунт или зарегистрируйтесь, чтобы увидеть ваши данные, интересы и прогресс по курсам.';
    }
}

function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    showAuth();
    switchMode('login');
}

function handlePhotoUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        localStorage.setItem(profilePhotoKey, reader.result);
        applyProfilePhoto(reader.result);
    };
    reader.readAsDataURL(file);
}

async function loadProfile() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
        showAuth();
        switchMode('login');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Token expired');
        }

        const data = await response.json();
        showProfile(data.user);
    } catch (error) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        showAuth();
        switchMode('login');
    }
}

async function submitLogin(event) {
    event.preventDefault();
    clearError();
    localStorage.removeItem(AUTH_TOKEN_KEY);
    showAuth();
    switchMode('login');

    const formData = new FormData(loginForm);
    const payload = {
        identifier: formData.get('identifier'),
        password: formData.get('password'),
    };

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'Не удалось войти');
        }
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        showProfile(data.user);
    } catch (error) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        showAuth();
        switchMode('login');
        showError(error.message);
    }
}

async function submitRegister(event) {
    event.preventDefault();
    clearError();
    localStorage.removeItem(AUTH_TOKEN_KEY);
    const formData = new FormData(registerForm);
    const payload = {
        full_name: formData.get('full_name'),
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirm_password: formData.get('confirm_password'),
        interests: formData.get('interests'),
    };

    try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'Не удалось зарегистрироваться');
        }
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        showProfile(data.user);
    } catch (error) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        showError(error.message);
    }
}

// Set up event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Auth mode buttons
    const authModeButtons = document.querySelectorAll('[data-mode]');
    authModeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const mode = button.getAttribute('data-mode');
            if (mode) {
                switchMode(mode);
            }
        });
    });

    // Interest options
    const interestOpts = document.querySelectorAll('.interest-option');
    interestOpts.forEach(option => {
        option.addEventListener('click', () => toggleInterestSelection(option.dataset.interest));
    });

    // Photo button
    const changePhotoBtn = document.getElementById('change-photo-btn');
    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', () => {
            const photoInput = document.getElementById('profile-photo-input');
            if (photoInput) {
                photoInput.click();
            }
        });
    }

    // Photo input
    const photoInput = document.getElementById('profile-photo-input');
    if (photoInput) {
        photoInput.addEventListener('change', (event) => {
            const file = event.target.files && event.target.files[0];
            handlePhotoUpload(file);
        });
    }

    // Forms
    const loginFrm = document.getElementById('login-form');
    const registerFrm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginFrm) loginFrm.addEventListener('submit', submitLogin);
    if (registerFrm) registerFrm.addEventListener('submit', submitRegister);
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Initialize interests
    const regInterests = document.getElementById('register-interests');
    if (regInterests) {
        selectedInterests = [];
        updateInterestsInput();
    }

    // Load initial profile state
    loadProfilePhoto();
    loadProfile();
});
