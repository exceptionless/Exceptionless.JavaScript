var eventStream = require('event-stream');
var gulp = require('gulp');
//var gutil = require('gulp-util');
var karma = require('gulp-karma');

var rimraf = require('rimraf');
var sourcemaps = require('gulp-sourcemaps');
var ts = require('gulp-typescript');

var tsProject = ts.createProject({
  declarationFiles: true,
  removeComments: true,
  sortOutput: true,
  sourceMap: true,
  target: 'ES5'
});

gulp.task('clean', function (cb) {
  rimraf('./dist', cb);
});

gulp.task('scripts', function() {
  var files = ['exceptionless.ts'];
  var tsResult = gulp.src(files)
                     .pipe(sourcemaps.init())
                     .pipe(ts(tsProject));

  return eventStream.merge(
    tsResult.dts.pipe(gulp.dest('dist')),
    tsResult.js.pipe(sourcemaps.write('/'))
               .pipe(gulp.dest('dist'))
  );
});

gulp.task('watch', ['scripts'], function() {
  gulp.watch('*.ts', ['scripts']);
});

gulp.task('build', ['clean', 'scripts']);

gulp.task('test', [], function() {
  return gulp.src(['*-spec.ts'])
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
