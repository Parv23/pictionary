document.addEventListener('DOMContentLoaded', () => {
    // Canvas setup
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size based on its container
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Drawing variables
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let currentColor = '#000000';
    let brushSize = 5;
    let eraserSize = 12;
    let drawingMode = 'brush'; // 'brush', 'eraser', 'stroke-eraser'
    
    // Store drawn strokes for stroke eraser
    let strokes = [];
    let currentStroke = null;
    
    // Drawing event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch support
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', stopDrawing);
    
    function handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
    
    function startDrawing(e) {
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
        
        if (drawingMode === 'stroke-eraser') {
            // In stroke eraser mode, check if a stroke was clicked
            checkStrokeErase(e.offsetX, e.offsetY);
        } else {
            // Start a new stroke for drawing or manual erasing
            currentStroke = {
                mode: drawingMode,
                color: currentColor,
                size: drawingMode === 'eraser' ? eraserSize : brushSize,
                points: [{x: lastX, y: lastY}]
            };
        }
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        if (drawingMode === 'stroke-eraser') {
            // When in stroke eraser mode, we don't draw anything on mousemove
            return;
        }
        
        if (drawingMode === 'eraser') {
            // For eraser, use white color
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = eraserSize;
        } else {
            // For brush, use selected color
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = brushSize;
        }
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        
        // Add point to current stroke
        if (currentStroke) {
            currentStroke.points.push({x: e.offsetX, y: e.offsetY});
        }
        
        [lastX, lastY] = [e.offsetX, e.offsetY];
    }
    
    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        
        // Add the completed stroke to the strokes array
        if (currentStroke && drawingMode !== 'stroke-eraser') {
            strokes.push(currentStroke);
            currentStroke = null;
        }
    }
    
    function checkStrokeErase(x, y) {
        // Find and remove strokes that are close to the click point
        const tolerance = 10; // Distance in pixels to consider a hit
        let erasedStroke = false;
        
        for (let i = strokes.length - 1; i >= 0; i--) {
            const stroke = strokes[i];
            for (const point of stroke.points) {
                const distance = Math.sqrt(
                    Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)
                );
                
                if (distance <= tolerance) {
                    // Stroke is close enough to the click, remove it
                    strokes.splice(i, 1);
                    erasedStroke = true;
                    break;
                }
            }
            
            if (erasedStroke) {
                // Redraw the canvas without the erased stroke
                redrawCanvas();
                break;
            }
        }
    }
    
    function redrawCanvas() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Redraw all strokes
        for (const stroke of strokes) {
            if (stroke.mode === 'brush' && stroke.points.length > 1) {
                ctx.strokeStyle = stroke.color;
                ctx.lineWidth = stroke.size;
                
                ctx.beginPath();
                ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                
                for (let i = 1; i < stroke.points.length; i++) {
                    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
                }
                
                ctx.stroke();
            }
        }
    }
    
    // Tool buttons
    const brushTool = document.getElementById('brush-tool');
    const eraserTool = document.getElementById('eraser-tool');
    const eraserOptions = document.getElementById('eraser-options');
    const strokeEraser = document.getElementById('stroke-eraser');
    
    // Tool selection
    brushTool.addEventListener('click', () => {
        setDrawingMode('brush');
        hideEraserOptions();
    });
    
    eraserTool.addEventListener('click', () => {
        toggleEraserOptions();
    });
    
    strokeEraser.addEventListener('click', () => {
        setDrawingMode('stroke-eraser');
        hideEraserOptions();
    });
    
    // Function to toggle eraser options visibility
    function toggleEraserOptions() {
        eraserOptions.classList.toggle('show');
        if (eraserOptions.classList.contains('show')) {
            setDrawingMode('eraser');
        }
    }
    
    // Hide eraser options
    function hideEraserOptions() {
        eraserOptions.classList.remove('show');
    }
    
    // Close eraser options when clicking outside
    document.addEventListener('click', (e) => {
        if (!eraserTool.contains(e.target) && 
            !eraserOptions.contains(e.target) && 
            eraserOptions.classList.contains('show')) {
            hideEraserOptions();
        }
    });
    
    // Eraser size buttons
    const eraserSizeBtns = document.querySelectorAll('.eraser-size-btn');
    eraserSizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all eraser size buttons
            eraserSizeBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Set eraser size
            eraserSize = parseInt(btn.dataset.size);
            setDrawingMode('eraser');
        });
    });
    
    function setDrawingMode(mode) {
        drawingMode = mode;
        
        // Update tool buttons UI
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => btn.classList.remove('active'));
        
        if (mode === 'brush') {
            brushTool.classList.add('active');
            canvas.style.cursor = 'default';
        } else if (mode === 'eraser') {
            eraserTool.classList.add('active');
            canvas.style.cursor = 'crosshair';
        } else if (mode === 'stroke-eraser') {
            eraserTool.classList.add('active');
            canvas.style.cursor = 'pointer';
        }
    }
    
    // Color picker
    const colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Set drawing mode back to brush when color is selected
            setDrawingMode('brush');
            hideEraserOptions();
            
            // Remove active class from all buttons
            colorBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Set current color
            currentColor = btn.dataset.color;
        });
    });
    
    // Brush size
    const sizeBtns = document.querySelectorAll('.size-btn');
    sizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            sizeBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Set brush size
            brushSize = parseInt(btn.dataset.size);
            // Switch to brush mode
            setDrawingMode('brush');
            hideEraserOptions();
        });
    });
    
    // Clear button
    const clearBtn = document.getElementById('clear-btn');
    clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        strokes = []; // Clear the strokes array too
    });
    
    // Back button
    const backBtn = document.getElementById('back-btn');
    backBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    // Random word generation
    const wordDisplay = document.getElementById('word-display');
    const newWordBtn = document.getElementById('new-word-btn');
    const playerNameElement = document.getElementById('player-name');
    
    // Get saved username and language
    const username = localStorage.getItem('pictionary-username') || 'Player';
    const language = localStorage.getItem('pictionary-language') || 'en';
    
    // Display player name
    playerNameElement.textContent = username;
    
    // Generate random word
    function getRandomWord() {
        // Get difficulty levels
        const difficulties = ['easy', 'medium', 'hard'];
        const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
        
        // Get words for the selected language and difficulty
        const words = pictionaryWords[language][randomDifficulty];
        
        // Return a random word
        return words[Math.floor(Math.random() * words.length)];
    }
    
    // Set initial word
    wordDisplay.textContent = getRandomWord();
    
    // New word button
    newWordBtn.addEventListener('click', () => {
        wordDisplay.textContent = getRandomWord();
    });
}); 