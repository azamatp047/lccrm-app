import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CoursesPageCardProps {
  title: string;
  teacher: string;
  completed: number;
  total: number;
  progress: number; // 0-100
  duration: string;
  students: number;
  onPress: () => void;
}

export const CoursesPageCard: React.FC<CoursesPageCardProps> = ({
  title,
  teacher,
  completed,
  total,
  progress,
  duration,
  students,
  onPress,
}) => {
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolate = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.teacher}>{teacher}</Text>
        </View>
        <Ionicons name="book" size={24} color="#4f8cff" style={{ marginLeft: 8 }} />
      </View>
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>Progress {progress}%</Text>
      </View>
      <View style={styles.progressBarBg}>
        <Animated.View style={[styles.progressBar, { width: widthInterpolate }]} />
      </View>
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="checkmark-circle" size={16} color="#4f8cff" />
          <Text style={styles.infoText}>{completed}/{total} Lessons</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time" size={16} color="#4f8cff" />
          <Text style={styles.infoText}>{duration}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="people" size={16} color="#4f8cff" />
          <Text style={styles.infoText}>{students} students</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  teacher: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 13,
    color: '#4f8cff',
    fontWeight: '500',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#4f8cff',
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#444',
    marginLeft: 4,
  },
});
