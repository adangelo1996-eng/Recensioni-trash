(function () {
  "use strict";

  const TOTAL_POINTS = 10;
  const MAX_FIELD_VALUE = 5;
  const RELOAD_DELAY_MS = 4000;
  const VERSION_STORAGE_KEY_MOBILE = "recensioni-trash-last-seen-build-mobile";
  const VERSION_STORAGE_KEY_DESKTOP = "recensioni-trash-last-seen-build-desktop";
  const VOTES_STORAGE_KEY = "recensioni-trash-review-votes";
  const USER_VOTES_STORAGE_KEY = "recensioni-trash-user-votes";
  const CORSA_RACE_STORAGE_KEY = "recensioni-trash-corsa-race";
  const CORSA_GOAL_UPVOTES = 10;
  const REVIEWS_SCROLL_MAX_CARDS = 4;
  const REVIEW_CARD_ESTIMATE_REM = 9.75;
  const REVIEW_LIST_GAP_REM = 1;
  const CORSA_TRASH_ICONS = ["🍟", "🚗", "🧻", "💩", "🚮", "🛢️", "🥡", "📦"];
  const VERSION_POLL_MS = 60000;
  const DEVICE_BREAKPOINT_PX = 768;
  const DEVICE_NARROW_TOUCH_PX = 1024;

  const VERSION_BANNER_COPY = {
    mobile: "Hai il telefono in mano? Aggiorna prima che Gianna parta.",
    desktop: "Sul PC c'è roba nuova. Hard refresh o resti indietro.",
  };

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

  const UPVOTE_CALLOUT_MESSAGES = [
    "Sì! Il trash approva questo voto.",
    "Upvote registrato. Gianna fa un inchino.",
    "Hai alzato il pollice marcio. Grazie, eroe.",
    "Patatine calde per te. Voto positivo.",
    "Così si fa. La community trash esulta.",
    "Un su in più. Il bidet è orgoglioso.",
    "Voto trash positivo. Nessun albergo coinvolto.",
    "Hai spinto verso l'alto. Letteralmente.",
    "Applauso da bidet. Upvote ricevuto.",
    "Il cestino ti ringrazia con affetto.",
    "Su su su! Ancora più in alto nel ranking.",
    "Voto caldo come le patatine di ieri.",
    "Hai votato come un vero intenditore del marcio.",
    "Upvote! Rotoli di gioia (metaforici).",
    "Gianna accelera per festeggiare il tuo su.",
    "Trash positivo. Il mondo è un po' meno pulito.",
    "Hai dato gas al recensore. Benzina trash.",
    "Su registrato. Non dire che non ti diverti.",
    "Voto epico. Quasi meritano un rotolo in più.",
    "Hai alzato la media del caos. Bravissimo.",
    "Upvote lanciato come un sacchetto nel vento.",
    "Il punteggio sale. La fiera trash applaude.",
    "Sì sì sì! Ancora un po' e vince la corsa.",
    "Hai votato con la mano che non usi per pulire.",
    "Su trash confermato. Ora vai a mangiare patatine.",
    "Voto positivo. La Clio non frena il tuo entusiasmo.",
    "Hai messo un like al marcio. Rispetto.",
    "Upvote! Sei il DJ della classifica trash.",
  ];

  const DOWNVOTE_CALLOUT_MESSAGES = [
    "Giù. Il trash sospira ma registra tutto.",
    "Downvote. Gianna ti guarda male nello specchietto.",
    "Hai abbassato il pollice. Freddo ma onesto.",
    "Voto negativo. Le patatine si raffreddano.",
    "Giù giù giù. La corsa si complica per loro.",
    "Downvote trash. Nessun dramma, solo verità.",
    "Hai schiacciato il voto. Come un mozzicone.",
    "Giù registrato. Il bidet non commenta.",
    "Voto basso. Forse meritavano più rotoli.",
    "Down! Il cestino ha visto di peggio.",
    "Hai tirato giù il morale (e il punteggio).",
    "Giù. Anche il marcio ha i suoi detrattori.",
    "Downvote lanciato. Spero tu sia sicuro.",
    "Hai votato contro. Coraggioso, o incosciente.",
    "Giù. La fiera trash fischia un po'.",
    "Voto negativo. Gianna fa retromarcia simbolica.",
    "Down. Non è personale, è trash.",
    "Hai abbassato la media. Brutale ma lecito.",
    "Giù registrato. Il mondo è un po' più cinico.",
    "Downvote! Il recensore piange nel cestino.",
    "Hai dato un no marcio. Messaggio ricevuto.",
    "Giù. Quasi sento il rumore del punteggio che cade.",
    "Voto negativo. Rotoli insufficienti, forse.",
    "Down. Il trash accetta anche le critiche.",
    "Hai premuto giù come il pedale della Clio in panne.",
    "Downvote trash. Niente rancore, solo numeri.",
    "Giù. La corsa si ferma un attimo per loro.",
    "Hai votato contro con stile da giudice severo.",
  ];

  const state = {
    food: 0,
    guide: 0,
    hospitality: 0,
    reviews: [],
    votes: {},
    userVotes: {},
    race: null,
    isSubmitting: false,
    loadedBuild: null,
    pendingBuild: null,
    deviceType: null,
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
    els.corsaTrash = $("corsa-trash");
    els.corsaTrashStatus = $("corsa-trash-status");
    els.corsaTrashTrack = $("corsa-trash-track");
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
    els.versionBanner = $("version-banner");
    els.versionBannerCopy = $("version-banner-copy");
    els.versionBannerRefresh = $("version-banner-refresh");
    els.versionBannerDismiss = $("version-banner-dismiss");

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
        "Recensione inviata. Compare subito in lista — niente refresh.",
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

  function normalizeReviewScores(review) {
    return {
      food: Math.max(0, Number(review.food) || 0),
      guide: Math.max(0, Number(review.guide) || 0),
      hospitality: Math.max(0, Number(review.hospitality) || 0),
    };
  }

  function loadVotesFromStorage() {
    try {
      const raw = localStorage.getItem(VOTES_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function saveVotesToStorage() {
    try {
      localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(state.votes));
    } catch (err) {
      console.debug("Salvataggio voti non disponibile:", err);
    }
  }

  function loadUserVotesFromStorage() {
    try {
      const raw = localStorage.getItem(USER_VOTES_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      if (!parsed || typeof parsed !== "object") return {};
      const cleaned = {};
      Object.keys(parsed).forEach(function (key) {
        if (parsed[key] === "up" || parsed[key] === "down") {
          cleaned[key] = parsed[key];
        }
      });
      return cleaned;
    } catch (_) {
      return {};
    }
  }

  function saveUserVotesToStorage() {
    try {
      localStorage.setItem(USER_VOTES_STORAGE_KEY, JSON.stringify(state.userVotes));
    } catch (err) {
      console.debug("Salvataggio voti utente non disponibile:", err);
    }
  }

  function getIsoWeekId(date) {
    const d = date ? new Date(date) : new Date();
    if (isNaN(d.getTime())) return "unknown";

    const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = utc.getUTCDay() || 7;
    utc.setUTCDate(utc.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((utc - yearStart) / 86400000 + 1) / 7);
    return utc.getUTCFullYear() + "-W" + String(weekNo).padStart(2, "0");
  }

  function createEmptyRaceState(weekId) {
    return {
      weekId: weekId,
      authors: {},
      winner: null,
      lastWinner: null,
      lastWinWeek: null,
    };
  }

  function loadRaceState() {
    try {
      const raw = localStorage.getItem(CORSA_RACE_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== "object") {
        return createEmptyRaceState(getIsoWeekId());
      }
      return {
        weekId: parsed.weekId || getIsoWeekId(),
        authors: parsed.authors && typeof parsed.authors === "object" ? parsed.authors : {},
        winner: parsed.winner || null,
        lastWinner: parsed.lastWinner || null,
        lastWinWeek: parsed.lastWinWeek || null,
      };
    } catch (_) {
      return createEmptyRaceState(getIsoWeekId());
    }
  }

  function saveRaceState() {
    try {
      localStorage.setItem(CORSA_RACE_STORAGE_KEY, JSON.stringify(state.race));
    } catch (err) {
      console.debug("Salvataggio corsa non disponibile:", err);
    }
  }

  function ensureCurrentRaceWeek() {
    const currentWeek = getIsoWeekId();
    if (!state.race) {
      state.race = createEmptyRaceState(currentWeek);
      return;
    }

    if (state.race.weekId !== currentWeek) {
      state.race = createEmptyRaceState(currentWeek);
      saveRaceState();
    }
  }

  function getAuthorDisplayName(review) {
    return (review.trashName || "Anonimo trash").trim() || "Anonimo trash";
  }

  function getAuthorTotalUpvotes(reviews, authorName) {
    return reviews.reduce(function (sum, review) {
      if (getAuthorDisplayName(review) !== authorName) return sum;
      const counts = getVoteCounts(getReviewKey(review), review);
      return sum + counts.up;
    }, 0);
  }

  function getAuthorBaselineUp(authorName) {
    ensureCurrentRaceWeek();
    const entry = state.race.authors[authorName];
    if (!entry || entry.baselineUp === undefined) return 0;
    return Math.max(0, Number(entry.baselineUp) || 0);
  }

  function getAuthorWeeklyUp(authorName, reviews) {
    const list = reviews || state.reviews;
    return Math.max(0, getAuthorTotalUpvotes(list, authorName) - getAuthorBaselineUp(authorName));
  }

  function migrateRaceAuthorEntries(reviews) {
    if (!state.race || !state.race.authors) return;

    let changed = false;
    Object.keys(state.race.authors).forEach(function (name) {
      const entry = state.race.authors[name];
      if (!entry || entry.baselineUp !== undefined) return;

      const total = getAuthorTotalUpvotes(reviews, name);
      const legacyWeekly = Math.max(0, Number(entry.weeklyUp) || 0);
      entry.baselineUp = Math.max(0, total - legacyWeekly);
      delete entry.weeklyUp;
      changed = true;
    });

    if (changed) saveRaceState();
  }

  function resetCorsaRaceBoard(reviews) {
    ensureCurrentRaceWeek();
    const weekId = state.race.weekId;
    const lastWinner = state.race.lastWinner;
    const lastWinWeek = state.race.lastWinWeek;
    const list = reviews || state.reviews;
    const authors = {};

    getUniqueAuthorsFromReviews(list).forEach(function (name) {
      authors[name] = { baselineUp: getAuthorTotalUpvotes(list, name) };
    });

    state.race = {
      weekId: weekId,
      authors: authors,
      winner: null,
      lastWinner: lastWinner || null,
      lastWinWeek: lastWinWeek || null,
    };
    saveRaceState();
  }

  function checkRaceWinAfterUpvote(authorName, reviews) {
    const weeklyUp = getAuthorWeeklyUp(authorName, reviews);
    if (weeklyUp < CORSA_GOAL_UPVOTES) return null;

    state.race.winner = authorName;
    state.race.lastWinner = authorName;
    state.race.lastWinWeek = state.race.weekId;
    saveRaceState();
    resetCorsaRaceBoard(reviews);
    return authorName;
  }

  function getUniqueAuthorsFromReviews(reviews) {
    const names = {};
    reviews.forEach(function (review) {
      const name = getAuthorDisplayName(review);
      names[name] = true;
    });
    return Object.keys(names).sort(function (a, b) {
      return a.localeCompare(b, "it");
    });
  }

  function getUserVoteForReview(reviewKey) {
    const vote = state.userVotes[reviewKey];
    return vote === "up" || vote === "down" ? vote : null;
  }

  function getReviewKey(review) {
    if (review.id) return String(review.id);
    return String(review.createdAt || review.date || "") + "|" + String(review.trashName || "");
  }

  function getVoteCounts(reviewKey, review) {
    const reviewObj = review || findReviewByKey(reviewKey);

    if (reviewObj && (reviewObj.upvotes !== undefined || reviewObj.downvotes !== undefined)) {
      return {
        up: Math.max(0, Number(reviewObj.upvotes) || 0),
        down: Math.max(0, Number(reviewObj.downvotes) || 0),
      };
    }

    const entry = state.votes[reviewKey];
    if (!entry) return { up: 0, down: 0 };
    return {
      up: Math.max(0, Number(entry.up) || 0),
      down: Math.max(0, Number(entry.down) || 0),
    };
  }

  function syncVotesFromReviews(reviews) {
    reviews.forEach(function (review) {
      if (String(review.id || "").indexOf("local-") === 0) return;

      const key = getReviewKey(review);
      const counts = {
        up: Math.max(0, Number(review.upvotes) || 0),
        down: Math.max(0, Number(review.downvotes) || 0),
      };

      state.votes[key] = counts;
    });
    saveVotesToStorage();
  }

  function migrateVoteKeys(oldKey, newKey) {
    if (!oldKey || !newKey || oldKey === newKey) return;

    if (state.votes[oldKey]) {
      if (!state.votes[newKey]) {
        state.votes[newKey] = state.votes[oldKey];
      }
      delete state.votes[oldKey];
    }

    if (state.userVotes[oldKey]) {
      state.userVotes[newKey] = state.userVotes[oldKey];
      delete state.userVotes[oldKey];
    }

    saveVotesToStorage();
    saveUserVotesToStorage();
  }

  function applyReviewsScrollHeight() {
    if (!els.reviewsList) return;
    const maxHeightRem =
      REVIEWS_SCROLL_MAX_CARDS * REVIEW_CARD_ESTIMATE_REM +
      (REVIEWS_SCROLL_MAX_CARDS - 1) * REVIEW_LIST_GAP_REM;
    els.reviewsList.style.maxHeight = maxHeightRem + "rem";
  }

  function renderCorsaTrashStatus(reviews) {
    if (!els.corsaTrashStatus) return;

    ensureCurrentRaceWeek();
    const weekId = state.race.weekId;
    let message = "";

    if (state.race.lastWinner && state.race.lastWinWeek === weekId) {
      message =
        "🏆 " +
        state.race.lastWinner +
        " ha vinto la corsa (" +
        CORSA_GOAL_UPVOTES +
        " su)! Nuova heat — tutti ripartono dalla linea.";
    } else if (reviews.length) {
      message = "Settimana " + weekId + " — meta: " + CORSA_GOAL_UPVOTES + " su. Zero su = partenza a sinistra.";
    }

    if (message) {
      els.corsaTrashStatus.hidden = false;
      els.corsaTrashStatus.textContent = message;
    } else {
      els.corsaTrashStatus.hidden = true;
      els.corsaTrashStatus.textContent = "";
    }
  }

  function getRacerPositionStyle(weeklyUp) {
    const progress = Math.min(100, Math.round((weeklyUp / CORSA_GOAL_UPVOTES) * 100));
    if (progress <= 0) {
      return "left: 0; transform: translate(0, -50%);";
    }
    return "left: " + progress + "%; transform: translate(-50%, -50%);";
  }

  function renderCorsaTrash(reviews) {
    if (!els.corsaTrash || !els.corsaTrashTrack) return;

    ensureCurrentRaceWeek();

    if (!reviews.length) {
      els.corsaTrash.hidden = true;
      els.corsaTrashTrack.innerHTML = "";
      if (els.corsaTrashStatus) {
        els.corsaTrashStatus.hidden = true;
      }
      return;
    }

    const authorNames = getUniqueAuthorsFromReviews(reviews);
    const racers = authorNames
      .map(function (name) {
        return { name: name, weeklyUp: getAuthorWeeklyUp(name, reviews) };
      })
      .sort(function (a, b) {
        if (b.weeklyUp !== a.weeklyUp) return b.weeklyUp - a.weeklyUp;
        return a.name.localeCompare(b.name, "it");
      });

    els.corsaTrash.hidden = false;
    renderCorsaTrashStatus(reviews);

    els.corsaTrashTrack.innerHTML = racers
      .map(function (racer, index) {
        const icon = CORSA_TRASH_ICONS[index % CORSA_TRASH_ICONS.length];
        const progress = Math.min(100, Math.round((racer.weeklyUp / CORSA_GOAL_UPVOTES) * 100));
        const laneClass =
          "corsa-trash__lane corsa-trash__lane--" +
          ((index % 6) + 1) +
          (racer.weeklyUp >= CORSA_GOAL_UPVOTES ? " corsa-trash__lane--winner" : "");
        const racerStyle = getRacerPositionStyle(racer.weeklyUp);

        return (
          '<div class="' +
          laneClass +
          '" role="listitem">' +
          '<span class="corsa-trash__lane-label" title="' +
          escapeHtml(racer.name) +
          '">' +
          escapeHtml(racer.name) +
          "</span>" +
          '<div class="corsa-trash__lane-track" aria-hidden="true">' +
          '<div class="corsa-trash__lane-fill" style="width: ' +
          progress +
          '%;"></div>' +
          '<div class="corsa-trash__racer" style="' +
          racerStyle +
          '">' +
          '<span class="corsa-trash__racer-icon" aria-hidden="true">' +
          icon +
          "</span>" +
          '<span class="corsa-trash__racer-votes">' +
          racer.weeklyUp +
          "/" +
          CORSA_GOAL_UPVOTES +
          " su</span>" +
          "</div>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function findReviewCardElement(reviewKey) {
    if (!els.reviewsList || !reviewKey) return null;

    const cards = els.reviewsList.querySelectorAll(".review-card[data-review-key]");
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].getAttribute("data-review-key") === reviewKey) {
        return cards[i];
      }
    }
    return null;
  }

  function showVoteCallout(cardEl, type) {
    if (!cardEl) return;

    const pool = type === "up" ? UPVOTE_CALLOUT_MESSAGES : DOWNVOTE_CALLOUT_MESSAGES;
    const message = pickRandom(pool);
    const anchor = cardEl.querySelector(".review-card__votes") || cardEl;
    const existing = anchor.querySelector(".vote-callout");
    if (existing) existing.remove();

    const bubble = document.createElement("div");
    bubble.className = "vote-callout vote-callout--" + type;
    bubble.setAttribute("role", "status");
    bubble.setAttribute("aria-live", "polite");
    bubble.textContent = message;
    anchor.appendChild(bubble);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        bubble.classList.add("vote-callout--visible");
      });
    });

    window.setTimeout(function () {
      bubble.classList.remove("vote-callout--visible");
      window.setTimeout(function () {
        if (bubble.parentNode) bubble.remove();
      }, 280);
    }, 2200);
  }

  function findReviewByKey(reviewKey) {
    return state.reviews.find(function (review) {
      return getReviewKey(review) === reviewKey;
    });
  }

  function applyVoteCountDelta(reviewKey, upDelta, downDelta) {
    const current = getVoteCounts(reviewKey);
    const next = {
      up: Math.max(0, current.up + upDelta),
      down: Math.max(0, current.down + downDelta),
    };

    state.votes[reviewKey] = next;

    const review = findReviewByKey(reviewKey);
    if (review) {
      review.upvotes = next.up;
      review.downvotes = next.down;
    }
  }

  async function submitReviewVote(payload) {
    const config = getConfig();
    const url = "https://api.github.com/repos/" + config.owner + "/" + config.repo + "/dispatches";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + config.token,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        event_type: "review-vote",
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

  function persistReviewVoteToServer(review, upDelta, downDelta) {
    if (!review || !review.id || String(review.id).indexOf("local-") === 0) return;
    if (!upDelta && !downDelta) return;

    submitReviewVote({
      reviewId: review.id,
      upDelta: upDelta,
      downDelta: downDelta,
    }).catch(function (err) {
      console.error("Errore salvataggio voto sul server:", err);
    });
  }

  function handleReviewVote(reviewKey, voteType) {
    if (!reviewKey || (voteType !== "up" && voteType !== "down")) return;

    const review = findReviewByKey(reviewKey);
    const authorName = review ? getAuthorDisplayName(review) : null;
    const previousVote = getUserVoteForReview(reviewKey);
    let calloutType = voteType;
    let upDelta = 0;
    let downDelta = 0;

    if (previousVote === voteType) {
      upDelta = voteType === "up" ? -1 : 0;
      downDelta = voteType === "down" ? -1 : 0;
      applyVoteCountDelta(reviewKey, upDelta, downDelta);
      delete state.userVotes[reviewKey];
      calloutType = voteType;
    } else if (previousVote === "up" && voteType === "down") {
      upDelta = -1;
      downDelta = 1;
      applyVoteCountDelta(reviewKey, upDelta, downDelta);
      state.userVotes[reviewKey] = "down";
    } else if (previousVote === "down" && voteType === "up") {
      upDelta = 1;
      downDelta = -1;
      applyVoteCountDelta(reviewKey, upDelta, downDelta);
      state.userVotes[reviewKey] = "up";
    } else {
      upDelta = voteType === "up" ? 1 : 0;
      downDelta = voteType === "down" ? 1 : 0;
      applyVoteCountDelta(reviewKey, upDelta, downDelta);
      state.userVotes[reviewKey] = voteType;
    }

    saveVotesToStorage();
    saveUserVotesToStorage();
    persistReviewVoteToServer(review, upDelta, downDelta);

    if (authorName && voteType === "up") {
      const weeklyUp = getAuthorWeeklyUp(authorName, state.reviews);
      if (weeklyUp >= CORSA_GOAL_UPVOTES) {
        const winner = checkRaceWinAfterUpvote(authorName, state.reviews);
        if (winner) {
          showFormMessage(
            winner + " ha raggiunto " + CORSA_GOAL_UPVOTES + " su questa settimana! Corsa resettata — i voti restano.",
            "success"
          );
        }
      }
    }

    renderReviews(state.reviews);
    showVoteCallout(findReviewCardElement(reviewKey), calloutType);
  }

  function bindReviewsVoteEvents() {
    if (!els.reviewsList || els.reviewsList._votesBound) return;

    els.reviewsList.addEventListener("click", function (event) {
      const btn = event.target.closest("[data-vote]");
      if (!btn || !els.reviewsList.contains(btn)) return;

      const reviewKey = btn.getAttribute("data-review-key");
      const voteType = btn.getAttribute("data-vote");

      handleReviewVote(reviewKey, voteType);
    });

    els.reviewsList._votesBound = true;
  }

  function renderReviewCard(review) {
    const name = escapeHtml(review.trashName || "Anonimo trash");
    const date = formatRelativeDate(review.createdAt || review.date);
    const scores = normalizeReviewScores(review);
    const food = scores.food;
    const guide = scores.guide;
    const hospitality = scores.hospitality;
    const comment = review.comment ? escapeHtml(review.comment) : "";
    const rawReviewKey = getReviewKey(review);
    const reviewKey = escapeHtml(rawReviewKey);
    const voteCounts = getVoteCounts(rawReviewKey, review);
    const userVote = getUserVoteForReview(rawReviewKey);
    const netScore = voteCounts.up - voteCounts.down;
    const upActiveClass = userVote === "up" ? " review-vote--active" : "";
    const downActiveClass = userVote === "down" ? " review-vote--active" : "";

    let html =
      '<article class="review-card" data-review-key="' +
      reviewKey +
      '">' +
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

    html +=
      '<div class="review-card__votes">' +
      '<button type="button" class="review-vote review-vote--up' +
      upActiveClass +
      '" data-vote="up" data-review-key="' +
      reviewKey +
      '" aria-label="Upvote recensione, ' +
      voteCounts.up +
      ' su" aria-pressed="' +
      (userVote === "up" ? "true" : "false") +
      '">' +
      '<span class="review-vote__icon" aria-hidden="true">👍</span>' +
      '<span class="review-vote__count" aria-hidden="true">' +
      voteCounts.up +
      "</span>" +
      "</button>" +
      '<span class="review-card__totals" title="Punteggio netto: ' +
      (netScore > 0 ? "+" : "") +
      netScore +
      '" aria-label="' +
      voteCounts.up +
      " su e " +
      voteCounts.down +
      ' giù">' +
      '<span class="review-card__total review-card__total--up">👍 ' +
      voteCounts.up +
      "</span>" +
      '<span class="review-card__total-sep" aria-hidden="true">·</span>' +
      '<span class="review-card__total review-card__total--down">👎 ' +
      voteCounts.down +
      "</span>" +
      "</span>" +
      '<button type="button" class="review-vote review-vote--down' +
      downActiveClass +
      '" data-vote="down" data-review-key="' +
      reviewKey +
      '" aria-label="Downvote recensione, ' +
      voteCounts.down +
      ' giù" aria-pressed="' +
      (userVote === "down" ? "true" : "false") +
      '">' +
      '<span class="review-vote__icon" aria-hidden="true">👎</span>' +
      '<span class="review-vote__count" aria-hidden="true">' +
      voteCounts.down +
      "</span>" +
      "</button>" +
      "</div>";

    html += "</article>";
    return html;
  }

  function renderReviews(reviews) {
    applyReviewsScrollHeight();

    if (!reviews.length) {
      els.reviewsList.innerHTML =
        '<p class="reviews-list__empty">Nessuna recensione trash ancora. Sii il primo a spargere il verbo.</p>';
      renderCorsaTrash([]);
      return;
    }

    const sorted = reviews.slice().sort(function (a, b) {
      const dateA = new Date(a.createdAt || a.date || 0);
      const dateB = new Date(b.createdAt || b.date || 0);
      return dateB - dateA;
    });

    els.reviewsList.innerHTML = sorted.map(renderReviewCard).join("");
    renderCorsaTrash(reviews);
  }

  function getReviewsUrl() {
    if (isLocalDev()) {
      return "./data/reviews.json";
    }

    const config = typeof window.CONFIG !== "undefined" ? window.CONFIG : {};
    const owner = config.owner || "adangelo1996-eng";
    const repo = config.repo || "Recensioni-trash";
    const branch = config.reviewsBranch || "main";

    return (
      "https://raw.githubusercontent.com/" +
      encodeURIComponent(owner) +
      "/" +
      encodeURIComponent(repo) +
      "/" +
      encodeURIComponent(branch) +
      "/data/reviews.json"
    );
  }

  function mergeServerReviews(serverReviews) {
    const merged = Array.isArray(serverReviews) ? serverReviews.slice() : [];
    const pendingLocal = state.reviews.filter(function (review) {
      return String(review.id || "").indexOf("local-") === 0;
    });

    pendingLocal.forEach(function (local) {
      const localName = (local.trashName || "").trim();
      const localTime = new Date(local.createdAt || 0).getTime();
      let matchedRemote = null;
      const duplicate = merged.some(function (remote) {
        const remoteName = (remote.trashName || "").trim();
        const remoteTime = new Date(remote.createdAt || remote.date || 0).getTime();
        const isDuplicate = remoteName === localName && Math.abs(remoteTime - localTime) < 120000;
        if (isDuplicate) matchedRemote = remote;
        return isDuplicate;
      });
      if (duplicate && matchedRemote) {
        migrateVoteKeys(getReviewKey(local), getReviewKey(matchedRemote));
      } else if (!duplicate) {
        merged.unshift(local);
      }
    });

    return merged;
  }

  async function loadReviews() {
    els.reviewsList.innerHTML = '<p class="reviews-list__loading">Caricamento recensioni…</p>';

    try {
      const response = await fetch(getReviewsUrl() + "?t=" + Date.now(), {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      const data = await response.json();
      const serverReviews = Array.isArray(data) ? data : data.reviews || [];
      state.reviews = mergeServerReviews(serverReviews);
      syncVotesFromReviews(state.reviews);
      migrateRaceAuthorEntries(state.reviews);
      renderStats(state.reviews);
      renderReviews(state.reviews);
    } catch (err) {
      console.error("Errore caricamento recensioni:", err);
      state.reviews = [];
      renderStats([]);
      els.reviewsList.innerHTML =
        '<p class="reviews-list__empty">Recensioni non disponibili al momento. Riprova tra poco.</p>';
      renderCorsaTrash([]);
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
        "e sostituisci YOUR_TOKEN_HERE con un classic PAT (scope public_repo) o fine-grained PAT (Contents Read and write + Metadata Read sul repo)."
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
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + config.token,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
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
            " — Il PAT in SUBMIT_TOKEN non può chiamare repository_dispatch. " +
            "Soluzione consigliata: classic PAT con scope public_repo. " +
            "Alternativa: fine-grained PAT con Contents Read and write + Metadata Read su Recensioni-trash. " +
            "Aggiorna il secret SUBMIT_TOKEN e rilancia Deploy GitHub Pages (vedi README)."
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

      const optimisticReview = {
        id: "local-" + Date.now(),
        trashName: payload.trashName,
        food: payload.food,
        guide: payload.guide,
        hospitality: payload.hospitality,
        upvotes: 0,
        downvotes: 0,
        comment: payload.comment,
        createdAt: new Date().toISOString(),
      };

      state.reviews.unshift(optimisticReview);
      renderStats(state.reviews);
      renderReviews(state.reviews);

      showFormMessage("Recensione inviata! Compare subito in lista.", "success");
      showTrashModal(submittedScores);
      resetForm();

      setTimeout(function () {
        loadReviews();
      }, RELOAD_DELAY_MS);
      setTimeout(function () {
        loadReviews();
      }, RELOAD_DELAY_MS + 15000);
    } catch (err) {
      console.error("Errore invio recensione:", err);
      showFormMessage("Errore nell'invio: " + err.message, "error");
    } finally {
      state.isSubmitting = false;
      updateSubmitState();
    }
  }

  function getDeviceType() {
    const width = window.innerWidth;
    const hasTouch =
      "ontouchstart" in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const mobileUa = /Android|webOS|iPhone|iPad|iPod|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (width <= DEVICE_BREAKPOINT_PX) {
      return "mobile";
    }

    if (hasTouch && width <= DEVICE_NARROW_TOUCH_PX && (coarsePointer || mobileUa)) {
      return "mobile";
    }

    return "desktop";
  }

  function getVersionStorageKey() {
    return getDeviceType() === "mobile" ? VERSION_STORAGE_KEY_MOBILE : VERSION_STORAGE_KEY_DESKTOP;
  }

  function updateVersionBannerCopy() {
    if (!els.versionBannerCopy) return;
    const device = state.deviceType || getDeviceType();
    els.versionBannerCopy.textContent = VERSION_BANNER_COPY[device] || VERSION_BANNER_COPY.desktop;
  }

  function applyDeviceClass() {
    const device = getDeviceType();
    const changed = state.deviceType !== device;
    state.deviceType = device;

    document.body.classList.remove("device-mobile", "device-desktop");
    document.body.classList.add(device === "mobile" ? "device-mobile" : "device-desktop");

    updateVersionBannerCopy();

    return changed;
  }

  function initDeviceDetection() {
    applyDeviceClass();

    let resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        applyDeviceClass();
      }, 150);
    });
  }

  function getLastSeenBuild() {
    try {
      return sessionStorage.getItem(getVersionStorageKey());
    } catch (_) {
      return null;
    }
  }

  function setLastSeenBuild(build) {
    try {
      const key = getVersionStorageKey();
      if (build) {
        sessionStorage.setItem(key, build);
      } else {
        sessionStorage.removeItem(key);
      }
    } catch (_) {
      /* ignore quota / private mode */
    }
  }

  async function fetchDeployedVersion() {
    try {
      const response = await fetch("./version.json?t=" + Date.now(), {
        cache: "no-store",
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data && data.build ? String(data.build) : null;
    } catch (err) {
      console.debug("version.json non disponibile:", err);
      return null;
    }
  }

  function showVersionBanner(newBuild) {
    if (!els.versionBanner || !newBuild) return;

    const lastSeen = getLastSeenBuild();
    if (newBuild === lastSeen) return;

    updateVersionBannerCopy();
    state.pendingBuild = newBuild;
    els.versionBanner.hidden = false;
    els.versionBanner.classList.add("version-banner--visible");
    document.body.classList.add("version-banner-open");
  }

  function hideVersionBanner(markSeen) {
    if (!els.versionBanner) return;

    if (markSeen && state.pendingBuild) {
      setLastSeenBuild(state.pendingBuild);
    }

    els.versionBanner.classList.remove("version-banner--visible");
    els.versionBanner.hidden = true;
    document.body.classList.remove("version-banner-open");
  }

  async function checkForNewVersion() {
    const remoteBuild = await fetchDeployedVersion();
    if (!remoteBuild || !state.loadedBuild) return;

    if (remoteBuild !== state.loadedBuild) {
      showVersionBanner(remoteBuild);
    }
  }

  async function hardRefreshApp() {
    const buildToMark = state.pendingBuild || state.loadedBuild;
    setLastSeenBuild(buildToMark);

    if ("caches" in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(function (key) {
          return caches.delete(key);
        }));
      } catch (err) {
        console.debug("Cache clear skipped:", err);
      }
    }

    const basePath = location.pathname || "/";
    const hash = location.hash || "";
    window.location.href = basePath + "?v=" + Date.now() + hash;
  }

  async function initVersionCheck() {
    const build = await fetchDeployedVersion();
    if (!build) return;

    state.loadedBuild = build;

    await checkForNewVersion();

    setInterval(checkForNewVersion, VERSION_POLL_MS);
    window.addEventListener("focus", checkForNewVersion);
  }

  function bindVersionBannerEvents() {
    if (!els.versionBanner) return;

    els.versionBannerRefresh.addEventListener("click", hardRefreshApp);
    els.versionBannerDismiss.addEventListener("click", function () {
      hideVersionBanner(true);
    });
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
    bindVersionBannerEvents();
  }

  function init() {
    initElements();
    state.votes = loadVotesFromStorage();
    state.userVotes = loadUserVotesFromStorage();
    state.race = loadRaceState();
    ensureCurrentRaceWeek();
    initDeviceDetection();
    bindEvents();
    bindReviewsVoteEvents();
    updatePointsUI();
    warnIfConfigMissing();
    loadReviews();
    initVersionCheck();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
