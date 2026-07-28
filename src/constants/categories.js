export const CATEGORIES = [
  { id: 'all', name: '전체' },
  { id: 'education', name: '교육' },
  { id: 'public', name: '기관' },
  { id: 'hospital', name: '병원' },
  { id: 'massage', name: '뷰티·마사지' },
  { id: 'stay', name: '숙박' },
  { id: 'service', name: '서비스' },
  { id: 'attraction', name: '볼거리' },
  { id: 'shopping', name: '살거리' },
  { id: 'restaurant', name: '먹을거리' },
  { id: 'vehicle', name: '탈거리' },
  { id: 'cafe', name: '마실거리' },
  { id: 'activity', name: '즐길거리' }
];

export const CATEGORY_MAP = CATEGORIES.reduce((acc, cat) => {
  if (cat.id !== 'all') {
    acc[cat.id] = cat.name;
  }
  return acc;
}, {});
