let API_URL = localStorage.getItem("bot_api_url") || "http://localhost:8080";
let API_KEY = localStorage.getItem("bot_api_key") || "";

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("api-url").value = API_URL;
    document.getElementById("api-key").value = API_KEY;
    document.getElementById("config-api-url").value = API_URL;
    document.getElementById("config-api-key").value = API_KEY;
    if (API_KEY) {
        fetchDashboardData();
    }
});

function switchTab(tabId, element) {
    document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("active"));
    
    document.getElementById(`tab-${tabId}`).classList.add("active");
    if (element) {
        element.classList.add("active");
    }
}

function saveConnectionSettings() {
    API_URL = document.getElementById("api-url").value.replace(/\/$/, "");
    API_KEY = document.getElementById("api-key").value;

    localStorage.setItem("bot_api_url", API_URL);
    localStorage.setItem("bot_api_key", API_KEY);

    document.getElementById("config-api-url").value = API_URL;
    document.getElementById("config-api-key").value = API_KEY;

    fetchDashboardData();
}

function updateConnectionStatus(success, message) {
    const statusEl = document.getElementById("connection-status");
    statusEl.textContent = message;
    statusEl.style.color = success ? "#2ea043" : "#da3633";
    statusEl.style.marginLeft = "16px";
    statusEl.style.fontWeight = "bold";
}

async function apiRequest(endpoint, options = {}) {
    const headers = {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        ...options.headers
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
        if (!response.ok) {
            updateConnectionStatus(false, `Error: HTTP ${response.status}`);
            return null;
        }
        updateConnectionStatus(true, "Connected");
        return await response.json();
    } catch (err) {
        console.error("API Request Error:", err);
        updateConnectionStatus(false, "Connection Failed");
        return null;
    }
}

async function fetchDashboardData() {
    await fetchStats();
    await fetchBinds();
    await fetchUsers();
}

async function fetchStats() {
    const data = await apiRequest("/api/stats");
    if (!data) return;
    document.getElementById("stat-bot-name").innerText = data.bot_name;
    document.getElementById("stat-guilds").innerText = data.guilds_count;
    document.getElementById("stat-users").innerText = data.total_verified;
    document.getElementById("stat-binds").innerText = data.total_binds;
}

async function fetchBinds() {
    const data = await apiRequest("/api/binds");
    const tbody = document.getElementById("binds-table-body");
    tbody.innerHTML = "";

    if (!data || data.binds.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">No group binds found.</td></tr>`;
        return;
    }

    data.binds.forEach(bind => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${bind.id}</td>
            <td>${bind.guild_id}</td>
            <td>${bind.group_id}</td>
            <td>${bind.min_rank}</td>
            <td>${bind.max_rank}</td>
            <td>${bind.role_id}</td>
            <td><button class="btn-danger" onclick="deleteBind(${bind.id})">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
}

async function deleteBind(bindId) {
    if (!confirm(`Are you sure you want to delete bind ID ${bindId}?`)) return;
    const res = await apiRequest(`/api/binds/${bindId}`, { method: "DELETE" });
    if (res && res.success) {
        fetchBinds();
        fetchStats();
    }
}

async function fetchUsers() {
    const data = await apiRequest("/api/users");
    const tbody = document.getElementById("users-table-body");
    tbody.innerHTML = "";

    if (!data || data.users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3">No verified users found.</td></tr>`;
        return;
    }

    data.users.forEach(u => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${u.discord_id}</td>
            <td>${u.roblox_id}</td>
            <td>${u.roblox_username}</td>
        `;
        tbody.appendChild(row);
    });
}