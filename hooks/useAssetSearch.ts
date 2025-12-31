import { useState } from 'react';
import api from '../services/api';
import { AssetSearchResult } from '../types/common';
import { AssetType } from '../types/investment';
import { logError } from '../utils/error-handler';

export const useAssetSearch = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<AssetSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [supportedCryptos, setSupportedCryptos] = useState<any[]>([]);
    const [supportedForex, setSupportedForex] = useState<any[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);

    const fetchSupportedAssets = async () => {
        try {
            setLoadingAssets(true);
            const [cryptoRes, forexRes] = await Promise.all([
                api.get('/api/market/supported/crypto'),
                api.get('/api/market/supported/forex')
            ]);
            setSupportedCryptos(cryptoRes.data);
            setSupportedForex(forexRes.data);
        } catch (err) {
            logError('useAssetSearch.fetchSupportedAssets', err);
        } finally {
            setLoadingAssets(false);
        }
    };

    const handleSearch = async () => {
        if (searchQuery.length < 2) return;
        setSearchError(null);

        try {
            setSearching(true);
            const response = await api.get(`/api/market/search?q=${searchQuery}`);
            if (response.data.error) {
                setSearchError(response.data.error);
                setSearchResults([]);
            } else {
                setSearchResults(response.data);
            }
        } catch (err: any) {
            logError('useAssetSearch.handleSearch', err);
            setSearchError(err.message);
        } finally {
            setSearching(false);
        }
    };

    const mapAssetType = (avType: string): AssetType => {
        const t = avType.toLowerCase();
        if (t.includes('stock') || t.includes('equity')) return 'stocks';
        if (t.includes('crypto') || t.includes('digital currency')) return 'crypto';
        if (t.includes('forex')) return 'forex';
        return 'other';
    };

    const resetSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setSearchError(null);
    };

    return {
        searchQuery,
        setSearchQuery,
        searchResults,
        searching,
        searchError,
        supportedCryptos,
        supportedForex,
        loadingAssets,
        handleSearch,
        mapAssetType,
        resetSearch,
        fetchSupportedAssets
    };
};
