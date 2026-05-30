/**
 * קובץ זה נוצר על ידינו.
 * תפקיד הקובץ: הגדרת נתיבי ה-API עבור ניהול רשימת המטלות (Checklist).
 * כל הנתיבים כאן מוגנים על ידי ה-Middleware 'protect', מה שאומר שרק משתמש מחובר יכול לגשת אליהם.
 */

import express from 'express'; // ייבוא Express
import { getChecklist, updateChecklistTask, setupChecklist } from '../controllers/checklistController.js'; // ייבוא הלוגיקה מה-Controller
import { protect } from '../middlewares/authMiddleware.js'; // ייבוא שכבת ההגנה (ווידוא שהמשתמש מחובר)

const router = express.Router(); // יצירת ה-Router

// נתיב לקבלת הצ'קליסט של המשתמש המחובר - בקשת GET לכתובת /api/checklist
router.get('/', protect, getChecklist);

// נתיב להגדרה ראשונית של הצ'קליסט - בקשת POST לכתובת /api/checklist/setup
router.post('/setup', protect, setupChecklist);

// נתיב לעדכון סטטוס של משימה ספציפית (בוצעה/לא בוצעה) - בקשת PUT לכתובת /api/checklist/:taskId
router.put('/:taskId', protect, updateChecklistTask);

export default router; // ייצוא ה-Router
