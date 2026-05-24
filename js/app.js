(function () {
  "use strict";

  const TOTAL_POINTS = 10;
  const MAX_FIELD_VALUE = 5;
  const RELOAD_DELAY_MS = 4000;

  const POINT_FIELDS = ["food", "guide", "hospitality"];

  const state = {
    food: 0,
    guide: 0,
    hospitality: 0,
    reviews: [],
    isSubmitting: false,
  };

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function initElements() {
    els.form = $("review-form");
    els.trashName = $("trash-name");
    els.comment = $("comment");
    els.commentCount = $("comment-count");
    els.pointsRemaining = $("points-remaining");
    els.submitBtn = $("submit-btn");
    els.formMessage = $("form-message");
    els.reviewsList = $("reviews-list");
    els.statFood = $("stat-food");
    els.statGuide = $("stat-guide");
    els.statHospitality = $("stat-hospitality");
    els.statTotal = $("stat-total");

    POINT_FIELDS.forEach(function (field) {
      els[field + "Value"] = $(field + "-value");
    });
  }

  function getPointsSum() {
    return state.food + state.guide + state.hospitality;
  }

  function getPointsRemaining() {
    return TOTAL_POINTS - getPointsSum();
  }

  function updatePointsUI() {
    const remaining = getPointsRemaining();

    POINT_FIELDS.forEach(function (field) {
      if (els[field + "Value"]) {
        els[field + "Value"].textContent = String(state[field]);
      }
    });

    els.pointsRemaining.textContent = "Punti rimasti: " + remaining;
    els.pointsRemaining.classList.remove("allocators__counter--ok", "allocators__counter--warn", "allocators__counter--error");

    if (remaining === 0) {
      els.pointsRemaining.classList.add("allocators__counter--ok");
    } else if (remaining > 0) {
      els.pointsRemaining.classList.add("allocators__counter--warn");
    } else {
      els.pointsRemaining.classList.add("allocators__counter--error");
    }

    updateSubmitState();
    updateAllocatorButtons();
  }

  function updateAllocatorButtons() {
    const remaining = getPointsRemaining();

    document.querySelectorAll("[data-action]").forEach(function (btn) {
      const action = btn.getAttribute("data-action");
      const target = btn.getAttribute("data-target");
      const value = state[target];

      if (action === "decrement") {
        btn.disabled = value <= 0;
      } else if (action === "increment") {
        btn.disabled = value >= MAX_FIELD_VALUE || remaining <= 0;
      }
    });
  }

  function isFormValid() {
    const name = els.trashName.value.trim();
    const sum = getPointsSum();

    if (!name || name.length > 40) return false;
    if (sum !== TOTAL_POINTS) return false;

    return POINT_FIELDS.every(function (field) {
      const val = state[field];
      return Number.isInteger(val) && val >= 0 && val <= MAX_FIELD_VALUE;
    });
  }

  function updateSubmitState() {
    els.submitBtn.disabled = !isFormValid() || state.isSubmitting;
  }

  function adjustPoints(field, delta) {
    const current = state[field];
    const remaining = getPointsRemaining();
    const next = current + delta;

    if (next < 0 || next > MAX_FIELD_VALUE) return;
    if (delta > 0 && remaining <= 0) return;

    state[field] = next;
    updatePointsUI();
  }

  function showFormMessage(text, type) {
    els.formMessage.hidden = false;
    els.formMessage.textContent = text;
    els.formMessage.className = "form-message form-message--" + type;
  }

  function hideFormMessage() {
    els.formMessage.hidden = true;
    els.formMessage.textContent = "";
    els.formMessage.className = "form-message";
  }

  function formatRelativeDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "data sconosciuta";

    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "proprio adesso";
    if (diffMin < 60) return diffMin === 1 ? "1 minuto fa" : diffMin + " minuti fa";
    if (diffHour < 24) return diffHour === 1 ? "1 ora fa" : diffHour + " ore fa";
    if (diffDay === 1) return "ieri";
    if (diffDay < 30) return diffDay + " giorni fa";

    const diffMonth = Math.floor(diffDay / 30);
    if (diffMonth < 12) return diffMonth === 1 ? "1 mese fa" : diffMonth + " mesi fa";

    const diffYear = Math.floor(diffDay / 365);
    return diffYear === 1 ? "1 anno fa" : diffYear + " anni fa";
  }

  function formatAverage(value) {
    if (value === null || value === undefined || isNaN(value)) return "—";
    return value.toFixed(1);
  }

  function calculateStats(reviews) {
    if (!reviews.length) {
      return { food: null, guide: null, hospitality: null, total: 0 };
    }

    const totals = reviews.reduce(
      function (acc, review) {
        acc.food += Number(review.food) || 0;
        acc.guide += Number(review.guide) || 0;
        acc.hospitality += Number(review.hospitality) || 0;
        return acc;
      },
      { food: 0, guide: 0, hospitality: 0 }
    );

    const count = reviews.length;

    return {
      food: totals.food / count,
      guide: totals.guide / count,
      hospitality: totals.hospitality / count,
      total: count,
    };
  }

  function renderStats(reviews) {
    const stats = calculateStats(reviews);
    els.statFood.textContent = formatAverage(stats.food);
    els.statGuide.textContent = formatAverage(stats.guide);
    els.statHospitality.textContent = formatAverage(stats.hospitality);
    els.statTotal.textContent = String(stats.total);
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function renderReviewCard(review) {
    const name = escapeHtml(review.trashName || "Anonimo trash");
    const date = formatRelativeDate(review.createdAt || review.date);
    const food = Number(review.food) || 0;
    const guide = Number(review.guide) || 0;
    const hospitality = Number(review.hospitality) || 0;
    const comment = review.comment ? escapeHtml(review.comment) : "";

    let html =
      '<article class="review-card">' +
      '<div class="review-card__header">' +
      '<h3 class="review-card__name">' + name + "</h3>" +
      '<time class="review-card__date" datetime="' + escapeHtml(review.createdAt || review.date || "") + '">' + date + "</time>" +
      "</div>" +
      '<div class="review-card__scores">' +
      '<span class="review-card__score review-card__score--food">🍟 ' + food + "</span>" +
      '<span class="review-card__score review-card__score--guide">🚗 ' + guide + "</span>" +
      '<span class="review-card__score review-card__score--hospitality">🧻 ' + hospitality + "</span>" +
      "</div>";

    if (comment) {
      html += '<p class="review-card__comment">"' + comment + '"</p>';
    }

    html += "</article>";
    return html;
  }

  function renderReviews(reviews) {
    if (!reviews.length) {
      els.reviewsList.innerHTML =
        '<p class="reviews-list__empty">Nessuna recensione trash ancora. Sii il primo a spargere il verbo (e le patatine).</p>';
      return;
    }

    const sorted = reviews.slice().sort(function (a, b) {
      const dateA = new Date(a.createdAt || a.date || 0);
      const dateB = new Date(b.createdAt || b.date || 0);
      return dateB - dateA;
    });

    els.reviewsList.innerHTML = sorted.map(renderReviewCard).join("");
  }

  async function loadReviews() {
    els.reviewsList.innerHTML = '<p class="reviews-list__loading">Caricamento recensioni…</p>';

    try {
      const response = await fetch("./data/reviews.json?t=" + Date.now(), {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const data = await response.json();
      state.reviews = Array.isArray(data) ? data : data.reviews || [];
      renderStats(state.reviews);
      renderReviews(state.reviews);
    } catch (err) {
      console.error("Errore caricamento recensioni:", err);
      state.reviews = [];
      renderStats([]);
      els.reviewsList.innerHTML =
        '<p class="reviews-list__empty">Recensioni non disponibili al momento. Riprova tra poco, intanto vai a prendere le patatine.</p>';
    }
  }

  function getConfig() {
    if (typeof window.CONFIG === "undefined") {
      throw new Error("CONFIG non trovato. Assicurati che js/config.js sia caricato.");
    }

    const config = window.CONFIG;
    if (!config.owner || !config.repo || !config.token) {
      throw new Error("CONFIG incompleto: servono owner, repo e token.");
    }

    if (config.token === "YOUR_TOKEN_HERE") {
      throw new Error("Configura il token in js/config.js prima di inviare recensioni.");
    }

    return config;
  }

  async function submitReview(payload) {
    const config = getConfig();
    const url = "https://api.github.com/repos/" + config.owner + "/" + config.repo + "/dispatches";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: "token " + config.token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "new-review",
        client_payload: payload,
      }),
    });

    if (!response.ok) {
      let detail = "HTTP " + response.status;
      try {
        const errorBody = await response.json();
        if (errorBody.message) detail = errorBody.message;
      } catch (_) {
        /* ignore parse errors */
      }
      throw new Error(detail);
    }
  }

  function resetForm() {
    state.food = 0;
    state.guide = 0;
    state.hospitality = 0;
    els.trashName.value = "";
    els.comment.value = "";
    els.commentCount.textContent = "0";
    updatePointsUI();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    hideFormMessage();

    if (!isFormValid() || state.isSubmitting) return;

    const payload = {
      trashName: els.trashName.value.trim(),
      food: state.food,
      guide: state.guide,
      hospitality: state.hospitality,
      comment: els.comment.value.trim(),
    };

    state.isSubmitting = true;
    updateSubmitState();
    showFormMessage("Invio in corso… tieniti forte, la Clio sta partendo.", "loading");

    try {
      await submitReview(payload);
      showFormMessage(
        "Recensione inviata! 🎉 Tra qualche secondo si aggiorna la lista — ricarica se hai fretta di vedere il tuo trash in evidenza.",
        "success"
      );
      resetForm();

      setTimeout(function () {
        loadReviews();
      }, RELOAD_DELAY_MS);
    } catch (err) {
      console.error("Errore invio recensione:", err);
      showFormMessage("Errore nell'invio: " + err.message + ". Controlla config e riprova.", "error");
    } finally {
      state.isSubmitting = false;
      updateSubmitState();
    }
  }

  function bindEvents() {
    document.querySelectorAll("[data-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const action = btn.getAttribute("data-action");
        const target = btn.getAttribute("data-target");
        adjustPoints(target, action === "increment" ? 1 : -1);
      });
    });

    els.trashName.addEventListener("input", updateSubmitState);
    els.comment.addEventListener("input", function () {
      els.commentCount.textContent = String(els.comment.value.length);
    });
    els.form.addEventListener("submit", handleSubmit);
  }

  function init() {
    initElements();
    bindEvents();
    updatePointsUI();
    loadReviews();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
