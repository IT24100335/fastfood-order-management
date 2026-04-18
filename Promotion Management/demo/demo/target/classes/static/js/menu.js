// Menu Management Logic with API
let menus = [];
let currentImageBase64 = null;

async function init() {
    setInterval(() => {
        const datetimeEl = document.getElementById('datetime-display');
        if (datetimeEl) datetimeEl.innerText = new Date().toLocaleString();
    }, 1000);

    loadData();

    const addBtn = document.getElementById('add-menu-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            document.getElementById('menu-form').reset();
            document.getElementById('menu-id').value = '';
            document.getElementById('image-preview').style.display = 'none';
            document.getElementById('image-preview').src = '';
            currentImageBase64 = null;
            document.getElementById('menu-modal').classList.add('active');
        });
    }

    const form = document.getElementById('menu-form');
    if (form) form.addEventListener('submit', handleMenuSubmit);

    const fileInput = document.getElementById('menu-image-file');
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    currentImageBase64 = e.target.result;
                    const preview = document.getElementById('image-preview');
                    preview.src = currentImageBase64;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const urlInput = document.getElementById('menu-image-url');
    if (urlInput) {
        urlInput.addEventListener('input', () => {
            if (urlInput.value.trim() !== '') {
                currentImageBase64 = null;
                document.getElementById('image-preview').style.display = 'none';
            }
        });
    }
}

async function loadData() {
    try {
        const response = await fetch('/api/menu');
        menus = await response.json();
        renderMenuTable();
    } catch (err) {
        console.error("Failed to load menu:", err);
    }
}

function renderMenuTable() {
    const tbody = document.getElementById('menu-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    menus.forEach(menu => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${menu.imageUrl || 'https://via.placeholder.com/50'}" alt="menu" style="width:50px;height:50px;object-fit:cover;border-radius:8px;"></td>
            <td><strong>${menu.name}</strong><br><span style="font-size:0.8rem; color:#888;">${menu.description}</span></td>
            <td><span class="badge category-badge">${menu.category}</span></td>
            <td style="color:var(--primary); font-weight:600;">Rs ${menu.price.toFixed(2)}</td>
            <td><strong style="color:${menu.stock <= 5 ? 'var(--warning-color)' : 'white'}">${menu.stock}</strong></td>
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

window.toggleAvailability = async function (id) {
    try {
        await fetch(`/api/menu/${id}/toggle-availability`, { method: 'PUT' });
        loadData();
    } catch (err) {
        console.error("Toggle failed:", err);
    }
}

async function handleMenuSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('menu-id').value;
    const fileInput = document.getElementById('menu-image-file');
    const imageUrlInput = document.getElementById('menu-image-url');

    const formData = new FormData();
    if (id) formData.append('id', id);
    const name = document.getElementById('menu-name').value;
    const price = parseFloat(document.getElementById('menu-price').value);
    const stock = parseInt(document.getElementById('menu-stock').value || 0);
    const category = document.getElementById('menu-category').value;
    const description = document.getElementById('menu-desc').value;
    const available = document.getElementById('menu-available').checked;

    if (price < 0 || stock < 0) {
        alert("Price and Stock must be 0 or greater.");
        return;
    }

    formData.append('name', name);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('stock', stock);
    formData.append('description', description);
    formData.append('available', available);

    if (fileInput.files[0]) {
        formData.append('imageFile', fileInput.files[0]);
    } else {
        formData.append('imageUrl', imageUrlInput.value);
    }

    try {
        const response = await fetch('/api/menu', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            document.getElementById('menu-modal').classList.remove('active');
            loadData();
        } else {
            console.error("Save failed with status:", response.status);
        }
    } catch (err) {
        console.error("Save failed:", err);
    }
}

window.editMenu = function (id) {
    const menu = menus.find(m => m.id === id);
    if (!menu) return;
    document.getElementById('menu-id').value = menu.id;
    document.getElementById('menu-name').value = menu.name;
    document.getElementById('menu-price').value = menu.price;
    document.getElementById('menu-category').value = menu.category;
    document.getElementById('menu-stock').value = menu.stock;
    document.getElementById('menu-desc').value = menu.description;
    document.getElementById('menu-available').checked = menu.available;

    document.getElementById('menu-image-file').value = '';
    document.getElementById('menu-image-url').value = (menu.imageUrl && menu.imageUrl.startsWith('data:image')) ? '' : (menu.imageUrl || '');

    currentImageBase64 = (menu.imageUrl && menu.imageUrl.startsWith('data:image')) ? menu.imageUrl : null;

    const preview = document.getElementById('image-preview');
    if (menu.imageUrl) {
        preview.src = menu.imageUrl;
        preview.style.display = 'block';
    } else {
        preview.style.display = 'none';
    }

    document.getElementById('menu-modal').classList.add('active');
}

window.deleteMenu = async function (id) {
    if (confirm("Are you sure you want to delete this menu item?")) {
        try {
            await fetch(`/api/menu/${id}`, { method: 'DELETE' });
            loadData();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }
}

window.closeModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', init);
