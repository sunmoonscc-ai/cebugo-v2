import React from 'react';
import { usePlaces } from '../../context/PlacesContext';
import { RiCheckLine, RiCloseLine, RiAdminLine } from 'react-icons/ri';
import './AdminSubmissionsPage.css';

export default function AdminSubmissionsPage() {
  const { submissions, approveSubmission, rejectSubmission } = usePlaces();

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending');
  const processedSubmissions = submissions.filter((s) => s.status !== 'pending');

  return (
    <div className="page-content fade-in">
      <div className="admin-header">
        <h1><RiAdminLine /> 관리자 - 제보 승인함</h1>
        <p>사용자 제보(Diff 비교)를 검토하고 승인 시 포인트(+50p)를 지급합니다.</p>
      </div>

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
  );
}
