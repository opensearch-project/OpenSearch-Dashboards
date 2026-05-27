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

import { GenericFtrProviderContext } from '@osd/test/types/ftr';

import { services } from '../api_integration/services';

export type FtrProviderContext = GenericFtrProviderContext<typeof services, {}>;
