/**
 * AI Financial Assistant Module
 * Handles AI chat functionality, API integration, and financial context
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
    this.updateStatus();

    this.isInitialized = true;
  }

  /**
   * Cache DOM elements for performance
   */
  cacheElements() {
    this.elements = {
      chatInput: document.getElementById('chat-input'),
      sendButton: document.getElementById('send-message'),
      clearButton: document.getElementById('clear-chat'),
      chatMessages: document.getElementById('chat-messages'),
      quickPromptButtons: document.querySelectorAll('.quick-prompt-btn'),
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
    } else if (this.elements.apiKeySetup) {
      this.elements.apiKeySetup.style.display = 'block';
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Chat input events
    if (this.elements.chatInput && this.elements.sendButton) {
      this.elements.chatInput.addEventListener('input', () => this.handleInputChange());
      this.elements.chatInput.addEventListener('keypress', (e) => this.handleKeyPress(e));
      this.elements.sendButton.addEventListener('click', () => this.sendMessage());
    }

    // Clear chat button
    if (this.elements.clearButton) {
      this.elements.clearButton.addEventListener('click', () => this.clearChat());
    }

    // Quick prompt buttons
    this.elements.quickPromptButtons.forEach(button => {
      button.addEventListener('click', () => {
        const prompt = button.getAttribute('data-prompt');
        if (prompt && this.elements.chatInput) {
          this.elements.chatInput.value = prompt;
          this.sendMessage();
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
   * Handle input changes
   */
  handleInputChange() {
    if (!this.elements.chatInput || !this.elements.sendButton) return;

    const hasText = this.elements.chatInput.value.trim().length > 0;
    const hasApiKey = this.config.apiKey !== null;
    this.elements.sendButton.disabled = !hasText || !hasApiKey;
  }

  /**
   * Handle keypress events
   */
  handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
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
      this.handleInputChange();
    }
  }

  /**
   * Send message to AI
   */
  async sendMessage() {
    if (!this.elements.chatInput || !this.config.apiKey) return;

    const message = this.elements.chatInput.value.trim();
    if (!message) return;

    // Clear input and update UI
    this.elements.chatInput.value = '';
    this.handleInputChange();

    // Add user message
    this.addMessage(message, 'user');
    this.showTypingIndicator();

    try {
      // Get financial context and market data
      const [financialContext, marketData] = await Promise.all([
        this.getFinancialContext(),
        MarketDataService.getRelevantMarketData(message)
      ]);

      // Generate AI response
      const response = await this.generateResponse(message, financialContext, marketData);

      this.removeTypingIndicator();
      this.addMessage(response, 'ai');

      // Update message history
      this.updateMessageHistory(message, response);

    } catch (error) {
      console.error('AI Assistant Error:', error);
      this.removeTypingIndicator();
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

    const isUser = sender === 'user';
    messageDiv.innerHTML = this.createMessageHTML(content, isUser);

    this.elements.chatMessages.appendChild(messageDiv);
    this.scrollToBottom();
  }

  /**
   * Create message HTML
   */
  createMessageHTML(content, isUser) {
    const avatarIcon = isUser ?
      this.getUserIcon() :
      this.getAIIcon();

    return `
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${avatarIcon}
          </svg>
        </div>
        <div class="flex-1">
          <div class="bg-background rounded-lg p-3 border border-border">
            ${this.formatMessage(content)}
          </div>
        </div>
      </div>
    `;
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
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'ai-message';
    typingDiv.innerHTML = this.createTypingIndicatorHTML();

    this.elements.chatMessages.appendChild(typingDiv);
    this.scrollToBottom();
  }

  /**
   * Create typing indicator HTML
   */
  createTypingIndicatorHTML() {
    return `
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${this.getAIIcon()}
          </svg>
        </div>
        <div class="flex-1">
          <div class="typing-indicator">
            <span class="text-xs text-muted-foreground">AI is thinking</span>
            <div class="typing-dots">
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Remove typing indicator
   */
  removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }

  /**
   * Clear chat history
   */
  clearChat() {
    if (!this.elements.chatMessages) return;

    const welcomeMessage = this.elements.chatMessages.querySelector('.ai-message');
    this.elements.chatMessages.innerHTML = '';

    if (welcomeMessage) {
      this.elements.chatMessages.appendChild(welcomeMessage);
    }

    this.messageHistory = [];
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
      return "Please configure your Gemini API key to use the AI assistant.";
    }

    try {
      const prompt = this.buildPrompt(userMessage, financialContext, marketData);
      const response = await this.callGeminiAPI(prompt);

      return this.formatAIResponse(response, marketData);
    } catch (error) {
      console.error('AI Response Error:', error);
      return this.getFallbackResponse(marketData);
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
  getFallbackResponse(marketData) {
    let response = "I'm having trouble connecting to the AI service right now. ";

    if (marketData && Object.keys(marketData).length > 0) {
      response += "However, here's the current market data you requested:";
      response += this.formatMarketDataDisplay(marketData);
    } else {
      response += "Please try again later or check your API key configuration.";
    }

    return response;
  }

  /**
   * Update message history
   */
  updateMessageHistory(userMessage, aiResponse) {
    this.messageHistory.push({ user: userMessage, ai: aiResponse, timestamp: Date.now() });

    // Keep only recent messages
    if (this.messageHistory.length > this.config.maxMessagesHistory) {
      this.messageHistory = this.messageHistory.slice(-this.config.maxMessagesHistory);
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
   * Get user icon SVG
   */
  getUserIcon() {
    return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>';
  }

  /**
   * Get AI icon SVG
   */
  getAIIcon() {
    return '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>';
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