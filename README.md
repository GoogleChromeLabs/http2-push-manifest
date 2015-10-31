[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![License][license-image]][license-url]

> A utility script for doing http2 push and/or preload. 

Generates a list of **local static resources** used in your web app by outputting a json
file. This file can be read by your web server to more easily construct the
appropriate `Link: <URL>; rel=preload; as=<TYPE>` headers(s) for http2 push/preload.

## Install

    npm install --save-dev http2-push-manifest

## Run tests

    npm run test

## What's a push manifest?

> A **manifest is not required by the HTTP2 protocol** but is useful
for telling your server what resources to push with your main page.* 

`http2-push-manifest` is a Node script for generating a JSON file listing
all of the static resources used on a page. It tries to discover the resources
in an .html file you specify. This file can be read by your web server to more
easily construct the appropriate `Link: <URL>; rel=preload` headers(s) used in
HTTP2 push.

By default, the script generates `push_manifest.json` in the top level directory
of your app with a mapping of `<URL>: <PUSH_PROPERTIES>`. Feel free to add/remove
URLs from this list as necessary for your app or change the priority level.

Example of generated `push_manifest.json` with discovered local resources:

    {
      "/css/app.css": {
        "type": "style",
        "weight": 1
      },
      "/js/app.js": {
        "type": "script",
        "weight": 1
      },
      "/bower_components/webcomponentsjs/webcomponents-lite.js": {
        "type": "script",
        "weight": 1
      },
      "/bower_components/iron-selector/iron-selection.html": {
        "type": "document",
        "weight": 1
      },
      ...
      "/elements.html": {
        "type": "document",
        "weight": 1
      },
      "/elements.vulcanize.html": {
        "type": "document",
        "weight": 1
      }
    }

**Note**: as of now, no browser implements control over the priority/weight level.

## Examples

**Example** - list all the static resources of `app/index.html` (including sub-HTML Imports):

    http2-push-manifest -f app/index.html

A single file produces the "single-file manifest format":

    {
      "/css/app.css": {
        "type": "style",
        "weight": 1
      },
      "/js/app.js": {
        "type": "script",
        "weight": 1
      },
      ...
    }

**Example** - list all the resources in `static/elements/elements.html`:

    http2-push-manifest -f static/elements/elements.html

**Example** - list all the resources app/index.html and page.html, and combine
into a singe manifest:

    http2-push-manifest -f app/index.html -f page.html

Using multiple files produces the "multi-file manifest format". Each key is the file
and it's sub-objects are the found resources. It would be up to your server to 
decide how the mappings of key -> actual URL work.

    {
      "index.html": {
        "/css/app.css": {
          "type": "style",
          "weight": 1
        },
        ...
      },
      "page.html": {
        "/css/page.css": {
          "type": "style",
          "weight": 1
        },
        ...
      }
    }

**Example** - using a custom manifest filename:

    http2-push-manifest -f path/to/site/index.html -m push.json
    http2-push-manifest -f path/to/site/index.html --manifest push.json

## Usage on App Engine

If you're using App Engine for your server, check out [http2push-gae](https://github.com/GoogleChrome/http2push-gae). It leverages this manifest file format and automagically reads
`push_mainfest.json`, setting the `Link: rel="preload"` header for you.

Simply decorate your request handler like so:

```python
class Handler(http2.PushHandler):

  @http2push.push('push_manifest.json')
  def get(self):
    # Resources in push_manifest.json will be server-pushed with this handler.
```

## License

[Apache 2.0](https://github.com/googlechrome/http2-push-manifest/blob/master/LICENSE) © 2015 Google Inc.

[npm-url]: https://www.npmjs.com/package/http2-push-manifest
[npm-image]: https://badge.fury.io/js/http2-push-manifest.svg
[travis-url]: https://travis-ci.org/GoogleChrome/http2-push-manifest
[travis-image]: https://travis-ci.org/GoogleChrome/http2-push-manifest.svg?branch=master
[daviddm-url]: https://david-dm.org/GoogleChrome/http2-push-manifest
[daviddm-image]: https://david-dm.org/GoogleChrome/http2-push-manifest.svg
[license-image]: https://img.shields.io/npm/l/http2-push-manifest.svg
[license-url]: LICENSE
