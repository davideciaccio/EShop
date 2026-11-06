// --- DATI E STATO GLOBALE (HOME) ---
let prodotti = [];
let cart = JSON.parse(localStorage.getItem("cartShop"));
let favorites = JSON.parse(localStorage.getItem("favoritesShop")) || [];
let showOnlyFavorites = false;

$(document).ready(function() {
    // Se il carrello in locale non esiste, carichiamo quello di default dall'XML
    if (!cart) {
        loadInitialCartFromXML("xml/carrello.xml");
    }

    // Carica il primo set di prodotti XML
    loadProductsFromXML("xml/prodotti1.xml", function() {
        $("#loadMoreBtn").show();
    });

    // Event Listeners UI Home
    $("#searchInput").on("input", applyFiltersAndRender);
    $("#searchButton").on("click", applyFiltersAndRender);
    $("#categoryFilter").on("change", applyFiltersAndRender);
    $("#sortFilter").on("change", applyFiltersAndRender);

    $("#resetFiltersBtn").on("click", function(e) {
        e.preventDefault();
        $("#searchInput").val("");
        $("#categoryFilter").val("all");
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

    $("#loadMoreBtn").on("click", function() {
        loadProductsFromXML("xml/prodotti2.xml", () => {
            $(this).hide();
        });
    });

    // ==========================================
    // LOGICA PREFERITI E CARRELLO (Da Home)
    // ==========================================
    $(document).on("click", ".add-to-cart-btn", function() {
        const productId = parseInt($(this).data("id"));

        if(!cart) cart = [];

        const existingItem = cart.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ productId: productId, quantity: 1 });
        }

        saveCart();
        alert("Prodotto aggiunto al carrello!");
    });

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
    // LOGICA MODALE (Dettagli)
    // ==========================================
    $(document).on("click", ".product-trigger", function() {
        const productId = parseInt($(this).data("id"));
        const prodotto = prodotti.find(p => p.id === productId);

        if (prodotto) {
            $("#infoTitolo").text(prodotto.name);
            $("#infoDescrizione").text(prodotto.descrizione);
            $("#infoImmagine").attr("src", prodotto.image);
            $("#infoPrezzo").text(prodotto.price.toFixed(2).replace('.', ',') + " €");
            $("#infoDisponibilita").text(`Disponibilità: ${prodotto.stock} pezzi in stock`);

            $("#modalAddToCartBtn").data("id", prodotto.id);
            $("#modalInfo").css("display", "flex");
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

    $("#modalAddToCartBtn").on("click", function() {
        const productId = parseInt($(this).data("id"));

        if(!cart) cart = [];
        const existingItem = cart.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ productId: productId, quantity: 1 });
        }
        saveCart();
        alert("Prodotto aggiunto al carrello!");
        $("#modalInfo").hide();
    });
});

// ==========================================
// FUNZIONI DI UTILITA' HOME
// ==========================================
function saveCart() {
    localStorage.setItem("cartShop", JSON.stringify(cart));
}

function loadInitialCartFromXML(url, callback) {
    fetch(url)
        .then(res => res.text())
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(xml => {
            cart = [];
            const items = xml.querySelectorAll("item");
            items.forEach(item => {
                cart.push({
                    productId: parseInt(item.querySelector("productId").textContent),
                    quantity: parseInt(item.querySelector("quantity").textContent)
                });
            });
            saveCart();
            if(callback) callback();
        })
        .catch(err => {
            console.error("Errore lettura carrello.xml", err);
            cart = []; // Fallback a vuoto
            saveCart();
            if(callback) callback();
        });
}

function loadProductsFromXML(url, callback) {
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error("Errore di rete durante il fetch.");
            return response.text();
        })
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(xml => {
            parseProductsXML(xml);
            applyFiltersAndRender();
            if (callback) callback();
        })
        .catch(error => {
            console.error("Errore nel caricamento del file XML:", error);
        });
}

function parseProductsXML(xml) {
    const nodiProdotto = xml.querySelectorAll("prodotto");
    nodiProdotto.forEach(node => {
        const idXML = parseInt(node.querySelector("id").textContent);
        if(!prodotti.find(p => p.id === idXML)) {
            prodotti.push({
                id: idXML,
                name: node.querySelector("name").textContent,
                category: node.querySelector("category").textContent,
                price: parseFloat(node.querySelector("price").textContent),
                stock: parseInt(node.querySelector("stock").textContent),
                image: node.querySelector("image").textContent,
                descrizione: node.querySelector("descrizione").textContent
            });
        }
    });
}

function applyFiltersAndRender() {
    const searchText = $("#searchInput").val().toLowerCase().trim();
    const selectedCategory = $("#categoryFilter").val();
    const sortMode = $("#sortFilter").val();

    let filteredArray = prodotti.filter(prodotto => {
        const matchText = prodotto.name.toLowerCase().includes(searchText);
        const matchCategory = (selectedCategory === "all") || (prodotto.category === selectedCategory);
        const matchFav = showOnlyFavorites ? favorites.includes(prodotto.id) : true;
        return matchText && matchCategory && matchFav;
    });

    if (sortMode === "priceAsc") {
        filteredArray.sort((a, b) => a.price - b.price);
    } else if (sortMode === "priceDesc") {
        filteredArray.sort((a, b) => b.price - a.price);
    } else if (sortMode === "nameAsc") {
        filteredArray.sort((a, b) => a.name.localeCompare(b.name));
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
            const isFav = favorites.includes(prodotto.id);
            const heartClass = isFav ? "fas fa-heart" : "far fa-heart";
            const heartColor = isFav ? "red" : "#000";

            const cardHtml = `
                <div class="product-card" style="position: relative;">
                  <button class="fav-btn" data-id="${prodotto.id}" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 1.5em; color: ${heartColor}; cursor: pointer; z-index: 10;">
                    <i class="${heartClass}"></i>
                  </button>
                  <div class="img-container product-trigger" data-id="${prodotto.id}" style="cursor: pointer;">
                    <img src="${prodotto.image}" alt="${prodotto.name}">
                  </div>
                  <h4 class="product-trigger" data-id="${prodotto.id}" style="cursor: pointer; text-decoration: underline;">${prodotto.name}</h4>
                  <div class="stars">★★★★☆</div>
                  <div class="price">${prezzoStr}</div>
                  <div class="btn-container">
                    <button class="btn-action add-to-cart-btn" data-id="${prodotto.id}">Aggiungi al carrello</button>
                  </div>
                </div>
            `;
            $container.append(cardHtml);
        });
    }
}