console.log("data.js loaded");

import { openCaseStudy } from "./modal.js";
import { renderProjectCard } from "./components.js";

let projectsCache = [];

document.addEventListener("click", (e) => {
  const trigger = e.target.closest("[data-open-case-study]");
  if (!trigger) return;

  e.preventDefault();

  const id = trigger.dataset.projectId;
  const project = projectsCache.find((p) => p.id === id);

  if (!project) {
    console.warn("Project not found for id:", id);
    return;
  }

  openCaseStudy(project);
});

fetch("scripts/data.json")
  .then((res) => res.json())
  .then((projects) => {
    projectsCache = projects;

    const listRoot = document.getElementById("project-list");
    listRoot.innerHTML = projects.map(renderProjectCard).join("");
  });

