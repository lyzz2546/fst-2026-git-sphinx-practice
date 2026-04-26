# Process

This page records the complete process of building and deploying this Sphinx-based static personal website.

---

## 1. Objective

The goal of this assignment was to create and deploy a static personal website using Sphinx, Markdown, Git, and GitHub.  
The website serves as a platform to present course assignments, including Assignment 1, in a structured and readable format.

---

## 2. Website Setup and Development

I used **Sphinx** as the static site generator and Markdown for writing content.

### Steps followed:

1. Created a GitHub repository for the project.
2. Initialized a local Git project and linked it to the remote repository.
3. Created a Sphinx documentation project using:

```bash
sphinx-quickstart
```

4. Generated the basic project structure:
   - docs-web/source
   - conf.py
   - index.rst
   - Makefile / make.bat

5. Enabled Markdown support by installing MyST parser:

```bash
pip install myst-parser
```

6. Updated conf.py to support Markdown files:

```python
extensions = ['myst_parser']

source_suffix = {
    '.rst': 'restructuredtext',
    '.md': 'markdown',
}
```

7. Created multiple Markdown pages:
   - about.md
   - assignments.md
   - assignment_1.md
   - process.md
   - contact.md

8. Configured navigation structure in index.rst using toctree.

9. Built the website locally:

```bash
make html
```

10. Verified the generated HTML pages in:

docs-web/build/html/index.html

---

## 3. Git Version Control

Git was used to track changes and manage the development process.

Typical workflow:

```bash
git add -A
git commit -m "update website content"
git push origin main
```

Each commit represents a meaningful update, such as adding pages, fixing structure, or improving content.

### Version Update Log

#### Version 1: Initial Website Setup

The first version focused on building the basic structure of the website.  
In this version, the Sphinx project was initialized, the main pages were created.

Main updates:

- Built the initial Sphinx-based static website.
- Added basic pages such as About, Assignments, Process, and Contact.

#### Version 2: Website Structure Improvement

Assignment 1 was added to the website.

Main updates:

- Integrated Assignment 1 into the website.

#### Version 3: Website Structure Improvement

The third version focused on improving the page organization and navigation structure.  
In the second version, Assignment 1 also appeared directly on the main page navigation, which made the website structure less clear.  
This version adjusted the navigation format so that Assignment 1 can be accessed through the Assignments page instead of being displayed separately on the homepage.

Main updates:

- Modified the website navigation structure.
- Improved the display format of the homepage.
- Organized Assignment 1 under the Assignments section.
- Made the website structure closer to the intended folder-style organization.

#### Version 4: Website Structure Improvement

Used Git to manage version control and deployed the static website via GitHub Pages.

#### Version 5: Website Structure Improvement

Initially create a version of the page using sphinx

#### Future Updates

Future updates will follow the same format:

- Version number
- Update objective
- Main changes
- Brief explanation of the improvement

---

## 4. Integration of Previous Work

Assignment 1 was integrated into the website as a separate page.

It includes:

- Complete report written in Markdown
- Python implementation of matrix multiplication
- System configuration details
- Algorithm verification and conclusion

The page is linked in the Assignments section for easy navigation.

---

## 5. Tools and Technologies Used

- Sphinx — static site generator  
- MyST Parser — Markdown support in Sphinx  
- Markdown — content writing  
- Git — version control  
- GitHub — remote repository hosting  
- VS Code — code editing  

---

## 6. Challenges and Learnings

During the development process, several challenges were encountered:

- Understanding how Sphinx handles Markdown and navigation
- Configuring toctree correctly to include all pages
- Fixing warnings related to missing document titles
- Learning how static site generation works

These issues helped deepen my understanding of:

- Documentation systems
- Static website workflows
- Project organization using Git

---

## 7. Conclusion

This assignment helped me learn how to:

- Build a static website using Sphinx
- Organize technical content using Markdown
- Manage a project with Git and GitHub
- Integrate previous assignments into a structured website

It provided practical experience in documentation and software tools commonly used in development projects.

---

## 8. References

- Sphinx Documentation: https://www.sphinx-doc.org/
- MyST Parser: https://myst-parser.readthedocs.io/
- Markdown Guide: https://www.markdownguide.org/
- Git Documentation: https://git-scm.com/docs