/* 제1회 중랑책문 · 박태웅 작가 소개 (30초). 아트 디렉션은 ../concept.md.
 * 화면은 음악 마디(90BPM, 2.667초)에 고정한다. 나레이션을 나중에 넣어도 다시 렌더하지 않게 하려는 것이다. */
const { ease, prog, win, kf, spring, clamp, lerp, rand, noise, split, stagger, css, h, s, cue } = REEL;
REEL.config({ duration: 30, fps: 30, width: 1920, height: 1080, audio: null });

const F = 0.5 / 30;                       // 경계는 큐보다 반 프레임 앞(모션 블러 셔터)
const B = [0, 5.333, 10.667, 16.0, 21.333, 25.333, 30];
const W = 1920, H = 1080;
const INK = '#07080b', PAPER = '#efe7d6', RED = '#c23a22';

// 한지 질감: setup 에서 한 번 만든 결정적 잡음 + 섬유 결
function paperTexture() {
  const c = document.createElement('canvas'); c.width = 960; c.height = 540;
  const g = c.getContext('2d'); const im = g.createImageData(960, 540); const d = im.data;
  for (let i = 0; i < 960 * 540; i++) {
    const v = 239 + (rand(i, 7) - 0.5) * 14;
    d[i * 4] = v; d[i * 4 + 1] = v - 8; d[i * 4 + 2] = v - 25; d[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  g.strokeStyle = 'rgba(120,96,60,.07)'; g.lineWidth = 1;
  for (let k = 0; k < 260; k++) {
    const x = rand(k, 31) * 960, y = rand(k, 32) * 540, a = rand(k, 33) * Math.PI, l = 20 + rand(k, 34) * 70;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5 + 6, y + Math.sin(a) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return c.toDataURL('image/jpeg', 0.9);
}
let PAPER_URL = null;
const paperBg = () => (PAPER_URL = PAPER_URL || paperTexture());

// 낙관(인장): 붉은 사각 안에 흰 글자, 가장자리를 살짝 갉아 낸다
function seal(parent, text, size, vertical) {
  const el = h('div', 'a', parent);
  css(el, { width: size + 'px', height: size + 'px', background: RED, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: PAPER, fontFamily: 'var(--display)', fontWeight: 900, fontSize: (vertical ? size * 0.36 : size * 0.34) + 'px', lineHeight: 1,
    writingMode: vertical ? 'vertical-rl' : 'horizontal-tb', letterSpacing: vertical ? '.04em' : '-.02em',
    boxShadow: 'inset 0 0 0 5px rgba(239,231,214,.85), inset 0 0 0 9px ' + RED, filter: 'url(#rough)' });
  el.textContent = text;
  return el;
}

// 인장 가장자리 거칠기용 SVG 필터(정적, 시드 고정)
REEL.overlay(() => {}, { layer: 'top', setup(el) {
  const svg = s('svg', { width: 0, height: 0 }, el); svg.style.position = 'absolute';
  const f = s('filter', { id: 'rough' }, s('defs', {}, svg));
  s('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: 2, seed: 4, result: 'n' }, f);
  s('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 5 }, f);
} });

/* ───────── s01 눈: 눈꺼풀처럼 갈라지는 빛 ───────── */
REEL.scene({
  id: 's01', start: B[0], end: B[1] - F,
  setup(el) {
    css(el, { background: INK });
    this.light = h('div', 'full', el);
    css(this.light, { background: `radial-gradient(ellipse 70% 60% at 50% 50%, #fff8ea 0%, ${PAPER} 45%, #c9b996 100%)` });
    this.words = [200, 500, 900].map(w => {
      const t = h('div', 'center', this.light, '눈 떠보니');
      css(t, { top: '395px', fontFamily: 'var(--display)', fontWeight: w, fontSize: '230px', lineHeight: '1.2', color: INK, letterSpacing: '-.02em' });
      return t;
    });
    this.sub = h('div', 'center', this.light, '세상이 바뀌어 있었다');
    css(this.sub, { top: '650px', fontFamily: 'var(--serif)', fontWeight: 300, fontSize: '40px', letterSpacing: '.6em', color: 'rgba(7,8,11,.75)' });
    this.lidT = h('div', 'a', el); this.lidB = h('div', 'a', el);
    for (const l of [this.lidT, this.lidB]) css(l, { left: '-5%', width: '110%', height: '700px', background: INK, boxShadow: '0 0 90px 50px ' + INK });
    this.line = h('div', 'a', el);
    css(this.line, { top: '539px', height: '2px', left: '0', width: '1920px', background: '#fff8ea', boxShadow: '0 0 30px 6px rgba(255,240,210,.8)' });
  },
  render(lt) {
    const lineP = prog(lt, 0.25, 1.1, ease.outExpo);
    css(this.line, { transform: `scaleX(${lineP})`, opacity: lineP * (1 - prog(lt, 1.3, 0.3)) });
    // 깨어나는 눈: 반쯤 떴다가 살짝 감기고, 다시 크게 뜬다
    const gap = kf(lt, [[1.2, 0], [1.75, 150, ease.outCubic], [2.15, 70, ease.inOutSine], [3.0, 440, ease.outCubic], [4.55, 490, ease.linear], [5.3, 1300, ease.inCubic]]);
    const curve = lerp(0, 1, clamp(gap / 400));
    css(this.lidT, { top: `${540 - gap / 2 - 700}px`, borderRadius: `0 0 50% 50% / 0 0 ${curve * 120}px ${curve * 120}px` });
    css(this.lidB, { top: `${540 + gap / 2}px`, borderRadius: `50% 50% 0 0 / ${curve * 120}px ${curve * 120}px 0 0` });
    // 글자는 뜨는 동안 획이 굵어진다(200 → 500 → 900)
    const w1 = prog(lt, 2.2, 0.6, ease.inOutSine), w2 = prog(lt, 3.0, 0.6, ease.inOutSine);
    const o = [1 - w1, w1 * (1 - w2), w2];
    const zoom = lerp(1.12, 1, prog(lt, 1.2, 3.2, ease.outCubic)) + prog(lt, 4.6, 0.7, ease.inCubic) * 0.5;
    this.words.forEach((t, i) => css(t, { opacity: o[i], transform: `scale(${zoom})`, filter: `blur(${prog(lt, 4.75, 0.55, ease.inCubic) * 18}px)` }));
    css(this.sub, { opacity: prog(lt, 3.3, 0.7, ease.outCubic) * (1 - prog(lt, 4.6, 0.4)), letterSpacing: `${lerp(0.9, 0.6, prog(lt, 3.3, 1.4, ease.outCubic))}em` });
    css(this.light, { transform: `scale(${lerp(1.04, 1, prog(lt, 1.2, 3, ease.outCubic))})` });
  },
});

/* ───────── s02 지층: 경력이 아래서 쌓이고 카메라가 오른다 ───────── */
const ROWS = [
  ['1990', '한겨레 기자', '펜을 든 사람'],
  ['2004', '엠파스 부사장', '검색의 시대'],
  ['2009', 'KTH 부사장', '포털의 현장'],
  ['前', '한빛미디어 이사회 의장', '책을 만드는 사람'],
  ['現', '녹서포럼 의장', '질문을 모으는 사람'],
];
REEL.scene({
  id: 's02', start: B[1] - F, end: B[2] - F,
  setup(el) {
    css(el, { backgroundImage: `url(${paperBg()})`, backgroundSize: 'cover' });
    this.stack = h('div', 'full', el);
    this.rows = ROWS.map(([y, title, note], i) => {
      const r = h('div', 'a', this.stack);
      css(r, { left: '220px', right: '220px', top: `${470 - i * 210}px`, height: '200px' });
      const rule = h('div', 'a', r); css(rule, { left: 0, right: 0, top: '178px', height: '2px', background: i === 4 ? RED : INK, transformOrigin: '0 50%' });
      const yr = h('div', 'a', r, y); css(yr, { left: 0, top: '62px', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '34px', color: RED, letterSpacing: '.08em' });
      const tt = h('div', 'a', r, title); css(tt, { left: '170px', top: '10px', fontFamily: 'var(--serif)', fontWeight: 900, fontSize: '120px', lineHeight: '1.25', color: i === 4 ? RED : INK, letterSpacing: '-.03em', whiteSpace: 'nowrap' });
      const chars = split(tt, 'char', { mask: true });
      const nt = h('div', 'a', r, note); css(nt, { right: 0, top: '190px', fontFamily: 'var(--serif)', fontWeight: 300, fontSize: '26px', color: 'rgba(7,8,11,.6)', letterSpacing: '.3em' });
      return { r, rule, yr, chars, nt };
    });
    this.inkUp = h('div', 'a', el); css(this.inkUp, { left: 0, right: 0, height: '1300px', background: INK, borderRadius: '50% 50% 0 0 / 120px 120px 0 0' });
  },
  render(lt) {
    const T = [-0.12, 1.0, 1.95, 2.85, 3.75];
    let cam = 0;
    T.forEach((t0, i) => { cam += prog(lt, t0 - 0.05, 0.75, ease.inOutCubic) * (i ? 210 : 0); });
    css(this.stack, { transform: `translateY(${cam + (1 - prog(lt, 0, 1.2, ease.outCubic)) * 40}px)` });
    this.rows.forEach((o, i) => {
      const t0 = T[i];
      const age = clamp((cam - i * 210) / 630);  // 위로 올라갈수록 옅어진다(지층)
      css(o.r, { opacity: 1 - age * 0.72 });
      css(o.rule, { transform: `scaleX(${prog(lt, t0, 0.7, ease.outExpo)})` });
      css(o.yr, { opacity: prog(lt, t0 + 0.1, 0.3), transform: `translateX(${(1 - prog(lt, t0 + 0.1, 0.5, ease.outCubic)) * -30}px)` });
      o.chars.forEach((c, k) => { const p = stagger(lt, t0, 0.035, 0.55, k, ease.outCubic); css(c, { transform: `translateY(${(1 - p) * 135}%)`, opacity: p > 0 ? 1 : 0 }); });
      css(o.nt, { opacity: prog(lt, t0 + 0.4, 0.5) });
    });
    // 먹이 아래에서 차오르며 다음 구간(먹 무대)으로
    const up = prog(lt, 4.78, 0.55, ease.inCubic);
    css(this.inkUp, { top: `${lerp(1100, -220, up)}px` });
  },
});

/* ───────── s03 책: 세로쓰기 책등이 기념비처럼 솟는다 ───────── */
const BOOKS = [
  { t: '눈 떠보니 선진국', y: '2021', bg: PAPER, fg: INK, edge: '#cfc3a8' },
  { t: '박태웅의 AI 강의', y: '2023', bg: RED, fg: PAPER, edge: '#8e2a18' },
  { t: '박태웅의 AI 강의 2026', y: '2026', bg: '#1d2027', fg: PAPER, edge: '#0e1014' },
];
REEL.scene({
  id: 's03', start: B[2] - F, end: B[3] - F,
  setup(el) {
    css(el, { background: `radial-gradient(ellipse 80% 70% at 50% 40%, #1a1c22 0%, ${INK} 70%)` });
    this.glow = h('div', 'full', el); css(this.glow, { background: 'radial-gradient(ellipse 40% 50% at 30% 30%, rgba(239,231,214,.10), transparent 70%)' });
    this.world = h('div', 'full', el); css(this.world, { perspective: '2200px' });
    this.rig = h('div', 'full', this.world); css(this.rig, { transformStyle: 'preserve-3d' });
    this.books = BOOKS.map((b, i) => {
      const bk = h('div', 'a', this.rig);
      css(bk, { left: `${620 + i * 250}px`, top: '120px', width: '190px', height: '780px', transformStyle: 'preserve-3d' });
      const sp = h('div', 'full', bk);
      css(sp, { background: `linear-gradient(90deg, ${b.edge} 0%, ${b.bg} 18%, ${b.bg} 82%, ${b.edge} 100%)`, borderRadius: '3px',
        boxShadow: '0 60px 80px rgba(0,0,0,.55)' });
      const ti = h('div', 'a', sp); ti.innerHTML = b.t.replace(/(AI|2026)/g, '<span style="text-combine-upright:all">$1</span>');
      css(ti, { left: 0, right: 0, top: '70px', margin: '0 auto', writingMode: 'vertical-rl', fontFamily: 'var(--serif)', fontWeight: 900,
        fontSize: b.t.length > 12 ? '46px' : '58px', letterSpacing: '.08em', color: b.fg, lineHeight: '190px', textAlign: 'start', height: '560px' });
      const yr = h('div', 'a', sp, b.y);
      css(yr, { left: 0, right: 0, bottom: '42px', textAlign: 'center', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '26px', color: b.fg, opacity: .8, letterSpacing: '.1em' });
      const band = h('div', 'a', sp); css(band, { left: 0, right: 0, top: '24px', height: '3px', background: b.fg, opacity: .5 });
      const band2 = h('div', 'a', sp); css(band2, { left: 0, right: 0, bottom: '100px', height: '3px', background: b.fg, opacity: .5 });
      const side = h('div', 'a', bk); // 책 두께(앞마구리)
      css(side, { left: '190px', top: 0, width: '120px', height: '780px', transformOrigin: '0 50%', transform: 'rotateY(90deg)',
        background: 'repeating-linear-gradient(90deg, #e9e0cc 0 2px, #cfc4ab 2px 3px)', filter: 'brightness(.55)' });
      const shade = h('div', 'full', sp); css(shade, { background: 'linear-gradient(90deg, rgba(0,0,0,0), rgba(0,0,0,.45))' });
      const spec = h('div', 'full', sp); css(spec, { background: 'linear-gradient(100deg, transparent 35%, rgba(255,250,235,.38) 50%, transparent 65%)', backgroundSize: '100% 300%', mixBlendMode: 'screen' });
      return { bk, shade, spec };
    });
    this.cap = h('div', 'a', el, '저서');
    css(this.cap, { left: '150px', top: '170px', fontFamily: 'var(--serif)', fontWeight: 300, fontSize: '40px', color: PAPER, letterSpacing: '.6em', writingMode: 'vertical-rl' });
    this.cap2 = h('div', 'a', el, '한빛비즈 · 2021 — 2026');
    css(this.cap2, { left: '150px', bottom: '150px', fontFamily: 'var(--mono)', fontWeight: 500, fontSize: '24px', color: 'rgba(239,231,214,.6)', letterSpacing: '.25em' });
    this.floor = h('div', 'a', el); css(this.floor, { left: 0, right: 0, top: '900px', height: '2px', background: 'linear-gradient(90deg, transparent, rgba(239,231,214,.35), transparent)' });
  },
  render(lt) {
    const orbit = lerp(-26, 16, prog(lt, 0, 5.3, ease.inOutSine));
    const out = prog(lt, 4.85, 0.45, ease.inCubic);
    css(this.rig, { transform: `translateZ(${lerp(-500, 0, prog(lt, 0, 2.2, ease.outCubic)) + prog(lt, 2.4, 2.4, ease.inOutSine) * 260 - out * 900}px) translateX(${-prog(lt, 2.4, 2.4, ease.inOutSine) * 60}px) rotateY(${orbit}deg) rotateX(${lerp(8, 2, prog(lt, 0, 3, ease.outCubic))}deg)` });
    this.books.forEach((b, i) => {
      const t0 = -0.12 + i * 0.42;
      const p = spring(lt, t0, 2.4, 0.55);
      css(b.bk, { transform: `translateY(${(1 - p) * 1000}px) rotateY(${-18 + i * 4}deg)`, opacity: lt > t0 ? 1 : 0 });
      css(b.shade, { opacity: 0.4 + 0.5 * clamp((orbit + 26) / 42) });
      css(b.spec, { backgroundPosition: `0 ${lerp(120, -120, prog(lt, 2.6 + i * 0.35, 1.4, ease.inOutSine))}%` });
    });
    css(this.cap, { opacity: prog(lt, 1.6, 0.6) * (1 - out) });
    css(this.cap2, { opacity: prog(lt, 2.2, 0.6) * (1 - out) });
    css(this.floor, { opacity: prog(lt, 0.5, 1) * (1 - out) });
    css(this.glow, { transform: `translateX(${lt * 30}px)` });
  },
});

/* ───────── s04 나라: 점들이 모여 '물음'이 된다 ───────── */
REEL.scene({
  id: 's04', start: B[3] - F, end: B[4] - F,
  setup(el) {
    css(el, { background: INK });
    this.cv = h('canvas', 'full', el); this.cv.width = W; this.cv.height = H;
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const g = off.getContext('2d'); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 420px "Hahmlet"'; g.fillText('물음', W / 2, 430);
    const data = g.getImageData(0, 0, W, H).data, pts = [];
    for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) if (data[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
    const N = 6400, cols = 100, rows = 46;
    this.P = Array.from({ length: N }, (_, i) => {
      const [tx, ty] = pts[Math.floor(rand(i, 41) * pts.length)];
      const gi = i % (cols * rows);   // 처음엔 나라 전체를 덮은 격자(데이터의 들판)
      const gx = 120 + (gi % cols) * (1680 / (cols - 1)), gy = 140 + Math.floor(gi / cols) * (800 / (rows - 1));
      return { tx, ty, gx: gx + (rand(i, 42) - .5) * 14, gy: gy + (rand(i, 43) - .5) * 14, d: rand(i, 44) * 0.6, s: 1.6 + rand(i, 45) * 2.2, red: rand(i, 46) < 0.06 };
    });
    this.l1 = h('div', 'center', el, '대통령 직속 국가인공지능전략위원회');
    css(this.l1, { top: '700px', fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '56px', color: PAPER, letterSpacing: '.04em' });
    this.l1c = split(this.l1, 'char', { mask: true });
    this.l2 = h('div', 'center', el, '민간위원 · 공공AX 분과장');
    css(this.l2, { top: '800px', fontFamily: 'var(--mono)', fontWeight: 500, fontSize: '30px', color: RED, letterSpacing: '.35em' });
  },
  render(lt) {
    const g = this.cv.getContext('2d');
    g.clearRect(0, 0, W, H);
    const collapse = prog(lt, 4.25, 0.65, ease.inExpo);
    for (let i = 0; i < this.P.length; i++) {
      const p = this.P[i];
      const appear = prog(lt, p.d * 0.5, 0.5);
      const form = prog(lt, 0.9 + p.d, 1.4, ease.inOutCubic);
      const wob = (1 - form) * 6;
      let x = lerp(p.gx + noise(lt * 0.6, i) * wob, p.tx + noise(lt * 0.8, i + 7) * 1.2, form);
      let y = lerp(p.gy + noise(lt * 0.6, i + 3) * wob, p.ty + noise(lt * 0.8, i + 9) * 1.2, form);
      const wave = Math.exp(-Math.pow((p.tx - lerp(300, 1650, prog(lt, 2.5, 1.7, ease.inOutSine))) / 70, 2)) * prog(lt, 2.5, 0.2);
      const zm = 1 + prog(lt, 2.3, 2.0, ease.inOutSine) * 0.08;
      x = W / 2 + (x - W / 2) * zm; y = 430 + (y - 430) * zm - wave * 14 * form;
      x = lerp(x, W / 2, collapse); y = lerp(y, 430, collapse);
      const a = appear * (1 - prog(lt, 4.85, 0.12));
      if (a <= 0) continue;
      g.globalAlpha = a * (p.red ? 1 : 0.9);
      g.fillStyle = (p.red || wave > 0.45) ? RED : PAPER;
      const sz = p.s * (1 + wave * 0.8);
      g.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }
    // 정적: 마지막 점 하나
    const dot = win(lt, 4.8, 5.3, 0.08, 0.1);
    g.globalAlpha = dot; g.fillStyle = PAPER; g.beginPath(); g.arc(W / 2, 430, 5, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    const tout = prog(lt, 4.1, 0.35, ease.exit);
    this.l1c.forEach((c, k) => { const p = stagger(lt, 2.0, 0.025, 0.5, k, ease.outCubic); css(c, { transform: `translateY(${(1 - p) * 135 - tout * 135}%)`, opacity: p > 0 ? 1 : 0 }); });
    css(this.l2, { opacity: prog(lt, 2.6, 0.5) * (1 - tout), letterSpacing: `${lerp(.6, .35, prog(lt, 2.6, 1.2, ease.outCubic))}em` });
  },
});

/* ───────── s05 이름: 정적 뒤의 슬램 ───────── */
REEL.scene({
  id: 's05', start: B[4] - F, end: B[5] - F,
  setup(el) {
    css(el, { background: 'transparent' });
    this.halo = h('div', 'full', el); css(this.halo, { background: 'radial-gradient(ellipse 45% 35% at 50% 47%, rgba(239,231,214,.16), transparent 70%)' });
    this.pre = h('div', 'center', el, '기자 · 경영자 · 저자');
    css(this.pre, { top: '255px', fontFamily: 'var(--serif)', fontWeight: 300, fontSize: '38px', color: 'rgba(239,231,214,.7)', letterSpacing: '.7em' });
    this.name = h('div', 'center', el, '박태웅');
    css(this.name, { top: '330px', fontFamily: 'var(--display)', fontWeight: 900, fontSize: '330px', lineHeight: '1.2', letterSpacing: '.02em',
      backgroundImage: `linear-gradient(105deg, ${PAPER} 42%, #ffffff 50%, ${PAPER} 58%)`, backgroundSize: '300% 100%',
      WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' });
    this.ghost = h('div', 'center', el, '박태웅');
    css(this.ghost, { top: '330px', fontFamily: 'var(--display)', fontWeight: 900, fontSize: '330px', lineHeight: '1.2', letterSpacing: '.02em', color: RED, mixBlendMode: 'screen' });
    this.seal = seal(el, '작가', 120, false);
    css(this.seal, { left: '1490px', top: '560px' });
    this.sub = h('div', 'center', el, '『눈 떠보니 선진국』 『박태웅의 AI 강의』');
    css(this.sub, { top: '800px', fontFamily: 'var(--serif)', fontWeight: 500, fontSize: '36px', color: 'rgba(239,231,214,.75)', letterSpacing: '.12em' });
    this.paper = h('div', 'full', el);
    css(this.paper, { backgroundImage: `url(${paperBg()})`, backgroundSize: 'cover' });
  },
  render(lt) {
    const sp = prog(lt, 0, 0.32, ease.outExpo);
    css(this.name, { transform: `scale(${lerp(1.5, 1, sp) + prog(lt, 0.3, 3.2, ease.inOutSine) * 0.1})`, filter: `blur(${(1 - sp) * 22}px)`, opacity: sp,
      backgroundPosition: `${lerp(100, -100, prog(lt, 0.9, 1.2, ease.inOutSine)) + lerp(0, -200, prog(lt, 2.1, 1.1, ease.inOutSine))}% 0` });
    css(this.seal, { left: `${1490 + prog(lt, 0.3, 3.2, ease.inOutSine) * 30}px` });
    const gp = prog(lt, 0.02, 0.7, ease.outCubic);
    css(this.ghost, { opacity: (1 - gp) * 0.7 * (lt > 0.02 ? 1 : 0), transform: `scale(${1 + gp * 0.25})`, filter: `blur(${gp * 10}px)` });
    css(this.halo, { opacity: win(lt, 0, 3.8, 0.2, 0.4) });
    css(this.pre, { opacity: prog(lt, 0.5, 0.6) * (1 - prog(lt, 3.3, 0.3)), letterSpacing: `${lerp(1.0, 0.7, prog(lt, 0.5, 1.4, ease.outCubic))}em` });
    // 낙관: 위에서 내려찍는다
    const st = prog(lt, 1.35, 0.16, ease.inQuad);
    css(this.seal, { opacity: st > 0 ? 1 : 0, transform: `scale(${lerp(2.2, 1, st)}) rotate(${lerp(-14, -4, st)}deg)`, filter: st < 1 ? 'url(#rough) blur(2px)' : 'url(#rough)' });
    css(this.sub, { opacity: prog(lt, 1.9, 0.6) * (1 - prog(lt, 3.3, 0.3)), transform: `translateY(${(1 - prog(lt, 1.9, 0.8, ease.outCubic)) * 24}px)` });
    // 한지가 가운데서 원으로 번져 엔드카드로
    const r = prog(lt, 3.45, 0.52, ease.inCubic) * 1250;
    css(this.paper, { clipPath: `circle(${r}px at 50% 50%)`, opacity: r > 0 ? 1 : 0 });
  },
});

/* ───────── s06 엔드카드: 제1회 중랑책문 ───────── */
REEL.scene({
  id: 's06', start: B[5] - F, end: B[6],
  setup(el) {
    css(el, { backgroundImage: `url(${paperBg()})`, backgroundSize: 'cover' });
    this.kick = h('div', 'center', el, '策問 — 묻고, 답하다');
    css(this.kick, { top: '205px', fontFamily: 'var(--serif)', fontWeight: 500, fontSize: '36px', color: 'rgba(7,8,11,.7)', letterSpacing: '.5em' });
    this.title = h('div', 'center', el, '제1회 중랑책문');
    css(this.title, { top: '290px', fontFamily: 'var(--display)', fontWeight: 900, fontSize: '190px', lineHeight: '1.2', color: INK, letterSpacing: '-.01em' });
    this.tc = split(this.title, 'char');
    this.rule = h('div', 'a', el); css(this.rule, { left: '660px', width: '600px', top: '560px', height: '2px', background: INK, transformOrigin: '50% 50%' });
    this.who = h('div', 'center', el, '박태웅 작가');
    css(this.who, { top: '600px', fontFamily: 'var(--serif)', fontWeight: 900, fontSize: '76px', color: RED, letterSpacing: '.1em' });
    this.date = h('div', 'center', el, '2026. 10. 15. 목');
    css(this.date, { top: '740px', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '46px', color: INK, letterSpacing: '.18em' });
    this.seal = seal(el, '策問', 104, true);
    css(this.seal, { left: '1580px', top: '800px' });
  },
  render(lt) {
    // 먹이 번지듯: 흐린 번짐에서 또렷한 획으로
    this.tc.forEach((c, k) => {
      const p = stagger(lt, -0.1, 0.06, 0.7, k, ease.outCubic);
      css(c, { opacity: p, filter: `blur(${(1 - p) * 16}px)`, transform: `scale(${lerp(1.18, 1, p)})`, display: 'inline-block' });
    });
    css(this.title, { transform: `scale(${1 + lt * 0.006})` });
    css(this.kick, { opacity: prog(lt, -0.2, 0.6), letterSpacing: `${lerp(.8, .5, prog(lt, 0.05, 1.5, ease.outCubic))}em` });
    css(this.rule, { transform: `scaleX(${prog(lt, 0.8, 0.7, ease.outExpo)})` });
    css(this.who, { opacity: prog(lt, 1.0, 0.5), transform: `translateY(${(1 - prog(lt, 1.0, 0.7, ease.outCubic)) * 30}px)` });
    css(this.date, { opacity: prog(lt, 1.35, 0.5), transform: `translateY(${(1 - prog(lt, 1.35, 0.7, ease.outCubic)) * 30}px)` });
    const st = prog(lt, 1.9, 0.16, ease.inQuad);
    css(this.seal, { opacity: st > 0 ? 1 : 0, transform: `scale(${lerp(2.2, 1, st)}) rotate(${lerp(10, 3, st)}deg)` });
    css(this.kick.parentNode, { backgroundPosition: `${50 + lt * 0.4}% 50%` });
  },
});

/* 전역: 이름 슬램의 충격과 흔들림 */
FX.camera({ shakes: [[21.333, 14, 0.5], [22.7, 5, 0.25], [27.23, 4, 0.2]], drift: 0.35 });
FX.impact([[21.333, { x: 960, y: 540, color: PAPER, size: 1.1 }]]);
FX.dust({ n: 90, color: 'rgba(239,231,214,.55)', from: 21.333, to: 25.0 });
