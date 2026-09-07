# Phase 1-B-2 작업·검증 보고

검증일: 2026-09-07. Windows / Python 3.12.14 / Chrome + Playwright.

## 구현 범위

- setup 다운로드와 설치 안내 보완, step1·opencv·step2·landmarks 콘텐츠 작성.
- step3·tournament·extend는 기존 제목과 TODO 그대로 유지.
- base.css와 tokens.css는 이번 단계에서 수정하지 않았습니다.
- ver1 원본과 ver2는 수정하지 않았습니다. ver2 파일은 복사하지 않았습니다.
- level1/files에는 지정된 Python 파일 12개와 requirements.txt만 복사했습니다.

## 보안·파일 수정

가장 먼저 .gitignore에 ver1/, ver2/, source/, venv/, __pycache__/, *.pyc를 적용했습니다.
원본 압축파일 ver1.zip, ver2.zip도 제외했습니다. 원본 자료는 삭제하지 않았습니다.
git ls-files와 git status에서 ver1/ver2의 PPTX·PDF·PNG·가상환경이 추적 대상에 없음을 확인했습니다.
level1/files는 Git 제외 대상이 아니며, 허용된 13개 파일 이외의 파일은 없습니다.
복사된 파일에서 휴대폰 번호 형식 검색은 0건입니다.

- A-1: 기존 안내 주석과 세 패키지 고정을 유지하고 pillow==10.4.0 추가.
- A-2: 실행되는 모든 VideoCapture 호출을 0으로 통일하고 기본 카메라 안내 주석 적용.
  test_install.py의 “VideoCapture(1) 시도” 출력 문구는 대체 카메라 안내이므로 유지.
- A-3: 01webcam_05.py의 중복 헬퍼·전용 import 제거, korean_text에서 함수 import.
- A-4: 04count_01.py와 final.py의 judge_squat / GOOD SQUAT 오타 수정.
- A-5: final.py의 판정 반환값을 status에 반영하고 한글 헬퍼의 반환 프레임을 저장.
  final.py 전체 코드는 웹 본문에 싣지 않았습니다.
- A-7: setup에 세 파일 다운로드 추가, 출력 예시 OpenCV 4.10.0으로 수정.
  권장과 다른 예시라는 설명은 삭제했습니다.

## 실행 검증

상위 디렉터리에서 Python의 http.server를 실행하여 /mediapipe/level1/에 접근했습니다.
브라우저 검증은 verify-phase1b2.cjs, 정적 파일 검증은 verify-practice-files.py로 재현할 수 있습니다.

| 항목 | 결과 |
|---|---|
| 1. Git 제외·추적 상태 | 통과, 원본 자료·가상환경은 제외 |
| 2. 배포 파일 종류와 개수 | 통과, Python 12개 + requirements.txt |
| 3. A-1~A-5 수정 | 통과, 파일 재열람·원본 대비 허용 변경만 검사, Python 12개 구문 검사 |
| 4. 웹 코드와 실제 파일 | 통과, 원문 블록 9개를 문자 단위 비교, 공백·주석·끝 줄바꿈 포함 |
| 5. 강조 줄 | 통과, 01webcam 파일 간 diff의 추가·교체 줄과 일치 |
| 6. 다운로드 | 통과, 세 링크를 실제 클릭하고 내려받은 바이트와 파일 내용 비교 |
| 7. 섹션 | 통과, 콘텐츠 9개·TODO 3개 |
| 8. 새 이미지 | 통과, 3장 로드·alt·width·height·loading 확인 |
| 9. 복사 | 통과, 코드블록 14개 전부 실제 클립보드와 대조 |
| 10. 발표 모드 | 통과, 앞 9개 순서 이동, 375px·1920px에서 긴 코드가 섹션 폭 이내 |
| 11. 모바일 | 통과, 코드 내부 가로 스크롤·표 표시, 문서 폭 375px 유지 |
| 12. 테마·대비 | 통과, 라이트 최소 5.95:1 / 다크 최소 8.11:1 (검사한 카드·콜아웃 텍스트) |
| 13. 시즌 2 조사 | 아래 표에 기록, 코드 변경 없음 |

브라우저 페이지 오류·HTTP 오류 0건. 카드·이미지·표 캡처 시각 확인 완료.
Windows 클립보드의 CRLF는 LF로 정규화한 뒤 원문과 비교했습니다.
judge_squat는 두 파일 모두 170·160·100·70도 경계값을 실행해 반환 문구를 확인했습니다.
카메라를 실제로 켜거나 Python 패키지를 설치한 검증은 수행하지 않았습니다.
설치 결과 출력은 환경 예시이며 이 PC에서 실제 실행한 출력이 아닙니다.

본문의 네 줄 MediaPipe 개요는 사용자가 지정한 개념 예시로 별도 표시했습니다.
설치 명령·출력 예시·개념 예시는 실행 파일 전체를 옮긴 블록과 구분합니다.
실행 파일 블록은 data-source, 부분 발췌는 data-source-lines로 출처를 기록했습니다.
MediaPipe 두 부분은 순서대로 이어 붙이면 해당 파일 전체와 같습니다.

## A-6: 각도 함수 조사

| 원본 파일 | 방식 | 확인 위치·특징 |
|---|---|---|
| ver1/03angle_01.py | 벡터 내적 + arccos | np.dot, np.linalg.norm, np.clip, np.arccos |
| ver1/final.py | 벡터 내적 + arccos | 같은 계산 방식 |
| ver2/practice1_pushup.py | arctan2 | 27줄 함수, 두 방향각 차이·절댓값·180도 초과 보정 |
| ver2/practice2_jumpingjack.py | 각도 함수 없음 | 손목 y와 코 y 비교, 발목 x 간격과 어깨너비 × 1.3 비교 |
| ver2/practice3_multi_coach.py | arctan2 | 20줄 함수, 180도 초과 보정은 조건식 |
| ver2/practice4_workout_king.py | arctan2 | 18줄 함수, 180도 초과 보정은 조건식 |
| ver2/practice5_plank.py | arctan2 | 23줄 함수, 180도 초과 보정은 조건식 |

practice1의 “지난 시간에 만든 그대로” 주석과 달리 ver1과 함수 구현이 다릅니다.
이번 단계에서는 어느 쪽 각도 함수도 통일하거나 수정하지 않았습니다.

## 실제 파일을 기준으로 설명한 차이

- 01webcam_03부터 좌우 반전 코드가 빠지는 원본 구성을 보존하고 본문에서 설명했습니다.
- 01webcam_04는 글자 뒤에 채운 사각형을 그려 글자가 가려집니다. 디버깅 과제로 설명했습니다.
- requirements 상단의 requirements_new.txt 안내는 원본 주석 보존 요청에 따라 유지했습니다.
  본문에서는 다운로드 파일명 requirements.txt 사용을 명시했습니다.
- 02mediapipe_02는 with 이전에도 Pose를 생성하는 원본 줄이 남아 있습니다.
  with의 정리 대상은 with에서 생성한 객체임을 설명했으며, 추가 리팩터링은 하지 않았습니다.
- 신뢰도 값을 높이면 정확도가 반드시 높아진다는 단정 대신, 결과 수용 기준이 엄격해지고
  재탐지로 끊김·지연이 늘 수 있다고 설명했습니다.
  참고: [MediaPipe Pose 옵션·좌표](https://chuoling.github.io/mediapipe/solutions/pose.html).
- waitKey가 창 이벤트를 처리한다는 설명을 보충했습니다.
  참고: [OpenCV HighGUI](https://docs.opencv.org/4.x/d7/dfc/group__highgui.html).

나머지 3개 섹션 작성, 각도 방식 통일, 커밋·푸시·배포는 수행하지 않았습니다.
