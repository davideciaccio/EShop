// --- 1. DEFINIZIONE DEI DATI ---
const prodotti = [
    { id: 1, name: "Smartphone Ultra 5G", category: "smartphone", price: 699.00, stock: 10, image: "https://pisces.bbystatic.com/prescaled/500/500/image2/BestBuy_US/images/products/c379ba4c-68af-4410-95ba-c739979192f7.jpg", descrizione: "Uno smartphone potentissimo con fotocamera da 108MP e batteria a lunga durata." },
    { id: 2, name: "Laptop Pro 15\"", category: "laptop", price: 1299.00, stock: 5, image: "https://pisces.bbystatic.com/prescaled/500/500/image2/BestBuy_US/images/products/668bcd83-acec-4885-8450-322470fb3598.jpg", descrizione: "Processore i9, 16GB RAM, SSD 1TB. Perfetto per il lavoro pesante." },
    { id: 3, name: "Cuffie Wireless Noise Cancelling", category: "audio", price: 199.00, stock: 15, image: "https://i2.adis.ws/i/Argos/8496609_R_Z001A", descrizione: "Isolati dal mondo con la cancellazione attiva del rumore. Autonomia 30h." },
    { id: 4, name: "Smartwatch Sport Fitness", category: "wearable", price: 89.00, stock: 20, image: "https://target.scene7.com/is/image/Target/GUEST_3c3f1429-e571-4558-93cb-8154218453fd?wid=1000&hei=1000", descrizione: "Monitora il tuo battito cardiaco, i passi e il sonno. Resistente all'acqua." },
    { id: 5, name: "Laptop Gaming RGB", category: "laptop", price: 1599.00, stock: 3, image: "https://i5.walmartimages.com/asr/b194e290-22bb-45c0-936d-4f6e784e0d6d_1.9fb9b8c4ebd9e389c893b63398ed5a2a.jpeg?odnHeight=450&odnWidth=450&odnBg=ffffff", descrizione: "Scheda video RTX 4070, schermo 144Hz. Il sogno dei gamer." },
    { id: 6, name: "Smartphone Base Lite", category: "smartphone", price: 249.00, stock: 12, image: "https://ss7.vzw.com/is/image/VerizonWireless/samsung-galaxy-s26-ult-black-sms948uzkv-sms948uzkev-sms948uzkfv", descrizione: "Economico, affidabile e con tutto l'essenziale che ti serve." },
    { id: 7, name: "Speaker Bluetooth Waterproof", category: "audio", price: 59.00, stock: 30, image: "https://i5.walmartimages.com/asr/f8161823-4fae-4f0e-a0d4-25e646e524c0.c69629f8d5f20646ac5f6719f59293eb.jpeg?odnHeight=450&odnWidth=450&odnBg=ffffff", descrizione: "Porta la musica sempre con te, anche in piscina o sotto la doccia." },
    { id: 8, name: "Auricolari True Wireless", category: "audio", price: 129.00, stock: 25, image: "https://i5.walmartimages.com/asr/ae0e2d16-4ede-4ca1-a53a-c7d15d729a39.869bf1901f807850ea58e35e9469edba.jpeg?odnHeight=450&odnWidth=450&odnBg=ffffff", descrizione: "Leggeri e comodi. Case di ricarica rapida incluso." }
];

// --- STATI GLOBALI (Punto 5d: Persistenza locale) ---
// Utilizzo jQuery $(document).ready(...) al posto di document.addEventListener
$(document).ready(function() {

    // Recupero da localStorage
    let cart = JSON.parse(localStorage.getItem("cartShop")) || [];
    let favorites = JSON.parse(localStorage.getItem("favoritesShop")) || [];
    let showOnlyFavorites = false;

    // --- Inizializzazione Home Page ---
    if ($("#productsContainer").length) { // Controllo se esiste nella pagina (jQuery)
        applyFiltersAndRender();

        // Event Listeners con .on() (Punto 4)
        $("#searchInput").on("input", applyFiltersAndRender);
        $("#searchButton").on("click", applyFiltersAndRender);
        $("#categoryFilter").on("change", applyFiltersAndRender);
        $("#sortFilter").on("change", applyFiltersAndRender);

        $("#resetFiltersBtn").on("click", function(e) {
            e.preventDefault();
            $("#searchInput").val(""); // .val() jQuery
            $("#categoryFilter").val("all");
            $("#sortFilter").val("default");
            showOnlyFavorites = false;
            applyFiltersAndRender();
        });

        // Punto 5b: Bottone mostra solo preferiti
        $("#showFavoritesBtn").on("click", function(e) {
            e.preventDefault();
            showOnlyFavorites = !showOnlyFavorites; // Toggle

            if (showOnlyFavorites) {
                $(this).html('<i class="fas fa-heart" style="color: red;"></i> Mostra Tutti'); // .html() jQuery
            } else {
                $(this).html('<i class="fas fa-heart" style="color: red;"></i> Solo Preferiti');
            }
            applyFiltersAndRender();
        });

        // Chiusura carrello basso
        $("#closeCartBtn").on("click", function() {
            $("#cartBottomBar").hide(); // .hide() jQuery
        });
    }

    // --- Inizializzazione Pagina Carrello ---
    if ($("#mainCartItemsContainer").length) {
        renderMainCartPage();
    }


    // ==========================================
    // FUNZIONI PRINCIPALI (Riscritte in jQuery)
    // ==========================================

    function applyFiltersAndRender() {
        const searchText = $("#searchInput").val().toLowerCase().trim(); // .val() jQuery
        const selectedCategory = $("#categoryFilter").val();
        const sortMode = $("#sortFilter").val();

        // 1. Filtraggio
        let filteredArray = prodotti.filter(prodotto => {
            const matchText = prodotto.name.toLowerCase().includes(searchText);
            const matchCategory = (selectedCategory === "all") || (prodotto.category === selectedCategory);
            const matchFav = showOnlyFavorites ? favorites.includes(prodotto.id) : true;
            return matchText && matchCategory && matchFav;
        });

        // 2. Ordinamento (Punto 5a)
        if (sortMode === "priceAsc") {
            filteredArray.sort((a, b) => a.price - b.price);
        } else if (sortMode === "priceDesc") {
            filteredArray.sort((a, b) => b.price - a.price);
        } else if (sortMode === "nameAsc") {
            filteredArray.sort((a, b) => a.name.localeCompare(b.name));
        }

        // 3. Render
        renderProducts(filteredArray);
    }

    function renderProducts(productArray) {
        const $container =$("#productsContainer"); // Selettore jQuery
        const $noResultsMsg =$("#noResultsMessage");

        $container.html(""); // .html("") svuota il div

        if (productArray.length === 0) {
            $noResultsMsg.show(); // .show() jQuery$container.hide();
        } else {
            $noResultsMsg.hide(); // .hide() jQuery$container.show();

            productArray.forEach(prodotto => {
                const prezzoStr = prodotto.price.toFixed(2).replace('.', ',') + " €";

                // Controllo se è preferito
                const isFav = favorites.includes(prodotto.id);
                const heartClass = isFav ? "fas fa-heart" : "far fa-heart";
                const heartColor = isFav ? "red" : "#000";

                const cardHtml = `
                    <div class="product-card" style="position: relative;">
                      <!-- Tasto Preferito (Punto 5b) -->
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
                $container.append(cardHtml); // Iniezione con append di jQuery
            });
        }
    }

    // --- EVENT DELEGATION: Gestione click su elementi generati dinamicamente ---

    // Aggiungi al carrello
    $(document).on("click", ".add-to-cart-btn", function() {
        const productId = parseInt($(this).data("id"));
        addToCart(productId);
    });

    // Preferiti
    $(document).on("click", ".fav-btn", function() {
        const productId = parseInt($(this).data("id"));
        if (favorites.includes(productId)) {
            favorites = favorites.filter(id => id !== productId); // Rimuovi
        } else {
            favorites.push(productId); // Aggiungi
        }
        localStorage.setItem("favoritesShop", JSON.stringify(favorites));
        applyFiltersAndRender(); // Ridisegna per aggiornare i cuori
    });

    // Apertura Modale cliccando nome o immagine (Punto 5c)
    $(document).on("click", ".product-trigger", function() {
        const productId = parseInt($(this).data("id"));
        const prodotto = prodotti.find(p => p.id === productId);

        if (prodotto) {
            $("#infoTitolo").text(prodotto.name); // .text() jQuery
            $("#infoDescrizione").text(prodotto.descrizione);
            $("#infoImmagine").attr("src", prodotto.image); // .attr() jQuery
            $("#infoPrezzo").text(prodotto.price.toFixed(2).replace('.', ',') + " €");
            $("#infoDisponibilita").text(`Disponibilità: ${prodotto.stock} pezzi in stock`);

            // Imposta l'ID sul bottone del carrello dentro la modale
            $("#modalAddToCartBtn").data("id", prodotto.id);

            $("#modalInfo").css("display", "flex"); // Equivalente di show per flex
        }
    });

    // Aggiunta carrello DALLA modale
    $("#modalAddToCartBtn").on("click", function() {
        const productId = parseInt($(this).data("id"));
        addToCart(productId);
        $("#modalInfo").hide(); // Chiudi modale dopo aggiunta
    });

    // Chiusura Modale (Punto 5c)
    $("#closeModalInfoBtn").on("click", function() {
        $("#modalInfo").hide();
    });

    // Chiusura cliccando fuori dal contenuto
    $("#modalInfo").on("click", function(e) {
        if ($(e.target).is("#modalInfo")) {
            $(this).hide();
        }
    });


    // ==========================================
    // LOGICA DEL CARRELLO
    // ==========================================

    function saveCart() {
        localStorage.setItem("cartShop", JSON.stringify(cart));
    }

    function addToCart(productId) {
        const existingItem = cart.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ productId: productId, quantity: 1 });
        }

        saveCart();

        if ($("#cartBottomBar").length) {
            $("#cartBottomBar").show();
            renderBottomCart();
        }
    }

    // Esposizione globale per i bottoni onclick inline rimanenti
    window.removeFromCart = function(productId, isMainPage = false) {
        cart = cart.filter(item => item.productId !== productId);
        saveCart();
        if(isMainPage) renderMainCartPage();
        else renderBottomCart();
    };

    window.changeQuantity = function(productId, amount, isMainPage = false) {
        const item = cart.find(item => item.productId === productId);
        if (item) {
            item.quantity += amount;
            if (item.quantity <= 0) {
                removeFromCart(productId, isMainPage);
            } else {
                saveCart();
                if(isMainPage) renderMainCartPage();
                else renderBottomCart();
            }
        }
    };

    function renderBottomCart() {
        const $container =$("#cartItemsContainer");
        const $totalEl =$("#cartTotal");
        $container.html("");
        let globalTotal = 0;

        if (cart.length === 0) {
            $container.html("<p>Il carrello è vuoto.</p>");
            $totalEl.text("0,00 €");
            return;
        }

        cart.forEach(item => {
            const prodotto = prodotti.find(p => p.id === item.productId);
            if (!prodotto) return;

            const subtotale = prodotto.price * item.quantity;
            globalTotal += subtotale;

            const itemHTML = `
                <div style="min-width: 250px; border: 2px solid #000; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; background: #f9f9f9;">
                    <h5 style="margin: 0 0 5px 0;">${prodotto.name}</h5>
                    <p style="margin: 0 0 10px 0; font-size: 0.9em;">Sub: <strong>${subtotale.toFixed(2).replace('.', ',')} €</strong></p>
                    <div style="display: flex; gap: 5px; align-items: center; margin-top: auto;">
                        <button onclick="changeQuantity(${item.productId}, -1, false)" style="padding: 2px 8px; font-weight: bold; cursor: pointer; border: 1px solid #000; background: #fff;">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQuantity(${item.productId}, 1, false)" style="padding: 2px 8px; font-weight: bold; cursor: pointer; border: 1px solid #000; background: #fff;">+</button>
                        <button onclick="removeFromCart(${item.productId}, false)" style="margin-left: auto; padding: 2px 8px; cursor: pointer; border: none; background: transparent; text-decoration: underline; color: red;">Rimuovi</button>
                    </div>
                </div>
            `;
            $container.append(itemHTML);
        });
        $totalEl.text(globalTotal.toFixed(2).replace('.', ',') + " €"); // .text() jQuery
    }

    function renderMainCartPage() {
        const $container =$("#mainCartItemsContainer");
        const $subtotaleEl =$("#mainSubtotale");
        const $totaleEl =$("#mainTotaleFinale");

        $container.html("");
        let globalTotal = 0;

        if (cart.length === 0) {
            $container.html("<p style='font-size: 1.2em; margin-top: 20px;'>Il tuo carrello è attualmente vuoto.</p>");
            $subtotaleEl.text("0,00 €");
            $totaleEl.text("0,00 €");
            return;
        }

        cart.forEach(item => {
            const prodotto = prodotti.find(p => p.id === item.productId);
            if (!prodotto) return;

            const subtotale = prodotto.price * item.quantity;
            globalTotal += subtotale;

            const htmlCard = `
            <div class="cart-item-card" style="margin-bottom: 20px;">
                <div class="cart-item-img">
                    <img src="${prodotto.image}" alt="${prodotto.name}">
                </div>
                <div class="cart-item-details">
                    <h4>${prodotto.name}</h4>
                    <p>${prodotto.descrizione}</p>
                    <div class="cart-quantity-controls">
                        <label>Quantità:</label>
                        <button onclick="changeQuantity(${item.productId}, -1, true)" style="width: 30px; height: 30px; font-weight: bold; border: 2px solid #000; cursor: pointer; background: #fff;">-</button>
                        <input type="text" value="${item.quantity}" readonly style="width: 40px; text-align: center; font-weight: bold;">
                        <button onclick="changeQuantity(${item.productId}, 1, true)" style="width: 30px; height: 30px; font-weight: bold; border: 2px solid #000; cursor: pointer; background: #fff;">+</button>
                        <button onclick="removeFromCart(${item.productId}, true)" class="btn-action" style="width: auto; padding: 5px 15px; margin-left: 15px;">Rimuovi</button>
                    </div>
                </div>
                <div class="cart-item-price">
                    <div class="price">${prodotto.price.toFixed(2).replace('.', ',')} €</div>
                </div>
            </div>
            `;
            $container.append(htmlCard);
        });

        const totaleStr = globalTotal.toFixed(2).replace('.', ',') + " €";
        $subtotaleEl.text(totaleStr);$totaleEl.text(totaleStr);
    }
});