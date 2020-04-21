/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License. */

import { Datum } from './commons';

type UnaryAccessorFn<Return = any> = (datum: Datum) => Return;
type BinaryAccessorFn<Return = any> = (datum: Datum, index: number) => Return;

export type AccessorFn = UnaryAccessorFn;
export type IndexedAccessorFn = UnaryAccessorFn | BinaryAccessorFn;
type AccessorObjectKey = string;
type AccessorArrayIndex = number;
export type Accessor = AccessorObjectKey | AccessorArrayIndex;

/**
 * Accessor format for _banded_ series as postfix string or accessor function
 */
export type AccessorFormat = string | ((value: string) => string);

/**
 * Return an accessor function using the accessor passed as argument
 * @param accessor the spec accessor
 * @internal
 */
export function getAccessorFn(accessor: Accessor): AccessorFn {
  return (datum: Datum) => {
    return typeof datum === 'object' && datum !== null ? datum[accessor as keyof typeof datum] : undefined;
  };
}

/**
 * Return the accessor label given as `AccessorFormat`
 * @internal
 */
export function getAccessorFormatLabel(accessor: AccessorFormat, label: string): string {
  if (typeof accessor === 'string') {
    return `${label}${accessor}`;
  }

  return accessor(label);
}

/**
 * Helper function to get accessor value from string, number or function
 *
 * @param  {Datum} datum
 * @param  {AccessorString|AccessorFn} accessor
 * @internal
 */
export function getAccessorValue(datum: Datum, accessor: Accessor | AccessorFn) {
  if (typeof accessor === 'function') {
    return accessor(datum);
  }

  return datum[accessor];
}
