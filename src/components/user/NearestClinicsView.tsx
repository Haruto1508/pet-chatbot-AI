import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Phone, Star, Clock, AlertCircle, Search, Navigation, ExternalLink, ShieldCheck, LocateFixed, RefreshCw, Compass } from 'lucide-react';
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

// Component to dynamically re-center map whenever target location or zoom changes
const DynamicMapView: React.FC<{ center: { lat: number; lng: number }; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
      map.flyTo([center.lat, center.lng], zoom, { duration: 1.2 });
      setTimeout(() => map.invalidateSize(), 200);
    }
  }, [center.lat, center.lng, zoom, map]);
  return null;
};

export const NearestClinicsView: React.FC = () => {
  const [clinics, setClinics] = useState<VetClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<VetClinic | null>(null);
  
  // Location States
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationSource, setLocationSource] = useState<'gps' | 'ip' | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Map Target State for smooth panning/zooming
  const [mapTarget, setMapTarget] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: 10.776889,
    lng: 106.700806,
    zoom: 14
  });
  
  const { showSuccess, showError } = useNotification();

  const fetchIPLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          return { lat: data.latitude, lng: data.longitude };
        }
      }
    } catch {}

    try {
      const res2 = await fetch('https://ipapi.co/json/');
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2 && typeof data2.latitude === 'number' && typeof data2.longitude === 'number') {
          return { lat: data2.latitude, lng: data2.longitude };
        }
      }
    } catch {}

    return null;
  };

  const detectLocation = useCallback(async (isAuto = false) => {
    setLocationLoading(true);

    // If browser permission was explicitly denied, jump straight to IP fallback
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (perm.state === 'denied') {
          const ipLoc = await fetchIPLocation();
          if (ipLoc) {
            setUserLocation(ipLoc);
            setLocationSource('ip');
            setLocationLoading(false);
            setMapTarget({ lat: ipLoc.lat, lng: ipLoc.lng, zoom: 13 });
            if (!isAuto) showSuccess('Đã xác định vị trí tương đối qua IP mạng');
          } else {
            setLocationLoading(false);
          }
          return;
        }
      } catch {}
    }

    const getBrowserPosition = (options: PositionOptions) => {
      return new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    // Attempt 1: Browser GPS High Accuracy
    try {
      const pos = await getBrowserPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(loc);
      setLocationSource('gps');
      setLocationLoading(false);
      setMapTarget({ lat: loc.lat, lng: loc.lng, zoom: 15 });
      showSuccess(isAuto ? 'Tự động định vị GPS thành công!' : 'Đã cập nhật vị trí GPS của bạn!');
      return;
    } catch (err: any) {
      if (err?.code !== 1) { // If not explicitly PERMISSION_DENIED
        try {
          const pos = await getBrowserPosition({ enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 });
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setLocationSource('gps');
          setLocationLoading(false);
          setMapTarget({ lat: loc.lat, lng: loc.lng, zoom: 15 });
          showSuccess('Xác định vị trí thành công!');
          return;
        } catch {}
      }
    }

    // Attempt 2: IP Geolocation Fallback
    const ipLoc = await fetchIPLocation();
    if (ipLoc) {
      setUserLocation(ipLoc);
      setLocationSource('ip');
      setLocationLoading(false);
      setMapTarget({ lat: ipLoc.lat, lng: ipLoc.lng, zoom: 14 });
      showSuccess(isAuto ? 'Đã ước tính vị trí của bạn qua địa chỉ IP!' : 'Đã lấy vị trí ước tính qua IP!');
      return;
    }

    // Attempt 3: Default fallback (Ho Chi Minh City center)
    setLocationLoading(false);
    const defaultLoc = { lat: 10.776889, lng: 106.700806 };
    setUserLocation(defaultLoc);
    setLocationSource('ip');
    setMapTarget({ lat: defaultLoc.lat, lng: defaultLoc.lng, zoom: 13 });
    if (!isAuto) {
      showError('Không thể lấy vị trí GPS. Đã đặt vị trí mặc định tại trung tâm TP.HCM.');
    }
  }, [showSuccess, showError]);

  useEffect(() => {
    detectLocation(true);
  }, []);

  const loadClinics = async () => {
    setLoading(true);
    try {
      const data = await api.getClinics(searchTerm);
      setClinics(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading clinics:', e);
      setClinics([]);
      showError('Lỗi tải danh sách phòng khám');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClinics();
  }, [searchTerm]);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; 
  };

  const safeClinics = Array.isArray(clinics) ? clinics : [];

  const processedClinics = safeClinics
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

  // Automatically select the nearest clinic whenever user location or clinic list updates
  useEffect(() => {
    if (processedClinics.length > 0) {
      if (!selectedClinic || !processedClinics.some(c => c.id === selectedClinic.id)) {
        const closest = processedClinics[0];
        setSelectedClinic(closest);
        // Only update mapTarget to closest clinic if userLocation is null initially
        if (!userLocation) {
          setMapTarget({ lat: closest.lat, lng: closest.lng, zoom: 15 });
        }
      }
    }
  }, [userLocation, emergencyOnly, clinics]);

  const handleSelectClinic = (clinic: VetClinic) => {
    setSelectedClinic(clinic);
    setMapTarget({ lat: clinic.lat, lng: clinic.lng, zoom: 16 });
  };

  const handleRecenterUserLocation = () => {
    if (userLocation) {
      setMapTarget({ lat: userLocation.lat, lng: userLocation.lng, zoom: 16 });
      showSuccess('Đã chuyển góc nhìn bản đồ về vị trí của bạn!');
    } else {
      detectLocation(false);
    }
  };

  const getGoogleMapsDirectionsUrl = (clinic: VetClinic) => {
    if (userLocation) {
      return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${clinic.lat},${clinic.lng}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Tìm Bệnh Viện & Phòng Khám Thú Y Gần Nhất</h2>
            <p className="text-xs text-slate-500">
              Tự động định vị vị trí thực tế của bạn, tính khoảng cách, dịch vụ cấp cứu 24/7 và chỉ đường bản đồ.
            </p>
          </div>
        </div>

        {/* Emergency Toggle */}
        <button
          onClick={() => setEmergencyOnly(!emergencyOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            emergencyOnly
              ? 'bg-red-600 text-white shadow-md ring-2 ring-red-300'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          {emergencyOnly ? 'Đang lọc: Trực Cấp Cứu 24/7' : 'Chỉ hiện phòng khám 24/7'}
        </button>
      </div>

      {/* Location Status Bar */}
      <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
            {locationLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : locationSource === 'gps' ? (
              <LocateFixed className="w-4 h-4 text-emerald-300" />
            ) : (
              <Compass className="w-4 h-4 text-amber-300" />
            )}
          </div>
          <div>
            <span className="font-bold text-slate-800 block">
              Trạng thái định vị: {' '}
              {locationLoading ? (
                <span className="text-purple-700 animate-pulse">Đang định vị vị trí của bạn...</span>
              ) : userLocation ? (
                <span className="text-emerald-700 font-extrabold">
                  {locationSource === 'gps' ? '📍 GPS Độ Chính Xác Cao' : '🌐 Ước Tính Theo Địa Chỉ IP'}
                </span>
              ) : (
                <span className="text-slate-500">Chưa định vị</span>
              )}
            </span>
            {userLocation && (
              <span className="text-[11px] text-slate-500">
                Tọa độ hiện tại: [{userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}] • Đã cập nhật khoảng cách phòng khám
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {userLocation && (
            <button
              onClick={handleRecenterUserLocation}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 font-bold shadow-xs transition-all text-xs"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              Định vị lại bản đồ
            </button>
          )}

          <button
            onClick={() => detectLocation(false)}
            disabled={locationLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-purple-200 text-purple-700 hover:bg-purple-100/50 font-bold shadow-xs whitespace-nowrap disabled:opacity-50 transition-all text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} />
            {locationLoading ? 'Đang định vị...' : 'Cập nhật GPS'}
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm phòng khám theo tên, địa chỉ, quận huyện..."
          className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
        />
      </div>

      {/* Content Layout: Map Embed + Clinic Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Clinic Cards List */}
        <div className="lg:col-span-5 space-y-3 lg:max-h-[620px] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-xs">Đang tải danh sách phòng khám...</div>
          ) : processedClinics.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">Không tìm thấy phòng khám phù hợp.</p>
            </div>
          ) : (
            processedClinics.map((clinic, index) => {
              const isSelected = selectedClinic?.id === clinic.id;
              const isClosest = index === 0 && clinic.distanceKm !== undefined;
              return (
                <div
                  key={clinic.id}
                  onClick={() => handleSelectClinic(clinic)}
                  className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'border-purple-600 ring-2 ring-purple-500/20 bg-purple-50/30 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">{clinic.name}</h3>
                        {isClosest && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ⚡ Gần bạn nhất
                          </span>
                        )}
                      </div>
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
                          <Navigation className="w-3 h-3 text-purple-600" />
                          {clinic.distanceKm.toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{clinic.rating}</span>
                      <span className="text-slate-400 font-normal">({clinic.reviewsCount})</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={getGoogleMapsDirectionsUrl(clinic)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        title="Mở Google Maps chỉ đường"
                      >
                        <Navigation className="w-3 h-3 text-purple-600" /> Chỉ đường
                      </a>
                      <a
                        href={`tel:${clinic.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <Phone className="w-3 h-3" /> Gọi
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Map & Selected Clinic Details */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4 flex flex-col">
          {/* Leaflet Map Frame */}
          <div className="relative w-full h-[260px] sm:h-[350px] lg:h-[450px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner z-0">
            <MapContainer 
              center={[mapTarget.lat, mapTarget.lng]} 
              zoom={mapTarget.zoom} 
              scrollWheelZoom={true} 
              style={{ height: '100%', width: '100%', zIndex: 10 }}
            >
              <DynamicMapView center={{ lat: mapTarget.lat, lng: mapTarget.lng }} zoom={mapTarget.zoom} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Clinics Markers */}
              {processedClinics.map(clinic => (
                <Marker 
                  key={clinic.id} 
                  position={[clinic.lat, clinic.lng]}
                  eventHandlers={{ click: () => handleSelectClinic(clinic) }}
                >
                  <Popup>
                    <div className="font-sans space-y-1">
                      <strong className="block text-sm text-slate-800">{clinic.name}</strong>
                      <span className="text-xs text-slate-500 block">{clinic.address}</span>
                      {clinic.distanceKm !== undefined && (
                        <span className="text-xs font-bold text-purple-700 block">
                          Cách bạn: {clinic.distanceKm.toFixed(1)} km
                        </span>
                      )}
                      <a
                        href={`tel:${clinic.phone}`}
                        className="text-xs font-bold text-emerald-700 hover:underline block pt-1"
                      >
                        📞 {clinic.phone}
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* User Location Marker */}
              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                  <Popup>
                    <div className="font-sans text-center">
                      <strong className="text-red-600 block text-xs">🔴 Vị trí của bạn</strong>
                      <span className="text-[11px] text-slate-500 block">
                        [{userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}]
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold block pt-1">
                        {locationSource === 'gps' ? 'Định vị GPS' : 'Ước tính IP'}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>

            {/* Map Floating Control Buttons */}
            <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
              {userLocation && (
                <button
                  onClick={handleRecenterUserLocation}
                  className="bg-white text-slate-800 px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-all hover:scale-105"
                >
                  <LocateFixed className="w-4 h-4 text-red-600" />
                  Vị trí của tôi
                </button>
              )}
            </div>
          </div>

          {/* Clinic Detail Panel */}
          {selectedClinic ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    {selectedClinic.name}
                    {selectedClinic.distanceKm !== undefined && (
                      <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        {selectedClinic.distanceKm.toFixed(1)} km
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedClinic.address}</p>
                </div>

                <a
                  href={getGoogleMapsDirectionsUrl(selectedClinic)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all whitespace-nowrap self-start sm:self-auto"
                >
                  <Navigation className="w-4 h-4" />
                  Dẫn Đường Google Maps
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
          ) : (
            <div className="flex-1 flex items-center justify-center py-6 text-slate-400 text-xs">
              Chọn một phòng khám bên trái để xem chi tiết và dịch vụ.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
