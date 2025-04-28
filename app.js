document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username');
    const createRoomBtn = document.getElementById('create-room-btn');
    const roomCodeInput = document.getElementById('room-code');
    const joinBtn = document.getElementById('join-btn');
    const languageSelect = document.getElementById('language');
    
    // Save selected language to local storage
    languageSelect.addEventListener('change', (e) => {
        localStorage.setItem('pictionary-language', e.target.value);
    });
    
    // Load saved language if exists
    const savedLanguage = localStorage.getItem('pictionary-language');
    if (savedLanguage) {
        languageSelect.value = savedLanguage;
    }
    
    // Handle create room button click
    createRoomBtn.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        
        if (!username) {
            alert('Please enter your name first');
            usernameInput.focus();
            return;
        }
        
        // Save username to local storage
        localStorage.setItem('pictionary-username', username);
        
        // Generate a random room code (6 characters)
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        localStorage.setItem('pictionary-room-code', roomCode);
        localStorage.setItem('pictionary-is-host', 'true');
        
        // Redirect to game.html
        window.location.href = 'game.html';
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
    function joinRoom() {
        const username = usernameInput.value.trim();
        const roomCode = roomCodeInput.value.trim();
        
        if (!username) {
            alert('Please enter your name first');
            usernameInput.focus();
            return;
        }
        
        if (!roomCode) {
            alert('Please enter a room code');
            roomCodeInput.focus();
            return;
        }
        
        // Save username and room code to local storage
        localStorage.setItem('pictionary-username', username);
        localStorage.setItem('pictionary-room-code', roomCode);
        localStorage.setItem('pictionary-is-host', 'false');
        
        // Redirect to game.html
        window.location.href = 'game.html';
    }
    
    // Pre-fill username if saved before
    const savedUsername = localStorage.getItem('pictionary-username');
    if (savedUsername) {
        usernameInput.value = savedUsername;
    }
    
    // Focus on input field when page loads
    usernameInput.focus();
}); 