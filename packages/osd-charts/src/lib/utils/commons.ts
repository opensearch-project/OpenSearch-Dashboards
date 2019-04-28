export function identity<T>(value: T): T {
  return value;
}

export function compareByValueAsc(firstEl: number, secondEl: number): number {
  return firstEl - secondEl;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
