/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { Bucket } from '../../../components/fields_selector/types';

/**
 * Session-level facet values for the fields panel, published by the Sessions tab.
 * Null while loading or when the tab is not mounted.
 */
export const sessionFacetBuckets$ = new BehaviorSubject<Record<string, Bucket[]> | null>(null);
