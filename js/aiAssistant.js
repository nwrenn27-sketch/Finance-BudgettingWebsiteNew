/**
 * AI Assistant Module
 * Handles AI chat functionality and financial advice generation
 */

class AIAssistant {
  constructor() {
    this.chatHistory = [];
    this.isTyping = false;
    this.financialData = null;
  }

  /**
   * Initialize the AI Assistant
   */
  init() {
    this.setupEventListeners();
    this.loadChatHistory();
    this.updateSendButton();
  }

  /**
   * Setup event listeners for chat functionality
   */
  setupEventListeners() {
    // Chat form submission
    const chatForm = document.getElementById('ai-chat-form');
    if (chatForm) {
      chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Message input changes
    const messageInput = document.getElementById('ai-message-input');
    if (messageInput) {
      messageInput.addEventListener('input', () => this.updateSendButton());
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSubmit(e);
        }
      });
    }

    // Suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const suggestion = e.target.getAttribute('data-suggestion');
        this.sendMessage(suggestion);
      });
    });

    // Clear chat button
    const clearChatBtn = document.getElementById('clear-chat-btn');
    if (clearChatBtn) {
      clearChatBtn.addEventListener('click', () => this.clearChatHistory());
    }
  }

  /**
   * Handle form submission
   */
  handleSubmit(e) {
    e.preventDefault();
    const messageInput = document.getElementById('ai-message-input');
    const message = messageInput.value.trim();
    
    if (message) {
      this.sendMessage(message);
      messageInput.value = '';
      this.updateSendButton();
    }
  }

  /**
   * Send a message to the AI
   */
  async sendMessage(message) {
    if (!message.trim()) return;

    // Add user message to chat
    this.addMessage(message, 'user');
    
    // Show typing indicator
    this.showTypingIndicator();
    
    try {
      // Get AI response
      const response = await this.getAIResponse(message);
      
      // Remove typing indicator
      this.hideTypingIndicator();
      
      // Add AI response to chat
      this.addMessage(response, 'ai');
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      this.hideTypingIndicator();
      this.addMessage('Sorry, I encountered an error. Please try again.', 'ai');
    }
  }

  /**
   * Add a message to the chat
   */
  addMessage(content, sender) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `${sender}-message`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
      <div class="message-avatar">
        ${sender === 'ai' ? this.getAIIcon() : this.getUserIcon()}
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-sender">${sender === 'ai' ? 'AI Assistant' : 'You'}</span>
          <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${this.formatMessage(content)}</div>
      </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Save to chat history
    this.chatHistory.push({ content, sender, timestamp: new Date() });
    this.saveChatHistory();
  }

  /**
   * Get AI response based on user message
   */
  async getAIResponse(message) {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Get financial data for context
    this.financialData = this.getFinancialContext();

    // Generate response based on message content
    const response = this.generateFinancialAdvice(message, this.financialData);
    return response;
  }

  /**
   * Generate financial advice based on user message
   */
  generateFinancialAdvice(message, financialData) {
    const lowerMessage = message.toLowerCase();
    
    // Budget-related advice
    if (lowerMessage.includes('budget') || lowerMessage.includes('spending') || lowerMessage.includes('expense')) {
      return this.getBudgetAdvice(financialData);
    }
    
    // Investment advice
    if (lowerMessage.includes('invest') || lowerMessage.includes('stock') || lowerMessage.includes('portfolio')) {
      return this.getInvestmentAdvice(financialData);
    }
    
    // Debt advice
    if (lowerMessage.includes('debt') || lowerMessage.includes('pay off') || lowerMessage.includes('loan')) {
      return this.getDebtAdvice(financialData);
    }
    
    // Emergency fund advice
    if (lowerMessage.includes('emergency') || lowerMessage.includes('savings') || lowerMessage.includes('fund')) {
      return this.getEmergencyFundAdvice(financialData);
    }
    
    // Goals advice
    if (lowerMessage.includes('goal') || lowerMessage.includes('save') || lowerMessage.includes('target')) {
      return this.getGoalsAdvice(financialData);
    }
    
    // Tax advice
    if (lowerMessage.includes('tax') || lowerMessage.includes('deduction') || lowerMessage.includes('refund')) {
      return this.getTaxAdvice(financialData);
    }
    
    // General financial advice
    return this.getGeneralAdvice(message, financialData);
  }

  /**
   * Get budget-related advice
   */
  getBudgetAdvice(data) {
    const responses = [
      "Here's a solid budgeting strategy: Follow the 50/30/20 rule - 50% for needs (rent, utilities, groceries), 30% for wants (entertainment, dining), and 20% for savings and debt repayment.",
      "To create an effective budget, start by tracking all your expenses for one month. Categorize them and identify areas where you can cut back. Even small changes can make a big difference!",
      "Consider using the envelope method for discretionary spending. Allocate cash for different categories and when it's gone, it's gone. This helps prevent overspending.",
      "A good budget should include: fixed expenses (rent, insurance), variable expenses (groceries, utilities), savings goals, and an emergency fund contribution."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Get investment advice
   */
  getInvestmentAdvice(data) {
    const responses = [
      "Start with low-cost index funds or ETFs. They provide broad market exposure with minimal fees. Consider a target-date fund if you're unsure about asset allocation.",
      "The key to successful investing is time in the market, not timing the market. Start early, invest consistently, and stay the course during market volatility.",
      "Diversification is crucial. Don't put all your eggs in one basket. Consider a mix of stocks, bonds, and other assets based on your risk tolerance and timeline.",
      "Before investing, make sure you have an emergency fund (3-6 months of expenses) and are contributing to any employer 401(k) match - that's free money!"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Get debt payoff advice
   */
  getDebtAdvice(data) {
    const responses = [
      "Two popular debt payoff strategies: 1) Debt avalanche - pay minimums on all debts, then put extra money toward the highest interest rate debt. 2) Debt snowball - pay off smallest debts first for psychological wins.",
      "Consider debt consolidation if you have multiple high-interest debts. A personal loan or balance transfer card with 0% APR can help you pay off debt faster.",
      "Stop using credit cards while paying off debt. Cut them up or freeze them in ice. Focus on paying more than the minimum payment each month.",
      "If you're struggling with debt, contact your creditors. Many offer hardship programs, payment plans, or even debt settlement options."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Get emergency fund advice
   */
  getEmergencyFundAdvice(data) {
    const responses = [
      "Aim for 3-6 months of essential expenses in your emergency fund. If you have a stable job, 3 months is fine. If your income is variable, aim for 6-12 months.",
      "Start small with your emergency fund - even $500 can help with unexpected car repairs or medical bills. Build it up gradually by setting up automatic transfers.",
      "Keep your emergency fund in a high-yield savings account or money market account. It should be easily accessible but separate from your checking account.",
      "Only use your emergency fund for true emergencies: job loss, major medical expenses, or urgent home/car repairs. Not for vacations or shopping!"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Get goals advice
   */
  getGoalsAdvice(data) {
    const responses = [
      "Set SMART financial goals: Specific, Measurable, Achievable, Relevant, and Time-bound. For example: 'Save $10,000 for a house down payment in 2 years.'",
      "Break large goals into smaller milestones. If you want to save $12,000 in a year, that's $1,000 per month or about $33 per day. Track your progress monthly.",
      "Prioritize your goals. Focus on high-priority items like emergency fund and retirement before saving for wants like vacations or luxury items.",
      "Use the 'pay yourself first' principle. Set up automatic transfers to your savings goals before you have a chance to spend the money elsewhere."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Get tax advice
   */
  getTaxAdvice(data) {
    const responses = [
      "Maximize your 401(k) contributions to reduce taxable income. In 2024, you can contribute up to $23,000 (or $30,500 if 50+).",
      "Consider contributing to an IRA for additional tax benefits. Traditional IRAs offer tax-deferred growth, while Roth IRAs provide tax-free withdrawals in retirement.",
      "Keep detailed records of all deductible expenses: charitable donations, medical expenses, business expenses, and home office costs.",
      "Don't forget about tax credits like the Earned Income Tax Credit, Child Tax Credit, or education credits. These can significantly reduce your tax bill."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Get general financial advice
   */
  getGeneralAdvice(message, data) {
    const responses = [
      "Great question! Financial success comes from consistent habits: spend less than you earn, save regularly, invest for the long term, and avoid high-interest debt.",
      "The most important financial habit is living below your means. Even if you earn a lot, spending more than you make will lead to financial stress.",
      "Start with the basics: build an emergency fund, pay off high-interest debt, and contribute to retirement accounts. These three steps will put you on solid financial ground.",
      "Remember, personal finance is personal. What works for others might not work for you. Focus on your own goals, timeline, and risk tolerance.",
      "Consider working with a financial advisor for complex situations, but you can handle most financial planning yourself with education and discipline."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Get financial context from the application
   */
  getFinancialContext() {
    // Try to get data from the data manager if available
    let context = {
      income: 0,
      expenses: 0,
      savings: 0,
      debt: 0,
      goals: []
    };

    if (window.dataManager) {
      const data = window.dataManager.getData();
      context = {
        income: data.income || 0,
        expenses: data.expenses || 0,
        savings: data.savings || 0,
        debt: data.debt || 0,
        goals: data.goals || []
      };
    }

    return context;
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="message-avatar">
        ${this.getAIIcon()}
      </div>
      <div class="typing-dots">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;

    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    this.isTyping = true;
  }

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
    this.isTyping = false;
  }

  /**
   * Update send button state
   */
  updateSendButton() {
    const messageInput = document.getElementById('ai-message-input');
    const sendButton = document.querySelector('.send-button');
    
    if (messageInput && sendButton) {
      const hasText = messageInput.value.trim().length > 0;
      sendButton.disabled = !hasText || this.isTyping;
    }
  }

  /**
   * Format message content
   */
  formatMessage(content) {
    // Convert line breaks to HTML
    return content.replace(/\n/g, '<br>');
  }

  /**
   * Get AI icon SVG
   */
  getAIIcon() {
    return `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>`;
  }

  /**
   * Get user icon SVG
   */
  getUserIcon() {
    return `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>`;
  }

  /**
   * Save chat history to localStorage
   */
  saveChatHistory() {
    try {
      localStorage.setItem('ai-chat-history', JSON.stringify(this.chatHistory));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  /**
   * Load chat history from localStorage
   */
  loadChatHistory() {
    try {
      const saved = localStorage.getItem('ai-chat-history');
      if (saved) {
        this.chatHistory = JSON.parse(saved);
        // Only keep last 50 messages to prevent storage bloat
        if (this.chatHistory.length > 50) {
          this.chatHistory = this.chatHistory.slice(-50);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      this.chatHistory = [];
    }
  }

  /**
   * Clear chat history
   */
  clearChatHistory() {
    this.chatHistory = [];
    localStorage.removeItem('ai-chat-history');
    
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
      chatMessages.innerHTML = `
        <div class="ai-message">
          <div class="message-avatar">
            ${this.getAIIcon()}
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-sender">AI Assistant</span>
              <span class="message-time">Just now</span>
            </div>
            <div class="message-text">
              Hello! I'm your AI financial assistant. How can I help you with your finances today?
            </div>
          </div>
        </div>
      `;
    }
  }
}

// Initialize AI Assistant when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.aiAssistant = new AIAssistant();
  window.aiAssistant.init();
});

// Export for use in other modules
window.AIAssistant = AIAssistant;
