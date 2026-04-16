import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
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

const FAQS = [
  { question: 'How do I cancel a ticket?', answer: 'Go to My Bookings, select your active ticket, and tap Cancel. Refunds are processed within 3 days.' },
  { question: 'When is my card charged?', answer: 'Your card is charged immediately upon confirming the seat via QR or manual payment.' },
  { question: 'What is the AI Comfort Score?', answer: 'It calculates comfort based on real-time bus occupancy and bus type (AC/Non-AC).' },
];

export default function HelpSupportScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filteredFaqs = FAQS.filter(f => f.question.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Help & Support" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search FAQs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* FAQs */}
        <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.faqCard}>
          {filteredFaqs.length === 0 ? (
            <Text style={styles.emptyText}>No results found.</Text>
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
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={Colors.textMuted} />
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

        {/* Contact Options */}
        <Text style={styles.sectionLabel}>CONTACT US</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactBox} activeOpacity={0.7}>
            <View style={[styles.contactIconBg, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="chatbubbles" size={24} color="#1E88E5" />
            </View>
            <Text style={styles.contactLabel}>Live Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactBox} activeOpacity={0.7}>
            <View style={[styles.contactIconBg, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#43A047" />
            </View>
            <Text style={styles.contactLabel}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactBox} activeOpacity={0.7}>
            <View style={[styles.contactIconBg, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="mail" size={24} color="#FB8C00" />
            </View>
            <Text style={styles.contactLabel}>Email Us</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <Button label="Report a Bug" onPress={() => {}} style={{ width: '100%' }} variant="secondary" iconLeft="bug-outline" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 100, paddingTop: Spacing.md },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, height: 48, ...Shadows.card, marginBottom: Spacing.xl },
  searchInput: { flex: 1, marginLeft: Spacing.sm, ...Typography.body },

  sectionLabel: { ...Typography.sectionLabel, marginBottom: Spacing.sm },

  faqCard: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, ...Shadows.card, marginBottom: Spacing.xl, overflow: 'hidden' },
  faqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg },
  faqQ: { ...Typography.bodyMedium, color: Colors.textPrimary, flex: 1, paddingRight: Spacing.sm },
  faqAContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  faqA: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 20 },
  divider: { height: 1, backgroundColor: Colors.divider },
  emptyText: { padding: Spacing.lg, ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },

  contactRow: { flexDirection: 'row', gap: Spacing.md },
  contactBox: { flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.cardPadding, alignItems: 'center', ...Shadows.card },
  contactIconBg: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  contactLabel: { ...Typography.captionMed, color: Colors.textPrimary },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.background, padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border, paddingBottom: Spacing.safeBottom },
});
