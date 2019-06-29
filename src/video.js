const ffmpeg = require('fluent-ffmpeg')

let color = '#19191a' // Dark mode
// let color = '#ffffff' // Light mode

// ffmpeg -i transition_new_dark.mp4 -c:a aac -c:v libx264 -r 25 -ac 2 -ar 24000 transition_dark.mkv

let intermediaryFileFormat = 'ts'
let tempFolder = '../video-temp/'

const probe = module.exports.probe = function (path) {
    return new Promise((res, rej) => {
        ffmpeg.ffprobe(path, (err, data) => {
            if (err) rej(err);
            else res(data);
        })
    })
}

const concatAndReencode = module.exports.concatAndReencode = function (videoPaths, outPath) {
    return new Promise((res, rej) => {
        ffmpeg(`concat:${videoPaths.join('|')}`)
            .videoCodec('copy')
            .audioCodec('copy')
            .audioFrequency(24000)
            .output(outPath)
            .fps(25)
            .on('end', res)
            .on('error', console.error)
            .exec()
    })
}

const simpleConcat = module.exports.simpleConcat = function (videoPaths, outPath) {
    return new Promise((res, rej) => {
        ffmpeg(`concat:${videoPaths.join('|')}`)
            .videoCodec('copy')
            .audioCodec('copy')
            .inputFPS(25)
            .audioFrequency(24000)
            .audioChannels(1)
            .output(outPath)
            .on('end', res)
            .on('error', console.error)
            .exec()
    })
}

const combineImageAudio = module.exports.combineImageAudio = function (videoPath, audioPath, outPath) {
    return new Promise(async (res, rej) => {
        let info = await probe(audioPath)
        ffmpeg(videoPath)
            .inputOptions([
                '-loop 1',
            ])
            .videoCodec('libx264')
            .videoFilters([
                `pad=height=ceil(ih/2)*2:color=${color}`,
            ])
            .input(audioPath)
            .duration(info.format.duration - 0.15)
            .fps(25)
            .outputOptions([
                '-shortest',
                '-pix_fmt yuv420p',
                '-crf 20',
            ])
            .audioCodec('aac')
            .audioFrequency(24000)
            .audioChannels(1)
            .size('1920x?')
            .output(outPath)
            .on('end', res)
            .on('error', console.error)
            .exec()
    })
}

const combineVideoAudio = module.exports.combineVideoAudio = function (videoPath, audioPath, outPath) {
    return new Promise((res, rej) => {
        ffmpeg(videoPath)
            .videoCodec('libx264')
            .input(audioPath)
            .audioCodec('aac')
            .complexFilter([
                '[0:a][1:a]amerge=inputs=2[a]',
            ])
            .outputOptions([
                '-shortest',
                '-map 0:v',
                '-map [a]',
            ])
            .audioFrequency(24000)
            .audioChannels(1)
            .output(outPath)
            .on('end', res)
            .on('error', console.error)
            .exec()
    })
}

const padAndConcat = module.exports.padAndConcat = function (videoPaths, outPath) {
    return new Promise((res, rej) => {
        ffmpeg(`concat:${videoPaths.join('|')}`)
            .videoFilters([
                `pad=1920:1080:(ow-iw)/2:(oh-ih)/2:${color}`
            ])
            .videoCodec('libx264')
            .audioCodec('aac')
            .audioFrequency(24000)
            .audioChannels(1)
            .output(outPath)
            .on('end', res)
            .on('error', console.error)
            .exec()
    })
}

const scrollAndConcat = module.exports.scrollAndConcat = async function (videoPaths, outPath) {
    let temp = tempFolder + 'scroll-temp.' + intermediaryFileFormat
    await simpleConcat(videoPaths, temp)

    let info = await probe(temp)
    let duration = info.format.duration
    let margin = 6

    return await new Promise(res => {
        ffmpeg(`color=c=${color}:s=1920x1080`)
            .inputFormat('lavfi')
            .input(temp)
            .videoCodec('libx264')
            .audioCodec('aac')
            .audioFrequency(24000)
            .audioChannels(1)
            .duration(duration)
            .complexFilter([
                // `[0]overlay=y=if(gte(t, ${margin}), if(gte(t, ${duration} - ${margin}), H - h, (H - h) * (t - ${margin}) / (${duration} - ${margin} * 2)), 0)`
                {
                    inputs: '0', filter: 'overlay',
                    options: {
                        y: `if(gte(t, ${duration / 2}), H - h, 0)` // Simple up/down
                    }
                }
            ])
            .output(outPath)
            .on('end', res)
            .on('error', console.error)
            .exec()
    })
}

const advancedConcat = module.exports.advancedConcat = async function (videoPaths, outPath) {
    let info = await probe(videoPaths[0])
    let { height } = info.streams.find(obj => obj.codec_type === 'video')
    if (height > 1080) {
        return await scrollAndConcat(videoPaths, outPath)
    } else {
        return await padAndConcat(videoPaths, outPath)
    }
}