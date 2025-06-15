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
    const passwordPrompt = document.getElementById('password-prompt');
    const btnVerifyPassword = document.getElementById('btn-verify-password');
    const btnEnviar = document.getElementById('btn-enviar');
    const avisosRecentes = document.getElementById('avisos-recentes');
    const mainContent = document.getElementById('main-content');
    
    // Variables
    const ADMIN_SECURITY_PASSWORD = "";
    let authenticated = false;
    
    // Initialize - Check authentication
    document.addEventListener('DOMContentLoaded', () => {
      mainContent.style.display = 'none';
      passwordPrompt.style.display = 'block';
    });
    
    // Event Listeners
    btnVerifyPassword.addEventListener('click', verificarSenha);
    btnEnviar.addEventListener('click', publicarAviso);
    
    // Functions
    function verificarSenha() {
      const inputPassword = document.getElementById('admin-password').value;
      
      if (inputPassword === ADMIN_SECURITY_PASSWORD) {
        authenticated = true;
        passwordPrompt.style.display = 'none';
        mainContent.style.display = 'block';
        showToast('Acesso concedido!', 'success');
        carregarAvisos();
      } else {
        showToast('Senha incorreta!', 'error');
      }
    }
    
    function publicarAviso() {
      if (!authenticated) {
        passwordPrompt.style.display = 'block';
        return;
      }
      
      const titulo = document.getElementById('titulo').value;
      const mensagem = document.getElementById('mensagem').value;
      const urgente = document.getElementById('urgente').checked;
      
      if (!titulo || !mensagem) {
        showToast('Preencha todos os campos!', 'error');
        return;
      }
      
      const novoAviso = {
        titulo: titulo,
        mensagem: mensagem,
        urgente: urgente,
        data: Date.now(),
        autor: "Administração Cotovias"
      };
      
      db.ref('avisos').push(novoAviso)
        .then(() => {
          showToast('Aviso publicado com sucesso!', 'success');
          document.getElementById('titulo').value = '';
          document.getElementById('mensagem').value = '';
          document.getElementById('urgente').checked = false;
        })
        .catch((error) => {
          showToast(`Erro: ${error.message}`, 'error');
        });
    }
    
    function carregarAvisos() {
      db.ref('avisos').orderByChild('data').limitToLast(10).on('value', (snapshot) => {
        avisosRecentes.innerHTML = '';
        
        if (!snapshot.exists()) {
          avisosRecentes.innerHTML = `
            <div class="empty-state">
              <span class="material-icons empty-state__icon">info_outline</span>
              <p>Nenhum aviso cadastrado.</p>
            </div>
          `;
          return;
        }
        
        const avisos = [];
        snapshot.forEach((childSnapshot) => {
          avisos.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        
        // Sort by date (newest first)
        avisos.sort((a, b) => b.data - a.data);
        
        // Display each announcement
        avisos.forEach((aviso) => {
          const avisoElement = document.createElement('div');
          avisoElement.className = `card ${aviso.urgente ? 'urgent' : ''}`;
          
          const data = new Date(aviso.data);
          const dataFormatada = data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          avisoElement.innerHTML = `
            <div class="card__header ${aviso.urgente ? 'card__header--urgent' : 'card__header--primary'}">
              <h3 class="card__title">${aviso.titulo}</h3>
            </div>
            <div class="card__body">
              <div style="white-space: pre-wrap;">${aviso.mensagem}</div>
            </div>
            <div class="card__footer">
              <div class="date-display">
                <span class="material-icons date-display__icon">access_time</span>
                ${dataFormatada}
              </div>
              <button class="btn btn--danger" onclick="excluirAviso('${aviso.id}')">
                <span class="material-icons btn__icon">delete</span>
                Excluir
              </button>
            </div>
          `;
          
          avisosRecentes.appendChild(avisoElement);
        });
      });
    }
    
    window.excluirAviso = function(id) {
      if (confirm('Tem certeza que deseja excluir este aviso?')) {
        db.ref('avisos').child(id).remove()
          .then(() => {
            showToast('Aviso excluído com sucesso!', 'success');
          })
          .catch((error) => {
            showToast(`Erro: ${error.message}`, 'error');
          });
      }
    };
    
    function showToast(message, type) {
      const toast = document.createElement('div');
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.padding = '12px 24px';
      toast.style.borderRadius = '4px';
      toast.style.color = 'white';
      toast.style.zIndex = '1000';
      toast.style.transition = 'all 0.3s ease';
      
      if (type === 'success') {
        toast.style.backgroundColor = 'var(--md-success)';
      } else {
        toast.style.backgroundColor = 'var(--md-error)';
      }
      
      toast.textContent = message;
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    }