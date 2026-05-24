# Game

<section class="game-library">
  <p class="page-kicker">Mini Games</p>
  <p>A small game corner for the website. Six browser games are ready to play.</p>
</section>

<section class="game-grid" id="game-grid">
  <article class="game-card game-card-live" data-game-page="1">
    <span class="card-status">Playable</span>
    <h2>Air Battle</h2>
    <p>A C919-inspired arcade shooter with a sky route, enemy aircraft, and live score tracking.</p>
    <a href="air_battle.html">Launch game</a>
  </article>

  <article class="game-card game-card-minesweeper" data-game-page="1">
    <span class="card-status">Playable</span>
    <h2>Minesweeper</h2>
    <p>A classic grid puzzle with mines, flags, timer, difficulty levels, and first-click safety.</p>
    <a href="minesweeper.html">Launch game</a>
  </article>

  <article class="game-card game-card-2048" data-game-page="1">
    <span class="card-status">Playable</span>
    <h2>2048</h2>
    <p>Slide numbered tiles, merge matching values, and build a 2048 tile.</p>
    <a href="game_2048.html">Launch game</a>
  </article>

  <article class="game-card game-card-spider" data-game-page="1">
    <span class="card-status">Playable</span>
    <h2>Spider Solitaire</h2>
    <p>Build suited sequences on a classic card table with three difficulty levels.</p>
    <a href="spider_solitaire.html">Launch game</a>
  </article>

  <article class="game-card game-card-freecell" data-game-page="1">
    <span class="card-status">Playable</span>
    <span class="freecell-preview-cards" aria-hidden="true">
      <span class="is-red">A&hearts;</span>
      <span class="is-black">&spades;K</span>
    </span>
    <h2>FreeCell</h2>
    <p>Use four open cells to arrange every suit from Ace through King.</p>
    <a href="freecell.html">Launch game</a>
  </article>

  <article class="game-card game-card-snake" data-game-page="1">
    <span class="card-status">Playable</span>
    <span class="snake-card-preview" aria-hidden="true"><i></i><i></i><i></i><b></b></span>
    <h2>Snake</h2>
    <p>Guide a growing snake through a garden board and collect fruit for a high score.</p>
    <a href="snake.html">Launch game</a>
  </article>

  <article class="game-card game-card-muted is-page-hidden" data-game-page="2">
    <span class="card-status">Next</span>
    <h2>Coming Soon</h2>
    <p>This space is reserved for another small browser game.</p>
  </article>
</section>

<nav class="game-pagination" aria-label="Game pages">
  <button class="is-active" type="button" data-game-page-button="1" aria-current="page">1</button>
  <button type="button" data-game-page-button="2">2</button>
</nav>

<script src="_static/game-library.js"></script>
