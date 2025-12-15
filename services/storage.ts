
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const OPS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
};

// Simple web storage fallback
const WebStorage = {
    setItemAsync: async (key: string, value: string) => {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, value);
            }
        } catch (e) {
            console.warn('LocalStorage failed', e);
        }
    },
    getItemAsync: async (key: string) => {
        try {
            if (typeof localStorage !== 'undefined') {
                return localStorage.getItem(key);
            }
            return null;
        } catch (e) {
            return null;
        }
    },
    deleteItemAsync: async (key: string) => {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(key);
            }
        } catch (e) {
            // ignore
        }
    }
};

const isWeb = Platform.OS === 'web';

export const StorageService = {
    setItem: async (key: string, value: string) => {
        if (isWeb) {
            await WebStorage.setItemAsync(key, value);
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    },
    getItem: async (key: string) => {
        if (isWeb) {
            return await WebStorage.getItemAsync(key);
        } else {
            return await SecureStore.getItemAsync(key);
        }
    },
    deleteItem: async (key: string) => {
        if (isWeb) {
            await WebStorage.deleteItemAsync(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    }
};

export const TokenStorage = {
    setTokens: async (access: string, refresh: string) => {
        await StorageService.setItem(OPS.ACCESS_TOKEN, access);
        await StorageService.setItem(OPS.REFRESH_TOKEN, refresh);
    },
    getAccessToken: async () => {
        return await StorageService.getItem(OPS.ACCESS_TOKEN);
    },
    getRefreshToken: async () => {
        return await StorageService.getItem(OPS.REFRESH_TOKEN);
    },
    clearTokens: async () => {
        await StorageService.deleteItem(OPS.ACCESS_TOKEN);
        await StorageService.deleteItem(OPS.REFRESH_TOKEN);
    },
};
