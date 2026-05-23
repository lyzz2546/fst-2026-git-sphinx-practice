# Minesweeper

<section class="minesweeper-shell">
  <div class="minesweeper-toolbar" aria-label="Minesweeper controls">
    <div class="minesweeper-difficulty" role="group" aria-label="Difficulty">
      <button class="is-active" type="button" data-level="beginner">Beginner (9 x 9)</button>
      <button type="button" data-level="intermediate">Intermediate (16 x 16)</button>
      <button type="button" data-level="expert">Expert (16 x 30)</button>
    </div>
    <div class="minesweeper-status">
      <span class="minesweeper-counter" id="mine-counter">010</span>
      <button class="minesweeper-face" id="minesweeper-reset" type="button" aria-label="Restart">:)</button>
      <span class="minesweeper-counter" id="mine-timer">000</span>
    </div>
  </div>
  <div class="minesweeper-board-wrap">
    <div class="minesweeper-board" id="minesweeper-board" aria-label="Minesweeper board"></div>
  </div>
  <p class="minesweeper-message" id="minesweeper-message">Left click to reveal. Right click to place a flag. Press both mouse buttons on a number to open safe neighbors.</p>
</section>

<script src="_static/minesweeper.js"></script>
