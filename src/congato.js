const { combineFinal, addPeripherals } = require('../src/video')
// ffmpeg transition between all comments

const fs = require('fs')

// $ ffmpeg -i transition.mp4 -r 30 -ac 1 mono.mp4

function pre() {
    let files = fs.readdirSync('../for-compilation')
        .filter(d => {
            return !isNaN(d.split('/').pop().split('.')[0])
        })
        .map(file => `../for-compilation/${file}`)

    console.log(files)

    let videos = files.sort((ax, bx) => {
        let a = ax.split("/").pop().split('.')[0]
        let b = bx.split("/").pop().split('.')[0]

        return parseInt(a) > parseInt(b) ? 1 : -1
    })

    videos = videos.reduce((r, a) => r.concat(a, '../static/transition.mkv'), []).slice(0, -1)

    combineFinal(videos, 'final')
        .then(console.log)
}

function final() {
    addPeripherals(["../video-output/Q.mp4", "../out/pre-final-mono.mp4", '../static/transition_rs_mono.mp4', "../static/mono-outro.mp4"])
}

let cmd = process.argv[2]
if (cmd == "pre") {
    pre()
} else {
    final()
}