/* 류경기 중랑구청장 등장 영상 v2(24초, 범용) — 록 공연 등장처럼.
 * 암전된 공연장 → 기다리는 관중(코드로 그린 역광 실루엣)과 구청장 사진 클로즈업이 박자마다 교차 → 정적 → 폭발과 함께 등장.
 * 120BPM(1박 0.5초). 관중은 실존 인물이 아닌 그래픽 실루엣이다. */
const { ease, prog, win, kf, spring, clamp, lerp, rand, noise, split, stagger, css, h, s, cue } = REEL;
REEL.config({ duration: 24, fps: 30, width: 1920, height: 1080, audio: null });

const F = 0.5 / 30;
const W = 1920, H = 1080;
const NAVY = '#070b1e', ROSE = '#e6336b', CREAM = '#fff3ec', PINK = '#ff6f9c';
const DROP = 12.0;

/* ── 무대 조명 빛줄기 ── */
function beams(g, t, o) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const n = o.n || 6;
  for (let i = 0; i < n; i++) {
    const x0 = (i + 0.5) / n * W + (o.dx || 0);
    const a = Math.PI / 2 + Math.sin(t * (0.5 + rand(i, 61) * 0.6) + i * 1.7) * (o.swing || 0.35);
    const len = 1700, wdt = 0.07 + rand(i, 62) * 0.05;
    const col = i % 2 ? o.c1 : o.c2;
    const gr = g.createLinearGradient(x0, -40, x0 + Math.cos(a) * len, -40 + Math.sin(a) * len);
    gr.addColorStop(0, col.replace('A', (o.a * 0.9).toFixed(3))); gr.addColorStop(1, col.replace('A', '0'));
    g.fillStyle = gr; g.beginPath(); g.moveTo(x0, -40);
    g.lineTo(x0 + Math.cos(a - wdt) * len, -40 + Math.sin(a - wdt) * len);
    g.lineTo(x0 + Math.cos(a + wdt) * len, -40 + Math.sin(a + wdt) * len); g.closePath(); g.fill();
  }
  g.restore();
}

/* ── 관중 실루엣: 머리·어깨·들어 올린 팔·휴대폰 불빛·응원봉 ── */
function crowd(g, t, o) {
  const rows = o.rows, seed = o.seed || 0;
  for (let r = 0; r < rows.length; r++) {
    const R = rows[r]; const n = Math.ceil(W / R.gap) + 2;
    for (let i = 0; i < n; i++) {
      const id = seed * 1000 + r * 100 + i;
      const x = -R.gap + i * R.gap + (rand(id, 1) - .5) * R.gap * .6 + (r % 2) * R.gap * .5;
      const bob = Math.sin(t * Math.PI * 2 * (o.bpmHz || 2) * 0.5 + rand(id, 2) * 6) * R.s * 0.08 * (o.energy || 0.3);
      const y = R.y + (rand(id, 3) - .5) * R.s * .3 + bob;
      const s = R.s * (0.85 + rand(id, 4) * .3);
      g.fillStyle = R.col;
      g.beginPath(); g.ellipse(x, y + s * 1.25, s * 1.15, s * 0.75, 0, Math.PI, 0); g.lineTo(x + s * 1.3, y + s * 3); g.lineTo(x - s * 1.3, y + s * 3); g.fill();   // 어깨
      g.beginPath(); g.arc(x, y, s * 0.55, 0, Math.PI * 2); g.fill();   // 머리
      const up = rand(id, 5) < (o.arms || 0);
      if (up) {
        g.strokeStyle = R.col; g.lineCap = 'round'; g.lineWidth = s * 0.34;
        for (const side of [-1, 1]) {
          if (side === 1 && rand(id, 6) < 0.4) continue;
          const sw = Math.sin(t * Math.PI * (o.bpmHz || 2) + rand(id, 7) * 6 + side) * 0.25 * (o.energy || 0.3);
          const ang = -Math.PI / 2 + side * (0.25 + rand(id, 8) * 0.35) + sw;
          const L = s * (2.4 + rand(id, 9) * 0.6);
          const sx = x + side * s * 0.8, sy = y + s * 1.0;
          const hx = sx + Math.cos(ang) * L, hy = sy + Math.sin(ang) * L;
          g.beginPath(); g.moveTo(sx, sy); g.lineTo(hx, hy); g.stroke();
          g.beginPath(); g.arc(hx, hy, s * 0.26, 0, Math.PI * 2); g.fill();
          const kind = rand(id, 10 + side);
          if (kind < (o.phones || 0)) {   // 휴대폰 불빛
            const tw = 0.75 + 0.25 * Math.sin(t * 7 + id);
            g.save(); g.globalCompositeOperation = 'lighter';
            const rg = g.createRadialGradient(hx, hy - s * .3, 0, hx, hy - s * .3, s * 1.6);
            rg.addColorStop(0, `rgba(255,250,240,${0.9 * tw})`); rg.addColorStop(0.15, `rgba(255,240,230,${0.35 * tw})`); rg.addColorStop(1, 'rgba(255,240,230,0)');
            g.fillStyle = rg; g.fillRect(hx - s * 2, hy - s * 2, s * 4, s * 4); g.restore();
          } else if (kind < (o.phones || 0) + (o.sticks || 0)) {   // 장미색 응원봉
            g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,90,140,.95)'; g.lineWidth = s * 0.22;
            g.shadowColor = PINK; g.shadowBlur = s * 1.2;
            g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + Math.cos(ang) * s * 1.6, hy + Math.sin(ang) * s * 1.6); g.stroke(); g.restore();
          }
        }
      }
    }
  }
}

/* 관중 컷 세 가지 구도 */
const SHOTS = {
  wide: { rows: [{ y: 720, gap: 46, s: 15, col: '#0b0f22' }, { y: 820, gap: 62, s: 21, col: '#080b19' }, { y: 960, gap: 92, s: 32, col: '#05070f' }], arms: 0.55, phones: 0.35, sticks: 0.3 },
  close: { rows: [{ y: 700, gap: 170, s: 58, col: '#0a0d1d' }, { y: 930, gap: 300, s: 105, col: '#04050b' }], arms: 0.8, phones: 0.25, sticks: 0.5 },
  hands: { rows: [{ y: 860, gap: 120, s: 46, col: '#090c1b' }, { y: 1060, gap: 210, s: 80, col: '#04050b' }], arms: 0.95, phones: 0.55, sticks: 0.35 },
};

function stageBg(g, t, glow, hue) {
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0b1236'); bg.addColorStop(0.55, hue || '#2a1240'); bg.addColorStop(1, '#05060e');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const rg = g.createRadialGradient(W / 2, 560, 0, W / 2, 560, 900);
  rg.addColorStop(0, `rgba(255,120,170,${0.45 * glow})`); rg.addColorStop(0.4, `rgba(120,90,255,${0.18 * glow})`); rg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
}

/* ───────── s01 암전된 공연장: 기다림 ───────── */
REEL.scene({
  id: 's01', start: 0, end: 4 - F,
  setup(el) {
    this.cv = h('canvas', 'full', el); this.cv.width = W; this.cv.height = H;
    this.t1 = h('div', 'center', el, '모두가 기다린');
    css(this.t1, { top: '300px', fontFamily: 'var(--display)', fontWeight: 900, fontSize: '150px', color: CREAM, letterSpacing: '-.02em', lineHeight: '1.2' });
    this.c1 = split(this.t1, 'char', { mask: true });
    this.t2 = h('div', 'center', el, '그 순간');
    css(this.t2, { top: '480px', fontFamily: 'var(--display)', fontWeight: 300, fontSize: '64px', color: PINK, letterSpacing: '.5em' });
  },
  render(lt) {
    const g = this.cv.getContext('2d');
    const glow = 0.25 + 0.75 * prog(lt, 0, 3.6, ease.inQuad);
    stageBg(g, lt, glow * (0.85 + 0.15 * Math.exp(-((lt % 1) * 6))));   // 심장박동처럼 1초마다 빛이 뛴다
    beams(g, lt, { n: 6, a: 0.12 + 0.18 * glow, swing: 0.25, c1: 'rgba(255,110,160,A)', c2: 'rgba(110,140,255,A)' });
    crowd(g, lt, { ...SHOTS.wide, energy: 0.2 + 0.4 * glow, bpmHz: 1 });
    const out = prog(lt, 3.55, 0.35, ease.exit);
    this.c1.forEach((c, i) => { const p = stagger(lt, 1.0, 0.07, 0.5, i, ease.outCubic); css(c, { transform: `translateY(${(1 - p) * 135 - out * 135}%)`, opacity: p > 0 ? 1 : 0 }); });
    const p2 = prog(lt, 2.0, 0.7, ease.outCubic);
    css(this.t2, { opacity: p2 * (1 - out), letterSpacing: `${lerp(1.0, 0.5, p2)}em` });
  },
});

/* ───────── s02 교차 편집: 관중 ↔ 구청장 ───────── */
// [시작, 종류, 인자, 글자]
const CUTS = [
  [4.0, 'crowd', 'wide', '중랑이'], [4.5, 'photo', 'c_face'], [5.0, 'crowd', 'hands', ''], [5.5, 'photo', 'c_hand'],
  [6.0, 'crowd', 'close', '기다린'], [6.5, 'photo', 'c_badge'], [7.0, 'crowd', 'wide', ''], [7.5, 'photo', 'c_stageface'],
  [8.0, 'crowd', 'hands', '나의 자랑'], [8.5, 'photo', 'c_face'], [9.0, 'crowd', 'close', '우리 중랑'], [9.5, 'photo', 'c_hand'],
  [10.0, 'crowd', 'wide', ''], [10.333, 'photo', 'c_stageface'], [10.667, 'crowd', 'hands', ''], [11.0, 'photo', 'c_face'],
  [11.25, 'crowd', 'close', ''], [11.45, 'black'],
];
REEL.scene({
  id: 's02', start: 4 - F, end: DROP - F,
  setup(el) {
    css(el, { background: '#000' });
    this.cv = h('canvas', 'full', el); this.cv.width = W; this.cv.height = H;
    this.photos = {};
    for (const k of ['c_face', 'c_hand', 'c_badge', 'c_stageface']) {
      const wrap = h('div', 'full', el); const im = REEL.img(`../assets/img/${k}.jpg`); wrap.appendChild(im);
      css(im, { width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 50%', filter: 'grayscale(1) contrast(1.2) brightness(1.12)' });
      const tint = h('div', 'full', wrap); css(tint, { background: 'linear-gradient(120deg, #ff5a8e 0%, #9a6bff 55%, #3b3fa8 100%)', mixBlendMode: 'multiply' });
      const lit = h('div', 'full', wrap); css(lit, { background: 'radial-gradient(ellipse 50% 60% at 50% 40%, rgba(255,160,190,.35), transparent 70%)', mixBlendMode: 'screen' });
      this.photos[k] = { wrap, im };
    }
    this.word = h('div', 'center', el, '');
    css(this.word, { top: '360px', fontFamily: 'var(--display)', fontWeight: 900, fontSize: '230px', color: CREAM, letterSpacing: '-.03em', lineHeight: '1.2', textShadow: '0 0 60px rgba(230,51,107,.6)' });
  },
  render(lt, ctx) {
    const t = ctx.t;
    let k = 0; while (k + 1 < CUTS.length && CUTS[k + 1][0] - F <= t) k++;
    const [t0, kind, arg, txt] = CUTS[k];
    const ll = t - t0;
    const g = this.cv.getContext('2d');
    const energy = 0.4 + 0.6 * prog(t, 4, 7.4);
    for (const key in this.photos) css(this.photos[key].wrap, { display: 'none' });
    if (kind === 'crowd') {
      const hue = ['#2a1240', '#13204a', '#3a0f2c'][k % 3];
      stageBg(g, t, 0.9 + 0.1 * Math.exp(-ll * 8), hue);
      beams(g, t * 1.6, { n: 7, a: 0.3, swing: 0.45, dx: (k % 2 ? 60 : -60), c1: 'rgba(255,110,160,A)', c2: 'rgba(110,140,255,A)' });
      g.save(); const zs = 1 + ll * 0.12; g.translate(W / 2, H); g.scale(zs, zs); g.translate(-W / 2, -H);
      crowd(g, t, { ...SHOTS[arg], seed: k, energy, bpmHz: 2 }); g.restore();
    } else {
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      if (kind === 'photo') {
        const p = this.photos[arg];
        css(p.wrap, { display: 'block' });
        css(p.im, { transform: `scale(${1.02 + ll * 0.18}) translateX(${(k % 2 ? -1 : 1) * ll * 20}px)` });
      }
    }
    // 단어: 관중 컷 위에 박자에 맞춰 찍힌다
    const show = kind === 'crowd' && txt;
    this.word.textContent = show ? txt : '';
    const sp = prog(ll, 0, 0.12, ease.outCubic);
    css(this.word, { opacity: show ? sp : 0, transform: `scale(${lerp(1.25, 1, sp) + ll * 0.06})` });
  },
});

/* ───────── s03 등장: 폭발, 조명, 이름 ───────── */
REEL.scene({
  id: 's03', start: DROP - F, end: 24,
  setup(el) {
    css(el, { background: NAVY });
    this.cvb = h('canvas', 'full', el); this.cvb.width = W; this.cvb.height = H;
    this.spot = h('div', 'a', el);
    css(this.spot, { left: '880px', top: '-100px', width: '1000px', height: '1300px', background: 'linear-gradient(180deg, rgba(255,235,240,.55), rgba(255,170,200,.10) 75%, transparent)', clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)', mixBlendMode: 'screen' });
    this.person = REEL.img('../assets/img/ryu_cut.png');
    this.pw = h('div', 'a', el); this.pw.appendChild(this.person);
    css(this.pw, { left: '1060px', top: '110px', width: '660px', height: '1063px' });
    css(this.person, { width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 3px rgba(255,190,210,.9)) drop-shadow(0 40px 60px rgba(0,0,0,.6))' });
    this.rim = h('div', 'full', this.pw);
    css(this.rim, { WebkitMaskImage: 'url(../assets/img/ryu_cut.png)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
      background: 'linear-gradient(180deg, rgba(255,230,240,.45), transparent 40%), linear-gradient(90deg, rgba(255,90,150,.45), transparent 30%, transparent 70%, rgba(110,140,255,.45))', mixBlendMode: 'screen' });
    this.cvf = h('canvas', 'full', el); this.cvf.width = W; this.cvf.height = H;
    this.title = h('div', 'a', el, '서울특별시 중랑구청장');
    css(this.title, { left: '130px', top: '330px', fontFamily: 'var(--display)', fontWeight: 500, fontSize: '54px', color: CREAM, letterSpacing: '.08em' });
    this.name = h('div', 'a', el, '류경기');
    css(this.name, { left: '115px', top: '400px', fontFamily: 'var(--display)', fontWeight: 900, fontSize: '270px', lineHeight: '1.15', letterSpacing: '.02em', whiteSpace: 'nowrap',
      backgroundImage: `linear-gradient(105deg, ${CREAM} 42%, #ffffff 48%, #ffc2d3 52%, ${CREAM} 58%)`, backgroundSize: '300% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
      filter: 'drop-shadow(0 0 30px rgba(230,51,107,.55))' });
    this.ghost = h('div', 'a', el, '류경기');
    css(this.ghost, { left: '115px', top: '400px', fontFamily: 'var(--display)', fontWeight: 900, fontSize: '270px', lineHeight: '1.15', letterSpacing: '.02em', color: ROSE, mixBlendMode: 'screen', whiteSpace: 'nowrap', transformOrigin: '30% 50%' });
    this.rule = h('div', 'a', el); css(this.rule, { left: '130px', top: '740px', width: '600px', height: '4px', background: ROSE, transformOrigin: '0 50%', boxShadow: `0 0 18px ${ROSE}` });
    this.slogan = h('div', 'a', el); this.slogan.innerHTML = `나의 자랑 우리 <b style="color:${PINK};font-weight:900">중랑</b>`;
    css(this.slogan, { left: '130px', top: '770px', fontFamily: 'var(--display)', fontWeight: 700, fontSize: '54px', color: CREAM, letterSpacing: '.1em' });
  },
  render(lt) {
    const t = DROP + lt;
    const g = this.cvb.getContext('2d');
    const beat = Math.exp(-((t % 0.5) * 9));
    stageBg(g, t, 0.7 + 0.3 * beat, '#24113f');
    beams(g, t * 1.3, { n: 8, a: 0.22 + 0.12 * beat, swing: 0.5, c1: 'rgba(255,110,160,A)', c2: 'rgba(110,140,255,A)' });
    const up = prog(lt, -0.05, 0.6, ease.outExpo);
    const push = prog(lt, 0.6, 11, ease.inOutSine);
    css(this.pw, { transform: `translateY(${(1 - up) * 300}px) scale(${1 + push * 0.06 + beat * 0.004})`, opacity: clamp(up * 1.5), transformOrigin: '50% 35%' });
    css(this.spot, { opacity: prog(lt, 0, 0.15) * (0.75 + 0.25 * beat) });
    const sp = prog(lt, -0.02, 0.22, ease.outExpo);
    css(this.name, { opacity: sp, transform: `scale(${lerp(1.7, 1, sp)})`, transformOrigin: '30% 50%',
      backgroundPosition: `${lerp(100, -100, prog(lt, 0.6, 1.0, ease.inOutSine)) + lerp(0, -200, prog(lt, 8.0, 1.2, ease.inOutSine))}% 0` });
    const gp = prog(lt, 0, 0.7, ease.outCubic);
    css(this.ghost, { opacity: (1 - gp) * 0.75, transform: `scale(${1 + gp * 0.25})`, filter: `blur(${gp * 10}px)` });
    const ti = prog(lt, 0.35, 0.5, ease.outCubic);
    css(this.title, { opacity: ti, transform: `translateX(${(1 - ti) * -40}px)` });
    css(this.rule, { transform: `scaleX(${prog(lt, 0.6, 0.6, ease.outExpo)})` });
    const sl = prog(lt, 0.9, 0.6, ease.outCubic);
    css(this.slogan, { opacity: sl, transform: `translateY(${(1 - sl) * 24}px)` });
    // 앞: 불꽃(드롭·20초) + 앞줄 관중 실루엣
    const f = this.cvf.getContext('2d'); f.clearRect(0, 0, W, H);
    for (const [T0, n] of [[DROP, 260], [20, 200]]) {
      const tt = t - T0; if (tt < 0 || tt > 3) continue;
      f.save(); f.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const side = i % 2 ? 1 : -1, x0 = side > 0 ? W - 120 : 120, d = rand(i, 71) * 0.15;
        const tau = tt - d; if (tau < 0) continue;
        const a = -Math.PI / 2 + side * -(0.05 + rand(i, 72) * 0.45), v = 1100 + rand(i, 73) * 1300;
        const x = x0 + Math.cos(a) * v * tau, y = 1000 + Math.sin(a) * v * tau + 0.5 * 1400 * tau * tau;
        const life = 1 - tau / (1.4 + rand(i, 74));
        if (life <= 0) continue;
        f.fillStyle = i % 5 ? `rgba(255,${190 + (i % 50)},150,${life})` : `rgba(255,110,160,${life})`;
        f.beginPath(); f.arc(x, y, 2 + rand(i, 75) * 3, 0, Math.PI * 2); f.fill();
      }
      f.restore();
    }
    crowd(f, t, { rows: [{ y: 1010, gap: 150, s: 52, col: '#03040a' }], arms: 0.85, phones: 0.3, sticks: 0.5, seed: 9, energy: 1, bpmHz: 2 });
  },
});

FX.camera({ shakes: [[DROP, 18, 0.5], [14, 6, 0.25], [16, 6, 0.25], [18, 6, 0.25], [20, 12, 0.4]], drift: 0.4 });
FX.impact([[DROP, { x: 1390, y: 420, color: '#ffd3df', size: 1.2 }]]);
FX.flash([[DROP, 0.18, 0.15, '#ffd3df']]);
