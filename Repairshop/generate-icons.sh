#!/bin/bash

# Script to generate app icons from logo1.jpeg
# Requires ImageMagick: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)

SOURCE_IMAGE="public/logo1.jpeg"

if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "Error: $SOURCE_IMAGE not found!"
    exit 1
fi

echo "Generating Android icons..."

# Android mipmap-mdpi (48x48)
convert "$SOURCE_IMAGE" -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
convert "$SOURCE_IMAGE" -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png

# Android mipmap-hdpi (72x72)
convert "$SOURCE_IMAGE" -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
convert "$SOURCE_IMAGE" -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png

# Android mipmap-xhdpi (96x96)
convert "$SOURCE_IMAGE" -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
convert "$SOURCE_IMAGE" -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png

# Android mipmap-xxhdpi (144x144)
convert "$SOURCE_IMAGE" -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
convert "$SOURCE_IMAGE" -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png

# Android mipmap-xxxhdpi (192x192)
convert "$SOURCE_IMAGE" -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
convert "$SOURCE_IMAGE" -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

echo "✅ Android icons generated successfully!"
echo ""
echo "Next steps:"
echo "1. For iOS icons, use https://icon.kitchen/ to generate iOS icons"
echo "2. Clean and rebuild the app:"
echo "   cd android && ./gradlew clean && cd .."
echo "   npx react-native run-android"
echo ""
echo "Note: You may need to uninstall the app first to see the new icon"
