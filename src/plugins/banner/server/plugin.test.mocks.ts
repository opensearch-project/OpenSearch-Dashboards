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

// Mock the routes module
const mockDefineRoutes = jest.fn();

jest.mock('./routes/get_config', () => ({
  defineRoutes: mockDefineRoutes,
}));

export const defineRoutesMock = mockDefineRoutes;
