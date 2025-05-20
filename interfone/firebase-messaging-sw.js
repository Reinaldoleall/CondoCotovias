importScripts("https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging.js");

firebase.initializeApp({
  apiKey: "AIzaSyC3eWDz_LzEZzhgkJzXqBK9HTMFizKdpzI",
  authDomain: "uploadarquivos-e072a.firebaseapp.com",
  projectId: "uploadarquivos-e072a",
  storageBucket: "uploadarquivos-e072a.appspot.com",
  messagingSenderId: "969790847480",
  appId: "1:969790847480:web:4fd71df64836d88ee17e0d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Notificação recebida em background:", payload);
  
  const notificationTitle = payload.notification?.title || "Nova mensagem";
  const notificationOptions = {
    body: payload.notification?.body || "Você tem uma nova mensagem",
    icon: "./icon.png",
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || "/";
  
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});