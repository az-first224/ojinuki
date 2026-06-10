"use strict";

const CARD = Object.freeze({
  JACK: "J",
  KING: "K",
  JOKER: "ジョーカー"
});

const state = {
  mode: "cpu",
  gameNumber: 1,
  attackerIndex: 0,
  defenderIndex: 1,
  phase: "defender-select",
  deck: [],
  hiddenCard: null,
  drawPile: [],
  drawnCards: [],
  bonusPlayerIndex: null,
  bonusActive: false,
  bonusDrawAvailable: false,
  extraDrawUsed: false,
  result: null
};

const players = [
  { name: "あなた", score: 0, isCpu: false },
  { name: "ディーラー", score: 0, isCpu: true }
];

const elements = {
  modeButtons: document.querySelectorAll(".mode-button"),
  player1Name: document.querySelector("#player1-name"),
  player2Name: document.querySelector("#player2-name"),
  player1Chip: document.querySelector("#player1-chip"),
  player2Chip: document.querySelector("#player2-chip"),
  player1Score: document.querySelector("#player1-score"),
  player2Score: document.querySelector("#player2-score"),
  player1ScoreCard: document.querySelector("#player1-score-card"),
  player2ScoreCard: document.querySelector("#player2-score-card"),
  gameNumber: document.querySelector("#game-number"),
  attackerName: document.querySelector("#attacker-name"),
  defenderName: document.querySelector("#defender-name"),
  bonusBanner: document.querySelector("#bonus-banner"),
  stepLabel: document.querySelector("#step-label"),
  statusTitle: document.querySelector("#status-title"),
  statusMessage: document.querySelector("#status-message"),
  playArea: document.querySelector("#play-area")
};

function createDeck(useBonus) {
  const jackCount = useBonus ? 2 : 3;
  return [
    ...Array(jackCount).fill(CARD.JACK),
    CARD.KING,
    CARD.KING,
    CARD.JOKER
  ];
}

function shuffle(cards) {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index]
    ];
  }

  return shuffled;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function resetMatch(mode) {
  state.mode = mode;
  state.gameNumber = 1;
  state.attackerIndex = 0;
  state.defenderIndex = 1;
  state.bonusPlayerIndex = null;
  players[0].score = 0;
  players[1].score = 0;

  if (mode === "cpu") {
    players[0].name = "あなた";
    players[0].isCpu = false;
    players[1].name = "ディーラー";
    players[1].isCpu = true;
  } else {
    players[0].name = "プレイヤー1";
    players[0].isCpu = false;
    players[1].name = "プレイヤー2";
    players[1].isCpu = false;
  }

  initializeGame();
}

function initializeGame() {
  state.phase = "defender-select";
  state.hiddenCard = null;
  state.drawPile = [];
  state.drawnCards = [];
  state.bonusDrawAvailable = false;
  state.extraDrawUsed = false;
  state.result = null;

  // 獲得したボーナスは、そのプレイヤーが次に攻める1ゲームだけ使います。
  state.bonusActive = state.bonusPlayerIndex === state.attackerIndex;
  if (state.bonusActive) {
    state.bonusPlayerIndex = null;
  }

  state.deck = createDeck(state.bonusActive);
  render();
}

function updateHeader() {
  elements.player1Name.textContent = players[0].name;
  elements.player2Name.textContent = players[1].name;
  elements.player1Chip.textContent = state.mode === "cpu" ? "YOU" : "P1";
  elements.player2Chip.textContent = state.mode === "cpu" ? "CPU" : "P2";
  elements.player2Chip.classList.toggle("cpu-chip", state.mode === "cpu");
  elements.player1Score.textContent = players[0].score;
  elements.player2Score.textContent = players[1].score;
  elements.gameNumber.textContent = state.gameNumber;
  elements.attackerName.textContent = players[state.attackerIndex].name;
  elements.defenderName.textContent = players[state.defenderIndex].name;

  elements.player1ScoreCard.classList.toggle("active-seat", state.attackerIndex === 0);
  elements.player2ScoreCard.classList.toggle("active-seat", state.attackerIndex === 1);

  elements.modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });

  if (state.bonusActive) {
    elements.bonusBanner.textContent =
      `J BONUS発動：${players[state.attackerIndex].name}はJが1枚少ない5枚で勝負します`;
    elements.bonusBanner.classList.remove("hidden");
  } else {
    elements.bonusBanner.classList.add("hidden");
  }
}

function setStatus(step, title, message) {
  elements.stepLabel.textContent = step;
  elements.statusTitle.textContent = title;
  elements.statusMessage.textContent = message;
}

function createButton(text, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = text;
  button.addEventListener("click", onClick);
  return button;
}

function createCardElement(value, options = {}) {
  const { asButton = false, faceDown = false, label = "" } = options;
  const card = document.createElement(asButton ? "button" : "div");
  card.className = "playing-card";

  if (asButton) {
    card.type = "button";
    card.setAttribute("aria-label", label || `${value}を選ぶ`);
  }

  if (faceDown) {
    card.classList.add("card-back");
    card.setAttribute("aria-label", label || "伏せられたカード");
    card.innerHTML = '<span class="back-mark">♠</span>';
    return card;
  }

  if (value === CARD.JOKER) {
    card.classList.add("joker");
  }

  const suit = value === CARD.KING ? "♠" : value === CARD.JACK ? "♥" : "★";
  const corner = document.createElement("span");
  corner.className = "card-corner";
  corner.innerHTML = `<b>${value === CARD.JOKER ? "JK" : value}</b><i>${suit}</i>`;

  const center = document.createElement("span");
  center.className = "card-value";
  center.textContent = value === CARD.JOKER ? "JOKER" : value;

  const lowerSuit = document.createElement("span");
  lowerSuit.className = "card-suit";
  lowerSuit.textContent = suit;

  card.append(corner, center, lowerSuit);
  return card;
}

function renderDefenderSelect() {
  const defender = players[state.defenderIndex];

  if (defender.isCpu) {
    setStatus(
      "DEALER TURN",
      "ディーラーがカードを隠します",
      "ボタンを押すとCPUが1枚を選び、伏せてセットします。"
    );

    const cpuArea = document.createElement("div");
    cpuArea.className = "cpu-stage";
    cpuArea.append(
      createCardElement(null, { faceDown: true }),
      createButton("ディーラーに隠してもらう", "primary-button", cpuHideCard)
    );
    elements.playArea.append(cpuArea);
    return;
  }

  setStatus(
    "DEFENSE TURN",
    "隠すカードを選んでください",
    state.mode === "cpu"
      ? "CPUには選んだカードは見えません。勝負の1枚を選んでください。"
      : `${defender.name}だけが画面を見て、1枚を選んでください。`
  );

  const caption = document.createElement("p");
  caption.className = "section-caption";
  caption.textContent = `TABLE DECK ・ ${state.deck.length} CARDS`;

  const cardRow = document.createElement("div");
  cardRow.className = "card-row";

  state.deck.forEach((value, index) => {
    const card = createCardElement(value, {
      asButton: true,
      label: `${value}を隠す`
    });
    card.addEventListener("click", () => hideCard(index));
    cardRow.append(card);
  });

  elements.playArea.append(caption, cardRow);
}

function cpuHideCard() {
  if (!players[state.defenderIndex].isCpu || state.phase !== "defender-select") {
    return;
  }

  // CPUは完全なランダムではなく、Jを少し多めに隠してボーナスも狙います。
  const weightedDeck = [...state.deck, CARD.JACK];
  const chosenValue = randomItem(weightedDeck);
  const chosenIndex = state.deck.indexOf(chosenValue);
  hideCard(chosenIndex);
}

function hideCard(index) {
  if (state.phase !== "defender-select") {
    return;
  }

  state.hiddenCard = state.deck[index];
  const remainingCards = state.deck.filter((_, cardIndex) => cardIndex !== index);
  state.drawPile = shuffle(remainingCards);

  if (players[state.attackerIndex].isCpu) {
    state.phase = "cpu-ready";
  } else if (state.mode === "two-player") {
    state.phase = "handoff";
  } else {
    state.phase = "attacker-draw";
  }

  render();
}

function renderHandoff() {
  const attacker = players[state.attackerIndex].name;
  setStatus(
    "PASS THE TABLE",
    "攻め側に渡してください",
    `隠したカードは伏せました。画面を${attacker}に渡してから進んでください。`
  );

  const handoff = document.createElement("div");
  handoff.className = "handoff";
  handoff.append(
    createCardElement(null, { faceDown: true }),
    createButton("攻め側の準備完了", "primary-button", () => {
      state.phase = "attacker-draw";
      render();
    })
  );
  elements.playArea.append(handoff);
}

function renderCpuReady() {
  setStatus(
    "CPU ATTACK",
    "ディーラーが推理します",
    "CPUはあなたが隠したカードを見ずに、引いたカードの確率だけで予想します。"
  );

  const cpuArea = document.createElement("div");
  cpuArea.className = "cpu-stage";

  const thinking = document.createElement("div");
  thinking.className = "dealer-chip";
  thinking.innerHTML = "<span>♠</span><b>CPU</b>";

  cpuArea.append(
    thinking,
    createButton("CPUのターンを開始", "primary-button", runCpuTurn)
  );
  elements.playArea.append(cpuArea);
}

function takeTopCard() {
  return state.drawPile.splice(0, 1)[0];
}

function drawCard() {
  if (state.phase !== "attacker-draw" || state.drawnCards.length >= 2 || state.drawPile.length === 0) {
    return;
  }

  state.drawnCards.push(takeTopCard());
  if (state.drawnCards.length === 2) {
    state.bonusDrawAvailable = state.drawnCards.includes(CARD.JOKER);
  }
  render();
}

function drawExtraCard() {
  if (!state.bonusDrawAvailable || state.extraDrawUsed || state.drawPile.length === 0) {
    return;
  }

  state.drawnCards.push(takeTopCard());
  state.extraDrawUsed = true;
  render();
}

function renderDrawnCards(includePlaceholders = true) {
  const drawnArea = document.createElement("div");
  drawnArea.className = "card-row drawn-area";

  state.drawnCards.forEach((card) => {
    drawnArea.append(createCardElement(card));
  });

  if (includePlaceholders) {
    for (let index = state.drawnCards.length; index < 2; index += 1) {
      const placeholder = document.createElement("div");
      placeholder.className = "draw-placeholder";
      placeholder.textContent = "?";
      drawnArea.append(placeholder);
    }
  }

  return drawnArea;
}

function renderAttackerDraw() {
  const attacker = players[state.attackerIndex].name;
  const baseDrawsRemaining = Math.max(0, 2 - state.drawnCards.length);

  setStatus(
    "ATTACK TURN",
    baseDrawsRemaining > 0 ? "カードを2枚引いてください" : "伏せられたカードを予想",
    baseDrawsRemaining > 0
      ? `${attacker}のドローです。残り${baseDrawsRemaining}枚を引いてください。`
      : "引いたカードと元の構成から、テーブル中央の1枚を読み切ってください。"
  );

  const drawZone = document.createElement("div");
  drawZone.className = "draw-zone";

  const caption = document.createElement("p");
  caption.className = "section-caption";
  caption.textContent = "YOUR HAND";
  drawZone.append(caption, renderDrawnCards());

  const actions = document.createElement("div");
  actions.className = "action-row";

  if (state.drawnCards.length < 2) {
    actions.append(
      createButton(
        `カードを引く ・ ${state.drawnCards.length + 1}枚目`,
        "primary-button",
        drawCard
      )
    );
  } else if (state.bonusDrawAvailable && !state.extraDrawUsed) {
    actions.append(
      createButton("JOKER BONUS ・ 追加で1枚引く", "gold-button", drawExtraCard)
    );
  }

  if (actions.children.length > 0) {
    drawZone.append(actions);
  }

  elements.playArea.append(drawZone);
  if (state.drawnCards.length >= 2) {
    renderGuessPanel();
  }
}

function renderGuessPanel() {
  const panel = document.createElement("div");
  panel.className = "guess-panel";

  const caption = document.createElement("p");
  caption.className = "section-caption";
  caption.textContent = "PLACE YOUR BET ・ 隠されたカードは？";

  const row = document.createElement("div");
  row.className = "guess-row";

  [CARD.JACK, CARD.KING, CARD.JOKER].forEach((guess) => {
    row.append(createButton(guess, "guess-button", () => resolveGuess(guess)));
  });

  panel.append(caption, row);
  elements.playArea.append(panel);
}

function runCpuTurn() {
  if (state.phase !== "cpu-ready") {
    return;
  }

  state.drawnCards.push(takeTopCard(), takeTopCard());
  state.bonusDrawAvailable = state.drawnCards.includes(CARD.JOKER);

  // ジョーカーがあればCPUは情報を増やすため必ず追加ドローします。
  if (state.bonusDrawAvailable && state.drawPile.length > 0) {
    state.drawnCards.push(takeTopCard());
    state.extraDrawUsed = true;
  }

  resolveGuess(makeCpuGuess());
}

function makeCpuGuess() {
  const remainingCounts = {
    [CARD.JACK]: state.bonusActive ? 2 : 3,
    [CARD.KING]: 2,
    [CARD.JOKER]: 1
  };

  state.drawnCards.forEach((card) => {
    remainingCounts[card] -= 1;
  });

  const highestCount = Math.max(...Object.values(remainingCounts));
  const likelyCards = Object.keys(remainingCounts).filter(
    (card) => remainingCounts[card] === highestCount
  );

  // 同率の候補だけランダムにするため、CPUは隠しカードを参照しません。
  return randomItem(likelyCards);
}

function resolveGuess(guess) {
  const validPhase = state.phase === "attacker-draw" || state.phase === "cpu-ready";
  if (!validPhase || state.drawnCards.length < 2) {
    return;
  }

  const attackerWon = guess === state.hiddenCard;
  const winnerIndex = attackerWon ? state.attackerIndex : state.defenderIndex;
  players[winnerIndex].score += 1;

  const earnedBonus = !attackerWon && state.hiddenCard === CARD.JACK;
  if (earnedBonus) {
    state.bonusPlayerIndex = state.defenderIndex;
  }

  state.result = { guess, attackerWon, winnerIndex, earnedBonus };
  state.phase = "result";
  render();
}

function renderResult() {
  const { guess, attackerWon, winnerIndex, earnedBonus } = state.result;
  const winner = players[winnerIndex].name;
  const humanWon = state.mode === "cpu" && winnerIndex === 0;

  setStatus(
    attackerWon ? "HIT" : "MISS",
    state.mode === "cpu"
      ? humanWon ? "YOU WIN" : "DEALER WINS"
      : `${winner}の勝ち`,
    `${players[state.attackerIndex].name}の予想は「${guess}」。伏せられていたカードは「${state.hiddenCard}」でした。`
  );

  const layout = document.createElement("div");
  layout.className = "result-layout";

  if (players[state.attackerIndex].isCpu) {
    const handBlock = document.createElement("div");
    handBlock.className = "result-hand";
    const handLabel = document.createElement("p");
    handLabel.className = "section-caption";
    handLabel.textContent = "CPU HAND";
    handBlock.append(handLabel, renderDrawnCards(false));
    layout.append(handBlock);
  }

  const reveal = document.createElement("div");
  reveal.className = "reveal-block";
  const label = document.createElement("p");
  label.className = "section-caption";
  label.textContent = "HIDDEN CARD";
  reveal.append(label, createCardElement(state.hiddenCard));
  layout.append(reveal);

  if (earnedBonus) {
    const note = document.createElement("p");
    note.className = "result-note";
    note.textContent =
      `J BONUS獲得：${players[state.defenderIndex].name}は次に攻めるゲームでJが1枚減ります`;
    layout.append(note);
  }

  layout.append(createButton("次のゲームへ", "primary-button", nextGame));
  elements.playArea.append(layout);
}

function nextGame() {
  [state.attackerIndex, state.defenderIndex] = [
    state.defenderIndex,
    state.attackerIndex
  ];
  state.gameNumber += 1;
  initializeGame();
}

function render() {
  updateHeader();
  elements.playArea.replaceChildren();

  switch (state.phase) {
    case "defender-select":
      renderDefenderSelect();
      break;
    case "handoff":
      renderHandoff();
      break;
    case "cpu-ready":
      renderCpuReady();
      break;
    case "attacker-draw":
      renderAttackerDraw();
      break;
    case "result":
      renderResult();
      break;
    default:
      throw new Error(`Unknown game phase: ${state.phase}`);
  }
}

elements.modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.mode !== state.mode) {
      resetMatch(button.dataset.mode);
    }
  });
});

initializeGame();
