/**
 * Service to fetch real-time exchange rates for USD, PHP, and KRW.
 * Uses open.er-api.com which updates daily/real-time and avoids CORS restrictions.
 * Implements localStorage caching for offline / network error handling.
 */

const STORAGE_KEY = 'cebugo_cached_exchange_rates';

const DEFAULT_RATES = {
  usdToKrw: 1385,
  usdToPhp: 58.2,
  phpToKrw: 1385 / 58.2,
  lastUpdatedText: '⚠️ 네트워크 연결 문제로 기본 기준 환율을 표시합니다 (USD 1,385원 / PHP 58.20)',
  isFallback: true,
  hasError: true
};

export async function fetchExchangeRates() {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.result === 'success' && data.rates) {
      const usdToKrw = data.rates.KRW || 1385;
      const usdToPhp = data.rates.PHP || 58.2;
      const phpToKrw = usdToKrw / usdToPhp;

      // Format last update time (UTC to KST)
      let dateObj = new Date();
      if (data.time_last_update_utc) {
        dateObj = new Date(data.time_last_update_utc);
      }

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');

      const formattedTime = `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분 기준 실시간 고시 환율`;

      const rateResult = {
        usdToKrw: Math.round(usdToKrw * 100) / 100,
        usdToPhp: Math.round(usdToPhp * 100) / 100,
        phpToKrw: Math.round(phpToKrw * 100) / 100,
        lastUpdatedText: formattedTime,
        isFallback: false,
        hasError: false
      };

      // Save successful response to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rateResult));
      } catch (e) {
        console.warn('Failed to save exchange rates to localStorage', e);
      }

      return rateResult;
    }

    throw new Error('Invalid rate response format');
  } catch (error) {
    console.error('Exchange rate fetch error:', error);

    // Try loading from localStorage cache
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          ...parsed,
          lastUpdatedText: `⚠️ 네트워크 연결 문제로 최근 수신된 환율을 표시합니다 (${parsed.lastUpdatedText.replace('실시간 고시 환율', '수신 기록')})`,
          isFallback: true,
          hasError: true
        };
      }
    } catch (e) {
      console.warn('Failed to parse cached exchange rates', e);
    }

    return DEFAULT_RATES;
  }
}
