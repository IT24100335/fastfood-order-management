// Order Management Logic with API
let orders = [];

async function init() {
    setInterval(() => {
        const datetimeEl = document.getElementById('datetime-display');
        if (datetimeEl) datetimeEl.innerText = new Date().toLocaleString();
    }, 1000);

    loadData();
    setInterval(loadData, 30000); // Polling for new orders every 30s
}

async function loadData() {
    try {
        const response = await fetch('/api/orders');
        orders = await response.json();
        renderOrders();
    } catch (err) {
        console.error("Failed to load orders:", err);
    }
}

function renderOrders() {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const sortedOrders = [...orders].reverse();

    sortedOrders.forEach(o => {
        const summary = o.items ? o.items.map(i => `${i.quantity}x ${i.menuItemName}`).join(', ') : 'No items';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${o.orderNumber || o.id}</strong></td>
            <td><span class="badge secondary">${o.customerName || 'Guest'}</span></td>
            <td style="max-width:200px; font-size:0.9rem;">${summary}</td>
            <td><strong style="color:var(--primary)">Rs ${(o.totalAmount || 0).toFixed(2)}</strong></td>
            <td style="font-size:0.85rem; max-width:150px;">${o.deliveryAddress || '-'}</td>
            <td style="font-size:0.8rem; color:#888;">${o.orderTime ? new Date(o.orderTime).toLocaleTimeString() : 'N/A'}</td>
            <td>
                <select class="status-select" onchange="updateOrderStatus(${o.id}, this.value)" 
                    style="border-color: ${getStatusColor(o.status)}">
                    <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Preparing" ${o.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
                    <option value="Ready" ${o.status === 'Ready' ? 'selected' : ''}>Ready</option>
                    <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </td>
            <td>
                <button class="action-btn" onclick="openEditOrderModal(${o.id})" title="Edit Status / Action">✏️ Manage</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateOrderStatus = async function (id, newStatus) {
    try {
        await fetch(`/api/orders/${id}/status?status=${newStatus}`, { method: 'PUT' });
        loadData();
    } catch (err) {
        console.error("Status update failed:", err);
    }
}

window.openEditOrderModal = async function(id) {
    try {
        const response = await fetch(`/api/orders/${id}`);
        const order = await response.json();

        document.getElementById('edit-order-id').value = order.id;
        document.getElementById('edit-total-amount').value = order.totalAmount;
        document.getElementById('edit-delivery-address').value = order.deliveryAddress || '';
        document.getElementById('edit-status').value = order.status;

        document.getElementById('edit-order-modal').classList.add('active');
    } catch (err) {
        console.error("Failed to load order for editing:", err);
    }
}

window.saveOrderDetails = async function() {
    const id = document.getElementById('edit-order-id').value;
    const status = document.getElementById('edit-status').value;

    try {
        // We only update status as per requirement "edits status only"
        const response = await fetch(`/api/orders/${id}/status?status=${status}`, {
            method: 'PUT'
        });

        if (response.ok) {
            closeModal('edit-order-modal');
            loadData();
        }
    } catch (err) {
        console.error("Failed to update order status:", err);
    }
}

window.deleteOrderFromModal = async function() {
    const id = document.getElementById('edit-order-id').value;
    if (!id) return;

    if (!confirm("Are you sure you want to delete this order? This action cannot be undone and is only allowed during editing.")) return;

    try {
        const response = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
        if (response.ok) {
            closeModal('edit-order-modal');
            loadData();
        } else {
            alert("Failed to delete order.");
        }
    } catch (err) {
        console.error("Failed to delete order:", err);
    }
}

window.closeModal = function(id) {
    document.getElementById(id).classList.remove('active');
}

function getStatusColor(status) {
    if (status === 'Pending') return 'var(--warning)';
    if (status === 'Preparing') return 'var(--info)';
    if (status === 'Ready') return 'var(--success)';
    if (status === 'Delivered') return '#444';
    return '#444';
}

document.addEventListener('DOMContentLoaded', init);
