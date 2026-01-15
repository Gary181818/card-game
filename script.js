// =============================
// GameConfig
// =============================
const GameConfig = {
    ROWS: 11,
    COLS: 14,
    TOTAL_CARDS: 154,
    MAX_HINTS: 14,

    NORMAL_TIME: 20 * 60,
    INITIAL_PREVIEW: 15,

    SCORE_BASE: 10,
    SCORE_COMBO: 2,
};

// =============================
// GameState
// =============================
const GameState = {
    started: false,
    finished: false,
    locked: true,

    step: 0,
    score: 0,
    bonus: 0,
    finalScore: 0,

    combo: 0,
    mistakes: 0,
    usedHints: 0,

    remainingSeconds: GameConfig.NORMAL_TIME,
};

// =============================
// DOM / UI
// =============================
const UI = {
    gameScreen: document.getElementById("game-screen"),
    grid: document.getElementById("grid"),
    score: document.getElementById("score"),
    progress: document.getElementById("progress"),
    hintBoard: document.getElementById("hint-board"),
    image: document.getElementById("image"),
    hintBtn: document.getElementById("hint-btn"),
    result: document.getElementById("result-screen"),

    timerMin: document.getElementById("timer-min"),
    timerSec: document.getElementById("timer-ms"),

    updateScore(value) {
        this.score.textContent = value;
    },

    updateProgress(value) {
        this.progress.textContent = value;
    },

    updateTimer(seconds) {
        this.timerMin.textContent = String(Math.floor(seconds / 60)).padStart(2, "0");
        this.timerSec.textContent = String(seconds % 60).padStart(2, "0");
    },

    showScorePopup(text, type) {
        const box = document.getElementById("info-box");
        const el = document.createElement("div");
        el.className = `score-popup ${type}`;
        el.textContent = text;
        box.appendChild(el);
        setTimeout(() => el.remove(), 1200);
    },

    playMonk(action) {
        this.image.src = `./image/${action}.gif?${Date.now()}`;
        setTimeout(() => this.image.src = "./image/idle.gif", 4000);
    }
};

// =============================
// Timer
// =============================
const Timer = {
    interval: null,

    start() {
        UI.updateTimer(GameState.remainingSeconds);
        this.interval = setInterval(() => {
            GameState.remainingSeconds--;
            UI.updateTimer(GameState.remainingSeconds);

            if (GameState.remainingSeconds <= 0) {
                this.stop();
                GameFlow.end();
            }
        }, 1000);
    },

    stop() {
        clearInterval(this.interval);
    }
};

// =============================
// Deck / Cards
// =============================
const Deck = {
    pool: [],
    cards: [],

    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    buildPool(raw1, raw2) {
        let pool = [];
        raw1.split("").forEach(ch => {
            for (let i = 0; i < 4; i++) pool.push(ch);
        });
        raw2.split("").forEach(ch => pool.push(ch));
        this.pool = this.shuffle(pool.slice(0, GameConfig.TOTAL_CARDS));
    },

    buildBoard(onClick) {
        UI.grid.innerHTML = "";
        UI.grid.style.gridTemplateColumns = `repeat(${GameConfig.COLS}, 1fr)`;

        this.cards = [];
        let num = 1;

        this.pool.forEach(ch => {
            const card = document.createElement("div");
            card.className = "card";
            card.dataset.char = ch;

            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-face card-front">${ch}<br>${num}</div>
                    <div class="card-face card-back">${num}</div>
                </div>
            `;

            card.addEventListener("click", () => onClick(card));
            UI.grid.appendChild(card);
            this.cards.push(card);
            num++;
        });
    },

    preview(seconds) {
        GameState.locked = true;
        this.cards.forEach(c => c.classList.add("flip"));

        setTimeout(() => {
            this.cards.forEach(c => {
                if (!c.classList.contains("matched")) c.classList.remove("flip");
            });
            GameState.locked = false;
        }, seconds * 1000);
    }
};

// =============================
// HintSystem
// =============================
const HintSystem = {
    init(answer) {
        UI.hintBoard.innerHTML = "";
        for (let i = 0; i < GameConfig.MAX_HINTS; i++) {
            const cell = document.createElement("div");
            cell.className = "hint-cell";
            cell.textContent = answer[i] || "";
            UI.hintBoard.appendChild(cell);
        }
    },

    update(answer) {
        [...UI.hintBoard.children].forEach((cell, i) => {
            cell.textContent = answer[GameState.step + i] || "";
            cell.classList.toggle("current", i === GameState.step % GameConfig.MAX_HINTS);
        });
    }
};

// =============================
// Scoring
// =============================
const Scoring = {
    correct() {
        GameState.combo++;
        const gain = GameConfig.SCORE_BASE + GameState.combo * GameConfig.SCORE_COMBO;
        GameState.score += gain;
        UI.showScorePopup(`+${gain}`, "plus");
        UI.updateScore(GameState.score);
    },

    mistake() {
        GameState.combo = 0;
        GameState.mistakes++;
        GameState.score = Math.max(0, GameState.score - 5);
        UI.showScorePopup("-5", "minus");
        UI.updateScore(GameState.score);
    },

    calculateBonus() {
        let bonus = 0;
        if (GameState.mistakes === 0) bonus += 100;
        bonus += Math.floor(GameState.remainingSeconds / 10) * 2;
        bonus -= GameState.usedHints * 10;
        return Math.max(0, bonus);
    }
};

// =============================
// GameFlow
// =============================
const GameFlow = {
    answer: "",

    start() {
        GameState.started = true;
        Timer.start();
        Deck.preview(GameConfig.INITIAL_PREVIEW);
        HintSystem.update(this.answer);
        UI.hintBtn.textContent = "再看一次";
    },

    end() {
        if (GameState.finished) return;
        GameState.finished = true;

        Timer.stop();
        GameState.bonus = Scoring.calculateBonus();
        GameState.finalScore = GameState.score + GameState.bonus;

        setTimeout(() => this.showResult(), 800);
    },

    showResult() {
        UI.result.classList.remove("hidden");
        this.animate("base-score", GameState.score, 600);
        setTimeout(() => this.animate("bonus-score", GameState.bonus, 600), 700);
        setTimeout(() => this.animate("final-score", GameState.finalScore, 800), 1400);
    },

    animate(id, value, duration) {
        const el = document.getElementById(id);
        let start = 0;
        let startTime = null;

        function step(ts) {
            if (!startTime) startTime = ts;
            const p = Math.min((ts - startTime) / duration, 1);
            el.textContent = Math.floor(start + value * p);
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }
};

// =============================
// Initialization
// =============================
(function init() {
    UI.gameScreen.classList.remove("hidden");
    UI.result.classList.add("hidden");

    const raw1 = `梨樹開花滿樹白滿園梨花白如雪片片雪花飛滿地今日滿園成青色`.replace(/[^\u4e00-\u9fff]/g, "");
    const raw2 = `森羅萬象終歸壞唯有真空才不滅青色白色皆對待不落兩邊非生滅青色白色皆真性春風滿園露禪悅`.replace(/[^\u4e00-\u9fff]/g, "");
    GameFlow.answer = (raw1 + raw1 + raw2).replace(/[^\u4e00-\u9fff]/g, "");

    Deck.buildPool(raw1, raw2);
    Deck.buildBoard(card => {
        if (GameState.locked || card.classList.contains("matched")) return;

        card.classList.add("flip");
        GameState.locked = true;

        if (card.dataset.char !== GameFlow.answer[GameState.step]) {
            setTimeout(() => {
                card.classList.remove("flip");
                GameState.locked = false;
            }, 600);
            Scoring.mistake();
            return;
        }

        card.classList.add("matched");
        GameState.step++;
        Scoring.correct();
        UI.updateProgress(GameState.step);
        HintSystem.update(GameFlow.answer);
        UI.playMonk("correct");

        GameState.locked = false;
        if (GameState.step >= GameFlow.answer.length) GameFlow.end();
    });

    HintSystem.init(GameFlow.answer);

    UI.hintBtn.addEventListener("click", () => {
        if (!GameState.started) GameFlow.start();
        else {
            GameState.usedHints++;
            Deck.preview(15);
        }
    });
})();