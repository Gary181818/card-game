// -----------------------------
// script.js（純單人版）
// -----------------------------

// 308 牌設定
const TOTAL_ROWS = 11;
const TOTAL_COLS = 14;
const TOTAL_CARDS = TOTAL_ROWS * TOTAL_COLS; // 154

// DOM
const gameScreen = document.getElementById("game-screen");

const hintCountInput = document.getElementById("hint-count");

const timerSpan = document.getElementById("timer");
const hintBtn = document.getElementById("hint-btn");
const hintsLeftSpan = document.getElementById("hints-left");

const grid = document.getElementById("grid");
const startBtn = document.getElementById("start-btn");
const scoreBoard = document.getElementById("score")


// 遊戲變數
let cardPool = [];
let cardElements = [];

let initialPeekSeconds = 15;
let hintRemaining = 10;

let lockBoard = true;
let score = 0;
let step = 0; //答題階段

let countdownTimer = null;
let gameStarted = false;   // 是否已開始
let gameFinished = false;  // 是否已結束

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

// 產生 154 張字卡
function buildCardPool() {
  let base = rawText.split("");
  let base2 = rawText2.split("");
  let pool = [];

  base.forEach(ch => {
    for (let i = 0; i < 4; i++) {
      pool.push(ch);
    }
  }); 
  base2.forEach(ch => pool.push(ch)); 
  console.log(pool);

  pool = pool.slice(0, TOTAL_CARDS);
  shuffle(pool);

  return pool;
}

// 建立 DOM 卡牌
function buildBoard() {
  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `repeat(${TOTAL_COLS}, 1fr)`;
  
  let num=1;

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
    front.textContent = `${ch}\n${num}`;

    const back = document.createElement("div");
    back.className = "card-face card-back";
    back.textContent = `${num}`; 

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);

    card.addEventListener("click", () => onCardClick(card));

    grid.appendChild(card);
    cardElements.push(card);
    num++;
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

  card.classList.add("flip");
  // 先檢查順序（第一張也會檢查）
  if (!checkSequence(card)) {
    // 順序不對 → 翻開給玩家看一下 → 蓋回去
    setTimeout(() => {
      card.classList.remove("flip");
      lockBoard = false;
    }, 800);
    return; // 結束，不進入配對流程
  }

  card.classList.add("matched");
  score++;
  step++;
  lockBoard = false;

  scoreBoard.textContent = score;

  // 順序正確，進入原本配對流程
  if(score == TOTAL_CARDS){
    setTimeout(() => alert("恭喜！全部配對完成！"), 300);
  }
}

function checkSequence(card) {
  lockBoard = true;
  const match = card.dataset.char === answer.charAt(step)
  return match;
}


// 使用提示：全翻 30 秒
function useHint() {
  if (hintRemaining <= 0) {
    alert("提示次數已用完！");
    return;
  }
  hintRemaining--;
  hintBtn.innerHTML = `再看一次（剩餘 <span id="hints-left">${hintRemaining}</span> 次）`;

  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  previewAll(15);
}

function startGame() {
  gameStarted = true;
  gameFinished = false;
  hintBtn.innerHTML = `再看一次（剩餘 <span id="hints-left">${hintRemaining}</span> 次）`;

  lockBoard = true;
  previewAll(initialPeekSeconds);
}

// 啟動遊戲

hintBtn.addEventListener("click", () => {
  if (!gameStarted) {
    startGame();          // 第一次按：開始遊戲
  } else if (gameFinished) {
    resetGame();          // 結束後：重新開始
  } else {
    useHint();            // 遊戲中：使用提示
  }
});

gameScreen.classList.remove("hidden");

if (document.documentElement.requestFullscreen) {
  document.documentElement.requestFullscreen();
} else if (document.documentElement.webkitRequestFullscreen) { /* Safari */
  document.documentElement.webkitRequestFullscreen();
} else if (document.documentElement.msRequestFullscreen) { /* IE11 */
  document.documentElement.msRequestFullscreen();
}

cardPool = buildCardPool();
buildBoard();

matchedCount = 0;
firstCard = null;
secondCard = null;
lockBoard = true;