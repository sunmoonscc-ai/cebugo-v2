import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { classifyPhoneCarrier } from '../../utils/phoneSnsClassifier';
import { RiCloseLine, RiSmartphoneLine, RiShieldCheckFill } from 'react-icons/ri';

export default function PhoneAuthModal({ onClose }) {
  const { updateUserProfile, userProfile } = useAuth();
  const { addSubmission } = usePlaces();
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');

  const handleRequestVerification = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    
    // Save to profile
    await updateUserProfile({ phoneNumber });
    
    // Send to admin
    addSubmission({
      type: 'verification',
      field: 'phone',
      oldValue: '미인증',
      newValue: phoneNumber,
      uid: userProfile?.uid,
      userName: userProfile?.displayName || '사용자',
      placeId: 'verification',
      placeName: '현지 휴대폰 인증 요청'
    });
    
    alert('휴대폰 번호 등록 및 관리자 인증 신청이 완료되었습니다.');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card glass-card fade-in">
        <div className="modal-header">
          <h3><RiSmartphoneLine /> 필리핀 현지폰 인증 (+63)</h3>
          <button className="close-btn" onClick={onClose}><RiCloseLine /></button>
        </div>

        <form onSubmit={handleRequestVerification}>
          <p className="form-subtitle">중고물품 거래 글작성을 위해 필리핀 로컬 번호(+63) 인증이 필요합니다.<br/>번호를 입력하고 신청하시면 관리자가 확인 후 승인해 드립니다.</p>
          <label className="form-label">필리핀 휴대폰 번호 입력</label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="09171234567"
            className="form-input"
            required
          />
          <button type="submit" className="btn btn-primary form-submit-btn">
            관리자에게 인증 신청하기
          </button>
        </form>
      </div>
    </div>
  );
}
