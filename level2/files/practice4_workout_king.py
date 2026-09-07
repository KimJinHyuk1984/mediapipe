"""
========================================================================
practice4_workout_king.py  -  AI 운동왕 완성판 (60초 도전 + UI)
========================================================================
practice3의 만능 코치에 "경기 모드"를 더한 최종 버전!
  - [s] 키 : 60초 도전 시작  (카운트다운 후 측정)
  - 60초가 끝나면 기록 표시, 종목별 최고 기록 저장
  - 큰 카운트 UI / 진행 바 / 상태 표시

조작:  [1]스쿼트 [2]푸쉬업 [3]팔벌려뛰기   [s]60초 도전   [r]리셋   [q]종료
========================================================================
"""
import cv2
import time
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

def squat_state(lm):
    angle = calculate_angle([lm[24].x, lm[24].y], [lm[26].x, lm[26].y], [lm[28].x, lm[28].y])
    if 70 < angle <= 100: return "DOWN"  # 정자세 구간
    if angle > 160: return "UP"
    return None

def pushup_state(lm):
    angle = calculate_angle([lm[12].x, lm[12].y], [lm[14].x, lm[14].y], [lm[16].x, lm[16].y])
    if angle < 90:  return "DOWN"
    if angle > 160: return "UP"
    return None

def jack_state(lm):
    arms_up = (lm[15].y < lm[0].y) and (lm[16].y < lm[0].y)
    legs_open = abs(lm[27].x - lm[28].x) > abs(lm[11].x - lm[12].x) * 1.3
    return "UP" if (arms_up and legs_open) else "DOWN"

EXERCISES = {
    ord('1'): {"name": "SQUAT",        "state": squat_state,  "color": (0, 255, 0)},
    ord('2'): {"name": "PUSH-UP",      "state": pushup_state, "color": (0, 200, 255)},
    ord('3'): {"name": "JUMPING JACK", "state": jack_state,   "color": (255, 0, 255)},
}
ROUND_SECONDS = 60

mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
cap = cv2.VideoCapture(0)  # 기본 카메라. 안 잡히면 1로 변경

current   = EXERCISES[ord('1')]
count     = 0
stage     = "UP"
mode      = "PRACTICE"          # PRACTICE / READY / PLAY / RESULT
start_t   = 0
result    = 0
best      = {"SQUAT": 0, "PUSH-UP": 0, "JUMPING JACK": 0}

while True:
    success, frame = cap.read()
    if not success:
        break
    frame = cv2.flip(frame, 1)
    h, w = frame.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb)

    counting = mode in ("PRACTICE", "PLAY")
    if results.pose_landmarks:
        lm = results.pose_landmarks.landmark
        state = current["state"](lm)
        if counting:
            if state == "DOWN":
                stage = "DOWN"
            elif state == "UP" and stage == "DOWN":
                stage = "UP"
                count += 1
        mp_draw.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

    # ----- 모드별 처리 -----
    if mode == "READY":                       # 3초 카운트다운
        left = 3 - int(time.time() - start_t)
        if left <= 0:
            mode, count, stage, start_t = "PLAY", 0, "UP", time.time()
        else:
            cv2.putText(frame, str(left), (w // 2 - 40, h // 2),
                        cv2.FONT_HERSHEY_SIMPLEX, 5, (0, 255, 255), 8)

    if mode == "PLAY":
        remain = ROUND_SECONDS - (time.time() - start_t)
        if remain <= 0:
            result = count
            if result > best[current["name"]]:
                best[current["name"]] = result
            mode = "RESULT"
        else:
            bar_w = int((remain / ROUND_SECONDS) * (w - 40))
            cv2.rectangle(frame, (20, h - 45), (20 + bar_w, h - 25),
                          current["color"], -1)
            cv2.putText(frame, f"{remain:4.1f}s", (w - 150, h - 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)

    # ----- 상단 정보 박스 -----
    cv2.rectangle(frame, (0, 0), (380, 110), (0, 0, 0), -1)
    cv2.putText(frame, current["name"], (15, 35),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, current["color"], 2)
    cv2.putText(frame, str(count), (15, 100),
                cv2.FONT_HERSHEY_SIMPLEX, 2.2, (255, 255, 255), 4)
    cv2.putText(frame, f"BEST: {best[current['name']]}", (180, 70),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    if mode == "RESULT":
        cv2.rectangle(frame, (w // 2 - 220, h // 2 - 90),
                      (w // 2 + 220, h // 2 + 90), (0, 0, 0), -1)
        cv2.putText(frame, "TIME UP!", (w // 2 - 150, h // 2 - 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 255), 3)
        cv2.putText(frame, f"SCORE: {result}", (w // 2 - 150, h // 2 + 45),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.3, (255, 255, 255), 3)

    cv2.putText(frame, "[1/2/3]Pick  [s]60s Challenge  [r]Reset  [q]Quit",
                (15, h - 60), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1)

    cv2.imshow("AI Workout King", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key in EXERCISES and mode != "PLAY":
        current, count, stage, mode = EXERCISES[key], 0, "UP", "PRACTICE"
    elif key == ord('s') and mode != "PLAY":
        mode, start_t = "READY", time.time()
    elif key == ord('r'):
        count, stage, mode = 0, "UP", "PRACTICE"

cap.release()
cv2.destroyAllWindows()
