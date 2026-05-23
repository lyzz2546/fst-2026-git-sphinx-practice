(function () {
    var boardNode = document.getElementById("game2048-board");
    if (!boardNode) {
        return;
    }

    document.documentElement.classList.add("game2048-page");

    var size = 4;
    var moveDuration = 190;
    var scoreNode = document.getElementById("game2048-score");
    var bestNode = document.getElementById("game2048-best");
    var overlayNode = document.getElementById("game2048-overlay");
    var overlayTitleNode = document.getElementById("game2048-overlay-title");
    var keepGoingButton = document.getElementById("game2048-keep-going");
    var undoButton = document.getElementById("game2048-undo");
    var newButton = document.getElementById("game2048-new");
    var retryButton = document.getElementById("game2048-try-again");
    var tileLayerNode = null;
    var grid = [];
    var score = 0;
    var best = loadBest();
    var won = false;
    var keepPlaying = false;
    var over = false;
    var inputLocked = false;
    var touchStart = null;
    var undoSnapshot = null;
    var undoUsed = false;

    function loadBest() {
        try {
            return Number(window.localStorage.getItem("game2048-best") || 0);
        } catch (error) {
            return 0;
        }
    }

    function saveBest() {
        try {
            window.localStorage.setItem("game2048-best", String(best));
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

    function updateUndoButton() {
        undoButton.disabled = undoUsed || !undoSnapshot || inputLocked;
        undoButton.textContent = undoUsed ? "Undo Used" : "Undo (1)";
    }

    function copyGrid(source) {
        return source.map(function (row) {
            return row.slice();
        });
    }

    function saveUndoSnapshot() {
        undoSnapshot = {
            grid: copyGrid(grid),
            score: score,
            won: won,
            keepPlaying: keepPlaying,
            over: over
        };
        updateUndoButton();
    }

    function undoMove() {
        if (inputLocked || undoUsed || !undoSnapshot) {
            return;
        }
        grid = copyGrid(undoSnapshot.grid);
        score = undoSnapshot.score;
        won = undoSnapshot.won;
        keepPlaying = undoSnapshot.keepPlaying;
        over = undoSnapshot.over;
        undoUsed = true;
        undoSnapshot = null;
        hideOverlay();
        renderTiles({});
        updateUndoButton();
    }

    function startGame() {
        grid = freshGrid();
        score = 0;
        won = false;
        keepPlaying = false;
        over = false;
        inputLocked = false;
        undoSnapshot = null;
        undoUsed = false;
        var startPositions = [addRandomTile(), addRandomTile()].filter(Boolean);
        hideOverlay();
        renderTiles({ newPositions: startPositions });
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

    function animateMove(result) {
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
            grid = result.grid;
            score += result.scoreGain;
            var newPosition = addRandomTile();
            renderTiles({
                newPositions: newPosition ? [newPosition] : [],
                mergedPositions: result.mergedPositions
            });
            inputLocked = false;
            updateUndoButton();

            if (!won && grid.some(function (row) {
                return row.some(function (value) {
                    return value >= 2048;
                });
            })) {
                won = true;
                showOverlay("You win!", true);
                return;
            }

            if (!movesAvailable()) {
                over = true;
                showOverlay("Game over!", false);
            }
        }, moveDuration + 20);
    }

    function move(direction) {
        if (inputLocked || over || (won && !keepPlaying)) {
            return;
        }
        var result = calculateMove(direction);
        if (!result.changed) {
            return;
        }
        if (!undoUsed) {
            saveUndoSnapshot();
        }
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

    newButton.addEventListener("click", startGame);
    retryButton.addEventListener("click", startGame);
    undoButton.addEventListener("click", undoMove);

    setupBoard();
    startGame();
})();
