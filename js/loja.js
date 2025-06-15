 // Configuração do Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyCwTNcpr_r75HH0igBtNyEbKvfuLkVFHiU",
            authDomain: "rifalidiane-fde3b.firebaseapp.com",
            databaseURL: "https://rifalidiane-fde3b-default-rtdb.firebaseio.com",
            projectId: "rifalidiane-fde3b",
            storageBucket: "rifalidiane-fde3b.appspot.com",
            messagingSenderId: "649359518677",
            appId: "1:649359518677:web:879b4ed9fa5150d24d2b5c"
        };
        
        // Inicializa o Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();
        
        // Obtém o ID do usuário da URL
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        let cart = [];
        let storeData = null;
        let allProducts = [];
        let currentCategory = null;
        let currentProductInModal = null;
        let currentQuantity = 1;
        let currentUserRating = 0;
        let reviews = [];
        let reviewsRef = null;

        // Inicializa o sistema de avaliações
        function initReviewsSystem() {
            // Define a referência para as avaliações
            reviewsRef = database.ref('stores/' + userId + '/reviews');
            
            // Botão para abrir avaliações
            document.getElementById('open-reviews').addEventListener('click', openReviewsModal);
            
            // Fechar modal
            document.querySelector('.reviews-modal-close').addEventListener('click', closeReviewsModal);
            
            // Sistema de estrelas para avaliação
            setupStarRating();
            
            // Enviar avaliação
            document.getElementById('submit-review').addEventListener('click', submitReview);
            
            // Carrega as avaliações
            loadReviews();
            
            // Limpa alertas ao abrir o modal
            document.getElementById('open-reviews').addEventListener('click', () => {
                document.getElementById('alerts-container').innerHTML = '';
            });
        }

        // Abrir modal de avaliações
        function openReviewsModal() {
            document.getElementById('reviews-modal').classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        // Fechar modal de avaliações
        function closeReviewsModal() {
            document.getElementById('reviews-modal').classList.remove('show');
            document.body.style.overflow = '';
        }

        // Configura o sistema de estrelas para avaliação
        function setupStarRating() {
            const stars = document.querySelectorAll('.star-rating .star');
            
            stars.forEach(star => {
                star.addEventListener('click', function() {
                    const value = parseInt(this.getAttribute('data-value'));
                    currentUserRating = value;
                    
                    // Atualiza a exibição das estrelas
                    stars.forEach((s, index) => {
                        if (index < value) {
                            s.classList.add('active');
                            s.textContent = '★';
                        } else {
                            s.classList.remove('active');
                            s.textContent = '☆';
                        }
                    });
                });
                
                // Efeito hover
                star.addEventListener('mouseover', function() {
                    const value = parseInt(this.getAttribute('data-value'));
                    
                    stars.forEach((s, index) => {
                        if (index < value) {
                            s.textContent = '★';
                        } else {
                            s.textContent = '☆';
                        }
                    });
                });
                
                star.addEventListener('mouseout', function() {
                    stars.forEach((s, index) => {
                        if (index < currentUserRating) {
                            s.textContent = '★';
                        } else {
                            s.textContent = '☆';
                        }
                    });
                });
            });
        }

        // Carrega as avaliações do Firebase
        function loadReviews() {
            if (!reviewsRef) {
                console.error('Referência de avaliações não definida');
                return;
            }
            
            reviewsRef.on('value', (snapshot) => {
                const reviewsData = snapshot.val();
                reviews = reviewsData ? Object.values(reviewsData) : [];
                renderReviews();
                updateRatingSummary();
            }, (error) => {
                console.error('Erro ao carregar avaliações:', error);
                showAlert('Erro ao carregar avaliações. Por favor, recarregue a página.', 'error');
            });
        }

        // Renderiza a lista de avaliações
        function renderReviews() {
            const reviewsList = document.getElementById('reviews-list');
            reviewsList.innerHTML = '';
            
            if (reviews.length === 0) {
                reviewsList.innerHTML = '<p class="no-reviews">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>';
                return;
            }
            
            // Ordena por data (mais recente primeiro)
            const sortedReviews = [...reviews].sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
            
            sortedReviews.forEach(review => {
                const reviewItem = document.createElement('div');
                reviewItem.className = 'review-item';
                
                let responseHtml = '';
                if (review.response) {
                    responseHtml = `
                        <div class="review-response">
                            <span class="response-label">Resposta da loja:</span>
                            <p>${review.response}</p>
                        </div>
                    `;
                }
                
                // Formata a data
                const reviewDate = new Date(review.date);
                const formattedDate = reviewDate.toLocaleDateString('pt-BR');
                
                reviewItem.innerHTML = `
                    <div class="review-header">
                        <span class="review-author">${review.author || 'Anônimo'}</span>
                        <span class="review-date">${formattedDate}</span>
                    </div>
                    <div class="review-rating">
                        ${renderStars(review.rating)}
                    </div>
                    <p class="review-text">${review.text}</p>
                    ${responseHtml}
                `;
                
                reviewsList.appendChild(reviewItem);
            });
        }

        // Atualiza o resumo de avaliações
        function updateRatingSummary() {
            if (reviews.length === 0) {
                document.getElementById('average-rating').textContent = '0.0';
                document.getElementById('total-reviews').textContent = '(0 avaliações)';
                
                // Reseta as barras de porcentagem
                for (let i = 1; i <= 5; i++) {
                    document.getElementById(`bar-${i}`).style.width = '0%';
                    document.getElementById(`percent-${i}`).textContent = '0%';
                }
                
                return;
            }
            
            // Calcula a média de avaliações
            const totalRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRatings / reviews.length;
            
            document.getElementById('average-rating').textContent = averageRating.toFixed(1);
            document.getElementById('total-reviews').textContent = `(${reviews.length} avaliações)`;
            
            // Atualiza as estrelas da média
            const averageStars = document.getElementById('average-stars');
            averageStars.innerHTML = renderStars(averageRating);
            
            // Calcula a distribuição de estrelas
            const ratingDistribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
            
            reviews.forEach(review => {
                ratingDistribution[review.rating]++;
            });
            
            // Atualiza as barras de porcentagem
            for (let i = 1; i <= 5; i++) {
                const percentage = (ratingDistribution[i] / reviews.length) * 100;
                document.getElementById(`bar-${i}`).style.width = `${percentage}%`;
                document.getElementById(`percent-${i}`).textContent = `${Math.round(percentage)}%`;
            }
        }

        // Renderiza estrelas baseado na avaliação
        function renderStars(rating) {
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 >= 0.5;
            
            let starsHtml = '';
            
            // Estrelas cheias
            for (let i = 0; i < fullStars; i++) {
                starsHtml += '<span class="star">★</span>';
            }
            
            // Meia estrela
            if (hasHalfStar) {
                starsHtml += '<span class="star">½</span>';
            }
            
            // Estrelas vazias
            const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
            for (let i = 0; i < emptyStars; i++) {
                starsHtml += '<span class="star">☆</span>';
            }
            
            return starsHtml;
        }

        // Envia uma nova avaliação
        function submitReview() {
            const reviewText = document.getElementById('review-text').value.trim();
            const authorName = document.getElementById('review-author').value.trim();
            
            if (currentUserRating === 0) {
                showAlert('Por favor, selecione uma classificação com estrelas.', 'error');
                return;
            }
            
            if (reviewText === '') {
                showAlert('Por favor, escreva sua avaliação.', 'error');
                return;
            }
            
            if (reviewText.length > 500) {
                showAlert('A avaliação não pode ter mais de 500 caracteres.', 'error');
                return;
            }
            
            if (authorName.length > 50) {
                showAlert('O nome não pode ter mais de 50 caracteres.', 'error');
                return;
            }
            
            // Mostra o loading
            const submitButton = document.getElementById('submit-review');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="material-icons">hourglass_top</i> Enviando...';
            submitButton.disabled = true;
            
            // Cria o objeto de avaliação
            const newReview = {
                rating: currentUserRating,
                text: reviewText,
                date: new Date().toISOString(),
                author: authorName || 'Anônimo',
                responded: false
            };
            
            // Envia para o Firebase
            reviewsRef.push(newReview)
                .then(() => {
                    console.log('Avaliação enviada com sucesso:', newReview);
                    // Limpa o formulário
                    document.getElementById('review-text').value = '';
                    document.getElementById('review-author').value = '';
                    currentUserRating = 0;
                    
                    // Reseta as estrelas
                    document.querySelectorAll('.star-rating .star').forEach(star => {
                        star.classList.remove('active');
                        star.textContent = '☆';
                    });
                    
                    // Mostra mensagem de sucesso
                    showAlert('Avaliação enviada com sucesso! Obrigado por seu feedback.', 'success');
                })
                .catch(error => {
                    console.error('Erro ao enviar avaliação:', error);
                    showAlert('Ocorreu um erro ao enviar sua avaliação. Por favor, tente novamente.', 'error');
                })
                .finally(() => {
                    // Restaura o botão
                    submitButton.innerHTML = originalText;
                    submitButton.disabled = false;
                });
        }

        // Função para mostrar alertas personalizados
        function showAlert(message, type) {
            const alertDiv = document.createElement('div');
            alertDiv.className = `review-alert review-alert-${type}`;
            
            // Adiciona ícone e mensagem
            const icon = type === 'success' ? 'check_circle' : 'error';
            alertDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="material-icons">${icon}</i>
                    <span>${message}</span>
                </div>
                <i class="material-icons close-alert">close</i>
            `;
            
            // Adiciona evento para fechar
            alertDiv.querySelector('.close-alert').addEventListener('click', () => {
                alertDiv.remove();
            });
            
            // Adiciona ao container de alertas
            const alertsContainer = document.getElementById('alerts-container');
            alertsContainer.appendChild(alertDiv);
            
            // Remove após 5 segundos
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.classList.add('fade-out');
                    setTimeout(() => alertDiv.remove(), 300);
                }
            }, 5000);
        }

        // Carrega os dados da loja
    function loadStore() {
        if (!userId) {
            alert('Loja não encontrada!');
            window.location.href = 'index.html';
            return;
        }
        
        const storeRef = database.ref('stores/' + userId);
        
        storeRef.on('value', (snapshot) => {
            storeData = snapshot.val();
            
            if (storeData) {
                // Atualiza o cabeçalho da loja
                const logoUrl = storeData.logo || 'https://via.placeholder.com/150';
                document.getElementById('store-view-name').textContent = storeData.name;
                document.getElementById('store-view-title').textContent = storeData.name;
                document.getElementById('store-view-desc').textContent = storeData.description || '';
                
                // Sincroniza ambos os logos
                document.getElementById('store-view-logo').src = logoUrl;
                document.getElementById('store-view-logo-header').src = logoUrl;
                
                document.getElementById('store-view-header').style.setProperty('--store-primary-color', storeData.color || '#6200ee');
                
                // Verifica se existem produtos
                if (storeData.products) {
                    // Converte os produtos para array e armazena
                    allProducts = Object.entries(storeData.products).map(([id, product]) => ({ 
                        id, 
                        ...product,
                        category: product.category ? product.category.toString() : null
                    }));
                    
                    renderCategories(storeData.categories || {});
                    renderProducts(allProducts);
                    
                    // Configura a pesquisa
                    setupSearch();
                } else {
                    document.getElementById('store-products').innerHTML = '<p class="no-products-message">Nenhum produto disponível no momento.</p>';
                }
            } else {
                alert('Loja não encontrada!');
                window.location.href = 'index.html';
            }
        });
        
        // Configura o efeito do logo no header
        setupHeaderLogoEffect();
        
        // Configura os eventos do carrinho
        setupCartEvents();
        setupModalEvents();
        initReviewsSystem();
    }
        
        // Configura os eventos do carrinho
        function setupCartEvents() {
            // Botão do carrinho
            document.getElementById('cart-button').addEventListener('click', () => {
                document.getElementById('cart-panel').classList.toggle('show');
            });
            
            // Limpar carrinho
            document.getElementById('clear-cart').addEventListener('click', () => {
                cart = [];
                updateCart();
            });
            
            // Finalizar compra
            document.getElementById('checkout').addEventListener('click', showCartSummary);
            
            // Enviar por WhatsApp
            document.getElementById('send-whatsapp').addEventListener('click', sendCartToWhatsApp);
            
            // Fechar resumo
            document.getElementById('close-summary').addEventListener('click', () => {
                document.getElementById('overlay').classList.remove('show');
                document.getElementById('cart-summary').classList.remove('show');
            });
            
            // Fechar ao clicar no overlay
            document.getElementById('overlay').addEventListener('click', () => {
                document.getElementById('overlay').classList.remove('show');
                document.getElementById('cart-summary').classList.remove('show');
                document.getElementById('cart-panel').classList.remove('show');
            });
        }
        
        // Configura o efeito do logo no header
        function setupHeaderLogoEffect() {
            const storeHeader = document.querySelector('.store-header');
            const mainLogo = document.getElementById('store-view-logo');
            const headerLogo = document.getElementById('store-view-logo-header');
            const headerHeight = storeHeader.offsetHeight;
            
            let isLogoVisible = false;
            
            window.addEventListener('scroll', function() {
                const currentScroll = window.pageYOffset;
                
                if (currentScroll > headerHeight * 0.9) {
                    if (!isLogoVisible) {
                        headerLogo.classList.add('visible');
                        mainLogo.classList.add('hidden');
                        isLogoVisible = true;
                    }
                } else {
                    if (isLogoVisible) {
                        headerLogo.classList.remove('visible');
                        mainLogo.classList.remove('hidden');
                        isLogoVisible = false;
                    }
                }
            });
        }
        
        // Renderiza as categorias no menu de navegação
        function renderCategories(categories) {
            const navMenu = document.getElementById('nav-menu');
            navMenu.innerHTML = '';
            
            // Item "Todos" no menu
            const allItem = document.createElement('li');
            allItem.className = 'nav-item';
            
            const allLink = document.createElement('a');
            allLink.className = 'nav-link active';
            allLink.href = '#';
            allLink.innerHTML = '<i class="material-icons">storefront</i> Todos';
            allLink.addEventListener('click', (e) => {
                e.preventDefault();
                setActiveCategory(null);
            });
            
            allItem.appendChild(allLink);
            navMenu.appendChild(allItem);
            
            // Adiciona cada categoria como um item de menu com dropdown
            Object.entries(categories).forEach(([id, name]) => {
                const navItem = document.createElement('li');
                navItem.className = 'nav-item';
                
                const navLink = document.createElement('a');
                navLink.className = 'nav-link';
                navLink.href = '#';
                navLink.innerHTML = `<i class="material-icons">category</i> ${name}`;
                
                navLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    setActiveCategory(id);
                });
                
                navItem.appendChild(navLink);
                navMenu.appendChild(navItem);
            });
            
            // Define "Todos" como categoria ativa inicial
            setActiveCategory(null);
        }
        
        // Define a categoria ativa
        function setActiveCategory(categoryId) {
            currentCategory = categoryId;
            
            // Atualiza a classe ativa nos itens do menu
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.classList.remove('active');
            });
            
            // Encontra o link correspondente e marca como ativo
            const navLinksArray = Array.from(navLinks);
            if (categoryId === null) {
                navLinksArray[0].classList.add('active'); // Primeiro item é "Todos"
            } else {
                const categoryIndex = Object.keys(storeData.categories).indexOf(categoryId) + 1;
                if (categoryIndex > 0 && categoryIndex < navLinksArray.length) {
                    navLinksArray[categoryIndex].classList.add('active');
                }
            }
            
            // Filtra e renderiza os produtos
            filterProductsByCategory(categoryId);
        }
        
        // Filtra produtos por categoria
        function filterProductsByCategory(categoryId) {
            const filteredProducts = categoryId 
                ? allProducts.filter(p => p.category === categoryId.toString())
                : allProducts;
            
            renderProducts(filteredProducts);
        }
        
        // Renderiza os produtos
        function renderProducts(products) {
            const storeProducts = document.getElementById('store-products');
            storeProducts.innerHTML = '';
            
            if (products.length === 0) {
                storeProducts.innerHTML = '<p class="no-products-message">Nenhum produto encontrado nesta categoria.</p>';
                return;
            }
            
            products.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.setAttribute('data-id', product.id);
                
                // Adiciona evento de clique para abrir o modal
                productCard.addEventListener('click', () => {
                    showProductModal(product);
                });
                
                const productImage = document.createElement('div');
                productImage.className = 'product-image';
                productImage.style.backgroundImage = `url('${product.image || 'https://via.placeholder.com/300'}')`;
                
                const productOverlay = document.createElement('div');
                productOverlay.className = 'product-overlay';
                
                const productName = document.createElement('div');
                productName.className = 'product-name';
                productName.textContent = product.name;
                
                const productPrice = document.createElement('div');
                productPrice.className = 'product-price';
                productPrice.textContent = `R$ ${product.price?.toFixed(2) || '0,00'}`;
                
                const buyBtn = document.createElement('button');
                buyBtn.className = 'product-buy-btn ripple';
                buyBtn.innerHTML = '<i class="material-icons">shopping_cart</i> Comprar';
                buyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    addToCart(product);
                });
                
                productOverlay.appendChild(productName);
                productOverlay.appendChild(productPrice);
                productOverlay.appendChild(buyBtn);
                
                productImage.appendChild(productOverlay);
                productCard.appendChild(productImage);
                storeProducts.appendChild(productCard);
            });
        }

        // Função para mostrar o modal do produto
        function showProductModal(product) {
            currentProductInModal = product;
            currentQuantity = 1;
            
            // Preenche os dados do modal
            document.getElementById('product-modal-title').textContent = product.name;
            document.getElementById('product-modal-price').textContent = `R$ ${product.price?.toFixed(2) || '0,00'}`;
            document.getElementById('product-modal-description').textContent = product.description || 'Sem descrição disponível.';
            document.getElementById('product-modal-image').style.backgroundImage = `url('${product.image || 'https://via.placeholder.com/300'}')`;
            document.getElementById('product-quantity').textContent = currentQuantity;
            
            // Mostra o modal
            document.getElementById('product-modal').classList.add('show');
            document.body.style.overflow = 'hidden'; // Impede o scroll da página
        }

        // Função para fechar o modal
        function closeProductModal() {
            document.getElementById('product-modal').classList.remove('show');
            document.body.style.overflow = ''; // Restaura o scroll da página
            currentProductInModal = null;
        }

        // Configura os eventos do modal
        function setupModalEvents() {
            // Fechar modal
            document.getElementById('close-product-modal').addEventListener('click', closeProductModal);
            
            // Fechar modal ao clicar no overlay
            document.getElementById('product-modal').addEventListener('click', (e) => {
                if (e.target === document.getElementById('product-modal')) {
                    closeProductModal();
                }
            });
            
            // Aumentar quantidade
            document.getElementById('increase-quantity').addEventListener('click', () => {
                currentQuantity++;
                document.getElementById('product-quantity').textContent = currentQuantity;
            });
            
            // Diminuir quantidade (não pode ser menor que 1)
            document.getElementById('decrease-quantity').addEventListener('click', () => {
                if (currentQuantity > 1) {
                    currentQuantity--;
                    document.getElementById('product-quantity').textContent = currentQuantity;
                }
            });
            
            // Adicionar ao carrinho
            document.getElementById('add-to-cart-modal').addEventListener('click', () => {
                if (currentProductInModal) {
                    const productToAdd = {
                        ...currentProductInModal,
                        quantity: currentQuantity
                    };
                    addToCart(productToAdd);
                    closeProductModal();
                }
            });
        }
        
        // Configura a funcionalidade de pesquisa
        function setupSearch() {
            const searchInput = document.getElementById('product-search');
            const searchResults = document.getElementById('search-results');
            
            searchInput.addEventListener('input', function(e) {
                const searchTerm = e.target.value.trim().toLowerCase();
                
                if (searchTerm.length === 0) {
                    searchResults.classList.remove('show');
                    return;
                }
                
                // Filtra os produtos
                const filteredProducts = allProducts.filter(product => 
                    product.name.toLowerCase().includes(searchTerm) || 
                    (product.description && product.description.toLowerCase().includes(searchTerm))
                );
                
                // Exibe os resultados
                displaySearchResults(filteredProducts, searchTerm);
            });
            
            // Fecha os resultados quando clicar fora
            document.addEventListener('click', function(e) {
                if (!searchResults.contains(e.target) && e.target !== searchInput) {
                    searchResults.classList.remove('show');
                }
            });
        }
        
        // Exibe os resultados da pesquisa
        function displaySearchResults(products, searchTerm) {
            const searchResults = document.getElementById('search-results');
            searchResults.innerHTML = '';
            
            if (products.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'search-result-item';
                noResults.textContent = 'Nenhum produto encontrado';
                searchResults.appendChild(noResults);
            } else {
                products.forEach(product => {
                    const resultItem = document.createElement('div');
                    resultItem.className = 'search-result-item';
                    resultItem.addEventListener('click', () => {
                        scrollToProduct(product.id);
                    });
                    
                    const img = document.createElement('img');
                    img.src = product.image || 'https://via.placeholder.com/150';
                    img.alt = product.name;
                    
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'info';
                    
                    const nameDiv = document.createElement('div');
                    nameDiv.className = 'name';
                    nameDiv.innerHTML = highlightMatches(product.name, searchTerm);
                    
                    const priceDiv = document.createElement('div');
                    priceDiv.className = 'price';
                    priceDiv.textContent = `R$ ${product.price ? product.price.toFixed(2) : '0,00'}`;
                    
                    infoDiv.appendChild(nameDiv);
                    infoDiv.appendChild(priceDiv);
                    
                    resultItem.appendChild(img);
                    resultItem.appendChild(infoDiv);
                    
                    searchResults.appendChild(resultItem);
                });
            }
            
            searchResults.classList.add('show');
        }
        
        // Destaca os termos correspondentes na pesquisa
        function highlightMatches(text, searchTerm) {
            if (!searchTerm) return text;
            
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            return text.replace(regex, '<span class="highlight">$1</span>');
        }
        
        // Rola a página até o produto selecionado
        function scrollToProduct(productId) {
            document.getElementById('search-results').classList.remove('show');
            document.getElementById('product-search').value = '';
            
            // Filtra para mostrar todos os produtos
            if (currentCategory) {
                setActiveCategory(null);
            }
            
            setTimeout(() => {
                const productElement = document.querySelector(`.product-card[data-id="${productId}"]`);
                if (productElement) {
                    productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Adiciona um destaque temporário
                    productElement.style.boxShadow = '0 0 0 3px rgba(74, 107, 255, 0.5)';
                    productElement.style.transition = 'box-shadow 0.3s ease';
                    
                    setTimeout(() => {
                        productElement.style.boxShadow = 'var(--elevation-4)';
                        
                        setTimeout(() => {
                            productElement.style.boxShadow = '';
                        }, 1000);
                    }, 1000);
                }
            }, 100);
        }
        
        // Funções do carrinho
        function updateCart() {
            const cartCount = document.getElementById('cart-count');
            const cartItems = document.getElementById('cart-items');
            const cartTotal = document.getElementById('cart-total');
            
            cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
            
            cartItems.innerHTML = '';
            
            if (cart.length === 0) {
                cartItems.innerHTML = '<p>Carrinho vazio</p>';
                cartTotal.textContent = 'R$ 0,00';
                return;
            }
            
            let total = 0;
            
            cart.forEach((item, index) => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                
                const product = allProducts.find(p => p.id === item.id);
                const itemTotal = product.price * item.quantity;
                total += itemTotal;
                
                cartItem.innerHTML = `
                    <img src="${product.image || 'https://via.placeholder.com/150'}" class="cart-item-image" alt="${product.name}">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${product.name}</div>
                        <div class="cart-item-price">R$ ${product.price.toFixed(2)}</div>
                    </div>
                    <div class="cart-item-actions">
                        <button class="btn-text decrease-item" data-index="${index}">-</button>
                        <span class="cart-item-quantity">${item.quantity}</span>
                        <button class="btn-text increase-item" data-index="${index}">+</button>
                    </div>
                `;
                
                cartItems.appendChild(cartItem);
            });
            
            cartTotal.textContent = `R$ ${total.toFixed(2)}`;
            
            // Adiciona eventos aos botões de quantidade
            document.querySelectorAll('.increase-item').forEach(button => {
                button.addEventListener('click', (e) => {
                    const index = e.target.getAttribute('data-index');
                    cart[index].quantity++;
                    updateCart();
                });
            });
            
            document.querySelectorAll('.decrease-item').forEach(button => {
                button.addEventListener('click', (e) => {
                    const index = e.target.getAttribute('data-index');
                    if (cart[index].quantity > 1) {
                        cart[index].quantity--;
                    } else {
                        cart.splice(index, 1);
                    }
                    updateCart();
                });
            });
        }
        
        function addToCart(product) {
            const existingItem = cart.find(item => item.id === product.id);
            
            if (existingItem) {
                existingItem.quantity += product.quantity || 1;
            } else {
                cart.push({
                    id: product.id,
                    quantity: product.quantity || 1
                });
            }
            
            updateCart();
            
            // Mostra o carrinho brevemente
            const cartPanel = document.getElementById('cart-panel');
            cartPanel.classList.add('show');
            setTimeout(() => {
                if (!cartPanel.matches(':hover')) {
                    cartPanel.classList.remove('show');
                }
            }, 3000);
        }
        
        async function showCartSummary() {
            const overlay = document.getElementById('overlay');
            const cartSummary = document.getElementById('cart-summary');
            const summaryContent = document.getElementById('summary-content');
            
            // Mostrar loading
            summaryContent.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="material-icons" style="font-size: 48px; color: #6200ee;">hourglass_top</i><p>Carregando itens...</p></div>';
            
            overlay.classList.add('show');
            cartSummary.classList.add('show');
            
            // Esperar todas as imagens carregarem
            await preloadAllImages();
            
            // Agora renderizar o conteúdo real
            renderSummaryContent();
        }

        async function preloadAllImages() {
            const imagePromises = [];
            
            cart.forEach(item => {
                const product = allProducts.find(p => p.id === item.id);
                if (product && product.image) {
                    const img = new Image();
                    img.src = product.image;
                    const promise = new Promise((resolve) => {
                        img.onload = resolve;
                        img.onerror = resolve; // Continua mesmo se houver erro
                    });
                    imagePromises.push(promise);
                }
            });
            
            await Promise.all(imagePromises);
        }

        function renderSummaryContent() {
            const summaryContent = document.getElementById('summary-content');
            
            let html = `
                <div class="print-header">
                    ${storeData.logo ? `<img src="${storeData.logo}" class="print-logo" alt="${storeData.name}">` : ''}
                    <h2 class="print-store-name">${storeData.name}</h2>
                    <p class="print-date">${new Date().toLocaleString('pt-BR')}</p>
                </div>
                <h3 style="color: #6200ee; border-bottom: 2px solid #6200ee; padding-bottom: 8px;">
                    Resumo do Pedido
                </h3>
                <div class="print-items">
            `;
            
            cart.forEach(item => {
                const product = allProducts.find(p => p.id === item.id);
                const total = product.price * item.quantity;
                
                html += `
                    <div class="cart-item-print">
                        <img src="${product.image || 'https://via.placeholder.com/80?text=Produto'}" 
                             class="product-image-print" 
                             alt="${product.name}">
                        <div>
                            <h4 class="print-text" style="font-weight:bold; margin-bottom:8px;">${product.name}</h4>
                            <p class="print-text">Quantidade: ${item.quantity}</p>
                            <p class="print-text">Preço unitário: <span class="print-price">R$ ${product.price.toFixed(2)}</span></p>
                            <p class="print-text" style="margin-top:8px;">Subtotal: <span class="print-price">R$ ${total.toFixed(2)}</span></p>
                        </div>
                    </div>
                `;
            });
            
            html += `
                </div>
                <div class="print-total">
                    <span>Total do Pedido:</span>
                    <span>R$ ${calculateTotal().toFixed(2)}</span>
                </div>
            `;
            
            summaryContent.innerHTML = html;
        }

        async function sendCartToWhatsApp() {
            if (!storeData || !storeData.whatsapp) {
                alert('Esta loja não configurou um número de WhatsApp para contato.');
                return;
            }

            const sendButton = document.getElementById('send-whatsapp');
            const originalText = sendButton.innerHTML;
            
            try {
                // Mostrar loading
                sendButton.innerHTML = '<i class="material-icons">hourglass_top</i> Preparando envio...';
                sendButton.disabled = true;
                
                // Criar mensagem detalhada
                let message = `*Pedido - ${storeData.name}*\n\n`;
                let total = 0;
                
                cart.forEach(item => {
                    const product = allProducts.find(p => p.id === item.id);
                    const itemTotal = product.price * item.quantity;
                    total += itemTotal;
                    message += `➡ ${product.name}\n`;
                    message += `   Quantidade: ${item.quantity}\n`;
                    message += `   Valor: R$ ${itemTotal.toFixed(2)}\n\n`;
                });
                
                message += `*TOTAL: R$ ${total.toFixed(2)}*\n`;
                message += `Data: ${new Date().toLocaleString('pt-BR')}`;

                // Formatar número (remove tudo que não for dígito)
                const phoneNumber = storeData.whatsapp.replace(/\D/g, '');
                
                // Criar o link universal
                const whatsappUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
                
                // Abrir diretamente (isso vai funcionar na WebView com a configuração abaixo)
                window.open(whatsappUrl, '_blank');
                
                // Fechar o resumo e limpar carrinho
                cleanupAfterOrder();
                
            } catch (error) {
                console.error('Erro:', error);
                alert('Pedido pronto! Por favor, envie manualmente para: ' + storeData.whatsapp);
            } finally {
                sendButton.innerHTML = originalText;
                sendButton.disabled = false;
            }
        }

        // Funções auxiliares
        function calculateTotal() {
            return cart.reduce((total, item) => {
                const product = allProducts.find(p => p.id === item.id);
                return total + (product.price * item.quantity);
            }, 0);
        }

        function cleanupAfterOrder() {
            document.getElementById('overlay').classList.remove('show');
            document.getElementById('cart-summary').classList.remove('show');
            cart = [];
            updateCart();
            document.getElementById('cart-panel').classList.remove('show');
        }

        function checkAdminAccess() {
            // Verificar se é o dono da loja (pode implementar autenticação)
            const isOwner = localStorage.getItem('isOwner') === 'true';
            document.getElementById('admin-link').style.display = isOwner ? 'block' : 'none';
        }
        
        // Carrega a loja quando a página é aberta
        window.onload = function() {
            loadStore();
            checkAdminAccess();
        };