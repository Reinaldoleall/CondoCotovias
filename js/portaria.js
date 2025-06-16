    /*
    ============================================
    |           JAVASCRIPT LOGIC               |
    ============================================
    */

    // =================================================================
    //  ATENÇÃO: CONFIGURAÇÃO DO FIREBASE E SEGURANÇA
    // =================================================================
    // **É ESSENCIAL E CRUCIAL** configurar as Regras de Segurança
    // (Security Rules) no seu painel do Firebase para proteger os dados.
    // A interface da Portaria precisa de permissões de escrita.
    // 
    // Exemplo de Regras de Segurança para a Portaria:
    // {
    //   "rules": {
    //     "users": { /* ... */ },
    //     "encomendas": {
    //       ".read": "auth.uid != null && root.child('users/' + auth.uid).child('tipo').val() === 'portaria'",
    //       ".write": "auth.uid != null && root.child('users/' + auth.uid).child('tipo').val() === 'portaria'",
    //       "$encomendaId": {
    //         // Permite que o morador também leia sua própria encomenda
    //         ".read": "auth.uid != null && (root.child('users/' + auth.uid).child('tipo').val() === 'portaria' || root.child('users/' + auth.uid).child('blocoApto').val() === data.child('blocoApto').val())"
    //       }
    //     }
    //   }
    // }
    // =================================================================
    const firebaseConfig = {
        apiKey: "AIzaSyByyM8RvGNM5pyrQIQ7nCH6mmgYAIpq0bc", // Substitua por sua chave
        authDomain: "rifas-c414b.firebaseapp.com",
        databaseURL: "https://rifas-c414b-default-rtdb.firebaseio.com",
        projectId: "rifas-c414b",
        storageBucket: "rifas-c414b.appspot.com",
        messagingSenderId: "770195193538",
        appId: "1:770195193538:web:48e585ac5661d27f3dc55b"
    };
    firebase.initializeApp(firebaseConfig);

    // --- ESTADO GLOBAL DA APLICAÇÃO ---
    const state = {
        currentUser: null,
        allEncomendas: {},
        activeTab: 'pendentes' // 'pendentes' ou 'finalizadas'
    };

    // --- INICIALIZAÇÃO ---
    document.addEventListener('DOMContentLoaded', () => {
        M.Modal.init(document.querySelectorAll('.modal'));
        M.Tooltip.init(document.querySelectorAll('.tooltipped'));
        M.Tabs.init(document.querySelector('.tabs'), {
            onShow: (el) => {
                state.activeTab = el.id.includes('pendentes') ? 'pendentes' : 'finalizadas';
                renderLists();
            }
        });

        setupEventListeners();
        applyInitialTheme();
        monitorarAutenticacao();
    });

    function setupEventListeners() {
        document.getElementById('btnLogout').addEventListener('click', fazerLogout);
        document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
        document.getElementById('btnRegistrarEncomenda').addEventListener('click', registrarNovaEncomenda);
        document.getElementById('btnConfirmarEntrega').addEventListener('click', confirmarEntregaEncomenda);
        document.getElementById('searchInput').addEventListener('input', renderLists);
    }
    
    function monitorarAutenticacao() {
        firebase.auth().onAuthStateChanged(user => {
            if (!user) {
                window.location.href = 'login.html';
                return;
            }
            carregarDadosUsuario(user);
        });
    }

    async function carregarDadosUsuario(user) {
        try {
            const snapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
            state.currentUser = snapshot.val();

            if (!state.currentUser || state.currentUser.tipo !== 'portaria') {
                alert('Acesso negado. Esta área é restrita para a portaria.');
                fazerLogout();
                return;
            }
            
            document.getElementById('porteiroNome').textContent = state.currentUser.nome.split(' ')[0];
            configurarListenerEncomendas();

        } catch (error) {
            console.error("Erro ao carregar dados do usuário:", error);
            showToast('Falha ao carregar dados do usuário.', 'error');
        }
    }

    function configurarListenerEncomendas() {
        mostrarCarregamento(true);
        const umMesAtras = new Date();
        umMesAtras.setMonth(umMesAtras.getMonth() - 1);
        
        firebase.database().ref('encomendas').orderByChild('data').startAt(umMesAtras.getTime())
            .on('value', snapshot => {
                state.allEncomendas = snapshot.val() || {};
                renderLists();
                updateDashboard();
                mostrarCarregamento(false);
            }, error => {
                console.error("Erro ao carregar encomendas:", error);
                showToast('Falha ao carregar lista de encomendas.', 'error');
                mostrarCarregamento(false);
            });
    }

    // --- RENDERIZAÇÃO DA UI ---
    function renderLists() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const encomendasArray = Object.entries(state.allEncomendas).map(([id, data]) => ({ id, ...data }));
        
        const filtered = !searchTerm ? encomendasArray : encomendasArray.filter(enc =>
            enc.id.toLowerCase().includes(searchTerm) ||
            `${enc.bloco} ${enc.apartamento}`.toLowerCase().includes(searchTerm) ||
            (enc.descricao && enc.descricao.toLowerCase().includes(searchTerm))
        );

        const pendentes = filtered
            .filter(e => ['pendente', 'aguardando_confirmacao'].includes(e.status))
            .sort((a, b) => b.data - a.data);

        const finalizadas = filtered
            .filter(e => e.status === 'retirado')
            .sort((a, b) => (b.dataRetirada || b.data) - (a.dataRetirada || a.data));

        populateList('listaEncomendasPendentes', pendentes);
        populateList('listaEncomendasFinalizadas', finalizadas);
    }
    
    function populateList(listId, data) {
        const listElement = document.getElementById(listId);
        listElement.innerHTML = ''; // Limpa a lista

        if (data.length === 0) {
            const message = listId.includes('Pendente') 
                ? 'Nenhuma encomenda pendente.' 
                : 'Nenhuma entrega recente encontrada.';
            listElement.innerHTML = criarEstadoVazio('inbox', message);
            return;
        }

        data.forEach(encomenda => {
            const li = document.createElement('li');
            li.className = 'collection-item';
            li.innerHTML = criarItemEncomenda(encomenda);
            li.addEventListener('click', () => abrirModalDetalhes(encomenda.id));
            listElement.appendChild(li);
        });
    }

    function criarItemEncomenda(encomenda) {
        let statusBadge;
        if (encomenda.status === 'pendente') statusBadge = `<span class="badge new pendente" data-badge-caption="">Pendente</span>`;
        else if (encomenda.status === 'aguardando_confirmacao') statusBadge = `<span class="badge new confirmacao" data-badge-caption="">Aguardando</span>`;
        else statusBadge = `<span class="badge retirado">${encomenda.retiradoPor || 'Retirado'}</span>`;
        
        return `
            <div class="row valign-wrapper" style="margin-bottom:0;">
                <div class="col s8 encomenda-info">
                    <strong>Bloco ${encomenda.bloco} / Apto ${encomenda.apartamento}</strong>
                    <small>${encomenda.descricao || `ID: ...${encomenda.id.slice(-6)}`}</small>
                </div>
                <div class="col s4 right-align encomenda-actions">
                    ${statusBadge}
                </div>
            </div>
        `;
    }

    function criarEstadoVazio(icone, mensagem) {
        return `<li class="collection-item empty-state" style="border: none;"><i class="material-icons-round large icon">${icone}</i><p>${mensagem}</p></li>`;
    }

    function updateDashboard() {
        const encomendas = Object.values(state.allEncomendas);
        const pendentesCount = encomendas.filter(e => e.status === 'pendente').length;
        const aguardandoCount = encomendas.filter(e => e.status === 'aguardando_confirmacao').length;
        document.getElementById('statPendentes').textContent = pendentesCount;
        document.getElementById('statAguardando').textContent = aguardandoCount;
    }
    
    // --- LÓGICA DE NEGÓCIO E FIREBASE ---
    async function registrarNovaEncomenda() {
        const bloco = document.getElementById('blocoEncomenda').value.trim();
        const apto = document.getElementById('apartamentoEncomenda').value.trim();
        const qtd = document.getElementById('quantidadeEncomenda').value;
        if (!bloco || !apto || !qtd) {
            showToast('Preencha Bloco, Apartamento e Quantidade.', 'error');
            return;
        }
        mostrarCarregamento(true);

        const novaEncomenda = {
            bloco, apartamento: apto, quantidade: qtd,
            descricao: document.getElementById('descricaoEncomenda').value.trim(),
            status: 'pendente',
            data: firebase.database.ServerValue.TIMESTAMP,
            registradoPor: state.currentUser.nome,
            blocoApto: `Bloco ${bloco}, Apt ${apto}`
        };

        try {
            const ref = await firebase.database().ref('encomendas').push(novaEncomenda);
            showToast('Encomenda registrada com sucesso!', 'success');
            document.getElementById('blocoEncomenda').value = '';
            document.getElementById('apartamentoEncomenda').value = '';
            document.getElementById('descricaoEncomenda').value = '';
            enviarNotificacaoEmail(novaEncomenda);
        } catch (error) {
            showToast('Erro ao registrar encomenda.', 'error');
            console.error(error);
        } finally {
            mostrarCarregamento(false);
        }
    }

    async function confirmarEntregaEncomenda() {
        const encomendaId = this.getAttribute('data-id');
        const nomeRetirante = document.getElementById('nomeRetirante').value.trim();
        if (!nomeRetirante) {
            showToast('Informe o nome de quem está retirando.', 'error');
            return;
        }

        const updates = {
            status: 'aguardando_confirmacao',
            solicitacaoRetirada: {
                porteiro: state.currentUser.nome,
                data: firebase.database.ServerValue.TIMESTAMP,
                nomeRetirante: nomeRetirante,
            }
        };
        
        mostrarCarregamento(true);
        try {
            await firebase.database().ref(`encomendas/${encomendaId}`).update(updates);
            showToast('Solicitação enviada para o morador confirmar.', 'success');
            M.Modal.getInstance(document.getElementById('modalEntrega')).close();
        } catch (error) {
            showToast('Erro ao enviar solicitação.', 'error');
            console.error(error);
        } finally {
            mostrarCarregamento(false);
        }
    }

async function enviarNotificacaoEmail(encomenda) {
    try {
        // Primeiro, formatamos o blocoApto da mesma forma que está armazenado no Firebase
        const blocoAptoFormatado = `Bloco ${encomenda.bloco}, Apt ${encomenda.apartamento}`;
        
        // Buscamos o usuário correspondente ao bloco/apto
        const userSnapshot = await firebase.database().ref('users')
            .orderByChild('blocoApto')
            .equalTo(blocoAptoFormatado)
            .once('value');

        if (!userSnapshot.exists()) {
            console.log("Nenhum morador encontrado para este bloco/apto");
            return;
        }

        // Pegamos o primeiro usuário encontrado (deveria ser único por bloco/apto)
        const userId = Object.keys(userSnapshot.val())[0];
        const morador = userSnapshot.val()[userId];

        if (!morador.email) {
            console.log("Morador não tem email cadastrado");
            return;
        }

        // Preparamos os parâmetros do email
        const templateParams = {
            to_name: morador.nome,
            to_email: morador.email,
            bloco: encomenda.bloco,
            apartamento: encomenda.apartamento,
            quantidade: encomenda.quantidade,
            descricao: encomenda.descricao || 'Não informada',
            porteiro: state.currentUser.nome,
            data: new Date(encomenda.data).toLocaleString('pt-BR')
        };

        // Enviamos o email usando EmailJS
        await emailjs.send(
            'service_qeqs8rl',  // Substitua pelo seu Service ID do EmailJS
            'template_gi6qr3o', // Substitua pelo seu Template ID do EmailJS
            templateParams
        );

        console.log("Email de notificação enviado com sucesso para:", morador.email);

    } catch (error) {
        console.error("Falha ao enviar e-mail de notificação:", error);
        showToast('Aviso: Falha ao notificar morador por e-mail.', 'warning');
    }
}
    
    function fazerLogout() {
        firebase.auth().signOut().catch(error => console.error("Erro ao sair:", error));
    }

    // --- MODAIS E UTILITÁRIOS ---
    function abrirModalDetalhes(encomendaId) {
        const encomenda = state.allEncomendas[encomendaId];
        if (!encomenda) return;
        
        document.getElementById('modalDetalhesTitle').textContent = `Encomenda #${encomendaId.slice(-6)}`;
        document.getElementById('detalhesBlocoApto').textContent = `Bloco ${encomenda.bloco}, Apto ${encomenda.apartamento}`;
        document.getElementById('detalhesData').textContent = new Date(encomenda.data).toLocaleString('pt-BR');
        document.getElementById('detalhesPorteiro').textContent = encomenda.registradoPor || 'N/A';
        document.getElementById('detalhesQuantidade').textContent = encomenda.quantidade;
        document.getElementById('detalhesDescricao').textContent = encomenda.descricao || 'Nenhuma';

        const statusBadge = document.getElementById('detalhesStatus');
        const retiradaSection = document.getElementById('detalhesRetiradaSection');
        
        if (encomenda.status === 'pendente') {
            statusBadge.className = 'badge pendente'; statusBadge.textContent = 'Pendente';
            retiradaSection.style.display = 'none';
        } else if (encomenda.status === 'aguardando_confirmacao') {
            statusBadge.className = 'badge confirmacao'; statusBadge.textContent = 'Aguardando Confirmação';
            retiradaSection.style.display = 'block';
            document.getElementById('detalhesRetiradoPor').textContent = `${encomenda.solicitacaoRetirada.nomeRetirante} (Aguardando)`;
            document.getElementById('detalhesDataRetirada').textContent = new Date(encomenda.solicitacaoRetirada.data).toLocaleString('pt-BR');
        } else {
            statusBadge.className = 'badge retirado'; statusBadge.textContent = 'Retirado';
            retiradaSection.style.display = 'block';
            document.getElementById('detalhesRetiradoPor').textContent = encomenda.retiradoPor || 'N/A';
            document.getElementById('detalhesDataRetirada').textContent = new Date(encomenda.dataRetirada).toLocaleString('pt-BR');
        }

        const modalInstance = M.Modal.getInstance(document.getElementById('modalDetalhes'));
        // Special logic for entrega button
        if (encomenda.status === 'pendente') {
            const btnConfirmar = document.createElement('a');
            btnConfirmar.id = "btnModalEntregar";
            btnConfirmar.className = "btn waves-effect";
            btnConfirmar.textContent = "Registrar Entrega";
            btnConfirmar.onclick = () => {
                modalInstance.close();
                const entregaModal = M.Modal.getInstance(document.getElementById('modalEntrega'));
                document.getElementById('btnConfirmarEntrega').setAttribute('data-id', encomendaId);
                entregaModal.open();
            };
            const footer = modalInstance.el.querySelector('.modal-footer');
            if(footer.querySelector("#btnModalEntregar")) footer.querySelector("#btnModalEntregar").remove();
            footer.appendChild(btnConfirmar);
        } else {
             const footer = modalInstance.el.querySelector('.modal-footer');
             if(footer.querySelector("#btnModalEntregar")) footer.querySelector("#btnModalEntregar").remove();
        }

        modalInstance.open();
    }

    function mostrarCarregamento(mostrar) {
        document.getElementById('loadingIndicator').classList.toggle('active', mostrar);
    }
    
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `md-toast ${type}`;
        const iconName = type === 'error' ? 'error' : (type === 'warning' ? 'warning' : 'check_circle');
        toast.innerHTML = `<i class="material-icons-round icon">${iconName}</i><span>${message}</span>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    }

    // --- LÓGICA DO TEMA (DARK MODE) ---
    function applyInitialTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.classList.add('dark-mode');
        }
    }
    function toggleTheme() {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
