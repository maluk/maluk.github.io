import { calculatePaycheck } from './index.ts';
import type { PayFrequency, PaycheckInput, PaycheckResult } from './types.ts';

export const periodsPerYear: Record<PayFrequency, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
};

export function comparePayFrequencies(input: PaycheckInput): Record<PayFrequency, PaycheckResult | undefined> {
  const originalCount = periodsPerYear[input.payFrequency];
  return Object.fromEntries((Object.keys(periodsPerYear) as PayFrequency[]).map(frequency => {
    const count = periodsPerYear[frequency];
    const compensation: PaycheckInput['compensation'] = input.compensation.type === 'salary'
      ? input.compensation
      : {
          ...input.compensation,
          regularHours: input.compensation.regularHours * originalCount / count,
          overtimeHours: (input.compensation.overtimeHours ?? 0) * originalCount / count,
        };
    try {
      return [frequency, calculatePaycheck({ ...input, payFrequency: frequency, compensation })];
    } catch (error) {
      if (frequency === input.payFrequency || !(error instanceof Error) || !['Deductions exceed gross pay', 'Withholding and deductions exceed gross pay'].includes(error.message)) throw error;
      return [frequency, undefined];
    }
  })) as Record<PayFrequency, PaycheckResult | undefined>;
}
