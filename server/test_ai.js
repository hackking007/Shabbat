import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: 'אתה עוזר יהודי בקי בתורה, בהלכה ובקבלה. עונה תמיד בעברית תקנית, עשירה ומעוררת השראה.',
});

async function test() {
  const parashaHebrew = 'אמור';
  const prompt = `כתוב תוכן עשיר, מרתק ומעמיק לשבת עבור ${parashaHebrew}. 
התוכן צריך להיות ארוך ומפורט, ולכלול תובנות עמוקות הן מתוך הפשט והן מתוך עולמות הקבלה והחסידות. 
אל תכתוב תמציתי - כתוב בצורה שתרתק את הקורא בשולחן השבת. החזר JSON בלבד במבנה הבא:
{
  "dvarTorah": "דבר תורה עשיר ומעמיק (לפחות 6-8 משפטים ארוכים), המשלב רעיונות מהפשט והסברים רוחניים",
  "parashaSummary": "הסבר מרתק ומעניין של פרשת השבוע שכולל סיכום סיפורי (6-8 משפטים)",
  "segulot": "סגולה מיוחדת לשבת מתוך ספרי המקובלים או החסידות עם הסבר רוחני",
  "prophetsStory": "סיפור מתוך הנביאים שקשור לפרשת השבוע הנוכחית עם קשר מרתק וסימבולי (8-10 משפטים)",
  "baalHaTanyaHalachot": ["הלכה עמוקה מבעל התניא עם טעם רוחני", "עוד הלכה"],
  "halachot": ["הלכה חשובה", "עוד הלכה מעשית"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    console.log("Raw response:", raw);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    console.log("Parsed JSON keys:", Object.keys(parsed));
  } catch (err) {
    console.error("Error generating content:", err);
  }
}
test();
