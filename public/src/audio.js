const audio = new AudioContext();
let click_sfx, win_sfx, balloon_pop_sfx;
async function loadSFX() {
    fetch("/audio/click.wav").then(async (res) => {
        const array_buffer = await res.arrayBuffer();
        click_sfx = await audio.decodeAudioData(array_buffer);
    });
    fetch("/audio/win.mp3").then(async (res) => {
        const array_buffer = await res.arrayBuffer();
        win_sfx = await audio.decodeAudioData(array_buffer);
    });
    fetch("/audio/party-balloon-pop.mp3").then(async (res) => {
        const array_buffer = await res.arrayBuffer();
        balloon_pop_sfx = await audio.decodeAudioData(array_buffer);
    });
}

function playClick() {
    // Set Sound Effect
    const audio_source = audio.createBufferSource();
    audio_source.buffer = click_sfx;

    // Shift Sounds Towards Given Hz
    const highpass = audio.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 300; // Hz

    // Boost Lower Frequencies
    const presence = audio.createBiquadFilter();
    presence.type = "peaking";
    presence.frequency.value = 50; // Hz
    presence.Q.value = 0.1;
    presence.gain.value = 75; // dB

    // G A I N
    const gain = audio.createGain();
    gain.gain.value = 0.01;

    // Play
    audio_source
        .connect(highpass)
        .connect(presence)
        .connect(gain)
        .connect(audio.destination);
    audio_source.start(0);
}

function playWinSound() {
    // Set Sound Effect
    const audio_source = audio.createBufferSource();
    audio_source.buffer = win_sfx;

    // G A I N
    const gain = audio.createGain();
    gain.gain.value = 1;

    // Play
    audio_source
        .connect(gain)
        .connect(audio.destination);
    audio_source.start(0);
}

function playBalloonPopSound() {
    // Set Sound Effect
    const audio_source = audio.createBufferSource();
    audio_source.buffer = balloon_pop_sfx;

    // G A I N
    const gain = audio.createGain();
    gain.gain.value = 0.3;

    // Play
    audio_source
        .connect(gain)
        .connect(audio.destination);
    audio_source.start(0);
}