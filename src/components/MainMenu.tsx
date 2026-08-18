import { useMemo, useState } from "react";
import {
  Gift,
  Settings,
  Trophy,
  Store,
  Star,
  ClipboardList,
  CalendarDays,
  Crosshair,
  Skull,
  Swords,
  Gem,
  Coins,
  Zap,
  Package,
  Volume2,
  VolumeX,
  User,
  Sparkles,
  Boxes,
  X,
  Check,
  Lock,
} from "lucide-react";
import { PLAYER_CHARACTERS } from "@/game/assets";
import { HORDE_SRC } from "@/game/horde-assets";
import { HORDE_NAME, HORDE_TIER } from "@/game/horde-species";
import { CHARACTERS, WEAPONS } from "@/game/engine";
import { UPGRADES, RARITY_COLOR } from "@/game/upgrades";
import { isNewDay, levelFor, useProfile, xpInLevel, XP_PER_LEVEL } from "@/game/profile";
import type { CharacterKey } from "@/game/types";
import menuArt from "@/assets/echo-menu-art-v2.png.asset.json";


export type RunMode = "endless" | "boss" | "survival";

interface Props {
  character: CharacterKey;
  onSelect: (key: CharacterKey) => void;
  best: number;
  muted: boolean;
  onToggleMute: () => void;
  ready: boolean;
  onPlay: (mode: RunMode) => void;
  initialModal?: string | null;
  initialTab?: TabKey;
  onBack?: () => void;
  /** Render as a panel overlay on top of the artwork menu (no duplicate home hub). */
  overlay?: boolean;

}

const IDLE_FRAMES = 6;
const ENERGY_COST = 5;

const TABS = [
  { key: "character", label: "Character", icon: User },
  { key: "weapons", label: "Weapons", icon: Swords },
  { key: "upgrades", label: "Upgrades", icon: Sparkles },
  { key: "echoes", label: "Echoes", icon: Boxes },
  { key: "collection", label: "Collection", icon: Package },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const MODES: { key: RunMode; label: string; sub: string; icon: typeof Skull }[] = [
  { key: "endless", label: "Endless", sub: "How long can you survive?", icon: Skull },
  { key: "boss", label: "Boss Rush", sub: "Face the ultimate threat!", icon: Swords },
  { key: "survival", label: "Survival", sub: "Survive waves of enemies!", icon: Crosshair },
];

const DAILY = [
  { icon: Coins, v: 500, label: "500", kind: "coins" as const },
  { icon: Gem, v: 50, label: "50", kind: "gems" as const },
  { icon: Package, v: 1, label: "1", kind: "crate" as const },
  { icon: Zap, v: 100, label: "100", kind: "energy" as const },
  { icon: Gem, v: 100, label: "100", kind: "gems" as const },
];

const SHOP_ITEMS = [
  { id: "energy-refill", name: "Full Energy", desc: "Refill energy to 100", cost: 400, cur: "coins" as const },
  { id: "coin-pack", name: "Coin Pouch", desc: "+5,000 coins", cost: 50, cur: "gems" as const },
  { id: "gem-pack", name: "Gem Cache", desc: "+100 gems", cost: 8000, cur: "coins" as const },
  { id: "crate", name: "Echo Crate", desc: "+1,500 coins & 25 gems", cost: 30, cur: "gems" as const },
];

const EVENTS = [
  { id: "blood-moon", name: "Blood Moon", desc: "Elites spawn 2× more often. Double coins.", time: "Ends in 2d 4h" },
  { id: "horde-week", name: "Horde Week", desc: "Every enemy tier unlocked from wave 1.", time: "Ends in 5d" },
  { id: "reaper-hunt", name: "Reaper Hunt", desc: "Slay 250 reapers for a gem cache.", time: "Ends in 12h" },
];

function Sprite({
  src,
  frames,
  className,
  flip,
}: {
  src: string;
  frames: number;
  className?: string;
  flip?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: `${frames * 100}% 100%`,
        backgroundPosition: "0% 50%",
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        transform: flip ? "scaleX(-1)" : undefined,
      }}
    />
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="panel-chunk animate-float-up max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-widest text-gold">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="btn-chunk press grid h-9 w-9 place-items-center rounded-xl text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Chip({
  icon: Icon,
  value,
  tone,
  onPlus,
}: {
  icon: typeof Gem;
  value: string;
  tone: string;
  onPlus: () => void;
}) {
  return (
    <div className="panel-chunk flex items-center gap-2 rounded-xl px-3 py-1.5">
      <Icon className={`h-4 w-4 ${tone}`} />
      <span className="text-sm font-black tabular-nums text-foreground">{value}</span>
      <button
        type="button"
        aria-label="Get more"
        onClick={onPlus}
        className="btn-chunk press ml-1 grid h-5 w-5 place-items-center rounded-md text-xs font-black text-gold"
      >
        +
      </button>
    </div>
  );
}

function IconButton({
  icon: Icon,
  label,
  onClick,
  active,
  badge,
}: {
  icon: typeof Gift;
  label: string;
  onClick: () => void;
  active?: boolean;
  badge?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`btn-chunk press relative grid h-11 w-11 place-items-center rounded-xl ${
        active ? "text-gold" : "text-foreground/80 hover:text-foreground"
      }`}
    >
      <Icon className="h-5 w-5" />
      {badge && (
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-panel-border bg-destructive" />
      )}
    </button>
  );
}

export function MainMenu({
  character,
  onSelect,
  best,
  muted,
  onToggleMute,
  ready,
  onPlay,
  initialModal = null,
  initialTab = "character",
  onBack,
  overlay = false,

}: Props) {
  const { profile, patch, reset } = useProfile();
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [mode, setMode] = useState<RunMode>("endless");
  const [modal, setModal] = useState<string | null>(initialModal);
  const [toast, setToast] = useState<string | null>(null);

  const sel = CHARACTERS[character];
  const selWeapon = WEAPONS[sel.weapon];
  const level = levelFor(profile.xp);
  const dailyReady = isNewDay(profile.lastDailyAt);
  const giftReady = isNewDay(profile.lastGiftAt);

  const crowd = useMemo(() => {
    const keys = ["goblin", "monster_1", "zombie_villager_1", "orc", "monster_6", "monster_2"] as const;
    return keys.map((k) => HORDE_SRC[k][0]);
  }, []);

  const say = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  };

  const MISSIONS = useMemo(
    () => [
      { id: "m-play", name: "Start a run", goal: 1, have: best > 0 ? 1 : 0, reward: 250 },
      { id: "m-score-1k", name: "Score 1,000 in one run", goal: 1000, have: Math.min(best, 1000), reward: 600 },
      { id: "m-score-5k", name: "Score 5,000 in one run", goal: 5000, have: Math.min(best, 5000), reward: 1500 },
      { id: "m-level", name: "Reach account level 5", goal: 5, have: Math.min(level, 5), reward: 1000 },
    ],
    [best, level],
  );

  const ACHIEVEMENTS = useMemo(
    () => [
      { id: "a1", name: "First Blood", desc: "Finish your first run", done: best > 0 },
      { id: "a2", name: "Survivor", desc: "Score 2,500 points", done: best >= 2500 },
      { id: "a3", name: "Vanguard", desc: "Score 10,000 points", done: best >= 10000 },
      { id: "a4", name: "Collector", desc: "Reach account level 3", done: level >= 3 },
      { id: "a5", name: "Big Spender", desc: "Buy something in the shop", done: profile.owned.length > 0 },
    ],
    [best, level, profile.owned.length],
  );

  const buy = (item: (typeof SHOP_ITEMS)[number]) => {
    const bal = item.cur === "coins" ? profile.coins : profile.gems;
    if (bal < item.cost) {
      say("Not enough " + item.cur);
      return;
    }
    patch((p) => {
      const next = { ...p, owned: [...new Set([...p.owned, item.id])] };
      if (item.cur === "coins") next.coins -= item.cost;
      else next.gems -= item.cost;
      if (item.id === "energy-refill") next.energy = next.maxEnergy;
      if (item.id === "coin-pack") next.coins += 5000;
      if (item.id === "gem-pack") next.gems += 100;
      if (item.id === "crate") {
        next.coins += 1500;
        next.gems += 25;
      }
      return next;
    });
    say(`Purchased ${item.name}`);
  };

  const claimDaily = () => {
    if (!dailyReady) {
      say("Come back tomorrow");
      return;
    }
    const day = profile.dailyClaimed % DAILY.length;
    const r = DAILY[day]!;
    patch((p) => {
      const next = { ...p, dailyClaimed: p.dailyClaimed + 1, lastDailyAt: Date.now() };
      if (r.kind === "coins") next.coins += r.v;
      if (r.kind === "gems") next.gems += r.v;
      if (r.kind === "energy") next.energy = Math.min(next.maxEnergy, next.energy + r.v);
      if (r.kind === "crate") {
        next.coins += 1000;
        next.gems += 20;
      }
      return next;
    });
    say(`Day ${day + 1} reward claimed!`);
  };

  const claimMission = (m: { id: string; goal: number; have: number; reward: number }) => {
    if (m.have < m.goal || profile.claimedMissions.includes(m.id)) return;
    patch((p) => ({
      ...p,
      coins: p.coins + m.reward,
      xp: p.xp + 120,
      claimedMissions: [...p.claimedMissions, m.id],
    }));
    say(`+${m.reward} coins`);
  };

  const play = () => {
    if (!ready) return;
    if (profile.energy < ENERGY_COST) {
      say("Out of energy — refill in the shop");
      setModal("shop");
      return;
    }
    patch((p) => ({
      ...p,
      energy: p.energy - ENERGY_COST,
      xp: p.xp + 60,
      lastEnergyAt: p.lastEnergyAt || Date.now(),
    }));
    onPlay(mode);
  };

  const navItems = [
    { key: "shop", label: "Shop", icon: Store },
    { key: "pass", label: "Battle Pass", icon: Star },
    { key: "missions", label: "Missions", icon: ClipboardList },
    { key: "events", label: "Events", icon: CalendarDays },
    { key: "achievements", label: "Achievements", icon: Trophy },
  ];

  return (
    <main className={`relative min-h-screen w-full overflow-x-hidden px-3 py-4 sm:px-5 ${overlay ? "fixed inset-0 z-40 overflow-y-auto" : ""}`}>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${menuArt.url})` }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 backdrop-blur-xl"
        style={{ background: overlay ? "rgba(6,4,14,0.92)" : "rgba(6,4,14,0.88)" }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1400px] flex-col justify-center gap-4">

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="btn-chunk press w-fit rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest text-foreground"
          >
            ← Back to menu
          </button>
        )}


        {/* ------------------------------- top bar ------------------------------ */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[18rem_minmax(0,1fr)_auto]">
          <button
            type="button"
            onClick={() => setModal("profile")}
            className="panel-chunk press flex min-w-0 items-center gap-3 rounded-2xl p-2 pr-4 text-left"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-panel-border bg-panel-2">
              <Sprite
                src={PLAYER_CHARACTERS.find((c) => c.key === character)!.portrait}
                frames={IDLE_FRAMES}
                className="h-11 w-8"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black uppercase tracking-widest text-foreground">
                Echo Player
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet">
                Lv. {level}
              </p>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full border-2 border-panel-border bg-panel-2">
                <div
                  className="h-full bg-violet"
                  style={{ width: `${(xpInLevel(profile.xp) / XP_PER_LEVEL) * 100}%` }}
                />
              </div>
            </div>
          </button>

          <div className="order-last col-span-2 flex flex-wrap items-center justify-center gap-2 lg:order-none lg:col-span-1">
            <Chip
              icon={Gem}
              value={profile.gems.toLocaleString()}
              tone="text-violet"
              onPlus={() => setModal("shop")}
            />
            <Chip
              icon={Coins}
              value={profile.coins.toLocaleString()}
              tone="text-gold"
              onPlus={() => setModal("shop")}
            />
            <Chip
              icon={Zap}
              value={`${profile.energy} / ${profile.maxEnergy}`}
              tone="text-gold"
              onPlus={() => setModal("shop")}
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <IconButton icon={Gift} label="Free gift" onClick={() => setModal("gift")} badge={giftReady} />
            <IconButton
              icon={muted ? VolumeX : Volume2}
              label={muted ? "Unmute sound" : "Mute sound"}
              onClick={onToggleMute}
              active={!muted}
            />
            <IconButton icon={Settings} label="Settings" onClick={() => setModal("settings")} />
            <IconButton icon={Trophy} label="Leaderboard" onClick={() => setModal("leaderboard")} />
          </div>
        </header>

        <div className={`grid gap-4 lg:items-start ${overlay ? "" : "lg:grid-cols-[14rem_minmax(0,1fr)_18rem]"}`}>
          {/* ------------------------------ left rail --------------------------- */}
          {!overlay && (
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {navItems.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setModal(key)}
                className="btn-chunk press flex min-w-0 items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-panel-border bg-panel-2">
                  <Icon className="h-4 w-4 text-gold" />
                </span>
                <span className="truncate text-[11px] font-black uppercase tracking-wide text-foreground">
                  {label}
                </span>
              </button>
            ))}
          </nav>
          )}

          {/* -------------------------------- center ---------------------------- */}
          <section className="flex flex-col items-center gap-5">
            {!overlay && (
            <div className="animate-float-up text-center">
              <h1 className="text-outline text-5xl font-black leading-none tracking-tighter text-white sm:text-6xl">
                ECHO
              </h1>
              <p className="mt-2 inline-block rounded-md border-2 border-panel-border bg-panel px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-violet">
                Survive. Upgrade. Echo.
              </p>
            </div>
            )}


            <div className="panel-chunk flex min-h-[15rem] w-full items-center justify-center rounded-3xl p-4">
            {tab === "character" && (
              <div className="flex w-full items-end justify-center gap-1 sm:gap-3">

                {crowd.slice(0, 2).map((src, i) => (
                  <Sprite
                    key={`l${i}`}
                    src={src}
                    frames={IDLE_FRAMES}
                    className="hidden h-14 w-10 opacity-80 sm:block sm:h-16 sm:w-12"
                  />
                ))}
                {PLAYER_CHARACTERS.map((c) => {
                  const stat = CHARACTERS[c.key];
                  const active = character === c.key;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => onSelect(c.key)}
                      title={stat.name}
                      className={`group flex flex-col items-center rounded-2xl border-2 px-2 pb-1 pt-1 transition-all ${
                        active ? "panel-chunk" : "border-transparent hover:-translate-y-1"
                      }`}
                    >
                      <Sprite
                        src={c.portrait}
                        frames={IDLE_FRAMES}
                        className={
                          active
                            ? "h-24 w-16 sm:h-28 sm:w-20"
                            : "h-16 w-12 transition-transform group-hover:scale-110 sm:h-20 sm:w-14"
                        }
                      />
                      <span
                        className={`mt-1 text-[10px] font-black uppercase tracking-wider ${active ? "text-gold" : "text-foreground/70"}`}
                      >
                        {stat.name}
                      </span>
                    </button>
                  );
                })}
                {crowd.slice(2, 4).map((src, i) => (
                  <Sprite
                    key={`r${i}`}
                    src={src}
                    frames={IDLE_FRAMES}
                    className="hidden h-14 w-10 opacity-80 sm:block sm:h-16 sm:w-12"
                    flip
                  />
                ))}
              </div>
            )}

            {tab === "weapons" && (
              <div className="grid w-full max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.values(WEAPONS).map((w) => {
                  const owner = Object.entries(CHARACTERS).find(([, c]) => c.weapon === w.key);
                  return (
                    <button
                      key={w.key}
                      type="button"
                      onClick={() => owner && onSelect(owner[0] as CharacterKey)}
                      className={`panel-chunk press rounded-2xl p-3 text-left ${sel.weapon === w.key ? "ring-2 ring-gold" : ""}`}
                    >
                      <p className="text-xs font-black uppercase" style={{ color: w.color }}>
                        {w.name}
                      </p>
                      <p className="mt-1 text-[10px] text-foreground/70">
                        {w.damage} dmg · {Math.round(1 / w.rate)}/s · {w.pellets} shot
                        {w.pellets > 1 ? "s" : ""}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-gold">
                        {owner ? `Equip ${CHARACTERS[owner[0] as CharacterKey].name}` : ""}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {tab === "upgrades" && (
              <div className="grid max-h-64 w-full max-w-2xl grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                {UPGRADES.map((u) => (
                  <div key={u.id} className="panel-chunk rounded-2xl p-3">
                    <p
                      className="text-xs font-black uppercase"
                      style={{ color: RARITY_COLOR[u.rarity] }}
                    >
                      {u.icon} {u.name}
                    </p>
                    <p className="mt-1 text-[10px] text-foreground/70">{u.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === "echoes" && (
              <div className="panel-chunk w-full max-w-2xl rounded-2xl p-5 text-center">
                <Boxes className="mx-auto h-10 w-10 text-violet" />
                <p className="mt-2 text-sm font-black uppercase tracking-widest text-foreground">
                  Echoes
                </p>
                <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-foreground/70">
                  Every run you finish is recorded. On your next attempt those past runs return as
                  Echoes — ghost allies that repeat your old movement and fire alongside you. Longer
                  runs make stronger Echoes.
                </p>
                <p className="mt-3 text-xs font-black uppercase tracking-widest text-gold">
                  Best run {best > 0 ? best.toLocaleString() : "—"}
                </p>
              </div>
            )}

            {tab === "collection" && (
              <div className="grid max-h-64 w-full max-w-3xl grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5">
                {(Object.keys(HORDE_NAME) as (keyof typeof HORDE_NAME)[]).map((k) => (
                  <div key={k} className="panel-chunk rounded-xl p-2 text-center">
                    <Sprite src={HORDE_SRC[k][0]} frames={IDLE_FRAMES} className="mx-auto h-12 w-9" />
                    <p className="mt-1 truncate text-[9px] font-black uppercase text-foreground">
                      {HORDE_NAME[k]}
                    </p>
                    <p className="text-[9px] font-bold text-gold">Tier {HORDE_TIER[k]}</p>
                  </div>
                ))}
              </div>
            )}
            </div>


            <p className="text-center text-xs text-foreground/70">
              <span className="font-black uppercase tracking-widest text-foreground">{sel.name}</span>
              {" · "}
              <span className="font-bold" style={{ color: selWeapon.color }}>
                {selWeapon.name}
              </span>
              {" · "}
              {sel.hp} HP · {sel.speed} SPD · ×{sel.damage} DMG
            </p>

            {!overlay && (
            <div className="w-full max-w-md">
              <button
                type="button"
                disabled={!ready}
                onClick={play}
                className="btn-chunk-gold press flex w-full items-center justify-center gap-4 rounded-2xl px-6 py-4 disabled:opacity-60"
              >
                <Swords className="h-7 w-7 text-gold-foreground" />
                <span className="text-left">
                  <span className="block text-2xl font-black uppercase leading-none tracking-wide text-gold-foreground">
                    {ready ? "Play" : "Loading…"}
                  </span>
                  <span className="block text-[11px] font-bold uppercase tracking-[0.25em] text-gold-foreground/80">
                    {MODES.find((m) => m.key === mode)!.label} · {ENERGY_COST} energy
                  </span>
                </span>
              </button>

              <div className="mt-3 grid grid-cols-3 items-stretch gap-2">
                {MODES.map(({ key, label, sub, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMode(key)}
                    className={`btn-chunk press flex h-full flex-col items-center justify-start gap-1.5 rounded-2xl px-2 py-3 text-center ${mode === key ? "ring-2 ring-gold" : ""}`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${mode === key ? "text-gold" : "text-violet"}`} />
                    <p className="text-[11px] font-black uppercase leading-none tracking-wide text-foreground">
                      {label}
                    </p>
                    <p className="text-[10px] leading-tight text-foreground/65">{sub}</p>
                  </button>
                ))}
              </div>
            </div>
            )}


          </section>

          {/* ------------------------------ right rail -------------------------- */}
          {!overlay && (
          <aside className="flex shrink-0 flex-col gap-4 lg:w-72">
            <div className="panel-chunk rounded-2xl p-4">
              <p className="text-center text-sm font-black uppercase tracking-[0.2em] text-gold">
                Starter Pack
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Sprite src={PLAYER_CHARACTERS[0]!.portrait} frames={IDLE_FRAMES} className="h-14 w-10" />
                <span className="text-lg font-black text-foreground/60">+</span>
                <div className="flex flex-col items-center">
                  <Gem className="h-7 w-7 text-violet" />
                  <span className="text-xs font-black text-foreground">500</span>
                </div>
                <span className="text-lg font-black text-foreground/60">+</span>
                <Package className="h-8 w-8 text-gold" />
              </div>
              <button
                type="button"
                onClick={() => setModal("starter")}
                className="btn-chunk-gold press mt-3 w-full rounded-xl py-2 text-lg font-black text-gold-foreground"
              >
                $2.99
              </button>
            </div>

            <div className="panel-chunk rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black uppercase tracking-[0.15em] text-violet">
                  Daily Rewards
                </p>
                <span className="text-[11px] font-bold tabular-nums text-foreground/70">
                  {dailyReady ? "Ready" : "Tomorrow"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {DAILY.map(({ icon: Icon, label }, i) => {
                  const claimed = i < profile.dailyClaimed % (DAILY.length + 1);
                  const isNext = i === profile.dailyClaimed % DAILY.length;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={claimDaily}
                      className={`btn-chunk press rounded-xl p-2 text-center ${isNext && dailyReady ? "ring-2 ring-gold" : ""}`}
                    >
                      <Icon className={`mx-auto h-5 w-5 ${claimed ? "text-foreground/40" : "text-gold"}`} />
                      <p className="mt-1 text-[10px] font-black text-foreground">{label}</p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-1 grid grid-cols-5 gap-1.5 text-center text-[9px] font-bold uppercase tracking-wide text-foreground/60">
                {["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"].map((d, i) => (
                  <span key={d} className={i === profile.dailyClaimed % DAILY.length ? "text-gold" : undefined}>
                    {d}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={claimDaily}
                className={`press mt-3 w-full rounded-xl py-2 text-xs font-black uppercase tracking-widest ${
                  dailyReady ? "btn-chunk-gold text-gold-foreground" : "btn-chunk text-foreground/60"
                }`}
              >
                {dailyReady ? "Claim reward" : "Claimed today"}
              </button>
            </div>
          </aside>
          )}
        </div>

        {/* ------------------------------ bottom tabs --------------------------- */}
        <nav className="panel-chunk mx-auto flex w-full max-w-3xl items-stretch justify-between rounded-2xl px-2 py-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1 transition-colors ${
                tab === key ? "text-gold" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-wide">{label}</span>
              <span className={`h-0.5 w-8 rounded-full ${tab === key ? "bg-gold" : "bg-transparent"}`} />
            </button>
          ))}
        </nav>
      </div>

      {/* --------------------------------- modals ------------------------------ */}
      {modal === "shop" && (
        <Modal title="Shop" onClose={() => setModal(null)}>
          <div className="grid gap-2 sm:grid-cols-2">
            {SHOP_ITEMS.map((item) => (
              <div key={item.id} className="panel-chunk rounded-xl p-3">
                <p className="text-sm font-black uppercase text-foreground">{item.name}</p>
                <p className="mt-1 text-xs text-foreground/70">{item.desc}</p>
                <button
                  type="button"
                  onClick={() => buy(item)}
                  className="btn-chunk-gold press mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-black text-gold-foreground"
                >
                  {item.cur === "coins" ? <Coins className="h-4 w-4" /> : <Gem className="h-4 w-4" />}
                  {item.cost.toLocaleString()}
                </button>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {modal === "pass" && (
        <Modal title="Battle Pass" onClose={() => setModal(null)}>
          <p className="text-xs text-foreground/70">
            Level {level} · {xpInLevel(profile.xp)} / {XP_PER_LEVEL} XP. Play runs and finish
            missions to earn XP.
          </p>
          <div className="mt-3 grid gap-2">
            {[1, 3, 5, 8, 12].map((tier) => {
              const unlocked = level >= tier;
              const claimed = profile.claimedPass.includes(tier);
              return (
                <div key={tier} className="panel-chunk flex items-center gap-3 rounded-xl p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border-2 border-panel-border bg-panel-2 text-xs font-black text-gold">
                    {tier}
                  </span>
                  <span className="flex-1 text-xs font-bold uppercase tracking-wide text-foreground">
                    Tier {tier} · {tier * 250} coins
                  </span>
                  <button
                    type="button"
                    disabled={!unlocked || claimed}
                    onClick={() => {
                      patch((p) => ({
                        ...p,
                        coins: p.coins + tier * 250,
                        claimedPass: [...p.claimedPass, tier],
                      }));
                      say(`+${tier * 250} coins`);
                    }}
                    className={`press rounded-lg px-3 py-1.5 text-[11px] font-black uppercase ${
                      claimed
                        ? "btn-chunk text-foreground/50"
                        : unlocked
                          ? "btn-chunk-gold text-gold-foreground"
                          : "btn-chunk text-foreground/40"
                    }`}
                  >
                    {claimed ? <Check className="h-4 w-4" /> : unlocked ? "Claim" : <Lock className="h-4 w-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {modal === "missions" && (
        <Modal title="Missions" onClose={() => setModal(null)}>
          <div className="grid gap-2">
            {MISSIONS.map((m) => {
              const done = m.have >= m.goal;
              const claimed = profile.claimedMissions.includes(m.id);
              return (
                <div key={m.id} className="panel-chunk rounded-xl p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-wide text-foreground">
                      {m.name}
                    </p>
                    <button
                      type="button"
                      disabled={!done || claimed}
                      onClick={() => claimMission(m)}
                      className={`press rounded-lg px-3 py-1.5 text-[11px] font-black uppercase ${
                        claimed
                          ? "btn-chunk text-foreground/50"
                          : done
                            ? "btn-chunk-gold text-gold-foreground"
                            : "btn-chunk text-foreground/40"
                      }`}
                    >
                      {claimed ? "Claimed" : `+${m.reward}`}
                    </button>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full border-2 border-panel-border bg-panel-2">
                    <div className="h-full bg-violet" style={{ width: `${(m.have / m.goal) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-foreground/60">
                    {m.have.toLocaleString()} / {m.goal.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {modal === "events" && (
        <Modal title="Events" onClose={() => setModal(null)}>
          <div className="grid gap-2">
            {EVENTS.map((e) => (
              <div key={e.id} className="panel-chunk rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black uppercase text-foreground">{e.name}</p>
                  <span className="text-[10px] font-bold uppercase text-gold">{e.time}</span>
                </div>
                <p className="mt-1 text-xs text-foreground/70">{e.desc}</p>
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    play();
                  }}
                  className="btn-chunk-gold press mt-3 w-full rounded-lg py-2 text-xs font-black uppercase text-gold-foreground"
                >
                  Join run
                </button>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {modal === "achievements" && (
        <Modal title="Achievements" onClose={() => setModal(null)}>
          <div className="grid gap-2">
            {ACHIEVEMENTS.map((a) => (
              <div key={a.id} className="panel-chunk flex items-center gap-3 rounded-xl p-3">
                <span
                  className={`grid h-9 w-9 place-items-center rounded-lg border-2 border-panel-border ${a.done ? "bg-gold text-gold-foreground" : "bg-panel-2 text-foreground/40"}`}
                >
                  {a.done ? <Check className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-foreground">{a.name}</p>
                  <p className="text-[11px] text-foreground/70">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {modal === "gift" && (
        <Modal title="Free Gift" onClose={() => setModal(null)}>
          <p className="text-xs text-foreground/70">
            A free stash of coins and energy, once every day.
          </p>
          <button
            type="button"
            disabled={!giftReady}
            onClick={() => {
              patch((p) => ({
                ...p,
                coins: p.coins + 750,
                energy: Math.min(p.maxEnergy, p.energy + 25),
                lastGiftAt: Date.now(),
              }));
              say("+750 coins, +25 energy");
              setModal(null);
            }}
            className={`press mt-4 w-full rounded-xl py-3 text-sm font-black uppercase tracking-widest ${
              giftReady ? "btn-chunk-gold text-gold-foreground" : "btn-chunk text-foreground/50"
            }`}
          >
            {giftReady ? "Open gift" : "Already opened today"}
          </button>
        </Modal>
      )}

      {modal === "starter" && (
        <Modal title="Starter Pack" onClose={() => setModal(null)}>
          <p className="text-xs text-foreground/70">
            Demo store — no real payment. Grab the pack on the house.
          </p>
          <button
            type="button"
            disabled={profile.owned.includes("starter")}
            onClick={() => {
              patch((p) => ({
                ...p,
                gems: p.gems + 500,
                coins: p.coins + 2500,
                owned: [...p.owned, "starter"],
              }));
              say("Starter pack unlocked!");
              setModal(null);
            }}
            className={`press mt-4 w-full rounded-xl py-3 text-sm font-black uppercase tracking-widest ${
              profile.owned.includes("starter")
                ? "btn-chunk text-foreground/50"
                : "btn-chunk-gold text-gold-foreground"
            }`}
          >
            {profile.owned.includes("starter") ? "Owned" : "Claim pack"}
          </button>
        </Modal>
      )}

      {modal === "settings" && (
        <Modal title="Settings" onClose={() => setModal(null)}>
          <div className="grid gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              className="btn-chunk press flex items-center justify-between rounded-xl px-4 py-3 text-sm font-black uppercase text-foreground"
            >
              Sound
              <span className="text-gold">{muted ? "Off" : "On"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                say("Progress reset");
              }}
              className="btn-chunk press rounded-xl px-4 py-3 text-sm font-black uppercase text-destructive"
            >
              Reset progress
            </button>
          </div>
        </Modal>
      )}

      {modal === "leaderboard" && (
        <Modal title="Leaderboard" onClose={() => setModal(null)}>
          <div className="grid gap-2">
            {[
              { name: "VOIDWALKER", score: Math.max(best + 4200, 18400) },
              { name: "HEXBURN", score: Math.max(best + 1800, 12100) },
              { name: "You", score: best },
              { name: "GRIMSHADE", score: Math.max(0, Math.floor(best * 0.6)) },
            ]
              .sort((a, b) => b.score - a.score)
              .map((row, i) => (
                <div
                  key={row.name}
                  className={`panel-chunk flex items-center justify-between rounded-xl px-4 py-3 ${row.name === "You" ? "ring-2 ring-gold" : ""}`}
                >
                  <span className="text-xs font-black uppercase tracking-wide text-foreground">
                    #{i + 1} {row.name}
                  </span>
                  <span className="text-xs font-black tabular-nums text-gold">
                    {row.score.toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </Modal>
      )}

      {modal === "profile" && (
        <Modal title="Echo Player" onClose={() => setModal(null)}>
          <div className="grid gap-2 text-xs text-foreground/80">
            <p>Level {level}</p>
            <p>
              XP {xpInLevel(profile.xp)} / {XP_PER_LEVEL}
            </p>
            <p>Best run {best.toLocaleString()}</p>
            <p>Coins {profile.coins.toLocaleString()}</p>
            <p>Gems {profile.gems.toLocaleString()}</p>
            <p>
              Energy {profile.energy} / {profile.maxEnergy} (regenerates over time)
            </p>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="panel-chunk animate-float-up fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-widest text-gold">
          {toast}
        </div>
      )}
    </main>
  );
}
