// Buff catalog. All WoW-specific tuning lives here and in specs.js —
// solver code never hardcodes a buff.
//
// scope: 'party' buffs only affect the 5 players in the same party and drive
//        the optimizer; 'raid' buffs are global, excluded from the ILP, and
//        only added as a flat constant to the displayed score.
// helps: map of recipient role → benefit multiplier (missing role = 0).
//        Roles: 'caster' | 'melee' | 'ranged_phys' | 'healer' | 'tank_paladin'.
//        Fractional weights express partial benefit — e.g. a prot paladin
//        gets a little from Windfury (white-hit threat) but his threat is
//        mostly holy damage, so Sanctity outweighs it for him.
// value: relative points per full-weight recipient (not sim data — tune).

// icon: Wowhead/in-game icon name — image bundled at src/assets/buffs/<id>.jpg
// element: totem element ('air' | 'earth' | 'water' | 'fire'). A shaman keeps
//   ONE continuous totem per element up. Windfury is special (`twistable`):
//   its 9s party buff persists after the totem is swapped, so a shaman can
//   pulse WF on top of ONE continuous air aura (GoA or WoA) — but GoA + WoA
//   can never coexist from a single shaman. Model constraint per party and
//   element: active non-twistable totems ≤ shamans in party; twistable ones
//   only need a provider present.
export const BUFFS = {
  windfury_totem:      { scope: 'party', helps: { melee: 1, tank_paladin: 0.3 },                          value: 10, label: 'Windfury Totem',        icon: 'spell_nature_windfury',               element: 'air',   twistable: true, note: '9s buff persists → twisted on top of a continuous air aura. All melee; NOT hunters. Prot pala: white-hit threat only' },
  grace_of_air:        { scope: 'party', helps: { melee: 1, ranged_phys: 1, tank_paladin: 0.4 },          value: 5,  label: 'Grace of Air Totem',    icon: 'spell_nature_invisibilitytotem',      element: 'air',   note: 'Agility — melee AND hunters; twisted with WF. Prot pala: avoidance' },
  totem_of_wrath:      { scope: 'party', helps: { caster: 1 },                                            value: 9,  label: 'Totem of Wrath',        icon: 'spell_fire_totemofwrath',             element: 'fire' },
  moonkin_aura:        { scope: 'party', helps: { caster: 1 },                                            value: 5,  label: 'Moonkin Aura',          icon: 'spell_nature_moonglow' },
  leader_of_the_pack:  { scope: 'party', helps: { melee: 1, ranged_phys: 1, tank_paladin: 0.4 },          value: 5,  label: 'Leader of the Pack',    icon: 'spell_nature_unyeildingstamina' },
  improved_sanctity:   { scope: 'party', helps: { melee: 1, ranged_phys: 1, caster: 1, tank_paladin: 1.5 }, value: 2, label: 'Improved Sanctity Aura', icon: 'spell_holy_mindvision',             note: '+2% ALL dmg (Imp. talent). Prot pala 1.5×: base +10% holy is his main threat' },
  ferocious_insp:      { scope: 'party', helps: { melee: 1, ranged_phys: 1, caster: 1, tank_paladin: 1 }, value: 3,  label: 'Ferocious Inspiration', icon: 'ability_hunter_ferociousinspiration', note: 'BM hunter, +3% dmg party — incl. holy threat' },
  unleashed_rage:      { scope: 'party', helps: { melee: 1, ranged_phys: 1, tank_paladin: 0.3 },          value: 4,  label: 'Unleashed Rage',        icon: 'spell_nature_unleashedrage',          note: 'Enh, +AP party' },
  wrath_of_air:        { scope: 'party', helps: { caster: 1, healer: 1 },                                 value: 5,  label: 'Wrath of Air Totem',    icon: 'spell_nature_slowingtotem',           element: 'air',   note: '+101 spell damage AND healing — helps healers too' },
  mana_spring:         { scope: 'party', helps: { caster: 1, healer: 1, tank_paladin: 0.5 },              value: 3,  label: 'Mana Spring Totem',     icon: 'spell_nature_manaregentotem',         element: 'water' },
  strength_of_earth:   { scope: 'party', helps: { melee: 1, ranged_phys: 1, tank_paladin: 0.5 },          value: 3,  label: 'Strength of Earth Totem', icon: 'spell_nature_earthbindtotem',       element: 'earth', note: 'Prot pala: strength → block value' },
  battle_shout:        { scope: 'party', helps: { melee: 1, ranged_phys: 1, tank_paladin: 0.3 },          value: 3,  label: 'Battle Shout',          icon: 'ability_warrior_battleshout',         note: 'Party-wide in TBC (raid-wide only from WotLK)' },

  // raid-global — included for scoring completeness but do not affect grouping
  misery:              { scope: 'raid',  helps: { caster: 1 },                                            value: 5,  label: 'Misery',                icon: 'spell_shadow_misery' },
  shadow_weaving:      { scope: 'raid',  helps: { caster: 1 },                                            value: 4,  label: 'Shadow Weaving',        icon: 'spell_shadow_blackplague' },
  curse_of_elements:   { scope: 'raid',  helps: { caster: 1 },                                            value: 4,  label: 'Curse of the Elements', icon: 'spell_shadow_chilltouch' },
};

export const PARTY_BUFF_IDS = Object.keys(BUFFS).filter((id) => BUFFS[id].scope === 'party');
export const RAID_BUFF_IDS = Object.keys(BUFFS).filter((id) => BUFFS[id].scope === 'raid');

// Default values snapshot — user-tuned weights are applied on top and can be
// reset back to these.
export const DEFAULT_VALUES = Object.fromEntries(
  Object.entries(BUFFS).map(([id, b]) => [id, b.value]),
);

// Apply user weight overrides ({ buffId: value }); missing ids reset to
// default. Called in the worker before every solve so it stays stateless.
export function applyBuffValues(overrides = {}) {
  for (const id of Object.keys(BUFFS)) {
    BUFFS[id].value = overrides[id] ?? DEFAULT_VALUES[id];
  }
}

// Benefit multiplier for a player with `role` from buff `buffId` (0 = none).
export function buffWeightForRole(buffId, role) {
  return BUFFS[buffId].helps[role] ?? 0;
}

// True if a player with `role` benefits from buff `buffId` at all.
export function buffHelpsRole(buffId, role) {
  return buffWeightForRole(buffId, role) > 0;
}

export const TOTEM_ELEMENTS = [
  ...new Set(PARTY_BUFF_IDS.map((b) => BUFFS[b].element).filter(Boolean)),
];
