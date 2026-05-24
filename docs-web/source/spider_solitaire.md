# Spider Solitaire

<section class="spider-shell">
  <div class="spider-toolbar">
    <div class="spider-levels" role="group" aria-label="Difficulty">
      <button class="is-active" data-spider-suits="1" type="button">Easy <span>1 Suit</span></button>
      <button data-spider-suits="2" type="button">Medium <span>2 Suits</span></button>
      <button data-spider-suits="4" type="button">Expert <span>4 Suits</span></button>
    </div>
    <div class="spider-stats" aria-label="Game statistics">
      <span><small>Score</small><strong id="spider-score">500</strong></span>
      <span><small>Moves</small><strong id="spider-moves">0</strong></span>
      <span><small>Time</small><strong id="spider-time">00:00</strong></span>
    </div>
    <div class="spider-actions">
      <button id="spider-new" type="button">New Game</button>
      <button id="spider-undo" type="button" disabled>Undo</button>
      <button id="spider-hint" type="button">Hint</button>
    </div>
  </div>

  <div class="spider-table">
    <div class="spider-rail">
      <div class="spider-foundations" id="spider-foundations" aria-label="Completed suits"></div>
      <button class="spider-stock" id="spider-stock" type="button" title="Deal a new row of cards">
        <span class="spider-stock-cards" aria-hidden="true"></span>
        <strong id="spider-deals-left">Deals: 5</strong>
      </button>
    </div>
    <div class="spider-notice" id="spider-notice" role="status" aria-live="polite"></div>
    <div class="spider-tableau" id="spider-tableau" aria-label="Card table"></div>
    <div class="spider-overlay is-hidden" id="spider-overlay">
      <p class="page-kicker">Spider Solitaire</p>
      <h2 id="spider-overlay-title">You Win!</h2>
      <button id="spider-play-again" type="button">Play Again</button>
    </div>
  </div>
  <p class="spider-status" id="spider-status">Arrange eight complete suited sequences from King down to Ace. A new deal requires every column to contain a card.</p>
</section>

<script src="_static/spider-solitaire.js"></script>
