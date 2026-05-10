const phrases = [
  { id: "hai", label: "はい" },
  { id: "haai", label: "はーい" },
  { id: "arigatou", label: "ありがとうございます" },
  { id: "okidoki", label: "玄関の前に置いといてください" },
  { id: "shoushou", label: "少し待ってください" }
];

const voices = [
  { id: "young_polite", label: "若めの声（丁寧）" },
  { id: "young_blunt", label: "若めの声（少し素っ気ない）" },
  { id: "random", label: "おまかせ" }
];

const STORAGE_KEYS = {
  phrase: "vg_phrase",
  voice: "vg_voice"
};

const launchParams = getLaunchParams();

const state = {
  phraseId: getInitialPhraseId(),
  voiceId: getInitialVoiceId(),
  randomVoiceId: null,
  currentAudio: null
};

const phraseOptions = document.getElementById("phraseOptions");
const voiceOptions = document.getElementById("voiceOptions");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const randomHint = document.getElementById("randomHint");
const selectedPhraseLabel = document.getElementById("selectedPhraseLabel");
const selectedVoiceLabel = document.getElementById("selectedVoiceLabel");
const installSection = document.getElementById("installSection");
const installTabs = document.querySelectorAll(".install-tab");
const installPanels = document.querySelectorAll(".install-steps");
const scenarioPresets = document.getElementById("scenarioPresets");
const mainPlayCard = document.getElementById("mainPlayCard");
const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");
const playBtnTop = document.getElementById("playBtnTop");
const stopBtnTop = document.getElementById("stopBtnTop");

const phraseButtons = new Map();
const voiceButtons = new Map();
const audioCache = new Map();
const trackedScrollMilestones = new Set();

renderPhraseOptions();
renderOptions(voiceOptions, voices, state.voiceId, voiceButtons, selectVoice);

if (state.voiceId === "random") {
  state.randomVoiceId = pickRandomVoiceId();
}
updateRandomHint();
updateSelectionSummary();
primeAudio();
setupInstallPrompt();
setupScenarioPresets();
setupAnalytics();
announceLaunchContext();
registerServiceWorker();

if (playBtn) {
  playBtn.addEventListener("click", () => handlePlay("main_play_button"));
}
playBtnTop.addEventListener("click", () => handlePlay("hero_play_button"));
if (stopBtn) {
  stopBtn.addEventListener("click", handleStop);
}
stopBtnTop.addEventListener("click", handleStop);

function renderOptions(container, items, selectedId, map, onSelect) {
  container.innerHTML = "";
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.textContent = item.label;
    if (item.id === selectedId) {
      btn.classList.add("selected");
    }
    btn.addEventListener("click", () => onSelect(item.id));
    container.appendChild(btn);
    map.set(item.id, btn);
  });
}

function renderPhraseOptions() {
  phraseOptions.innerHTML = "";
  phrases.forEach((item) => {
    const row = document.createElement("div");
    row.className = "phrase-row";

    const selectBtn = document.createElement("button");
    selectBtn.type = "button";
    selectBtn.className = "option-btn phrase-select";
    selectBtn.textContent = item.label;
    if (item.id === state.phraseId) {
      selectBtn.classList.add("selected");
    }
    selectBtn.addEventListener("click", () => selectPhrase(item.id));

    const playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "btn small";
    playBtn.textContent = "▶";
    playBtn.setAttribute("aria-label", "再生");
    playBtn.addEventListener("click", () => {
      selectPhrase(item.id);
      handlePlay("phrase_row_play_button");
    });

    row.append(selectBtn, playBtn);
    phraseOptions.appendChild(row);
    phraseButtons.set(item.id, selectBtn);
  });
}

function selectPhrase(id) {
  const previousId = state.phraseId;
  state.phraseId = id;
  persist(STORAGE_KEYS.phrase, id);
  updateSelected(phraseButtons, id);
  primeAudio();
  updateSelectionSummary();
  updateStatus("セリフを選択済み");
  if (previousId !== id) {
    trackEvent("select_phrase", {
      phrase_id: id,
      phrase_label: phrases.find((item) => item.id === id)?.label
    });
  }
}

function selectVoice(id) {
  const previousId = state.voiceId;
  state.voiceId = id;
  persist(STORAGE_KEYS.voice, id);
  updateSelected(voiceButtons, id);

  if (id === "random") {
    state.randomVoiceId = pickRandomVoiceId();
  } else {
    state.randomVoiceId = null;
  }

  updateRandomHint();
  primeAudio();
  updateSelectionSummary();
  updateStatus("声タイプを選択済み");
  if (previousId !== id) {
    trackEvent("select_voice", {
      voice_id: id,
      voice_label: voices.find((item) => item.id === id)?.label
    });
  }
}

function updateSelected(map, selectedId) {
  map.forEach((btn, id) => {
    btn.classList.toggle("selected", id === selectedId);
  });
}

function updateRandomHint() {
  if (state.voiceId !== "random") {
    randomHint.textContent = "";
    return;
  }
  const voice = voices.find((v) => v.id === state.randomVoiceId);
  randomHint.textContent = voice
    ? `今回の声: ${voice.label}`
    : "おまかせ選択中";
}

function updateSelectionSummary() {
  const phrase = phrases.find((item) => item.id === state.phraseId);
  const selectedVoice = voices.find((item) => item.id === state.voiceId);
  const effectiveVoiceId = getEffectiveVoiceId();
  const effectiveVoice = voices.find((item) => item.id === effectiveVoiceId);

  if (selectedPhraseLabel) {
    selectedPhraseLabel.textContent = phrase?.label ?? "はい";
  }

  if (!selectedVoiceLabel) {
    return;
  }

  if (state.voiceId === "random" && effectiveVoice) {
    selectedVoiceLabel.textContent = `${selectedVoice?.label ?? "おまかせ"}（今回: ${effectiveVoice.label}）`;
    return;
  }

  selectedVoiceLabel.textContent = effectiveVoice?.label ?? selectedVoice?.label ?? "若めの声（丁寧）";
}

function getEffectiveVoiceId() {
  if (state.voiceId !== "random") {
    return state.voiceId;
  }
  if (!state.randomVoiceId) {
    state.randomVoiceId = pickRandomVoiceId();
    updateRandomHint();
  }
  return state.randomVoiceId;
}

function pickRandomVoiceId() {
  const pool = voices.filter((v) => v.id !== "random").map((v) => v.id);
  return pool[Math.floor(Math.random() * pool.length)];
}

function primeAudio() {
  const voiceId = getEffectiveVoiceId();
  const phraseId = state.phraseId;
  getAudio(voiceId, phraseId);
}

function getAudio(voiceId, phraseId) {
  const key = `${voiceId}:${phraseId}`;
  if (audioCache.has(key)) {
    return audioCache.get(key);
  }
  const src = `assets/audio/${voiceId}/${phraseId}.wav`;
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.addEventListener("error", () => {
    if (state.currentAudio === audio) {
      showError("音声ファイルが見つかりません。assets/audio に音声を追加してください。");
    }
  });
  audioCache.set(key, audio);
  return audio;
}

async function handlePlay(source = "unknown") {
  clearError();
  const phrase = phrases.find((p) => p.id === state.phraseId);
  const voiceId = getEffectiveVoiceId();
  const voice = voices.find((v) => v.id === voiceId);
  const label = `${phrase?.label ?? ""} / ${voice?.label ?? ""}`;

  if (state.currentAudio) {
    handleStop();
  }

  const audio = getAudio(voiceId, state.phraseId);
  state.currentAudio = audio;
  updateStatus(`再生中: ${label}`);
  trackEvent("play_audio", {
    source,
    phrase_id: state.phraseId,
    phrase_label: phrase?.label,
    voice_id: voiceId,
    voice_label: voice?.label
  });

  try {
    await audio.play();
  } catch (error) {
    showError("再生に失敗しました。もう一度タップしてください。");
    trackEvent("audio_play_error", {
      source,
      phrase_id: state.phraseId,
      voice_id: voiceId
    });
  }

  audio.onended = () => {
    if (state.currentAudio === audio) {
      state.currentAudio = null;
      updateStatus("再生完了");
      trackEvent("audio_complete", {
        phrase_id: state.phraseId,
        phrase_label: phrase?.label,
        voice_id: voiceId,
        voice_label: voice?.label
      });
    }
  };
}

function handleStop() {
  if (!state.currentAudio) {
    updateStatus("停止");
    return;
  }
  trackEvent("stop_audio", {
    phrase_id: state.phraseId,
    voice_id: getEffectiveVoiceId()
  });
  state.currentAudio.pause();
  state.currentAudio.currentTime = 0;
  state.currentAudio = null;
  updateStatus("停止");
}

function updateStatus(message) {
  if (!statusEl) {
    return;
  }
  statusEl.textContent = message;
}

function showError(message) {
  if (!errorEl) {
    return;
  }
  errorEl.textContent = message;
}

function clearError() {
  if (!errorEl) {
    return;
  }
  errorEl.textContent = "";
}

function setupInstallPrompt() {
  if (!installSection) {
    return;
  }

  const isIOS =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /android/i.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  const initialPlatform = isIOS ? "ios" : isAndroid ? "android" : "ios";
  setInstallPlatform(initialPlatform);

  installTabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      setInstallPlatform(btn.dataset.platform);
      trackEvent("select_install_tab", {
        platform: btn.dataset.platform
      });
    });
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
  });
}

function setInstallPlatform(platform) {
  installTabs.forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.platform === platform);
  });
  installPanels.forEach((panel) => {
    panel.hidden = panel.dataset.platform !== platform;
  });
}

function setupScenarioPresets() {
  if (!scenarioPresets) {
    return;
  }
  const buttons = scenarioPresets.querySelectorAll("[data-scenario]");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const { phrase, voice, scenario } = button.dataset;
      if (phrase) {
        selectPhrase(phrase);
      }
      if (voice) {
        selectVoice(voice);
      }
      updateStatus("おすすめ設定を適用しました。再生ボタンを押すとすぐ使えます。");
      scrollToPrimaryControls();
      trackEvent("select_scenario_preset", {
        scenario,
        phrase_id: phrase,
        voice_id: voice
      });
    });
  });
}

function setupAnalytics() {
  document.addEventListener("click", trackLinkClick, { passive: true });
  window.addEventListener("scroll", trackScrollDepth, { passive: true });
}

function scrollToPrimaryControls() {
  if (!mainPlayCard) {
    return;
  }
  mainPlayCard.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}

function trackLinkClick(event) {
  const anchor = event.target.closest("a[href]");
  if (!anchor) {
    return;
  }

  let url;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch (error) {
    return;
  }

  const label = anchor.textContent?.trim().slice(0, 80) || url.pathname;

  if (url.origin === window.location.origin) {
    trackEvent("internal_link_click", {
      destination_path: url.pathname,
      link_label: label
    });
    return;
  }

  trackEvent("outbound_link_click", {
    destination_host: url.host,
    destination_path: url.pathname,
    link_label: label
  });
}

function trackScrollDepth() {
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollableHeight <= 0) {
    return;
  }

  const progress = (window.scrollY / scrollableHeight) * 100;
  [25, 50, 75].forEach((milestone) => {
    if (progress >= milestone && !trackedScrollMilestones.has(milestone)) {
      trackedScrollMilestones.add(milestone);
      trackEvent("scroll_depth", {
        percent_scrolled: milestone
      });
    }
  });
}

function trackEvent(name, params = {}) {
  if (typeof window.gtag !== "function") {
    return;
  }
  try {
    window.gtag("event", name, params);
  } catch (error) {
    // analytics unavailable
  }
}

function loadValue(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ?? fallback;
  } catch (error) {
    return fallback;
  }
}

function persist(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // localStorage unavailable
  }
}

function getInitialPhraseId() {
  if (isValidPhraseId(launchParams.phrase)) {
    return launchParams.phrase;
  }
  return loadValue(STORAGE_KEYS.phrase, phrases[0].id);
}

function getInitialVoiceId() {
  if (isValidVoiceId(launchParams.voice)) {
    return launchParams.voice;
  }
  return loadValue(STORAGE_KEYS.voice, voices[0].id);
}

function getLaunchParams() {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get("source") || "",
      phrase: params.get("phrase") || "",
      voice: params.get("voice") || ""
    };
  } catch (error) {
    return {
      source: "",
      phrase: "",
      voice: ""
    };
  }
}

function isValidPhraseId(id) {
  return phrases.some((item) => item.id === id);
}

function isValidVoiceId(id) {
  return voices.some((item) => item.id === id);
}

function announceLaunchContext() {
  const source = launchParams.source || "direct";
  const displayMode = window.matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser";

  if (source === "shortcut") {
    updateStatus("ショートカットから起動しました。再生ボタンを押すとすぐ使えます。");
  } else if (source === "a2hs" && displayMode === "standalone") {
    updateStatus("ホーム画面から起動しました。再生ボタンを押すとすぐ使えます。");
  }

  trackEvent("launch_app", {
    source,
    display_mode: displayMode,
    phrase_id: state.phraseId,
    voice_id: state.voiceId
  });

  clearLaunchQuery();
}

function clearLaunchQuery() {
  if (!window.history.replaceState || !window.location.search) {
    return;
  }
  const cleanedUrl = `${window.location.pathname}${window.location.hash}`;
  window.history.replaceState({}, document.title, cleanedUrl);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || window.location.protocol !== "https:") {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
      trackEvent("service_worker_registered");
    } catch (error) {
      trackEvent("service_worker_register_error");
    }
  });
}
