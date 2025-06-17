// worldManager.js
// High-level manager for world data: region/location hierarchy + notes

import FileSystem from './FileSystem';

const ROOT_DIR = 'world_data';
const STRUCTURE_FILE = `${ROOT_DIR}/structure.json`;
const NOTES_DIR = `${ROOT_DIR}/notes`;

// Create a new world (directory and default files)
async function createNewWorld(worldName) {
  // In the web version, this is just a naming convention.
  // In Electron, the file system implementation can create directories as needed.
  const worldPath = `worlds/${worldName}`;

  const defaultWorldJson = {
    name: worldName,
    createdAt: new Date().toISOString(),
    // add any global defaults here
  };

  const defaultHierarchy = {
    regions: [],
    locations: [],
  };

  FileSystem.saveJSON(`${worldPath}/world.json`, defaultWorldJson);
  FileSystem.saveJSON(`${worldPath}/hierarchy.json`, defaultHierarchy);

  return defaultWorldJson;
}

// Load the entire world hierarchy from structure.json
function loadWorldStructure() {
  const structure = FileSystem.loadJSON(STRUCTURE_FILE);
  return structure || { regions: [] };
}

// Save the world hierarchy to structure.json
function saveWorldStructure(structure) {
  FileSystem.saveJSON(STRUCTURE_FILE, structure);
}

// Add a new region to the structure
function addRegion(region) {
  const structure = loadWorldStructure();
  structure.regions.push(region);
  saveWorldStructure(structure);
}

// Add a new location to a region
function addLocationToRegion(regionId, location) {
  const structure = loadWorldStructure();
  const region = structure.regions.find(r => r.id === regionId);
  if (region) {
    region.locations = region.locations || [];
    region.locations.push(location);
    saveWorldStructure(structure);
  }
}

// Delete a region by ID
function deleteRegion(regionId) {
  const structure = loadWorldStructure();
  structure.regions = structure.regions.filter(r => r.id !== regionId);
  saveWorldStructure(structure);
}

// Delete a location from a region
function deleteLocation(regionId, locationId) {
  const structure = loadWorldStructure();
  const region = structure.regions.find(r => r.id === regionId);
  if (region) {
    region.locations = (region.locations || []).filter(l => l.id !== locationId);
    saveWorldStructure(structure);
  }
}

// Get the path for a location/region's note markdown file
function getNoteFilePath(id) {
  return `${NOTES_DIR}/${id}.md`;
}

// Load a note (markdown) by ID
function loadNote(id) {
  return FileSystem.loadMarkdown(getNoteFilePath(id)) || '';
}

// Save a note (markdown) by ID
function saveNote(id, content) {
  FileSystem.saveMarkdown(getNoteFilePath(id), content);
}

// Delete a note by ID
function deleteNote(id) {
  FileSystem.deleteFile(getNoteFilePath(id));
}

export {
  createNewWorld,
  loadWorldStructure,
  saveWorldStructure,
  addRegion,
  addLocationToRegion,
  deleteRegion,
  deleteLocation,
  loadNote,
  saveNote,
  deleteNote,
};