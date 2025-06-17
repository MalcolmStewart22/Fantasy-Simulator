import { useState } from 'react';
import LandingPage from './components/LandingPage';
import MapViewer from './components/MapViewer';
import { loadWorldStructure , createNewWorld } from './components/filesystem/WorldManager';

export default function App() {
    const [currentWorld, setCurrentWorld] = useState(null);

    async function handleLoadWorld() {
      // For desktop app, open dialog or show list of worlds, e.g.:
      // const worldName = await showWorldPickerDialog();
      // For now just hardcode or prompt:
      const worldName = prompt('Enter world name to load');
      if (!worldName) return;

      try {
        const worldData = await loadWorldStructure (worldName);
        setCurrentWorld(worldData);
      } catch (e) {
        alert('Failed to load world: ' + e.message);
      }
    }

    async function handleCreateWorld(name) {
      try {
        const worldData = await createNewWorld(name);
        setCurrentWorld(worldData);
      } catch (e) {
        alert('Failed to create world: ' + e.message);
      }
    }

    if (!currentWorld) {
      return <LandingPage onLoadWorld={handleLoadWorld} onCreateWorld={handleCreateWorld} />;
    }

    return <MapViewer world={currentWorld} />;
}