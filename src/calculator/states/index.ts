import type { StateCalculator } from '../types.ts';
import { noIncomeTaxCalculator } from './noIncomeTax.ts';
import { ca2026 } from './CA/2026.ts';
import { ca2025 } from './CA/2025.ts';
import { ny2026 } from './NY/2026.ts';
import { pa2026 } from './PA/2026.ts';
import { il2026 } from './IL/2026.ts';
import { in2026 } from './IN/2026.ts';

export const stateCalculators: Record<number, Record<string, StateCalculator>> = {
  2025: {
    CA: ca2025,
    TX: noIncomeTaxCalculator('TX', 2025),
    FL: noIncomeTaxCalculator('FL', 2025),
    WA: noIncomeTaxCalculator('WA', 2025),
  },
  2026: {
    CA: ca2026,
    NY: ny2026,
    PA: pa2026,
    IL: il2026,
    IN: in2026,
    TX: noIncomeTaxCalculator('TX', 2026),
    FL: noIncomeTaxCalculator('FL', 2026),
    WA: noIncomeTaxCalculator('WA', 2026),
    NV: noIncomeTaxCalculator('NV', 2026),
    SD: noIncomeTaxCalculator('SD', 2026),
    TN: noIncomeTaxCalculator('TN', 2026),
    NH: noIncomeTaxCalculator('NH', 2026),
    WY: noIncomeTaxCalculator('WY', 2026),
    AK: noIncomeTaxCalculator('AK', 2026),
  },
};
