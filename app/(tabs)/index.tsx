
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
import { HomeCourseCard } from '../../components/HomeCourseCard';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { StudentApi } from '../../services/api';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { i18n, language } = useLanguage();
  const colors = Colors[theme];
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [groupsCount, setGroupsCount] = useState(0);
  const [groupsNext, setGroupsNext] = useState<string | null>(null);
  const [groupsPage, setGroupsPage] = useState(1);
  const [lessons, setLessons] = useState<any[]>([]);

  const GROUPS_PAGE_SIZE = 10;


  const fetchGroups = async (page = 1, append = false) => {
    try {
      const params = { limit: GROUPS_PAGE_SIZE, offset: (page - 1) * GROUPS_PAGE_SIZE };
      const groupsData = await StudentApi.getStudentGroups(params);
      const results = Array.isArray(groupsData) ? groupsData : (groupsData?.results || []);
      if (append) {
        setGroups((prev) => [...prev, ...results]);
      } else {
        setGroups(results);
      }
      setGroupsCount(groupsData?.count || results.length);
      setGroupsNext(groupsData?.next || null);
      setGroupsPage(page);
    } catch (e) {
      console.warn('Groups fetch failed', e);
    }
  };

  const fetchLessons = async () => {
    try {
      const lessonsData = await StudentApi.getMyLessons();
      setLessons(Array.isArray(lessonsData) ? lessonsData : (lessonsData?.results || []));
    } catch (e) {
      console.warn('Lessons fetch failed', e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchGroups(1, false), fetchLessons()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLoadMore = useCallback(() => {
    if (!loading && groups.length < groupsCount && groupsNext) {
      fetchGroups(groupsPage + 1, true);
    }
  }, [groups, groupsCount, groupsNext, groupsPage, loading]);

  const handleViewAll = () => {
    router.push('/(tabs)/courses');
  };

  const handleCoursePress = (group: any) => {
    router.push({ pathname: '/(tabs)/course-detail', params: { id: group.id } });
  };


  // Helper to get localized course name
  const getCourseName = (item: any) => {
    // Try language-specific fields if available, fallback to generic
    if (language === 'ru' && item.course_name_ru) return item.course_name_ru;
    if (language === 'en' && item.course_name_en) return item.course_name_en;
    if (language === 'uz' && item.course_name_uz) return item.course_name_uz;
    return item.course_name || item.name || 'Course';
  };

  const renderGroupItem = ({ item }: { item: any }) => (
    <HomeCourseCard
      title={getCourseName(item)}
      completed={item.progress?.completed_lesson_count || 0}
      total={item.progress?.all_lessons || 0}
      progress={item.progress?.progress_rate || 0}
      onPress={() => handleCoursePress(item)}
      colors={colors}
    />
  );

  const renderLessonItem = ({ item }: { item: any }) => (
    <View style={[styles.lessonCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.dateBox, { backgroundColor: colors.background }]}>
        {/* Parsing date if available */}
        <Text style={[styles.dateText, { color: colors.text }]}>
          {item.date || 'Today'}
        </Text>
      </View>
      <View style={{ flex: 1, paddingLeft: 12 }}>
        <Text style={[styles.lessonTitle, { color: colors.text }]}>{item.topic || 'No Topic'}</Text>
        <Text style={[styles.lessonTime, { color: colors.primary }]}>
          {item.start_time} - {item.end_time}
        </Text>
      </View>
      {item.status === 'ended' && (
        <Ionicons name="checkmark-circle" size={20} color={colors.secondary} />
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <FlatList
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Active Courses</Text>
              <TouchableOpacity onPress={handleViewAll} style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>View all &gt;</Text>
              </TouchableOpacity>
            </View>
            {/* Lessons Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Lessons</Text>
              {lessons && lessons.length > 0 ? lessons.map((lesson: any) => (
                <View
                  key={lesson.id}
                  style={[
                    styles.lessonCard,
                    lesson.status === 'ended'
                      ? { backgroundColor: '#22c55e22' }
                      : lesson.status === 'current'
                      ? { backgroundColor: '#2563eb22' }
                      : { backgroundColor: colors.surface, opacity: 0.6 },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.lessonTitle, { color: colors.text }]}>
                      {lesson.topic || 'No topic'}
                    </Text>
                    <Text style={[styles.lessonTime, { color: colors.primary }]}> 
                      {lesson.start_time} - {lesson.end_time}
                    </Text>
                  </View>
                  {lesson.status === 'ended' && (
                    <Ionicons name="checkmark-circle" size={22} color="#22c55e" />
                  )}
                  {lesson.status === 'current' && (
                    <Ionicons name="play" size={22} color="#2563eb" />
                  )}
                  {lesson.status !== 'ended' && lesson.status !== 'current' && (
                    <Ionicons name="close-circle" size={22} color={colors.placeholder} />
                  )}
                </View>
              )) : (
                <Text style={{ color: colors.placeholder }}>No lessons</Text>
              )}
            </View>
          </>
        }
        data={groups}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGroupItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.primary} /> : <Text style={{ color: colors.placeholder, textAlign: 'center', marginTop: 32 }}>No active courses found</Text>}
        contentContainerStyle={styles.scrollContent}
        ListFooterComponent={loading && groups.length > 0 ? <ActivityIndicator color={colors.primary} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  viewAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllText: {
    color: '#4f8cff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    width: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardSub: {
    fontSize: 12,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  lessonTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  lessonTime: {
    fontSize: 14,
    fontWeight: '500',
  },
});
