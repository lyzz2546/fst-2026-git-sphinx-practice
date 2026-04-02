#  Git to remote

Author: Haoxuan Li

## Objectives

- Understand the Git workflow: add → commit → push
- Distinguish between local and remote repositories
- Upload Markdown files to GitHub

 Prerequisites

- Git installed on local computer
- A GitHub account
- Basic command line knowledge

---

## 1. Git Basic Concepts

### 1.1 Git Architecture

Git consists of four main areas:

Working Directory → Staging Area → Local Repository → Remote Repository

### 1.2 Key Commands Overview

| Command | Function |
|--------|--------|
| git add | Add changes to staging area |
| git commit | Save changes locally |
| git push | Upload to remote repository |
| git pull | Download from remote repository |
| git status | Check current state |
| git log | View commit history |

---

## 2. Initial Setup

### 2.1 Check Git Installation
```bash
# check git version
git --version
```
### 2.2 Configure User Identity
```bash
# ensure git to where
git config --global user.name "Your Name"  
git config --global user.email "your_email@example.com"
```
---

## 3. Clone a Repository

### 3.1 Clone from GitHub
```bash
# get web floder from github
git clone https://github.com/your-username/blog.git  
cd blog  
```
### 3.2 Check Status
```bash
git status  
```
You will see: `nothing to commit, working tree clean`

---

## 4. Create and Edit Files

### 4.1 Create a Markdown File
```bash
touch docs/test.md  
```
### 4.2 Add Content

**writing anything you like in like：** This is my first article uploaded using Git.

---

## 5. Track Changes

### 5.1 Check Status

We should check the status of the git repository both before and after the operation.
```bash
# check your local git status
git status  
```
### 5.2 View Differences
```bash
# show the difference between new version and old version
git diff  
```
---

## 6. Stage Changes

Add the modified file to the local storage (to prevent subsequent operations from overwriting or deleting the modified file)

```bash
# store file to local git folder
git add docs/test.md  
```
---

## 7. Commit Changes

Add the files added locally to the local git repository

```bash
# commit to local git and name difference to new version
git commit -m "add first test page"  
# check history of git(include other's git)
git log --oneline  
```
---

## 8. Push to Remote Repository
```bash
# push new file to remote machine
git push origin main  
```
---

## 9. Understanding Git Flow

Edit → add → commit → push → update  

 
