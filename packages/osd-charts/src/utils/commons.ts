import { v1 as uuidV1 } from 'uuid';
import { $Values } from 'utility-types';

export type Datum = any;
export type Rotation = 0 | 90 | -90 | 180;
export type Rendering = 'canvas' | 'svg';
export type Color = string;

export const Position = Object.freeze({
  Top: 'top' as 'top',
  Bottom: 'bottom' as 'bottom',
  Left: 'left' as 'left',
  Right: 'right' as 'right',
});

export type Position = $Values<typeof Position>;

export function identity<T>(value: T): T {
  return value;
}

export function compareByValueAsc(firstEl: number, secondEl: number): number {
  return firstEl - secondEl;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * This function returns a function to generate ids.
 * This can be used to generate unique, but predictable ids to pair labels
 * with their inputs. It takes an optional prefix as a parameter. If you don't
 * specify it, it generates a random id prefix. If you specify a custom prefix
 * it should begin with an letter to be HTML4 compliant.
 */
export function htmlIdGenerator(idPrefix?: string) {
  const prefix = idPrefix || `i${uuidV1()}`;
  return (suffix?: string) => `${prefix}_${suffix || uuidV1()}`;
}

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
    : RecursivePartial<T[P]>;
};

export interface MergeOptions {
  mergeOptionalPartialValues?: boolean;
}

export function getPartialValue<T>(base: T, partial?: RecursivePartial<T>, partials: RecursivePartial<T>[] = []): T {
  const partialWithValue = partial !== undefined ? partial : partials.find((v) => v !== undefined);
  return partialWithValue !== undefined ? (partialWithValue as T) : base;
}

/**
 * Returns all top-level keys from one or more objects
 * @param object - first object to get keys
 * @param objects
 */
export function getAllKeys(object: any, objects: any[] = []): string[] {
  return objects.reduce((keys: any[], obj) => {
    if (obj && typeof obj === 'object') {
      keys.push(...Object.keys(obj));
    }

    return keys;
  }, Object.keys(object));
}

export function hasPartialObjectToMerge<T>(
  base: T,
  partial?: RecursivePartial<T>,
  additionalPartials: RecursivePartial<T>[] = [],
): boolean {
  if (Array.isArray(base)) {
    return false;
  }

  if (typeof base === 'object') {
    if (typeof partial === 'object' && !Array.isArray(partial)) {
      return true;
    }

    return additionalPartials.some((p) => typeof p === 'object' && !Array.isArray(p));
  }

  return false;
}

export function shallowClone(value: any) {
  if (Array.isArray(value)) {
    return [...value];
  }

  if (typeof value === 'object' && value !== null) {
    return { ...value };
  }

  return value;
}

/**
 * Merges values of a partial structure with a base structure.
 *
 * @note No nested array merging
 *
 * @param base structure to be duplicated, must have all props of `partial`
 * @param partial structure to override values from base
 *
 * @returns new base structure with updated partial values
 */
export function mergePartial<T>(
  base: T,
  partial?: RecursivePartial<T>,
  options: MergeOptions = {},
  additionalPartials: RecursivePartial<T>[] = [],
): T {
  const baseClone = shallowClone(base);

  if (hasPartialObjectToMerge(base, partial, additionalPartials)) {
    if (partial !== undefined && options.mergeOptionalPartialValues) {
      getAllKeys(partial, additionalPartials).forEach((key) => {
        if (!(key in baseClone)) {
          (baseClone as any)[key] =
            (partial as any)[key] !== undefined
              ? (partial as any)[key]
              : (additionalPartials.find((v: any) => v[key] !== undefined) || ({} as any))[key];
        }
      });
    }

    return Object.keys(base).reduce((newBase, key) => {
      const partialValue = partial && (partial as any)[key];
      const partialValues = additionalPartials.map((v) => (typeof v === 'object' ? (v as any)[key] : undefined));
      const baseValue = (base as any)[key];

      (newBase as any)[key] = mergePartial(baseValue, partialValue, options, partialValues);

      return newBase;
    }, baseClone);
  }

  return getPartialValue<T>(baseClone, partial, additionalPartials);
}

export function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((element) => typeof element === 'number');
}
