import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useGesture } from '@use-gesture/react';

type DomeImage =
    | string
    | {
        src: string;
        alt?: string;
        code?: string;
    };

type DomeGalleryProps = {
    images?: DomeImage[];

    fit?: number;
    fitBasis?: 'auto' | 'min' | 'max' | 'width' | 'height';
    minRadius?: number;
    maxRadius?: number;
    padFactor?: number;

    overlayBlurColor?: string;

    maxVerticalRotationDeg?: number;
    dragSensitivity?: number;
    dragDampening?: number;

    enlargeTransitionMs?: number;

    segments?: number;

    openedImageWidth?: string;
    openedImageHeight?: string;

    imageBorderRadius?: string;
    openedImageBorderRadius?: string;

    grayscale?: boolean;

    autoplay?: boolean;
    autoplaySpeedDegPerSec?: number;

    onSelectCode?: (code: string) => void;
};

const DEFAULTS = {
    maxVerticalRotationDeg: 5,
    dragSensitivity: 20,
    enlargeTransitionMs: 300,
    segments: 30
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const normalizeAngle = (d: number) => ((d % 360) + 360) % 360;
const wrapAngleSigned = (deg: number) => {
    const a = (((deg + 180) % 360) + 360) % 360;
    return a - 180;
};

function getDataNumber(el: HTMLElement, name: string, fallback: number) {
    const attr = (el.dataset as any)[name] ?? el.getAttribute(`data-${name}`);
    const n = attr == null ? NaN : parseFloat(attr);
    return Number.isFinite(n) ? n : fallback;
}

function buildItems(pool: DomeImage[], seg: number) {
    const xStart = -(seg - 1);
    const xCols = Array.from({ length: seg }, (_, i) => xStart + i * 2);
    const evenYs = [-4, -2, 0, 2, 4];
    const oddYs = [-3, -1, 1, 3, 5];

    const coords = xCols.flatMap((x, c) => {
        const ys = c % 2 === 0 ? evenYs : oddYs;
        return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }));
    });

    const totalSlots = coords.length;

    const normalizedImages = (pool || []).map((image) => {
        if (typeof image === 'string') return { src: image, alt: '', code: undefined };
        return { src: image.src || '', alt: image.alt || '', code: (image as any).code };
    });

    if (normalizedImages.length === 0) {
        return coords.map((c) => ({ ...c, src: '', alt: '', code: undefined }));
    }

    if (normalizedImages.length > totalSlots) {
        console.warn(
            `[DomeGallery] Provided image count (${normalizedImages.length}) exceeds available tiles (${totalSlots}). Some images will not be shown. Increase "segments" if you want more tiles.`
        );
    }

    const usedImages = Array.from({ length: totalSlots }, (_, i) => normalizedImages[i % normalizedImages.length]);

    // evita repetición inmediata
    for (let i = 1; i < usedImages.length; i++) {
        if (usedImages[i].src === usedImages[i - 1].src) {
            for (let j = i + 1; j < usedImages.length; j++) {
                if (usedImages[j].src !== usedImages[i].src) {
                    const tmp = usedImages[i];
                    usedImages[i] = usedImages[j];
                    usedImages[j] = tmp;
                    break;
                }
            }
        }
    }

    return coords.map((c, i) => ({
        ...c,
        src: usedImages[i].src,
        alt: usedImages[i].alt,
        code: usedImages[i].code
    }));
}

function computeItemBaseRotation(offsetX: number, offsetY: number, sizeX: number, sizeY: number, segments: number) {
    const unit = 360 / segments / 2;
    const rotateY = unit * (offsetX + (sizeX - 1) / 2);
    const rotateX = unit * (offsetY - (sizeY - 1) / 2);
    return { rotateX, rotateY };
}

export default function DomeGallery({
    images = [],
    fit = 0.5,
    fitBasis = 'auto',
    minRadius = 520,
    maxRadius = Infinity,
    padFactor = 0.25,
    overlayBlurColor = '#060010',
    maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
    dragSensitivity = DEFAULTS.dragSensitivity,
    enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
    segments = DEFAULTS.segments,
    dragDampening = 2,
    openedImageWidth = '420px',
    openedImageHeight = '420px',
    imageBorderRadius = '22px',
    openedImageBorderRadius = '26px',
    grayscale = false,

    autoplay = true,
    autoplaySpeedDegPerSec = 7.0,
    onSelectCode
}: DomeGalleryProps) {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const mainRef = useRef<HTMLDivElement | null>(null);
    const sphereRef = useRef<HTMLDivElement | null>(null);
    const frameRef = useRef<HTMLDivElement | null>(null);
    const viewerRef = useRef<HTMLDivElement | null>(null);
    const scrimRef = useRef<HTMLDivElement | null>(null);

    const focusedElRef = useRef<HTMLElement | null>(null);
    const originalTilePositionRef = useRef<DOMRect | null>(null);

    const rotationRef = useRef({ x: 0, y: 0 });
    const startRotRef = useRef({ x: 0, y: 0 });
    const startPosRef = useRef<{ x: number; y: number } | null>(null);

    const draggingRef = useRef(false);
    const movedRef = useRef(false);
    const inertiaRAF = useRef<number | null>(null);
    const pointerTypeRef = useRef<'mouse' | 'touch' | 'pen'>('mouse');
    const tapTargetRef = useRef<HTMLElement | null>(null);
    const openingRef = useRef(false);
    const openStartedAtRef = useRef(0);
    const lastDragEndAt = useRef(0);

    const scrollLockedRef = useRef(false);
    const lockScroll = useCallback(() => {
        if (scrollLockedRef.current) return;
        scrollLockedRef.current = true;
        document.body.classList.add('dg-scroll-lock');
    }, []);
    const unlockScroll = useCallback(() => {
        if (!scrollLockedRef.current) return;
        if (rootRef.current?.getAttribute('data-enlarging') === 'true') return;
        scrollLockedRef.current = false;
        document.body.classList.remove('dg-scroll-lock');
    }, []);

    const items = useMemo(() => buildItems(images, segments), [images, segments]);

    const applyTransform = (xDeg: number, yDeg: number) => {
        const el = sphereRef.current;
        if (!el) return;
        el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
    };

    const stopInertia = useCallback(() => {
        if (inertiaRAF.current) {
            cancelAnimationFrame(inertiaRAF.current);
            inertiaRAF.current = null;
        }
    }, []);

    const startInertia = useCallback(
        (vx: number, vy: number) => {
            const MAX_V = 1.4;
            let vX = clamp(vx, -MAX_V, MAX_V) * 80;
            let vY = clamp(vy, -MAX_V, MAX_V) * 80;
            let frames = 0;

            const d = clamp(dragDampening ?? 0.6, 0, 1);
            const frictionMul = 0.94 + 0.055 * d;
            const stopThreshold = 0.015 - 0.01 * d;
            const maxFrames = Math.round(90 + 270 * d);

            const step = () => {
                vX *= frictionMul;
                vY *= frictionMul;

                if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
                    inertiaRAF.current = null;
                    return;
                }
                if (++frames > maxFrames) {
                    inertiaRAF.current = null;
                    return;
                }

                const nextX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg);
                const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200);

                rotationRef.current = { x: nextX, y: nextY };
                applyTransform(nextX, nextY);

                inertiaRAF.current = requestAnimationFrame(step);
            };

            stopInertia();
            inertiaRAF.current = requestAnimationFrame(step);
        },
        [dragDampening, maxVerticalRotationDeg, stopInertia]
    );

    // Resize -> set radius + css vars
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const ro = new ResizeObserver((entries) => {
            const cr = entries[0].contentRect;
            const w = Math.max(1, cr.width);
            const h = Math.max(1, cr.height);
            const minDim = Math.min(w, h);
            const maxDim = Math.max(w, h);
            const aspect = w / h;

            let basis: number;
            switch (fitBasis) {
                case 'min':
                    basis = minDim;
                    break;
                case 'max':
                    basis = maxDim;
                    break;
                case 'width':
                    basis = w;
                    break;
                case 'height':
                    basis = h;
                    break;
                default:
                    basis = aspect >= 1.3 ? w : minDim;
            }

            let radius = basis * fit;
            const heightGuard = h * 1.35;
            radius = Math.min(radius, heightGuard);
            radius = clamp(radius, minRadius, maxRadius);

            const viewerPad = Math.max(8, Math.round(minDim * padFactor));

            root.style.setProperty('--radius', `${Math.round(radius)}px`);
            root.style.setProperty('--viewer-pad', `${viewerPad}px`);
            root.style.setProperty('--overlay-blur-color', overlayBlurColor);
            root.style.setProperty('--tile-radius', imageBorderRadius);
            root.style.setProperty('--enlarge-radius', openedImageBorderRadius);
            root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');

            applyTransform(rotationRef.current.x, rotationRef.current.y);
        });

        ro.observe(root);
        return () => ro.disconnect();
    }, [
        fit,
        fitBasis,
        minRadius,
        maxRadius,
        padFactor,
        overlayBlurColor,
        grayscale,
        imageBorderRadius,
        openedImageBorderRadius
    ]);

    // autoplay suave
    useEffect(() => {
        if (!autoplay) return;
        let raf = 0;
        let last = performance.now();

        const tick = (t: number) => {
            const dt = Math.min(32, t - last);
            last = t;

            const isBusy = draggingRef.current || !!focusedElRef.current || openingRef.current;
            if (!isBusy) {
                const deltaDeg = (autoplaySpeedDegPerSec * dt) / 1000;
                const nextY = wrapAngleSigned(rotationRef.current.y + deltaDeg);
                rotationRef.current = { ...rotationRef.current, y: nextY };
                applyTransform(rotationRef.current.x, nextY);
            }
            raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [autoplay, autoplaySpeedDegPerSec]);

    const openItemFromElement = useCallback(
        (el: HTMLElement) => {
            const parent = el.parentElement as HTMLElement | null;
            if (!parent) return;

            // ✅ Home (QuickView): abrir modal y salir. Nada de scroll-lock ni overlay interno.
            const rawCode = parent.dataset.code;
            if (rawCode && onSelectCode) {
                onSelectCode(rawCode);
                return;
            }

            if (openingRef.current) return;
            openingRef.current = true;
            openStartedAtRef.current = performance.now();
            lockScroll();

            focusedElRef.current = el;
            el.setAttribute('data-focused', 'true');

            const offsetX = getDataNumber(parent, 'offsetX', 0);
            const offsetY = getDataNumber(parent, 'offsetY', 0);
            const sizeX = getDataNumber(parent, 'sizeX', 2);
            const sizeY = getDataNumber(parent, 'sizeY', 2);

            const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments);
            const parentY = normalizeAngle(parentRot.rotateY);
            const globalY = normalizeAngle(rotationRef.current.y);

            let rotY = (-(parentY + globalY) % 360);
            if (rotY < -180) rotY += 360;

            const rotX = -parentRot.rotateX - rotationRef.current.x;

            parent.style.setProperty('--rot-y-delta', `${rotY}deg`);
            parent.style.setProperty('--rot-x-delta', `${rotX}deg`);

            const refDiv = document.createElement('div');
            refDiv.className = 'item__image item__image--reference opacity-0';
            refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
            parent.appendChild(refDiv);

            // medir
            const tileR = refDiv.getBoundingClientRect();
            const mainR = mainRef.current?.getBoundingClientRect();
            const frameR = frameRef.current?.getBoundingClientRect();

            if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
                refDiv.remove();
                focusedElRef.current = null;
                openingRef.current = false;
                unlockScroll();
                return;
            }

            originalTilePositionRef.current = tileR;

            el.style.visibility = 'hidden';

            const overlay = document.createElement('div');
            overlay.className = 'enlarge';
            overlay.style.position = 'absolute';
            overlay.style.left = frameR.left - mainR.left + 'px';
            overlay.style.top = frameR.top - mainR.top + 'px';
            overlay.style.width = frameR.width + 'px';
            overlay.style.height = frameR.height + 'px';
            overlay.style.opacity = '0';
            overlay.style.zIndex = '30';
            overlay.style.transformOrigin = 'top left';
            overlay.style.transition = `transform ${enlargeTransitionMs}ms ease, opacity ${enlargeTransitionMs}ms ease`;
            overlay.style.borderRadius = openedImageBorderRadius;
            overlay.style.overflow = 'hidden';
            overlay.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)';
            overlay.style.background = overlayBlurColor;

            const rawSrc = parent.dataset.src || el.querySelector('img')?.src || '';
            const rawAlt = parent.dataset.alt || el.querySelector('img')?.alt || '';


            const img = document.createElement('img');
            img.src = rawSrc;
            img.alt = rawAlt;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain'; // importante para perfumes PNG
            img.style.padding = '22px';
            img.style.filter = grayscale ? 'grayscale(1)' : 'none';

            overlay.appendChild(img);
            viewerRef.current?.appendChild(overlay);

            const tx0 = tileR.left - frameR.left;
            const ty0 = tileR.top - frameR.top;
            const sx0 = tileR.width / frameR.width;
            const sy0 = tileR.height / frameR.height;

            overlay.style.transform = `translate(${tx0}px, ${ty0}px) scale(${isFinite(sx0) && sx0 > 0 ? sx0 : 1}, ${isFinite(sy0) && sy0 > 0 ? sy0 : 1
                })`;

            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                overlay.style.transform = 'translate(0px, 0px) scale(1, 1)';
                rootRef.current?.setAttribute('data-enlarging', 'true');
            });

            // tamaño final (centrado)
            const wantsResize = openedImageWidth || openedImageHeight;
            if (wantsResize) {
                const onFirstEnd = (ev: TransitionEvent) => {
                    if (ev.propertyName !== 'transform') return;
                    overlay.removeEventListener('transitionend', onFirstEnd);

                    overlay.style.transition = `left ${enlargeTransitionMs}ms ease, top ${enlargeTransitionMs}ms ease, width ${enlargeTransitionMs}ms ease, height ${enlargeTransitionMs}ms ease`;
                    const centeredLeft = frameR.left - mainR.left + (frameR.width - parseInt(openedImageWidth)) / 2;
                    const centeredTop = frameR.top - mainR.top + (frameR.height - parseInt(openedImageHeight)) / 2;

                    requestAnimationFrame(() => {
                        overlay.style.left = `${centeredLeft}px`;
                        overlay.style.top = `${centeredTop}px`;
                        overlay.style.width = openedImageWidth;
                        overlay.style.height = openedImageHeight;
                    });
                };
                overlay.addEventListener('transitionend', onFirstEnd);
            }
        },
        [
            onSelectCode,
            enlargeTransitionMs,
            grayscale,
            lockScroll,
            openedImageBorderRadius,
            openedImageHeight,
            openedImageWidth,
            overlayBlurColor,
            segments,
            unlockScroll
        ]
    );

    // cerrar (scrim)
    useEffect(() => {
        const scrim = scrimRef.current;
        if (!scrim) return;

        const close = () => {
            if (performance.now() - openStartedAtRef.current < 250) return;

            const el = focusedElRef.current;
            if (!el) return;

            const parent = el.parentElement as HTMLElement | null;
            const overlay = viewerRef.current?.querySelector('.enlarge') as HTMLElement | null;
            if (!parent || !overlay) return;

            overlay.remove();

            parent.style.setProperty('--rot-y-delta', `0deg`);
            parent.style.setProperty('--rot-x-delta', `0deg`);

            el.style.visibility = '';
            focusedElRef.current = null;
            rootRef.current?.removeAttribute('data-enlarging');
            openingRef.current = false;

            unlockScroll();
        };

        scrim.addEventListener('click', close);
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', onKey);

        return () => {
            scrim.removeEventListener('click', close);
            window.removeEventListener('keydown', onKey);
        };
    }, [unlockScroll]);

    // drag
    useGesture(
        {
            onDragStart: ({ event }) => {
                if (focusedElRef.current) return;
                stopInertia();

                pointerTypeRef.current = ((event as any).pointerType || 'mouse') as any;
                if (pointerTypeRef.current === 'touch') (event as any).preventDefault?.();

                draggingRef.current = true;
                movedRef.current = false;

                startRotRef.current = { ...rotationRef.current };
                startPosRef.current = { x: (event as any).clientX, y: (event as any).clientY };

                const target = (event.target as HTMLElement | null)?.closest?.('.item__image') as HTMLElement | null;
                tapTargetRef.current = target || null;
            },
            onDrag: ({ event, last, velocity: velArr = [0, 0], direction: dirArr = [0, 0], movement }) => {
                if (focusedElRef.current || !draggingRef.current || !startPosRef.current) return;

                if (pointerTypeRef.current === 'touch') (event as any).preventDefault?.();

                const dxTotal = (event as any).clientX - startPosRef.current.x;
                const dyTotal = (event as any).clientY - startPosRef.current.y;

                if (!movedRef.current) {
                    const dist2 = dxTotal * dxTotal + dyTotal * dyTotal;
                    if (dist2 > 16) movedRef.current = true;
                }

                const nextX = clamp(
                    startRotRef.current.x - dyTotal / dragSensitivity,
                    -maxVerticalRotationDeg,
                    maxVerticalRotationDeg
                );
                const nextY = startRotRef.current.y + dxTotal / dragSensitivity;

                rotationRef.current = { x: nextX, y: nextY };
                applyTransform(nextX, nextY);

                if (last) {
                    draggingRef.current = false;

                    // tap detection
                    let isTap = false;
                    const dx = (event as any).clientX - startPosRef.current.x;
                    const dy = (event as any).clientY - startPosRef.current.y;
                    const dist2 = dx * dx + dy * dy;
                    const TAP_THRESH_PX = pointerTypeRef.current === 'touch' ? 10 : 6;
                    if (dist2 <= TAP_THRESH_PX * TAP_THRESH_PX) isTap = true;

                    const [vMagX, vMagY] = velArr as any;
                    const [dirX, dirY] = dirArr as any;
                    let vx = vMagX * dirX;
                    let vy = vMagY * dirY;

                    if (!isTap && Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
                        const [mx, my] = movement as any;
                        vx = (mx / dragSensitivity) * 0.02;
                        vy = (my / dragSensitivity) * 0.02;
                    }

                    if (!isTap && (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005)) {
                        startInertia(vx, vy);
                    }

                    startPosRef.current = null;

                    if (isTap && tapTargetRef.current && !focusedElRef.current) {
                        if (performance.now() - lastDragEndAt.current > 80) openItemFromElement(tapTargetRef.current);
                    }

                    tapTargetRef.current = null;
                    if (movedRef.current) lastDragEndAt.current = performance.now();
                    movedRef.current = false;
                }
            }
        },
        { target: mainRef, eventOptions: { passive: false } }
    );

    useEffect(() => {
        return () => {
            document.body.classList.remove('dg-scroll-lock');
        };
    }, []);

    const cssStyles = `
    .sphere-root {
      --radius: 520px;
      --viewer-pad: 72px;
      --circ: calc(var(--radius) * 3.14);
      --rot-y: calc((360deg / var(--segments-x)) / 2);
      --rot-x: calc((360deg / var(--segments-y)) / 2);
      --item-width: calc(var(--circ) / var(--segments-x));
      --item-height: calc(var(--circ) / var(--segments-y));
    }

    .sphere-root * { box-sizing: border-box; }
    .sphere, .sphere-item, .item__image { transform-style: preserve-3d; }

    .stage {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      position: absolute;
      inset: 0;
      margin: auto;
      perspective: calc(var(--radius) * 2);
      perspective-origin: 50% 50%;
    }

    .sphere {
      transform: translateZ(calc(var(--radius) * -1));
      will-change: transform;
      position: absolute;
    }

    .sphere-item {
      width: calc(var(--item-width) * var(--item-size-x));
      height: calc(var(--item-height) * var(--item-size-y));
      position: absolute;
      top: -999px; bottom: -999px; left: -999px; right: -999px;
      margin: auto;
      transform-origin: 50% 50%;
      backface-visibility: hidden;
      transition: transform 300ms;
      transform:
        rotateY(calc(var(--rot-y) * (var(--offset-x) + ((var(--item-size-x) - 1) / 2)) + var(--rot-y-delta, 0deg)))
        rotateX(calc(var(--rot-x) * (var(--offset-y) - ((var(--item-size-y) - 1) / 2)) + var(--rot-x-delta, 0deg)))
        translateZ(var(--radius));
    }

    .sphere-root[data-enlarging="true"] .scrim {
      opacity: 1 !important;
      pointer-events: all !important;
    }

    @media (max-aspect-ratio: 1/1) {
      .viewer-frame { height: auto !important; width: 100% !important; }
    }

    .item__image {
      position: absolute;
      inset: 6px;
      border-radius: var(--tile-radius, 12px);
      overflow: hidden;
      cursor: pointer;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      transition: transform 300ms;
      pointer-events: auto;
      -webkit-transform: translateZ(0);
      transform: translateZ(0);
    }

    .item__image:hover { transform: translateZ(0) scale(1.06); }

    .item__image--reference {
      position: absolute;
      inset: 6px;
      pointer-events: none;
    }
      .dg-tile-img{
  padding: 10px;           /* antes era 20px (p-5) */
  transform: scale(1.18);  /* ✅ crece la fragancia */
  transform-origin: center;
  will-change: transform;
}

@media (min-width: 640px){
  .dg-tile-img{
    padding: 12px;
    transform: scale(1.22);
  }
}

  `;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
            <div
                ref={rootRef}
                className="sphere-root relative w-full h-full"
                style={{
                    '--segments-x': segments,
                    '--segments-y': segments,
                    '--overlay-blur-color': overlayBlurColor,
                    '--tile-radius': imageBorderRadius,
                    '--enlarge-radius': openedImageBorderRadius,
                    '--image-filter': grayscale ? 'grayscale(1)' : 'none'
                }}
            >
                <div
                    ref={mainRef}
                    className="absolute inset-0 grid place-items-center overflow-hidden select-none bg-transparent"
                    style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
                >
                    <div className="stage">
                        <div ref={sphereRef} className="sphere">
                            {items.map((it, i) => (
                                <div
                                    key={`${it.x},${it.y},${i}`}
                                    className="sphere-item absolute m-auto"
                                    data-src={it.src}
                                    data-alt={it.alt}
                                    data-code={it.code}
                                    data-offset-x={it.x}
                                    data-offset-y={it.y}
                                    data-size-x={it.sizeX}
                                    data-size-y={it.sizeY}
                                    style={{
                                        '--offset-x': it.x,
                                        '--offset-y': it.y,
                                        '--item-size-x': it.sizeX,
                                        '--item-size-y': it.sizeY
                                    }}
                                >
                                    <div
                                        className="item__image absolute block overflow-hidden cursor-pointer bg-surface-light/60 backdrop-blur-sm border border-white/10"
                                        role="button"
                                        tabIndex={0}
                                        aria-label={it.alt || 'Open image'}
                                        onClick={(e) => {
                                            if (draggingRef.current) return;
                                            if (movedRef.current) return;
                                            if (performance.now() - lastDragEndAt.current < 80) return;
                                            if (openingRef.current) return;
                                            openItemFromElement(e.currentTarget);
                                        }}
                                        onPointerUp={(e) => {
                                            if (e.pointerType !== 'touch') return;
                                            if (draggingRef.current) return;
                                            if (movedRef.current) return;
                                            if (performance.now() - lastDragEndAt.current < 80) return;
                                            if (openingRef.current) return;
                                            openItemFromElement(e.currentTarget);
                                        }}
                                        style={{ borderRadius: `var(--tile-radius, ${imageBorderRadius})` }}
                                    >
                                        <img
                                            src={it.src}
                                            draggable={false}
                                            alt={it.alt}
                                            className="dg-tile-img w-full h-full object-contain pointer-events-none"
                                            style={{ filter: 'var(--image-filter)' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* viñeteado / blur premium */}
                    <div
                        className="absolute inset-0 m-auto z-[3] pointer-events-none"
                        style={{
                            backgroundImage: `radial-gradient(rgba(235,235,235,0) 65%, var(--overlay-blur-color, ${overlayBlurColor}) 100%)`
                        }}
                    />
                    <div
                        className="absolute inset-0 m-auto z-[3] pointer-events-none"
                        style={{
                            WebkitMaskImage: `radial-gradient(rgba(235,235,235,0) 70%, var(--overlay-blur-color, ${overlayBlurColor}) 90%)`,
                            maskImage: `radial-gradient(rgba(235,235,235,0) 70%, var(--overlay-blur-color, ${overlayBlurColor}) 90%)`,
                            backdropFilter: 'blur(3px)'
                        }}
                    />

                    {/* viewer */}
                    <div
                        ref={viewerRef}
                        className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
                        style={{ padding: 'var(--viewer-pad)' }}
                    >
                        <div
                            ref={scrimRef}
                            className="scrim absolute inset-0 z-10 pointer-events-none opacity-0 transition-opacity duration-500"
                            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
                        />
                        <div
                            ref={frameRef}
                            className="viewer-frame h-full aspect-square flex"
                            style={{ borderRadius: `var(--enlarge-radius, ${openedImageBorderRadius})` }}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
