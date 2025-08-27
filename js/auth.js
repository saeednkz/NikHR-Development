// فایل: js/auth.js
// کل محتوای این فایل را با کد زیر جایگزین کنید

import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { state, showToast, router } from './main.js'; // state و router را از main.js وارد می‌کنیم

// توابع کمکی نقش‌ها در اینجا تعریف و export می‌شوند
export const isAdmin = () => state.currentUser?.role === 'admin';
export const canEdit = () => state.currentUser?.role === 'admin' || state.currentUser?.role === 'editor';

// تابع نمایش صفحه لاگین
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

// تابع نمایش داشبورد ادمین
export const showDashboard = () => {
    document.getElementById('login-container').classList.add('hidden');
    const dashboardContainer = document.getElementById('dashboard-container');
    if (dashboardContainer) {
        dashboardContainer.classList.remove('hidden');
        dashboardContainer.classList.add('md:flex');
        
        const settingsLink = document.getElementById('settings-nav-link');
        if (settingsLink) {
            settingsLink.style.display = isAdmin() ? 'flex' : 'none';
        }
    }
    // بعد از نمایش ساختار، محتوای صفحه پیش‌فرض را بارگذاری می‌کنیم
    router();
};

// تابع مدیریت تمام رویدادهای مربوط به احراز هویت
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
        const loginButton = loginForm.querySelector('button[type="submit"]');
        loginButton.disabled = true;
        loginButton.innerText = 'در حال ورود...';

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showToast('با موفقیت وارد شدید.');
            // بعد از لاگین موفق، صفحه به صورت خودکار رفرش می‌شود و دیگر نیازی به کد اضافه نیست
        } catch (error) {
            showToast(`خطا در ورود: ${error.message}`, 'error');
            loginButton.disabled = false;
            loginButton.innerText = 'ورود';
        }
    });

    // منطق فرم ثبت‌نام (که در کد قبلی من جا افتاده بود)
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

    // منطق دکمه "ثبت نام کنید"
    showSignup?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('signup-container').classList.remove('hidden');
    });

    // منطق دکمه "وارد شوید"
    showLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signup-container').classList.add('hidden');
        document.getElementById('login-container').classList.remove('hidden');
    });

    // منطق دکمه خروج
    logoutBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).catch(error => showToast(`خطا در خروج: ${error.message}`, 'error'));
    });
};
