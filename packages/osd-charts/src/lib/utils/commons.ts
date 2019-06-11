export function identity<T>(value: T): T {
  return value;
}

export function compareByValueAsc(firstEl: number, secondEl: number): number {
  return firstEl - secondEl;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Can remove once we upgrade to TypesScript >= 3.5
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
