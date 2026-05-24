(function () {
    var canvas = document.getElementById("snake-canvas");
    if (!canvas) {
        return;
    }

    document.documentElement.classList.add("snake-page");

    var context = canvas.getContext("2d");
    var scoreNode = document.getElementById("snake-score");
    var bestNode = document.getElementById("snake-best");
    var levelNode = document.getElementById("snake-level");
    var messageNode = document.getElementById("snake-message");
    var overlayNode = document.getElementById("snake-overlay");
    var overlayTitleNode = document.getElementById("snake-overlay-title");
    var overlayMessageNode = document.getElementById("snake-overlay-message");
    var startButton = document.getElementById("snake-start");
    var newButton = document.getElementById("snake-new");
    var pauseButton = document.getElementById("snake-pause");
    var directionButtons = document.querySelectorAll("[data-direction]");
    var columns = 22;
    var rows = 18;
    var cell = 30;
    var snake = [];
    var food = null;
    var direction = { x: 1, y: 0 };
    var queuedDirection = { x: 1, y: 0 };
    var score = 0;
    var level = 1;
    var best = loadBest();
    var timer = null;
    var running = false;
    var paused = false;
    var ended = false;
    var touchStart = null;

    function loadBest() {
        try {
            return Number(window.localStorage.getItem("snake-best") || 0);
        } catch (error) {
            return 0;
        }
    }

    function saveBest() {
        try {
            window.localStorage.setItem("snake-best", String(best));
        } catch (error) {
            return;
        }
    }

    function speed() {
        return Math.max(72, 150 - (level - 1) * 13);
    }

    function updateStats() {
        if (score > best) {
            best = score;
            saveBest();
        }
        scoreNode.textContent = String(score);
        bestNode.textContent = String(best);
        levelNode.textContent = String(level);
    }

    function equalPosition(left, right) {
        return left.x === right.x && left.y === right.y;
    }

    function randomFood() {
        var empty = [];
        for (var y = 0; y < rows; y += 1) {
            for (var x = 0; x < columns; x += 1) {
                var point = { x: x, y: y };
                if (!snake.some(function (segment) { return equalPosition(segment, point); })) {
                    empty.push(point);
                }
            }
        }
        if (!empty.length) {
            return null;
        }
        return empty[Math.floor(Math.random() * empty.length)];
    }

    function stopTimer() {
        if (timer) {
            window.clearTimeout(timer);
            timer = null;
        }
    }

    function setOverlay(title, message, buttonText, visible) {
        overlayTitleNode.textContent = title;
        overlayMessageNode.textContent = message;
        startButton.textContent = buttonText;
        overlayNode.classList.toggle("is-hidden", !visible);
    }

    function resetGame() {
        stopTimer();
        snake = [
            { x: 10, y: 9 },
            { x: 9, y: 9 },
            { x: 8, y: 9 }
        ];
        direction = { x: 1, y: 0 };
        queuedDirection = { x: 1, y: 0 };
        food = randomFood();
        score = 0;
        level = 1;
        running = false;
        paused = false;
        ended = false;
        pauseButton.disabled = true;
        pauseButton.textContent = "Pause";
        updateStats();
        messageNode.textContent = "Arrow keys or WASD to turn. Space pauses the game.";
        setOverlay("Garden ready", "Use the arrow keys or WASD to guide the snake.", "Start", true);
        draw();
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
            overlayNode.classList.add("is-hidden");
            messageNode.textContent = "Collect fruit and avoid the hedge boundary and your own trail.";
            scheduleTick();
        }
    }

    function pauseGame() {
        if (!running || ended) {
            return;
        }
        paused = !paused;
        pauseButton.textContent = paused ? "Resume" : "Pause";
        if (paused) {
            stopTimer();
            setOverlay("Paused", "Take a breath, then return to the garden.", "Resume", true);
        } else {
            overlayNode.classList.add("is-hidden");
            scheduleTick();
        }
    }

    function turn(next) {
        if (next.x === -direction.x && next.y === -direction.y) {
            return;
        }
        queuedDirection = next;
        if (!running && !ended) {
            startGame();
        }
    }

    function scheduleTick() {
        stopTimer();
        if (running && !paused && !ended) {
            timer = window.setTimeout(tick, speed());
        }
    }

    function gameOver(won) {
        ended = true;
        running = false;
        stopTimer();
        pauseButton.disabled = true;
        if (won) {
            messageNode.textContent = "The whole garden is yours. Perfect run.";
            setOverlay("Board cleared!", "You filled every open space.", "Play Again", true);
        } else {
            messageNode.textContent = "Run ended. Start another route through the garden.";
            setOverlay("Game over", "Final score: " + score, "Play Again", true);
        }
    }

    function tick() {
        direction = queuedDirection;
        var head = {
            x: snake[0].x + direction.x,
            y: snake[0].y + direction.y
        };
        var eats = food && equalPosition(head, food);
        var body = eats ? snake : snake.slice(0, -1);
        var hitsWall = head.x < 0 || head.y < 0 || head.x >= columns || head.y >= rows;
        var hitsSelf = body.some(function (segment) { return equalPosition(segment, head); });
        if (hitsWall || hitsSelf) {
            gameOver(false);
            draw();
            return;
        }
        snake.unshift(head);
        if (eats) {
            score += 10;
            level = Math.floor(score / 50) + 1;
            food = randomFood();
            updateStats();
            if (!food) {
                gameOver(true);
            }
        } else {
            snake.pop();
        }
        draw();
        scheduleTick();
    }

    function roundedRect(x, y, width, height, radius) {
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
    }

    function drawGarden() {
        var gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, "#dff1bb");
        gradient.addColorStop(1, "#b5db9b");
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = "rgba(72, 118, 65, 0.09)";
        context.lineWidth = 1;
        for (var x = 0; x <= canvas.width; x += cell) {
            context.beginPath();
            context.moveTo(x + 0.5, 0);
            context.lineTo(x + 0.5, canvas.height);
            context.stroke();
        }
        for (var y = 0; y <= canvas.height; y += cell) {
            context.beginPath();
            context.moveTo(0, y + 0.5);
            context.lineTo(canvas.width, y + 0.5);
            context.stroke();
        }
        context.strokeStyle = "rgba(27, 89, 63, 0.48)";
        context.lineWidth = 6;
        roundedRect(3, 3, canvas.width - 6, canvas.height - 6, 8);
        context.stroke();
    }

    function drawFood() {
        if (!food) {
            return;
        }
        var cx = food.x * cell + cell / 2;
        var cy = food.y * cell + cell / 2 + 2;
        context.fillStyle = "#d8454f";
        context.beginPath();
        context.arc(cx - 5, cy, 8, 0, Math.PI * 2);
        context.arc(cx + 5, cy, 8, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = "#6b3c2a";
        context.fillRect(cx - 1, cy - 14, 3, 7);
        context.fillStyle = "#2b8753";
        context.beginPath();
        context.ellipse(cx + 7, cy - 12, 7, 3, -0.45, 0, Math.PI * 2);
        context.fill();
    }

    function drawSnake() {
        snake.forEach(function (segment, index) {
            var x = segment.x * cell + 3;
            var y = segment.y * cell + 3;
            var isHead = index === 0;
            context.fillStyle = isHead ? "#155f44" : (index % 2 ? "#30835d" : "#287752");
            roundedRect(x, y, cell - 6, cell - 6, isHead ? 9 : 7);
            context.fill();
            if (isHead) {
                var eyeX = direction.x === 0 ? 7 : (direction.x > 0 ? 17 : 7);
                var eyeYOne = direction.y === 0 ? 8 : (direction.y > 0 ? 17 : 7);
                var eyeYTwo = direction.y === 0 ? 17 : eyeYOne;
                var eyeXTwo = direction.x === 0 ? 17 : eyeX;
                context.fillStyle = "#f3fbef";
                context.beginPath();
                context.arc(x + eyeX, y + eyeYOne, 3.2, 0, Math.PI * 2);
                context.arc(x + eyeXTwo, y + eyeYTwo, 3.2, 0, Math.PI * 2);
                context.fill();
                context.fillStyle = "#102d28";
                context.beginPath();
                context.arc(x + eyeX, y + eyeYOne, 1.4, 0, Math.PI * 2);
                context.arc(x + eyeXTwo, y + eyeYTwo, 1.4, 0, Math.PI * 2);
                context.fill();
            }
        });
    }

    function draw() {
        drawGarden();
        drawFood();
        drawSnake();
    }

    function directionForKey(key) {
        var keys = {
            ArrowUp: { x: 0, y: -1 },
            KeyW: { x: 0, y: -1 },
            ArrowDown: { x: 0, y: 1 },
            KeyS: { x: 0, y: 1 },
            ArrowLeft: { x: -1, y: 0 },
            KeyA: { x: -1, y: 0 },
            ArrowRight: { x: 1, y: 0 },
            KeyD: { x: 1, y: 0 }
        };
        return keys[key];
    }

    document.addEventListener("keydown", function (event) {
        var next = directionForKey(event.code);
        if (next) {
            event.preventDefault();
            turn(next);
        } else if (event.code === "Space") {
            event.preventDefault();
            pauseGame();
        }
    });

    canvas.addEventListener("touchstart", function (event) {
        var touch = event.changedTouches[0];
        touchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });

    canvas.addEventListener("touchend", function (event) {
        if (!touchStart) {
            return;
        }
        var touch = event.changedTouches[0];
        var dx = touch.clientX - touchStart.x;
        var dy = touch.clientY - touchStart.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) {
            turn(Math.abs(dx) > Math.abs(dy) ?
                { x: dx > 0 ? 1 : -1, y: 0 } :
                { x: 0, y: dy > 0 ? 1 : -1 });
        }
        touchStart = null;
    }, { passive: true });

    directionButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            var values = {
                up: { x: 0, y: -1 },
                down: { x: 0, y: 1 },
                left: { x: -1, y: 0 },
                right: { x: 1, y: 0 }
            };
            turn(values[button.dataset.direction]);
        });
    });

    startButton.addEventListener("click", function () {
        if (paused) {
            pauseGame();
        } else {
            startGame();
        }
    });
    newButton.addEventListener("click", function () {
        resetGame();
        startGame();
    });
    pauseButton.addEventListener("click", pauseGame);

    resetGame();
})();
