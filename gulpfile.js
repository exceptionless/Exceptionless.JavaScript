var concat = require('gulp-concat');
var del = require('del');
var gulp = require('gulp');
var karma = require('gulp-karma');
var package = require('./package.json');
var replace = require('gulp-replace');
var sourcemaps = require('gulp-sourcemaps');
var tsProject = require('tsproject');
var uglify = require('gulp-uglify');
var umd = require('gulp-wrap-umd');

gulp.task('clean', function () {
  del.sync(['dist'], { force: true });
});

gulp.task('typescript', function() {
  return tsProject.src('src/tsconfig.json').pipe(gulp.dest('dist/temp'));
});

gulp.task('typescript.integrations', ['typescript'], function() {
  return tsProject.src('src/integrations/tsconfig.json').pipe(gulp.dest('dist/temp'));
});

gulp.task('typescript.node', function() {
  return tsProject.src('src/tsconfig.node.json').pipe(gulp.dest('dist/temp'));
});

gulp.task('exceptionless.umd', ['typescript', 'typescript.integrations'], function() {
  return gulp.src('dist/temp/src/exceptionless.js')
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(umd({
      exports: 'exports',
      globalName: 'exceptionless',
      namespace: 'exceptionless'
    }))
    .pipe(replace('}(this, function(require, exports, module) {', '}(this, function(require, exports, module) {\nif (!exports) {\n\tvar exports = {};\n}\n'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/temp'));
});

gulp.task('exceptionless', ['exceptionless.umd'], function() {
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
    .pipe(replace('exceptionless-js/1.0.0.0', 'exceptionless-js/' + package.version))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));

  return gulp.src(files)
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(concat('exceptionless.min.js'))
    .pipe(replace('exceptionless-js/1.0.0.0', 'exceptionless-js/' + package.version))
    .pipe(uglify({ output: { beautify: false }}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'))
});

gulp.task('exceptionless.node', ['typescript.node'], function() {
  gulp.src('dist/temp/src/exceptionless.node.js')
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(replace('exceptionless-js/1.0.0.0', 'exceptionless-js/' + package.version))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', ['build'], function() {
  gulp.watch('*.ts', ['build']);
});

gulp.task('build', ['clean', 'exceptionless', 'exceptionless.node']);

gulp.task('typescript.test', function() {
  return tsProject.src('src/tsconfig.test.json').pipe(gulp.dest('dist/temp'));
});

gulp.task('exceptionless.test.umd', ['typescript.test'], function() {
  return gulp.src('dist/temp/src/exceptionless-spec.js')
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(umd({
      exports: 'exports',
      globalName: 'exceptionless',
      namespace: 'exceptionless'
    }))
    .pipe(replace('}(this, function(require, exports, module) {', '}(this, function(require, exports, module) {\nif (!exports) {\n\tvar exports = {};\n}\n'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist/temp'));
});

gulp.task('test', ['exceptionless.test.umd'], function() {
  return gulp.src(['dist/temp/exceptionless-spec.js'])
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
