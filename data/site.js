/* ★ 공통 관리 파일: instructor는 템플릿 원본에서만 수정해 모든 강의에 반영합니다.
 * site, levels와 otherLectures는 각 강의 저장소에서 수정합니다.
 * 동기화 스크립트는 이 파일을 덮어쓰지 않습니다. instructor 변경은 수동으로 병합합니다.
 */
window.SITE = {
  site: {
    title: "AI 운동 코치 만들기",
    subtitle: "파이썬 + MediaPipe로 배우는 실시간 자세 인식",
    repo: "mediapipe"
  },
  // ── 이 아래 instructor 블록은 모든 강의 저장소에서 동일하게 유지한다 ──
  instructor: {
    name: "김진혁",
    affiliation: "동양고등학교 · 수학, 정보",
    email: "kimjh0630@naver.com",
    photo: "assets/img/instructor.webp",
    credentials: [
      "동양고등학교 교사(수학, 정보)",
      "성균관대학교 일반대학원 수학교육전공 박사 수료",
      "서울시교육청 초중등 AI교육 연구회 부회장",
      "(2022개정 교육과정) 『데이터 과학』 교과서 집필진(올드앤뉴)",
      "(2022개정 교육과정) 『논리와 사고』 교과서 집필진(세종)",
      "AIEDAP마스터 교원(서울, 경기, 인천, 제주 권역)",
      "서울시교육청 AI융합교육 선도교사(2023~)",
      "2026학년도 서울시교육청 AI중점학교 지원단",
      "『인공지능 진로진학 교육자료』 집필진(서울시교육청, 2022)",
      "『면접보고 대학가자』 집필진(올드앤뉴, 2023)"
    ]
  },

  // ── 이 아래는 강의마다 교체한다 ──
  levels: [
    {
      slug: "level1",
      badge: "LEVEL 1",
      title: "AI 스쿼트 왕",
      subtitle: "웹캠으로 스쿼트를 자동으로 세는 AI 만들기",
      kicker: "PYTHON + MEDIAPIPE",
      duration: "2시간",
      target: "고등학교",
      difficulty: "입문",
      tags: ["OpenCV", "MediaPipe", "각도 계산", "상태머신"],
      accent: "neon-green",
      emoji: "",
      cover: "assets/img/level1/slide-003-a.webp",
      status: "ready"
    },
    {
      slug: "level2",
      badge: "LEVEL 2",
      title: "AI 운동왕 시즌 2",
      subtitle: "하나의 레시피로 푸쉬업·팔벌려뛰기·플랭크까지",
      kicker: "GENERALIZATION",
      duration: "2시간",
      target: "고등학교",
      difficulty: "심화",
      tags: ["함수 재사용", "위치 기반 측정", "데이터로 설계", "추상화"],
      accent: "violet",
      emoji: "",
      cover: "",
      status: "ready"
    }
  ],

  // 다른 강의로 이동하는 링크 (전부 외부 절대 주소)
  otherLectures: [
    {
      title: "딥러닝 CNN으로 포트홀을 찾아라",
      url: "https://kimjinhyuk1984.github.io/pothole/",
      emoji: ""
    }
  ]
};
