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

/* eslint-disable */

const $loading = $('#loadingDemo');
const $loaded = $('#loadedDemo');
let isLoading = true;

$loaded.hide();

setInterval(() => {
  if (isLoading) {
    isLoading = false;
    $loading.hide();
    $loaded.show();
  } else {
    isLoading = true;
    $loading.show();
    $loaded.hide();
  }
}, 2000);
