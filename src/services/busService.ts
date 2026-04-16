import { Bus, Route, Seat } from '../types';
import { MOCK_BUSES, MOCK_ROUTES, MOCK_SEATS } from './mockData';

export const busService = {
  async getBusesByRoute(routeId: string): Promise<{ data: Bus[] | null; error: string | null }> {
    await new Promise(r => setTimeout(r, 600));
    const buses = MOCK_BUSES.filter(b => b.routeId === routeId && b.isActive);
    return { data: buses, error: null };
  },

  async getAllActiveBuses(): Promise<{ data: Bus[] | null; error: string | null }> {
    await new Promise(r => setTimeout(r, 500));
    return { data: MOCK_BUSES.filter(b => b.isActive), error: null };
  },

  async getBusById(busId: string): Promise<{ data: Bus | null; error: string | null }> {
    await new Promise(r => setTimeout(r, 300));
    const bus = MOCK_BUSES.find(b => b.id === busId);
    return { data: bus ?? null, error: bus ? null : 'Bus not found.' };
  },

  async getRouteById(routeId: string): Promise<{ data: Route | null; error: string | null }> {
    await new Promise(r => setTimeout(r, 200));
    const route = MOCK_ROUTES.find(r => r.id === routeId);
    return { data: route ?? null, error: route ? null : 'Route not found.' };
  },

  async getAllRoutes(): Promise<{ data: Route[] | null; error: string | null }> {
    await new Promise(r => setTimeout(r, 300));
    return { data: MOCK_ROUTES, error: null };
  },

  async getSeatsByBus(busId: string): Promise<{ data: Seat[] | null; error: string | null }> {
    await new Promise(r => setTimeout(r, 400));
    const seats = MOCK_SEATS[busId] ?? [];
    return { data: seats, error: null };
  },

  async searchRoutes(origin: string, destination: string): Promise<{ data: Bus[] | null; error: string | null }> {
    await new Promise(r => setTimeout(r, 800));
    const matchedRoutes = MOCK_ROUTES.filter(r =>
      r.origin.toLowerCase().includes(origin.toLowerCase()) &&
      r.destination.toLowerCase().includes(destination.toLowerCase())
    );
    const buses = MOCK_BUSES.filter(b =>
      matchedRoutes.some(r => r.id === b.routeId) && b.isActive
    );
    return { data: buses, error: null };
  },
};
