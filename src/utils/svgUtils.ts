export interface SVGOptions {
  width?: number;
  height?: number;
  viewBox?: { x: number; y: number; width: number; height: number };
  xmlns?: string;
  preserveAspectRatio?: string;
}

export interface SVGGradient {
  id: string;
  type: 'linear' | 'radial';
  stops: Array<{ offset: number; color: string; opacity?: number }>;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  cx?: number;
  cy?: number;
  r?: number;
}

export interface SVGFilter {
  id: string;
  type: 'blur' | 'dropShadow' | 'glow' | 'outGlow';
  options?: {
    stdDeviation?: number;
    dx?: number;
    dy?: number;
    floodColor?: string;
    floodOpacity?: number;
  };
}

export class SVGUtils {
  private static instance: SVGUtils;

  static getInstance(): SVGUtils {
    if (!SVGUtils.instance) {
      SVGUtils.instance = new SVGUtils();
    }
    return SVGUtils.instance;
  }

  static create(container: HTMLElement, options?: SVGOptions): SVGSVGElement {
    const svg = document.createElementNS(options?.xmlns || 'http://www.w3.org/2000/svg', 'svg');
    
    if (options?.width) svg.setAttribute('width', String(options.width));
    if (options?.height) svg.setAttribute('height', String(options.height));
    
    if (options?.viewBox) {
      svg.setAttribute(
        'viewBox',
        `${options.viewBox.x} ${options.viewBox.y} ${options.viewBox.width} ${options.viewBox.height}`
      );
    }
    
    if (options?.preserveAspectRatio) {
      svg.setAttribute('preserveAspectRatio', options.preserveAspectRatio);
    }
    
    container.appendChild(svg);
    
    return svg;
  }

  static createElement(
    svg: SVGSVGElement,
    type: string,
    attributes?: Record<string, string | number>
  ): SVGElement {
    const element = document.createElementNS('http://www.w3.org/2000/svg', type);
    
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, String(value));
      });
    }
    
    svg.appendChild(element);
    
    return element;
  }

  static createRect(
    svg: SVGSVGElement,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      rx?: number;
      ry?: number;
      opacity?: number;
    }
  ): SVGRectElement {
    const rect = SVGUtils.createElement(svg, 'rect', {
      x,
      y,
      width,
      height,
      ...options,
    }) as SVGRectElement;
    
    return rect;
  }

  static createCircle(
    svg: SVGSVGElement,
    cx: number,
    cy: number,
    r: number,
    options?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
    }
  ): SVGCircleElement {
    const circle = SVGUtils.createElement(svg, 'circle', {
      cx,
      cy,
      r,
      ...options,
    }) as SVGCircleElement;
    
    return circle;
  }

  static createEllipse(
    svg: SVGSVGElement,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    options?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
    }
  ): SVGEllipseElement {
    const ellipse = SVGUtils.createElement(svg, 'ellipse', {
      cx,
      cy,
      rx,
      ry,
      ...options,
    }) as SVGEllipseElement;
    
    return ellipse;
  }

  static createLine(
    svg: SVGSVGElement,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options?: {
      stroke?: string;
      strokeWidth?: number;
      strokeLinecap?: string;
      strokeDasharray?: string;
      opacity?: number;
    }
  ): SVGLineElement {
    const line = SVGUtils.createElement(svg, 'line', {
      x1,
      y1,
      x2,
      y2,
      ...options,
    }) as SVGLineElement;
    
    return line;
  }

  static createPolyline(
    svg: SVGSVGElement,
    points: Array<{ x: number; y: number }>,
    options?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      strokeLinecap?: string;
      strokeLinejoin?: string;
      opacity?: number;
    }
  ): SVGPolylineElement {
    const pointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');
    
    const polyline = SVGUtils.createElement(svg, 'polyline', {
      points: pointsStr,
      ...options,
    }) as SVGPolylineElement;
    
    return polyline;
  }

  static createPolygon(
    svg: SVGSVGElement,
    points: Array<{ x: number; y: number }>,
    options?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      strokeLinecap?: string;
      strokeLinejoin?: string;
      opacity?: number;
    }
  ): SVGPolygonElement {
    const pointsStr = points.map((p) => `${p.x},${p.y}`).join(' ');
    
    const polygon = SVGUtils.createElement(svg, 'polygon', {
      points: pointsStr,
      ...options,
    }) as SVGPolygonElement;
    
    return polygon;
  }

  static createPath(
    svg: SVGSVGElement,
    d: string,
    options?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      strokeLinecap?: string;
      strokeLinejoin?: string;
      opacity?: number;
    }
  ): SVGPathElement {
    const path = SVGUtils.createElement(svg, 'path', {
      d,
      ...options,
    }) as SVGPathElement;
    
    return path;
  }

  static createText(
    svg: SVGSVGElement,
    x: number,
    y: number,
    text: string,
    options?: {
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: string;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      textAnchor?: 'start' | 'middle' | 'end';
      dominantBaseline?: string;
      opacity?: number;
    }
  ): SVGTextElement {
    const textEl = SVGUtils.createElement(svg, 'text', {
      x,
      y,
      ...options,
    }) as SVGTextElement;
    
    textEl.textContent = text;
    
    return textEl;
  }

  static createGroup(
    svg: SVGSVGElement,
    options?: {
      id?: string;
      transform?: string;
      opacity?: number;
    }
  ): SVGGElement {
    const group = SVGUtils.createElement(svg, 'g', options) as SVGGElement;
    
    return group;
  }

  static createImage(
    svg: SVGSVGElement,
    x: number,
    y: number,
    width: number,
    height: number,
    href: string,
    options?: {
      preserveAspectRatio?: string;
      opacity?: number;
    }
  ): SVGImageElement {
    const image = SVGUtils.createElement(svg, 'image', {
      x,
      y,
      width,
      height,
      href,
      ...options,
    }) as SVGImageElement;
    
    return image;
  }

  static createGradient(
    svg: SVGSVGElement,
    gradient: SVGGradient
  ): SVGGradientElement {
    const type = gradient.type === 'linear' ? 'linearGradient' : 'radialGradient';
    
    const gradientEl = SVGUtils.createElement(svg, type, {
      id: gradient.id,
    }) as SVGGradientElement;
    
    if (gradient.type === 'linear') {
      gradientEl.setAttribute('x1', String(gradient.x1 ?? 0));
      gradientEl.setAttribute('y1', String(gradient.y1 ?? 0));
      gradientEl.setAttribute('x2', String(gradient.x2 ?? '100%'));
      gradientEl.setAttribute('y2', String(gradient.y2 ?? 0));
    } else {
      gradientEl.setAttribute('cx', String(gradient.cx ?? '50%'));
      gradientEl.setAttribute('cy', String(gradient.cy ?? '50%'));
      gradientEl.setAttribute('r', String(gradient.r ?? '50%'));
    }
    
    gradient.stops.forEach((stop) => {
      const stopEl = SVGUtils.createElement(svg, 'stop', {
        offset: `${stop.offset}%`,
        'stop-color': stop.color,
        'stop-opacity': stop.opacity ?? 1,
      });
      gradientEl.appendChild(stopEl);
    });
    
    return gradientEl;
  }

  static createLinearGradient(
    svg: SVGSVGElement,
    id: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    stops: Array<{ offset: number; color: string; opacity?: number }>
  ): SVGLinearGradientElement {
    const gradient = SVGUtils.createElement(svg, 'linearGradient', {
      id,
      x1,
      y1,
      x2,
      y2,
    }) as SVGLinearGradientElement;
    
    stops.forEach((stop) => {
      const stopEl = SVGUtils.createElement(svg, 'stop', {
        offset: `${stop.offset}%`,
        'stop-color': stop.color,
        'stop-opacity': stop.opacity ?? 1,
      });
      gradient.appendChild(stopEl);
    });
    
    return gradient;
  }

  static createRadialGradient(
    svg: SVGSVGElement,
    id: string,
    cx: number,
    cy: number,
    r: number,
    stops: Array<{ offset: number; color: string; opacity?: number }>
  ): SVGRadialGradientElement {
    const gradient = SVGUtils.createElement(svg, 'radialGradient', {
      id,
      cx: `${cx}%`,
      cy: `${cy}%`,
      r: `${r}%`,
    }) as SVGRadialGradientElement;
    
    stops.forEach((stop) => {
      const stopEl = SVGUtils.createElement(svg, 'stop', {
        offset: `${stop.offset}%`,
        'stop-color': stop.color,
        'stop-opacity': stop.opacity ?? 1,
      });
      gradient.appendChild(stopEl);
    });
    
    return gradient;
  }

  static createFilter(
    svg: SVGSVGElement,
    filter: SVGFilter
  ): SVGFilterElement {
    const filterEl = SVGUtils.createElement(svg, 'filter', {
      id: filter.id,
    }) as SVGFilterElement;
    
    switch (filter.type) {
      case 'blur': {
        const feGaussianBlur = SVGUtils.createElement(svg, 'feGaussianBlur', {
          in: 'SourceGraphic',
          stdDeviation: filter.options?.stdDeviation ?? 5,
        });
        filterEl.appendChild(feGaussianBlur);
        break;
      }
      case 'dropShadow': {
        const feOffset = SVGUtils.createElement(svg, 'feOffset', {
          dx: filter.options?.dx ?? 2,
          dy: filter.options?.dy ?? 2,
        });
        const feFlood = SVGUtils.createElement(svg, 'feFlood', {
          'flood-color': filter.options?.floodColor ?? 'black',
          'flood-opacity': filter.options?.floodOpacity ?? 0.5,
        });
        const feComposite = SVGUtils.createElement(svg, 'feComposite', {
          in2: 'SourceAlpha',
          operator: 'in',
        });
        const feMerge = SVGUtils.createElement(svg, 'feMerge');
        const feMergeNode1 = SVGUtils.createElement(svg, 'feMergeNode');
        const feMergeNode2 = SVGUtils.createElement(svg, 'feMergeNode', {
          in: 'SourceGraphic',
        });
        
        feMerge.appendChild(feMergeNode1);
        feMerge.appendChild(feMergeNode2);
        
        filterEl.appendChild(feOffset);
        filterEl.appendChild(feFlood);
        filterEl.appendChild(feComposite);
        filterEl.appendChild(feMerge);
        break;
      }
      case 'glow': {
        const feGaussianBlur = SVGUtils.createElement(svg, 'feGaussianBlur', {
          in: 'SourceGraphic',
          stdDeviation: filter.options?.stdDeviation ?? 4,
          result: 'blur',
        });
        const feMerge = SVGUtils.createElement(svg, 'feMerge');
        const feMergeNode1 = SVGUtils.createElement(svg, 'feMergeNode', {
          in: 'blur',
        });
        const feMergeNode2 = SVGUtils.createElement(svg, 'feMergeNode', {
          in: 'SourceGraphic',
        });
        
        feMerge.appendChild(feMergeNode1);
        feMerge.appendChild(feMergeNode2);
        
        filterEl.appendChild(feGaussianBlur);
        filterEl.appendChild(feMerge);
        break;
      }
    }
    
    return filterEl;
  }

  static createClipPath(
    svg: SVGSVGElement,
    id: string,
    clipPathUnits?: 'userSpaceOnUse' | 'objectBoundingBox'
  ): SVGClipPathElement {
    const clipPath = SVGUtils.createElement(svg, 'clipPath', {
      id,
      'clipPathUnits': clipPathUnits ?? 'userSpaceOnUse',
    }) as SVGClipPathElement;
    
    return clipPath;
  }

  static createMask(
    svg: SVGSVGElement,
    id: string
  ): SVGMaskElement {
    const mask = SVGUtils.createElement(svg, 'mask', {
      id,
    }) as SVGMaskElement;
    
    return mask;
  }

  static createPattern(
    svg: SVGSVGElement,
    id: string,
    width: number,
    height: number,
    options?: {
      patternUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
      patternContentUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
      rotate?: number;
    }
  ): SVGPatternElement {
    const pattern = SVGUtils.createElement(svg, 'pattern', {
      id,
      width,
      height,
      patternUnits: options?.patternUnits ?? 'userSpaceOnUse',
      patternContentUnits: options?.patternContentUnits,
      patternTransform: options?.rotate ? `rotate(${options.rotate})` : undefined,
    }) as SVGPatternElement;
    
    return pattern;
  }

  static createSymbol(
    svg: SVGSVGElement,
    id: string,
    viewBox?: { x: number; y: number; width: number; height: number }
  ): SVGSymbolElement {
    const symbol = SVGUtils.createElement(svg, 'symbol', {
      id,
      viewBox: viewBox ? `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}` : undefined,
    }) as SVGSymbolElement;
    
    return symbol;
  }

  static createUse(
    svg: SVGSVGElement,
    href: string,
    x: number,
    y: number,
    width?: number,
    height?: number
  ): SVGUseElement {
    const use = SVGUtils.createElement(svg, 'use', {
      href,
      x,
      y,
      width,
      height,
    }) as SVGUseElement;
    
    return use;
  }

  static toDataURL(svg: SVGSVGElement, mimeType = 'image/png', quality = 1): Promise<string> {
    return new Promise((resolve, reject) => {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      if (mimeType === 'image/svg+xml') {
        resolve(svgUrl);
        return;
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = svg.width.baseVal.value || img.width;
        canvas.height = svg.height.baseVal.value || img.height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }
        
        const dataUrl = canvas.toDataURL(mimeType, quality);
        URL.revokeObjectURL(svgUrl);
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl);
        reject(new Error('Failed to load SVG'));
      };
      
      img.src = svgUrl;
    });
  }

  static download(svg: SVGSVGElement, filename = 'svg.svg'): void {
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  static parse(svgString: string): SVGSVGElement | null {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    
    if (!svg) return null;
    
    return svg as SVGSVGElement;
  }

  static serialize(svg: SVGSVGElement): string {
    return new XMLSerializer().serializeToString(svg);
  }

  static setAttributes(element: SVGElement, attributes: Record<string, string | number | undefined>): void {
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined) {
        element.setAttribute(key, String(value));
      }
    });
  }

  static getAttributes(element: SVGElement): Record<string, string> {
    const attributes: Record<string, string> = {};
    
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes[attr.name] = attr.value;
    }
    
    return attributes;
  }

  static transform(element: SVGElement, transforms: Array<{
    type: 'translate' | 'rotate' | 'scale' | 'skewX' | 'skewY' | 'matrix';
    values: number[];
  }>): void {
    const transformStr = transforms
      .map((t) => {
        switch (t.type) {
          case 'translate':
            return `translate(${t.values.join(',')})`;
          case 'rotate':
            return `rotate(${t.values.join(',')})`;
          case 'scale':
            return `scale(${t.values.join(',')})`;
          case 'skewX':
            return `skewX(${t.values[0]})`;
          case 'skewY':
            return `skewY(${t.values[0]})`;
          case 'matrix':
            return `matrix(${t.values.join(',')})`;
          default:
            return '';
        }
      })
      .join(' ');
    
    element.setAttribute('transform', transformStr);
  }

  static animate(
    element: SVGElement,
    options: {
      attributeName: string;
      from: string | number;
      to: string | number;
      dur: string;
      repeatCount?: number | 'indefinite';
      begin?: string;
      fill?: 'freeze' | 'remove';
      calcMode?: 'linear' | 'discrete' | 'paced' | 'spline';
      keyTimes?: string;
      keySplines?: string;
    }
  ): SVGAnimateElement {
    const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    
    animate.setAttribute('attributeName', options.attributeName);
    animate.setAttribute('from', String(options.from));
    animate.setAttribute('to', String(options.to));
    animate.setAttribute('dur', options.dur);
    
    if (options.repeatCount) {
      animate.setAttribute('repeatCount', String(options.repeatCount));
    }
    if (options.begin) {
      animate.setAttribute('begin', options.begin);
    }
    if (options.fill) {
      animate.setAttribute('fill', options.fill);
    }
    if (options.calcMode) {
      animate.setAttribute('calcMode', options.calcMode);
    }
    if (options.keyTimes) {
      animate.setAttribute('keyTimes', options.keyTimes);
    }
    if (options.keySplines) {
      animate.setAttribute('keySplines', options.keySplines);
    }
    
    element.appendChild(animate);
    
    return animate;
  }

  static createAnimation(
    element: SVGElement,
    type: 'animate' | 'animateTransform' | 'animateMotion',
    options: Record<string, string>
  ): SVGAnimationElement {
    const animate = document.createElementNS('http://www.w3.org/2000/svg', type);
    
    Object.entries(options).forEach(([key, value]) => {
      animate.setAttribute(key, value);
    });
    
    element.appendChild(animate);
    
    return animate;
  }
}

export class SVGIcon {
  private svg: SVGSVGElement;
  private group: SVGGElement;

  constructor(svg: SVGSVGElement) {
    this.svg = svg;
    this.group = SVGUtils.createGroup(svg);
  }

  setColor(color: string): void {
    this.group.setAttribute('fill', color);
    this.group.setAttribute('stroke', color);
  }

  setSize(width: number, height: number): void {
    this.svg.setAttribute('width', String(width));
    this.svg.setAttribute('height', String(height));
  }

  getSVG(): SVGSVGElement {
    return this.svg;
  }

  static create(
    container: HTMLElement,
    size: number,
    color: string
  ): SVGIcon {
    const svg = SVGUtils.create(container, {
      width: size,
      height: size,
      viewBox: { x: 0, y: 0, width: 24, height: 24 },
    });
    
    const icon = new SVGIcon(svg);
    icon.setColor(color);
    
    return icon;
  }
}

export class SVGPathBuilder {
  private commands: string[] = [];

  moveTo(x: number, y: number): this {
    this.commands.push(`M ${x} ${y}`);
    return this;
  }

  moveToRelative(dx: number, dy: number): this {
    this.commands.push(`m ${dx} ${dy}`);
    return this;
  }

  lineTo(x: number, y: number): this {
    this.commands.push(`L ${x} ${y}`);
    return this;
  }

  lineToRelative(dx: number, dy: number): this {
    this.commands.push(`l ${dx} ${dy}`);
    return this;
  }

  horizontal(x: number): this {
    this.commands.push(`H ${x}`);
    return this;
  }

  horizontalRelative(dx: number): this {
    this.commands.push(`h ${dx}`);
    return this;
  }

  vertical(y: number): this {
    this.commands.push(`V ${y}`);
    return this;
  }

  verticalRelative(dy: number): this {
    this.commands.push(`v ${dy}`);
    return this;
  }

  curveTo(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x: number,
    y: number
  ): this {
    this.commands.push(`C ${x1} ${y1} ${x2} ${y2} ${x} ${y}`);
    return this;
  }

  curveToRelative(
    dx1: number,
    dy1: number,
    dx2: number,
    dy2: number,
    dx: number,
    dy: number
  ): this {
    this.commands.push(`c ${dx1} ${dy1} ${dx2} ${dy2} ${dx} ${dy}`);
    return this;
  }

  smoothCurveTo(x2: number, y2: number, x: number, y: number): this {
    this.commands.push(`S ${x2} ${y2} ${x} ${y}`);
    return this;
  }

  smoothCurveToRelative(dx2: number, dy2: number, dx: number, dy: number): this {
    this.commands.push(`s ${dx2} ${dy2} ${dx} ${dy}`);
    return this;
  }

  quadraticCurveTo(x1: number, y1: number, x: number, y: number): this {
    this.commands.push(`Q ${x1} ${y1} ${x} ${y}`);
    return this;
  }

  quadraticCurveToRelative(dx1: number, dy1: number, dx: number, dy: number): this {
    this.commands.push(`q ${dx1} ${dy1} ${dx} ${dy}`);
    return this;
  }

  smoothQuadraticCurveTo(x: number, y: number): this {
    this.commands.push(`T ${x} ${y}`);
    return this;
  }

  smoothQuadraticCurveToRelative(dx: number, dy: number): this {
    this.commands.push(`t ${dx} ${dy}`);
    return this;
  }

  arc(
    rx: number,
    ry: number,
    xAxisRotation: number,
    largeArcFlag: boolean,
    sweepFlag: boolean,
    x: number,
    y: number
  ): this {
    this.commands.push(
      `A ${rx} ${ry} ${xAxisRotation} ${largeArcFlag ? 1 : 0} ${sweepFlag ? 1 : 0} ${x} ${y}`
    );
    return this;
  }

  arcRelative(
    dx: number,
    dy: number,
    xAxisRotation: number,
    largeArcFlag: boolean,
    sweepFlag: boolean
  ): this {
    this.commands.push(
      `a ${dx} ${dy} ${xAxisRotation} ${largeArcFlag ? 1 : 0} ${sweepFlag ? 1 : 0}`
    );
    return this;
  }

  closePath(): this {
    this.commands.push('Z');
    return this;
  }

  build(): string {
    return this.commands.join(' ');
  }

  clear(): this {
    this.commands = [];
    return this;
  }
}

export class SVGShapeFactory {
  static createStar(
    svg: SVGSVGElement,
    cx: number,
    cy: number,
    outerRadius: number,
    innerRadius: number,
    points: number,
    options?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
    }
  ): SVGPolygonElement {
    const shape = new SVGPathBuilder();
    const angleStep = (Math.PI * 2) / points;
    
    for (let i = 0; i < points * 2; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    
    shape.closePath();
    
    return SVGUtils.createPath(svg, shape.build(), options);
  }

  static createHeart(
    svg: SVGSVGElement,
    cx: number,
    cy: number,
    size: number,
    options?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
    }
  ): SVGPathElement {
    const path = new SVGPathBuilder();
    
    path.moveTo(cx, cy + size * 0.3);
    path.curveTo(cx - size * 0.5, cy - size * 0.3, cx - size, cy, cx - size * 0.5, cy + size * 0.6);
    path.curveTo(cx, cy + size, cx, cy + size * 0.3, cx, cy + size * 0.3);
    path.curveTo(cx, cy + size * 0.3, cx, cy + size, cx + size * 0.5, cy + size * 0.6);
    path.curveTo(cx + size, cy, cx + size * 0.5, cy - size * 0.3, cx, cy + size * 0.3);
    path.closePath();
    
    return SVGUtils.createPath(svg, path.build(), options);
  }

  static createArrow(
    svg: SVGSVGElement,
    x: number,
    y: number,
    width: number,
    height: number,
    direction: 'up' | 'down' | 'left' | 'right',
    options?: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
    }
  ): SVGPolygonElement {
    let points: Array<{ x: number; y: number }>;
    
    switch (direction) {
      case 'up':
        points = [
          { x: x + width / 2, y },
          { x: x + width, y: y + height },
          { x, y: y + height },
        ];
        break;
      case 'down':
        points = [
          { x: x, y },
          { x: x + width, y },
          { x: x + width / 2, y: y + height },
        ];
        break;
      case 'left':
        points = [
          { x: x + width, y },
          { x: x + width, y: y + height },
          { x, y: y + height / 2 },
        ];
        break;
      case 'right':
        points = [
          { x, y },
          { x, y: y + height },
          { x: x + width, y: y + height / 2 },
        ];
        break;
    }
    
    return SVGUtils.createPolygon(svg, points, options);
  }
}

export default SVGUtils;
