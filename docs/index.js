'use strict';
{
    // 定数の定義 && 変数の初期化
    const localVideo  = document.getElementById('video');
    const recordVideo = document.getElementById('recordVideo');
    const recordBtn   = document.getElementById('record');
    const playbackBtn = document.getElementById('playback');
    const downloadBtn = document.getElementById('download');
    let localStream;
    let mediaRecord;
    let recordBlobs;

    // メディアの種類や形態を指定
    const constraints = {
        video: false,
        // {
            // width: 1280,
            // height: 720,
        // },
        audio: true,
    };
    
    // ユーザーからメディアの使用許可を確認
    // OK: 音声と映像を取得
    // NO or Error: エラー表示
    navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
            localStream = stream;
        }).catch((error) => {
            console.log(error.name + ': ' + error.message);
            alert('接続に失敗しました');
        });
    
    recordBtn.addEventListener('click', () => {
        if (recordBtn.textContent === "録画開始") {
            navigator.mediaDevices.getDisplayMedia
                ({ 
                    video: {
                        width : 1280,
                        height: 720,
                    }
                    ,audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 44100
                    }
                })
                .then((stream) => {
                    recordBlobs = [];
                    const mediaType = { mimeType: 'video/webm;codecs=vp9' };
                    
                    try {
                            window.AudioContext = window.AudioContext||window.webkitAudioContext;
                            let audioContext = new AudioContext();
                            let source  = audioContext.createMediaStreamSource(localStream);
                            let source2 = audioContext.createMediaStreamSource(stream);
                            let splitter = audioContext.createChannelSplitter(2);
                            source.connect(splitter);
                            let splitter2 = audioContext.createChannelSplitter(2);
                            source2.connect(splitter2);
                            let video_gain_node = audioContext.createGain();
                            let camera_gain_node = audioContext.createGain();
                            video_gain_node.gain.value = 1;
                            camera_gain_node.gain.value = 1;
                            splitter.connect(video_gain_node);
                            splitter2.connect(camera_gain_node);
                            let merger = audioContext.createChannelMerger(4);
                            video_gain_node.connect(merger, 0, 0);
                            camera_gain_node.connect(merger, 0, 0);
                            video_gain_node.connect(audioContext.destination);
                            let dist = audioContext.createMediaStreamDestination();
                            merger.connect(dist);
                            let videoStream    = new MediaStream([...stream.getVideoTracks()]);
                            let audioStream    = new MediaStream([...dist.stream.getAudioTracks()]);
                            let outputStream = new MediaStream();
                            [audioStream, videoStream].forEach(function(s) {
                                s.getTracks().forEach(function(t) {
                                    outputStream.addTrack(t);
                                });
                            });
                            mediaRecord = new MediaRecorder(outputStream, mediaType);
                            
                    } catch(error) {
                        console.log(error.name + ': ' + error.message);
                        alert('録画をすることが出来ません')
                    }
        
                    // 一定間隔で録画が区切られて、データが渡される
                    mediaRecord.ondataavailable = (event) => {
                        recordBlobs.push(event.data);
                    };
                    
                    // メディア記録の開始 100ミリ秒ごとに録画データを区切る
                    mediaRecord.start(100);
                    
                    recordBtn.textContent = "録画停止";
                    playbackBtn.disabled  = true; 
                    downloadBtn.disabled  = true;
                }).catch((error) => {
                    console.log(error.name + ': ' + error.message);
                    alert('録画をすることが出来ません');
                });
        } else {
            // 録画停止
            mediaRecord.stop();

            // 録画停止時に呼ばれる
            mediaRecord.onstop = () => {
                mediaRecord = null;
            };

            recordBtn.textContent = "録画開始";
            playbackBtn.disabled  = false;
            downloadBtn.disabled  = false;

        }
    });

    playbackBtn.addEventListener('click', () => {
        const mediaType   = { type: 'video/webm' };
        const superBuffer = new Blob(recordBlobs, mediaType);
        const url = window.URL.createObjectURL(superBuffer);
        recordVideo.src = url;
        recordVideo.controls = true;
    });

    downloadBtn.addEventListener('click', () => {
        const mediaType = { type: 'video/webm' };
        const superBuffer = new Blob(recordBlobs, mediaType);
        const url = window.URL.createObjectURL(superBuffer);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "WebRTC.webm";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    });
}