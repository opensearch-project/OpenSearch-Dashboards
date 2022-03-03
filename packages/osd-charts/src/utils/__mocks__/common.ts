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
 * under the License.
 */

const module = jest.requireActual('../common.ts');

/** @internal */
export const { ColorVariant, Position } = module;

/** @internal */
export const identity = jest.fn(module.identity);
/** @internal */
export const compareByValueAsc = jest.fn(module.compareByValueAsc);
/** @internal */
export const clamp = jest.fn(module.clamp);
/** @internal */
export const getColorFromVariant = jest.fn(module.getColorFromVariant);
/** @internal */
export const htmlIdGenerator = jest.fn(module.htmlIdGenerator);
/** @internal */
export const getPartialValue = jest.fn(module.getPartialValue);
/** @internal */
export const getAllKeys = jest.fn(module.getAllKeys);
/** @internal */
export const hasPartialObjectToMerge = jest.fn(module.hasPartialObjectToMerge);
/** @internal */
export const shallowClone = jest.fn(module.shallowClone);
/** @internal */
export const mergePartial = jest.fn(module.mergePartial);
/** @internal */
export const isNumberArray = jest.fn(module.isNumberArray);
/** @internal */
export const getUniqueValues = jest.fn(module.getUniqueValues);
