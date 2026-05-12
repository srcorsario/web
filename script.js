const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT9rPlxpax2lE0rN97c6Hoy_OxUwREqRb48juEBr9C91ZFY2UvaKgC8JdiRcwDrtBErXFVmFRh0Zr5e/pub?gid=0&single=true&output=csv';

let currentLang = 'ES', currentCat = '12', allData = [];
let currentGalleryPath = '', currentPhotoIndex = 1, maxPhotosFound = 1;

const categoriesList = [
    { id: '12', ES: 'Sugerencias', EN: 'Suggestions', DE: 'Vorschläge', FR: 'Suggestions', IT: 'Suggerimenti' },
    { id: '1', ES: 'Entrantes', EN: 'Starters', DE: 'Vorspeisen', FR: 'Entrées', IT: 'Antipasti' },
    { id: '2', ES: 'Ensaladas', EN: 'Salads', DE: 'Salate', FR: 'Salades', IT: 'Insalate' },
    { id: '3', ES: 'Arroces & Pastas', EN: 'Rice & Pasta', DE: 'Reis & Pasta', FR: 'Riz & Pâtes', IT: 'Riso e Pasta' },
    { id: '4', ES: 'Recetas', EN: 'Recipes', DE: 'Rezepte', FR: 'Recettes', IT: 'Ricette' },
    { id: '5', ES: 'Principales', EN: 'Mains', DE: 'Hauptspeisen', FR: 'Plats', IT: 'Piatti' },
    { id: '7', ES: 'Niños', EN: 'Kids', DE: 'Kinder', FR: 'Enfants', IT: 'Bambini' },
    { id: '8', ES: 'Postres', EN: 'Desserts', DE: 'Desserts', FR: 'Desserts', IT: 'Dolci' },
    { id: '9', ES: 'Café', EN: 'Coffee', DE: 'Kaffee', FR: 'Café', IT: 'Caffè' },
    { id: '10', ES: 'Bebidas', EN: 'Drinks', DE: 'Getränke', FR: 'Boissons', IT: 'Bibite' },
    { id: '11', ES: 'Cervezas', EN: 'Beers', DE: 'Biere', FR: 'Bières', IT: 'Birre' },
    { id: '131', ES: 'Vinos Blancos', EN: 'White Wines', DE: 'Weissweine', FR: 'Vins Blancs', IT: 'Vini Bianchi' },
    { id: '132', ES: 'Vinos Rosados', EN: 'Rosé Wines', DE: 'Roséweine', FR: 'Vins Rosés', IT: 'Vini Rosati' },
    { id: '133', ES: 'Vinos Tintos', EN: 'Red Wines', DE: 'Rotweine', FR: 'Vins Rouges', IT: 'Vini Rossi' },
    { id: '134', ES: 'Cavas & Champagne', EN: 'Cava & Champagne', DE: 'Cava & Champagne', FR: 'Cava & Champagne', IT: 'Cava & Champagne' }
];

const wineSubCats = [
    { start: 13100, end: 13129, ES: 'Vinos de Mallorca', EN: 'Majorcan Wines', DE: 'Weine aus Mallorca', FR: 'Vins de Majorque', IT: 'Vini di Maiorca' },
    { start: 13130, end: 13139, ES: 'Galicia', EN: 'Galicia', DE: 'Galicien', FR: 'Galice', IT: 'Galizia' },
    { start: 13140, end: 13149, ES: 'Rueda', EN: 'Rueda', DE: 'Rueda', FR: 'Rueda', IT: 'Rueda' },
    { start: 13150, end: 13189, ES: 'Otras D.O.', EN: 'Other D.O.', DE: 'Andere D.O.', FR: 'Autres D.O.', IT: 'Altre D.O.' },
    { start: 13190, end: 13199, ES: 'Copas', EN: 'By the Glass', DE: 'Glasweise', FR: 'Au Verre', IT: 'Al Calice' },
    { start: 13200, end: 13249, ES: 'Vinos de Mallorca', EN: 'Majorcan Wines', DE: 'Weine aus Mallorca', FR: 'Vins de Majorque', IT: 'Vini di Maiorca' },
    { start: 13250, end: 13259, ES: 'Copas', EN: 'By the Glass', DE: 'Glasweise', FR: 'Au Verre', IT: 'Al Calice' },
    { start: 13300, end: 13329, ES: 'Vinos de Mallorca', EN: 'Majorcan Wines', DE: 'Weine aus Mallorca', FR: 'Vins de Majorque', IT: 'Vini di Maiorca' },
    { start: 13330, end: 13349, ES: 'Rioja', EN: 'Rioja', DE: 'Rioja', FR: 'Rioja', IT: 'Rioja' },
    { start: 13350, end: 13369, ES: 'Ribera', EN: 'Ribera', DE: 'Ribera', FR: 'Ribera', IT: 'Ribera' },
    { start: 13370, end: 13389, ES: 'Otras D.O.', EN: 'Other D.O.', DE: 'Andere D.O.', FR: 'Autres D.O.', IT: 'Altre D.O.' },
    { start: 13390, end: 13399, ES: 'Copas', EN: 'By the Glass', DE: 'Glasweise', FR: 'Au Verre', IT: 'Al Calice' },
    { start: 13450, end: 13459, ES: 'Copas', EN: 'By the Glass', DE: 'Glasweise', FR: 'Au Verre', IT: 'Al Calice' }
];

async function init() {
    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();
        allData = parseCSV(csvText);
        if (allData.length > 0) {
            const userLang = (navigator.language || navigator.userLanguage).split('-')[0].toUpperCase();
            const supportedLangs = ['ES', 'EN', 'DE', 'FR', 'IT'];
            currentLang = supportedLangs.includes(userLang) ? userLang : 'EN';
            renderCategories();
            renderMenu();
            document.querySelectorAll('#language-selector button').forEach(b => b.classList.toggle('active', b.id === `btn-${currentLang}`));
        }
    } catch (e) { console.error("Error:", e); }
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
            nombre_it: clean(col[10])
        });
    }
    return rows;
}

function renderCategories() {
    const nav = document.getElementById('category-selector');
    nav.innerHTML = categoriesList.map(c => `<button onclick="filterCategory('${c.id}')" class="cat-btn ${currentCat === c.id ? 'active' : ''}">${c[currentLang]}</button>`).join('');
}

function renderMenu() {
    const grid = document.getElementById('items-list'), title = document.getElementById('current-category-name');
    const catObj = categoriesList.find(c => c.id === currentCat);
    title.innerText = catObj ? catObj[currentLang] : "";
    grid.innerHTML = '';

    const filtered = allData.filter(item => {
        const idNum = parseInt(item.id);
        const catNum = parseInt(currentCat);
        if (currentCat.length <= 2) {
            const min = catNum * 1000;
            const max = min + 999;
            return idNum >= min && idNum <= max && item.activa === 'SI';
        } else {
            const min = catNum * 100;
            const max = min + 99;
            return idNum >= min && idNum <= max && item.activa === 'SI';
        }
    });

    let currentActiveSubCatName = "";
    let lastFolder = ""; // Nueva variable para detectar cambio de grupo

    filtered.forEach(item => {
        const idNum = parseInt(item.id);

        // LÓGICA DE SEPARACIÓN EN SUGERENCIAS (CATEGORÍA 12)
        if (currentCat === '12' && lastFolder !== "" && lastFolder !== item.carpeta) {
            grid.innerHTML += `<div class="spacer-categoria"></div>`;
        }
        lastFolder = item.carpeta;

        if (idNum >= 13100 && idNum <= 14499) {
            const foundSub = wineSubCats.find(s => idNum >= s.start && idNum <= s.end);
            if (foundSub && foundSub[currentLang] !== currentActiveSubCatName) {
                grid.innerHTML += `<h3 class="sub-category-title">${foundSub[currentLang]}</h3>`;
                currentActiveSubCatName = foundSub[currentLang];
            }
        }
        grid.innerHTML += generateItemHtml(item);
    });

    if (currentCat === '5') {
        const guarnis = allData.filter(item => {
            const id = parseInt(item.id);
            return id >= 6000 && id <= 6999 && item.activa === 'SI';
        });
        if (guarnis.length > 0) {
            const guarniTitles = { ES: 'Guarniciones', EN: 'Side Dishes', DE: 'Beilagen', FR: 'Garnitures', IT: 'Contorni' };
            const titleText = guarniTitles[currentLang] || guarniTitles['ES'];
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
    const pName = currentData.name;
    const pUvas = currentData.uvas;
    const sName = currentLang !== 'ES' ? secondaryData.name : '';
    const sUvas = currentLang !== 'ES' ? secondaryData.uvas : '';
    const price = (isGuarni && parseInt(item.id) < 6100) ? '' : (parseFloat(item.precio) > 0 ? `${parseFloat(item.precio).toFixed(2)}€` : '');
    const alergenos = item.alergenos.map(a => `<img src="imagenes/alergenos/${a}.webp" onerror="this.style.display='none'">`).join('');
    let photo = '';
    if (item.archivo && item.archivo.includes('01.webp')) {
        const base = `imagenes/${item.carpeta}/${item.archivo.split('01.webp')[0]}`;
        photo = `<span class="emoji-photo" onclick="openGallery('${base}')">📸</span>`;
    }
    return `<div class="item-row"><div class="item-content"><span class="name-selected">${pName} ${photo}${pUvas ? `<br><small style="font-size:0.85em; opacity:0.8; font-style:italic; display:block; margin-top:2px;">${pUvas}</small>` : ''}</span>${sName ? `<span class="name-secondary">${sName}${sUvas ? `<br><small style="font-size:0.85em; opacity:0.8; font-style:italic;">${sUvas}</small>` : ''}</span>` : ''}<div class="alergenos-list">${alergenos}</div></div><div class="price-box">${price}</div></div>`;
}

async function openGallery(base) {
    currentGalleryPath = base; currentPhotoIndex = 1; maxPhotosFound = 1;
    for (let i = 2; i <= 4; i++) {
        const exists = await new Promise(r => { const img = new Image(); img.onload = () => r(true); img.onerror = () => r(false); img.src = `${base}0${i}.webp`; });
        if (exists) maxPhotosFound = i; else break;
    }
    updateModal();
    document.getElementById('photo-modal').style.display = 'flex';
}
function updateModal() {
    document.getElementById('modal-img').src = `${currentGalleryPath}0${currentPhotoIndex}.webp`;
    document.getElementById('prev-btn').style.display = currentPhotoIndex > 1 ? 'block' : 'none';
    document.getElementById('next-btn').style.display = currentPhotoIndex < maxPhotosFound ? 'block' : 'none';
}
function changePhoto(n) { currentPhotoIndex += n; updateModal(); }
function closeModal() { document.getElementById('photo-modal').style.display = 'none'; }
function changeLanguage(l) {
    currentLang = l;
    document.querySelectorAll('#language-selector button').forEach(b => b.classList.toggle('active', b.id === `btn-${l}`));
    renderCategories(); renderMenu();
}
function filterCategory(id) { currentCat = id; renderCategories(); renderMenu(); window.scrollTo(0,0); }
init();
