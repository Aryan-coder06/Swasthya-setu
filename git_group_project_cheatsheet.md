============================
GIT COMMAND CHEAT SHEET FOR GROUP PROJECTS
============================

============================
1️⃣ SWITCHING / CREATING BRANCHES
============================
# Create a new branch and switch to it
git checkout -b temp-branch

# Switch to an existing branch
git checkout main
git checkout github_push_pull

# List all branches
git branch
git branch -a   # also shows remote branches

============================
2️⃣ ADDING & COMMITTING CHANGES
============================
# Add everything in the project
git add .
git commit -m "Commit message describing all changes"

# Add only specific file(s)
git add filename.txt
git add foldername/    # adds all files inside folder
git commit -m "Add only this file or folder"

# Add multiple specific files
git add file1.txt file2.txt folder1/
git commit -m "Add selected files/folders"

============================
3️⃣ PUSHING CHANGES TO REMOTE
============================
# Push the current branch (first time)
git push -u origin temp-branch

# Push changes later (after upstream is set)
git push

# Push only a specific folder or file
# Stage only what you want
git add file1.txt folder1/
git commit -m "Add only selected files/folders"
git push -u origin temp-branch

============================
4️⃣ MERGING TEMP BRANCH INTO MAIN
============================
# Method 1: Merge using Git locally

# Switch to main branch
git checkout main

# Merge temp branch into main
git merge temp-branch

# Push main branch to remote
git push origin main

# Method 2: Merge via Pull Request (PR) on GitHub

# Push your temp branch to GitHub
git push -u origin temp-branch

# Go to GitHub → Repository → Pull Requests → New Pull Request
# Select base branch as main and compare branch as your temp branch
# Review changes, add description, and click Create Pull Request
# Merge the PR using Merge button on GitHub

# Pull the updated main branch to local
git checkout main
git pull origin main

============================
5️⃣ CLEANING UP TEMP BRANCH
============================
# Delete local temp branch
git branch -D temp-branch

# Delete remote temp branch
git push origin -d temp-branch

============================
6️⃣ CHECKING STATUS & HISTORY
============================
# Check current changes
git status

# Check commit history
git log

# Check commits in one line
git log --oneline

============================
7️⃣ BEST PRACTICES FOR GROUP PROJECTS
============================
- Create temp branches for features/fixes → do not commit directly to main
- Pull latest changes before starting work
  git pull origin main
- Commit small and frequent changes
- Use descriptive commit messages



============================
1️⃣ Check what’s staged
============================
git status


This shows:

Changes to be committed → files that will go in the next commit

Changes not staged → files that are not part of the commit yet

Only files under “Changes to be committed” will be pushed when you commit.

============================
2️⃣ Unstage everything first (optional but safest)
============================

If there are other staged files:

git reset


This unstages everything but keeps your file changes.

============================
3️⃣ Add only the file you want
============================
git add filename.txt


Now git status should show only that file under “Changes to be committed.”
============================
4️⃣ Commit only that file
============================

git commit -m "Add only this file"

============================
5️⃣ Push the branch
============================
git push -u origin temp-branch


✅ Only the committed file will go to the remote branch.

⚡ Quick tip

If you are experimenting frequently with temporary files, it’s often easiest to:

Create a clean temp branch:

git checkout -b temp-branch


Commit only the files you want.

Push or delete the temp branch later.

This avoids accidentally including other ongoing changes in your main branch or feature branches.