/**
 * Performance Optimization Module
 * Handles performance improvements, lazy loading, and optimization techniques
 */

class PerformanceOptimizer {
  constructor() {
    this.observers = new Map();
    this.debounceTimers = new Map();
    this.throttleTimers = new Map();
    this.memoCache = new Map();
    this.lazyElements = new WeakSet();
  }

  /**
   * Initialize performance optimizations
   */
  init() {
    this.setupIntersectionObserver();
    this.setupLazyLoading();
    this.optimizeScrolling();
    this.setupMemoryManagement();
  }

  /**
   * Debounce function calls to prevent excessive execution
   */
  debounce(func, delay, key = 'default') {
    return (...args) => {
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        func.apply(this, args);
        this.debounceTimers.delete(key);
      }, delay);

      this.debounceTimers.set(key, timer);
    };
  }

  /**
   * Throttle function calls to limit execution frequency
   */
  throttle(func, limit, key = 'default') {
    return (...args) => {
      const existingTimer = this.throttleTimers.get(key);
      if (!existingTimer) {
        func.apply(this, args);

        const timer = setTimeout(() => {
          this.throttleTimers.delete(key);
        }, limit);

        this.throttleTimers.set(key, timer);
      }
    };
  }

  /**
   * Memoization for expensive calculations
   */
  memoize(func, keyGenerator) {
    return (...args) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

      if (this.memoCache.has(key)) {
        return this.memoCache.get(key);
      }

      const result = func.apply(this, args);
      this.memoCache.set(key, result);

      // Prevent memory leaks by limiting cache size
      if (this.memoCache.size > 1000) {
        const firstKey = this.memoCache.keys().next().value;
        this.memoCache.delete(firstKey);
      }

      return result;
    };
  }

  /**
   * Clear memoization cache
   */
  clearMemoCache(pattern) {
    if (pattern) {
      for (const [key] of this.memoCache) {
        if (key.includes(pattern)) {
          this.memoCache.delete(key);
        }
      }
    } else {
      this.memoCache.clear();
    }
  }

  /**
   * Setup intersection observer for lazy loading
   */
  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.handleIntersection(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.1
      });

      this.observers.set('intersection', observer);
    }
  }

  /**
   * Handle element intersection (lazy loading trigger)
   */
  handleIntersection(element) {
    // Lazy load images
    if (element.tagName === 'IMG' && element.dataset.src) {
      element.src = element.dataset.src;
      element.removeAttribute('data-src');
    }

    // Lazy load content
    if (element.dataset.lazyContent) {
      this.loadLazyContent(element);
    }

    // Trigger custom lazy load events
    element.dispatchEvent(new CustomEvent('lazyload'));
  }

  /**
   * Setup lazy loading for expensive UI components
   */
  setupLazyLoading() {
    // Lazy load chart components
    document.querySelectorAll('[data-lazy-chart]').forEach(element => {
      this.makeLazyLoadable(element);
    });

    // Lazy load complex calculations
    document.querySelectorAll('[data-lazy-calculate]').forEach(element => {
      this.makeLazyLoadable(element);
    });
  }

  /**
   * Make an element lazy loadable
   */
  makeLazyLoadable(element) {
    if (this.lazyElements.has(element)) return;

    this.lazyElements.add(element);

    const observer = this.observers.get('intersection');
    if (observer) {
      observer.observe(element);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.handleIntersection(element);
    }
  }

  /**
   * Load lazy content
   */
  async loadLazyContent(element) {
    const contentType = element.dataset.lazyContent;

    try {
      switch (contentType) {
        case 'chart':
          await this.loadChartContent(element);
          break;
        case 'calculation':
          await this.loadCalculationContent(element);
          break;
        case 'dashboard':
          await this.loadDashboardContent(element);
          break;
        default:
          console.warn(`Unknown lazy content type: ${contentType}`);
      }
    } catch (error) {
      console.error('Failed to load lazy content:', error);
      element.innerHTML = '<p class="error">Failed to load content</p>';
    }
  }

  /**
   * Optimize scroll performance
   */
  optimizeScrolling() {
    let ticking = false;

    const updateScrollPosition = () => {
      // Perform scroll-related updates here
      this.updateScrollIndicators();
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollPosition);
        ticking = true;
      }
    };

    document.addEventListener('scroll', onScroll, { passive: true });
  }

  /**
   * Update scroll indicators
   */
  updateScrollIndicators() {
    const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

    const indicators = document.querySelectorAll('[data-scroll-indicator]');
    indicators.forEach(indicator => {
      indicator.style.width = `${scrollPercent}%`;
    });
  }

  /**
   * Setup memory management
   */
  setupMemoryManagement() {
    // Clean up event listeners and observers when page is about to unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Periodic cleanup
    setInterval(() => {
      this.performPeriodicCleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Perform periodic cleanup
   */
  performPeriodicCleanup() {
    // Clear old memoization cache entries
    if (this.memoCache.size > 500) {
      const entries = Array.from(this.memoCache.entries());
      const toDelete = entries.slice(0, Math.floor(entries.length / 2));
      toDelete.forEach(([key]) => this.memoCache.delete(key));
    }

    // Clear old timers
    this.debounceTimers.clear();
    this.throttleTimers.clear();
  }

  /**
   * Clean up resources
   */
  cleanup() {
    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.throttleTimers.clear();

    // Disconnect observers
    this.observers.forEach(observer => {
      if (observer.disconnect) {
        observer.disconnect();
      }
    });
    this.observers.clear();

    // Clear memoization cache
    this.memoCache.clear();
  }

  /**
   * Optimize form performance
   */
  optimizeForm(formElement) {
    // Debounce form validation
    const inputs = formElement.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      const debouncedValidation = this.debounce((event) => {
        if (window.validator) {
          // Perform validation
          const fieldName = event.target.name || event.target.id;
          const rules = event.target.getAttribute('data-validation');

          if (rules) {
            try {
              const parsedRules = JSON.parse(rules);
              const result = window.validator.validateField(event.target.value, parsedRules, fieldName);

              // Update UI based on validation result
              this.updateFieldValidation(event.target, result);
            } catch (error) {
              console.warn('Validation optimization failed:', error);
            }
          }
        }
      }, 300, `validation-${input.name || input.id}`);

      input.addEventListener('input', debouncedValidation);
    });
  }

  /**
   * Update field validation UI
   */
  updateFieldValidation(field, result) {
    // Remove existing error
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }

    field.classList.remove('error', 'valid');

    if (!result.isValid) {
      field.classList.add('error');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      errorDiv.textContent = result.errors[0];
      field.parentNode.insertBefore(errorDiv, field.nextSibling);
    } else {
      field.classList.add('valid');
    }
  }

  /**
   * Optimize dashboard updates
   */
  optimizeDashboard() {
    const debouncedUpdate = this.debounce(() => {
      if (window.updateDashboard) {
        window.updateDashboard();
      }
    }, 500, 'dashboard-update');

    // Listen for data changes and trigger debounced dashboard update
    document.addEventListener('dataChanged', debouncedUpdate);
  }

  /**
   * Bundle multiple DOM operations
   */
  batchDOMOperations(operations) {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        operations.forEach(op => op());
        resolve();
      });
    });
  }

  /**
   * Measure performance
   */
  measurePerformance(name, func) {
    return async (...args) => {
      const startTime = performance.now();

      try {
        const result = await func.apply(this, args);
        const endTime = performance.now();

        console.log(`Performance: ${name} took ${endTime - startTime}ms`);
        return result;
      } catch (error) {
        const endTime = performance.now();
        console.error(`Performance: ${name} failed after ${endTime - startTime}ms`, error);
        throw error;
      }
    };
  }

  /**
   * Optimize large list rendering
   */
  createVirtualList(container, items, itemHeight, renderItem) {
    const viewportHeight = container.clientHeight;
    const visibleItems = Math.ceil(viewportHeight / itemHeight) + 2; // Buffer

    let startIndex = 0;

    const render = () => {
      const endIndex = Math.min(startIndex + visibleItems, items.length);
      const visibleItemsData = items.slice(startIndex, endIndex);

      container.innerHTML = '';

      visibleItemsData.forEach((item, index) => {
        const element = renderItem(item, startIndex + index);
        element.style.position = 'absolute';
        element.style.top = `${(startIndex + index) * itemHeight}px`;
        element.style.height = `${itemHeight}px`;
        container.appendChild(element);
      });

      container.style.height = `${items.length * itemHeight}px`;
    };

    const onScroll = this.throttle(() => {
      const newStartIndex = Math.floor(container.scrollTop / itemHeight);
      if (newStartIndex !== startIndex) {
        startIndex = newStartIndex;
        render();
      }
    }, 16); // ~60fps

    container.addEventListener('scroll', onScroll);
    render();

    return {
      update: (newItems) => {
        items = newItems;
        render();
      },
      destroy: () => {
        container.removeEventListener('scroll', onScroll);
      }
    };
  }
}

// Create singleton instance
window.performance = new PerformanceOptimizer();

// Export utility functions
window.debounce = (...args) => window.performance.debounce(...args);
window.throttle = (...args) => window.performance.throttle(...args);
window.memoize = (...args) => window.performance.memoize(...args);
window.batchDOM = (...args) => window.performance.batchDOMOperations(...args);
window.measurePerf = (...args) => window.performance.measurePerformance(...args);