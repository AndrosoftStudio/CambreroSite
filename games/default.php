<?php
// Caminho relativo para jogos.html (na mesma pasta que default.php)
$jogosFile = 'jogos.html';

// Verifica se o arquivo existe
if (file_exists($jogosFile)) {
    // Redireciona para jogos.html se existir
    header('Location: ' . $jogosFile);
    exit; // Encerra o script após o redirecionamento
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Cambrero - Redirecionamento para Jogos">
    <title>Cambrero - Redirecionamento</title>
    <link rel="icon" type="image/png" href="https://cambrero.com/imagens/ícone.png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap">
    <style>
        :root {
            --primary-color: #2c3e50;
            --secondary-color: #3498db;
            --accent-color: #27ae60;
            --text-color: #333;
            --bg-color: #f0f4f8;
            --card-bg: #fff;
            --shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        body {
            margin: 0;
            font-family: 'Poppins', sans-serif;
            background: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            height: 100vh;
            overflow: hidden;
        }

        body.dark-mode {
            --primary-color: #3498db;
            --secondary-color: #2c3e50;
            --text-color: #e0e0e0;
            --bg-color: #1a1d2e;
            --card-bg: #25293a;
        }

        .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 5%;
            background: var(--card-bg);
            box-shadow: var(--shadow);
            position: sticky;
            top: 0;
            z-index: 1000;
            flex-shrink: 0;
        }

        .logo {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--primary-color);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .logo img {
            width: 24px;
            height: 24px;
        }

        .nav-toggle {
            display: none;
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--primary-color);
            cursor: pointer;
        }

        .nav-menu {
            display: flex;
            gap: 1.5rem;
            background: var(--card-bg);
            transition: left 0.3s ease;
        }

        .nav-menu a {
            color: var(--text-color);
            text-decoration: none;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: color 0.3s ease;
        }

        .nav-menu a:hover {
            color: var(--secondary-color);
        }

        .nav-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            z-index: 999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .nav-menu.active + .nav-overlay {
            opacity: 1;
            pointer-events: all;
        }

        .main-content {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem 5%;
            text-align: center;
        }

        h1 {
            font-size: 2.5rem;
            color: var(--primary-color);
            margin-bottom: 1rem;
        }

        p {
            font-size: 1rem;
            margin-bottom: 1.5rem;
            color: var(--text-color);
        }

        .error-message {
            color: #e74c3c;
            font-weight: 600;
            margin-bottom: 1.5rem;
        }

        .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #e74c3c;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .back-button {
            background: var(--primary-color);
            color: white;
            padding: 0.8rem 1.5rem;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
            text-decoration: none;
        }

        .back-button:hover {
            background: var(--secondary-color);
            transform: translateY(-3px);
            box-shadow: var(--shadow);
        }

        .theme-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            border: none;
            padding: 1rem;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: var(--shadow);
            transition: all 0.3s ease;
        }

        .theme-toggle:hover {
            background: var(--secondary-color);
            transform: scale(1.1);
        }

        @media (max-width: 768px) {
            .navbar {
                padding: 1rem 3%;
            }

            .logo {
                font-size: 1.2rem;
            }

            .logo img {
                width: 20px;
                height: 20px;
            }

            .nav-toggle {
                display: block;
            }

            .nav-menu {
                position: fixed;
                top: 60px;
                left: -100%;
                width: 250px;
                height: 100%;
                background: var(--card-bg);
                flex-direction: column;
                padding: 2rem;
                transition: left 0.3s ease;
            }

            .nav-menu.active {
                left: 0;
            }

            h1 {
                font-size: 1.8rem;
            }

            p {
                font-size: 0.9rem;
            }

            .loader {
                width: 30px;
                height: 30px;
            }

            .back-button {
                padding: 0.6rem 1rem;
                font-size: 0.9rem;
            }

            .theme-toggle {
                padding: 0.8rem;
                bottom: 15px;
                right: 15px;
            }
        }

        @media (max-width: 480px) {
            .logo {
                font-size: 1rem;
            }

            h1 {
                font-size: 1.5rem;
            }

            p {
                font-size: 0.8rem;
            }

            .back-button {
                padding: 0.5rem 0.8rem;
                font-size: 0.8rem;
            }

            .loader {
                width: 25px;
                height: 25px;
            }
        }
    </style>
</head>
<body>
    <!-- Navegação -->
    <nav class="navbar">
        <div class="logo">
            <img src="https://cambrero.com/images/ícone.png" alt="Ícone Cambrero">
            Cambrero
        </div>
        <div class="nav-toggle" id="navToggle">
            <i class="fas fa-bars"></i>
        </div>
        <div class="nav-menu" id="navMenu">
            <a href="../account/login.html"><i class="fas fa-user"></i> Entrar</a>
            <a href="#"><i class="fas fa-cog"></i> Configurações</a>
            <a href="#"><i class="fas fa-hand-holding-heart"></i> Doações</a>
            <a href="#"><i class="fas fa-photo-video"></i> Mídias</a>
        </div>
    </nav>
    <div class="nav-overlay" id="navOverlay"></div>

    <!-- Conteúdo Principal -->
    <main class="main-content">
        <h1>Cambrero</h1>
        <?php if (file_exists($jogosFile)): ?>
            <p>Redirecionando para a página de jogos...</p>
        <?php else: ?>
            <div class="loader"></div>
            <p class="error-message">Falha ao conectar à página de jogos.</p>
            <a href="https://cambrero.com" class="back-button">
                <i class="fas fa-arrow-left"></i> Voltar à Página Inicial
            </a>
        <?php endif; ?>
    </main>

    <!-- Botão de Modo Escuro -->
    <button class="theme-toggle" id="themeToggle">
        <i class="fas fa-moon"></i>
    </button>

    <script>
        // Funções para manipulação de cookies
        function setCookie(name, value, days) {
            let expires = "";
            if (days) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            // Configura o cookie para ser compartilhado entre cambrero.com e seus subdomínios
            document.cookie = name + "=" + (value || "") + expires + "; path=/; domain=.cambrero.com; SameSite=Lax";
        }

        function getCookie(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) === ' ') {
                    c = c.substring(1, c.length);
                }
                if (c.indexOf(nameEQ) === 0) {
                    return c.substring(nameEQ.length, c.length);
                }
            }
            return null;
        }

        document.addEventListener('DOMContentLoaded', function() {
            // Menu Toggle
            const navToggle = document.getElementById('navToggle');
            const navMenu = document.getElementById('navMenu');
            const navOverlay = document.getElementById('navOverlay');

            function toggleMenu() {
                navMenu.classList.toggle('active');
                navOverlay.classList.toggle('active');
            }

            navToggle.addEventListener('click', toggleMenu);
            navOverlay.addEventListener('click', toggleMenu);

            // Theme Toggle
            const themeToggle = document.getElementById('themeToggle');
            const body = document.body;

            // Carregar tema salvo do cookie
            const savedTheme = getCookie('theme');
            if (savedTheme === 'dark') {
                body.classList.add('dark-mode');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            } else {
                body.classList.remove('dark-mode');
                themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            }

            // Atualizar tema ao clicar no botão
            themeToggle.addEventListener('click', function() {
                body.classList.toggle('dark-mode');
                const newTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
                setCookie('theme', newTheme, 365); // Cookie válido por 1 ano
                themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            });
        });
    </script>
</body>
</html>