/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Observable } from 'rxjs';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { ChromeRecentlyAccessedHistoryItem } from '../recently_accessed';
import { InternalApplicationStart } from '../../application/types';
import { HttpStart } from '../../http';

/**
 * Services handed to a nav item's popover callbacks ({@link NavPopoverAction.onClick}
 * and {@link NavPopoverConfig.render}) so a plugin can drive actions or render
 * contextual content (e.g. recently visited dashboards, saved queries) without
 * re-resolving core services.
 *
 * @public
 */
export interface NavPopoverServices {
  /** Navigate to an application, optionally to a specific path within it. */
  navigateToApp: InternalApplicationStart['navigateToApp'];
  /** Base path helper for building app URLs. */
  basePath: HttpStart['basePath'];
  /** Http client for fetching contextual data. */
  http: HttpStart;
  /** Stream of the user's recently accessed items. */
  recentlyAccessed$: Observable<ChromeRecentlyAccessedHistoryItem[]>;
}

/**
 * A declarative action button shown in a nav item's hover popover. The `onClick`
 * is generic — a plugin may navigate, open a modal, open a flyout, or anything
 * else. Core only renders the button (icon + label) and invokes `onClick`.
 *
 * @public
 */
export interface NavPopoverAction {
  /** Stable id, used as React key and in the button's data-test-subj. */
  id: string;
  /** Button label. */
  label: string;
  /** Optional leading icon. */
  iconType?: EuiIconType | string;
  /** Invoked when the action button is clicked. */
  onClick: (services: NavPopoverServices) => void;
}

/**
 * Configures the hover popover for a nav item. `actions` are rendered uniformly
 * by core as a list of buttons; `render` is an escape hatch for fully custom
 * content (e.g. a list of recent assets) shown below the actions.
 *
 * @public
 */
export interface NavPopoverConfig {
  /** Declarative action buttons rendered at the top of the popover. */
  actions?: NavPopoverAction[];
  /** Custom popover content rendered below the actions. */
  render?: (services: NavPopoverServices) => React.ReactNode;
}
