import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MapPin,
  Phone,
  Star,
  Clock,
  AlertCircle,
  Search,
  Navigation,
  LocateFixed,
  RefreshCw,
  Compass,
  Copy,
  Check,
  Filter,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Sparkles,
  Building2
} from 'lucide-react';
import { VetClinic } from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { trackEvent } from '../../utils/analytics';

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

// ─────────────────────────────────────────────────────────────
// 🕒 HELPER: PARSE & EVALUATE CLINIC OPEN/CLOSED STATUS
// ─────────────────────────────────────────────────────────────
export interface ClinicOpenStatus {
  isOpen: boolean;
  statusLabel: string; // 'Mở cửa 24/7' | 'Đang mở cửa' | 'Đã đóng cửa'
  badgeVariant: 'open247' | 'open' | 'closed';
  hoursDisplay: string; // '07:00 - 20:00' or 'Mở cửa 24/7'
  subText?: string; // 'Đóng lúc 20:00' | 'Mở lúc 07:00'
}

export function getClinicOpenStatus(openingHours?: string, isEmergency247?: boolean): ClinicOpenStatus {
  const text = (openingHours || '').trim();

  // 1. Trường hợp cấp cứu 24/7 hoặc mở liên tục
  if (isEmergency247 || /24\/7|24h|cả ngày|suốt ngày/i.test(text)) {
    return {
      isOpen: true,
      statusLabel: 'Mở cửa 24/7',
      badgeVariant: 'open247',
      hoursDisplay: text || 'Phục vụ 24/7 (Có trực đêm)',
      subText: 'Trực cấp cứu 24/7'
    };
  }

  // 2. Parse thời gian dạng: HH:mm - HH:mm hoặc H:mm-H:mm hoặc Hh-Hh
  const match = text.match(/(\d{1,2})[:h](\d{0,2})\s*[-–—đếnto]\s*(\d{1,2})[:h](\d{0,2})/i);
  if (match) {
    const oH = parseInt(match[1], 10);
    const oM = match[2] ? parseInt(match[2], 10) : 0;
    const cH = parseInt(match[3], 10);
    const cM = match[4] ? parseInt(match[4], 10) : 0;

    const now = new Date();
    // Giờ địa phương Việt Nam (GMT+7)
    const localNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const currentMinutes = localNow.getHours() * 60 + localNow.getMinutes();
    const openMinutes = oH * 60 + oM;
    const closeMinutes = cH * 60 + cM;

    let isOpen = false;
    if (closeMinutes <= openMinutes) {
      // Ca làm việc qua đêm
      isOpen = currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    } else {
      isOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    }

    const fmt = (h: number, m: number) => String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    const formattedRange = `${fmt(oH, oM)} - ${fmt(cH, cM)}`;

    return {
      isOpen,
      statusLabel: isOpen ? 'Đang mở cửa' : 'Đã đóng cửa',
      badgeVariant: isOpen ? 'open' : 'closed',
      hoursDisplay: formattedRange,
      subText: isOpen ? `Đóng lúc ${fmt(cH, cM)}` : `Mở lúc ${fmt(oH, oM)}`
    };
  }

  // 3. Dự phòng chung
  return {
    isOpen: true,
    statusLabel: 'Đang mở cửa',
    badgeVariant: 'open',
    hoursDisplay: text || 'Giờ hành chính',
    subText: undefined
  };
}

export const NearestClinicsView: React.FC = () => {
  const [clinics, setClinics] = useState<VetClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'emergency'>('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  
  // Copy Phone State
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  const [selectedClinic, setSelectedClinic] = useState<(VetClinic & { openStatus: ClinicOpenStatus; distanceKm?: number }) | null>(null);
  
  // Location States
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationSource, setLocationSource] = useState<'gps' | 'ip' | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Map Target State for smooth panning/zooming
  const [mapTarget, setMapTarget] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: 10.024735,
    lng: 105.768515,
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
      if (err?.code !== 1) {
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

    // Attempt 3: Default fallback (Cần Thơ / TP.HCM center)
    setLocationLoading(false);
    const defaultLoc = { lat: 10.0302, lng: 105.7725 };
    setUserLocation(defaultLoc);
    setLocationSource('ip');
    setMapTarget({ lat: defaultLoc.lat, lng: defaultLoc.lng, zoom: 13 });
    if (!isAuto) {
      showError('Không thể lấy vị trí GPS. Đã đặt vị trí mặc định tại trung tâm.');
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

  const safeClinics = useMemo(() => (Array.isArray(clinics) ? clinics : []), [clinics]);

  // Trích xuất tất cả các chuyên khoa / dịch vụ từ dữ liệu phòng khám
  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    safeClinics.forEach((c) => {
      if (Array.isArray(c.services)) {
        c.services.forEach((s) => {
          const trimmed = (s || '').trim();
          if (trimmed && trimmed.length > 1) {
            set.add(trimmed);
          }
        });
      }
    });
    return Array.from(set);
  }, [safeClinics]);

  // Sao chép số điện thoại với phản hồi trực quan
  const handleCopyPhone = (e: React.MouseEvent, phone: string, clinicId: string) => {
    e.stopPropagation();
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(clinicId);
    showSuccess(`Đã sao chép số điện thoại: ${phone}`);
    setTimeout(() => {
      setCopiedPhoneId((prev) => (prev === clinicId ? null : prev));
    }, 2200);
  };

  // ─────────────────────────────────────────────────────────────
  // ⚙️ XỬ LÝ LỌC & SẮP XẾP (ĐÓNG CỬA XẾP Ở CUỐI)
  // ─────────────────────────────────────────────────────────────
  const processedClinics = useMemo(() => {
    return safeClinics
      .map((c) => {
        const openStatus = getClinicOpenStatus(c.openingHours, c.isEmergency247);
        const distanceKm = userLocation ? getDistance(userLocation.lat, userLocation.lng, c.lat, c.lng) : undefined;
        return {
          ...c,
          openStatus,
          distanceKm
        };
      })
      .filter((c) => {
        // 1. Lọc theo trạng thái mở / cấp cứu
        if (statusFilter === 'emergency' && !c.isEmergency247) return false;
        if (statusFilter === 'open' && !c.openStatus.isOpen) return false;

        // 2. Lọc theo chuyên khoa
        if (selectedSpecialty !== 'all') {
          const hasService = Array.isArray(c.services) && c.services.some(
            (s) => (s || '').toLowerCase() === selectedSpecialty.toLowerCase()
          );
          if (!hasService) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // 🚨 QUY TẮC BẮT BUỘC: PHÒNG ĐÃ ĐÓNG CỬA XẾP Ở CUỐI CÙNG
        if (a.openStatus.isOpen !== b.openStatus.isOpen) {
          return a.openStatus.isOpen ? -1 : 1;
        }

        // Nếu cùng mở hoặc cùng đóng: Sắp xếp theo khoảng cách gần nhất
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        if (a.distanceKm !== undefined) return -1;
        if (b.distanceKm !== undefined) return 1;

        // Phụ: Theo đánh giá sao cao hơn
        return (b.rating || 0) - (a.rating || 0);
      });
  }, [safeClinics, userLocation, statusFilter, selectedSpecialty]);

  // Thống kê nhanh số phòng mở / đóng
  const stats = useMemo(() => {
    let openCount = 0;
    let emergencyCount = 0;
    safeClinics.forEach((c) => {
      const st = getClinicOpenStatus(c.openingHours, c.isEmergency247);
      if (st.isOpen) openCount++;
      if (c.isEmergency247) emergencyCount++;
    });
    return {
      total: safeClinics.length,
      open: openCount,
      closed: safeClinics.length - openCount,
      emergency: emergencyCount
    };
  }, [safeClinics]);

  // Tự động chọn phòng khám phù hợp nhất đầu danh sách khi load
  useEffect(() => {
    if (processedClinics.length > 0) {
      if (!selectedClinic || !processedClinics.some((c) => c.id === selectedClinic.id)) {
        const closest = processedClinics[0];
        setSelectedClinic(closest);
        if (!userLocation) {
          setMapTarget({ lat: closest.lat, lng: closest.lng, zoom: 15 });
        }
      }
    }
  }, [processedClinics, userLocation]);

  const handleSelectClinic = (clinic: typeof processedClinics[0]) => {
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

  // Xác định vị trí phân cách phòng mở và phòng đóng trong danh sách
  const firstClosedIndex = processedClinics.findIndex((c) => !c.openStatus.isOpen);

  return (
    <div className="space-y-5">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & THỐNG KÊ TỔNG QUAN
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Bệnh Viện & Phòng Khám Thú Y Gần Bạn
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Định vị GPS chính xác, kiểm tra trạng thái mở/đóng cửa thời gian thực và sao chép số điện thoại khẩn cấp.
            </p>
          </div>
        </div>

        {/* Quick status counter badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold border border-slate-200">
            Tổng: {stats.total} phòng khám
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Đang mở: {stats.open}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold border border-rose-200 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Cấp cứu 24/7: {stats.emergency}
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. LOCATION STATUS BAR
      ───────────────────────────────────────────────────────────── */}
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
              Trạng thái định vị:{' '}
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
                Tọa độ hiện tại: [{userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}] • Tự động tính khoảng cách và ưu tiên phòng gần nhất
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {userLocation && (
            <button
              onClick={handleRecenterUserLocation}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 font-bold shadow-xs transition-all text-xs cursor-pointer"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              Định vị lại bản đồ
            </button>
          )}

          <button
            onClick={() => detectLocation(false)}
            disabled={locationLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-purple-200 text-purple-700 hover:bg-purple-100/50 font-bold shadow-xs whitespace-nowrap disabled:opacity-50 transition-all text-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} />
            {locationLoading ? 'Đang định vị...' : 'Cập nhật GPS'}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. BỘ LỌC ĐA NĂNG: TÌM KIẾM, KHẨN CẤP, MỞ CỬA & CHUYÊN KHOA
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Ô Tìm kiếm */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên phòng khám, địa chỉ, SĐT..."
              className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Status Filter Tabs: Tất cả, Đang mở cửa, Cấp cứu 24/7 */}
          <div className="md:col-span-4 flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center ${
                statusFilter === 'all'
                  ? 'bg-white text-purple-800 shadow-xs border border-purple-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                statusFilter === 'open'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Đang mở ({stats.open})
            </button>
            <button
              onClick={() => setStatusFilter('emergency')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1 ${
                statusFilter === 'emergency'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              24/7 Cấp cứu
            </button>
          </div>

          {/* Bộ lọc Chuyên khoa / Dịch vụ */}
          <div className="md:col-span-3 flex items-center gap-2">
            <div className="relative w-full">
              <Stethoscope className="w-4 h-4 text-purple-600 absolute left-3 top-3 pointer-events-none" />
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full text-xs font-semibold pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs appearance-none cursor-pointer"
              >
                <option value="all">🩺 Chuyên khoa: Tất cả ({allSpecialties.length})</option>
                {allSpecialties.map((spec, i) => (
                  <option key={i} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3 text-slate-400 pointer-events-none text-xs">▼</div>
            </div>
          </div>
        </div>

        {/* Specialty Filter Pills (Quick click) */}
        {allSpecialties.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs no-scrollbar">
            <span className="text-[11px] text-slate-400 font-semibold shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Chuyên môn:
            </span>
            <button
              onClick={() => setSelectedSpecialty('all')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all text-[11px] ${
                selectedSpecialty === 'all'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            {allSpecialties.map((spec, idx) => {
              const active = selectedSpecialty.toLowerCase() === spec.toLowerCase();
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedSpecialty(active ? 'all' : spec)}
                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all text-[11px] border ${
                    active
                      ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {spec}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. LAYOUT CHÍNH: DANH SÁCH THẺ PHÒNG KHÁM & BẢN ĐỒ MAP
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột trái: Danh sách thẻ phòng khám (Phòng đóng cửa xếp ở cuối) */}
        <div className="lg:col-span-5 space-y-3 lg:max-h-[640px] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
              <RefreshCw className="w-6 h-6 text-purple-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Đang tìm phòng khám gần bạn...</p>
            </div>
          ) : processedClinics.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-1" />
              <p className="text-sm font-bold text-slate-800">Không tìm thấy phòng khám phù hợp.</p>
              <p className="text-xs text-slate-500">
                Thử thay đổi từ khóa tìm kiếm hoặc bấm &ldquo;Tất cả&rdquo; trên thanh bộ lọc.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSelectedSpecialty('all');
                }}
                className="mt-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 transition-colors"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            processedClinics.map((clinic, index) => {
              const isSelected = selectedClinic?.id === clinic.id;
              const isClosest = index === 0 && clinic.distanceKm !== undefined && clinic.openStatus.isOpen;
              const isClosed = !clinic.openStatus.isOpen;
              const showClosedDivider = isClosed && index === firstClosedIndex && firstClosedIndex > 0;

              return (
                <React.Fragment key={clinic.id}>
                  {/* Thanh phân cách trực quan khi bắt đầu danh sách phòng đã đóng cửa */}
                  {showClosedDivider && (
                    <div className="py-2 flex items-center gap-2 text-xs text-slate-500 my-1">
                      <div className="h-px bg-slate-200 flex-1" />
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 text-[11px] border border-slate-200">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Đã đóng cửa hôm nay (Xếp ở cuối)
                      </span>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>
                  )}

                  <div
                    onClick={() => handleSelectClinic(clinic)}
                    className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'border-purple-600 ring-2 ring-purple-500/20 bg-purple-50/20 shadow-md'
                        : isClosed
                        ? 'border-slate-200/80 bg-slate-50/50 hover:border-slate-300 opacity-90 hover:opacity-100'
                        : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
                    }`}
                  >
                    {/* Header Thẻ: Tên, Khoảng cách & Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                            {clinic.name}
                          </h3>
                          {isClosest && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                              ⚡ Gần bạn nhất
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {clinic.address}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {clinic.distanceKm !== undefined && (
                          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 whitespace-nowrap flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-purple-600" />
                            {clinic.distanceKm.toFixed(1)} km
                          </span>
                        )}
                        {clinic.isEmergency247 && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200 whitespace-nowrap flex items-center gap-0.5">
                            <AlertCircle className="w-2.5 h-2.5" /> 24/7 CẤP CỨU
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dòng 2: Trạng thái Mở/Đóng cửa & Giờ hoạt động */}
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {clinic.openStatus.badgeVariant === 'open247' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Mở cửa 24/7
                          </span>
                        ) : clinic.openStatus.isOpen ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đang mở cửa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-500" />
                            Đã đóng cửa
                          </span>
                        )}

                        <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {clinic.openStatus.hoursDisplay}
                        </span>

                        {clinic.openStatus.subText && (
                          <span
                            className={`text-[10px] font-bold ${
                              clinic.openStatus.isOpen ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            ({clinic.openStatus.subText})
                          </span>
                        )}
                      </div>

                      {/* Đánh giá sao */}
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{clinic.rating}</span>
                        <span className="text-slate-400 font-normal text-[11px]">({clinic.reviewsCount})</span>
                      </div>
                    </div>

                    {/* Dòng 3: Chuyên khoa / Dịch vụ cung cấp */}
                    {clinic.services && clinic.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {clinic.services.slice(0, 3).map((srv, idx) => (
                          <span
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSpecialty(srv);
                            }}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 hover:bg-purple-100 hover:text-purple-800 transition-colors cursor-pointer"
                            title={`Lọc theo chuyên khoa ${srv}`}
                          >
                            ✓ {srv}
                          </span>
                        ))}
                        {clinic.services.length > 3 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/50">
                            +{clinic.services.length - 3} dịch vụ
                          </span>
                        )}
                      </div>
                    )}

                    {/* Dòng 4: SỐ ĐIỆN THOẠI KÈM NÚT COPY & NÚT GỌI / CHỈ ĐƯỜNG */}
                    <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100 gap-2 flex-wrap">
                      {/* Box Số điện thoại & Nút Copy */}
                      <div
                        onClick={(e) => handleCopyPhone(e, clinic.phone, clinic.id)}
                        className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/90 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer group"
                        title="Bấm để sao chép số điện thoại"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-800 tracking-tight text-xs">
                          {clinic.phone || 'Chưa có SĐT'}
                        </span>
                        {clinic.phone && (
                          <button
                            type="button"
                            className="p-1 hover:bg-white rounded-md text-slate-400 group-hover:text-purple-700 transition-all ml-0.5"
                          >
                            {copiedPhoneId === clinic.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-purple-700" />
                            )}
                          </button>
                        )}
                        {copiedPhoneId === clinic.id && (
                          <span className="text-[10px] font-black text-emerald-600 animate-pulse">
                            Đã chép!
                          </span>
                        )}
                      </div>

                      {/* Các nút hành động: Gọi & Chỉ đường */}
                      <div className="flex items-center gap-1.5">
                        <a
                          href={getGoogleMapsDirectionsUrl(clinic)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            trackEvent('CLINIC_DIRECTIONS_CLICK', { clinicName: clinic.name, address: clinic.address });
                          }}
                          className="flex items-center gap-1 font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 transition-all text-xs cursor-pointer"
                          title="Mở Google Maps chỉ đường"
                        >
                          <Navigation className="w-3 h-3 text-purple-600" /> Chỉ đường
                        </a>
                        {clinic.phone && (
                          <a
                            href={`tel:${clinic.phone}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              trackEvent('CLINIC_CALL_CLICK', { clinicName: clinic.name, phone: clinic.phone });
                            }}
                            className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-all text-xs cursor-pointer"
                            title="Bấm gọi ngay cho phòng khám"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" /> Gọi
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Cột phải: Bản đồ Leaflet & Panel Chi tiết */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-4 flex flex-col">
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
              
              {/* Markers phòng khám */}
              {processedClinics.map((clinic) => (
                <Marker 
                  key={clinic.id} 
                  position={[clinic.lat, clinic.lng]}
                  eventHandlers={{ click: () => handleSelectClinic(clinic) }}
                >
                  <Popup>
                    <div className="font-sans space-y-1.5 p-0.5">
                      <strong className="block text-sm text-slate-900 leading-tight">{clinic.name}</strong>
                      <span className="text-xs text-slate-500 block leading-snug">{clinic.address}</span>
                      
                      <div className="flex items-center gap-2 text-xs pt-1">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            clinic.openStatus.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {clinic.openStatus.statusLabel}
                        </span>
                        <span className="text-slate-500 text-[11px]">{clinic.openStatus.hoursDisplay}</span>
                      </div>

                      {clinic.distanceKm !== undefined && (
                        <span className="text-xs font-bold text-purple-700 block">
                          Cách bạn: {clinic.distanceKm.toFixed(1)} km
                        </span>
                      )}

                      <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100">
                        <a
                          href={`tel:${clinic.phone}`}
                          className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          📞 {clinic.phone}
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Marker vị trí người dùng */}
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
                  className="bg-white text-slate-800 px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-all hover:scale-105 cursor-pointer"
                >
                  <LocateFixed className="w-4 h-4 text-red-600" />
                  Vị trí của tôi
                </button>
              )}
            </div>
          </div>

          {/* Panel chi tiết phòng khám được chọn */}
          {selectedClinic ? (
            <div className="space-y-3.5 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                    {selectedClinic.name}
                    {selectedClinic.distanceKm !== undefined && (
                      <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        {selectedClinic.distanceKm.toFixed(1)} km
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        selectedClinic.openStatus.isOpen
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {selectedClinic.openStatus.statusLabel}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedClinic.address}</p>
                </div>

                <a
                  href={getGoogleMapsDirectionsUrl(selectedClinic)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('CLINIC_DIRECTIONS_CLICK', { clinicName: selectedClinic.name, address: selectedClinic.address })}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all whitespace-nowrap self-start sm:self-auto cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  Dẫn Đường Google Maps
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* Số điện thoại + Nút Copy trong Detail Panel */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/90 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-700 block text-[11px]">📞 Số điện thoại liên hệ:</span>
                    <a
                      href={`tel:${selectedClinic.phone}`}
                      onClick={() => trackEvent('CLINIC_CALL_CLICK', { clinicName: selectedClinic.name, phone: selectedClinic.phone })}
                      className="text-emerald-700 font-bold hover:underline text-sm block mt-0.5"
                    >
                      {selectedClinic.phone || 'Chưa cập nhật'}
                    </a>
                  </div>
                  {selectedClinic.phone && (
                    <button
                      onClick={(e) => handleCopyPhone(e, selectedClinic.phone, selectedClinic.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 font-bold text-xs transition-all cursor-pointer"
                      title="Sao chép số điện thoại"
                    >
                      {copiedPhoneId === selectedClinic.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Giờ mở cửa */}
                <div className="p-3 bg-white rounded-xl border border-slate-200/90">
                  <span className="font-bold text-slate-700 block text-[11px]">⏰ Giờ hoạt động:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-slate-800 font-bold">{selectedClinic.openStatus.hoursDisplay}</span>
                    {selectedClinic.openStatus.subText && (
                      <span className={`text-[11px] font-semibold ${selectedClinic.openStatus.isOpen ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ({selectedClinic.openStatus.subText})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dịch vụ cung cấp */}
              <div className="pt-2 border-t border-slate-200/70">
                <span className="text-xs font-bold text-slate-800 block mb-1.5">🏥 Dịch vụ chuyên môn cung cấp:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedClinic.services || []).map((srv, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 font-semibold border border-purple-200/60"
                    >
                      ✓ {srv}
                    </span>
                  ))}
                  {(!selectedClinic.services || selectedClinic.services.length === 0) && (
                    <span className="text-xs text-slate-400">Khám tổng quát, tiêm phòng định kỳ</span>
                  )}
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
