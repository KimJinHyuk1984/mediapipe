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

// ── 강의별 위젯 등록 영역 (Phase 0에서는 비워 둡니다) ──

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
