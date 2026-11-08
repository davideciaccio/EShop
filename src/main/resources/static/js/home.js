/**
 * @file home.js
 * @description Logica della pagina Home di E-Shop.
 * Gestisce: caricamento prodotti via AJAX (jQuery), cambio categoria da dropdown,
 * ricerca client-side real-time, ordinamento combinato ai filtri, modale dettagli
 * e alert "Aggiungi al carrello".
 *
 * Requisiti coperti:
 *  - Dropdown 3 categorie XML con chiamata AJAX jQuery al change
 *  - Generazione dinamica card prodotto
 *  - Ricerca client-side (nome, descrizione, marca) case-insensitive, real-time
 *  - Ordinamento combinato ai filtri senza nuovi caricamenti AJAX
 *  - Modale dinamica chiudibile con Esc / click esterno / X
 *  - Bottone "Aggiungi" con alert(nome, id)
 *
 * Struttura:
 *   1. Stato globale
 *   2. Inizializzazione (document.ready)
 *   3. Chiamate AJAX
 *   4. Parsing e rendering DOM
 *   5. Event listeners
 *   6. Utility locali (modale, stub add-to-cart)
 */

/* ============================================================
 * 1. STATO GLOBALE
 * ============================================================ */
let prodotti = [];

const CATEGORY_FILES = {
    elettronica:   "xml/elettronica.xml",
    libri:         "xml/libri.xml",
    abbigliamento: "xml/abbigliamento.xml"
};

/* ============================================================
 * 2. INIZIALIZZAZIONE
 * ============================================================ */
$(document).ready(function () {
    updateCartBadge();                                     // badge da localStorage
    loadProductsFromXML(CATEGORY_FILES.elettronica);       // default: Elettronica
    bindHomeEvents();
});

/* ============================================================
 * 3. CHIAMATE AJAX
 * ============================================================ */

/**
 * Carica i prodotti dal file XML indicato e li renderizza.
 * @param {string} url
 */
function loadProductsFromXML(url) {
    $.ajax({
        url: url,
        type: "GET",
        dataType: "xml",
        success: function (xml) {
            prodotti = parseProductsXML(xml);
            applyFiltersAndRender();
        },
        error: function (xhr, status, error) {
            console.error("Errore nel caricamento del file XML:", error);
            prodotti = [];
            applyFiltersAndRender();
        }
    });
}

/* ============================================================
 * 4. PARSING E RENDERING DOM
 * ============================================================ */

/**
 * Converte il documento XML <prodotti> in array di oggetti prodotto.
 * @param {Document} xml
 * @returns {Array}
 */
function parseProductsXML(xml) {
    const root = xml.querySelector("prodotti");
    const categoria = root ? root.getAttribute("categoria") : "";
    const out = [];

    xml.querySelectorAll("prodotto").forEach(function (node) {
        out.push({
            id:          parseInt(node.querySelector("id").textContent, 10),
            name:        node.querySelector("nome").textContent,
            category:    categoria,
            price:       parseFloat(node.querySelector("prezzo").textContent),
            stock:       node.querySelector("disponibilita").textContent,
            image:       node.querySelector("immagine").textContent,
            descrizione: node.querySelector("descrizione").textContent,
            brand:       node.querySelector("marca").textContent
        });
    });
    return out;
}

/**
 * Applica ricerca testuale (nome/descrizione/marca) e ordinamento
 * all'array prodotti, poi renderizza il risultato.
 */
function applyFiltersAndRender() {
    const searchText = $("#searchInput").val().toLowerCase().trim();
    const sortMode   = $("#sortFilter").val();

    const result = prodotti.filter(function (p) {
        const haystack = (p.name + " " + p.descrizione + " " + p.brand).toLowerCase();
        return haystack.includes(searchText);
    });

    switch (sortMode) {
        case "priceAsc":  result.sort((a, b) => a.price - b.price); break;
        case "priceDesc": result.sort((a, b) => b.price - a.price); break;
        case "nameAsc":   result.sort((a, b) => a.name.localeCompare(b.name)); break;
        case "nameDesc":  result.sort((a, b) => b.name.localeCompare(a.name)); break;
    }

    renderProducts(result);
}

/**
 * Inietta le card prodotto nel container #productsContainer.
 * @param {Array} productArray
 */
function renderProducts(productArray) {
    const $container = $("#productsContainer");
    const $noResults = $("#noResultsMessage");

    $container.html("");

    if (productArray.length === 0) {
        $noResults.show();
        $container.hide();
        return;
    }
    $noResults.hide();
    $container.show();

    const html = productArray.map(function (p) {
        return `
            <div class="product-card">
              <div class="img-container product-trigger" data-id="${p.id}" style="cursor:pointer;">
                <img src="${p.image}" alt="${p.name}">
              </div>
              <h4 class="product-trigger" data-id="${p.id}" style="cursor:pointer; text-decoration:underline;">${p.name}</h4>
              <p class="product-brand">${p.brand}</p>
              <p class="product-description">${p.descrizione}</p>
              <div class="price">${formatPrice(p.price)}</div>
              <p class="product-availability">${p.stock}</p>
              <div class="btn-container">
                <button class="btn-action add-to-cart-btn" data-id="${p.id}">Aggiungi al carrello</button>
              </div>
            </div>`;
    }).join("");

    $container.append(html);
}

/* ============================================================
 * 5. EVENT LISTENERS
 * ============================================================ */
function bindHomeEvents() {
    // Ricerca real-time + pulsante
    $("#searchInput").on("input", applyFiltersAndRender);
    $("#searchButton").on("click", applyFiltersAndRender);

    // Ordinamento (client-side, nessuna nuova AJAX)
    $("#sortFilter").on("change", applyFiltersAndRender);

    // Cambio categoria → nuova AJAX
    $("#categoryFilter").on("change", function () {
        const cat = $(this).val();
        if (CATEGORY_FILES[cat]) {
            loadProductsFromXML(CATEGORY_FILES[cat]);
        }
    });

    // Apertura modale dettagli (delegated: copre immagine e titolo)
    $(document).on("click", ".product-trigger", function () {
        openProductModal(parseInt($(this).data("id"), 10));
    });

    // Aggiunta al carrello: handler unico delegated (card + modale)
    $(document).on("click", ".add-to-cart-btn", function () {
        const id = parseInt($(this).data("id"), 10);
        const prodotto = prodotti.find(p => p.id === id);
        sendAddToCartRequest(prodotto);
        closeModal();                       // no-op se la modale è chiusa
    });

    // Chiusura modale: X, Esc, click esterno
    $("#closeModalInfoBtn").on("click", closeModal);
    $(document).on("keydown", function (e) {
        if (e.key === "Escape") closeModal();
    });
    $("#modalInfo").on("click", function (e) {
        if (e.target === this) closeModal();
    });
}

/* ============================================================
 * 6. UTILITY LOCALI
 * ============================================================ */

/**
 * Apre la modale con i dettagli del prodotto.
 * @param {number} id
 */
function openProductModal(id) {
    const p = prodotti.find(x => x.id === id);
    if (!p) return;

    $("#infoTitolo").text(p.name);
    $("#infoBrand").text(p.brand || "");
    $("#infoDescrizione").text(p.descrizione);
    $("#infoImmagine").attr("src", p.image);
    $("#infoPrezzo").text(formatPrice(p.price));
    $("#infoDisponibilita").text(p.stock);

    $("#modalAddToCartBtn").data("id", p.id);
    $("#modalInfo").css("display", "flex");
}

function closeModal() {
    $("#modalInfo").hide();
}

/**
 * Stub di aggiunta al carrello: mostra un alert con nome e id del prodotto.
 * @param {{id:number,name:string}|undefined} prodotto
 */
function sendAddToCartRequest(prodotto) {
    if (!prodotto) {
        alert("Errore: prodotto non trovato.");
        return;
    }
    alert('Aggiunto al carrello: "' + prodotto.name + '" (ID: ' + prodotto.id + ')');
}