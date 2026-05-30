/**
 * קובץ זה נוצר על ידינו.
 * תפקיד הקובץ: ניהול הבאת מידע על זמני שבת, פרשת השבוע והפקת תוכן רוחני באמצעות בינה מלאכותית (AI).
 */

import { GoogleGenerativeAI } from '@google/generative-ai'; // ייבוא הספרייה של גוגל לשימוש במודל Gemini AI
import { find as findTimezone } from 'geo-tz'; // ייבוא ספרייה לזיהוי אזור זמן אוטומטי לפי קואורדינטות (Lat/Lng)

// בדיקה האם הוגדר מפתח API לג'מיני (אופציונלי - אם לא, נשתמש בתוכן גיבוי מובנה)
const hasAIKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());

// אתחול הממשק לבינה המלאכותית רק אם קיים מפתח API תקין
const model = hasAIKey
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({
      model: 'gemini-2.5-flash', // שימוש במודל ה-Flash החדיש והנתמך לקבלת תשובות מהירות ומדויקות
      systemInstruction: 'אתה עוזר יהודי בקי בתורה, בהלכה ובקבלה. עונה תמיד בעברית תקנית, עשירה ומעוררת השראה.',
    })
  : null;

if (!hasAIKey) {
  console.log('ℹ️  GEMINI_API_KEY not set - using built-in Hebrew fallback content for parasha info.');
}

// יצירת זיכרון זמני (Cache) כדי לא לייצר תוכן זהה פעמיים ולחסוך בשימוש ב-API
const contentCache = new Map();

// הפונקציה המרכזית לשליפת נתוני שבת וייצור תוכן
export const getShabbatInfo = async (req, res) => {
  // קבלת המיקום (קו רוחב, קו אורך ושם עיר) מהבקשה שנשלחה מהדפדפן
  const { lat, lng, cityName } = req.query;

  // בדיקה בסיסית שהתקבלו קואורדינטות תקינות
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'נדרשים קואורדינטות תקינות' });
  }

  try {
    // מציאת אזור הזמן המתאים למיקום הגאוגרפי (למשל: Asia/Jerusalem)
    const timezones = findTimezone(parseFloat(lat), parseFloat(lng));
    const tzid = timezones[0] || 'UTC'; // ברירת מחדל ל-UTC אם לא נמצא

    // בניית כתובת ה-API של HebCal לקבלת זמני שבת ומועדים
    const hebcalUrl = new URL('https://www.hebcal.com/shabbat');
    hebcalUrl.searchParams.set('cfg', 'json'); // אנחנו רוצים את התשובה בפורמט JSON
    hebcalUrl.searchParams.set('latitude', lat);
    hebcalUrl.searchParams.set('longitude', lng);
    hebcalUrl.searchParams.set('tzid', tzid);
    hebcalUrl.searchParams.set('M', 'on'); // בקשת זמנים לפי שיטת רבנו תם אם זמין

    // ביצוע הקריאה ל-API החיצוני של HebCal
    const hebcalRes = await fetch(hebcalUrl);
    if (!hebcalRes.ok) throw new Error(`HebCal error: ${hebcalRes.status}`);
    const hebcalData = await hebcalRes.json();

    // משתנים לשמירת המידע שנחלץ מהתשובה
    let candleLighting = null;
    let havdalah = null;
    let parashaHebrew = null;
    let shabbatDate = null;

    // מעבר על רשימת האירועים שהתקבלו ושליפת הנתונים הרלוונטיים לנו
    for (const item of (hebcalData.items || [])) {
      if (item.category === 'candles') {
        // עיבוד זמן הדלקת נרות לפורמט שעון מקומי (למשל: 18:30)
        candleLighting = new Date(item.date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: tzid });
        // עיבוד תאריך השבת לפורמט עברי קריא (למשל: יום שישי, י"ב באייר)
        shabbatDate = new Date(item.date).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: tzid });
      }
      if (item.category === 'havdalah') {
        // עיבוד זמן צאת השבת
        havdalah = new Date(item.date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: tzid });
      }
      if (item.category === 'parashat') {
        // שמירת שם פרשת השבוע בעברית
        parashaHebrew = item.hebrew || item.title;
      }
    }

    // אם ה-API לא החזיר פרשה (למשל בחג), נשים ערך ברירת מחדל
    if (!parashaHebrew) parashaHebrew = 'השבוע';

    // בדיקה בזיכרון הזמני אם כבר ייצרנו תוכן לפרשה הזו בעבר
    let claudeContent = contentCache.get(parashaHebrew);
    
    // אם אין תוכן בזיכרון, נפנה לבינה המלאכותית (Gemini)
    if (!claudeContent) {
      try {
        // בניית ההנחיה המפורטת ל-AI
        const prompt = `כתוב תוכן עשיר, מרתק ומעמיק לשבת עבור ${parashaHebrew}. 
התוכן צריך להיות ארוך ומפורט, ולכלול תובנות עמוקות הן מתוך הפשט והן מתוך עולמות הקבלה והחסידות. 
אל תכתוב תמציתי - כתוב בצורה שתרתק את הקורא בשולחן השבת. החזר JSON בלבד במבנה הבא:
{
  "dvarTorah": "דבר תורה עשיר ומעמיק (לפחות 6-8 משפטים ארוכים), המשלב רעיונות מהפשט והסברים רוחניים",
  "parashaSummary": "הסבר מרתק ומעניין של פרשת השבוע שכולל סיכום סיפורי (6-8 משפטים)",
  "segulot": "סגולה מיוחדת לשבת מתוך ספרי המקובלים או החסידות עם הסבר רוחני",
  "prophetsStory": "סיפור מתוך הנביאים שקשור לפרשת השבוע הנוכחית עם קשר מרתק וסימבולי (8-10 משפטים)",
  "baalHaTanyaHalachot": ["הלכה עמוקה מהאדמו\\"ר הזקן עם טעם רוחני", "עוד הלכה"],
  "halachot": ["הלכה חשובה", "עוד הלכה מעשית"]
}`;
        // אם אין מפתח API, מדלגים ישירות לתוכן הגיבוי בלי לזרוק שגיאה רועשת
        if (!model) throw new Error('NO_AI_KEY');

        // שליחת הבקשה ליצירת תוכן
        const result = await model.generateContent(prompt);
        const raw = result.response.text().trim();
        
        // ניקוי התשובה ושליפת אובייקט ה-JSON
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        claudeContent = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
        
        // שמירת התוכן בזיכרון הזמני
        contentCache.set(parashaHebrew, claudeContent);
      } catch (aiErr) {
        // טיפול במקרה של שגיאה בבינה המלאכותית (למשל: חוסר במכסה או שגיאת תקשורת)
        if (aiErr.message !== 'NO_AI_KEY') {
          console.error('AI Error:', aiErr.message);
        }
        
        // שימוש בתוכן גיבוי (Fallback) אם אנחנו בפרשת אמור, או לכל פרשה אחרת במקרה של שגיאה כדי שהמשתמש לא יראה דף ריק
        if (parashaHebrew && parashaHebrew.includes('אמור')) {
          claudeContent = {
            dvarTorah: "פרשת אמור פותחת בציווי לכהנים להישמר מטומאת מת, 'אמור אל הכהנים... לנפש לא יטמא בעמיו'. ציווי זה אינו רק הרחקה טכנית, אלא קריאה עמוקה לחיבור לחיים. הכהן מסמל את החיבור לאלוקות, ועליו להיות סמל של תקווה. החסידות מלמדת שכל יהודי הוא 'כהן' בסביבתו, ועליו להימנע מ'טומאת מת' רוחנית – ייאוש או עצבות. הכפילות 'אמור ואמרת' מלמדת להזהיר גדולים על קטנים - עלינו להעביר את האור הזה לילדינו מתוך דוגמה אישית.",
            parashaSummary: "פרשת אמור עוסקת בעיקר בדיני הקדושה המיוחדים לכהנים ולכהן הגדול, ובחגים ובמועדי ישראל לאורך השנה. היא מפרטת את איסורי הטומאה למתים ואיסורי נישואין של הכהנים, ואת המומים הפוסלים כהן או קרבן. החלק המרכזי של הפרשה הוא 'פרשת המועדות' – סקירה מקיפה ומרתקת של כל חגי ומועדי ישראל: שבת, פסח, ספירת העומר, שבועות, ראש השנה, יום הכיפורים וסוכות. הפרשה מסתיימת בסיפורו של 'המקלל'.",
            segulot: "סגולה ידועה היא לומר את 'פרשת המועדות' מתוך פרשת אמור לפני הקידוש בשבת, כדי למשוך את קדושת כל מועדי השנה לתוך השבת הנוכחית, המהווה מקור לכל החגים.",
            prophetsStory: "ההפטרה מספר יחזקאל (מ\"ד) מתארת את דיני הכהנים בני צדוק בבית המקדש השלישי העתידי. הקשר לפרשתנו סמלי ומרתק: יחזקאל שניבא בגלות, לאחר החורבן, נוטע בעם תקווה שדווקא מי ששמר על קדושתו בזמנים הקשים ('בני צדוק אשר שמרו את משמרת מקדשי') יזכה לעבוד במקדש. זהו מסר נצחי - שמירה על קדושה ואור גם בגלות, היא הבונה את המקדש העתידי.",
            baalHaTanyaHalachot: [
              "במאמרי אדמו\"ר הזקן (לקוטי תורה) לפרשת אמור מוסבר שספירת העומר היא תהליך פנימי ועמוק של בירור וזיכוך. העומר מורכב משעורים - מאכל בהמה. זה מסמל את עבודת האדם לזכך את ה'נפש הבהמית' שלו. 49 ימי הספירה מקבילים ל-49 המידות שבלב האדם, ובכל יום אנו מתקנים ומזככים מידה אחת נוספת לקראת מתן תורה.",
              "בעל התניא מסביר שמועדי ה' (המוזכרים בפרשה) אינם רק זכר היסטורי, אלא זמנים בהם 'מאיר האור' מחדש. בכל שבת ובכל חג יורד שפע רוחני עצום המיוחד לאותו זמן, ותפקידנו הוא להוות 'כלי' לאותו שפע על ידי תפילה בכוונה, שמחה ושמירת קדושת הזמן."
            ],
            halachot: ["יש להקפיד לברך על ספירת העומר מדי ערב לאחר צאת הכוכבים.", "יש מצווה מיוחדת להוסיף בתענוג שבת, מעבר לסעודות החובה, לביטוי קדושת היום."]
          };
        } else {
          // תוכן גיבוי כללי לכל שאר הפרשיות המציג תוכן רוחני יפהפה במקום שגיאות API
          claudeContent = {
            dvarTorah: `פרשת ${parashaHebrew} מזמינה אותנו להתבונן בקשר העמוק שבין האדם לבוראו ובקדושת השבת. חז"ל והחסידות מלמדים שכל פרשה נקראת בדיוק בזמן שבו האור הרוחני שלה נחוץ לעולם. השבת היא מקור הברכה לשבוע כולו, וכאשר אנו לומדים את פרשת השבוע ומתבוננים במסריה, אנו מקבלים כוחות וחיות להאיר את ששת ימי המעשה ולעבוד את ה' מתוך שמחה וטוב לבב.`,
            parashaSummary: `פרשת ${parashaHebrew} נקראת השבוע בבתי הכנסת. הפרשה כוללת תובנות רוחניות ומצוות המדריכות אותנו בנתיבות התורה, בתיקון המידות ובהתעלות רוחנית. מתוך לימוד הפרשה והתבוננות בסיפוריה אנו למדים כיצד להביא שלום, אחדות וברכה לביתנו ולעולם כולו.`,
            segulot: "סגולה מיוחדת לשבת קודש היא ללמוד תורה בשמחה, לומר שיר השירים לפני כניסת השבת ולהרבות בצדקה בערב שבת, המושכים ברכה מרובה והצלחה בכל מעשה ידינו.",
            prophetsStory: `הפטרת פרשת ${parashaHebrew} מביאה מדברי הנביאים המקשרים בין הנהגת עם ישראל בפרשה לבין הגאולה השלמה והבטחת השלום הנצחי, ומזכירה לנו את הציפייה התמידית לביאת משיח צדקנו במהרה.`,
            baalHaTanyaHalachot: [
              "בספר התניא מוסבר כי הנפש האלוקית של כל יהודי היא 'חלק אלוקה ממעל ממש', ובכל שבת קודש מאירה בה 'תוספת נשמה' המאפשרת לה לחוש קירבה גדולה יותר להשם יתברך.",
              "בעל התניא מלמד כי עיקר שמחת השבת צריכה להיות שמחה רוחנית של דביקות בבורא וחיזוק האמונה והאהבה הפנימית השוכנת בלב כל אחד מישראל."
            ],
            halachot: [
              "מצווה להקדים ולסיים את ההכנות לשבת קודם כניסת השבת, כדי לקבל את השבת בנחת וברוגע.",
              "יש להקפיד על שלום בית וכבוד הדדי במיוחד בערב שבת, המהווה כלי מחזיק ברכה לקדושת השבת כולה."
            ]
          };
        }
      }
    }

    // החזרת התוצאה הסופית ל-Frontend כ-JSON
    res.json({
      parasha: parashaHebrew,
      candleLighting,
      havdalah,
      shabbatDate,
      locationTitle: cityName || hebcalData.location?.title || 'ירושלים',
      ...claudeContent // שילוב התוכן הרוחני בתוך התשובה
    });

  } catch (err) {
    // טיפול בשגיאה חמורה שקרסה בדרך
    console.error('Final Server error:', err);
    res.status(500).json({ error: 'שגיאה כללית בשרת' });
  }
};
