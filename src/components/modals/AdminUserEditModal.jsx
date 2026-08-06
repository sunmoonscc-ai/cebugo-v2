import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { RiCloseLine, RiCheckLine } from 'react-icons/ri';
import { db } from '../../firebase/config';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { LEVEL_TABLE } from '../../utils/imageHelper';

export default function AdminUserEditModal({ user, onClose }) {
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    level: user.level || 1,
    points: user.points || 0,
    phoneNumber: user.phoneNumber || '',
    phoneNumberKr: user.phoneNumberKr || '',
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
        phoneNumberKr: formData.phoneNumberKr,
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

      if (updateData.level !== user.level) {
        const batch = writeBatch(db);
        const q = query(collection(db, 'cebugo_marketplace'), where('sellerUid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docSnap) => {
          batch.update(docSnap.ref, { sellerLevel: updateData.level });
        });
        await batch.commit();
      }

      alert(`성공적으로 수정되었습니다!\n\n- 대상 사용자 UID: ${user.uid}\n- 수정된 포인트: ${updateData.points}p\n- 수정된 레벨: ${updateData.level}\n\n(참고: 내 프로필과 대상 사용자가 다를 경우 내 프로필 화면에는 반영되지 않습니다.)`);
      onClose();
    } catch (err) {
      console.error('Failed to update user:', err);
      alert(`수정에 실패했습니다: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    const reason = window.prompt(`정말 이 사용자를 강제 탈퇴(삭제)하시겠습니까?\n탈퇴 사유를 입력해주세요.\n\n- 대상 UID: ${user.uid}\n- 이름: ${user.displayName}`);
    if (reason === null) return;

    try {
      setIsSaving(true);
      await setDoc(doc(db, 'users', user.uid), {
        deleted: true,
        deleteReason: reason || '관리자 강제 탈퇴 (사유 미기재)',
        deletedAt: new Date().toISOString()
      }, { merge: true });
      alert('사용자가 성공적으로 삭제(탈퇴 처리)되었습니다.');
      onClose();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert(`삭제에 실패했습니다: ${err.message}`);
      setIsSaving(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay fade-in">
      <div className="modal-content glass-card" style={{ maxWidth: '440px', width: '90%', padding: '24px' }}>
        <div className="modal-header">
          <h2>사용자 정보 수정</h2>
          <button className="modal-close-btn" onClick={onClose}><RiCloseLine /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '10px 4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>이름 (닉네임)</label>
            <input 
              type="text" 
              className="form-input"
              value={formData.displayName}
              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
              required
            />
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>레벨</label>
              <input 
                type="number" 
                className="form-input"
                value={formData.level}
                onChange={(e) => {
                  const newLevel = parseInt(e.target.value, 10);
                  if (!isNaN(newLevel)) {
                    const targetLevelObj = LEVEL_TABLE.find(item => item.level === newLevel);
                    if (targetLevelObj) {
                      setFormData({...formData, level: newLevel, points: targetLevelObj.totalPt});
                    } else {
                      setFormData({...formData, level: newLevel});
                    }
                  } else {
                    setFormData({...formData, level: e.target.value});
                  }
                }}
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

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>포인트 조정 사유 (선택, 포인트 수정시에만 기록됨)</label>
            <input 
              type="text" 
              className="form-input"
              value={formData.pointReason}
              onChange={(e) => setFormData({...formData, pointReason: e.target.value})}
              placeholder="예: 이벤트 당첨, 페널티 등"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>한국 전화번호</label>
            <input 
              type="text" 
              className="form-input"
              value={formData.phoneNumberKr}
              onChange={(e) => setFormData({...formData, phoneNumberKr: e.target.value})}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>필리핀 전화번호</label>
            <input 
              type="text" 
              className="form-input"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>카카오톡 아이디</label>
            <input 
              type="text" 
              className="form-input"
              value={formData.kakaoId}
              onChange={(e) => setFormData({...formData, kakaoId: e.target.value})}
            />
          </div>
          
          <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="button" className="btn" style={{ background: '#ef4444', color: 'white', marginRight: 'auto' }} onClick={handleDeleteUser}>
              회원 탈퇴 처리
            </button>
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
