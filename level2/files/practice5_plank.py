"""
========================================================================
practice5_plank.py  -  (보너스) 플랭크 버티기 타이머
========================================================================
[새로운 개념: 횟수가 아니라 "시간"을 재는 상태머신]
  스쿼트/푸쉬업/팔벌려뛰기 = 동작을 "셈" (반복 횟수)
  플랭크                  = 자세를 "버팀" (지속 시간!)

  -> 같은 상태머신이지만, UP일 때 +1 하는 대신 '시간을 누적'한다.

[플랭크 자세 판정]
  몸이 일직선인가?  어깨(12)-엉덩이(24)-발목(28) 각도가 약 160~180도
  (구부정하면 각도가 작아짐 -> 타이머 일시정지!)

실행:  python practice5_plank.py    (종료: q / 리셋: r)
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

mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
cap = cv2.VideoCapture(0)  # 기본 카메라. 안 잡히면 1로 변경

held_time = 0.0          # 누적 버틴 시간(초)
last_t = time.time()     # 직전 프레임 시각

while True:
    success, frame = cap.read()
    if not success:
        break
    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb)

    now = time.time()
    dt = now - last_t        # 이번 프레임이 걸린 시간
    last_t = now

    is_plank = False
    if results.pose_landmarks:
        lm = results.pose_landmarks.landmark
        body_angle = calculate_angle([lm[12].x, lm[12].y],
                                     [lm[24].x, lm[24].y],
                                     [lm[28].x, lm[28].y])
        is_plank = body_angle > 160      # 몸이 충분히 일직선인가?

        # ★ 카운트 대신 '시간 누적' ★
        if is_plank:
            held_time += dt

        mp_draw.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
        cv2.putText(frame, f"body: {int(body_angle)}deg", (15, 150),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

    color = (0, 255, 0) if is_plank else (0, 0, 255)
    status = "HOLDING!" if is_plank else "FIX POSTURE"

    cv2.rectangle(frame, (0, 0), (360, 110), (0, 0, 0), -1)
    cv2.putText(frame, "PLANK", (15, 35),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
    cv2.putText(frame, f"{held_time:5.1f} s", (15, 95),
                cv2.FONT_HERSHEY_SIMPLEX, 1.6, (255, 255, 255), 3)
    cv2.putText(frame, status, (190, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

    cv2.imshow("AI Plank Timer", frame)
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    if key == ord('r'):
        held_time = 0.0

cap.release()
cv2.destroyAllWindows()
