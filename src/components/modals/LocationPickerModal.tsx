import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  Dimensions, Pressable, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';

interface LocationPickerModalProps {
  visible          : boolean;
  onClose          : () => void;
  onSelectCity     : (city: string) => void;
  currentCity      : string;
}

const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Hyderabad', 'Peshawar', 'Quetta', 'Multan', 'Sukkur'];

export default function LocationPickerModal({ visible, onClose, onSelectCity, currentCity }: LocationPickerModalProps) {
  const [detecting, setDetecting] = React.useState(false);

  const handleUseCurrentLocation = async () => {
    setDetecting(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permissions to use this feature.');
        setDetecting(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      // Reverse geocode to get city
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode.length > 0 && geocode[0].city) {
        onSelectCity(geocode[0].city);
        onClose();
      } else {
        Alert.alert('Detection Failed', 'Could not determine your city. Please select from the list.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while detecting your location.');
    } finally {
      setDetecting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>Select Location</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.currentLocationBtn} 
              onPress={handleUseCurrentLocation}
              disabled={detecting}
            >
              <Ionicons name="navigate" size={20} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.currentLocationLabel}>Use Current Location</Text>
                <Text style={styles.currentLocationSub}>Find buses near you</Text>
              </View>
              {detecting ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              )}
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Available Cities</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={styles.cityList}>
              <View style={styles.grid}>
                {CITIES.map(city => (
                  <TouchableOpacity 
                    key={city} 
                    style={[styles.cityItem, currentCity === city && styles.cityItemActive]}
                    onPress={() => {
                      onSelectCity(city);
                      onClose();
                    }}
                  >
                    <Text style={[styles.cityText, currentCity === city && styles.cityTextActive]}>
                      {city}
                    </Text>
                    {currentCity === city && <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    height: height * 0.7,
  },
  content: {
    padding: Spacing.xl,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h3,
  },
  currentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryTint,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  currentLocationLabel: {
    ...Typography.bodyMedium,
    color: Colors.primary,
    fontWeight: '700',
  },
  currentLocationSub: {
    ...Typography.tiny,
    color: Colors.primary,
    opacity: 0.7,
  },
  sectionTitle: {
    ...Typography.sectionLabel,
    marginBottom: Spacing.md,
  },
  cityList: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  cityItem: {
    width: '46%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  cityItemActive: {
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  cityText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  cityTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
