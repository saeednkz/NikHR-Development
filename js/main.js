<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>سیستم مدیریت منابع انسانی NikHR</title>
    <link rel="icon" href="logo.png" type="image/png">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#4f46e5"/>

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jalaali-js/dist/jalaali.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://unpkg.com/persian-date@1.1.0/dist/persian-date.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/persian-datepicker@1.2.0/dist/css/persian-datepicker.min.css">
    <script src="https://cdn.jsdelivr.net/npm/persian-datepicker@1.2.0/dist/js/persian-datepicker.min.js"></script>
    
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css">
    
<style>
    body {
        font-family: 'Vazirmatn', sans-serif;
        background-color: #f8fafc; /* Slate 50 */
        color: #334155; /* Slate 700 */
    }

    /* --- استایل‌های عمومی --- */
    .card {
        background-color: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        border: 1px solid #e2e8f0;
    }
    .card-header {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e2e8f0;
    }
    .card-content {
        padding: 1.5rem;
    }
    .page-header { margin-bottom: 2rem; }
    .primary-btn {
        background-color: #4f46e5; color: white; padding: 10px 20px;
        border-radius: 8px; font-weight: 500; transition: background-color 0.2s;
    }
    .primary-btn:hover { background-color: #4338ca; }
    .secondary-btn {
        background-color: #eef2ff; color: #4338ca; padding: 10px 20px;
        border-radius: 8px; font-weight: 600; transition: background-color 0.2s;
    }
    .secondary-btn:hover { background-color: #e0e7ff; }

    /* --- استایل‌های جدید برای پورتال کارمندان (تم تیره اسلیت + آبی فیروزه‌ای) --- */
    .employee-sidebar {
        background-color: #0f172a; /* Slate 900 */
        color: #cbd5e1; /* Slate 300 */
        display: flex;
        flex-direction: column;
        padding: 1.5rem;
    }
    .employee-sidebar .profile-pic {
        width: 120px; height: 120px;
        border-radius: 50%;
        border: 4px solid rgba(255,255,255,0.2);
        box-shadow: 0 0 0 8px rgba(255,255,255,0.06);
        margin: 1rem auto 1.5rem auto;
    }
    .employee-sidebar .employee-name {
        font-size: 1.5rem;
        font-weight: 700;
        color: #e2e8f0; /* Slate 200 */
    }
    .employee-sidebar .employee-title {
        color: #94a3b8; /* Slate 400 */
        font-weight: 500;
    }
    .employee-sidebar .nav-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 12px 16px;
        border-radius: 10px;
        color: #94a3b8; /* Slate 400 */
        transition: all 0.2s ease;
        font-weight: 500;
    }
    .employee-sidebar .nav-item:hover {
        background-color: rgba(148,163,184,0.12);
        color: #e2e8f0; /* Slate 200 */
    }
    .employee-sidebar .nav-item.active {
        background-color: rgba(34,211,238,0.14); /* Cyan tint */
        color: #22d3ee; /* Cyan 400 */
        font-weight: 700;
    }
    .employee-sidebar .nav-item i {
        color: #94a3b8;
    }
    .employee-sidebar .nav-item.active i {
        color: #22d3ee;
    }
    .employee-sidebar .logout-btn {
        color: #94a3b8;
    }
    .employee-sidebar .logout-btn:hover {
        background-color: rgba(148,163,184,0.12);
        color: #e2e8f0;
    }

    /* --- استایل‌های پنل ادمین (سایدبار) --- */
    .sidebar {
        background-color: #ffffff;
        border-left: 1px solid #e2e8f0; /* slate-200 */
    }
    .sidebar-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        color: #475569; /* slate-600 */
        transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        border: 1px solid transparent;
    }
    .sidebar-item:hover {
        background-color: #f1f5f9; /* slate-100 */
        color: #0f172a; /* slate-900 */
    }
    .sidebar-item.active {
        background-color: #eef2ff; /* indigo-50 */
        color: #4338ca; /* indigo-700 */
        border-color: #c7d2fe; /* indigo-200 */
        font-weight: 600;
    }
    .sidebar-item i {
        width: 1.25rem;
        height: 1.25rem;
    }

    /* سایر استایل‌ها */
    #loading-overlay { position: fixed; inset: 0; background-color: rgba(248, 250, 252, 0.8); display: flex; align-items: center; justify-content: center; z-index: 9999; }
    .spinner { width: 56px; height: 56px; border: 6px solid #e0e7ff; border-top: 6px solid #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
</head>
<body class="bg-slate-100">

    <div id="login-container" class="hidden min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
            <div class="text-center">
                <img src="logo.png" alt="NikHR Logo" class="mx-auto w-16 h-16">
                <h2 class="mt-4 text-2xl font-bold text-slate-800">ورود به سیستم NikHR</h2>
            </div>
            <form id="login-form" class="space-y-6">
                <div>
                    <label for="email" class="text-sm font-medium text-slate-700">آدرس ایمیل</label>
                    <input id="email" type="email" autocomplete="email" required class="w-full px-3 py-2 mt-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                </div>
                <div>
                    <label for="password" class="text-sm font-medium text-slate-700">رمز عبور</label>
                    <input id="password" type="password" autocomplete="current-password" required class="w-full px-3 py-2 mt-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                </div>
                <button type="submit" class="w-full primary-btn py-2.5">ورود</button>
            </form>

        </div>
    </div>
    
    <div id="signup-container" class="hidden min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
            <div class="text-center">
                <i data-lucide="user-plus" class="mx-auto w-12 h-12 text-indigo-500"></i>
                <h2 class="mt-4 text-2xl font-bold text-slate-800">ایجاد حساب کاربری</h2>
            </div>
            <form id="signup-form" class="space-y-6">
                <div>
                    <label for="signup-email" class="text-sm font-medium text-slate-700">آدرس ایمیل</label>
                    <input id="signup-email" type="email" required class="w-full px-3 py-2 mt-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                </div>
                <div>
                    <label for="signup-password" class="text-sm font-medium text-slate-700">رمز عبور</label>
                    <input id="signup-password" type="password" required class="w-full px-3 py-2 mt-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                </div>
                <button type="submit" class="w-full primary-btn py-2.5">ثبت نام</button>
            </form>
            <p class="text-sm text-center text-slate-600">قبلا ثبت نام کرده‌اید؟ <a href="#" id="show-login" class="font-medium text-indigo-600 hover:underline">وارد شوید</a></p>
        </div>
    </div>

    <div id="dashboard-container" class="hidden h-screen">
        <aside id="sidebar" class="sidebar w-64 space-y-6 py-7 px-2 fixed inset-y-0 right-0 transform translate-x-full md:relative md:translate-x-0 z-30 flex flex-col">
            <div>
                <a href="#dashboard" class="sidebar-logo text-2xl font-bold px-4 flex items-center gap-3">
                    <img src="logo.png" alt="NikHR Logo" class="w-8 h-8">
                    <span>NikHR</span>
                </a>
                <nav id="sidebar-nav" class="mt-10">
                    <a href="#dashboard" class="sidebar-item"><i data-lucide="layout-dashboard"></i><span>داشبورد</span></a>
                    <a href="#talent" class="sidebar-item"><i data-lucide="users"></i><span>استعدادها</span></a>
                    <a href="#organization" class="sidebar-item"><i data-lucide="building-2"></i><span>سازمان</span></a>
                    <a href="#surveys" class="sidebar-item"><i data-lucide="clipboard-list"></i><span>نظرسنجی‌ها</span></a>
                    <a href="#requests" class="sidebar-item"><i data-lucide="archive"></i><span>درخواست‌ها</span></a>
                    <a href="#tasks" class="sidebar-item"><i data-lucide="clipboard-check"></i><span>وظایف من</span></a>
                    <a href="#analytics" class="sidebar-item"><i data-lucide="bar-chart-3"></i><span>تحلیل هوشمند</span></a>
                    <a href="#documents" class="sidebar-item"><i data-lucide="folder-kanban"></i><span>اسناد سازمان</span></a>
                    <a href="#announcements" class="sidebar-item"><i data-lucide="megaphone"></i><span>اعلانات</span></a>
                    <a href="#settings" id="settings-nav-link" class="sidebar-item"><i data-lucide="settings"></i><span>تنظیمات</span></a>
                </nav>
            </div>
            <div class="mt-auto">
                <a href="#" id="logout-btn" class="sidebar-item !text-red-500 hover:!bg-red-50 hover:!border-red-500"><i data-lucide="log-out"></i><span>خروج</span></a>
            </div>
        </aside>
        
        <div class="flex-1 flex flex-col h-screen overflow-y-hidden">
            <header class="flex justify-between items-center p-4 bg-white border-b border-slate-200 shadow-sm z-10">
                <button id="menu-btn" class="text-slate-600 z-40 md:hidden"><i data-lucide="menu" class="w-6 h-6"></i></button>
                <div class="flex-grow"></div>
<div class="flex items-center gap-4">
    <span id="user-email" class="text-sm text-slate-600 hidden sm:block"></span>
    
    <div id="notification-bell-wrapper" class="relative">
        <button id="notification-bell-btn" class="relative cursor-pointer p-2 rounded-full hover:bg-slate-100">
            <i data-lucide="bell" class="text-slate-600"></i>
            <span id="notification-count" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"></span>
        </button>
        <div id="notification-dropdown" class="hidden absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-20">
            <div class="p-3 border-b font-semibold">اعلانات</div>
            <div id="notification-list" class="max-h-96 overflow-y-auto">
                </div>
        </div>
    </div>
</div>
            </header>
            <main id="main-content" class="flex-1 p-6 sm:p-10 overflow-y-auto"></main>
        </div>
    </div>

    <div id="employee-portal-container" class="hidden"></div>
    <div id="survey-taker-container" class="hidden"></div>
    <div id="loading-overlay"><div class="spinner"></div></div>
    <div id="sidebar-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-20 hidden md:hidden"></div>

    <div id="mainModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-40 p-4">
        <div class="bg-white rounded-lg shadow-xl w-full md:w-3/4 lg:w-4/5 max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0">
            <div class="flex justify-between items-center p-4 border-b border-slate-200">
                <h3 id="modalTitle" class="text-xl font-semibold text-slate-800"></h3>
                <button id="closeModal" class="text-slate-500 hover:text-slate-800"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>
            <div id="modalContent" class="p-6 overflow-y-auto"></div>
        </div>
    </div>

    <div id="confirmModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-sm p-6 transform transition-all duration-300 scale-95 opacity-0">
            <h3 id="confirmTitle" class="text-lg font-bold text-slate-800 mb-4">آیا مطمئن هستید؟</h3>
            <p id="confirmMessage" class="text-slate-600 mb-6"></p>
            <div class="flex justify-end gap-4">
                <button id="confirmCancel" class="bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300">انصراف</button>
                <button id="confirmAccept" class="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700">تایید</button>
            </div>
        </div>
    </div>

    <div id="toast-container"></div>
    <input type="file" id="image-upload-input" class="hidden" accept="image/*">

    <script type="module" src="js/auth.js"></script>
    <script type="module" src="js/main.js"></script>
</body>
</html>
