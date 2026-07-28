import React, { useState } from 'react';
import { RiCloseLine, RiCheckLine, RiDragMove2Line, RiArrowUpLine, RiArrowDownLine } from 'react-icons/ri';

export default function AdReorderModal({ posts, activeCategory, onClose, onSave }) {
  const [tempList, setTempList] = useState([...posts]);

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

  const categoryLabel = activeCategory === 'ad' ? '광고' : '이벤트';

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div className="modal-content glass-card reorder-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '92%' }}>
        <div className="modal-header">
          <h2><RiDragMove2Line /> {categoryLabel} 표시 순서 변경</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <RiCloseLine />
          </button>
        </div>
        <div className="modal-body-scroll" style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
            {categoryLabel} 항목의 위/아래 버튼을 눌러 목록 표시 순서를 조정하세요.
          </p>
          <div className="reorder-list">
            {tempList.map((item, idx) => (
              <div key={item.id} className="reorder-item-card">
                <div className="reorder-item-left">
                  <span className="reorder-index-badge">{idx + 1}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span className="notice-badge-tag" style={{ fontSize: '0.7rem' }}>
                      {item.category === 'ad' ? '📣 광고' : '🎉 이벤트'}
                    </span>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b', marginTop: '2px' }}>
                      {item.title}
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
