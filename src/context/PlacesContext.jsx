import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
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
// Initial Places Data representing the 4 real Cebu Local Businesses
const INITIAL_PLACES = [
  {
    "id": "p_1785823722978",
    "name": "33온즈 카페 (33oz Cafe)",
    "category": "cafe",
    "categoryName": "마실거리",
    "addr": "LG GARDEN, WALK MACTAN 33OZ CAFE, Mactan, Lapu-Lapu, Cebu",
    "lat": 10.307575182115837,
    "lng": 124.00982155412767,
    "open": "09:00~23:00",
    "breakTime": "",
    "phone": "09541561862",
    "phoneType": "none",
    "phones": [
      {
        "number": "09541561862",
        "type": "none"
      }
    ],
    "sns": "k_33oz",
    "snsList": [
      {
        "platform": "k_",
        "handle": "33oz"
      }
    ],
    "explaination": "안녕하세요 ♡♡♡\n막탄 뉴타운 LG가든워크 몰에 위치한\n33oz Cafe (33온스 카페)입니다! ☕✨\n\n신메뉴 🥐크로플🥐을 출시하였습니다.\n버터 풍미 가득한 크로와상을 와플처럼 구워\n겉은 바삭하고 속은 부드럽습니다.\n\n저희 카페에서는 다양한 음료와 빙수, 와플,\n디저트 메뉴 뿐만아니라 떡볶이, 주먹밥, 볶음밥 등\n간단한 식사도 가능합니다 🍽️\n\n🍧 메뉴 안내 🍧\n* 눈꽃빙수 (망고빙수, 팥빙수, 딸기빙수, 오레오초코빙수)\n* 요거트 아이스크림(망고, 딸기, 바나나, 오레오, 로투스 등)\n* 생크림 와플 (누텔라, 로투스, 딸기, 망고, 바나나 등)\n* 크로플 (카야, 누텔라, 로투스, 오레오, 인절미 등)\n* 떡볶이 / 라볶이(오리지날 & 로제)\n* 커피 / 에이드 / 스무디 / 쉐이크 / 코코넛커피스무디\n* 주먹밥 / 김치&스팸계란볶음밥\n* 샌드위치 / 토스트 / 버터브레드\n* 시저샐러드, 치킨텐더샐러드, 닭가슴살 망고 샐러드\n\n더운 날씨에 지친 몸과 마음을 사르르 녹여줄\n생망고가 듬뿍 올라간 **눈꽃 우유 망고빙수**,\n겉은 바삭하고 속은 촉촉한 **생크림 와플**과\n한 번 먹으면 계속 생각나는 **중독성 강한 떡볶이**는\n저희 카페의 인기 만점 메뉴입니다! 🔥\n\n🍯 당 충전이 필요할 땐!\n👉 33oz Cafe로 바로 고고! ♡♡♡\n\n────────────────────\n\n📞 주문 방법\n1) 전화 & 카카오톡\n2) Grab 어플\n3) 배달K 어플\n※ 전화 / 카톡 / 배달K 주문 시 맥심 대행을 통해 배달해 드립니다.(지캐쉬, 한화 선결제만 가능)\n\n────────────────────\n\n🕒 영업시간\n평일 & 주말 : 오전 9시 ~ 오후 11시 (주문 마감 : 오후 10시)\n\n📱 문의전화 : 09541561862\n💬 카카오톡 ID : 33oz\n\n📍 위치\nLG Garden Walk, M.L. Quezon National Highway, Ibabao-Ibapu, Lapu-Lapu, 6015 Cebu\n=>막탄 뉴타운 LG 가든 워크 몰 1층(엔젤스피자 맞은편)",
    "rating": 5,
    "reviewsCount": 0,
    "images": {
      "cover": [
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F33oz_cafe_photo_1785828266458.jpg?alt=media&token=1f8f618f-72b6-4487-91eb-1669062bbad9"
      ],
      "facility": [
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F33oz_cafe_photo_1785828266458.jpg?alt=media&token=1f8f618f-72b6-4487-91eb-1669062bbad9"
      ],
      "product": [],
      "menu": []
    }
  },
  {
    "id": "p_1785824706187",
    "name": "산미구엘 프라자 (San Miguel Plaza Resto Bar)",
    "category": "cafe",
    "categoryName": "마실거리",
    "addr": "M.L. Quezon National Highway, Maribago, Lapu-Lapu, Cebu, 필리핀",
    "lat": 10.284096879219977,
    "lng": 123.99485617875418,
    "open": "11:00~01:00",
    "breakTime": "",
    "phone": "09562859005",
    "phoneType": "filipino",
    "phones": [
      {
        "number": "09562859005",
        "type": "filipino"
      }
    ],
    "sns": "k_SMP2024",
    "snsList": [
      {
        "platform": "k_",
        "handle": "SMP2024"
      },
      {
        "platform": "k_",
        "handle": "shinlauren3"
      }
    ],
    "explaination": " 안녕하세요! 산미구엘 프라자입니다! \n*라이브 밴드 매일(8~11pm) 합니다*\n\n영업시간 : 11am ~ 1am (브레이크타임x)\n위치 : 제이파크 도보 5분 거리-김떡순 건물\n메뉴 : 인터네셔널 푸드&현지식(로컬음식)\n추천메뉴 \n: 크리스피빠따, 먹태, 반건조오징어,\n싸앙, 피자, 스파게티, 생맥주🍺\n\n예약문의\nKakaoTalk ID: shinlauren3 \n연락처 : 0956-285-9005 (필리핀직원)",
    "rating": 5,
    "reviewsCount": 0,
    "images": {
      "cover": [
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825724299_5cg41.jpg?alt=media&token=a2c14533-0340-43ef-8f5a-ad0e150a0093"
      ],
      "facility": [
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825735673_6q99o.jpg?alt=media&token=f0c12e5a-1de4-45e7-9645-869430791570",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825738227_6wk4u.jpg?alt=media&token=34e03854-e330-4d43-bfc3-ac1330f95d39",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825740866_3qxu1.jpg?alt=media&token=e7d60182-2f88-47e2-8962-c27f980182f0",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825743003_dtihh.jpg?alt=media&token=5706b694-11f0-4351-a75c-3f0ee65b8e4b",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825745270_0pwtb.jpg?alt=media&token=5b7abad7-5e23-4102-ac7d-f277032b8c55"
      ],
      "product": [
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825762805_9x8et.jpg?alt=media&token=75d7d312-8ff1-4d13-ba9d-43921056516e",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825764857_8yeys.jpg?alt=media&token=80b29f2c-d918-4416-af3a-91b54fd162cc",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825777702_2x76w.jpg?alt=media&token=2de1853d-bbd7-4af1-886b-f891d9ff3d5a",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825779556_jazcw.jpg?alt=media&token=af0e2b71-c87d-4d0e-97fb-db5caf4ef892",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825781695_jt77j.jpg?alt=media&token=8bb88f50-31ad-4363-b484-aa8b56453c00",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825783610_kseqp.jpg?alt=media&token=da91da63-6b14-4288-9976-3f71f36ac0f9",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825785314_h2lbk.jpg?alt=media&token=84ec985f-5e80-4ab5-9e74-f4d7ce272438"
      ],
      "menu": [
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825749919_roq3c.jpg?alt=media&token=e5457d3b-e3cd-49c5-a052-b9ac83a08bcc",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825752136_7k45i.jpg?alt=media&token=da390bc1-8d94-4dc7-9f85-f89bd98a0889",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825754487_w5ngt.jpg?alt=media&token=7bcb78ba-d287-4b61-a7d5-718f45f69653",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825756590_vig1p.jpg?alt=media&token=96af1824-db0f-4b9f-8650-baeb6a7e849a",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825790792_7vfd0.jpg?alt=media&token=c5761089-461b-4edd-a435-5430ad6a8435",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825793170_onpw8.jpg?alt=media&token=47a0bce6-1e08-44e0-92f8-2463008bb19d",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825795107_xs9kl.jpg?alt=media&token=2115a79a-348e-4913-912e-1e4f28b81935",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825796973_egpne.jpg?alt=media&token=80d30b1a-803f-4546-86dc-6e149a4fab1d",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825798945_qxftl.jpg?alt=media&token=07ea0f29-a60a-40e8-affd-ba2c85ad2d07",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825801036_6jlww.jpg?alt=media&token=1b23746a-0161-4914-80a0-4380685d3fa1",
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785825802743_lihi9.jpg?alt=media&token=e8162ec8-f230-4375-bb1c-be8269cba461"
      ]
    }
  },
  {
    "id": "p_1785818162823",
    "name": "온도 베이커리 (ONDO BAKERY)",
    "category": "restaurant",
    "categoryName": "먹을거리",
    "addr": "cebu city, One astra, A. S. Fortuna St, Mandaue, 6014 Cebu, 필리핀",
    "lat": 10.341885448456635,
    "lng": 123.91847629804023,
    "open": "10:00~21:00",
    "breakTime": "",
    "phone": "",
    "phoneType": "none",
    "phones": [],
    "sns": "f_https://www.facebook.com/Ondobakery.ph/",
    "snsList": [
      {
        "platform": "f_",
        "handle": "https://www.facebook.com/Ondobakery.ph/"
      }
    ],
    "explaination": "먼저 인사드립니다! 😊\n\nONDO Bakery가 오늘부터 Astra Mall에서 소프트 오프닝을 시작합니다.\n\n아직 모든 제품이 준비된 것은 아니어서 준비되는 제품부터 하나씩 선보일 예정입니다.\n\n🎉 소프트 오프닝 프로모션\n📅 7월 31일 ~ 8월 6일 (1주일)\n🥐 전 제품 30% 할인\n\n\n많은 관심과 방문 부탁드리며, 부족한 부분은 지속적으로 보완해 더 좋은 모습으로 찾아뵙겠습니다.\n\n📍 ONDO Bakery\nAstra Mall, A.S. Fortuna, Mandaue City\n\n감사합니다! 😊",
    "rating": 5,
    "reviewsCount": 0,
    "images": {
      "cover": [
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785827586606_yep3t.jpg?alt=media&token=48968f54-a1c1-4887-9cbd-9cfbec5d5e39"
      ],
      "facility": [],
      "product": [],
      "menu": []
    }
  },
  {
    "id": "p_1785816728829",
    "name": "카페 Will",
    "category": "cafe",
    "categoryName": "마실거리",
    "addr": "A. S. Fortuna St, Cebu City, 6000 Cebu, 필리핀",
    "lat": 10.345117852648936,
    "lng": 123.91323848181987,
    "open": "19:00~03:00",
    "breakTime": "",
    "phone": "09274883600",
    "phoneType": "none",
    "phones": [
      {
        "number": "09274883600",
        "type": "none"
      },
      {
        "number": "09177004073",
        "type": "none"
      }
    ],
    "sns": "f_https://www.facebook.com/people/CAFE-WILL/61590436533510/#",
    "snsList": [
      {
        "platform": "f_",
        "handle": "https://www.facebook.com/people/CAFE-WILL/61590436533510/#"
      }
    ],
    "explaination": "- Live Music, Karaoke and Coffee",
    "rating": 5,
    "reviewsCount": 0,
    "images": {
      "cover": [
        "https://firebasestorage.googleapis.com/v0/b/cebugo-v2.firebasestorage.app/o/places%2F1785827565126_frmfy.jpg?alt=media&token=b4eab4f6-26df-44a9-889a-64beab7f0ed7"
      ],
      "facility": [],
      "product": [],
      "menu": []
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
  try {
    const cached = localStorage.getItem('cebugo_cached_places');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sortPlaces(parsed);
      }
    }
  } catch (e) {}
  return sortPlaces([...INITIAL_PLACES]);
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

  // Clean legacy local storage caches on startup
  useEffect(() => {
    try {
      localStorage.removeItem('cebugo_custom_places');
    } catch (e) {}
  }, []);

  // Firestore real-time synchronization (Firestore is 100% Single Source of Truth)
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'places'),
      (snapshot) => {
        let list = [];
        if (!snapshot.empty) {
          list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        } else {
          // If Firestore collection is empty, seed it with clean INITIAL_PLACES once
          list = INITIAL_PLACES.map((p, idx) => ({ ...p, order: idx }));
          list.forEach(async (p) => {
            try { await setDoc(doc(db, 'places', p.id), p); } catch(e){}
          });
        }

        const sorted = sortPlaces(list);
        setPlaces(sorted);

        // Save synced Firestore snapshot to offline cache
        try {
          localStorage.setItem('cebugo_cached_places', JSON.stringify(sorted));
        } catch (e) {}
      },
      (err) => {
        console.error('Firestore places sync error:', err);
        try {
          const cached = localStorage.getItem('cebugo_cached_places');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPlaces(sortPlaces(parsed));
              return;
            }
          }
        } catch (e) {}
        setPlaces(sortPlaces([...INITIAL_PLACES]));
      }
    );

    // Marketplace sync
    const unsubMarketplace = onSnapshot(
      collection(db, 'cebugo_marketplace'),
      (snapshot) => {
        let list = [];
        if (!snapshot.empty) {
          list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
          // Sort by updatedAt descending (bumping) then createdAt
          list.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
          });
        }
        // When empty, list remains an empty array []
        setMarketplace(list);
      },
      (err) => console.error('Firestore marketplace sync error:', err)
    );

    return () => {
      unsub();
      unsubMarketplace();
    };
  }, []);

  // Sync Submissions from Firestore
  useEffect(() => {
    const unsubSubs = onSnapshot(
      collection(db, 'cebugo_submissions'),
      (snapshot) => {
        let list = [];
        if (!snapshot.empty) {
          list = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
          list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        // When empty, list remains an empty array []
        setSubmissions(list);
      },
      (err) => {
        console.error('Firestore submissions sync error:', err);
      }
    );
    return () => unsubSubs();
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

    placeToSave = await sanitizePlaceForFirestore(placeToSave);

    // Update local React state immediately for instant feedback
    setPlaces((prev) => sortPlaces([placeToSave, ...prev.filter((p) => p.id !== docId)]));

    // Save to Firestore
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

    placeToSave = await sanitizePlaceForFirestore(placeToSave);

    // Update local React State immediately
    setPlaces((prev) => {
      const filtered = prev.filter((p) => p.id !== targetId);
      return sortPlaces([placeToSave, ...filtered]);
    });

    // Update Firestore
    try {
      await setDoc(doc(db, 'places', targetId), placeToSave, { merge: true });
      console.log('Successfully updated place in Firestore:', targetId);
    } catch (err) {
      console.error('Failed to update place in Firestore:', err);
    }
  };

  const deletePlace = async (id) => {
    // 1. Remove from local state immediately
    setPlaces((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem('cebugo_cached_places', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // 2. Remove from Firestore
    try {
      await deleteDoc(doc(db, 'places', id));
      console.log('Successfully deleted place from Firestore:', id);
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

  const addSubmission = async (submissionData) => {
    const newSub = {
      id: `sub_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toLocaleString(),
      ...submissionData
    };
    setSubmissions((prev) => [newSub, ...prev]);
    try {
      await setDoc(doc(db, 'cebugo_submissions', newSub.id), newSub);
    } catch (e) {
      console.error('Failed to save submission to Firestore:', e);
    }
  };

  const approveSubmission = async (subId, rewardPoints = 20) => {
    const subToApprove = submissions.find(s => s.id === subId);
    if (!subToApprove) return;

    // 1. Update local React state for submissions
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === subId ? { ...sub, status: 'approved' } : sub))
    );

    // 2. Automatically update local places state and Firestore if field is 영업시간
    if (subToApprove.field === '영업시간') {
      setPlaces((pList) => {
        const targetPlace = pList.find(p => p.id === subToApprove.placeId);
        if (targetPlace) {
          const updatedPlace = { ...targetPlace, open: subToApprove.newValue };
          // Fire-and-forget Firestore update for the place
          setDoc(doc(db, 'places', subToApprove.placeId), updatedPlace, { merge: true }).catch(err => console.error(err));
          return pList.map((p) => (p.id === subToApprove.placeId ? updatedPlace : p));
        }
        return pList;
      });
    }

    // 2-1. Update user verification status if this is a verification request
    if (subToApprove.type === 'verification' && subToApprove.uid) {
      const updateData = {};
      if (subToApprove.field === 'phone') updateData.phoneVerified = true;
      if (subToApprove.field === 'kakao') updateData.kakaoVerified = true;
      
      if (Object.keys(updateData).length > 0) {
        setDoc(doc(db, 'users', subToApprove.uid), updateData, { merge: true }).catch(e => console.error(e));
      }
    }

    // 3. Update Submission in Firestore
    try {
      await setDoc(doc(db, 'cebugo_submissions', subId), { status: 'approved' }, { merge: true });
    } catch (err) {
      console.error('Failed to approve submission in Firestore:', err);
    }

    // 4. Award points to the user
    if (rewardPoints > 0 && subToApprove.uid && subToApprove.uid !== 'guest') {
      try {
        const userRef = doc(db, 'users', subToApprove.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentPoints = userData.points || 0;
          const pointLedger = userData.pointLedger || [];
          
          const newLedgerItem = {
            id: `reward_${Date.now()}`,
            title: `제보 승인 보상 (${subToApprove.placeName} - ${subToApprove.field})`,
            points: Number(rewardPoints),
            date: new Date().toISOString().split('T')[0],
            type: 'plus'
          };
          
          await setDoc(userRef, {
            points: currentPoints + Number(rewardPoints),
            pointLedger: [newLedgerItem, ...pointLedger]
          }, { merge: true });
        }
      } catch (err) {
        console.error('Failed to award points to user:', err);
      }
    }
  };

  const rejectSubmission = async (subId) => {
    // 1. Update local React state
    setSubmissions((prev) =>
      prev.map((sub) => (sub.id === subId ? { ...sub, status: 'rejected' } : sub))
    );

    // 2. Update Submission in Firestore
    try {
      await setDoc(doc(db, 'cebugo_submissions', subId), { status: 'rejected' }, { merge: true });
    } catch (err) {
      console.error('Failed to reject submission in Firestore:', err);
    }
  };

  const addMarketplaceListing = async (listing) => {
    const docId = `listing_${Date.now()}`;
    const newListing = {
      id: docId,
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      favoritesCount: 0,
      favoritesUsers: [],
      ...listing
    };
    setMarketplace((prev) => [newListing, ...prev]);
    try {
      await setDoc(doc(db, 'cebugo_marketplace', docId), newListing);
    } catch (e) {
      console.error('Failed to save listing to Firestore:', e);
    }
  };

  const updateMarketplaceListing = async (id, data) => {
    try {
      await setDoc(doc(db, 'cebugo_marketplace', id), { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error('Failed to update listing in Firestore:', e);
    }
  };

  const deleteMarketplaceListing = async (id) => {
    try {
      await deleteDoc(doc(db, 'cebugo_marketplace', id));
    } catch (e) {
      console.error('Failed to delete listing in Firestore:', e);
    }
  };

  const updateMarketplaceStatus = async (id, status) => {
    try {
      await setDoc(doc(db, 'cebugo_marketplace', id), { status, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error('Failed to update listing status:', e);
    }
  };

  const bumpMarketplaceListing = async (id) => {
    try {
      await setDoc(doc(db, 'cebugo_marketplace', id), { updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error('Failed to bump listing:', e);
    }
  };

  const toggleMarketplaceFavorite = async (id, uid) => {
    const listing = marketplace.find(m => m.id === id);
    if (!listing) return;
    const isFavorited = listing.favoritesUsers?.includes(uid);
    const newFavoritesUsers = isFavorited 
      ? (listing.favoritesUsers || []).filter(u => u !== uid)
      : [...(listing.favoritesUsers || []), uid];
    
    try {
      await setDoc(doc(db, 'cebugo_marketplace', id), { 
        favoritesUsers: newFavoritesUsers,
        favoritesCount: newFavoritesUsers.length
      }, { merge: true });
    } catch (e) {
      console.error('Failed to toggle favorite:', e);
    }
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
        updateMarketplaceListing,
        deleteMarketplaceListing,
        updateMarketplaceStatus,
        bumpMarketplaceListing,
        toggleMarketplaceFavorite,
        addReview
      }}
    >
      {children}
    </PlacesContext.Provider>
  );
};

