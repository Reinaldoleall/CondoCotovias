import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
  getFirestore, doc, setDoc, updateDoc, arrayUnion, 
  getDoc, onSnapshot, collection
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { NotificationManager } from "./notifications.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC3eWDz_LzEZzhgkJzXqBK9HTMFizKdpzI",
  authDomain: "uploadarquivos-e072a.firebaseapp.com",
  projectId: "uploadarquivos-e072a",
  storageBucket: "uploadarquivos-e072a.appspot.com",
  messagingSenderId: "969790847480",
  appId: "1:969790847480:web:4fd71df64836d88ee17e0d"
};

class ChatApp {
  constructor() {
    this.app = initializeApp(firebaseConfig);
    this.db = getFirestore(this.app);
    this.currentUser = localStorage.getItem("currentUser") || "Usuário1";
    this.targetUser = localStorage.getItem("targetUser") || "Usuário2";
    this.currentChatId = [this.currentUser, this.targetUser].sort().join("_");
    this.notificationManager = new NotificationManager(this.db, this.currentUser);
    this.init();
  }

  async init() {
    this.setupUI();
    await this.notificationManager.initialize();
    this.listenForMessages();
    this.setupEventListeners();
  }

  setupUI() {
    document.getElementById("targetUserName").textContent = this.targetUser;
    M.Modal.init(document.querySelectorAll(".modal"));
  }

  listenForMessages() {
    const chatRef = doc(this.db, "chats", this.currentChatId);
    
    onSnapshot(chatRef, (snapshot) => {
      const data = snapshot.data();
      if (data) {
        this.renderMessages(data.messages || []);
      }
    });
  }

  renderMessages(messages) {
    const notesList = document.getElementById("notesList");
    notesList.innerHTML = "";

    messages.forEach(message => {
      const noteElement = document.createElement("div");
      noteElement.className = `note-card ${message.author === this.currentUser ? "note-right" : "note-left"}`;
      
      noteElement.innerHTML = `
        <div class="message-content">${message.content}</div>
        <div class="note-timestamp">
          ${new Date(message.timestamp?.toDate()).toLocaleTimeString()}
        </div>
      `;
      
      notesList.appendChild(noteElement);
    });

    notesList.scrollTop = notesList.scrollHeight;
  }

  setupEventListeners() {
    document.getElementById("saveNote").addEventListener("click", () => this.sendMessage());
    document.getElementById("toggleDeleteOption").addEventListener("change", (e) => {
      this.updateDeleteSetting(e.target.checked);
    });
  }

  async sendMessage() {
    const input = document.getElementById("noteInput");
    const content = input.value.trim();
    
    if (!content) return;

    const chatRef = doc(this.db, "chats", this.currentChatId);
    const chatSnapshot = await getDoc(chatRef);

    if (!chatSnapshot.exists()) {
      await setDoc(chatRef, { 
        messages: [],
        isDeleteEnabled: true 
      });
    }

    const newMessage = {
      id: Date.now().toString(),
      content,
      author: this.currentUser,
      timestamp: new Date(),
      read: false
    };

    await updateDoc(chatRef, {
      messages: arrayUnion(newMessage)
    });

    // Enviar notificação
    await this.notificationManager.sendNotificationToUser(
      this.targetUser,
      `Nova mensagem de ${this.currentUser}`,
      content.substring(0, 50),
      { chatId: this.currentChatId }
    );

    input.value = "";
  }

  async updateDeleteSetting(isEnabled) {
    const chatRef = doc(this.db, "chats", this.currentChatId);
    await updateDoc(chatRef, { isDeleteEnabled: isEnabled });
  }
}

// Inicializar o chat quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  new ChatApp();
});