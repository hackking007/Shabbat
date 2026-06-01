/**
 * קובץ זה נוצר על ידינו.
 * תפקיד הקובץ: נתיב ה-API להצגת סטטיסטיקות האתר.
 */

import express from 'express'; // ייבוא Express ליצירת ה-Router
import { getStats } from '../controllers/statsController.js'; // ייבוא הפונקציה שמחזירה את הנתונים

const router = express.Router(); // יצירת מופע Router

// כניסה לכתובת /api/stats תחזיר את המספרים
router.get('/', getStats);

export default router; // ייצוא לשימוש ב-server.js
