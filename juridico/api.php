<?php
header('Content-Type: application/json');

// --- CONFIGURAÇÃO DE SEGURANÇA E CHAVES DE API ---
$api_keys = [
    // Chave para uma API de consulta processual como a da Codilo
    'processos' => 'TODO: INSIRA_SUA_CHAVE_DE_API_DE_PROCESSOS_AQUI', 
    // Chave para uma API de consulta de OAB como a da Judit.io
    'oab' => 'TODO: INSIRA_SUA_CHAVE_DE_API_DE_OAB_AQUI',
    // Chave para a API do Portal da Transparência
    'transparencia' => '61d05bbf9e91d011db3d9852897b306a' 
];
// ----------------------------------------------------

function make_request($method, $url, $headers = [], $body = null) {
    $ch = curl_init();
    $default_headers = ['User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'];
    $final_headers = array_merge($default_headers, $headers);
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    if ($body) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        $final_headers[] = 'Content-Type: application/json';
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $final_headers);
    $response_body = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if (curl_errno($ch)) {
        curl_close($ch);
        return ['body' => json_encode(['source' => 'Erro no Servidor PHP', 'error' => curl_error($ch)]), 'http_code' => 500];
    }
    curl_close($ch);
    return ['body' => $response_body, 'http_code' => $http_code];
}

$input = json_decode(file_get_contents('php://input'), true);
$api_to_use = $_GET['api'] ?? ''; 

switch ($api_to_use) {
    case 'consulta_processos':
        // MODO DEMO - Simula respostas para diferentes tipos de busca
        // A implementação real dependeria da API de processos escolhida
        if ($api_keys['processos'] === 'TODO: INSIRA_SUA_CHAVE_DE_API_DE_PROCESSOS_AQUI') {
            $tipo = $input['tipo'] ?? 'numero';
            $valor = $input['valor'] ?? 'N/A';
            $mock_data = [
                'numeroProcesso' => ($tipo === 'numero') ? $valor : '0012345-67.2025.8.26.0001',
                'classe' => 'Busca e Apreensão em Alienação Fiduciária', 'area' => 'Cível',
                'partes' => [
                    ['tipo' => 'Requerente', 'nome' => 'Banco Exemplo S.A.'],
                    ['tipo' => 'Requerido', 'nome' => ($tipo === 'nome' || $tipo === 'cpf') ? $valor : 'José das Couves']
                ],
                'movimentacoesRecentes' => [['data' => '2025-06-16', 'descricao' => 'Decisão Proferida']]
            ];
            echo json_encode(['source' => 'Consulta de Processos (Modo Demo)', 'data' => $mock_data]);
            break;
        }
        // AQUI IRIA A LÓGICA REAL PARA CHAMAR A API DE PROCESSOS
        break;

    case 'consulta_oab':
        // MODO REAL - Exige a chave de API da Judit.io ou similar
        if ($api_keys['oab'] === 'TODO: INSIRA_SUA_CHAVE_DE_API_DE_OAB_AQUI') {
            http_response_code(401);
            echo json_encode(['source' => 'Erro de Configuração', 'error' => 'É necessária uma chave de API válida para a consulta de OAB. Adicione a sua chave no ficheiro api.php.']);
            break;
        }
        $url = 'https://api.judit.io/processos/busca'; // Exemplo com Judit.io
        $headers = ['x-api-key: ' . $api_keys['oab']];
        $body = ['oab' => ['uf' => $input['uf'], 'numero' => $input['oab']]];
        $api_response = make_request('POST', $url, $headers, $body);
        echo json_encode(['source' => 'Consulta OAB (Real)', 'data' => json_decode($api_response['body'])]);
        break;

    case 'consulta_cnep':
        if (empty($api_keys['transparencia'])) {
             http_response_code(401);
             echo json_encode(['source' => 'Erro de Configuração', 'error' => 'Chave da API do Portal da Transparência não encontrada.']);
            break;
        }
        $termo = urlencode($input['termo'] ?? '');
        $param = is_numeric(preg_replace('/[\.\-\/]/', '', $termo)) ? 'cpfCnpjSancionado' : 'nomeSancionado';
        
        $url = "http://api.portaldatransparencia.gov.br/api-de-dados/cnep?{$param}={$termo}&pagina=1";
        $headers = ['chave-api-dados: ' . $api_keys['transparencia']];
        $api_response = make_request('GET', $url, $headers);

        if ($api_response['http_code'] !== 200) {
            http_response_code($api_response['http_code']);
             echo json_encode(['source' => 'Erro na API Externa (CNEP)', 'error' => 'A API do Portal da Transparência respondeu com o código de erro HTTP ' . $api_response['http_code'] . '.']);
            break;
        }
        
        $data = json_decode($api_response['body']);
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(502);
            echo json_encode(['source' => 'Erro no Servidor (Proxy)', 'error' => 'A resposta da API do Portal da Transparência não é um JSON válido. Erro: ' . json_last_error_msg()]);
            break;
        }
        echo json_encode(['source' => 'CNEP - Portal da Transparência (Real)', 'data' => $data]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['source' => 'Erro no Servidor', 'error' => 'Endpoint da API não especificado ou inválido.']);
        break;
}
?>
