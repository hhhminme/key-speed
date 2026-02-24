# key-speed ⌨️

> 한글 타자 속도 측정기 — Apps In Toss 미니앱

![타자 속도 측정기](https://img.shields.io/badge/Apps_In_Toss-미니앱-blue)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)

## 소개

토스 앱 내에서 동작하는 한글 타자 속도 측정 게임입니다.

- ⌨️ 실시간 WPM 측정
- 🔊 단어 완료 시 TTS 음성 피드백 (ElevenLabs)
- 🔥 콤보 시스템
- 🐢→⚡ 속도 티어 (5단계)
- 📊 최고 기록 저장

## 모노레포 구조

```
key-speed/
├── frontend/          # React 미니앱 (Apps In Toss)
│   └── src/
│       ├── components/   # UI 컴포넌트
│       ├── hooks/        # 커스텀 훅
│       ├── services/     # TTS 클라이언트 + 캐시
│       └── utils/        # 유틸리티
├── server/            # TTS 프록시 서버 (Express)
│   └── src/
│       ├── routes/       # API 라우트
│       └── services/     # ElevenLabs 연동
├── package.json       # 루트 워크스페이스
├── ARCHITECTURE.md    # 시스템 설계 문서
└── CLAUDE.md          # AI 개발 가이드
```

## 시작하기

### 필수 요구사항

- Node.js 24+ (`.nvmrc` 참고)
- ElevenLabs API 키 (TTS 사용 시)

```bash
nvm install && nvm use
```

### 1. 의존성 설치

```bash
npm install --legacy-peer-deps
```

### 2. 환경 변수 설정

```bash
# TTS 서버 환경 변수
cp server/.env.example server/.env
# ELEVENLABS_API_KEY 입력

# 프론트엔드 환경 변수 (선택)
cp frontend/.env.example frontend/.env
```

### 3. 개발 서버 실행

```bash
# 두 터미널에서 각각 실행

# 터미널 1: TTS 서버
npm run dev:server    # localhost:3000

# 터미널 2: 프론트엔드
npm run dev           # localhost:5173
```

> **TTS 서버 없이도 실행 가능**: 소리 없이 타이핑 테스트는 정상 동작합니다.

### 4. 배포

```bash
npm run deploy    # Apps In Toss 플랫폼에 배포
```

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 프론트엔드 개발 서버 (Granite) |
| `npm run dev:server` | TTS 서버 개발 모드 |
| `npm run build` | 프론트엔드 프로덕션 빌드 |
| `npm run build:server` | TTS 서버 빌드 |
| `npm run deploy` | Apps In Toss 배포 |
| `npm test` | 테스트 실행 |
| `npm run lint` | ESLint 검사 |
| `npm run format` | 코드 포맷팅 |

## 기술 스택

### 프론트엔드
- React 18 + TypeScript 5.9
- [@apps-in-toss/web-framework](https://developers-apps-in-toss.toss.im/) (Granite)
- [@toss/tds-mobile](https://tossmini-docs.toss.im/tds-mobile) — Toss Design System
- Emotion (CSS-in-JS) + Tailwind CSS
- Vite 7

### TTS 서버
- Node.js + Express 4
- ElevenLabs API (`eleven_v3` 모델)
- 4단계 캐싱 전략 (Memory → IndexedDB → 서버 파일 → API)

## 아키텍처

전체 시스템 설계는 [ARCHITECTURE.md](./ARCHITECTURE.md)를 참고하세요.

## 참고 문서

- [Apps In Toss 개발자 문서](https://developers-apps-in-toss.toss.im/)
- [Granite Framework 가이드](https://developers-apps-in-toss.toss.im/framework/granite)
- [TDS Mobile 문서](https://tossmini-docs.toss.im/tds-mobile)

## 라이선스

MIT License
