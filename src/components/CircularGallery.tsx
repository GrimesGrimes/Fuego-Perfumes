import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl';
import { getIconicProducts } from '../data/products';

type GalleryItem = {
  image: string;
  title: string;
  subtitle?: string;
  href?: string;
};

function debounce<T extends (...args: any[]) => void>(fn: T, wait: number) {
  let t: number | undefined;
  return (...args: Parameters<T>) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), wait);
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

class Media {
  gl: any;
  geometry: any;
  program: any;
  plane: any;

  image: string;
  index: number;
  length: number;

  renderer: any;
  scene: any;

  screen: { width: number; height: number };
  viewport: { width: number; height: number };

  bend: number;
  borderRadius: number;

  x = 0;
  width = 0;
  widthTotal = 0;
  padding = 2;

  extra = 0;

  baseScaleX = 1;
  baseScaleY = 1;

  constructor(opts: {
    geometry: any;
    gl: any;
    image: string;
    index: number;
    length: number;
    renderer: any;
    scene: any;
    screen: { width: number; height: number };
    viewport: { width: number; height: number };
    bend: number;
    borderRadius: number;
  }) {
    this.geometry = opts.geometry;
    this.gl = opts.gl;
    this.image = opts.image;
    this.index = opts.index;
    this.length = opts.length;
    this.renderer = opts.renderer;
    this.scene = opts.scene;
    this.screen = opts.screen;
    this.viewport = opts.viewport;
    this.bend = opts.bend;
    this.borderRadius = opts.borderRadius;

    this.createShader();
    this.createMesh();
    this.onResize({ screen: this.screen, viewport: this.viewport });
  }

  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: true });

    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;

        attribute vec3 position;
        attribute vec2 uv;

        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;

        uniform float uTime;
        uniform float uSpeed;

        varying vec2 vUv;

        void main() {
          vUv = uv;

          vec3 p = position;
          // micro-distortion premium
          p.z += (sin(p.x * 3.5 + uTime) * 0.9 + cos(p.y * 2.2 + uTime) * 0.9) * (0.06 + uSpeed * 0.12);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;

        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;

        uniform sampler2D tMap;
        uniform float uBorderRadius;

        uniform float uBlur;   // 0..~0.02
        uniform float uAlpha;  // 0..1

        varying vec2 vUv;

        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }

        vec4 sampleBlur(sampler2D tex, vec2 uv, float r) {
          if (r <= 0.00001) return texture2D(tex, uv);

          vec2 o = vec2(r, r);
          vec4 c = vec4(0.0);

          c += texture2D(tex, uv) * 0.42;
          c += texture2D(tex, uv + vec2( o.x, 0.0)) * 0.12;
          c += texture2D(tex, uv + vec2(-o.x, 0.0)) * 0.12;
          c += texture2D(tex, uv + vec2(0.0,  o.y)) * 0.17;
          c += texture2D(tex, uv + vec2(0.0, -o.y)) * 0.17;

          return c;
        }

        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );

          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
          );

          vec4 color = sampleBlur(tMap, uv, uBlur);

          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          float edge = 0.0025;
          float mask = 1.0 - smoothstep(-edge, edge, d);

          gl_FragColor = vec4(color.rgb, color.a * mask * uAlpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [1, 1] },
        uImageSizes: { value: [1, 1] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius },
        uBlur: { value: 0.0 },
        uAlpha: { value: 1.0 }
      },
      transparent: true
    });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
    };
  }

  createMesh() {
    this.plane = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
    this.plane.setParent(this.scene);
  }

  update(scroll: { current: number; last: number }, direction: 'left' | 'right') {
    this.plane.position.x = this.x - scroll.current - this.extra;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    // foco centro (0..1)
    const dist = clamp(Math.abs(x) / H, 0, 1);
    const focus = 1 - dist;

    // curva/bend
    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B = Math.abs(this.bend);
      const R = (H * H + B * B) / (2 * B);
      const effectiveX = Math.min(Math.abs(x), H);

      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    // velocidad + micro anim
    const speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = speed;

    // PREMIUM: centro más grande + hacia adelante
    const s = lerp(0.78, 1.12, focus);
    this.plane.scale.x = this.baseScaleX * s;
    this.plane.scale.y = this.baseScaleY * s;
    this.plane.position.z = focus * 0.55;

    // blur/alpha en laterales
    this.program.uniforms.uBlur.value = lerp(0.012, 0.0, focus);
    this.program.uniforms.uAlpha.value = lerp(0.35, 1.0, focus);

    // importante: actualizar plane sizes por el scale dinámico
    this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];

    // wrap infinito
    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;

    const isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    const isAfter = this.plane.position.x - planeOffset > viewportOffset;

    if (direction === 'right' && isBefore) this.extra -= this.widthTotal;
    if (direction === 'left' && isAfter) this.extra += this.widthTotal;
  }

  onResize(opts: { screen: { width: number; height: number }; viewport: { width: number; height: number } }) {
    this.screen = opts.screen;
    this.viewport = opts.viewport;

    // base size: ajustado para hero (se siente “premium” y no tosco)
    const scale = this.screen.height / 1200;

    this.baseScaleY = (this.viewport.height * (780 * scale)) / this.screen.height;
    this.baseScaleX = (this.viewport.width * (520 * scale)) / this.screen.width;

    this.plane.scale.y = this.baseScaleY;
    this.plane.scale.x = this.baseScaleX;

    this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];

    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

class OGLGalleryApp {
  container: HTMLDivElement;
  renderer: any;
  gl: any;
  camera: any;
  scene: any;

  planeGeometry: any;
  medias: Media[] = [];
  items: GalleryItem[] = [];
  doubled: GalleryItem[] = [];

  screen = { width: 0, height: 0 };
  viewport = { width: 0, height: 0 };

  bend: number;
  borderRadius: number;

  scrollSpeed: number;
  scroll = { ease: 0.04, current: 0, target: 0, last: 0 };
  isDown = false;
  startX = 0;
  startTarget = 0;

  autoplay: boolean;
  autoplayInterval: number;
  lastAuto = 0;

  activeIndex = 0;
  onActiveChange?: (index: number) => void;

  raf = 0;

  private onResizeBound: () => void;
  private onWheelBound: (e: WheelEvent) => void;
  private onPointerDownBound: (e: PointerEvent) => void;
  private onPointerMoveBound: (e: PointerEvent) => void;
  private onPointerUpBound: (e: PointerEvent) => void;

  private onCheckDebounce: () => void;

  constructor(
    container: HTMLDivElement,
    opts: {
      items: GalleryItem[];
      bend: number;
      borderRadius: number;
      scrollSpeed: number;
      scrollEase: number;
      autoplay: boolean;
      autoplayInterval: number;
      onActiveChange?: (index: number) => void;
    }
  ) {
    this.container = container;

    this.items = opts.items;
    this.doubled = this.items.concat(this.items);

    this.bend = opts.bend;
    this.borderRadius = opts.borderRadius;

    this.scrollSpeed = opts.scrollSpeed;
    this.scroll.ease = opts.scrollEase;

    this.autoplay = opts.autoplay;
    this.autoplayInterval = opts.autoplayInterval;

    this.onActiveChange = opts.onActiveChange;

    this.onCheckDebounce = debounce(() => this.onCheck(), 180);

    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.createGeometry();

    this.onResize();
    this.createMedias();

    this.onResizeBound = this.onResize.bind(this);
    this.onWheelBound = this.onWheel.bind(this);
    this.onPointerDownBound = this.onPointerDown.bind(this);
    this.onPointerMoveBound = this.onPointerMove.bind(this);
    this.onPointerUpBound = this.onPointerUp.bind(this);

    this.addEventListeners();

    this.lastAuto = performance.now();
    this.update();
  }

  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);

    this.gl.canvas.style.width = '100%';
    this.gl.canvas.style.height = '100%';
    this.gl.canvas.style.display = 'block';
    // importante para mobile (no bloquear scroll vertical)
    (this.gl.canvas as HTMLCanvasElement).style.touchAction = 'pan-y';

    this.container.appendChild(this.gl.canvas);
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, { heightSegments: 40, widthSegments: 80 });
  }

  createMedias() {
    this.medias = this.doubled.map((it, index) => {
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: it.image,
        index,
        length: this.doubled.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        viewport: this.viewport,
        bend: this.bend,
        borderRadius: this.borderRadius
      });
    });
  }

  onPointerDown(e: PointerEvent) {
    this.isDown = true;
    this.startX = e.clientX;
    this.startTarget = this.scroll.target;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  }

  onPointerMove(e: PointerEvent) {
    if (!this.isDown) return;
    const dx = this.startX - e.clientX;
    const dist = dx * (this.scrollSpeed * 0.025);
    this.scroll.target = this.startTarget + dist;
  }

  onPointerUp(e: PointerEvent) {
    this.isDown = false;
    this.onCheck();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  }

  onWheel(e: WheelEvent) {
    const delta = e.deltaY || 0;
    this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.35;
    this.onCheckDebounce();
  }

  onCheck() {
    if (!this.medias?.[0]) return;
    const w = this.medias[0].width || 1;
    const idx = Math.round(Math.abs(this.scroll.target) / w);
    const snap = w * idx;
    this.scroll.target = this.scroll.target < 0 ? -snap : snap;
  }

  updateActiveIndex() {
    if (!this.medias?.[0]) return;
    const w = this.medias[0].width || 1;

    const idx = Math.round(Math.abs(this.scroll.current) / w);
    const logical = idx % this.items.length;

    if (logical !== this.activeIndex) {
      this.activeIndex = logical;
      this.onActiveChange?.(logical);
    }
  }

  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    };

    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({ aspect: this.screen.width / this.screen.height });

    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };

    if (this.medias.length) {
      this.medias.forEach(m => m.onResize({ screen: this.screen, viewport: this.viewport }));
    }
  }

  update = () => {
    // autoplay (snap por item cada X ms)
    if (this.autoplay && !this.isDown && this.medias?.[0]) {
      const now = performance.now();
      if (now - this.lastAuto >= this.autoplayInterval) {
        this.lastAuto = now;
        const w = this.medias[0].width || 1;
        this.scroll.target += w;
        this.onCheck();
      }
    }

    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);

    const direction: 'right' | 'left' = this.scroll.current > this.scroll.last ? 'right' : 'left';

    this.medias.forEach(m => m.update(this.scroll, direction));

    this.updateActiveIndex();

    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;

    this.raf = window.requestAnimationFrame(this.update);
  };

  addEventListeners() {
    window.addEventListener('resize', this.onResizeBound);

    this.container.addEventListener('wheel', this.onWheelBound, { passive: true });
    this.container.addEventListener('pointerdown', this.onPointerDownBound);
    this.container.addEventListener('pointermove', this.onPointerMoveBound);
    this.container.addEventListener('pointerup', this.onPointerUpBound);
    this.container.addEventListener('pointercancel', this.onPointerUpBound);
    this.container.addEventListener('pointerleave', this.onPointerUpBound);
  }

  destroy() {
    window.cancelAnimationFrame(this.raf);

    window.removeEventListener('resize', this.onResizeBound);

    this.container.removeEventListener('wheel', this.onWheelBound as any);
    this.container.removeEventListener('pointerdown', this.onPointerDownBound as any);
    this.container.removeEventListener('pointermove', this.onPointerMoveBound as any);
    this.container.removeEventListener('pointerup', this.onPointerUpBound as any);
    this.container.removeEventListener('pointercancel', this.onPointerUpBound as any);
    this.container.removeEventListener('pointerleave', this.onPointerUpBound as any);

    if (this.renderer?.gl?.canvas?.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    }
  }
}

type CircularGalleryProps = {
  items?: GalleryItem[];
  bend?: number;
  borderRadius?: number;
  scrollSpeed?: number;
  scrollEase?: number;

  autoplay?: boolean;
  autoplayInterval?: number; // ms (default 1500)

  className?: string;
};

export default function CircularGallery({
  items,
  bend = 7,
  borderRadius = 0.21,
  scrollSpeed = 1.6,
  scrollEase = 0.03,
  autoplay = true,
  autoplayInterval = 1500,
  className
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<OGLGalleryApp | null>(null);

  const defaultItems = useMemo<GalleryItem[]>(() => {
    const iconic = getIconicProducts().slice(0, 6); // 6 icónicos
    return iconic.map(p => ({
      image: p.image,
      title: p.inspiredByName,
      subtitle: p.house,
      href: `/producto/${encodeURIComponent(p.code)}`
    }));
  }, []);

  const finalItems = items?.length ? items : defaultItems;

  const [active, setActive] = useState(0);
  const activeItem = finalItems[active];

  useEffect(() => {
    if (!containerRef.current) return;

    // limpiar instancia previa si el componente re-renderiza por props
    appRef.current?.destroy();

    const app = new OGLGalleryApp(containerRef.current, {
      items: finalItems,
      bend,
      borderRadius,
      scrollSpeed,
      scrollEase,
      autoplay,
      autoplayInterval,
      onActiveChange: setActive
    });

    appRef.current = app;

    return () => {
      app.destroy();
      appRef.current = null;
    };
  }, [finalItems, bend, borderRadius, scrollSpeed, scrollEase, autoplay, autoplayInterval]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className ?? ''}`}>
      {/* Canvas host */}
      <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Texto premium minimal (solo nombre + marca, marca difuminada) */}
      {activeItem && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <div className="text-center">
            <div className="text-white font-semibold text-lg sm:text-xl leading-tight">
              {activeItem.title}
            </div>
            {activeItem.subtitle && (
              <div className="text-white/45 text-sm sm:text-base blur-[0.2px]">
                {activeItem.subtitle}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
