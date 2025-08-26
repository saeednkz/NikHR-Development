// فایل: js/auth.js

// ۱. وارد کردن (Import) توابع مورد نیاز از منابع خارجی
// توابع مربوط به لاگین و ثبت‌نام از کتابخانه فایربیس
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// تابع نمایش پیام که در فایل main.js قرار دارد
import { showToast } from './main.js';

// ۲. خروجی گرفتن (Export) توابع برای استفاده در فایل‌های دیگر

export const showLoginPage = () => {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('signup-container').classList.add('hidden');
    document.getElementById('dashboard-container').classList.add('hidden');
    document.getElementById('loading-overlay').style.display = 'none';
};

export const showSignupPage = () => {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('signup-container').classList.remove('hidden');
    document.getElementById('dashboard-container').classList.add('hidden');
};

export const showDashboard = () => {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('signup-container').classList.add('hidden');
    document.getElementById('dashboard-container').classList.remove('hidden');
    document.getElementById('dashboard-container').classList.add('md:flex');
};

// ۳. ایجاد یک تابع واحد برای راه‌اندازی تمام رویدادهای مربوط به احراز هویت
// این تابع آبجکت auth را از main.js به عنوان ورودی می‌گیرد
export function setupAuthEventListeners(auth) {
    // رویداد فرم لاگین
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            showToast("ایمیل یا رمز عبور اشتباه است.", "error");
            console.error("Login failed:", error);
        }
    });

    // رویداد فرم ثبت‌نام
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            showToast("خطا در ثبت نام. ممکن است این ایمیل قبلا استفاده شده باشد.", "error");
            console.error("Signup failed:", error);
        }
    });

    // رویداد دکمه خروج
    document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

    // رویداد لینک‌های جابجایی بین فرم لاگین و ثبت‌نام
    document.getElementById('show-signup').addEventListener('click', (e) => { e.preventDefault(); showSignupPage(); });
    document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); showLoginPage(); });
}
