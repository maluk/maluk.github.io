export type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
export type FilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_of_household';
export type RuleStatus = 'verified' | 'pending_review' | 'deprecated';

export interface TaxSource {
  title: string;
  authority: string;
  url: string;
}

export interface TaxRuleMetadata {
  jurisdiction: string;
  taxYear: number;
  effectiveFrom: string;
  effectiveTo: string;
  lastVerified: string;
  sources: TaxSource[];
  status: RuleStatus;
  version: string;
}

export interface DeductionTaxTreatment {
  federalIncomeTax: boolean;
  socialSecurity: boolean;
  medicare: boolean;
  stateIncomeTax: boolean;
  localIncomeTax: boolean;
}

export interface Deduction {
  id: string;
  label: string;
  kind: '401k' | 'hsa' | 'fsa' | 'health' | 'dental' | 'vision' | 'custom';
  amount: number;
  unit: 'dollars' | 'percent';
  timing: 'pre_tax' | 'post_tax';
  treatment?: DeductionTaxTreatment;
}

export interface PaycheckInput {
  taxYear: number;
  payDate: string;
  compensation:
    | { type: 'salary'; annualSalary: number }
    | { type: 'hourly'; hourlyRate: number; regularHours: number; overtimeHours?: number; overtimeMultiplier?: number };
  payFrequency: PayFrequency;
  federal: {
    filingStatus: FilingStatus;
    multipleJobs: boolean;
    dependentCredits: number;
    otherIncome: number;
    deductions: number;
    extraWithholding: number;
    exempt: boolean;
  };
  location: { state: string; city?: string; zip?: string };
  ytd?: {
    grossWages?: number;
    socialSecurityWages?: number;
    medicareWages?: number;
    stateWages?: number;
    payrollContributions?: Record<string, number>;
  };
  deductions: Deduction[];
  stateOptions?: Record<string, number | boolean | string>;
}

export interface PayrollDeduction {
  id: string;
  label: string;
  amount: number;
}

export interface StateInput {
  input: PaycheckInput;
  grossPay: number;
  socialSecurityTaxableWages?: number;
  stateTaxableWages: number;
  localTaxableWages: number;
  ytdGrossWages: number;
  ytdStateWages: number;
  ytdPayrollContributions: Record<string, number>;
  federalPayrollTaxes?: { socialSecurity: number; medicare: number; additionalMedicare: number };
  federalIncomeTaxWithholding?: number;
  ytdSocialSecurityWages?: number;
  ytdMedicareWages?: number;
}

export interface StateResult {
  incomeTaxWithholding: number;
  payrollDeductions: PayrollDeduction[];
  localWithholding: number;
  localSupported: boolean;
  assumptions: string[];
}

export interface StateCalculator {
  metadata: TaxRuleMetadata;
  calculate(input: StateInput): StateResult;
  getSources(): TaxSource[];
  getAssumptions(): string[];
}

export interface PaycheckResult {
  grossPay: number;
  federal: {
    incomeTaxWithholding: number;
    socialSecurity: number;
    medicare: number;
    additionalMedicare: number;
  };
  state: { incomeTaxWithholding: number; payrollDeductions: PayrollDeduction[] };
  local: { withholding: number; supported: boolean };
  deductions: PayrollDeduction[];
  preTaxDeductions: number;
  postTaxDeductions: number;
  netPay: number;
  assumptions: string[];
  sources: TaxSource[];
  rules: TaxRuleMetadata[];
}
