const checkbox = document.getElementById("btnDark");

if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark");
        checkbox.checked = true;
    }

    checkbox.addEventListener("change", function () {
  
        document.body.classList.toggle("dark", checkbox.checked);        
        localStorage.setItem("darkMode", checkbox.checked);
    });

var texto = "Estudante no Cotemig, fã de front-end e criar jogos.";
var divTexto = document.getElementById("texto-digitado");
var i = 0;