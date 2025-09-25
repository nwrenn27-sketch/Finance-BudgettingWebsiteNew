/**
 * Financial Calculation Module
 * Contains all calculation logic for income, tax, budget, debt, and investment calculations
 */

class FinancialCalculators {
  constructor() {
    // Tax constants and rates
    this.TAX_YEAR = 2024;
    this.FEDERAL_TAX_BRACKETS = [
      { min: 0, max: 11000, rate: 0.10 },
      { min: 11001, max: 44725, rate: 0.12 },
      { min: 44726, max: 95375, rate: 0.22 },
      { min: 95376, max: 182050, rate: 0.24 },
      { min: 182051, max: 231250, rate: 0.32 },
      { min: 231251, max: 578125, rate: 0.35 },
      { min: 578126, max: Infinity, rate: 0.37 }
    ];

    this.FICA_RATES = {
      socialSecurity: { rate: 0.062, wageBase: 160200 },
      medicare: { rate: 0.0145, additionalRate: 0.009, threshold: 200000 }
    };

    this.STATE_TAX_RATES = {
      'AL': 0.05, 'AK': 0, 'AZ': 0.025, 'AR': 0.055, 'CA': 0.13,
      'CO': 0.044, 'CT': 0.07, 'DE': 0.066, 'FL': 0, 'GA': 0.0575,
      'HI': 0.11, 'ID': 0.06, 'IL': 0.0495, 'IN': 0.032, 'IA': 0.085,
      'KS': 0.057, 'KY': 0.05, 'LA': 0.06, 'ME': 0.075, 'MD': 0.0575,
      'MA': 0.05, 'MI': 0.0425, 'MN': 0.0985, 'MS': 0.05, 'MO': 0.054,
      'MT': 0.069, 'NE': 0.0684, 'NV': 0, 'NH': 0, 'NJ': 0.1075,
      'NM': 0.059, 'NY': 0.109, 'NC': 0.0475, 'ND': 0.0275, 'OH': 0.0399,
      'OK': 0.05, 'OR': 0.099, 'PA': 0.0307, 'RI': 0.0599, 'SC': 0.07,
      'SD': 0, 'TN': 0, 'TX': 0, 'UT': 0.0495, 'VT': 0.0876,
      'VA': 0.0575, 'WA': 0, 'WV': 0.065, 'WI': 0.0765, 'WY': 0
    };

    this.DEFAULT_ASSUMPTIONS = {
      hoursPerDay: 8,
      daysPerWeek: 5,
      weeksPerYear: 52
    };
  }

  /**
   * Sanitize number input
   */
  sanitizeNumber(value) {
    const num = parseFloat(value);
    return isNaN(num) || num < 0 ? 0 : num;
  }

  /**
   * Format currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Calculate federal tax
   */
  calculateFederalTax(income) {
    let tax = 0;
    let remainingIncome = income;

    for (const bracket of this.FEDERAL_TAX_BRACKETS) {
      if (remainingIncome <= 0) break;

      const taxableAtBracket = Math.min(remainingIncome, bracket.max - bracket.min + 1);
      tax += taxableAtBracket * bracket.rate;
      remainingIncome -= taxableAtBracket;
    }

    return tax;
  }

  /**
   * Calculate FICA taxes (Social Security and Medicare)
   */
  calculateFICATax(income) {
    // Social Security tax (6.2% up to wage base limit)
    const socialSecurityTax = Math.min(income, this.FICA_RATES.socialSecurity.wageBase) * this.FICA_RATES.socialSecurity.rate;

    // Medicare tax (1.45% on all income + 0.9% additional on income over threshold)
    let medicareTax = income * this.FICA_RATES.medicare.rate;
    if (income > this.FICA_RATES.medicare.threshold) {
      medicareTax += (income - this.FICA_RATES.medicare.threshold) * this.FICA_RATES.medicare.additionalRate;
    }

    const totalFICA = socialSecurityTax + medicareTax;

    return { socialSecurityTax, medicareTax, totalFICA };
  }

  /**
   * Calculate state tax
   */
  calculateStateTax(income, state) {
    const stateRate = this.STATE_TAX_RATES[state] || 0;
    return income * stateRate;
  }

  /**
   * Calculate local tax (simplified)
   */
  calculateLocalTax(income, state) {
    const localTaxRates = {
      'NY': 0.03, 'CA': 0.01, 'PA': 0.02, 'OH': 0.02, 'MD': 0.03, 'IL': 0.01
    };
    const localRate = localTaxRates[state] || 0.005; // Default 0.5%
    return income * localRate;
  }

  /**
   * Get state from zipcode (simplified mapping)
   */
  getStateFromZipcode(zipcode) {
    const zip = zipcode.substring(0, 3);
    const zipToStateMap = {
      '100': 'NY', '101': 'NY', '102': 'NY', '103': 'NY', '104': 'NY',
      '900': 'CA', '901': 'CA', '902': 'CA', '903': 'CA', '904': 'CA',
      '330': 'FL', '331': 'FL', '332': 'FL', '333': 'FL', '334': 'FL'
    };
    return zipToStateMap[zip] || 'CA'; // Default to CA
  }

  /**
   * Calculate all taxes and net income
   */
  calculateAllTaxes(income, zipcode) {
    const state = this.getStateFromZipcode(zipcode);
    const federalTax = this.calculateFederalTax(income);
    const ficaTax = this.calculateFICATax(income);
    const stateTax = this.calculateStateTax(income, state);
    const localTax = this.calculateLocalTax(income, state);

    const totalTax = federalTax + ficaTax.totalFICA + stateTax + localTax;
    const netIncome = income - totalTax;

    return {
      grossIncome: income,
      federalTax,
      socialSecurityTax: ficaTax.socialSecurityTax,
      medicareTax: ficaTax.medicareTax,
      stateTax,
      localTax,
      totalTax,
      netIncome,
      effectiveRate: (totalTax / income) * 100
    };
  }

  /**
   * Calculate annual income from various pay frequencies
   */
  calculateAnnualIncome(payAmount, frequency, hoursPerDay, daysPerWeek, weeksPerYear) {
    const amount = this.sanitizeNumber(payAmount);
    const hpd = hoursPerDay || this.DEFAULT_ASSUMPTIONS.hoursPerDay;
    const dpw = daysPerWeek || this.DEFAULT_ASSUMPTIONS.daysPerWeek;
    const wpy = weeksPerYear || this.DEFAULT_ASSUMPTIONS.weeksPerYear;

    switch (frequency) {
      case 'hour':
        return amount * hpd * dpw * wpy;
      case 'day':
        return amount * dpw * wpy;
      case 'week':
        return amount * wpy;
      case 'month':
        return amount * 12;
      case 'year':
        return amount;
      default:
        return 0;
    }
  }

  /**
   * Calculate budget analysis
   */
  calculateBudgetAnalysis(income, expenses) {
    const totalExpenses = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);
    const remainingIncome = income - totalExpenses;
    const savingsRate = (remainingIncome / income) * 100;

    return {
      totalExpenses,
      remainingIncome,
      savingsRate: Math.max(0, savingsRate),
      expenseRatio: (totalExpenses / income) * 100,
      categories: Object.entries(expenses).map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / income) * 100
      }))
    };
  }

  /**
   * Calculate debt payoff using avalanche method (highest interest first)
   */
  calculateAvalanche(debts, extraPayment) {
    const sortedDebts = [...debts].sort((a, b) => b.rate - a.rate);
    return this.calculatePayoffPlan(sortedDebts, extraPayment, 'Debt Avalanche');
  }

  /**
   * Calculate debt payoff using snowball method (smallest balance first)
   */
  calculateSnowball(debts, extraPayment) {
    const sortedDebts = [...debts].sort((a, b) => a.balance - b.balance);
    return this.calculatePayoffPlan(sortedDebts, extraPayment, 'Debt Snowball');
  }

  /**
   * Calculate detailed payoff plan
   */
  calculatePayoffPlan(sortedDebts, extraPayment, strategyName) {
    let remainingDebts = sortedDebts.map(debt => ({...debt}));
    let totalPaid = 0;
    let totalInterest = 0;
    let month = 0;
    const timeline = [];

    while (remainingDebts.length > 0 && month < 600) { // 50 year cap
      month++;
      let monthlyExtraRemaining = extraPayment;

      remainingDebts.forEach((debt, index) => {
        const monthlyInterest = (debt.balance * (debt.rate / 100)) / 12;
        let monthlyPayment = debt.minPayment;

        // Apply extra payment to first debt (highest priority)
        if (index === 0) {
          monthlyPayment += monthlyExtraRemaining;
          monthlyExtraRemaining = 0;
        }

        const principalPayment = monthlyPayment - monthlyInterest;
        debt.balance = Math.max(0, debt.balance - principalPayment);

        totalPaid += monthlyPayment;
        totalInterest += monthlyInterest;

        if (debt.balance <= 0) {
          timeline.push({
            month,
            debtName: debt.name,
            action: 'paid_off'
          });
        }
      });

      remainingDebts = remainingDebts.filter(debt => debt.balance > 0);
    }

    return {
      strategy: strategyName,
      totalMonths: month,
      totalPaid,
      totalInterest,
      timeline,
      monthlySavings: extraPayment > 0 ? extraPayment : 0
    };
  }

  /**
   * Calculate emergency fund progress
   */
  calculateEmergencyFund(monthlyExpenses, targetMonths, currentFund, monthlyContribution) {
    const targetAmount = monthlyExpenses * targetMonths;
    const remainingAmount = Math.max(0, targetAmount - currentFund);
    const progressPercent = Math.min(100, (currentFund / targetAmount) * 100);

    let monthsToGoal = 0;
    if (remainingAmount > 0 && monthlyContribution > 0) {
      monthsToGoal = Math.ceil(remainingAmount / monthlyContribution);
    }

    return {
      targetAmount,
      currentFund,
      remainingAmount,
      progressPercent,
      monthsToGoal,
      monthlyContribution
    };
  }

  /**
   * Calculate investment projections with compound interest
   */
  calculateInvestmentProjection(principal, monthlyContribution, annualReturn, years) {
    const monthlyReturn = annualReturn / 12 / 100;
    const months = years * 12;
    let balance = principal;

    for (let month = 0; month < months; month++) {
      balance = balance * (1 + monthlyReturn) + monthlyContribution;
    }

    const totalContributions = principal + (monthlyContribution * months);
    const totalEarnings = balance - totalContributions;

    return {
      finalBalance: balance,
      totalContributions,
      totalEarnings,
      returnOnInvestment: (totalEarnings / totalContributions) * 100
    };
  }
}

// Create singleton instance
window.calculators = new FinancialCalculators();

// Export utility functions for backward compatibility
window.sanitizeNumber = (value) => window.calculators.sanitizeNumber(value);
window.toCurrency = (amount) => window.calculators.formatCurrency(amount);
window.calculateAnnualIncome = (...args) => window.calculators.calculateAnnualIncome(...args);
window.calculateAllTaxes = (...args) => window.calculators.calculateAllTaxes(...args);
window.calculateBudgetAnalysis = (...args) => window.calculators.calculateBudgetAnalysis(...args);
window.calculateAvalanche = (...args) => window.calculators.calculateAvalanche(...args);
window.calculateSnowball = (...args) => window.calculators.calculateSnowball(...args);