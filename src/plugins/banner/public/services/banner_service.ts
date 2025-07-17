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

import { BehaviorSubject } from 'rxjs';
import { BannerConfig } from '../../common';

export class BannerService {
  private bannerConfig$ = new BehaviorSubject<BannerConfig>({
    text: '',
    color: 'primary',
    iconType: '',
    isVisible: false,
    useMarkdown: false,
  });

  public setup(initialConfig: BannerConfig) {
    this.bannerConfig$.next(initialConfig);
  }

  public getBannerConfig$() {
    return this.bannerConfig$.asObservable();
  }

  public getCurrentConfig(): BannerConfig {
    return this.bannerConfig$.getValue();
  }

  public updateBannerConfig(config: Partial<BannerConfig>) {
    const newConfig = {
      ...this.bannerConfig$.getValue(),
      ...config,
    };
    this.bannerConfig$.next(newConfig);
  }
}
