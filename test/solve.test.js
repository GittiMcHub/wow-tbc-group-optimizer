// Node smoke test for the ILP model: builds and solves rosters with glpk.js
// (same code path as the browser worker) and asserts optimizer behavior.

import GLPK from 'glpk.js';
import { buildModel } from '../src/model.js';
import { decodeAssignment } from '../src/decode.js';
import { SPECS } from '../src/specs.js';

let failures = 0;
function check(cond, msg) {
  if (cond) {
    console.log(`  ok  ${msg}`);
  } else {
    failures++;
    console.error(`FAIL  ${msg}`);
  }
}

function roster(...specIds) {
  return specIds.map((spec, i) => ({ id: `p${i}`, spec, name: `${spec}_${i}` }));
}

async function solve(glpk, players, partyCount) {
  const lp = buildModel(players, partyCount, glpk);
  // Same options as solver.worker.js.
  const res = await glpk.solve(lp, { msglev: glpk.GLP_MSG_ERR, tmlim: 4, mipgap: 0.002 });
  if (res.result.status !== glpk.GLP_OPT && res.result.status !== glpk.GLP_FEAS) {
    throw new Error(`status ${res.result.status}`);
  }
  return decodeAssignment(res.result.vars, players, partyCount);
}

function partyOf(result, specId) {
  return result.parties.findIndex((pd) => pd.members.some((pl) => pl.spec === specId));
}

const glpk = await GLPK();

// --- Test 1: 10-man — Windfury goes with melee, Totem of Wrath with casters.
{
  console.log('Test 1: 10-man melee/caster split');
  const players = roster(
    'enh_shaman', 'fury_warrior', 'rogue', 'ret_paladin', 'holy_paladin',
    'ele_shaman', 'fire_mage', 'destro_warlock', 'shadow_priest', 'resto_druid',
  );
  const r = await solve(glpk, players, 2);

  check(r.parties.every((pd) => pd.members.length === 5), 'both parties have 5 members');

  const enhParty = r.parties[partyOf(r, 'enh_shaman')];
  const meleeWithEnh = enhParty.members.filter(
    (pl) => SPECS[pl.spec].role === 'melee' && pl.spec !== 'enh_shaman',
  ).length;
  check(meleeWithEnh === 3, `all 3 other melee grouped with Enh shaman (got ${meleeWithEnh})`);

  const eleParty = r.parties[partyOf(r, 'ele_shaman')];
  const castersWithEle = eleParty.members.filter(
    (pl) => SPECS[pl.spec].role === 'caster' && pl.spec !== 'ele_shaman',
  ).length;
  check(castersWithEle === 3, `all 3 other casters grouped with Ele shaman (got ${castersWithEle})`);

  // Optimal score, computed by hand:
  // Enh party: WF 10×3(war,rogue,ret) + unleashed 4×4 + SoE 3×4 + sanctity 4×3 (ret) + wrath/mana no casters...
  // Cross-check against brute force instead of hand-arithmetic below (test 3).
  check(r.partyScore > 0, `party score positive (${r.partyScore})`);
  check(
    r.raidBuffs.some((b) => b.id === 'misery') && r.raidBuffs.some((b) => b.id === 'curse_of_elements'),
    'raid-global buffs (misery, CoE) counted in flat bonus',
  );
  // Battle Shout is PARTY-wide in TBC: shows in the warrior's party, never raid list.
  const enhParty2 = r.parties[partyOf(r, 'fury_warrior')];
  check(
    enhParty2.buffs.some((b) => b.id === 'battle_shout'),
    'Battle Shout active in the warrior party',
  );
  check(
    !r.raidBuffs.some((b) => b.id === 'battle_shout'),
    'Battle Shout NOT in the raid-global list',
  );
}

// --- Test 2: Hunters do NOT count as Windfury recipients.
{
  console.log('Test 2: Windfury ignores hunters');
  const players = roster(
    'enh_shaman', 'mm_hunter', 'mm_hunter', 'mm_hunter', 'mm_hunter',
    'fury_warrior', 'holy_priest', 'holy_priest', 'holy_priest', 'holy_priest',
  );
  const r = await solve(glpk, players, 2);
  const enhParty = r.parties[partyOf(r, 'enh_shaman')];
  check(
    enhParty.members.some((pl) => pl.spec === 'fury_warrior'),
    'lone warrior placed with Enh shaman (only real WF recipient)',
  );
  const wf = enhParty.buffs.find((b) => b.id === 'windfury_totem');
  check(wf && wf.servedCount === 2, `WF serves exactly 2 melee incl. shaman (got ${wf?.servedCount})`);
}

// --- Test 3: brute-force cross-check on a small roster — ILP result must
//     match the best score over all possible assignments.
{
  console.log('Test 3: brute-force optimality check (8 players, 2 parties)');
  const players = roster(
    'enh_shaman', 'rogue', 'ret_paladin', 'balance_druid',
    'fire_mage', 'shadow_priest', 'resto_shaman', 'bm_hunter',
  );
  const r = await solve(glpk, players, 2);

  const { analyzeAssignment } = await import('../src/decode.js');
  let best = -1;
  const n = players.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    const a = [];
    const b = [];
    for (let i = 0; i < n; i++) (mask & (1 << i) ? a : b).push(players[i]);
    if (a.length > 5 || b.length > 5) continue;
    const score = analyzeAssignment([a, b], players).partyScore;
    if (score > best) best = score;
  }
  check(
    r.partyScore === best,
    `ILP party score ${r.partyScore} === brute-force optimum ${best}`,
  );
}

// --- Test 4: under-full roster and degenerate cases don't crash.
{
  console.log('Test 4: edge cases');
  const r1 = await solve(glpk, roster('fury_warrior', 'rogue', 'holy_priest'), 5);
  check(
    r1.parties.reduce((s, pd) => s + pd.members.length, 0) === 3,
    'under-full 25-man roster: all 3 players assigned',
  );

  // No provider/recipient overlap → empty objective path
  const r2 = await solve(glpk, roster('holy_priest', 'holy_paladin'), 2);
  check(
    r2.parties.reduce((s, pd) => s + pd.members.length, 0) === 2,
    'roster with zero relevant party buffs still solves',
  );
}

// --- Test 4b: totem-element exclusivity + air twisting.
{
  console.log('Test 4b: totem twisting / element exclusivity');
  // One party: enh shaman + pure melee. Air totems: WF (10×4=40) and
  // GoA (5×4=20) twisted; WoA (0 casters) must NOT appear. SoE + Unleashed too.
  const players = roster('enh_shaman', 'fury_warrior', 'rogue', 'ret_paladin', 'feral_druid');
  const r = await solve(glpk, players, 1);
  const ids = r.parties[0].buffs.map((b) => b.id);
  check(ids.includes('windfury_totem'), 'Windfury active');
  check(ids.includes('grace_of_air'), 'Grace of Air twisted in (2nd air totem)');
  check(!ids.includes('wrath_of_air'), 'Wrath of Air NOT shown in melee party');
  const airCount = ids.filter((b) => ['windfury_totem', 'grace_of_air', 'wrath_of_air'].includes(b)).length;
  check(airCount <= 2, `≤ 2 air totems with one shaman (got ${airCount})`);

  // Two shamans (enh + resto) + casters and melee: 2 providers allow WF+GoA
  // AND WoA — but never more than 4 air totems... there are only 3 modeled;
  // check all three CAN coexist with 2 providers when all have recipients.
  const mixed = roster('enh_shaman', 'resto_shaman', 'fury_warrior', 'fire_mage', 'shadow_priest');
  const r2 = await solve(glpk, mixed, 1);
  const ids2 = r2.parties[0].buffs.map((b) => b.id);
  check(
    ids2.includes('windfury_totem') && ids2.includes('wrath_of_air'),
    'two shamans cover both WF and WoA in a mixed party',
  );

  // Only Windfury is twistable (9s lingering buff). A lone ele shaman in a
  // caster party with a hunter keeps Wrath of Air up — Grace of Air would
  // require dropping WoA, and GoA+WoA can't coexist from one shaman.
  const casterParty = roster('ele_shaman', 'mm_hunter', 'fire_mage', 'destro_warlock', 'shadow_priest');
  const r3 = await solve(glpk, casterParty, 1);
  const ids3 = r3.parties[0].buffs.map((b) => b.id);
  check(ids3.includes('wrath_of_air'), 'ele shaman keeps Wrath of Air for the casters');
  check(!ids3.includes('grace_of_air'), 'Grace of Air NOT shown alongside WoA (not twistable)');

  // Non-twisting shaman places ONE air totem, the best one. Resto shaman in
  // a healer party: WoA serves 4 healers (20 pts) and must beat WF+GoA which
  // only serve the lone warrior (15 pts). Only enhancement twists.
  const healerParty = roster('resto_shaman', 'holy_priest', 'holy_priest', 'disc_priest', 'arms_warrior');
  const r4 = await solve(glpk, healerParty, 1);
  const ids4 = r4.parties[0].buffs.map((b) => b.id);
  check(ids4.includes('wrath_of_air'), 'resto shaman places Wrath of Air for the healers');
  check(!ids4.includes('windfury_totem'), 'no Windfury — resto does not twist for one warrior');
  check(!ids4.includes('grace_of_air'), 'no Grace of Air either');
  const woa = r4.parties[0].buffs.find((b) => b.id === 'wrath_of_air');
  check(woa && woa.servedCount === 4 && woa.points === 20, `WoA serves 4 healers for 20 pts (got ${woa?.servedCount}/${woa?.points})`);
}

// --- Test 4c: prot paladin is a holy-damage tank — fractional melee-buff
//     weights mean a real melee wins the contested Windfury slot.
{
  console.log('Test 4c: prot paladin buff weighting');
  const players = roster(
    'enh_shaman', 'fury_warrior', 'fury_warrior', 'fury_warrior',
    'rogue', 'prot_paladin',
    'holy_priest', 'holy_priest', 'holy_priest', 'holy_priest',
  );
  const r = await solve(glpk, players, 2);
  const enhParty = r.parties[partyOf(r, 'enh_shaman')];
  check(
    enhParty.members.some((pl) => pl.spec === 'rogue'),
    'rogue takes the WF slot over prot paladin',
  );
  check(
    !enhParty.members.some((pl) => pl.spec === 'prot_paladin'),
    'prot paladin not in the WF party',
  );
  const wf = enhParty.buffs.find((b) => b.id === 'windfury_totem');
  check(wf && wf.points === 50, `WF party worth 10×5 melee (got ${wf?.points})`);
}

// --- Test 5: 24-man real-world roster (Raid-Helper import that used to hang
//     >60s with the per-player model) must solve fast and to optimality.
{
  console.log('Test 5: 24-man roster performance');
  const players = roster(
    'prot_warrior', 'prot_warrior', 'resto_shaman', 'resto_shaman',
    'bm_hunter', 'bm_hunter', 'bm_hunter', 'enh_shaman', 'prot_paladin',
    'holy_priest', 'holy_priest', 'balance_druid', 'balance_druid',
    'disc_priest', 'arcane_mage', 'arcane_mage', 'rogue',
    'ret_paladin', 'ret_paladin', 'ele_shaman', 'ele_shaman',
    'shadow_priest', 'arms_warrior', 'destro_warlock',
  );
  const t0 = Date.now();
  const r = await solve(glpk, players, 5);
  const ms = Date.now() - t0;
  check(ms < 5000, `solved in ${ms}ms (< 5s)`);
  check(
    r.parties.reduce((s, pd) => s + pd.members.length, 0) === 24,
    'all 24 players assigned',
  );
  check(r.parties.every((pd) => pd.members.length <= 5), 'no party exceeds 5');
  console.log(`  info: party score ${r.partyScore}, total ${r.totalScore}`);
}

// --- Test 6: recruit suggestions on the 24-man roster (1 open slot).
{
  console.log('Test 6: recruit suggestions');
  const { computeRecruits } = await import('../src/recruit.js');
  const players = roster(
    'prot_warrior', 'prot_warrior', 'resto_shaman', 'resto_shaman',
    'bm_hunter', 'bm_hunter', 'bm_hunter', 'enh_shaman', 'prot_paladin',
    'holy_priest', 'holy_priest', 'balance_druid', 'balance_druid',
    'disc_priest', 'arcane_mage', 'arcane_mage', 'rogue',
    'ret_paladin', 'ret_paladin', 'ele_shaman', 'ele_shaman',
    'shadow_priest', 'arms_warrior', 'destro_warlock',
  );
  const base = await solve(glpk, players, 5);
  const t0 = Date.now();
  const recruits = await computeRecruits(glpk, players, 5, base.partyScore);
  const ms = Date.now() - t0;
  console.log(`  info: ${recruits.length} specs ranked in ${ms}ms; top 5:`);
  for (const r of recruits.slice(0, 5)) {
    console.log(`    ${r.label}: +${r.totalGain} (party ${r.partyGain}, raid ${r.raidGain})`);
  }
  check(recruits.length === Object.keys(SPECS).length, 'every spec ranked');
  check(
    recruits.every((r, i) => i === 0 || recruits[i - 1].totalGain >= r.totalGain),
    'sorted by total gain desc',
  );
  check(ms < 15000, `computed in ${ms}ms (< 15s)`);

  // Independent verification of the top pick's party gain via a fresh solve.
  const top = recruits[0];
  const withTop = [...players, { id: 'v', spec: top.spec, name: 'v' }];
  const verify = await solve(glpk, withTop, 5);
  check(
    Math.abs(verify.partyScore - base.partyScore - top.partyGain) < 0.01,
    `top pick ${top.label} party gain ${top.partyGain} matches re-solve (${verify.partyScore - base.partyScore})`,
  );
}

console.log(failures === 0 ? '\nAll tests passed.' : `\n${failures} test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
