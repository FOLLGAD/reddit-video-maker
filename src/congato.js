const { combineFinal } = require('../src/video')
// ffmpeg transition between all comments

const fs = require('fs')

let files = fs.readdirSync('../for-compilation').sort((a, b) => {
    if (a[0] == 'Q') return 1
    if (a > b) return -1
    else return 1
}).map(file => `../for-compilation/${file}`)

let transition = '../static/mono.mp4'
// $ ffmpeg -i transition.mp4 -r 30 -ac 1 mono.mp4

let videos = files.sort((ax, bx) => {
    let a = ax.split("/").pop().split('.')[0]
    let b = bx.split("/").pop().split('.')[0]
    if (isNaN(a) && isNaN(b)) {
        return a > b ? -1 : 1
    } else if (isNaN(a)) {
        return -1
    } else if (isNaN(b)) {
        return 1
    } else {
        return parseInt(a) > parseInt(b) ? 1 : -1
    }
})
console.log(videos)

videos = videos.reduce((r, a) => r.concat(a, transition), [])
videos.push('../static/mono-outro.mp4')

let d = combineFinal(videos, 'final')
d.then(console.log)