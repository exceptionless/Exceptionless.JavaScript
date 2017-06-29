var fs = require("fs");
var pkg = require('./package.json');
var gulp = require('gulp');
var $ = require('gulp-load-plugins')({lazy:true });
var tsProject = require('tsproject');
var eventStream = require('event-stream');

gulp.task('clean', function () {
  var del = require('del');
  del.sync(['dist'], { force: true });
});

gulp.task('typescript', function () {
  return tsProject.src('src/tsconfig.json').pipe(gulp.dest('dist/temp'));
});

gulp.task('typescript.integrations', ['typescript'], function () {
  return tsProject.src('src/integrations/tsconfig.json').pipe(gulp.dest('dist/temp'));
});

gulp.task('typescript.node', function () {
  return tsProject.src('src/tsconfig.node.json').pipe(gulp.dest('dist/temp'));
});

gulp.task('typescript.universal', function () {
  return tsProject.src('src/tsconfig.universal.json').pipe(gulp.dest('dist/temp'));
});

gulp.task('exceptionless.umd', ['typescript', 'typescript.integrations'], function () {
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
});

gulp.task('exceptionless.universal.umd', ['typescript.universal'], function () {
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
});

gulp.task('exceptionless', ['exceptionless.umd'], function () {
  gulp.src('dist/temp/src/exceptionless.d.ts')
    .pipe(gulp.dest('dist'));
  var integrations = [
    'dist/temp/src/integrations/angular.js'
  ];

  gulp.src(integrations)
    .pipe(gulp.dest('dist/integrations'));

  var files = [
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
});

gulp.task('exceptionless.node', ['typescript.node'], function () {
  var files = [
    'dist/temp/src/exceptionless.node.js',
    'dist/temp/src/submitSync.js'
  ];

  gulp.src(files)
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.replace('exceptionless-js/1.0.0.0', 'exceptionless-node/' + pkg.version))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

gulp.task('exceptionless.universal', ['exceptionless.universal.umd'], function () {
  var files = [
    'node_modules/tracekit/tracekit.js',
    'dist/temp/exceptionless.universal.js'
  ];

  // NOTE: This is really hacky to replace require statements based on order..... but we need to ensure they are excluded for requirejs.
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
});

gulp.task('watch', ['build'], function () {
  gulp.watch('src/**/*.ts', ['build']);
});

gulp.task('lint', function () {
  return gulp.src(['src/**/*.ts'])
    .pipe($.tslint({ formatter: 'verbose' }))
    .pipe($.tslint.report());
});

gulp.task('build', ['clean', 'lint', 'exceptionless', 'exceptionless.node', 'exceptionless.universal']);

gulp.task('typescript.test', function () {
  return tsProject.src('src/tsconfig.test.json').pipe(gulp.dest('dist/temp'));
});

gulp.task('exceptionless.test.umd', ['typescript.test'], function () {
  var wrap = function(filename){
    return gulp.src(filename)
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.wrapUmd({
      exports: 'exports',
      globalName: 'exceptionless',
      namespace: 'exceptionless'
    }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('dist/temp'));
  };

  return eventStream.merge(
    wrap('dist/temp/src/exceptionless-nodespec.js'),
    wrap('dist/temp/src/exceptionless-browserspec.js'));
});

gulp.task('test-node', ['exceptionless.test.umd'], function(done) {
  return gulp.src('dist/temp/exceptionless-nodespec.js', { read: false })
    .pipe($.mocha({
      require: ['source-map-support/register'],
      timeout: 5000
    }))
    .once('end', function () {
      process.exit();
    });
});

gulp.task('test-browser', ['exceptionless.test.umd'], function(){
  return gulp
    .src('testrunner.html')
    .pipe($.mochaPhantomjs());
});

gulp.task('test', function(){
  // test-node calls process.exit(), so run browser tests before node tests
  var runSequence = require('run-sequence');
  runSequence('test-browser', 'test-node');
});

gulp.task('format', function () {
  return gulp.src(['src/**/*.ts'])
    .pipe($.exec('node_modules/typescript-formatter/bin/tsfmt -r <%= file.path %>'))
    .pipe($.exec.reporter());
});

gulp.task('default', ['watch', 'build', 'test']);
