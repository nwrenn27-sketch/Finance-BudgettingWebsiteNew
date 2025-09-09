// Game state
let gameState = {
    deck: [],
    playerHand: [],
    dealerHand: [],
    playerBalance: 1000,
    currentBet: 10,
    gameInProgress: false,
    gamePhase: 'betting' // betting, dealing, playing, dealer, finished
};

// Card suits and ranks
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Initialize the game
function initGame() {
    createDeck();
    shuffleDeck();
    updateDisplay();
}

// Create a standard 52-card deck
function createDeck() {
    gameState.deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            gameState.deck.push({
                suit: suit,
                rank: rank,
                value: getCardValue(rank)
            });
        }
    }
}

// Get card value for blackjack
function getCardValue(rank) {
    if (rank === 'A') return 11; // Ace can be 1 or 11, we'll handle this in calculateHandValue
    if (['J', 'Q', 'K'].includes(rank)) return 10;
    return parseInt(rank);
}

// Shuffle the deck using Fisher-Yates algorithm
function shuffleDeck() {
    for (let i = gameState.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
    }
}

// Calculate hand value (handles aces properly)
function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;
    
    for (let card of hand) {
        if (card.rank === 'A') {
            aces++;
            value += 11;
        } else {
            value += card.value;
        }
    }
    
    // Adjust for aces (convert from 11 to 1 if needed)
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }
    
    return value;
}

// Deal a card from the deck
function dealCard() {
    if (gameState.deck.length === 0) {
        createDeck();
        shuffleDeck();
    }
    return gameState.deck.pop();
}

// Set bet amount
function setBet(amount) {
    if (gameState.gamePhase !== 'betting') return;
    
    if (amount <= gameState.playerBalance) {
        gameState.currentBet = amount;
        document.getElementById('bet-amount').value = amount;
    }
}

// Deal initial cards
function dealCards() {
    if (gameState.gamePhase !== 'betting') return;
    
    // Check if player has enough balance
    if (gameState.currentBet > gameState.playerBalance) {
        updateGameStatus("Insufficient balance!");
        return;
    }
    
    // Deduct bet from balance
    gameState.playerBalance -= gameState.currentBet;
    
    // Reset hands
    gameState.playerHand = [];
    gameState.dealerHand = [];
    
    // Deal initial cards
    gameState.playerHand.push(dealCard());
    gameState.dealerHand.push(dealCard());
    gameState.playerHand.push(dealCard());
    gameState.dealerHand.push(dealCard());
    
    // Update game state
    gameState.gameInProgress = true;
    gameState.gamePhase = 'playing';
    
    // Update display
    updateDisplay();
    updateGameStatus("Your turn! Hit or Stand?");
    
    // Check for blackjack
    if (calculateHandValue(gameState.playerHand) === 21) {
        if (calculateHandValue(gameState.dealerHand) === 21) {
            // Both have blackjack - push
            gameState.gamePhase = 'finished';
            updateGameStatus("Both have Blackjack! It's a push!");
            gameState.playerBalance += gameState.currentBet; // Return bet
        } else {
            // Player has blackjack, dealer doesn't
            gameState.gamePhase = 'finished';
            const winnings = Math.floor(gameState.currentBet * 2.5); // 3:2 payout
            gameState.playerBalance += winnings;
            updateGameStatus(`Blackjack! You win $${winnings}!`);
        }
    }
    
    // Update buttons for current game state
    updateButtons();
}

// Player hits
function hit() {
    if (gameState.gamePhase !== 'playing') return;
    
    gameState.playerHand.push(dealCard());
    updateDisplay();
    
    const playerValue = calculateHandValue(gameState.playerHand);
    
    if (playerValue > 21) {
        // Player busts
        gameState.gamePhase = 'finished';
        updateGameStatus("Bust! You lose!");
    } else if (playerValue === 21) {
        // Player has 21, must stand
        stand();
    } else {
        updateGameStatus("Your turn! Hit or Stand?");
    }
    
    updateButtons();
}

// Player stands
function stand() {
    if (gameState.gamePhase !== 'playing') return;
    
    gameState.gamePhase = 'dealer';
    updateGameStatus("Dealer's turn...");
    
    // Dealer plays
    dealerPlay();
}

// AI dealer logic
function dealerPlay() {
    const dealerValue = calculateHandValue(gameState.dealerHand);
    
    // Dealer must hit on 16 and stand on 17
    if (dealerValue < 17) {
        setTimeout(() => {
            gameState.dealerHand.push(dealCard());
            updateDisplay();
            dealerPlay(); // Recursive call to continue dealer's turn
        }, 1000);
    } else {
        // Dealer stands
        setTimeout(() => {
            determineWinner();
        }, 1000);
    }
}

// Determine winner
function determineWinner() {
    const playerValue = calculateHandValue(gameState.playerHand);
    const dealerValue = calculateHandValue(gameState.dealerHand);
    
    gameState.gamePhase = 'finished';
    
    if (dealerValue > 21) {
        // Dealer busts
        const winnings = gameState.currentBet * 2;
        gameState.playerBalance += winnings;
        updateGameStatus(`Dealer busts! You win $${winnings}!`);
    } else if (playerValue > dealerValue) {
        // Player wins
        const winnings = gameState.currentBet * 2;
        gameState.playerBalance += winnings;
        updateGameStatus(`You win! $${winnings}!`);
    } else if (dealerValue > playerValue) {
        // Dealer wins
        updateGameStatus("Dealer wins!");
    } else {
        // Tie
        gameState.playerBalance += gameState.currentBet; // Return bet
        updateGameStatus("It's a tie! Push!");
    }
    
    updateButtons();
}

// Start new game
function newGame() {
    gameState.gamePhase = 'betting';
    gameState.gameInProgress = false;
    gameState.playerHand = [];
    gameState.dealerHand = [];
    updateDisplay();
    updateGameStatus("Place your bet and click 'Deal' to start!");
    updateButtons();
}

// Update button states
function updateButtons() {
    const dealBtn = document.getElementById('deal-btn');
    const hitBtn = document.getElementById('hit-btn');
    const standBtn = document.getElementById('stand-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    
    switch (gameState.gamePhase) {
        case 'betting':
            dealBtn.disabled = false;
            hitBtn.disabled = true;
            standBtn.disabled = true;
            newGameBtn.disabled = true;
            break;
        case 'playing':
            dealBtn.disabled = true;
            hitBtn.disabled = false;
            standBtn.disabled = false;
            newGameBtn.disabled = true;
            break;
        case 'dealer':
            dealBtn.disabled = true;
            hitBtn.disabled = true;
            standBtn.disabled = true;
            newGameBtn.disabled = true;
            break;
        case 'finished':
            dealBtn.disabled = true;
            hitBtn.disabled = true;
            standBtn.disabled = true;
            newGameBtn.disabled = false;
            break;
    }
}

// Update game status message
function updateGameStatus(message) {
    const statusElement = document.getElementById('game-status');
    statusElement.textContent = message;
    
    // Add appropriate styling
    statusElement.className = 'game-status';
    if (message.includes('win')) {
        statusElement.classList.add('win');
    } else if (message.includes('lose') || message.includes('Bust')) {
        statusElement.classList.add('lose');
    } else if (message.includes('tie') || message.includes('push')) {
        statusElement.classList.add('tie');
    }
}

// Update display
function updateDisplay() {
    // Update balance
    document.getElementById('balance').textContent = gameState.playerBalance;
    
    // Update bet amount
    document.getElementById('bet-amount').value = gameState.currentBet;
    
    // Update player hand
    updateHandDisplay('player', gameState.playerHand);
    
    // Update dealer hand
    updateHandDisplay('dealer', gameState.dealerHand, gameState.gamePhase === 'playing');
    
    // Update hand values
    document.getElementById('player-value').textContent = calculateHandValue(gameState.playerHand);
    document.getElementById('dealer-value').textContent = gameState.gamePhase === 'playing' ? 
        calculateHandValue([gameState.dealerHand[0]]) : calculateHandValue(gameState.dealerHand);
}

// Update hand display
function updateHandDisplay(player, hand, hideSecondCard = false) {
    const cardsContainer = document.getElementById(`${player}-cards`);
    cardsContainer.innerHTML = '';
    
    hand.forEach((card, index) => {
        if (hideSecondCard && player === 'dealer' && index === 1) {
            // Show hidden card for dealer's second card during player's turn
            const cardElement = document.createElement('div');
            cardElement.className = 'card hidden-card';
            cardElement.innerHTML = '?';
            cardsContainer.appendChild(cardElement);
        } else {
            // Show normal card
            const cardElement = document.createElement('div');
            cardElement.className = `card ${isRedCard(card.suit) ? 'red' : 'black'}`;
            
            cardElement.innerHTML = `
                <div class="card-rank">${card.rank}</div>
                <div class="card-suit">${card.suit}</div>
                <div class="card-rank-bottom">${card.rank}</div>
            `;
            
            cardsContainer.appendChild(cardElement);
        }
    });
}

// Check if card is red
function isRedCard(suit) {
    return suit === '♥' || suit === '♦';
}

// Handle bet amount input change
document.getElementById('bet-amount').addEventListener('input', function() {
    const betAmount = parseInt(this.value);
    if (betAmount > 0 && betAmount <= gameState.playerBalance) {
        gameState.currentBet = betAmount;
    }
});

// Initialize the game when page loads
window.addEventListener('load', function() {
    initGame();
    updateButtons();
});
