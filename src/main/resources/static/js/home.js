// --- DATI E STATO GLOBALE (HOME) ---
let prodotti = [];
let cart = JSON.parse(localStorage.getItem("cartShop"));
let favorites = JSON.parse(localStorage.getItem("favoritesShop")) || [];
let showOnlyFavorites = false;
let currentCategory = "elettronica";

$(document).ready(function() {

    // ==========================================
    // TASK 1 — Inizializza il carrello condiviso e
    // aggiorna il contatore in navbar.
    // ==========================================
    if (isCartFormatValid(cart)) {
        updateHomeCartCounter();
    } else {
        // localStorage vuoto o in formato legacy:
        // ricarica il carrello di default dall'XML usando
        // lo stesso formato di carrello.js.
        loadInitialCartFromXML("xml/carrello.xml", function () {
            updateHomeCartCounter();
        });
    }

    // Carica di default i prodotti della categoria Elettronica
    loadProductsFromXML("xml/elettronica.xml", function() {});

    // Event Listeners UI Home
    $("#searchInput").on("input", applyFiltersAndRender);
    $("#searchButton").on("click", applyFiltersAndRender);

    $(document).on("click", ".category-link", function(e) {
        e.preventDefault();
        const cat = $(this).data("category");
        const fileMap = {
            'elettronica': 'xml/elettronica.xml',
            'libri': 'xml/libri.xml',
            'abbigliamento': 'xml/abbigliamento.xml'
        };
        if (fileMap[cat]) {
            currentCategory = cat;
            prodotti = [];
            loadProductsFromXML(fileMap[cat]);
        }
    });

    $("#sortFilter").on("change", applyFiltersAndRender);

    $("#resetFiltersBtn").on("click", function(e) {
        e.preventDefault();
        $("#searchInput").val("");
        $("#sortFilter").val("default");
        showOnlyFavorites = false;
        applyFiltersAndRender();
    });

    $("#showFavoritesBtn").on("click", function(e) {
        e.preventDefault();
        showOnlyFavorites = !showOnlyFavorites;
        if (showOnlyFavorites) {
            $(this).html('<i class="fas fa-heart" style="color: red;"></i> Mostra Tutti');
        } else {
            $(this).html('<i class="fas fa-heart" style="color: red;"></i> Solo Preferiti');
        }
        applyFiltersAndRender();
    });


    // ==========================================
    // LOGICA PREFERITI (invariata)
    // ==========================================
    $(document).on("click", ".fav-btn", function() {
        const productId = parseInt($(this).data("id"));
        if (favorites.includes(productId)) {
            favorites = favorites.filter(id => id !== productId);
            alert("Prodotto rimosso dai preferiti!");
        } else {
            favorites.push(productId);
            alert("Prodotto aggiunto ai preferiti!");
        }
        localStorage.setItem("favoritesShop", JSON.stringify(favorites));
        applyFiltersAndRender();
    });

    // ==========================================
    // TASK 2 — AGGIUNTA AL CARRELLO (stub)
    // Il click NON modifica il carrello locale.
    // L'alert è incapsulato in sendAddToCartRequest()
    // per poter essere sostituito da AJAX in futuro.
    // Uso :not(#modalAddToCartBtn) per evitare il doppio
    // handler sul pulsante del modale.
    // ==========================================
    $(document).on("click", ".add-to-cart-btn:not(#modalAddToCartBtn)", function() {
        const productId = parseInt($(this).data("id"));
        const prodotto = prodotti.find(p => p.id === productId);
        sendAddToCartRequest(prodotto);
    });

    $("#modalAddToCartBtn").on("click", function() {
        const productId = parseInt($(this).data("id"));
        const prodotto = prodotti.find(p => p.id === productId);
        sendAddToCartRequest(prodotto);
        $("#modalInfo").hide();
    });

    // ==========================================
    // LOGICA MODALE (Dettagli)
    // ==========================================
    $(document).on("click", ".product-trigger", function() {
        const productId = parseInt($(this).data("id"));
        const prodotto = prodotti.find(p => p.id === productId);

        if (prodotto) {
            $("#infoTitolo").text(prodotto.name);
            $("#infoBrand").text(prodotto.brand || '');
            $("#infoDescrizione").text(prodotto.descrizione);
            $("#infoImmagine").attr("src", prodotto.image);
            $("#infoPrezzo").text(prodotto.price.toFixed(2).replace('.', ',') + " €");
            $("#infoDisponibilita").text(prodotto.stock);

            $("#modalAddToCartBtn").data("id", prodotto.id);
            $("#modalInfo").css("display", "flex");
        }
    });

    $(document).on('keydown', function(e) {
        if (e.key === "Escape") {
            $("#modalInfo").hide();
        }
    });

    $("#closeModalInfoBtn").on("click", function() {
        $("#modalInfo").hide();
    });

    $("#modalInfo").on("click", function(e) {
        if ($(e.target).is("#modalInfo")) {
            $(this).hide();
        }
    });
});

// ==========================================
// TASK 2 — STUB AGGIUNTA AL CARRELLO
// Funzione isolata: attualmente mostra solo un alert()
// con nome e id del prodotto. In futuro basterà
// sostituire il corpo con una $.ajax(...) senza
// toccare il resto del codice.
// ==========================================
function sendAddToCartRequest(prodotto) {
    if (!prodotto) {
        alert("Errore: prodotto non trovato.");
        return;
    }

    // TODO: sostituire con una richiesta AJAX al backend quando disponibile.
    // Esempio:
    // $.ajax({
    //     url: '/api/cart/add',
    //     type: 'POST',
    //     data: { id: prodotto.id, nome: prodotto.name, quantita: 1 },
    //     success: function () { alert("Prodotto aggiunto al carrello!"); },
    //     error:   function () { alert("Errore durante l'aggiunta al carrello."); }
    // });

    alert('Aggiunto al carrello: "' + prodotto.name + '" (ID: ' + prodotto.id + ')');
}

// ==========================================
// TASK 1 — CONTATORE CARRELLO
// Somma le quantità presenti in localStorage
// (stessa chiave e stesso formato di carrello.js).
// ==========================================
function updateHomeCartCounter() {
    let total = 0;
    const stored = localStorage.getItem("cartShop");

    if (stored) {
        try {
            const items = JSON.parse(stored);
            if (Array.isArray(items)) {
                items.forEach(function (item) {
                    // Supporto sia al nuovo formato (quantita) sia a quello legacy (quantity)
                    const q = (item.quantita !== undefined) ? item.quantita : (item.quantity || 0);
                    total += (isNaN(q) ? 0 : q);
                });
            }
        } catch (e) {
            console.error("Errore nel parsing del carrello da localStorage:", e);
        }
    }

    $("#cartCounter").text(total);
}

// ==========================================
// FUNZIONI DI UTILITA' HOME
// ==========================================
function isCartFormatValid(c) {
    if (!Array.isArray(c)) return false;
    return c.every(function (item) {
        return item && item.id !== undefined && item.quantita !== undefined;
    });
}

function saveCart() {
    localStorage.setItem("cartShop", JSON.stringify(cart));
}

// Caricamento del carrello iniziale via AJAX jQuery,
// con lo STESSO formato usato da carrello.js.
function loadInitialCartFromXML(url, callback) {
    $.ajax({
        url: url,
        type: "GET",
        dataType: "xml",
        success: function (xml) {
            cart = [];
            $(xml).find("elemento").each(function () {
                cart.push({
                    id:       parseInt($(this).find("idProdotto").text(), 10),
                    nome:     $(this).find("nome").text(),
                    prezzo:   parseFloat($(this).find("prezzoUnitario").text()),
                    quantita: parseInt($(this).find("quantita").text(), 10),
                    immagine: $(this).find("immagine").text()
                });
            });
            saveCart();
            if (callback) callback();
        },
        error: function (xhr, status, error) {
            console.error("Errore lettura carrello.xml:", error);
            cart = [];
            saveCart();
            if (callback) callback();
        }
    });
}

// Caricamento prodotti via AJAX jQuery (invariato)
function loadProductsFromXML(url, callback) {
    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'xml',
        success: function(xml) {
            parseProductsXML(xml);
            applyFiltersAndRender();
            if (callback) callback();
        },
        error: function(xhr, status, error) {
            console.error("Errore nel caricamento del file XML:", error);
        }
    });
}

function parseProductsXML(xml) {
    const prodottiRoot = xml.querySelector("prodotti");
    const categoria = prodottiRoot ? prodottiRoot.getAttribute("categoria") : "";

    const nodiProdotto = xml.querySelectorAll("prodotto");
    nodiProdotto.forEach(node => {
        const idXML = parseInt(node.querySelector("id").textContent);
        if(!prodotti.find(p => p.id === idXML)) {
            prodotti.push({
                id: idXML,
                name: node.querySelector("nome").textContent,
                category: categoria,
                price: parseFloat(node.querySelector("prezzo").textContent),
                stock: node.querySelector("disponibilita").textContent,
                image: node.querySelector("immagine").textContent,
                descrizione: node.querySelector("descrizione").textContent,
                brand: node.querySelector("marca").textContent
            });
        }
    });
}

function applyFiltersAndRender() {
    const searchText = $("#searchInput").val().toLowerCase().trim();
    const sortMode = $("#sortFilter").val();

    let filteredArray = prodotti.filter(prodotto => {
        // matchText con name, descrizione o brand (requisito 3.5 primo assignment)
        const matchText = prodotto.name.toLowerCase().includes(searchText) || prodotto.descrizione.toLowerCase().includes(searchText) || prodotto.brand.toLowerCase().includes(searchText);
        const matchCategory = (prodotto.category === currentCategory);
        const matchFav = showOnlyFavorites ? favorites.includes(prodotto.id) : true;
        return matchText && matchCategory && matchFav;
    });

    if (sortMode === "priceAsc") {
        filteredArray.sort((a, b) => a.price - b.price);
    } else if (sortMode === "priceDesc") {
        filteredArray.sort((a, b) => b.price - a.price);
    } else if (sortMode === "nameAsc") {
        filteredArray.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === "nameDesc") {
        filteredArray.sort((a, b) => b.name.localeCompare(a.name));
    }

    renderProducts(filteredArray);
}

function renderProducts(productArray) {
    const $container = $("#productsContainer");
    const $noResultsMsg = $("#noResultsMessage");
    $container.html("");

    if (productArray.length === 0) {
        $noResultsMsg.show();
        $container.hide();
    } else {
        $noResultsMsg.hide();
        $container.show();

        productArray.forEach(prodotto => {
            const prezzoStr = prodotto.price.toFixed(2).replace('.', ',') + " €";

            const cardHtml = `
                <div class="product-card">
                  <div class="img-container product-trigger" data-id="${prodotto.id}" style="cursor: pointer;">
                    <img src="${prodotto.image}" alt="${prodotto.name}">
                  </div>
                  <h4 class="product-trigger" data-id="${prodotto.id}" style="cursor: pointer; text-decoration: underline;">${prodotto.name}</h4>
                  <p class="product-brand">${prodotto.brand || ''}</p>
                  <p class="product-description">${prodotto.descrizione || ''}</p>
                  <div class="price">${prezzoStr}</div>
                  <p class="product-availability">${prodotto.stock || ''}</p>
                  <div class="btn-container">
                    <button class="btn-action add-to-cart-btn" data-id="${prodotto.id}">Aggiungi al carrello</button>
                  </div>
                </div>
            `;
            $container.append(cardHtml);
        });
    }
}