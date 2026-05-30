import { useState, useEffect, useRef } from 'react';

// Types
interface Task { _id?: string; title: string; isCompleted: boolean; }
interface Checklist { _id?: string; user?: string; tasks: Task[]; }
interface ShabbatInfo {
  parasha: string; candleLighting: string; havdalah: string; shabbatDate: string;
  locationTitle: string | null; dvarTorah: string; parashaSummary: string;
  segulot: string; prophetsStory: string; baalHaTanyaHalachot: string[]; halachot: string[];
}

const POSSIBLE_TASKS = [
  'האם חיברת את הפלטה?', 'האם המקרר על מצב שבת?', 'האם האורות מכוונים לשבת?', 'האם הכנת מיחם?',
  'לבדוק שיש נייר טואלט חתוך', 'כיבוי אור במקרר', 'הכנת נרות שבת', 'הכנת נר נשמה (אם צריך)',
  'קיצוץ ציפורניים', 'מקלחת לכבוד שבת', 'הכנת בגדי שבת', 'סידור השולחן', 'הפרשת חלה (אם רלוונטי)',
  'ניקוי הבית', 'בדיקת כיסים (מוקצה)', 'טעינת טלפונים לפני שבת', 'הכנת אוכל לתינוקות',
  'סגירת בריח בדלת', 'הכנת סידור וחומש', 'נתינת צדקה בערב שבת'
];

const SHABBAT_SONGS = [
  { id: 'lecha_dodi', title: 'לכה דודי לקראת שבת', url: 'https://www.youtube.com/embed/2AWLqffzR9k', direct: 'https://www.youtube.com/watch?v=2AWLqffzR9k' },
  { id: 'shabbat_hamalka', title: 'שבת המלכה', url: 'https://www.youtube.com/embed/Y_fO7ZGQi98', direct: 'https://www.youtube.com/watch?v=Y_fO7ZGQi98' },
  { id: 'lichvod_shabbat', title: 'לכבוד שבת קודש', url: 'https://www.youtube.com/embed/KLpCWNiGeQA', direct: 'https://www.youtube.com/watch?v=KLpCWNiGeQA' }
];

const SHABBAT_MENU = [
  { title: 'דגים חריפים (חריימה)', description: 'דג מושט או לוקוס ברוטב אדום חריף ופיקנטי עם פלפלים ושום.', image: '/images/menu_fish.png', recipe: 'https://www.10dakot.co.il/recipe/%D7%97%D7%A8%D7%99%D7%99%D7%9E%D7%94/' },
  { title: 'סלמון בתנור', description: 'פילה סלמון בתיבול עדין של לימון, שמן זית ועשבי תיבול.', image: '/images/menu_fish.png', recipe: 'https://www.10dakot.co.il/recipe/%D7%A1%D7%9C%D7%9E%D7%95%D7%9F-%D7%91%D7%AA%D7%A0%D7%95%D7%A8/' },
  { title: 'עוף צלוי עם תפוחי אדמה', description: 'כרעי עוף שחומים ועסיסיים עם תפוחי אדמה קריספיים ברוטב סילאן וחרדל.', image: '/images/menu_meats.png', recipe: 'https://www.10dakot.co.il/recipe/%D7%A2%D7%95%D7%A3-%D7%91%D7%AA%D7%A0%D7%95%D7%A8/' },
  { title: 'נתח צלי בקר ברוטב', description: 'צלי בקר רך ונימוח שבושל שעות ארוכות ברוטב יין אדום ופטריות.', image: '/images/menu_meats.png', recipe: 'https://www.10dakot.co.il/recipe/%D7%A0%D7%AA%D7%97-%D7%A6%D7%9C%D7%99-%D7%91%D7%A7%D7%A8/' },
  { title: 'תוספות חמות', description: 'אורז צהוב עם שקדים, צימעס מתקתק וקוגל תפוחי אדמה ירושלמי.', image: '/images/menu_sides.png', recipe: 'https://www.10dakot.co.il/category/%D7%AA%D7%95%D7%A1%D7%A4%D7%95%D7%AA/' }
];

function App() {
  const [user, setUser] = useState<{name: string, token: string} | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  
  const [shabbatInfo, setShabbatInfo] = useState<ShabbatInfo | null>(null);
  const [loadingShabbat, setLoadingShabbat] = useState(false);
  const [view, setView] = useState<'home' | 'checklist' | 'setup' | 'info' | 'menu' | 'table' | 'parasha_video' | 'notifications'>('home');
  const [activeTab, setActiveTab] = useState<'summary' | 'halacha' | 'segulot' | 'tanya' | 'prophets'>('summary');

  const [manualCity, setManualCity] = useState('');
  const [searchingCity, setSearchingCity] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Notification Settings
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [selectedSongId, setSelectedSongId] = useState('lecha_dodi');
  const [showMusicPreview, setShowMusicPreview] = useState(false);
  const [isAlertActive, setIsAlertActive] = useState(false);





  const notificationSent = useRef(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('shabbatUser');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser); fetchChecklist(parsedUser.token);
      const savedLoc = localStorage.getItem('shabbatLocation');
      if (savedLoc) {
        const { lat, lng, cityName } = JSON.parse(savedLoc);
        fetchShabbatTimes(parsedUser.token, lat, lng, cityName);
      } else { detectLocation(parsedUser.token); }
    }
    const savedNotif = localStorage.getItem('shabbatNotifEnabled');
    if (savedNotif !== null) setIsNotificationEnabled(JSON.parse(savedNotif));
    const savedSong = localStorage.getItem('shabbatSongId');
    if (savedSong) setSelectedSongId(savedSong);
  }, []);

  const detectLocation = (token: string) => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('הדפדפן אינו תומך בזיהוי מיקום');
      fetchShabbatTimes(token, 31.7683, 35.2137, 'ירושלים');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        localStorage.setItem('shabbatLocation', JSON.stringify({ lat, lng, cityName: 'מיקום נוכחי' }));
        fetchShabbatTimes(token, lat, lng, 'מיקום נוכחי');
      },
      (err) => {
        setLocationError('לא הצלחנו לזהות מיקום אוטומטית. אנא הזן עיר ידנית למטה.');
        fetchShabbatTimes(token, 31.7683, 35.2137, 'ירושלים');
      },
      { timeout: 8000 }
    );
  };

  const handleCitySearch = async () => {
    if (!manualCity.trim()) return;
    setSearchingCity(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualCity + ', Israel')}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat); const lng = parseFloat(data[0].lon);
        const cityName = manualCity.trim();
        localStorage.setItem('shabbatLocation', JSON.stringify({ lat, lng, cityName }));
        setLocationError(null);
        if (user) await fetchShabbatTimes(user.token, lat, lng, cityName);
      } else { alert('העיר לא נמצאה במאגר.'); }
    } catch (err) { alert('שגיאה בחיפוש המיקום.'); }
    finally { setSearchingCity(false); }
  };

  const fetchShabbatTimes = async (token: string, lat: number, lng: number, cityName?: string) => {
    setLoadingShabbat(true);
    try {
      const url = `http://localhost:4000/api/shabbat?lat=${lat}&lng=${lng}${cityName ? `&cityName=${encodeURIComponent(cityName)}` : ''}`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok) {
        setShabbatInfo(data);
      } else {
        setLocationError('שגיאה בטעינת זמני השבת מהשרת.');
      }
    } catch (err) { 
      setLocationError('בעיית תקשורת עם השרת.');
    }
    finally { setLoadingShabbat(false); }
  };

  useEffect(() => {
    if (shabbatInfo?.candleLighting && !notificationSent.current && isNotificationEnabled) {
      const checkNotification = () => {
        const now = new Date();
        const [hours, minutes] = shabbatInfo.candleLighting.split(':').map(Number);
        const candleTime = new Date(); candleTime.setHours(hours, minutes, 0, 0);
        const diffInMinutes = (candleTime.getTime() - now.getTime()) / (1000 * 60);
        if (diffInMinutes <= 30 && diffInMinutes > 29) { triggerShabbatAlert(); notificationSent.current = true; }
      };
      const interval = setInterval(checkNotification, 60000);
      checkNotification(); return () => clearInterval(interval);
    }
  }, [shabbatInfo, isNotificationEnabled]);

  const triggerShabbatAlert = () => {
    setIsAlertActive(true);
    const msg = new SpeechSynthesisUtterance();
    msg.text = "שלום לך! נשארו שלושים דקות לכניסת השבת. האם את מוכנה? הגיע הזמן להדליק נרות לכבוד שבת קודש.";
    msg.lang = 'he-IL';
    window.speechSynthesis.speak(msg);
  };

  const fetchChecklist = async (token: string) => {
    try {
      const response = await fetch('http://localhost:4000/api/checklist', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (data.needsSetup) { setNeedsSetup(true); setView('setup'); }
      else { setChecklist(data); }
    } catch (err) { console.error(err); }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError('');
    const endpoint = isLoginMode ? '/api/users/login' : '/api/users/register';
    try {
      const response = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(authForm),
      });
      const data = await response.json();
      if (response.ok) {
        const userData = { name: data.name, token: data.token };
        setUser(userData); localStorage.setItem('shabbatUser', JSON.stringify(userData));
        fetchChecklist(data.token); detectLocation(data.token); setView('home');
      } else { setAuthError(data.message || 'שגיאה בהתחברות'); }
    } catch (err) { setAuthError('שגיאת תקשורת'); }
    finally { setAuthLoading(false); }
  };

  const handleSetupSubmit = async () => {
    if (selectedTasks.length === 0) return alert('נא לבחור לפחות משימה אחת');
    try {
      const response = await fetch('http://localhost:4000/api/checklist/setup', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ tasks: selectedTasks }),
      });
      const data = await response.json();
      if (response.ok) { setChecklist(data); setNeedsSetup(false); setView('home'); }
    } catch (err) { alert('שגיאה בשמירה'); }
  };

  const toggleTask = async (taskId: string) => {
    if (!checklist) return;
    const task = checklist.tasks.find(t => t._id === taskId);
    if (!task) return;
    try {
      const response = await fetch(`http://localhost:4000/api/checklist/${taskId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.token}` },
        body: JSON.stringify({ isCompleted: !task.isCompleted }),
      });
      const data = await response.json();
      if (response.ok) setChecklist(data);
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => { setUser(null); localStorage.removeItem('shabbatUser'); localStorage.removeItem('shabbatLocation'); setView('home'); };

  const HiddenMessage = () => <div className="hidden-message">שמירת שבת של עוד יהודי תוביל לגאולה</div>;

  const PageHeader = ({ title }: { title: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
      <div className="flex items-center gap-6">
        <button onClick={() => setView('home')} className="back-btn group">
          <span className="group-hover:-translate-x-2 transition-transform">←</span> חזרה לתפריט הראשי
        </button>
        <h2 className="text-4xl font-black text-indigo-950 holy-glow">{title}</h2>
      </div>
      <div className="bg-white px-8 py-4 rounded-full border-2 border-shabbat-gold flex items-center gap-4 shadow-xl">
        <span className="text-3xl animate-bounce">🕯️</span>
        <span className="font-black text-indigo-950 text-xl">הדלקת נרות: {shabbatInfo?.candleLighting || '--:--'}</span>
      </div>
    </div>
  );

  const selectedSong = SHABBAT_SONGS.find(s => s.id === selectedSongId) || SHABBAT_SONGS[0];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1544984243-75a60233663c?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center dir-rtl">
        <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-[2px]"></div>
        <div className="glass w-full max-w-md p-10 animate-slide-up relative z-10 holy-border">
          <div className="text-center mb-12">
            <h1 className="shabbat-title mb-4">זמן שבת</h1>
            <p className="text-indigo-900 text-xl font-black mb-2">ברוכים הבאים להיכל ההכנות לשבת</p>
            <p className="text-shabbat-gold text-sm font-bold">אפליקציה זאת נוצרה ע"י יעל לוי לקידוש שם שמיים ברבים.</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-6">
            {!isLoginMode && <input type="text" placeholder="שם מלא" required className="input-premium" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />}
            <input type="email" placeholder="אימייל" required className="input-premium" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
            <input type="password" placeholder="סיסמה" required className="input-premium" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
            {authError && <p className="text-red-600 font-bold text-sm text-center">{authError}</p>}
            <button type="submit" disabled={authLoading} className="premium-btn w-full text-2xl mt-6">{authLoading ? 'מעבד...' : (isLoginMode ? 'כניסה להיכל' : 'הרשמה למערכת')}</button>
          </form>
          <button onClick={() => setIsLoginMode(!isLoginMode)} className="w-full mt-10 text-indigo-950 font-black hover:text-shabbat-gold transition-colors text-lg">{isLoginMode ? 'עוד לא רשום? הצטרף עכשיו' : 'כבר יש לך חשבון? התחבר'}</button>
          <HiddenMessage />
        </div>
      </div>
    );
  }

  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-[#fdfaf1] p-6 dir-rtl">
        <div className="max-w-4xl mx-auto glass p-10 animate-fade-in holy-border">
          <h2 className="text-5xl font-black text-indigo-950 mb-2 holy-glow">שלום {user.name}, בוא נכין את השבת שלך</h2>
          <p className="text-shabbat-gold font-bold mb-6">אפליקציה זאת נוצרה ע"י יעל לוי לקידוש שם שמיים ברבים.</p>
          <p className="text-gray-700 text-xl font-bold mb-10">בחר את המשימות שחשובות לך להכנות ב-30 הדקות האחרונות:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {POSSIBLE_TASKS.map(task => (
              <label key={task} className={`flex items-center p-6 rounded-3xl cursor-pointer border-2 transition-all duration-300 ${selectedTasks.includes(task) ? 'border-shabbat-gold bg-shabbat-gold/10 shadow-lg' : 'border-gray-100 bg-white hover:border-shabbat-gold/40'}`}>
                <input type="checkbox" className="hidden" checked={selectedTasks.includes(task)} onChange={() => { setSelectedTasks(prev => prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]); }} />
                <div className={`w-8 h-8 rounded-xl border-2 ml-4 flex items-center justify-center transition-colors ${selectedTasks.includes(task) ? 'bg-shabbat-gold border-shabbat-gold' : 'border-gray-300 bg-gray-50'}`}>{selectedTasks.includes(task) && <span className="text-white text-sm">✓</span>}</div>
                <span className="font-black text-indigo-950 text-lg">{task}</span>
              </label>
            ))}
          </div>
          <button onClick={handleSetupSubmit} className="premium-btn w-full text-2xl">שמור והמשך לאפליקציה</button>
          <HiddenMessage />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfaf1] dir-rtl font-hebrew">
      <header className="bg-white/95 backdrop-blur-xl shadow-lg border-b-4 border-shabbat-gold/30 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('home')}>
            <span className="text-4xl holy-glow">🕯️</span>
            <div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-shabbat-gold to-amber-700 tracking-tighter">זמן שבת</h1>
              <p className="text-[10px] font-bold text-shabbat-gold leading-none">אפליקציה זאת נוצרה ע"י יעל לוי לקידוש שם שמיים ברבים.</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="font-black text-indigo-950 text-lg hidden sm:inline">שלום, {user.name}</span>
            <button onClick={handleLogout} className="text-red-600 font-black hover:bg-red-50 px-6 py-2 rounded-full border-2 border-red-100 transition-all shadow-sm">התנתק</button>
          </div>
        </div>
      </header>

      {isAlertActive && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-indigo-950/90 backdrop-blur-xl animate-fade-in">
          <div className="glass max-w-2xl w-full p-12 text-center holy-border space-y-8">
            <div className="text-8xl animate-bounce">🕯️🕯️</div>
            <h2 className="text-5xl font-black text-shabbat-gold holy-glow">זמן שבת קודש!</h2>
            <p className="text-3xl text-white font-bold leading-relaxed"> נשארו 30 דקות להדלקת נרות. <br/> האם את מוכנה לקבלת השבת? </p>
            <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-shabbat-gold/30 bg-black">
              <iframe key={selectedSong.id} width="100%" height="100%" src={`${selectedSong.url}?autoplay=1&rel=0&modestbranding=1&origin=${window.location.origin}`} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
            </div>
            <div className="flex flex-col gap-4 mt-6">
              <a href={selectedSong.direct} target="_blank" rel="noopener noreferrer" className="premium-btn text-xl py-4 flex items-center justify-center gap-3"><span>▶️</span> נגן שיר ביוטיוב (אם הנגן חסום)</a>
              <button onClick={() => setIsAlertActive(false)} className="text-white/70 hover:text-white font-bold underline transition-colors">אני מוכנה! שבת שלום</button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-8 pb-32">
        {view === 'home' && (
          <div className="animate-fade-in space-y-16">
            <section className="bg-[url('https://images.unsplash.com/photo-1544984243-75a60233663c?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center rounded-[4rem] p-1 shadow-[0_30px_100px_-20px_rgba(212,175,55,0.4)] relative overflow-hidden group border-4 border-shabbat-gold/20">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/95 via-indigo-900/80 to-transparent"></div>
              <div className="relative z-10 p-16 text-white">
                <p className="text-shabbat-gold font-black text-xl mb-4 flex items-center gap-3"><span className="h-1 w-12 bg-shabbat-gold"></span> שבת קודש מתקרבת</p>
                <h2 className="text-7xl font-black mb-10 text-shadow-gold leading-tight">ברוכים הבאים <br/>לזמן שבת</h2>
                
                {locationError && (
                  <div className="bg-red-500/30 backdrop-blur-md border-2 border-red-500 p-6 rounded-[2rem] mb-10 flex items-center gap-6 animate-slide-up">
                    <span className="text-4xl">⚠️</span>
                    <p className="font-black text-xl">{locationError}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-6">
                  <div className="bg-white/10 backdrop-blur-xl px-10 py-6 rounded-[2rem] border border-white/30 relative group/loc shadow-2xl">
                    <p className="text-indigo-200 text-sm font-black uppercase mb-1 opacity-80">עיר מגורייך</p>
                    <p className="text-3xl font-black">{shabbatInfo?.locationTitle || 'מזהה מיקום...'}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl px-10 py-6 rounded-[2rem] border border-white/30 shadow-2xl">
                    <p className="text-indigo-200 text-sm font-black uppercase mb-1 opacity-80">הדלקת נרות</p>
                    <p className="text-4xl font-black text-shabbat-gold holy-glow">{shabbatInfo?.candleLighting || '--:--'}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl px-10 py-6 rounded-[2rem] border border-white/30 shadow-2xl">
                    <p className="text-indigo-200 text-sm font-black uppercase mb-1 opacity-80">פרשת השבוע</p>
                    <p className="text-3xl font-black">{shabbatInfo?.parasha || 'טוען...'}</p>
                  </div>
                </div>

                <div className="mt-12 animate-slide-up bg-white/10 p-10 rounded-[4rem] border-2 border-white/30 backdrop-blur-2xl max-w-4xl shadow-2xl">
                  <h3 className="text-3xl font-black mb-8 text-shabbat-gold">עדכון מיקום ידני (למיקום מדוייק):</h3>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <input type="text" placeholder="הקלד שם עיר (למשל: נתניה, אשדוד, בני ברק)" className="bg-white/20 border-2 border-white/40 text-white placeholder-white/60 rounded-3xl px-10 py-6 focus:outline-none focus:ring-4 focus:ring-shabbat-gold/50 flex-1 text-2xl font-black shadow-inner" value={manualCity} onChange={e => setManualCity(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleCitySearch()} />
                    <button onClick={handleCitySearch} disabled={searchingCity} className="bg-shabbat-gold text-indigo-950 font-black px-14 py-6 rounded-3xl hover:bg-white hover:scale-105 active:scale-95 transition-all text-2xl shadow-[0_15px_30px_-10px_rgba(212,175,55,0.6)] flex items-center justify-center gap-4">{searchingCity ? 'מעדכן...' : 'עדכן עיר מגורים'}</button>
                  </div>
                </div>
              </div>
            </section>

            {/* מעלת הדלקת הנרות Section */}
            <section className="bg-white p-12 rounded-[4rem] border-4 border-shabbat-gold/20 shadow-2xl animate-slide-up relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-transparent via-shabbat-gold to-transparent opacity-50"></div>
              <h3 className="text-4xl font-black mb-10 text-indigo-950 text-center holy-glow">מעלת הדלקת הנרות</h3>
              <div className="flex flex-col lg:flex-row gap-12 items-center">
                <div className="w-full lg:w-1/2 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-shabbat-gold/10 group-hover:scale-[1.02] transition-transform duration-700">
                  <img src="/candles.png" alt="הדלקת נרות שבת" className="w-full h-full object-cover" />
                </div>
                <div className="w-full lg:w-1/2 space-y-8">
                  <p className="text-2xl text-indigo-900 font-bold leading-relaxed text-right">
                    "רק האישה יכולה להוריד שכינה לבית..." 
                    <br />
                    צפו בסרטון המרגש של הרב שלמה עופר על הכוח העצום שניתן לך ברגעים הקדושים של הדלקת הנרות.
                  </p>
                  <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-shabbat-gold/20 bg-black">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src="https://www.youtube.com/embed/xTTF0edvVcM" 
                      title="הרב שלמה עופר - רק האישה יכולה" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { id: 'checklist', icon: '📋', title: 'הכנות לשבת', desc: 'צ\'קליסט 30 דקות' },
                { id: 'info', icon: '📜', title: 'פרשת השבוע', desc: 'סיכום ודבר תורה' },
                { id: 'tanya', icon: '🕯️', title: 'בעל התניא', desc: 'פנינים לשבת קודש' },
                { id: 'parasha_video', icon: '🎬', title: 'שיעור לפרשה', desc: 'הרב שניאור אשכנזי' },
                { id: 'notifications', icon: '🔔', title: 'התראת שבת', desc: 'מוזיקה ותזכורות' },
                { id: 'table', icon: '🍷', title: 'שולחן שבת', desc: 'דוגמאות וסרטונים' },
                { id: 'menu', icon: '🍳', title: 'תפריט שבת', desc: 'מטעמים ומתכונים' },
                { id: 'prophets', icon: '📖', title: 'סיפורי נביאים', desc: 'לשולחן השבת' },
                { id: 'segulot', icon: '✨', title: 'סגולות', desc: 'סודות מהקבלה' }
              ].map(item => (
                <button key={item.id} onClick={() => {
                  if (item.id === 'segulot') { setView('info'); setActiveTab('segulot'); }
                  else if (item.id === 'prophets') { setView('info'); setActiveTab('prophets'); }
                  else if (item.id === 'tanya') { setView('info'); setActiveTab('tanya'); }
                  else setView(item.id as any);
                }} className="card-premium flex flex-col items-center text-center group h-full hover:holy-border">
                  <div className="w-20 h-20 bg-shabbat-gold/10 text-shabbat-gold rounded-[2rem] flex items-center justify-center mb-6 text-4xl group-hover:scale-110 group-hover:bg-shabbat-gold group-hover:text-white transition-all duration-500 shadow-inner">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-black text-indigo-950 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 font-bold leading-tight">{item.desc}</p>
                </button>
              ))}
            </div>
            <HiddenMessage />
          </div>
        )}

        {view === 'notifications' && (
          <div className="animate-slide-up">
            <PageHeader title="התראות שבת קודש" />
            <div className="glass p-12 holy-border space-y-12">
              <div className="flex items-center justify-between p-8 bg-shabbat-gold/5 rounded-[3rem] border border-shabbat-gold/20">
                <div>
                  <h3 className="text-3xl font-black text-indigo-950 mb-2">התראה חצי שעה לפני שבת</h3>
                  <p className="text-gray-600 font-bold">קבלת התראה קולית ומוזיקלית לבדיקת מוכנות לשבת</p>
                </div>
                <button 
                  onClick={() => {
                    const newVal = !isNotificationEnabled;
                    setIsNotificationEnabled(newVal);
                    localStorage.setItem('shabbatNotifEnabled', JSON.stringify(newVal));
                  }}
                  className={`w-24 h-12 rounded-full relative transition-all duration-500 ${isNotificationEnabled ? 'bg-shabbat-gold shadow-lg shadow-shabbat-gold/50' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-10 h-10 bg-white rounded-full transition-all duration-500 ${isNotificationEnabled ? 'left-1' : 'left-13'}`}></div>
                </button>
              </div>

              <div className="space-y-6">
                <h4 className="text-2xl font-black text-indigo-950 flex items-center gap-3">
                  <span>🎶</span> בחירת שיר התראה
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {SHABBAT_SONGS.map(song => (
                    <div 
                      key={song.id} 
                      onClick={() => {
                        setSelectedSongId(song.id);
                        localStorage.setItem('shabbatSongId', song.id);
                      }}
                      className={`p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-300 ${selectedSongId === song.id ? 'border-shabbat-gold bg-shabbat-gold/10' : 'border-gray-100 bg-white hover:border-shabbat-gold/30'}`}
                    >
                      <h5 className="font-black text-indigo-950 mb-4">{song.title}</h5>
                      <div className="flex flex-col gap-4">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowMusicPreview(song.id === showMusicPreview ? false : song.id as any); }}
                          className={`w-full py-3 rounded-xl font-black transition-all ${showMusicPreview === song.id ? 'bg-indigo-950 text-white' : 'bg-white border-2 border-indigo-950 text-indigo-950 hover:bg-indigo-50'}`}
                        >
                          {showMusicPreview === song.id ? '⏹️ עצור דוגמית' : '🔊 השמע דוגמית'}
                        </button>
                        <a href={song.direct} target="_blank" rel="noopener noreferrer" className="premium-btn text-center text-sm py-2 flex items-center justify-center gap-2"><span>🎬</span> פתח ביוטיוב</a>
                      </div>
                      {showMusicPreview === song.id && (
                        <div className="mt-6 aspect-video rounded-2xl overflow-hidden bg-black border-4 border-shabbat-gold/20 shadow-2xl">
                          <iframe width="100%" height="100%" src={`${song.url}?autoplay=1&origin=${window.location.origin}`} frameBorder="0" allow="autoplay; encrypted-media"></iframe>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="divider-gold"></div>
              <button onClick={triggerShabbatAlert} className="premium-btn w-full text-2xl py-6">נסה התראה עכשיו (בדיקה)</button>
              <HiddenMessage />
            </div>
          </div>
        )}

        {view === 'parasha_video' && (
          <div className="animate-slide-up">
            <PageHeader title={`שיעור לפרשת ${shabbatInfo?.parasha || 'השבוע'}`} />
            <div className="max-w-4xl mx-auto glass p-12 holy-border text-center space-y-10">
              <div className="w-40 h-40 bg-shabbat-gold/10 rounded-full mx-auto flex items-center justify-center text-8xl holy-glow">🎙️</div>
              <h3 className="text-5xl font-black text-indigo-950">שיעור מרתק על פרשת {shabbatInfo?.parasha}</h3>
              <p className="text-2xl text-gray-700 font-bold leading-relaxed max-w-3xl mx-auto">
                הכנו עבורך שיעור וידאו מעמיק ומרתק של הרב שניאור אשכנזי ורבנים מובילים אחרים בנושא הפרשה הנוכחית.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <a href={`https://www.youtube.com/results?search_query=הרב+שניאור+אשכנזי+פרשת+${shabbatInfo?.parasha}`} target="_blank" rel="noopener noreferrer" className="premium-btn text-2xl px-12 py-5 flex items-center justify-center gap-4"><span>🎬</span> לצפייה ביוטיוב</a>
                <a href={`https://www.hidabroot.org/search/${shabbatInfo?.parasha}`} target="_blank" rel="noopener noreferrer" className="bg-indigo-900 text-white font-black px-12 py-5 rounded-2xl hover:bg-indigo-800 transition-all text-2xl flex items-center justify-center gap-4 shadow-xl"><span>📜</span> שיעורי הידברות</a>
              </div>
              <div className="divider-gold"></div>
              <HiddenMessage />
            </div>
          </div>
        )}

        {view === 'checklist' && (
          <div className="animate-slide-up">
            <PageHeader title="הכנות אחרונות לשבת" />
            <div className="glass p-12 holy-border">
              <div className="mb-12 bg-shabbat-gold/10 p-10 rounded-[3rem] border border-shabbat-gold/20 shadow-inner">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-black text-indigo-950 text-2xl">התקדמות הכנות המלכה</span>
                  <span className="text-shabbat-gold text-4xl font-black holy-glow">{Math.round(((checklist?.tasks || []).filter(t => t.isCompleted).length || 0) / ((checklist?.tasks || []).length || 1) * 100)}%</span>
                </div>
                <div className="w-full bg-white h-8 rounded-full overflow-hidden border-4 border-white shadow-lg"><div className="bg-gradient-to-r from-shabbat-gold to-amber-600 h-full transition-all duration-1000 ease-out" style={{ width: `${((checklist?.tasks || []).filter(t => t.isCompleted).length || 0) / ((checklist?.tasks || []).length || 1) * 100}%` }}></div></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(checklist?.tasks || []).map(task => (
                  <div key={task._id} onClick={() => toggleTask(task._id!)} className={`flex items-center p-8 rounded-[2.5rem] cursor-pointer border-2 transition-all duration-300 ${task.isCompleted ? 'bg-green-50 border-green-200 opacity-60' : 'bg-white border-gray-100 hover:border-shabbat-gold hover:shadow-2xl'}`}>
                    <div className={`w-12 h-12 rounded-2xl border-2 ml-6 flex items-center justify-center transition-all ${task.isCompleted ? 'bg-green-600 border-green-600 scale-110 shadow-lg' : 'border-gray-300 bg-gray-50'}`}>{task.isCompleted && <span className="text-white font-black text-xl">✓</span>}</div>
                    <span className={`text-2xl font-black ${task.isCompleted ? 'line-through text-green-800 opacity-70' : 'text-indigo-950'}`}>{task.title}</span>
                  </div>
                ))}
              </div>
              <HiddenMessage />
            </div>
          </div>
        )}

        {view === 'table' && (
          <div className="animate-slide-up">
            <PageHeader title="דוגמאות לשולחן שבת קודש" />
            <div className="max-w-5xl mx-auto space-y-12">
              <div className="glass p-8 holy-border overflow-hidden group">
                <video controls className="w-full rounded-[2.5rem] shadow-2xl border-4 border-shabbat-gold/20" poster="/images/parasha_v2.png">
                  <source src="/videos/shabbat_table.mp4" type="video/mp4" />
                  הדפדפן שלך לא תומך בוידאו.
                </video>
                <div className="mt-10 text-center">
                  <h3 className="text-4xl font-black text-indigo-950 mb-4 holy-glow">עריכת שולחן שבת לדוגמה</h3>
                  <p className="text-2xl text-gray-600 font-bold italic">השראה לעיצוב השולחן לכבוד המלכה</p>
                </div>
              </div>
              <HiddenMessage />
            </div>
          </div>
        )}

        {view === 'menu' && (
          <div className="animate-slide-up">
            <PageHeader title="תפריט מטעמי שבת קודש" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {SHABBAT_MENU.map((item, idx) => (
                <div key={idx} className="card-premium overflow-hidden !p-0 group !rounded-[3rem]">
                  <div className="h-80 overflow-hidden relative">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-70"></div>
                    <h3 className="absolute bottom-6 right-8 text-4xl font-black text-white text-shadow-gold">{item.title}</h3>
                  </div>
                  <div className="p-10">
                    <p className="text-xl text-gray-700 font-bold mb-10 leading-relaxed h-20 overflow-hidden">{item.description}</p>
                    <a href={item.recipe} target="_blank" rel="noopener noreferrer" className="premium-btn inline-block w-full text-center py-4 text-xl">לצפייה במתכון המלא</a>
                  </div>
                </div>
              ))}
            </div>
            <HiddenMessage />
          </div>
        )}

        {view === 'info' && (
          <div className="animate-slide-up">
            <PageHeader title="תוכן רוחני לשבת" />
            <div className="glass overflow-hidden holy-border">
              <div className="flex bg-gray-50/50 border-b-2 border-shabbat-gold/20 overflow-x-auto no-scrollbar">
                {[
                  { id: 'summary', label: 'פרשת השבוע', icon: '📜' },
                  { id: 'prophets', label: 'סיפורי נביאים', icon: '📖' },
                  { id: 'halacha', label: 'הלכות שבת', icon: '⚖️' },
                  { id: 'segulot', label: 'סגולות', icon: '✨' },
                  { id: 'tanya', label: 'בעל התניא', icon: '🕯️' }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[160px] py-8 font-black text-xl flex items-center justify-center gap-3 transition-all duration-500 ${activeTab === tab.id ? 'bg-white text-shabbat-gold border-b-8 border-shabbat-gold shadow-inner' : 'text-gray-400 hover:bg-shabbat-gold/5'}`}>
                    <span className="text-2xl">{tab.icon}</span> {tab.label}
                  </button>
                ))}
              </div>
              <div className="p-12">
                {activeTab === 'summary' && (
                  <div className="animate-fade-in space-y-12">
                    <div className="rounded-[4rem] overflow-hidden h-[30rem] relative shadow-2xl border-8 border-shabbat-gold/20 group">
                      <img src="/images/parasha_v2.png" alt="Holy Torah Scene" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-950 via-transparent to-transparent flex items-end p-12">
                        <div className="animate-slide-up">
                          <p className="text-shabbat-gold font-black text-2xl mb-2">השבת נקרא בבית הכנסת:</p>
                          <h3 className="text-white text-7xl font-black text-shadow-gold">פרשת {shabbatInfo?.parasha}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                      <div className="lg:col-span-2 space-y-8"><div className="bg-shabbat-gold/5 p-12 rounded-[3rem] border-r-[12px] border-shabbat-gold shadow-sm"><h4 className="text-3xl font-black text-indigo-950 mb-6 flex items-center gap-4"><span className="text-shabbat-gold text-2xl">●</span> סיכום הפרשה ופניני פשט</h4><p className="text-gray-800 text-2xl leading-relaxed font-bold text-justify whitespace-pre-wrap">{shabbatInfo?.parashaSummary}</p></div></div>
                      <div className="bg-indigo-950 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-center border-b-8 border-shabbat-gold"><div className="relative z-10"><h4 className="text-3xl font-black text-shabbat-gold mb-6">סוד הפרשה (קבלה וחסידות)</h4><p className="text-indigo-50 text-2xl leading-relaxed font-bold italic text-justify whitespace-pre-wrap">"{shabbatInfo?.dvarTorah}"</p></div><div className="absolute -bottom-8 -left-8 text-[12rem] opacity-10">📜</div></div>
                    </div>
                  </div>
                )}
                {activeTab === 'prophets' && (
                  <div className="animate-fade-in space-y-12 max-w-5xl mx-auto text-center">
                    <div className="w-40 h-40 bg-shabbat-gold/10 rounded-full mx-auto flex items-center justify-center text-8xl mb-8 holy-glow">📖</div>
                    <h3 className="text-5xl font-black text-indigo-950">סיפור מרתק מהנביאים לשולחן השבת</h3>
                    <div className="bg-white p-16 rounded-[4rem] shadow-2xl border-4 border-shabbat-gold/20 relative mt-12"><p className="text-3xl font-bold text-gray-800 leading-relaxed text-justify whitespace-pre-wrap">{shabbatInfo?.prophetsStory}</p><div className="absolute -top-10 -right-10 w-24 h-24 bg-shabbat-gold rounded-[2rem] flex items-center justify-center text-white text-5xl shadow-2xl rotate-12">📜</div></div>
                  </div>
                )}
                {activeTab === 'halacha' && (
                  <div className="animate-fade-in space-y-12">
                    <h3 className="text-4xl font-black text-indigo-950 flex items-center gap-4"><span className="text-shabbat-gold">⚖️</span> הלכה למעשה</h3>
                    <div className="grid gap-6">
                      {(shabbatInfo?.halachot || []).map((h, i) => (
                        <div key={i} className="flex gap-8 p-10 bg-[#fdfaf1] rounded-[2.5rem] border-2 border-shabbat-gold/10 items-center shadow-md hover:shadow-xl transition-all"><span className="bg-shabbat-gold text-white text-2xl w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 font-black shadow-lg">{i+1}</span><p className="text-indigo-950 text-2xl font-black leading-relaxed">{h}</p></div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'segulot' && (
                  <div className="animate-fade-in py-16 flex flex-col items-center text-center max-w-4xl mx-auto">
                    <div className="w-32 h-32 bg-shabbat-gold/10 rounded-[2.5rem] flex items-center justify-center text-7xl mb-12 holy-glow">✨</div>
                    <h3 className="text-5xl font-black text-indigo-950 mb-10">סגולות וסודות השבת</h3>
                    <div className="bg-white p-16 rounded-[4rem] shadow-2xl border-4 border-shabbat-gold/10 relative"><p className="text-4xl font-black text-indigo-900 leading-tight mb-8 text-justify whitespace-pre-wrap">{shabbatInfo?.segulot}</p><div className="w-24 h-1.5 bg-gradient-to-r from-transparent via-shabbat-gold to-transparent mx-auto mb-8"></div><p className="text-shabbat-gold text-xl font-black italic">מתוך ספרי הקבלה והחסידות</p></div>
                  </div>
                )}
                {activeTab === 'tanya' && (
                  <div className="animate-fade-in space-y-12">
                    <div className="flex flex-col md:flex-row items-center gap-12 bg-white p-12 rounded-[4rem] shadow-2xl border-4 border-shabbat-gold/20 relative overflow-hidden">
                      <div className="absolute -top-20 -right-20 text-[15rem] opacity-5">📖</div>
                      <div className="w-64 h-64 flex-shrink-0 rounded-full overflow-hidden border-8 border-shabbat-gold/30 shadow-2xl relative group z-10">
                        <img src="/images/alter_rebbe.png" alt="האדמו״ר הזקן בעל התניא" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-shabbat-gold/20 mix-blend-overlay"></div>
                      </div>
                      <div className="flex-1 space-y-6 z-10">
                        <h3 className="text-5xl font-black text-indigo-950">האדמו"ר הזקן - בעל התניא</h3>
                        <p className="text-2xl text-shabbat-gold font-black italic">פנינים והלכות לשבת קודש ולפרשת השבוע</p>
                      </div>
                    </div>
                    <div className="grid gap-8">
                      {shabbatInfo?.baalHaTanyaHalachot?.map((h, i) => (
                        <div key={i} className="bg-indigo-950 p-10 rounded-[3rem] shadow-xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-40 h-40 bg-shabbat-gold/10 rounded-full blur-3xl group-hover:bg-shabbat-gold/20 transition-all duration-700"></div>
                          <div className="relative z-10 flex gap-6 items-start">
                            <span className="text-4xl text-shabbat-gold mt-1">🕯️</span>
                            <p className="text-white text-2xl font-bold leading-relaxed">{h}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    

                  </div>
                )}
                <div className="divider-gold"></div>
                <HiddenMessage />
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t-4 border-shabbat-gold/30 px-8 py-4 flex justify-around items-center sm:hidden z-50 shadow-[0_-10px_50px_rgba(0,0,0,0.1)]">
        <button onClick={() => setView('home')} className={`flex flex-col items-center transition-all duration-300 ${view === 'home' ? 'text-shabbat-gold scale-125' : 'text-gray-400 opacity-70'}`}><span className="text-3xl">🏠</span><span className="text-[10px] font-black uppercase mt-1">ראשי</span></button>
        <button onClick={() => setView('checklist')} className={`flex flex-col items-center transition-all duration-300 ${view === 'checklist' ? 'text-shabbat-gold scale-125' : 'text-gray-400 opacity-70'}`}><span className="text-3xl">📋</span><span className="text-[10px] font-black uppercase mt-1">משימות</span></button>
        <button onClick={() => setView('notifications')} className={`flex flex-col items-center transition-all duration-300 ${view === 'notifications' ? 'text-shabbat-gold scale-125' : 'text-gray-400 opacity-70'}`}><span className="text-3xl">🔔</span><span className="text-[10px] font-black uppercase mt-1">התראה</span></button>
        <button onClick={() => setView('menu')} className={`flex flex-col items-center transition-all duration-300 ${view === 'menu' ? 'text-shabbat-gold scale-125' : 'text-gray-400 opacity-70'}`}><span className="text-3xl">🍳</span><span className="text-[10px] font-black uppercase mt-1">תפריט</span></button>
      </nav>
    </div>
  );
}

export default App;
