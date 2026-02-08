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
  voice: "vg_voice",
  volume: "vg_volume"
};

const state = {
  phraseId: loadValue(STORAGE_KEYS.phrase, phrases[0].id),
  voiceId: loadValue(STORAGE_KEYS.voice, voices[0].id),
  volume: loadNumber(STORAGE_KEYS.volume, 0.7),
  randomVoiceId: null,
  currentAudio: null
};

const phraseOptions = document.getElementById("phraseOptions");
const voiceOptions = document.getElementById("voiceOptions");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const randomHint = document.getElementById("randomHint");
const volumeRange = document.getElementById("volumeRange");
const volumeValue = document.getElementById("volumeValue");
const volumeFill = document.querySelector(".volume-fill");
const installSection = document.getElementById("installSection");
const installTabs = document.querySelectorAll(".install-tab");
const installPanels = document.querySelectorAll(".install-steps");
const installHint = document.getElementById("installHint");
const installNowBtn = document.getElementById("installNowBtn");

const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");
const playBtnTop = document.getElementById("playBtnTop");
const stopBtnTop = document.getElementById("stopBtnTop");
const testToneBtn = document.getElementById("testToneBtn");

const phraseButtons = new Map();
const voiceButtons = new Map();
const audioCache = new Map();

let audioContext;

renderPhraseOptions();
renderOptions(voiceOptions, voices, state.voiceId, voiceButtons, selectVoice);
setupVolumeControls();

if (state.voiceId === "random") {
  state.randomVoiceId = pickRandomVoiceId();
}
updateRandomHint();
primeAudio();
setupInstallPrompt();

playBtn.addEventListener("click", handlePlay);
playBtnTop.addEventListener("click", handlePlay);
stopBtn.addEventListener("click", handleStop);
stopBtnTop.addEventListener("click", handleStop);

testToneBtn.addEventListener("click", playTestTone);

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
      handlePlay();
    });

    row.append(selectBtn, playBtn);
    phraseOptions.appendChild(row);
    phraseButtons.set(item.id, selectBtn);
  });
}

function selectPhrase(id) {
  state.phraseId = id;
  persist(STORAGE_KEYS.phrase, id);
  updateSelected(phraseButtons, id);
  primeAudio();
  updateStatus("セリフを選択済み");
}

function selectVoice(id) {
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
  updateStatus("声タイプを選択済み");
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
  audio.volume = state.volume;
  audio.preload = "auto";
  audio.addEventListener("error", () => {
    if (state.currentAudio === audio) {
      showError("音声ファイルが見つかりません。assets/audio に音声を追加してください。");
    }
  });
  audioCache.set(key, audio);
  return audio;
}

async function handlePlay() {
  clearError();
  const phrase = phrases.find((p) => p.id === state.phraseId);
  const voiceId = getEffectiveVoiceId();
  const voice = voices.find((v) => v.id === voiceId);
  const label = `${phrase?.label ?? ""} / ${voice?.label ?? ""}`;

  if (state.currentAudio) {
    handleStop();
  }

  const audio = getAudio(voiceId, state.phraseId);
  audio.volume = state.volume;
  state.currentAudio = audio;
  updateStatus(`再生中: ${label}`);

  try {
    await audio.play();
  } catch (error) {
    showError("再生に失敗しました。もう一度タップしてください。");
  }

  audio.onended = () => {
    if (state.currentAudio === audio) {
      updateStatus("再生完了");
    }
  };
}

function handleStop() {
  if (!state.currentAudio) {
    updateStatus("停止");
    return;
  }
  state.currentAudio.pause();
  state.currentAudio.currentTime = 0;
  state.currentAudio = null;
  updateStatus("停止");
}

function updateStatus(message) {
  statusEl.textContent = message;
}

function showError(message) {
  errorEl.textContent = message;
}

function clearError() {
  errorEl.textContent = "";
}

function playTestTone() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 440;
  gainNode.gain.value = 0.02 + 0.18 * state.volume;
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  setTimeout(() => {
    oscillator.stop();
  }, 220);
}

function setupVolumeControls() {
  if (!volumeRange) {
    return;
  }
  const percent = Math.round(state.volume * 100);
  volumeRange.value = String(percent);
  updateVolumeUI(percent);

  volumeRange.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    setVolume(value / 100);
  });
}

function setVolume(value) {
  const clamped = Math.min(Math.max(value, 0.2), 1);
  state.volume = clamped;
  persist(STORAGE_KEYS.volume, clamped);
  updateVolumeUI(Math.round(clamped * 100));
  audioCache.forEach((audio) => {
    audio.volume = clamped;
  });
}

function updateVolumeUI(percent) {
  if (volumeValue) {
    volumeValue.textContent = `${percent}%`;
  }
  if (volumeFill) {
    volumeFill.style.width = `${percent}%`;
  }
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
    });
  });

  if (installHint) {
    if (isStandalone) {
      installHint.textContent = "すでにホーム画面に追加されています。";
    } else if (isIOS) {
      installHint.textContent = "iPhoneはSafariの共有から追加できます。";
    } else if (isAndroid) {
      installHint.textContent = "AndroidはChromeのメニューから追加できます。";
    } else {
      installHint.textContent = "PCでは表示されないことがあります。";
    }
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    window.__vgInstallPrompt = event;
    if (installNowBtn) {
      installNowBtn.hidden = false;
    }
  });

  if (installNowBtn) {
    installNowBtn.addEventListener("click", async () => {
      const promptEvent = window.__vgInstallPrompt;
      if (!promptEvent) {
        return;
      }
      promptEvent.prompt();
      await promptEvent.userChoice;
      window.__vgInstallPrompt = null;
      installNowBtn.hidden = true;
    });
  }
}

function setInstallPlatform(platform) {
  installTabs.forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.platform === platform);
  });
  installPanels.forEach((panel) => {
    panel.hidden = panel.dataset.platform !== platform;
  });
}

function loadValue(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ?? fallback;
  } catch (error) {
    return fallback;
  }
}

function loadNumber(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
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
