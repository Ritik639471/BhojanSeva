import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Mic, Map as MapIcon, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import HeatmapLayer from './HeatmapLayer';

function ResetView({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13, { animate: true });
  }, [center, map]);
  return null;
}

const createCustomIcon = (type, isLive, status, isMoving, isSaved) => {
  let color = '#FF9933'; // Default saffron
  if (!isLive || status === 'finished') color = '#94A3B8'; // Gray
  else if (status === 'low') color = '#F59E0B'; // Amber
  else if (type === 'Langar') color = '#10B981'; // Green
  else if (type === 'Iftar') color = '#3B82F6'; // Blue
  else if (type === 'Other') color = '#8B5CF6'; // Purple
  
  const iconEmoji = isSaved ? '🔖' : (type === 'Bhandara' ? '🍛' : type === 'Langar' ? '🕌' : type === 'Iftar' ? '🌙' : type === 'Prasad' ? '🙏' : '🤲');

  const html = `
    <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; ${isMoving ? 'animation: pulse-dot 2s infinite;' : ''}">
      <div style="position: absolute; inset: 0; background: ${color}; opacity: ${isLive && status !== 'finished' ? '0.3' : '0'}; border-radius: 50%; filter: blur(6px); transform: translateY(4px) scale(0.9);"></div>
      <div style="background: white; border: 3px solid ${color}; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.15); z-index: 2; position: relative;">
        ${iconEmoji}
        ${isSaved ? `<div style="position: absolute; top: -4px; right: -4px; background: #EAB308; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>` : ''}
      </div>
      <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${color}; z-index: 1;"></div>
    </div>
  `;

  return L.divIcon({ html, className: 'custom-map-marker', iconSize: [44, 44], iconAnchor: [22, 44] });
};

// Create cluster icon
const createClusterCustomIcon = function (cluster) {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `<div style="background: var(--color-primary); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; border: 3px solid white; box-shadow: 0 2px 8px rgba(255,153,51,0.5);">${count}</div>`,
    className: 'custom-cluster-marker',
    iconSize: [36, 36]
  });
};

export default function MapScreen({ sevas, onSelectSeva, isFestivalMode, onTriggerVoiceSearch, centerOverride }) {
  const [center, setCenter] = useState([28.6139, 77.2090]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const { isSaved } = useApp();

  useEffect(() => {
    if (centerOverride) {
      setCenter(centerOverride);
    } else if (sevas.length > 0 && !isFestivalMode) {
      setCenter([sevas[0].location.lat, sevas[0].location.lng]);
    }
  }, [sevas, isFestivalMode, centerOverride]);

  // Festival Mode Route Calculation
  const activeSevas = sevas.filter(s => s.isLive && s.status !== 'finished');
  let routePositions = [];
  if (isFestivalMode && activeSevas.length > 1) {
    // Basic greedy TSP
    let remaining = [...activeSevas];
    let current = remaining.shift();
    routePositions.push([current.location.lat, current.location.lng]);
    while (remaining.length > 0) {
      let nearestIdx = 0;
      let minD = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d = Math.pow(remaining[i].location.lat - current.location.lat, 2) + Math.pow(remaining[i].location.lng - current.location.lng, 2);
        if (d < minD) { minD = d; nearestIdx = i; }
      }
      current = remaining.splice(nearestIdx, 1)[0];
      routePositions.push([current.location.lat, current.location.lng]);
    }
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        maxBounds={[[8.4, 68.7], [37.6, 97.2]]} // India bounds
      >
        {/* Soft, warm, light map style */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          noWrap={true}
        />
        <ResetView center={center} />
        
        {/* Route line for festival mode */}
        {isFestivalMode && routePositions.length > 1 && (
          <Polyline positions={routePositions} pathOptions={{ color: 'var(--color-primary)', weight: 4, opacity: 0.7, dashArray: '8, 8' }} />
        )}

        {showHeatmap && (
          <HeatmapLayer points={sevas.map(s => [s.location.lat, s.location.lng, s.goingCount || 1])} />
        )}

        {/* Marker Clustering */}
        {!showHeatmap && (
          <MarkerClusterGroup
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={40}
            showCoverageOnHover={false}
          >
            {sevas.map(seva => (
              <Marker
                key={seva.id}
                position={[seva.location.lat, seva.location.lng]}
                icon={createCustomIcon(seva.type, seva.isLive, seva.status, seva.isMoving, isSaved(seva.id))}
                eventHandlers={{ click: () => onSelectSeva(seva) }}
              />
            ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>

      {/* Floating Action Buttons overlay */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="fab"
          style={{ position: 'static', width: '48px', height: '48px', background: showHeatmap ? 'var(--color-primary)' : 'var(--color-surface)', color: showHeatmap ? 'white' : 'var(--color-primary)', border: '1px solid rgba(255,153,51,0.2)', boxShadow: 'var(--shadow-lg)' }}
          title="Toggle Heatmap"
        >
          <Layers size={22} />
        </button>
        <button
          onClick={onTriggerVoiceSearch}
          className="fab"
          style={{ position: 'static', width: '48px', height: '48px', background: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid rgba(255,153,51,0.2)', boxShadow: 'var(--shadow-lg)' }}
          title="Voice Search"
        >
          <Mic size={22} />
        </button>
      </div>

      {/* Legend */}
      <div className="glass-panel" style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', zIndex: 1000, padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ color: '#FF9933' }}>●</span> Bhandara</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ color: '#10B981' }}>●</span> Langar</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ color: '#3B82F6' }}>●</span> Iftar</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ color: '#F59E0B' }}>●</span> Low Food</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ color: '#94A3B8' }}>●</span> Finished</div>
      </div>
    </div>
  );
}
