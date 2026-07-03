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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import Joi from 'joi';
import type { AnySchema, CustomHelpers, Extension, Reference, SchemaLike } from 'joi';
import { isPlainObject } from 'lodash';
import { isDuration } from 'moment';
import { Stream } from 'stream';
import { ByteSizeValue, ensureByteSizeValue } from '../byte_size_value';
import { ensureDuration } from '../duration';

export { AnySchema, Reference, SchemaLike };
export type { ValidationErrorItem } from 'joi';

function isMap<K, V>(o: any): o is Map<K, V> {
  return o instanceof Map;
}

const customRule = {
  method(this: any, validator: (value: any) => string | void) {
    return this.$_addRule({ name: 'osdCustom', args: { validator } });
  },
  validate(value: any, helpers: CustomHelpers, args: { validator: (v: any) => string | void }) {
    let validationResultMessage;
    try {
      validationResultMessage = args.validator(value);
    } catch (e: any) {
      validationResultMessage = e.message || e;
    }

    if (typeof validationResultMessage === 'string') {
      return helpers.error('any.osdCustom', { value, message: validationResultMessage });
    }

    return value;
  },
};

const extensions: Extension[] = [
  {
    type: 'any',
    rules: {
      osdCustom: customRule,
    },
    messages: {
      'any.osdCustom': '{{#message}}',
    },
  },
  {
    type: 'boolean',
    base: Joi.boolean(),
    coerce(value: any, helpers: CustomHelpers) {
      if (value === undefined) {
        return { value };
      }
      if (typeof value === 'string') {
        const normalized = value.toLowerCase();
        const coerced = normalized === 'true' ? true : normalized === 'false' ? false : value;
        return { value: coerced };
      }
      if (typeof value !== 'boolean') {
        return { errors: [helpers.error('boolean.base')] };
      }
      return { value };
    },
    rules: {
      osdCustom: customRule,
    },
  },
  {
    type: 'binary',
    messages: {
      'any.osdCustom': '{{#message}}',
      'binary.base': '{{#label}} must be a Buffer',
    },
    validate(value: any, helpers: CustomHelpers) {
      if (value !== undefined && !Buffer.isBuffer(value)) {
        return { value, errors: helpers.error('binary.base') };
      }
      return { value };
    },
    rules: {
      osdCustom: customRule,
    },
  },
  {
    type: 'stream',
    messages: {
      'any.osdCustom': '{{#message}}',
      'stream.base': '{{#label}} must be a Stream',
    },
    validate(value: any, helpers: CustomHelpers) {
      if (value instanceof Stream) {
        return { value };
      }
      return { value, errors: helpers.error('stream.base') };
    },
    rules: {
      osdCustom: customRule,
    },
  },
  {
    type: 'string',
    base: Joi.string(),
    messages: {
      'any.osdCustom': '{{#message}}',
    },
    rules: {
      osdCustom: customRule,
    },
  },
  {
    type: 'bytes',
    messages: {
      'any.osdCustom': '{{#message}}',
      'bytes.base': '{{#label}} must be a valid ByteSize value',
      'bytes.parse': '{{#label}} could not be parsed: {{#message}}',
      'bytes.min': '{{#label}} must be greater than or equal to {{#limit}}',
      'bytes.max': '{{#label}} must be less than or equal to {{#limit}}',
    },
    coerce(value: any, helpers: CustomHelpers) {
      try {
        if (typeof value === 'string') {
          return { value: ByteSizeValue.parse(value) };
        }
        if (typeof value === 'number') {
          return { value: new ByteSizeValue(value) };
        }
      } catch (e: any) {
        return { errors: [helpers.error('bytes.parse', { message: e.message })] };
      }
      return { value };
    },
    validate(value: any, helpers: CustomHelpers) {
      if (value instanceof ByteSizeValue) {
        return { value };
      }
      return { value, errors: helpers.error('bytes.base') };
    },
    rules: {
      osdCustom: customRule,
      min: {
        method(this: any, limit: number | string | ByteSizeValue) {
          return this.$_addRule({ name: 'min', args: { limit } });
        },
        validate(
          value: any,
          helpers: CustomHelpers,
          args: { limit: number | string | ByteSizeValue }
        ) {
          const limit = ensureByteSizeValue(args.limit);
          if (value.isLessThan(limit)) {
            return helpers.error('bytes.min', { limit });
          }
          return value;
        },
      },
      max: {
        method(this: any, limit: number | string | ByteSizeValue) {
          return this.$_addRule({ name: 'max', args: { limit } });
        },
        validate(
          value: any,
          helpers: CustomHelpers,
          args: { limit: number | string | ByteSizeValue }
        ) {
          const limit = ensureByteSizeValue(args.limit);
          if (value.isGreaterThan(limit)) {
            return helpers.error('bytes.max', { limit });
          }
          return value;
        },
      },
    },
  },
  {
    type: 'duration',
    messages: {
      'any.osdCustom': '{{#message}}',
      'duration.base': '{{#label}} must be a valid duration',
      'duration.parse': '{{#label}} could not be parsed: {{#message}}',
    },
    coerce(value: any, helpers: CustomHelpers) {
      try {
        if (typeof value === 'string' || typeof value === 'number') {
          return { value: ensureDuration(value) };
        }
      } catch (e: any) {
        return { errors: [helpers.error('duration.parse', { message: e.message })] };
      }
      return { value };
    },
    validate(value: any, helpers: CustomHelpers) {
      if (!isDuration(value)) {
        return { value, errors: helpers.error('duration.base') };
      }
      return { value };
    },
    rules: {
      osdCustom: customRule,
    },
  },
  {
    type: 'number',
    base: Joi.number(),
    coerce(value: any, helpers: CustomHelpers) {
      if (value === undefined) {
        return { value };
      }
      const coercedValue: any = typeof value === 'string' ? Number(value) : value;
      if (typeof coercedValue !== 'number' || isNaN(coercedValue)) {
        return { errors: [helpers.error('number.base')] };
      }
      return { value };
    },
    rules: {
      osdCustom: customRule,
    },
  },
  {
    type: 'object',
    base: Joi.object(),
    messages: {
      'any.osdCustom': '{{#message}}',
      'object.parse': '{{#label}} could not be parsed from string',
    },
    coerce(value: any, helpers: CustomHelpers) {
      if (value === undefined || isPlainObject(value)) {
        return { value };
      }
      const prefs = helpers.prefs;
      if (prefs.convert && typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (isPlainObject(parsed)) {
            return { value: parsed };
          }
          return { errors: [helpers.error('object.base', { value: parsed })] };
        } catch {
          return { errors: [helpers.error('object.parse')] };
        }
      }
      return { errors: [helpers.error('object.base')] };
    },
    rules: {
      osdCustom: customRule,
    },
  },
  {
    type: 'map',
    messages: {
      'any.osdCustom': '{{#message}}',
      'map.base': '{{#label}} must be a Map or a plain object',
      'map.parse': '{{#label}} could not be parsed from string',
      'map.key': '{{#label}} has an invalid key: {{#reason}}',
      'map.value': '{{#label}} has an invalid value for key [{{#entryKey}}]: {{#reason}}',
    },
    coerce(value: any, helpers: CustomHelpers) {
      if (value === undefined) {
        return { value };
      }
      if (isPlainObject(value)) {
        return { value: new Map(Object.entries(value)) };
      }
      const prefs = helpers.prefs;
      if (prefs.convert && typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (isPlainObject(parsed)) {
            return { value: new Map(Object.entries(parsed)) };
          }
          return { errors: [helpers.error('map.base')] };
        } catch {
          return { errors: [helpers.error('map.parse')] };
        }
      }
      return { value };
    },
    validate(value: any, helpers: CustomHelpers) {
      if (!isMap(value)) {
        return { value, errors: helpers.error('map.base') };
      }
      return { value };
    },
    rules: {
      osdCustom: customRule,
      entries: {
        args: ['key', 'value'],
        method(this: any, key: AnySchema, value: AnySchema) {
          return this.$_addRule({ name: 'entries', args: { key, value } });
        },
        validate(value: any, helpers: CustomHelpers, args: { key: AnySchema; value: AnySchema }) {
          const result = new Map();
          for (const [entryKey, entryValue] of value) {
            const { value: validatedEntryKey, error: keyError } = args.key.validate(entryKey, {
              presence: 'required',
            });

            if (keyError) {
              return helpers.error('map.key', { entryKey, reason: keyError });
            }

            const { value: validatedEntryValue, error: valueError } = args.value.validate(
              entryValue,
              { presence: 'required' }
            );

            if (valueError) {
              return helpers.error('map.value', { entryKey, reason: valueError });
            }

            result.set(validatedEntryKey, validatedEntryValue);
          }

          return result;
        },
      },
    },
  },
  {
    type: 'record',
    messages: {
      'any.osdCustom': '{{#message}}',
      'record.base': '{{#label}} must be a plain object',
      'record.parse': '{{#label}} could not be parsed from string',
      'record.key': '{{#label}} has an invalid key: {{#reason}}',
      'record.value': '{{#label}} has an invalid value for key [{{#entryKey}}]: {{#reason}}',
    },
    coerce(value: any, helpers: CustomHelpers) {
      if (value === undefined || isPlainObject(value)) {
        return { value };
      }
      const prefs = helpers.prefs;
      if (prefs.convert && typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (isPlainObject(parsed)) {
            return { value: parsed };
          }
          return { errors: [helpers.error('record.base', { value: parsed })] };
        } catch {
          return { errors: [helpers.error('record.parse')] };
        }
      }
      return { errors: [helpers.error('record.base')] };
    },
    validate(value: any, helpers: CustomHelpers) {
      if (value === undefined || isPlainObject(value)) {
        return { value };
      }
      return { value, errors: helpers.error('record.base') };
    },
    rules: {
      osdCustom: customRule,
      entries: {
        args: ['key', 'value'],
        method(this: any, key: AnySchema, value: AnySchema) {
          return this.$_addRule({ name: 'entries', args: { key, value } });
        },
        validate(value: any, helpers: CustomHelpers, args: { key: AnySchema; value: AnySchema }) {
          const result = {} as Record<string, any>;
          for (const [entryKey, entryValue] of Object.entries(value)) {
            const { value: validatedEntryKey, error: keyError } = args.key.validate(entryKey, {
              presence: 'required',
            });

            if (keyError) {
              return helpers.error('record.key', { entryKey, reason: keyError });
            }

            const { value: validatedEntryValue, error: valueError } = args.value.validate(
              entryValue,
              { presence: 'required' }
            );

            if (valueError) {
              return helpers.error('record.value', { entryKey, reason: valueError });
            }

            result[validatedEntryKey] = validatedEntryValue;
          }

          return result;
        },
      },
    },
  },
  {
    type: 'array',
    base: Joi.array(),
    messages: {
      'any.osdCustom': '{{#message}}',
      'array.parse': '{{#label}} could not be parsed from string',
    },
    coerce(value: any, helpers: CustomHelpers) {
      if (value === undefined || Array.isArray(value)) {
        return { value };
      }
      const prefs = helpers.prefs;
      if (prefs.convert && typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return { value: parsed };
          }
          return { errors: [helpers.error('array.base', { value: parsed })] };
        } catch {
          return { errors: [helpers.error('array.parse')] };
        }
      }
      return { errors: [helpers.error('array.base')] };
    },
    rules: {
      osdCustom: customRule,
    },
  },
];

export interface OsdSchema extends Joi.AnySchema {
  osdCustom(validator: (value: any) => string | void): this;
  min(limit: number | string | ByteSizeValue): this;
  max(limit: number | string | ByteSizeValue): this;
}

export type JoiRoot = Joi.Root & {
  bytes: () => OsdSchema;
  duration: () => OsdSchema;
  map: () => OsdSchema & { entries(key: Joi.AnySchema, value: Joi.AnySchema): OsdSchema };
  record: () => OsdSchema & { entries(key: Joi.AnySchema, value: Joi.AnySchema): OsdSchema };
  stream: () => OsdSchema;
};

/**
 * @internal
 */
export const internals = Joi.extend(...extensions) as unknown as JoiRoot;
