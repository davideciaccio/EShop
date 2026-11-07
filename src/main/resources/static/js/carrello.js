// ==========================================
// STATO GLOBALE
// ==========================================
let cartItems = [];

$(document).ready(function () {
    // PUNTO a) — Ad OGNI caricamento della pagina
    // viene effettuata la richiesta AJAX verso il file XML.
    loadCartFromXML("xml/carrello.xml");
});

// ==========================================
// PUNTO a) — CARICAMENTO AJAX DEL CARRELLO
// Ad ogni caricamento pagina viene letto il file XML,
// gli elementi vengono individuati, convertiti in
// oggetti e trasformati in schede HTML da renderCart().
// Al termine renderCart() scrive anche su localStorage
// per mantenere allineato il contatore della home (TASK 1).
// ==========================================
function loadCartFromXML(url) {
    $.ajax({
        url: url,
        type: "GET",
        dataType: "xml",
        cache: false,          // forza una richiesta fresca ad ogni page load
        success: function (xml) {
            parseCartXML(xml); // (1)+(2) legge XML, individua <elemento>
            renderCart();      // (3)(4)(5) crea schede, subtotali, totale; + saveCart()
        },
        error: function () {
            $("#mainCartItemsContainer").html(
                "<p style='color:red;'>Errore nel caricamento del carrello.</p>"
            );
        }
    });
}

// Legge gli elementi <elemento> dal file carrello.xml
function parseCartXML(xml) {
    cartItems = [];
    $(xml).find("elemento").each(function () {
        cartItems.push({
            id:        parseInt($(this).find("idProdotto").text(), 10),
            nome:      $(this).find("nome").text(),
            prezzo:    parseFloat($(this).find("prezzoUnitario").text()),
            quantita:  parseInt($(this).find("quantita").text(), 10),
            immagine:  $(this).find("immagine").text()
        });
    });
}

// ==========================================
// RENDERIZZAZIONE DEL CARRELLO
// (3) Crea dinamicamente le schede.
// (4) Calcola il subtotale per riga.
// (5) Calcola il totale complessivo.
// Aggiorna il badge contatore e persiste su
// localStorage per coerenza con home.html (TASK 1).
// ==========================================
function renderCart() {
    const $container   = $("#mainCartItemsContainer");
    const $subtotaleEl = $("#mainSubtotale");
    const $totaleEl    = $("#mainTotaleFinale");

    if (!$container.length) return;

    $container.html("");
    let globalTotal = 0;

    if (cartItems.length === 0) {
        $container.html(
            "<p style='font-size: 1.2em; margin-top: 20px;'>Il tuo carrello è attualmente vuoto.</p>"
        );
        $subtotaleEl.text("0,00 €");
        $totaleEl.text("0,00 €");
    } else {
        cartItems.forEach(function (item) {
            // (4) subtotale riga
            const subtotale = item.prezzo * item.quantita;
            globalTotal += subtotale;

            // (3) scheda HTML dinamica (con pulsante Rimuovi → punto b)
            const htmlCard = `
            <div class="cart-item-card" style="margin-bottom: 20px;">
                <div class="cart-item-img">
                    <img src="${item.immagine}" alt="${item.nome}">
                </div>
                <div class="cart-item-details">
                    <h4>${item.nome}</h4>
                    <p>Prezzo unitario: ${item.prezzo.toFixed(2).replace('.', ',')} €</p>
                    <p style="color: green; font-weight: bold;">
                        Subtotale: ${subtotale.toFixed(2).replace('.', ',')} €
                    </p>
                    <div class="cart-quantity-controls">
                        <label>Quantità:</label>
                        <button onclick="changeQuantity(${item.id}, -1)"
                                style="width: 30px; height: 30px; font-weight: bold;
                                       border: 2px solid #000; cursor: pointer; background: #fff;">-</button>
                        <input type="number" id="qty_${item.id}" value="${item.quantita}" min="1"
                               style="width: 60px; text-align: center; font-weight: bold;
                                      border: 2px solid #000; padding: 5px; border-radius: 4px;">
                        <button onclick="changeQuantity(${item.id}, 1)"
                                style="width: 30px; height: 30px; font-weight: bold;
                                       border: 2px solid #000; cursor: pointer; background: #fff;">+</button>
                        <button onclick="updateQuantity(${item.id})" class="btn-action"
                                style="width: auto; padding: 5px 15px; margin-left: 15px;">
                            Aggiorna quantità
                        </button>
                        <button onclick="removeItem(${item.id})" class="btn-action"
                                style="width: auto; padding: 5px 15px; margin-left: 5px;">
                            Rimuovi
                        </button>
                    </div>
                </div>
            </div>
            `;
            $container.append(htmlCard);
        });

        // (5) totale complessivo
        const totaleStr = globalTotal.toFixed(2).replace('.', ',') + " €";
        $subtotaleEl.text(totaleStr);
        $totaleEl.text(totaleStr);
    }

    updateCartCounter(); // badge in navbar
    saveCart();          // TASK 1: allinea home.html ↔ carrello.html
}

// ==========================================
// AGGIORNAMENTO BADGE CONTATORE
// ==========================================
function updateCartCounter() {
    const total = cartItems.reduce(function (sum, item) {
        return sum + (isNaN(item.quantita) ? 0 : item.quantita);
    }, 0);
    $("#cartCounter").text(total);
}

// ==========================================
// TASK 1 — persistenza su localStorage
// (usata da home.js per il contatore condiviso)
// ==========================================
function saveCart() {
    localStorage.setItem("cartShop", JSON.stringify(cartItems));
}

// ==========================================
// PUNTO b) — RIMOZIONE DI UN PRODOTTO
// Al click sul pulsante "Rimuovi":
//   1. mostra un alert() con il nome del prodotto;
//   2. elimina immediatamente l'elemento dal client;
//   3. ricalcola e aggiorna il totale (via renderCart).
// ==========================================
window.removeItem = function (productId) {
    const item = cartItems.find(i => i.id === productId);
    if (!item) return;

    alert("Prodotto rimosso dal carrello: " + item.nome);

    cartItems = cartItems.filter(i => i.id !== productId);
    renderCart();   // ricrea le schede + ricalcola subtotali e totale + saveCart()
};

// ==========================================
// PUNTO b-bis) — MODIFICA QUANTITÀ
// (funzionalità preesistente, mantenuta invariata;
//  contribuisce al ricalcolo del totale, requisito a.5)
// ==========================================
window.changeQuantity = function (productId, delta) {
    const item = cartItems.find(i => i.id === productId);
    if (!item) return;

    const newQty = item.quantita + delta;
    if (newQty <= 0) {
        removeItem(productId);
        return;
    }
    item.quantita = newQty;
    alert("Quantità aggiornata per \"" + item.nome + "\": " + newQty);
    renderCart();
};

window.updateQuantity = function (productId) {
    const item = cartItems.find(i => i.id === productId);
    if (!item) return;

    const inputVal = parseInt($("#qty_" + productId).val(), 10);
    if (isNaN(inputVal) || inputVal <= 0) {
        alert("Inserisci una quantità valida (maggiore di 0).");
        renderCart();
        return;
    }
    item.quantita = inputVal;
    alert("Quantità aggiornata per \"" + item.nome + "\": " + inputVal);
    renderCart();
};