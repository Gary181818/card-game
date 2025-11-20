// -----------------------------
// script.js（純單人版）
// -----------------------------

// 308 牌設定
const TOTAL_ROWS = 14;
const TOTAL_COLS = 22;
const TOTAL_CARDS = TOTAL_ROWS * TOTAL_COLS; // 308

// DOM
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");

const initialTimeInput = document.getElementById("initial-time");
const hintCountInput = document.getElementById("hint-count");

const timerSpan = document.getElementById("timer");
const hintBtn = document.getElementById("hint-btn");
const hintsLeftSpan = document.getElementById("hints-left");

const grid = document.getElementById("grid");
const startBtn = document.getElementById("start-btn");



// 遊戲變數
let cardPool = [];
let cardElements = [];

let initialPeekSeconds = 10;
let hintRemaining = 5;

let lockBoard = true;
let firstCard = null;
let secondCard = null;
let matchedCount = 0;
let step = 0; //答題階段

let countdownTimer = null;

// 原文字庫（可換）
let rawText = `
梨樹開花滿樹白滿園梨花白如雪片片雪花飛滿地今日滿園成青色
`.replace(/[^\u4e00-\u9fff]/g, "");
let rawText2 = `
森羅萬象終歸壞唯有真空才不滅青色白色皆對待不落兩邊非生滅青色白色皆真性春風滿園露禪悅
`.replace(/[^\u4e00-\u9fff]/g, "");

// 原文順序
let answer = `梨樹開花滿樹白滿園梨花白如雪片片雪花飛滿地今日滿園成青色梨樹開花滿樹白滿園梨花白如雪片片雪花飛滿地今日滿園成青色森羅萬象終歸壞唯有真空才不滅梨樹開花滿樹白滿園梨花白如雪片片雪花飛滿地今日滿園成青色青色白色皆對待不落兩邊非生滅梨樹開花滿樹白滿園梨花白如雪片片雪花飛滿地今日滿園成青色青色白色皆真性春風滿園露禪悅`

// Fisher-Yates 洗牌
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 產生 308 張字卡
function buildCardPool() {
  let base = rawText.split("");
  let base2 = rawText2.split("");
  let pool = [];

  base.forEach(ch => {
    for (let i = 0; i < 8; i++) {
      pool.push(ch);
    }
  }); // 每字八份
  base2.forEach(ch => pool.push(ch, ch)); // 每字兩份
  console.log(pool);

  // 若不足 308 → 倍增補足
  while (pool.length < TOTAL_CARDS) {
    pool = pool.concat(pool);
  }

  pool = pool.slice(0, TOTAL_CARDS);
  shuffle(pool);

  return pool;
}

// 建立 DOM 卡牌
function buildBoard() {
  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `repeat(${TOTAL_COLS}, 1fr)`;
  
  let row=1, col=1;

  cardElements = [];

  cardPool.forEach((ch, idx) => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.char = ch;
    card.dataset.index = idx;

    const inner = document.createElement("div");
    inner.className = "card-inner";

    const front = document.createElement("div");
    front.className = "card-face card-front";
    front.textContent = ch;

    const back = document.createElement("div");
    back.className = "card-face card-back";
    back.textContent = `${row}-${col}`; 

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    card.addEventListener("click", () => onCardClick(card));

    grid.appendChild(card);
    cardElements.push(card);
    if(col == TOTAL_COLS){
        row++;
        col=0;
    }
    col++;
  });
}

// 開局：初始展示 N 秒
function previewAll(seconds) {
  lockBoard = true;

  // 全翻
  cardElements.forEach(c => {
    if (!c.classList.contains("matched")) c.classList.add("flip");
  });

  let remain = seconds;
  timerSpan.textContent = remain;

  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    remain--;
    timerSpan.textContent = remain;

    if (remain <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;

      // 全部蓋回（未配對）
      cardElements.forEach(c => {
        if (!c.classList.contains("matched")) c.classList.remove("flip");
      });

      lockBoard = false;
      timerSpan.textContent = 0;
    }
  }, 1000);
}

function onCardClick(card) {
  if (lockBoard) return;
  if (card.classList.contains("flip")) return;
  if (card.classList.contains("matched")) return;

  if (!firstCard) {
    firstCard = card;
    return;
  }

  // 先檢查順序（第一張也會檢查）
  if (!checkSequence()) {
    // 順序不對 → 翻開給玩家看一下 → 蓋回去
    card.classList.add("flip");

    setTimeout(() => {
      firstCard = null;
      card.classList.remove("flip");
      lockBoard = false;
    }, 800);

    return; // 結束，不進入配對流程
  }

  // 順序正確，進入原本配對流程
  card.classList.add("flip");

  // 避免點同一張
  if (firstCard === card) return;

  secondCard = card;
  lockBoard = true;

  checkMatch();
}

function checkSequence() {
  const match = firstCard.dataset.char === answer.charAt(step)
  return match;
}

function checkMatch() {
  const match = firstCard.dataset.char === secondCard.dataset.char;

  if (match) {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");

    matchedCount += 2;
    hintRemaining += 1;
    hintsLeftSpan.textContent = hintRemaining;

    firstCard = null;
    secondCard = null;
    lockBoard = false;

    step += 1;

    if (matchedCount >= TOTAL_CARDS) {
      setTimeout(() => alert("恭喜！全部配對完成！"), 300);
    }
  } else {
    setTimeout(() => {
      firstCard.classList.remove("flip");
      secondCard.classList.remove("flip");
      firstCard = null;
      secondCard = null;
      lockBoard = false;
    }, 800);
  }
}

// 使用提示：全翻 30 秒
function useHint() {
  if (hintRemaining <= 0) {
    alert("提示次數已用完！");
    return;
  }
  hintRemaining--;
  hintsLeftSpan.textContent = hintRemaining;

  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  previewAll(30);
}

// 啟動遊戲
startBtn.addEventListener("click", () => {
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");

   if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  } else if (document.documentElement.webkitRequestFullscreen) { /* Safari */
    document.documentElement.webkitRequestFullscreen();
  } else if (document.documentElement.msRequestFullscreen) { /* IE11 */
    document.documentElement.msRequestFullscreen();
  }

  initialPeekSeconds = parseInt(initialTimeInput.value) || 5;
  hintRemaining = parseInt(hintCountInput.value) || 0;
  hintsLeftSpan.textContent = hintRemaining;

  cardPool = buildCardPool();
  buildBoard();

  matchedCount = 0;
  firstCard = null;
  secondCard = null;
  lockBoard = true;

  previewAll(initialPeekSeconds);
});

hintBtn.addEventListener("click", useHint);