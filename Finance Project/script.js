/* eslint-disable no-console */
(function () {
  const form = document.getElementById('income-form');
  const period = document.getElementById('pay-period');
  const payRate = document.getElementById('pay-rate');
  const hoursPerWeek = document.getElementById('hours-per-week');
  const weeksPerYear = document.getElementById('weeks-per-year');
  const bonus = document.getElementById('bonus');
  const error = document.getElementById('error');

  const resultsSection = document.getElementById('results');
  const perYearEl = document.getElementById('per-year');

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
    return '';
  }

  function calculateYearlyIncome() {
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
    return yearly;
  }

  function renderResults(amount) {
    perYearEl.textContent = formatCurrency(amount);
    resultsSection.hidden = false;
  }

  form.addEventListener('submit', function (evt) {
    evt.preventDefault();
    const message = validateInputs();
    if (message) {
      error.textContent = message;
      resultsSection.hidden = true;
      return;
    }
    const amount = calculateYearlyIncome();
    renderResults(amount);
  });

  document.getElementById('reset-btn').addEventListener('click', function () {
    error.textContent = '';
    resultsSection.hidden = true;
  });
})();


