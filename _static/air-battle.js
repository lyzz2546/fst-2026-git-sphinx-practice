(function () {
    var canvas = document.getElementById("air-battle-canvas");
    if (!canvas) {
        return;
    }
    document.documentElement.classList.add("air-battle-page");

    var shell = canvas.closest(".air-battle-shell");
    var stage = canvas.parentElement;
    var context = canvas.getContext("2d");
    var scoreNode = document.getElementById("air-battle-score");
    var hullNode = document.getElementById("air-battle-hull");
    var waveNode = document.getElementById("air-battle-wave");
    var overlay = document.getElementById("air-battle-overlay");
    var hint = document.getElementById("air-battle-hint");
    var startButton = document.getElementById("air-battle-start");
    var restartButton = document.getElementById("air-battle-restart");
    var ratio = window.devicePixelRatio || 1;
    var width = 0;
    var height = 0;
    var raf = null;
    var lastTime = 0;
    var fireHeld = false;
    var pointerSeen = false;

    var state = {
        running: false,
        score: 0,
        hull: 3,
        wave: 1,
        spawnClock: 0,
        cloudClock: 0,
        shake: 0
    };

    var player = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        radius: 21,
        shotClock: 0,
        invulnerable: 0
    };

    var bullets = [];
    var enemies = [];
    var particles = [];
    var clouds = [];

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    function resizeCanvas() {
        var bounds = stage.getBoundingClientRect();
        ratio = window.devicePixelRatio || 1;
        width = Math.max(320, Math.round(bounds.width));
        height = Math.max(460, Math.round(bounds.height));
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        context.setTransform(ratio, 0, 0, ratio, 0, 0);

        if (!pointerSeen) {
            player.x = width / 2;
            player.y = height - 86;
            player.targetX = player.x;
            player.targetY = player.y;
        }
    }

    function resetGame() {
        state.running = true;
        state.score = 0;
        state.hull = 3;
        state.wave = 1;
        state.spawnClock = 0.6;
        state.cloudClock = 0;
        state.shake = 0;
        bullets = [];
        enemies = [];
        particles = [];
        clouds = [];
        player.shotClock = 0;
        player.invulnerable = 0;
        player.x = width / 2;
        player.y = height - 86;
        player.targetX = player.x;
        player.targetY = player.y;
        pointerSeen = false;
        overlay.classList.add("is-hidden");
        showStartHint();
        updateHud();
        if (!raf) {
            lastTime = performance.now();
            raf = window.requestAnimationFrame(loop);
        }
    }

    function showStartHint() {
        if (!hint) {
            return;
        }
        hint.classList.remove("is-visible");
        void hint.offsetWidth;
        hint.classList.add("is-visible");
    }

    function updateHud() {
        scoreNode.textContent = state.score;
        hullNode.textContent = state.hull;
        waveNode.textContent = state.wave;
    }

    function playerHit() {
        if (player.invulnerable > 0 || !state.running) {
            return;
        }
        state.hull -= 1;
        player.invulnerable = 1.2;
        state.shake = 0.24;
        burst(player.x, player.y, "#f59f56", 18, 0.85);
        updateHud();
        if (state.hull <= 0) {
            finishGame();
        }
    }

    function finishGame() {
        state.running = false;
        fireHeld = false;
        overlay.querySelector("h2").textContent = "Flight ended";
        startButton.textContent = "Fly again";
        overlay.classList.remove("is-hidden");
    }

    function spawnEnemy() {
        var sturdy = Math.random() < Math.min(0.18 + state.wave * 0.02, 0.42);
        enemies.push({
            x: random(34, width - 34),
            y: -54,
            radius: sturdy ? 24 : 18,
            speed: random(76, 122) + state.wave * 8,
            drift: random(-24, 24),
            turn: random(1.2, 2.8),
            phase: random(0, Math.PI * 2),
            hp: sturdy ? 2 : 1,
            value: sturdy ? 24 : 12,
            sturdy: sturdy
        });
    }

    function shoot() {
        bullets.push({
            x: player.x - 10,
            y: player.y - 28,
            radius: 4,
            speed: 440
        });
        bullets.push({
            x: player.x + 10,
            y: player.y - 28,
            radius: 4,
            speed: 440
        });
    }

    function burst(x, y, color, count, force) {
        for (var index = 0; index < count; index += 1) {
            var angle = random(0, Math.PI * 2);
            var speed = random(30, 150) * force;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: random(2, 6),
                life: random(0.28, 0.8),
                color: color
            });
        }
    }

    function addCloud() {
        clouds.push({
            x: random(-40, width + 40),
            y: -90,
            size: random(70, 160),
            speed: random(18, 42),
            alpha: random(0.08, 0.22)
        });
    }

    function collides(first, second) {
        var dx = first.x - second.x;
        var dy = first.y - second.y;
        var range = first.radius + second.radius;
        return dx * dx + dy * dy <= range * range;
    }

    function update(dt) {
        state.wave = 1 + Math.floor(state.score / 180);
        state.spawnClock -= dt;
        state.cloudClock -= dt;
        player.shotClock -= dt;
        player.invulnerable = Math.max(0, player.invulnerable - dt);
        state.shake = Math.max(0, state.shake - dt);

        if (state.spawnClock <= 0) {
            spawnEnemy();
            state.spawnClock = Math.max(0.32, random(0.62, 1.18) - state.wave * 0.05);
        }

        if (state.cloudClock <= 0) {
            addCloud();
            state.cloudClock = random(0.7, 1.5);
        }

        player.x += (player.targetX - player.x) * Math.min(1, dt * 12);
        player.y += (player.targetY - player.y) * Math.min(1, dt * 12);
        player.x = clamp(player.x, 28, width - 28);
        player.y = clamp(player.y, 56, height - 44);

        if (fireHeld && player.shotClock <= 0) {
            shoot();
            player.shotClock = 0.16;
        }

        bullets.forEach(function (bullet) {
            bullet.y -= bullet.speed * dt;
        });
        bullets = bullets.filter(function (bullet) {
            return bullet.y > -28;
        });

        enemies.forEach(function (enemy) {
            enemy.phase += enemy.turn * dt;
            enemy.y += enemy.speed * dt;
            enemy.x += Math.sin(enemy.phase) * enemy.drift * dt;
            enemy.x = clamp(enemy.x, enemy.radius, width - enemy.radius);
        });

        bullets.forEach(function (bullet) {
            enemies.forEach(function (enemy) {
                if (bullet.dead || enemy.dead || !collides(bullet, enemy)) {
                    return;
                }
                bullet.dead = true;
                enemy.hp -= 1;
                burst(bullet.x, bullet.y, "#9be4ff", 6, 0.5);
                if (enemy.hp <= 0) {
                    enemy.dead = true;
                    state.score += enemy.value;
                    burst(enemy.x, enemy.y, enemy.sturdy ? "#ffb35e" : "#ff6c78", enemy.sturdy ? 24 : 16, 1);
                }
            });
        });
        bullets = bullets.filter(function (bullet) {
            return !bullet.dead;
        });

        enemies.forEach(function (enemy) {
            if (!enemy.dead && collides(enemy, player)) {
                enemy.dead = true;
                burst(enemy.x, enemy.y, "#ff7a66", 20, 1);
                playerHit();
            }
            if (!enemy.dead && enemy.y - enemy.radius > height + 20) {
                enemy.dead = true;
                playerHit();
            }
        });
        enemies = enemies.filter(function (enemy) {
            return !enemy.dead;
        });

        particles.forEach(function (particle) {
            particle.life -= dt;
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.vy += 28 * dt;
        });
        particles = particles.filter(function (particle) {
            return particle.life > 0;
        });

        clouds.forEach(function (cloud) {
            cloud.y += cloud.speed * dt;
        });
        clouds = clouds.filter(function (cloud) {
            return cloud.y - cloud.size < height + 70;
        });
        updateHud();
    }

    function drawCloud(cloud) {
        context.save();
        context.globalAlpha = cloud.alpha;
        context.fillStyle = "#ffffff";
        context.beginPath();
        context.arc(cloud.x - cloud.size * 0.22, cloud.y, cloud.size * 0.28, 0, Math.PI * 2);
        context.arc(cloud.x + cloud.size * 0.04, cloud.y - cloud.size * 0.16, cloud.size * 0.38, 0, Math.PI * 2);
        context.arc(cloud.x + cloud.size * 0.32, cloud.y + cloud.size * 0.02, cloud.size * 0.3, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }

    function drawRoute() {
        var gradient = context.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#8bd4ff");
        gradient.addColorStop(0.55, "#d9f4ff");
        gradient.addColorStop(1, "#edfaff");
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);

        context.strokeStyle = "rgba(255, 255, 255, 0.34)";
        context.lineWidth = 2;
        context.setLineDash([22, 24]);
        context.lineDashOffset = -(performance.now() / 26);
        context.beginPath();
        context.moveTo(width * 0.5, -40);
        context.lineTo(width * 0.5, height + 40);
        context.stroke();
        context.setLineDash([]);

        clouds.forEach(drawCloud);
    }

    function drawPlayer() {
        context.save();
        context.translate(player.x, player.y);
        if (player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 === 0) {
            context.globalAlpha = 0.45;
        }
        context.shadowColor = "rgba(17, 66, 101, 0.3)";
        context.shadowBlur = 16;
        context.shadowOffsetY = 10;

        context.fillStyle = "#f9fdff";
        context.strokeStyle = "#143b5a";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(0, -36);
        context.bezierCurveTo(10, -31, 13, -10, 12, 20);
        context.bezierCurveTo(8, 28, 4, 35, 0, 39);
        context.bezierCurveTo(-4, 35, -8, 28, -12, 20);
        context.bezierCurveTo(-13, -10, -10, -31, 0, -36);
        context.closePath();
        context.fill();
        context.stroke();

        context.fillStyle = "#eaf2f8";
        context.beginPath();
        context.moveTo(-10, -5);
        context.lineTo(-46, 12);
        context.lineTo(-48, 22);
        context.lineTo(-11, 14);
        context.closePath();
        context.fill();
        context.stroke();

        context.beginPath();
        context.moveTo(10, -5);
        context.lineTo(46, 12);
        context.lineTo(48, 22);
        context.lineTo(11, 14);
        context.closePath();
        context.fill();
        context.stroke();

        context.fillStyle = "#23b64b";
        context.beginPath();
        context.moveTo(-7, 18);
        context.lineTo(-23, 36);
        context.lineTo(-8, 33);
        context.lineTo(0, 22);
        context.closePath();
        context.fill();
        context.stroke();

        context.fillStyle = "#163f94";
        context.beginPath();
        context.moveTo(7, 18);
        context.lineTo(23, 36);
        context.lineTo(8, 33);
        context.lineTo(0, 22);
        context.closePath();
        context.fill();
        context.stroke();

        context.fillStyle = "#1b64b6";
        context.beginPath();
        context.moveTo(-8, 4);
        context.lineTo(8, 4);
        context.lineTo(7, 22);
        context.lineTo(-7, 22);
        context.closePath();
        context.fill();

        context.fillStyle = "#8eb6d7";
        context.beginPath();
        context.ellipse(0, -25, 5, 9, 0, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = "#c71f2d";
        context.font = "700 8px Arial";
        context.textAlign = "center";
        context.fillText("C919", 0, -2);
        context.restore();
    }

    function drawBullet(bullet) {
        var glow = context.createLinearGradient(bullet.x, bullet.y - 16, bullet.x, bullet.y + 6);
        glow.addColorStop(0, "#ffffff");
        glow.addColorStop(1, "#48bfff");
        context.fillStyle = glow;
        context.shadowColor = "#4ed6ff";
        context.shadowBlur = 12;
        context.beginPath();
        context.roundRect(bullet.x - 3, bullet.y - 14, 6, 18, 4);
        context.fill();
        context.shadowBlur = 0;
    }

    function drawEnemy(enemy) {
        context.save();
        context.translate(enemy.x, enemy.y);
        context.rotate(Math.sin(enemy.phase) * 0.12);
        context.fillStyle = enemy.sturdy ? "#7d2434" : "#d83f58";
        context.strokeStyle = "#5f1323";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(0, 28);
        context.bezierCurveTo(10, 18, 12, -12, 0, -30);
        context.bezierCurveTo(-12, -12, -10, 18, 0, 28);
        context.closePath();
        context.fill();
        context.stroke();

        context.fillStyle = enemy.sturdy ? "#f4c56f" : "#ffcfda";
        context.beginPath();
        context.moveTo(-8, -4);
        context.lineTo(-35, -18);
        context.lineTo(-38, -8);
        context.lineTo(-10, 8);
        context.closePath();
        context.fill();
        context.stroke();

        context.beginPath();
        context.moveTo(8, -4);
        context.lineTo(35, -18);
        context.lineTo(38, -8);
        context.lineTo(10, 8);
        context.closePath();
        context.fill();
        context.stroke();
        context.restore();
    }

    function drawParticles() {
        particles.forEach(function (particle) {
            context.save();
            context.globalAlpha = clamp(particle.life * 1.8, 0, 1);
            context.fillStyle = particle.color;
            context.beginPath();
            context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            context.fill();
            context.restore();
        });
    }

    function render() {
        context.save();
        if (state.shake > 0) {
            context.translate(random(-6, 6) * state.shake, random(-6, 6) * state.shake);
        }
        drawRoute();
        bullets.forEach(drawBullet);
        enemies.forEach(drawEnemy);
        drawParticles();
        drawPlayer();
        context.restore();
    }

    function loop(time) {
        raf = null;
        var dt = Math.min(0.032, (time - lastTime) / 1000 || 0);
        lastTime = time;
        if (state.running) {
            update(dt);
        }
        render();
        raf = window.requestAnimationFrame(loop);
    }

    function movePlayer(event) {
        var rect = canvas.getBoundingClientRect();
        pointerSeen = true;
        player.targetX = clamp(event.clientX - rect.left, 28, width - 28);
        player.targetY = clamp(event.clientY - rect.top, 56, height - 44);
    }

    shell.addEventListener("pointerenter", function () {
        document.documentElement.classList.add("air-battle-aiming");
    });

    shell.addEventListener("pointerleave", function () {
        fireHeld = false;
        document.documentElement.classList.remove("air-battle-aiming");
    });

    canvas.addEventListener("pointermove", movePlayer);

    canvas.addEventListener("pointerdown", function (event) {
        if (event.button !== 0) {
            return;
        }
        canvas.setPointerCapture(event.pointerId);
        movePlayer(event);
        fireHeld = true;
        if (!state.running) {
            resetGame();
            return;
        }
        shoot();
        player.shotClock = 0.16;
    });

    canvas.addEventListener("pointerup", function (event) {
        if (event.button === 0) {
            fireHeld = false;
        }
    });

    startButton.addEventListener("click", resetGame);
    restartButton.addEventListener("click", resetGame);
    window.addEventListener("resize", resizeCanvas);

    resizeCanvas();
    render();
})();
