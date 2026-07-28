// Haversine formula distance calculation in kilometers
export function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  if (lat1 === undefined || lng1 === undefined || lat2 === undefined || lng2 === undefined) return 9999;
  const R = 6371; // Radius of the Earth in km
  const dLat = (Number(lat2) - Number(lat1)) * (Math.PI / 180);
  const dLng = (Number(lng2) - Number(lng1)) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(Number(lat1) * (Math.PI / 180)) * Math.cos(Number(lat2) * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if a business is currently open
export function isOpenNow(openStr) {
  if (!openStr) return true;
  const lower = openStr.toLowerCase();
  if (lower.includes('24시간') || lower.includes('24h') || lower.includes('연중무휴')) return true;

  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Match patterns like "11:00 AM - 10:00 PM" or "09:00 AM - 02:00 AM"
    const match = openStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return true;

    let [_, h1, m1, p1, h2, m2, p2] = match;
    let openMin = (parseInt(h1, 10) % 12 + (p1.toUpperCase() === 'PM' ? 12 : 0)) * 60 + parseInt(m1, 10);
    let closeMin = (parseInt(h2, 10) % 12 + (p2.toUpperCase() === 'PM' ? 12 : 0)) * 60 + parseInt(m2, 10);

    if (closeMin <= openMin) {
      // Overnight operation (e.g. 09:00 AM - 02:00 AM)
      return currentMinutes >= openMin || currentMinutes <= closeMin;
    }

    return currentMinutes >= openMin && currentMinutes <= closeMin;
  } catch {
    return true;
  }
}
