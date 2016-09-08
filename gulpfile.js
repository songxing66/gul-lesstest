//导入工具包 require('node_modules里对应模块')
var gulp = require('gulp'); //本地安装gulp所用到的地方

var htmlmin = require('gulp-htmlmin'), //html压缩
    clean = require('gulp-clean'), //清理文件夹
    less = require('gulp-less'), //less
    imagemin = require('gulp-imagemin'), //图片压缩
    pngcrush = require('imagemin-pngcrush'),
    cssver = require('gulp-make-css-url-version'), //添加css引入文件版本
    sourcemaps = require('gulp-sourcemaps'), //生成map文件
    cache = require('gulp-cache'), //文件缓存
    cssnano = require('gulp-cssnano'), //css压缩
    jshint = require('gulp-jshint'), //js检测
    uglify = require('gulp-uglify'), //js压缩
    concat = require('gulp-concat'), //文件合并
    rename = require('gulp-rename'), //文件更名
    notify = require('gulp-notify'), //提示信息
    runSequence = require('gulp-run-sequence'),
    rev = require('gulp-rev'), //- 对文件名加MD5后缀
    revCollector = require('gulp-rev-collector');

//确保本地已安装gulp-cache [cnpm install gulp-cache --save-dev]



var Path = {
    less_src: 'src/less/*.less', //less原路径
    less_dist: 'src/css', //解析less输出路径

    mincss_src: 'src/**/*.min.css', //min.css原路径
    css_src: 'src/**/*.css', //css原路径
    nocss_src: '!src/**/*.min.css', //css排除路径   

    js_src: 'src/**/*.js', //js原路径
    nojs_src: '!src/**/*.min.js', //min.js原路径
    minjs_src: 'src/**/*.min.js', //js排除路径

    img_src: 'src/**/*.{png,jpg,gif,ico}', //img原路径
    dist: 'dist', //输出路径

    html_src: 'src/*.html', //html原路径
};

gulp.task('clean', function() {
    return gulp.src(['dist/*.html', 'dist/css', 'dist/js', 'src/rev'], { read: false })
        .pipe(clean());
});
//定义一个testLess任务（自定义任务名称）

//编译less
gulp.task('less', function() {
    return gulp.src(Path.less_src) //该任务针对的文件
        .pipe(less()) //该任务调用的模块
        .pipe(gulp.dest(Path.less_dist)); //将会在src/css下生成index.css
    // .pipe(notify({ message: 'less task ok' }));
});


// 检查js
gulp.task('lint', function() {
    return gulp.src(Path.js_src)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        // .pipe(notify({ message: 'lint task ok' }));
});


//更改文件名
gulp.task('rename', function() {
    return gulp.src([Path.js_src, Path.nojs_src, Path.css_src, Path.nocss_src])
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('src'));

});

//压缩css
gulp.task('css', function() {
    return gulp.src(['src/**/*.min.css']) //该任务针对的文件
        .pipe(rev())
        .pipe(cssver()) //给css文件里引用文件加版本号（文件MD5）
        //      .pipe(concat('main.css'))//合并css
        //      .pipe(gulp.dest('dest/css'))//合并之后
        .pipe(sourcemaps.init()) //         .pipe(notify({ message: 'css task ok' }));
        .pipe(cssnano())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(Path.dist)) //输出路径
        .pipe(rev.manifest()) //生成json
        .pipe(gulp.dest('json/css')); //输出路径
    // .pipe(notify({ message: 'css task ok' }));
});
// 合并、压缩js文件
gulp.task('js', function() {
    return gulp.src(['src/**/*.min.js'])
        .pipe(rev())
        // .pipe(concat('all.js'))//合并js
        // .pipe(gulp.dest('dest/js'))//合并位置
        .pipe(sourcemaps.init()) //         .pipe(notify({ message: 'css task ok' }));
        .pipe(uglify({
            mangle: true, //类型：Boolean 默认：true 是否修改变量名
            compress: true, //类型：Boolean 默认：true 是否完全压缩
            preserveComments: 'all' //保留所有注释
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(Path.dist))
        .pipe(rev.manifest())
        .pipe(gulp.dest('json/js'));

    // .pipe(notify({ message: 'js task ok' }));
});
gulp.task('claencss', function() {
    return gulp.src(['dist/css', 'src/less/*.css'], { read: false })
        .pipe(clean());
});
gulp.task('claenjs', function() {
    return gulp.src(['dist/js'], { read: false })
        .pipe(clean());
});
// 压缩html
gulp.task('html', function() {
    return gulp.src('src/*.html')
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest(Path.dist));
    // .pipe(notify({ message: 'html task ok' }));

});

gulp.task('rev', function() {
    return gulp.src(['json/**/*.json', 'dist/*.html'])
        .pipe(revCollector({
            replaceReved: true,
        }))
        .pipe(gulp.dest(Path.dist));
});

//img压缩
gulp.task('img', function() {
    return gulp.src(Path.img_src)
        .pipe(cache(imagemin({
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            use: [pngcrush()]
        })))
        .pipe(gulp.dest(Path.dist));
});

// 默认任务
gulp.task('default', function() {
    runSequence('clean', 'img', 'less', 'rename', 'css', 'lint', 'js', 'html', 'rev');

    // 监听html文件变化
    gulp.watch(Path.html_src, function() {
        runSequence('html', 'rev');
    });

    // Watch .css files
    gulp.watch(Path.less_src, function() {
        runSequence('claencss', 'less', 'rename', 'css', 'html', 'rev');
    });

    // Watch .js files
    gulp.watch([Path.js_src, Path.nojs_src], function() {
        runSequence('claenjs', 'rename', 'js', 'html', 'rev');
    });

    // Watch image files
    gulp.watch(Path.img_src, ['img']);
});
//gulp.task(name[, deps], fn) 定义任务  name：任务名称 deps：依赖任务名称 fn：回调函数
//gulp.src(globs[, options]) 执行任务处理的文件  globs：处理的文件路径(字符串或者字符串数组) 
//gulp.dest(path[, options]) 处理完后文件生成路径