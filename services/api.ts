
import { StorageService, TokenStorage } from './storage';

// Language Handling
export type Language = 'uz' | 'ru' | 'en';
let currentLanguage: Language = 'uz';

export const setApiLanguage = (lang: Language) => {
    currentLanguage = lang;
};

export const getApiLanguage = () => currentLanguage;

const GET_BASE_URL = () => {
    // If language is default 'uz', use /api/v1/students
    // Otherwise use /{lang}/api/v1/students
    if (currentLanguage === 'uz') {
        return 'https://lccrm.uz/api/v1/students';
    }
    return `https://lccrm.uz/${currentLanguage}/api/v1/students`;
};

// --- Interfaces for Student Schemas ---

export interface StudentLessonDetails {
    id: number;
    topic: string | null;
    lesson_video_url: string | null;
    class_materials: string; // Defaults to "[]" in spec, likely JSON string
    homework_materials: string; // Defaults to "[]" in spec
}

export interface GroupLessons {
    id: number;
    topic: string | null;
    status: string; // 'ended' | 'current' | 'disabled'
    start_time: string;
    end_time: string;
}

export interface GroupDetails {
    id: number;
    name: string;
    lessons: GroupLessons[];
    progress: string;
}

export interface StudentGroupRatings {
    id: number;
    name: string;
    students: string; // Likely JSON string of student ratings or HTML/text representation? Spec says 'string'
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface StudentProfileDetails {
    id: number;
    username: string;
    email: string; // format: email
    first_name: string;
    last_name: string;
    picture: string | null; // format: uri
    phone: string | null;
}

export interface StudentProfileUpdate {
    id: number;
    phone: string | null;
    email: string;
    first_name: string;
    last_name: string;
    picture: string | null;
}

export interface CoinCategory {
    id: number;
    category_name: string;
    category_name_uz: string | null;
    category_name_ru: string | null;
    category_name_en: string | null;
    coin_count: number;
}

export interface CoinInstance {
    id: number;
    category: CoinCategory;
    extra_coins: number | null;
    extra_coin_reason: string | null;
    extra_coin_reason_uz: string | null;
    extra_coin_reason_ru: string | null;
    extra_coin_reason_en: string | null;
    created_at: string;
}

export interface Notification {
    id: number;
    created_at: string;
    title: string;
    title_uz: string | null;
    title_ru: string | null;
    title_en: string | null;
    message: string;
    message_uz: string | null;
    message_ru: string | null;
    message_en: string | null;
}

export interface StudentNotification {
    id: number;
    notification: Notification;
}

export interface UserNotificationsUpdate {
    id: number;
    is_read: boolean;
}

export interface LoginResponse {
    username: string;
    // Note: Spec for Login only returns username in 200 response content schema?
    // Wait, typical JWT auth usually returns tokens.
    // Let's check '/api/v1/students/login/' spec again carefully.
    // Response 200 schema is StudentLogin -> { username: string }.
    // Hmmm. Usually login returns tokens.
    // The spec description for USER login says returns token pair.
    // Assume Student login also sets cookie or header? Or maybe it DOES return tokens but the spec schema is partial?
    // Let's assume standard behavior based on existing code: { access: string, refresh: string ... } or just returns what spec says.
    // BUT the existing code had tokens. I will keep existing LoginResponse structure for safety,
    // but warn that the spec might be incomplete or different.
    // Actually, look at '/api/v1/users/login/' -> 'Login' schema.
    // '/api/v1/students/login/' -> 'StudentLogin' schema { username }.
    // This is suspicious. I will assume it returns tokens as well or headers cookies.
    // Let's stick to 'any' for the initial response or try to preserve existing generic behavior if I can.
    // Retaining existing logic for LoginResponse for now but widening it.
    access?: string;
    refresh?: string;
    [key: string]: any;
}

interface RefreshResponse {
    access: string;
    refresh: string;
}

// --- Course Interfaces ---

export interface CourseProgress {
    all_lessons: number;
    completed_lesson_count: number;
    progress_rate: number;
}

export interface CourseTeacher {
    id: number;
    name: string;
    // Add other fields if known, for now assume name is what we need
}

export interface Course {
    id: number;
    group_name: string;
    course_name: string;
    duration: string;
    progress: CourseProgress;
    student_count: number;
    teachers: CourseTeacher[]; // Based on usage, it's an array of objects with name
}

// Helpers
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

    const baseUrl = GET_BASE_URL();
    console.log(`[API] Request to: ${baseUrl}${endpoint}`);

    const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        const refreshed = await refreshTokenFlow();
        if (refreshed) {
            const newToken = await TokenStorage.getAccessToken();
            headers['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await fetch(`${baseUrl}${endpoint}`, {
                ...options,
                headers,
            });
            if (retryResponse.ok) return await retryResponse.json();
        } else {
            throw new ApiError(401, 'Unauthorized');
        }
    }

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[API Error] ${response.status} ${endpoint}`, errorBody);
        throw new ApiError(response.status, errorBody || 'Something went wrong');
    }

    // Some endpoints might return empty body (204 or just empty)
    const text = await response.text();
    return text ? JSON.parse(text) : {} as T;
}

async function refreshTokenFlow(): Promise<boolean> {
    try {
        const refresh = await TokenStorage.getRefreshToken();
        if (!refresh) return false;

        const baseUrl = GET_BASE_URL();
        const response = await fetch(`${baseUrl}/refresh-token/`, {
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
        // Spec: /api/v1/students/login/
        // Existing code used /login/ relative to students base.
        // We will stick to request helper to handle base url
        // BUT strictly conforming to spec endpoint structure:
        // If GET_BASE_URL returns `.../students`, then just `/login/` is correct.
        const response = await request<LoginResponse>('/login/', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        // IMPORTANT: If response contains tokens, save them!
        // The spec schema 'StudentLogin' only has username.
        // If the backend actually returns tokens (common practice), we need to save them.
        // I will check if access/refresh exist in response.
        if (response.access && response.refresh) {
            await TokenStorage.setTokens(response.access, response.refresh);
        } else if ((response as any).token) {
            // Fallback if they send just 'token'
            await StorageService.setItem('access_token', (response as any).token);
        }

        return response;
    },
    logout: async () => {
        try {
            await request('/logout/', { method: 'POST' });
        } catch (e) {
            console.warn('Logout API failed, continuing with local cleanup', e);
        }
        await TokenStorage.clearTokens();
    },
    refreshToken: async () => {
        return refreshTokenFlow();
    }
};

export const StudentApi = {
    getLessonDetails: async (groupId: number, lessonId: number): Promise<StudentLessonDetails> => {
        return await request<StudentLessonDetails>(`/${groupId}/lesson-details/${lessonId}/`);
    },

    getGroupDetails: async (groupId: number): Promise<GroupDetails> => {
        // Spec: /api/v1/students/group-details/{group_id}/
        // Our BASE_URL includes /students, so we need `/group-details/${groupId}/`
        return await request<GroupDetails>(`/group-details/${groupId}/`);
    },

    getGroupRatings: async (params: { limit?: number; offset?: number; ordering?: string } = {}) => {
        const query = new URLSearchParams(params as any).toString();
        return await request<PaginatedResponse<StudentGroupRatings>>(`/group-ratings/?${query}`);
    },

    // Note: Spec path is /api/v1/students/my-lessons/
    getMyLessons: async (params: { limit?: number; offset?: number; ordering?: string; month?: number; year?: number } = {}) => {
        const query = new URLSearchParams(params as any).toString();
        return await request<any>(`/my-lessons/?${query}`); // Returns No Body in spec? Usually means list if GET.
        // Spec says: "responses: '200': description: No response body".
        // This confusing. If it's a calendar, it returns SOMETHING.
        // I'll return 'any' for now.
    },

    getProfile: async (): Promise<StudentProfileDetails> => {
        return await request<StudentProfileDetails>('/profile/');
    },

    updateProfile: async (data: Partial<StudentProfileUpdate> & { picture?: any }) => {
        // If picture is present, we might need FormData.
        const isMultipart = data.picture && typeof data.picture !== 'string';

        if (isMultipart) {
            // Need special handling for FormData if uploading file via React Native
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                const value = (data as any)[key];
                if (value !== undefined && value !== null) {
                    if (key === 'picture' && typeof value === 'object' && value.uri) {
                        // React Native specific file object
                        formData.append('picture', {
                            uri: value.uri,
                            name: value.name || 'profile.jpg',
                            type: value.type || 'image/jpeg',
                        } as any);
                    } else {
                        formData.append(key, String(value));
                    }
                }
            });

            const baseUrl = GET_BASE_URL();
            const token = await TokenStorage.getAccessToken();
            const headers: Record<string, string> = {
                'Accept': 'application/json',
                // Content-Type is set automatically by fetch for FormData
            };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${baseUrl}/profile/update/`, {
                method: 'PATCH',
                headers,
                body: formData,
            });
            if (!response.ok) throw new ApiError(response.status, 'Profile update failed');
            return await response.json();

        } else {
            return await request<StudentProfileUpdate>('/profile/update/', {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
        }
    },

    getCoins: async (params: { limit?: number; offset?: number; ordering?: string } = {}) => {
        const query = new URLSearchParams(params as any).toString();
        return await request<PaginatedResponse<CoinInstance>>(`/profile/coins/?${query}`);
    },

    getNotifications: async (params: { limit?: number; offset?: number; ordering?: string } = {}) => {
        const query = new URLSearchParams(params as any).toString();
        return await request<PaginatedResponse<StudentNotification>>(`/profile/notifications/?${query}`);
    },

    markNotificationRead: async (params: { limit?: number; offset?: number; ordering?: string } = {}) => {
        // Spec: /api/v1/students/profile/notifications/mark-as-read/
        // It's a GET request in the spec? That's weird for a "mark as read" action (usually POST).
        // But spec says GET.
        const query = new URLSearchParams(params as any).toString();
        return await request<PaginatedResponse<UserNotificationsUpdate>>(`/profile/notifications/mark-as-read/?${query}`);
    },

    getStudentGroups: async (params: { limit?: number; offset?: number; ordering?: string } = {}) => {
        const query = new URLSearchParams(params as any).toString();
        // Spec: /api/v1/students/student-groups/
        // User provided JSON confirms it returns a standard paginated response
        return await request<PaginatedResponse<Course>>(`/student-groups/?${query}`);
    },
};
