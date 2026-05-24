(function () {
    var canvas = document.getElementById("tetris-canvas");
    if (!canvas) {
        return;
    }

    document.documentElement.classList.add("tetris-page");

    var context = canvas.getContext("2d");
    var holdContext = document.getElementById("tetris-hold").getContext("2d");
    var nextContext = document.getElementById("tetris-next").getContext("2d");
    var scoreNode = document.getElementById("tetris-score");
    var bestNode = document.getElementById("tetris-best");
    var linesNode = document.getElementById("tetris-lines");
    var levelNode = document.getElementById("tetris-level");
    var messageNode = document.getElementById("tetris-message");
    var overlayNode = document.getElementById("tetris-overlay");
    var overlayTitleNode = document.getElementById("tetris-overlay-title");
    var overlayMessageNode = document.getElementById("tetris-overlay-message");
    var startButton = document.getElementById("tetris-start");
    var newButton = document.getElementById("tetris-new");
    var pauseButton = document.getElementById("tetris-pause");
    var touchButtons = document.querySelectorAll("[data-tetris-control]");

    var COLUMNS = 10;
    var ROWS = 22;
    var HIDDEN_ROWS = 2;
    var CELL = 30;
    var LOCK_DELAY = 500;
    var colors = {
        I: "#25c6da",
        O: "#f6c441",
        T: "#a667da",
        S: "#45bd72",
        Z: "#e75662",
        J: "#398ce7",
        L: "#f2953b"
    };
    var shapes = {
        I: [
            [[0, 1], [1, 1], [2, 1], [3, 1]],
            [[2, 0], [2, 1], [2, 2], [2, 3]],
            [[0, 2], [1, 2], [2, 2], [3, 2]],
            [[1, 0], [1, 1], [1, 2], [1, 3]]
        ],
        O: [
            [[1, 0], [2, 0], [1, 1], [2, 1]],
            [[1, 0], [2, 0], [1, 1], [2, 1]],
            [[1, 0], [2, 0], [1, 1], [2, 1]],
            [[1, 0], [2, 0], [1, 1], [2, 1]]
        ],
        T: [
            [[1, 0], [0, 1], [1, 1], [2, 1]],
            [[1, 0], [1, 1], [2, 1], [1, 2]],
            [[0, 1], [1, 1], [2, 1], [1, 2]],
            [[1, 0], [0, 1], [1, 1], [1, 2]]
        ],
        S: [
            [[1, 0], [2, 0], [0, 1], [1, 1]],
            [[1, 0], [1, 1], [2, 1], [2, 2]],
            [[1, 1], [2, 1], [0, 2], [1, 2]],
            [[0, 0], [0, 1], [1, 1], [1, 2]]
        ],
        Z: [
            [[0, 0], [1, 0], [1, 1], [2, 1]],
            [[2, 0], [1, 1], [2, 1], [1, 2]],
            [[0, 1], [1, 1], [1, 2], [2, 2]],
            [[1, 0], [0, 1], [1, 1], [0, 2]]
        ],
        J: [
            [[0, 0], [0, 1], [1, 1], [2, 1]],
            [[1, 0], [2, 0], [1, 1], [1, 2]],
            [[0, 1], [1, 1], [2, 1], [2, 2]],
            [[1, 0], [1, 1], [0, 2], [1, 2]]
        ],
        L: [
            [[2, 0], [0, 1], [1, 1], [2, 1]],
            [[1, 0], [1, 1], [1, 2], [2, 2]],
            [[0, 1], [1, 1], [2, 1], [0, 2]],
            [[0, 0], [1, 0], [1, 1], [1, 2]]
        ]
    };
    var normalKicks = {
        "0>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        "1>0": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
        "1>2": [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
        "2>1": [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
        "2>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
        "3>2": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        "3>0": [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
        "0>3": [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]]
    };
    var iKicks = {
        "0>1": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
        "1>0": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
        "1>2": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
        "2>1": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
        "2>3": [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
        "3>2": [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
        "3>0": [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
        "0>3": [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]]
    };

    var board;
    var queue;
    var held;
    var holdAvailable;
    var active;
    var score;
    var best = loadBest();
    var lines;
    var level;
    var combo;
    var backToBack;
    var running;
    var paused;
    var ended;
    var animationId;
    var lastFrame;
    var fallClock;
    var lockClock;
    var lockResets;
    var lastAction;

    function loadBest() {
        try {
            return Number(window.localStorage.getItem("tetris-best") || 0);
        } catch (error) {
            return 0;
        }
    }

    function saveBest() {
        try {
            window.localStorage.setItem("tetris-best", String(best));
        } catch (error) {
            return;
        }
    }

    function emptyBoard() {
        return Array.from({ length: ROWS }, function () {
            return Array(COLUMNS).fill(null);
        });
    }

    function shuffle(values) {
        for (var index = values.length - 1; index > 0; index -= 1) {
            var randomIndex = Math.floor(Math.random() * (index + 1));
            var swap = values[index];
            values[index] = values[randomIndex];
            values[randomIndex] = swap;
        }
        return values;
    }

    function supplyQueue() {
        while (queue.length < 6) {
            queue = queue.concat(shuffle(["I", "O", "T", "S", "Z", "J", "L"]));
        }
    }

    function createPiece(type) {
        return { type: type, rotation: 0, x: 3, y: 0 };
    }

    function cells(piece, rotation, dx, dy) {
        var state = rotation === undefined ? piece.rotation : rotation;
        return shapes[piece.type][state].map(function (cell) {
            return {
                x: piece.x + cell[0] + (dx || 0),
                y: piece.y + cell[1] + (dy || 0)
            };
        });
    }

    function collides(piece, rotation, dx, dy) {
        return cells(piece, rotation, dx, dy).some(function (cell) {
            return cell.x < 0 || cell.x >= COLUMNS || cell.y >= ROWS ||
                (cell.y >= 0 && board[cell.y][cell.x]);
        });
    }

    function grounded() {
        return active && collides(active, active.rotation, 0, 1);
    }

    function gravityDelay() {
        return Math.max(55, 1000 * Math.pow(0.82, level - 1));
    }

    function updateStats() {
        if (score > best) {
            best = score;
            saveBest();
        }
        scoreNode.textContent = String(score);
        bestNode.textContent = String(best);
        linesNode.textContent = String(lines);
        levelNode.textContent = String(level);
    }

    function setMessage(message) {
        messageNode.textContent = message;
    }

    function setOverlay(title, message, buttonText, visible) {
        overlayTitleNode.textContent = title;
        overlayMessageNode.textContent = message;
        startButton.textContent = buttonText;
        overlayNode.classList.toggle("is-hidden", !visible);
    }

    function spawnNext() {
        supplyQueue();
        active = createPiece(queue.shift());
        supplyQueue();
        holdAvailable = true;
        fallClock = 0;
        lockClock = 0;
        lockResets = 0;
        lastAction = "";
        if (collides(active)) {
            finishGame();
        }
    }

    function resetGame() {
        board = emptyBoard();
        queue = [];
        held = null;
        active = null;
        score = 0;
        lines = 0;
        level = 1;
        combo = -1;
        backToBack = false;
        running = false;
        paused = false;
        ended = false;
        fallClock = 0;
        lockClock = 0;
        lockResets = 0;
        lastAction = "";
        supplyQueue();
        spawnNext();
        pauseButton.disabled = true;
        pauseButton.textContent = "Pause";
        updateStats();
        setMessage("Arrow keys move. Up or X rotates, Z rotates back, Space drops, C holds, and P pauses.");
        setOverlay("Ready to stack?", "Move and rotate falling blocks to complete lines.", "Start", true);
        render();
    }

    function startGame() {
        if (ended) {
            resetGame();
        }
        if (!running) {
            running = true;
            paused = false;
            pauseButton.disabled = false;
            pauseButton.textContent = "Pause";
            setOverlay("", "", "", false);
            setMessage("Clear lines quickly. Use Hold to save a useful piece for later.");
            lastFrame = performance.now();
            requestFrame();
        }
    }

    function togglePause() {
        if (!running || ended) {
            return;
        }
        paused = !paused;
        pauseButton.textContent = paused ? "Resume" : "Pause";
        if (paused) {
            cancelFrame();
            setOverlay("Paused", "The stack is waiting for you.", "Resume", true);
        } else {
            setOverlay("", "", "", false);
            lastFrame = performance.now();
            requestFrame();
        }
    }

    function finishGame() {
        running = false;
        ended = true;
        pauseButton.disabled = true;
        cancelFrame();
        setMessage("Game over. Build another stack and try for a new best score.");
        setOverlay("Game over", "Final score: " + score, "Play Again", true);
        updateStats();
        render();
    }

    function resetLockForMove() {
        if (grounded() && lockResets < 15) {
            lockClock = 0;
            lockResets += 1;
        }
    }

    function shiftPiece(dx, dy, manualSoftDrop) {
        if (!active || collides(active, active.rotation, dx, dy)) {
            return false;
        }
        active.x += dx;
        active.y += dy;
        lastAction = "move";
        if (manualSoftDrop && dy > 0) {
            score += 1;
            updateStats();
        }
        resetLockForMove();
        render();
        return true;
    }

    function rotate(direction) {
        if (!active || active.type === "O") {
            return false;
        }
        var from = active.rotation;
        var to = (from + direction + 4) % 4;
        var table = active.type === "I" ? iKicks : normalKicks;
        var kicks = table[from + ">" + to] || [[0, 0]];
        for (var index = 0; index < kicks.length; index += 1) {
            if (!collides(active, to, kicks[index][0], kicks[index][1])) {
                active.rotation = to;
                active.x += kicks[index][0];
                active.y += kicks[index][1];
                lastAction = "rotate";
                resetLockForMove();
                render();
                return true;
            }
        }
        return false;
    }

    function hardDrop() {
        if (!active) {
            return;
        }
        var distance = 0;
        while (!collides(active, active.rotation, 0, 1)) {
            active.y += 1;
            distance += 1;
        }
        score += distance * 2;
        lastAction = "drop";
        lockPiece();
    }

    function holdPiece() {
        if (!active || !holdAvailable) {
            return;
        }
        var swapped = active.type;
        if (held) {
            active = createPiece(held);
        } else {
            spawnNext();
        }
        held = swapped;
        holdAvailable = false;
        fallClock = 0;
        lockClock = 0;
        lockResets = 0;
        lastAction = "hold";
        if (collides(active)) {
            finishGame();
        }
        render();
    }

    function isOccupied(x, y) {
        return x < 0 || x >= COLUMNS || y < 0 || y >= ROWS || Boolean(board[y][x]);
    }

    function isTSpin() {
        if (!active || active.type !== "T" || lastAction !== "rotate") {
            return false;
        }
        var centerX = active.x + 1;
        var centerY = active.y + 1;
        var corners = [
            [centerX - 1, centerY - 1],
            [centerX + 1, centerY - 1],
            [centerX - 1, centerY + 1],
            [centerX + 1, centerY + 1]
        ];
        return corners.filter(function (corner) {
            return isOccupied(corner[0], corner[1]);
        }).length >= 3;
    }

    function clearedRows() {
        var kept = board.filter(function (row) {
            return row.some(function (value) { return !value; });
        });
        var count = ROWS - kept.length;
        while (kept.length < ROWS) {
            kept.unshift(Array(COLUMNS).fill(null));
        }
        board = kept;
        return count;
    }

    function describeClear(count, tSpin, bonusBackToBack, comboValue) {
        var labels = ["", "Single", "Double", "Triple", "Tetris"];
        var label = tSpin ? "T-Spin " + (labels[count] || "") : labels[count];
        if (!count && tSpin) {
            label = "T-Spin";
        }
        if (bonusBackToBack) {
            label = "Back-to-Back " + label;
        }
        if (comboValue > 0 && count) {
            label += " | Combo x" + comboValue;
        }
        return label || "Piece locked";
    }

    function awardClear(count, tSpin) {
        var basic = tSpin ? [400, 800, 1200, 1600][count] : [0, 100, 300, 500, 800][count];
        var difficult = count === 4 || (tSpin && count > 0);
        var usesBackToBack = difficult && backToBack;
        if (usesBackToBack) {
            basic = Math.floor(basic * 1.5);
        }
        if (count > 0) {
            combo += 1;
            if (combo > 0) {
                basic += combo * 50;
            }
            lines += count;
            level = Math.floor(lines / 10) + 1;
        } else {
            combo = -1;
        }
        if (difficult) {
            backToBack = true;
        } else if (count > 0) {
            backToBack = false;
        }
        score += basic * level;
        setMessage(describeClear(count, tSpin, usesBackToBack, combo) + (count ? " cleared." : "."));
        updateStats();
    }

    function lockPiece() {
        if (!active) {
            return;
        }
        cells(active).forEach(function (cell) {
            if (cell.y >= 0 && cell.y < ROWS) {
                board[cell.y][cell.x] = active.type;
            }
        });
        var tSpin = isTSpin();
        var count = clearedRows();
        awardClear(count, tSpin);
        spawnNext();
        render();
    }

    function ghostDistance() {
        var distance = 0;
        while (!collides(active, active.rotation, 0, distance + 1)) {
            distance += 1;
        }
        return distance;
    }

    function requestFrame() {
        cancelFrame();
        animationId = window.requestAnimationFrame(frame);
    }

    function cancelFrame() {
        if (animationId) {
            window.cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    function frame(timestamp) {
        if (!running || paused || ended) {
            return;
        }
        var elapsed = Math.min(timestamp - lastFrame, 80);
        lastFrame = timestamp;
        fallClock += elapsed;
        if (grounded()) {
            lockClock += elapsed;
            if (lockClock >= LOCK_DELAY) {
                lockPiece();
            }
        } else {
            lockClock = 0;
        }
        if (fallClock >= gravityDelay() && !ended) {
            fallClock = 0;
            shiftPiece(0, 1, false);
        }
        render();
        animationId = window.requestAnimationFrame(frame);
    }

    function roundedRect(renderContext, x, y, width, height, radius) {
        renderContext.beginPath();
        renderContext.moveTo(x + radius, y);
        renderContext.lineTo(x + width - radius, y);
        renderContext.quadraticCurveTo(x + width, y, x + width, y + radius);
        renderContext.lineTo(x + width, y + height - radius);
        renderContext.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        renderContext.lineTo(x + radius, y + height);
        renderContext.quadraticCurveTo(x, y + height, x, y + height - radius);
        renderContext.lineTo(x, y + radius);
        renderContext.quadraticCurveTo(x, y, x + radius, y);
        renderContext.closePath();
    }

    function drawBlock(renderContext, x, y, size, type, opacity) {
        var color = colors[type];
        renderContext.save();
        renderContext.globalAlpha = opacity === undefined ? 1 : opacity;
        renderContext.fillStyle = color;
        roundedRect(renderContext, x + 1.5, y + 1.5, size - 3, size - 3, Math.max(3, size * 0.13));
        renderContext.fill();
        renderContext.fillStyle = "rgba(255,255,255,0.28)";
        roundedRect(renderContext, x + 4, y + 4, size - 8, Math.max(3, size * 0.16), 2);
        renderContext.fill();
        renderContext.strokeStyle = "rgba(12, 28, 46, 0.18)";
        renderContext.lineWidth = 1;
        roundedRect(renderContext, x + 1.5, y + 1.5, size - 3, size - 3, Math.max(3, size * 0.13));
        renderContext.stroke();
        renderContext.restore();
    }

    function drawBoard() {
        var background = context.createLinearGradient(0, 0, 0, canvas.height);
        background.addColorStop(0, "#13293d");
        background.addColorStop(1, "#081825");
        context.fillStyle = background;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = "rgba(133, 189, 217, 0.11)";
        context.lineWidth = 1;
        for (var x = 0; x <= COLUMNS; x += 1) {
            context.beginPath();
            context.moveTo(x * CELL + 0.5, 0);
            context.lineTo(x * CELL + 0.5, canvas.height);
            context.stroke();
        }
        for (var y = 0; y <= ROWS - HIDDEN_ROWS; y += 1) {
            context.beginPath();
            context.moveTo(0, y * CELL + 0.5);
            context.lineTo(canvas.width, y * CELL + 0.5);
            context.stroke();
        }
        for (var row = HIDDEN_ROWS; row < ROWS; row += 1) {
            for (var column = 0; column < COLUMNS; column += 1) {
                if (board[row][column]) {
                    drawBlock(context, column * CELL, (row - HIDDEN_ROWS) * CELL, CELL, board[row][column]);
                }
            }
        }
    }

    function drawActivePiece() {
        if (!active) {
            return;
        }
        var distance = ghostDistance();
        cells(active, active.rotation, 0, distance).forEach(function (cell) {
            if (cell.y >= HIDDEN_ROWS) {
                drawBlock(context, cell.x * CELL, (cell.y - HIDDEN_ROWS) * CELL, CELL, active.type, 0.22);
            }
        });
        cells(active).forEach(function (cell) {
            if (cell.y >= HIDDEN_ROWS) {
                drawBlock(context, cell.x * CELL, (cell.y - HIDDEN_ROWS) * CELL, CELL, active.type);
            }
        });
    }

    function drawPreview(renderContext, type, originY, size) {
        if (!type) {
            return;
        }
        var pieceCells = shapes[type][0];
        var minX = Math.min.apply(null, pieceCells.map(function (cell) { return cell[0]; }));
        var maxX = Math.max.apply(null, pieceCells.map(function (cell) { return cell[0]; }));
        var minY = Math.min.apply(null, pieceCells.map(function (cell) { return cell[1]; }));
        var maxY = Math.max.apply(null, pieceCells.map(function (cell) { return cell[1]; }));
        var width = (maxX - minX + 1) * size;
        var height = (maxY - minY + 1) * size;
        var offsetX = (renderContext.canvas.width - width) / 2 - minX * size;
        var offsetY = originY + (62 - height) / 2 - minY * size;
        pieceCells.forEach(function (cell) {
            drawBlock(renderContext, offsetX + cell[0] * size, offsetY + cell[1] * size, size, type);
        });
    }

    function drawSidePanels() {
        holdContext.clearRect(0, 0, holdContext.canvas.width, holdContext.canvas.height);
        nextContext.clearRect(0, 0, nextContext.canvas.width, nextContext.canvas.height);
        drawPreview(holdContext, held, 14, 23);
        queue.slice(0, 5).forEach(function (type, index) {
            drawPreview(nextContext, type, 4 + index * 65, 20);
        });
    }

    function render() {
        drawBoard();
        drawActivePiece();
        drawSidePanels();
    }

    function act(action) {
        if (!running && action !== "pause") {
            startGame();
        }
        if (!running || paused || ended) {
            return;
        }
        if (action === "left") {
            shiftPiece(-1, 0, false);
        } else if (action === "right") {
            shiftPiece(1, 0, false);
        } else if (action === "down") {
            shiftPiece(0, 1, true);
        } else if (action === "rotate-right") {
            rotate(1);
        } else if (action === "rotate-left") {
            rotate(-1);
        } else if (action === "drop") {
            hardDrop();
        } else if (action === "hold") {
            holdPiece();
        } else if (action === "pause") {
            togglePause();
        }
    }

    document.addEventListener("keydown", function (event) {
        var controls = {
            ArrowLeft: "left",
            ArrowRight: "right",
            ArrowDown: "down",
            ArrowUp: "rotate-right",
            KeyX: "rotate-right",
            KeyZ: "rotate-left",
            Space: "drop",
            KeyC: "hold",
            ShiftLeft: "hold",
            KeyP: "pause",
            Escape: "pause"
        };
        var action = controls[event.code];
        if (action) {
            event.preventDefault();
            act(action);
        }
    });

    touchButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            act(button.dataset.tetrisControl);
        });
    });

    startButton.addEventListener("click", function () {
        if (paused) {
            togglePause();
        } else {
            startGame();
        }
    });
    newButton.addEventListener("click", function () {
        cancelFrame();
        resetGame();
        startGame();
    });
    pauseButton.addEventListener("click", togglePause);

    resetGame();
})();
