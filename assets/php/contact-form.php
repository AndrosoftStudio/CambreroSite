<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = htmlspecialchars($_POST['name']);
    $email = htmlspecialchars($_POST['email']);
    $message = htmlspecialchars($_POST['message']);
    
    $to = "seu-email@example.com";
    $subject = "Novo contato do site";
    $body = "Nome: $name\nEmail: $email\nMensagem:\n$message";
    
    if (mail($to, $subject, $body)) {
        echo "Mensagem enviada com sucesso!";
    } else {
        echo "Erro ao enviar mensagem.";
    }
}
?>