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
        const auth = firebase.auth();
        const database = firebase.database();

        document.addEventListener('DOMContentLoaded', function() {
            // Elementos do DOM
            const nomeInput = document.getElementById('nome');
            const emailInput = document.getElementById('emailCadastro');
            const senhaInput = document.getElementById('senhaCadastro');
            const confirmarSenhaInput = document.getElementById('confirmarSenha');
            const tipoPortaria = document.getElementById('tipoPortaria');
            const tipoMorador = document.getElementById('tipoMorador');
            const blocoInput = document.getElementById('bloco');
            const apartamentoInput = document.getElementById('apartamento');
            const codigoPorteiroInput = document.getElementById('codigoPorteiro');
            const btnCadastrar = document.getElementById('btnCadastrar');
            const dadosMorador = document.getElementById('dadosMorador');
            const dadosPorteiro = document.getElementById('dadosPorteiro');
            const statusMessage = document.getElementById('statusMessage');

            // Mostra os campos de morador por padrão
            dadosMorador.style.display = 'block';
            dadosPorteiro.style.display = 'none';

            // Validação em tempo real
            nomeInput.addEventListener('blur', validarNome);
            emailInput.addEventListener('blur', validarEmail);
            senhaInput.addEventListener('input', validarSenha);
            confirmarSenhaInput.addEventListener('blur', validarConfirmarSenha);
            blocoInput.addEventListener('blur', validarBloco);
            apartamentoInput.addEventListener('blur', validarApartamento);
            codigoPorteiroInput.addEventListener('blur', validarCodigoPorteiro);

            // Alternar entre morador e porteiro
            tipoPortaria.addEventListener('change', function() {
                if (this.checked) {
                    dadosMorador.style.display = 'none';
                    dadosPorteiro.style.display = 'block';
                    clearValidation(blocoInput);
                    clearValidation(apartamentoInput);
                }
            });

            tipoMorador.addEventListener('change', function() {
                if (this.checked) {
                    dadosMorador.style.display = 'block';
                    dadosPorteiro.style.display = 'none';
                    clearValidation(codigoPorteiroInput);
                }
            });

            // Submissão do formulário
            btnCadastrar.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Validar todos os campos
                const isNomeValid = validarNome();
                const isEmailValid = validarEmail();
                const isSenhaValid = validarSenha();
                const isConfirmarSenhaValid = validarConfirmarSenha();
                
                let isTipoUsuarioValid = true;
                if (!tipoMorador.checked && !tipoPortaria.checked) {
                    showError('tipo-usuario-error', 'Selecione um tipo de usuário');
                    isTipoUsuarioValid = false;
                } else {
                    clearError('tipo-usuario-error');
                }
                
                let isDadosEspecificosValid = true;
                if (tipoMorador.checked) {
                    const isBlocoValid = validarBloco();
                    const isApartamentoValid = validarApartamento();
                    isDadosEspecificosValid = isBlocoValid && isApartamentoValid;
                } else if (tipoPortaria.checked) {
                    const isCodigoValid = validarCodigoPorteiro();
                    isDadosEspecificosValid = isCodigoValid;
                }
                
                // Se todos os campos forem válidos, prosseguir com o cadastro
                if (isNomeValid && isEmailValid && isSenhaValid && isConfirmarSenhaValid && 
                    isTipoUsuarioValid && isDadosEspecificosValid) {
                    cadastrarUsuario();
                } else {
                    showStatusMessage('Por favor, corrija os erros no formulário', 'error');
                }
            });

            // Funções de validação
            function validarNome() {
                const nome = nomeInput.value.trim();
                if (!nome) {
                    setInvalid(nomeInput, 'Por favor, informe seu nome completo');
                    return false;
                } else if (nome.length < 3) {
                    setInvalid(nomeInput, 'O nome deve ter pelo menos 3 caracteres');
                    return false;
                } else {
                    setValid(nomeInput);
                    return true;
                }
            }
            
            function validarEmail() {
                const email = emailInput.value.trim();
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                
                if (!email) {
                    setInvalid(emailInput, 'Por favor, informe seu e-mail');
                    return false;
                } else if (!emailRegex.test(email)) {
                    setInvalid(emailInput, 'Por favor, insira um e-mail válido');
                    return false;
                } else {
                    setValid(emailInput);
                    return true;
                }
            }
            
            function validarSenha() {
                const senha = senhaInput.value;
                
                if (!senha) {
                    setInvalid(senhaInput, 'Por favor, crie uma senha');
                    return false;
                } else if (senha.length < 6) {
                    setInvalid(senhaInput, 'A senha deve ter pelo menos 6 caracteres');
                    return false;
                } else {
                    setValid(senhaInput);
                    return true;
                }
            }
            
            function validarConfirmarSenha() {
                const senha = senhaInput.value;
                const confirmarSenha = confirmarSenhaInput.value;
                
                if (!confirmarSenha) {
                    setInvalid(confirmarSenhaInput, 'Por favor, confirme sua senha');
                    return false;
                } else if (senha !== confirmarSenha) {
                    setInvalid(confirmarSenhaInput, 'As senhas não coincidem');
                    return false;
                } else {
                    setValid(confirmarSenhaInput);
                    return true;
                }
            }
            
            function validarBloco() {
                const bloco = blocoInput.value.trim();
                if (!bloco) {
                    setInvalid(blocoInput, 'Por favor, informe o bloco');
                    return false;
                } else if (!/^\d{2}$/.test(bloco)) {
                    setInvalid(blocoInput, 'O bloco deve ter exatamente 2 dígitos');
                    return false;
                } else {
                    setValid(blocoInput);
                    return true;
                }
            }
            
            function validarApartamento() {
                const apartamento = apartamentoInput.value.trim();
                if (!apartamento) {
                    setInvalid(apartamentoInput, 'Por favor, informe o apartamento');
                    return false;
                } else if (!/^\d{3}$/.test(apartamento)) {
                    setInvalid(apartamentoInput, 'O apartamento deve ter exatamente 3 dígitos');
                    return false;
                } else {
                    setValid(apartamentoInput);
                    return true;
                }
            }
            
            function validarCodigoPorteiro() {
                const codigo = codigoPorteiroInput.value.trim();
                if (!codigo) {
                    setInvalid(codigoPorteiroInput, 'Por favor, informe o código de acesso');
                    return false;
                } else if (codigo !== "PORTARIA123") {
                    setInvalid(codigoPorteiroInput, 'Código de acesso inválido');
                    return false;
                } else {
                    setValid(codigoPorteiroInput);
                    return true;
                }
            }
            
            // Funções auxiliares de validação
            function setInvalid(inputElement, message) {
                const fieldId = inputElement.id;
                const errorElement = document.getElementById(`${fieldId}-error`);
                
                if (errorElement) {
                    errorElement.textContent = message;
                    errorElement.style.display = 'block';
                    inputElement.parentElement.parentElement.querySelector('.success-message').style.display = 'none';
                }
                
                inputElement.parentElement.style.borderColor = 'var(--md-error)';
            }
            
            function setValid(inputElement) {
                const fieldId = inputElement.id;
                const errorElement = document.getElementById(`${fieldId}-error`);
                const successElement = inputElement.parentElement.parentElement.querySelector('.success-message');
                
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
                
                if (successElement) {
                    successElement.style.display = 'block';
                }
                
                inputElement.parentElement.style.borderColor = 'var(--md-success)';
            }
            
            function clearValidation(inputElement) {
                const fieldId = inputElement.id;
                const errorElement = document.getElementById(`${fieldId}-error`);
                const successElement = inputElement.parentElement.parentElement.querySelector('.success-message');
                
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
                
                if (successElement) {
                    successElement.style.display = 'none';
                }
                
                inputElement.parentElement.style.borderColor = 'rgba(0, 0, 0, 0.12)';
            }
            
            function showError(elementId, message) {
                const errorElement = document.getElementById(elementId);
                if (errorElement) {
                    errorElement.textContent = message;
                    errorElement.style.display = 'block';
                }
            }
            
            function clearError(elementId) {
                const errorElement = document.getElementById(elementId);
                if (errorElement) {
                    errorElement.style.display = 'none';
                }
            }
            
            function showStatusMessage(message, type) {
                statusMessage.textContent = message;
                statusMessage.className = `status-message status-message--${type}`;
                statusMessage.style.display = 'block';
                
                setTimeout(() => {
                    statusMessage.style.display = 'none';
                }, 5000);
            }
            
            // Função para cadastrar usuário no Firebase
            function cadastrarUsuario() {
                const nome = nomeInput.value.trim();
                const email = emailInput.value.trim();
                const senha = senhaInput.value;
                const tipoUsuario = tipoMorador.checked ? 'morador' : 'portaria';
                const bloco = tipoMorador.checked ? blocoInput.value.trim() : null;
                const apartamento = tipoMorador.checked ? apartamentoInput.value.trim() : null;
                
                btnCadastrar.disabled = true;
                btnCadastrar.innerHTML = '<span class="material-icons btn__icon btn-loading">hourglass_empty</span> Cadastrando...';
                
                // Criar usuário no Firebase Auth
                auth.createUserWithEmailAndPassword(email, senha)
                    .then((userCredential) => {
                        // Salvar informações adicionais no Realtime Database
                        const userData = {
                            nome: nome,
                            email: email,
                            tipo: tipoUsuario,
                            dataCadastro: firebase.database.ServerValue.TIMESTAMP
                        };
                        
                        if (tipoUsuario === 'morador') {
                            userData.bloco = bloco;
                            userData.apartamento = apartamento;
                            userData.blocoApto = `${bloco}-${apartamento}`;
                        }
                        
                        return database.ref('users/' + userCredential.user.uid).set(userData);
                    })
                    .then(() => {
                        showStatusMessage('Cadastro realizado com sucesso!', 'success');
                        
                        // Redirecionar após 2 segundos
                        setTimeout(() => {
                            if (tipoUsuario === 'morador') {
                                window.location.href = 'usuario.html';
                            } else {
                                window.location.href = 'portaria.html';
                            }
                        }, 2000);
                    })
                    .catch((error) => {
                        handleFirebaseError(error);
                        btnCadastrar.disabled = false;
                        btnCadastrar.innerHTML = '<span class="material-icons btn__icon">person_add</span> Cadastrar';
                    });
            }
            
            // Manipulador de erros do Firebase
            function handleFirebaseError(error) {
                let errorMessage = 'Erro ao cadastrar';
                
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = 'Este email já está em uso';
                        setInvalid(emailInput, errorMessage);
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Email inválido';
                        setInvalid(emailInput, errorMessage);
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Senha muito fraca (mínimo 6 caracteres)';
                        setInvalid(senhaInput, errorMessage);
                        break;
                    case 'auth/operation-not-allowed':
                        errorMessage = 'Operação não permitida';
                        break;
                    default:
                        errorMessage = error.message || 'Erro desconhecido';
                }
                
                showStatusMessage(errorMessage, 'error');
            }
        });