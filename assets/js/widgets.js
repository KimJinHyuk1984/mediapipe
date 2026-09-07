/* 강의별 위젯 등록 파일. 공통 shared.js를 수정하지 않습니다.
 * 사용 예시 (이 주석 자체는 실행되지 않습니다):
 * window.WIDGETS["my-demo"] = function (element, site) {
 *   const button = document.createElement("button");
 *   button.type = "button";
 *   button.textContent = site.levels.find(level => level.slug === document.body.dataset.level).title;
 *   button.addEventListener("click", function () { button.textContent = "실행됨"; });
 *   element.append(button);
 * };
 * HTML: <div data-widget="my-demo"></div>
 * 아래 등록 영역에 추가하면 DOM 준비 후 자동 마운트됩니다.
 * 나중에 추가한 요소는 window.mountWidgets(container)로 초기화할 수 있습니다.
 * 각 요소는 한 번만 마운트됩니다. 미등록 위젯은 원래 마크업을 유지합니다.
 */
window.WIDGETS = window.WIDGETS || {};

// ── Level 1 interactive widgets: no remote data or dependencies ──
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function node(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function svgNode(tag, attrs, text) {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => n.setAttribute(key, value));
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function button(label, action) {
    const n = node("button", "button", label);
    n.type = "button";
    n.addEventListener("click", action);
    return n;
  }
  function panel(title) {
    const n = node("div", "interactive-widget");
    n.append(node("h4", "widget-title", title));
    // Bubble is stopped locally; range inputs retain native arrow-key behavior.
    n.addEventListener("keydown", event => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) event.stopPropagation();
    });
    return n;
  }
  function mount(host, content) {
    // Keep the static fallback visible until the entire factory has succeeded.
    host.replaceChildren(content);
    host.dataset.widgetReady = "true";
  }
  function slider(label, value) {
    const wrap = node("label", "widget-slider");
    const text = node("span", "", label);
    const input = node("input");
    input.type = "range"; input.min = "40"; input.max = "180"; input.step = "1"; input.value = value;
    input.setAttribute("aria-label", label);
    wrap.append(text, input);
    return { wrap, input };
  }
  function judge(angle) {
    if (angle > 160) return ["stand", "STAND UP", "회색"];
    if (angle > 100) return ["more", "MORE DEEP", "노란색"];
    if (angle > 70) return ["good", "GOOD SQUAT", "초록색"];
    return ["deep", "TOO DEEP", "주황색"];
  }
  function fmt(value) { return (Math.abs(value) < 0.00005 ? 0 : value).toFixed(4); }

  window.WIDGETS["landmark-map"] = function (host) {
    const names = [
      ["NOSE","코"],["LEFT_EYE_INNER","왼쪽 눈 안쪽"],["LEFT_EYE","왼쪽 눈"],["LEFT_EYE_OUTER","왼쪽 눈 바깥쪽"],
      ["RIGHT_EYE_INNER","오른쪽 눈 안쪽"],["RIGHT_EYE","오른쪽 눈"],["RIGHT_EYE_OUTER","오른쪽 눈 바깥쪽"],
      ["LEFT_EAR","왼쪽 귀"],["RIGHT_EAR","오른쪽 귀"],["MOUTH_LEFT","입 왼쪽"],["MOUTH_RIGHT","입 오른쪽"],
      ["LEFT_SHOULDER","왼쪽 어깨"],["RIGHT_SHOULDER","오른쪽 어깨"],["LEFT_ELBOW","왼쪽 팔꿈치"],["RIGHT_ELBOW","오른쪽 팔꿈치"],
      ["LEFT_WRIST","왼쪽 손목"],["RIGHT_WRIST","오른쪽 손목"],["LEFT_PINKY","왼쪽 새끼손가락"],["RIGHT_PINKY","오른쪽 새끼손가락"],
      ["LEFT_INDEX","왼쪽 검지"],["RIGHT_INDEX","오른쪽 검지"],["LEFT_THUMB","왼쪽 엄지"],["RIGHT_THUMB","오른쪽 엄지"],
      ["LEFT_HIP","왼쪽 엉덩이"],["RIGHT_HIP","오른쪽 엉덩이"],["LEFT_KNEE","왼쪽 무릎"],["RIGHT_KNEE","오른쪽 무릎"],
      ["LEFT_ANKLE","왼쪽 발목"],["RIGHT_ANKLE","오른쪽 발목"],["LEFT_HEEL","왼쪽 뒤꿈치"],["RIGHT_HEEL","오른쪽 뒤꿈치"],
      ["LEFT_FOOT_INDEX","왼쪽 발끝"],["RIGHT_FOOT_INDEX","오른쪽 발끝"]
    ];
    const positions = [[300,115],[330,85],[355,80],[380,85],[270,85],[245,80],[220,85],[405,118],[195,118],[326,151],[274,151],
      [380,250],[220,250],[455,280],[145,280],[525,310],[75,310],[560,340],[40,340],[570,290],[30,290],[525,365],[75,365],
      [355,435],[245,435],[363,555],[237,555],[370,680],[230,680],[343,722],[257,722],[413,750],[187,750]];
    const today = new Set([23,24,25,26,27,28]);
    const root = panel("관절을 선택해 번호와 이름 확인하기");
    const toggle = node("label", "widget-toggle");
    const checkbox = node("input"); checkbox.type = "checkbox";
    toggle.append(checkbox, document.createTextNode(" 오늘 쓰는 관절만 보기"));
    const legend = node("p", "landmark-legend");
    ["얼굴 0–10","상체 11–22","하체 23–32"].forEach((s,i) => legend.append(node("span", "landmark-group-" + i, s)));
    const drawing = svgNode("svg", {viewBox:"0 0 600 790",class:"landmark-drawing","aria-label":"정면을 향해 팔을 벌린 사람의 33개 랜드마크",role:"group"});
    drawing.append(svgNode("ellipse",{cx:300,cy:115,rx:115,ry:92,class:"body-shape"}));
    drawing.append(svgNode("path",{d:"M280 205 L280 230 L215 232 L60 293 L72 342 L230 298 L240 420 L211 695 L190 750 L253 750 L274 570 L300 470 L326 570 L347 750 L410 750 L389 695 L360 420 L370 298 L528 342 L540 293 L385 232 L320 230 L320 205 Z",class:"body-shape"}));
    const detail = node("p","widget-readout"); detail.setAttribute("aria-live","polite"); detail.setAttribute("aria-atomic","true");
    const code = node("code","widget-code");
    const groups = [];
    let selected = 25;
    function choose(i) {
      selected = i;
      detail.textContent = i + " — " + names[i][0] + " — " + names[i][1];
      code.textContent = "landmarks[mp_pose.PoseLandmark." + names[i][0] + "]   # = landmarks[" + i + "]";
      groups.forEach((g,j) => g.setAttribute("aria-pressed", String(j === i)));
    }
    positions.forEach(([x,y],i) => {
      const group = svgNode("g",{class:"landmark-point landmark-group-" + (i <= 10 ? 0 : i <= 22 ? 1 : 2) + (today.has(i) ? " is-today" : ""),
        tabindex:"0",role:"button","aria-label":i + " — " + names[i][0] + " — " + names[i][1],"data-landmark":i});
      group.append(svgNode("circle",{cx:x,cy:y,r:22,class:"point-target"}),svgNode("circle",{cx:x,cy:y,r:15,class:"point-dot"}),
        svgNode("text",{x,y:y+5,"text-anchor":"middle","aria-hidden":"true"},String(i)));
      group.addEventListener("pointerenter",()=>choose(i));
      group.addEventListener("click",()=>choose(i));
      group.addEventListener("focus",()=>choose(i));
      group.addEventListener("keydown",event=>{
        if (["Enter"," "].includes(event.key)) {event.preventDefault(); choose(i);}
        if (["ArrowRight","ArrowDown","ArrowLeft","ArrowUp"].includes(event.key)) {
          event.preventDefault();
          groups[(i + (["ArrowRight","ArrowDown"].includes(event.key) ? 1 : 32)) % 33].focus();
        }
      });
      groups.push(group); drawing.append(group);
    });
    checkbox.addEventListener("change",()=>root.classList.toggle("today-only",checkbox.checked));
    root.append(toggle,legend,drawing,detail,code,node("p","widget-note","굵은 테두리는 오늘 쓰는 여섯 관절입니다. 좌우는 사람 자신의 기준이며, 비율을 단순화한 지도입니다."));
    choose(selected); mount(host,root);
  };

  window.WIDGETS["angle-slider"] = function (host) {
    const root = panel("같은 각도를 두 공식으로 계산하기");
    const control = slider("무릎 각도",90);
    const layout = node("div","angle-layout");
    const drawing = svgNode("svg",{viewBox:"0 0 360 390",role:"img","aria-label":"고정된 무릎 B와 회전하는 엉덩이 A, 발목 C",class:"angle-drawing"});
    const leg = svgNode("polyline",{class:"angle-leg",fill:"none"});
    const arc = svgNode("path",{class:"angle-arc",fill:"none"});
    const a = svgNode("circle",{r:10,class:"joint"}),b=svgNode("circle",{cx:180,cy:195,r:10,class:"joint"}),c=svgNode("circle",{cx:180,cy:345,r:10,class:"joint"});
    const la=svgNode("text",{}, "A"),lb=svgNode("text",{x:195,y:190},"B"),lc=svgNode("text",{x:195,y:350},"C");
    drawing.append(leg,arc,a,b,c,la,lb,lc);
    const results=node("div","widget-calculations"), coords=node("p","widget-coordinates");
    const methods=node("div","calculation-columns");
    const dot=node("div","calculation-method"),atan=node("div","calculation-method");
    const dotText=node("pre","widget-math"),atanText=node("pre","widget-math");
    dot.append(node("h5","","벡터 내적 방식"),dotText);atan.append(node("h5","","arctan2 방식"),atanText);methods.append(dot,atan);
    const equal=node("p","widget-equality"),status=node("p","widget-judgment");
    equal.setAttribute("role","status");
    results.append(coords,methods,equal,status);layout.append(drawing,results);
    const presets=node("div","widget-buttons");
    [["서 있음",170],["반쯤",130],["정자세",90],["너무 깊음",60]].forEach(([label,v])=>presets.append(button(label+" ("+v+"도)",()=>{control.input.value=v;render();})));
    function render() {
      const angle=Number(control.input.value), r=angle*Math.PI/180;
      // B=(0,0), C=(0,1); rotation keeps both vector lengths at one.
      const A=[Math.sin(r),Math.cos(r)],BA=A,BC=[0,1];
      const product=BA[0]*BC[0]+BA[1]*BC[1],lenA=Math.hypot(...BA),lenC=Math.hypot(...BC);
      const cosine=Math.max(-1,Math.min(1,product/(lenA*lenC)));
      const dotAngle=Math.acos(cosine)*180/Math.PI;
      const dirC=Math.atan2(BC[1],BC[0]),dirA=Math.atan2(BA[1],BA[0]);
      const radians=dirC-dirA;
      let atanAngle=Math.abs(radians*180/Math.PI);
      if(atanAngle>180)atanAngle=360-atanAngle;
      root.dataset.dotAngle=dotAngle;root.dataset.atanAngle=atanAngle;root.dataset.angle=angle;
      const x=180-A[0]*150,y=195+A[1]*150;
      a.setAttribute("cx",x);a.setAttribute("cy",y);la.setAttribute("x",x+12);la.setAttribute("y",y-12);
      leg.setAttribute("points",x+","+y+" 180,195 180,345");
      arc.setAttribute("d","M 180 235 A 40 40 0 0 1 "+(180-A[0]*40)+" "+(195+A[1]*40));
      coords.textContent="좌표: A=("+fmt(A[0])+", "+fmt(A[1])+"), B=(0.0000, 0.0000), C=(0.0000, 1.0000). 도식은 +x를 왼쪽, +y를 아래로 표시합니다.";
      dotText.textContent="BA = A − B = ("+fmt(BA[0])+", "+fmt(BA[1])+")\nBC = C − B = (0.0000, 1.0000)\nBA · BC = "+fmt(product)+"\n|BA| = "+fmt(lenA)+"   |BC| = "+fmt(lenC)+"\ncos θ = "+fmt(cosine)+"\nθ = arccos(cos θ) = "+fmt(dotAngle)+"도";
      atanText.textContent="atan2(1.0000, 0.0000)\n− atan2("+fmt(BA[1])+", "+fmt(BA[0])+")\n= "+fmt(dirC)+" − ("+fmt(dirA)+")\n= "+fmt(radians)+" 라디안\n→ "+fmt(atanAngle)+"도";
      equal.textContent="두 결과 일치: "+fmt(dotAngle)+"° = "+fmt(atanAngle)+"° · 차이 "+fmt(Math.abs(dotAngle-atanAngle))+"°";
      const [key,label,color]=judge(angle);root.dataset.judge=key;
      status.textContent=angle+"° · "+label+" · "+color;
      control.input.setAttribute("aria-valuetext",angle+"도, "+label);
    }
    control.input.addEventListener("input",render);
    root.append(control.wrap,presets,layout,node("p","widget-note","같은 각도를 두 가지 방법으로 구할 수 있습니다. 계산에는 반올림 전 값을 사용하고, 표시는 소수점 아래 네 자리로 맞춥니다."));
    render();mount(host,root);
  };

  window.WIDGETS["state-machine"] = function (host) {
    const root=panel("프레임마다 세기와 상태를 기억해서 세기");
    const drawing=svgNode("svg",{viewBox:"0 0 560 180",class:"state-drawing",role:"img","aria-label":"UP과 DOWN의 상태 전이"});
    const up=svgNode("g",{class:"state-node"}),down=svgNode("g",{class:"state-node"});
    up.append(svgNode("circle",{cx:100,cy:90,r:62}),svgNode("text",{x:100,y:98,"text-anchor":"middle"},"UP"));
    down.append(svgNode("circle",{cx:460,cy:90,r:62}),svgNode("text",{x:460,y:98,"text-anchor":"middle"},"DOWN"));
    const arrowDown=svgNode("path",{d:"M175 62 H377 L364 51 M377 62 L364 73",class:"state-arrow"});
    const arrowUp=svgNode("path",{d:"M385 121 H183 L196 110 M183 121 L196 132",class:"state-arrow"});
    drawing.append(arrowDown,arrowUp,up,down,svgNode("text",{x:280,y:40,"text-anchor":"middle",class:"transition-label"},"70 < θ ≤ 100"),
      svgNode("text",{x:280,y:160,"text-anchor":"middle",class:"transition-label"},"θ > 160"));
    const control=slider("시뮬레이션 각도",170);
    const angles=node("p","widget-readout");
    const counters=node("div","counter-grid");
    const naiveCard=node("div","counter-card"),smartCard=node("div","counter-card");
    const naiveText=node("strong","counter-value","0"),smartText=node("strong","counter-value","0");
    naiveText.dataset.counter="naive";smartText.dataset.counter="smart";
    naiveCard.append(node("h5","","단순 비교"),naiveText,node("p","","angle < 100이면 프레임마다 +1"));
    smartCard.append(node("h5","","상태머신"),smartText,node("p","","정자세를 기억하고 160도 초과로 일어날 때 +1"));
    counters.append(naiveCard,smartCard);
    const message=node("p","widget-result");message.setAttribute("role","status");
    const transition=node("p","widget-transition");
    const actions=node("div","widget-buttons");
    let state="up",naive=0,smart=0,timer=null,queue=[],index=0,running=false;
    function paint(angle) {
      control.input.value=angle;control.input.setAttribute("aria-valuetext",angle+"도");
      angles.textContent=angle.toFixed(1)+"° · "+judge(angle)[1]+" · "+index+"프레임";
      up.classList.toggle("is-current",state==="up");down.classList.toggle("is-current",state==="down");
      naiveText.textContent=naive;smartText.textContent=smart;root.dataset.state=state;root.dataset.running=String(running);
    }
    function frame(angle) {
      index++;
      if(angle<100)naive++;
      const before=state;
      if(70<angle&&angle<=100)state="down";
      if(angle>160&&state==="down"){state="up";smart++;}
      const changed=before!==state;
      arrowDown.classList.toggle("is-transition",changed&&state==="down");
      arrowUp.classList.toggle("is-transition",changed&&state==="up");
      if(changed)transition.textContent=before.toUpperCase()+" → "+state.toUpperCase()+" · "+angle.toFixed(1)+"°"+(state==="up"?" · 카운트 +1":" · 정자세 기억");
      paint(angle);
    }
    function stop() { if(timer!==null)clearTimeout(timer);timer=null;running=false;root.dataset.running="false"; }
    function reset() {
      stop();queue=[];index=0;state="up";naive=0;smart=0;
      transition.textContent="아직 전이 없음 · UP에서 시작";
      arrowDown.classList.remove("is-transition");arrowUp.classList.remove("is-transition");
      message.textContent="슬라이더 값 변경 한 번은 관측 프레임 하나입니다.";paint(170);
    }
    function complete() {
      stop();
      message.textContent="재생 완료 · "+index+"프레임: 단순 비교 "+naive+"회 / 상태머신 "+smart+"회";
    }
    function finishImmediately() { while(queue.length)frame(queue.shift());complete(); }
    function tick() {
      if(!running)return;
      frame(queue.shift());
      if(!queue.length){complete();return;}
      timer=setTimeout(tick,1000/30);
    }
    function run(points,jump) {
      reset();
      // The jump case deliberately contains NO interpolated valid-posture frames.
      if(jump)points.forEach(value=>{for(let n=0;n<30;n++)queue.push(value);});
      else {
        queue.push(points[0]);
        for(let p=1;p<points.length;p++){
          for(let n=1;n<=30;n++)queue.push(points[p-1]+(points[p]-points[p-1])*n/30);
          if(p<points.length-1)for(let n=0;n<15;n++)queue.push(points[p]);
        }
      }
      running=true;root.dataset.running="true";
      message.textContent=jump?"관측값을 170 → 65 → 170으로 즉시 전환합니다. 중간 각도는 관측하지 않습니다.":"30fps 가정으로 재생 중 · 시나리오마다 카운터를 초기화합니다.";
      if(motion.matches)finishImmediately();else tick();
    }
    actions.append(button("스쿼트 1회 재생",()=>run([170,90,170],false)),
      button("너무 깊게 앉기",()=>run([170,95,60,95,170],false)),
      button("정자세 없이 주저앉기",()=>run([170,65,170],true)),
      button("초기화",reset));
    control.input.addEventListener("input",()=>{
      stop();queue=[];frame(Number(control.input.value));
      message.textContent="수동 관측 · 값 변경 1번 = 1프레임. 자동 재생은 멈췄습니다.";
    });
    motion.addEventListener("change",()=>{if(motion.matches&&running)finishImmediately();});
    root.append(drawing,transition,control.wrap,angles,actions,counters,message,
      node("p","widget-note","‘정자세 없이’는 중간 구간이 관측되지 않는 입력입니다. 실제로 95도를 한 번이라도 관측한 뒤 160도를 넘으면 1회입니다. 모든 시나리오는 UP·0회로 새로 시작합니다."));
    reset();mount(host,root);
  };
})();


(function () {
  "use strict";
  const mounted = new WeakSet();

  function mountWidgets(root = document) {
    const elements = Array.from(root.querySelectorAll("[data-widget]"));
    if (root instanceof Element && root.matches("[data-widget]")) elements.unshift(root);
    elements.forEach(function (element) {
      const name = element.dataset.widget;
      const factory = Object.prototype.hasOwnProperty.call(window.WIDGETS, name)
        ? window.WIDGETS[name] : undefined;
      if (mounted.has(element) || typeof factory !== "function") return;
      mounted.add(element);
      try {
        factory(element, window.SITE || {});
      } catch (error) {
        mounted.delete(element);
        console.error("위젯 초기화 실패: " + name, error);
      }
    });
  }

  window.mountWidgets = mountWidgets;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { mountWidgets(); }, { once: true });
  } else {
    mountWidgets();
  }
})();
