// فایل: js/auth.js
// کل محتوای این فایل را با کد زیر جایگزین کنید

import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { state, showToast } from './main.js'; // state را از main.js وارد می‌کنیم

// توابع کمکی نقش‌ها به اینجا منتقل شدند
export const isAdmin = () => state.currentUser?.role === 'admin';
export const canEdit = () => state.currentUser?.role === 'admin' || state.currentUser?.role === 'editor';

// تابع جدید برای نمایش صفحه لاگین
export const showLoginPage = () => {
    const dashboardContainer = document.getElementById('dashboard-container');
    const employeePortalContainer = document.getElementById('employee-portal-container');
    if (dashboardContainer) dashboardContainer.innerHTML = '';
    if (employeePortalContainer) employeePortalContainer.innerHTML = '';

    dashboardContainer?.classList.add('hidden');
    employeePortalContainer?.classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('signup-container').classList.add('hidden');
    document.getElementById('loading-overlay').style.display = 'none';
};

// تابع جدید برای نمایش داشبورد ادمین
// در فایل js/auth.js
// کل این تابع را با نسخه جدید جایگزین کنید

export const showDashboard = () => {
    document.getElementById('login-container').classList.add('hidden');
    const dashboardContainer = document.getElementById('dashboard-container');
    if (dashboardContainer) {
        dashboardContainer.classList.remove('hidden');
        dashboardContainer.classList.add('md:flex');
        
        // این خط به اینجا منتقل شده تا در زمان درست اجرا شود
        const settingsLink = document.getElementById('settings-nav-link');
        if (settingsLink) {
            settingsLink.style.display = isAdmin() ? 'flex' : 'none';
        }
    }
};

export const setupAuthEventListeners = (auth) => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    const logoutBtn = document.getElementById('logout-btn');

    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showToast('با موفقیت وارد شدید.');
        } catch (error) {
            showToast(`خطا در ورود: ${error.message}`, 'error');
        }
    });

    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = signupForm['signup-email'].value;
        const password = signupForm['signup-password'].value;
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            showToast('ثبت‌نام با موفقیت انجام شد. لطفاً وارد شوید.');
            showLoginPage();
        } catch (error) {
            showToast(`خطا در ثبت‌نام: ${error.message}`, 'error');
        }
    });

    showSignup?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('signup-container').classList.remove('hidden');
    });

    showLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signup-container').classList.add('hidden');
        document.getElementById('login-container').classList.remove('hidden');
    });

    logoutBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).catch(error => showToast(`خطا در خروج: ${error.message}`, 'error'));
    });
};
