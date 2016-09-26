var fs = require("fs");
var pkg = require('./package.json');
var gulp = require('gulp');
var replace = require('gulp-replace');
var sourcemaps = require('gulp-sourcemaps');
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

gulp.task('exceptionless.umd', ['typescript', 'typescript.integrations'], function () {
  var umd = require('gulp-wrap-umd');
  return gulp.src('dist/temp/src/exceptionless.js')
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(umd({
      exports: 'exports',
      globalName: 'exceptionless',
      namespace: 'exceptionless',
      deps: ['TraceKit'],
      template: fs.readFileSync('./umd.template.jst', 'utf8')
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/temp'));
});

gulp.task('exceptionless', ['exceptionless.umd'], function () {
  var uglify = require('gulp-uglify');
  var concat = require('gulp-concat');

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
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(concat('exceptionless.js'))
    .pipe(replace('exceptionless-js/1.0.0.0', 'exceptionless-js/' + pkg.version))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));

  return gulp.src(files)
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(concat('exceptionless.min.js'))
    .pipe(replace('exceptionless-js/1.0.0.0', 'exceptionless-js/' + pkg.version))
    .pipe(uglify({ output: { beautify: false } }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'))
});

gulp.task('exceptionless.node', ['typescript.node'], function () {

  var files = [
    'dist/temp/src/exceptionless.node.js',
    'dist/temp/src/submitSync.js'
  ];

  gulp.src(files)
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(replace('exceptionless-js/1.0.0.0', 'exceptionless-node/' + pkg.version))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', ['build'], function () {
  gulp.watch('src/**/*.ts', ['build']);
});

gulp.task('lint', function () {
  var tslint = require('gulp-tslint');
  return gulp.src(['src/**/*.ts', '!src/typings/**/*.ts'])
    .pipe(tslint({ formatter: 'verbose' }))
    .pipe(tslint.report());
});

gulp.task('build', ['clean', 'lint', 'exceptionless', 'exceptionless.node']);

gulp.task('typescript.test', function () {
  return tsProject.src('src/tsconfig.test.json').pipe(gulp.dest('dist/temp'));
});

gulp.task('exceptionless.test.umd', ['typescript.test'], function () {
  var umd = require('gulp-wrap-umd');

  var wrap = function(filename){
    return gulp.src(filename)
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(umd({
      exports: 'exports',
      globalName: 'exceptionless',
      namespace: 'exceptionless'
    }))
    .pipe(replace('}(this, function(require, exports, module) {', '}(this, function(require, exports, module) {\nif (!exports) {\n\tvar exports = {};\n}\n'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/temp'));
  };

  return eventStream.merge(
    wrap('dist/temp/src/exceptionless-nodespec.js'), 
    wrap('dist/temp/src/exceptionless-browserspec.js'));
});

gulp.task('test-node', ['exceptionless.test.umd'], function(done) {
  var mocha = require('gulp-mocha');
  return gulp.src('dist/temp/exceptionless-nodespec.js', { read: false })
    .pipe(mocha({
      require: ['source-map-support/register']
    }))
    .once('end', function () {
      process.exit();
    });
});

gulp.task('test-browser', function(){

});

gulp.task('test', ['test-node', 'test-browser']);

gulp.task('format', function () {
  var exec = require('gulp-exec');
  return gulp.src(['src/**/*.ts', '!src/typings/**/*.ts'])
    .pipe(exec('node_modules/typescript-formatter/bin/tsfmt -r <%= file.path %>'))
    .pipe(exec.reporter());
});

gulp.task('default', ['watch', 'build', 'test']);
