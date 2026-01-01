# تحسين إغلاق الاستثمار
# Investment Closing Enhancement

## التاريخ / Date
2025-12-25

## التحسين / Enhancement
تعبئة سعر الإغلاق تلقائياً بالسعر الحالي للأصل.

### المشكلة السابقة / Previous Behavior
- عند فتح نافذة إغلاق الاستثمار، كان حقل "سعر البيع" يظهر فارغاً أو صفراً.
- كان المستخدم يحتاج لإدخال السعر يدوياً، حتى لو كان يريد البيع بسعر السوق الحالي.

### الحل / Solution
- تحديث دالة `onClick` لزر الإغلاق.
- نسخ `currentValue` (القيمة الحالية) إلى `sellPrice` (سعر البيع).
- تحديث كل من `formData` (للبيانات) و `inputValues` (لحقول الإدخال النصية).

### الكود / Code
```tsx
onClick={() => {
  setFormData({ 
    ...formData, 
    id: inv.id, 
    assetName: inv.assetName, 
    sellPrice: inv.currentValue // ✅ تعيين السعر الحالي
  });
  setInputValues({ 
    ...inputValues, 
    sellPrice: inv.currentValue.toString() // ✅ تحديث حقل الإدخال
  });
  setIsClosing(true);
  setShowModal(true);
}}
```

### الفائدة / Benefit
- توفير الوقت والجهد على المستخدم.
- تقليل احتمالية الخطأ في إدخال السعر.
- تجربة مستخدم أكثر سلاسة.
