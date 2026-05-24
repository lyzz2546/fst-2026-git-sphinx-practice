# Snake

<section class="snake-shell">
  <div class="snake-toolbar" aria-label="Snake controls and score">
    <div class="snake-heading">
      <p class="page-kicker">Garden Run</p>
      <p>Collect fruit and keep growing.</p>
    </div>
    <div class="snake-stats" aria-label="Snake statistics">
      <span><small>Score</small><strong id="snake-score">0</strong></span>
      <span><small>Best</small><strong id="snake-best">0</strong></span>
      <span><small>Speed</small><strong id="snake-level">1</strong></span>
    </div>
    <div class="snake-actions">
      <button class="is-primary" id="snake-new" type="button">New Game</button>
      <button id="snake-pause" type="button" disabled>Pause</button>
    </div>
  </div>

  <div class="snake-stage">
    <canvas id="snake-canvas" width="660" height="540" aria-label="Snake game board"></canvas>
    <div class="snake-overlay" id="snake-overlay">
      <p class="page-kicker">Snake</p>
      <h2 id="snake-overlay-title">Garden ready</h2>
      <p id="snake-overlay-message">Use the arrow keys or WASD to guide the snake.</p>
      <button id="snake-start" type="button">Start</button>
    </div>
  </div>

  <div class="snake-dpad" aria-label="Direction controls">
    <button type="button" data-direction="up" aria-label="Move up">Up</button>
    <div>
      <button type="button" data-direction="left" aria-label="Move left">Left</button>
      <button type="button" data-direction="down" aria-label="Move down">Down</button>
      <button type="button" data-direction="right" aria-label="Move right">Right</button>
    </div>
  </div>
  <p class="snake-message" id="snake-message">Arrow keys or WASD to turn. Space pauses the game.</p>
</section>

<script src="_static/snake.js"></script>
