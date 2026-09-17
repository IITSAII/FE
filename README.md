# 잇, 사이 FE

잇, 사이 프론트엔드 프로젝트입니다.

## 1. 개발 환경

### 주요 기술 스택

| 카테고리      | 기술                                                        |
| ------------- | ----------------------------------------------------------- |
| 코어 · 빌드   | React 19 (React Compiler), Vite 8, TypeScript 6             |
| 라우팅        | TanStack Router (파일 기반 라우팅)                          |
| 스타일 · UI   | Tailwind CSS 4, class-variance-authority, tailwind-merge    |
| 네트워크      | Axios                                                       |
| 이미지 · QR   | html-to-image, qr-code-styling                              |
| 결제          | Toss Payments SDK                                           |
| 코드 품질     | Oxlint                                                      |
| 패키지 매니저 | pnpm                                                        |
| 배포          | AWS Amplify (`amplify.yml`)                                 |

### 필요 버전

- **Node.js**: `>= 20.0.0`
- **pnpm**: `11.21.0` (`package.json`의 `packageManager` 기준)

corepack을 사용하면 프로젝트에 지정된 pnpm 버전을 자동으로 맞출 수 있습니다.

```bash
corepack enable
```

### 패키지 설치

```bash
pnpm install
```

### 환경 변수

프로젝트 루트에 `.env` 파일을 생성합니다. (`.env`는 Git에 커밋하지 않습니다.)

```bash
# 백엔드 API 주소
VITE_API_BASE_URL=

# 토스페이먼츠 클라이언트 키
TOSS_CLIENT_KEY=

# 촬영 전 스태프 인증 코드 (6자리 숫자, prod 브랜치에서 사용)
VITE_PAYMENT_AUTH_CODE=
```

> `vite.config.ts`의 `envPrefix`가 `VITE_`, `TOSS_`로 설정되어 있어, 두 접두사로 시작하는 변수만 클라이언트에 노출됩니다.

### 실행 및 빌드 스크립트

```bash
# 개발 서버 실행
pnpm dev

# 타입 체크 및 프로덕션 빌드
pnpm build

# 빌드 결과물 미리보기
pnpm preview

# Oxlint 린트 검사
pnpm lint
```

---

## 2. 폴더 구조

본 프로젝트는 소규모 개발에 최적화된 **경량화된 FSD(Feature-Sliced Design)** 아키텍처를 따릅니다. 레이어 간 의존성은 **`app` → `routes` → `features` → `shared`** (상위 → 하위) 단방향으로만 흐릅니다.

```
src/
├── app/                  # 앱 진입점 및 전역 설정 (main.tsx, App.css, Router Provider 설정 등)
├── routes/               # TanStack Router 파일 기반 라우트 및 페이지 컴포넌트
├── routeTree.gen.ts      # 라우트 트리 (자동 생성 파일, 직접 수정 금지)
├── features/             # 도메인별 기능 단위 (ui / api / lib / assets)
│   ├── intro/            # 촬영 시작 화면
│   ├── quantity/         # 인화 매수 선택
│   ├── payment/          # 결제
│   ├── relation/         # 관계 선택 및 포즈 미션
│   ├── photo/            # 촬영
│   ├── photo-selection/  # 촬영 사진 선택
│   ├── frame/            # 프레임 합성 및 인화 이미지 캡처
│   ├── loading/          # 인화 대기 화면
│   ├── intro-gallery/    # QR 진입 갤러리
│   ├── frame-download/   # 사진 다운로드
│   ├── partner-location/ # 제휴업체 소개 및 위치
│   └── refund-policy/    # 환불 정책
├── shared/               # 공용 모듈 (도메인 비의존)
│   ├── ui/               # 공용 UI 컴포넌트 (Button, Modal, Header, PhotoFrame, QrCode 등)
│   ├── hooks/            # 공용 훅 (useCountdown, useModal, useStepExpiry)
│   ├── lib/              # 공통 유틸리티 (axios, apiError, qrCode, date, utils 등)
│   ├── assets/           # 공용 에셋 (frames, icons, images)
│   └── types/            # 전역 공통 타입
└── styles/               # 디자인 토큰 CSS (color.css, typography.css)
```

> 향후 프로젝트가 확장되어 복합 UI 컴포넌트나 비즈니스 데이터 모델의 복잡도가 증가할 경우, 필요에 따라 `widgets` 및 `entities` 레이어를 추가하여 확장합니다.

### 주요 라우트

| 경로                                  | 설명                                                                 |
| ------------------------------------- | -------------------------------------------------------------------- |
| `/`                                   | 촬영 플로우 (시작 → 매수 → 결제 → 관계 → 촬영 → 사진 선택 → 프레임 → 로딩) |
| `/success`, `/fail`                   | 결제 성공 / 실패 콜백                                                |
| `/$code`                              | QR 단축 경로 → `/intro/$galleryToken`으로 리다이렉트                 |
| `/intro/$galleryToken`                | 갤러리 (제휴업체 소개 · 위치 · 사진 다운로드)                        |
| `/intro/location/$companyId`          | 제휴업체 위치                                                        |
| `/refund-policy`                      | 환불 정책                                                            |
| `/test`                               | 공용 UI 컴포넌트 테스트 페이지                                       |

---

## 3. 개발 가이드

### 브랜치 전략 및 워크플로우

본 프로젝트는 `develop` 브랜치를 축으로 진행하며, **이슈 기반 워크플로우**를 따릅니다.

#### 1. 기본 브랜치 구조

- **`develop`**: 기본 개발 메인 브랜치 (모든 작업물이 병합되는 기준 브랜치)
- **`main`**: 배포용 브랜치
- **`prod`**: 운영 배포용 브랜치

#### 2. 작업 워크플로우

1. **이슈 생성**: 작업 시작 전 GitHub Issues에서 [이슈 템플릿](.github/ISSUE_TEMPLATE)을 사용해 이슈를 생성하고 **이슈 번호**를 발급받습니다.
2. **브랜치 생성**: `develop` 브랜치에서 발급받은 이슈 번호를 필수로 포함하여 작업 브랜치를 생성합니다.
   - 브랜치명 예시: `feat/#12-login-ui`, `fix/#45-header-layout`
3. **작업 진행 및 PR(Pull Request) 올려 머지**:
   - 작업 완료 후 `develop` 브랜치를 대상(base)으로 PR을 생성합니다.
   - 코드 리뷰를 진행한 뒤 `develop` 브랜치에 머지합니다.
4. **반복**: 위 이슈 생성 → 브랜치 생성 → 작업 → PR → `develop` 머지 과정을 반복하여 프로젝트를 구축합니다.
5. **배포**: 배포할 준비가 완결되면 `develop` → `main`, `develop` → `prod` PR을 각각 생성해 머지합니다.

#### 3. 브랜치 명명 규칙

`브랜치타입/#이슈번호-작업내용` 형식으로 작성합니다. (**이슈 번호 필수**)

| 접두사      | 용도                     | 예시                       |
| ----------- | ------------------------ | -------------------------- |
| `feat/`     | 신규 기능 개발           | `feat/#12-login-ui`        |
| `fix/`      | 버그 수정                | `fix/#34-button-click-bug` |
| `refactor/` | 기능 변경 없는 코드 개선 | `refactor/#56-auth-hook`   |
| `docs/`     | 문서 수정                | `docs/#78-update-readme`   |
| `chore/`    | 기타 설정 및 단순 작업   | `chore/#90-install-deps`   |

### Git 커밋 컨벤션 (Commit Message)

커밋 메시지는 작업의 성격을 한눈에 알 수 있도록 아래의 태그를 사용합니다.

- **형식**: `태그: 설명`
- **예시**: `feat: 로그인 UI 컴포넌트 추가`

| **태그**     | **설명**                              |
| :----------- | :------------------------------------ |
| **feat**     | 새로운 기능 추가                      |
| **fix**      | 버그 수정                             |
| **refactor** | 기능 변경 없는 코드 수정/리팩토링     |
| **chore**    | 빌드 설정, 의존성 업데이트 등         |
| **docs**     | 문서 수정 (README, 주석, API 명세 등) |
| **test**     | 테스트 코드 추가 및 수정              |

### PR 컨벤션 (Pull Request)

PR은 [PR 템플릿](.github/pull_request_template.md)에 맞춰 작성합니다.

- **제목**: 이슈 제목처럼 `[FEAT]`, `[FIX]`, `[REFACTOR]`, `[DOCS]`, `[CHORE]` 태그로 시작합니다.
  - 예시: `[FIX] 촬영 타이머를 백엔드 촬영 시간에 맞춰 15초로 변경`
  - 배포 PR은 제목 끝에 방향을 표기합니다. 예시: `(develop → main)`, `(develop → prod)`
- **본문 구성**

| 섹션                  | 내용                                                     |
| --------------------- | -------------------------------------------------------- |
| 📸 작업 내용          | 작업한 내용을 두괄식으로 작성                            |
| 🎞️ 주요 코드 설명     | 설명이 필요한 코드 위주로 작성 (없으면 생략)             |
| 🖥️ 구현화면           | localhost 캡처 사진 첨부                                 |
| 🔗 연결된 이슈        | `Connected: #이슈번호` 형식으로 작성                     |
| 📚 참고자료           | 있으면 작성, 없으면 제목까지 삭제                        |
| 💬 기타 더 이야기해볼 점 | 있으면 작성, 없으면 제목까지 삭제                     |

---
