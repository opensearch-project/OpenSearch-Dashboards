/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

const COLOR_PROPERTIES = [
  'all',
  'animation',
  'animation-name',
  'background',
  'background-color',
  'background-image',
  'border',
  'border-bottom',
  'border-bottom-color',
  'border-color',
  'border-image',
  'border-image-source',
  'border-left',
  'border-left-color',
  'border-right',
  'border-right-color',
  'border-top',
  'border-top-color',
  'box-shadow',
  'caret-color',
  'color',
  'column-rule',
  'column-rule-color',
  'content',
  'cursor',
  'filter',
  'list-style',
  'list-style-image',
  'outline',
  'outline-color',
  'text-decoration',
  'text-decoration-color',
  'text-shadow',
  'mask-image',
  'shape-outside',
  'mask-border-source',
];

export const isColorProperty = (prop: string) => {
  return COLOR_PROPERTIES.includes(prop);
};
