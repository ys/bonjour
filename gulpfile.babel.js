import gulp from "gulp";
import imagemin from "gulp-imagemin";
import mozjpeg from "imagemin-mozjpeg";

gulp.task("img:build",  () =>
    gulp.src(["content/**/*.{jpg,png,gif,svg}"])
      .pipe(imagemin([
              imagemin.gifsicle(),
              imagemin.optipng(),
              imagemin.svgo(),
              mozjpeg({ quality: 85, progressive: true }),
            ]))
      .pipe(gulp.dest("content"))
);
