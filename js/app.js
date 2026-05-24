(function () {
  "use strict";

  const TOTAL_POINTS = 10;
  const MAX_FIELD_VALUE = 5;
  const RELOAD_DELAY_MS = 4000;

  const POINT_FIELDS = ["food", "guide", "hospitality"];

  const CATEGORIES = {
    food: {
      label: "Cibo",
      emoji: "🍟",
      unit: function (n) {
        return n === 1 ? "patatina fritta" : "patatine fritte";
      },
    },
    guide: {
      label: "Gianna",
      emoji: "🚗",
      unit: function () {
        return "Gianna";
      },
    },
    hospitality: {
      label: "Ospitalità",
      emoji: "🧻",
      unit: function (n) {
        return n === 1 ? "rotolo" : "rotoli";
      },
    },
  };

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
    els.trashModal = $("trash-modal");
    els.trashModalEmoji = $("trash-modal-emoji");
    els.trashModalTitle = $("trash-modal-title");
    els.trashModalMessage = $("trash-modal-message");
    els.trashModalScores = $("trash-modal-scores");
    els.trashModalOk = $("trash-modal-ok");

    POINT_FIELDS.forEach(function (field) {
      els[field + "Value"] = $(field + "-value");
    });
  }

  function formatCategoryScore(field, value, options) {
    const category = CATEGORIES[field];
    const rounded = Math.round(value);
    const dominantClass = options && options.dominant ? " trash-modal__score--dominant" : "";
    const scoreClass = "review-card__score review-card__score--" + field;

    if (options && options.modal) {
      return (
        '<span class="trash-modal__score' +
        dominantClass +
        '">' +
        category.emoji +
        " " +
        category.label +
        ": " +
        value +
        "</span>"
      );
    }

    return (
      '<span class="' +
      scoreClass +
      '" title="' +
      category.label +
      '">' +
      category.emoji +
      " " +
      value +
      " " +
      category.unit(rounded) +
      "</span>"
    );
  }

  function formatStatAverage(field, value) {
    if (value === null || value === undefined || isNaN(value)) return "—";
    const category = CATEGORIES[field];
    const formatted = value.toFixed(1);
    return formatted + " " + category.unit(Math.round(value));
  }

  function getScoreTier(score) {
    if (score <= 1) return "bad";
    if (score <= 3) return "meh";
    return "legendary";
  }

  function getDominantFields(scores) {
    const max = Math.max(scores.food, scores.guide, scores.hospitality);
    return POINT_FIELDS.filter(function (field) {
      return scores[field] === max;
    });
  }

  function pickRandom(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function getTrashPopupContent(scores) {
    const food = scores.food;
    const guide = scores.guide;
    const hospitality = scores.hospitality;
    const dominant = getDominantFields(scores);
    const isBalanced = dominant.length === 3 || (dominant.length > 1 && food === guide && guide === hospitality);

    if (guide >= 4 && hospitality <= 1) {
      return {
        emoji: "🚗💨",
        title: "Gianna al massimo, ospitalità fantasma",
        message: pickRandom([
          "Hai dato tutto a Gianna e zero rotoli. Tipico: ti porta in giro ma poi ti lascia senza carta igienica. Benvenuto nel trash.",
          "5 punti Gianna, ospitalità da motel abbandonato. Lei frena in curva, tu cerchi il bagno. Esperienza autentica.",
          "Gianna leggendaria, ospitalità inesistente. Probabilmente ha parcheggiato sul marciapiede e ha rubato l'ultimo rotolo.",
        ]),
      };
    }

    if (food >= 4 && hospitality <= 1) {
      return {
        emoji: "🍟🧻",
        title: "Cibo da dio, ospitalità da carcere",
        message: pickRandom([
          "Patatine al top, rotoli a zero. Hai mangiato bene ma ti sei pulito con una foglia. Classico.",
          "Massimo cibo, minimo comfort. Le patatine erano calde, la carta igienica era un ricordo lontano.",
        ]),
      };
    }

    if (hospitality >= 4 && guide <= 1) {
      return {
        emoji: "🧻🛋️",
        title: "Ospitalità regale, Gianna in ferie",
        message: pickRandom([
          "Rotoli ovunque ma Gianna non si è fatta vedere. Casa pulita, guida assente. Sei rimasto a piedi ma almeno c'era il bidet.",
          "Ospitalità da hotel a 5 stelle, Gianna da 0. Ti hanno dato la carta igienica ma non la chiavi della macchina.",
        ]),
      };
    }

    if (food >= 4 && guide <= 1) {
      return {
        emoji: "🍟😴",
        title: "Cibo sì, Gianna no",
        message: pickRandom([
          "Hai votato le patatine e dimenticato Gianna. Capita: quando mangi bene, chi ha bisogno di uscire?",
          "Tutto sul cibo, zero guida. Sei venuto per mangiare, non per girare. Onestà trash pura.",
        ]),
      };
    }

    if (isBalanced) {
      return {
        emoji: "⚖️💩",
        title: "Recensione equilibrata",
        message: pickRandom([
          "Hai spartito i punti con la precisione di un contabile del trash. Né favore, né vendetta. Rispetto.",
          "Bilanciato come una dieta a base di patatine e rotoli. Niente eccessi, tutto nella norma trash.",
          "Distribuzione democratica dei 10 punti. La democrazia funziona, anche qui.",
        ]),
      };
    }

    if (dominant.length === 1 && dominant[0] === "food") {
      const tier = getScoreTier(food);
      if (tier === "legendary") {
        return {
          emoji: "🍟👑",
          title: "Dominio assoluto del Cibo",
          message: pickRandom([
            "Hai messo tutto sul cibo. Sei venuto qui per le patatine e non ti penti. Leggenda trash.",
            "Cibo al massimo. Gianna e l'ospitalità possono aspettare — le patatine no.",
            "La tua recensione urla: PATATINE. Messaggio ricevuto, chef del trash.",
          ]),
        };
      }
      if (tier === "meh") {
        return {
          emoji: "🍟😐",
          title: "Cibo nella media",
          message: pickRandom([
            "Cibo ok, niente di memorabile. Patatine decenti, niente da gridare al mondo.",
            "Hai dato un po' di tutto ma il cibo spicca. Non male, non epico. Trash standard.",
          ]),
        };
      }
      return {
        emoji: "🍟💀",
        title: "Cibo dimenticato",
        message: pickRandom([
          "Quasi zero punti al cibo. Le patatine piangono in un angolo. Brutale.",
          "Hai snobbato il cibo. Qui le patatine sono sacre — ricordatelo la prossima volta.",
        ]),
      };
    }

    if (dominant.length === 1 && dominant[0] === "guide") {
      const tier = getScoreTier(guide);
      if (tier === "legendary") {
        return {
          emoji: "🚗🔥",
          title: "Gianna leggendaria",
          message: pickRandom([
            "Gianna al massimo. Probabilmente ha fatto un'inversione a U in autostrada. Tu le hai dato tutto. Giusto.",
            "Massimo rispetto per Gianna. La guida trash che tutti meritano ma pochi hanno.",
            "Hai votato Gianna come se fosse la tua guida personale. E forse lo è.",
          ]),
        };
      }
      if (tier === "meh") {
        return {
          emoji: "🚗😶",
          title: "Gianna nella media",
          message: pickRandom([
            "Gianna ok, niente di folle. Qualche giro, niente acrobazie. Trash tranquillo.",
            "Punti decenti a Gianna. Non la leggenda, non il disastro. Via di mezzo.",
          ]),
        };
      }
      return {
        emoji: "🚗👻",
        title: "Gianna ignorata",
        message: pickRandom([
          "Quasi zero a Gianna. Non l'hai nemmeno considerata. Freddo.",
          "Gianna merita di più. O forse no — dipende da quanto ha parcheggiato male.",
        ]),
      };
    }

    if (dominant.length === 1 && dominant[0] === "hospitality") {
      const tier = getScoreTier(hospitality);
      if (tier === "legendary") {
        return {
          emoji: "🧻✨",
          title: "Ospitalità leggendaria",
          message: pickRandom([
            "Ospitalità al top. Rotoli ovunque, casa pulita, bidet funzionante. Sei in paradiso trash.",
            "Massimo rispetto per l'ospitalità. Qui si respira carta igienica di qualità.",
            "Hai premiato l'ospitalità come si deve. Qualcuno finalmente apprezza i rotoli.",
          ]),
        };
      }
      if (tier === "meh") {
        return {
          emoji: "🧻🤷",
          title: "Ospitalità nella media",
          message: pickRandom([
            "Ospitalità ok. Rotoli sufficienti, niente lusso. Trash standard.",
            "Punti decenti all'ospitalità. Né hotel, né baracca. Giusto mezzo.",
          ]),
        };
      }
      return {
        emoji: "🧻💀",
        title: "Ospitalità dimenticata",
        message: pickRandom([
          "Quasi zero ospitalità. I rotoli piangono. Brutale ma onesto.",
          "Hai snobbato l'ospitalità. Spero tu abbia portato la tua carta igienica.",
        ]),
      };
    }

    const totalTier =
      food + guide + hospitality === 10
        ? getScoreTier(Math.max(food, guide, hospitality))
        : "meh";

    if (totalTier === "legendary") {
      return {
        emoji: "💩🏆",
        title: "Recensione trash epica",
        message: pickRandom([
          "Hai spartito 10 punti con stile. La community trash ti ringrazia.",
          "Recensione inviata. Il trash ringrazia, le patatine applaudono.",
        ]),
      };
    }

    return {
      emoji: "💩",
      title: "Recensione trash registrata",
      message: pickRandom([
        "Il tuo verdetto è stato registrato nel registro del trash. Grazie per l'onestà brutale.",
        "Recensione inviata. Tra poco compare in lista — se hai fretta, ricarica.",
        "10 punti spartiti, messaggio ricevuto. Benvenuto nel club del trash.",
      ]),
    };
  }

  function showTrashModal(scores) {
    const content = getTrashPopupContent(scores);
    const dominant = getDominantFields(scores);

    els.trashModalEmoji.textContent = content.emoji;
    els.trashModalTitle.textContent = content.title;
    els.trashModalMessage.textContent = content.message;
    els.trashModalScores.innerHTML = POINT_FIELDS.map(function (field) {
      return formatCategoryScore(field, scores[field], {
        modal: true,
        dominant: dominant.indexOf(field) !== -1,
      });
    }).join("");

    els.trashModal.hidden = false;
    document.body.style.overflow = "hidden";
    els.trashModalOk.focus();
  }

  function hideTrashModal() {
    els.trashModal.hidden = true;
    document.body.style.overflow = "";
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
    els.statFood.textContent = formatStatAverage("food", stats.food);
    els.statGuide.textContent = formatStatAverage("guide", stats.guide);
    els.statHospitality.textContent = formatStatAverage("hospitality", stats.hospitality);
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
      formatCategoryScore("food", food) +
      formatCategoryScore("guide", guide) +
      formatCategoryScore("hospitality", hospitality) +
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
        '<p class="reviews-list__empty">Nessuna recensione trash ancora. Sii il primo a spargere il verbo.</p>';
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
        '<p class="reviews-list__empty">Recensioni non disponibili al momento. Riprova tra poco.</p>';
    }
  }

  function isLocalDev() {
    const host = location.hostname;
    return host === "localhost" || host === "127.0.0.1" || location.protocol === "file:";
  }

  function getConfigErrorMessage() {
    if (typeof window.CONFIG !== "undefined") {
      return null;
    }

    if (isLocalDev()) {
      return (
        "js/config.js mancante. Copia js/config.example.js in js/config.js " +
        "e sostituisci YOUR_TOKEN_HERE con un fine-grained PAT (Contents: Read and write + Metadata: Read sul repo)."
      );
    }

    return (
      "js/config.js non disponibile sul sito live. " +
      "Di solito significa che il deploy GitHub Actions è fallito o manca il secret SUBMIT_TOKEN. " +
      "Vai su GitHub: Settings -> Secrets -> Actions (SUBMIT_TOKEN), poi controlla che " +
      "Settings -> Pages usi GitHub Actions come sorgente e rilancia il workflow Deploy GitHub Pages."
    );
  }

  function getConfig() {
    const configError = getConfigErrorMessage();
    if (configError) {
      throw new Error(configError);
    }

    const config = window.CONFIG;
    if (!config.owner || !config.repo || !config.token) {
      throw new Error("CONFIG incompleto: servono owner, repo e token.");
    }

    if (config.token === "YOUR_TOKEN_HERE" || config.token === "YOUR_FINE_GRAINED_PAT_HERE") {
      throw new Error("Configura il token in js/config.js prima di inviare recensioni.");
    }

    return config;
  }

  function warnIfConfigMissing() {
    const configError = getConfigErrorMessage();
    if (!configError) return;

    showFormMessage(configError, "error");
    els.submitBtn.disabled = true;
  }

  async function submitReview(payload) {
    const config = getConfig();
    const url = "https://api.github.com/repos/" + config.owner + "/" + config.repo + "/dispatches";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: "Bearer " + config.token,
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
      if (
        response.status === 403 &&
        detail.indexOf("Resource not accessible by personal access token") !== -1
      ) {
        throw new Error(
          detail +
            " — Il PAT in SUBMIT_TOKEN non ha Contents: Read and write (e Metadata: Read) sul repo. " +
            "Vedi README, sezione Fine-grained PAT, poi rigenera il token e rilancia Deploy GitHub Pages."
        );
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

    const submittedScores = {
      food: payload.food,
      guide: payload.guide,
      hospitality: payload.hospitality,
    };

    state.isSubmitting = true;
    updateSubmitState();
    showFormMessage("Invio in corso… tieniti forte, Gianna sta partendo.", "loading");

    try {
      await submitReview(payload);
      showFormMessage("Recensione inviata! La lista si aggiorna tra qualche secondo.", "success");
      showTrashModal(submittedScores);
      resetForm();

      setTimeout(function () {
        loadReviews();
      }, RELOAD_DELAY_MS);
    } catch (err) {
      console.error("Errore invio recensione:", err);
      showFormMessage("Errore nell'invio: " + err.message, "error");
    } finally {
      state.isSubmitting = false;
      updateSubmitState();
    }
  }

  function bindModalEvents() {
    els.trashModalOk.addEventListener("click", hideTrashModal);
    els.trashModal.querySelector(".trash-modal__close").addEventListener("click", hideTrashModal);
    els.trashModal.querySelector(".trash-modal__backdrop").addEventListener("click", hideTrashModal);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !els.trashModal.hidden) {
        hideTrashModal();
      }
    });
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
    bindModalEvents();
  }

  function init() {
    initElements();
    bindEvents();
    updatePointsUI();
    warnIfConfigMissing();
    loadReviews();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
