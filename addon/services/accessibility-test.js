import axeCore from 'axe-core';
import Service from '@ember/service';
import { A } from '@ember/array';
import config from 'ember-get-config';

export default Service.extend({
  init() {
    this._super(...arguments);
    this.violations = A();
  },

  async auditWithAxe(element) {
    let { axe = {} } = config['ember-accessibility'];
    // axe-core will only return the full details of the violations
    // array and will only return one instance of each of the inapplicable,
    // incomplete and pass arrays for each rule that has at least one of
    // those entries. This will reduce the amount of computation that axe-core
    // does for the unique selectors.
    let options = Object.assign({
      'resultTypes': ['violations']
    }, axe);

    let violations = [];
    let axeResults;

    try {
      axeResults = await axeCore.run(element, options);
    } catch({ message }) {
      // eslint-disable-next-line no-console
      console.warn(`[ember-accessibility] ${message}`);
      return violations;
    }

    if (axeResults.violations.length) {
      axeResults.violations.forEach((axeViolation) => {
        if (axeViolation.nodes.length === 1) {
          violations.push(axeViolation);
        } else {
          axeViolation.nodes.forEach((node, index) => {
            let currentElem = { index };
            Object.assign(currentElem, axeViolation);
            violations.push(currentElem);
          });
        }
      });
    }

    return violations;
  },

  async getViolations(element = document.querySelector('body')) {
    let violations = await this.auditWithAxe(element);
    if (this.isEnabled) {
      violations = A([...this.violations, ...violations]);
    }

    this.set('violations', violations);
  }
});
