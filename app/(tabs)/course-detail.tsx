import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useTheme } from '../../contexts/ThemeContext';
import { StudentApi } from '../../services/api';

export default function CourseDetailScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    StudentApi.getGroupDetails(Number(id))
      .then(setCourse)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}> 
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}> 
        <Text style={{ color: colors.text }}>Course not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{course.name}</Text>
      <Text style={[styles.progress, { color: colors.primary }]}> 
        {course.progress?.completed_lesson_count || 0} of {course.progress?.all_lessons || 0} lessons completed
      </Text>
      {/* Progress bar and lessons list can be added here */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  progress: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 24,
  },
});
