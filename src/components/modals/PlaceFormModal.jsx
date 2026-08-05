import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CATEGORIES } from '../../constants/categories';
import { RiCloseLine, RiCheckLine, RiImageAddLine, RiMapPinLine, RiAddLine, RiDeleteBinLine } from 'react-icons/ri';
import { uploadImageToFirebaseStorage } from '../../utils/imageHelper';
import ZoomableImage from '../common/ZoomableImage';
import './PlaceFormModal.css';

const MAGELLAN_BAY_LAT = 10.324571024254213;
const MAGELLAN_BAY_LNG = 124.01382455914299;

function parseCoordinates(inputStr, defaultLat = '', defaultLng = '') {
  if (!inputStr || typeof inputStr !== 'string') {
    return { lat: defaultLat, lng: defaultLng };
  }
  const str = inputStr.trim();
  if (!str) return { lat: defaultLat, lng: defaultLng };

  const atMatch = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  const dMatch = str.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dMatch) {
    return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]) };
  }

  const numbers = str.match(/-?\d+(?:\.\d+)?/g);
  if (numbers && numbers.length >= 2) {
    const lat = parseFloat(numbers[0]);
    const lng = parseFloat(numbers[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  return { lat: defaultLat, lng: defaultLng };
}

function parseInitialPhones(editingPlace) {
  if (editingPlace?.phones && Array.isArray(editingPlace.phones) && editingPlace.phones.length > 0) {
    return editingPlace.phones.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return { number: item.number || '', type: item.type || 'none' };
      }
      return { number: String(item), type: 'none' };
    });
  }
  if (editingPlace?.phone) {
    return [{ number: editingPlace.phone, type: editingPlace.phoneType || 'none' }];
  }
  return [{ number: '', type: 'none' }];
}

function parseInitialSnsList(editingPlace) {
  if (editingPlace?.snsList && Array.isArray(editingPlace.snsList) && editingPlace.snsList.length > 0) {
    return editingPlace.snsList.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return { platform: item.platform && item.platform !== 'custom' ? item.platform : 'k_', handle: item.handle || '' };
      }
      const str = String(item);
      const prefixes = ['k_', 'l_', 'w_', 'f_', 'i_', 't_'];
      for (const p of prefixes) {
        if (str.startsWith(p)) {
          return { platform: p, handle: str.replace(p, '') };
        }
      }
      return { platform: 'k_', handle: str };
    });
  }

  const str = editingPlace?.sns || '';
  if (!str) return [{ platform: 'k_', handle: '' }];
  const prefixes = ['k_', 'l_', 'w_', 'f_', 'i_', 't_'];
  for (const p of prefixes) {
    if (str.startsWith(p)) {
      return [{ platform: p, handle: str.replace(p, '') }];
    }
  }
  return [{ platform: 'k_', handle: str }];
}

export default function PlaceFormModal({ editingPlace, defaultCategory = 'restaurant', onClose, onSave }) {
  const initialCategory = defaultCategory && defaultCategory !== 'all' ? defaultCategory : 'restaurant';

  const [formData, setFormData] = useState({
    name: '',
    category: initialCategory,
    addr: '',
    lat: '',
    lng: '',
    open: '',
    breakTime: '',
    phone: '',
    sns: '',
    explaination: '',
    images: {
      cover: [],
      facility: [],
      product: [],
      menu: []
    }
  });

  const [coordInput, setCoordInput] = useState('');
  const [phoneList, setPhoneList] = useState([{ number: '', type: 'none' }]);
  const [snsList, setSnsList] = useState([{ platform: 'k_', handle: '' }]);
  const [activeImageTab, setActiveImageTab] = useState('cover'); // cover, facility, product, menu

  useEffect(() => {
    if (editingPlace) {
      const lat = editingPlace.lat || '';
      const lng = editingPlace.lng || '';
      setFormData({
        name: editingPlace.name || '',
        category: editingPlace.category || initialCategory,
        addr: editingPlace.addr || '',
        lat: lat,
        lng: lng,
        open: editingPlace.open || '',
        breakTime: editingPlace.breakTime || '',
        phone: editingPlace.phone || '',
        sns: editingPlace.sns || '',
        explaination: editingPlace.explaination || '',
        images: {
          cover: editingPlace.images?.cover || [],
          facility: editingPlace.images?.facility || [],
          product: editingPlace.images?.product || [],
          menu: editingPlace.images?.menu || []
        }
      });
      setCoordInput(`${lat}, ${lng}`);
      setPhoneList(parseInitialPhones(editingPlace));
      setSnsList(parseInitialSnsList(editingPlace));
    } else {
      setCoordInput('');
      setFormData((prev) => ({
        ...prev,
        category: initialCategory,
        lat: '',
        lng: ''
      }));
    }
  }, [editingPlace, defaultCategory]);

  const handleCoordInputChange = (val) => {
    setCoordInput(val);
    const parsed = parseCoordinates(val, formData.lat, formData.lng);
    setFormData((prev) => ({
      ...prev,
      lat: parsed.lat,
      lng: parsed.lng
    }));
  };

  const handleAddPhone = () => {
    setPhoneList((prev) => [...prev, { number: '', type: 'none' }]);
  };

  const handleRemovePhone = (idx) => {
    setPhoneList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePhoneChange = (idx, field, val) => {
    setPhoneList((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleAddSns = () => {
    setSnsList((prev) => [...prev, { platform: 'k_', handle: '' }]);
  };

  const handleRemoveSns = (idx) => {
    setSnsList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSnsChange = (idx, field, val) => {
    setSnsList((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

const compressImageFile = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(event.target.result);
      img.src = event.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressCount, setUploadProgressCount] = useState(0);

  const doFinalSave = (currentFormData = formData) => {
    const finalCoords = parseCoordinates(coordInput, '', '');

    const validPhones = phoneList
      .map((p) => ({ number: p.number.trim(), type: p.type }))
      .filter((p) => p.number.length > 0);

    const validSnsList = snsList
      .map((s) => ({ platform: s.platform, handle: s.handle.trim() }))
      .filter((s) => s.handle.length > 0);

    const primaryPhone = validPhones[0]?.number || '';
    const primaryPhoneType = validPhones[0]?.type || 'none';

    let primarySns = '';
    if (validSnsList[0]) {
      const firstSns = validSnsList[0];
      primarySns = `${firstSns.platform}${firstSns.handle}`;
    }

    onSave({
      ...currentFormData,
      lat: finalCoords.lat,
      lng: finalCoords.lng,
      phone: primaryPhone,
      phoneType: primaryPhoneType,
      phones: validPhones,
      sns: primarySns,
      snsList: validSnsList
    });
  };

  const handleImageFileUpload = async (e, imgType) => {
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

        // Upload to Firebase Cloud Storage for universal access across all devices
        const cloudUrl = await uploadImageToFirebaseStorage(compressedDataUrl, 'places');

        setFormData((prev) => {
          const currentTypeImgs = prev.images[imgType] || [];
          if (currentTypeImgs.length >= 20) {
            alert('각 분류당 최대 20개까지 첨부 가능합니다.');
            return prev;
          }
          const nextImages = {
            ...prev.images,
            [imgType]: [...currentTypeImgs, cloudUrl]
          };
          const updated = { ...prev, images: nextImages };
          return updated;
        });
        setUploadProgressCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Image upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (imgType, index) => {
    setFormData((prev) => ({
      ...prev,
      images: {
        ...prev.images,
        [imgType]: (prev.images[imgType] || []).filter((_, idx) => idx !== index)
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('업체명을 입력해 주세요.');
      return;
    }

    if (!formData.explaination.trim()) {
      alert('업체 소개글을 입력해 주세요.');
      return;
    }

    if (isUploading || uploadProgressCount > 0) {
      alert('📷 사진이 아직 업로드 중입니다. 잠시만 기다려 주세요.');
      return;
    }

    doFinalSave(formData);
  };

  const selectableCategories = CATEGORIES.filter((c) => c.id !== 'all');

  return ReactDOM.createPortal(
    <div className="modal-overlay fade-in">
      <div className="modal-content glass-card place-form-modal">
        <div className="modal-header">
          <h2>{editingPlace ? '업체 정보 수정' : '신규 업체 등록'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <RiCloseLine />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="place-form">
          <div className="modal-body-scroll">
            {/* 기본 정보 */}
            <div className="form-group-row">
              <div className="form-group flex-2">
                <label className="form-label">업체명 *</label>
                <input
                  type="text"
                  placeholder="예: 점보씨푸드 막탄 (Jumbo Seafood Mactan)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label">카테고리 *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-select"
                >
                  {selectableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 주소 및 좌표 */}
            <div className="form-group">
              <label className="form-label">주소 / 위치</label>
              <input
                type="text"
                placeholder="예: Maribago, Lapu-Lapu City, Cebu"
                value={formData.addr}
                onChange={(e) => setFormData({ ...formData, addr: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">지도 좌표 (위도 lat, 경도 lng)</label>
              <div>
                <input
                  type="text"
                  placeholder="예: 10.3173, 123.9048 또는 구글 지도 위치 좌표/링크"
                  value={coordInput}
                  onChange={(e) => handleCoordInputChange(e.target.value)}
                  className="form-input"
                />
                <span className="field-hint" style={{ marginTop: '4px', display: 'block', fontSize: '0.78rem', color: '#64748b' }}>
                  ※ 구글 지도의 '이 위치 공유' 좌표 (예: 10.3173, 123.9048) 또는 URL을 그대로 붙여넣으세요.
                </span>
              </div>
            </div>

            {/* 영업시간 및 휴무일 */}
            <div className="form-group-row">
              <div className="form-group flex-1">
                <label className="form-label">영업시간</label>
                <input
                  type="text"
                  placeholder="예: 11:00 AM - 10:00 PM"
                  value={formData.open}
                  onChange={(e) => setFormData({ ...formData, open: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label">브레이크타임 / 휴무일</label>
                <input
                  type="text"
                  placeholder="예: 연중무휴 / 15:00 - 17:00"
                  value={formData.breakTime}
                  onChange={(e) => setFormData({ ...formData, breakTime: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            {/* 전화번호 목록 (직원 구분 선택 + 추가 기능) */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>전화번호 (현지/한국 번호)</label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddPhone}
                  style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <RiAddLine /> 전화번호 추가
                </button>
              </div>

              {phoneList.map((ph, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <select
                    value={ph.type}
                    onChange={(e) => handlePhoneChange(idx, 'type', e.target.value)}
                    className="form-select"
                    style={{ width: '110px', flexShrink: 0 }}
                  >
                    <option value="none">선택 안함</option>
                    <option value="korean">한국인</option>
                    <option value="filipino">필리핀인</option>
                  </select>
                  <input
                    type="text"
                    placeholder="예: 09171234567"
                    value={ph.number}
                    onChange={(e) => handlePhoneChange(idx, 'number', e.target.value)}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  {phoneList.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon-action delete"
                      onClick={() => handleRemovePhone(idx)}
                      title="전화번호 삭제"
                      style={{ flexShrink: 0 }}
                    >
                      <RiDeleteBinLine />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 카톡 / SNS 아이디 (플랫폼 선택 + 추가 기능) */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>카톡 / SNS 아이디</label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddSns}
                  style={{ fontSize: '0.78rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <RiAddLine /> SNS 추가
                </button>
              </div>

              {snsList.map((snsItem, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <select
                    value={snsItem.platform}
                    onChange={(e) => handleSnsChange(idx, 'platform', e.target.value)}
                    className="form-select"
                    style={{ width: '130px', flexShrink: 0 }}
                  >
                    <option value="k_">카카오톡</option>
                    <option value="l_">라인</option>
                    <option value="w_">위챗</option>
                    <option value="f_">페이스북</option>
                    <option value="i_">인스타그램</option>
                    <option value="t_">텔레그램</option>
                    <option value="h_">홈페이지</option>
                  </select>
                  <input
                    type="text"
                    placeholder="아이디만 입력 (예: jumboseafood)"
                    value={snsItem.handle}
                    onChange={(e) => handleSnsChange(idx, 'handle', e.target.value)}
                    className="form-input"
                    style={{ flex: 1 }}
                  />
                  {snsList.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon-action delete"
                      onClick={() => handleRemoveSns(idx)}
                      title="SNS 삭제"
                      style={{ flexShrink: 0 }}
                    >
                      <RiDeleteBinLine />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 상세 소개글 */}
            <div className="form-group">
              <label className="form-label">업체 상세 소개글 *</label>
              <textarea
                rows="4"
                placeholder="업체에 대한 상세한 안내 및 주요 서비스 내용을 입력하세요."
                value={formData.explaination}
                onChange={(e) => setFormData({ ...formData, explaination: e.target.value })}
                className="form-textarea"
                required
              />
            </div>

            {/* 4종 분류 이미지 관리 */}
            <div className="form-group">
              <label className="form-label">업체 사진 첨부 (4가지 분류별 관리)</label>
              
              <div className="img-type-subtabs">
                <button
                  type="button"
                  className={activeImageTab === 'cover' ? 'active' : ''}
                  onClick={() => setActiveImageTab('cover')}
                >
                  대표사진 ({formData.images.cover?.length || 0})
                </button>
                <button
                  type="button"
                  className={activeImageTab === 'facility' ? 'active' : ''}
                  onClick={() => setActiveImageTab('facility')}
                >
                  시설사진 ({formData.images.facility?.length || 0})
                </button>
                <button
                  type="button"
                  className={activeImageTab === 'product' ? 'active' : ''}
                  onClick={() => setActiveImageTab('product')}
                >
                  제품사진 ({formData.images.product?.length || 0})
                </button>
                <button
                  type="button"
                  className={activeImageTab === 'menu' ? 'active' : ''}
                  onClick={() => setActiveImageTab('menu')}
                >
                  메뉴판 ({formData.images.menu?.length || 0})
                </button>
              </div>

              <div className="image-upload-wrapper" style={{ marginTop: '10px' }}>
                {(formData.images[activeImageTab]?.length || 0) < 20 && (
                  <label className="image-upload-dropzone">
                    <RiImageAddLine className="upload-icon" />
                    <span>이미지 추가</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageFileUpload(e, activeImageTab)}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}

                {(formData.images[activeImageTab] || []).map((imgUrl, idx) => (
                  <div key={`${activeImageTab}-${idx}`} className="uploaded-img-preview">
                    <ZoomableImage
                      src={imgUrl}
                      images={formData.images[activeImageTab]}
                      initialIndex={idx}
                      alt={`preview-${idx}`}
                      showZoomHint={false}
                    />
                    <button
                      type="button"
                      className="remove-img-btn"
                      onClick={() => handleRemoveImage(activeImageTab, idx)}
                      title="삭제"
                    >
                      <RiCloseLine />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={isUploading || uploadProgressCount > 0}>
              <RiCheckLine /> {isUploading || uploadProgressCount > 0 ? `사진 업로드 중... (${uploadProgressCount})` : (editingPlace ? '수정 완료' : '등록 하기')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
