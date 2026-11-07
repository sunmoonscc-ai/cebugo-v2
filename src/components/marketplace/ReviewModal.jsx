import React, { useState } from 'react';
import { 
  RiCloseLine, 
  RiStarFill, 
  RiThumbUpLine, 
  RiHeartLine, 
  RiEmotionHappyLine,
  RiEmotionNormalLine,
  RiEmotionUnhappyLine
} from 'react-icons/ri';
import './ReviewModal.css';

const POSITIVE_TAGS = [
  "친절하고 매너가 좋아요 😊",
  "시간 약속을 잘 지켜요 ⏰",
  "응답이 매우 빨라요 ⚡",
  "물품 상태가 설명과 같아요 ✨",
  "좋은 물품을 나눔/착한 가격에 주셨어요 🎁"
];

export default function ReviewModal({ targetName, onSubmit, onClose }) {
  const [rating, setRating] = useState('great'); // 'great' | 'good' | 'bad'
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      rating,
      mannerTags: selectedTags,
      comment: comment.trim()
    });
  };

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <h3>거래 후기 남기기</h3>
          <button className="review-close-btn" onClick={onClose}>
            <RiCloseLine size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="review-modal-body">
          <p className="review-target-desc">
            <strong>{targetName}</strong>님과의 거래는 어떠셨나요?
          </p>

          {/* Rating Emoji Select */}
          <div className="rating-select-group">
            <button
              type="button"
              className={`rating-emoji-btn ${rating === 'great' ? 'active' : ''}`}
              onClick={() => setRating('great')}
            >
              <RiEmotionHappyLine size={32} color={rating === 'great' ? '#ea580c' : '#94a3b8'} />
              <span>최고예요!</span>
            </button>
            <button
              type="button"
              className={`rating-emoji-btn ${rating === 'good' ? 'active' : ''}`}
              onClick={() => setRating('good')}
            >
              <RiEmotionNormalLine size={32} color={rating === 'good' ? '#0284c7' : '#94a3b8'} />
              <span>좋았어요</span>
            </button>
            <button
              type="button"
              className={`rating-emoji-btn ${rating === 'bad' ? 'active' : ''}`}
              onClick={() => setRating('bad')}
            >
              <RiEmotionUnhappyLine size={32} color={rating === 'bad' ? '#64748b' : '#94a3b8'} />
              <span>별로예요</span>
            </button>
          </div>

          {/* Manner Tags */}
          <div className="manner-tags-title">어떤 점이 좋았나요? (선택)</div>
          <div className="manner-tags-grid">
            {POSITIVE_TAGS.map((tag, idx) => (
              <button
                type="button"
                key={idx}
                className={`manner-tag-chip ${selectedTags.includes(tag) ? 'selected' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Comment */}
          <textarea
            className="review-comment-input"
            rows="3"
            placeholder="따뜻한 거래 후기를 남겨주세요. 남겨주신 후기는 상대방의 거래 신뢰도에 반영됩니다."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button type="submit" className="review-submit-btn">
            후기 보내기
          </button>
        </form>
      </div>
    </div>
  );
}

