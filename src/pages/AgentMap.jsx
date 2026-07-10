import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layout } from '../components/Layout/Layout';
import { supabase } from '../lib/supabaseClient';
import { RefreshCw } from 'lucide-react';

const ROLE_COLOR = {
  'owner':       '#7c3aed',
  'super-admin': '#ef4444',
  'admin':       '#0ea5e9',
  'spv-agen':    '#f97316',
  'agen':        '#3b82f6',
  'surveyor':    '#22c55e',
  'finance':     '#8b5cf6',
};
const ROLE_LABEL = {
  'owner':       'Owner',
  'super-admin': 'Super Admin',
  'admin':       'Admin',
  'spv-agen':    'Supervisor Agen',
  'agen':        'Agen',
  'surveyor':    'Surveyor',
  'finance':     'Finance',
};

function timeAgo(iso) {
  if (!iso) return '-';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

export function AgentMap() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('dsd_agent_locations')
      .select('*')
      .order('updated_at', { ascending: false });
    setLocations(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Init peta sekali
  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;
    mapInstance.current = L.map(mapRef.current).setView([-2.5, 118], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstance.current);
    return () => { mapInstance.current?.remove(); mapInstance.current = null; };
  }, []);

  // Update markers saat data berubah
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const valid = locations.filter(l => l.lat != null && l.lng != null);
    valid.forEach(loc => {
      const color = ROLE_COLOR[loc.role] || '#64748b';
      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: 9, color: '#fff', weight: 2, fillColor: color, fillOpacity: 0.9,
      }).addTo(map);
      marker.bindPopup(
        `<strong>${loc.name || '-'}</strong><br/>` +
        `${ROLE_LABEL[loc.role] || loc.role}<br/>` +
        `<small>Update: ${timeAgo(loc.updated_at)}</small><br/>` +
        `<a href="https://maps.google.com/?q=${loc.lat},${loc.lng}" target="_blank" rel="noreferrer">Buka di Google Maps</a>`
      );
      markersRef.current.push(marker);
    });

    if (valid.length > 0) {
      map.fitBounds(L.latLngBounds(valid.map(l => [l.lat, l.lng])), { padding: [40, 40], maxZoom: 13 });
    }
  }, [locations]);

  return (
    <Layout
      title="Peta Lokasi Tim"
      subtitle="Lokasi terakhir semua user yang login di aplikasi Android"
      actions={
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          <RefreshCw size={14} /> {loading ? 'Memuat...' : 'Refresh'}
        </button>
      }
    >
      {/* Legend — hanya tampilkan role yang ada di data */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        {[...new Set(locations.map(l => l.role))].filter(Boolean).map(role => (
          <span key={role} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--c-64748b)' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: ROLE_COLOR[role] || '#64748b', border: '2px solid #fff', boxShadow: '0 0 0 1px var(--border)', flexShrink: 0 }} />
            {ROLE_LABEL[role] || role}
          </span>
        ))}
        {locations.length === 0 && !loading && (
          <span style={{ fontSize: 12, color: 'var(--c-94a3b8)' }}>Menunggu data...</span>
        )}
        <span style={{ fontSize: 12, color: 'var(--c-94a3b8)', marginLeft: 4 }}>{locations.length > 0 ? `${locations.length} lokasi terdata` : ''}</span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div ref={mapRef} style={{ height: 'calc(100dvh - 260px)', minHeight: 360 }} />
      </div>

      {locations.length === 0 && !loading && (
        <p style={{ fontSize: 13, color: 'var(--c-94a3b8)', marginTop: 12 }}>
          Belum ada data lokasi. Lokasi terkirim otomatis saat user (role apapun) membuka aplikasi Android dan mengizinkan akses lokasi.
        </p>
      )}
    </Layout>
  );
}
