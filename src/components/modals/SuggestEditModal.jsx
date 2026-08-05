import React, { useState, useEffect } from 'react';
import { usePlaces } from '../../context/PlacesContext';
import { useAuth } from '../../context/AuthContext';
import { RiCloseLine, RiSendPlaneFill, RiImageAddLine } from 'react-icons/ri';
import { uploadImageToFirebaseStorage, compressImageDataUrl } from '../../utils/imageHelper';
import ZoomableImage from '../common/ZoomableImage';
import './SuggestEditModal.css';

export default function SuggestEditModal({ place, onClose }) {
  const { addSubmission } = usePlaces();
  const { userProfile } = useAuth();

  const [field, setField] = useState('영업시간');
  const [newValue, setNewValue] = useState('');
  const [images, setImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressCount, setUploadProgressCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);



  const compressImageFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        resolve(compressImageDataUrl(ev.target.result, 1200, 0.8));
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploading(true);
    setUploadProgressCount((prev) => prev + files.length);

    try {
      for (const file of files) {
        const compressedDataUrl = await compressImageFile(file);
        if (!compressedDataUrl) {
          setUploadProgressCount((prev) => Math.max(0, prev - 1));
          continue;
        }

        const cloudUrl = await uploadImageToFirebaseStorage(compressedDataUrl, 'submissions');

        setImages((prev) => {
          if (prev.length >= 20) {
            alert('사진은 최대 20장까지 첨부 가능합니다.');
            return prev;
          }
          return [...prev, cloudUrl];
        });
        setUploadProgressCount((prev) => Math.max(0, prev - 1));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    if (isUploading || uploadProgressCount > 0) {
      alert('📷 사진이 아직 업로드 중입니다. 잠시만 기다려 주세요.');
      return;
    }

    addSubmission({
      placeId: place.id,
      placeName: place.name,
      uid: userProfile?.uid || 'guest',
      userName: userProfile?.displayName || '방문자',
      userLevel: userProfile?.level || 1,
      field,
      oldValue: place[field === '영업시간' ? 'open' : field === '전화번호' ? 'phone' : 'explaination'] || '정보 없음',
      newValue,
      images
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
          <h3>사진 제공 및 정보수정 제안 (포인트 지급)</h3>
          <button className="close-btn" onClick={onClose}><RiCloseLine /></button>
        </div>

        {submitted ? (
          <div className="modal-success">
            <h4>제안이 성공적으로 제출되었습니다!</h4>
            <p>관리자 검토 및 반영 시 <strong>포인트</strong>가 지급됩니다.</p>
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
              <option value="기타">기타 / 사진 추가 등</option>
            </select>

            <label className="form-label">새로운 정확한 정보 입력 (또는 사진에 대한 설명)</label>
            <textarea
              rows="3"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="예: 영업시간이 오전 10시부터 밤 11시까지로 변경되었습니다. (사진만 제보하실 경우 사진에 대한 설명을 적어주세요)"
              className="form-textarea"
              required
            />

            <label className="form-label" style={{ marginTop: '16px' }}>사진 첨부 (최대 20장)</label>
            <div className="image-upload-wrapper" style={{ marginTop: '4px' }}>
              {images.length < 20 && (
                <label className="image-upload-dropzone" style={{ minHeight: '80px', padding: '12px' }}>
                  <RiImageAddLine className="upload-icon" style={{ fontSize: '24px' }} />
                  <span style={{ fontSize: '0.85rem' }}>이미지 추가</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              )}

              {images.map((imgUrl, idx) => (
                <div key={`suggest-${idx}`} className="uploaded-img-preview" style={{ width: '80px', height: '80px' }}>
                  <ZoomableImage
                    src={imgUrl}
                    images={images}
                    initialIndex={idx}
                    alt={`preview-${idx}`}
                    showZoomHint={false}
                  />
                  <button
                    type="button"
                    className="remove-img-btn"
                    onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                    title="삭제"
                  >
                    <RiCloseLine />
                  </button>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '8px', lineHeight: '1.4' }}>
              ※ 공유해주신 사진은 검토 후 선별하여 본 프로그램에 등록 후 사용됩니다. 이 내용에 동의하시는 사진만 올려주시면 됩니다.
            </p>

            <button type="submit" className="btn btn-primary form-submit-btn" disabled={isUploading || uploadProgressCount > 0} style={{ marginTop: '20px' }}>
              <RiSendPlaneFill /> {isUploading || uploadProgressCount > 0 ? `사진 업로드 중... (${uploadProgressCount})` : '제안 제출하기'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
