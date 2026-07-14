import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues with bundlers like Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  height?: string;
}

function LocationMarker({ position, onChange }: { position: L.LatLngExpression, onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

function MapController() {
  const map = useMapEvents({});
  useEffect(() => {
    // Invalidate size after a short delay to allow modal layout to settle
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [map]);
  return null;
}

function MapUpdater({ lat, lng }: { lat: number, lng: number }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 13);
    }
  }, [lat, lng, map]);
  return null;
}

export default function LocationPickerMap({ latitude, longitude, onLocationChange, height = '300px' }: LocationPickerMapProps) {
  // If coordinates are [0,0] or similar defaults, we might want to center on a default city
  const position: L.LatLngExpression = [latitude || 30.3753, longitude || 69.3451];

  return (
    <div style={{ height, width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <MapContainer 
        center={position} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} onChange={onLocationChange} />
        <MapController />
        <MapUpdater lat={latitude || 30.3753} lng={longitude || 69.3451} />
      </MapContainer>
    </div>
  );
}
