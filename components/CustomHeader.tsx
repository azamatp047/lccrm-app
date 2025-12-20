
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { StudentApi, StudentNotification } from '../services/api';

// Static Data for Coins Actions (Example buttons)
const COIN_ACTIONS = [
    { id: '1', key: 'homework', icon: 'book', amount: '+50' },
    { id: '2', key: 'lessons', icon: 'videocam', amount: '+20' },
    { id: '3', key: 'quiz', icon: 'help-circle', amount: '+100' },
    { id: '4', key: 'daily', icon: 'calendar', amount: '+10' },
];

export default function CustomHeader() {
    const insets = useSafeAreaInsets();
    const { theme, toggleTheme } = useTheme();
    const { i18n, setLanguage, language } = useLanguage();
    const { logout, user } = useAuth();
    const colors = Colors[theme];

    const [activeModal, setActiveModal] = useState<'none' | 'coins' | 'notifications' | 'profile'>('none');
    const [notifications, setNotifications] = useState<StudentNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await StudentApi.getNotifications({ limit: 10 });
            if (response && response.results) {
                setNotifications(response.results);
                // Assume all are unread or we check `is_read` if available in list.
                // Spec for StudentNotification -> Notification schema doesn't have `is_read`.
                // Notification schema has `id, created_at, title...`.
                // UserNotificationsUpdate has `is_read`.
                // It seems the "list" might just be recent notifications.
                // We'll just show the count of total recent ones for now.
                setUnreadCount(response.count);
            }
        } catch (e) {
            console.warn('Failed to fetch notifications', e);
        }
    };

    const closeModals = () => {
        setActiveModal('none');
        if (activeModal === 'notifications') {
            // Mark as read logic? 
            // The API has `markNotificationRead` which is a GET request (?!)
            // We can call it when closing or opening.
            // Let's call it when opening strictly speaking, but here simple logic:
            StudentApi.markNotificationRead().catch(e => console.warn(e));
            setUnreadCount(0);
        }
    };

    const cycleLanguage = () => {
        const next = {
            'en': 'uz',
            'uz': 'ru',
            'ru': 'en'
        }[language] as 'en' | 'uz' | 'ru' || 'en';
        setLanguage(next);
    };

    const renderModalContent = () => {
        switch (activeModal) {
            case 'coins':
                return (
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{i18n.coins}</Text>
                        {COIN_ACTIONS.map((item) => (
                            <TouchableOpacity key={item.id} style={styles.menuItem}>
                                <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
                                    <Ionicons name={item.icon as any} size={20} color="#fff" />
                                </View>
                                <Text style={[styles.menuText, { color: colors.text, flex: 1 }]}>
                                    {i18n[item.key as keyof typeof i18n]}
                                </Text>
                                <Text style={[styles.coinAmount, { color: colors.primary }]}>
                                    {item.amount}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                );
            case 'notifications':
                return (
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{i18n.notifications}</Text>
                        <FlatList
                            data={notifications}
                            keyExtractor={(item) => item.id.toString()}
                            ListEmptyComponent={<Text style={{ padding: 20, textAlign: 'center', color: colors.placeholder }}>No notifications</Text>}
                            renderItem={({ item }) => (
                                <View style={[styles.notifItem, { borderBottomColor: colors.border }]}>
                                    <Text style={[styles.notifTitle, { color: colors.text }]}>
                                        {language === 'uz' ? item.notification.title_uz || item.notification.title
                                            : language === 'ru' ? item.notification.title_ru || item.notification.title
                                                : item.notification.title_en || item.notification.title}
                                    </Text>
                                    <Text style={[styles.notifDesc, { color: colors.placeholder }]}>
                                        {language === 'uz' ? item.notification.message_uz || item.notification.message
                                            : language === 'ru' ? item.notification.message_ru || item.notification.message
                                                : item.notification.message_en || item.notification.message}
                                    </Text>
                                    <Text style={[styles.notifDate, { color: colors.placeholder }]}>
                                        {new Date(item.notification.created_at).toLocaleDateString()}
                                    </Text>
                                </View>
                            )}
                        />
                    </View>
                );
            case 'profile':
                return (
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{i18n.profile}</Text>
                        <TouchableOpacity onPress={toggleTheme} style={styles.menuItem}>
                            <Ionicons name={theme === 'dark' ? 'moon' : 'sunny'} size={24} color={colors.text} />
                            <Text style={[styles.menuText, { color: colors.text }]}>{i18n.theme}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={cycleLanguage} style={styles.menuItem}>
                            <Ionicons name="language" size={24} color={colors.text} />
                            <Text style={[styles.menuText, { color: colors.text }]}>{i18n.language} ({language.toUpperCase()})</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={logout} style={styles.menuItem}>
                            <Ionicons name="log-out-outline" size={24} color={colors.error} />
                            <Text style={[styles.menuText, { color: colors.error }]}>{i18n.logout}</Text>
                        </TouchableOpacity>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
            <View style={styles.headerRow}>
                {/* Left: Branding */}
                <View style={styles.branding}>
                    <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
                        <Ionicons name="school" size={20} color="#fff" />
                    </View>
                    <Text style={[styles.brandText, { color: colors.text }]}>LC_CRM</Text>
                </View>

                {/* Right: Actions */}
                <View style={styles.actions}>
                    {/* Coins */}
                    <TouchableOpacity
                        style={[styles.coinPill, { backgroundColor: colors.background, borderColor: colors.primary }]}
                        onPress={() => setActiveModal('coins')}
                    >
                        <Ionicons name="cash" size={16} color={colors.primary} />
                        <Text style={[styles.coinText, { color: colors.primary }]}>{user?.coins || 0}</Text>
                    </TouchableOpacity>

                    {/* Notifications */}
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => setActiveModal('notifications')}
                    >
                        <Ionicons name="notifications-outline" size={26} color={colors.text} />
                        {unreadCount > 0 && (
                            <View style={[styles.badgeContainer, { backgroundColor: 'red' }]}>
                                <Text style={styles.badgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Profile */}
                    <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => setActiveModal('profile')}
                    >
                        <Ionicons name="person-circle-outline" size={30} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modal Overlay */}
            <Modal
                visible={activeModal !== 'none'}
                transparent={true}
                animationType="fade"
                onRequestClose={closeModals}
            >
                <Pressable style={styles.modalOverlay} onPress={closeModals}>
                    <View style={styles.modalContainer}>
                        {/* Stop propagation */}
                        <Pressable onPress={(e) => e.stopPropagation()}>
                            {renderModalContent()}
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        zIndex: 100,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 50,
    },
    branding: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    brandText: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBtn: {
        padding: 4,
    },
    coinPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
        borderWidth: 1,
        gap: 4,
    },
    coinText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'red',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        maxWidth: 300,
    },
    modalContent: {
        borderRadius: 20,
        padding: 20,
        width: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        // Max height for notification list
        maxHeight: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: {
        fontSize: 16,
        fontWeight: '500',
    },
    notifItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    notifTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    notifDesc: {
        fontSize: 14,
        marginBottom: 4,
    },
    notifDate: {
        fontSize: 12,
        textAlign: 'right',
        opacity: 0.6
    },
    coinAmount: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    badgeContainer: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
