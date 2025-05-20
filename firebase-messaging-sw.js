// Importa scripts do Firebase
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// Configuração do Firebase
firebase.initializeApp({
  apiKey: "AIzaSyByyM8RvGNM5pyrQIQ7nCH6mmgYAIpq0bc",
  authDomain: "rifas-c414b.firebaseapp.com",
  databaseURL: "https://rifas-c414b-default-rtdb.firebaseio.com",
  projectId: "rifas-c414b",
  storageBucket: "rifas-c414b.firebasestorage.app",
  messagingSenderId: "770195193538",
  appId: "1:770195193538:web:48e585ac5661d27f3dc55b"
};

const messaging = firebase.messaging();

// Handler para mensagens em background
messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  
  // Customiza a notificação
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.png',
    vibrate: [200, 100, 200],
    data: payload.data || {}
  };

  // Mostra a notificação
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handler para clique na notificação
self.addEventListener('notificationclick', function(event) {
  console.log('On notification click: ', event.notification.tag);
  
  // Fecha a notificação
  event.notification.close();
  
  // Abre/foca a página do app
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});