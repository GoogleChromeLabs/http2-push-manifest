/**
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// jshint node: true
'use strict';


var fs = require('fs');
var ResourceList = require('./listresources');


class PushManifest {

  // TODO: node 4.1.2 doesn't support default function args yet.
  constructor(opts) {
    opts = opts || {};

    this.name = opts.name || this.DEFAULT_MANIFEST_NAME;
    this.basePath = opts.basePath;
    this.inputPath = opts.inputPath;

    this.resourceList = new ResourceList(opts);
  }

  get DEFAULT_MANIFEST_NAME() {
    return 'push_manifest.json';
  }

  get PUSH_PRIORITY() {
    return 1; // TODO: this gives every resource priority 1.
  }

  /**
   * Generates and writes the push manifest file.
   *
   * @return {Promise} The list of urls found.
   */
  generate() {
    return this.resourceList.list().then(urls => {
      console.log('Found these resource URLs in this app:');

      /* jshint ignore:start */
      for (let i = 0, url; url = urls[i]; ++i) {
        console.log('  ', url);
      }
      /* jshint ignore:end */

      let priorityMapping = {};
      urls.map((url, i) => priorityMapping[url] = this.PUSH_PRIORITY);

      let fileContent = JSON.stringify(priorityMapping, null, 2);
      fs.writeFile(this.name, fileContent, err => {
        if (err) {
          return console.log(err);
        }
      });

      return urls;
    });
  }

}

module.exports = PushManifest;
