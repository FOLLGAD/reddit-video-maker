const fs = require('fs')
const mp3Duration = require('mp3-duration');
const child_process = require('child_process')
let path = require('path')
let spawn = child_process.spawn

let color = '#19191a' // Dark mode
// let color = '#ffffff' // Light mode

let fileFormat = 'mkv' // MVK is preferred since it does not require re-encoding on every concat

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
            })
        })
    })
}

module.exports.copyVideo = function (ins, out) {
    return new Promise(resolve => {
        let s = spawn('ffmpeg', ['-y', '-i', ins, '-c', 'copy', out])
        s.on('exit', () => {
            resolve(out)
        })
    })
}

module.exports.concatFromVideolist = function concatFromVideolist(videolist, path) {
    return new Promise(resolve => {
        let ffmpeg = spawn('ffmpeg', ['-y', '-f', `concat`, '-safe', '0', '-i', `../videolists/${videolist}`, '-ar', '24000', '-c:a', 'aac', '-c:v', 'copy', '-r', '25', path])
        ffmpeg.on('exit', statusCode => {
            resolve(path)
        })
        ffmpeg.on('error', console.error)
        ffmpeg.stderr.on('data', d => console.error(new String(d)))
    })
}

module.exports.combineVideos = function combineVideos(videos, name, extension = fileFormat) {
    return new Promise(resolve => {
        fs.writeFileSync(`../videolists/${name}.txt`, videos.map(v => `file '../video-temp/${v}'`).join('\n'))

        module.exports.concatFromVideolist(name + '.txt', `../video-output/${name}.${extension}`)
            .then(resolve)
    })
}

// DEPRECATED, use combineVideos
module.exports.combineFinal = function combineFinal(videos, name, extension) {
    return new Promise(resolve => {
        fs.writeFileSync(`../videolists/${name}.txt`, videos.map(v => `file '${v}'`).join('\n'))

        let ffmpeg = spawn('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', `../videolists/${name}.txt`, '-c:a', 'aac', '-c:v', 'libx264', '-r', '25', `../out/${name}.${extension}`])

        ffmpeg.on('exit', () => {
            resolve(`${name}.${extension}`)
        })
        ffmpeg.on('error', console.error)
        ffmpeg.stderr.on('data', d => console.error(new String(d)))
    })
}

module.exports.addSound = function addSound(videoFullPath, soundFullPath, newName, extension = 'mp4') {
    // let pathify = pt => path.join(__dirname, pt)
    return new Promise(resolve => {
        // https://stackoverflow.com/questions/11779490/how-to-add-a-new-audio-not-mixing-into-a-video-using-ffmpeg
        let endPath = `../video-output/${newName}.${extension}`
        let ffmpeg = spawn('ffmpeg', ['-y', '-i', videoFullPath, '-i', soundFullPath, '-c:a', 'aac', '-c:v', 'libx264', '-r', '25', '-filter_complex', '[0:a][1:a]amerge=inputs=2[a]', '-map', '0:v', '-map', '[a]', '-ac', '2', '-shortest', endPath])

        ffmpeg.on('exit', () => {
            resolve(endPath)
        })
        ffmpeg.on('error', console.error)
        ffmpeg.stderr.on('data', d => console.error(new String(d)))
    })
}