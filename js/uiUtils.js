/**
 * UI Utilities Module
 * Handles DOM manipulation, form handling, and UI interactions
 */

class UIUtils {
  constructor() {
    this.activeTab = 'dashboard';
    this.theme = 'dark';
  }

  /**
   * Initialize the application
   */
  init() {
    this.initializeTheme();
    this.setupEventListeners();
    this.loadSavedData();
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Form submissions
    this.setupFormListeners();
  }

  /**
   * Setup form event listeners
   */
  setupFormListeners() {
    const forms = [
      { id: 'income-form', handler: this.handleIncomeSubmit.bind(this) },
      { id: 'budget-form', handler: this.handleBudgetSubmit.bind(this) },
      { id: 'debt-form', handler: this.handleDebtSubmit.bind(this) },
      { id: 'emergency-form', handler: this.handleEmergencySubmit.bind(this) },
      { id: 'goals-form', handler: this.handleGoalsSubmit.bind(this) },
      { id: 'investment-form', handler: this.handleInvestmentSubmit.bind(this) }
    ];

    forms.forEach(({ id, handler }) => {
      const form = document.getElementById(id);
      if (form) {
        form.addEventListener('submit', handler);
      }
    });
  }

  /**
   * Switch between tabs
   */
  switchTab(tabName) {
    // Update active tab
    this.activeTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-tab') === tabName;
      btn.className = `tab-btn inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
      }`;
    });

    // Show/hide tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      const isActive = content.id === `${tabName}-tab`;
      content.classList.toggle('active', isActive);
      content.style.display = isActive ? 'block' : 'none';
    });

    // Update dashboard if switching to dashboard
    if (tabName === 'dashboard' && window.updateDashboard) {
      window.updateDashboard();
    }
  }

  /**
   * Initialize theme
   */
  initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.theme = savedTheme;
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }

  /**
   * Toggle theme
   */
  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', this.theme === 'dark');
    localStorage.setItem('theme', this.theme);
  }

  /**
   * Load saved data on initialization
   */
  loadSavedData() {
    if (window.dataManager) {
      window.dataManager.loadData();
    }
  }

  /**
   * Handle income form submission
   */
  handleIncomeSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const payAmount = window.sanitizeNumber(formData.get('payAmount'));
    const frequency = formData.get('payFrequency');
    const hoursPerDay = window.sanitizeNumber(formData.get('hoursPerDay'));
    const daysPerWeek = window.sanitizeNumber(formData.get('daysPerWeek'));
    const weeksPerYear = window.sanitizeNumber(formData.get('weeksPerYear'));
    const zipcode = formData.get('zipcode')?.trim();

    // Validate input
    if (payAmount <= 0) {
      this.showError('Please enter a valid pay amount.');
      return;
    }

    if (!zipcode || !/^\d{5}(-\d{4})?$/.test(zipcode)) {
      this.showError('Please enter a valid 5-digit ZIP code.');
      return;
    }

    // Calculate and save
    const annualIncome = window.calculateAnnualIncome(payAmount, frequency, hoursPerDay, daysPerWeek, weeksPerYear);
    const taxData = window.calculateAllTaxes(annualIncome, zipcode);

    // Update data store
    window.dataManager.updateSection('income', {
      payAmount,
      payFrequency: frequency,
      hoursPerDay: hoursPerDay || 8,
      daysPerWeek: daysPerWeek || 5,
      weeksPerYear: weeksPerYear || 52,
      zipcode,
      monthlyNetIncome: taxData.netIncome / 12,
      annualGrossIncome: annualIncome,
      calculatedDate: new Date().toISOString()
    });

    // Render results
    this.renderIncomeResults(taxData, annualIncome);
  }

  /**
   * Handle budget form submission
   */
  handleBudgetSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const monthlyIncome = window.sanitizeNumber(formData.get('monthlyIncome'));

    if (monthlyIncome <= 0) {
      this.showError('Please enter a valid monthly income.');
      return;
    }

    const expenses = {};
    const expenseFields = ['rentMortgage', 'utilities', 'groceries', 'transportation',
                          'insurance', 'debtPayments', 'diningOut', 'shopping',
                          'subscriptions', 'miscellaneous'];

    expenseFields.forEach(field => {
      expenses[field] = window.sanitizeNumber(formData.get(field));
    });

    const analysis = window.calculateBudgetAnalysis(monthlyIncome, expenses);

    // Update data store
    window.dataManager.updateSection('budget', {
      monthlyIncome,
      expenses,
      totalExpenses: analysis.totalExpenses,
      analysis,
      lastUpdated: new Date().toISOString()
    });

    // Render results
    this.renderBudgetResults(analysis);
  }

  /**
   * Render income calculation results
   */
  renderIncomeResults(taxData, annualIncome) {
    const resultsEl = document.getElementById('income-results');
    if (!resultsEl) return;

    const monthlyNet = taxData.netIncome / 12;
    const weeklyNet = taxData.netIncome / 52;

    resultsEl.innerHTML = `
      <div class="results-container">
        <h3>Income Summary</h3>
        <div class="income-breakdown">
          <div class="income-row">
            <span>Annual Gross:</span>
            <strong>${window.toCurrency(annualIncome)}</strong>
          </div>
          <div class="income-row">
            <span>Annual Net:</span>
            <strong>${window.toCurrency(taxData.netIncome)}</strong>
          </div>
          <div class="income-row">
            <span>Monthly Net:</span>
            <strong>${window.toCurrency(monthlyNet)}</strong>
          </div>
          <div class="income-row">
            <span>Weekly Net:</span>
            <strong>${window.toCurrency(weeklyNet)}</strong>
          </div>
        </div>

        <h4>Tax Breakdown</h4>
        <div class="tax-breakdown">
          <div class="tax-row">
            <span>Federal Tax:</span>
            <span>${window.toCurrency(taxData.federalTax)}</span>
          </div>
          <div class="tax-row">
            <span>Social Security:</span>
            <span>${window.toCurrency(taxData.socialSecurityTax)}</span>
          </div>
          <div class="tax-row">
            <span>Medicare:</span>
            <span>${window.toCurrency(taxData.medicareTax)}</span>
          </div>
          <div class="tax-row">
            <span>State Tax:</span>
            <span>${window.toCurrency(taxData.stateTax)}</span>
          </div>
          <div class="tax-row total-row">
            <span><strong>Total Tax:</strong></span>
            <span><strong>${window.toCurrency(taxData.totalTax)}</strong></span>
          </div>
          <div class="tax-row">
            <span>Effective Rate:</span>
            <span>${taxData.effectiveRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render budget analysis results
   */
  renderBudgetResults(analysis) {
    const resultsEl = document.getElementById('budget-results');
    if (!resultsEl) return;

    const savingsColor = analysis.savingsRate > 20 ? 'success' :
                        analysis.savingsRate > 10 ? 'warning' : 'danger';

    resultsEl.innerHTML = `
      <div class="results-container">
        <h3>Budget Analysis</h3>
        <div class="budget-summary">
          <div class="summary-row ${savingsColor}">
            <span>Savings Rate:</span>
            <strong>${analysis.savingsRate.toFixed(1)}%</strong>
          </div>
          <div class="summary-row">
            <span>Remaining Income:</span>
            <strong>${window.toCurrency(analysis.remainingIncome)}</strong>
          </div>
          <div class="summary-row">
            <span>Total Expenses:</span>
            <strong>${window.toCurrency(analysis.totalExpenses)}</strong>
          </div>
        </div>

        <h4>Expense Breakdown</h4>
        <div class="expense-breakdown">
          ${analysis.categories.map(cat => `
            <div class="expense-row">
              <span>${this.formatCategoryName(cat.category)}:</span>
              <span>${window.toCurrency(cat.amount)} (${cat.percentage.toFixed(1)}%)</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Format category names for display
   */
  formatCategoryName(category) {
    return category.replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim();
  }

  /**
   * Show error message
   */
  showError(message) {
    if (window.dataManager) {
      window.dataManager.showNotification(message, 'error');
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    if (window.dataManager) {
      window.dataManager.showNotification(message, 'success');
    }
  }

  // Placeholder methods for other form handlers
  handleDebtSubmit(event) { /* Implementation needed */ }
  handleEmergencySubmit(event) { /* Implementation needed */ }
  handleGoalsSubmit(event) { /* Implementation needed */ }
  handleInvestmentSubmit(event) { /* Implementation needed */ }
}

// Create singleton instance
window.uiUtils = new UIUtils();

// Export functions for backward compatibility
window.switchTab = (tabName) => window.uiUtils.switchTab(tabName);
window.initializeTheme = () => window.uiUtils.initializeTheme();
window.toggleTheme = () => window.uiUtils.toggleTheme();