/**
 * Philippines Telecom Phone Carrier & SNS Prefix Auto-Classifier
 * Operates on Firestore dynamic configuration with local fallbacks.
 */

// Philippine Phone Carrier Prefix Rules (09XX)
export const DEFAULT_PHONE_PREFIXES = {
  Globe: ['0917', '0927', '0937', '0947', '0956', '0966', '0977', '0995', '0997'],
  Smart: ['0908', '0918', '0919', '0920', '0921', '0928', '0929', '0939', '0949', '0998', '0999'],
  TNT: ['0907', '0909', '0910', '0912', '0930', '0938', '0946', '0948', '0950'],
  DITO: ['0991', '0992', '0993', '0994']
};

export const DEFAULT_SNS_PREFIXES = [
  { prefix: 'k_', name: '카카오톡', key: 'kakao', icon: 'RiKakaoTalkFill', color: '#FEE500' },
  { prefix: 'l_', name: '라인', key: 'line', icon: 'RiLineFill', color: '#00C300' },
  { prefix: 'w_', name: '위챗', key: 'wechat', icon: 'RiWechatFill', color: '#07C160' },
  { prefix: 'f_', name: '페이스북', key: 'facebook', icon: 'RiFacebookCircleFill', color: '#1877F2' },
  { prefix: 'i_', name: '인스타그램', key: 'instagram', icon: 'RiInstagramLine', color: '#E4405F' },
  { prefix: 't_', name: '텔레그램', key: 'telegram', icon: 'RiTelegramFill', color: '#24A1DE' }
];

/**
 * Classifies a phone number string into carrier (Globe, Smart, TNT, DITO or Unknown)
 */
export function classifyPhoneCarrier(phoneStr, carrierMap = DEFAULT_PHONE_PREFIXES) {
  if (!phoneStr) return null;
  const cleanNum = phoneStr.replace(/[^0-9]/g, '');
  
  // Normalize +639XX to 09XX
  let prefix = cleanNum;
  if (cleanNum.startsWith('63')) {
    prefix = '0' + cleanNum.substring(2);
  }
  prefix = prefix.substring(0, 4);

  for (const [carrier, prefixes] of Object.entries(carrierMap)) {
    if (prefixes.includes(prefix)) {
      return carrier;
    }
  }

  return 'Globe'; // Default fallback in Cebu region
}

/**
 * Parses SNS formatted string (e.g., "k_cebugouser" -> { platform: 'kakao', handle: 'cebugouser', ... })
 */
export function parseSnsEntry(snsRawStr, prefixList = DEFAULT_SNS_PREFIXES) {
  if (!snsRawStr) return null;

  for (const item of prefixList) {
    if (snsRawStr.startsWith(item.prefix)) {
      return {
        ...item,
        handle: snsRawStr.replace(item.prefix, '')
      };
    }
  }

  // Fallback if no prefix matches
  return {
    prefix: '',
    name: '카카오톡',
    key: 'kakao',
    handle: snsRawStr,
    color: '#FEE500'
  };
}

/**
 * Returns a clickable external URL for non-Kakao SNS platforms (Facebook, Instagram, Line, Telegram)
 */
export function getSnsLinkUrl(snsInfo) {
  if (!snsInfo || !snsInfo.handle) return null;
  const handle = snsInfo.handle.trim();
  if (!handle) return null;

  if (handle.startsWith('http://') || handle.startsWith('https://')) {
    return handle;
  }

  const key = (snsInfo.key || snsInfo.prefix || '').toLowerCase();
  const name = (snsInfo.name || '').toLowerCase();

  // KakaoTalk & WeChat: Policy prohibits open web URL deep linking without channel ID
  if (key === 'kakao' || key === 'k_' || name.includes('카카오톡') || key === 'wechat' || key === 'w_' || name.includes('위챗')) {
    return null;
  }

  if (key === 'facebook' || key === 'f_' || name.includes('페이스북')) {
    if (handle.includes(' ')) {
      return `https://www.facebook.com/search/top?q=${encodeURIComponent(handle)}`;
    }
    return `https://www.facebook.com/${handle}`;
  }

  if (key === 'instagram' || key === 'i_' || name.includes('인스타그램')) {
    return `https://www.instagram.com/${handle.replace('@', '')}`;
  }

  if (key === 'line' || key === 'l_' || name.includes('라인')) {
    return `https://line.me/ti/p/~${handle}`;
  }

  if (key === 'telegram' || key === 't_' || name.includes('텔레그램')) {
    return `https://t.me/${handle.replace('@', '')}`;
  }

  return null;
}
