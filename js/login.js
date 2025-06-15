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

        // Elementos do DOM
        const emailInput = document.getElementById('email');
        const senhaInput = document.getElementById('senha');
        const btnLogin = document.getElementById('btnLogin');
        const esqueciSenha = document.getElementById('esqueciSenha');
        const messageContainer = document.getElementById('messageContainer');

        // Inicializa os componentes
        document.addEventListener('DOMContentLoaded', function() {
            // Verifica se o usuário já está logado
            checkAuthState();
            
            // Configura eventos
            setupEventListeners();
        });

        // Verifica o estado de autenticação
        function checkAuthState() {
            auth.onAuthStateChanged(async (user) => {
                if (user) {
                    try {
                        const userSnapshot = await database.ref('users/' + user.uid).once('value');
                        const userData = userSnapshot.val();
                        
                        if (userData) {
                            console.log("Usuário já logado - Tipo:", userData.tipo);
                            redirectUser(userData.tipo);
                        }
                    } catch (error) {
                        console.error("Erro ao verificar tipo de usuário:", error);
                        showMessage("Erro ao verificar dados do usuário", "error");
                    }
                }
            });
        }

        // Redireciona o usuário conforme seu tipo
        function redirectUser(userType) {
            console.log("Redirecionando usuário do tipo:", userType);
            
            if (!userType) {
                console.error("Tipo de usuário não definido");
                showMessage("Tipo de usuário não identificado", "error");
                return;
            }
            
            if (userType.toLowerCase() === 'morador') {
                window.location.href = 'usuario.html';
            } else if (userType.toLowerCase() === 'portaria') {
                window.location.href = 'portaria.html';
            } else {
                console.error("Tipo de usuário desconhecido:", userType);
                showMessage("Tipo de usuário não suportado", "error");
            }
        }

        // Configura os eventos
        function setupEventListeners() {
            // Evento de login
            btnLogin.addEventListener('click', handleLogin);
            
            // Evento de recuperação de senha
            esqueciSenha.addEventListener('click', handlePasswordRecovery);
            
            // Validação ao pressionar Enter
            senhaInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleLogin(e);
                }
            });
        }

        // Validação de email
        function validateEmail() {
            const email = emailInput.value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!email) {
                return { valid: false, message: 'Por favor, informe seu email' };
            }
            
            if (!emailRegex.test(email)) {
                return { valid: false, message: 'Por favor, insira um email válido' };
            }
            
            return { valid: true };
        }

        // Validação de senha
        function validatePassword() {
            const senha = senhaInput.value;
            
            if (!senha) {
                return { valid: false, message: 'Por favor, informe sua senha' };
            }
            
            if (senha.length < 6) {
                return { valid: false, message: 'A senha deve ter pelo menos 6 caracteres' };
            }
            
            return { valid: true };
        }

        // Validação do formulário completo
        function validateForm() {
            const emailValidation = validateEmail();
            if (!emailValidation.valid) {
                return emailValidation;
            }
            
            const passwordValidation = validatePassword();
            if (!passwordValidation.valid) {
                return passwordValidation;
            }
            
            return { valid: true };
        }

        // Manipulador de login
        async function handleLogin(e) {
            e.preventDefault();
            
            // Limpa mensagens anteriores
            clearMessage();
            
            // Valida o formulário
            const validation = validateForm();
            if (!validation.valid) {
                showMessage(validation.message, "error");
                return;
            }
            
            const email = emailInput.value.trim();
            const senha = senhaInput.value;
            
            try {
                // Mostra loading no botão
                btnLogin.disabled = true;
                btnLogin.innerHTML = '<span class="material-icons btn__icon btn-loading">cached</span> Entrando...';
                
                // Faz login
                const userCredential = await auth.signInWithEmailAndPassword(email, senha);
                
                // Obtém os dados do usuário
                const userSnapshot = await database.ref('users/' + userCredential.user.uid).once('value');
                
                if (!userSnapshot.exists()) {
                    throw new Error("Dados do usuário não encontrados");
                }
                
                const userData = userSnapshot.val();
                
                if (!userData.tipo) {
                    throw new Error("Tipo de usuário não definido");
                }
                
                console.log("Login bem-sucedido - Dados do usuário:", userData);
                
                // Mostra mensagem de sucesso
                showMessage('Login realizado com sucesso!', "success");
                
                // Redireciona conforme o tipo de usuário
                setTimeout(() => {
                    redirectUser(userData.tipo);
                }, 1000);
                
            } catch (error) {
                console.error("Erro no login:", error);
                
                // Restaura o botão
                btnLogin.disabled = false;
                btnLogin.innerHTML = '<span class="material-icons btn__icon">login</span> Entrar';
                
                // Mostra mensagem de erro
                handleAuthError(error);
            }
        }

        // Manipulador de recuperação de senha
        async function handlePasswordRecovery(e) {
            e.preventDefault();
            clearMessage();
            
            const emailValidation = validateEmail();
            if (!emailValidation.valid) {
                showMessage(emailValidation.message, "error");
                return;
            }
            
            const email = emailInput.value.trim();
            
            try {
                await auth.sendPasswordResetEmail(email);
                showMessage('Email de recuperação enviado. Verifique sua caixa de entrada.', "success");
            } catch (error) {
                handleAuthError(error);
            }
        }

        // Manipulador de erros de autenticação
        function handleAuthError(error) {
            let errorMessage = 'Erro ao autenticar';
            
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
                default:
                    errorMessage = error.message || 'Erro desconhecido';
            }
            
            showMessage(errorMessage, "error");
        }

        // Mostra mensagem
        function showMessage(message, type) {
            messageContainer.textContent = message;
            messageContainer.className = `message-container message-container--${type}`;
            messageContainer.style.display = 'block';
            
            setTimeout(() => {
                messageContainer.style.display = 'none';
            }, 5000);
        }

        // Limpa a mensagem
        function clearMessage() {
            messageContainer.style.display = 'none';
        }