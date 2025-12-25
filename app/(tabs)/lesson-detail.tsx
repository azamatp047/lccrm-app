import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useTheme } from '../../contexts/ThemeContext';
import { StudentApi, StudentLessonDetails } from '../../services/api';

export default function LessonDetailScreen() {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { groupId, lessonId } = useLocalSearchParams();
    const router = useRouter();

    const [lesson, setLesson] = useState<StudentLessonDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLesson = async () => {
            if (!groupId || !lessonId) return;
            try {
                setLoading(true);
                const data = await StudentApi.getLessonDetails(Number(groupId), Number(lessonId));
                setLesson(data);
            } catch (error) {
                console.error('Failed to fetch lesson details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLesson();
    }, [groupId, lessonId]);

    const handleVideoPress = () => {
        if (lesson?.lesson_video_url) {
            Linking.openURL(lesson.lesson_video_url).catch(err =>
                console.error("Couldn't load page", err)
            );
        }
    };

    const handleSubmitPress = () => {
        router.push({
            pathname: '/(tabs)/submit-homework',
            params: { groupId, lessonId }
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!lesson) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Lesson not found</Text>
            </View>
        );
    }

    // Parse materials if they are strings (JSON)
    let classMaterials = [];
    let homeworkMaterials = [];
    try {
        if (typeof lesson.class_materials === 'string') classMaterials = JSON.parse(lesson.class_materials);
        else classMaterials = lesson.class_materials || [];
    } catch (e) { console.warn('Parse error class_materials', e); }

    try {
        if (typeof lesson.homework_materials === 'string') homeworkMaterials = JSON.parse(lesson.homework_materials);
        else homeworkMaterials = lesson.homework_materials || [];
    } catch (e) { console.warn('Parse error homework_materials', e); }


    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Lesson Details</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Video Section */}
            <View style={styles.content}>
                <TouchableOpacity
                    style={[styles.videoContainer, { backgroundColor: '#000' }]}
                    onPress={handleVideoPress}
                    activeOpacity={0.9}
                >
                    <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.videoText}>Watch Video Lesson</Text>
                </TouchableOpacity>

                {/* Topic */}
                <Text style={[styles.topicTitle, { color: colors.text }]}>
                    {lesson.topic || 'No Topic'}
                </Text>

                {/* Class Materials */}
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="library-outline" size={24} color={colors.primary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Class Materials</Text>
                    </View>
                    {classMaterials.length > 0 ? (
                        classMaterials.map((item: any, index: number) => (
                            <TouchableOpacity key={index} style={[styles.materialItem, { borderBottomColor: colors.border }]}>
                                <Ionicons name="document-text-outline" size={20} color={colors.text} />
                                <Text style={[styles.materialText, { color: colors.primary }]}>
                                    {item.name || item.url || `Material ${index + 1}`}
                                </Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={{ color: colors.placeholder, marginTop: 8 }}>No class materials</Text>
                    )}
                </View>

                {/* Homework Materials */}
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="create-outline" size={24} color={colors.secondary} />
                        <Text style={[styles.cardTitle, { color: colors.text }]}>Homework Materials</Text>
                    </View>
                    {homeworkMaterials.length > 0 ? (
                        homeworkMaterials.map((item: any, index: number) => (
                            <TouchableOpacity key={index} style={[styles.materialItem, { borderBottomColor: colors.border }]}>
                                <Ionicons name="document-attach-outline" size={20} color={colors.text} />
                                <Text style={[styles.materialText, { color: colors.primary }]}>
                                    {item.name || item.url || `Assignment ${index + 1}`}
                                </Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={{ color: colors.placeholder, marginTop: 8 }}>No homework materials</Text>
                    )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={handleSubmitPress}
                >
                    <Text style={styles.submitButtonText}>Submit Homework</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
        paddingBottom: 120,
    },
    videoContainer: {
        height: 200,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        overflow: 'hidden',
    },
    videoText: {
        color: '#fff',
        marginTop: 12,
        fontWeight: '600',
    },
    topicTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    card: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    materialItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    materialText: {
        fontSize: 14,
        fontWeight: '500',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 18,
        borderRadius: 16,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
