import { useEffect, useRef } from 'react';
import { Application, Graphics, Text, Container } from 'pixi.js';
import type { Bubble } from '@/lib/game/bubble';

const BG_COLOR = 0x0c1a2b;
const TEXT_COLOR = 0xf8fafc;
const ACTIVE_COLOR = 0x60a5fa;

interface CachedSprite {
  container: Container;
  text: Text;
  bg: Graphics;
}

export interface PixiBubblesProps {
  width: number;
  height: number;
  bubbles: ReadonlyArray<Bubble>;
  typed: string;
}

export function PixiBubbles({ width, height, bubbles, typed }: PixiBubblesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const stageRef = useRef<Container | null>(null);
  const cacheRef = useRef<Map<number, CachedSprite>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;
    const app = new Application();
    const cache = cacheRef.current;
    let cancelled = false;
    void app.init({ width, height, background: BG_COLOR, antialias: true }).then(() => {
      if (cancelled) {
        app.destroy(true, { children: true });
        return;
      }
      if (!containerRef.current) {
        app.destroy(true, { children: true });
        return;
      }
      containerRef.current.appendChild(app.canvas);
      appRef.current = app;
      const stage = new Container();
      app.stage.addChild(stage);
      stageRef.current = stage;
    });
    return () => {
      cancelled = true;
      if (appRef.current === app) {
        app.destroy(true, { children: true });
        appRef.current = null;
        stageRef.current = null;
        cache.clear();
      } else {
        app.destroy(true, { children: true });
      }
    };
  }, [width, height]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const cache = cacheRef.current;
    const seenIds = new Set<number>();

    for (const b of bubbles) {
      seenIds.add(b.id);
      let entry = cache.get(b.id);
      if (!entry) {
        const bg = new Graphics();
        const text = new Text({
          text: b.text,
          style: {
            fill: TEXT_COLOR,
            fontSize: 20,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
          },
        });
        const container = new Container();
        container.addChild(bg);
        container.addChild(text);
        stage.addChild(container);
        entry = { container, text, bg };
        cache.set(b.id, entry);
      }
      entry.text.text = b.text;
      const w = Math.max(48, entry.text.width + 24);
      const h = Math.max(36, entry.text.height + 14);
      const isActive = typed && b.code.startsWith(typed);
      const color = isActive ? ACTIVE_COLOR : TEXT_COLOR;
      entry.text.style.fill = color;
      entry.bg.clear();
      entry.bg
        .roundRect(-w / 2, -h / 2, w, h, w / 2)
        .stroke({ width: 2, color: isActive ? ACTIVE_COLOR : 0x334155 })
        .fill({ color: 0x1e3a5f, alpha: 0.85 });
      entry.container.x = b.x;
      entry.container.y = b.y;
    }

    for (const [id, entry] of cache) {
      if (!seenIds.has(id)) {
        entry.container.destroy({ children: true });
        cache.delete(id);
      }
    }
  }, [bubbles, typed]);

  return <div ref={containerRef} className="rounded-md border" style={{ width, height }} />;
}
