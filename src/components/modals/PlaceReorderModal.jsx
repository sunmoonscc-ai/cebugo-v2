import React, { useState } from 'react';
import { RiCloseLine, RiCheckLine, RiDragMove2Line, RiArrowUpLine, RiArrowDownLine } from 'react-icons/ri';
import './PlaceReorderModal.css';

export default function PlaceReorderModal({ places, onClose, onSave }) {
  const [tempList, setTempList] = useState([...places]);

  const handleMove = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tempList.length) return;

    const updated = [...tempList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setTempList(updated);
  };

  const handleSave = () => {
    onSave(tempList);
  };

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div className="modal-content glass-card reorder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><RiDragMove2Line /> 업체 목록 표시 순서 변경</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <RiCloseLine />
          </button>
        </div>
        <div className="modal-body-scroll" style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
            기본적으로 업체는 가나다순으로 자동 정렬되나, 아래 위/아래 버튼으로 관리자 추천 순서를 우선 지정할 수 있습니다.
          </p>
          <div className="reorder-list">
            {tempList.map((item, idx) => (
              <div key={item.id} className="reorder-item-card">
                <div className="reorder-item-left">
                  <span className="reorder-index-badge">{idx + 1}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span className="category-chip" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                      {item.categoryName}
                    </span>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', marginTop: '2px' }}>
                      {item.name}
                    </div>
                  </div>
                </div>
                <div className="reorder-item-actions">
                  <button
                    type="button"
                    className="btn-icon-action move"
                    onClick={() => handleMove(idx, 'up')}
                    disabled={idx === 0}
                    title="위로 이동"
                  >
                    <RiArrowUpLine /> 위로
                  </button>
                  <button
                    type="button"
                    className="btn-icon-action move"
                    onClick={() => handleMove(idx, 'down')}
                    disabled={idx === tempList.length - 1}
                    title="아래로 이동"
                  >
                    <RiArrowDownLine /> 아래로
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            <RiCheckLine /> 순서 저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
