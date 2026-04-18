// Inventory Management Logic with Pantry Tracking
let menus = [];
let pantryItems = [];

async function init() {
    setInterval(() => document.getElementById('datetime-display').innerText = new Date().toLocaleString(), 1000);
    loadData();

    document.getElementById('add-pantry-btn').addEventListener('click', () => {
        document.getElementById('pantry-form').reset();
        document.getElementById('pantry-id').value = '';
        document.getElementById('pantry-modal').classList.add('active');
    });

    document.getElementById('pantry-form').addEventListener('submit', handlePantrySubmit);
}

async function loadData() {
    try {
        const menuRes = await fetch('/api/menu');
        menus = await menuRes.json();
        renderInventory();

        const pantryRes = await fetch('/api/inventory/pantry');
        pantryItems = await pantryRes.json();
        renderPantry();
    } catch (err) {
        console.error("Failed to load inventory data:", err);
    }
}

function renderInventory() {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;
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
                onchange="updateStock(${menu.id}, this.value)">
            </td>
            <td>5</td>
            <td>${badge}</td>
            <td>
                <button class="action-btn" onclick="updateStockPrompt(${menu.id}, ${menu.stock})">🔄 Update</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPantry() {
    const tbody = document.getElementById('pantry-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    pantryItems.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td>${item.quantity}</td>
            <td>${item.unit}</td>
            <td>${item.threshold || 0}</td>
            <td>
                <button class="action-btn" onclick="editPantry(${item.id})">✏️</button>
                <button class="action-btn" onclick="deletePantry(${item.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateStockPrompt = function(id, cur) {
    const newVal = prompt("Set new stock amount:", cur);
    if (newVal !== null) updateStock(id, newVal);
}
window.updateStock = async function (id, newStock) {
    if (newStock === null || isNaN(newStock)) return;
    if (newStock < 0) {
        alert("Stock cannot be negative.");
        return;
    }
    try {
        await fetch(`/api/inventory/${id}/stock?newStock=${newStock}`, { method: 'PUT' });
        loadData();
    } catch (err) {
        console.error("Update failed:", err);
    }
}

window.editPantry = function(id) {
    const item = pantryItems.find(i => i.id === id);
    if (!item) return;

    document.getElementById('pantry-id').value = item.id;
    document.getElementById('pantry-name').value = item.name;
    document.getElementById('pantry-qty').value = item.quantity;
    document.getElementById('pantry-unit').value = item.unit;
    document.getElementById('pantry-threshold').value = item.threshold || 0;

    document.getElementById('pantry-modal').classList.add('active');
}

async function handlePantrySubmit(e) {
    e.preventDefault();
    const id = document.getElementById('pantry-id').value;
    const item = {
        name: document.getElementById('pantry-name').value,
        quantity: parseInt(document.getElementById('pantry-qty').value),
        unit: document.getElementById('pantry-unit').value,
        threshold: parseInt(document.getElementById('pantry-threshold').value)
    };

    if (item.quantity < 0 || item.threshold < 0) {
        alert("Quantity and Threshold must be 0 or greater.");
        return;
    }

    try {
        const url = id ? `/api/inventory/pantry/${id}` : '/api/inventory/pantry';
        const method = id ? 'PUT' : 'POST';

        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        document.getElementById('pantry-modal').classList.remove('active');
        loadData();
    } catch (err) {
        console.error("Save pantry failed:", err);
    }
}

window.deletePantry = async function(id) {
    if (confirm("Delete this pantry item?")) {
        try {
            await fetch(`/api/inventory/pantry/${id}`, { method: 'DELETE' });
            loadData();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }
}

document.addEventListener('DOMContentLoaded', init);
