.. Git Practice Docs documentation master file, created by
   sphinx-quickstart on Fri Apr  3 15:31:33 2026.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Yang Zhanxiang's Coursework Site
================================

.. raw:: html

   <section class="course-hero">
     <p class="page-kicker">Fundamentals of Software Technology</p>
     <p class="course-intro">
       This static website collects my course reports, Git practice notes, and the process of building a small documentation site with Sphinx and Markdown. It also includes a small game corner where visitors can try simple browser games.
     </p>
     <div class="course-meta" aria-label="Course website details">
       <span><strong>Student</strong> Yang Zhanxiang</span>
       <span><strong>Student ID</strong> ZY2557211</span>
       <span><strong>Deployment</strong> GitHub Pages</span>
     </div>
     <div class="course-actions">
       <a class="is-primary" href="assignments.html">View Assignments</a>
       <a href="about.html">About Me</a>
       <a href="contact.html">Contact</a>
       <a class="is-primary" href="game.html">Game</a>
     </div>
   </section>

   <section class="home-showcase" aria-label="Assignment highlights">
     <article class="showcase-card">
       <span class="card-status">Report</span>
       <h2>Assignment 1</h2>
       <p>Matrix multiplication implementation, system configuration, and algorithm verification.</p>
       <a href="assignment_1.html">Open report</a>
     </article>
     <article class="showcase-card">
       <span class="card-status">Website</span>
       <h2>Assignment 2</h2>
       <p>The Sphinx website setup, Markdown organization, Git workflow, and deployment notes.</p>
       <a href="process.html">View process</a>
     </article>
     <article class="showcase-card">
       <span class="card-status">AI Agents</span>
       <h2>Assignment 3</h2>
       <p>Online API use, Ollama local model deployment, and VS Code integration.</p>
       <a href="assignment_3.html">Open report</a>
     </article>
   </section>

.. toctree::
   :maxdepth: 1
   :caption: Contents:

   about
   assignments
   contact
   game

.. toctree::
   :hidden:

   assignment_1
   assignment_3
   air_battle
   minesweeper
   game_2048
   spider_solitaire
   freecell
   snake
   tetris
   process
