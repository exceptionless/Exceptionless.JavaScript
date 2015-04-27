var gulp = require('gulp');
var concat = require('gulp-concat');
var karma = require('gulp-karma');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var rimraf = require('rimraf');
var sourcemaps = require('gulp-sourcemaps');
var tsProject = require('tsproject');
var uglify = require('gulp-uglify');

gulp.task('clean', function (cb) {
  rimraf('dist', cb);
});

gulp.task('typescript-es5', function() {
  tsProject.src('src/tsconfig-es5.json')
    .pipe(gulp.dest('dist/temp'));
});

gulp.task('exceptionless-es5', ['typescript-es5'], function() {
  gulp.src('dist/temp/exceptionless.es5.d.ts')
    .pipe(replace('/// <reference path="typings/tsd.d.ts" />\n', ''))
    .pipe(gulp.dest('dist'));

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
    .pipe(concat('exceptionless-es5.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));

  return gulp.src(files)
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(rename('exceptionless-es5.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'))
});

gulp.task('watch', ['build'], function() {
  gulp.watch('*.ts', ['build']);
});

gulp.task('build', ['clean', 'exceptionless-es5'], function(cb) {
  rimraf('dist/temp', cb);
});

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
