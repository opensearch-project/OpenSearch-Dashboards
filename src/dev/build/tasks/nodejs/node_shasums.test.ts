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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const mockResponse = `a65bd3fe91ffeb31d12a208e811943e3ebba4706553a4845a03d857beaeec51e  node-v99.99.99-aix-ppc64.tar.gz
82c7bb4869419ce7338669e6739a786dfc7e72f276ffbed663f85ffc905dcdb4  node-v99.99.99-darwin-arm64.tar.gz
b23cdf4fa0e9f77273720ab18eabdd7691edbb69e08ec3b65afd69bef23fe209  node-v99.99.99-darwin-arm64.tar.xz
cd520da6e2e89fab881c66a3e9aff02cb0d61d68104b1d6a571dd71bef920870  node-v99.99.99-darwin-x64.tar.gz
2c8aa0333111c2411564bfb85be44186aeb581392f73c4be5912cbb125d99043  node-v99.99.99-darwin-x64.tar.xz
effeb73616e5297922ed89a1b94d2664390040a83184504c1cc1305b0c0c853f  node-v99.99.99-headers.tar.gz
0eb9823c2cc72792c2d4413f57b5a36232e173d7edefb1909c37e364a823f9c7  node-v99.99.99-headers.tar.xz
dc3dfaee899ed21682e47eaf15525f85aff29013c392490e9b25219cd95b1c35  node-v99.99.99-linux-arm64.tar.gz
c81dfa0bada232cb4583c44d171ea207934f7356f85f9184b32d0dde69e2e0ea  node-v99.99.99-linux-arm64.tar.xz
a3968db44e5ae17243d126ff79b1756016b198f7cc94c6fad8522aac481b4ff3  node-v99.99.99-linux-armv7l.tar.gz
57ba6b71eb039fa896c329e68669b21f6717622c560c6f61a0c97d18ca866b2d  node-v99.99.99-linux-armv7l.tar.xz
b4e66dcda5ba4a3697be3fded122dabb6a677deee3d7f4d3c7c13ebb5a13844c  node-v99.99.99-linux-ppc64le.tar.gz
c43142fb9ef30658620ed095f8203beca92f469c1121eeb724df9a48bf0e59a5  node-v99.99.99-linux-ppc64le.tar.xz
a8b607c3c06f585c4fe9ba45be6dc76ce9459238c91b3f43533aa30344caed87  node-v99.99.99-linux-s390x.tar.gz
39b15c16347000b0be97133437bde0317dd2307d3fdfce15ddd8680b07a963ef  node-v99.99.99-linux-s390x.tar.xz
fc83046a93d2189d919005a348db3b2372b598a145d84eb9781a3a4b0f032e95  node-v99.99.99-linux-x64.tar.gz
44d93d9b4627fe5ae343012d855491d62c7381b236c347f7666a7ad070f26548  node-v99.99.99-linux-x64.tar.xz
156aa5b9580288fb0b3c6134eb8fac64e50745d78d33eebe9e29eb7ff87b8e1e  node-v99.99.99.pkg
6a4f5c5d76e5c50cef673099e56f19bc3266ae363f56ca0ab77dd2f3c5088c6d  node-v99.99.99.tar.gz
33d81a233e235a509adda4a4f2209008d04591979de6b3f0f67c1c906093f118  node-v99.99.99.tar.xz
007848640ba414f32d968d303e75d9841ecd2cd95d6fdd81f80bc3dcbd74ae44  node-v99.99.99-win-x64.7z
4b3bd4cb5570cc217490639e93a7e1b7a7a341981366661e514ce61941824a85  node-v99.99.99-win-x64.zip
681be28e0acd057b4798f357d21eec5f49e21bc803bbbefeb1072bb4f166025a  node-v99.99.99-win-x86.7z
2a7e0fb22e1a36144ee8183c80ef2705cd9754c1d894f94bb6c94a681de47924  node-v99.99.99-win-x86.zip
5bfb6f3ab89e198539408f7e0e8ec0b0bd5efe8898573ec05b381228efb45a5d  node-v99.99.99-x64.msi
09534d1949c795c3e49d257fb72a9fd865ee28955673b87d569d4aec541333e7  node-v99.99.99-x86.msi
b548a55c2b5ef5de34f4636610bab27077fb9313d34f52280b9ec11dd25e9dd1  win-x64/node.exe
72b7fab9381af8f4958c8212f3d4cdfff8c7c5b1e33eaad0e7d5888293568cd5  win-x64/node.lib
3b9474e18a1bbb38b05b1876b4b37056063c2af82212d356a8a5cf91c1a3acf3  win-x64/node_pdb.7z
6b506b1fe654ca7161373916c7ba7e38f62545236698342fa97fd2faf39ebc4e  win-x64/node_pdb.zip
36bf0f0a364ca8edc176776764831f9e88bef6d1e8056f6edc474a37b652a794  win-x86/node.exe
6a85c15a69238f0902b9a734d262bf36d211b273a46d5e3249857d4bb7f6d9b7  win-x86/node.lib
9256bdefae4491acfd523ca06d4f4344ddc4f1a28aac868b5efb6a72d8023e2a  win-x86/node_pdb.7z
53c6b29afd58904e5143d9f3298b55695b8ecb2b6c08a9612ed30e9b0ed9589a  win-x86/node_pdb.zip`;

jest.mock('axios', () => ({
  async get(url: string) {
    expect(url).toBe('https://nodejs.org/dist/v99.99.99/SHASUMS256.txt');
    return {
      status: 200,
      data: mockResponse,
    };
  },
}));

import { ToolingLog } from '@osd/dev-utils';
import { getNodeShasums } from './node_shasums';

describe('src/dev/build/tasks/nodejs/node_shasums', () => {
  it('resolves to an object with shasums for node downloads for version', async () => {
    const shasums = await getNodeShasums(new ToolingLog(), '99.99.99');
    expect(shasums).toEqual(
      expect.objectContaining({
        'node-v99.99.99-linux-x64.tar.gz':
          'fc83046a93d2189d919005a348db3b2372b598a145d84eb9781a3a4b0f032e95',
        'node-v99.99.99-linux-arm64.tar.gz':
          'dc3dfaee899ed21682e47eaf15525f85aff29013c392490e9b25219cd95b1c35',
        'node-v99.99.99-darwin-x64.tar.gz':
          'cd520da6e2e89fab881c66a3e9aff02cb0d61d68104b1d6a571dd71bef920870',
        'node-v99.99.99-darwin-arm64.tar.gz':
          '82c7bb4869419ce7338669e6739a786dfc7e72f276ffbed663f85ffc905dcdb4',
        'node-v99.99.99-win-x64.zip':
          '4b3bd4cb5570cc217490639e93a7e1b7a7a341981366661e514ce61941824a85',
      })
    );
  });
});
