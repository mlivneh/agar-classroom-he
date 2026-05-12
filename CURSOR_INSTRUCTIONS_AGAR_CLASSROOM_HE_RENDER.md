# הוראות לקרסר — Agar.io Classroom בעברית + התקנה על Render.com

## מטרת העבודה

יש לנו משחק מוכן מסוג Agar.io clone, כתוב ב־Node.js, Express, Socket.IO ו־HTML5 Canvas.

המטרה היא לא לבנות משחק חדש, אלא לבצע התאמות מינימליות:

1. שהשרת ירוץ ב־Render.com כ־Web Service.
2. שהממשק יהיה בעברית ו־RTL.
3. שהמשחק יתאים לשימוש כיתתי בסיסי.
4. לא לשנות את לוגיקת המשחק, הפיזיקה, Socket.IO, או מנגנון המולטיפלייר.

## עיקרון עבודה חשוב

אין לבצע refactor רחב.
אין להחליף ארכיטקטורה.
אין להעביר את המשחק ל־Firebase.
אין לבנות מחדש את ה־client.
אין לשנות את מנגנון התנועה, האכילה, המסה, הווירוסים או הצ'אט, אלא אם נדרש במפורש.

עובדים על הקיים בלבד.

---

# מבנה הפרויקט הרלוונטי

הקבצים החשובים הם:

```text
package.json
config.js
src/server/server.js
src/client/index.html
src/client/css/main.css
src/client/js/app.js
src/client/js/render.js
src/client/js/chat-client.js
src/client/js/canvas.js
```

## שרת

השרת נמצא כאן:

```text
src/server/server.js
```

בסוף הקובץ קיימות השורות:

```js
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || config.host;
var serverport = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || config.port;
http.listen(serverport, ipaddress, () => console.log('[DEBUG] Listening on ' + ipaddress + ':' + serverport));
```

אין בקובץ `server.listen`.
אין לחפש `server.listen`.
יש לטפל ב־`http.listen`.

---

# שלב 1 — התאמת השרת ל־Render.com

Render מספק אוטומטית משתנה סביבה:

```text
PORT
```

לכן השרת חייב להאזין ל־`process.env.PORT`.

המצב הנוכחי כמעט מתאים, כי יש:

```js
process.env.PORT || config.port
```

אבל כדי למנוע בעיות ב־Render, יש להחליף את שלוש השורות האחרונות בגרסה נקייה:

```js
var ipaddress = process.env.IP || config.host || '0.0.0.0';
var serverport = process.env.PORT || config.port || 3000;

http.listen(serverport, ipaddress, () => {
  console.log('[DEBUG] Listening on ' + ipaddress + ':' + serverport);
});
```

הסיבה:
- Render משתמש ב־`PORT`.
- אין צורך ב־`OPENSHIFT_NODEJS_PORT`.
- `0.0.0.0` תקין לשרת בענן.
- אין להשתמש ב־`localhost`.

---

# שלב 2 — בדיקת package.json

ב־`package.json` קיימים scripts:

```json
"scripts": {
  "build": "gulp build",
  "start": "gulp run",
  "watch": "gulp watch",
  "test": "gulp test"
}
```

בשלב ראשון לא משנים את זה.

Render יריץ:

```bash
npm install
npm start
```

כלומר `npm start` יריץ:

```bash
gulp run
```

אם Render נכשל בגלל `gulp run`, רק אז לשנות את `start`.

לא לשנות מראש בלי צורך.

---

# שלב 3 — בדיקה מקומית לפני Render

בטרמינל בתיקיית הפרויקט:

```bash
npm install
npm start
```

לאחר מכן לפתוח:

```text
http://localhost:3000
```

בדיקות חובה:
1. המשחק נטען.
2. ניתן להזין שם שחקן.
3. ניתן להיכנס למשחק.
4. שני טאבים באותו מחשב רואים אחד את השני.
5. אפשר לאכול food.
6. הצ'אט לא שובר את המשחק.

רק אחרי שזה עובד מקומית ממשיכים ל־Render.

---

# שלב 4 — עברית ו־RTL

## index.html

בקובץ:

```text
src/client/index.html
```

יש לעדכן את תגית html:

```html
<html lang="he" dir="rtl">
```

אם אין תגית כזו, להוסיף/לתקן את הקיימת.

## טקסטים לתרגום

יש לתרגם רק טקסטים שמופיעים למשתמש:

- Play
- Spectate
- Settings
- Nickname
- Enter your name
- Leaderboard
- Chat
- Type here
- Instructions
- How to Play
- Game Over
- Respawn
- Continue
- Connecting
- Disconnected

תרגום מומלץ:

```text
Play → שחק
Spectate → צפייה
Settings → הגדרות
Nickname → כינוי
Enter your name → כתוב כינוי
Leaderboard → טבלת מובילים
Chat → צ'אט
Type here → כתוב כאן
Instructions → הוראות
How to Play → איך משחקים
Game Over → המשחק הסתיים
Respawn → חזור למשחק
Continue → המשך
Connecting → מתחבר...
Disconnected → נותקת מהשרת
```

לא לתרגם שמות משתנים.
לא לתרגם event names.
לא לתרגם socket message names.
לא לתרגם שמות פונקציות.

---

# שלב 5 — CSS לעברית

בקובץ:

```text
src/client/css/main.css
```

להוסיף בסוף הקובץ:

```css
html, body {
  direction: rtl;
  font-family: Arial, "Rubik", "Assistant", sans-serif;
}

input, button, textarea {
  font-family: inherit;
}

input, textarea {
  direction: rtl;
  text-align: right;
}
```

לא להפוך את כל ה־canvas.
ה־canvas של המשחק עצמו חייב להישאר רגיל.

---

# שלב 6 — Canvas ושמות שחקנים בעברית

אם שמות שחקנים בעברית נראים הפוכים או לא מיושרים, לחפש בקבצים:

```text
src/client/js/render.js
src/client/js/canvas.js
```

את השימוש ב:

```js
fillText
```

לפני ציור שם השחקן בלבד, להוסיף:

```js
ctx.direction = 'rtl';
ctx.textAlign = 'center';
```

חשוב:
- לא להחיל RTL על כל ציור המשחק.
- רק על טקסט.
- לא להפוך קואורדינטות.
- לא להשתמש ב־CSS transform על canvas.

---

# שלב 7 — התאמה כיתתית מינימלית

בשלב ראשון לא מוסיפים Firebase ולא מערכת חדרים.

עושים רק התאמות קלות:

## שם המשחק

במסך הפתיחה להציג:

```text
Agar כיתתי
```

או:

```text
קרב העיגולים הכיתתי
```

## הוראות קצרות בעברית

להוסיף במסך הפתיחה:

```text
איך משחקים?
זוזו עם העכבר או האצבע.
אכלו נקודות כדי לגדול.
שחקן גדול יכול לאכול שחקן קטן.
המטרה: לשרוד ולגדול כמה שיותר.
```

## אזהרה קצרה

```text
בחרו כינוי מכבד. המורה רואה את שמות השחקנים.
```

---

# שלב 8 — התקנה על Render.com

ב־Render יש ליצור:

```text
New → Web Service
```

לא Static Site.

הגדרות:

```text
Runtime: Node
Build Command: npm install
Start Command: npm start
```

אין להגדיר port ידנית ב־Render.
Render יגדיר `PORT` לבד.

לאחר deploy, הכתובת תהיה בערך:

```text
https://agar-classroom-he.onrender.com
```

---

# שלב 9 — בדיקות אחרי Render

לאחר העלאה ל־Render:

1. לפתוח את כתובת Render במחשב.
2. לפתוח אותה גם בטלפון.
3. להיכנס בשני שמות שונים.
4. לוודא ששני השחקנים רואים אחד את השני.
5. לבדוק תנועה.
6. לבדוק אכילת food.
7. לבדוק צ'אט.
8. לבדוק שאין הודעות שגיאה ב־Render Logs.
9. לבדוק שאין הודעות שגיאה ב־Browser Console.

---

# שלב 10 — בעיות צפויות

## בעיה: Render מראה שהשרת עלה אבל האתר לא נפתח

לבדוק שהשרת מאזין ל:

```js
process.env.PORT
```

ולא רק ל־3000.

## בעיה: המשחק עובד מקומית אבל לא ב־Render

לבדוק logs ב־Render.
בדרך כלל הסיבה:
- build נכשל
- npm start נכשל
- native dependency כמו sqlite3 עושה בעיה
- gulp לא מצליח לרוץ

## בעיה: עברית נראית הפוכה על המפה

לתקן רק את `ctx.direction` סביב `fillText`.

## בעיה: כל המשחק התהפך לצד ימין

כנראה הופעל RTL או transform על canvas.
לבטל.
רק UI בעברית; המשחק עצמו לא מתהפך.

---

# גבולות השינוי

## מותר לשנות

```text
src/client/index.html
src/client/css/main.css
src/client/js/app.js
src/client/js/chat-client.js
src/client/js/render.js
src/client/js/canvas.js
src/server/server.js
```

## לא לשנות בלי בקשה מפורשת

```text
src/server/map/player.js
src/server/map/food.js
src/server/map/virus.js
src/server/game-logic.js
Socket.IO event names
movement logic
collision logic
mass logic
virus logic
split/feed mechanics
```

---

# יעד סיום ראשון

היעד הראשון הוא לא משחק מתמטי.

היעד הראשון:

```text
Agar.io clone עובד בעברית, רץ ב־Render.com, וכל הכיתה יכולה להיכנס מאותה כתובת ולשחק באותה זירה.
```

רק אחרי שהיעד הזה עובד, מוסיפים:
- חדרים
- מורה
- ניקוד כיתתי
- שאלות מתמטיקה
- קבוצות
- אינטגרציה עם Firebase או NeoSoc
