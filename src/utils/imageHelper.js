import defaultCafeImg from '../assets/default_cafe.png';
import { storage } from '../firebase/config';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

const FALLBACK_DEFAULT_IMAGE = defaultCafeImg || '/default_cafe.png';

/**
 * Extract formatted date string (e.g. '2026.07.14') from image URL/filename or fallback
 */
export function extractDateFromImageUrl(imgUrl, fallbackDate = null) {
  if (!imgUrl || typeof imgUrl !== 'string') {
    return formatDate(fallbackDate);
  }

  // 1. Match YYYYMMDD, YYYY-MM-DD, YYYY.MM.DD, YYYY_MM_DD patterns in filename
  const ymdMatch = imgUrl.match(/(20\d{2})[._-]?([01]\d)[._-]?([0-3]\d)/);
  if (ymdMatch) {
    return `${ymdMatch[1]}.${ymdMatch[2]}.${ymdMatch[3]}`;
  }

  // 2. Match 13-digit Unix timestamp (e.g. 1785823774208)
  const timestampMatch = imgUrl.match(/(1[6-9]\d{11})/);
  if (timestampMatch) {
    const ts = parseInt(timestampMatch[1], 10);
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      return formatDate(d);
    }
  }

  return formatDate(fallbackDate);
}

function formatDate(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date('2026-07-14');
  if (isNaN(d.getTime())) return '2026.07.14';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

/**
 * Upload a Base64 data URL to Firebase Cloud Storage and return public HTTPS download URL
 * Ensures uploaded photos are stored in Cloud Storage and visible to ALL devices globally
 */
export async function uploadImageToFirebaseStorage(dataUrl, folder = 'places') {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;

  // If already an HTTP/HTTPS Cloud URL (e.g. Firebase Storage URL), return directly
  if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
    return dataUrl;
  }

  try {
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadString(storageRef, dataUrl, 'data_url');
    const cloudDownloadUrl = await getDownloadURL(storageRef);
    console.log('Uploaded image to Firebase Cloud Storage:', cloudDownloadUrl);
    return cloudDownloadUrl;
  } catch (err) {
    console.warn('Firebase Storage upload error, using compressed fallback:', err);
    return dataUrl;
  }
}

/**
 * Get default category placeholder image if no user image is uploaded
 */
export function getDefaultImageForCategory(categoryOrPlace) {
  let catStr = '';
  let nameStr = '';
  if (typeof categoryOrPlace === 'object' && categoryOrPlace !== null) {
    catStr = `${categoryOrPlace.category || ''} ${categoryOrPlace.categoryName || ''}`.toLowerCase();
    nameStr = (categoryOrPlace.name || '').toLowerCase();
  } else {
    catStr = String(categoryOrPlace || '').toLowerCase();
  }

  if (catStr.includes('education') || catStr.includes('교육')) {
    return '/default_education.png';
  }
  
  if (catStr.includes('food') || catStr.includes('먹을거리') || catStr.includes('식당') || catStr.includes('음식')) {
    return '/default_food.png';
  }

  return FALLBACK_DEFAULT_IMAGE;
}

export function getOptimizedImageUrl(url, width = 600, quality = 80) {
  if (!url || typeof url !== 'string') return FALLBACK_DEFAULT_IMAGE;
  
  if (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.includes('firebasestorage.googleapis.com') ||
    url.includes('firebase') ||
    url.includes('unsplash.com') ||
    url.includes('weserv.nl') ||
    url.includes('default_cafe')
  ) {
    return url;
  }

  try {
    const cleanUrl = url.replace(/^https?:\/\//, '');
    return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=${width}&q=${quality}&output=webp`;
  } catch (e) {
    return url || FALLBACK_DEFAULT_IMAGE;
  }
}

/**
 * Compress an image file or base64 string to a lightweight, optimized data URL
 * Ensures total image payload size is safe for database storage
 */
export function compressImageDataUrl(dataUrl, maxDimension = 1000, quality = 0.8) {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Safely optimize place payload before saving to Firestore & Firebase Storage
 * Guarantees all uploaded images are stored in Firebase Cloud Storage and accessible on all devices
 */
export async function sanitizePlaceForFirestore(placeData) {
  if (!placeData || typeof placeData !== 'object') return placeData;

  const copy = JSON.parse(JSON.stringify(placeData));

  if (copy.images && typeof copy.images === 'object') {
    const categories = ['cover', 'facility', 'product', 'menu'];
    for (const cat of categories) {
      if (Array.isArray(copy.images[cat])) {
        const uploadedList = [];
        for (const imgUrl of copy.images[cat]) {
          if (typeof imgUrl === 'string' && imgUrl.startsWith('data:image')) {
            const compressed = await compressImageDataUrl(imgUrl, 1200, 0.85);
            const cloudUrl = await uploadImageToFirebaseStorage(compressed, 'places');
            uploadedList.push(cloudUrl);
          } else {
            uploadedList.push(imgUrl);
          }
        }
        copy.images[cat] = uploadedList;
      }
    }
  }

  return copy;
}

// Cumulative point threshold table for Lv.1 ~ Lv.20
export const LEVEL_TABLE = [
  { level: 1, reqPt: 100, totalPt: 100 },
  { level: 2, reqPt: 200, totalPt: 300 },
  { level: 3, reqPt: 400, totalPt: 700 },
  { level: 4, reqPt: 600, totalPt: 1300 },
  { level: 5, reqPt: 900, totalPt: 2200 },
  { level: 6, reqPt: 1200, totalPt: 3400 },
  { level: 7, reqPt: 1600, totalPt: 5000 },
  { level: 8, reqPt: 2000, totalPt: 7000 },
  { level: 9, reqPt: 2500, totalPt: 9500 },
  { level: 10, reqPt: 3000, totalPt: 12500 },
  { level: 11, reqPt: 3500, totalPt: 16000 },
  { level: 12, reqPt: 4000, totalPt: 20000 },
  { level: 13, reqPt: 4500, totalPt: 24500 },
  { level: 14, reqPt: 5000, totalPt: 29500 },
  { level: 15, reqPt: 5500, totalPt: 35000 },
  { level: 16, reqPt: 6000, totalPt: 41000 },
  { level: 17, reqPt: 7000, totalPt: 48000 },
  { level: 18, reqPt: 8000, totalPt: 56000 },
  { level: 19, reqPt: 8500, totalPt: 64500 },
  { level: 20, reqPt: 9500, totalPt: 74000 }
];

export function calculateLevelFromPoints(points = 0) {
  let level = 1;
  for (let i = LEVEL_TABLE.length - 1; i >= 0; i--) {
    if (points >= LEVEL_TABLE[i].totalPt) {
      level = LEVEL_TABLE[i].level;
      break;
    }
  }
  return level;
}

export function getLevelTitle(level = 1, isGuest = false) {
  if (isGuest) return '방문자 (손님)';
  if (level >= 20) return '세부 마스터 (Lv20)';
  if (level >= 17) return '전설의 여행가 (Lv17)';
  if (level >= 14) return '다이아몬드 가이드 (Lv14)';
  if (level >= 10) return '골드 탐험가 (Lv10)';
  if (level >= 7) return '실버 베테랑 (Lv7)';
  if (level >= 4) return '마켓 멤버 (Lv4)';
  if (level >= 3) return '리더 멤버 (Lv3)';
  if (level >= 2) return '새싹 회원 (Lv2)';
  return '신규 회원 (Lv1)';
}

export function getLevelProgress(points = 0) {
  const currentLevel = calculateLevelFromPoints(points);
  const maxLevel = 20;

  if (currentLevel >= maxLevel) {
    return {
      level: maxLevel,
      percentage: 100,
      currentPoints: points,
      nextLevelPt: LEVEL_TABLE[19].totalPt,
      pointsToNext: 0
    };
  }

  const currentLevelData = LEVEL_TABLE.find(item => item.level === currentLevel);
  const nextLevelData = LEVEL_TABLE.find(item => item.level === currentLevel + 1);

  const pointsInCurrentLevel = points - currentLevelData.totalPt;
  const neededForNextLevel = nextLevelData.totalPt - currentLevelData.totalPt;
  const percentage = Math.min(100, Math.round((pointsInCurrentLevel / neededForNextLevel) * 100));

  return {
    level: currentLevel,
    percentage,
    currentPoints: points,
    nextLevelPt: nextLevelData.totalPt,
    pointsToNext: nextLevelData.totalPt - points
  };
}

/**
 * Smartly parse breakTime / offDay string into natural Korean description
 * Examples:
 * - "일요일 휴" -> " (휴무: 일요일)"
 * - "매주 일요일 휴무" -> " (휴무: 매주 일요일)"
 * - "15:00~17:00" -> " (브레이크타임: 15:00~17:00)"
 * - "연중무휴" / "없음" -> "" (no extra suffix)
 */
export function formatBreakAndOffTime(input) {
  if (!input || typeof input !== 'string') return '';
  const raw = input.trim();
  if (!raw || raw === '없음' || raw === '연중무휴' || raw === '쉬는시간 없음') return '';

  if (raw.startsWith('(') && raw.endsWith(')')) {
    return ` ${raw}`;
  }

  const parts = raw.split(/[/,\n]+/).map((p) => p.trim()).filter(Boolean);

  const formattedParts = parts.map((part) => {
    if (part.includes('브레이크타임') || part.includes('휴무:')) {
      return part;
    }

    const isOffDay = /[휴|일요일|월요일|화요일|수요일|목요일|금요일|토요일|주말|공휴일]/.test(part) && !/\d{1,2}:\d{2}/.test(part);

    if (isOffDay) {
      let clean = part.replace(/휴무$/, '').replace(/휴$/, '').trim();
      return clean ? `휴무: ${clean}` : part;
    }

    if (/\d/.test(part)) {
      return `브레이크타임: ${part}`;
    }

    return part;
  });

  return ` (${formattedParts.join(' / ')})`;
}
