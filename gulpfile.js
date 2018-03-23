const gulp=require('gulp');
const lint=require('gulp-eslint');
const pump=require('pump');

gulp.task('lint-tests', (cb)=>{
    pump([
        gulp.src('./test/test.js'),
        lint('.eslint-tests.json'),
        lint.format()
    ], cb);
});

gulp.task('lint-lib', (cb)=>{
    pump([
        gulp.src('./unlock.js'),
        lint('.eslint.json'),
        lint.format()
    ], cb);
});

gulp.task('lint', ['lint-tests', 'lint-lib']);

gulp.task('watch-js', ()=>{
    return gulp.watch(['./unlock.js', './test/test.js'], ['lint']);
});

gulp.task('default', ['lint', 'watch-js']);
