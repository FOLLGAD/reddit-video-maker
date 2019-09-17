#!/bin/sh

ffmpeg -i $1 -c:a aac -c:v libx264 -ac 1 -ar 24000 $2

# Has to be:
# rate 24000 to not get skewed pitch (too dark or too light)
# aac and libx264 codecs for audio/video respectively in order to be able to use demuxer-concat
# Mono sound (1 channel). May not be needed