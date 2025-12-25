import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { AttendanceStatistics, StudentApi } from '../services/api';


interface AttendanceStatisticsCardProps {
    onDataFetched?: () => void;
}

export const AttendanceStatisticsCard: React.FC<AttendanceStatisticsCardProps> = ({ onDataFetched }) => {
    const { theme } = useTheme();
    const { i18n } = useLanguage();
    const { width } = useWindowDimensions();
    const colors = Colors[theme];
    const router = useRouter();
    const [data, setData] = useState<AttendanceStatistics | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAttendance = async () => {
        try {
            const stats = await StudentApi.getAttendanceStatistics();
            setData(stats);
            if (onDataFetched) onDataFetched();
        } catch (error) {
            console.warn('Failed to fetch attendance statistics', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    if (loading) {
        return (
            <View style={[styles.mainCard, { backgroundColor: colors.surface, justifyContent: 'center' }]}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    if (!data) return null;

    const isDark = theme === 'dark';

    // Premium background colors for the main card based on theme
    const mainCardBg = isDark ? colors.surface : '#6366F1';
    const borderColor = isDark ? colors.border : 'transparent';
    const subCardBg = isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
    const subValueColor = isDark ? colors.text : '#1F2937';
    const subLabelColor = isDark ? colors.placeholder : '#6B7280';
    const titleColor = isDark ? colors.text : '#FFFFFF';
    const calendarIconColor = isDark ? colors.placeholder : 'rgba(255,255,255,0.7)';

    return (
        <View style={[styles.mainCard, { backgroundColor: mainCardBg, borderColor, borderWidth: isDark ? 1 : 0 }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="calendar-outline" size={20} color={calendarIconColor} style={{ marginRight: 8 }} />
                    <Text style={[styles.title, { color: titleColor }]}>{i18n.attendance}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(tabs)/attendance')}>
                    <Text style={[styles.viewAllText, { color: titleColor, opacity: 0.8 }]}>
                        {i18n.view_all} &gt;
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
                <View style={[styles.statItem, { backgroundColor: subCardBg }]}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? '#064E3B' : '#DCFCE7' }]}>
                        <Ionicons name="checkmark-done" size={20} color={isDark ? '#34D399' : '#166534'} />
                    </View>
                    <Text style={[styles.statValue, { color: subValueColor }]}>{data.present_attendance_count}</Text>
                    <Text style={[styles.statLabel, { color: subLabelColor }]}>Present</Text>
                </View>

                <View style={[styles.statItem, { backgroundColor: subCardBg }]}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2' }]}>
                        <Ionicons name="close" size={20} color={isDark ? '#F87171' : '#991B1B'} />
                    </View>
                    <Text style={[styles.statValue, { color: subValueColor }]}>{data.absent_attendance_count}</Text>
                    <Text style={[styles.statLabel, { color: subLabelColor }]}>Absent</Text>
                </View>

                <View style={[styles.statItem, { backgroundColor: subCardBg }]}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE' }]}>
                        <Ionicons name="trending-up" size={20} color={isDark ? '#60A5FA' : '#1E40AF'} />
                    </View>
                    <Text style={[styles.statValue, { color: subValueColor }]}>{data.rate_attendance_count}%</Text>
                    <Text style={[styles.statLabel, { color: subLabelColor }]}>Rate</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainCard: {
        padding: 20,
        borderRadius: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
        marginHorizontal: 4,
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 19,
        fontWeight: '800',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
});
