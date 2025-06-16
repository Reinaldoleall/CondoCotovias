
    /*
    ============================================
    |           JAVASCRIPT LOGIC               |
    ============================================
    */

    // =================================================================
    //  ATENÇÃO: CONFIGURAÇÃO DO FIREBASE E SEGURANÇA
    // =================================================================
    // A chave de API (apiKey) abaixo é pública por padrão no Firebase.
    // **É ESSENCIAL E CRUCIAL** que você configure as Regras de 
    // Segurança (Security Rules) no seu painel do Firebase Realtime 
    // Database para proteger seus dados.
    // 
    // Exemplo de Regras de Segurança:
    // {
    //   "rules": {
    //     "users": {
    //       "$uid": {
    //         ".read": "$uid === auth.uid",
    //         ".write": "$uid === auth.uid"
    //       }
    //     },
    //     "encomendas": {
    //       "$encomendaId": {
    //         // Morador pode ler suas próprias encomendas
    //         ".read": "root.child('users/' + auth.uid).child('blocoApto').val() === data.child('blocoApto').val()",
    //         // Morador pode atualizar o status para 'retirado'
    //         ".write": "(newData.child('status').val() === 'retirado' && data.child('status').val() === 'pendente') || (newData.child('status').val() === 'retirado' && data.child('status').val() === 'aguardando_confirmacao')"
    //       }
    //     }
    //   }
    // }
    // =================================================================

    const firebaseConfig = {
        apiKey: "AIzaSyByyM8RvGNM5pyrQIQ7nCH6mmgYAIpq0bc", // Substitua pela sua chave de API
        authDomain: "rifas-c414b.firebaseapp.com",
        databaseURL: "https://rifas-c414b-default-rtdb.firebaseio.com",
        projectId: "rifas-c414b",
        storageBucket: "rifas-c414b.appspot.com",
        messagingSenderId: "770195193538",
        appId: "1:770195193538:web:48e585ac5661d27f3dc55b"
    };

    // Inicializa o Firebase
    firebase.initializeApp(firebaseConfig);

    // Variáveis Globais de Estado
    let userData = null;
    let allEncomendas = {};
    let encomendasListener = null;
    let solicitacoesVerificadas = false;
    const FINISHED_PAGE_SIZE = 5;
    let finishedEncomendasDisplayed = 0;


    document.addEventListener('DOMContentLoaded', function() {
        // --- INICIALIZAÇÃO DE COMPONENTES E EVENTOS ---
        const modals = document.querySelectorAll('.modal');
        M.Modal.init(modals);
        M.Collapsible.init(document.querySelectorAll('.collapsible'));
        M.Tooltip.init(document.querySelectorAll('.tooltipped'));

        // Eventos dos botões
        document.getElementById('btnLogout').addEventListener('click', fazerLogout);
        document.getElementById('btnAtualizar').addEventListener('click', (e) => { e.preventDefault(); atualizarEncomendas(); });
        document.getElementById('btnConfirmarRetiradaModal').addEventListener('click', confirmarRetiradaSolicitada);
        document.getElementById('btnRejeitarRetirada').addEventListener('click', rejeitarRetiradaSolicitada);
        document.getElementById('btnConfirmarRetirada').addEventListener('click', confirmarRetiradaEncomenda);
        document.getElementById('searchInput').addEventListener('input', renderLists);
        document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
        document.getElementById('btnLoadMore').addEventListener('click', loadMoreFinished);

        // Funções de inicialização
        applyInitialTheme();
        monitorarConexao();
        monitorarAutenticacao();
    });

    // --- FUNÇÕES DE GERENCIAMENTO DE ESTADO E DADOS ---

    function monitorarAutenticacao() {
        firebase.auth().onAuthStateChanged(user => {
            if (!user) {
                window.location.href = 'login.html'; // Redireciona se não estiver logado
                return;
            }
            carregarDadosUsuario(user.uid);
        });
    }

    function carregarDadosUsuario(uid) {
        mostrarCarregamento(true);
        firebase.database().ref('users/' + uid).once('value')
            .then(snapshot => {
                userData = snapshot.val();
                if (!userData || userData.tipo !== 'morador') {
                    alert('Acesso negado. Esta área é restrita para moradores.');
                    fazerLogout();
                    return;
                }
                atualizarInterfaceUsuario();
                configurarListenerEncomendas();
            })
            .catch(error => {
                console.error('Erro ao carregar dados do usuário:', error);
                showToast('Erro ao carregar dados do usuário', 'error');
                mostrarCarregamento(false);
            });
    }

    function configurarListenerEncomendas() {
        const blocoApto = `Bloco ${userData.bloco}, Apt ${userData.apartamento}`;
        if (encomendasListener) encomendasListener(); // Remove listener antigo

        const encomendasRef = firebase.database().ref('encomendas').orderByChild('blocoApto').equalTo(blocoApto);
        
        encomendasListener = encomendasRef.on('value', snapshot => {
            allEncomendas = snapshot.val() || {};
            renderLists();
            
            if (!solicitacoesVerificadas) {
                verificarSolicitacoesPendentes(snapshot);
                solicitacoesVerificadas = true;
            }
            mostrarCarregamento(false);
        }, error => {
            console.error('Erro no listener de encomendas:', error);
            showToast('Erro ao carregar encomendas', 'error');
            mostrarCarregamento(false);
        });
    }

    function atualizarEncomendas() {
        const btn = document.getElementById('btnAtualizar');
        const icon = btn.querySelector('i');
        
        btn.disabled = true;
        icon.classList.add('rotate');
        mostrarCarregamento(true);

        const blocoApto = `Bloco ${userData.bloco}, Apt ${userData.apartamento}`;
        firebase.database().ref('encomendas').orderByChild('blocoApto').equalTo(blocoApto)
            .once('value')
            .then(snapshot => {
                allEncomendas = snapshot.val() || {};
                renderLists();
                showToast('Lista de encomendas atualizada!', 'success');
            })
            .catch(error => {
                console.error('Erro ao forçar atualização:', error);
                showToast('Falha ao atualizar a lista', 'error');
            })
            .finally(() => {
                btn.disabled = false;
                icon.classList.remove('rotate');
                mostrarCarregamento(false);
            });
    }
    
    // --- FUNÇÕES DE RENDERIZAÇÃO E UI ---

    function renderLists() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const encomendasArray = Object.entries(allEncomendas).map(([id, data]) => ({ id, ...data }));
        
        // Filtra por busca
        const filteredEncomendas = searchTerm 
            ? encomendasArray.filter(enc => 
                enc.id.toLowerCase().includes(searchTerm) ||
                (enc.descricao && enc.descricao.toLowerCase().includes(searchTerm)) ||
                formatarData(enc.data).includes(searchTerm)
              )
            : encomendasArray;
            
        // Separa em pendentes e finalizadas
        const pendentes = filteredEncomendas
            .filter(e => e.status === 'pendente' || e.status === 'aguardando_confirmacao')
            .sort((a, b) => b.data - a.data);

        const finalizadas = filteredEncomendas
            .filter(e => e.status !== 'pendente' && e.status !== 'aguardando_confirmacao')
            .sort((a, b) => b.dataRetirada - a.dataRetirada);

        renderPendentes(pendentes);
        renderFinalizadas(finalizadas);
    }
    
    function renderPendentes(pendentes) {
        const listaPendentes = document.getElementById('listaEncomendasPendentes');
        listaPendentes.innerHTML = '';

        if (pendentes.length === 0) {
            listaPendentes.innerHTML = criarEstadoVazio('inventory_2', 'Nenhuma encomenda pendente.');
        } else {
            pendentes.forEach(encomenda => {
                const li = document.createElement('li');
                li.setAttribute('data-id', encomenda.id);
                li.innerHTML = criarItemEncomenda(encomenda);
                listaPendentes.appendChild(li);
            });
        }
        addEventListenersToListItems();
    }
    
    function renderFinalizadas(finalizadas, append = false) {
        const listaFinalizadas = document.getElementById('listaEncomendasFinalizadas');
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        
        if (!append) {
            listaFinalizadas.innerHTML = '';
            finishedEncomendasDisplayed = 0;
        }
        
        if (finalizadas.length === 0 && !append) {
            listaFinalizadas.innerHTML = criarEstadoVazio('archive', 'Nenhuma encomenda finalizada.');
            loadMoreContainer.style.display = 'none';
            return;
        }
        
        const toDisplay = finalizadas.slice(finishedEncomendasDisplayed, finishedEncomendasDisplayed + FINISHED_PAGE_SIZE);
        
        toDisplay.forEach(encomenda => {
            const li = document.createElement('li');
            li.setAttribute('data-id', encomenda.id);
            li.innerHTML = criarItemEncomenda(encomenda);
            listaFinalizadas.appendChild(li);
        });

        finishedEncomendasDisplayed += toDisplay.length;

        if (finishedEncomendasDisplayed < finalizadas.length) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }
        
        addEventListenersToListItems();
    }
    
    function loadMoreFinished() {
        const finalizadas = Object.values(allEncomendas)
            .filter(e => e.status !== 'pendente' && e.status !== 'aguardando_confirmacao')
            .sort((a, b) => b.dataRetirada - a.dataRetirada);
        renderFinalizadas(finalizadas, true);
    }

    function addEventListenersToListItems() {
        // Usa delegação de eventos para performance
        const lists = document.querySelectorAll('.collapsible');
        lists.forEach(list => {
            // Remove listener antigo para evitar duplicação
            list.replaceWith(list.cloneNode(true));
        });

        document.querySelectorAll('.collapsible').forEach(list => {
            list.addEventListener('click', (event) => {
                const target = event.target;
                const listItem = target.closest('li[data-id]');
                if (!listItem) return;

                const encomendaId = listItem.getAttribute('data-id');

                if (target.closest('.btn-retirar')) {
                    event.stopPropagation();
                    retirarEncomenda(encomendaId);
                } else {
                    abrirModalEncomenda(encomendaId);
                }
            });
        });
        
        // Reinicia o componente do Materialize
        M.Collapsible.init(document.querySelectorAll('.collapsible'));
    }

    function criarItemEncomenda(encomenda) {
        const isPendente = encomenda.status === 'pendente' || encomenda.status === 'aguardando_confirmacao';
        const icon = isPendente ? 'local_shipping' : 'assignment_turned_in';

        return `
            <div class="collapsible-header" role="button" tabindex="0">
                <i class="material-icons-round">${icon}</i>
                Encomenda #${encomenda.id.substring(encomenda.id.length - 6)}
                <span class="badge new ${getStatusClass(encomenda)}" data-badge-caption="">${getStatusText(encomenda)}</span>
            </div>
            <div class="collapsible-body">
                <p><strong>Data Recebimento:</strong> ${formatarData(encomenda.data)}</p>
                <p><strong>Descrição:</strong> ${encomenda.descricao || 'Não especificada'}</p>
                <div class="right-align" style="margin-top: 16px;">
                    ${encomenda.status === 'pendente' ? 
                        `<a href="#!" class="btn green waves-effect waves-light btn-retirar" aria-label="Retirar encomenda">
                            <i class="material-icons-round left">check</i> Retirar
                        </a>` : ''}
                </div>
            </div>
        `;
    }

    function criarEstadoVazio(icone, mensagem) {
        return `
            <li class="empty-state" style="border: none; animation: none;">
                <i class="material-icons-round large icon">${icone}</i>
                <p>${mensagem}</p>
            </li>
        `;
    }

    function atualizarInterfaceUsuario() {
        document.getElementById('nomeUsuario').textContent = userData.nome.split(' ')[0]; // Primeiro nome
        document.getElementById('blocoApto').textContent = `Bloco ${userData.bloco} / Apto ${userData.apartamento}`;
    }

    // --- LÓGICA DE AÇÕES DO USUÁRIO ---

    function fazerLogout() {
        if (encomendasListener) encomendasListener();
        firebase.auth().signOut()
            .then(() => window.location.href = 'login.html')
            .catch(error => showToast('Erro ao sair: ' + error.message, 'error'));
    }

    function retirarEncomenda(encomendaId) {
        if (allEncomendas[encomendaId].status !== 'pendente') {
            showToast('Esta encomenda não está mais pendente.', 'warning');
            return;
        }

        const updates = {
            status: 'retirado',
            retiradoPor: userData.nome,
            dataRetirada: firebase.database.ServerValue.TIMESTAMP,
            porteiroRetiradaNome: 'Retirada pelo Morador'
        };

        mostrarCarregamento(true);
        firebase.database().ref('encomendas/' + encomendaId).update(updates)
            .then(() => showToast('Encomenda marcada como retirada!', 'success'))
            .catch(error => showToast('Erro ao atualizar encomenda: ' + error.message, 'error'))
            .finally(() => mostrarCarregamento(false));
    }
    
    function verificarSolicitacoesPendentes() {
        const user = firebase.auth().currentUser;
        if (!user) return;

        Object.entries(allEncomendas).forEach(([id, encomenda]) => {
            if (encomenda.status === 'aguardando_confirmacao' && 
                (!encomenda.confirmacoes || !encomenda.confirmacoes[user.uid])) {
                abrirModalConfirmacaoRetirada(id, encomenda);
            }
        });
    }

    async function confirmarRetiradaSolicitada() {
        const encomendaId = this.getAttribute('data-id');
        const encomenda = allEncomendas[encomendaId];

        const updates = {
            status: 'retirado',
            confirmadoPor: userData.nome,
            dataConfirmacao: firebase.database.ServerValue.TIMESTAMP,
            [`confirmacoes/${firebase.auth().currentUser.uid}`]: true,
            retiradoPor: encomenda.solicitacaoRetirada.nomeRetirante,
            dataRetirada: encomenda.solicitacaoRetirada.data
        };

        mostrarCarregamento(true);
        try {
            await firebase.database().ref(`encomendas/${encomendaId}`).update(updates);
            showToast('Retirada confirmada com sucesso!', 'success');
        } catch (error) {
            showToast('Erro ao confirmar retirada: ' + error.message, 'error');
        } finally {
            mostrarCarregamento(false);
        }
    }

    async function rejeitarRetiradaSolicitada() {
        const encomendaId = this.getAttribute('data-id');
        const updates = {
            status: 'pendente',
            solicitacaoRetirada: null,
            [`confirmacoes/${firebase.auth().currentUser.uid}`]: false // Marca como rejeitado
        };

        mostrarCarregamento(true);
        try {
            await firebase.database().ref(`encomendas/${encomendaId}`).update(updates);
            showToast('Retirada rejeitada. O status voltou para pendente.', 'warning');
        } catch (error) {
            showToast('Erro ao rejeitar: ' + error.message, 'error');
        } finally {
            mostrarCarregamento(false);
        }
    }
    
    function confirmarRetiradaEncomenda() {
        const encomendaId = this.getAttribute('data-id');
        retirarEncomenda(encomendaId);
        M.Modal.getInstance(document.getElementById('modalEncomenda')).close();
    }

    // --- MODAIS E NOTIFICAÇÕES ---

    function abrirModalEncomenda(encomendaId) {
        const encomenda = allEncomendas[encomendaId];
        if (!encomenda) return;
        
        document.getElementById('modalEncomendaTitle').textContent = `Encomenda #${encomendaId.substring(encomendaId.length - 6)}`;
        document.getElementById('modalData').textContent = formatarData(encomenda.data);
        document.getElementById('modalPorteiro').textContent = encomenda.registradoPorNome || 'Porteiro';
        document.getElementById('modalQuantidade').textContent = encomenda.quantidade;
        document.getElementById('modalDescricao').textContent = encomenda.descricao || 'Nenhuma';
        
        const statusBadge = document.getElementById('modalStatus');
        statusBadge.textContent = getStatusText(encomenda);
        statusBadge.className = `badge ${getStatusClass(encomenda)}`;

        const retiradaSection = document.getElementById('modalRetiradaSection');
        const btnConfirmar = document.getElementById('btnConfirmarRetirada');

        if (encomenda.status === 'pendente') {
            retiradaSection.style.display = 'none';
            btnConfirmar.style.display = 'inline-block';
            btnConfirmar.setAttribute('data-id', encomendaId);
        } else {
            document.getElementById('modalRetiradoPor').textContent = encomenda.retiradoPor || 'N/A';
            document.getElementById('modalDataRetirada').textContent = formatarData(encomenda.dataRetirada);
            document.getElementById('modalPorteiroRetirada').textContent = encomenda.porteiroRetiradaNome || 'Porteiro';
            retiradaSection.style.display = 'block';
            btnConfirmar.style.display = 'none';
        }

        M.Modal.getInstance(document.getElementById('modalEncomenda')).open();
    }
    
    function abrirModalConfirmacaoRetirada(encomendaId, encomenda) {
        document.getElementById('confirmacaoPorteiroNome').textContent = encomenda.solicitacaoRetirada.porteiro;
        document.getElementById('confirmacaoRetiranteNome').textContent = encomenda.solicitacaoRetirada.nomeRetirante;
        document.getElementById('confirmacaoData').textContent = formatarData(encomenda.solicitacaoRetirada.data);
        document.getElementById('confirmacaoDescricao').textContent = encomenda.descricao || 'Nenhuma';

        document.getElementById('btnConfirmarRetiradaModal').setAttribute('data-id', encomendaId);
        document.getElementById('btnRejeitarRetirada').setAttribute('data-id', encomendaId);

        M.Modal.getInstance(document.getElementById('modalConfirmacaoRetirada')).open();
    }
    
    function mostrarCarregamento(mostrar) {
        const loader = document.getElementById('loadingIndicator');
        if (mostrar) loader.classList.add('active');
        else loader.classList.remove('active');
    }

    function showToast(message, type = 'success') {
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `md-toast ${type}`;
        
        let iconName = 'check_circle';
        if (type === 'error') iconName = 'error';
        if (type === 'warning') iconName = 'warning';

        toast.innerHTML = `<i class="material-icons-round icon">${iconName}</i><span>${message}</span>`;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    }
    
    function monitorarConexao() {
        const statusEl = document.getElementById('connectionStatus');
        const textEl = document.getElementById('connectionText');
        
        firebase.database().ref('.info/connected').on('value', snapshot => {
            if (snapshot.val() === true) {
                statusEl.className = 'online';
                textEl.textContent = 'Conectado';
                setTimeout(() => statusEl.classList.remove('show'), 2000);
            } else {
                statusEl.className = 'offline show';
                textEl.textContent = 'Offline - Reconectando...';
            }
        });
    }

    // --- FUNÇÕES UTILITÁRIAS ---

    function getStatusText(encomenda) {
        if (encomenda.status === 'pendente') return 'Pendente';
        if (encomenda.status === 'aguardando_confirmacao') return 'Aguardando Confirmação';
        return 'Retirada';
    }

    function getStatusClass(encomenda) {
        if (encomenda.status === 'pendente') return 'pendente';
        if (encomenda.status === 'aguardando_confirmacao') return 'confirmacao';
        return 'retirado';
    }

    function formatarData(timestamp) {
        if (!timestamp) return 'N/A';
        return new Date(timestamp).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    // --- LÓGICA DO TEMA (DARK MODE) ---
    
    function applyInitialTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            document.body.classList.add('dark-mode');
        }
    }

    function toggleTheme() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    
