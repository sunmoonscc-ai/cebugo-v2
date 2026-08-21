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
    phoneVerified: user.phoneVerified || false,
    phoneKr: user.phoneKr || '',
    phoneKrVerified: user.phoneKrVerified || false,
    kakaoId: user.kakaoId || '',
    kakaoVerified: user.kakaoVerified || false,
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
        phoneVerified: formData.phoneVerified,
        phoneKr: formData.phoneKr,
        phoneKrVerified: formData.phoneKrVerified,
        kakaoId: formData.kakaoId,
        kakaoVerified: formData.kakaoVerified
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
          
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: '#1e293b' }}>UID:</strong> {user.uid}</div>
            <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: '#1e293b' }}>구글 이메일:</strong> {user.email || '정보 없음'}</div>
            <div><strong style={{ color: '#1e293b' }}>가입일:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '알 수 없음'}</div>
            <div><strong style={{ color: '#1e293b' }}>최근 접속일:</strong> {user.lastCheckInDate || '알 수 없음'}</div>
            <div><strong style={{ color: '#1e293b' }}>연속 출석:</strong> {user.consecutiveDays || 0}일</div>
          </div>

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
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="text" 
                className="form-input"
                style={{ flex: 1 }}
                value={formData.phoneKr}
                onChange={(e) => setFormData({...formData, phoneKr: e.target.value})}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.phoneKrVerified}
                  onChange={(e) => setFormData({...formData, phoneKrVerified: e.target.checked})}
                />
                인증됨
              </label>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>필리핀 전화번호</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="text" 
                className="form-input"
                style={{ flex: 1 }}
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.phoneVerified}
                  onChange={(e) => setFormData({...formData, phoneVerified: e.target.checked})}
                />
                인증됨
              </label>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>카카오톡 아이디</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="text" 
                className="form-input"
                style={{ flex: 1 }}
                value={formData.kakaoId}
                onChange={(e) => setFormData({...formData, kakaoId: e.target.value})}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.kakaoVerified}
                  onChange={(e) => setFormData({...formData, kakaoVerified: e.target.checked})}
                />
                인증됨
              </label>
            </div>
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
