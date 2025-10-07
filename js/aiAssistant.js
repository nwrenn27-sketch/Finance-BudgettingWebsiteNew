/**
 * AI Financial Assistant Module
 * Handles AI chat functionality, API integration, and financial context
 * Enhanced with real-time market data and Gemini AI integration
 */

class AIAssistant {
  constructor() {
    this.config = {
      geminiApiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      maxMessagesHistory: 20,
      apiKey: null
    };

    this.elements = {};
    this.messageHistory = [];
    this.isInitialized = false;
    this.isTyping = false;
    this.financialData = null;

    this.init();
  }

  /**
   * Initialize AI Assistant
   */
  init() {
    if (this.isInitialized) return;

    this.cacheElements();
    this.loadApiKey();
    this.attachEventListeners();
    this.loadChatHistory();
    this.updateStatus();

    this.isInitialized = true;
  }

  /**
   * Cache DOM elements for performance
   */
  cacheElements() {
    this.elements = {
      chatInput: document.getElementById('ai-message-input'),
      sendButton: document.querySelector('.send-button'),
      clearButton: document.getElementById('clear-chat-btn'),
      chatMessages: document.getElementById('chat-messages'),
      chatForm: document.getElementById('ai-chat-form'),
      suggestionChips: document.querySelectorAll('.suggestion-chip'),
      apiKeyInput: document.getElementById('gemini-api-key'),
      saveApiKeyButton: document.getElementById('save-api-key'),
      apiKeySetup: document.getElementById('api-key-setup'),
      aiStatus: document.getElementById('ai-status')
    };
  }

  /**
   * Load saved API key from localStorage
   */
  loadApiKey() {
    const savedApiKey = localStorage.getItem('gemini-api-key');
    if (savedApiKey) {
      this.config.apiKey = savedApiKey;
      if (this.elements.apiKeySetup) {
        this.elements.apiKeySetup.style.display = 'none';
      }
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Chat form submission
    if (this.elements.chatForm) {
      this.elements.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Chat input events
    if (this.elements.chatInput && this.elements.sendButton) {
      this.elements.chatInput.addEventListener('input', () => this.updateSendButton());
      this.elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSubmit(e);
        }
      });
    }

    // Clear chat button
    if (this.elements.clearButton) {
      this.elements.clearButton.addEventListener('click', () => this.clearChatHistory());
    }

    // Suggestion chips
    this.elements.suggestionChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        const suggestion = e.target.getAttribute('data-suggestion');
        if (suggestion) {
          this.sendMessage(suggestion);
        }
      });
    });

    // API key setup
    if (this.elements.saveApiKeyButton && this.elements.apiKeyInput) {
      this.elements.saveApiKeyButton.addEventListener('click', () => this.saveApiKey());
      this.elements.apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.saveApiKey();
      });
    }
  }

  /**
   * Handle form submission
   */
  handleSubmit(e) {
    e.preventDefault();
    const message = this.elements.chatInput.value.trim();

    if (message) {
      this.sendMessage(message);
      this.elements.chatInput.value = '';
      this.updateSendButton();
    }
  }

  /**
   * Save API key
   */
  saveApiKey() {
    if (!this.elements.apiKeyInput) return;

    const apiKey = this.elements.apiKeyInput.value.trim();
    if (apiKey) {
      this.config.apiKey = apiKey;
      localStorage.setItem('gemini-api-key', apiKey);

      if (this.elements.apiKeySetup) {
        this.elements.apiKeySetup.style.display = 'none';
      }

      this.updateStatus('Ready');
      this.showNotification('API key saved successfully!', 'success');
      this.updateSendButton();
    }
  }

  /**
   * Send message to AI
   */
  async sendMessage(message) {
    if (!message.trim()) return;

    // Add user message to chat
    this.addMessage(message, 'user');
    this.showTypingIndicator();

    try {
      // Get financial context and market data
      const [financialContext, marketData] = await Promise.all([
        this.getFinancialContext(),
        MarketDataService ? MarketDataService.getRelevantMarketData(message) : null
      ]);

      // Generate AI response
      const response = await this.generateResponse(message, financialContext, marketData);

      this.hideTypingIndicator();
      this.addMessage(response, 'ai');

      // Update message history
      this.updateMessageHistory(message, response);

    } catch (error) {
      console.error('AI Assistant Error:', error);
      this.hideTypingIndicator();
      this.addMessage('I apologize, but I encountered an error. Please try again or check your API key.', 'ai');
    }
  }

  /**
   * Add message to chat
   */
  addMessage(content, sender) {
    if (!this.elements.chatMessages) return;

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

    this.elements.chatMessages.appendChild(messageDiv);
    this.scrollToBottom();

    // Save to chat history
    this.messageHistory.push({ content, sender, timestamp: new Date() });
    this.saveChatHistory();
  }

  /**
   * Format message content
   */
  formatMessage(message) {
    return message
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" class="text-primary hover:underline">$1</a>');
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    if (!this.elements.chatMessages) return;

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

    this.elements.chatMessages.appendChild(typingDiv);
    this.scrollToBottom();
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
    if (!this.elements.chatInput || !this.elements.sendButton) return;

    const hasText = this.elements.chatInput.value.trim().length > 0;
    this.elements.sendButton.disabled = !hasText || this.isTyping;
  }

  /**
   * Get financial context from app data
   */
  async getFinancialContext() {
    const context = {
      income: null,
      budget: null,
      emergency: null,
      goals: null
    };

    try {
      // Get income data
      if (typeof FinancialDataStore !== 'undefined' && FinancialDataStore.income) {
        const income = FinancialDataStore.income;
        context.income = {
          annual: income.annualIncome,
          monthly: income.monthlyIncome,
          netAnnual: income.netIncome,
          netMonthly: income.netMonthly
        };
      }

      // Get budget data
      if (typeof FinancialDataStore !== 'undefined' && FinancialDataStore.budget) {
        context.budget = FinancialDataStore.budget;
      }

      // Get emergency fund data
      if (typeof FinancialDataStore !== 'undefined' && FinancialDataStore.emergencyFund) {
        context.emergency = FinancialDataStore.emergencyFund;
      }
    } catch (error) {
      console.log('Financial context not available:', error);
    }

    return context;
  }

  /**
   * Generate AI response
   */
  async generateResponse(userMessage, financialContext, marketData) {
    if (!this.config.apiKey) {
      // Return general advice without API key
      return this.getGeneralAdvice(userMessage, financialContext);
    }

    try {
      const prompt = this.buildPrompt(userMessage, financialContext, marketData);
      const response = await this.callGeminiAPI(prompt);
      return this.formatAIResponse(response, marketData);
    } catch (error) {
      console.error('AI Response Error:', error);
      // Return general advice on error
      return this.getGeneralAdvice(userMessage, financialContext);
    }
  }

  /**
   * Build context-aware prompt
   */
  buildPrompt(userMessage, financialContext, marketData) {
    let systemPrompt = `You are a helpful financial advisor AI assistant. Provide accurate, personalized financial advice.

User's Financial Context:`;

    if (financialContext.income) {
      systemPrompt += `\n- Annual Income: $${financialContext.income.annual?.toLocaleString() || 'Not provided'}`;
      systemPrompt += `\n- Monthly Net Income: $${financialContext.income.netMonthly?.toLocaleString() || 'Not provided'}`;
    }

    if (financialContext.budget) {
      systemPrompt += `\n- Budget Information: Available`;
    }

    if (financialContext.emergency) {
      systemPrompt += `\n- Emergency Fund: $${financialContext.emergency.currentFund?.toLocaleString() || '0'} (Target: $${financialContext.emergency.targetAmount?.toLocaleString() || 'Not set'})`;
    }

    if (marketData && Object.keys(marketData).length > 0) {
      systemPrompt += `\n\nCurrent Market Data:`;
      Object.entries(marketData).forEach(([key, data]) => {
        if (data) {
          const changeSymbol = data.changePercent >= 0 ? '+' : '';
          systemPrompt += `\n- ${data.symbol}: $${data.price?.toFixed(2)} (${changeSymbol}${data.changePercent?.toFixed(2)}%)`;
        }
      });
    }

    systemPrompt += `\n\nProvide helpful, specific advice. Keep responses under 200 words unless detailed explanation is needed. Use bullet points when appropriate.`;

    return `${systemPrompt}\n\nUser Question: ${userMessage}`;
  }

  /**
   * Call Gemini API
   */
  async callGeminiAPI(prompt) {
    const response = await fetch(`${this.config.geminiApiUrl}?key=${this.config.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('Invalid API response format');
  }

  /**
   * Format AI response with market data
   */
  formatAIResponse(response, marketData) {
    if (marketData && Object.keys(marketData).length > 0) {
      response += this.formatMarketDataDisplay(marketData);
    }
    return response;
  }

  /**
   * Format market data for display
   */
  formatMarketDataDisplay(marketData) {
    let display = `\n\n**Current Market Snapshot:**\n`;

    Object.entries(marketData).forEach(([key, data]) => {
      if (data) {
        const changeSymbol = data.changePercent >= 0 ? '+' : '';
        display += `\n• **${data.symbol}**: $${data.price?.toFixed(2)} (${changeSymbol}${data.changePercent?.toFixed(2)}%)`;
      }
    });

    return display;
  }

  /**
   * Get fallback response
   */
  getFallbackResponse(userMessage, financialContext, marketData) {
    let response = "I'm having trouble connecting to the AI service right now. ";

    if (marketData && Object.keys(marketData).length > 0) {
      response += "However, here's the current market data you requested:";
      response += this.formatMarketDataDisplay(marketData);
    } else {
      response += "Here's some general advice: " + this.getGeneralAdvice(userMessage, financialContext);
    }

    return response;
  }

  /**
   * Get general financial advice
   */
  getGeneralAdvice(message, financialContext) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('budget') || lowerMessage.includes('spending')) {
      return "**Budgeting Tips:**\n\n• Follow the 50/30/20 rule: 50% for needs, 30% for wants, 20% for savings and debt repayment\n• Track all your expenses for at least one month to understand spending patterns\n• Use the Budget tab in this app to categorize and analyze your spending\n• Cut discretionary expenses first when trying to save more\n• Review and adjust your budget monthly";
    }

    if (lowerMessage.includes('invest') || lowerMessage.includes('stock')) {
      return "**Investment Guidance:**\n\n• Start with low-cost index funds (like S&P 500) for diversification\n• Dollar-cost averaging: Invest regularly regardless of market conditions\n• Don't try to time the market - time IN the market matters more\n• Consider your risk tolerance and time horizon\n• For beginners: 80-90% stocks, 10-20% bonds is common\n• Check out the Investments tab for safe stock recommendations";
    }

    if (lowerMessage.includes('debt') || lowerMessage.includes('pay off') || lowerMessage.includes('loan')) {
      return "**Debt Payoff Strategies:**\n\n• **Debt Avalanche:** Pay off highest interest rate debt first (saves most money)\n• **Debt Snowball:** Pay off smallest balance first (psychological wins)\n• Make minimum payments on all debts, put extra toward your target debt\n• Consider balance transfers for high-interest credit cards\n• Use the Debt Payoff calculator in this app to create your plan\n• Avoid taking on new debt while paying off existing debt";
    }

    if (lowerMessage.includes('emergency') || lowerMessage.includes('savings')) {
      return "**Emergency Fund Guidelines:**\n\n• Start with $1,000 as a mini emergency fund\n• Build up to 3-6 months of essential expenses\n• 6-12 months if you're self-employed or have variable income\n• Keep it in a high-yield savings account for easy access\n• Don't invest emergency funds - liquidity is key\n• Use the Emergency Fund tab to calculate your target amount";
    }

    if (lowerMessage.includes('credit score') || lowerMessage.includes('credit')) {
      return "**Building Credit Score:**\n\n• Pay all bills on time (35% of score)\n• Keep credit utilization below 30% (30% of score)\n• Don't close old credit cards (age of credit: 15%)\n• Mix of credit types helps (10%)\n• Limit hard inquiries when applying for new credit (10%)\n• Check your credit report annually for errors";
    }

    return "**General Financial Advice:**\n\n• **Spend less than you earn** - fundamental rule of wealth building\n• **Build an emergency fund** - 3-6 months of expenses\n• **Pay off high-interest debt** - especially credit cards (>15% APR)\n• **Invest for the long term** - start with retirement accounts (401k, IRA)\n• **Track your spending** - use the tools in this app\n• **Review your finances monthly** - adjust as needed\n\n*For personalized AI advice, add a free Gemini API key in the setup section!*";
  }

  /**
   * Update message history
   */
  updateMessageHistory(userMessage, aiResponse) {
    this.messageHistory.push({ user: userMessage, ai: aiResponse, timestamp: Date.now() });

    if (this.messageHistory.length > this.config.maxMessagesHistory) {
      this.messageHistory = this.messageHistory.slice(-this.config.maxMessagesHistory);
    }
  }

  /**
   * Save chat history to localStorage
   */
  saveChatHistory() {
    try {
      localStorage.setItem('ai-chat-history', JSON.stringify(this.messageHistory));
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
        this.messageHistory = JSON.parse(saved);
        if (this.messageHistory.length > 50) {
          this.messageHistory = this.messageHistory.slice(-50);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      this.messageHistory = [];
    }
  }

  /**
   * Clear chat history
   */
  clearChatHistory() {
    this.messageHistory = [];
    localStorage.removeItem('ai-chat-history');

    if (this.elements.chatMessages) {
      this.elements.chatMessages.innerHTML = `
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
              Hello! I'm your AI financial assistant. I can help you with:
              <ul class="mt-2 space-y-1 text-sm">
                <li>• Budget planning and optimization</li>
                <li>• Investment strategies and recommendations</li>
                <li>• Debt payoff strategies</li>
                <li>• Emergency fund planning</li>
                <li>• Financial goal setting</li>
                <li>• Tax planning basics</li>
              </ul>
              What would you like to know about your finances?
            </div>
          </div>
        </div>
      `;
    }
  }

  /**
   * Update status indicator
   */
  updateStatus(status = null) {
    if (!this.elements.aiStatus) return;

    if (status) {
      this.elements.aiStatus.textContent = status;
    } else {
      this.elements.aiStatus.textContent = this.config.apiKey ? 'Ready' : 'Setup Required';
    }
  }

  /**
   * Scroll chat to bottom
   */
  scrollToBottom() {
    if (this.elements.chatMessages) {
      this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type) {
    if (typeof showNotification === 'function') {
      showNotification(message, type);
    }
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
}

// Global AI Assistant instance
let aiAssistant = null;

// Initialize when DOM is ready
function initializeAIAssistant() {
  if (!aiAssistant) {
    aiAssistant = new AIAssistant();
  }
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAIAssistant);
} else {
  initializeAIAssistant();
}