
        // Configuração do Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyCwTNcpr_r75HH0igBtNyEbKvfuLkVFHiU",
            authDomain: "rifalidiane-fde3b.firebaseapp.com",
            databaseURL: "https://rifalidiane-fde3b-default-rtdb.firebaseio.com",
            projectId: "rifalidiane-fde3b",
            storageBucket: "rifalidiane-fde3b.firebasestorage.app",
            messagingSenderId: "649359518677",
            appId: "1:649359518677:web:879b4ed9fa5150d24d2b5c"
        };
        
        // Inicializa o Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();
        
        // Variáveis globais
        let allStores = [];
        let searchInput = document.getElementById('searchInput');
        let suggestionsContainer = document.getElementById('suggestionsContainer');
        let searchResults = document.getElementById('searchResults');
        let searchTermElement = document.getElementById('searchTerm');
        let noResults = document.getElementById('noResults');
        let currentSearchTerm = '';
        
        // Carrega todas as lojas
        function loadStores() {
            const storesList = document.getElementById('stores-list');
            storesList.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
            
            const storesRef = database.ref('stores');
            
            storesRef.on('value', (snapshot) => {
                const storesData = snapshot.val();
                allStores = [];
                
                if (storesData) {
                    // Converte o objeto de lojas em array
                    Object.entries(storesData).forEach(([userId, storeData]) => {
                        if (storeData.name) { // Verifica se é uma loja válida
                            allStores.push({
                                userId: userId,
                                ...storeData
                            });
                        }
                    });
                    
                    // Ordena as lojas alfabeticamente
                    allStores.sort((a, b) => a.name.localeCompare(b.name));
                    
                    displayStores(allStores);
                } else {
                    showEmptyState();
                }
            }, (error) => {
                console.error("Erro ao carregar lojas:", error);
                showErrorState();
            });
        }
        
        // Exibe as lojas na tela
        function displayStores(stores, searchTerm = '') {
            const storesList = document.getElementById('stores-list');
            
            if (stores.length === 0) {
                if (searchTerm) {
                    // Mostra mensagem de nenhum resultado para a pesquisa
                    storesList.style.display = 'none';
                    noResults.style.display = 'block';
                    searchResults.style.display = 'none';
                } else {
                    // Mostra estado vazio geral
                    showEmptyState();
                }
                return;
            }
            
            // Esconde mensagens de erro/empty
            noResults.style.display = 'none';
            storesList.style.display = 'grid';
            
            // Atualiza resultados da pesquisa se houver termo
            if (searchTerm) {
                searchTermElement.textContent = `"${searchTerm}"`;
                searchResults.style.display = 'block';
            } else {
                searchResults.style.display = 'none';
            }
            
            storesList.innerHTML = '';
            
            stores.forEach(store => {
                const storeCard = document.createElement('div');
                storeCard.className = 'store-card';
                
                storeCard.innerHTML = `
                    <div class="store-image-container">
                        <img src="${store.logo || 'https://via.placeholder.com/300x200?text=Sem+Imagem'}" 
                             alt="${store.name}" 
                             class="store-logo"
                             onerror="this.src='https://via.placeholder.com/300x200?text=Sem+Imagem'">
                    </div>
                    <div class="store-info">
                        <h3 class="store-name">${store.name}</h3>
                        <p class="store-description">${store.description || 'Loja virtual'}</p>
                        <a href="loja.html?userId=${store.userId}" class="visit-btn">
                            <i class="material-icons">storefront</i> Visitar Loja
                        </a>
                    </div>
                `;
                
                storesList.appendChild(storeCard);
            });
        }
        
        // Mostra sugestões durante a digitação
        function showSuggestions(searchTerm) {
            if (!searchTerm) {
                suggestionsContainer.style.display = 'none';
                return;
            }
            
            const term = searchTerm.toLowerCase();
            const suggestions = allStores.filter(store => 
                store.name.toLowerCase().includes(term) || 
                (store.description && store.description.toLowerCase().includes(term))
            ).slice(0, 5); // Limita a 5 sugestões
            
            if (suggestions.length === 0) {
                suggestionsContainer.style.display = 'none';
                return;
            }
            
            suggestionsContainer.innerHTML = '';
            
            suggestions.forEach(store => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.innerHTML = `
                    <i class="material-icons">store</i>
                    <span>${store.name}</span>
                `;
                
                suggestionItem.addEventListener('click', () => {
                    // Navega diretamente para a loja ao clicar na sugestão
                    window.location.href = `loja.html?userId=${store.userId}`;
                });
                
                suggestionsContainer.appendChild(suggestionItem);
            });
            
            suggestionsContainer.style.display = 'block';
        }
        
        // Filtra lojas conforme pesquisa
        function filterStores(searchTerm) {
            currentSearchTerm = searchTerm;
            
            if (!searchTerm) {
                displayStores(allStores);
                return;
            }
            
            const term = searchTerm.toLowerCase();
            const filtered = allStores.filter(store => 
                store.name.toLowerCase().includes(term) || 
                (store.description && store.description.toLowerCase().includes(term))
            );
            
            displayStores(filtered, searchTerm);
        }
        
        // Mostra estado vazio
        function showEmptyState() {
            const storesList = document.getElementById('stores-list');
            storesList.innerHTML = `
                <div class="empty-state">
                    <i class="material-icons">store_mall_directory</i>
                    <h3>Nenhuma loja cadastrada</h3>
                    <p>Não há lojas disponíveis no momento.</p>
                </div>
            `;
        }
        
        // Mostra estado de erro
        function showErrorState() {
            const storesList = document.getElementById('stores-list');
            storesList.innerHTML = `
                <div class="empty-state">
                    <i class="material-icons">error_outline</i>
                    <h3>Erro ao carregar lojas</h3>
                    <p>Ocorreu um erro ao carregar as lojas. Por favor, tente novamente mais tarde.</p>
                </div>
            `;
        }
        
        // Event listeners
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value;
            showSuggestions(term);
            filterStores(term);
        });
        
        // Fecha sugestões ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-input-container')) {             suggestionsContainer.style.display = 'none';
        }
    });

    // Filtra ao pressionar Enter
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            filterStores(e.target.value);
            suggestionsContainer.style.display = 'none';
        }
    });

    // Carrega as lojas quando a página é aberta
    window.addEventListener('DOMContentLoaded', loadStores);

    // Fecha sugestões ao rolar a página
    window.addEventListener('scroll', () => {
        suggestionsContainer.style.display = 'none';
    });
