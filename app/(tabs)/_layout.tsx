
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import CustomHeader from '../../components/CustomHeader';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();
  const { i18n } = useLanguage();
  const colors = Colors[theme];

  return (
    <Tabs
      screenOptions={{
        header: () => <CustomHeader />,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: 'transparent',
          height: 60,
          paddingBottom: 8,
          marginBottom: 10,
          marginHorizontal: 10,
          borderRadius: 20,
          position: 'absolute', // Required for floating effect
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        },
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: i18n.home,
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: i18n.schedule,
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: i18n.courses,
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ratings"
        options={{
          title: i18n.ratings,
          tabBarIcon: ({ color, size }) => <Ionicons name="star-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: i18n.profile,
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="course-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="lesson-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="submit-homework"
        options={{
          href: null,
          tabBarStyle: { display: 'none' }, // Check if this hides the tab bar ON the page too, usually desirable for full screen forms
        }}
      />
    </Tabs>
  );
}
