import React, { useState, useEffect } from 'react';
import { 
  RiCloseLine, 
  RiNotification3Line, 
  RiAddLine, 
  RiDeleteBinLine,
  RiPriceTag3Line 
} from 'react-icons/ri';
import { getUserKeywords, addUserKeyword, removeUserKeyword } from '../../services/chatService';
import './KeywordWatchModal.css';

export default function KeywordWatchModal({ currentUser, onClose }) {
  const [keywords, setKeywords] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;
    loadKeywords();
  }, [currentUser?.uid]);

  const loadKeywords = async () => {
    try {
      setLoading(true);
      const list = await getUserKeywords(currentUser.uid);
      setKeywords(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    if (keywords.length >= 15) {
      alert('키워드는 최대 15개까지 등록할 수 있습니다.');
      return;
    }
    await addUserKeyword(currentUser.uid, inputVal.trim());
    setInputVal('');
    await loadKeywords();
  };

  const handleRemove = async (kw) => {
    await removeUserKeyword(currentUser.uid, kw);
    await loadKeywords();
  };

  return (
    <div className="keyword-modal-overlay" onClick={onClose}>
      <div className="keyword-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="keyword-modal-header">
          <div className="header-title-box">
            <RiNotification3Line size={20} color="#ea580c" />
            <span>키워드 알림 설정</span>
          </div>
          <button className="keyword-close-btn" onClick={onClose}>
            <RiCloseLine size={22} />
          </button>
        </div>

        <div className="keyword-modal-body">
          <p className="keyword-desc">
            관심 있는 단어를 등록해두면, 해당 단어가 포함된 중고 매물이 등록될 때 맞춤 안내를 받을 수 있습니다. (최대 15개)
          </p>

          <form onSubmit={handleAdd} className="keyword-add-form">
            <input
              type="text"
              placeholder="알림 받을 키워드 (예: 유모차, 골프, 아이폰)"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="keyword-input"
            />
            <button type="submit" className="keyword-add-btn">
              <RiAddLine size={18} />
              <span>등록</span>
            </button>
          </form>

          <div className="registered-keywords-wrap">
            <div className="registered-title">
              <span>등록된 키워드 ({keywords.length}/15)</span>
            </div>

            {loading ? (
              <div className="keyword-empty">불러오는 중...</div>
            ) : keywords.length === 0 ? (
              <div className="keyword-empty">
                <RiPriceTag3Line size={32} color="#cbd5e1" />
                <p>등록된 키워드가 없습니다.</p>
                <span>자주 찾는 중고 물품 키워드를 등록해보세요!</span>
              </div>
            ) : (
              <div className="keyword-chips-list">
                {keywords.map((kw, idx) => (
                  <span key={idx} className="keyword-item-chip">
                    <span className="kw-text">{kw}</span>
                    <button 
                      type="button" 
                      className="kw-del-btn"
                      onClick={() => handleRemove(kw)}
                      title="삭제"
                    >
                      <RiCloseLine size={16} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

