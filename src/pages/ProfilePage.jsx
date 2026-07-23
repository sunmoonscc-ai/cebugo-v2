import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlaces } from '../context/PlacesContext';
import PlaceCard from '../components/places/PlaceCard';
import PhoneAuthModal from '../components/modals/PhoneAuthModal';
import { LevelBadge, PhoneVerifiedBadge, KakaoVerifiedBadge } from '../components/common/Badge';
import { getLevelTitle, getLevelProgress } from '../utils/imageHelper';
import { 
  RiUser3Line, 
  RiCoinLine, 
  RiHeartFill, 
  RiHistoryLine, 
  RiSmartphoneLine,
  RiLogoutBoxRLine,
  RiGoogleFill
} from 'react-icons/ri';
import './ProfilePage.css';

export default function ProfilePage() {
  const { currentUser, userProfile, loginWithGoogle, logout } = useAuth();
  const { places, submissions } = usePlaces();
  const [activeTab, setActiveTab] = useState('favorites'); // favorites, submissions, points
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const favPlaces = places.filter((p) => userProfile?.favorites?.includes(p.id));
  const userSubmissions = submissions.filter((s) => s.uid === userProfile?.uid || s.userName === userProfile?.displayName);
  const progress = getLevelProgress(userProfile?.points || 0);

  if (!currentUser) {
    return (
      <div className="page-content fade-in">
        <div className="glass-card login-prompt-card">
          <RiUser3Line style={{ fontSize: '3.5rem', color: 'var(--primary)' }} />
          <h2>로그인이 필요합니다</h2>
          <p>구글 계정으로 로그인 후 세부 정보 제보, 포인트 적립 및 중고거래를 이용하세요.</p>
          
          <button className="btn btn-primary google-login-btn" onClick={loginWithGoogle}>
            <RiGoogleFill /> Google 계정으로 로그인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content fade-in">
      {/* Profile Summary Header */}
      <div className="glass-card profile-card">
        <div className="profile-header">
          <img src={userProfile.photoURL} alt="profile" className="profile-avatar" />
          <div className="profile-details">
            <div className="badge-row">
              <LevelBadge level={userProfile.level} />
              <PhoneVerifiedBadge isVerified={userProfile.phoneVerified} />
              <KakaoVerifiedBadge isVerified={userProfile.kakaoVerified} />
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="level-progress-box">
          <div className="progress-top">
            <span>{getLevelTitle(progress.level)}</span>
            <strong>{userProfile.points} / {progress.nextLevelPt} p</strong>
          </div>

          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress.percentage}%` }} />
          </div>
          <span className="progress-hint">
            {progress.level >= 20 ? '최대 레벨(Lv.20) 달성!' : `다음 레벨까지 ${progress.pointsToNext}p 남음`}
          </span>
        </div>

        {/* Phone Verification Status */}
        <div className="phone-status-card">
          <div className="status-text">
            <RiSmartphoneLine className="status-icon" />
            <div>
              <strong>필리핀 현지폰 연동</strong>
              <p>{userProfile.phoneVerified ? `${userProfile.phoneNumber} (${userProfile.phoneCarrier})` : '미인증 상태 (중고거래 제한)'}</p>
            </div>
          </div>

          {!userProfile.phoneVerified && (
            <button className="btn btn-secondary phone-auth-trigger" onClick={() => setShowPhoneModal(true)}>
              인증하기
            </button>
          )}
        </div>

        <button className="logout-link-btn" onClick={logout}>
          <RiLogoutBoxRLine /> 로그아웃
        </button>
      </div>

      {/* Profile Activity Tabs */}
      <div className="profile-tabs glass-card">
        <button className={activeTab === 'favorites' ? 'active' : ''} onClick={() => setActiveTab('favorites')}>
          <RiHeartFill /> 즐겨찾기 ({favPlaces.length})
        </button>
        <button className={activeTab === 'submissions' ? 'active' : ''} onClick={() => setActiveTab('submissions')}>
          <RiHistoryLine /> 내 제보내역 ({userSubmissions.length})
        </button>
        <button className={activeTab === 'points' ? 'active' : ''} onClick={() => setActiveTab('points')}>
          <RiCoinLine /> 포인트 내역
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'favorites' && (
        <div className="tab-section fade-in">
          {favPlaces.length === 0 ? (
            <div className="glass-card empty-state"><p>즐겨찾는 업체가 없습니다.</p></div>
          ) : (
            favPlaces.map((p) => <PlaceCard key={p.id} place={p} />)
          )}
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="tab-section fade-in">
          {userSubmissions.length === 0 ? (
            <div className="glass-card empty-state"><p>제공한 정보 제보 내역이 없습니다.</p></div>
          ) : (
            userSubmissions.map((sub) => (
              <div key={sub.id} className="glass-card sub-item-card">
                <div className="sub-item-header">
                  <strong>{sub.placeName}</strong>
                  <span className={`sub-status ${sub.status}`}>{sub.status === 'pending' ? '승인대기' : '승인완료 (+50p)'}</span>
                </div>
                <p className="sub-item-body">수정 항목: {sub.field} → "{sub.newValue}"</p>
                <span className="sub-item-date">{sub.createdAt}</span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'points' && (
        <div className="tab-section fade-in">
          <div className="glass-card point-ledger-card">
            <div className="ledger-item">
              <div>
                <strong>일일 출석 체크</strong>
                <span className="ledger-date">2026-07-23</span>
              </div>
              <span className="plus-point">+20 p</span>
            </div>
            <div className="ledger-item">
              <div>
                <strong>정보 제보 승인 보상 (트리쉐이드)</strong>
                <span className="ledger-date">2026-07-20</span>
              </div>
              <span className="plus-point">+50 p</span>
            </div>
          </div>
        </div>
      )}

      {showPhoneModal && <PhoneAuthModal onClose={() => setShowPhoneModal(false)} />}
    </div>
  );
}
