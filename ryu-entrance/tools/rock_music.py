#!/usr/bin/env python3
"""록 공연 등장곡 합성(numpy만, 시드 고정). 휴대폰 스피커에서도 들리도록 에너지를 중음역(기타·스네어·박수·함성)에 둔다.

사용법: rock_music.py out.wav [--duration 24] [--bpm 120]
구성(120BPM, 1마디 2초)
  0–4   암전: 관중 웅성임이 커지고 심장박동 킥, 기타 피드백이 부풀어 오름
  4–8   관중 박수(박마다) + 4비트 킥 + 기타 팜뮤트 8분음
  8–11.5 스네어 백비트, 10초부터 스네어 롤 가속 + 라이저, 함성 상승
  11.5–12 완전 정적
  12    크래시 + 파워코드 + 함성 폭발
  12–20 풀 밴드(킥·스네어·하이햇·베이스·리프)
  20–24 마지막 코드가 울리며 함성
"""
import argparse, subprocess
import numpy as np

SR = 48000


def T(d): return np.arange(int(d * SR)) / SR


def filt(x, lo=None, hi=None, order=2):
    n = len(x)
    X = np.fft.rfft(x); f = np.maximum(np.fft.rfftfreq(n, 1 / SR), 1e-3); g = np.ones_like(f)
    if lo: g *= 1 / np.sqrt(1 + (lo / f) ** (2 * order))
    if hi: g *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    return np.fft.irfft(X * g, n)


def add(buf, x, t, gain=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(x)); buf[i:j] += x[:j - i] * gain


R = np.random.default_rng(7)


def noise(d): return R.standard_normal(int(d * SR))


def kick(big=1.0):
    t = T(0.45); f = 50 + 110 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 9) * 0.5
    click = filt(noise(0.45), 1500, 6000) * np.exp(-t * 200) * 0.6
    beater = np.sin(2 * np.pi * 220 * t) * np.exp(-t * 40) * 0.5   # 중음역 '퍽' — 작은 스피커에서도 들리게
    return np.tanh((body + click + beater) * 1.6 * big)


def snare():
    t = T(0.35)
    n = filt(noise(0.35), 1200, 8000) * np.exp(-t * 14)
    tone = (np.sin(2 * np.pi * 190 * t) + 0.5 * np.sin(2 * np.pi * 330 * t)) * np.exp(-t * 25)
    return np.tanh((n * 0.9 + tone * 0.7) * 1.8)


def hat(d=0.08):
    t = T(d); return filt(noise(d), 7000) * np.exp(-t * 60) * 0.5


def crash(d=3.0):
    t = T(d); return filt(noise(d), 4000, 14000) * np.exp(-t * 1.4) * 0.8


def clap(voices=40, spread=0.03):
    out = np.zeros(int(0.3 * SR))
    for v in range(voices):   # 관중 박수: 여러 사람이 조금씩 어긋나게
        o = abs(R.normal(0, spread)); b = filt(noise(0.06), 900, 5000) * np.exp(-T(0.06) * 70)
        add(out, b, o, R.uniform(0.3, 1.0) / np.sqrt(voices) * 3.0)
    return out


def guitar(freq, d, mute=False, drive=7.0):
    """파워코드(근음·5도·옥타브), 디튠 톱니파 → 왜곡 → 캐비닛 필터"""
    t = T(d); x = np.zeros_like(t)
    for m in (1, 1.4983, 2):
        for det in (-0.12, 0.0, 0.11):
            f = freq * m * 2 ** (det / 12)
            x += (2 * ((t * f) % 1) - 1) * (0.5 if m == 2 else 1.0)
    env = np.exp(-t * (28 if mute else 0.5)) * np.minimum(1, t * 400)
    if not mute: env *= np.minimum(1, (d - t) * 30)
    y = np.tanh(x / 4 * drive * env)
    y = filt(y, 110, 4200 if not mute else 2200, order=2)
    y = y + filt(y, 1800, 3200) * 0.6   # 존재감(중고역)
    return y * 0.55


def bass(freq, d):
    t = T(d); x = 2 * ((t * freq) % 1) - 1
    return filt(np.tanh(x * 2), 60, 900) * np.minimum(1, (d - t) * 40) * 0.45


def crowd(d, level):
    """관중 소리: 대역 제한 핑크 잡음 + 느린 출렁임 + 높은 '와' 성분. level(t) 는 0~1 곡선."""
    n = noise(d); w = np.fft.rfft(n); f = np.maximum(np.fft.rfftfreq(len(n), 1 / SR), 1); w /= np.sqrt(f)
    pink = np.fft.irfft(w, len(n)); pink /= np.abs(pink).max()
    body = filt(pink, 250, 3500)
    whoo = filt(noise(d), 900, 2600) * (0.5 + 0.5 * np.sin(2 * np.pi * T(d) * 0.7 + 1))
    tt = T(d); wob = 1 + 0.25 * np.sin(2 * np.pi * 0.9 * tt) + 0.15 * np.sin(2 * np.pi * 2.3 * tt + 2)
    return (body * 3 + whoo * 0.25) * wob * level(tt)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('out'); ap.add_argument('--duration', type=float, default=24); ap.add_argument('--bpm', type=float, default=120)
    a = ap.parse_args(); D = a.duration; bt = 60 / a.bpm
    L = np.zeros(int(D * SR) + SR); Rr = np.zeros_like(L)
    def both(x, t, g=1.0, pan=0.0):
        add(L, x, t, g * (1 - max(0, pan))); add(Rr, x, t, g * (1 + min(0, pan)))
    E, G, A, C, D5 = 82.41, 98.0, 110.0, 130.81, 146.83
    # 관중: 0→11.5 상승, 11.5~12 숨죽임, 12 폭발 뒤 유지
    def lev(t):
        up = np.clip(t / 11.5, 0, 1) ** 1.6 * 0.9 + 0.12
        hush = np.where((t > 11.45) & (t < 12.0), 0.04, 1.0)
        boom = np.where(t >= 12, 1.25 * np.exp(-(t - 12) * 0.35) + 0.55, 1.0)
        return np.where(t >= 12, boom, up * hush)
    cr = crowd(D, lev)
    both(cr * 0.30, 0, pan=-0.2); both(np.roll(cr, 2400) * 0.30, 0, pan=0.2)
    # 0–4 심장박동 + 피드백
    for k in range(4):
        both(kick(0.9), k * 1.0, 0.8); both(kick(0.6), k * 1.0 + 0.22, 0.45)
    fb = np.sin(2 * np.pi * 329.6 * T(4)) * np.minimum(1, T(4) / 4) ** 2
    both(np.tanh(fb * 3) * 0.10, 0.0)
    # 4–12 박수 + 킥 + 팜뮤트
    for i in range(int(4 / bt), int(11.5 / bt)):
        t = i * bt
        both(clap(), t, 0.9 if t < 8 else 1.1)
        both(kick(), t, 0.9)
        if t >= 8 and i % 2 == 1: both(snare(), t, 0.8)
        for e in range(2):
            both(guitar(E, bt / 2, mute=True), t + e * bt / 2, 0.6 + 0.4 * (t - 4) / 7.5, pan=-0.35)
            both(guitar(E, bt / 2, mute=True), t + e * bt / 2 + 0.008, 0.6 + 0.4 * (t - 4) / 7.5, pan=0.35)
    # 10–11.45 스네어 롤 가속
    t = 10.0; step = bt / 2
    while t < 11.42:
        both(snare(), t, 0.5 + 0.6 * (t - 10) / 1.45); step = max(0.045, step * 0.88); t += step
    rz = filt(noise(2.0), 600, 9000) * np.linspace(0, 1, int(2 * SR)) ** 3
    both(rz * 0.35, 9.45)
    # 12 폭발
    both(crash(4), 12.0, 1.0); both(kick(1.3), 12.0, 1.2)
    both(guitar(E, 1.9), 12.0, 1.0, pan=-0.4); both(guitar(E, 1.9), 12.006, 1.0, pan=0.4); both(bass(E / 2, 1.9), 12.0, 1.0)
    # 12–20 풀 밴드 리프 (마디마다 E E G A)
    riff = [E, E, G, A]
    for i in range(int(12 / bt) + 0, int(20 / bt)):
        t = i * bt; bar_beat = i % 4
        both(kick(), t, 1.0)
        if bar_beat in (1, 3): both(snare(), t, 1.0)
        for e in range(2): both(hat(), t + e * bt / 2, 0.8, pan=0.3)
        if t >= 14.0:
            f = riff[bar_beat]
            both(guitar(f, bt * 0.92), t, 0.85, pan=-0.4); both(guitar(f, bt * 0.92), t + 0.007, 0.85, pan=0.4)
            both(bass(f / 2, bt * 0.92), t, 1.0)
        if bar_beat == 0 and t >= 14: both(crash(1.5), t, 0.45)
    # 20 마지막 코드
    both(crash(4), 20.0, 1.0); both(kick(1.3), 20.0, 1.1)
    both(guitar(E, 3.9), 20.0, 1.0, pan=-0.4); both(guitar(E, 3.9), 20.006, 1.0, pan=0.4); both(bass(E / 2, 3.9), 20.0, 0.9)
    st = np.stack([L, Rr], 1)[:int(D * SR)]
    st = np.stack([filt(st[:, 0], 55, order=3), filt(st[:, 1], 55, order=3)], 1)
    fade = np.ones(len(st)); n = int(1.5 * SR); fade[-n:] = np.linspace(1, 0, n) ** 1.5; st *= fade[:, None]
    st /= np.abs(st).max() / 0.89
    raw = (st * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', a.out], input=raw, check=True)
    print(a.out, f'{D}s')


if __name__ == '__main__':
    main()
