import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import Button from '../common/Button';

interface ReportDelayModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, duration: string) => Promise<void>;
}

const DURATIONS = ['15 Mins', '30 Mins', '45 Mins', '1 Hour', '1 Hour+'];
const REASONS = [
  'Heavy Traffic',
  'Weather Conditions',
  'Minor Mechanical Issue',
  'Road Blockage',
  'Passenger Issue',
  'Other'
];

export default function ReportDelayModal({ visible, onClose, onSubmit }: ReportDelayModalProps) {
  const [duration, setDuration] = useState('15 Mins');
  const [reason, setReason] = useState('Heavy Traffic');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onSubmit(reason, duration);
    setLoading(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          
          <View style={styles.header}>
            <View style={[styles.iconBg, { backgroundColor: Colors.errorTint }]}>
              <Ionicons name="warning-outline" size={24} color={Colors.error} />
            </View>
            <Text style={styles.title}>Report Delay</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Notify the system and commuters about an expected delay on your route.
          </Text>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Expected Delay Duration</Text>
            <View style={styles.pillContainer}>
              {DURATIONS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.pill, duration === d && styles.pillActive]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[styles.pillText, duration === d && styles.pillTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Reason for Delay</Text>
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
          </ScrollView>

          <View style={styles.footer}>
            <Button 
              label="Submit Report" 
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
  footer: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitBtn: {
    width: '100%',
  }
});
