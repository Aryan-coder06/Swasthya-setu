# Swasthya-Setu Project - Setup & Workflow

This document explains how team members should set up their local repositories and follow a safe workflow to avoid merge conflicts and maintain clean branches.

---

## Step 1: Setup Repo

Clone the repo once:

```bash
git clone https://github.com/Anshdeep-Singh-9/Swasthya-Setu.git
cd Swasthya-Setu
```

Fetch all branches and list them:

```bash
git fetch --all
git branch -a
```

Create local tracking branches for shared branches (if needed):

```bash
# For frontend developers
git checkout -b Frontend origin/Frontend

# For backend developers
git checkout -b Backend origin/Backend
```

> Note: If the branch already exists, Git will say `A branch with this name already exists`.  In that case, just switch to the branch using:

```bash
git checkout <branch-name>
```

---

## Step 2: Workflow for Frontend / Backend Devs

### Sync your branch

```bash
# For frontend devs
git checkout Frontend
git pull origin Frontend

# For backend devs
git checkout Backend
git pull origin Backend
```

### Create a feature branch

```bash
git checkout -b feat/<name-of-your-feature>
# Use prefixes: feat/..., fix/..., chore/...
```

### Work and commit changes

* Frontend devs work in the `frontend/` directory
* Backend devs work in the `backend/` directory

```bash
git add frontend/*   # or backend/* for backend devs
git commit -m "feat: login UI"
```

### Push feature branch and create PR

```bash
git push -u origin feat/<name-of-your-feature>
```

> For backend devs, swap `Frontend <--> Backend` wherever mentioned.

---

## Step 3: Checking functionality across both folders

If you need code from the other folder temporarily:

```bash
# Backend dev temporarily adds frontend folder
git checkout main -- Frontend/*

# Frontend dev temporarily adds backend folder
git checkout Backend -- backend/*
```

* This adds the folder locally **without overwriting your current branch**.
* Make sure you **untrack temporary folders** to avoid pushing them:

```bash
git status   # check if the folder is being tracked
git reset    # untrack it if needed
```

---

# Git - Viewing and Untracking Files

This document explains how to view all tracked files in Git and how to untrack files or folders safely.

---

## 1. View All Tracked Files

To see all files currently tracked by Git:

```bash
git ls-files
```

> This lists all files Git is tracking. Untracked files will not appear.

Alternative, to see tracked and untracked files along with their status:

```bash
git status
```

---

## 2. Untrack a Single File

Stop tracking a file without deleting it from your local system:

```bash
git rm --cached path/to/file
```

Example:

```bash
git rm --cached frontend/temp.js
git commit -m "Untrack temp.js"
```

---

## 3. Untrack a Folder or Multiple Files

Stop tracking all files inside a folder:

```bash
git rm -r --cached path/to/folder/
git commit -m "Stop tracking folder"
```

Example:

```bash
git rm -r --cached backend/logs/
git commit -m "Stop tracking backend logs"
```

---

## 4. Prevent Git from Tracking in the Future

Add files or folders to `.gitignore` to stop Git from tracking them again:

```
# Ignore temp files and logs
frontend/temp.js
backend/logs/
```

---

## 5. Verify Untracking

Check that files/folders are no longer tracked:

```bash
git status
git ls-files
```

> Files removed with `--cached` will no longer appear in `git ls-files` but will remain on your local filesystem.


## Notes

* Always inform the group if something goes wrong or you have doubts.
* Never commit directly to `Frontend`, `Backend`, or `main`; use feature branches and PRs.
* Keep your branches up-to-date with the remote to avoid conflicts.
