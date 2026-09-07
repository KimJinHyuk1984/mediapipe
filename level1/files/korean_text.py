import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

def put_korean_text(img, text, position, font_size=30, color=(0, 0, 255)):
    """
    OpenCV 이미지에 한글 텍스트를 그리는 함수
    
    Args:
        img: OpenCV 이미지 (BGR)
        text: 표시할 한글 문자열
        position: (x, y) 좌표
        font_size: 폰트 크기
        color: BGR 색상 튜플 (B, G, R)
    
    Returns:
        한글이 그려진 OpenCV 이미지
    """
    # OpenCV(BGR) → PIL(RGB) 변환
    img_pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(img_pil)
    
    # 한글 폰트 로드 (Windows 기본 폰트)
    try:
        font = ImageFont.truetype("malgun.ttf", font_size)  # 맑은 고딕
    except:
        # macOS/Linux 대체 경로
        try:
            font = ImageFont.truetype(
                "/System/Library/Fonts/AppleSDGothicNeo.ttc", font_size
            )  # macOS
        except:
            font = ImageFont.truetype(
                "/usr/share/fonts/truetype/nanum/NanumGothic.ttf", font_size
            )  # Linux
    
    # PIL은 RGB 순서이므로 BGR → RGB 변환
    rgb_color = (color[2], color[1], color[0])
    
    # 텍스트 그리기
    draw.text(position, text, font=font, fill=rgb_color)
    
    # PIL → OpenCV 변환 후 반환
    return cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)
