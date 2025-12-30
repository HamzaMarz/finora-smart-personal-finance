import axios from 'axios';

// API Configurations
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';
const EXCHANGERATE_BASE_URL = 'https://v6.exchangerate-api.com/v6';
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

export interface MarketAsset {
    symbol: string;
    name: string;
    type: string;
    region: string;
    currency: string;
}

class MarketDataService {
    private isInitialized = false;

    // Getters for keys with sanitization
    private get finnhubKey() { return this.sanitizeKey(process.env.FINNHUB_API_KEY); }
    private get cmcKey() { return this.sanitizeKey(process.env.COINMARKETCAP_API_KEY); }
    private get forexKey() { return this.sanitizeKey(process.env.EXCHANGERATE_API_KEY); }
    private get avKey() { return this.sanitizeKey(process.env.ALPHA_VANTAGE_API_KEY) || 'demo'; }

    private sanitizeKey(key: string | undefined): string {
        if (!key) return '';
        // Remove quotes and whitespace
        const clean = key.trim().replace(/^['"]|['"]$/g, '');
        return clean;
    }

    /**
     * Initialize all market data providers
     */
    public initialize() {
        if (this.isInitialized) return;

        console.log("🚀 [MarketDataService] v2.0 Initializing...");

        // Validate all keys and log status
        this.validateKey("Finnhub", this.finnhubKey);
        this.validateKey("CoinMarketCap", this.cmcKey);
        this.validateKey("ExchangeRate-API", this.forexKey);

        this.isInitialized = true;
    }

    private validateKey(name: string, key: string) {
        if (!key || key.startsWith('your_')) {
            console.warn(`⚠ ${name}: Key is missing or using placeholder.`);
        } else {
            console.log(`✅ ${name}: Key Loaded (Starts: ${key.substring(0, 4)}...)`);
        }
    }

    /**
     * Search for assets (Global Search)
     */
    async searchAssets(keywords: string): Promise<MarketAsset[]> {
        if (!keywords || keywords.length < 2) return [];
        try {
            const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
                params: { function: 'SYMBOL_SEARCH', keywords, apikey: this.avKey }
            });
            return (response.data.bestMatches || []).map((match: any) => ({
                symbol: match['1. symbol'],
                name: match['2. name'],
                type: match['3. type'],
                region: match['4. region'],
                currency: match['8. currency']
            }));
        } catch (error: any) {
            console.error("❌ Search Assets Error:", error.message);
            return [];
        }
    }

    /**
     * 1. Stocks: get current quote using Finnhub
     */
    async getStockQuote(symbol: string): Promise<number | null> {
        const key = this.finnhubKey;
        if (!key || key.startsWith('your_')) return null;

        const cleanSymbol = symbol.toUpperCase().trim();
        try {
            const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
                params: { symbol: cleanSymbol, token: key }
            });

            const price = response.data?.c;
            if (typeof price === 'number' && price > 0) {
                console.log(`📈 Finnhub [${cleanSymbol}]: ${price}`);
                return price;
            }
            return null;
        } catch (error: any) {
            console.error(`❌ Finnhub Error [${cleanSymbol}]:`, error.message);
            return null;
        }
    }

    /**
     * 2. Cryptocurrencies: get latest price using CoinMarketCap
     */
    async getCryptoQuote(symbol: string, convert: string = 'USD'): Promise<number | null> {
        const key = this.cmcKey;
        if (!key || key.startsWith('your_')) return null;

        const capsSymbol = symbol.toUpperCase().trim();
        const targetCurrency = (convert || 'USD').toUpperCase();

        try {
            const response = await axios.get(`${CMC_BASE_URL}/cryptocurrency/quotes/latest`, {
                headers: { 'X-CMC_PRO_API_KEY': key },
                params: { symbol: capsSymbol, convert: targetCurrency }
            });

            const data = response.data?.data?.[capsSymbol];
            const quote = data?.quote?.[targetCurrency];

            if (quote && typeof quote.price === 'number') {
                console.log(`🪙 CMC [${capsSymbol}]: ${quote.price} ${targetCurrency}`);
                return quote.price;
            }
            return null;
        } catch (error: any) {
            const errMsg = error.response?.data?.status?.error_message || error.message;
            console.error(`❌ CoinMarketCap Error [${capsSymbol}]:`, errMsg);
            return null;
        }
    }

    /**
     * 3. Forex: get exchange rate using ExchangeRate-API
     */
    async getForexRate(from: string, to: string): Promise<number | null> {
        const key = this.forexKey;
        if (!key || key.startsWith('your_')) return null;

        const fromCode = from.toUpperCase().trim();
        const toCode = to.toUpperCase().trim();

        try {
            const url = `${EXCHANGERATE_BASE_URL}/${key}/pair/${fromCode}/${toCode}`;
            console.log(`📡 Fetching Forex: ${fromCode} -> ${toCode}`);
            const response = await axios.get(url);

            if (response.data.result === 'success') {
                const rate = response.data.conversion_rate;
                console.log(`💱 ExchangeRate [${fromCode}/${toCode}]: ${rate}`);
                return rate;
            }
            console.error(`❌ Forex API Error: ${response.data['error-type'] || 'Unknown'}`);
            return null;
        } catch (error: any) {
            console.error(`❌ Forex Error [${fromCode}/${toCode}]:`, error.message);
            return null;
        }
    }

    /**
     * Centralized method to get any asset price
     */
    async getAssetPrice(symbol: string, type: string, currency: string = 'USD'): Promise<number | null> {
        if (!this.isInitialized) this.initialize();

        const normalizedType = (type || '').toLowerCase();
        let rawSymbol = (symbol || '').trim();

        console.log(`🔍 getAssetPrice: Request for ${rawSymbol} (Type: ${normalizedType}, Currency: ${currency})`);

        // 1. Crypto Handling (Check this FIRST because 'digital currency' contains 'currency')
        if (normalizedType.includes('crypto') || normalizedType.includes('digital')) {
            let clean = rawSymbol.split(':')[0].trim();
            clean = clean.replace(/[-\/.](USD|EUR|GBP|USDT)$/i, '').trim();
            return await this.getCryptoQuote(clean, currency);
        }

        // 2. Forex Handling
        if (normalizedType.includes('forex') || normalizedType.includes('currency')) {
            let from = rawSymbol;
            let to = currency;

            if (rawSymbol.includes('/')) {
                [from, to] = rawSymbol.split('/');
            } else if (rawSymbol.length === 6) {
                from = rawSymbol.substring(0, 3);
                to = rawSymbol.substring(3, 6);
            }

            return await this.getForexRate(from, to);
        }

        // 3. Stock Handling (Default)
        let cleanStock = rawSymbol.split(':')[0].trim();
        return await this.getStockQuote(cleanStock);
    }

    /**
     * Get list of supported cryptos for UI (Top by Market Cap)
     */
    async getSupportedCryptos(): Promise<{ symbol: string; name: string; currency: string }[]> {
        return [
            { symbol: 'BTC', name: 'Bitcoin', currency: 'USD' },
            { symbol: 'ETH', name: 'Ethereum', currency: 'USD' },
            { symbol: 'USDT', name: 'Tether', currency: 'USD' },
            { symbol: 'BNB', name: 'Binance Coin', currency: 'USD' },
            { symbol: 'SOL', name: 'Solana', currency: 'USD' },
            { symbol: 'XRP', name: 'Ripple', currency: 'USD' },
            { symbol: 'USDC', name: 'USDC', currency: 'USD' },
            { symbol: 'ADA', name: 'Cardano', currency: 'USD' },
            { symbol: 'AVAX', name: 'Avalanche', currency: 'USD' },
            { symbol: 'DOGE', name: 'Dogecoin', currency: 'USD' },
            { symbol: 'DOT', name: 'Polkadot', currency: 'USD' },
            { symbol: 'LINK', name: 'Chainlink', currency: 'USD' },
            { symbol: 'TRX', name: 'TRON', currency: 'USD' },
            { symbol: 'MATIC', name: 'Polygon', currency: 'USD' },
        ];
    }

    /**
     * Get list of most famous Forex pairs
     */
    async getSupportedForex(): Promise<any[]> {
        return [
            { symbol: 'EUR/USD', name: 'Euro / US Dollar', currency: 'USD' },
            { symbol: 'GBP/USD', name: 'British Pound / US Dollar', currency: 'USD' },
            { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', currency: 'JPY' },
            { symbol: 'USD/ILS', name: 'US Dollar / Israeli Shekel', currency: 'ILS' },
            { symbol: 'USD/JOD', name: 'US Dollar / Jordanian Dinar', currency: 'JOD' },
            { symbol: 'USD/SAR', name: 'US Dollar / Saudi Riyal', currency: 'SAR' },
            { symbol: 'USD/AED', name: 'US Dollar / UAE Dirham', currency: 'AED' },
            { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', currency: 'CHF' },
            { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', currency: 'USD' },
            { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', currency: 'CAD' },
            { symbol: 'EUR/GBP', name: 'Euro / British Pound', currency: 'GBP' },
            { symbol: 'EUR/ILS', name: 'Euro / Israeli Shekel', currency: 'ILS' },
        ];
    }
}

export default new MarketDataService();
