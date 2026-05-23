# Air Battle

<section class="air-battle-shell">
  <div class="air-battle-toolbar" aria-label="Air Battle status">
    <div class="air-battle-stat">
      <span>Score</span>
      <strong id="air-battle-score">0</strong>
    </div>
    <div class="air-battle-stat">
      <span>Hull</span>
      <strong id="air-battle-hull">3</strong>
    </div>
    <div class="air-battle-stat">
      <span>Wave</span>
      <strong id="air-battle-wave">1</strong>
    </div>
    <button id="air-battle-restart" type="button">Restart</button>
  </div>
  <div class="air-battle-stage">
    <canvas id="air-battle-canvas" aria-label="Air Battle game canvas"></canvas>
    <div class="air-battle-hint" id="air-battle-hint">Hold the left mouse button to shoot</div>
    <div class="air-battle-overlay" id="air-battle-overlay">
      <p class="page-kicker">Air Battle</p>
      <h2>Sky patrol ready</h2>
      <button id="air-battle-start" type="button">Start</button>
    </div>
  </div>
</section>

<script src="_static/air-battle.js"></script>
