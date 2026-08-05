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
  RiGoogleFill,
  RiAddLine,
  RiCloseLine,
  RiSendPlaneFill
} from 'react-icons/ri';
import ZoomableImage from '../components/common/ZoomableImage';
import './ProfilePage.css';

export default function ProfilePage() {
  const { currentUser, userProfile, loginWithGoogle, logout } = useAuth();
  const { places, submissions, addSubmission } = usePlaces();
  const [activeTab, setActiveTab] = useState('favorites'); // favorites, submissions, points
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [feedbackCategory, setFeedbackCategory] = useState('일반 건의 / 서비스 의견');
  const [feedbackContent, setFeedbackContent] = useState('');

  const favPlaces = places.filter((p) => userProfile?.favorites?.includes(p.id));
  const userSubmissions = submissions.filter((s) => s.uid === userProfile?.uid || s.userName === userProfile?.displayName);
  const progress = getLevelProgress(userProfile?.points || 0);

  const handleSendFeedback = (e) => {
    e.preventDefault();
    if (!feedbackContent.trim()) {
      alert('의견 또는 제보 내용을 입력해주세요.');
      return;
    }

    addSubmission({
      placeId: 'general',
      placeName: feedbackCategory,
      field: '의견/제보',
      oldValue: '없음',
      newValue: feedbackContent,
      uid: userProfile?.uid || 'guest',
      userName: userProfile?.displayName || '사용자'
    });

    alert('의견이 성공적으로 제출되었습니다! 감사합니다.');
    setFeedbackContent('');
    setShowFeedbackModal(false);
  };

  if (!currentUser) {
    return (
      <div className="page-content fade-in">
        <div className="glass-card login-prompt-card">
          <RiUser3Line style={{ fontSize: '3.5rem', color: 'var(--primary)' }} />
          <h2>로그인이 필요합니다</h2>
          <p>구글 계정으로 로그인하시면 더 많은 세부 여행 정보 열람, 정보 제보, 포인트 적립 및 중고거래 커뮤니티 기능을 이용하실 수 있습니다.</p>
          
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
          <ZoomableImage
            src={userProfile.photoURL || '/default_cafe.png'}
            alt="profile"
            className="profile-avatar"
            showZoomHint={false}
          />
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
          <div className="sub-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.98rem', margin: 0, color: '#1e293b', fontWeight: 700 }}>내 제보 / 의견 목록</h3>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => setShowFeedbackModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', padding: '6px 12px', borderRadius: '20px', fontWeight: 700 }}
              title="관리자에게 자유롭게 의견이나 제보 보내기"
            >
              <RiAddLine style={{ fontSize: '1.1rem' }} /> 의견 / 제보 작성
            </button>
          </div>

          {userSubmissions.length === 0 ? (
            <div className="glass-card empty-state" style={{ textAlign: 'center', padding: '36px 16px' }}>
              <p style={{ color: '#64748b', marginBottom: '12px' }}>제공한 정보 제보 또는 문의 내역이 없습니다.</p>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => setShowFeedbackModal(true)}
                style={{ fontSize: '0.85rem' }}
              >
                <RiAddLine /> 첫 의견 / 제보 남기기
              </button>
            </div>
          ) : (
            userSubmissions.map((sub) => (
              <div key={sub.id} className="glass-card sub-item-card">
                <div className="sub-item-header">
                  <strong>{sub.placeName}</strong>
                  <span className={`sub-status ${sub.status}`}>
                    {sub.status === 'pending' ? '승인대기' : '승인완료'}
                  </span>
                </div>
                <p className="sub-item-body">
                  {sub.field === '의견/제보' ? (
                    <>내용: "{sub.newValue}"</>
                  ) : (
                    <>수정 항목: {sub.field} → "{sub.newValue}"</>
                  )}
                </p>
                <span className="sub-item-date">{sub.createdAt}</span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'points' && (
        <div className="tab-section fade-in">
          {userProfile?.consecutiveDays > 0 && (
            <div className="glass-card attendance-streak-badge" style={{ padding: '14px 18px', marginBottom: '14px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: '#1e40af', fontSize: '0.95rem' }}>🔥 연속 출석 {userProfile.consecutiveDays}일째 달성!</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#3b82f6' }}>
                  매일 연속 접속 보너스 적용 ({20 + Math.max(0, (userProfile.consecutiveDays || 1) - 1)}p 적립 완료)
                </p>
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563eb' }}>+{20 + Math.max(0, (userProfile.consecutiveDays || 1) - 1)}p</span>
            </div>
          )}

          <div className="glass-card point-ledger-card">
            {(userProfile?.pointLedger && userProfile.pointLedger.length > 0) ? (
              userProfile.pointLedger.map((item) => (
                <div key={item.id} className="ledger-item">
                  <div>
                    <strong>{item.title}</strong>
                    <span className="ledger-date">{item.date}</span>
                  </div>
                  <span className={item.type === 'minus' ? 'minus-point' : 'plus-point'}>
                    {item.type === 'minus' ? '-' : '+'}{item.points} p
                  </span>
                </div>
              ))
            ) : (
              <div className="ledger-item">
                <div>
                  <strong>오늘의 일일 출석 체크</strong>
                  <span className="ledger-date">{new Date().toISOString().split('T')[0]}</span>
                </div>
                <span className="plus-point">+{20 + Math.max(0, (userProfile?.consecutiveDays || 1) - 1)} p</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* General Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay fade-in" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', width: '90%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>📝 관리자에게 의견 / 제보 보내기</h3>
              <button className="close-btn" onClick={() => setShowFeedbackModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>
                <RiCloseLine />
              </button>
            </div>

            <form onSubmit={handleSendFeedback} className="modal-form">
              <p className="form-subtitle" style={{ fontSize: '0.83rem', color: '#64748b', marginBottom: '14px' }}>
                앱 이용 불편사항, 신규 서비스 제안, 잘못된 정보 제보 등 자유롭게 작성해 주세요.
              </p>

              <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                유형 선택
              </label>
              <select 
                value={feedbackCategory} 
                onChange={(e) => setFeedbackCategory(e.target.value)} 
                className="form-select"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '14px', fontSize: '0.9rem' }}
              >
                <option value="일반 건의 / 서비스 의견">일반 건의 / 서비스 의견</option>
                <option value="앱 오류 / 문제 제보">앱 오류 / 문제 제보</option>
                <option value="신규 업체 등록 요청">신규 업체 등록 요청</option>
                <option value="기타 문의">기타 문의</option>
              </select>

              <label className="form-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                상세 내용 입력
              </label>
              <textarea
                rows="4"
                placeholder="의견이나 제보하실 내용을 상세히 적어주세요."
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                className="form-textarea"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '16px', fontSize: '0.9rem', resize: 'vertical' }}
                required
              />

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowFeedbackModal(false)}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <RiSendPlaneFill /> 의견 제출하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPhoneModal && <PhoneAuthModal onClose={() => setShowPhoneModal(false)} />}
    </div>
  );
}
