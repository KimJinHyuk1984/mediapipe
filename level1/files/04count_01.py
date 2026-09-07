def judge_squat(angle):
    if angle > 160:
        return "STAND UP", (200, 200, 200)   # 회색
    elif angle > 100:
        return "MORE DEEP", (0, 200, 255)    # 노란색
    elif angle > 70:
        return "GOOD SQUAT", (0, 255, 0)    # 초록색
    else:
        return "TOO DEEP", (0, 128, 255)     # 주황색
    

