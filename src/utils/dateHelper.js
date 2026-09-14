export function getLocalTodayString() {
  const dateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getRelativeTimeString(dateInput) {
  if (!dateInput) return '';
  const past = new Date(dateInput);
  const now = new Date();
  const diffMs = now - past;
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 0) {
    if (diffDay > 30) {
      const year = past.getFullYear();
      const month = String(past.getMonth() + 1).padStart(2, '0');
      const day = String(past.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return `${diffDay}일 전`;
  }
  if (diffHour > 0) return `${diffHour}시간 전`;
  if (diffMin > 0) return `${diffMin}분 전`;
  return '방금 전';
}
