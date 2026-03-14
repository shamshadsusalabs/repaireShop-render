#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
# npm run build # if you had a build step

# This script is used as the build command on Render.
# In Render Dashboard, set Build Command to: ./render-build.sh
# And make sure the file is executable: chmod +x render-build.sh

# Install Chrome dependencies (shared libraries)
# Note: On Render, we might need a custom Dockerfile or Buildpack if this doesn't work.
# However, many users use this trick or the Puppeteer buildpack.

echo "Build script finished."
