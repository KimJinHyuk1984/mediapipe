# 도형 추가하기
# 메시지 추가

import cv2
 
cap = cv2.VideoCapture(0)        # 기본 카메라. 안 잡히면 1로 변경
 
while True:
    success, frame = cap.read()      # 한 프레임 읽기
    if not success:
        print("❌ 프레임 읽기 실패")
        break
    
    # 제목 텍스트
    cv2.putText(
        frame,                           # 어디에 그릴지 (프레임)
        "Hello, Camera!",                # 출력할 문자열
        (30, 60),                        # 위치 (x, y) — 왼쪽 상단 기준
        cv2.FONT_HERSHEY_SIMPLEX,        # 폰트 종류
        1.5,                             # 폰트 크기
        (0, 255, 0),                     # 색상 (B, G, R) — 초록색
        3                                # 글자 두께
    )

    # 안내 텍스트
    cv2.putText(
        frame,
        "Press 'q' to quit",
        (30, 110),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (200, 200, 200),                 # 밝은 회색
        2
    )
    # 사각형 그리기
    cv2.rectangle(
        frame,                           # 어디에 그릴지 (프레임)
        (20, 25),                        # 왼쪽 상단 좌표 (x, y)
        (420, 130),                      # 오른쪽 하단 좌표 (x, y)
        (0, 255, 0),                     # 색상 (B, G, R) — 초록색
        -1                                # 선 두께
    )

    cv2.imshow("My Webcam", frame)       # 화면에 띄우기
 
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
cap.release()
cv2.destroyAllWindows()
