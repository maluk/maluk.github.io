import type { StateCalculator } from '../types.ts';
import { noIncomeTaxCalculator } from './noIncomeTax.ts';
import { ca2026 } from './CA/2026.ts';
import { ca2025 } from './CA/2025.ts';
import { ny2026 } from './NY/2026.ts';
import { pa2026 } from './PA/2026.ts';
import { il2026 } from './IL/2026.ts';
import { in2026 } from './IN/2026.ts';
import { mi2026 } from './MI/2026.ts';
import { nc2026 } from './NC/2026.ts';
import { ga2026 } from './GA/2026.ts';
import { az2026 } from './AZ/2026.ts';
import { oh2026 } from './OH/2026.ts';
import { va2026 } from './VA/2026.ts';
import { ma2026 } from './MA/2026.ts';
import { co2026 } from './CO/2026.ts';
import { ky2026 } from './KY/2026.ts';
import { ut2026 } from './UT/2026.ts';
import { mo2026 } from './MO/2026.ts';
import { ia2026 } from './IA/2026.ts';
import { ms2026 } from './MS/2026.ts';
import { sc2026 } from './SC/2026.ts';
import { al2026 } from './AL/2026.ts';
import { ks2026 } from './KS/2026.ts';
import { wv2026 } from './WV/2026.ts';

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
    MI: mi2026,
    NC: nc2026,
    GA: ga2026,
    AZ: az2026,
    OH: oh2026,
    VA: va2026,
    MA: ma2026,
    CO: co2026,
    KY: ky2026,
    UT: ut2026,
    MO: mo2026,
    IA: ia2026,
    MS: ms2026,
    SC: sc2026,
    AL: al2026,
    KS: ks2026,
    WV: wv2026,
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
