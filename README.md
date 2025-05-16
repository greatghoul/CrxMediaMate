# 沙雕图 Chrome Extension

A Chrome extension that allows you to collect funny images with notes using the context menu.

## Features

- Right-click context menu on images
- Save images with custom notes
- Copy to clipboard functionality
- 400x600 popup window with image preview

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select this directory
4. The extension should now be installed and ready to use

## Usage

1. Find an image on any webpage
2. Right-click on the image
3. Select "收集沙雕图" from the context menu
4. A popup window will appear with the image preview
5. Add your notes in the textarea
6. Click "Save Image" to copy the image and note to your clipboard

## File Structure

- `manifest.json`: The extension configuration file
- `popup.html`: The HTML for the popup window
- `js/background.js`: Background script that creates the context menu
- `js/popup.js`: Script that handles the popup window functionality
- `images/`: Directory containing the extension icons

## Notes

- Make sure to replace the placeholder icons in the `images/` directory with actual icons
- This extension requires clipboard permission to function properly
