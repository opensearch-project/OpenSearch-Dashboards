/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This class extends URL and provides a hashSearchParams
 * for convinience, and OSD is using an unstandard querystring
 * in which the querystring won't be encoded. Thus we need to implement
 * a map for CRUD of the search params instead of using URLSearchParams
 */
export class HashURL extends URL {
  public get hashSearchParams(): Map<string, string> {
    const reg = /\?(.*)/;
    const matchedResult = this.hash.match(reg);
    const queryMap = new Map<string, string>();
    const queryString = matchedResult ? matchedResult[1] : '';
    const params = queryString.split('&');
    for (const param of params) {
      const [key, value] = param.split('=');
      if (key && value) {
        queryMap.set(key, value);
      }
    }
    return queryMap;
  }
  public set hashSearchParams(searchParams: Map<string, string>) {
    const params: string[] = [];

    searchParams.forEach((value, key) => {
      params.push(`${key}=${value}`);
    });

    const tempSearchValue = params.join('&');
    const tempHash = `${this.hash.replace(/^#/, '').replace(/\?.*/, '')}${
      tempSearchValue ? '?' : ''
    }${tempSearchValue}`;
    if (tempHash) {
      this.hash = tempHash;
    }
  }
}
