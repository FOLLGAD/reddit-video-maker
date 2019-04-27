const fs = require('fs')
const mp3Duration = require('mp3-duration');
const child_process = require('child_process')
let spawn = child_process.spawn

// let color = '#1a1a1b' // Dark mode
let color = '#ffffff' // Light mode

let backgroundMusicPath = '../static/onion-capers-by-kevin-macleod.mp3'

let fileFormat = 'ts'

let mp3dur = file => {
    return new Promise((resolve, reject) => {
        mp3Duration(file, (err, duration) => {
            if (err) return reject(err)
            resolve(duration)
        })
    })
}

// Concat many audio into one audio
module.exports.createAudio = function createAudio(name, audiofiles, imagefiles) {
    return Promise.all(audiofiles.map(mp3dur))
        .then((durations) => {
            let p1 = new Promise((resolve, reject) => {
                fs.writeFileSync(`../videolists/${name}-audio.txt`, audiofiles.map((file, index) => `file '${file}'\nduration ${durations[index]}`).join('\n'))

                let ffmpegAudio = spawn('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', `../videolists/${name}-audio.txt`, '-c:a', 'copy', `${name}.mp3`])
                ffmpegAudio.on('exit', statusCode => {
                    resolve(`${name}.mp3`)
                })
                ffmpegAudio.on('error', d => console.error(`child stderr:\n${d}`))
            })
            let p2 = new Promise((resolve, reject) => {
                fs.writeFileSync(`../videolists/${name}-img.txt`, [...imagefiles.map((file, index) => `file '${file}'\nduration ${durations[index]}`), `file '${imagefiles[imagefiles.length - 1]}'`].join('\n'))
                let ffmpegImage = spawn('ffmpeg', ['-y', '-max_muxing_queue_size', '9999', '-f', 'concat', '-safe', '0', '-i', `../videolists/${name}-img.txt`, '-vf', 'pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black', `${name}.ts`])
                ffmpegImage.on('exit', statusCode => {
                    resolve(`${name}.ts`)
                })
                ffmpegImage.on('error', d => console.error(`child stderr:\n${d}`))
            })

            return Promise.all([p1, p2])
        })
}

module.exports.audioVideoCombine = function createVideo(name, audioName, imgName) {
    return new Promise(resolve => {
        let filename = `${name}.${fileFormat}`

        mp3Duration(`../audio-output/${audioName}`, (err, duration) => {
            if (err) {
                console.error("ERROR", err)
            }
            let ffmpeg = spawn('ffmpeg', ['-y', '-loop', '1', '-i', `../images/${imgName}`, '-i', `../audio-output/${audioName}`, '-vf', `pad=1920:1080:(ow-iw)/2:(oh-ih)/2:${color}`, '-t', (duration - 0.15).toString(), '-pix_fmt', 'yuv420p', '-crf', '20', '-c:v', 'libx264', '-c:a', 'aac', '-ar', '24000', '-r', '25', `../video-temp/${filename}`])
            // ffmpeg -y -framerate 30 -loop 1 -i ../images/Q.png -i ../audio-output/Q.mp3 -vf pad=1920:1080:(ow-iw)/2:(oh-ih)/2:#ffffff -pix_fmt yuv420p -crf 20 -c:v libx264 -c:a aac -ar 24000 -r 30 ../video-temp/Q.ts
            ffmpeg.on('exit', statusCode => {
                resolve(filename)
            })
            ffmpeg.on('error', d => console.error(`child stderr:\n${d}`))
        })
    })
}

module.exports.combineVideos = function combineVideos(videos, name) {
    return new Promise(resolve => {
        fs.writeFileSync(`../videolists/${name}.txt`, videos.map(v => `file '../video-temp/${v}'`).join('\n'))

        // let ffmpeg = spawn('ffmpeg', ['-y', '-f', `concat`, '-safe', '0', '-i', `../videolists/${name}.txt`, '-ar', '24000', '-c:a', 'aac', '-c:v', 'copy', '-r', '25', `../video-output/${name}.${fileFormat}`])
        let ffmpeg = spawn('ffmpeg', ['-y', '-i', `concat:${videos.map(v => `../video-temp/${v}`).join('|')}`, '-c', 'copy', `../video-output/${name}.${fileFormat}`])
        // '-r', '30', '-pix_fmt', 'yuv420p', '-c', 'copy'

        ffmpeg.on('exit', statusCode => {
            resolve(`${name}.${fileFormat}`)
        })
        ffmpeg.on('error', d => console.error(`child stderr:\n${d}`))
    })
}

module.exports.combineFinal = function combineFinal(videos, name) {
    return new Promise(resolve => {
        fs.writeFileSync(`../videolists/${name}.txt`, videos.map(v => `file '${v}'`).join('\n'))

        let ffmpeg = spawn('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', `../videolists/${name}.txt`, '-c', 'copy', '-r', '25', `../out/pre-${name}.mp4`])

        ffmpeg.on('exit', statusCode => {
            resolve(`pre-${name}.mp4`)
        })
        ffmpeg.stderr.on('data', d => console.error(`child stderr:\n${d}`))
    })
}

module.exports.addPeripherals = function addPeripherals(arr) {
    return new Promise(resolve => {
        fs.writeFileSync(`../videolists/final.txt`, arr.map(v => `file '${v}'`).join('\n'))

        let ffmpeg = spawn('ffmpeg', ['-y', '-r', '25', '-f', 'concat', '-safe', '0', '-i', `../videolists/final.txt`, `../out/final.mp4`])

        ffmpeg.on('exit', statusCode => {
            resolve(`final.mp4`)
        })
        ffmpeg.on('error', d => console.error(`child stderr:\n${d}`))
    })
}