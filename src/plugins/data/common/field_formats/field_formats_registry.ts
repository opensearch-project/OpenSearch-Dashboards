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

// eslint-disable-next-line max-classes-per-file
import { forOwn, isFunction, memoize, identity } from 'lodash';

import {
  FieldFormatsGetConfigFn,
  FieldFormatConfig,
  FIELD_FORMAT_IDS,
  FieldFormatInstanceType,
  FieldFormatId,
  IFieldFormatMetaParams,
  IFieldFormat,
} from './types';
import { baseFormatters } from './constants/base_formatters';
import { FieldFormat } from './field_format';
import { SerializedFieldFormat } from '../../../expressions/common/types';
import { OPENSEARCH_FIELD_TYPES, OSD_FIELD_TYPES } from '../osd_field_types/types';
import { UI_SETTINGS } from '../constants';
import { FieldFormatNotFoundError } from '../field_formats';

export class FieldFormatsRegistry {
  protected fieldFormats: Map<FieldFormatId, FieldFormatInstanceType> = new Map();
  protected defaultMap: Record<string, FieldFormatConfig> = {};
  protected metaParamsOptions: Record<string, any> = {};
  protected getConfig?: FieldFormatsGetConfigFn;
  // overriden on the public contract
  public deserialize: (mapping: SerializedFieldFormat) => IFieldFormat = () => {
    return new (FieldFormat.from(identity))();
  };

  init(
    getConfig: FieldFormatsGetConfigFn,
    metaParamsOptions: Record<string, any> = {},
    defaultFieldConverters: FieldFormatInstanceType[] = baseFormatters
  ) {
    const defaultTypeMap = getConfig(UI_SETTINGS.FORMAT_DEFAULT_TYPE_MAP);
    this.register(defaultFieldConverters);
    this.parseDefaultTypeMap(defaultTypeMap);
    this.getConfig = getConfig;
    this.metaParamsOptions = metaParamsOptions;
  }

  /**
   * Get the id of the default type for this field type
   * using the format:defaultTypeMap config map
   *
   * @param  {OSD_FIELD_TYPES} fieldType - the field type
   * @param  {OPENSEARCH_FIELD_TYPES[]} esTypes - Array of OpenSearch data types
   * @return {FieldType}
   */
  getDefaultConfig = (
    fieldType: OSD_FIELD_TYPES,
    esTypes?: OPENSEARCH_FIELD_TYPES[]
  ): FieldFormatConfig => {
    const type = this.getDefaultTypeName(fieldType, esTypes);

    return (
      (this.defaultMap && this.defaultMap[type]) || { id: FIELD_FORMAT_IDS.STRING, params: {} }
    );
  };

  /**
   * Get a derived FieldFormat class by its id.
   *
   * @param  {FieldFormatId} formatId - the format id
   * @return {FieldFormatInstanceType | undefined}
   */
  getType = (formatId: FieldFormatId): FieldFormatInstanceType | undefined => {
    const fieldFormat = this.fieldFormats.get(formatId);

    if (fieldFormat) {
      const decoratedFieldFormat: any = this.fieldFormatMetaParamsDecorator(fieldFormat);

      if (decoratedFieldFormat) {
        return decoratedFieldFormat as FieldFormatInstanceType;
      }
    }

    return undefined;
  };

  getTypeWithoutMetaParams = (formatId: FieldFormatId): FieldFormatInstanceType | undefined => {
    return this.fieldFormats.get(formatId);
  };

  /**
   * Get the default FieldFormat type (class) for
   * a field type, using the format:defaultTypeMap.
   * used by the field editor
   *
   * @param  {OSD_FIELD_TYPES} fieldType
   * @param  {OPENSEARCH_FIELD_TYPES[]} esTypes - Array of OpenSearch data types
   * @return {FieldFormatInstanceType | undefined}
   */
  getDefaultType = (
    fieldType: OSD_FIELD_TYPES,
    esTypes?: OPENSEARCH_FIELD_TYPES[]
  ): FieldFormatInstanceType | undefined => {
    const config = this.getDefaultConfig(fieldType, esTypes);

    return this.getType(config.id);
  };

  /**
   * Get the name of the default type for OpenSearch types like date_nanos
   * using the format:defaultTypeMap config map
   *
   * @param  {OPENSEARCH_FIELD_TYPES[]} esTypes - Array of OpenSearch data types
   * @return {OPENSEARCH_FIELD_TYPES | undefined}
   */
  getTypeNameByOpenSearchTypes = (
    esTypes: OPENSEARCH_FIELD_TYPES[] | undefined
  ): OPENSEARCH_FIELD_TYPES | undefined => {
    if (!Array.isArray(esTypes)) {
      return undefined;
    }

    return esTypes.find((type) => this.defaultMap[type] && this.defaultMap[type].opensearch);
  };

  /**
   * Get the default FieldFormat type name for
   * a field type, using the format:defaultTypeMap.
   *
   * @param  {OSD_FIELD_TYPES} fieldType
   * @param  {OPENSEARCH_FIELD_TYPES[]} esTypes
   * @return {OPENSEARCH_FIELD_TYPES | OSD_FIELD_TYPES}
   */
  getDefaultTypeName = (
    fieldType: OSD_FIELD_TYPES,
    esTypes?: OPENSEARCH_FIELD_TYPES[]
  ): OPENSEARCH_FIELD_TYPES | OSD_FIELD_TYPES => {
    const opensearchType = this.getTypeNameByOpenSearchTypes(esTypes);

    return opensearchType || fieldType;
  };

  /**
   * Get the singleton instance of the FieldFormat type by its id.
   *
   * @param  {FieldFormatId} formatId
   * @return {FieldFormat}
   */
  getInstance = memoize(
    (formatId: FieldFormatId, params: Record<string, any> = {}): FieldFormat => {
      const ConcreteFieldFormat = this.getType(formatId);

      if (!ConcreteFieldFormat) {
        throw new FieldFormatNotFoundError(`Field Format '${formatId}' not found!`, formatId);
      }

      return new ConcreteFieldFormat(params, this.getConfig);
    },
    (formatId: FieldFormatId, params: Record<string, any> = {}) =>
      JSON.stringify({
        formatId,
        ...params,
      })
  );

  /**
   * Get the default fieldFormat instance for a field format.
   *
   * @param  {OSD_FIELD_TYPES} fieldType
   * @param  {OPENSEARCH_FIELD_TYPES[]} esTypes
   * @return {FieldFormat}
   */
  getDefaultInstancePlain = (
    fieldType: OSD_FIELD_TYPES,
    esTypes?: OPENSEARCH_FIELD_TYPES[],
    params: Record<string, any> = {}
  ): FieldFormat => {
    const conf = this.getDefaultConfig(fieldType, esTypes);
    const instanceParams = {
      ...conf.params,
      ...params,
    };

    return this.getInstance(conf.id, instanceParams);
  };
  /**
   * Returns a cache key built by the given variables for caching in memoized
   * Where opensearchType contains fieldType, fieldType is returned
   * -> OpenSearch Dashboards types have a higher priority in that case
   * -> would lead to failing tests that match e.g. date format with/without esTypes
   * https://lodash.com/docs#memoize
   *
   * @param  {OSD_FIELD_TYPES} fieldType
   * @param  {OPENSEARCH_FIELD_TYPES[]} esTypes
   * @return {String}
   */
  getDefaultInstanceCacheResolver(
    fieldType: OSD_FIELD_TYPES,
    esTypes?: OPENSEARCH_FIELD_TYPES[]
  ): string {
    // @ts-ignore
    return Array.isArray(esTypes) && esTypes.indexOf(fieldType) === -1
      ? [fieldType, ...esTypes].join('-')
      : fieldType;
  }

  /**
   * Get filtered list of field formats by format type
   *
   * @param  {OSD_FIELD_TYPES} fieldType
   * @return {FieldFormatInstanceType[]}
   */
  getByFieldType(fieldType: OSD_FIELD_TYPES): FieldFormatInstanceType[] {
    return [...this.fieldFormats.values()]
      .filter(
        (format: FieldFormatInstanceType) => format && format.fieldType.indexOf(fieldType) !== -1
      )
      .map(
        (format: FieldFormatInstanceType) =>
          this.fieldFormatMetaParamsDecorator(format) as FieldFormatInstanceType
      );
  }

  /**
   * Get the default fieldFormat instance for a field format.
   * It's a memoized function that builds and reads a cache
   *
   * @param  {OSD_FIELD_TYPES} fieldType
   * @param  {OPENSEARCH_FIELD_TYPES[]} esTypes
   * @return {FieldFormat}
   */
  getDefaultInstance = memoize(this.getDefaultInstancePlain, this.getDefaultInstanceCacheResolver);

  parseDefaultTypeMap(value: any) {
    this.defaultMap = value;
    forOwn(this, (fn) => {
      if (isFunction(fn) && (fn as any).cache) {
        // clear all memoize caches
        // @ts-ignore
        fn.cache = new memoize.Cache();
      }
    });
  }

  register(fieldFormats: FieldFormatInstanceType[]) {
    fieldFormats.forEach((fieldFormat) => this.fieldFormats.set(fieldFormat.id, fieldFormat));
  }

  /**
   * FieldFormat decorator - provide a one way to add meta-params for all field formatters
   *
   * @private
   * @param  {FieldFormatInstanceType} fieldFormat - field format type
   * @return {FieldFormatInstanceType | undefined}
   */
  private fieldFormatMetaParamsDecorator = (
    fieldFormat: FieldFormatInstanceType
  ): FieldFormatInstanceType | undefined => {
    const getMetaParams = (customParams: Record<string, any>) => this.buildMetaParams(customParams);

    if (fieldFormat) {
      return class DecoratedFieldFormat extends fieldFormat {
        static id = fieldFormat.id;
        static fieldType = fieldFormat.fieldType;

        constructor(params: Record<string, any> = {}, getConfig?: FieldFormatsGetConfigFn) {
          super(getMetaParams(params), getConfig);
        }
      };
    }

    return undefined;
  };

  /**
   * Build Meta Params
   *
   * @param  {Record<string, any>} custom params
   * @return {Record<string, any>}
   */
  private buildMetaParams = <T extends IFieldFormatMetaParams>(customParams: T): T => ({
    ...this.metaParamsOptions,
    ...customParams,
  });
}
