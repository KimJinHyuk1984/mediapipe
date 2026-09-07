"""
========================================================================
practice1_pushup.py  -  푸쉬업 카운터 (팔꿈치 각도)
========================================================================
[지난 시간 복습]
  스쿼트 카운터의 "레시피" 4단계
    1) 관절 고르기   2) 각도 재기   3) UP / DOWN 기준 정하기   4) 카운트

[오늘의 변화]
  바뀌는 건 단 두 가지!
    - 관절:  무릎(엉덩이-무릎-발목)  ->  팔꿈치(어깨-팔꿈치-손목)
    - 푸쉬업 기준:  펴짐 > 160도 / 굽힘 < 90도

  ※ TIP: 푸쉬업은 옆에서(측면) 찍어야 팔이 잘 보입니다!

실행:  python practice1_pushup.py    (종료: q)
필요:  opencv-python==4.10.0.84 / mediapipe==0.10.21 / numpy==1.26.4
========================================================================
"""
import cv2
import numpy as np
import mediapipe as mp

# ----------------------------------------------------------------------
# [재사용 무기 1] 세 점으로 각도를 구하는 함수  (지난 시간에 만든 그대로!)
# ----------------------------------------------------------------------
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
# [재사용 무기 2] MediaPipe / 웹캠 준비  (지난 시간 그대로!)
# ----------------------------------------------------------------------
mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)

cap = cv2.VideoCapture(0)  # 기본 카메라. 안 잡히면 1로 변경

# ----------------------------------------------------------------------
# [상태 변수]  스쿼트 때와 100% 동일한 구조
# ----------------------------------------------------------------------
count = 0
stage = "UP"          # 시작은 팔 편 상태

while True:
    success, frame = cap.read()
    if not success:
        print("❌ 프레임 읽기 실패")
        break

    frame = cv2.flip(frame, 1)
    h, w = frame.shape[:2]

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb)

    if results.pose_landmarks:
        lm = results.pose_landmarks.landmark

        # --- (1) 관절 고르기: 오른팔 어깨(12) - 팔꿈치(14) - 손목(16) ---
        shoulder = [lm[12].x, lm[12].y]
        elbow    = [lm[14].x, lm[14].y]
        wrist    = [lm[16].x, lm[16].y]

        # --- (2) 각도 재기: 팔꿈치 각도 ---
        angle = calculate_angle(shoulder, elbow, wrist)

        # --- (3)(4) UP/DOWN 판정 + 카운트 (스쿼트의 상태머신 구조 재사용! (각도 기준은 푸쉬업용)) ---
        if angle < 90:                       # 팔 굽힘 = 내려간 상태
            stage = "DOWN"
        if angle > 160 and stage == "DOWN":  # 팔 다시 펴짐 = 올라온 순간!
            stage = "UP"
            count += 1
            print(f"💪 푸쉬업 {count}회!")

        # --- 화면 표시 ---
        mp_draw.draw_landmarks(frame, results.pose_landmarks,
                               mp_pose.POSE_CONNECTIONS)
        ex, ey = int(elbow[0] * w), int(elbow[1] * h)
        cv2.putText(frame, f"{int(angle)}deg", (ex + 10, ey),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

    # 카운트 박스
    cv2.rectangle(frame, (0, 0), (260, 90), (0, 0, 0), -1)
    cv2.putText(frame, "PUSH-UP", (15, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.putText(frame, f"COUNT: {count}", (15, 70),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)

    cv2.imshow("AI Push-up Counter", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
