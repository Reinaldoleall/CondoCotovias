export class NotificationManager {
  constructor(db, currentUser) {
    this.db = db;
    this.currentUser = currentUser;
    this.messaging = null;
  }

  async initialize() {
    if (location.protocol !== 'https:' && !location.hostname.includes('localhost')) {
      console.warn('Notificações push requerem HTTPS');
      return false;
    }

    try {
      const { getMessaging, getToken, deleteToken, onMessage, isSupported } = await import(
        "https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging.js"
      );

      if (await isSupported()) {
        this.messaging = getMessaging();
        this.setupForegroundMessages();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao inicializar notificações:", error);
      return false;
    }
  }

  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        return await this.getFCMToken();
      } else if (permission === "denied") {
        console.warn("Permissão para notificações negada pelo usuário");
        // Aqui você pode adicionar lógica para mostrar um botão
        // que explica como ativar notificações manualmente
      }
      return null;
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      return null;
    }
  }

  async getFCMToken() {
    try {
      const cachedToken = localStorage.getItem('fcmToken');
      if (cachedToken) return cachedToken;

      const token = await getToken(this.messaging, {
        vapidKey: "BAwDFyDj0VGp4DKb9BljL2io0d0o84Yug9Fo2DqNwCbiwoCpp63eZmPj0ivixWOqzjEyICK-9ydVJc1Dx3Wlqg0"
      });
      
      if (token) {
        localStorage.setItem('fcmToken', token);
        await setDoc(doc(this.db, "users", this.currentUser), {
          fcmToken: token,
          lastLogin: new Date()
        }, { merge: true });
      }
      return token;
    } catch (error) {
      console.error("Erro ao obter token FCM:", error);
      return null;
    }
  }

  async deleteToken() {
    try {
      if (!this.messaging) return;
      
      await deleteToken(this.messaging);
      localStorage.removeItem('fcmToken');
      await updateDoc(doc(this.db, "users", this.currentUser), {
        fcmToken: FieldValue.delete()
      }, { merge: true });
    } catch (error) {
      console.error("Erro ao remover token:", error);
    }
  }

  setupForegroundMessages() {
    onMessage(this.messaging, (payload) => {
      this.showNotification(
        payload.notification?.title || "Nova mensagem",
        payload.notification?.body || "Você tem uma nova mensagem"
      );
    });
  }

  showNotification(title, body) {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      const options = {
        body,
        icon: "./icon.png",
        vibrate: [200, 100, 200],
        data: { url: window.location.href }
      };
      new Notification(title, options);
      this.playNotificationSound();
    }

    if ("setAppBadge" in navigator) {
      navigator.setAppBadge(1).catch(console.error);
    }
  }

  playNotificationSound() {
    const audio = new Audio("./sounds/notification.mp3");
    audio.play().catch(e => console.error("Erro ao reproduzir som:", e));
  }

  async sendNotificationToUser(userId, title, body, data = {}) {
    try {
      const userDoc = await getDoc(doc(this.db, "users", userId));
      if (userDoc.exists() && userDoc.data().fcmToken) {
        // Na prática, você chamaria uma Cloud Function aqui
        console.log("Simulando envio para:", userDoc.data().fcmToken);
        
        // Exemplo de como seria a chamada real:
        // await fetch('https://us-central1-seu-projeto.cloudfunctions.net/sendNotification', {
        //   method: 'POST',
        //   body: JSON.stringify({
        //     token: userDoc.data().fcmToken,
        //     title,
        //     body,
        //     data
        //   })
        // });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
      return false;
    }
  }
}