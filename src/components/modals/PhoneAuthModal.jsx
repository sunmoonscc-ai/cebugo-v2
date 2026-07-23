import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { classifyPhoneCarrier } from '../../utils/phoneSnsClassifier';
import { RiCloseLine, RiSmartphoneLine, RiShieldCheckFill } from 'react-icons/ri';

export default function PhoneAuthModal({ onClose }) {
  const { verifyPhoneMock } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('09171234567');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState(1); // 1: Input, 2: OTP
  const [carrier, setCarrier] = useState('Globe');

  const handleSendOtp = (e) => {
    e.preventDefault();
    const detectedCarrier = classifyPhoneCarrier(phoneNumber);
    setCarrier(detectedCarrier);
    setStep(2);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    verifyPhoneMock(phoneNumber);
    setStep(3);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card glass-card fade-in">
        <div className="modal-header">
          <h3><RiSmartphoneLine /> 필리핀 현지폰 인증 (+63)</h3>
          <button className="close-btn" onClick={onClose}><RiCloseLine /></button>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <p className="form-subtitle">중고물품 거래 글작성을 위해 필리핀 로컬 번호(+63) 인증이 필요합니다.</p>
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
              SMS 인증번호 발송
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <p className="form-subtitle">
              [{carrier}] {phoneNumber} 번호로 발송된 6자리 인증코드를 입력해주세요. (테스트용: 아무 번호)
            </p>
            <label className="form-label">인증번호 6자리</label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              className="form-input"
              required
            />
            <button type="submit" className="btn btn-primary form-submit-btn">
              인증 완료하기
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="modal-success">
            <RiShieldCheckFill style={{ fontSize: '3rem', color: '#10b981' }} />
            <h4>현지폰 인증 완료!</h4>
            <p>이제 중고물품 매물을 자유롭게 등록하실 수 있습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
