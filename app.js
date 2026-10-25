const state = {
  premium: false,
  notes: [],
  exercises: 0,
  weekKey: "study-week",
};

const defaultNotes = [
  {
    title: "Idea",
    text: "Use a 5-minute review before tests to keep memory fresh.",
    tilt: -1.4,
  },
  {
    title: "Key fact",
    text: "Rome grew through roads, armies, and law.",
    tilt: 1.5,
  },
  {
    title: "Prompt",
    text: "Ask StudyPilot: explain this like I’m 12.",
    tilt: -1,
  },
  {
    title: "Reminder",
    text: "Mistakes are data, not failure. You’re learning.",
    tilt: 1.2,
  },
];

const quizQ = {
  question: "Which Roman achievement most directly helped long-distance communication and administration?",
  options: ["Roman roads", "Roman mosaics", "Roman statues", "Roman temples"],
  correct: "Roman roads",
};

const chatSeed = [
  {
    role: "ai",
    text: "Tell me the topic and I’ll turn it into a summary, a map, or a quiz.",
  },
];

function generateRandomTilt() {
  return `${(Math.random() * 3.2 - 1.6).toFixed(2)}deg`;
}

function loadNotes() {
  const saved = localStorage.getItem("studypilot-notes");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      return [];
    }
  }
  return [];
}

function saveNotes() {
  localStorage.setItem("studypilot-notes", JSON.stringify(state.notes));
}

function renderNotes() {
  const notesGrid = document.getElementById("notesGrid");
  if (!notesGrid) return;

  const freeLimit = state.premium ? 50 : 10;
  const noteLinesLimit = state.premium ? 500 : 350;

  notesGrid.innerHTML = "";
  state.notes.forEach((note) => {
    const item = document.createElement("div");
    item.className = "note";
    item.style.setProperty("--tilt", note.tilt || generateRandomTilt());

    const title = document.createElement("small");
    title.textContent = note.title;

    const text = document.createElement("p");
    text.textContent = note.text;

    item.appendChild(title);
    item.appendChild(text);
    notesGrid.appendChild(item);
  });

  const addHint = document.createElement("div");
  addHint.className = "note";
  addHint.style.setProperty("--tilt", "-0.8deg");
  addHint.innerHTML = `
    <small>Limits</small>
    <p>${state.premium ? `Premium: ${freeLimit} notes · ${noteLinesLimit} lines` : `Free: ${freeLimit} notes · ${noteLinesLimit} lines`}</p>
  `;
  notesGrid.appendChild(addHint);
}

function initializeNotes() {
  state.notes = loadNotes();
  if (!state.notes.length) {
    state.notes = defaultNotes;
    saveNotes();
  }
  renderNotes();
}

document.getElementById("addNoteBtn").addEventListener("click", () => {
  const count = state.notes.length;
  const maxNotes = state.premium ? 50 : 10;
  if (count >= maxNotes) {
    alert(`You’ve reached the limit for ${state.premium ? "Premium" : "Free"} notes.`);
    return;
  }

  const note = {
    title: "New note",
    text: "StudyPilot helped me structure this idea clearly and quickly.",
    tilt: generateRandomTilt(),
  };

  state.notes = [note, ...state.notes];
  saveNotes();
  renderNotes();
});

document.getElementById("premiumBtn").addEventListener("click", () => {
  state.premium = !state.premium;
  document.body.classList.toggle("premium-on", state.premium);
  renderNotes();
  renderChatMessage(
    "ai",
    state.premium
      ? "Premium is active. Calm soundtracks, voice mode, and expanded study power are unlocked."
      : "Premium is off. You’re still in free mode with the essentials."
  );
});

document.getElementById("startPremiumBtn").addEventListener("click", () => {
  state.premium = true;
  renderNotes();
  renderChatMessage("ai", "Premium unlocked. Calm music, voice mode, and deeper review tools are ready.");
});

document.getElementById("freeModeBtn").addEventListener("click", () => {
  state.premium = false;
  renderNotes();
  renderChatMessage("ai", "Free mode is active. You can still study, review, and practice without login.");
});

function renderChatMessage(role, text) {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = text;
  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function handleAIReply(prompt) {
  const q = prompt.toLowerCase();

  if (!q.trim()) return "I’m ready when you are. Ask me about a topic, a chapter, or a question.";

  if (q.includes("concept") || q.includes("map") || q.includes("mind")) {
    return "Absolutely. I can turn that into a visual concept map with main idea, supporting facts, and examples.";
  }

  if (q.includes("summary") || q.includes("summarize") || q.includes("riassunto")) {
    return "Sure — I’ll compress the topic into an easy-to-review summary with key facts, examples, and a quick memory hook.";
  }

  if (q.includes("quiz") || q.includes("question")) {
    return "Nice. I can generate a quiz with multiple-choice and timed challenge mode. Want a quick one on the topic?";
  }

  if (q.includes("roman") || q.includes("rome") || q.includes("sacco") || q.includes("defenestration") || q.includes("prague")) {
    return "That’s a strong topic. I can summarize it, make a map, and make a short quiz. Want me to turn it into a 5-minute revision sheet?";
  }

  if (q.includes("book") || q.includes("photo")) {
    return "Upload the image and I’ll summarize the page into a clean study note with the important ideas highlighted.";
  }

  if (q.includes("5 minute") || q.includes("ripasso")) {
    return "Perfect. I can generate a 5-minute review plan with the key points, definitions, and one quick test question.";
  }

  if (q.includes("premium") || q.includes("study")) {
    return "Premium unlocks voice mode, calm background audio, and expanded exercise capacity. It costs $2.99/month.";
  }

  return "Got it. I can explain it simply, make a concept map, create a quiz, or turn it into a short 5-minute recap.";
}

document.getElementById("chatSendBtn").addEventListener("click", () => {
  const input = document.getElementById("chatInput");
  const value = input.value.trim();
  if (!value) return;

  renderChatMessage("user", value);
  input.value = "";

  const reply = handleAIReply(value);
  setTimeout(() => renderChatMessage("ai", reply), 250);
});

document.getElementById("chatInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    document.getElementById("chatSendBtn").click();
  }
});

function renderQuiz() {
  const options = document.querySelectorAll(".option-btn");
  options.forEach((btn) => {
    btn.classList.remove("selected", "correct", "wrong");
    btn.disabled = false;
  });
  const feedback = document.getElementById("feedbackText");
  if (feedback) {
    feedback.textContent = "Choose an answer and I’ll tell you the truth — gently.";
    feedback.style.color = "";
  }
}

document.querySelectorAll(".option-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".option-btn").forEach((btn) => {
      btn.classList.remove("selected", "correct", "wrong");
    });
    button.classList.add("selected");
  });
});

document.getElementById("checkAnswerBtn").addEventListener("click", () => {
  const selected = document.querySelector(".option-btn.selected");
  const feedback = document.getElementById("feedbackText");

  if (!selected) {
    feedback.textContent = "Pick an answer first — I’ll handle the rest.";
    feedback.style.color = "#ffdba3";
    return;
  }

  const selectedValue = selected.dataset.answer;

  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent.trim() === quizQ.correct) {
      btn.classList.add("correct");
    } else if (btn === selected && selectedValue === "wrong") {
      btn.classList.add("wrong");
    }
  });

  if (selectedValue === "correct") {
    feedback.textContent = "Correct! Roman roads were the backbone of communication and administration. Nice one.";
    feedback.style.color = "#9ef1d3";
  } else {
    feedback.textContent = "Close — but not quite. The correct answer is Roman roads. They helped trade, movement, and ruling across the empire.";
    feedback.style.color = "#ffdba3";
  }
});

document.getElementById("buildMapBtn").addEventListener("click", () => {
  const map = document.getElementById("conceptMap");
  if (!map) return;

  const nodes = [
    "Roman Empire",
    "Military power",
    "Road network",
    "Law and government",
    "Trade and economy",
    "Collapse",
  ];

  map.innerHTML = "";
  nodes.forEach((node) => {
    const item = document.createElement("div");
    item.className = "map-node";
    item.textContent = node;
    map.appendChild(item);
  });
});

document.getElementById("summarizePhotoBtn").addEventListener("click", () => {
  const preview = document.getElementById("photoPreview");
  const file = document.getElementById("photoInput").files[0];

  if (!file) {
    alert("Upload a photo first, then I’ll summarize it.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    preview.innerHTML = `<img src="${event.target.result}" alt="Uploaded study page" />`;
    preview.classList.add("visible");
  };
  reader.readAsDataURL(file);

  renderChatMessage("ai", `I’ve looked at the image. Key ideas: thesis, evidence, and core conclusions. I can summarize it into a short study note and a quiz.`);
});

document.getElementById("photoInput").addEventListener("change", (event) => {
  const file = event.target.files[0];
  const preview = document.getElementById("photoPreview");
  if (!file) {
    preview.classList.remove("visible");
    preview.innerHTML = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    preview.innerHTML = `<img src="${event.target.result}" alt="Study upload" />`;
    preview.classList.add("visible");
  };
  reader.readAsDataURL(file);
});

document.getElementById("startFreeBtn").addEventListener("click", () => {
  state.premium = false;
  renderNotes();
  renderChatMessage("ai", "Free mode is ready. Ask me anything and I’ll keep it simple, useful, and friendly.");
});

function seedChat() {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;
  chatBox.innerHTML = "";
  chatSeed.forEach((entry) => renderChatMessage(entry.role, entry.text));
}

function boot() {
  initializeNotes();
  seedChat();
  renderQuiz();
  renderNotes();
  renderChatMessage("ai", "Hi! I’m StudyPilot. Ask me anything — summary, quiz, concept map, or quick recap.");
}

boot();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
