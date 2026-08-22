// =========================================
// REPOSITORIO: web (PRINCIPAL)
// ARCHIVO: script.js
// =========================================

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT9rPlxpax2lE0rN97c6Hoy_OxUwREqRb48juEBr9C91ZFY2UvaKgC8JdiRcwDrtBErXFVmFRh0Zr5e/pub?gid=0&single=true&output=csv';
// NUEVO: endpoint en vivo (Código.gs, ?accion=csv) para la carga por etapas/idioma — a
// diferencia de CSV_URL (publicar en la web, cacheado por Google varios minutos), este
// se puede pedir con &idiomas=xx para traer solo las columnas que hacen falta, y siempre
// devuelve el contenido real de la hoja. CSV_URL se mantiene como último recurso si este
// endpoint fallara (p.ej. problema de CORS puntual).
const LIVE_CSV_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxonK7Du4Dq11AU7s6rNjAVa1BD9Am72ORb-w2dmcojjGFWFHEZlCzxJNtoN3DLT81R0Q/exec';
// NUEVO: idiomas que se precargan en segundo plano justo después del primer render (además
// del idioma del cliente, que siempre va primero). El resto de los 26 solo se piden bajo
// demanda, cuando alguien los elige en el selector "Más...".
const ESSENTIAL_LANGS = ['ES', 'EN', 'DE', 'FR', 'IT'];
// NUEVO: Se registra la URL actualizada del App Script para las peticiones de sincronización del sistema
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxonK7Du4Dq11AU7s6rNjAVa1BD9Am72ORb-w2dmcojjGFWFHEZlCzxJNtoN3DLT81R0Q/exec';
const APP_VERSION = 'v3.1.0'; 
// NUEVO: sello de caché para la imagen fija del vino "El Tenista" (imagenes/vinos/tenista_pegado.webp).
// Se calcula una vez al cargar la página y se añade como ?v= a la URL de la imagen en los dos
// sitios donde se usa, para que el navegador no siga sirviendo una copia cacheada antigua tras
// reemplazar el archivo en GitHub (esta imagen se inserta dinámicamente por JS, y un Ctrl+F5 no
// siempre invalida el caché de imágenes insertadas así).
const TENISTA_IMG_CACHE_BUST = Date.now();

// MODIFICADO: Agregado Coreano (KO) con su respectivo emoji compatible
const IDIOMAS = {
    ES: "🇪🇸 Español", EN: "🇬🇧 English", DE: "🇩🇪 Deutsch", FR: "🇫🇷 Français", IT: "🇮🇹 Italiano",
    RU: "🇷🇺 Русский", NL: "🇳🇱 Nederlands", PL: "🇵🇱 Polski", SV: "🇸🇪 Svenska", NO: "🇳🇴 Norsk",
    DA: "🇩🇰 Dansk", FI: "🇫🇮 Suomi", PT: "🇵🇹 Português", RO: "🇷🇴 Română", HU: "🇭🇺 Magyar",
    CS: "🇨🇿 Čeština", EL: "🇬🇷 Ελληνικά", TR: "🇹🇷 Türkçe", AR: "🇸🇪 العربية", ZH: "🇨🇳 中文", JA: "🇯🇵 日本語",
    KO: "🇰🇷 한국어",     
    CA: "🏰 Català",     
    EU: "🌳 Euskara",    
    GL: "🐙 Galego",     
    VA: "🥘 Valencià"    
};

const MENU_TEXTS = {
    ES: "Menú", EN: "Menu", DE: "Menü", FR: "Menu", IT: "Menu",
    RU: "Меню", NL: "Menu", PL: "Menu", SV: "Meny", NO: "Meny",
    DA: "Menu", FI: "Menu", PT: "Menu", RO: "Meniu", HU: "Menü",
    CS: "Menu", EL: "Μενού", TR: "Menü", AR: "قائمة", ZH: "菜单", JA: "メニュー",
    KO: "메뉴", CA: "Menú", EU: "Menu", GL: "Menú", VA: "Menú"
};

let allData = [];
let currentLang = 'ES', currentCat = '12';
let currentGalleryPath = '', currentPhotoIndex = 1, maxPhotosFound = 1;
let verifiedImages = {}; 
let preloadQueue = [];
let isPreloading = false;
let currentPreloadSession = 0;

// NUEVO (22 agosto): "let" en vez de "const" — init() reasigna esta lista tras filtrar las
// pestañas que el Web Editor Pro haya desactivado (ver fetchCategoriasDeshabilitadas()).
let categoriesList = [
    { 
        id: '12', 
        ES: 'Sugerencias', EN: 'Suggestions', DE: 'Vorschläge', FR: 'Suggestions', IT: 'Suggerimenti',
        RU: 'Предложения', NL: 'Suggesties', PL: 'Sugestie', SV: 'Förslag', NO: 'Forslag',
        DA: 'Forslag', FI: 'Suositukset', PT: 'Sugestões', RO: 'Sugestii', HU: 'Ajánlatok',
        CS: 'Doporučení', EL: 'Προτάσεις', TR: 'Öneriler', AR: 'اقتraحات', ZH: '推荐', JA: 'おすすめ',
        KO: '추천 메뉴', CA: 'Suggeriments', EU: 'Gomendioak', GL: 'Suxestións', VA: 'Suggeriments'
    }, 
    { 
        id: '1', 
        ES: 'Entrantes', EN: 'Starters', DE: 'Vorspeisen', FR: 'Entrées', IT: 'Antipasti',
        RU: 'Закуски', NL: 'Voorgerechten', PL: 'Przystawki', SV: 'Förrätter', NO: 'Forretter',
        DA: 'Forretter', FI: 'Alkuruoat', PT: 'Entradas', RO: 'Gustări', HU: 'Előételek',
        CS: 'Předkrmy', EL: 'Ορεκτικά', TR: 'Başlangıçlar', AR: 'مقبلات', ZH: '前菜', JA: '前菜',
        KO: '에피타이저', CA: 'Entrants', EU: 'Hastekoak', GL: 'Entrantes', VA: 'Entrants'
    }, 
    { 
        id: '2', 
        ES: 'Ensaladas', EN: 'Salads', DE: 'Salate', FR: 'Salades', IT: 'Insalate',
        RU: 'Салаты', NL: 'Salades', PL: 'Sałatky', SV: 'Sallader', NO: 'Salater',
        DA: 'Salater', FI: 'Salaatit', PT: 'Saladas', RO: 'Salate', HU: 'Saláták',
        CS: 'Saláty', EL: 'Σαλάτες', TR: 'Salatalar', AR: 'سلطات', ZH: '沙拉', JA: 'サラダ',
        KO: '샐러드', CA: 'Amanides', EU: 'Entsaladak', GL: 'Ensaladas', VA: 'Amanides'
    }, 
    { 
        id: '3', 
        ES: 'Arroces & Pastas', EN: 'Rice & Pasta', DE: 'Reis & Pasta', FR: 'Riz & Pâtes', IT: 'Riso e Pasta',
        RU: 'Рис и паста', NL: 'Rijst & Pasta', PL: 'Ryż i Makaron', SV: 'Ris & Pasta', NO: 'Ris og pasta',
        DA: 'Ris & Pasta', FI: 'Riisi & Pasta', PT: 'Arroz e Massa', RO: 'Orez și paste', HU: 'Rizs és tészták',
        CS: 'Rýže a těstoviny', EL: 'Ρύζι & Ζυμαρικά', TR: 'Pilav & Makarna', AR: 'أرز وباستا', ZH: '米饭与面食', JA: 'ライス＆パスタ',
        KO: '라이스 & 파스타', CA: 'Arrossos i Pastes', EU: 'Arrozak eta Pastak', GL: 'Arroces e Pastas', VA: 'Arrossos i Pastes'
    }, 
    { 
        id: '4', 
        ES: 'Recetas', EN: 'Recipes', DE: 'Rezepte', FR: 'Recettes', IT: 'Ricette',
        RU: 'Рецепты', NL: 'Recepten', PL: 'Przepisy', SV: 'Recept', NO: 'Oppskrifter',
        DA: 'Opskrifter', FI: 'Reseptit', PT: 'Receitas', RO: 'Rețete', HU: 'Receptek',
        CS: 'Recepty', EL: 'Συνταγές', TR: 'Tarifler', AR: 'وصفات', ZH: '特色菜', JA: 'レシピ',
        KO: '스페셜 요리', CA: 'Receptes', EU: 'Erreceptak', GL: 'Receitas', VA: 'Receptes'
    }, 
    { 
        id: '5', 
        ES: 'Principales', EN: 'Mains', DE: 'Hauptspeisen', FR: 'Plats', IT: 'Piatti',
        RU: 'Основные блюда', NL: 'Hoofdgerechten', PL: 'Dania główne', SV: 'Huvudrätter', NO: 'Hovedrätter',
        DA: 'Hovedretter', FI: 'Pääruoat', PT: 'Pratos principales', RO: 'Feluri principale', HU: 'Főételek',
        CS: 'Hlavní jídla', EL: 'Κυρίως Πιάτα', TR: 'Ana Yemekler', AR: 'أطباق رئيسية', ZH: '主菜', JA: 'メインディッシュ',
        KO: '메인 요리', CA: 'Principals', EU: 'Plater Nagusiak', GL: 'Principais', VA: 'Principals'
    }, 
    { 
        id: '7', 
        ES: 'Niños', EN: 'Kids', DE: 'Kinder', FR: 'Enfants', IT: 'Bambini',
        RU: 'Детское menu', NL: 'Kinderen', PL: 'Dla dzieci', SV: 'Barn', NO: 'Barn',
        DA: 'Børn', FI: 'Lapset', PT: 'Crianças', RO: 'Copii', HU: 'Gyerekeknek',
        CS: 'Pro děti', EL: 'Παιδικά', TR: 'Çocuklar', AR: 'أطفال', ZH: '儿童餐', JA: 'キッズメニュー',
        KO: '어린이 메뉴', CA: 'Nens', EU: 'Umeak', GL: 'Nenos', VA: 'Xiquets'
    }, 
    { 
        id: '8', 
        ES: 'Postres', EN: 'Desserts', DE: 'Desserts', FR: 'Desserts', IT: 'Dolci',
        RU: 'Десерты', NL: 'Desserts', PL: 'Desery', SV: 'Efterrätter', NO: 'Desesser',
        DA: 'Desesser', FI: 'Jälkiruoat', PT: 'Sobremesas', RO: 'Deserturi', HU: 'Desszertek',
        CS: 'Dezerty', EL: 'Επιδόρπια', TR: 'Tatlılar', AR: 'حلويات', ZH: '甜点', JA: 'デザート',
        KO: '디저트', CA: 'Postres', EU: 'Postreak', GL: 'Postres', VA: 'Postres'
    }, 
    { 
        id: '9', 
        ES: 'Café', EN: 'Coffee', DE: 'Kaffee', FR: 'Café', IT: 'Caffè',
        RU: 'Кофе', NL: 'Koffie', PL: 'Kawa', SV: 'Kaffe', NO: 'Kaffe',
        DA: 'Kaffe', FI: 'Kahvi', PT: 'Café', RO: 'Cafea', HU: 'Kávé',
        CS: 'Káva', EL: 'Καφές', TR: 'Kahve', AR: 'قهوة', ZH: '咖啡', JA: 'コーヒー',
        KO: '커피', CA: 'Cafè', EU: 'Kafea', GL: 'Café', VA: 'Cafè'
    }, 
    { 
        id: '10', 
        ES: 'Bebidas', EN: 'Drinks', DE: 'Getränke', FR: 'Boissons', IT: 'Bibite',
        RU: 'Напитки', NL: 'Dranken', PL: 'Napoje', SV: 'Drycker', NO: 'Drikke',
        DA: 'Drikkevarer', FI: 'Juomat', PT: 'Bebidas', RO: 'Băuturi', HU: 'Italok',
        CS: 'Nápoje', EL: 'Ποτά', TR: 'İçecekler', AR: 'مشروبات', ZH: '饮料', JA: 'ドリンク',
        KO: '음료', CA: 'Begudes', EU: 'Edariak', GL: 'Bebidas', VA: 'Begudes'
    }, 
    { 
        id: '11', 
        ES: 'Cervezas', EN: 'Beers', DE: 'Biere', FR: 'Bières', IT: 'Birre',
        RU: 'Пиво', NL: 'Bieren', PL: 'Piwa', SV: 'Öl', NO: 'Øl',
        DA: 'Øl', FI: 'Olutta', PT: 'Cervejas', RO: 'Beri', HU: 'Sörök',
        CS: 'Priva', EL: 'Μπύρες', TR: 'Biralar', AR: 'بيرة', ZH: '啤酒', JA: 'ビール',
        KO: '맥주', CA: 'Cerveses', EU: 'Garagardoak', GL: 'Cerveses', VA: 'Cerveses'
    }, 
    { 
        id: '131', 
        ES: 'Vinos Blancos', EN: 'White Wines', DE: 'Weissweine', FR: 'Vins Blancs', IT: 'Vini Bianchi',
        RU: 'Белые вина', NL: 'Witte wijnen', PL: 'Białe wina', SV: 'Vita viner', NO: 'Hvite viner',
        DA: 'Hvidvine', FI: 'Valkoviinit', PT: 'Vinhos brancos', RO: 'Vinuri albe', HU: 'Fehérborok',
        CS: 'Bílá vína', EL: 'Λευκά Κρασιά', TR: 'Beyaz Şaraplar', AR: 'نبيذ أبيض', ZH: '白葡萄酒', JA: '白ワイン',
        KO: '화이트 와인', CA: 'Vins Blancs', EU: 'Ardo Zuriak', GL: 'Viños Brancos', VA: 'Vins Blancs'
    }, 
    { 
        id: '132', 
        ES: 'Vinos Rosados', EN: 'Rosé Wines', DE: 'Roséweine', FR: 'Vins Rosés', IT: 'Vini Rosati',
        RU: 'Розовые вина', NL: 'Rosé wijnen', PL: 'Wina różowe', SV: 'Roséviner', NO: 'Roséviner',
        DA: 'Rosévine', FI: 'Roséviinit', PT: 'Vinhos rosés', RO: 'Vinuri roze', HU: 'Rozé borok',
        CS: 'Růžová vína', EL: 'Ροζέ Κρασιά', TR: 'Roze Şaraplar', AR: 'نبيذ روزيه', ZH: '桃红葡萄酒', JA: 'ロゼワイン',
        KO: '로제 와인', CA: 'Vins Rosats', EU: 'Ardo Arrosak', GL: 'Viños Rosados', VA: 'Vins Rosats'
    }, 
    { 
        id: '133', 
        ES: 'Vinos Tintos', EN: 'Red Wines', DE: 'Rotweine', FR: 'Vins Rouges', IT: 'Vini Rossi',
        RU: 'Красные вина', NL: 'Rode wijnen', PL: 'Czerwone wina', SV: 'Röda viner', NO: 'Røde viner',
        DA: 'Rødvine', FI: 'Punaviinit', PT: 'Vinhos tintos', RO: 'Vinuri roșii', HU: 'Vörösborok',
        CS: 'Červená vína', EL: 'Κόκκινα Κρασιά', TR: 'Kırmızı Şaraplar', AR: 'نبيذ أحمر', ZH: '红葡萄酒', JA: '赤ワイン',
        KO: '레드 와인', CA: 'Vins Negres', EU: 'Ardo Beltzak', GL: 'Viños Tintos', VA: 'Vins Negres'
    }, 
    { 
        id: '134', 
        ES: 'Cavas & Champagne', EN: 'Cava & Champagne', DE: 'Cava & Champagne', FR: 'Cava & Champagne', IT: 'Cava & Champagne',
        RU: 'Кава и Шампанское', NL: 'Cava & Champagne', PL: 'Cava i Szampan', SV: 'Cava & Champagne', NO: 'Cava og champagne',
        DA: 'Cava & Champagne', FI: 'Cava & Samppanja', PT: 'Cavas e Champagne', RO: 'Cava & Șampanie', HU: 'Cava és pezsgők',
        CS: 'Cava a Šampaňské', EL: 'Cava & Σαμπάνια', TR: 'Kava & Şampanya', AR: 'كافا وشامبانيا', ZH: '卡瓦与香槟', JA: 'カヴァ＆シャンパン',
        KO: '카바 & 샴페인', CA: 'Caves i Xampany', EU: 'Cabak eta Xanpaina', GL: 'Cavas e Champán', VA: 'Caves i Xampany'
    }
];

const subCatsLang = {
    mallorca: {
        ES: 'Vinos de Mallorca', EN: 'Majorcan Wines', DE: 'Weine aus Mallorca', FR: 'Vins de Majorque', IT: 'Vini di Maiorca',
        RU: 'Мальорканские вина', NL: 'Mallorquijnse wijnen', PL: 'Wina z Majorki', SV: 'Mallorkinska viner', NO: 'Mallorcanske viner',
        DA: 'Mallorcanske vine', FI: 'Mallorcalaiset viinit', PT: 'Vinhos de Maiorca', RO: 'Vinuri de Mallorca', HU: 'Mallorcai borok',
        CS: 'Mallorská vína', EL: 'Κρασιά της Μαγιόρκα', TR: 'Mallorca Şarapları', AR: 'نبيذ مايوركا', ZH: '马略卡葡萄酒', JA: 'マヨルカワイン',
        KO: '마요르카 와인', CA: 'Vins de Mallorca', EU: 'Mallorcako Ardoak', GL: 'Viños de Mallorca', VA: 'Vins de Mallorca'
    },
    copas: {
        ES: 'Copas', EN: 'By the Glass', DE: 'Glasweise', FR: 'Au Verre', IT: 'Al Calice',
        RU: 'По бокалам', NL: 'Per glas', PL: 'Na kieliszki', SV: 'Glasvis', NO: 'Glassvis',
        DA: 'Pr. glas', FI: 'Laseittain', PT: 'A copo', RO: 'La pahar', HU: 'Pohárral',
        CS: 'Rozlévaná vína', EL: 'Σε Πoτήρι', TR: 'Kadehte', AR: 'بأقداح الكأس', ZH: '杯装酒', JA: 'グラスワイン',
        KO: '글라스 와인', CA: 'Copes', EU: 'Kopak', GL: 'Copas', VA: 'Copes'
    },
    otras: {
        ES: 'Otras D.O.', EN: 'Other D.O.', DE: 'Andere D.O.', FR: 'Autres D.O.', IT: 'Altre D.O.',
        RU: 'Другие D.O.', NL: 'Overige D.O.', PL: 'Inne D.O.', SV: 'Andra D.O.', NO: 'Andre D.O.',
        DA: 'Andre D.O.', FI: 'Muut D.O.', PT: 'Outras D.O.', RO: 'Alte D.O.', HU: 'Egyéb D.O.',
        CS: 'Ostatní D.O.', EL: 'Άλλες D.O.', TR: 'Diğer D.O.', AR: 'تسميات منشأ أخرى', ZH: '其他D.O.产区', JA: 'その他のD.O.',
        KO: '기타 D.O. 원산지', CA: 'Altres D.O.', EU: 'Beste J.I.', GL: 'Outras D.O.', VA: 'Altres D.O.'
    },
    galicia: {
        ES: 'Galicia', EN: 'Galicia', DE: 'Galicien', FR: 'Galice', IT: 'Galizia',
        RU: 'Галисия', NL: 'Galicië', PL: 'Galcja', SV: 'Galicien', NO: 'Galicia',
        DA: 'Galicien', FI: 'Galicia', PT: 'Galiza', RO: 'Galicia', HU: 'Galícia',
        CS: 'Galicie', EL: 'Γαλικία', TR: 'Galiçya', AR: 'غاليسيا', ZH: '加利西亚', JA: 'ガリシア',
        KO: '갈리시아', CA: 'Galícia', EU: 'Galizia', GL: 'Galicia', VA: 'Galícia'
    },
    rueda: {
        ES: 'Rueda', EN: 'Rueda', DE: 'Rueda', FR: 'Rueda', IT: 'Rueda',
        RU: 'Руэда', NL: 'Rueda', PL: 'Rueda', SV: 'Rueda', NO: 'Rueda',
        DA: 'Rueda', FI: 'Rueda', PT: 'Rueda', RO: 'Rueda', HU: 'Rueda',
        CS: 'Rueda', EL: 'Ρουέδα', TR: 'Rueda', AR: 'رويدا', ZH: '卢埃达', JA: 'ルエダ',
        KO: '루에다', CA: 'Rueda', EU: 'Rueda', GL: 'Rueda', VA: 'Rueda'
    },
    rioja: {
        ES: 'Rioja', EN: 'Rioja', DE: 'Rioja', FR: 'Rioja', IT: 'Rioja',
        RU: 'Риоха', NL: 'Rioja', PL: 'Rioja', SV: 'Rioja', NO: 'Rioja',
        DA: 'Rioja', FI: 'Rioja', PT: 'Rioja', RO: 'Rioja', HU: 'Rioja',
        CS: 'Rioja', EL: 'Ριόχα', TR: 'Rioja', AR: 'ريوخا', ZH: '里奥哈', JA: 'リオハ',
        KO: '리오하', CA: 'Rioja', EU: 'Errioxa', GL: 'Rioja', VA: 'Rioja'
    },
    ribera: {
        ES: 'Ribera', EN: 'Ribera', DE: 'Ribera', FR: 'Ribera', IT: 'Ribera',
        RU: 'Рибера', NL: 'Ribera', PL: 'Ribera', SV: 'Ribera', NO: 'Ribera',
        DA: 'Ribera', FI: 'Ribera', PT: 'Ribera', RO: 'Ribera', HU: 'Ribera',
        CS: 'Ribera', EL: 'Ριμπέρα', TR: 'Ribera', AR: 'ريبيرا', ZH: '杜埃罗河岸', JA: 'リベラ',
        KO: '리베라', CA: 'Ribera', EU: 'Erribera', GL: 'Ribera', VA: 'Ribera'
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

// NUEVO: títulos de los 4 grupos reales de la categoría 12 (Sugerencias del Chef), calcados
// de la agrupación que ya usa el admin en sugerencias-print.js (procesarYRender): Entrantes
// (12100-12399), Principales (12400-12899, incluye pasta/arroz/pescado/carne juntos), Postres
// (12900-12999) y Bodega/Vino (excepción: solo el ID 12990, aunque cae dentro del rango
// numérico de postres). Reutiliza traducciones ya existentes en categoriesList donde coinciden.
const sugerenciasGroupTitles = {
    entrantes: {
        ES: 'Entrantes', EN: 'Starters', DE: 'Vorspeisen', FR: 'Entrées', IT: 'Antipasti',
        RU: 'Закуски', NL: 'Voorgerechten', PL: 'Przystawki', SV: 'Förrätter', NO: 'Forretter',
        DA: 'Forretter', FI: 'Alkuruoat', PT: 'Entradas', RO: 'Gustări', HU: 'Előételek',
        CS: 'Předkrmy', EL: 'Ορεκτικά', TR: 'Başlangıçlar', AR: 'مقبلات', ZH: '前菜', JA: '前菜',
        KO: '에피타이저', CA: 'Entrants', EU: 'Hastekoak', GL: 'Entrantes', VA: 'Entrants'
    },
    principales: {
        ES: 'Principales', EN: 'Mains', DE: 'Hauptspeisen', FR: 'Plats', IT: 'Piatti',
        RU: 'Основные блюда', NL: 'Hoofdgerechten', PL: 'Dania główne', SV: 'Huvudrätter', NO: 'Hovedrätter',
        DA: 'Hovedretter', FI: 'Pääruoat', PT: 'Pratos principales', RO: 'Feluri principale', HU: 'Főételek',
        CS: 'Hlavní jídla', EL: 'Κυρίως Πιάτα', TR: 'Ana Yemekler', AR: 'أطباق رئيسية', ZH: '主菜', JA: 'メインディッシュ',
        KO: '메인 요리', CA: 'Principals', EU: 'Plater Nagusiak', GL: 'Principais', VA: 'Principals'
    },
    postres: {
        ES: 'Postres', EN: 'Desserts', DE: 'Desserts', FR: 'Desserts', IT: 'Dolci',
        RU: 'Десерты', NL: 'Desserts', PL: 'Desery', SV: 'Efterrätter', NO: 'Desesser',
        DA: 'Desesser', FI: 'Jälkiruoat', PT: 'Sobremesas', RO: 'Deserturi', HU: 'Desszertek',
        CS: 'Dezerty', EL: 'Επιδόρπια', TR: 'Tatlılar', AR: 'حلويات', ZH: '甜点', JA: 'デザート',
        KO: '디저트', CA: 'Postres', EU: 'Postreak', GL: 'Postres', VA: 'Postres'
    },
    vinos: {
        ES: 'Vino', EN: 'Wine', DE: 'Wein', FR: 'Vin', IT: 'Vino',
        RU: 'Вино', NL: 'Wijn', PL: 'Wino', SV: 'Vin', NO: 'Vin',
        DA: 'Vin', FI: 'Viini', PT: 'Vinho', RO: 'Vin', HU: 'Bor',
        CS: 'Víno', EL: 'Κρασί', TR: 'Şarap', AR: 'نبيذ', ZH: '葡萄酒', JA: 'ワイン',
        KO: '와인', CA: 'Vi', EU: 'Ardoa', GL: 'Viño', VA: 'Vi'
    }
};

// REESCRITO: antes se descargaban las 26 columnas de nombre + info de golpe en un único
// fetch (~470 KB con los datos actuales). Ahora se hace en 3 niveles de prioridad:
//  1) Idioma del cliente (+ ES, que se usa siempre como referencia secundaria bajo el
//     nombre principal) -> primer render lo antes posible.
//  2) Los 5 idiomas esenciales (ES/EN/DE/FR/IT) -> se piden en segundo plano justo después,
//     sin bloquear lo que ya se ve en pantalla.
//  3) El resto de los 26 idiomas -> solo se piden bajo demanda, si alguien los elige en el
//     selector "Más..." (ver changeLanguage).
// Si el endpoint en vivo fallara por lo que sea, se cae automáticamente al CSV_URL de
// siempre (con todas las columnas) para no dejar la web sin datos.
// NUEVO: lee la hoja "Categorias" del backend (Código.gs, ?accion=categorias) y devuelve el
// Set de ids de pestaña que están desactivadas (activa=NO). Si algo falla (red, endpoint aún
// no actualizado, etc.) devuelve un Set vacío — es decir, se muestran TODAS las pestañas, el
// mismo comportamiento de siempre. Nunca debe poder romper la carga del menú.
async function fetchCategoriasDeshabilitadas() {
    try {
        const url = `${LIVE_CSV_ENDPOINT}?accion=categorias&zx=${Date.now()}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const text = await response.text();
        const filas = text.split(/\r?\n/).filter(f => f.trim() !== '');
        const deshabilitadas = new Set();
        filas.forEach((f, i) => {
            if (i === 0) return; // cabecera "ID,Activa"
            const c = f.split(',');
            const id = (c[0] || '').trim();
            const activa = (c[1] || '').trim().toUpperCase();
            if (id && activa === 'NO') deshabilitadas.add(id);
        });
        return deshabilitadas;
    } catch (e) {
        console.warn('[Pestañas] No se pudo comprobar qué secciones están desactivadas, se muestran todas:', e.message);
        return new Set();
    }
}

async function init() {
    try {
        injectVisualIndicatorStyles();
        populateLanguageSelect();

        const userLang = (navigator.language || navigator.userLanguage).split('-')[0].toUpperCase();
        currentLang = IDIOMAS[userLang] ? userLang : 'EN';

        const idiomasEtapa1 = Array.from(new Set([currentLang, 'ES']));

        // NUEVO: se pide en paralelo con la carga de platos (no depende de ella) para no
        // añadir latencia al primer render.
        const categoriasPromise = fetchCategoriasDeshabilitadas();

        try {
            allData = await fetchAndParseCsv(idiomasEtapa1);
        } catch (e) {
            console.warn('[Carga por etapas] Fallo en el endpoint en vivo, usando CSV completo de reserva:', e.message);
            const response = await fetch(CSV_URL);
            const csvText = await response.text();
            allData = parseCSV(csvText);
        }

        // NUEVO: aplicar las pestañas desactivadas ANTES del primer renderCategories(), para
        // que el botón de una pestaña oculta no llegue a pintarse ni un instante. Si currentCat
        // (por defecto '12', o lo que haya dejado un checkUrlHash muy tempranero) apuntara
        // justo a la que se acaba de ocultar, se cae a la primera pestaña que quede.
        const categoriasDeshabilitadas = await categoriasPromise;
        if (categoriasDeshabilitadas.size > 0) {
            categoriesList = categoriesList.filter(c => !categoriasDeshabilitadas.has(c.id));
            if (!categoriesList.some(c => c.id === currentCat)) {
                currentCat = categoriesList.length > 0 ? categoriesList[0].id : currentCat;
            }
        }

        if (allData.length > 0) {
            renderCategories();
            renderMenu();
            updateLanguageUI();
            managePreload();
            setupScrollListener();
        }

        // NUEVO: etapa 2 en segundo plano — no se espera ni bloquea el primer render.
        const idiomasPendientesEsenciales = ESSENTIAL_LANGS.filter(l => !idiomasEtapa1.includes(l));
        const etapa2 = idiomasPendientesEsenciales.length > 0
            ? fetchAndParseCsv(idiomasPendientesEsenciales).then(items => mergeIntoAllData(items)).catch(e => console.warn('[Carga por etapas] No se pudieron precargar los idiomas esenciales restantes:', e.message))
            : Promise.resolve();

        // NUEVO: etapa 3 — el resto de los 26 idiomas, en segundo plano y SOLO después de que
        // la etapa 2 termine (para no competir por ancho de banda con lo prioritario). Pesa
        // poco por idioma (nombres cortos, sin INFO_* salvo en ES/EN), así que en conexiones
        // normales no cuesta nada tenerlo ya listo si alguien acaba abriendo el selector
        // "Más...". Si la conexión es lenta (Save-Data / 2G / 3G), se salta esta etapa.
        etapa2.then(() => {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (conn && (conn.saveData || /2g|3g/.test(conn.effectiveType || ''))) return;

            const idiomasRestantes = Object.keys(IDIOMAS).filter(l => !idiomasEtapa1.includes(l) && !ESSENTIAL_LANGS.includes(l));
            if (idiomasRestantes.length === 0) return;
            fetchAndParseCsv(idiomasRestantes)
                .then(items => mergeIntoAllData(items))
                .catch(e => console.warn('[Carga por etapas] No se pudo precargar el resto de idiomas:', e.message));
        });
    } catch (e) { console.error("Error en la inicialización:", e); }
}

function injectVisualIndicatorStyles() {
    if (document.getElementById('indicator-styles')) return;
    const style = document.createElement('style');
    style.id = 'indicator-styles';
    style.textContent = `
        .nav-container-interactive {
            position: relative;
            width: 100%;
            margin-bottom: 5px;
        }
        #category-selector {
            display: flex;
            overflow-x: auto;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            white-space: nowrap;
            padding-right: 50px !important;
        }
        #category-selector::-webkit-scrollbar {
            display: none;
        }
        .scroll-hint-hand {
            position: absolute;
            right: 25px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 24px;
            pointer-events: none;
            z-index: 100;
            opacity: 0.85;
            background: rgba(255,255,255,0.9);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            animation: swipeHand 1.6s ease-in-out infinite;
            transition: opacity 0.4s ease, transform 0.4s ease;
        }
        @keyframes swipeHand {
            0% { transform: translateY(-50%) translateX(10px); opacity: 0; }
            30% { opacity: 0.9; }
            70% { transform: translateY(-50%) translateX(-35px); opacity: 0.9; }
            100% { transform: translateY(-50%) translateX(-45px); opacity: 0; }
        }
        .nav-container-interactive::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 45px;
            height: 100%;
            background: linear-gradient(to right, rgba(255,255,255,0), rgba(255, 255, 255, 0.95));
            pointer-events: none;
            z-index: 5;
        }
    `;
    document.head.appendChild(style);
}

function setupScrollListener() {
    const selector = document.getElementById('category-selector');
    if (!selector) return;

    const hideHint = () => {
        const hint = document.querySelector('.scroll-hint-hand');
        if (hint) {
            hint.style.opacity = '0';
            hint.style.transform = 'translateY(-50%) scale(0.5)';
            setTimeout(() => hint.remove(), 400); 
        }
        selector.removeEventListener('scroll', hideHint);
        selector.removeEventListener('touchstart', hideHint);
    };

    selector.addEventListener('scroll', hideHint);
    selector.addEventListener('touchstart', hideHint);
}

function populateLanguageSelect() {
    const select = document.getElementById('more-langs');
    if (!select) return;
     
    select.innerHTML = '<option value="">🌐 Más...</option>';
     
    const ordenPrioritario = ['CA', 'EU', 'VA', 'GL'];
    
    ordenPrioritario.forEach(code => {
        if (IDIOMAS[code]) {
            const opt = document.createElement('option');
            opt.value = code;
            opt.textContent = IDIOMAS[code];
            select.appendChild(opt);
        }
    });
    
    Object.entries(IDIOMAS).forEach(([code, name]) => {
        if (!['ES','EN','DE','FR','IT'].includes(code) && !ordenPrioritario.includes(code)) {
            const opt = document.createElement('option');
            opt.value = code;
            opt.textContent = name; 
            select.appendChild(opt);
        }
    });
}

function updateLanguageUI() {
    const menuTitleEl = document.getElementById('header-menu-title');
    if (menuTitleEl) {
        menuTitleEl.textContent = MENU_TEXTS[currentLang] || MENU_TEXTS['ES'];
    }

    document.querySelectorAll('#language-selector button').forEach(b => {
        b.classList.remove('active');
        const code = b.id.replace('btn-', '');
        if (IDIOMAS[code]) {
            b.textContent = IDIOMAS[code];
        }
    });
     
    const btn = document.getElementById(`btn-${currentLang}`);
    const select = document.getElementById('more-langs');
     
    if (btn) {
        btn.classList.add('active');
        if (select) select.value = '';
    } else {
        if (select) select.value = currentLang;
    }
}

// REESCRITO: antes leía por POSICIÓN fija de columna (col[0]..col[31], info a partir de la
// 32 en orden alfabético fijo). Eso rompía en cuanto el CSV traía menos columnas (como los
// que ahora sirve LIVE_CSV_ENDPOINT con &idiomas=). Ahora lee la fila de cabeceras y mapea
// por NOMBRE, así funciona igual de bien con el CSV completo (26 idiomas) que con uno
// parcial (p.ej. solo Nombre_KO/INFO_KO). Un nombre_xx / info_xx que no venga en este CSV se
// deja "undefined" a propósito — así isLangLoaded() puede distinguir "aún no cargado" de
// "cargado pero vacío".
function parseCSV(text) {
    const rows = [];
    const lines = text.split(/\r?\n(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (lines.length < 2) return rows;

    const clean = (val) => val ? val.replace(/^"|"$/g, '').replace(/""/g, '"').trim() : "";

    const headerCols = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => clean(h).toUpperCase());
    const idx = {};
    headerCols.forEach((h, i) => { if (h) idx[h] = i; });
    if (idx['ID'] === undefined) return rows;

    for (let i = 1; i < lines.length; i++) {
        const col = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const get = (headerName) => {
            const colIdx = idx[headerName];
            return (colIdx !== undefined && col[colIdx] !== undefined) ? clean(col[colIdx]) : undefined;
        };

        const idVal = get('ID');
        if (!idVal) continue;

        const item = {
            id: idVal,
            precio: (get('PRECIO') || '0').replace(',', '.'),
            activa: (get('ACTIVA') || '').toUpperCase(),
            carpeta: get('CARPETA') || '',
            archivo: get('ARCHIVO_FOTO') || '',
            alergenos: (() => { const a = get('ALERGENOS_COD'); return a ? a.split(',').map(x => x.trim()).filter(x => x) : []; })()
        };

        Object.keys(idx).forEach(h => {
            if (h.indexOf('NOMBRE_') === 0) {
                item[`nombre_${h.replace('NOMBRE_', '').toLowerCase()}`] = get(h) || '';
            } else if (h.indexOf('INFO_') === 0) {
                item[`info_${h.replace('INFO_', '').toLowerCase()}`] = get(h) || '';
            }
        });

        rows.push(item);
    }
    return rows;
}

// NUEVO: pide al endpoint en vivo solo las columnas de los idiomas indicados.
async function fetchAndParseCsv(langs) {
    const idiomasParam = langs.join(',');
    const url = `${LIVE_CSV_ENDPOINT}?accion=csv&idiomas=${encodeURIComponent(idiomasParam)}&zx=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const text = await response.text();
    return parseCSV(text);
}

// NUEVO: mezcla un lote recién descargado (de un idioma o grupo de idiomas) en allData sin
// pisar lo que ya hubiera de otros idiomas — busca por id y solo añade/actualiza las claves
// nombre_*/info_* que traiga este lote.
function mergeIntoAllData(newItems) {
    const byId = {};
    allData.forEach(it => { byId[it.id] = it; });
    newItems.forEach(ni => {
        const existente = byId[ni.id];
        if (existente) {
            Object.keys(ni).forEach(k => {
                if (k.startsWith('nombre_') || k.startsWith('info_')) existente[k] = ni[k];
            });
        } else {
            allData.push(ni);
            byId[ni.id] = ni;
        }
    });
}

// NUEVO: ¿ya tenemos descargado el nombre de ese idioma para los platos? (undefined = nunca
// se pidió esa columna todavía; '' = se pidió y está vacía, que es distinto).
function isLangLoaded(lang) {
    if (allData.length === 0) return false;
    return allData[0][`nombre_${lang.toLowerCase()}`] !== undefined;
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
    if (!nav) return;

    if (nav.parentNode && !nav.parentNode.classList.contains('nav-container-interactive')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'nav-container-interactive';
        nav.parentNode.insertBefore(wrapper, nav);
        wrapper.appendChild(nav);
         
        const handHint = document.createElement('div');
        handHint.className = 'scroll-hint-hand';
        handHint.innerHTML = '👉'; 
        wrapper.appendChild(handHint);
    }

    nav.innerHTML = categoriesList.map(c => {
        const catName = c[currentLang] || c['EN'] || c['ES'];
        const finalLabel = currentLang === 'ES' ? catName : `${catName} - ${c['ES']}`;
        return `<button onclick="filterCategory('${c.id}')" class="cat-btn ${currentCat === c.id ? 'active' : ''}">${finalLabel}</button>`;
    }).join('');
}

function renderMenu() { 
    const grid = document.getElementById('items-list'), title = document.getElementById('current-category-name'); 
    const catObj = categoriesList.find(c => c.id === currentCat); 
     
    const catName = catObj ? (catObj[currentLang] || catObj['EN'] || catObj['ES']) : "";
    const translatedTitle = currentLang === 'ES' ? catName : `${catName} - ${catObj['ES']}`;
     
    if (title) title.innerHTML = `${translatedTitle} <span style="font-size: 0.4em; opacity: 0.5; font-weight: normal; margin-left: 10px;">${APP_VERSION}</span>`; 
    if (grid) grid.innerHTML = '';

    const filtered = allData.filter(item => { 
        return isItemInCategory(item.id, currentCat) && item.activa === 'SI' && (item.id % 1000 !== 0); 
    });

    if (currentCat === '12') {
        // NUEVO: Sugerencias se agrupa en 4 bloques fijos, igual que hace el admin en
        // sugerencias-print.js — NO por rango contiguo de ID como los vinos, porque el ID
        // 12990 es una excepción de vino que cae numéricamente dentro del bloque de postres.
        let entrantes = [], principales = [], postres = [], vinosSug = [];
        filtered.forEach(item => {
            const idNum = parseInt(item.id, 10);
            if (idNum === 12990) vinosSug.push(item);
            else if (idNum >= 12100 && idNum <= 12399) entrantes.push(item);
            else if (idNum >= 12400 && idNum <= 12899) principales.push(item);
            else if (idNum >= 12900 && idNum <= 12999) postres.push(item);
            else entrantes.push(item);
        });
        const renderSugGroup = (titleObj, lista) => {
            if (lista.length === 0 || !grid) return;
            const catName = titleObj[currentLang] || titleObj['EN'] || titleObj['ES'];
            const finalName = currentLang === 'ES' ? catName : `${catName} - ${titleObj['ES']}`;
            grid.innerHTML += `<h3 class="sub-category-title">${finalName}</h3>`;
            lista.forEach(p => { grid.innerHTML += generateItemHtml(p); });
        };
        renderSugGroup(sugerenciasGroupTitles.entrantes, entrantes);
        renderSugGroup(sugerenciasGroupTitles.principales, principales);
        renderSugGroup(sugerenciasGroupTitles.postres, postres);
        renderSugGroup(sugerenciasGroupTitles.vinos, vinosSug);
    } else {
        let currentActiveSubCatName = "";
        filtered.forEach(item => {
            const idNum = parseInt(item.id);
            if (currentCat.startsWith('13')) {
                const foundSub = wineSubCats.find(s => idNum >= s.start && idNum <= s.end);
                if (foundSub && grid) {
                    const subCatName = foundSub[currentLang] || foundSub['EN'] || foundSub['ES'];
                    const finalSubName = currentLang === 'ES' ? subCatName : `${subCatName} - ${foundSub['ES']}`;
                    if (finalSubName !== currentActiveSubCatName) {
                        grid.innerHTML += `<h3 class="sub-category-title">${finalSubName}</h3>`;
                        currentActiveSubCatName = finalSubName;
                    }
                }
            }
            if (grid) grid.innerHTML += generateItemHtml(item);
        });
    }

    if (currentCat === '5') { 
        const guarnis = allData.filter(item => item.id.toString().startsWith('6') && item.id.toString().length === 4 && item.activa === 'SI'); 
        if (guarnis.length > 0 && grid) { 
            const guarniTitles = { 
                ES: 'Guarniciones', EN: 'Side Dishes', DE: 'Beilagen', FR: 'Garnitures', IT: 'Contorni',
                KO: '사이드 메뉴', CA: 'Guarnicions', EU: 'Garnizioak', GL: 'Guarnicións', VA: 'Guarnicions' 
            }; 
            const titleText = guarniTitles[currentLang] || guarniTitles['EN'] || guarniTitles['ES']; 
            const finalGuarniTitle = currentLang === 'ES' ? titleText : `${titleText} - ${guarniTitles['ES']}`;
            grid.innerHTML += `<h3 class="sub-category-title">${finalGuarniTitle}</h3>`; 
            guarnis.forEach(g => grid.innerHTML += generateItemHtml(g, true)); 
        } 
    }
}

// NUEVO: helpers para pasar el JSON de info_* al onclick sin que ninguna comilla, apóstrofe
// o barra invertida del texto pueda romper el HTML/JS generado (ver showInfoModal).
function utf8ToB64(str) { return btoa(unescape(encodeURIComponent(str))); }
function b64ToUtf8(str) { return decodeURIComponent(escape(atob(str))); }

// MODIFICADO: Lógica para incluir el icono de información dinámico y el manejo del popup de preguntas/respuestas
function generateItemHtml(item, isGuarni = false) { 
    const processName = (text) => { 
        if (!text) return { name: '', uvas: '' }; 
        const parts = text.split('//').map(p => p.trim()).filter(p => p !== ""); 
        return { name: parts[0] || '', uvas: parts[1] || '' }; 
    }; 

    const currentData = processName(item[`nombre_${currentLang.toLowerCase()}`] || item.nombre_es); 
    const secondaryData = processName(item.nombre_es); 

    const price = (isGuarni && parseInt(item.id) < 6100) ? '' : (parseFloat(item.precio) > 0 ? `${parseFloat(item.precio).toFixed(2)}€` : ''); 
    const alergenosHtml = item.alergenos.map(a => `<img src="imagenes/alergenos/${a}.webp" loading="lazy" onerror="this.style.display='none'">`).join('');  
     
    let photoIcon = ''; 
    let clickAction = ''; 
    let clickableStyle = '';

    if (item.archivo && item.archivo.includes('01.webp')) { 
        const base = `imagenes/${item.carpeta}/${item.archivo.split('01.webp')[0]}`; 
        photoIcon = `<span class="emoji-photo">📸</span>`; 
        clickAction = `onclick="openGallery('${base}')"`; 
        clickableStyle = 'style="cursor: pointer;"'; 
    }

    // NUEVO: el plato ID 12990 (vino "El Tenista" en Sugerencias) muestra además una miniatura
    // FIJA y siempre visible en la propia fila (no detrás de un clic, no sustituye el sistema
    // de galería normal de arriba) — pequeña a propósito para no comerse la pantalla de
    // Sugerencias. Ver CSS .tenista-inline-thumb.
    // CORREGIDO: se añade ?v=timestamp a la URL para evitar que el navegador sirva una copia
    // cacheada antigua de la imagen tras reemplazarla en GitHub (Ctrl+F5 no siempre invalida
    // el caché de imágenes insertadas dinámicamente por JS).
    const tenistaThumbHtml = (String(item.id) === '12990')
        ? `<div class="tenista-inline-thumb-wrapper"><img src="imagenes/vinos/tenista_pegado.webp?v=${TENISTA_IMG_CACHE_BUST}" class="tenista-inline-thumb" alt="" onclick="event.stopPropagation(); openTenistaImageLarge()" style="cursor:pointer;"></div>`
        : '';

    // NUEVO: Comprobar si existe información para el idioma actual y generar el icono correspondiente
    let infoIconHtml = '';
    const infoKey = `info_${currentLang.toLowerCase()}`;
    const infoData = item[infoKey];
    if (infoData && infoData.trim() !== '') {
        // CORREGIDO: antes se escapaban las comillas a mano (' -> \' , " -> &quot;), pero si el
        // JSON ya traía una comilla interna escapada (\"), JS se comía la barra invertida al
        // evaluar el string y dejaba una comilla suelta -> JSON.parse fallaba en silencio y el
        // botón no hacía nada, solo en los platos cuyo texto llevaba una frase entrecomillada.
        // Base64 no tiene ese problema: no contiene comillas, apóstrofes ni barras invertidas.
        const b64Info = utf8ToB64(infoData);
        const infoClickHandler = `event.stopPropagation(); showInfoModal('${b64Info}')`;
        infoIconHtml = `<span class="emoji-info" onclick="${infoClickHandler}" title="Info">ℹ️</span>`;
    }

    // Lógica de ubicación del icono de info según las reglas solicitadas:
    // 1. Si existe foto, poner el icono de info justo al lado del icono de foto
    // 2. Si no existe foto pero hay descripción, ponerlo al final de la descripción
    // CORREGIDO: el nombre del plato debe mostrarse SIEMPRE; antes, cuando había foto, se sustituía por completo por los iconos
    const infoPlacement = `${currentData.name}${photoIcon ? ' ' + photoIcon : ''}${infoIconHtml ? ' ' + infoIconHtml : ''}`;

    return ` 
    <div class="item-row"> 
        <div class="item-content" ${clickAction} ${clickableStyle}> 
            <span class="name-selected"> 
                ${infoPlacement} 
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
        ${tenistaThumbHtml}
    </div>`;
}

function managePreload() { 
    currentPreloadSession++; 
    const mySession = currentPreloadSession; 
    isPreloading = false;  
    preloadQueue = [];

    const sortedData = [...allData].sort((a, b) => parseInt(a.id) - parseInt(b.id));

    // MODIFICADO: addCategoryByLevels admite ahora un nivel máximo de fotos a precargar por
    // plato (antes siempre 4). Los vinos se quedan en 1 sola foto precargada por botella —
    // mucha gente ni abre la galería de un vino, así que no vale la pena bajarse las 4 fotos
    // de cada uno por adelantado; el resto (niveles 2-4) se sigue cargando bajo demanda al
    // abrir la galería, como ya hacía antes para todo.
    const addCategoryByLevels = (items, maxNivel = 4) => { 
        const bases = items.map(item => `imagenes/${item.carpeta}/${item.archivo.split('01.webp')[0]}`); 
        for (let level = 1; level <= maxNivel; level++) { 
            bases.forEach(base => { preloadQueue.push({ base, n: level }); }); 
        } 
    };

    const currentItems = sortedData.filter(i => isItemInCategory(i.id, currentCat) && i.archivo && i.activa === 'SI'); 
    const esCategoriaVinos = currentCat && currentCat.toString().startsWith('13');
    addCategoryByLevels(currentItems, esCategoriaVinos ? 1 : 4);

    const otherFoodItems = sortedData.filter(i => !isItemInCategory(i.id, currentCat) && parseInt(i.id) < 13000 && i.archivo && i.activa === 'SI'); 
    addCategoryByLevels(otherFoodItems);

    if (esCategoriaVinos) {
        const wineItems = sortedData.filter(i => !isItemInCategory(i.id, currentCat) && parseInt(i.id) >= 13000 && i.archivo && i.activa === 'SI'); 
        addCategoryByLevels(wineItems, 1);
    }

    processPreloadQueue(mySession);
}

async function processPreloadQueue(session) { 
    if (isPreloading) return; 
    isPreloading = true;

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.saveData || /2g|3g/.test(conn.effectiveType || ''))) {
        isPreloading = false;
        return;
    }

    while (preloadQueue.length > 0) { 
        if (session !== currentPreloadSession) { isPreloading = false; return; }  
        const task = preloadQueue.shift(); 
        const url = `${task.base}0${task.n}.webp`;

        if (task.n > 1) { 
            const prevUrl = `${task.base}0${task.n - 1}.webp`; 
            if (verifiedImages[prevUrl] === false) { verifiedImages[url] = false; continue; } 
        }

        if (verifiedImages[url] !== undefined) continue;

        await new Promise(resolve => setTimeout(resolve, 150));
        if (session !== currentPreloadSession) { isPreloading = false; return; }

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

// NUEVO: abre en grande la miniatura fija del plato ID 12990, reutilizando el mismo modal de
// fotos (ya tiene un tamaño responsive estándar: max-width 90% / max-height 80% de la
// pantalla, así en móvil se ajusta solo a un tamaño habitual sin desbordar). Es una sola foto,
// así que se ocultan las flechas de siguiente/anterior.
function openTenistaImageLarge() {
    const img = document.getElementById('modal-img');
    const prev = document.getElementById('prev-btn');
    const next = document.getElementById('next-btn');
    if (img) img.src = 'imagenes/vinos/tenista_pegado.webp?v=' + TENISTA_IMG_CACHE_BUST;
    if (prev) prev.style.display = 'none';
    if (next) next.style.display = 'none';
    const modal = document.getElementById('photo-modal');
    if (modal) modal.style.display = 'flex';
}

async function openGallery(base) { 
    currentPreloadSession++;  
    currentGalleryPath = base;  
    currentPhotoIndex = 1;  
    maxPhotosFound = 1;

    updateModal(); 
    const modal = document.getElementById('photo-modal');
    if (modal) modal.style.display = 'flex';

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
    const img = document.getElementById('modal-img');
    const prev = document.getElementById('prev-btn');
    const next = document.getElementById('next-btn');

    if (img) img.src = `${currentGalleryPath}0${currentPhotoIndex}.webp`; 
    if (prev) prev.style.display = currentPhotoIndex > 1 ? 'block' : 'none'; 
    if (next) next.style.display = currentPhotoIndex < maxPhotosFound ? 'block' : 'none';
}

function changePhoto(n) { currentPhotoIndex += n; updateModal(); }
function closeModal() { const modal = document.getElementById('photo-modal'); if (modal) modal.style.display = 'none'; }

// NUEVO: Funcionalidad para mostrar el modal de información con preguntas y respuestas del plato
function showInfoModal(b64Str) {
    let data;
    try { 
        const jsonStr = b64ToUtf8(b64Str);
        data = JSON.parse(jsonStr); 
    } catch(e) { 
        console.error("Error al parsear info:", e); 
        return; 
    }

    let modal = document.getElementById('info-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'info-modal';
        document.body.appendChild(modal);
    }

    let html = `<div class="info-modal-content">
        <span class="close-modal" onclick="closeInfoModal()">&times;</span>
        <div class="info-desc">${data.desc || ''}</div>`;

    if (data.q1 && data.r1) html += `<div class="info-qa"><b>Q: ${data.q1}</b><br><span class="info-a">A: ${data.r1}</span></div>`;
    if (data.q2 && data.r2) html += `<div class="info-qa"><b>Q: ${data.q2}</b><br><span class="info-a">A: ${data.r2}</span></div>`;
    if (data.q3 && data.r3) html += `<div class="info-qa"><b>Q: ${data.q3}</b><br><span class="info-a">A: ${data.r3}</span></div>`;

    html += `</div>`;
    modal.innerHTML = html;
    modal.style.display = 'flex';
}

function closeInfoModal() {
    const modal = document.getElementById('info-modal');
    if (modal) modal.style.display = 'none';
}

// MODIFICADO: si el idioma elegido no es de los ya cargados (idioma del cliente, ES, o los
// 5 esenciales), se pide bajo demanda al endpoint en vivo antes de renderizar. Muestra un
// estado de "cargando" breve en el selector mientras llega.
async function changeLanguage(l) {
    if (!l) return;

    if (!isLangLoaded(l)) {
        const select = document.getElementById('more-langs');
        if (select) select.disabled = true;
        try {
            const nuevosItems = await fetchAndParseCsv([l]);
            mergeIntoAllData(nuevosItems);
        } catch (e) {
            console.error('Error cargando idioma bajo demanda:', e);
            if (select) select.disabled = false;
            return; // se queda en el idioma anterior si falla la descarga
        }
        if (select) select.disabled = false;
    }

    currentLang = l;
    updateLanguageUI();
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

// NUEVO: Listener global para cerrar el modal de información al hacer clic fuera de él
document.addEventListener('click', function(e) {
    const modal = document.getElementById('info-modal');
    if (modal && e.target === modal) {
        closeInfoModal();
    }
});
