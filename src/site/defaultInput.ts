import type { PaycheckInput } from '../calculator/types.ts';
import { CURRENT_YEAR } from './states.ts';

export function defaultInput(state: string, taxYear = CURRENT_YEAR): PaycheckInput {
  return {
    taxYear,
    payDate: `${taxYear}-09-22`,
    compensation: { type: 'salary', annualSalary: 100000 },
    payFrequency: 'biweekly',
    federal: { filingStatus: 'single', multipleJobs: false, dependentCredits: 0, otherIncome: 0, deductions: 0, extraWithholding: 0, exempt: false },
    location: { state },
    deductions: [],
    stateOptions: {},
  };
}
