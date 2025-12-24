
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { StudentApi, StudentProfileDetails } from '../../services/api';

export default function ProfileScreen() {
    const { theme, toggleTheme } = useTheme();
    const { i18n, setLanguage, language } = useLanguage();
    const { logout } = useAuth();
    const colors = Colors[theme];

    const [profile, setProfile] = useState<StudentProfileDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await StudentApi.getProfile();
            setProfile(data);
        } catch (e) {
            console.warn('Profile fetch failed', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProfile();
    };

    const [langModalVisible, setLangModalVisible] = useState(false);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);

    const languages = [
        { code: 'uz', label: 'O\'zbek tili', icon: '🇺🇿' },
        { code: 'ru', label: 'Русский язык', icon: '🇷🇺' },
        { code: 'en', label: 'English', icon: '🇺🇸' },
    ];

    const handleLogout = () => {
        setLogoutModalVisible(true);
    };

    const confirmLogout = async () => {
        setLogoutModalVisible(false);
        await logout();
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <View style={[styles.avatarContainer, { borderColor: colors.primary }]}>
                        {profile?.picture ? (
                            <Image source={{ uri: profile.picture }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                                <Ionicons name="person" size={40} color={colors.placeholder} />
                            </View>
                        )}
                        <TouchableOpacity style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                            <Ionicons name="camera" size={12} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.name, { color: colors.text }]}>
                        {profile ? `${profile.first_name} ${profile.last_name}` : 'Student'}
                    </Text>
                    <Text style={[styles.username, { color: colors.placeholder }]}>
                        @{profile?.username || 'username'}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{i18n.profile}</Text>

                    <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                        <View style={styles.infoRow}>
                            <Ionicons name="mail-outline" size={20} color={colors.placeholder} />
                            <Text style={[styles.infoText, { color: colors.text }]}>{profile?.email || 'No email'}</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <View style={styles.infoRow}>
                            <Ionicons name="call-outline" size={20} color={colors.placeholder} />
                            <Text style={[styles.infoText, { color: colors.text }]}>{profile?.phone || 'No phone'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>

                    <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                        <TouchableOpacity style={styles.settingRow} onPress={() => setLangModalVisible(true)}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="language" size={20} color={colors.text} />
                                <Text style={[styles.settingText, { color: colors.text }]}>{i18n.language} ({language.toUpperCase()})</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <TouchableOpacity style={styles.settingRow} onPress={toggleTheme}>
                            <View style={styles.settingLeft}>
                                <Ionicons name={theme === 'dark' ? 'moon' : 'sunny'} size={20} color={colors.text} />
                                <Text style={[styles.settingText, { color: colors.text }]}>{i18n.theme}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        <TouchableOpacity
                            style={styles.settingRow}
                            onPress={handleLogout}
                        >
                            <View style={styles.settingLeft}>
                                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                                <Text style={[styles.settingText, { color: colors.error }]}>{i18n.logout}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <Modal
                visible={langModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setLangModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setLangModalVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{i18n.language}</Text>
                        {languages.map((item) => (
                            <TouchableOpacity
                                key={item.code}
                                style={[
                                    styles.langOption,
                                    language === item.code && { backgroundColor: colors.primary + '15' }
                                ]}
                                onPress={() => {
                                    setLanguage(item.code as any);
                                    setLangModalVisible(false);
                                }}
                            >
                                <Text style={styles.langIcon}>{item.icon}</Text>
                                <Text style={[
                                    styles.langLabel,
                                    { color: colors.text },
                                    language === item.code && { color: colors.primary, fontWeight: 'bold' }
                                ]}>
                                    {item.label}
                                </Text>
                                {language === item.code && (
                                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>

            <Modal
                visible={logoutModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setLogoutModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setLogoutModalVisible(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.logoutIconContainer}>
                            <Ionicons name="log-out-outline" size={40} color={colors.error} />
                        </View>
                        <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 8 }]}>{i18n.logout}</Text>
                        <Text style={[styles.modalDesc, { color: colors.placeholder }]}>{i18n.logout_confirm_desc}</Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.background }]}
                                onPress={() => setLogoutModalVisible(false)}
                            >
                                <Text style={[styles.buttonText, { color: colors.text }]}>{i18n.cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.error }]}
                                onPress={confirmLogout}
                            >
                                <Text style={[styles.buttonText, { color: '#fff' }]}>{i18n.confirm_logout}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        marginBottom: 16,
        position: 'relative',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    username: {
        fontSize: 16,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    infoCard: {
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    infoText: {
        fontSize: 16,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginVertical: 8,
        marginLeft: 32,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingText: {
        fontSize: 16,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    langOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
        gap: 12,
    },
    langIcon: {
        fontSize: 24,
    },
    langLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    logoutIconContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    modalDesc: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
