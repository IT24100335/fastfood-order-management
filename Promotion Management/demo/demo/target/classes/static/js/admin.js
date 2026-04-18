// Global State (Synced with customer via localStorage)
let menus = JSON.parse(localStorage.getItem('menus')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let promotions = JSON.parse(localStorage.getItem('promotions')) || [];

// Modals
const menuModal = document.getElementById('menu-modal');

// Init
function init() {
    updateClock();
    setInterval(updateClock, 1000);

    // Polling LocalStorage to keep real-time sync with customer side
    setInterval(() => {
        const newOrders = JSON.parse(localStorage.getItem('orders')) || [];
        if (JSON.stringify(newOrders) !== JSON.stringify(orders)) {
            orders = newOrders;
            renderOrders();
            renderDashboard();
        }
    }, 2000);

    setupNavigation();

    // Initial Renders
    renderDashboard();
    renderMenuTable();
    renderOrders();
    renderInventory();
    renderPromos();
    renderFeedback();
}

function updateClock() {
    document.getElementById('datetime-display').innerText = new Date().toLocaleString();
}

function setupNavigation() {
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.addEventListener('click', (e) => {
            // Tab active state
            document.querySelectorAll('.nav-links li').forEach(el => el.classList.remove('active'));
            const targetLi = e.target.closest('li');
            targetLi.classList.add('active');

            // View active state
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById(targetLi.dataset.target).classList.add('active');

            // Refresh data on tab switch
            menus = JSON.parse(localStorage.getItem('menus')) || [];
            if (targetLi.dataset.target === 'dashboard') renderDashboard();
            if (targetLi.dataset.target === 'menu-manager') renderMenuTable();
            if (targetLi.dataset.target === 'orders-manager') renderOrders();
            if (targetLi.dataset.target === 'inventory-manager') renderInventory();
            if (targetLi.dataset.target === 'promo-manager') renderPromos();
            if (targetLi.dataset.target === 'feedback-manager') renderFeedback();
        });
    });

    // Modals
    document.getElementById('add-menu-btn').addEventListener('click', () => {
        document.getElementById('menu-form').reset();
        document.getElementById('menu-id').value = '';
        menuModal.classList.add('active');
    });

    document.getElementById('menu-form').addEventListener('submit', handleMenuSubmit);
}

window.closeModal = function (id) {
    document.getElementById(id).classList.remove('active');
}

/* 1. Dashboard Overview (Special Feature) */
function renderDashboard() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysOrders = orders.filter(o => o.time.startsWith(todayStr));

    document.getElementById('stat-total-orders').innerText = todaysOrders.length;

    const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Preparing').length;
    document.getElementById('stat-pending-orders').innerText = pendingOrders;

    const revenue = todaysOrders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('stat-revenue').innerText = 'Rs ' + revenue.toFixed(2);

    // Low stock items threshold = 5
    const lowStockCount = menus.filter(m => m.stock <= 5).length;
    document.getElementById('stat-low-stock').innerText = lowStockCount;

    // Alert Style
    const lowStockCard = document.querySelector('.stat-card.alert');
    if (lowStockCount > 0) {
        lowStockCard.style.borderColor = 'rgba(244,67,54,0.8)';
        lowStockCard.style.boxShadow = '0 0 15px rgba(244,67,54,0.3)';
    } else {
        lowStockCard.style.borderColor = 'var(--border)';
        lowStockCard.style.boxShadow = 'none';
    }
}

/* 2. Menu Management (Auto-hide Special Feature) */
function renderMenuTable() {
    const tbody = document.getElementById('menu-table-body');
    tbody.innerHTML = '';

    menus.forEach(menu => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${menu.imageUrl}" alt="menu"></td>
            <td><strong>${menu.name}</strong><br><span style="font-size:0.8rem; color:#888;">${menu.desc}</span></td>
            <td style="text-transform:capitalize;">${menu.category}</td>
            <td style="color:var(--primary); font-weight:600;">Rs ${menu.price.toFixed(2)}</td>
            <td>
                <button class="toggle-btn ${menu.available ? 'toggle-on' : 'toggle-off'}" onclick="toggleAvailability(${menu.id})">
                    ${menu.available ? '🟢 Active' : '🔴 Hidden'}
                </button>
            </td>
            <td>
                <button class="action-btn" onclick="editMenu(${menu.id})">✏️</button>
                <button class="action-btn" onclick="deleteMenu(${menu.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.toggleAvailability = function (id) {
    const menu = menus.find(m => m.id === id);
    menu.available = !menu.available;
    saveData();
    renderMenuTable();
}

function handleMenuSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('menu-id').value;
    const price = parseFloat(document.getElementById('menu-price').value);
    if (price < 0) {
        alert("Price must be 0 or greater.");
        return;
    }
    const item = {
        name: document.getElementById('menu-name').value,
        price: price,
        category: document.getElementById('menu-category').value,
        imageUrl: document.getElementById('menu-image').value,
        desc: document.getElementById('menu-desc').value,
        available: document.getElementById('menu-available').checked
    };

    if (id) {
        // Edit
        const index = menus.findIndex(m => m.id == id);
        item.id = parseInt(id);
        item.stock = menus[index].stock;
        item.rating = menus[index].rating;
        menus[index] = item;
    } else {
        // Add
        item.id = Date.now();
        item.stock = 10; // Default new item stock
        item.rating = 0; // New item no rating
        menus.push(item);
    }

    saveData();
    closeModal('menu-modal');
    renderMenuTable();
    renderInventory();
    renderFeedback();
}

window.editMenu = function (id) {
    const menu = menus.find(m => m.id === id);
    document.getElementById('menu-id').value = menu.id;
    document.getElementById('menu-name').value = menu.name;
    document.getElementById('menu-price').value = menu.price;
    document.getElementById('menu-category').value = menu.category;
    document.getElementById('menu-image').value = menu.imageUrl;
    document.getElementById('menu-desc').value = menu.desc;
    document.getElementById('menu-available').checked = menu.available;
    menuModal.classList.add('active');
}

window.deleteMenu = function (id) {
    if (confirm("Are you sure you want to delete this menu item?")) {
        menus = menus.filter(m => m.id !== id);
        saveData();
        renderMenuTable();
        renderInventory();
    }
}

/* 3. Order Management (Real-time status updates) */
function renderOrders() {
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = '';

    // Sort newly created orders top
    const sortedOrders = [...orders].reverse();

    sortedOrders.forEach(o => {
        // Calculate items summary
        const summary = o.items.map(i => `${i.qty}x ${i.name}`).join(', ');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${o.id}</strong></td>
            <td style="max-width:250px; font-size:0.9rem;">${summary}</td>
            <td><strong style="color:var(--primary)">Rs ${o.total.toFixed(2)}</strong></td>
            <td style="font-size:0.8rem; color:#888;">${new Date(o.time).toLocaleTimeString()}</td>
            <td>
                <select class="status-select" onchange="updateOrderStatus('${o.id}', this.value)" 
                    style="border-color: ${getStatusColor(o.status)}">
                    <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Preparing" ${o.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                    <option value="Ready" ${o.status === 'Ready' ? 'selected' : ''}>Ready for Pickup/Delivery</option>
                    <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateOrderStatus = function (id, newStatus) {
    const order = orders.find(o => o.id === id);
    if (order) {
        order.status = newStatus;
        localStorage.setItem('orders', JSON.stringify(orders));
        renderDashboard(); // Update pending counts

        // Note: Real-time update happens because customer page polls this LS key.
    }
}

function getStatusColor(status) {
    if (status === 'Pending') return 'var(--warning)';
    if (status === 'Preparing') return 'var(--info)';
    if (status === 'Ready') return 'var(--success)';
    if (status === 'Delivered') return '#444';
    return '#444';
}

/* 4. Inventory Management (Auto deduction + Low stock) */
function renderInventory() {
    const tbody = document.getElementById('inventory-table-body');
    tbody.innerHTML = '';

    menus.forEach(menu => {
        let badge = '<span class="badge success">In Stock</span>';
        if (menu.stock <= 5 && menu.stock > 0) badge = '<span class="badge warning">Low Stock</span>';
        if (menu.stock === 0) badge = '<span class="badge danger">Out of Stock</span>';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${menu.id}</td>
            <td><strong>${menu.name}</strong></td>
            <td>
                <input type="number" value="${menu.stock}" style="width:60px; padding:5px; background:#121212; border:1px solid #333; color:white;"
                min="0" onchange="updateStock(${menu.id}, this.value)">
            </td>
            <td>5</td>
            <td>${badge}</td>
            <td>
                <button class="action-btn" onclick="updateStock(${menu.id}, parseFloat(prompt('Set new stock amount:', ${menu.stock})))">🔄 Update</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateStock = function (id, newStock) {
    if (newStock === null || isNaN(newStock)) return;
    if (newStock < 0) {
        alert("Stock cannot be negative.");
        return;
    }
    const menu = menus.find(m => m.id === id);
    if (menu) {
        menu.stock = parseInt(newStock);
        saveData();
        renderInventory();
        renderMenuTable();
        renderDashboard();
    }
}

/* 5. Promotion Management (Automatic Discount) */
function renderPromos() {
    const tbody = document.getElementById('promos-table-body');
    tbody.innerHTML = '';

    promotions.forEach((p, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family:monospace; font-weight:800; font-size:1.1rem;">${p.code}</td>
            <td><strong style="color:var(--success)">${p.discountPercentage}%</strong></td>
            <td>${p.active ? '<span class="badge success">Active</span>' : '<span class="badge danger">Inactive</span>'}</td>
            <td>
                <button class="toggle-btn ${p.active ? 'toggle-on' : 'toggle-off'}" onclick="togglePromo(${idx})">
                    ${p.active ? '🟢 Turn Off' : '🔴 Turn On'}
                </button>
            </td>
            <td><button class="action-btn" onclick="deletePromo(${idx})">🗑️</button></td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('add-promo-btn').addEventListener('click', () => {
    const code = prompt("Enter Promo Code (e.g. SUMMER50):");
    if (!code) return;
    const discount = parseFloat(prompt("Enter Discount Percentage (e.g. 20):"));
    if (isNaN(discount) || discount < 0 || discount > 100) {
        alert("Discount must be between 0 and 100.");
        return;
    }

    promotions.push({ code: code.toUpperCase(), discountPercentage: discount, active: true });
    localStorage.setItem('promotions', JSON.stringify(promotions));
    renderPromos();
});

window.togglePromo = function (idx) {
    promotions[idx].active = !promotions[idx].active;
    localStorage.setItem('promotions', JSON.stringify(promotions));
    renderPromos();
}

window.deletePromo = function (idx) {
    if (confirm('Delete promo?')) {
        promotions.splice(idx, 1);
        localStorage.setItem('promotions', JSON.stringify(promotions));
        renderPromos();
    }
}

/* 6. Feedback & Rating Management (Average display) */
function renderFeedback() {
    const tbody = document.getElementById('feedback-table-body');
    tbody.innerHTML = '';

    menus.forEach(menu => {
        // Generating some dummy feedback logic: if rating = 0, no reviews.
        // The rating is stored directly in menu.rating for simplicity.
        const stars = '⭐'.repeat(Math.round(menu.rating)) + '☆'.repeat(5 - Math.round(menu.rating));
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${menu.imageUrl}" style="width:40px;height:40px;border-radius:5px;">
                    <strong>${menu.name}</strong>
                </div>
            </td>
            <td style="font-size:1.2rem;">${menu.rating > 0 ? stars : 'No Ratings'} <span style="font-size:0.9rem; color:#888;">(${menu.rating.toFixed(1)})</span></td>
            <td>${menu.rating > 0 ? 'See Detail' : 'No reviews'}</td>
            <td><button class="action-btn" onclick="alert('Detailed review viewer coming soon!')">👁️ View Details</button></td>
        `;
        tbody.appendChild(tr);
    });
}

/* Utility */
function saveData() {
    localStorage.setItem('menus', JSON.stringify(menus));
}

document.addEventListener('DOMContentLoaded', init);
