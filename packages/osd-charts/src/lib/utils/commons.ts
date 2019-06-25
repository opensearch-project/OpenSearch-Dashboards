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

/**
 * Replaces all properties on any type as optional, includes nested types
 *
 * example:
 * ```ts
 * interface Person {
 *  name: string;
 *  age?: number;
 *  spouse: Person;
 *  children: Person[];
 * }
 * type PartialPerson = RecursivePartial<Person>;
 * // results in
 * interface PartialPerson {
 *  name?: string;
 *  age?: number;
 *  spouse?: RecursivePartial<Person>;
 *  children?: RecursivePartial<Person>[]
 * }
 * ```
 */
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends ReadonlyArray<infer U> // eslint-disable-line @typescript-eslint/array-type
    ? ReadonlyArray<RecursivePartial<U>> // eslint-disable-line @typescript-eslint/array-type
    : RecursivePartial<T[P]>
};

/**
 * Merges values of a partial structure with a base structure.
 *
 * @param base structure to be duplicated, must have all props of `partial`
 * @param partial structure to override values from base
 *
 * @returns new base structure with updated partial values
 */
export function mergePartial<T>(base: T, partial?: RecursivePartial<T>): T {
  if (Array.isArray(base)) {
    return partial ? (partial as T) : base; // No nested array merging
  } else if (typeof base === 'object') {
    return Object.keys(base).reduce(
      (newBase, key) => {
        // @ts-ignore
        newBase[key] = mergePartial(base[key], partial && partial[key]);
        return newBase;
      },
      { ...base },
    );
  }

  return partial !== undefined ? (partial as T) : base;
}
