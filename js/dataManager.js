/**
 * Financial Data Management Module
 * Handles all data persistence, storage, and management operations
 */

class FinancialDataManager {
  constructor() {
    // Central data store for all financial information
    this.data = {
      version: '1.0',
      income: {
        payAmount: 0,
        payFrequency: 'hour',
        hoursPerDay: 8,
        daysPerWeek: 5,
        weeksPerYear: 52,
        zipcode: '',
        monthlyNetIncome: 0,
        annualGrossIncome: 0,
        calculatedDate: null
      },
      budget: {
        monthlyIncome: 0,
        expenses: {
          rentMortgage: 0,
          utilities: 0,
          groceries: 0,
          transportation: 0,
          insurance: 0,
          debtPayments: 0,
          diningOut: 0,
          shopping: 0,
          subscriptions: 0,
          miscellaneous: 0
        },
        totalExpenses: 0,
        analysis: null,
        lastUpdated: null
      },
      debts: [],
      debtStrategy: {
        extraPayment: 0,
        selectedStrategy: 'avalanche',
        lastUpdated: null
      },
      emergencyFund: {
        targetAmount: 0,
        currentFund: 0,
        monthlyExpenses: 0,
        targetMonths: 6,
        monthlyContribution: 0,
        remainingAmount: 0,
        progressPercent: 0,
        monthsToGoal: 0,
        lastUpdated: null
      },
      goals: [],
      investments: {
        amount: 0,
        riskTolerance: 'moderate',
        timeframe: '5-10',
        focusType: 'balanced',
        lastUpdated: null
      },
      lastUpdated: null
    };
  }

  /**
   * Save data to localStorage
   */
  saveData() {
    try {
      this.data.lastUpdated = new Date().toISOString();
      localStorage.setItem('financialData', JSON.stringify(this.data));
      this.showNotification('Data saved successfully!', 'success');
      return true;
    } catch (error) {
      console.error('Error saving financial data:', error);
      this.showNotification('Error saving data. Please try again.', 'error');
      return false;
    }
  }

  /**
   * Load data from localStorage
   */
  loadData() {
    try {
      const savedData = localStorage.getItem('financialData');
      if (savedData) {
        const data = JSON.parse(savedData);
        // Merge saved data with default structure to handle version updates
        Object.assign(this.data, data);
        this.populateFormsWithSavedData();
        this.showNotification('Data loaded successfully!', 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading financial data:', error);
      this.showNotification('Error loading data.', 'error');
      return false;
    }
  }

  /**
   * Export data as JSON file
   */
  exportData() {
    try {
      const dataStr = JSON.stringify(this.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.showNotification('Data exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting financial data:', error);
      this.showNotification('Error exporting data.', 'error');
    }
  }

  /**
   * Import data from file
   */
  importData(file) {
    if (!file || !file.type || file.type !== 'application/json') {
      this.showNotification('Please select a valid JSON file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (importedData && importedData.version) {
          Object.assign(this.data, importedData);
          this.saveData();
          this.populateFormsWithSavedData();
          if (window.updateDashboard) {
            window.updateDashboard();
          }
          this.showNotification('Data imported successfully!', 'success');
        } else {
          this.showNotification('Invalid file format. Please select a valid financial data export.', 'error');
        }
      } catch (error) {
        console.error('Error importing financial data:', error);
        this.showNotification('Error importing data. Please check file format.', 'error');
      }
    };

    reader.readAsText(file);
  }

  /**
   * Clear all financial data
   */
  clearAllData() {
    if (confirm('Are you sure you want to clear all financial data? This action cannot be undone.')) {
      // Clear localStorage
      localStorage.removeItem('financialData');

      // Reset data to default values
      const defaultData = new FinancialDataManager().data;
      Object.assign(this.data, defaultData);

      // Clear all forms
      this.clearAllForms();

      // Clear results displays
      this.clearAllResults();

      // Update dashboard
      if (window.updateDashboard) {
        window.updateDashboard();
      }

      this.showNotification('All financial data cleared successfully!', 'success');
    }
  }

  /**
   * Update specific data section
   */
  updateSection(section, data) {
    if (this.data[section]) {
      Object.assign(this.data[section], data);
      this.saveData();
    }
  }

  /**
   * Get specific data section
   */
  getSection(section) {
    return this.data[section] || null;
  }

  /**
   * Populate forms with saved data
   */
  populateFormsWithSavedData() {
    // Income form
    if (this.data.income.payAmount > 0) {
      const payAmountInput = document.getElementById('pay-amount');
      const payFrequencySelect = document.getElementById('pay-frequency');
      const zipcodeInput = document.getElementById('zipcode');

      if (payAmountInput) payAmountInput.value = this.data.income.payAmount;
      if (payFrequencySelect) payFrequencySelect.value = this.data.income.payFrequency;
      if (zipcodeInput) zipcodeInput.value = this.data.income.zipcode;
    }

    // Budget form
    if (this.data.budget.monthlyIncome > 0) {
      Object.keys(this.data.budget.expenses).forEach(key => {
        const input = document.getElementById(`${key.replace(/([A-Z])/g, '-$1').toLowerCase()}-amount`);
        if (input) input.value = this.data.budget.expenses[key];
      });
    }

    // Add more form population logic as needed
  }

  /**
   * Clear all forms
   */
  clearAllForms() {
    const forms = ['income-form', 'budget-form', 'debt-form', 'emergency-form', 'goals-form', 'investment-form'];
    forms.forEach(formId => {
      const form = document.getElementById(formId);
      if (form) form.reset();
    });
  }

  /**
   * Clear all result displays
   */
  clearAllResults() {
    const resultElements = [
      'income-results', 'budget-results', 'debt-results',
      'emergency-results', 'goals-results', 'investment-results'
    ];
    resultElements.forEach(elementId => {
      const element = document.getElementById(elementId);
      if (element) element.innerHTML = '';
    });
  }

  /**
   * Show notification to user
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 animate-slide-in ${
      type === 'success' ? 'bg-green-600' :
      type === 'error' ? 'bg-red-600' :
      'bg-blue-600'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Create singleton instance
window.dataManager = new FinancialDataManager();

// Export global functions for backward compatibility
window.saveFinancialData = () => window.dataManager.saveData();
window.loadFinancialData = () => window.dataManager.loadData();
window.exportFinancialData = () => window.dataManager.exportData();
window.handleFileImport = (event) => {
  const file = event.target.files[0];
  if (file) {
    window.dataManager.importData(file);
  }
};
window.clearAllData = () => window.dataManager.clearAllData();