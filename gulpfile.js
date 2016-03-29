var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('test', function() {
    gulp.src('tests/**/*.js')
        .pipe(mocha({
            clearRequireCache: true,
            ignoreLeaks: true
        }))
        .on("error", () => {});
});

gulp.task('watch', ["test"], function() {
    gulp.watch(['lib/*.js', 'tests/**/*.js'], ['test']);
});