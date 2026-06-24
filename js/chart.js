console.log("chart.js loaded");

import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import { openModal } from "./modal.js";

async function loadData() {
  const response = await fetch("/js/data.json");
  return response.json();
}

const radiusScale = complexity => {
  const BASE = 8;
  const STEP = 4;
  return BASE + complexity * STEP;
};

const complexityToY = {
  1: 1.0,
  2: 2.1,
  3: 3.4,
  4: 4.6,
  5: 5.3
};

const VIEWPORTS = {
  mobile: {
    width: 350,
    height: 600
  },
  desktop: {
    width: 900,
    height: 420
  }
};

const MARGINS = {
  marginTop: 50,
  marginLeft: 48,
  marginBottom: 48,
  marginRight: 48
};

const MOBILE_BREAKPOINT = 480;

/* === JS GEOMETRY INSETS (single source of truth) === */
const INSETS = {
  top: 105,
  side: 100
};

// --- Render ----------------------------------------

export function renderProjectChart(data) {
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

  const dimensions = {
    ...(isMobile ? VIEWPORTS.mobile : VIEWPORTS.desktop),
    ...MARGINS
  };

  const plot = Plot.plot({
    ...dimensions,

    marks: [
      Plot.dot(data, {
        x: "year",
        y: "yPos",

        r: {
          value: d => 18 + d.complexity * 5,
          scale: null
        },

        fill: "#fa4d7f",
        fillOpacity: d => d.opacity,
        title: d => d.title,
        ariaLabel: d => d.title,
        symbol: "circle",
        pointerEvents: "all"
      }),

      Plot.axisY({
        tickValues: [1.0, 2.1, 3.4, 4.6, 5.3],
        tickFormat: d => Math.round(d),
        tickSize: 0,
        anchor: "left"
      })
    ]
  });

  const container = document.getElementById("chart");
  container.innerHTML = "";
  container.appendChild(plot);

  const circles = plot.querySelectorAll("circle");

  circles.forEach((circle, index) => {
    const datum = data[index];

    circle.__datum__ = datum;
    datum.__circle__ = circle;

    circle.style.cursor = "pointer";

    circle.addEventListener("click", () => openModal(datum));

  });
}

// --- positionOverlayPanel ----------------------------------

export function positionOverlayPanel(circle) {
  console.log("positionOverlayPanel called");
  console.log("modal-root:", document.getElementById("modal-root"));
  console.log("modal-overlay:", document.getElementById("modal-overlay"));

  const modalRoot = document.getElementById("modal-root");
  const overlay = modalRoot.querySelector("#modal-overlay");
  const panel = modalRoot.querySelector(".overlay__panel");

  if (!overlay) {
    console.warn("overlay not found");
    return;
  }

  if (!panel) {
    console.warn("panel not found");
    return;
  }

  const overlayRect = overlay.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();

  const panelWidth = panelRect.width;
  if (!panelWidth) {
    console.warn("panel width is 0 — layout not ready");
    return;
  }

  const nodeRect = circle.getBoundingClientRect();
  const nodeCenterX = nodeRect.left + nodeRect.width / 2;

  const overlayCenterX = overlayRect.left + overlayRect.width / 2;

  const leftX = INSETS.side;
  const rightX = overlayRect.width - panelWidth - INSETS.side;
  const centerX = (overlayRect.width - panelWidth) / 2;

  const distanceFromCenter = Math.abs(nodeCenterX - overlayCenterX);

  let x;
  if (distanceFromCenter < panelWidth / 2) {
    x = centerX;
  } else if (nodeCenterX < overlayCenterX) {
    x = rightX;
  } else {
    x = leftX;
  }

  console.log({ leftX, centerX, rightX, x });

  panel.style.left = `${x}px`;
  panel.style.top = `${INSETS.top}px`;
}

// --- end positionOverlayPanel ----------------------------------



const data = await loadData();

const processedData = data.map(d => ({
  ...d,
  year: Number(d.year),
  yPos: complexityToY[d.complexity]
}));

window.addEventListener("resize", () => {
  renderProjectChart(processedData);
});

if (!document.getElementById("chart")) {
  throw new Error("Chart container not found");
}