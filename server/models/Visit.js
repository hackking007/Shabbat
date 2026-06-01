/**
 * קובץ זה נוצר על ידינו.
 * תפקיד הקובץ: מודל פשוט לספירת כניסות לאתר (Visit Counter).
 * שומר מסמך בודד עם מונה שעולה בכל כניסה לדף הבית.
 */

import mongoose from 'mongoose'; // ייבוא Mongoose לעבודה מול MongoDB

// סכמה עם מפתח קבוע ('site') ומונה כניסות אחד לכל האתר
const visitSchema = new mongoose.Schema({
  key: { type: String, default: 'site', unique: true }, // מזהה קבוע - מסמך אחד בלבד
  count: { type: Number, default: 0 }, // מספר הכניסות הכולל
});

const Visit = mongoose.model('Visit', visitSchema); // יצירת המודל

export default Visit; // ייצוא לשימוש בשאר השרת
