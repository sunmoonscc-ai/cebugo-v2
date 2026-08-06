import React, { useState, useEffect } from 'react';
import { usePlaces } from '../../context/PlacesContext';
import { db } from '../../firebase/config';
import { doc, onSnapshot, setDoc, collection } from 'firebase/firestore';
import { 
  RiCheckLine, 
  RiCloseLine, 
  RiAdminLine, 
  RiSpeedUpLine,
  RiNotification3Line,
  RiFileCheckLine,
  RiHistoryLine,
  RiDownload2Line,
  RiUser3Line,
  RiStore2Line,
  RiAddLine,
  RiSettings3Line
} from 'react-icons/ri';
import ZoomableImage from '../../components/common/ZoomableImage';
import AdminUserEditModal from '../../components/modals/AdminUserEditModal';
import AdvertiserFormModal from '../../components/modals/AdvertiserFormModal';
import './AdminSubmissionsPage.css';

export default function AdminSubmissionsPage() {
  const { submissions, approveSubmission, rejectSubmission } = usePlaces();

  const [adminTab, setAdminTab] = useState('notice'); // 'notice' (공지/속도) or 'submission' (제보)
  const [noticeSpeedMultiplier, setNoticeSpeedMultiplier] = useState(1);
  const [adSpeedMultiplier, setAdSpeedMultiplier] = useState(1);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  
  const [advertisers, setAdvertisers] = useState([]);
  const [editingAdvertiser, setEditingAdvertiser] = useState(null);
  const [isAdvertiserModalOpen, setIsAdvertiserModalOpen] = useState(false);

  const [marketplaceRules, setMarketplaceRules] = useState({
    readLevel: 1, reqPhoneRead: false, reqKakaoRead: false,
    writeLevel: 4, reqPhoneWrite: true, reqKakaoWrite: true
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'cebugo_config', 'ticker_speed'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNoticeSpeedMultiplier(data.noticeSpeedMultiplier || 1);
        setAdSpeedMultiplier(data.adSpeedMultiplier || 1);
      }
    });

    const unsubRules = onSnapshot(doc(db, 'cebugo_config', 'marketplace_rules'), (docSnap) => {
      if (docSnap.exists()) {
        setMarketplaceRules(docSnap.data());
      }
    });

    return () => { unsub(); unsubRules(); };
  }, []);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs
        .map(d => ({ ...d.data(), uid: d.id }));
      setUsers(userList);
    });
    return () => unsubUsers();
  }, []);

  useEffect(() => {
    const unsubAdv = onSnapshot(collection(db, 'cebugo_advertisers'), (snapshot) => {
      const advList = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      setAdvertisers(advList);
    });
    return () => unsubAdv();
  }, []);

  const handleUpdateSpeed = async (noticeMult, adMult) => {
    setNoticeSpeedMultiplier(noticeMult);
    setAdSpeedMultiplier(adMult);
    try {
      await setDoc(
        doc(db, 'cebugo_config', 'ticker_speed'),
        {
          noticeSpeedMultiplier: noticeMult,
          adSpeedMultiplier: adMult,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Failed to update ticker speed in Firestore:', e);
    }
  };

  const handleSaveMarketplaceRules = async () => {
    try {
      await setDoc(doc(db, 'cebugo_config', 'marketplace_rules'), {
        ...marketplaceRules,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert('중고거래 설정이 성공적으로 저장되었습니다.');
    } catch (e) {
      console.error('Failed to save marketplace rules:', e);
      alert('설정 저장 중 오류가 발생했습니다.');
    }
  };

  const handleApproveRejoin = async (user) => {
    if (!window.confirm(`${user.displayName} 사용자의 재가입을 승인하시겠습니까?`)) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        deleted: false,
        deleteReason: null,
        deletedAt: null,
        rejoinRequested: false,
        rejoinRequestedAt: null
      }, { merge: true });
      alert('승인 완료되었습니다. 사용자가 다시 로그인할 수 있습니다.');
    } catch (err) {
      alert('승인 중 오류 발생: ' + err.message);
    }
  };

  const handleApproveAdvertiser = async (id, placeId) => {
    try {
      const placeRef = doc(db, 'cebugo_places', placeId);
      const placeSnap = await getDoc(placeRef);
      if (placeSnap.exists()) {
        const placeData = placeSnap.data();
        const allImages = [
          ...(placeData.images?.cover || []),
          ...(placeData.images?.facility || []),
          ...(placeData.images?.product || []),
          ...(placeData.images?.menu || [])
        ].filter(Boolean);
        const logoUrl = allImages.length > 0 ? allImages[0] : '';
        await setDoc(doc(db, 'cebugo_advertisers', placeId), {
          name: placeData.name,
          logoUrl: logoUrl
        });
      }

      await setDoc(doc(db, 'cebugo_submissions', id), { status: 'approved', processedAt: new Date().toISOString() }, { merge: true });
      alert('광고주가 승인되었습니다.');
    } catch (err) {
      console.error('Failed to approve advertiser:', err);
    }
  };

  const handleSaveAdvertiser = async (formData) => {
    try {
      const advId = editingAdvertiser ? editingAdvertiser.id : `adv_${Date.now()}`;
      await setDoc(doc(db, 'cebugo_advertisers', advId), {
        ...formData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setIsAdvertiserModalOpen(false);
      setEditingAdvertiser(null);
    } catch (e) {
      console.error('Failed to save advertiser:', e);
      alert('광고주 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteAdvertiser = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('정말 이 광고주를 삭제하시겠습니까? (연결된 게시물이 있으면 표시되지 않을 수 있습니다)')) return;
    try {
      await deleteDoc(doc(db, 'cebugo_advertisers', id));
    } catch (err) {
      console.error('Failed to delete advertiser:', err);
    }
  };

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending');
  const processedSubmissions = submissions.filter((s) => s.status !== 'pending').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const downloadImage = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'download.jpg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error('Download failed', e);
      window.open(url, '_blank');
    }
  };

  const downloadAllImages = async (images, placeName) => {
    // If browser supports File System Access API (Chrome/Edge)
    if (window.showDirectoryPicker) {
      try {
        const dirHandle = await window.showDirectoryPicker({
          mode: 'readwrite',
          id: 'cebugo-downloads', // Remembers the last used directory if possible
        });
        for (let idx = 0; idx < images.length; idx++) {
          const url = images[idx];
          const response = await fetch(url);
          const blob = await response.blob();
          
          const filename = `${placeName}_제보사진_${idx + 1}.jpg`;
          const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        }
        alert('선택하신 폴더에 모든 사진이 성공적으로 저장되었습니다. 🎉');
        return;
      } catch (err) {
        // If user aborted (closed the picker), just return
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Directory picker failed:', err);
        // Fallback to normal download if API fails for some reason
      }
    }

    // Fallback traditional method (downloads one by one to default folder)
    images.forEach((url, idx) => {
      downloadImage(url, `${placeName}_제보사진_${idx + 1}.jpg`);
    });
  };

  const handleApprove = (subId) => {
    const points = window.prompt('해당 제보자에게 지급할 포인트를 입력하세요.', '20');
    if (points === null) return; // User cancelled
    
    const parsed = parseInt(points, 10);
    if (isNaN(parsed) || parsed < 0) {
      alert('유효한 숫자를 입력해주세요.');
      return;
    }
    
    approveSubmission(subId, parsed);
  };

  return (
    <div className="page-content fade-in">
      <div className="admin-header">
        <h1><RiAdminLine /> 관리자 대시보드</h1>
        <p>공지/전광판 롤링 속도 정책 관리 및 사용자 정보 제보 승인을 처리합니다.</p>
      </div>

      {/* Admin 2 Sub-Tabs Bar */}
      <div className="news-nav-tabs glass-card" style={{ marginBottom: '20px' }}>
        <button 
          type="button"
          className={`news-tab-btn ${adminTab === 'notice' ? 'active' : ''}`}
          onClick={() => setAdminTab('notice')}
        >
          <RiNotification3Line className="tab-icon" />
          <span>공지 / 속도</span>
        </button>

        <button 
          type="button"
          className={`news-tab-btn ${adminTab === 'submission' ? 'active' : ''}`}
          onClick={() => setAdminTab('submission')}
        >
          <RiFileCheckLine className="tab-icon" />
          <span>제보 승인함 ({pendingSubmissions.length})</span>
        </button>

        <button 
          type="button"
          className={`news-tab-btn ${adminTab === 'users' ? 'active' : ''}`}
          onClick={() => setAdminTab('users')}
        >
          <RiUser3Line className="tab-icon" />
          <span>사용자 ({users.filter(u => !u.deleted).length})</span>
        </button>

        <button 
          type="button"
          className={`news-tab-btn ${adminTab === 'deleted_users' ? 'active' : ''}`}
          onClick={() => setAdminTab('deleted_users')}
        >
          <RiUser3Line className="tab-icon" />
          <span>탈퇴 사용자 ({users.filter(u => u.deleted).length})</span>
        </button>

        <button 
          type="button"
          className={`news-tab-btn ${adminTab === 'marketplace' ? 'active' : ''}`}
          onClick={() => setAdminTab('marketplace')}
        >
          <RiSettings3Line className="tab-icon" />
          <span>중고거래 권한</span>
        </button>

        <button 
          type="button"
          className={`news-tab-btn ${adminTab === 'advertisers' ? 'active' : ''}`}
          onClick={() => setAdminTab('advertisers')}
        >
          <RiStore2Line className="tab-icon" />
          <span>광고주 ({advertisers.length})</span>
        </button>
      </div>

      {/* TAB 1: 공지 및 롤링 속도 설정 */}
      {adminTab === 'notice' && (
        <div className="tab-content-section fade-in">
          {/* Ticker Speed Config Panel */}
          <div className="glass-card config-form" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <RiSpeedUpLine style={{ fontSize: '1.4rem', color: 'var(--primary)' }} />
              <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700, color: '#1e293b' }}>
                ⚡ 공지 / 전광판 롤링 속도 설정
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '18px', lineHeight: '1.45' }}>
              실제 화면 픽셀 이동 속도를 고정(1x = 시속 10km/h 가독 속도)하고, 게시물 길이/개수와 무관하게 1x / 2x / 3x 배속을 지정합니다.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {/* Notice Speed */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                  📢 상단 공지 속도
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3].map((mult) => (
                    <button
                      key={mult}
                      type="button"
                      className={`btn ${noticeSpeedMultiplier === mult ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, fontSize: '0.82rem', padding: '9px 0', fontWeight: 700 }}
                      onClick={() => handleUpdateSpeed(mult, adSpeedMultiplier)}
                    >
                      {mult}x {mult === 1 ? '(기본)' : mult === 2 ? '(빠름)' : '(매우빠름)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ad Ticker Speed */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                  📣 하단 전광판 속도
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3].map((mult) => (
                    <button
                      key={mult}
                      type="button"
                      className={`btn ${adSpeedMultiplier === mult ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, fontSize: '0.82rem', padding: '9px 0', fontWeight: 700 }}
                      onClick={() => handleUpdateSpeed(noticeSpeedMultiplier, mult)}
                    >
                      {mult}x {mult === 1 ? '(기본)' : mult === 2 ? '(빠름)' : '(매우빠름)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1.5: 중고거래 권한 설정 */}
      {adminTab === 'marketplace' && (
        <div className="tab-content-section fade-in">
          <div className="glass-card config-form" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <RiSettings3Line style={{ fontSize: '1.4rem', color: 'var(--primary)' }} />
              <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700, color: '#1e293b' }}>
                🛡️ 중고거래 접근 권한 설정
              </h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: '18px', lineHeight: '1.45' }}>
              중고거래 게시판을 열람하거나 새 매물을 등록할 수 있는 최소 레벨 및 필수 인증 조건을 설정합니다.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              {/* 읽기 권한 */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>👀 읽기(열람) 권한</h4>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>최소 레벨 (Lv)</label>
                  <input type="number" min="1" max="20" className="form-input" value={marketplaceRules.readLevel} onChange={e => setMarketplaceRules({...marketplaceRules, readLevel: parseInt(e.target.value, 10) || 1})} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input type="checkbox" id="reqPhoneRead" checked={marketplaceRules.reqPhoneRead} onChange={e => setMarketplaceRules({...marketplaceRules, reqPhoneRead: e.target.checked})} />
                  <label htmlFor="reqPhoneRead" style={{ fontSize: '0.85rem' }}>전화번호 인증 필수</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="reqKakaoRead" checked={marketplaceRules.reqKakaoRead} onChange={e => setMarketplaceRules({...marketplaceRules, reqKakaoRead: e.target.checked})} />
                  <label htmlFor="reqKakaoRead" style={{ fontSize: '0.85rem' }}>카카오톡 인증 필수</label>
                </div>
              </div>

              {/* 쓰기 권한 */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>✍️ 쓰기(등록) 권한</h4>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>최소 레벨 (Lv)</label>
                  <input type="number" min="1" max="20" className="form-input" value={marketplaceRules.writeLevel} onChange={e => setMarketplaceRules({...marketplaceRules, writeLevel: parseInt(e.target.value, 10) || 1})} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input type="checkbox" id="reqPhoneWrite" checked={marketplaceRules.reqPhoneWrite} onChange={e => setMarketplaceRules({...marketplaceRules, reqPhoneWrite: e.target.checked})} />
                  <label htmlFor="reqPhoneWrite" style={{ fontSize: '0.85rem' }}>전화번호 인증 필수</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="reqKakaoWrite" checked={marketplaceRules.reqKakaoWrite} onChange={e => setMarketplaceRules({...marketplaceRules, reqKakaoWrite: e.target.checked})} />
                  <label htmlFor="reqKakaoWrite" style={{ fontSize: '0.85rem' }}>카카오톡 인증 필수</label>
                </div>
              </div>
            </div>

            <button type="button" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} onClick={handleSaveMarketplaceRules}>
              <RiCheckLine /> 중고거래 권한 설정 저장
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: 사용자 제보 승인함 */}
      {adminTab === 'submission' && (
        <div className="tab-content-section fade-in">
          <div className="section-title">
            <h2>승인 대기중 제보 <span>({pendingSubmissions.length})</span></h2>
          </div>

      {pendingSubmissions.length === 0 ? (
        <div className="glass-card empty-state"><p>승인 대기 중인 제보가 없습니다.</p></div>
      ) : (
        pendingSubmissions.map((sub) => (
          <div key={sub.id} className="glass-card diff-card fade-in">
            <div className="diff-header">
              <div>
                <strong className="place-tag">[{sub.placeName}]</strong>
                <span className="user-tag">제보자: {sub.userName} {sub.userLevel ? `(Lv.${sub.userLevel})` : ''}</span>
              </div>
              <span className="diff-date">{sub.createdAt}</span>
            </div>

            <div className="diff-body">
              <span className="field-badge">수정 요청 항목: {sub.field}</span>

              <div className="diff-grid">
                <div className="diff-box old-box">
                  <span className="box-label">기존 데이터 (Current)</span>
                  <p>{sub.oldValue}</p>
                </div>

                <div className="diff-arrow">→</div>

                <div className="diff-box new-box">
                  <span className="box-label">제안된 새로운 데이터 (Proposal)</span>
                  <p>{sub.newValue}</p>
                </div>
              </div>

              {sub.images && sub.images.length > 0 && (
                <div className="diff-images" style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="box-label" style={{ margin: 0 }}>첨부된 사진 ({sub.images.length}장)</span>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => downloadAllImages(sub.images, sub.placeName)}>
                      <RiDownload2Line /> 전체 저장
                    </button>
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

            <div className="diff-actions">
              <button
                className="btn btn-secondary reject-btn"
                onClick={() => rejectSubmission(sub.id)}
              >
                <RiCloseLine /> 거절하기
              </button>

              <button
                className="btn btn-primary approve-btn"
                onClick={() => handleApprove(sub.id)}
              >
                <RiCheckLine /> 승인 (완료 처리)
              </button>
            </div>
          </div>
        ))
      )}

      {/* History */}
      <div className="section-title" style={{ marginTop: '30px' }}>
        <h2>처리 완료 내역 ({processedSubmissions.length})</h2>
      </div>

      <div className="processed-list">
        {processedSubmissions.map((sub) => (
          <div key={sub.id} className="glass-card processed-card" onClick={() => setExpandedSubmissionId(prev => prev === sub.id ? null : sub.id)} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>[{sub.placeName}] {sub.field}</strong>
                <p className="proc-val">반영값: {sub.newValue}</p>
              </div>
              <span className={`sub-status ${sub.status}`}>
                {sub.status === 'approved' ? '승인완료' : '거절됨'}
              </span>
            </div>
            
            {expandedSubmissionId === sub.id && (
              <div className="diff-body" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
                <span className="field-badge">요청 항목: {sub.field}</span>
                <div className="diff-grid">
                  <div className="diff-box old-box">
                    <span className="box-label">기존 데이터 (Current)</span>
                    <p>{sub.oldValue}</p>
                  </div>
                  <div className="diff-arrow">→</div>
                  <div className="diff-box new-box">
                    <span className="box-label">제안된 새로운 데이터 (Proposal)</span>
                    <p>{sub.newValue}</p>
                  </div>
                </div>

                {sub.images && sub.images.length > 0 && (
                  <div className="diff-images" style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="box-label" style={{ margin: 0 }}>첨부된 사진 ({sub.images.length}장)</span>
                      <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => downloadAllImages(sub.images, sub.placeName)}>
                        <RiDownload2Line /> 전체 저장
                      </button>
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
        ))}
      </div>
    </div>
  )}

  {/* TAB 3: 사용자 목록 */}
  {adminTab === 'users' && (
    <div className="tab-content-section fade-in">
      <div className="section-title">
        <h2>일반 사용자 목록 <span>({users.filter(u => !u.deleted).length})</span></h2>
      </div>
      
      {users.filter(u => !u.deleted).length === 0 ? (
        <div className="glass-card empty-state"><p>조회된 사용자가 없습니다.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {users.filter(u => !u.deleted).map(u => (
            <div 
              key={u.uid} 
              className="glass-card hover-lift" 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '16px' }} 
              onClick={() => setEditingUser(u)}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>
                  {u.displayName || '이름 없음'} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'normal' }}>(Lv.{u.level || 1})</span>
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px', display: 'flex', gap: '10px' }}>
                  <span><strong style={{color: '#2563eb'}}>P</strong> {u.points || 0}</span>
                  <span>|</span>
                  <span>📞 {u.phoneNumber || '미입력'}</span>
                  <span>|</span>
                  <span>💬 {u.kakaoId || '미입력'}</span>
                </div>
              </div>
              <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>수정</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )}

  {/* TAB 5: 탈퇴 사용자 */}
  {adminTab === 'deleted_users' && (
    <div className="tab-content-section fade-in">
      <div className="section-title">
        <h2 style={{ color: '#ef4444' }}>탈퇴 사용자 목록 <span>({users.filter(u => u.deleted).length})</span></h2>
      </div>
      
      {users.filter(u => u.deleted).length === 0 ? (
        <div className="glass-card empty-state"><p>탈퇴한 사용자가 없습니다.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {users.filter(u => u.deleted).map(u => (
            <div 
              key={u.uid} 
              className="glass-card" 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', opacity: 0.7 }} 
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b', textDecoration: 'line-through' }}>
                  {u.displayName || '이름 없음'} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'normal', textDecoration: 'none' }}>(Lv.{u.level || 1})</span>
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px', display: 'flex', gap: '10px' }}>
                  <span><strong style={{color: '#2563eb'}}>P</strong> {u.points || 0}</span>
                  <span>|</span>
                  <span>📞 {u.phoneNumber || '미입력'}</span>
                  <span>|</span>
                  <span>💬 {u.kakaoId || '미입력'}</span>
                </div>
                <div style={{ marginTop: '10px', color: '#ef4444', fontSize: '0.85rem', backgroundColor: '#fee2e2', padding: '6px 10px', borderRadius: '6px' }}>
                  <strong>탈퇴 사유:</strong> {u.deleteReason || '기록 없음'} <br/>
                  <strong style={{ marginTop: '4px', display: 'block' }}>탈퇴 일시:</strong> {u.deletedAt ? new Date(u.deletedAt).toLocaleString() : '기록 없음'}
                </div>
              </div>
              
              {u.rejoinRequested && (
                <div style={{ marginLeft: '16px' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ fontSize: '0.8rem', padding: '8px 12px', background: '#2563eb' }}
                    onClick={() => handleApproveRejoin(u)}
                  >
                    재가입 승인
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )}

  {/* TAB 4: 광고주 목록 */}
  {adminTab === 'advertisers' && (
    <div className="tab-content-section fade-in">
      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>고정 광고주 <span>({advertisers.length})</span></h2>
        <button 
          className="btn btn-primary" 
          onClick={() => { setEditingAdvertiser(null); setIsAdvertiserModalOpen(true); }}
        >
          <RiAddLine /> 신규 광고주 등록
        </button>
      </div>
      
      {advertisers.length === 0 ? (
        <div className="glass-card empty-state"><p>등록된 광고주가 없습니다.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {advertisers.map(adv => (
            <div 
              key={adv.id} 
              className="glass-card hover-lift" 
              style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => { setEditingAdvertiser(adv); setIsAdvertiserModalOpen(true); }}
            >
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f1f5f9', flexShrink: 0, overflow: 'hidden' }}>
                {adv.logoUrl ? (
                  <img src={adv.logoUrl} alt={adv.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <RiStore2Line style={{ fontSize: '30px', margin: '15px', color: '#94a3b8' }} />
                )}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {adv.name}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {adv.description || '소개글 없음'}
                </p>
                {adv.linkUrl && (
                  <a href={adv.linkUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'none', display: 'inline-block', marginTop: '4px' }} onClick={e => e.stopPropagation()}>
                    링크 열기
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )}

  {/* 사용자 수정 모달 */}
  {editingUser && (
    <AdminUserEditModal 
      user={editingUser} 
      onClose={() => setEditingUser(null)} 
    />
  )}

  {/* 광고주 폼 모달 */}
  {isAdvertiserModalOpen && (
    <AdvertiserFormModal 
      editingAdvertiser={editingAdvertiser}
      onClose={() => { setIsAdvertiserModalOpen(false); setEditingAdvertiser(null); }}
      onSave={handleSaveAdvertiser}
    />
  )}

</div>
  );
}
