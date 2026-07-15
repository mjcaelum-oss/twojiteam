# TRAVEL PICK

취향과 여행 조건을 반영해 국내 관광지를 고르고 여행 계획을 만드는 React 프로토타입입니다.

## 기술 스택

Vite, React, TypeScript, React Router, Supabase JavaScript Client, CSS Modules, ESLint, Vitest를 사용합니다. 상태 관리는 React Context와 custom hook을 사용하며 Redux/Zustand는 도입하지 않았습니다.

## 실행

```bash
npm install
copy .env.example .env.local
npm run dev
```

프로덕션 검증은 `npm run lint`, `npm run test`, `npm run build`로 실행합니다.

`npm run dev`로 실행하면 Vite가 `/api/recommendations`를 로컬 미들웨어로 연결하므로 배포 없이 추천 API를 확인할 수 있습니다. `.env.local`에 `OPENAI_API_KEY`를 넣으면 실제 OpenAI 추천을 호출하며, 키가 없으면 API가 설정 오류를 반환합니다. 환경변수 변경 후에는 개발 서버를 재시작하세요.

## 환경변수와 데이터 모드

`.env.local`에 `.env.example`의 값을 넣습니다. 관광지 데이터는 mock 목록을 사용하지 않고 Google Places에서 조회합니다. `VITE_DATA_MODE=supabase`는 여행 계획 저장소 선택에만 사용하며, Supabase 설정이 없을 때 명확한 오류를 보여줍니다.

| 변수 | 용도 | 브라우저 공개 여부 |
| --- | --- | --- |
| `VITE_DATA_MODE` | `mock`/`supabase` 선택 | 공개 가능 |
| `VITE_SUPABASE_URL` | Supabase URL | 공개 가능 |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | 공개 가능하지만 RLS 필수 |
| `VITE_GOOGLE_MAPS_API_KEY` | Maps JavaScript API 브라우저 키 | 공개되는 값이며 referrer/API 제한 필수 |
| `VITE_OPENAI_RECOMMENDATION_URL` | `/api/recommendations` (비워도 기본값 사용) | 공개 가능; OpenAI 키를 넣지 않음 |
| `VITE_TOUR_API_ENABLED` | 관광 API 사용 여부 | 공개 가능 |
| `VITE_API_BASE_URL` | 서버/Edge Function 주소 | 공개 가능 |
| `OPENAI_API_KEY` | 로컬 Vite API/ Vercel Function에서 OpenAI 호출 | 서버 전용 |
| `OPENAI_MODEL` | 로컬 Vite API/ Vercel Function에서 사용할 모델 | 서버 전용 설정 |

서비스 역할 키, TourAPI 비밀키 등 서버 전용 키는 `VITE_` 변수에 넣지 않습니다.

## Supabase

`supabase/migrations/20260714000000_initial_schema.sql`은 `spots`, `travel_plans`, `travel_plan_spots`와 소유자 기준 RLS 정책을 만들고, `supabase/seed.sql`은 개발용 관광지 3곳을 넣습니다.

Supabase CLI가 설치되어 있다면 프로젝트 연결 후 migration과 seed를 적용합니다. `20260714010000_clear_registered_spots.sql`은 기존 관광지 레코드를 삭제하며, 새 관광지는 Google Places에서 실시간으로 수집합니다. `20260715010000_mvp_users.sql`은 해커톤용 `mvp_users` 테이블과 회원가입/로그인 RPC를 만듭니다. 이메일과 전화번호는 계정 정보로만 저장하며 Supabase Auth, 확인 메일, SMS 인증을 사용하지 않습니다. 비밀번호는 `pgcrypto`의 bcrypt 해시만 저장되고 브라우저에서 사용자 테이블을 직접 읽을 수 없습니다.

로그인 성공 정보는 브라우저 localStorage에 보관하므로 이 로그인은 MVP 화면 접근용입니다. 운영 서비스의 API 권한 확인이나 민감한 데이터 보호용 세션으로 사용해서는 안 됩니다. Supabase Dashboard에서는 Email 로그인 제공자를 꺼둬도 이 MVP 로그인에 영향이 없습니다. `VITE_DATA_MODE=mock`인 동안 여행 계획 저장은 localStorage를 사용합니다.

## 폴더 안내

- 디자이너: `src/styles/`, `src/components/`, `src/pages/*/*.module.css`, `src/features/*/components/`
- 프론트엔드: `src/pages/`, `src/app/`, `src/features/`, `src/hooks/`
- 데이터/API: `src/data/`, `src/services/`, `src/features/plan-storage/`, `supabase/`
- 도메인 타입과 순수 계산: `src/types/`, `src/features/recommendations/`, `src/features/schedule-validation/`

## 현재 구현과 남은 작업

구현된 범위는 검색 조건(지역, 취향, 날짜, 시각, 인원), Google Places Nearby Search 후보 수집·도메인 변환, OpenAI 추천 client, 지도 로더/마커 fallback, 계획 선택·삭제·순서 변경·이동수단 선택, 시간 경고, 비용/시간 요약, localStorage repository, Supabase client/repository 인터페이스, 인증 메일 없는 해커톤용 사용자 로그인을 포함합니다.

OpenAI 호출은 `api/recommendations.js`에서 직접 처리합니다. 별도의 recommendation agent 서버는 사용하지 않습니다. 로컬에서는 Vite 개발 미들웨어가 같은 핸들러를 사용하고, 배포에서는 Vercel Function으로 동작합니다. 프론트는 기본적으로 `/api/recommendations`에 POST합니다.

## Google Maps 키 보안

기존 `index.html`에 노출되어 있던 키는 이미 공개된 것으로 간주하고 폐기·재발급해야 합니다. 새 키는 `.env.local`에만 넣고, Google Cloud Console에서 HTTP referrer 제한, 허용 도메인, Maps JavaScript API 및 실제 사용하는 Places/Routes API만 허용하고 일일 쿼터와 예산 알림을 설정하세요. `.env.local`은 Git에 포함되지 않습니다.
