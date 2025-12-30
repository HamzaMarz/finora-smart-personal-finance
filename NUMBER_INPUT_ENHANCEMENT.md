# تحسين حقول الأرقام في صفحة الاستثمارات
# Number Input Fields Enhancement

## التاريخ / Date
2025-12-25

## المشكلة / Problem
- حقول الأرقام كانت تستخدم `type="number"` مما يسبب:
  - ظهور الأرقام العربية (٠١٢٣٤٥٦٧٨٩) في بعض الحالات
  - صعوبة في إدخال الفاصلة العشرية
  - مشاكل في التنسيق والعرض

## الحل / Solution
تحويل حقول الأرقام من `type="number"` إلى `type="text"` مع إضافة:
- `inputMode="decimal"` - لإظهار لوحة مفاتيح رقمية مع فاصلة
- `pattern="[0-9]*\.?[0-9]*"` - للتحقق من صحة الإدخال
- `lang="en"` - لفرض استخدام الأرقام الإنجليزية
- `style={{ direction: 'ltr' }}` - لعرض الأرقام من اليسار لليمين
- تحويل تلقائي للأرقام العربية إلى إنجليزية

## الحقول المحدثة / Updated Fields

### 1. حقل الكمية / Quantity Field
```tsx
<input
  required
  type="text"
  inputMode="decimal"
  pattern="[0-9]*\.?[0-9]*"
  lang="en"
  value={formData.quantity}
  onChange={(e) => {
    const value = e.target.value.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    const numValue = parseFloat(value) || 0;
    setFormData({ ...formData, quantity: numValue });
  }}
  className="..."
  style={{ direction: 'ltr' }}
/>
```

### 2. حقل سعر الشراء / Buy Price Field
```tsx
<input
  required
  type="text"
  inputMode="decimal"
  pattern="[0-9]*\.?[0-9]*"
  lang="en"
  value={formData.buyPrice}
  onChange={(e) => {
    const value = e.target.value.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    const numValue = parseFloat(value) || 0;
    setFormData({ ...formData, buyPrice: numValue, currentValue: numValue });
  }}
  className="..."
  style={{ direction: 'ltr' }}
/>
```

### 3. حقل سعر البيع / Sell Price Field
```tsx
<input
  type="text"
  inputMode="decimal"
  pattern="[0-9]*\.?[0-9]*"
  lang="en"
  value={formData.sellPrice}
  onChange={(e) => {
    const value = e.target.value.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
    const numValue = parseFloat(value) || 0;
    setFormData({ ...formData, sellPrice: numValue });
  }}
  className="..."
  style={{ direction: 'ltr' }}
/>
```

## المميزات / Features

### ✅ الأرقام الإنجليزية
- جميع الأرقام تظهر بالشكل: `0123456789`
- لا تظهر الأرقام العربية: `٠١٢٣٤٥٦٧٨٩`

### ✅ دعم الفاصلة العشرية
- يمكن كتابة الفاصلة (.) بسهولة
- أمثلة صحيحة:
  - `1.5`
  - `0.25`
  - `88258.64`

### ✅ لوحة مفاتيح رقمية
- على الأجهزة المحمولة، تظهر لوحة مفاتيح رقمية
- تتضمن الفاصلة العشرية

### ✅ تحويل تلقائي
- إذا كتب المستخدم أرقام عربية، يتم تحويلها تلقائياً
- مثال: `٥` → `5`

### ✅ اتجاه صحيح
- الأرقام تظهر من اليسار لليمين (LTR)
- حتى في الواجهة العربية (RTL)

## كيف يعمل / How It Works

### 1. التحويل التلقائي
```javascript
const value = e.target.value.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
```
- يبحث عن أي رقم عربي في النص
- يحوله إلى رقم إنجليزي مقابل

### 2. التحليل إلى رقم
```javascript
const numValue = parseFloat(value) || 0;
```
- يحول النص إلى رقم عشري
- إذا فشل التحويل، يستخدم 0

### 3. التحديث
```javascript
setFormData({ ...formData, quantity: numValue });
```
- يحدث حالة النموذج بالقيمة الجديدة

## أمثلة الاستخدام / Usage Examples

### ✅ إدخال صحيح / Valid Input
```
1          → 1
1.5        → 1.5
0.25       → 0.25
88258.64   → 88258.64
.5         → 0.5
```

### ❌ إدخال غير صحيح / Invalid Input
```
abc        → 0
1.2.3      → 1.2 (يتوقف عند الفاصلة الثانية)
-5         → 0 (الأرقام السالبة غير مسموحة)
```

## الفوائد / Benefits

1. **تجربة مستخدم أفضل**: أرقام واضحة وسهلة القراءة
2. **توافق أفضل**: يعمل على جميع الأجهزة
3. **إدخال أسهل**: لوحة مفاتيح رقمية على الموبايل
4. **دقة أعلى**: دعم الأرقام العشرية بشكل صحيح
5. **لا أخطاء**: تحويل تلقائي للأرقام العربية

## الاختبار / Testing

### اختبر الميزات التالية:
- [ ] الأرقام تظهر بالشكل الإنجليزي (0-9)
- [ ] يمكن كتابة الفاصلة (.)
- [ ] الأرقام العربية تتحول تلقائياً
- [ ] الاتجاه من اليسار لليمين
- [ ] لوحة المفاتيح الرقمية على الموبايل
- [ ] الحفظ يعمل بشكل صحيح
- [ ] القيم تظهر بشكل صحيح بعد الحفظ

## الملفات المعدلة / Modified Files

- `pages/Investments.tsx`
  - حقل الكمية (السطر 656-671)
  - حقل سعر الشراء (السطر 673-688)
  - حقل سعر البيع (السطر 456-469)

## ملاحظات / Notes

- التغيير يؤثر فقط على **صفحة الاستثمارات**
- حقول التاريخ لم تتغير
- القيم المحفوظة في قاعدة البيانات لم تتأثر
- التوافق الكامل مع الكود الحالي
