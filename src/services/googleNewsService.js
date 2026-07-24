/**
 * Service to fetch and parse live Google News RSS feeds for Philippines and Cebu news.
 */

const CEBU_RSS_URL = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://news.google.com/rss/search?q=세부+필리핀+여행+입국&hl=ko&gl=KR&ceid=KR:ko');
const PH_RSS_URL = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://news.google.com/rss/search?q=필리핀+경제+사회+이슈&hl=ko&gl=KR&ceid=KR:ko');

export async function fetchGoogleNews() {
  try {
    const [cebuRes, phRes] = await Promise.allSettled([
      fetch(CEBU_RSS_URL).then((r) => r.json()),
      fetch(PH_RSS_URL).then((r) => r.json())
    ]);

    let newsList = [];

    if (cebuRes.status === 'fulfilled' && cebuRes.value?.items) {
      const cebuItems = cebuRes.value.items.map((item, idx) => ({
        id: `g_cebu_${idx}_${Date.now()}`,
        title: item.title ? item.title.replace(/ - [^-]+$/, '') : '세부 실시간 소식',
        date: item.pubDate ? item.pubDate.split(' ')[0] : new Date().toISOString().split('T')[0],
        category: '세부소식 / 구글뉴스',
        summary: item.description ? item.description.replace(/<[^>]*>?/gm, '').trim() : '세부 관련 실시간 구글 뉴스 보도 기사입니다.',
        url: item.link,
        isAutoFetched: true
      }));
      newsList.push(...cebuItems);
    }

    if (phRes.status === 'fulfilled' && phRes.value?.items) {
      const phItems = phRes.value.items.map((item, idx) => ({
        id: `g_ph_${idx}_${Date.now()}`,
        title: item.title ? item.title.replace(/ - [^-]+$/, '') : '필리핀 실시간 소식',
        date: item.pubDate ? item.pubDate.split(' ')[0] : new Date().toISOString().split('T')[0],
        category: '필리핀 이슈 / 구글뉴스',
        summary: item.description ? item.description.replace(/<[^>]*>?/gm, '').trim() : '필리핀 실시간 구글 뉴스 이슈입니다.',
        url: item.link,
        isAutoFetched: true
      }));
      newsList.push(...phItems);
    }

    // Deduplicate by title
    const seenTitles = new Set();
    const uniqueNews = newsList.filter((item) => {
      if (seenTitles.has(item.title)) return false;
      seenTitles.add(item.title);
      return true;
    });

    return uniqueNews;
  } catch (error) {
    console.error('Failed to fetch live Google News:', error);
    return [];
  }
}
