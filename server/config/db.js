import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/shabbat-app');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // לא מפילים את כל השרת אם אין מסד נתונים - האתר וזמני השבת ימשיכו לעבוד,
    // ורק התחברות/הרשמה/צ'קליסט יחזירו שגיאה מסודרת עד שיוגדר MONGO_URI תקין.
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.error('⚠️  Login, registration and checklist require a valid MONGO_URI (e.g. MongoDB Atlas).');
  }
};
