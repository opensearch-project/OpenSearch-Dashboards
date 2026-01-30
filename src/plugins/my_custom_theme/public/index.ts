/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MyCustomThemePlugin } from './plugin';

export * from './components/button';
export * from './components/card';
export * from './components/header';
export * from './components/input';
export * from './components/sidebar';
export * from './theme/custom_theme';

export * from './components/my_test_dashboard';

export const plugin = () => new MyCustomThemePlugin();
