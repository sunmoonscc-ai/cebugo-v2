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
  const { currentUser, userProfile, updateUserProfile, loginWithGoogle, logout, deleteAccount } = useAuth();
  const { places, submissions, addSubmission } = usePlaces();
  const [activeTab, setActiveTab] = useState('favorites'); // favorites, submissions, points
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [expandedSubId, setExpandedSubId] = useState(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editKakao, setEditKakao] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPhoneKr, setEditPhoneKr] = useState('');

  const [inputKakaoId, setInputKakaoId] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [inputPhoneKr, setInputPhoneKr] = useState('');

  // Update states when userProfile loads
  React.useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.displayName || '');
      setEditKakao(userProfile.kakaoId || '');
      setEditPhone(userProfile.phoneNumber || '');
      setEditPhoneKr(userProfile.phoneNumberKr || '');
    }
  }, [userProfile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateUserProfile({ displayName: editName, kakaoId: editKakao, phoneNumber: editPhone, phoneNumberKr: editPhoneKr });
    setIsEditingProfile(false);
    alert('프로필 정보가 저장되었습니다.');
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("정말 탈퇴하시겠습니까?\n\n탈퇴 시 모든 정보와 포인트가 영구적으로 삭제되며 복구할 수 없습니다.");
    if (confirmed) {
      try {
        await deleteAccount();
        alert("회원 탈퇴가 완료되었습니다.");
      } catch (err) {
        alert("탈퇴 처리에 실패했습니다. 다시 로그인 후 시도해주세요.");
      }
    }
  };

  const handleReqKakaoVerif = async (e) => {
    e.preventDefault();
    if (!inputKakaoId.trim()) return;
    
    await updateUserProfile({ kakaoId: inputKakaoId });
    
    addSubmission({
      type: 'verification',
      field: 'kakao',
      oldValue: '미인증',
      newValue: inputKakaoId,
      uid: userProfile?.uid,
      userName: userProfile?.displayName || '사용자',
      placeId: 'verification',
      placeName: '카카오톡 인증 요청'
    });
    
    alert('카카오톡 ID 등록 및 관리자 인증 신청이 완료되었습니다.');
  };

  const handleReqPhoneVerif = async (e) => {
    e.preventDefault();
    if (!inputPhone.trim()) return;
    
    await updateUserProfile({ phoneNumber: inputPhone });
    
    addSubmission({
      type: 'verification',
      field: 'phone',
      oldValue: '미인증',
      newValue: inputPhone,
      uid: userProfile?.uid,
      userName: userProfile?.displayName || '사용자',
      placeId: 'verification',
      placeName: '현지 휴대폰 인증 요청'
    });
    
    alert('필리핀 현지폰 번호 등록 및 관리자 인증 신청이 완료되었습니다.');
  };

  const handleReqPhoneKrVerif = async (e) => {
    e.preventDefault();
    if (!inputPhoneKr.trim()) return;
    
    await updateUserProfile({ phoneKr: inputPhoneKr });
    
    addSubmission({
      type: 'verification',
      field: 'phoneKr',
      oldValue: '미인증',
      newValue: inputPhoneKr,
      uid: userProfile?.uid,
      userName: userProfile?.displayName || '사용자',
      placeId: 'verification',
      placeName: '한국 휴대폰 인증 요청'
    });
    
    alert('한국 휴대폰 번호 등록 및 관리자 인증 신청이 완료되었습니다.');
  };

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

  if (!userProfile) {
    return (
      <div className="page-content fade-in">
        <div style={{ textAlign: 'center', marginTop: '50px', color: '#64748b' }}>
          프로필 정보를 불러오는 중입니다...
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
            
            <button className="btn btn-secondary" style={{ marginTop: '8px', fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => setIsEditingProfile(!isEditingProfile)}>
              {isEditingProfile ? '수정 취소' : '개인정보 수정'}
            </button>
          </div>
        </div>

        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="glass-card" style={{ padding: '16px', marginBottom: '16px', background: '#f8fafc' }}>
            <label className="form-label">닉네임</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="form-input" required />
            
            <label className="form-label" style={{ marginTop: '12px' }}>한국 휴대폰 번호</label>
            <input type="text" value={editPhoneKr} onChange={(e) => setEditPhoneKr(e.target.value)} className="form-input" placeholder="010..." />

            <label className="form-label" style={{ marginTop: '12px' }}>필리핀 현지 휴대폰 번호</label>
            <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="form-input" placeholder="0917..." />
            
            <label className="form-label" style={{ marginTop: '12px' }}>카카오톡 ID (중고거래용)</label>
            <input type="text" value={editKakao} onChange={(e) => setEditKakao(e.target.value)} className="form-input" placeholder="카카오톡 ID 입력" />
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>저장하기</button>
            <div style={{ marginTop: '12px', textAlign: 'right' }}>
              <button type="button" onClick={handleDeleteAccount} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>회원 탈퇴</button>
            </div>
          </form>
        )}

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
              <strong>필리핀 현지폰 연동 (+63)</strong>
              <p>{userProfile.phoneVerified ? `${userProfile.phoneNumber}` : '미인증 상태 (중고거래 제한)'}</p>
            </div>
          </div>

          {!userProfile.phoneVerified && (
            <form onSubmit={handleReqPhoneVerif} className="kakao-verif-form" style={{display:'flex', gap:'8px', marginTop: '10px'}}>
              <input
                type="text"
                placeholder="현지폰 입력 (0917...)"
                value={inputPhone}
                onChange={(e) => setInputPhone(e.target.value)}
                className="form-input"
                style={{ width: '130px', padding: '4px 8px' }}
                required
              />
              <button type="submit" className="btn btn-secondary phone-auth-trigger" style={{ whiteSpace: 'nowrap' }}>
                인증 신청
              </button>
            </form>
          )}
        </div>

        {/* Korean Phone Verification Status */}
        <div className="phone-status-card" style={{ marginTop: '12px' }}>
          <div className="status-text">
            <RiSmartphoneLine className="status-icon" />
            <div>
              <strong>한국 휴대폰 연동 (+82)</strong>
              <p>{userProfile.phoneKrVerified ? `${userProfile.phoneKr}` : '미인증 상태'}</p>
            </div>
          </div>

          {!userProfile.phoneKrVerified && (
            <form onSubmit={handleReqPhoneKrVerif} className="kakao-verif-form" style={{display:'flex', gap:'8px', marginTop: '10px'}}>
              <input
                type="text"
                placeholder="한국폰 입력 (010...)"
                value={inputPhoneKr}
                onChange={(e) => setInputPhoneKr(e.target.value)}
                className="form-input"
                style={{ width: '130px', padding: '4px 8px' }}
                required
              />
              <button type="submit" className="btn btn-secondary phone-auth-trigger" style={{ whiteSpace: 'nowrap' }}>
                인증 신청
              </button>
            </form>
          )}
        </div>

        {/* Kakao Verification Status */}
        <div className="phone-status-card" style={{ marginTop: '12px' }}>
          <div className="status-text">
            <RiUser3Line className="status-icon" />
            <div>
              <strong>카카오톡 아이디 연동</strong>
              <p>{userProfile.kakaoVerified ? userProfile.kakaoId : (userProfile.kakaoId ? `${userProfile.kakaoId} (미인증)` : '미인증 상태 (중고거래 제한)')}</p>
            </div>
          </div>

          {!userProfile.kakaoVerified && (
            <form onSubmit={handleReqKakaoVerif} className="kakao-verif-form" style={{display:'flex', gap:'8px', marginTop: '10px'}}>
              <input
                type="text"
                placeholder="카톡 ID 입력"
                value={inputKakaoId}
                onChange={(e) => setInputKakaoId(e.target.value)}
                className="form-input"
                style={{ width: '130px', padding: '4px 8px' }}
                required
              />
              <button type="submit" className="btn btn-secondary phone-auth-trigger" style={{ whiteSpace: 'nowrap' }}>
                인증 신청
              </button>
            </form>
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
              <div 
                key={sub.id} 
                className="glass-card sub-item-card"
                onClick={() => setExpandedSubId(prev => prev === sub.id ? null : sub.id)} 
                style={{ cursor: 'pointer' }}
              >
                <div className="sub-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{sub.placeName}</strong>
                  <span className={`sub-status ${sub.status}`}>
                    {sub.status === 'pending' ? '승인대기' : sub.status === 'rejected' ? '거절됨' : '승인완료'}
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

                {expandedSubId === sub.id && (
                  <div className="diff-body" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                    <span className="field-badge" style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#2563eb', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' }}>요청 항목: {sub.field}</span>
                    
                    {sub.field !== '의견/제보' && (
                      <div className="diff-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'center' }}>
                        <div className="diff-box old-box" style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <span className="box-label" style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>기존 데이터 (Current)</span>
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>{sub.oldValue}</p>
                        </div>
                        <div className="diff-arrow" style={{ color: '#94a3b8' }}>→</div>
                        <div className="diff-box new-box" style={{ padding: '10px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                          <span className="box-label" style={{ display: 'block', fontSize: '0.75rem', color: '#166534', marginBottom: '4px' }}>제안된 새로운 데이터 (Proposal)</span>
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>{sub.newValue}</p>
                        </div>
                      </div>
                    )}

                    {sub.images && sub.images.length > 0 && (
                      <div className="diff-images" style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span className="box-label" style={{ margin: 0, fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>첨부된 사진 ({sub.images.length}장)</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                          {sub.images.map((imgUrl, idx) => (
                            <div key={idx} style={{ width: '100px', height: '100px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
                              <ZoomableImage src={imgUrl} images={sub.images} initialIndex={idx} alt={`첨부사진 ${idx}`} width={400} style={{ width: '100%', height: '100%' }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
