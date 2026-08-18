import { createFileRoute } from "@tanstack/react-router";
import { MainMenu, type RunMode } from "@/components/MainMenu";
import { ArtMenu, type ArtTarget } from "@/components/ArtMenu";
import { useEffect, useRef, useState } from "react";
import { loadSprites, type Sprites } from "@/game/assets";
import { initAudio, loadMuted, playSfx, setMuted, type SfxName } from "@/game/audio";
import {
  WEAPONS,
  SPECIES_STATS,
  createState,
  render,
  update,
  WORLD_H,
  WORLD_W,
  type Input,
} from "@/game/engine";
import type { CharacterKey, GameState, WeaponKey } from "@/game/types";
import { RARITY_COLOR, UPGRADE_MAP } from "@/game/upgrades";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Echo Vanguards" },
      {
        name: "description",
        content:
          "Survive endless zombie waves. Your gun auto-tracks up close — hold fire to aim yourself for +35% damage. Past runs return as Echoes to fight beside you.",
      },
      { property: "og:title", content: "Echo Vanguards" },
      {
        property: "og:description",
        content:
          "Survive endless zombie waves. Your gun auto-tracks up close — hold fire to aim yourself for +35% damage. Past runs return as Echoes to fight beside you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});

interface Hud {
  hp: number;
  maxHp: number;
  score: number;
  wave: number;
  waveTimer: number;
  echoTimer: number;
  echoes: number;
  weapon: WeaponKey;
  over: boolean;
  level: number;
  xp: number;
  xpToNext: number;
  kills: number;
  enemies: number;
  time: number;
  perks: { id: string; n: number }[];
  paused: boolean;
}

const INITIAL_HUD: Hud = {
  hp: 100,
  maxHp: 100,
  score: 0,
  wave: 1,
  waveTimer: 28,
  echoTimer: 30,
  echoes: 0,
  weapon: "rifle",
  over: false,
  level: 1,
  xp: 0,
  xpToNext: 10,
  kills: 0,
  enemies: 0,
  time: 0,
  perks: [],
  paused: false,
};

function Stick({
  side,
  onChange,
  onEnd,
}: {
  side: "left" | "right";
  onChange: (dx: number, dy: number) => void;
  onEnd: () => void;
}) {
  const [knob, setKnob] = useState<{ x: number; y: number } | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const RADIUS = 56;

  return (
    <div
      className={`pointer-events-auto absolute bottom-4 ${side === "left" ? "left-4" : "right-4"} h-32 w-32 touch-none select-none rounded-full border border-border/70 bg-card/30 backdrop-blur`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        originRef.current = { x: e.clientX, y: e.clientY };
        setKnob({ x: 0, y: 0 });
      }}
      onPointerMove={(e) => {
        const o = originRef.current;
        if (!o) return;
        let dx = e.clientX - o.x;
        let dy = e.clientY - o.y;
        const d = Math.hypot(dx, dy);
        if (d > RADIUS) {
          dx = (dx / d) * RADIUS;
          dy = (dy / d) * RADIUS;
        }
        setKnob({ x: dx, y: dy });
        onChange(dx / RADIUS, dy / RADIUS);
      }}
      onPointerUp={() => {
        originRef.current = null;
        setKnob(null);
        onEnd();
      }}
      onPointerCancel={() => {
        originRef.current = null;
        setKnob(null);
        onEnd();
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full border border-primary/60 bg-primary/25"
        style={{
          transform: `translate(calc(-50% + ${knob?.x ?? 0}px), calc(-50% + ${knob?.y ?? 0}px))`,
        }}
      />
    </div>
  );
}

function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(createState());
  const spritesRef = useRef<Sprites | null>(null);
  const inputRef = useRef<Input>({
    keys: new Set<string>(),
    mouse: { x: WORLD_W / 2 + 120, y: WORLD_H / 2 },
    firing: false,
    moveX: 0,
    moveY: 0,
    aimX: 0,
    aimY: 0,
    autoAim: false,
  });
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<"art" | "menu" | "play">("art");
  const [mode, setMode] = useState<RunMode>("survival");
  const [menuModal, setMenuModal] = useState<string | null>(null);
  const [menuTab, setMenuTab] = useState<
    "character" | "weapons" | "upgrades" | "echoes" | "collection"
  >("character");
  const [character, setCharacter] = useState<CharacterKey>("spike");
  const [best, setBest] = useState(0);
  const [muted, setMutedState] = useState(false);
  const [touch, setTouch] = useState(false);
  const [hud, setHud] = useState<Hud>(INITIAL_HUD);
  const [restartKey, setRestartKey] = useState(0);

  useEffect(() => {
    setMutedState(loadMuted());
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    const stored = Number(window.localStorage.getItem("void-arena:best") ?? 0);
    if (Number.isFinite(stored)) setBest(stored);
  }, []);

  useEffect(() => {
    let mounted = true;
    loadSprites().then((s) => {
      if (!mounted) return;
      spritesRef.current = s;
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready || screen !== "play") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    stateRef.current = createState(character);
    const input = inputRef.current;
    input.firing = false;
    input.keys.clear();
    input.moveX = 0;
    input.moveY = 0;
    input.aimX = 0;
    input.aimY = 0;
    input.autoAim = touch;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(WORLD_W * dpr);
      canvas.height = Math.floor(WORLD_H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const toWorld = (clientX: number, clientY: number) => {
      const r = canvas.getBoundingClientRect();
      input.mouse.x = ((clientX - r.left) / r.width) * WORLD_W;
      input.mouse.y = ((clientY - r.top) / r.height) * WORLD_H;
    };

    const onMove = (e: PointerEvent) => toWorld(e.clientX, e.clientY);
    const onDown = (e: PointerEvent) => {
      toWorld(e.clientX, e.clientY);
      if (e.button === 0) input.firing = true;
    };
    const onUp = () => {
      input.firing = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d"].includes(k)) e.preventDefault();
      if (k === "escape" || k === "p") {
        const st = stateRef.current;
        if (!st.over) st.paused = !st.paused;
      }
      input.keys.add(k);
    };
    const onKeyUp = (e: KeyboardEvent) => input.keys.delete(e.key.toLowerCase());
    const onBlur = () => {
      input.keys.clear();
      input.firing = false;
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    let raf = 0;
    let last = performance.now();
    let hudAcc = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const s = stateRef.current;
      const sprites = spritesRef.current;
      const t0 = performance.now();
      update(s, input, dt);
      const t1 = performance.now();
      if (s.sfx.length) {
        for (const name of s.sfx) playSfx(name as SfxName);
        s.sfx.length = 0;
      }
      if (sprites) render(ctx, s, sprites, now / 1000);
      const t2 = performance.now();
      (window as unknown as Record<string, unknown>)["__perf"] = {
        u: t1 - t0,
        r: t2 - t1,
        e: s.enemies.length,
        b: s.bullets.length,
        p: s.particles.length,
      };

      hudAcc += dt;
      if (hudAcc > 0.1) {
        hudAcc = 0;
        setHud({
          hp: s.player.hp,
          maxHp: s.player.maxHp,
          score: s.score,
          wave: s.wave,
          waveTimer: Math.max(0, s.waveTimer),
          echoTimer: Math.max(0, s.echoTimer),
          echoes: s.echoes.length,
          weapon: s.player.weapon,
          over: s.over,
          level: s.level,
          xp: s.xp,
          xpToNext: s.xpToNext,
          kills: s.kills,
          enemies: s.enemies.filter((e) => !e.dying).length,
          time: s.time,
          perks: Object.entries(s.takenUpgrades).map(([id, n]) => ({ id, n })),
          paused: s.paused,
        });
        if (s.over) {
          setBest((b) => {
            const next = Math.max(b, s.score);
            window.localStorage.setItem("void-arena:best", String(next));
            return next;
          });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [ready, restartKey, screen, character, touch]);

  const hpPct = (hud.hp / hud.maxHp) * 100;
  const weapon = WEAPONS[hud.weapon];

  const startRun = () => {
    if (!ready) return;
    initAudio();
    playSfx("ui");
    setHud(INITIAL_HUD);
    setRestartKey((k) => k + 1);
    setScreen("play");
  };

  const toggleMute = () => {
    const next = !muted;
    initAudio();
    setMuted(next);
    setMutedState(next);
  };

  if (screen === "art") {
    return (
      <ArtMenu
        mode={mode}
        onMode={(m: RunMode) => {
          playSfx("ui");
          setMode(m);
        }}
        onPlay={startRun}
        onOpen={(t: ArtTarget) => {
          playSfx("ui");
          if (t.kind === "tab") {
            setMenuTab(t.tab);
            setMenuModal(null);
          } else if (t.kind === "modal") {
            setMenuModal(t.modal);
          }
          setScreen("menu");
        }}
        muted={muted}
        onToggleMute={toggleMute}
        ready={ready}
      />
    );
  }

  if (screen === "menu") {
    return (
      <MainMenu
        key={`${menuTab}-${menuModal ?? ""}`}
        character={character}
        onSelect={(k) => {
          playSfx("ui");
          setCharacter(k);
        }}
        best={best}
        muted={muted}
        onToggleMute={toggleMute}
        ready={ready}
        onPlay={startRun}
        initialTab={menuTab}
        initialModal={menuModal}
        onBack={() => {
          playSfx("ui");
          setScreen("art");
        }}
      />
    );
  }





  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-void p-2 sm:p-4">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />

      <h1 className="sr-only">Void Arena — 2D top-down arena shooter</h1>

      <div
        className="relative w-full max-w-[1280px]"
        style={{ aspectRatio: `${WORLD_W} / ${WORLD_H}` }}
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full rounded-xl border border-border shadow-2xl"
          style={{ cursor: "default", imageRendering: "pixelated", touchAction: "none" }}
          aria-label="Game arena"
        />

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="w-44 rounded-2xl border border-border/70 bg-card/50 p-3 shadow-soft backdrop-blur-md sm:w-64">
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">
                  Vitals
                </span>
                <span className="text-[11px] font-black tabular-nums text-foreground">
                  {Math.ceil(hud.hp)}
                  <span className="text-muted-foreground">/{hud.maxHp}</span>
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-background/60 ring-1 ring-inset ring-border/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-destructive to-amber transition-[width] duration-150"
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-background/60 ring-1 ring-inset ring-border/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-150"
                  style={{ width: `${Math.min(100, (hud.xp / hud.xpToNext) * 100)}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Lvl {hud.level}
                </span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: weapon.color }}>
                  {weapon.name}
                </span>
              </div>
              {hud.perks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 border-t border-border/60 pt-2">
                  {hud.perks.map(({ id, n }) => {
                    const u = UPGRADE_MAP[id];
                    if (!u) return null;
                    const col = RARITY_COLOR[u.rarity];
                    return (
                      <span
                        key={id}
                        title={`${u.name} — ${u.desc}`}
                        className="flex items-center gap-1 rounded-md border bg-background/40 px-1.5 py-0.5 text-[10px] font-bold leading-none"
                        style={{ borderColor: col, color: col }}
                      >
                        {u.icon}
                        {n > 1 && <span className="opacity-80">×{n}</span>}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/50 px-5 py-2.5 text-center shadow-soft backdrop-blur-md">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                Wave {hud.wave}
              </p>
              <p className="text-3xl font-black leading-none tabular-nums text-foreground text-glow">
                {Math.ceil(hud.waveTimer)}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] tabular-nums text-muted-foreground">
                {hud.enemies} enemies
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] tabular-nums text-foreground/70">
                Echo in {String(Math.ceil(hud.echoTimer)).padStart(2, "0")}
                {hud.echoes > 0 && <span className="ml-1.5 text-muted-foreground">×{hud.echoes}</span>}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="rounded-2xl border border-border/70 bg-card/50 px-4 py-2 text-right shadow-soft backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                  Score
                </p>
                <p className="text-2xl font-black leading-none tabular-nums text-foreground">
                  {hud.score}
                </p>
              </div>
              <div className="pointer-events-auto flex justify-end gap-1.5">
                <button
                  onClick={() => {
                    const next = !muted;
                    initAudio();
                    setMuted(next);
                    setMutedState(next);
                  }}
                  aria-label={muted ? "Unmute sound" : "Mute sound"}
                  className="rounded-lg border border-border/70 bg-card/50 px-2.5 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md transition-colors hover:bg-accent"
                >
                  {muted ? "🔇" : "🔊"}
                </button>
                <button
                  onClick={() => {
                    const st = stateRef.current;
                    if (!st.over) st.paused = !st.paused;
                  }}
                  aria-label="Pause game"
                  className="rounded-lg border border-border/70 bg-card/50 px-2.5 py-1.5 text-xs font-semibold text-foreground backdrop-blur-md transition-colors hover:bg-accent"
                >
                  ⏸
                </button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {touch
              ? "Left stick moves · Auto-fire covers close range · Right stick = focus fire, +35% damage"
              : "WASD move · Auto-fire covers close range · Hold left click = focus fire, +35% damage · Esc to pause"}
          </p>
        </div>

        {touch && !hud.over && (
          <>
            <Stick
              side="left"
              onChange={(dx, dy) => {
                const inp = inputRef.current;
                inp.moveX = dx;
                inp.moveY = dy;
              }}
              onEnd={() => {
                const inp = inputRef.current;
                inp.moveX = 0;
                inp.moveY = 0;
              }}
            />
            <Stick
              side="right"
              onChange={(dx, dy) => {
                const inp = inputRef.current;
                inp.aimX = dx;
                inp.aimY = dy;
              }}
              onEnd={() => {
                const inp = inputRef.current;
                inp.aimX = 0;
                inp.aimY = 0;
              }}
            />
          </>
        )}

        {hud.paused && !hud.over && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80 p-4 backdrop-blur-xl">
            <div className="animate-float-up w-full max-w-sm rounded-2xl border border-border bg-card/60 p-6 text-center shadow-soft">
              <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary">
                Standby
              </p>
              <h2 className="mt-1 text-4xl font-black uppercase tracking-tight text-foreground text-glow">
                Paused
              </h2>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  { k: "Wave", v: hud.wave },
                  { k: "Level", v: hud.level },
                  { k: "Kills", v: hud.kills },
                ].map((st) => (
                  <div key={st.k} className="rounded-xl border border-border bg-background/40 py-2">
                    <p className="text-lg font-black tabular-nums text-foreground">{st.v}</p>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {st.k}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-muted-foreground">Press Esc or P to resume</p>
            </div>
          </div>
        )}

        {hud.over && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/85 p-4 backdrop-blur-xl">
            <div className="animate-float-up w-full max-w-md rounded-2xl border border-destructive/40 bg-card/60 p-6 text-center shadow-soft">
              <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-destructive">
                Signal lost
              </p>
              <h2 className="mt-1 text-4xl font-black uppercase tracking-tight text-foreground">
                You died
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { k: "Score", v: hud.score },
                  { k: "Wave", v: hud.wave },
                  { k: "Kills", v: hud.kills },
                  { k: "Time", v: `${Math.floor(hud.time)}s` },
                ].map((st) => (
                  <div key={st.k} className="rounded-xl border border-border bg-background/40 py-2">
                    <p className="text-lg font-black tabular-nums text-foreground">{st.v}</p>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {st.k}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                Best <span className="text-amber">{Math.max(best, hud.score)}</span>
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  onClick={() => setRestartKey((k) => k + 1)}
                  className="rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-primary-foreground transition-transform hover:scale-[1.03]"
                >
                  Play again
                </button>
                <button
                  onClick={() => setScreen("art")}
                  className="rounded-xl border border-border px-6 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-accent"
                >
                  Main menu
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
