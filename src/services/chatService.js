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
import { compressImageDataUrl, uploadImageToFirebaseStorage } from '../utils/imageHelper';

/**
 * Creates or retrieves an existing 1:1 chat room for a marketplace item.
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
 * Send a chat message (text, image, proposal, appointment, review)
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

  let finalPayload = payload;

  // If type is image, compress & upload to storage
  if (type === 'image' && payload?.imageUrl) {
    if (payload.imageUrl.startsWith('data:image')) {
      const compressed = await compressImageDataUrl(payload.imageUrl, 1200, 0.8);
      const cloudUrl = await uploadImageToFirebaseStorage(compressed, 'chat_images');
      finalPayload = { ...payload, imageUrl: cloudUrl };
    }
  }

  // 1. Add message doc
  await addDoc(messagesRef, {
    senderUid,
    senderName,
    text: trimmedText,
    type, // 'text' | 'image' | 'proposal' | 'appointment' | 'review'
    payload: finalPayload,
    createdAt: serverTimestamp()
  });

  // 2. Update room summary and unread count
  const roomSnap = await getDoc(roomRef);
  const currentUnread = roomSnap.exists() ? (roomSnap.data()?.unreadCount || {}) : {};
  const currentOtherCount = currentUnread[otherUid] || 0;

  let displayLast = trimmedText;
  if (type === 'image') displayLast = '📷 사진을 보냈습니다.';
  if (type === 'proposal') displayLast = `[가격 제안] ${trimmedText}`;
  if (type === 'appointment') displayLast = `[거래 약속] ${trimmedText}`;
  if (type === 'review') displayLast = `⭐ [거래 후기] ${trimmedText}`;

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

  const listingRef = doc(db, 'cebugo_marketplace', listingId);
  await updateDoc(listingRef, {
    status: newStatus,
    updatedAt: new Date().toISOString()
  });

  const roomRef = doc(db, 'cebugo_chats', roomId);
  await updateDoc(roomRef, {
    listingStatus: newStatus
  });
}

/**
 * Submit transaction review & manner rating
 */
export async function submitTransactionReview({
  roomId,
  listingId,
  reviewerUid,
  reviewerName,
  targetUid,
  rating, // 'good' | 'great' | 'bad'
  mannerTags = [],
  comment = ''
}) {
  if (!reviewerUid || !targetUid) return;

  const reviewRef = collection(db, 'cebugo_reviews');
  await addDoc(reviewRef, {
    roomId,
    listingId,
    reviewerUid,
    reviewerName,
    targetUid,
    rating,
    mannerTags,
    comment,
    createdAt: serverTimestamp()
  });

  // Calculate manner temperature update
  const userProfileRef = doc(db, 'cebugo_users', targetUid);
  const userSnap = await getDoc(userProfileRef);
  if (userSnap.exists()) {
    const currentTemp = userSnap.data()?.mannerTemp || 36.5;
    let tempDelta = 0.5;
    if (rating === 'great') tempDelta = 1.0;
    if (rating === 'bad') tempDelta = -0.8;
    const newTemp = Math.min(99.0, Math.max(0.0, Math.round((currentTemp + tempDelta) * 10) / 10));
    await updateDoc(userProfileRef, {
      mannerTemp: newTemp
    });
  }
}

/**
 * User Keyword Watch Service (Item 3)
 */
export async function getUserKeywords(uid) {
  if (!uid) return [];
  const ref = doc(db, 'cebugo_keyword_watch', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data()?.keywords || []) : [];
}

export async function addUserKeyword(uid, keyword) {
  if (!uid || !keyword?.trim()) return;
  const cleanKeyword = keyword.trim().toLowerCase();
  const ref = doc(db, 'cebugo_keyword_watch', uid);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? (snap.data()?.keywords || []) : [];
  if (!existing.includes(cleanKeyword)) {
    await setDoc(ref, {
      keywords: [...existing, cleanKeyword],
      updatedAt: serverTimestamp()
    }, { merge: true });
  }
}

export async function removeUserKeyword(uid, keyword) {
  if (!uid || !keyword) return;
  const ref = doc(db, 'cebugo_keyword_watch', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const existing = snap.data()?.keywords || [];
    await updateDoc(ref, {
      keywords: existing.filter(k => k !== keyword)
    });
  }
}
