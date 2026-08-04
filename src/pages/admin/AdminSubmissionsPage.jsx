import React, { useState, useEffect } from 'react';
import { usePlaces } from '../../context/PlacesContext';
import { db } from '../../firebase/config';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { 
  RiCheckLine, 
  RiCloseLine, 
  RiAdminLine, 
  RiSpeedUpLine,
  RiNotification3Line,
  RiFileCheckLine,
  RiHistoryLine
} from 'react-icons/ri';
import './AdminSubmissionsPage.css';

export default function AdminSubmissionsPage() {
  const { submissions, approveSubmission, rejectSubmission } = usePlaces();

  const [adminTab, setAdminTab] = useState('notice'); // 'notice' (공지/속도) or 'submission' (제보)
  const [noticeSpeedMultiplier, setNoticeSpeedMultiplier] = useState(1);
  const [adSpeedMultiplier, setAdSpeedMultiplier] = useState(1);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'cebugo_config', 'ticker_speed'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNoticeSpeedMultiplier(data.noticeSpeedMultiplier || 1);
        setAdSpeedMultiplier(data.adSpeedMultiplier || 1);
      }
    });
    return () => unsub();
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

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending');
  const processedSubmissions = submissions.filter((s) => s.status !== 'pending');

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
                <span className="user-tag">제보자: {sub.userName}</span>
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
                onClick={() => approveSubmission(sub.id)}
              >
                <RiCheckLine /> 승인 및 포인트 지급 (+50p)
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
          <div key={sub.id} className="glass-card processed-card">
            <div>
              <strong>[{sub.placeName}] {sub.field}</strong>
              <p className="proc-val">반영값: {sub.newValue}</p>
            </div>
            <span className={`sub-status ${sub.status}`}>
              {sub.status === 'approved' ? '승인완료' : '거절됨'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )}
</div>
  );
}
