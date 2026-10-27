// --- 1. DEFINIZIONE DEI DATI E STATO GLOBALE ---
let prodotti = [];
let cart = JSON.parse(localStorage.getItem("cartShop")); // Non mettiamo || [] qui, controlliamo dopo
let favorites = JSON.parse(localStorage.getItem("favoritesShop")) || [];
let showOnlyFavorites = false;

$(document).ready(function() {

    // --- 1A. INIZIALIZZAZIONE HOME PAGE ---
    if ($("#productsContainer").length) {

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
    }

    // --- 1B. INIZIALIZZAZIONE PAGINA CARRELLO ---
    if ($("#mainCartItemsContainer").length) {
        // La pagina carrello ha bisogno del catalogo completo per mostrare foto e prezzi corretti.
        // Carichiamo entrambi i file prodotti in parallelo con le Promise.
        Promise.all([
            fetchXMLData("xml/prodotti1.xml"),
            fetchXMLData("xml/prodotti2.xml")
        ]).then(() => {
            // Dopo aver caricato tutti i prodotti, verifichiamo lo stato del carrello
            if (!cart) {
                loadInitialCartFromXML("xml/carrello.xml", renderMainCartPage);
            } else {
                renderMainCartPage();
            }
        }).catch(err => {
            console.error("Errore caricamento prodotti nel carrello", err);
            $("#mainCartItemsContainer").html("<p style='color:red;'>Errore nel caricamento dei dati.</p>");
        });
    }


    // ==========================================
    // CARICAMENTO XML CON FETCH
    // ==========================================

    // Funzione helper basica per fetchare prodotti usata nel carrello
    function fetchXMLData(url) {
        return fetch(url)
            .then(response => {
                if(!response.ok) throw new Error("Errore network");
                return response.text();
            })
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(xml => parseProductsXML(xml));
    }

    // Funzione usata dalla Home per caricare e renderizzare
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

    // Estrae i nodi prodotto e li inserisce nell'array globale
    function parseProductsXML(xml) {
        const nodiProdotto = xml.querySelectorAll("prodotto");
        nodiProdotto.forEach(node => {
            const idXML = parseInt(node.querySelector("id").textContent);
            // Evitiamo duplicati se ricarichiamo file già letti
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

    // Carica il file carrello.xml di esempio iniziale
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


    // ==========================================
    // LOGICA VISUALIZZAZIONE HOME
    // ==========================================

    function applyFiltersAndRender() {
        if(!$("#productsContainer").length) return; // Salta se non siamo in home
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


    // ==========================================
    // LOGICA FUNZIONALE CARRELLO & PREFERITI
    // ==========================================

    function saveCart() {
        localStorage.setItem("cartShop", JSON.stringify(cart));
    }

    // Aggiungi prodotto al carrello (Evento delegato per jQuery)
    $(document).on("click", ".add-to-cart-btn", function() {
        const productId = parseInt($(this).data("id"));

        // Se per caso cart non è ancora stato inizializzato
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

    // Cambia Quantità (esposto globalmente per inline onclick del carrello.html)
    window.changeQuantity = function(productId, amount) {
        const item = cart.find(item => item.productId === productId);
        if (item) {
            item.quantity += amount;
            if (item.quantity <= 0) {
                removeFromCart(productId);
            } else {
                saveCart();
                renderMainCartPage(); // Ridisegna
            }
        }
    };

    // Rimuovi Prodotto
    window.removeFromCart = function(productId) {
        cart = cart.filter(item => item.productId !== productId);
        saveCart();
        renderMainCartPage(); // Ridisegna
    };

    // Rendering visivo in carrello.html
    function renderMainCartPage() {
        const $container = $("#mainCartItemsContainer");
        const $subtotaleEl = $("#mainSubtotale");
        const $totaleEl = $("#mainTotaleFinale");

        if(!$container.length) return;

        $container.html("");
        let globalTotal = 0;

        if (!cart || cart.length === 0) {
            $container.html("<p style='font-size: 1.2em; margin-top: 20px;'>Il tuo carrello è attualmente vuoto.</p>");
            $subtotaleEl.text("0,00 €");
            $totaleEl.text("0,00 €");
            return;
        }

        cart.forEach(item => {
            const prodotto = prodotti.find(p => p.id === item.productId);
            if (!prodotto) return; // Se il prodotto non è trovato tra gli xml caricati, salta

            const subtotale = prodotto.price * item.quantity;
            globalTotal += subtotale;

            const htmlCard = `
            <div class="cart-item-card" style="margin-bottom: 20px;">
                <div class="cart-item-img">
                    <img src="${prodotto.image}" alt="${prodotto.name}">
                </div>
                <div class="cart-item-details">
                    <h4>${prodotto.name}</h4>
                    <p>Prezzo unitario: ${prodotto.price.toFixed(2).replace('.', ',')} €</p>
                    <p style="color: green; font-weight: bold;">Subtotale: ${subtotale.toFixed(2).replace('.', ',')} €</p>
                    <div class="cart-quantity-controls">
                        <label>Quantità:</label>
                        <button onclick="changeQuantity(${item.productId}, -1)" style="width: 30px; height: 30px; font-weight: bold; border: 2px solid #000; cursor: pointer; background: #fff;">-</button>
                        <input type="text" value="${item.quantity}" readonly style="width: 40px; text-align: center; font-weight: bold;">
                        <button onclick="changeQuantity(${item.productId}, 1)" style="width: 30px; height: 30px; font-weight: bold; border: 2px solid #000; cursor: pointer; background: #fff;">+</button>
                        <button onclick="removeFromCart(${item.productId})" class="btn-action" style="width: auto; padding: 5px 15px; margin-left: 15px;">Rimuovi</button>
                    </div>
                </div>
            </div>
            `;
            $container.append(htmlCard);
        });

        const totaleStr = globalTotal.toFixed(2).replace('.', ',') + " €";
        $subtotaleEl.text(totaleStr);
        $totaleEl.text(totaleStr);
    }

    // Gestione Preferiti
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