import React from 'react';
import { 
  RiCloseLine, 
  RiChat1Line, 
  RiShoppingBag3Line,
  RiTimeLine
} from 'react-icons/ri';
import { getRelativeTimeString } from '../../utils/dateHelper';
import './MarketChatListModal.css';

export default function MarketChatListModal({ 
  rooms = [], 
  currentUser, 
  onSelectRoom, 
  onClose 
}) {
  return (
    <div className="chat-list-overlay" onClick={onClose}>
      <div className="chat-list-window" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-list-header">
          <div className="chat-list-title">
            <RiChat1Line size={20} color="#ea580c" />
            <span>중고거래 채팅목록</span>
          </div>
          <button className="chat-close-btn" onClick={onClose}>
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="chat-list-body">
          {rooms.length === 0 ? (
            <div className="chat-list-empty">
              <RiChat1Line size={48} color="#cbd5e1" />
              <p>진행 중인 채팅 대화가 없습니다.</p>
              <span>마음에 드는 중고 물품을 발견하면 판매자와 대화를 시작해보세요!</span>
            </div>
          ) : (
            <div className="chat-rooms-list">
              {rooms.map((room) => {
                const isSeller = currentUser?.uid === room.sellerUid;
                const otherName = isSeller ? (room.buyerName || '구매자') : (room.sellerName || '판매자');
                const unread = room.unreadCount?.[currentUser?.uid] || 0;
                
                const timeString = room.lastMessageTime?.toDate 
                  ? getRelativeTimeString(room.lastMessageTime.toDate().toISOString()) 
                  : '';

                return (
                  <div 
                    key={room.id} 
                    className={`chat-room-item ${unread > 0 ? 'has-unread' : ''}`}
                    onClick={() => onSelectRoom(room)}
                  >
                    <div className="room-thumb-wrap">
                      {room.listingImage ? (
                        <img src={room.listingImage} alt={room.listingTitle} />
                      ) : (
                        <div className="no-thumb"><RiShoppingBag3Line /></div>
                      )}
                    </div>

                    <div className="room-info">
                      <div className="room-header-row">
                        <span className="other-user-name">{otherName}</span>
                        {timeString && <span className="room-time">{timeString}</span>}
                      </div>

                      <div className="room-item-title">{room.listingTitle}</div>
                      
                      <div className="room-last-msg-row">
                        <span className="room-last-msg">
                          {room.lastMessage || '대화가 시작되었습니다.'}
                        </span>
                        {unread > 0 && (
                          <span className="room-unread-badge">{unread}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

