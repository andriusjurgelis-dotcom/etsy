'use strict';
/* ===== Static game data + translations ===== */
const MAXLV = 7;
const GEN_MAX = 3;
const COLS = 7, ROWS = 8;

const CHAINS = ['wood', 'flower', 'food', 'fish', 'crystal'];

const NAMES = {
  en: {
    chain: { wood: 'Timber', flower: 'Flowers', food: 'Treats', fish: 'Catch', crystal: 'Crystals' },
    wood: ['Twig', 'Log', 'Planks', 'Beams', 'Crate', 'Birdhouse', 'Cabin'],
    flower: ['Seeds', 'Sprout', 'Bud', 'Daisy', 'Tulips', 'Bouquet', 'Flower Basket'],
    food: ['Berry', 'Jam Jar', 'Muffin', 'Pie Slice', 'Berry Pie', 'Cake', 'Picnic Basket'],
    fish: ['Minnow', 'Perch', 'Trout', 'Salmon', 'Fish Dinner', 'Pearl Shell', 'Golden Fish'],
    crystal: ['Pebble', 'Quartz', 'Amethyst', 'Topaz', 'Sapphire', 'Ruby', 'Royal Crown'],
    gen: { wood: 'Old Stump', flower: 'Flower Bed', food: 'Berry Bush', fish: 'Fish Barrel', crystal: 'Mine Cart' },
    bn: { coin: 'Coins', gem: 'Gems', energy: 'Energy', chest: 'Treasure Chest' }
  },
  lt: {
    chain: { wood: 'Mediena', flower: 'Gėlės', food: 'Skanėstai', fish: 'Laimikis', crystal: 'Kristalai' },
    wood: ['Šakelė', 'Rąstas', 'Lentos', 'Sijos', 'Dėžė', 'Inkilas', 'Namelis'],
    flower: ['Sėklos', 'Daigas', 'Pumpuras', 'Ramunė', 'Tulpės', 'Puokštė', 'Gėlių krepšys'],
    food: ['Uoga', 'Uogienė', 'Keksiukas', 'Pyrago gabalas', 'Uogų pyragas', 'Tortas', 'Iškylos krepšys'],
    fish: ['Žuvelė', 'Ešerys', 'Upėtakis', 'Lašiša', 'Žuvies vakarienė', 'Perlų kriauklė', 'Auksinė žuvis'],
    crystal: ['Akmenukas', 'Kvarcas', 'Ametistas', 'Topazas', 'Safyras', 'Rubinas', 'Karališka karūna'],
    gen: { wood: 'Senas kelmas', flower: 'Gėlynas', food: 'Uogų krūmas', fish: 'Žuvų statinė', crystal: 'Kasyklos vagonėlis' },
    bn: { coin: 'Monetos', gem: 'Brangakmeniai', energy: 'Energija', chest: 'Lobių skrynia' }
  }
};

/* Resort buildings: cost in stars, perk description keys */
const BUILDS = [
  { id: 'cabin',      cost: 2,  perk: 'energy', val: 20 },
  { id: 'campfire',   cost: 4,  perk: 'regen',  val: 1 },
  { id: 'pier',       cost: 6,  perk: 'fish',   val: 1 },
  { id: 'garden',     cost: 9,  perk: 'flower', val: 1 },
  { id: 'diner',      cost: 12, perk: 'coins',  val: 25 },
  { id: 'boat',       cost: 16, perk: 'chest',  val: 1 },
  { id: 'spa',        cost: 20, perk: 'lucky',  val: 10 },
  { id: 'lighthouse', cost: 26, perk: 'slot',   val: 1 }
];

const GUEST_NAMES = ['Mia', 'Oskaras', 'Lina', 'Tomas', 'Greta', 'Jonas', 'Rūta', 'Matas', 'Ema', 'Lukas', 'Aistė', 'Dovydas'];

const DAILY = [
  { type: 'coins', n: 100 }, { type: 'energy', n: 25 }, { type: 'gems', n: 3 },
  { type: 'chest', n: 1 }, { type: 'coins', n: 300 }, { type: 'gems', n: 6 }, { type: 'bigchest', n: 1 }
];

const WHEEL = [
  { type: 'coins', n: 50, c: '#f6c744' }, { type: 'energy', n: 10, c: '#7ed957' },
  { type: 'gems', n: 2, c: '#58b8ff' }, { type: 'chest', n: 1, c: '#c98a4b' },
  { type: 'coins', n: 150, c: '#f39a3d' }, { type: 'energy', n: 25, c: '#4cc27a' },
  { type: 'gems', n: 5, c: '#7a8cff' }, { type: 'bigchest', n: 1, c: '#e2576b' }
];

const QUEST_DEFS = [
  { id: 'merge', goal: 25, reward: { gems: 2 } },
  { id: 'spawn', goal: 20, reward: { coins: 120 } },
  { id: 'order', goal: 3,  reward: { gems: 3 } }
];

const STR = {
  en: {
    title: 'Merge Lodge', sub: 'Lakeside Resort',
    tab_resort: 'Resort', tab_merge: 'Merge', tab_daily: 'Rewards', tab_shop: 'Shop',
    energy: 'Energy', level: 'Level', stars: 'Stars',
    deliver: 'Deliver', ready: 'Ready!', storage: 'Storage', sell: 'Sell',
    sort: 'Sort', wand: 'Wand', hint: 'Hint', sell_s: 'Sell', sort_s: 'Sort', wand_s: 'Wand',
    tap_to_spawn: 'Tap to produce items', max_level: 'Max level', merge_two: 'Drag two identical items together',
    sell_for: 'Sell for', no_energy: 'Out of energy!', board_full: 'Board is full!',
    not_enough_coins: 'Not enough coins', not_enough_gems: 'Not enough gems', not_enough_stars: 'Not enough stars',
    unlock: 'Unlock', unlock_q: 'Clear this area for', combo: 'Combo', lucky: 'Lucky!', mega: 'Mega merge!',
    levelup: 'Level up!', reward: 'Reward', claim: 'Claim', claimed: 'Claimed', collect: 'Collect', close: 'Close', ok: 'OK',
    daily_title: 'Daily Reward', day: 'Day', quests: 'Daily Quests', wheel: 'Lucky Wheel', spin: 'SPIN', free_spin: 'Free spin', spin_gems: 'Spin for 5 gems',
    q_merge: 'Merge items', q_spawn: 'Produce items', q_order: 'Complete orders',
    shop_title: 'Shop', buy: 'Buy', owned: 'Owned', refill: 'Full energy', refill_d: 'Refill energy to the max',
    energy25: '+25 energy', chest_s: 'Wooden chest', chest_s_d: '3 random items', chest_b: 'Golden chest', chest_b_d: '5 higher-tier items',
    slot: 'Storage slot', slot_d: 'Keep one more item safe', wandbuy: 'Magic Wand', wandbuy_d: 'Upgrades any item by one level',
    gen_buy: 'Generator', gen_d: 'Place a new level 1 producer on the board',
    resort_title: 'Lakeside Resort', build: 'Build', built: 'Built', perk: 'Perk', tap_spot: 'Tap a spot to rebuild the resort',
    perk_energy: '+{n} max energy', perk_regen: 'Faster energy regeneration', perk_fish: 'Unlocks the Fish Barrel producer',
    perk_flower: '15% chance of a bonus tier from Flower Bed', perk_coins: '+{n}% coins from orders', perk_chest: 'Free chest every 10 minutes',
    perk_lucky: '{n}% lucky merge chance', perk_slot: '+1 guest order slot',
    b_cabin: 'Log Cabin', b_campfire: 'Campfire', b_pier: 'Fishing Pier', b_garden: 'Flower Garden', b_diner: 'Lakeside Diner', b_boat: 'Rowing Boat', b_spa: 'Hot Tub Spa', b_lighthouse: 'Lighthouse',
    free_chest: 'Free chest ready!', settings: 'Settings', sound: 'Sound', music: 'Music', language: 'Language', reset: 'Reset progress', reset_q: 'Delete all progress and start over?',
    welcome: 'Welcome to Merge Lodge!', tut1: 'Tap the stump to produce items', tut2: 'Drag two identical items together to merge them', tut3: 'Merge until you can deliver the guest order!', tut4: 'Great! Spend stars in the Resort tab',
    order_says: 'I would love', all_built: 'The whole resort is restored! Amazing!', day_cycle: 'Change time of day',
    items_chest: 'Chest opened!', gen_up: 'Producer upgraded!', unlocked_new: 'New producer unlocked:', stored: 'Stored', slot_locked: 'Locked slot',
    wand_pick: 'Tap an item to upgrade it', wand_cancel: 'Cancelled', nothing_merge: 'No merges available — sort or sell items!',
    offline_energy: 'Energy restored while you were away', sorted: 'Board sorted', info_gen: 'Level {l} producer', tapcoin: 'Tap to collect',
    xp: 'XP', total_stars: 'Stars', claim_all: 'Collect all', yes: 'Yes', no: 'No',
    free_chests: 'Free chests', watch_ad: 'Watch ad', ad_energy: 'Watch Ad for +30 Energy', ad_chest: 'Watch Ad for a Golden Chest', ad_spin: 'Watch Ad for an extra spin',
    no_thanks: 'No thanks', ad_unavailable: 'No ad available right now. Try again later!', ad_limit: 'Daily limit reached',
    out_energy_t: 'Out of energy', out_energy_d: 'Energy refills over time. Get more now:', energy_gems: 'Refill with 10 gems',
    boat_chest: 'Boat chest', boat_ready: 'Ready to collect!', boat_in: 'Next chest in', boat_locked: 'Build the Rowing Boat to unlock',
    sitelock: 'Please play this game on CrazyGames.', skip: 'Skip', today: 'Today', claim_day: 'Claim day {n}', left: 'left',
    streak: 'Streak', no_space: 'Not enough free space on the board!', owned_n: 'Owned: {n}', sold: 'Sold', confirm_sell: 'Sell this rare item?',
    perk_unlocked: 'Perk unlocked', resort_pct: 'Resort restored', collected: 'Collected', add_energy: '+{n} energy'
  },
  lt: {
    title: 'Merge Lodge', sub: 'Poilsio namai prie ežero',
    tab_resort: 'Kurortas', tab_merge: 'Jungti', tab_daily: 'Prizai', tab_shop: 'Parduotuvė',
    energy: 'Energija', level: 'Lygis', stars: 'Žvaigždės',
    deliver: 'Atiduoti', ready: 'Paruošta!', storage: 'Sandėlis', sell: 'Parduoti',
    sort: 'Rūšiuoti', wand: 'Lazdelė', hint: 'Užuomina', sell_s: 'Parduok', sort_s: 'Rūšiuok', wand_s: 'Lazdelė',
    tap_to_spawn: 'Bakstelėk – gaminti daiktus', max_level: 'Aukščiausias lygis', merge_two: 'Vilk du vienodus daiktus vieną ant kito',
    sell_for: 'Parduoti už', no_energy: 'Baigėsi energija!', board_full: 'Lenta pilna!',
    not_enough_coins: 'Per mažai monetų', not_enough_gems: 'Per mažai brangakmenių', not_enough_stars: 'Per mažai žvaigždžių',
    unlock: 'Atrakinti', unlock_q: 'Išvalyti šią vietą už', combo: 'Kombo', lucky: 'Sėkmė!', mega: 'Mega sujungimas!',
    levelup: 'Naujas lygis!', reward: 'Prizas', claim: 'Pasiimti', claimed: 'Pasiimta', collect: 'Surinkti', close: 'Uždaryti', ok: 'Gerai',
    daily_title: 'Dienos prizas', day: 'Diena', quests: 'Dienos užduotys', wheel: 'Laimės ratas', spin: 'SUKTI', free_spin: 'Nemokamas sukimas', spin_gems: 'Sukti už 5 brangakmenius',
    q_merge: 'Sujunk daiktus', q_spawn: 'Pagamink daiktų', q_order: 'Įvykdyk užsakymus',
    shop_title: 'Parduotuvė', buy: 'Pirkti', owned: 'Turi', refill: 'Pilna energija', refill_d: 'Papildyti energiją iki maksimumo',
    energy25: '+25 energijos', chest_s: 'Medinė skrynia', chest_s_d: '3 atsitiktiniai daiktai', chest_b: 'Auksinė skrynia', chest_b_d: '5 aukštesnio lygio daiktai',
    slot: 'Sandėlio vieta', slot_d: 'Saugok dar vieną daiktą', wandbuy: 'Stebuklinga lazdelė', wandbuy_d: 'Pakelia bet kurį daiktą vienu lygiu',
    gen_buy: 'Gamintojas', gen_d: 'Padeda naują 1 lygio gamintoją ant lentos',
    resort_title: 'Poilsio namai prie ežero', build: 'Statyti', built: 'Pastatyta', perk: 'Privalumas', tap_spot: 'Bakstelėk vietą kurorto atstatymui',
    perk_energy: '+{n} maks. energijos', perk_regen: 'Greitesnis energijos atsistatymas', perk_fish: 'Atrakina Žuvų statinę',
    perk_flower: '15% šansas gauti aukštesnį lygį iš Gėlyno', perk_coins: '+{n}% monetų už užsakymus', perk_chest: 'Nemokama skrynia kas 10 minučių',
    perk_lucky: '{n}% sėkmingo sujungimo šansas', perk_slot: '+1 svečio užsakymo vieta',
    b_cabin: 'Rąstų namelis', b_campfire: 'Laužas', b_pier: 'Žvejybos prieplauka', b_garden: 'Gėlių sodas', b_diner: 'Valgykla prie ežero', b_boat: 'Irklinė valtis', b_spa: 'SPA kubilas', b_lighthouse: 'Švyturys',
    free_chest: 'Nemokama skrynia paruošta!', settings: 'Nustatymai', sound: 'Garsas', music: 'Muzika', language: 'Kalba', reset: 'Pradėti iš naujo', reset_q: 'Ištrinti visą progresą ir pradėti iš naujo?',
    welcome: 'Sveiki atvykę į Merge Lodge!', tut1: 'Bakstelėk kelmą – gaminti daiktus', tut2: 'Vilk du vienodus daiktus vieną ant kito – jie susijungs', tut3: 'Junk, kol galėsi įvykdyti svečio užsakymą!', tut4: 'Puiku! Išleisk žvaigždes kurorto skiltyje',
    order_says: 'Norėčiau', all_built: 'Visas kurortas atstatytas! Nuostabu!', day_cycle: 'Keisti paros laiką',
    items_chest: 'Skrynia atidaryta!', gen_up: 'Gamintojas patobulintas!', unlocked_new: 'Naujas gamintojas:', stored: 'Padėta', slot_locked: 'Užrakinta vieta',
    wand_pick: 'Bakstelėk daiktą, kad pakeltum lygį', wand_cancel: 'Atšaukta', nothing_merge: 'Nėra ką jungti – rūšiuok arba parduok daiktus!',
    offline_energy: 'Energija atsistatė, kol buvai išėjęs', sorted: 'Lenta išrūšiuota', info_gen: '{l} lygio gamintojas', tapcoin: 'Bakstelėk – surinkti',
    xp: 'Patirtis', total_stars: 'Žvaigždės', claim_all: 'Surinkti viską', yes: 'Taip', no: 'Ne',
    free_chests: 'Nemokamos skrynios', watch_ad: 'Žiūrėti reklamą', ad_energy: 'Žiūrėk reklamą: +30 energijos', ad_chest: 'Žiūrėk reklamą: auksinė skrynia', ad_spin: 'Žiūrėk reklamą: papildomas sukimas',
    no_thanks: 'Ne, ačiū', ad_unavailable: 'Šiuo metu reklamos nėra. Pabandyk vėliau!', ad_limit: 'Pasiektas dienos limitas',
    out_energy_t: 'Baigėsi energija', out_energy_d: 'Energija atsistato laikui bėgant. Gauk daugiau dabar:', energy_gems: 'Papildyti už 10 brangakmenių',
    boat_chest: 'Valties skrynia', boat_ready: 'Galima pasiimti!', boat_in: 'Kita skrynia po', boat_locked: 'Pastatyk valtį, kad atrakintum',
    sitelock: 'Žaisk šį žaidimą CrazyGames svetainėje.', skip: 'Praleisti', today: 'Šiandien', claim_day: 'Pasiimti {n} dieną', left: 'liko',
    streak: 'Serija', no_space: 'Lentoje nepakanka vietos!', owned_n: 'Turi: {n}', sold: 'Parduota', confirm_sell: 'Parduoti šį retą daiktą?',
    perk_unlocked: 'Privalumas atrakintas', resort_pct: 'Kurortas atstatytas', collected: 'Surinkta', add_energy: '+{n} energijos'
  }
};

let LANG = (navigator.language || 'en').toLowerCase().indexOf('lt') === 0 ? 'lt' : 'en';
function T(key, vars) {
  let s = (STR[LANG] && STR[LANG][key]) || STR.en[key] || key;
  if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
  return s;
}
function itemName(it) {
  const N = NAMES[LANG];
  if (it.k === 'it') return N[it.c][it.l - 1];
  if (it.k === 'gen') return N.gen[it.c];
  return N.bn[it.c];
}
