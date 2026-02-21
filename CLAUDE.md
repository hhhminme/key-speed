# Claude AI 개발 가이드 — key-speed-server

## 프로젝트 개요

**타자 속도 측정기**의 TTS(Text-to-Speech) 프록시 서버입니다. 한글 텍스트를 받아 ElevenLabs API로 음성을 합성하고, 파일 기반 캐시로 중복 요청을 방지합니다.

프론트엔드 프로젝트: [key-speed](../key-speed/) (별도 저장소)

### 기술 스택

- **런타임**: Node.js
- **프레임워크**: Express 4
- **언어**: TypeScript 5 (strict mode)
- **TTS API**: ElevenLabs (`eleven_multilingual_v2` 모델)
- **개발 도구**: tsx (watch mode)
- **빌드**: tsc → CommonJS

---

## 📁 프로젝트 구조

```
key-speed-server/
├── src/
│   ├── index.ts              # Express 서버 진입점 (CORS, 라우트 마운트)
│   ├── routes/
│   │   └── tts.ts            # GET /api/tts/:text 라우트
│   ├── services/
│   │   └── elevenlabs.ts     # ElevenLabs API 호출 + 파일 캐싱
│   └── batch.ts              # 샘플 텍스트 사전 캐싱 스크립트
├── cache/                    # MP3 캐시 파일 (git 제외)
├── dist/                     # tsc 빌드 출력 (git 제외)
├── package.json
├── tsconfig.json
├── .env.example
└── .gitignore
```

---

## 🔌 API 스펙

### `GET /api/tts/:text`

한글 텍스트를 음성(MP3)으로 변환합니다.

| 항목 | 값 |
|------|------|
| Method | GET |
| Parameter | `:text` — 한글 1~10자 (가-힣만 허용) |
| Response | `audio/mpeg` (MP3 바이너리) |
| Error 400 | 한글이 아니거나 10자 초과 |
| Error 500 | ElevenLabs API 실패 |

**예시:**
```
GET /api/tts/안녕
→ Content-Type: audio/mpeg
→ [MP3 바이너리]
```

### `GET /health`

서버 상태 확인용 헬스체크 엔드포인트.

```json
{ "status": "ok" }
```

---

## 💾 캐싱 전략

**파일 기반 캐시** (`cache/` 디렉토리):

1. 요청이 들어오면 캐시 파일 존재 여부 확인
2. 캐시 히트 → 파일에서 직접 반환 (API 호출 없음)
3. 캐시 미스 → ElevenLabs API 호출 → 응답을 파일로 저장 → 반환

**파일 명명 규칙:**
- 각 한글 글자의 유니코드 코드 포인트를 `_`로 연결
- 예: `안녕` → `50504_45397.mp3`

**특성:**
- 만료 없음 (영구 캐시)
- 서버 재시작 후에도 유지
- `batch.ts`로 사전 워밍업 가능

---

## 🔧 환경 변수

`.env` 파일에 설정 (`.env.example` 참고):

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `ELEVENLABS_API_KEY` | **필수** | — | ElevenLabs API 인증 키 |
| `ELEVENLABS_VOICE_ID` | 선택 | `pNInz6obpgDQGcFmaJgB` | 음성 ID |
| `PORT` | 선택 | `3000` | 서버 포트 |

---

## 📦 주요 명령어

```bash
# 개발 서버 (tsx watch, 자동 재시작)
npm run dev

# 프로덕션 빌드
npm run build    # tsc → dist/

# 프로덕션 실행
npm start        # node dist/index.js

# 사전 캐싱 (batch)
npm run build && node dist/batch.js
```

---

## 🎯 개발 원칙

### 코드 스타일

- **TypeScript Strict**: `strict: true`, `any` 사용 금지
- **에러 핸들링**: 모든 라우트에서 try-catch, 적절한 HTTP 상태 코드 반환
- **입력 검증**: 한글 유니코드 범위(U+AC00~U+D7A3)로 검증

### CORS 정책

```typescript
cors({ origin: /^http:\/\/localhost:\d+$/ })
```

- 개발 환경: `localhost` 모든 포트 허용
- 외부 도메인은 차단됨

### API 호출

- ElevenLabs API 직접 HTTP 호출 (SDK 미사용)
- `batch.ts`에서 300ms 간격으로 rate limiting
- 프론트엔드 `ttsApiClient.ts`에서 실패 시 500ms 후 1회 자동 재시도

---

## 🚫 금지 사항

- ❌ `ELEVENLABS_API_KEY` 하드코딩 금지
- ❌ `cache/*.mp3` 파일 커밋 금지
- ❌ `.env` 파일 커밋 금지
- ❌ `any` 타입 사용 금지
- ❌ CORS를 와일드카드(`*`)로 설정 금지

---

## 🔍 트러블슈팅

### ElevenLabs API 에러

- API 키가 `.env`에 설정되어 있는지 확인
- ElevenLabs 대시보드에서 크레딧/쿼터 확인
- 응답 상태 코드와 에러 메시지 로그 확인

### 캐시 초기화

```bash
# 모든 캐시 삭제
rm -rf cache/*.mp3

# 사전 캐싱 재실행
npm run build && node dist/batch.js
```

### CORS 에러

- 프론트엔드가 `localhost`에서 실행 중인지 확인
- 프로덕션 배포 시 CORS origin 업데이트 필요

---

**마지막 업데이트**: 2026-02-21
