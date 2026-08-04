import React from 'react';
import { getLevelTitle } from '../../utils/imageHelper';
import { RiShieldUserFill, RiPhoneFill, RiSmartphoneLine, RiKakaoTalkFill } from 'react-icons/ri';
import './Badge.css';

export function LevelBadge({ level = 1, isGuest = false }) {
  if (level <= 1 || isGuest) {
    return (
      <span 
        className="badge level-badge level-guest"
        title="로그인하시면 더 많은 상세 정보와 커뮤니티 기능을 이용하실 수 있습니다."
      >
        <RiShieldUserFill />
        방문자 (손님)
      </span>
    );
  }

  let colorClass = 'level-bronze';
  if (level >= 20) colorClass = 'level-diamond';
  else if (level >= 15) colorClass = 'level-platinum';
  else if (level >= 10) colorClass = 'level-gold';
  else if (level >= 5) colorClass = 'level-silver';

  return (
    <span className={`badge level-badge ${colorClass}`}>
      <RiShieldUserFill />
      Lv.{level} {getLevelTitle(level).split(' ')[0]}
    </span>
  );
}

export function CarrierBadge({ carrier, phone, type }) {
  if (!carrier && !phone) return null;
  const carrierLower = (carrier || 'smart').toLowerCase();
  const phoneText = phone ? phone.trim() : '';

  let typeTag = '';
  if (type === 'korean' || type === '한국인') {
    typeTag = '[한국인] ';
  } else if (type === 'filipino' || type === '필리핀인') {
    typeTag = '[필리핀인] ';
  }

  let displayText = '';
  if (carrier && phoneText) {
    displayText = `${typeTag}${carrier} ${phoneText}`;
  } else if (phoneText) {
    displayText = `${typeTag}${phoneText}`;
  } else if (carrier) {
    displayText = `${typeTag}${carrier}`;
  }

  const badgeContent = (
    <span className={`badge badge-carrier-${carrierLower}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <RiPhoneFill style={{ fontSize: '0.85rem' }} />
      <span>{displayText}</span>
    </span>
  );

  if (phoneText) {
    return (
      <a 
        href={`tel:${phoneText.replace(/[^0-9+]/g, '')}`}
        onClick={(e) => e.stopPropagation()}
        style={{ textDecoration: 'none', color: 'inherit' }}
        title={`전화 걸기: ${phoneText}`}
      >
        {badgeContent}
      </a>
    );
  }

  return badgeContent;
}

export function PhoneVerifiedBadge({ isVerified }) {
  if (!isVerified) return null;
  return (
    <span className="badge phone-verified-badge">
      <RiSmartphoneLine />
      현지폰 인증완료
    </span>
  );
}

export function KakaoVerifiedBadge({ isVerified }) {
  if (!isVerified) return null;
  return (
    <span className="badge kakao-verified-badge">
      <RiKakaoTalkFill />
      카톡 인증완료
    </span>
  );
}
