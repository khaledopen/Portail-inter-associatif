import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Association, DigitalHelpCenter } from '../data/mockData';

interface InteractiveMapProps {
  associations?: Association[];
  digitalCenters?: DigitalHelpCenter[];
  selectedId?: string;
  onSelectAssociation?: (id: string) => void;
  heightClass?: string;
  center?: [number, number];
  zoom?: number;
}

function markerPopup(title: string, ...lines: string[]) {
  const box = document.createElement('div');
  box.className = 'min-w-[190px] space-y-1';
  const heading = document.createElement('strong');
  heading.textContent = title;
  box.append(heading);
  for (const line of lines.filter(Boolean)) {
    const text = document.createElement('div');
    text.textContent = line;
    box.append(text);
  }
  return box;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  associations = [],
  digitalCenters = [],
  selectedId,
  onSelectAssociation,
  heightClass = 'h-[420px]',
  center = [47.9029, 1.9093],
  zoom = 12,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    associations.forEach((asso) => {
      const isSelected = asso.id === selectedId;
      const marker = L.circleMarker([asso.lat, asso.lng], {
        radius: isSelected ? 12 : 9,
        fillColor: isSelected ? '#C0392B' : '#176B57',
        color: '#FFFFFF',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.95,
      });

      marker.bindPopup(markerPopup(asso.shortName, [asso.address, asso.city].filter(Boolean).join(', '),
        [asso.taoLine, asso.taoStop].filter(Boolean).join(' — '), asso.hours));
      marker.on('click', () => {
        if (onSelectAssociation) {
          onSelectAssociation(asso.id);
        }
      });

      marker.addTo(layer);
      if (isSelected) {
        map.setView([asso.lat, asso.lng], 13, { animate: true });
        marker.openPopup();
      }
    });

    digitalCenters.forEach((dc) => {
      const marker = L.circleMarker([dc.lat, dc.lng], {
        radius: 9,
        fillColor: '#174A73',
        color: '#FFFFFF',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.95,
      });

      marker.bindPopup(markerPopup(dc.name, dc.address, dc.taoStop, dc.phone));
      marker.addTo(layer);
    });
  }, [associations, digitalCenters, selectedId, onSelectAssociation]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full ${heightClass} rounded-[12px] border border-border overflow-hidden bg-secondary-light`}
      aria-label="Carte interactive d'Orléans et du Loiret"
    />
  );
};
