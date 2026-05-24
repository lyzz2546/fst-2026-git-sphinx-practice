(function () {
    var grid = document.getElementById("game-grid");
    if (!grid) {
        return;
    }

    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-game-page]"));
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-game-page-button]"));

    function showPage(page) {
        cards.forEach(function (card) {
            var visible = Number(card.dataset.gamePage) === page;
            card.classList.toggle("is-page-hidden", !visible);
            card.hidden = !visible;
        });
        buttons.forEach(function (button) {
            var active = Number(button.dataset.gamePageButton) === page;
            button.classList.toggle("is-active", active);
            if (active) {
                button.setAttribute("aria-current", "page");
            } else {
                button.removeAttribute("aria-current");
            }
        });
    }

    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            showPage(Number(button.dataset.gamePageButton));
        });
    });

    showPage(1);
})();
