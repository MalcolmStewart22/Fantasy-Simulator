// WebFileSystem.js
// In-memory file system for web environment

const files = {};

function fileExists(filePath) {
  return files.hasOwnProperty(filePath);
}

function loadJSON(filePath) {
  if (!fileExists(filePath)) return null;
  try {
    return JSON.parse(files[filePath]);
  } catch {
    return null;
  }
}

function saveJSON(filePath, data) {
  files[filePath] = JSON.stringify(data, null, 2);
}

function loadMarkdown(filePath) {
  return fileExists(filePath) ? files[filePath] : null;
}

function saveMarkdown(filePath, markdown) {
  files[filePath] = markdown;
}

function listFilesInDir(dirPath) {
  // Return all files that start with dirPath + "/"
  const prefix = dirPath.endsWith('/') ? dirPath : dirPath + '/';
  return Object.keys(files).filter(f => f.startsWith(prefix));
}

function deleteFile(filePath) {
  delete files[filePath];
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