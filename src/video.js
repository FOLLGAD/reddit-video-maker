const ffmpeg = require('fluent-ffmpeg')
const Stream = require('stream')

module.exports.createVideo = function createVideo(name, imageBuf, audioName) {
    let imgStream = new Stream.Duplex()
    imgStream.push(imageBuf)
    imgStream.push(null)

    return new Promise((resolve) => {
        ffmpeg()
            .size('1600x1080')
            .addInput(`../audio-output/${audioName}`)
            .addInput(imgStream)
            .saveToFile(`../video-temp/${name}.mp4`)
            .on('end', () => {
                resolve(`${name}.mp4`)
            })
    })
}

module.exports.combineVideos = function combineVideos(videos, name) {
    let newvideo = ffmpeg()

    videos.forEach(v => {
        newvideo.input(`../video-temp/${v}`)
    })

    newvideo.mergeToFile(`../video-output/${name}.mp4`, '../tempdir')
}