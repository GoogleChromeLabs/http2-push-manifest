'use strict';

// jshint node: true
let assert = require('assert');
let fs = require('fs');

const oldOld = console.log;

function muteLogger() {
  console.log = function() {}
}

function unmuteLogger() {
  console.log = oldOld;
}

function listresources(manifest) {
  muteLogger();
  return manifest.generate().then(list => {
    unmuteLogger();
    return list;
  });
}

suite('manifest.js', () => {

  let PushManifest = require('../lib/manifest.js');

  let BASE = __dirname + '/html';
  let INPUT = 'basic.html';

  let manifest = null;

  suiteSetup(() => {
    manifest = new PushManifest({basePath: BASE, inputPath: INPUT});
  });

  test('defaults', done => {
    assert.equal(manifest.DEFAULT_MANIFEST_NAME,
                 'push_manifest.json', 'default manifest file name');
    assert.equal(manifest.name, manifest.DEFAULT_MANIFEST_NAME,
                 'default manifest file set');
    assert.equal(manifest.basePath, BASE, 'basePath set');
    assert.equal(manifest.inputPath, INPUT, 'default inputPath set');
    done();
  });

  test('list resources', done => {
    let fs = require('fs');

    var expectedFileOutput = {
      '/css/app.css': 1,
      '/js/app.js': 1,
      '/subimport.html': 1,
      '/import.html': 1
    };

    listresources(manifest).then(list => {
      var name = manifest.DEFAULT_MANIFEST_NAME;

      assert.equal(
          list.length, Object.keys(expectedFileOutput).length,
          'found all resources');

      fs.readFile(name, (err, data) => {
        if (err) {
          throw err;
        }
        // Node 4.2.1 doesn't support ...[] yet. Built ourself.
        var arr = Object.keys(expectedFileOutput).concat(
            Object.keys(JSON.parse(data)));
        let union = new Set(arr);
        assert.equal(
            union.size, Object.keys(expectedFileOutput).length,
            'all resources written to file');

        fs.unlinkSync(name); // cleanup

        done();
      });
    });
  });

  test('custom manifest', function(done) {
    let name = 'custom_manifest.json';
    let manifest = new PushManifest({
      basePath: BASE, inputPath: INPUT, name: name
    });

    assert.equal(manifest.name, name, 'custom manifest file name set');

    listresources(manifest).then(list => {
      assert(fs.statSync(name).isFile(), 'custom manifest written');
      fs.unlinkSync(name); // cleanup
      done();
    });

  });

});
