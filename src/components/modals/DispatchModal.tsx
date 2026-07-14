import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import Button from '../common/Button';

interface DispatchModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void>;
}

const REASONS = [
  'Flat Tire',
  'Engine Breakdown',
  'Medical Emergency',
  'Accident',
  'Route Blocked',
  'Other Critical Issue'
];

export default function DispatchModal({ visible, onClose, onSubmit }: DispatchModalProps) {
  const [reason, setReason] = useState('Flat Tire');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onSubmit(reason, details);
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          
          <View style={styles.header}>
            <View style={[styles.iconBg, { backgroundColor: Colors.primaryTint }]}>
              <Ionicons name="chatbubbles-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Contact Dispatch</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Request immediate assistance from the administration team. This will flag your trip as an emergency.
          </Text>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Type of Emergency</Text>
            <View style={styles.pillContainer}>
              {REASONS.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.pill, reason === r && styles.pillActive]}
                  onPress={() => setReason(r)}
                >
                  <Text style={[styles.pillText, reason === r && styles.pillTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="E.g., Need a tow truck on Highway M9"
              placeholderTextColor={Colors.textMuted}
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </ScrollView>

          <View style={styles.footer}>
            <Button 
              label="Send SOS" 
              onPress={handleSubmit} 
              loading={loading}
              style={styles.submitBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconBg: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md,
  },
  title: {
    ...Typography.h2,
    flex: 1,
  },
  closeBtn: {
    padding: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  scroll: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  pillTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
    minHeight: 100,
    marginBottom: Spacing.xl,
  },
  footer: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitBtn: {
    width: '100%',
  }
});
