/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiBadge } from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { Observable } from 'rxjs';

interface NavLinkBadgeProps {
  badge$: Observable<number | string | undefined>;
}

export function NavLinkBadge({ badge$ }: NavLinkBadgeProps) {
  const value = useObservable(badge$);
  if (value === undefined || value === 0 || value === '') return null;
  return <EuiBadge color="accent">{value}</EuiBadge>;
}
