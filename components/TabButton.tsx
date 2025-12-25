import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    interpolateColor,
    interpolate
} from 'react-native-reanimated';

const AnimatedText = Animated.createAnimatedComponent(Text);

const TabButton = ({ onPress, onLongPress, isFocused, label, icon, theme }: any) => {
    const scale = useSharedValue(0);

    useEffect(() => {
        scale.value = withSpring(isFocused ? 1 : 0, {
            damping: 15,
            stiffness: 150,
        });
    }, [isFocused]);

    const activeColor = theme === 'light' ? '#FFFFFF' : '#000000';
    const inactiveColor = theme === 'light' ? '#6B7280' : '#9CA3AF';

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            color: interpolateColor(scale.value, [0, 1], [inactiveColor, activeColor]),
            transform: [{ scale: interpolate(scale.value, [0, 1], [1, 1.05]) }]
        };
    });

    const animatedIconStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: interpolate(scale.value, [0, 1], [1, 1.1]) }]
        };
    });

    const handlePress = () => {
        if (!isFocused) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            onLongPress={onLongPress}
            style={styles.container}
        >
            <Animated.View style={animatedIconStyle}>
                {icon && icon({
                    color: isFocused ? activeColor : inactiveColor,
                    size: 22,
                    focused: isFocused
                })}
            </Animated.View>
            <AnimatedText style={[styles.label, animatedTextStyle]}>
                {label}
            </AnimatedText>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        zIndex: 10,
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 4,
    },
});

export default TabButton;