const fs = require('fs')

const child_process = require('child_process')
let spawn = child_process.spawn

let fileFormat = 'mp4'

module.exports.createVideo = function createVideo(name, audioName, imgName) {
    return new Promise(resolve => {
        let filename = `${name}.${fileFormat}`

        let ffmpeg = spawn('ffmpeg', ['-i', `../images/${imgName}`, '-i', `../audio-output/${audioName}`, '-pix_fmt', 'yuv420p', `../video-temp/${filename}`])
        ffmpeg.on('exit', statusCode => {
            resolve(filename)
        })
    })
}

module.exports.combineVideos = function combineVideos(videos, name) {
    return new Promise(resolve => {
        fs.writeFileSync(`../videolists/${name}.txt`, videos.map(v => `file '../video-temp/${v}'`).join('\n'))

        let ffmpeg = spawn('ffmpeg', ['-f', `concat`, '-safe', `0`, '-i', `../videolists/${name}.txt`, '-c', 'copy', '-pix_fmt', 'yuv420p', `../video-output/${name}.${fileFormat}`])
        ffmpeg.on('exit', () => {
            resolve(`${name}.${fileFormat}`)
        })
    })
}