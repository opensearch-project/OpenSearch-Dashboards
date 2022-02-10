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

// @ts-ignore
import { appendIconComponentCache } from '../node_modules/@elastic/eui/es/components/icon/icon';

/**
 * Loads nessecery icons to prevent loading vrt diff
 *
 * https://github.com/elastic/eui/blob/b2ffddee61913202224f2967599436ca95265879/src-docs/src/views/guidelines/getting_started.md#failing-icon-imports
 */
export const preloadIcons = () => {
  /* eslint-disable global-require, @typescript-eslint/no-var-requires */

  /*
   * See icon file name/path map
   * https://github.com/elastic/eui/blob/b2ffddee61913202224f2967599436ca95265879/src/components/icon/icon.tsx#L39
   */
  appendIconComponentCache({
    arrowUp: require('@elastic/eui/es/components/icon/assets/arrow_up').icon,
    arrowLeft: require('@elastic/eui/es/components/icon/assets/arrow_left').icon,
    arrowDown: require('@elastic/eui/es/components/icon/assets/arrow_down').icon,
    arrowRight: require('@elastic/eui/es/components/icon/assets/arrow_right').icon,
    iInCircle: require('@elastic/eui/es/components/icon/assets/iInCircle').icon,
    tokenKey: require('@elastic/eui/es/components/icon/assets/tokens/tokenKey').icon,
    filter: require('@elastic/eui/es/components/icon/assets/filter').icon,
    starFilled: require('@elastic/eui/es/components/icon/assets/star_filled').icon,
    pencil: require('@elastic/eui/es/components/icon/assets/pencil').icon,
    visualizeApp: require('@elastic/eui/es/components/icon/assets/app_visualize').icon,
  });

  /* eslint-enable global-require, @typescript-eslint/no-var-requires */
};
