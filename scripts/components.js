
//Remove stacked panel content from openModal() to reuse it to list the work as a horizontal view component.
export function renderOverlayPanel(data) {
  return `
    <div class="overlay__panel">
      <div class="overlay__grid">
        <div class="overlay__col overlay__col--left">
          <div class="media-slot" aria-label="Overlay media">
            <img
              src="${data.meta.imageUrl}"
              alt="${data.title} cover image"
              loading="lazy"
            />
          </div>
        </div>

        <article class="overlay__col">
          <header>
            <h2 class="section-heading">
              <span class="heading-main">${data.heading.main}</span>
              <span class="heading-accent">${data.heading.accent}</span>
            </h2>
          </header>

          <dl>
            <!--<dt>ROLE</dt>
            <dd>${data.meta.problem}</dd>-->

            <dt>ROLE</dt>
            <dd>${data.meta.role}</dd>

            <dt>SOLUTION</dt>
            <dd class="scroll-notes">${data.meta.notes}</dd>
          </dl>

          ${
            data.hasCaseStudy
              ? `
                <div>
                  <a 
                    data-open-case-study="true"
                    data-project-id="${data.id}"
                    class="primary-btn-small"
                  >
                    View Case Study
                  </a>
                </div>
              `
              : ``
          }
        </article>
      </div>
    </div>
  `;
}


export function renderProjectCard(data) {
  return `
  <article class="project-card">

    <img 
      src="${data.meta.imageUrl}" 
      alt="${data.title}" 
      class="project-card-image"
    />

    <div class="project-card-body">

      <h2 class="section-heading">
        <span class="heading-main">${data.heading.main}</span>
        <span class="heading-accent">${data.heading.accent}</span>
      </h2>

      <dl class="project-meta">
        <dt>Role</dt>
        <dd>${data.meta.role}</dd>

        <dt>Disciplines</dt>
        <dd>${data.meta.disciplines}</dd>
      </dl>

    </div>

    ${
      data.hasCaseStudy
        ? `
        <div class="project-card-actions">
          <a
            data-open-case-study="true"
            data-project-id="${data.id}"
            class="primary-btn-small"
          >
            View Case Study
          </a>
        </div>
        `
        : ""
    }

  </article>
  `;
}
