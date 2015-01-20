var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    notify = require('gulp-notify'),
    NwBuilder = require('node-webkit-builder'),
    gutil = require('gulp-util'),
    p = require('./package.json');


gulp.task('scripts', function() {
    return gulp.src('firestorm/**/*.js')
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(notify({message: 'Scripts task complete'}));
});

gulp.task('nw', function() {
    var nw = new NwBuilder({
        version: p.config.nodeWebkitVersion,
        files: './firestorm/**',
        macIcns: './firestorm/images/icon.icns',
        platforms: ['osx32', 'osx64']
    });

    nw.on('log', function(msg) {
        gutil.log(msg);
    });

    return nw.build().catch(function(err) {
        gutil.log('error:', err);
    });
});

gulp.task('nw-run', function() {
    var nw = new NwBuilder({
        version: p.config.nodeWebkitVersion,
        files: './firestorm/**',
        macIcns: './firestorm/images/icon.icns',
        platforms: ['osx32', 'osx64']
    });

    nw.on('log', function(msg) {
        gutil.log(msg);
    });

    return nw.run().catch(function(err) {
        gutil.log('error:', err);
    });
}) ;

gulp.task('default', ['scripts'], function() {

});