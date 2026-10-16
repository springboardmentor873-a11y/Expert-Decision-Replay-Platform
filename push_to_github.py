#!/usr/bin/env python3
"""
EDRP GitHub Push Utility
Supports both interactive and command-line execution on Windows.
Auto-detects Git, validates GitHub credentials, and pushes project code.
"""

import os
import sys
import json
import shutil
import subprocess
import argparse
import urllib.request
import urllib.error

# Ensure stdout handles UTF-8 on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

CONFIG_FILE = ".github_config.json"
DEFAULT_REPO = "https://github.com/springboardmentor873-a11y/Expert-Decision-Replay-Platform.git"
DEFAULT_BRANCH = "StefinCSiju"
DEFAULT_USERNAME = "StefinCSiju"
DEFAULT_EMAIL = "stefin@edrp.dev"


def find_git():
    """Finds git executable across PATH and known Windows installation locations."""
    git_path = shutil.which("git")
    if git_path:
        return git_path

    known_paths = [
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Git\cmd\git.exe"),
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Git\bin\git.exe"),
        r"C:\Program Files\Git\cmd\git.exe",
        r"C:\Program Files\Git\bin\git.exe",
        r"C:\Program Files (x86)\Git\cmd\git.exe",
    ]
    for p in known_paths:
        if os.path.isfile(p):
            return p
    return None


def load_config():
    if os.path.isfile(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_config(config):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)
    except Exception as e:
        print(f"[NOTE] Could not save config file: {e}")


def validate_token(token):
    """Validates the Personal Access Token with the GitHub API."""
    if not token:
        return False, "No token provided."
    req = urllib.request.Request("https://api.github.com/user")
    req.add_header("User-Agent", "EDRP-Pusher")
    req.add_header("Authorization", f"token {token}")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            login = data.get("login", "Unknown")
            return True, login
    except urllib.error.HTTPError as e:
        if e.code == 401:
            return False, "Token invalid or expired (HTTP 401 Bad credentials)."
        elif e.code == 403:
            return False, "Access forbidden (HTTP 403) - check token scopes/rate limits."
        return False, f"GitHub API error (HTTP {e.code})."
    except Exception as err:
        return False, f"Network check failed: {err}"


def run_cmd(cmd, git_exe, check=True):
    full_cmd = [git_exe] + cmd
    res = subprocess.run(full_cmd, capture_output=True, text=True)
    if check and res.returncode != 0:
        err_msg = res.stderr.strip() or res.stdout.strip()
        raise RuntimeError(f"Command '{' '.join(full_cmd[:3])}' failed:\n{err_msg}")
    return res


def main():
    print("=" * 65)
    print("  EDRP - Push Project to GitHub Repository")
    print("=" * 65)

    parser = argparse.ArgumentParser(description="Push project to GitHub repository")
    parser.add_argument("--repo", help="GitHub repository URL")
    parser.add_argument("--branch", help="Target branch name")
    parser.add_argument("--username", help="GitHub username")
    parser.add_argument("--token", help="GitHub Personal Access Token (PAT)")
    parser.add_argument("--message", help="Commit message")
    parser.add_argument("--save-token", action="store_true", help="Save token in local config for future pushes")
    args = parser.parse_args()

    git_exe = find_git()
    if not git_exe:
        print("[ERROR] Git executable could not be found.")
        print("Please ensure Git for Windows is installed.")
        sys.exit(1)

    print(f"[OK] Using Git: {git_exe}")

    config = load_config()

    # 1. Repo URL
    repo_url = args.repo or config.get("repo_url")
    if not repo_url:
        if sys.stdin.isatty():
            prompt_val = input(f"Enter GitHub Repository URL [default: {DEFAULT_REPO}]: ").strip()
            repo_url = prompt_val if prompt_val else DEFAULT_REPO
        else:
            repo_url = DEFAULT_REPO

    # 2. Branch
    branch = args.branch or config.get("branch")
    if not branch:
        if sys.stdin.isatty():
            prompt_val = input(f"Enter Branch Name [default: {DEFAULT_BRANCH}]: ").strip()
            branch = prompt_val if prompt_val else DEFAULT_BRANCH
        else:
            branch = DEFAULT_BRANCH

    # 3. Username
    username = args.username or config.get("username")
    if not username:
        if sys.stdin.isatty():
            prompt_val = input(f"Enter GitHub Username [default: {DEFAULT_USERNAME}]: ").strip()
            username = prompt_val if prompt_val else DEFAULT_USERNAME
        else:
            username = DEFAULT_USERNAME

    # 4. Personal Access Token (PAT)
    token = args.token or config.get("token") or os.environ.get("GITHUB_TOKEN")
    
    # Check if saved or provided token is valid
    is_valid = False
    if token:
        valid, info = validate_token(token)
        if valid:
            print(f"[OK] GitHub Token authenticated successfully as: @{info}")
            is_valid = True
        else:
            print(f"[WARNING] Existing token check: {info}")
            token = None

    if not is_valid:
        print("\n[KEY] A GitHub Personal Access Token (PAT) with 'repo' scope is required to push.")
        print("      How to generate one:")
        print("      1. Go to: https://github.com/settings/tokens")
        print("      2. Generate new token (classic) -> Select 'repo' scope -> Copy token.")
        print()
        if sys.stdin.isatty():
            while not token:
                token_input = input("Enter your GitHub Personal Access Token (PAT): ").strip()
                if not token_input:
                    print("[ERROR] Token cannot be empty. Please enter your PAT.")
                    continue
                valid, info = validate_token(token_input)
                if not valid:
                    print(f"[ERROR] {info}. Please re-enter a valid token.")
                else:
                    print(f"[OK] Authenticated as: @{info}")
                    token = token_input
                    break
        else:
            print("[ERROR] No valid GitHub token provided.")
            print("Run the script interactively, or provide --token <YOUR_PAT>.")
            sys.exit(1)

    # Save to config if requested or in interactive mode
    save_answer = "y"
    if not args.token and sys.stdin.isatty():
        save_prompt = input("Save this configuration locally for future 1-click pushes? (y/n) [default: y]: ").strip().lower()
        if save_prompt in ("n", "no"):
            save_answer = "n"

    if save_answer != "n":
        config["repo_url"] = repo_url
        config["branch"] = branch
        config["username"] = username
        config["token"] = token
        save_config(config)
        print("[OK] Configuration saved to .github_config.json")

    # 5. Commit message
    default_msg = "Milestone 4: EDRP Complete - Teams, Roles, Join Requests, Search, PDF & WebSockets"
    commit_msg = args.message
    if not commit_msg:
        if sys.stdin.isatty():
            prompt_val = input(f"\nEnter commit message [default: {default_msg}]: ").strip()
            commit_msg = prompt_val if prompt_val else default_msg
        else:
            commit_msg = default_msg

    print("\n[GIT] Preparing repository...")

    # Git init
    run_cmd(["init"], git_exe)
    run_cmd(["config", "user.name", username], git_exe)
    run_cmd(["config", "user.email", DEFAULT_EMAIL], git_exe)

    # Stage files
    print("[GIT] Staging files (respecting .gitignore)...")
    run_cmd(["add", "."], git_exe)

    # Commit
    status = run_cmd(["status", "--porcelain"], git_exe)
    if status.stdout.strip():
        print(f"[GIT] Committing changes: '{commit_msg}'...")
        run_cmd(["commit", "-m", commit_msg], git_exe)
    else:
        print("[GIT] No new changes to commit, continuing to push...")

    # Set up remote with authentication
    clean_repo_url = repo_url.replace(".git", "")
    if clean_repo_url.startswith("https://"):
        auth_repo_url = clean_repo_url.replace("https://", f"https://{username}:{token}@") + ".git"
    else:
        auth_repo_url = repo_url

    run_cmd(["remote", "remove", "origin"], git_exe, check=False)
    run_cmd(["remote", "add", "origin", auth_repo_url], git_exe)

    # Switch/create branch
    print(f"[GIT] Switching to branch: {branch}...")
    run_cmd(["checkout", "-B", branch], git_exe)

    # Push
    print(f"[GIT] Pushing to GitHub (origin/{branch})...")
    push_res = run_cmd(["push", "-u", "origin", branch, "--force"], git_exe, check=False)

    # Always reset remote URL to clean URL so PAT is not kept in git config
    clean_remote = clean_repo_url + ".git"
    run_cmd(["remote", "set-url", "origin", clean_remote], git_exe, check=False)

    if push_res.returncode != 0:
        print(f"\n[ERROR] Push failed:\n{push_res.stderr.strip() or push_res.stdout.strip()}")
        sys.exit(1)

    print("\n" + "=" * 65)
    print("  [SUCCESS] SUCCESSFULLY PUSHED TO GITHUB!")
    print(f"  Branch URL: {clean_repo_url}/tree/{branch}")
    print("=" * 65)


if __name__ == "__main__":
    main()
