import type { ActorKey } from "./assets";
import type { HordeKey } from "./horde-assets";

export interface HordeStat {
 sprite: ActorKey;
 radius: number;
 speed: [number, number];
 hp: number;
 score: number;
 height: number;
 color: string;
 damage: number;
 minWave: number;
 weight: number;
}

/** Tier 1 fodder -> tier 5 nightmares. Higher tiers unlock later and take over the mix. */
export const HORDE_TIER: Record<HordeKey, number> = {
  goblin: 1,
  zombie_villager_1: 1,
  monster_1: 1,
  monster_6: 1,
  orc: 2,
  zombie_villager_2: 2,
  monster_2: 2,
  skeleton_crusader_1: 2,
  monster_7: 2,
  reaper_man_1: 3,
  dark_oracle_1: 3,
  fallen_angels_1: 3,
  zombie_villager_3: 3,
  monster_3: 3,
  skeleton_crusader_2: 3,
  ogre: 4,
  monster_4: 4,
  monster_8: 4,
  reaper_man_2: 4,
  dark_oracle_2: 4,
  fallen_angels_2: 4,
  skeleton_crusader_3: 5,
  monster_5: 5,
  monster_9: 5,
  monster_10: 5,
  reaper_man_3: 5,
  dark_oracle_3: 5,
  fallen_angels_3: 5,
};

export const HORDE_NAME: Record<HordeKey, string> = {
  goblin: "Goblin",
  zombie_villager_1: "Rotted Villager",
  monster_1: "Slime Hound",
  monster_6: "Cave Crawler",
  orc: "Orc Brute",
  zombie_villager_2: "Plague Carrier",
  monster_2: "Marsh Fiend",
  skeleton_crusader_1: "Bone Squire",
  monster_7: "Spore Wisp",
  reaper_man_1: "Lesser Reaper",
  dark_oracle_1: "Oracle Acolyte",
  fallen_angels_1: "Fallen Cherub",
  zombie_villager_3: "Bloated Corpse",
  monster_3: "Ashen Maw",
  skeleton_crusader_2: "Bone Templar",
  ogre: "Ogre Warlord",
  monster_4: "Void Stalker",
  monster_8: "Gloom Drifter",
  reaper_man_2: "Soul Reaper",
  dark_oracle_2: "Dark Oracle",
  fallen_angels_2: "Fallen Seraph",
  skeleton_crusader_3: "Crusader Lord",
  monster_5: "Abyss Colossus",
  monster_9: "Nether Shrike",
  monster_10: "Doom Behemoth",
  reaper_man_3: "Death Incarnate",
  dark_oracle_3: "Oracle of Ruin",
  fallen_angels_3: "Archfiend",
};

export const HORDE_STATS: Record<HordeKey, HordeStat> = {
  goblin: { sprite: "goblin", radius: 17, speed: [119, 162], hp: 3, score: 12, height: 78, color: "#cfe3a8", damage: 8, minWave: 1, weight: 1.7 },
  zombie_villager_1: { sprite: "zombie_villager_1", radius: 17, speed: [63, 86], hp: 3, score: 12, height: 78, color: "#cfe3a8", damage: 8, minWave: 1, weight: 1.7 },
  monster_1: { sprite: "monster_1", radius: 17, speed: [88, 120], hp: 3, score: 12, height: 78, color: "#cfe3a8", damage: 8, minWave: 1, weight: 1.7 },
  monster_6: { sprite: "monster_6", radius: 17, speed: [119, 162], hp: 3, score: 12, height: 78, color: "#cfe3a8", damage: 8, minWave: 1, weight: 1.7 },
  orc: { sprite: "orc", radius: 20, speed: [84, 116], hp: 6, score: 26, height: 90, color: "#ffd166", damage: 11, minWave: 2, weight: 1.5 },
  zombie_villager_2: { sprite: "zombie_villager_2", radius: 20, speed: [60, 84], hp: 6, score: 26, height: 90, color: "#ffd166", damage: 11, minWave: 2, weight: 1.5 },
  monster_2: { sprite: "monster_2", radius: 20, speed: [84, 116], hp: 6, score: 26, height: 90, color: "#ffd166", damage: 11, minWave: 2, weight: 1.5 },
  skeleton_crusader_1: { sprite: "skeleton_crusader_1", radius: 20, speed: [113, 157], hp: 6, score: 26, height: 90, color: "#ffd166", damage: 11, minWave: 3, weight: 1.5 },
  monster_7: { sprite: "monster_7", radius: 20, speed: [113, 157], hp: 6, score: 26, height: 90, color: "#ffd166", damage: 11, minWave: 3, weight: 1.5 },
  reaper_man_1: { sprite: "reaper_man_1", radius: 23, speed: [80, 112], hp: 12, score: 55, height: 104, color: "#ff9f45", damage: 15, minWave: 4, weight: 1.3 },
  dark_oracle_1: { sprite: "dark_oracle_1", radius: 23, speed: [58, 81], hp: 12, score: 55, height: 104, color: "#ff9f45", damage: 15, minWave: 4, weight: 1.3 },
  fallen_angels_1: { sprite: "fallen_angels_1", radius: 23, speed: [108, 151], hp: 12, score: 55, height: 104, color: "#ff9f45", damage: 15, minWave: 4, weight: 1.3 },
  zombie_villager_3: { sprite: "zombie_villager_3", radius: 23, speed: [58, 81], hp: 12, score: 55, height: 104, color: "#ff9f45", damage: 15, minWave: 5, weight: 1.3 },
  monster_3: { sprite: "monster_3", radius: 23, speed: [80, 112], hp: 12, score: 55, height: 104, color: "#ff9f45", damage: 15, minWave: 5, weight: 1.3 },
  skeleton_crusader_2: { sprite: "skeleton_crusader_2", radius: 23, speed: [80, 112], hp: 12, score: 55, height: 104, color: "#ff9f45", damage: 15, minWave: 5, weight: 1.3 },
  ogre: { sprite: "ogre", radius: 27, speed: [53, 75], hp: 24, score: 110, height: 122, color: "#ff6b6b", damage: 20, minWave: 6, weight: 1.1 },
  monster_4: { sprite: "monster_4", radius: 27, speed: [100, 140], hp: 24, score: 110, height: 122, color: "#ff6b6b", damage: 20, minWave: 6, weight: 1.1 },
  monster_8: { sprite: "monster_8", radius: 27, speed: [74, 104], hp: 24, score: 110, height: 122, color: "#ff6b6b", damage: 20, minWave: 6, weight: 1.1 },
  reaper_man_2: { sprite: "reaper_man_2", radius: 27, speed: [100, 140], hp: 24, score: 110, height: 122, color: "#ff6b6b", damage: 20, minWave: 7, weight: 1.1 },
  dark_oracle_2: { sprite: "dark_oracle_2", radius: 27, speed: [74, 104], hp: 24, score: 110, height: 122, color: "#ff6b6b", damage: 20, minWave: 7, weight: 1.1 },
  fallen_angels_2: { sprite: "fallen_angels_2", radius: 27, speed: [100, 140], hp: 24, score: 110, height: 122, color: "#ff6b6b", damage: 20, minWave: 7, weight: 1.1 },
  skeleton_crusader_3: { sprite: "skeleton_crusader_3", radius: 34, speed: [64, 92], hp: 52, score: 230, height: 152, color: "#c05cff", damage: 27, minWave: 8, weight: 0.9 },
  monster_5: { sprite: "monster_5", radius: 34, speed: [46, 66], hp: 52, score: 230, height: 152, color: "#c05cff", damage: 27, minWave: 9, weight: 0.9 },
  monster_9: { sprite: "monster_9", radius: 34, speed: [86, 124], hp: 52, score: 230, height: 152, color: "#c05cff", damage: 27, minWave: 9, weight: 0.9 },
  monster_10: { sprite: "monster_10", radius: 34, speed: [46, 66], hp: 52, score: 230, height: 152, color: "#c05cff", damage: 27, minWave: 10, weight: 0.9 },
  reaper_man_3: { sprite: "reaper_man_3", radius: 34, speed: [86, 124], hp: 52, score: 230, height: 152, color: "#c05cff", damage: 27, minWave: 10, weight: 0.9 },
  dark_oracle_3: { sprite: "dark_oracle_3", radius: 34, speed: [64, 92], hp: 52, score: 230, height: 152, color: "#c05cff", damage: 27, minWave: 11, weight: 0.9 },
  fallen_angels_3: { sprite: "fallen_angels_3", radius: 34, speed: [86, 124], hp: 52, score: 230, height: 152, color: "#c05cff", damage: 27, minWave: 12, weight: 0.9 },
};

export const HORDE_KEYS = Object.keys(HORDE_STATS) as HordeKey[];

