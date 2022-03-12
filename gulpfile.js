let srcFolder = "src",
  destFolder = "dist";

const path = {
  html: {
    src: [`${srcFolder}/**/*.html`, `!${srcFolder}/**/_*.html`],
    dist: `${destFolder}`,
    watch: `${srcFolder}/**/*.html`,
  },
  css: {
    src: `${srcFolder}/scss/*.{scss,sass}`,
    dist: `${destFolder}/css`,
    watch: `${srcFolder}/scss/**/*.{scss,sass}`,
  },
  js: {
    src: `${srcFolder}/scripts/**/*.js`,
    dist: `${destFolder}/scripts`,
    watch: `${srcFolder}/scripts/**/*.js`,
  },
  image: {
    src: `${srcFolder}/images/**/*.{jpg,png,svg,gif,ico,webp}`,
    dist: `${destFolder}/images`,
    watch: `${destFolder}/images/**/*.{jpg,png,svg,gif,ico,webp}`,
  },
  fonts: {
    src: `${srcFolder}/fonts/**/*.ttf`,
    dist: `${destFolder}/fonts`,
    watch: `${srcFolder}/fonts/**/*.ttf`,
  },
};

const { src, dest, watch, series, parallel } = require("gulp");

// Плагины -- Plagins
const gulpFileInclude = require("gulp-file-include"),
  browserSync = require("browser-sync").create(),
  plumber = require("gulp-plumber"),
  notify = require("gulp-notify"),
  htmlmin = require("gulp-htmlmin"),
  size = require("gulp-size"),
  del = require("del"),
  rename = require("gulp-rename"),
  autoprefixer = require("gulp-autoprefixer"),
  mediaGroup = require("gulp-group-css-media-queries"),
  sass = require("gulp-sass")(require("sass")),
  shortHand = require("gulp-shorthand"),
  babel = require("gulp-babel"),
  imageMin = require("gulp-imagemin"),
  terser = require("gulp-terser"),
  ttf2woff = require("gulp-ttf2woff"),
  ttf2woff2 = require("gulp-ttf2woff2"),
  cleanCss = require("gulp-clean-css");

//   Сервер -- Server
const server = () => {
  browserSync.init({
    server: {
      baseDir: `${destFolder}/`,
    },
  });
};

// Удаления файлов -- Dlete files
const clear = () => {
  return del(`${destFolder}/`);
};

// Обработчики -- Handlers

// Обработчик Html --  Html handler
const html = () => {
  return src(path.html.src)
    .pipe(
      plumber({
        errorHandler: notify.onError((error) => ({
          title: "HTML",
          message: error.message,
        })),
      })
    )
    .pipe(gulpFileInclude())
    .pipe(size({ title: "До сжатия Html -- Before compression Html" }))
    .pipe(
      htmlmin({
        collapseWhitespace: true,
      })
    )
    .pipe(size({ title: "После сжатия Html -- After compression Html" }))
    .pipe(dest(path.html.dist))
    .pipe(browserSync.stream());
};

// Обработчик Css --  Css handler
const css = () => {
  return src(path.css.src, { sourcemaps: true })
    .pipe(
      sass({
        outputStyle: "expanded",
      })
    )
    .pipe(mediaGroup())
    .pipe(
      plumber({
        errorHandler: notify.onError((error) => ({
          title: "CSS",
          message: error.message,
        })),
      })
    )
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 3 versions"],
        cascade: true,
      })
    )
    .pipe(shortHand())
    .pipe(size({ title: "До сжатия Css -- Before compression Css" }))
    .pipe(cleanCss())
    .pipe(size({ title: "После сжатия Css -- After compression Css" }))
    .pipe(dest(path.css.dist, { sourcemaps: true }));
};

// Обработчик JavaScript --  JavaScript handler
const js = () => {
  return src(path.js.src)
    .pipe(
      plumber({
        errorHandler: notify.onError((error) => ({
          title: "JavaScript",
          message: error.message,
        })),
      })
    )
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(size({ title: "До сжатия Js -- Before compression Js" }))
    .pipe(terser())
    .pipe(size({ title: "После сжатия Js -- After compression Js" }))
    .pipe(dest(path.js.dist));
};

// Обработчик Images --  Images handler
const images = () => {
  return src(path.image.src)
    .pipe(
      plumber({
        errorHandler: notify.onError((error) => ({
          title: "IMAGE",
          message: error.message,
        })),
      })
    )
    .pipe(
      imageMin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true,
        optimizationLevel: 2,
      })
    )
    .pipe(dest(path.image.dist));
};

// Обработчик Font --  Font handler
const fonts = () => {
  src(path.fonts.src)
    .pipe(ttf2woff())
    .pipe(
      plumber({
        errorHandler: notify.onError((error) => ({
          title: "Fonts",
          message: error.message,
        })),
      })
    )
    .pipe(dest(path.fonts.dist));
  return src(path.fonts.src)
    .pipe(ttf2woff2())
    .pipe(
      plumber({
        errorHandler: notify.onError((error) => ({
          title: "Fonts",
          message: error.message,
        })),
      })
    )
    .pipe(dest(path.fonts.dist));
};

// Наблюдатель -- Watcher
const watcher = () => {
  watch(path.html.watch, html).on("all", browserSync.reload);
  watch(path.css.watch, css).on("all", browserSync.reload);
  watch(path.js.watch, js).on("all", browserSync.reload);
  watch(path.image.watch, images).on("all", browserSync.reload);
  watch(path.fonts.watch, fonts).on("all", browserSync.reload);
};

exports.html = html;
exports.css = css;
exports.js = js;
exports.images = images;
exports.fonts = fonts;
exports.watch = watcher;
exports.clear = clear;

exports.test = series(clear, parallel(html, css, js, images, fonts));

//  Сборка -- Build
exports.dev = series(
  clear,
  parallel(html, css, js, images),
  parallel(watcher, server)
);
