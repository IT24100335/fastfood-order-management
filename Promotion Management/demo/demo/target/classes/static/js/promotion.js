// Promotion Management Logic
let promotions = [];

async function init() {
    setInterval(() => {
        const el = document.getElementById('datetime-display');
        if (el) el.innerText = new Date().toLocaleString();
    }, 1000);

    loadData();

    // Open modal for adding new promo
    const addBtn = document.getElementById('add-promo-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openPromoModal(null));
    }

    // Wire up form submit
    const form = document.getElementById('promo-form');
    if (form) form.addEventListener('submit', handlePromoSubmit);
}

async function loadData() {
    try {
        const res = await fetch('/api/promotions');
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        promotions = await res.json();
        renderPromos();
    } catch (err) {
        console.error("Load promos failed:", err);
        const tbody = document.getElementById('promos-table-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#ff4742; padding:30px;">
                ⚠️ Failed to load promotions. Please ensure the backend is running.
            </td></tr>`;
        }
    }
}

function getExpiryInfo(expiryDate) {
    if (!expiryDate) return { label: '<span style="opacity:0.4;">No expiry</span>', cssClass: '' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: `<span class="expiry-expired">Expired (${exp.toLocaleDateString()})</span>`, cssClass: 'expiry-expired' };
    if (diffDays <= 7) return { label: `<span class="expiry-soon">⚠️ Expires in ${diffDays}d (${exp.toLocaleDateString()})</span>`, cssClass: 'expiry-soon' };
    return { label: `<span class="expiry-ok">${exp.toLocaleDateString()}</span>`, cssClass: 'expiry-ok' };
}

function renderPromos() {
    const tbody = document.getElementById('promos-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (promotions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; opacity:0.5; padding:40px;">
            No promotions yet. Click <strong>+ Add Promo</strong> to create your first discount code.
        </td></tr>`;
        return;
    }

    promotions.forEach((p) => {
        // Backend serializes 'code' field as 'promoCode' via @JsonProperty
        const promoCode = p.promoCode || p.code || 'N/A';
        const expiryInfo = getExpiryInfo(p.expiryDate);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.name || '—'}</strong></td>
            <td><span class="promo-code-badge">${promoCode}</span></td>
            <td><strong style="color:#4caf50; font-size:1.15rem;">${p.discountPercentage}%</strong> off</td>
            <td>${expiryInfo.label}</td>
            <td>${p.active
            ? '<span class="badge success">🟢 Active</span>'
            : '<span class="badge danger">🔴 Inactive</span>'
        }</td>
            <td>
                <button class="action-btn" onclick="openPromoModal(${p.id})" title="Edit">✏️ Edit</button>
                <button class="toggle-btn ${p.active ? 'toggle-on' : 'toggle-off'}" onclick="togglePromo(${p.id})" style="margin-left:8px;">
                    ${p.active ? 'Deactivate' : 'Activate'}
                </button>
                <button class="action-btn" onclick="deletePromo(${p.id})" style="color:#ff4742; margin-left:8px;" title="Delete">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Open modal — pass null for new promo, pass ID for editing
window.openPromoModal = function(id) {
    const form = document.getElementById('promo-form');
    form.reset();
    document.getElementById('promo-error').style.display = 'none';
    document.getElementById('promo-save-btn').disabled = false;
    document.getElementById('promo-save-btn').innerText = 'Save Promotion';

    if (id === null) {
        // Add mode
        document.getElementById('promo-id').value = '';
        document.getElementById('promo-active').checked = true;
        document.getElementById('promo-modal-title').innerText = '➕ Add New Promotion';
    } else {
        // Edit mode
        const p = promotions.find(item => item.id == id);
        if (!p) return;

        document.getElementById('promo-id').value = p.id;
        document.getElementById('promo-name').value = p.name || '';
        document.getElementById('promo-code').value = p.promoCode || p.code || '';
        document.getElementById('promo-discount').value = p.discountPercentage;
        document.getElementById('promo-expiry').value = p.expiryDate || '';
        document.getElementById('promo-active').checked = !!p.active;
        document.getElementById('promo-modal-title').innerText = '✏️ Edit Promotion';
    }

    document.getElementById('promo-modal').classList.add('active');
}

window.closePromoModal = function() {
    document.getElementById('promo-modal').classList.remove('active');
}

async function handlePromoSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('promo-id').value;
    const saveBtn = document.getElementById('promo-save-btn');
    const errorEl = document.getElementById('promo-error');

    errorEl.style.display = 'none';
    saveBtn.disabled = true;
    saveBtn.innerText = 'Saving...';

    const codeInput = document.getElementById('promo-code').value.trim().toUpperCase();

    const discount = parseFloat(document.getElementById('promo-discount').value);
    if (isNaN(discount) || discount < 0 || discount > 100) {
        errorEl.innerText = "⚠️ Discount must be between 0 and 100.";
        errorEl.style.display = "block";
        saveBtn.disabled = false;
        saveBtn.innerText = 'Save Promotion';
        return;
    }

    const promoPayload = {
        name: document.getElementById('promo-name').value.trim(),
        promoCode: codeInput,          // Deserialized into 'code' via @JsonProperty
        discountPercentage: discount,
        expiryDate: document.getElementById('promo-expiry').value || null,
        active: document.getElementById('promo-active').checked
    };

    const url = id ? `/api/promotions/${id}` : '/api/promotions';
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(promoPayload)
        });

        if (res.ok) {
            closePromoModal();
            loadData();
        } else {
            const errText = await res.text();
            errorEl.innerText = '⚠️ ' + (errText || 'Failed to save. Please try again.');
            errorEl.style.display = 'block';
        }
    } catch (err) {
        console.error("Save promo failed:", err);
        errorEl.innerText = '⚠️ Connection error. Is the backend running?';
        errorEl.style.display = 'block';
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerText = 'Save Promotion';
    }
}

window.togglePromo = async function(id) {
    const p = promotions.find(item => item.id == id);
    if (!p) return;

    const updated = {
        name: p.name,
        promoCode: p.promoCode || p.code,
        discountPercentage: p.discountPercentage,
        expiryDate: p.expiryDate,
        active: !p.active
    };

    try {
        const res = await fetch(`/api/promotions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });
        if (res.ok) loadData();
    } catch (err) {
        console.error("Toggle promo failed:", err);
    }
}

window.deletePromo = async function(id) {
    const p = promotions.find(item => item.id == id);
    const codeName = p ? (p.promoCode || p.code || '') : '';
    if (confirm(`Delete promotion "${codeName}"? This cannot be undone.`)) {
        try {
            await fetch(`/api/promotions/${id}`, { method: 'DELETE' });
            loadData();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }
}

document.addEventListener('DOMContentLoaded', init);
