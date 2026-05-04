const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT9rPlxpax2lE0rN97c6Hoy_OxUwREqRb48juEBr9C91ZFY2UvaKgC8JdiRcwDrtBErXFVmFRh0Zr5e/pub?gid=0&single=true&output=csv';

let currentLang = 'ES', currentCat = '12', allData = [];
let currentGalleryPath = '', currentPhotoIndex = 1, maxPhotosFound = 1;

const categoriesList = [
    { id: '12', ES: 'Sugerencias', EN: 'Suggestions', DE: 'Vorschläge', FR: 'Suggestions', IT: 'Suggerimenti' },
    { id: '1', ES: 'Entrantes', EN: 'Starters', DE: 'Vorspeisen', FR: 'Entrées', IT: 'Antipasti' },
    { id: '2', ES: 'Ensaladas', EN: 'Salads', DE: 'Salate', FR: 'Salades', IT: 'Insalate' },
    { id: '3', ES: 'Arroces', EN: 'Rice', DE: 'Reis', FR: 'Riz', IT: 'Riso' },
    { id: '4', ES: 'Recetas', EN: 'Recipes', DE: 'Rezepte', FR: 'Recettes', IT: 'Ricette' },
    { id: '5', ES: 'Principales', EN: 'Mains', DE: 'Hauptspeisen', FR: 'Plats', IT: 'Piatti' },
    { id: '7', ES: 'Niños', EN: 'Kids', DE: 'Kinder', FR: 'Enfants', IT: 'Bambini' },
    { id: '8', ES: 'Postres', EN: 'Desserts', DE: 'Desserts', FR: 'Desserts', IT: 'Dolci' },
    { id: '9', ES: 'Café', EN: 'Coffee', DE: 'Kaffee', FR: 'Café', IT: 'Caffè' },
    { id: '10', ES: 'Bebidas', EN: 'Drinks', DE: 'Getränke', FR: 'Boissons', IT: 'Bibite' },
    { id: '11', ES: 'Cervezas', EN: 'Beers', DE: 'Biere', FR: 'Bières', IT: 'Birre' }
];

async function init() {
    try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();
        allData = parseCSV(csvText);
        if (allData.length > 0) {
            renderCategories();
            renderMenu();
        }
    } catch (e) { console.error("Error:", e); }
}

function parseCSV(text) {
    const rows = [], lines = text.split(/\r?\n/);
    for (let i = 1; i < lines.length; i++) {
        const col = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (col.length < 11) continue;
        
        rows.push({
            id: col[0].replace(/"/g, '').trim(),
            precio: col[1].replace(/"/g, '').replace(',', '.'),
            activa: col[2].replace(/"/g, '').toUpperCase().trim(),
            nombre_es: col[3].replace(/"/g, '').trim(),
            carpeta: col[4].replace(/"/g, '').trim(),
            archivo: col[5].replace(/"/g, '').trim(),
            alergenos: col[6] ? col[6].replace(/"/g, '').split(',').map(a => a.trim()).filter(a => a) : [],
            nombre_en: col[7].replace(/"/g, '').trim(),
            nombre_de: col[8].replace(/"/g, '').trim(),
            nombre_fr: col[9].replace(/"/g, '').trim(),
            nombre_it: col[10].replace(/"/g, '').trim()
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
        const id = item.id.toString();
        const match = (currentCat.length === 1) ? (id.startsWith(currentCat) && id.length === 4) : (id.startsWith(currentCat) && id.length === 5);
        return match && item.activa === 'SI' && (id % 1000 !== 0);
    });

    filtered.forEach(item => grid.innerHTML += generateItemHtml(item));

    if (currentCat === '5') {
        const guarnis = allData.filter(item => item.id.toString().startsWith('6') && item.id.toString().length === 4 && item.activa === 'SI');
        if (guarnis.length > 0) {
            const guarniTitles = { ES: 'Guarniciones', EN: 'Side Dishes', DE: 'Beilagen', FR: 'Garnitures', IT: 'Contorni' };
            const titleText = guarniTitles[currentLang] || guarniTitles['ES'];
            grid.innerHTML += `<h3 class="sub-category-title">${titleText}</h3>`;
            guarnis.forEach(g => grid.innerHTML += generateItemHtml(g, true));
        }
    }

    const conFoto = filtered.filter(item => item.archivo && item.archivo.includes('01.webp'));
    conFoto.forEach(item => {
        const img = new Image();
        img.src = `imagenes/${item.carpeta}/${item.archivo}`;
    });
}

function generateItemHtml(item, isGuarni = false) {
    const pName = item[`nombre_${currentLang.toLowerCase()}`] || item.nombre_es;
    const sName = currentLang !== 'ES' ? item.nombre_es : '';
    
    const price = (isGuarni && parseInt(item.id) < 6100) ? '' : (parseFloat(item.precio) > 0 ? `${parseFloat(item.precio).toFixed(2)}€` : '');
    
    const alergenos = item.alergenos.map(a => `<img src="imagenes/alergenos/${a}.webp" onerror="this.style.display='none'">`).join('');
    
    let photo = '';
    if (item.archivo && item.archivo.includes('01.webp')) {
        const base = `imagenes/${item.carpeta}/${item.archivo.split('01.webp')[0]}`;
        photo = `<span class="emoji-photo" onclick="openGallery('${base}')">📸</span>`;
    }

    return `<div class="item-row"><div class="item-content"><span class="name-selected">${pName} ${photo}</span><span class="name-secondary">${sName}</span><div class="alergenos-list">${alergenos}</div></div><div class="price-box">${price}</div></div>`;
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
