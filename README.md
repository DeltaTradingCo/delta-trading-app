# برنامج متابعة الأعمال والصيانة — Delta Trading Co.
**Delta Trading Co.** · deltatradingco.eg@gmail.com

برنامج ويب باللغة العربية لمتابعة:
- **العملاء**: كل عميل يأخذ كود تلقائي `CH-001-26`، `CH-002-26`… (آخر رقمين = السنة)
- **عقود الصيانة** مع إنشاء جدول الزيارات تلقائياً (شهري / ربع سنوي / نصف سنوي…) وتنبيه قبل انتهاء العقد بـ30 يوم وزر تجديد
- **زيارات الصيانة** وطباعة تقرير زيارة بلوجو الشركة وخانات التوقيع
- **الأعمال الجديدة والجارية** (توريد، تركيب، إصلاح…) مع نسبة الإنجاز وموعد التسليم
- **المتابعة اليومية مع الفنيين**: مهام كل فني، وما تم تنفيذه، وإرسال مهام اليوم للفني على **واتساب**
- **تسجيل الدخول بحساب Gmail** للمدير والفنيين، والبيانات مشتركة بين كل الأجهزة
- تصدير Excel (CSV) ونسخ احتياطي

### الصلاحيات
| | المدير | الفني |
|---|---|---|
| العملاء والعقود والقيم المالية | ✅ كامل | ❌ |
| إضافة / حذف أي شيء | ✅ | ❌ |
| مهامه اليومية وزياراته وأعماله | ✅ الكل | ✅ الخاصة به فقط |
| تحديث حالة الزيارة وكتابة التقرير | ✅ | ✅ زياراته |
| تحديث نسبة إنجاز العمل | ✅ | ✅ أعماله |
| تسجيل عمل يومي | ✅ | ✅ باسمه |

المدير الرئيسي: **deltatradingco.eg@gmail.com**. ويمكن إضافة مديرين آخرين من صفحة الإعدادات.

---

## الخطوة 1: رفع البرنامج على GitHub (حوالي 10 دقائق)

1. ادخل على [github.com](https://github.com) واعمل حساب جديد **بإيميل الشركة** deltatradingco.eg@gmail.com
   (اسم المستخدم المقترح: `deltatradingco`).
2. اضغط **+** فوق ← **New repository**
   - Repository name: `delta-trading-app`
   - اختر **Public** ← **Create repository**
3. اضغط **uploading an existing file** واسحب الملفات: `index.html`، `firestore.rules`، `README.md` ← **Commit changes**
4. ادخل **Settings** ← **Pages** ← في Branch اختر `main` و `/ (root)` ← **Save**
5. بعد دقيقة أو اثنين يبقى البرنامج شغال على الرابط:
   **`https://deltatradingco.github.io/delta-trading-app/`**

> لحد هنا البرنامج بيشتغل في **الوضع المحلي** (البيانات على الجهاز فقط، من غير تسجيل دخول). كمّل الخطوة 2 لتفعيل الدخول بجيميل.

## الخطوة 2: تفعيل الدخول بجيميل والبيانات المشتركة (Firebase مجاني)

1. ادخل على [console.firebase.google.com](https://console.firebase.google.com) **بإيميل الشركة**
2. **Create a project** ← الاسم: `delta-trading` ← (Google Analytics مش ضروري) ← Create
3. **تفعيل الدخول بجوجل**: من القائمة **Build ← Authentication ← Get started**
   ← تبويب **Sign-in method** ← **Google** ← Enable ← اختر إيميل الشركة كـ Support email ← **Save**
4. **إضافة رابط GitHub**: في Authentication ← **Settings** ← **Authorized domains** ← **Add domain** ←
   اكتب: `deltatradingco.github.io`
5. **قاعدة البيانات**: **Build ← Firestore Database ← Create database**
   ← Location: `eur3 (europe-west)` ← **Start in production mode** ← Create
6. **قواعد الحماية**: في Firestore ← تبويب **Rules** ← امسح الموجود والصق محتوى ملف `firestore.rules` ← **Publish**
7. **بيانات الربط**: ⚙️ **Project settings** ← تحت Your apps اضغط أيقونة الويب **`</>`** ← اسم: `delta-web` ← Register app
   ← هيظهر كود فيه `const firebaseConfig = { apiKey: ..., ... }` — انسخ القيم.
8. ارجع لـ GitHub ← افتح `index.html` ← اضغط ✏️ (Edit) ← ابحث عن `FIREBASE_CONFIG` في أول السكريبت والصق القيم:
   ```js
   const FIREBASE_CONFIG = {
     apiKey: "AIza....",
     authDomain: "delta-trading.firebaseapp.com",
     projectId: "delta-trading",
     storageBucket: "delta-trading.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123"
   };
   ```
   ← **Commit changes**. بعد دقيقة افتح الرابط وهتظهر شاشة **تسجيل الدخول بحساب Google**.

## الخطوة 3: البدء
1. ادخل بإيميل الشركة (المدير).
2. من صفحة **الفنيين** أضف كل فني واكتب **حساب Gmail** الخاص به.
3. ابعت للفني رابط البرنامج، يفتحه من الموبايل ويدخل بالجيميل بتاعه. هيشوف مهامه بس.
   (نصيحة: من متصفح الموبايل ← "إضافة إلى الشاشة الرئيسية" عشان يفتح زي التطبيق.)
4. لو كنت جربت البرنامج في الوضع المحلي: نزّل **نسخة احتياطية** من الإعدادات قبل الربط، وبعد الدخول اعمل **استيراد** وهتترفع كل البيانات للسحابة.

---

### ملاحظات
- خطة Firebase المجانية (Spark) كافية جداً لشركة بحجم Delta Trading Co..
- قيم `apiKey` في الإعدادات عادي تكون ظاهرة. الحماية الفعلية في قواعد `firestore.rules`.
- لتغيير البريد الرئيسي للمدير: عدّله في `OWNER_EMAILS` داخل `index.html` **وفي** `firestore.rules`.
- الفني يقدر يقرأ بيانات الأعمال المسندة له. العقود وقيمها مقفولة عليه تماماً.
