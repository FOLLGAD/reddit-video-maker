# files

Every file has to be almost exactly equal to be concatted correctly:
* FPS must be same
* Same codecs
* Same audio Sample rate


# process

## generate comment videos
1. cd into src/
2. `node api-fetch threadId` (change threadId to the ID, like `aiv6l6`)
3. done

## clip together compilation
1. move all the wanted comments from /video-output into /for-compilation
2. `node congato pre` in /src
3. file will be named pre-final in /out
4. cut unwanted parts
5. add background music

## add intro and outro
1. run `node congato final` in /src
2. product will be called final.mp4