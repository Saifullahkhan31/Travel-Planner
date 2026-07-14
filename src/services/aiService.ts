import { CrowdPrediction, ComfortScore, AITripSuggestion, FareEstimate, BusType, RoutinePattern, TripHistory, Bus, Route } from '../types';
import { AI_MOCK_ROUTES } from './aiMockData';
import { FARE_CONSTANTS, COMFORT_WEIGHTS, CROWD_THRESHOLDS } from '../constants/locations';

// --- FastAPI AI Service URL ---
// Change this to your deployed Railway/Render URL in production.
// For local development, run `uvicorn main:app --port 8000` inside the ai-service folder.
const AI_SERVICE_URL = 'http://172.17.44.44:8000'; // Android emulator → localhost. Use your IP for physical device.

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

  /**
   * Build AI trip suggestions.
   * If live buses/routes are passed in (from HomeScreen's Supabase fetch), we use them.
   * Otherwise, we fall back to the AI_MOCK_ROUTES for the route names only.
   */
  getTripSuggestions(user: any | null, liveBuses?: Bus[], liveRoutes?: Route[]): AITripSuggestion[] {
    const now = new Date();

    // Time adjustment based on preference
    let timeOffsetHours = 0;
    if (user?.preferredDepartureTime === 'early_morning') timeOffsetHours = -3;
    if (user?.preferredDepartureTime === 'afternoon') timeOffsetHours = 4;
    if (user?.preferredDepartureTime === 'evening') timeOffsetHours = 8;
    if (user?.preferredDepartureTime === 'night') timeOffsetHours = 12;

    // If we have live database buses, use those
    if (liveBuses && liveBuses.length > 0 && liveRoutes && liveRoutes.length > 0) {
      // Sort buses to prioritize ones on the user's frequent routes
      const sortedBuses = [...liveBuses].sort((a, b) => {
        const routeA = liveRoutes.find(r => r.id === a.routeId)?.routeName;
        const routeB = liveRoutes.find(r => r.id === b.routeId)?.routeName;
        const aFav = routeA && user?.frequentRoutes?.includes(routeA) ? 1 : 0;
        const bFav = routeB && user?.frequentRoutes?.includes(routeB) ? 1 : 0;
        return bFav - aFav;
      });

      return sortedBuses
        .slice(0, 3)
        .map((bus, idx) => {
          const route = liveRoutes.find(r => r.id === bus.routeId) ?? liveRoutes[idx % liveRoutes.length];
          // Skip if we still can't find a route with a valid name
          if (!route?.routeName) return null;

          const isRoutine = user?.frequentRoutes?.includes(route.routeName) ?? (idx === 0);
          const crowd = aiService.predictCrowd(bus.id, bus.currentOccupancy, bus.totalSeats);
          const comfort = aiService.getComfortScore(bus.id, bus.currentOccupancy, bus.totalSeats, bus.busType);
          const fare = aiService.estimateFare(route.id, bus.busType, route.distance || 200);

          // Adjust departure time based on user preference
          const departure = new Date(now.getTime() + (15 + idx * 12 + (timeOffsetHours * 60)) * 60 * 1000);

          return {
            routeId: route.id,
            routeName: route.routeName,
            suggestedBusId: bus.id,
            departureTime: departure.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
            comfortScore: comfort,
            crowdPrediction: crowd,
            isRoutine,
            confidenceScore: isRoutine ? (0.95 - idx * 0.02) : (0.85 - idx * 0.08),
            estimatedFare: fare.totalFare,
            eta: 15 + idx * 12 + (timeOffsetHours > 0 ? timeOffsetHours * 60 : 0),
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);
    }

    // Fallback: purely display-only suggestions using mock route names
    // (Won't link to real buses — shown when Supabase is unreachable)
    return AI_MOCK_ROUTES.slice(0, 3).map((route, idx) => {
      const mockOccupancy = 10 + idx * 8;
      const mockSeats = 40;
      const crowd = aiService.predictCrowd(`mock-${idx}`, mockOccupancy, mockSeats);
      const comfort = aiService.getComfortScore(`mock-${idx}`, mockOccupancy, mockSeats, 'AC');
      const fare = aiService.estimateFare(route.id, 'AC', route.distance);
      const departure = new Date(now.getTime() + (15 + idx * 12) * 60 * 1000);
      return {
        routeId: route.id,
        routeName: route.routeName,
        suggestedBusId: `mock-${idx}`,
        departureTime: departure.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' }),
        comfortScore: comfort,
        crowdPrediction: crowd,
        isRoutine: idx === 0,
        confidenceScore: 0.88 - idx * 0.08,
        estimatedFare: fare.totalFare,
        eta: 15 + idx * 12,
      };
    });
  },

  detectRoutines(tripHistory: TripHistory[]): RoutinePattern[] {
    const grouped: Record<string, { routeName: string; times: string[] }> = {};
    tripHistory.forEach(t => {
      if (!grouped[t.routeId]) grouped[t.routeId] = { routeName: t.routeName, times: [] };
      grouped[t.routeId].times.push(t.travelTime);
    });

    return Object.entries(grouped)
      .filter(([, v]) => v.times.length >= 2)
      .map(([routeId, v]) => {
        const freq = v.times.length;
        const avgHour = v.times
          .map(ts => new Date(ts).getHours())
          .reduce((a, b) => a + b, 0) / freq;
        const h = Math.round(avgHour);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
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

  /**
   * Calls the Python FastAPI /predict-crowd endpoint.
   * Returns ML-powered crowd & comfort predictions.
   * Falls back to local calculation if the server is unreachable.
   */
  async predictCrowdFromAPI(
    busId: string,
    currentOccupancy: number,
    totalSeats: number,
    busType: BusType,
    routeFrom: string,
    routeTo: string,
  ): Promise<CrowdPrediction & { apiComfortScore: number }> {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    try {
      const response = await fetch(`${AI_SERVICE_URL}/predict-crowd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_from: routeFrom,
          route_to: routeTo,
          bus_type: busType,
          hour,
          day_of_week: dayOfWeek,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json() as { crowd_percentage: number; comfort_score: number };

      // Convert API decimals (0–1) to percentages (0–100)
      const predictedPct = Math.round(data.crowd_percentage * 100);
      const predictedOcc = Math.round((data.crowd_percentage) * totalSeats);
      return {
        busId,
        predictedOccupancy: predictedOcc,
        crowdLevel: getCrowdLevel(predictedPct),
        occupancyPercentage: predictedPct,
        confidenceScore: 0.91, // ML model has high confidence
        predictedAt: new Date().toISOString(),
        apiComfortScore: Math.round(data.comfort_score * 100),
      };
    } catch {
      // Fallback to local heuristic if server is down
      const local = aiService.predictCrowd(busId, currentOccupancy, totalSeats);
      const localComfort = aiService.getComfortScore(busId, currentOccupancy, totalSeats, busType);
      return { ...local, apiComfortScore: localComfort.score };
    }
  },

  /**
   * Calls the Python FastAPI /ai-suggestions endpoint.
   * Returns a natural language suggestion from the LLM (or a mock if no API key).
   * Falls back to a static string if the server is unreachable.
   */
  async getAISuggestionText(
    preferences: string,
    routeFrom: string,
    routeTo: string,
    time: string,
    crowdLevel: 'low' | 'medium' | 'high' = 'medium',
    comfortScore: number = 70,
    busType: string = 'AC',
  ): Promise<string> {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/ai-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences,
          route_from: routeFrom,
          route_to: routeTo,
          time,
          crowd_level: crowdLevel,
          comfort_score: comfortScore,
          bus_type: busType,
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json() as { suggestion: string };
      return data.suggestion;
    } catch {
      return `For the ${routeFrom} → ${routeTo} route at ${time}, crowd levels are ${crowdLevel} and comfort is at ${comfortScore}/100. A great time to travel!`;
    }
  },
};
