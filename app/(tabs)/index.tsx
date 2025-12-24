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
import { AttendanceStatisticsCard } from '../../components/AttendanceStatistics';
import { HomeCourseCard } from '../../components/HomeCourseCard';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { StudentApi } from '../../services/api';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { i18n } = useLanguage();
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

  const renderGroupItem = ({ item }: { item: any }) => (
    <HomeCourseCard
      title={item.course_name || item.group_name}
      completed={item.progress?.completed_lesson_count || 0}
      total={item.progress?.all_lessons || 0}
      progress={item.progress?.progress_rate || 0}
      onPress={() => handleCoursePress(item)}
      colors={colors}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        renderItem={() => null}
        ListHeaderComponent={
          <>
            <AttendanceStatisticsCard key={refreshing ? 'refreshing' : 'stable'} />

            {/* Active Courses Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Active Courses
                </Text>
                <TouchableOpacity onPress={handleViewAll} style={styles.viewAllBtn}>
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>
                    View all &gt;
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Course Cards - Show first 6 */}
              {loading && groups.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={colors.primary} size="large" />
                </View>
              ) : groups.length > 0 ? (
                groups.slice(0, 6).map((group: any) => (
                  <HomeCourseCard
                    key={group.id}
                    title={group.course_name || group.group_name}
                    completed={group.progress?.completed_lesson_count || 0}
                    total={group.progress?.all_lessons || 0}
                    progress={group.progress?.progress_rate || 0}
                    onPress={() => handleCoursePress(group)}
                    colors={colors}
                  />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={{ color: colors.placeholder }}>No active courses</Text>
                </View>
              )}
            </View>

            {/* Lessons Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Today's Lessons
              </Text>
              {lessons && lessons.length > 0 ? (
                lessons.map((lesson: any) => (
                  <View
                    key={lesson.id}
                    style={[
                      styles.lessonCard,
                      lesson.status === 'ended'
                        ? { backgroundColor: '#DCFCE7' }
                        : lesson.status === 'current'
                          ? { backgroundColor: '#DBEAFE' }
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
                      <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                    )}
                    {lesson.status === 'current' && (
                      <Ionicons name="play-circle" size={24} color="#2563EB" />
                    )}
                    {lesson.status !== 'ended' && lesson.status !== 'current' && (
                      <Ionicons name="close-circle" size={24} color={colors.placeholder} />
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={{ color: colors.placeholder }}>No lessons today</Text>
                </View>
              )}
            </View>
          </>
        }
        data={[]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
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
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  viewAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllText: {
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lessonTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 6,
  },
  lessonTime: {
    fontSize: 14,
    fontWeight: '500',
  },
});