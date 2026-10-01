#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Commit or stash local changes before deploying." >&2
  exit 1
fi

npm test
npm run build
npm run verify:static

deploy_dir="$(mktemp -d)"
trap 'rm -rf "$deploy_dir"' EXIT
git clone --quiet --single-branch --branch gh-pages "$(git remote get-url origin)" "$deploy_dir"
rsync -a --delete --exclude='.git/' "$repo_root/out/" "$deploy_dir/"

cd "$deploy_dir"
git add -A
if git diff --cached --quiet; then
  echo "GitHub Pages is already up to date."
  exit 0
fi

git commit -m "Deploy: $(git -C "$repo_root" rev-parse --short HEAD)"
git push origin gh-pages
echo "Published to the gh-pages branch. Verify https://thetax.us after Pages finishes building."
