/**
 * Validation Utilities Module
 * Provides comprehensive form validation and error handling
 */

class ValidationUtils {
  constructor() {
    this.rules = new Map();
    this.errorMessages = new Map();
    this.setupDefaultRules();
  }

  /**
   * Setup default validation rules
   */
  setupDefaultRules() {
    // Numeric validations
    this.addRule('required', (value) => value !== null && value !== undefined && value !== '');
    this.addRule('number', (value) => !isNaN(parseFloat(value)) && isFinite(value));
    this.addRule('positive', (value) => parseFloat(value) > 0);
    this.addRule('nonNegative', (value) => parseFloat(value) >= 0);
    this.addRule('integer', (value) => Number.isInteger(parseFloat(value)));

    // String validations
    this.addRule('minLength', (value, min) => value && value.length >= min);
    this.addRule('maxLength', (value, max) => !value || value.length <= max);
    this.addRule('email', (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
    this.addRule('zipcode', (value) => /^\d{5}(-\d{4})?$/.test(value));

    // Range validations
    this.addRule('min', (value, min) => parseFloat(value) >= min);
    this.addRule('max', (value, max) => parseFloat(value) <= max);
    this.addRule('range', (value, min, max) => {
      const num = parseFloat(value);
      return num >= min && num <= max;
    });

    // Date validations
    this.addRule('date', (value) => !isNaN(Date.parse(value)));
    this.addRule('futureDate', (value) => new Date(value) > new Date());
    this.addRule('pastDate', (value) => new Date(value) < new Date());

    // Financial specific validations
    this.addRule('percentage', (value) => {
      const num = parseFloat(value);
      return num >= 0 && num <= 100;
    });
    this.addRule('currency', (value) => /^\d+(\.\d{1,2})?$/.test(value));

    // Default error messages
    this.errorMessages.set('required', 'This field is required.');
    this.errorMessages.set('number', 'Please enter a valid number.');
    this.errorMessages.set('positive', 'Value must be greater than zero.');
    this.errorMessages.set('nonNegative', 'Value must be zero or greater.');
    this.errorMessages.set('integer', 'Please enter a whole number.');
    this.errorMessages.set('minLength', 'Must be at least {0} characters long.');
    this.errorMessages.set('maxLength', 'Must be no more than {0} characters long.');
    this.errorMessages.set('email', 'Please enter a valid email address.');
    this.errorMessages.set('zipcode', 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789).');
    this.errorMessages.set('min', 'Value must be at least {0}.');
    this.errorMessages.set('max', 'Value must be no more than {0}.');
    this.errorMessages.set('range', 'Value must be between {0} and {1}.');
    this.errorMessages.set('date', 'Please enter a valid date.');
    this.errorMessages.set('futureDate', 'Date must be in the future.');
    this.errorMessages.set('pastDate', 'Date must be in the past.');
    this.errorMessages.set('percentage', 'Value must be between 0 and 100.');
    this.errorMessages.set('currency', 'Please enter a valid currency amount.');
  }

  /**
   * Add a custom validation rule
   */
  addRule(name, validator, errorMessage) {
    this.rules.set(name, validator);
    if (errorMessage) {
      this.errorMessages.set(name, errorMessage);
    }
  }

  /**
   * Validate a single field
   */
  validateField(value, rules, fieldName = 'Field') {
    const errors = [];

    for (const rule of rules) {
      let ruleName, ruleParams = [];

      if (typeof rule === 'string') {
        ruleName = rule;
      } else if (Array.isArray(rule)) {
        [ruleName, ...ruleParams] = rule;
      } else if (typeof rule === 'object') {
        ruleName = rule.name;
        ruleParams = rule.params || [];
      }

      const validator = this.rules.get(ruleName);
      if (!validator) {
        console.warn(`Unknown validation rule: ${ruleName}`);
        continue;
      }

      try {
        const isValid = validator(value, ...ruleParams);
        if (!isValid) {
          let errorMessage = this.errorMessages.get(ruleName) || `${fieldName} is invalid.`;

          // Replace placeholders in error message
          ruleParams.forEach((param, index) => {
            errorMessage = errorMessage.replace(`{${index}}`, param);
          });

          errors.push(errorMessage);
        }
      } catch (error) {
        console.error(`Validation error for rule ${ruleName}:`, error);
        errors.push(`Validation failed for ${fieldName}.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate multiple fields
   */
  validateFields(fields) {
    const results = {};
    let isFormValid = true;

    for (const [fieldName, { value, rules }] of Object.entries(fields)) {
      const result = this.validateField(value, rules, fieldName);
      results[fieldName] = result;

      if (!result.isValid) {
        isFormValid = false;
      }
    }

    return {
      isValid: isFormValid,
      fields: results
    };
  }

  /**
   * Validate a form element
   */
  validateForm(formElement) {
    const fields = {};
    const formData = new FormData(formElement);

    // Collect validation rules from data attributes
    formElement.querySelectorAll('[data-validation]').forEach(input => {
      const fieldName = input.name || input.id;
      const rulesString = input.getAttribute('data-validation');
      const value = formData.get(fieldName);

      try {
        const rules = JSON.parse(rulesString);
        fields[fieldName] = { value, rules };
      } catch (error) {
        console.warn(`Invalid validation rules for field ${fieldName}:`, rulesString);
      }
    });

    return this.validateFields(fields);
  }

  /**
   * Display validation errors on form
   */
  displayErrors(formElement, validationResult) {
    // Clear previous errors
    formElement.querySelectorAll('.field-error').forEach(error => {
      error.remove();
    });

    formElement.querySelectorAll('.error').forEach(field => {
      field.classList.remove('error');
    });

    // Display new errors
    for (const [fieldName, result] of Object.entries(validationResult.fields)) {
      if (!result.isValid) {
        const field = formElement.querySelector(`[name="${fieldName}"], #${fieldName}`);

        if (field) {
          field.classList.add('error');

          const errorDiv = document.createElement('div');
          errorDiv.className = 'field-error';
          errorDiv.textContent = result.errors[0]; // Show first error

          // Insert error message after the field
          field.parentNode.insertBefore(errorDiv, field.nextSibling);
        }
      }
    }
  }

  /**
   * Setup real-time validation for a form
   */
  setupRealTimeValidation(formElement) {
    formElement.querySelectorAll('[data-validation]').forEach(input => {
      input.addEventListener('blur', () => {
        const fieldName = input.name || input.id;
        const rulesString = input.getAttribute('data-validation');

        try {
          const rules = JSON.parse(rulesString);
          const result = this.validateField(input.value, rules, fieldName);

          // Clear previous error for this field
          const existingError = input.parentNode.querySelector('.field-error');
          if (existingError) {
            existingError.remove();
          }
          input.classList.remove('error');

          // Show error if validation failed
          if (!result.isValid) {
            input.classList.add('error');

            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = result.errors[0];
            input.parentNode.insertBefore(errorDiv, input.nextSibling);
          }
        } catch (error) {
          console.warn(`Invalid validation rules for field ${fieldName}:`, rulesString);
        }
      });
    });
  }

  /**
   * Financial-specific validation presets
   */
  getFinancialValidationPresets() {
    return {
      income: ['required', 'number', 'positive'],
      expense: ['required', 'number', 'nonNegative'],
      zipcode: ['required', 'zipcode'],
      percentage: ['required', 'number', 'percentage'],
      currency: ['required', 'currency'],
      interestRate: ['required', 'number', ['range', 0, 50]],
      years: ['required', 'integer', ['range', 1, 100]],
      months: ['required', 'integer', ['range', 1, 1200]]
    };
  }

  /**
   * Sanitize and format numeric input
   */
  sanitizeNumber(value, decimals = 2) {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : Number(num.toFixed(decimals));
  }

  /**
   * Format currency for display
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
   * Validate and sanitize form data
   */
  processFormData(formElement, validationRules) {
    const formData = new FormData(formElement);
    const processedData = {};
    const errors = [];

    for (const [fieldName, rules] of Object.entries(validationRules)) {
      const value = formData.get(fieldName);
      const result = this.validateField(value, rules, fieldName);

      if (result.isValid) {
        // Sanitize and process the value based on its type
        if (rules.includes('number') || rules.includes('currency')) {
          processedData[fieldName] = this.sanitizeNumber(value);
        } else {
          processedData[fieldName] = value;
        }
      } else {
        errors.push(...result.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      data: processedData,
      errors
    };
  }
}

// Create singleton instance
window.validator = new ValidationUtils();

// Export utility functions
window.validateField = (...args) => window.validator.validateField(...args);
window.validateForm = (...args) => window.validator.validateForm(...args);
window.setupValidation = (form) => window.validator.setupRealTimeValidation(form);