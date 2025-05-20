// Solicitar permissão para notificações
async function solicitarPermissaoNotificacoes() {
    try {
        if (!messaging) {
            console.log('Firebase Messaging não é suportado neste navegador');
            return null;
        }
        
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Permissão para notificações concedida');
            
            // Obtém o token FCM
            const currentToken = await messaging.getToken({ 
                vapidKey: 'SUA_CHAVE_VAPID_AQUI' 
            });
            
            if (currentToken) {
                console.log('Token FCM:', currentToken);
                
                // Salva o token no banco de dados
                const user = auth.currentUser;
                if (user) {
                    await database.ref(`users/${user.uid}/fcmToken`).set(currentToken);
                }
                
                return currentToken;
            } else {
                console.log('Nenhum token FCM disponível');
                return null;
            }
        } else {
            console.log('Permissão para notificações negada');
            return null;
        }
    } catch (error) {
        console.error('Erro ao solicitar permissão para notificações:', error);
        throw error;
    }
}

// Configurar handler para mensagens em foreground
function configurarRecebimentoNotificacoes() {
    if (!messaging) return;
    
    messaging.onMessage((payload) => {
        console.log('Mensagem recebida:', payload);
        
        // Exibe notificação
        const notificationTitle = payload.notification?.title || 'Nova notificação';
        const notificationOptions = {
            body: payload.notification?.body || 'Você tem uma nova notificação',
            icon: '/icons/notification-icon.png',
            data: payload.data
        };
        
        // Mostra a notificação
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notificationTitle, notificationOptions);
        }
        
        // Atualiza a UI
        atualizarUIComNotificacao(payload);
    });
}

// Atualizar UI quando recebe notificação
function atualizarUIComNotificacao(payload) {
    // Mostra toast notification
    if (typeof M !== 'undefined' && M.toast) {
        M.toast({
            html: `<strong>${payload.notification?.title || 'Notificação'}</strong><br>
                  ${payload.notification?.body || 'Nova mensagem'}`,
            classes: 'blue',
            displayLength: 5000
        });
    }
    
    // Atualiza contador de notificações
    if (document.getElementById('contadorNotificacoes')) {
        carregarNotificacoes();
    }
}

// Carregar notificações do usuário
async function carregarNotificacoes() {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        const notificacoes = await getNotificacoesUsuario(user.uid);
        const listaNotificacoes = document.getElementById('listaNotificacoes');
        const contador = document.getElementById('contadorNotificacoes');
        
        if (!listaNotificacoes && !contador) return;
        
        // Atualiza contador
        if (contador) {
            const naoLidas = notificacoes.filter(n => !n.lida).length;
            contador.textContent = naoLidas > 0 ? naoLidas : '';
            contador.style.display = naoLidas > 0 ? 'inline-block' : 'none';
        }
        
        // Atualiza lista de notificações
        if (listaNotificacoes) {
            listaNotificacoes.innerHTML = '';
            
            if (notificacoes.length === 0) {
                listaNotificacoes.innerHTML = '<li class="center-align grey-text">Nenhuma notificação</li>';
                return;
            }
            
            notificacoes.forEach(notificacao => {
                const li = document.createElement('li');
                li.className = `collection-item ${notificacao.lida ? '' : 'blue lighten-5'}`;
                li.innerHTML = `
                    <div>
                        <h6>${notificacao.titulo}</h6>
                        <p>${notificacao.mensagem}</p>
                        <small class="grey-text">${formatarData(notificacao.data)}</small>
                    </div>
                `;
                
                li.addEventListener('click', async () => {
                    await marcarNotificacaoComoLida(user.uid, notificacao.id);
                    
                    // Ação baseada no tipo de notificação
                    if (notificacao.tipo === 'encomenda' && notificacao.encomendaId) {
                        // Abre modal com detalhes da encomenda
                        abrirModalEncomenda(notificacao.encomendaId);
                    }
                });
                
                listaNotificacoes.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar notificações:', error);
    }
}

function formatarData(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR');
}

// Inicializar notificações
document.addEventListener('DOMContentLoaded', function() {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            configurarRecebimentoNotificacoes();
        } else if (Notification.permission !== 'denied') {
            // Pode solicitar permissão quando o usuário fizer alguma ação
            document.getElementById('btnNotificacoes')?.addEventListener('click', solicitarPermissaoNotificacoes);
        }
    }
    
    // Carrega notificações quando o usuário está logado
    auth.onAuthStateChanged(user => {
        if (user) {
            carregarNotificacoes();
        }
    });
});