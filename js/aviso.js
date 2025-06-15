 // Firebase Configuration
    const firebaseConfig = {
      apiKey: "AIzaSyByyM8RvGNM5pyrQIQ7nCH6mmgYAIpq0bc",
      authDomain: "rifas-c414b.firebaseapp.com",
      databaseURL: "https://rifas-c414b-default-rtdb.firebaseio.com",
      projectId: "rifas-c414b",
      storageBucket: "rifas-c414b.firebasestorage.app",
      messagingSenderId: "770195193538",
      appId: "1:770195193538:web:48e585ac5661d27f3dc55b"
    };
    
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    
    // DOM Elements
    const avisosContainer = document.getElementById('avisos-container');
    const avisoModal = document.getElementById('avisoModal');
    const modalHeader = document.getElementById('modalHeader');
    const modalTitle = document.getElementById('modalTitle');
    const modalDate = document.getElementById('modalDate');
    const modalContent = document.getElementById('modalContent');
    const closeModal = document.getElementById('closeModal');
    
    // Load Avisos from Firebase
    function loadAvisos() {
      const avisosRef = db.ref('avisos');
      
      avisosRef.orderByChild('data').limitToLast(20).on('value', (snapshot) => {
        avisosContainer.innerHTML = ''; // Clear container
        
        if (!snapshot.exists()) {
          showEmptyState();
          return;
        }
        
        const avisos = [];
        snapshot.forEach((childSnapshot) => {
          const aviso = childSnapshot.val();
          aviso.id = childSnapshot.key;
          avisos.push(aviso);
        });
        
        // Sort by date (newest first)
        avisos.sort((a, b) => b.data - a.data);
        
        // Display each aviso
        avisos.forEach(aviso => {
          createAvisoCard(aviso);
        });
      });
    }
    
    // Create Aviso Card
    function createAvisoCard(aviso) {
      const avisoElement = document.createElement('div');
      avisoElement.className = 'aviso-card';
      
      const data = new Date(aviso.data);
      const dataFormatada = data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const resumo = aviso.mensagem.length > 150 ? 
        aviso.mensagem.substring(0, 150) + '...' : 
        aviso.mensagem;
      
      // Set card classes based on urgency
      const headerClass = aviso.urgente ? 'aviso-card__header--urgente' : 'aviso-card__header--normal';
      const tagClass = aviso.urgente ? 'aviso-card__tag--urgente' : 'aviso-card__tag--normal';
      const tagText = aviso.urgente ? 'URGENTE' : 'INFORMAÇÃO';
      
      avisoElement.innerHTML = `
        <div class="aviso-card__header ${headerClass}">
          <h4 class="aviso-card__title">${aviso.titulo}</h4>
          <div class="aviso-card__date">
            <span class="material-icons aviso-card__date-icon">access_time</span>
            ${dataFormatada}
          </div>
        </div>
        <div class="aviso-card__body">
          <p class="aviso-card__summary">${resumo}</p>
        </div>
        <div class="aviso-card__footer">
          <span class="aviso-card__tag ${tagClass}">${tagText}</span>
          <div class="aviso-card__author">
            <span class="material-icons aviso-card__author-icon">person</span>
            ${aviso.autor || 'Administração Cotovias'}
          </div>
        </div>
      `;
      
      // Add click event to open modal
      avisoElement.addEventListener('click', () => {
        openAvisoModal(aviso);
      });
      
      avisosContainer.appendChild(avisoElement);
    }
    
    // Show Empty State
    function showEmptyState() {
      avisosContainer.innerHTML = `
        <div class="empty-state">
          <span class="material-icons empty-state__icon">info_outline</span>
          <h3 class="empty-state__title">Nenhum aviso disponível</h3>
          <p>Quando houver novos avisos, eles aparecerão aqui</p>
        </div>
      `;
    }
    
    // Open Aviso Modal
    function openAvisoModal(aviso) {
      // Set modal header class based on urgency
      if (aviso.urgente) {
        modalHeader.classList.remove('modal__header--normal');
        modalHeader.classList.add('modal__header--urgente');
      } else {
        modalHeader.classList.remove('modal__header--urgente');
        modalHeader.classList.add('modal__header--normal');
      }
      
      // Set modal content
      modalTitle.textContent = aviso.titulo;
      
      const data = new Date(aviso.data);
      modalDate.innerHTML = `
        <span class="material-icons modal__date-icon">access_time</span>
        ${data.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      `;
      
      // Format content with paragraphs
      modalContent.innerHTML = formatContent(aviso.mensagem);
      
      // Show modal
      avisoModal.classList.add('modal-overlay--visible');
    }
    
    // Format Content with Paragraphs
    function formatContent(text) {
      if (!text) return '';
      
      // Replace line breaks with <br>
      text = text.replace(/\n/g, '<br>');
      
      // Replace multiple <br> with paragraph breaks
      text = text.replace(/(<br>\s*){2,}/g, '</p><p>');
      
      // Wrap in paragraphs
      text = `<p>${text}</p>`;
      
      // Remove empty paragraphs
      text = text.replace(/<p><\/p>/g, '');
      
      return text;
    }
    
    // Close Modal
    function closeAvisoModal() {
      avisoModal.classList.remove('modal-overlay--visible');
    }
    
    // Event Listeners
    closeModal.addEventListener('click', closeAvisoModal);
    avisoModal.addEventListener('click', (e) => {
      if (e.target === avisoModal) {
        closeAvisoModal();
      }
    });
    
    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
      loadAvisos();
    });