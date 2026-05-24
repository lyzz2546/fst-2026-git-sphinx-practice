# Tetris

<section class="tetris-shell">
  <div class="tetris-toolbar">
    <div class="tetris-title">
      <p class="page-kicker">Falling Blocks</p>
      <p>Clear lines, manage the queue, and chase a high score.</p>
    </div>
    <div class="tetris-stats" aria-label="Tetris statistics">
      <span><small>Score</small><strong id="tetris-score">0</strong></span>
      <span><small>Best</small><strong id="tetris-best">0</strong></span>
      <span><small>Lines</small><strong id="tetris-lines">0</strong></span>
      <span><small>Level</small><strong id="tetris-level">1</strong></span>
    </div>
    <div class="tetris-actions">
      <button class="is-primary" id="tetris-new" type="button">New Game</button>
      <button id="tetris-pause" type="button" disabled>Pause</button>
    </div>
  </div>

  <div class="tetris-arena">
    <aside class="tetris-panel tetris-hold-panel">
      <p>Hold</p>
      <canvas id="tetris-hold" width="116" height="92" aria-label="Held tetromino"></canvas>
      <dl class="tetris-guide">
        <dt>Move</dt><dd>Arrow keys</dd>
        <dt>Rotate</dt><dd>Up / Z</dd>
        <dt>Drop</dt><dd>Space</dd>
        <dt>Hold</dt><dd>C</dd>
      </dl>
    </aside>
    <div class="tetris-stage">
      <canvas id="tetris-canvas" width="300" height="600" aria-label="Tetris playfield"></canvas>
      <div class="tetris-overlay" id="tetris-overlay">
        <p class="page-kicker">Tetris</p>
        <h2 id="tetris-overlay-title">Ready to stack?</h2>
        <p id="tetris-overlay-message">Move and rotate falling blocks to complete lines.</p>
        <button id="tetris-start" type="button">Start</button>
      </div>
    </div>
    <aside class="tetris-panel tetris-next-panel">
      <p>Next</p>
      <canvas id="tetris-next" width="116" height="336" aria-label="Next tetrominoes"></canvas>
    </aside>
  </div>

  <div class="tetris-touch" aria-label="Touch controls">
    <button type="button" data-tetris-control="hold">Hold</button>
    <button type="button" data-tetris-control="rotate-left">Rotate L</button>
    <button type="button" data-tetris-control="rotate-right">Rotate R</button>
    <button type="button" data-tetris-control="left">Left</button>
    <button type="button" data-tetris-control="down">Down</button>
    <button type="button" data-tetris-control="right">Right</button>
    <button class="is-wide" type="button" data-tetris-control="drop">Hard Drop</button>
  </div>
  <p class="tetris-message" id="tetris-message">Arrow keys move. Up or X rotates, Z rotates back, Space drops, C holds, and P pauses.</p>
</section>

<script src="_static/tetris.js"></script>
