// German dictionary. Spell/spec names deliberately stay English (data layer).
export default {
  'app.title': 'TBC Raid-Optimierer',
  'app.subtitle': 'Optimale Gruppenaufteilung per ILP — komplett clientseitig.',

  'roster.title': 'Kader',
  'roster.mode10': '10er',
  'roster.mode25': '25er',
  'roster.overCapacity':
    'Kader überschreitet die {capacity}er-Kapazität — entferne {excess} Spieler zum Optimieren.',

  'rh.placeholder': 'Raid-Helper Event-URL oder ID…',
  'rh.load': 'Laden',
  'rh.loading': 'Lädt…',
  'rh.menuImportRh': 'Raid-Helper-JSON importieren',
  'rh.menuImportTbcrco': 'TBCRCO-JSON importieren',
  'rh.moreOptions': 'Weitere Import-Optionen',
  'rh.invalidUrl': 'Keine gültige Raid-Helper-Event-URL oder -ID.',
  'rh.fetchFailed': 'Laden fehlgeschlagen ({error}) — füge das Event-JSON über das ⋮-Menü ein.',
  'rh.imported': '{count} Spieler importiert{title}.',
  'rh.skipped': 'Übersprungen: {list}.',
  'rh.noSignups': 'Keine importierbaren Anmeldungen in diesem Event gefunden.',
  'rh.invalidJson': 'Ungültiges JSON: {error}',
  'rh.importedTbcrco': '{count} Spieler aus TBCRCO-JSON importiert.',
  'rh.invalidTbcrco': 'Ungültiges TBCRCO-JSON: {error}',

  'add.namePlaceholder': 'Name (optional)',
  'add.button': 'Hinzufügen',
  'remove.title': 'Entfernen',

  'tools.options': 'Optionen',
  'tools.export': 'Exportieren',
  'tools.clear': 'Leeren',

  'optimize.button': 'Optimieren',
  'optimize.solving': 'Berechne…',
  'optimize.cancel': 'Abbrechen',

  'hint.empty': 'Füge Spieler zum Kader hinzu und klicke dann auf Optimieren.',
  'hint.ready': 'Berechne die optimale Zusammenstellung.',

  'progress.starting': 'Starte…',
  'progress.loading': 'Lade Solver (WASM)…',
  'progress.building': 'Erstelle Modell…',
  'progress.solving': 'Löse…',
  'progress.decoding': 'Werte Lösung aus…',
  'progress.recruits': 'Bewerte Verstärkungen ({done}/{total})…',

  'party.title': 'Gruppe {n}',
  'party.pts': 'Pkt.',
  'party.noBuffs': 'Keine Gruppen-Buffs aktiv',

  'score.title': 'Punkte',
  'score.pts': 'Pkt.',
  'score.split': 'Gruppenlokal: {party} · Raidweit: {raid}',
  'score.raidBuffs': 'Raidweite Buffs (unabhängig von der Aufteilung)',
  'score.potential': 'Ungenutztes Potenzial',
  'score.suggestion':
    '{buff} in Gruppe {party} erreicht nur {served} von {size} — ein passender Empfänger brächte {value} Pkt. mehr.',
  'score.recruits': 'Beste Verstärkung für {count} freie(n) Platz/Plätze',
  'score.gainDetail': '(Gruppe +{party}, Raid +{raid})',
  'score.recruitNote': 'Gewinn = optimale Raid-Punktzahl mit einem solchen Spieler vs. aktuell.',

  'modal.importRh': 'Raid-Helper-JSON importieren',
  'modal.importTbcrco': 'TBCRCO-JSON importieren',
  'modal.export': 'Kader exportieren',
  'modal.options': 'Optionen — Buff-Gewichte',
  'modal.rhHint': 'JSON von raid-helper.xyz/api/v4/events/<id> hier einfügen:',
  'modal.tbcrcoHint': 'TBCRCO-Kader-Export hier einfügen:',
  'modal.import': 'Importieren',
  'modal.shareLink': 'Teilen-Link',
  'modal.copy': 'Kopieren',
  'modal.copied': 'Kopiert!',
  'modal.tbcrcoJson': 'TBCRCO-JSON',
  'modal.download': 'TBCRCO.json herunterladen',

  'options.hint':
    'Punkte pro Empfänger mit vollem Gewicht. Relative Werte — nur die Verhältnisse zählen. Änderungen gelten ab dem nächsten Optimieren.',
  'options.party': 'Gruppen-Buffs (bestimmen die Aufteilung)',
  'options.raid': 'Raid-Buffs (fester Bonus)',
  'options.default': '(Standard {value})',
  'options.reset': 'Auf Standard zurücksetzen',

  'error.worker': 'Solver-Worker fehlgeschlagen',

  'role.melee': 'Meele',
  'role.caster': 'Caster',
  'role.ranged_phys': 'Hunter',
  'role.healer': 'Healer',
  'role.tank_paladin': 'Pala-Tank',
// Buff-Namen (offizieller deutscher Client) + Tooltips
  'buff.windfury_totem.name': 'Totem des Windzorns',
  'buff.grace_of_air.name': 'Totem der luftgleichen Anmut',
  'buff.totem_of_wrath.name': 'Totem des Ingrimms',
  'buff.moonkin_aura.name': 'Aura des Mondkin',
  'buff.leader_of_the_pack.name': 'Rudelführer',
  'buff.improved_sanctity.name': 'Verbesserte Aura der Heiligkeit',
  'buff.ferocious_insp.name': 'Wilde Eingebung',
  'buff.unleashed_rage.name': 'Entfesselte Wut',
  'buff.wrath_of_air.name': 'Totem des stürmischen Zorns',
  'buff.mana_spring.name': 'Totem der Manaquelle',
  'buff.strength_of_earth.name': 'Totem der Erdst\u00e4rke',
  'buff.battle_shout.name': 'Schlachtruf',
  'buff.misery.name': 'Elend',
  'buff.shadow_weaving.name': 'Schattenwirken',
  'buff.curse_of_elements.name': 'Fluch der Elemente',
  'buff.windfury_totem.tooltip':
    'Beschwört ein Totem des Windzorns mit 5 Gesundheit zu Füßen des Zaubernden. Das Totem verzaubert die Waffenhandwaffen aller Gruppenmitglieder mit Wind, wenn sie sich im Umkreis von 20 Metern aufhalten. Bei jedem Treffer besteht eine Chance von 20%, dass der Angreifer 1 zusätzlichen Angriff mit 445 zusätzlicher Angriffskraft erhält. Hält 1,5 Min. lang an.',
  'buff.grace_of_air.tooltip':
    'Beschwört ein Totem der luftgleichen Anmut mit 5 Gesundheit zu Füßen des Zaubernden. Das Totem erhöht die Beweglichkeit der Gruppenmitglieder in einem Umkreis von 20 Metern um 77. Hält 2 Min. lang an.',
  'buff.totem_of_wrath.tooltip':
    'Beschwört ein Totem des Ingrimms mit 5 Gesundheit zu Füßen des Zaubernden. Das Totem erhöht die Trefferchance und die kritische Trefferchance mit Zaubern für alle Gruppenmitglieder im Umkreis von 20 Metern um 3%. Hält 2 Min. lang an.',
  'buff.moonkin_aura.tooltip':
    'Die kritische Zaubertrefferchance aller Gruppenmitglieder im Umkreis von 30 Metern wird um 5% erhöht. Benötigt Mondkingestalt.',
  'buff.leader_of_the_pack.tooltip':
    'Während Ihr in Bären-, Terrorbären- oder Katzengestalt seid, wird bei allen Gruppenmitgliedern in einem Umkreis von 45 Metern die kritische Trefferchance für Nahkampf- und Distanzangriffe um 5% erhöht.',
  'buff.improved_sanctity.tooltip':
    'Aura der Heiligkeit: Erhöht den von Gruppenmitgliedern im Umkreis von 30 Metern verursachten Heiligschaden um 10%. Verbessert (Talent): Der von Zielen, die von \'Aura der Heiligkeit\' betroffen sind, verursachte Schaden wird um 2% erhöht.',
  'buff.ferocious_insp.tooltip':
    'Wilde Eingebung (Talent): Wenn Euer Tier einen kritischen Treffer erzielt, wird jeglicher Schaden aller Gruppenmitglieder 10 Sek. lang um 3% erhöht.',
  'buff.unleashed_rage.tooltip':
    'Entfesselte Wut (Talent): Durch Eure kritischen Treffer mit Nahkampfangriffen wird die Nahkampfangriffskraft von allen Gruppenmitgliedern im Umkreis von 20 Metern um den Schamanen um 10% erhöht. Hält 10 Sek. lang an.',
  'buff.wrath_of_air.tooltip':
    'Beschwört ein Totem des stürmischen Zorns mit 5 Gesundheit zu Füßen des Zaubernden. Bei Gruppenmitgliedern im Umkreis von 20 Metern um das Totem werden durch Zauber und Effekte verursachter Magieschaden und Heilung um 101 erhöht. Hält 2 Min. lang an.',
  'buff.mana_spring.tooltip':
    'Beschwört 2 Min. lang ein Totem der Manaquelle mit 5 Gesundheit zu Füßen des Zaubernden, das für Gruppenmitglieder in einem Umkreis von 20 Metern alle 2 Sek. 20 Mana wiederherstellt.',
  'buff.strength_of_earth.tooltip':
    'Beschwört ein Totem der Erdstärke mit 5 Gesundheit zu Füßen des Zaubernden. Das Totem erhöht die Stärke der Gruppenmitglieder in einem Umkreis von 20 Metern um 86. Hält 2 Min. lang an.',
  'buff.battle_shout.tooltip':
    'Der Krieger lässt einen wilden Schlachtruf ertönen, der bei allen Gruppenmitgliedern in einem Umkreis von 20 Metern die Nahkampfangriffskraft um 306 erhöht. Hält 2 Min. lang an.',
  'buff.misery.tooltip':
    'Elend (Talent): Eure Zauber \'Schattenwort: Schmerz\', \'Gedankenschinden\' und \'Vampirberührung\' erhöhen zusätzlich den erlittenen Zauberschaden des Ziels um 5%.',
  'buff.shadow_weaving.tooltip':
    'Schattenwirken (Talent): Gewährt Euren Schattenschadenszaubern eine Chance von 100%, das Ziel für Schattenschaden verwundbarer zu machen. Diese Verwundbarkeit erhöht den Schattenschaden, der Eurem Ziel zugefügt wird, um 2% und hält 15 Sek. lang an. Ergänzt sich bis zu 5-mal.',
  'buff.curse_of_elements.tooltip':
    'Verflucht das Ziel und verringert 5 Min. lang seinen Arkan-, Feuer-, Frost- und Schattenwiderstand um 88. Erhöht außerdem den erlittenen Arkan-, Feuer-, Frost- und Schattenschaden des Ziels um 10%. Es kann immer nur jeweils ein Fluch pro Hexenmeister auf einem beliebigen Ziel aktiv sein.',
};
