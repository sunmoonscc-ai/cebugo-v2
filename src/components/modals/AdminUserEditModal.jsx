import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { RiCloseLine, RiCheckLine } from 'react-icons/ri';
import { db } from '../../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

export default function AdminUserEditModal({ user, onClose }) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    level: user.level || 1,
    points: user.points || 0,
    phoneNumber: user.phoneNumber || '',
    kakaoId: user.kakaoId || '',
    pointReason: '',
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const parsedPoints = parseInt(formData.points, 10);
      const parsedLevel = parseInt(formData.level, 10);
      
      const updateData = {
        displayName: formData.displayName,
        level: isNaN(parsedLevel) ? user.level : parsedLevel,
        points: isNaN(parsedPoints) ? user.points : parsedPoints,
        phoneNumber: formData.phoneNumber,
        kakaoId: formData.kakaoId
      };

      if (updateData.points !== user.points) {
        const pointDiff = updateData.points - user.points;
        const reason = formData.pointReason.trim() || '관리자 직권 수정';
        const newLedgerItem = {
          id: `admin_adj_${Date.now()}`,
          title: reason,
          points: Math.abs(pointDiff),
          date: new Date().toISOString().split('T')[0],
          type: pointDiff > 0 ? 'plus' : 'minus'
        };
        updateData.pointLedger = [newLedgerItem, ...(user.pointLedger || [])];
      }

      await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
      alert(`성공적으로 수정되었습니다!\n\n- 대상 사용자 UID: ${user.uid}\n- 수정된 포인트: ${updateData.points}p\n\n(참고: 내 프로필과 대상 사용자가 다를 경우 내 프로필 화면에는 반영되지 않습니다.)`);
      onClose();
    } catch (err) {
      console.error('Failed to update user:', err);
      alert(`수정에 실패했습니다: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay fade-in">
      <div className="modal-content glass-card" style={{ maxWidth: '400px', width: '90%' }}>
        <div className="modal-header">
          <h2>사용자 정보 수정</h2>
          <button className="modal-close-btn" onClick={onClose}><RiCloseLine /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>이름 (닉네임)</label>
            <input 
              type="text" 
              className="form-input"
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
              required
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>레벨</label>
              <input 
                type="number" 
                className="form-input"
                value={formData.level}
                onChange={(e) => setFormData({...formData, level: e.target.value})}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>포인트</label>
              <input 
                type="number" 
                className="form-input"
                value={formData.points}
                onChange={(e) => setFormData({...formData, points: e.target.value})}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>포인트 조정 사유 (선택, 포인트 수정시에만 기록됨)</label>
            <input 
              type="text" 
              className="form-input"
              value={formData.pointReason}
              onChange={(e) => setFormData({...formData, pointReason: e.target.value})}
              placeholder="예: 이벤트 당첨, 페널티 등"
            />
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>전화번호</label>
            <input 
              type="text" 
              className="form-input"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            />
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>카카오톡 아이디</label>
            <input 
              type="text" 
              className="form-input"
              value={formData.kakaoId}
              onChange={(e) => setFormData({...formData, kakaoId: e.target.value})}
            />
          </div>
          
          <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              <RiCheckLine /> {isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
