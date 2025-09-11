(function() {
  const form = document.getElementById('income-form');
  const payAmountInput = document.getElementById('pay-amount');
  const payFrequencySelect = document.getElementById('pay-frequency');
  const hoursPerDayInput = document.getElementById('hours-per-day');
  const daysPerWeekInput = document.getElementById('days-per-week');
  const weeksPerYearInput = document.getElementById('weeks-per-year');
  const resultsEl = document.getElementById('results');
  const budgetEl = document.getElementById('budget-breakdown');
  const resetBtn = document.getElementById('reset-btn');

  const defaultAssumptions = {
    hoursPerDay: 8,
    daysPerWeek: 5,
    weeksPerYear: 52
  };

  const budgetRules = [
    { key: 'needs', label: 'Needs (Housing, Utilities, Groceries, Insurance)', percent: 50 },
    { key: 'wants', label: 'Wants (Dining, Entertainment, Shopping, Travel)', percent: 30 },
    { key: 'savings', label: 'Savings & Investments', percent: 15 },
    { key: 'debt', label: 'Debt Payments (beyond minimums)', percent: 5 },
  ];

  function toCurrency(value) {
    if (!isFinite(value)) return '-';
    return value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }

  function sanitizeNumber(input) {
    const num = typeof input === 'number' ? input : parseFloat(String(input).replace(/,/g, ''));
    return isFinite(num) ? num : 0;
  }

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

  function renderResults(annualIncome) {
    const monthlyIncome = annualIncome / 12;
    const weeklyIncome = annualIncome / 52;
    const dailyIncome = weeklyIncome / 5; // approx working day
    const content = `
      <p><strong>Annual income:</strong> <span class="number">${toCurrency(annualIncome)}</span></p>
      <p><strong>Monthly income:</strong> ${toCurrency(monthlyIncome)} · <strong>Weekly:</strong> ${toCurrency(weeklyIncome)} · <strong>Daily (workday est.):</strong> ${toCurrency(dailyIncome)}</p>
    `;
    resultsEl.innerHTML = content;

    renderBudget(monthlyIncome);
  }

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
    budgetEl.innerHTML = items;
  }

  function updateVisibility() {
    const frequency = payFrequencySelect.value;
    const showHour = frequency === 'hour';
    const showDay = frequency === 'hour' || frequency === 'day';
    const showWeek = frequency === 'hour' || frequency === 'day' || frequency === 'week';

    document.getElementById('hours-per-day-field').style.display = showHour ? '' : 'none';
    document.getElementById('days-per-week-field').style.display = showDay ? '' : 'none';
    document.getElementById('weeks-per-year-field').style.display = showWeek ? '' : 'none';
  }

  function onSubmit(event) {
    event.preventDefault();
    const payAmount = sanitizeNumber(payAmountInput.value);
    const frequency = payFrequencySelect.value;
    const hpd = sanitizeNumber(hoursPerDayInput.value) || undefined;
    const dpw = sanitizeNumber(daysPerWeekInput.value) || undefined;
    const wpy = sanitizeNumber(weeksPerYearInput.value) || undefined;

    if (payAmount <= 0) {
      resultsEl.textContent = 'Enter a valid pay amount.';
      budgetEl.innerHTML = '';
      return;
    }

    const annual = calculateAnnualIncome(payAmount, frequency, hpd, dpw, wpy);
    renderResults(annual);
  }

  function onReset() {
    form.reset();
    resultsEl.textContent = '';
    budgetEl.innerHTML = '';
    updateVisibility();
  }

  // init
  updateVisibility();
  form.addEventListener('submit', onSubmit);
  payFrequencySelect.addEventListener('change', updateVisibility);
  resetBtn.addEventListener('click', onReset);
})();


