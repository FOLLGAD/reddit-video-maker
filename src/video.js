const fs = require('fs')
const mp3Duration = require('mp3-duration');
const child_process = require('child_process')
let spawn = child_process.spawn

let color = '#ffffff'

let fileFormat = 'mp4'

module.exports.createVideo = function createVideo(name, audioName, imgName) {
    return new Promise(resolve => {
        let filename = `${name}.${fileFormat}`

        mp3Duration(`../audio-output/${audioName}`, (err, duration) => {
            if (err) {
                console.error("ERROR", err)
            }
            let ffmpeg = spawn('ffmpeg', ['-y', '-loop', '1', '-i', `../images/${imgName}`, '-i', `../audio-output/${audioName}`, '-vf', 'pad=1920:1080:(ow-iw)/2:(oh-ih)/2:' + color, '-t', (duration - 0.15).toString(), '-pix_fmt', 'yuv420p', '-r', '30', `../video-temp/${filename}`])
            ffmpeg.on('exit', statusCode => {
                resolve(filename)
            })
        })
    })
}

module.exports.combineVideos = function combineVideos(videos, name) {
    return new Promise(resolve => {
        fs.writeFileSync(`../videolists/${name}.txt`, videos.map(v => `file '../video-temp/${v}'`).join('\n'))

        let ffmpeg = spawn('ffmpeg', ['-y', '-f', `concat`, '-safe', '0', '-i', `../videolists/${name}.txt`, '-c', 'copy', '-pix_fmt', 'yuv420p', `../video-output/${name}.${fileFormat}`])
        ffmpeg.on('exit', statusCode => {
            resolve(`${name}.${fileFormat}`)
        })
    })
}

module.exports.combineFinal = function combineFinal(videos, name) {
    return new Promise(resolve => {
        fs.writeFileSync(`../videolists/${name}.txt`, videos.map(v => `file '${v}'`).join('\n'))

        let ffmpeg = spawn('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', `../videolists/${name}.txt`, '-c:v', 'libx264', '-profile:v', 'main', '-c:a', 'aac', `../${name}.${fileFormat}`])

        ffmpeg.on('exit', statusCode => {
            resolve(`${name}.${fileFormat}`)
        })
            .stderr.on('data', d => console.error(new String(d)))
    })
}