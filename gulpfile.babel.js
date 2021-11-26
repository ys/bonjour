import gulp from "gulp";
import imagemin from "gulp-imagemin";
import mozjpeg from "imagemin-mozjpeg";
import imageminJpegRecompress from "imagemin-jpeg-recompress";

gulp.task("img:build",  () =>
    gulp.src(["content/**/*.{jpg,png,gif,svg}"])
      .pipe(imagemin([
              imagemin.gifsicle(),
              imagemin.optipng(),
              imagemin.svgo(),
              imageminJpegRecompress(),
              mozjpeg({ quality: 80, progressive: true }),
            ]))
      .pipe(gulp.dest("content"))
);
