const { combineFinal, addSound } = require('../src/video')

const fs = require('fs')

// $ ffmpeg -i transition.mp4 -r 30 -ac 1 mono.mp4

function pre(ext = 'mp4') {
    let files = fs.readdirSync('../for-compilation')
        .filter(d => {
            return !isNaN(d.split('/').pop().split('.')[0]) // Filter out all that don't have numbers as file names
        })
        .map(file => `../for-compilation/${file}`)

    let videos = files.sort((ax, bx) => {
        let a = ax.split("/").pop().split('.')[0]
        let b = bx.split("/").pop().split('.')[0]

        return parseInt(a) > parseInt(b) ? 1 : -1
    })

    videos = videos.reduce((r, a) => r.concat(a, '../static/transition.mkv'), [])

    console.log(videos)

    let name = 'pre-final'

    return combineFinal(videos, name, ext)
}


let cmd = process.argv[2]
if (cmd == "full") {
    if (!process.argv[3]) {
        console.error("Enter a song file! (relative to 'static' folder)")
        process.exit(0)
    }
    full(process.argv[3])
} else {
    pre()
}

function full(song) {
    pre('mkv')
        .then(file => {
            return addSound('../out/' + file, '../static/' + song, 'with-song', 'mkv')
        })
        .then(file => {
            let videos = ['../video-output/Q.mkv', '../out/' + file, '../static/outro.mkv']
            return combineFinal(videos, 'final', 'mp4')
        })
        .then(console.log)
}