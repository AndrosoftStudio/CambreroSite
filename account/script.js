// Alternar entre seções
function showSection(sectionId) {
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

// Enviar dados ao servidor
async function sendToServer(action, data) {
    const response = await fetch('handler.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ action, ...data })
    });
    return await response.json();
}

// Verificar login via cookie
function checkLoginStatus() {
    const loginToken = document.cookie.split('; ').find(row => row.startsWith('login_token='))?.split('=')[1];
    if (loginToken) {
        window.location.href = "https://cambrero.com";
    }
}

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const result = await sendToServer('login', { email, password });
    alert(result.message);
    if (result.success) {
        setTimeout(() => {
            window.location.href = "https://cambrero.com";
        }, 10000); // 10 segundos
    }
});

// Cadastro
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('reg-name').value,
        surname: document.getElementById('reg-surname').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value
    };

    const result = await sendToServer('register', data);
    alert(result.message);
    if (result.success) {
        showSection('login-section');
    }
});

window.onload = checkLoginStatus;