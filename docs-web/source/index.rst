.. Git Practice Docs documentation master file, created by
   sphinx-quickstart on Fri Apr  3 15:31:33 2026.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

My Personal Website
===================

.. raw:: html

   <section class="hero">
     <div class="hero-text">
       <p class="hello">Hi, welcome to my website</p>
       <h1>My Assignment Blog</h1>
       <p class="subtitle">A static personal website built with Furo, Markdown, Git and GitHub Pages.</p>
       <div class="hero-buttons">
         <a href="about.html">About Me</a>
         <a href="assignments.html">View Assignments</a>
         <a href="contact.html">View Contact</a>
       </div>
     </div>
   </section>

.. raw:: html

   <section class="cards">
     <div class="card">
       <h2>About Me</h2>
       <p>Basic personal information and learning background.</p>
       <a href="about.html">Read more →</a>
     </div>
     <div class="card">
       <h2>Assignments</h2>
       <p>Course assignments and project reports.</p>
       <a href="assignments.html">View work →</a>
     </div>
     <div class="card">
       <h2>Contact</h2>
       <p>Ways to get in touch with me.</p>
       <a href="contact.html">Contact me →</a>
     </div>
   </section>

.. toctree::
   :maxdepth: 1
   :hidden:

   about
   assignments
   contact