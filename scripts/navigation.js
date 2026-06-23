// --- MOBILE GUARD: disable desktop scroll logic ---
const IS_TOUCH =
  "ontouchstart" in window ||
  navigator.maxTouchPoints > 0;
// --- END MOBILE GUARD ---


const railEl = document.getElementById("content-rail");

const SECTIONS = [
  "work",
  "services",
  "about"
];

const contentEls = Array.from(
  railEl.querySelectorAll(".container")
);

const TRANSITION_DURATION = 750;      // ms
const FINAL_TRANSITION_DURATION = 950; // ms
const INPUT_COOLDOWN = 400; // ms — absorbs trackpad inertia

const FRAME_COLORS = [
  { r: 195, g: 195, b: 195 }, // Work (gray)
  { r: 20,  g: 20,  b: 20 }, // Services (near black)
  { r: 250, g: 77,  b: 126 }   // About (pink)
];

const frameEl = document.getElementById("frame");


// --- GET SECTION HEIGHTS --- //
function getSectionHeight() {
  return sections[0].getBoundingClientRect().height;
}

const sections = Array.from(
  railEl.querySelectorAll(".section")
);

function setInitialPosition() {
  const sectionHeight = sections[0].getBoundingClientRect().height;
  railEl.style.transform = `translateY(0px)`;
}


const SETTLE_DELAY = 120; // ms — subtle but meaningful

let isSettled = true;
let currentIndex = 0;
let isTransitioning = false;
let inputLocked = false;


// --- EASING UTILITIES --- //
function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}

// --- Frame color helper --- //
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(colorA, colorB, t) {
  return {
    r: Math.round(lerp(colorA.r, colorB.r, t)),
    g: Math.round(lerp(colorA.g, colorB.g, t)),
    b: Math.round(lerp(colorA.b, colorB.b, t))
  };
}

function rgbToString({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}



// --- STEP 1: BASIC BOUNDARIES & LOGGING --- //
function goToIndex(nextIndex) {
  if (isTransitioning) return;
  if (nextIndex < 0 || nextIndex >= SECTIONS.length) return;
  
  isSettled = false;

  const fromIndex = currentIndex;
  const toIndex = nextIndex;

  const duration = getTransitionDuration(toIndex);
  const startTime = performance.now();

  isTransitioning = true;
  currentIndex = toIndex;
  updateNavState(currentIndex);

  console.log(
    `[NAV] ${SECTIONS[fromIndex]} → ${SECTIONS[toIndex]} (${duration}ms)`
  );

  function animate(now) {
    const elapsed = now - startTime;
    const rawProgress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutQuint(rawProgress);

    // Create a shallow dip in opacity during motion
    const MIN_OPACITY = 0.92;
    const opacity =
    MIN_OPACITY +
    (1 - MIN_OPACITY) * easedProgress;

    contentEls.forEach((el) => {
    el.style.opacity = opacity;
    });


    // Move rail inside the animation loop
    const sectionHeight = getSectionHeight();

    const fromY = -fromIndex * sectionHeight;
    const toY = -toIndex * sectionHeight;

    const currentY = lerp(fromY, toY, easedProgress);

    if (railEl) {
    railEl.style.transform = `translateY(${currentY}px)`;
    }


    const fromColor = FRAME_COLORS[fromIndex];
    const toColor = FRAME_COLORS[toIndex];

    const currentColor = lerpColor(fromColor, toColor, easedProgress);

    if (frameEl) {
        frameEl.style.borderColor = rgbToString(currentColor);
    }


    // DEBUG ONLY — we will replace this with visuals next step
    console.log(
      `[NAV] progress: ${easedProgress.toFixed(3)}`
    );

    if (rawProgress < 1) {
    requestAnimationFrame(animate);
    } else {
    console.log(`[NAV] transition complete`);

    // Hold the final state briefly
    setTimeout(() => {
        isTransitioning = false;
        isSettled = true;
        inputLocked = false; // ← re-arm input here

        contentEls.forEach((el) => {
        el.style.opacity = "1";
        });

        console.log("[NAV] state settled");
        }, SETTLE_DELAY);
    }

  }

  requestAnimationFrame(animate);
}

let lastInputTime = 0;

const NAV_MODE = true; // ← PHASE TWO LOCK

// --- STEP 2: "WHEEL" SMOOTH SCROLLING --- //
window.addEventListener(
  "wheel",
  (e) => {

    if (NAV_MODE) return; // ← HARD STOP

    if (IS_TOUCH) return;

    const rail = document.getElementById("content-rail");
    if (rail?.dataset.locked === "true") return;

    e.preventDefault();

    const now = performance.now();

    if (now - lastInputTime < INPUT_COOLDOWN) return;
    if (inputLocked) return;

    const direction = Math.sign(e.deltaY);
    if (direction === 0) return;

    const nextIndex =
      direction > 0
        ? currentIndex + 1
        : currentIndex - 1;

    if (nextIndex < 0 || nextIndex >= SECTIONS.length) return;

    lastInputTime = now;
    inputLocked = true;
    goToIndex(nextIndex);
  },
  { passive: false }
);




// --- ** EXTRA ** --- Keyboard navigation --- //
window.addEventListener("keydown", (e) => {
  if (inputLocked) return;

  if (e.key === "ArrowDown") {
    inputLocked = true;
    goToIndex(currentIndex + 1);
  }

  if (e.key === "ArrowUp") {
    inputLocked = true;
    goToIndex(currentIndex - 1);
  }
});


// --- HELPER: Section state lock logic --- //

function getTransitionDuration(toIndex) {
  // Last section gets the longer settle
  return toIndex === SECTIONS.length - 1
    ? FINAL_TRANSITION_DURATION
    : TRANSITION_DURATION;
}


const navMap = {
  work: 0,
  services: 1,
  about: 2
};

document.querySelectorAll("[data-nav]").forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    const key = link.dataset.nav;
    const index = navMap[key];

    if (index === undefined) return;
    if (index === currentIndex) return;

    inputLocked = true; // match keyboard logic
    goToIndex(index);
  });
});

function updateNavState(index) {
  const navMap = {
    0: "work",
    1: "services",
    2: "about"
  };

  const activeKey = navMap[index];

  document.querySelectorAll("[data-nav]").forEach(link => {
    if (link.dataset.nav === activeKey) {
      link.classList.add("is-active");
    } else {
      link.classList.remove("is-active");
    }
  });
}
