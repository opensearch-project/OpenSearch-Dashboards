/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TopNavMenuButtonData, TopNavMenuIconData } from '../../../../../navigation/public';

export type TopNavMenuIconUIData = Omit<TopNavMenuIconData, 'run'>;
export type TopNavMenuIconRun = Required<TopNavMenuIconData>['run'];
export type TopNavMenuButtonUIData = Omit<TopNavMenuButtonData, 'run'>;
