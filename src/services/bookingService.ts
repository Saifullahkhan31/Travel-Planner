import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking, BookingStatus } from '../types';
import { MOCK_SEATS } from './mockData';

const BOOKINGS_KEY = 'mock_bookings';

async function getAllBookings(): Promise<Booking[]> {
  try {
    const raw = await AsyncStorage.getItem(BOOKINGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveBookings(bookings: Booking[]): Promise<void> {
  await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

export const bookingService = {
  async createBooking(
    userId: string, busId: string, seatId: string,
    routeId: string, travelDate: string, fare: number,
    routeName: string, busType: 'AC' | 'Non-AC' | 'Premium', seatNumber: number
  ): Promise<{ data: Booking | null; error: string | null }> {
    await new Promise(r => setTimeout(r, 600));
    const bookingId = `bk_${Date.now()}`;
    const qrPayload = JSON.stringify({ bookingId, userId, timestamp: Date.now() });
    const booking: Booking = {
      id: bookingId, userId, busId, seatId, routeId,
      bookingTime: new Date().toISOString(),
      travelDate, bookingStatus: 'pending', paymentStatus: 'pending',
      fareAmount: fare, qrCode: qrPayload, seatNumber, routeName, busType,
    };
    const all = await getAllBookings();
    await saveBookings([...all, booking]);
    return { data: booking, error: null };
  },

  async confirmBooking(bookingId: string): Promise<{ data: Booking | null; error: string | null }> {
    await new Promise(r => setTimeout(r, 1000));
    const all = await getAllBookings();
    const idx = all.findIndex(b => b.id === bookingId);
    if (idx === -1) return { data: null, error: 'Booking not found.' };
    all[idx] = { ...all[idx], bookingStatus: 'confirmed', paymentStatus: 'success' };
    await saveBookings(all);
    return { data: all[idx], error: null };
  },

  async cancelBooking(bookingId: string): Promise<{ data: Booking | null; error: string | null }> {
    await new Promise(r => setTimeout(r, 500));
    const all = await getAllBookings();
    const idx = all.findIndex(b => b.id === bookingId);
    if (idx === -1) return { data: null, error: 'Booking not found.' };
    all[idx] = { ...all[idx], bookingStatus: 'cancelled' };
    await saveBookings(all);
    return { data: all[idx], error: null };
  },

  async getUserBookings(userId: string, status?: BookingStatus): Promise<{ data: Booking[] | null; error: string | null }> {
    await new Promise(r => setTimeout(r, 400));
    const all = await getAllBookings();
    const filtered = all.filter(b =>
      b.userId === userId && (status ? b.bookingStatus === status : true)
    ).reverse();
    return { data: filtered, error: null };
  },

  async getBookingById(bookingId: string): Promise<{ data: Booking | null; error: string | null }> {
    const all = await getAllBookings();
    const booking = all.find(b => b.id === bookingId);
    return { data: booking ?? null, error: booking ? null : 'Booking not found.' };
  },

  generateQRCode(bookingId: string): string {
    return JSON.stringify({ bookingId, timestamp: Date.now(), verified: true });
  },
};
