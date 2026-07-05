// Class/spec definitions. Each spec declares which recipient category it
// belongs to (what it *wants*) and which party-buffs it *provides*.
// providesRaid lists raid-global buffs — used only for the flat score bonus,
// never for grouping.
//
// Gotchas encoded here (see README §8):
// - Ret is role 'melee' so Windfury counts for it.
// - Hunters are 'ranged_phys' — they do NOT benefit from Windfury.
// - Warrior/bear tanks are 'melee' (rage/threat scale with melee buffs).
// - Prot paladin is 'tank_paladin': threat is mostly HOLY damage, so melee
//   buffs only help fractionally (see weight maps in buffs.js) while
//   Sanctity Aura helps more than for anyone else.

// Baseline totems ANY shaman spec can drop (spec choice only adds extras like
// Totem of Wrath / Unleashed Rage). Which one is actually up per element is
// the solver's choice, constrained by totem-element exclusivity in model.js.
// Only specs with `twistsTotems: true` (enhancement) pulse Windfury on top of
// a continuous air aura — healers/casters don't burn GCDs twisting, they
// plant one air totem and leave it.
const SHAMAN_TOTEMS = [
  'windfury_totem',
  'grace_of_air',
  'wrath_of_air',
  'strength_of_earth',
  'mana_spring',
];

export const SPECS = {
  fury_warrior:   { role: 'melee',       provides: ['battle_shout'],                                                                providesRaid: [],                            label: 'Fury Warrior',        class: 'warrior' },
  arms_warrior:   { role: 'melee',       provides: ['battle_shout'],                                                                providesRaid: [],                            label: 'Arms Warrior',        class: 'warrior' },
  prot_warrior:   { role: 'melee',       provides: ['battle_shout'],                                                                providesRaid: [],                            label: 'Prot Warrior',        class: 'warrior' },
  ret_paladin:    { role: 'melee',       provides: ['improved_sanctity'],                                                           providesRaid: [],                            label: 'Ret Paladin',         class: 'paladin' },
  prot_paladin:   { role: 'tank_paladin', provides: [],                                                                             providesRaid: [],                            label: 'Prot Paladin',        class: 'paladin' },
  enh_shaman:     { role: 'melee',       provides: ['unleashed_rage', ...SHAMAN_TOTEMS],                                                     providesRaid: [],                    label: 'Enh Shaman',          class: 'shaman', twistsTotems: true },
  feral_druid:    { role: 'melee',       provides: ['leader_of_the_pack'],                                                          providesRaid: [],                            label: 'Feral Druid (Cat)',   class: 'druid' },
  feral_bear:     { role: 'melee',       provides: ['leader_of_the_pack'],                                                          providesRaid: [],                            label: 'Feral Druid (Bear)',  class: 'druid' },
  rogue:          { role: 'melee',       provides: [],                                                                              providesRaid: [],                            label: 'Rogue',               class: 'rogue' },

  bm_hunter:      { role: 'ranged_phys', provides: ['ferocious_insp'],                                                              providesRaid: [],                            label: 'BM Hunter',           class: 'hunter' },
  mm_hunter:      { role: 'ranged_phys', provides: [],                                                                              providesRaid: [],                            label: 'MM Hunter',           class: 'hunter' },
  surv_hunter:    { role: 'ranged_phys', provides: [],                                                                              providesRaid: [],                            label: 'Surv Hunter',     class: 'hunter' },

  fire_mage:      { role: 'caster',      provides: [],                                                                              providesRaid: [],                            label: 'Fire Mage',           class: 'mage' },
  frost_mage:     { role: 'caster',      provides: [],                                                                              providesRaid: [],                            label: 'Frost Mage',          class: 'mage' },
  arcane_mage:    { role: 'caster',      provides: [],                                                                              providesRaid: [],                            label: 'Arcane Mage',         class: 'mage' },
  affli_warlock:  { role: 'caster',      provides: [],                                                                              providesRaid: ['curse_of_elements'],         label: 'Affl Warlock',  class: 'warlock' },
  destro_warlock: { role: 'caster',      provides: [],                                                                              providesRaid: ['curse_of_elements'],         label: 'Destro Warlock', class: 'warlock' },
  demo_warlock:   { role: 'caster',      provides: [],                                                                              providesRaid: ['curse_of_elements'],         label: 'Demo Warlock',  class: 'warlock' },
  ele_shaman:     { role: 'caster',      provides: ['totem_of_wrath', ...SHAMAN_TOTEMS],                                            providesRaid: [],                            label: 'Ele Shaman',    class: 'shaman' },
  balance_druid:  { role: 'caster',      provides: ['moonkin_aura'],                                                                providesRaid: [],                            label: 'Balance Druid',       class: 'druid' },
  shadow_priest:  { role: 'caster',      provides: [],                                                                              providesRaid: ['misery', 'shadow_weaving'],  label: 'Shadow Priest',       class: 'priest' },

  resto_shaman:   { role: 'healer',      provides: [...SHAMAN_TOTEMS],                                                              providesRaid: [],                            label: 'Resto Shaman',        class: 'shaman' },
  resto_druid:    { role: 'healer',      provides: [],                                                                              providesRaid: [],                            label: 'Resto Druid',         class: 'druid' },
  holy_paladin:   { role: 'healer',      provides: [],                                                                              providesRaid: [],                            label: 'Holy Paladin',        class: 'paladin' },
  holy_priest:    { role: 'healer',      provides: [],                                                                              providesRaid: [],                            label: 'Holy Priest',         class: 'priest' },
  disc_priest:    { role: 'healer',      provides: [],                                                                              providesRaid: [],                            label: 'Disc Priest',         class: 'priest' },
};

export const SPEC_IDS = Object.keys(SPECS);
