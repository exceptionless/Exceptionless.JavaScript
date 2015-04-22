var gulp = require('gulp');
var concat = require('gulp-concat');
var karma = require('gulp-karma');
var merge2 = require('merge2');
var rename = require('gulp-rename');
var rimraf = require('rimraf');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');
var tsProject = require('tsproject');
var uglify = require('gulp-uglify');

gulp.task('clean', function (cb) {
  rimraf('./dist', cb);
});

gulp.task('scripts', function() {
  function fixFilePath(files){
    for (var index = 0; index < files.length; index++) {
      files[index] = 'src/' + files[index];
    }

    return files;
  }

  var files = [
    'node_modules/es6-promise/dist/es6-promise.js',
    'node_modules/stackframe/dist/stackframe.js',
    'node_modules/error-stack-parser/dist/error-stack-parser.js',
    'node_modules/stack-generator/dist/stack-generator.js',
    'node_modules/stacktrace-gps/dist/stacktrace-gps.js',
    'node_modules/stacktrace-js/dist/stacktrace.js'
  ];

  var tsconfig = require('./src/tsconfig.json');
  var tsResult = gulp.src(fixFilePath(tsconfig.files))
    .pipe(ts(tsconfig.compilerOptions));

  //var tsResult = tsProject.src('./src');

  // TODO: Look into using https://www.npmjs.com/package/gulp-wrap-umd
  return merge2(
    tsResult.dts.pipe(gulp.dest('dist')),
    merge2(gulp.src(files), tsResult.js)
      .pipe(sourcemaps.init())
      .pipe(concat('exceptionless.js'))
      .pipe(gulp.dest('dist'))
      .pipe(rename('exceptionless.min.js'))
      .pipe(uglify())
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('dist'))
  );
});

gulp.task('watch', ['scripts'], function() {
  gulp.watch('*.ts', ['scripts']);
});

gulp.task('build', ['clean', 'scripts']);

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
