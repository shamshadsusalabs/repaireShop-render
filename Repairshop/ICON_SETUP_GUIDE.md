# App Icon Setup Guide - LUXRE

## Quick Setup (Recommended)

### Method 1: Using Online Tool (Easiest)

1. **Go to Icon Generator Website:**
   - Visit: https://icon.kitchen/ or https://easyappicon.com/
   
2. **Upload Logo:**
   - Upload `public/logo1.jpeg`
   - Adjust padding/background if needed
   
3. **Download Icons:**
   - Download Android icons package
   - Download iOS icons package
   
4. **Replace Icons:**
   
   **For Android:**
   - Extract downloaded Android icons
   - Copy all `ic_launcher.png` files to respective mipmap folders:
     ```
     android/app/src/main/res/mipmap-mdpi/
     android/app/src/main/res/mipmap-hdpi/
     android/app/src/main/res/mipmap-xhdpi/
     android/app/src/main/res/mipmap-xxhdpi/
     android/app/src/main/res/mipmap-xxxhdpi/
     ```
   
   **For iOS:**
   - Extract downloaded iOS icons
   - Copy all icon files to:
     ```
     ios/Repairshop/Images.xcassets/AppIcon.appiconset/
     ```
   - Make sure Contents.json is also updated

5. **Rebuild App:**
   ```bash
   # Clean build
   cd android
   ./gradlew clean
   cd ..
   
   # Rebuild Android
   npx react-native run-android
   
   # For iOS
   cd ios
   pod install
   cd ..
   npx react-native run-ios
   ```

6. **Important:**
   - Uninstall old app from device first
   - Then install fresh build to see new icon

---

### Method 2: Using Script (If ImageMagick installed)

1. **Install ImageMagick:**
   ```bash
   # macOS
   brew install imagemagick
   
   # Ubuntu/Debian
   sudo apt-get install imagemagick
   ```

2. **Run Script:**
   ```bash
   chmod +x generate-icons.sh
   ./generate-icons.sh
   ```

3. **For iOS icons, still use online tool** (icon.kitchen)

4. **Rebuild app** (same as Method 1 step 5)

---

## Icon Sizes Reference

### Android (PNG format)
- mipmap-mdpi: 48x48
- mipmap-hdpi: 72x72
- mipmap-xhdpi: 96x96
- mipmap-xxhdpi: 144x144
- mipmap-xxxhdpi: 192x192

### iOS (PNG format)
- 20x20 (@1x, @2x, @3x)
- 29x29 (@1x, @2x, @3x)
- 40x40 (@1x, @2x, @3x)
- 60x60 (@2x, @3x)
- 76x76 (@1x, @2x)
- 83.5x83.5 (@2x)
- 1024x1024 (App Store)

---

## Troubleshooting

**Icon not changing?**
1. Uninstall app completely from device
2. Clean build: `cd android && ./gradlew clean`
3. Rebuild and install fresh

**Icon looks pixelated?**
- Use high-resolution source image (at least 1024x1024)
- logo1.jpeg should be good quality

**iOS icon not showing?**
- Make sure Contents.json is properly configured
- Check Xcode for any warnings

---

## Current Status

✅ App name changed to "LUXRE"
✅ Login screen logo updated
✅ Invoice logo updated
⏳ App launcher icon - Follow this guide to update

---

**Note:** App icon change requires app rebuild and reinstall. Just restarting won't show new icon.
