(function () {
  console.log("Layer 3 JS loaded");
})();

import { renderOverlayPanel } from "./components.js";

import { positionOverlayPanel } from "./chart.js";
let overlayTriangle = null;

export function openModal(data) {
  const modalRoot = document.getElementById("modal-root");
  
  modalRoot.innerHTML = `
  <div id="modal-overlay">
    <div class="overlay-outer-close-container">
      <a class="close-btn" id="close-modal">x</a>
    </div>
    ${renderOverlayPanel(data)}
  </div>
`;
  
  // NOTE:
  // Directional reveal (left→right vs right→left) intentionally simplified.
  // Prior attempts introduced clip-path race conditions.
  // Current implementation favors stability.
  overlayTriangle = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  overlayTriangle.style.position = "absolute";
  overlayTriangle.style.pointerEvents = "none";
  
  overlayTriangle.innerHTML = `
    <polygon points="0,6 32,0 32,32" fill="var(--overlay-triangle-bg)" />
  `;
  overlayTriangle.classList.add("overlay-triangle");
  
  const overlayRoot = document.getElementById("modal-overlay");
  
  if (!overlayRoot) {
    console.warn("modal-overlay not found — triangle not appended");
  } else {
    overlayRoot.appendChild(overlayTriangle);
    console.log("triangle appended to modal-overlay");
  }
  
  console.log("triangle appended", overlayTriangle);
  
  const overlay = document.getElementById("modal-overlay");
  overlay.setAttribute("data-open", "true");
  
  const panelEl = document.querySelector(".overlay__panel");
  panelEl.style.opacity = "0";
  
  const caseStudyBtn = modalRoot.querySelector("[data-open-case-study]");

  if (caseStudyBtn) {
    caseStudyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openCaseStudy(data);
    });
  }

  const rail = document.getElementById("content-rail");
  if (rail) {
    rail.setAttribute("data-locked", "true");
  }

  
  
  requestAnimationFrame(() => {
    positionOverlayPanel(data.__circle__);
    
    requestAnimationFrame(() => {
      const nodeRect = data.__circle__.getBoundingClientRect();
      const panelEl = document.querySelector(".overlay__panel");
      const panelRect = panelEl.getBoundingClientRect();
      
      panelEl.getBoundingClientRect(); // ✅ FORCE LAYOUT
      
      const panelHeight = Math.round(panelRect.height);
      const overlayRect = overlayRoot.getBoundingClientRect();
      const MIN_WEDGE = 4; // px — anything smaller is visually meaningless

      overlayTriangle.style.height = `${panelHeight}px`;
      overlayTriangle.setAttribute("height", panelHeight);
      overlayTriangle.setAttribute("viewBox", `0 0 32 ${panelHeight}`);

    
    // Align triangle top to panel top
    overlayTriangle.style.position = "absolute";
    overlayTriangle.style.top = `${panelRect.top - overlayRect.top}px`;
    
    const panelIsRightOfNode = panelRect.left > nodeRect.left;
    const nodeCenterX = nodeRect.left + nodeRect.width / 2;
    const nodeCenterY = nodeRect.top + nodeRect.height / 2;
    // Node radius (half the diameter)
    const nodeRadius = nodeRect.width / 2;
    const Ay = nodeCenterY - panelRect.top;
    const Ayclamped = Math.max(0, Math.min(panelHeight, Ay));
    
    
    if (panelIsRightOfNode) {
      const wedgeWidth = panelRect.left - nodeCenterX;
      
      if (wedgeWidth > MIN_WEDGE) {
        // wedge logic A (UNCHANGED)
        overlayTriangle.style.width = `${wedgeWidth}px`;
        overlayTriangle.setAttribute("width", wedgeWidth);
        overlayTriangle.setAttribute(
          "viewBox",
          `0 0 ${wedgeWidth} ${panelHeight}`
        );
        
        overlayTriangle.style.left =
        `${panelRect.left - overlayRect.left - wedgeWidth}px`;
        
        overlayTriangle.innerHTML = `
      <polygon
        points="${wedgeWidth},0 ${wedgeWidth},${panelHeight} 0,${Ayclamped}"
        fill="var(--overlay-triangle-bg)"
      />
    `;
        
        overlayTriangle.classList.add("is-visible");
      } else {
        overlayTriangle.classList.remove("is-visible");
      }
    } else {
      const wedgeWidth = nodeCenterX - panelRect.right;
      
      if (wedgeWidth > MIN_WEDGE) {
        // wedge logic B (UNCHANGED)
        overlayTriangle.style.width = `${wedgeWidth}px`;
         overlayTriangle.setAttribute("width", wedgeWidth);
        overlayTriangle.setAttribute(
          "viewBox",
          `0 0 ${wedgeWidth} ${panelHeight}`
        );
        
        overlayTriangle.style.left =
        `${panelRect.right - overlayRect.left}px`;
        
        overlayTriangle.innerHTML = `
      <polygon
        points="0,0 0,${panelHeight} ${wedgeWidth},${Ayclamped}"
        fill="var(--overlay-triangle-bg)"
      />
    `;
        
        overlayTriangle.classList.add("is-visible");
      } else {
        overlayTriangle.classList.remove("is-visible");
      }
    }
    
    // reveal panel AFTER triangle animation completes
    setTimeout(() => {
      panelEl.style.transition = `opacity var(--overlay-panel-enter-duration) ease-out`;
      panelEl.style.opacity = "1";
    }, parseInt(
      getComputedStyle(document.documentElement)
      .getPropertyValue("--overlay-triangle-enter-duration")
    ));
    
    
  });
});
  
  document
  .getElementById("close-modal")
  .addEventListener("click", closeModal);
  
  document
  .getElementById("modal-overlay")
  .addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
  
  return overlay;
  
  
}

function closeModal() {
  const modalRoot = document.getElementById("modal-root");
  if (overlayTriangle) overlayTriangle.remove();
  if (overlayTriangle) {
    overlayTriangle.classList.remove("is-visible");
  }
  const rail = document.getElementById("content-rail");
  if (rail) {
    rail.removeAttribute("data-locked");
  }

  modalRoot.innerHTML = "";
}

// ======================================================
// LAYER 3 — CASE STUDY OVERLAY
// ======================================================


export function openCaseStudy(project) {
  const layer3 = document.getElementById("layer-3-overlay");
  const closeBtn = document.getElementById("layer-3-close");

  if (!layer3) {
    console.warn("Layer 3 overlay not found");
    return;
  }

  if (!project?.id) {
    console.warn("openCaseStudy called without a valid project:", project);
    return;
  }

  layer3.classList.add("is-open");
  layer3.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-layer-3-open");

  console.log("Layer 3 opened for:", project.id);

  if (!project?.htmlInclude) {
    console.warn("No htmlInclude defined for project:", project.id);
    return;
  }

  fetch(project.htmlInclude)
    .then((res) => res.text())
    .then((html) => {
      const stage = document.querySelector(".layer-3-stage");
      if (!stage) {
        console.warn("Layer 3 stage not found");
        return;
      }
      stage.innerHTML = html;
    })
    .catch((err) => {
      console.error("Failed to load case study include:", err);
    });

  function closeLayer3() {
    layer3.classList.remove("is-open");
    layer3.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-layer-3-open");
    document.removeEventListener("keydown", onEscape);
  }

  function onEscape(e) {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    closeLayer3();
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeLayer3, { once: true });
  }

  document.addEventListener("keydown", onEscape);
}



// ======================================================
// END LAYER 3 — CASE STUDY OVERLAY
// ======================================================


