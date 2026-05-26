(function () {
    var boardNode = document.getElementById("game2048-board");
    if (!boardNode) {
        return;
    }

    document.documentElement.classList.add("game2048-page");

    var size = 4;
    var moveDuration = 190;
    var shellNode = document.getElementById("game2048-shell");
    var scoreNode = document.getElementById("game2048-score");
    var bestNode = document.getElementById("game2048-best");
    var bestLabelNode = document.getElementById("game2048-best-label");
    var goalNode = document.getElementById("game2048-goal");
    var overlayNode = document.getElementById("game2048-overlay");
    var overlayTitleNode = document.getElementById("game2048-overlay-title");
    var keepGoingButton = document.getElementById("game2048-keep-going");
    var undoButton = document.getElementById("game2048-undo");
    var newButton = document.getElementById("game2048-new");
    var retryButton = document.getElementById("game2048-try-again");
    var messageNode = document.getElementById("game2048-message");
    var setupNode = document.getElementById("game2048-setup");
    var setupTitleNode = document.getElementById("game2048-setup-title");
    var startButton = document.getElementById("game2048-start");
    var cancelButton = document.getElementById("game2048-cancel");
    var unlockNoteNode = document.getElementById("game2048-unlock-note");
    var startButtons = {
        0: document.getElementById("game2048-start-classic"),
        2048: document.getElementById("game2048-start-2048"),
        4096: document.getElementById("game2048-start-4096"),
        8192: document.getElementById("game2048-start-8192")
    };
    var modeButtons = {
        none: document.getElementById("game2048-mode-none"),
        one: document.getElementById("game2048-mode-one"),
        unlimited: document.getElementById("game2048-mode-unlimited")
    };
    var startValues = [0, 2048, 4096, 8192];
    var tileLayerNode = null;
    var grid = [];
    var score = 0;
    var startTile = 0;
    var targetTile = 2048;
    var best = loadBest(startTile);
    var unlockedStartTile = loadUnlockedStartTile();
    var won = false;
    var keepPlaying = false;
    var over = false;
    var inputLocked = false;
    var touchStart = null;
    var undoMode = "unlimited";
    var pendingStartTile = startTile;
    var pendingUndoMode = undoMode;
    var undoHistory = [];
    var undoUsed = false;
    var setupOpen = false;
    var started = false;
    var gameVersion = 0;

    function bestKey(value) {
        return "game2048-best-" + (value ? String(value) : "classic");
    }

    function loadBest(value) {
        try {
            var saved = window.localStorage.getItem(bestKey(value));
            if (saved === null && value === 0) {
                saved = window.localStorage.getItem("game2048-best");
            }
            return Number(saved || 0);
        } catch (error) {
            return 0;
        }
    }

    function saveBest() {
        try {
            window.localStorage.setItem(bestKey(startTile), String(best));
        } catch (error) {
            return;
        }
    }

    function loadUnlockedStartTile() {
        try {
            var saved = Number(window.localStorage.getItem("game2048-unlocked-start") || 0);
            return startValues.indexOf(saved) >= 0 ? saved : 0;
        } catch (error) {
            return 0;
        }
    }

    function saveUnlockedStartTile() {
        try {
            window.localStorage.setItem("game2048-unlocked-start", String(unlockedStartTile));
        } catch (error) {
            return;
        }
    }

    function freshGrid() {
        return Array.from({ length: size }, function () {
            return Array(size).fill(0);
        });
    }

    function emptyPositions() {
        var positions = [];
        for (var row = 0; row < size; row += 1) {
            for (var col = 0; col < size; col += 1) {
                if (grid[row][col] === 0) {
                    positions.push({ row: row, col: col });
                }
            }
        }
        return positions;
    }

    function addRandomTile() {
        var positions = emptyPositions();
        if (!positions.length) {
            return null;
        }
        var position = positions[Math.floor(Math.random() * positions.length)];
        grid[position.row][position.col] = Math.random() < 0.9 ? 2 : 4;
        return position;
    }

    function updateScore() {
        if (score > best) {
            best = score;
            saveBest();
        }
        scoreNode.textContent = score;
        bestNode.textContent = best;
    }

    function setupBoard() {
        var slots = document.createElement("div");
        slots.className = "game2048-slots";
        for (var index = 0; index < size * size; index += 1) {
            var cell = document.createElement("div");
            cell.className = "game2048-cell";
            slots.appendChild(cell);
        }
        tileLayerNode = document.createElement("div");
        tileLayerNode.className = "game2048-tile-layer";
        boardNode.innerHTML = "";
        boardNode.appendChild(slots);
        boardNode.appendChild(tileLayerNode);
    }

    function positionTile(tile, row, col) {
        tile.style.setProperty("--row", row);
        tile.style.setProperty("--col", col);
    }

    function createTile(value, row, col, className) {
        var tile = document.createElement("div");
        tile.className = "game2048-tile" + (className ? " " + className : "");
        tile.dataset.value = value;
        tile.textContent = value;
        tile.setAttribute("aria-label", String(value));
        positionTile(tile, row, col);
        return tile;
    }

    function hasPosition(positions, row, col) {
        return positions.some(function (position) {
            return position.row === row && position.col === col;
        });
    }

    function renderTiles(options) {
        var newPositions = options && options.newPositions ? options.newPositions : [];
        var mergedPositions = options && options.mergedPositions ? options.mergedPositions : [];
        tileLayerNode.innerHTML = "";
        for (var row = 0; row < size; row += 1) {
            for (var col = 0; col < size; col += 1) {
                var value = grid[row][col];
                if (!value) {
                    continue;
                }
                var tileClass = "";
                if (hasPosition(newPositions, row, col)) {
                    tileClass = "is-new";
                } else if (hasPosition(mergedPositions, row, col)) {
                    tileClass = "is-merged";
                }
                tileLayerNode.appendChild(createTile(value, row, col, tileClass));
            }
        }
        updateScore();
    }

    function hideOverlay() {
        overlayNode.classList.add("is-hidden");
    }

    function showOverlay(title, canContinue) {
        overlayTitleNode.textContent = title;
        keepGoingButton.hidden = !canContinue;
        overlayNode.classList.remove("is-hidden");
    }

    function modeDescription() {
        if (undoMode === "none") {
            return "No undo is available in this game.";
        }
        if (undoMode === "one") {
            return "One undo is available in this game.";
        }
        return "Unlimited undo is enabled.";
    }

    function updateSetupControls() {
        startValues.forEach(function (value) {
            var selected = value === pendingStartTile;
            var unlocked = value === 0 || value <= unlockedStartTile;
            startButtons[value].disabled = !unlocked;
            startButtons[value].textContent = value === 0 ? "Classic" :
                String(value) + (unlocked ? "" : " (Locked)");
            startButtons[value].classList.toggle("is-selected", selected);
            startButtons[value].setAttribute("aria-pressed", String(selected));
        });
        Object.keys(modeButtons).forEach(function (mode) {
            var selected = mode === pendingUndoMode;
            modeButtons[mode].classList.toggle("is-selected", selected);
            modeButtons[mode].setAttribute("aria-pressed", String(selected));
        });
        if (unlockedStartTile >= 8192) {
            unlockNoteNode.textContent = "All advanced starts unlocked. Higher starts begin in the top-left corner.";
        } else {
            var nextUnlock = unlockedStartTile ? unlockedStartTile * 2 : 2048;
            unlockNoteNode.textContent = "Reach " + nextUnlock + " to unlock Start from " + nextUnlock + ".";
        }
    }

    function openSetup() {
        pendingStartTile = startTile;
        pendingUndoMode = undoMode;
        setupOpen = true;
        shellNode.classList.add("is-choosing");
        setupTitleNode.textContent = started ? "New Game" : "Choose a Mode";
        cancelButton.hidden = !started;
        updateSetupControls();
        setupNode.classList.remove("is-hidden");
    }

    function closeSetup() {
        if (!started) {
            return;
        }
        setupOpen = false;
        shellNode.classList.remove("is-choosing");
        setupNode.classList.add("is-hidden");
    }

    function updateUndoButton() {
        if (undoMode === "none") {
            undoButton.disabled = true;
            undoButton.textContent = "Undo: Off";
            return;
        }
        undoButton.disabled = inputLocked || !undoHistory.length ||
            (undoMode === "one" && undoUsed);
        if (undoMode === "one") {
            undoButton.textContent = undoUsed ? "Undo Used" : "Undo (1)";
            return;
        }
        undoButton.textContent = undoHistory.length ?
            "Undo (" + undoHistory.length + ")" : "Undo";
    }

    function copyGrid(source) {
        return source.map(function (row) {
            return row.slice();
        });
    }

    function saveUndoSnapshot() {
        if (undoMode === "none" || (undoMode === "one" && undoUsed)) {
            return;
        }
        var snapshot = {
            grid: copyGrid(grid),
            score: score,
            won: won,
            keepPlaying: keepPlaying,
            over: over
        };
        if (undoMode === "one") {
            undoHistory = [snapshot];
        } else {
            undoHistory.push(snapshot);
        }
        updateUndoButton();
    }

    function undoMove() {
        if (inputLocked || undoMode === "none" || !undoHistory.length ||
            (undoMode === "one" && undoUsed)) {
            return;
        }
        var snapshot = undoHistory.pop();
        grid = copyGrid(snapshot.grid);
        score = snapshot.score;
        won = snapshot.won;
        keepPlaying = snapshot.keepPlaying;
        over = snapshot.over;
        if (undoMode === "one") {
            undoUsed = true;
            undoHistory = [];
        }
        hideOverlay();
        renderTiles({});
        updateUndoButton();
    }

    function startGame(nextStartTile, nextUndoMode) {
        if (typeof nextStartTile === "number") {
            startTile = nextStartTile;
        }
        if (nextUndoMode) {
            undoMode = nextUndoMode;
        }
        targetTile = startTile ? startTile * 2 : 2048;
        best = loadBest(startTile);
        started = true;
        gameVersion += 1;
        grid = freshGrid();
        score = 0;
        won = false;
        keepPlaying = false;
        over = false;
        inputLocked = false;
        undoHistory = [];
        undoUsed = false;
        var startPositions = [];
        if (startTile) {
            grid[0][0] = startTile;
            startPositions.push({ row: 0, col: 0 });
        }
        startPositions.push(addRandomTile(), addRandomTile());
        startPositions = startPositions.filter(Boolean);
        closeSetup();
        hideOverlay();
        renderTiles({ newPositions: startPositions });
        goalNode.textContent = targetTile;
        bestLabelNode.textContent = "Best - " + (startTile ? startTile : "Classic");
        messageNode.textContent = (startTile ?
            "Starting from " + startTile + " in the top-left. " :
            "Classic start. ") + "Reach " + targetTile + ". " + modeDescription();
        pendingStartTile = startTile;
        pendingUndoMode = undoMode;
        updateSetupControls();
        updateUndoButton();
    }

    function getPosition(direction, lineIndex, offset) {
        if (direction === "left") {
            return { row: lineIndex, col: offset };
        }
        if (direction === "right") {
            return { row: lineIndex, col: size - 1 - offset };
        }
        if (direction === "up") {
            return { row: offset, col: lineIndex };
        }
        return { row: size - 1 - offset, col: lineIndex };
    }

    function calculateMove(direction) {
        var nextGrid = freshGrid();
        var movements = [];
        var mergedPositions = [];
        var scoreGain = 0;
        var changed = false;

        for (var lineIndex = 0; lineIndex < size; lineIndex += 1) {
            var packed = [];
            for (var offset = 0; offset < size; offset += 1) {
                var source = getPosition(direction, lineIndex, offset);
                var value = grid[source.row][source.col];
                if (!value) {
                    continue;
                }

                var previous = packed[packed.length - 1];
                if (previous && previous.value === value && !previous.merged) {
                    previous.value *= 2;
                    previous.merged = true;
                    scoreGain += previous.value;
                    movements.push({ value: value, from: source, to: previous.position });
                    mergedPositions.push(previous.position);
                } else {
                    var destination = getPosition(direction, lineIndex, packed.length);
                    packed.push({
                        value: value,
                        position: destination,
                        merged: false
                    });
                    movements.push({ value: value, from: source, to: destination });
                }
            }

            packed.forEach(function (tile) {
                nextGrid[tile.position.row][tile.position.col] = tile.value;
            });
        }

        movements.forEach(function (movement) {
            if (movement.from.row !== movement.to.row || movement.from.col !== movement.to.col) {
                changed = true;
            }
        });

        return {
            changed: changed,
            grid: nextGrid,
            movements: movements,
            mergedPositions: mergedPositions,
            scoreGain: scoreGain
        };
    }

    function updateUnlocks() {
        var largestTile = grid.reduce(function (largest, row) {
            return Math.max(largest, Math.max.apply(null, row));
        }, 0);
        var newlyUnlocked = 0;
        startValues.forEach(function (value) {
            if (value && value <= largestTile && value > unlockedStartTile) {
                newlyUnlocked = value;
            }
        });
        if (newlyUnlocked) {
            unlockedStartTile = newlyUnlocked;
            saveUnlockedStartTile();
            updateSetupControls();
        }
        return newlyUnlocked;
    }

    function animateMove(result) {
        var activeGameVersion = gameVersion;
        tileLayerNode.innerHTML = "";
        result.movements.forEach(function (movement) {
            var tile = createTile(movement.value, movement.from.row, movement.from.col, "is-moving");
            tileLayerNode.appendChild(tile);
            movement.node = tile;
        });

        // Commit the starting positions before moving so the transition remains visible.
        tileLayerNode.getBoundingClientRect();
        window.requestAnimationFrame(function () {
            result.movements.forEach(function (movement) {
                positionTile(movement.node, movement.to.row, movement.to.col);
            });
        });

        window.setTimeout(function () {
            if (activeGameVersion !== gameVersion) {
                return;
            }
            grid = result.grid;
            score += result.scoreGain;
            var newPosition = addRandomTile();
            renderTiles({
                newPositions: newPosition ? [newPosition] : [],
                mergedPositions: result.mergedPositions
            });
            inputLocked = false;
            updateUndoButton();
            var newlyUnlocked = updateUnlocks();
            if (newlyUnlocked) {
                messageNode.textContent = "Start from " + newlyUnlocked +
                    " unlocked. New advanced games place it in the top-left corner.";
            }

            if (!won && grid.some(function (row) {
                return row.some(function (value) {
                    return value >= targetTile;
                });
            })) {
                won = true;
                showOverlay("You reached " + targetTile + "!", true);
                return;
            }

            if (!movesAvailable()) {
                over = true;
                showOverlay("Game over!", false);
            }
        }, moveDuration + 20);
    }

    function move(direction) {
        if (setupOpen || inputLocked || over || (won && !keepPlaying)) {
            return;
        }
        var result = calculateMove(direction);
        if (!result.changed) {
            return;
        }
        saveUndoSnapshot();
        inputLocked = true;
        updateUndoButton();
        animateMove(result);
    }

    function movesAvailable() {
        if (emptyPositions().length) {
            return true;
        }
        for (var row = 0; row < size; row += 1) {
            for (var col = 0; col < size; col += 1) {
                var value = grid[row][col];
                if (row + 1 < size && value === grid[row + 1][col]) {
                    return true;
                }
                if (col + 1 < size && value === grid[row][col + 1]) {
                    return true;
                }
            }
        }
        return false;
    }

    document.addEventListener("keydown", function (event) {
        var directions = {
            ArrowLeft: "left",
            ArrowRight: "right",
            ArrowUp: "up",
            ArrowDown: "down"
        };
        if (directions[event.key]) {
            event.preventDefault();
            move(directions[event.key]);
        }
    });

    boardNode.addEventListener("touchstart", function (event) {
        var touch = event.changedTouches[0];
        touchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });

    boardNode.addEventListener("touchmove", function (event) {
        event.preventDefault();
    }, { passive: false });

    boardNode.addEventListener("touchend", function (event) {
        if (!touchStart) {
            return;
        }
        var touch = event.changedTouches[0];
        var dx = touch.clientX - touchStart.x;
        var dy = touch.clientY - touchStart.y;
        touchStart = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) {
            return;
        }
        if (Math.abs(dx) > Math.abs(dy)) {
            move(dx > 0 ? "right" : "left");
        } else {
            move(dy > 0 ? "down" : "up");
        }
    }, { passive: true });

    keepGoingButton.addEventListener("click", function () {
        keepPlaying = true;
        hideOverlay();
    });

    newButton.addEventListener("click", openSetup);
    retryButton.addEventListener("click", function () {
        startGame(startTile, undoMode);
    });
    undoButton.addEventListener("click", undoMove);
    startValues.forEach(function (value) {
        startButtons[value].addEventListener("click", function () {
            if (value && value > unlockedStartTile) {
                return;
            }
            pendingStartTile = value;
            updateSetupControls();
        });
    });
    Object.keys(modeButtons).forEach(function (mode) {
        modeButtons[mode].addEventListener("click", function () {
            pendingUndoMode = mode;
            updateSetupControls();
        });
    });
    cancelButton.addEventListener("click", closeSetup);
    startButton.addEventListener("click", function () {
        startGame(pendingStartTile, pendingUndoMode);
    });

    setupBoard();
    openSetup();
})();
