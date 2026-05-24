(function () {
    var tableauNode = document.getElementById("spider-tableau");
    if (!tableauNode) {
        return;
    }

    document.documentElement.classList.add("spider-page");

    var scoreNode = document.getElementById("spider-score");
    var movesNode = document.getElementById("spider-moves");
    var timeNode = document.getElementById("spider-time");
    var stockButton = document.getElementById("spider-stock");
    var dealsNode = document.getElementById("spider-deals-left");
    var foundationsNode = document.getElementById("spider-foundations");
    var statusNode = document.getElementById("spider-status");
    var noticeNode = document.getElementById("spider-notice");
    var undoButton = document.getElementById("spider-undo");
    var hintButton = document.getElementById("spider-hint");
    var newButton = document.getElementById("spider-new");
    var overlayNode = document.getElementById("spider-overlay");
    var overlayTitleNode = document.getElementById("spider-overlay-title");
    var playAgainButton = document.getElementById("spider-play-again");
    var levelButtons = Array.prototype.slice.call(document.querySelectorAll("[data-spider-suits]"));

    var suitNames = {
        S: { symbol: "\u2660", name: "Spade", red: false },
        H: { symbol: "\u2665", name: "Heart", red: true },
        C: { symbol: "\u2663", name: "Club", red: false },
        D: { symbol: "\u2666", name: "Diamond", red: true }
    };
    var suitCount = 1;
    var columns = [];
    var stock = [];
    var completed = [];
    var selected = null;
    var hinted = null;
    var history = [];
    var moves = 0;
    var score = 500;
    var seconds = 0;
    var timerId = null;
    var started = false;
    var finished = false;
    var hintTimer = null;
    var noticeTimer = null;

    function rankText(rank) {
        if (rank === 1) {
            return "A";
        }
        if (rank === 11) {
            return "J";
        }
        if (rank === 12) {
            return "Q";
        }
        if (rank === 13) {
            return "K";
        }
        return String(rank);
    }

    function timeText(value) {
        var minutes = Math.floor(value / 60);
        var remaining = value % 60;
        return String(minutes).padStart(2, "0") + ":" + String(remaining).padStart(2, "0");
    }

    function cloneCards(cards) {
        return cards.map(function (card) {
            return {
                id: card.id,
                rank: card.rank,
                suit: card.suit,
                faceUp: card.faceUp
            };
        });
    }

    function copyState() {
        return {
            columns: columns.map(cloneCards),
            stock: cloneCards(stock),
            completed: completed.slice(),
            moves: moves,
            score: score,
            seconds: seconds,
            started: started,
            finished: finished
        };
    }

    function restoreState(state) {
        columns = state.columns.map(cloneCards);
        stock = cloneCards(state.stock);
        completed = state.completed.slice();
        moves = state.moves;
        score = state.score;
        seconds = state.seconds;
        started = state.started;
        finished = state.finished;
        selected = null;
        hinted = null;
        hideOverlay();
        if (started && !finished) {
            startTimer();
        } else {
            stopTimer();
        }
        render();
    }

    function storeHistory() {
        history.push(copyState());
        undoButton.disabled = false;
    }

    function updateStatus(text) {
        statusNode.textContent = text;
    }

    function showNotice(text) {
        noticeNode.textContent = text;
        noticeNode.classList.add("is-visible");
        if (noticeTimer) {
            window.clearTimeout(noticeTimer);
        }
        noticeTimer = window.setTimeout(function () {
            noticeNode.classList.remove("is-visible");
        }, 2900);
    }

    function highlightEmptyColumns() {
        Array.prototype.forEach.call(tableauNode.querySelectorAll(".spider-column.is-empty"), function (column) {
            column.classList.add("is-blocked");
        });
        window.setTimeout(function () {
            Array.prototype.forEach.call(tableauNode.querySelectorAll(".spider-column.is-blocked"), function (column) {
                column.classList.remove("is-blocked");
            });
        }, 1800);
    }

    function stopTimer() {
        if (timerId) {
            window.clearInterval(timerId);
            timerId = null;
        }
    }

    function startTimer() {
        if (timerId || finished) {
            return;
        }
        started = true;
        timerId = window.setInterval(function () {
            seconds += 1;
            timeNode.textContent = timeText(seconds);
        }, 1000);
    }

    function shuffledDeck(level) {
        var activeSuits = level === 1 ? ["S"] : level === 2 ? ["S", "H"] : ["S", "H", "C", "D"];
        var copies = 104 / (activeSuits.length * 13);
        var deck = [];
        var id = 0;
        activeSuits.forEach(function (suit) {
            for (var copy = 0; copy < copies; copy += 1) {
                for (var rank = 1; rank <= 13; rank += 1) {
                    deck.push({ id: "spider-" + id, rank: rank, suit: suit, faceUp: false });
                    id += 1;
                }
            }
        });
        for (var index = deck.length - 1; index > 0; index -= 1) {
            var randomIndex = Math.floor(Math.random() * (index + 1));
            var swap = deck[index];
            deck[index] = deck[randomIndex];
            deck[randomIndex] = swap;
        }
        return deck;
    }

    function dealOpening(deck) {
        columns = Array.from({ length: 10 }, function () {
            return [];
        });
        for (var col = 0; col < 10; col += 1) {
            var amount = col < 4 ? 6 : 5;
            for (var index = 0; index < amount; index += 1) {
                var card = deck.pop();
                card.faceUp = index === amount - 1;
                columns[col].push(card);
            }
        }
        stock = deck;
    }

    function hideOverlay() {
        overlayNode.classList.add("is-hidden");
    }

    function showOverlay(title) {
        overlayTitleNode.textContent = title;
        overlayNode.classList.remove("is-hidden");
    }

    function newGame(level) {
        suitCount = level || suitCount;
        stopTimer();
        columns = [];
        stock = [];
        completed = [];
        selected = null;
        hinted = null;
        history = [];
        moves = 0;
        score = 500;
        seconds = 0;
        started = false;
        finished = false;
        noticeNode.classList.remove("is-visible");
        hideOverlay();
        dealOpening(shuffledDeck(suitCount));
        levelButtons.forEach(function (button) {
            button.classList.toggle("is-active", Number(button.dataset.spiderSuits) === suitCount);
        });
        updateStatus("Arrange eight complete suited sequences from King down to Ace. A new deal requires every column to contain a card.");
        render();
    }

    function canMoveSequence(columnIndex, cardIndex) {
        var column = columns[columnIndex];
        if (!column[cardIndex] || !column[cardIndex].faceUp) {
            return false;
        }
        for (var index = cardIndex; index < column.length - 1; index += 1) {
            if (column[index].suit !== column[index + 1].suit ||
                column[index].rank !== column[index + 1].rank + 1) {
                return false;
            }
        }
        return true;
    }

    function canPlace(card, destinationIndex) {
        var destination = columns[destinationIndex];
        if (!destination.length) {
            return true;
        }
        return destination[destination.length - 1].rank === card.rank + 1;
    }

    function exposeLastCard(columnIndex) {
        var column = columns[columnIndex];
        if (column.length && !column[column.length - 1].faceUp) {
            column[column.length - 1].faceUp = true;
        }
    }

    function completedRun(columnIndex) {
        var column = columns[columnIndex];
        if (column.length < 13) {
            return false;
        }
        var run = column.slice(column.length - 13);
        if (!run.every(function (card) { return card.faceUp && card.suit === run[0].suit; })) {
            return false;
        }
        for (var index = 0; index < run.length; index += 1) {
            if (run[index].rank !== 13 - index) {
                return false;
            }
        }
        return run[0].suit;
    }

    function collectRuns() {
        var collected = false;
        var checking = true;
        while (checking) {
            checking = false;
            for (var col = 0; col < columns.length; col += 1) {
                var suit = completedRun(col);
                if (suit) {
                    columns[col].splice(columns[col].length - 13, 13);
                    completed.push(suit);
                    score += 100;
                    exposeLastCard(col);
                    checking = true;
                    collected = true;
                }
            }
        }
        return collected;
    }

    function anyMoveAvailable() {
        for (var from = 0; from < columns.length; from += 1) {
            for (var cardIndex = 0; cardIndex < columns[from].length; cardIndex += 1) {
                if (!canMoveSequence(from, cardIndex)) {
                    continue;
                }
                for (var target = 0; target < columns.length; target += 1) {
                    if (from !== target && canPlace(columns[from][cardIndex], target)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function checkEnding(collected) {
        if (completed.length === 8) {
            finished = true;
            stopTimer();
            showOverlay("You Win!");
            updateStatus("All eight suited sequences are complete.");
            return;
        }
        if (collected) {
            updateStatus("Completed sequence collected. " + (8 - completed.length) + " remaining.");
        }
        if (!stock.length && !anyMoveAvailable()) {
            finished = true;
            stopTimer();
            showOverlay("No Moves Left");
            updateStatus("No legal moves remain. Start a new game or undo.");
        }
    }

    function moveCards(fromColumn, cardIndex, targetColumn) {
        if (finished || fromColumn === targetColumn || !canMoveSequence(fromColumn, cardIndex)) {
            return false;
        }
        var card = columns[fromColumn][cardIndex];
        if (!canPlace(card, targetColumn)) {
            updateStatus("That sequence cannot be placed there.");
            return false;
        }
        storeHistory();
        startTimer();
        var moving = columns[fromColumn].splice(cardIndex);
        Array.prototype.push.apply(columns[targetColumn], moving);
        exposeLastCard(fromColumn);
        moves += 1;
        score = Math.max(0, score - 1);
        selected = null;
        hinted = null;
        var collected = collectRuns();
        render();
        checkEnding(collected);
        return true;
    }

    function dealRow() {
        if (finished || !stock.length) {
            return;
        }
        if (columns.some(function (column) { return column.length === 0; })) {
            var message = "Cannot deal yet: fill every empty column first.";
            updateStatus(message);
            showNotice(message);
            stockButton.classList.add("is-blocked");
            window.setTimeout(function () { stockButton.classList.remove("is-blocked"); }, 1800);
            highlightEmptyColumns();
            return;
        }
        storeHistory();
        startTimer();
        for (var col = 0; col < columns.length; col += 1) {
            var card = stock.pop();
            card.faceUp = true;
            columns[col].push(card);
        }
        moves += 1;
        score = Math.max(0, score - 1);
        selected = null;
        hinted = null;
        var collected = collectRuns();
        render();
        checkEnding(collected);
        if (!collected) {
            updateStatus("A new row has been dealt.");
        }
    }

    function undo() {
        if (!history.length) {
            return;
        }
        restoreState(history.pop());
        undoButton.disabled = history.length === 0;
        updateStatus("Previous move restored.");
    }

    function findHint() {
        var hints = [];
        for (var from = 0; from < columns.length; from += 1) {
            for (var cardIndex = 0; cardIndex < columns[from].length; cardIndex += 1) {
                if (!canMoveSequence(from, cardIndex)) {
                    continue;
                }
                var card = columns[from][cardIndex];
                for (var target = 0; target < columns.length; target += 1) {
                    if (from === target || !canPlace(card, target)) {
                        continue;
                    }
                    var top = columns[target][columns[target].length - 1];
                    var priority = 0;
                    if (cardIndex > 0 && !columns[from][cardIndex - 1].faceUp) {
                        priority += 4;
                    }
                    if (top && top.suit === card.suit) {
                        priority += 2;
                    }
                    if (!top) {
                        priority += 1;
                    }
                    hints.push({ from: from, index: cardIndex, target: target, priority: priority });
                }
            }
        }
        hints.sort(function (left, right) {
            return right.priority - left.priority;
        });
        return hints[0] || null;
    }

    function hint() {
        if (finished) {
            return;
        }
        var suggestion = findHint();
        if (!suggestion) {
            if (stock.length && !columns.some(function (column) { return column.length === 0; })) {
                stockButton.classList.add("is-hint");
                updateStatus("No helpful move found. Deal the next row.");
                window.setTimeout(function () { stockButton.classList.remove("is-hint"); }, 1300);
            } else {
                updateStatus("No legal hint is available right now.");
            }
            return;
        }
        hinted = suggestion;
        render();
        updateStatus("Highlighted cards show a suggested move.");
        if (hintTimer) {
            window.clearTimeout(hintTimer);
        }
        hintTimer = window.setTimeout(function () {
            hinted = null;
            render();
        }, 1600);
    }

    function renderFoundations() {
        foundationsNode.innerHTML = "";
        for (var index = 0; index < 8; index += 1) {
            var foundation = document.createElement("span");
            foundation.className = "spider-foundation";
            if (completed[index]) {
                foundation.classList.add("is-complete");
                foundation.textContent = suitNames[completed[index]].symbol;
                if (suitNames[completed[index]].red) {
                    foundation.classList.add("is-red");
                }
            }
            foundationsNode.appendChild(foundation);
        }
    }

    function cardNode(card, columnIndex, cardIndex, offset) {
        var node = document.createElement("button");
        var suit = suitNames[card.suit];
        node.type = "button";
        node.className = "spider-card";
        node.dataset.column = columnIndex;
        node.dataset.index = cardIndex;
        node.style.top = offset + "px";
        if (!card.faceUp) {
            node.classList.add("is-facedown");
            node.setAttribute("aria-label", "Face down card");
            return node;
        }
        node.classList.add("is-faceup");
        if (suit.red) {
            node.classList.add("is-red");
        }
        if (selected && selected.column === columnIndex && cardIndex >= selected.index) {
            node.classList.add("is-selected");
        }
        if (hinted && ((hinted.from === columnIndex && cardIndex >= hinted.index) ||
            (hinted.target === columnIndex && cardIndex === columns[columnIndex].length - 1))) {
            node.classList.add("is-hint");
        }
        node.draggable = canMoveSequence(columnIndex, cardIndex);
        node.innerHTML = "<span class=\"spider-card-corner\">" + rankText(card.rank) +
            "<small>" + suit.symbol + "</small></span><span class=\"spider-card-center\">" +
            suit.symbol + "</span>";
        node.setAttribute("aria-label", rankText(card.rank) + " of " + suit.name + "s");
        return node;
    }

    function renderTableau() {
        tableauNode.innerHTML = "";
        columns.forEach(function (column, columnIndex) {
            var columnNode = document.createElement("div");
            var offset = 0;
            columnNode.className = "spider-column";
            columnNode.dataset.column = columnIndex;
            if (!column.length) {
                columnNode.classList.add("is-empty");
            }
            column.forEach(function (card, cardIndex) {
                columnNode.appendChild(cardNode(card, columnIndex, cardIndex, offset));
                offset += card.faceUp ? 38 : 18;
            });
            columnNode.style.height = Math.max(570, offset + 154) + "px";
            tableauNode.appendChild(columnNode);
        });
    }

    function render() {
        scoreNode.textContent = score;
        movesNode.textContent = moves;
        timeNode.textContent = timeText(seconds);
        dealsNode.textContent = "Deals: " + Math.floor(stock.length / 10);
        stockButton.disabled = !stock.length || finished;
        undoButton.disabled = !history.length;
        renderFoundations();
        renderTableau();
    }

    tableauNode.addEventListener("click", function (event) {
        var card = event.target.closest(".spider-card");
        var column = event.target.closest(".spider-column");
        if (!column || finished) {
            return;
        }
        var columnIndex = Number(column.dataset.column);
        if (!card) {
            if (selected) {
                moveCards(selected.column, selected.index, columnIndex);
            }
            return;
        }
        var cardIndex = Number(card.dataset.index);
        if (selected && selected.column !== columnIndex) {
            if (moveCards(selected.column, selected.index, columnIndex)) {
                return;
            }
        }
        if (canMoveSequence(columnIndex, cardIndex)) {
            selected = { column: columnIndex, index: cardIndex };
            render();
            updateStatus("Sequence selected. Choose a destination column.");
        }
    });

    tableauNode.addEventListener("dragstart", function (event) {
        var card = event.target.closest(".spider-card");
        if (!card) {
            return;
        }
        var column = Number(card.dataset.column);
        var index = Number(card.dataset.index);
        if (!canMoveSequence(column, index)) {
            event.preventDefault();
            return;
        }
        selected = { column: column, index: index };
        event.dataTransfer.setData("text/plain", column + ":" + index);
        event.dataTransfer.effectAllowed = "move";
        card.classList.add("is-selected");
    });

    tableauNode.addEventListener("dragover", function (event) {
        if (event.target.closest(".spider-column")) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
        }
    });

    tableauNode.addEventListener("drop", function (event) {
        var target = event.target.closest(".spider-column");
        if (!target || !selected) {
            return;
        }
        event.preventDefault();
        moveCards(selected.column, selected.index, Number(target.dataset.column));
    });

    levelButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            newGame(Number(button.dataset.spiderSuits));
        });
    });
    stockButton.addEventListener("click", dealRow);
    undoButton.addEventListener("click", undo);
    hintButton.addEventListener("click", hint);
    newButton.addEventListener("click", function () { newGame(); });
    playAgainButton.addEventListener("click", function () { newGame(); });

    newGame(1);
})();
