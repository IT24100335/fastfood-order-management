// Feedback Management Logic with Delete Option
let feedbacks = [];
let menus = [];

async function init() {
    setInterval(() => document.getElementById('datetime-display').innerText = new Date().toLocaleString(), 1000);
    loadData();
}

async function loadData() {
    try {
        const menuRes = await fetch('/api/menu');
        menus = await menuRes.json();
        
        // Fetch feedbacks for each menu item to flatten them into a list
        const allFeedbacks = [];
        for (const menu of menus) {
            const fRes = await fetch(`/api/feedback/${menu.id}`);
            const list = await fRes.json();
            list.forEach(f => allFeedbacks.push({ ...f, itemName: menu.name }));
        }
        feedbacks = allFeedbacks;
        renderFeedback();
    } catch (err) {
        console.error("Failed to load feedback:", err);
    }
}

function renderFeedback() {
    const tbody = document.getElementById('feedback-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (feedbacks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; opacity:0.5;">No reviews found.</td></tr>';
        return;
    }

    feedbacks.forEach(f => {
        const stars = '⭐'.repeat(f.rating) + '☆'.repeat(5 - f.rating);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${f.itemName}</strong></td>
            <td style="font-size:1.1rem; color:#fbc02d;">${stars}</td>
            <td style="font-style:italic;">"${f.comment}"</td>
            <td>
                <button class="action-btn" onclick="deleteFeedback(${f.id})" style="color:#ff4742;">🗑️ Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.deleteFeedback = async function(id) {
    if (confirm("Are you sure you want to remove this rating?")) {
        try {
            await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
            loadData();
        } catch (err) {
            console.error("Delete failed:", err);
        }
    }
}

document.addEventListener('DOMContentLoaded', init);
