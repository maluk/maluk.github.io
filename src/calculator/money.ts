export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function capRemaining(current: number, ytd: number, cap: number): number {
  return Math.min(Math.max(current, 0), Math.max(cap - ytd, 0));
}
