/**
 * קובץ זה נוצר על ידינו.
 * תפקיד הקובץ: הגדרת נתיבי ה-API עבור תהליכי אימות משתמשים (הרשמה והתחברות).
 * קובץ זה מחבר בין הכתובת (URL) לבין הלוגיקה שנמצאת ב-Controller.
 */

import express from 'express'; // ייבוא Express ליצירת ה-Router
import { registerUser, loginUser } from '../controllers/authController.js'; // ייבוא הפונקציות שמטפלות בלוגיקה

const router = express.Router(); // יצירת מופע של ה-Router

// נתיב להרשמת משתמש חדש - מתקבל בבקשת POST לכתובת /api/users/register
router.post('/register', registerUser);

// נתיב להתחברות משתמש קיים - מתקבל בבקשת POST לכתובת /api/users/login
router.post('/login', loginUser);

export default router; // ייצוא ה-Router לשימוש ב-server.js
