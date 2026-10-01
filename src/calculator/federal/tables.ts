import type { FilingStatus, TaxRuleMetadata } from '../types.ts';

type Row = readonly [floor: number, base: number, rate: number];
export type FederalTables = {
  metadata: TaxRuleMetadata;
  adjustment: { married: number; other: number };
  socialSecurityWageBase: number;
  standard: Record<FilingStatus, readonly Row[]>;
  multipleJobs: Record<FilingStatus, readonly Row[]>;
};

const irs2026 = { title: 'Publication 15-T (2026), Federal Income Tax Withholding Methods', authority: 'IRS', url: 'https://www.irs.gov/publications/p15t' };
const irs2025 = { title: 'Publication 15-T (2025), Federal Income Tax Withholding Methods', authority: 'IRS', url: 'https://www.irs.gov/pub/irs-prior/p15t--2025.pdf' };
const ssa = { title: 'Contribution and Benefit Base', authority: 'Social Security Administration', url: 'https://www.ssa.gov/oact/COLA/cbb.html' };

const standard2026Single: Row[] = [[0,0,0],[7500,0,.1],[19900,1240,.12],[57900,5800,.22],[113200,17966,.24],[209275,41024,.32],[263725,58448,.35],[648100,192979.25,.37]];
const multiple2026Single: Row[] = [[0,0,0],[8050,0,.1],[14250,620,.12],[33250,2900,.22],[60900,8983,.24],[108938,20512,.32],[136163,29224,.35],[328350,96489.63,.37]];
const standard2026Married: Row[] = [[0,0,0],[19300,0,.1],[44100,2480,.12],[120100,11600,.22],[230700,35932,.24],[422850,82048,.32],[531750,116896,.35],[788000,206583.5,.37]];
const multiple2026Married: Row[] = [[0,0,0],[16100,0,.1],[28500,1240,.12],[66500,5800,.22],[121800,17966,.24],[217875,41024,.32],[272325,58448,.35],[400450,103291.75,.37]];
const standard2026Head: Row[] = [[0,0,0],[15550,0,.1],[33250,1770,.12],[83000,7740,.22],[121250,16155,.24],[217300,39207,.32],[271750,56631,.35],[656150,191171,.37]];
const multiple2026Head: Row[] = [[0,0,0],[12075,0,.1],[20925,885,.12],[45800,3870,.22],[64925,8077.5,.24],[112950,19603.5,.32],[140175,28315.5,.35],[332375,95585.5,.37]];

const standard2025Single: Row[] = [[0,0,0],[6400,0,.1],[18325,1192.5,.12],[54875,5578.5,.22],[109750,17651,.24],[203700,40199,.32],[256925,57231,.35],[632750,188769.75,.37]];
const multiple2025Single: Row[] = [[0,0,0],[7500,0,.1],[13463,596.25,.12],[31738,2789.25,.22],[59175,8825.5,.24],[106150,20099.5,.32],[132763,28615.5,.35],[320675,94384.88,.37]];
const standard2025Married: Row[] = [[0,0,0],[17100,0,.1],[40950,2385,.12],[114050,11157,.22],[223800,35302,.24],[411700,80398,.32],[518150,114462,.35],[768700,202154.5,.37]];
const multiple2025Married: Row[] = [[0,0,0],[15000,0,.1],[26925,1192.5,.12],[63475,5578.5,.22],[118350,17651,.24],[212300,40199,.32],[265525,57231,.35],[390800,101077.25,.37]];
const standard2025Head: Row[] = [[0,0,0],[13900,0,.1],[30900,1700,.12],[78750,7442,.22],[117250,15912,.24],[211200,38460,.32],[264400,55484,.35],[640250,187031.5,.37]];
const multiple2025Head: Row[] = [[0,0,0],[11250,0,.1],[19750,850,.12],[43675,3721,.22],[62925,7956,.24],[109900,19230,.32],[136500,27742,.35],[324425,93515.75,.37]];

export const federalTables: Record<number, FederalTables> = {
  2026: {
    metadata: { jurisdiction: 'US', taxYear: 2026, effectiveFrom: '2026-01-01', effectiveTo: '2026-12-31', lastVerified: '2026-09-22', status: 'verified', version: '2026.1', sources: [irs2026, ssa] },
    adjustment: { married: 12900, other: 8600 }, socialSecurityWageBase: 184500,
    standard: { single: standard2026Single, married_separate: standard2026Single, married_joint: standard2026Married, head_of_household: standard2026Head },
    multipleJobs: { single: multiple2026Single, married_separate: multiple2026Single, married_joint: multiple2026Married, head_of_household: multiple2026Head },
  },
  2025: {
    metadata: { jurisdiction: 'US', taxYear: 2025, effectiveFrom: '2025-01-01', effectiveTo: '2025-12-31', lastVerified: '2026-09-22', status: 'verified', version: '2025.1', sources: [irs2025, ssa] },
    adjustment: { married: 12900, other: 8600 }, socialSecurityWageBase: 176100,
    standard: { single: standard2025Single, married_separate: standard2025Single, married_joint: standard2025Married, head_of_household: standard2025Head },
    multipleJobs: { single: multiple2025Single, married_separate: multiple2025Single, married_joint: multiple2025Married, head_of_household: multiple2025Head },
  },
};

export function annualWithholding(amount: number, rows: readonly Row[]): number {
  let row = rows[0];
  for (const candidate of rows) {
    if (amount >= candidate[0]) row = candidate;
    else break;
  }
  return row[1] + (amount - row[0]) * row[2];
}
