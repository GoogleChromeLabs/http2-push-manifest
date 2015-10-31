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

let fs = require('fs');
let hyd = require('hydrolysis');
let dom5 = require('dom5');
let url = require('url');
let path = require('path');

/**
 * Swallows errors from Hydrolysis so ENOENT files don't throw errors.
 * @class
 * @extends {hydrolysis.FSResolver}
 */
class ErrorSwallowingFSResolver extends hyd.FSResolver {
  constructor(config) {
    super(config);
  }

  accept(uri, deferred) {
    var reject = deferred.reject;
    deferred.reject = arg => deferred.resolve('');
    return super.accept(uri, deferred);
  }
}


/**
 * Finds and collects the static resources in a page.
 * @class
 */
class ResourceList {

  static get EXTERNAL_RESOURCE() {
    return /^(?:https?:)?\/\//;
  }

  constructor(opts) {
    this.basePath = opts.basePath;

    let inputPath = opts.inputPath;

    if (!inputPath || !this.basePath) {
      console.error('Need input path!');
      process.exit(1);
    }

    this.basePath = path.resolve(this.basePath);
    inputPath = path.resolve(path.resolve(this.basePath, inputPath));

    if (fs.statSync(inputPath).isDirectory()) {
      inputPath = path.join(inputPath, 'index.html');
    }

    let loader = new hyd.Loader();
    loader.addResolver(new ErrorSwallowingFSResolver({
      root: this.basePath,
      basePath: '/'
    }));

    // Ignore external resources.
    loader.addResolver(new hyd.NoopResolver(ResourceList.EXTERNAL_RESOURCE));

    this.analyzer = new hyd.Analyzer(false, loader);

    this.inputPath = path.join('/', path.relative(this.basePath, inputPath));
  }

  treeToList(tree, accum) {
    if (!accum) {
      accum = [];
    }
    accum.push(tree.href);
  }

  styleToUrl(href, style) {
    let src = dom5.getAttribute(style, 'href');
    if (ResourceList.EXTERNAL_RESOURCE.test(src)) {
      return;
    }
    if (src) {
      return url.resolve(href, src);
    }
  }

  scriptToUrl(href, script) {
    let src = dom5.getAttribute(script, 'src');
    if (ResourceList.EXTERNAL_RESOURCE.test(src)) {
      return;
    }
    if (src) {
      return url.resolve(href, src);
    }
  }

  treeToUrls(tree, accum) {
    if (!accum) {
      accum = [];
    }
    if (!tree) {
      return accum;
    }
    if (!tree.href) {
      return accum;
    }
    accum.push(tree.href);
    tree.imports.forEach(im => {
      if (im.href) {
        this.treeToUrls(im, accum);
      }
    });
    tree.html.script.forEach(script => {
      let u = this.scriptToUrl(tree.href, script);
      if (u) {
        accum.push(u);
      }
    });
    tree.html.style.forEach(style => {
      let u = this.styleToUrl(tree.href, style);
      if (u) {
        accum.push(u);
      }
    });
    return accum;
  }

  list() {
    return this.analyzer.metadataTree(this.inputPath).then(tree => {
      let list = this.treeToUrls(tree).slice(1).reverse();
      return list;
    }).catch(err => {
      console.error(err);
    });
  }
}

module.exports = ResourceList;
