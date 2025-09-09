class NumberGuessingGame {
    constructor() {
        this.secretNumber = this.generateRandomNumber();
        this.attempts = 0;
        this.gameOver = false;
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
    }
    
    generateRandomNumber() {
        return Math.floor(Math.random() * 100) + 1;
    }
    
    initializeElements() {
        this.guessInput = document.getElementById('guessInput');
        this.submitBtn = document.getElementById('submitBtn');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.feedback = document.getElementById('feedback');
        this.attemptsDisplay = document.getElementById('attempts');
    }
    
    attachEventListeners() {
        this.submitBtn.addEventListener('click', () => this.handleGuess());
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        
        this.guessInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleGuess();
            }
        });
        
        // Focus input on page load
        this.guessInput.focus();
    }
    
    handleGuess() {
        if (this.gameOver) return;
        
        const guess = parseInt(this.guessInput.value);
        
        // Validate input
        if (isNaN(guess) || guess < 1 || guess > 100) {
            this.showFeedback('Please enter a valid number between 1 and 100!', 'error');
            this.guessInput.value = '';
            return;
        }
        
        this.attempts++;
        this.guessInput.value = '';
        
        if (guess === this.secretNumber) {
            this.gameWon();
        } else if (guess < this.secretNumber) {
            this.showFeedback(`Higher! The number is greater than ${guess}`, 'higher');
        } else {
            this.showFeedback(`Lower! The number is less than ${guess}`, 'lower');
        }
        
        this.updateDisplay();
    }
    
    showFeedback(message, type) {
        this.feedback.textContent = message;
        this.feedback.className = `feedback ${type}`;
    }
    
    gameWon() {
        this.gameOver = true;
        const message = `🎉 Congratulations! You guessed it in ${this.attempts} attempt${this.attempts === 1 ? '' : 's'}!`;
        this.showFeedback(message, 'correct');
        this.submitBtn.disabled = true;
        this.guessInput.disabled = true;
    }
    
    updateDisplay() {
        if (this.attempts === 0) {
            this.attemptsDisplay.textContent = '';
        } else {
            this.attemptsDisplay.textContent = `Attempts: ${this.attempts}`;
        }
    }
    
    startNewGame() {
        this.secretNumber = this.generateRandomNumber();
        this.attempts = 0;
        this.gameOver = false;
        
        this.guessInput.value = '';
        this.guessInput.disabled = false;
        this.submitBtn.disabled = false;
        
        this.feedback.textContent = '';
        this.feedback.className = 'feedback';
        this.attemptsDisplay.textContent = '';
        
        this.guessInput.focus();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NumberGuessingGame();
});
