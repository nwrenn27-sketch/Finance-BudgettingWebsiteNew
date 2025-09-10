# 🃏 Blackjack Game

A fully functional blackjack game built with HTML, CSS, and JavaScript where you play against an AI dealer.

## 🎮 Features

- **Complete Blackjack Rules**: Standard 52-card deck with proper card values
- **Smart AI Dealer**: Follows casino rules (hits on 16, stands on 17)
- **Ace Handling**: Aces automatically count as 1 or 11 for optimal hand value
- **Betting System**: Start with $1000, place bets from $1-$1000
- **Visual Cards**: Beautiful card graphics with suits and ranks
- **Responsive Design**: Works on desktop and mobile devices
- **Game States**: Proper button management and game flow

## 🚀 How to Play

1. Open `index.html` in your web browser
2. Set your bet amount using the input field or quick bet buttons ($10, $25, $50, $100)
3. Click "Deal" to start the game
4. Choose "Hit" to get another card or "Stand" to keep your current hand
5. Watch the AI dealer play their hand automatically
6. See the results and your updated balance
7. Click "New Game" to play again

## 🎯 Game Rules

- Get as close to 21 as possible without going over
- Face cards (J, Q, K) are worth 10 points
- Aces are worth 1 or 11 points (whichever is better)
- Dealer must hit on 16 and stand on 17
- Blackjack (21 with 2 cards) pays 3:2
- If you go over 21, you bust and lose

## 🛠️ Technical Details

- **Frontend**: Pure HTML, CSS, and JavaScript (no frameworks)
- **Card Logic**: Proper blackjack hand calculation with ace optimization
- **AI Dealer**: Realistic timing with 1-second delays between actions
- **State Management**: Complete game state tracking and button management
- **Responsive**: Mobile-friendly design with CSS Grid and Flexbox

## 📁 Project Structure

```
├── index.html          # Main HTML file
├── style.css           # CSS styling and responsive design
├── script.js           # Game logic and AI dealer
└── README.md           # This file
```

## 🎨 Design Features

- Modern glass-morphism UI with gradient backgrounds
- Realistic playing card graphics
- Color-coded game status messages (win/lose/tie)
- Smooth animations and hover effects
- Professional casino-style appearance

## 🧪 Testing

The game has been tested for:
- ✅ Proper ace handling (1 or 11)
- ✅ Blackjack detection and payouts
- ✅ Dealer AI logic
- ✅ Button state management
- ✅ Betting system
- ✅ Win/lose/tie scenarios
- ✅ Mobile responsiveness

## 🚀 Live Demo

Simply open `index.html` in any modern web browser to start playing!

---

*Built as part of coding challenges - a complete blackjack implementation with AI dealer*
