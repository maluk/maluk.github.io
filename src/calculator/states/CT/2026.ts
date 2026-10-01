import type { StateCalculator, StateInput, StateResult, TaxRuleMetadata } from '../../types.ts';
import { roundMoney } from '../../money.ts';

type Code = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
type Step = [threshold: number, base: number, rate: number];
const periods = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
const brackets: Record<'A' | 'B' | 'C', Step[]> = {
  A: [[0, 0, .02], [10000, 200, .045], [50000, 2000, .055], [100000, 4750, .06], [200000, 10750, .065], [250000, 14000, .069], [500000, 31250, .0699]],
  B: [[0, 0, .02], [16000, 320, .045], [80000, 3200, .055], [160000, 7600, .06], [320000, 17200, .065], [400000, 22400, .069], [800000, 50000, .0699]],
  C: [[0, 0, .02], [20000, 400, .045], [100000, 4000, .055], [200000, 9500, .06], [400000, 21500, .065], [500000, 28000, .069], [1000000, 62500, .0699]],
};
const credits = [.75, .70, .65, .60, .55, .50, .45, .40, .35, .30, .25, .20, .15, .14, .13, .12, .11, .10, .09, .08, .07, .06, .05, .04, .03, .02, .01, 0];
const creditBounds: Record<'A' | 'B' | 'C' | 'F', number[]> = {
  A: [15000,15500,16000,16500,17000,17500,18000,18500,20000,20500,21000,21500,25000,25500,26000,26500,27000,48000,48500,49000,49500,50000,50500,51000,51500,52000,52500,Infinity],
  B: [24000,24500,25000,25500,26000,26500,27000,27500,34000,34500,35000,35500,44000,44500,45000,45500,46000,74000,74500,75000,75500,76000,76500,77000,77500,78000,78500,Infinity],
  C: [30000,30500,31000,31500,32000,32500,33000,33500,40000,40500,41000,41500,50000,50500,51000,51500,52000,96000,96500,97000,97500,98000,98500,99000,99500,100000,100500,Infinity],
  F: [18800,19300,19800,20300,20800,21300,21800,22300,25000,25500,26000,26500,31300,31800,32300,32800,33300,60000,60500,61000,61500,62000,62500,63000,63500,64000,64500,Infinity],
};

function personalExemption(code: Code, salary: number): number {
  const settings: Partial<Record<Code, [number, number]>> = { A: [24000, 12000], B: [38000, 19000], C: [48000, 24000], F: [30000, 15000] };
  const setting = settings[code];
  if (!setting) return 0;
  return Math.max(0, setting[1] - Math.ceil(Math.max(0, salary - setting[0]) / 1000) * 1000);
}

function phaseout(code: Code, salary: number): number {
  const settings: Record<Exclude<Code, 'E'>, [number, number, number, number]> = {
    A: [50250, 2500, 25, 250], D: [50250, 2500, 25, 250],
    B: [78500, 4000, 40, 400], C: [100500, 5000, 50, 500], F: [56500, 5000, 25, 250],
  };
  if (code === 'E') return 0;
  const [start, width, increment, cap] = settings[code];
  return Math.min(cap, Math.ceil(Math.max(0, salary - start) / width) * increment);
}

function recapture(code: Code, salary: number): number {
  if (code === 'E') return 0;
  if (code === 'A' || code === 'D' || code === 'F') {
    if (salary <= 150000) return Math.min(250, Math.ceil(Math.max(0, salary - 105000) / 5000) * 25);
    if (salary <= 200000) return 250;
    if (salary <= 345000) return Math.min(2950, 250 + Math.ceil((salary - 200000) / 5000) * 90);
    if (salary <= 500000) return 2950;
    return Math.min(3400, 2950 + Math.ceil((salary - 500000) / 5000) * 50);
  }
  if (code === 'B') {
    if (salary <= 240000) return Math.min(400, Math.ceil(Math.max(0, salary - 168000) / 8000) * 40);
    if (salary <= 320000) return 400;
    if (salary <= 552000) return Math.min(4600, 400 + Math.ceil((salary - 320000) / 8000) * 140);
    if (salary <= 800000) return 4600;
    return Math.min(5320, 4600 + Math.ceil((salary - 800000) / 8000) * 80);
  }
  if (salary <= 300000) return Math.min(500, Math.ceil(Math.max(0, salary - 210000) / 10000) * 50);
  if (salary <= 400000) return 500;
  if (salary <= 690000) return Math.min(5900, 500 + Math.ceil((salary - 400000) / 10000) * 180);
  if (salary <= 1000000) return 5900;
  return Math.min(6800, 5900 + Math.ceil((salary - 1000000) / 10000) * 100);
}

function personalCredit(code: Code, salary: number): number {
  if (code === 'D' || code === 'E') return 0;
  const index = creditBounds[code].findIndex(upper => salary <= upper);
  return credits[index];
}

const metadata: TaxRuleMetadata = {
  jurisdiction: 'CT', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31',
  lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [
    { title: 'TPG-211, 2026 Withholding Calculation Rules', authority: 'Connecticut Department of Revenue Services', url: 'https://portal.ct.gov/-/media/drs/forms/2025/wth/tpg-211_1225.pdf' },
    { title: 'Form CT-W4, 2026 Employee’s Withholding Certificate', authority: 'Connecticut Department of Revenue Services', url: 'https://portal.ct.gov/-/media/drs/forms/2026/wth/ct-w4_1225fillable.pdf' },
    { title: 'CT Paid Leave Contributions', authority: 'CT Paid Leave Authority', url: 'https://www.ctpaidleave.org/how-ct-paid-leave-works/contributions' },
  ],
};

export const ct2026: StateCalculator = {
  metadata,
  getSources: () => metadata.sources,
  getAssumptions: () => [
    'Connecticut uses all five tables in its 2026 TPG-211 worksheet: personal exemption, initial tax, 2% phaseout add-back, recapture, and personal tax credit.',
    'The default CT-W4 code follows the selected filing status and this job’s annualized wages. Married joint defaults to Code C, which assumes the spouse is not employed; choose another code in Advanced options when needed.',
    'Covered employees contribute 0.5% of FICA taxable wages to CT Paid Leave through the Social Security wage base.',
  ],
  calculate({ input, grossPay, socialSecurityTaxableWages, stateTaxableWages, ytdSocialSecurityWages, ytdGrossWages }: StateInput): StateResult {
    const salary = stateTaxableWages * periods[input.payFrequency];
    const defaultCode: Code = input.federal.filingStatus === 'married_joint' ? salary <= 24000 ? 'E' : 'C'
      : input.federal.filingStatus === 'head_of_household' ? salary <= 19000 ? 'E' : 'B'
      : input.federal.filingStatus === 'married_separate' ? salary <= 15000 ? 'E' : 'F'
      : salary <= 12000 ? 'E' : 'A';
    const code = input.stateOptions?.ctCode ?? defaultCode;
    const extra = input.stateOptions?.ctExtraWithholding ?? 0;
    const reduced = input.stateOptions?.ctReducedWithholding ?? 0;
    const paidLeaveCovered = input.stateOptions?.ctPaidLeaveCovered ?? true;
    const noCertificate = input.stateOptions?.ctNoCertificate ?? false;
    if (!['A','B','C','D','E','F'].includes(String(code))) throw new Error('Connecticut CT-W4 code must be A, B, C, D, E, or F');
    if (typeof extra !== 'number' || !Number.isFinite(extra) || extra < 0) throw new Error('Connecticut extra withholding must be nonnegative');
    if (typeof reduced !== 'number' || !Number.isFinite(reduced) || reduced < 0) throw new Error('Connecticut reduced withholding must be nonnegative');
    if (typeof paidLeaveCovered !== 'boolean') throw new Error('Connecticut Paid Leave coverage must be a checkbox');
    if (typeof noCertificate !== 'boolean') throw new Error('Connecticut no-certificate election must be a checkbox');
    let withholding = 0;
    if (noCertificate) withholding = stateTaxableWages * .0699;
    else if (code !== 'E') {
      const ctCode = code as Exclude<Code, 'E'>;
      const taxable = Math.max(0, salary - personalExemption(ctCode, salary));
      const rows = brackets[ctCode === 'B' ? 'B' : ctCode === 'C' ? 'C' : 'A'];
      let initial = 0;
      for (const [threshold, base, rate] of rows) {
        if (taxable <= threshold && threshold !== 0) break;
        initial = base + (taxable - threshold) * rate;
      }
      const annualTax = (initial + phaseout(ctCode, salary) + recapture(ctCode, salary)) * (1 - personalCredit(ctCode, salary));
      withholding = Math.max(0, annualTax / periods[input.payFrequency] + extra - reduced);
    }
    const ficaWages = socialSecurityTaxableWages ?? grossPay;
    const coveredWages = Math.min(ficaWages, Math.max(0, 184500 - (ytdSocialSecurityWages ?? ytdGrossWages)));
    return {
      incomeTaxWithholding: roundMoney(withholding),
      payrollDeductions: [{ id: 'ct-paid-leave', label: 'Connecticut Paid Leave', amount: paidLeaveCovered ? roundMoney(coveredWages * .005) : 0 }],
      localWithholding: 0, localSupported: !input.location.city, assumptions: [],
    };
  },
};
