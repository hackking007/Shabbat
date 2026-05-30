/**
 * קובץ זה נוצר על ידינו.
 * תפקיד הקובץ: ניהול תהליכי הרשמה והתחברות של משתמשים (Authentication).
 */

import User from '../models/User.js'; // ייבוא מודל המשתמש מה-Database כדי לבצע שאילתות
import bcrypt from 'bcryptjs'; // ייבוא ספרייה להצפנת סיסמאות (Hashing) לטובת אבטחה
import jwt from 'jsonwebtoken'; // ייבוא ספרייה ליצירת טוקנים (Tokens) לאימות המשתמש מול השרת
import { z } from 'zod'; // ייבוא ספרייה לבדיקת תקינות נתונים (Validation) שנשלחים מהמשתמש

// הגדרת סכמת אימות (Schema) להרשמה - מוודא שהנתונים שנשלחו תקינים
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'), // השם חייב להיות מחרוזת באורך 2 תווים לפחות
  email: z.string().email('Invalid email address'), // האימייל חייב להיות בפורמט תקין
  password: z.string().min(6, 'Password must be at least 6 characters'), // הסיסמה חייבת להכיל לפחות 6 תווים
});

// הגדרת סכמת אימות להתחברות
const loginSchema = z.object({
  email: z.string().email('Invalid email address'), // בדיקת פורמט אימייל
  password: z.string(), // הסיסמה נדרשת (אך לא בודקים אורך בבדיקה זו)
});

// פונקציה עזר ליצירת Token - מזהה דיגיטלי שמאפשר למשתמש להישאר מחובר
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_fallback', { // חתימה על הטוקן עם מפתח סודי מהגדרות המערכת
    expiresIn: '30d', // הטוקן יהיה תקף למשך 30 יום
  });
};

// פונקציה לרישום משתמש חדש במערכת
export const registerUser = async (req, res) => {
  try {
    // בדיקה שהנתונים שהגיעו בבקשה (body) תואמים את הסכמה שהגדרנו
    const { name, email, password } = registerSchema.parse(req.body);

    // בדיקה מול ה-Database אם כבר קיים משתמש עם האימייל הזה
    const userExists = await User.findOne({ email });
    if (userExists) {
      // אם המשתמש קיים, מחזירים שגיאה 400 (בקשה לא תקינה)
      return res.status(400).json({ message: 'User already exists' });
    }

    // תהליך הצפנת הסיסמה (אנחנו לא שומרים סיסמאות כטקסט פשוט)
    const salt = await bcrypt.genSalt(10); // יצירת "מלח" (Salt) להוספת אקראיות להצפנה
    const hashedPassword = await bcrypt.hash(password, salt); // יצירת ה-Hash (הסיסמה המוצפנת)

    // יצירת המשתמש החדש במסד הנתונים
    const user = await User.create({
      name,
      email,
      password: hashedPassword, // שומרים רק את הסיסמה המוצפנת
    });

    if (user) {
      // אם היצירה הצליחה, מחזירים את נתוני המשתמש (ללא סיסמה) וטוקן להתחברות מיידית
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      // אם חלה שגיאה לא צפויה ביצירה
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    // טיפול בשגיאות שנובעות מאימות נתונים לא תקין (Zod)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    // שגיאת שרת כללית
    res.status(500).json({ message: 'Server error' });
  }
};

// פונקציה להתחברות משתמש קיים (Login)
export const loginUser = async (req, res) => {
  try {
    // בדיקת תקינות הקלט שנשלח מהמשתמש
    const { email, password } = loginSchema.parse(req.body);

    // חיפוש המשתמש במסד הנתונים לפי אימייל
    const user = await User.findOne({ email });

    // בדיקה: האם המשתמש נמצא? והאם הסיסמה שהזין תואמת לסיסמה המוצפנת במסד הנתונים?
    if (user && (await bcrypt.compare(password, user.password))) {
      // אם הכל תקין, מחזירים את פרטי המשתמש וטוקן חדש
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      // אם האימייל לא קיים או שהסיסמה שגויה, מחזירים שגיאה 401 (לא מורשה)
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    // טיפול בשגיאות קלט
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    // שגיאת שרת כללית
    res.status(500).json({ message: 'Server error' });
  }
};
