var concat = require('gulp-concat');
var del = require('del');
var gulp = require('gulp');
var karma = require('gulp-karma');
var replace = require('gulp-replace');
var sourcemaps = require('gulp-sourcemaps');
var tsProject = require('tsproject');
var uglify = require('gulp-uglify');
var umd = require('gulp-wrap-umd');

gulp.task('clean', function () {
  del.sync(['dist'], { force: true });
});

gulp.task('typescript.es5', function() {
  tsProject.src('src/tsconfig.es5.json').pipe(gulp.dest('dist/temp'));
  return gulp.src('dist/temp/src/exceptionless.es5.js')
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(umd({
      exports: 'exports',
      globalName: 'Exceptionless',
      namespace: 'Exceptionless'
    }))
    .pipe(replace('}(this, function(require, exports, module) {', '}(this, function(require, exports, module) {\nif (!exports) {\n\texports = {};\n}'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/temp'));
});

gulp.task('exceptionless.es5', ['typescript.es5'], function() {
  gulp.src('dist/temp/src/exceptionless.es5.d.ts').pipe(gulp.dest('dist'));

  var files = [
    'node_modules/es6-promise/dist/es6-promise.js',
    'node_modules/stackframe/dist/stackframe.js',
    'node_modules/error-stack-parser/dist/error-stack-parser.js',
    'node_modules/stack-generator/dist/stack-generator.js',
    'node_modules/stacktrace-gps/dist/stacktrace-gps.js',
    'node_modules/stacktrace-js/dist/stacktrace.js',
    'dist/temp/exceptionless.es5.js'
  ];

  gulp.src(files)
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(concat('exceptionless.es5.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));

  return gulp.src(files)
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(concat('exceptionless.es5.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'))
});

gulp.task('typescript.es5.node', function() {
  return tsProject.src('src/tsconfig.es5.node.json').pipe(gulp.dest('dist/temp'));
});

gulp.task('exceptionless.es5.node', ['typescript.es5.node'], function() {
  gulp.src('dist/temp/src/exceptionless.es5.node.d.ts').pipe(gulp.dest('dist'));

  var files = [
    'node_modules/es6-promise/dist/es6-promise.js',
    'node_modules/stackframe/dist/stackframe.js',
    'node_modules/error-stack-parser/dist/error-stack-parser.js',
    'node_modules/stack-generator/dist/stack-generator.js',
    'node_modules/stacktrace-gps/dist/stacktrace-gps.js',
    'node_modules/stacktrace-js/dist/stacktrace.js',
    'dist/temp/src/exceptionless.es5.node.js'
  ];

  gulp.src(files)
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(concat('exceptionless.es5.node.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));

  return gulp.src(files)
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(concat('exceptionless.es5.node.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'))
});

gulp.task('typescript.es6', function() {
  return tsProject.src('src/tsconfig.es6.json').pipe(gulp.dest('dist/temp'));
});

gulp.task('exceptionless.es6', ['typescript.es6'], function() {
  gulp.src('dist/temp/src/exceptionless.es6.d.ts').pipe(gulp.dest('dist'));

  var files = [
    'node_modules/stackframe/dist/stackframe.js',
    'node_modules/error-stack-parser/dist/error-stack-parser.js',
    'node_modules/stack-generator/dist/stack-generator.js',
    'node_modules/stacktrace-gps/dist/stacktrace-gps.js',
    'node_modules/stacktrace-js/dist/stacktrace.js',
    'dist/temp/src/exceptionless.es6.js'
  ];

  gulp.src(files)
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(concat('exceptionless.es6.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', ['build'], function() {
  gulp.watch('*.ts', ['build']);
});

gulp.task('build', ['clean', 'exceptionless.es5', 'exceptionless.es5.node']);

gulp.task('test', [], function() {
  return gulp.src(['src/**/*-spec.ts'])
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }))
    .on('error', function(err) {
     console.log('karma tests failed: ' + err);
     throw err;
    });
});

gulp.task('default', ['watch', 'build', 'test']);
