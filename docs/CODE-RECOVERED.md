# 스쿼트왕 — 코드 스크린샷 복원본

원본 PPT에서 이미지로만 있던 코드를 텍스트로 복원했다.
웹페이지에서는 아래 코드블록을 쓰고 스크린샷은 쓰지 않는다.

## slide-015 · cv2.putText 인자 설명

```python
cv2.putText(
    frame,                      # 어디에 그릴지 (프레임)
    "Hello, Camera!",           # 출력할 문자열
    (30, 60),                   # 위치 (x, y) — 왼쪽 상단 기준
    cv2.FONT_HERSHEY_SIMPLEX,   # 폰트 종류
    1.5,                        # 폰트 크기
    (0, 255, 0),                # 색상 (B, G, R) — 초록색
    3                           # 글자 두께
)
```

> ⚠️ OpenCV는 RGB가 아니라 **BGR** 순서다.
> (0,255,0) 초록 / (255,0,0) 파랑 / (0,0,255) 빨강 / (0,255,255) 노랑 / (255,255,255) 흰색

## slide-016 · 도형 그리기

```python
# 사각형: cv2.rectangle(이미지, 시작점, 끝점, 색상, 두께)
# 두께에 -1 을 넣으면 안이 채워짐
cv2.rectangle(frame, (50, 50), (250, 200), (0, 255, 255), 2)
```

## slide-024 · MediaPipe 초기 설정과 무릎 좌표 추출

```python
from korean_text import put_korean_text
import cv2
import mediapipe as mp

mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils
pose = mp_pose.Pose()

landmark_style = mp_draw.DrawingSpec(color=(0, 255, 0),
                                     thickness=5,
                                     circle_radius=5)
connection_style = mp_draw.DrawingSpec(color=(0, 255, 255),
                                       thickness=2)

cap = cv2.VideoCapture(1)        # 1번 카메라

with mp_pose.Pose(min_detection_confidence=0.7,
                  min_tracking_confidence=0.7) as pose:
    while True:
        success, frame = cap.read()
        if not success:
            break
        frame = cv2.flip(frame, 1)              # 좌우 반전
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        results = pose.process(rgb)

        if results.pose_landmarks:
            mp_draw.draw_landmarks(frame, results.pose_landmarks,
                                   landmark_style, connection_style)
            landmarks = results.pose_landmarks.landmark
            knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE]
            h, w, _ = frame.shape               # 화면 높이, 너비, 채널수
            knee_x = int(knee.x * w)
            knee_y = int(knee.y * h)
            cv2.circle(frame, (knee_x, knee_y), 10, (0, 0, 255), -1)
            frame = put_korean_text(frame, f"무릎 좌표: ({knee_x}, {knee_y})",
                                    (knee_x + 20, knee_y), font_size=24,
                                    color=(0, 0, 255))
        else:
            frame = put_korean_text(frame, "사람 감지 실패", (30, 50),
                                    font_size=24, color=(0, 0, 255))

        cv2.imshow("My Webcam", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

cap.release()
cv2.destroyAllWindows()
```

## slide-030 · calculate_angle (내적 방식)

PPT 본문(슬라이드 26~28)과 이 스크린샷은 계산 방식이 다르다.
스크린샷은 **벡터 내적(arccos)**, 본문은 **arctan2** 방식이다.
시즌2에서 그대로 재사용하는 것은 **arctan2 버전**이므로,
웹에서는 arctan2 버전을 본편으로 싣고 내적 버전은 참고로 둔다.

### arctan2 버전 (본편 — 시즌2에서 재사용)

```python
import numpy as np

def calculate_angle(a, b, c):
    """세 관절의 (x, y) 좌표를 받아 꼭짓점 b의 각도를 반환합니다."""
    a, b, c = np.array(a), np.array(b), np.array(c)
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) \
            - np.arctan2(a[1] - b[1], a[0] - b[0])
    angle = np.abs(np.degrees(radians))
    if angle > 180.0:
        angle = 360.0 - angle
    return angle
```

### 내적 버전 (참고)

```python
import numpy as np

def calculate_angle(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ba = a - b        # 무릎 → 엉덩이 방향
    bc = c - b        # 무릎 → 발목 방향

    dot_product = np.dot(ba, bc)
    magnitude_ba = np.linalg.norm(ba)
    magnitude_bc = np.linalg.norm(bc)
    cosine_angle = dot_product / (magnitude_ba * magnitude_bc)
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    angle = np.degrees(np.arccos(cosine_angle))

    return angle
```

수학 원리:
1. 벡터 BA = A − B (꼭짓점 → A 방향)
2. 벡터 BC = C − B (꼭짓점 → C 방향)
3. cos θ = (BA · BC) / (|BA| × |BC|) ← 벡터 내적 공식
4. θ = arccos(cos θ) ← 각도로 변환

매개변수: a = 시작점(예: 엉덩이), b = 꼭짓점(예: 무릎, 이 각도를 구함), c = 끝점(예: 발목)
반환값: 각도 (0~180도)

## slide-031 · 자세 판정 함수

```python
def judge_squart(angle):
    if angle > 160:
        return "STAND UP", (200, 200, 200)     # 회색
    elif angle > 100:
        return "MORE DEEP", (0, 200, 255)      # 노란색
    elif angle > 70:
        return "GOOD SQUART", (0, 255, 0)      # 초록색
    else:
        return "TOO DEEP", (0, 128, 255)       # 주황색
```

## 상태머신 카운트 로직 (슬라이드 29 인포그래픽에서 복원)

```python
stage = "UP"      # 시작은 서 있는 상태
counter = 0       # 카운트한 횟수

if knee_angle < 100 and stage == "UP":
    stage = "DOWN"                    # 앉았다 → DOWN 으로 전환

if knee_angle > 160 and stage == "DOWN":
    stage = "UP"                      # 일어났다 → DOWN 에서 UP 으로
    counter += 1                      # 이때만 카운트 +1
```

핵심: 한 사이클(UP → DOWN → UP)이 1회. 올라오는 **순간**에만 +1 한다.
단순 비교로 세면 30fps 영상에서 1회가 30회로 세어진다.
