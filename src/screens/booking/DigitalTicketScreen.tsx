import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, Booking } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { bookingService } from '../../services/bookingService';
import ScreenHeader from '../../components/common/ScreenHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'DigitalTicket'>;

export default function DigitalTicketScreen({ navigation, route }: Props) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const ticketRef = useRef<ViewShot>(null);

  useEffect(() => {
    (async () => {
      const { data } = await bookingService.getBookingById(bookingId);
      setBooking(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Digital Ticket" onBack={() => navigation.goBack()} />
        <View style={styles.loadingView}><ActivityIndicator size="large" color={Colors.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Digital Ticket" onBack={() => navigation.goBack()} />
        <View style={styles.loadingView}><Text style={Typography.body}>Ticket not found.</Text></View>
      </SafeAreaView>
    );
  }

  const qrVal = bookingService.generateQRCode(bookingId);

  // Parse origin/destination from routeName
  const parts = booking.routeName.split(' → ');
  const origin = parts[0] ?? 'Origin';
  const dest   = parts[1] ?? 'Destination';

  // ─── Export Logic ───

  const captureImage = async (): Promise<string | null> => {
    if (!ticketRef.current?.capture) return null;
    return await ticketRef.current.capture();
  };

  const saveToPhotos = async () => {
    try {
      const uri = await captureImage();
      if (!uri) return;
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant photo permissions to save the ticket.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success', 'Ticket image seamlessly saved to Photos!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save to Photos.');
    }
  };

  const saveToFilesImage = async () => {
    try {
      const uri = await captureImage();
      if (!uri) return;
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Save Ticket Image' });
      } else {
        Alert.alert('Error', 'File sharing is not available on this device.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save to Files.');
    }
  };

  const saveToPDF = async () => {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, Roboto, sans-serif; background-color: #f8fafc; padding: 40px; margin: 0; }
            .ticket { background-color: #ffffff; border-radius: 24px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); max-width: 400px; margin: 0 auto; border: 1px solid #e2e8f0; }
            .header { display: flex; align-items: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; margin-bottom: 20px; }
            .header-icon { font-size: 32px; margin-right: 15px; }
            .header-title { font-size: 18px; font-weight: bold; color: #0f172a; margin:0; }
            .header-sub { font-size: 12px; color: #64748b; margin:0; }
            .route { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
            .route-point { text-align: center; }
            .route-code { font-size: 28px; font-weight: bold; color: #2563eb; margin:0; }
            .route-city { font-size: 14px; color: #475569; margin:0; }
            .grid { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px; }
            .grid-item { width: 40%; }
            .label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; margin:0; }
            .value { font-size: 15px; font-weight: 600; color: #0f172a; margin:0; margin-top:4px; }
            .qr-sec { text-align: center; padding-top: 20px; border-top: 2px dashed #cbd5e1; }
            .qr-text { font-size: 12px; color: #64748b; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <div class="header-icon">🚌</div>
              <div>
                <h1 class="header-title">Smart AI Bus Planner</h1>
                <p class="header-sub">Verified Digital Ticket</p>
              </div>
            </div>
            <div class="route">
              <div class="route-point">
                <p class="route-code">${origin.slice(0,3).toUpperCase()}</p>
                <p class="route-city">${origin}</p>
              </div>
              <div style="color: #2563eb; font-size: 20px;">→</div>
              <div class="route-point" style="text-align: right">
                <p class="route-code">${dest.slice(0,3).toUpperCase()}</p>
                <p class="route-city">${dest}</p>
              </div>
            </div>
            <div class="grid">
              <div class="grid-item"><p class="label">Date</p><p class="value">${booking.travelDate}</p></div>
              <div class="grid-item"><p class="label">Seat</p><p class="value">No. ${booking.seatNumber}</p></div>
              <div class="grid-item"><p class="label">Bus Type</p><p class="value">${booking.busType}</p></div>
              <div class="grid-item"><p class="label">Fare</p><p class="value">PKR ${booking.fareAmount}</p></div>
              <div class="grid-item"><p class="label">Reference</p><p class="value">${bookingId.slice(0,8).toUpperCase()}</p></div>
            </div>
            <div class="qr-sec">
              <p class="qr-text">Scan to verify ticket</p>
              <p style="font-size:14px; font-weight:bold; letter-spacing:2px; margin-top:10px">${bookingId.slice(0, 16).toUpperCase()}</p>
            </div>
          </div>
        </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Save Ticket PDF' });
      } else {
        Alert.alert('Error', 'File sharing is not available on this device.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  const handleDownloadPress = () => {
    Alert.alert(
      'Download Ticket',
      'Choose the format you want to save your ticket in:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Image', onPress: () => {
          Alert.alert('Save Image', 'Where would you like to save the image?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Save to Photos', onPress: saveToPhotos },
            { text: 'Save to Files', onPress: saveToFilesImage },
          ]);
        }},
        { text: 'PDF Document', onPress: saveToPDF },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Digital Ticket" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── TICKET CARD ── */}
        <ViewShot ref={ticketRef} options={{ format: 'png', quality: 1.0 }} style={{ backgroundColor: Colors.background }}>
          <View style={styles.ticketCard}>
            {/* Header */}
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketHeaderIcon}>🚌</Text>
              <View>
                <Text style={styles.ticketAppName}>Smart AI Bus Travel Planner</Text>
                <Text style={styles.ticketSubName}>IoBM FYP 2025–26</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>

            {/* Route */}
            <View style={styles.routeSection}>
              <View style={styles.routePoint}>
                <Text style={styles.routeCode} numberOfLines={1}>{origin.slice(0, 3).toUpperCase()}</Text>
                <Text style={styles.routeCity}>{origin}</Text>
              </View>
              <View style={styles.routeArrow}>
                <View style={styles.arrowLine} />
                <Ionicons name="bus" size={18} color={Colors.primary} />
                <View style={styles.arrowLine} />
              </View>
              <View style={[styles.routePoint, { alignItems: 'flex-end' }]}>
                <Text style={styles.routeCode} numberOfLines={1}>{dest.slice(0, 3).toUpperCase()}</Text>
                <Text style={styles.routeCity}>{dest}</Text>
              </View>
            </View>

            {/* Perforation Line */}
            <View style={styles.perforationLine}>
              <View style={styles.perforationCircleLeft} />
              {Array.from({ length: 18 }).map((_, i) => <View key={i} style={styles.perfDash} />)}
              <View style={styles.perforationCircleRight} />
            </View>

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              {[
                { label: 'Date',       value: booking.travelDate },
                { label: 'Seat',       value: `No. ${booking.seatNumber}` },
                { label: 'Bus Type',   value: booking.busType },
                { label: 'Fare',       value: `PKR ${booking.fareAmount}` },
                { label: 'Reference',  value: bookingId.slice(0, 8).toUpperCase() },
                { label: 'Status',     value: '✓ Confirmed' },
              ].map(d => (
                <View key={d.label} style={styles.detailItem}>
                  <Text style={styles.detailLabel}>{d.label}</Text>
                  <Text style={styles.detailValue}>{d.value}</Text>
                </View>
              ))}
            </View>

            {/* QR Section */}
            <View style={styles.qrSection}>
              <Text style={styles.qrScanText}>Scan to verify ticket</Text>
              <QRCode value={qrVal} size={100} color={Colors.textPrimary} backgroundColor={Colors.white} />
              <Text style={styles.bookingId}>{bookingId.slice(0, 16).toUpperCase()}</Text>
            </View>
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionBtn} activeOpacity={0.7}
            onPress={() => Share.share({ message: `I'm traveling from ${origin} to ${dest} via Smart AI Bus! Seat: ${booking.seatNumber}` })}
          >
            <Ionicons name="share-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionBtnText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn} activeOpacity={0.7}
            onPress={handleDownloadPress}
          >
            <Ionicons name="download-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionBtnText}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn} activeOpacity={0.7}
            onPress={() => (navigation as any).getParent()?.navigate('MapTab')}
          >
            <Ionicons name="navigate-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionBtnText}>Track Bus</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.reportLink} activeOpacity={0.7}
          onPress={() => Alert.alert('Cancel Booking', 'Are you sure you want to cancel this ticket?', [
            { text: 'No', style: 'cancel' },
            { text: 'Yes, Cancel', style: 'destructive', onPress: () => {
              bookingService.cancelBooking(bookingId);
              navigation.goBack();
            }}
          ])}
        >
          <Text style={[styles.reportText, { color: Colors.error }]}>Cancel Booking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.reportLink} activeOpacity={0.7}>
          <Text style={styles.reportText}>Report an Issue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe       : { flex: 1, backgroundColor: Colors.background },
  content    : { paddingHorizontal: Spacing.screenPadding, paddingBottom: Spacing.safeBottom },
  loadingView: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  ticketCard: {
    backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    overflow: 'hidden', marginBottom: Spacing.lg,
    ...Shadows.float,
  },

  ticketHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, padding: Spacing.lg,
  },
  ticketHeaderIcon: { fontSize: 28 },
  ticketAppName   : { ...Typography.bodyMedium, color: Colors.white },
  ticketSubName   : { ...Typography.tiny, color: 'rgba(255,255,255,0.7)' },
  verifiedBadge   : { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.successTint, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  verifiedText    : { fontSize: 10, fontWeight: '700', color: Colors.success },

  routeSection: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl, paddingBottom: Spacing.lg },
  routePoint  : { flex: 1 },
  routeCode   : { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  routeCity   : { ...Typography.tiny, marginTop: 2 },
  routeArrow  : { flex: 1, flexDirection: 'row', alignItems: 'center' },
  arrowLine   : { flex: 1, height: 1, backgroundColor: Colors.border },

  perforationLine: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: -1,
    position: 'relative',
  },
  perforationCircleLeft : { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.background, marginLeft: -10 },
  perforationCircleRight: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.background, marginRight: -10 },
  perfDash: { flex: 1, height: 1, backgroundColor: Colors.border, marginHorizontal: 1 },

  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.lg, paddingTop: Spacing.md },
  detailItem : { width: '50%', paddingVertical: Spacing.sm, paddingRight: Spacing.sm },
  detailLabel: { ...Typography.tiny, marginBottom: 2 },
  detailValue: { ...Typography.bodyMedium },

  qrSection: {
    alignItems: 'center', padding: Spacing.lg,
    backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  qrScanText: { ...Typography.tiny, marginBottom: Spacing.sm },
  bookingId : { ...Typography.tiny, marginTop: Spacing.sm, letterSpacing: 1 },

  actions   : { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  actionBtn : {
    flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, alignItems: 'center', gap: 6,
    ...Shadows.card,
  },
  actionBtnText: { ...Typography.tiny, color: Colors.primary, fontWeight: '600' },
  reportLink   : { alignItems: 'center', marginBottom: Spacing.xxl },
  reportText   : { ...Typography.caption, color: Colors.textMuted },
});
