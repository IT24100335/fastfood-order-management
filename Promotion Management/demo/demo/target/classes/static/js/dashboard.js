// User & Dashboard Management Logic with API
let orders = [];
let menus = [];
let users = [];

async function init() {
    updateClock();
    setInterval(updateClock, 1000);
    loadData();
    setInterval(loadData, 30000); // Polling for new orders every 30s
}

function updateClock() {
    const el = document.getElementById('datetime-display');
    if (el) el.innerText = new Date().toLocaleString();
}

async function loadData() {
    try {
        const orderRes = await fetch('/api/orders');
        orders = await orderRes.json();

        const menuRes = await fetch('/api/menu');
        menus = await menuRes.json();

        const userRes = await fetch('/api/users');
        users = await userRes.json();

        renderDashboard();
        renderUsers();
    } catch (err) {
        console.error("Dashboard load failed:", err);
    }
}

function renderDashboard() {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysOrders = orders.filter(o => o.orderTime && o.orderTime.startsWith(todayStr));

    const totalOrdersEl = document.getElementById('stat-total-orders');
    if (totalOrdersEl) totalOrdersEl.innerText = todaysOrders.length;

    const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Preparing').length;
    const pendingOrdersEl = document.getElementById('stat-pending-orders');
    if (pendingOrdersEl) pendingOrdersEl.innerText = pendingOrders;

    const revenue = todaysOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const revenueEl = document.getElementById('stat-revenue');
    if (revenueEl) revenueEl.innerText = 'Rs ' + revenue.toFixed(2);

    const lowStockCount = menus.filter(m => m.stock <= 5).length;
    const lowStockEl = document.getElementById('stat-low-stock');
    if (lowStockEl) lowStockEl.innerText = lowStockCount;

    const lowStockCard = document.querySelector('.stat-card.alert');
    if (lowStockCard) {
        if (lowStockCount > 0) {
            lowStockCard.style.borderColor = 'rgba(244,67,54,0.8)';
            lowStockCard.style.boxShadow = '0 0 15px rgba(244,67,54,0.3)';
        } else {
            lowStockCard.style.borderColor = 'var(--border)';
            lowStockCard.style.boxShadow = 'none';
        }
    }
}

function renderUsers() {
    const tbody = document.getElementById('user-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.id}</td>
            <td><strong>${user.username}</strong><br><small style="color:#888;">${user.email || 'No email'}</small></td>
            <td><span class="badge ${user.role === 'ADMIN' ? 'warning' : 'success'}">${user.role}</span></td>
            <td>
                <button class="action-btn" onclick="editUser(${user.id})">✏️ Edit</button>
                <button class="action-btn" onclick="deleteUser(${user.id})" style="color:#ff4742; margin-left:10px;">🗑️ Remove</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.openUserModal = function() {
    document.getElementById('user-form').reset();
    document.getElementById('user-id').value = '';
    document.getElementById('modal-title').innerText = "Add New System User";
    document.getElementById('user-password').required = true;
    document.getElementById('user-modal').classList.add('active');
}

window.editUser = function(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;

    document.getElementById('user-id').value = user.id;
    document.getElementById('user-username').value = user.username;
    document.getElementById('user-email').value = user.email || '';
    document.getElementById('user-password').value = '';
    document.getElementById('user-password').required = false;
    document.getElementById('user-role').value = user.role;

    document.getElementById('modal-title').innerText = "Edit System User";
    document.getElementById('user-modal').classList.add('active');
}

async function handleUserSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('user-id').value;
    const userData = {
        username: document.getElementById('user-username').value,
        email: document.getElementById('user-email').value,
        password: document.getElementById('user-password').value,
        role: document.getElementById('user-role').value
    };

    if (userData.password && userData.password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    const url = id ? `/api/users/${id}` : '/api/users/register';
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            closeModal('user-modal');
            loadData();
        } else {
            const errText = await response.text();
            alert("Failed to save user: " + errText);
        }
    } catch (err) {
        console.error("User save failed:", err);
    }
}

window.deleteUser = async function(id) {
    if (confirm("Are you sure you want to remove this user? This cannot be undone.")) {
        try {
            await fetch(`/api/users/${id}`, { method: 'DELETE' });
            loadData();
        } catch (err) {
            console.error("User deletion failed:", err);
        }
    }
}

window.closeModal = function(id) {
    document.getElementById(id).classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    const userForm = document.getElementById('user-form');
    if (userForm) userForm.addEventListener('submit', handleUserSubmit);
});
