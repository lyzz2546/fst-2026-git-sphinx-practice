(function () {
    if (!window.matchMedia || window.matchMedia("(pointer: coarse)").matches) {
        return;
    }

    function initC919Cursor() {
        if (!document.body) {
            return;
        }

        var cursor = document.createElement("div");
        cursor.className = "c919-cursor";
        cursor.setAttribute("aria-hidden", "true");
        cursor.innerHTML = [
            '<svg viewBox="0 0 112 68" xmlns="http://www.w3.org/2000/svg">',
            '<g fill="none" stroke="#143b5a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
            '<path d="M7 34 C20 26 43 22 66 25 C85 27 99 33 106 38 C91 42 72 44 49 42 C31 40 17 37 7 34Z" fill="#ffffff"/>',
            '<path d="M69 27 L92 9 L102 12 L84 36 Z" fill="#23b64b"/>',
            '<path d="M68 40 L96 52 L105 49 L79 36 Z" fill="#163f94"/>',
            '<path d="M33 31 L63 7 L73 9 L51 33 Z" fill="#f5f8fb"/>',
            '<path d="M38 38 L60 61 L70 59 L50 36 Z" fill="#eef4f8"/>',
            '<ellipse cx="63" cy="38" rx="6.2" ry="4.4" fill="#111b26"/>',
            '<ellipse cx="63" cy="38" rx="3.2" ry="2.2" fill="#dfe8f0" stroke="none"/>',
            '<ellipse cx="47" cy="29" rx="5.4" ry="3.8" fill="#111b26"/>',
            '<ellipse cx="47" cy="29" rx="2.7" ry="1.9" fill="#dfe8f0" stroke="none"/>',
            '<path d="M17 33 C20 30 24 29 29 29" stroke="#7b1d26"/>',
            '<path d="M31 33 H45" stroke="#be2c34"/>',
            '<path d="M34 30 H44" stroke="#be2c34"/>',
            '<path d="M54 33 C61 34 68 35 76 35" stroke="#1b64b6"/>',
            '<path d="M79 34 C87 34 94 36 101 38" stroke="#23b64b"/>',
            '</g>',
            '<text x="29" y="39" font-size="10" font-family="Arial, sans-serif" font-weight="700" fill="#c71f2d">C919</text>',
            '</svg>'
        ].join("");

        document.documentElement.classList.add("c919-cursor-active");
        document.body.appendChild(cursor);

        var direction = 1;
        var lastX = null;
        var lastY = null;
        var ticking = false;

        function render() {
            ticking = false;
            if (lastX === null || lastY === null) {
                return;
            }
            cursor.style.transform =
                "translate3d(" + (lastX - 18) + "px, " + (lastY - 17) + "px, 0) scaleX(" + direction + ")";
            cursor.classList.add("is-visible");
        }

        document.addEventListener("mousemove", function (event) {
            if (lastX !== null) {
                var dx = event.clientX - lastX;
                if (Math.abs(dx) > 1) {
                    direction = dx < 0 ? 1 : -1;
                }
            }

            lastX = event.clientX;
            lastY = event.clientY;

            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(render);
            }
        });

        document.addEventListener("mouseleave", function () {
            cursor.classList.remove("is-visible");
            cursor.classList.remove("is-pressed");
        });

        document.addEventListener("pointerdown", function (event) {
            if (event.button === 0) {
                cursor.classList.add("is-pressed");
            }
        });

        document.addEventListener("pointerup", function (event) {
            if (event.button === 0) {
                cursor.classList.remove("is-pressed");
            }
        });

        document.addEventListener("pointercancel", function () {
            cursor.classList.remove("is-pressed");
        });

        window.addEventListener("blur", function () {
            cursor.classList.remove("is-pressed");
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initC919Cursor);
    } else {
        initC919Cursor();
    }
})();
