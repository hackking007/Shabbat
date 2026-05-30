/**
 * קובץ זה נוצר על ידינו.
 * תפקיד הקובץ: נקודת הכניסה המרכזית (Entry Point) של השרת. הוא מאתחל את האפליקציה, מחבר את מסד הנתונים ומגדיר את הנתיבים.
 */

import 'dotenv/config'; // טעינת משתני סביבה מקובץ .env (מפתחות API, סיסמאות וכו') לתוך process.env
import express from 'express'; // ייבוא ספריית Express - הכלי המרכזי לבניית השרת וניהול הבקשות
import cors from 'cors'; // ייבוא ספריית CORS המאפשרת ל-Frontend (מ-Vite) לדבר עם ה-Backend
import { connectDB } from './server/config/db.js'; // ייבוא הפונקציה שמתחברת למסד הנתונים MongoDB

// ייבוא קבצי הניתוב (Routes) שמגדירים את כתובות ה-API השונות
import shabbatRoutes from './server/routes/shabbatRoutes.js'; // נתיבים הקשורים לזמני שבת ותוכן AI
import authRoutes from './server/routes/authRoutes.js'; // נתיבים הקשורים להרשמה והתחברות משתמשים
import checklistRoutes from './server/routes/checklistRoutes.js'; // נתיבים הקשורים לרשימת המטלות (Checklist)

// קריאה לפונקציה שמחברת אותנו למסד הנתונים MongoDB Atlas
connectDB();

// יצירת מופע של אפליקציית ה-Express - ה"שרת" שלנו
const app = express();

// הגדרת Middlewares - פונקציות שעוזרות לשרת לעבד את המידע שמגיע אליו
app.use(cors()); // אישור קבלת בקשות מדפדפנים שונים (חשוב לחיבור בין ה-Frontend ל-Backend)
app.use(express.json()); // מאפשר לשרת לקרוא ולהבין גוף בקשה (Body) שנשלח בפורמט JSON
app.use(express.static('public')); // הפיכת תיקיית 'public' לזמינה עבור קבצים סטטיים כמו תמונות או סרטונים

// רישום הנתיבים (Routes) של ה-API - כל נתיב מטופל על ידי קובץ ייעודי
app.use('/api/shabbat', shabbatRoutes); // ניתוב בקשות הקשורות לשבת
app.use('/api/users', authRoutes); // ניתוב בקשות הקשורות למשתמשים (Login/Register)
app.use('/api/checklist', checklistRoutes); // ניתוב בקשות הקשורות לצ'קליסט האישי

// Middleware מרכזי לטיפול בשגיאות - תופס שגיאות שלא טופלו במקום אחר ומונע קריסה
app.use((err, req, res, next) => {
  console.error(err.stack); // הדפסת פירוט השגיאה בטרמינל לצרכי ניפוי שגיאות
  res.status(500).json({ message: 'משהו השתבש בשרת!' }); // החזרת הודעה ידידותית למשתמש במידה ומשהו השתבש
});

// הגדרת הפורט (ה"שער") עליו השרת מאזין (ברירת מחדל 4000 אם לא צוין אחרת ב-.env)
const PORT = process.env.PORT || 4000;

// הפעלה רשמית של השרת ותחילת האזנה לבקשות
app.listen(PORT, () => console.log(`✅ Server running → http://localhost:${PORT}`));
