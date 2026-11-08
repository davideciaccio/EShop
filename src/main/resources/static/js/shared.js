/**
 * @file shared.js
 * @description Utility condivise tra home.html e carrello.html.
 * Unifica: stato carrello su localStorage, parsing XML del carrello,
 * aggiornamento badge contatore navbar e formattazione prezzi.
 *
 * Struttura:
 *   1. Costanti
 *   2. Stato carrello (localStorage)
 *   3. Parsing XML carrello
 *   4. Aggiornamento badge contatore
 *   5. Formattazione prezzi
 */

/* ============================================================
 * 1. COSTANTI
 * ============================================================ */
const CART_STORAGE_KEY = "cartShop";

/* ============================================================
 * 2. STATO CARRELLO (localStorage)
 * ============================================================ */

/**
 * Legge il carrello da localStorage. Ritorna sempre un array.
 * @returns {Array<{id:number,nome:string,prezzo:number,quantita:number,immagine:string}>}
 */
function readCart() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("Errore parsing carrello da localStorage:", e);
        return [];
    }
}

/**
 * Persiste il carrello su localStorage.
 * @param {Array} cart
 */
function writeCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart || []));
}

/* ============================================================
 * 3. PARSING XML CARRELLO
 * ============================================================ */

/**
 * Converte un documento XML <carrello><elemento>... in array di oggetti.
 * @param {Document} xml
 * @returns {Array<{id:number,nome:string,prezzo:number,quantita:number,immagine:string}>}
 */
function parseCartXML(xml) {
    const items = [];
    $(xml).find("elemento").each(function () {
        items.push({
            id:       parseInt($(this).find("idProdotto").text(), 10),
            nome:     $(this).find("nome").text(),
            prezzo:   parseFloat($(this).find("prezzoUnitario").text()),
            quantita: parseInt($(this).find("quantita").text(), 10),
            immagine: $(this).find("immagine").text()
        });
    });
    return items;
}

/* ============================================================
 * 4. BADGE CONTATORE NAVBAR
 * ============================================================ */

/**
 * Somma le quantità di tutti gli articoli e aggiorna il badge #cartCounter.
 * @param {Array} [cart] se omesso, legge da localStorage
 */
function updateCartBadge(cart) {
    const items = cart || readCart();
    const total = items.reduce(function (sum, item) {
        const q = Number(item && item.quantita);
        return sum + (isNaN(q) ? 0 : q);
    }, 0);
    $("#cartCounter").text(total);
}

/* ============================================================
 * 5. FORMATAZIONE PREZZI
 * ============================================================ */

/**
 * Formatta un numero in "12,34 €" (locale italiano).
 * @param {number} n
 * @returns {string}
 */
function formatPrice(n) {
    const num = Number(n);
    if (isNaN(num)) return "0,00 €";
    return num.toFixed(2).replace('.', ',') + " €";
}