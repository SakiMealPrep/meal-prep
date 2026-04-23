const SUPABASE_URL = "https://syygollgxgnnurjtlewl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_aVXh1K021JPGDtTaPfi0Rw_GJs6iqDo";

const recipes = [
  { name: "Grcki jogurt sa smokvama i orasima", meal: "dorucak", goal: "gubitak", description: "Kremast dorucak sa vocem, orasima i malo meda za mediteranski start dana.", ingredients: ["grcki jogurt", "sveze smokve", "orasi", "med", "cimet"], calories: 290, protein: 18, carbs: 28, fat: 12 },
  { name: "Tost sa rikotom, paradajzom i bosiljkom", meal: "dorucak", goal: "gubitak", description: "Integralni tost sa laganim sirom, svezim paradajzom i maslinovim uljem.", ingredients: ["integralni tost", "rikota", "paradajz", "bosiljak", "maslinovo ulje"], calories: 310, protein: 14, carbs: 32, fat: 13 },
  { name: "Spanac omlet sa fetom", meal: "dorucak", goal: "gubitak", description: "Brz proteinski omlet sa zelenisem i malom kolicinom fete.", ingredients: ["jaja", "spanac", "feta sir", "crni luk", "maslinovo ulje"], calories: 330, protein: 23, carbs: 7, fat: 23 },
  { name: "Ovsena kasa sa bademima i narom", meal: "dorucak", goal: "gubitak", description: "Topla kasa sa vlaknima, bademima i osvezavajucim zrnima nara.", ingredients: ["ovsene pahuljice", "bademovo mleko", "nar", "badem", "cimet"], calories: 320, protein: 10, carbs: 42, fat: 12 },
  { name: "Mediteranska kajgana sa tikvicom", meal: "dorucak", goal: "gubitak", description: "Lagana kajgana sa tikvicom, persunom i paradajzom.", ingredients: ["jaja", "tikvica", "paradajz", "persun", "maslinovo ulje"], calories: 300, protein: 20, carbs: 8, fat: 20 },
  { name: "Cottage bowl sa krastavcem i maslinama", meal: "dorucak", goal: "gubitak", description: "Slani dorucak sa sirom, hrskavim povrcem i par maslina.", ingredients: ["cottage cheese", "krastavac", "masline", "mirodjija", "limunov sok"], calories: 260, protein: 22, carbs: 9, fat: 14 },
  { name: "Chia jogurt sa breskvom", meal: "dorucak", goal: "gubitak", description: "Osvezavajuci jogurt sa chia semenkama i breskvom.", ingredients: ["grcki jogurt", "chia semenke", "breskva", "limunova kora", "med"], calories: 280, protein: 17, carbs: 26, fat: 11 },
  { name: "Belanca sa sampinjonima i rukolom", meal: "dorucak", goal: "gubitak", description: "Niskokalorican proteinski dorucak sa mirisnim povrcem.", ingredients: ["belanca", "sampinjoni", "rukola", "beli luk", "maslinovo ulje"], calories: 230, protein: 24, carbs: 6, fat: 10 },
  { name: "Tuna tost sa limunom", meal: "dorucak", goal: "gubitak", description: "Integralni tost sa tunjevinom, limunom i svezim zacinima.", ingredients: ["integralni tost", "tunjevina", "limunov sok", "persun", "paradajz"], calories: 330, protein: 28, carbs: 30, fat: 8 },
  { name: "Kefir smoothie sa sumskim vocem", meal: "dorucak", goal: "gubitak", description: "Brz napitak sa probioticima, vocem i malo ovsa.", ingredients: ["kefir", "sumsko voce", "ovsene pahuljice", "lanene semenke", "cimet"], calories: 300, protein: 14, carbs: 38, fat: 9 },
  { name: "Mediteranski dorucak tanjir", meal: "dorucak", goal: "odrzavanje", description: "Balansiran tanjir sa jajima, hlebom, maslinama i povrcem.", ingredients: ["jaja", "integralni hleb", "masline", "krastavac", "paradajz"], calories: 430, protein: 22, carbs: 34, fat: 24 },
  { name: "Avokado tost sa jajetom i fetom", meal: "dorucak", goal: "odrzavanje", description: "Zasitni tost sa zdravim mastima, jajetom i malo fete.", ingredients: ["integralni tost", "avokado", "jaja", "feta sir", "limunov sok"], calories: 470, protein: 22, carbs: 32, fat: 29 },
  { name: "Pita omlet sa povrcem", meal: "dorucak", goal: "odrzavanje", description: "Omlet u integralnoj piti sa paprikom, lukom i jogurt sosom.", ingredients: ["integralna pita", "jaja", "paprika", "crni luk", "grcki jogurt"], calories: 450, protein: 25, carbs: 38, fat: 21 },
  { name: "Ovsene palacinke sa rikotom", meal: "dorucak", goal: "odrzavanje", description: "Mekane ovsene palacinke sa rikotom i bobicama.", ingredients: ["ovsene pahuljice", "jaja", "rikota", "borovnice", "med"], calories: 460, protein: 24, carbs: 50, fat: 18 },
  { name: "Shakshuka sa belim pasuljem", meal: "dorucak", goal: "odrzavanje", description: "Zasitan dorucak od jaja u paradajz sosu sa belim pasuljem.", ingredients: ["jaja", "beli pasulj", "paradajz", "paprika", "beli luk"], calories: 440, protein: 27, carbs: 36, fat: 20 },
  { name: "Jogurt granola sa pistacima", meal: "dorucak", goal: "odrzavanje", description: "Hrskav dorucak sa grckim jogurtom, granolom i pistacima.", ingredients: ["grcki jogurt", "granola", "pistaci", "jagode", "med"], calories: 430, protein: 20, carbs: 48, fat: 17 },
  { name: "Integralni sendvic sa humusom i jajetom", meal: "dorucak", goal: "odrzavanje", description: "Praktican sendvic sa humusom, jajetom i povrcem.", ingredients: ["integralni hleb", "humus", "jaja", "rukola", "paradajz"], calories: 450, protein: 23, carbs: 44, fat: 19 },
  { name: "Turski jogurt sa jajima i cilijem", meal: "dorucak", goal: "odrzavanje", description: "Topao slani dorucak sa jogurtom, jajima i zacinskim uljem.", ingredients: ["grcki jogurt", "jaja", "beli luk", "maslinovo ulje", "aleva paprika"], calories: 410, protein: 25, carbs: 10, fat: 29 },
  { name: "Fritata sa paradajzom i maslinama", meal: "dorucak", goal: "odrzavanje", description: "Pecena fritata sa paradajzom, maslinama i zacinima.", ingredients: ["jaja", "paradajz", "masline", "feta sir", "origano"], calories: 420, protein: 26, carbs: 9, fat: 30 },
  { name: "Bulgur kasa sa jabukom i orasima", meal: "dorucak", goal: "odrzavanje", description: "Slatka integralna kasa sa jabukom, orasima i cimetom.", ingredients: ["bulgur", "jabuka", "orasi", "grcki jogurt", "cimet"], calories: 440, protein: 16, carbs: 58, fat: 16 },

  { name: "Grcka salata sa piletinom", meal: "rucak", goal: "gubitak", description: "Velika salata sa grilovanom piletinom, fetom i maslinama.", ingredients: ["pileci file", "krastavac", "paradajz", "feta sir", "masline"], calories: 390, protein: 36, carbs: 12, fat: 22 },
  { name: "Salata od tune i belog pasulja", meal: "rucak", goal: "gubitak", description: "Proteinska salata sa tunom, pasuljem i limun prelivom.", ingredients: ["tunjevina", "beli pasulj", "crveni luk", "persun", "limunov sok"], calories: 380, protein: 34, carbs: 28, fat: 12 },
  { name: "Pileci souvlaki bowl", meal: "rucak", goal: "gubitak", description: "Piletina sa tzatziki sosom, salatom i malo integralnog pirinca.", ingredients: ["pileci file", "grcki jogurt", "krastavac", "integralni pirinac", "limun"], calories: 420, protein: 38, carbs: 34, fat: 13 },
  { name: "Lignje sa rukolom i krompirom", meal: "rucak", goal: "gubitak", description: "Lagani morski rucak sa kuvanim krompirom i rukolom.", ingredients: ["lignje", "rukola", "krompir", "limunov sok", "maslinovo ulje"], calories: 360, protein: 31, carbs: 30, fat: 11 },
  { name: "Socivo supa sa povrcem", meal: "rucak", goal: "gubitak", description: "Gusta supa puna vlakana, povrca i biljnih proteina.", ingredients: ["socivo", "sargarepa", "celer", "paradajz", "crni luk"], calories: 340, protein: 21, carbs: 48, fat: 7 },
  { name: "Oslic sa tikvicama i kaparima", meal: "rucak", goal: "gubitak", description: "Bela riba sa tikvicama, kaparima i limunom.", ingredients: ["oslic", "tikvica", "kapar", "limun", "maslinovo ulje"], calories: 310, protein: 32, carbs: 8, fat: 15 },
  { name: "Cicerika salata sa paprikom", meal: "rucak", goal: "gubitak", description: "Osvezavajuca salata od leblebija, paprike i svezih zacina.", ingredients: ["leblebije", "paprika", "krastavac", "persun", "limunov sok"], calories: 360, protein: 17, carbs: 48, fat: 11 },
  { name: "Cureci file sa tabule salatom", meal: "rucak", goal: "gubitak", description: "Posan protein uz laganu salatu od bulgura i persuna.", ingredients: ["cureci file", "bulgur", "persun", "paradajz", "limunov sok"], calories: 410, protein: 38, carbs: 35, fat: 10 },
  { name: "Mediteranska salata sa kozicama", meal: "rucak", goal: "gubitak", description: "Kozice sa zelenom salatom, paradajzom i laganim prelivom.", ingredients: ["kozice", "zelena salata", "paradajz", "krastavac", "maslinovo ulje"], calories: 330, protein: 32, carbs: 10, fat: 17 },
  { name: "Tikvice punjene tunjevinom", meal: "rucak", goal: "gubitak", description: "Pecene tikvice sa tunjevinom, paradajzom i zacinima.", ingredients: ["tikvica", "tunjevina", "paradajz", "crni luk", "origano"], calories: 350, protein: 34, carbs: 16, fat: 15 },
  { name: "Losos sa kinoom i blitvom", meal: "rucak", goal: "odrzavanje", description: "Omega-3 rucak sa kinoom i zelenisom.", ingredients: ["losos", "kinoa", "blitva", "limun", "maslinovo ulje"], calories: 560, protein: 38, carbs: 36, fat: 30 },
  { name: "Integralna pasta sa sardinom", meal: "rucak", goal: "odrzavanje", description: "Brza pasta sa sardinom, paradajzom i maslinama.", ingredients: ["integralna pasta", "sardina", "paradajz", "masline", "beli luk"], calories: 540, protein: 32, carbs: 62, fat: 18 },
  { name: "Falafel bowl sa humusom", meal: "rucak", goal: "odrzavanje", description: "Biljni bowl sa falafelom, humusom, povrcem i bulgurom.", ingredients: ["falafel", "humus", "bulgur", "krastavac", "paradajz"], calories: 590, protein: 24, carbs: 72, fat: 24 },
  { name: "Pileci gyros tanjir", meal: "rucak", goal: "odrzavanje", description: "Piletina sa pitom, tzatzikijem i svecom salatom.", ingredients: ["pileci file", "integralna pita", "grcki jogurt", "krastavac", "paradajz"], calories: 570, protein: 42, carbs: 54, fat: 20 },
  { name: "Orzo sa piletinom i spinatom", meal: "rucak", goal: "odrzavanje", description: "Kremasti orzo sa piletinom, spinatom i limunom.", ingredients: ["orzo testenina", "pileci file", "spanac", "limun", "parmezan"], calories: 560, protein: 40, carbs: 58, fat: 18 },
  { name: "Minestrone sa pasuljem", meal: "rucak", goal: "odrzavanje", description: "Gusta supa sa povrcem, pasuljem i malom integralnom pastom.", ingredients: ["beli pasulj", "integralna pasta", "tikvica", "sargarepa", "paradajz"], calories: 480, protein: 24, carbs: 72, fat: 10 },
  { name: "Govedina sa patlidzanom i kuskusom", meal: "rucak", goal: "odrzavanje", description: "Manja porcija nemasne govedine uz patlidzan i kuskus.", ingredients: ["nemasna govedina", "patlidzan", "kuskus", "paradajz", "persun"], calories: 590, protein: 38, carbs: 54, fat: 24 },
  { name: "Brancin sa krompirom i maslinama", meal: "rucak", goal: "odrzavanje", description: "Riba iz rerne sa krompirom, maslinama i ruzmarinom.", ingredients: ["brancin", "krompir", "masline", "ruzmarin", "maslinovo ulje"], calories: 540, protein: 36, carbs: 42, fat: 25 },
  { name: "Pita pizza sa povrcem i mozzarellom", meal: "rucak", goal: "odrzavanje", description: "Brza integralna pita pizza sa povrcem i sirom.", ingredients: ["integralna pita", "mozzarella", "paprika", "tikvica", "paradajz sos"], calories: 520, protein: 25, carbs: 58, fat: 20 },
  { name: "Rizoto od kinoe sa kozicama", meal: "rucak", goal: "odrzavanje", description: "Kinoa u stilu rizota sa kozicama, limunom i persunom.", ingredients: ["kinoa", "kozice", "parmezan", "limun", "persun"], calories: 510, protein: 38, carbs: 46, fat: 18 },

  { name: "Bela riba sa paradajzom i maslinama", meal: "vecera", goal: "gubitak", description: "Lagana vecera od ribe u sosu od paradajza i maslina.", ingredients: ["bela riba", "paradajz", "masline", "beli luk", "bosiljak"], calories: 320, protein: 33, carbs: 11, fat: 16 },
  { name: "Pileca salata sa artichokom", meal: "vecera", goal: "gubitak", description: "Proteinska salata sa piletinom, artichokom i limun prelivom.", ingredients: ["pileci file", "articoka", "zelena salata", "krastavac", "limunov sok"], calories: 340, protein: 36, carbs: 10, fat: 16 },
  { name: "Jaja u paradajz sosu sa blitvom", meal: "vecera", goal: "gubitak", description: "Topla vecera nalik shakshuki sa blitvom i jajima.", ingredients: ["jaja", "paradajz", "blitva", "beli luk", "aleva paprika"], calories: 330, protein: 22, carbs: 14, fat: 21 },
  { name: "Kozice sa tikvicama i limunom", meal: "vecera", goal: "gubitak", description: "Brza lagana vecera sa kozicama i trakama tikvice.", ingredients: ["kozice", "tikvica", "limun", "beli luk", "maslinovo ulje"], calories: 300, protein: 32, carbs: 9, fat: 14 },
  { name: "Tofu mediteranski tiganj", meal: "vecera", goal: "gubitak", description: "Biljna vecera sa tofuom, povrcem, maslinama i origanom.", ingredients: ["tofu", "paprika", "tikvica", "masline", "origano"], calories: 350, protein: 24, carbs: 16, fat: 21 },
  { name: "Tuna salata sa belancima", meal: "vecera", goal: "gubitak", description: "Lagani protein bowl sa tunom, belancima i povrcem.", ingredients: ["tunjevina", "belanca", "zelena salata", "paradajz", "limunov sok"], calories: 310, protein: 42, carbs: 8, fat: 10 },
  { name: "Peceni patlidzan sa jogurt sosom", meal: "vecera", goal: "gubitak", description: "Mek patlidzan iz rerne sa jogurtom, belim lukom i persunom.", ingredients: ["patlidzan", "grcki jogurt", "beli luk", "persun", "maslinovo ulje"], calories: 290, protein: 13, carbs: 22, fat: 17 },
  { name: "Curetina sa grilovanim povrcem", meal: "vecera", goal: "gubitak", description: "Posna curetina uz sareno povrce sa rostilj aromom.", ingredients: ["cureci file", "paprika", "tikvica", "crveni luk", "limun"], calories: 360, protein: 39, carbs: 15, fat: 14 },
  { name: "Supa od paradajza i leblebija", meal: "vecera", goal: "gubitak", description: "Topla supa sa leblebijama, paradajzom i mediteranskim zacinima.", ingredients: ["leblebije", "paradajz", "celer", "crni luk", "bosiljak"], calories: 330, protein: 17, carbs: 46, fat: 9 },
  { name: "Salata sa lososom i rukolom", meal: "vecera", goal: "gubitak", description: "Manja porcija lososa sa rukolom, krastavcem i limunom.", ingredients: ["losos", "rukola", "krastavac", "limun", "maslinovo ulje"], calories: 390, protein: 30, carbs: 6, fat: 27 },
  { name: "Sardine sa batatom i zelenisem", meal: "vecera", goal: "odrzavanje", description: "Zasitna vecera sa sardinom, batatom i zelenom salatom.", ingredients: ["sardina", "batat", "zelena salata", "limun", "maslinovo ulje"], calories: 520, protein: 32, carbs: 44, fat: 24 },
  { name: "Musaka od patlidzana i curetine", meal: "vecera", goal: "odrzavanje", description: "Lagana mediteranska musaka sa curetinom i jogurt prelivom.", ingredients: ["patlidzan", "mlevena curetina", "paradajz", "grcki jogurt", "jaja"], calories: 520, protein: 42, carbs: 24, fat: 28 },
  { name: "Integralna pasta sa pestom i piletinom", meal: "vecera", goal: "odrzavanje", description: "Pasta sa piletinom, pestom, rukolom i paradajzom.", ingredients: ["integralna pasta", "pileci file", "pesto", "rukola", "cherry paradajz"], calories: 610, protein: 43, carbs: 58, fat: 25 },
  { name: "Losos iz rerne sa povrcem", meal: "vecera", goal: "odrzavanje", description: "Jednostavan pleh obrok sa lososom, povrcem i maslinovim uljem.", ingredients: ["losos", "brokoli", "paradajz", "krompir", "maslinovo ulje"], calories: 620, protein: 40, carbs: 38, fat: 34 },
  { name: "Punjene paprike sa kinoom i fetom", meal: "vecera", goal: "odrzavanje", description: "Vegetarijanska vecera sa kinoom, fetom i zacinima.", ingredients: ["paprika", "kinoa", "feta sir", "paradajz", "persun"], calories: 500, protein: 22, carbs: 58, fat: 20 },
  { name: "Piletina cacciatore sa palentom", meal: "vecera", goal: "odrzavanje", description: "Piletina u paradajz sosu sa maslinama i kremastom palentom.", ingredients: ["pileci file", "palenta", "paradajz", "masline", "beli luk"], calories: 560, protein: 42, carbs: 52, fat: 19 },
  { name: "Skusa sa kuskus salatom", meal: "vecera", goal: "odrzavanje", description: "Masnija riba bogata omega-3 uz osvezavajucu kuskus salatu.", ingredients: ["skusa", "kuskus", "krastavac", "paradajz", "limun"], calories: 590, protein: 35, carbs: 45, fat: 30 },
  { name: "Giros bowl sa tofuom i humusom", meal: "vecera", goal: "odrzavanje", description: "Biljni bowl sa tofuom, humusom, povrcem i pitom.", ingredients: ["tofu", "humus", "integralna pita", "krastavac", "paradajz"], calories: 560, protein: 30, carbs: 52, fat: 26 },
  { name: "Morski plodovi sa orzom", meal: "vecera", goal: "odrzavanje", description: "Orzo sa morskim plodovima, paradajzom i persunom.", ingredients: ["morski plodovi", "orzo testenina", "paradajz", "beli luk", "persun"], calories: 540, protein: 38, carbs: 62, fat: 14 },
  { name: "Fasulj sa blitvom i feta sirom", meal: "vecera", goal: "odrzavanje", description: "Toplo jelo od belog pasulja, blitve i malo fete.", ingredients: ["beli pasulj", "blitva", "feta sir", "beli luk", "maslinovo ulje"], calories: 500, protein: 25, carbs: 54, fat: 22 }
];

const existingResponse = await fetch(`${SUPABASE_URL}/rest/v1/recipes?select=name`, {
  headers: {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
  }
});

if (!existingResponse.ok) {
  throw new Error(`Could not read existing recipes: ${existingResponse.status} ${await existingResponse.text()}`);
}

const existingNames = new Set((await existingResponse.json()).map((recipe) => recipe.name));
const newRecipes = recipes.filter((recipe) => !existingNames.has(recipe.name));

if (!newRecipes.length) {
  console.log("No new Mediterranean recipes to seed.");
  process.exit(0);
}

const response = await fetch(`${SUPABASE_URL}/rest/v1/recipes`, {
  method: "POST",
  headers: {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal"
  },
  body: JSON.stringify(newRecipes)
});

if (!response.ok) {
  throw new Error(`Seed failed: ${response.status} ${await response.text()}`);
}

console.log(`Seeded ${newRecipes.length} Mediterranean recipes.`);
