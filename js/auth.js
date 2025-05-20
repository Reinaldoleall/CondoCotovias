// Funções auxiliares
function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => errorElement.style.display = 'none', 5000);
    } else {
        console.error('Erro:', message);
    }
}

function showSuccess(message) {
    const successElement = document.getElementById('successMessage');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        setTimeout(() => successElement.style.display = 'none', 5000);
    } else {
        console.log('Sucesso:', message);
    }
}

// Verifica o estado de autenticação e redireciona se necessário
function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userSnapshot = await database.ref('users/' + user.uid).once('value');
                const userData = userSnapshot.val();
                
                // Evita loop de redirecionamento
                const currentPage = window.location.pathname.split('/').pop();
                
                if (userData.tipo === 'morador' && currentPage !== 'usuario.html') {
                    window.location.href = 'usuario.html';
                } else if (userData.tipo === 'portaria' && currentPage !== 'portaria.html') {
                    window.location.href = 'portaria.html';
                } else if (userData.tipo === 'admin' && currentPage !== 'admin.html') {
                    window.location.href = 'admin.html';
                }
            } catch (error) {
                console.error('Erro ao verificar tipo de usuário:', error);
            }
        } else {
            // Se não estiver autenticado e não estiver na página de login ou cadastro, redireciona
            const currentPage = window.location.pathname.split('/').pop();
            if (currentPage !== 'index.html' && currentPage !== 'login.html' && currentPage !== 'cadastro.html') {
                window.location.href = 'index.html';
            }
        }
    });
}

// Inicializa a verificação do estado de autenticação
checkAuthState();

// Login
document.getElementById('btnLogin')?.addEventListener('click', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    
    if (!email || !senha) {
        showError('Por favor, preencha todos os campos');
        return;
    }

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, senha);
        const userSnapshot = await database.ref('users/' + userCredential.user.uid).once('value');
        const userData = userSnapshot.val();
        
        if (userData.tipo === 'morador') {
            window.location.href = 'usuario.html';
        } else if (userData.tipo === 'portaria') {
            window.location.href = 'portaria.html';
        } else if (userData.tipo === 'admin') {
            window.location.href = 'admin.html';
        }
    } catch (error) {
        handleAuthError(error);
    }
});

// Cadastro
document.getElementById('btnCadastrar')?.addEventListener('click', async function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('emailCadastro').value.trim();
    const senha = document.getElementById('senhaCadastro').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const tipoUsuario = document.querySelector('input[name="tipoUsuario"]:checked')?.value;
    const bloco = document.getElementById('bloco')?.value.trim() || '';
    const apartamento = document.getElementById('apartamento')?.value.trim() || '';
    const codigoPorteiro = document.getElementById('codigoPorteiro')?.value.trim() || '';
    
    // Validações
    if (!nome || !email || !senha || !confirmarSenha || !tipoUsuario) {
        showError('Por favor, preencha todos os campos obrigatórios');
        return;
    }
    
    if (senha !== confirmarSenha) {
        showError('As senhas não coincidem');
        return;
    }
    
    if (senha.length < 6) {
        showError('A senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    if (tipoUsuario === 'morador' && (!bloco || !apartamento)) {
        showError('Por favor, informe bloco e apartamento');
        return;
    }
    
    if (tipoUsuario === 'portaria' && !codigoPorteiro) {
        showError('Por favor, informe o código de porteiro');
        return;
    }
    
    // Verificação do código do porteiro
    if (tipoUsuario === 'portaria' && codigoPorteiro !== "PORTARIA123") {
        showError('Código de porteiro inválido');
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
        
        const userData = {
            nome: nome,
            email: email,
            tipo: tipoUsuario,
            dataCadastro: firebase.database.ServerValue.TIMESTAMP
        };
        
        if (tipoUsuario === 'morador') {
            userData.bloco = bloco;
            userData.apartamento = apartamento;
            userData.blocoApto = `${bloco}-${apartamento}`; // Para facilitar buscas
        }
        
        await database.ref('users/' + userCredential.user.uid).set(userData);
        
        showSuccess('Cadastro realizado com sucesso! Redirecionando...');
        setTimeout(() => {
            // Faz login automaticamente após cadastro
            auth.signInWithEmailAndPassword(email, senha)
                .then(() => {
                    if (tipoUsuario === 'morador') {
                        window.location.href = 'usuario.html';
                    } else if (tipoUsuario === 'portaria') {
                        window.location.href = 'portaria.html';
                    } else if (tipoUsuario === 'admin') {
                        window.location.href = 'admin.html';
                    }
                })
                .catch(error => {
                    handleAuthError(error);
                    window.location.href = 'index.html';
                });
        }, 2000);
        
    } catch (error) {
        handleAuthError(error);
    }
});

// Recuperação de senha
document.getElementById('esqueciSenha')?.addEventListener('click', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        showError('Por favor, informe seu email para recuperar a senha');
        return;
    }
    
    try {
        await auth.sendPasswordResetEmail(email);
        showSuccess('Email de recuperação enviado. Verifique sua caixa de entrada.');
    } catch (error) {
        handleAuthError(error);
    }
});

// Logout
function setupLogoutButton(button) {
    if (button) {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
                showError('Erro ao sair. Tente novamente.');
            }
        });
    }
}

// Configura botões de logout em todas as páginas
setupLogoutButton(document.getElementById('btnSair'));
setupLogoutButton(document.getElementById('btnSairPortaria'));
setupLogoutButton(document.getElementById('btnSairHistorico'));
setupLogoutButton(document.getElementById('btnLogout'));

// Manipulação de erros de autenticação
function handleAuthError(error) {
    let errorMessage = 'Erro na autenticação';
    
    switch (error.code) {
        case 'auth/invalid-email':
            errorMessage = 'Email inválido';
            break;
        case 'auth/user-disabled':
            errorMessage = 'Conta desativada';
            break;
        case 'auth/user-not-found':
            errorMessage = 'Usuário não encontrado';
            break;
        case 'auth/wrong-password':
            errorMessage = 'Senha incorreta';
            break;
        case 'auth/too-many-requests':
            errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
            break;
        case 'auth/email-already-in-use':
            errorMessage = 'Email já está em uso';
            break;
        case 'auth/weak-password':
            errorMessage = 'Senha muito fraca (mínimo 6 caracteres)';
            break;
        case 'auth/operation-not-allowed':
            errorMessage = 'Operação não permitida';
            break;
        case 'auth/requires-recent-login':
            errorMessage = 'Por favor, faça login novamente';
            break;
        default:
            errorMessage = error.message || 'Erro desconhecido';
    }
    
    showError(errorMessage);
}

// Verifica se há mensagens de erro/sucesso na URL (para redirecionamentos)
function checkUrlMessages() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    
    if (error) showError(decodeURIComponent(error));
    if (success) showSuccess(decodeURIComponent(success));
}

// Inicializa a verificação de mensagens na URL
checkUrlMessages();