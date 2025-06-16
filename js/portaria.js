
        // Configuração do Firebase (mantenha a sua)
        const firebaseConfig = {
            apiKey: "AIzaSyByyM8RvGNM5pyrQIQ7nCH6mmgYAIpq0bc",
            authDomain: "rifas-c414b.firebaseapp.com",
            databaseURL: "https://rifas-c414b-default-rtdb.firebaseio.com",
            projectId: "rifas-c414b",
            storageBucket: "rifas-c414b.firebasestorage.app",
            messagingSenderId: "770195193538",
            appId: "1:770195193538:web:48e585ac5661d27f3dc55b"
        };
        firebase.initializeApp(firebaseConfig);

        // --- VARIÁVEIS GLOBAIS ---
        let todasEncomendas = [];
        let currentUserInfo = null;
        let encomendasListener = null;

        // --- FUNÇÕES AUXILIARES ---
        const mostrarCarregamento = (mostrar) => document.getElementById('loadingIndicator').style.display = mostrar ? 'flex' : 'none';
        const formatarData = (timestamp) => timestamp ? new Date(timestamp).toLocaleString('pt-BR') : 'N/A';

        // --- TEMA (LIGHT/DARK) ---
        const themeToggle = document.getElementById('btnThemeToggle');
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            themeToggle.innerHTML = `<i class="material-icons-round">${isDarkMode ? 'light_mode' : 'dark_mode'}</i>`;
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        });

        const aplicarTemaSalvo = () => {
            const savedTheme = localStorage.getItem('theme') || 'light';
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-mode');
                themeToggle.innerHTML = '<i class="material-icons-round">light_mode</i>';
            }
        };

        // --- AUTENTICAÇÃO E INICIALIZAÇÃO ---
        document.addEventListener('DOMContentLoaded', () => {
            M.Modal.init(document.querySelectorAll('.modal'));
            aplicarTemaSalvo();

            firebase.auth().onAuthStateChanged(async user => {
                if (user) {
                    try {
                        const userSnapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
                        currentUserInfo = userSnapshot.val() || { nome: 'Porteiro' };
                        document.getElementById('userName').textContent = currentUserInfo.nome.split(' ')[0]; // Mostra só o primeiro nome
                        
                        iniciarMonitoramentoDeEncomendas();
                        configurarEventListeners();
                    } catch (error) {
                        console.error("Erro ao buscar dados do usuário:", error);
                        M.toast({html: 'Erro ao carregar dados do usuário.', classes: 'red'});
                    }
                } else {
                    window.location.href = 'login.html';
                }
            });
        });

        // --- LÓGICA PRINCIPAL ---
        function iniciarMonitoramentoDeEncomendas() {
            mostrarCarregamento(true);
            if (encomendasListener) firebase.database().ref('encomendas').off('value', encomendasListener);

            encomendasListener = firebase.database().ref('encomendas').orderByChild('data').on('value', snapshot => {
                const hoje = new Date().setHours(0, 0, 0, 0);
                let pendentesCount = 0, registradasHojeCount = 0, retiradasHojeCount = 0;
                
                todasEncomendas = [];
                if (snapshot.exists()) {
                    snapshot.forEach(child => {
                        const encomenda = { id: child.key, ...child.val() };
                        todasEncomendas.push(encomenda);

                        if (new Date(encomenda.data).setHours(0, 0, 0, 0) === hoje) registradasHojeCount++;
                        if (encomenda.status === 'pendente') pendentesCount++;
                        if (encomenda.status === 'retirado' && new Date(encomenda.dataRetirada).setHours(0, 0, 0, 0) === hoje) retiradasHojeCount++;
                    });
                }
                
                // Atualiza Dashboard e Lista
                atualizarDashboard(pendentesCount, registradasHojeCount, retiradasHojeCount);
                filtrarEncomendas(); // Usa a busca atual para exibir
                mostrarCarregamento(false);
            }, error => {
                console.error('Erro ao carregar encomendas:', error);
                M.toast({html: 'Erro crítico ao carregar dados.', classes: 'red'});
                mostrarCarregamento(false);
            });
        }
        
        function atualizarDashboard(pendentes, registradas, retiradas) {
            document.getElementById('statPendente').textContent = pendentes;
            document.getElementById('statRegistradasHoje').textContent = registradas;
            document.getElementById('statRetiradasHoje').textContent = retiradas;
        }

        function exibirEncomendas(encomendasParaExibir) {
            const listaEl = document.getElementById('listaEncomendasPortaria');
            const searchInfoEl = document.getElementById('searchResultsInfo');
            listaEl.innerHTML = '';
            searchInfoEl.innerHTML = '';

            const termoBusca = document.getElementById('searchInput').value.trim();

            if (encomendasParaExibir.length === 0) {
                const icone = termoBusca ? 'search_off' : 'inbox';
                const mensagem = termoBusca ? `Nenhuma encomenda encontrada para "${termoBusca}"` : 'Nenhuma encomenda pendente no momento.';
                listaEl.innerHTML = `
                    <li class="collection-item empty-state">
                        <i class="material-icons-round icon">${icone}</i>
                        <p>${mensagem}</p>
                    </li>`;
                return;
            }

            if (termoBusca) {
                 searchInfoEl.innerHTML = `<div class="search-results-count">${encomendasParaExibir.length} resultado(s)</div>`;
            }

            encomendasParaExibir.sort((a, b) => b.data - a.data); // Ordena da mais nova para a mais antiga

            encomendasParaExibir.forEach(encomenda => {
                const li = document.createElement('li');
                li.className = 'collection-item';
                li.onclick = () => abrirModalDetalhes(encomenda.id);
                
                let statusBadge = `<span class="badge pendente">Pendente</span>`;
                if(encomenda.status === 'aguardando_confirmacao') {
                    statusBadge = `<span class="badge confirmacao">Aguardando Conf.</span>`
                }
                
                li.innerHTML = `
                    <div class="row valign-wrapper" style="margin-bottom:0;">
                        <div class="col s8 encomenda-info">
                            <strong>Bloco ${encomenda.bloco}, Apto ${encomenda.apartamento}</strong>
                            <small>${encomenda.quantidade} item(s) - ${formatarData(encomenda.data)}</small>
                        </div>
                        <div class="col s4 right-align encomenda-actions">
                            ${statusBadge}
                            <button class="btn-floating waves-effect waves-light btn-entregar" data-id="${encomenda.id}">
                                <i class="material-icons">check</i>
                            </button>
                        </div>
                    </div>`;

                const btnEntregar = li.querySelector('.btn-entregar');
                btnEntregar.onclick = (e) => {
                    e.stopPropagation();
                    abrirModalEntrega(encomenda.id);
                };
                listaEl.appendChild(li);
            });
        }
        
        function filtrarEncomendas() {
            const termoBusca = document.getElementById('searchInput').value.toLowerCase().trim();
            const encomendasPendentes = todasEncomendas.filter(enc => enc.status === 'pendente' || enc.status === 'aguardando_confirmacao');

            if (!termoBusca) {
                exibirEncomendas(encomendasPendentes);
                return;
            }
            
            const encomendasFiltradas = encomendasPendentes.filter(enc => 
                enc.blocoApto.toLowerCase().includes(termoBusca)
            );
            exibirEncomendas(encomendasFiltradas);
        }

        async function registrarNovaEncomenda() {
            const bloco = document.getElementById('blocoEncomenda').value.trim().toUpperCase();
            const apartamento = document.getElementById('apartamentoEncomenda').value.trim();
            const quantidade = document.getElementById('quantidadeEncomenda').value;
            const descricao = document.getElementById('descricaoEncomenda').value.trim();
            
            if (!bloco || !apartamento || !quantidade) {
                M.toast({html: 'Preencha Bloco, Apartamento e Quantidade.', classes: 'red'});
                return;
            }
            
            mostrarCarregamento(true);
            try {
                const novaEncomenda = {
                    bloco, apartamento, quantidade, descricao,
                    status: 'pendente',
                    data: firebase.database.ServerValue.TIMESTAMP,
                    registradoPor: currentUserInfo.uid,
                    registradoPorNome: currentUserInfo.nome,
                    blocoApto: `Bloco ${bloco}, Apto ${apartamento}`
                };
                
                const encomendaRef = await firebase.database().ref('encomendas').push();
                await encomendaRef.set(novaEncomenda);
                
                // Adiciona log de criação
                await firebase.database().ref(`encomendas/${encomendaRef.key}/logs`).push({
                    evento: 'Criação',
                    detalhes: `Registrado por ${currentUserInfo.nome}`,
                    data: firebase.database.ServerValue.TIMESTAMP
                });
                
                M.toast({html: 'Encomenda registrada com sucesso!', classes: 'green'});
                document.getElementById('blocoEncomenda').value = '';
                document.getElementById('apartamentoEncomenda').value = '';
                document.getElementById('quantidadeEncomenda').value = '1';
                document.getElementById('descricaoEncomenda').value = '';
                M.updateTextFields(); // Atualiza labels do Materialize
                
                enviarNotificacaoPorEmail(encomendaRef.key, novaEncomenda);

            } catch (error) {
                console.error('Erro ao registrar encomenda:', error);
                M.toast({html: 'Erro ao registrar. Tente novamente.', classes: 'red'});
            } finally {
                mostrarCarregamento(false);
            }
        }
        
        async function enviarNotificacaoPorEmail(encomendaId, encomendaData) {
            try {
                const moradorSnapshot = await firebase.database().ref('users').orderByChild('blocoApto').equalTo(`${encomendaData.bloco}-${encomendaData.apartamento}`).once('value');
                
                if (!moradorSnapshot.exists()) {
                    console.warn(`Morador para ${encomendaData.blocoApto} não encontrado para notificação.`);
                    return;
                }
                
                moradorSnapshot.forEach(child => {
                    const morador = child.val();
                    if (!morador.email) return;

                    const templateParams = {
                        to_name: morador.nome || 'Morador',
                        to_email: morador.email,
                        bloco: encomendaData.bloco,
                        apartamento: encomendaData.apartamento,
                        quantidade: encomendaData.quantidade,
                        porteiro: currentUserInfo.nome,
                        data: new Date().toLocaleString('pt-BR')
                    };

                    emailjs.send('service_qeqs8rl', 'template_gi6qr3o', templateParams)
                        .then(response => {
                            console.log('Email enviado!', response.status, response.text);
                            firebase.database().ref(`encomendas/${encomendaId}/logs`).push({
                                evento: 'Notificação por E-mail',
                                detalhes: `Enviado com sucesso para ${morador.email}`,
                                data: firebase.database.ServerValue.TIMESTAMP
                            });
                        })
                        .catch(err => {
                            console.error('Falha ao enviar e-mail:', err);
                            firebase.database().ref(`encomendas/${encomendaId}/logs`).push({
                                evento: 'Falha na Notificação',
                                detalhes: `Erro ao enviar e-mail para ${morador.email}`,
                                data: firebase.database.ServerValue.TIMESTAMP
                            });
                        });
                });
            } catch (error) {
                console.error("Erro ao buscar morador para notificação:", error);
            }
        }

        async function confirmarEntregaEncomenda() {
            const encomendaId = this.getAttribute('data-id');
            const nomeRetirante = document.getElementById('nomeRetirante').value.trim();
            if (!nomeRetirante) {
                M.toast({html: 'Informe o nome de quem está retirando.', classes: 'red'});
                return;
            }

            mostrarCarregamento(true);
            try {
                const updates = {
                    status: 'aguardando_confirmacao',
                    retiradoPorNome: nomeRetirante,
                    dataRetirada: firebase.database.ServerValue.TIMESTAMP,
                    porteiroRetiradaNome: currentUserInfo.nome
                };
                await firebase.database().ref(`encomendas/${encomendaId}`).update(updates);
                
                M.toast({html: 'Aguardando confirmação do morador.', classes: 'blue'});
                M.Modal.getInstance(document.getElementById('modalEntrega')).close();
            } catch (error) {
                console.error('Erro ao confirmar entrega:', error);
                M.toast({html: 'Erro ao enviar solicitação.', classes: 'red'});
            } finally {
                mostrarCarregamento(false);
            }
        }

        // --- MODAIS ---
        const abrirModalEntrega = (encomendaId) => {
            document.getElementById('btnConfirmarEntrega').setAttribute('data-id', encomendaId);
            document.getElementById('nomeRetirante').value = '';
            M.updateTextFields();
            M.Modal.getInstance(document.getElementById('modalEntrega')).open();
        };

        const abrirModalDetalhes = async (encomendaId) => {
            mostrarCarregamento(true);
            try {
                const snapshot = await firebase.database().ref(`encomendas/${encomendaId}`).once('value');
                if (!snapshot.exists()) {
                    M.toast({html: 'Encomenda não encontrada.', classes: 'red'});
                    return;
                }
                const encomenda = snapshot.val();
                
                // Preenche dados básicos
                document.getElementById('detalhesBlocoApto').textContent = encomenda.blocoApto;
                document.getElementById('detalhesData').textContent = formatarData(encomenda.data);
                document.getElementById('detalhesPorteiro').textContent = encomenda.registradoPorNome || 'N/A';
                document.getElementById('detalhesQuantidade').textContent = encomenda.quantidade;
                document.getElementById('detalhesDescricao').textContent = encomenda.descricao || 'Nenhuma';
                
                // Status
                const statusBadge = document.getElementById('detalhesStatus');
                statusBadge.textContent = encomenda.status.replace('_', ' ').replace('aguardando confirmacao', 'Aguardando Confirmação').replace('pendente', 'Pendente').replace('retirado', 'Retirada');
                statusBadge.className = `badge ${encomenda.status === 'pendente' ? 'pendente' : encomenda.status === 'aguardando_confirmacao' ? 'confirmacao' : 'retirado'}`;

                // Seção de Retirada
                const retiradaSection = document.getElementById('detalhesRetiradaSection');
                if (encomenda.status !== 'pendente') {
                    document.getElementById('detalhesRetiradoPor').textContent = encomenda.retiradoPorNome || 'N/A';
                    document.getElementById('detalhesDataRetirada').textContent = formatarData(encomenda.dataRetirada);
                    retiradaSection.classList.remove('hide');
                } else {
                    retiradaSection.classList.add('hide');
                }

                // Botão de Entregar no Modal
                const btnEntregar = document.getElementById('btnEntregarDetalhes');
                if(encomenda.status === 'pendente') {
                    btnEntregar.classList.remove('hide');
                    btnEntregar.setAttribute('data-id', encomendaId);
                } else {
                    btnEntregar.classList.add('hide');
                }

                // Logs
                const logList = document.getElementById('detalhes-log-list');
                logList.innerHTML = '<li class="collection-item">Nenhum evento registrado.</li>';
                if (encomenda.logs) {
                    logList.innerHTML = '';
                    Object.values(encomenda.logs).reverse().forEach(log => {
                        logList.innerHTML += `<li class="collection-item log-item"><strong>${log.evento}:</strong> ${log.detalhes} <span class="grey-text right">${formatarData(log.data)}</span></li>`;
                    });
                }
                
                M.Modal.getInstance(document.getElementById('modalDetalhes')).open();

            } catch (error) {
                console.error('Erro ao carregar detalhes:', error);
                M.toast({html: 'Erro ao carregar detalhes.', classes: 'red'});
            } finally {
                mostrarCarregamento(false);
            }
        };
        
        // --- EVENT LISTENERS ---
        function configurarEventListeners() {
            document.getElementById('btnRegistrarEncomenda').addEventListener('click', registrarNovaEncomenda);
            document.getElementById('btnConfirmarEntrega').addEventListener('click', confirmarEntregaEncomenda);
            document.getElementById('searchInput').addEventListener('input', filtrarEncomendas);
            document.getElementById('btnEntregarDetalhes').addEventListener('click', function() {
                M.Modal.getInstance(document.getElementById('modalDetalhes')).close();
                abrirModalEntrega(this.getAttribute('data-id'));
            });
            document.getElementById('btnLogout').addEventListener('click', async () => {
                await firebase.auth().signOut();
                window.location.href = 'login.html';
            });
        }
    
