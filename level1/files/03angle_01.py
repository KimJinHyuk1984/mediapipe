# 두 직선이 이루는 각 구하는 함수
import numpy as np

def calculate_angle(a, b, c):
    """
    세 관절의 (x, y) 좌표를 받아 꼭짓점 b의 각도를 반환합니다.

    수학 원리:
        1) 벡터 BA = A - B  (꼭짓점 → A 방향)
        2) 벡터 BC = C - B  (꼭짓점 → C 방향)
        3) cos θ = (BA · BC) / (|BA| × |BC|)   ← 벡터 내적 공식
        4) θ = arccos(cos θ)                    ← 각도로 변환

    매개변수:
        a: 시작점 좌표 [x, y]  (예: 엉덩이)
        b: 꼭짓점 좌표 [x, y]  (예: 무릎)   ← 이 각도를 구함!
        c: 끝점 좌표   [x, y]  (예: 발목)

    반환값:
        각도 (도, 0~180)
    """
    # 리스트 → NumPy 배열 변환 (벡터 연산을 위해)
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    # 1단계: 벡터 계산
    #   꼭짓점 b에서 a 방향, c 방향 벡터
    ba = a - b   # 무릎 → 엉덩이 방향
    bc = c - b   # 무릎 → 발목 방향

    # 2단계: 내적(dot product) 계산
    #   ba · bc = ba[0]*bc[0] + ba[1]*bc[1]
    dot_product = np.dot(ba, bc)

    # 3단계: 벡터 크기(norm) 계산
    #   |ba| = sqrt(ba[0]² + ba[1]²)
    magnitude_ba = np.linalg.norm(ba)
    magnitude_bc = np.linalg.norm(bc)

    # 4단계: cos θ 계산
    cosine_angle = dot_product / (magnitude_ba * magnitude_bc)

    # 5단계: 안전 장치 — 부동소수점 오차로 -1 ~ 1 범위를 벗어날 수 있음
    #   np.clip()으로 범위 제한
    #   np.clip(값, 최소값, 최대값)
    #   즉, 최소보다 작으면 최소로, 최대보다 크면 최대로 조정
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)

    # 6단계: 라디안 → 도(degree) 변환
    angle = np.degrees(np.arccos(cosine_angle))

    return angle
