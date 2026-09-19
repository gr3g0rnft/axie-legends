import wave
import struct
import math
import random
import os

SAMPLE_RATE = 44100

def save_wav(filename, samples):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        for s in samples:
            val = max(-32768, min(32767, int(s * 32767)))
            f.writeframes(struct.pack('<h', val))
    print(f"✅ Generado: {filename}")

# 1. Disparo (Laser/Bala)
def gen_shoot():
    dur = 0.15
    samples = []
    for i in range(int(SAMPLE_RATE * dur)):
        t = i / SAMPLE_RATE
        freq = 800 - t * 4000
        val = math.sin(2 * math.pi * freq * t) * math.exp(-t * 10)
        samples.append(val)
    return samples

# 2. Impacto (Hit)
def gen_hit():
    dur = 0.1
    samples = []
    for i in range(int(SAMPLE_RATE * dur)):
        t = i / SAMPLE_RATE
        noise = random.uniform(-1, 1)
        val = noise * math.exp(-t * 25)
        samples.append(val)
    return samples

# 3. Explosión (Torre/Nexo)
def gen_explosion():
    dur = 0.8
    samples = []
    for i in range(int(SAMPLE_RATE * dur)):
        t = i / SAMPLE_RATE
        noise = random.uniform(-1, 1)
        env = math.exp(-t * 4)
        sub = math.sin(2 * math.pi * (60 + 40 * math.exp(-t * 8)) * t)
        val = (noise * 0.7 + sub * 0.3) * env
        samples.append(val)
    return samples

# 4. Moneda / Oro (Gold)
def gen_gold():
    dur = 0.25
    samples = []
    f1, f2 = 987.77, 1318.51 # B5, E6
    for i in range(int(SAMPLE_RATE * dur)):
        t = i / SAMPLE_RATE
        freq = f1 if t < 0.12 else f2
        val = math.sin(2 * math.pi * freq * t) * math.exp(-t * 8)
        samples.append(val)
    return samples

# 5. Poción (Potion)
def gen_potion():
    dur = 0.3
    samples = []
    for i in range(int(SAMPLE_RATE * dur)):
        t = i / SAMPLE_RATE
        freq = 400 + t * 1200
        val = math.sin(2 * math.pi * freq * t) * math.exp(-t * 5)
        samples.append(val)
    return samples

# 6. Victoria (Victory)
def gen_victory():
    dur = 1.2
    samples = []
    notes = [523.25, 659.25, 783.99, 1046.50] # C5, E5, G5, C6
    note_dur = dur / len(notes)
    for i in range(int(SAMPLE_RATE * dur)):
        t = i / SAMPLE_RATE
        idx = min(int(t / note_dur), len(notes) - 1)
        freq = notes[idx]
        local_t = t % note_dur
        val = math.sin(2 * math.pi * freq * t) * math.exp(-local_t * 3)
        samples.append(val)
    return samples

# 7. Derrota (Defeat)
def gen_defeat():
    dur = 1.2
    samples = []
    notes = [300, 280, 250, 200]
    note_dur = dur / len(notes)
    for i in range(int(SAMPLE_RATE * dur)):
        t = i / SAMPLE_RATE
        idx = min(int(t / note_dur), len(notes) - 1)
        freq = notes[idx]
        local_t = t % note_dur
        val = math.sin(2 * math.pi * freq * t) * math.exp(-local_t * 4)
        samples.append(val)
    return samples

save_wav("/mnt/d/AXIELEGENDS/public/sounds/shoot.wav", gen_shoot())
save_wav("/mnt/d/AXIELEGENDS/public/sounds/hit.wav", gen_hit())
save_wav("/mnt/d/AXIELEGENDS/public/sounds/explosion.wav", gen_explosion())
save_wav("/mnt/d/AXIELEGENDS/public/sounds/gold.wav", gen_gold())
save_wav("/mnt/d/AXIELEGENDS/public/sounds/potion.wav", gen_potion())
save_wav("/mnt/d/AXIELEGENDS/public/sounds/victory.wav", gen_victory())
save_wav("/mnt/d/AXIELEGENDS/public/sounds/defeat.wav", gen_defeat())
print("🔊 Todos los sonidos generados con éxito.")
