#!/bin/bash
# =====================================================
# EDRP Milestone 4 — Push to GitHub Branch: StefinCSiju
# =====================================================

REPO_URL="${REPO_URL:-https://github.com/springboardmentor873-a11y/Expert-Decision-Replay-Platform.git}"
BRANCH="${BRANCH:-StefinCSiju}"
USERNAME="${USERNAME:-StefinCSiju}"

echo "========================================================"
echo "  EDRP Milestone 4 - GitHub Repository Push"
echo "========================================================"

if [ -z "$PAT" ]; then
    read -p "Enter GitHub Personal Access Token (PAT): " PAT
fi

if [ -z "$PAT" ]; then
    echo "❌ Error: Token is required."
    exit 1
fi

echo "🚀 Setting up Git and pushing to branch: $BRANCH..."

git init
git config user.email "stefin@edrp.dev"
git config user.name "$USERNAME"

git add .
git commit -m "Milestone 4: EDRP Complete - Teams, Roles, Join Requests, Search, PDF & WebSockets" || true

CLEAN_REPO="${REPO_URL%.git}"
AUTH_REPO="https://${USERNAME}:${PAT}@${CLEAN_REPO#https://}.git"

git remote remove origin 2>/dev/null || true
git remote add origin "$AUTH_REPO"
git checkout -B "$BRANCH"
git push -u origin "$BRANCH" --force

# Remove embedded credentials from git config
git remote set-url origin "${CLEAN_REPO}.git"

echo ""
echo "✅ Done! View at: ${CLEAN_REPO}/tree/$BRANCH"
