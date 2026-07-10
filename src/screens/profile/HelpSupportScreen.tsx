import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Linking, Alert, Modal, Platform, ToastAndroid, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { ProfileStackParamList } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import ScreenHeader from '../../components/common/ScreenHeader';
import Button from '../../components/common/Button';

type Props = NativeStackScreenProps<ProfileStackParamList, 'HelpSupport'>;

// ─── FAQs ─────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    question: 'How does AI crowd prediction work?',
    answer  : 'Our ML model analyses historical booking patterns, time of day, route popularity, and current occupancy to estimate how crowded a bus is likely to be. It gives you a percentage and a Low / Medium / High crowd level.',
  },
  {
    question: 'What is the Comfort Score?',
    answer  : 'The Comfort Score (0–100) is calculated by our AI using the bus type (AC or Non-AC), current occupancy, and seat availability. A score above 70 indicates a comfortable ride.',
  },
  {
    question: 'How do I cancel a ticket?',
    answer  : 'Go to My Tickets, select your active booking, and tap Cancel Booking. Refunds are processed within 3–5 working days.',
  },
  {
    question: 'How do I change my seat or travel preferences?',
    answer  : 'Go to Profile → Preferences. You can update your seat type, bus type, departure time preference, travel priority, and budget range. The AI uses all of these to personalise your suggestions.',
  },
  {
    question: 'When is my card charged?',
    answer  : 'Your card is charged immediately upon confirming the booking via QR scan or manual confirmation on the payment screen.',
  },
  {
    question: 'How does routine detection work?',
    answer  : 'If you travel the same route at similar times frequently, the AI flags it as a routine trip and proactively shows it as an AI Suggestion on your Home screen with crowd predictions pre-loaded.',
  },
];

function showToast(msg: string) {
  if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert('', msg);
}

// ─── Bug Report Modal ─────────────────────────────────────────────────────────
function BugReportModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [description, setDescription] = useState('');
  const [hasScreenshot, setHasScreenshot] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleAttachScreenshot = () => {
    // Simulated — image picker would go here in a real implementation
    setHasScreenshot(true);
    showToast('Screenshot attached ✓');
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      showToast('Please describe the bug before submitting.');
      return;
    }
    setSubmitting(true);
    // Simulate a network delay
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  const handleClose = () => {
    setDescription('');
    setHasScreenshot(false);
    setSubmitting(false);
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={bugModal.safe}>
        {/* Header */}
        <View style={bugModal.header}>
          <Text style={bugModal.title}>Report a Bug</Text>
          <TouchableOpacity onPress={handleClose} style={bugModal.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={bugModal.content} keyboardShouldPersistTaps="handled">
          {!submitted ? (
            <>
              <Text style={bugModal.label}>Describe the bug *</Text>
              <TextInput
                style={bugModal.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="What happened? What were you doing when the bug occurred? What did you expect to happen?"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              {/* Screenshot Attachment */}
              <Text style={bugModal.label}>Screenshot (optional)</Text>
              <TouchableOpacity
                style={[bugModal.attachBtn, hasScreenshot && bugModal.attachBtnActive]}
                onPress={handleAttachScreenshot}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={hasScreenshot ? 'image' : 'cloud-upload-outline'}
                  size={22}
                  color={hasScreenshot ? Colors.success : Colors.textMuted}
                />
                <Text style={[bugModal.attachText, hasScreenshot && { color: Colors.success }]}>
                  {hasScreenshot ? 'Screenshot attached ✓' : 'Tap to attach a screenshot'}
                </Text>
              </TouchableOpacity>

              <Button
                label={submitting ? 'Submitting…' : 'Submit Bug Report'}
                onPress={handleSubmit}
                disabled={submitting || !description.trim()}
                iconLeft="bug-outline"
                style={{ marginTop: Spacing.xl }}
              />
            </>
          ) : (
            /* Success State */
            <View style={bugModal.successView}>
              <View style={bugModal.successIcon}>
                <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
              </View>
              <Text style={bugModal.successTitle}>Report Submitted!</Text>
              <Text style={bugModal.successSub}>
                Thank you for helping us improve SmartBusPlanner. Our team will review your report and get back to you shortly.
              </Text>
              <Button label="Close" onPress={handleClose} variant="secondary" style={{ width: '100%', marginTop: Spacing.xl }} />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const bugModal = StyleSheet.create({
  safe        : { flex: 1, backgroundColor: Colors.background },
  header      : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  title       : { ...Typography.h4, flex: 1 },
  closeBtn    : { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  content     : { padding: Spacing.screenPadding, paddingBottom: Spacing.xxxl },
  label       : { ...Typography.captionMed, color: Colors.textPrimary, fontWeight: '600', marginBottom: Spacing.sm, marginTop: Spacing.lg },
  textArea    : {
    backgroundColor: Colors.card, borderRadius: BorderRadius.md, borderWidth: 1,
    borderColor: Colors.border, padding: Spacing.md, minHeight: 130,
    ...Typography.body, color: Colors.textPrimary,
  },
  attachBtn   : { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.card, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed', padding: Spacing.lg, justifyContent: 'center' },
  attachBtnActive: { borderColor: Colors.success, backgroundColor: Colors.successTint },
  attachText  : { ...Typography.caption, color: Colors.textMuted },
  successView : { alignItems: 'center', paddingTop: Spacing.xxxl },
  successIcon : { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.successTint, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  successTitle: { ...Typography.h3, marginBottom: Spacing.sm },
  successSub  : { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HelpSupportScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery]   = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [bugModalVisible, setBugModalVisible] = useState(false);

  const filteredFaqs = FAQS.filter(f =>
    f.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openEmail = () => Linking.openURL('mailto:saifullah.khan1203@gmail.com?subject=SmartBusPlanner%20Support');
  const openWhatsApp = () => Linking.openURL('whatsapp://send?phone=+923353155658&text=Hi%2C%20I%20need%20help%20with%20SmartBusPlanner').catch(() => {
    Alert.alert('WhatsApp not installed', 'Please install WhatsApp to use this option.');
  });
  const openLiveChat = () => Alert.alert('Live Chat', 'Our live chat feature is coming soon! For now please reach us via WhatsApp or Email.', [{ text: 'OK' }]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Help & Support" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Search ── */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search FAQs…"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textMuted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── FAQs ── */}
        <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.faqCard}>
          {filteredFaqs.length === 0 ? (
            <Text style={styles.emptyText}>No results found for "{searchQuery}"</Text>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isExpanded = expandedIndex === idx;
              return (
                <View key={idx}>
                  <TouchableOpacity
                    style={styles.faqRow}
                    onPress={() => setExpandedIndex(isExpanded ? null : idx)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.faqQ, isExpanded && { color: Colors.primary }]}>{faq.question}</Text>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.faqAContainer}>
                      <Text style={styles.faqA}>{faq.answer}</Text>
                    </View>
                  )}
                  {idx < filteredFaqs.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })
          )}
        </View>

        {/* ── Contact Us ── */}
        <Text style={styles.sectionLabel}>CONTACT US</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactBox} onPress={openLiveChat} activeOpacity={0.7}>
            <View style={[styles.contactIconBg, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="chatbubbles" size={24} color="#1E88E5" />
            </View>
            <Text style={styles.contactLabel}>Live Chat</Text>
            <Text style={styles.contactSub}>Coming Soon</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactBox} onPress={openWhatsApp} activeOpacity={0.7}>
            <View style={[styles.contactIconBg, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#43A047" />
            </View>
            <Text style={styles.contactLabel}>WhatsApp</Text>
            <Text style={styles.contactSub}>+92 335 3155658</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactBox} onPress={openEmail} activeOpacity={0.7}>
            <View style={[styles.contactIconBg, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="mail" size={24} color="#FB8C00" />
            </View>
            <Text style={styles.contactLabel}>Email Us</Text>
            <Text style={styles.contactSub}>saifullah.khan…</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Button
          label="Report a Bug"
          onPress={() => setBugModalVisible(true)}
          style={{ width: '100%' }}
          variant="secondary"
          iconLeft="bug-outline"
        />
      </View>

      {/* Bug Report Modal */}
      <BugReportModal visible={bugModalVisible} onClose={() => setBugModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe   : { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 100, paddingTop: Spacing.md },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, height: 48, ...Shadows.card, marginBottom: Spacing.xl, gap: Spacing.sm },
  searchInput    : { flex: 1, ...Typography.body, color: Colors.textPrimary },

  sectionLabel: { ...Typography.sectionLabel, marginBottom: Spacing.sm },

  faqCard        : { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, ...Shadows.card, marginBottom: Spacing.xl, overflow: 'hidden' },
  faqRow         : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
  faqQ           : { ...Typography.bodyMedium, color: Colors.textPrimary, flex: 1, paddingRight: Spacing.sm },
  faqAContainer  : { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  faqA           : { ...Typography.caption, color: Colors.textSecondary, lineHeight: 20 },
  divider        : { height: 1, backgroundColor: Colors.divider },
  emptyText      : { padding: Spacing.lg, ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },

  contactRow  : { flexDirection: 'row', gap: Spacing.sm },
  contactBox  : { flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', ...Shadows.card },
  contactIconBg: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  contactLabel: { ...Typography.captionMed, color: Colors.textPrimary, textAlign: 'center' },
  contactSub  : { ...Typography.tiny, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.background, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: Spacing.safeBottom },
});
