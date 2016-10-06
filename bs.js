#!/usr/bin/env node
const bs = require('browser-sync').create();
const fs = require('fs');
const path = require('path');

const argv = require('minimist')(process.argv.slice(2), {
  boolean: ['verbose'],
  string: ['root', 'watch'],
  alias: {
    r: 'root',
    v: 'verbose',
    w: 'watch',
  },
});
const log = argv.verbose ? console.log.bind(console) : () => {};
let rootDir = path.resolve(argv.root || '.');
let startPath = path.resolve(argv._[0]);
let watchFiles = (argv.watch || '*').split(',');
let watchOptions = {};

let startPathComponents = path.parse(startPath);
watchFiles = watchFiles.map(f => path.resolve(startPathComponents.dir, f));

if (startPathComponents.ext === '.bs') {
  const bikeshed =
    fs.existsSync('../bikeshed-js') ? require('../bikeshed-js') :
    require('bikeshed-js');
  bs.watch(startPath).on('change', (path) => {
    bs.notify(`Running bikeshed on: ${path}`);
    bikeshed(path);
  });
  watchOptions.ignored = startPath;
  startPath = bikeshed.getTargetPath(startPath);
}

startPath = path.relative(rootDir, startPath);
const config = {
  files: watchFiles,
  watchOptions: watchOptions,
  server: {
    baseDir: rootDir,
    directory: true,
  },
  startPath: startPath,
};
log(config);
bs.init(config);
