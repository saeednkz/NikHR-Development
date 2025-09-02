// --- وارد کردن ماژول‌ها ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { onAuthStateChanged, updatePassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore, doc, getDoc, setDoc, onSnapshot, collection,
    addDoc, getDocs, writeBatch, deleteDoc, updateDoc, query, where, serverTimestamp, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

// وارد کردن توابع از ماژول‌های محلی
import { initAuth, showLoginPage, showDashboard, setupAuthEventListeners, signOut, isAdmin, canEdit, isTeamManager } from './auth.js';
import { showToast } from './utils.js';
        
        // --- SURVEY TEMPLATES (COMPREHENSIVE & STANDARD) ---
        const surveyTemplates = {
            'engagement': {
                id: 'engagement',
                title: 'نظرسنجی جامع مشارکت کارکنان (Engagement)',
                description: 'سنجش عمیق سطح تعهد، انگیزه و رضایت شغلی بر اساس استانداردهای جهانی.',
                categories: { alignment: 'هم‌راستایی و اهداف', growth: 'رشد و توسعه', management: 'مدیریت و راهبری', recognition: 'قدردانی و ارزش‌گذاری', wellbeing: 'سلامت و تعادل کار و زندگی', culture: 'فرهنگ و تعلق سازمانی' },
                questions: [
                    { id: 'eng_q1', category: 'alignment', text: 'من به وضوح می‌دانم که کار من چگونه به اهداف کلی شرکت کمک می‌کند.', type: 'rating_1_5' },
                    { id: 'eng_q2', category: 'alignment', text: 'من به ماموریت و چشم‌انداز شرکت باور دارم.', type: 'rating_1_5' },
                    { id: 'eng_q3', category: 'growth', text: 'در شغل فعلی‌ام فرصت‌های کافی برای یادگیری و رشد حرفه‌ای دارم.', type: 'rating_1_5' },
                    { id: 'eng_q4', category: 'growth', text: 'شرکت در توسعه مهارت‌های من سرمایه‌گذاری می‌کند.', type: 'rating_1_5' },
                    { id: 'eng_q5', category: 'management', text: 'مدیر مستقیم من به طور منظم بازخوردهای سازنده و مفیدی به من ارائه می‌دهد.', type: 'rating_1_5' },
                    { id: 'eng_q6', category: 'management', text: 'من برای انجام کارم از استقلال و اختیار کافی برخوردارم.', type: 'rating_1_5' },
                    { id: 'eng_q7', category: 'management', text: 'مدیر من به من به عنوان یک فرد اهمیت می‌دهد و حامی من است.', type: 'rating_1_5' },
                    { id: 'eng_q8', category: 'recognition', text: 'وقتی کارم را به خوبی انجام می‌دهم، احساس می‌کنم از من قدردانی می‌شود.', type: 'rating_1_5' },
                    { id: 'eng_q9', category: 'recognition', text: 'فرآیندهای ارزیابی و ترفیع در شرکت منصفانه هستند.', type: 'rating_1_5' },
                    { id: 'eng_q10', category: 'culture', text: 'من احساس تعلق به تیم و سازمان خود دارم.', type: 'rating_1_5' },
                    { id: 'eng_q11', category: 'culture', text: 'در محیط کار، نظرات و ایده‌های من شنیده و مورد احترام قرار می‌گیرند.', type: 'rating_1_5' },
                    { id: 'eng_q12', category: 'wellbeing', text: 'حجم کاری من قابل مدیریت است و باعث فرسودگی شغلی‌ام نمی‌شود.', type: 'rating_1_5' },
                    { id: 'eng_q13', category: 'wellbeing', text: 'من می‌توانم تعادل مناسبی بین کار و زندگی شخصی‌ام برقرار کنم.', type: 'rating_1_5' },
                    { id: 'eng_q14', category: 'overall', text: 'با توجه به همه جوانب، این شرکت را به عنوان یک محیط کاری عالی به دیگران توصیه می‌کنم (eNPS).', type: 'rating_1_10' },
                    { id: 'eng_q15', category: 'overall', text: 'چه چیزی را در فرهنگ شرکت بیشتر از همه دوست دارید؟', type: 'open_text' },
                    { id: 'eng_q16', category: 'overall', text: 'اگر می‌توانستید یک چیز را در شرکت تغییر دهید، آن چه بود؟', type: 'open_text' },
                ]
            },
            'pulse': { id: 'pulse', title: 'نظرسنجی پالس هفتگی', description: 'یک نظرسنجی سریع برای سنجش نبض سازمان و حال و هوای کارکنان در هفته گذشته.', questions: [ { id: 'pls_q1', text: 'در مقیاس ۱ تا ۵، از هفته کاری خود چقدر رضایت داشتید؟', type: 'rating_1_5' }, { id: 'pls_q2', text: 'حجم کاری خود را در این هفته چگونه ارزیابی می‌کنید؟', type: 'choice', options: ['بسیار کم', 'کم', 'مناسب', 'زیاد', 'بسیار زیاد'] }, { id: 'pls_q3', text: 'آیا در هفته گذشته بازخورد مفیدی دریافت کردید که به شما در کارتان کمک کند؟', type: 'yes_no' }, { id: 'pls_q4', text: 'بزرگترین مانع یا چالشی که این هفته با آن روبرو بودید چه بود؟', type: 'open_text' }, { id: 'pls_q5', text: 'یک اتفاق مثبت یا موفقیت از این هفته را نام ببرید.', type: 'open_text' }, ] },
            'onboarding': { id: 'onboarding', title: 'نظرسنجی تجربه جذب و آنبوردینگ', description: 'جمع‌آوری بازخورد از نیروهای جدید برای بهبود فرآیند ورود به سازمان.', questions: [ { id: 'onb_q1', text: 'فرآیند مصاحبه و جذب چقدر شفاف، حرفه‌ای و محترمانه بود؟', type: 'rating_1_5' }, { id: 'onb_q2', text: 'آیا شرح شغلی که مطالعه کردید، با وظایف واقعی شما مطابقت دارد؟', type: 'yes_no_somewhat' }, { id: 'onb_q3', text: 'آیا قبل از روز اول، اطلاعات کافی در مورد شروع به کارتان دریافت کردید؟', type: 'yes_no' }, { id: 'onb_q4', text: 'در هفته اول کاری، تمام ابزارها، نرم‌افزارها و دسترسی‌های لازم را در اختیار داشتید؟', type: 'yes_no' }, { id: 'onb_q5', text: 'معرفی شما به تیم و همکاران چگونه بود و چقدر احساس راحتی کردید؟', type: 'rating_1_5' }, { id: 'onb_q6', text: 'آیا شرح وظایف و انتظارات از شما در ماه اول کاری کاملاً روشن و شفاف بود؟', type: 'rating_1_5' }, { id: 'onb_q7', text: 'آیا مدیرتان در هفته‌های اول به اندازه کافی برای شما وقت گذاشت؟', type: 'yes_no' }, { id: 'onb_q8', text: 'چه پیشنهادی برای بهبود تجربه آنبوردینگ نیروهای جدید دارید؟', type: 'open_text' }, ] },
            'feedback_360': { id: 'feedback_360', title: 'نظرسنجی بازخورد ۳۶۰ درجه', description: 'ارائه بازخورد سازنده به همکاران برای کمک به رشد حرفه‌ای آن‌ها.', requiresTarget: true, questions: [ { id: '360_q1', text: 'این همکار چقدر در ارتباطات خود (گفتاری و نوشتاری) شفاف، محترمانه و موثر است؟', type: 'rating_1_5' }, { id: '360_q2', text: 'این همکار تا چه حد در کار تیمی مشارکت می‌کند، به دیگران کمک می‌کند و دانش خود را به اشتراک می‌گذارد؟', type: 'rating_1_5' }, { id: '360_q3', text: 'این همکار در حل مسائل و رویارویی با چالش‌ها چقدر خلاق، کارآمد و مسئولیت‌پذیر است؟', type: 'rating_1_5' }, { id: '360_q4', text: 'این همکار تا چه حد به اهداف و نتایج متعهد است و کارها را با کیفیت بالا به اتمام می‌رساند؟', type: 'rating_1_5' }, { id: '360_q5', text: 'بزرگترین نقطه قوت این همکار که باید به آن ادامه دهد چیست؟', type: 'open_text' }, { id: '360_q6', text: 'چه پیشنهاد مشخصی برای رشد و پیشرفت این همکار دارید؟ (چه کاری را باید شروع کند، متوقف کند یا ادامه دهد؟)', type: 'open_text' }, ] },
            'exit': { id: 'exit', title: 'نظرسنجی خروج از سازمان', description: 'درک دلایل ترک سازمان برای بهبود محیط کاری برای کارمندان آینده.', questions: [ { id: 'ext_q1', text: 'لطفاً دلیل یا دلایل اصلی خود برای ترک سازمان را بیان کنید.', type: 'open_text' }, { id: 'ext_q2', text: 'از تجربه کاری خود در این شرکت به طور کلی چقدر رضایت داشتید؟', type: 'rating_1_5' }, { id: 'ext_q3', text: 'آیا احساس می‌کردید شغل شما از مهارت‌هایتان به خوبی استفاده می‌کند؟', type: 'rating_1_5' }, { id: 'ext_q4', text: 'رابطه و کیفیت مدیریت مدیر مستقیم خود را چگونه ارزیابی می‌کنید؟', type: 'rating_1_5' }, { id: 'ext_q5', text: 'آیا فرصت‌های کافی برای رشد و پیشرفت شغلی در اختیار شما قرار گرفت؟', type: 'rating_1_5' }, { id: 'ext_q6', text: 'فرهنگ سازمانی شرکت را چگونه توصیف می‌کنید؟', type: 'open_text' }, { id: 'ext_q7', text: 'آیا بسته حقوق و مزایای خود را منصفانه و رقابتی می‌دانستید؟', type: 'yes_no' }, { id: 'ext_q8', text: 'آیا این شرکت را به عنوان یک محیط کاری به دیگران توصیه می‌کنید؟', type: 'yes_no' }, { id: 'ext_q9', text: 'اگر می‌توانستید یک چیز را در شرکت تغییر دهید، آن چه بود؟', type: 'open_text' }, ] }
        };
// فایل: js/main.js

// این آبجکت را به بالای فایل اضافه کنید
const allItemTypes = {
    // آیتم‌های سیستمی (از generateSmartReminders)
    'تولد': 'تولد کارمند',
    'تمدید قرارداد': 'تمدید قرارداد کارمند',
     'سالگرد استخدام': 'سالگرد استخدام کارمند',
    
    // آیتم‌های درخواست کاربر (از showNewRequestForm)
    'درخواست مرخصی': 'درخواست مرخصی',
    'گواهی اشتغال به کار': 'گواهی اشتغال به کار',
    'مساعده حقوق': 'مساعده حقوق',
    'درخواست ویرایش اطلاعات': 'درخواست ویرایش اطلاعات',
    'سایر': 'سایر درخواست‌ها'
    // هر آیتم جدید دیگری که در آینده اضافه می‌کنید را اینجا تعریف کنید
};
const documentCategories = [
    { id: 'آموزش و رشد',      key: 'learning', icon: 'graduation-cap', desc: 'منابع و دوره‌های رشد فردی و شغلی.' },
    { id: 'قوانین و بازی',    key: 'rules',    icon: 'scale',          desc: 'آیین‌نامه‌ها، اصول همکاری و راهنمای رفتاری.' },
    { id: 'کیت ابزار کاری',   key: 'toolkit',  icon: 'briefcase',      desc: 'فرم‌ها، قالب‌ها و الگوهای کاربردی روزانه.' },
    { id: 'داستان ما',       key: 'story',    icon: 'book-open',      desc: 'رسالت، چشم‌انداز و ارزش‌های سازمان.' },
    { id: 'مزایا و حقوق',     key: 'benefits', icon: 'coins',          desc: 'حقوق، مزایا، بیمه و سیاست‌های مالی.' },
    { id: 'مستندات پروژه‌ها', key: 'projects', icon: 'folder-kanban',  desc: 'مستندات فنی و اجرایی پروژه‌ها.' }
];
        export const state = { employees: [], teams: [], reminders: [], surveyResponses: [], users: [], competencies: [], expenses: [], pettyCashCards: [], chargeHistory: [], dashboardMetrics: {}, orgAnalytics: {}, currentPage: 'dashboard', currentPageTalent: 1, currentUser: null,currentPageRequests: 1,currentPageTasks: 1,currentPageAnnouncements: 1 };
        let charts = {};
let activeListeners = []; // [!code ++] این خط را اضافه کنید
        // این کد را نزدیک به تعریف state قرار دهید
// پالت رنگی قبلی را با این پالت جدید جایگزین کنید
// این پالت رنگی را جایگزین پالت قبلی کنید
const teamColorPalette = [
    'border-sky-500',
    'border-green-500',
    'border-violet-500',
    'border-amber-500',
    'border-pink-500',
    'border-teal-500'
];
// این تابع جدید را به js/main.js اضافه کنید
const detachAllListeners = () => {
    console.log(`Detaching ${activeListeners.length} active listeners...`);
    activeListeners.forEach(unsubscribe => unsubscribe());
    activeListeners = []; // آرایه را خالی می‌کنیم
};
        const surveyVisualsPalette = [
    { icon: 'clipboard-list', color: 'text-sky-500', bg: 'bg-sky-100' },
    { icon: 'zap', color: 'text-amber-500', bg: 'bg-amber-100' },
    { icon: 'rocket', color: 'text-rose-500', bg: 'bg-rose-100' },
    { icon: 'users', color: 'text-green-500', bg: 'bg-green-100' },
    { icon: 'log-out', color: 'text-slate-500', bg: 'bg-slate-100' }
];
        // این پالت رنگی را جایگزین پالت قبلی کنید
const teamVisualsPalette = [
    { icon: 'users', color: 'text-sky-500', bg: 'bg-sky-100' },
    { icon: 'briefcase', color: 'text-amber-500', bg: 'bg-amber-100' },
    { icon: 'megaphone', color: 'text-rose-500', bg: 'bg-rose-100' },
    { icon: 'bar-chart-3', color: 'text-green-500', bg: 'bg-green-100' },
    { icon: 'pen-tool', color: 'text-indigo-500', bg: 'bg-indigo-100' },
    { icon: 'settings-2', color: 'text-slate-500', bg: 'bg-slate-100' }
];
        const appId = 'hr-nik-prod';
const firebaseConfig = {
  apiKey: "AIzaSyCEvMeneEts83kYtqRRl3K_BQ8VnoVlqKA",
  authDomain: "nikhr-development.firebaseapp.com",
  projectId: "nikhr-development",
  storageBucket: "nikhr-development.firebasestorage.app",
  messagingSenderId: "307429828572",
  appId: "1:307429828572:web:132d614871cae0ad965119"
};
        let app, auth, db, storage, functions;
        


// این کد باید در فایل js/main.js شما جایگزین تابع فعلی شود

// این کد باید در فایل js/main.js شما جایگزین تابع فعلی شود

// کل این تابع را با نسخه جدید جایگزین کنید
// این تابع جدید را به js/main.js اضافه کنید

// کل تابع initializeFirebase را با این نسخه جایگزین کنید

async function initializeFirebase() {
    try {
        app = initializeApp(firebaseConfig);
        auth = initAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        functions = getFunctions(app);

        setupAuthEventListeners(auth); 

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // اگر کاربر لاگین بود، مثل قبل داده‌ها را بارگذاری کن و داشبورد را نشان بده
        await fetchUserRole(user);
        listenToData();
    } else {
        // اگر کاربر لاگین نبود...
        state.currentUser = null;
        detachAllListeners();
        
        // --- منطق جدید برای لینک نظرسنجی ---
        const hash = window.location.hash;
        if (hash.startsWith('#survey-taker')) {
            // اگر لینک مربوط به نظرسنجی بود، صفحه نظرسنجی را نمایش بده
            const urlParams = new URLSearchParams(hash.split('?')[1]);
            const surveyId = urlParams.get('id');
            renderSurveyTakerPage(surveyId);
        } else {
            // در غیر این صورت، صفحه ورود را نمایش بده
            showLoginPage();
        }
    }
});
    } catch (error) { 
        console.error("Firebase Init Error:", error); 
    }
}

// کد اصلاح شده برای main.js

// کد کامل و صحیح برای جایگزینی در main.js

async function fetchUserRole(user) {
    // مرحله ۱: سعی کن نقش کاربر را از کالکشن users بخوانی
    const userRef = doc(db, `artifacts/${appId}/public/data/users`, user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        // اگر نقش از قبل مشخص بود، آن را تنظیم کن
        state.currentUser = { uid: user.uid, email: user.email, ...userSnap.data() };
    } else {
        // مرحله ۲: اگر نقش مشخص نبود، در کالکشن employees دنبال پروفایل کارمند بگرد
        const employeesCollection = collection(db, `artifacts/${appId}/public/data/employees`);
        // یک کوئری می‌سازیم تا کارمندی را پیدا کنیم که فیلد uid او با شناسه لاگین کاربر برابر است
        const q = query(employeesCollection, where("uid", "==", user.uid));
        const employeeQuerySnapshot = await getDocs(q);

        if (!employeeQuerySnapshot.empty) {
            // اگر پروفایل کارمندی پیدا شد، نقش او را 'employee' قرار بده
            const newUser = { email: user.email, role: 'employee', createdAt: serverTimestamp() };
            await setDoc(userRef, newUser); // این نقش را برای ورودهای بعدی در دیتابیس ذخیره کن
            state.currentUser = { uid: user.uid, ...newUser };
        } else {
            // مرحله ۳: اگر پروفایل کارمندی هم پیدا نشد، به عنوان کاربر عادی (viewer) ثبت‌نامش کن
            const usersCol = collection(db, `artifacts/${appId}/public/data/users`);
            const usersSnapshot = await getDocs(usersCol);
            const isFirstUser = usersSnapshot.empty;
            const newUserRole = isFirstUser ? 'admin' : 'viewer'; // اولین کاربر سیستم ادمین می‌شود
            const newUser = { email: user.email, role: newUserRole, createdAt: serverTimestamp() };
            await setDoc(userRef, newUser);
            state.currentUser = { uid: user.uid, ...newUser };
        }
    }
}
// کل این تابع را با نسخه جدید جایگزین کنید
// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید
// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید
// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

function listenToData() {
    detachAllListeners(); 
    
    const collectionsToListen = [
        'employees', 'teams', 'reminders', 'surveyResponses', 'users', 
        'competencies', 'requests', 'assignmentRules', 'companyDocuments', 'announcements', 'birthdayWishes', 'moments','jobPositions','evaluationCycles','jobFamilies','employeeEvaluations' 
    ];
    let initialLoads = collectionsToListen.length;

    const onDataLoaded = () => {
        initialLoads--;
        if (initialLoads === 0) {
            calculateAndApplyAnalytics();
            
            // فراخوانی تابع نوتیفیکیشن بعد از بارگذاری کامل داده‌ها
            updateNotificationsForCurrentUser(); 
            
            if (state.currentUser.role === 'employee') {
                renderEmployeePortal();
            } else {
                showDashboard(state.currentUser, state); // [!code focus]
                router();
            }
            document.getElementById('loading-overlay').style.display = 'none';
        }
    };

    collectionsToListen.forEach(colName => {
        const colRef = collection(db, `artifacts/${appId}/public/data/${colName}`);
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
            state[colName] = snapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
            
            if (initialLoads > 0) {
                onDataLoaded();
            } else {
                // با هر تغییر در داده‌ها، تمام بخش‌ها را بروز می‌کنیم
                calculateAndApplyAnalytics();
                updateNotificationsForCurrentUser(); // بروزرسانی نوتیفیکیشن‌ها در لحظه
                
                if (state.currentUser.role !== 'employee' && !window.location.hash.startsWith('#survey-taker')) {
                    renderPage(state.currentPage);
                }

                // اگر کاربر کارمند است و روی تب لحظه‌هاست، لیست را تازه‌سازی کن
                try {
                    if (state.currentUser.role === 'employee') {
                        const activeMoments = document.querySelector('#employee-portal-nav .nav-item[href="#moments"].active');
                        if (activeMoments && typeof window.renderMomentsList === 'function') {
                            window.renderMomentsList();
                        }
                    }
                } catch {}
            }
        }, (error) => {
            console.error(`Error listening to ${colName}:`, error);
            if (!state[colName]) state[colName] = [];
            if (initialLoads > 0) onDataLoaded();
        });
        
        activeListeners.push(unsubscribe);
    });
}

// --- ROUTER ---
export const router = () => {
    const hash = window.location.hash;
    if (hash.startsWith('#survey-taker')) {
        const urlParams = new URLSearchParams(hash.split('?')[1]);
        const surveyId = urlParams.get('id');
        renderSurveyTakerPage(surveyId);
    } else {
        const pageName = hash.substring(1) || 'dashboard';
        navigateTo(pageName);
    }
};
// این دو تابع جدید را به فایل js/main.js اضافه کنید (مثلاً قبل از تابع renderEmployeePortal)

// این دو تابع جدید را به js/main.js اضافه کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

// در فایل js/main.js
// کل این تابع را با نسخه نهایی زیر جایگزین کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید
// این تابع جدید را به js/main.js اضافه کنید (مثلاً قبل از تابع renderEmployeePortal)

// این تابع جدید را به js/main.js اضافه کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید
// این دو تابع جدید را به js/main.js اضافه کنید

// این دو تابع جدید را به js/main.js اضافه کنید

// در فایل js/main.js
// این تابع را جایگزین نسخه فعلی کنید
// در فایل js/main.js
// این تابع را نیز با نسخه جدید جایگزین کنید
// در فایل js/main.js
function renderBirthdaysWidget(currentEmployee) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingBirthdays = state.employees
        .filter(emp => emp.firestoreId !== currentEmployee.firestoreId && emp.personalInfo?.birthDate)
        .map(emp => {
            const birthDate = new Date(emp.personalInfo.birthDate);
            let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
            if (nextBirthday < today) {
                nextBirthday.setFullYear(today.getFullYear() + 1);
            }
            return {
                ...emp,
                nextBirthday,
                daysUntil: Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24))
            };
        })
        .filter(emp => emp.daysUntil >= 0 && emp.daysUntil <= 30)
        .sort((a, b) => a.daysUntil - b.daysUntil);

    if (upcomingBirthdays.length === 0) return '';

    const birthdayListHtml = upcomingBirthdays.map(emp => `
        <div class="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors duration-200">
            <div class="flex items-center gap-3">
                <img src="${emp.avatar}" alt="${emp.name}" class="w-10 h-10 rounded-full object-cover">
                <div>
                    <p class="font-semibold text-sm text-slate-800">${emp.name}</p>
                    <p class="text-xs text-slate-500">${toPersianDate(emp.nextBirthday)}</p>
                </div>
            </div>
            <div class="text-center">
                <button class="send-wish-btn text-sm bg-pink-500 text-white py-1.5 px-3 rounded-full hover:bg-pink-600 shadow-sm" data-id="${emp.uid}" data-name="${emp.name}">
                    تبریک بگو!
                </button>
            </div>
        </div>
    `).join('');

    return `
        <div class="card p-0">
            <div class="card-header flex items-center gap-2">
                <i data-lucide="cake" class="w-5 h-5 text-pink-500"></i>
                <h3 class="font-semibold text-slate-800">تولدهای نزدیک</h3>
            </div>
            <div class="card-content divide-y divide-slate-100">${birthdayListHtml}</div>
        </div>
    `;
}
// در فایل js/main.js
// این تابع را جایگزین نسخه فعلی کنید
// در فایل js/main.js
// این تابع را با نسخه جدید جایگزین کنید
// در فایل js/main.js
function renderMyBirthdayWishesWidget(employee) {
    const today = new Date();
    const birthDate = employee.personalInfo?.birthDate ? new Date(employee.personalInfo.birthDate) : null;
    
    // اگر امروز تولد کارمند نیست، ویجتی نمایش نده
    if (!birthDate || birthDate.getMonth() !== today.getMonth() || birthDate.getDate() !== today.getDate()) {
        return '';
    }

    // پیام‌های تبریکی که دیگران فرستاده‌اند را پیدا کن
    const myWishes = (state.birthdayWishes || [])
        .filter(wish => wish.targetUid === employee.uid)
        .sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()));

    const wishesHtml = myWishes.map(wish => `
        <div class="p-3 bg-white/20 rounded-lg backdrop-blur-sm mt-2">
            <p class="text-sm text-white">${wish.message}</p>
            <p class="text-xs text-indigo-200 font-semibold text-left mt-1">- ${wish.wisherName}</p>
        </div>
    `).join('');

    return `
        <div class="card p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative overflow-hidden">
            <div class="absolute -right-10 -top-10 w-32 h-32 text-white/10"><i data-lucide="party-popper" class="w-32 h-32"></i></div>
            <div class="relative z-10">
                <h3 class="text-2xl font-bold">تولدت مبارک، ${employee.name}!</h3>
                <p class="mt-2 text-indigo-200">تیم NikHR بهترین آرزوها را برای شما در سال جدید زندگی‌تان دارد.</p>
                ${myWishes.length > 0 ? `
                    <div class="mt-4 border-t border-white/20 pt-3">
                        <h4 class="font-semibold text-sm">پیام‌های دریافتی:</h4>
                        ${wishesHtml}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}
// در فایل js/main.js
// کل این تابع را نیز با نسخه کامل و نهایی زیر جایگزین کنید
// فایل: js/main.js
// ▼▼▼ این تابع را که جا افتاده بود، به فایل خود اضافه کنید ▼▼▼

// فایل: js/main.js
// ▼▼▼ کل این تابع را با نسخه کامل و صحیح زیر جایگزین کنید ▼▼▼

const renderMyTasks = (employee) => {
    const container = document.getElementById('my-tasks-list');
    if (!container) return;

    let tasksHtml = '';

    // ۱. بررسی برای دوره ارزیابی فعال
    const activeCycle = (state.evaluationCycles || []).find(c => c.status === 'active');
    if (activeCycle) {
        // ۲. پیدا کردن ارزیابی مربوط به این کارمند و این دوره
        const evaluation = (state.employeeEvaluations || []).find(e => 
            e.employeeId === employee.id && e.cycleId === activeCycle.firestoreId
        );

        // ۳. فقط در صورتی تسک را نمایش بده که خودارزیابی هنوز ثبت نشده باشد
        if (evaluation && !evaluation.selfAssessment) {
            tasksHtml += `
                <div class="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                    <div>
                        <p class="font-semibold text-sm text-indigo-800">تکمیل فرم خودارزیابی عملکرد</p>
                        <p class="text-xs text-indigo-600">مربوط به دوره: ${activeCycle.title}</p>
                    </div>
                    <button id="start-self-assessment-btn" data-cycle-id="${activeCycle.firestoreId}" class="primary-btn text-xs py-1.5 px-3">شروع</button>
                </div>
            `;
        }
    }

    if (tasksHtml === '') {
        tasksHtml = '<p class="text-sm text-slate-500 text-center py-4">در حال حاضر کار فعالی برای شما وجود ندارد.</p>';
    }

    container.innerHTML = tasksHtml;
};
function renderEmployeePortalPage(pageName, employee) {
    const contentContainer = document.getElementById('employee-main-content');
    if (!contentContainer) return;

// فایل: js/main.js - این کد را به جای بلوک if (pageName === 'profile') فعلی قرار دهید

// فایل: js/main.js - داخل تابع renderEmployeePortalPage
// این بلوک کد را به جای بلوک if (pageName === 'profile') فعلی قرار دهید ▼

if (pageName === 'profile') {
const team = state.teams.find(t => t.memberIds?.includes(employee.id));
const manager = team ? state.employees.find(e => e.id === team.leadership?.manager) : null;
        
    const performanceHistoryHtml = (employee.performanceHistory || []).sort((a,b) => new Date(b.reviewDate) - new Date(a.reviewDate))
        .map(review => `
            <div class="bg-slate-50 rounded-xl p-4 border hover:border-indigo-200 transition-colors">
                <div class="flex justify-between items-center mb-2">
                    <p class="font-bold text-slate-800">امتیاز کلی: <span class="text-lg font-semibold text-indigo-600">${review.overallScore}/5</span></p>
                    <p class="text-xs text-slate-500">${toPersianDate(review.reviewDate)}</p>
                </div>
                <div class="mt-3 border-t pt-3 text-sm">
                    <p><strong>نقاط قوت:</strong> ${review.strengths || '-'}</p>
                    <p class="mt-2"><strong>زمینه‌های قابل بهبود:</strong> ${review.areasForImprovement || '-'}</p>
                </div>
            </div>
        `).join('')
        || '<div class="text-center py-6"><i data-lucide="inbox" class="w-12 h-12 mx-auto text-slate-300"></i><p class="mt-2 text-sm text-slate-500">سابقه‌ای از ارزیابی عملکرد شما ثبت نشده است.</p></div>';

    const myTeam = state.teams.find(t => t.memberIds?.includes(employee.id));
    const okrAvg = (myTeam?.okrs && myTeam.okrs.length > 0)
        ? Math.round(myTeam.okrs.reduce((sum, okr) => sum + (okr.progress || 0), 0) / myTeam.okrs.length)
        : 0;
    const requestsOpen = (state.requests || []).filter(r => r.uid === employee.uid && (r.status === 'درحال بررسی' || r.status === 'در حال انجام')).length;
    const readIds = new Set(employee.readAnnouncements || []);
    const myTeamId = myTeam ? myTeam.firestoreId : null;
    const unreadCount = (state.announcements || []).filter(msg => {
        if (!msg.createdAt?.toDate) return false;
        const targets = msg.targets || { type: 'public' };
        const targeted = (targets?.type === 'public')
            || (targets?.type === 'roles' && targets.roles?.includes('employee'))
            || (targets?.type === 'users' && targets.userIds?.includes(employee.firestoreId))
            || (targets?.type === 'teams' && targets.teamIds?.includes(myTeamId));
        if (!targeted) return false;
        return !readIds.has(msg.firestoreId);
    }).length;

    const infoBanner = (() => {
        const key = `dismiss_info_${employee.uid}`;
        const dismissed = localStorage.getItem(key);
        const latestInfo = (state.announcements||[]).filter(a=> a.type==='info')
            .filter(a=>{
                const t = a.targets || {type:'public'};
                if (t.type==='public') return true;
                if (t.type==='roles') return (t.roles||[]).includes('employee');
                if (t.type==='users') return (t.userIds||[]).includes(employee.firestoreId);
                if (t.type==='teams') return (t.teamIds||[]).includes(myTeamId);
                return false;
            })
            .sort((a,b)=> new Date(b.createdAt?.toDate?.()||0) - new Date(a.createdAt?.toDate?.()||0))[0];
        if (!latestInfo || dismissed===latestInfo.firestoreId) return '';
        return `<div id="info-bubble" data-info-id="${latestInfo.firestoreId}" class="glass rounded-2xl p-4 flex items-start gap-3 fade-up"><i data-lucide="megaphone" class="w-5 h-5" style="color:#6B69D6"></i><div class="flex-1"><div class="text-sm font-bold text-slate-800">اطلاعیه</div><div class="text-xs text-slate-700 mt-1">${latestInfo.content || latestInfo.title || ''}</div></div><button id="dismiss-info" class="text-slate-500 hover:text-slate-800"><i data-lucide="x" class="w-5 h-5"></i></button></div>`;
    })();

    contentContainer.innerHTML = `
        ${infoBanner}
        ${renderMyBirthdayWishesWidget(employee)}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 ${renderMyBirthdayWishesWidget(employee) ? 'mt-8' : ''}">
            <div class="lg:col-span-2 space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="glass rounded-2xl p-4 flex items-center justify-between fade-up"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full flex items-center justify-center" style="background:rgba(107,105,214,.12)"><i data-lucide="send" style="color:#6B69D6" class="w-5 h-5"></i></div><div><div class="text-xl font-extrabold text-slate-800">${requestsOpen}</div><div class="text-xs text-slate-500">درخواست‌های باز</div></div></div></div>
                    <div class="glass rounded-2xl p-4 flex items-center justify-between fade-up"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full flex items-center justify-center" style="background:rgba(107,105,214,.12)"><i data-lucide="mail" style="color:#6B69D6" class="w-5 h-5"></i></div><div><div class="text-xl font-extrabold text-slate-800">${unreadCount}</div><div class="text-xs text-slate-500">پیام‌های نخوانده</div></div></div></div>
                    <div class="glass rounded-2xl p-4 flex items-center justify-between fade-up"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full flex items-center justify-center" style="background:rgba(107,105,214,.12)"><i data-lucide="target" style="color:#6B69D6" class="w-5 h-5"></i></div><div><div class="text-xl font-extrabold text-slate-800">${okrAvg}%</div><div class="text-xs text-slate-500">میانگین OKR تیم</div></div></div></div>
                </div>
                
                <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div class="flex items-center gap-4 mb-4"><div class="w-16 h-16 rounded-full overflow-hidden bg-slate-100 ring-2 ring-indigo-100"><img src="${employee.avatar}" alt="${employee.name}" class="w-full h-full object-cover"></div><div><div class="text-lg font-bold text-slate-800">${employee.name}</div><div class="text-sm text-slate-500">${employee.jobTitle || 'بدون عنوان شغلی'}</div></div></div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"><div class="bg-slate-50 rounded-lg p-3"><div class="text-xs text-slate-500 mb-1">ایمیل</div><div class="font-medium text-slate-700">${employee.personalInfo?.email || '-'}</div></div><div class="bg-slate-50 rounded-lg p-3"><div class="text-xs text-slate-500 mb-1">شماره موبایل</div><div class="font-medium text-slate-700">${employee.personalInfo?.phone || '-'}</div></div><div class="bg-slate-50 rounded-lg p-3"><div class="text-xs text-slate-500 mb-1">تیم</div><div class="font-medium text-slate-700">${(state.teams.find(t=>t.memberIds?.includes(employee.id))?.name) || '-'}</div></div><div class="bg-slate-50 rounded-lg p-3"><div class="text-xs text-slate-500 mb-1">مدیر</div><div class="font-medium text-slate-700">${manager?.name || '-'}</div></div></div>
                </div>

                <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 class="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                        <i data-lucide="history" class="w-5 h-5 text-indigo-500"></i>
                        تاریخچه ارزیابی عملکرد
                    </h3>
                    <div class="space-y-4">${performanceHistoryHtml}</div>
                </div>

                <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold text-slate-800 flex items-center gap-2">
                            <i data-lucide="activity" class="w-5 h-5 text-indigo-500"></i>
                            روند عملکرد
                        </h3>
                    </div>
                    <div class="relative h-48">
                        <canvas id="empPerformanceChart"></canvas>
                    </div>
                </div>
            </div>
            <aside class="space-y-6">
                ${renderBirthdaysWidget(employee)}
                </aside>
        </div>`;

    try {
        const ctx = document.getElementById('empPerformanceChart')?.getContext('2d');
        if (ctx) {
            const history = (employee.performanceHistory || []).slice().sort((a,b)=> new Date(a.reviewDate) - new Date(b.reviewDate));
            const labels = history.map(h => toPersianDate(h.reviewDate));
            const data = history.map(h => Number(h.overallScore) || 0);
            new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: 'امتیاز', data, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', tension: 0.35, pointRadius: 3 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { suggestedMin: 0, suggestedMax: 5, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } } } });
        }
    } catch (err) { console.error('Performance chart error', err); }
    
    function renderEmployeeSidebarMessages(emp) { /* ... */ }
    function renderEmployeeSidebarTeam(emp) { /* ... */ }
    function renderEmployeeSidebarRequests(emp) { /* ... */ }

    // فراخوانی توابع مخصوص این صفحه (حذف ویجت تسک‌های قدیمی)
    lucide.createIcons();
}
    // --- بخش دایرکتوری (تیمی) ---
    else if (pageName === 'directory') {
        const colorsDir = ['#6B69D6','#FF6A3D','#10B981','#F59E0B','#0EA5E9','#F43F5E'];
        const teamCardsHtml = (state.teams || []).map((team, idx) => {
            const leader = state.employees.find(e => e.id === team.leaderId);
            const color = colorsDir[idx % colorsDir.length];
            const avatar = team.avatar || 'icons/icon-128x128.png';
            return `
                <div class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-shadow fade-up">
                    <div class="w-16 h-16 mx-auto rounded-full overflow-hidden ring-4" style="ring-color:${color}; ring: 4px solid ${color}; background:rgba(0,0,0,.03)">
                        <img src="${avatar}" alt="${team.name}" class="w-full h-full object-cover">
                    </div>
                    <h3 class="text-center text-base font-bold text-slate-800 mt-3">${team.name}</h3>
                    ${team.missionLine ? `<p class=\"text-center text-xs text-slate-600 mt-1\">${team.missionLine}</p>` : `<p class=\"text-center text-xs text-slate-600 mt-1\">مدیر: ${leader?.name || 'نامشخص'}</p>`}
                    <div class="mt-4 flex justify-center">
                        <button class="view-team-employee-btn text-xs font-semibold px-3 py-1.5 rounded-lg" data-team-id="${team.firestoreId}" style="color:#fff;background:${color}">مشاهده</button>
                    </div>
                </div>`;
        }).join('');

        contentContainer.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 page-header mb-6">
                <div>
                    <h1 class="text-3xl font-extrabold" style="color:#242A38">تیم‌ها</h1>
                    <p class="text-slate-500 text-sm mt-1">تیم‌ها، اعضا و اطلاعات مرتبط</p>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">${teamCardsHtml || '<p class="text-slate-500">تیمی ثبت نشده است.</p>'}</div>`;
    }
    // --- بخش درخواست‌ها ---
    else if (pageName === 'requests') {
        let myRequests = (state.requests || []).filter(req => req.uid === employee.uid);
        // مرتب‌سازی: ابتدا درخواست‌هایی که پاسخ جدید دارند (نسبت به lastSeenAt)، سپس بر اساس lastUpdatedAt/createdAt
        myRequests = myRequests.sort((a, b) => {
            const aHasNew = (a.thread || []).some(item => item.createdAt?.toDate && (!a.lastSeenAt || item.createdAt.toDate() > a.lastSeenAt.toDate()));
            const bHasNew = (b.thread || []).some(item => item.createdAt?.toDate && (!b.lastSeenAt || item.createdAt.toDate() > b.lastSeenAt.toDate()));
            if (aHasNew !== bHasNew) return aHasNew ? -1 : 1;
            const aTime = a.lastUpdatedAt?.toDate?.() || a.createdAt?.toDate?.() || 0;
            const bTime = b.lastUpdatedAt?.toDate?.() || b.createdAt?.toDate?.() || 0;
            return bTime - aTime;
        });
        const requestsHtml = myRequests.map(req => {
            const statusMap = {'درحال بررسی': { text: 'در حال بررسی', color: 'bg-yellow-100 text-yellow-800' },'در حال انجام': { text: 'در حال انجام', color: 'bg-blue-100 text-blue-800' },'تایید شده': { text: 'تایید شده', color: 'bg-green-100 text-green-800' },'رد شده': { text: 'رد شده', color: 'bg-red-100 text-red-800' }};
            const status = statusMap[req.status] || { text: req.status, color: 'bg-slate-100' };
            const hasNewReply = (req.thread || []).some(item => item.createdAt?.toDate && (!req.lastSeenAt || item.createdAt.toDate() > req.lastSeenAt.toDate()));
            const borderClass = hasNewReply ? 'border-emerald-200' : 'border-slate-200';
            const titleClass = hasNewReply ? 'font-bold text-slate-900' : 'font-medium text-slate-700';
            const dot = hasNewReply ? '<span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>' : '';
            return `<tr class="bg-white"><td class="p-4 border-b ${borderClass}"><div class="flex items-center gap-2 ${titleClass}">${dot}<span>${req.requestType}</span></div></td><td class="p-4 border-b ${borderClass}">${toPersianDate(req.createdAt)}</td><td class="p-4 border-b ${borderClass}"><span class="px-2 py-1 text-xs font-medium rounded-full ${status.color}">${status.text}</span></td><td class="p-4 border-b ${borderClass}"><button class="view-request-btn text-sm text-indigo-600 hover:underline" data-id="${req.firestoreId}">مشاهده جزئیات</button></td></tr>`;
        }).join('');
        const byType = {
            'گواهی اشتغال به کار': [],
            'بیمه': [],
            'بیمه تکمیلی': [],
            'درخواست مرخصی': [],
            'سایر': []
        };
        myRequests.forEach(req => {
            const key = byType[req.requestType] ? req.requestType : (req.requestType?.includes('مرخصی') ? 'درخواست مرخصی' : 'سایر');
            byType[key].push(req);
        });
        const sectionTable = (title, list) => {
            if (!list.length) return '';
            const rows = list.map(req => {
                const statusMap = {'درحال بررسی': { text: 'در حال بررسی', color: 'bg-yellow-100 text-yellow-800' },'در حال انجام': { text: 'در حال انجام', color: 'bg-blue-100 text-blue-800' },'تایید شده': { text: 'تایید شده', color: 'bg-green-100 text-green-800' },'رد شده': { text: 'رد شده', color: 'bg-red-100 text-red-800' }};
                const status = statusMap[req.status] || { text: req.status, color: 'bg-slate-100' };
                return `<tr class=\"bg-white\"><td class=\"p-3 border-b\">${req.requestType}</td><td class=\"p-3 border-b\">${toPersianDate(req.createdAt)}</td><td class=\"p-3 border-b\"><span class=\"px-2 py-1 text-xs font-medium rounded-full ${status.color}\">${status.text}</span></td><td class=\"p-3 border-b\"><button class=\"view-request-btn text-xs text-indigo-600 hover:underline\" data-id=\"${req.firestoreId}\">مشاهده</button></td></tr>`;
            }).join('');
            return `<div class=\"mb-6\"><div class=\"flex items-center gap-2 mb-2\"><i data-lucide=\"folder\" class=\"w-4 h-4\"></i><h3 class=\"font-bold text-slate-800\">${title}</h3></div><div class=\"bg-white rounded-xl border overflow-hidden\"><table class=\"w-full text-sm\"><thead style=\"background:#ECEEF3\"><tr><th class=\"p-2\">نوع</th><th class=\"p-2\">تاریخ</th><th class=\"p-2\">وضعیت</th><th class=\"p-2\"></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
        };
        const emptyState = '<div class="text-center p-10"><i data-lucide="inbox" class="mx-auto w-12 h-12 text-slate-300"></i><p class="mt-3 text-sm text-slate-500">شما هنوز درخواستی ثبت نکرده‌اید.</p><button id="add-new-request-btn" class="mt-4 inline-flex items-center gap-2 text-xs font-semibold" style="background:#6B69D6;color:#fff;padding:.6rem 1rem;border-radius:.75rem"><i data-lucide="plus-circle" class="w-4 h-4"></i><span>ثبت درخواست جدید</span></button></div>';
        contentContainer.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 page-header">
                <div>
                    <h1 class="text-3xl font-extrabold" style="color:#242A38">درخواست‌های من</h1>
                    <p class="text-slate-500 text-sm mt-1">پیگیری و ثبت درخواست‌های سازمانی</p>
                </div>
                <div class="flex items-center gap-2">
                    <button id="add-new-request-btn" class="inline-flex items-center gap-2 text-xs font-semibold" style="background:#6B69D6;color:#fff;padding:.6rem 1rem;border-radius:.75rem"><i data-lucide="plus-circle" class="w-4 h-4"></i><span>ثبت درخواست جدید</span></button>
                </div>
            </div>
            ${myRequests.length ? [
                sectionTable('گواهی اشتغال به کار', byType['گواهی اشتغال به کار']),
                sectionTable('بیمه', byType['بیمه']),
                sectionTable('بیمه تکمیلی', byType['بیمه تکمیلی']),
                sectionTable('مرخصی', byType['درخواست مرخصی']),
                sectionTable('عمومی', byType['سایر'])
            ].join('') : `<div>${emptyState}</div>`}
            `;
    }
    // --- بخش اسناد ---
else if (pageName === 'documents') {
    // حالا از همان ثابت مرکزی استفاده می‌کنیم
    const docSections = documentCategories; 
    const colors = ['#6B69D6','#FF6A3D','#10B981','#F59E0B','#0EA5E9','#F43F5E'];
    const cards = docSections.map((s, idx) => {
        const color = colors[idx % colors.length];
        return `
            <div class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-shadow fade-up">
                <div class="w-16 h-16 mx-auto rounded-full flex items-center justify-center ring-4" style="ring-color:${color}33; background:${color}1a;">
                    <i data-lucide="${s.icon}" class="w-8 h-8" style="color:${color}"></i>
                </div>
                <h3 class="text-center text-base font-bold text-slate-800 mt-3">${s.id}</h3>
                <p class="text-center text-xs text-slate-600 leading-6 mt-1">${s.desc}</p>
                <div class="mt-4 flex justify-center">
                    <button class="doc-category-btn text-xs font-semibold px-3 py-1.5 rounded-lg" data-category="${s.key}" style="color:#fff;background:${color}">مشاهده</button>
                </div>
            </div>`;
    }).join('');
    contentContainer.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 page-header mb-6">
            <div><h1 class="text-3xl font-extrabold" style="color:#242A38">دانش‌نامه</h1><p class="text-slate-500 text-sm mt-1">دسترسی سریع به منابع و مستندات کلیدی</p></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">${cards}</div>`;
}

    // --- بخش صندوق پیام ---
    else if (pageName === 'inbox') {
        const myTeam = state.teams.find(team => team.memberIds?.includes(employee.id));
        const myTeamId = myTeam ? myTeam.firestoreId : null;
        const myMessages = (state.announcements || []).filter(msg => {
            const targets = msg.targets; if (!msg.createdAt?.toDate) return false; if (targets.type === 'public') return true; if (targets.type === 'roles' && targets.roles?.includes('employee')) return true; if (targets.type === 'users' && targets.userIds?.includes(employee.firestoreId)) return true; if (targets.type === 'teams' && targets.teamIds?.includes(myTeamId)) return true; return false;
        }).sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()));
        // هایلایت پیام‌های خوانده‌نشده
        const readIds = new Set((employee.readAnnouncements || []));
        // مرتب‌سازی: ابتدا نخوانده‌ها، سپس خوانده‌شده‌ها؛ هر گروه نزولی بر اساس تاریخ
        myMessages.sort((a, b) => {
            const aUnread = !readIds.has(a.firestoreId);
            const bUnread = !readIds.has(b.firestoreId);
            if (aUnread !== bUnread) return aUnread ? -1 : 1; // نخوانده‌ها بالا
            return new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate());
        });
        const messagesHtml = myMessages.map(msg => {
            const isUnread = !readIds.has(msg.firestoreId);
            const badge = isUnread ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold" style="background:#FF2E63;color:#fff">جدید</span>' : '';
            return `
                <div class="bg-white rounded-2xl border border-slate-200 p-4 flex items-start justify-between gap-3">
                    <div class="flex items-start gap-3">
                        <div class="w-9 h-9 rounded-full flex items-center justify-center" style="background:rgba(107,105,214,.12)"><i data-lucide="message-square" style="color:#6B69D6" class="w-4 h-4"></i></div>
                        <div>
                            <div class="flex items-center gap-2">${badge}<span class="text-sm ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}">${msg.title}</span></div>
                            <div class="text-[11px] text-slate-500 mt-1">${msg.senderName} • ${toPersianDate(msg.createdAt)}</div>
                        </div>
                    </div>
                    <button class="view-message-btn text-xs font-semibold" data-id="${msg.firestoreId}" style="color:#6B69D6">مشاهده</button>
                </div>`;
        }).join('');
        contentContainer.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 page-header mb-6">
                <div>
                    <h1 class="text-3xl font-extrabold" style="color:#242A38">صندوق پیام</h1>
                    <p class="text-slate-500 text-sm mt-1">پیام‌های سازمانی شما</p>
                </div>
            </div>
            <div class="space-y-3">${messagesHtml || '<div class="text-center p-10"><i data-lucide="inbox" class="mx-auto w-12 h-12 text-slate-300"></i><p class="mt-3 text-sm text-slate-500">پیامی ندارید.</p></div>'}</div>`;
    }
    // --- لحظه‌های نیک‌اندیشی ---
    else if (pageName === 'moments') {
        const composer = `
            <div class="glass rounded-2xl p-4 mb-4">
                <div class="flex items-start gap-3">
                    <img src="${employee.avatar}" class="w-10 h-10 rounded-full object-cover"/>
                    <div class="flex-1">
                        <textarea id="moment-text" class="w-full p-3 border rounded-xl" maxlength="280" placeholder="چه خبر خوب یا فکری می‌خواهی به اشتراک بگذاری؟ (حداکثر ۲۸۰ کاراکتر)"></textarea>
                        <div class="flex items-center justify-between mt-2">
                            <input type="file" id="moment-image" accept="image/png,image/jpeg" class="text-xs"/>
                            <button id="moment-post-btn" class="primary-btn text-xs">ارسال</button>
                        </div>
                        <p class="text-[11px] text-slate-500 mt-1">فقط متن یا فقط عکس؛ همزمان هر دو مجاز نیست.</p>
                    </div>
                </div>
            </div>`;

        const listContainer = `<div id="moments-list" class="space-y-3"></div><div id="moments-sentinel" class="h-8"></div>`;
        contentContainer.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 page-header mb-4">
                <div>
                    <h1 class="text-2xl font-extrabold" style="color:#242A38">لحظه‌های نیک‌اندیشی</h1>
                    <p class="text-slate-500 text-sm mt-1">اشتراک‌گذاری افکار و عکس‌ها با هم‌تیمی‌ها</p>
                </div>
            </div>
            ${composer}
            ${listContainer}
        `;

        // نگه‌داری وضعیت صفحه‌بندی
        window._momentsPage = { pageSize: 10, lastTimestamp: null, loading: false, done: false };

// فایل: js/main.js - داخل renderEmployeePortalPage
// تابع window.renderMomentsList را با این نسخه جایگزین کنید ▼

window.renderMomentsList = () => {
    const container = document.getElementById('moments-list');
    if (!container) return;
    const items = (state.moments || []).slice().sort((a,b)=> new Date(b.createdAt?.toDate?.()||0) - new Date(a.createdAt?.toDate?.()||0));
    
    const page = window._momentsPage;
    const slice = items.filter((it, idx) => idx < (page.pageSize + (page.extra || 0)));
    container.innerHTML = slice.map(m => {
        const owner = state.employees.find(e => e.uid === m.ownerUid) || {};
        const meReact = (m.reactions || []).find(r => r.uid === employee.uid)?.emoji;
        const reactionsHtml = (m.reactions || []).map(r => {
            const user = state.employees.find(e => e.uid === r.uid) || {};
            return `<div class="flex items-center gap-1 text-xs bg-slate-100 rounded-full px-2 py-1"><span>${r.emoji}</span><img src="${user.avatar || 'icons/icon-128x128.png'}" class="w-4 h-4 rounded-full object-cover"/><span class="text-slate-600">${user.name || ''}</span></div>`;
        }).join('');

        // ▼▼▼ بخش جدید: شرط نمایش دکمه حذف ▼▼▼
        const isOwner = m.ownerUid === employee.uid;
        const canDelete = isOwner || isAdmin(); // تابع isAdmin از auth.js می‌آید
        // ▲▲▲ پایان بخش جدید ▲▲▲

        return `
            <div class="bg-white rounded-2xl border border-slate-200 p-4 relative">
                
                ${canDelete ? `
                    <button class="moment-delete-btn absolute top-3 left-3 p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors" data-id="${m.firestoreId}" title="حذف">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                ` : ''}
                
                <div class="flex items-center gap-2 mb-3">
                    <img src="${owner.avatar || 'icons/icon-128x128.png'}" class="w-10 h-10 rounded-full object-cover"/>
                    <div>
                        <div class="font-bold text-slate-800 text-sm">${owner.name || m.ownerName || 'کاربر'}</div>
                        <div class="text-[11px] text-slate-500">${toPersianDate(m.createdAt)}</div>
                    </div>
                </div>
                ${m.text ? `<div class="text-sm text-slate-800 whitespace-pre-wrap mb-3">${m.text}</div>` : ''}
                ${m.imageUrl ? `<img src="${m.imageUrl}" class="w-full h-auto max-h-[32rem] rounded-xl object-cover border bg-slate-100 mb-3"/>` : ''}
                <div class="flex items-center gap-2">
                    ${['👍','❤️','😂','🎉','👎'].map(e=> `<button class="moment-react-btn text-sm px-2 py-1 rounded-full ${meReact===e ? 'bg-slate-800 text-white':'bg-slate-100 text-slate-700'}" data-id="${m.firestoreId}" data-emoji="${e}">${e}</button>`).join('')}
                </div>
                <div class="flex flex-wrap gap-2 mt-3">${reactionsHtml}</div>
            </div>`;
    }).join('');
    if (window.lucide?.createIcons) lucide.createIcons();
};

        window.renderMomentsList();

        // اسکرول بی‌نهایت: با نزدیک شدن به انتهای صفحه، تعداد نمایش را افزایش بده
        try {
            const sentinel = document.getElementById('moments-sentinel');
            if (sentinel) {
                const io = new IntersectionObserver((entries)=>{
                    entries.forEach(entry=>{
                        if (entry.isIntersecting) {
                            window._momentsPage.extra = (window._momentsPage.extra || 0) + 10;
                            window.renderMomentsList();
                        }
                    });
                }, { root: document.getElementById('employee-main-content'), threshold: 0.2 });
                io.observe(sentinel);
            }
        } catch {}
        return;
    }
        // [!code start]
    // بخش جدید برای داشبورد مدیر تیم
    else if (pageName === 'team-performance') {
      const myTeam = state.teams.find(t => t.leadership?.manager === employee.id);
        if (!myTeam) {
            contentContainer.innerHTML = `<p>شما مدیر هیچ تیمی نیستید.</p>`;
            return;
        }
        const teamMembers = state.employees.filter(e => myTeam.memberIds.includes(e.id));
        const activeCycle = (state.evaluationCycles || []).find(c => c.status === 'active');

        if (!activeCycle) {
            contentContainer.innerHTML = `<div class="card p-6 text-center"><h3 class="font-bold text-lg">داشبورد ارزیابی تیم: ${myTeam.name}</h3><p class="mt-4 text-slate-500">در حال حاضر هیچ دوره ارزیابی فعالی وجود ندارد.</p></div>`;
            return;
        }

// فایل: js/main.js - داخل تابع renderEmployeePortalPage و بلوک 'team-performance'

const tableRows = teamMembers.map(member => {
    const evaluation = (state.employeeEvaluations || []).find(e => e.employeeId === member.id && e.cycleId === activeCycle.firestoreId);
    
    let statusText = "شروع نشده";
    let statusColor = "bg-slate-100 text-slate-800";

    // ▼▼▼ این بخش اصلاح شده است ▼▼▼
    if (evaluation?.status === 'pending_self_assessment') {
        statusText = "در انتظار خودارزیابی";
        statusColor = "bg-orange-100 text-orange-800";
    } else if (evaluation?.status === 'pending_manager_assessment') { // <-- اصلاح کلیدی
        statusText = "آماده ارزیابی مدیر";
        statusColor = "bg-blue-100 text-blue-800";
    } else if (evaluation?.status === 'completed') {
        statusText = "تکمیل شده";
        statusColor = "bg-green-100 text-green-800";
    }
    // ▲▲▲ پایان بخش اصلاح شده ▲▲▲

    return `
        <tr class="border-b">
            <td class="p-3"><div class="flex items-center gap-3"><img src="${member.avatar}" class="w-8 h-8 rounded-full object-cover"><span>${member.name}</span></div></td>
            <td class="p-3">${member.jobTitle || ''}</td>
            <td class="p-3"><span class="px-2 py-1 text-xs font-medium rounded-full ${statusColor}">${statusText}</span></td>
            <td class="p-3 text-left"><button class="view-evaluation-btn primary-btn text-xs py-1.5 px-3" data-employee-id="${member.firestoreId}" data-cycle-id="${activeCycle.firestoreId}">مشاهده / ارزیابی</button></td>
        </tr>
    `;
}).join('');

        contentContainer.innerHTML = `
            <h1 class="text-3xl font-bold text-slate-800 mb-6">داشبورد ارزیابی تیم: ${myTeam.name}</h1>
            <div class="card p-0">
                <div class="p-4 border-b"><h3 class="font-semibold">وضعیت ارزیابی اعضا در دوره: ${activeCycle.title}</h3></div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-50"><tr><th class="p-3 text-right">نام عضو</th><th class="p-3 text-right">پوزیشن</th><th class="p-3 text-right">وضعیت</th><th class="p-3 text-right"></th></tr></thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            </div>
        `;
    }
    // [!code end]
    // [!code start]
    // ▼▼▼ این بلوک کد جدید را به اینجا اضافه کنید ▼▼▼
    else if (pageName === 'evaluations') {
        contentContainer.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-3xl font-bold text-slate-800">ارزیابی‌های من</h1>
            </div>
            <div class="card p-0">
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-50">
                            <tr>
                                <th class="p-3 text-right">عنوان دوره</th>
                                <th class="p-3 text-right">تاریخ ایجاد</th>
                                <th class="p-3 text-right">وضعیت</th>
                                <th class="p-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody id="my-evaluations-tbody"></tbody>
                    </table>
                </div>
            </div>
        `;

        const myEvaluations = (state.employeeEvaluations || [])
            .filter(ev => ev.employeeId === employee.id)
            .sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));

        const tbody = contentContainer.querySelector('#my-evaluations-tbody');
        if (myEvaluations.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center p-6 text-slate-500">هیچ ارزیابی برای شما ثبت نشده است.</td></tr>`;
            return;
        }

        const statusMap = {
            'pending_self_assessment': { text: 'در انتظار خودارزیابی', color: 'bg-orange-100 text-orange-800' },
            'pending_manager_assessment': { text: 'در انتظار ارزیابی مدیر', color: 'bg-blue-100 text-blue-800' },
            'completed': { text: 'تکمیل شده', color: 'bg-green-100 text-green-800' }
        };

        const rowsHtml = myEvaluations.map(ev => {
            const cycle = state.evaluationCycles.find(c => c.firestoreId === ev.cycleId) || { title: ev.cycleId };
            const status = statusMap[ev.status] || { text: ev.status, color: 'bg-slate-100' };

            let actionButton = '';
            if (ev.status === 'pending_self_assessment') {
                actionButton = `<button class="start-self-assessment-btn primary-btn text-xs py-1.5 px-3" data-id="${ev.firestoreId}">شروع خودارزیابی</button>`;
            } else {
                actionButton = `<button class="view-completed-assessment-btn secondary-btn text-xs py-1.5 px-3" data-id="${ev.firestoreId}" disabled>مشاهده</button>`;
            }

            return `
                <tr class="border-b">
                    <td class="p-3 font-semibold">${cycle.title}</td>
                    <td class="p-3">${toPersianDate(ev.createdAt)}</td>
                    <td class="p-3"><span class="px-2 py-1 text-xs font-medium rounded-full ${status.color}">${status.text}</span></td>
                    <td class="p-3 text-left">${actionButton}</td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rowsHtml;
    }
    // [!code end]

    // --- بخش پیش‌فرض ---
    else {
        contentContainer.innerHTML = `<div class="text-center p-10"><h1>صفحه مورد نظر یافت نشد</h1></div>`;
       
    }

        // [!code start]
    // فراخوانی listener مخصوص هر صفحه
    if (pageName === 'team-performance') {
        setupTeamPerformanceListeners();
    }
    // [!code end]
    
    lucide.createIcons();
}

// در فایل js/main.js
// این بخش را به تابع setupEmployeePortalEventListeners اضافه کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید جایگزین کنید

// کل این تابع را با نسخه جدید جایگزین کنید
// در فایل js/main.js
// کل این تابع را با نسخه جدید جایگزین کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید جایگزین کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

function setupEmployeePortalEventListeners(employee, auth, signOut) {
    // دکمه خروج از حساب
    document.getElementById('portal-logout-btn')?.addEventListener('click', () => {
        signOut(auth).catch(err => console.error("Logout Error:", err));
    });
    
    // دکمه تغییر رمز عبور
    // مدیریت رمز عبور به هدر منتقل شده یا در آینده اضافه می‌شود

    // دکمه زنگوله نوتیفیکیشن
    document.getElementById('portal-notification-bell-btn')?.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const inboxLink = document.querySelector('.nav-item[href="#inbox"]');
        if (inboxLink) inboxLink.classList.add('active');
        renderEmployeePortalPage('inbox', employee);
    });
    // همبرگری
    document.getElementById('portal-menu-btn')?.addEventListener('click', () => {
        const aside = document.querySelector('.employee-sidebar');
        const overlay = document.getElementById('portal-sidebar-overlay');
        if (!aside) return;
        const willShow = aside.classList.contains('hidden');
        aside.classList.toggle('hidden');
        if (overlay) overlay.classList.toggle('hidden', !willShow);
    });
    document.getElementById('portal-sidebar-overlay')?.addEventListener('click', () => {
        const aside = document.querySelector('.employee-sidebar');
        const overlay = document.getElementById('portal-sidebar-overlay');
        if (aside) aside.classList.add('hidden');
        if (overlay) overlay.classList.add('hidden');
    });

    // دکمه‌های منوی ناوبری
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            link.classList.add('active');
            const pageName = link.getAttribute('href').substring(1);
            renderEmployeePortalPage(pageName, employee);
        });
    });

    // اکشن‌های سریع هدر
    document.getElementById('quick-new-request-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        showNewRequestForm(employee);
    });
    document.getElementById('quick-edit-profile-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        showMyProfileEditForm(employee);
    });
    document.getElementById('quick-change-password-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        showChangePasswordForm();
    });
    // Dark mode toggle
    const root = document.documentElement;
    const applyTheme = (theme) => { if (theme === 'dark') { document.body.classList.add('theme-dark'); } else { document.body.classList.remove('theme-dark'); } };
    const savedTheme = localStorage.getItem('portalTheme');
    if (savedTheme) applyTheme(savedTheme);
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
        const next = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
        localStorage.setItem('portalTheme', next);
        applyTheme(next);
    });
    const mobileOptionsBtn = document.getElementById('mobile-options-btn');
    const mobileDropdown = document.getElementById('mobile-options-dropdown');

    mobileOptionsBtn?.addEventListener('click', (e) => {
        e.stopPropagation(); // جلوگیری از بسته شدن فوری منو توسط event listener پایین
        mobileDropdown?.classList.toggle('hidden');
    });

    // بستن منو با کلیک در هر جای دیگر صفحه
    document.addEventListener('click', (e) => {
        if (!mobileOptionsBtn?.contains(e.target) && !mobileDropdown?.contains(e.target)) {
            mobileDropdown?.classList.add('hidden');
        }
    });

    // تعریف عملکرد برای آیتم‌های داخل منوی موبایل
    document.getElementById('mobile-edit-profile')?.addEventListener('click', (e) => {
        e.preventDefault();
        showMyProfileEditForm(employee);
        mobileDropdown?.classList.add('hidden'); // بستن منو پس از کلیک
    });
    document.getElementById('mobile-change-password')?.addEventListener('click', (e) => {
        e.preventDefault();
        showChangePasswordForm();
        mobileDropdown?.classList.add('hidden');
    });
    document.getElementById('mobile-theme-toggle')?.addEventListener('click', (e) => {
        e.preventDefault();
        const next = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
        localStorage.setItem('portalTheme', next);
        applyTheme(next);
        mobileDropdown?.classList.add('hidden');
    });
    document.getElementById('mobile-new-request')?.addEventListener('click', (e) => {
        e.preventDefault();
        showNewRequestForm(employee);
        mobileDropdown?.classList.add('hidden');
    });
    // ▲▲▲ پایان بخش جدید ▲▲▲

    // مدیریت رویدادهای داخل محتوای اصلی
    const mainContent = document.getElementById('employee-main-content');
    if (mainContent) {
        mainContent.addEventListener('click', (e) => {
                      // [!code start]
            // ▼▼▼ این بلوک کد جدید را به اینجا اضافه کنید ▼▼▼
            const selfAssessBtn = e.target.closest('.start-self-assessment-btn');
            if (selfAssessBtn) {
                const evaluationId = selfAssessBtn.dataset.id;
                const evaluation = state.employeeEvaluations.find(ev => ev.firestoreId === evaluationId);
                if (evaluation) {
                    showSelfAssessmentForm(evaluation);
                }
                return; 
            }
            // [!code end]
            
            
            // بستن حباب اطلاعیه
            const closeInfo = e.target.closest('#dismiss-info');
            if (closeInfo) {
                const bubble = document.getElementById('info-bubble');
                const infoId = bubble?.getAttribute('data-info-id');
                const uid = (state.currentUser && state.currentUser.uid) || employee?.uid;
                if (uid && infoId) {
                    try { localStorage.setItem(`dismiss_info_${uid}`, infoId); } catch {}
                }
                bubble?.remove();
                return;
            }
            const empDocsBtn = e.target.closest('.doc-category-btn');
            if (empDocsBtn) {
                const key = empDocsBtn.getAttribute('data-category');
                if (key) {
                    showViewCategoryDocsModal(key);
                }
            }
            if (e.target.closest('#edit-my-profile-btn')) {
                showMyProfileEditForm(employee);
            }
            if (e.target.closest('#add-new-request-btn')) {
                showNewRequestForm(employee);
            }
            // مشاهده همه درخواست‌ها از داشبورد
            const viewAllRequestsBtn = e.target.closest('#view-all-requests-btn');
            if (viewAllRequestsBtn) {
                document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                const reqLink = document.querySelector('.nav-item[href="#requests"]');
                if (reqLink) reqLink.classList.add('active');
                renderEmployeePortalPage('requests', employee);
            }
            // مشاهده جزئیات درخواست در پورتال کارمند
            const viewRequestBtn = e.target.closest('.view-request-btn');
            if (viewRequestBtn) {
                const requestId = viewRequestBtn.dataset.id;
                if (requestId) {
                    showRequestDetailsModal(requestId, employee);
                }
            }
            // مشاهده پیام صندوق پیام در پورتال کارمند
            const viewMessageBtn = e.target.closest('.view-message-btn');
            if (viewMessageBtn) {
                const announcementId = viewMessageBtn.dataset.id;
                if (announcementId) {
                    showMessageDetailsModal(announcementId);
                }
            }
                    // [!code start]
        const startSelfAssessmentBtn = e.target.closest('#start-self-assessment-btn');
        if (startSelfAssessmentBtn) {
            const cycleId = startSelfAssessmentBtn.dataset.cycleId;
            const cycle = (state.evaluationCycles || []).find(c => c.firestoreId === cycleId);
            if (cycle) {
                showSelfAssessmentForm(employee, cycle);
            }
        }
        // [!code end]
            // مشاهده اعضای تیم و OKR در دایرکتوری
            const viewTeamBtn = e.target.closest('.view-team-employee-btn');
            if (viewTeamBtn) {
                const teamId = viewTeamBtn.dataset.teamId;
                const team = state.teams.find(t => t.firestoreId === teamId);
                if (team) {
                    showTeamDirectoryModal(team);
                }
            }
                        const requestEditBtn = e.target.closest('.request-edit-btn');
            if (requestEditBtn) {
                const field = requestEditBtn.dataset.field;
                (async () => {
                    try {
                        await addDoc(collection(db, `artifacts/${appId}/public/data/requests`), {
                            uid: employee.uid,
                            employeeId: employee.id,
                            employeeName: employee.name,
                            requestType: 'درخواست ویرایش اطلاعات',
                            details: `درخواست ویرایش ${field}`,
                            status: 'درحال بررسی',
                            createdAt: serverTimestamp()
                        });

                        // دکمه را غیرفعال کرده و به کاربر اطلاع می‌دهیم
                        requestEditBtn.innerText = 'درخواست ارسال شد';
                        requestEditBtn.disabled = true;
                        showToast('درخواست ویرایش شما برای ادمین ارسال شد.');

                    } catch (err) {
                        showToast('خطا در ارسال درخواست.', 'error');
                        console.error("Error sending edit request:", err);
                    }
                })();
            }
            const sendWishBtn = e.target.closest('.send-wish-btn');
            if (sendWishBtn) {
                showBirthdayWishForm(sendWishBtn.dataset.id, sendWishBtn.dataset.name);
            }
            // ارسال لحظه جدید
// فایل: js/main.js - داخل تابع setupEmployeePortalEventListeners
// ... داخل mainContent.addEventListener('click', ...)
        
        const postBtn = e.target.closest('#moment-post-btn');
        if (postBtn) {
            (async () => {
                let loadingToast = null;
                try {
                    const text = (document.getElementById('moment-text') || {}).value?.trim() || '';
                    const fileInput = document.getElementById('moment-image');
                    const file = fileInput?.files?.[0];

                    if ((text && file) || (!text && !file)) {
                        showToast('فقط متن یا فقط عکس را انتخاب کنید.', 'error');
                        return;
                    }
                    
                    let imageUrl = '';
                    if (file) {
                        // ▼▼▼ اینجا از تابع جدید برای تغییر سایز و آپلود استفاده می‌کنیم ▼▼▼
                        imageUrl = await resizeAndUploadMomentImage(file, employee.uid);
                    }
                    
                    // بعد از اتمام آپلود، اعلان "در حال آپلود" حذف می‌شود
                    // این بخش به صورت خودکار توسط تابع resizeAndUploadMomentImage مدیریت می‌شود.

                    await addDoc(collection(db, `artifacts/${appId}/public/data/moments`), {
                        ownerUid: employee.uid,
                        ownerName: employee.name,
                        text: text || '',
                        imageUrl,
                        reactions: [],
                        createdAt: serverTimestamp()
                    });

                    if (document.getElementById('moment-text')) document.getElementById('moment-text').value = '';
                    if (fileInput) fileInput.value = '';
                    showToast('لحظه شما با موفقیت منتشر شد.');
                } catch (err) {
                    showToast('خطا در انتشار لحظه.', 'error');
                    console.error("Error posting moment:", err);
                } finally {
                    // پاک کردن تمام اعلان‌های "در حال پردازش"
                    const processingToasts = document.querySelectorAll('.toast');
                    processingToasts.forEach(t => {
                        if (t.innerText.includes("در حال بهینه‌سازی")) t.remove();
                    });
                }
            })();
            return;
        }

            // ری‌اکشن روی لحظه
            const reactBtn = e.target.closest('.moment-react-btn');
            if (reactBtn) {
                (async () => {
                    const id = reactBtn.dataset.id;
                    const emoji = reactBtn.dataset.emoji;
                    try {
                        const docRef = doc(db, `artifacts/${appId}/public/data/moments`, id);
                        const snap = await getDoc(docRef);
                        const data = snap.data() || {}; const reactions = data.reactions || [];
                        const mineIdx = reactions.findIndex(r => r.uid === employee.uid);
                        if (mineIdx >= 0) {
                            if (reactions[mineIdx].emoji === emoji) { reactions.splice(mineIdx,1); } else { reactions[mineIdx].emoji = emoji; }
                        } else {
                            reactions.push({ uid: employee.uid, emoji });
                        }
                        await updateDoc(docRef, { reactions, lastUpdatedAt: serverTimestamp() });
                    } catch (err) { showToast('خطا در ثبت واکنش.', 'error'); }
                })();
                return;
            }
            const deleteBtn = e.target.closest('.moment-delete-btn');
            if (deleteBtn) {
                const docId = deleteBtn.dataset.id;
                showConfirmationModal('حذف لحظه', 'آیا از حذف این پست مطمئن هستید؟ این عمل غیرقابل بازگشت است.', async () => {
                    try {
                        const momentToDelete = state.moments.find(m => m.firestoreId === docId);
                        if (momentToDelete && momentToDelete.imageUrl) {
                            const imageRef = ref(storage, momentToDelete.imageUrl);
                            await deleteObject(imageRef).catch(err => {
                                console.error("Image deletion failed, but proceeding with doc deletion:", err);
                            });
                        }
                        
                        await deleteDoc(doc(db, `artifacts/${appId}/public/data/moments`, docId));
                        showToast('پست با موفقیت حذف شد.');
                    } catch (error) {
                        console.error("Error deleting moment:", error);
                        showToast('خطا در حذف پست.', 'error');
                    }
                });
                return; 
            }
        });
    }
}
// فایل: js/main.js - این تابع کمکی را اضافه کنید
// فایل: js/main.js
// ▼▼▼ این تابع را با نسخه اشکال‌زدایی زیر جایگزین کنید ▼▼▼

function renderEmployeePortal() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('dashboard-container').classList.add('hidden');
    
    const portalContainer = document.getElementById('employee-portal-container');
    portalContainer.classList.remove('hidden');

    const employee = state.employees.find(emp => emp.uid === state.currentUser.uid);
    if (!employee) {
        portalContainer.innerHTML = `<div class="text-center p-10"><h2 class="text-xl font-bold text-red-600">خطا: پروفایل یافت نشد.</h2></div>`;
        return;
    }

    // ۱. بررسی اینکه آیا کاربر مدیر است و ساخت لینک مربوطه
     const managerNavlink = isTeamManager(employee) 
        ? `<a href="#team-performance" class="nav-item"><i data-lucide="users-2"></i><span>مدیریت تیم من</span></a>` 
        : '';


    const employeeName = employee.name || state.currentUser.email;

    portalContainer.innerHTML = `
        <div class="flex h-screen" style="background:#F5F6FA;">
            <aside class="w-72 employee-sidebar hidden sm:flex z-30">
                <div class="text-center"><img src="${employee.avatar}" alt="Avatar" class="profile-pic object-cover"><h2 class="employee-name">${employeeName}</h2><p class="employee-title">${employee.jobTitle || 'بدون عنوان شغلی'}</p></div><div class="my-6 border-t border-white/20"></div>
<nav id="employee-portal-nav" class="flex flex-col gap-2">
    <a href="#profile" class="nav-item active"><i data-lucide="layout-dashboard"></i><span>مسیر من</span></a>
    ${managerNavlink}  <a href="#evaluations" class="nav-item"><i data-lucide="clipboard-check"></i><span>ارزیابی‌های من</span></a>
    <a href="#requests" class="nav-item"><i data-lucide="send"></i><span>کارهای من</span></a>
    <a href="#directory" class="nav-item"><i data-lucide="users"></i><span>تیم‌ها</span></a>
    <a href="#documents" class="nav-item"><i data-lucide="folder-kanban"></i><span>دانش‌نامه</span></a>
    <a href="#inbox" class="nav-item"><i data-lucide="inbox"></i><span>پیام‌ها</span></a>
    <a href="#moments" class="nav-item"><i data-lucide="sparkles"></i><span>لحظه‌های نیک‌اندیشی</span></a>
</nav>
                <div class="mt-auto space-y-4"><button id="portal-logout-btn" class="w-full flex items-center justify-center gap-3 px-4 py-2 rounded-lg logout-btn"><i data-lucide="log-out"></i><span>خروج از حساب</span></button></div>
            </aside>

            <div class="flex-1 flex flex-col h-screen overflow-y-hidden relative">
                <div id="portal-sidebar-overlay" class="hidden fixed inset-0 bg-black/40 z-20 sm:hidden"></div>
                <div class="blob" style="top:-40px; right:-60px; width:220px; height:220px; background:#FF6A3D"></div>
                <div class="blob" style="bottom:-60px; left:-40px; width:180px; height:180px; background:#F72585"></div>
                
                <header style="background:linear-gradient(90deg,#FF6A3D,#F72585)" class="shadow-sm relative z-20">
                    <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <button id="portal-menu-btn" class="inline-flex sm:hidden items-center justify-center p-2 rounded-md bg-white/20 hover:bg-white/30 text-white" title="منو"><i data-lucide="menu" class="w-5 h-5"></i></button>
                            <img src="logo.png" alt="Logo" class="w-8 h-8 rounded-md ring-2 ring-white/30">
                            <div class="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/30"><img src="${employee.avatar}" alt="${employeeName}" class="w-full h-full object-cover"></div>
                            <div><div class="text-white/80 text-xs">خوش آمدید</div><h1 class="text-2xl font-bold text-white">${employeeName}</h1></div>
                        </div>
                        <div class="flex items-center gap-2">
                            <div id="okr-pill" class="hidden sm:flex items-center gap-2 text-xs font-bold bg-white/20 text-white px-3 py-2 rounded-full"><i data-lucide="target" class="w-4 h-4"></i><span id="okr-pill-text">OKR: 0%</span></div>
                            <button id="quick-new-request-btn" class="hidden sm:inline-flex items-center gap-2 text-xs font-semibold bg-white/15 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition"><i data-lucide="plus" class="w-4 h-4"></i><span>ثبت درخواست</span></button>
                            <button id="quick-edit-profile-btn" class="hidden sm:inline-flex items-center gap-2 text-xs font-semibold bg-white/80 hover:bg-white text-slate-800 px-3 py-2 rounded-lg transition"><i data-lucide="user-cog" class="w-4 h-4"></i><span>ویرایش پروفایل</span></button>
                            <button id="quick-change-password-btn" class="hidden sm:inline-flex items-center gap-2 text-xs font-semibold bg-white/80 hover:bg-white text-slate-800 px-3 py-2 rounded-lg transition"><i data-lucide="key-round" class="w-4 h-4"></i><span>رمز عبور</span></button>
                            <button id="theme-toggle-btn" class="hidden sm:inline-flex items-center gap-2 text-xs font-semibold bg-white/15 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition" title="حالت تیره/روشن"><i data-lucide="moon" class="w-4 h-4"></i><span>حالت تیره</span></button>
                            <div class="relative sm:hidden">
                                <button id="mobile-options-btn" class="p-2 rounded-full text-white hover:bg-white/20 transition-colors"><i data-lucide="more-vertical" class="w-5 h-5"></i></button>
                                <div id="mobile-options-dropdown" class="hidden absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-30 text-slate-700">
                                    <a href="#" id="mobile-edit-profile" class="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 text-sm"><i data-lucide="user-cog" class="w-4 h-4"></i><span>ویرایش پروفایل</span></a>
                                    <a href="#" id="mobile-change-password" class="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 text-sm"><i data-lucide="key-round" class="w-4 h-4"></i><span>رمز عبور</span></a>
                                    <a href="#" id="mobile-theme-toggle" class="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 text-sm"><i data-lucide="moon" class="w-4 h-4"></i><span>تغییر تم</span></a>
                                    <a href="#" id="mobile-new-request" class="flex items-center gap-3 px-4 py-2 border-t hover:bg-slate-100 text-sm"><i data-lucide="plus" class="w-4 h-4"></i><span>ثبت درخواست</span></a>
                                </div>
                            </div>
                            <div id="portal-notification-bell-wrapper" class="relative">
                                <button id="portal-notification-bell-btn" class="relative cursor-pointer p-2 rounded-full hover:bg-white/10"><i data-lucide="bell" class="text-white"></i><span id="portal-notification-count" class="hidden absolute -top-1 -right-1 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full border-2 border-white" style="background:#FF2E63"></span></button>
                            </div>
                        </div>
                    </div>
                </header>
                <main id="employee-main-content" class="flex-1 p-6 sm:p-10 overflow-y-auto relative z-10"></main>
            </div>
        </div>
    `;
    
    lucide.createIcons();
    renderEmployeePortalPage('profile', employee);
    setupEmployeePortalEventListeners(employee, auth, signOut);
    updateEmployeeNotificationBell(employee);

    // Update OKR pill with simple average progress if exists
    try {
        const okrs = employee.okrs || [];
        const okrAvg = okrs.length ? Math.round(okrs.reduce((s, o)=> s + (o.progress||0), 0) / okrs.length) : 0;
        const okrPill = document.getElementById('okr-pill');
        const okrText = document.getElementById('okr-pill-text');
        if (okrPill && okrText) {
            okrText.textContent = `OKR: ${okrAvg}%`;
            okrPill.classList.remove('hidden');
        }
    } catch {}

    // Birthday postcard + confetti if today is user's birthday
    try {
        const bd = employee.personalInfo?.birthDate ? new Date(employee.personalInfo.birthDate) : null;
        const now = new Date();
        if (bd && bd.getMonth() === now.getMonth() && bd.getDate() === now.getDate() && !localStorage.getItem('birthdayPostcardShown')) {
            // Confetti
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            for (let i=0; i<150; i++) {
                const piece = document.createElement('i');
                piece.style.left = Math.random()*100 + 'vw';
                piece.style.background = ['#6B69D6','#8B5CF6','#22D3EE','#F59E0B','#10B981','#F72585'][Math.floor(Math.random()*6)];
                piece.style.animationDelay = (Math.random()*1.2)+'s';
                confetti.appendChild(piece);
            }
            document.body.appendChild(confetti);

            // Postcard modal
            const wishes = (state.birthdayWishes || []).filter(w => w.targetUid === employee.uid).sort((a,b)=> new Date(b.createdAt?.toDate?.()||0) - new Date(a.createdAt?.toDate?.()||0));
            const wishesHtml = wishes.map(w => `<div class=\"p-3 rounded-lg bg-white/80 backdrop-blur border mt-2\"><p class=\"text-slate-700 text-sm\">${w.message}</p><p class=\"text-xs text-slate-500 text-left mt-1\">- ${w.wisherName}</p></div>`).join('') || '<p class=\"text-sm text-slate-600\">اولین پیام تبریک را دریافت کنید! 🎉</p>';
            modalTitle.innerText = '🎂 کارت پستال تولد';
            modalContent.innerHTML = `
                <div class=\"rounded-2xl overflow-hidden border\" style=\"background:linear-gradient(135deg,#FFDEE9 0%, #B5FFFC 100%)\">
                    <div class=\"p-6 sm:p-8\">
                        <div class=\"flex items-center gap-3\">
                            <div class=\"w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center\"><i data-lucide=\"party-popper\" class=\"w-6 h-6\" style=\"color:#F72585\"></i></div>
                            <div>
                                <div class=\"text-sm text-slate-600\">تولدت مبارک ${employee.name}!</div>
                                <div class=\"text-lg font-extrabold text-slate-800\">یک سال پر از موفقیت پیش‌رو داشته باشی</div>
                            </div>
                        </div>
                        <div class=\"mt-4\">${wishesHtml}</div>
                    </div>
                </div>`;
            openModal(mainModal, mainModalContainer);
            setTimeout(()=> confetti.remove(), 3200);
            localStorage.setItem('birthdayPostcardShown', String(now.getFullYear()));
        }
    } catch {}
}
        // --- UTILITY & HELPER FUNCTIONS ---
        // --- تابع جدید برای تبدیل تاریخ به شمسی ---
        // --- تابع جدید برای تبدیل اعداد فارسی به انگلیسی ---
    const convertPersianNumbersToEnglish = (str) => {
        if (!str) return '';
        return str.toString()
            .replace(/۱/g, '1')
            .replace(/۲/g, '2')
            .replace(/۳/g, '3')
            .replace(/۴/g, '4')
            .replace(/۵/g, '5')
            .replace(/۶/g, '6')
            .replace(/۷/g, '7')
            .replace(/۸/g, '8')
            .replace(/۹/g, '9')
            .replace(/۰/g, '0');
    };

function clearEventListeners(element) {
    if (!element) return;
    const parent = element.parentNode;
    const newElement = element.cloneNode(true);
    if (parent) {
        parent.replaceChild(newElement, element);
    }
    // برگرداندن عنصر جدید برای مواقعی که نیاز به ارجاع مجدد داریم
    return newElement; 
}
// فایل: js/main.js
// این دو تابع جدید را به طور کامل به فایل اضافه کنید ▼

/**
 * تمام یادآورهای آینده را از state استخراج، فیلتر و مرتب می‌کند.
 */
const getAllUpcomingReminders = () => {
    const contractReminders = (() => {
        const list = [];
        const now = new Date();
        (state.employees || []).forEach(emp => {
            const last = (emp.contracts || []).sort((a,b)=> new Date(b.endDate||0) - new Date(a.endDate||0))[0];
            if (!last || !last.endDate) return;
            const end = new Date(last.endDate);
            const diffDays = Math.ceil((end - now) / 86400000);
            if (diffDays <= 30 && diffDays >= 0) {
                list.push({ icon: 'file-clock', text: `تمدید قرارداد ${emp.name}`, subtext: `تاریخ پایان: ${toPersianDate(last.endDate)}`, date: end, assignedTo: (state.users.find(u=>u.role==='admin')||{}).firestoreId });
            }
        });
        return list;
    })();

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return [...(state.reminders || []), ...contractReminders]
        .filter(r => {
            const reminderDate = new Date(r.date?.toDate ? r.date.toDate() : r.date);
            return reminderDate >= now;
        })
        .sort((a, b) => new Date(a.date?.toDate ? a.date.toDate() : a.date) - new Date(b.date?.toDate ? b.date.toDate() : b.date));
};

/**
 * یک لیست از آیتم‌های یادآور را به HTML تبدیل می‌کند و منطق شمارش معکوس را پیاده‌سازی می‌کند.
 */
const renderReminderItems = (reminders) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const oneDay = 1000 * 60 * 60 * 24;

    const colorClasses = {
        'file-clock': { bg: 'bg-yellow-50', text: 'text-yellow-600' },
        'cake': { bg: 'bg-pink-50', text: 'text-pink-600' },
        'award': { bg: 'bg-blue-50', text: 'text-blue-600' },
        'clipboard-x': { bg: 'bg-teal-50', text: 'text-teal-600' },
        'calendar-plus': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
        'message-square-plus': { bg: 'bg-gray-100', text: 'text-gray-600' }
    };

    return reminders.map(r => {
        const colors = colorClasses[r.icon] || colorClasses['calendar-plus'];
        const assignee = state.users.find(u => u.firestoreId === r.assignedTo);
        
        // --- منطق جدید برای شمارش معکوس پویا ---
        const reminderDate = new Date(r.date?.toDate ? r.date.toDate() : r.date);
        const daysUntil = Math.round((reminderDate - now) / oneDay);
        
        let subtext = r.subtext;
        // برای انواع خاصی از یادآورها، متن پویا تولید می‌کنیم
        if (['تولد', 'سالگرد استخدام'].includes(r.type)) {
            if (daysUntil === 0) {
                subtext = 'امروز!';
            } else if (daysUntil === 1) {
                subtext = 'فردا';
            } else {
                subtext = `${daysUntil} روز دیگر`;
            }
        } else {
            subtext = r.subtext || `تاریخ: ${toPersianDate(r.date)}`;
        }
        
        let statusHtml = '';
        if (r.status === 'انجام شده') {
            statusHtml = `<p class="mt-1 text-xs text-green-600 font-semibold border-t border-green-200 pt-1">انجام شد: ${r.processingNotes || ''}</p>`;
        } else if (r.status === 'در حال انجام') {
            statusHtml = `<p class="mt-1 text-xs text-blue-600 font-semibold border-t border-blue-200 pt-1">در حال انجام توسط ${assignee ? assignee.name : ''}...</p>`;
        } else if (assignee) {
             statusHtml = `<p class="mt-1 text-xs text-slate-500 border-t border-slate-200 pt-1">به ${assignee.name} واگذار شده</p>`;
        }

        return `
            <div class="flex items-start p-3 ${colors.bg} rounded-xl">
                <i data-lucide="${r.icon}" class="w-5 h-5 ${colors.text} ml-3 mt-1 flex-shrink-0"></i>
                <div class="w-full">
                    <p class="font-medium text-sm">${r.text}</p>
                    <p class="text-xs text-slate-500 mt-0.5">${subtext}</p>
                    ${statusHtml}
                </div>
            </div>
        `;
    }).join('');
};
// فایل: js/main.js
// این تابع جدید را هم اضافه کنید ▼

const showAllRemindersModal = () => {
    const allReminders = getAllUpcomingReminders();
    modalTitle.innerText = 'تمام یادآورهای هوشمند فعال';
    
    if (allReminders.length === 0) {
        modalContent.innerHTML = '<p class="text-center text-slate-500 p-8">یادآوری فعالی برای نمایش وجود ندارد.</p>';
    } else {
        modalContent.innerHTML = `<div class="space-y-3 max-h-[70vh] overflow-y-auto pr-2">${renderReminderItems(allReminders)}</div>`;
    }
    
    openModal(mainModal, mainModalContainer);
    lucide.createIcons();
};
const toPersianDate = (dateInput) => {
    if (!dateInput) return 'نامشخص';
    try {
        let date;
        if (dateInput.toDate) { // Handle Firebase Timestamps
            date = dateInput.toDate();
        } else {
            date = new Date(dateInput);
        }

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            return 'تاریخ نامعتبر';
        }

        const gYear = date.getFullYear();
        const gMonth = date.getMonth() + 1; // JS month is 0-indexed
        const gDay = date.getDate();

        const jalaaliDate = jalaali.toJalaali(gYear, gMonth, gDay);

        // Add leading zero to month and day if needed
        const jm = String(jalaaliDate.jm).padStart(2, '0');
        const jd = String(jalaaliDate.jd).padStart(2, '0');

        return `${jalaaliDate.jy}/${jm}/${jd}`;
    } catch (error) {
        console.error("Error converting date:", dateInput, error);
        return 'نامشخص';
    }
};
// --- تابع جدید برای تبدیل تاریخ شمسی ورودی به فرمت میلادی برای ذخیره ---
// --- نسخه نهایی و بسیار قوی‌تر برای تبدیل تاریخ شمسی به میلادی ---
const persianToEnglishDate = (persianDateStr) => {
    // اگر ورودی خالی یا null است، null برگردان
    if (!persianDateStr) return null;

    // گاهی اوقات کتابخانه تقویم ممکن است یک timestamp عددی برگرداند
    // اگر ورودی یک عدد است، آن را مستقیماً به تاریخ میلادی تبدیل کن
    if (!isNaN(persianDateStr) && typeof persianDateStr !== 'string') {
        const date = new persianDate(parseInt(persianDateStr));
        const formatted = date.format('YYYY-MM-DD');
        console.log(`ورودی عددی شناسایی شد، تبدیل شده به: ${formatted}`);
        return formatted;
    }
    
    // اعداد فارسی را به انگلیسی تبدیل کن
    let englishDateStr = convertPersianNumbersToEnglish(persianDateStr);

    // چک کن که فرمت تاریخ YYYY/MM/DD باشد
    if (!/^\d{4}\/\d{2}\/\d{2}$/.test(englishDateStr)) {
        console.error("فرمت تاریخ شمسی نامعتبر است. فرمت مورد انتظار YYYY/MM/DD است اما ورودی:", englishDateStr);
        // اگر فرمت اشتباه بود، null برگردان تا دیتای اشتباه ذخیره نشود
        return null;
    }

    try {
        const [jy, jm, jd] = englishDateStr.split('/').map(Number);
        // اطمینان از معتبر بودن اعداد سال، ماه و روز
        if (jy < 1000 || jm < 1 || jm > 12 || jd < 1 || jd > 31) {
             console.error("اعداد تاریخ شمسی نامعتبر است:", { jy, jm, jd });
             return null;
        }
        const gregorian = jalaali.toGregorian(jy, jm, jd);
        // نتیجه نهایی را با فرمت YYYY-MM-DD برگردان
        return `${gregorian.gy}-${String(gregorian.gm).padStart(2, '0')}-${String(gregorian.gd).padStart(2, '0')}`;
    } catch (error) {
        console.error("خطا در تبدیل تاریخ شمسی به میلادی:", error);
        return null;
    }
};
// --- نسخه نهایی با استراتژی Lazy Initialization (ساخت تقویم فقط در زمان کلیک) ---
// در فایل js/main.js
// کل این تابع را با نسخه جدید جایگزین کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید جایگزین کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید جایگزین کنید

// فایل: main.js
// کل این تابع را با نسخه جدید جایگزین کنید
// فایل: main.js
// این نسخه نهایی، مشکل خطا را حل می‌کند
const activatePersianDatePicker = (elementId, initialValue = null) => {
    const input = $(`#${elementId}`);
    if (!input.length) return;

    // استفاده از setTimeout برای اطمینان از آمادگی کامل DOM
    setTimeout(() => {
        try {
            if (input.data('datepicker')) {
                input.persianDatepicker('destroy');
            }

            let initialTimestamp = null;
            if (initialValue) {
                const date = new Date(initialValue);
                if (!isNaN(date.getTime())) {
                    initialTimestamp = date.getTime();
                }
            }

            input.persianDatepicker({
                format: 'YYYY/MM/DD',
                autoClose: true,
                observer: false,
                initialValue: !!initialValue,
                initialValueType: 'persian',
                toolbox: {
                    calendarSwitch: { enabled: false },
                    todayButton: { enabled: true, text: { fa: 'امروز' } },
                },
                selectedDate: initialTimestamp ? new Date(initialTimestamp) : null
            });
        } catch (error) {
            console.error(`Failed to initialize persian-datepicker on #${elementId}:`, error);
        }
    }, 0); // تاخیر صفر میلی‌ثانیه‌ای کافی است تا اجرا به تیک بعدی موکول شود
};
        // --- تابع جدید برای ساخت دکمه‌های صفحه‌بندی ---
    const renderPagination = (containerId, currentPage, totalItems, itemsPerPage) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHtml = '<div class="flex items-center justify-center space-x-1 space-x-reverse">';
        
        // دکمه قبلی
        paginationHtml += `<button data-page="${currentPage - 1}" class="pagination-btn px-4 py-2 text-gray-500 bg-white rounded-md hover:bg-blue-500 hover:text-white" ${currentPage === 1 ? 'disabled' : ''}>قبلی</button>`;
        
        // دکمه‌های شماره صفحه
        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-700';
            paginationHtml += `<button data-page="${i}" class="pagination-btn px-4 py-2 rounded-md hover:bg-blue-500 hover:text-white ${isActive}">${i}</button>`;
        }

        // دکمه بعدی
        paginationHtml += `<button data-page="${currentPage + 1}" class="pagination-btn px-4 py-2 text-gray-500 bg-white rounded-md hover:bg-blue-500 hover:text-white" ${currentPage === totalPages ? 'disabled' : ''}>بعدی</button>`;

        paginationHtml += '</div>';
        container.innerHTML = paginationHtml;
    };
        // --- تابع جدید برای تحلیل داده‌های نظرسنجی و اعمال نتایج ---
const calculateAndApplyAnalytics = () => {
        if (!state.surveyResponses) return;
        console.log("Running survey and risk analytics...");
        
        // --- تحلیل نظرسنجی مشارکت کارکنان ---
        const engagementResponses = state.surveyResponses.filter(r => r.surveyId === 'engagement');
        const employeeScores = {};
        
        engagementResponses.forEach(res => {
            if (res.employeeId && res.employeeId !== 'anonymous') {
                if (!employeeScores[res.employeeId]) {
                    employeeScores[res.employeeId] = { totalScore: 0, questionCount: 0 };
                }
                Object.values(res.answers).forEach(ans => {
                    const score = parseInt(ans);
                    if (!isNaN(score)) {
                        employeeScores[res.employeeId].totalScore += score;
                        employeeScores[res.employeeId].questionCount++;
                    }
                });
            }
        });

        state.employees.forEach(emp => {
            if (employeeScores[emp.id]) {
                const data = employeeScores[emp.id];
                emp.engagementScore = Math.round(((data.totalScore / data.questionCount) / 5) * 100);
            } else {
                emp.engagementScore = null;
            }
        });

        state.teams.forEach(team => {
            let teamTotalScore = 0;
            let teamQuestionCount = 0;
            team.memberIds?.forEach(memberId => {
                const memberData = employeeScores[memberId];
                if (memberData) {
                    teamTotalScore += memberData.totalScore;
                    teamQuestionCount += memberData.questionCount;
                }
            });
            team.engagementScore = teamQuestionCount > 0 ? Math.round(((teamTotalScore / teamQuestionCount) / 5) * 100) : null;
        });

        // --- بخش جدید: تحلیل دسته‌بندی‌های نظرسنجی برای کل سازمان ---
        const orgEngagementByCategory = {};
        const engagementTemplate = surveyTemplates['engagement'];
        engagementResponses.forEach(res => {
            engagementTemplate.questions.forEach(q => {
                if (q.type.startsWith('rating_') && res.answers[q.id]) {
                    const score = parseInt(res.answers[q.id]);
                    if (!isNaN(score)) {
                        if (!orgEngagementByCategory[q.category]) {
                            orgEngagementByCategory[q.category] = { totalScore: 0, count: 0, maxScore: q.type === 'rating_1_10' ? 10 : 5 };
                        }
                        orgEngagementByCategory[q.category].totalScore += score;
                        orgEngagementByCategory[q.category].count++;
                    }
                }
            });
        });
        state.orgAnalytics = {
            engagementBreakdown: Object.entries(orgEngagementByCategory).map(([category, data]) => ({
                name: engagementTemplate.categories[category] || category,
                score: data.count > 0 ? Math.round(((data.totalScore / data.count) / data.maxScore) * 100) : 0
            }))
        };

        state.employees.forEach(emp => {
            emp.attritionRisk = calculateAttritionRisk(emp, state.teams);
            emp.nineBox = determineNineBoxCategory(emp);
        });

        console.log("Analytics applied to state.");
  generateSmartReminders(); // [!code ++] این خط را اضافه کنید
    };
// این تابع کاملاً جدید را به main.js اضافه کنید
// فایل: js/main.js
// این تابع را به طور کامل جایگزین نسخه فعلی کنید

const generateSmartReminders = async () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const oneDay = 1000 * 60 * 60 * 24;
    const batch = writeBatch(db);
    let hasNewReminders = false;
    
    const defaultRule = (state.assignmentRules || []).find(r => r.firestoreId === '_default');

    for (const emp of state.employees) {
        if (emp.status !== 'فعال') continue;
        
        const events = [];

        // ▼▼▼ بخش تمدید قرارداد اصلاح و تکمیل شده است ▼▼▼
        // رویداد: اتمام قرارداد (در ۹۰ روز آینده)
        // ابتدا آخرین قرارداد ثبت شده را پیدا می‌کنیم
        if (emp.contracts && emp.contracts.length > 0) {
            const lastContract = emp.contracts.sort((a, b) => new Date(b.endDate || 0) - new Date(a.endDate || 0))[0];
            
            if (lastContract && lastContract.endDate) {
                const endDate = new Date(lastContract.endDate);
                const daysUntilEnd = Math.round((endDate - now) / oneDay);

                // اگر تاریخ پایان قرارداد بین امروز تا ۹۰ روز آینده بود، یادآور را بساز
                if (daysUntilEnd >= 0 && daysUntilEnd <= 90) {
                    events.push({
                        type: 'تمدید قرارداد',
                        date: endDate,
                        text: `تمدید قرارداد: ${emp.name}`,
                        subtext: `تاریخ اتمام: ${toPersianDate(endDate)}`,
                        icon: 'file-clock',
                        id: `renewal-${emp.id}-${endDate.getFullYear()}` // شناسه یکتا برای جلوگیری از تکرار
                    });
                }
            }
        }
        // ▲▲▲ پایان بخش اصلاح شده ▲▲▲
        
        // رویداد: تولد (در ۷ روز آینده)
        if (emp.personalInfo?.birthDate) {
            const birthDate = new Date(emp.personalInfo.birthDate);
            const nextBirthday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
            if (nextBirthday < now) nextBirthday.setFullYear(now.getFullYear() + 1);
            const daysUntilBirthday = Math.round((nextBirthday - now) / oneDay);
            if (daysUntilBirthday >= 0 && daysUntilBirthday <= 7) {
                events.push({ type: 'تولد', date: nextBirthday, text: `تولد: ${emp.name}`, subtext: `در ${daysUntilBirthday === 0 ? 'امروز' : daysUntilBirthday + ' روز دیگر'}`, icon: 'cake', id: `bday-${emp.id}-${nextBirthday.getFullYear()}` });
            }
        }

        // رویداد: سالگرد استخدام (یادآوری ۱ روز قبل)
        if (emp.startDate) {
            const startDate = new Date(emp.startDate);
            let nextAnniversary = new Date(now.getFullYear(), startDate.getMonth(), startDate.getDate());
            
            if (nextAnniversary < now) {
                nextAnniversary.setFullYear(now.getFullYear() + 1);
            }
            const daysUntilAnniversary = Math.round((nextAnniversary - now) / oneDay);
            if (daysUntilAnniversary === 1) {
                events.push({ type: 'سالگرد استخدام', date: nextAnniversary, text: `یادآوری سالگرد استخدام ${emp.name}`, subtext: `فردا سالگرد ورود ایشان به شرکت است.`, icon: 'award', id: `anniv-${emp.id}-${nextAnniversary.getFullYear()}` });
            }
        }

        for (const event of events) {
            const reminderRef = doc(db, `artifacts/${appId}/public/data/reminders`, event.id);
            const reminderSnap = await getDoc(reminderRef);

            if (!reminderSnap.exists()) {
                let assignedUid = null;
                const applicableRule = (state.assignmentRules || []).find(r => r.itemTypes?.includes(event.type));
                if (applicableRule) {
                    assignedUid = applicableRule.assigneeUid;
                } else if (defaultRule) {
                    assignedUid = defaultRule.assigneeUid;
                }

                if (assignedUid) {
                    batch.set(reminderRef, {
                        text: event.text,
                        subtext: event.subtext,
                        icon: event.icon,
                        type: event.type,
                        date: event.date,
                        assignedTo: assignedUid,
                        isReadByAssignee: false,
                        createdAt: serverTimestamp(),
                        status: 'جدید'
                    });
                    hasNewReminders = true;
                }
            }
        }
    }

    if (hasNewReminders) {
        await batch.commit();
        console.log("Smart reminders generated and assigned.");
    }
};
        // --- تابع هوشمند برای محاسبه ریسک خروج بر اساس مدل امتیازبندی ---
// فایل: js/main.js
// این تابع را به طور کامل جایگزین کنید ▼

const calculateAttritionRisk = (employee, allTeams) => {
    let riskScore = 0;
    const reasons = [];

    // معیار ۱: امتیاز مشارکت (تا ۴۰ امتیاز)
    if (employee.engagementScore != null) {
        if (employee.engagementScore < 50) { riskScore += 40; reasons.push('مشارکت بسیار پایین'); }
        else if (employee.engagementScore < 70) { riskScore += 20; reasons.push('مشارکت پایین'); }
    } else {
        riskScore += 10; reasons.push('عدم مشارکت در نظرسنجی');
    }

    // معیار ۲: روند عملکرد (تا ۳۰ امتیاز) - حالا هوشمندتر شده
    if (employee.performanceHistory && employee.performanceHistory.length >= 2) {
        const lastTwoReviews = employee.performanceHistory.slice(-2);
        const latestScore = lastTwoReviews[1].overallScore;
        const previousScore = lastTwoReviews[0].overallScore;
        if (latestScore < previousScore - 0.75) {
            riskScore += 30; reasons.push('افت شدید عملکرد');
        } else if (latestScore < previousScore - 0.25) {
            riskScore += 15; reasons.push('افت عملکرد');
        }
    } else if (employee.performanceHistory && employee.performanceHistory.length > 0) {
        const latestScore = employee.performanceHistory.slice(-1)[0].overallScore;
        if (latestScore < 2.8) {
            riskScore += 20; reasons.push('عملکرد پایین');
        }
    }

    // ... (بقیه معیارها بدون تغییر)
    const team = allTeams.find(t => t.memberIds?.includes(employee.id));
    if (team && team.engagementScore != null && team.engagementScore < 60) {
        riskScore += 10; reasons.push('عضو تیمی با مشارکت پایین');
    }
    return { score: Math.min(100, riskScore), reasons: reasons.length > 0 ? reasons : ['ریسک پایین'] };
};
        // --- تابع جدید برای تعیین هوشمند جعبه در ماتریس ۹ جعبه‌ای ---
// فایل: js/main.js
// این تابع را به طور کامل جایگزین کنید ▼

const determineNineBoxCategory = (employee) => {
    let performanceScore = 0;
    if (employee.performanceHistory && employee.performanceHistory.length > 0) {
        // استفاده از امتیاز آخرین ارزیابی ثبت شده
        performanceScore = employee.performanceHistory.slice(-1)[0].overallScore;
    }

    let performanceCategory;
    if (performanceScore >= 4.0) performanceCategory = 'High';
    else if (performanceScore >= 2.8) performanceCategory = 'Medium';
    else performanceCategory = 'Low';

    let potentialScore = 0;
    if (employee.competencies) {
        const scores = Object.values(employee.competencies);
        if (scores.length > 0) {
            potentialScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        }
    }

    let potentialCategory;
    if (potentialScore >= 4.0) potentialCategory = 'High';
    else if (potentialScore >= 2.8) potentialCategory = 'Medium';
    else potentialCategory = 'Low';

    if (performanceCategory === 'High' && potentialCategory === 'High') return 'ستاره (Star)';
    if (performanceCategory === 'High' && potentialCategory === 'Medium') return 'استعداد کلیدی (Core Talent)';
    if (performanceCategory === 'High' && potentialCategory === 'Low') return 'مهره کلیدی (Key Player)';
    if (performanceCategory === 'Medium' && potentialCategory === 'High') return 'پتانسیل بالا (High Potential)';
    if (performanceCategory === 'Medium' && potentialCategory === 'Medium') return 'عملکرد قابل اتکا (Solid Performer)';
    if (performanceCategory === 'Medium' && potentialCategory === 'Low') return 'عملکرد متوسط (Average Performer)';
    if (performanceCategory === 'Low' && potentialCategory === 'High') return 'معما (Enigma/Puzzle)';
    if (performanceCategory === 'Low' && potentialCategory === 'Medium') return 'نیازمند بهبود (Needs Improvement)';
    if (performanceCategory === 'Low' && potentialCategory === 'Low') return 'ریسک (Risk)';
    
    return 'ارزیابی نشده';
};
        // --- تابع جدید برای تحلیل عمیق داده‌های یک تیم ---
    const analyzeTeamData = (team, members) => {
        const analysis = {};

        // ۱. تحلیل عمیق امتیاز مشارکت بر اساس دسته‌بندی
        const engagementByCategory = {};
        const engagementTemplate = surveyTemplates['engagement'];
        let memberResponseCount = 0;

        members.forEach(member => {
            const responses = state.surveyResponses.filter(r => r.employeeId === member.id && r.surveyId === 'engagement');
            if (responses.length > 0) {
                memberResponseCount++;
                responses.forEach(res => {
                    engagementTemplate.questions.forEach(q => {
                        if (q.type === 'rating_1_5' && res.answers[q.id]) {
                            const score = parseInt(res.answers[q.id]);
                            if (!engagementByCategory[q.category]) {
                                engagementByCategory[q.category] = { totalScore: 0, count: 0 };
                            }
                            engagementByCategory[q.category].totalScore += score;
                            engagementByCategory[q.category].count++;
                        }
                    });
                });
            }
        });

        analysis.engagementBreakdown = Object.entries(engagementByCategory).map(([category, data]) => ({
            name: engagementTemplate.categories[category] || category,
            score: Math.round(((data.totalScore / data.count) / 5) * 100)
        }));

        // ۲. شناسایی نقاط قوت کلیدی (Top Skills)
        const skillMap = new Map();
        members.forEach(member => {
            if (member.skills) {
                Object.entries(member.skills).forEach(([skill, level]) => {
                    if (level >= 4) { // فقط مهارت‌های سطح بالا را در نظر بگیر
                        skillMap.set(skill, (skillMap.get(skill) || 0) + 1);
                    }
                });
            }
        });
        analysis.topSkills = [...skillMap.entries()]
            .sort((a, b) => b[1] - a[1]) // مرتب‌سازی بر اساس تعداد تکرار
            .slice(0, 5) // ۵ مهارت برتر
            .map(item => item[0]);

        // ۳. شناسایی اعضای پرریسک
        analysis.highRiskMembers = members.filter(m => m.attritionRisk && m.attritionRisk.score > 70);

        return analysis;
    };
       // این تابع جدید را به js/main.js اضافه کنید

const showChangePasswordForm = () => {
    modalTitle.innerText = 'تغییر رمز عبور';
    modalContent.innerHTML = `
        <form id="change-password-form" class="space-y-4">
            <div>
                <label for="new-password" class="block font-medium mb-1">رمز عبور جدید</label>
                <input type="password" id="new-password" class="w-full p-2 border rounded-md" required minlength="6">
                <p class="text-xs text-slate-500 mt-1">رمز عبور باید حداقل ۶ کاراکتر باشد.</p>
            </div>
            <div>
                <label for="confirm-password" class="block font-medium mb-1">تکرار رمز عبور جدید</label>
                <input type="password" id="confirm-password" class="w-full p-2 border rounded-md" required>
            </div>
            <div class="pt-4 flex justify-end">
                <button type="submit" class="primary-btn">ذخیره رمز جدید</button>
            </div>
        </form>
    `;
    openModal(mainModal, mainModalContainer);
    document.getElementById('edit-team-mission-btn')?.addEventListener('click', () => showEditTeamMissionForm(team));

    document.getElementById('change-password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword.length < 6) {
            showToast("رمز عبور باید حداقل ۶ کاراکتر باشد.", "error");
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast("رمزهای عبور وارد شده یکسان نیستند.", "error");
            return;
        }

        const user = auth.currentUser;
        if (user) {
            try {
                await updatePassword(user, newPassword);
                showToast("رمز عبور شما با موفقیت تغییر کرد.");
                closeModal(mainModal, mainModalContainer);
            } catch (error) {
                console.error("Error updating password:", error);
                showToast("خطا در تغییر رمز عبور. ممکن است نیاز به ورود مجدد داشته باشید.", "error");
            }
        }
    });
}; 
// این تابع را به main.js اضافه کنید
// در فایل js/main.js
// کل این تابع را جایگزین کنید
const updateNotificationBell = () => {
    const bellWrapper = document.getElementById('notification-bell-wrapper');
    if (!bellWrapper || !state.currentUser || state.currentUser.role === 'employee') return;

    const countContainer = document.getElementById('notification-count');
    const listContainer = document.getElementById('notification-list');

    const unreadRequests = (state.requests || []).filter(req => req.assignedTo === state.currentUser.uid && !req.isReadByAssignee);
    const unreadReminders = (state.reminders || []).filter(rem => rem.assignedTo === state.currentUser.uid && !rem.isReadByAssignee);
    const totalUnread = unreadRequests.length + unreadReminders.length;

    // آپدیت کردن عدد روی زنگوله
    if (totalUnread > 0) {
        countContainer.textContent = totalUnread;
        countContainer.classList.remove('hidden');
    } else {
        countContainer.classList.add('hidden');
    }

    // ساخت آیتم‌های داخل منوی کشویی
    let notificationHtml = '';
    unreadRequests.forEach(req => {
        notificationHtml += `<a href="#requests" data-filter="mine" class="notification-item block p-3 hover:bg-slate-50 border-b"><p class="font-semibold">درخواست جدید: ${req.requestType}</p><p class="text-xs text-slate-500">از طرف ${req.employeeName}</p></a>`;
    });
    unreadReminders.forEach(rem => {
        notificationHtml += `<a href="#tasks" data-filter="mine" class="notification-item block p-3 hover:bg-slate-50 border-b"><p class="font-semibold">یادآور جدید: ${rem.type}</p><p class="text-xs text-slate-500">${rem.text}</p></a>`;
    });

    if (totalUnread === 0) {
        notificationHtml = '<p class="p-4 text-center text-sm text-slate-500">اعلان جدیدی وجود ندارد.</p>';
    }

    listContainer.innerHTML = notificationHtml;
};
        const calculateDashboardMetrics = () => {
            const totalEmployees = state.employees.length;
            if (totalEmployees === 0) {
                state.dashboardMetrics = {};
                return;
            }
            const activeEmployees = state.employees.filter(e => e.status === 'فعال');
            
            const retentionRate = totalEmployees > 0 ? ((activeEmployees.length / totalEmployees) * 100).toFixed(0) : 0;

            const totalTenureDays = activeEmployees.reduce((sum, emp) => {
                if (!emp.startDate) return sum;
                const start = new Date(emp.startDate);
                const now = new Date();
                return sum + Math.ceil(Math.abs(now - start) / (1000 * 60 * 60 * 24));
            }, 0);
            const averageTenureYears = activeEmployees.length > 0 ? (totalTenureDays / activeEmployees.length / 365).toFixed(1) : 0;
            
            const engagementResponses = state.surveyResponses.filter(r => r.surveyId === 'engagement');
            let totalScore = 0;
            let ratingCount = 0;
            engagementResponses.forEach(res => {
                Object.values(res.answers).forEach(ans => {
                    const score = parseInt(ans);
                    if (!isNaN(score)) {
                        totalScore += score;
                        ratingCount++;
                    }
                });
            });
            const engagementScore = ratingCount > 0 ? ((totalScore / ratingCount) / 5 * 100).toFixed(0) : 0;

            const mobileEmployees = state.employees.filter(e => e.careerPath && e.careerPath.length > 1).length;
            const internalMobilityRate = totalEmployees > 0 ? ((mobileEmployees / totalEmployees) * 100).toFixed(0) : 0;

            state.dashboardMetrics = {
                totalEmployees,
                retentionRate,
                averageTenure: averageTenureYears,
                engagementScore,
                internalMobilityRate,
                highImpactFlightRisk: activeEmployees.filter(e => e.attritionRisk?.score > 60).map(e => e.id),
                nineBoxDistribution: activeEmployees.reduce((acc, emp) => {
                    if (emp.nineBox) { acc[emp.nineBox] = (acc[emp.nineBox] || 0) + 1; }
                    return acc;
                }, {}),
                genderComposition: state.employees.reduce((acc, emp) => {
                    if (emp.gender) { acc[emp.gender] = (acc[emp.gender] || 0) + 1; }
                    return acc;
                }, {}),
                departmentDistribution: state.employees.reduce((acc, emp) => {
                    if (emp.department) { acc[emp.department] = (acc[emp.department] || 0) + 1; }
                    return acc;
                }, {}),
            };
        };

        // --- PAGE TEMPLATES & RENDERING ---
        const mainContent = document.getElementById('main-content');

        // --- MODAL (shared) ---
        const mainModal = document.getElementById('mainModal');
        const modalTitle = document.getElementById('modalTitle');
       let modalContent = document.getElementById('modalContent'); // [!code focus]
        const mainModalContainer = mainModal?.querySelector('div');

        function openModal(modal, container) {
            if (!modal || !container) return;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // animate in
            requestAnimationFrame(() => {
                container.classList.remove('scale-95', 'opacity-0');
            });
        }
        function closeModal(modal, container) {
            if (!modal || !container) return;
            container.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        }
        document.getElementById('closeModal')?.addEventListener('click', () => closeModal(mainModal, mainModalContainer));
        mainModal?.addEventListener('click', (e) => {
            if (e.target === mainModal) {
                closeModal(mainModal, mainModalContainer);
            }
        });

        // --- Confirmation Modal helpers (shared) ---
        const confirmModal = document.getElementById('confirmModal');
        const confirmModalContainer = confirmModal?.querySelector('div');
        let confirmCallback = () => {};
        function showConfirmationModal(title, message, onConfirm) {
            if (!confirmModal || !confirmModalContainer) return;
            document.getElementById('confirmTitle').innerText = title || 'تایید عملیات';
            document.getElementById('confirmMessage').innerText = message || '';
            confirmCallback = typeof onConfirm === 'function' ? onConfirm : () => {};
            openModal(confirmModal, confirmModalContainer);
        }
        document.getElementById('confirmCancel')?.addEventListener('click', () => closeModal(confirmModal, confirmModalContainer));
        document.getElementById('confirmAccept')?.addEventListener('click', () => { confirmCallback(); closeModal(confirmModal, confirmModalContainer); });

        // --- Admin helper safe stubs (until full implementations below) ---
        if (typeof setupSurveysPageListeners !== 'function') { window.setupSurveysPageListeners = () => { document.querySelectorAll('.create-survey-link-btn').forEach(btn => { btn.addEventListener('click', (e) => { const id = e.currentTarget.dataset.surveyId; const t = surveyTemplates[id]; if (t?.requiresTarget) { window.showSurveyTargetSelector(id); } else { window.generateAndShowSurveyLink(id); } }); }); }; }
        if (typeof window.showProcessRequestForm !== 'function') {
            window.showProcessRequestForm = (requestId) => {
                const emp = state.employees.find(e => e.uid === state.currentUser?.uid);
                if (emp) {
                    showRequestDetailsModal(requestId, emp);
                    return;
                }
                // Admin/editor fallback: processing modal without employee context
                const request = (state.requests || []).find(r => r.firestoreId === requestId);
                if (!request) { showToast('درخواست یافت نشد.', 'error'); return; }
                const statusOptions = ['درحال بررسی','در حال انجام','تایید شده','رد شده'];
                const optionsHtml = statusOptions.map(s => `<option value="${s}" ${request.status===s?'selected':''}>${s}</option>`).join('');
                const threadHtml = (request.thread || []).map(item => {
                    const sender = state.users.find(u => u.firestoreId === item.senderUid)?.name || 'کاربر';
                    const dateTxt = item.createdAt?.toDate ? toPersianDate(item.createdAt) : '';
                    return `<div class=\"p-3 mt-2 text-sm border rounded-lg bg-slate-50\"><p class=\"whitespace-pre-wrap\">${item.content}</p><div class=\"text-slate-400 text-xs text-left mt-2\">${sender} - ${dateTxt}</div></div>`;
                }).join('') || '<p class="text-xs text-slate-400">هنوز پاسخی ثبت نشده است.</p>';
                modalTitle.innerText = `پردازش درخواست: ${request.requestType}`;
                modalContent.innerHTML = `
                    <div class="space-y-4">
                        <div class="p-4 border rounded-lg bg-slate-50 text-sm">
                            <div class="flex justify-between items-center">
                                <p><strong>موضوع:</strong> ${request.details}</p>
                                <select id="req-status" class="p-1.5 border rounded-md bg-white text-xs">${optionsHtml}</select>
                            </div>
                        </div>
                        <div>
                            <strong class="text-slate-600">تاریخچه مکالمات:</strong>
                            <div class="mt-2 max-h-60 overflow-y-auto pr-2">${threadHtml}</div>
                        </div>
                        <div class="pt-4 border-t">
                            <form id="admin-reply-form" class="flex items-center gap-2" data-id="${request.firestoreId}">
                                <input type="text" id="admin-reply-input" placeholder="پاسخ خود را بنویسید..." class="flex-grow p-2 border rounded-md text-sm">
                                <button type="submit" class="primary-btn py-2 px-3 text-sm">ارسال</button>
                            </form>
                        </div>
                    </div>`;
                openModal(mainModal, mainModalContainer);
                // listeners
                document.getElementById('req-status')?.addEventListener('change', async (e) => {
                    try {
                        await updateDoc(doc(db, `artifacts/${appId}/public/data/requests`, requestId), { status: e.target.value, lastUpdatedAt: serverTimestamp() });
                        showToast('وضعیت درخواست به‌روزرسانی شد.');
                    } catch (err) { console.error(err); showToast('خطا در به‌روزرسانی وضعیت.', 'error'); }
                });
                document.getElementById('admin-reply-form')?.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const content = document.getElementById('admin-reply-input').value.trim();
                    if (!content) { renderPage('requests'); closeModal(mainModal, mainModalContainer); return; }
                    try {
                        const newThread = [ ...(request.thread || []), { content, senderUid: state.currentUser?.uid, createdAt: new Date() } ];
                        await updateDoc(doc(db, `artifacts/${appId}/public/data/requests`, requestId), { thread: newThread, lastUpdatedAt: serverTimestamp(), isReadByAssignee: false });
                        showToast('پاسخ ارسال شد.');
                        closeModal(mainModal, mainModalContainer);
                        renderPage('requests');
                    } catch (err) {
                        console.error('Error sending reply', err);
                        showToast('خطا در ارسال پاسخ.', 'error');
                    }
                });
            };
        }
        if (typeof window.showDocumentUploadForm !== 'function') { window.showDocumentUploadForm = () => { modalTitle.innerText='آپلود سند سازمان'; modalContent.innerHTML = `<form id=\"doc-upload-form\" class=\"space-y-4\"><div><label class=\"block text-sm\">عنوان</label><input id=\"doc-title\" class=\"w-full p-2 border rounded-md\" required></div><div><label class=\"block text-sm\">دسته‌بندی</label><select id=\"doc-category\" class=\"w-full p-2 border rounded-md bg-white\" required><option value=\"learning\">آموزش و رشد</option><option value=\"rules\">قوانین و بازی</option><option value=\"toolkit\">کیت ابزار کاری</option><option value=\"story\">داستان ما</option><option value=\"benefits\">مزایا و حقوق</option><option value=\"projects\">مستندات پروژه‌ها</option></select></div><div><label class=\"block text-sm\">فایل</label><input id=\"doc-file\" type=\"file\" class=\"w-full\" required></div><div><label class=\"block text-sm\">گیرندگان</label><select id=\"doc-target-type\" class=\"w-full p-2 border rounded-md bg-white\"><option value=\"public\">عمومی (همه)</option><option value=\"roles\">نقش‌ها</option><option value=\"teams\">تیم‌ها</option><option value=\"users\">افراد</option></select><div id=\"doc-target-details\" class=\"hidden p-2 border rounded-md max-h-40 overflow-y-auto mt-2\"><div id=\"doc-target-teams\" class=\"hidden grid grid-cols-2 gap-2\">${state.teams.map(t => `<div class='flex items-center'><input type='checkbox' value='${t.firestoreId}' data-name='${t.name}' class='doc-target-checkbox-team' id='doc-team-${t.firestoreId}'><label for='doc-team-${t.firestoreId}' class='mr-2'>${t.name}</label></div>`).join('')}</div><div id=\"doc-target-users\" class=\"hidden grid grid-cols-2 gap-2\">${state.employees.map(u => `<div class='flex items-center'><input type='checkbox' value='${u.firestoreId}' data-name='${u.name}' class='doc-target-checkbox-user' id='doc-user-${u.firestoreId}'><label for='doc-user-${u.firestoreId}' class='mr-2'>${u.name}</label></div>`).join('')}</div><div id=\"doc-target-roles\" class=\"hidden space-y-1\"><div class='flex items-center'><input type='checkbox' value='admin' class='doc-target-checkbox-role' id='doc-role-admin'><label for='doc-role-admin' class='mr-2'>مدیران</label></div><div class='flex items-center'><input type='checkbox' value='employee' class='doc-target-checkbox-role' id='doc-role-employee'><label for='doc-role-employee' class='mr-2'>کارمندان</label></div></div></div></div><div class=\"flex justify-end\"><button type=\"submit\" class=\"bg-blue-600 text-white py-2 px-4 rounded-md\">آپلود</button></div></form>`; openModal(mainModal, mainModalContainer); const targetTypeSel = document.getElementById('doc-target-type'); const targetDetails = document.getElementById('doc-target-details'); const lists = { teams: document.getElementById('doc-target-teams'), users: document.getElementById('doc-target-users'), roles: document.getElementById('doc-target-roles') }; targetTypeSel.addEventListener('change', (e)=>{ const v=e.target.value; Object.values(lists).forEach(el=>el.classList.add('hidden')); if(lists[v]){ targetDetails.classList.remove('hidden'); lists[v].classList.remove('hidden'); } else { targetDetails.classList.add('hidden'); } }); document.getElementById('doc-upload-form').addEventListener('submit', async (e)=>{ e.preventDefault(); const f=document.getElementById('doc-file').files[0]; const t=document.getElementById('doc-title').value.trim(); const cat=document.getElementById('doc-category').value; if(!f||!t||!cat) return; try { const sRef = ref(storage, `companyDocs/${Date.now()}_${f.name}`); await uploadBytes(sRef, f); const url = await getDownloadURL(sRef); const targets = { type: targetTypeSel.value }; if(targets.type==='teams'){ targets.teamIds = Array.from(document.querySelectorAll('.doc-target-checkbox-team:checked')).map(cb=>cb.value); targets.teamNames = Array.from(document.querySelectorAll('.doc-target-checkbox-team:checked')).map(cb=>cb.dataset.name); } else if (targets.type==='users'){ targets.userIds = Array.from(document.querySelectorAll('.doc-target-checkbox-user:checked')).map(cb=>cb.value); targets.userNames = Array.from(document.querySelectorAll('.doc-target-checkbox-user:checked')).map(cb=>cb.dataset.name); } else if (targets.type==='roles'){ targets.roles = Array.from(document.querySelectorAll('.doc-target-checkbox-role:checked')).map(cb=>cb.value); } await addDoc(collection(db, `artifacts/${appId}/public/data/companyDocuments`), { title: t, categoryKey: cat, fileUrl: url, uploadedAt: serverTimestamp(), targets }); showToast('سند آپلود شد.'); closeModal(mainModal, mainModalContainer); renderPage('documents'); } catch(err){ console.error(err); showToast('خطا در آپلود.', 'error'); } }); }; }
        // Provide safe fallbacks for missing survey link helpers
        if (typeof window.generateAndShowSurveyLink !== 'function') {
            window.generateAndShowSurveyLink = (surveyId) => {
                const link = `${window.location.origin}${window.location.pathname}#survey-taker?id=${encodeURIComponent(surveyId)}`;
                modalTitle.innerText = 'لینک نظرسنجی';
                modalContent.innerHTML = `
                    <div class="space-y-4">
                        <p class="text-sm text-slate-600">لینک را کپی و برای مخاطبان ارسال کنید.</p>
                        <div class="flex items-center gap-2">
                            <input id="survey-link-input" class="flex-1 p-2 border rounded-md" readonly value="${link}">
                            <button id="copy-survey-link" class="primary-btn py-2 px-3 text-sm">کپی</button>
                        </div>
                    </div>`;
                openModal(mainModal, mainModalContainer);
                document.getElementById('copy-survey-link')?.addEventListener('click', async () => {
                    try { await navigator.clipboard.writeText(document.getElementById('survey-link-input').value); showToast('لینک کپی شد.'); } catch { showToast('کپی لینک ناموفق بود.', 'error'); }
                });
            };
        }
        if (typeof window.showSurveyTargetSelector !== 'function') {
            window.showSurveyTargetSelector = (surveyId) => {
                const options = state.employees.map(e => `<option value="${e.id}">${e.name} (${e.id})</option>`).join('');
                modalTitle.innerText = 'انتخاب فرد هدف برای بازخورد ۳۶۰';
                modalContent.innerHTML = `
                    <form id="survey-target-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium">انتخاب کارمند</label>
                            <select id="target-employee-id" class="w-full p-2 border rounded-md bg-white">${options}</select>
                        </div>
                        <div class="flex justify-end gap-2">
                            <button type="button" id="cancel-target" class="bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300">انصراف</button>
                            <button type="submit" class="primary-btn">ایجاد لینک</button>
                        </div>
                    </form>`;
                openModal(mainModal, mainModalContainer);
                document.getElementById('cancel-target')?.addEventListener('click', () => closeModal(mainModal, mainModalContainer));
                document.getElementById('survey-target-form')?.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const targetId = document.getElementById('target-employee-id').value;
                    const link = `${window.location.origin}${window.location.pathname}#survey-taker?id=${encodeURIComponent(surveyId)}&target=${encodeURIComponent(targetId)}`;
                    modalTitle.innerText = 'لینک نظرسنجی ۳۶۰';
                    modalContent.innerHTML = `
                        <div class="space-y-4">
                            <p class="text-sm text-slate-600">لینک را کپی و ارسال کنید.</p>
                            <div class="flex items-center gap-2">
                                <input id="survey-link-input" class="flex-1 p-2 border rounded-md" readonly value="${link}">
                                <button id="copy-survey-link" class="primary-btn py-2 px-3 text-sm">کپی</button>
                            </div>
                        </div>`;
                    document.getElementById('copy-survey-link')?.addEventListener('click', async () => {
                        try { await navigator.clipboard.writeText(document.getElementById('survey-link-input').value); showToast('لینک کپی شد.'); } catch { showToast('کپی لینک ناموفق بود.', 'error'); }
                    });
                });
            };
        }
        // Bridge aliases for window-based helpers within ESM
        const showProcessRequestForm = (...args) => window.showProcessRequestForm?.(...args);
        const showDocumentUploadForm = (...args) => window.showDocumentUploadForm?.(...args);
        const generateAndShowSurveyLink = (...args) => window.generateAndShowSurveyLink?.(...args);
        const showSurveyTargetSelector = (...args) => window.showSurveyTargetSelector?.(...args);
        const showEditPersonalInfoForm = (...args) => window.showEditPersonalInfoForm?.(...args);
        const setupTeamProfileModalListeners = (...args) => window.setupTeamProfileModalListeners?.(...args);
        const showAssignmentRuleForm = (...args) => window.showAssignmentRuleForm?.(...args);
        const showProcessReminderForm = (...args) => window.showProcessReminderForm?.(...args);
        if (typeof renderTeamHealthMetrics !== 'function') { window.renderTeamHealthMetrics = (team) => { const metrics = team.healthMetrics || []; if(!metrics.length) return '<p class=\"text-sm text-slate-500\">معیاری ثبت نشده است.</p>'; return metrics.map(m=>`<div class=\"flex justify-between text-sm\"><span>${m.name}</span><span class=\"font-medium\">${m.value}</span></div>`).join(''); }; }
        if (typeof showTeamForm !== 'function') { window.showTeamForm = (teamId=null) => { const team=(state.teams||[]).find(t=>t.firestoreId===teamId)||{name:'',leaderId:'',missionLine:''}; const leaders=state.employees.map(e=>`<option value=\"${e.id}\" ${e.id===team.leaderId?'selected':''}>${e.name}</option>`).join(''); modalTitle.innerText=teamId?'ویرایش تیم':'افزودن تیم جدید'; modalContent.innerHTML = `<form id=\"team-form\" class=\"space-y-4\"><div><label class=\"block text-sm\">نام تیم</label><input id=\"team-name\" class=\"w-full p-2 border rounded-md\" value=\"${team.name}\" required></div><div><label class=\"block text-sm\">مدیر تیم</label><select id=\"team-leader\" class=\"w-full p-2 border rounded-md\">${leaders}</select></div><div><label class=\"block text-sm\">هدف یک‌خطی تیم</label><input id=\"team-mission\" class=\"w-full p-2 border rounded-md\" placeholder=\"یک جمله درباره هدف تیم...\" value=\"${team.missionLine || ''}\"></div><div class=\"flex justify-end\"><button type=\"submit\" class=\"bg-blue-600 text-white py-2 px-4 rounded-md\">ذخیره</button></div></form>`; openModal(mainModal, mainModalContainer); document.getElementById('team-form').addEventListener('submit', async (e)=>{ e.preventDefault(); const name=document.getElementById('team-name').value.trim(); const leader=document.getElementById('team-leader').value; const mission=document.getElementById('team-mission').value.trim(); try { if(teamId){ await updateDoc(doc(db, `artifacts/${appId}/public/data/teams`, teamId), { name, leaderId: leader, missionLine: mission }); } else { await addDoc(collection(db, `artifacts/${appId}/public/data/teams`), { name, leaderId: leader, missionLine: mission, memberIds: [] }); } showToast('تیم ذخیره شد.'); closeModal(mainModal, mainModalContainer); renderPage('organization'); } catch(err){ console.error(err); showToast('خطا در ذخیره تیم.', 'error'); } }); }; }
       // فایل: js/main.js
// تابع showPerformanceForm را به طور کامل با این نسخه جایگزین کنید ▼

// فایل: js/main.js
// تابع showPerformanceForm را به طور کامل با این نسخه نهایی جایگزین کنید ▼

if (typeof window.showPerformanceForm !== 'function') { window.showPerformanceForm = () => {}; }
const showPerformanceForm = (emp, reviewIndex = null) => {
    const isEditing = reviewIndex !== null;
    const reviewData = isEditing ? emp.performanceHistory[reviewIndex] : {};

    modalTitle.innerText = `${isEditing ? 'ویرایش' : 'ثبت'} ارزیابی عملکرد برای: ${emp.name}`;

    // --- بخش ۱: پیدا کردن OKR های تیمی کارمند ---
    const team = state.teams.find(t => t.memberIds?.includes(emp.id));
    const teamOkrs = team ? team.okrs : [];
    const okrsHtml = (teamOkrs && teamOkrs.length > 0) ? teamOkrs.map((okr, index) => `
        <div class="mb-3 p-3 bg-slate-50 rounded-lg">
            <label class="block text-sm font-medium text-slate-700">${okr.title} (پیشرفت کلی تیم: ${okr.progress}%)</label>
            <p class="text-xs text-slate-500 mb-2">امتیاز شما به میزان **مشارکت** این کارمند در این هدف تیمی (۱ تا ۵):</p>
            <input type="number" class="okr-score w-full p-2 border rounded-md" data-index="${index}" min="1" max="5" value="${reviewData.okrScores?.[index] || 3}" required>
        </div>
    `).join('') : '<p class="text-sm text-slate-500">هیچ OKR فعالی برای تیم این کارمند ثبت نشده یا کارمند عضو تیمی نیست.</p>';

    // --- بخش ۲: پیدا کردن شایستگی‌های مخصوص پوزیشن شغلی کارمند ---
// --- منطق هوشمند برای فیلتر کردن شایستگی‌ها بر اساس خانواده شغلی و سطح ---
const employeeJobFamily = emp.jobFamily;
const employeeLevel = emp.level;
const competenciesForReview = (state.careerFramework || [])
    .filter(lvl => lvl.jobFamily === employeeJobFamily && lvl.level === employeeLevel)
    .flatMap(lvl => lvl.competencyIds || [])
    .map(compId => state.competencies.find(c => c.firestoreId === compId))
    .filter(Boolean); // حذف موارد null یا undefined
    const competenciesHtml = (competenciesForReview.length > 0) ? competenciesForReview.map(comp => `
        <div class="mb-3 p-3 bg-slate-50 rounded-lg">
            <label class="block text-sm font-medium text-slate-700">${comp.name}</label>
            <p class="text-xs text-slate-500 mb-2">امتیاز شما به این شایستگی (۱ تا ۵):</p>
            <input type="number" class="competency-score w-full p-2 border rounded-md" data-name="${comp.name}" min="1" max="5" value="${reviewData.competencyScores?.[comp.name] || 3}" required>
        </div>
    `).join('') : '<p class="text-sm text-slate-500">هیچ شایستگی‌ای برای پوزیشن شغلی این کارمند تعریف نشده است.</p>';
    
    // --- بخش ۳: ساختار نهایی فرم ---
    modalContent.innerHTML = `
        <form id="performance-review-form" class="space-y-6">
            <div>
                <h4 class="font-bold text-lg mb-2 text-indigo-600">۱. ارزیابی مشارکت در اهداف تیمی (OKRs)</h4>
                ${okrsHtml}
            </div>
            <div>
                <h4 class="font-bold text-lg mb-2 text-indigo-600">۲. ارزیابی شایستگی‌های شغلی</h4>
                ${competenciesHtml}
            </div>
            <div>
                <h4 class="font-bold text-lg mb-2 text-indigo-600">۳. بازخورد کیفی</h4>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">نقاط قوت کلیدی</label>
                        <textarea id="strengths" class="w-full p-2 border rounded-md" rows="3" required>${reviewData.strengths || ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">زمینه‌های قابل بهبود</label>
                        <textarea id="areasForImprovement" class="w-full p-2 border rounded-md" rows="3" required>${reviewData.areasForImprovement || ''}</textarea>
                    </div>
                </div>
            </div>
            <div class="flex justify-between items-center pt-4 border-t">
                <div>
                    <label class="block text-sm font-medium text-slate-700">تاریخ ارزیابی</label>
                    <input type="text" id="review-date" class="w-full p-2 border rounded-md" required>
                </div>
                <button type="submit" class="primary-btn">ذخیره ارزیابی</button>
            </div>
        </form>
    `;
    openModal(mainModal, mainModalContainer);
    activatePersianDatePicker('review-date', reviewData.reviewDate || new Date());

    // --- بخش ۴: منطق ذخیره‌سازی (بدون تغییر) ---
    document.getElementById('performance-review-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const okrScores = Array.from(document.querySelectorAll('.okr-score')).map(input => parseInt(input.value));
        const avgOkrScore = okrScores.length > 0 ? okrScores.reduce((a, b) => a + b, 0) / okrScores.length : 0;

        const competencyScores = {};
        const competencyInputs = document.querySelectorAll('.competency-score');
        competencyInputs.forEach(input => { competencyScores[input.dataset.name] = parseInt(input.value); });
        const avgCompetencyScore = competencyInputs.length > 0 ? Object.values(competencyScores).reduce((a, b) => a + b, 0) / competencyInputs.length : 0;
        
        const overallScore = (avgOkrScore * 0.5) + (avgCompetencyScore * 0.5);

        const newReview = {
            reviewDate: persianToEnglishDate(document.getElementById('review-date').value),
            reviewer: state.currentUser.name || state.currentUser.email,
            okrScores,
            competencyScores,
            strengths: document.getElementById('strengths').value,
            areasForImprovement: document.getElementById('areasForImprovement').value,
            overallScore: parseFloat(overallScore.toFixed(2))
        };

        const currentHistory = emp.performanceHistory || [];
        if (isEditing) {
            currentHistory[reviewIndex] = newReview;
        } else {
            currentHistory.push(newReview);
        }

        try {
            const docRef = doc(db, `artifacts/${appId}/public/data/employees`, emp.firestoreId);
            await updateDoc(docRef, { performanceHistory: currentHistory });
            showToast("ارزیابی عملکرد با موفقیت ذخیره شد.");
            closeModal(mainModal, mainModalContainer);
            viewEmployeeProfile(emp.firestoreId);
        } catch (error) {
            console.error("Error saving performance review:", error);
            showToast("خطا در ذخیره ارزیابی.", "error");
        }
    });
};
        // --- Employee Portal Helpers (hoisted function declarations) ---
        // 1) Edit My Profile
// فایل: js/main.js
// کل تابع showMyProfileEditForm را با این نسخه جایگزین کنید ▼

// فایل: js/main.js
// کل تابع showMyProfileEditForm را با این نسخه جایگزین کنید ▼

// فایل: js/main.js
// کل تابع showMyProfileEditForm را با این نسخه جایگزین کنید ▼

// فایل: js/main.js
// کل تابع showMyProfileEditForm را با این نسخه جایگزین کنید ▼

async function showMyProfileEditForm(employee) {
    const info = employee.personalInfo || {};
    
    modalTitle.innerText = 'ویرایش اطلاعات من';
    modalContent.innerHTML = `
        <form id="edit-my-profile-form" class="space-y-4 max-h-[75vh] overflow-y-auto pr-3">
            
            <div class="p-4 border rounded-xl bg-slate-50">
                <h4 class="font-semibold text-slate-700 mb-3">اطلاعات هویتی و شناسایی</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">نام کامل</label>
                        <input type="text" class="mt-1 w-full p-2 border rounded-lg bg-slate-200 text-slate-500" value="${employee.name || ''}" disabled>
                        <button type="button" data-field="نام کامل" class="request-edit-btn text-xs text-indigo-600 mt-1 hover:underline">درخواست ویرایش</button>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">کد ملی</label>
                        <input type="text" class="mt-1 w-full p-2 border rounded-lg bg-slate-200 text-slate-500" value="${info.nationalId || ''}" disabled>
                        <button type="button" data-field="کد ملی" class="request-edit-btn text-xs text-indigo-600 mt-1 hover:underline">درخواست ویرایش</button>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">تاریخ تولد</label>
                        <input type="text" class="mt-1 w-full p-2 border rounded-lg bg-slate-200 text-slate-500" value="${info.birthDate ? toPersianDate(info.birthDate) : ''}" disabled>
                        <button type="button" data-field="تاریخ تولد" class="request-edit-btn text-xs text-indigo-600 mt-1 hover:underline">درخواست ویرایش</button>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">محل تولد</label>
                        <input type="text" id="pi-birthPlace" class="mt-1 w-full p-2 border rounded-lg" value="${info.birthPlace || ''}">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">وضعیت تأهل</label>
                        <select id="pi-maritalStatus" class="mt-1 w-full p-2 border rounded-lg bg-white">
                            <option value="">انتخاب کنید</option>
                            <option value="مجرد" ${info.maritalStatus === 'مجرد' ? 'selected' : ''}>مجرد</option>
                            <option value="متاهل" ${info.maritalStatus === 'متاهل' ? 'selected' : ''}>متاهل</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">تعداد فرزندان</label>
                        <input type="number" id="pi-numChildren" class="mt-1 w-full p-2 border rounded-lg" value="${info.numChildren || 0}" min="0">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">وضعیت خدمت سربازی</label>
                        <select id="pi-militaryStatus" class="mt-1 w-full p-2 border rounded-lg bg-white">
                            <option value="">انتخاب کنید</option>
                            <option value="معاف" ${info.militaryStatus === 'معاف' ? 'selected' : ''}>معاف</option>
                            <option value="پایان خدمت" ${info.militaryStatus === 'پایان خدمت' ? 'selected' : ''}>پایان خدمت</option>
                            <option value="مشمول" ${info.militaryStatus === 'مشمول' ? 'selected' : ''}>مشمول</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="p-4 border rounded-xl bg-slate-50">
                <h4 class="font-semibold text-slate-700 mb-3">اطلاعات تماس و آدرس</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">ایمیل</label>
                        <input type="email" class="mt-1 w-full p-2 border rounded-lg bg-slate-200 text-slate-500" value="${info.email || ''}" disabled>
                        <button type="button" data-field="ایمیل" class="request-edit-btn text-xs text-indigo-600 mt-1 hover:underline">درخواست ویرایش</button>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">شماره موبایل</label>
                        <input type="text" id="pi-phone" class="mt-1 w-full p-2 border rounded-lg" value="${info.phone || ''}">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">شماره تلفن ثابت</label>
                        <input type="text" id="pi-landline" class="mt-1 w-full p-2 border rounded-lg" value="${info.landline || ''}">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">شماره تلفن ضروری</label>
                        <input type="text" id="pi-emergencyPhone" class="mt-1 w-full p-2 border rounded-lg" value="${info.emergencyPhone || ''}">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-xs font-semibold text-slate-500">آدرس محل سکونت</label>
                        <textarea id="pi-address" class="mt-1 w-full p-2 border rounded-lg" rows="2">${info.address || ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">کد پستی</label>
                        <input type="text" id="pi-postalCode" class="mt-1 w-full p-2 border rounded-lg" value="${info.postalCode || ''}">
                    </div>
                </div>
            </div>
            
            <div class="p-4 border rounded-xl bg-slate-50">
                <h4 class="font-semibold text-slate-700 mb-3">اطلاعات تحصیلی</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">مدرک تحصیلی</label>
                        <input type="text" id="pi-education" class="mt-1 w-full p-2 border rounded-lg" value="${info.education || ''}">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">رشته تحصیلی</label>
                        <input type="text" id="pi-fieldOfStudy" class="mt-1 w-full p-2 border rounded-lg" value="${info.fieldOfStudy || ''}">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-xs font-semibold text-slate-500">محل اخذ مدرک</label>
                        <input type="text" id="pi-educationInstitution" class="mt-1 w-full p-2 border rounded-lg" value="${info.educationInstitution || ''}">
                    </div>
                </div>
            </div>
            
            <div class="p-4 border rounded-xl bg-slate-50">
                <h4 class="font-semibold text-slate-700 mb-3">اطلاعات مالی و بانکی</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">نام بانک</label>
                        <input type="text" id="pi-bankName" class="mt-1 w-full p-2 border rounded-lg" value="${info.bankName || ''}">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">شماره شبا (بدون IR)</label>
                        <input type="text" id="pi-iban" class="mt-1 w-full p-2 border rounded-lg" value="${info.iban || ''}">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">شماره حساب</label>
                        <input type="text" id="pi-accountNumber" class="mt-1 w-full p-2 border rounded-lg" value="${info.accountNumber || ''}">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-500">شماره کارت</label>
                        <input type="text" id="pi-cardNumber" class="mt-1 w-full p-2 border rounded-lg" value="${info.cardNumber || ''}">
                    </div>
                </div>
            </div>

            <div class="flex justify-between items-center pt-4 border-t sticky bottom-0 bg-white py-3">
                <button type="button" id="change-avatar-btn" class="secondary-btn text-xs">تغییر عکس پروفایل</button>
                <div class="flex items-center gap-2">
                    <button type="button" id="cancel-edit-my-profile" class="secondary-btn">انصراف</button>
                    <button type="submit" class="primary-btn">ذخیره تغییرات</button>
                </div>
            </div>
        </form>
    `;
    openModal(mainModal, mainModalContainer);
    
    // --- Event Listeners ---
    document.getElementById('cancel-edit-my-profile').addEventListener('click', () => closeModal(mainModal, mainModalContainer));
    
    document.getElementById('change-avatar-btn').addEventListener('click', () => {
        handleAvatarChange(employee);
    });

    const form = document.getElementById('edit-my-profile-form');

    form.addEventListener('click', async (e) => {
        const requestEditBtn = e.target.closest('.request-edit-btn');
        if (!requestEditBtn) return;
        const field = requestEditBtn.dataset.field;
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/requests`), {
                uid: employee.uid, employeeId: employee.id, employeeName: employee.name,
                requestType: 'درخواست ویرایش اطلاعات', details: `درخواست ویرایش ${field}`,
                status: 'درحال بررسی', createdAt: serverTimestamp()
            });
            requestEditBtn.innerText = 'ارسال شد'; requestEditBtn.disabled = true;
            showToast('درخواست ویرایش شما برای ادمین ارسال شد.');
        } catch (err) { showToast('خطا در ارسال درخواست.', 'error'); }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const updatedInfo = {
                ...info,
                birthPlace: document.getElementById('pi-birthPlace').value.trim(),
                maritalStatus: document.getElementById('pi-maritalStatus').value,
                numChildren: parseInt(document.getElementById('pi-numChildren').value) || 0,
                militaryStatus: document.getElementById('pi-militaryStatus').value.trim(),
                phone: document.getElementById('pi-phone').value.trim(),
                landline: document.getElementById('pi-landline').value.trim(),
                emergencyPhone: document.getElementById('pi-emergencyPhone').value.trim(),
                address: document.getElementById('pi-address').value.trim(),
                postalCode: document.getElementById('pi-postalCode').value.trim(),
                education: document.getElementById('pi-education').value.trim(),
                fieldOfStudy: document.getElementById('pi-fieldOfStudy').value.trim(),
                educationInstitution: document.getElementById('pi-educationInstitution').value.trim(),
                bankName: document.getElementById('pi-bankName').value.trim(),
                iban: document.getElementById('pi-iban').value.trim(),
                accountNumber: document.getElementById('pi-accountNumber').value.trim(),
                cardNumber: document.getElementById('pi-cardNumber').value.trim()
            };
            
            const docRef = doc(db, `artifacts/${appId}/public/data/employees`, employee.firestoreId);
            await updateDoc(docRef, { personalInfo: updatedInfo });
            
            showToast('اطلاعات با موفقیت ذخیره شد.');
            closeModal(mainModal, mainModalContainer);
            renderEmployeePortal();
        } catch (err) {
            console.error('Error updating my profile', err);
            showToast('خطا در ذخیره اطلاعات.', 'error');
        }
    });
}

        // 2) New Request Form
        function showNewRequestForm(employee) {
            modalTitle.innerText = 'ثبت درخواست جدید';
            modalContent.innerHTML = `
                <form id="new-request-form" class="space-y-4">
                    <div>
                        <label class="block font-medium mb-1">نوع درخواست</label>
                        <select id="request-type" class="w-full p-2 border rounded-md bg-white" required>
                            <option value="درخواست مرخصی">درخواست مرخصی</option>
                            <option value="گواهی اشتغال به کار">گواهی اشتغال به کار</option>
                            <option value="مساعده حقوق">مساعده حقوق</option>
                            <option value="سایر">سایر موارد</option>
                        </select>
                    </div>
                    <div id="leave-fields" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block font-medium mb-1">تاریخ شروع</label>
                                <input type="text" id="leave-start" class="w-full p-2 border rounded-md">
                            </div>
                            <div>
                                <label class="block font-medium mb-1">تاریخ پایان</label>
                                <input type="text" id="leave-end" class="w-full p-2 border rounded-md">
                            </div>
                        </div>
                    </div>
                    <div id="generic-fields">
                        <label class="block font-medium mb-1">جزئیات</label>
                        <textarea id="request-details" rows="4" class="w-full p-2 border rounded-md"></textarea>
                    </div>
                    <div class="pt-4 flex justify-end">
                        <button type="submit" class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">ارسال</button>
                    </div>
                </form>`;
            openModal(mainModal, mainModalContainer);
            activatePersianDatePicker('leave-start');
            activatePersianDatePicker('leave-end');
            const typeSelect = document.getElementById('request-type');
            const leaveFields = document.getElementById('leave-fields');
            const genericFields = document.getElementById('generic-fields');
            const toggleFields = () => {
                const isLeave = typeSelect.value === 'درخواست مرخصی';
                leaveFields.style.display = isLeave ? 'block' : 'none';
                genericFields.style.display = isLeave ? 'none' : 'block';
            };
            typeSelect.addEventListener('change', toggleFields);
            toggleFields();
            document.getElementById('new-request-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const requestType = typeSelect.value;
                let details = document.getElementById('request-details').value.trim();
                let extra = {};
                if (requestType === 'درخواست مرخصی') {
                    const startVal = persianToEnglishDate(document.getElementById('leave-start').value);
                    const endVal = persianToEnglishDate(document.getElementById('leave-end').value);
                    if (!startVal || !endVal || new Date(endVal) < new Date(startVal)) {
                        showToast('تاریخ‌های مرخصی را به درستی وارد کنید.', 'error');
                        return;
                    }
                    const duration = Math.round((new Date(endVal) - new Date(startVal)) / 86400000) + 1;
                    extra = { startDate: startVal, endDate: endVal, duration };
                    details = `درخواست مرخصی از ${document.getElementById('leave-start').value} تا ${document.getElementById('leave-end').value} (مجموع ${duration} روز)`;
                }
                // تعیین assignee بر اساس قوانین
                let assignedUid = null;
                const rule = (state.assignmentRules || []).find(r => r.itemTypes?.includes(requestType))
                    || (state.assignmentRules || []).find(r => r.firestoreId === '_default');
                if (rule) assignedUid = rule.assigneeUid;
                try {
                    await addDoc(collection(db, `artifacts/${appId}/public/data/requests`), {
                        uid: employee.uid,
                        employeeId: employee.id,
                        employeeName: employee.name,
                        requestType,
                        details,
                        ...extra,
                        status: 'درحال بررسی',
                        createdAt: serverTimestamp(),
                        assignedTo: assignedUid,
                        isReadByAssignee: false
                    });
                    showToast('درخواست ثبت شد.');
                    closeModal(mainModal, mainModalContainer);
                    renderEmployeePortalPage('requests', employee);
                } catch (err) {
                    console.error('Error submitting request', err);
                    showToast('خطا در ثبت درخواست.', 'error');
                }
            });
        }
        // 3) Request Details Modal (+ mark lastSeenAt)
        async function showRequestDetailsModal(requestId, employee) {
            const request = state.requests.find(r => r.firestoreId === requestId);
            if (!request) return;
            const threadHtml = (request.thread || []).map(item => {
                const sender = state.users.find(u => u.firestoreId === item.senderUid)?.name || 'کاربر';
                const dateTxt = item.createdAt?.toDate ? toPersianDate(item.createdAt) : '';
                return `<div class=\"p-3 mt-2 text-sm border rounded-lg bg-slate-50\"><p class=\"whitespace-pre-wrap\">${item.content}</p><div class=\"text-slate-400 text-xs text-left mt-2\">${sender} - ${dateTxt}</div></div>`;
            }).join('') || '<p class="text-xs text-slate-400">هنوز پاسخی ثبت نشده است.</p>';
            modalTitle.innerText = `جزئیات درخواست: ${request.requestType}`;
            modalContent.innerHTML = `
                <div class="space-y-4">
                    <div class="p-4 border rounded-lg bg-slate-50 text-sm">
                        <div class="flex justify-between items-center">
                            <p><strong>موضوع:</strong> ${request.details}</p>
                            <span class="px-2 py-1 text-xs font-medium rounded-full bg-slate-100">${request.status}</span>
                        </div>
                    </div>
                    <div>
                        <strong class="text-slate-600">تاریخچه مکالمات:</strong>
                        <div class="mt-2 max-h-60 overflow-y-auto pr-2">${threadHtml}</div>
                    </div>
                    <div class="pt-4 border-t">
                        <form id="employee-reply-form" class="flex items-center gap-2" data-id="${request.firestoreId}">
                            <input type="text" id="reply-input" placeholder="پاسخ خود را بنویسید..." class="flex-grow p-2 border rounded-md text-sm" required>
                            <button type="submit" class="primary-btn py-2 px-3 text-sm">ارسال</button>
                        </form>
                    </div>
                </div>`;
            openModal(mainModal, mainModalContainer);
            // mark seen
            try { await updateDoc(doc(db, `artifacts/${appId}/public/data/requests`, requestId), { lastSeenAt: serverTimestamp() }); } catch {}
            document.getElementById('employee-reply-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const content = document.getElementById('reply-input').value.trim();
                if (!content) return;
                try {
                    const newThread = [ ...(request.thread || []), { content, senderUid: state.currentUser?.uid, createdAt: new Date() } ];
                    await updateDoc(doc(db, `artifacts/${appId}/public/data/requests`, requestId), { thread: newThread, lastUpdatedAt: serverTimestamp() });
                    showToast('پاسخ ارسال شد.');
                    closeModal(mainModal, mainModalContainer);
                    renderEmployeePortalPage('requests', employee);
                } catch (err) {
                    console.error('Error sending reply', err);
                    showToast('خطا در ارسال پاسخ.', 'error');
                }
            });
        }

        async function showBirthdayWishForm(targetUid, targetName) {
            modalTitle.innerText = `ارسال تبریک برای ${targetName}`;
            modalContent.innerHTML = `
                <form id=\"wish-form\" class=\"space-y-4\"><div><label class=\"block text-sm font-medium\">پیام شما</label><textarea id=\"wish-text\" rows=\"4\" class=\"w-full p-2 border rounded-md\" placeholder=\"مثال: تولدت مبارک! آرزوی موفقیت دارم.\" required></textarea></div><div class=\"flex justify-end gap-2\"><button type=\"button\" id=\"wish-cancel\" class=\"bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300\">انصراف</button><button type=\"submit\" class=\"bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700\">ارسال</button></div></form>`;
            openModal(mainModal, mainModalContainer);
            document.getElementById('wish-cancel').addEventListener('click', () => closeModal(mainModal, mainModalContainer));
            document.getElementById('wish-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const text = document.getElementById('wish-text').value.trim();
                if (!text) return;
                try {
                    await addDoc(collection(db, `artifacts/${appId}/public/data/birthdayWishes`), {
                        targetUid,
                        wisherUid: state.currentUser?.uid || 'anonymous',
                        wisherName: state.currentUser?.email || 'یک همکار',
                        message: text,
                        createdAt: serverTimestamp()
                    });
                    showToast('پیام تبریک ارسال شد.');
                    closeModal(mainModal, mainModalContainer);
                } catch (err) {
                    console.error('Error sending wish', err);
                    showToast('خطا در ارسال پیام تبریک.', 'error');
                }
            });
        }

     const updateEmployeeNotificationBell = (employee) => {
    const countContainer = document.getElementById('portal-notification-count');
    if (!countContainer || !employee) return;
    const readIds = new Set(employee.readAnnouncements || []);
    const myTeam = state.teams.find(team => team.memberIds?.includes(employee.id));
    const myTeamId = myTeam ? myTeam.firestoreId : null;
    const unreadCount = (state.announcements || []).filter(msg => {
        if (!msg.createdAt?.toDate) return false;
        const targets = msg.targets;
        const targeted = (targets.type === 'public')
            || (targets.type === 'roles' && targets.roles?.includes('employee'))
            || (targets.type === 'users' && targets.userIds?.includes(employee.firestoreId))
            || (targets.type === 'teams' && targets.teamIds?.includes(myTeamId));
        if (!targeted) return false;
        return !readIds.has(msg.firestoreId);
    }).length;

    if (unreadCount > 0) {
        countContainer.textContent = unreadCount;
        countContainer.classList.remove('hidden');
    } else {
        countContainer.classList.add('hidden');
    }
};   
// این تابع جدید را به js/main.js اضافه کنید
const updateNotificationsForCurrentUser = () => {
    if (!state.currentUser) return;

    if (state.currentUser.role === 'employee') {
        const employeeProfile = state.employees.find(e => e.uid === state.currentUser.uid);
        if (employeeProfile) {
            updateEmployeeNotificationBell(employeeProfile);
        }
    } else {
        // برای ادمین، ویرایشگر و مشاهده‌گر
        updateNotificationBell();
    }
};
const pages = {
// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید
// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

// در فایل js/main.js
// کل تابع pages.dashboard را با این کد جدید جایگزین کنید

// در فایل js/main.js، داخل آبجکت pages
// کل این تابع را با نسخه جدید جایگزین کنید

// در فایل js/main.js
// کل تابع pages.dashboard را با این کد جدید جایگزین کنید

// در فایل js/main.js
// کل تابع pages.dashboard را با این کد جدید جایگزین کنید

dashboard: () => {
    calculateDashboardMetrics();
    const metrics = state.dashboardMetrics;
    if (Object.keys(metrics).length === 0) return `<div class="text-center p-10 bg-white rounded-lg shadow-md"><i data-lucide="inbox" class="mx-auto w-16 h-16 text-gray-400"></i><h2 class="mt-4 text-xl font-semibold text-gray-700">به NikHR خوش آمدید!</h2><p class="mt-2 text-gray-500">برای شروع، اولین کارمند را از صفحه «استعدادها» اضافه کنید.</p><button onclick="window.location.hash='#talent'" class="mt-6 bg-indigo-600 text-white py-2 px-5 rounded-lg hover:bg-indigo-700 transition">افزودن کارمند</button></div>`;
    
    const highRiskEmployees = state.employees
        .filter(e => e.status === 'فعال' && e.attritionRisk && e.attritionRisk.score > 60)
        .sort((a, b) => b.attritionRisk.score - a.attritionRisk.score)
        .slice(0, 5);

    const highRiskHtml = highRiskEmployees.length > 0 
        ? highRiskEmployees.map(emp => `
            <div class="p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <img src="${emp.avatar}" class="w-10 h-10 rounded-full mr-3 object-cover" alt="${emp.name}">
                        <div>
                            <p class="text-sm font-semibold text-slate-800">${emp.name}</p>
                            <p class="text-xs text-slate-500">${emp.jobTitle || ''}</p>
                        </div>
                    </div>
                    <span class="text-lg font-bold text-red-500">${emp.attritionRisk.score}%</span>
                </div>
            </div>
        `).join('') 
        : '<div class="p-4 text-center text-sm text-slate-400">موردی با ریسک بالا یافت نشد.</div>';
    return `
        <section class="relative mb-8 rounded-2xl overflow-hidden">
            <div class="absolute inset-0" style="background:linear-gradient(90deg,#FF6A3D,#F72585)"></div>
            <div class="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div class="flex items-center gap-3">
                    <img src="logo.png" alt="NikHR Logo" class="w-10 h-10 rounded-lg shadow-sm">
                    <div>
                        <h1 class="text-2xl sm:text-3xl font-extrabold text-white">داشبورد مدیریت</h1>
                        <p class="text-white/80 text-sm mt-1">نمایی زنده از سازمان، تیم‌ها و روندها</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button id="dash-quick-requests" class="hidden sm:inline-flex items-center gap-2 text-xs font-semibold bg-white/15 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition"><i data-lucide="archive" class="w-4 h-4"></i><span>درخواست‌ها</span></button>
                    <button id="dash-quick-add-emp" class="hidden sm:inline-flex items-center gap-2 text-xs font-semibold bg-white/15 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition"><i data-lucide="user-plus" class="w-4 h-4"></i><span>افزودن کارمند</span></button>
                    <button id="dash-quick-survey" class="hidden sm:inline-flex items-center gap-2 text-xs font-semibold bg-white/15 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition"><i data-lucide="clipboard-list" class="w-4 h-4"></i><span>نظرسنجی</span></button>
                </div>
            </div>
        </section>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="glass p-5 rounded-2xl shadow-sm flex items-center gap-4">
                <div class="p-3 rounded-xl" style="background:rgba(107,105,214,.12)"><i data-lucide="users" class="w-5 h-5" style="color:#6B69D6"></i></div>
                <div><p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">پرسنل</p><p class="text-3xl font-extrabold text-slate-800 mt-1">${metrics.totalEmployees}</p></div>
            </div>
            <div class="glass p-5 rounded-2xl shadow-sm flex items-center gap-4">
                <div class="p-3 rounded-xl" style="background:rgba(107,105,214,.12)"><i data-lucide="trending-up" class="w-5 h-5" style="color:#6B69D6"></i></div>
                <div><p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">ماندگاری</p><p class="text-3xl font-extrabold text-slate-800 mt-1">${metrics.retentionRate}%</p></div>
            </div>
            <div class="glass p-5 rounded-2xl shadow-sm flex items-center gap-4">
                <div class="p-3 rounded-xl" style="background:rgba(107,105,214,.12)"><i data-lucide="clock" class="w-5 h-5" style="color:#6B69D6"></i></div>
                <div><p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">میانگین سابقه</p><p class="text-3xl font-extrabold text-slate-800 mt-1">${metrics.averageTenure} <span class="text-xl font-medium">سال</span></p></div>
            </div>
            <div class="glass p-5 rounded-2xl shadow-sm flex items-center gap-4">
                <div class="p-3 rounded-xl" style="background:rgba(107,105,214,.12)"><i data-lucide="recycle" class="w-5 h-5" style="color:#6B69D6"></i></div>
                <div><p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">جابجایی داخلی</p><p class="text-3xl font-extrabold text-slate-800 mt-1">${metrics.internalMobilityRate}%</p></div>
            </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 class="font-bold text-slate-800 text-lg">بینش‌های کلیدی</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
                    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <h4 class="text-center text-xs font-medium text-slate-600 mb-2">نرخ مشارکت</h4>
                        <div class="relative w-full h-40"><canvas id="engagementGaugeDashboard"></canvas></div>
                    </div>
                    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"><h4 class="text-center text-xs font-medium text-slate-600 mb-2">توزیع استعدادها</h4><div class="relative w-full h-56"><canvas id="nineBoxChart"></canvas></div></div>
                    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"><h4 class="text-center text-xs font-medium text-slate-600 mb-2">ترکیب جنسیتی</h4><div class="relative w-full h-56"><canvas id="genderCompositionChart"></canvas></div></div>
                    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"><h4 class="text-center text-xs font-medium text-slate-600 mb-2">توزیع دپارتمان‌ها</h4><div class="relative w-full h-56"><canvas id="departmentDistributionChart"></canvas></div></div>
                    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"><h4 class="text-center text-xs font-medium text-slate-600 mb-2">سابقه کار</h4><div class="relative w-full h-56"><canvas id="tenureDistributionChart"></canvas></div></div>
                    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"><h4 class="text-center text-xs font-medium text-slate-600 mb-2">توزیع سنی</h4><div class="relative w-full h-56"><canvas id="ageDistributionChart"></canvas></div></div>
                    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm md:col-span-2 xl:col-span-1"><h4 class="text-center text-xs font-medium text-slate-600 mb-2">میانگین شایستگی</h4><div class="relative w-full h-56"><canvas id="teamCompetencyRadarChart"></canvas></div></div>
                </div>
            </div>

            <div class="space-y-8">
                <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-bold text-slate-800 text-lg">یادآورهای هوشمند</h3>
                        <button id="view-all-reminders-btn" class="text-xs font-semibold text-indigo-600 hover:underline">مشاهده همه</button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                        <input id="reminderText" type="text" placeholder="متن یادآور" class="p-2 border rounded-md text-sm">
                        <div class="flex items-center gap-2">
                            <input id="reminderDate" type="text" placeholder="تاریخ" class="p-2 border rounded-md text-sm w-full">
                            <input id="reminderDaysBefore" type="number" min="1" class="p-2 border rounded-md text-sm w-20" value="7" title="روز قبل">
                        </div>
                    </div>
                    <div class="flex justify-end mb-3">
                        <button id="addReminderBtn" class="primary-btn text-xs py-2 px-3">افزودن یادآور</button>
                    </div>
                    <div class="space-y-2">${renderAllReminders()}</div>
                </div>
                <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 class="font-bold text-slate-800 text-lg mb-4">استعدادهای در معرض ریسک</h3>
                    <div class="space-y-1">${highRiskHtml}</div>
                </div>
            </div>
        </div>
    `;
},
    talent: () => {
        return `
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 class="text-3xl font-bold text-slate-800">استعدادهای سازمان</h1>
                    <p class="text-sm text-slate-500 mt-1">مدیریت و مشاهده پروفایل کارمندان</p>
                </div>
                <div class="flex items-center gap-2 w-full md:w-auto">
                    <button id="export-csv-btn" class="bg-green-600 text-white py-2 px-5 rounded-lg hover:bg-green-700 shadow-md transition flex items-center gap-2 w-full md:w-auto"><i data-lucide="file-down"></i> خروجی CSV</button>
                    ${canEdit() ? `<button id="add-employee-btn" class="bg-blue-600 text-white py-2 px-5 rounded-lg hover:bg-blue-700 shadow-md transition flex items-center gap-2 w-full md:w-auto"><i data-lucide="plus"></i> افزودن کارمند</button>` : ''}
                </div>
            </div>
            <div class="card mb-6 p-4">
                <div class="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div class="w-full md:w-1/3 relative">
                        <input type="text" id="searchInput" placeholder="جستجوی کارمند..." class="w-full p-2 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                        <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                    </div>
                    <div class="w-full md:w-auto flex flex-wrap gap-2 justify-end">
                        <select id="departmentFilter" class="p-2 border border-slate-300 rounded-lg bg-white"><option value="">همه دپارتمان‌ها</option>${[...new Set(state.employees.map(e => e.department))].filter(Boolean).map(d => `<option value="${d}">${d}</option>`).join('')}</select>
                        <select id="statusFilter" class="p-2 border border-slate-300 rounded-lg bg-white"><option value="">همه وضعیت‌ها</option><option value="فعال">فعال</option><option value="غیرفعال">غیرفعال</option></select>
                    </div>
                </div>
            </div>
            <div id="employee-cards-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>
            <div id="pagination-container" class="p-4 flex justify-center mt-6"></div>
        `;
        // dismiss handler for info bubble
        try {
            const latestInfo = (state.announcements||[]).filter(a=> a.type==='info').sort((a,b)=> new Date(b.createdAt?.toDate?.()||0) - new Date(a.createdAt?.toDate?.()||0))[0];
            document.getElementById('dismiss-info')?.addEventListener('click', () => {
                if (latestInfo) localStorage.setItem(`dismiss_info_${employee.uid}`, latestInfo.firestoreId);
                document.getElementById('info-bubble')?.remove();
            });
        } catch {}
    },
    inbox: () => {
        const employee = state.employees.find(emp => emp.uid === state.currentUser?.uid);
        const content = employee ? renderEmployeePortalPage('inbox', employee) : `<div class="card p-6 text-sm text-slate-600">صندوق پیام در پورتال کارمند قابل دسترس است.</div>`;
        return content || `<div class="p-6"></div>`;
    },
organization: () => {
    if (state.teams.length === 0) return `<div class="text-center p-10 card"><i data-lucide="users-2" class="mx-auto w-16 h-16 text-slate-400"></i><h2 class="mt-4 text-xl font-semibold text-slate-700">هنوز تیمی ثبت نشده است</h2><p class="mt-2 text-slate-500">برای شروع، اولین تیم سازمان را از طریق دکمه زیر اضافه کنید.</p>${canEdit() ? `<button id="add-team-btn-empty" class="mt-6 bg-blue-600 text-white py-2 px-5 rounded-lg hover:bg-blue-700 shadow-md transition">افزودن تیم جدید</button>` : ''}</div>`;

    const teamCardsHtml = state.teams.map((team, index) => {
        const leader = state.employees.find(e => e.id === team.leaderId);
        
        const personnelIds = new Set(team.memberIds || []);
        if (team.leaderId) {
            personnelIds.add(team.leaderId);
        }
        const memberCount = personnelIds.size;
        const engagementScore = team.engagementScore || 0;
        const okrProgress = (team.okrs && team.okrs.length > 0)
            ? Math.round(team.okrs.reduce((sum, okr) => sum + okr.progress, 0) / team.okrs.length)
            : 0;

        const borderColor = teamColorPalette[index % teamColorPalette.length];

        return `
            <div class="card bg-white rounded-xl flex flex-col text-center shadow-lg transform hover:-translate-y-1.5 transition-transform duration-300">
                
                <div class="py-6">
                    <img src="${team.avatar}" alt="${team.name}" class="w-24 h-24 rounded-full mx-auto object-cover border-4 ${borderColor} shadow-md">
                </div>

                <div class="px-6 pb-2">
                    <h3 class="text-xl font-bold text-slate-800">${team.name}</h3>
                    <p class="text-xs text-slate-500 mt-1">${team.missionLine ? team.missionLine : (leader ? `رهبر: ${leader.name}` : '')}</p>
                </div>

                <div class="px-6 py-4 grid grid-cols-3 gap-4 border-y border-slate-100">
                    <div>
                        <p class="text-2xl font-bold text-slate-700">${memberCount}</p>
                        <p class="text-xs text-slate-500 font-medium">اعضا</p>
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-green-600">${engagementScore}%</p>
                        <p class="text-xs text-slate-500 font-medium">مشارکت</p>
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-blue-600">${okrProgress}%</p>
                        <p class="text-xs text-slate-500 font-medium">اهداف</p>
                    </div>
                </div>

                <div class="px-6 py-4 mt-auto flex justify-between items-center">
                    <div class="flex -space-x-2 overflow-hidden">
                        ${(Array.from(personnelIds).slice(0, 4)).map(memberId => {
                            const member = state.employees.find(e => e.id === memberId);
                            return member ? `<img class="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover" src="${member.avatar}" alt="${member.name}" title="${member.name}">` : '';
                        }).join('')}
                        ${memberCount > 4 ? `<div class="flex items-center justify-center h-8 w-8 rounded-full bg-slate-200 text-slate-600 text-xs font-medium ring-2 ring-white">+${memberCount - 4}</div>` : ''}
                    </div>
                    <div class="flex items-center gap-2">
                        ${isAdmin() ? `<button class="delete-team-btn p-2 text-slate-400 hover:text-rose-500 transition-colors" data-team-id="${team.firestoreId}" title="حذف تیم"><i data-lucide="trash-2" class="w-5 h-5"></i></button>` : ''}
                        <button class="view-team-profile-btn text-sm bg-slate-800 text-white py-2 px-4 rounded-lg hover:bg-slate-900 shadow-sm transition" data-team-id="${team.firestoreId}">
                            مشاهده
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold text-slate-800">تیم‌های سازمان</h1>
            ${canEdit() ? `<button id="add-team-btn" class="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 shadow-md transition flex items-center gap-2"><i data-lucide="plus"></i> افزودن تیم جدید</button>` : ''}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8" id="teams-container">
            ${teamCardsHtml}
        </div>
    `;
},
surveys: () => {
    // هر قالب نظرسنجی را به یک کارت مدرن تبدیل می‌کنیم
    const surveyCardsHtml = Object.values(surveyTemplates).map((survey, index) => {
        // انتخاب آیکون و رنگ از پالت به صورت چرخشی
        const visual = surveyVisualsPalette[index % surveyVisualsPalette.length];
        
        return `
            <div class="card bg-white p-6 flex flex-col items-center text-center rounded-xl shadow-lg transform hover:-translate-y-1.5 transition-transform duration-300">
                <div class="w-16 h-16 rounded-full ${visual.bg} flex items-center justify-center mb-4">
                    <i data-lucide="${visual.icon}" class="w-8 h-8 ${visual.color}"></i>
                </div>
                
                <h3 class="text-lg font-bold text-slate-800">${survey.title}</h3>
                <p class="text-sm text-slate-500 mt-2 flex-grow min-h-[60px]">${survey.description}</p>
                
                <button class="create-survey-link-btn mt-auto w-full text-sm bg-slate-800 text-white py-2.5 px-4 rounded-lg hover:bg-slate-900 transition-colors" data-survey-id="${survey.id}">
                    ایجاد لینک نظرسنجی
                </button>
            </div>
        `;
    }).join('');

    return `
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-3xl font-bold text-slate-800">نظرسنجی‌ها و بازخوردها</h1>
                <p class="text-sm text-slate-500 mt-1">یک قالب را برای شروع انتخاب کنید</p>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${surveyCardsHtml}
        </div>
    `;
},
// در فایل js/main.js، داخل آبجکت pages
// pages.expenses را حذف کرده و این را جایگزین کنید
// در فایل js/main.js، داخل آبجکت pages
// کل تابع requests را با این نسخه جایگزین کنید
// در فایل js/main.js، داخل آبجکت pages
// کل تابع requests را با این نسخه جایگزین کنید

// فایل: js/main.js
// تابع pages.requests را با این نسخه جایگزین کنید ▼

// فایل: js/main.js
// تابع pages.requests را با این نسخه جایگزین کنید ▼

requests: () => {
    const REQUESTS_PAGE_SIZE = 10;
    let filteredRequests = (state.requests || []);
    if (state.requestFilter === 'mine' && state.currentUser) {
        filteredRequests = filteredRequests.filter(req => req.assignedTo === state.currentUser.uid);
    }
    const allRequests = filteredRequests.sort((a, b) => new Date(b.createdAt?.toDate()) - new Date(a.createdAt?.toDate()));
    
    const startIndex = (state.currentPageRequests - 1) * REQUESTS_PAGE_SIZE;
    const endIndex = startIndex + REQUESTS_PAGE_SIZE;
    const paginatedRequests = allRequests.slice(startIndex, endIndex);

    const admins = state.users.filter(u => u.role === 'admin');
    const requestsHtml = paginatedRequests.map(req => {
        const statusColors = {'درحال بررسی':'bg-yellow-100 text-yellow-800','در حال انجام':'bg-blue-100 text-blue-800','تایید شده':'bg-green-100 text-green-800','رد شده':'bg-red-100 text-red-800'};
        const adminOptions = admins.map(admin => `<option value="${admin.firestoreId}" ${req.assignedTo === admin.firestoreId ? 'selected' : ''}>${admin.name || admin.email}</option>`).join('');
        return `<tr class="border-b"><td class="px-4 py-3 whitespace-nowrap">${toPersianDate(req.createdAt)}</td><td class="px-4 py-3 font-semibold">${req.employeeName}</td><td class="px-4 py-3">${req.requestType}</td><td class="px-4 py-3"><span class="px-2 py-1 text-xs font-medium rounded-full ${statusColors[req.status] || 'bg-slate-100'}">${req.status}</span></td><td class="px-4 py-3 min-w-[150px]"><select data-id="${req.firestoreId}" class="assign-request-select w-full p-1.5 border border-slate-300 rounded-lg bg-white text-xs"><option value="">واگذار نشده</option>${adminOptions}</select></td><td class="px-4 py-3">${(req.status === 'درحال بررسی' || req.status === 'در حال انجام') ? `<button class="process-request-btn text-sm bg-slate-700 text-white py-1 px-3 rounded-md hover:bg-slate-800" data-id="${req.firestoreId}">پردازش</button>` : '<span class="text-xs text-slate-400">-</span>'}</td></tr>`;
    }).join('');

    return `
        <section class="rounded-2xl overflow-hidden border mb-6" style="background:linear-gradient(90deg,#FF6A3D,#F72585)"><div class="p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4"><h1 class="text-2xl sm:text-3xl font-extrabold text-white">مدیریت درخواست‌ها</h1><div class="flex items-center gap-2"><button data-filter="all" class="request-filter-btn ${state.requestFilter === 'all' ? 'primary-btn' : 'secondary-btn'} text-xs">همه</button><button data-filter="mine" class="request-filter-btn ${state.requestFilter === 'mine' ? 'primary-btn' : 'secondary-btn'} text-xs">واگذار به من</button></div></div></section>
        <div class="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200">
            <div class="overflow-x-auto">
                <table class="w-full text-sm"><thead style="background:#ECEEF3"><tr><th class="px-4 py-2 font-semibold">تاریخ</th><th class="px-4 py-2 font-semibold">کارمند</th><th class="px-4 py-2 font-semibold">نوع</th><th class="px-4 py-2 font-semibold">وضعیت</th><th class="px-4 py-2 font-semibold">واگذار به</th><th class="px-4 py-2 font-semibold">عملیات</th></tr></thead><tbody id="requests-table-body">${requestsHtml || '<tr><td colspan="6" class="text-center py-8 text-slate-500">هیچ درخواستی ثبت نشده است.</td></tr>'}</tbody></table>
            </div>
            <div id="pagination-container" class="p-4 flex justify-center mt-6"></div>
        </div>
    `;
},
  // در فایل js/main.js، به آبجکت pages این بخش جدید را اضافه کنید
// در فایل js/main.js، داخل آبجکت pages
// کل این تابع را با نسخه جدید جایگزین کنید
// فایل: js/main.js
// آبجکت pages.tasks را به طور کامل با این نسخه جایگزین کنید ▼

// فایل: js/main.js
// تابع pages.tasks را به طور کامل با این نسخه جایگزین کنید ▼

// فایل: js/main.js
// تابع pages.tasks را به طور کامل با این نسخه صحیح جایگزین کنید ▼

tasks: () => {
    const TASKS_PAGE_SIZE = 10;
    if (!state.currentUser) return '';
    
    const allMyTasks = (state.reminders || [])
        .filter(r => r.assignedTo === state.currentUser.uid)
        .sort((a, b) => new Date(a.date?.toDate ? a.date.toDate() : a.date) - new Date(b.date?.toDate ? b.date.toDate() : b.date));

    const startIndex = (state.currentPageTasks - 1) * TASKS_PAGE_SIZE;
    const endIndex = startIndex + TASKS_PAGE_SIZE;
    const paginatedTasks = allMyTasks.slice(startIndex, endIndex);

    const admins = state.users.filter(u => u.role === 'admin');
    const tasksHtml = paginatedTasks.map(task => {
        const statusColors = {'جدید':'bg-yellow-100 text-yellow-800','در حال انجام':'bg-blue-100 text-blue-800','انجام شده':'bg-green-100 text-green-800'};
        const adminOptions = admins.map(admin => `<option value="${admin.firestoreId}" ${task.assignedTo === admin.firestoreId ? 'selected' : ''}>${admin.name || admin.email}</option>`).join('');
        return `<tr class="border-b"><td class="px-4 py-3 whitespace-nowrap">${toPersianDate(task.date)}</td><td class="px-4 py-3">${task.type}</td><td class="px-4 py-3 text-sm min-w-[200px]">${task.text}</td><td class="px-4 py-3"><span class="px-2 py-1 text-xs font-medium rounded-full ${statusColors[task.status] || 'bg-slate-100'}">${task.status}</span></td><td class="px-4 py-3 min-w-[150px]"><select data-id="${task.firestoreId}" class="assign-reminder-select w-full p-1.5 border border-slate-300 rounded-lg bg-white text-xs">${adminOptions}</select></td><td class="px-4 py-3"><button class="process-reminder-btn text-sm bg-slate-700 text-white py-1 px-3 rounded-md hover:bg-slate-800" data-id="${task.firestoreId}">پردازش</button></td></tr>`;
    }).join('');

    return `
        <section class="rounded-2xl overflow-hidden border mb-6" style="background:linear-gradient(90deg,#FF6A3D,#F72585)"><div class="p-6 sm:p-8"><h1 class="text-2xl sm:text-3xl font-extrabold text-white">وظایف من</h1><p class="text-white/90 text-xs mt-1">یادآورها و کارهایی که به شما واگذار شده است</p></div></section>
        <div class="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead style="background:#ECEEF3"><tr><th class="px-4 py-2 font-semibold">تاریخ</th><th class="px-4 py-2 font-semibold">نوع</th><th class="px-4 py-2 font-semibold">متن</th><th class="px-4 py-2 font-semibold">وضعیت</th><th class="px-4 py-2 font-semibold">واگذار به</th><th class="px-4 py-2 font-semibold">عملیات</th></tr></thead>
                    <tbody id="tasks-table-body">${tasksHtml || '<tr><td colspan="6" class="text-center py-8 text-slate-500">هیچ وظیفه‌ای به شما واگذار نشده است.</td></tr>'}</tbody>
                </table>
            </div>
            <div id="pagination-container" class="p-4 flex justify-center mt-6"></div>
        </div>
    `;
},
// فایل: js/main.js
// کل تابع pages.analytics را با این نسخه جایگزین کنید ▼

// فایل: js/main.js
// کل تابع pages.analytics را با این نسخه جایگزین کنید ▼

analytics: () => {
    return `
        <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div>
                <h1 class="text-3xl font-bold text-slate-800">تحلیل هوشمند</h1>
                <p class="text-sm text-slate-500 mt-1">مرکز فرماندهی داده‌های استعدادهای سازمان</p>
            </div>
            </div>

        <div class="mb-6 border-b border-slate-200">
            <nav id="analytics-tabs" class="flex -mb-px space-x-6 space-x-reverse" aria-label="Tabs">
                <button data-tab="overview" class="analytics-tab shrink-0 border-b-2 font-semibold px-1 py-3 text-sm border-blue-600 text-blue-600">
                    نمای کلی استعدادها
                </button>
                <button data-tab="health" class="analytics-tab shrink-0 border-b-2 font-semibold px-1 py-3 text-sm border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300">
                    سلامت سازمان
                </button>
                <button data-tab="tools" class="analytics-tab shrink-0 border-b-2 font-semibold px-1 py-3 text-sm border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300">
                    ابزارهای تحلیلی
                </button>
            </nav>
        </div>

        <div id="analytics-tab-content">
            <div id="tab-overview" class="analytics-tab-pane space-y-8">
                <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div class="xl:col-span-2 card p-6">
                        <h3 class="font-semibold text-lg mb-4 flex items-center"><i data-lucide="layout-grid" class="ml-2 text-indigo-500"></i>ماتریس استعداد ۹-جعبه‌ای</h3>
                        <div class="flex">
                            <div class="flex flex-col justify-between text-center text-xs text-slate-500 font-medium pr-2">
                                <span>پتانسیل بالا</span>
                                <span>متوسط</span>
                                <span>پتانسیل کم</span>
                            </div>
                            <div id="nine-box-grid-container" class="w-full"></div>
                        </div>
                        <div class="flex justify-between text-xs text-slate-500 font-medium px-4 mt-2">
                            <span>عملکرد پایین</span>
                            <span>عملکرد متوسط</span>
                            <span>عملکرد بالا</span>
                        </div>
                    </div>
                    <div class="card p-6">
                        <h3 class="font-semibold text-lg mb-4 flex items-center"><i data-lucide="flame" class="ml-2 text-red-500"></i>نقاط داغ ریسک خروج</h3>
                        <div id="attrition-hotspot-list" class="space-y-4 max-h-[400px] overflow-y-auto pr-2"></div>
                    </div>
                </div>
            </div>

            <div id="tab-health" class="analytics-tab-pane hidden space-y-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="card p-6">
                        <h3 class="font-semibold text-lg mb-4 flex items-center"><i data-lucide="pie-chart" class="ml-2 text-blue-500"></i>تحلیل مشارکت سازمانی</h3>
                        <div class="relative h-80"><canvas id="engagementBreakdownChart"></canvas></div>
                    </div>
                    <div class="card p-6">
                        <h3 class="font-semibold text-lg mb-4 flex items-center"><i data-lucide="activity" class="ml-2 text-green-500"></i>نمره سلامت تیم‌ها</h3>
                        <div class="relative h-80"><canvas id="teamHealthChart"></canvas></div>
                    </div>
                    <div class="card p-6 lg:col-span-2">
                        <h3 class="font-semibold text-lg mb-4 flex items-center"><i data-lucide="align-center" class="ml-2 text-purple-500"></i>توزیع امتیازات عملکرد</h3>
                        <p class="text-xs text-slate-500 mb-4">این نمودار توزیع کارکنان بر اساس آخرین امتیاز ارزیابی عملکرد آن‌ها را نشان می‌دهد.</p>
                        <div class="relative h-80"><canvas id="performanceDistributionChart"></canvas></div>
                    </div>
                </div>
            </div>

            <div id="tab-tools" class="analytics-tab-pane hidden space-y-8">
                <div class="card p-6 max-w-2xl mx-auto">
                    <h3 class="font-semibold text-lg mb-4 flex items-center"><i data-lucide="file-search" class="ml-2 text-teal-500"></i>تحلیل شکاف مهارتی</h3>
                    <div class="flex flex-col gap-3">
                        <select id="skill-team-select" class="w-full p-2 border border-slate-300 rounded-lg bg-white">
                            <option value="all">کل سازمان</option>
                            ${state.teams.map(t => `<option value="${t.firestoreId}">${t.name}</option>`).join('')}
                        </select>
                        <input type="text" id="skill-search-input" placeholder="مهارت مورد نظر (مثلا: Python)" class="w-full p-2 border border-slate-300 rounded-lg">
                        <button id="find-skill-gap-btn" class="bg-slate-800 text-white py-2 px-4 rounded-lg hover:bg-slate-900 w-full">جستجو</button>
                    </div>
                    <div id="skill-gap-results" class="mt-4 pt-4 border-t border-slate-200 min-h-[5rem]">
                        <p class="text-sm text-slate-500 text-center">برای شروع، یک تیم و مهارت را انتخاب کنید.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
},
// فایل: js/main.js
// تابع pages.documents را به طور کامل با این نسخه جایگزین کنید ▼

// فایل: js/main.js
// تابع pages.documents را با این نسخه جایگزین کنید ▼

documents: () => {
    // حالا از ثابت مرکزی استفاده می‌کنیم
    const docSections = documentCategories;
    const colors = ['#6B69D6','#FF6A3D','#10B981','#F59E0B','#0EA5E9','#F43F5E'];
    
    const cards = docSections.map((s, idx) => {
        const color = colors[idx % colors.length];
        const count = (state.companyDocuments || []).filter(d => d.categoryKey === s.key).length;
        return `
            <div class="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-shadow">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background:${color}1a;">
                        <i data-lucide="${s.icon}" class="w-6 h-6" style="color:${color}"></i>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-slate-800">${s.id}</h3>
                        <p class="text-xs text-slate-500">${s.desc}</p>
                    </div>
                    <span class="text-xs px-2 py-1 rounded-full" style="background:${color}1a;color:${color}">${count} فایل</span>
                </div>
                <div class="mt-4 flex justify-between">
                    <button class="manage-docs-btn text-xs font-semibold px-3 py-1.5 rounded-lg" data-category-key="${s.key}" style="color:#fff;background:${color}">مدیریت</button>
                    <button class="view-docs-btn text-xs font-semibold px-3 py-1.5 rounded-lg border" data-category-key="${s.key}" style="border-color:${color};color:${color}">نمایش</button>
                </div>
            </div>`;
    }).join('');

    return `
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div><h1 class="text-3xl font-bold text-slate-800">اسناد سازمان</h1><p class="text-slate-500 text-sm mt-1">مدیریت دانش‌نامه برای کل سازمان</p></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">${cards}</div>
    `;
},
// در فایل js/main.js، داخل آبجکت pages
// کل این تابع را با نسخه جدید جایگزین کنید

announcements: () => {
    const teamCards = (state.teams||[]).map(t=> `<label class=\"flex items-center gap-2 p-2 border rounded-lg\"><input type=\"checkbox\" class=\"ann-team-chk\" value=\"${t.firestoreId}\" data-name=\"${t.name}\"><span class=\"w-6 h-6 rounded-full bg-slate-200\"></span><span class=\"text-sm\">${t.name}</span></label>`).join('');
    const userCards = (state.employees||[]).map(e=> `<label class=\"flex items-center gap-2 p-2 border rounded-lg\"><input type=\"checkbox\" class=\"ann-user-chk\" value=\"${e.firestoreId}\" data-name=\"${e.name}\"><img src=\"${e.avatar}\" class=\"w-6 h-6 rounded-full object-cover\"><span class=\"text-sm\">${e.name}</span></label>`).join('');

    return `
        <div class="mb-4 flex items-center justify-between">
            <h1 class="text-2xl font-extrabold text-slate-800">اعلانات</h1>
            <button id="add-announcement-btn" class="secondary-btn text-xs">ارسال پیام پیشرفته</button>
        </div>
        <div class="mb-4 flex flex-col md:flex-row gap-3 md:items-center">
            <div class="relative w-full md:w-72">
                <input id="ann-search" class="w-full p-2 pl-9 border border-slate-300 rounded-lg bg-white" placeholder="جستجو در عنوان و متن">
                <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            </div>
            <div class="flex gap-2">
                <button class="ann-filter-chip px-3 py-1 rounded-full text-xs bg-slate-800 text-white" data-type="all">همه</button>
                <button class="ann-filter-chip px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-700" data-type="info">اطلاعیه‌ها</button>
                <button class="ann-filter-chip px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-700" data-type="message">پیام‌ها</button>
            </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 space-y-3" id="ann-cards-container"></div>
            <div class="space-y-4">
                <div class="bg-white rounded-2xl border border-slate-200 p-4">
                    <h3 class="font-bold text-slate-800 mb-2">ارسال اطلاعیه</h3>
                    <select id="info-target-type" class="w-full p-2 border rounded-md bg-white mb-2">
                        <option value="public">عمومی (همه)</option>
                        <option value="teams">تیم‌ها</option>
                        <option value="users">افراد</option>
                        <option value="roles">نقش‌ها</option>
                    </select>
                    <div id="info-target-teams" class="hidden grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">${teamCards}</div>
                    <div id="info-target-users" class="hidden grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">${userCards}</div>
                    <div id="info-target-roles" class="hidden grid grid-cols-1 gap-2">
                        <label class="flex items-center gap-2 p-2 border rounded-lg"><input type="checkbox" class="ann-role-chk" value="admin"><span class="text-sm">مدیران</span></label>
                        <label class="flex items-center gap-2 p-2 border rounded-lg"><input type="checkbox" class="ann-role-chk" value="employee"><span class="text-sm">کارمندان</span></label>
                    </div>
                    <input id="info-title" class="w-full p-2 border rounded-md mb-2" placeholder="عنوان اطلاعیه (اختیاری)">
                    <textarea id="info-content" class="w-full p-2 border rounded-md h-24" placeholder="متن اطلاعیه..."></textarea>
                    <div class="flex justify-end mt-2"><button id="info-send-btn" class="primary-btn text-xs">ارسال اطلاعیه</button></div>
                </div>
            </div>
        </div>
    `;
},
// در فایل js/main.js، داخل آبجکت pages
// کل این تابع را جایگزین نسخه فعلی کنید
// در فایل js/main.js، داخل آبجکت pages
// کل این تابع را جایگزین نسخه فعلی کنید

// فایل: js/main.js
// کل تابع settings را با این نسخه جایگزین کنید ▼

// فایل: js/main.js
// ▼▼▼ کل تابع pages.settings را با این کد جایگزین کنید ▼▼▼

settings: () => {
    if (!isAdmin()) {
        return `<div class="text-center p-10 card"><i data-lucide="lock" class="mx-auto w-16 h-16 text-red-500"></i><h2 class="mt-4 text-xl font-semibold text-slate-700">دسترسی غیر مجاز</h2><p class="mt-2 text-slate-500">شما برای مشاهده این صفحه دسترسی لازم را ندارید.</p></div>`;
    }

    // --- بخش تعریف متغیرها برای ساخت محتوای تب‌ها ---
    const admins = state.users.filter(u => u.role === 'admin');

    const usersHtml = state.users.map(user => {
        const userInitial = user.name ? user.name.substring(0, 1) : user.email.substring(0, 1).toUpperCase();
        const isCurrentUser = user.firestoreId === state.currentUser.uid;
        return `
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div class="flex items-center w-full sm:w-auto min-w-0">
                    <div class="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm ml-4 shrink-0">${userInitial}</div>
                    <div class="min-w-0">
                        <p class="font-semibold text-sm text-slate-800 truncate">${user.name || 'نامشخص'} ${isCurrentUser ? '<span class="text-xs text-blue-600">(شما)</span>' : ''}</p>
                        <p class="text-xs text-slate-500 truncate">${user.email}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <select data-uid="${user.firestoreId}" class="role-select p-2 border border-slate-300 rounded-lg bg-white text-sm flex-grow" ${isCurrentUser ? 'disabled' : ''}>
                        <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>مشاهده‌گر</option>
                        <option value="editor" ${user.role === 'editor' ? 'selected' : ''}>ویرایشگر</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>مدیر</option>
                        <option value="employee" ${user.role === 'employee' ? 'selected' : ''}>کارمند</option>
                    </select>
                    ${!isCurrentUser ? `
                    <button class="edit-user-btn p-2 text-slate-500 hover:text-blue-600" data-uid="${user.firestoreId}" title="ویرایش"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button class="delete-user-btn p-2 text-slate-500 hover:text-red-600" data-uid="${user.firestoreId}" title="حذف"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    ` : '<div class="w-12"></div>'}
                </div>
            </div>
        `;
    }).join('');

    const competenciesHtml = (state.competencies || []).map(c => `
        <div class="inline-flex items-center bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1.5 rounded-full">
            <span>${c.name}</span>
            <button class="delete-competency-btn text-slate-400 hover:text-red-500 mr-2" data-id="${c.firestoreId}"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
    `).join('') || '<p class="text-sm text-slate-500">هنوز شایستگی‌ای تعریف نشده است.</p>';
    
    const rulesHtml = (state.assignmentRules || []).filter(r => r.firestoreId !== '_default').map(rule => {
        const assignee = admins.find(a => a.firestoreId === rule.assigneeUid);
        return `
            <div class="p-3 bg-slate-100 rounded-lg flex justify-between items-center">
                <div>
                    <p class="font-semibold">${rule.ruleName}</p>
                    <p class="text-xs text-slate-500">
                        برای: ${(rule.itemTypes || []).join('، ')}
                        <i data-lucide="arrow-left" class="inline-block w-3 h-3"></i> 
                        ${assignee ? assignee.name : 'کاربر حذف شده'}
                    </p>
                </div>
                <div>
                    <button class="edit-rule-btn p-2 text-slate-500 hover:text-blue-600" data-id="${rule.firestoreId}"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button class="delete-rule-btn p-2 text-slate-500 hover:text-red-600" data-id="${rule.firestoreId}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>
        `;
    }).join('');
    
    const defaultRule = (state.assignmentRules || []).find(r => r.firestoreId === '_default');

    const jobPositionsHtml = (state.jobPositions || []).map(pos => `
        <tr class="border-b">
            <td class="p-3 font-semibold">${pos.name}</td>
            <td class="p-3 text-sm">${(pos.competencyIds || []).length} شایستگی</td>
            <td class="p-3 text-right">
                <button class="map-competencies-btn text-blue-600 hover:underline text-xs" data-id="${pos.firestoreId}">اتصال شایستگی</button>
                <button class="edit-position-btn p-2 text-slate-500 hover:text-blue-600" data-id="${pos.firestoreId}"><i data-lucide="edit" class="w-4 h-4"></i></button>
                <button class="delete-position-btn p-2 text-slate-500 hover:text-red-600" data-id="${pos.firestoreId}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="3" class="text-center p-4 text-slate-500">هیچ پوزیشن شغلی تعریف نشده است.</td></tr>';

    // [!code start]
    // ▼▼▼ این متغیر جدید برای نمایش لیست خانواده‌های شغلی است ▼▼▼
    const jobFamiliesHtml = (state.jobFamilies || []).map(f => `
        <div class="inline-flex items-center bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1.5 rounded-full">
            <span>${f.name}</span>
            <button class="delete-family-btn text-slate-400 hover:text-red-500 mr-2" data-id="${f.firestoreId}"><i data-lucide="x" class="w-4 h-4"></i></button>
        </div>
    `).join('') || '<p class="text-sm text-slate-500">هنوز خانواده شغلی‌ای تعریف نشده است.</p>';
    // [!code end]

    return `
        <div class="flex items-center justify-between mb-4">
            <div><h1 class="text-3xl font-bold text-slate-800">تنظیمات سیستم</h1><p class="text-sm text-slate-500 mt-1">مدیریت کاربران، دسترسی‌ها و پیکربندی سازمان</p></div>
        </div>
        
        <div class="bg-gradient-to-l from-[#F72585]/10 to-[#6B69D6]/10 rounded-xl p-4 border mb-6">
            <nav id="settings-tabs" class="flex flex-wrap gap-2" aria-label="Tabs">
                <button data-tab="users" class="settings-tab primary-btn text-xs py-2 px-3">کاربران</button>
                <button data-tab="families" class="settings-tab secondary-btn text-xs py-2 px-3">خانواده‌های شغلی</button>
                <button data-tab="positions" class="settings-tab secondary-btn text-xs py-2 px-3">پوزیشن‌های شغلی</button>
                <button data-tab="competencies" class="settings-tab secondary-btn text-xs py-2 px-3">شایستگی‌ها</button>
                <button data-tab="rules" class="settings-tab secondary-btn text-xs py-2 px-3">قوانین واگذاری</button>
                <button data-tab="evaluation" class="settings-tab secondary-btn text-xs py-2 px-3">مدیریت ارزیابی</button>
            </nav>
        </div>

        <div id="settings-tab-content">
            <div id="tab-users" class="settings-tab-pane">
                <div class="card p-0"><div class="flex flex-col sm:flex-row justify-between items-center p-5 border-b border-slate-200 gap-3"><h3 class="font-semibold text-lg flex items-center"><i data-lucide="users" class="ml-2 text-indigo-500"></i>لیست کاربران سیستم</h3><button id="add-user-btn" class="primary-btn text-sm flex items-center gap-2 w-full sm:w-auto"><i data-lucide="plus" class="w-4 h-4"></i> کاربر جدید</button></div><div id="users-list-container" class="p-5 grid grid-cols-1 xl:grid-cols-2 gap-4">${usersHtml}</div></div>
            </div>

            <div id="tab-families" class="settings-tab-pane hidden">
                <div class="card p-6">
                    <h3 class="font-semibold text-lg mb-4 flex items-center"><i data-lucide="users-2" class="ml-2 text-sky-500"></i>مدیریت خانواده‌های شغلی</h3>
                    <div id="families-list" class="flex flex-wrap gap-2 mb-4">${jobFamiliesHtml}</div>
                    <form id="add-family-form" class="flex flex-col sm:flex-row gap-2">
                        <input type="text" id="new-family-name" placeholder="نام خانواده شغلی جدید (مثال: فنی و مهندسی)" class="w-full p-2 border border-slate-300 rounded-lg text-sm" required>
                        <button type="submit" class="primary-btn shrink-0">افزودن</button>
                    </form>
                </div>
            </div>

            <div id="tab-positions" class="settings-tab-pane hidden">
                <div class="card p-0"><div class="flex justify-between items-center p-5 border-b"><h3 class="font-semibold text-lg flex items-center"><i data-lucide="briefcase" class="ml-2 text-green-500"></i>مدیریت پوزیشن‌های شغلی</h3><button id="add-position-btn" class="primary-btn text-sm">افزودن پوزیشن جدید</button></div><div class="overflow-x-auto"><table class="w-full"><thead class="bg-slate-50"><tr><th class="p-3 text-right">نام پوزیشن</th><th class="p-3 text-right">شایستگی‌ها</th><th class="p-3 text-right"></th></tr></thead><tbody>${jobPositionsHtml}</tbody></table></div></div>
            </div>

            <div id="tab-competencies" class="settings-tab-pane hidden">
                <div class="card p-6"><h3 class="font-semibold text-lg mb-4 flex items-center"><i data-lucide="star" class="ml-2 text-amber-500"></i>مدیریت شایستگی‌ها</h3><div id="competencies-list" class="flex flex-wrap gap-2 mb-4">${competenciesHtml}</div><form id="add-competency-form" class="flex flex-col sm:flex-row gap-2"><input type="text" id="new-competency-name" placeholder="نام شایستگی جدید..." class="w-full p-2 border border-slate-300 rounded-lg text-sm" required><button type="submit" class="primary-btn shrink-0">افزودن</button></form></div>
            </div>

            <div id="tab-rules" class="settings-tab-pane hidden">
                <div class="card p-6"><div class="flex justify-between items-center mb-4"><h3 class="font-semibold text-lg flex items-center"><i data-lucide="git-branch-plus" class="ml-2 text-purple-500"></i>قوانین واگذاری هوشمند</h3><button id="add-rule-btn" class="primary-btn text-sm">افزودن قانون جدید</button></div><div id="rules-list" class="space-y-3">${rulesHtml || '<p class="text-center text-sm text-slate-400">قانونی تعریف نشده است.</p>'}</div><div class="mt-6 border-t pt-4"><h4 class="font-semibold text-md mb-2">واگذاری پیش‌فرض</h4><p class="text-sm text-slate-500 mb-2">درخواست‌هایی که با هیچ قانونی مطابقت ندارند به صورت پیش‌فرض به کاربر زیر واگذار می‌شوند:</p><select id="default-assignee-select" class="p-2 border rounded-md bg-white"><option value="">هیچکس</option>${admins.map(admin => `<option value="${admin.firestoreId}" ${defaultRule?.assigneeUid === admin.firestoreId ? 'selected' : ''}>${admin.name || admin.email}</option>`).join('')}</select></div></div>
            </div>
        </div>
    `;
},
// فایل: js/main.js
// این تابع را به آبجکت pages اضافه کنید ▼

evaluation: () => {
    const cycles = (state.evaluationCycles || []).sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0));
    const cyclesHtml = cycles.map(cycle => {
        const statusMap = {
            'planning': { text: 'در حال برنامه‌ریزی', color: 'bg-yellow-100 text-yellow-800' },
            'active': { text: 'فعال', color: 'bg-green-100 text-green-800' },
            'closed': { text: 'بسته شده', color: 'bg-slate-100 text-slate-800' }
        };
        const status = statusMap[cycle.status] || { text: cycle.status, color: 'bg-slate-100' };
        return `
            <tr class="border-b">
                <td class="p-3 font-semibold">${cycle.title}</td>
                <td class="p-3 text-sm">${toPersianDate(cycle.startDate)}</td>
                <td class="p-3 text-sm">${toPersianDate(cycle.endDate)}</td>
                <td class="p-3"><span class="px-2 py-1 text-xs font-medium rounded-full ${status.color}">${status.text}</span></td>
                <td class="p-3 text-left">
                    ${cycle.status === 'planning' ? `<button class="start-cycle-btn text-green-600 hover:underline text-xs mr-2" data-id="${cycle.firestoreId}">شروع دوره</button>` : ''}
                    <button class="edit-cycle-btn p-2 text-slate-500 hover:text-blue-600" data-id="${cycle.firestoreId}"><i data-lucide="edit" class="w-4 h-4"></i></button>
                    <button class="delete-cycle-btn p-2 text-slate-500 hover:text-red-600" data-id="${cycle.firestoreId}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="5" class="text-center p-4 text-slate-500">هیچ دوره‌ای تعریف نشده است.</td></tr>';

    return `
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold text-slate-800">مدیریت دوره‌های ارزیابی</h1>
            <button id="add-cycle-btn" class="primary-btn text-sm">ایجاد دوره جدید</button>
        </div>
        <div class="card p-0">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-slate-50">
                        <tr>
                            <th class="p-3 text-right">عنوان دوره</th>
                            <th class="p-3 text-right">تاریخ شروع</th>
                            <th class="p-3 text-right">تاریخ پایان</th>
                            <th class="p-3 text-right">وضعیت</th>
                            <th class="p-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody>${cyclesHtml}</tbody>
                </table>
            </div>
        </div>
    `;
},
}; // <<--- آبجکت pages اینجا تمام می‌شود

const showEditUserForm = (user) => {
    modalTitle.innerText = `ویرایش کاربر: ${user.name}`;
    modalContent.innerHTML = `
        <form id="edit-user-form" class="space-y-4">
            <input type="hidden" id="edit-user-uid" value="${user.firestoreId}">
            <div>
                <label for="edit-user-name" class="block text-sm font-medium text-gray-700">نام کامل</label>
                <input id="edit-user-name" type="text" value="${user.name || ''}" required class="w-full px-3 py-2 mt-1 border rounded-md">
            </div>
             <div>
                <label for="edit-user-email" class="block text-sm font-medium text-gray-700">آدرس ایمیل</label>
                <input id="edit-user-email" type="email" value="${user.email}" disabled class="w-full px-3 py-2 mt-1 border rounded-md bg-slate-100">
            </div>
            <div>
                <label for="edit-user-role" class="block text-sm font-medium text-gray-700">سطح دسترسی</label>
// ...
<select id="new-user-role" class="w-full p-2 mt-1 border rounded-md">
    <option value="viewer">مشاهده‌گر (Viewer)</option>
    <option value="editor">ویرایشگر (Editor)</option>
    <option value="admin">مدیر (Admin)</option>
    <option value="employee">کارمند (Employee)</option> </select>
// ...
            </div>
            <div class="pt-4 flex justify-end">
                <button type="submit" class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">ذخیره تغییرات</button>
            </div>
        </form>
    `;
    openModal(mainModal, mainModalContainer);

    document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const uid = document.getElementById('edit-user-uid').value;
        const name = document.getElementById('edit-user-name').value;
        const role = document.getElementById('edit-user-role').value;

        try {
            const userRef = doc(db, `artifacts/${appId}/public/data/users`, uid);
            await updateDoc(userRef, {
                name: name,
                role: role
            });
            closeModal(mainModal, mainModalContainer);
            showToast("اطلاعات کاربر با موفقیت به‌روزرسانی شد.");
        } catch (error) {
            console.error("Error updating user:", error);
            showToast("خطا در به‌روزرسانی اطلاعات کاربر.", "error");
        }
    });
};
// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

function setupProfileModalListeners(emp) {
    const tabs = document.querySelectorAll('#profile-tabs .profile-tab');
    const contents = document.querySelectorAll('.profile-tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const target = tab.getAttribute('data-tab');
            if (!target) return;
            // update tab button styles
            tabs.forEach(t => {
                t.classList.remove('active', 'primary-btn');
                if (!t.classList.contains('secondary-btn')) t.classList.add('secondary-btn');
            });
            tab.classList.add('active');
            tab.classList.remove('secondary-btn');
            if (!tab.classList.contains('primary-btn')) tab.classList.add('primary-btn');
            // show target panel
            contents.forEach(c => c.classList.add('hidden'));
            const panel = document.getElementById(`tab-${target}`);
            if (panel) panel.classList.remove('hidden');
            try { lucide.createIcons(); } catch {}
        });
    });

    const container = document.getElementById('modalContent');
    if (!container) return;
    container.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.id;
                // [!code start]
        if (id === 'start-evaluation-btn') {
            const cycleId = btn.dataset.cycleId;
            const cycle = state.evaluationCycles.find(c => c.firestoreId === cycleId);
            if (emp && cycle) {
                showEvaluationForm(emp, cycle);
            }
            return;
        }
        // [!code end]
        try {
            if (id === 'change-avatar-btn') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    const sRef = ref(storage, `avatars/${emp.uid || emp.firestoreId}_${Date.now()}`);
                    const snap = await uploadBytes(sRef, file);
                    const url = await getDownloadURL(snap.ref);
                    await updateDoc(doc(db, `artifacts/${appId}/public/data/employees`, emp.firestoreId), { avatar: url });
                    showToast('عکس پروفایل بروزرسانی شد.');
                    viewEmployeeProfile(emp.firestoreId);
                };
                input.click();
                return;
            }
            if (id === 'delete-avatar-btn') {
                showConfirmationModal('حذف عکس پروفایل', 'آیا مطمئن هستید؟', async () => {
                    const def = `https://placehold.co/100x100/E2E8F0/4A5568?text=${(emp.name||'NA').substring(0,2)}`;
                    await updateDoc(doc(db, `artifacts/${appId}/public/data/employees`, emp.firestoreId), { avatar: def });
                    showToast('عکس پروفایل حذف شد.');
                    viewEmployeeProfile(emp.firestoreId);
                });
                return;
            }
            if (id === 'main-edit-employee-btn') { showEmployeeForm(emp.firestoreId); return; }
            if (id === 'edit-competencies-btn') { showEditCompetenciesForm(emp); return; }
            if (id === 'add-performance-btn') { showPerformanceForm(emp); return; }
            if (id === 'edit-personal-info-btn') { showEditPersonalInfoForm(emp); return; }
            if (id === 'add-contract-btn') { showContractForm(emp); return; }
            if (id === 'edit-career-path-btn') { showEditCareerPathForm(emp); return; }
            if (btn.classList.contains('edit-performance-btn')) { showPerformanceForm(emp, parseInt(btn.dataset.index)); return; }
            if (btn.classList.contains('delete-performance-btn')) { deletePerformanceReview(emp, parseInt(btn.dataset.index)); return; }
        } finally {
            try { lucide.createIcons(); } catch {}
        }
    });
}
// Contract editor (add/extend)
function showContractForm(emp, idx=null) {
    modalTitle.innerText = `${idx===null ? 'افزودن/تمدید' : 'ویرایش'} قرارداد برای ${emp.name}`;
    const c = (emp.contracts && idx!=null) ? emp.contracts[idx] : {};
    modalContent.innerHTML = `
        <form id=\"contract-form\" class=\"space-y-4\">
            <div class=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                <div><label class=\"block text-xs font-semibold text-slate-500\">تاریخ شروع</label><input id=\"contract-start\" type=\"text\" class=\"mt-2 w-full p-2 border rounded-lg\" value=\"${c.startDate ? toPersianDate(c.startDate) : ''}\"></div>
                <div><label class=\"block text-xs font-semibold text-slate-500\">تاریخ پایان</label><input id=\"contract-end\" type=\"text\" class=\"mt-2 w-full p-2 border rounded-lg\" value=\"${c.endDate ? toPersianDate(c.endDate) : ''}\"></div>
                <div><label class=\"block text-xs font-semibold text-slate-500\">سمت شغلی</label><input id=\"contract-title\" type=\"text\" class=\"mt-2 w-full p-2 border rounded-lg\" value=\"${c.jobTitle || ''}\" placeholder=\"مثال: کارشناس ارشد\"></div>
                <div><label class=\"block text-xs font-semibold text-slate-500\">حقوق (تومان)</label><input id=\"contract-salary\" type=\"number\" class=\"mt-2 w-full p-2 border rounded-lg\" value=\"${c.salary || ''}\" min=\"0\"></div>
                <div class=\"md:col-span-2\"><label class=\"inline-flex items-center gap-2\"><input id=\"contract-sup\" type=\"checkbox\" ${c.supplementaryInsurance ? 'checked' : ''}><span class=\"text-sm\">بیمه تکمیلی</span></label></div>
                <div class=\"md:col-span-2\"><label class=\"block text-xs font-semibold text-slate-500\">فایل قرارداد</label><input id=\"contract-file\" type=\"file\" class=\"mt-2 w-full p-2 border rounded-lg\"></div>
            </div>
            <div class=\"flex justify-end gap-2\">
                <button type=\"button\" id=\"cancel-contract\" class=\"secondary-btn\">انصراف</button>
                <button type=\"submit\" class=\"primary-btn\">ذخیره</button>
            </div>
        </form>`;
    openModal(mainModal, mainModalContainer);
    activatePersianDatePicker('contract-start');
    activatePersianDatePicker('contract-end');
    document.getElementById('cancel-contract').addEventListener('click', () => viewEmployeeProfile(emp.firestoreId));
    document.getElementById('contract-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const start = persianToEnglishDate(document.getElementById('contract-start').value.trim());
            const end = persianToEnglishDate(document.getElementById('contract-end').value.trim());
            const jobTitle = document.getElementById('contract-title').value.trim();
            const salary = parseInt(document.getElementById('contract-salary').value) || 0;
            const sup = document.getElementById('contract-sup').checked;
            let fileUrl = c.fileUrl || '';
            const file = document.getElementById('contract-file').files[0];
            if (file) {
                const sRef = ref(storage, `contracts/${emp.firestoreId}_${Date.now()}_${file.name}`);
                const snap = await uploadBytes(sRef, file);
                fileUrl = await getDownloadURL(snap.ref);
            }
            const newItem = { startDate: start, endDate: end, jobTitle, salary, supplementaryInsurance: sup, fileUrl };
            const contracts = Array.isArray(emp.contracts) ? emp.contracts.slice() : [];
            if (idx!=null) contracts[idx] = newItem; else contracts.push(newItem);
            await updateDoc(doc(db, `artifacts/${appId}/public/data/employees`, emp.firestoreId), { contracts });
            showToast('قرارداد ذخیره شد.');
            viewEmployeeProfile(emp.firestoreId);
        } catch (error) {
            console.error('Error saving contract:', error);
            showToast('خطا در ذخیره قرارداد.', 'error');
        }
    });
}
// Career Path editor modal for admins
function showEditCareerPathForm(emp) {
    modalTitle.innerText = `مدیریت مسیر شغلی: ${emp.name}`;
    const steps = emp.careerPath || [];
    const rows = steps.map((s, i) => `
        <div class=\"career-step grid grid-cols-1 md:grid-cols-12 gap-2 items-center\">
            <input type=\"text\" class=\"md:col-span-4 p-2 border rounded-md step-title\" placeholder=\"عنوان شغلی\" value=\"${s.title || ''}\">
            <input type=\"text\" class=\"md:col-span-4 p-2 border rounded-md step-date\" placeholder=\"تاریخ سمت (YYYY/MM/DD)\" value=\"${s.date ? toPersianDate(s.date) : ''}\">
            <input type=\"text\" class=\"md:col-span-3 p-2 border rounded-md step-team\" placeholder=\"تیم\" value=\"${s.team || ''}\">
            <button type=\"button\" class=\"md:col-span-1 remove-step-btn text-rose-500\"><i data-lucide=\"trash-2\" class=\"w-5 h-5\"></i></button>
        </div>`).join('');
    modalContent.innerHTML = `
        <form id=\"career-form\" class=\"space-y-3\">
            <div id=\"career-steps\" class=\"space-y-3\">${rows}</div>
            <div class=\"flex justify-between\">
                <button type=\"button\" id=\"add-step-btn\" class=\"secondary-btn text-xs\">افزودن گام</button>
                <div class=\"flex items-center gap-2\">
                    <button type=\"button\" id=\"back-to-profile-career\" class=\"secondary-btn text-xs\">بازگشت</button>
                    <button type=\"submit\" class=\"primary-btn text-xs\">ذخیره</button>
                </div>
            </div>
        </form>`;
    openModal(mainModal, mainModalContainer);
    lucide.createIcons();
    const container = document.getElementById('career-steps');
    document.getElementById('add-step-btn').addEventListener('click', () => {
        const wrap = document.createElement('div');
        wrap.className = 'career-step grid grid-cols-1 md:grid-cols-12 gap-2 items-center';
        wrap.innerHTML = `<input type=\"text\" class=\"md:col-span-4 p-2 border rounded-md step-title\" placeholder=\"عنوان شغلی\"><input type=\"text\" class=\"md:col-span-4 p-2 border rounded-md step-date\" placeholder=\"تاریخ سمت (YYYY/MM/DD)\"><input type=\"text\" class=\"md:col-span-3 p-2 border rounded-md step-team\" placeholder=\"تیم\"><button type=\"button\" class=\"md:col-span-1 remove-step-btn text-rose-500\"><i data-lucide=\"trash-2\" class=\"w-5 h-5\"></i></button>`;
        container.appendChild(wrap);
        try { lucide.createIcons(); } catch {}
    });
    container.addEventListener('click', (e) => { if (e.target.closest('.remove-step-btn')) { e.target.closest('.career-step').remove(); } });
    document.getElementById('back-to-profile-career').addEventListener('click', () => viewEmployeeProfile(emp.firestoreId));
    document.getElementById('career-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const stepsNew = [];
        document.querySelectorAll('#career-steps .career-step').forEach(step => {
            const title = step.querySelector('.step-title').value.trim();
            const dateStr = step.querySelector('.step-date').value.trim();
            const team = step.querySelector('.step-team').value.trim();
            if (title) {
                stepsNew.push({ title, date: persianToEnglishDate(dateStr) || null, team });
            }
        });
        try {
            const docRef = doc(db, `artifacts/${appId}/public/data/employees`, emp.firestoreId);
            await updateDoc(docRef, { careerPath: stepsNew });
            showToast('مسیر شغلی بروزرسانی شد.');
            viewEmployeeProfile(emp.firestoreId);
        } catch (error) {
            console.error('Error updating career path:', error);
            showToast('خطا در بروزرسانی مسیر شغلی.', 'error');
        }
    });
}
// Edit team mission line modal
function showEditTeamMissionForm(team) {
    modalTitle.innerText = `ویرایش هدف تیم ${team.name}`;
    modalContent.innerHTML = `
        <form id=\"team-mission-form\" class=\"space-y-4\">
            <div>
                <label class=\"block text-sm\">هدف یک‌خطی تیم</label>
                <input id=\"team-mission-input\" class=\"w-full p-2 border rounded-md\" value=\"${team.missionLine || ''}\" placeholder=\"مثال: ساخت بهترین تجربه کاربری برای مشتریان\"> 
            </div>
            <div class=\"flex justify-end gap-2\">
                <button type=\"button\" id=\"cancel-team-mission\" class=\"secondary-btn\">انصراف</button>
                <button type=\"submit\" class=\"primary-btn\">ذخیره</button>
            </div>
        </form>`;
    openModal(mainModal, mainModalContainer);
    document.getElementById('cancel-team-mission')?.addEventListener('click', () => viewTeamProfile(team.firestoreId));
    document.getElementById('team-mission-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const mission = document.getElementById('team-mission-input').value.trim();
            await updateDoc(doc(db, `artifacts/${appId}/public/data/teams`, team.firestoreId), { missionLine: mission });
            showToast('هدف تیم بروزرسانی شد.');
            viewTeamProfile(team.firestoreId);
        } catch (error) {
            console.error('Error updating team mission:', error);
            showToast('خطا در بروزرسانی هدف تیم.', 'error');
        }
    });
}
// expose for legacy callers
try { window.setupProfileModalListeners = setupProfileModalListeners; } catch {}

const viewEmployeeProfile = (employeeId) => {
    const emp = state.employees.find(e => e.firestoreId === employeeId);
    if (!emp) return;
    const analysis = generateSmartAnalysis(emp);
    const team = state.teams.find(t => t.memberIds?.includes(emp.id));
    const manager = team ? state.employees.find(e => e.id === team.leadership?.manager) : null;
    // پیدا کردن دوره ارزیابی فعال
    const activeCycle = (state.evaluationCycles || []).find(c => c.status === 'active');
    let evaluationButtonHtml = '';
    if (activeCycle && canEdit()) {
        // چک می‌کنیم آیا برای این کارمند در این دوره، ارزیابی‌ای ثبت شده یا نه
        // const existingEval = (state.employeeEvaluations || []).find(e => e.employeeId === emp.id && e.cycleId === activeCycle.firestoreId);
        evaluationButtonHtml = `<button id="start-evaluation-btn" data-cycle-id="${activeCycle.firestoreId}" class="primary-btn text-xs">شروع ارزیابی عملکرد</button>`;
    }
    //
    modalTitle.innerText = 'پروفایل ۳۶۰ درجه: ' + emp.name;
    modalContent.innerHTML = `
        <div class="space-y-6">
            <section class="rounded-2xl overflow-hidden border" style="background:linear-gradient(90deg,#FF6A3D,#F72585)">
                <div class="p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <div class="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white/30 bg-white/10">
                            <img src="${emp.avatar}" alt="${emp.name}" class="w-full h-full object-cover">
                        </div>
                        <div>
                            <h2 class="text-2xl font-extrabold text-white">${emp.name}</h2>
                            <p class="text-white/90 text-sm">${emp.jobTitle || 'بدون عنوان شغلی'} • ${emp.level || ''}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                       ${evaluationButtonHtml} ${canEdit() ? `<button id="main-edit-employee-btn" class="secondary-btn text-xs">ویرایش کارمند</button>` : ''}
                        ${canEdit() ? `<button id="change-avatar-btn" class="secondary-btn text-xs">تغییر عکس</button>` : ''}
                        ${canEdit() ? `<button id="delete-avatar-btn" class="secondary-btn text-xs">حذف عکس</button>` : ''}
                        <span class="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">${emp.status}</span>
                    </div>
                </div>
            </section>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-1 space-y-6">
                    <div class="bg-white rounded-2xl border border-slate-200 p-6">
                        <h4 class="font-bold text-slate-800 mb-4 flex items-center"><i data-lucide="heart-pulse" class="ml-2 w-5 h-5" style="color:#6B69D6"></i>امتیاز مشارکت</h4>
                        ${emp.engagementScore != null ? `
                        <div class="relative w-40 h-20 mx-auto mt-2">
                            <canvas id="engagementGaugeProfile"></canvas>
                            <div class="absolute inset-0 flex items-center justify-center -bottom-4"><span class="text-3xl font-extrabold" style="color:#6B69D6">${emp.engagementScore}%</span></div>
                        </div>` : '<p class="text-sm text-slate-500 text-center">هنوز امتیازی ثبت نشده است.</p>'}
                    </div>
                    <div class="bg-white rounded-2xl border border-slate-200 p-6">
                        <h4 class="font-bold text-slate-800 mb-4 flex items-center"><i data-lucide="brain-circuit" class="ml-2 w-5 h-5" style="color:#6B69D6"></i>تحلیل هوشمند</h4>
                        <div class="text-sm space-y-3">${Object.values(analysis).map(item => `<div class=\"flex items-start\"><i data-lucide=\"${item.icon}\" class=\"w-4 h-4 mt-1 ml-2 flex-shrink-0 ${item.color}\"></i><div class=\"${item.color}\">${item.text}</div></div>`).join('')}</div>
                    </div>
                </div>
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-2xl border border-slate-200">
                        <div class="p-4 border-b border-slate-200">
                            <nav id="profile-tabs" class="flex flex-wrap gap-2">
                                <button data-tab="overview" class="profile-tab active primary-btn text-xs">نمای کلی</button>
                                <button data-tab="performance" class="profile-tab secondary-btn text-xs">عملکرد</button>
                                <button data-tab="career" class="profile-tab secondary-btn text-xs">مسیر شغلی</button>
                                <button data-tab="contracts" class="profile-tab secondary-btn text-xs">قراردادها</button>
                                <button data-tab="personal" class="profile-tab secondary-btn text-xs">اطلاعات پرسنلی</button>
                            </nav>
                        </div>
                        <div class="p-6">
                            <div id="tab-overview" class="profile-tab-content">
                                <div class="space-y-4">
                                    <div class="bg-white rounded-xl border border-slate-200 p-4">
                                        <h4 class="font-semibold mb-3 text-slate-700 flex items-center"><i data-lucide="info" class="ml-2 w-5 h-5 text-slate-500"></i>اطلاعات اصلی</h4>
                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600">
                                            <p><strong>کد پرسنلی:</strong> ${emp.id}</p>
                                            <p><strong>دپارتمان:</strong> ${emp.department || 'نامشخص'}</p>
                                            <p><strong>مدیر:</strong> ${manager ? manager.name : 'نامشخص'}</p>
                                            <p><strong>تاریخ استخدام:</strong> ${toPersianDate(emp.startDate)}</p>
                                            <p><strong>وضعیت:</strong> <span class="px-2 py-1 text-xs font-medium rounded-full ${emp.status === 'فعال' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${emp.status}</span></p>
                                        </div>
                                    </div>
                                    <div class="bg-white rounded-xl border border-slate-200 p-4">
                                        <div class="flex justify-between items-center mb-3">
                                            <h4 class="font-semibold text-slate-700"><i data-lucide="star" class="ml-2 w-5 h-5 text-amber-500"></i>شایستگی‌های کلیدی</h4>
                                            ${canEdit() ? `<button id="edit-competencies-btn" class="primary-btn text-xs">ویرایش</button>` : ''}
                                        </div>
                                        <div class="space-y-4">${renderCompetencyBars(emp.competencies)}</div>
                                    </div>
                                </div>
                            </div>
                            <div id="tab-performance" class="profile-tab-content hidden">
                                <div class="space-y-4">
                                    <div class="flex justify-between items-center mb-3">
                                        <h4 class="font-semibold text-slate-700"><i data-lucide="clipboard-check" class="ml-2 w-5 h-5" style="color:#6B69D6"></i>سابقه ارزیابی عملکرد</h4>
                                        ${canEdit() ? `<button id="add-performance-btn" class="primary-btn text-xs">افزودن</button>` : ''}
                                    </div>
                                    <div class="space-y-4">
                                        ${(emp.performanceHistory && emp.performanceHistory.length > 0) 
                                            ? emp.performanceHistory.sort((a,b) => new Date(b.reviewDate) - new Date(a.reviewDate)).map((review, index) => `
                                                <div class="bg-white rounded-xl border border-slate-200 p-4">
                                                    <div class="flex justify-between items-center mb-2">
                                                        <p class="font-bold text-slate-800">امتیاز کلی: <span style="color:#6B69D6" class="text-lg">${review.overallScore}/5</span></p>
                                                        ${canEdit() ? `<div class="flex gap-2"><button class="edit-performance-btn text-blue-500" data-index="${index}"><i data-lucide="edit" class="w-4 h-4"></i></button><button class="delete-performance-btn text-red-500" data-index="${index}"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>` : ''}
                                                    </div>
                                                    <p class="text-sm text-slate-500">تاریخ: ${toPersianDate(review.reviewDate)} | ارزیاب: ${review.reviewer}</p>
                                                    
                                                    <div class="mt-4 border-t border-dashed pt-4 text-sm text-slate-700">
                                                        <p><strong>نقاط قوت:</strong> ${review.strengths || '-'}</p>
                                                        <p class="mt-2"><strong>زمینه‌های بهبود:</strong> ${review.areasForImprovement || '-'}</p>
                                                    </div>
                                                </div>
                                            `).join('') 
                                            : '<p class="text-sm text-slate-500">هنوز سابقه ارزیابی عملکردی ثبت نشده است.</p>'
                                        }
                                    </div>
                                </div>
                            </div>
                            <div id="tab-career" class="profile-tab-content hidden">
                                <div class="space-y-4">
                                    <div class="flex justify-between items-center mb-3">
                                        <h4 class="font-semibold text-slate-700"><i data-lucide="git-branch" class="ml-2 w-5 h-5" style="color:#6B69D6"></i>مسیر شغلی</h4>
                                        ${canEdit() ? `<button id="edit-career-path-btn" class="primary-btn text-xs">مدیریت مسیر</button>` : ''}
                                    </div>
                                    <div class="bg-white rounded-xl border border-slate-200 p-4">
                                        ${(() => {
                                            const steps = (emp.careerPath && emp.careerPath.length) ? emp.careerPath : [{ title: emp.jobTitle || 'قدم اول', date: emp.startDate, team: emp.department || (manager ? manager.name : '') }];
                                            const items = steps.map((s, i) => `
                                                <div class=\"relative pl-6 py-3\">
                                                    <div class=\"absolute right-[-2px] top-3 w-3 h-3 rounded-full\" style=\"background:#6B69D6\"></div>
                                                    ${i < steps.length - 1 ? '<div class=\\"absolute right-0 top-3 bottom-0 w-px\" style=\\"background:#E2E8F0\\"></div>' : ''}
                                                    <div class=\"grid grid-cols-1 sm:grid-cols-3 gap-2\">
                                                        <div class=\"font-bold text-slate-800\">${s.title || '-'}</div>
                                                        <div class=\"text-sm text-slate-600\">${s.team || '-'}</div>
                                                        <div class=\"text-sm text-slate-500\">${s.date ? toPersianDate(s.date) : '-'}</div>
                                                    </div>
                                                </div>`).join('');
                                            return `<div class=\"relative\">${items}</div>`;
                                        })()}
                                    </div>
                                </div>
                            </div>
                            <div id="tab-contracts" class="profile-tab-content hidden">
                                <div class="space-y-4">
                                    <div class="flex justify-between items-center mb-3">
                                        <h4 class="font-semibold text-slate-700"><i data-lucide="scroll-text" class="ml-2 w-5 h-5" style="color:#6B69D6"></i>قراردادها</h4>
                                        ${canEdit() ? `<button id="add-contract-btn" class="primary-btn text-xs">افزودن/تمدید قرارداد</button>` : ''}
                                    </div>
                                    <div class="bg-white rounded-xl border border-slate-200 p-4">
                                        ${(emp.contracts && emp.contracts.length) ? emp.contracts.sort((a,b)=> new Date(b.startDate||0)-new Date(a.startDate||0)).map((c, idx)=> `
                                            <div class=\"flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b last:border-b-0\">
                                                <div class=\"text-sm\">
                                                    <div class=\"font-bold text-slate-800\">${c.jobTitle || '-'}</div>
                                                    <div class=\"text-slate-600\">از ${c.startDate ? toPersianDate(c.startDate) : '-'} تا ${c.endDate ? toPersianDate(c.endDate) : '-'}</div>
                                                    <div class=\"text-slate-600\">حقوق: ${c.salary ? c.salary.toLocaleString('fa-IR')+' تومان' : '-'}</div>
                                                    <div class=\"text-slate-600\">بیمه تکمیلی: ${c.supplementaryInsurance ? 'دارد' : 'ندارد'}</div>
                                                </div>
                                                <div class=\"flex items-center gap-2\">
                                                    ${c.fileUrl ? `<a href=\"${c.fileUrl}\" target=\"_blank\" class=\"secondary-btn text-xs\">دانلود قرارداد</a>` : ''}
                                                </div>
                                            </div>`).join('') : '<p class=\"text-sm text-slate-500\">قراردادی ثبت نشده است.</p>'}
                                    </div>
                                </div>
                            </div>
                            <div id="tab-personal" class="profile-tab-content hidden">
                                <div class="space-y-4">
                                    <div class="flex justify-between items-center mb-3">
                                        <h4 class="font-semibold text-slate-700"><i data-lucide="user-cog" class="ml-2 w-5 h-5 text-slate-600"></i>اطلاعات پرسنلی</h4>
                                        ${canEdit() ? `<button id="edit-personal-info-btn" class="primary-btn text-xs">ویرایش</button>` : ''}
                                    </div>
                                    <div class="bg-white rounded-xl border border-slate-200 p-4">
                                        <h5 class="font-bold text-slate-800 mb-3">اطلاعات هویتی و شناسایی</h5>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                                            <p><strong>نام و نام خانوادگی:</strong> ${emp.name || '-'}</p>
                                            <p><strong>تاریخ تولد:</strong> ${emp.personalInfo?.birthDate ? toPersianDate(emp.personalInfo.birthDate) : '-'}</p>
                                            <p><strong>محل تولد:</strong> ${emp.personalInfo?.birthPlace || '-'}</p>
                                            <p><strong>جنسیت:</strong> ${emp.gender || emp.personalInfo?.gender || '-'}</p>
                        
                                            <p><strong>کد ملی:</strong> ${emp.personalInfo?.nationalId || '-'}</p>
                                            <p><strong>وضعیت تأهل:</strong> ${emp.personalInfo?.maritalStatus || '-'}</p>
                                            <p><strong>تعداد فرزندان:</strong> ${emp.personalInfo?.numChildren ?? '-'}</p>
                                            <p><strong>وضعیت خدمت سربازی:</strong> ${emp.personalInfo?.militaryStatus || '-'}</p>
                                        </div>
                                        <h5 class="font-bold text-slate-800 mt-6 mb-3">اطلاعات تماس و آدرس</h5>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                                            <p><strong>شماره تلفن همراه:</strong> ${emp.personalInfo?.phone || '-'}</p>
                                            <p><strong>ایمیل:</strong> ${emp.personalInfo?.email || '-'}</p>
                                            <p><strong>شماره تلفن ثابت:</strong> ${emp.personalInfo?.landline || '-'}</p>
                                            <p><strong>شماره تلفن ضروری:</strong> ${emp.personalInfo?.emergencyPhone || '-'}</p>
                                            <p class="md:col-span-2"><strong>آدرس محل سکونت:</strong> ${emp.personalInfo?.address || '-'}</p>
                                            <p><strong>کد پستی:</strong> ${emp.personalInfo?.postalCode || '-'}</p>
                                        </div>
                                        <h5 class="font-bold text-slate-800 mt-6 mb-3">اطلاعات تحصیلی</h5>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                                            <p><strong>مدرک تحصیلی:</strong> ${emp.personalInfo?.education || '-'}</p>
                                            <p><strong>رشته تحصیلی:</strong> ${emp.personalInfo?.fieldOfStudy || '-'}</p>
                                            <p class="md:col-span-2"><strong>محل اخذ مدرک:</strong> ${emp.personalInfo?.educationInstitution || '-'}</p>
                                        </div>
                                        <h5 class="font-bold text-slate-800 mt-6 mb-3">اطلاعات مالی و بانکی</h5>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                                            <p class="md:col-span-2"><strong>شماره شبا:</strong> ${emp.personalInfo?.iban || '-'}</p>
                                            <p><strong>شماره حساب:</strong> ${emp.personalInfo?.accountNumber || '-'}</p>
                                            <p><strong>شماره کارت:</strong> ${emp.personalInfo?.cardNumber || '-'}</p>
                                            <p><strong>نام بانک:</strong> ${emp.personalInfo?.bankName || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    openModal(mainModal, mainModalContainer);
    modalContent = clearEventListeners(document.getElementById('modalContent'));
    setupProfileModalListeners(emp);
};
const viewTeamProfile = (teamId) => {
    const team = state.teams.find(t => t.firestoreId === teamId);
    if (!team) return;
    const leader = state.employees.find(e => e.id === team.leaderId);
    const members = state.employees.filter(e => team.memberIds?.includes(e.id));
    const basicAnalysis = generateTeamSmartAnalysis(team);
    const advancedAnalysis = analyzeTeamData(team, members);

    const highRiskNames = advancedAnalysis.highRiskMembers.map(e => e.name).join('، ');
    if(highRiskNames) {
        basicAnalysis.risk = { text: `اعضای پرریسک: <strong>${highRiskNames}</strong>`, icon: 'shield-alert', color: 'text-red-600' };
    }

    // --- بخش جدید: ساخت HTML برای نمایش OKR های جدید ---
    const okrsHtml = (team.okrs && team.okrs.length > 0) ? team.okrs.map(okr => {
        // محاسبه پیشرفت هدف بر اساس میانگین نتایج کلیدی (اگر از قبل محاسبه نشده)
        const objectiveProgress = okr.progress;

        // ساخت HTML برای هر نتیجه کلیدی
        const keyResultsHtml = (okr.keyResults && okr.keyResults.length > 0) ? okr.keyResults.map(kr => `
            <div>
                <div class="flex justify-between items-center text-xs text-slate-600 mb-1">
                    <span>${kr.title}</span>
                    <span>${kr.progress}%</span>
                </div>
                <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div class="h-1.5 bg-slate-400" style="width:${kr.progress}%;"></div>
                </div>
            </div>
        `).join('') : '<p class="text-xs text-slate-400">نتیجه کلیدی‌ای ثبت نشده است.</p>';
        
        return `
            <div class="bg-slate-50 p-3 rounded-lg border">
                <div class="flex justify-between items-center text-sm mb-2">
                    <span class="font-bold text-slate-800">${okr.title}</span>
                    <span class="font-semibold text-indigo-600">${objectiveProgress}%</span>
                </div>
                <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                    <div class="h-2 bg-indigo-500" style="width:${objectiveProgress}%;"></div>
                </div>
                <div class="space-y-2 border-t pt-2">
                    ${keyResultsHtml}
                </div>
            </div>
        `;
    }).join('') : '<p class="text-sm text-slate-500">هدفی برای این تیم ثبت نشده است.</p>';


    modalTitle.innerText = 'پروفایل تیم: ' + team.name;
    modalContent.innerHTML = `
        <section class="rounded-2xl overflow-hidden border" style="background:linear-gradient(90deg,#FF6A3D,#F72585)">
            <div class="p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-white/30 bg-white/10">
                        <img src="${team.avatar}" alt="${team.name}" class="w-full h-full object-cover">
                    </div>
                    <div>
                        <h2 class="text-2xl font-extrabold text-white">${team.name}</h2>
                        <p class="text-white/90 text-xs">رهبر تیم: ${leader?.name || 'نامشخص'}</p>
                        ${team.missionLine ? `<p class="text-white/90 text-xs mt-1">${team.missionLine}</p>` : ''}
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${canEdit() ? `<button id="edit-team-details-btn" class="secondary-btn text-xs">ویرایش مشخصات</button>` : ''}
                    ${canEdit() ? `<button id="edit-team-mission-btn" class="primary-btn text-xs">ویرایش هدف تیم</button>` : ''}
                </div>
            </div>
        </section>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div class="lg:col-span-1 space-y-6">
                <div class="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                    <div class="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden ring-4 ring-indigo-100 bg-gray-200 flex items-center justify-center">
                        <img src="${team.avatar}" alt="${team.name}" class="w-full h-full object-cover">
                    </div>
                    ${canEdit() ? `<button id="change-team-avatar-btn" class="secondary-btn text-xs">تغییر عکس</button>` : ''}
                </div>
                <div class="card p-6 bg-gray-50 rounded-xl">
                    <h4 class="font-semibold mb-4 text-gray-700 flex items-center"><i data-lucide="brain-circuit" class="ml-2 w-5 h-5 text-purple-500"></i>تحلیل هوشمند</h4>
                    <div class="text-sm space-y-3">${Object.keys(basicAnalysis).length > 0 ? Object.values(basicAnalysis).map(item => `<div class="flex items-start"><i data-lucide="${item.icon}" class="w-4 h-4 mt-1 ml-2 flex-shrink-0 ${item.color}"></i><div class="${item.color}">${item.text}</div></div>`).join('') : '<p class="text-sm text-gray-500">داده کافی برای تحلیل وجود ندارد.</p>'}</div>
                </div>
            </div>
            <div class="lg:col-span-2 space-y-6">
                <div class="bg-white rounded-xl shadow-md">
                    <div class="border-b border-gray-200"><nav id="profile-tabs" class="flex -mb-px overflow-x-auto"><button data-tab="team-overview" class="profile-tab active shrink-0">نمای کلی</button><button data-tab="team-health" class="profile-tab shrink-0">سلامت تیم</button><button data-tab="team-talent" class="profile-tab shrink-0">ماتریس استعداد</button></nav></div>
                    <div class="p-4">
                        <div id="tab-team-overview" class="profile-tab-content active">
                            <div class="space-y-4">
                                <div class="card p-4 bg-white rounded-xl border border-slate-200">
                                    <div class="flex justify-between items-center mb-3">
                                        <h4 class="font-semibold text-gray-700">اعضای تیم (${members.length} نفر)</h4>
                                        <button id="edit-team-members-btn" class="text-sm bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700">ویرایش</button>
                                    </div>
                                    <div class="flex flex-wrap gap-4">${members.map(m => `<div class="text-center" title="${m.name}"><div class="w-12 h-12 rounded-full mx-auto overflow-hidden bg-gray-200"><img src="${m.avatar}" class="w-full h-full object-cover"></div><p class="text-xs mt-1 truncate w-16">${m.name}</p></div>`).join('')}</div>
                                </div>
                                <div class="card p-4 bg-white rounded-xl border border-slate-200">
                                    <div class="flex justify-between items-center mb-3">
                                        <h4 class="font-semibold text-gray-700">اهداف تیم (OKRs)</h4>
                                        ${canEdit() ? `<button id="edit-team-okrs-btn" class="text-sm bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700">افزودن/ویرایش</button>`:''}
                                    </div>
                                    <div class="space-y-4">${okrsHtml}</div>
                                </div>
                            </div>
                        </div>
                        <div id="tab-team-health" class="profile-tab-content">${renderTeamHealthMetrics(team)}</div>
                        <div id="tab-team-talent" class="profile-tab-content"><div class="card p-6 bg-white rounded-xl border border-slate-200"><h4 class="font-semibold mb-3 text-gray-700">توزیع استعداد در تیم</h4><div class="grid grid-cols-3 gap-1 text-center text-xs border-t-2 border-l-2 border-gray-300 mt-4 bg-white">${ (typeof generateTeamNineBoxGrid==='function' ? generateTeamNineBoxGrid(members) : '') }</div></div></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    openModal(mainModal, mainModalContainer);
    // Minimal listener to handle avatar change in team profile and future actions
if (typeof window.setupTeamProfileModalListeners !== 'function') {
    window.setupTeamProfileModalListeners = (teamArg) => {
        const content = document.getElementById('modalContent');
        content?.addEventListener('click', async (e) => {
            const button = e.target.closest('button');
            if (!button) return; // اگر روی دکمه کلیک نشده بود، ادامه نده

            const teamId = teamArg.firestoreId;

            // --- رسیدگی به کلیک‌های مختلف ---
            if (button.id === 'change-team-avatar-btn') {
                // ... (کد این بخش بدون تغییر باقی می‌ماند)
                const input = document.getElementById('image-upload-input');
                if (!input) return;
                input.onchange = async () => {
                    const file = input.files[0];
                    if (!file) return;
                    try {
                        const sRef = ref(storage, `teams/${teamId}/avatar_${Date.now()}_${file.name}`);
                        await uploadBytes(sRef, file);
                        const url = await getDownloadURL(sRef);
                        await updateDoc(doc(db, `artifacts/${appId}/public/data/teams`, teamId), { avatar: url });
                        showToast('عکس تیم به‌روزرسانی شد.');
                        viewTeamProfile(teamId);
                    } catch (err) {
                        console.error('Error uploading team avatar', err);
                        showToast('خطا در به‌روزرسانی عکس تیم.', 'error');
                    } finally { input.value = ''; }
                };
                input.click();
                return;
            }
            if (button.id === 'edit-team-members-btn') {
                showEditTeamMembersForm(teamArg);
                return;
            }
            if (button.id === 'edit-team-okrs-btn') {
                showEditTeamOkrsForm(teamArg);
                return;
            }
            
            // ▼▼▼ این دو بلاک جدید، مشکلات شما را حل می‌کنند ▼▼▼
            if (button.id === 'edit-team-mission-btn') {
                showEditTeamMissionForm(teamArg); // فعال‌سازی دکمه ویرایش هدف
                return;
            }
            if (button.id === 'edit-team-details-btn') {
                showTeamForm(teamId); // باز کردن فرم اصلی ویرایش تیم برای تغییر نام و مدیر
                return;
            }
        });
    };
}
    setupTeamProfileModalListeners(team);
};

        // --- NAVIGATION & ROUTING ---
        const navigateTo = (pageName) => {
            state.currentPage = pageName;
            window.location.hash = pageName;
            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.toggle('active', item.getAttribute('href') === `#${pageName}`);
            });
            renderPage(pageName);
        };
// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

const renderPage = (pageName) => {
    try {
        if (!state.currentUser) {
            showLoginPage();
            return;
        }
        
        // اطمینان حاصل کنید که صفحه در آبجکت pages وجود دارد
        if (typeof pages[pageName] !== 'function') {
            console.error(`Page "${pageName}" not found or is not a function.`);
            mainContent.innerHTML = `<div class="text-center p-10"><h1>صفحه یافت نشد</h1><p>صفحه‌ای با آدرس #${pageName} وجود ندارد.</p></div>`;
            return;
        }

       

        mainContent.innerHTML = pages[pageName]();
        
        // فراخوانی تابع فعال‌سازی مخصوص هر صفحه
        if (pageName === 'dashboard') { renderDashboardCharts(); setupDashboardListeners(); setupDashboardQuickActions(); }
        if (pageName === 'talent') { renderEmployeeTable(); setupTalentPageListeners(); }
        if (pageName === 'organization') { setupOrganizationPageListeners(); }
        if (pageName === 'surveys') { setupSurveysPageListeners(); }
        if (pageName === 'requests') { setupRequestsPageListeners(); }
        if (pageName === 'tasks') { setupTasksPageListeners(); }
        if (pageName === 'analytics') { setupAnalyticsPage(); }
        if (pageName === 'documents') { setupDocumentsPageListeners(); }
        if (pageName === 'announcements') { setupAnnouncementsPageListeners(); } // [!code ++] این خط مشکل را حل می‌کند
        if (pageName === 'settings') {
            if(isAdmin()) {
                setupSettingsPageListeners();
            }
        }
 if (pageName === 'evaluation') { // [!] این if را اضافه کنید
    if (isAdmin()) {
        setupEvaluationPageListeners();
    }
}
        lucide.createIcons();
    } catch (error) {
        console.error("Failed to render page:", pageName, error);
        mainContent.innerHTML = `<div class="text-red-600 text-center p-8"><h1>خطا در نمایش صفحه</h1><p>${error.message}</p></div>`;
    }
};
        // --- CHART RENDERING FUNCTIONS ---
        const destroyCharts = () => { Object.values(charts).forEach(chart => chart?.destroy()); charts = {}; };
// فایل: js/main.js - این تابع جدید را اضافه کنید

// [!code start]
const renderPerformanceDistributionChart = () => {
    const ctx = document.getElementById('performanceDistributionChart')?.getContext('2d');
    if (!ctx) return;

    // دسته‌بندی کارمندان بر اساس آخرین امتیاز عملکرد
    const distribution = {
        'نیازمند بهبود (زیر ۲.۸)': 0,
        'عملکرد خوب (۲.۸ تا ۴)': 0,
        'عملکرد عالی (بالای ۴)': 0,
    };

    state.employees.forEach(emp => {
        if (emp.performanceHistory && emp.performanceHistory.length > 0) {
            const lastScore = emp.performanceHistory[emp.performanceHistory.length - 1].overallScore;
            if (lastScore < 2.8) {
                distribution['نیازمند بهبود (زیر ۲.۸)']++;
            } else if (lastScore <= 4.0) {
                distribution['عملکرد خوب (۲.۸ تا ۴)']++;
            } else {
                distribution['عملکرد عالی (بالای ۴)']++;
            }
        }
    });

    charts.performanceDistribution = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(distribution),
            datasets: [{
                label: 'تعداد کارمندان',
                data: Object.values(distribution),
                backgroundColor: ['#ef4444', '#3b82f6', '#22c55e'],
                borderRadius: 4,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1 // نمایش اعداد صحیح روی محور Y
                    }
                }
            }
        }
    });
};
// [!code end]
const renderDashboardCharts = () => {
    destroyCharts();
    const metrics = state.dashboardMetrics;
    if (Object.keys(metrics).length === 0) return;
    renderEngagementGauge('engagementGaugeDashboard', metrics.engagementScore);

    // Gender Composition (Doughnut Chart)
    const genderCtx = document.getElementById('genderCompositionChart')?.getContext('2d');
    if (genderCtx && metrics.genderComposition) { 
        charts.gender = new Chart(genderCtx, { 
            type: 'doughnut', 
            data: { 
                labels: Object.keys(metrics.genderComposition), 
                datasets: [{ 
                    data: Object.values(metrics.genderComposition), 
                    backgroundColor: ['#6B69D6', '#F72585', '#A1A1AA'],
                    hoverOffset: 4
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            } 
        }); 
    }

    // Department Distribution (Bar Chart)
    const departmentCtx = document.getElementById('departmentDistributionChart')?.getContext('2d');
    if (departmentCtx) { 
        charts.department = new Chart(departmentCtx, { 
            type: 'bar', 
            data: { 
                labels: Object.keys(metrics.departmentDistribution), 
                datasets: [{ 
                    label: 'تعداد', 
                    data: Object.values(metrics.departmentDistribution), 
                    backgroundColor: '#6B69D6',
                    borderRadius: 5
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: false } 
                },
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            } 
        }); 
    }
    // Nine Box Distribution (Bar Chart)
    const nineBoxCtx = document.getElementById('nineBoxChart')?.getContext('2d');
    if (nineBoxCtx && metrics.nineBoxDistribution) { 
        charts.nineBox = new Chart(nineBoxCtx, { 
            type: 'bar', 
            data: { 
                labels: Object.keys(metrics.nineBoxDistribution), 
                datasets: [{ 
                    label: 'تعداد', 
                    data: Object.values(metrics.nineBoxDistribution), 
                    backgroundColor: '#F72585',
                    borderRadius: 5
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: false } 
                },
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            } 
        }); 
    }

    // New: Tenure Distribution (Pie Chart)
    const tenureCtx = document.getElementById('tenureDistributionChart')?.getContext('2d');
    const tenureData = state.employees.reduce((acc, emp) => {
        if (!emp.startDate) return acc;
        const years = (new Date() - new Date(emp.startDate)) / (1000 * 60 * 60 * 24 * 365);
        if (years < 2) acc['کمتر از ۲ سال'] = (acc['کمتر از ۲ سال'] || 0) + 1;
        else if (years < 5) acc['۲ تا ۵ سال'] = (acc['۲ تا ۵ سال'] || 0) + 1;
        else acc['بیش از ۵ سال'] = (acc['بیش از ۵ سال'] || 0) + 1;
        return acc;
    }, {});
    if (tenureCtx) {
        charts.tenure = new Chart(tenureCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(tenureData),
                datasets: [{
                    data: Object.values(tenureData),
                    backgroundColor: ['#6B69D6', '#A78BFA', '#F72585'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // New: Age Distribution (Bar Chart)
    const ageCtx = document.getElementById('ageDistributionChart')?.getContext('2d');
    const ageData = state.employees.reduce((acc, emp) => {
        if (!emp.personalInfo?.birthDate) return acc;
        const age = new Date().getFullYear() - new Date(emp.personalInfo.birthDate).getFullYear();
        if (age < 30) acc['زیر ۳۰ سال'] = (acc['زیر ۳۰ سال'] || 0) + 1;
        else if (age <= 45) acc['۳۱-۴۵ سال'] = (acc['۳۱-۴۵ سال'] || 0) + 1;
        else acc['بالای ۴۵ سال'] = (acc['بالای ۴۵ سال'] || 0) + 1;
        return acc;
    }, {});
    if (ageCtx) {
        charts.age = new Chart(ageCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(ageData),
                datasets: [{
                    label: 'تعداد',
                    data: Object.values(ageData),
                    backgroundColor: '#6B69D6',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // New: Team Competency Radar Chart
    const teamCompetencyCtx = document.getElementById('teamCompetencyRadarChart')?.getContext('2d');
    const competencyScores = {};
    state.teams.forEach(team => {
        team.memberIds?.forEach(memberId => {
            const member = state.employees.find(e => e.id === memberId);
            if (member && member.competencies) {
                Object.entries(member.competencies).forEach(([name, score]) => {
                    if (!competencyScores[name]) {
                        competencyScores[name] = { total: 0, count: 0 };
                    }
                    competencyScores[name].total += score;
                    competencyScores[name].count++;
                });
            }
        });
    });
    const avgCompetencies = Object.entries(competencyScores).reduce((acc, [name, data]) => {
        acc[name] = data.count > 0 ? (data.total / data.count).toFixed(1) : 0;
        return acc;
    }, {});
    if (teamCompetencyCtx && Object.keys(avgCompetencies).length > 0) {
        charts.teamCompetency = new Chart(teamCompetencyCtx, {
            type: 'radar',
            data: {
                labels: Object.keys(avgCompetencies),
                datasets: [{
                    label: 'میانگین امتیاز',
                    data: Object.values(avgCompetencies),
                    fill: true,
                    backgroundColor: 'rgba(107, 105, 214, 0.2)',
                    borderColor: '#6B69D6',
                    pointBackgroundColor: '#6B69D6',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#6B69D6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: '#e2e8f0' },
                        grid: { color: '#e2e8f0' },
                        pointLabels: { color: '#6b7280' },
                        suggestedMin: 0,
                        suggestedMax: 5,
                        ticks: { stepSize: 1, display: false }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
};
const renderEngagementGauge = (canvasId, score) => {
    const gaugeCtx = document.getElementById(canvasId)?.getContext('2d');
    if(gaugeCtx) { 
        if(charts[canvasId]) charts[canvasId].destroy();
        charts[canvasId] = new Chart(gaugeCtx, { 
            type: 'doughnut', 
            data: { 
                datasets: [{ 
                    data: [score, 100 - score], 
                    backgroundColor: ['#6B69D6', '#e5e7eb'], 
                    borderWidth: 0, 
                    circumference: 180, 
                    rotation: 270, 
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: false }, 
                    tooltip: { enabled: false } 
                }, 
                cutout: '80%'
            } 
        }); 
    }
};
       
        const renderSkillRadarChart = (canvasId, skills) => {
            const skillCtx = document.getElementById(canvasId)?.getContext('2d');
            if (!skillCtx) { return; }
            if (charts[canvasId]) { charts[canvasId].destroy(); }
            charts[canvasId] = new Chart(skillCtx, {
                type: 'radar',
                data: {
                    labels: Object.keys(skills),
                    datasets: [{
                        label: 'سطح مهارت',
                        data: Object.values(skills),
                        fill: true,
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: 'rgb(59, 130, 246)'
                    }]
                },
                options: {
                    scales: {
                        r: {
                            suggestedMin: 0,
                            suggestedMax: 5,
                            ticks: { stepSize: 1 }
                        }
                    }
                }
            });
        };

        // --- PAGE-SPECIFIC LOGIC ---
// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید
// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

// فایل: js/main.js
// این تابع را به طور کامل جایگزین نسخه فعلی کنید ▼

const renderAllReminders = () => {
    const allUpcomingReminders = getAllUpcomingReminders();

    if (allUpcomingReminders.length === 0) {
        return '<p class="text-sm text-slate-500 text-center">هیچ یادآوری فعالی وجود ندارد.</p>';
    }

    // محدود کردن لیست به ۵ آیتم برای نمایش در داشبورد
    const remindersToShow = allUpcomingReminders.slice(0, 5);
    
    // استفاده از تابع کمکی جدید برای ساخت HTML
    return renderReminderItems(remindersToShow);
};
        const setupDashboardListeners = () => {
    // فعال کردن تقویم شمسی برای فیلد یادآور در داشبورد
    activatePersianDatePicker('reminderDate');

document.getElementById('addReminderBtn')?.addEventListener('click', async () => {
    const textInput = document.getElementById('reminderText');
    const dateInput = document.getElementById('reminderDate');
    const daysBeforeInput = document.getElementById('reminderDaysBefore');

    if (textInput.value && dateInput.value) {
        try {
            const gregorianDate = persianToEnglishDate(dateInput.value);
            if (!gregorianDate) {
                showToast("فرمت تاریخ شمسی صحیح نیست.", "error");
                return;
            }

            // مقدار روز را از فیلد جدید می‌خوانیم
            const daysBefore = parseInt(daysBeforeInput.value) || 7; // مقدار پیش‌فرض ۷ روز است

            await addDoc(collection(db, `artifacts/${appId}/public/data/reminders`), {
                text: textInput.value,
                date: gregorianDate,
                daysBefore: daysBefore,
                icon: 'calendar-plus', // <<-- این خط جدید مشکل را حل می‌کند
                status: 'جدید',
                assignedTo: (state.users.find(u=>u.role==='admin')||{}).firestoreId, // واگذاری به ادمین پیش‌فرض
                createdAt: serverTimestamp() // برای هماهنگی بیشتر
            });

            textInput.value = '';
            dateInput.value = '';
            daysBeforeInput.value = '7'; // ریست کردن به مقدار پیش‌فرض
            showToast("یادآور با موفقیت اضافه شد.");
        } catch (error) {
            console.error("Error adding reminder:", error);
            showToast("خطا در افزودن یادآور.", "error");
        }
    }
});
                document.getElementById('view-all-reminders-btn')?.addEventListener('click', () => {
        showAllRemindersModal();
    });
};
const setupDashboardQuickActions = () => {
    document.getElementById('dash-quick-requests')?.addEventListener('click', () => navigateTo('requests'));
    document.getElementById('dash-quick-add-emp')?.addEventListener('click', () => navigateTo('talent'));
    document.getElementById('dash-quick-survey')?.addEventListener('click', () => navigateTo('surveys'));
};
// این تابع جدید را به main.js اضافه کنید (کنار بقیه setup...Listeners)
// در فایل js/main.js
// کل این تابع را با نسخه جدید جایگزین کنید
// در فایل js/main.js
// کل این تابع را با نسخه جدید جایگزین کنید
const setupAnnouncementsPageListeners = () => {
    document.getElementById('add-announcement-btn')?.addEventListener('click', showAnnouncementForm);

    // info panel target type toggles
    const typeSel = document.getElementById('info-target-type');
    const tTeams = document.getElementById('info-target-teams');
    const tUsers = document.getElementById('info-target-users');
    const tRoles = document.getElementById('info-target-roles');
    const togglePanels = () => {
        if (!typeSel) return;
        const v = typeSel.value;
        if (tTeams) tTeams.classList.toggle('hidden', v!=='teams');
        if (tUsers) tUsers.classList.toggle('hidden', v!=='users');
        if (tRoles) tRoles.classList.toggle('hidden', v!=='roles');
    };
    typeSel?.addEventListener('change', togglePanels);
    togglePanels();

    // send info-only announcement
    document.getElementById('info-send-btn')?.addEventListener('click', async () => {
        const title = (document.getElementById('info-title')||{}).value?.trim();
        const content = (document.getElementById('info-content')||{}).value?.trim();
        if (!content) { showToast('متن اطلاعیه را وارد کنید.', 'error'); return; }
        const targets = { type: (typeSel?.value || 'public') };
        if (targets.type==='teams') {
            targets.teamIds = Array.from(document.querySelectorAll('.ann-team-chk:checked')).map(cb=>cb.value);
            targets.teamNames = Array.from(document.querySelectorAll('.ann-team-chk:checked')).map(cb=>cb.dataset.name);
        } else if (targets.type==='users') {
            targets.userIds = Array.from(document.querySelectorAll('.ann-user-chk:checked')).map(cb=>cb.value);
            targets.userNames = Array.from(document.querySelectorAll('.ann-user-chk:checked')).map(cb=>cb.dataset.name);
        } else if (targets.type==='roles') {
            targets.roles = Array.from(document.querySelectorAll('.ann-role-chk:checked')).map(cb=>cb.value);
        }
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/announcements`), {
                type: 'info', title, content, targets,
                senderUid: state.currentUser.uid,
                senderName: state.currentUser.name || state.currentUser.email,
                createdAt: serverTimestamp()
            });
            showToast('اطلاعیه ارسال شد.');
            navigateTo('announcements');
        } catch (e) { showToast('خطا در ارسال اطلاعیه.', 'error'); }
    });

    // Clean list rendering + filters
    const container = document.getElementById('ann-cards-container');
    const searchInput = document.getElementById('ann-search');
    const filterChips = Array.from(document.querySelectorAll('.ann-filter-chip'));

    const renderList = () => {
        if (!container) return;
        const term = (searchInput?.value || '').toLowerCase().trim();
        const activeChip = filterChips.find(c => c.classList.contains('bg-slate-800'));
        const typeFilter = activeChip ? activeChip.dataset.type : 'all';

        let items = (state.announcements || []).slice().sort((a,b)=> new Date(b.createdAt?.toDate?.()||0) - new Date(a.createdAt?.toDate?.()||0));
        if (typeFilter !== 'all') {
            items = items.filter(a => (a.type || 'message') === typeFilter);
        }
        if (term) {
            items = items.filter(a => (a.title||'').toLowerCase().includes(term) || (a.content||'').toLowerCase().includes(term));
        }

        const html = items.map(msg => {
            const avatar = (state.users.find(u => u.firestoreId===msg.senderUid)?.avatar) || 'icons/icon-128x128.png';
            const targets = msg.targets || {type:'public'};
            let targetText = 'عمومی';
            if (targets.type==='teams') targetText = `تیم‌ها: ${(targets.teamNames||[]).join('، ')}`;
            else if (targets.type==='users') targetText = `افراد: ${(targets.userNames||[]).join('، ')}`;
            else if (targets.type==='roles') targetText = `نقش‌ها: ${(targets.roles||[]).join('، ')}`;
            const badge = msg.type==='info' ? '<span class="px-2 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-700">اطلاعیه</span>' : '';
            return `
            <div class="bg-white rounded-2xl border border-slate-200 p-4 flex gap-3">
                <img src="${avatar}" class="w-10 h-10 rounded-full object-cover" alt="${msg.senderName}">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <div class="font-bold text-slate-800 text-sm truncate">${msg.senderName}</div>
                        ${badge}
                        <div class="text-[10px] text-slate-500 ml-auto">${toPersianDate(msg.createdAt)}</div>
                    </div>
                    ${msg.title ? `<div class=\"text-sm font-semibold mt-1 truncate\">${msg.title}</div>` : ''}
                    <div class="text-sm text-slate-700 mt-1 whitespace-pre-wrap">${(msg.content||'')}</div>
                    <div class="text-[11px] text-slate-500 mt-2">${targetText}</div>
                </div>
                <button class="delete-announcement-btn text-red-500 hover:text-red-700" data-id="${msg.firestoreId}" title="حذف"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </div>`;
        }).join('');
        container.innerHTML = html || '<p class="text-center text-slate-500 py-8 text-sm">اعلانی موجود نیست.</p>';
        if (window.lucide?.createIcons) lucide.createIcons();
    };

    searchInput?.addEventListener('input', renderList);
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('bg-slate-800','text-white'));
            filterChips.forEach(c => c.classList.add('bg-slate-100','text-slate-700'));
            chip.classList.remove('bg-slate-100','text-slate-700');
            chip.classList.add('bg-slate-800','text-white');
            renderList();
        });
    });

    container?.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-announcement-btn');
        if (deleteBtn) {
            const docId = deleteBtn.dataset.id;
            showConfirmationModal('حذف پیام', 'آیا از حذف این پیام مطمئن هستید؟ این عمل غیرقابل بازگشت است.', async () => {
                try {
                    await deleteDoc(doc(db, `artifacts/${appId}/public/data/announcements`, docId));
                    showToast('پیام با موفقیت حذف شد.');
                    renderList();
                } catch (error) { showToast('خطا در حذف پیام.', 'error'); }
            });
        }
    });

    renderList();
};
const renderEmployeeTable = () => {
    const TALENT_PAGE_SIZE = 12;
    const searchInput = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const departmentFilter = document.getElementById('departmentFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    const filteredEmployees = state.employees.filter(emp =>
        (emp.name.toLowerCase().includes(searchInput) || emp.id.toLowerCase().includes(searchInput)) &&
        (!departmentFilter || emp.department === departmentFilter) &&
        (!statusFilter || emp.status === statusFilter)
    );
    const startIndex = (state.currentPageTalent - 1) * TALENT_PAGE_SIZE;
    const endIndex = startIndex + TALENT_PAGE_SIZE;
    const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);
    
    const container = document.getElementById('employee-cards-container');
    if (container) {
        if (paginatedEmployees.length === 0) {
            container.innerHTML = `<div class="col-span-full text-center py-10"><i data-lucide="user-x" class="mx-auto w-12 h-12 text-slate-400"></i><p class="mt-2 text-slate-500">هیچ کارمندی با این مشخصات یافت نشد.</p></div>`;
            lucide.createIcons();
        } else {
            container.innerHTML = paginatedEmployees.map(emp => {
                const isComplete = isProfileComplete(emp);
                const riskScore = emp.attritionRisk?.score || 0;
                let riskColorClass = 'bg-green-500';
                if (riskScore > 70) riskColorClass = 'bg-red-500';
                else if (riskScore > 40) riskColorClass = 'bg-yellow-500';

                return `
                    <div class="card bg-white p-4 flex flex-col text-center items-center rounded-xl shadow-lg transform hover:-translate-y-1 transition-transform duration-300">
                        <div class="absolute top-3 right-3 w-3 h-3 rounded-full ${riskColorClass}" title="ریسک خروج: ${riskScore}%"></div>

                        <img src="${emp.avatar}" alt="${emp.name}" class="w-24 h-24 rounded-full object-cover border-4 border-slate-100 mt-4">
                        
                        <h3 class="font-bold text-lg mt-3 text-slate-800">${emp.name}</h3>
                        <p class="text-sm text-slate-500">${emp.jobTitle || 'بدون عنوان شغلی'}</p>
                        
                        <div class="mt-4 flex items-center gap-2 text-xs">
                            <span class="px-2 py-1 font-medium rounded-full ${emp.status === 'فعال' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${emp.status}</span>
                            <span class="px-2 py-1 font-medium rounded-full ${isComplete ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}">
                                ${isComplete ? 'پروفایل کامل' : 'پروفایل ناقص'}
                            </span>
                        </div>

                        <div class="mt-auto pt-4 w-full flex items-center justify-end gap-2 border-t border-slate-100">
                            <button class="view-employee-profile-btn flex-grow text-sm bg-slate-800 text-white py-2 px-4 rounded-lg hover:bg-slate-900 transition" data-employee-id="${emp.firestoreId}">
                                مشاهده
                            </button>
                            ${canEdit() ? `<button class="edit-employee-btn p-2 text-slate-400 hover:text-blue-500 transition-colors" data-employee-id="${emp.firestoreId}" title="ویرایش"><i data-lucide="edit" class="w-5 h-5"></i></button>` : ''}
                            ${isAdmin() ? `<button class="delete-employee-btn p-2 text-slate-400 hover:text-rose-500 transition-colors" data-employee-id="${emp.firestoreId}" title="حذف"><i data-lucide="trash-2" class="w-5 h-5"></i></button>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
    renderPagination('pagination-container', state.currentPageTalent, filteredEmployees.length, TALENT_PAGE_SIZE);
};
        const exportToCSV = () => {
    // ۱. همان منطق فیلتر کردن را اجرا می‌کنیم تا لیست فعلی را بگیریم
    const searchInput = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const departmentFilter = document.getElementById('departmentFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    const filteredEmployees = state.employees.filter(emp =>
        (emp.name.toLowerCase().includes(searchInput) || emp.id.toLowerCase().includes(searchInput)) &&
        (!departmentFilter || emp.department === departmentFilter) &&
        (!statusFilter || emp.status === statusFilter)
    );

    if (filteredEmployees.length === 0) {
        showToast("هیچ کارمندی برای خروجی گرفتن یافت نشد.", "error");
        return;
    }

    // ۲. سرتیترهای فایل CSV را تعریف می‌کنیم
    const headers = [
        "نام", "کد پرسنلی", "عنوان شغلی", "ایمیل", "شماره موبایل",
        "شماره ثابت", "کد ملی", "تاریخ تولد", "وضعیت تاهل", "مدرک تحصیلی",
        "آدرس", "کد پستی"
    ];
    
    // ۳. هر کارمند را به یک ردیف از داده‌ها تبدیل می‌کنیم
    const rows = filteredEmployees.map(emp => {
        const info = emp.personalInfo || {};
        // برای جلوگیری از به هم ریختن CSV با کاراکترهای خاص، هر مقدار را داخل "" قرار می‌دهیم
        const cleanValue = (val) => `"${(val || '').toString().replace(/"/g, '""')}"`;

        return [
            cleanValue(emp.name),
            cleanValue(emp.id),
            cleanValue(emp.jobTitle),
            cleanValue(info.email),
            cleanValue(info.phone),
            cleanValue(info.landline),
            cleanValue(info.nationalId),
            info.birthDate ? cleanValue(toPersianDate(info.birthDate)) : '""',
            cleanValue(info.maritalStatus),
            cleanValue(info.education),
            cleanValue(info.address), 
            cleanValue(info.postalCode)
        ].join(','); // ستون‌ها را با ویرگول جدا می‌کنیم
    });

    // ۴. محتوای کامل فایل CSV را می‌سازیم
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" // \uFEFF برای پشتیبانی از زبان فارسی در اکسل
        + headers.join(',') + '\n'
        + rows.join('\n');

    // ۵. فایل را برای دانلود آماده می‌کنیم
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employees_export.csv");
    document.body.appendChild(link);

    link.click(); // دانلود فایل
    document.body.removeChild(link);
};
        const exportTransactionsToCSV = () => {
    const startDateStr = persianToEnglishDate(document.getElementById('start-date-filter').value);
    const endDateStr = persianToEnglishDate(document.getElementById('end-date-filter').value);

    const startDate = startDateStr ? new Date(startDateStr) : null;
    if(startDate) startDate.setHours(0, 0, 0, 0);

    const endDate = endDateStr ? new Date(endDateStr) : null;
    if(endDate) endDate.setHours(23, 59, 59, 999);

    const expensesWithDetails = state.expenses.map(exp => ({ ...exp, type: 'هزینه' }));
    const chargesWithDetails = state.chargeHistory.map(chg => ({ ...chg, type: 'شارژ', date: chg.chargedAt?.toDate(), item: `شارژ کارت ${chg.cardName}` }));
    const allTransactions = [...expensesWithDetails, ...chargesWithDetails]
        .filter(t => t.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const filteredTransactions = allTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        if (startDate && endDate) {
            return transactionDate >= startDate && transactionDate <= endDate;
        }
        if (startDate) {
            return transactionDate >= startDate;
        }
        if (endDate) {
            return transactionDate <= endDate;
        }
        return true;
    });

    if (filteredTransactions.length === 0) {
        showToast("هیچ تراکنشی در بازه زمانی انتخابی یافت نشد.", "error");
        return;
    }

    const headers = ["تاریخ", "نوع", "شرح", "کارت", "مبلغ"];
    const rows = filteredTransactions.map(t => {
        const cardName = t.type === 'هزینه' ? (state.pettyCashCards.find(c => c.firestoreId === t.cardId)?.name || '') : t.cardName;
        const amount = t.type === 'هزینه' ? -t.amount : t.amount;
        const cleanValue = val => `"${(val || '').toString().replace(/"/g, '""')}"`;
        return [
            cleanValue(toPersianDate(t.date)),
            cleanValue(t.type),
            cleanValue(t.item),
            cleanValue(cardName),
            amount
        ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
const setupTalentPageListeners = () => {
    // ریست کردن صفحه به ۱ هنگام جستجو یا فیلتر
    const resetToFirstPage = () => {
        state.currentPageTalent = 1;
        renderEmployeeTable();
    };

    document.getElementById('searchInput')?.addEventListener('input', resetToFirstPage);
    document.getElementById('departmentFilter')?.addEventListener('change', resetToFirstPage);
    document.getElementById('statusFilter')?.addEventListener('change', resetToFirstPage);
    
    // اتصال دکمه افزودن کارمند به تابع مربوطه
    document.getElementById('add-employee-btn')?.addEventListener('click', () => showEmployeeForm());
    
    // اتصال دکمه خروجی CSV به تابع مربوطه
    document.getElementById('export-csv-btn')?.addEventListener('click', exportToCSV);

    // مدیریت کلیک روی کارت‌ها (مشاهده، ویرایش، حذف)
    const mainContentArea = document.getElementById('main-content');
    
    mainContentArea.addEventListener('click', (e) => {
        const viewEmpBtn = e.target.closest('.view-employee-profile-btn');
        const editEmpBtn = e.target.closest('.edit-employee-btn');
        const deleteEmpBtn = e.target.closest('.delete-employee-btn');
        const paginationBtn = e.target.closest('.pagination-btn');
        

        if (paginationBtn && !paginationBtn.disabled) {
            state.currentPageTalent = Number(paginationBtn.dataset.page);
            renderEmployeeTable();
        }

        if (viewEmpBtn) {
        viewEmployeeProfile(viewEmpBtn.dataset.employeeId);
        } else if (editEmpBtn) {
            showEmployeeForm(editEmpBtn.dataset.employeeId);
        } else if (deleteEmpBtn) {
            showConfirmationModal("حذف کارمند", "آیا از حذف این کارمند مطمئن هستید؟", async () => {
                try {
                    await deleteDoc(doc(db, `artifacts/${appId}/public/data/employees`, deleteEmpBtn.dataset.employeeId));
                    showToast("کارمند با موفقیت حذف شد.");
                } catch (error) {
                    console.error("Error deleting employee:", error);
                    showToast("خطا در حذف کارمند.", "error");
                }
            });
        }
    });
};
// کل این تابع را با نسخه جدید جایگزین کنید
const setupOrganizationPageListeners = () => {
    document.getElementById('add-team-btn')?.addEventListener('click', () => showTeamForm());
    document.getElementById('add-team-btn-empty')?.addEventListener('click', () => showTeamForm());

    // از شناسه جدید برای پیدا کردن کانتینر استفاده می‌کنیم
    const teamsContainer = document.getElementById('teams-container');
    if(teamsContainer) {
        teamsContainer.addEventListener('click', (e) => {
            const viewTeamBtn = e.target.closest('.view-team-profile-btn');
            const deleteTeamBtn = e.target.closest('.delete-team-btn');

            if (viewTeamBtn) {
                viewTeamProfile(viewTeamBtn.dataset.teamId);
            } else if (deleteTeamBtn) {
                showConfirmationModal("حذف تیم", "آیا از حذف این تیم مطمئن هستید؟", async () => { 
                    try { 
                        await deleteDoc(doc(db, `artifacts/${appId}/public/data/teams`, deleteTeamBtn.dataset.teamId)); 
                        showToast("تیم با موفقیت حذف شد."); 
                    } catch (error) { 
                        console.error("Error deleting team:", error); 
                        showToast("خطا در حذف تیم.", "error"); 
                    } 
                });
            }
        });
    }
};
// این تابع جدید را به js/main.js اضافه کنید
// در فایل js/main.js
// کل این تابع را با نسخه جدید جایگزین کنید
// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

// فایل: js/main.js
// این تابع را به طور کامل جایگزین نسخه فعلی کنید ▼

// فایل: js/main.js
// این تابع را به طور کامل جایگزین نسخه فعلی کنید ▼

const setupRequestsPageListeners = () => {
    // ... (بخش مربوط به خوانده شده کردن درخواست‌ها بدون تغییر) ...
    if (state.requestFilter === 'mine' && state.currentUser) {
        const unreadRequests = (state.requests || []).filter(req => req.assignedTo === state.currentUser.uid && !req.isReadByAssignee);
        if (unreadRequests.length > 0) {
            const batch = writeBatch(db);
            unreadRequests.forEach(req => { const docRef = doc(db, `artifacts/${appId}/public/data/requests`, req.firestoreId); batch.update(docRef, { isReadByAssignee: true }); });
            batch.commit().then(() => { updateNotificationBell(); }).catch(err => console.error("Error marking requests as read:", err));
        }
    }

    // --- بخش جدید برای صفحه‌بندی و سایر event ها ---
    const mainContentArea = document.getElementById('main-content');
    if (!mainContentArea) return;

    // رندر کردن دکمه‌های صفحه‌بندی
    const totalRequests = (state.requests || []).filter(req => state.requestFilter !== 'mine' || req.assignedTo === state.currentUser?.uid).length;
    renderPagination('pagination-container', state.currentPageRequests, totalRequests, 10);

    mainContentArea.addEventListener('click', async (e) => {
        const filterBtn = e.target.closest('.request-filter-btn');
        const processBtn = e.target.closest('.process-request-btn');
        const paginationBtn = e.target.closest('.pagination-btn');

        if (filterBtn) {
            state.requestFilter = filterBtn.dataset.filter;
            state.currentPageRequests = 1; // ریست کردن صفحه هنگام تغییر فیلتر
            renderPage('requests');
        }
        if (processBtn) {
            (window.showProcessRequestForm || (()=>{}))(processBtn.dataset.id);
        }
        if (paginationBtn && !paginationBtn.disabled) {
            state.currentPageRequests = Number(paginationBtn.dataset.page);
            renderPage('requests');
        }
    });

    // ... (بخش مربوط به select واگذاری بدون تغییر) ...
    const tableBody = document.getElementById('requests-table-body');
    if (tableBody) {
        tableBody.addEventListener('input', async (e) => {
            if (e.target.classList.contains('assign-request-select')) {
                const selectElement = e.target; const requestId = selectElement.dataset.id; const adminUid = selectElement.value;
                const requestRef = doc(db, `artifacts/${appId}/public/data/requests`, requestId);
                try { await updateDoc(requestRef, { assignedTo: adminUid || null, isReadByAssignee: false }); showToast(`درخواست به کاربر مورد نظر واگذار شد.`); } catch (error) { console.error("Error re-assigning request:", error); showToast("خطا در واگذاری درخواست.", "error"); }
            }
        });
    }
};
// فایل: js/main.js
// این تابع را به طور کامل جایگزین نسخه فعلی کنید ▼

// فایل: js/main.js
// این تابع را به طور کامل جایگزین نسخه فعلی کنید ▼
// فایل: js/main.js
// ▼▼▼ این تابع جدید را به فایل خود اضافه کنید ▼▼▼

// فایل: js/main.js
// ▼▼▼ این تابع را به طور کامل با نسخه جدید جایگزین کنید ▼▼▼

const setupTeamPerformanceListeners = () => {
    const mainContentArea = document.getElementById('employee-main-content');
    if (!mainContentArea) return;

    mainContentArea.addEventListener('click', e => {
        const evalBtn = e.target.closest('.view-evaluation-btn');
        if (evalBtn) {
            const employeeId = evalBtn.dataset.employeeId;
            const cycleId = evalBtn.dataset.cycleId;
            
            // پیدا کردن اطلاعات لازم از state
            const employee = state.employees.find(e => e.firestoreId === employeeId);
            const cycle = state.evaluationCycles.find(c => c.firestoreId === cycleId);
            const evaluation = state.employeeEvaluations.find(ev => ev.employeeId === employee.id && ev.cycleId === cycleId);

            if (employee && cycle) {
                // ارسال هر سه آبجکت به تابع نمایش فرم
                showEvaluationForm(employee, cycle, evaluation);
            } else {
                showToast("اطلاعات کارمند یا دوره ارزیابی یافت نشد.", "error");
            }
        }
    });
};
const setupTasksPageListeners = () => {
    // ابتدا چک می‌کنیم که کانتینر اصلی در صفحه وجود داشته باشد
    const mainContentArea = document.getElementById('main-content');
    if (!mainContentArea) return;

    // رندر کردن دکمه‌های صفحه‌بندی
    const totalTasks = (state.reminders || []).filter(r => r.assignedTo === state.currentUser?.uid).length;
    renderPagination('pagination-container', state.currentPageTasks, totalTasks, 10);

    // مدیریت کلیک روی دکمه‌های صفحه‌بندی
    mainContentArea.addEventListener('click', (e) => {
        const paginationBtn = e.target.closest('.pagination-btn');
        if (paginationBtn && !paginationBtn.disabled) {
            state.currentPageTasks = Number(paginationBtn.dataset.page);
            renderPage('tasks');
        }
    });
    
    const tableBody = document.getElementById('tasks-table-body');
    if (tableBody) {
        tableBody.addEventListener('input', async (e) => {
            if (e.target.classList.contains('assign-reminder-select')) {
                const reminderId = e.target.dataset.id; const adminUid = e.target.value; const reminderRef = doc(db, `artifacts/${appId}/public/data/reminders`, reminderId);
                try { await updateDoc(reminderRef, { assignedTo: adminUid, isReadByAssignee: false }); showToast(`یادآور به کاربر مورد نظر واگذار شد.`); } catch (error) { showToast("خطا در واگذاری یادآور.", "error"); }
            }
        });

        tableBody.addEventListener('click', (e) => {
            const processBtn = e.target.closest('.process-reminder-btn');
            if (processBtn) {
                (window.showProcessReminderForm || (()=>{}))(processBtn.dataset.id);
            }
        });
    }
};
// Minimal processing modal for reminders (fallback)
if (typeof window.showProcessReminderForm !== 'function') {
    window.showProcessReminderForm = (reminderId) => {
        const reminder = (state.reminders || []).find(r => r.firestoreId === reminderId);
        if (!reminder) { showToast('یادآور یافت نشد.', 'error'); return; }
        modalTitle.innerText = `پردازش یادآور: ${reminder.type || ''}`;
        modalContent.innerHTML = `
            <form id="process-reminder-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium">وضعیت</label>
                    <select id="reminder-status" class="w-full p-2 border rounded-md bg-white">
                        <option ${reminder.status==='جدید'?'selected':''} value="جدید">جدید</option>
                        <option ${reminder.status==='در حال انجام'?'selected':''} value="در حال انجام">در حال انجام</option>
                        <option ${reminder.status==='انجام شده'?'selected':''} value="انجام شده">انجام شده</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium">یادداشت پردازش</label>
                    <textarea id="reminder-notes" rows="4" class="w-full p-2 border rounded-md">${reminder.processingNotes || ''}</textarea>
                </div>
                <div class="flex justify-end gap-2">
                    <button type="button" id="cancel-process-reminder" class="bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300">انصراف</button>
                    <button type="submit" class="primary-btn">ذخیره</button>
                </div>
            </form>`;
        openModal(mainModal, mainModalContainer);
        document.getElementById('cancel-process-reminder')?.addEventListener('click', () => closeModal(mainModal, mainModalContainer));
        document.getElementById('process-reminder-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const newStatus = document.getElementById('reminder-status').value;
                const notes = document.getElementById('reminder-notes').value.trim();
                await updateDoc(doc(db, `artifacts/${appId}/public/data/reminders`, reminderId), {
                    status: newStatus,
                    processingNotes: notes,
                    lastUpdatedAt: serverTimestamp()
                });
                showToast('یادآور به‌روزرسانی شد.');
                closeModal(mainModal, mainModalContainer);
                renderPage('tasks');
            } catch (error) {
                console.error('Error processing reminder:', error);
                showToast('خطا در ذخیره یادآور.', 'error');
            }
        });
    };
}
// در فایل js/main.js
// کل این تابع را با نسخه جدید جایگزین کنید
// در فایل js/main.js
// کل این تابع را با نسخه جدید جایگزین کنید
// فایل: js/main.js
// تابع setupSettingsPageListeners را به طور کامل با این نسخه جایگزین کنید ▼

// فایل: js/main.js
// تابع setupSettingsPageListeners را به طور کامل با این نسخه جایگزین کنید ▼

// فایل: js/main.js
// کل تابع setupSettingsPageListeners را با این نسخه جایگزین کنید ▼

const setupSettingsPageListeners = () => {
    const mainContentArea = document.getElementById('main-content');
    if (!mainContentArea) return;

    // مدیریت کلیک روی تب‌ها
    mainContentArea.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const pageName = tab.dataset.tab;
            if (pageName === 'evaluation') {
                navigateTo('evaluation');
                return;
            }
            mainContentArea.querySelectorAll('.settings-tab').forEach(t => { t.classList.remove('primary-btn'); t.classList.add('secondary-btn'); });
            tab.classList.add('primary-btn');
            tab.classList.remove('secondary-btn');
            mainContentArea.querySelectorAll('.settings-tab-pane').forEach(pane => {
                pane.classList.toggle('hidden', pane.id !== `tab-${tab.dataset.tab}`);
            });
        });
    });

    // مدیریت کلیک روی دکمه‌های مختلف در کل صفحه تنظیمات
    mainContentArea.addEventListener('click', (e) => {
        const addUserBtn = e.target.closest('#add-user-btn');
        const editUserBtn = e.target.closest('.edit-user-btn');
        const deleteUserBtn = e.target.closest('.delete-user-btn');
        const deleteCompetencyBtn = e.target.closest('.delete-competency-btn');
        const addRuleBtn = e.target.closest('#add-rule-btn');
        const editRuleBtn = e.target.closest('.edit-rule-btn');
        const deleteRuleBtn = e.target.closest('.delete-rule-btn');
        const addPositionBtn = e.target.closest('#add-position-btn');
        const editPositionBtn = e.target.closest('.edit-position-btn');
        const deletePositionBtn = e.target.closest('.delete-position-btn');
        const mapCompetenciesBtn = e.target.closest('.map-competencies-btn');
        
        // [!code start]
        // ▼▼▼ منطق دکمه حذف خانواده شغلی اضافه شد ▼▼▼
        const deleteFamilyBtn = e.target.closest('.delete-family-btn');
        // [!code end]

        if (addUserBtn) showAddUserForm();
        if (editUserBtn) {
            const user = state.users.find(u => u.firestoreId === editUserBtn.dataset.uid);
            if (user) showEditUserForm(user);
        }
        if (deleteUserBtn) { /* ... کد حذف کاربر ... */ }
        if (deleteCompetencyBtn) {
            const compId = deleteCompetencyBtn.dataset.id;
            showConfirmationModal('حذف شایستگی', 'این شایستگی از لیست حذف خواهد شد. ادامه می‌دهید؟', async () => {
                try {
                    await deleteDoc(doc(db, `artifacts/${appId}/public/data/competencies`, compId));
                    showToast('شایستگی حذف شد.');
                } catch (err) {
                    showToast('خطا در حذف شایستگی.', 'error');
                }
            });
        }
        
        // [!code start]
        // ▼▼▼ عملکرد دکمه حذف خانواده شغلی ▼▼▼
        if (deleteFamilyBtn) {
            const familyId = deleteFamilyBtn.dataset.id;
            showConfirmationModal('حذف خانواده شغلی', 'آیا مطمئن هستید؟', async () => {
                try {
                    await deleteDoc(doc(db, `artifacts/${appId}/public/data/jobFamilies`, familyId));
                    showToast('خانواده شغلی حذف شد.');
                } catch (err) {
                    showToast('خطا در حذف.', 'error');
                }
            });
        }
        // [!code end]

        if (addRuleBtn) showAssignmentRuleForm();
        if (editRuleBtn) showAssignmentRuleForm(editRuleBtn.dataset.id);
        if (deleteRuleBtn) { /* ... کد حذف قانون ... */ }
        if (addPositionBtn) showJobPositionForm();
        if (editPositionBtn) showJobPositionForm(editPositionBtn.dataset.id);
        if (mapCompetenciesBtn) {
            const position = state.jobPositions.find(p => p.firestoreId === mapCompetenciesBtn.dataset.id);
            if (position) showCompetencyMappingModal(position);
        }
        if (deletePositionBtn) {
            showConfirmationModal('حذف پوزیشن', 'آیا مطمئن هستید؟', async () => {
                try {
                    await deleteDoc(doc(db, `artifacts/${appId}/public/data/jobPositions`, deletePositionBtn.dataset.id));
                    showToast("پوزیشن با موفقیت حذف شد.");
                } catch (error) { showToast("خطا در حذف.", "error"); }
            });
        }
    });

    // فعال‌سازی فرم افزودن شایستگی
    const addCompetencyForm = document.getElementById('add-competency-form');
    if (addCompetencyForm) {
        addCompetencyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('new-competency-name');
            const name = (input?.value || '').trim();
            if (!name) return;
            try {
                await addDoc(collection(db, `artifacts/${appId}/public/data/competencies`), { name, createdAt: serverTimestamp() });
                input.value = '';
                showToast('شایستگی اضافه شد.');
            } catch (err) {
                showToast('خطا در افزودن شایستگی.', 'error');
            }
        });
    }

    // [!code start]
    // ▼▼▼ منطق فرم افزودن خانواده شغلی اضافه شد ▼▼▼
    const addFamilyForm = document.getElementById('add-family-form');
    if (addFamilyForm) {
        addFamilyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('new-family-name');
            const name = (input?.value || '').trim();
            if (!name) return;
            try {
                await addDoc(collection(db, `artifacts/${appId}/public/data/jobFamilies`), { name, createdAt: serverTimestamp() });
                input.value = '';
                showToast('خانواده شغلی جدید اضافه شد.');
            } catch (err) {
                showToast('خطا در افزودن.', 'error');
            }
        });
    }
    // [!code end]
    // ▲▲▲ پایان بخش فعال‌سازی فرم ▲▲▲
    
    document.querySelectorAll('.role-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const uid = e.target.getAttribute('data-uid');
            const newRole = e.target.value;
            try {
                await updateDoc(doc(db, `artifacts/${appId}/public/data/users`, uid), { role: newRole });
                showToast('نقش کاربر به‌روزرسانی شد.');
            } catch (err) {
                console.error('Error updating user role', err);
                showToast('خطا در تغییر نقش کاربر.', 'error');
            }
        });
    });

    const defaultAssigneeSelect = document.getElementById('default-assignee-select');
    if (defaultAssigneeSelect) {
        defaultAssigneeSelect.addEventListener('change', async (e) => {
            const selectedUid = e.target.value;
            const defaultRuleRef = doc(db, `artifacts/${appId}/public/data/assignmentRules`, '_default');
            try {
                if (selectedUid) {
                    await setDoc(defaultRuleRef, { assigneeUid: selectedUid, ruleName: 'Default Assignee' });
                } else {
                    await deleteDoc(defaultRuleRef);
                }
                showToast("واگذاری پیش‌فرض با موفقیت بروزرسانی شد.");
            } catch (error) {
                console.error("Error setting default assignee:", error);
                showToast("خطا در بروزرسانی واگذاری پیش‌فرض.", "error");
            }
        });
    }
};
// Assignment Rule form (add/edit)
// فایل: js/main.js
// این تابع را به طور کامل جایگزین نسخه فعلی کنید

if (typeof window.showAssignmentRuleForm !== 'function') {
    window.showAssignmentRuleForm = (ruleId = null) => {
        const existing = (state.assignmentRules || []).find(r => r.firestoreId === ruleId) || {};
        const admins = state.users.filter(u => u.role === 'admin');
        const adminOptions = admins.map(a => `<option value="${a.firestoreId}" ${existing.assigneeUid === a.firestoreId ? 'selected' : ''}>${a.name || a.email}</option>`).join('');
        
        // --- بخش جدید: ساخت چک‌باکس‌ها از روی آبجکت allItemTypes ---
        const itemTypesCheckboxes = Object.entries(allItemTypes).map(([key, description]) => `
            <label class="flex items-center gap-2 p-2 border rounded-lg hover:bg-slate-50 cursor-pointer">
                <input 
                    type="checkbox" 
                    class="rule-item-type-checkbox" 
                    value="${key}" 
                    ${(existing.itemTypes || []).includes(key) ? 'checked' : ''}
                >
                <span class="text-sm font-medium">${key}</span>
                <span class="text-xs text-slate-500">- ${description}</span>
            </label>
        `).join('');

        modalTitle.innerText = ruleId ? 'ویرایش قانون واگذاری' : 'افزودن قانون واگذاری';
        modalContent.innerHTML = `
            <form id="assignment-rule-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium">نام قانون</label>
                    <input id="rule-name" class="w-full p-2 border rounded-md" value="${existing.ruleName || ''}" required>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">برای کدام آیتم‌ها اعمال شود؟</label>
                    <div id="item-types-container" class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2">
                        ${itemTypesCheckboxes}
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium">واگذار به</label>
                    <select id="assignee-uid" class="w-full p-2 border rounded-md bg-white">${adminOptions}</select>
                </div>
                <div class="flex justify-end gap-2">
                    <button type="button" id="cancel-rule" class="bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300">انصراف</button>
                    <button type="submit" class="primary-btn">ذخیره</button>
                </div>
            </form>`;
        openModal(mainModal, mainModalContainer);
        document.getElementById('cancel-rule')?.addEventListener('click', () => closeModal(mainModal, mainModalContainer));
        document.getElementById('assignment-rule-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const name = document.getElementById('rule-name').value.trim();
                const assigneeUid = document.getElementById('assignee-uid').value;
                
                // --- بخش جدید: خواندن مقادیر از چک‌باکس‌ها ---
                const itemTypes = Array.from(document.querySelectorAll('.rule-item-type-checkbox:checked'))
                                     .map(checkbox => checkbox.value);

                if (itemTypes.length === 0) {
                    showToast('حداقل یک نوع آیتم را انتخاب کنید.', 'error');
                    return;
                }

                const ruleData = { ruleName: name, itemTypes, assigneeUid };

                if (ruleId) {
                    await updateDoc(doc(db, `artifacts/${appId}/public/data/assignmentRules`, ruleId), ruleData);
                } else {
                    await addDoc(collection(db, `artifacts/${appId}/public/data/assignmentRules`), { ...ruleData, createdAt: serverTimestamp() });
                }
                showToast('قانون واگذاری ذخیره شد.');
                closeModal(mainModal, mainModalContainer);
                renderPage('settings');
            } catch (error) {
                console.error('Error saving rule', error);
                showToast('خطا در ذخیره قانون.', 'error');
            }
        });
    };
}
const setupAnalyticsPage = () => {
    // --- منطق تب‌ها ---
    const tabs = document.querySelectorAll('.analytics-tab');
    const panes = document.querySelectorAll('.analytics-tab-pane');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('border-blue-600', 'text-blue-600');
                t.classList.add('border-transparent', 'text-slate-500', 'hover:text-slate-700', 'hover:border-slate-300');
            });
            tab.classList.add('border-blue-600', 'text-blue-600');
            tab.classList.remove('border-transparent', 'text-slate-500', 'hover:text-slate-700', 'hover:border-slate-300');

            panes.forEach(pane => {
                pane.classList.toggle('hidden', pane.id !== `tab-${tab.dataset.tab}`);
            });
            // برای اطمینان از رندر شدن صحیح نمودارها هنگام نمایش تب
            window.dispatchEvent(new Event('resize'));
        });
    });

    // --- توابع رندر داده‌ها ---
    const renderAttritionHotspots = () => {
        const container = document.getElementById('attrition-hotspot-list');
        if (!container) return;
        const highRiskEmployees = state.employees.filter(emp => emp.attritionRisk && emp.attritionRisk.score > 60).sort((a, b) => b.attritionRisk.score - a.attritionRisk.score).slice(0, 10);
        if (highRiskEmployees.length === 0) {
            container.innerHTML = '<p class="text-sm text-slate-500 text-center">موردی با ریسک بالا یافت نشد.</p>';
            return;
        }
        container.innerHTML = highRiskEmployees.map(emp => `
            <div class="flex items-center">
                <img src="${emp.avatar}" class="w-9 h-9 rounded-full object-cover ml-3">
                <div class="flex-grow">
                    <p class="font-semibold text-sm text-slate-800">${emp.name}</p>
                    <p class="text-xs text-slate-500">${emp.jobTitle || ''}</p>
                </div>
                <span class="font-bold text-sm text-red-500">${emp.attritionRisk.score}%</span>
            </div>
        `).join('');
    };

    const renderNineBoxGrid = () => {
        const container = document.getElementById('nine-box-grid-container');
        if (!container) return;

        const nineBoxData = [
            { id: 'enigma', title: 'معما', color: 'bg-yellow-100', textColor: 'text-yellow-800' },
            { id: 'needs-improvement', title: 'نیازمند بهبود', color: 'bg-yellow-100', textColor: 'text-yellow-800' },
            { id: 'high-potential', title: 'پتانسیل بالا', color: 'bg-green-100', textColor: 'text-green-800' },
            { id: 'average-performer', title: 'عملکرد متوسط', color: 'bg-slate-100', textColor: 'text-slate-800' },
            { id: 'solid-performer', title: 'عملکرد قابل اتکا', color: 'bg-blue-100', textColor: 'text-blue-800' },
            { id: 'core-talent', title: 'استعداد کلیدی', color: 'bg-green-100', textColor: 'text-green-800' },
            { id: 'risk', title: 'ریسک', color: 'bg-red-100', textColor: 'text-red-800' },
            { id: 'key-player', title: 'مهره کلیدی', color: 'bg-blue-100', textColor: 'text-blue-800' },
            { id: 'star', title: 'ستاره', color: 'bg-green-100', textColor: 'text-green-800' },
        ];
        
        const distribution = state.dashboardMetrics.nineBoxDistribution || {};
        
        container.innerHTML = `<div class="grid grid-cols-3 gap-1 h-full">
            ${nineBoxData.map(box => {
                const count = distribution[box.title + ' (Solid Performer)'] || distribution[box.title] || 0;
                return `<div class="nine-box-cell ${box.color} ${box.textColor} rounded-lg p-3 flex flex-col justify-center items-center text-center">
                    <span class="text-2xl font-bold">${count}</span>
                    <span class="text-xs mt-1">${box.title}</span>
                </div>`
            }).reverse().join('')}
        </div>`;
    };

    const renderEngagementBreakdownChart = () => {
        const ctx = document.getElementById('engagementBreakdownChart')?.getContext('2d');
        if (!ctx || !state.orgAnalytics?.engagementBreakdown) return;

        const data = state.orgAnalytics.engagementBreakdown;
        charts.engagementBreakdown = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.name),
                datasets: [{
                    label: 'امتیاز مشارکت',
                    data: data.map(d => d.score),
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ef4444', '#64748b'],
                    hoverOffset: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    };
    const renderTeamHealthChart = () => {
        const ctx = document.getElementById('teamHealthChart')?.getContext('2d');
        if (!ctx || state.teams.length === 0) return;

        const teamData = state.teams.map(team => {
            const scores = Object.values(team.healthMetrics || {});
            const avgHealth = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            return { name: team.name, health: avgHealth };
        }).sort((a,b) => b.health - a.health);

        charts.teamHealth = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: teamData.map(t => t.name),
                datasets: [{
                    label: 'نمره سلامت',
                    data: teamData.map(t => t.health),
                    backgroundColor: '#22c55e',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y', // for horizontal bar chart
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, max: 100 } }
            }
        });
    };

    const setupSkillGapFinder = () => {
        const findBtn = document.getElementById('find-skill-gap-btn');
        const resultsContainer = document.getElementById('skill-gap-results');
        if (!findBtn) return;
        findBtn.addEventListener('click', () => {
            const teamId = document.getElementById('skill-team-select').value;
            const skillName = document.getElementById('skill-search-input').value.trim().toLowerCase();
            if (!skillName) {
                resultsContainer.innerHTML = '<p class="text-sm text-center text-red-500">لطفا نام یک مهارت را وارد کنید.</p>';
                return;
            }
            let targetEmployees = state.employees.filter(e => e.status === 'فعال');
            if (teamId !== 'all') {
                const team = state.teams.find(t => t.firestoreId === teamId);
                if (team) targetEmployees = state.employees.filter(emp => team.memberIds?.includes(emp.id));
            }
            const skillAnalysis = { expert: [], intermediate: [], beginner: [], none: [] };
            targetEmployees.forEach(emp => {
                const skills = emp.skills || {};
                const skillKeys = Object.keys(skills).map(k => k.toLowerCase());
                const skillIndex = skillKeys.findIndex(k => k.includes(skillName));
                if (skillIndex > -1) {
                    const originalKey = Object.keys(skills)[skillIndex];
                    const level = skills[originalKey];
                    if (level >= 4) skillAnalysis.expert.push(emp.name);
                    else if (level >= 2) skillAnalysis.intermediate.push(emp.name);
                    else skillAnalysis.beginner.push(emp.name);
                } else {
                    skillAnalysis.none.push(emp.name);
                }
            });
            resultsContainer.innerHTML = `
                <h4 class="font-bold mb-3">نتایج برای: <span class="text-teal-600">${skillName}</span></h4>
                <div class="grid grid-cols-2 gap-4 text-center">
                    <div class="bg-slate-100 p-2 rounded-md"><p class="font-semibold text-lg">${skillAnalysis.expert.length}</p><p class="text-xs text-slate-500">متخصص (۴-۵)</p></div>
                    <div class="bg-slate-100 p-2 rounded-md"><p class="font-semibold text-lg">${skillAnalysis.intermediate.length}</p><p class="text-xs text-slate-500">متوسط (۲-۳)</p></div>
                    <div class="bg-slate-100 p-2 rounded-md"><p class="font-semibold text-lg">${skillAnalysis.beginner.length}</p><p class="text-xs text-slate-500">مبتدی (۱)</p></div>
                    <div class="bg-slate-100 p-2 rounded-md"><p class="font-semibold text-lg">${skillAnalysis.none.length}</p><p class="text-xs text-slate-500">فاقد مهارت</p></div>
                </div>
                <div class="mt-3 text-xs text-slate-600"><strong class="font-semibold">متخصصین:</strong> ${skillAnalysis.expert.join(', ') || 'هیچ'}</div>
            `;
        });
    };
    
    // --- اجرای توابع ---
    destroyCharts(); // پاک کردن نمودارهای قبلی
    renderAttritionHotspots();
    renderNineBoxGrid();
    renderEngagementBreakdownChart();
    renderTeamHealthChart();
    renderPerformanceDistributionChart(); 
    setupSkillGapFinder();
        document.getElementById('start-evaluation-cycle-btn')?.addEventListener('click', async () => {
        const cycleId = prompt("لطفاً یک شناسه یکتا برای این دوره ارزیابی وارد کنید (مثال: Q4-2025):", `Q${Math.floor((new Date().getMonth() / 3) + 1)}-${new Date().getFullYear()}`);
        if (!cycleId || cycleId.trim() === '') return;

        let loadingToast = showToast('در حال آماده‌سازی دوره ارزیابی برای تمام کارمندان فعال...', 'success', null);
        try {
            const startCycle = httpsCallable(functions, 'startEvaluationCycle');
            const result = await startCycle({ cycleId: cycleId.trim() });
            showToast(result.data.message, 'success');
        } catch (error) {
            console.error("Error starting cycle:", error);
            showToast(`خطا در شروع دوره: ${error.message}`, 'error');
        } finally {
            if (loadingToast) {
                loadingToast.remove();
            }
        }
    });
};
// فایل: js/main.js - این تابع جدید را اضافه کنید

// [!code start]
// فایل: js/main.js - این تابع را به طور کامل جایگزین نسخه قبلی کنید

const showEvaluationForm = (employee, cycle, evaluation) => {
    modalTitle.innerText = `ارزیابی عملکرد: ${employee.name} (${cycle.title})`;

    // بخش ۱: نمایش خودارزیابی کارمند
    let selfAssessmentHtml = `
        <div class="p-4 bg-yellow-50 border-yellow-200 rounded-lg text-sm text-yellow-800">
            <p class="font-semibold">کارمند هنوز خودارزیابی را تکمیل نکرده است.</p>
        </div>`;

    if (evaluation && evaluation.selfAssessment) {
        const selfData = evaluation.selfAssessment;
        selfAssessmentHtml = `
            <div class="p-4 bg-slate-100 rounded-lg border text-sm text-slate-700 space-y-3">
                <div>
                    <p class="font-bold mb-1">نقاط قوت از دید کارمند:</p>
                    <p class="whitespace-pre-wrap">${selfData.strengths || '-'}</p>
                </div>
                <div class="border-t pt-3">
                    <p class="font-bold mb-1">زمینه‌های قابل بهبود از دید کارمند:</p>
                    <p class="whitespace-pre-wrap">${selfData.improvementAreas || '-'}</p>
                </div>
            </div>`;
    }

    // بخش ۲: آماده‌سازی فرم ارزیابی مدیر (شایستگی‌ها و اهداف)
    const position = state.jobPositions.find(p => p.firestoreId === employee.jobPositionId);
    const relevantCompetencyIds = new Set(position?.competencyIds || []);
    const competenciesForReview = state.competencies.filter(c => relevantCompetencyIds.has(c.firestoreId));
    
    const competenciesHtml = competenciesForReview.length > 0 ? competenciesForReview.map(comp => `
        <div class="mb-3 p-3 bg-slate-50 rounded-lg border">
            <label class="block text-sm font-medium text-slate-700">${comp.name}</label>
            <p class="text-xs text-slate-500 mb-2">امتیاز مدیر به این شایستگی (۱ تا ۵):</p>
            <input type="number" class="competency-score w-full p-2 border rounded-md" data-name="${comp.name}" min="1" max="5" value="3" required>
        </div>
    `).join('') : '<p class="text-sm text-slate-500">شایستگی‌ای برای این پوزیشن شغلی تعریف نشده است.</p>';

    const team = state.teams.find(t => t.memberIds?.includes(employee.id));
    const teamOkrsHtml = (team?.okrs || []).map(okr => `
        <div class="mb-3 p-3 bg-slate-50 rounded-lg border">
            <label class="block text-sm font-medium text-slate-700">${okr.title} (پیشرفت تیم: ${okr.progress}%)</label>
            <p class="text-xs text-slate-500 mb-2">امتیاز مدیر به مشارکت کارمند در این هدف (۱ تا ۵):</p>
            <input type="number" class="okr-score w-full p-2 border rounded-md" data-title="${okr.title}" min="1" max="5" value="3" required>
        </div>
    `).join('') || '<p class="text-sm text-slate-500">تیم این کارمند هدفی (OKR) ثبت شده ندارد.</p>';

    // بخش ۳: ساختار نهایی فرم
    modalContent.innerHTML = `
        <form id="manager-evaluation-form" class="space-y-6">
            <div>
                <h4 class="font-bold text-lg mb-2 text-slate-600">۱. خلاصه خودارزیابی کارمند</h4>
                ${selfAssessmentHtml}
            </div>
            <div>
                <h4 class="font-bold text-lg mb-2 text-indigo-600">۲. ارزیابی شایستگی‌ها توسط مدیر</h4>
                ${competenciesHtml}
            </div>
            <div>
                <h4 class="font-bold text-lg mb-2 text-indigo-600">۳. ارزیابی اهداف توسط مدیر</h4>
                ${teamOkrsHtml}
            </div>
            <div>
                <h4 class="font-bold text-lg mb-2 text-indigo-600">۴. بازخورد نهایی مدیر</h4>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium">نقاط قوت کلیدی</label>
                        <textarea id="manager-strengths" class="w-full p-2 border rounded-md" rows="3" required></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium">زمینه‌های قابل بهبود</label>
                        <textarea id="manager-areasForImprovement" class="w-full p-2 border rounded-md" rows="3" required></textarea>
                    </div>
                </div>
            </div>
            <div class="flex justify-end pt-4 border-t">
                <button type="submit" class="primary-btn" ${!evaluation?.selfAssessment ? 'disabled' : ''}>
                    ${!evaluation?.selfAssessment ? 'در انتظار خودارزیابی کارمند' : 'ثبت نهایی ارزیابی'}
                </button>
            </div>
        </form>
    `;
    openModal(mainModal, mainModalContainer);

    document.getElementById('evaluation-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = e.target.querySelector('button[type="submit"]');
        saveBtn.disabled = true;
        saveBtn.innerText = "در حال ذخیره...";

        // ۱. جمع‌آوری امتیازات شایستگی‌ها
        const competencyScores = {};
        document.querySelectorAll('.competency-score').forEach(input => {
            competencyScores[input.dataset.name] = parseInt(input.value);
        });
        const competencyInputs = Object.values(competencyScores);
        const avgCompetencyScore = competencyInputs.length > 0 ? competencyInputs.reduce((a, b) => a + b, 0) / competencyInputs.length : 0;

        // ۲. جمع‌آوری امتیازات اهداف
        const okrScores = {};
        document.querySelectorAll('.okr-score').forEach(input => {
            okrScores[input.dataset.title] = parseInt(input.value);
        });
        const okrInputs = Object.values(okrScores);
        const avgOkrScore = okrInputs.length > 0 ? okrInputs.reduce((a, b) => a + b, 0) / okrInputs.length : 0;

        // ۳. محاسبه امتیاز نهایی (با وزن ۵۰-۵۰)
        const overallScore = parseFloat(((avgCompetencyScore + avgOkrScore) / 2).toFixed(2));

        // ۴. آماده‌سازی داده برای ذخیره
        const managerAssessment = {
            competencyScores,
            okrScores,
            strengths: document.getElementById('strengths').value,
            areasForImprovement: document.getElementById('areasForImprovement').value,
            overallScore: overallScore,
            reviewDate: new Date().toISOString().split('T')[0], // تاریخ امروز
            reviewer: state.currentUser.name || state.currentUser.email
        };

        try {
            const batch = writeBatch(db);

            // آپدیت کالکشن جدید employeeEvaluations
            // نکته: در یک سیستم واقعی، ابتدا باید چک کنیم داکیومنت وجود دارد یا خیر
            const evalRef = doc(collection(db, `artifacts/${appId}/public/data/employeeEvaluations`));
            batch.set(evalRef, {
                cycleId: cycle.firestoreId,
                employeeId: emp.id,
                managerId: state.currentUser.uid,
                status: 'completed',
                managerAssessment: managerAssessment,
                // selfAssessment: ... (بعدا اضافه می‌شود)
            });

            // آپدیت آرایه قدیمی performanceHistory در پروفایل کارمند برای سازگاری
            const empRef = doc(db, `artifacts/${appId}/public/data/employees`, emp.firestoreId);
            const newHistoryItem = {
                reviewDate: managerAssessment.reviewDate,
                reviewer: managerAssessment.reviewer,
                overallScore: managerAssessment.overallScore,
                strengths: managerAssessment.strengths,
                areasForImprovement: managerAssessment.areasForImprovement
            };
            batch.update(empRef, {
                performanceHistory: arrayUnion(newHistoryItem)
            });

            await batch.commit();
            showToast("ارزیابی عملکرد با موفقیت ثبت شد.");
            viewEmployeeProfile(emp.firestoreId); // پروفایل را مجددا باز کن تا سابقه جدید دیده شود
        } catch (error) {
            console.error("Error saving evaluation:", error);
            showToast("خطا در ذخیره‌سازی ارزیابی.", "error");
            saveBtn.disabled = false;
            saveBtn.innerText = "ثبت نهایی ارزیابی";
        }
    });
};
// فایل: js/main.js - این تابع جدید را اضافه کنید

// [!code start]
// فایل: js/main.js
// ▼▼▼ این تابع را به طور کامل با نسخه جدید جایگزین کنید ▼▼▼


// [!code end]
// [!code end]
const showExpenseForm = () => {
        modalTitle.innerText = 'افزودن هزینه جدید';
        const cardOptions = state.pettyCashCards.map(c => `<option value="${c.firestoreId}">${c.name}</option>`).join('');
        modalContent.innerHTML = `
            <form id="expense-form" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label class="block font-medium">تاریخ</label><input type="text" id="expense-date" class="w-full p-2 border border-slate-300 rounded-lg" required></div>
                    <div><label class="block font-medium">مبلغ (تومان)</label><input type="number" id="expense-amount" class="w-full p-2 border border-slate-300 rounded-lg" required></div>
                    <div class="md:col-span-2"><label class="block font-medium">شرح هزینه</label><input type="text" id="expense-item" class="w-full p-2 border border-slate-300 rounded-lg" required></div>
                    <div><label class="block font-medium">کارت تنخواه</label><select id="expense-card" class="w-full p-2 border border-slate-300 rounded-lg" required>${cardOptions}</select></div>
                    <div>
                        <label class="block font-medium">آپلود فاکتور (حداکثر ۵ مگابایت)</label>
                        <input type="file" id="expense-invoice-file" class="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"/>
                    </div>
                </div>
                <div class="pt-6 flex justify-end"><button type="submit" id="submit-expense-btn" class="bg-indigo-500 text-white py-2 px-6 rounded-lg hover:bg-indigo-600 shadow-md transition">ذخیره</button></div>
            </form>
        `;
        openModal(mainModal, mainModalContainer);
        activatePersianDatePicker('expense-date', new Date());

        document.getElementById('expense-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-expense-btn');
            submitBtn.disabled = true;
            submitBtn.innerText = 'در حال ذخیره...';

            const invoiceFile = document.getElementById('expense-invoice-file').files[0];
            let invoiceUrl = '';
            
            // --- بخش جدید: بررسی حجم فایل ---
            if (invoiceFile && invoiceFile.size > 5 * 1024 * 1024) { // 5 MB
                showToast("حجم فایل نباید بیشتر از ۵ مگابایت باشد.", "error");
                submitBtn.disabled = false;
                submitBtn.innerText = 'ذخیره';
                return;
            }

            // (بقیه کد بدون تغییر باقی می‌ماند)
            const amount = Number(document.getElementById('expense-amount').value);
            const cardId = document.getElementById('expense-card').value;
            const persianDate = document.getElementById('expense-date').value;
            const gregorianDate = persianToEnglishDate(persianDate);

            if (!gregorianDate) {
                showToast("فرمت تاریخ شمسی صحیح نیست.", "error");
                submitBtn.disabled = false;
                submitBtn.innerText = 'ذخیره';
                return;
            }

            try {
                if (invoiceFile) {
                    const filePath = `invoices/${Date.now()}_${invoiceFile.name}`;
                    const storageRef = ref(storage, filePath);
                    const snapshot = await uploadBytes(storageRef, invoiceFile);
                    invoiceUrl = await getDownloadURL(snapshot.ref);
                }
                const formData = {
                    date: gregorianDate, amount: amount, item: document.getElementById('expense-item').value, cardId: cardId, invoiceUrl: invoiceUrl, createdAt: serverTimestamp()
                };
                const cardRef = doc(db, `artifacts/${appId}/public/data/pettyCashCards`, cardId);
                const cardSnap = await getDoc(cardRef);
                if (cardSnap.exists()) {
                    const currentBalance = cardSnap.data().balance || 0;
                    if (currentBalance < amount) {
                        showToast('موجودی کارت کافی نیست.', 'error');
                        submitBtn.disabled = false;
                        submitBtn.innerText = 'ذخیره';
                        return;
                    }
                    const expenseCollectionRef = collection(db, `artifacts/${appId}/public/data/expenses`);
                    const batch = writeBatch(db);
                    batch.set(doc(expenseCollectionRef), formData);
                    batch.update(cardRef, { balance: currentBalance - amount });
                    await batch.commit();
                    closeModal(mainModal, mainModalContainer);
                    showToast('هزینه با موفقیت ثبت شد.');
                } else {
                    showToast('کارت تنخواه انتخاب شده معتبر نیست.', 'error');
                }

            } catch (error) {
                console.error("Error saving expense:", error);
                showToast('خطا در ذخیره هزینه.', 'error');
            } finally {
                if(submitBtn) {
                   submitBtn.disabled = false;
                   submitBtn.innerText = 'ذخیره';
                }
            }
        });
    };
        const showChargeCardForm = (cardId, cardName) => {
        modalTitle.innerText = `شارژ کارت تنخواه: ${cardName}`;
        modalContent.innerHTML = `
            <form id="charge-card-form" class="space-y-4">
                <div>
                    <label class="block font-medium">مبلغ شارژ (تومان)</label>
                    <input type="number" id="charge-amount" class="w-full p-2 border rounded-md" required>
                </div>
                <div class="pt-6 flex justify-end">
                    <button type="submit" id="submit-charge-btn" class="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700">تایید و شارژ</button>
                </div>
            </form>
        `;
        openModal(mainModal, mainModalContainer);

        document.getElementById('charge-card-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-charge-btn');
            submitBtn.disabled = true;
            submitBtn.innerText = 'در حال پردازش...';

            const amount = Number(document.getElementById('charge-amount').value);
            if (amount <= 0) {
                showToast("مبلغ شارژ باید مثبت باشد.", "error");
                submitBtn.disabled = false;
                submitBtn.innerText = 'تایید و شارژ';
                return;
            }

            try {
                const cardRef = doc(db, `artifacts/${appId}/public/data/pettyCashCards`, cardId);
                const chargeHistoryRef = collection(db, `artifacts/${appId}/public/data/chargeHistory`);
                const cardSnap = await getDoc(cardRef);

                if (cardSnap.exists()) {
                    const currentBalance = cardSnap.data().balance || 0;
                    const newBalance = currentBalance + amount;

                    const batch = writeBatch(db);
                    
                    // 1. Update card balance
                    batch.update(cardRef, { balance: newBalance });

                    // 2. Log the transaction
                    batch.set(doc(chargeHistoryRef), {
                        cardId: cardId,
                        cardName: cardName,
                        amount: amount,
                        chargedAt: serverTimestamp(),
                        chargedBy: state.currentUser.email
                    });

                    await batch.commit();
                    closeModal(mainModal, mainModalContainer);
                    showToast(`کارت ${cardName} با موفقیت شارژ شد.`);
                } else {
                    showToast("کارت مورد نظر یافت نشد.", "error");
                }
            } catch (error) {
                console.error("Error charging card:", error);
                showToast("خطا در عملیات شارژ کارت.", "error");
            } finally {
                 if(document.getElementById('submit-charge-btn')) { // Check if modal is still open
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'تایید و شارژ';
                 }
            }
        });
    };

        const renderCompetencyBars = (competencies) => {
            if (!competencies || Object.keys(competencies).length === 0) {
                return '<p class="text-sm text-gray-500">شایستگی‌ای ثبت نشده است.</p>';
            }
            return Object.entries(competencies).map(([name, score]) => `
                <div>
                    <div class="flex justify-between items-center mb-1 text-sm">
                        <span class="text-gray-600">${name}</span>
                        <span class="font-medium text-blue-600">${score}/5</span>
                    </div>
                    <div class="progress-bar w-full">
                        <div class="progress-bar-fill" style="width: ${score * 20}%;"></div>
                    </div>
                </div>
            `).join('');
        };

        const imageUploadInput = document.getElementById('image-upload-input');
        let onImageResizedCallback = null;
if (imageUploadInput) {
    imageUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file || !onImageResizedCallback) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_DIMENSION = 256;
                let { width, height } = img;

                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height *= MAX_DIMENSION / width;
                        width = MAX_DIMENSION;
                    }
                } else {
                    if (height > MAX_DIMENSION) {
                        width *= MAX_DIMENSION / height;
                        height = MAX_DIMENSION;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (onImageResizedCallback) {
                        onImageResizedCallback(blob);
                    }
                }, 'image/jpeg', 0.9);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    });
}

// این دو تابع را با هم کپی کرده و جایگزین تابع قدیمی handleAvatarChange کنید

function handleAvatarChange(emp) {
    const fileInput = document.getElementById('image-upload-input');
    
    fileInput.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // تابع کمکی برای تغییر سایز و آپلود
        resizeAndUploadAvatar(file, emp);
        event.target.value = ''; // ریست کردن اینپوت فایل
    };
    fileInput.click();
}
// فایل: js/main.js
// این تابع را به طور کامل جایگزین نسخه فعلی کنید
// فایل: js/main.js
// این تابع جدید را به فایل خود اضافه کنید ▼

/**
 * یک فایل عکس را می‌گیرد، آن را به یک عرض حداکثر تغییر سایز داده و فشرده می‌کند،
 * سپس آن را در Firebase Storage آپلود کرده و URL دانلود را برمی‌گرداند.
 * @param {File} file - فایل عکس انتخاب شده توسط کاربر.
 * @param {string} employeeUid - شناسه کاربر برای ساخت مسیر فایل.
 * @returns {Promise<string>} URL دانلود عکس آپلود شده.
 */
const resizeAndUploadMomentImage = (file, employeeUid) => {
    return new Promise((resolve, reject) => {
        const MAX_WIDTH = 1024; // حداکثر عرض عکس (پیکسل)
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        return reject(new Error("Canvas to Blob conversion failed."));
                    }
                    try {
                        showToast("در حال بهینه‌سازی و آپلود عکس...", "success", null);
                        const filePath = `moments/${employeeUid}/${Date.now()}.jpg`;
                        const storageRef = ref(storage, filePath);
                        const snapshot = await uploadBytes(storageRef, blob);
                        const downloadURL = await getDownloadURL(snapshot.ref);
                        resolve(downloadURL);
                    } catch (error) {
                        reject(error);
                    }
                }, 'image/jpeg', 0.85); // فشرده‌سازی با کیفیت ۸۵ درصد
            };
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};
async function resizeAndUploadAvatar(file, emp) {
    const MAX_DIMENSION = 256;
    const reader = new FileReader();

    reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            
            // ... (بخش تغییر سایز عکس بدون تغییر) ...
            if (width > height) {
                if (width > MAX_DIMENSION) { height *= MAX_DIMENSION / width; width = MAX_DIMENSION; }
            } else {
                if (height > MAX_DIMENSION) { width *= MAX_DIMENSION / height; height = MAX_DIMENSION; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const resizedBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
            if (!resizedBlob) return;

            let loadingToast = null; // متغیری برای نگهداری اعلان "در حال آپلود"

            try {
                // ۱. یک اعلان ثابت (بدون حذف خودکار) ایجاد می‌کنیم
                loadingToast = showToast("در حال آپلود عکس، لطفاً منتظر بمانید...", "success", null);

                const filePath = `avatars/${emp.firestoreId}/${Date.now()}.jpg`;
                const storageRef = ref(storage, filePath);
                const snapshot = await uploadBytes(storageRef, resizedBlob);
                const downloadURL = await getDownloadURL(snapshot.ref);
                const docRef = doc(db, `artifacts/${appId}/public/data/employees`, emp.firestoreId);
                await updateDoc(docRef, { avatar: downloadURL });
                
                // ۳. اعلان موفقیت‌آمیز (که خودکار حذف می‌شود) را نمایش می‌دهیم
                showToast("عکس پروفایل با موفقیت به‌روزرسانی شد.");

                const updatedEmp = { ...emp, avatar: downloadURL };
                state.employees = state.employees.map(e => e.firestoreId === emp.firestoreId ? updatedEmp : e);
                viewEmployeeProfile(emp.firestoreId);

            } catch (error) {
                console.error("Error uploading avatar:", error);
                showToast("خطا در آپلود عکس پروفایل.", "error");
            } finally {
                // ۲. در هر صورت (موفقیت یا خطا)، اعلان "در حال آپلود" را دستی حذف می‌کنیم
                if (loadingToast) {
                    loadingToast.remove();
                }
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}
        const generateSmartAnalysis = (emp) => {
            const analysis = {};
            if (emp.performanceHistory && emp.performanceHistory.length > 1) {
                const last = emp.performanceHistory[emp.performanceHistory.length - 1].overallScore;
                const first = emp.performanceHistory[0].overallScore;
                if (last > first + 0.2) { analysis.performance = { text: 'روند عملکرد کاملاً صعودی است.', icon: 'trending-up', color: 'text-green-600' }; } 
                else if (first > last + 0.2) { analysis.performance = { text: 'روند عملکرد نیاز به بررسی دارد.', icon: 'trending-down', color: 'text-yellow-600' }; } 
                else { analysis.performance = { text: 'عملکرد پایدار و قابل اتکایی دارد.', icon: 'minus', color: 'text-gray-600' }; }
            }
            if (emp.attritionRisk?.score > 70) { analysis.risk = { text: 'ریسک خروج بالا. پیشنهاد می‌شود جلسه هم‌اندیشی برگزار شود.', icon: 'shield-alert', color: 'text-red-600' }; } 
            else if (emp.attritionRisk?.score > 40) { analysis.risk = { text: 'ریسک خروج متوسط. حفظ انگیزه و شفافیت در مسیر رشد توصیه می‌شود.', icon: 'shield-check', color: 'text-yellow-600' }; }
            if (emp.nineBox === 'ستاره' || emp.nineBox === 'پتانسیل بالا') { analysis.potential = { text: 'پتانسیل بالایی برای رشد و پذیرش مسئولیت‌های کلیدی دارد.', icon: 'sparkles', color: 'text-blue-600' }; } 
            else if (emp.nineBox === 'مهره کلیدی') { analysis.potential = { text: 'یک مهره کلیدی با عملکرد بالا در نقش فعلی است.', icon: 'key-round', color: 'text-teal-600' }; }
            const topSkill = Object.entries(emp.skills || {}).sort((a, b) => b[1] - a[1])[0];
            const topCompetency = Object.entries(emp.competencies || {}).sort((a, b) => b[1] - a[1])[0];
            if (topSkill || topCompetency) { analysis.strength = { text: `نقاط قوت کلیدی: <strong>${topSkill ? topSkill[0] : ''}</strong> و <strong>${topCompetency ? topCompetency[0] : ''}</strong>.`, icon: 'star', color: 'text-amber-500' }; }
            return analysis;
        };
const isProfileComplete = (employee) => {
    if (!employee.personalInfo) return false;
    // لیست فیلدهایی که برای کامل بودن پروفایل ضروری هستند
    const requiredFields = [
        'nationalId', 'birthDate', 'phone', 'address', 'email',
        'maritalStatus', 'education'
    ];

    // چک می‌کنیم که همه فیلدهای ضروری وجود داشته باشند و خالی نباشند
    return requiredFields.every(field => {
        const value = employee.personalInfo[field];
        return value && value.toString().trim() !== '';
    });
};

        const generateTeamSmartAnalysis = (team) => {
            const analysis = {};
            const members = state.employees.filter(e => team.memberIds?.includes(e.id));
            if (members.length === 0) return analysis;
            const avgOkrProgress = (team.okrs || []).reduce((sum, okr) => sum + okr.progress, 0) / (team.okrs?.length || 1);
            if (avgOkrProgress > 70) { analysis.okr = { text: 'تیم در مسیر دستیابی به اهداف خود قرار دارد.', icon: 'trending-up', color: 'text-green-600' }; } 
            else if (avgOkrProgress < 40) { analysis.okr = { text: 'پیشرفت اهداف تیم نیاز به بازبینی و حمایت دارد.', icon: 'trending-down', color: 'text-yellow-600' }; }
            const highRiskMembers = members.filter(m => m.attritionRisk?.score > 70).length;
            if (highRiskMembers > 0) { analysis.risk = { text: `${highRiskMembers} نفر از اعضا ریسک خروج بالا دارند.`, icon: 'shield-alert', color: 'text-red-600' }; }
            return analysis;
        };

// فایل: js/main.js
// تابع showEmployeeForm را به طور کامل با این نسخه جایگزین کنید ▼

// فایل: js/main.js
// ▼▼▼ کل این تابع را با نسخه کامل و صحیح زیر جایگزین کنید ▼▼▼

// فایل: js/main.js
// ▼▼▼ کل این تابع را با نسخه کامل و صحیح زیر جایگزین کنید ▼▼▼

// فایل: js/main.js
// ▼▼▼ این کد را به طور کامل جایگزین تابع showEmployeeForm قبلی خود کنید ▼▼▼

// فایل: js/main.js
// ▼▼▼ کل این تابع را با نسخه جدید و کامل زیر جایگزین کنید ▼▼▼

const showEmployeeForm = (employeeId = null) => {
    const isEditing = employeeId !== null;
    const emp = isEditing ? state.employees.find(e => e.firestoreId === employeeId) : {};
    const currentTeam = isEditing ? state.teams.find(t => t.memberIds?.includes(emp.id)) : null;
    
    const teamOptions = state.teams.map(team => `<option value="${team.firestoreId}" ${currentTeam?.firestoreId === team.firestoreId ? 'selected' : ''}>${team.name}</option>`).join('');
    const familyOptions = (state.jobFamilies || []).map(family => `<option value="${family.name}" ${emp.jobFamily === family.name ? 'selected' : ''}>${family.name}</option>`).join('');

    modalTitle.innerText = isEditing ? 'ویرایش اطلاعات کارمند' : 'افزودن کارمند جدید';
    modalContent.innerHTML = `
        <form id="employee-form" class="space-y-5" data-old-team-id="${currentTeam?.firestoreId || ''}">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div class="bg-white border rounded-xl p-4"><label for="name" class="block text-xs font-semibold text-slate-500">نام کامل</label><input type="text" id="name" value="${emp.name || ''}" class="mt-2 block w-full p-2 border border-slate-300 rounded-lg" required></div>
                <div class="bg-white border rounded-xl p-4"><label for="id" class="block text-xs font-semibold text-slate-500">کد پرسنلی</label><input type="text" id="id" value="${emp.id || ''}" class="mt-2 block w-full p-2 border border-slate-300 rounded-lg" ${isEditing ? 'readonly' : ''} required></div>
                <div class="md:col-span-2 bg-white border rounded-xl p-4"><label for="employee-email" class="block text-xs font-semibold text-slate-500">آدرس ایمیل (برای ورود)</label><input type="email" id="employee-email" value="${emp.personalInfo?.email || ''}" class="mt-2 block w-full p-2 border border-slate-300 rounded-lg" ${isEditing ? 'readonly' : ''} required></div>
                
                <div class="bg-white border rounded-xl p-4"><label for="jobTitle" class="block text-xs font-semibold text-slate-500">عنوان شغلی</label><input type="text" id="jobTitle" value="${emp.jobTitle || ''}" class="mt-2 block w-full p-2 border border-slate-300 rounded-lg"></div>

                <div class="bg-white border rounded-xl p-4">
                    <label for="jobFamily" class="block text-xs font-semibold text-slate-500">خانواده شغلی</label>
                    <select id="jobFamily" class="mt-2 block w-full p-2 border border-slate-300 rounded-lg bg-white">
                        <option value="">انتخاب کنید...</option>
                        ${familyOptions}
                    </select>
                </div>
                
                <div class="bg-white border rounded-xl p-4">
                    <label for="level" class="block text-xs font-semibold text-slate-500">سطح</label>
                    <select id="level" class="mt-2 block w-full p-2 border border-slate-300 rounded-lg bg-white">
                        <option value="Junior" ${emp.level === 'Junior' ? 'selected' : ''}>Junior (کارشناس)</option>
                        <option value="Mid-level" ${emp.level === 'Mid-level' ? 'selected' : ''}>Mid-level (کارشناس ارشد)</option>
                        <option value="Senior" ${emp.level === 'Senior' ? 'selected' : ''}>Senior (خبره)</option>
                        <option value="Lead" ${emp.level === 'Lead' ? 'selected' : ''}>Lead (راهبر)</option>
                        <option value="Manager" ${emp.level === 'Manager' ? 'selected' : ''}>Manager (مدیر)</option>
                    </select>
                </div>
                
                <div class="bg-white border rounded-xl p-4">
                    <label for="department-team-select" class="block text-xs font-semibold text-slate-500">تیم عضویت</label>
                    <select id="department-team-select" class="mt-2 block w-full p-2 border border-slate-300 rounded-lg bg-white">
                        <option value="">عضو هیچ تیمی نیست</option>
                        ${teamOptions}
                    </select>
                </div>
                
                <div id="managed-team-container" class="hidden bg-white border rounded-xl p-4 border-indigo-200">
                    <label for="managed-team-select" class="block text-xs font-semibold text-indigo-700">تیم تحت مدیریت</label>
                    <select id="managed-team-select" class="block w-full p-2 border border-slate-300 rounded-lg bg-white mt-2">
                        <option value="">هیچکدام</option>
                        ${teamOptions}
                    </select>
                </div>
                
                <div class="bg-white border rounded-xl p-4">
                    <label for="status" class="block text-xs font-semibold text-slate-500">وضعیت</label>
                    <select id="status" class="mt-2 block w-full p-2 border border-slate-300 rounded-lg bg-white">
                        <option value="فعال" ${emp.status === 'فعال' ? 'selected' : ''}>فعال</option>
                        <option value="غیرفعال" ${emp.status === 'غیرفعال' ? 'selected' : ''}>غیرفعال</option>
                    </select>
                </div>

                <div class="md:col-span-2 bg-white border rounded-xl p-4">
                    <label for="startDate" class="block text-xs font-semibold text-slate-500">تاریخ استخدام</label>
                    <input type="text" id="startDate" class="mt-2 block w-full p-2 border border-slate-300 rounded-lg">
                </div>
            </div>
            <div class="pt-2 flex justify-end">
                <button type="submit" class="primary-btn">ذخیره</button>
            </div>
        </form>
    `;
    openModal(mainModal, mainModalContainer);
    activatePersianDatePicker('startDate', emp.startDate);

    const levelSelect = document.getElementById('level');
    const managedTeamContainer = document.getElementById('managed-team-container');
    const toggleManagedTeamVisibility = () => {
        const selectedLevel = levelSelect.value;
        if (selectedLevel === 'Manager' || selectedLevel === 'Lead') {
            managedTeamContainer.classList.remove('hidden');
        } else {
            managedTeamContainer.classList.add('hidden');
        }
    };
    levelSelect.addEventListener('change', toggleManagedTeamVisibility);
    toggleManagedTeamVisibility();

    document.getElementById('employee-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = e.target.querySelector('button[type="submit"]');
        saveBtn.disabled = true;
        saveBtn.innerText = 'در حال پردازش...';

        const name = document.getElementById('name').value;
        const employeeId = document.getElementById('id').value;
        const email = document.getElementById('employee-email').value;
        const selectedTeamId = document.getElementById('department-team-select').value;
        const selectedTeam = state.teams.find(t => t.firestoreId === selectedTeamId);
        const managedTeamId = document.getElementById('managed-team-select').value;

        const employeeCoreData = {
            name: name,
            id: employeeId,
            jobTitle: document.getElementById('jobTitle').value,
            jobFamily: document.getElementById('jobFamily').value,
            level: document.getElementById('level').value,
            department: selectedTeam ? selectedTeam.name : '',
            status: document.getElementById('status').value,
            startDate: persianToEnglishDate(document.getElementById('startDate').value),
        };
        
        if (isEditing) {
            try {
                const batch = writeBatch(db);
                const docRef = doc(db, `artifacts/${appId}/public/data/employees`, emp.firestoreId);
                batch.update(docRef, employeeCoreData);
                
                const oldManagedTeam = state.teams.find(t => t.leadership?.manager === emp.id);
                if (oldManagedTeam && oldManagedTeam.firestoreId !== managedTeamId) {
                    const oldTeamRef = doc(db, `artifacts/${appId}/public/data/teams`, oldManagedTeam.firestoreId);
                    batch.update(oldTeamRef, { 'leadership.manager': null });
                }

                if (managedTeamId) {
                    const newManagedTeamRef = doc(db, `artifacts/${appId}/public/data/teams`, managedTeamId);
                    batch.set(newManagedTeamRef, { leadership: { manager: employeeId } }, { merge: true });
                }
                
                await batch.commit();
                showToast("اطلاعات کارمند با موفقیت بروزرسانی شد.");
                closeModal(mainModal, mainModalContainer);
            } catch (error) { 
                console.error("Error updating employee:", error);
                showToast("خطا در بروزرسانی اطلاعات.", "error");
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerText = 'ذخیره';
            }
        } else {
            const employeeDataForCreation = { ...employeeCoreData, avatar: `https://placehold.co/100x100/E2E8F0/4A5568?text=${name.substring(0, 2)}`, personalInfo: { email: email } };
            try {
                const createNewEmployee = httpsCallable(functions, 'createNewEmployee');
                const result = await createNewEmployee({ 
                    name: name, 
                    employeeId: employeeId, 
                    email: email, 
                    employeeData: employeeDataForCreation,
                    teamId: selectedTeamId,
                    managedTeamId: managedTeamId
                });
                
                showToast("کارمند و حساب کاربری با موفقیت ایجاد شد!");
                closeModal(mainModal, mainModalContainer);
                renderPage('talent');
            } catch (error) { 
                console.error("Cloud function error:", error);
                showToast(`خطا: ${error.message}`, "error");
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerText = 'ذخیره';
            }
        }
    });
};
// فایل: js/main.js
// این تابع جدید را به فایل اضافه کنید ▼

const showSelfAssessmentForm = (evaluation) => {
    const employee = state.employees.find(e => e.id === evaluation.employeeId);
    if (!employee) {
        showToast('اطلاعات کارمند یافت نشد.', 'error');
        return;
    }

    modalTitle.innerText = `خودارزیابی دوره: ${evaluation.cycleId}`;
    
    // پیدا کردن شایستگی‌های مرتبط با پوزیشن و سطح کارمند
    const position = state.jobPositions.find(p => p.firestoreId === employee.jobPositionId);
    const employeeLevel = employee.level || 1; 
    const relevantCompetencyIds = new Set(position?.levels?.[`Level ${employeeLevel}`]?.competencyIds || position?.competencyIds || []);
    const competenciesForReview = state.competencies.filter(c => relevantCompetencyIds.has(c.firestoreId));

    const competenciesHtml = competenciesForReview.length > 0 ? competenciesForReview.map(comp => `
        <div class="mb-3 p-3 bg-slate-50 rounded-lg">
            <label class="block text-sm font-medium text-slate-700">${comp.name}</label>
            <p class="text-xs text-slate-500 mb-2">امتیاز شما به عملکرد خودتان در این شایستگی (۱ تا ۵):</p>
            <input type="number" class="competency-score w-full p-2 border rounded-md" data-name="${comp.name}" min="1" max="5" value="3" required>
        </div>
    `).join('') : '<p class="text-sm text-slate-500">شایستگی‌ای برای پوزیشن شما تعریف نشده است.</p>';

    modalContent.innerHTML = `
        <form id="self-assessment-form" class="space-y-4">
            <div>
                <h4 class="font-semibold text-lg mb-2">ارزیابی شایستگی‌ها</h4>
                <div class="max-h-60 overflow-y-auto pr-2">${competenciesHtml}</div>
            </div>
            <div>
                <label class="block text-sm font-medium">نقاط قوتی که از خود نشان دادید:</label>
                <textarea id="self-strengths" class="w-full p-2 border rounded-md mt-1" rows="3" required></textarea>
            </div>
            <div>
                <label class="block text-sm font-medium">مواردی که فکر می‌کنید نیاز به بهبود دارند:</label>
                <textarea id="self-areasForImprovement" class="w-full p-2 border rounded-md mt-1" rows="3" required></textarea>
            </div>
            <div class="flex justify-end pt-4 border-t">
                <button type="submit" class="primary-btn">ارسال نهایی خودارزیابی</button>
            </div>
        </form>
    `;
    openModal(mainModal, mainModalContainer);

    document.getElementById('self-assessment-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = e.target.querySelector('button[type="submit"]');
        saveBtn.disabled = true;
        saveBtn.innerText = 'در حال ارسال...';
        
        const competencyScores = {};
        document.querySelectorAll('.competency-score').forEach(input => {
            competencyScores[input.dataset.name] = parseInt(input.value);
        });

        const selfAssessmentData = {
            competencyScores,
            strengths: document.getElementById('self-strengths').value,
            areasForImprovement: document.getElementById('self-areasForImprovement').value
        };

        try {
            const submitFunction = httpsCallable(functions, 'submitSelfAssessment');
            await submitFunction({ evaluationId: evaluation.firestoreId, selfAssessmentData });
            showToast('خودارزیابی شما با موفقیت ثبت و برای مدیر ارسال شد.');
            closeModal(mainModal, mainModalContainer);
            // صفحه وظایف کارمند به طور خودکار توسط onSnapshot آپدیت خواهد شد
        } catch (error) {
            console.error("Error submitting self assessment:", error);
            showToast(`خطا: ${error.message}`, 'error');
            saveBtn.disabled = false;
            saveBtn.innerText = 'ارسال نهایی خودارزیابی';
        }
    });
};
            // فایل: js/main.js
// این دو تابع جدید را به انتهای بخش هلپرها اضافه کنید ▼

// فرم افزودن/ویرایش پوزیشن شغلی
const showJobPositionForm = (positionId = null) => {
    const isEditing = positionId !== null;
    const position = isEditing ? state.jobPositions.find(p => p.firestoreId === positionId) : {};
    modalTitle.innerText = isEditing ? 'ویرایش پوزیشن شغلی' : 'افزودن پوزیشن شغلی جدید';
    modalContent.innerHTML = `
        <form id="position-form">
            <label class="block font-medium">نام پوزیشن شغلی</label>
            <input id="position-name" class="w-full p-2 border rounded-md mt-1" value="${position.name || ''}" required>
            <div class="flex justify-end mt-4">
                <button type="submit" class="primary-btn">ذخیره</button>
            </div>
        </form>
    `;
    openModal(mainModal, mainModalContainer);
    document.getElementById('position-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('position-name').value.trim();
        if (!name) return;
        try {
            if (isEditing) {
                await updateDoc(doc(db, `artifacts/${appId}/public/data/jobPositions`, positionId), { name });
            } else {
                await addDoc(collection(db, `artifacts/${appId}/public/data/jobPositions`), { name, competencyIds: [] });
            }
            showToast('پوزیشن شغلی با موفقیت ذخیره شد.');
            closeModal(mainModal, mainModalContainer);
        } catch (error) { showToast('خطا در ذخیره‌سازی.', 'error'); }
    });
};

// مودال اتصال شایستگی‌ها به پوزیشن
const showCompetencyMappingModal = (position) => {
    modalTitle.innerText = `اتصال شایستگی به: ${position.name}`;
    const currentCompetencies = new Set(position.competencyIds || []);
    const checkboxesHtml = state.competencies.map(comp => `
        <label class="flex items-center gap-2 p-2 border rounded-lg hover:bg-slate-50">
            <input type="checkbox" class="competency-checkbox" value="${comp.firestoreId}" ${currentCompetencies.has(comp.firestoreId) ? 'checked' : ''}>
            <span>${comp.name}</span>
        </label>
    `).join('');

    modalContent.innerHTML = `
        <form id="mapping-form">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-2">${checkboxesHtml}</div>
            <div class="flex justify-end mt-4">
                <button type="submit" class="primary-btn">ذخیره تغییرات</button>
            </div>
        </form>
    `;
    openModal(mainModal, mainModalContainer);
    document.getElementById('mapping-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedIds = Array.from(document.querySelectorAll('.competency-checkbox:checked')).map(cb => cb.value);
        try {
            await updateDoc(doc(db, `artifacts/${appId}/public/data/jobPositions`, position.firestoreId), { competencyIds: selectedIds });
            showToast('شایستگی‌ها با موفقیت متصل شدند.');
            closeModal(mainModal, mainModalContainer);
        } catch (error) { showToast('خطا در ذخیره‌سازی.', 'error'); }
    });
};

        // --- ADMIN HELPERS ---
        // (rest of the code remains unchanged)
// این تابع جدید را به js/main.js اضافه کنید

const showAnnouncementForm = () => {
    modalTitle.innerText = 'ارسال پیام یا اعلان جدید';
    
    const teamOptions = state.teams.map(t => `<div class="flex items-center"><input type="checkbox" id="team-${t.firestoreId}" value="${t.firestoreId}" data-name="${t.name}" class="target-checkbox-teams"><label for="team-${t.firestoreId}" class="mr-2">${t.name}</label></div>`).join('');
    const userOptions = state.employees.map(e => `<div class="flex items-center"><input type="checkbox" id="user-${e.firestoreId}" value="${e.firestoreId}" data-name="${e.name}" class="target-checkbox-users"><label for="user-${e.firestoreId}" class="mr-2">${e.name}</label></div>`).join('');

    modalContent.innerHTML = `
        <form id="announcement-form" class="space-y-4">
            <div>
                <label class="block font-medium mb-1">عنوان پیام</label>
                <input type="text" id="announcement-title" class="w-full p-2 border rounded-md" required>
            </div>
            <div>
                <label class="block font-medium mb-1">متن پیام</label>
                <textarea id="announcement-content" rows="6" class="w-full p-2 border rounded-md" required></textarea>
            </div>
            <div>
                <label class="block font-medium mb-1">فایل ضمیمه (اختیاری)</label>
                <input type="file" id="announcement-attachment" class="w-full text-sm">
            </div>
            <div>
                <label class="block font-medium mb-1">گیرندگان</label>
                <select id="target-type" class="w-full p-2 border rounded-md bg-white">
                    <option value="public">عمومی (تمام کارمندان)</option>
                    <option value="teams">یک یا چند تیم خاص</option>
                    <option value="users">یک یا چند فرد خاص</option>
                    <option value="roles">یک نقش خاص (مثلاً همه مدیران)</option>
                </select>
            </div>
            <div id="target-details-container" class="hidden p-2 border rounded-md max-h-40 overflow-y-auto">
                <div id="target-teams-list" class="hidden grid grid-cols-2 gap-2">${teamOptions}</div>
                <div id="target-users-list" class="hidden grid grid-cols-2 gap-2">${userOptions}</div>
                <div id="target-roles-list" class="hidden space-y-1">
                    <div class="flex items-center"><input type="checkbox" id="role-admin" value="admin" class="target-checkbox-roles"><label for="role-admin" class="mr-2">همه مدیران (Admin)</label></div>
                    <div class="flex items-center"><input type="checkbox" id="role-employee" value="employee" class="target-checkbox-roles"><label for="role-employee" class="mr-2">همه کارمندان (Employee)</label></div>
                </div>
            </div>
            <div class="pt-4 flex justify-end">
                <button type="submit" id="submit-announcement-btn" class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">ارسال</button>
            </div>
        </form>
    `;
    openModal(mainModal, mainModalContainer);

    const targetTypeSelect = document.getElementById('target-type');
    const detailsContainer = document.getElementById('target-details-container');
    const targetLists = {
        teams: document.getElementById('target-teams-list'),
        users: document.getElementById('target-users-list'),
        roles: document.getElementById('target-roles-list'),
    };
    targetTypeSelect.addEventListener('change', (e) => {
        const selectedType = e.target.value;
        Object.values(targetLists).forEach(list => list.classList.add('hidden'));
        if (targetLists[selectedType]) {
            detailsContainer.classList.remove('hidden');
            targetLists[selectedType].classList.remove('hidden');
        } else {
            detailsContainer.classList.add('hidden');
        }
    });

    document.getElementById('announcement-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('submit-announcement-btn');
        saveBtn.disabled = true;
        saveBtn.innerText = 'در حال ارسال...';

        try {
            let attachmentUrl = '', attachmentFileName = '';
            const file = document.getElementById('announcement-attachment').files[0];
            if (file) {
                const filePath = `announcements/${Date.now()}_${file.name}`;
                const storageRef = ref(storage, filePath);
                const snapshot = await uploadBytes(storageRef, file);
                attachmentUrl = await getDownloadURL(snapshot.ref);
                attachmentFileName = file.name;
            }

            const targets = { type: document.getElementById('target-type').value };
            if (targets.type === 'teams') {
                targets.teamIds = Array.from(document.querySelectorAll('.target-checkbox-teams:checked')).map(cb => cb.value);
                targets.teamNames = Array.from(document.querySelectorAll('.target-checkbox-teams:checked')).map(cb => cb.dataset.name);
            } else if (targets.type === 'users') {
                targets.userIds = Array.from(document.querySelectorAll('.target-checkbox-users:checked')).map(cb => cb.value);
                targets.userNames = Array.from(document.querySelectorAll('.target-checkbox-users:checked')).map(cb => cb.dataset.name);
            } else if (targets.type === 'roles') {
                targets.roles = Array.from(document.querySelectorAll('.target-checkbox-roles:checked')).map(cb => cb.value);
            }

            const announcementData = {
                title: document.getElementById('announcement-title').value,
                content: document.getElementById('announcement-content').value,
                attachmentUrl,
                attachmentFileName,
                targets,
                senderUid: state.currentUser.uid,
                senderName: state.currentUser.name || state.currentUser.email,
                createdAt: serverTimestamp()
            };
            
            await addDoc(collection(db, `artifacts/${appId}/public/data/announcements`), announcementData);
            showToast("پیام با موفقیت ارسال شد.");
            closeModal(mainModal, mainModalContainer);

        } catch (error) {
            console.error("Error sending announcement:", error);
            showToast("خطا در ارسال پیام.", "error");
            saveBtn.disabled = false;
            saveBtn.innerText = 'ارسال';
        }
    });
};
        const showPettyCashManagementModal = () => {
    modalTitle.innerText = 'مدیریت کارت‌های تنخواه';

    const cardsHtml = state.pettyCashCards.map(card => `
        <div class="flex justify-between items-center p-3 bg-slate-100 rounded-lg">
            <div>
                <p class="font-bold text-blue-800">${card.name}</p>
                <p class="text-sm text-slate-600 font-mono">${(card.balance || 0).toLocaleString('fa-IR')} تومان</p>
            </div>
            <div class="flex items-center gap-2">
                <button class="charge-card-btn text-green-600 hover:text-green-800" data-id="${card.firestoreId}" data-name="${card.name}" title="شارژ کارت">
                    <i data-lucide="plus-circle" class="w-5 h-5"></i>
                </button>
                ${isAdmin() ? `<button class="delete-card-btn text-rose-500 hover:text-rose-700" data-id="${card.firestoreId}" title="حذف کارت">
                    <i data-lucide="trash-2" class="w-5 h-5"></i>
                </button>` : ''}
            </div>
        </div>
    `).join('');

    modalContent.innerHTML = `
        <div class="space-y-4">
            <div id="cards-list" class="space-y-3 max-h-80 overflow-y-auto pr-2">
                ${cardsHtml || '<p class="text-sm text-slate-500">کارتی ثبت نشده است.</p>'}
            </div>
            ${isAdmin() ? `
            <div class="border-t pt-4">
                 <button id="add-new-card-modal-btn" class="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 shadow-md">
                    افزودن کارت جدید
                 </button>
            </div>
            ` : ''}
        </div>
    `;
    openModal(mainModal, mainModalContainer);
    lucide.createIcons();
};
// این تابع جدید را به js/main.js اضافه کنید
const showMessageDetailsModal = (announcementId) => {
    const msg = state.announcements.find(a => a.firestoreId === announcementId);
    if (!msg) return;

    modalTitle.innerText = msg.title;
    modalContent.innerHTML = `
        <div class="space-y-4">
            <div class="flex justify-between items-center text-sm text-slate-500">
                <span><strong>فرستنده:</strong> ${msg.senderName}</span>
                <span><strong>تاریخ:</strong> ${toPersianDate(msg.createdAt)}</span>
            </div>
            <div class="p-4 border rounded-lg bg-slate-50">
                <p class="text-sm text-slate-700 whitespace-pre-wrap">${msg.content}</p>
            </div>
            ${msg.attachmentUrl ? `
                <div class="pt-4 border-t">
                    <a href="${msg.attachmentUrl}" target="_blank" class="primary-btn text-sm inline-flex items-center gap-2">
                        <i data-lucide="download" class="w-4 h-4"></i>
                        <span>دانلود فایل ضمیمه</span>
                    </a>
                </div>
            ` : ''}
        </div>
    `;
    openModal(mainModal, mainModalContainer);
    lucide.createIcons();

    // Mark as read for the current employee and update bell/list
    (async () => {
        try {
            if (state.currentUser?.role === 'employee') {
                const employee = state.employees.find(e => e.uid === state.currentUser.uid);
                if (employee) {
                    const empRef = doc(db, `artifacts/${appId}/public/data/employees`, employee.firestoreId);
                    await updateDoc(empRef, { readAnnouncements: arrayUnion(announcementId) });
                    updateEmployeeNotificationBell(employee);
                    const activeInbox = document.querySelector('#employee-portal-nav .nav-item[href="#inbox"].active');
                    if (activeInbox) {
                        renderEmployeePortalPage('inbox', employee);
                    }
                }
            }
        } catch (err) { console.error('Error marking announcement as read:', err); }
    })();
};
// مودال نمایش اعضای تیم برای دایرکتوری کارمندان
const showTeamDirectoryModal = (team) => {
    const leader = state.employees.find(e => e.id === team.leaderId);
    const members = (team.memberIds || []).map(id => state.employees.find(e => e.id === id)).filter(Boolean);

    const membersCards = members.map(member => {
        const compEntries = Object.entries(member.competencies || {});
        const competencies = compEntries.slice(0, 4).map(([name, level]) => `<span class="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 border">${name}</span>`).join(' ');
        return `
            <div class="flex items-center gap-3 p-3 border-b last:border-b-0">
                <img src="${member.avatar}" alt="${member.name}" class="w-12 h-12 rounded-full object-cover border">
                <div class="flex-1">
                    <div class="font-bold text-slate-800">${member.name}</div>
                    <div class="text-sm text-indigo-600">${member.jobTitle || 'بدون عنوان شغلی'}</div>
                    <div class="mt-2 flex flex-wrap gap-2">${competencies || '<span class="text-xs text-slate-400">مهارتی ثبت نشده</span>'}</div>
                </div>
            </div>`;
    }).join('');

    const okrHtml = (team.okrs || []).map(okr => `
        <div class="space-y-1">
            <div class="flex justify-between text-sm"><span class="font-medium text-slate-700">${okr.title}</span><span class="font-semibold text-indigo-600">${okr.progress}%</span></div>
            <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div class="h-2 bg-indigo-500" style="width:${okr.progress}%;"></div>
            </div>
        </div>`).join('') || '<p class="text-sm text-slate-500">OKR ثبت نشده است.</p>';

    modalTitle.innerText = `تیم ${team.name}`;
    modalContent.innerHTML = `
        <div class="bg-gradient-to-l from-[#F72585]/10 to-[#6B69D6]/10 rounded-xl p-4 mb-4">
            <div class="flex items-center gap-3">
                <img src="${team.avatar || ''}" alt="${team.name}" class="w-12 h-12 rounded-xl object-cover border" onerror="this.remove()">
                <div>
                    <div class="text-sm text-slate-600">پروفایل تیم</div>
                    <div class="text-lg font-bold text-slate-800">${team.name}</div>
                    ${team.missionLine ? `<div class=\"text-xs text-slate-600 mt-1\">${team.missionLine}</div>` : ''}
                </div>
            </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 bg-white border rounded-2xl p-4">
                <div class="flex items-center gap-3 mb-4">
                    <div class="text-sm text-slate-500">مدیر تیم: <span class="font-semibold text-slate-800">${leader?.name || 'نامشخص'}</span></div>
                </div>
                <div class="divide-y">${membersCards || '<p class="text-sm text-slate-500">عضوی ثبت نشده است.</p>'}</div>
            </div>
            <div class="bg-white border rounded-2xl p-4">
                <div class="font-semibold text-slate-800 mb-3">اهداف تیم (OKRs)</div>
                <div class="space-y-3">${okrHtml}</div>
            </div>
        </div>`;
    openModal(mainModal, mainModalContainer);
    lucide.createIcons();
};

        // --- EVENT LISTENERS & INITIALIZATION ---
// در فایل js/main.js

// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

// در فایل js/main.js
// کل این تابع را با نسخه جدید و کامل جایگزین کنید

const setupEventListeners = () => {
    // بخش ۱: مدیریت رویدادهای مودال‌ها (اصلاح شده و کامل)
    mainModal.addEventListener('click', (e) => {
        // اگر روی پس‌زمینه خاکستری یا دکمه بستن (×) کلیک شد، مودال را ببند
        if (e.target === mainModal || e.target.closest('#closeModal')) {
            closeModal(mainModal, mainModalContainer);
        }
    });
    document.getElementById('confirmCancel').addEventListener('click', () => closeModal(confirmModal, confirmModalContainer)); 
    document.getElementById('confirmAccept').addEventListener('click', () => { confirmCallback(); closeModal(confirmModal, confirmModalContainer); });

    // بخش ۲: منوی موبایل
    const menuBtn = document.getElementById('menu-btn'); 
    if (menuBtn) {
        const sidebar = document.getElementById('sidebar'); 
        const overlay = document.getElementById('sidebar-overlay'); 
        const toggleMenu = () => { 
            sidebar.classList.toggle('translate-x-full'); 
            overlay.classList.toggle('hidden'); 
        };
        menuBtn.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
    }

    // بخش ۳: ناوبری (منوی کناری ادمین)
// کد اصلاح شده برای main.js

const handleNavClick = (e) => {
    const link = e.target.closest('a');
    // اگر لینکی وجود نداشت یا لینک مربوط به دکمه خروج بود، ادامه نده
    if (!link || link.id === 'logout-btn') {
        return;
    }

    if (link.classList.contains('sidebar-item') || link.classList.contains('sidebar-logo')) {
        e.preventDefault();
        const pageName = link.getAttribute('href').substring(1);
        navigateTo(pageName);
        // بستن منوی موبایل بعد از کلیک
        if (window.innerWidth < 768) {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (sidebar) sidebar.classList.add('translate-x-full');
            if (overlay) overlay.classList.add('hidden');
        }
    }
};
    document.getElementById('sidebar')?.addEventListener('click', handleNavClick);
    document.querySelector('header .sidebar-logo')?.addEventListener('click', handleNavClick);

    // بخش ۴: نوتیفیکیشن (کدی که شما داشتید)
    const bellBtn = document.getElementById('notification-bell-btn');
    const dropdown = document.getElementById('notification-dropdown');
    if (bellBtn && dropdown) {
        bellBtn.addEventListener('click', () => {
            dropdown.classList.toggle('hidden');
        });
        // بستن منو با کلیک بیرون از آن
        document.addEventListener('click', (e) => {
            if (!bellBtn.parentElement.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });
        // مدیریت کلیک روی آیتم‌های نوتیفیکیشن
        dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.notification-item');
            if (item) {
                state.requestFilter = item.dataset.filter; // 'mine'
                navigateTo(item.getAttribute('href').substring(1));
                dropdown.classList.add('hidden');
            }
        });
    }

    // بخش ۵: روتر اصلی برنامه
    window.addEventListener('hashchange', router);
};
// فایل: js/main.js - اضافه کردن توابع جدید

// [!code start]
// فایل: js/main.js - این تابع جدید را اضافه کنید
const showEvaluationCycleForm = (cycleId = null) => {
    const isEditing = cycleId !== null;
    const cycle = isEditing ? state.evaluationCycles.find(c => c.firestoreId === cycleId) : {};
    modalTitle.innerText = isEditing ? 'ویرایش دوره ارزیابی' : 'ایجاد دوره ارزیابی جدید';
    modalContent.innerHTML = `
        <form id="cycle-form" class="space-y-4">
            <div>
                <label class="block font-medium">عنوان دوره</label>
                <input id="cycle-title" class="w-full p-2 border rounded-md mt-1" value="${cycle.title || ''}" placeholder="مثال: ارزیابی زمستان ۱۴۰۴" required>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block font-medium">تاریخ شروع</label>
                    <input id="cycle-start-date" class="w-full p-2 border rounded-md mt-1" required>
                </div>
                <div>
                    <label class="block font-medium">تاریخ پایان</label>
                    <input id="cycle-end-date" class="w-full p-2 border rounded-md mt-1" required>
                </div>
            </div>
            <div class="flex justify-end mt-4">
                <button type="submit" class="primary-btn">ذخیره</button>
            </div>
        </form>
    `;
    openModal(mainModal, mainModalContainer);
    activatePersianDatePicker('cycle-start-date', cycle.startDate);
    activatePersianDatePicker('cycle-end-date', cycle.endDate);

    document.getElementById('cycle-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('cycle-title').value.trim();
        const startDate = persianToEnglishDate(document.getElementById('cycle-start-date').value);
        const endDate = persianToEnglishDate(document.getElementById('cycle-end-date').value);
        if (!title || !startDate || !endDate) {
            showToast('لطفاً تمام فیلدها را پر کنید.', 'error');
            return;
        }
        const cycleData = { title, startDate, endDate, status: cycle.status || 'planning' };
        try {
            if (isEditing) {
                await updateDoc(doc(db, `artifacts/${appId}/public/data/evaluationCycles`, cycleId), cycleData);
            } else {
                await addDoc(collection(db, `artifacts/${appId}/public/data/evaluationCycles`), cycleData);
            }
            showToast('دوره ارزیابی با موفقیت ذخیره شد.');
            closeModal(mainModal, mainModalContainer);
        } catch (error) {
            showToast('خطا در ذخیره‌سازی دوره.', 'error');
        }
    });
};

// فایل: js/main.js
// ▼▼▼ این تابع را به طور کامل جایگزین کنید ▼▼▼

// فایل: js/main.js - این تابع جدید را اضافه کنید
const setupEvaluationPageListeners = () => {
    const mainContentArea = document.getElementById('main-content');
    mainContentArea.addEventListener('click', (e) => {
        const addBtn = e.target.closest('#add-cycle-btn');
        const editBtn = e.target.closest('.edit-cycle-btn');
        const deleteBtn = e.target.closest('.delete-cycle-btn');
        const startBtn = e.target.closest('.start-cycle-btn');

        if (addBtn) showEvaluationCycleForm();
        if (editBtn) showEvaluationCycleForm(editBtn.dataset.id);
        if (deleteBtn) { /* ... منطق حذف ... */ }
        if (startBtn) {
            const cycleId = startBtn.dataset.id;
            showConfirmationModal('شروع دوره ارزیابی', 'با شروع دوره، ارزیابی برای تمام کارمندان فعال ایجاد می‌شود. آیا ادامه می‌دهید؟', async () => {
                try {
                    const startCycleFunction = httpsCallable(functions, 'startEvaluationCycle');
                    const result = await startCycleFunction({ cycleId: cycleId });
                    showToast(result.data.message, "success");
                } catch (error) {
                    showToast(`خطا در فعال‌سازی دوره: ${error.message}`, "error");
                }
            });
        }
    });
};
// [!code end]
const setupDocumentsPageListeners = () => {
    const main = document.getElementById('main-content');
    if (!main) return;
    main.addEventListener('click', (e) => {
        const manageBtn = e.target.closest('.manage-docs-btn');
        if (manageBtn) {
            const key = manageBtn.dataset.categoryKey;
            showManageCategoryDocsModal(key);
            return;
        }
        const viewBtn = e.target.closest('.view-docs-btn');
        if (viewBtn) {
            const key = viewBtn.dataset.categoryKey;
            showViewCategoryDocsModal(key);
            return;
        }
        const deleteBtn = e.target.closest('.delete-document-btn');
        if (deleteBtn) {
            const docId = deleteBtn.dataset.id;
            showConfirmationModal('حذف سند', 'آیا از حذف این سند مطمئن هستید؟', async () => {
                try {
                    await deleteDoc(doc(db, `artifacts/${appId}/public/data/companyDocuments`, docId));
                    showToast("سند با موفقیت حذف شد.");
                } catch (error) { showToast("خطا در حذف سند.", "error"); }
            });
        }
    });
};
// Modal: Manage documents for a category (list existing + upload new with targeting)
function showManageCategoryDocsModal(categoryKey) {
    const mapKeyToTitle = {
        learning: 'آموزش و رشد', rules: 'قوانین و بازی', toolkit: 'کیت ابزار کاری',
        story: 'داستان ما', benefits: 'مزایا و حقوق', projects: 'مستندات پروژه‌ها'
    };
    const docs = (state.companyDocuments || []).filter(d => d.categoryKey === categoryKey);
    const rows = docs.map(d => `
        <tr class="border-b">
            <td class="p-2 text-sm">${d.title}</td>
            <td class="p-2 text-xs text-slate-500"><a href="${d.fileUrl}" target="_blank" class="text-indigo-600 hover:underline">دانلود</a></td>
            <td class="p-2 text-xs">${formatTargetsText(d.targets)}</td>
            <td class="p-2 text-left"><button class="delete-document-btn text-rose-500" data-id="${d.firestoreId}"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
        </tr>`).join('');

    modalTitle.innerText = `مدیریت: ${mapKeyToTitle[categoryKey] || ''}`;
    modalContent.innerHTML = `
        <div class="space-y-4">
            <div class="bg-slate-50 rounded-lg p-3">
                <form id="cat-doc-upload-form" class="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                    <div>
                        <label class="block text-xs mb-1">عنوان</label>
                        <input id="cat-doc-title" class="w-full p-2 border rounded-md" required>
                    </div>
                    <div>
                        <label class="block text-xs mb-1">فایل</label>
                        <input id="cat-doc-file" type="file" class="w-full" required>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-xs mb-1">گیرندگان</label>
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <select id="cat-doc-target-type" class="p-2 border rounded-md bg-white">
                                <option value="public">عمومی (همه)</option>
                                <option value="roles">نقش‌ها</option>
                                <option value="teams">تیم‌ها</option>
                                <option value="users">افراد</option>
                            </select>
                            <div id="cat-doc-target-details" class="md:col-span-3 hidden p-2 border rounded-md max-h-32 overflow-y-auto">
                                <div id="cat-doc-target-teams" class="hidden grid grid-cols-2 gap-2">${state.teams.map(t => `<div class='flex items-center'><input type='checkbox' value='${t.firestoreId}' data-name='${t.name}' class='cat-doc-target-checkbox-team' id='cat-doc-team-${t.firestoreId}'><label for='cat-doc-team-${t.firestoreId}' class='mr-2'>${t.name}</label></div>`).join('')}</div>
                                <div id="cat-doc-target-users" class="hidden grid grid-cols-2 gap-2">${state.employees.map(u => `<div class='flex items-center'><input type='checkbox' value='${u.firestoreId}' data-name='${u.name}' class='cat-doc-target-checkbox-user' id='cat-doc-user-${u.firestoreId}'><label for='cat-doc-user-${u.firestoreId}' class='mr-2'>${u.name}</label></div>`).join('')}</div>
                                <div id="cat-doc-target-roles" class="hidden space-y-1">
                                    <div class='flex items-center'><input type='checkbox' value='admin' class='cat-doc-target-checkbox-role' id='cat-doc-role-admin'><label for='cat-doc-role-admin' class='mr-2'>مدیران</label></div>
                                    <div class='flex items-center'><input type='checkbox' value='employee' class='cat-doc-target-checkbox-role' id='cat-doc-role-employee'><label for='cat-doc-role-employee' class='mr-2'>کارمندان</label></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="md:col-span-2 flex justify-end">
                        <button type="submit" class="primary-btn text-xs py-2 px-3">افزودن فایل</button>
                    </div>
                </form>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-slate-100 text-slate-600">
                        <tr><th class="p-2 text-right">عنوان</th><th class="p-2 text-right">فایل</th><th class="p-2 text-right">گیرندگان</th><th class="p-2 text-right"></th></tr>
                    </thead>
                    <tbody id="cat-docs-tbody">${rows || `<tr><td colspan='4' class='p-4 text-center text-slate-400'>فایلی ثبت نشده است.</td></tr>`}</tbody>
                </table>
            </div>
        </div>`;
    openModal(mainModal, mainModalContainer);

    const sel = document.getElementById('cat-doc-target-type');
    const details = document.getElementById('cat-doc-target-details');
    const lists = {
        teams: document.getElementById('cat-doc-target-teams'),
        users: document.getElementById('cat-doc-target-users'),
        roles: document.getElementById('cat-doc-target-roles')
    };
    sel.addEventListener('change', (e) => {
        const v = e.target.value; Object.values(lists).forEach(el => el.classList.add('hidden'));
        if (lists[v]) { details.classList.remove('hidden'); lists[v].classList.remove('hidden'); } else { details.classList.add('hidden'); }
    });

    document.getElementById('cat-doc-upload-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = document.getElementById('cat-doc-file').files[0];
        const title = document.getElementById('cat-doc-title').value.trim();
        if (!file || !title) return;
        try {
            const sRef = ref(storage, `companyDocs/${Date.now()}_${file.name}`);
            await uploadBytes(sRef, file);
            const url = await getDownloadURL(sRef);
            const targets = { type: sel.value };
            if (targets.type === 'teams') {
                targets.teamIds = Array.from(document.querySelectorAll('.cat-doc-target-checkbox-team:checked')).map(cb => cb.value);
                targets.teamNames = Array.from(document.querySelectorAll('.cat-doc-target-checkbox-team:checked')).map(cb => cb.dataset.name);
            } else if (targets.type === 'users') {
                targets.userIds = Array.from(document.querySelectorAll('.cat-doc-target-checkbox-user:checked')).map(cb => cb.value);
                targets.userNames = Array.from(document.querySelectorAll('.cat-doc-target-checkbox-user:checked')).map(cb => cb.dataset.name);
            } else if (targets.type === 'roles') {
                targets.roles = Array.from(document.querySelectorAll('.cat-doc-target-checkbox-role:checked')).map(cb => cb.value);
            }
            await addDoc(collection(db, `artifacts/${appId}/public/data/companyDocuments`), {
                title, categoryKey: categoryKey, fileUrl: url, uploadedAt: serverTimestamp(), targets
            });
            showToast('فایل افزوده شد.');
            closeModal(mainModal, mainModalContainer);
            renderPage('documents');
        } catch (err) { console.error(err); showToast('خطا در آپلود.', 'error'); }
    });
}

// Modal: View documents for category (read-only, filters by current user visibility)
function showViewCategoryDocsModal(categoryKey) {
    const employeeProfile = state.employees.find(e => e.uid === state.currentUser?.uid);
    const myTeam = employeeProfile ? state.teams.find(t => t.memberIds?.includes(employeeProfile.id)) : null;
    const myTeamId = myTeam ? myTeam.firestoreId : null;
    const visibleDocs = (state.companyDocuments || []).filter(d => d.categoryKey === categoryKey).filter(d => {
        const targets = d.targets || { type: 'public' };
        if (targets.type === 'public') return true;
        if (targets.type === 'roles') return employeeProfile ? targets.roles?.includes('employee') || (isAdmin() && targets.roles?.includes('admin')) : false;
        if (targets.type === 'teams') return myTeamId ? targets.teamIds?.includes(myTeamId) : false;
        if (targets.type === 'users') return employeeProfile ? targets.userIds?.includes(employeeProfile.firestoreId) : false;
        return false;
    });
    const rows = visibleDocs.map(d => `<tr class="border-b"><td class="p-2 text-sm">${d.title}</td><td class="p-2 text-left"><a href="${d.fileUrl}" target="_blank" class="text-indigo-600 hover:underline">دانلود</a></td></tr>`).join('');
    modalTitle.innerText = 'نمایش اسناد';
    modalContent.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-slate-100 text-slate-600"><tr><th class="p-2 text-right">عنوان</th><th class="p-2 text-right">فایل</th></tr></thead>
                <tbody>${rows || `<tr><td colspan='2' class='p-4 text-center text-slate-400'>موردی برای نمایش نیست.</td></tr>`}</tbody>
            </table>
        </div>`;
    openModal(mainModal, mainModalContainer);
}

function formatTargetsText(targets) {
    if (!targets || targets.type === 'public') return 'عمومی';
    if (targets.type === 'roles') return `نقش‌ها: ${(targets.roles || []).join('، ')}`;
    if (targets.type === 'teams') return `تیم‌ها: ${(targets.teamNames || targets.teamIds || []).join('، ')}`;
    if (targets.type === 'users') return `افراد: ${(targets.userNames || targets.userIds || []).join('، ')}`;
    return '';
}

    
// Minimal personal info editor (fallback)
if (typeof window.showEditPersonalInfoForm !== 'function') {
    window.showEditPersonalInfoForm = (emp) => {
        const info = emp.personalInfo || {};
        modalTitle.innerText = `ویرایش اطلاعات پرسنلی ${emp.name}`;
        modalContent.innerHTML = `
            <form id=\"edit-personal-form\" class=\"space-y-4\">
                <div class=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                    <div><label class=\"block text-sm\">نام و نام خانوادگی</label><input id=\"pi-fullname\" class=\"w-full p-2 border rounded-md\" value=\"${emp.name || ''}\"></div>
                    <div><label class=\"block text-sm\">جنسیت</label><select id=\"pi-gender\" class=\"w-full p-2 border rounded-md bg-white\"><option value=\"\" ${!(info.gender||emp.gender)?'selected':''}>انتخاب کنید</option><option value=\"male\" ${(info.gender||emp.gender)==='male'?'selected':''}>مرد</option><option value=\"female\" ${(info.gender||emp.gender)==='female'?'selected':''}>زن</option></select></div>
                    <div><label class=\"block text-sm\">تاریخ تولد</label><input id=\"pi-birth\" class=\"w-full p-2 border rounded-md\" value=\"${info.birthDate ? toPersianDate(info.birthDate) : ''}\" placeholder=\"YYYY/MM/DD\"></div>
                    <div><label class=\"block text-sm\">محل تولد</label><input id=\"pi-birth-place\" class=\"w-full p-2 border rounded-md\" value=\"${info.birthPlace || ''}\"></div>
                    <div><label class=\"block text-sm\">کد ملی</label><input id=\"pi-nid\" class=\"w-full p-2 border rounded-md\" value=\"${info.nationalId || ''}\"></div>
                    <div><label class=\"block text-sm\">وضعیت تأهل</label><select id=\"pi-marital\" class=\"w-full p-2 border rounded-md bg-white\"><option value=\"\" ${!info.maritalStatus?'selected':''}>انتخاب کنید</option><option value=\"مجرد\" ${info.maritalStatus==='مجرد'?'selected':''}>مجرد</option><option value=\"متاهل\" ${info.maritalStatus==='متاهل'?'selected':''}>متاهل</option></select></div>
                    <div><label class=\"block text-sm\">تعداد فرزندان</label><input id=\"pi-children\" type=\"number\" class=\"w-full p-2 border rounded-md\" value=\"${info.numChildren ?? ''}\" min=\"0\"></div>
                    <div id=\"pi-military-wrap\"><label class=\"block text-sm\">وضعیت خدمت سربازی</label><select id=\"pi-military\" class=\"w-full p-2 border rounded-md bg-white\"><option value=\"\" ${!info.militaryStatus?'selected':''}>انتخاب کنید</option><option value=\"معاف\" ${info.militaryStatus==='معاف'?'selected':''}>معاف</option><option value=\"پایان خدمت\" ${info.militaryStatus==='پایان خدمت'?'selected':''}>پایان خدمت</option><option value=\"مشمول\" ${info.militaryStatus==='مشمول'?'selected':''}>مشمول</option><option value=\"معافیت تحصیلی\" ${info.militaryStatus==='معافیت تحصیلی'?'selected':''}>معافیت تحصیلی</option></select></div>
                    <div><label class=\"block text-sm\">شماره تلفن همراه</label><input id=\"pi-phone\" class=\"w-full p-2 border rounded-md\" value=\"${info.phone || ''}\"></div>
                    <div><label class=\"block text-sm\">ایمیل</label><input id=\"pi-email\" class=\"w-full p-2 border rounded-md\" value=\"${info.email || ''}\"></div>
                    <div><label class=\"block text-sm\">شماره تلفن ثابت</label><input id=\"pi-land\" class=\"w-full p-2 border rounded-md\" value=\"${info.landline || ''}\"></div>
                    <div><label class=\"block text-sm\">شماره تلفن ضروری</label><input id=\"pi-emergency-phone\" class=\"w-full p-2 border rounded-md\" value=\"${info.emergencyPhone || ''}\"></div>
                    <div class=\"md:col-span-2\"><label class=\"block text-sm\">آدرس محل سکونت</label><input id=\"pi-address\" class=\"w-full p-2 border rounded-md\" value=\"${info.address || ''}\"></div>
                    <div><label class=\"block text-sm\">کد پستی</label><input id=\"pi-postal\" class=\"w-full p-2 border rounded-md\" value=\"${info.postalCode || ''}\"></div>
                    <div><label class=\"block text-sm\">مدرک تحصیلی</label><select id=\"pi-education\" class=\"w-full p-2 border rounded-md bg-white\"><option value=\"\" ${!info.education?'selected':''}>انتخاب کنید</option><option value=\"دیپلم\" ${info.education==='دیپلم'?'selected':''}>دیپلم</option><option value=\"کاردانی\" ${info.education==='کاردانی'?'selected':''}>کاردانی</option><option value=\"کارشناسی\" ${info.education==='کارشناسی'?'selected':''}>کارشناسی</option><option value=\"کارشناسی ارشد\" ${info.education==='کارشناسی ارشد'?'selected':''}>کارشناسی ارشد</option><option value=\"دکتری\" ${info.education==='دکتری'?'selected':''}>دکتری</option></select></div>
                    <div><label class=\"block text-sm\">رشته تحصیلی</label><input id=\"pi-field\" class=\"w-full p-2 border rounded-md\" value=\"${info.fieldOfStudy || ''}\"></div>
                    <div class=\"md:col-span-2\"><label class=\"block text-sm\">محل اخذ مدرک</label><input id=\"pi-institution\" class=\"w-full p-2 border rounded-md\" value=\"${info.educationInstitution || ''}\"></div>
                    <div class=\"md:col-span-2\"><label class=\"block text-sm\">شماره شبا</label><input id=\"pi-iban\" class=\"w-full p-2 border rounded-md\" value=\"${info.iban || ''}\"></div>
                    <div><label class=\"block text-sm\">شماره حساب</label><input id=\"pi-account\" class=\"w-full p-2 border rounded-md\" value=\"${info.accountNumber || ''}\"></div>
                    <div><label class=\"block text-sm\">شماره کارت</label><input id=\"pi-card\" class=\"w-full p-2 border rounded-md\" value=\"${info.cardNumber || ''}\"></div>
                    <div><label class=\"block text-sm\">نام بانک</label><input id=\"pi-bank\" class=\"w-full p-2 border rounded-md\" value=\"${info.bankName || ''}\"></div>
                </div>
                <div class=\"flex justify-end gap-2\">
                    <button type=\"button\" id=\"cancel-pi\" class=\"secondary-btn\">انصراف</button>
                    <button type=\"submit\" class=\"primary-btn\">ذخیره</button>
                </div>
            </form>`;
        openModal(mainModal, mainModalContainer);
        activatePersianDatePicker('pi-birth');
        // Show military status only for males
        try {
            const genderSel = document.getElementById('pi-gender');
            const milWrap = document.getElementById('pi-military-wrap');
            const updateMilitaryVis = () => {
                const g = genderSel.value;
                if (milWrap) milWrap.style.display = (g === 'male') ? 'block' : 'none';
            };
            genderSel.addEventListener('change', updateMilitaryVis);
            updateMilitaryVis();
        } catch {}
        document.getElementById('cancel-pi')?.addEventListener('click', () => viewEmployeeProfile(emp.firestoreId));
        document.getElementById('edit-personal-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const updated = {
                    ...info,
                    gender: document.getElementById('pi-gender').value.trim(),
                    birthDate: persianToEnglishDate(document.getElementById('pi-birth').value),
                    birthPlace: document.getElementById('pi-birth-place').value.trim(),
                    nationalId: document.getElementById('pi-nid').value.trim(),
                    maritalStatus: document.getElementById('pi-marital').value.trim(),
                    numChildren: parseInt(document.getElementById('pi-children').value) || 0,
                    militaryStatus: document.getElementById('pi-military').value.trim(),
                    phone: document.getElementById('pi-phone').value.trim(),
                    email: document.getElementById('pi-email').value.trim(),
                    landline: document.getElementById('pi-land').value.trim(),
                    emergencyPhone: document.getElementById('pi-emergency-phone').value.trim(),
                    address: document.getElementById('pi-address').value.trim(),
                    postalCode: document.getElementById('pi-postal').value.trim(),
                    education: document.getElementById('pi-education').value.trim(),
                    fieldOfStudy: document.getElementById('pi-field').value.trim(),
                    educationInstitution: document.getElementById('pi-institution').value.trim(),
                    iban: document.getElementById('pi-iban').value.trim(),
                    accountNumber: document.getElementById('pi-account').value.trim(),
                    cardNumber: document.getElementById('pi-card').value.trim(),
                    bankName: document.getElementById('pi-bank').value.trim()
                };
                const newName = document.getElementById('pi-fullname').value.trim();
                if (newName && newName !== emp.name) {
                    await updateDoc(doc(db, `artifacts/${appId}/public/data/employees`, emp.firestoreId), { name: newName });
                }
                await updateDoc(doc(db, `artifacts/${appId}/public/data/employees`, emp.firestoreId), { personalInfo: updated, gender: updated.gender });
                showToast('اطلاعات پرسنلی ذخیره شد.');
                viewEmployeeProfile(emp.firestoreId);
            } catch (error) {
                console.error('Error saving personal info', error);
                showToast('خطا در ذخیره اطلاعات.', 'error');
            }
        });
    };
}
        
        // --- EDIT FORM FUNCTIONS ---
// Team members editor
if (typeof window.showEditTeamMembersForm !== 'function') {
    window.showEditTeamMembersForm = (team) => {
        const allEmployees = state.employees;
        const selectedIds = new Set(team.memberIds || []);
        modalTitle.innerText = `ویرایش اعضای تیم ${team.name}`;
        const listHtml = allEmployees.map(emp => `
            <label class="flex items-center gap-2 p-2 border rounded-md">
                <input type="checkbox" class="emp-chk" value="${emp.id}" ${selectedIds.has(emp.id)?'checked':''}>
                <span class="text-sm">${emp.name} (${emp.id})</span>
            </label>`).join('');
        modalContent.innerHTML = `
            <form id="edit-team-members-form" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-2">${listHtml}</div>
                <div class="flex justify-end gap-2">
                    <button type="button" id="cancel-team-members" class="bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300">انصراف</button>
                    <button type="submit" class="primary-btn">ذخیره</button>
                </div>
            </form>`;
        openModal(mainModal, mainModalContainer);
        document.getElementById('cancel-team-members')?.addEventListener('click', () => viewTeamProfile(team.firestoreId));
        document.getElementById('edit-team-members-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const newMemberIds = Array.from(document.querySelectorAll('.emp-chk'))
                    .filter(chk => chk.checked)
                    .map(chk => chk.value);
                await updateDoc(doc(db, `artifacts/${appId}/public/data/teams`, team.firestoreId), { memberIds: newMemberIds });
                showToast('اعضای تیم به‌روزرسانی شد.');
                viewTeamProfile(team.firestoreId);
            } catch (error) {
                console.error('Error updating team members', error);
                showToast('خطا در ذخیره اعضای تیم.', 'error');
            }
        });
    };
}
// Team OKRs editor
if (typeof window.showEditTeamOkrsForm !== 'function') {
    window.showEditTeamOkrsForm = (team) => {
        modalTitle.innerText = `ویرایش اهداف تیم (${team.name})`;
        const okrsHtml = (team.okrs || []).map((okr) => `
            <div class="okr-item grid grid-cols-12 gap-2 items-center">
                <input type="text" value="${okr.title}" class="col-span-8 p-2 border rounded-md okr-title" placeholder="عنوان هدف">
                <input type="number" value="${okr.progress}" class="col-span-3 p-2 border rounded-md okr-progress" placeholder="پیشرفت %" min="0" max="100">
                <button type="button" class="col-span-1 remove-okr-btn text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>`).join('');
        modalContent.innerHTML = `
            <form id="edit-team-okrs-form">
                <div id="team-okrs-container" class="space-y-2">${okrsHtml}</div>
                <button type="button" id="add-team-okr-btn" class="mt-4 text-sm bg-gray-200 py-2 px-4 rounded-md hover:bg-gray-300">افزودن هدف جدید</button>
                <div class="pt-6 flex justify-end gap-4">
                    <button type="button" id="back-to-team-profile-okr" class="bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600">بازگشت</button>
                    <button type="submit" class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">ذخیره</button>
                </div>
            </form>`;
        openModal(mainModal, mainModalContainer);
        lucide.createIcons();
        document.getElementById('back-to-team-profile-okr').addEventListener('click', () => viewTeamProfile(team.firestoreId));
        const okrsContainer = document.getElementById('team-okrs-container');
        document.getElementById('add-team-okr-btn').addEventListener('click', () => {
            const newItem = document.createElement('div');
            newItem.className = 'okr-item grid grid-cols-12 gap-2 items-center';
            newItem.innerHTML = `<input type=\"text\" class=\"col-span-8 p-2 border rounded-md okr-title\" placeholder=\"عنوان هدف\"><input type=\"number\" class=\"col-span-3 p-2 border rounded-md okr-progress\" placeholder=\"پیشرفت %\" min=\"0\" max=\"100\" value=\"0\"><button type=\"button\" class=\"col-span-1 remove-okr-btn text-red-500 hover:text-red-700\"><i data-lucide=\"trash-2\" class=\"w-5 h-5\"></i></button>`;
            okrsContainer.appendChild(newItem);
            lucide.createIcons();
        });
        okrsContainer.addEventListener('click', (e) => {
            if (e.target.closest('.remove-okr-btn')) {
                e.target.closest('.okr-item').remove();
            }
        });
        document.getElementById('edit-team-okrs-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const newOkrs = [];
                document.querySelectorAll('#team-okrs-container .okr-item').forEach(item => {
                    const title = item.querySelector('.okr-title').value;
                    const progress = parseInt(item.querySelector('.okr-progress').value) || 0;
                    if (title) newOkrs.push({ title, progress });
                });
                await updateDoc(doc(db, `artifacts/${appId}/public/data/teams`, team.firestoreId), { okrs: newOkrs });
                showToast('اهداف تیم به‌روزرسانی شد.');
                viewTeamProfile(team.firestoreId);
            } catch (error) {
                console.error('Error saving team OKRs', error);
                showToast('خطا در ذخیره اهداف.', 'error');
            }
        });
    };
}
const showAddUserForm = () => {
    modalTitle.innerText = 'افزودن کاربر جدید';
    modalContent.innerHTML = `
        <form id="add-user-form" class="space-y-4">
            <div>
                <label for="new-user-name" class="block text-sm font-medium text-gray-700">نام کامل</label>
                <input id="new-user-name" type="text" required class="w-full px-3 py-2 mt-1 border rounded-md">
            </div>
            <div>
                <label for="new-user-email" class="block text-sm font-medium text-gray-700">آدرس ایمیل</label>
                <input id="new-user-email" type="email" required class="w-full px-3 py-2 mt-1 border rounded-md">
            </div>
            <div>
                <label for="new-user-password" class="block text-sm font-medium text-gray-700">رمز عبور موقت</label>
                <input id="new-user-password" type="password" required class="w-full px-3 py-2 mt-1 border rounded-md">
            </div>
            <div>
                <label for="new-user-role" class="block text-sm font-medium text-gray-700">سطح دسترسی</label>
                // ...
<select id="new-user-role" class="w-full p-2 mt-1 border rounded-md">
    <option value="viewer">مشاهده‌گر (Viewer)</option>
    <option value="editor">ویرایشگر (Editor)</option>
    <option value="admin">مدیر (Admin)</option>
    <option value="employee">کارمند (Employee)</option> </select>
// ...
            </div>
            <div class="pt-4 flex justify-end">
                <button type="submit" class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">افزودن کاربر</button>
            </div>
        </form>
    `;
    openModal(mainModal, mainModalContainer);

    document.getElementById('add-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('new-user-name').value;
        const email = document.getElementById('new-user-email').value;
        const password = document.getElementById('new-user-password').value;
        const role = document.getElementById('new-user-role').value;
        
        showToast("در حال ایجاد کاربر... این کار ممکن است باعث خروج شما از سیستم شود.", "success");
        
        try {
            // This is a simplified approach. In a real app, you'd use Firebase Functions to create users without logging out the admin.
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;

            const userRef = doc(db, `artifacts/${appId}/public/data/users`, newUser.uid);
            await setDoc(userRef, {
                name: name, //  ذخیره نام کاربر
                email: newUser.email,
                role: role,
                createdAt: serverTimestamp()
            });
            
            closeModal(mainModal, mainModalContainer);
            showToast("کاربر جدید ایجاد شد. لطفا با حساب ادمین مجددا وارد شوید.");
            
            await signOut(auth);

        } catch (error) {
            console.error("Error creating new user:", error);
            showToast(`خطا در ایجاد کاربر: ${error.message}`, "error");
        }
    });
};
        const showEditOkrsForm = (emp) => {
            modalTitle.innerText = `ویرایش OKR برای ${emp.name}`;
            const okrsHtml = (emp.okrs || []).map((okr) => `<div class="okr-item grid grid-cols-12 gap-2 items-center"><input type="text" value="${okr.title}" class="col-span-8 p-2 border rounded-md okr-title" placeholder="عنوان هدف"><input type="number" value="${okr.progress}" class="col-span-3 p-2 border rounded-md okr-progress" placeholder="پیشرفت %" min="0" max="100"><button type="button" class="col-span-1 remove-okr-btn text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-5 h-5"></i></button></div>`).join('');
            modalContent.innerHTML = `<form id="edit-okrs-form"><div id="okrs-container" class="space-y-2">${okrsHtml}</div><button type="button" id="add-okr-btn" class="mt-4 text-sm bg-gray-200 py-2 px-4 rounded-md hover:bg-gray-300">افزودن هدف جدید</button><div class="pt-6 flex justify-end gap-4"><button type="button" id="back-to-profile-okr" class="bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600">بازگشت</button><button type="submit" class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">ذخیره</button></div></form>`;
            lucide.createIcons();
            document.getElementById('back-to-profile-okr').addEventListener('click', () => viewEmployeeProfile(emp.firestoreId));
            const okrsContainer = document.getElementById('okrs-container');
            document.getElementById('add-okr-btn').addEventListener('click', () => { const newItem = document.createElement('div'); newItem.className = 'okr-item grid grid-cols-12 gap-2 items-center'; newItem.innerHTML = `<input type="text" class="col-span-8 p-2 border rounded-md okr-title" placeholder="عنوان هدف"><input type="number" class="col-span-3 p-2 border rounded-md okr-progress" placeholder="پیشرفت %" min="0" max="100" value="0"><button type="button" class="col-span-1 remove-okr-btn text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-5 h-5"></i></button>`; okrsContainer.appendChild(newItem); lucide.createIcons(); });
            okrsContainer.addEventListener('click', (e) => { if(e.target.closest('.remove-okr-btn')) { e.target.closest('.okr-item').remove(); } });
            document.getElementById('edit-okrs-form').addEventListener('submit', async (e) => { e.preventDefault(); const newOkrs = []; document.querySelectorAll('.okr-item').forEach(item => { const title = item.querySelector('.okr-title').value; const progress = parseInt(item.querySelector('.okr-progress').value) || 0; if (title) { newOkrs.push({ title, progress }); } }); try { const docRef = doc(db, `artifacts/${appId}/public/data/employees`, emp.firestoreId); await updateDoc(docRef, { okrs: newOkrs }); showToast("اهداف با موفقیت به‌روزرسانی شدند."); viewEmployeeProfile(emp.firestoreId); } catch (error) { console.error("Error updating OKRs:", error); showToast("خطا در به‌روزرسانی اهداف.", "error"); } });
        };

        const showEditSkillsForm = (emp) => {
            modalTitle.innerText = `ویرایش مهارت‌ها برای ${emp.name}`;
            const skillsHtml = Object.entries(emp.skills || {}).map(([skill, level]) => `<div class="skill-item grid grid-cols-12 gap-2 items-center"><input type="text" value="${skill}" class="col-span-8 p-2 border rounded-md skill-name" placeholder="نام مهارت"><input type="number" value="${level}" class="col-span-3 p-2 border rounded-md skill-level" placeholder="سطح (۱-۵)" min="1" max="5"><button type="button" class="col-span-1 remove-skill-btn text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-5 h-5"></i></button></div>`).join('');
            modalContent.innerHTML = `<form id="edit-skills-form"><div id="skills-container" class="space-y-2">${skillsHtml}</div><button type="button" id="add-skill-btn" class="mt-4 text-sm bg-gray-200 py-2 px-4 rounded-md hover:bg-gray-300">افزودن مهارت جدید</button><div class="pt-6 flex justify-end gap-4"><button type="button" id="back-to-profile-skill" class="bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600">بازگشت</button><button type="submit" class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">ذخیره</button></div></form>`;
            lucide.createIcons();
            document.getElementById('back-to-profile-skill').addEventListener('click', () => viewEmployeeProfile(emp.firestoreId));
            const skillsContainer = document.getElementById('skills-container');
            document.getElementById('add-skill-btn').addEventListener('click', () => { const newItem = document.createElement('div'); newItem.className = 'skill-item grid grid-cols-12 gap-2 items-center'; newItem.innerHTML = `<input type="text" class="col-span-8 p-2 border rounded-md skill-name" placeholder="نام مهارت"><input type="number" class="col-span-3 p-2 border rounded-md skill-level" placeholder="سطح (۱-۵)" min="1" max="5" value="1"><button type="button" class="col-span-1 remove-skill-btn text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-5 h-5"></i></button>`; skillsContainer.appendChild(newItem); lucide.createIcons(); });
            skillsContainer.addEventListener('click', (e) => { if(e.target.closest('.remove-skill-btn')) { e.target.closest('.skill-item').remove(); } });
            document.getElementById('edit-skills-form').addEventListener('submit', async (e) => { e.preventDefault(); const newSkills = {}; document.querySelectorAll('.skill-item').forEach(item => { const name = item.querySelector('.skill-name').value; const level = parseInt(item.querySelector('.skill-level').value) || 0; if (name) { newSkills[name] = level; } }); try { const docRef = doc(db, `artifacts/${appId}/public/data/employees`, emp.firestoreId); await updateDoc(docRef, { skills: newSkills }); showToast("مهارت‌ها با موفقیت به‌روزرسانی شدند."); viewEmployeeProfile(emp.firestoreId); } catch (error) { console.error("Error updating skills:", error); showToast("خطا در به‌روزرسانی مهارت‌ها.", "error"); } });
        };

        const showEditCompetenciesForm = (emp) => {
            modalTitle.innerText = `ویرایش شایستگی‌ها برای ${emp.name}`;
            const empCompetencies = emp.competencies || {};
            const competenciesHtml = state.competencies.map(comp => `
                <div class="competency-item grid grid-cols-12 gap-2 items-center">
                    <label class="col-span-8">${comp.name}</label>
                    <input type="number" value="${empCompetencies[comp.name] || 0}" data-name="${comp.name}" class="col-span-3 p-2 border rounded-md competency-level" placeholder="سطح (۱-۵)" min="0" max="5">
                </div>
            `).join('');
            modalContent.innerHTML = `
                <form id="edit-competencies-form">
                    <div id="competencies-container" class="space-y-2">${competenciesHtml || '<p>ابتدا شایستگی‌ها را در بخش تنظیمات تعریف کنید.</p>'}</div>
                    <div class="pt-6 flex justify-end gap-4">
                        <button type="button" id="back-to-profile-comp" class="bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600">بازگشت</button>
                        <button type="submit" class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">ذخیره</button>
                    </div>
                </form>
            `;
            document.getElementById('back-to-profile-comp').addEventListener('click', () => viewEmployeeProfile(emp.firestoreId));
            document.getElementById('edit-competencies-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const newCompetencies = {};
                document.querySelectorAll('.competency-item').forEach(item => {
                    const name = item.querySelector('.competency-level').dataset.name;
                    const level = parseInt(item.querySelector('.competency-level').value) || 0;
                    if (name && level > 0) {
                        newCompetencies[name] = level;
                    }
                });
                try {
                    const docRef = doc(db, `artifacts/${appId}/public/data/employees`, emp.firestoreId);
                    await updateDoc(docRef, { competencies: newCompetencies });
                    showToast("شایستگی‌ها با موفقیت به‌روزرسانی شدند.");
                    viewEmployeeProfile(emp.firestoreId);
                } catch (error) {
                    console.error("Error updating competencies:", error);
                    showToast("خطا در به‌روزرسانی شایستگی‌ها.", "error");
                }
            });
        };
// فایل: js/main.js
// تابع showEditTeamOkrsForm را به طور کامل با این نسخه جایگزین کنید ▼

const showEditTeamOkrsForm = (team) => {
    modalTitle.innerText = `ویرایش OKR برای تیم ${team.name}`;
    
    // تابع کمکی برای ساخت HTML یک نتیجه کلیدی (KR)
    const createKrHtml = (kr = { title: '', progress: 0 }) => `
        <div class="key-result-item flex items-center gap-2 mt-2">
            <input type="text" class="kr-title flex-grow p-2 border rounded-md text-sm" placeholder="نتیجه کلیدی (مثال: افزایش نرخ تبدیل به ۲۰٪)" value="${kr.title}">
            <input type="number" class="kr-progress w-24 p-2 border rounded-md text-sm" placeholder="پیشرفت %" min="0" max="100" value="${kr.progress}">
            <button type="button" class="remove-kr-btn text-rose-500 p-1 rounded-full hover:bg-rose-50"><i data-lucide="minus-circle" class="w-5 h-5"></i></button>
        </div>
    `;

    // تابع کمکی برای ساخت HTML یک هدف کامل (Objective + KRs)
    const createObjectiveHtml = (obj = { title: '', keyResults: [{ title: '', progress: 0 }] }) => `
        <div class="objective-item bg-slate-50 border rounded-xl p-4 mb-4">
            <div class="flex items-center justify-between">
                <input type="text" class="objective-title w-full p-2 border rounded-md font-semibold" placeholder="هدف اصلی (مثال: بهبود تجربه کاربری در اپلیکیشن)" value="${obj.title}">
                <button type="button" class="remove-objective-btn text-rose-500 p-2 ml-2"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>
            <div class="key-results-container mt-3 border-t pt-3">
                ${(obj.keyResults || []).map(createKrHtml).join('')}
            </div>
            <button type="button" class="add-kr-btn text-xs font-semibold text-indigo-600 mt-3 hover:underline">+ افزودن نتیجه کلیدی</button>
        </div>
    `;

    const okrsHtml = (team.okrs && team.okrs.length > 0) ? team.okrs.map(createObjectiveHtml).join('') : createObjectiveHtml();
    
    modalContent.innerHTML = `
        <form id="edit-team-okrs-form">
            <div id="okrs-container" class="space-y-2 max-h-[60vh] overflow-y-auto pr-2">${okrsHtml}</div>
            <button type="button" id="add-objective-btn" class="mt-4 text-sm bg-gray-200 py-2 px-4 rounded-md hover:bg-gray-300">افزودن هدف اصلی جدید</button>
            <div class="pt-6 flex justify-end gap-4">
                <button type="button" id="back-to-team-profile-okr" class="secondary-btn">بازگشت</button>
                <button type="submit" class="primary-btn">ذخیره OKR ها</button>
            </div>
        </form>
    `;
    lucide.createIcons();

    const okrsContainer = document.getElementById('okrs-container');

    // مدیریت رویدادها (Event Delegation)
    okrsContainer.addEventListener('click', (e) => {
        if (e.target.closest('.add-kr-btn')) {
            const krContainer = e.target.closest('.objective-item').querySelector('.key-results-container');
            krContainer.insertAdjacentHTML('beforeend', createKrHtml());
            lucide.createIcons();
        }
        if (e.target.closest('.remove-kr-btn')) {
            e.target.closest('.key-result-item').remove();
        }
        if (e.target.closest('.remove-objective-btn')) {
            e.target.closest('.objective-item').remove();
        }
    });

    document.getElementById('add-objective-btn').addEventListener('click', () => {
        okrsContainer.insertAdjacentHTML('beforeend', createObjectiveHtml());
        lucide.createIcons();
    });

    document.getElementById('back-to-team-profile-okr').addEventListener('click', () => viewTeamProfile(team.firestoreId));
    
    document.getElementById('edit-team-okrs-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newOkrs = [];
        document.querySelectorAll('.objective-item').forEach(objItem => {
            const objectiveTitle = objItem.querySelector('.objective-title').value.trim();
            if (!objectiveTitle) return;

            const keyResults = [];
            let totalProgress = 0;
            const krItems = objItem.querySelectorAll('.key-result-item');
            
            krItems.forEach(krItem => {
                const krTitle = krItem.querySelector('.kr-title').value.trim();
                const krProgress = parseInt(krItem.querySelector('.kr-progress').value) || 0;
                if (krTitle) {
                    keyResults.push({ title: krTitle, progress: krProgress });
                    totalProgress += krProgress;
                }
            });

            // محاسبه خودکار پیشرفت هدف بر اساس میانگین نتایج کلیدی
            const objectiveProgress = keyResults.length > 0 ? Math.round(totalProgress / keyResults.length) : 0;
            
            newOkrs.push({
                title: objectiveTitle,
                progress: objectiveProgress,
                keyResults: keyResults
            });
        });

        try {
            const docRef = doc(db, `artifacts/${appId}/public/data/teams`, team.firestoreId);
            await updateDoc(docRef, { okrs: newOkrs });
            showToast("اهداف تیم با موفقیت به‌روزرسانی شدند.");
            viewTeamProfile(team.firestoreId);
        } catch (error) {
            console.error("Error saving team OKRs:", error);
            showToast("خطا در به‌روزرسانی اهداف تیم.", "error");
        }
    });
};

        // --- [FIX START] ADDED TEAM HEALTH FORM ---
        const showTeamHealthForm = (team) => {
            modalTitle.innerText = `ویرایش معیارهای سلامت تیم ${team.name}`;
            const metrics = team.healthMetrics || { 'مشارکت': 75, 'رضایت': 80, 'شفافیت': 70, 'کارایی': 85 };
            const metricsHtml = Object.entries(metrics).map(([name, score]) => `
                <div class="health-metric-item grid grid-cols-12 gap-2 items-center">
                    <input type="text" value="${name}" class="col-span-8 p-2 border rounded-md health-metric-name" placeholder="نام معیار">
                    <input type="number" value="${score}" class="col-span-3 p-2 border rounded-md health-metric-score" placeholder="امتیاز %" min="0" max="100">
                    <button type="button" class="col-span-1 remove-health-metric-btn text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                </div>
            `).join('');

            modalContent.innerHTML = `
                <form id="edit-team-health-form">
                    <div id="health-metrics-container" class="space-y-2">${metricsHtml}</div>
                    <button type="button" id="add-health-metric-btn" class="mt-4 text-sm bg-gray-200 py-2 px-4 rounded-md hover:bg-gray-300">افزودن معیار جدید</button>
                    <div class="pt-6 flex justify-end gap-4">
                        <button type="button" id="back-to-team-profile-health" class="bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600">بازگشت</button>
                        <button type="submit" class="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700">ذخیره</button>
                    </div>
                </form>
            `;
            lucide.createIcons();
            document.getElementById('back-to-team-profile-health').addEventListener('click', () => viewTeamProfile(team.firestoreId));
            
            const metricsContainer = document.getElementById('health-metrics-container');
            document.getElementById('add-health-metric-btn').addEventListener('click', () => {
                const newItem = document.createElement('div');
                newItem.className = 'health-metric-item grid grid-cols-12 gap-2 items-center';
                newItem.innerHTML = `
                    <input type="text" class="col-span-8 p-2 border rounded-md health-metric-name" placeholder="نام معیار">
                    <input type="number" class="col-span-3 p-2 border rounded-md health-metric-score" placeholder="امتیاز %" min="0" max="100" value="50">
                    <button type="button" class="col-span-1 remove-health-metric-btn text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                `;
                metricsContainer.appendChild(newItem);
                lucide.createIcons();
            });

            metricsContainer.addEventListener('click', (e) => {
                if (e.target.closest('.remove-health-metric-btn')) {
                    e.target.closest('.health-metric-item').remove();
                }
            });

            document.getElementById('edit-team-health-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const newMetrics = {};
                document.querySelectorAll('.health-metric-item').forEach(item => {
                    const name = item.querySelector('.health-metric-name').value;
                    const score = parseInt(item.querySelector('.health-metric-score').value) || 0;
                    if (name) {
                        newMetrics[name] = score;
                    }
                });
                try {
                    const docRef = doc(db, `artifacts/${appId}/public/data/teams`, team.firestoreId);
                    await updateDoc(docRef, { healthMetrics: newMetrics });
                    showToast("معیارهای سلامت تیم به‌روزرسانی شدند.");
                    viewTeamProfile(team.firestoreId);
                } catch (error) {
                    console.error("Error updating team health metrics:", error);
                    showToast("خطا در به‌روزرسانی معیارها.", "error");
                }
            });
        };
        // --- [FIX END] ---
const showDocumentForm = (emp, docIndex = null) => {
    // fallback minimal handler: open details modal for processing
    const employee = state.employees.find(e => e.uid === state.currentUser?.uid);
    if (employee) {
        showRequestDetailsModal(docIndex, employee);
    } else {
        showToast('برای پردازش، کاربر معتبر یافت نشد.', 'error');
    }
};

const renderSurveyTakerPage = (surveyId) => {
    document.getElementById('dashboard-container').classList.add('hidden');
    const surveyTakerContainer = document.getElementById('survey-taker-container');
    surveyTakerContainer.classList.remove('hidden');
    const survey = surveyTemplates[surveyId];
    if (!survey) {
        surveyTakerContainer.innerHTML = `<p>نظرسنجی یافت نشد.</p>`;
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const targetEmployeeId = urlParams.get('target');
    const targetEmployee = targetEmployeeId ? state.employees.find(e => e.id === targetEmployeeId) : null;
    
    let title = survey.title;
    if (targetEmployee) {
        title += ` در مورد: ${targetEmployee.name}`;
    }

    const questionsHtml = survey.questions.map(q => {
        let inputHtml = '';
        switch (q.type) {
            case 'rating_1_5':
                inputHtml = `<div class="flex justify-center gap-2 flex-wrap">${[1, 2, 3, 4, 5].map(n => `<label class="cursor-pointer"><input type="radio" name="${q.id}" value="${n}" class="sr-only peer" required><div class="w-10 h-10 rounded-full flex items-center justify-center border-2 border-gray-300 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600">${n}</div></label>`).join('')}</div>`;
                break;
            case 'yes_no':
                inputHtml = `<div class="flex justify-center gap-4"><label class="cursor-pointer"><input type="radio" name="${q.id}" value="yes" class="sr-only peer" required><div class="px-6 py-2 rounded-md border-2 border-gray-300 peer-checked:bg-green-600 peer-checked:text-white peer-checked:border-green-600">بله</div></label><label class="cursor-pointer"><input type="radio" name="${q.id}" value="no" class="sr-only peer" required><div class="px-6 py-2 rounded-md border-2 border-gray-300 peer-checked:bg-red-600 peer-checked:text-white peer-checked:border-red-600">خیر</div></label></div>`;
                break;
            case 'choice':
                inputHtml = `<div class="flex justify-center gap-4 flex-wrap">${(q.options || []).map(opt => `<label class="cursor-pointer"><input type="radio" name="${q.id}" value="${opt}" class="sr-only peer" required><div class="px-6 py-2 rounded-md border-2 border-gray-300 peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600">${opt}</div></label>`).join('')}</div>`;
                break;
            case 'open_text':
                inputHtml = `<textarea name="${q.id}" rows="4" class="w-full p-2 border rounded-md" required></textarea>`;
                break;
        }
        return `<div class="bg-white p-6 rounded-lg shadow-md"><p class="font-semibold mb-4 text-center">${q.text}</p>${inputHtml}</div>`;
    }).join('');
    surveyTakerContainer.innerHTML = `
        <div class="min-h-screen bg-gray-100 p-4 sm:p-8 flex items-center justify-center">
            <div class="w-full max-w-2xl space-y-6">
                 <div class="text-center">
                    <i data-lucide="shield-check" class="mx-auto w-12 h-12 text-blue-800"></i>
                    <h1 class="text-2xl font-bold mt-2">${title}</h1>
                    <p class="text-gray-600 mt-1">${survey.description}</p>
                </div>
                <form id="survey-form" class="space-y-6">
                    ${questionsHtml}
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <label for="employeeId" class="block text-sm font-medium text-gray-700 mb-2">کد پرسنلی (اختیاری)</label>
                        <p class="text-xs text-gray-500 mb-2">برای ثبت پاسخ به صورت ناشناس، این فیلد را خالی بگذارید.</p>
                        <input type="text" name="employeeId" class="w-full p-2 border rounded-md">
                    </div>
                    <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700">ارسال پاسخ‌ها</button>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
    
    document.getElementById('survey-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const answers = {};
        survey.questions.forEach(q => {
            answers[q.id] = formData.get(q.id);
        });
        const employeeId = formData.get('employeeId').trim() || 'anonymous';
        
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/surveyResponses`), {
                surveyId,
                employeeId,
                targetEmployeeId,
                answers,
                submittedAt: serverTimestamp()
            });
            surveyTakerContainer.innerHTML = `<div class="min-h-screen flex items-center justify-center text-center"><div class="bg-white p-10 rounded-lg shadow-xl"><i data-lucide="check-circle" class="mx-auto w-16 h-16 text-green-500"></i><h2 class="mt-4 text-2xl font-bold">از شما متشکریم!</h2><p class="mt-2 text-gray-600">پاسخ‌های شما با موفقیت ثبت شد.</p></div></div>`;
            lucide.createIcons();
        } catch (error) {
            console.error("Error submitting survey:", error);
            showToast("خطا در ارسال نظرسنجی.", "error");
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    initializeFirebase();
    setupEventListeners();
    lucide.createIcons();
});
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker registered: ', registration);
            })
            .catch(registrationError => {
                console.log('Service Worker registration failed: ', registrationError);
            });
    });
}
