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

  // Note: Avoid compound query (where array-contains + orderBy) to prevent missing composite index error
  const q = query(
    collection(db, 'cebugo_chats'),
    where('participants', 'array-contains', uid)
  );

  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // In-memory sort by lastMessageTime descending
    rooms.sort((a, b) => {
      const timeA = a.lastMessageTime?.toDate ? a.lastMessageTime.toDate().getTime() : (new Date(a.createdAt || 0).getTime());
      const timeB = b.lastMessageTime?.toDate ? b.lastMessageTime.toDate().getTime() : (new Date(b.createdAt || 0).getTime());
      return timeB - timeA;
    });

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
  const roomSnap = await getDoc(roomRef);
  const roomData = roomSnap.exists() ? roomSnap.data() : null;

  await updateDoc(roomRef, {
    listingStatus: newStatus
  });

  // 거래 성공(거래완료) 시 판매자와 구매자 거래성공 횟수 +1회씩 증가
  if (newStatus === 'sold' && roomData) {
    const participantsToReward = [roomData.sellerUid, roomData.buyerUid].filter(Boolean);
    for (const uid of participantsToReward) {
      try {
        const userRef = doc(db, 'users', uid);
        const cebugoRef = doc(db, 'cebugo_users', uid);
        let uSnap = await getDoc(userRef);
        let targetRef = userRef;
        if (!uSnap.exists()) {
          const altSnap = await getDoc(cebugoRef);
          if (altSnap.exists()) {
            uSnap = altSnap;
            targetRef = cebugoRef;
          }
        }
        const curDeals = uSnap.exists() ? (Number(uSnap.data()?.completedDealsCount ?? uSnap.data()?.mannerTemp ?? 0)) : 0;
        await setDoc(targetRef, {
          completedDealsCount: curDeals + 1,
          mannerTemp: curDeals + 1 // 호환성 유지
        }, { merge: true });
      } catch (err) {
        console.error('Failed to increase completedDealsCount on deal completion:', err);
      }
    }
  }
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
  const userProfileRef = doc(db, 'users', targetUid);
  const cebugoUserRef = doc(db, 'cebugo_users', targetUid);
  
  let userSnap = await getDoc(userProfileRef);
  let refToUpdate = userProfileRef;
  if (!userSnap.exists()) {
    const altSnap = await getDoc(cebugoUserRef);
    if (altSnap.exists()) {
      userSnap = altSnap;
      refToUpdate = cebugoUserRef;
    }
  }

  if (userSnap.exists()) {
    const curDeals = Number(userSnap.data()?.completedDealsCount ?? userSnap.data()?.mannerTemp ?? 0);
    let delta = 0;
    if (rating === 'great') delta = 1;
    if (rating === 'good') delta = 0;
    if (rating === 'bad') delta = -1;
    const newDeals = Math.max(0, curDeals + delta);
    await updateDoc(refToUpdate, {
      completedDealsCount: newDeals,
      mannerTemp: newDeals
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
