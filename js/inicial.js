 // Firebase Configuration
        const firebaseConfig = {
            apiKey: "AIzaSyCwTNcpr_r75HH0igBtNyEbKvfuLkVFHiU",
            authDomain: "rifalidiane-fde3b.firebaseapp.com",
            databaseURL: "https://rifalidiane-fde3b-default-rtdb.firebaseio.com",
            projectId: "rifalidiane-fde3b",
            storageBucket: "rifalidiane-fde3b.firebasestorage.app",
            messagingSenderId: "649359518677",
            appId: "1:649359518677:web:879b4ed9fa5150d24d2b5c"
        };
        
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();
        
        // DOM Elements
        const menuButton = document.getElementById('menuButton');
        const drawer = document.getElementById('drawer');
        const drawerOverlay = document.getElementById('drawerOverlay');
        const contentFrame = document.getElementById('contentFrame');
        const pageTitle = document.getElementById('pageTitle');
        const loading = document.getElementById('loading');
        
        // Modal Elements
        const adminModal = document.getElementById('adminModal');
        const adminPassword = document.getElementById('adminPassword');
        const submitAdmin = document.getElementById('submitAdmin');
        const cancelAdmin = document.getElementById('cancelAdmin');
        const adminError = document.getElementById('adminError');
        const adminMenuItem = document.getElementById('adminMenuItem');
        
        const storeLoginModal = document.getElementById('storeLoginModal');
        const storeUsername = document.getElementById('storeUsername');
        const storePassword = document.getElementById('storePassword');
        const rememberMe = document.getElementById('rememberMe');
        const storeLoginError = document.getElementById('storeLoginError');
        const submitStoreLogin = document.getElementById('submitStoreLogin');
        const cancelStoreLogin = document.getElementById('cancelStoreLogin');
        const createStoreBtn = document.getElementById('createStoreBtn');
        
        // Help Button
        const helpButton = document.getElementById('helpButton');
        const helpFab = document.getElementById('helpFab');
        
        // State
        let menuOpen = false;
        
        // Authorized Users
        const authorizedUsers = [
            { username: "reinaldoleal.la@gmail.com", password: "R3inald0", name: "Administrador" },
            { username: "loja1", password: "1234567890", name: "Proprietário da Loja 1" }
        ];
        
        // Session Management
        function saveSession(username, remember) {
            if (remember) {
                localStorage.setItem('storeLoggedIn', 'true');
                localStorage.setItem('storeUsername', username);
            } else {
                sessionStorage.setItem('storeLoggedIn', 'true');
                sessionStorage.setItem('storeUsername', username);
            }
        }
        
        function clearSession() {
            localStorage.removeItem('storeLoggedIn');
            localStorage.removeItem('storeUsername');
            sessionStorage.removeItem('storeLoggedIn');
            sessionStorage.removeItem('storeUsername');
        }
        
        function checkSavedSession() {
            // Check sessionStorage first (temporary session)
            let isLoggedIn = sessionStorage.getItem('storeLoggedIn') === 'true';
            let username = sessionStorage.getItem('storeUsername');
            
            // If not found, check localStorage (persistent session)
            if (!isLoggedIn) {
                isLoggedIn = localStorage.getItem('storeLoggedIn') === 'true';
                username = localStorage.getItem('storeUsername');
            }
            
            if (isLoggedIn && username) {
                return authorizedUsers.some(user => user.username === username);
            }
            return false;
        }
        
        function getCurrentUser() {
            if (checkSavedSession()) {
                return sessionStorage.getItem('storeUsername') || localStorage.getItem('storeUsername');
            }
            return null;
        }
        
        // Navigation Functions
        function toggleMenu() {
            menuOpen = !menuOpen;
            
            if (menuOpen) {
                drawer.classList.add('drawer--open');
                drawerOverlay.classList.add('drawer-overlay--visible');
            } else {
                drawer.classList.remove('drawer--open');
                drawerOverlay.classList.remove('drawer-overlay--visible');
            }
        }
        
        function loadPage(pageUrl, pageName) {
            loading.classList.add('loading--visible');
            document.title = pageName ? `${pageName} | Condomínio Cotovias` : 'Condomínio Cotovias';
            pageTitle.textContent = pageName || 'Aplicativo';
            
            // Update active item in drawer
            document.querySelectorAll('.drawer__item').forEach(item => {
                item.classList.remove('drawer__item--active');
                if (item.getAttribute('data-page') === pageUrl) {
                    item.classList.add('drawer__item--active');
                }
            });
            
            contentFrame.onload = function() {
                loading.classList.remove('loading--visible');
                
                // If it's the store creation page and logged in, setup logout button
                if (pageUrl.includes('criarlojas.html') && checkSavedSession()) {
                    setupLogoutButton();
                }
            };
            
            contentFrame.src = pageUrl;
        }
        
        function setupLogoutButton() {
            // Remove any existing logout button
            const existingBtn = document.getElementById('logoutBtn');
            if (existingBtn) existingBtn.remove();
            
            const logoutBtn = document.createElement('button');
            logoutBtn.id = 'logoutBtn';
            logoutBtn.className = 'button button--text';
            logoutBtn.style.position = 'fixed';
            logoutBtn.style.bottom = 'var(--spacing-md)';
            logoutBtn.style.left = 'var(--spacing-md)';
            logoutBtn.style.zIndex = '1000';
            logoutBtn.innerHTML = `
                <span class="material-icons button__icon">logout</span>
                Sair
            `;
            
            logoutBtn.addEventListener('click', () => {
                clearSession();
                if (contentFrame.src.includes('criarlojas.html')) {
                    loadPage('aviso.html', 'Avisos');
                }
            });
            
            document.body.appendChild(logoutBtn);
        }
        
        // Event Listeners
        menuButton.addEventListener('click', toggleMenu);
        drawerOverlay.addEventListener('click', toggleMenu);
        
        // Navigation items
        document.querySelectorAll('.drawer__item[data-page]').forEach(item => {
            if (item.id !== 'adminMenuItem' && item.id !== 'createStoreBtn') {
                item.addEventListener('click', () => {
                    const pageUrl = item.getAttribute('data-page');
                    const pageName = item.querySelector('.drawer__text').textContent;
                    
                    loadPage(pageUrl, pageName);
                    
                    if (menuOpen) {
                        toggleMenu();
                    }
                });
            }
        });
        
        // Admin menu item
        adminMenuItem.addEventListener('click', () => {
            adminModal.classList.add('modal--visible');
            adminPassword.focus();
            
            if (menuOpen) {
                toggleMenu();
            }
        });
        
        // Admin modal buttons
        submitAdmin.addEventListener('click', () => {
            const password = adminPassword.value;
            
            if (password === '') {
                adminModal.classList.remove('modal--visible');
                adminError.style.display = 'none';
                adminPassword.value = '';
                loadPage('admin.html', 'Administração');
            } else {
                adminError.style.display = 'flex';
                adminPassword.focus();
            }
        });
        
        cancelAdmin.addEventListener('click', () => {
            adminModal.classList.remove('modal--visible');
            adminError.style.display = 'none';
            adminPassword.value = '';
        });
        
        adminPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitAdmin.click();
            }
        });
        
        // Create store button
        createStoreBtn.addEventListener('click', () => {
            if (checkSavedSession()) {
                loadPage('criarlojas.html', 'Crie sua loja');
            } else {
                storeLoginModal.classList.add('modal--visible');
                storeUsername.focus();
            }
        });
        
        // Store login functions
        function checkStoreLogin(username, password) {
            return authorizedUsers.find(user => 
                user.username === username && user.password === password
            );
        }
        
        // Store login modal buttons
        submitStoreLogin.addEventListener('click', () => {
            const username = storeUsername.value.trim();
            const password = storePassword.value;
            const remember = rememberMe.checked;
            
            const user = checkStoreLogin(username, password);
            
            if (user) {
                saveSession(username, remember);
                
                storeLoginModal.classList.remove('modal--visible');
                storeLoginError.style.display = 'none';
                storeUsername.value = '';
                storePassword.value = '';
                
                loadPage('criarlojas.html', 'Crie sua loja');
            } else {
                storeLoginError.style.display = 'flex';
                storePassword.focus();
            }
        });
        
        cancelStoreLogin.addEventListener('click', () => {
            storeLoginModal.classList.remove('modal--visible');
            storeLoginError.style.display = 'none';
            storeUsername.value = '';
            storePassword.value = '';
        });
        
        storePassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitStoreLogin.click();
            }
        });
        
        // Help buttons
        helpButton.addEventListener('click', showHelp);
        helpFab.addEventListener('click', showHelp);
        
        function showHelp() {
            alert('Ajuda: Entre em contato com o administrador do condomínio para suporte técnico.');
        }
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === adminModal) {
                adminModal.classList.remove('modal--visible');
                adminError.style.display = 'none';
                adminPassword.value = '';
            }
            
            if (e.target === storeLoginModal) {
                storeLoginModal.classList.remove('modal--visible');
                storeLoginError.style.display = 'none';
                storeUsername.value = '';
                storePassword.value = '';
            }
        });
        
        // Close drawer on desktop when resizing
        window.addEventListener('resize', function() {
            if (window.innerWidth >= 1024 && menuOpen) {
                toggleMenu();
            }
        });
        
        // Initial load
        document.addEventListener('DOMContentLoaded', () => {
            // Check if we're in a store creation page without being logged in
            if (window.location.href.includes('criarlojas.html') && !checkSavedSession()) {
                window.location.href = 'aviso.html';
            }
            
            // Load stores list if we're on the stores page
            if (window.location.href.includes('lojas.html')) {
                loadStores();
            }
        });
        
        // Load stores function
        function loadStores() {
            const storesRef = database.ref('stores');
            
            storesRef.on('value', (snapshot) => {
                const stores = snapshot.val();
                const storesList = document.getElementById('stores-list');
                
                if (storesList) {
                    storesList.innerHTML = '';
                    
                    if (stores) {
                        Object.entries(stores).forEach(([userId, storeData]) => {
                            if (storeData.name) { // Check if it's a valid store
                                const storeCard = document.createElement('a');
                                storeCard.className = 'store-card';
                                storeCard.href = `lojas.html?userId=${userId}`;
                                
                                storeCard.innerHTML = `
                                    <img src="${storeData.logo || 'https://via.placeholder.com/300'}" alt="${storeData.name}" class="store-logo">
                                    <div class="store-info">
                                        <p class="store-name">${storeData.name}</p>
                                    </div>
                                `;
                                
                                storesList.appendChild(storeCard);
                            }
                        });
                    }
                }
            });
        }