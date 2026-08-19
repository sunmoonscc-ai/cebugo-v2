export const CATEGORY_COLORS = [
  '#ef4444', // 0: Red
  '#f97316', // 1: Orange
  '#eab308', // 2: Yellow
  '#84cc16', // 3: Lime
  '#22c55e', // 4: Green
  '#10b981', // 5: Emerald
  '#14b8a6', // 6: Teal
  '#06b6d4', // 7: Cyan
  '#3b82f6', // 8: Blue
  '#6366f1', // 9: Indigo
  '#8b5cf6', // 10: Violet
  '#a855f7', // 11: Purple
  '#ec4899', // 12: Pink
];

export const getCategoryColor = (categoryId) => {
  if (!categoryId || categoryId === 'all') return '#2563eb'; // fallback blue
  if (categoryId === 'favorite') return '#e11d48'; // favorite pinkish red
  
  let hash = 0;
  for (let i = 0; i < categoryId.length; i++) {
    hash = categoryId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
};
