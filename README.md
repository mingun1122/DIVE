# 게코섬 — FULL CLEAN

어제 논의한 고객용/관리자용 기본 기능과 디자인을 **새 프로젝트에 충돌 없이** 다시 넣은 버전입니다.

## 현재 들어간 기능

### 고객용 `/`
- PC / 모바일 반응형
- 게코섬 노랑 + 라임 + 블랙 브랜드 디자인
- 개체 피드
- 종 필터
- 모프/종 검색
- 분양 가능 / 예약중 / 분양완료 표시
- 개체 상세 모달
- 여러 장 사진 썸네일
- 네이버 지도 / 인스타그램 링크
- 모바일 하단 메뉴

### 관리자 `/admin`
- 모바일/PC 반응형
- 사진 최대 10장 등록
- 종 / 모프 / 성별 / 나이 / 해칭일 / 가격 / 상태 / 설명
- 신규 등록
- 수정
- 삭제
- 분양 상태 관리
- 인스타그램 동시 게시 체크박스
- 등록 개체 피드 관리

## 아무 설정 없이도 테스트 가능

Supabase 환경변수를 넣지 않으면 **DEMO MODE**로 실행됩니다.

- 고객용 페이지 정상 표시
- `/admin` 바로 접근 가능
- 관리자에서 등록/수정/삭제 가능
- 데이터는 현재 브라우저의 localStorage에 저장

즉, 디자인과 화면 흐름은 Supabase 없이 먼저 확인할 수 있습니다.

## 실제 운영용 Supabase 연결

1. Supabase 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. Authentication에서 관리자 계정 생성
4. Vercel Environment Variables에 입력:

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

연결 후에는:
- 모든 고객이 같은 개체 데이터를 봅니다.
- 사진이 Supabase Storage에 올라갑니다.
- `/admin`은 관리자 이메일/비밀번호 로그인이 필요합니다.

## 사이트 링크 설정

Vercel 환경변수:

```text
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/내계정
NEXT_PUBLIC_NAVER_MAP_URL=네이버지도_업체링크
```

## Instagram 자동 게시

관리자에서 `인스타그램에도 같이 게시`를 체크할 수 있게 구현했습니다.

필요 환경변수:

```text
INSTAGRAM_GRAPH_BASE_URL=https://graph.facebook.com
INSTAGRAM_API_VERSION=Meta 앱에서 사용하는 API 버전
INSTAGRAM_USER_ID=...
INSTAGRAM_ACCESS_TOKEN=...
```

Meta의 프로페셔널 Instagram 계정과 게시 권한 설정이 필요합니다.
단일 이미지와 여러 장 캐러셀 게시 흐름이 포함되어 있습니다.

## 새 GitHub 저장소로 올리기 — 중요

기존 저장소에 덮어쓰지 마세요.

새 저장소 첫 화면에는 아래만 있으면 됩니다.

```text
app/
lib/
public/
supabase/
.env.example
.gitignore
package.json
README.md
```

이 프로젝트에는 의도적으로 아래 파일이 없습니다.

- tsconfig.json
- next-env.d.ts
- next.config.*
- .tsx
- package-lock.json

## Vercel 배포 설정

Vercel → Add New → Project → 새 GitHub 저장소 Import

- Framework Preset: `Next.js`
- Root Directory: `./`
- Build Command: Override 하지 않음
- Output Directory: Override 하지 않음
- Install Command: Override 하지 않음

`package.json`은 최신 안정 패키지를 설치하도록 구성되어 있습니다.
