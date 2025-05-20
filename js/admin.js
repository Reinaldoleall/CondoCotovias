// Painel de administração
document.addEventListener('DOMContentLoaded', function() {
    if (!window.location.pathname.includes('admin.html')) return;
    
    const auth = firebase.auth();
    const database = firebase.database();
    
    // Verifica se é admin
    auth.onAuthStateChanged(async user => {
        if (!user) return;
        
        const userSnapshot = await database.ref('users/' + user.uid).once('value');
        const userData = userSnapshot.val();
        
        if (userData.tipo !== 'admin') {
            window.location.href = 'index.html';
            return;
        }
        
        // Carrega dados do painel
        carregarEstatisticas();
        carregarUsuarios();
        carregarHistorico();
    });
    
    // Gerar código de porteiro
    document.getElementById('btnGerarCodigo')?.addEventListener('click', async function() {
        const validade = document.getElementById('validadeCodigo').value || 24;
        const usos = document.getElementById('usosCodigo').value || 1;
        
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('Usuário não autenticado');
            
            // Gera código aleatório
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code = '';
            for (let i = 0; i < 8; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            const codeData = {
                code: code,
                createdBy: user.uid,
                createdAt: Date.now(),
                validUntil: Date.now() + (validade * 60 * 60 * 1000),
                maxUses: parseInt(usos),
                usedCount: 0
            };
            
            await database.ref('porteiroCodes').push().set(codeData);
            
            M.toast({html: `Código gerado: ${code}`, classes: 'green'});
            carregarCodigosPorteiro();
        } catch (error) {
            M.toast({html: `Erro: ${error.message}`, classes: 'red'});
        }
    });
    
    // Carregar estatísticas
    async function carregarEstatisticas() {
        try {
            const encomendasSnapshot = await database.ref('encomendas').once('value');
            const historicoSnapshot = await database.ref('historico').once('value');
            const usersSnapshot = await database.ref('users').once('value');
            
            const totalEncomendas = encomendasSnapshot.numChildren() + historicoSnapshot.numChildren();
            const encomendasPendentes = encomendasSnapshot.numChildren();
            const totalUsuarios = usersSnapshot.numChildren();
            
            document.getElementById('totalEncomendas').textContent = totalEncomendas;
            document.getElementById('encomendasPendentes').textContent = encomendasPendentes;
            document.getElementById('totalUsuarios').textContent = totalUsuarios;
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }
    
    // Carregar usuários
    async function carregarUsuarios() {
        try {
            const snapshot = await database.ref('users').once('value');
            const tabelaUsuarios = document.getElementById('tabelaUsuarios');
            
            if (!snapshot.exists()) {
                tabelaUsuarios.innerHTML = '<tr><td colspan="5">Nenhum usuário cadastrado</td></tr>';
                return;
            }
            
            tabelaUsuarios.innerHTML = '';
            snapshot.forEach(child => {
                const user = child.val();
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td>${user.nome || 'N/A'}</td>
                    <td>${user.email}</td>
                    <td>${user.tipo}</td>
                    <td>${user.bloco ? user.bloco + '/' + user.apartamento : 'N/A'}</td>
                    <td>
                        <button class="btn red btn-small btn-remover-usuario" data-id="${child.key}">
                            <i class="material-icons">delete</i>
                        </button>
                    </td>
                `;
                
                tabelaUsuarios.appendChild(tr);
            });
            
            // Adiciona eventos aos botões de remover
            document.querySelectorAll('.btn-remover-usuario').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const userId = this.getAttribute('data-id');
                    const confirmacao = confirm('Tem certeza que deseja remover este usuário?');
                    
                    if (confirmacao) {
                        try {
                            await database.ref('users/' + userId).remove();
                            M.toast({html: 'Usuário removido', classes: 'green'});
                            carregarUsuarios();
                        } catch (error) {
                            M.toast({html: `Erro: ${error.message}`, classes: 'red'});
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
    }
    
    // Carregar histórico
    async function carregarHistorico() {
        try {
            const snapshot = await database.ref('historico')
                .orderByChild('data')
                .limitToLast(50)
                .once('value');
                
            const tabelaHistorico = document.getElementById('tabelaHistorico');
            
            if (!snapshot.exists()) {
                tabelaHistorico.innerHTML = '<tr><td colspan="6">Nenhum registro no histórico</td></tr>';
                return;
            }
            
            tabelaHistorico.innerHTML = '';
            snapshot.forEach(child => {
                const item = child.val();
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td>${formatarData(item.data)}</td>
                    <td>${item.blocoApto}</td>
                    <td>${item.quantidade}</td>
                    <td>${item.porteiroNome}</td>
                    <td>${item.retiradoPor || 'N/A'}</td>
                    <td>
                        <span class="badge ${item.status === 'pendente' ? 'orange' : 'green'}">
                            ${item.status === 'pendente' ? 'Pendente' : 'Retirado'}
                        </span>
                    </td>
                `;
                
                tabelaHistorico.appendChild(tr);
            });
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        }
    }
    
    // Carregar códigos de porteiro
    async function carregarCodigosPorteiro() {
        try {
            const snapshot = await database.ref('porteiroCodes').once('value');
            const tabelaCodigos = document.getElementById('tabelaCodigos');
            
            if (!snapshot.exists()) {
                tabelaCodigos.innerHTML = '<tr><td colspan="5">Nenhum código gerado</td></tr>';
                return;
            }
            
            tabelaCodigos.innerHTML = '';
            snapshot.forEach(child => {
                const code = child.val();
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td>${code.code}</td>
                    <td>${formatarData(code.createdAt)}</td>
                    <td>${formatarData(code.validUntil)}</td>
                    <td>${code.usedCount}/${code.maxUses}</td>
                    <td>
                        <button class="btn red btn-small btn-remover-codigo" data-id="${child.key}">
                            <i class="material-icons">delete</i>
                        </button>
                    </td>
                `;
                
                tabelaCodigos.appendChild(tr);
            });
            
            // Adiciona eventos aos botões de remover
            document.querySelectorAll('.btn-remover-codigo').forEach(btn => {
                btn.addEventListener('click', async function() {
                    const codeId = this.getAttribute('data-id');
                    const confirmacao = confirm('Tem certeza que deseja remover este código?');
                    
                    if (confirmacao) {
                        try {
                            await database.ref('porteiroCodes/' + codeId).remove();
                            M.toast({html: 'Código removido', classes: 'green'});
                            carregarCodigosPorteiro();
                        } catch (error) {
                            M.toast({html: `Erro: ${error.message}`, classes: 'red'});
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Erro ao carregar códigos:', error);
        }
    }
    
    function formatarData(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString('pt-BR');
    }
    
    // Limpar histórico
    document.getElementById('btnLimparHistorico')?.addEventListener('click', async function() {
        const confirmacao = confirm('Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.');
        
        if (confirmacao) {
            try {
                await database.ref('historico').remove();
                M.toast({html: 'Histórico limpo', classes: 'green'});
                carregarHistorico();
            } catch (error) {
                M.toast({html: `Erro: ${error.message}`, classes: 'red'});
            }
        }
    });
});