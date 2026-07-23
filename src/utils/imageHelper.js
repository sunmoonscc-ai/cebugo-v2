/**
 * Image helper utility with weserv.nl proxy support and mock image generator
 */

export function getOptimizedImageUrl(url, width = 600, quality = 80) {
  if (!url) return 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80';
  
  if (url.startsWith('data:') || url.includes('unsplash.com')) {
    return url;
  }

  const cleanUrl = url.replace(/^https?:\/\//, '');
  return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=${width}&q=${quality}&output=webp`;
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
  return '새싹 여행자 (Lv1)';
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
