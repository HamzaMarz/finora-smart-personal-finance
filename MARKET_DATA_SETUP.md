# إعدادات بيانات السوق (Market Data Setup)

تم تحديث النظام ليدعم مصادر بيانات متعددة للحصول على أسعار دقيقة وموثوقة لكل نوع من الأصول.

## المصادر المستخدمة / Data Providers

| نوع الأصل | المصدر | الرابط للحصول على مفتاح API |
|-----------|--------|-----------------------------|
| **الأسهم (Stocks)** | Finnhub | [Get Free API Key](https://finnhub.io/register) |
| **العملات الرقمية (Crypto)** | CoinMarketCap | [Get Free API Key](https://coinmarketcap.com/api/) |
| **الفوركس (Forex)** | ExchangeRate-API | [Get Free API Key](https://www.exchangerate-api.com/) |

## كيفية التفعيل / How to Activate

1. قم بالتسجيل في المواقع المذكورة أعلاه للحصول على المفاتيح المجانية.
2. افتح ملف `.env` في المجلد الرئيسي للمشروع.
3. قم بلصق المفاتيح في الأماكن المخصصة:

```env
# 1. Stocks: Finnhub
FINNHUB_API_KEY=الصق_مفتاح_finnhub_هنا

# 2. Crypto: CoinMarketCap
COINMARKETCAP_API_KEY=الصق_مفتاح_cmc_هنا

# 3. Forex: ExchangeRate-API
EXCHANGERATE_API_KEY=الصق_مفتاح_exchange_rate_هنا
```

## ملاحظات / Notes

- **Finnhub**: يوفر بيانات فورية للسوق الأمريكي والعالمي.
- **CoinMarketCap**: المصدر الموثوق لأسعار الكريبتو (يتطلب مفتاح API حتى للباقة المجانية).
- **ExchangeRate-API**: موثوق وسريع لأسعار صرف العملات.
- في حال عدم توفر مفتاح لأحد الخدمات، قد تظهر الأخطاء في جلب الأسعار لذلك النوع المحدد.
