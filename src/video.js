const fs = require('fs')
const util = require('util')
const child_process = require('child_process')
const exec = util.promisify(child_process.exec)
const spawn = child_process.spawn

let color = '#19191a' // Dark mode
// let color = '#ffffff' // Light mode

// ffmpeg -i transition_new_dark.mp4 -c:a aac -c:v libx264 -r 25 -ac 2 -ar 24000 transition_dark.mkv

let fileFormat = 'mkv' // MVK is preferred since it does not require re-encoding on every concat

function ffprobe(path) {
    return new Promise((res, rej) => {
        exec(`ffprobe -v quiet -print_format json -show_format -show_streams ${path}`)
            .then(({ stdout }) => {
                res(JSON.parse(stdout))
            })
            .catch(rej)
    })
}

module.exports.audioVideoCombine = function createVideo(name, audioName, imgName) {
    return new Promise(resolve => {
        let filename = `${name}.${fileFormat}`

        return ffprobe(`../audio-output/${audioName}`)
            .then(info => {
                let duration = info.streams[0].duration

                return exec(`ffmpeg -y -loop 1 -i ../images/${imgName} -i ../audio-output/${audioName} -t ${duration - 0.15} -vf "pad=height=ceil(ih/2)*2" -pix_fmt yuv420p -crf 20 -c:v libx264 -c:a aac -ar 24000 -r 25 ../video-temp/${filename}`)
            })
            .then(() => {
                resolve(filename)
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
    return exec(`ffmpeg -y -f concat -safe 0 -i ../videolists/${videolist} -ar 24000 -c:a aac -c:v copy -r 25 ${path}`)
        .then(() => {
            return path
        })
}

function concatAndPad(videolist, path) {
    let width = 1920,
        height = 1080

    return exec(`ffmpeg -y -f concat -safe 0 -i ../videolists/${videolist} -vf "pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:${color}" -ar 24000 -c:a aac -c:v libx264 -r 25 ${path}`)
        .then(() => {
            return path
        })
}

async function concatAndScroll(videolist, path) {
    let vidpath = await module.exports.concatFromVideolist(videolist, '../video-temp/scroll-vid.' + fileFormat)

    let info = await ffprobe(vidpath)

    let margin = 6
    let duration = info.format.duration

    await exec(`ffmpeg -y -f lavfi -i "color=c=blue:s=1920x1080" -i ${vidpath} -t ${duration} -filter_complex "[0]overlay=y=if(gte(t\\, ${margin})\\, if(gte(t\\, ${duration} - ${margin})\\, H - h\\, (H - h) * (t - ${margin}) / (${duration} - ${margin} * 2))\\, 0)" ${path}`)
    return vidpath
}

module.exports.combineVideos = function combineVideos(videos, name, extension = fileFormat) {
    return new Promise(async resolve => {
        fs.writeFileSync(`../videolists/${name}.txt`, videos.map(v => `file '../video-temp/${v}'`).join('\n'))

        let info = await ffprobe(`../video-temp/${videos[0]}`)
        let { height } = info.streams.find(obj => obj.codec_type === 'video')

        if (height > 1080) {
            concatAndScroll(name + '.txt', `../video-output/${name}.${extension}`)
                .then(resolve)
        } else {
            concatAndPad(name + '.txt', `../video-output/${name}.${extension}`)
                .then(resolve)
        }
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