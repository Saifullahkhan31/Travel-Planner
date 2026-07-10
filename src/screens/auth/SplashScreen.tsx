import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Spacing } from '../../constants/spacing';
import { useAuth } from '../../context/AuthContext';

// SCREEN : SplashScreen
// ROUTE  : Splash
// ROLE   : all

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Splash'> };

export default function SplashScreen({ navigation }: Props) {
  const { user } = useAuth();
  const logoScale  = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start(() => {
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });

    // Dot pulse sequence
    const pulseDot = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ])
      );
    pulseDot(dot1, 0).start();
    pulseDot(dot2, 200).start();
    pulseDot(dot3, 400).start();

    // Navigate after 2.5s
    const timer = setTimeout(async () => {
      const seen = await AsyncStorage.getItem('hasSeenOnboarding');
      if (user) {
        (navigation as any).replace('Login'); // will be overridden by AppNavigator
      } else if (!seen) {
        navigation.replace('Onboarding');
      } else {
        navigation.replace('Login');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrapper, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🚌</Text>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={styles.appName}>Smart AI Bus</Text>
        <Text style={styles.appName2}>Travel Planner</Text>
        <Text style={styles.tagline}>✦ Intelligent public transit</Text>
      </Animated.View>

      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
        ))}
      </View>

      <Text style={styles.version}>v1.0.0 · IoBM FYP 2025–26</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: Colors.primary,
    alignItems     : 'center',
    justifyContent : 'center',
    padding        : Spacing.screenPadding,
  },
  logoWrapper: { marginBottom: Spacing.xxl },
  logoCircle : {
    width         : 110,
    height        : 110,
    borderRadius  : 55,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems    : 'center',
    justifyContent: 'center',
    borderWidth   : 2,
    borderColor   : 'rgba(255,255,255,0.3)',
  },
  logoIcon: { fontSize: 52 },
  appName : {
    fontSize  : 32,
    fontWeight: '800',
    color     : Colors.white,
    letterSpacing: -0.5,
  },
  appName2: {
    fontSize  : 32,
    fontWeight: '300',
    color     : 'rgba(255,255,255,0.85)',
    letterSpacing: -0.5,
    marginTop : -4,
  },
  tagline: {
    marginTop : Spacing.md,
    fontSize  : 14,
    color     : 'rgba(255,255,255,0.7)',
    fontStyle : 'italic',
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop    : Spacing.xxxl,
    gap          : Spacing.sm,
  },
  dot: {
    width        : 8,
    height       : 8,
    borderRadius : 4,
    backgroundColor: Colors.white,
  },
  version: {
    position: 'absolute',
    bottom  : 40,
    fontSize: 11,
    color   : 'rgba(255,255,255,0.5)',
  },
});
