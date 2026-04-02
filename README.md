# Git & Sphinx Multi-environment Collaboration Workflow

This practice is designed to help you get familiar with basic Git operations (`add`, `commit`, `push`, `pull`), learn how to change remote repository addresses, and experience a collaborative workflow by alternating between your local computer and a remote workstation. Additionally, you will build and configure a Sphinx documentation project with Markdown support from scratch.

## Prerequisite: Git Global Configuration

If this is your first time using Git, you must configure your Git username and email before doing anything else; otherwise, your `git commit` will fail.

For details and specific commands, please **first read the [git-tutorial.md](git-tutorial.md)** included in this repository (refer to the "2. Initial Setup" section). The tutorial also covers core Git concepts. You can refer back to it anytime you forget a command.

---

## Task 1: Prepare Your Own Remote Repository & Modify the Remote

Since you have cloned a public course repository, you need to link it to your own remote repository to push your assignments.

1. **Register/Login to a remote Git server**:
   - Option 1: *(Alternative)* You can also use your own GitHub / GitLab / Gitee account.
   - Option 2: Internal GitLab: Visit `http://10.62.192.92:11080/` to register. After registering, please contact **Haoxuan Li** to activate your account.
2. **Create a new repository**: Create a new, empty project in your Git account. **DO NOT** initialize it with a README, `.gitignore`, or License.
3. **Modify the Remote address on BOTH devices**:
   On **both** your local computer and our remote workstation, navigate to the cloned project folder in the terminal and replace the default origin with your newly created repository address:
   ```bash
   # Remove the original course repository origin
   git remote remove origin
   
   # Add your own repository as the new origin
   git remote add origin <YOUR-NEW-REPOSITORY-URL(HTTP/SSH)>
   ```

## Task 2: Local Environment Initialization & First Commit

We will start building the Sphinx project from your **local computer**.

1. **Install necessary Python packages**:
   Run the following in your local environment (if using Conda, make sure the environment is activated):
   ```bash
   pip install sphinx sphinx-rtd-theme sphinx-markdown-tables myst-parser
   ```
2. **Initialize the Sphinx project**:
   In the project root directory, run:
   ```bash
   sphinx-quickstart
   ```
   Answer the questions as prompted (you can press Enter for most default values; fill in your own info for Project name and Author name).
3. **Make the first Commit and Push**:
   Once initialized, we will commit these basic files and push them to your remote repository:
   ```bash
   git status               # Check status; you will see many untracked red files
   git add .                # Stage all files
   git commit -m "docs: initialize basic sphinx project"
   git push -u origin main  # If your default branch is master, change 'main' to 'master'
   ```

## Task 3: Local Markdown Configuration & Second Commit

By default, Sphinx only supports reStructuredText (`.rst`). We need to modify the configuration to support Markdown and the Read the Docs theme.

1. **Modify configuration file**: Open `conf.py` (still on your local computer), find the corresponding sections, and add/modify the following variables (**DO NOT just overwrite the whole file; merge these into the existing config**):
   ```python
   extensions = [
       'sphinx.ext.autodoc',
       'sphinx.ext.viewcode',
       'sphinx.ext.napoleon',
       'sphinx_rtd_theme',
       'sphinx_markdown_tables',
       'myst_parser',
   ]

   html_theme = 'sphinx_rtd_theme'

   source_suffix = {
       '.rst': 'restructuredtext',
       '.md': 'markdown',
   }

   myst_enable_extensions = [
       'colon_fence',
       'deflist',
       'dollarmath',
       'fieldlist',
       'html_admonition',
       'html_image',
       'linkify',
       'replacements',
       'smartquotes',
       'substitution',
       'tasklist',
   ]
   ```
2. **Configure `.gitignore`**:
   The compiled HTML files should not be committed to the Git repository.
   Create a file named `.gitignore` in the root folder, and add the following content:
   ```text
   _build/
   ```
3. **Make the second Commit and Push**:
   ```bash
   git add conf.py .gitignore
   git commit -m "feat: add markdown support, rtd theme and gitignore"
   git push
   ```

## Task 4: Switch to the Remote Workstation (Third Commit, also revisit to remote development)

Now, let's switch to the **remote workstation** to continue development. *(Note: The remote workstation already has Sphinx-related packages installed, so you don't need to run `pip install` again).* Also, please note that you can use VSCode remote editting (or other similar tools).

1. **Pull the latest code**:
   Since you already cloned the repo and changed the remote in Task 1, navigate to the folder and pull the updates you just pushed from your local machine:
   ```bash
   cd fst-2026-git-practice
   git pull origin main  # Pull the Sphinx files you created locally
   ```
2. **Add a new Markdown document**:
   Create a new file named `practice.md` and write anything you like. For example:
   ```markdown
   # Git Collaboration Practice
   
   This content was added from the remote workstation!
   ```
3. **Update the index**:
   Open `index.rst`, and add your newly created Markdown filename (without the extension) under the `toctree` directive:
   ```rst
   .. toctree::
      :maxdepth: 2
      :caption: Contents:

      practice
   ```
4. **Make the third Commit and Push**:
   ```bash
   git add practice.md index.rst
   git commit -m "feat: add practice.md from remote workstation"
   git push origin main
   ```

## Task 5: Back to Local for Sync and Verification

Once the workstation tasks are done, switch back to your **local computer**.

1. **Pull the latest code**:
   Your local repository is now behind the remote repository. You need to pull the new changes:
   ```bash
   git pull
   ```
2. **Build and Verify**:
   Run the following in your local terminal:
   ```bash
   make html
   ```
   Navigate to the `_build/html/` folder and open `index.html` with your web browser. If you see the Read the Docs theme and the `practice` page you added from the workstation in the sidebar, congratulations! You have successfully completed the practice.

---

## Extension: How to make your website accessible to others?

Currently, your generated web pages can only be viewed on your own computer via the `file:///` protocol. If you want others to access it over the internet or an intranet, you have a few options:

### 1. Server Deployment (IP Access)
If you have a cloud server or an internal server, you can copy all files inside `_build/html/` to the server and use web server software to host them:
* **Quick Test (Python)**: Run `python -m http.server 8080` inside the `_build/html/` directory. Others can access it via `http://<YOUR-IP>:8080`.
* **Production (Nginx/Apache)**: Install Nginx, change the `root` directive in the config file to point to your HTML folder, and start the service. It will be stably accessible via your IP or domain.

### 2. Static Site Hosting (Free & Easy)
If you don't want to configure a server yourself, you can use free static hosting services provided by Git platforms. The core concept is: you push your HTML files (or source files) to a specific branch/repo, and the platform automatically assigns a domain and hosts the website.
* **[GitHub Pages](https://pages.github.com/)**: The world's most popular free hosting service, seamlessly integrated with GitHub repositories.
* **[GitLab Pages](https://docs.gitlab.com/ee/user/project/pages/)**: If you use GitLab, you can write a `.gitlab-ci.yml` script to automatically build Sphinx and publish the site every time you push.
* **[Read the Docs](https://readthedocs.org/)**: A hosting platform specifically designed for Sphinx documentation. It can link directly to your Git repository and build automatically.

