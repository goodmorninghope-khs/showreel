/* 류경기 중랑구청장 등장 영상(20초, 범용). 아트 디렉션은 ../concept.md.
 * 중랑의 상징 장미 꽃잎이 밤하늘에서 모여 슬로건·비전·이름으로 이어진다. 마지막 4초는 등장 동안 걸어 둘 수 있는 정지 카드. */
const { ease, prog, win, kf, spring, clamp, lerp, rand, noise, split, stagger, css, h, s, cue } = REEL;
REEL.config({ duration: 20, fps: 30, width: 1920, height: 1080, audio: null });

const F = 0.5 / 30;
const B = [0, 2.667, 5.333, 10.667, 20];
const W = 1920, H = 1080;
const NAVY = '#0a1330', ROSE = '#e6336b', DEEP = '#9b1b45', CREAM = '#fff3ec';

// 장미 꽃잎 하나(아래가 뾰족한 둥근 잎)
function petal(g, x, y, r, rot, flip, col, a) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(1, flip); g.globalAlpha = a;
  const gr = g.createLinearGradient(0, -r, 0, r); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
  g.fillStyle = gr; g.beginPath();
  g.moveTo(0, r); g.bezierCurveTo(r * 1.1, r * 0.3, r * 0.9, -r * 1.0, 0, -r * 0.8);
  g.bezierCurveTo(-r * 0.9, -r * 1.0, -r * 1.1, r * 0.3, 0, r); g.fill(); g.restore();
}
const PCOL = [['#ff7aa2', '#c41f55'], ['#f2507f', '#8e1640'], ['#ffd0dc', '#e6336b'], ['#ff9fb9', '#b0234f']];

// 꽃잎 바람: 시간 t 의 순수 함수(나선으로 돌며 흐른다)
function petals(g, t, n, opt) {
  for (let i = 0; i < n; i++) {
    const sp = 0.6 + rand(i, 3) * 0.9, ph = rand(i, 4) * 40;
    const u = (t * sp * opt.speed + ph);
    let x = (rand(i, 1) * (W + 400) - 200 + u * 90 * opt.dir) % (W + 400);
    if (x < -200) x += W + 400;
    let y = (rand(i, 2) * (H + 300) - 150 + u * 60) % (H + 300) - 150;
    x += Math.sin(u * 0.9 + i) * 60; y += Math.cos(u * 0.7 + i * 2) * 30;
    if (opt.pull) { const k = opt.pull * (0.6 + rand(i, 9) * 0.4); x = lerp(x, opt.cx, k); y = lerp(y, opt.cy, k); }
    const z = 0.5 + rand(i, 5) * 1.2;   // 깊이: 가까운 잎은 크고 흐리게
    const r = 14 * z * (opt.scale || 1);
    const flip = Math.cos(u * 2.2 + i);
    petal(g, x, y, r, u * 1.3 + i, flip, PCOL[i % 4], opt.alpha * (0.55 + 0.45 * Math.min(1, z)));
  }
}

/* ───────── s01 꽃잎과 밤 ───────── */
REEL.scene({
  id: 's01', start: B[0], end: B[1] - F,
  setup(el) {
    css(el, { background: `radial-gradient(ellipse 70% 60% at 50% 55%, #1b2a5c 0%, ${NAVY} 70%)` });
    this.glow = h('div', 'full', el);
    css(this.glow, { background: 'radial-gradient(circle at 50% 52%, rgba(255,140,170,.45), rgba(230,51,107,.12) 25%, transparent 50%)' });
    this.cv = h('canvas', 'full', el); this.cv.width = W; this.cv.height = H;
    this.kick = h('div', 'center', el, '서울특별시 중랑구');
    css(this.kick, { top: '500px', fontFamily: 'var(--display)', fontWeight: 500, fontSize: '44px', color: CREAM, letterSpacing: '.6em' });
  },
  render(lt) {
    const g = this.cv.getContext('2d'); g.clearRect(0, 0, W, H);
    const rush = prog(lt, 2.0, 0.65, ease.inCubic);
    petals(g, lt + 3, 90, { speed: 1, dir: -1, alpha: 0.35 + 0.65 * prog(lt, 0, 0.6), pull: prog(lt, 0.2, 1.6, ease.inOutSine) * 0.35 * (1 - rush), cx: 960, cy: 540, scale: 1 + rush * 5 });
    css(this.glow, { opacity: prog(lt, 0.2, 1.4) , transform: `scale(${lerp(0.6, 1.2, prog(lt, 0, 2.6, ease.outCubic)) + rush * 2})` });
    const k = prog(lt, 0.55, 0.9, ease.outCubic);
    css(this.kick, { opacity: k * (1 - rush), letterSpacing: `${lerp(1.1, 0.6, k)}em`, filter: `blur(${(1 - k) * 8 + rush * 10}px)`, transform: `scale(${1 + rush * 0.6})` });
  },
});

/* ───────── s02 슬로건: 나의 자랑 우리 중랑 ───────── */
REEL.scene({
  id: 's02', start: B[1] - F, end: B[2] - F,
  setup(el) {
    css(el, { background: NAVY });
    this.ph = REEL.img('../assets/img/ryu_stage.jpg');
    this.wrap = h('div', 'full', el); this.wrap.appendChild(this.ph);
    css(this.ph, { width: '100%', height: '100%', objectFit: 'cover', objectPosition: '60% 40%', filter: 'saturate(.55) contrast(1.05) brightness(.8)' });
    const tint = h('div', 'full', el); css(tint, { background: `linear-gradient(90deg, rgba(10,19,48,.95) 0%, rgba(10,19,48,.75) 38%, rgba(10,19,48,.05) 70%), linear-gradient(0deg, rgba(155,27,69,.45), transparent 50%)` });
    this.l1 = h('div', 'a', el, '나의 자랑'); this.l2 = h('div', 'a', el);
    this.l2.innerHTML = `우리 <span style="color:${ROSE}">중랑</span>`;
    for (const [l, top] of [[this.l1, 330], [this.l2, 530]]) css(l, { left: '150px', top: top + 'px', fontFamily: 'var(--display)', fontWeight: 900, fontSize: '190px', lineHeight: '1.1', color: CREAM, letterSpacing: '-.03em', whiteSpace: 'nowrap' });
    this.c1 = split(this.l1, 'char', { mask: true }); this.c2 = split(this.l2, 'char', { mask: true });
    this.c2.slice(-2).forEach(c => css(c, { color: ROSE }));
    this.bar = h('div', 'a', el); css(this.bar, { left: '150px', top: '300px', width: '140px', height: '8px', background: ROSE, transformOrigin: '0 50%' });
  },
  render(lt) {
    css(this.ph, { transform: `translateX(${lerp(380, 330, prog(lt, 0, 2.7))}px) scale(${lerp(1.52, 1.42, prog(lt, 0, 2.7, ease.outCubic))})` });
    const out = prog(lt, 2.3, 0.35, ease.exit);
    this.c1.forEach((c, i) => { const p = stagger(lt, -0.05, 0.05, 0.5, i, ease.outCubic); css(c, { transform: `translateY(${(1 - p) * 135 - out * 135}%)`, opacity: p > 0 ? 1 : 0 }); });
    this.c2.forEach((c, i) => { const p = stagger(lt, 0.55, 0.05, 0.5, i, ease.outCubic); css(c, { transform: `translateY(${(1 - p) * 135 - out * 135}%)`, opacity: p > 0 ? 1 : 0 }); });
    css(this.bar, { transform: `scaleX(${prog(lt, 0, 0.6, ease.outExpo) * (1 - out)})` });
  },
});

/* ───────── s03 비전: 박마다 색면이 넘어가며 단어 하나씩 ───────── */
const VISION = [
  ['01', '희망찬 미래', '교육도시', ROSE, CREAM],
  ['02', '서울 동북권', '교통거점', CREAM, NAVY],
  ['03', '신속하고 확실한', '주거환경', NAVY, CREAM],
  ['04', '모두가 함께', '문화중랑', DEEP, CREAM],
];
REEL.scene({
  id: 's03', start: B[2] - F, end: B[3] - F,
  setup(el) {
    css(el, { background: NAVY });
    this.panels = VISION.map(([n, sub, word, bg, fg]) => {
      const p = h('div', 'full', el); css(p, { background: bg });
      const lab = h('div', 'a', p, '중랑의 내일'); css(lab, { left: '150px', top: '150px', fontFamily: 'var(--display)', fontWeight: 500, fontSize: '32px', color: fg, opacity: .75, letterSpacing: '.4em' });
      const num = h('div', 'a', p, `${n} / 04`); css(num, { right: '150px', top: '150px', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: '30px', color: fg, opacity: .75, letterSpacing: '.15em' });
      const sb = h('div', 'center', p, sub); css(sb, { top: '330px', fontFamily: 'var(--display)', fontWeight: 300, fontSize: '64px', color: fg, letterSpacing: '.1em' });
      const wd = h('div', 'center', p, word); css(wd, { top: '420px', fontFamily: 'var(--display)', fontWeight: 900, fontSize: '280px', lineHeight: '1.15', color: fg, letterSpacing: '-.04em' });
      const wc = split(wd, 'char', { mask: true });
      return { p, sb, wd, wc };
    });
    this.cv = h('canvas', 'full', el); this.cv.width = W; this.cv.height = H;
  },
  render(lt) {
    const each = 1.3335;
    this.panels.forEach((o, i) => {
      const t0 = i * each;
      // 대각선으로 밀려 들어오는 색면(첫 장은 컷으로 시작)
      const w = i === 0 ? 1 : prog(lt, t0 - 0.28, 0.32, ease.inOutCubic);
      const sk = 18 * (1 - w);
      css(o.p, { clipPath: `polygon(${(1 - w) * 120 - sk}% 0, 120% 0, 120% 100%, ${(1 - w) * 120 + sk - 20}% 100%)`, display: lt > t0 - 0.3 && lt < t0 + each + 0.1 ? 'block' : 'none' });
      const ll = lt - t0;
      o.wc.forEach((c, k) => { const p = stagger(ll, -0.05, 0.05, 0.45, k, ease.outCubic); css(c, { transform: `translateY(${(1 - p) * 135}%)`, opacity: p > 0 ? 1 : 0 }); });
      css(o.wd, { transform: `scale(${1 + ll * 0.035})` });
      css(o.sb, { opacity: prog(ll, 0.12, 0.35), transform: `translateY(${(1 - prog(ll, 0.12, 0.5, ease.outCubic)) * 20}px)` });
    });
    // 박마다 흩날리는 꽃잎 몇 장(전환을 잇는다)
    const g = this.cv.getContext('2d'); g.clearRect(0, 0, W, H);
    petals(g, lt + 11, 26, { speed: 1.4, dir: 1, alpha: 0.85, scale: 1.4 });
  },
});

/* ───────── s04 등장: 인물, 이름, 정지 카드 ───────── */
REEL.scene({
  id: 's04', start: B[3] - F, end: B[4],
  setup(el) {
    css(el, { background: `radial-gradient(ellipse 60% 75% at 72% 45%, #22346e 0%, ${NAVY} 65%)` });
    this.cvb = h('canvas', 'full', el); this.cvb.width = W; this.cvb.height = H;
    this.ghost = h('div', 'a', el, '중랑');
    css(this.ghost, { left: '880px', top: '90px', fontFamily: 'var(--display)', fontWeight: 900, fontSize: '620px', lineHeight: '1', color: 'transparent', WebkitTextStroke: `3px rgba(230,51,107,.55)`, letterSpacing: '-.05em', whiteSpace: 'nowrap' });
    this.halo = h('div', 'a', el); css(this.halo, { left: '1000px', top: '60px', width: '900px', height: '900px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,120,160,.42), rgba(230,51,107,.10) 45%, transparent 70%)' });
    this.person = REEL.img('../assets/img/ryu_cut.png');
    this.pw = h('div', 'a', el); this.pw.appendChild(this.person);
    css(this.pw, { left: '1130px', top: '95px', width: '690px', height: '1112px' });
    css(this.person, { width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 30px 60px rgba(0,0,0,.55)) drop-shadow(0 0 2px rgba(255,170,195,.9))' });
    this.rim = h('div', 'full', this.pw);
    css(this.rim, { WebkitMaskImage: 'url(../assets/img/ryu_cut.png)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
      background: 'linear-gradient(100deg, rgba(255,110,150,.55), transparent 35%)', mixBlendMode: 'screen' });
    this.floor = h('div', 'a', el); css(this.floor, { left: 0, right: 0, top: '880px', height: '260px', background: `linear-gradient(0deg, ${NAVY} 30%, transparent)` });
    this.kick = h('div', 'a', el, '중랑 대도약'); css(this.kick, { left: '150px', top: '330px', fontFamily: 'var(--display)', fontWeight: 500, fontSize: '40px', color: ROSE, letterSpacing: '.45em' });
    this.title = h('div', 'a', el, '서울특별시 중랑구청장');
    css(this.title, { left: '150px', top: '400px', fontFamily: 'var(--display)', fontWeight: 500, fontSize: '54px', color: CREAM, letterSpacing: '.08em' });
    this.name = h('div', 'a', el, '류경기');
    css(this.name, { left: '140px', top: '470px', fontFamily: 'var(--display)', fontWeight: 900, fontSize: '250px', lineHeight: '1.15', letterSpacing: '.02em', whiteSpace: 'nowrap',
      backgroundImage: `linear-gradient(105deg, ${CREAM} 42%, #ffffff 48%, #ffc2d3 52%, ${CREAM} 58%)`, backgroundSize: '300% 100%', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' });
    this.ghostName = h('div', 'a', el, '류경기');
    css(this.ghostName, { left: '140px', top: '470px', fontFamily: 'var(--display)', fontWeight: 900, fontSize: '250px', lineHeight: '1.15', letterSpacing: '.02em', color: ROSE, mixBlendMode: 'screen', whiteSpace: 'nowrap', transformOrigin: '30% 50%' });
    this.rule = h('div', 'a', el); css(this.rule, { left: '150px', top: '790px', width: '560px', height: '3px', background: ROSE, transformOrigin: '0 50%' });
    this.slogan = h('div', 'a', el); this.slogan.innerHTML = `나의 자랑 우리 <b style="color:${ROSE};font-weight:900">중랑</b>`;
    css(this.slogan, { left: '150px', top: '820px', fontFamily: 'var(--display)', fontWeight: 500, fontSize: '46px', color: CREAM, letterSpacing: '.12em' });
    this.cvf = h('canvas', 'full', el); this.cvf.width = W; this.cvf.height = H;
  },
  render(lt) {
    const N = 2.667;   // 이름이 찍히는 박(13.333초)
    // 인물: 아래에서 떠올라 자리 잡고, 이후 아주 천천히 다가온다
    const up = prog(lt, -0.3, 1.5, ease.outCubic);
    const push = prog(lt, 1.5, 7.8, ease.inOutSine);
    css(this.pw, { transform: `translateY(${(1 - up) * 260}px) translateX(${-push * 30}px) scale(${1 + push * 0.05})`, opacity: up, transformOrigin: '50% 30%' });
    css(this.rim, { opacity: 0.5 + 0.5 * Math.sin(lt * 1.3) * 0.5 + 0.25 });
    css(this.halo, { opacity: prog(lt, -0.2, 1.2) * (0.85 + 0.15 * Math.sin(lt * 2)), transform: `scale(${lerp(0.7, 1, prog(lt, 0, 2, ease.outCubic)) + (lt > N ? 0.15 * Math.exp(-(lt - N) * 3) : 0)})` });
    css(this.ghost, { opacity: prog(lt, 0.3, 1.2) * 0.9, transform: `translateX(${lerp(120, -40, prog(lt, 0, 9.3, ease.linear))}px)` });
    // 이름 앞 문구
    const k = prog(lt, 0.7, 0.6, ease.outCubic);
    css(this.kick, { opacity: k, letterSpacing: `${lerp(.8, .45, k)}em` });
    const ti = prog(lt, 1.4, 0.6, ease.outCubic);
    css(this.title, { opacity: ti, transform: `translateX(${(1 - ti) * -40}px)` });
    // 이름 슬램(히트에 착지)
    const sp = prog(lt, N - 0.22, 0.26, ease.outExpo);
    css(this.name, { opacity: sp, transform: `scale(${lerp(1.6, 1, sp)})`, transformOrigin: '30% 50%', filter: `blur(${(1 - sp) * 20}px)`,
      backgroundPosition: `${lerp(100, -100, prog(lt, N + 0.6, 1.2, ease.inOutSine)) + lerp(0, -200, prog(lt, N + 4.0, 1.3, ease.inOutSine))}% 0` });
    const gp = prog(lt, N, 0.7, ease.outCubic);
    css(this.ghostName, { opacity: lt > N ? (1 - gp) * 0.7 : 0, transform: `scale(${1 + gp * 0.22})`, filter: `blur(${gp * 10}px)` });
    css(this.rule, { transform: `scaleX(${prog(lt, N + 0.3, 0.7, ease.outExpo)})` });
    const sl = prog(lt, N + 0.55, 0.6, ease.outCubic);
    css(this.slogan, { opacity: sl, transform: `translateY(${(1 - sl) * 24}px)` });
    // 꽃잎: 뒤(작고 느리게)와 앞(크고 흐리게) 두 겹
    const gb = this.cvb.getContext('2d'); gb.clearRect(0, 0, W, H);
    petals(gb, lt + 20, 40, { speed: 0.6, dir: -1, alpha: 0.5 * prog(lt, 0, 0.8), scale: 0.8 });
    const gf = this.cvf.getContext('2d'); gf.clearRect(0, 0, W, H);
    const burst = lt > N ? Math.exp(-(lt - N) * 1.2) : 0;
    petals(gf, lt + 31, 14, { speed: 0.9 + burst * 2, dir: -1, alpha: 0.75 * prog(lt, 0, 0.8), scale: 2.2 });
  },
});

FX.camera({ shakes: [[13.333, 10, 0.45]], drift: 0.3 });
FX.impact([[13.333, { x: 470, y: 610, color: '#ffd3df', size: 0.9 }]]);
