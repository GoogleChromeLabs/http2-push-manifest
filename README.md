# http2-push-manifest

A utility script for doing http2 push and/or preload. 

Generates a list of local static resources used in your web app by outputting a json
file. This file can be read by your web server to more easily construct the
appropriate `Link: <URL>; rel=preload` headers(s) for http2 push/preload.

## Install

    npm install --save-dev http2-push-manifest

## Run tests

    npm test

## What's a push manifest?

> A **manifest is not required by the HTTP2 protocol** but is useful
for telling your server what resources to push with your main page.* 

`http2-push-manifest` is a Node script for generating a JSON file listing
all of the static resources used on a page. It tries to discover the resources
in an .html file you specify. This file can be read by your web server to more
easily construct the appropriate `Link: <URL>; rel=preload` headers(s) used in
HTTP2 push.

By default, the script generates `push_manifest.json` in the top level directory
of your app with a mapping of `<URL>: <PUSH_PRIORITY>`. Feel free to add/remove
URLs from this list as necessary for your app or change the priority level.

Example of generated `push_manifest.json` with discovered resources:

    {
      "/css/app.css": 1,
      "/js/app.js": 1,
      "/bower_components/webcomponentsjs/webcomponents-lite.js": 1,
      "/bower_components/iron-selector/iron-selection.html": 1,
      ...
      "/elements.html": 1,
      "/elements.vulcanize.html": 1
    }

**Note**: right now the SPDY `<PUSH_PRIORITY>` is included, but it will be
deprecated in the future as the new HTTP2 standard does not include this field.

## Examples

**Example** - list all the static resources of `app/index.html` (including sub-HTML Imports):

    http2-push-manifest app index.html

**Example** - list all the resources in `static/elements/elements.html`:

    http2-push-manifest static/elements elements.html

**Example** - using a custom manifest filename:

    http2-push-manifest path/to/site index.html -m push.json
    http2-push-manifest path/to/site index.html --manifest push.json

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
