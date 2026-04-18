// Global State
let cart = [];
let appliedPromo = null;
let currentOrderId = null;
let selectedRating = 0;
let menus = []; // Store menus globally after fetch
let map, marker, restaurantMarker;

// DOM Elements
const menuGrid = document.getElementById('menu-grid');
const filterBtns = document.querySelectorAll('.filter-btn');
const cartBtn = document.getElementById('cart-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCart = document.getElementById('close-cart');
const overlay = document.getElementById('page-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const subtotalPriceEl = document.getElementById('subtotal-price');
const discountAmountEl = document.getElementById('discount-amount');
const totalPriceEl = document.getElementById('total-price');
const discountRow = document.querySelector('.discount-row');
const promoInput = document.getElementById('promo-code');
const applyPromoBtn = document.getElementById('apply-promo');
const promoMsg = document.getElementById('promo-msg');
const checkoutBtn = document.getElementById('checkout-btn');
const trackOrderBtn = document.getElementById('track-order-btn');
const trackerModal = document.getElementById('order-tracker-modal');

// Initialize
function init() {
    renderMenu('all');
    setupEventListeners();
    checkActiveOrder();
    updateUserNav();

    setInterval(() => {
        const activeFilter = document.querySelector('.filter-btn.active');
        renderMenu(activeFilter ? activeFilter.dataset.category : 'all');
        checkActiveOrder();
    }, 30000);
}

function updateUserNav() {
    const user = JSON.parse(localStorage.getItem('customer_user'));
    const navDiv = document.getElementById('user-display');
    const profileLink = document.getElementById('profile-link');

    if (navDiv && user) {
        if (profileLink) profileLink.style.display = 'inline';
        const loginLinks = navDiv.querySelectorAll('.login-link:not(#profile-link)');
        loginLinks.forEach(l => l.style.display = 'none');

        navDiv.innerHTML = `
            <span style="color:rgba(255,255,255,0.6); margin-left:10px;">Hi, ${user.username}!</span>
            <a href="/profile.html" class="login-link" id="profile-link">Profile</a>
            <button onclick="logoutCustomer()" class="secondary-btn" style="padding:5px 15px; font-size:0.8rem; margin-left:10px;">Logout</button>
        `;
    }
}

window.logoutCustomer = function() {
    localStorage.removeItem('customer_user');
    window.location.href = '/login.html';
}

// Render Menu
async function renderMenu(category) {
    try {
        const response = await fetch('/api/menu/recommended');
        menus = await response.json();
        menuGrid.innerHTML = '';

        const filtered = category === 'all' ? menus : menus.filter(m => m.category === category);

        if (filtered.length === 0) {
            menuGrid.innerHTML = '<p style="color:white; text-align:center; width:100%; grid-column: 1/-1;">No items available right now.</p>';
            return;
        }

        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'food-card';

            let stockTag = `<div class="stock-badge in-stock">In Stock (${item.stock} left)</div>`;
            if (item.stock <= 5 && item.stock > 0) stockTag = `<div class="stock-badge low-stock">Low Stock (${item.stock})</div>`;
            if (item.stock === 0) stockTag = `<div class="stock-badge sold-out">Sold Out</div>`;

            div.innerHTML = `
                <div class="food-img-container" style="position:relative;">
                    <img src="${item.imageUrl || 'https://via.placeholder.com/400x300'}" alt="${item.name}">
                    ${stockTag}
                </div>
                <div class="food-info">
                    <div class="food-meta">
                        <span class="rating">⭐ ${item.rating ? item.rating.toFixed(1) : 'N/A'}</span>
                    </div>
                    <h3 class="food-title">${item.name}</h3>
                    <p class="food-desc">${item.description}</p>
                    <div class="food-meta" style="margin-bottom:0; margin-top:15px;">
                        <span class="price">Rs ${item.price.toFixed(2)}</span>
                    </div>
                    <div class="card-actions">
                        <div class="card-qty">
                            <button onclick="adjustCardQty(${item.id}, -1)">-</button>
                            <span id="qty-val-${item.id}">1</span>
                            <button onclick="adjustCardQty(${item.id}, 1)">+</button>
                        </div>
                        <button class="primary-btn" style="flex:1" onclick="addToCartWithQty(${item.id})" ${item.stock === 0 ? 'disabled' : ''}>${item.stock === 0 ? 'Sold Out' : 'Add to Cart'}</button>
                    </div>
                </div>
            `;
            menuGrid.appendChild(div);
        });
    } catch (err) {
        console.error("Failed to load menu:", err);
        menuGrid.innerHTML = '<p style="color:white; text-align:center; width:100%; grid-column: 1/-1;">Failed to load menu. Please try again.</p>';
    }
}

window.adjustCardQty = function(id, delta) {
    const el = document.getElementById(`qty-val-${id}`);
    if (!el) return;
    let val = parseInt(el.innerText);
    val = Math.max(1, val + delta);
    el.innerText = val;
}

window.addToCartWithQty = function(id) {
    const el = document.getElementById(`qty-val-${id}`);
    if (!el) return;
    const qty = parseInt(el.innerText);
    addToCart(id, qty);
}

// Cart Logic
window.addToCart = async function(id, qty = 1) {
    const user = JSON.parse(localStorage.getItem('customer_user'));
    if (!user) {
        alert("Please log in first to add items to your cart!");
        window.location.href = '/login.html';
        return;
    }

    const item = menus.find(m => m.id === id);
    if (!item) return;

    const cartItem = cart.find(c => c.id === id);
    const currentQtyInCart = cartItem ? cartItem.qty : 0;

    if (currentQtyInCart + qty > item.stock) {
        alert(`Not enough stock! Only ${item.stock} left.`);
        return;
    }

    if (cartItem) {
        cartItem.qty += qty;
    } else {
        cart.push({ ...item, qty: qty });
    }
    updateCartUI();
    toggleCart(true);
}

// Checkout and Payment Gateway Simulation
function handleCheckout() {
    if (cart.length === 0) return;

    const subtotal = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    const discount = appliedPromo ? (subtotal * appliedPromo.discountPercentage) / 100 : 0;
    const total = subtotal - discount;

    const address = document.getElementById('cart-address').value.trim();
    if (!address) {
        alert("Please enter your delivery address in the cart before checking out.");
        toggleCart(true);
        return;
    }

    document.getElementById('pay-amount-display').innerText = `Rs ${total.toFixed(2)}`;
    document.getElementById('payment-modal').classList.add('active');
}

document.getElementById('process-payment-btn').addEventListener('click', async () => {
    const cardName = document.getElementById('pay-card-name').value.trim();
    const cardNumber = document.getElementById('pay-card-number').value.trim();
    const expiry = document.getElementById('pay-card-expiry').value.trim();
    const cvv = document.getElementById('pay-card-cvv').value.trim();
    const address = document.getElementById('cart-address').value.trim();

    if (!cardName || !cardNumber || !expiry || !cvv || !address) {
        alert("Please fill in all payment details and delivery address.");
        return;
    }

    // 16-digit card validation
    const cardDigits = cardNumber.replace(/\s+/g, '');
    if (!/^\d{16}$/.test(cardDigits)) {
        alert("Invalid card number. Must be exactly 16 digits.");
        return;
    }

    // Expiry validation (MM/YY)
    const expiryMatch = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!expiryMatch) {
        alert("Invalid expiry format. Use MM/YY.");
        return;
    }

    const expMonth = parseInt(expiryMatch[1]);
    const expYear = parseInt('20' + expiryMatch[2]);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        alert("Card has expired. Please use a valid card.");
        return;
    }

    // CVV validation
    if (!/^\d{3}$/.test(cvv)) {
        alert("Invalid CVV. Must be 3 digits.");
        return;
    }

    const btn = document.getElementById('process-payment-btn');
    btn.innerText = "Processing Transaction...";
    btn.disabled = true;

    try {
        const user = JSON.parse(localStorage.getItem('customer_user'));
        const subtotal = cart.reduce((s, i) => s + (i.price * i.qty), 0);
        const discount = appliedPromo ? (subtotal * appliedPromo.discountPercentage) / 100 : 0;
        const total = subtotal - discount;

        const orderData = {
            orderNumber: 'ORD-' + Math.floor(Math.random() * 10000),
            userId: user.id,
            customerName: user.username,
            subtotal,
            discountAmount: discount,
            totalAmount: total,
            deliveryAddress: address,
            items: cart.map(item => ({
                menuItemId: item.id,
                menuItemName: item.name,
                quantity: item.qty,
                priceAtOrderTime: item.price
            }))
        };

        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            const savedOrder = await response.json();
            localStorage.setItem('currentCustomerOrder', savedOrder.id);
            localStorage.setItem('currentCustomerAddress', address);

            cart = []; appliedPromo = null;
            updateCartUI(); toggleCart(false);
            checkActiveOrder();
            closeModal('payment-modal');
            trackerModal.classList.add('active');
            renderMenu(document.querySelector('.filter-btn.active').dataset.category);
        }
    } catch (err) {
        console.error("Order failed:", err);
        alert("Payment failed. Please try again.");
    } finally {
        btn.innerText = "Process Secure Payment";
        btn.disabled = false;
    }
});

// Review Feature Logic
window.setRating = function(n) {
    selectedRating = n;
    const stars = document.querySelectorAll('.star');
    stars.forEach((s, idx) => {
        s.innerHTML = idx < n ? '★' : '☆';
        s.classList.toggle('active', idx < n);
    });
}

document.getElementById('submit-review-btn').addEventListener('click', async () => {
    const comment = document.getElementById('review-comment').value;
    if (selectedRating === 0) { alert('Please select a star rating.'); return; }

    const user = JSON.parse(localStorage.getItem('customer_user'));
    const curOrderId = localStorage.getItem('currentCustomerOrder');

    try {
        const ordRes = await fetch(`/api/orders/${curOrderId}`);
        if (!ordRes.ok) throw new Error("Order not found");
        const order = await ordRes.json();

        if (order && order.items && order.items.length > 0) {
            for (const item of order.items) {
                await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        menuItemId: item.menuItemId,
                        userId: user.id,
                        rating: selectedRating,
                        comment: comment
                    })
                });
            }
            alert('Thank you for your feedback!');
            document.getElementById('review-section').style.display = 'none';
            localStorage.removeItem('currentCustomerOrder');
            checkActiveOrder();
            trackerModal.classList.remove('active');
            renderMenu(document.querySelector('.filter-btn.active').dataset.category);
        }
    } catch (err) {
        console.error("Feedback failed:", err);
    }
});

// Real-time status logic updates
function updateTrackerUI(status, address) {
    const steps = ['Pending', 'Preparing', 'Ready', 'Delivered'];
    let currentIndex = steps.indexOf(status);

    steps.forEach((step, index) => {
        const el = document.getElementById('step-' + step.toLowerCase());
        if (!el) return;
        el.classList.toggle('active', index <= currentIndex);
        let connector = el.nextElementSibling;
        if (connector && connector.classList.contains('step-connector')) {
            connector.style.background = index < currentIndex ? 'var(--primary-color)' : '#2a2a2a';
        }
    });

    const msgBox = document.querySelector('.tracker-msg');
    const reviewSec = document.getElementById('review-section');
    const addressBox = document.getElementById('tracker-address');
    const displayAddress = address || localStorage.getItem('currentCustomerAddress') || 'Your Address';

    if (addressBox) {
        addressBox.innerHTML = `<span style="color:var(--primary-color)">📍 Delivery Destination:</span><br>${displayAddress}`;
    }

    if (status === 'Delivered') {
        msgBox.innerText = "Enjoy your food! Your order has been delivered successfully.";
        reviewSec.style.display = 'block';
        updateMapTracking(status, displayAddress);
    } else {
        reviewSec.style.display = 'none';
        if (status === 'Pending') msgBox.innerText = "Your order is waiting for confirmation.";
        if (status === 'Preparing') msgBox.innerText = "Chef is cooking your delicious meal!";
        if (status === 'Ready') msgBox.innerText = "Your order is ready for delivery!";
        updateMapTracking(status, displayAddress);
    }
}

async function geocodeAddress(address) {
    if (!address || address === 'Your Address') return [6.9150, 79.8700]; // Fallback to Colombo
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const data = await response.json();
        if (data && data.length > 0) {
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
    } catch (err) {
        console.error("Geocoding failed:", err);
    }
    return [6.9150, 79.8700]; // Fallback
}

async function initMap(address) {
    if (map) return;
    const restaurantPos = [6.9271, 79.8612];
    const userPos = await geocodeAddress(address);

    map = L.map('delivery-map').setView(restaurantPos, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    restaurantMarker = L.marker(restaurantPos).addTo(map).bindPopup('<b>CraveBites Kitchen</b>').openPopup();

    // Draw route to exact geocoded location
    const route = L.polyline([restaurantPos, userPos], {
        color: 'var(--primary-color)',
        weight: 4,
        opacity: 0.6,
        dashArray: '10, 10',
        lineJoin: 'round'
    }).addTo(map);

    // Fit map to show both points
    map.fitBounds(route.getBounds(), { padding: [50, 50] });

    marker = L.marker(restaurantPos, {
        icon: L.divIcon({
            className: 'rider-icon',
            html: '🛵',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        })
    }).addTo(map);
}

async function updateMapTracking(status, address) {
    const restaurantPos = [6.9271, 79.8612];
    const userPos = await geocodeAddress(address);

    if (!map) {
        await initMap(address);
    }

    setTimeout(() => {
        map.invalidateSize();
        // If map was already initialized, we might need to update the route if address changed
        // But usually it's one order at a time.
    }, 100);

    const midPos = [
        (restaurantPos[0] + userPos[0]) / 2,
        (restaurantPos[1] + userPos[1]) / 2
    ];

    if (status === 'Pending' || status === 'Preparing') {
        marker.setLatLng(restaurantPos);
        marker.bindPopup(`<b>Chef is Preparing...</b><br>Will deliver to: ${address}`).openOn(map);
    } else if (status === 'Ready') {
        marker.setLatLng(midPos);
        marker.bindPopup(`<b>Rider is en route!</b><br>Heading to: ${address}`).openOn(map);
        map.panTo(midPos);
    } else if (status === 'Delivered') {
        marker.setLatLng(userPos);
        marker.bindPopup(`<b>Food Delivered!</b><br>At: ${address}`).openOn(map);
        map.panTo(userPos);
    }
}

// Utility and boilerplate
function setupEventListeners() {
    filterBtns.forEach(btn => btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderMenu(e.target.dataset.category);
    }));
    cartBtn.addEventListener('click', () => toggleCart(true));
    document.getElementById('close-cart').addEventListener('click', () => toggleCart(false));
    document.getElementById('close-tracker').addEventListener('click', () => trackerModal.classList.remove('active'));
    overlay.addEventListener('click', () => { toggleCart(false); trackerModal.classList.remove('active'); closeModal('payment-modal'); });
    applyPromoBtn.addEventListener('click', handlePromo);
    checkoutBtn.addEventListener('click', handleCheckout);
    trackOrderBtn.addEventListener('click', () => trackerModal.classList.add('active'));
}

window.closeModal = function(id) { document.getElementById(id).classList.remove('active'); }
function toggleCart(show) { cartSidebar.classList.toggle('open', show); overlay.classList.toggle('active', show); }

async function checkActiveOrder() {
    const id = localStorage.getItem('currentCustomerOrder');
    if (!id) { trackOrderBtn.style.display = 'none'; return; }

    try {
        const response = await fetch(`/api/orders/${id}`);
        if (!response.ok) {
            localStorage.removeItem('currentCustomerOrder');
            trackOrderBtn.style.display = 'none';
            return;
        }
        const order = await response.json();
        trackOrderBtn.style.display = 'flex';
        trackOrderBtn.innerText = `Track (${order.status})`;
        updateTrackerUI(order.status, order.deliveryAddress);
    } catch (err) {
        console.error("Order check failed:", err);
    }
}

function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    let subtotal = 0, count = 0;
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is empty.</div>';
        checkoutBtn.disabled = true;
    } else {
        checkoutBtn.disabled = false;
        cart.forEach(item => {
            subtotal += item.price * item.qty; count += item.qty;
            const div = document.createElement('div'); div.className = 'cart-item';
            div.innerHTML = `<div style="flex:1;"><div style="font-weight:600">${item.name}</div><div style="color:var(--primary-color)">Rs ${(item.price * item.qty).toFixed(2)}</div></div>
                <div class="item-qty"><button onclick="updateQty(${item.id}, -1)">-</button><span>${item.qty}</span><button onclick="updateQty(${item.id}, 1)">+</button></div>`;
            cartItemsContainer.appendChild(div);
        });
    }
    cartCount.innerText = count; subtotalPriceEl.innerText = `Rs ${subtotal.toFixed(2)}`;
    let total = subtotal;
    if (appliedPromo && subtotal > 0) {
        const d = (subtotal * appliedPromo.discountPercentage) / 100; total = subtotal - d;
        discountRow.style.display = 'flex'; discountAmountEl.innerText = `-Rs ${d.toFixed(2)} (${appliedPromo.discountPercentage}%)`;
    } else discountRow.style.display = 'none';
    totalPriceEl.innerText = `Rs ${total.toFixed(2)}`;
}

window.updateQty = function(id, d) {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    const menu = menus.find(m => m.id === id);
    if (d > 0 && item.qty + 1 > menu.stock) { alert("Not enough stock!"); return; }
    item.qty += d;
    if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
    updateCartUI();
}

async function handlePromo() {
    const code = promoInput.value.trim();
    if (!code) return;

    try {
        const response = await fetch(`/api/promotions/validate/${code}`);
        if (response.ok) {
            appliedPromo = await response.json();
            promoMsg.innerText = "Promo applied!";
            promoMsg.style.color = "#4caf50";
        } else {
            appliedPromo = null;
            promoMsg.innerText = "Invalid or expired promo.";
            promoMsg.style.color = "#FF5A36";
        }
        updateCartUI();
    } catch (err) {
        console.error("Promo validation failed:", err);
    }
}

document.addEventListener('DOMContentLoaded', init);
