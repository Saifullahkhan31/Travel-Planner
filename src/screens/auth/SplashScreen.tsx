import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';

// SCREEN NAME: SplashScreen
// FIGMA FRAME: Splash Screen
// ROUTE: Splash

interface Props {
  navigation: any;
}

export default function SplashScreen({ navigation }: Props) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.95)).current;
  const contentTranslateAnim = useRef(new Animated.Value(20)).current;
  const contentOpacityAnim = useRef(new Animated.Value(0)).current;
  const circleScaleAnim = useRef(new Animated.Value(1)).current;
  const badgeOpacityAnim = useRef(new Animated.Value(0.82)).current;

  useEffect(() => {
    // Logo float animation
    const logoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScaleAnim, {
          toValue: 1.02,
          duration: 1700,
          useNativeDriver: false,
        }),
        Animated.timing(logoScaleAnim, {
          toValue: 0.95,
          duration: 1700,
          useNativeDriver: false,
        }),
      ])
    );

    // Content slide-up animation
    const contentEntry = Animated.parallel([
      Animated.timing(contentTranslateAnim, {
        toValue: 0,
        duration: 700,
        delay: 100,
        useNativeDriver: false,
      }),
      Animated.timing(contentOpacityAnim, {
        toValue: 1,
        duration: 700,
        delay: 100,
        useNativeDriver: false,
      }),
    ]);

    // Circle pulse animation
    const circleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(circleScaleAnim, {
          toValue: 1.04,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(circleScaleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );

    // Badge shimmer animation
    const badgeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(badgeOpacityAnim, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: false,
        }),
        Animated.timing(badgeOpacityAnim, {
          toValue: 0.82,
          duration: 1300,
          useNativeDriver: false,
        }),
      ])
    );

    // Start all animations
    logoLoop.start();
    contentEntry.start();
    circleLoop.start();
    badgeLoop.start();

    // Fade out and navigate after 3.2 seconds
    const fadeTimer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }).start(() => {
        navigation.replace('Onboarding');
      });
    }, 3200);

    return () => {
      clearTimeout(fadeTimer);
      logoLoop.stop();
      contentEntry.stop();
      circleLoop.stop();
      badgeLoop.stop();
    };
  }, [navigation, fadeAnim, logoScaleAnim, contentTranslateAnim, contentOpacityAnim, circleScaleAnim, badgeOpacityAnim]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Background pulse circle */}
        <Animated.View
          style={[
            styles.backgroundCircle,
            {
              transform: [{ scale: circleScaleAnim }],
            },
          ]}
        />

        {/* Main content block */}
        <Animated.View
          style={[
            styles.contentBlock,
            {
              transform: [{ translateY: contentTranslateAnim }],
              opacity: contentOpacityAnim,
            },
          ]}
        >
          {/* Logo with bus icon */}
          <Animated.View
            style={[
              styles.logoCircle,
              {
                transform: [{ scale: logoScaleAnim }],
              },
            ]}
          >
            <Ionicons name="bus" size={32} color={Colors.primary} />
            <Text style={styles.sparkle}>✦</Text>
          </Animated.View>

          {/* App name and tagline */}
          <View style={styles.textBlock}>
            <Text style={styles.appName}>Smart AI</Text>
            <Text style={styles.tagline}>Bus Travel Planner</Text>
          </View>

          {/* AI Badge */}
          <Animated.View
            style={[
              styles.aiBadge,
              {
                opacity: badgeOpacityAnim,
              },
            ]}
          >
            <Text style={styles.badgeSparkle}>✦</Text>
            <Text style={styles.badgeText}>Powered by AI</Text>
          </Animated.View>
        </Animated.View>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <View style={styles.dotsContainer}>
            <LoadingDot index={0} />
            <LoadingDot index={1} isCenter />
            <LoadingDot index={2} />
          </View>
          <Text style={styles.loadingText}>Loading your smart travel experience...</Text>
        </View>

        {/* Version tag */}
        <Text style={styles.versionTag}>v1.0.0</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

interface LoadingDotProps {
  index: number;
  isCenter?: boolean;
}

function LoadingDot({ index, isCenter }: LoadingDotProps) {
  const scaleAnim = useRef(new Animated.Value(isCenter ? 1 : 0.82)).current;

  useEffect(() => {
    const delay = isCenter ? 180 : index === 0 ? 0 : 360;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: isCenter ? 1.22 : 1.1,
            duration: 310,
            useNativeDriver: false,
          }),
          Animated.timing(scaleAnim, {
            toValue: isCenter ? 0.92 : 0.82,
            duration: 310,
            useNativeDriver: false,
          }),
        ]),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [scaleAnim, index, isCenter]);

  return (
    <Animated.View
      style={[
        styles.dot,
        isCenter && styles.centerDot,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  backgroundCircle: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: BorderRadius.full,
    backgroundColor: '#DBEAFE',
    zIndex: 0,
  },
  contentBlock: {
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  sparkle: {
    position: 'absolute',
    top: 17,
    right: 15,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  textBlock: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  appName: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontSize: 30,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  aiBadge: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryTint,
    gap: 5,
  },
  badgeSparkle: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  badgeText: {
    ...Typography.captionMed,
    color: Colors.primary,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: Spacing.safeBottom + 80,
    alignItems: 'center',
    gap: Spacing.xs,
    zIndex: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: '#CBD5E1',
  },
  centerDot: {
    width: 10,
    height: 10,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.38,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingText: {
    ...Typography.tiny,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  versionTag: {
    position: 'absolute',
    bottom: Spacing.safeBottom,
    ...Typography.tiny,
    color: Colors.textMuted,
    zIndex: 1,
  },
});

