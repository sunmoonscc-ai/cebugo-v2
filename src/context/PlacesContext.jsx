import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { CATEGORY_MAP } from '../constants/categories';
import { sanitizePlaceForFirestore } from '../utils/imageHelper';

const PlacesContext = createContext();

export const usePlaces = () => useContext(PlacesContext);

function countImages(place) {
  if (!place || !place.images) return 0;
  return (
    (place.images.cover?.length || 0) +
    (place.images.facility?.length || 0) +
    (place.images.product?.length || 0) +
    (place.images.menu?.length || 0)
  );
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function deduplicateAndSortPlaces(list) {
  if (!Array.isArray(list)) return [];

  const mapByName = new Map();

  for (const rawItem of list) {
    if (!rawItem || !rawItem.name) continue;
    
    // Guarantee every place has a non-undefined valid ID
    const validId = rawItem.id || `p_${hashCode(rawItem.name)}`;
    const item = { ...rawItem, id: validId };

    const nameKey = item.name.trim().toLowerCase().replace(/\s+/g, '');

    if (!mapByName.has(nameKey)) {
      mapByName.set(nameKey, item);
    } else {
      const existing = mapByName.get(nameKey);
      const existingImgCount = countImages(existing);
      const newImgCount = countImages(item);

      if (newImgCount > existingImgCount) {
        mapByName.set(nameKey, { ...existing, ...item, id: existing.id || item.id });
      } else if (newImgCount === existingImgCount) {
        const timeExisting = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        const timeNew = new Date(item.updatedAt || item.createdAt || 0).getTime();
        if (timeNew >= timeExisting) {
          mapByName.set(nameKey, { ...existing, ...item, id: existing.id || item.id });
        }
      }
    }
  }

  return sortPlaces(Array.from(mapByName.values()));
}

// Sorting helper: Custom order overrides default, otherwise Fallback to Alphabetical Sort (가나다순)
export function sortPlaces(list) {
  return [...list].sort((a, b) => {
    const hasOrderA = a.order !== undefined && a.order !== null;
    const hasOrderB = b.order !== undefined && b.order !== null;

    if (hasOrderA && hasOrderB) {
      if (a.order !== b.order) return a.order - b.order;
      return (a.name || '').localeCompare(b.name || '', 'ko');
    }
    if (hasOrderA) return -1;
    if (hasOrderB) return 1;

    // Fallback: Default Alphabetical Sort (가나다순)
    return (a.name || '').localeCompare(b.name || '', 'ko');
  });
}

// Initial Mock Places Data representing Cebu Local Businesses with 12 categories
const INITIAL_PLACES = [
  {
    id: 'place_1',
    name: '점보씨푸드 막탄 (Jumbo Seafood Mactan)',
    category: 'restaurant',
    categoryName: '먹을거리',
    addr: 'Maribago, Lapu-Lapu City, Cebu',
    lat: 10.2858,
    lng: 123.9922,
    open: '11:00 AM - 10:00 PM',
    breakTime: '없음',
    phone: '09171234567',
    sns: 'k_jumboseafood',
    explaination: '신선한 세부 알리망오 크랩과 다채로운 신선 해산물 요리를 선보이는 막탄 최고 인기 씨푸드 전문점입니다.',
    rating: 4.8,
    reviewsCount: 34,
    images: {
      cover: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'],
      facility: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'],
      product: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80'],
      menu: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80']
    }
  },
  {
    id: 'place_2',
    name: '트리쉐이드 스파 막탄점 (Tree Shade Spa)',
    category: 'massage',
    categoryName: '뷰티·마사지',
    addr: 'Pajac-Maribago Rd, Lapu-Lapu City, Cebu',
    lat: 10.2921,
    lng: 123.9890,
    open: '09:00 AM - 02:00 AM',
    breakTime: '연중무휴',
    phone: '09209876543',
    sns: 'k_treeshade',
    explaination: '프리미엄 오가닉 아로마 마사지 및 수면팩 서비스를 이용할 수 있는 세부 대표 마사지 브랜드입니다.',
    rating: 4.7,
    reviewsCount: 52,
    images: {
      cover: ['https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80'],
      facility: ['https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&q=80'],
      product: ['https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=800&q=80'],
      menu: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80']
    }
  },
  {
    id: 'place_3',
    name: '더 마크 리조트 & 다이빙 (The Mark Resort)',
    category: 'activity',
    categoryName: '즐길거리',
    addr: 'Punta Engano Rd, Lapu-Lapu City, Cebu',
    lat: 10.3065,
    lng: 124.0150,
    open: '07:00 AM - 09:00 PM',
    breakTime: '없음',
    phone: '09071112233',
    sns: 'l_themarkcebu',
    explaination: '럭셔리 호핑투어, 스쿠버 다이빙 자격증 코스 및 오션뷰 인피니티 풀을 갖춘 종합 해양 액티비티 콤플렉스.',
    rating: 4.9,
    reviewsCount: 41,
    images: {
      cover: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'],
      facility: ['https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80'],
      product: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80'],
      menu: ['https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&q=80']
    }
  },
  {
    id: 'place_4',
    name: '카바나 레스토랑 & 디저트 (Cabana)',
    category: 'cafe',
    categoryName: '마실거리',
    addr: 'Punta Engano Rd, Mactan Island, Cebu',
    lat: 10.3050,
    lng: 124.0142,
    open: '12:00 PM - 10:00 PM',
    breakTime: '없음',
    phone: '09179998877',
    sns: 'i_cabanacebu',
    explaination: '막탄 바다를 한눈에 보며 망고 스무디와 망고 퓨전 디저트를 즐길 수 있는 대표 뷰 맛집 감성 카페입니다.',
    rating: 4.6,
    reviewsCount: 29,
    images: {
      cover: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80'],
      facility: ['https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80'],
      product: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80'],
      menu: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80']
    }
  },
  {
    id: 'place_5',
    name: '세부 닥터스 종합병원 (Cebu Doctors Hospital)',
    category: 'hospital',
    categoryName: '병원',
    addr: 'Osmeña Blvd, Cebu City, Cebu',
    lat: 10.3120,
    lng: 123.8910,
    open: '24시간 응급센터 운영',
    breakTime: '연중무휴',
    phone: '09170001122',
    sns: 'k_cebudoctors',
    explaination: '세부 시티 중심부에 위치한 최신 의료 설비 및 응급실을 갖춘 대표 종합병원입니다.',
    rating: 4.8,
    reviewsCount: 19,
    images: {
      cover: ['https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&q=80']
    }
  },
  {
    id: 'place_6',
    name: '세부 국제 어학원 (Cebu English Academy)',
    category: 'education',
    categoryName: '교육',
    addr: 'Banilad, Cebu City, Cebu',
    lat: 10.3380,
    lng: 123.9050,
    open: '08:00 AM - 06:00 PM',
    breakTime: '토/일 휴무',
    phone: '09283334455',
    sns: 'k_cebuacademy',
    explaination: '1:1 맞춤 원어민 튜터링 및 유학/연수 전문 명문 영어 교육 기관입니다.',
    rating: 4.9,
    reviewsCount: 28,
    images: {
      cover: ['https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80']
    }
  },
  {
    id: 'place_7',
    name: '33oz Cafe (33온스 카페)',
    category: 'cafe',
    categoryName: '마실거리',
    addr: 'LG Garden Walk Mactan, Mactan New Town, Lapu-Lapu City, Cebu',
    lat: 10.3025,
    lng: 124.0040,
    open: '09:00 AM - 10:00 PM',
    breakTime: '없음',
    phone: '09170003303',
    sns: 'i_33oz.bakery.cebu',
    explaination: '안녕하세요 ♡♡♡\n막탄 뉴타운 LG가든워크 몰에 위치한\n33oz Cafe (33온스 카페)입니다! ☕✨',
    rating: 5.0,
    reviewsCount: 1,
    images: {
      cover: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80'],
      facility: ['https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80'],
      product: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80'],
      menu: ['https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80']
    }
  }
];

// Initial Mock Marketplace Listings
const INITIAL_MARKETPLACE = [
  {
    id: 'listing_1',
    sellerUid: 'user_1',
    sellerName: '막탄주민',
    sellerLevel: 7,
    title: '스노클링 장비 & 오리발 풀세트 (상태 A급)',
    description: '지난주 세부 여행에서 1회 사용한 스노클링 장비 판매합니다. 세척 완료했습니다.',
    price: '1,200 PHP',
    category: 'sports',
    images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80'],
    status: 'available',
    phone: '09171234567',
    sns: 'k_cebulover',
    createdAt: '2026-07-22'
  },
  {
    id: 'listing_2',
    sellerUid: 'user_2',
    sellerName: '세부살이',
    sellerLevel: 12,
    title: '필리핀 110V-220V 변압기 및 멀티어댑터',
    description: '귀국으로 인해 처분합니다. 귀국 전 막탄 제이파크 부근 직거래 가능합니다.',
    price: '300 PHP',
    category: 'electronics',
    images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&q=80'],
    status: 'available',
    phone: '09209876543',
    sns: 'k_cebuadapter',
    createdAt: '2026-07-23'
  }
];

// Initial Submissions for Admin Approval
const INITIAL_SUBMISSIONS = [
  {
    id: 'sub_1',
    placeId: 'place_1',
    placeName: '점보씨푸드 막탄',
    uid: 'user_99',
    userName: '세부새싹',
    type: 'typo_fix',
    field: '영업시간',
    oldValue: '11:00 AM - 10:00 PM',
    newValue: '10:30 AM - 10:30 PM (라스트오더 09:30 PM)',
    status: 'pending',
    createdAt: '2026-07-23 14:20'
  }
];

const getInitialPlaces = () => {
  let list = [...INITIAL_PLACES];
  try {
    const localSaved = localStorage.getItem('cebugo_custom_places');
    if (localSaved) {
      const customList = JSON.parse(localSaved);
      const existingIds = new Set(list.map((p) => p.id));
      customList.forEach((cItem) => {
        if (!existingIds.has(cItem.id)) {
          list.push(cItem);
        }
      });
    }
  } catch (e) {}
  return deduplicateAndSortPlaces(list);
};

export const PlacesProvider = ({ children }) => {
  const [places, setPlaces] = useState(getInitialPlaces);
  const [marketplace, setMarketplace] = useState(INITIAL_MARKETPLACE);
  const [submissions, setSubmissions] = useState(INITIAL_SUBMISSIONS);
  const [reviews, setReviews] = useState([
    {
      id: 'rev_1',
      placeId: 'place_1',
      userName: '여행조아',
      userLevel: 6,
      rating: 5,
      content: '알리망오 크랩 칠리 소스가 정말 맛있었어요! 카카오톡 사전 예약 필수입니다.',
      createdAt: '2026-07-20'
    }
  ]);

  // Firestore real-time places synchronization with LocalStorage dual persistence
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'places'),
      (snapshot) => {
        let list = [];
        if (!snapshot.empty) {
          list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        } else {
          list = INITIAL_PLACES.map((p, idx) => ({ ...p, order: idx }));
          list.forEach(async (p) => {
            try { await setDoc(doc(db, 'places', p.id), p); } catch(e){}
          });
        }

        // Merge with local storage custom places backup so no locally created place is ever lost
        try {
          const localSaved = localStorage.getItem('cebugo_custom_places');
          if (localSaved) {
            const customList = JSON.parse(localSaved);
            const existingIds = new Set(list.map((p) => p.id));
            customList.forEach((cItem) => {
              if (!existingIds.has(cItem.id)) {
                list.push(cItem);
                setDoc(doc(db, 'places', cItem.id), cItem).catch(() => {});
              }
            });
          }
        } catch (e) {}

        setPlaces(deduplicateAndSortPlaces(list));
      },
      (err) => {
        console.error('Firestore places sync error:', err);
        let list = [...INITIAL_PLACES];
        try {
          const localSaved = localStorage.getItem('cebugo_custom_places');
          if (localSaved) {
            const customList = JSON.parse(localSaved);
            const existingIds = new Set(list.map((p) => p.id));
            customList.forEach((cItem) => {
              if (!existingIds.has(cItem.id)) {
                list.push(cItem);
              }
            });
          }
        } catch (e) {}
        setPlaces(deduplicateAndSortPlaces(list));
      }
    );
    return () => unsub();
  }, []);

  const addPlace = async (placeData) => {
    const docId = placeData.id || `p_${Date.now()}`;
    const categoryName = CATEGORY_MAP[placeData.category] || '기타';

    let placeToSave = {
      id: docId,
      rating: 5.0,
      reviewsCount: 0,
      createdAt: new Date().toISOString(),
      ...placeData,
      categoryName
    };

    // Auto-compress & sanitize images so total document size stays under Firestore's 1MB limit
    placeToSave = await sanitizePlaceForFirestore(placeToSave);

    // 1. Dual Backup to LocalStorage first (fail-safe)
    try {
      const localSaved = localStorage.getItem('cebugo_custom_places');
      const customList = localSaved ? JSON.parse(localSaved) : [];
      const updatedCustom = [placeToSave, ...customList.filter((p) => p.id !== docId)];
      localStorage.setItem('cebugo_custom_places', JSON.stringify(updatedCustom));
    } catch (e) {
      console.warn('LocalStorage backup warning:', e);
    }

    // 2. React state update with deduplication
    setPlaces((prev) => deduplicateAndSortPlaces([placeToSave, ...prev.filter((p) => p.id !== docId)]));

    // 3. Save to Firestore
    try {
      await setDoc(doc(db, 'places', docId), placeToSave);
      console.log('Successfully saved place to Firestore:', docId);
    } catch (err) {
      console.error('Failed to save place to Firestore:', err);
    }
  };

  const updatePlace = async (id, placeData) => {
    const targetId = id || placeData.id || `p_${Date.now()}`;
    const categoryName = CATEGORY_MAP[placeData.category] || placeData.categoryName || '기타';
    let placeToSave = {
      ...placeData,
      id: targetId,
      categoryName,
      updatedAt: new Date().toISOString()
    };

    // Auto-compress & sanitize images so total document size stays under Firestore's 1MB limit
    placeToSave = await sanitizePlaceForFirestore(placeToSave);

    // 1. Dual Backup to LocalStorage
    try {
      const localSaved = localStorage.getItem('cebugo_custom_places');
      const customList = localSaved ? JSON.parse(localSaved) : [];
      const updatedCustom = [...customList.filter((p) => p.id !== targetId), placeToSave];
      localStorage.setItem('cebugo_custom_places', JSON.stringify(updatedCustom));
    } catch (e) {
      console.warn('LocalStorage backup warning:', e);
    }

    // 2. Update React State with deduplication
    setPlaces((prev) => {
      const filtered = prev.filter((p) => p.id !== targetId);
      return deduplicateAndSortPlaces([placeToSave, ...filtered]);
    });

    // 3. Update Firestore
    try {
      await setDoc(doc(db, 'places', targetId), placeToSave, { merge: true });
      console.log('Successfully updated place in Firestore:', targetId);
    } catch (err) {
      console.error('Failed to update place in Firestore:', err);
    }
  };

  const deletePlace = async (id) => {
    // 1. Remove from LocalStorage Backup
    try {
      const localSaved = localStorage.getItem('cebugo_custom_places');
      if (localSaved) {
        const customList = JSON.parse(localSaved);
        const updatedCustom = customList.filter((p) => p.id !== id);
        localStorage.setItem('cebugo_custom_places', JSON.stringify(updatedCustom));
      }
    } catch (e) {}

    // 2. Remove from React State
    setPlaces((prev) => prev.filter((p) => p.id !== id));

    // 3. Remove from Firestore
    try {
      await deleteDoc(doc(db, 'places', id));
    } catch (err) {
      console.error('Failed to delete place from Firestore:', err);
    }
  };

  const movePlace = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= places.length) return;

    const newList = [...places];
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;

    const updatedList = newList.map((item, idx) => ({ ...item, order: idx }));
    setPlaces(sortPlaces(updatedList));

    try {
      const batch = writeBatch(db);
      updatedList.forEach((item) => {
        batch.set(doc(db, 'places', item.id), { order: item.order }, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to update place order in Firestore:', err);
    }
  };

  const reorderPlaces = async (updatedList) => {
    const listWithOrder = updatedList.map((item, idx) => ({ ...item, order: idx }));
    setPlaces(sortPlaces(listWithOrder));

    try {
      const batch = writeBatch(db);
      listWithOrder.forEach((item) => {
        batch.set(doc(db, 'places', item.id), { order: item.order }, { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to reorder places in Firestore:', err);
    }
  };

  const addSubmission = (submissionData) => {
    const newSub = {
      id: `sub_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toLocaleString(),
      ...submissionData
    };
    setSubmissions((prev) => [newSub, ...prev]);
  };

  const approveSubmission = (subId) => {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id === subId) {
          setPlaces((pList) =>
            pList.map((p) => {
              if (p.id === sub.placeId && sub.field === '영업시간') {
                return { ...p, open: sub.newValue };
              }
              return p;
            })
          );
          return { ...sub, status: 'approved' };
        }
        return sub;
      })
    );
  };

  const rejectSubmission = (subId) => {
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === subId ? { ...sub, status: 'rejected' } : sub))
    );
  };

  const addMarketplaceListing = (listing) => {
    const newListing = {
      id: `listing_${Date.now()}`,
      status: 'available',
      createdAt: new Date().toISOString().split('T')[0],
      ...listing
    };
    setMarketplace((prev) => [newListing, ...prev]);
  };

  const addReview = (placeId, review) => {
    const newRev = {
      id: `rev_${Date.now()}`,
      placeId,
      createdAt: new Date().toISOString().split('T')[0],
      ...review
    };
    setReviews((prev) => [newRev, ...prev]);

    setPlaces((prev) =>
      prev.map((p) => {
        if (p.id === placeId) {
          const newCount = p.reviewsCount + 1;
          const newRating = Number(((p.rating * p.reviewsCount + review.rating) / newCount).toFixed(1));
          return { ...p, rating: newRating, reviewsCount: newCount };
        }
        return p;
      })
    );
  };

  return (
    <PlacesContext.Provider
      value={{
        places,
        marketplace,
        submissions,
        reviews,
        addPlace,
        updatePlace,
        deletePlace,
        movePlace,
        reorderPlaces,
        addSubmission,
        approveSubmission,
        rejectSubmission,
        addMarketplaceListing,
        addReview
      }}
    >
      {children}
    </PlacesContext.Provider>
  );
};

