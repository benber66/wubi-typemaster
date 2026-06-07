import { useEffect, useRef, useState } from 'react';
import { Application, Graphics, Text, Container } from 'pixi.js';
import type { Invader } from '@/lib/game/word-invaders';

export interface PixiInvadersProps {
  width: number;
  height: number;
  invaders: ReadonlyArray<Invader>;
  typed: string;
  score: number;
  destroyed: number;
  onCanvasReady?: (app: Application) => void;
}

const BG_COLOR = 0x0b1220;
const TEXT_COLOR = 0xf8fafc;
const ACTIVE_COLOR = 0x3b82f6;
const HIT_COLOR = 0x10b981;

interface CachedSprite {
  container: Container;
  text: Text;
  bg: Graphics;
}

export function PixiInvaders({
  width,
  height,
  invaders,
  typed,
  score,
  destroyed,
  onCanvasReady,
}: PixiInvadersProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const cacheRef = useRef<Map<number, CachedSprite>>(new Map());
  const stageRef = useRef<Container | null>(null);
  const hudRef = useRef<Text | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const cache = cacheRef.current;
    const app = new Application();
    appRef.current = app;
    let destroyed = false;
    const destroyOnce = () => {
      if (destroyed) return;
      destroyed = true;
      app.destroy(true, { children: true });
    };
    void app
      .init({ width, height, background: BG_COLOR, antialias: true })
      .then(() => {
        if (!container.isConnected || destroyed) {
          destroyOnce();
          return;
        }
        container.appendChild(app.canvas);
        appRef.current = app;
        const stage = new Container();
        app.stage.addChild(stage);
        stageRef.current = stage;
        const hud = new Text({
          text: '',
          style: { fill: TEXT_COLOR, fontSize: 14, fontFamily: 'monospace' },
        });
        hud.x = 10;
        hud.y = 10;
        app.stage.addChild(hud);
        hudRef.current = hud;
        onCanvasReady?.(app);
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
        hudRef.current = null;
        cache.clear();
      }
    };
  }, [width, height, onCanvasReady]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const cache = cacheRef.current;
    const seenIds = new Set<number>();

    for (const inv of invaders) {
      seenIds.add(inv.id);
      let entry = cache.get(inv.id);
      if (!entry) {
        const bg = new Graphics();
        const text = new Text({
          text: inv.text,
          style: {
            fill: TEXT_COLOR,
            fontSize: inv.type === 'word' ? 22 : 28,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
          },
        });
        const container = new Container();
        container.addChild(bg);
        container.addChild(text);
        stage.addChild(container);
        entry = { container, text, bg };
        cache.set(inv.id, entry);
      }
      entry.text.text = inv.text;
      const w = Math.max(40, entry.text.width + 16);
      const h = Math.max(40, entry.text.height + 12);
      const typedMatch = typed && inv.code.startsWith(typed);
      const exactHit = typedMatch && inv.code === typed;
      const color = exactHit ? HIT_COLOR : typedMatch ? ACTIVE_COLOR : TEXT_COLOR;
      entry.text.style.fill = color;
      entry.bg.clear();
      entry.bg
        .roundRect(-w / 2, -h / 2, w, h, 6)
        .stroke({ width: 2, color: exactHit ? HIT_COLOR : typedMatch ? ACTIVE_COLOR : 0x475569 })
        .fill({ color: 0x1e293b, alpha: 0.9 });
      entry.container.x = inv.x;
      entry.container.y = inv.y;
    }

    for (const [id, entry] of cache) {
      if (!seenIds.has(id)) {
        entry.container.destroy({ children: true });
        cache.delete(id);
      }
    }
  }, [invaders, typed]);

  useEffect(() => {
    if (hudRef.current) {
      hudRef.current.text = `Score ${score}  Destroyed ${destroyed}`;
    }
  }, [score, destroyed]);

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
