/**
 * קובץ זה נוצר על ידינו.
 * תפקיד הקובץ: הגדרת מבנה הנתונים עבור רשימת המשימות (Checklist) של כל משתמש לכבוד שבת.
 */

import mongoose from 'mongoose'; // ייבוא ספריית Mongoose לעבודה מול MongoDB

// הגדרת סכמה משנית עבור משימה בודדת בתוך הרשימה
const checklistTaskSchema = new mongoose.Schema({
  title: {
    type: String, // כותרת המשימה (למשל: "האם חיברת את הפלטה?")
    required: true,
  },
  isCompleted: {
    type: Boolean, // האם המשימה בוצעה? (true/false)
    default: false, // כברירת מחדל, משימה חדשה היא "לא בוצעה"
  },
});

// הגדרת הסכמה המרכזית עבור הצ'קליסט השלם של המשתמש
const checklistSchema = new mongoose.Schema(
  {
    // קישור למשתמש שיצר את הרשימה (קשר מסוג "שייכות")
    user: {
      type: mongoose.Schema.Types.ObjectId, // מזהה ייחודי של משתמש ממסד הנתונים
      required: true,
      ref: 'User', // הפניה למודל ה-User
    },
    // מערך (Array) של משימות, כל אחת לפי המבנה שהגדרנו למעלה
    tasks: [checklistTaskSchema],
    // תאריך עדכון אחרון של הרשימה
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // הוספת שדות אוטומטיים של תאריכי יצירה ועדכון
    timestamps: true,
  }
);

// יצירת המודל מתוך הסכמה
const Checklist = mongoose.model('Checklist', checklistSchema);

// ייצוא המודל לשימוש בשרת
export default Checklist;
