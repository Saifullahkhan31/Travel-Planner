import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  ScrollView, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';

// SCREEN : OnboardingScreen
// ROUTE  : Onboarding

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Onboarding'> };

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji   : '🤖',
    title   : 'AI-Powered Predictions',
    subtitle: 'Get real-time crowd predictions and comfort scores for every bus before you board.',
    accent  : '#3B82F6',
    bg      : '#EFF6FF',
  },
  {
    emoji   : '🎟️',
    title   : 'Smart Seat Booking',
    subtitle: 'Choose your preferred seat with gender zone support and pay instantly via QR code.',
    accent  : '#8B5CF6',
    bg      : '#F5F3FF',
  },
  {
    emoji   : '📍',
    title   : 'Live Bus Tracking',
    subtitle: 'Track your bus in real-time, get crowd alerts, and let AI learn your travel routine.',
    accent  : '#10B981',
    bg      : '#ECFDF5',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goTo = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * width, animated: true });
    setCurrent(idx);
  };

  const handleNext = async () => {
    if (current < SLIDES.length - 1) {
      goTo(current + 1);
    } else {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      navigation.replace('Register');
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal pagingEnabled scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.slider}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { backgroundColor: slide.bg }]}>
            <View style={[styles.emojiCircle, { backgroundColor: slide.accent + '20' }]}>
              <Text style={styles.emoji}>{slide.emoji}</Text>
            </View>
            <Text style={[styles.slideTitle, { color: slide.accent }]}>{slide.title}</Text>
            <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === current && { backgroundColor: Colors.primary, width: 20 }]}
          />
        ))}
      </View>

      {/* Next / Get Started */}
      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: SLIDES[current].accent }]}
        onPress={handleNext}
        activeOpacity={0.8}
      >
        <Text style={styles.nextBtnText}>
          {current < SLIDES.length - 1 ? 'Next →' : 'Get Started'}
        </Text>
      </TouchableOpacity>

      {/* Login link */}
      <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.loginLink} activeOpacity={0.7}>
        <Text style={styles.loginText}>Already have an account? <Text style={styles.loginBold}>Log In</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex           : 1,
    backgroundColor: Colors.background,
    alignItems     : 'center',
  },
  skipBtn: {
    alignSelf  : 'flex-end',
    margin     : Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical  : Spacing.xs,
  },
  skipText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  slider  : { flex: 1, width },
  slide   : {
    width          : width,
    flex           : 1,
    alignItems     : 'center',
    justifyContent : 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingBottom  : Spacing.xxxl,
  },
  emojiCircle: {
    width        : 140,
    height       : 140,
    borderRadius : 70,
    alignItems   : 'center',
    justifyContent: 'center',
    marginBottom : Spacing.xxxl,
  },
  emoji        : { fontSize: 64 },
  slideTitle   : { ...Typography.h2, textAlign: 'center', marginBottom: Spacing.md },
  slideSubtitle: { ...Typography.body, textAlign: 'center', color: Colors.textSecondary, lineHeight: 22 },

  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.xxl },
  dot: {
    height       : 8,
    width        : 8,
    borderRadius : 4,
    backgroundColor: Colors.border,
  },
  nextBtn: {
    width          : width - Spacing.screenPadding * 2,
    height         : 52,
    borderRadius   : BorderRadius.md,
    alignItems     : 'center',
    justifyContent : 'center',
    marginBottom   : Spacing.lg,
  },
  nextBtnText : { ...Typography.buttonLabel },
  loginLink   : { marginBottom: Spacing.xxxl },
  loginText   : { ...Typography.caption, color: Colors.textSecondary },
  loginBold   : { color: Colors.primary, fontWeight: '700' },
});
