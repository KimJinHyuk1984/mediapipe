"""
========================================================================
practice3_multi_coach.py  -  만능 운동 코치 (종목 전환)
========================================================================
[오늘의 핵심: 추상화 / 데이터로 설계하기]
  스쿼트 / 푸쉬업 / 팔벌려뛰기 ... 운동이 달라도
  "카운트 로직"은 완전히 똑같다!  (UP <-> DOWN 상태머신)

  달라지는 건 "지금 자세가 UP이냐 DOWN이냐"를 판단하는 부분 뿐.
  -> 그 판단 부분만 함수로 따로 빼고,
     카운트 로직은 하나로 공유하자!

  조작:  [1] 스쿼트   [2] 푸쉬업   [3] 팔벌려뛰기   [q] 종료
========================================================================
"""
import cv2
import numpy as np
import mediapipe as mp

def calculate_angle(a, b, c):
    """b를 꼭짓점으로 하는 a-b-c 각도(도)를 반환"""
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)
    # Level 1과 같은 벡터 내적 + arccos
    ba = a - b
    bc = c - b
    dot_product = np.dot(ba, bc)
    magnitude_ba = np.linalg.norm(ba)
    magnitude_bc = np.linalg.norm(bc)
    cosine_angle = dot_product / (magnitude_ba * magnitude_bc)
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    return np.degrees(np.arccos(cosine_angle))

# ----------------------------------------------------------------------
# [운동별 "자세 판정" 함수]  각 함수는 "UP" / "DOWN" / None 을 반환
#   None = 애매한 중간 자세 (상태를 바꾸지 않음)
# ----------------------------------------------------------------------
def squat_state(lm):
    hip   = [lm[24].x, lm[24].y]
    knee  = [lm[26].x, lm[26].y]
    ankle = [lm[28].x, lm[28].y]
    angle = calculate_angle(hip, knee, ankle)
    if 70 < angle <= 100: return "DOWN"  # 정자세 구간
    if angle > 160:  return "UP"
    return None

def pushup_state(lm):
    shoulder = [lm[12].x, lm[12].y]
    elbow    = [lm[14].x, lm[14].y]
    wrist    = [lm[16].x, lm[16].y]
    angle = calculate_angle(shoulder, elbow, wrist)
    if angle < 90:   return "DOWN"
    if angle > 160:  return "UP"
    return None

def jack_state(lm):
    arms_up = (lm[15].y < lm[0].y) and (lm[16].y < lm[0].y)
    shoulder_width = abs(lm[11].x - lm[12].x)
    legs_open = abs(lm[27].x - lm[28].x) > shoulder_width * 1.3
    return "UP" if (arms_up and legs_open) else "DOWN"

# ----------------------------------------------------------------------
# [운동을 "데이터"로 정의]  이름 + 판정함수 + 색깔
#   새 운동을 추가하고 싶으면? 여기에 한 줄만 추가하면 끝!
# ----------------------------------------------------------------------
EXERCISES = {
    ord('1'): {"name": "SQUAT",        "state": squat_state,  "color": (0, 255, 0)},
    ord('2'): {"name": "PUSH-UP",      "state": pushup_state, "color": (0, 200, 255)},
    ord('3'): {"name": "JUMPING JACK", "state": jack_state,   "color": (255, 0, 255)},
}

mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
cap = cv2.VideoCapture(0)  # 기본 카메라. 안 잡히면 1로 변경

current = EXERCISES[ord('1')]   # 시작 운동 = 스쿼트
count = 0
stage = "UP"

while True:
    success, frame = cap.read()
    if not success:
        break
    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb)

    if results.pose_landmarks:
        lm = results.pose_landmarks.landmark

        # ★ 운동마다 다른 부분: 자세 판정 (함수만 갈아끼움) ★
        state = current["state"](lm)

        # ★ 모든 운동이 공유하는 부분: 카운트 로직 ★
        if state == "DOWN":
            stage = "DOWN"
        elif state == "UP" and stage == "DOWN":
            stage = "UP"
            count += 1

        mp_draw.draw_landmarks(frame, results.pose_landmarks,
                               mp_pose.POSE_CONNECTIONS)

    cv2.rectangle(frame, (0, 0), (340, 95), (0, 0, 0), -1)
    cv2.putText(frame, current["name"], (15, 32),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, current["color"], 2)
    cv2.putText(frame, f"COUNT: {count}", (15, 75),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
    cv2.putText(frame, "[1]Squat [2]Push-up [3]Jack [q]Quit",
                (15, frame.shape[0] - 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1)

    cv2.imshow("AI Multi Coach", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    if key in EXERCISES:                 # 종목 전환!
        current = EXERCISES[key]
        count = 0                        # 새 운동 시작 -> 0부터
        stage = "UP"
        print(f"➡️  {current['name']} 모드로 전환!")

cap.release()
cv2.destroyAllWindows()
