const API = 'http://localhost:5000/api';
let token = '';
let currentUser = null;

// DOM Elements
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const userNameText = document.getElementById('user-name');
const userRoleBadge = document.getElementById('user-role');
const totalIncome = document.getElementById('total-income');
const totalExpenses = document.getElementById('total-expenses');
const netBalance = document.getElementById('net-balance');
const recordsList = document.getElementById('records-list');
const categoriesList = document.getElementById('categories-list');
const addRecordBtn = document.getElementById('add-record-btn');
const recordModal = document.getElementById('record-modal');
const closeModal = document.getElementById('close-modal');
const recordForm = document.getElementById('record-form');

// Auth: Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            token = data.token;
            currentUser = data.user;
            showDashboard();
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (err) {
        console.error(err);
        alert('Server unreachable. Make sure backend is running.');
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    token = '';
    currentUser = null;
    dashboardSection.classList.add('hidden');
    authSection.classList.remove('hidden');
});

function showDashboard() {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    userNameText.textContent = currentUser.name;
    userRoleBadge.textContent = currentUser.role;

    // Check permissions
    if (currentUser.role === 'ADMIN') {
        addRecordBtn.classList.remove('hidden');
    } else {
        addRecordBtn.classList.add('hidden');
    }

    fetchSummary();
    if (currentUser.role !== 'VIEWER') {
        fetchRecords();
    } else {
        recordsList.innerHTML = '<p class="placeholder">Viewers can only see the dashboard summary.</p>';
    }
}

async function fetchSummary() {
    try {
        const res = await fetch(`${API}/records/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        totalIncome.textContent = `$${data.totalIncome.toLocaleString()}`;
        totalExpenses.textContent = `$${data.totalExpenses.toLocaleString()}`;
        netBalance.textContent = `$${data.netBalance.toLocaleString()}`;
        netBalance.className = `stat-value ${data.netBalance >= 0 ? 'text-success' : 'text-danger'}`;

        // Update Categories
        categoriesList.innerHTML = '';
        Object.entries(data.categoryWiseTotals).forEach(([cat, val]) => {
            const div = document.createElement('div');
            div.className = 'category-item';
            div.innerHTML = `<span>${cat}</span>: <strong>$${val.toLocaleString()}</strong>`;
            categoriesList.appendChild(div);
        });
    } catch (err) {
        console.error('Summary fetch error', err);
    }
}

async function fetchRecords() {
    try {
        const res = await fetch(`${API}/records`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok && data.records) {
            recordsList.innerHTML = data.records.length === 0
                ? '<p class="placeholder">No records found.</p>'
                : data.records.map(rec => `
                <div class="record-item fade-in">
                    <div>
                        <strong>${rec.category}</strong>
                        <span class="category-pill">${rec.type}</span>
                        <div style="font-size:0.8rem; color:#94a3b8; margin-top:2px">${new Date(rec.date).toLocaleDateString()}</div>
                    </div>
                    <div class="${rec.type === 'INCOME' ? 'text-success' : 'text-danger'}" style="font-weight:700">
                        ${rec.type === 'INCOME' ? '+' : '-'}$${rec.amount.toLocaleString()}
                    </div>
                </div>
            `).join('');
        } else {
            recordsList.innerHTML = '<p class="placeholder">Could not load records.</p>';
        }
    } catch (err) {
        recordsList.innerHTML = '<p class="placeholder">Error loading records.</p>';
        console.error('Records fetch error', err);
    }
}

// Modal handling
addRecordBtn.addEventListener('click', () => recordModal.style.display = 'flex');
closeModal.addEventListener('click', () => recordModal.style.display = 'none');

recordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        amount: parseFloat(document.getElementById('rec-amount').value),
        type: document.getElementById('rec-type').value,
        category: document.getElementById('rec-category').value,
        notes: document.getElementById('rec-notes').value,
    };

    try {
        const res = await fetch(`${API}/records`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            recordModal.style.display = 'none';
            recordForm.reset();
            showDashboard(); // Refresh
        } else {
            const err = await res.json();
            alert(err.message || 'Failed to save');
        }
    } catch (err) {
        alert('Network error');
    }
});
