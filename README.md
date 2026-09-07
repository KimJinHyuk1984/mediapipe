# AI 운동 코치 만들기

Python + MediaPipe 실시간 자세 인식 강의를 난이도별로 모은 저장소입니다.

배포 주소: https://kimjinhyuk1984.github.io/mediapipe/

- Level 1 — AI 스쿼트 왕: 입문, 2시간. 현재 12개 섹션 골격만 준비했습니다.
- Level 2 — AI 운동왕 시즌 2: 심화, 준비 중. 페이지는 아직 생성하지 않습니다.
- Phase 1-B의 본문·실습 코드·위젯 작성은 별도 확인 후 진행합니다.

## 구조

```text
index.html                 # 레벨 선택 허브
level1/index.html          # 스쿼트왕 강의 골격
data/site.js               # site, instructor, levels, otherLectures
assets/css/tokens.css      # 공통 디자인 토큰
assets/css/base.css        # 공통 UI와 학습 경로 카드
assets/css/lecture.css     # 강의 전용 스타일
assets/js/shared.js        # 메타·카드·모달·테마·발표·진행 체크
assets/js/widgets.js       # 강의별 위젯 등록
assets/img/instructor.webp # 공유 강사 사진
assets/img/level1/          # Level 1 이미지
docs/                      # 이미지 목록과 복원 코드
DESIGN.md                  # 공통 디자인 기준
.nojekyll                  # GitHub Pages 정적 파일 배포
sync-shared.ps1            # 공통 자산 동기화 도구
```

## 로컬 실행과 상대 경로

상위 디렉터리에서 실행합니다.

```powershell
cd ..
python3 -m http.server 8000
# Windows에서 python3 명령이 없으면: py -3 -m http.server 8000
```

http://localhost:8000/mediapipe/ 에서 허브를 엽니다.
서버 없이 루트 index.html을 직접 열어도 일반 스크립트가 실행되어 카드와 모달을 표시합니다.
일부 브라우저의 파일 주소 저장소 제한 시 진행 상태는 현재 페이지에서만 유지됩니다.

루트 HTML은 assets/와 data/를, 레벨 HTML은 ../assets/와 ../data/를 참조합니다.
공통 스크립트는 각 HTML의 data/site.js 참조 위치를 기준으로 이미지 주소를 계산합니다.
저장소 이름과 배포 도메인을 경로 계산에 사용하지 않으며 별도 basePath 설정도 없습니다.
허브의 준비된 카드는 ./{slug}/, 강의 목록 복귀는 ../입니다.
사이트 루트부터 시작하는 자산 경로는 사용하지 않습니다.
외부 강의 링크는 otherLectures의 HTTPS 주소를 사용합니다.

## 새 레벨 추가

1. data/site.js의 levels 배열에 항목을 추가합니다. 기존 항목을 참고해 slug, badge,
   title, subtitle, kicker, duration, target, difficulty, tags, accent, emoji, cover, status를 설정합니다.
2. level1/index.html 골격을 복사하여 {slug}/index.html을 생성하고 섹션을 구성합니다.
3. body에 `data-level="{slug}" data-accent="..."`를 설정합니다.
   accent는 neon-green, violet, amber 중 하나입니다.
4. 페이지가 준비되면 status를 ready로 설정합니다. coming은 링크 없는 준비 중 카드입니다.
   cover와 emoji는 빈 문자열이어도 됩니다. 이미지 경로는 assets/img/{slug}/...로 기록합니다.
5. `data-slide` 조각에 `data-slide-skip`을 붙이면 읽기 화면은 유지한 채 발표에서 제외하며, 발표 중 S로 포함/제외를 전환합니다(같은 조각 그룹 중 한 요소에만 붙여도 적용).

허브 카드는 levels 배열 순서대로 자동 생성됩니다. 허브 HTML에 카드를 추가하지 않습니다.
강의 메타도 data-level과 일치하는 항목에서 주입됩니다.
instructor는 모든 레벨과 허브에서 공유하며 photo 이외 기존 소개 정보를 유지합니다.

강의 페이지에서 P는 발표 모드 진입·종료, ←/→는 조각 이동, Shift+방향키는 섹션 이동, S는 건너뛴 조각 포함/제외, B는 블랙아웃,
Esc는 발표 종료입니다. 강사 모달이나 입력 중에는 발표 단축키가 동작하지 않습니다.
섹션 열람 체크는 `lecture-progress:{slug}`로 저장됩니다.
허브에서는 발표 모드와 섹션 진행 체크를 초기화하지 않습니다.
테마는 공통 저장 키 lecture-template-theme을 사용합니다.

## 템플릿 공통 자산 동기화

lectures-template과 mediapipe가 같은 상위 폴더에 있을 때,
**템플릿 쪽 스크립트**를 실행합니다.

```powershell
& ..\lectures-template\sync-shared.ps1 -TargetPath .
```

스크립트는 차이를 보여 준 뒤 y 입력 시 DESIGN.md, tokens.css, base.css, shared.js를 복사합니다.
HTML, data/site.js, lecture.css, widgets.js, 이미지, docs는 덮어쓰지 않습니다.
instructor 변경은 템플릿과 비교하여 수동 병합합니다.

이 저장소는 base.css에 레벨 카드, shared.js에 다중 레벨 처리를 확장했습니다.
동기화 전에 변경을 커밋하고 템플릿이 이 확장을 지원하는지 차이를 확인하세요.
단일 강의용 템플릿을 그대로 복사하면 확장이 사라질 수 있으므로 필요한 변경을 병합하고
허브·Level 1·파일 직접 열기를 다시 검증해야 합니다.

## 이미지와 자료 규칙

- 강사 사진은 assets/img/instructor.webp, 레벨 이미지는 assets/img/{slug}/에 보관합니다.
- 모든 img에 의미 있는 alt, loading="lazy", width/height를 지정합니다.
- docs/IMAGE-MANIFEST.md: 이미지의 원본 슬라이드, 크기, 대체 텍스트와 중복 처리 지침입니다.
  실제 Level 1 파일 위치는 assets/img/level1/입니다.
- docs/CODE-RECOVERED.md: 코드 스크린샷에서 복원한 텍스트와 계산 방식 설명입니다.
  본문 작성 시 코드 캡처 이미지 대신 복사 가능한 코드블록을 사용합니다.
- source/는 원본 자료 보관용으로 .gitignore에서 제외합니다.
- 외부 라이브러리, 원격 데이터 요청, ES module 없이 정적 HTML/CSS/JS로 동작합니다.

## Phase 1-A 검증

실행 환경과 항목별 결과는 docs/PHASE-1A-VERIFICATION.md에 기록합니다.
