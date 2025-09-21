let audioContext;

function playSound(file) {
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        if (!audioContext) {
            audioContext = new (AudioContext || webkitAudioContext)();
        }

        fetch(file)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start(0);
            });
    } else {
        // Fallback para navegadores antigos
        const audio = new Audio(file);
        audio.play();
    }
}

function playMoveSound() {
    playSound('move.mp3');
}

function playCaptureSound() {
    playSound('capture.mp3');
}