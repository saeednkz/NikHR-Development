        const showLoginPage = () => {
            document.getElementById('login-container').classList.remove('hidden');
            document.getElementById('signup-container').classList.add('hidden');
            document.getElementById('dashboard-container').classList.add('hidden');
            document.getElementById('loading-overlay').style.display = 'none';
        };
        const showSignupPage = () => {
            document.getElementById('login-container').classList.add('hidden');
            document.getElementById('signup-container').classList.remove('hidden');
            document.getElementById('dashboard-container').classList.add('hidden');
        };
        const showDashboard = () => {
            document.getElementById('login-container').classList.add('hidden');
            document.getElementById('signup-container').classList.add('hidden');
            document.getElementById('dashboard-container').classList.remove('hidden');
            document.getElementById('dashboard-container').classList.add('flex');
        };
        const setupEventListeners = () => {
            // Auth Listeners
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

            document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));
            document.getElementById('show-signup').addEventListener('click', (e) => { e.preventDefault(); showSignupPage(); });
            document.getElementById('show-login').addEventListener('click', (e) => { e.preventDefault(); showLoginPage(); });


            // General App Listeners
            document.getElementById('closeModal').addEventListener('click', () => closeModal(mainModal, mainModalContainer));
            mainModal.addEventListener('click', (e) => { if (e.target === mainModal) closeModal(mainModal, mainModalContainer); });
            
            // Mobile Menu
            const menuBtn = document.getElementById('menu-btn'); const sidebar = document.getElementById('sidebar'); const overlay = document.getElementById('sidebar-overlay'); const toggleMenu = () => { sidebar.classList.toggle('translate-x-full'); overlay.classList.toggle('hidden'); };
            menuBtn.addEventListener('click', toggleMenu);
            overlay.addEventListener('click', toggleMenu);
            
            // Navigation
            const handleNavClick = (e) => { const link = e.target.closest('a'); if (link && (link.classList.contains('sidebar-item') || link.classList.contains('sidebar-logo'))) { e.preventDefault(); const pageName = link.getAttribute('href').substring(1); navigateTo(pageName); if (window.innerWidth < 768) toggleMenu(); } };
            document.getElementById('sidebar').addEventListener('click', handleNavClick);
            document.querySelector('header .sidebar-logo')?.addEventListener('click', handleNavClick);
            
            window.addEventListener('hashchange', router);
        };
