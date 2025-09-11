/* eslint-disable no-console */
(function () {
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
  const perWeekAfterEl = document.getElementById('per-week-after');
  const perYearAfterEl = document.getElementById('per-year-after');
  const stateLabelEl = document.getElementById('state-label');
  const stateTaxRateEl = document.getElementById('state-tax-rate');

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

  function renderResults({ weeklyGross, yearlyGross, state, rate, weeklyAfter, yearlyAfter }) {
    perWeekEl.textContent = formatCurrency(weeklyGross);
    perYearEl.textContent = formatCurrency(yearlyGross);
    stateLabelEl.textContent = state || '—';
    stateTaxRateEl.textContent = typeof rate === 'number' ? `${(rate * 100).toFixed(1)}%` : '—';
    perWeekAfterEl.textContent = formatCurrency(weeklyAfter);
    perYearAfterEl.textContent = formatCurrency(yearlyAfter);
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
    const rate = getApproxStateRate(state);

    let yearlyAfter = yearly;
    if (typeof rate === 'number') {
      yearlyAfter = Math.max(0, yearly - yearly * rate);
    }
    const weeks = weeksPerYear.value ? toNumber(weeksPerYear.value) : 52;
    const weeklyAfter = yearlyAfter / (weeks || 52);

    renderResults({
      weeklyGross: weekly,
      yearlyGross: yearly,
      state: state || (zipInput && zipInput.value ? 'Unknown' : '—'),
      rate: typeof rate === 'number' ? rate : null,
      weeklyAfter,
      yearlyAfter
    });
  });

  document.getElementById('reset-btn').addEventListener('click', function () {
    error.textContent = '';
    resultsSection.hidden = true;
  });
})();


