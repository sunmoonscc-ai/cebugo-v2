/**
 * Service to fetch and parse live Google News RSS feeds for Philippines and Cebu news.
 * Strictly retrieves and filters Korean news articles published by Korean media.
 */

const CEBU_RSS_URL = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://news.google.com/rss/search?q=세부+여행+OR+세부+관광+OR+세부+입국&hl=ko&gl=KR&ceid=KR:ko');
const PH_RSS_URL = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://news.google.com/rss/search?q=필리핀+여행+OR+필리핀+뉴스+OR+필리핀+이슈&hl=ko&gl=KR&ceid=KR:ko');

export async function fetchGoogleNews() {
  try {
    const [cebuRes, phRes] = await Promise.allSettled([
      fetch(CEBU_RSS_URL).then((r) => r.json()),
      fetch(PH_RSS_URL).then((r) => r.json())
    ]);

    let newsList = [];

    const isKoreanArticle = (item) => {
      if (!item || !item.title) return false;
      const hasKoreanTitle = /[가-힣]/.test(item.title);
      const isForeignDomain = item.link && (
        item.link.includes('inquirer.net') ||
        item.link.includes('bworldonline.com') ||
        item.link.includes('sunstar.com') ||
        item.link.includes('philstar.com') ||
        item.link.includes('manilatimes.net')
      );
      return hasKoreanTitle && !isForeignDomain;
    };

    if (cebuRes.status === 'fulfilled' && cebuRes.value?.items) {
      const cebuItems = cebuRes.value.items
        .filter(isKoreanArticle)
        .map((item, idx) => ({
          id: `g_cebu_${idx}_${Date.now()}`,
          title: item.title ? item.title.replace(/ - [^-]+$/, '') : '세부 실시간 소식',
          date: item.pubDate ? item.pubDate.split(' ')[0] : new Date().toISOString().split('T')[0],
          pubTimestamp: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
          category: '세부소식 / 현지',
          summary: item.description ? item.description.replace(/<[^>]*>?/gm, '').trim() : '세부 관련 실시간 구글 뉴스 보도 기사입니다.',
          url: item.link,
          isAutoFetched: true
        }));
      newsList.push(...cebuItems);
    }

    if (phRes.status === 'fulfilled' && phRes.value?.items) {
      const phItems = phRes.value.items
        .filter(isKoreanArticle)
        .map((item, idx) => ({
          id: `g_ph_${idx}_${Date.now()}`,
          title: item.title ? item.title.replace(/ - [^-]+$/, '') : '필리핀 실시간 소식',
          date: item.pubDate ? item.pubDate.split(' ')[0] : new Date().toISOString().split('T')[0],
          pubTimestamp: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
          category: '필리핀 이슈 / 사회',
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
