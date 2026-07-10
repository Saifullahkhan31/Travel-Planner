import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';

const { width, height } = Dimensions.get('window');

interface Props {
  navigation: any;
}

// --- Slide 1 Components ---
function ComfortRing({ score = 89 }: { score?: number }) {
  return (
    <View style={styles.comfortRing}>
      <View style={styles.comfortRingInner}>
        <Text style={styles.comfortScore}>{score}</Text>
        <Text style={styles.comfortLabel}>Comfort</Text>
      </View>
    </View>
  );
}

function BusIllustration() {
  return (
    <View style={styles.illustrationCard}>
      <Image
        source={require('../../../assets/images/onboarding_ai_bus_pak.jpg')}
        style={styles.cardImage}
        resizeMode="contain"
      />

      {/* Chips */}
      <View style={styles.busChipLeft}>
        <View style={styles.chipIcon}>
          <Ionicons name="location" size={13} color={Colors.primary} />
        </View>
        <View>
          <Text style={styles.chipTitle}>Bus #14</Text>
          <Text style={styles.chipSubtitle}>4 min away</Text>
        </View>
      </View>

      <View style={styles.busChipTopLeft}>
        <View style={styles.crowdPill}>
          <Text style={styles.crowdDot}>●</Text>
          <Text style={styles.crowdText}>Low Crowd</Text>
        </View>
        <ComfortRing score={89} />
      </View>
    </View>
  );
}

// --- Slide 2 Components ---
function GenderToggle() {
  return (
    <View style={styles.toggle}>
      <View style={styles.toggleTrack} />
      <View style={styles.toggleThumb} />
    </View>
  );
}

function QRCodeIcon() {
  return (
    <View style={styles.qrContainer}>
      <View style={styles.qrGrid}>
        <View style={[styles.qrBlock]} />
        <View style={[styles.qrBlock]} />
        <View style={[styles.qrBlock]} />
      </View>
    </View>
  );
}

function SeatIllustration() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={styles.illustrationCard}>
      <Image
        source={require('../../../assets/images/onboarding_seat_booking_qr.jpg')}
        style={styles.cardImage}
        resizeMode="contain"
      />

      <Animated.View style={[styles.bookedBadge, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.bookedCheckmark}>✓</Text>
        <Text style={styles.bookedText}>Booked!</Text>
      </Animated.View>

      <View style={styles.seatChipRight}>
        <QRCodeIcon />
        <Text style={styles.chipLabel}>Digital Ticket</Text>
      </View>

      <View style={styles.seatChipLeft}>
        <View style={styles.genderHeader}>
          <Text style={styles.genderLabel}>Gender Pref</Text>
          <GenderToggle />
        </View>
        <View style={styles.genderOptions}>
          <View style={styles.genderOption}>
            <Text style={styles.genderSymbol}>♀</Text>
            <Text style={[styles.genderText, { color: '#D946EF' }]}>Female</Text>
          </View>
          <View style={styles.genderOption}>
            <Text style={styles.genderSymbol}>♂</Text>
            <Text style={[styles.genderText, { color: Colors.primary }]}>Male</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// --- Slide 3 Components ---
function MapIllustration() {
  return (
    <View style={styles.illustrationCard}>
      <Image
        source={require('../../../assets/images/onboarding_map_tracking_pin.jpg')}
        style={styles.cardImage}
        resizeMode="contain"
      />

      <View style={styles.chipTopLeft}>
        <View style={styles.chipAccent} />
        <View style={styles.chipContent}>
          <Text style={styles.chipTitleMap}>🔁 Suggested Trip</Text>
          <Text style={styles.chipRoute}>Karachi → Hyderabad</Text>
          <Text style={styles.chipCaption}>Based on your routine</Text>
        </View>
      </View>

      <View style={styles.chipTopRight}>
        <View style={[styles.chipAccent, { backgroundColor: Colors.warning }]} />
        <View style={styles.chipContent}>
          <Text style={styles.chipTitleWarning}>⚠ Bus #7</Text>
          <Text style={styles.chipWarning}>nearing capacity</Text>
        </View>
      </View>
    </View>
  );
}

// --- Main Screen ---
const SLIDES = [
  {
    id: '1',
    badgeEmoji: '✦',
    badgeText: 'AI-Powered Predictions',
    title: 'Know Before You Go',
    description: 'Our AI predicts crowd levels and comfort scores for every bus, so you always travel smart.',
    illustration: <BusIllustration />
  },
  {
    id: '2',
    badgeEmoji: '🎫',
    badgeText: 'Smart Seat Booking',
    title: 'Your Seat, Your Choice',
    description: 'Pre-book your preferred seat, choose your gender zone, and pay digitally with a QR code — all before you board.',
    illustration: <SeatIllustration />
  },
  {
    id: '3',
    badgeEmoji: '📍',
    badgeText: 'Real-Time Tracking',
    title: 'Always In The Loop',
    description: 'Track your bus live, get crowd alerts, and let our AI learn your routine to suggest trips automatically.',
    illustration: <MapIllustration />
  }
];

export default function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  const handleLogin = () => {
    navigation.replace('Login');
  };

  const renderItem = ({ item }: { item: typeof SLIDES[0] }) => {
    return (
      <View style={styles.slideContainer}>
        {item.illustration}
        <View style={styles.textContent}>
          <View style={styles.badge}>
            <Text style={styles.badgeEmoji}>{item.badgeEmoji}</Text>
            <Text style={styles.badgeText}>{item.badgeText}</Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={32}
      />

      <View style={styles.bottomContainer}>
        <View style={styles.navRow}>
          <View style={styles.skipButtonContainer}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipButtonArea}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.indicatorsContainer}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentIndex === index && styles.indicatorActive
                ]}
              />
            ))}
          </View>

          <View style={styles.nextButtonContainer}>
            <TouchableOpacity onPress={handleNext} style={styles.nextButtonArea}>
              <Text style={styles.nextButtonText}>
                {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next →'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={handleLogin} style={styles.loginLinkArea}>
          <Text style={styles.loginLink}>
            Already have an account? <Text style={styles.loginLinkBold}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  slideContainer: {
    width,
    paddingHorizontal: Spacing.screenPadding,
    alignItems: 'center',
    paddingTop: 40,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.safeBottom + Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.white,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    minHeight: 48,
  },
  skipButtonContainer: {
    position: 'absolute',
    left: 0,
    zIndex: 1,
    marginLeft: 7,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  nextButtonContainer: {
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
  skipButtonArea: {
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.xl,
  },
  skipText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  nextButtonArea: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    ...Typography.buttonLabel,
    color: Colors.white,
    fontSize: 15,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#CBD5E1',
  },
  indicatorActive: {
    width: 20,
    backgroundColor: Colors.primary,
  },
  loginLinkArea: {
    alignItems: 'center',
  },
  loginLink: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  loginLinkBold: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Shared Illustration Styles
  illustrationCard: {
    width: '100%',
    height: 334,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  textContent: {
    alignItems: 'center',
    marginTop: Spacing.xl + Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryTint,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  badgeEmoji: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  badgeText: {
    ...Typography.captionMed,
    color: Colors.primary,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Bus Illustration
  busChipLeft: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  chipIcon: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipTitle: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  chipSubtitle: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  busChipTopLeft: {
    position: 'absolute',
    top: -5,
    left: 80,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  crowdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successTint,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  crowdDot: { color: Colors.success, fontSize: 10 },
  crowdText: { color: Colors.success, fontSize: 11, fontWeight: '600' },
  comfortRing: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.comfortTint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.comfort,
  },
  comfortRingInner: { alignItems: 'center' },
  comfortScore: { color: Colors.textPrimary, fontSize: 12, fontWeight: '700' },
  comfortLabel: { color: Colors.textMuted, fontSize: 9 },

  // Phone/Seat Illustration
  bookedBadge: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successTint,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  bookedCheckmark: { color: Colors.success, fontSize: 12, fontWeight: '700' },
  bookedText: { color: Colors.success, fontSize: 11, fontWeight: '600' },
  seatChipRight: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  qrContainer: {
    width: 44,
    height: 44,
    backgroundColor: Colors.white,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qrGrid: {
    width: 36,
    height: 36,
    backgroundColor: '#0F172A',
    borderRadius: 2,
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 2,
  },
  qrBlock: { width: 4, height: 4, backgroundColor: Colors.white, borderRadius: 1 },
  chipLabel: { color: Colors.primary, fontSize: 9, fontWeight: '600' },
  seatChipLeft: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  genderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  genderLabel: { color: Colors.textPrimary, fontSize: 9, fontWeight: '600' },
  toggle: {
    width: 32,
    height: 18,
    backgroundColor: Colors.primary,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 2,
  },
  toggleTrack: {},
  toggleThumb: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.white },
  genderOptions: { flexDirection: 'row', gap: 4 },
  genderOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    gap: 2,
  },
  genderSymbol: { fontSize: 12 },
  genderText: { fontSize: 8, fontWeight: '500' },

  // Map Illustration
  chipTopLeft: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    maxWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  chipTopRight: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    maxWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  chipAccent: { width: 3, backgroundColor: Colors.primary },
  chipContent: { padding: Spacing.md, gap: 2 },
  chipTitleMap: { color: Colors.textPrimary, fontSize: 9, fontWeight: '700' },
  chipTitleWarning: { color: Colors.warning, fontSize: 9, fontWeight: '700' },
  chipRoute: { color: Colors.primary, fontSize: 8.5, fontWeight: '600' },
  chipWarning: { color: Colors.warning, fontSize: 8.5, fontWeight: '500' },
  chipCaption: { color: Colors.textMuted, fontSize: 8 },
});
