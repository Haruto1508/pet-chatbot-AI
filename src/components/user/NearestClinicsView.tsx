import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Star, Clock, AlertCircle, Search, Navigation, ExternalLink, ShieldCheck, LocateFixed } from 'lucide-react';
import { VetClinic } from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ChangeView: React.FC<{ center: [number, number], zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const NearestClinicsView: React.FC = () => {
  const [clinics, setClinics] = useState<VetClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<VetClinic | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const { showSuccess, showError } = useNotification();

  const loadClinics = async () => {
    setLoading(true);
    try {
      const data = await api.getClinics(searchTerm);
      setClinics(data);
      if (data.length > 0 && !selectedClinic) {
        setSelectedClinic(data[0]);
      }
    } catch (e) {
      console.error('Error loading clinics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClinics();
  }, [searchTerm]);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; 
  };

  const processedClinics = clinics
    .filter(c => (emergencyOnly ? c.isEmergency247 : true))
    .map(c => ({
      ...c,
      distanceKm: userLocation ? getDistance(userLocation.lat, userLocation.lng, c.lat, c.lng) : undefined
    }))
    .sort((a, b) => {
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return a.distanceKm - b.distanceKm;
      }
      return 0;
    });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showError('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationLoading(false);
        showSuccess('Đã cập nhật vị trí của bạn!');
      },
      (error) => {
        setLocationLoading(false);
        showError('Không thể lấy vị trí. Vui lòng cấp quyền truy cập vị trí (hoặc mở GPS).');
      }
    );
  };

  const getGoogleMapsDirectionsUrl = (clinic: VetClinic) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}&destination_place_id=${encodeURIComponent(
      clinic.name
    )}`;
  };

  return (
    <div className="w-full px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Tìm Bệnh Viện & Phòng Khám Thú Y Gần Nhất</h2>
            <p className="text-xs text-slate-500">
              Tra cứu phòng khám uy tín, dịch vụ cấp cứu 24/7 và dẫn đường bản đồ Google Maps.
            </p>
          </div>
        </div>

        {/* Emergency Toggle */}
        <button
          onClick={() => setEmergencyOnly(!emergencyOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            emergencyOnly
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          {emergencyOnly ? 'Đang lọc: Trực Cấp Cứu 24/7' : 'Chỉ hiện phòng khám 24/7'}
        </button>
      </div>

      {/* Search & Location Input */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm phòng khám theo tên, địa chỉ, quận huyện..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
          />
        </div>
        
        <button
          onClick={handleGetLocation}
          disabled={locationLoading}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm shadow-xs whitespace-nowrap disabled:opacity-50 transition-colors"
        >
          {locationLoading ? (
            <div className="w-4 h-4 border-2 border-slate-300 border-t-purple-600 rounded-full animate-spin" />
          ) : (
            <LocateFixed className="w-4 h-4 text-purple-600" />
          )}
          {userLocation ? 'Cập nhật lại vị trí' : 'Phòng khám gần tôi'}
        </button>
      </div>

      {/* Content Layout: Map Embed + Clinic Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Clinic Cards List */}
        <div className="lg:col-span-5 space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-xs">Đang tải danh sách phòng khám...</div>
          ) : processedClinics.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">Không tìm thấy phòng khám phù hợp.</p>
            </div>
          ) : (
            processedClinics.map((clinic) => {
              const isSelected = selectedClinic?.id === clinic.id;
              return (
                <div
                  key={clinic.id}
                  onClick={() => setSelectedClinic(clinic)}
                  className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'border-purple-600 ring-2 ring-purple-500/20 bg-purple-50/30'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{clinic.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{clinic.address}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {clinic.isEmergency247 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-100 text-red-700 whitespace-nowrap">
                          24/7 CẤP CỨU
                        </span>
                      )}
                      {clinic.distanceKm !== undefined && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 whitespace-nowrap flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          {clinic.distanceKm.toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{clinic.rating}</span>
                      <span className="text-slate-400 font-normal">({clinic.reviewsCount} đánh giá)</span>
                    </div>

                    <a
                      href={`tel:${clinic.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100"
                    >
                      <Phone className="w-3.5 h-3.5" /> {clinic.phone}
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Map & Selected Clinic Details */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4 flex flex-col">
          {selectedClinic ? (
            <>
              {/* Leaflet Map Frame */}
              <div className="relative w-full h-[350px] lg:h-[450px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner z-0">
                <MapContainer 
                  center={[selectedClinic.lat, selectedClinic.lng]} 
                  zoom={14} 
                  scrollWheelZoom={true} 
                  style={{ height: '100%', width: '100%', zIndex: 10 }}
                >
                  <ChangeView center={[selectedClinic.lat, selectedClinic.lng]} zoom={15} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {/* Clinics Markers */}
                  {processedClinics.map(clinic => (
                    <Marker 
                      key={clinic.id} 
                      position={[clinic.lat, clinic.lng]}
                      eventHandlers={{ click: () => setSelectedClinic(clinic) }}
                    >
                      <Popup>
                        <div className="font-sans">
                          <strong className="block text-sm text-slate-800">{clinic.name}</strong>
                          <span className="text-xs text-slate-500">{clinic.address}</span>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* User Location Marker */}
                  {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                      <Popup>
                        <strong className="text-red-600">Vị trí của bạn</strong>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>

              {/* Clinic Detail Panel */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{selectedClinic.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedClinic.address}</p>
                  </div>

                  <a
                    href={getGoogleMapsDirectionsUrl(selectedClinic)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all whitespace-nowrap"
                  >
                    <Navigation className="w-4 h-4" />
                    Chỉ Đường Google Maps
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700 block">📞 Số điện thoại:</span>
                    <a href={`tel:${selectedClinic.phone}`} className="text-emerald-700 font-bold hover:underline">
                      {selectedClinic.phone}
                    </a>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700 block">⏰ Giờ hoạt động:</span>
                    <span className="text-slate-800 font-medium">{selectedClinic.openingHours}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-800 block mb-1">🏥 Dịch vụ cung cấp:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedClinic.services || []).map((srv, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-semibold border border-purple-200/60"
                      >
                        ✓ {srv}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center py-20 text-slate-400 text-xs">
              Chọn một phòng khám bên trái để xem bản đồ và chi tiết.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
