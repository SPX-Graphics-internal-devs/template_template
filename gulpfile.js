const fs = require('fs');
const del = require('del');
const gulp = require('gulp');
const path = require('path');
const zip = require('gulp-zip')
const log = require('fancy-log');
const todo = require('gulp-todo');
const clean = require('gulp-clean')
const header = require('gulp-header');
const rename = require('gulp-rename');
const terser = require('gulp-terser');
const concat = require('gulp-concat');
const htmlmin = require('gulp-htmlmin');
const sourcemaps = require('gulp-sourcemaps');
const replace = require('gulp-async-replace');
const fileinclude = require('gulp-file-include');
// const minifyInline = require('gulp-minify-inline');
const minify = require('gulp-minify');
const { src, series, parallel, dest, watch } = require('gulp');
const { create } = require('domain');



// =====================================================================================

    // Gulpfile for PLUGINS

    const params = {

        packname: 'spx_template', 
        version:  '1.0.0',              
        license:  'PREMIUM',                    
        comment:  'Template for creating templates',

        fileToCopyAsIs: [
            'src/**/*',
            'src/***/**/*',
        ],

        // html and js files to minify
        filesToMinify: [
        ]

    } 

    let SPXROOT = process.env.SPX_ROOT_FOLDER || null;
    if ( !SPXROOT ) {
        log('\n\n** ERROR! ** SPX_ROOT_FOLDER not set in environment variables, exiting!\n\n');
        process.exit()
    }

    params.destNor = path.join( SPXROOT,'ASSETS', 'templates', params.packname)

    params.destBuild = path.join('./TEMP','ASSETS', 'templates', params.packname)
        
// ===================================================================================


// COMMON TASKS FOR MINIFY and NORMAL -----------------------------------------------------------------
async function copyLicense() {
    let file = '../licenses/LICENSE_' + params.license + '.TXT'
    return src(file,)
        .pipe(gulp.dest(params.destNor))
};


// NORMAL VERSION -------------------------------------------------------------------------------------
async function delNormal() {
    return del(params.destNor + '/**', {force:true});
};

async function copyFilesNormal() {
    let normalCopyfiles = params.fileToCopyAsIs.slice(); // copy array, not refer. Doh!
    normalCopyfiles.push('src/js/spx_*.js')
    return src(normalCopyfiles, { base: 'src', allowEmpty: true})
        .pipe(gulp.dest(params.destNor)) // for local SPX
};

async function buildREADME(){
var timestamp = Date(Date.now()).toString(); 
return gulp.src('./README_SRC.md', {allowEmpty: true})
    .pipe(fileinclude({prefix: '@@', basepath: '@file' }))
    .pipe(replace('##-builddate-##', timestamp))
    .pipe(replace('##-version-##', params.version))
    .pipe(replace('##-comment-##', params.comment))
    .pipe(replace('##-kb-page-##', params.kbaseURL))
    .pipe(replace('##-produName-##', params.product))
    .pipe(replace('##-licenseTy-##', params.license))
    .pipe(replace('##-descriptn-##', params.descrip))
    .pipe(replace('##-insFolder-##', params.folder))
    .pipe(replace('##-minifyinfo-##', 'Non-minified source build.'))
    .pipe(rename(function (path) {
        path.basename = path.basename.replace("_SRC", ""); // remove _SRC
    }))
    .pipe(gulp.dest(params.destNor)) // for local SPX
    .pipe(gulp.dest('src'))
    .on('end', function(){
        log('-- Readme files created');
    });
}

  async function buildNormalHTML() {
    var timestamp = Date(Date.now()).toString(); 
    return gulp.src(['src/*.html'])
        .pipe(fileinclude({prefix: '@@', basepath: '@file' }))
        .pipe(replace('##-builddate-##', timestamp))
        .pipe(replace('##-version-##', params.version))
        .pipe(replace('##-comment-##', params.comment))
        .pipe(replace('##-minifyinfo-##', 'Non-minified source build.'))
        .pipe(rename(function (path) {
            path.basename = path.basename.replace("_SRC", ""); // remove _SRC
        }))
        .pipe(gulp.dest(params.destNor)) // for local SPX
        .on('end', function(){
            log('-- HTML files created');
        });
  }

// Watcher -----------------------------------------------------------------------
function watchTask() {
    watch(['src/*', 'src/*/**', '!src/*.md'], { interval: 1000, delay: 1500 },
        series(
            copyFilesNormal,
            buildNormalHTML,
            buildREADME
            ));
}






//empty path, enter the desired install route here 
async function createTemp() {
    fs.mkdir(params.destNor, (error) => { 
    if (error) { 
        console.log(error); 
    } else { 
        console.log("New Directory created successfully !!"); 
    } 
    }); 
}

//fill the temp path with content
gulp.task('fillTemp', function () {
    return gulp.src(params.destNor + '/**')
        .pipe(gulp.dest(params.destBuild))
})

//create zip file from temp file, with correct routing
gulp.task('makeZip', function () {
    if (fs.existsSync('./dist')) {
        fs.unlinkSync('./dist/test.zip')
    } 
    
    return gulp.src('./TEMP/**')
        .pipe(zip('test.zip'))
        .pipe(gulp.dest('./dist'))
})

//clear temp folder
gulp.task('clear', function () {
    return gulp.src('./TEMP', {read: false})
        .pipe(clean());
});


// Exports -----------------------------------------------------------------------

exports.default = function() {
    log('\n\nGULP to ▸ ' + params.destNor + '\n');
    watch(
        ['src/*', 'src/*/**', , "!./src/README*.*"],
        { events: 'change'},
        series(
            delNormal,
            copyFilesNormal,
            // buildREADME,
            buildNormalHTML));
};

// Build export that creates a zip, start with "gulp build" --------------------------------------------
exports.build = series(createTemp, 'fillTemp','makeZip', 'clear');

  


