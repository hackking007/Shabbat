/**
 * קובץ זה נוצר על ידינו.
 * תפקיד הקובץ: סטטיסטיקות האתר - כמה משתמשים נרשמו וכמה כניסות היו לאתר.
 */

import User from '../models/User.js'; // מודל המשתמשים - כדי לספור כמה נרשמו
import Visit from '../models/Visit.js'; // מודל מונה הכניסות

// פונקציה שמעלה את מונה הכניסות ב-1 (נקראת בכל כניסה לדף הבית).
// פועלת בשקט - אם אין חיבור למסד נתונים פשוט מתעלמים ולא מפילים את הבקשה.
export const trackVisit = async () => {
  try {
    await Visit.updateOne({ key: 'site' }, { $inc: { count: 1 } }, { upsert: true });
  } catch (error) {
    // מתעלמים משגיאות ספירה - הן לא צריכות לעצור את האתר
  }
};

// פונקציה שמחזירה דף HTML קטן עם המספרים (כדי שאפשר פשוט לגלוש לכתובת ולראות)
export const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments(); // ספירת המשתמשים הרשומים
    const visitDoc = await Visit.findOne({ key: 'site' }); // שליפת מונה הכניסות
    const totalVisits = visitDoc ? visitDoc.count : 0;

    // אם מבקשים JSON (למשל מקוד) - מחזירים JSON. אחרת דף HTML ידידותי.
    if (req.query.format === 'json') {
      return res.json({ totalUsers, totalVisits });
    }

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>סטטיסטיקות האתר</title>
  <style>
    body { font-family: system-ui, Arial, sans-serif; background:#1e1b4b; color:#fff; margin:0;
           min-height:100vh; display:flex; align-items:center; justify-content:center; }
    .card { background:#312e81; padding:48px 56px; border-radius:24px; text-align:center;
            box-shadow:0 20px 60px rgba(0,0,0,.4); }
    h1 { margin:0 0 32px; font-size:28px; }
    .stat { margin:20px 0; }
    .num { font-size:56px; font-weight:900; color:#fbbf24; line-height:1; }
    .label { font-size:18px; opacity:.85; margin-top:8px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>📊 סטטיסטיקות האתר</h1>
    <div class="stat"><div class="num">${totalUsers}</div><div class="label">משתמשים רשומים</div></div>
    <div class="stat"><div class="num">${totalVisits}</div><div class="label">כניסות לאתר</div></div>
  </div>
</body>
</html>`);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
