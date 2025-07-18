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

// Mock the render_banner module
const mockRenderBanner = jest.fn();
const mockUnmountBanner = jest.fn();

jest.mock('./render_banner', () => ({
  renderBanner: mockRenderBanner,
  unmountBanner: mockUnmountBanner,
}));

export const renderBannerMock = mockRenderBanner;
export const unmountBannerMock = mockUnmountBanner;
