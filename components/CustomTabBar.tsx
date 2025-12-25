import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';
import TabButton from './TabButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_MARGIN = SCREEN_WIDTH * 0.04; // 4% chetdan masofa
const TABBAR_PADDING = 8;
// Pill harakatlanadigan haqiqiy kenglik
const ACTUAL_BAR_WIDTH = SCREEN_WIDTH - (CONTAINER_MARGIN * 2) - (TABBAR_PADDING * 2);

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const visibleRoutes = ['index', 'schedule', 'courses', 'ratings', 'profile'];

    const filteredRoutes = useMemo(() =>
        state.routes.filter(route =>
            visibleRoutes.includes(route.name) &&
            (descriptors[route.key].options as any).href !== null
        ), [state.routes, descriptors]
    );

    const activeTabIndex = filteredRoutes.findIndex(
        route => route.key === state.routes[state.index].key
    );

    const tabCount = filteredRoutes.length;
    const tabWidth = ACTUAL_BAR_WIDTH / tabCount;

    const translateX = useSharedValue(0);

    useEffect(() => {
        if (activeTabIndex !== -1) {
            // Elastik "Premium" animatsiya sozlamalari
            translateX.value = withSpring(activeTabIndex * tabWidth, {
                damping: 15,    // Tebranish kuchi
                stiffness: 120, // Qattiqlik
                mass: 1,        // Og'irlik
            });
        }
    }, [activeTabIndex, tabWidth]);

    const animatedPillStyle = useAnimatedStyle(() => {
        return {
            width: tabWidth,
            transform: [{ translateX: translateX.value }],
        };
    });

    return (
        <View style={[
            styles.tabbar,
            {
                backgroundColor: colors.surface,
                bottom: insets.bottom + (Platform.OS === 'ios' ? 1 : 10),
                shadowColor: theme === 'dark' ? '#000' : '#4B5563',
            }
        ]}>
            {/* Fon (Pill) - Tugmalar ostida turadi */}
            <View style={styles.pillWrapper}>
                <Animated.View
                    style={[
                        styles.pill,
                        animatedPillStyle,
                        { backgroundColor: theme === 'light' ? '#000' : '#FFF' }
                    ]}
                />
            </View>

            {/* Tugmalar */}
            {filteredRoutes.map((route, index) => {
                const isFocused = activeTabIndex === index;
                const { options } = descriptors[route.key];

                return (
                    <TabButton
                        key={route.name}
                        onPress={() => {
                            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
                        }}
                        onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                        isFocused={isFocused}
                        label={options.tabBarLabel as string ?? route.name}
                        icon={options.tabBarIcon as any}
                        theme={theme as 'light' | 'dark'}
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    tabbar: {
        position: 'absolute',
        flexDirection: 'row',
        left: '4%',
        right: '4%',
        height: 68,
        borderRadius: 24,
        alignItems: 'center',
        paddingHorizontal: 8,
        elevation: 8,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    pillWrapper: {
        ...StyleSheet.absoluteFillObject,
        marginHorizontal: 8,
        justifyContent: 'center',
    },
    pill: {
        height: 52,
        borderRadius: 20,
    },
});

export default CustomTabBar;