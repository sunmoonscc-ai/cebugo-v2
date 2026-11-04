import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Creates or retrieves an existing 1:1 chat room for a marketplace item.
 * Room ID rule: composite of itemId + sorted uids or unique hash
 */
export async function getOrCreateChatRoom({ listing, currentUser }) {
  if (!currentUser?.uid || !listing?.id || !listing?.sellerUid) {
    throw new Error('채팅방을 생성하기 위한 정보가 부족합니다.');
  }

  if (currentUser.uid === listing.sellerUid) {
    throw new Error('자신이 등록한 물품에는 채팅을 걸 수 없습니다.');
  }

  const roomId = `chat_${listing.id}_${currentUser.uid}`;
  const roomRef = doc(db, 'cebugo_chats', roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    const newRoomData = {
      id: roomId,
      listingId: listing.id,
      listingTitle: listing.title || '',
      listingPrice: listing.price || '',
      listingImage: listing.images?.[0] || '',
      listingStatus: listing.status || 'available',
      sellerUid: listing.sellerUid,
      sellerName: listing.sellerName || '판매자',
      buyerUid: currentUser.uid,
      buyerName: currentUser.displayName || '구매자',
      buyerPhoto: currentUser.photoURL || '',
      participants: [listing.sellerUid, currentUser.uid],
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      unreadCount: {
        [listing.sellerUid]: 0,
        [currentUser.uid]: 0
      },
      createdAt: serverTimestamp()
    };
    await setDoc(roomRef, newRoomData);
  }

  return roomId;
}

/**
 * Subscribe to the list of chat rooms where currentUser is a participant
 */
export function subscribeUserChatRooms(uid, callback) {
  if (!uid) return () => {};

  const q = query(
    collection(db, 'cebugo_chats'),
    where('participants', 'array-contains', uid),
    orderBy('lastMessageTime', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(rooms);
  }, (err) => {
    console.error('Error subscribing to chat rooms:', err);
  });
}

/**
 * Subscribe to messages in a specific chat room
 */
export function subscribeChatMessages(roomId, callback) {
  if (!roomId) return () => {};

  const messagesRef = collection(db, 'cebugo_chats', roomId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  }, (err) => {
    console.error('Error subscribing to chat messages:', err);
  });
}

/**
 * Send a chat message (text, quick question, price proposal, or appointment)
 */
export async function sendChatMessage({ 
  roomId, 
  senderUid, 
  senderName, 
  text, 
  type = 'text', 
  payload = null, 
  otherUid 
}) {
  if (!roomId || !senderUid) return;

  const trimmedText = text ? text.trim() : '';
  const messagesRef = collection(db, 'cebugo_chats', roomId, 'messages');
  const roomRef = doc(db, 'cebugo_chats', roomId);

  // 1. Add message doc
  await addDoc(messagesRef, {
    senderUid,
    senderName,
    text: trimmedText,
    type, // 'text' | 'proposal' | 'appointment'
    payload,
    createdAt: serverTimestamp()
  });

  // 2. Update room summary and unread count
  const roomSnap = await getDoc(roomRef);
  const currentUnread = roomSnap.exists() ? (roomSnap.data()?.unreadCount || {}) : {};
  const currentOtherCount = currentUnread[otherUid] || 0;

  let displayLast = trimmedText;
  if (type === 'proposal') displayLast = `[가격 제안] ${trimmedText}`;
  if (type === 'appointment') displayLast = `[거래 약속] ${trimmedText}`;

  await updateDoc(roomRef, {
    lastMessage: displayLast,
    lastMessageTime: serverTimestamp(),
    [`unreadCount.${otherUid}`]: currentOtherCount + 1
  });
}

/**
 * Mark messages in a room as read for the current user
 */
export async function markRoomAsRead(roomId, currentUserUid) {
  if (!roomId || !currentUserUid) return;
  try {
    const roomRef = doc(db, 'cebugo_chats', roomId);
    await updateDoc(roomRef, {
      [`unreadCount.${currentUserUid}`]: 0
    });
  } catch (err) {
    console.error('Failed to mark room as read:', err);
  }
}

/**
 * Update transaction status from within the chat room (Seller only)
 */
export async function updateChatListingStatus({ roomId, listingId, newStatus }) {
  if (!roomId || !listingId || !newStatus) return;

  // 1. Update listing in marketplace
  const listingRef = doc(db, 'cebugo_marketplace', listingId);
  await updateDoc(listingRef, {
    status: newStatus,
    updatedAt: new Date().toISOString()
  });

  // 2. Update room cache
  const roomRef = doc(db, 'cebugo_chats', roomId);
  await updateDoc(roomRef, {
    listingStatus: newStatus
  });
}
