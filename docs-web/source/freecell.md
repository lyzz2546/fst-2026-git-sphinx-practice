# FreeCell

<section class="freecell-shell">
  <div class="freecell-toolbar">
    <div class="freecell-title">
      <p class="page-kicker">Classic Solitaire</p>
      <p>Move every suit to its home cell from Ace to King.</p>
    </div>
    <div class="freecell-stats" aria-label="Game statistics">
      <span><small>Deal</small><strong id="freecell-deal">#00000</strong></span>
      <span><small>Moves</small><strong id="freecell-moves">0</strong></span>
      <span><small>Time</small><strong id="freecell-time">00:00</strong></span>
    </div>
    <div class="freecell-actions">
      <button id="freecell-new" class="is-primary" type="button">New Game</button>
      <button id="freecell-replay" type="button">Replay Deal</button>
      <button id="freecell-undo" type="button" disabled>Undo</button>
      <button id="freecell-hint" type="button">Hint</button>
      <button id="freecell-auto" type="button">Auto Home</button>
      <button id="freecell-easy" type="button" aria-pressed="false">Easy Moves: Off</button>
    </div>
  </div>

  <div class="freecell-table">
    <div class="freecell-upper-board">
      <section class="freecell-zone">
        <p>Free Cells</p>
        <div class="freecell-cells" id="freecell-cells" aria-label="Free cells"></div>
      </section>
      <section class="freecell-zone">
        <p>Home Cells</p>
        <div class="freecell-homes" id="freecell-homes" aria-label="Home cells"></div>
      </section>
    </div>
    <div class="freecell-tableau" id="freecell-tableau" aria-label="FreeCell tableau"></div>
    <div class="freecell-overlay is-hidden" id="freecell-overlay">
      <p class="page-kicker">FreeCell</p>
      <h2>You Win!</h2>
      <p>All four suits are home.</p>
      <button id="freecell-play-again" type="button">Play Again</button>
    </div>
  </div>
  <p class="freecell-help">Build downward in alternating colors. Classic moves require open free cells or empty columns to carry a run; turn on <strong>Easy Moves</strong> to move any valid run together.</p>
  <p class="freecell-status" id="freecell-status">Each new game uses a known-solvable classic deal. Arrange cards in alternating colors.</p>
</section>

<script src="_static/freecell.js"></script>
