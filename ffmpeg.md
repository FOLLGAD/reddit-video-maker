preset doesnt speed up much; ranges from 90 seconds (ultrafast) to 108 seconds (standard). increases filesize by x3.
not worth it.

combineImageAudio hogs most of the processing time. 
simpleConcat takes ~1/3 of the total combineImageAudio time for the segment.

removing the '-loop 1' inputOption decreases the time taken to 27 seconds. But the output becomes weird and doesnt render properly.

I removed the video filters and the size casting, and after it goes quick.

render time speed: 465s (highest memory usage: 65-70%, during transition, and 50% during final render)
previous: 714s (memory usage ~55% during final render)

använda demuxer istället för re-encoding. något blir fel med outro-delen.

demuxer takes less memory overall (55% max) and takes 266 seconds. 3-4 times reduction in time. 

not reencoding the output in combineImageAudio seems to give players like YouTube problems between comment segments, probably a remnant from the "-loop 1" option.

Now it works faster and apparently problem-free, using the "-loop_stream 1" optiion instead. 
Full vid (12 min) in 80 seconds, of which combineVideoAudio takes 15.5 seconds.
the majority of the time is probably spent waiting for audio and puppetteer.
