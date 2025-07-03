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

import { HttpSetup } from '../../../../core/public';
import { BannerService } from './banner_service';

interface BannerApiResponse {
  enabled: boolean;
  content?: string;
  color?: 'primary' | 'success' | 'warning';
  iconType?: string;
  isVisible?: boolean;
  useMarkdown?: boolean;
}

export class BannerApiService {
  constructor(private readonly http: HttpSetup, private readonly bannerService: BannerService) {}

  /**
   * Fetches banner configuration from the API
   */
  public async fetchBannerConfig(): Promise<void> {
    try {
      const response = await this.http.get<BannerApiResponse>('/api/_plugins/_banner/content');

      if (response.enabled) {
        this.bannerService.updateBannerConfig({
          content: response.content,
          color: response.color,
          iconType: response.iconType,
          isVisible: response.isVisible !== undefined ? response.isVisible : false,
          useMarkdown: response.useMarkdown,
        });
      } else {
        this.bannerService.updateBannerConfig({
          isVisible: false,
        });
      }
    } catch (error) {
      // Hide banner on error
      this.bannerService.updateBannerConfig({
        isVisible: false,
      });
    }
  }
}
