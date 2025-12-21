import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { StudentApi, StudentGroupRatings, StudentProfileDetails } from '../../services/api';

const RankIcon = ({ rank, color }: { rank: number; color: string }) => {
    if (rank === 1) return <Ionicons name="trophy" size={24} color="#040ec9ff" />;
    if (rank === 2) return <Ionicons name="medal" size={22} color="#C0C0C0" />;
    if (rank === 3) return <Ionicons name="medal" size={22} color="#CD7F32" />;
    return (
        <View style={[styles.rankBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.rankText, { color: color }]}>{rank}</Text>
        </View>
    );
};

export default function RatingsScreen() {
    const { theme } = useTheme();
    const { i18n } = useLanguage();
    const colors = Colors[theme];

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [profile, setProfile] = useState<StudentProfileDetails | null>(null);
    const [allRatings, setAllRatings] = useState<StudentGroupRatings[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<StudentGroupRatings | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [profileData, ratingsResponse] = await Promise.all([
                StudentApi.getProfile(),
                StudentApi.getGroupRatings({ limit: 100 }) // Fetch up to 100 groups
            ]);

            setProfile(profileData);
            setAllRatings(ratingsResponse.results);

            if (ratingsResponse.results.length > 0) {
                // Keep selected group if it still exists, otherwise pick first one
                if (selectedGroup) {
                    const stillExists = ratingsResponse.results.find(g => g.id === selectedGroup.id);
                    setSelectedGroup(stillExists || ratingsResponse.results[0]);
                } else {
                    setSelectedGroup(ratingsResponse.results[0]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch ratings data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const isCurrentUser = (studentName: string) => {
        if (!profile) return false;
        const fullName = `${profile.first_name} ${profile.last_name}`.trim();
        return studentName.trim() === fullName;
    };

    // Calculate rank for current user in selected group
    const getUserRank = () => {
        if (!selectedGroup || !profile) return null;
        // The students are likely already sorted by coin descending from backend
        // Sort explicitly just in case
        const sorted = [...selectedGroup.students].sort((a, b) => b.coin - a.coin);
        const index = sorted.findIndex(s => isCurrentUser(s.user));
        return index !== -1 ? index + 1 : null;
    };

    const userRank = getUserRank();

    if (loading && !refreshing) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header / Title area */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{i18n.ratings}</Text>
                {userRank && (
                    <View style={[styles.currentUserRank, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="trending-up" size={16} color={colors.primary} />
                        <Text style={[styles.rankLabel, { color: colors.primary }]}>
                            Your rank: <Text style={{ fontWeight: 'bold' }}>{userRank}</Text>
                        </Text>
                    </View>
                )}
            </View>

            {/* Group Selector */}
            <View style={styles.selectorContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.selectorScroll}
                >
                    {allRatings.map((group) => (
                        <TouchableOpacity
                            key={group.id}
                            onPress={() => setSelectedGroup(group)}
                            style={[
                                styles.selectorItem,
                                { backgroundColor: selectedGroup?.id === group.id ? colors.primary : colors.surface },
                                selectedGroup?.id === group.id && styles.selectorItemSelected
                            ]}
                        >
                            <Text
                                style={[
                                    styles.selectorText,
                                    { color: selectedGroup?.id === group.id ? '#fff' : colors.text }
                                ]}
                            >
                                {group.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Rankings List */}
            <FlatList
                data={selectedGroup?.students || []}
                keyExtractor={(item) => `student-${item.id}`}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                renderItem={({ item, index }) => {
                    const isMe = isCurrentUser(item.user);
                    const rank = index + 1;

                    return (
                        <View
                            style={[
                                styles.studentRow,
                                { backgroundColor: colors.surface },
                                isMe && { borderColor: '#9a850fff', borderWidth: 2, backgroundColor: '#FFF9E5' } // Yellowish highlight for current user
                            ]}
                        >
                            <View style={styles.rankContainer}>
                                <RankIcon rank={rank} color={colors.placeholder} />
                            </View>

                            <View style={styles.studentInfo}>
                                <Text
                                    style={[
                                        styles.studentName,
                                        { color: isMe ? '#041385ff' : colors.text },
                                        isMe && { fontWeight: 'bold' }
                                    ]}
                                >
                                    {item.user} {isMe && "(Sen)"}
                                </Text>
                            </View>

                            <View style={styles.coinContainer}>
                                <Ionicons name="diamond" size={16} color="#0008ffff" />
                                <Text style={[styles.coinText, { color: '#0008ffff' }]}>
                                    {item.coin}
                                </Text>
                            </View>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="stats-chart-outline" size={64} color={colors.placeholder} />
                        <Text style={{ color: colors.placeholder, marginTop: 16 }}>
                            No rankings available for this group.
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    currentUserRank: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    rankLabel: {
        fontSize: 14,
    },
    selectorContainer: {
        marginVertical: 10,
    },
    selectorScroll: {
        paddingHorizontal: 15,
        gap: 10,
    },
    selectorItem: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        minWidth: 100,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    selectorItemSelected: {
        shadowOpacity: 0.2,
        elevation: 4,
    },
    selectorText: {
        fontSize: 14,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingBottom: 100, // Enough space for floating tab bar
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    rankContainer: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankBadge: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    studentInfo: {
        flex: 1,
        marginLeft: 10,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '500',
    },
    coinContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.03)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    coinText: {
        fontSize: 16,
        fontWeight: '700',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
});
