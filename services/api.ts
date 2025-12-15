
import { TokenStorage } from './storage';

const BASE_URL = 'https://lccrm.uz/api/v1/students';

interface LoginResponse {
    access_token: string;
    refresh_token: string;
    user: {
        full_name: string;
        username: string;
        email: string;
        picture: string | null;
        coins: number;
    };
}

interface RefreshResponse {
    access: string;
    refresh: string;
}

// Helper to handle API errors
class ApiError extends Error {
    constructor(public status: number, public message: string) {
        super(message);
    }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    const token = await TokenStorage.getAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Handle 401 Unauthorized (Token Expiry)
    if (response.status === 401) {
        // Attempt refresh
        const refreshed = await refreshTokenFlow();
        if (refreshed) {
            // Retry original request with new token
            const newToken = await TokenStorage.getAccessToken();
            headers['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
                ...options,
                headers,
            });
            if (retryResponse.ok) return await retryResponse.json();
        } else {
            // Refresh failed, throw error to trigger logout
            throw new ApiError(401, 'Unauthorized');
        }
    }

    if (!response.ok) {
        const errorBody = await response.text();
        throw new ApiError(response.status, errorBody || 'Something went wrong');
    }

    return await response.json();
}

async function refreshTokenFlow(): Promise<boolean> {
    try {
        const refresh = await TokenStorage.getRefreshToken();
        if (!refresh) return false;

        // Call refresh endpoint
        const response = await fetch(`${BASE_URL}/refresh-token/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ refresh }),
        });

        if (response.ok) {
            const data: RefreshResponse = await response.json();
            await TokenStorage.setTokens(data.access, data.refresh);
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export const AuthApi = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        const response = await fetch(`${BASE_URL}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) throw new ApiError(response.status, 'Login failed');
        return await response.json();
    },
    logout: async () => {
        try {
            await request('/logout/', { method: 'POST' });
        } catch (e) {
            console.warn('Logout API failed, continuing with local cleanup', e);
        }
        await TokenStorage.clearTokens();
    },
    updateProfile: async (data: any) => {
        return await request('/profile/update/', {
            method: 'PATCH', // Assuming PATCH for partial update, or PUT
            body: JSON.stringify(data),
        });
    },
};
