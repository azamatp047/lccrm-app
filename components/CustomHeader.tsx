
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
import { CoinInstance, StudentApi, StudentNotification } from '../services/api';

export default function CustomHeader() {
    const insets = useSafeAreaInsets();
    const { theme, toggleTheme } = useTheme();
    const { i18n, setLanguage, language } = useLanguage();
    const { logout, user } = useAuth();
    const colors = Colors[theme];

    const [activeModal, setActiveModal] = useState<'none' | 'coins' | 'notifications' | 'profile'>('none');

    // Notifications State
    const [notifications, setNotifications] = useState<StudentNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Coins State
    const [coins, setCoins] = useState<CoinInstance[]>([]);
    const [loadingCoins, setLoadingCoins] = useState(false);
    const [coinPage, setCoinPage] = useState(1);
    const [hasMoreCoins, setHasMoreCoins] = useState(true);
    const COIN_LIMIT = 10;

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (activeModal === 'coins') {
            fetchCoins(1, false);
        }
    }, [activeModal]);

    const fetchNotifications = async () => {
        try {
            const response = await StudentApi.getNotifications({ limit: 10 });
            if (response && response.results) {
                setNotifications(response.results);
                setUnreadCount(response.count);
            }
        } catch (e) {
            console.warn('Failed to fetch notifications', e);
        }
    };

    const fetchCoins = async (page: number, append: boolean) => {
        if (loadingCoins || (!hasMoreCoins && append)) return;

        try {
            setLoadingCoins(true);
            const offset = (page - 1) * COIN_LIMIT;
            const response = await StudentApi.getCoins({ limit: COIN_LIMIT, offset });

            if (append) {
                setCoins(prev => [...prev, ...response.results]);
            } else {
                setCoins(response.results);
            }

            setHasMoreCoins(!!response.next);
            setCoinPage(page);
        } catch (e) {
            console.warn('Failed to fetch coins', e);
        } finally {
            setLoadingCoins(false);
        }
    };

    const handleLoadMoreCoins = () => {
        if (hasMoreCoins && !loadingCoins) {
            fetchCoins(coinPage + 1, true);
        }
    };

    const closeModals = () => {
        setActiveModal('none');
        if (activeModal === 'notifications') {
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

    const renderCoinItem = ({ item }: { item: CoinInstance }) => {
        const isPositive = (item.extra_coins || 0) >= 0;
        const iconName = item.category.category_name.toLowerCase().includes('uy ishi') ? 'home'
            : item.category.category_name.toLowerCase().includes('faol') ? 'flash'
                : 'diamond';

        return (
            <View style={[styles.coinItem, { backgroundColor: theme === 'dark' ? '#1c1c1e' : '#f2f2f7' }]}>
                <View style={[styles.coinIconBox, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name={iconName as any} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.coinReason, { color: colors.text }]}>
                        {language === 'uz' ? item.extra_coin_reason_uz || item.extra_coin_reason
                            : language === 'ru' ? item.extra_coin_reason_ru || item.extra_coin_reason
                                : item.extra_coin_reason_en || item.extra_coin_reason}
                    </Text>
                    <Text style={[styles.coinDate, { color: colors.placeholder }]}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
                <Text style={[styles.coinValue, { color: isPositive ? colors.primary : '#ff453a' }]}>
                    {isPositive ? '+' : ''}{item.extra_coins || item.category.coin_count}
                </Text>
            </View>
        );
    };

    const renderModalContent = () => {
        switch (activeModal) {
            case 'coins':
                return (
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: 500 }]}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="diamond" size={24} color={colors.primary} />
                            <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 0 }]}>{i18n.coins}</Text>
                        </View>

                        <View style={[styles.totalCoinsBox, { backgroundColor: colors.primary + '10' }]}>
                            <Text style={[styles.totalCoinsLabel, { color: colors.placeholder }]}>Total Balance</Text>
                            <Text style={[styles.totalCoinsAmount, { color: colors.text }]}>{user?.coins || 0}</Text>
                        </View>

                        <FlatList
                            data={coins}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderCoinItem}
                            onEndReached={handleLoadMoreCoins}
                            onEndReachedThreshold={0.5}
                            ListEmptyComponent={
                                loadingCoins ? (
                                    <ActivityIndicator style={{ margin: 20 }} color={colors.primary} />
                                ) : (
                                    <Text style={{ padding: 20, textAlign: 'center', color: colors.placeholder }}>No coin history</Text>
                                )
                            }
                            ListFooterComponent={
                                loadingCoins && coins.length > 0 ? (
                                    <ActivityIndicator style={{ marginVertical: 10 }} color={colors.primary} />
                                ) : null
                            }
                            contentContainerStyle={{ paddingBottom: 10 }}
                        />
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
                            <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                                <Ionicons name={theme === 'dark' ? 'moon' : 'sunny'} size={20} color={colors.text} />
                            </View>
                            <Text style={[styles.menuText, { color: colors.text }]}>{i18n.theme}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={cycleLanguage} style={styles.menuItem}>
                            <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                                <Ionicons name="language" size={20} color={colors.text} />
                            </View>
                            <Text style={[styles.menuText, { color: colors.text }]}>{i18n.language} ({language.toUpperCase()})</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={logout} style={styles.menuItem}>
                            <View style={[styles.iconBox, { backgroundColor: colors.error + '15' }]}>
                                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                            </View>
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
                        <Ionicons name="diamond" size={16} color={colors.primary} />
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
        borderWidth: 1.5,
        gap: 6,
    },
    coinText: {
        fontWeight: '800',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxWidth: 400,
    },
    modalContent: {
        borderRadius: 24,
        padding: 24,
        width: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    totalCoinsBox: {
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    totalCoinsLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    totalCoinsAmount: {
        fontSize: 32,
        fontWeight: '900',
    },
    coinItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
        gap: 12,
    },
    coinIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coinReason: {
        fontSize: 15,
        fontWeight: '600',
    },
    coinDate: {
        fontSize: 12,
        marginTop: 2,
    },
    coinValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: {
        fontSize: 17,
        fontWeight: '600',
    },
    notifItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    notifTitle: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    notifDesc: {
        fontSize: 14,
        marginBottom: 6,
    },
    notifDate: {
        fontSize: 12,
        textAlign: 'right',
        opacity: 0.6
    },
    badgeContainer: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ff3b30',
        borderWidth: 2,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

