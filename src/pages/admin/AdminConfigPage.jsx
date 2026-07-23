import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PhoneVerifiedBadge, KakaoVerifiedBadge } from '../../components/common/Badge';
import { 
  RiShieldStarLine, 
  RiSaveLine,
  RiCheckDoubleLine,
  RiKakaoTalkFill,
  RiSmartphoneLine
} from 'react-icons/ri';
import './AdminConfigPage.css';

export default function AdminConfigPage() {
  const { userProfile, toggleUserVerificationByAdmin } = useAuth();

  const [writeLevel, setWriteLevel] = useState(4);
  const [readLevel, setReadLevel] = useState(3);
  const [phonePrefixes, setPhonePrefixes] = useState('0917, 0927, 0937, 0947, 0956, 0966');
  const [snsPrefixes, setSnsPrefixes] = useState('k_=카카오톡, l_=라인, f_=페이스북, i_=인스타그램');
  const [saved, setSaved] = useState(false);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-content fade-in">
      <div className="admin-header">
        <h1><RiShieldStarLine /> 관리자 - 인증 관리 및 설정</h1>
        <p>사용자 수동 인증(현지폰/카톡) 승인 및 중고거래 정책을 관리합니다.</p>
      </div>

      {/* Admin Manual Verification Management Panel */}
      <div className="glass-card config-form" style={{ marginBottom: '20px' }}>
        <h3><RiCheckDoubleLine /> 수동 회원 인증 승인 관리 (테스트/관리자 전용)</h3>
        <p className="field-hint" style={{ marginBottom: '14px' }}>
          사용자가 신청한 현지폰/카카오톡 수동 인증을 관리자가 검토 후 승인/취소 처리할 수 있습니다.
        </p>

        <div className="admin-verif-user-card glass-card" style={{ padding: '16px', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <strong>현재 테스트 사용자: {userProfile?.displayName} ({userProfile?.email})</strong>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                TEL: {userProfile?.phoneNumber || '없음'} | 카톡: {userProfile?.kakaoId || '없음'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <PhoneVerifiedBadge isVerified={userProfile?.phoneVerified} />
              <KakaoVerifiedBadge isVerified={userProfile?.kakaoVerified} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              className={`btn ${userProfile?.phoneVerified ? 'btn-secondary' : 'btn-primary'}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => toggleUserVerificationByAdmin('phone')}
            >
              <RiSmartphoneLine /> {userProfile?.phoneVerified ? '현지폰 인증 취소' : '현지폰 승인하기'}
            </button>

            <button
              type="button"
              className={`btn ${userProfile?.kakaoVerified ? 'btn-secondary' : 'btn-primary'}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px', background: userProfile?.kakaoVerified ? '#f1f5f9' : '#fee500', color: '#3c1e1e' }}
              onClick={() => toggleUserVerificationByAdmin('kakao')}
            >
              <RiKakaoTalkFill /> {userProfile?.kakaoVerified ? '카톡 인증 취소' : '카톡 승인하기'}
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveConfig} className="glass-card config-form">
        <h3>중고 물품 거래 이용 자격 레벨 설정</h3>
        
        <div className="config-field-row">
          <div>
            <label className="form-label">매물 등록 (글쓰기) 최소 레벨</label>
            <input
              type="number"
              value={writeLevel}
              onChange={(e) => setWriteLevel(e.target.value)}
              className="form-input"
            />
            <span className="field-hint">현재 설정: Lv.{writeLevel} 이상 + [현지폰 & 카톡 수동인증] 필수</span>
          </div>

          <div>
            <label className="form-label">매물 열람 (읽기) 최소 레벨</label>
            <input
              type="number"
              value={readLevel}
              onChange={(e) => setReadLevel(e.target.value)}
              className="form-input"
            />
            <span className="field-hint">현재 설정: Lv.{readLevel} 이상</span>
          </div>
        </div>

        <hr className="divider" />

        <h3>필리핀 통신사 09XX Prefix 매핑 (Globe)</h3>
        <label className="form-label">Globe 통신사 국번 식별자 (쉼표 구분)</label>
        <textarea
          rows="3"
          value={phonePrefixes}
          onChange={(e) => setPhonePrefixes(e.target.value)}
          className="form-textarea"
        />

        <hr className="divider" />

        <h3>SNS 플랫폼 접두어 매핑</h3>
        <label className="form-label">접두어 매핑 테이블</label>
        <textarea
          rows="3"
          value={snsPrefixes}
          onChange={(e) => setSnsPrefixes(e.target.value)}
          className="form-textarea"
        />

        <button type="submit" className="btn btn-primary save-btn">
          <RiSaveLine /> {saved ? '설정이 저장되었습니다!' : '설정 저장하기'}
        </button>
      </form>
    </div>
  );
}
