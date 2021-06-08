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

interface PlainConfigItem {
  type: 'group' | 'color' | 'string' | 'boolean' | 'number';
  dflt?: any;
  min?: number;
  max?: number;
  reconfigurable?: boolean | string;
  values?: unknown;
  documentation?: string;
}

interface GroupConfigItem extends PlainConfigItem {
  type: 'group';
  values: Record<string, PlainConfigItem>;
}

// switching to `io-ts` style, generic way of combining static and runtime type info - 1st step
class Type<A> {
  dflt: A;

  reconfigurable: boolean | string;

  documentation: string;

  constructor(dflt: A, reconfigurable: boolean | string, documentation: string) {
    this.dflt = dflt;
    this.reconfigurable = reconfigurable;
    this.documentation = documentation;
  }
}

/** @internal */
export class Numeric extends Type<number> {
  min: number;

  max: number;

  type = 'number';

  constructor({
    dflt,
    min,
    max,
    reconfigurable,
    documentation,
  }: {
    dflt: number;
    min: number;
    max: number;
    reconfigurable: boolean | string;
    documentation: string;
  }) {
    super(dflt, reconfigurable, documentation);
    this.min = min;
    this.max = max;
  }
}

/** @internal */
export type ConfigItem = PlainConfigItem | Numeric;

function isGroupConfigItem(item: ConfigItem): item is GroupConfigItem {
  return item.type === 'group';
}

/** todo switch to `io-ts` style, generic way of combining static and runtime type info
 * @internal
 */
export function configMap<Conf>(mapper: (v: ConfigItem) => unknown, cfgMetadata: Record<string, ConfigItem>): Conf {
  return Object.assign(
    {},
    ...Object.entries(cfgMetadata).map(([k, v]: [string, ConfigItem]) => {
      if (isGroupConfigItem(v)) {
        return { [k]: configMap<Conf>(mapper, v.values) };
      }
      return { [k]: mapper(v) };
    }),
  );
}
