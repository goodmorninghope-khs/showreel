#!/usr/bin/env python3
"""ElevenLabs 키가 없을 때의 대체 나레이션: sherpa-onnx 오프라인 한국어 TTS(VITS, KSS 음성)로 script.json 의 줄을 만들고
오프라인 한국어 STT(zipformer)로 받아써서 가장 정확한 테이크를 고른다. narrate.py 와 같은 출력 형식
(audio/vo/<id>.mp3, <id>.align.json, report.json)을 만들어 timeline.py·mix.py 를 그대로 쓴다.

사용법
  local_narrate.py <project>/script.json --tts-dir <vits-mimic3-ko_KO-kss_low> --asr-dir <sherpa-onnx-zipformer-korean-2024-06-24>
글자 시각은 발화 구간 안에 글자 수 비례로 나눈 근사값이다(ElevenLabs 정렬 정보가 없으므로).
"""
import argparse, json, re, subprocess, sys
from pathlib import Path
import numpy as np
import sherpa_onnx
import soundfile as sf

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
from narrate import judge  # noqa: E402

SPEEDS = [0.82, 0.86, 0.9, 0.94]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script"); ap.add_argument("--tts-dir", required=True); ap.add_argument("--asr-dir", required=True)
    ap.add_argument("--only")
    a = ap.parse_args()
    sp = Path(a.script).resolve(); proj = sp.parent; cfg = json.loads(sp.read_text())
    out = proj / "audio" / "vo"; out.mkdir(parents=True, exist_ok=True)
    d = a.tts_dir
    tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
        vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f"{d}/ko_KO-kss_low.onnx", lexicon="", tokens=f"{d}/tokens.txt",
                                                   data_dir=f"{d}/espeak-ng-data"), num_threads=4)))
    r = a.asr_dir
    asr = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=f"{r}/encoder-epoch-99-avg-1.int8.onnx",
        decoder=f"{r}/decoder-epoch-99-avg-1.int8.onnx", joiner=f"{r}/joiner-epoch-99-avg-1.int8.onnx",
        tokens=f"{r}/tokens.txt", num_threads=4)
    rep_path = out / "report.json"
    report = json.loads(rep_path.read_text()) if rep_path.exists() else {}
    only = set(a.only.split(",")) if a.only else None
    for l in cfg["lines"]:
        lid = l["id"]
        if only and lid not in only:
            continue
        say = (l.get("tts") or l["text"]).strip()
        speeds = l.get("speeds", SPEEDS)
        best = None
        for k, spd in enumerate(speeds):
            g = tts.generate(say, sid=0, speed=spd)
            x = np.asarray(g.samples, np.float32); sr = g.sample_rate
            st = asr.create_stream(); st.accept_waveform(sr, x); asr.decode_stream(st)
            sim, ok = judge(st.result.text, l)
            cand = (bool(ok), sim, spd, x, sr, st.result.text)
            if best is None or cand[:2] > best[:2]:
                best = cand
        ok, sim, spd, x, sr, stt = best
        pad = np.zeros(int(sr * 0.15), np.float32)
        x = np.concatenate([pad, x, pad])
        wav = out / f"{lid}.wav"; sf.write(wav, x, sr)
        mp3 = out / f"{lid}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-ar", "44100", "-b:a", "192k", str(mp3)], check=True)
        # 발화 구간: 20ms 창 피크가 최대의 6% 넘는 처음·끝
        hop = int(sr * 0.02); n = len(x) // hop
        e = np.abs(x[:n * hop]).reshape(n, hop).max(1); th = e.max() * 0.06
        idx = np.where(e > th)[0]; s0, s1 = idx[0] * 0.02, (idx[-1] + 1) * 0.02
        chars = list(say); w = [1.0 if c.isalnum() else (2.0 if c in ",.?!…" else 0.3) for c in chars]
        cw = np.cumsum([0] + w); tot = cw[-1]
        stt_ = [s0 + (s1 - s0) * cw[i] / tot for i in range(len(chars))]
        ent = [s0 + (s1 - s0) * cw[i + 1] / tot for i in range(len(chars))]
        (out / f"{lid}.align.json").write_text(json.dumps({"characters": chars, "character_start_times_seconds": stt_,
                                                           "character_end_times_seconds": ent}, ensure_ascii=False))
        dur = len(x) / sr
        nchar = len(re.findall(r"[0-9A-Za-z가-힣]", say))
        report[lid] = {"file": mp3.name, "dur": round(dur, 3), "speech_start": round(s0, 3), "speech_end": round(s1, 3),
                       "stt": stt, "sim": round(sim, 3), "ok": ok, "speed": spd, "text": l["text"], "tts": say,
                       "chars": nchar, "rate": round(nchar / max(.1, s1 - s0), 2), "engine": "sherpa-onnx vits kss (local)"}
        print(f"{lid} {'✓' if ok else '✗'} sim {sim:.2f} speed {spd} 발화 {s1 - s0:.2f}s  {say}\n      STT: {stt}")
    rep_path.write_text(json.dumps(report, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
