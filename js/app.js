const firebaseConfig = {
  apiKey: "AIzaSyD8FxHqt1g2V-mmureRPQyYe6QCuRSieGI",
  authDomain: "marketplaceconnect-af26d.firebaseapp.com",
  databaseURL: "https://marketplaceconnect-af26d-default-rtdb.firebaseio.com",
  projectId: "marketplaceconnect-af26d",
  storageBucket: "marketplaceconnect-af26d.firebasestorage.app",
  messagingSenderId: "768552546759",
  appId: "1:768552546759:web:ff66de69eb65bf11c469e2",
  measurementId: "G-DJRGPFQ1VS"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Referências globais
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();
let messaging;

// Verifica se o Firebase Messaging é suportado
if (firebase.messaging.isSupported()) {
    messaging = firebase.messaging();
}

// Inicializa os componentes do Materialize
document.addEventListener('DOMContentLoaded', function() {
    const modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);
    
    const collapsibles = document.querySelectorAll('.collapsible');
    M.Collapsible.init(collapsibles);
    
    const selects = document.querySelectorAll('select');
    M.FormSelect.init(selects);
    
    const datepickers = document.querySelectorAll('.datepicker');
    M.Datepicker.init(datepickers, {
        format: 'dd/mm/yyyy',
        i18n: {
            months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
            monthsShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            weekdays: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
            weekdaysShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
            weekdaysAbbrev: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
            today: 'Hoje',
            clear: 'Limpar',
            cancel: 'Cancelar',
            done: 'Ok'
        }
    });
    
    const timepickers = document.querySelectorAll('.timepicker');
    M.Timepicker.init(timepickers, {
        twelveHour: false,
        i18n: {
            cancel: 'Cancelar',
            clear: 'Limpar',
            done: 'Ok'
        }
    });
});

// Verifica o estado de autenticação
auth.onAuthStateChanged(async user => {
    if (user) {
        try {
            const userSnapshot = await database.ref('users/' + user.uid).once('value');
            const userData = userSnapshot.val();
            
            if (!userData) {
                await auth.signOut();
                return redirectToLogin();
            }
            
            // Redireciona com base no tipo de usuário
            if (userData.tipo === 'morador' && !window.location.pathname.includes('usuario.html')) {
                window.location.href = 'usuario.html';
            } else if (userData.tipo === 'portaria' && !window.location.pathname.includes('portaria.html')) {
                window.location.href = 'portaria.html';
            } else if (userData.tipo === 'admin' && !window.location.pathname.includes('admin.html')) {
                window.location.href = 'admin.html';
            }
            
            // Atualiza UI do usuário
            updateUserUI(userData);
            
        } catch (error) {
            console.error("Erro na verificação de autenticação:", error);
            await auth.signOut();
            redirectToLogin();
        }
    } else {
        if (!isPublicPage()) {
            redirectToLogin();
        }
    }
});

function isPublicPage() {
    const publicPages = ['index.html', 'login.html', 'cadastro.html'];
    return publicPages.some(page => window.location.pathname.includes(page));
}

function redirectToLogin() {
    if (!window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

function updateUserUI(userData) {
    const userElements = document.querySelectorAll('.user-name, .user-profile');
    userElements.forEach(el => {
        if (el.classList.contains('user-name')) {
            el.textContent = userData.nome || 'Usuário';
        }
        if (el.classList.contains('user-profile') && userData.fotoUrl) {
            el.src = userData.fotoUrl;
            el.style.display = 'inline';
        }
    });
}

function showError(message) {
    M.toast({html: message, classes: 'red'});
}

function showSuccess(message) {
    M.toast({html: message, classes: 'green'});
}