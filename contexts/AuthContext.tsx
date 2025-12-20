
import { useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthApi, StudentApi } from '../services/api';
import { StorageService, TokenStorage } from '../services/storage';

interface User {
    full_name: string;
    username: string;
    coins: number;
    picture: string | null;
    role: 'student' | 'parent'; // Still keeping role for UI toggle state
}

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string, role: 'student' | 'parent') => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: async () => { },
    logout: async () => { },
    isLoading: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const token = await TokenStorage.getAccessToken();
                if (token) {
                    // Ideally, we fetch the profile here to confirm token validity
                    // For now, we might need a 'getProfile' endpoint or persist user data.
                    // Since the login response gave us user data, we *should* have stored it? 
                    // Just for "clean code" ensuring session is valid:
                    // We'll rely on the user re-logging in if we don't assume persistence of User Object
                    // OR we can try to fetch profile if an endpoint existed.
                    // The provided requirements listed `Update profile` but not `Get profile`. 
                    // Checking login response: `user` object is there.
                    // Let's assume we need to stay logged in. 
                    // Since we don't have a "Get Me" endpoint in the prompt, 
                    // I'll simulate a valid session if token exists, 
                    // but the user object will be empty until we implement persistence for it too.
                    // To be safe, I'll clear it if we don't have user data, forcing re-login is safer than empty data.
                    // Update: I'll assume we can't persist User object securely without more code.
                    // I will add a `AsyncStorage` for non-sensitive user data if I could, but I can't easily install new deps.
                    // I'll check if `expo-secure-store` can store JSON. Yes, as string.

                    const storedUser = await StorageService.getItem('user_data');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                }
            } catch (e) {
                console.warn('Session restore failed', e);
            } finally {
                setIsLoading(false);
            }
        };
        restoreSession();
    }, []);


    const login = async (username: string, password: string, role: 'student' | 'parent') => {
        try {
            setIsLoading(true);
            if (role === 'parent') {
                // Logic for parent if needed later
                throw new Error('Parent login not supported yet');
            }

            const data = await AuthApi.login(username, password);

            // Handle Tokens: Support both access/refresh and access_token/refresh_token
            const accessToken = data.access || data.access_token || (data as any).token;
            const refreshToken = data.refresh || data.refresh_token;

            if (accessToken) {
                await TokenStorage.setTokens(accessToken, refreshToken || '');
            } else {
                // If no token found, maybe cookie based? 
                // But for now assume token must be present if not error.
                // If the backend is strictly cookie-based, we might proceed.
                // console.warn('No access token found in login response');
            }

            // Handle User Data
            let userData: User;

            if (data.user) {
                userData = {
                    ...data.user,
                    role: 'student',
                };
            } else {
                // Fetch Profile if not provided in login response
                const profile = await StudentApi.getProfile();
                userData = {
                    username: profile.username,
                    full_name: `${profile.first_name} ${profile.last_name}`.trim(),
                    picture: profile.picture,
                    coins: 0, // Profile doesn't return coins directly, defaulting to 0
                    role: 'student',
                };
            }

            setUser(userData);
            await StorageService.setItem('user_data', JSON.stringify(userData));

            router.replace('/(tabs)');
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await AuthApi.logout();
        } catch (e) {
            // Ignore errors strictly
        }
        setUser(null);
        await TokenStorage.clearTokens();
        await StorageService.deleteItem('user_data');
        router.replace('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

// Import SecureStore locally for the simpler persistence
// import * as SecureStore from 'expo-secure-store';

export const useAuth = () => useContext(AuthContext);
