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

/**
 * Version-compatibility HARD-BLOCK page.
 *
 * In non-production, the locked policy HARD-BLOCKS the whole page when any remote
 * is INCOMPATIBLE (`onIncompatible: 'block'`, the dev default) instead of booting
 * a broken app or white-screening: it renders a loud, explicit error listing the
 * offending remotes and the reasons they are incompatible, and the bootstrap does
 * NOT invoke core boot.
 *
 * This is intentionally PLAIN DOM (no React / EUI): a compatibility block can be
 * triggered precisely because the shared singletons are mismatched, so the block
 * page must not depend on them. It mirrors the inline `failure()` handler in
 * src/legacy/ui/ui_render/bootstrap/bootstrap_mfe.js.hbs (which also sets
 * `document.body` directly) so the look is consistent with the bootstrap's own
 * fatal-error screen. The `doc` parameter is injectable for unit testing.
 */

import { EvaluatedRemote } from './compat_enforcement';

/** The `id` of the block page's root container (stable for tests/assertions). */
export const COMPAT_BLOCK_ROOT_ID = 'osd_mfe_compat_block';

/**
 * Render the hard-block error page for a set of incompatible (offending) remotes.
 *
 * Replaces the document body with a clear message + a per-offender list of the
 * remote id and every reason it was rejected. Safe to call with an empty list
 * (it still renders the generic message), though the bootstrap only calls it when
 * there is at least one offender.
 *
 * @param offenders the remotes that triggered the block (id + reasons)
 * @param doc the document to render into (defaults to the global `document`)
 */
export function renderCompatBlockPage(
  offenders: EvaluatedRemote[],
  doc: Document = document
): void {
  const root = doc.createElement('div');
  root.id = COMPAT_BLOCK_ROOT_ID;
  root.setAttribute('data-test-subj', COMPAT_BLOCK_ROOT_ID);
  root.style.cssText =
    'font-family:monospace;color:#fff;background:#BD271E;padding:24px;line-height:1.5;';

  const heading = doc.createElement('h1');
  heading.style.cssText = 'margin:0 0 12px;font-size:20px;';
  heading.textContent =
    'OpenSearch Dashboards cannot start: incompatible micro-frontend(s) detected';
  root.appendChild(heading);

  const intro = doc.createElement('p');
  intro.style.cssText = 'margin:0 0 16px;';
  intro.textContent =
    'The following remote plugin(s) are not compatible with this version of OpenSearch ' +
    'Dashboards and the configured policy blocks startup (opensearchDashboards.mfe.compat.' +
    'onIncompatible = "block"). Update or redeploy the remote(s), or change the policy to ' +
    '"skip" to disable just the incompatible plugin(s) and boot the rest of the app.';
  root.appendChild(intro);

  const list = doc.createElement('ul');
  list.setAttribute('data-test-subj', `${COMPAT_BLOCK_ROOT_ID}_offenders`);
  list.style.cssText = 'margin:0;padding-left:20px;';
  for (const offender of offenders) {
    const item = doc.createElement('li');
    item.style.cssText = 'margin:0 0 8px;';

    const name = doc.createElement('strong');
    name.textContent = `${offender.id} (${offender.compatibility})`;
    item.appendChild(name);

    if (offender.reasons.length > 0) {
      const reasons = doc.createElement('ul');
      reasons.style.cssText = 'margin:4px 0 0;padding-left:20px;font-weight:normal;';
      for (const reason of offender.reasons) {
        const reasonItem = doc.createElement('li');
        reasonItem.textContent = reason;
        reasons.appendChild(reasonItem);
      }
      item.appendChild(reasons);
    }

    list.appendChild(item);
  }
  root.appendChild(list);

  // Replace the page contents with ONLY the block page (the app must not boot).
  doc.body.innerHTML = '';
  doc.body.appendChild(root);
}
