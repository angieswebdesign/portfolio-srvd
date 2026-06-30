(() => {
  const phrases = Array.from(document.querySelectorAll(".phrase-field span"));
  const gapInteractionTarget = document.getElementById("gap");

  if (!phrases.length) {
    return;
  }

  const TIMING = {
    ambientIntervalMs: { min: 1200, max: 2400 },
    ambientActiveCount: { min: 2, max: 5 },
    ambientHoldMs: { min: 1800, max: 2600 },
    fadeInMs: { min: 1200, max: 1600 },
    fadeOutMs: { min: 2600, max: 3400 },
    hoverDelayMs: { min: 200, max: 300 },
    hoverHoldMs: 2400,
    clickHoldMs: 2000,
    initialAmbientDelayMs: 600
  };

  const state = {
    ambientTimer: null,
    ambientDisabled: false,
    ambientPaused: false,
    clickLocked: false,
    ambientTargetCount: randomInt(TIMING.ambientActiveCount),
    activeAmbientPhrases: new Set(),
    activeAnimations: new Map(),
    hoverTimers: new Map(),
    lastSelectedPhrase: null
  };

  function randomInt(range) {
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function durationPair(ms) {
    return `${ms}ms, ${ms}ms`;
  }

  function getPhraseTiming(phrase) {
    return {
      fadeInMs: Number(phrase.dataset.fadeInMs),
      fadeOutMs: Number(phrase.dataset.fadeOutMs)
    };
  }

  function initializePhraseTiming() {
    phrases.forEach((phrase) => {
      const fadeInMs = randomInt(TIMING.fadeInMs);
      const fadeOutMs = randomInt(TIMING.fadeOutMs);

      phrase.dataset.fadeInMs = fadeInMs;
      phrase.dataset.fadeOutMs = fadeOutMs;
      phrase.style.transitionDuration = durationPair(fadeInMs);
    });
  }

  function finishPhraseAnimation(phrase, animation) {
    if (state.activeAnimations.get(phrase) !== animation) {
      return;
    }

    if (animation.source === "ambient") {
      state.activeAmbientPhrases.delete(phrase);
    }

    state.activeAnimations.delete(phrase);
  }

  function clearPhraseAnimation(phrase) {
    const animation = state.activeAnimations.get(phrase);

    if (!animation) {
      return;
    }

    animation.timers.forEach((timer) => {
      window.clearTimeout(timer);
    });

    if (animation.source === "ambient") {
      state.activeAmbientPhrases.delete(phrase);
    }

    state.activeAnimations.delete(phrase);
  }

  function fadeOutPhrase(phrase) {
    clearPhraseAnimation(phrase);
    phrase.style.transitionDuration = durationPair(
      getPhraseTiming(phrase).fadeOutMs
    );
    phrase.classList.remove("is-active");
  }

  function activatePhrase(phrase, options = {}) {
    const timing = getPhraseTiming(phrase);
    const fadeInMs = options.fadeInMs ?? timing.fadeInMs;
    const fadeOutMs = options.fadeOutMs ?? timing.fadeOutMs;
    const holdMs = options.holdMs ?? randomInt(TIMING.ambientHoldMs);
    const source = options.source ?? "ambient";
    const animation = {
      source,
      timers: []
    };

    clearPhraseAnimation(phrase);

    if (source === "ambient") {
      state.activeAmbientPhrases.add(phrase);
    }

    state.activeAnimations.set(phrase, animation);
    phrase.style.transitionDuration = durationPair(fadeInMs);
    phrase.classList.add("is-active");

    const fadeTimer = window.setTimeout(() => {
      phrase.style.transitionDuration = durationPair(fadeOutMs);
      phrase.classList.remove("is-active");

      if (source === "ambient") {
        state.activeAmbientPhrases.delete(phrase);
      }

      if (typeof options.onFadeStart === "function") {
        options.onFadeStart();
      }

      const finishTimer = window.setTimeout(() => {
        finishPhraseAnimation(phrase, animation);
      }, fadeOutMs);

      animation.timers.push(finishTimer);
    }, holdMs);

    animation.timers.push(fadeTimer);
  }

  function clearActivePhrases(exceptPhrase = null) {
    phrases.forEach((phrase) => {
      if (phrase === exceptPhrase) {
        return;
      }

      fadeOutPhrase(phrase);
    });
  }

  function clearAmbientPhrases() {
    Array.from(state.activeAmbientPhrases).forEach((phrase) => {
      fadeOutPhrase(phrase);
    });
  }

  function getAvailablePhrases(exclusions = []) {
    const excluded = new Set(exclusions);
    const activePhrases = new Set(state.activeAnimations.keys());

    return phrases.filter((phrase) => {
      return !excluded.has(phrase) && !activePhrases.has(phrase);
    });
  }

  function selectAmbientPhrase(selectedThisRound) {
    let availablePhrases = getAvailablePhrases([
      ...selectedThisRound,
      state.lastSelectedPhrase
    ]);

    if (!availablePhrases.length) {
      availablePhrases = getAvailablePhrases(selectedThisRound);
    }

    if (!availablePhrases.length) {
      return null;
    }

    const phrase = randomItem(availablePhrases);
    state.lastSelectedPhrase = phrase;

    return phrase;
  }

  function activateAmbientPhrases(count) {
    const selectedThisRound = new Set();

    for (let index = 0; index < count; index += 1) {
      const phrase = selectAmbientPhrase(selectedThisRound);

      if (!phrase) {
        break;
      }

      selectedThisRound.add(phrase);
      activatePhrase(phrase, {
        source: "ambient"
      });
    }
  }

  function scheduleAmbientPulse(delayMs = randomInt(TIMING.ambientIntervalMs)) {
    window.clearTimeout(state.ambientTimer);

    if (state.ambientDisabled || state.ambientPaused || state.clickLocked) {
      state.ambientTimer = null;
      return;
    }

    state.ambientTimer = window.setTimeout(runAmbientPulse, delayMs);
  }

  function runAmbientPulse() {
    const activeCount = state.activeAmbientPhrases.size;

    state.ambientTimer = null;

    if (state.ambientDisabled || state.ambientPaused || state.clickLocked) {
      return;
    }

    if (activeCount === 0 || activeCount >= state.ambientTargetCount) {
      state.ambientTargetCount = randomInt(TIMING.ambientActiveCount);
    }

    const openSlots = Math.max(0, state.ambientTargetCount - activeCount);

    if (openSlots > 0) {
      const activationCount =
        activeCount === 0 ? openSlots : randomInt({ min: 1, max: openSlots });
      activateAmbientPhrases(activationCount);
    }

    scheduleAmbientPulse();
  }

  function pauseAmbient() {
    state.ambientPaused = true;
    window.clearTimeout(state.ambientTimer);
    state.ambientTimer = null;
  }

  function resumeAmbient() {
    state.clickLocked = false;
    state.ambientPaused = false;

    if (state.ambientDisabled) {
      return;
    }

    scheduleAmbientPulse();
  }

  function removeGapInteractionListeners() {
    if (!gapInteractionTarget) {
      return;
    }

    gapInteractionTarget.removeEventListener(
      "pointerenter",
      disableAmbientPermanently
    );
    gapInteractionTarget.removeEventListener(
      "mouseenter",
      disableAmbientPermanently
    );
    gapInteractionTarget.removeEventListener(
      "focusin",
      disableAmbientPermanently
    );
    gapInteractionTarget.removeEventListener(
      "touchstart",
      disableAmbientPermanently
    );
  }

  function disableAmbientPermanently() {
    if (state.ambientDisabled) {
      return;
    }

    state.ambientDisabled = true;
    state.ambientPaused = false;
    window.clearTimeout(state.ambientTimer);
    state.ambientTimer = null;
    clearAmbientPhrases();
    removeGapInteractionListeners();
  }

  function clearHoverTimer(phrase) {
    const hoverTimer = state.hoverTimers.get(phrase);

    if (!hoverTimer) {
      return;
    }

    window.clearTimeout(hoverTimer);
    state.hoverTimers.delete(phrase);
  }

  function handlePhrasePointerEnter(event) {
    if (state.clickLocked) {
      return;
    }

    const phrase = event.currentTarget;

    clearHoverTimer(phrase);

    const hoverTimer = window.setTimeout(() => {
      state.hoverTimers.delete(phrase);

      if (state.clickLocked) {
        return;
      }

      activatePhrase(phrase, {
        source: "interaction",
        holdMs: TIMING.hoverHoldMs
      });
    }, randomInt(TIMING.hoverDelayMs));

    state.hoverTimers.set(phrase, hoverTimer);
  }

  function handlePhrasePointerLeave(event) {
    clearHoverTimer(event.currentTarget);
  }

  function handlePhraseClick(event) {
    const phrase = event.currentTarget;

    clearHoverTimer(phrase);
    pauseAmbient();
    state.clickLocked = true;
    clearActivePhrases(phrase);

    activatePhrase(phrase, {
      source: "interaction",
      holdMs: TIMING.clickHoldMs,
      onFadeStart: resumeAmbient
    });
  }

  function bindPhraseInteractions() {
    phrases.forEach((phrase) => {
      phrase.addEventListener("pointerenter", handlePhrasePointerEnter);
      phrase.addEventListener("pointerleave", handlePhrasePointerLeave);
      phrase.addEventListener("click", handlePhraseClick);
    });
  }

  function bindGapInteraction() {
    if (!gapInteractionTarget) {
      return;
    }

    gapInteractionTarget.addEventListener(
      "pointerenter",
      disableAmbientPermanently
    );
    gapInteractionTarget.addEventListener(
      "mouseenter",
      disableAmbientPermanently
    );
    gapInteractionTarget.addEventListener("focusin", disableAmbientPermanently);
    gapInteractionTarget.addEventListener(
      "touchstart",
      disableAmbientPermanently,
      {
        passive: true
      }
    );
  }

  initializePhraseTiming();
  bindPhraseInteractions();
  bindGapInteraction();
  scheduleAmbientPulse(TIMING.initialAmbientDelayMs);
})();
