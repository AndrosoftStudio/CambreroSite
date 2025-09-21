// O código React foi pré-compilado para JavaScript puro para máxima compatibilidade e segurança.
// Esta versão inclui novos formulários e componentes de renderização aprimorados.

'use strict';

window.addEventListener('DOMContentLoaded', () => {
    const e = React.createElement;

    // --- Componentes de Renderização de Resultados ---

    const RenderError = ({ error }) => e('div', { className: 'error-box' }, e('h4', null, 'Ocorreu um Erro'), e('p', null, error));
    const NoResults = ({ message }) => e('p', { className: 'no-results' }, message);

    const RenderCNEP = ({ data }) => {
        if (!Array.isArray(data) || data.length === 0) return e(NoResults, { message: 'Nenhuma empresa punida encontrada com os critérios informados.' });
        return e('div', { className: 'results-list' },
            data.map(item => e('div', { key: item.sancionado.id, className: 'result-card' },
                e('h4', { className: 'card-title' }, item.sancionado.nome),
                e('div', { className: 'card-data-point' }, e('strong', null, 'CNPJ/CPF:'), e('span', null, item.sancionado.codigoFormatado)),
                e('div', { className: 'card-data-point' }, e('strong', null, 'Órgão Sancionador:'), e('span', null, item.orgaoSancionador.nome)),
                e('div', { className: 'card-data-point' }, e('strong', null, 'UF:'), e('span', null, item.orgaoSancionador.siglaUf)),
                e('div', { className: 'card-data-point' }, e('strong', null, 'Valor da Multa:'), e('span', { className: 'valor-multa' }, `R$ ${item.valorMulta}`))
            ))
        );
    };
    
    const RenderProcesso = ({ data }) => {
        if (!data.numeroProcesso) return e(NoResults, { message: 'Nenhum processo encontrado com os critérios informados.' });
        return e('div', { className: 'result-card' },
            e('h4', { className: 'card-title' }, `Processo: ${data.numeroProcesso}`),
            e('div', { className: 'card-data-point' }, e('strong', null, 'Área:'), e('span', null, data.area)),
            e('div', { className: 'card-data-point' }, e('strong', null, 'Classe:'), e('span', null, data.classe)),
            e('h5', null, 'Partes Envolvidas'),
            e('ul', { className: 'partes-lista' }, data.partes.map((parte, index) => e('li', { key: index }, `${parte.tipo}: ${parte.nome}`))),
            e('h5', null, 'Movimentações Recentes'),
            e('ul', { className: 'movimentacoes-lista' }, data.movimentacoesRecentes.map((mov, index) => e('li', { key: index }, `${mov.data} - ${mov.descricao}`)))
        );
    };

    const RenderOAB = ({ data }) => {
        if (!data.advogado) return e(NoResults, { message: 'Nenhum advogado encontrado com os critérios informados.' });
        return e('div', { className: 'result-card' },
            e('h4', { className: 'card-title' }, `Advogado(a): ${data.advogado}`),
            e('div', { className: 'card-data-point' }, e('strong', null, 'OAB:'), e('span', null, data.oab)),
            e('div', { className: 'card-data-point' }, e('strong', null, 'Processos Ativos:'), e('span', null, data.processosAtivos)),
            e('h5', null, 'Lista de Processos'),
            e('ul', { className: 'processos-lista' }, data.listaDeProcessos.map((proc, index) => e('li', { key: index }, proc)))
        );
    };

    // --- Componente Principal da Aplicação ---
    const App = () => {
        // Estados para os formulários
        const [processoTipo, setProcessoTipo] = React.useState('numero');
        const [processoValor, setProcessoValor] = React.useState('');
        const [oab, setOab] = React.useState('');
        const [uf, setUf] = React.useState('SP');
        const [cnepTermo, setCnepTermo] = React.useState('');
        
        // Estados de controle
        const [loading, setLoading] = React.useState(false);
        const [result, setResult] = React.useState(null);

        const handleApiCall = async (apiEndpoint, body) => {
            setLoading(true);
            setResult(null);
            try {
                const response = await fetch(`api.php?api=${apiEndpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Erro na rede: ${response.statusText}`);
                }
                const data = await response.json();
                setResult(data);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
                setResult({ source: 'Erro na Aplicação', error: errorMessage });
            } finally {
                setLoading(false);
            }
        };

        const handleConsultaProcessos = (evt) => {
            evt.preventDefault();
            handleApiCall('consulta_processos', { tipo: processoTipo, valor: processoValor });
        };
        const handleConsultaOAB = (evt) => {
            evt.preventDefault();
            handleApiCall('consulta_oab', { oab, uf });
        };
        const handleConsultaCNEP = (evt) => {
            evt.preventDefault();
            handleApiCall('consulta_cnep', { termo: cnepTermo });
        };

        const renderResultData = () => {
            if (!result || !result.data) return null;
            if (result.source.includes('CNEP')) return e(RenderCNEP, { data: result.data });
            if (result.source.includes('Processos')) return e(RenderProcesso, { data: result.data });
            if (result.source.includes('OAB')) return e(RenderOAB, { data: result.data });
            return e('pre', null, JSON.stringify(result.data, null, 2));
        };

        return e('div', null,
            e('div', { className: 'form-container' },
                e('form', { onSubmit: handleConsultaProcessos },
                    e('h2', null, 'Consulta de Processos'),
                    e('div', { className: 'processo-input' },
                        e('select', { value: processoTipo, onChange: (evt) => setProcessoTipo(evt.target.value) },
                            e('option', { value: 'numero' }, 'Número do Processo'),
                            e('option', { value: 'nome' }, 'Nome da Parte'),
                            e('option', { value: 'cpf' }, 'CPF/CNPJ da Parte')
                        ),
                        e('input', { type: 'text', value: processoValor, onChange: (evt) => setProcessoValor(evt.target.value), placeholder: 'Digite o termo de busca...', required: true })
                    ),
                    e('button', { type: 'submit', disabled: loading }, 'Consultar Processo')
                ),
                e('form', { onSubmit: handleConsultaOAB, style: { marginTop: '25px' } },
                    e('h2', null, 'Consulta por OAB'),
                    e('div', { className: 'oab-input' },
                        e('input', { type: 'text', value: oab, onChange: (evt) => setOab(evt.target.value), placeholder: '123456', required: true }),
                        e('select', { value: uf, onChange: (evt) => setUf(evt.target.value) },
                            e('option',{value:'AC'},'AC'), e('option',{value:'AL'},'AL'), e('option',{value:'AP'},'AP'), e('option',{value:'AM'},'AM'), e('option',{value:'BA'},'BA'), e('option',{value:'CE'},'CE'), e('option',{value:'DF'},'DF'), e('option',{value:'ES'},'ES'), e('option',{value:'GO'},'GO'), e('option',{value:'MA'},'MA'), e('option',{value:'MT'},'MT'), e('option',{value:'MS'},'MS'), e('option',{value:'MG'},'MG'), e('option',{value:'PA'},'PA'), e('option',{value:'PB'},'PB'), e('option',{value:'PR'},'PR'), e('option',{value:'PE'},'PE'), e('option',{value:'PI'},'PI'), e('option',{value:'RJ'},'RJ'), e('option',{value:'RN'},'RN'), e('option',{value:'RS'},'RS'), e('option',{value:'RO'},'RO'), e('option',{value:'RR'},'RR'), e('option',{value:'SC'},'SC'), e('option',{value:'SP'},'SP'), e('option',{value:'SE'},'SE'), e('option',{value:'TO'},'TO')
                        )
                    ),
                    e('button', { type: 'submit', disabled: loading }, 'Consultar por OAB')
                ),
                 e('form', { onSubmit: handleConsultaCNEP, style: { marginTop: '25px' } },
                    e('h2', null, 'Consulta de Empresas Inidôneas'),
                    e('input', { type: 'text', value: cnepTermo, onChange: (evt) => setCnepTermo(evt.target.value), placeholder: 'Digite o Nome ou CNPJ da Empresa', required: true }),
                    e('button', { type: 'submit', disabled: loading }, 'Buscar no Portal da Transparência')
                )
            ),
            e('div', { className: 'result-container' },
                e('h2', null, 'Resultado'),
                loading && e('div', { className: 'loader' }),
                result && e('div', { className: 'result-box' },
                    e('h3', null, `Fonte da Resposta: ${result.source}`),
                    result.error ? e(RenderError, { error: result.error }) : renderResultData()
                )
            )
        );
    };

    const domContainer = document.querySelector('#root');
    if (domContainer) {
        const root = ReactDOM.createRoot(domContainer);
        root.render(e(App));
    } else {
        console.error("Erro Crítico: O elemento com id 'root' não foi encontrado.");
        document.body.innerHTML = "<h1 style='color: red; text-align: center;'>Erro: Elemento 'root' não encontrado. Verifique o HTML.</h1>";
    }
});
