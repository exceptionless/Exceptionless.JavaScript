/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require("fs");
const pkg = require('./package.json');
const gulp = require('gulp');
const $ = require('gulp-load-plugins')({ lazy: true });
const eslint = require('gulp-eslint');
const tsProject = require('tsproject');

gulp.task('clean', function clean(done) {
  const del = require('del');
  del.sync(['dist'], { force: true });
  done();
});

gulp.task('typescript', function typescript(done) {
  const stream = tsProject.src('src/tsconfig.json').pipe(gulp.dest('dist/temp'));
  stream.on('finish', done);
});

gulp.task('typescript.integrations', gulp.series('typescript', function typescriptIntegrations(done) {
  const stream = tsProject.src('src/integrations/tsconfig.json').pipe(gulp.dest('dist/temp'));
  stream.on('finish', done);
}));

gulp.task('typescript.node', function typescriptNode(done) {
  const stream = tsProject.src('src/tsconfig.node.json').pipe(gulp.dest('dist/temp'));
  stream.on('finish', done);
});

gulp.task('typescript.universal', function typescriptUniversal(done) {
  const stream = tsProject.src('src/tsconfig.universal.json').pipe(gulp.dest('dist/temp'));
  stream.on('finish', done);
});

gulp.task('exceptionless.umd', gulp.series('typescript.integrations', function exceptionlessUmd() {
  return gulp.src('dist/temp/src/exceptionless.js')
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.wrapUmd({
      exports: 'exports',
      globalName: 'exceptionless',
      namespace: 'exceptionless',
      deps: ['TraceKit'],
      template: fs.readFileSync('./umd.template.jst', 'utf8')
    }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist/temp'));
}));

gulp.task('exceptionless.universal.umd', gulp.series('typescript.universal', function universalUmd() {
  return gulp.src('dist/temp/src/exceptionless.universal.js')
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.wrapUmd({
      exports: 'exports',
      globalName: 'exceptionless',
      namespace: 'exceptionless',
      deps: ['TraceKit'],
      template: fs.readFileSync('./umd.template.jst', 'utf8')
    }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist/temp'));
}));

gulp.task('exceptionless', gulp.series('exceptionless.umd', function exceptionless() {
  gulp.src('dist/temp/src/exceptionless.d.ts')
    .pipe(gulp.dest('dist'));
  const integrations = [
    'dist/temp/src/integrations/angular.js'
  ];

  gulp.src(integrations)
    .pipe(gulp.dest('dist/integrations'));

  const files = [
    'node_modules/tracekit/tracekit.js',
    'dist/temp/exceptionless.js'
  ];

  gulp.src(files)
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.concat('exceptionless.js'))
    .pipe($.replace('exceptionless-js/1.0.0.0', 'exceptionless-js/' + pkg.version))
    .pipe($.replace('var TraceKit = require("TraceKit");\n', ''))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));

  return gulp.src(files)
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.concat('exceptionless.min.js'))
    .pipe($.replace('exceptionless-js/1.0.0.0', 'exceptionless-js/' + pkg.version))
    .pipe($.replace('var TraceKit = require("TraceKit");\n', ''))
    .pipe($.uglify({ output: { beautify: false } }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
}));

gulp.task('exceptionless.node', gulp.series('typescript.node', function node() {
  const files = [
    'dist/temp/src/exceptionless.node.js',
    'dist/temp/src/submitSync.js'
  ];

  return gulp.src(files)
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.replace('exceptionless-js/1.0.0.0', 'exceptionless-node/' + pkg.version))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
}));

gulp.task('exceptionless.universal', gulp.series('exceptionless.universal.umd', function universal() {
  const files = [
    'node_modules/tracekit/tracekit.js',
    'dist/temp/exceptionless.universal.js'
  ];

  // HACK: We need to replace require statements based on order..... but we need to ensure they are excluded for requirejs.
  gulp.src(files)
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.concat('exceptionless.universal.js'))
    .pipe($.replace('exceptionless-js/1.0.0.0', 'exceptionless-universal-js/' + pkg.version))
    .pipe($.replace('var TraceKit = require("TraceKit");', 'if (typeof process !== \'undefined\') {'))
    .pipe($.replace('var url = require("url");', 'var url = require("url");\n}'))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));

  return gulp.src(files)
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.concat('exceptionless.universal.min.js'))
    .pipe($.replace('exceptionless-js/1.0.0.0', 'exceptionless-universal-js/' + pkg.version))
    .pipe($.replace('var TraceKit = require("TraceKit");', 'if (require && typeof process !== \'undefined\') {'))
    .pipe($.replace('var url = require("url");', 'var url = require("url");\n}'))
    .pipe($.uglify({ output: { beautify: false } }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
}));

gulp.task('lint', function lint() {
  return gulp.src(['src/**/*.ts'])
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task('build', gulp.series('clean', 'lint', 'exceptionless.node', 'exceptionless.universal', 'exceptionless'));

gulp.task('watch', gulp.series('build', function watch() {
  return gulp.watch('src/**/*.ts', gulp.series('build'));
}));

gulp.task('format', function format() {
  return gulp.src(['src/**/*.ts'])
    .pipe($.exec(file => `node_modules/typescript-formatter/bin/tsfmt -r ${file.path}`))
    .pipe($.exec.reporter());
});

gulp.task('default', gulp.series('watch'));
