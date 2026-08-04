import React, { useState } from 'react';
import { usePlaces } from '../../context/PlacesContext';
import { useAuth } from '../../context/AuthContext';
import { RiCloseLine, RiSendPlaneFill } from 'react-icons/ri';
import './SuggestEditModal.css';

export default function SuggestEditModal({ place, onClose }) {
  const { addSubmission } = usePlaces();
  const { userProfile } = useAuth();

  const [field, setField] = useState('영업시간');
  const [newValue, setNewValue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    addSubmission({
      placeId: place.id,
      placeName: place.name,
      uid: userProfile?.uid || 'guest',
      userName: userProfile?.displayName || '방문자',
      field,
      oldValue: place[field === '영업시간' ? 'open' : field === '전화번호' ? 'phone' : 'explaination'] || '정보 없음',
      newValue
    });

    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card glass-card fade-in">
        <div className="modal-header">
          <h3>정보 수정 제안 (포인트 지급)</h3>
          <button className="close-btn" onClick={onClose}><RiCloseLine /></button>
        </div>

        {submitted ? (
          <div className="modal-success">
            <h4>제안이 성공적으로 제출되었습니다!</h4>
            <p>관리자 승인 완료 시 <strong>+15p</strong>가 적립됩니다.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <p className="form-subtitle">[{place.name}]의 오탈자나 최신 정보를 제보해주세요.</p>

            <label className="form-label">수정 항목 선택</label>
            <select value={field} onChange={(e) => setField(e.target.value)} className="form-select">
              <option value="영업시간">영업시간 및 휴무일</option>
              <option value="전화번호">전화번호 / 통신사</option>
              <option value="소개글">업체 설명 / 메뉴 변경</option>
              <option value="SNS">카카오톡 / SNS 아이디</option>
            </select>

            <label className="form-label">새로운 정확한 정보 입력</label>
            <textarea
              rows="4"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="예: 영업시간이 오전 10시부터 밤 11시까지로 변경되었습니다."
              className="form-textarea"
              required
            />

            <button type="submit" className="btn btn-primary form-submit-btn">
              <RiSendPlaneFill /> 제안 제출하기
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
