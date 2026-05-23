(function () {
    var boardNode = document.getElementById("game2048-board");
    if (!boardNode) {
        return;
    }

    document.documentElement.classList.add("game2048-page");

    var size = 4;
    var scoreNode = document.getElementById("game2048-score");
    var bestNode = document.getElementById("game2048-best");
    var overlayNode = document.getElementById("game2048-overlay");
    var overlayTitleNode = document.getElementById("game2048-overlay-title");
    var keepGoingButton = document.getElementById("game2048-keep-going");
    var newButton = document.getElementById("game2048-new");
    var retryButton = document.getElementById("game2048-try-again");
    var grid = [];
    var score = 0;
    var best = loadBest();
    var won = false;
    var keepPlaying = false;
    var over = false;
    var touchStart = null;

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
            return;
        }
        var position = positions[Math.floor(Math.random() * positions.length)];
        grid[position.row][position.col] = Math.random() < 0.9 ? 2 : 4;
    }

    function updateScore() {
        if (score > best) {
            best = score;
            saveBest();
        }
        scoreNode.textContent = score;
        bestNode.textContent = best;
    }

    function render() {
        boardNode.innerHTML = "";
        for (var row = 0; row < size; row += 1) {
            for (var col = 0; col < size; col += 1) {
                var value = grid[row][col];
                var cell = document.createElement("div");
                cell.className = "game2048-cell";
                cell.dataset.value = value || "empty";
                cell.textContent = value || "";
                cell.setAttribute("aria-label", value ? String(value) : "Empty tile");
                boardNode.appendChild(cell);
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

    function startGame() {
        grid = freshGrid();
        score = 0;
        won = false;
        keepPlaying = false;
        over = false;
        addRandomTile();
        addRandomTile();
        hideOverlay();
        render();
    }

    function slideLine(line) {
        var compacted = line.filter(function (value) {
            return value !== 0;
        });
        var result = [];
        for (var index = 0; index < compacted.length; index += 1) {
            if (compacted[index] === compacted[index + 1]) {
                var merged = compacted[index] * 2;
                result.push(merged);
                score += merged;
                index += 1;
            } else {
                result.push(compacted[index]);
            }
        }
        while (result.length < size) {
            result.push(0);
        }
        return result;
    }

    function sameLine(left, right) {
        return left.every(function (value, index) {
            return value === right[index];
        });
    }

    function move(direction) {
        if (over || (won && !keepPlaying)) {
            return;
        }

        var changed = false;
        for (var lineIndex = 0; lineIndex < size; lineIndex += 1) {
            var original = [];
            var reversed = direction === "right" || direction === "down";
            for (var offset = 0; offset < size; offset += 1) {
                if (direction === "left" || direction === "right") {
                    original.push(grid[lineIndex][offset]);
                } else {
                    original.push(grid[offset][lineIndex]);
                }
            }
            var working = reversed ? original.slice().reverse() : original.slice();
            var moved = slideLine(working);
            var finalLine = reversed ? moved.reverse() : moved;
            if (!sameLine(original, finalLine)) {
                changed = true;
            }
            for (var writeIndex = 0; writeIndex < size; writeIndex += 1) {
                if (direction === "left" || direction === "right") {
                    grid[lineIndex][writeIndex] = finalLine[writeIndex];
                } else {
                    grid[writeIndex][lineIndex] = finalLine[writeIndex];
                }
            }
        }

        if (!changed) {
            return;
        }

        addRandomTile();
        render();

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

    startGame();
})();
