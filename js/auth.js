// فایل: js/auth.js
// کل محتوای این فایل را با کد زیر جایگزین کنید

import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { state, showToast } from './main.js'; // state را از main.js وارد می‌کنیم

// توابع کمکی نقش‌ها را به اینجا منتقل کرده و export می‌کنیم
export const isAdmin = () => state.currentUser?.role === 'admin';
export const canEdit = () => state.currentUser?.role === 'admin' || state.currentUser?.role === 'editor';

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

export const showDashboard = () => {
    document.getElementById('login-container').classList.add('hidden');
    const dashboardContainer = document.getElementById('dashboard-container');
    if (dashboardContainer) {
        dashboardContainer.classList.remove('hidden');
        dashboardContainer.classList.add('md:flex');
        
        // [!code focus:3]
        // کد مشکل‌ساز به اینجا منتقل شد تا در زمان درست اجرا شود
        const settingsLink = document.getElementById('settings-nav-link');
        if (settingsLink) {
            settingsLink.style.display = isAdmin() ? 'flex' : 'none';
        }
    }
};

export const setupAuthEventListeners = (auth) => {
    // ... محتوای این تابع بدون تغییر باقی می‌ماند ...
};
