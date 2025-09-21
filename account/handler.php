<?php
header('Content-Type: application/json');

session_start();

// --- Credenciais do seu banco de dados ---
$host = 'localhost';
$user = 'u818513709_user_login';
$pass = '11441855Novo';
$db   = 'u818513709_cambrero';
// ------------------------------------

try {
    $conn = new mysqli($host, $user, $pass, $db);
    if ($conn->connect_error) {
        die(json_encode(['success' => false, 'message' => 'Erro de conexão: ' . $conn->connect_error]));
    }
} catch (Exception $e) {
    die(json_encode(['success' => false, 'message' => 'Erro crítico na conexão: ' . $e->getMessage()]));
}

// Permite que a ação venha por POST (dos formulários) ou GET (para buscar dados)
$action = $_REQUEST['action'] ?? '';

// --- LÓGICA DE CADASTRO ---
if ($action === 'register') {
    // Limpa e valida os dados recebidos do formulário
    $name = filter_var($_POST['name'], FILTER_SANITIZE_STRING);
    $surname = filter_var($_POST['surname'], FILTER_SANITIZE_STRING);
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
         die(json_encode(['success' => false, 'message' => 'Formato de e-mail inválido.']));
    }
    if (strlen($_POST['password']) < 6) {
        die(json_encode(['success' => false, 'message' => 'A senha deve ter pelo menos 6 caracteres.']));
    }
    
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO users (nome, sobrenome, email, senha) VALUES (?, ?, ?, ?)");
    if (!$stmt) {
        die(json_encode(['success' => false, 'message' => 'Erro interno ao preparar cadastro.']));
    }
    $stmt->bind_param("ssss", $name, $surname, $email, $password);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Cadastro realizado com sucesso!']);
    } else {
        if ($conn->errno === 1062) {
             echo json_encode(['success' => false, 'message' => 'Este e-mail já está cadastrado.']);
        } else {
             echo json_encode(['success' => false, 'message' => 'Erro ao cadastrar: ' . $stmt->error]);
        }
    }
    $stmt->close();

// --- LÓGICA DE LOGIN ---
} elseif ($action === 'login') {
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'];

    $stmt = $conn->prepare("SELECT id, senha FROM users WHERE email = ?");
    if (!$stmt) {
        die(json_encode(['success' => false, 'message' => 'Erro interno ao preparar login.']));
    }
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        if (password_verify($password, $row['senha'])) {
            $_SESSION['user_id'] = $row['id'];
            $token = bin2hex(random_bytes(16));
            
            $cookie_options = [
                'expires' => time() + (30 * 24 * 60 * 60),
                'path' => '/',
                'domain' => '.cambrero.com',
                'secure' => true,
                'httponly' => true,
                'samesite' => 'Lax'
            ];
            setcookie('login_token', $token, $cookie_options);

            $updateStmt = $conn->prepare("UPDATE users SET login_token = ? WHERE id = ?");
            $updateStmt->bind_param("si", $token, $row['id']);
            $updateStmt->execute();
            $updateStmt->close();

            echo json_encode(['success' => true, 'message' => 'Login bem-sucedido! Redirecionando...']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Senha incorreta.']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'E-mail não encontrado.']);
    }
    $stmt->close();

// --- NOVA LÓGICA PARA OBTER DADOS DO UTILIZADOR ---
} elseif ($action === 'getUserData') {
    // Verifica se o cookie de login existe
    if (!isset($_COOKIE['login_token'])) {
        die(json_encode(['success' => false, 'message' => 'Não autenticado']));
    }

    $token = $_COOKIE['login_token'];

    // Procura o utilizador na base de dados com base no token do cookie
    $stmt = $conn->prepare("SELECT nome, sobrenome, email, profile_picture_url FROM users WHERE login_token = ?");
    if (!$stmt) {
        die(json_encode(['success' => false, 'message' => 'Erro interno.']));
    }
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();

    // Se encontrar o utilizador, retorna os seus dados
    if ($user = $result->fetch_assoc()) {
        echo json_encode(['success' => true, 'data' => $user]);
    } else {
        // Se o token for inválido (ex: logout noutro dispositivo), informa o cliente
        echo json_encode(['success' => false, 'message' => 'Token inválido ou sessão expirada.']);
    }
    $stmt->close();

} else {
    echo json_encode(['success' => false, 'message' => 'Ação inválida']);
}

$conn->close();
?>
