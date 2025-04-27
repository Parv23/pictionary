document.addEventListener('DOMContentLoaded', () => {
    const usernameForm = document.getElementById('username-form');
    const usernameInput = document.getElementById('username');
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
    
    // Handle form submission
    usernameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        
        if (username) {
            // Save username to local storage
            localStorage.setItem('pictionary-username', username);
            
            // Redirect to game.html
            window.location.href = 'game.html';
        }
    });
    
    // Pre-fill username if saved before
    const savedUsername = localStorage.getItem('pictionary-username');
    if (savedUsername) {
        usernameInput.value = savedUsername;
    }
    
    // Focus on input field when page loads
    usernameInput.focus();
}); 