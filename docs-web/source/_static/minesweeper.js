(function () {
    var boardNode = document.getElementById("minesweeper-board");
    if (!boardNode) {
        return;
    }

    document.documentElement.classList.add("minesweeper-page");

    var counterNode = document.getElementById("mine-counter");
    var timerNode = document.getElementById("mine-timer");
    var resetButton = document.getElementById("minesweeper-reset");
    var messageNode = document.getElementById("minesweeper-message");
    var shellNode = document.querySelector(".minesweeper-shell");
    var boardWrapNode = document.querySelector(".minesweeper-board-wrap");
    var levelButtons = Array.prototype.slice.call(document.querySelectorAll("[data-level]"));

    var levels = {
        beginner: { rows: 9, cols: 9, mines: 10 },
        intermediate: { rows: 16, cols: 16, mines: 40 },
        expert: { rows: 16, cols: 30, mines: 99 }
    };

    var colors = ["", "#1976d2", "#238b45", "#c62828", "#512da8", "#8d2f13", "#00838f", "#262626", "#777"];
    var level = "beginner";
    var config = levels[level];
    var cells = [];
    var firstClick = true;
    var gameOver = false;
    var flags = 0;
    var revealed = 0;
    var seconds = 0;
    var timerId = null;
    var suppressNextClick = false;

    function pad(value) {
        return String(Math.max(0, Math.min(999, value))).padStart(3, "0");
    }

    function indexOf(row, col) {
        return row * config.cols + col;
    }

    function neighbors(row, col) {
        var result = [];
        for (var dr = -1; dr <= 1; dr += 1) {
            for (var dc = -1; dc <= 1; dc += 1) {
                if (dr === 0 && dc === 0) {
                    continue;
                }
                var nextRow = row + dr;
                var nextCol = col + dc;
                if (nextRow >= 0 && nextRow < config.rows && nextCol >= 0 && nextCol < config.cols) {
                    result.push(indexOf(nextRow, nextCol));
                }
            }
        }
        return result;
    }

    function setMessage(text) {
        messageNode.textContent = text;
    }

    function updateCounters() {
        counterNode.textContent = pad(config.mines - flags);
        timerNode.textContent = pad(seconds);
    }

    function resizeBoardCells() {
        var containerWidth = boardWrapNode ? boardWrapNode.clientWidth - 18 : shellNode.clientWidth - 28;
        var availableWidth = Math.max(300, containerWidth);
        var size = Math.floor(availableWidth / config.cols);
        size = Math.max(18, Math.min(34, size));
        boardNode.style.setProperty("--mine-cell-size", size + "px");
    }

    function stopTimer() {
        if (timerId) {
            window.clearInterval(timerId);
            timerId = null;
        }
    }

    function startTimer() {
        if (timerId) {
            return;
        }
        timerId = window.setInterval(function () {
            seconds += 1;
            updateCounters();
        }, 1000);
    }

    function createCells() {
        cells = [];
        for (var row = 0; row < config.rows; row += 1) {
            for (var col = 0; col < config.cols; col += 1) {
                cells.push({
                    row: row,
                    col: col,
                    mine: false,
                    adjacent: 0,
                    revealed: false,
                    flagged: false,
                    button: null
                });
            }
        }
    }

    function placeMines(safeIndex) {
        var blocked = new Set(neighbors(cells[safeIndex].row, cells[safeIndex].col));
        blocked.add(safeIndex);
        var available = cells.map(function (_, index) {
            return index;
        }).filter(function (index) {
            return !blocked.has(index);
        });

        for (var placed = 0; placed < config.mines; placed += 1) {
            var pick = Math.floor(Math.random() * available.length);
            var mineIndex = available.splice(pick, 1)[0];
            cells[mineIndex].mine = true;
        }

        cells.forEach(function (cell) {
            cell.adjacent = neighbors(cell.row, cell.col).filter(function (nearIndex) {
                return cells[nearIndex].mine;
            }).length;
        });
    }

    function renderBoard() {
        boardNode.innerHTML = "";
        boardNode.style.gridTemplateColumns = "repeat(" + config.cols + ", var(--mine-cell-size))";
        boardNode.setAttribute("data-cols", config.cols);
        resizeBoardCells();

        cells.forEach(function (cell, index) {
            var button = document.createElement("button");
            button.className = "mine-cell";
            button.type = "button";
            button.setAttribute("aria-label", "Hidden cell");
            button.dataset.index = index;
            cell.button = button;
            boardNode.appendChild(button);
        });
    }

    function drawCell(index) {
        var cell = cells[index];
        var button = cell.button;
        button.className = "mine-cell";
        button.textContent = "";

        if (cell.revealed) {
            button.classList.add("is-open");
            if (cell.mine) {
                button.textContent = "*";
                button.classList.add("is-mine");
                button.setAttribute("aria-label", "Mine");
            } else if (cell.adjacent > 0) {
                button.textContent = cell.adjacent;
                button.style.color = colors[cell.adjacent];
                button.setAttribute("aria-label", cell.adjacent + " nearby mines");
            } else {
                button.setAttribute("aria-label", "Empty cell");
            }
            return;
        }

        button.disabled = false;
        button.style.color = "";
        if (cell.flagged) {
            button.textContent = "F";
            button.classList.add("is-flagged");
            button.setAttribute("aria-label", "Flagged cell");
        } else {
            button.setAttribute("aria-label", "Hidden cell");
        }
    }

    function reveal(index) {
        var cell = cells[index];
        if (cell.revealed || cell.flagged || gameOver) {
            return;
        }

        cell.revealed = true;
        revealed += 1;
        drawCell(index);

        if (cell.adjacent === 0 && !cell.mine) {
            neighbors(cell.row, cell.col).forEach(reveal);
        }
    }

    function lose(hitIndex) {
        gameOver = true;
        stopTimer();
        resetButton.textContent = ":(";
        cells.forEach(function (cell, index) {
            if (cell.mine) {
                cell.revealed = true;
                drawCell(index);
            }
        });
        cells[hitIndex].button.classList.add("is-hit");
        setMessage("Game over. Press the face button to restart.");
    }

    function win() {
        gameOver = true;
        stopTimer();
        resetButton.textContent = ":D";
        cells.forEach(function (cell, index) {
            if (cell.mine && !cell.flagged) {
                cell.flagged = true;
                flags += 1;
                drawCell(index);
            }
        });
        updateCounters();
        setMessage("You cleared the board.");
    }

    function checkWin() {
        if (!gameOver && revealed === cells.length - config.mines) {
            win();
        }
    }

    function openCell(index) {
        if (gameOver) {
            return;
        }
        var cell = cells[index];
        if (cell.flagged || cell.revealed) {
            return;
        }
        if (firstClick) {
            placeMines(index);
            firstClick = false;
            startTimer();
        }
        if (cell.mine) {
            cell.revealed = true;
            drawCell(index);
            lose(index);
            return;
        }
        reveal(index);
        checkWin();
    }

    function toggleFlag(index) {
        var cell = cells[index];
        if (gameOver || cell.revealed) {
            return;
        }
        cell.flagged = !cell.flagged;
        flags += cell.flagged ? 1 : -1;
        drawCell(index);
        updateCounters();
    }

    function chordCell(index) {
        var cell = cells[index];
        if (!cell.revealed || cell.adjacent === 0 || gameOver) {
            return;
        }
        var near = neighbors(cell.row, cell.col);
        var flaggedNear = near.filter(function (nearIndex) {
            return cells[nearIndex].flagged;
        }).length;
        if (flaggedNear === cell.adjacent) {
            setMessage("Opening all unflagged neighboring cells.");
            near.forEach(openCell);
        } else {
            setMessage("Flag count does not match this number yet.");
        }
    }

    function reset(nextLevel) {
        level = nextLevel || level;
        config = levels[level];
        firstClick = true;
        gameOver = false;
        flags = 0;
        revealed = 0;
        seconds = 0;
        stopTimer();
        resetButton.textContent = ":)";
        setMessage("Left click to reveal. Right click to place a flag. Press both mouse buttons on a number to open safe neighbors.");
        createCells();
        renderBoard();
        updateCounters();
        levelButtons.forEach(function (button) {
            button.classList.toggle("is-active", button.dataset.level === level);
        });
    }

    boardNode.addEventListener("mousedown", function (event) {
        var button = event.target.closest(".mine-cell");
        if (!button) {
            return;
        }
        if ((event.buttons & 1) && (event.buttons & 2)) {
            event.preventDefault();
            suppressNextClick = true;
            chordCell(Number(button.dataset.index));
        }
    });

    boardNode.addEventListener("click", function (event) {
        var button = event.target.closest(".mine-cell");
        if (!button) {
            return;
        }
        if (suppressNextClick) {
            suppressNextClick = false;
            return;
        }
        var index = Number(button.dataset.index);
        if (!cells[index].revealed) {
            openCell(index);
        }
    });

    boardNode.addEventListener("contextmenu", function (event) {
        var button = event.target.closest(".mine-cell");
        if (!button) {
            return;
        }
        event.preventDefault();
        toggleFlag(Number(button.dataset.index));
    });

    resetButton.addEventListener("click", function () {
        reset();
    });

    levelButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            reset(button.dataset.level);
        });
    });

    window.addEventListener("resize", resizeBoardCells);

    reset("beginner");
})();
