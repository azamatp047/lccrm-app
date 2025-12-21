import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Course, StudentApi } from '../../services/api';

const AnimatedProgressBar = ({ progress, colors }: { progress: number; colors: any }) => {
    const [width, setWidth] = React.useState(0);

    React.useEffect(() => {
        const timer = setTimeout(() => setWidth(progress), 100);
        return () => clearTimeout(timer);
    }, [progress]);

    return (
        <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
            <View
                style={[
                    styles.progressBarFill,
                    {
                        width: `${width}%`,
                        backgroundColor: colors.primary,
                    }
                ]}
            />
        </View>
    );
};

const CoursesPageCard = ({
    course,
    onPress,
    colors
}: {
    course: Course;
    onPress: () => void;
    colors: any;
}) => {
    const teacherName = course.teachers?.[0]?.name || 'No Teacher Assigned';

    return (
        <TouchableOpacity
            style={[styles.coursesCard, { backgroundColor: colors.surface }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.coursesCardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.coursesCardTitle, { color: colors.text }]} numberOfLines={2}>
                        {course.course_name || course.group_name}
                    </Text>
                    <Text style={[styles.coursesCardTeacher, { color: colors.placeholder }]}>
                        {teacherName}
                    </Text>
                </View>
                <View style={[styles.bookIconContainer, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="book" size={22} color={colors.primary} />
                </View>
            </View>

            <View style={styles.coursesProgressSection}>
                <Text style={[styles.coursesProgressLabel, { color: colors.primary }]}>
                    Progress {course.progress.progress_rate}%
                </Text>
            </View>

            <AnimatedProgressBar progress={course.progress.progress_rate} colors={colors} />

            <View style={styles.coursesInfoRow}>
                <View style={styles.coursesInfoItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.secondary} />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                        {course.progress.completed_lesson_count}/{course.progress.all_lessons} Lessons
                    </Text>
                </View>
                <View style={styles.coursesInfoItem}>
                    <Ionicons name="time-outline" size={16} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                        {course.duration}
                    </Text>
                </View>
                <View style={styles.coursesInfoItem}>
                    <Ionicons name="people-outline" size={16} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.text }]}>
                        {course.student_count} students
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export default function CoursesScreen() {
    const { theme } = useTheme();
    const { i18n } = useLanguage();
    const colors = Colors[theme];
    const router = useRouter();

    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('');

    const PAGE_SIZE = 10;

    const fetchCourses = async (pageNum: number, append: boolean = false, force: boolean = false) => {
        if (loading && !refreshing && !append && !force) return;

        try {
            if (!append) {
                setLoading(true);
                setError(null);
                setDebugInfo('Init fetch...');
            }

            const offset = (pageNum - 1) * PAGE_SIZE;

            // Timeout promise
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out (10s)')), 10000)
            );

            setDebugInfo(prev => prev + '\nCalling API...');

            const apiPromise = StudentApi.getStudentGroups({
                limit: PAGE_SIZE,
                offset
            });

            const response: any = await Promise.race([apiPromise, timeoutPromise]);

            setDebugInfo(prev => prev + '\nGot response.');

            let results: Course[] = [];
            if (Array.isArray(response)) {
                results = response;
            } else if (response?.results && Array.isArray(response.results)) {
                results = response.results;
            } else {
                console.warn('Unexpected response structure:', response);
                setDebugInfo(prev => prev + '\nUnknown structure.');
            }

            setDebugInfo(prev => prev + `\nParsed ${results.length} items.`);

            if (append) {
                setCourses(prev => [...prev, ...results]);
            } else {
                setCourses(results);
            }

            setHasMore(!!response?.next);
            setPage(pageNum);
        } catch (err: any) {
            console.error('Failed to fetch courses:', err);
            setError(err.message || 'Failed to load');
            setDebugInfo(prev => prev + `\nErr: ${err.message}`);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCourses(1, false, true);
    }, []);

    const handleLoadMore = useCallback(() => {
        if (!loading && hasMore) {
            fetchCourses(page + 1, true);
        }
    }, [loading, hasMore, page]);

    const handleRefresh = () => {
        setRefreshing(true);
        setPage(1);
        fetchCourses(1, false);
    };

    const handleCoursePress = (course: Course) => {
        router.push({
            pathname: '/(tabs)/course-detail',
            params: { id: course.id }
        });
    };

    if (error) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.error || 'red'} />
                <Text style={{ color: colors.text, fontSize: 16, textAlign: 'center', marginTop: 12, marginBottom: 20 }}>
                    {error}
                </Text>
                <Text style={{ color: colors.placeholder, fontSize: 10, fontFamily: 'monospace', marginBottom: 20 }}>
                    {debugInfo}
                </Text>
                <TouchableOpacity
                    onPress={() => fetchCourses(1, false)}
                    style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background}]}>
            <FlatList
                data={courses}
                keyExtractor={(item) => `course-${item.id}`}
                ListHeaderComponent={
                    <View style={styles.headerRow}>
                        <Text style={[styles.pageTitle, { color: colors.text }]}>Courses</Text>
                        {loading && <Text style={{ fontSize: 10, color: colors.placeholder }}>{debugInfo}</Text>}
                    </View>
                }
                renderItem={({ item }) => (
                    <CoursesPageCard
                        course={item}
                        onPress={() => handleCoursePress(item)}
                        colors={colors}
                    />
                )}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={{ marginTop: 10, color: colors.placeholder }}>Loading courses...</Text>
                        </View>
                    ) : (
                        <View style={styles.centerContainer}>
                            <Text style={{ color: colors.placeholder }}>
                                {i18n.coming_soon}
                            </Text>
                            <Text style={{ fontSize: 10, color: colors.placeholder, marginTop: 10 }}>Debug: {debugInfo}</Text>
                        </View>
                    )
                }
                ListFooterComponent={
                    loading && courses.length > 0 ? (
                        <ActivityIndicator
                            size="small"
                            color={colors.primary}
                            style={{ marginVertical: 20 }}
                        />
                    ) : null
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    headerRow: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginVertical: 10,
    },
    progressBarFill: {
        height: 8,
        borderRadius: 4,
    },
    coursesCard: {
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    coursesCardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    coursesCardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    coursesCardTeacher: {
        fontSize: 14,
    },
    bookIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    coursesProgressSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 4,
    },
    coursesProgressLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    coursesInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        gap: 8,
    },
    coursesInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    infoText: {
        fontSize: 12,
        fontWeight: '500',
        flexShrink: 1,
    },
});