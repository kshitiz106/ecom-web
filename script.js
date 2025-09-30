const db = {
            users: [
                { id: 1, name: 'Demo User', email: 'demo@example.com', passwordHash: 'demo123' }
            ],
            products: [
                { id: 1, name: 'Wireless Headphones', category: 'electronics', price: 99.99, stock: 15, emoji: '🎧' },
                { id: 2, name: 'Smart Watch', category: 'electronics', price: 249.99, stock: 8, emoji: '⌚' },
                { id: 3, name: 'Laptop', category: 'electronics', price: 899.99, stock: 5, emoji: '💻' },
                { id: 4, name: 'Running Shoes', category: 'clothing', price: 79.99, stock: 20, emoji: '👟' },
                { id: 5, name: 'Winter Jacket', category: 'clothing', price: 149.99, stock: 12, emoji: '🧥' },
                { id: 6, name: 'T-Shirt', category: 'clothing', price: 24.99, stock: 50, emoji: '👕' },
                { id: 7, name: 'JavaScript Guide', category: 'books', price: 39.99, stock: 30, emoji: '📚' },
                { id: 8, name: 'Mystery Novel', category: 'books', price: 14.99, stock: 25, emoji: '📖' },
                { id: 9, name: 'Plant Pot', category: 'home', price: 19.99, stock: 40, emoji: '🪴' },
                { id: 10, name: 'Table Lamp', category: 'home', price: 44.99, stock: 15, emoji: '💡' },
                { id: 11, name: 'Coffee Maker', category: 'home', price: 89.99, stock: 10, emoji: '☕' },
                { id: 12, name: 'Bluetooth Speaker', category: 'electronics', price: 59.99, stock: 18, emoji: '🔊' }
            ],
            carts: {},
            orders: [],
            refreshTokens: {},
            nextUserId: 2,
            nextOrderId: 1
        };

        // JWT simulation (simplified for demo)
        const JWT_SECRET = 'demo-secret-key';
        let currentAccessToken = null;
        let currentRefreshToken = null;
        let currentUser = null;

        function generateToken(payload, expiresIn) {
            const token = btoa(JSON.stringify({ ...payload, exp: Date.now() + expiresIn }));
            return token;
        }

        function verifyToken(token) {
            try {
                const decoded = JSON.parse(atob(token));
                if (decoded.exp < Date.now()) {
                    return null;
                }
                return decoded;
            } catch {
                return null;
            }
        }

        function showAlert(message, type = 'info') {
            const alertContainer = document.getElementById('alertContainer');
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.textContent = message;
            alertContainer.innerHTML = '';
            alertContainer.appendChild(alert);
            
            setTimeout(() => {
                alert.remove();
            }, 4000);
        }

        function showLogin() {
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('signupForm').classList.add('hidden');
        }

        function showSignup() {
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('signupForm').classList.remove('hidden');
        }

        function signup() {
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;

            if (!name || !email || !password) {
                showAlert('Please fill in all fields', 'error');
                return;
            }

            if (db.users.find(u => u.email === email)) {
                showAlert('Email already registered', 'error');
                return;
            }

            const newUser = {
                id: db.nextUserId++,
                name,
                email,
                passwordHash: password // In production, this would be hashed
            };

            db.users.push(newUser);
            db.carts[newUser.id] = [];
            
            showAlert('Account created successfully! Please login.', 'success');
            showLogin();
            
            document.getElementById('signupName').value = '';
            document.getElementById('signupEmail').value = '';
            document.getElementById('signupPassword').value = '';
        }

        function login() {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const user = db.users.find(u => u.email === email && u.passwordHash === password);

            if (!user) {
                showAlert('Invalid credentials', 'error');
                return;
            }

            // Generate tokens
            currentAccessToken = generateToken({ userId: user.id, email: user.email }, 15 * 60 * 1000); // 15 min
            currentRefreshToken = generateToken({ userId: user.id }, 7 * 24 * 60 * 60 * 1000); // 7 days
            
            db.refreshTokens[user.id] = currentRefreshToken;
            currentUser = user;

            // Initialize cart if doesn't exist
            if (!db.carts[user.id]) {
                db.carts[user.id] = [];
            }

            updateUIForAuth();
            showCatalog();
            showAlert(`Welcome back, ${user.name}!`, 'success');

            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
        }

        function logout() {
            if (currentUser) {
                delete db.refreshTokens[currentUser.id];
            }
            
            currentAccessToken = null;
            currentRefreshToken = null;
            currentUser = null;

            updateUIForAuth();
            showAuthPage();
            showAlert('Logged out successfully', 'info');
        }

        function updateUIForAuth() {
            const authBtn = document.getElementById('authBtn');
            const userInfo = document.getElementById('userInfo');
            const catalogBtn = document.getElementById('catalogBtn');
            const cartBtn = document.getElementById('cartBtn');

            if (currentUser) {
                authBtn.textContent = 'Logout';
                authBtn.onclick = logout;
                userInfo.textContent = `Hi, ${currentUser.name}`;
                userInfo.classList.remove('hidden');
                catalogBtn.classList.remove('hidden');
                cartBtn.classList.remove('hidden');
                updateCartBadge();
            } else {
                authBtn.textContent = 'Login';
                authBtn.onclick = showAuthPage;
                userInfo.classList.add('hidden');
                catalogBtn.classList.add('hidden');
                cartBtn.classList.add('hidden');
            }
        }

        function showAuthPage() {
            hideAllPages();
            document.getElementById('authPage').classList.remove('hidden');
            showLogin();
        }

        function showCatalog() {
            if (!currentUser) {
                showAuthPage();
                return;
            }
            
            hideAllPages();
            document.getElementById('catalogPage').classList.remove('hidden');
            renderProducts();
        }

        function showCart() {
            if (!currentUser) {
                showAuthPage();
                return;
            }
            
            hideAllPages();
            document.getElementById('cartPage').classList.remove('hidden');
            renderCart();
        }

        function hideAllPages() {
            document.getElementById('authPage').classList.add('hidden');
            document.getElementById('catalogPage').classList.add('hidden');
            document.getElementById('cartPage').classList.add('hidden');
            document.getElementById('checkoutPage').classList.add('hidden');
        }

        function filterProducts() {
            renderProducts();
        }

        function renderProducts() {
            const category = document.getElementById('categoryFilter').value;
            const sort = document.getElementById('sortFilter').value;
            const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
            const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;

            let filtered = db.products.filter(p => {
                const matchCategory = !category || p.category === category;
                const matchPrice = p.price >= minPrice && p.price <= maxPrice;
                return matchCategory && matchPrice;
            });

            if (sort === 'price-asc') {
                filtered.sort((a, b) => a.price - b.price);
            } else if (sort === 'price-desc') {
                filtered.sort((a, b) => b.price - a.price);
            } else if (sort === 'name') {
                filtered.sort((a, b) => a.name.localeCompare(b.name));
            }

            const grid = document.getElementById('productsGrid');
            grid.innerHTML = filtered.map(product => `
                <div class="product-card">
                    <div class="product-image">${product.emoji}</div>
                    <div class="product-category">${product.category}</div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="product-stock">${product.stock} in stock</div>
                    <button onclick="addToCart(${product.id})" class="btn btn-primary" style="width: 100%;">
                        Add to Cart
                    </button>
                </div>
            `).join('');
        }

        function addToCart(productId) {
            if (!currentUser) {
                showAlert('Please login to add items to cart', 'error');
                return;
            }

            const product = db.products.find(p => p.id === productId);
            if (!product || product.stock <= 0) {
                showAlert('Product out of stock', 'error');
                return;
            }

            const cart = db.carts[currentUser.id];
            const existingItem = cart.find(item => item.productId === productId);

            if (existingItem) {
                if (existingItem.quantity >= product.stock) {
                    showAlert('Cannot add more than available stock', 'error');
                    return;
                }
                existingItem.quantity++;
            } else {
                cart.push({ productId, quantity: 1 });
            }

            updateCartBadge();
            showAlert(`${product.name} added to cart`, 'success');
        }

        function updateCartBadge() {
            if (!currentUser) return;
            
            const cart = db.carts[currentUser.id] || [];
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            const badge = document.getElementById('cartBadge');
            
            if (totalItems > 0) {
                badge.textContent = totalItems;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        function renderCart() {
            const cartItemsDiv = document.getElementById('cartItems');
            const cartSummaryDiv = document.getElementById('cartSummary');
            const cart = db.carts[currentUser.id] || [];

            if (cart.length === 0) {
                cartItemsDiv.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🛒</div>
                        <h3>Your cart is empty</h3>
                        <p>Add some products to get started!</p>
                        <button onclick="showCatalog()" class="btn btn-primary" style="margin-top: 20px;">Browse Products</button>
                    </div>
                `;
                cartSummaryDiv.classList.add('hidden');
                return;
            }

            let total = 0;
            cartItemsDiv.innerHTML = cart.map(item => {
                const product = db.products.find(p => p.id === item.productId);
                if (!product) return '';
                
                const itemTotal = product.price * item.quantity;
                total += itemTotal;

                return `
                    <div class="cart-item">
                        <div class="cart-item-image">${product.emoji}</div>
                        <div class="cart-item-details">
                            <div class="cart-item-name">${product.name}</div>
                            <div class="cart-item-price">$${product.price.toFixed(2)} each</div>
                        </div>
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateQuantity(${product.id}, -1)">-</button>
                            <span style="font-weight: 600; min-width: 30px; text-align: center;">${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateQuantity(${product.id}, 1)">+</button>
                        </div>
                        <div style="font-weight: bold; font-size: 18px; color: #764ba2;">
                            $${itemTotal.toFixed(2)}
                        </div>
                        <button class="btn btn-secondary" onclick="removeFromCart(${product.id})" style="padding: 10px;">🗑️</button>
                    </div>
                `;
            }).join('');

            cartSummaryDiv.innerHTML = `
                <div class="cart-total">
                    <span>Total:</span>
                    <span style="color: #764ba2;">$${total.toFixed(2)}</span>
                </div>
                <button onclick="showCheckout()" class="btn btn-primary" style="width: 100%; margin-top: 20px; padding: 15px; font-size: 16px;">
                    Proceed to Checkout
                </button>
            `;
            cartSummaryDiv.classList.remove('hidden');
        }

        function updateQuantity(productId, change) {
            const cart = db.carts[currentUser.id];
            const item = cart.find(i => i.productId === productId);
            const product = db.products.find(p => p.id === productId);

            if (!item || !product) return;

            const newQuantity = item.quantity + change;

            if (newQuantity <= 0) {
                removeFromCart(productId);
                return;
            }

            if (newQuantity > product.stock) {
                showAlert('Cannot exceed available stock', 'error');
                return;
            }

            item.quantity = newQuantity;
            updateCartBadge();
            renderCart();
        }

        function removeFromCart(productId) {
            const cart = db.carts[currentUser.id];
            const index = cart.findIndex(i => i.productId === productId);
            
            if (index !== -1) {
                cart.splice(index, 1);
                updateCartBadge();
                renderCart();
                showAlert('Item removed from cart', 'info');
            }
        }

        function showCheckout() {
            const cart = db.carts[currentUser.id] || [];
            
            if (cart.length === 0) {
                showAlert('Your cart is empty', 'error');
                return;
            }

            hideAllPages();
            document.getElementById('checkoutPage').classList.remove('hidden');

            let total = 0;
            cart.forEach(item => {
                const product = db.products.find(p => p.id === item.productId);
                if (product) {
                    total += product.price * item.quantity;
                }
            });

            document.getElementById('checkoutTotal').textContent = `Total: ${total.toFixed(2)}`;
        }

        function processPayment() {
            const cardNumber = document.getElementById('cardNumber').value;
            const cardName = document.getElementById('cardName').value;
            const cardExpiry = document.getElementById('cardExpiry').value;
            const cardCVV = document.getElementById('cardCVV').value;

            // Basic validation
            if (!cardNumber || !cardName || !cardExpiry || !cardCVV) {
                showAlert('Please fill in all payment details', 'error');
                return;
            }

            if (cardNumber.replace(/\s/g, '').length < 13) {
                showAlert('Invalid card number', 'error');
                return;
            }

            if (cardCVV.length < 3) {
                showAlert('Invalid CVV', 'error');
                return;
            }

            // Simulate payment processing
            const cart = db.carts[currentUser.id];
            let total = 0;
            const orderItems = [];

            cart.forEach(item => {
                const product = db.products.find(p => p.id === item.productId);
                if (product) {
                    total += product.price * item.quantity;
                    orderItems.push({
                        productId: product.id,
                        productName: product.name,
                        quantity: item.quantity,
                        price: product.price
                    });
                    
                    // Update stock
                    product.stock -= item.quantity;
                }
            });

            // Create order
            const order = {
                id: db.nextOrderId++,
                userId: currentUser.id,
                items: orderItems,
                total: total,
                date: new Date().toISOString(),
                status: 'completed'
            };

            db.orders.push(order);

            // Clear cart
            db.carts[currentUser.id] = [];
            updateCartBadge();

            // Clear form
            document.getElementById('cardNumber').value = '';
            document.getElementById('cardName').value = '';
            document.getElementById('cardExpiry').value = '';
            document.getElementById('cardCVV').value = '';

            showAlert(`Payment successful! Order #${order.id} confirmed. Total: ${total.toFixed(2)}`, 'success');
            
            setTimeout(() => {
                showCatalog();
            }, 3000);
        }

        // Event listeners for Enter key
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('loginEmail').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') login();
            });
            document.getElementById('loginPassword').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') login();
            });
            document.getElementById('signupPassword').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') signup();
            });

            // Format card number input
            document.getElementById('cardNumber').addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = formattedValue;
            });

            // Format expiry date
            document.getElementById('cardExpiry').addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.slice(0, 2) + '/' + value.slice(2, 4);
                }
                e.target.value = value;
            });

            // Numeric only for CVV
            document.getElementById('cardCVV').addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
            });

            // Initialize buttons
            document.getElementById('catalogBtn').onclick = showCatalog;
            document.getElementById('cartBtn').onclick = showCart;

            // Show auth page by default
            showAuthPage();
        });