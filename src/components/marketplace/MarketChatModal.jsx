import React, { useState, useEffect, useRef } from 'react';
import { 
  RiCloseLine, 
  RiSendPlane2Fill, 
  RiShieldCheckLine, 
  RiShoppingBag3Line,
  RiArrowLeftLine,
  RiMoneyDollarCircleLine,
  RiCalendarEventLine,
  RiCheckLine,
  RiMapPinLine,
  RiImageAddLine,
  RiStarFill
} from 'react-icons/ri';
import { 
  subscribeChatMessages, 
  sendChatMessage, 
  markRoomAsRead,
  updateChatListingStatus,
  submitTransactionReview
} from '../../services/chatService';
import ReviewModal from './ReviewModal';
import './MarketChatModal.css';

const QUICK_QUESTIONS = [
  "안녕하세요, 아직 구매 가능한가요?",
  "직거래 희망 장소와 시간 알려주세요!",
  "네고(가격 제안) 조금 가능할까요?",
  "지금 바로 출발할 수 있습니다!"
];

export default function MarketChatModal({ room, currentUser, onClose, onBackToList }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  
  // Proposal & Appointment Modal/Drawer toggles
  const [showProposalBox, setShowProposalBox] = useState(false);
  const [proposalAmount, setProposalAmount] = useState('');
  const [showAppointmentBox, setShowAppointmentBox] = useState(false);
  const [appointmentPlace, setAppointmentPlace] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');

  // Review Modal state (Item 1)
  const [showReviewModal, setShowReviewModal] = useState(false);

  const [currentListingStatus, setCurrentListingStatus] = useState(room?.listingStatus || 'available');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const isSeller = currentUser?.uid === room?.sellerUid;
  const otherUid = isSeller ? room?.buyerUid : room?.sellerUid;
  const otherName = isSeller ? (room?.buyerName || '구매자') : (room?.sellerName || '판매자');

  useEffect(() => {
    if (!room?.id) return;

    markRoomAsRead(room.id, currentUser?.uid);

    const unsubscribe = subscribeChatMessages(room.id, (msgs) => {
      setMessages(msgs);
      markRoomAsRead(room.id, currentUser?.uid);
    });

    return () => unsubscribe();
  }, [room?.id, currentUser?.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e, textToSend = null, type = 'text', payload = null) => {
    if (e) e.preventDefault();
    const finalMsg = textToSend || inputText;
    if (!finalMsg.trim() && type === 'text') return;
    if (sending) return;

    try {
      setSending(true);
      if (!textToSend && type === 'text') setInputText('');
      await sendChatMessage({
        roomId: room.id,
        senderUid: currentUser.uid,
        senderName: currentUser.displayName || '사용자',
        text: finalMsg,
        type,
        payload,
        otherUid
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  // Chat Image Upload (Item 2)
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      await handleSend(null, '사진', 'image', { imageUrl: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Submit Price Proposal
  const handleSendProposal = async (e) => {
    e.preventDefault();
    const cleanAmount = proposalAmount.replace(/[^0-9.]/g, '');
    if (!cleanAmount) return;
    const msgText = `${Number(cleanAmount).toLocaleString()} PHP로 가격을 제안합니다.`;
    await handleSend(null, msgText, 'proposal', { amount: cleanAmount });
    setShowProposalBox(false);
    setProposalAmount('');
  };

  // Submit Appointment
  const handleSendAppointment = async (e) => {
    e.preventDefault();
    if (!appointmentPlace.trim() || !appointmentTime.trim()) return;
    const msgText = `[거래 약속] 장소: ${appointmentPlace} / 일시: ${appointmentTime}`;
    await handleSend(null, msgText, 'appointment', {
      place: appointmentPlace,
      time: appointmentTime
    });
    setShowAppointmentBox(false);
    setAppointmentPlace('');
    setAppointmentTime('');
  };

  // Update Status by Seller
  const handleStatusChange = async (newStatus) => {
    try {
      await updateChatListingStatus({
        roomId: room.id,
        listingId: room.listingId,
        newStatus
      });
      setCurrentListingStatus(newStatus);
      const statusLabel = newStatus === 'sold' ? '거래완료' : (newStatus === 'reserved' ? '예약중' : '판매중');
      await handleSend(null, `판매자가 매물 상태를 [${statusLabel}](으)로 변경했습니다.`);
      if (newStatus === 'sold') {
        setShowReviewModal(true);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('상태 변경에 실패했습니다.');
    }
  };

  // Handle Review Submission (Item 1)
  const handleReviewSubmit = async (reviewData) => {
    try {
      await submitTransactionReview({
        roomId: room.id,
        listingId: room.listingId,
        reviewerUid: currentUser.uid,
        reviewerName: currentUser.displayName || '사용자',
        targetUid: otherUid,
        rating: reviewData.rating,
        mannerTags: reviewData.mannerTags,
        comment: reviewData.comment
      });

      const ratingLabel = reviewData.rating === 'great' ? '최고예요! 👍' : (reviewData.rating === 'good' ? '좋았어요 😊' : '별로예요');
      const tagsText = reviewData.mannerTags.length > 0 ? ` (${reviewData.mannerTags.join(', ')})` : '';
      await handleSend(null, `[거래 후기 작성 완료] ${ratingLabel}${tagsText}${reviewData.comment ? ` : "${reviewData.comment}"` : ''}`, 'review', reviewData);
      
      setShowReviewModal(false);
      alert('거래 후기가 등록되었습니다! 상대방의 신뢰도 및 거래성공 횟수에 반영됩니다.');
    } catch (e) {
      console.error(e);
      alert('후기 등록 중 오류가 발생했습니다.');
    }
  };

  if (!room) return null;

  return (
    <div className="market-chat-overlay" onClick={onClose}>
      <div className="market-chat-window" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="market-chat-header">
          <div className="header-left">
            {onBackToList && (
              <button className="chat-icon-btn" onClick={onBackToList} title="채팅 목록">
                <RiArrowLeftLine size={20} />
              </button>
            )}
            <div className="chat-target-info">
              <span className="chat-target-name">{otherName}</span>
              <span className={`chat-target-badge ${isSeller ? 'buyer' : 'seller'}`}>
                {isSeller ? '구매문의자' : '판매자'}
              </span>
            </div>
          </div>
          <button className="chat-icon-btn" onClick={onClose}>
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* Product mini bar */}
        <div className="chat-product-bar">
          <div className="product-thumb">
            {room.listingImage ? (
              <img src={room.listingImage} alt={room.listingTitle} />
            ) : (
              <RiShoppingBag3Line size={24} />
            )}
          </div>
          <div className="product-info">
            <div className="product-title">{room.listingTitle}</div>
            <div className="product-price">{room.listingPrice || '가격협의'}</div>
          </div>

          {/* Seller status control inside chat */}
          {isSeller ? (
            <div className="chat-status-changer">
              <select 
                value={currentListingStatus} 
                onChange={(e) => handleStatusChange(e.target.value)}
                className="chat-status-select"
              >
                <option value="available">판매중</option>
                <option value="reserved">예약중</option>
                <option value="sold">거래완료</option>
              </select>
            </div>
          ) : (
            currentListingStatus !== 'available' && (
              <span className={`chat-status-tag ${currentListingStatus}`}>
                {currentListingStatus === 'sold' ? '거래완료' : '예약중'}
              </span>
            )
          )}
        </div>

        {/* Messages List */}
        <div className="chat-messages-container">
          <div className="chat-notice-card">
            <RiShieldCheckLine size={16} />
            <span>안전한 직거래를 위해 사람이 많은 공개된 장소에서 만나시길 권장합니다.</span>
          </div>

          {messages.length === 0 ? (
            <div className="chat-empty-msg">
              대화를 시작해보세요! 아래 자주 쓰는 질문을 클릭하면 바로 전송됩니다 👇
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderUid === currentUser?.uid;
              const timeString = msg.createdAt?.toDate 
                ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div key={msg.id} className={`chat-bubble-row ${isMine ? 'mine' : 'theirs'}`}>
                  {!isMine && <div className="bubble-sender">{msg.senderName}</div>}
                  <div className="bubble-content-wrap">
                    {msg.type === 'image' ? (
                      <div className="chat-bubble-image-wrap">
                        <img 
                          src={msg.payload?.imageUrl || msg.text} 
                          alt="chat-pic" 
                          className="chat-sent-image" 
                          onClick={() => window.open(msg.payload?.imageUrl || msg.text, '_blank')}
                        />
                      </div>
                    ) : msg.type === 'proposal' ? (
                      <div className="chat-card-proposal">
                        <div className="card-proposal-header">
                          <RiMoneyDollarCircleLine size={18} />
                          <span>가격 제안</span>
                        </div>
                        <div className="card-proposal-amount">
                          {Number(msg.payload?.amount || 0).toLocaleString()} PHP
                        </div>
                        <div className="card-proposal-sub">제안 금액으로 거래를 희망합니다.</div>
                      </div>
                    ) : msg.type === 'appointment' ? (
                      <div className="chat-card-appointment">
                        <div className="card-appointment-header">
                          <RiCalendarEventLine size={18} />
                          <span>거래 약속 제안</span>
                        </div>
                        <div className="card-appointment-content">
                          <div><RiMapPinLine size={14} /> <strong>장소:</strong> {msg.payload?.place}</div>
                          <div><RiCalendarEventLine size={14} /> <strong>일시:</strong> {msg.payload?.time}</div>
                        </div>
                      </div>
                    ) : msg.type === 'review' ? (
                      <div className="chat-card-review">
                        <div className="card-review-header">
                          <RiStarFill size={16} color="#f59e0b" />
                          <span>따뜻한 거래 후기가 도착했습니다!</span>
                        </div>
                        <div className="card-review-text">{msg.text}</div>
                      </div>
                    ) : (
                      <div className="chat-bubble">
                        {msg.text}
                      </div>
                    )}
                    {timeString && <span className="bubble-time">{timeString}</span>}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions Chips */}
        <div className="quick-questions-scroll">
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              className="quick-q-chip"
              onClick={() => handleSend(null, q)}
              disabled={sending}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Action Buttons Bar: Price Proposal, Appointment, and Leave Review */}
        <div className="chat-action-tools-bar">
          <button 
            type="button" 
            className="action-tool-btn"
            onClick={() => {
              setShowProposalBox(!showProposalBox);
              setShowAppointmentBox(false);
            }}
          >
            <RiMoneyDollarCircleLine size={16} />
            <span>가격 제안하기</span>
          </button>
          <button 
            type="button" 
            className="action-tool-btn"
            onClick={() => {
              setShowAppointmentBox(!showAppointmentBox);
              setShowProposalBox(false);
            }}
          >
            <RiCalendarEventLine size={16} />
            <span>약속 잡기</span>
          </button>
          <button 
            type="button" 
            className="action-tool-btn review-btn"
            onClick={() => setShowReviewModal(true)}
          >
            <RiStarFill size={14} color="#f59e0b" />
            <span>거래 후기</span>
          </button>
        </div>

        {/* Drawer: Price Proposal Box */}
        {showProposalBox && (
          <form className="chat-drawer-box" onSubmit={handleSendProposal}>
            <div className="drawer-title">희망 제안 가격 (PHP)</div>
            <div className="drawer-input-row">
              <input 
                type="number" 
                placeholder="예: 1200" 
                value={proposalAmount} 
                onChange={(e) => setProposalAmount(e.target.value)}
                autoFocus
                required
              />
              <button type="submit" className="drawer-submit-btn">제안 전송</button>
              <button type="button" className="drawer-cancel-btn" onClick={() => setShowProposalBox(false)}>취소</button>
            </div>
          </form>
        )}

        {/* Drawer: Appointment Box */}
        {showAppointmentBox && (
          <form className="chat-drawer-box" onSubmit={handleSendAppointment}>
            <div className="drawer-title">거래 약속 정하기</div>
            <div className="drawer-col">
              <input 
                type="text" 
                placeholder="거래 장소 (예: 막탄 제이파크 정문)" 
                value={appointmentPlace} 
                onChange={(e) => setAppointmentPlace(e.target.value)}
                required
              />
              <input 
                type="text" 
                placeholder="희망 일시 (예: 오늘 오후 5시 / 내일 낮 1시)" 
                value={appointmentTime} 
                onChange={(e) => setAppointmentTime(e.target.value)}
                required
              />
              <div className="drawer-btn-group">
                <button type="submit" className="drawer-submit-btn">약속 전송</button>
                <button type="button" className="drawer-cancel-btn" onClick={() => setShowAppointmentBox(false)}>취소</button>
              </div>
            </div>
          </form>
        )}

        {/* Input Bar */}
        <form className="chat-input-bar" onSubmit={handleSend}>
          {/* Photo attach button (Item 2) */}
          <button 
            type="button" 
            className="chat-photo-btn"
            onClick={() => fileInputRef.current?.click()}
            title="사진 전송"
          >
            <RiImageAddLine size={22} />
          </button>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageFileChange} 
            style={{ display: 'none' }} 
          />

          <input
            type="text"
            className="chat-text-input"
            placeholder="메시지를 입력하세요..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            type="submit" 
            className="chat-send-btn" 
            disabled={!inputText.trim() || sending}
          >
            <RiSendPlane2Fill size={18} />
          </button>
        </form>
      </div>

      {/* Review Modal (Item 1) */}
      {showReviewModal && (
        <ReviewModal
          targetName={otherName}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
}
