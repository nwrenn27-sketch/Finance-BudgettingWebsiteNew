/**
 * Market Data Service Module
 * Handles real-time financial data from free APIs
 */

class MarketDataService {
  constructor() {
    this.config = {
      yahooFinanceApi: 'https://query1.finance.yahoo.com/v8/finance/chart',
      cryptoApi: 'https://api.coingecko.com/api/v3',
      cacheDuration: 60000, // 1 minute cache
      retryAttempts: 3,
      retryDelay: 1000
    };

    this.cache = new Map();
    this.requestQueue = new Map();
  }

  /**
   * Get relevant market data based on user message
   */
  async getRelevantMarketData(message) {
    const keywords = this.extractMarketKeywords(message);
    if (keywords.length === 0) return null;

    try {
      const promises = [];

      // Add stock data requests
      if (keywords.includes('stock') || keywords.includes('market') || keywords.includes('spy')) {
        promises.push(this.getStockData('SPY'));
      }
      if (keywords.includes('nasdaq') || keywords.includes('qqq')) {
        promises.push(this.getStockData('QQQ'));
      }

      // Add crypto data requests
      if (keywords.includes('crypto') || keywords.includes('bitcoin')) {
        promises.push(this.getCryptoData('bitcoin'));
      }
      if (keywords.includes('ethereum')) {
        promises.push(this.getCryptoData('ethereum'));
      }

      const results = await Promise.allSettled(promises);
      return this.processMarketResults(results);

    } catch (error) {
      console.error('Market data fetch error:', error);
      return null;
    }
  }

  /**
   * Extract market-related keywords from message
   */
  extractMarketKeywords(message) {
    const marketKeywords = [
      'stock', 'market', 'price', 'investment', 'invest',
      'crypto', 'bitcoin', 'ethereum', 'btc', 'eth',
      'spy', 'qqq', 'nasdaq', 's&p', 'dow'
    ];

    const lowerMessage = message.toLowerCase();
    return marketKeywords.filter(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Get stock data with caching and retry logic
   */
  async getStockData(symbol) {
    const cacheKey = `stock_${symbol}`;

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey);
    }

    // Make new request
    const request = this.fetchStockDataWithRetry(symbol);
    this.requestQueue.set(cacheKey, request);

    try {
      const data = await request;
      this.updateCache(cacheKey, data);
      return data;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  /**
   * Fetch stock data with retry logic
   */
  async fetchStockDataWithRetry(symbol, attempts = 0) {
    try {
      const response = await fetch(
        `${this.config.yahooFinanceApi}/${symbol}?interval=1d&range=1d`,
        {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return this.parseStockData(data, symbol);

    } catch (error) {
      if (attempts < this.config.retryAttempts) {
        await this.delay(this.config.retryDelay * (attempts + 1));
        return this.fetchStockDataWithRetry(symbol, attempts + 1);
      }
      throw error;
    }
  }

  /**
   * Parse Yahoo Finance API response
   */
  parseStockData(data, symbol) {
    if (data.chart?.result?.[0]) {
      const result = data.chart.result[0];
      const meta = result.meta;

      if (meta.regularMarketPrice && meta.previousClose) {
        return {
          symbol: symbol,
          price: meta.regularMarketPrice,
          change: meta.regularMarketPrice - meta.previousClose,
          changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
          timestamp: Date.now(),
          source: 'yahoo'
        };
      }
    }
    return null;
  }

  /**
   * Get cryptocurrency data with caching
   */
  async getCryptoData(coin) {
    const cacheKey = `crypto_${coin}`;

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    // Check if request is already in progress
    if (this.requestQueue.has(cacheKey)) {
      return this.requestQueue.get(cacheKey);
    }

    // Make new request
    const request = this.fetchCryptoDataWithRetry(coin);
    this.requestQueue.set(cacheKey, request);

    try {
      const data = await request;
      this.updateCache(cacheKey, data);
      return data;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }

  /**
   * Fetch crypto data with retry logic
   */
  async fetchCryptoDataWithRetry(coin, attempts = 0) {
    try {
      const response = await fetch(
        `${this.config.cryptoApi}/simple/price?ids=${coin}&vs_currencies=usd&include_24hr_change=true`,
        {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return this.parseCryptoData(data, coin);

    } catch (error) {
      if (attempts < this.config.retryAttempts) {
        await this.delay(this.config.retryDelay * (attempts + 1));
        return this.fetchCryptoDataWithRetry(coin, attempts + 1);
      }
      throw error;
    }
  }

  /**
   * Parse CoinGecko API response
   */
  parseCryptoData(data, coin) {
    if (data[coin]) {
      return {
        symbol: coin.toUpperCase(),
        price: data[coin].usd,
        changePercent: data[coin].usd_24h_change || 0,
        timestamp: Date.now(),
        source: 'coingecko'
      };
    }
    return null;
  }

  /**
   * Process market data results from Promise.allSettled
   */
  processMarketResults(results) {
    const marketData = {};

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const data = result.value;
        const key = data.symbol.toLowerCase();
        marketData[key] = data;
      }
    });

    return Object.keys(marketData).length > 0 ? marketData : null;
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;

    return Date.now() - cached.timestamp < this.config.cacheDuration;
  }

  /**
   * Update cache with new data
   */
  updateCache(key, data) {
    if (data) {
      this.cache.set(key, {
        data: data,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.cacheDuration) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get multiple stocks at once
   */
  async getMultipleStocks(symbols) {
    const promises = symbols.map(symbol => this.getStockData(symbol));
    const results = await Promise.allSettled(promises);

    return this.processMarketResults(results);
  }

  /**
   * Get multiple cryptocurrencies at once
   */
  async getMultipleCrypto(coins) {
    const promises = coins.map(coin => this.getCryptoData(coin));
    const results = await Promise.allSettled(promises);

    return this.processMarketResults(results);
  }

  /**
   * Get market summary (major indices + crypto)
   */
  async getMarketSummary() {
    try {
      const [stockData, cryptoData] = await Promise.all([
        this.getMultipleStocks(['SPY', 'QQQ']),
        this.getMultipleCrypto(['bitcoin', 'ethereum'])
      ]);

      return {
        ...stockData,
        ...cryptoData
      };
    } catch (error) {
      console.error('Market summary error:', error);
      return null;
    }
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      activeRequests: this.requestQueue.size
    };
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Global market data service instance
const MarketDataService = new MarketDataService();

// Auto-cleanup expired cache every 5 minutes
setInterval(() => {
  MarketDataService.clearExpiredCache();
}, 5 * 60 * 1000);