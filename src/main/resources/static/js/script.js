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
});

/* Punto 3d: Funzioni per gestire l'apertura e chiusura delle modali */

function mostraModaleCarrello() {
    const modale = document.getElementById("modalCarrello");
    modale.style.display = "flex"; // Usa flex per centrarla
}

function mostraModaleInfo(titolo, descrizione, urlImmagine) {
    const modale = document.getElementById("modalInfo");

    // Inietto i dati dinamici nella modale
    document.getElementById("infoTitolo").innerText = titolo;
    document.getElementById("infoDescrizione").innerText = descrizione;
    document.getElementById("infoImmagine").src = urlImmagine;

    modale.style.display = "flex";
}

function chiudiModale(idModale) {
    document.getElementById(idModale).style.display = "none";
}