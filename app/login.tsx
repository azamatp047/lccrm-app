import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    SafeAreaView
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function LoginScreen() {
    const { login, isLoading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { i18n, setLanguage, language } = useLanguage();
    const colors = Colors[theme];

    const [role, setRole] = useState<'student' | 'parent'>('student');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Parol ko'rish/yashirish
    const [showPassword, setShowPassword] = useState(false);
    
    const [error, setError] = useState('');
    const [focusedInput, setFocusedInput] = useState<'username' | 'password' | null>(null);

    const handleLogin = async () => {
        setError('');
        if (role === 'parent') {
            Alert.alert('Info', i18n.coming_soon);
            return;
        }
        if (!username || !password) {
            setError(i18n.error_empty);
            return;
        }

        try {
            await login(username, password, role);
        } catch (e: any) {
            setError(e.message || i18n.error_invalid);
        }
    };

    // --- ZAMONAVIY SOFT INPUT (Border rangi yo'q) ---
    const renderSoftInput = (
        type: 'username' | 'password',
        placeholder: string,
        value: string,
        setValue: (text: string) => void,
        iconName: any
    ) => {
        const isFocused = focusedInput === type;
        const isPassword = type === 'password';

        // Ranglar logikasi
        const iconColor = isFocused ? colors.primary : colors.placeholder;
        
        // Input foni: Fokus bo'lmaganda kulrangroq, Fokus bo'lganda oppoq (yoki to'q rejimga mos)
        const backgroundColor = isFocused 
            ? (theme === 'dark' ? '#2C2C2E' : '#FFFFFF') // Focus holati
            : (theme === 'dark' ? '#1C1C1E' : '#F2F2F7'); // Oddiy holat

        return (
            <View style={[
                styles.softInputContainer,
                { 
                    backgroundColor: backgroundColor,
                    // Fokus bo'lganda soya (Shadow) beramiz, border RANGI EMAS
                    shadowOpacity: isFocused ? 0.1 : 0,
                    elevation: isFocused ? 5 : 0,
                    transform: isFocused ? [{scale: 1.02}] : [{scale: 1}], // Kichik animatsiya
                }
            ]}>
                <View style={styles.iconWrapper}>
                    <Ionicons
                        name={iconName}
                        size={24}
                        color={iconColor}
                    />
                </View>

                <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.placeholder}
                    value={value}
                    onChangeText={setValue}
                    autoCapitalize="none"
                    secureTextEntry={isPassword && !showPassword}
                    onFocus={() => setFocusedInput(type)}
                    onBlur={() => setFocusedInput(null)}
                />
                
                {isPassword && (
                    <TouchableOpacity 
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                        activeOpacity={0.6}
                    >
                        <Ionicons 
                            name={showPassword ? "eye-off" : "eye"} 
                            size={22} 
                            color={colors.placeholder} 
                        />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <SafeAreaView style={styles.safeArea}>
                
                {/* Tepada joylashgan boshqaruv tugmalari */}
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={toggleTheme} style={[styles.controlButton, { backgroundColor: theme === 'dark' ? '#333' : '#fff' }]}>
                        <Ionicons name={theme === 'dark' ? 'moon' : 'sunny'} size={24} color={colors.text} />
                    </TouchableOpacity>

                    <View style={[styles.langContainer, { backgroundColor: theme === 'dark' ? '#333' : '#fff' }]}>
                        {(['uz', 'ru', 'en'] as const).map((lang) => (
                            <TouchableOpacity
                                key={lang}
                                onPress={() => setLanguage(lang)}
                                style={[
                                    styles.langButton,
                                    language === lang && { backgroundColor: colors.primary },
                                ]}
                            >
                                <Text style={[styles.langText, { color: language === lang ? '#fff' : colors.text }]}>
                                    {lang.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        {/* Katta Logo qismi */}
                        <View style={styles.header}>
                            <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
                                <Ionicons name="school" size={48} color="#fff" />
                            </View>
                            <Text style={[styles.appName, { color: colors.text }]}>LC_CRM</Text>
                            <Text style={[styles.subText, { color: colors.placeholder }]}>{i18n.login_title}</Text>
                        </View>

                        {/* Rol tanlash (Katta va chiroyli) */}
                        <View style={styles.roleSelectorWrapper}>
                            <View style={[styles.roleSelector, { backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F2F2F7' }]}>
                                <TouchableOpacity
                                    style={[styles.roleBtn, role === 'student' && [styles.roleBtnActive, { backgroundColor: '#fff', shadowColor: '#000' }]]}
                                    onPress={() => setRole('student')}
                                >
                                    <Text style={[styles.roleText, { color: role === 'student' ? '#000' : colors.placeholder }]}>
                                        {i18n.student}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleBtn, role === 'parent' && [styles.roleBtnActive, { backgroundColor: '#fff', shadowColor: '#000' }]]}
                                    onPress={() => setRole('parent')}
                                >
                                    <Text style={[styles.roleText, { color: role === 'parent' ? '#000' : colors.placeholder }]}>
                                        {i18n.parent}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Form qismi */}
                        <View style={styles.formArea}>
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                            {renderSoftInput('username', i18n.username, username, setUsername, 'person')}
                            <View style={{height: 16}} /> 
                            {renderSoftInput('password', i18n.password, password, setPassword, 'lock-closed')}

                            <TouchableOpacity
                                style={[
                                    styles.mainButton,
                                    { backgroundColor: role === 'parent' ? '#A1A1AA' : colors.primary },
                                ]}
                                onPress={handleLogin}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.mainButtonText}>{i18n.login_button}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        zIndex: 10,
    },
    scrollView: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    controlButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    langContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    langButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    langText: {
        fontWeight: '700',
        fontSize: 12,
    },
    content: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 90,
        height: 90,
        borderRadius: 30, // Zamonaviy yumaloqlik
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    appName: {
        fontSize: 34,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 4,
    },
    subText: {
        fontSize: 16,
        fontWeight: '500',
    },
    roleSelectorWrapper: {
        marginBottom: 30,
    },
    roleSelector: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 18,
        height: 54,
    },
    roleBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
    },
    roleBtnActive: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    roleText: {
        fontWeight: '700',
        fontSize: 15,
    },
    formArea: {
        width: '100%',
    },
    errorText: {
        color: '#FF3B30',
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '600',
    },

    // --- YANGI INPUT STYLES ---
    softInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 64, // Kattaroq balandlik
        borderRadius: 20, // Juda yumaloq burchaklar
        paddingHorizontal: 16,
        // Default shadow (juda yengil)
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
    },
    iconWrapper: {
        marginRight: 14,
        width: 30,
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        height: '100%',
        fontSize: 17, // Kattaroq shrift
        fontWeight: '500',
    },
    eyeButton: {
        padding: 10,
    },
    // -------------------------

    mainButton: {
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});