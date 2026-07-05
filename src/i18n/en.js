// English (default / fallback) dictionary. Flat keys, {param} interpolation.
export default {
  'app.title': 'TBC Raid Composition Optimizer',
  'app.subtitle': 'Buff-optimal party layout via ILP — fully client-side.',

  'roster.title': 'Roster',
  'roster.mode10': '10-man',
  'roster.mode25': '25-man',
  'roster.overCapacity':
    'Roster exceeds {capacity}-man capacity — remove {excess} player(s) to optimize.',

  'rh.placeholder': 'Raid-Helper event URL or ID…',
  'rh.load': 'Load',
  'rh.loading': 'Loading…',
  'rh.menuImportRh': 'Import Raid-Helper JSON',
  'rh.menuImportTbcrco': 'Import TBCRCO JSON',
  'rh.moreOptions': 'More import options',
  'rh.invalidUrl': 'Not a Raid-Helper event URL or ID.',
  'rh.fetchFailed': 'Fetch failed ({error}) — paste the event JSON via the ⋮ menu instead.',
  'rh.imported': 'Imported {count} player(s){title}.',
  'rh.skipped': 'Skipped: {list}.',
  'rh.noSignups': 'No importable sign-ups found in this event.',
  'rh.invalidJson': 'Invalid JSON: {error}',
  'rh.importedTbcrco': 'Imported {count} player(s) from TBCRCO JSON.',
  'rh.invalidTbcrco': 'Invalid TBCRCO JSON: {error}',

  'add.namePlaceholder': 'Name (optional)',
  'add.button': 'Add',
  'remove.title': 'Remove',

  'tools.options': 'Options',
  'tools.export': 'Export',
  'tools.clear': 'Clear',

  'optimize.button': 'Optimize',
  'optimize.solving': 'Solving…',
  'optimize.cancel': 'Cancel',

  'hint.empty': 'Add players to the roster, then hit Optimize.',
  'hint.ready': 'Compute the buff-optimal layout for this roster.',

  'progress.starting': 'Starting…',
  'progress.loading': 'Loading solver (WASM)…',
  'progress.building': 'Building model…',
  'progress.solving': 'Solving…',
  'progress.decoding': 'Decoding solution…',
  'progress.recruits': 'Evaluating recruits ({done}/{total})…',

  'party.title': 'Party {n}',
  'party.pts': 'pts',
  'party.noBuffs': 'No party buffs active',

  'score.title': 'Score',
  'score.pts': 'pts',
  'score.split': 'Party-local: {party} · Raid-global: {raid}',
  'score.raidBuffs': 'Raid-wide buffs (grouping-independent)',
  'score.potential': 'Unfilled potential',
  'score.suggestion':
    '{buff} in Party {party} serves only {served} of {size} — a recipient swapped in here would add {value} pts.',
  'score.recruits': 'Best recruits for your {count} open slot(s)',
  'score.gainDetail': '(party +{party}, raid +{raid})',
  'score.recruitNote': 'Gain = optimal raid score with one such player added vs. current.',

  'modal.importRh': 'Import Raid-Helper JSON',
  'modal.importTbcrco': 'Import TBCRCO JSON',
  'modal.export': 'Export roster',
  'modal.options': 'Options — buff weights',
  'modal.rhHint': 'Paste the JSON from raid-helper.xyz/api/v4/events/<id>:',
  'modal.tbcrcoHint': 'Paste a TBCRCO roster export:',
  'modal.import': 'Import',
  'modal.shareLink': 'Share link',
  'modal.copy': 'Copy',
  'modal.copied': 'Copied!',
  'modal.tbcrcoJson': 'TBCRCO JSON',
  'modal.download': 'Download TBCRCO.json',

  'options.hint':
    'Points per full-weight recipient. Relative numbers — only ratios matter. Changes apply on the next Optimize.',
  'options.party': 'Party buffs (drive grouping)',
  'options.raid': 'Raid buffs (flat bonus)',
  'options.default': '(default {value})',
  'options.reset': 'Reset to defaults',

  'error.worker': 'Solver worker failed',

  'role.melee': 'melee',
  'role.caster': 'caster',
  'role.ranged_phys': 'ranged',
  'role.healer': 'healer',
  'role.tank_paladin': 'pala tank',
// Buff names + in-game tooltip texts (TBC max ranks)
  'buff.windfury_totem.name': 'Windfury Totem',
  'buff.grace_of_air.name': 'Grace of Air Totem',
  'buff.totem_of_wrath.name': 'Totem of Wrath',
  'buff.moonkin_aura.name': 'Moonkin Aura',
  'buff.leader_of_the_pack.name': 'Leader of the Pack',
  'buff.improved_sanctity.name': 'Improved Sanctity Aura',
  'buff.ferocious_insp.name': 'Ferocious Inspiration',
  'buff.unleashed_rage.name': 'Unleashed Rage',
  'buff.wrath_of_air.name': 'Wrath of Air Totem',
  'buff.mana_spring.name': 'Mana Spring Totem',
  'buff.strength_of_earth.name': 'Strength of Earth Totem',
  'buff.battle_shout.name': 'Battle Shout',
  'buff.misery.name': 'Misery',
  'buff.shadow_weaving.name': 'Shadow Weaving',
  'buff.curse_of_elements.name': 'Curse of the Elements',
  'buff.windfury_totem.tooltip':
    'Summons a Windfury Totem with 5 health at the feet of the caster. The totem enchants all party members\u2019 main-hand weapons with wind, if they are within 20 yards. Each hit has a 20% chance of granting the attacker 1 extra attack with 445 extra attack power. Lasts 1.5 min.',
  'buff.grace_of_air.tooltip':
    'Summons a Grace of Air Totem with 5 health at the feet of the caster. Party members within 20 yards of the totem have their Agility increased by 77. Lasts 2 min.',
  'buff.totem_of_wrath.tooltip':
    'Summons a Totem of Wrath with 5 health at the feet of the caster. The totem increases the spell critical strike chance and spell hit chance of all party members within 20 yards by 3%. Lasts 2 min.',
  'buff.moonkin_aura.tooltip':
    'While in Moonkin Form, the Moonkin increases the spell critical strike chance of all party members within 30 yards by 5%.',
  'buff.leader_of_the_pack.tooltip':
    'While in Cat, Bear or Dire Bear Form, the Leader of the Pack increases the ranged and melee critical strike chance of all party members within 45 yards by 5%.',
  'buff.improved_sanctity.tooltip':
    'Sanctity Aura: Increases Holy damage done by party members within 30 yards by 10%. Improved (talent): in addition, all party members within its radius have all damage caused increased by 2%.',
  'buff.ferocious_insp.tooltip':
    'Ferocious Inspiration (talent): When your pet scores a critical hit, all party members have all damage increased by 3% for 10 sec.',
  'buff.unleashed_rage.tooltip':
    'Unleashed Rage (talent): Causes your critical hits with melee attacks to increase all party members\u2019 attack power by 10% if within 20 yards of the Shaman. Lasts 10 sec.',
  'buff.wrath_of_air.tooltip':
    'Summons a Wrath of Air Totem with 5 health at the feet of the caster. Increases the spell damage and healing of party members within 20 yards by 101. Lasts 2 min.',
  'buff.mana_spring.tooltip':
    'Summons a Mana Spring Totem with 5 health at the feet of the caster. Restores 20 mana every 2 seconds to all party members within 20 yards. Lasts 2 min.',
  'buff.strength_of_earth.tooltip':
    'Summons a Strength of Earth Totem with 5 health at the feet of the caster. Increases the strength of party members within 20 yards by 86. Lasts 2 min.',
  'buff.battle_shout.tooltip':
    'The warrior shouts, increasing the melee attack power of all party members within 20 yards by 306. Lasts 2 min.',
  'buff.misery.tooltip':
    'Misery (talent): Your Shadow Word: Pain, Mind Flay and Vampiric Touch spells also cause the target to take an additional 5% spell damage.',
  'buff.shadow_weaving.tooltip':
    'Shadow Weaving (talent): Your Shadow damage spells cause your target to be vulnerable to Shadow damage, increasing Shadow damage dealt to the target by 2% for 15 sec. Stacks up to 5 times.',
  'buff.curse_of_elements.tooltip':
    'Curses the target for 5 min, reducing Arcane, Fire, Frost and Shadow resistances by 88 and increasing Arcane, Fire, Frost and Shadow damage taken by 10%. Only one Curse per Warlock can be active on any one target.',
};
