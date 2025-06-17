// fileUtils.js
// Low-level file operations for JSON/Markdown handling

const fs = window.require('fs');
const path = window.require('path');

/**
 * Checks if a given path exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Loads a JSON file and parses it.
 */
function loadJSON(filePath) {
  if (!fileExists(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse JSON from ${filePath}:`, err);
    return null;
  }
}

/**
 * Writes an object to a JSON file, pretty printed.
 */
function saveJSON(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, json, 'utf-8');
}

/**
 * Loads a markdown file as a string.
 */
function loadMarkdown(filePath) {
  if (!fileExists(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Saves a markdown string to a file.
 */
function saveMarkdown(filePath, markdown) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(filePath, markdown, 'utf-8');
}

/**
 * Reads all files in a directory (non-recursive).
 */
function listFilesInDir(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath);
}

/**
 * Deletes a file if it exists.
 */
function deleteFile(filePath) {
  if (fileExists(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export default {
  fileExists,
  loadJSON,
  saveJSON,
  loadMarkdown,
  saveMarkdown,
  listFilesInDir,
  deleteFile,
};
