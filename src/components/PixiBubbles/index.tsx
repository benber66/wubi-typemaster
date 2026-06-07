import { useEffect, useRef, useState } from 'react';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const cache = cacheRef.current;
    const app = new Application();
    appRef.current = app;
    let destroyed = false;
    let initDone = false;
    const destroyOnce = () => {
      if (destroyed) return;
      destroyed = true;
      if (initDone) {
        app.destroy(true, { children: true });
      }
    };
    void app
      .init({ width, height, background: BG_COLOR, antialias: true })
      .then(() => {
        initDone = true;
        if (!container.isConnected || destroyed) {
          if (destroyed) {
            app.destroy(true, { children: true });
          }
          return;
        }
        container.appendChild(app.canvas);
        appRef.current = app;
        const stage = new Container();
        app.stage.addChild(stage);
        stageRef.current = stage;
      })
      .catch((err: unknown) => {
        destroyOnce();
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Pixi 初始化失败: ${msg}`);
      });
    return () => {
      destroyOnce();
      if (appRef.current === app) {
        appRef.current = null;
        stageRef.current = null;
        cache.clear();
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

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-md border bg-muted/30"
        style={{ width, height }}
      >
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return <div ref={containerRef} className="rounded-md border" style={{ width, height }} />;
}
