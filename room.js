document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const roomCodeDisplay = document.getElementById('room-code-display');
    const playerNameDisplay = document.getElementById('player-name');
    const hostIndicator = document.getElementById('host-indicator');
    const playersList = document.getElementById('players-list');
    const hostControls = document.getElementById('host-controls');
    const startGameBtn = document.getElementById('start-game-btn');
    const leaveRoomBtn = document.getElementById('leave-room-btn');
    
    // Get session data from local storage
    const roomCode = localStorage.getItem('pictionary-room-code');
    const username = localStorage.getItem('pictionary-username');
    const isHost = localStorage.getItem('pictionary-is-host') === 'true';
    const playerId = localStorage.getItem('pictionary-player-id');
    
    // Check if session data exists
    if (!roomCode || !username || !playerId) {
        // Redirect to the rooms page if data is missing
        window.location.href = 'rooms.html';
        return;
    }
    
    // Update UI with session data
    roomCodeDisplay.textContent = roomCode;
    playerNameDisplay.textContent = username;
    
    // Show host indicator if player is host
    if (isHost) {
        hostIndicator.textContent = 'Host';
        // Show host controls
        hostControls.style.display = 'block';
    }
    
    // Reference to the room document
    const roomRef = roomsCollection.doc(roomCode);
    
    // Fetch initial room data
    async function fetchRoomData() {
        const roomDoc = await roomRef.get();
        if (roomDoc.exists) {
            const roomData = roomDoc.data();
            updatePlayersList(roomData.players || []);
            
            // Check if room is still active
            if (!roomData.active) {
                localStorage.removeItem('pictionary-room-code');
                window.location.href = 'rooms.html';
            }
        } else {
            localStorage.removeItem('pictionary-room-code');
            window.location.href = 'rooms.html';
        }
    }
    
    // Fetch room data initially
    fetchRoomData();
    
    // Listen for changes to the room document
    let unsubscribe = roomRef.onSnapshot((doc) => {
        if (doc.exists) {
            const roomData = doc.data();
            
            // Update players list
            updatePlayersList(roomData.players || []);
            
            // Check if room is still active
            if (!roomData.active) {
                // Room was closed, redirect to rooms page
                localStorage.removeItem('pictionary-room-code');
                window.location.href = 'rooms.html';
            }
        } else {
            // Room was deleted, redirect to rooms page
            localStorage.removeItem('pictionary-room-code');
            window.location.href = 'rooms.html';
        }
    }, (error) => {
        console.error('Error listening to room updates:', error);
    });
    
    // Handle leave room button click
    leaveRoomBtn.addEventListener('click', async () => {
        try {
            // Remove player from room
            await removePlayerFromRoom();
            
            // Redirect to rooms page
            window.location.href = 'rooms.html';
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    });
    
    // Handle start game button click (for host only)
    if (isHost) {
        startGameBtn.addEventListener('click', () => {
            // In a real implementation, this would transition to the game
            alert('Game starting functionality would be implemented here.');
        });
    }
    
    // Handle window close/navigation
    window.addEventListener('beforeunload', () => {
        // Clean up listener
        if (unsubscribe) {
            unsubscribe();
        }
        
        // Remove player from room when navigating away
        // Note: This might not always work due to browser limitations
        removePlayerFromRoom();
    });
    
    // Function to update players list in UI
    function updatePlayersList(players) {
        // Clear current list
        playersList.innerHTML = '';
        
        // Add each player to the list
        players.forEach(player => {
            const li = document.createElement('li');
            li.className = 'player-item';
            
            // Highlight current player
            if (player.id === playerId) {
                li.classList.add('current-player');
            }
            
            // Add host badge if player is host
            if (player.isHost) {
                li.innerHTML = `<span class="player-name">${player.name}</span> <span class="host-badge">Host</span>`;
            } else {
                li.innerHTML = `<span class="player-name">${player.name}</span>`;
            }
            
            playersList.appendChild(li);
        });
    }
    
    // Function to remove player from room
    async function removePlayerFromRoom() {
        try {
            // Get current room data
            const roomDoc = await roomRef.get();
            
            if (!roomDoc.exists) {
                return;
            }
            
            const roomData = roomDoc.data();
            
            // Make sure players property exists and is an array
            if (!roomData.players || !Array.isArray(roomData.players)) {
                console.error('Invalid players data:', roomData.players);
                return;
            }
            
            // Find player in the players array
            const playerIndex = roomData.players.findIndex(player => player.id === playerId);
            
            if (playerIndex === -1) {
                console.log('Player not found in room:', playerId);
                return;
            }
            
            // Make a copy of the players array
            const updatedPlayers = [...roomData.players];
            
            // Remove player from array
            updatedPlayers.splice(playerIndex, 1);
            
            console.log('Removing player from room:', playerId);
            console.log('Updated players array:', updatedPlayers);
            
            if (isHost) {
                // If host is leaving, close the room or assign new host
                if (updatedPlayers.length === 0) {
                    // No players left, close room
                    console.log('Host leaving empty room, closing room');
                    await roomRef.update({ 
                        active: false,
                        players: []
                    });
                } else {
                    // Assign first player as new host
                    console.log('Host leaving, assigning new host:', updatedPlayers[0].id);
                    updatedPlayers[0].isHost = true;
                    
                    await roomRef.update({ 
                        players: updatedPlayers,
                        hostId: updatedPlayers[0].id
                    });
                }
            } else {
                // Regular player leaving, just update players array
                console.log('Regular player leaving');
                await roomRef.update({ 
                    players: updatedPlayers 
                });
            }
            
            // Clear session data
            localStorage.removeItem('pictionary-room-code');
            localStorage.removeItem('pictionary-is-host');
            localStorage.removeItem('pictionary-player-id');
            
        } catch (error) {
            console.error('Error removing player from room:', error);
        }
    }
}); 