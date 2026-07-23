import React from 'react';
import { getLevelTitle } from '../../utils/imageHelper';
import { RiShieldUserFill, RiPhoneFindLine, RiSmartphoneLine, RiKakaoTalkFill } from 'react-icons/ri';
import './Badge.css';

export function LevelBadge({ level = 1 }) {
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

export function CarrierBadge({ carrier }) {
  if (!carrier) return null;
  const carrierLower = carrier.toLowerCase();
  
  return (
    <span className={`badge badge-carrier-${carrierLower}`}>
      <RiPhoneFindLine />
      {carrier}
    </span>
  );
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
