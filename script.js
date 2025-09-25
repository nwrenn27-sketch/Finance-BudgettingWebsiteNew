/**
 * Finance Budgeting Investment Application
 * 
 * This application provides two main features:
 * 1. Income Calculator - Converts various pay frequencies to annual income with tax calculations
 * 2. Budget Planner - Analyzes monthly expenses and provides savings/investment recommendations
 * 
 * The application uses 2024 tax brackets and rates for accurate calculations.
 */

(function() {
  // ============================================================================
  // DATA MANAGEMENT SYSTEM
  // ============================================================================

  // Central data store for all financial information
  const FinancialDataStore = {
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
      remainingIncome: 0,
      savingsRate: 0,
      calculatedDate: null
    },
    debts: [],
    emergencyFund: {
      monthlyExpenses: 0,
      targetMonths: 6,
      currentAmount: 0,
      monthlyContribution: 0,
      targetAmount: 0,
      calculatedDate: null
    },
    goals: [],
    investments: {
      monthlyAmount: 0,
      riskTolerance: 'moderate',
      timeframe: 'medium',
      focusType: 'dividend',
      calculatedDate: null
    },
    lastUpdated: null,
    version: '1.0'
  };

  // Save data to localStorage
  function saveFinancialData() {
    try {
      FinancialDataStore.lastUpdated = new Date().toISOString();
      localStorage.setItem('financialData', JSON.stringify(FinancialDataStore));
      showNotification('Data saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving financial data:', error);
      showNotification('Error saving data. Please try again.', 'error');
    }
  }

  // Load data from localStorage
  function loadFinancialData() {
    try {
      const savedData = localStorage.getItem('financialData');
      if (savedData) {
        const data = JSON.parse(savedData);
        // Merge saved data with default structure to handle version updates
        Object.assign(FinancialDataStore, data);
        populateFormsWithSavedData();
        updateDashboard();
        showNotification('Data loaded successfully!', 'success');
        return true;
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
      showNotification('Error loading saved data.', 'error');
    }
    return false;
  }

  // Export data as JSON file
  function exportFinancialData() {
    try {
      const dataStr = JSON.stringify(FinancialDataStore, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showNotification('Data exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showNotification('Error exporting data.', 'error');
    }
  }

  // Import data from JSON file
  function importFinancialData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const importedData = JSON.parse(e.target.result);
        if (importedData && importedData.version) {
          Object.assign(FinancialDataStore, importedData);
          saveFinancialData();
          populateFormsWithSavedData();
          updateDashboard();
          showNotification('Data imported successfully!', 'success');
        } else {
          showNotification('Invalid data format.', 'error');
        }
      } catch (error) {
        console.error('Error importing data:', error);
        showNotification('Error importing data. Please check file format.', 'error');
      }
    };
    reader.readAsText(file);
  }

  // Show notification to user
  function showNotification(message, type = 'info') {
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
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  }

  // Clear all financial data
  function clearAllData() {
    if (confirm('Are you sure you want to clear all financial data? This action cannot be undone.')) {
      // Clear localStorage
      localStorage.removeItem('financialData');

      // Reset FinancialDataStore to default values
      Object.assign(FinancialDataStore, {
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
          expenses: {},
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
      });

      // Clear all forms
      const forms = ['income-form', 'budget-form', 'debt-form', 'emergency-form', 'goals-form', 'investment-form'];
      forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) form.reset();
      });

      // Clear results displays
      const resultElements = [
        'income-results', 'budget-results', 'debt-results',
        'emergency-results', 'goals-results', 'investment-results'
      ];
      resultElements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) element.innerHTML = '';
      });

      // Update dashboard
      updateDashboard();
      showNotification('All financial data cleared successfully!', 'success');
    }
  }

  // Populate forms with saved data
  function populateFormsWithSavedData() {
    // Income form
    if (FinancialDataStore.income.payAmount > 0) {
      const payAmountInput = document.getElementById('pay-amount');
      const payFrequencySelect = document.getElementById('pay-frequency');
      const zipcodeInput = document.getElementById('zipcode');

      if (payAmountInput) payAmountInput.value = FinancialDataStore.income.payAmount;
      if (payFrequencySelect) payFrequencySelect.value = FinancialDataStore.income.payFrequency;
      if (zipcodeInput) zipcodeInput.value = FinancialDataStore.income.zipcode;
    }

    // Budget form
    if (FinancialDataStore.budget.monthlyIncome > 0) {
      Object.keys(FinancialDataStore.budget.expenses).forEach(key => {
        const input = document.getElementById(`${key.replace(/([A-Z])/g, '-$1').toLowerCase()}-amount`);
        if (input) input.value = FinancialDataStore.budget.expenses[key];
      });
    }
  }

  // ============================================================================
  // THEME MANAGEMENT
  // ============================================================================

  // Initialize theme
  function initializeTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    updateThemeIcon(theme);
  }

  function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    const svg = themeToggle.querySelector('svg');

    if (theme === 'dark') {
      svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>';
    } else {
      svg.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>';
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  }

  // ============================================================================
  // DOM ELEMENT REFERENCES
  // ============================================================================

  // Income calculator form elements
  const form = document.getElementById('income-form');
  const payAmountInput = document.getElementById('pay-amount');
  const payFrequencySelect = document.getElementById('pay-frequency');
  const hoursPerDayInput = document.getElementById('hours-per-day');
  const daysPerWeekInput = document.getElementById('days-per-week');
  const weeksPerYearInput = document.getElementById('weeks-per-year');
  const zipcodeInput = document.getElementById('zipcode');
  const resultsEl = document.getElementById('results');
  const budgetEl = document.getElementById('budget-breakdown');
  const resetBtn = document.getElementById('reset-btn');

  // Budget planner form elements
  const budgetForm = document.getElementById('budget-form');
  const budgetResultsEl = document.getElementById('budget-results');
  const budgetResetBtn = document.getElementById('budget-reset-btn');

  // Investment form elements
  const investmentForm = document.getElementById('investment-form');
  const investmentResultsEl = document.getElementById('investment-results');
  const investmentResetBtn = document.getElementById('investment-reset-btn');
  const apiStatusEl = document.getElementById('api-status');

  const monthlyIncomeInput = document.getElementById('monthly-income'); // Hidden budget planner income field to auto-fill with net calculation
  const monthlyIncomeDisplay = document.getElementById('monthly-income-display'); // Visible monthly income readout

  const expenseFieldConfig = [
    { key: 'rentMortgage', amountId: 'rent-mortgage-amount', sliderId: 'rent-mortgage-slider', displayId: 'rent-mortgage-display', summaryId: 'summary-rent-mortgage' },
    { key: 'utilities', amountId: 'utilities-amount', sliderId: 'utilities-slider', displayId: 'utilities-display', summaryId: 'summary-utilities' },
    { key: 'groceries', amountId: 'groceries-amount', sliderId: 'groceries-slider', displayId: 'groceries-display', summaryId: 'summary-groceries' },
    { key: 'transportation', amountId: 'transportation-amount', sliderId: 'transportation-slider', displayId: 'transportation-display', summaryId: 'summary-transportation' },
    { key: 'insurance', amountId: 'insurance-amount', sliderId: 'insurance-slider', displayId: 'insurance-display', summaryId: 'summary-insurance' },
    { key: 'debtPayments', amountId: 'debt-payments-amount', sliderId: 'debt-payments-slider', displayId: 'debt-payments-display', summaryId: 'summary-debt-payments' },
    { key: 'diningOut', amountId: 'dining-out-amount', sliderId: 'dining-out-slider', displayId: 'dining-out-display', summaryId: 'summary-dining-out' },
    { key: 'shopping', amountId: 'shopping-amount', sliderId: 'shopping-slider', displayId: 'shopping-display', summaryId: 'summary-shopping' },
    { key: 'subscriptions', amountId: 'subscriptions-amount', sliderId: 'subscriptions-slider', displayId: 'subscriptions-display', summaryId: 'summary-subscriptions' },
    { key: 'miscellaneous', amountId: 'miscellaneous-amount', sliderId: 'miscellaneous-slider', displayId: 'miscellaneous-display', summaryId: 'summary-miscellaneous' }
  ];

  expenseFieldConfig.forEach(config => {
    config.amountEl = document.getElementById(config.amountId);
    config.sliderEl = document.getElementById(config.sliderId);
    config.displayEl = document.getElementById(config.displayId);
    config.summaryEl = document.getElementById(config.summaryId);
  });

  const summaryRemainingEl = document.getElementById('summary-remaining');

  // Dashboard elements
  const healthScoreEl = document.getElementById('health-score');
  const scoreBreakdownEl = document.getElementById('score-breakdown');
  const metricIncomeEl = document.getElementById('metric-income');
  const metricExpensesEl = document.getElementById('metric-expenses');
  const metricSavingsRateEl = document.getElementById('metric-savings-rate');
  const metricEmergencyEl = document.getElementById('metric-emergency');
  const metricDebtEl = document.getElementById('metric-debt');
  const metricInvestmentsEl = document.getElementById('metric-investments');
  const recommendationListEl = document.getElementById('recommendation-list');

  // Debt form elements
  const debtForm = document.getElementById('debt-form');
  const debtListEl = document.getElementById('debt-list');
  const addDebtBtn = document.getElementById('add-debt-btn');
  const debtResetBtn = document.getElementById('debt-reset-btn');
  const debtResultsEl = document.getElementById('debt-results');

  // Emergency fund elements
  const emergencyForm = document.getElementById('emergency-form');
  const emergencyResetBtn = document.getElementById('emergency-reset-btn');
  const emergencyResultsEl = document.getElementById('emergency-results');

  // Goals form elements
  const goalsForm = document.getElementById('goals-form');
  const goalsListEl = document.getElementById('goals-list');

  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // ============================================================================
  // CONFIGURATION OBJECTS
  // ============================================================================
  
  // Default assumptions for work schedule calculations
  const defaultAssumptions = {
    hoursPerDay: 8,    // Standard 8-hour workday
    daysPerWeek: 5,    // Monday-Friday work week
    weeksPerYear: 52   // Full year of work weeks
  };

  // 50/30/15/5 budget rule for expense allocation
  const budgetRules = [
    { key: 'needs', label: 'Needs (Housing, Utilities, Groceries, Insurance)', percent: 50 },
    { key: 'wants', label: 'Wants (Dining, Entertainment, Shopping, Travel)', percent: 30 },
    { key: 'savings', label: 'Savings & Investments', percent: 15 },
    { key: 'debt', label: 'Debt Payments (beyond minimums)', percent: 5 },
  ];

  // ============================================================================
  // TAX CALCULATION DATA (2024 RATES)
  // ============================================================================
  
  // 2024 Federal Tax Brackets for Single Filers
  // Progressive tax system where each bracket is taxed at its respective rate
  const federalTaxBrackets = [
    { min: 0, max: 11000, rate: 0.10 },      // 10% on first $11,000
    { min: 11000, max: 44725, rate: 0.12 },  // 12% on $11,001-$44,725
    { min: 44725, max: 95375, rate: 0.22 },  // 22% on $44,726-$95,375
    { min: 95375, max: 182050, rate: 0.24 }, // 24% on $95,376-$182,050
    { min: 182050, max: 231250, rate: 0.32 },// 32% on $182,051-$231,250
    { min: 231250, max: 578125, rate: 0.35 },// 35% on $231,251-$578,125
    { min: 578125, max: Infinity, rate: 0.37 } // 37% on $578,126+
  ];

  // 2024 FICA (Federal Insurance Contributions Act) Tax Rates
  // Includes Social Security and Medicare taxes
  const ficaRates = {
    socialSecurity: { 
      rate: 0.062,        // 6.2% Social Security tax
      wageBase: 160200    // Only applies to first $160,200 of wages
    },
    medicare: { 
      rate: 0.0145,                    // 1.45% Medicare tax on all wages
      additionalRate: 0.009,           // Additional 0.9% Medicare tax
      additionalThreshold: 200000      // Additional tax applies to wages over $200,000
    }
  };

  // State Income Tax Rates (2024) - Simplified average rates by state
  // Note: These are simplified rates and may not reflect exact tax calculations
  // for all income levels due to progressive state tax systems
  const stateTaxRates = {
    'AL': 0.05, 'AK': 0, 'AZ': 0.025, 'AR': 0.055, 'CA': 0.09, 'CO': 0.045,
    'CT': 0.05, 'DE': 0.06, 'FL': 0, 'GA': 0.055, 'HI': 0.08, 'ID': 0.06,
    'IL': 0.0495, 'IN': 0.0315, 'IA': 0.06, 'KS': 0.057, 'KY': 0.05, 'LA': 0.06,
    'ME': 0.075, 'MD': 0.0575, 'MA': 0.05, 'MI': 0.0425, 'MN': 0.0985, 'MS': 0.05,
    'MO': 0.054, 'MT': 0.06, 'NE': 0.0684, 'NV': 0, 'NH': 0, 'NJ': 0.0637,
    'NM': 0.049, 'NY': 0.0685, 'NC': 0.0499, 'ND': 0.029, 'OH': 0.035, 'OK': 0.05,
    'OR': 0.099, 'PA': 0.0307, 'RI': 0.0599, 'SC': 0.07, 'SD': 0, 'TN': 0,
    'TX': 0, 'UT': 0.0485, 'VT': 0.0875, 'VA': 0.0575, 'WA': 0, 'WV': 0.065,
    'WI': 0.0765, 'WY': 0
  };

  // ZIP Code to State Mapping
  // Maps the first 3 digits of ZIP codes to their corresponding states
  // This is a simplified mapping for tax calculation purposes
  // Note: Some ZIP codes may cross state boundaries, this uses the primary state
  const zipToState = {
    '010': 'MA', '011': 'MA', '012': 'MA', '013': 'MA', '014': 'MA', '015': 'MA', '016': 'MA', '017': 'MA', '018': 'MA', '019': 'MA',
    '020': 'MA', '021': 'MA', '022': 'MA', '023': 'MA', '024': 'MA', '025': 'MA', '026': 'MA', '027': 'MA', '028': 'RI', '029': 'RI',
    '030': 'NH', '031': 'NH', '032': 'NH', '033': 'NH', '034': 'NH', '035': 'NH', '036': 'NH', '037': 'NH', '038': 'NH', '039': 'ME',
    '040': 'ME', '041': 'ME', '042': 'ME', '043': 'ME', '044': 'ME', '045': 'ME', '046': 'ME', '047': 'ME', '048': 'ME', '049': 'ME',
    '050': 'VT', '051': 'VT', '052': 'VT', '053': 'VT', '054': 'VT', '055': 'MA', '056': 'VT', '057': 'VT', '058': 'VT', '059': 'VT',
    '060': 'CT', '061': 'CT', '062': 'CT', '063': 'CT', '064': 'CT', '065': 'CT', '066': 'CT', '067': 'CT', '068': 'CT', '069': 'CT',
    '070': 'NJ', '071': 'NJ', '072': 'NJ', '073': 'NJ', '074': 'NJ', '075': 'NJ', '076': 'NJ', '077': 'NJ', '078': 'NJ', '079': 'NJ',
    '080': 'NJ', '081': 'NJ', '082': 'NJ', '083': 'NJ', '084': 'NJ', '085': 'NJ', '086': 'NJ', '087': 'NJ', '088': 'NJ', '089': 'NJ',
    '100': 'NY', '101': 'NY', '102': 'NY', '103': 'NY', '104': 'NY', '105': 'NY', '106': 'NY', '107': 'NY', '108': 'NY', '109': 'NY',
    '110': 'NY', '111': 'NY', '112': 'NY', '113': 'NY', '114': 'NY', '115': 'NY', '116': 'NY', '117': 'NY', '118': 'NY', '119': 'NY',
    '120': 'NY', '121': 'NY', '122': 'NY', '123': 'NY', '124': 'NY', '125': 'NY', '126': 'NY', '127': 'NY', '128': 'NY', '129': 'NY',
    '130': 'NY', '131': 'NY', '132': 'NY', '133': 'NY', '134': 'NY', '135': 'NY', '136': 'NY', '137': 'NY', '138': 'NY', '139': 'NY',
    '140': 'NY', '141': 'NY', '142': 'NY', '143': 'NY', '144': 'NY', '145': 'NY', '146': 'NY', '147': 'NY', '148': 'NY', '149': 'NY',
    '150': 'PA', '151': 'PA', '152': 'PA', '153': 'PA', '154': 'PA', '155': 'PA', '156': 'PA', '157': 'PA', '158': 'PA', '159': 'PA',
    '160': 'PA', '161': 'PA', '162': 'PA', '163': 'PA', '164': 'PA', '165': 'PA', '166': 'PA', '167': 'PA', '168': 'PA', '169': 'PA',
    '170': 'PA', '171': 'PA', '172': 'PA', '173': 'PA', '174': 'PA', '175': 'PA', '176': 'PA', '177': 'PA', '178': 'PA', '179': 'PA',
    '180': 'PA', '181': 'PA', '182': 'PA', '183': 'PA', '184': 'PA', '185': 'PA', '186': 'PA', '187': 'PA', '188': 'PA', '189': 'PA',
    '190': 'PA', '191': 'PA', '192': 'PA', '193': 'PA', '194': 'PA', '195': 'PA', '196': 'PA', '197': 'PA', '198': 'PA', '199': 'DE',
    '200': 'DC', '201': 'VA', '202': 'DC', '203': 'DC', '204': 'DC', '205': 'DC', '206': 'MD', '207': 'MD', '208': 'MD', '209': 'MD',
    '210': 'MD', '211': 'MD', '212': 'MD', '214': 'MD', '215': 'MD', '216': 'MD', '217': 'MD', '218': 'MD', '219': 'MD', '220': 'VA',
    '221': 'VA', '222': 'VA', '223': 'VA', '224': 'VA', '225': 'VA', '226': 'VA', '227': 'VA', '228': 'VA', '229': 'VA', '230': 'VA',
    '231': 'VA', '232': 'VA', '233': 'VA', '234': 'VA', '235': 'VA', '236': 'VA', '237': 'VA', '238': 'VA', '239': 'VA', '240': 'VA',
    '241': 'VA', '242': 'VA', '243': 'VA', '244': 'VA', '245': 'VA', '246': 'VA', '247': 'WV', '248': 'WV', '249': 'WV', '250': 'WV',
    '251': 'WV', '252': 'WV', '253': 'WV', '254': 'WV', '255': 'WV', '256': 'WV', '257': 'WV', '258': 'WV', '259': 'WV', '260': 'WV',
    '261': 'WV', '262': 'WV', '263': 'WV', '264': 'WV', '265': 'WV', '266': 'WV', '267': 'WV', '268': 'WV', '270': 'NC', '271': 'NC',
    '272': 'NC', '273': 'NC', '274': 'NC', '275': 'NC', '276': 'NC', '277': 'NC', '278': 'NC', '279': 'NC', '280': 'NC', '281': 'NC',
    '282': 'NC', '283': 'NC', '284': 'NC', '285': 'NC', '286': 'NC', '287': 'NC', '288': 'NC', '289': 'NC', '290': 'SC', '291': 'SC',
    '292': 'SC', '293': 'SC', '294': 'SC', '295': 'SC', '296': 'SC', '297': 'SC', '298': 'SC', '299': 'SC', '300': 'GA', '301': 'GA',
    '302': 'GA', '303': 'GA', '304': 'GA', '305': 'GA', '306': 'GA', '307': 'GA', '308': 'GA', '309': 'GA', '310': 'GA', '311': 'GA',
    '312': 'GA', '313': 'GA', '314': 'GA', '315': 'GA', '316': 'GA', '317': 'GA', '318': 'GA', '319': 'GA', '320': 'FL', '321': 'FL',
    '322': 'FL', '323': 'FL', '324': 'FL', '325': 'FL', '326': 'FL', '327': 'FL', '328': 'FL', '329': 'FL', '330': 'FL', '331': 'FL',
    '332': 'FL', '333': 'FL', '334': 'FL', '335': 'FL', '336': 'FL', '337': 'FL', '338': 'FL', '339': 'FL', '340': 'FL', '341': 'FL',
    '342': 'FL', '344': 'FL', '346': 'FL', '347': 'FL', '349': 'FL', '350': 'AL', '351': 'AL', '352': 'AL', '354': 'AL', '355': 'AL',
    '356': 'AL', '357': 'AL', '358': 'AL', '359': 'AL', '360': 'AL', '361': 'AL', '362': 'AL', '363': 'AL', '364': 'AL', '365': 'AL',
    '366': 'AL', '367': 'AL', '368': 'AL', '369': 'AL', '370': 'TN', '371': 'TN', '372': 'TN', '373': 'TN', '374': 'TN', '375': 'TN',
    '376': 'TN', '377': 'TN', '378': 'TN', '379': 'TN', '380': 'TN', '381': 'TN', '382': 'TN', '383': 'TN', '384': 'TN', '385': 'TN',
    '386': 'MS', '387': 'MS', '388': 'MS', '389': 'MS', '390': 'MS', '391': 'MS', '392': 'MS', '393': 'MS', '394': 'MS', '395': 'MS',
    '396': 'MS', '397': 'MS', '398': 'MS', '399': 'MS', '400': 'KY', '401': 'KY', '402': 'KY', '403': 'KY', '404': 'KY', '405': 'KY',
    '406': 'KY', '407': 'KY', '408': 'KY', '409': 'KY', '410': 'KY', '411': 'KY', '412': 'KY', '413': 'KY', '414': 'KY', '415': 'KY',
    '416': 'KY', '417': 'KY', '418': 'KY', '420': 'KY', '421': 'KY', '422': 'KY', '423': 'KY', '424': 'KY', '425': 'KY', '426': 'KY',
    '427': 'KY', '430': 'OH', '431': 'OH', '432': 'OH', '433': 'OH', '434': 'OH', '435': 'OH', '436': 'OH', '437': 'OH', '438': 'OH',
    '439': 'OH', '440': 'OH', '441': 'OH', '442': 'OH', '443': 'OH', '444': 'OH', '445': 'OH', '446': 'OH', '447': 'OH', '448': 'OH',
    '449': 'OH', '450': 'OH', '451': 'OH', '452': 'OH', '453': 'OH', '454': 'OH', '455': 'OH', '456': 'OH', '457': 'OH', '458': 'OH',
    '459': 'OH', '460': 'IN', '461': 'IN', '462': 'IN', '463': 'IN', '464': 'IN', '465': 'IN', '466': 'IN', '467': 'IN', '468': 'IN',
    '469': 'IN', '470': 'IN', '471': 'IN', '472': 'IN', '473': 'IN', '474': 'IN', '475': 'IN', '476': 'IN', '477': 'IN', '478': 'IN',
    '479': 'IN', '480': 'MI', '481': 'MI', '482': 'MI', '483': 'MI', '484': 'MI', '485': 'MI', '486': 'MI', '487': 'MI', '488': 'MI',
    '489': 'MI', '490': 'MI', '491': 'MI', '492': 'MI', '493': 'MI', '494': 'MI', '495': 'MI', '496': 'MI', '497': 'MI', '498': 'MI',
    '499': 'MI', '500': 'IA', '501': 'IA', '502': 'IA', '503': 'IA', '504': 'IA', '505': 'IA', '506': 'IA', '507': 'IA', '508': 'IA',
    '509': 'IA', '510': 'IA', '511': 'IA', '512': 'IA', '513': 'IA', '514': 'IA', '515': 'IA', '516': 'IA', '520': 'IA', '521': 'IA',
    '522': 'IA', '523': 'IA', '524': 'IA', '525': 'IA', '526': 'IA', '527': 'IA', '528': 'IA', '530': 'WI', '531': 'WI', '532': 'WI',
    '534': 'WI', '535': 'WI', '537': 'WI', '538': 'WI', '539': 'WI', '540': 'WI', '541': 'WI', '542': 'WI', '544': 'WI', '545': 'WI',
    '546': 'WI', '547': 'WI', '548': 'WI', '549': 'WI', '550': 'MN', '551': 'MN', '553': 'MN', '554': 'MN', '555': 'MN', '556': 'MN',
    '557': 'MN', '558': 'MN', '559': 'MN', '560': 'MN', '561': 'MN', '562': 'MN', '563': 'MN', '564': 'MN', '565': 'MN', '566': 'MN',
    '567': 'MN', '570': 'SD', '571': 'SD', '572': 'SD', '573': 'SD', '574': 'SD', '575': 'SD', '576': 'SD', '577': 'SD', '580': 'ND',
    '581': 'ND', '582': 'ND', '583': 'ND', '584': 'ND', '585': 'ND', '586': 'ND', '587': 'ND', '588': 'ND', '590': 'MT', '591': 'MT',
    '592': 'MT', '593': 'MT', '594': 'MT', '595': 'MT', '596': 'MT', '597': 'MT', '598': 'MT', '599': 'MT', '600': 'IL', '601': 'IL',
    '602': 'IL', '603': 'IL', '604': 'IL', '605': 'IL', '606': 'IL', '607': 'IL', '608': 'IL', '609': 'IL', '610': 'IL', '611': 'IL',
    '612': 'IL', '613': 'IL', '614': 'IL', '615': 'IL', '616': 'IL', '617': 'IL', '618': 'IL', '619': 'IL', '620': 'IL', '622': 'IL',
    '623': 'IL', '624': 'IL', '625': 'IL', '626': 'IL', '627': 'IL', '628': 'IL', '629': 'IL', '630': 'MO', '631': 'MO', '633': 'MO',
    '634': 'MO', '635': 'MO', '636': 'MO', '637': 'MO', '638': 'MO', '639': 'MO', '640': 'MO', '641': 'MO', '644': 'MO', '645': 'MO',
    '646': 'MO', '647': 'MO', '648': 'MO', '649': 'MO', '650': 'MO', '651': 'MO', '652': 'MO', '653': 'MO', '654': 'MO', '655': 'MO',
    '656': 'MO', '657': 'MO', '658': 'MO', '660': 'KS', '661': 'KS', '662': 'KS', '664': 'KS', '665': 'KS', '666': 'KS', '667': 'KS',
    '668': 'KS', '669': 'KS', '670': 'KS', '671': 'KS', '672': 'KS', '673': 'KS', '674': 'KS', '675': 'KS', '676': 'KS', '677': 'KS',
    '678': 'KS', '679': 'KS', '680': 'NE', '681': 'NE', '683': 'NE', '684': 'NE', '685': 'NE', '686': 'NE', '687': 'NE', '688': 'NE',
    '689': 'NE', '690': 'NE', '691': 'NE', '692': 'NE', '693': 'NE', '700': 'LA', '701': 'LA', '703': 'LA', '704': 'LA', '705': 'LA',
    '706': 'LA', '707': 'LA', '708': 'LA', '710': 'LA', '711': 'LA', '712': 'LA', '713': 'LA', '714': 'LA', '716': 'AR', '717': 'AR',
    '718': 'AR', '719': 'AR', '720': 'AR', '721': 'AR', '722': 'AR', '723': 'AR', '724': 'AR', '725': 'AR', '726': 'AR', '727': 'AR',
    '728': 'AR', '729': 'AR', '730': 'OK', '731': 'OK', '733': 'OK', '734': 'OK', '735': 'OK', '736': 'OK', '737': 'OK', '738': 'OK',
    '739': 'OK', '740': 'OK', '741': 'OK', '743': 'OK', '744': 'OK', '745': 'OK', '746': 'OK', '747': 'OK', '748': 'OK', '749': 'OK',
    '750': 'TX', '751': 'TX', '752': 'TX', '753': 'TX', '754': 'TX', '755': 'TX', '756': 'TX', '757': 'TX', '758': 'TX', '759': 'TX',
    '760': 'TX', '761': 'TX', '762': 'TX', '763': 'TX', '764': 'TX', '765': 'TX', '766': 'TX', '767': 'TX', '768': 'TX', '769': 'TX',
    '770': 'TX', '771': 'TX', '772': 'TX', '773': 'TX', '774': 'TX', '775': 'TX', '776': 'TX', '777': 'TX', '778': 'TX', '779': 'TX',
    '780': 'TX', '781': 'TX', '782': 'TX', '783': 'TX', '784': 'TX', '785': 'TX', '786': 'TX', '787': 'TX', '788': 'TX', '789': 'TX',
    '790': 'TX', '791': 'TX', '792': 'TX', '793': 'TX', '794': 'TX', '795': 'TX', '796': 'TX', '797': 'TX', '798': 'TX', '799': 'TX',
    '800': 'CO', '801': 'CO', '802': 'CO', '803': 'CO', '804': 'CO', '805': 'CO', '806': 'CO', '807': 'CO', '808': 'CO', '809': 'CO',
    '810': 'CO', '811': 'CO', '812': 'CO', '813': 'CO', '814': 'CO', '815': 'CO', '816': 'CO', '820': 'WY', '821': 'WY', '822': 'WY',
    '823': 'WY', '824': 'WY', '825': 'WY', '826': 'WY', '827': 'WY', '828': 'WY', '829': 'WY', '830': 'WY', '831': 'WY', '834': 'ID',
    '835': 'ID', '836': 'ID', '837': 'ID', '838': 'ID', '840': 'UT', '841': 'UT', '842': 'UT', '843': 'UT', '844': 'UT', '845': 'UT',
    '846': 'UT', '847': 'UT', '850': 'AZ', '851': 'AZ', '852': 'AZ', '853': 'AZ', '855': 'AZ', '856': 'AZ', '857': 'AZ', '859': 'AZ',
    '860': 'AZ', '863': 'AZ', '864': 'AZ', '865': 'AZ', '870': 'NM', '871': 'NM', '873': 'NM', '874': 'NM', '875': 'NM', '877': 'NM',
    '878': 'NM', '879': 'NM', '880': 'NM', '881': 'NM', '882': 'NM', '883': 'NM', '884': 'NM', '885': 'TX', '890': 'NV', '891': 'NV',
    '893': 'NV', '894': 'NV', '895': 'NV', '897': 'NV', '898': 'NV', '900': 'CA', '901': 'CA', '902': 'CA', '903': 'CA', '904': 'CA',
    '905': 'CA', '906': 'CA', '907': 'CA', '908': 'CA', '910': 'CA', '911': 'CA', '912': 'CA', '913': 'CA', '914': 'CA', '915': 'CA',
    '916': 'CA', '917': 'CA', '918': 'CA', '919': 'CA', '920': 'CA', '921': 'CA', '922': 'CA', '923': 'CA', '924': 'CA', '925': 'CA',
    '926': 'CA', '927': 'CA', '928': 'CA', '930': 'CA', '931': 'CA', '932': 'CA', '933': 'CA', '934': 'CA', '935': 'CA', '936': 'CA',
    '937': 'CA', '938': 'CA', '939': 'CA', '940': 'CA', '941': 'CA', '942': 'CA', '943': 'CA', '944': 'CA', '945': 'CA', '946': 'CA',
    '947': 'CA', '948': 'CA', '949': 'CA', '950': 'CA', '951': 'CA', '952': 'CA', '953': 'CA', '954': 'CA', '955': 'CA', '956': 'CA',
    '957': 'CA', '958': 'CA', '959': 'CA', '960': 'CA', '961': 'CA', '962': 'CA', '970': 'OR', '971': 'OR', '972': 'OR', '973': 'OR',
    '974': 'OR', '975': 'OR', '976': 'OR', '977': 'OR', '978': 'OR', '979': 'OR', '980': 'WA', '981': 'WA', '982': 'WA', '983': 'WA',
    '984': 'WA', '985': 'WA', '986': 'WA', '988': 'WA', '989': 'WA', '990': 'WA', '991': 'WA', '992': 'WA', '993': 'WA', '994': 'WA',
    '995': 'AK', '996': 'AK', '997': 'AK', '998': 'AK', '999': 'AK'
  };

  // ============================================================================
  // INVESTMENT CONFIGURATION
  // ============================================================================

  // Alpha Vantage API configuration
  const ALPHA_VANTAGE_CONFIG = {
    apiKey: 'demo', // Users need to get their own key from https://www.alphavantage.co/support/#api-key
    baseUrl: 'https://www.alphavantage.co/query',
    rateLimitDelay: 12000, // 12 seconds between requests (5 calls per minute limit)
    maxRetries: 3
  };

  // Safe investment options categorized by risk tolerance and focus
  const SAFE_INVESTMENTS = {
    conservative: {
      dividend: [
        { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'stock', sector: 'Healthcare' },
        { symbol: 'PG', name: 'Procter & Gamble', type: 'stock', sector: 'Consumer Staples' },
        { symbol: 'KO', name: 'Coca-Cola', type: 'stock', sector: 'Consumer Staples' },
        { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'etf', sector: 'Diversified' },
        { symbol: 'VXUS', name: 'Vanguard Total International Stock ETF', type: 'etf', sector: 'International' }
      ],
      growth: [
        { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'etf', sector: 'Diversified' },
        { symbol: 'VTIAX', name: 'Vanguard Total International Stock Index', type: 'etf', sector: 'International' },
        { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', type: 'etf', sector: 'Bonds' }
      ],
      balanced: [
        { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'etf', sector: 'Diversified' },
        { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', type: 'etf', sector: 'Bonds' },
        { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'stock', sector: 'Healthcare' }
      ]
    },
    moderate: {
      dividend: [
        { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', sector: 'Technology' },
        { symbol: 'MSFT', name: 'Microsoft', type: 'stock', sector: 'Technology' },
        { symbol: 'JPM', name: 'JPMorgan Chase', type: 'stock', sector: 'Financial' },
        { symbol: 'VYM', name: 'Vanguard High Dividend Yield ETF', type: 'etf', sector: 'Diversified' },
        { symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', type: 'etf', sector: 'Diversified' }
      ],
      growth: [
        { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf', sector: 'Large Cap' },
        { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf', sector: 'Technology' },
        { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', type: 'etf', sector: 'International' }
      ],
      balanced: [
        { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf', sector: 'Large Cap' },
        { symbol: 'VYM', name: 'Vanguard High Dividend Yield ETF', type: 'etf', sector: 'Diversified' },
        { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', type: 'etf', sector: 'Bonds' }
      ]
    },
    aggressive: {
      dividend: [
        { symbol: 'VYM', name: 'Vanguard High Dividend Yield ETF', type: 'etf', sector: 'Diversified' },
        { symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', type: 'etf', sector: 'Diversified' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', sector: 'Technology' }
      ],
      growth: [
        { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf', sector: 'Technology' },
        { symbol: 'VGT', name: 'Vanguard Information Technology ETF', type: 'etf', sector: 'Technology' },
        { symbol: 'VUG', name: 'Vanguard Growth ETF', type: 'etf', sector: 'Growth' }
      ],
      balanced: [
        { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'etf', sector: 'Large Cap' },
        { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf', sector: 'Technology' },
        { symbol: 'VYM', name: 'Vanguard High Dividend Yield ETF', type: 'etf', sector: 'Diversified' }
      ]
    }
  };

  // Rate limiting for API calls
  let lastApiCall = 0;
  let apiCallQueue = [];

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Formats a number as currency (USD)
   * @param {number} value - The number to format
   * @returns {string} Formatted currency string or '-' for invalid numbers
   */
  function toCurrency(value) {
    if (!isFinite(value)) return '-';
    return value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }

  /**
   * Sanitizes and converts input to a valid number
   * Removes commas and handles string/number conversion
   * @param {string|number} input - The input to sanitize
   * @returns {number} Sanitized number or 0 if invalid
   */
  function sanitizeNumber(input) {
    const num = typeof input === 'number' ? input : parseFloat(String(input).replace(/,/g, ''));
    return isFinite(num) ? num : 0;
  }

  /**
   * Determines state from ZIP code using first 3 digits
   * @param {string} zipcode - The ZIP code to analyze
   * @returns {string} State abbreviation or 'CA' as default
   */
  function getStateFromZipcode(zipcode) {
    const cleanZip = zipcode.replace(/\D/g, '').substring(0, 3);
    return zipToState[cleanZip] || 'CA'; // Default to CA if not found
  }

  // ============================================================================
  // TAX CALCULATION FUNCTIONS
  // ============================================================================
  
  /**
   * Calculates federal income tax using progressive tax brackets
   * @param {number} income - Annual income to calculate tax for
   * @returns {number} Total federal tax amount
   */
  function calculateFederalTax(income) {
    let tax = 0;
    let remainingIncome = income;

    // Apply progressive tax brackets
    for (const bracket of federalTaxBrackets) {
      if (remainingIncome <= 0) break;
      
      const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);
      tax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }

    return tax;
  }

  /**
   * Calculates FICA taxes (Social Security and Medicare)
   * @param {number} income - Annual income to calculate FICA tax for
   * @returns {object} Object containing social security, medicare, and total FICA taxes
   */
  function calculateFICATax(income) {
    // Social Security tax (6.2% up to wage base limit)
    const socialSecurityTax = Math.min(income, ficaRates.socialSecurity.wageBase) * ficaRates.socialSecurity.rate;
    
    // Medicare tax (1.45% on all income + 0.9% on income over threshold)
    let medicareTax = income * ficaRates.medicare.rate;
    if (income > ficaRates.medicare.additionalThreshold) {
      medicareTax += (income - ficaRates.medicare.additionalThreshold) * ficaRates.medicare.additionalRate;
    }

    return {
      socialSecurity: socialSecurityTax,
      medicare: medicareTax,
      total: socialSecurityTax + medicareTax
    };
  }

  /**
   * Calculates state income tax
   * @param {number} income - Annual income to calculate state tax for
   * @param {string} state - State abbreviation
   * @returns {number} State tax amount
   */
  function calculateStateTax(income, state) {
    const stateRate = stateTaxRates[state] || 0;
    return income * stateRate;
  }

  /**
   * Calculates local income tax (simplified)
   * @param {number} income - Annual income to calculate local tax for
   * @param {string} state - State abbreviation
   * @returns {number} Local tax amount
   */
  function calculateLocalTax(income, state) {
    // Simplified local tax calculation using average rates by state
    const localTaxRates = {
      'NY': 0.03, 'CA': 0.01, 'PA': 0.02, 'OH': 0.02, 'MD': 0.03, 'IL': 0.01,
      'TX': 0.01, 'FL': 0.01, 'GA': 0.01, 'NC': 0.01, 'VA': 0.01, 'WA': 0.01
    };
    
    const localRate = localTaxRates[state] || 0;
    return income * localRate;
  }

  /**
   * Calculates all applicable taxes for given income and location
   * @param {number} income - Annual gross income
   * @param {string} zipcode - ZIP code for state/local tax determination
   * @returns {object} Complete tax breakdown including net income
   */
  function calculateAllTaxes(income, zipcode) {
    const state = getStateFromZipcode(zipcode); // Map ZIP prefix to state for localized tax rates
    const federalTax = calculateFederalTax(income);
    const ficaTax = calculateFICATax(income);
    const stateTax = calculateStateTax(income, state);
    const localTax = calculateLocalTax(income, state);
    
    const totalTaxes = federalTax + ficaTax.total + stateTax + localTax; // Aggregate every withholding bucket
    const netIncome = income - totalTaxes;

    return {
      grossIncome: income,
      federalTax,
      ficaTax,
      stateTax,
      localTax,
      totalTaxes,
      netIncome,
      state
    };
  }

  // ============================================================================
  // INCOME CALCULATION FUNCTIONS
  // ============================================================================
  
  /**
   * Converts various pay frequencies to annual income
   * @param {number} payAmount - The pay amount
   * @param {string} frequency - Pay frequency (hour, day, week, month, year)
   * @param {number} hoursPerDay - Hours worked per day (for hourly calculations)
   * @param {number} daysPerWeek - Days worked per week (for hourly/daily calculations)
   * @param {number} weeksPerYear - Weeks worked per year (for hourly/daily/weekly calculations)
   * @returns {number} Annual income amount
   */
  function calculateAnnualIncome(payAmount, frequency, hoursPerDay, daysPerWeek, weeksPerYear) {
    const amount = sanitizeNumber(payAmount);
    const hpd = hoursPerDay || defaultAssumptions.hoursPerDay;
    const dpw = daysPerWeek || defaultAssumptions.daysPerWeek;
    const wpy = weeksPerYear || defaultAssumptions.weeksPerYear;

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

  // ============================================================================
  // RENDERING FUNCTIONS
  // ============================================================================
  
  /**
   * Renders the income calculation results with tax breakdown
   * @param {number} annualIncome - Annual gross income
   * @param {string} zipcode - ZIP code for tax calculations
   */
  function renderResults(annualIncome, zipcode) {
    // Calculate income breakdowns for different time periods
    const monthlyIncome = annualIncome / 12;
    const weeklyIncome = annualIncome / 52;
    const dailyIncome = weeklyIncome / 5; // approx working day
    
    // Calculate all taxes and net income
    const taxData = calculateAllTaxes(annualIncome, zipcode);
    const monthlyNetIncome = taxData.netIncome / 12;

    if (monthlyIncomeInput) {
      applyMonthlyIncomeAutoFill(monthlyNetIncome);
    }

    // Save income data to FinancialDataStore
    FinancialDataStore.income.payAmount = sanitizeNumber(payAmountInput.value);
    FinancialDataStore.income.payFrequency = payFrequencySelect.value;
    FinancialDataStore.income.hoursPerDay = sanitizeNumber(hoursPerDayInput.value) || 8;
    FinancialDataStore.income.daysPerWeek = sanitizeNumber(daysPerWeekInput.value) || 5;
    FinancialDataStore.income.weeksPerYear = sanitizeNumber(weeksPerYearInput.value) || 52;
    FinancialDataStore.income.zipcode = zipcodeInput.value.trim();
    FinancialDataStore.income.monthlyNetIncome = monthlyNetIncome;
    FinancialDataStore.income.annualGrossIncome = annualIncome;
    FinancialDataStore.income.calculatedDate = new Date().toISOString();

    // Save to localStorage and dashboard
    saveFinancialData();
    saveToLocalStorage('monthlyIncome', monthlyNetIncome);

    const content = `
      <div class="income-summary">
        <h3>Gross Income</h3>
        <p><strong>Annual:</strong> <span class="number">${toCurrency(annualIncome)}</span></p>
        <p><strong>Monthly:</strong> ${toCurrency(monthlyIncome)} · <strong>Weekly:</strong> ${toCurrency(weeklyIncome)} · <strong>Daily (workday est.):</strong> ${toCurrency(dailyIncome)}</p>
      </div>
      
      <div class="tax-breakdown">
        <h3>Tax Breakdown (${taxData.state})</h3>
        <div class="tax-grid">
          <div class="tax-item">
            <span class="tax-label">Federal Tax:</span>
            <span class="tax-amount">${toCurrency(taxData.federalTax)}</span>
          </div>
          <div class="tax-item">
            <span class="tax-label">FICA (Social Security):</span>
            <span class="tax-amount">${toCurrency(taxData.ficaTax.socialSecurity)}</span>
          </div>
          <div class="tax-item">
            <span class="tax-label">FICA (Medicare):</span>
            <span class="tax-amount">${toCurrency(taxData.ficaTax.medicare)}</span>
          </div>
          <div class="tax-item">
            <span class="tax-label">State Tax:</span>
            <span class="tax-amount">${toCurrency(taxData.stateTax)}</span>
          </div>
          <div class="tax-item">
            <span class="tax-label">Local Tax:</span>
            <span class="tax-amount">${toCurrency(taxData.localTax)}</span>
          </div>
          <div class="tax-item total-taxes">
            <span class="tax-label"><strong>Total Taxes:</strong></span>
            <span class="tax-amount"><strong>${toCurrency(taxData.totalTaxes)}</strong></span>
          </div>
        </div>
      </div>
      
      <div class="net-income">
        <h3>Net Income (After Taxes)</h3>
        <p><strong>Annual:</strong> <span class="number">${toCurrency(taxData.netIncome)}</span></p>
        <p><strong>Monthly:</strong> ${toCurrency(monthlyNetIncome)} · <strong>Weekly:</strong> ${toCurrency(taxData.netIncome / 52)} · <strong>Daily (workday est.):</strong> ${toCurrency(taxData.netIncome / 52 / 5)}</p>
      </div>
    `;
  if (resultsEl) resultsEl.innerHTML = content; // Replace previous markup with the latest calculation output

    renderBudget(monthlyNetIncome);
  }

  // ============================================================================
  // BUDGET CALCULATION FUNCTIONS
  // ============================================================================
  
  /**
   * Analyzes budget by calculating totals, remaining income, and percentages
   * @param {number} income - Monthly income
   * @param {object} expenses - Object containing expense categories and amounts
   * @returns {object} Budget analysis including totals and percentages
   */
  function calculateBudgetAnalysis(income, expenses) {
    const totalExpenses = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);
    const remainingIncome = income - totalExpenses;
    const savingsRate = (remainingIncome / income) * 100;

    // Calculate expense percentages for each category
    const expensePercentages = {};
    Object.keys(expenses).forEach(key => {
      if (expenses[key] > 0) {
        expensePercentages[key] = (expenses[key] / income) * 100;
      }
    });

    return {
      totalExpenses,
      remainingIncome,
      savingsRate,
      expensePercentages
    };
  }

  /**
   * Generates personalized savings and investment recommendations based on budget analysis
   * @param {object} analysis - Budget analysis object containing remaining income and savings rate
   * @returns {array} Array of recommendation objects with amounts and descriptions
   */
  function generateSavingsRecommendations(analysis) {
    const { remainingIncome, savingsRate, totalExpenses } = analysis;
    const recommendations = [];

    // Emergency Fund - Priority 1: Build 3-6 months of expenses
    if (remainingIncome > 0) {
      const emergencyFundAmount = Math.min(remainingIncome * 0.3, 500);
      recommendations.push({
        type: 'emergency',
        title: 'Emergency Fund',
        icon: '🛡️',
        amount: emergencyFundAmount,
        description: 'Build 3-6 months of expenses in a high-yield savings account for unexpected situations.',
        priority: 'high'
      });
    }

    // 401k/Retirement - Priority 2: Long-term wealth building
    if (remainingIncome > 200) {
      const retirementAmount = Math.min(remainingIncome * 0.4, 1000);
      recommendations.push({
        type: 'retirement',
        title: '401k/Retirement',
        icon: '🏦',
        amount: retirementAmount,
        description: 'Contribute to your 401k (especially if employer matches) or open an IRA for long-term wealth building.',
        priority: 'high'
      });
    }

    // Investment Portfolio - Priority 3: Diversified growth investments
    if (remainingIncome > 300) {
      const investmentAmount = Math.min(remainingIncome * 0.3, 800);
      recommendations.push({
        type: 'investment',
        title: 'Investment Portfolio',
        icon: '📈',
        amount: investmentAmount,
        description: 'Invest in diversified index funds or ETFs for long-term growth. Consider low-cost options like VTI or SPY.',
        priority: 'medium'
      });
    }

    // High-Yield Savings - Priority 4: Short-term goals
    if (remainingIncome > 100) {
      const savingsAmount = Math.min(remainingIncome * 0.2, 300);
      recommendations.push({
        type: 'savings',
        title: 'High-Yield Savings',
        icon: '💰',
        amount: savingsAmount,
        description: 'Save for short-term goals (vacation, car, home down payment) in a high-yield savings account.',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Generates expense recommendations based on financial best practices
   * @param {object} expenses - Object containing expense categories and amounts
   * @param {number} income - Monthly income
   * @returns {array} Array of recommendation objects with warnings or success messages
   */
  function generateExpenseRecommendations(expenses, income) {
    const recommendations = [];
    const totalExpenses = Object.values(expenses).reduce((sum, amount) => sum + amount, 0);

    // Housing cost analysis (should be 25-30% of income)
    if (expenses.rentMortgage > 0) {
      const housingPercent = (expenses.rentMortgage / income) * 100;
      if (housingPercent > 35) {
        recommendations.push({
          type: 'warning',
          message: `Housing costs (${housingPercent.toFixed(1)}%) are above recommended 25-30%. Consider finding more affordable housing or increasing income.`
        });
      }
    }

    // Debt payment analysis (should be under 20% of income)
    if (expenses.debtPayments > 0) {
      const debtPercent = (expenses.debtPayments / income) * 100;
      if (debtPercent > 20) {
        recommendations.push({
          type: 'warning',
          message: `Debt payments (${debtPercent.toFixed(1)}%) are above recommended 20%. Focus on paying down high-interest debt first.`
        });
      }
    }

    // Overall expense analysis (should be under 80% of income for healthy savings)
    const totalExpensePercent = (totalExpenses / income) * 100;
    if (totalExpensePercent > 80) {
      recommendations.push({
        type: 'warning',
        message: `Total expenses (${totalExpensePercent.toFixed(1)}%) leave little room for savings. Consider reducing discretionary spending.`
      });
    } else if (totalExpensePercent < 60) {
      recommendations.push({
        type: 'success',
        message: `Great job! Your expenses (${totalExpensePercent.toFixed(1)}%) leave plenty of room for savings and investments.`
      });
    }

    return recommendations;
  }

  /**
   * Renders the budget analysis results with recommendations
   * @param {object} analysis - Budget analysis object
   * @param {array} recommendations - Savings and investment recommendations
   * @param {array} expenseRecommendations - Expense analysis recommendations
   */
  function renderBudgetResults(analysis, recommendations, expenseRecommendations) {
    const { totalExpenses, remainingIncome, savingsRate } = analysis;
    
    let content = `
      <div class="budget-summary">
        <h3>Budget Summary</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span>Total Monthly Income:</span>
            <span>${toCurrency(analysis.income)}</span>
          </div>
          <div class="summary-item">
            <span>Total Monthly Expenses:</span>
            <span>${toCurrency(totalExpenses)}</span>
          </div>
          <div class="summary-item">
            <span>Remaining Income:</span>
            <span>${toCurrency(remainingIncome)}</span>
          </div>
          <div class="summary-item">
            <span>Savings Rate:</span>
            <span>${savingsRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    `;

    // Add expense recommendations
    if (expenseRecommendations.length > 0) {
      content += '<div class="expense-recommendations">';
      expenseRecommendations.forEach(rec => {
        content += `<div class="alert ${rec.type}">${rec.message}</div>`;
      });
      content += '</div>';
    }

    // Add savings recommendations
    if (recommendations.length > 0) {
      content += `
        <div class="recommendations">
          <h3>Savings & Investment Recommendations</h3>
      `;
      
      recommendations.forEach(rec => {
        content += `
          <div class="recommendation-card">
            <h4>
              <span class="icon">${rec.icon}</span>
              ${rec.title}
            </h4>
            <p class="amount">Recommended: ${toCurrency(rec.amount)}/month</p>
            <p>${rec.description}</p>
          </div>
        `;
      });
      
      content += '</div>';
    } else {
      content += `
        <div class="alert warning">
          <strong>Limited Savings Capacity:</strong> Your current expenses don't leave much room for savings. 
          Consider reducing expenses or increasing income to build wealth over time.
        </div>
      `;
    }

  if (budgetResultsEl) budgetResultsEl.innerHTML = content;
  }

  /**
   * Renders the 50/30/15/5 budget breakdown based on monthly income
   * @param {number} monthlyIncome - Monthly net income for budget allocation
   */
  function renderBudget(monthlyIncome) {
    const items = budgetRules.map(rule => {
      const amount = monthlyIncome * (rule.percent / 100);
      return `
        <div class="budget-item">
          <h3>${rule.label}</h3>
          <p><strong>${rule.percent}%</strong> · ${toCurrency(amount)} / month</p>
        </div>
      `;
    }).join('');
  if (budgetEl) budgetEl.innerHTML = items; // Present the guideline allocations alongside income results
  }

  /**
   * Returns the currently stored monthly income value
   * @returns {number} Monthly net income
   */
  function getMonthlyIncomeValue() {
    return monthlyIncomeInput ? sanitizeNumber(monthlyIncomeInput.value) : 0;
  }

  /**
   * Updates visual slider and summary data for a given expense configuration
   * @param {object} config - Expense configuration containing DOM references
   * @param {number} income - Monthly income used for percentage calculations
   * @returns {{amount: number, percent: number}} Expense amount and its percentage of income
   */
  function updateExpenseVisual(config, income) {
    const amountEl = config.amountEl;
    if (!amountEl) return { amount: 0, percent: 0 };

    const amount = sanitizeNumber(amountEl.value);
    const percent = income > 0 ? (amount / income) * 100 : 0;
    const sliderPercent = Math.max(0, Math.min(percent, 100));

    if (config.sliderEl) {
      config.sliderEl.value = sliderPercent;
      config.sliderEl.style.setProperty('--range-progress', `${sliderPercent}%`);
    }

    const displayText = `${percent.toFixed(1)}% · ${toCurrency(amount)}`;
    if (config.displayEl) {
      config.displayEl.textContent = displayText;
    }
    if (config.summaryEl) {
      config.summaryEl.textContent = displayText;
    }

    return { amount, percent };
  }

  /**
   * Updates all expense visualizations and remaining income summary
   */
  function updateAllExpenseVisuals() {
    const income = getMonthlyIncomeValue();
    let totalExpenses = 0;

    expenseFieldConfig.forEach(config => {
      const result = updateExpenseVisual(config, income);
      totalExpenses += result.amount;
    });

    if (summaryRemainingEl) {
      const remaining = income - totalExpenses;
      const remainingPercent = income > 0 ? (remaining / income) * 100 : 0;
      summaryRemainingEl.textContent = `${remainingPercent.toFixed(1)}% · ${toCurrency(remaining)}`;
    }
  }

  /**
   * Applies calculated monthly net income to the budget planner display
   * @param {number} netMonthlyIncome - Monthly take-home pay to inject
   */
  function applyMonthlyIncomeAutoFill(netMonthlyIncome) {
    if (!monthlyIncomeInput) return;

    const normalized = Math.max(0, Number(netMonthlyIncome) || 0);
    monthlyIncomeInput.value = normalized.toFixed(2);

    if (monthlyIncomeDisplay) {
      monthlyIncomeDisplay.textContent = toCurrency(normalized);
    }

    updateAllExpenseVisuals();
  }

  /**
   * Updates form field visibility based on pay frequency selection
   * Shows/hides relevant fields for different pay frequency options
   */
  function updateVisibility() {
    if (!payFrequencySelect) return;
    const frequency = payFrequencySelect.value;
    const showHour = frequency === 'hour';
    const showDay = frequency === 'hour' || frequency === 'day';
    const showWeek = frequency === 'hour' || frequency === 'day' || frequency === 'week';
    const hoursField = document.getElementById('hours-per-day-field');
    const daysField = document.getElementById('days-per-week-field');
    const weeksField = document.getElementById('weeks-per-year-field');

    if (hoursField) hoursField.style.display = showHour ? '' : 'none';
    if (daysField) daysField.style.display = showDay ? '' : 'none';
    if (weeksField) weeksField.style.display = showWeek ? '' : 'none';
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  /**
   * Handles income calculator form submission
   * Validates input and calculates annual income with tax breakdown
   * @param {Event} event - Form submit event
   */
  function onSubmit(event) {
    event.preventDefault();
    const payAmount = sanitizeNumber(payAmountInput.value);
    const frequency = payFrequencySelect.value;
    const hpd = sanitizeNumber(hoursPerDayInput.value) || undefined;
    const dpw = sanitizeNumber(daysPerWeekInput.value) || undefined;
    const wpy = sanitizeNumber(weeksPerYearInput.value) || undefined;
    const zipcode = zipcodeInput.value.trim();

    // Validate pay amount
    if (payAmount <= 0) {
      if (resultsEl) resultsEl.textContent = 'Enter a valid pay amount.';
      if (budgetEl) budgetEl.innerHTML = '';
      return;
    }

    // Validate ZIP code format
    if (!zipcode || !/^\d{5}(-\d{4})?$/.test(zipcode)) {
      if (resultsEl) resultsEl.textContent = 'Please enter a valid 5-digit ZIP code.';
      if (budgetEl) budgetEl.innerHTML = '';
      return;
    }

    const annual = calculateAnnualIncome(payAmount, frequency, hpd, dpw, wpy);
    renderResults(annual, zipcode);
  }

  /**
   * Handles income calculator form reset
   * Clears all form fields and results
   */
  function onReset() {
    if (form) form.reset();
    if (resultsEl) resultsEl.textContent = '';
    if (budgetEl) budgetEl.innerHTML = '';
    updateVisibility();
  }

  /**
   * Handles budget planner form submission
   * Analyzes expenses and generates recommendations
   * @param {Event} event - Form submit event
   */
  function onBudgetSubmit(event) {
    event.preventDefault();
    
    // Collect and sanitize all form inputs
    const monthlyIncome = sanitizeNumber(monthlyIncomeInput.value);
    const expenses = expenseFieldConfig.reduce((acc, config) => {
      const amountEl = config.amountEl;
      acc[config.key] = amountEl ? sanitizeNumber(amountEl.value) : 0;
      return acc;
    }, {});

    // Validate monthly income
    if (monthlyIncome <= 0) {
      budgetResultsEl.textContent = 'Please enter a valid monthly income.';
      return;
    }

    // Perform budget analysis and generate recommendations
    const analysis = calculateBudgetAnalysis(monthlyIncome, expenses);
    analysis.income = monthlyIncome; // Persist income on the analysis object for downstream render helpers

    const savingsRecommendations = generateSavingsRecommendations(analysis);
    const expenseRecommendations = generateExpenseRecommendations(expenses, monthlyIncome);

    // Save budget data to FinancialDataStore
    FinancialDataStore.budget.monthlyIncome = monthlyIncome;
    FinancialDataStore.budget.expenses = expenses;
    FinancialDataStore.budget.totalExpenses = Object.values(expenses).reduce((sum, expense) => sum + expense, 0);
    FinancialDataStore.budget.analysis = analysis;
    FinancialDataStore.budget.lastUpdated = new Date().toISOString();

    // Save to localStorage and dashboard
    saveFinancialData();
    saveToLocalStorage('monthlyExpenses', FinancialDataStore.budget.totalExpenses);
    saveToLocalStorage('budgetAnalysis', analysis);
    saveToLocalStorage('lastBudgetUpdate', FinancialDataStore.budget.lastUpdated);

    renderBudgetResults(analysis, savingsRecommendations, expenseRecommendations);
    updateDashboard();
  }

  /**
   * Handles budget planner form reset
   * Clears all form fields and results
   */
  function onBudgetReset() {
    const incomeSnapshot = getMonthlyIncomeValue();
    if (budgetForm) budgetForm.reset();
    if (budgetResultsEl) budgetResultsEl.textContent = '';
    monthlyIncomeInput.value = incomeSnapshot.toFixed(2);
    if (monthlyIncomeDisplay) {
      monthlyIncomeDisplay.textContent = toCurrency(incomeSnapshot);
    }
    updateAllExpenseVisuals();
  }

  // ============================================================================
  // DATA PERSISTENCE FUNCTIONS
  // ============================================================================

  /**
   * Saves data to localStorage
   * @param {string} key - Storage key
   * @param {any} data - Data to save
   */
  function saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  /**
   * Loads data from localStorage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if not found
   * @returns {any} Loaded data or default value
   */
  function loadFromLocalStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return defaultValue;
    }
  }

  // ============================================================================
  // DASHBOARD FUNCTIONS
  // ============================================================================

  /**
   * Calculates financial health score based on various metrics
   * @param {object} metrics - Financial metrics
   * @returns {number} Health score (0-100)
   */
  function calculateHealthScore(metrics) {
    let score = 0;
    let factors = 0;

    // Income factor (20 points)
    if (metrics.monthlyIncome > 0) {
      score += 20;
      factors++;
    }

    // Savings rate factor (25 points)
    if (metrics.savingsRate >= 20) score += 25;
    else if (metrics.savingsRate >= 15) score += 20;
    else if (metrics.savingsRate >= 10) score += 15;
    else if (metrics.savingsRate >= 5) score += 10;
    factors++;

    // Emergency fund factor (25 points)
    if (metrics.emergencyFundMonths >= 6) score += 25;
    else if (metrics.emergencyFundMonths >= 3) score += 15;
    else if (metrics.emergencyFundMonths >= 1) score += 10;
    factors++;

    // Debt factor (20 points)
    if (metrics.debtToIncomeRatio === 0) score += 20;
    else if (metrics.debtToIncomeRatio <= 0.2) score += 15;
    else if (metrics.debtToIncomeRatio <= 0.36) score += 10;
    else if (metrics.debtToIncomeRatio <= 0.5) score += 5;
    factors++;

    // Investment factor (10 points)
    if (metrics.hasInvestments) score += 10;
    factors++;

    return Math.round(score);
  }

  /**
   * Updates dashboard with current financial data
   */
  function updateDashboard() {
    const savedData = {
      income: loadFromLocalStorage('monthlyIncome', 0),
      expenses: loadFromLocalStorage('monthlyExpenses', 0),
      emergencyFund: loadFromLocalStorage('emergencyFund', 0),
      debts: loadFromLocalStorage('debts', []),
      goals: loadFromLocalStorage('goals', [])
    };

    const monthlyIncome = savedData.income;
    const monthlyExpenses = savedData.expenses;
    const savingsAmount = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (savingsAmount / monthlyIncome) * 100 : 0;
    const totalDebt = savedData.debts.reduce((sum, debt) => sum + debt.balance, 0);
    const debtToIncomeRatio = monthlyIncome > 0 ? totalDebt / (monthlyIncome * 12) : 0;
    const emergencyFundMonths = monthlyExpenses > 0 ? savedData.emergencyFund / monthlyExpenses : 0;

    const metrics = {
      monthlyIncome,
      monthlyExpenses,
      savingsRate,
      emergencyFundMonths,
      debtToIncomeRatio,
      hasInvestments: false // Could be enhanced to track investments
    };

    // Update health score
    const healthScore = calculateHealthScore(metrics);
    if (healthScoreEl) healthScoreEl.textContent = healthScore;

    // Update metric cards
    if (metricIncomeEl) {
      metricIncomeEl.textContent = monthlyIncome > 0 ? toCurrency(monthlyIncome) : '--';
      metricIncomeEl.nextElementSibling.textContent = monthlyIncome > 0 ? 'Calculated' : 'Not calculated';
    }
    if (metricExpensesEl) {
      metricExpensesEl.textContent = monthlyExpenses > 0 ? toCurrency(monthlyExpenses) : '--';
      metricExpensesEl.nextElementSibling.textContent = monthlyExpenses > 0 ? 'Calculated' : 'Not calculated';
    }
    if (metricSavingsRateEl) {
      metricSavingsRateEl.textContent = monthlyIncome > 0 ? savingsRate.toFixed(1) + '%' : '--';
      metricSavingsRateEl.nextElementSibling.textContent = monthlyIncome > 0 ? 'Calculated' : 'Not calculated';
    }
    if (metricEmergencyEl) {
      metricEmergencyEl.textContent = savedData.emergencyFund > 0 ? toCurrency(savedData.emergencyFund) : '--';
      metricEmergencyEl.nextElementSibling.textContent = savedData.emergencyFund > 0 ? 'On track' : 'Not set';
    }
    if (metricDebtEl) {
      metricDebtEl.textContent = totalDebt > 0 ? toCurrency(totalDebt) : '--';
      metricDebtEl.nextElementSibling.textContent = totalDebt > 0 ? 'Active debts' : 'No debts';
    }
    if (metricInvestmentsEl) {
      // For now, we don't track investment values
      metricInvestmentsEl.textContent = '--';
      metricInvestmentsEl.nextElementSibling.textContent = 'Not tracking';
    }

    // Update budget summary if available
    updateBudgetSummary();

    // Generate recommendations
    generateRecommendations(metrics);
  }

  /**
   * Updates the budget summary section on the dashboard
   */
  function updateBudgetSummary() {
    const budgetSummarySection = document.getElementById('budget-summary-section');
    const budgetSummaryContent = document.getElementById('budget-summary-content');

    if (!budgetSummarySection || !budgetSummaryContent) return;

    const budgetAnalysis = loadFromLocalStorage('budgetAnalysis', null);
    const lastUpdate = loadFromLocalStorage('lastBudgetUpdate', null);

    if (!budgetAnalysis) {
      budgetSummarySection.style.display = 'none';
      return;
    }

    budgetSummarySection.style.display = 'block';

    const updateDate = lastUpdate ? new Date(lastUpdate).toLocaleDateString() : 'Unknown';
    const { totalExpenses, remainingIncome, savingsRate, income } = budgetAnalysis;

    budgetSummaryContent.innerHTML = `
      <div class="budget-summary-grid">
        <div class="budget-summary-item">
          <div class="summary-label">Total Monthly Expenses</div>
          <div class="summary-value">${toCurrency(totalExpenses)}</div>
        </div>
        <div class="budget-summary-item">
          <div class="summary-label">Remaining Income</div>
          <div class="summary-value ${remainingIncome >= 0 ? 'positive' : 'negative'}">${toCurrency(remainingIncome)}</div>
        </div>
        <div class="budget-summary-item">
          <div class="summary-label">Savings Rate</div>
          <div class="summary-value ${savingsRate >= 20 ? 'excellent' : savingsRate >= 10 ? 'good' : 'needs-improvement'}">${savingsRate.toFixed(1)}%</div>
        </div>
        <div class="budget-summary-item">
          <div class="summary-label">Last Updated</div>
          <div class="summary-value">${updateDate}</div>
        </div>
      </div>
    `;
  }

  /**
   * Generates personalized recommendations based on financial health
   * @param {object} metrics - Financial metrics
   */
  function generateRecommendations(metrics) {
    if (!recommendationListEl) return;

    const recommendations = [];

    if (metrics.monthlyIncome === 0) {
      recommendations.push({
        icon: '💰',
        title: 'Calculate your income',
        description: 'Start by determining your monthly take-home pay in the Income tab.',
        priority: 'high',
        action: 'income',
        actionText: 'Start'
      });
    }

    if (metrics.monthlyExpenses === 0 && metrics.monthlyIncome > 0) {
      recommendations.push({
        icon: '📋',
        title: 'Plan your budget',
        description: 'Track your monthly expenses to understand your spending patterns.',
        priority: 'high',
        action: 'budget',
        actionText: 'Plan'
      });
    }

    if (metrics.emergencyFundMonths < 3 && metrics.monthlyIncome > 0) {
      recommendations.push({
        icon: '🛡️',
        title: 'Build emergency fund',
        description: 'Aim for 3-6 months of expenses in an emergency fund for financial security.',
        priority: 'high',
        action: 'emergency',
        actionText: 'Build'
      });
    }

    if (metrics.savingsRate < 10 && metrics.monthlyIncome > 0) {
      recommendations.push({
        icon: '💸',
        title: 'Increase savings rate',
        description: 'Try to save at least 10-20% of your income for long-term financial health.',
        priority: 'medium',
        action: 'budget',
        actionText: 'Optimize'
      });
    }

    if (metrics.debtToIncomeRatio > 0.36) {
      recommendations.push({
        icon: '💳',
        title: 'Focus on debt payoff',
        description: 'Your debt-to-income ratio is high. Consider using the Debt Payoff tool.',
        priority: 'high',
        action: 'debt',
        actionText: 'Payoff'
      });
    }

    if (metrics.savingsRate >= 15 && metrics.emergencyFundMonths >= 3 && !metrics.hasInvestments) {
      recommendations.push({
        icon: '📈',
        title: 'Start investing',
        description: 'You have a solid foundation. Consider exploring investment options.',
        priority: 'medium',
        action: 'investment',
        actionText: 'Invest'
      });
    }

    // Default recommendation if everything looks good
    if (recommendations.length === 0) {
      recommendations.push({
        icon: '🎯',
        title: 'Set financial goals',
        description: 'Your finances look healthy! Consider setting long-term financial goals.',
        priority: 'low',
        action: 'goals',
        actionText: 'Set Goals'
      });
    }

    const html = recommendations.map(rec => `
      <div class="recommendation-item priority-${rec.priority}">
        <div class="rec-icon">${rec.icon}</div>
        <div class="rec-content">
          <h4>${rec.title}</h4>
          <p>${rec.description}</p>
        </div>
        <div class="rec-action">
          <button class="rec-btn" onclick="switchTab('${rec.action}')">${rec.actionText}</button>
        </div>
      </div>
    `).join('');

    recommendationListEl.innerHTML = html;
  }

  // ============================================================================
  // DEBT PAYOFF FUNCTIONS
  // ============================================================================

  let debtCounter = 0;
  let debts = [];

  /**
   * Adds a new debt input to the form
   */
  function addDebtInput() {
    debtCounter++;
    const debtItem = document.createElement('div');
    debtItem.className = 'debt-item';
  if (debtItem) debtItem.innerHTML = `
      <input type="text" placeholder="Debt name (e.g., Credit Card)" data-field="name" required>
      <input type="number" placeholder="Balance" data-field="balance" step="0.01" min="0" required>
      <input type="number" placeholder="Interest Rate (%)" data-field="rate" step="0.01" min="0" required>
      <input type="number" placeholder="Min Payment" data-field="payment" step="0.01" min="0" required>
      <button type="button" class="remove-debt-btn" onclick="removeDebtInput(this)">×</button>
    `;
    if (debtListEl) debtListEl.appendChild(debtItem);
  }

  /**
   * Removes a debt input from the form
   * @param {HTMLElement} button - Remove button element
   */
  function removeDebtInput(button) {
    button.parentElement.remove();
  }

  /**
   * Collects debt data from form inputs
   * @returns {Array} Array of debt objects
   */
  function collectDebtData() {
    const debtItems = debtListEl.querySelectorAll('.debt-item');
    const debts = [];

    debtItems.forEach(item => {
      const inputs = item.querySelectorAll('input[data-field]');
      const debt = {};
      let valid = true;

      inputs.forEach(input => {
        const field = input.dataset.field;
        const value = input.value.trim();

        if (!value) {
          valid = false;
          return;
        }

        if (field === 'name') {
          debt[field] = value;
        } else {
          debt[field] = parseFloat(value);
        }
      });

      if (valid) {
        debts.push(debt);
      }
    });

    return debts;
  }

  /**
   * Calculates debt payoff using avalanche method (highest interest first)
   * @param {Array} debts - Array of debt objects
   * @param {number} extraPayment - Extra monthly payment
   * @returns {object} Payoff plan
   */
  function calculateAvalanche(debts, extraPayment) {
    const sortedDebts = [...debts].sort((a, b) => b.rate - a.rate);
    return calculatePayoffPlan(sortedDebts, extraPayment, 'Debt Avalanche');
  }

  /**
   * Calculates debt payoff using snowball method (smallest balance first)
   * @param {Array} debts - Array of debt objects
   * @param {number} extraPayment - Extra monthly payment
   * @returns {object} Payoff plan
   */
  function calculateSnowball(debts, extraPayment) {
    const sortedDebts = [...debts].sort((a, b) => a.balance - b.balance);
    return calculatePayoffPlan(sortedDebts, extraPayment, 'Debt Snowball');
  }

  /**
   * Calculates detailed payoff plan for debts
   * @param {Array} sortedDebts - Debts sorted by strategy
   * @param {number} extraPayment - Extra monthly payment
   * @param {string} strategyName - Name of the strategy
   * @returns {object} Detailed payoff plan
   */
  function calculatePayoffPlan(sortedDebts, extraPayment, strategyName) {
    let remainingDebts = sortedDebts.map(debt => ({...debt}));
    let totalPaid = 0;
    let totalInterest = 0;
    let month = 0;
    const timeline = [];

    while (remainingDebts.length > 0 && month < 600) { // 50 year max
      month++;
      let monthlyExtra = extraPayment;

      // Pay minimums on all debts first
      remainingDebts.forEach(debt => {
        const interestPayment = (debt.balance * (debt.rate / 100)) / 12;
        const principalPayment = Math.min(debt.payment - interestPayment, debt.balance);

        debt.balance -= principalPayment;
        totalPaid += debt.payment;
        totalInterest += interestPayment;
      });

      // Apply extra payment to priority debt
      if (monthlyExtra > 0 && remainingDebts.length > 0) {
        const priorityDebt = remainingDebts[0];
        const extraApplied = Math.min(monthlyExtra, priorityDebt.balance);
        priorityDebt.balance -= extraApplied;
        totalPaid += extraApplied;
      }

      // Remove paid off debts
      const paidOff = remainingDebts.filter(debt => debt.balance <= 0);
      paidOff.forEach(debt => {
        timeline.push({
          month,
          debtName: debt.name,
          type: 'payoff'
        });
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
   * Handles debt form submission
   * @param {Event} event - Form submit event
   */
  function onDebtSubmit(event) {
    event.preventDefault();

    const debts = collectDebtData();
    const extraPaymentEl = document.getElementById('extra-payment');
    const payoffStrategyEl = document.getElementById('payoff-strategy');
    const extraPayment = extraPaymentEl ? sanitizeNumber(extraPaymentEl.value) || 0 : 0;
    const strategy = payoffStrategyEl ? payoffStrategyEl.value : 'avalanche';

    if (debts.length === 0) {
    if (debtResultsEl) debtResultsEl.innerHTML = '<div class="error-message"><h4>Error</h4><p>Please add at least one debt.</p></div>';
      return;
    }

    // Save debts data to FinancialDataStore
    FinancialDataStore.debts = debts;
    FinancialDataStore.debtStrategy = {
      extraPayment: extraPayment,
      selectedStrategy: strategy,
      lastUpdated: new Date().toISOString()
    };

    // Save to localStorage and dashboard
    saveFinancialData();
    saveToLocalStorage('debts', debts);

    const avalanchePlan = calculateAvalanche(debts, extraPayment);
    const snowballPlan = calculateSnowball(debts, extraPayment);
    const selectedPlan = strategy === 'avalanche' ? avalanchePlan : snowballPlan;
    const alternativePlan = strategy === 'avalanche' ? snowballPlan : avalanchePlan;

    displayDebtResults(selectedPlan, alternativePlan, debts);
    updateDashboard();
  }

  /**
   * Displays debt payoff results
   * @param {object} selectedPlan - Primary payoff plan
   * @param {object} alternativePlan - Alternative payoff plan
   * @param {Array} debts - Original debt data
   */
  function displayDebtResults(selectedPlan, alternativePlan, debts) {
    const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
    const minPayments = debts.reduce((sum, debt) => sum + debt.payment, 0);

    const html = `
      <div class="payoff-summary">
        <h3>${selectedPlan.strategy} Results</h3>
        <div class="overview-grid">
          <div class="overview-item">
            <span class="label">Time to Pay Off</span>
            <span class="value">${Math.floor(selectedPlan.totalMonths / 12)} years, ${selectedPlan.totalMonths % 12} months</span>
          </div>
          <div class="overview-item">
            <span class="label">Total Interest Paid</span>
            <span class="value">${toCurrency(selectedPlan.totalInterest)}</span>
          </div>
          <div class="overview-item">
            <span class="label">Total Amount Paid</span>
            <span class="value">${toCurrency(selectedPlan.totalPaid)}</span>
          </div>
          <div class="overview-item">
            <span class="label">Monthly Payment</span>
            <span class="value">${toCurrency(minPayments + selectedPlan.monthlySavings)}</span>
          </div>
        </div>
      </div>

      <div class="strategy-comparison">
        <h3>Strategy Comparison</h3>
        <div class="comparison-grid">
          <div class="comparison-item">
            <h4>Debt Avalanche</h4>
            <p>Payoff time: ${Math.floor(avalanchePlan.totalMonths / 12)}y ${avalanchePlan.totalMonths % 12}m</p>
            <p>Interest paid: ${toCurrency(avalanchePlan.totalInterest)}</p>
          </div>
          <div class="comparison-item">
            <h4>Debt Snowball</h4>
            <p>Payoff time: ${Math.floor(snowballPlan.totalMonths / 12)}y ${snowballPlan.totalMonths % 12}m</p>
            <p>Interest paid: ${toCurrency(snowballPlan.totalInterest)}</p>
          </div>
        </div>
      </div>

      <div class="debt-tips">
        <h4>Tips for Success:</h4>
        <ul>
          <li>Make payments on time to avoid late fees</li>
          <li>Consider balance transfers for high-interest credit cards</li>
          <li>Avoid taking on new debt during payoff</li>
          <li>Celebrate milestones to stay motivated</li>
        </ul>
      </div>
    `;

  if (debtResultsEl) debtResultsEl.innerHTML = html;
  }

  /**
   * Resets debt form
   */
  function onDebtReset() {
    debtForm.reset();
  if (debtListEl) debtListEl.innerHTML = '';
  if (debtResultsEl) debtResultsEl.innerHTML = '';
    debtCounter = 0;
  }

  // ============================================================================
  // EMERGENCY FUND FUNCTIONS
  // ============================================================================

  /**
   * Handles emergency fund form submission
   * @param {Event} event - Form submit event
   */
  function onEmergencySubmit(event) {
    event.preventDefault();

    const formData = new FormData(emergencyForm);
    const monthlyExpenses = sanitizeNumber(formData.get('emergencyExpenses'));
    const targetMonths = parseInt(formData.get('emergencyMonths'));
    const currentFund = sanitizeNumber(formData.get('currentEmergency')) || 0;
    const monthlyContribution = sanitizeNumber(formData.get('monthlyContribution')) || 0;

    if (monthlyExpenses <= 0) {
  if (emergencyResultsEl) emergencyResultsEl.innerHTML = '<div class="error-message"><h4>Error</h4><p>Please enter valid monthly expenses.</p></div>';
      return;
    }

    const targetAmount = monthlyExpenses * targetMonths;
    const remainingAmount = Math.max(0, targetAmount - currentFund);
    const progressPercent = Math.min(100, (currentFund / targetAmount) * 100);

    let monthsToGoal = 0;
    if (remainingAmount > 0 && monthlyContribution > 0) {
      monthsToGoal = Math.ceil(remainingAmount / monthlyContribution);
    }

    // Save emergency fund data to FinancialDataStore
    FinancialDataStore.emergencyFund = {
      targetAmount: targetAmount,
      currentFund: currentFund,
      monthlyExpenses: monthlyExpenses,
      targetMonths: targetMonths,
      monthlyContribution: monthlyContribution,
      remainingAmount: remainingAmount,
      progressPercent: progressPercent,
      monthsToGoal: monthsToGoal,
      lastUpdated: new Date().toISOString()
    };

    // Save to localStorage and dashboard
    saveFinancialData();
    saveToLocalStorage('emergencyFund', currentFund);
    saveToLocalStorage('monthlyExpenses', monthlyExpenses);

    displayEmergencyResults(targetAmount, currentFund, remainingAmount, progressPercent, monthsToGoal, monthlyContribution);
    updateDashboard();
  }

  /**
   * Displays emergency fund results
   */
  function displayEmergencyResults(targetAmount, currentFund, remainingAmount, progressPercent, monthsToGoal, monthlyContribution) {
    const html = `
      <div class="emergency-progress">
        <h3>Emergency Fund Progress</h3>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercent}%">
            <span class="progress-text">${progressPercent.toFixed(1)}%</span>
          </div>
        </div>
        <div class="overview-grid">
          <div class="overview-item">
            <span class="label">Target Amount</span>
            <span class="value">${toCurrency(targetAmount)}</span>
          </div>
          <div class="overview-item">
            <span class="label">Current Amount</span>
            <span class="value">${toCurrency(currentFund)}</span>
          </div>
          <div class="overview-item">
            <span class="label">Remaining Needed</span>
            <span class="value">${toCurrency(remainingAmount)}</span>
          </div>
          <div class="overview-item">
            <span class="label">Time to Goal</span>
            <span class="value">${monthsToGoal > 0 ? `${Math.floor(monthsToGoal / 12)} years, ${monthsToGoal % 12} months` : 'Goal reached!'}</span>
          </div>
        </div>
      </div>

      <div class="emergency-tips">
        <h4>Emergency Fund Tips:</h4>
        <ul>
          <li>Keep emergency funds in a high-yield savings account</li>
          <li>Only use for true emergencies (job loss, medical bills, major repairs)</li>
          <li>Replenish immediately after using</li>
          <li>Consider increasing to 9-12 months if you're self-employed</li>
        </ul>
      </div>
    `;

  if (emergencyResultsEl) emergencyResultsEl.innerHTML = html;
  }

  /**
   * Resets emergency fund form
   */
  function onEmergencyReset() {
    emergencyForm.reset();
  if (emergencyResultsEl) emergencyResultsEl.innerHTML = '';
  }

  // ============================================================================
  // GOALS TRACKING FUNCTIONS
  // ============================================================================

  /**
   * Handles goals form submission
   * @param {Event} event - Form submit event
   */
  function onGoalsSubmit(event) {
    event.preventDefault();

    const formData = new FormData(goalsForm);
    const goal = {
      id: Date.now(),
      name: formData.get('goalName'),
      targetAmount: sanitizeNumber(formData.get('goalAmount')),
      currentAmount: sanitizeNumber(formData.get('goalCurrent')) || 0,
      monthlyContribution: sanitizeNumber(formData.get('goalMonthly')) || 0,
      deadline: formData.get('goalDeadline') || null,
      priority: formData.get('goalPriority'),
      created: new Date().toISOString()
    };

    if (!goal.name || goal.targetAmount <= 0) {
      alert('Please enter a valid goal name and target amount.');
      return;
    }

    // Save goals data to FinancialDataStore
    const existingGoals = FinancialDataStore.goals || [];
    existingGoals.push(goal);
    FinancialDataStore.goals = existingGoals;

    // Save to localStorage and dashboard
    saveFinancialData();
    saveToLocalStorage('goals', existingGoals);

    goalsForm.reset();
    displayGoals();
    updateDashboard();
  }

  /**
   * Displays all goals
   */
  function displayGoals() {
    const goals = loadFromLocalStorage('goals', []);

    if (goals.length === 0) {
  if (goalsListEl) goalsListEl.innerHTML = '<div class="no-goals-message"><p>No goals set yet. Add your first financial goal above!</p></div>';
      return;
    }

    const html = goals.map(goal => {
      const progressPercent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
      const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

      let monthsToGoal = 0;
      if (remainingAmount > 0 && goal.monthlyContribution > 0) {
        monthsToGoal = Math.ceil(remainingAmount / goal.monthlyContribution);
      }

      const deadlineDate = goal.deadline ? new Date(goal.deadline) : null;
      const monthsUntilDeadline = deadlineDate ? Math.max(0, Math.ceil((deadlineDate - new Date()) / (1000 * 60 * 60 * 24 * 30))) : null;

      return `
        <div class="goal-item">
          <div class="goal-header">
            <h3 class="goal-name">${goal.name}</h3>
            <span class="goal-priority ${goal.priority}">${goal.priority}</span>
          </div>

          <div class="goal-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercent}%">
                <span class="progress-text">${progressPercent.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div class="goal-stats">
            <div class="goal-stat">
              <div class="goal-stat-label">Target</div>
              <div class="goal-stat-value">${toCurrency(goal.targetAmount)}</div>
            </div>
            <div class="goal-stat">
              <div class="goal-stat-label">Current</div>
              <div class="goal-stat-value">${toCurrency(goal.currentAmount)}</div>
            </div>
            <div class="goal-stat">
              <div class="goal-stat-label">Remaining</div>
              <div class="goal-stat-value">${toCurrency(remainingAmount)}</div>
            </div>
            <div class="goal-stat">
              <div class="goal-stat-label">Time to Goal</div>
              <div class="goal-stat-value">${monthsToGoal > 0 ? `${Math.floor(monthsToGoal / 12)}y ${monthsToGoal % 12}m` : 'Achieved!'}</div>
            </div>
            ${deadlineDate ? `
              <div class="goal-stat">
                <div class="goal-stat-label">Deadline</div>
                <div class="goal-stat-value">${deadlineDate.toLocaleDateString()}</div>
              </div>
            ` : ''}
          </div>

          <div class="goal-actions">
            <button class="goal-action-btn" onclick="editGoal(${goal.id})">Edit</button>
            <button class="goal-action-btn delete" onclick="deleteGoal(${goal.id})">Delete</button>
          </div>
        </div>
      `;
    }).join('');

  if (goalsListEl) goalsListEl.innerHTML = html;
  }

  /**
   * Deletes a goal
   * @param {number} goalId - Goal ID to delete
   */
  function deleteGoal(goalId) {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    const goals = loadFromLocalStorage('goals', []);
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    saveToLocalStorage('goals', updatedGoals);
    displayGoals();
    updateDashboard();
  }

  /**
   * Edits a goal (simplified version - could be enhanced with modal)
   * @param {number} goalId - Goal ID to edit
   */
  function editGoal(goalId) {
    const goals = loadFromLocalStorage('goals', []);
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newCurrent = prompt(`Update current amount for "${goal.name}":`, goal.currentAmount);
    if (newCurrent === null) return;

    const newAmount = sanitizeNumber(newCurrent);
    if (isNaN(newAmount) || newAmount < 0) {
      alert('Please enter a valid amount.');
      return;
    }

    goal.currentAmount = newAmount;
    saveToLocalStorage('goals', goals);
    displayGoals();
    updateDashboard();
  }

  // Make functions globally available for onclick handlers
  window.deleteGoal = deleteGoal;
  window.editGoal = editGoal;
  window.removeDebtInput = removeDebtInput;

  // ============================================================================
  // INVESTMENT FUNCTIONS
  // ============================================================================

  /**
   * Makes API call to Alpha Vantage with rate limiting
   * @param {string} symbol - Stock symbol to fetch
   * @param {string} functionType - API function type
   * @returns {Promise<Object>} API response data
   */
  async function fetchAlphaVantageData(symbol, functionType = 'GLOBAL_QUOTE') {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;

    if (timeSinceLastCall < ALPHA_VANTAGE_CONFIG.rateLimitDelay) {
      const waitTime = ALPHA_VANTAGE_CONFIG.rateLimitDelay - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    const url = `${ALPHA_VANTAGE_CONFIG.baseUrl}?function=${functionType}&symbol=${symbol}&apikey=${ALPHA_VANTAGE_CONFIG.apiKey}`;

    try {
      updateApiStatus('Fetching data for ' + symbol + '...');
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      lastApiCall = Date.now();

      if (data['Error Message']) {
        throw new Error('Invalid symbol: ' + symbol);
      }

      if (data['Note']) {
        throw new Error('API rate limit exceeded. Please wait and try again.');
      }

      updateApiStatus('Data received for ' + symbol);
      return data;

    } catch (error) {
      updateApiStatus('Error: ' + error.message, true);
      throw error;
    }
  }

  /**
   * Updates API status display
   * @param {string} message - Status message
   * @param {boolean} isError - Whether this is an error message
   */
  function updateApiStatus(message, isError = false) {
    if (apiStatusEl) {
      apiStatusEl.style.display = 'block';
      apiStatusEl.textContent = message;
      apiStatusEl.className = isError ? 'api-status error' : 'api-status';

      if (!isError) {
        setTimeout(() => {
          apiStatusEl.style.display = 'none';
        }, 3000);
      }
    }
  }

  /**
   * Gets stock recommendations based on user preferences
   * @param {string} riskTolerance - conservative, moderate, aggressive
   * @param {string} focusType - dividend, growth, balanced
   * @returns {Array} Array of recommended investments
   */
  function getInvestmentRecommendations(riskTolerance, focusType) {
    const recommendations = SAFE_INVESTMENTS[riskTolerance]?.[focusType] || [];
    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Processes investment form submission
   * @param {Event} event - Form submission event
   */
  async function onInvestmentSubmit(event) {
    event.preventDefault();

    const formData = new FormData(investmentForm);
    const investmentAmount = sanitizeNumber(formData.get('investmentAmount'));
    const riskTolerance = formData.get('riskTolerance');
    const investmentTimeframe = formData.get('investmentTimeframe');
    const focusType = formData.get('focusType');

    if (investmentAmount <= 0) {
      displayInvestmentError('Please enter a valid investment amount.');
      return;
    }

    // Save investment data to FinancialDataStore
    FinancialDataStore.investments = {
      amount: investmentAmount,
      riskTolerance: riskTolerance,
      timeframe: investmentTimeframe,
      focusType: focusType,
      lastUpdated: new Date().toISOString()
    };

    // Save to localStorage
    saveFinancialData();

    try {
      displayInvestmentResults(investmentAmount, riskTolerance, investmentTimeframe, focusType);
    } catch (error) {
      displayInvestmentError('An error occurred while generating recommendations: ' + error.message);
    }
  }

  /**
   * Displays investment recommendations and analysis
   * @param {number} amount - Monthly investment amount
   * @param {string} risk - Risk tolerance
   * @param {string} timeframe - Investment timeframe
   * @param {string} focus - Investment focus type
   */
  async function displayInvestmentResults(amount, risk, timeframe, focus) {
  if (investmentResultsEl) investmentResultsEl.innerHTML = '<div class="loading">Generating recommendations...</div>';

    const recommendations = getInvestmentRecommendations(risk, focus);

    if (recommendations.length === 0) {
      displayInvestmentError('No recommendations found for your criteria.');
      return;
    }

    let resultsHTML = `
      <div class="investment-summary">
        <h3>Investment Recommendations</h3>
        <div class="investment-params">
          <p><strong>Monthly Investment:</strong> ${toCurrency(amount)}</p>
          <p><strong>Annual Investment:</strong> ${toCurrency(amount * 12)}</p>
          <p><strong>Risk Level:</strong> ${risk.charAt(0).toUpperCase() + risk.slice(1)}</p>
          <p><strong>Focus:</strong> ${focus.charAt(0).toUpperCase() + focus.slice(1)}</p>
          <p><strong>Timeframe:</strong> ${timeframe === 'short' ? '1-3 years' : timeframe === 'medium' ? '3-10 years' : '10+ years'}</p>
        </div>
      </div>

      <div class="recommendations-grid">
    `;

    // Get real-time data for first 3 recommendations (to respect API limits)
    for (let i = 0; i < Math.min(recommendations.length, 3); i++) {
      const investment = recommendations[i];
      let priceData = null;

      try {
        if (ALPHA_VANTAGE_CONFIG.apiKey !== 'demo') {
          const data = await fetchAlphaVantageData(investment.symbol);
          priceData = data['Global Quote'];
        }
      } catch (error) {
        console.log('Could not fetch real-time data for', investment.symbol, ':', error.message);
      }

      const currentPrice = priceData ? parseFloat(priceData['05. price']) : null;
      const priceChange = priceData ? parseFloat(priceData['09. change']) : null;
      const changePercent = priceData ? parseFloat(priceData['10. change percent'].replace('%', '')) : null;

      resultsHTML += `
        <div class="recommendation-card">
          <div class="rec-header">
            <h4>${investment.symbol}</h4>
            <span class="rec-type">${investment.type.toUpperCase()}</span>
          </div>
          <p class="rec-name">${investment.name}</p>
          <p class="rec-sector">${investment.sector}</p>
          ${currentPrice ? `
            <div class="price-info">
              <span class="current-price">${toCurrency(currentPrice)}</span>
              <span class="price-change ${changePercent >= 0 ? 'positive' : 'negative'}">
                ${priceChange >= 0 ? '+' : ''}${toCurrency(priceChange)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)
              </span>
            </div>
          ` : `
            <div class="price-info">
              <span class="price-note">Real-time data unavailable</span>
            </div>
          `}
          <div class="allocation-suggestion">
            <p>Suggested allocation: ${Math.round(100 / recommendations.length)}% (${toCurrency(amount * (1 / recommendations.length))} monthly)</p>
          </div>
        </div>
      `;
    }

    // Add remaining recommendations without real-time data
    for (let i = 3; i < recommendations.length; i++) {
      const investment = recommendations[i];
      resultsHTML += `
        <div class="recommendation-card">
          <div class="rec-header">
            <h4>${investment.symbol}</h4>
            <span class="rec-type">${investment.type.toUpperCase()}</span>
          </div>
          <p class="rec-name">${investment.name}</p>
          <p class="rec-sector">${investment.sector}</p>
          <div class="price-info">
            <span class="price-note">Real-time data unavailable</span>
          </div>
          <div class="allocation-suggestion">
            <p>Suggested allocation: ${Math.round(100 / recommendations.length)}% (${toCurrency(amount * (1 / recommendations.length))} monthly)</p>
          </div>
        </div>
      `;
    }

    resultsHTML += `
      </div>

      <div class="investment-tips">
        <h4>Important Notes:</h4>
        <ul>
          <li>Diversification is key - consider spreading investments across multiple assets</li>
          <li>This is for educational purposes only - consult a financial advisor for personalized advice</li>
          <li>Past performance does not guarantee future results</li>
          <li>Consider your emergency fund and debt payments before investing</li>
          ${ALPHA_VANTAGE_CONFIG.apiKey === 'demo' ? '<li>⚠️ Using demo data - get a free API key from Alpha Vantage for real-time prices</li>' : ''}
        </ul>
      </div>
    `;

  if (investmentResultsEl) investmentResultsEl.innerHTML = resultsHTML;
  }

  /**
   * Displays investment error message
   * @param {string} message - Error message to display
   */
  function displayInvestmentError(message) {
  if (investmentResultsEl) investmentResultsEl.innerHTML = `
      <div class="error-message">
        <h4>Error</h4>
        <p>${message}</p>
      </div>
    `;
  }

  /**
   * Resets the investment form and results
   */
  function onInvestmentReset() {
    investmentForm.reset();
    investmentResultsEl.textContent = '';
    if (apiStatusEl) {
      apiStatusEl.style.display = 'none';
    }
  }

  /**
   * Switches between application tabs (Income Calculator / Budget Planner / Safe Investments)
   * @param {string} tabName - Name of the tab to switch to
   */
  function switchTab(tabName) {
    // Update tab button states
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      }
    });

    // Update tab content visibility
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
      content.classList.remove('active');
      if (content.id === `${tabName}-tab`) {
        content.classList.add('active');
      }
    });

    // Refresh data when switching to specific tabs
    if (tabName === 'budget') {
      const savedIncome = loadFromLocalStorage('monthlyIncome', 0);
      if (savedIncome > 0) {
        syncFromIncome(savedIncome);
      }
      updateAllExpenseVisuals();
    } else if (tabName === 'dashboard') {
      updateDashboard();
    }
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  // Initialize form visibility and event listeners
  updateVisibility();
  
  // Income calculator event listeners
  form.addEventListener('submit', onSubmit);
  payFrequencySelect.addEventListener('change', updateVisibility);
  resetBtn.addEventListener('click', onReset);

  // Budget planner event listeners
  budgetForm.addEventListener('submit', onBudgetSubmit);
  budgetResetBtn.addEventListener('click', onBudgetReset);

  // Investment form event listeners
  investmentForm.addEventListener('submit', onInvestmentSubmit);
  investmentResetBtn.addEventListener('click', onInvestmentReset);

  // Debt form event listeners
  debtForm.addEventListener('submit', onDebtSubmit);
  debtResetBtn.addEventListener('click', onDebtReset);
  addDebtBtn.addEventListener('click', addDebtInput);

  // Emergency fund event listeners
  emergencyForm.addEventListener('submit', onEmergencySubmit);
  emergencyResetBtn.addEventListener('click', onEmergencyReset);

  // Goals form event listeners
  goalsForm.addEventListener('submit', onGoalsSubmit);

  expenseFieldConfig.forEach(config => {
    if (config.amountEl) {
      config.amountEl.addEventListener('input', updateAllExpenseVisuals);
    }
  });

  // Initialize budget form with saved income
  const savedIncome = loadFromLocalStorage('monthlyIncome', 0);
  if (savedIncome > 0) {
    syncFromIncome(savedIncome);
  }

  /**
   * Synchronizes budget inputs/display from a given monthly income value.
   * This helper was referenced in several places but not defined, causing a
   * ReferenceError when switching tabs or during initialization if saved income exists.
   * @param {number} monthlyIncome
   */
  function syncFromIncome(monthlyIncome) {
    try {
      const normalized = Number(monthlyIncome) || 0;
      const monthlyIncomeInputEl = document.getElementById('monthly-income');
      const monthlyIncomeDisplayEl = document.getElementById('monthly-income-display');

      if (monthlyIncomeInputEl) {
        monthlyIncomeInputEl.value = normalized.toFixed(2);
      }
      if (monthlyIncomeDisplayEl) {
        monthlyIncomeDisplayEl.textContent = toCurrency(normalized);
      }

      // Ensure expense visuals reflect the newly synced income
      updateAllExpenseVisuals();
    } catch (err) {
      console.error('syncFromIncome error:', err);
    }
  }

  updateAllExpenseVisuals();

  // Initialize dashboard and goals display
  updateDashboard();
  displayGoals();

  // Tab navigation event listeners - use fresh selectors to ensure elements are found
  const tabButtons = document.querySelectorAll('.tab-btn');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = btn.dataset.tab;
      if (tabName) {
        switchTab(tabName);
      }
    });
  });
})();

/* ============================================================================
   BASIC TAB NAVIGATION - WORKING VERSION
   ============================================================================ */

// Basic tab switching function
function switchTab(tabName) {
  // Hide all tab content
  document.querySelectorAll('.tab-content').forEach(function(tab) {
    tab.classList.remove('active');
  });

  // Remove active styling from all buttons
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.classList.remove('bg-primary', 'text-primary-foreground');
    btn.classList.add('hover:bg-accent', 'hover:text-accent-foreground', 'text-muted-foreground');
  });

  // Show target tab
  const targetTab = document.getElementById(tabName + '-tab');
  if (targetTab) {
    targetTab.classList.add('active');
  }

  // Activate target button
  const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (targetBtn) {
    targetBtn.classList.remove('hover:bg-accent', 'hover:text-accent-foreground', 'text-muted-foreground');
    targetBtn.classList.add('bg-primary', 'text-primary-foreground');
  }

  // Handle tab-specific actions
  if (tabName === 'budget') {
    // Sync budget form with saved income
    try {
      const savedIncome = JSON.parse(localStorage.getItem('monthlyIncome') || '0');
      if (savedIncome > 0) {
        const monthlyIncomeInput = document.getElementById('monthly-income');
        const monthlyIncomeDisplay = document.getElementById('monthly-income-display');

        if (monthlyIncomeInput) {
          monthlyIncomeInput.value = savedIncome.toFixed(2);
        }
        if (monthlyIncomeDisplay) {
          monthlyIncomeDisplay.textContent = '$' + savedIncome.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });
        }
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
    }
  }
}

// Make it globally available
window.switchTab = switchTab;

// Setup tab navigation when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize theme
  initializeTheme();

  // Load saved financial data
  loadFinancialData();

  // Theme toggle event listener
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const tabName = this.getAttribute('data-tab');
      if (tabName) {
        switchTab(tabName);
      }
    });
  });
});
