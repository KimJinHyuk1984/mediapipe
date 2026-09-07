from korean_text import put_korean_text
import cv2
import mediapipe as mp

# Mediapipe 초기화
mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils
pose = mp_pose.Pose()

# 관절 포인트 스타일(초록색 점)
landmark_style = mp_draw.DrawingSpec(color=(0, 255, 0),     # 초록색
                                     thickness=5,           # 점 테두리 두께
                                     circle_radius=5        # 점 크기
                                     )
# 관절 연결선 스타일(노란색 선)
connection_style = mp_draw.DrawingSpec(color=(0, 255, 255), # 노란색
                                       thickness=2          # 선 두께
                                       )        

cap = cv2.VideoCapture(0)        # 기본 카메라. 안 잡히면 1로 변경
# 동작 조건 설정
with mp_pose.Pose(
    min_detection_confidence=0.7,  # 관절 감지 신뢰도 임계값 : 70% 이상 확신할 때만 감지
    min_tracking_confidence=0.7     # 관절 추적 신뢰도 임계값 : 높을 수록 정확하지만 끊김이 생길 수 있음
) as pose:
    while True:
        success, frame = cap.read()
        if not success:
            break
        frame = cv2.flip(frame, 1) # 좌우 반전
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        # ──────────────────────────────────────────────
        # AI 포즈 분석 실행
        # ──────────────────────────────────────────────
        # pose.process(rgb) 한 줄이면 AI가 33개 관절을 찾아줌!
        # results.pose_landmarks 에 결과가 담김
        #   → 사람이 없으면 None
        #   → 사람이 있으면 33개 관절의 좌표 데이터
        results = pose.process(rgb)

        # ──────────────────────────────────────────────
        # 관절이 감지되면 처리
        # ──────────────────────────────────────────────
        if results.pose_landmarks:
            mp_draw.draw_landmarks(         # 관절 감지 결과를 화면에 그리기
                frame,                      # 어디에 그릴지
                results.pose_landmarks,     # 감지된 관절 데이터
                mp_pose.POSE_CONNECTIONS,   # 관절 연결 정보
                landmark_style,             # 관절 포인트 스타일 적용
                connection_style            # 관절 연결선 스타일 적용
            )

            # ──────────────────────────────────────────────
            # 특정 관절 좌표 추출하기
            # ──────────────────────────────────────────────
            landmarks = results.pose_landmarks.landmark
            # 왼쪽 무릎 좌표 가져오기 (번호: 25)
            # ⚠️ 좌표값은 0.0 ~ 1.0 사이의 "비율"
            #    → 실제 픽셀 위치로 변환하려면
            #       x * 화면너비, y * 화면높이 를 곱해야 함
            knee = landmarks[mp_pose.PoseLandmark.LEFT_KNEE]

            # 화면 크기 가져오기
            h, w, _ = frame.shape # 화면 높이, 너비, 채널수

            # 비율 -> 픽셀 좌표 변환
            knee_x = int(knee.x * w)
            knee_y = int(knee.y * h)

            # 무릎 좌표에 빨간색 원 그리기
            cv2.circle(frame, (knee_x, knee_y), 10, (0, 0, 255), -1)

            # 무릎 좌표 텍스트로 표시하기
            frame = put_korean_text(frame,
                                    f"무릎 좌표: ({knee_x}, {knee_y})",
                                    (knee_x + 20, knee_y),
                                    font_size=24,
                                    color=(0, 0, 255)
            )
        else:
            # 사람이 감지되지 않으면
            frame = put_korean_text(frame,
                                    "사람 감지 실패",
                                    (30, 50),
                                    font_size=24,
                                    color=(0, 0, 255)
            )
        cv2.imshow("My Webcam", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
cap.release()
cv2.destroyAllWindows()

