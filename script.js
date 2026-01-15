// -----------------------------
// script.js（純單人完整版）
// -----------------------------

/* ========= 遊戲設定 ========= */
const TOTAL_ROWS = 11;
const TOTAL_COLS = 14;
const TOTAL_CARDS = TOTAL_ROWS * TOTAL_COLS; // 154
const MAX_HINTS = 14;

const NORMAL_TIME = 20 * 60; // 20 分鐘
const HINT_TIME = 10;        // 10 秒
const INITIAL_PREVIEW = 15;  // 開局偷看 15 秒

/* ========= DOM ========= */
const gameScreen = document.getElementById("game-screen");
const hintBtn = document.getElementById("hint-btn");
const grid = document.getElementById("grid");
const scoreBoard = document.getElementById("score");
const progress = document.getElementById("progress");
const hintBoard = document.getElementById("hint-board");
const image = document.getElementById("image");

/* ========= 遊戲狀態 ========= */
let cardPool = [];
let cardElements = [];

let lockBoard = true;
let score = 0;
let step = 0;
let hintRemaining = 10;

let gameStarted = false;
let gameFinished = false;

/* ========= Timer ========= */
let timerInterval = null;
let remainingSeconds = 20 * 60; // 20 分鐘
let initialPeekSeconds = 15; // 開局偷看 15 秒

/* ========= 題庫 ========= */
let rawText = `
梨樹開花滿樹白滿園梨花白如雪片片雪花飛滿地今日滿園成青色
`.replace(/[^\u4e00-\u9fff]/g, "");

let rawText2 = `
森羅萬象終歸壞唯有真空才不滅青色白色皆對待不落兩邊非生滅青色白色皆真性春風滿園露禪悅
`.replace(/[^\u4e00-\u9fff]/g, "");

let answer = `
梨樹開花滿樹白滿園梨花白如雪片片雪花飛滿地今日滿園成青色
梨樹開花滿樹白滿園梨花白如雪片片雪花飛滿地今日滿園成青色
森羅萬象終歸壞唯有真空才不滅
梨樹開花滿樹白滿園梨花白如雪片片雪花飛滿地今日滿園成青色
青色白色皆對待不落兩邊非生滅
梨樹開花滿樹白滿園梨花白如雪片片雪花飛滿地今日滿園成青色
青色白色皆真性春風滿園露禪悅
`.replace(/[^\u4e00-\u9fff]/g, "");

/* ========= Timer 函式 ========= */


function updateTimerDisplay(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;

    document.getElementById("timer-min").textContent =
        String(min).padStart(2, "0");
    document.getElementById("timer-ms").textContent =
        String(sec).padStart(2, "0");
}

function startMainTimer() {
    updateTimerDisplay(remainingSeconds);

    timerInterval = setInterval(() => {
        remainingSeconds--;

        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            updateTimerDisplay(0);
            onGameTimeEnd();
            return;
        }

        updateTimerDisplay(remainingSeconds);
    }, 1000);
}

function onGameTimeEnd() {
    alert("時間到，遊戲結束！");
    gameFinished = true;
    lockBoard = true;
}

/* ========= 工具 ========= */
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/* ========= 建立牌組 ========= */
function buildCardPool() {
    let pool = [];
    rawText.split("").forEach(ch => {
        for (let i = 0; i < 4; i++) pool.push(ch);
    });
    rawText2.split("").forEach(ch => pool.push(ch));
    pool = pool.slice(0, TOTAL_CARDS);
    return shuffle(pool);
}

/* ========= Hint Board ========= */
function initHintBoard() {
    hintBoard.innerHTML = "";
    for (let i = 0; i < MAX_HINTS; i++) {
        const cell = document.createElement("div");
        cell.className = "hint-cell";
        cell.textContent = answer[step + i] || "";
        hintBoard.appendChild(cell);
    }
}

function renewHintBoard() {
    if (step % MAX_HINTS === 0) {
        const cells = hintBoard.children;
        for (let i = 0; i < cells.length; i++) {
            cells[i].textContent = answer[step + i] || "";
        }
    }
}

/* ========= 建立卡牌 ========= */
function buildBoard() {
    grid.innerHTML = "";
    grid.style.gridTemplateColumns = `repeat(${TOTAL_COLS}, 1fr)`;

    cardElements = [];
    let num = 1;

    cardPool.forEach((ch, idx) => {
        const card = document.createElement("div");
        card.className = "card";
        card.dataset.char = ch;

        const inner = document.createElement("div");
        inner.className = "card-inner";

        const front = document.createElement("div");
        front.className = "card-face card-front";
        front.textContent = `${ch}\n${num}`;

        const back = document.createElement("div");
        back.className = "card-face card-back";
        back.textContent = num;

        inner.append(front, back);
        card.appendChild(inner);

        card.addEventListener("click", () => onCardClick(card));

        grid.appendChild(card);
        cardElements.push(card);
        num++;
    });
}

/* ========= 遊戲邏輯 ========= */
function previewAll(seconds) {
    lockBoard = true;
    cardElements.forEach(c => c.classList.add("flip"));

    setTimeout(() => {
        cardElements.forEach(c => {
            if (!c.classList.contains("matched")) c.classList.remove("flip");
        });
        lockBoard = false;
    }, seconds * 1000);
}

function playCorrectGif() {
    image.src = "./image/correct.gif?" + Date.now();
    setTimeout(() => image.src = "./image/idle.gif", 3000);
}

function checkSequence(card) {
    return card.dataset.char === answer[step];
}

function onCardClick(card) {
    if (lockBoard || card.classList.contains("matched")) return;

    lockBoard = true;
    card.classList.add("flip");

    if (!checkSequence(card)) {
        setTimeout(() => {
            card.classList.remove("flip");
            lockBoard = false;
        }, 600);
        return;
    }

    card.classList.add("matched");
    score++;
    step++;

    playCorrectGif();
    renewHintBoard();

    scoreBoard.textContent = score;
    progress.textContent = step;

    lockBoard = false;

    if (score === TOTAL_CARDS) {
        alert("🎉 恭喜全部完成！");
        gameFinished = true;
    }
}

/* ========= 提示 ========= */
function useHint() {
    if (hintRemaining <= 0) {
        alert("提示次數已用完！");
        return;
    }

    hintRemaining--;
    hintBtn.innerHTML =
        `再看一次（剩餘 ${hintRemaining} 次）`;

    previewAll(15); // 只翻牌，不碰 timer
}

/* ========= 開始遊戲 ========= */
function startGame() {
    gameStarted = true;
    gameFinished = false;

    startMainTimer();          // ⭐ 只在這裡開 timer
    previewAll(initialPeekSeconds);

    hintBtn.innerHTML =
        `再看一次（剩餘 ${hintRemaining} 次）`;
}

/* ========= 事件 ========= */
hintBtn.addEventListener("click", () => {
    if (!gameStarted) startGame();
    else if (!gameFinished) useHint();
});

/* ========= 初始化 ========= */
gameScreen.classList.remove("hidden");
cardPool = buildCardPool();
buildBoard();
initHintBoard();