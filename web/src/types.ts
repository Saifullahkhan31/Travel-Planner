export interface Bus {
  id: string;
  routeId: string;
  busType: string;
  totalSeats: number;
  currentOccupancy: number;
  gpsLocation: { latitude: number; longitude: number };
  driverId?: string;
  driverName: string;
  plateNumber: string;
  isActive: boolean;
  createdAt: string;
}

export interface Route {
  id: string;
  routeName: string;
  origin: string;
  destination: string;
  stops: Stop[];
  distance: number;
  estimatedDuration: number;
  baseFare: number;
  createdAt: string;
  routePath?: any;
}

export interface Stop {
  id: string;
  routeId: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
  estimatedArrival?: string;
}
