document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username');
    const createRoomBtn = document.getElementById('create-room-btn');
    const roomCodeInput = document.getElementById('room-code');
    const joinBtn = document.getElementById('join-btn');
    const languageSelect = document.getElementById('language');
    const quickDrawBtn = document.getElementById('quick-draw-btn');
    const errorMessage = document.getElementById('error-message');
    
    console.log('DEBUG: app.js loaded');
    console.log('DEBUG: DOM elements found:', {
        usernameInput: !!usernameInput,
        createRoomBtn: !!createRoomBtn,
        roomCodeInput: !!roomCodeInput,
        joinBtn: !!joinBtn,
        errorMessage: !!errorMessage
    });
    
    // Save selected language to local storage
    languageSelect.addEventListener('change', (e) => {
        localStorage.setItem('pictionary-language', e.target.value);
    });
    
    // Load saved language if exists
    const savedLanguage = localStorage.getItem('pictionary-language');
    if (savedLanguage) {
        languageSelect.value = savedLanguage;
    }
    
    // Handle quick draw button click
    quickDrawBtn.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        
        if (!username) {
            showError('Please enter your name first');
            usernameInput.focus();
            return;
        }
        
        // Clear any previous error
        clearError();
        
        // Save username to local storage
        localStorage.setItem('pictionary-username', username);
        
        // Redirect to game.html
        window.location.href = 'game.html';
    });
    
    // Handle create room button click
    createRoomBtn.addEventListener('click', async () => {
        console.log('DEBUG: Create room button clicked');
        const username = usernameInput.value.trim();
        
        if (!username) {
            showError('Please enter your name first');
            usernameInput.focus();
            return;
        }
        
        // Clear any previous error
        clearError();
        
        try {
            console.log('DEBUG: Generating room code');
            // Generate a random room code (6 characters)
            const roomCode = generateRoomCode();
            console.log('DEBUG: Room code generated:', roomCode);
            
            console.log('DEBUG: Creating room in Supabase');
            // Create room document in Supabase
            await roomsCollection.doc(roomCode).set({
                createdAt: new Date().toISOString(),
                hostId: generatePlayerId(),
                players: [],
                active: true
            });
            
            console.log('DEBUG: Adding host as first player');
            // Add host as first player
            await addPlayerToRoom(roomCode, username, true);
            
            console.log('DEBUG: Saving session data');
            // Save data to local storage
            saveSessionData(username, roomCode, true);
            
            console.log('DEBUG: Redirecting to room.html');
            // Redirect to room.html
            window.location.href = 'room.html';
        } catch (error) {
            console.error('DEBUG: Error creating room:', error);
            showError('Failed to create room. Please try again.');
        }
    });
    
    // Handle room code input keypress
    roomCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinRoom();
        }
    });
    
    // Handle join button click
    joinBtn.addEventListener('click', () => {
        joinRoom();
    });
    
    // Function to join a room
    async function joinRoom() {
        console.log('DEBUG: Joining room');
        const username = usernameInput.value.trim();
        const roomCode = roomCodeInput.value.trim().toUpperCase();
        
        if (!username) {
            showError('Please enter your name first');
            usernameInput.focus();
            return;
        }
        
        if (!roomCode) {
            showError('Please enter a room code');
            roomCodeInput.focus();
            return;
        }
        
        // Clear any previous error
        clearError();
        
        try {
            console.log('DEBUG: Checking if room exists:', roomCode);
            // Check if room exists
            const roomRef = roomsCollection.doc(roomCode);
            const roomDoc = await roomRef.get();
            
            if (!roomDoc.exists) {
                showError('Room not found. Please check the code and try again.');
                return;
            }
            
            const roomData = roomDoc.data();
            
            // Check if room is active
            if (!roomData.active) {
                showError('This room is no longer active.');
                return;
            }
            
            console.log('DEBUG: Adding player to room');
            // Add player to room
            await addPlayerToRoom(roomCode, username, false);
            
            console.log('DEBUG: Saving session data');
            // Save data to local storage
            saveSessionData(username, roomCode, false);
            
            console.log('DEBUG: Redirecting to room.html');
            // Redirect to room.html
            window.location.href = 'room.html';
        } catch (error) {
            console.error('DEBUG: Error joining room:', error);
            showError('Failed to join room. Please try again.');
        }
    }
    
    // Helper function to add player to room
    async function addPlayerToRoom(roomCode, username, isHost) {
        const playerId = generatePlayerId();
        
        const playerData = {
            id: playerId,
            name: username,
            isHost: isHost,
            joinedAt: new Date().toISOString()
        };
        
        try {
            console.log('DEBUG: Getting current room data for adding player');
            // Get current room data with a fresh fetch
            const roomDoc = await roomsCollection.doc(roomCode).get();
            
            if (!roomDoc.exists) {
                throw new Error('Room not found');
            }
            
            const roomData = roomDoc.data();
            
            // Make sure players property exists and is an array
            const currentPlayers = Array.isArray(roomData.players) ? roomData.players : [];
            
            // Append new player to the array
            const updatedPlayers = [...currentPlayers, playerData];
            
            console.log('DEBUG: Updating room with new player');
            // Update the room with the new players array
            const updateResult = await roomsCollection.doc(roomCode).update({
                players: updatedPlayers
            });
            
            console.log('DEBUG: Player added to room:', playerId);
            
            // Save player ID to local storage
            localStorage.setItem('pictionary-player-id', playerId);
            
            return updateResult;
        } catch (error) {
            console.error('DEBUG: Error adding player to room:', error);
            throw error;
        }
    }
    
    // Helper function to generate a unique player ID
    function generatePlayerId() {
        return 'player_' + Math.random().toString(36).substring(2, 15);
    }
    
    // Helper function to generate a room code
    function generateRoomCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    // Helper function to save session data
    function saveSessionData(username, roomCode, isHost) {
        localStorage.setItem('pictionary-username', username);
        localStorage.setItem('pictionary-room-code', roomCode);
        localStorage.setItem('pictionary-is-host', isHost.toString());
    }
    
    // Helper function to show error message
    function showError(message) {
        console.log('DEBUG: Showing error:', message);
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
    
    // Helper function to clear error message
    function clearError() {
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
    }
    
    // Pre-fill username if saved before
    const savedUsername = localStorage.getItem('pictionary-username');
    if (savedUsername) {
        usernameInput.value = savedUsername;
    }
    
    // Focus on input field when page loads
    usernameInput.focus();
}); 