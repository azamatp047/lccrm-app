import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


interface HomeCourseCardProps {
  title: string;
  group_name?: string;
  completed: number;
  total: number;
  progress: number; // 0-100
  onPress: () => void;
  colors?: {
    background: string;
    surface: string;
    text: string;
    primary: string;
    border: string;
    placeholder: string;
  };
}

export const HomeCourseCard: React.FC<HomeCourseCardProps> = ({ title, group_name, completed, total, progress, onPress, colors }) => {
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

  // Fallback to light colors if not provided
  const c = colors || {
    background: '#F9FAFB',
    surface: '#fff',
    text: '#111',
    primary: '#4f8cff',
    border: '#E5E7EB',
    placeholder: '#888',
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: c.surface,
          borderColor: c.border,
          shadowColor: c.text + '22',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>{title}</Text>
          {group_name && group_name !== title && (
            <Text style={[styles.groupName, { color: c.placeholder }]} numberOfLines={1}>{group_name}</Text>
          )}
        </View>
        <Text style={[styles.progressText, { color: c.placeholder }]}>{completed}/{total}</Text>
      </View>
      <View style={[styles.progressBarBg, { backgroundColor: c.border }]}>
        <Animated.View style={[styles.progressBar, { width: widthInterpolate, backgroundColor: c.primary }]} />
      </View>
      <Text style={[styles.percentText, { color: c.primary }]}>{progress}% Complete</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
    // backgroundColor, borderColor, shadowColor set dynamically
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  groupName: {
    fontSize: 13,
    marginTop: 2,
  },
  progressText: {
    fontSize: 15,
    marginLeft: 8,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 9,
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressBar: {
    height: 9,
    borderRadius: 5,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.1,
  },
});
