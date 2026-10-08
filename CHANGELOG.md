# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-10-08

First public release.

### Added

- `SKILL.md` workflow from brief to delivery: preflight, one-time brief, research, storyboard and script, audio first, images, scenes, draft review loop, final render and mix, automated QA and delivery report.
- Deterministic HTML motion engine (`assets/engine/`) and Playwright renderer with sub-frame motion blur, resumable chunks and parallel workers.
- ElevenLabs tooling: TTS with per-line regeneration and STT verification, Music composition plans, SFX kit, voice listing.
- Music analysis and splicing, and a NumPy music/SFX synthesizer as a fallback.
- Mixer with speech-band ducking, per-line narration-vs-bed report and two-pass loudness normalization to -14 LUFS.
- Automated QA: spec, loudness, dark segments, photosensitive flashes, frozen frames, low motion and STT of the final mix.
- Reference guides for brief, story, audio, images, design, engine, 22 motion techniques and QA.
- Evaluation prompts in `evals/evals.json`.

### Changed

- Narration reverb is off by default. `mix.py --hall` now sets the actual wet/dry ratio on speech (0.06 = -24 dB), uses a 1.4 s hall with a 30 ms pre-delay and a soft onset, and reports the reverb tail after each phrase (✗ above -28 dB). The previous 2.4 s hall at `--hall 0.12` produced a -22.8 dB tail and sounded echoey.

[Unreleased]: https://github.com/revfactory/showreel/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/revfactory/showreel/releases/tag/v1.0.0
