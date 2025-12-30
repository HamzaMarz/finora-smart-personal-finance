import axios from 'axios';
import db from '../database/sqlite.ts';
import StorageService from '../database/storage.service.ts';

const BASE_URL = 'https://v6.exchangerate-api.com/v6';

class ExchangeRateService {
    private static instance: ExchangeRateService;
    private updateInterval: NodeJS.Timeout | null = null;

    // Allowed currencies as requested by the user
    private readonly ALLOWED_CURRENCIES = [
        'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'ILS', 'JOD', 'KWD', 'BHD', 'OMR', 'QAR', 'SAR', 'AED'
    ];

    // Update twice daily (every 12 hours)
    private readonly UPDATE_FREQUENCY = 12 * 60 * 60 * 1000;

    private constructor() {
        this.startScheduledUpdates();
    }

    static getInstance(): ExchangeRateService {
        if (!ExchangeRateService.instance) {
            ExchangeRateService.instance = new ExchangeRateService();
        }
        return ExchangeRateService.instance;
    }

    /**
     * Start the scheduled background updates
     */
    startScheduledUpdates() {
        // Initial fetch if needed (e.g., if table empty or stale)
        this.checkAndUpdateRates();

        // Schedule periodic updates
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.updateInterval = setInterval(() => {
            this.checkAndUpdateRates();
        }, this.UPDATE_FREQUENCY);

        console.log('✅ Exchange Rate Service started. Updates scheduled every 12 hours.');
    }
    async syncRates(): Promise<boolean> {
        const API_KEY = process.env.EXCHANGERATE_API_KEY;
        console.log('🔄 Syncing exchange rates from ExchangeRate-API.com...');

        if (!API_KEY || API_KEY === 'your_api_key_here') {
            console.error('❌ Missing EXCHANGERATE_API_KEY. Please check your .env file.');
            return false;
        }

        console.log(`📡 Fetching from: ${BASE_URL} (Key length: ${API_KEY.length})`);

        try {
            // ExchangeRate-API v6 uses: BASE_URL/API_KEY/latest/USD
            const response = await axios.get(`${BASE_URL}/${API_KEY}/latest/USD`);
            console.log('📥 API Response status:', response.status);

            // ExchangeRate-API v6 response format: { result: "success", conversion_rates: { ... } }
            if (response.data && response.data.result === 'success') {
                const rates = response.data.conversion_rates;
                const timestamp = new Date().toISOString();

                // Transaction to update allowed rates
                const updateTransaction = db.transaction((ratesData) => {
                    for (const [currency, rate] of Object.entries(ratesData)) {
                        // Omit currencies not in the whitelist
                        if (!this.ALLOWED_CURRENCIES.includes(currency)) continue;
                        // Only update if not manual, or if we want to overwrite everything (logic choice)
                        // Here we respect manual override unless specifically requested? 
                        // The requirement says "can be modified manually". 
                        // Usually API sync should update "auto" rates.
                        // Let's check if it's manual first.

                        const existing = db.prepare('SELECT is_manual FROM exchange_rates WHERE currency_code = ?').get(currency) as any;

                        if (!existing || !existing.is_manual) {
                            StorageService.exchangeRates.upsert({
                                currencyCode: currency,
                                rate: Number(rate),
                                lastUpdated: timestamp,
                                isManual: false
                            });
                        }
                    }
                });

                updateTransaction(rates);
                console.log(`✅ Exchange rates updated successfully. Processed ${Object.keys(rates).length} currencies.`);
                return true;
            } else {
                console.error('❌ Failed to fetch rates:', response.data.error);
                return false;
            }
        } catch (error: any) {
            console.error('❌ Error syncing exchange rates:', error.message);
            return false;
        }
    }

    /**
     * Check if updates are needed and run sync
     */
    private async checkAndUpdateRates() {
        // Simple check: just run sync. 
        // Optimization: could check last_updated in DB first.
        await this.syncRates();
    }

    /**
     * Stop the service
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

export default ExchangeRateService;
