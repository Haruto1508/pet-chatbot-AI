import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Lỗi: Cần thiết lập biến môi trường SUPABASE_URL và SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

const OVERPASS_QUERY = `
[out:json][timeout:25];
(
  node["amenity"="veterinary"](10.372,106.356,11.160,107.026);
);
out body;
>;
out skel qt;
`;

async function fetchClinics() {
  console.log('Đang lấy dữ liệu từ Overpass API...');
  const response = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'PetCareAI/1.0 (seed script)'
    },
    body: 'data=' + encodeURIComponent(OVERPASS_QUERY),
  });

  if (!response.ok) {
    throw new Error('Overpass API error: ' + response.statusText);
  }

  const data = await response.json();
  const elements = data.elements || [];
  console.log('Tìm thấy ' + elements.length + ' phòng khám thô.');

  const formattedClinics = elements.map((el: any) => {
    const tags = el.tags || {};
    const name = tags.name || tags['name:vi'] || tags['name:en'] || 'Phòng Khám Thú Y';
    
    let address = 'TP. Hồ Chí Minh';
    const addrParts = [];
    if (tags['addr:housenumber']) addrParts.push(tags['addr:housenumber']);
    if (tags['addr:street']) addrParts.push(tags['addr:street']);
    if (tags['addr:city'] || tags['addr:district']) addrParts.push(tags['addr:city'] || tags['addr:district']);
    
    if (addrParts.length > 0) {
      address = addrParts.join(', ');
    } else if (tags['addr:full']) {
      address = tags['addr:full'];
    }

    const rating = (Math.random() * (5.0 - 4.2) + 4.2).toFixed(1);
    const isEmergency247 = Math.random() > 0.8;

    return {
      name,
      address,
      phone: tags.phone || '0909 123 456',
      lat: el.lat,
      lng: el.lon,
      rating: Number(rating),
      is_emergency_247: isEmergency247,
      opening_hours: tags.opening_hours || (isEmergency247 ? 'Mở cửa 24/7' : '08:00 - 20:00'),
      services: ['Khám tổng quát', 'Tiêm phòng', 'Siêu âm', 'Phẫu thuật'],
      image_url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=500'
    };
  });

  const validClinics = formattedClinics.filter((c: any) => c.name !== 'Phòng Khám Thú Y' || c.address !== 'TP. Hồ Chí Minh');
  console.log('Đã chuẩn hóa ' + validClinics.length + ' phòng khám.');
  return validClinics;
}

async function seed() {
  try {
    const clinics = await fetchClinics();
    if (clinics.length === 0) return;
    console.log('Đang lưu ' + clinics.length + ' phòng khám vào Supabase...');
    const { error } = await supabase.from('vet_clinics').insert(clinics);
    if (error) {
      console.error('Lỗi khi lưu:', error.message);
    } else {
      console.log('Import thành công!');
    }
  } catch (err) {
    console.error('Lỗi script:', err);
  }
}

seed();
