import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { state, router } from './main.js';
import { showToast } from './utils.js';

// متغیر auth در این فایل ساخته و export می‌شود
export let auth;

// این تابع signOut را نیز export می‌کنیم تا main.js از آن استفاده کند
export { signOut };

export const initAuth = (app) => {
    auth = getAuth(app);
    return auth;
};

export const isAdmin = () => state.currentUser?.role === 'admin';
export const canEdit = () => state.currentUser?.role === 'admin' || state.currentUser?.role === 'editor';

export const showLoginPage = () => {
    document.getElementById('dashboard-container').classList.add('hidden');
    document.getElementById('employee-portal-container').classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('loading-overlay').style.display = 'none';
};

export const showDashboard = () => {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('employee-portal-container').classList.add('hidden');
    const dashboardContainer = document.getElementById('dashboard-container');
    if (dashboardContainer) {
        dashboardContainer.classList.remove('hidden');
        dashboardContainer.classList.add('md:flex');
        const settingsLink = document.getElementById('settings-nav-link');
        if (settingsLink) {
            settingsLink.style.display = isAdmin() ? 'flex' : 'none';
        }
    }
    router();
};

export const setupAuthEventListeners = (authInstance) => {
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');

    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        const loginButton = loginForm.querySelector('button[type="submit"]');
        loginButton.disabled = true;
        loginButton.innerText = 'در حال ورود...';
        try {
            await signInWithEmailAndPassword(authInstance, email, password);
        } catch (error) {
            showToast(`خطا در ورود: ${error.message}`, 'error');
            loginButton.disabled = false;
            loginButton.innerText = 'ورود';
        }
    });

    logoutBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(authInstance).catch(error => showToast(`خطا در خروج: ${error.message}`, 'error'));
    });
};
