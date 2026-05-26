(function () {
    var tableauNode = document.getElementById("freecell-tableau");
    if (!tableauNode) {
        return;
    }

    document.documentElement.classList.add("freecell-page");

    var cellsNode = document.getElementById("freecell-cells");
    var homesNode = document.getElementById("freecell-homes");
    var tableNode = document.querySelector(".freecell-table");
    var dealNode = document.getElementById("freecell-deal");
    var movesNode = document.getElementById("freecell-moves");
    var timeNode = document.getElementById("freecell-time");
    var statusNode = document.getElementById("freecell-status");
    var newButton = document.getElementById("freecell-new");
    var replayButton = document.getElementById("freecell-replay");
    var undoButton = document.getElementById("freecell-undo");
    var hintButton = document.getElementById("freecell-hint");
    var autoButton = document.getElementById("freecell-auto");
    var easyButton = document.getElementById("freecell-easy");
    var overlayNode = document.getElementById("freecell-overlay");
    var againButton = document.getElementById("freecell-play-again");

    var suits = {
        S: { symbol: "\u2660", name: "Spades", red: false },
        H: { symbol: "\u2665", name: "Hearts", red: true },
        C: { symbol: "\u2663", name: "Clubs", red: false },
        D: { symbol: "\u2666", name: "Diamonds", red: true }
    };
    var suitOrder = ["S", "H", "C", "D"];
    var columns = [];
    var cells = [];
    var homes = {};
    var selected = null;
    var hinted = null;
    var history = [];
    var moves = 0;
    var seconds = 0;
    var timerId = null;
    var started = false;
    var finished = false;
    var hintTimer = null;
    var currentDeal = 0;
    var easyMoves = false;

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
        return String(minutes).padStart(2, "0") + ":" + String(value % 60).padStart(2, "0");
    }

    function cloneCard(card) {
        return card ? { id: card.id, rank: card.rank, suit: card.suit } : null;
    }

    function clonePile(pile) {
        return pile.map(cloneCard);
    }

    function copyState() {
        return {
            columns: columns.map(clonePile),
            cells: cells.map(cloneCard),
            homes: {
                S: clonePile(homes.S),
                H: clonePile(homes.H),
                C: clonePile(homes.C),
                D: clonePile(homes.D)
            },
            moves: moves,
            seconds: seconds,
            started: started,
            finished: finished,
            deal: currentDeal
        };
    }

    function restoreState(state) {
        columns = state.columns.map(clonePile);
        cells = state.cells.map(cloneCard);
        homes = {
            S: clonePile(state.homes.S),
            H: clonePile(state.homes.H),
            C: clonePile(state.homes.C),
            D: clonePile(state.homes.D)
        };
        moves = state.moves;
        seconds = state.seconds;
        started = state.started;
        finished = state.finished;
        currentDeal = state.deal;
        selected = null;
        hinted = null;
        overlayNode.classList.add("is-hidden");
        if (started && !finished) {
            startTimer();
        } else {
            stopTimer();
        }
        render();
    }

    function updateStatus(text) {
        statusNode.textContent = text;
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

    function classicRandom(seed) {
        var value = seed;
        return function () {
            value = (value * 214013 + 2531011) % 2147483648;
            return (Math.floor(value / 65536) & 0x7fff);
        };
    }

    function randomSolvableDeal() {
        var deal;
        do {
            deal = Math.floor(Math.random() * 32000) + 1;
        } while (deal === 11982);
        return deal;
    }

    function classicDeck(dealNumber) {
        var deck = [];
        var id = 0;
        var dealSuits = ["C", "D", "H", "S"];
        for (var rank = 1; rank <= 13; rank += 1) {
            dealSuits.forEach(function (suit) {
                deck.push({ id: "freecell-" + id, rank: rank, suit: suit });
                id += 1;
            });
        }
        var random = classicRandom(dealNumber);
        var dealt = [];
        while (deck.length) {
            var target = random() % deck.length;
            var card = deck[target];
            deck[target] = deck[deck.length - 1];
            deck.pop();
            dealt.push(card);
        }
        return dealt;
    }

    function newGame(dealNumber) {
        stopTimer();
        currentDeal = dealNumber || randomSolvableDeal();
        var deck = classicDeck(currentDeal);
        columns = Array.from({ length: 8 }, function () { return []; });
        deck.forEach(function (card, index) {
            columns[index % 8].push(card);
        });
        cells = [null, null, null, null];
        homes = { S: [], H: [], C: [], D: [] };
        selected = null;
        hinted = null;
        history = [];
        moves = 0;
        seconds = 0;
        started = false;
        finished = false;
        overlayNode.classList.add("is-hidden");
        updateStatus("Classic Deal #" + currentDeal +
            " has a known solution. Keep free cells open, or turn on Easy Moves for relaxed run movement.");
        render();
    }

    function sameSource(left, right) {
        return left && right && left.zone === right.zone && left.index === right.index &&
            left.cardIndex === right.cardIndex;
    }

    function sourceCards(source) {
        if (!source) {
            return [];
        }
        if (source.zone === "tableau") {
            return columns[source.index].slice(source.cardIndex);
        }
        if (source.zone === "cell") {
            return cells[source.index] ? [cells[source.index]] : [];
        }
        var home = homes[suitOrder[source.index]];
        return home.length ? [home[home.length - 1]] : [];
    }

    function isAlternatingRun(cards) {
        for (var index = 0; index < cards.length - 1; index += 1) {
            if (cards[index].rank !== cards[index + 1].rank + 1 ||
                suits[cards[index].suit].red === suits[cards[index + 1].suit].red) {
                return false;
            }
        }
        return true;
    }

    function isMovableSource(source) {
        var cards = sourceCards(source);
        if (!cards.length) {
            return false;
        }
        if (source.zone === "tableau") {
            return isAlternatingRun(cards);
        }
        return cards.length === 1;
    }

    function capacityForTableau(destinationIndex) {
        var freeCells = cells.filter(function (card) { return !card; }).length;
        var emptyColumns = columns.filter(function (column, index) {
            return !column.length && index !== destinationIndex;
        }).length;
        return (freeCells + 1) * Math.pow(2, emptyColumns);
    }

    function canPlaceOnTableau(cards, destinationIndex) {
        if (!cards.length || !isAlternatingRun(cards)) {
            return false;
        }
        var destination = columns[destinationIndex];
        if (destination.length) {
            var top = destination[destination.length - 1];
            if (top.rank !== cards[0].rank + 1 ||
                suits[top.suit].red === suits[cards[0].suit].red) {
                return false;
            }
        }
        return easyMoves || cards.length <= capacityForTableau(destinationIndex);
    }

    function canPlaceOnHome(cards, homeIndex) {
        if (cards.length !== 1 || cards[0].suit !== suitOrder[homeIndex]) {
            return false;
        }
        return homes[cards[0].suit].length === cards[0].rank - 1;
    }

    function canPlace(source, target) {
        var cards = sourceCards(source);
        if (!isMovableSource(source) || !target) {
            return false;
        }
        if (target.zone === "tableau") {
            return source.zone !== "tableau" || source.index !== target.index ?
                canPlaceOnTableau(cards, target.index) : false;
        }
        if (target.zone === "cell") {
            return cards.length === 1 && !cells[target.index] &&
                !(source.zone === "cell" && source.index === target.index);
        }
        return canPlaceOnHome(cards, target.index) &&
            !(source.zone === "home" && source.index === target.index);
    }

    function removeCards(source) {
        if (source.zone === "tableau") {
            return columns[source.index].splice(source.cardIndex);
        }
        if (source.zone === "cell") {
            var card = cells[source.index];
            cells[source.index] = null;
            return [card];
        }
        return [homes[suitOrder[source.index]].pop()];
    }

    function addCards(target, cards) {
        if (target.zone === "tableau") {
            Array.prototype.push.apply(columns[target.index], cards);
        } else if (target.zone === "cell") {
            cells[target.index] = cards[0];
        } else {
            homes[suitOrder[target.index]].push(cards[0]);
        }
    }

    function targetLabel(target) {
        if (target.zone === "home") {
            return "home cell";
        }
        if (target.zone === "cell") {
            return "free cell";
        }
        return "tableau column";
    }

    function checkWin() {
        var collected = suitOrder.reduce(function (total, suit) {
            return total + homes[suit].length;
        }, 0);
        if (collected === 52) {
            finished = true;
            stopTimer();
            overlayNode.classList.remove("is-hidden");
            updateStatus("All four suits are complete. Well played.");
        }
    }

    function unavailableMoveStatus(source, target) {
        var cards = sourceCards(source);
        if (!easyMoves && target && target.zone === "tableau" &&
            isMovableSource(source) && cards.length > 1 &&
            !(source.zone === "tableau" && source.index === target.index)) {
            var destination = columns[target.index];
            var top = destination[destination.length - 1];
            var matchesDestination = !top ||
                (top.rank === cards[0].rank + 1 &&
                    suits[top.suit].red !== suits[cards[0].suit].red);
            var capacity = capacityForTableau(target.index);
            if (matchesDestination && cards.length > capacity) {
                return "Classic moves can carry " + capacity + " card" +
                    (capacity === 1 ? "" : "s") + " right now, but this run has " +
                    cards.length + ". Open a free cell or column, or turn on Easy Moves.";
            }
        }
        return "That move is not available.";
    }

    function moveCards(source, target) {
        if (finished || !canPlace(source, target)) {
            updateStatus(unavailableMoveStatus(source, target));
            return false;
        }
        history.push(copyState());
        startTimer();
        addCards(target, removeCards(source));
        moves += 1;
        selected = null;
        hinted = null;
        updateStatus("Moved to " + targetLabel(target) + ".");
        render();
        checkWin();
        return true;
    }

    function tryHome(source) {
        var cards = sourceCards(source);
        if (cards.length !== 1) {
            return false;
        }
        return moveCards(source, { zone: "home", index: suitOrder.indexOf(cards[0].suit) });
    }

    function undo() {
        if (!history.length) {
            return;
        }
        restoreState(history.pop());
        updateStatus("Previous move restored.");
    }

    function findHomeMove() {
        for (var cell = 0; cell < cells.length; cell += 1) {
            if (cells[cell] && canPlace({ zone: "cell", index: cell }, {
                zone: "home", index: suitOrder.indexOf(cells[cell].suit)
            })) {
                return { source: { zone: "cell", index: cell }, target: {
                    zone: "home", index: suitOrder.indexOf(cells[cell].suit)
                }};
            }
        }
        for (var column = 0; column < columns.length; column += 1) {
            if (!columns[column].length) {
                continue;
            }
            var source = { zone: "tableau", index: column, cardIndex: columns[column].length - 1 };
            var card = sourceCards(source)[0];
            var target = { zone: "home", index: suitOrder.indexOf(card.suit) };
            if (canPlace(source, target)) {
                return { source: source, target: target };
            }
        }
        return null;
    }

    function autoHome() {
        if (finished) {
            return;
        }
        var first = findHomeMove();
        if (!first) {
            updateStatus("No exposed cards can move home right now.");
            return;
        }
        history.push(copyState());
        startTimer();
        var count = 0;
        var candidate = first;
        while (candidate) {
            addCards(candidate.target, removeCards(candidate.source));
            count += 1;
            candidate = findHomeMove();
        }
        moves += count;
        selected = null;
        hinted = null;
        updateStatus("Sent " + count + " card" + (count === 1 ? "" : "s") + " home.");
        render();
        checkWin();
    }

    function findHint() {
        var homeMove = findHomeMove();
        if (homeMove) {
            return homeMove;
        }
        for (var sourceCell = 0; sourceCell < cells.length; sourceCell += 1) {
            if (!cells[sourceCell]) {
                continue;
            }
            for (var destination = 0; destination < columns.length; destination += 1) {
                if (canPlace({ zone: "cell", index: sourceCell }, { zone: "tableau", index: destination })) {
                    return {
                        source: { zone: "cell", index: sourceCell },
                        target: { zone: "tableau", index: destination }
                    };
                }
            }
        }
        for (var from = 0; from < columns.length; from += 1) {
            for (var cardIndex = columns[from].length - 1; cardIndex >= 0; cardIndex -= 1) {
                var source = { zone: "tableau", index: from, cardIndex: cardIndex };
                if (!isMovableSource(source)) {
                    continue;
                }
                for (var to = 0; to < columns.length; to += 1) {
                    var target = { zone: "tableau", index: to };
                    if (canPlace(source, target)) {
                        return { source: source, target: target };
                    }
                }
            }
        }
        for (var sourceColumn = 0; sourceColumn < columns.length; sourceColumn += 1) {
            if (!columns[sourceColumn].length) {
                continue;
            }
            for (var emptyCell = 0; emptyCell < cells.length; emptyCell += 1) {
                var topSource = {
                    zone: "tableau",
                    index: sourceColumn,
                    cardIndex: columns[sourceColumn].length - 1
                };
                if (canPlace(topSource, { zone: "cell", index: emptyCell })) {
                    return { source: topSource, target: { zone: "cell", index: emptyCell } };
                }
            }
        }
        return null;
    }

    function hint() {
        var move = findHint();
        if (!move) {
            updateStatus("No available move found.");
            return;
        }
        hinted = move;
        render();
        updateStatus("Highlighted cards show a suggested move.");
        if (hintTimer) {
            window.clearTimeout(hintTimer);
        }
        hintTimer = window.setTimeout(function () {
            hinted = null;
            render();
        }, 1700);
    }

    function sourceFromNode(node) {
        if (!node || !node.dataset.zone) {
            return null;
        }
        var source = { zone: node.dataset.zone, index: Number(node.dataset.index) };
        if (source.zone === "tableau") {
            source.cardIndex = Number(node.dataset.cardIndex);
        }
        return source;
    }

    function targetFromNode(node) {
        if (!node) {
            return null;
        }
        if (node.classList.contains("freecell-column")) {
            return { zone: "tableau", index: Number(node.dataset.index) };
        }
        if (node.classList.contains("freecell-slot")) {
            return { zone: node.dataset.zone, index: Number(node.dataset.index) };
        }
        var card = node.closest(".freecell-card");
        if (card) {
            return { zone: card.dataset.zone, index: Number(card.dataset.index) };
        }
        return null;
    }

    function cardNode(card, source, offset) {
        var node = document.createElement("button");
        var suit = suits[card.suit];
        node.type = "button";
        node.className = "freecell-card";
        node.dataset.zone = source.zone;
        node.dataset.index = source.index;
        if (source.zone === "tableau") {
            node.dataset.cardIndex = source.cardIndex;
            node.style.top = offset + "px";
            node.draggable = isMovableSource(source);
        } else {
            node.draggable = true;
        }
        if (suit.red) {
            node.classList.add("is-red");
        }
        if (selected && (sameSource(selected, source) ||
            (source.zone === "tableau" && selected.zone === "tableau" &&
                source.index === selected.index && source.cardIndex >= selected.cardIndex))) {
            node.classList.add("is-selected");
        }
        if (hinted && (sameSource(hinted.source, source) ||
            (source.zone === "tableau" && hinted.source.zone === "tableau" &&
                source.index === hinted.source.index && source.cardIndex >= hinted.source.cardIndex))) {
            node.classList.add("is-hint");
        }
        node.innerHTML = "<span class=\"freecell-card-corner\">" + rankText(card.rank) +
            "<small>" + suit.symbol + "</small></span><span class=\"freecell-card-center\">" +
            suit.symbol + "</span>";
        node.setAttribute("aria-label", rankText(card.rank) + " of " + suit.name);
        return node;
    }

    function renderCells() {
        cellsNode.innerHTML = "";
        cells.forEach(function (card, index) {
            var slot = document.createElement("div");
            slot.className = "freecell-slot";
            slot.dataset.zone = "cell";
            slot.dataset.index = index;
            slot.setAttribute("aria-label", "Free cell " + (index + 1));
            if (hinted && hinted.target.zone === "cell" && hinted.target.index === index) {
                slot.classList.add("is-hint");
            }
            if (card) {
                slot.appendChild(cardNode(card, { zone: "cell", index: index }));
            }
            cellsNode.appendChild(slot);
        });
    }

    function renderHomes() {
        homesNode.innerHTML = "";
        suitOrder.forEach(function (suit, index) {
            var pile = homes[suit];
            var slot = document.createElement("div");
            slot.className = "freecell-slot freecell-home";
            slot.dataset.zone = "home";
            slot.dataset.index = index;
            slot.innerHTML = "<span class=\"" + (suits[suit].red ? "is-red" : "") + "\">" +
                suits[suit].symbol + "</span>";
            if (hinted && hinted.target.zone === "home" && hinted.target.index === index) {
                slot.classList.add("is-hint");
            }
            if (pile.length) {
                slot.appendChild(cardNode(pile[pile.length - 1], { zone: "home", index: index }));
            }
            homesNode.appendChild(slot);
        });
    }

    function renderTableau() {
        tableauNode.innerHTML = "";
        columns.forEach(function (column, index) {
            var node = document.createElement("div");
            var offset = 0;
            node.className = "freecell-column";
            node.dataset.index = index;
            if (!column.length) {
                node.classList.add("is-empty");
            }
            if (hinted && hinted.target.zone === "tableau" && hinted.target.index === index) {
                node.classList.add("is-hint");
            }
            column.forEach(function (card, cardIndex) {
                node.appendChild(cardNode(card, {
                    zone: "tableau",
                    index: index,
                    cardIndex: cardIndex
                }, offset));
                offset += 38;
            });
            node.style.height = Math.max(480, offset + 150) + "px";
            tableauNode.appendChild(node);
        });
    }

    function render() {
        dealNode.textContent = "#" + String(currentDeal).padStart(5, "0");
        movesNode.textContent = moves;
        timeNode.textContent = timeText(seconds);
        undoButton.disabled = history.length === 0;
        easyButton.textContent = "Easy Moves: " + (easyMoves ? "On" : "Off");
        easyButton.setAttribute("aria-pressed", String(easyMoves));
        easyButton.classList.toggle("is-enabled", easyMoves);
        renderCells();
        renderHomes();
        renderTableau();
    }

    tableNode.addEventListener("click", function (event) {
        var cardNodeTarget = event.target.closest(".freecell-card");
        var destinationNode = event.target.closest(".freecell-column, .freecell-slot");
        if (finished) {
            return;
        }
        if (selected && destinationNode) {
            var destination = targetFromNode(destinationNode);
            if (moveCards(selected, destination)) {
                return;
            }
        }
        if (cardNodeTarget) {
            var source = sourceFromNode(cardNodeTarget);
            if (isMovableSource(source)) {
                selected = source;
                render();
                updateStatus("Card selected. Choose a destination.");
            }
        }
    });

    tableNode.addEventListener("dblclick", function (event) {
        var card = event.target.closest(".freecell-card");
        if (!card || finished) {
            return;
        }
        tryHome(sourceFromNode(card));
    });

    tableNode.addEventListener("dragstart", function (event) {
        var card = event.target.closest(".freecell-card");
        if (!card) {
            return;
        }
        var source = sourceFromNode(card);
        if (!isMovableSource(source)) {
            event.preventDefault();
            return;
        }
        selected = source;
        event.dataTransfer.setData("text/plain", source.zone + ":" + source.index);
        event.dataTransfer.effectAllowed = "move";
        card.classList.add("is-selected");
    });

    tableNode.addEventListener("dragover", function (event) {
        if (event.target.closest(".freecell-column, .freecell-slot")) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
        }
    });

    tableNode.addEventListener("drop", function (event) {
        var targetNode = event.target.closest(".freecell-column, .freecell-slot");
        if (!targetNode || !selected) {
            return;
        }
        event.preventDefault();
        moveCards(selected, targetFromNode(targetNode));
    });

    newButton.addEventListener("click", newGame);
    replayButton.addEventListener("click", function () {
        newGame(currentDeal);
    });
    againButton.addEventListener("click", newGame);
    undoButton.addEventListener("click", undo);
    hintButton.addEventListener("click", hint);
    autoButton.addEventListener("click", autoHome);
    easyButton.addEventListener("click", function () {
        easyMoves = !easyMoves;
        selected = null;
        hinted = null;
        render();
        updateStatus(easyMoves ?
            "Easy Moves enabled. Any valid alternating run can move together." :
            "Classic moves enabled. Multi-card runs need enough open free cells and empty columns.");
    });

    newGame();
})();
