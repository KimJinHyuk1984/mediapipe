/* ★ 공통 자산: 템플릿 원본에서만 수정하고 sync-shared.sh 또는 sync-shared.ps1로 강의 저장소에 배포합니다.
 * 강의 정보는 data/site.js, 강의별 인터랙션은 widgets.js에서 변경합니다.
 * 외부 라이브러리·원격 데이터 요청·ES module 없이 HTTP와 file://에서 동일하게 실행합니다.
 */
(function () {
  "use strict";
  const site = window.SITE || {};
  const root = document.documentElement;
  const themeKey = "lecture-template-theme";
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let preferredTheme = null;
  try {
    const saved = localStorage.getItem(themeKey);
    if (saved === "light" || saved === "dark") preferredTheme = saved;
  } catch (_) { /* 저장소가 차단된 file://·비공개 모드에서도 동작합니다. */ }
  root.dataset.theme = preferredTheme || (systemTheme.matches ? "dark" : "light");

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  }

  function fill(selector, value) {
    document.querySelectorAll(selector).forEach(function (node) {
      node.textContent = value == null ? "" : String(value);
    });
  }

  function applyLectureMeta() {
    const lecture = site.lecture || {};
    const title = lecture.title || "강의 제목";
    document.title = title;
    fill("[data-lecture-title]", title);
    fill("[data-lecture-subtitle]", lecture.subtitle);
    fill("[data-lecture-kicker]", [lecture.emoji, lecture.kicker].filter(Boolean).join(" "));
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = lecture.subtitle || "";
    const brand = document.querySelector(".brand");
    if (brand) brand.setAttribute("aria-label", title + " 처음으로");
    document.body.dataset.accent = ["neon-green", "violet", "amber"].includes(lecture.accent)
      ? lecture.accent : "neon-green";
    const badges = document.querySelector("[data-lecture-badges]");
    if (!badges) return;
    badges.replaceChildren();
    [["소요 시간", lecture.duration], ["대상", lecture.level]].forEach(function ([label, value]) {
      if (!value) return;
      const badge = element("span", "badge", value);
      badge.setAttribute("aria-label", label + ": " + value);
      badges.append(badge);
    });
    (Array.isArray(lecture.tags) ? lecture.tags : []).forEach(function (tag) {
      badges.append(element("span", "badge badge-tag", tag));
    });
  }

  function makeAvatar(instructor, large = false) {
    const name = instructor.name || "강사";
    const initials = /[가-힣]/.test(name) ? name.trim().slice(0, 1)
      : name.trim().split(/\s+/).map(function (part) { return part[0]; }).slice(0, 2).join("").toUpperCase();
    const avatar = element("div", "avatar" + (large ? " avatar-large" : ""), initials);
    avatar.setAttribute("role", "img");
    avatar.setAttribute("aria-label", name + " 이니셜 프로필");
    if (instructor.photo) {
      const photoPath = String(instructor.photo);
      if (!/^(?:[a-z]+:|\/|\\)/i.test(photoPath) && !photoPath.split(/[\/\\]/).includes("..")) {
        const image = element("img");
        image.alt = name + " 강사 사진";
        image.loading = "lazy";
        image.width = large ? 80 : 56;
        image.height = large ? 80 : 56;
        image.addEventListener("load", function () {
          image.classList.add("is-loaded");
          avatar.removeAttribute("role");
          avatar.removeAttribute("aria-label");
        }, { once: true });
        image.addEventListener("error", function () { image.remove(); }, { once: true });
        image.src = photoPath;
        avatar.append(image);
      }
    }
    return avatar;
  }

  function emailLink(node, email) {
    node.textContent = email || "";
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      node.setAttribute("href", "mailto:" + email);
    } else {
      node.removeAttribute("href");
    }
  }

  function renderInstructorModal() {
    const instructor = site.instructor || {};
    fill("[data-instructor-name]", instructor.name);
    fill("[data-instructor-affiliation]", instructor.affiliation);
    document.querySelectorAll("[data-instructor-email]").forEach(function (node) { emailLink(node, instructor.email); });
    document.querySelectorAll("[data-instructor-avatar]").forEach(function (node) { node.replaceChildren(makeAvatar(instructor)); });
    if (document.getElementById("instructor-dialog")) return;

    const dialog = element("dialog", "instructor-dialog");
    dialog.id = "instructor-dialog";
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "instructor-dialog-title");
    const top = element("div", "dialog-top");
    const title = element("h2", "", "강사 소개");
    title.id = "instructor-dialog-title";
    const close = element("button", "button button-icon", "×");
    close.type = "button";
    close.setAttribute("aria-label", "강사 소개 닫기");
    top.append(title, close);
    const name = element("h3", "instructor-name", instructor.name || "강사");
    const affiliation = element("p", "instructor-affiliation", instructor.affiliation || "");
    const email = element("a", "instructor-email");
    emailLink(email, instructor.email);
    const credentials = element("ul", "credentials");
    (Array.isArray(instructor.credentials) ? instructor.credentials : []).forEach(function (credential) {
      credentials.append(element("li", "", credential));
    });
    dialog.append(top, makeAvatar(instructor, true), name, affiliation, email, credentials);
    document.body.append(dialog);

    let opener = null;
    let previousOverflow = "";
    document.querySelectorAll("[data-open-instructor]").forEach(function (button) {
      button.setAttribute("aria-haspopup", "dialog");
      button.setAttribute("aria-controls", dialog.id);
      button.addEventListener("click", function () {
        if (dialog.open) return;
        opener = button;
        previousOverflow = document.body.style.overflow;
        dialog.showModal(); // 네이티브 modal이 배경을 inert로 처리합니다.
        document.body.style.overflow = "hidden";
        close.focus();
      });
    });
    close.addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("cancel", function (event) { event.preventDefault(); dialog.close(); });
    dialog.addEventListener("close", function () {
      document.body.style.overflow = previousOverflow;
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    });
    function outside(event) {
      const rect = dialog.getBoundingClientRect();
      return event.clientX < rect.left || event.clientX > rect.right
        || event.clientY < rect.top || event.clientY > rect.bottom;
    }
    let backdropStart = false;
    dialog.addEventListener("pointerdown", function (event) { backdropStart = event.target === dialog && outside(event); });
    dialog.addEventListener("click", function (event) {
      if (backdropStart && event.target === dialog && outside(event)) dialog.close();
      backdropStart = false;
    });
    dialog.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(function (node) { return !node.disabled && node.getClientRects().length > 0; });
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  function renderOtherLectures() {
    const container = document.querySelector("[data-other-lectures]");
    if (!container) return;
    container.replaceChildren();
    (Array.isArray(site.otherLectures) ? site.otherLectures : []).forEach(function (lecture) {
      let url;
      try { url = new URL(lecture.url); } catch (_) { return; }
      if (!["https:", "http:"].includes(url.protocol)) return;
      const link = element("a", "lecture-link");
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.append(element("span", "", [lecture.emoji, lecture.title].filter(Boolean).join(" ")));
      const arrow = element("span", "", "↗");
      arrow.setAttribute("aria-hidden", "true");
      link.append(arrow, element("span", "sr-only", " (새 탭에서 열기)"));
      container.append(link);
    });
    const region = document.querySelector("[data-other-lectures-region]");
    if (region) region.hidden = container.children.length === 0;
  }

  function initNav() {
    const nav = document.querySelector("[data-section-nav]");
    const header = document.querySelector("[data-header]");
    if (!nav || !header) return;
    const sections = Array.from(document.querySelectorAll("main .lecture-section[id]"));
    nav.replaceChildren();
    sections.forEach(function (section, index) {
      const heading = section.querySelector("h2");
      const link = element("a", "", heading ? heading.textContent.trim() : "섹션 " + (index + 1));
      link.href = "#" + section.id;
      link.dataset.sectionId = section.id;
      nav.append(link);
    });
    const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
    const hero = document.getElementById("top");
    let activeId = "";
    function activate(id) {
      if (activeId === id) return;
      activeId = id;
      links.forEach(function (link) {
        if (link.hash === "#" + id) {
          link.setAttribute("aria-current", "location");
          if (nav.scrollWidth > nav.clientWidth) {
            const a = link.getBoundingClientRect();
            const b = nav.getBoundingClientRect();
            if (a.left < b.left || a.right > b.right) nav.scrollLeft += a.left - b.left - 4;
          }
        } else link.removeAttribute("aria-current");
      });
    }
    links.forEach(function (link) { link.addEventListener("click", function () { activate(link.hash.slice(1)); }); });
    let observer;
    let headerHeight = 0;
    function measure() {
      const height = Math.ceil(header.getBoundingClientRect().height);
      if (height === headerHeight) return;
      headerHeight = height;
      root.style.setProperty("--header-offset", height + 16 + "px");
      if (!("IntersectionObserver" in window)) return;
      if (observer) observer.disconnect();
      const visible = new Set();
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        });
        // 앵커 위 여백 때문에 이전 섹션의 끝이 남아 있어도 새 섹션을 활성화합니다.
        const current = sections.filter(function (section) { return visible.has(section); }).pop();
        if (current) activate(current.id);
        else if (hero && visible.has(hero)) activate("");
      }, { rootMargin: "-" + height + "px 0px -55% 0px", threshold: 0 });
      sections.forEach(function (section) { observer.observe(section); });
      if (hero) observer.observe(hero);
    }
    measure();
    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(header);
    else window.addEventListener("resize", measure, { passive: true });
  }

  function initSectionProgress() {
    const sections = Array.from(document.querySelectorAll("main .lecture-section[id]"));
    const slug = String((site.lecture || {}).slug || "lecture").trim() || "lecture";
    const key = "lecture-progress:" + slug;
    let visited = [];
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(saved)) visited = saved.filter(function (id) { return sections.some(function (section) { return section.id === id; }); });
    } catch (_) { visited = []; }

    function render() {
      document.querySelectorAll("[data-section-nav] a[data-section-id]").forEach(function (link) {
        const done = visited.includes(link.dataset.sectionId);
        const old = link.querySelector(".section-check");
        if (done && !old) {
          const check = element("span", "section-check", "✓");
          check.setAttribute("aria-label", "열람 완료");
          link.prepend(check);
        } else if (!done && old) old.remove();
      });
    }

    function mark(section) {
      if (!section || visited.includes(section.id)) return;
      visited.push(section.id);
      try { localStorage.setItem(key, JSON.stringify(visited)); } catch (_) { /* 저장 불가 환경에서도 현재 화면 표시는 유지합니다. */ }
      render();
    }
    sections.forEach(function (section) {
      section.addEventListener("lecture:section-viewed", function () { mark(section); });
    });
    render();
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { mark(entry.target); observer.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -45% 0px", threshold: 0 });
    sections.forEach(function (section) { if (!visited.includes(section.id)) observer.observe(section); });
  }

  function initPresentationMode() {
    const sections = Array.from(document.querySelectorAll("main .lecture-section[id]"));
    const button = document.querySelector("[data-presentation-toggle]");
    if (!sections.length || !button) return;
    const hud = element("div", "presentation-hud");
    hud.hidden = true;
    hud.setAttribute("role", "status");
    hud.setAttribute("aria-live", "polite");
    const counter = element("strong", "presentation-counter");
    const hint = element("span", "", "← → 이동 · B 블랙아웃 · P 또는 Esc 종료");
    hud.append(counter, hint);
    const blackout = element("div", "presentation-blackout");
    blackout.hidden = true;
    blackout.setAttribute("aria-hidden", "true");
    document.body.append(hud, blackout);
    let index = 0;
    let returnFocus = null;

    function dialogOpen() {
      return Array.from(document.querySelectorAll("dialog")).some(function (dialog) { return dialog.open; });
    }
    function show(nextIndex) {
      index = Math.max(0, Math.min(sections.length - 1, nextIndex));
      sections.forEach(function (section, sectionIndex) {
        section.classList.toggle("is-presentation-section", sectionIndex === index);
      });
      const current = sections[index];
      current.scrollTop = 0;
      counter.textContent = (index + 1) + " / " + sections.length;
      current.dispatchEvent(new CustomEvent("lecture:section-viewed"));
    }
    function enter() {
      if (dialogOpen()) return;
      returnFocus = document.activeElement;
      const current = document.querySelector('[data-section-nav] a[aria-current="location"]');
      const currentIndex = current ? sections.findIndex(function (section) { return section.id === current.dataset.sectionId; }) : -1;
      document.body.classList.add("is-presenting");
      button.setAttribute("aria-pressed", "true");
      hud.hidden = false;
      blackout.hidden = false;
      show(currentIndex >= 0 ? currentIndex : 0);
    }
    function exit() {
      document.body.classList.remove("is-presenting", "is-blackout");
      button.setAttribute("aria-pressed", "false");
      hud.hidden = true;
      blackout.hidden = true;
      sections.forEach(function (section) { section.classList.remove("is-presentation-section"); });
      sections[index].scrollIntoView({ block: "start", behavior: reducedMotion.matches ? "auto" : "smooth" });
      if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
    }
    function toggle() {
      if (document.body.classList.contains("is-presenting")) exit();
      else enter();
    }
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", toggle);
    document.addEventListener("keydown", function (event) {
      if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey || dialogOpen()) return;
      const target = event.target;
      if (target instanceof Element && (target.matches("input, textarea, select") || target.isContentEditable)) return;
      const presenting = document.body.classList.contains("is-presenting");
      if (event.key.toLowerCase() === "p") { event.preventDefault(); toggle(); return; }
      if (!presenting) return;
      if (event.key === "Escape") { event.preventDefault(); exit(); }
      else if (event.key === "ArrowLeft" || event.key === "PageUp") { event.preventDefault(); show(index - 1); }
      else if (event.key === "ArrowRight" || event.key === "PageDown") { event.preventDefault(); show(index + 1); }
      else if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        const active = document.body.classList.toggle("is-blackout");
        blackout.setAttribute("aria-hidden", String(!active));
      }
    });
  }

  function initProgressBar() {
    const bar = document.querySelector("[data-progress]");
    if (!bar) return;
    let scheduled = false;
    function update() {
      scheduled = false;
      const available = root.scrollHeight - root.clientHeight;
      const value = available > 0 ? Math.max(0, Math.min(1, window.scrollY / available)) : 0;
      bar.style.transform = "scaleX(" + value + ")";
    }
    function schedule() {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(schedule).observe(document.body);
    update();
  }

  function pythonTokens(source) {
    // 최소 토큰 분석: 주석·일반/삼중 따옴표 문자열·예약어·숫자·기본 내장 함수.
    // AST 분석이나 f-string 내부의 세부 강조는 하지 않습니다. HTML 대신 textContent로 처리합니다.
    const pattern = /#[^\n]*|(?:[rubf]{0,2})(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|\b(?:False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|match|case)\b|\b(?:0[xX][\da-fA-F_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)\b|\b(?:print|range|len|sum|input|int|float|str|list|dict|set|tuple|enumerate|zip)\b/g;
    const tokens = [];
    let offset = 0;
    for (const match of source.matchAll(pattern)) {
      if (match.index > offset) tokens.push({ text: source.slice(offset, match.index), kind: "" });
      const value = match[0];
      let kind = "keyword";
      if (value.startsWith("#")) kind = "comment";
      else if (/^[rubf]*["']/i.test(value)) kind = "string";
      else if (/^\d/.test(value)) kind = "number";
      else if (/^(print|range|len|sum|input|int|float|str|list|dict|set|tuple|enumerate|zip)$/.test(value)) kind = "function";
      tokens.push({ text: value, kind: kind });
      offset = match.index + value.length;
    }
    if (offset < source.length) tokens.push({ text: source.slice(offset), kind: "" });
    return tokens;
  }

  function highlightedLines(spec, total) {
    const lines = new Set();
    String(spec || "").split(",").forEach(function (part) {
      const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!match) return;
      const start = Math.max(1, Number(match[1]));
      const end = Math.min(total, Number(match[2] || match[1]));
      for (let n = start; n <= end; n += 1) lines.add(n);
    });
    return lines;
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); return true; } catch (_) { /* file:// 등에서는 아래 대체 경로 */ }
    }
    const previousFocus = document.activeElement;
    const selection = window.getSelection();
    const ranges = [];
    if (selection) for (let i = 0; i < selection.rangeCount; i += 1) ranges.push(selection.getRangeAt(i).cloneRange());
    const field = element("textarea", "sr-only");
    field.value = text;
    field.setAttribute("aria-label", "복사할 코드");
    document.body.append(field);
    field.focus({ preventScroll: true });
    field.select();
    let copied = false;
    try { copied = document.execCommand("copy"); } catch (_) { copied = false; }
    field.remove();
    if (selection) { selection.removeAllRanges(); ranges.forEach(function (range) { selection.addRange(range); }); }
    if (previousFocus) previousFocus.focus({ preventScroll: true });
    return copied;
  }

  function initCodeBlocks() {
    document.querySelectorAll("pre[data-code]:not([data-code-ready])").forEach(function (pre, index) {
      const source = (pre.querySelector("code") || pre).textContent.replace(/\r\n?/g, "\n");
      const language = pre.dataset.language || "python";
      const label = pre.dataset.label || language;
      const code = element("code");
      const lineContents = [];
      const selected = highlightedLines(pre.dataset.highlight, source.split("\n").length);
      source.split("\n").forEach(function (_, i) {
        const line = element("span", "code-line" + (selected.has(i + 1) ? " is-highlighted" : ""));
        line.dataset.line = String(i + 1);
        const number = element("span", "line-number", i + 1);
        number.setAttribute("aria-hidden", "true");
        const content = element("span", "line-content");
        line.append(number, content);
        code.append(line);
        lineContents.push(content);
      });
      let currentLine = 0;
      const tokens = language.toLowerCase() === "python" ? pythonTokens(source) : [{ text: source, kind: "" }];
      tokens.forEach(function (token) {
        token.text.split("\n").forEach(function (part, i) {
          if (i > 0) currentLine += 1;
          if (part) lineContents[currentLine].append(token.kind ? element("span", "syntax-" + token.kind, part) : document.createTextNode(part));
        });
      });
      const wrapper = element("div", "code-block");
      const toolbar = element("div", "code-toolbar");
      const caption = element("span", "code-label", label);
      const button = element("button", "copy-button", "복사");
      button.type = "button";
      button.setAttribute("aria-label", "코드 " + (index + 1) + " 복사");
      let resetTimer;
      button.addEventListener("click", async function () {
        const success = await copyText(source);
        const message = success ? "복사 완료" : "복사 실패";
        button.textContent = message;
        const status = document.querySelector("[data-copy-status]");
        if (status) status.textContent = success ? "코드 " + (index + 1) + "을 클립보드에 복사했습니다."
          : "자동 복사가 차단되었습니다. 코드 영역을 선택해 직접 복사해 주세요.";
        clearTimeout(resetTimer);
        resetTimer = setTimeout(function () { button.textContent = "복사"; if (status) status.textContent = ""; }, 2200);
      });
      toolbar.append(caption, button);
      pre.before(wrapper);
      wrapper.append(toolbar, pre);
      pre.replaceChildren(code);
      pre.dataset.codeReady = "true";
      pre.tabIndex = 0;
      pre.setAttribute("aria-label", label + (selected.size ? ", 강조 줄 " + Array.from(selected).join(", ") : ""));
    });
  }

  function initReveal() {
    const sections = Array.from(document.querySelectorAll("[data-reveal]"));
    if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove("is-reveal-pending");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
    sections.forEach(function (section) {
      // 보이는 첫 화면과 해시로 이동한 섹션은 숨기지 않습니다.
      if (section.getBoundingClientRect().top < window.innerHeight) return;
      section.classList.add("reveal-enabled", "is-reveal-pending");
      observer.observe(section);
    });
    function stop() {
      if (!reducedMotion.matches) return;
      observer.disconnect();
      sections.forEach(function (section) { section.classList.remove("is-reveal-pending", "reveal-enabled"); });
    }
    reducedMotion.addEventListener("change", stop);
    // 키보드로 진입한 콘텐츠는 애니메이션을 기다리지 않고 표시합니다.
    sections.forEach(function (section) {
      section.addEventListener("focusin", function () { section.classList.remove("is-reveal-pending"); observer.unobserve(section); });
    });
  }

  function initThemeToggle() {
    const button = document.querySelector("[data-theme-toggle]");
    if (!button) return;
    function update() {
      const dark = root.dataset.theme === "dark";
      button.setAttribute("aria-label", dark ? "라이트 모드로 전환" : "다크 모드로 전환");
      button.setAttribute("aria-pressed", String(dark));
      button.title = dark ? "라이트 모드로 전환" : "다크 모드로 전환";
      const path = button.querySelector("path");
      if (path) path.setAttribute("d", dark
        ? "M12 3V1m0 22v-2M3 12H1m22 0h-2M5.6 5.6 4.2 4.2m15.6 15.6-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0"
        : "M20.9 13a9 9 0 0 1-9.9-9.9A9 9 0 1 0 20.9 13Z");
    }
    button.addEventListener("click", function () {
      preferredTheme = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = preferredTheme;
      try { localStorage.setItem(themeKey, preferredTheme); } catch (_) { /* 현재 탭의 테마는 유지합니다. */ }
      update();
    });
    systemTheme.addEventListener("change", function (event) {
      if (preferredTheme) return;
      root.dataset.theme = event.matches ? "dark" : "light";
      update();
    });
    update();
  }

  function init() {
    applyLectureMeta();
    renderInstructorModal();
    renderOtherLectures();
    initThemeToggle();
    initCodeBlocks();
    initNav();
    initSectionProgress();
    initPresentationMode();
    initProgressBar();
    initReveal();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
