# Cebugo 기반 신규 프로그램 기획서

## Context (배경 및 목적)

현재 `cebugo`는 서버 없는 순수 클라이언트 SPA(React 19 + Vite)로, 세부(Cebu) 지역 업체 정보를 제공한다.
- 데이터베이스: 없음. Google Sheets를 CSV로 읽어와 `PlacesContext.jsx`에서 파싱(사실상 DB 역할).
- 쓰기: Google Apps Script 웹앱(`google-apps-script/news-api.gs`)을 통해서만 시트에 기록(뉴스/공지/이벤트 게시판).
- 이미지: 관리자가 GitHub 저장소(`sunmoon-scc-ai/cebugo.github.io`)에 개인 PAT로 직접 업로드.
- 인증: Firebase Auth Google 로그인만 존재. 관리자 여부는 `AuthContext.jsx`의 이메일 하드코딩 allowlist 2개뿐.
- 사용자 참여/보상 체계, 레벨/포인트, 사용자 제보-승인 워크플로우는 전혀 없음.

이번 신규 프로그램은 이 구조를 **기반으로 하되**, 사용자 참여를 통한 정보 신뢰성 향상과 리텐션 확보를 위해 로그인 보상, 사용자 제보(크라우드소싱) + 관리자 승인, 레벨 시스템, 업체별 날짜 게시판, 이미지/정보 카테고리 세분화, 전화번호·SNS 자동 분류, 이미지 저장소 Firebase 일원화, 그리고 일정 조건(레벨/현지폰 인증)을 만족한 사용자 대상 중고물품거래 기능을 추가한다.

이런 기능(사용자별 포인트/레벨/제보이력을 신뢰성 있게 저장·검증)은 지금의 "Google Sheets를 DB처럼 쓰는" 구조로는 동시성/보안/쿼리 측면에서 한계가 뚜렷하다. 논의 결과 다음 방향으로 확정한다.

- **DB 전략: 전면 Firestore 전환** (이미 `firebase` SDK가 설치되어 있어 신규 의존성 없이 도입 가능. 업체정보/게시글/사용자/포인트/제보를 모두 Firestore로 통합)
- **부정행위 방지: Firebase Cloud Functions 도입** (포인트 지급·승인 로직은 반드시 서버(Functions)에서만 처리하고 클라이언트는 "요청"만 하도록 설계 — 브라우저 조작으로 포인트를 부풀릴 수 없게 함)

> **문서 사용 안내**: 신규 프로그램은 기존 `cebugo` 프로젝트와 **별개의 새 폴더/프로젝트**에서 제작한다. 이 문서 전반에서 언급하는 `src/context/AuthContext.jsx`, `src/pages/DetailPage.jsx` 같은 파일 경로는 **기존 cebugo 코드베이스의 참고 구현 위치**를 가리키는 표기다. 새 프로젝트를 시작할 때는 (a) 해당 파일들을 cebugo 저장소에서 그대로 복사해와 이 문서의 지시대로 수정하거나, (b) 코드 접근이 어렵다면 문서에 서술된 로직(Google 로그인 흐름, 전화/SNS 표시 분기, 이미지 캐러셀 UI 등)을 동일한 동작으로 새로 작성하면 된다. 어느 경우든 이 문서만으로 무엇을 만들어야 하는지 판단할 수 있도록 각 기능 섹션에 필요한 로직을 구체적으로 서술했다.

---

## 전체 아키텍처 변경 요약

| 영역 | 기존 (cebugo) | 신규 프로그램 |
|---|---|---|
| 업체/게시글 데이터 | Google Sheets (CSV read + Apps Script write) | **Firestore** (`places`, `placePosts` 컬렉션) |
| 사용자/포인트/레벨/제보 | 없음 | **Firestore** (`users`, `submissions`, `pointsLedger`) 신규 |
| 관리자 판정 | 이메일 하드코딩 배열 (`AuthContext.jsx`) | Firestore `admins` + **Firebase Custom Claims** (Cloud Functions에서 설정) |
| 포인트/승인/레벨업 로직 | 없음 | **Cloud Functions**에서만 처리 (클라이언트 직접 쓰기 금지) |
| 이미지 저장소 (관리자·사용자 공통) | GitHub Contents API (PAT, 관리자 전용) | **Firebase Storage로 일원화** (관리자/사용자 업로드 모두, GitHub 업로드 경로 폐기) |
| 인증 | Firebase Auth Google 로그인 | 동일 (최초 로그인 시 `users/{uid}` 자동 생성 = 회원가입) + **필리핀 현지폰 인증(Firebase Phone Auth)** 신규 |
| 중고물품거래 | 없음 | **신규** (글쓰기/읽기 레벨을 관리자가 각각 설정, 글쓰기는 현지폰 인증도 필요) |
| 업체 리뷰/평점 | 죽은 코드(`reviewList` mock만 존재) | **신규 구현** (Firestore 기반 실제 리뷰) |
| 즐겨찾기 | 브라우저 `localStorage`(기기별) | **계정 연동**(Firestore, 로그인 시 기기 간 동기화) |
| 프론트엔드 | React 19 + Vite | 동일 유지 |

---

## 새 프로젝트 시작 가이드

기존 `cebugo`와 물리적으로 분리된 새 폴더에서 처음부터 세팅할 때 필요한 준비사항이다.

### 1) 기술 스택 / 초기 설치 패키지
- **런타임**: React 19 + Vite (`npm create vite@latest . -- --template react`)
- **필수 의존성**: `firebase`(Auth+Firestore+Storage+Functions SDK 전부 포함), `react-router-dom`, `react-leaflet` + `leaflet`(지도), `react-icons`, `react-zoom-pan-pinch`(이미지 핀치줌)
- **불필요/제외**: `papaparse`(CSV 파싱)는 런타임에는 필요 없고, Google Sheets → Firestore 1회성 마이그레이션 스크립트에서만 임시로 사용(Node 스크립트로 별도 실행, 앱 번들에는 포함하지 않음)
- **서버 사이드**: `functions/` 디렉토리에 Firebase Cloud Functions 프로젝트 별도 초기화 (`firebase init functions`, Node.js 런타임, `firebase-admin` + `firebase-functions` 패키지)
- **개발 도구**: `vite`, `@vitejs/plugin-react`, `eslint`

### 2) Firebase 프로젝트 준비
- 기존 cebugo가 쓰던 Firebase 프로젝트(`cebugo-43d88`)와는 **별도의 신규 Firebase 프로젝트 생성을 권장** (사용자/포인트/데이터가 완전히 새로 시작되므로 격리하는 편이 안전. 기존 프로젝트를 재사용하고 싶다면 최초 논의 필요)
- Firebase 콘솔에서: Authentication 활성화(**Google** + **전화번호** 로그인 제공자 모두 켜기) → Firestore Database 생성(운영 리전 선택) → Storage 버킷 생성 → **Blaze(종량제) 요금제로 업그레이드**(Functions/전화 인증에 필수, 운영 전제조건 참고)
- `firebase init`으로 Hosting(선택)/Firestore/Storage/Functions 초기화, `firestore.rules`/`storage.rules`/`firestore.indexes.json` 생성
- 프런트엔드 Firebase config는 기존 cebugo처럼 소스에 하드코딩하지 말고 `.env`(Vite는 `VITE_` 접두사 필요) + `import.meta.env`로 관리해 신규/기존 환경 분리 및 키 노출 리스크를 낮춘다.

### 3) 폴더 구조 권장안
cebugo의 기존 구조를 그대로 참고 모델로 사용한다(검증된 패턴이므로 재사용):
```
src/
  context/      (AuthContext, PlacesContext → Firestore 구독으로 전환)
  pages/        (ListPage, MapPage, SearchPage, DetailPage, NewsPage→PlacePostsPage, ProfilePage, MarketplacePage 등)
  components/
  utils/        (imageHelper.js 등)
functions/      (Cloud Functions: awardLoginPoints, approveSubmission, recalcLevel, verifyPhone 등)
scripts/        (Google Sheets → Firestore 1회성 마이그레이션 스크립트)
```

### 4) 마이그레이션에 필요한 사전 접근 권한
- 기존 업체 데이터가 담긴 **Google Sheet 접근 권한**(Sheet ID/공유 권한) — 새 프로젝트가 별개라도 원본 데이터 소스는 동일 시트이므로 마이그레이션 스크립트 실행 시 필요
- 기존 GitHub 이미지 저장소(`sunmoon-scc-ai/cebugo.github.io`) 접근 권한 — 과거 이미지를 Firebase Storage로 이관하기로 결정할 경우에만 필요(5번 참고, 필수는 아님)

---

## Firestore 데이터 모델

- **`users/{uid}`**: `{ email, displayName, photoURL, points, level, loginStreak, lastLoginDate, createdAt, isAdmin, phoneNumber, phoneCarrier, phoneVerified, favorites: [] }` — `phoneVerified`는 아래 8번 마켓플레이스 글쓰기 자격 판정에 사용, `favorites`는 10번 즐겨찾기 계정 이전용
- **`pointsLedger/{id}`** (감사 로그, 부정 조작 근거 추적): `{ uid, amount, reason: 'login' | 'submission_approved', refId, createdAt }` — 모든 포인트 변동은 Cloud Function이 이 로그를 남기고 `users.points`를 갱신
- **`config/levels`**: 레벨별 포인트 임계값 테이블, **최대 레벨은 Lv20**(관리자 조정 가능). 예시안: Lv1 0p / Lv5 700p / Lv10 2700p / Lv15 5000p / Lv20 8000p (중간 레벨은 등차적으로 보간, 정확한 수치는 운영 중 조정)
- **`config/points`**: 액션별 지급 포인트(로그인, 제보승인 등) 설정값
- **`config/marketplace`** (8번 신규): `{ writeLevel: 5, readLevel: 3 }` — 매물 등록/열람에 필요한 최소 레벨을 관리자가 조정 (예시값: 글쓰기 레벨5↑, 읽기(참여) 레벨3↑)
- **`config/phonePrefixes`**, **`config/snsPrefixes`**: 통신사/SNS 자동분류 매핑 테이블(아래 6번 참고, 배포 없이 관리자가 갱신 가능하도록 코드 하드코딩 대신 Firestore 문서로 관리)
- **`places/{placeId}`**: 기존 `PlacesContext.jsx`가 파싱하던 필드(name, category, addr, hours, description, coordinates 등)를 그대로 이관 + 아래 4번/7번에서 다루는 이미지 카테고리 필드 확장
- **`placePosts/{postId}`**: `{ placeId, date, title, content, images[], createdBy, createdAt }` — 업체별 날짜순 게시판 글
- **`submissions/{id}`**: `{ placeId, uid, type: 'typo_fix'|'new_info'|'photo', field, oldValue, newValue, imageUrl, status: 'pending'|'approved'|'rejected', reviewedBy, reviewedAt, createdAt }`
- **`marketplaceListings/{id}`** (8번 신규): `{ sellerUid, title, description, price, category, images[], status: 'available'|'reserved'|'sold', createdAt, updatedAt }`
- **`marketplaceReports/{id}`** (8번 신규): `{ listingId, reporterUid, reason, createdAt, status: 'open'|'reviewed' }` — 매물 신고
- **`placeReviews/{id}`** (9번 신규): `{ placeId, uid, rating, content, images[], createdAt }` — 업체 실제 리뷰/평점

---

## 기능별 설계

### 1. 구글 로그인/회원가입 + 로그인 포인트
- 기존 `AuthContext.jsx`의 `loginWithGoogle()`(Google Popup) 그대로 사용. 별도 가입 폼 불필요 — 최초 로그인 시 `users/{uid}` 문서가 없으면 Cloud Function이 생성(=회원가입 겸용).
- 로그인 포인트는 **"하루 최초 로그인 1회"** 기준으로 지급(단순 매 로그인 지급 시 로그아웃/재로그인 반복으로 무한 어뷰징 가능). Cloud Function `awardLoginPoints`가 `users.lastLoginDate`를 오늘 날짜와 비교해 다르면 지급 + `pointsLedger` 기록.
- 지급액은 `config/points` 문서 값 참조(하드코딩 금지, 관리자가 조정 가능).

### 2. 사용자 제보(오탈자/신규정보) → 관리자 승인 → 포인트
- 업체 상세 페이지(`DetailPage.jsx`)에 "정보 수정 제안" 버튼 추가 → 필드 선택(전화/SNS/영업시간/설명 등) + 새 값 입력 + 선택적 사진 첨부(Firebase Storage 업로드) → `submissions` 문서 생성(`status: pending`).
- 관리자 전용 "제보함" 신규 화면: 기존 `NewsPage.jsx`의 게시글 리스트+승인/거절/숨김 UI 패턴을 재사용해 목록 표시, 승인/거절 버튼.
- 제보값은 곧바로 반영되지 않고 **"제안(proposal)"**으로만 취급한다. 관리자는 제보함에서 기존 값과 제안 값을 나란히 비교(diff)해 보고, 필요하면 값을 직접 수정한 뒤 승인한다(오탈자 섞인 제보를 그대로 반영하는 위험 방지).
- 승인은 Cloud Function `approveSubmission`(callable)에서만 처리: 관리자가 확정한 값으로 `places` 문서 필드 반영 + `submission.status` 변경 + `pointsLedger` 기록 + `users.points` 증가를 하나의 트랜잭션으로 처리. 클라이언트는 "승인 요청"을 보낼 뿐 포인트를 직접 쓰지 않음.

### 3. 사용자 레벨 시스템
- 레벨은 **Lv1 ~ Lv20이 최대치**. `users.points`가 변경될 때(Firestore `onUpdate` 트리거 또는 포인트 지급 Function 내부에서 동기 처리) `config/levels`의 Lv1~20 임계값 테이블과 비교해 레벨 재계산 후 `users.level` 갱신(Lv20 도달 후 포인트는 계속 누적되지만 레벨은 20에서 고정).
- UI: 프로필/헤더에 레벨 뱃지 + 다음 레벨까지 남은 포인트 progress bar 표시(Lv20 도달 시 "최대 레벨" 표시).
- 8번 마켓플레이스의 글쓰기/읽기 자격 기준으로 사용되므로, 레벨 테이블은 마켓플레이스 정책과 함께 조정되어야 함.

### 4. 관리자 업체별 게시판(날짜별 글 + 사진)
- `NewsPage.jsx`의 공지/뉴스/이벤트 CRUD 패턴(작성/수정/삭제/숨김, Apps Script 대신 Firestore 직접 쓰기 + 보안 규칙으로 관리자만 허용)을 `placePosts` 컬렉션 기반으로 확장, 업체 상세 페이지 하단에 날짜별 피드 섹션으로 노출.
- 사진은 5번에서 통합한 Firebase Storage 업로드 컴포넌트를 재사용 (`placePosts/{postId}/{filename}` 경로).
- 쓰기 권한은 Firestore 보안 규칙에서 Custom Claim `admin == true` 체크로 강제(클라이언트 `isAdmin` 상태만으로는 신뢰 불가).

### 5. 이미지 저장소 Firebase Storage로 일원화
- 기존엔 관리자만 GitHub Contents API(개인 PAT)로 업로드했으나, 신규 프로그램에서는 **관리자 업로드와 사용자 제보 업로드 모두 Firebase Storage 하나로 통합**한다. `DetailPage.jsx`/`NewsPage.jsx`의 `handleFileChange`(GitHub PUT/DELETE, `parseGithubUrl`/`parseRawGithubUrl`, `GithubImage` 컴포넌트)를 걷어내고 Firebase Storage SDK 업로드/다운로드로 교체.
- 장점: 관리자 개인 PAT를 브라우저 localStorage에 보관하는 현재의 보안 취약점 제거, Storage 보안 규칙으로 업로드 권한을 서버 신뢰 기준(Custom Claim/Firestore 사용자 문서)으로 통일, GitHub API 요청 제한(rate limit) 문제 해소.
- Storage 경로 규칙(용도별 분리):
  - 업체 이미지(관리자 업로드, 승인 완료 제보 포함): `places/{placeId}/{category}/{filename}` (`category` = cover/facility/product/menu)
  - 업체별 게시판 사진: `placePosts/{postId}/{filename}`
  - 사용자 제보 첨부(승인 대기): `submissions/{uid}/{submissionId}/{filename}` — 로그인 사용자 본인만 업로드 가능, 승인 전에는 관리자만 열람
  - 중고물품거래 사진(8번): `marketplaceListings/{listingId}/{filename}`
- 기존 GitHub 저장소에 이미 올라간 이미지: 신규 업로드는 전부 Firebase Storage로 가되, 과거 이미지는 별도 일괄 이관 스크립트로 Firebase Storage에 복사하거나 당분간 외부 URL로 그대로 서빙(`imageHelper.js`의 weserv.nl 프록시가 어느 URL이든 처리 가능하므로 급하지 않음) — 마이그레이션 단계에서 최종 결정.

### 6. 전화번호 통신사 자동분류 + SNS 접두어 자동분류
- **전화번호**: 기존엔 `callLand`/`callGlobe`/`callSmart` 컬럼을 관리자가 수동 구분 입력(`PlacesContext.jsx` phones 파싱 로직). 신규안은 단일 번호 입력 필드로 통합하고, `09XX` 앞자리 접두사를 `config/phonePrefixes`(Globe/Smart/Sun·DITO/TNT 등) 매핑 테이블과 대조해 자동으로 carrier 태그를 부여. 표시 로직(`DetailPage.jsx`의 `renderPhone` 아이콘 분기)은 그대로 재사용.
- **SNS**: 기존엔 플랫폼별 컬럼(`snsKakao`, `snsLine` 등)이 분리돼 있었음(`pushSnsEntries` 로직). 신규안은 단일 입력 필드에 `접두어_아이디` 형식(예: `k_sms` → 카카오톡 아이디 `sms`)으로 입력받고, `config/snsPrefixes` 매핑 테이블(`k_`=카카오, `l_`=라인, `w_`=위챗, `f_`=페이스북, `i_`=인스타그램, `t_`=텔레그램 등 기존 지원 플랫폼 기준)로 자동 분류. 기존 `renderSnsLink`의 플랫폼별 표시(딥링크/복사/바로가기) 로직은 그대로 재사용.
- 두 매핑 테이블 모두 코드 하드코딩이 아닌 Firestore `config` 문서로 관리해, 통신사/플랫폼이 추가돼도 배포 없이 관리자가 갱신 가능하게 한다.

### 7. 업체 상세 정보 카테고리 세분화
- **이미지**: 대표이미지(cover, 기존 유지) / **시설사진(facility, 신규)** / **제품사진(product, 기존 "업체작성/add"를 재정의)** / 메뉴(menu, 기존 price_images) — 4개 카테고리 배열로 분리. 관리자 업로드든 사용자 제보(승인 후 반영)든 모두 5번에서 통합한 Firebase Storage 경로(`places/{placeId}/{category}/...`) 하나를 공유.
- **텍스트**: 소개글(description, 기존 explaination 대체)을 기본으로 하고, 시설/제품/메뉴 각 카테고리에 짧은 캡션(caption) 필드를 추가해 업체가 제공하는 정보도 동일 카테고리 체계로 정리.
- 상세 페이지(`DetailPage.jsx`)의 현재 3분류(cover/price/add) 섹션 구조를 4분류로 확장하는 형태로, 기존 캐러셀/업로드 UI 패턴을 그대로 재사용.

### 8. 중고물품거래 (글쓰기/읽기 레벨을 관리자가 설정, 조건부 이용)
- **이용 자격 (레벨 이원화, 관리자 설정 가능)**: `config/marketplace` 문서의 `writeLevel`/`readLevel` 값을 기준으로 판정. 예시안 — **글쓰기(매물 등록)**: `users.level >= writeLevel`(예: 5) **그리고** `users.phoneVerified == true`. **읽기(매물 열람/문의 참여)**: `users.level >= readLevel`(예: 3), 전화번호 인증은 불필요. 두 임계값은 하드코딩하지 않고 관리자 설정 화면에서 조정.
- **현지폰 인증**: Firebase Phone Authentication(SMS OTP)을 신규 도입. 기존 Google 로그인 계정에 전화번호를 링크(`linkWithPhoneNumber`)하는 방식. 인증 성공 시 Cloud Function이 `users.phoneNumber`/`phoneVerified`를 갱신하고, 6번의 통신사 자동분류 로직으로 `phoneCarrier`도 함께 기록(필리핀 로컬 번호만 허용하도록 `+63` 국가코드 검증).
- **매물 등록/관리**: 신규 페이지(예: `MarketplacePage.jsx`)에서 글쓰기 자격을 갖춘 사용자가 제목/설명/가격/카테고리/사진(Firebase Storage, `marketplaceListings/{listingId}/...`)을 입력해 `marketplaceListings` 문서 생성. 판매자는 본인 매물의 상태(판매중/예약중/판매완료)를 직접 변경·삭제 가능. 등록 시 "연락처(SNS/전화번호) 공개에 동의합니다" 체크를 받아 개인정보 노출에 대한 동의를 명시적으로 확보.
- **권한 강제**: Firestore 보안 규칙에서 `create` 시 `get(/databases/.../users/$(request.auth.uid)).data.level >= get(/databases/.../config/marketplace).data.writeLevel && ...phoneVerified == true`를 검증, 열람(list/get)은 `readLevel` 기준으로 검증해 클라이언트 우회를 차단(레벨/인증 여부는 신뢰 가능한 서버 계산값이므로 규칙에서 직접 참조 가능).
- **신고 기능**: 매물 상세에 "신고" 버튼 제공 → `marketplaceReports` 문서 생성. 사기/부적절 매물에 대한 최소한의 대응 창구를 1차 범위에 포함(신고 누적 시 자동 비공개 등 자동화는 추후 확장).
- **거래/연락/결제 범위**: 앱은 매물 등록과 매칭(연락처 노출)까지만 담당하고, **결제·배송·에스크로에는 관여하지 않는다**(직거래 연결 게시판). 별도 인앱 채팅도 1차 범위에서 제외 — 매물 상세에 판매자의 등록된 SNS/전화번호(6번에서 자동분류된 값, 사용자 동의 하에 노출)를 표시해 기존 `renderSnsLink`/`renderPhone` 패턴으로 연락하도록 함. 인앱 채팅/결제 연동은 추후 확장 과제로 명시적으로 남김(스코프 확대 방지).

### 9. 업체 리뷰/평점 기능 (신규 구현)
- `DetailPage.jsx`에 이미 존재하는 `place.reviewList`/`rating`/`reviews` UI는 현재 mock 데이터만 참조하는 죽은 코드다. 로그인 계정 체계가 생기는 이번 기회에 `placeReviews` 컬렉션 기반 실제 리뷰 기능으로 구현한다.
- 로그인 사용자가 업체 상세 페이지에서 별점 + 텍스트 + 선택적 사진(Firebase Storage)으로 리뷰 작성. 업체의 평균 평점/리뷰 수는 Cloud Function(Firestore 트리거)이 `placeReviews` 집계 후 `places.rating`/`places.reviews`에 반영.
- 제보(2번)와 마찬가지로 "활동 기반 포인트" 대상에 포함할지는 운영 정책으로 결정(스팸 방지를 위해 업체당 1인 1리뷰 등 제약 권장).

### 10. 즐겨찾기 계정 전환
- 기존엔 즐겨찾기가 브라우저 `localStorage`에만 저장되어 로그인해도 기기 간 동기화가 안 됨. `users/{uid}.favorites` 배열(또는 서브컬렉션)로 이전해 로그인 시 어느 기기에서든 동일하게 노출되도록 한다.
- 비로그인 사용자는 기존처럼 `localStorage` 폴백 유지, 로그인 시 기존 로컬 즐겨찾기를 계정에 1회 병합하는 마이그레이션 로직 포함.

---

## 운영 전제조건 (비용/정책)

- **Firebase Blaze(종량제) 요금제 필수**: Cloud Functions와 현지폰 SMS 인증(Phone Auth)은 무료(Spark) 플랜에서 동작하지 않는다. SMS 인증은 건당 과금(국가별 상이)되므로 사용자 증가에 따른 비용을 전제하고 예산을 잡아야 한다.
- **이미지 업로드 제한 정책**: 사용자 제보/리뷰/마켓플레이스 사진이 무제한 업로드되면 Storage 비용이 늘어나므로, 업로드당 파일 크기 상한과 건당 최대 사진 개수를 정책으로 정해 클라이언트 검증 + Storage 규칙(`resource.size`)으로 강제한다.

---

## 마이그레이션 단계

1. Firestore 프로젝트 구조 설계 + 보안 규칙(`firestore.rules`) + Storage 규칙(`storage.rules`) + Cloud Functions 스캐폴딩(`functions/`) 추가
2. 기존 Google Sheets 데이터를 1회성 마이그레이션 스크립트로 `places` 컬렉션에 이관 (Sheets API 또는 `docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet={tab}` CSV export 활용). 원본 시트는 카테고리별로 탭이 분리되어 있으며(예: restaurant/education/accomodation/massage/beauty/attraction/shopping/food/activity/gas/vehicle/cafe/exchange/service/laundry/hospital/public/adult), 각 탭의 원본 컬럼은 다음과 같다:
   - 기본형: `name, addr1, addr2, open, break, map, call1, call2, call3, sns1(k), sns2, sns3, image1, image2, image3, explaination`
   - 확장형(일부 탭): `addr3, addr4, callLand, callGlobe, callSmart, snsKakao, snsLine, snsWeChat, snsFacebook, snsInstagram, snsTelegram, operationMon..Sun, operationBreak, homepage, images(GitHub 폴더 경로), price_images, favorite, map2, map3`
   - 마이그레이션 스크립트는 이 원본 컬럼을 읽어 3번 `Firestore 데이터 모델`의 `places` 필드 구조로 변환하고, 이미지 카테고리는 7번 기준(cover/facility/product/menu)으로 재분류한다.
3. `PlacesContext.jsx`를 Firestore 구독(`onSnapshot`) 기반으로 전환 — 기존 필드 매핑을 유지해 `DetailPage.jsx` 등 하위 컴포넌트 호환성 확보
4. GitHub Contents API 업로드/다운로드 코드(`handleFileChange`, `parseGithubUrl`, `parseRawGithubUrl`, `GithubImage`, GitHub PAT 관리 UI)를 Firebase Storage 업로드 컴포넌트로 교체, 기존 GitHub 이미지는 별도 이관 스크립트 또는 외부 URL 유지 중 택일
5. 로그인 포인트 → 사용자 제보/승인 → 레벨 시스템(Lv1~20) → 업체별 게시판 → 업체 리뷰 → 즐겨찾기 계정 전환 순으로 기능 구현
6. Firebase Phone Authentication(현지폰 인증) 도입 → 글쓰기/읽기 레벨 기준 중고물품거래 기능 구현
7. 관리자 화면 확장: 제보 승인함(diff 비교), 포인트/레벨 기준 설정, 마켓플레이스 글쓰기/읽기 레벨 설정, 통신사/SNS 접두어 매핑 관리, 매물 신고 처리 UI
8. Google Sheets는 이관 완료 후 백업/참고용으로만 유지할지 완전 폐기할지 최종 결정 (당장 필요한 결정은 아님)

---

## 재사용할 기존 코드/패턴

새 프로젝트 세팅 시 아래 파일들을 `cebugo` 저장소에서 복사해와 이 문서의 지시대로 수정하는 것을 권장한다(각 로직은 이미 검증된 패턴).

- `src/context/AuthContext.jsx`: Google 로그인 흐름 그대로 재사용, 관리자 판정만 Custom Claim으로 전환
- `src/pages/DetailPage.jsx`: 이미지 업로드 UI/캐러셀 구조, `renderPhone`/`renderSnsLink` 표시 로직 재사용(단, 업로드 대상만 GitHub → Firebase Storage로 교체)
- `src/pages/NewsPage.jsx`: 관리자 CRUD + 승인/숨김 UI 패턴을 제보함/업체별 게시판/마켓플레이스 매물 관리에 재사용
- `src/utils/imageHelper.js`: 이미지 최적화(weserv.nl 프록시) 로직 유지, Firebase Storage 다운로드 URL도 동일 프록시로 처리

---

## 검증 방법

- Firebase Emulator Suite(Firestore + Functions + Auth + Storage)로 로컬에서 로그인 → 포인트 지급 → 제보 제출 → 관리자 승인 → 포인트/레벨 반영까지 전체 플로우 e2e 확인
- 실제 브라우저에서 Google 로그인 → 업체 정보 제보 제출 → 관리자 계정으로 승인 → 포인트·레벨 변화 UI 확인
- 통신사/SNS 자동분류는 다양한 샘플 번호(`09XX`)/접두어 입력값으로 매핑 테이블 대조 테스트
- 관리자/사용자 이미지 업로드가 모두 Firebase Storage 경로로 정상 저장·조회되는지 확인(구 GitHub 업로드 경로가 남아있지 않은지 점검)
- 현지폰 인증(OTP) 플로우 및 `writeLevel`/`readLevel` 미달 사용자의 마켓플레이스 등록/열람 시도가 보안 규칙에서 정상 차단되는지 확인
- 업체 리뷰 작성/집계(평균 평점 갱신)와 즐겨찾기 계정 동기화(로그인 시 로컬 데이터 병합)가 정상 동작하는지 확인
- 기존 기능(지도, 검색, 카테고리 필터, 뉴스/이벤트 게시판) 회귀 테스트 — Firestore 전환 후에도 동일하게 동작하는지 확인
