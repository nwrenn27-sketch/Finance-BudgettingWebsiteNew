/* eslint-disable no-console */
(function () {
  // Tab Navigation
  const tabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
  });
  const form = document.getElementById('income-form');
  const period = document.getElementById('pay-period');
  const payRate = document.getElementById('pay-rate');
  const hoursPerWeek = document.getElementById('hours-per-week');
  const weeksPerYear = document.getElementById('weeks-per-year');
  const bonus = document.getElementById('bonus');
  const zipInput = document.getElementById('zip');
  const error = document.getElementById('error');

  const resultsSection = document.getElementById('results');
  const perWeekEl = document.getElementById('per-week');
  const perYearEl = document.getElementById('per-year');
  const perWeekAfterStateEl = document.getElementById('per-week-after-state');
  const perYearAfterStateEl = document.getElementById('per-year-after-state');
  const perWeekAfterAllEl = document.getElementById('per-week-after-all');
  const perYearAfterAllEl = document.getElementById('per-year-after-all');
  const stateLabelEl = document.getElementById('state-label');
  const stateTaxRateEl = document.getElementById('state-tax-rate');
  const federalTaxRateEl = document.getElementById('federal-tax-rate');

  function toNumber(value) {
    const num = parseFloat(String(value).replace(/,/g, ''));
    return Number.isFinite(num) ? num : 0;
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount);
  }

  function validateInputs() {
    error.textContent = '';
    if (!payRate.value || toNumber(payRate.value) < 0) {
      return 'Enter a valid pay amount (>= 0).';
    }

    if (period.value === 'hour') {
      if (!hoursPerWeek.value || toNumber(hoursPerWeek.value) <= 0) {
        return 'Enter hours per week (> 0) for hourly pay.';
      }
      if (!weeksPerYear.value || toNumber(weeksPerYear.value) <= 0) {
        return 'Enter weeks per year (> 0) for hourly pay.';
      }
      if (toNumber(hoursPerWeek.value) > 168) {
        return 'Hours per week cannot exceed 168.';
      }
      if (toNumber(weeksPerYear.value) > 366) {
        return 'Weeks per year cannot exceed 366.';
      }
    } else if (period.value === 'week') {
      if (weeksPerYear.value && toNumber(weeksPerYear.value) > 366) {
        return 'Weeks per year cannot exceed 366.';
      }
    }

    if (bonus.value && toNumber(bonus.value) < 0) {
      return 'Bonus cannot be negative.';
    }

    if (zipInput && zipInput.value && !/^\d{5}$/.test(zipInput.value.trim())) {
      return 'Enter a valid 5-digit ZIP code or leave it blank.';
    }
    return '';
  }

  function calculateGrossIncome() {
    const base = toNumber(payRate.value);
    const extra = toNumber(bonus.value);
    const weeks = weeksPerYear.value ? toNumber(weeksPerYear.value) : 52;
    let yearly = 0;

    if (period.value === 'year') {
      yearly = base + extra;
    } else if (period.value === 'week') {
      yearly = base * weeks + extra;
    } else if (period.value === 'hour') {
      const hours = toNumber(hoursPerWeek.value);
      yearly = base * hours * weeks + extra;
    }
    const weekly = yearly / (weeks || 52);
    return { weekly, yearly };
  }

  function renderResults({ weeklyGross, yearlyGross, state, stateRate, federalRate, weeklyAfterState, yearlyAfterState, weeklyAfterAll, yearlyAfterAll }) {
    perWeekEl.textContent = formatCurrency(weeklyGross);
    perYearEl.textContent = formatCurrency(yearlyGross);
    stateLabelEl.textContent = state || '—';
    stateTaxRateEl.textContent = typeof stateRate === 'number' ? `${(stateRate * 100).toFixed(1)}%` : '—';
    federalTaxRateEl.textContent = typeof federalRate === 'number' ? `${(federalRate * 100).toFixed(1)}%` : '—';
    perWeekAfterStateEl.textContent = formatCurrency(weeklyAfterState);
    perYearAfterStateEl.textContent = formatCurrency(yearlyAfterState);
    perWeekAfterAllEl.textContent = formatCurrency(weeklyAfterAll);
    perYearAfterAllEl.textContent = formatCurrency(yearlyAfterAll);
    resultsSection.hidden = false;
  }

  const NO_TAX_STATES = new Set(['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY']);
  const APPROX_STATE_RATES = {
    AL: 0.05, AR: 0.049, AZ: 0.025, CA: 0.07, CO: 0.044, CT: 0.05, DC: 0.06,
    DE: 0.052, GA: 0.047, HI: 0.07, IA: 0.05, ID: 0.056, IL: 0.0495, IN: 0.0315,
    KS: 0.052, KY: 0.045, LA: 0.045, MA: 0.05, MD: 0.055, ME: 0.058,
    MI: 0.0425, MN: 0.058, MO: 0.048, MS: 0.05, MT: 0.055, NC: 0.0475,
    ND: 0.02, NE: 0.05, NJ: 0.055, NM: 0.049, NY: 0.058, OH: 0.0275,
    OK: 0.0475, OR: 0.075, PA: 0.0307, RI: 0.05, SC: 0.053, UT: 0.0465,
    VA: 0.05, VT: 0.06, WI: 0.053, WV: 0.05
  };

  async function fetchStateFromZip(zip) {
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`);
      if (!res.ok) return { state: null };
      const data = await res.json();
      const place = Array.isArray(data.places) && data.places[0];
      const abbr = place && (place['state abbreviation'] || place['state_abbreviation']);
      return { state: typeof abbr === 'string' ? abbr.toUpperCase() : null };
    } catch (e) {
      console.warn('ZIP lookup failed', e);
      return { state: null };
    }
  }

  function getApproxStateRate(stateAbbr) {
    if (!stateAbbr) return null;
    if (NO_TAX_STATES.has(stateAbbr)) return 0;
    return APPROX_STATE_RATES[stateAbbr] ?? null;
  }

  // 2024 Federal Tax Brackets (Single filer)
  const FEDERAL_BRACKETS = [
    { min: 0, max: 11000, rate: 0.10 },
    { min: 11000, max: 44725, rate: 0.12 },
    { min: 44725, max: 95375, rate: 0.22 },
    { min: 95375, max: 182050, rate: 0.24 },
    { min: 182050, max: 231250, rate: 0.32 },
    { min: 231250, max: 578125, rate: 0.35 },
    { min: 578125, max: Infinity, rate: 0.37 }
  ];

  function calculateFederalTax(income) {
    if (income <= 0) return { tax: 0, effectiveRate: 0 };
    
    let totalTax = 0;
    let remainingIncome = income;
    
    for (const bracket of FEDERAL_BRACKETS) {
      if (remainingIncome <= 0) break;
      
      const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      if (taxableInBracket > 0) {
        totalTax += taxableInBracket * bracket.rate;
        remainingIncome -= taxableInBracket;
      }
    }
    
    const effectiveRate = income > 0 ? totalTax / income : 0;
    return { tax: totalTax, effectiveRate };
  }

  form.addEventListener('submit', async function (evt) {
    evt.preventDefault();
    const message = validateInputs();
    if (message) {
      error.textContent = message;
      resultsSection.hidden = true;
      return;
    }
    const { weekly, yearly } = calculateGrossIncome();

    let state = null;
    if (zipInput && zipInput.value.trim()) {
      const { state: s } = await fetchStateFromZip(zipInput.value.trim());
      state = s;
    }
    const stateRate = getApproxStateRate(state);

    // Calculate federal tax
    const { tax: federalTax, effectiveRate: federalRate } = calculateFederalTax(yearly);

    // Calculate state tax
    let stateTax = 0;
    if (typeof stateRate === 'number') {
      stateTax = yearly * stateRate;
    }

    // Calculate after-tax amounts
    const yearlyAfterState = Math.max(0, yearly - stateTax);
    const yearlyAfterAll = Math.max(0, yearly - stateTax - federalTax);
    
    const weeks = weeksPerYear.value ? toNumber(weeksPerYear.value) : 52;
    const weeklyAfterState = yearlyAfterState / (weeks || 52);
    const weeklyAfterAll = yearlyAfterAll / (weeks || 52);

    renderResults({
      weeklyGross: weekly,
      yearlyGross: yearly,
      state: state || (zipInput && zipInput.value ? 'Unknown' : '—'),
      stateRate: typeof stateRate === 'number' ? stateRate : null,
      federalRate: federalRate,
      weeklyAfterState,
      yearlyAfterState,
      weeklyAfterAll,
      yearlyAfterAll
    });
  });

  document.getElementById('reset-btn').addEventListener('click', function () {
    error.textContent = '';
    resultsSection.hidden = true;
  });

  // Budget Tracker
  const monthlyIncomeInput = document.getElementById('monthly-income');
  const budgetCategories = document.getElementById('budget-categories');
  const addCategoryBtn = document.getElementById('add-category');
  const totalBudgetedEl = document.getElementById('total-budgeted');
  const remainingBudgetEl = document.getElementById('remaining-budget');

  function updateBudgetSummary() {
    const monthlyIncome = toNumber(monthlyIncomeInput.value);
    let totalBudgeted = 0;

    const categoryAmounts = budgetCategories.querySelectorAll('.category-amount');
    categoryAmounts.forEach(input => {
      totalBudgeted += toNumber(input.value);
    });

    const remaining = monthlyIncome - totalBudgeted;

    totalBudgetedEl.textContent = formatCurrency(totalBudgeted);
    remainingBudgetEl.textContent = formatCurrency(remaining);
    remainingBudgetEl.style.color = remaining < 0 ? 'var(--error)' : 'var(--primary)';
  }

  function addBudgetCategory() {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'budget-item';
    categoryDiv.innerHTML = `
      <input type="text" placeholder="Category (e.g., Rent)" class="category-name">
      <div class="input-prefix">
        <span class="prefix">$</span>
        <input type="number" step="0.01" min="0" placeholder="0.00" class="category-amount">
      </div>
      <button type="button" class="remove-category">×</button>
    `;
    
    budgetCategories.appendChild(categoryDiv);
    
    // Add event listeners
    const amountInput = categoryDiv.querySelector('.category-amount');
    const removeBtn = categoryDiv.querySelector('.remove-category');
    
    amountInput.addEventListener('input', updateBudgetSummary);
    removeBtn.addEventListener('click', () => {
      categoryDiv.remove();
      updateBudgetSummary();
    });
  }

  monthlyIncomeInput.addEventListener('input', updateBudgetSummary);
  addCategoryBtn.addEventListener('click', addBudgetCategory);

  // Investment Calculator
  const investmentForm = document.getElementById('investment-form');
  const investmentResults = document.getElementById('investment-results');
  const totalContributionsEl = document.getElementById('total-contributions');
  const totalGrowthEl = document.getElementById('total-growth');
  const finalValueEl = document.getElementById('final-value');

  function calculateInvestment() {
    const initialInvestment = toNumber(document.getElementById('initial-investment').value);
    const monthlyContribution = toNumber(document.getElementById('monthly-contribution').value);
    const annualReturn = toNumber(document.getElementById('annual-return').value) / 100;
    const years = toNumber(document.getElementById('investment-years').value);

    const monthlyReturn = annualReturn / 12;
    const totalMonths = years * 12;

    // Calculate future value with compound interest
    let futureValue = initialInvestment * Math.pow(1 + annualReturn, years);
    
    // Add monthly contributions with compound interest
    if (monthlyContribution > 0) {
      futureValue += monthlyContribution * ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn);
    }

    const totalContributions = initialInvestment + (monthlyContribution * totalMonths);
    const totalGrowth = futureValue - totalContributions;

    totalContributionsEl.textContent = formatCurrency(totalContributions);
    totalGrowthEl.textContent = formatCurrency(totalGrowth);
    finalValueEl.textContent = formatCurrency(futureValue);
    
    investmentResults.hidden = false;
  }

  investmentForm.addEventListener('submit', function(evt) {
    evt.preventDefault();
    calculateInvestment();
  });

  // Expense Tracker
  const expenseForm = document.getElementById('expense-form');
  const expenseList = document.getElementById('expense-list');
  const totalSpentEl = document.getElementById('total-spent');
  const todaySpentEl = document.getElementById('today-spent');
  
  let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

  function renderExpenses() {
    if (expenses.length === 0) {
      expenseList.innerHTML = '<p class="no-expenses">No expenses added yet.</p>';
      return;
    }

    expenseList.innerHTML = expenses.slice(-10).reverse().map(expense => `
      <div class="expense-item">
        <div class="expense-info">
          <div>${expense.description}</div>
          <div class="expense-category">${expense.category}</div>
        </div>
        <div class="expense-amount">${formatCurrency(expense.amount)}</div>
      </div>
    `).join('');
  }

  function updateExpenseSummary() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const today = new Date().toDateString();
    const todayTotal = expenses
      .filter(expense => new Date(expense.date).toDateString() === today)
      .reduce((sum, expense) => sum + expense.amount, 0);

    totalSpentEl.textContent = formatCurrency(total);
    todaySpentEl.textContent = formatCurrency(todayTotal);
  }

  expenseForm.addEventListener('submit', function(evt) {
    evt.preventDefault();
    
    const description = document.getElementById('expense-description').value;
    const amount = toNumber(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;

    const expense = {
      id: Date.now(),
      description,
      amount,
      category,
      date: new Date().toISOString()
    };

    expenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    renderExpenses();
    updateExpenseSummary();
    
    expenseForm.reset();
  });

  // Initialize expense tracker
  renderExpenses();
  updateExpenseSummary();
})();


