import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useTheme } from '../../contexts/ThemeContext';
import { StudentApi } from '../../services/api';

interface Lesson {
    id: number;
    topic: string | null;
    status: 'ended' | 'current' | 'disabled' | string;
    start_time: string;
    end_time: string;
}

interface CourseProgress {
    all_lessons: number;
    completed_lesson_count: number;
    progress_rate: number;
}

interface CourseDetail {
    id: number;
    name: string;
    lessons: Lesson[];
    progress: CourseProgress;
}

const AnimatedProgressBar = ({ progress, colors }: { progress: number; colors: any }) => {
    const animValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.timing(animValue, {
            toValue: progress,
            duration: 1000,
            useNativeDriver: false,
        }).start();
    }, [progress, animValue]);

    const widthInterpolate = animValue.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <Animated.View
                style={[
                    styles.progressBarFill,
                    {
                        width: widthInterpolate,
                        backgroundColor: colors.primary,
                    },
                ]}
            />
        </View>
    );
};

const LessonCard = ({
    lesson,
    onPress,
    colors,
}: {
    lesson: Lesson;
    onPress: () => void;
    colors: any;
}) => {
    const getStatusConfig = () => {
        const isDark = colors.text === '#fff';
        switch (lesson.status) {
            case 'ended':
                return {
                    bg: isDark ? '#22c55e22' : '#DCFCE7',
                    borderColor: isDark ? '#22c55e44' : '#22c55e',
                    icon: 'checkmark-circle',
                    iconColor: isDark ? '#22c55e' : '#16A34A',
                    clickable: true,
                };
            case 'current':
                return {
                    bg: isDark ? '#2563eb22' : '#DBEAFE',
                    borderColor: isDark ? '#2563eb44' : '#2563EB',
                    icon: 'play-circle',
                    iconColor: isDark ? '#2563eb' : '#2563EB',
                    clickable: true,
                };
            default:
                return {
                    bg: colors.surface,
                    borderColor: colors.border,
                    icon: 'close-circle',
                    iconColor: colors.placeholder,
                    clickable: false,
                };
        }
    };

    const config = getStatusConfig();

    return (
        <TouchableOpacity
            style={[
                styles.lessonCard,
                {
                    backgroundColor: config.bg,
                    borderColor: config.borderColor,
                    borderWidth: 1.5,
                    opacity: config.clickable ? 1 : 0.6,
                },
            ]}
            onPress={config.clickable ? onPress : undefined}
            activeOpacity={config.clickable ? 0.85 : 1}
            disabled={!config.clickable}
        >
            <View style={styles.lessonContent}>
                <View style={{ flex: 1 }}>
                    <Text
                        style={[
                            styles.lessonTopic,
                            {
                                color: config.clickable ? colors.text : colors.placeholder,
                            },
                        ]}
                    >
                        {lesson.topic || 'No Topic'}
                    </Text>
                    <Text
                        style={[
                            styles.lessonTime,
                            {
                                color: config.clickable ? colors.primary : colors.placeholder,
                            },
                        ]}
                    >
                        {lesson.start_time} - {lesson.end_time}
                    </Text>
                </View>
                <Ionicons
                    name={config.icon as any}
                    size={28}
                    color={config.iconColor}
                />
            </View>
        </TouchableOpacity>
    );
};

export default function CourseDetailScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [course, setCourse] = useState<CourseDetail | null>(null);

    const fetchCourseDetail = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const data = await StudentApi.getGroupDetails(Number(id));
            // Transform data.progress from string to CourseProgress object if needed
            const courseDetail: CourseDetail = {
                ...data,
                progress: typeof data.progress === 'string'
                    ? JSON.parse(data.progress)
                    : data.progress,
            };
            setCourse(courseDetail);
        } catch (error) {
            console.error('Failed to fetch course detail:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCourseDetail();
    }, [id]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchCourseDetail();
    };

    const handleLessonPress = (lesson: Lesson) => {
        router.push({
            pathname: '/(tabs)/lesson-detail',
            params: { groupId: id as string, lessonId: lesson.id }
        });
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!course) {
        return (
            <View style={[styles.center, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle-outline" size={64} color={colors.placeholder} />
                <Text style={[styles.errorText, { color: colors.text }]}>
                    Course not found
                </Text>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: 16 }]}>
            <FlatList
                data={course.lessons}
                keyExtractor={(item) => `lesson-${item.id}`}
                ListHeaderComponent={
                    <View style={[styles.detailHeader, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.detailTitle, { color: colors.text }]}>
                            {course.name}
                        </Text>
                        <Text style={[styles.detailProgress, { color: colors.placeholder }]}>
                            {course.progress.completed_lesson_count} of {course.progress.all_lessons} lessons completed
                        </Text>
                        <AnimatedProgressBar
                            progress={course.progress.progress_rate}
                            colors={colors}
                        />
                    </View>
                }
                renderItem={({ item }) => (
                    <LessonCard
                        lesson={item}
                        onPress={() => handleLessonPress(item)}
                        colors={colors}
                    />
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="school-outline" size={64} color={colors.placeholder} />
                        <Text style={{ color: colors.placeholder, marginTop: 16 }}>
                            No lessons available
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    listContent: {
        paddingBottom: 100,
    },
    detailHeader: {
        padding: 20,
        marginBottom: 16,
        borderRadius: 18,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    detailTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    detailProgress: {
        fontSize: 16,
        marginBottom: 12,
        fontWeight: '500',
    },
    progressBarBg: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        marginTop: 8,
    },
    progressBarFill: {
        height: 10,
        borderRadius: 5,
    },
    lessonCard: {
        borderRadius: 16,
        padding: 18,
        marginHorizontal: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 6,
        elevation: 2,
    },
    lessonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    lessonTopic: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },
    lessonTime: {
        fontSize: 14,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 24,
    },
    backButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});