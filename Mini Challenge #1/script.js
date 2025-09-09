class ReactionTimeGame {
    constructor() {
        this.gameState = 'idle'; // 'idle', 'waiting', 'ready', 'finished'
        this.startTime = 0;
        this.reactionTimes = [];
        this.bestTime = localStorage.getItem('bestReactionTime') ? 
                       parseInt(localStorage.getItem('bestReactionTime')) : null;
        this.timeoutId = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
    }
    
    initializeElements() {
        this.reactionButton = document.getElementById('reactionButton');
        this.startButton = document.getElementById('startButton');
        this.resetButton = document.getElementById('resetButton');
        this.instructions = document.getElementById('instructions');
        this.results = document.getElementById('results');
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.bestTimeDisplay = document.getElementById('bestTime');
        this.averageTimeDisplay = document.getElementById('averageTime');
        this.attemptsDisplay = document.getElementById('attempts');
    }
    
    attachEventListeners() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.resetButton.addEventListener('click', () => this.resetScores());
        this.reactionButton.addEventListener('click', () => this.handleButtonClick());
    }
    
    startGame() {
        if (this.gameState === 'idle' || this.gameState === 'finished') {
            this.gameState = 'waiting';
            this.updateButtonState('waiting', 'Wait for green...');
            this.instructions.textContent = 'Wait for the button to turn green, then click as fast as you can!';
            this.results.textContent = '';
            this.results.className = 'results';
            
            // Random delay between 3-8 seconds
            const delay = Math.random() * 5000 + 3000; // 3000-8000ms
            this.timeoutId = setTimeout(() => {
                if (this.gameState === 'waiting') {
                    this.gameState = 'ready';
                    this.startTime = Date.now();
                    this.updateButtonState('ready', 'CLICK NOW!');
                    this.instructions.textContent = 'CLICK NOW!';
                }
            }, delay);
        }
    }
    
    handleButtonClick() {
        if (this.gameState === 'waiting') {
            // Clicked too early
            this.gameState = 'finished';
            this.updateButtonState('too-early', 'Too Early!');
            this.instructions.textContent = 'You clicked too early! Wait for green.';
            this.results.textContent = 'Too early! Wait for the button to turn green.';
            this.results.className = 'results error';
            this.clearTimeout();
            
            // Reset after 2 seconds
            setTimeout(() => this.resetToIdle(), 2000);
            
        } else if (this.gameState === 'ready') {
            // Valid click
            const reactionTime = Date.now() - this.startTime;
            this.reactionTimes.push(reactionTime);
            
            // Update best time
            if (this.bestTime === null || reactionTime < this.bestTime) {
                this.bestTime = reactionTime;
                localStorage.setItem('bestReactionTime', this.bestTime.toString());
            }
            
            this.gameState = 'finished';
            this.updateButtonState('ready', 'Great!');
            this.instructions.textContent = `Reaction time: ${reactionTime}ms`;
            this.results.textContent = `Excellent! Your reaction time: ${reactionTime}ms`;
            this.results.className = 'results success';
            
            this.updateDisplay();
            
            // Reset after 3 seconds
            setTimeout(() => this.resetToIdle(), 3000);
        }
    }
    
    resetToIdle() {
        this.gameState = 'idle';
        this.updateButtonState('waiting', 'Start Game');
        this.instructions.textContent = 'Click "Start Game" to begin!';
        this.results.textContent = '';
        this.results.className = 'results';
    }
    
    updateButtonState(state, text) {
        this.reactionButton.className = `reaction-button ${state}`;
        this.reactionButton.textContent = text;
    }
    
    updateDisplay() {
        this.currentTimeDisplay.textContent = this.reactionTimes.length > 0 ? 
            this.reactionTimes[this.reactionTimes.length - 1] + 'ms' : '--';
        
        this.bestTimeDisplay.textContent = this.bestTime ? this.bestTime + 'ms' : '--';
        
        if (this.reactionTimes.length > 0) {
            const average = Math.round(
                this.reactionTimes.reduce((sum, time) => sum + time, 0) / this.reactionTimes.length
            );
            this.averageTimeDisplay.textContent = average + 'ms';
        } else {
            this.averageTimeDisplay.textContent = '--';
        }
        
        this.attemptsDisplay.textContent = this.reactionTimes.length;
    }
    
    resetScores() {
        this.reactionTimes = [];
        this.bestTime = null;
        localStorage.removeItem('bestReactionTime');
        this.updateDisplay();
        this.results.textContent = 'Scores reset!';
        this.results.className = 'results info';
        
        setTimeout(() => {
            this.results.textContent = '';
            this.results.className = 'results';
        }, 2000);
    }
    
    clearTimeout() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ReactionTimeGame();
});
