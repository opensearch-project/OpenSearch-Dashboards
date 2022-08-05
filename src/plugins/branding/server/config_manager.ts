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

import { PluginInitializerContext } from 'opensearch-dashboards/server';
import { TypeOf } from '@osd/config-schema';
import { configSchema } from '../config';

export class ConfigManager {
  private markDefaultUrl?:string;
  private markDarkmodeUrl?:string;
  private logoDefaultUrl?:string;
  private logoDarkmodeUrl?:string;
  private loadingLogoDefaultUrl?:string;
  private loadingLogoDarkmodeUrl?:string;
  private faviconUrl?:string;
  private applicationTitle?:string;
  private useExpandedHeader?:boolean;

  constructor(config: PluginInitializerContext['config']) {
    config.create<TypeOf<typeof configSchema>>().subscribe((configUpdate) => {
      this.markDefaultUrl = configUpdate.mark.defaultUrl;
      this.markDarkmodeUrl = configUpdate.mark.darkModeUrl;
      this.logoDefaultUrl = configUpdate.logo.defaultUrl;
      this.logoDarkmodeUrl = configUpdate.logo.darkModeUrl;
      this.loadingLogoDefaultUrl = configUpdate.loadingLogo.defaultUrl;
      this.loadingLogoDarkmodeUrl = configUpdate.loadingLogo.darkModeUrl;
      this.faviconUrl = configUpdate.faviconUrl;
      this.applicationTitle = configUpdate.applicationTitle;
      this.useExpandedHeader = configUpdate.useExpandedHeader;
    })
  }

  getMark() {
    const defaultUrl = this.markDefaultUrl;
    const darkUrl = this.markDarkmodeUrl;
    return {defaultUrl, darkUrl};
  }

  getLogo() {
    const defaultUrl = this.logoDefaultUrl;
    const darkUrl = this.logoDarkmodeUrl;
    return {defaultUrl, darkUrl};
  }

  getLoadingLogo() {
    const defaultUrl = this.loadingLogoDefaultUrl;
    const darkUrl = this.loadingLogoDarkmodeUrl;
    return {defaultUrl, darkUrl};
  }

  getFavicon(){
    return this.faviconUrl;
  }

  getApplicationTitle(){
    return this.applicationTitle;
  }

  getExpandedHeader(){
    return this.useExpandedHeader;
  }
}
