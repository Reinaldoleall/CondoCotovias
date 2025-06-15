 // Configuração do Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyByyM8RvGNM5pyrQIQ7nCH6mmgYAIpq0bc",
            authDomain: "rifas-c414b.firebaseapp.com",
            databaseURL: "https://rifas-c414b-default-rtdb.firebaseio.com",
            projectId: "rifas-c414b",
            storageBucket: "rifas-c414b.firebasestorage.app",
            messagingSenderId: "770195193538",
            appId: "1:770195193538:web:48e585ac5661d27f3dc55b"
        };

        // Inicializa o Firebase
        firebase.initializeApp(firebaseConfig);

        // Variáveis globais
        let todasEncomendas = [];
        let detalhesListener = null;
        let encomendasListener = null;

        // Função para mostrar/ocultar loading
        function mostrarCarregamento(mostrar) {
            const loader = document.getElementById('loadingIndicator');
            if (mostrar) {
                loader.classList.add('active');
            } else {
                loader.classList.remove('active');
            }
        }

        // Função para mostrar toast
        function showToast(message, type = 'success') {
            const toast = document.createElement('div');
            toast.className = `md-toast md-toast-${type}`;
            toast.innerHTML = `
                <div class="md-toast-content">
                    <span class="md-toast-icon material-icons-round">
                        ${type === 'success' ? 'check_circle' : 
                          type === 'error' ? 'error' : 
                          type === 'warning' ? 'warning' : 'info'}
                    </span>
                    <span class="md-toast-message">${message}</span>
                    <button class="md-toast-close material-icons-round" aria-label="Fechar notificação">close</button>
                </div>
            `;
            
            document.body.appendChild(toast);
            
            // Animação de entrada
            setTimeout(() => {
                toast.classList.add('md-toast-show');
            }, 10);
            
            // Fechar após timeout
            const autoClose = setTimeout(() => {
                closeToast(toast);
            }, 5000);
            
            // Fechar ao clicar
            toast.querySelector('.md-toast-close').addEventListener('click', () => {
                clearTimeout(autoClose);
                closeToast(toast);
            });
        }

        function closeToast(toastElement) {
            toastElement.classList.remove('md-toast-show');
            toastElement.classList.add('md-toast-hide');
            
            setTimeout(() => {
                toastElement.remove();
            }, 300);
        }

        // Função para formatar data
        function formatarData(timestamp) {
            if (!timestamp) return 'N/A';
            const date = new Date(timestamp);
            return date.toLocaleString('pt-BR');
        }

        // Função para fazer logout
        async function fazerLogout() {
            try {
                await firebase.auth().signOut();
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
                showToast('Erro ao fazer logout', 'error');
            }
        }

        // Função para carregar encomendas em tempo real
        function carregarEncomendasPendentes() {
            mostrarCarregamento(true);
            
            // Remove listener anterior se existir
            if (encomendasListener) {
                firebase.database().ref('encomendas').off('value', encomendasListener);
            }
            
            // Configura novo listener
            encomendasListener = firebase.database().ref('encomendas')
                .orderByChild('status')
                .equalTo('pendente')
                .on('value', snapshot => {
                    const listaEncomendas = document.getElementById('listaEncomendasPortaria');
                    
                    if (!snapshot.exists()) {
                        listaEncomendas.innerHTML = `
                            <li class="collection-item empty-state">
                                <div class="center-align">
                                    <i class="material-icons-round large">local_shipping</i>
                                    <p>Nenhuma encomenda pendente</p>
                                </div>
                            </li>
                        `;
                        todasEncomendas = [];
                        mostrarCarregamento(false);
                        return;
                    }
                    
                    todasEncomendas = [];
                    snapshot.forEach(child => {
                        const encomenda = child.val();
                        encomenda.id = child.key;
                        
                        if (!encomenda.solicitacaoRetirada || 
                            encomenda.solicitacaoRetirada.solicitadoPor === firebase.auth().currentUser.uid) {
                            todasEncomendas.push(encomenda);
                        }
                    });
                    
                    exibirEncomendas(todasEncomendas);
                    mostrarCarregamento(false);
                }, error => {
                    console.error('Erro ao carregar encomendas:', error);
                    showToast('Erro ao carregar encomendas', 'error');
                    mostrarCarregamento(false);
                });
        }

        // Função para exibir encomendas
        function exibirEncomendas(encomendas) {
            const listaEncomendas = document.getElementById('listaEncomendasPortaria');
            const termoBusca = document.getElementById('searchInput').value.trim();
            
            // Limpa completamente a lista antes de recriar
            listaEncomendas.innerHTML = '';
            
            if (encomendas.length === 0) {
                // Exibe mensagem de estado vazio apropriada
                const mensagem = termoBusca 
                    ? `Nenhuma encomenda encontrada para "${termoBusca}"` 
                    : 'Nenhuma encomenda pendente';
                
                const icone = termoBusca ? 'search_off' : 'local_shipping';
                
                listaEncomendas.innerHTML = `
                    <li class="collection-item empty-state">
                        <div class="center-align">
                            <i class="material-icons-round large">${icone}</i>
                            <p>${mensagem}</p>
                            ${termoBusca ? '<small>Tente buscar por "Bloco X" ou "X 101"</small>' : ''}
                        </div>
                    </li>
                `;
                return;
            }
            
            // Adiciona contador de resultados apenas se houver busca ativa
            if (termoBusca) {
                const resultados = document.createElement('div');
                resultados.className = 'search-results-count';
                resultados.textContent = `${encomendas.length} ${encomendas.length === 1 ? 'encomenda encontrada' : 'encomendas encontradas'}`;
                listaEncomendas.appendChild(resultados);
            }
            
            // Adiciona cada encomenda à lista
            encomendas.forEach(encomenda => {
                const li = document.createElement('li');
                li.className = 'collection-item encomenda-item';
                li.setAttribute('data-bloco', encomenda.bloco.toLowerCase());
                li.setAttribute('data-apto', encomenda.apartamento.toLowerCase());
                li.setAttribute('data-id', encomenda.id);
                li.setAttribute('role', 'button');
                li.setAttribute('tabindex', '0');
                
                let badgeClass = '';
                let badgeText = `${encomenda.quantidade} item(s)`;
                let showDeliveryButton = true;
                
                if (encomenda.status === 'aguardando_confirmacao') {
                    badgeClass = 'blue';
                    badgeText = 'Aguardando confirmação';
                    showDeliveryButton = false;
                }
                
                li.innerHTML = `
                    <div class="row valign-wrapper">
                        <div class="col s8">
                            <strong>Bloco ${encomenda.bloco}, Apt ${encomenda.apartamento}</strong><br>
                            <small>${formatarData(encomenda.data)}</small>
                            ${encomenda.descricao ? `<p>${encomenda.descricao}</p>` : ''}
                        </div>
                        <div class="col s4 right-align">
                            <span class="badge ${badgeClass}">${badgeText}</span>
                            ${showDeliveryButton ? 
                                `<a href="#!" class="btn-floating btn-entregar" data-id="${encomenda.id}" aria-label="Registrar entrega">
                                    <i class="material-icons-round">check</i>
                                </a>` : ''}
                        </div>
                    </div>
                `;
                
                // Adiciona evento ao botão de entregar
                const btn = li.querySelector('.btn-entregar');
                if (btn) {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const encomendaId = this.getAttribute('data-id');
                        abrirModalEntrega(encomendaId);
                    });
                }
                
                // Adiciona evento para abrir detalhes
                li.addEventListener('click', function() {
                    const encomendaId = this.getAttribute('data-id');
                    abrirModalDetalhes(encomendaId);
                });
                
                // Adiciona suporte a teclado
                li.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const encomendaId = this.getAttribute('data-id');
                        abrirModalDetalhes(encomendaId);
                    }
                });
                
                listaEncomendas.appendChild(li);
            });
        }

        // Função para filtrar encomendas
        function filtrarEncomendas() {
            const termoBusca = document.getElementById('searchInput').value.toLowerCase().trim();
            const listaEncomendas = document.getElementById('listaEncomendasPortaria');
            
            if (!termoBusca) {
                exibirEncomendas(todasEncomendas);
                return;
            }
            
            const partesBusca = termoBusca.split(' ');
            const blocoBusca = partesBusca[0];
            const aptoBusca = partesBusca.length > 1 ? partesBusca[1] : '';
            
            const encomendasFiltradas = todasEncomendas.filter(encomenda => {
                const blocoMatch = encomenda.bloco.toLowerCase().includes(blocoBusca);
                const aptoMatch = aptoBusca ? encomenda.apartamento.toLowerCase().includes(aptoBusca) : true;
                return blocoMatch && aptoMatch;
            });
            
            exibirEncomendas(encomendasFiltradas);
        }

        // Função para abrir modal de entrega
        function abrirModalEntrega(encomendaId) {
            const modal = M.Modal.getInstance(document.getElementById('modalEntrega'));
            document.getElementById('btnConfirmarEntrega').setAttribute('data-id', encomendaId);
            document.getElementById('nomeRetirante').value = '';
            modal.open();
            
            // Foco no campo de nome
            setTimeout(() => {
                document.getElementById('nomeRetirante').focus();
            }, 300);
        }

        // Função para abrir modal de detalhes
        async function abrirModalDetalhes(encomendaId) {
            try {
                // Remove listener anterior se existir
                if (detalhesListener) {
                    firebase.database().ref(`encomendas/${encomendaId}`).off('value', detalhesListener);
                }
                
                // Configura novo listener
                detalhesListener = firebase.database().ref(`encomendas/${encomendaId}`)
                    .on('value', async (snapshot) => {
                        const encomenda = snapshot.val();
                        
                        if (!encomenda) {
                            showToast('Encomenda não encontrada', 'error');
                            return;
                        }
                        
                        // Preenche os dados no modal
                        document.getElementById('detalhesBlocoApto').textContent = `Bloco ${encomenda.bloco}, Apt ${encomenda.apartamento}`;
                        document.getElementById('detalhesData').textContent = formatarData(encomenda.data);
                        document.getElementById('detalhesQuantidade').textContent = encomenda.quantidade;
                        document.getElementById('detalhesDescricao').textContent = encomenda.descricao || 'Nenhuma descrição';
                        
                        // Obtém o nome do porteiro que registrou
                        if (encomenda.registradoPor) {
                            const porteiroSnapshot = await firebase.database().ref(`users/${encomenda.registradoPor}`).once('value');
                            const porteiroData = porteiroSnapshot.val();
                            document.getElementById('detalhesPorteiro').textContent = porteiroData?.nome || 'Porteiro';
                        } else {
                            document.getElementById('detalhesPorteiro').textContent = 'N/A';
                        }
                        
                        const statusBadge = document.getElementById('detalhesStatus');
                        let statusText = 'Pendente';
                        let statusClass = 'orange';
                        
                        if (encomenda.status === 'aguardando_confirmacao') {
                            statusText = 'Aguardando Confirmação';
                            statusClass = 'blue';
                        } else if (encomenda.status === 'retirado') {
                            statusText = 'Retirada';
                            statusClass = 'green';
                        }
                        
                        statusBadge.textContent = statusText;
                        statusBadge.className = `badge ${statusClass}`;
                        
                        const retiradaSection = document.getElementById('detalhesRetiradaSection');
                        const btnEntregar = document.getElementById('btnEntregarDetalhes');
                        
                        if (encomenda.status === 'pendente') {
                            retiradaSection.classList.add('hide');
                            btnEntregar.classList.remove('hide');
                            btnEntregar.setAttribute('data-id', encomendaId);
                        } else if (encomenda.status === 'aguardando_confirmacao') {
                            retiradaSection.classList.remove('hide');
                            document.getElementById('detalhesRetiradoPor').textContent = encomenda.solicitacaoRetirada?.nomeRetirante || 'N/A';
                            document.getElementById('detalhesDataRetirada').textContent = formatarData(encomenda.solicitacaoRetirada?.data);
                            btnEntregar.classList.add('hide');
                        } else {
                            document.getElementById('detalhesRetiradoPor').textContent = encomenda.retiradoPorNome || encomenda.retiradoPor || 'N/A';
                            document.getElementById('detalhesDataRetirada').textContent = formatarData(encomenda.dataRetirada);
                            retiradaSection.classList.remove('hide');
                            btnEntregar.classList.add('hide');
                        }
                    });
                
                // Abre o modal
                const modal = M.Modal.getInstance(document.getElementById('modalDetalhes'));
                modal.open();
                
            } catch (error) {
                console.error('Erro ao carregar detalhes:', error);
                showToast('Erro ao carregar detalhes', 'error');
            }
        }

        // Função para registrar nova encomenda
        async function registrarNovaEncomenda() {
            const bloco = document.getElementById('blocoEncomenda').value.trim();
            const apartamento = document.getElementById('apartamentoEncomenda').value.trim();
            const quantidade = document.getElementById('quantidadeEncomenda').value;
            const descricao = document.getElementById('descricaoEncomenda').value.trim();
            const user = firebase.auth().currentUser;
            
            if (!bloco || !apartamento || !quantidade || !user) {
                showToast('Preencha todos os campos obrigatórios', 'error');
                return;
            }
            
            try {
                mostrarCarregamento(true);
                
                // Obtém o nome do porteiro
                const userSnapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
                const userData = userSnapshot.val();
                
                const novaEncomenda = {
                    bloco: bloco,
                    apartamento: apartamento,
                    quantidade: quantidade,
                    descricao: descricao,
                    status: 'pendente',
                    data: firebase.database.ServerValue.TIMESTAMP,
                    registradoPor: user.uid,
                    registradoPorNome: userData.nome,
                    blocoApto: `Bloco ${bloco}, Apt ${apartamento}`
                };
                
                // Salva a encomenda no Firebase
                const encomendaRef = await firebase.database().ref('encomendas').push(novaEncomenda);
                
                showToast('Encomenda registrada com sucesso', 'success');
                
                // Limpa o formulário
                document.getElementById('blocoEncomenda').value = '';
                document.getElementById('apartamentoEncomenda').value = '';
                document.getElementById('quantidadeEncomenda').value = '1';
                document.getElementById('descricaoEncomenda').value = '';
                
                // Tenta enviar email de notificação
                try {
                    // Busca o email do morador no Firebase
                    const moradorSnapshot = await firebase.database().ref('users')
                        .orderByChild('blocoApto')
                        .equalTo(`${bloco}-${apartamento}`)
                        .once('value');
                    
                    if (moradorSnapshot.exists()) {
                        moradorSnapshot.forEach(child => {
                            const morador = child.val();
                            
                            // Configura os parâmetros do email
                            const templateParams = {
                                to_name: morador.nome,
                                to_email: morador.email,
                                bloco: bloco,
                                apartamento: apartamento,
                                quantidade: quantidade,
                                descricao: descricao || 'Não informada',
                                data: new Date().toLocaleString('pt-BR'),
                                porteiro: userData.nome
                            };
                            
                            // Envia o email usando EmailJS
                            emailjs.send('service_qeqs8rl', 'template_gi6qr3o', templateParams)
                                .then(response => {
                                    console.log('Email enviado com sucesso!', response.status, response.text);
                                    
                                    // Registra no log que o email foi enviado
                                    firebase.database().ref(`encomendas/${encomendaRef.key}/logs`).push({
                                        evento: 'email_notificacao_enviado',
                                        data: firebase.database.ServerValue.TIMESTAMP,
                                        status: 'sucesso',
                                        destinatario: morador.email
                                    });
                                })
                                .catch(error => {
                                    console.error('Falha ao enviar email:', error);
                                    
                                    // Registra o erro no log
                                    firebase.database().ref(`encomendas/${encomendaRef.key}/logs`).push({
                                        evento: 'email_notificacao_falhou',
                                        data: firebase.database.ServerValue.TIMESTAMP,
                                        status: 'erro',
                                        erro: error.toString(),
                                        destinatario: morador.email
                                    });
                                });
                        });
                    } else {
                        console.log('Morador não encontrado para enviar notificação');
                    }
                } catch (emailError) {
                    console.error('Erro ao tentar enviar email:', emailError);
                }
                
                mostrarCarregamento(false);
                
            } catch (error) {
                console.error('Erro ao registrar encomenda:', error);
                showToast('Erro ao registrar encomenda', 'error');
                mostrarCarregamento(false);
            }
        }

        // Função para confirmar entrega de encomenda
        async function confirmarEntregaEncomenda() {
            const encomendaId = this.getAttribute('data-id');
            const nomeRetirante = document.getElementById('nomeRetirante').value.trim();
            const user = firebase.auth().currentUser;
            
            if (!encomendaId || !nomeRetirante || !user) {
                showToast('Por favor, informe o nome de quem está retirando', 'error');
                return;
            }

            try {
                mostrarCarregamento(true);
                
                const userSnapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
                const userData = userSnapshot.val();
                
                // Verifica se já existe uma solicitação pendente
                const encomendaSnapshot = await firebase.database().ref(`encomendas/${encomendaId}`).once('value');
                const encomenda = encomendaSnapshot.val();
                
                if (encomenda.status === 'aguardando_confirmacao') {
                    showToast('Já existe uma solicitação de confirmação pendente para esta encomenda', 'warning');
                    mostrarCarregamento(false);
                    return;
                }
                
                // Atualiza para status 'aguardando_confirmacao'
                await firebase.database().ref(`encomendas/${encomendaId}`).update({
                    status: 'aguardando_confirmacao',
                    retiradoPor: nomeRetirante,
                    retiradoPorNome: nomeRetirante,
                    dataRetirada: firebase.database.ServerValue.TIMESTAMP,
                    porteiroRetiradaNome: userData.nome,
                    solicitacaoRetirada: {
                        porteiro: userData.nome,
                        data: firebase.database.ServerValue.TIMESTAMP,
                        nomeRetirante: nomeRetirante,
                        solicitadoPor: user.uid
                    }
                });

                showToast('Solicitação de retirada enviada para confirmação', 'success');
                
                const modalEntrega = M.Modal.getInstance(document.getElementById('modalEntrega'));
                modalEntrega.close();
                
                mostrarCarregamento(false);

            } catch (error) {
                console.error('Erro ao confirmar entrega:', error);
                showToast('Erro ao enviar solicitação', 'error');
                mostrarCarregamento(false);
            }
        }

        // Função para validar campos em tempo real
        function setupRealTimeValidation() {
            const fields = [
                { id: 'blocoEncomenda', required: true, minLength: 1 },
                { id: 'apartamentoEncomenda', required: true, minLength: 1 },
                { id: 'quantidadeEncomenda', required: true, min: 1 }
            ];

            fields.forEach(field => {
                const element = document.getElementById(field.id);
                const label = element.nextElementSibling;
                
                element.addEventListener('input', () => {
                    validateField(element, label, field);
                });
                
                // Validação inicial
                validateField(element, label, field);
            });
        }

        function validateField(element, label, rules) {
            const value = element.value.trim();
            let isValid = true;
            let errorMessage = '';
            
            if (rules.required && !value) {
                isValid = false;
                errorMessage = 'Campo obrigatório';
            }
            
            if (rules.minLength && value.length < rules.minLength) {
                isValid = false;
                errorMessage = `Mínimo ${rules.minLength} caracteres`;
            }
            
            if (rules.min && parseInt(value) < rules.min) {
                isValid = false;
                errorMessage = `Valor mínimo: ${rules.min}`;
            }
            
            // Atualiza estado visual
            if (isValid) {
                element.classList.remove('invalid');
                element.classList.add('valid');
                label.classList.remove('red-text');
                label.setAttribute('data-error', '');
            } else {
                element.classList.remove('valid');
                element.classList.add('invalid');
                label.classList.add('red-text');
                label.setAttribute('data-error', errorMessage);
            }
            
            return isValid;
        }

        // Gerenciamento de foco em modais
        function manageFocus() {
            const modal = document.querySelector('.modal.open');
            
            if (modal) {
                const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
                const focusableContent = modal.querySelectorAll(focusableElements);
                
                if (focusableContent.length > 0) {
                    const firstFocusableElement = focusableContent[0];
                    const lastFocusableElement = focusableContent[focusableContent.length - 1];
                    
                    // Foca no primeiro elemento
                    firstFocusableElement.focus();
                    
                    // Trap de foco dentro do modal
                    modal.addEventListener('keydown', function(e) {
                        if (e.key === 'Tab') {
                            if (e.shiftKey) {
                                if (document.activeElement === firstFocusableElement) {
                                    e.preventDefault();
                                    lastFocusableElement.focus();
                                }
                            } else {
                                if (document.activeElement === lastFocusableElement) {
                                    e.preventDefault();
                                    firstFocusableElement.focus();
                                }
                            }
                        }
                    });
                }
            }
        }

        // Inicialização quando o DOM estiver carregado
        document.addEventListener('DOMContentLoaded', function() {
            // Inicializa modais
            const modals = document.querySelectorAll('.modal');
            M.Modal.init(modals, {
                onOpenStart: manageFocus
            });
            
            // Configura listeners de tempo real
            carregarEncomendasPendentes();
            
            // Monitora estado da conexão
            firebase.database().ref('.info/connected').on('value', (snapshot) => {
                if (snapshot.val() === true) {
                    console.log('Conectado ao Firebase em tempo real');
                } else {
                    console.log('Desconectado do Firebase');
                    showToast('Não esqueça de lançar todas as encomendas recebidas.', 'warning');
                }
            });
            
            // Configura botões
            document.getElementById('btnRegistrarEncomenda').addEventListener('click', registrarNovaEncomenda);
            document.getElementById('btnConfirmarEntrega').addEventListener('click', confirmarEntregaEncomenda);
            document.getElementById('btnEntregarDetalhes').addEventListener('click', function() {
                const encomendaId = this.getAttribute('data-id');
                abrirModalEntrega(encomendaId);
            });
            
            // Configura campo de busca
            document.getElementById('searchInput').addEventListener('input', filtrarEncomendas);
            
            // Configura botão de logout
            document.getElementById('btnLogout').addEventListener('click', fazerLogout);
            
            // Limpa listeners quando o modal de detalhes é fechado
            document.getElementById('modalDetalhes').addEventListener('modal-close', function() {
                if (detalhesListener) {
                    firebase.database().ref(`encomendas/${encomendaId}`).off('value', detalhesListener);
                    detalhesListener = null;
                }
            });
            
            // Configura validação em tempo real
            setupRealTimeValidation();
            
            // Verifica autenticação
            firebase.auth().onAuthStateChanged(user => {
                if (!user) {
                    window.location.href = 'login.html';
                }
            });
        });