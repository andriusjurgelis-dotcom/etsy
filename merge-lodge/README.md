# Merge Lodge – Lakeside Resort (HTML5, CrazyGames-ready)

Originalus „merge“ žaidimas: junk daiktus, vykdyk svečių užsakymus, rink žvaigždes ir atstatyk ežero kurortą.
Viskas nupiešta proceduriškai (Canvas), garsai sintezuojami (WebAudio) – **nėra jokių paveikslėlių ar garso failų**.
Visas žaidimas ~230 KB, 11 failų, jokių priklausomybių ir jokio build žingsnio.

## Paleidimas
Tiesiog atidaryk `index.html` (arba `python3 -m http.server` šiame aplanke → `http://localhost:8000`).
Naudingi parametrai:

| URL parametras | Ką daro |
|---|---|
| `?mockads=1` | Imituoja reklamas (rewarded / midgame), kad galėtum išbandyti srautus be CrazyGames SDK |
| `?useLocalSdk=true` | Leidžia paleisti ne CrazyGames domene su SDK |

## Žaidimo funkcijos
- **Merge lenta 7×8**, 5 grandinės po 7 lygius: Mediena, Gėlės, Skanėstai, Laimikis (žuvys), Kristalai
- **Gamintojai** (kelmas, gėlynas, uogų krūmas, žuvų statinė, vagonėlis) – jungiami iki 3 lygio, duoda geresnius daiktus
- **Svečių užsakymai** su veidukais, atlygiu (monetos, XP, žvaigždės, brangakmeniai)
- **Kurorto atstatymas** – animuota scena (diena/naktis pagal laikrodį, vanduo, dūmai, laužas, jonvabaliai, švyturio spindulys), 8 pastatai su **perkais** (+energija, greitesnis atsistatymas, +monetos, sėkmingi sujungimai…)
- Kombo, „lucky“ sujungimai, mega sujungimas (7 lygis: konfeti + ekrano drebėjimas + vibracija)
- Skrynios, sandėlis (4 vietos), pardavimo šiukšliadėžė, rūšiavimas, stebuklinga lazdelė, užrakintos zonos
- Energija su atsistatymu, lygiai, dienos prizas (7 dienų serija), dienos užduotys, **laimės ratas**
- Mokymas rankos animacija (praleidžiamas), automatinės užuominos, LT/EN kalbos
- Garsai: ~20 sintezuotų efektų + generatyvi muzika; dalelės, plaukiojančios ikonos, skriejančios į HUD

## CrazyGames integracija (`js/cg.js`)
Pagal CrazyGames reikalavimus:
- `SDK.init()` → `loadingStart/Stop` → `gameplayStart` iškart į žaidimą (jokio splash / „click to play“)
- `gameplayStop` atidarius meniu / langą / prieš kiekvieną reklamą; `gameplayStart` grįžus; pauzė kai skirtukas paslėptas
- Reklamos tik per SDK: **rewarded** (+30 energijos, auksinė skrynia, papildomas ratas) – atlygis **tik `adFinished`**; `adStarted` → pauzė + nutildymas, `adFinished` **ir `adError`** → tęsti + įjungti garsą
- **Midgame** tik loginėje pertraukoje (po užsakymo atidavimo), ne anksčiau nei 3 lygis / 3 min.; be savo cooldown (platforma riboja)
- Banner kurorto ekrane (skiriasi nuo žaidimo ekrano, niekada reklamos metu)
- Veikia su adblock / be SDK: reklamų mygtukai paslepiami, žaidimas pilnai žaidžiamas
- `settings.muteAudio` + listener viršija vidinį garso jungiklį
- Progresas per `SDK.data` (fallback į localStorage); `reportGameCompletedPercentage`, `happytime` retiems momentams
- Sitelock (`CONFIG.SITELOCK`, žr. `js/cg.js`) – žaidžiasi tik crazygames domenuose (+ localhost / file)
- Visi keliai santykiniai; nėra savo fullscreen mygtuko, nėra login, nėra nuorodų į kitus žaidimus
- Laiku pagrįsta animacija (identiška 60/120/144 Hz), safe-area, apsauga nuo pažymėjimo / zoom / kontekstinio meniu

## Prieš pateikiant į CrazyGames
1. Developer Portal → įjungti **Progress Save**
2. Sukurti viršelius: 1920×1080, 800×1200, 800×800 (be rėmelių, tik pavadinimas) ir 15–20 s peržiūros vaizdo įrašą
3. Įkelti `merge-lodge/` turinį (ZIP su `index.html` šaknyje) ir pereiti `crazygames.com/preview` testą
4. Perbėgti `references/qa-checklist.md` (CrazyGames skill'e) – ypač tikra mobilioji peržiūra
