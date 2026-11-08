/**
 * @file carrello.js
 * @description Logica della pagina Carrello di E-Shop.
 * Gestisce: caricamento AJAX del carrello da XML, rendering schede articolo,
 * calcolo subtotali riga e totale complessivo, modifica quantità e rimozione
 * elementi con alert + ricalcolo immediato del DOM.
 *
 * Requisiti coperti:
 *  - Lettura AJAX da carrello.xml all'avvio
 *  - Calcolo dinamico totali parziali e complessivo
 *  - Modifica quantità con alert() e ricalcolo DOM immediato
 *  - Rimozione con alert() ed eliminazione dal DOM con ricalcolo
 *
 * Struttura:
 *   1. Stato globale
 *   2. Inizializzazione (document.ready)
 *   3. Chiamate AJAX
 *   4. Rendering DOM
 *   5. Event listeners (delegated)
 *   6. Utility locali
 */

/* ============================================================
 * 1. STATO GLOBALE
 * ============================================================ */
let cartItems = [];

/* ============================================================
 * 2. INIZIALIZZAZIONE
 * ============================================================ */
$(document).ready(function () {
    loadCartFromXML("xml/carrello.xml");
    bindCartEvents();
});

/* ============================================================
 * 3. CHIAMATE AJAX
 * ============================================================ */

/**
 * Carica il carrello da XML, lo renderizza e lo persiste su localStorage.
 * @param {string} url
 */
function loadCartFromXML(url) {
    $.ajax({
        url: url,
        type: "GET",
        dataType: "xml",
        cache: false,
        success: function (xml) {
            cartItems = parseCartXML(xml);
            renderCart();
        },
        error: function () {
            $("#mainCartItemsContainer").html(
                "<p style='color:red;'>Errore nel caricamento del carrello.</p>"
            );
        }
    });
}

/* ============================================================
 * 4. RENDERING DOM
 * ============================================================ */

/**
 * Renderizza le schede articolo, i subtotali e il totale complessivo.
 * Persiste su localStorage e aggiorna il badge navbar.
 */
function renderCart() {
    const $container = $("#mainCartItemsContainer");
    if (!$container.length) return;

    $container.empty();

    if (cartItems.length === 0) {
        $container.html(
            "<p style='font-size: 1.2em; margin-top: 20px;'>Il tuo carrello è attualmente vuoto.</p>"
        );
        $("#mainSubtotale").text(formatPrice(0));
        $("#mainTotaleFinale").text(formatPrice(0));
        updateCartBadge(cartItems);
        writeCart(cartItems);
        return;
    }

    let globalTotal = 0;

    const html = cartItems.map(function (item) {
        const subtotale = item.prezzo * item.quantita;
        globalTotal += subtotale;

        return `
            <div class="cart-item-card" style="margin-bottom: 20px;">
                <div class="cart-item-img">
                    <img src="${item.immagine}" alt="${item.nome}">
                </div>
                <div class="cart-item-details">
                    <h4>${item.nome}</h4>
                    <p>Prezzo unitario: ${formatPrice(item.prezzo)}</p>
                    <p style="color: green; font-weight: bold;">Subtotale: ${formatPrice(subtotale)}</p>
                    <div class="cart-quantity-controls">
                        <label>Quantità:</label>
                        <button class="qty-minus" data-id="${item.id}"
                                style="width: 30px; height: 30px; font-weight: bold; border: 2px solid #000; cursor: pointer; background: #fff;">-</button>
                        <input type="number" class="qty-input" data-id="${item.id}" value="${item.quantita}" min="1"
                               style="width: 60px; text-align: center; font-weight: bold; border: 2px solid #000; padding: 5px; border-radius: 4px;">
                        <button class="qty-plus" data-id="${item.id}"
                                style="width: 30px; height: 30px; font-weight: bold; border: 2px solid #000; cursor: pointer; background: #fff;">+</button>
                        <button class="qty-update btn-action" data-id="${item.id}"
                                style="width: auto; padding: 5px 15px; margin-left: 15px;">Aggiorna quantità</button>
                        <button class="qty-remove btn-action" data-id="${item.id}"
                                style="width: auto; padding: 5px 15px; margin-left: 5px;">Rimuovi</button>
                    </div>
                </div>
            </div>`;
    }).join("");

    $container.append(html);
    $("#mainSubtotale").text(formatPrice(globalTotal));
    $("#mainTotaleFinale").text(formatPrice(globalTotal));

    updateCartBadge(cartItems);
    writeCart(cartItems);
}

/* ============================================================
 * 5. EVENT LISTENERS (delegated: sopravvivono al re-render)
 * ============================================================ */
function bindCartEvents() {
    $(document).on("click", ".qty-minus", function () {
        changeQuantity(parseInt($(this).data("id"), 10), -1);
    });

    $(document).on("click", ".qty-plus", function () {
        changeQuantity(parseInt($(this).data("id"), 10), +1);
    });

    $(document).on("click", ".qty-update", function () {
        updateQuantity(parseInt($(this).data("id"), 10));
    });

    $(document).on("click", ".qty-remove", function () {
        removeItem(parseInt($(this).data("id"), 10));
    });
}

/* ============================================================
 * 6. UTILITY LOCALI
 * ============================================================ */

/**
 * Incrementa/decrementa di 1 la quantità di un articolo.
 * Se la quantità scende a 0 o meno, delega a removeItem.
 * @param {number} productId
 * @param {number} delta
 */
function changeQuantity(productId, delta) {
    const item = cartItems.find(i => i.id === productId);
    if (!item) return;

    const newQty = item.quantita + delta;
    if (newQty <= 0) {
        removeItem(productId);
        return;
    }
    item.quantita = newQty;
    alert('Quantità aggiornata per "' + item.nome + '": ' + newQty);
    renderCart();
}

/**
 * Imposta la quantità di un articolo leggendo il valore dall'input.
 * @param {number} productId
 */
function updateQuantity(productId) {
    const item = cartItems.find(i => i.id === productId);
    if (!item) return;

    const inputVal = parseInt($(".qty-input[data-id='" + productId + "']").val(), 10);
    if (isNaN(inputVal) || inputVal <= 0) {
        alert("Inserisci una quantità valida (maggiore di 0).");
        renderCart();
        return;
    }
    item.quantita = inputVal;
    alert('Quantità aggiornata per "' + item.nome + '": ' + inputVal);
    renderCart();
}

/**
 * Rimuove definitivamente un articolo dal carrello.
 * @param {number} productId
 */
function removeItem(productId) {
    const item = cartItems.find(i => i.id === productId);
    if (!item) return;

    alert("Prodotto rimosso dal carrello: " + item.nome);
    cartItems = cartItems.filter(i => i.id !== productId);
    renderCart();
}