const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT9rPlxpax2lE0rN97c6Hoy_OxUwREqRb48juEBr9C91ZFY2UvaKgC8JdiRcwDrtBErXFVmFRh0Zr5e/pub?gid=0&single=true&output=csv';
const APP_VERSION = 'v3.0.2'; 

const IDIOMAS = {
    ES: "Español", EN: "English", DE: "Deutsch", FR: "Français", IT: "Italiano",
    RU: "Русский", NL: "Nederlands", PL: "Polski", SV: "Svenska", NO: "Norsk",
    DA: "Dansk", FI: "Suomi", PT: "Português", RO: "Română", HU: "Magyar",
    CS: "Čeština", EL: "Ελληνικά", TR: "Türkçe", AR: "العربية", ZH: "中文", JA: "日本語"
};

let allData = [];
let currentLang = 'ES', currentCat = '12';
let currentGalleryPath = '', currentPhotoIndex = 1, maxPhotosFound = 1;
let verifiedImages = {}; 
let preloadQueue = [];
let isPreloading = false;
let currentPreloadSession = 0;

const categoriesList = [ 
    { 
        id: '12', 
        ES: 'Sugerencias', EN: 'Suggestions', DE: 'Vorschläge', FR: 'Suggestions', IT: 'Suggerimenti',
        RU: 'Предложения', NL: 'Suggesties', PL: 'Sugestie', SV: 'Förslag', NO: 'Forslag',
        DA: 'Forslag', FI: 'Suositukset', PT: 'Sugestões', RO: 'Sugestii', HU: 'Ajánlatok',
        CS: 'Doporučení', EL: 'Προτάσεις', TR: 'Öneriler', AR: 'اقتراحات', ZH: '推荐', JA: 'おすすめ'
    }, 
    { 
        id: '1', 
        ES: 'Entrantes', EN: 'Starters', DE: 'Vorspeisen', FR: 'Entrées', IT: 'Antipasti',
        RU: 'Закуски', NL: 'Voorgerechten', PL: 'Przystawki', SV: 'Förrätter', NO: 'Forretter',
        DA: 'Forretter', FI: 'Alkuruoat', PT: 'Entradas', RO: 'Gustări', HU: 'Előételek',
        CS: 'Předkrmy', EL: 'Ορεκτικά', TR: 'Başlangıçlar', AR: 'مقبلات', ZH: '前菜', JA: '前菜'
    }, 
    { 
        id: '2', 
        ES: 'Ensaladas', EN: 'Salads', DE: 'Salate', FR: 'Salades', IT: 'Insalate',
        RU: 'Салаты', NL: 'Salades', PL: 'Sałatky', SV: 'Sallader', NO: 'Salater',
        DA: 'Salater', FI: 'Salaatit', PT: 'Saladas', RO: 'Salate', HU: 'Saláták',
        CS: 'Saláty', EL: 'Σαλάτες', TR: 'Salatalar', AR: 'سلطات', ZH: '沙拉', JA: 'サラダ'
    }, 
    { 
        id: '3', 
        ES: 'Arroces & Pastas', EN: 'Rice & Pasta', DE: 'Reis & Pasta', FR: 'Riz & Pâtes', IT: 'Riso e Pasta',
        RU: 'Рис и паста', NL: 'Rijst & Pasta', PL: 'Ryż i Makaron', SV: 'Ris & Pasta', NO: 'Ris og pasta',
        DA: 'Ris & Pasta', FI: 'Riisi & Pasta', PT: 'Arroz e Massa', RO: 'Orez și paste', HU: 'Rizs és tészták',
        CS: 'Rýže a těstoviny', EL: 'Ρύζι & Ζυμαρικά', TR: 'Pilav & Makarna', AR: 'أرز وباستا', ZH: '米饭与面食', JA: 'ライス＆パスタ'
    }, 
    { 
        id: '4', 
        ES: 'Recetas', EN: 'Recipes', DE: 'Rezepte', FR: 'Recettes', IT: 'Ricette',
        RU: 'Рецепты', NL: 'Recepten', PL: 'Przepisy', SV: 'Recept', NO: 'Oppskrifter',
        DA: 'Opskrifter', FI: 'Reseptit', PT: 'Receitas', RO: 'Rețete', HU: 'Receptek',
        CS: 'Recepty', EL: 'Συνταγές', TR: 'Tarifler', AR: 'وصفات', ZH: '特色菜', JA: 'レシピ'
    }, 
    { 
        id: '5', 
        ES: 'Principales', EN: 'Mains', DE: 'Hauptspeisen', FR: 'Plats', IT: 'Piatti',
        RU: 'Основные блюда', NL: 'Hoofdgerechten', PL: 'Dania główne', SV: 'Huvudrätter', NO: 'Hovedretter',
        DA: 'Hovedretter', FI: 'Pääruoat', PT: 'Pratos principais', RO: 'Feluri principale', HU: 'Főételek',
        CS: 'Hlavní jídla', EL: 'Κυρίως Πιάτα', TR: 'Ana Yemekler', AR: 'أطباق رئيسية', ZH: '主菜', JA: 'メインディッシュ'
    }, 
    { 
        id: '7', 
        ES: 'Niños', EN: 'Kids', DE: 'Kinder', FR: 'Enfants', IT: 'Bambini',
        RU: 'Детское меню', NL: 'Kinderen', PL: 'Dla dzieci', SV: 'Barn', NO: 'Barn',
        DA: 'Børn', FI: 'Lapset', PT: 'Crianças', RO: 'Copii', HU: 'Gyerekeknek',
        CS: 'Pro děti', EL: 'Παιδικά', TR: 'Çocuklar', AR: 'أطفال', ZH: '儿童餐', JA: 'キッズメニュー'
    }, 
    { 
        id: '8', 
        ES: 'Postres', EN: 'Desserts', DE: 'Desserts', FR: 'Desserts', IT: 'Dolci',
        RU: 'Десерты', NL: 'Desserts', PL: 'Desery', SV: 'Efterrätter', NO: 'Desesser',
        DA: 'Desesser', FI: 'Jälkiruoat', PT: 'Sobremesas', RO: 'Deserturi', HU: 'Desszertek',
        CS: 'Dezerty', EL: 'Επιδόρπια', TR: 'Tatlılar', AR: 'حلويات', ZH: '甜点', JA: 'デザート'
    }, 
    { 
        id: '9', 
        ES: 'Café', EN: 'Coffee', DE: 'Kaffee', FR: 'Café', IT: 'Caffè',
        RU: 'Кофе', NL: 'Koffie', PL: 'Kawa', SV: 'Kaffe', NO: 'Kaffe',
        DA: 'Kaffe', FI: 'Kahvi', PT: 'Café', RO: 'Cafea', HU: 'Kávé',
        CS: 'Káva', EL: 'Καφές', TR: 'Kahve', AR: 'قهوة', ZH: '咖啡', JA: 'コーヒー'
    }, 
    { 
        id: '10', 
        ES: 'Bebidas', EN: 'Drinks', DE: 'Getränke', FR: 'Boissons', IT: 'Bibite',
        RU: 'Напитки', NL: 'Dranken', PL: 'Napoje', SV: 'Drycker', NO: 'Drikke',
        DA: 'Drikkevarer', FI: 'Juomat', PT: 'Bebidas', RO: 'Băuturi', HU: 'Italok',
        CS: 'Nápoje', EL: 'Ποτά', TR: 'İçecekler', AR: 'مشروبات', ZH: '饮料', JA: 'ドリンク'
    }, 
    { 
        id: '11', 
        ES: 'Cervezas', EN: 'Beers', DE: 'Biere', FR: 'Bières', IT: 'Birre',
        RU: 'Пиво', NL: 'Bieren', PL: 'Piwa', SV: 'Öl', NO: 'Øl',
        DA: 'Øl', FI: 'Olutta', PT: 'Cervejas', RO: 'Beri', HU: 'Sörök',
        CS: 'Piva', EL: 'Μπύρες', TR: 'Biralar', AR: 'بيرة', ZH: '啤酒', JA: 'ビール'
    }, 
    { 
        id: '131', 
        ES: 'Vinos Blancos', EN: 'White Wines', DE: 'Weissweine', FR: 'Vins Blancs', IT: 'Vini Bianchi',
        RU: 'Белые вина', NL: 'Witte wijnen', PL: 'Białe wina', SV: 'Vita viner', NO: 'Hvite viner',
        DA: 'Hvidvine', FI: 'Valkoviinit', PT: 'Vinhos brancos', RO: 'Vinuri albe', HU: 'Fehérborok',
        CS: 'Bílá vína', EL: 'Λευκά Κraσιά', TR: 'Beyaz Şaraplar', AR: 'نبيذ أبيض', ZH: '白葡萄酒', JA: '白ワイン'
    }, 
    { 
        id: '132', 
        ES: 'Vinos Rosados', EN: 'Rosé Wines', DE: 'Roséweine', FR: 'Vins Rosés', IT: 'Vini Rosati',
        RU: 'Розовые вина', NL: 'Rosé wijnen', PL: 'Wina różowe', SV: 'Roséviner', NO: 'Roséviner',
        DA: 'Rosévine', FI: 'Roséviinit', PT: 'Vinhos rosés', RO: 'Vinuri roze', HU: 'Rozé borok',
        CS: 'Růžová vína', EL: 'Ροζέ Κρασιά', TR: 'Roze Şaraplar', AR: 'نبيذ روزيه', ZH: '桃红葡萄酒', JA: 'ロゼワイン'
    }, 
    { 
        id: '133', 
        ES: 'Vinos Tintos', EN: 'Red Wines', DE: 'Rotweine', FR: 'Vins Rouges', IT: 'Vini Rossi',
        RU: 'Красные вина', NL: 'Rode wijnen', PL: 'Czerwone wina', SV: 'Röda viner', NO: 'Røde viner',
        DA: 'Rødvine', FI: 'Punaviinit', PT: 'Vinhos tintos', RO: 'Vinuri roșii', HU: 'Vörösborok',
        CS: 'Červená vína', EL: 'Κόκκινα Κρασιά', TR: 'Kırmızı Şaraplar', AR: 'نبيذ أحمر', ZH: '红葡萄酒', JA: '赤ワイン'
    }, 
    { 
        id: '134', 
        ES: 'Cavas & Champagne', EN: 'Cava & Champagne', DE: 'Cava & Champagne', FR: 'Cava & Champagne', IT: 'Cava & Champagne',
        RU: 'Кава и Шампанское', NL: 'Cava & Champagne', PL: 'Cava i Szampan', SV: 'Cava & Champagne', NO: 'Cava og champagne',
        DA: 'Cava & Champagne', FI: 'Cava & Samppanja', PT: 'Cavas e Champagne', RO: 'Cava & Șampanie', HU: 'Cava és pezsgők',
        CS: 'Cava a Šampaňské', EL: 'Cava & Σαμπάνια', TR: 'Kava & Şampanya', AR: 'كافا وشامبانيا', ZH: '卡瓦与香槟', JA: 'カヴァ＆シャンパン'
    }
];

const subCatsLang = {
    mallorca: {
        ES: 'Vinos de Mallorca', EN: 'Majorcan Wines', DE: 'Weine aus Mallorca', FR: 'Vins de Majorque', IT: 'Vini di Maiorca',
        RU: 'Мальорканские вина', NL: 'Mallorquijnse wijnen', PL: 'Wina z Majorki', SV: 'Mallorkinska viner', NO: 'Mallorcanske viner',
        DA: 'Mallorcanske vine', FI: 'Mallorcalaiset viinit', PT: 'Vinhos de Maiorca', RO: 'Vinuri de Mallorca', HU: 'Mallorcai borok',
        CS: 'Mallorská vína', EL: 'Κρασιά της Μαγιόρκα', TR: 'Mallorca Şarapları', AR: 'نبيذ مايوركا', ZH: '马略卡葡萄酒', JA: 'マヨルカワイン'
    },
    copas: {
        ES: 'Copas', EN: 'By the Glass', DE: 'Glasweise', FR: 'Au Verre', IT: 'Al Calice',
        RU: 'По бокалам', NL: 'Per glas', PL: 'Na kieliszki', SV: 'Glasvis', NO: 'Glassvis',
        DA: 'Pr. glas', FI: 'Laseittain', PT: 'A copo', RO: 'La pahar', HU: 'Pohárral',
        CS: 'Rozlévaná vína', EL: 'Σε Ποτήρι', TR: 'Kadehte', AR: 'بأقداح الكأس', ZH: '杯装酒', JA: 'グラスワイン'
    },
    otras: {
        ES: 'Otras D.O.', EN: 'Other D.O.', DE: 'Andere D.O.', FR: 'Autres D.O.', IT: 'Altre D.O.',
        RU: 'Другие D.O.', NL: 'Overige D.O.', PL: 'Inne D.O.', SV: 'Andra D.O.', NO: 'Andre D.O.',
        DA: 'Andre D.O.', FI: 'Muut D.O.', PT: 'Outras D.O.', RO: 'Alte D.O.', HU: 'Egyéb D.O.',
        CS: 'Ostatní D.O.', EL: 'Άλλες D.O.', TR: 'Diğer D.O.', AR: 'تسميات منшأ أخرى', ZH: '其他D.O.产区', JA: 'その他のD.O.'
    },
    galicia: {
        ES: 'Galicia', EN: 'Galicia', DE: 'Galicien', FR: 'Galice', IT: 'Galizia',
        RU: 'Галисия', NL: 'Galicië', PL: 'Galicja', SV: 'Galicien', NO: 'Galicia',
        DA: 'Galicien', FI: 'Galicia', PT: 'Galiza', RO: 'Galicia', HU: 'Galícia',
        CS: 'Galicie', EL: 'Γαλικία', TR: 'Galiçya', AR: 'غاليسيا', ZH: '加利西亚', JA: 'ガリシア'
    },
    rueda: {
        ES: 'Rueda', EN: 'Rueda', DE: 'Rueda', FR: 'Rueda', IT: 'Rueda',
        RU: 'Руэда', NL: 'Rueda', PL: 'Rueda', SV: 'Rueda', NO: 'Rueda',
        DA: 'Rueda', FI: 'Rueda', PT: 'Rueda', RO: 'Rueda', HU: 'Rueda',
        CS: 'Rueda', EL: 'Ρουέδα', TR: 'Rueda', AR: 'رويدا', ZH: '卢埃达', JA: 'ルエダ'
    },
    rioja: {
        ES: 'Rioja', EN: 'Rioja', DE: 'Rioja', FR: 'Rioja', IT: 'Rioja',
        RU: 'Риоха', NL: 'Rioja', PL: 'Rioja', SV: 'Rioja', NO: 'Rioja',
        DA: 'Rioja', FI: 'Rioja', PT: 'Rioja', RO: 'Rioja', HU: 'Rioja',
        CS: 'Rioja', EL: 'Ριόχα', TR: 'Rioja', AR: 'ريوخا', ZH: '里奥哈', JA: 'リオハ'
    },
    ribera: {
        ES: 'Ribera', EN: 'Ribera', DE: 'Ribera', FR: 'Ribera', IT: 'Ribera',
        RU: 'Рибера', NL: 'Ribera', PL: 'Ribera', SV: 'Ribera', NO: 'Ribera',
        DA: 'Ribera', FI: 'Ribera', PT: 'Ribera', RO: 'Ribera', HU: 'Ribera',
        CS: 'Ribera', EL: 'Ριμπέρα', TR: 'Ribera', AR: 'ريبيرا', ZH: '杜埃罗河岸', JA: 'リベラ'
    }
};

const wineSubCats = [ 
    { start: 13100, end: 13129, ...subCatsLang.mallorca }, 
    { start: 13130, end: 13139, ...subCatsLang.galicia }, 
    { start: 13140, end: 13149, ...subCatsLang.rueda }, 
    { start: 13150, end: 13189, ...subCatsLang.otras }, 
    { start: 13190, end: 13199, ...subCatsLang.copas }, 
    { start: 13200, end: 13249, ...subCatsLang.mallorca }, 
    { start: 13250, end: 13259, ...subCatsLang.copas }, 
    { start: 13300, end: 13329, ...subCatsLang.mallorca }, 
    { start: 13330, end: 13349, ...subCatsLang.rioja }, 
    { start: 13350, end: 13369, ...subCatsLang.ribera }, 
    { start: 13370, end: 13389, ...subCatsLang.otras }, 
    { start: 13390, end: 13399, ...subCatsLang.copas }, 
    { start: 13450, end: 13459, ...subCatsLang.copas }
];

async function init() { 
    try { 
        populateLanguageSelect();

        const response = await fetch(CSV_URL); 
        const csvText = await response.text(); 
        allData = parseCSV(csvText); 
        
        if (allData.length > 0) { 
            const userLang = (navigator.language || navigator.userLanguage).split('-')[0].toUpperCase();
            currentLang = IDIOMAS[userLang] ? userLang : 'EN';
            
            renderCategories(); 
            renderMenu(); 
            updateLanguageUI();
            managePreload(); 
        } 
    } catch (e) { console.error("Error en la inicialización:", e); }
}

function populateLanguageSelect() {
    const select = document.getElementById('more-langs');
    if (!select) return;
    
    select.innerHTML = '<option value="">🌐 Más...</option>';
    
    Object.entries(IDIOMAS).forEach(([code, name]) => {
        if (!['ES','EN','DE','FR','IT'].includes(code)) {
            const opt = document.createElement('option');
            opt.value = code;
            opt.textContent = name;
            select.appendChild(opt);
        }
    });
}

function updateLanguageUI() {
    document.querySelectorAll('#language-selector button').forEach(b => b.classList.remove('active'));
    
    const btn = document.getElementById(`btn-${currentLang}`);
    const select = document.getElementById('more-langs');
    
    if (btn) {
        btn.classList.add('active');
        if (select) select.value = '';
    } else {
        if (select) select.value = currentLang;
    }
}

function parseCSV(text) { 
    const rows = []; 
    const lines = text.split(/\r?\n(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
    for (let i = 1; i < lines.length; i++) { 
        const col = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
        if (col.length < 11) continue; 
        const clean = (val) => val ? val.replace(/^"|"$/g, '').trim() : ""; 
        rows.push({ 
            id: clean(col[0]), 
            precio: clean(col[1]).replace(',', '.'), 
            activa: clean(col[2]).toUpperCase(), 
            nombre_es: clean(col[3]), 
            carpeta: clean(col[4]), 
            archivo: clean(col[5]), 
            alergenos: col[6] ? clean(col[6]).split(',').map(a => a.trim()).filter(a => a) : [], 
            nombre_en: clean(col[7]), 
            nombre_de: clean(col[8]), 
            nombre_fr: clean(col[9]), 
            nombre_it: clean(col[10]),
            nombre_ru: col[11] ? clean(col[11]) : "",
            nombre_nl: col[12] ? clean(col[12]) : "",
            nombre_pl: col[13] ? clean(col[13]) : "",
            nombre_sv: col[14] ? clean(col[14]) : "",
            nombre_no: col[15] ? clean(col[15]) : "",
            nombre_da: col[16] ? clean(col[16]) : "",
            nombre_fi: col[17] ? clean(col[17]) : "",
            nombre_pt: col[18] ? clean(col[18]) : "",
            nombre_ro: col[19] ? clean(col[19]) : "",
            nombre_hu: col[20] ? clean(col[20]) : "",
            nombre_cs: col[21] ? clean(col[21]) : "",
            nombre_el: col[22] ? clean(col[22]) : "",
            nombre_tr: col[23] ? clean(col[23]) : "",
            nombre_ar: col[24] ? clean(col[24]) : "",
            nombre_zh: col[25] ? clean(col[25]) : "",
            nombre_ja: col[26] ? clean(col[26]) : ""
        }); 
    } 
    return rows;
}

function isItemInCategory(itemId, catId) { 
    const idStr = itemId.toString(); 
    const catStr = catId.toString(); 
    if (idStr.length === 4 && catStr.length === 1) return idStr.startsWith(catStr); 
    if (idStr.length === 5 && catStr.length === 2) return idStr.startsWith(catStr); 
    if (idStr.length === 5 && catStr.length === 3) return idStr.startsWith(catStr); 
    return false;
}

function renderCategories() { 
    const nav = document.getElementById('category-selector'); 
    nav.innerHTML = categoriesList.map(c => {
        const catName = c[currentLang] || c['EN'] || c['ES'];
        return `<button onclick="filterCategory('${c.id}')" class="cat-btn ${currentCat === c.id ? 'active' : ''}">${catName}</button>`;
    }).join('');
}

function renderMenu() { 
    const grid = document.getElementById('items-list'), title = document.getElementById('current-category-name'); 
    const catObj = categoriesList.find(c => c.id === currentCat); 
    
    const translatedTitle = catObj ? (catObj[currentLang] || catObj['EN'] || catObj['ES']) : "";
    title.innerHTML = `${translatedTitle} <span style="font-size: 0.4em; opacity: 0.5; font-weight: normal; margin-left: 10px;">${APP_VERSION}</span>`; 
    grid.innerHTML = '';

    const filtered = allData.filter(item => { 
        return isItemInCategory(item.id, currentCat) && item.activa === 'SI' && (item.id % 1000 !== 0); 
    });

    let currentActiveSubCatName = ""; 
    filtered.forEach(item => { 
        const idNum = parseInt(item.id); 
        if (currentCat.startsWith('13')) { 
            const foundSub = wineSubCats.find(s => idNum >= s.start && idNum <= s.end); 
            if (foundSub) {
                const subCatName = foundSub[currentLang] || foundSub['EN'] || foundSub['ES'];
                if (subCatName !== currentActiveSubCatName) { 
                    grid.innerHTML += `<h3 class="sub-category-title">${subCatName}</h3>`; 
                    currentActiveSubCatName = subCatName; 
                }
            } 
        } 
        grid.innerHTML += generateItemHtml(item); 
    });

    if (currentCat === '5') { 
        const guarnis = allData.filter(item => item.id.toString().startsWith('6') && item.id.toString().length === 4 && item.activa === 'SI'); 
        if (guarnis.length > 0) { 
            const guarniTitles = { ES: 'Guarniciones', EN: 'Side Dishes', DE: 'Beilagen', FR: 'Garnitures', IT: 'Contorni' }; 
            const titleText = guarniTitles[currentLang] || guarniTitles['EN'] || guarniTitles['ES']; 
            grid.innerHTML += `<h3 class="sub-category-title">${titleText}</h3>`; 
            guarnis.forEach(g => grid.innerHTML += generateItemHtml(g, true)); 
        } 
    }
}

function generateItemHtml(item, isGuarni = false) { 
    const processName = (text) => { 
        if (!text) return { name: '', uvas: '' }; 
        const parts = text.split('//').map(p => p.trim()).filter(p => p !== ""); 
        return { name: parts[0] || '', uvas: parts[1] || '' }; 
    }; 

    const currentData = processName(item[`nombre_${currentLang.toLowerCase()}`] || item.nombre_es); 
    const secondaryData = processName(item.nombre_es); 

    const price = (isGuarni && parseInt(item.id) < 6100) ? '' : (parseFloat(item.precio) > 0 ? `${parseFloat(item.precio).toFixed(2)}€` : ''); 
    const alergenosHtml = item.alergenos.map(a => `<img src="imagenes/alergenos/${a}.webp" onerror="this.style.display='none'">`).join('');  
    
    let photoIcon = ''; 
    let clickAction = ''; 
    let clickableStyle = '';

    if (item.archivo && item.archivo.includes('01.webp')) { 
        const base = `imagenes/${item.carpeta}/${item.archivo.split('01.webp')[0]}`; 
        photoIcon = `<span class="emoji-photo">📸</span>`; 
        clickAction = `onclick="openGallery('${base}')"`; 
        clickableStyle = 'style="cursor: pointer;"'; 
    }

    return ` 
    <div class="item-row"> 
        <div class="item-content" ${clickAction} ${clickableStyle}> 
            <span class="name-selected"> 
                ${currentData.name} ${photoIcon} 
                ${currentData.uvas ? `<br><small style="font-size:0.85em; opacity:0.8; font-style:italic; display:block; margin-top:2px;">${currentData.uvas}</small>` : ''} 
            </span> 
            ${currentLang !== 'ES' ? ` 
            <span class="name-secondary"> 
                ${secondaryData.name} 
                ${secondaryData.uvas ? `<br><small style="font-size:0.85em; opacity:0.8; font-style:italic;">${secondaryData.uvas}</small>` : ''} 
            </span>` : ''} 
            <div class="alergenos-list">${alergenosHtml}</div> 
        </div> 
        <div class="price-box">${price}</div> 
    </div>`;
}

function managePreload() { 
    currentPreloadSession++; 
    const mySession = currentPreloadSession; 
    isPreloading = false;  
    preloadQueue = [];

    const sortedData = [...allData].sort((a, b) => parseInt(a.id) - parseInt(b.id));

    const addCategoryByLevels = (items) => { 
        const bases = items.map(item => `imagenes/${item.carpeta}/${item.archivo.split('01.webp')[0]}`); 
        for (let level = 1; level <= 4; level++) { 
            bases.forEach(base => { preloadQueue.push({ base, n: level }); }); 
        } 
    };

    const currentItems = sortedData.filter(i => isItemInCategory(i.id, currentCat) && i.archivo && i.activa === 'SI'); 
    addCategoryByLevels(currentItems);

    const otherFoodItems = sortedData.filter(i => !isItemInCategory(i.id, currentCat) && parseInt(i.id) < 13000 && i.archivo && i.activa === 'SI'); 
    addCategoryByLevels(otherFoodItems);

    const wineItems = sortedData.filter(i => !isItemInCategory(i.id, currentCat) && parseInt(i.id) >= 13000 && i.archivo && i.activa === 'SI'); 
    addCategoryByLevels(wineItems);

    processPreloadQueue(mySession);
}

async function processPreloadQueue(session) { 
    if (isPreloading) return; 
    isPreloading = true;

    while (preloadQueue.length > 0) { 
        if (session !== currentPreloadSession) { isPreloading = false; return; }  
        const task = preloadQueue.shift(); 
        const url = `${task.base}0${task.n}.webp`;

        if (task.n > 1) { 
            const prevUrl = `${task.base}0${task.n - 1}.webp`; 
            if (verifiedImages[prevUrl] === false) { verifiedImages[url] = false; continue; } 
        }

        if (verifiedImages[url] !== undefined) continue;

        const success = await new Promise(resolve => { 
            const img = new Image(); 
            img.onload = () => resolve(true); 
            img.onerror = () => resolve(false); 
            img.src = url; 
        });

        verifiedImages[url] = success; 
    } 
    isPreloading = false;
}

async function openGallery(base) { 
    currentPreloadSession++;  
    currentGalleryPath = base;  
    currentPhotoIndex = 1;  
    maxPhotosFound = 1;

    updateModal(); 
    document.getElementById('photo-modal').style.display = 'flex';

    for (let i = 2; i <= 4; i++) { 
        const url = `${base}0${i}.webp`; 
        let exists = verifiedImages[url];

        if (exists === undefined) { 
            exists = await new Promise(r => {  
                const img = new Image();  
                img.onload = () => r(true);  
                img.onerror = () => r(false);  
                img.src = url;  
            }); 
            verifiedImages[url] = exists; 
        }

        if (exists) {  
            maxPhotosFound = i;  
            updateModal();  
        } else { 
            break;  
        } 
    } 
    processPreloadQueue(currentPreloadSession);
}

function updateModal() { 
    document.getElementById('modal-img').src = `${currentGalleryPath}0${currentPhotoIndex}.webp`; 
    document.getElementById('prev-btn').style.display = currentPhotoIndex > 1 ? 'block' : 'none'; 
    document.getElementById('next-btn').style.display = currentPhotoIndex < maxPhotosFound ? 'block' : 'none';
}

function changePhoto(n) { currentPhotoIndex += n; updateModal(); }
function closeModal() { document.getElementById('photo-modal').style.display = 'none'; }

function changeLanguage(l) { 
    if (!l) return;
    currentLang = l; 
    updateLanguageUI(); // <--- Corrección añadida para actualizar visualmente la interfaz de idiomas
    renderCategories(); 
    renderMenu(); 
    managePreload();
}

function filterCategory(id) {  
    currentCat = id;  
    renderCategories(); 
    renderMenu();  
    window.scrollTo(0,0);  
    managePreload(); 
}

init();

window.addEventListener('hashchange', checkUrlHash);
window.addEventListener('DOMContentLoaded', checkUrlHash);

function checkUrlHash() { 
    const hash = window.location.hash.replace('#', ''); 
    if (hash && categoriesList.some(c => c.id === hash)) { filterCategory(hash); }
}
