const ffmpeg = require('fluent-ffmpeg')

ffmpeg(`audio-output/0-0.mp3`)
    // .size('1600x1080')
    // .addInput(`audio-output/0-0.mp3`)
    .addInput("h-bad.png")
    .mergeAdd(`audio-output/0-1.mp3`)
    // .mergeAdd("ok.png")
    .on('end', function () {
        console.log('files have been merged succesfully');
    })
    .on('error', function (err) {
        console.log('an error happened: ' + err.message);
    })
    .mergeToFile(`test.mp4`)