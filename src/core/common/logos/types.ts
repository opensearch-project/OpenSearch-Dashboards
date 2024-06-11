/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ColorScheme, ImageType } from './constants';

/**
 * @public
 */
export interface Logos {
  /**
   * @deprecated Use {@link Logos.Application} instead.
   */
  readonly OpenSearch: LogoItem;
  readonly Application: LogoItem;
  readonly Mark: LogoItem;
  /**
   * @deprecated Use {@link Logos.Mark} instead.
   */
  readonly CenterMark: LogoItem;
  readonly AnimatedMark: LogoItem;
  readonly colorScheme: ColorScheme;
}

export type LogoItem = ImageItem & Record<ColorScheme, ImageItem>;

export interface ImageItem {
  /**
   * The URL of the image
   */
  readonly url: string;
  readonly type: ImageType;
}
