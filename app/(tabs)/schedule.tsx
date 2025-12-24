
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Lesson, MyLessonsResponse, StudentApi } from '../../services/api';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 32) / 7;

export default function ScheduleScreen() {
    const { theme } = useTheme();
    const { i18n, language } = useLanguage();
    const colors = Colors[theme];

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [lessonsData, setLessonsData] = useState<MyLessonsResponse>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    useEffect(() => {
        fetchLessons(currentMonth + 1, currentYear);
    }, [currentMonth, currentYear]);

    const fetchLessons = async (month: number, year: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await StudentApi.getMyLessons({ month, year });
            setLessonsData(data);
        } catch (error) {
            console.error('Failed to fetch lessons:', error);
            setError(language === 'uz' ? 'Darslarni yuklashda xato yuz berdi' : language === 'ru' ? 'Ошибка при загрузке уроков' : 'Failed to load lessons');
        } finally {
            setIsLoading(false);
        }
    };

    const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month: number, year: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Adjust to Monday start
    };

    const formatDateKey = (date: Date) => {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}.${m}.${y}`;
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const handleGoToToday = () => {
        const today = new Date();
        setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(today);
    };

    const weekDays = ['Mn', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    const calendarDays = useMemo(() => {
        const days = [];
        const numDays = daysInMonth(currentMonth, currentYear);
        const startDay = firstDayOfMonth(currentMonth, currentYear);

        for (let i = 0; i < startDay; i++) days.push(null);
        for (let i = 1; i <= numDays; i++) days.push(new Date(currentYear, currentMonth, i));

        return days;
    }, [currentMonth, currentYear]);

    const selectedLessons = useMemo(() => {
        const key = formatDateKey(selectedDate);
        return lessonsData[key] || [];
    }, [selectedDate, lessonsData]);

    const renderLesson = (lesson: Lesson, index: number) => (
        <Animated.View
            key={lesson.id}
            entering={FadeInDown.delay(index * 50).duration(300)}
            style={[styles.lessonCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
            <View style={[styles.lessonAccent, { backgroundColor: colors.primary }]} />
            <View style={styles.lessonTimeContainer}>
                <Text style={[styles.lessonTime, { color: colors.text }]}>{lesson.start_time}</Text>
                <View style={[styles.timeDivider, { backgroundColor: colors.border }]} />
                <Text style={[styles.lessonTime, { color: colors.placeholder, fontSize: 12 }]}>{lesson.end_time}</Text>
            </View>
            <View style={styles.lessonContent}>
                <Text style={[styles.lessonTopic, { color: colors.text }]} numberOfLines={2}>
                    {lesson.topic || 'Untitled Lesson'}
                </Text>
                <View style={styles.lessonDetails}>
                    {lesson.teachers.length > 0 && (
                        <View style={styles.detailItem}>
                            <Ionicons name="person-outline" size={14} color={colors.placeholder} />
                            <Text style={[styles.detailText, { color: colors.placeholder }]}>
                                {lesson.teachers.join(', ')}
                            </Text>
                        </View>
                    )}
                    {lesson.room && (
                        <View style={styles.detailItem}>
                            <Ionicons name="location-outline" size={14} color={colors.placeholder} />
                            <Text style={[styles.detailText, { color: colors.placeholder }]}>
                                {lesson.room.name || lesson.room.number}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: colors.placeholder }]}>
                            {language === 'uz' ? 'Darslar jadvali' : language === 'ru' ? 'Расписание занятий' : 'Your Schedule'}
                        </Text>
                        <Text style={[styles.monthYear, { color: colors.text }]}>
                            {currentDate.toLocaleDateString(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' })}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleGoToToday}
                        style={[styles.todayButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                        <Ionicons name="today-outline" size={16} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.todayButtonText, { color: colors.primary }]}>
                            {language === 'uz' ? 'Bugun' : language === 'ru' ? 'Сегодня' : 'Today'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.calendarContainer, { borderColor: colors.border }]}>
                    <View style={styles.calendarNav}>
                        <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                            <Ionicons name="chevron-back" size={20} color={colors.text} />
                        </TouchableOpacity>
                        <View style={styles.weekDaysContainer}>
                            {weekDays.map(day => (
                                <View key={day} style={styles.weekDayWrapper}>
                                    <Text style={[styles.weekDayText, { color: colors.placeholder }]}>{day}</Text>
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                            <Ionicons name="chevron-forward" size={20} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.daysGrid}>
                        {calendarDays.map((date, index) => {
                            if (!date) return <View key={`empty-${index}`} style={styles.dayWrapper} />;

                            const isSelected = isSameDay(date, selectedDate);
                            const dateKey = formatDateKey(date);
                            const hasLessons = !!lessonsData[dateKey];
                            const isToday = isSameDay(date, new Date());

                            return (
                                <TouchableOpacity
                                    key={date.toISOString()}
                                    style={[
                                        styles.dayWrapper,
                                        isSelected && { backgroundColor: colors.primary, borderRadius: 12 }
                                    ]}
                                    onPress={() => setSelectedDate(date)}
                                >
                                    <Text style={[
                                        styles.dayText,
                                        { color: isSelected ? '#fff' : colors.text },
                                        isToday && !isSelected && { color: colors.primary, fontWeight: '800' }
                                    ]}>
                                        {date.getDate()}
                                    </Text>
                                    {hasLessons && !isSelected && (
                                        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.lessonsSection}>
                    <View style={styles.lessonsHeader}>
                        <Text style={[styles.lessonsTitle, { color: colors.text }]}>
                            {isSameDay(selectedDate, new Date())
                                ? (language === 'uz' ? 'Bugungi darslar' : language === 'ru' ? 'Сегодняшние уроки' : 'Today\'s Lessons')
                                : `${i18n.lessons}`}
                        </Text>
                        <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
                            <Text style={[styles.badgeText, { color: colors.primary }]}>
                                {selectedLessons.length}
                            </Text>
                        </View>
                    </View>

                    {isLoading ? (
                        <View style={styles.centerContent}>
                            <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                    ) : error ? (
                        <View style={styles.centerContent}>
                            <Text style={[styles.emptyText, { color: colors.error }]}>{error}</Text>
                            <TouchableOpacity
                                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                                onPress={() => fetchLessons(currentMonth + 1, currentYear)}
                            >
                                <Text style={styles.retryText}>Retry</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.lessonsList}>
                            {selectedLessons.length > 0 ? (
                                selectedLessons.map((lesson, index) => renderLesson(lesson, index))
                            ) : (
                                <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
                                    <Text style={[styles.emptyText, { color: colors.placeholder }]}>
                                        {language === 'uz' ? 'Darslar yo\'q' : language === 'ru' ? 'Нет уроков' : 'No lessons'}
                                    </Text>
                                </Animated.View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 60,
        paddingBottom: 120, // Final fix for footer
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    greeting: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 2,
    },
    monthYear: {
        fontSize: 20,
        fontWeight: '700',
    },
    todayButton: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },
    todayButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    calendarContainer: {
        marginHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    calendarNav: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    navBtn: {
        padding: 8,
    },
    weekDaysContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    weekDayWrapper: {
        width: COLUMN_WIDTH,
        alignItems: 'center',
    },
    weekDayText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayWrapper: {
        width: COLUMN_WIDTH,
        height: COLUMN_WIDTH * 0.9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayText: {
        fontSize: 15,
        fontWeight: '600',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        position: 'absolute',
        bottom: 6,
    },
    lessonsSection: {
        marginTop: 24,
    },
    lessonsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    lessonsTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    centerContent: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    lessonsList: {
        paddingHorizontal: 16,
    },
    lessonCard: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
    },
    lessonAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    lessonTimeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 12,
        minWidth: 60,
    },
    lessonTime: {
        fontSize: 14,
        fontWeight: '700',
    },
    timeDivider: {
        width: 10,
        height: 1,
        marginVertical: 4,
    },
    lessonContent: {
        flex: 1,
    },
    lessonTopic: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 6,
    },
    lessonDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    detailText: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '500',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: '600',
    },
});
