#!/usr/bin/env node
'use strict';
const browserSync = require('browser-sync').create();
const fs = require('fs');
const path = require('path');

let log = () => {};
let debug = () => {};
// log = debug = console.log.bind(console);

class BSCli {
  constructor() {
    this.rootDir = '.';
    this.watchFiles = ['*.html', '*.css', '*.jpg', '*.svg'];
    this.watchOptions = {};
  }

  run() {
    const argv = require('minimist')(process.argv.slice(2), {
      boolean: ['verbose'],
      string: ['root', 'watch'],
      alias: {
        r: 'root',
        v: 'verbose',
        w: 'watch',
      },
    });
    if (argv.root) this.rootDir = argv.root;
    if (argv.verbose) log = console.log.bind(console);
    if (argv.watch) this.watchFiles = argv.watch.split(',');

    this.rootDir = path.resolve(this.rootDir);
    this.startPath = path.resolve(argv._[0]);
    this.startUrl = this.toUrl(this.startPath);
    let startPathComponents = path.parse(this.startPath);
    this.watchFiles = this.watchFiles.map(f => path.resolve(startPathComponents.dir, f));

    const config = {
      files: this.watchFiles,
      watchOptions: this.watchOptions,
      server: {
        baseDir: this.rootDir,
        directory: true,
        middleware: [new Preview(this.rootDir).createMiddleware()],
      },
      startPath: this.startUrl,
    };
    log(config);
    browserSync.init(config);
  }

  toUrl(file) {
    return '/' + path.relative(this.rootDir, file);
  }
}

class Preview {
  constructor(rootDir) {
    this.contents = {};
    this.rootDir = rootDir;
  }

  createMiddleware() {
    return this.middleware.bind(this);
  }

  middleware(req, res, next) {
    debug('middleware:', req.url);
    let content = this.getContent(req.url);
    if (content) {
      res.write(content);
      res.end();
      debug('middleware end');
      return;
    }
    next();
  }

  getContent(url) {
    debug('getContent:', url);
    let content = this.contents[url];
    if (content)
      return content;
    let ext = path.extname(url);
    if (ext == '.bs')
      return this.preprocess(url, bs2html);
    if (ext == '.dot')
      return this.preprocess(url, dot2html);
    return null;
  }

  setContent(url, content) {
    debug('setContent:', url, content.substr(0, 50));
    this.contents[url] = content;
  }

  setContentAsync(url, promise) {
    return promise.then(content => {
      debug('content resolved', content.substr(0, 50));
      this.setContent(url, content);
      browserSync.reload(url);
    });
  }

  toPath(url) {
    return path.join(this.rootDir, url);
  }

  preprocess(url, func) {
    let source = this.toPath(url);
    debug('preprocess:', url, source);
    let loadingContent = `<!DOCTYPE html><body>Generating ${url}...</body>`;
    this.setContent(url, loadingContent);
    browserSync.watch(source).on('change', source => {
      browserSync.notify(`Generating ${url}...`);
      this.setContentAsync(url, func(source));
    });
    // TODO: Not sure why first reload fails without this timeout.
    setTimeout(() => {
      this.setContentAsync(url, func(source));
    }, 500);
    return loadingContent;
  }
}

function bs2html(source) {
  const bikeshed =
    fs.existsSync('../bikeshed-js') ? require('../bikeshed-js') :
    require('bikeshed-js');
  return bikeshed(source, '-');
}

function dot2html(source) {
  const spawn = require('child_process').spawn;
  let child = spawn('dot', ['-Tsvg', source]);
  // TODO: Need to check child.error in addition to stdout?
  //child.on("error", error => callback(null, error));
  return readToEndAsync(child.stdout).then(content => {
    // Convert SVG to HTML.
    content = '<!DOCTYPE html>\n<body>\n' + content + '</body>\n';
    return content;
  });
}

function readToEndAsync(stream) {
  debug('readToEndAsync');
  return new Promise(function (resolve, reject) {
    let buffer = [];
    stream
      .on('data', data => {
        debug('readToEndAsync: data', data);
        buffer.push(data);
      }).on('error', error => {
        debug('readToEndAsync: error', error);
        reject(error);
      }).on('end', () => {
        debug('readToEndAsync: end');
        resolve(buffer.join(''));
      }).on('finish', () => {
        debug('readToEndAsync: finish');
        resolve(buffer.join(''));
      });
  });
}

new BSCli().run();
