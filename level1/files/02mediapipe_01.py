# mediapipe 사용하여 웹캠에 표현하기
import mediapipe as mp
import cv2
 
mp_pose = mp.solutions.pose
mp_draw = mp.solutions.drawing_utils
pose = mp_pose.Pose()

 
cap = cv2.VideoCapture(0)        # 기본 카메라. 안 잡히면 1로 변경
 
while True:
    success, frame = cap.read()      # 한 프레임 읽기
    if not success:
        print("❌ 프레임 읽기 실패")
        break
    
    frame = cv2.flip(frame, 1) # 1: 좌우반전, 0: 상하반전
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb)
     
    if results.pose_landmarks:
        mp_draw.draw_landmarks(
            frame,
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS)


    cv2.imshow("My Webcam", frame)
 
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
cap.release()
cv2.destroyAllWindows()
