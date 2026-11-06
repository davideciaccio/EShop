// --- DATI E STATO GLOBALE (CARRELLO) ---
let prodotti = [];
let cart = JSON.parse(localStorage.getItem("cartShop"));

$(document).ready(function() {
    // La pagina carrello ha bisogno del catalogo completo per mostrare foto e prezzi corretti.
    Promise.all([
        fetchXMLData("xml/prodotti1.xml"),
        fetchXMLData("xml/prodotti2.xml")
    ]).then(() => {
        if (!cart) {
            loadInitialCartFromXML("xml/carrello.xml", renderMainCartPage);
        } else {
            renderMainCartPage();
        }
    }).catch(err => {
        console.error("Errore caricamento prodotti nel carrello", err);
        $("#mainCartItemsContainer").html("<p style='color:red;'>Errore nel caricamento dei dati.</p>");
    });
});

// ==========================================
// FUNZIONI DI UTILITA' E CARICAMENTO
// ==========================================
function saveCart() {
    localStorage.setItem("cartShop", JSON.stringify(cart));
}

function fetchXMLData(url) {
    return fetch(url)
        .then(response => {
            if(!response.ok) throw new Error("Errore network");
            return response.text();
        })
        .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
        .then(xml => parseProductsXML(xml));
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
// LOGICA FUNZIONALE CARRELLO
// ==========================================

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

// Rimuovi Prodotto (esposto globalmente per inline onclick del carrello.html)
window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.productId !== productId);
    saveCart();
    renderMainCartPage(); // Ridisegna
};

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