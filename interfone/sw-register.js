// js/sw-register.js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("../firebase-messaging-sw.js")
      .then(registration => {
        console.log("Service Worker registrado:", registration.scope);
      })
      .catch(error => {
        console.error("Falha ao registrar Service Worker:", error);
      });
  });
}