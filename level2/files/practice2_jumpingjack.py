"""
========================================================================
practice2_jumpingjack.py  -  팔벌려뛰기 카운터 (★위치 기반★)
========================================================================
[오늘의 핵심 "아하!" 포인트]
  팔벌려뛰기는 '각도'로 잡기 어렵다!
    - 스쿼트/푸쉬업 = 관절이 "접혔다 펴졌다" → 각도가 딱 맞음
    - 팔벌려뛰기   = 팔이 "위로", 다리가 "옆으로" → 각도보다 '위치/거리'!

  그래서 측정 방법을 바꾼다:
    - 팔 올림 판정 :  손목 y < 코 y      (y는 작을수록 화면 위쪽!)
    - 다리 벌림 판정:  두 발목 사이 x거리 > 어깨너비       (벌어졌나?)

  ※ MediaPipe 좌표는 0~1 비율값이라 화면 크기와 무관하게 비교 가능!

실행:  python practice2_jumpingjack.py    (종료: q)
========================================================================
"""
import cv2
import mediapipe as mp

mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)

cap = cv2.VideoCapture(0)  # 기본 카메라. 안 잡히면 1로 변경

count = 0
stage = "DOWN"        # 시작은 팔 내린 상태(차렷)

while True:
    success, frame = cap.read()
    if not success:
        print("❌ 프레임 읽기 실패")
        break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb)

    if results.pose_landmarks:
        lm = results.pose_landmarks.landmark

        # --- 필요한 위치 가져오기 ---
        nose       = lm[0]
        l_wrist    = lm[15]
        r_wrist    = lm[16]
        l_shoulder = lm[11]
        r_shoulder = lm[12]
        l_ankle    = lm[27]
        r_ankle    = lm[28]

        # --- (측정 1) 두 손목이 모두 코보다 위에 있나? (팔 올림) ---
        arms_up = (l_wrist.y < nose.y) and (r_wrist.y < nose.y)

        # --- (측정 2) 발 사이 거리가 어깨너비보다 넓나? (다리 벌림) ---
        shoulder_width = abs(l_shoulder.x - r_shoulder.x)
        ankle_gap      = abs(l_ankle.x - r_ankle.x)
        legs_open      = ankle_gap > shoulder_width * 1.3

        # --- 동작 판정: 팔도 올리고 다리도 벌리면 "벌린 자세(UP)" ---
        is_open = arms_up and legs_open

        # --- 카운트 (스쿼트와 똑같은 상태머신!) ---
        if not is_open:                       # 모은 자세
            stage = "DOWN"
        if is_open and stage == "DOWN":       # 모았다가 벌린 순간!
            stage = "UP"
            count += 1
            print(f"🤸 팔벌려뛰기 {count}회!")

        mp_draw.draw_landmarks(frame, results.pose_landmarks,
                               mp_pose.POSE_CONNECTIONS)

        # 현재 판정 상태 표시 (디버깅용 - 학생들이 원리를 보게)
        cv2.putText(frame, f"arms_up: {arms_up}", (15, 130),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        cv2.putText(frame, f"legs_open: {legs_open}", (15, 160),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

    cv2.rectangle(frame, (0, 0), (300, 90), (0, 0, 0), -1)
    cv2.putText(frame, "JUMPING JACK", (15, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 255), 2)
    cv2.putText(frame, f"COUNT: {count}", (15, 70),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)

    cv2.imshow("AI Jumping Jack Counter", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
