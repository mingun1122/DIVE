# 게코리움 DIVE V2 — 실운영용

기존 게코섬 프로젝트를 **게코리움 / GECKORIUM**으로 완전히 교체한 버전입니다.

## 들어간 기능

### 고객용 `/`
- 게코리움 확정 로고/화이트·딥그린·골드 테마
- PC/모바일 반응형
- 개체 피드
- 종 필터 / 모프·개체번호 검색
- 분양 가능 / 예약중 / 분양완료
- 사진 여러 장 상세보기
- 개체번호 / 성별 / 나이 / 무게 / 해칭일 / 가격
- 짧은 소개 + 상세 설명 + 태그
- 게코리움 사육 가이드 섹션
- 네이버 지도 / 인스타그램 링크

### 관리자 `/admin`
- Supabase 관리자 로그인
- 사진 최대 10장
- 개체번호 / 종 / 모프 / 성별 / 해칭일 / 나이 / 무게 / 가격 / 상태
- 짧은 소개 / 상세내용 / 태그
- 공개/숨김
- 수정 / 삭제
- **게시 위치를 체크박스 형태로 3가지 선택**
  1. 사이트에만 게시
  2. 사이트 + 인스타그램 동시 게시
  3. 인스타그램에만 게시
- 인스타 캡션 자동 생성 + 직접 수정
- 여러 장은 인스타 캐러셀 게시

## 정말로 사이트에 올라가게 하려면 — Supabase 1회 설정

1. Supabase 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 전체 실행
3. Authentication → Users에서 관리자 이메일/비밀번호 생성
4. Supabase Dashboard에서 Project URL과 Publishable/anon key 확인
5. Vercel → DIVE → Settings → Environment Variables에 추가

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ADMIN_EMAILS=관리자이메일@example.com
```

6. Vercel에서 Redeploy

그 뒤 `/admin`에서 로그인 → `사이트에만 게시` 또는 `사이트 + 인스타그램` 선택 → 등록하면 DB/Storage에 저장되고 **다른 휴대폰/PC를 포함한 모든 방문자의 메인페이지에 동일하게 표시**됩니다.

Supabase 연결 전에는 DEMO MODE로 같은 브라우저에서만 테스트됩니다.

## 인스타그램 자동 게시 연결

Instagram Professional 계정(Business 또는 Creator)과 Meta Developer 설정이 필요합니다. Instagram Login 방식 기준 권한은 `instagram_business_basic`, `instagram_business_content_publish`입니다. 이미지 게시용 사진은 Meta가 접근 가능한 공개 URL이어야 하므로 이 프로젝트는 Supabase Storage에 JPEG로 올린 뒤 Instagram API에 전달합니다.

Vercel 환경변수:

```text
INSTAGRAM_GRAPH_BASE_URL=https://graph.instagram.com
INSTAGRAM_API_VERSION=v26.0
INSTAGRAM_USER_ID=...
INSTAGRAM_ACCESS_TOKEN=...
```

여러 장 사진은 최대 10장 캐러셀로 처리합니다.

## 네이버 지도 / 인스타 링크

```text
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/내계정
NEXT_PUBLIC_NAVER_MAP_URL=네이버지도업체링크
```

## DIVE에 업데이트하는 방법

이 ZIP을 풀고 **기존 DIVE 저장소의 파일을 새 내용으로 교체**하세요. 예전 `게코섬`, `GECKO ISLAND`, `components`, `data`, TypeScript 파일 등이 남지 않도록 기존 파일을 정리한 뒤 아래 구조를 올리는 것을 권장합니다.

```text
app/
lib/
public/
supabase/
.env.example
.gitignore
package.json
README_FIRST_KR.md
```

Vercel은 기존 `DIVE` 프로젝트가 GitHub와 연결되어 있으면 commit 후 자동 배포됩니다.
