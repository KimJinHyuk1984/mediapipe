# test_install.py
# 사용법: python test_install.py

import sys

print("=" * 50)
print("🔍 AI 스쿼트 왕 — 환경 설치 확인")
print("=" * 50)
print()

# 1) Python 버전 확인
v = sys.version_info
print(f"[1/4] Python 버전: {v.major}.{v.minor}.{v.micro}", end="  ")
if v.major == 3 and v.minor >= 8:
    print("✅ OK")
else:
    print("❌ Python 3.8 이상이 필요합니다")
print()

# 2) OpenCV
try:
    import cv2
    print(f"[2/4] OpenCV 버전: {cv2.__version__}", end="  ")
    print("✅ OK")
except ImportError:
    print("[2/4] OpenCV: ❌ 설치 안 됨")
    print("      → pip install opencv-python")
print()

# 3) MediaPipe
try:
    import mediapipe as mp
    print(f"[3/4] MediaPipe 버전: {mp.__version__}", end="  ")
    print("✅ OK")
except ImportError:
    print("[3/4] MediaPipe: ❌ 설치 안 됨")
    print("      → pip install mediapipe")
print()

# 4) NumPy
try:
    import numpy as np
    print(f"[4/4] NumPy 버전: {np.__version__}", end="  ")
    print("✅ OK")
except ImportError:
    print("[4/4] NumPy: ❌ 설치 안 됨")
    print("      → pip install numpy")
print()

# 5) 웹캠 테스트
print("-" * 50)
print("📷 웹캠 연결 테스트 중...")
try:
    import cv2
    cap = cv2.VideoCapture(0)        # 기본 카메라. 안 잡히면 1로 변경
    if cap.isOpened():
        success, frame = cap.read()
        if success:
            h, w, _ = frame.shape
            print(f"   웹캠 해상도: {w} x {h}  ✅ OK")
        else:
            print("   ❌ 프레임 읽기 실패 — 카메라 렌즈 가림 확인")
        cap.release()
    else:
        print("   ❌ 카메라를 열 수 없음")
        print("   → USB 웹캠 연결 확인 또는 VideoCapture(1) 시도")
except Exception as e:
    print(f"   ❌ 웹캠 테스트 오류: {e}")

print()
print("=" * 50)
print("모두 ✅ 이면 수업 준비 완료!")
print("=" * 50)
