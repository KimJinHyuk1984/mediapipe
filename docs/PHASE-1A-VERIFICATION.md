# Phase 1-A 검증 결과

검증일: 2026-09-07 (Asia/Seoul)

## 구현 범위

- 루트 허브, Level 1의 12개 섹션 골격, levels 스키마와 README를 작성했습니다.
- 강사 정보는 photo 경로만 webp로 변경했습니다.
- tokens.css, lecture.css, DESIGN.md 및 원본 자료는 변경하지 않았습니다.
- 강의 본문은 TODO 주석만 있으며 Phase 1-B는 시작하지 않았습니다.

## 실행 환경

Windows, Python 3.12.14, Node.js 22.22.2, 설치된 Chrome + Playwright로 실행했습니다.
python3 명령은 PATH에 없고 py 런처도 설치된 Python을 찾지 못해,
로컬 런타임의 Python 3 실행 파일로 동일한 http.server 모듈을 실행했습니다.

상위 디렉터리 D:/000vibecoding에서 실행한 명령:

```powershell
& 'C:/Users/DY_MAIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' -m http.server 8000 --bind 127.0.0.1
```

브라우저 검증 스크립트: [verify-phase1a.cjs](verify-phase1a.cjs).
Playwright와 Chrome이 있는 환경에서 서버를 실행한 뒤 node docs/verify-phase1a.cjs로 재실행합니다.
이 환경에서는 기존 Playwright 설치 경로를 NODE_PATH에 지정했습니다.
페이지 오류, 실패한 요청, HTTP 400 이상 응답을 수집하여 모두 0건임을 확인했습니다.

## 요청 항목별 결과

| 항목 | 결과 | 확인 내용 |
|---|---|---|
| 1. 하위 경로 HTTP | 통과 | /mediapipe/와 /mediapipe/level1/ 및 참조 자산에서 404 없음 |
| 2. 파일 직접 열기 | 통과 | file 주소의 루트 index.html에서 카드 2개, 강사 모달·사진 표시 |
| 3. 왕복 이동 | 통과 | HTTP에서 허브 카드 → level1/ → ← 강의 목록 → 허브 |
| 4. Level 2 | 통과 | opacity 0.58, 준비 중 배지, href와 포커스 가능한 자식 없음, 클릭 후 URL 불변, 이미지 영역 없음 |
| 5. 발표 단축키 | 통과 | Level 1에서 P 진입·Esc 종료, 방향키 이동·B 블랙아웃. 허브 P는 상태 변화 없음 |
| 6. 진행 저장 | 통과 | lecture-progress:level1에 mission 등 기록, 새로고침 후 체크 복원, 허브에서는 진행 키 생성 없음 |
| 7. 강사 사진 | 통과 | 허브·Level 1 및 모달 이미지의 naturalWidth와 로드 상태 확인 |
| 8. 화면·접근성 설정 | 통과 | 두 페이지 × 375/1920px × 라이트/다크 검사. 가로 넘침 없음, 모달이 뷰포트 내 표시, reduced motion에서 smooth scroll·진입 효과 해제 |
| 9. 금지된 통신 API | 통과 | 코드 파일 전체에서 fetch / XMLHttpRequest 문자열 0건 |

HTTP와 별도로 Level 1의 file 주소에서도 메타, 발표 모드, 진행 저장, 모달을 검사했습니다.
요청한 링크 형식 ./{slug}/와 ../를 유지하므로, file 주소에서 폴더 링크를 클릭하면
브라우저의 디렉터리 표시 동작을 따릅니다. 파일 방식에서는 각 index.html을 직접 열어 검사했고,
카드 클릭을 통한 왕복 이동은 HTTP에서 검증했습니다.

## 추가 확인

- 12개 섹션 ID와 순서 일치, 자동 생성된 내비게이션 칩 12개, 예시 코드블록 0개.
- 모달 Esc 닫기 및 열었던 버튼으로 포커스 복귀.
- 375px·1920px 라이트/다크 캡처 생성과 시각 확인.
- JavaScript 구문 검사와 git diff --check 통과.
- 루트 절대 자산 경로 없음. 이미지 주소는 HTML이 참조한 data/site.js 위치 기준.
- 기존 이미지 18개 유지, 새로운 강의 본문이나 Level 2 페이지는 생성하지 않음.

검증 완료 후 로컬 테스트 서버를 종료했습니다. 배포·커밋·푸시는 수행하지 않았습니다.
