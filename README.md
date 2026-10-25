# 예지민의 첫 포트폴리오

HTML, CSS, JavaScript를 배우면서 만든 자기소개 웹사이트다. 메뉴를 누르거나 입력창에 글을 쓰는 행동이 실제 화면 변화로 이어지도록 구현했다. 프로젝트 영역에는 GitHub 공개 저장소를 불러온다.

## 사용 기술

- HTML: 시맨틱 태그, 앵커 링크, label과 입력창 연결
- CSS: CSS 변수, Flexbox, Grid, 미디어 쿼리, 전환 효과
- JavaScript: DOM 선택, 이벤트, 상태 객체, 배열 메서드, 비동기 요청
- GitHub REST API, GitHub Pages
- 외부 JavaScript/CSS 라이브러리와 프레임워크는 사용하지 않았다.

## 파일 구성

| 경로 | 역할 |
| --- | --- |
| index.html | 페이지 내용과 구조 |
| css/style.css | 색상, 레이아웃, 반응형, 다크 모드 |
| js/main.js | 이벤트, 상태, 화면 갱신, GitHub API |
| images/profile.svg | 기본 프로필 아바타 |
| images/favicon.svg | 브라우저 탭 아이콘 |
| images/screenshots/ | 데스크톱·모바일·다크 모드 캡처 |
| 코드설명.md | 평가문항을 이해하기 위한 코드 설명 |

## 실행 방법

1. VS Code에서 프로젝트 폴더를 연다.
2. Live Server 확장 프로그램을 설치한다.
3. index.html을 우클릭하고 Open with Live Server를 누른다.
4. 브라우저 주소가 file:///가 아니라 http://127.0.0.1:포트번호/ 형태인지 확인한다.

## 본인 정보 수정

- GitHub 아이디: js/main.js 맨 위 GITHUB_USERNAME. 현재는 Yebook2다.
- 이름과 자기소개: index.html에서 수정한다.
- 사진: 기본 아바타를 본인 사진으로 바꿔도 된다. images에 사진을 넣고 img의 src, alt를 함께 수정한다.
- 주의: 문의 폼은 입력 검사만 수행한다. 이메일이나 메시지를 외부로 전송하지 않는다.

## 구현한 기능

- Hero, About, Skills, Projects, Contact, Footer 구성
- Flexbox 네비게이션, Grid 프로젝트 카드
- 모바일 햄버거 메뉴, 메뉴 선택 후 닫기, Escape로 닫기
- 다크/라이트 전환, localStorage 저장, 첫 방문 시 시스템 테마 감지
- 부드러운 앵커 이동, 스크롤 시 헤더 변경, 맨 위 버튼
- Intersection Observer를 이용한 제목 등장 효과
- GitHub 로딩·성공·에러·빈 목록, 오류 후 재시도
- 언어별 필터 버튼
- 필수값·공백·이메일 형식 검사, 입력창 옆 오류 표시
- 올바른 입력에 대한 확인 메시지와 기본 폼 제출 방지
- 키보드 포커스, aria-expanded, aria-invalid, 상태 안내
- 움직임 줄이기 설정을 사용하면 스크롤·등장 애니메이션 생략

## 기준값

| 항목 | 값 |
| --- | --- |
| 태블릿 브레이크포인트 | 768px |
| 데스크톱 브레이크포인트 | 1024px |
| 헤더 스타일 변경 | 스크롤 60px 이상 |
| 맨 위 버튼 표시 | 스크롤 300px 이상 |
| Intersection Observer threshold | 0.2 |
| 관찰 대상 | 각 섹션의 제목 또는 제목 묶음 |
| API 요청 제한 시간 | 15초 |
| 표시할 저장소 | 최근 업데이트 순 최대 100개 공개 저장소 |

프로젝트 영역 전체를 관찰하지 않은 이유는 저장소가 많으면 영역 높이가 커져 20%가 화면에 들어오지 못할 수 있기 때문이다. 대신 높이가 작은 제목을 관찰한다.

## API 동작

사용하는 주소:

`https://api.github.com/users/{아이디}/repos?sort=updated&direction=desc&per_page=100`

1. 요청 직전에 state.projectStatus를 loading으로 바꾼다.
2. fetch와 await로 응답을 기다린다.
3. response.ok를 확인해 HTTP 오류도 catch로 처리한다.
4. 저장소가 있으면 success, 없으면 empty로 설정한다.
5. 네트워크 오류·시간 초과·HTTP 오류는 error로 설정한다.
6. renderProjects가 현재 상태에 맞춰 화면을 바꾼다.

인증 없는 GitHub API 요청은 보통 IP 기준 시간당 60회로 제한된다. 반복 새로고침을 피한다. 403·429 응답은 접근 제한 또는 호출 제한 안내로 처리하며 재시도 버튼을 표시한다. 데이터는 브라우저 메모리에 보관하고, 언어 필터를 누를 때는 API를 다시 호출하지 않는다.

공식 문서: [GitHub 저장소 API](https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user)

## 상태와 렌더링

| 사용자 행동 또는 작업 | 상태 변경 | 화면 변경 함수 |
| --- | --- | --- |
| 테마 버튼 클릭 | state.theme | renderTheme |
| 메뉴 버튼 클릭 | state.menuOpen | renderMenu |
| 페이지 스크롤 | state.headerScrolled, state.topVisible | renderScroll |
| API 요청 | state.projectStatus, state.repos, state.apiError | renderProjects |
| 언어 버튼 클릭 | state.language | renderProjects |
| 폼 입력·제출 | state.errors, state.formMessage | renderForm |

## 확인 방법

| 확인 항목 | 방법 | 기대 결과 |
| --- | --- | --- |
| 모바일 배치 | Chrome 개발자 도구에서 390px·320px로 변경 | 가로 넘침 없이 한 열로 배치 |
| 햄버거 메뉴 | 모바일에서 메뉴 버튼 두 번 클릭 | 열기·닫기 |
| 앵커 이동 | 메뉴에서 연락 선택 | 메뉴가 닫히고 문의 영역으로 이동 |
| 테마 저장 | 테마 전환 후 새로고침 | 선택한 테마 유지 |
| 스크롤 | 300px 이상 이동 후 맨 위 버튼 클릭 | 헤더 배경 변경, 버튼 표시, 맨 위 이동 |
| API 성공 | 정상 GitHub 아이디로 실행 | 실제 저장소 카드 표시 |
| API 로딩 | 개발자 도구 Network에서 속도를 느리게 설정 후 새로고침 | 로딩 문구와 회전 표시 |
| API 에러 | Network를 Offline으로 변경 후 새로고침 | 오류 안내와 재시도 버튼 |
| 재시도 | Online으로 복구 후 다시 시도 클릭 | 카드가 다시 표시됨 |
| 빈 목록 | 공개 저장소가 없는 계정으로 실행 | 표시할 프로젝트가 없습니다 |
| 언어 필터 | 특정 언어 버튼 선택 | 해당 언어의 카드만 표시 |
| 필수값 | 빈칸 또는 공백만 입력 후 제출 | 해당 입력창 옆 오류 |
| 이메일 | abc 입력 | 형식 오류 안내 |
| 올바른 입력 | 이름·이메일·메시지를 채우고 제출 | 확인 안내, 새로고침과 실제 전송 없음 |

## GitHub Pages 배포

아직 이 파일만으로 배포가 완료된 것은 아니다. 아래 작업을 마친 뒤 실제 주소를 적는다.

1. GitHub에 공개 저장소 my-portfolio를 만든다.
2. index.html, css, js, images, README.md가 저장소 최상위에 오도록 업로드한다.
3. Settings → Pages를 연다.
4. Source: Deploy from a branch, Branch: main, Folder: /(root)를 선택한다.
5. Save를 누르고 배포 완료 후 표시된 주소로 접속한다.
6. 배포된 사이트에서 API, 테마, 모바일 메뉴, 폼을 다시 확인한다.

- 저장소 URL: 배포 후 본인 저장소 주소로 수정
- 배포 URL: 배포 후 GitHub Pages에 표시된 주소로 수정
- 주소 형식 예시: https://yebook2.github.io/my-portfolio/

## 화면 캡처

아래 이미지는 로컬 실행 화면이다. 배포 후 내용이나 계정 정보를 바꾸었다면 실제 배포 화면으로 다시 캡처한다.

### 데스크톱

![데스크톱 화면](./images/screenshots/desktop.png)

### 모바일

![모바일 화면](./images/screenshots/mobile.png)

### 다크 모드

![다크 모드 화면](./images/screenshots/dark.png)

## 제출 전 남은 일

- 본인 이름·GitHub 계정·자기소개 확인
- 실제 저장소 URL과 배포 URL을 위 항목에 작성
- GitHub Pages에서 외부 접속과 주요 기능 확인
- 필요하면 최종 배포 화면으로 스크린샷 교체
- 코드설명.md를 읽고 실제 코드 위치를 따라가며 설명 연습
