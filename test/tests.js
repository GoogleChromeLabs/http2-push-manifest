'use strict';

// jshint node: true
let assert = require('assert');
let path = require('path');
let fs = require('fs');

const oldOld = console.log;
const EXPECTED_FILE = {
  "/css/app.css": {
    "weight": 1,
    "type": "style"
  },
  "/js/app.js": {
    "weight": 1,
    "type": "script"
  },
  "/doesntexist.json": {
    "weight": 1,
    "type": "script"
  },
  "/api/endpoint": {
    "weight": 1
  },
  "/subimport.html": {
    "weight": 1,
    "type": "document"
  },
  "/import.html": {
    "weight": 1,
    "type": "document"
  }
};

function muteLogger() {
  console.log = function() {}
}

function unmuteLogger() {
  console.log = oldOld;
}

function listresources(manifest) {
  muteLogger();
  return manifest.generate().then(output => {
    manifest.write();
    unmuteLogger();
    return output;
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

    listresources(manifest).then(output => {
      let name = manifest.DEFAULT_MANIFEST_NAME;
      let urls = Object.keys(EXPECTED_FILE);

      assert.equal(output.urls.length, urls.length, 'found all resources');

      fs.readFile(name, (err, data) => {
        if (err) {
          throw err;
        }

        var json = JSON.parse(data);

        assert.equal(JSON.stringify(json), JSON.stringify(output.file),
                     'Written file does not match .file property');


        assert(!json['https://example.com/json'], 'External files are left out');
        assert(EXPECTED_FILE['/doesntexist.json'], 'non-existent local resources are included');
        assert(EXPECTED_FILE['/api/endpoint'], 'url without file extension is included');

        // Node 4.2.1 doesn't support ...[] yet. Built ourself.
        let arr = urls.concat(Object.keys(json));
        let union = new Set(arr);
        assert.equal(union.size, urls.length, 'all resources written to file');

        // Node 4.2.1 doesn't support for...of
        for (let key in json) {
          assert('type' in json[key], '.type property exists for all urls');
          if (key === '/api/endpoint') {
            assert.equal(json[key].type, '', '.type is empty for urls without file extensions');
          }
        }

        fs.unlinkSync(name); // cleanup

        done();
      });
    }).catch(err => {
      console.log(err);
    });
  });

  test('custom manifest', function(done) {
    this.timeout(2000);

    let name = 'custom_manifest.json';
    let manifest = new PushManifest({
      basePath: BASE, inputPath: INPUT, name: name
    });

    assert.equal(manifest.name, name, 'custom manifest file name set');

    listresources(manifest).then(output => {
      assert(fs.statSync(name).isFile(), 'custom manifest written');
      fs.unlinkSync(name); // cleanup
      done();
    });

  });

});

suite('cli', () => {
  var exec = require('child_process').exec;

  let CMD =  `${__dirname}/../bin/http2-push-manifest`;
  let INPUT = `${__dirname}/html/basic.html`;
  let INPUT2 = `${__dirname}/html/basic2.html`;
  let NAME = 'push_manifest.json';

  function process(cmd, cb) {
    exec(cmd, (err, stdout, stderr) => {
      assert(!err, 'error running cli');
      cb(stdout);
    });
  }

  suiteSetup(() => {
    //manifest = new PushManifest({basePath: BASE, inputPath: INPUT});
  });

  test('single manifest', done => {
    process(`${CMD} -f ${INPUT}`, stdout => {
      assert(fs.statSync(NAME).isFile(), 'single file manifest written');
      fs.unlinkSync(NAME); // cleanup
      done();
    });
  });

  test('custom manifest', done => {
    let name = 'custom_manifest.json';
    process(`${CMD} -f ${INPUT} -m ${name}`, stdout => {
      assert(fs.statSync(name).isFile(), 'custom manifest written');
      fs.unlinkSync(name); // cleanup
      done();
    });
  });

  test('multi manifest', done => {
    process(`${CMD} -f ${INPUT} -f ${INPUT2}`,  stdout => {
      assert(fs.statSync(NAME).isFile(), 'multi file manifest written');

      fs.readFile(NAME, (err, data) => {
        assert(!err, 'error reading multi file manifest');

        var json = JSON.parse(data);

        // Check top-level keys are the input file names.
        assert(path.basename(INPUT) in json);
        assert(path.basename(INPUT2) in json);

        fs.unlinkSync(NAME); // cleanup

        done();
      });
    });
  });
});
