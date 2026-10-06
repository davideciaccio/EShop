/* Pulisce il comportamento di default o esegue validazioni aggiuntive */
document.addEventListener("DOMContentLoaded", function() {

    const searchForm = document.getElementById("searchForm");
    if(searchForm) {
        searchForm.addEventListener("submit", function(event) {
            const input = document.getElementById("searchInput").value;
            // Punto 3c: Il testo è obbligatorio
            if(input.trim() === "") {
                alert("Per favore, inserisci un termine di ricerca.");
                event.preventDefault(); // Blocca l'invio del form
            }
        });
    }

    // Punto 3e: Se siamo nella pagina carrello, calcola il totale all'apertura
    if(document.getElementById('qty1')) {
        aggiornaTotale();
    }

    // --- LOGICA PER IL LOGIN ---
    const loginForm = document.getElementById("loginForm");
    if(loginForm) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault(); // Blocca l'invio di default

            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const errorDiv = document.getElementById("loginError");

            if(email.trim() === "" || password.trim() === "") {
                errorDiv.innerText = "Per favore, compila tutti i campi obbligatori.";
                errorDiv.style.display = "block";
            } else {
                errorDiv.style.display = "none";
                // Login sempre con successo, reindirizza
                window.location.href = "home.html";
            }
        });
    }

    // --- NUOVA LOGICA PER LA REGISTRAZIONE ---
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        // Toggle password visibility (opzionale ma richiesto visivamente)
        const togglePassword = document.getElementById("togglePassword");
        const regPasswordInput = document.getElementById("regPassword");

        if(togglePassword && regPasswordInput) {
            togglePassword.addEventListener("click", function(e) {
                e.preventDefault();
                if (regPasswordInput.type === "password") {
                    regPasswordInput.type = "text";
                    togglePassword.innerText = "Nascondi";
                } else {
                    regPasswordInput.type = "password";
                    togglePassword.innerText = "Mostra";
                }
            });
        }

        registerForm.addEventListener("submit", function(event) {
            event.preventDefault(); // Blocca l'invio di default per la validazione

            // Recupero dei valori dei campi
            const nome = document.getElementById("nome").value.trim();
            const cognome = document.getElementById("cognome").value.trim();
            const email = document.getElementById("regEmail").value.trim();
            const confirmEmail = document.getElementById("confirmEmail").value.trim();
            const password = document.getElementById("regPassword").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
            const nazione = document.getElementById("nazione").value;
            const errorDiv = document.getElementById("registerError");

            // 1. Controllo campi vuoti
            if (nome === "" || cognome === "" || email === "" || confirmEmail === "" || password === "" || confirmPassword === "" || nazione === "") {
                mostraErrore(errorDiv, "Tutti i campi sono obbligatori.");
                return;
            }

            // 2. Controllo uguaglianza Email
            if (email !== confirmEmail) {
                mostraErrore(errorDiv, "Le email inserite non coincidono.");
                return;
            }

            // 3. Controllo lunghezza minima Password
            if (password.length < 8) {
                mostraErrore(errorDiv, "La password deve avere almeno 8 caratteri.");
                return;
            }

            // 4. Controllo uguaglianza Password
            if (password !== confirmPassword) {
                mostraErrore(errorDiv, "Le password inserite non coincidono.");
                return;
            }

            // Se tutto è corretto, nascondi eventuali errori
            errorDiv.style.display = "none";

            // Simula successo e reindirizza
            alert("Registrazione completata con successo!");
            window.location.href = "login.html";
        });
    }

    function mostraErrore(elementoDiv, messaggio) {
        elementoDiv.innerText = messaggio;
        elementoDiv.style.display = "block";
    }
});

/* Punto 3d: Funzioni per gestire l'apertura e chiusura delle modali */
function mostraModaleCarrello() {
    const modale = document.getElementById("modalCarrello");
    if(modale) modale.style.display = "flex"; // Usa flex per centrarla
}

function mostraModaleInfo(titolo, descrizione, urlImmagine) {
    const modale = document.getElementById("modalInfo");
    if(modale) {
        // Inietto i dati dinamici nella modale
        document.getElementById("infoTitolo").innerText = titolo;
        document.getElementById("infoDescrizione").innerText = descrizione;
        document.getElementById("infoImmagine").src = urlImmagine;
        modale.style.display = "flex";
    }
}

function chiudiModale(idModale) {
    const modale = document.getElementById(idModale);
    if(modale) modale.style.display = "none";
}

/* Punto 3e: Funzione per calcolare dinamicamente il totale del carrello */
function aggiornaTotale() {
    const inputQty1 = document.getElementById('qty1');
    const inputQty2 = document.getElementById('qty2');

    // Controlla se gli elementi esistono per evitare errori
    if(!inputQty1 || !inputQty2) return;

    // Recupera i valori
    const qty1 = parseInt(inputQty1.value) || 0;
    const qty2 = parseInt(inputQty2.value) || 0;

    const price1 = parseFloat(document.getElementById('price1').getAttribute('data-valore'));
    const price2 = parseFloat(document.getElementById('price2').getAttribute('data-valore'));

    // Calcola il nuovo totale
    const totale = (qty1 * price1) + (qty2 * price2);

    // Formatta il totale con la virgola e 2 decimali
    const totaleFormattato = totale.toFixed(2).replace('.', ',') + ' €';

    // Aggiorna l'HTML
    document.getElementById('subtotale').innerText = totaleFormattato;
    document.getElementById('totaleFinale').innerText = totaleFormattato;
}