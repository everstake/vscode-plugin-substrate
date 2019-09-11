export Dimension=2880x1800
export Video1Length=8
export Video2Length=15
export FadeDuration=2

ffmpeg -i 1.mp4 -i 2.mp4 \
-filter_complex \
"color=black:${Dimension}:d=21[base]; \
 [0:v]setpts=PTS-STARTPTS[v0]; \
 [1:v]format=yuva420p,fade=in:st=0:d=${FadeDuration}:alpha=1, \
      setpts=PTS-STARTPTS+((${Video1Length}-${FadeDuration})/TB)[v1]; \
 [base][v0]overlay[tmp]; \
 [tmp][v1]overlay,format=yuv420p[fv]" \
-map [fv] \
out.mp4

ffmpeg -i 1.mp4 -vf \
"format=yuv444p, \
 drawbox=y=ih-120:color=black@0.4:width=iw:height=120:t=fill, \
 drawtext=fontfile=OpenSans-Regular.ttf:text='Substrate plugin':fontcolor=white:fontsize=80:x=(w-tw)/2:y=h-th+20, \
 format=yuv420p" \
-c:v libx264 -c:a copy -movflags +faststart -y out.mp4
