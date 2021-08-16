#!/bin/bash
# Deploy built web clients to GitHub pages

TARGET_REPO_NAME="comunica/comunica-feature-link-traversal-web-clients.git"

echo -e "Uploading web clients...\n"

# Checkout the target repo
targetDir=comunica-feature-link-traversal-web-clients
git clone https://${GH_TOKEN}@github.com/$TARGET_REPO_NAME $targetDir

# Update web clients
rm -r $targetDir/builds/* 2> /dev/null
cp -r web-clients/builds $targetDir

# Commit and push latest version
cd $targetDir
git add --all
git config user.name  "GitHub Actions"
git config user.email "actions@github.org"
git commit -m "Update to comunica/comunica-feature-link-traversal#$GITHUB_SHA."
git push -fq origin master 2>&1 > /dev/null
