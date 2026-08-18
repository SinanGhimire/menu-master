import menuArt from "@/assets/echo-menu-art-v2.png.asset.json";
import type { RunMode } from "@/components/MainMenu";

export type ArtTarget =
  | { kind: "play" }
  | { kind: "tab"; tab: "character" | "weapons" | "upgrades" | "echoes" | "collection" }
  | { kind: "modal"; modal: string };

interface Hotspot {
  id: string;
  label: string;
  /** percentages of the artwork box */
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: string;
  target: ArtTarget | { kind: "mode"; mode: RunMode };
}

const HOTSPOTS: Hotspot[] = [
  // left rail
  { id: "shop", label: "Shop", x: 2.2, y: 3.6, w: 7.3, h: 16.0, radius: "18%", target: { kind: "modal", modal: "shop" } },
  { id: "missions", label: "Missions", x: 2.2, y: 24.7, w: 7.3, h: 14.5, radius: "18%", target: { kind: "modal", modal: "missions" } },
  { id: "achievements", label: "Achievements", x: 2.2, y: 43.6, w: 7.3, h: 15.0, radius: "18%", target: { kind: "modal", modal: "achievements" } },

  // right rail
  { id: "daily", label: "Daily Rewards", x: 90.1, y: 3.3, w: 8.0, h: 18.0, radius: "18%", target: { kind: "modal", modal: "gift" } },
  { id: "starter", label: "Starter Pack", x: 90.1, y: 24.0, w: 8.0, h: 17.6, radius: "18%", target: { kind: "modal", modal: "starter" } },
  { id: "current", label: "Current Run", x: 90.1, y: 44.3, w: 8.0, h: 17.6, radius: "18%", target: { kind: "modal", modal: "leaderboard" } },

  // play
  { id: "play", label: "Play", x: 36.3, y: 79.7, w: 26.9, h: 14.7, radius: "9999px", target: { kind: "play" } },

  // bottom left tabs
  { id: "character", label: "Character", x: 1.8, y: 85.3, w: 8.7, h: 12.4, radius: "14%", target: { kind: "tab", tab: "character" } },
  { id: "weapons", label: "Weapons", x: 11.3, y: 85.3, w: 8.4, h: 12.4, radius: "14%", target: { kind: "tab", tab: "weapons" } },
  { id: "upgrades", label: "Upgrades", x: 20.7, y: 85.3, w: 8.4, h: 12.4, radius: "14%", target: { kind: "tab", tab: "upgrades" } },

  // bottom right tabs
  { id: "upgrades-2", label: "Upgrades", x: 71.6, y: 85.3, w: 8.0, h: 12.4, radius: "14%", target: { kind: "tab", tab: "upgrades" } },
  { id: "echoes", label: "Echoes", x: 81.0, y: 85.3, w: 7.6, h: 12.4, radius: "14%", target: { kind: "tab", tab: "echoes" } },
  { id: "collection", label: "Collection", x: 89.4, y: 85.3, w: 8.4, h: 12.4, radius: "14%", target: { kind: "tab", tab: "collection" } },
];


export function ArtMenu({
  mode,
  onMode,
  onOpen,
  onPlay,
  muted,
  onToggleMute,
  ready,
}: {
  mode: RunMode;
  onMode: (m: RunMode) => void;
  onOpen: (t: ArtTarget) => void;
  onPlay: () => void;
  muted: boolean;
  onToggleMute: () => void;
  ready: boolean;
}) {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0b0714] p-0 sm:p-3">
      <h1 className="sr-only">Echo — main menu</h1>

      {/* wrapper keeps the artwork's exact aspect ratio; hitboxes are % based */}
      <div
        className="relative w-full max-w-[1376px] select-none"
        style={{ aspectRatio: "1376 / 768" }}
      >
        <img
          src={menuArt.url}
          alt="Echo main menu artwork"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />

        {HOTSPOTS.map((h) => {
          const isMode = h.target.kind === "mode";
          const active = isMode && (h.target as { mode: RunMode }).mode === mode;
          return (
            <button
              key={h.id}
              type="button"
              aria-label={h.label}
              aria-pressed={isMode ? active : undefined}
              disabled={h.id === "play" && !ready}
              onClick={() => {
                if (h.target.kind === "mode") onMode((h.target as { mode: RunMode }).mode);
                else if (h.target.kind === "play") onPlay();
                else onOpen(h.target as ArtTarget);
              }}
              className="absolute cursor-pointer bg-transparent transition-transform duration-100 hover:scale-[1.04] hover:bg-white/10 active:scale-95 active:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300 disabled:cursor-wait"
              style={{
                left: `${h.x}%`,
                top: `${h.y}%`,
                width: `${h.w}%`,
                height: `${h.h}%`,
                borderRadius: h.radius ?? "12%",
                boxShadow: active ? "0 0 0 3px rgba(255,214,102,0.9) inset" : undefined,
              }}
            />
          );
        })}

        {/* mode chips: not drawn in this artwork, rendered just above PLAY */}
        <div className="absolute left-1/2 top-[71%] flex -translate-x-1/2 items-center gap-1.5 sm:gap-2">
          {([
            ["survival", "Survival"],
            ["endless", "Endless"],
            ["boss", "Boss Rush"],
          ] as [RunMode, string][]).map(([m, label]) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => onMode(m)}
              className={`rounded-full border-2 border-black/70 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:px-4 sm:py-1.5 sm:text-xs ${
                mode === m ? "bg-amber-500" : "bg-[#3c3560]/90"
              }`}
            >
              {label}
            </button>
          ))}
        </div>


        {/* settings + sound: not drawn in the artwork, so rendered as small chips */}
        <div className="absolute left-[12%] top-[3%] flex items-center gap-2">
          <button
            type="button"
            aria-label="Settings"
            onClick={() => onOpen({ kind: "modal", modal: "settings" })}
            className="grid h-9 w-9 place-items-center rounded-full border-2 border-black/70 bg-[#3c3560]/90 text-base text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:h-10 sm:w-10"
          >
            ⚙
          </button>
          <button
            type="button"
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            onClick={onToggleMute}
            className="grid h-9 w-9 place-items-center rounded-full border-2 border-black/70 bg-[#3c3560]/90 text-base text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:h-10 sm:w-10"
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>
    </main>
  );
}
