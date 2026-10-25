// ================= 3D 立牌用的圖（卡通向量） =================
const ART = {
  fix(a) { if (a) a.lift = -(a.foot || 0); return a; },
  cat(c) { return this.fix(toonCat(c)); },
  human(h) { return this.fix(toonHuman(h, !!(G.scene && G.scene.kind === 'night'))); },
  dog(d) { return this.fix(toonDog(d)); },
  pot(p, sc) {
    const t = !p.avail ? (p.t === 'orchid' ? 'orchidStub' : 'stub') : p.t === 'tanhua' ? (sc && sc.tanhuaState ? sc.tanhuaState() : 'tanhua') : p.t;
    return this.fix(toonPot(t));
  },
  bush(k) { return this.fix(toonBush(k)); },
  obj(o) {
    if (o.k === 'trash') return this.fix(toonTrash(o.used));
    if (o.k === 'scooter') return this.fix(toonScooter(o.x + o.y));
    return null;
  },
  icon(t) { return this.fix(toonSprig(t)); },
  carry(t, flip) { return this.fix(toonSprigCarry(t, flip)); },
  bubble(type) { return this.fix(toonBubble(type)); },
  camHead() { return this.fix(toonCamHead()); },
  delivery() { return this.fix(toonDelivery()); },
  bucket(t, style, n) { return this.fix(style ? toonBucket2(t, style, n) : toonBucket(t)); },
  smallPot(used) { return this.fix(toonSmallPot(used)); },
  bouquet(spec, sc) { return this.fix(toonBouquet(spec, sc)); },
  orange(oc) { return this.fix(toonOrange(oc)); },
  catBox(c) { return this.fix(toonCatBox(c)); },
  umbrella(key) { return this.fix(toonUmbrella(key)); },
  sign(text) { return this.fix(toonSignBoard(text)); },
};
