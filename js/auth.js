// فایل: auth.js
// ▼▼▼ کل محتوای این فایل را با کد زیر جایگزین کنید ▼▼▼

import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { state, router } from './main.js';
import { showToast } from './utils.js';

export let auth;
export { signOut };

export const initAuth = (app) => {
    auth = getAuth(app);
    return auth;
};

export const isAdmin = () => state.currentUser?.role === 'admin';
export const canEdit = () => state.currentUser?.role === 'admin' || state.currentUser?.role === 'editor';

// تابع جدید برای بررسی اینکه آیا کارمند مدیر یا سرپرست تیمی است یا خیر
export const isTeamManager = (employee) => {
    if (!employee) return false;
    return state.teams.some(team => 
        team.leadership?.manager === employee.id || 
        team.leadership?.supervisor === employee.id
    );
};

export const showLoginPage = () => {
    document.getElementById('dashboard-container').classList.add('hidden');
    document.getElementById('employee-portal-container').classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('loading-overlay').style.display = 'none';
};

export const showDashboard = (user, state) => {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('employee-portal-container').classList.add('hidden');
    const dashboardContainer = document.getElementById('dashboard-container');
    
    if (dashboardContainer) {
        dashboardContainer.classList.remove('hidden');
        dashboardContainer.classList.add('md:flex');
        
        document.getElementById('user-email').textContent = user.email;

        // نمایش لینک "تنظیمات" فقط برای ادمین
        const settingsLink = document.getElementById('settings-nav-link');
        if (settingsLink) {
            settingsLink.style.display = isAdmin() ? 'flex' : 'none';
        }
        
        // ▼▼▼ بخش جدید: نمایش لینک "مدیریت ارزیابی" فقط برای ادمین ▼▼▼
        const evaluationLink = document.getElementById('evaluation-nav-link');
        if (evaluationLink) {
            evaluationLink.style.display = isAdmin() ? 'flex' : 'none';
        }

        // ▼▼▼ بخش اصلاح شده: نمایش لینک "مدیریت تیم" برای مدیران و سرپرستان ▼▼▼
        const currentUserProfile = state.employees.find(e => e.uid === user.uid);
        const teamPerformanceNav = document.getElementById('team-performance-nav');
        if (teamPerformanceNav) {
            if (isTeamManager(currentUserProfile)) {
                teamPerformanceNav.classList.remove('hidden');
            } else {
                teamPerformanceNav.classList.add('hidden');
            }
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
