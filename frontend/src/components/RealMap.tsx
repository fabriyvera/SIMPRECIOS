"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet icons missing in Next.js/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface RealMapProps {
  locations: {
    id: string;
    name: string;
    color: string;
    lat: number;
    lng: number;
    address: string;
    count: number;
    hasFavorites?: boolean;
  }[];
  userLocation: { lat: number; lng: number } | null;
  onSelectMarket: (id: string) => void;
}

export default function RealMap({ locations, userLocation, onSelectMarket }: RealMapProps) {
  const center: [number, number] = [-16.5000, -68.1500]; // La Paz default

  return (
    <div className="h-64 w-full relative z-0">
      <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%", zIndex: 0 }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>Tu ubicación actual</Popup>
          </Marker>
        )}

        {locations.map((loc) => {
          const isGray = loc.count === 0;
          
          const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div style="
                background-color: ${isGray ? '#9ca3af' : loc.color};
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3);
                opacity: ${isGray ? 0.6 : 1};
                filter: ${isGray ? 'grayscale(100%)' : 'none'};
                transition: transform 0.2s;
              " class="hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h2V14h8v8h2a2 2 0 0 0 2-2v-8"/><path d="M2 7h20v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0h-2z"/></svg>
              </div>
              ${loc.hasFavorites ? `
              <div style="
                position: absolute;
                top: -6px;
                right: -6px;
                background-color: #facc15;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                box-shadow: 0 1px 2px rgba(0,0,0,0.2);
              ">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              ` : ''}
              <div style="
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                margin-top: 4px;
                background-color: rgba(255, 255, 255, 0.95);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: bold;
                white-space: nowrap;
                color: #374151;
                box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.1);
              ">
                ${loc.count} ${loc.count === 1 ? 'puesto' : 'puestos'}
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
          });

          return (
            <Marker 
              key={loc.id} 
              position={[loc.lat, loc.lng]} 
              icon={customIcon}
              eventHandlers={{
                click: () => {
                  if (!isGray) onSelectMarket(loc.id);
                }
              }}
            >
              <Popup>
                <div className="font-bold text-sm" style={{ margin: 0 }}>{loc.name}</div>
                <div className="text-xs text-gray-600 mt-1 mb-1">{loc.address}</div>
                <div className="mt-2 font-bold text-xs" style={{ color: isGray ? '#9ca3af' : loc.color }}>
                  {loc.count} ${loc.count === 1 ? 'puesto encontrado' : 'puestos encontrados'}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
