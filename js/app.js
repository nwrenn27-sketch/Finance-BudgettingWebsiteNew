/**
 * Main Application Module
 * Initializes and coordinates all modules
 */

class FinanceApp {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    if (this.initialized) return;

    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
        return;
      }

      // Initialize modules in order
      await this.initializeModules();

      // Setup global error handling
      this.setupErrorHandling();

      // Mark as initialized
      this.initialized = true;

      console.log('FinanceApp initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FinanceApp:', error);
      this.showError('Application failed to initialize. Please refresh the page.');
    }
  }

  /**
   * Initialize all modules
   */
  async initializeModules() {
    // Initialize UI utilities first (handles theme, tabs, etc.)
    if (window.uiUtils) {
      window.uiUtils.init();
    }

    // Load saved data
    if (window.dataManager) {
      window.dataManager.loadData();
    }

    // Setup dashboard updates
    this.setupDashboard();

    // Setup form auto-save
    this.setupAutoSave();
  }

  /**
   * Setup dashboard functionality
   */
  setupDashboard() {
    window.updateDashboard = () => {
      this.updateFinancialMetrics();
      this.updateHealthScore();
      this.updateRecommendations();
    };

    // Initial dashboard update
    window.updateDashboard();
  }

  /**
   * Setup auto-save functionality for forms
   */
  setupAutoSave() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        input.addEventListener('blur', () => {
          // Auto-save on field blur (with debouncing)
          this.debounce(() => {
            if (window.dataManager) {
              window.dataManager.saveData();
            }
          }, 1000);
        });
      });
    });
  }

  /**
   * Update financial metrics on dashboard
   */
  updateFinancialMetrics() {
    if (!window.dataManager) return;

    const data = window.dataManager.data;

    // Update income metric
    const monthlyIncomeEl = document.getElementById('monthly-income-value');
    if (monthlyIncomeEl) {
      monthlyIncomeEl.textContent = data.income.monthlyNetIncome > 0
        ? window.toCurrency(data.income.monthlyNetIncome)
        : '--';
    }

    // Update expenses metric
    const monthlyExpensesEl = document.getElementById('monthly-expenses-value');
    if (monthlyExpensesEl) {
      monthlyExpensesEl.textContent = data.budget.totalExpenses > 0
        ? window.toCurrency(data.budget.totalExpenses)
        : '--';
    }

    // Update savings rate
    const savingsRateEl = document.getElementById('savings-rate-value');
    if (savingsRateEl && data.budget.analysis) {
      savingsRateEl.textContent = `${data.budget.analysis.savingsRate.toFixed(1)}%`;
    }

    // Update emergency fund
    const emergencyFundEl = document.getElementById('emergency-fund-value');
    if (emergencyFundEl) {
      emergencyFundEl.textContent = data.emergencyFund.progressPercent > 0
        ? `${data.emergencyFund.progressPercent.toFixed(1)}%`
        : '--';
    }

    // Update debt total
    const debtTotalEl = document.getElementById('debt-total-value');
    if (debtTotalEl) {
      const totalDebt = data.debts.reduce((sum, debt) => sum + debt.balance, 0);
      debtTotalEl.textContent = totalDebt > 0 ? window.toCurrency(totalDebt) : '--';
    }

    // Update investments
    const investmentsEl = document.getElementById('investments-value');
    if (investmentsEl) {
      investmentsEl.textContent = data.investments.amount > 0
        ? window.toCurrency(data.investments.amount)
        : '--';
    }
  }

  /**
   * Calculate and update health score
   */
  updateHealthScore() {
    if (!window.dataManager) return;

    const data = window.dataManager.data;
    let score = 0;
    let factors = 0;

    // Income factor (20 points)
    if (data.income.monthlyNetIncome > 0) {
      score += 20;
      factors++;
    }

    // Budget factor (20 points)
    if (data.budget.analysis && data.budget.analysis.savingsRate > 0) {
      const savingsScore = Math.min(20, data.budget.analysis.savingsRate);
      score += savingsScore;
      factors++;
    }

    // Emergency fund factor (20 points)
    if (data.emergencyFund.progressPercent > 0) {
      const emergencyScore = Math.min(20, data.emergencyFund.progressPercent / 5);
      score += emergencyScore;
      factors++;
    }

    // Debt factor (20 points) - inverse scoring
    if (data.debts.length > 0) {
      const totalDebt = data.debts.reduce((sum, debt) => sum + debt.balance, 0);
      const debtToIncomeRatio = totalDebt / (data.income.annualGrossIncome || 1);
      const debtScore = Math.max(0, 20 - (debtToIncomeRatio * 20));
      score += debtScore;
      factors++;
    } else if (data.income.monthlyNetIncome > 0) {
      score += 20; // No debt is good
      factors++;
    }

    // Investment factor (20 points)
    if (data.investments.amount > 0) {
      score += 20;
      factors++;
    }

    // Normalize score
    const normalizedScore = factors > 0 ? Math.round(score / factors * 5) : 0;

    // Update UI
    const healthScoreEl = document.getElementById('health-score');
    if (healthScoreEl) {
      healthScoreEl.textContent = normalizedScore;
      healthScoreEl.className = normalizedScore >= 80 ? 'status-positive' :
                                normalizedScore >= 60 ? 'status-warning' :
                                'status-negative';
    }
  }

  /**
   * Update recommendations based on current data
   */
  updateRecommendations() {
    if (!window.dataManager) return;

    const data = window.dataManager.data;
    const recommendationsEl = document.getElementById('smart-recommendations');
    if (!recommendationsEl) return;

    const recommendations = [];

    // Income recommendation
    if (data.income.monthlyNetIncome === 0) {
      recommendations.push({
        title: 'Calculate Your Income',
        description: 'Start by calculating your take-home pay to build your financial foundation.',
        action: 'Start',
        tab: 'income'
      });
    }

    // Budget recommendation
    if (data.budget.totalExpenses === 0 && data.income.monthlyNetIncome > 0) {
      recommendations.push({
        title: 'Create Your Budget',
        description: 'Track your expenses and optimize your spending for better savings.',
        action: 'Plan Budget',
        tab: 'budget'
      });
    }

    // Emergency fund recommendation
    if (data.emergencyFund.progressPercent < 100 && data.budget.analysis) {
      recommendations.push({
        title: 'Build Emergency Fund',
        description: `You're ${data.emergencyFund.progressPercent.toFixed(0)}% complete. Aim for 3-6 months of expenses.`,
        action: 'Set Goal',
        tab: 'emergency'
      });
    }

    // Debt recommendation
    if (data.debts.length > 0) {
      const totalDebt = data.debts.reduce((sum, debt) => sum + debt.balance, 0);
      recommendations.push({
        title: 'Pay Off Debt',
        description: `Focus on eliminating ${window.toCurrency(totalDebt)} in total debt.`,
        action: 'Make Plan',
        tab: 'debt'
      });
    }

    // Investment recommendation
    if (data.investments.amount === 0 && data.budget.analysis && data.budget.analysis.savingsRate > 10) {
      recommendations.push({
        title: 'Start Investing',
        description: 'With good savings habits, consider investing for long-term growth.',
        action: 'Explore',
        tab: 'investments'
      });
    }

    // Render recommendations
    if (recommendations.length > 0) {
      recommendationsEl.innerHTML = recommendations.slice(0, 3).map(rec => `
        <div class="recommendation-card">
          <div class="rec-content">
            <h4>${rec.title}</h4>
            <p>${rec.description}</p>
          </div>
          <div class="rec-action">
            <button class="rec-btn" onclick="switchTab('${rec.tab}')">${rec.action}</button>
          </div>
        </div>
      `).join('');
    } else {
      recommendationsEl.innerHTML = `
        <div class="recommendation-card">
          <div class="rec-content">
            <h4>Great Job!</h4>
            <p>You're on track with your financial planning. Keep monitoring and adjusting your strategy.</p>
          </div>
        </div>
      `;
    }
  }

  /**
   * Setup global error handling
   */
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.showError('An unexpected error occurred. Please refresh the page.');
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.showError('An unexpected error occurred. Please refresh the page.');
    });
  }

  /**
   * Debounce function for performance optimization
   */
  debounce(func, wait) {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.debounceTimeout = setTimeout(func, wait);
  }

  /**
   * Show error message
   */
  showError(message) {
    if (window.dataManager) {
      window.dataManager.showNotification(message, 'error');
    } else {
      alert(message);
    }
  }
}

// Initialize the application
const financeApp = new FinanceApp();

// Auto-initialize when modules are loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all modules are loaded
    setTimeout(() => financeApp.init(), 100);
  });
} else {
  setTimeout(() => financeApp.init(), 100);
}

// Make app globally available
window.financeApp = financeApp;