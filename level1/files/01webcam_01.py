# 웹캠에서 영상 읽기(베이직)

import cv2
 
cap = cv2.VideoCapture(0)        # 기본 카메라. 안 잡히면 1로 변경
 
while True:
    success, frame = cap.read()      # 한 프레임 읽기
    if not success:
        print("❌ 프레임 읽기 실패")
        break
    
    cv2.imshow("My Webcam", frame)
 
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
cap.release()
cv2.destroyAllWindows()
