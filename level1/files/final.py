import cv2
import mediapipe as mp
from korean_text import put_korean_text
import time
import numpy as np

# 각도 계산 함수
def calculate_angle(a, b, c):

    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ba = a - b   # 무릎 → 엉덩이 방향
    bc = c - b   # 무릎 → 발목 방향

    dot_product = np.dot(ba, bc)
    magnitude_ba = np.linalg.norm(ba)
    magnitude_bc = np.linalg.norm(bc)
    cosine_angle = dot_product / (magnitude_ba * magnitude_bc)
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    angle = np.degrees(np.arccos(cosine_angle))

    return angle

# 스쿼트 자세 판정 함수
def judge_squat(angle):
    if angle > 160:
        return "STAND UP", (200, 200, 200)   # 회색
    elif angle > 100:
        return "MORE DEEP", (0, 200, 255)    # 노란색
    elif angle > 70:
        return "GOOD SQUAT", (0, 255, 0)    # 초록색
    else:
        return "TOO DEEP", (0, 128, 255)     # 주황색

def get_coord(landmark):
    """랜드마크 → [x, y] 리스트"""
    return [landmark.x, landmark.y]

# ══════════════════════════════════════════════════════
# UI 그리기 함수들
# ══════════════════════════════════════════════════════
def draw_panel(frame, x, y, w, h, alpha=0.55):
    """반투명 검정 패널 그리기"""
    overlay = frame.copy()
    cv2.rectangle(overlay, (x, y), (x + w, y + h), (0, 0, 0), -1)
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)


def draw_angle_bar(frame, angle, x, bar_top, bar_bottom):
    """
    화면 오른쪽에 각도 진행 바 그리기
    각도가 낮을수록(깊이 앉을수록) 바가 올라감
    """
    # 각도 → 바 높이 매핑 (70도=바 꽉참, 170도=바 비어있음)
    bar_height = int(np.interp(angle, [70, 170], [bar_top, bar_bottom]))

    # 각도에 따라 색상 변경 (초록 ↔ 빨강)
    green = int(np.interp(angle, [70, 170], [255, 0]))
    red = int(np.interp(angle, [70, 170], [0, 255]))
    bar_color = (0, green, red)

    # 배경 바 (어두운 회색)
    cv2.rectangle(frame, (x, bar_top), (x + 40, bar_bottom), (50, 50, 50), -1)
    # 진행 바 (각도에 따라 색상 변화)
    cv2.rectangle(frame, (x, bar_height), (x + 40, bar_bottom), bar_color, -1)
    # 테두리
    cv2.rectangle(frame, (x, bar_top), (x + 40, bar_bottom), (200, 200, 200), 2)
    # 각도 텍스트
    cv2.putText(frame, f"{int(angle)}",
                (x - 5, bar_top - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, bar_color, 2)

# 초기화
mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils

# 카운터의 핵심 알고리즘
count = 0
state = "up"

# 특정 횟수 달성 시 축하
milestones = {
    3:  "NICE START!",
    5:  "GREAT JOB!",
    10: "AMAZING!!",
    15: "INCREDIBLE!!!",
    20: "SQUAT KING!!"
}
milestone_msg = ""
milestone_timer = 0

# 시간 측정
start_time = time.time()

# 웹캠 열기
cap = cv2.VideoCapture(0)        # 기본 카메라. 안 잡히면 1로 변경

print("=" * 50)
print("🏋️ AI 스쿼트 카운터 — 시작!")
print("=" * 50)
print("카메라 앞에서 스쿼트를 해보세요.")
print("GOOD SQUAT! 판정이 나와야 카운트됩니다.")
print("'q' 키를 누르면 종료됩니다.")
print()

with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
    while True:
        success, frame = cap.read()
        if not success:
            break

        # 프레임 전처리
        frame = cv2.flip(frame, 1)  # 좌우 반전
        h, w, _ = frame.shape

        # Mediapipe로 자세 추정
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = pose.process(img_rgb)

        # 기본값
        angle = 180
        status = "STAND UP"
        color = (200, 200, 200)  # 회색

        if results.pose_landmarks:
            mp_draw.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)

            # 랜드마크 좌표 추출
            landmarks = results.pose_landmarks.landmark
            hip = get_coord(landmarks[mp_pose.PoseLandmark.LEFT_HIP])
            knee = get_coord(landmarks[mp_pose.PoseLandmark.LEFT_KNEE])
            ankle = get_coord(landmarks[mp_pose.PoseLandmark.LEFT_ANKLE])

            # 각도 계산
            angle = calculate_angle(hip, knee, ankle)

            # 자세 판정
            feedback, color = judge_squat(angle)
            status = feedback

            # 카운트 로직
            # 정자세 구간을 관측했을 때만 DOWN 진입
            if 70 < angle <= 100:
                state = "down"          # 이후 더 깊게 앉아도 DOWN 유지

            # 올라오는 동작 감지
            if angle > 160 and state == "down":
                state = "up"
                count += 1
                print(f"✅ 카운트: {count}회")

                # 이정표 달성 확인
                if count in milestones:
                    milestone_msg = milestones[count]
                    milestone_timer = 40 # 약 40프레임. 1.3초 정
                    print(f"🎉 {milestone_msg}")

            # ── 무릎 옆에 각도 표시 ─────────────────
            knee_x = int(landmarks[mp_pose.PoseLandmark.LEFT_KNEE].x * w)
            knee_y = int(landmarks[mp_pose.PoseLandmark.LEFT_KNEE].y * h)

            cv2.circle(frame, (knee_x, knee_y), 18, color, 3)
            cv2.putText(frame, f"{int(angle)}",
                        (knee_x - 30, knee_y - 25),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)

            # 화면에 피드백 표시
            frame = put_korean_text(frame, feedback, (30, 50), font_size=40, color=color)

        # ══════════════════════════════════════════════
        # UI 렌더링
        # ══════════════════════════════════════════════

        # ── 왼쪽 상단 정보 패널 ─────────────────────
        draw_panel(frame, 15, 15, 310, 200)

        # 타이틀
        cv2.putText(frame, "SQUAT COUNTER",
                    (25, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        # 카운트 (크게!)
        cv2.putText(frame, f"COUNT : {count}",
                    (25, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 255, 100), 3)

        # 상태 (UP / DOWN)
        stage_color = (0, 200, 255) if state == "down" else (255, 200, 0)
        cv2.putText(frame, f"STAGE : {state.upper()}",
                    (25, 145), cv2.FONT_HERSHEY_SIMPLEX, 0.8, stage_color, 2)

        # 각도
        cv2.putText(frame, f"ANGLE : {int(angle)}",
                    (25, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)
        
        # 경과 시간 & 페이스
        elapsed = int(time.time() - start_time)
        minutes = elapsed // 60
        seconds = elapsed % 60
        pace = count / max(elapsed, 1) * 60  # 분당 횟수

        cv2.putText(frame, f"TIME: {minutes:02d}:{seconds:02d}  PACE: {pace:.1f}/min",
                    (25, 205), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (150, 150, 150), 1)
        
        # ── 자세 판정 텍스트 (큰 글씨) ──────────────
        cv2.putText(frame, status,
                    (25, 270), cv2.FONT_HERSHEY_SIMPLEX, 1.3, color, 3)

        # ── 오른쪽 각도 바 ──────────────────────────
        draw_angle_bar(frame, angle, w - 60, 60, 400)

        # ── 이정표 축하 메시지 ──────────────────────
        if milestone_timer > 0:
            # 화면 중앙에 큰 글씨로 표시
            text_size = cv2.getTextSize(
                milestone_msg, cv2.FONT_HERSHEY_SIMPLEX, 2.0, 4
            )[0]
            text_x = (w - text_size[0]) // 2
            text_y = h // 2

            # 글자 뒤에 반투명 배경
            draw_panel(frame, text_x - 20, text_y - 50, text_size[0] + 40, 80)

            cv2.putText(frame, milestone_msg,
                        (text_x, text_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 2.0, (0, 255, 255), 4)

            milestone_timer -= 1

        # ── 화면 표시 & 종료 ────────────────────────
        cv2.imshow("AI Squat Counter", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break


# ══════════════════════════════════════════════════════
# 종료 & 결과 출력
# ══════════════════════════════════════════════════════
cap.release()
cv2.destroyAllWindows()

total_time = int(time.time() - start_time)
minutes = total_time // 60
seconds = total_time % 60

print()
print("=" * 50)
print("🏋️ 운동 결과")
print("=" * 50)
print(f"  총 스쿼트 : {count} 회")
print(f"  운동 시간 : {minutes}분 {seconds}초")
if total_time > 0:
    print(f"  평균 페이스: {count / total_time * 60:.1f} 회/분")
print("=" * 50)
print("👋 수고하셨습니다!")
