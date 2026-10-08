#!/usr/bin/env python3
"""쇼릴 프로젝트 폴더를 만든다: 폴더 구조 + 엔진 템플릿 + 한글 폰트 + 렌더러 의존성.

사용법:
  python3 new_project.py <프로젝트 폴더> [--ratio 16:9|9:16|1:1] [--duration 60] [--fps 30] [--force-engine]

- 이미 있는 폴더에 다시 실행해도 안전하다: scenes.js·index.html 은 덮어쓰지 않고(엔진 engine.js·fx.js 만 최신으로),
  폰트는 없는 것만 받는다. --force-engine 은 index.html·scenes.js 까지 템플릿으로 되돌린다.
- 폰트는 ~/Library/Fonts 등 로컬에 있으면 복사(파일명은 ASCII 로), 없으면 내려받는다(Pretendard·Google Fonts, 모두 SIL OFL).
  실제로 확보된 폰트만 reel/fonts/fonts.css 에 @font-face 로 적는다.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
ENGINE = SKILL / "assets" / "engine"
SCRIPTS = SKILL / "scripts"

LOCAL_DIRS = [Path.home() / "Library/Fonts", Path("/Library/Fonts"), Path.home() / ".local/share/fonts", Path("/usr/share/fonts")]
PRETENDARD_URL = "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/woff2/PretendardVariable.woff2"
GOOGLE_CSS = ("https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;700;900&family=Black+Han+Sans"
              "&family=Anton&family=JetBrains+Mono:wght@400;500;700&display=block")
# 로컬에만 있으면 쓰는 선택 폰트: (파일명 패턴, 패밀리, 굵기, 저장 이름)
OPTIONAL_LOCAL = [
    (r"Paperlogy-(\d)\w*\.ttf", "Paperlogy", {4, 6, 7, 8, 9}),
    (r"에이투지체-(\d)\w*\.ttf", "A2Z", {4, 5, 7, 9}),
]


def find_local(name):
    for d in LOCAL_DIRS:
        if not d.exists():
            continue
        for p in d.rglob(name):
            return p
    return None


def curl(url, out=None):
    cmd = ["curl", "-sfL", "--max-time", "90", url]
    if out:
        cmd += ["-o", str(out)]
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        return None
    return r.stdout if not out else out


def is_font(p):
    try:
        head = Path(p).read_bytes()[:4]
    except OSError:
        return False
    return head in (b"\x00\x01\x00\x00", b"OTTO", b"true", b"wOF2", b"wOFF", b"ttcf")


def setup_fonts(fdir: Path):
    fdir.mkdir(parents=True, exist_ok=True)
    faces = []  # (family, weight, file)
    notes = []
    # 1) Pretendard (본문·헤드라인 기본)
    pv = None
    for cand in ("PretendardVariable.ttf", "PretendardVariable.woff2"):
        if (fdir / cand).exists() and is_font(fdir / cand):
            pv = fdir / cand
    if not pv:
        src = find_local("PretendardVariable.ttf")
        if src:
            pv = fdir / "PretendardVariable.ttf"
            shutil.copy2(src, pv)
            notes.append(f"Pretendard: 로컬 복사 ({src})")
        else:
            pv = fdir / "PretendardVariable.woff2"
            if curl(PRETENDARD_URL, pv) and is_font(pv):
                notes.append("Pretendard: 내려받음(jsdelivr npm)")
            else:
                pv.unlink(missing_ok=True)
                pv = None
                notes.append("Pretendard: 확보 실패 — 수동으로 reel/fonts/PretendardVariable.ttf 를 넣을 것")
    if pv:
        faces.append(("Pretendard", "45 920", pv.name))
    # 2) Google Fonts (세리프·임팩트·숫자·모노)
    css_cache = fdir / ".google.css"
    css = css_cache.read_text() if css_cache.exists() else None
    if css is None:
        body = curl(GOOGLE_CSS)
        css = body.decode() if body else ""
        if css:
            css_cache.write_text(css)
    for block in re.findall(r"@font-face\s*{(.*?)}", css, re.S):
        fam = re.search(r"font-family:\s*'([^']+)'", block).group(1)
        wt = re.search(r"font-weight:\s*(\d+)", block).group(1)
        url = re.search(r"url\((https://[^)]+)\)", block).group(1)
        fname = f"{fam.replace(' ', '')}-{wt}.ttf"
        dest = fdir / fname
        if not (dest.exists() and is_font(dest)):
            if not (curl(url, dest) and is_font(dest)):
                dest.unlink(missing_ok=True)
                notes.append(f"{fam} {wt}: 내려받기 실패")
                continue
        faces.append((fam, wt, fname))
    if not css:
        notes.append("Google Fonts: 접속 실패 — Noto Serif KR/Black Han Sans/Anton/JetBrains Mono 없이 진행(Pretendard 로 대체)")
    # 3) 로컬 선택 폰트(Paperlogy, 에이투지체) — 파일명을 ASCII 로
    for pat, fam, keep in OPTIONAL_LOCAL:
        for d in LOCAL_DIRS:
            if not d.exists():
                continue
            for p in d.glob("*.ttf"):
                m = re.fullmatch(pat, unicodedata.normalize("NFC", p.name))  # macOS 파일명은 NFD 일 수 있다
                if not m or int(m.group(1)) not in keep:
                    continue
                wt = str(int(m.group(1)) * 100)
                fname = f"{fam}-{wt}.ttf"
                if not (fdir / fname).exists():
                    shutil.copy2(p, fdir / fname)
                if (fam, wt, fname) not in faces:
                    faces.append((fam, wt, fname))
    lines = ["/* new_project.py 가 만든다. 실제로 있는 폰트만 적는다. 쓰는 굵기와 font-weight 가 맞아야 대체 글꼴이 안 나온다. */"]
    for fam, wt, fname in sorted(faces, key=lambda f: (f[0], f[1])):
        fmt = "woff2" if fname.endswith(".woff2") else "truetype"
        lines.append(f'@font-face {{ font-family: "{fam}"; src: url("{fname}") format("{fmt}"); font-weight: {wt}; font-display: block; }}')
    (fdir / "fonts.css").write_text("\n".join(lines) + "\n")
    return faces, notes


def ensure_node_deps():
    if (SCRIPTS / "node_modules" / "playwright-core").exists():
        return "playwright-core: 있음"
    r = subprocess.run(["npm", "install", "--no-audit", "--no-fund", "--silent"], cwd=SCRIPTS, capture_output=True, text=True)
    if r.returncode != 0:
        return "playwright-core: 설치 실패 — `cd %s && npm install` 을 직접 실행할 것\n%s" % (SCRIPTS, r.stderr[-400:])
    return "playwright-core: 설치함"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--ratio", default="16:9", choices=["16:9", "9:16", "1:1", "4:5"])
    ap.add_argument("--duration", type=float, default=60)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--force-engine", action="store_true")
    a = ap.parse_args()

    root = Path(a.project).resolve()
    for sub in ["research", "assets/img", "assets/photos", "assets/gen", "assets/cutout", "assets/logo",
                "audio/vo", "audio/music", "audio/sfx", "reel", "qa", "out"]:
        (root / sub).mkdir(parents=True, exist_ok=True)
    reel = root / "reel"
    for f in ["engine.js", "fx.js"]:
        shutil.copy2(ENGINE / f, reel / f)
    for f in ["index.html", "scenes.js"]:
        if a.force_engine or not (reel / f).exists():
            shutil.copy2(ENGINE / f, reel / f)
    if not (reel / "timeline.js").exists():
        (reel / "timeline.js").write_text("window.TL = window.TL || { cues: {}, vo: [], scenes: [] };\n")

    W, H = {"16:9": (1920, 1080), "9:16": (1080, 1920), "1:1": (1080, 1080), "4:5": (1080, 1350)}[a.ratio]
    # 새 scenes.js 라면 해상도·길이를 브리프에 맞춰 둔다(예시 장면은 16:9 기준이라 9:16 이면 새로 써야 한다)
    sj = reel / "scenes.js"
    txt = sj.read_text()
    if "REEL.config({ duration: 12, fps: 30, width: 1920, height: 1080" in txt and (a.ratio != "16:9"):
        print("주의: 예시 scenes.js 는 16:9 기준이다. 9:16/1:1 이면 장면을 새로 쓸 때 REEL.config 의 width/height 를 바꿀 것.")

    faces, notes = setup_fonts(reel / "fonts")
    dep = ensure_node_deps()
    meta = {"ratio": a.ratio, "width": W, "height": H, "fps": a.fps, "duration": a.duration}
    (root / "project.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1))

    print(f"프로젝트: {root}")
    print(f"규격: {W}x{H} {a.fps}fps, 목표 {a.duration:g}초  (REEL.config 에 같은 값을 쓸 것)")
    print("폰트: " + ", ".join(sorted({f'{f[0]} {f[1]}' for f in faces})))
    for n in notes:
        print("  - " + n)
    print(dep)
    print("미리보기: node %s/render.mjs --dir %s --serve" % (SCRIPTS, reel))


if __name__ == "__main__":
    main()
