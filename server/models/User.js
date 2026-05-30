/**
 * קובץ זה נוצר על ידינו.
 * תפקיד הקובץ: הגדרת מבנה הנתונים (Schema) עבור משתמש במערכת. זהו המודל שקובע איזה מידע יישמר עבור כל יהודי שנרשם לאפליקציה.
 */

import mongoose from 'mongoose'; // ייבוא ספריית Mongoose לעבודה מול MongoDB

// הגדרת הסכמה (המבנה) של המשתמש במסד הנתונים
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String, // סוג הנתון הוא מחרוזת טקסט
      required: true, // זהו שדה חובה
    },
    email: {
      type: String, // אימייל המשתמש
      required: true, // שדה חובה
      unique: true, // מבטיח שלא יהיו שני משתמשים עם אותו אימייל במערכת
    },
    password: {
      type: String, // הסיסמה (נשמרת כאן כ-Hash מוצפן ולא כטקסט פשוט)
      required: true, // שדה חובה
    },
    // שדה אופציונלי לשמירת המיקום האחרון של המשתמש לצורך זמני שבת
    location: {
      lat: {
        type: Number, // קו רוחב
      },
      lng: {
        type: Number, // קו אורך
      },
    },
  },
  {
    // הגדרה שמוסיפה אוטומטית שדות של 'createdAt' (נוצר ב-) ו-'updatedAt' (עודכן ב-)
    timestamps: true,
  }
);

// יצירת המודל מתוך הסכמה - המודל הוא הכלי שדרכו אנחנו מבצעים שאילתות (חיפוש, יצירה, עדכון)
const User = mongoose.model('User', userSchema);

// ייצוא המודל לשימוש בשאר חלקי השרת
export default User;
