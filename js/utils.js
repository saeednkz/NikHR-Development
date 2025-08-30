// این کد را در فایل جدید js/utils.js قرار دهید
// فایل: js/utils.js
// این تابع را به طور کامل جایگزین نسخه فعلی کنید

export const showToast = (message, type = 'success', duration = 5000) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}" class="ml-3"></i><span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons();

    // اگر زمان‌بندی مشخص شده بود (عدد غیر صفر)، تایمر حذف را تنظیم کن
    if (duration) {
        // انیمیشن کامل (ورود و خروج)
        toast.style.animation = `fadeInOut ${duration / 1000}s ease-in-out forwards`;
        setTimeout(() => {
            toast.remove();
        }, duration);
    } else {
        // اگر زمان‌بندی null بود، فقط انیمیشن ورود را اجرا کن و منتظر بمان
        toast.style.animation = 'fadeIn 0.5s ease forwards';
    }

    // المان اعلان را برمی‌گردانیم تا بتوانیم آن را دستی کنترل کنیم
    return toast;
};

// این انیمیشن جدید را هم به فایل index.html اضافه کنید
// برای این کار، در انتهای بخش <style>، @keyframes fadeInOut را پیدا کرده و این را زیر آن اضافه کنید:
/*
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
*/
