import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ActivityIndicator } from 'react-native';

import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import { Shadows } from '../../constants/shadows';
import { driverService } from '../../services/driverService';
import { useIsFocused } from '@react-navigation/native';

export default function DriverScannerScreen() {
  const isFocused = useIsFocused();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const decodeQRFromUri = async (uri: string) => {
    try {
      setIsProcessing(true);
      setScanned(true); // Ensure camera doesn't double-scan
      
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'upload.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await fetch('http://api.qrserver.com/v1/read-qr-code/', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      const qrText = data[0]?.symbol[0]?.data;
      
      if (qrText) {
        handleBarCodeScanned({ type: 'qr', data: qrText });
      } else {
        setScanResult({
          success: false,
          message: 'No QR Code found in the image'
        });
      }
    } catch (e) {
      setScanResult({
        success: false,
        message: 'Failed to process image'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setIsProcessing(true);
    try {
      const ticketData = JSON.parse(data);
      if (!ticketData.bookingId) throw new Error('Missing bookingId');

      const { data: boardData, error } = await driverService.verifyAndBoardPassenger(ticketData.bookingId);
      
      if (error) {
        setScanResult({
          success: false,
          message: error
        });
      } else {
        setScanResult({
          success: true,
          data: boardData,
          message: `${boardData?.passengerName}\nSeat ${boardData?.seatNumber} • Successfully Boarded!`
        });
      }
    } catch (e) {
      setScanResult({
        success: false,
        message: 'Invalid Ticket Format'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const pickImage = async () => {
    setIsCameraActive(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await decodeQRFromUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setIsCameraActive(true);
    }
  };

  const pickDocument = async () => {
    setIsCameraActive(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await decodeQRFromUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    } finally {
      setIsCameraActive(true);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScanResult(null);
  };

  if (hasPermission === null) {
    return <SafeAreaView style={styles.container}><Text>Requesting camera permission...</Text></SafeAreaView>;
  }
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.noAccessText}>No access to camera</Text>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} disabled={isProcessing}>
            <Ionicons name="image-outline" size={24} color={Colors.white} />
            <Text style={styles.uploadBtnText}>Upload from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.uploadBtn, { marginTop: Spacing.sm, backgroundColor: Colors.card }]} onPress={pickDocument} disabled={isProcessing}>
            <Ionicons name="folder-outline" size={24} color={Colors.primary} />
            <Text style={[styles.uploadBtnText, { color: Colors.primary }]}>Upload from Files</Text>
          </TouchableOpacity>
        </View>
        {isProcessing && <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />}
        {scanned && scanResult && (
          <View style={[styles.resultCard, scanResult.success ? styles.resultSuccess : styles.resultError, { marginHorizontal: Spacing.xl }]}>
            <Ionicons 
              name={scanResult.success ? 'checkmark-circle' : 'close-circle'} 
              size={48} 
              color={scanResult.success ? Colors.success : Colors.error} 
            />
            <Text style={styles.resultMessage}>{scanResult.message}</Text>
            <TouchableOpacity style={styles.scanAgainBtn} onPress={resetScanner}>
              <Text style={styles.scanAgainText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Passenger Ticket</Text>
        <Text style={styles.subtitle}>Align the QR code within the frame</Text>
      </View>

      <View style={styles.scannerContainer}>
        {isFocused && isCameraActive && !scanned ? (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
        ) : (
          <View style={styles.cameraPlaceholder} />
        )}

        {/* Scanner Overlay UI */}
        <View style={styles.overlay}>
          {isProcessing ? (
            <ActivityIndicator size="large" color={Colors.white} />
          ) : (
            <View style={styles.scanFrame} />
          )}
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} disabled={isProcessing}>
          <Ionicons name="image-outline" size={24} color={Colors.white} />
          <Text style={styles.uploadBtnText}>Upload from Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.uploadBtn, { marginTop: Spacing.sm, backgroundColor: Colors.card }]} onPress={pickDocument} disabled={isProcessing}>
          <Ionicons name="folder-outline" size={24} color={Colors.primary} />
          <Text style={[styles.uploadBtnText, { color: Colors.primary }]}>Upload from Files</Text>
        </TouchableOpacity>
      </View>

      {/* Result Card */}
      {scanned && scanResult && (
        <View style={[styles.resultCard, scanResult.success ? styles.resultSuccess : styles.resultError]}>
          <Ionicons 
            name={scanResult.success ? 'checkmark-circle' : 'close-circle'} 
            size={48} 
            color={scanResult.success ? Colors.success : Colors.error} 
          />
          <Text style={styles.resultMessage}>{scanResult.message}</Text>
          
          <TouchableOpacity style={styles.scanAgainBtn} onPress={resetScanner}>
            <Text style={styles.scanAgainText}>Scan Another</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  noAccessText: {
    ...Typography.h3,
    textAlign: 'center',
    marginTop: Spacing.xxxl,
    marginBottom: Spacing.xl,
  },
  scannerContainer: {
    flex: 1,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    ...Shadows.card,
  },
  cameraPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.lg,
  },
  controls: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    ...Shadows.button,
  },
  uploadBtnText: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  resultCard: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...Shadows.card,
    elevation: 10,
  },
  resultSuccess: {
    borderTopWidth: 4,
    borderTopColor: Colors.success,
  },
  resultError: {
    borderTopWidth: 4,
    borderTopColor: Colors.error,
  },
  resultMessage: {
    ...Typography.h3,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  scanAgainBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scanAgainText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
