const get = (o, p) => p.split('.').reduce((acc, s) => acc[s], o);

function bezier(pts) {
  return function (t) {
    for (var a = pts; a.length > 1; a = b)  // do..while loop in disguise
      for (var i = 0, b = [], j; i < a.length - 1; i++)  // cycle over control points
        for (b[i] = [], j = 0; j < a[i].length; j++)  // cycle over dimensions
          b[i][j] = a[i][j] * (1 - t) + a[i+1][j] * t;  // interpolation
    return a[0];
  }
}

class Drwr {
  constructor(id) {
    this.svg = document.getElementById(id);
    this.rc = rough.svg(this.svg);

    this.gap = 50;
    this.width = 240;
    this.height = 50;

    this.baseStyle = {
      strokeWidth: '1.5px',
      stroke: 'rgb(55,55,55)',
      roughness: 0.9,
      fillStyle: 'hachure',
      fill: 'rgba(0,0,0,.1)',
      hachureAngle: 60,
      hachureGap: 5,
    };
    this._origin = { x: 0, y: 0 };
  }

  set origin({ x, y }) {
    this._origin = { x, y };
  }
  get origin() {
    return { ...this._origin };
  }

  _pos(args) {
    const x = args.x + Math.random() * 10;
    const y = args.y + Math.random() * 10;
    const w = args.w || this.width;
    const h = args.h || this.height;

    return {
      x,
      y,
      w,
      h,
      top: {
        left: { x, y },
        center: { x: x + w/2, y },
        right: { x: x + w, y },
      },
      bottom: {
        left: { x, y: y + h },
        center: { x: x + w/2, y: y + h },
        right: { x: x + w, y: y + h },
      },
      left: {
        top: { x, y },
        center: { x, y: y + h/2 },
        bottom: { x, y: y + h },
      },
      right: {
        top: { x: x + w, y },
        center: { x: x + w, y: y + h/2 },
        bottom: { x: x + w, y: y + h },
      },
    };
  }

  pos(p) {
    return this._pos(p);
  }

  p = (x, y) => ({ x, y });

  rect = ({ x, y, w, h }, o = {}, b) => {
    const _o = {
      ...this.baseStyle,
      ...o,
    };

    const rect = this.rc.rectangle(x + this.origin.x, y + this.origin.y, w, h, _o);

    if (b) {
      this.svg.insertBefore(rect, b);
    } else {
      this.svg.appendChild(rect);
    }
  };

  line = ({ x, y, h }, o = {}) => {
    const _o = {
      ...this.baseStyle,
      ...o,
    };

    const line = this.rc.line(
      x + this.origin.x,
      y + this.origin.y,
      x + this.origin.x,
      y + h + this.origin.y,
      _o,
    );

    this.svg.appendChild(line);
  };

  clamp = (min, max, n) => Math.max(min, Math.min(max, n));

  segment = (a, b, o = {}) => {
    const _o = {
      ...this.baseStyle,
      ...o,
    };

    const line = this.rc.line(
      a.x + this.origin.x,
      a.y + this.origin.y,
      b.x + this.origin.x,
      b.y + this.origin.y,
      _o,
    );

    this.svg.appendChild(line);
  };

  ellipse = ({ x, y, w, h }, o = {}) => {
    const _o = {
      ...this.baseStyle,
      ...o,
    };

    const ellipse = this.rc.ellipse(
      x + this.origin.x,
      y + this.origin.y,
      w,
      h,
      _o,
    );

    this.svg.appendChild(ellipse);
  };

  circle = ({ x, y, r }, o = {}) => {
    const _o = {
      ...this.baseStyle,
      ...o,
    };

    const circle = this.rc.circle(
      x + this.origin.x,
      y + this.origin.y,
      r*2,
      _o,
    );

    this.svg.appendChild(circle);
  };

  curve = (pts, o = {}) => {
    const _o = {
      ...this.baseStyle,
      ...o,
    };

    const curve = this.rc.curve(pts, _o);

    this.svg.appendChild(curve);
  };

  arrow = (a, b, o = {}) => {
    const fx = a.x + this.origin.x;
    const fy = a.y + this.origin.y;

    const tx = b.x + this.origin.x;
    const ty = b.y + this.origin.y;

    const _o = {
      ...this.baseStyle,
      ...o,
    };

    this.svg.appendChild(this.rc.line(fx, fy, tx, ty, _o));
    this.arrowEnd(a, b, o);
  };

  arrowEnd = (a, b, o = {}) => {
    const fx = a.x + this.origin.x;
    const fy = a.y + this.origin.y;

    const tx = b.x + this.origin.x;
    const ty = b.y + this.origin.y;

    const _o = {
      ...this.baseStyle,
      ...o,
    };

    const length = 15;
    const angle = Math.atan2(tx - fx, ty - fy);
    const deviate = Math.PI / 10;

    const lx = tx - length * Math.sin(angle + deviate);
    const ly = ty - length * Math.cos(angle + deviate);
    const rx = tx - length * Math.sin(angle - deviate);
    const ry = ty - length * Math.cos(angle - deviate);

    this.svg.appendChild(this.rc.line(tx, ty, lx, ly, _o));
    this.svg.appendChild(this.rc.line(tx, ty, rx, ry, _o));
  };

  curveArrow = (ps, o = {}) => {
    const [[tx, ty], [fx, fy]] = ps.slice().reverse();

    this.curve(ps, o);
    this.arrowEnd({ x: fx, y: fy }, { x: tx, y: ty }, o);
  };

  bezierArrow = (pts, o = {}) => {
    const [[tx, ty], [fx, fy]] = pts.slice().reverse();

    const b = bezier(pts);
    const resolution = 10;
    const step = 1 / resolution;

    const points = Array(resolution + 1).fill(0)
      .map((_, t) => t * step)
      .map(b);

    this.curve(points, o);
    this.arrowEnd({ x: fx, y: fy }, { x: tx, y: ty }, o);
  };

  text = ({ x, y }, text, _o = {}) => {
    const o = {
      fill: 'black',
      fontSize: '25px',
      ..._o,
    };

    const node = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    node.setAttribute('x', x + this.origin.x);
    node.setAttribute('y', y + this.origin.y);
    node.setAttribute('fill', o.fill);
    node.setAttribute('font-family', 'Patrick Hand');
    node.setAttribute('font-size', o.fontSize);
    node.textContent = text;

    this.svg.appendChild(node);

    return node;
  };

  bottomTo = (p, { x = 0, y = 0 } = {}) => this._pos({
    x: p.x + x,
    y: p.bottom.left.y + this.gap + y,
  });

  rightTo = (p, { x = 0, y = 0 } = {}) => this._pos({
    x: p.right.top.x + this.gap + x,
    y: p.right.top.y + y,
  });

  withOrigin(origin, fn) {
    const prevOrigin = this.origin;
    this.origin = origin;
    const ret = fn(this);
    this.origin = prevOrigin;
    return ret;
  }

  item(pos, { text, opts = {} }) {
    const txt = this.text({ x: 0, y: 0 }, text, opts.text);
    const padding = 10;
    const textHeight = 25;

    const w = txt.getComputedTextLength() + padding * 2;
    const h = textHeight + padding * 2;

    const p = this.pos({ ...pos, w, h });

    txt.setAttribute('x', this.origin.x + padding + p.x);
    txt.setAttribute('y', this.origin.y + padding + (textHeight / 1.25) + p.y);

    this.rect(p, opts.rect, txt);

    return p;
  }

  tree(layout, ...links) {
    const poses = [];

    layout.forEach((items, row) => {
      poses[row] = [];
      let x = 0;
      let wasSpace = true;

      items.forEach((item, column) => {

        let pos;
        const y = row * this.gap + row * this.height;

        if (item.space) {
          const w = this.width * item.space;
          pos = this.pos({ x, y, w });
          x += w;
        } else {
          x += wasSpace ? 0 : this.gap;
          pos = this.item({ x, y }, item);
          x = pos.bottom.right.x;
        }

        poses[row][column] = pos;
        wasSpace = !!item.space;
      });
    });

    const processLink = (sx, sy, ...slinks) => {
      const a = poses[sx][sy].bottom.center;

      slinks.forEach(([dx, dy, ...dlinks]) => {
        const b = poses[dx][dy].top.center;
        this.arrow(
          { x: a.x, y: a.y + 3 },
          { x: b.x, y: b.y - 3 },
        );

        if (dlinks.length > 0) {
          processLink(dx, dy, ...dlinks);
        }
      });
    };

    links.forEach((link) => processLink(...link));

    return poses[poses.length - 1][0];
  }
}
