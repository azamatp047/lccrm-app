import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { StudentApi, StudentNotification } from '../services/api';

export default function NotificationsPage() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { theme } = useTheme();
    const { language, i18n } = useLanguage();
    const colors = Colors[theme];

    const [notifications, setNotifications] = useState<StudentNotification[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNotifications();

        // Cleanup: Mark as read when leaving
        return () => {
            StudentApi.markAllNotificationsAsRead().catch(e => console.warn('Failed to mark notifications as read', e));
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await StudentApi.getCommonAllNotifications();
            if (Array.isArray(response)) {
                setNotifications(response);
            } else if ((response as any).results) {
                setNotifications((response as any).results);
            }
        } catch (e) {
            console.warn('Failed to fetch notifications', e);
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async (id: number) => {
        try {
            await StudentApi.archiveNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (e) {
            console.warn('Failed to archive notification', e);
            Alert.alert('Error', 'Failed to archive notification');
        }
    };

    const renderItem = ({ item }: { item: StudentNotification }) => {
        const isRead = item.is_read;
        return (
            <View style={[
                styles.itemContainer,
                { backgroundColor: colors.surface },
                !isRead && { borderLeftWidth: 4, borderLeftColor: colors.primary, backgroundColor: colors.surface },
                isRead && { opacity: 0.7 }
            ]}>
                <View style={styles.content}>
                    <Text style={[
                        styles.title,
                        { color: colors.text },
                        !isRead && { color: colors.primary } // Highlight title for unread
                    ]}>
                        {language === 'uz' ? item.notification.title_uz || item.notification.title
                            : language === 'ru' ? item.notification.title_ru || item.notification.title
                                : item.notification.title_en || item.notification.title}
                    </Text>
                    <Text style={[styles.message, { color: colors.placeholder }]}>
                        {language === 'uz' ? item.notification.message_uz || item.notification.message
                            : language === 'ru' ? item.notification.message_ru || item.notification.message
                                : item.notification.message_en || item.notification.message}
                    </Text>
                    <Text style={[styles.date, { color: colors.placeholder }]}>
                        {new Date(item.notification.created_at).toLocaleString()}
                    </Text>
                </View>
                {!item.is_archived && (
                    <TouchableOpacity
                        style={[styles.archiveBtn, { backgroundColor: colors.error + '15' }]}
                        onPress={() => handleArchive(item.id)}
                    >
                        <Ionicons name="archive-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{i18n.notifications}</Text>
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 16, gap: 12 }}
                ListEmptyComponent={
                    !loading ? (
                        <Text style={{ textAlign: 'center', color: colors.placeholder, marginTop: 40 }}>
                            No notifications found.
                        </Text>
                    ) : null
                }
                ListFooterComponent={
                    loading ? <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} /> : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
        elevation: 1,
        zIndex: 10,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    message: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },
    date: {
        fontSize: 12,
    },
    archiveBtn: {
        padding: 10,
        borderRadius: 10,
    }
});
