import { CrowdPrediction, ComfortScore, AITripSuggestion, FareEstimate, BusType, RoutinePattern, TripHistory } from '../types';
import { MOCK_BUSES, MOCK_ROUTES } from './mockData';
import { FARE_CONSTANTS, COMFORT_WEIGHTS, CROWD_THRESHOLDS } from '../constants/locations';

function getCrowdLevel(pct: number): 'low' | 'medium' | 'high' {
  if (pct <= CROWD_THRESHOLDS.LOW_MAX) return 'low';
  if (pct <= CROWD_THRESHOLDS.MEDIUM_MAX) return 'medium';
  return 'high';
}

function getBusTypeFactor(busType: BusType): number {
  if (busType === 'AC') return COMFORT_WEIGHTS.AC_FACTOR;
  if (busType === 'Premium') return COMFORT_WEIGHTS.PREMIUM_FACTOR;
  return COMFORT_WEIGHTS.NON_AC_FACTOR;
}

export const aiService = {
  predictCrowd(busId: string, currentOccupancy: number, totalSeats: number): CrowdPrediction {
    const pct = (currentOccupancy / totalSeats) * 100;
    const level = getCrowdLevel(pct);
    // Add minor time-of-day variance
    const hour = new Date().getHours();
    const peakFactor = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 1.15 : 1.0;
    const predictedOcc = Math.min(Math.round(currentOccupancy * peakFactor), totalSeats);
    const predictedPct = (predictedOcc / totalSeats) * 100;
    return {
      busId,
      predictedOccupancy: predictedOcc,
      crowdLevel: getCrowdLevel(predictedPct),
      occupancyPercentage: Math.round(predictedPct),
      confidenceScore: 0.82 + Math.random() * 0.15,
      predictedAt: new Date().toISOString(),
    };
  },

  getComfortScore(busId: string, currentOccupancy: number, totalSeats: number, busType: BusType): ComfortScore {
    const busTypeFactor = getBusTypeFactor(busType);
    const occupancyFactor = (1 - currentOccupancy / totalSeats) * COMFORT_WEIGHTS.OCCUPANCY_MAX;
    const score = Math.round(occupancyFactor + busTypeFactor);
    const clampedScore = Math.max(0, Math.min(100, score));
    let label: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    let emoji: '😊' | '🙂' | '😐' | '😟';
    if (clampedScore >= 80) { label = 'Excellent'; emoji = '😊'; }
    else if (clampedScore >= 60) { label = 'Good'; emoji = '🙂'; }
    else if (clampedScore >= 40) { label = 'Fair'; emoji = '😐'; }
    else { label = 'Poor'; emoji = '😟'; }
    return { busId, score: clampedScore, occupancyFactor: Math.round(occupancyFactor), busTypeFactor, label, emoji, calculatedAt: new Date().toISOString() };
  },

  estimateFare(routeId: string, busType: BusType, distance: number): FareEstimate {
    const baseFare = FARE_CONSTANTS.BASE_FARE;
    const distanceCharge = distance * FARE_CONSTANTS.RATE_PER_KM;
    let busTypeCharge = 0;
    if (busType === 'AC') busTypeCharge = FARE_CONSTANTS.AC_SURCHARGE;
    if (busType === 'Premium') busTypeCharge = FARE_CONSTANTS.PREMIUM_SURGE;
    return { routeId, busType, distance, baseFare, distanceCharge, busTypeCharge, totalFare: Math.round(baseFare + distanceCharge + busTypeCharge) };
  },

  getTripSuggestions(userId: string): AITripSuggestion[] {
    const now = new Date();
    return MOCK_BUSES.slice(0, 3).map((bus, idx) => {
      const route = MOCK_ROUTES.find(r => r.id === bus.routeId)!;
      const crowd = aiService.predictCrowd(bus.id, bus.currentOccupancy, bus.totalSeats);
      const comfort = aiService.getComfortScore(bus.id, bus.currentOccupancy, bus.totalSeats, bus.busType);
      const fare = aiService.estimateFare(route.id, bus.busType, route.distance);
      const departure = new Date(now.getTime() + (15 + idx * 12) * 60 * 1000);
      return {
        routeId: route.id, routeName: route.routeName,
        suggestedBusId: bus.id,
        departureTime: departure.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
        comfortScore: comfort, crowdPrediction: crowd,
        isRoutine: idx === 0,
        confidenceScore: 0.88 - idx * 0.08,
        estimatedFare: fare.totalFare,
        eta: 15 + idx * 12,
      };
    });
  },

  detectRoutines(tripHistory: TripHistory[]): RoutinePattern[] {
    // Group trips by routeId
    const grouped: Record<string, { routeName: string; times: string[] }> = {};
    tripHistory.forEach(t => {
      if (!grouped[t.routeId]) grouped[t.routeId] = { routeName: t.routeName, times: [] };
      grouped[t.routeId].times.push(t.travelTime);
    });

    return Object.entries(grouped)
      .filter(([, v]) => v.times.length >= 2) // Need 2+ trips to detect routine
      .map(([routeId, v]) => {
        const freq = v.times.length;
        // Estimate typical departure based on timestamps
        const avgHour = v.times
          .map(ts => new Date(ts).getHours())
          .reduce((a, b) => a + b, 0) / freq;
        const h = Math.round(avgHour);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const route = MOCK_ROUTES.find(r => r.id === routeId);
        return {
          routeId,
          routeName: v.routeName,
          typicalDepartureTime: `${h12}:00 ${ampm}`,
          frequency: Math.min(freq, 7),
          confidenceScore: Math.min(0.95, 0.55 + freq * 0.12),
          lastDetected: v.times[v.times.length - 1],
        } satisfies RoutinePattern;
      })
      .sort((a, b) => b.confidenceScore - a.confidenceScore);
  },
};
