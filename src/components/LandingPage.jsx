import { useState } from 'react';

export default function LandingPage({ onLoadWorld, onCreateWorld }) {
    const [newWorldName, setNewWorldName] = useState('');

    return (
        <div>
            <h1>Welcome to Your Worldbuilder</h1>
            <button onClick={onLoadWorld}>Load Existing World</button>

            <div>
                <h2>Create New World</h2>
                    <input
                    value={newWorldName}
                    onChange={e => setNewWorldName(e.target.value)}
                    placeholder="Enter world name"
                />
                <button
                    onClick={() => {
                        if (newWorldName.trim()) onCreateWorld(newWorldName.trim());
                    }}
                >
                    Create
                </button>
            </div>
        </div>
    );
}
