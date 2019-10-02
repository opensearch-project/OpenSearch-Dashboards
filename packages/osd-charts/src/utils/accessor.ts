import { Datum } from '../chart_types/xy_chart/utils/specs';

export type AccessorFn = (datum: Datum) => any;
export type AccessorString = string | number;
export type Accessor = AccessorString;

/**
 * Accessor format for _banded_ series as postfix string or accessor function
 */
export type AccessorFormat = string | ((value: string) => string);

/**
 * Return an accessor function using the accessor passed as argument
 * @param accessor the spec accessor
 */
export function getAccessorFn(accessor: Accessor): AccessorFn {
  if (typeof accessor === 'string' || typeof accessor === 'number') {
    return (datum: Datum) => {
      return datum[accessor];
    };
  }
  if (typeof accessor === 'function') {
    return accessor;
  }
  throw new Error('Accessor must be a string or a function');
}

/**
 * Return the accessor label given as `AccessorFormat`
 */
export function getAccessorFormatLabel(accessor: AccessorFormat, label: string): string {
  if (typeof accessor === 'string') {
    return `${label}${accessor}`;
  }

  return accessor(label);
}
