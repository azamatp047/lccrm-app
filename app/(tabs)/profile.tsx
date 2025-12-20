
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
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

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
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
                        onPress={logout}
                    >
                        <View style={styles.settingLeft}>
                            <Ionicons name="log-out-outline" size={20} color={colors.error} />
                            <Text style={[styles.settingText, { color: colors.error }]}>{i18n.logout}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
});
