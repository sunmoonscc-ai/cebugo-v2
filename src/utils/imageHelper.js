import defaultCafeImg from '../assets/default_cafe.png';

const FALLBACK_DEFAULT_IMAGE = defaultCafeImg || '/default_cafe.png';

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
 * Safely optimize place payload before saving to Firestore to guarantee
 * total document size stays safely under Firestore's 1MB document limit
 */
export async function sanitizePlaceForFirestore(placeData) {
  if (!placeData || typeof placeData !== 'object') return placeData;

  const copy = JSON.parse(JSON.stringify(placeData));

  if (copy.images && typeof copy.images === 'object') {
    const categories = ['cover', 'facility', 'product', 'menu'];
    for (const cat of categories) {
      if (Array.isArray(copy.images[cat])) {
        const compressedList = [];
        for (const imgUrl of copy.images[cat]) {
          if (typeof imgUrl === 'string' && imgUrl.startsWith('data:image')) {
            const compressed = await compressImageDataUrl(imgUrl, 1000, 0.8);
            compressedList.push(compressed);
          } else {
            compressedList.push(imgUrl);
          }
        }
        copy.images[cat] = compressedList;
      }
    }
  }

  return copy;
}

// Cumulative point threshold table for Lv.1 ~ Lv.20
export const LEVEL_TABLE = [
  { level: 1, reqPt: 0, totalPt: 0 },
  { level: 2, reqPt: 100, totalPt: 100 },
  { level: 3, reqPt: 300, totalPt: 400 },
  { level: 4, reqPt: 500, totalPt: 900 },
  { level: 5, reqPt: 700, totalPt: 1600 },
  { level: 6, reqPt: 900, totalPt: 2500 },
  { level: 7, reqPt: 1100, totalPt: 3600 },
  { level: 8, reqPt: 1300, totalPt: 4900 },
  { level: 9, reqPt: 1500, totalPt: 6400 },
  { level: 10, reqPt: 1700, totalPt: 8100 },
  { level: 11, reqPt: 1900, totalPt: 10000 },
  { level: 12, reqPt: 2100, totalPt: 12100 },
  { level: 13, reqPt: 2300, totalPt: 14400 },
  { level: 14, reqPt: 2500, totalPt: 16900 },
  { level: 15, reqPt: 2700, totalPt: 19600 },
  { level: 16, reqPt: 2900, totalPt: 22500 },
  { level: 17, reqPt: 3100, totalPt: 25600 },
  { level: 18, reqPt: 3300, totalPt: 28900 },
  { level: 19, reqPt: 3500, totalPt: 32400 },
  { level: 20, reqPt: 3700, totalPt: 36100 }
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

export function getLevelTitle(level = 1) {
  if (level >= 20) return '세부 마스터 (Lv20)';
  if (level >= 17) return '전설의 여행가 (Lv17)';
  if (level >= 14) return '다이아몬드 가이드 (Lv14)';
  if (level >= 10) return '골드 탐험가 (Lv10)';
  if (level >= 7) return '실버 베테랑 (Lv7)';
  if (level >= 4) return '마켓 멤버 (Lv4)';
  if (level >= 3) return '리더 멤버 (Lv3)';
  if (level >= 2) return '새싹 회원 (Lv2)';
  return '방문자 (손님)';
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
