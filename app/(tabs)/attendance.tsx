import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { AttendanceResponse, StudentApi } from '../../services/api';

export default function AttendanceScreen() {
    const { theme } = useTheme();
    const { i18n } = useLanguage();
    const colors = Colors[theme];
    const isDark = theme === 'dark';

    const [loading, setLoading] = useState(true);
    const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null);

    const fetchAttendance = async () => {
        try {
            const data = await StudentApi.getAttendance();
            setAttendanceData(data);
        } catch (error) {
            console.warn('Failed to fetch attendance', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Present':
                return '#16A34A';
            case 'Absent':
                return '#DC2626';
            case 'Upcoming':
                return '#2563EB';
            default:
                return colors.placeholder;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Present':
                return 'checkmark-circle';
            case 'Absent':
                return 'close-circle';
            case 'Upcoming':
                return 'time';
            default:
                return 'help-circle';
        }
    };

    const getStatusBg = (status: string) => {
        if (isDark) {
            switch (status) {
                case 'Present':
                    return 'rgba(22, 163, 74, 0.1)';
                case 'Absent':
                    return 'rgba(220, 38, 38, 0.1)';
                case 'Upcoming':
                    return 'rgba(37, 99, 235, 0.1)';
                default:
                    return 'rgba(156, 163, 175, 0.1)';
            }
        } else {
            switch (status) {
                case 'Present':
                    return '#F0FDF4';
                case 'Absent':
                    return '#FEF2F2';
                case 'Upcoming':
                    return '#EFF6FF';
                default:
                    return '#F9FAFB';
            }
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
                <ActivityIndicator color={colors.primary} size="large" />
            </View>
        );
    }

    const sortedDates = attendanceData ? Object.keys(attendanceData).sort((a, b) => {
        // Sort dates in descending order (newest first)
        const dateA = a.split('.').reverse().join('-');
        const dateB = b.split('.').reverse().join('-');
        return dateB.localeCompare(dateA);
    }) : [];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.scrollContent}
        >
            <Text style={[styles.title, { color: colors.text }]}>{i18n.attendance}</Text>

            {sortedDates.length > 0 ? (
                sortedDates.map((date) => (
                    <View key={date} style={styles.dateSection}>
                        <View style={styles.dateHeader}>
                            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                            <Text style={[styles.dateText, { color: colors.text }]}>{date}</Text>
                        </View>

                        {attendanceData![date].map((record) => (
                            <View
                                key={record.id}
                                style={[
                                    styles.card,
                                    {
                                        backgroundColor: colors.surface,
                                        borderColor: isDark ? colors.border : 'rgba(0,0,0,0.05)',
                                        borderWidth: 1
                                    }
                                ]}
                            >
                                <View style={styles.cardHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.lessonTopic, { color: colors.text }]}>
                                            {record.lesson.topic || 'No topic'}
                                        </Text>
                                        <Text style={[styles.lessonTime, { color: colors.placeholder }]}>
                                            {record.lesson.start_time.substring(0, 5)} - {record.lesson.end_time.substring(0, 5)}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusBg(record.status) }
                                    ]}>
                                        <Ionicons
                                            name={getStatusIcon(record.status) as any}
                                            size={16}
                                            color={getStatusColor(record.status)}
                                            style={{ marginRight: 4 }}
                                        />
                                        <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
                                            {record.status}
                                        </Text>
                                    </View>
                                </View>

                                {(record.came_at || record.left_at) && (
                                    <View style={styles.footer}>
                                        {record.came_at && (
                                            <View style={styles.timeInfo}>
                                                <Text style={[styles.timeLabel, { color: colors.placeholder }]}>Came at:</Text>
                                                <Text style={[styles.timeValue, { color: colors.text }]}>{record.came_at.substring(0, 5)}</Text>
                                            </View>
                                        )}
                                        {record.left_at && (
                                            <View style={styles.timeInfo}>
                                                <Text style={[styles.timeLabel, { color: colors.placeholder }]}>Left at:</Text>
                                                <Text style={[styles.timeValue, { color: colors.text }]}>{record.left_at.substring(0, 5)}</Text>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                ))
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={64} color={colors.placeholder} />
                    <Text style={[styles.emptyText, { color: colors.placeholder }]}>No attendance records found</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 24,
    },
    dateSection: {
        marginBottom: 24,
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    dateText: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 8,
    },
    card: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lessonTopic: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    lessonTime: {
        fontSize: 14,
        fontWeight: '500',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    timeLabel: {
        fontSize: 13,
        fontWeight: '500',
        marginRight: 4,
    },
    timeValue: {
        fontSize: 13,
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },
});
