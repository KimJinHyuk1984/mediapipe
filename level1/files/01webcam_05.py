# 한글로 메시지 출력하기
import cv2
from korean_text import put_korean_text

cap = cv2.VideoCapture(0)        # 기본 카메라. 안 잡히면 1로 변경
 
while True:
    success, frame = cap.read()      # 한 프레임 읽기
    if not success:
        print("❌ 프레임 읽기 실패")
        break

    # 사각형 그리기
    cv2.rectangle(frame, (20, 25), (420, 130), (0, 255, 0), 1)

    # 제목 텍스트 
    frame = put_korean_text(frame, "안녕하세요, 카메라!", (30, 40), font_size=40, color=(0, 255, 0))    

    # 안내 텍스트
    frame = put_korean_text(frame, "종료하려면 'q'를 누르세요", (30, 90), font_size=20, color=(200, 200, 200))

    cv2.imshow("My Webcam", frame)       # 화면에 띄우기
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
