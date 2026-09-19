import wave, struct, math, random, os

SAMPLE_RATE = 44100

def save_wav(fn, samples):
    os.makedirs(os.path.dirname(fn), exist_ok=True)
    with wave.open(fn, 'w') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SAMPLE_RATE)
        frames = b''
        for s in samples:
            v = max(-32768, min(32767, int(s * 32767)))
            frames += struct.pack('<hh', v, v)  # stereo
        f.writeframes(frames)

# Música de fondo: loop de 30 segundos, estilo 8-bit/ambiental
def gen_music():
    dur = 30.0
    samples = []
    # Progresión: Am - F - C - G (i - VI - III - VII en La menor)
    chords = [
        [220.00, 261.63, 329.63],  # Am
        [174.61, 220.00, 261.63],  # F
        [130.81, 164.81, 196.00],  # C
        [196.00, 246.94, 293.66],  # G
    ]
    chord_dur = dur / len(chords)
    note_len = chord_dur / 4
    
    for i in range(int(SAMPLE_RATE * dur)):
        t = i / SAMPLE_RATE
        chord_idx = int(t / chord_dur) % len(chords)
        chord = chords[chord_idx]
        
        # Arpegio suave
        note_idx = int((t % chord_dur) / note_len) % len(chord)
        base_freq = chord[note_idx]
        
        # Múltiples octavas
        val = 0
        for octave in [0, 1, 2]:
            freq = base_freq * (2 ** octave)
            amp = 0.08 / (octave + 1)
            val += math.sin(2 * math.pi * freq * t) * amp
        
        # Envelope suave por nota
        local_t = t % note_len
        env = math.exp(-local_t * 8) * 0.5 + 0.1
        
        # Filtro paso bajo simple (simulado)
        val = val * env * 0.3
        
        # Añadir bajo (root note)
        bass_freq = chord[0] / 2
        val += math.sin(2 * math.pi * bass_freq * t) * 0.05 * math.exp(-(t % chord_dur) * 2)
        
        # Noise suave para textura
        val += random.uniform(-0.005, 0.005)
        
        samples.append(val)
    return samples

save_wav("/mnt/d/AXIELEGENDS/public/sounds/music.wav", gen_music())
print("Música generada")
