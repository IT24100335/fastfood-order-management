(function () {
    const role = localStorage.getItem('manager_role');
    const path = window.location.pathname;

    // If on an admin page and not logged in
    if (!role && path !== '/login.html' && path !== '/' && path !== '/index.html') {
        window.location.href = '/login.html';
        return;
    }

    if (role && path !== '/login.html' && path !== '/' && path !== '/index.html') {
        if (role === 'ADMIN') {
            // Admin can access everything
            setupLogout();
            return;
        }

        let hasAccess = false;
        if (path.includes('menu.html') && role === 'MENU_MANAGER') hasAccess = true;
        if (path.includes('order.html') && role === 'ORDER_MANAGER') hasAccess = true;
        if (path.includes('inventory.html') && role === 'INVENTORY_MANAGER') hasAccess = true;
        if (path.includes('promotion.html') && role === 'PROMOTION_MANAGER') hasAccess = true;
        if (path.includes('feedback.html') && role === 'FEEDBACK_MANAGER') hasAccess = true;

        if (!hasAccess) {
            alert('Access Denied. Redirecting to your dashboard.');
            switch (role) {
                case 'MENU_MANAGER': window.location.href = '/menu.html'; break;
                case 'ORDER_MANAGER': window.location.href = '/order.html'; break;
                case 'INVENTORY_MANAGER': window.location.href = '/inventory.html'; break;
                case 'PROMOTION_MANAGER': window.location.href = '/promotion.html'; break;
                case 'FEEDBACK_MANAGER': window.location.href = '/feedback.html'; break;
                default: window.location.href = '/login.html';
            }
        } else {
            setupLogout();
        }
    }

    function setupLogout() {
        document.addEventListener('DOMContentLoaded', () => {
            // Add current manager username to profile header if exists
            const profileSpan = document.querySelector('.admin-profile span');
            const username = localStorage.getItem('manager_username');
            if (profileSpan && username) {
                profileSpan.innerHTML = `${username} <br><small style="font-size:0.7em; color:#ddd;">(${role.replace('_', ' ')})</small>`;
            }

            // Setup logout button
            const logoutBtn = document.querySelector('.btn-logout');
            if (logoutBtn) {
                logoutBtn.innerText = 'Log Out';
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('manager_role');
                    localStorage.removeItem('manager_username');
                    window.location.href = '/login.html';
                });
            }

            // For non-admin managers restrict sidebar links
            if (role !== 'ADMIN') {
                const navLinks = document.querySelectorAll('.nav-links a');
                navLinks.forEach(link => {
                    if (link.href && !link.href.includes(window.location.pathname)) {
                        const li = link.closest('li');
                        if (li) {
                            li.style.display = 'none'; // hide links they don't have access to
                        }
                    }
                });
            }
        });
    }
})();
