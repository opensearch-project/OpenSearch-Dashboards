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

const { strip } = require('comment-stripper');
const sass = require('node-sass');
const postcss = require('postcss');
const postcssConfig = require('@osd/optimizer/postcss.config.js');

module.exports = function (grunt) {
  grunt.initConfig({
    clean: {
      target: ['target'],
    },
    copy: {
      makeProdBuild: {
        expand: true,
        src: [
          'components/**/*',
          'dist/**/*',
          'src/**/*',
          'package.json',
          '!**/*.test.js',
          '!**/__snapshots__/**/*',
        ],
        dest: 'target',
      },
    },
    babel: {
      prodBuild: {
        expand: true,
        src: ['target/components/**/*.js', 'target/src/**/*.js'],
        dest: '.',
        options: {
          presets: [require.resolve('@osd/babel-preset/webpack_preset')],
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('prodBuild', ['clean:target', 'copy:makeProdBuild', 'babel:prodBuild']);

  grunt.registerTask('compileCss', function () {
    const done = this.async();
    Promise.all([
      uiFrameworkCompile('src/kui_light.scss', 'dist/kui_light.css'),
      uiFrameworkCompile('src/kui_dark.scss', 'dist/kui_dark.css'),
      uiFrameworkCompile('src/kui_next_light.scss', 'dist/kui_next_light.css'),
      uiFrameworkCompile('src/kui_next_dark.scss', 'dist/kui_next_dark.css'),
    ]).then(done);
  });

  function uiFrameworkCompile(src, dest) {
    return new Promise((resolve) => {
      sass.render(
        {
          file: src,
        },
        function (error, result) {
          if (error) {
            grunt.log.error(error);
          }

          postcss([postcssConfig])
            .process(strip(result.css.toString('utf8'), { language: 'css' }), {
              from: src,
              to: dest,
            })
            .then((result) => {
              grunt.file.write(dest, result.css);

              if (result.map) {
                grunt.file.write(`${dest}.map`, result.map);
              }

              resolve();
            });
        }
      );
    });
  }
};
