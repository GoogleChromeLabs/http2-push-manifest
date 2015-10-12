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
var hyd = require('hydrolysis');
var dom5 = require('dom5');
var url = require('url');
var path = require('path');


var EXTERNAL = /^(?:https?:)?\/\//;

class ResourceList {

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
    loader.addResolver(new hyd.FSResolver({
      root: this.basePath,
      basePath: '/'
    }));
    loader.addResolver(new hyd.NoopResolver(EXTERNAL));

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
    var src = dom5.getAttribute(style, 'href');
    if (EXTERNAL.test(src)) {
      return;
    }
    if (src) {
      return url.resolve(href, src);
    }
  }

  scriptToUrl(href, script) {
    var src = dom5.getAttribute(script, 'src');
    if (EXTERNAL.test(src)) {
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
      var u = this.scriptToUrl(tree.href, script);
      if (u) {
        accum.push(u);
      }
    });
    tree.html.style.forEach(style => {
      var u = this.styleToUrl(tree.href, style);
      if (u) {
        accum.push(u);
      }
    });
    return accum;
  }

  list() {
    return this.analyzer.metadataTree(this.inputPath).then(tree => {
      var list = this.treeToUrls(tree).slice(1).reverse();
      return list;
    }).catch(err => {
      console.log(err);
    });
  }
}

module.exports = ResourceList;
