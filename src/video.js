const fs = require('fs')
const mp3Duration = require('mp3-duration');
const child_process = require('child_process')
let spawn = child_process.spawn

// let color = '#1a1a1b' // Dark mode
let color = '#ffffff' // Light mode

let backgroundMusicPath = '../static/onion-capers-by-kevin-macleod.mp3'

let fileFormat = 'mkv'

module.exports.audioVideoCombine = function createVideo(name, audioName, imgName) {
    return new Promise(resolve => {
        let filename = `${name}.${fileFormat}`

        mp3Duration(`../audio-output/${audioName}`, (err, duration) => {
            if (err) {
                console.error("ERROR", err)
            }
            let ffmpeg = spawn('ffmpeg', ['-y', '-loop', '1', '-i', `../images/${imgName}`, '-i', `../audio-output/${audioName}`, '-vf', `pad=1920:1080:(ow-iw)/2:(oh-ih)/2:${color}`, '-t', (duration - 0.15).toString(), '-pix_fmt', 'yuv420p', '-crf', '20', '-c:v', 'libx264', '-c:a', 'aac', '-ar', '24000', '-r', '25', `../video-temp/${filename}`])
            // ffmpeg -y -framerate 30 -loop 1 -i ../images/Q.png -i ../audio-output/Q.mp3 -vf pad=1920:1080:(ow-iw)/2:(oh-ih)/2:#ffffff -pix_fmt yuv420p -crf 20 -c:v libx264 -c:a aac -ar 24000 -r 30 ../video-temp/Q.mkv
            ffmpeg.on('exit', statusCode => {
                resolve(filename)
            }).on('error', console.error)
                .stderr.on('data', d => console.error(new String(d)))
        })
    })
}

module.exports.combineVideos = function combineVideos(videos, name) {
    return new Promise(resolve => {
        fs.writeFileSync(`../videolists/${name}.txt`, videos.map(v => `file '../video-temp/${v}'`).join('\n'))

        let ffmpeg = spawn('ffmpeg', ['-y', '-f', `concat`, '-safe', '0', '-i', `../videolists/${name}.txt`, '-ar', '24000', '-c:a', 'aac', '-c:v', 'copy', '-r', '25', `../video-output/${name}.${fileFormat}`])
        // '-r', '30', '-pix_fmt', 'yuv420p', '-c', 'copy'

        ffmpeg.on('exit', statusCode => {
            resolve(`${name}.${fileFormat}`)
        })
            .stderr.on('data', d => console.error(new String(d)))
    })
}

module.exports.combineFinal = function combineFinal(videos, name) {
    return new Promise(resolve => {
        fs.writeFileSync(`../videolists/${name}.txt`, videos.map(v => `file '${v}'`).join('\n'))

        let ffmpeg = spawn('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', `../videolists/${name}.txt`, '-c:a', 'aac', '-c:v', 'libx264', '-r', '25', `../out/pre-${name}.mp4`])

        ffmpeg.on('exit', statusCode => {
            resolve(`pre-${name}.mp4`)
        })
            .stderr.on('data', d => console.error(new String(d)))
    })
}

module.exports.addPeripherals = function addPeripherals(arr) {
    return new Promise(resolve => {
        fs.writeFileSync(`../videolists/final.txt`, arr.map(v => `file '${v}'`).join('\n'))

        let ffmpeg = spawn('ffmpeg', ['-y', '-r', '25', '-f', 'concat', '-safe', '0', '-i', `../videolists/final.txt`, `../out/final.mp4`])

        ffmpeg.on('exit', statusCode => {
            resolve(`final.mp4`)
        })
            .stderr.on('data', d => console.error(new String(d)))
    })
}