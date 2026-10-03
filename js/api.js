/* =========================================================
   HUBI - CAMADA DE DADOS / API
   Front-end -> Google Apps Script -> Google Sheets
   ========================================================= */

const SenacAPI = (() => {
    const API_URL =
        "https://script.google.com/macros/s/AKfycbzOXKoQP-qsrT8N7DgcBuvWGDsi0x8ZS_rwV18PXJ6SZHjYTEyDQr49LupAJKMD7lw2Xg/exec";

    const ADMIN_TOKEN_KEY = "hubi_admin_token";
    const PUBLIC_CACHE_KEY = "hubi_public_cache_v3";

    /*
       Cache curto no navegador.

       Isso reduz consultas repetidas sem deixar
       avisos e informações antigas por muito tempo.
    */
    const PUBLIC_CACHE_TTL = 30 * 1000;

    /*
       O Apps Script às vezes demora um pouco
       quando está "acordando".

       15 segundos evita ficar preso eternamente,
       mas também não corta um cold start normal.
    */
    const REQUEST_TIMEOUT = 15000;

    /*
       Apenas consultas públicas podem tentar
       novamente automaticamente.

       POST nunca é repetido automaticamente
       para não criar registro duplicado.
    */
    const PUBLIC_RETRIES = 1;

    let publicPromise = null;
    let adminPromise = null;

    /*
       Dados administrativos ficam em memória
       enquanto a página estiver aberta.

       Isso deixa a troca entre páginas instantânea.
    */
    let adminCache = null;


    const bancoVazio = {
        versao: "",
        fuso: "America/Campo_Grande",
        geradoEm: "",
        dataSenac: "",

        perguntas: [],
        turmas: [],
        salas: [],
        alteracoesSala: [],
        notificacoes: [],
        historico: []
    };


    /* =====================================================
       CONFIGURAÇÃO
       ===================================================== */

    function isRemoteConfigured() {
        return Boolean(
            API_URL &&
            API_URL.trim()
        );
    }


    function clone(valor) {
        if (valor === undefined) {
            return undefined;
        }

        if (valor === null) {
            return null;
        }

        if (
            typeof structuredClone ===
            "function"
        ) {
            try {
                return structuredClone(
                    valor
                );
            } catch {
                // fallback abaixo
            }
        }

        return JSON.parse(
            JSON.stringify(
                valor
            )
        );
    }


    /* =====================================================
       TOKEN DO ADMINISTRADOR
       ===================================================== */

    function obterToken() {
        return (
            sessionStorage.getItem(
                ADMIN_TOKEN_KEY
            )
            ||
            ""
        );
    }


    function salvarToken(token) {
        if (token) {
            sessionStorage.setItem(
                ADMIN_TOKEN_KEY,
                String(token)
            );
        } else {
            sessionStorage.removeItem(
                ADMIN_TOKEN_KEY
            );
        }
    }


    /*
       Remove apenas a sessão deste navegador.

       Não faz requisição para o servidor.
       É útil quando a página é aberta/recarregada.
    */
    function encerrarSessaoLocal() {
        salvarToken("");

        adminCache = null;
        adminPromise = null;
    }


    /* =====================================================
       CACHE ADMINISTRATIVO EM MEMÓRIA
       ===================================================== */

    function definirCacheAdmin(dados) {
        adminCache =
            normalizarBanco(
                dados || {}
            );

        return clone(
            adminCache
        );
    }


    function lerCacheAdmin() {
        if (!adminCache) {
            return null;
        }

        return clone(
            adminCache
        );
    }


    function limparCacheAdmin() {
        adminCache = null;
        adminPromise = null;
    }


    /* =====================================================
       CACHE PÚBLICO
       ===================================================== */

    function lerCachePublico(
        aceitarExpirado = false
    ) {
        try {
            const bruto =
                localStorage.getItem(
                    PUBLIC_CACHE_KEY
                );

            if (!bruto) {
                return null;
            }

            const cache =
                JSON.parse(
                    bruto
                );

            if (
                !cache ||
                !cache.dados ||
                !cache.salvoEm
            ) {
                localStorage.removeItem(
                    PUBLIC_CACHE_KEY
                );

                return null;
            }

            const idade =
                Date.now()
                -
                Number(
                    cache.salvoEm
                );

            if (
                !aceitarExpirado &&
                idade >
                PUBLIC_CACHE_TTL
            ) {
                return null;
            }

            return clone(
                normalizarBanco(
                    cache.dados
                )
            );

        } catch (erro) {
            console.warn(
                "Cache público do HUBI inválido.",
                erro
            );

            localStorage.removeItem(
                PUBLIC_CACHE_KEY
            );

            return null;
        }
    }


    function salvarCachePublico(dados) {
        try {
            localStorage.setItem(
                PUBLIC_CACHE_KEY,

                JSON.stringify({
                    salvoEm:
                        Date.now(),

                    dados:
                        normalizarBanco(
                            dados
                        )
                })
            );

        } catch (erro) {
            console.warn(
                "Não foi possível salvar o cache público do HUBI.",
                erro
            );
        }
    }


    function limparCachePublico() {
        localStorage.removeItem(
            PUBLIC_CACHE_KEY
        );

        publicPromise = null;
    }


    /* =====================================================
       NORMALIZAÇÃO DO BANCO
       ===================================================== */

    function normalizarBanco(
        dados = {}
    ) {
        return {
            versao:
                String(
                    dados.versao ||
                    ""
                ),

            fuso:
                String(
                    dados.fuso ||
                    "America/Campo_Grande"
                ),

            geradoEm:
                String(
                    dados.geradoEm ||
                    ""
                ),

            dataSenac:
                String(
                    dados.dataSenac ||
                    ""
                ),

            perguntas:
                Array.isArray(
                    dados.perguntas
                )
                    ?
                    dados.perguntas
                    :
                    [],

            turmas:
                Array.isArray(
                    dados.turmas
                )
                    ?
                    dados.turmas
                    :
                    [],

            salas:
                Array.isArray(
                    dados.salas
                )
                    ?
                    dados.salas
                    :
                    [],

            alteracoesSala:
                Array.isArray(
                    dados.alteracoesSala
                )
                    ?
                    dados.alteracoesSala
                    :
                    [],

            notificacoes:
                Array.isArray(
                    dados.notificacoes
                )
                    ?
                    dados.notificacoes
                    :
                    [],

            historico:
                normalizarHistorico(
                    dados.historico
                )
        };
    }


    function normalizarHistorico(
        historico
    ) {
        if (
            !Array.isArray(
                historico
            )
        ) {
            return [];
        }

        return historico.map(
            item => ({
                ...item,

                tipo:
                    item.tipo

                    ||

                    [
                        item.acao,
                        item.entidade
                    ]
                        .filter(
                            Boolean
                        )
                        .join(
                            " • "
                        )

                    ||

                    "Ação",

                descricao:
                    item.descricao

                    ||

                    item.detalhes

                    ||

                    "Alteração registrada no painel.",

                data:
                    item.data

                    ||

                    item.dataHora

                    ||

                    ""
            })
        );
    }


    /* =====================================================
       FETCH COM TIMEOUT
       ===================================================== */

    async function fetchComTimeout(
        url,
        opcoes = {},
        timeout = REQUEST_TIMEOUT
    ) {
        const controller =
            new AbortController();

        const timer =
            setTimeout(
                () =>
                    controller.abort(),

                timeout
            );

        try {
            return await fetch(
                url,

                {
                    ...opcoes,

                    signal:
                        controller.signal
                }
            );

        } catch (erro) {
            if (
                erro &&
                erro.name ===
                "AbortError"
            ) {
                throw new Error(
                    "A conexão com o servidor do HUBI demorou demais. Tente novamente."
                );
            }

            throw erro;

        } finally {
            clearTimeout(
                timer
            );
        }
    }


    /* =====================================================
       LER RESPOSTA
       ===================================================== */

    async function parseResponse(
        resposta
    ) {
        const textoResposta =
            await resposta.text();

        let dados;

        try {
            dados =
                textoResposta
                    ?
                    JSON.parse(
                        textoResposta
                    )
                    :
                    {};

        } catch (erro) {
            console.error(
                "Resposta inválida do Apps Script:",
                textoResposta
            );

            throw new Error(
                "O servidor do HUBI retornou uma resposta inválida."
            );
        }


        if (!resposta.ok) {
            throw new Error(
                dados.mensagem

                ||

                `Erro de comunicação (${resposta.status}).`
            );
        }


        if (
            dados.sucesso ===
            false
        ) {
            throw new Error(
                dados.mensagem

                ||

                "Não foi possível concluir a operação."
            );
        }


        return dados;
    }


    /* =====================================================
       GET
       ===================================================== */

    async function getRemote(
        acao,
        parametros = {},
        repeticoes = 0
    ) {
        if (
            !isRemoteConfigured()
        ) {
            throw new Error(
                "A URL da API do HUBI não está configurada."
            );
        }


        const url =
            new URL(
                API_URL
            );


        url.searchParams.set(
            "acao",
            acao
        );


        Object
            .entries(
                parametros
            )
            .forEach(
                (
                    [
                        chave,
                        valor
                    ]
                ) => {

                    if (
                        valor !== undefined &&
                        valor !== null &&
                        valor !== ""
                    ) {
                        url.searchParams.set(
                            chave,
                            String(
                                valor
                            )
                        );
                    }
                }
            );


        const totalTentativas =
            Math.max(
                0,
                Number(
                    repeticoes
                )
                ||
                0
            )
            +
            1;


        let ultimoErro =
            null;


        for (
            let tentativa = 0;
            tentativa < totalTentativas;
            tentativa++
        ) {
            try {
                const resposta =
                    await fetchComTimeout(
                        url.toString(),

                        {
                            method:
                                "GET",

                            cache:
                                "no-store"
                        }
                    );

                return await parseResponse(
                    resposta
                );

            } catch (erro) {
                ultimoErro =
                    erro;

                if (
                    tentativa >=
                    totalTentativas - 1
                ) {
                    break;
                }

                await esperar(
                    500
                    *
                    (
                        tentativa + 1
                    )
                );
            }
        }


        throw (
            ultimoErro

            ||

            new Error(
                "Não foi possível acessar a API do HUBI."
            )
        );
    }


    /* =====================================================
       POST

       text/plain evita uma requisição extra de
       preflight CORS.

       POST não possui repetição automática.
       ===================================================== */

    async function postRemote(
        acao,
        payload = {}
    ) {
        if (
            !isRemoteConfigured()
        ) {
            throw new Error(
                "A URL da API do HUBI não está configurada."
            );
        }


        const resposta =
            await fetchComTimeout(
                API_URL,

                {
                    method:
                        "POST",

                    cache:
                        "no-store",

                    headers: {
                        "Content-Type":
                            "text/plain;charset=utf-8"
                    },

                    body:
                        JSON.stringify({
                            acao,

                            token:
                                obterToken(),

                            ...payload
                        })
                }
            );


        return parseResponse(
            resposta
        );
    }


    /* =====================================================
       CARREGAR DADOS
       ===================================================== */

    async function carregarDados(
        opcoes = {}
    ) {
        const forcar =
            opcoes &&
            opcoes.forcar ===
            true;


        /* =================================================
           ADMINISTRADOR
           ================================================= */

        if (
            obterToken()
        ) {
            /*
               Se os dados já chegaram no login
               ou numa operação anterior, não consulta
               o Google de novo.
            */

            if (
                !forcar &&
                adminCache
            ) {
                return clone(
                    adminCache
                );
            }


            /*
               Se duas partes da interface pedirem os
               dados ao mesmo tempo, usam a mesma Promise.
            */

            if (
                !forcar &&
                adminPromise
            ) {
                return clone(
                    await adminPromise
                );
            }


            adminPromise =
                (
                    async () => {
                        try {
                            const resposta =
                                await postRemote(
                                    "dadosAdmin"
                                );

                            return definirCacheAdmin(
                                resposta.dados
                                ||
                                bancoVazio
                            );

                        } finally {
                            adminPromise =
                                null;
                        }
                    }
                )();


            return clone(
                await adminPromise
            );
        }


        /* =================================================
           USUÁRIO COMUM
           ================================================= */

        if (!forcar) {
            const cache =
                lerCachePublico(
                    false
                );

            if (cache) {
                return cache;
            }
        }


        if (
            !forcar &&
            publicPromise
        ) {
            return clone(
                await publicPromise
            );
        }


        publicPromise =
            (
                async () => {
                    try {
                        const resposta =
                            await getRemote(
                                "dadosPublicos",
                                {},
                                PUBLIC_RETRIES
                            );


                        const dados =
                            normalizarBanco(
                                resposta.dados
                                ||
                                bancoVazio
                            );


                        salvarCachePublico(
                            dados
                        );


                        return dados;

                    } catch (erro) {
                        /*
                           Se a internet oscilar,
                           usa a última cópia do navegador.
                        */

                        const antigo =
                            lerCachePublico(
                                true
                            );


                        if (antigo) {
                            console.warn(
                                "API indisponível temporariamente. Usando a última cópia salva no navegador.",
                                erro
                            );

                            return antigo;
                        }


                        throw erro;

                    } finally {
                        publicPromise =
                            null;
                    }
                }
            )();


        return clone(
            await publicPromise
        );
    }


    /* =====================================================
       FORÇAR ATUALIZAÇÃO
       ===================================================== */

    async function atualizarDadosPublicos() {
        limparCachePublico();

        return carregarDados({
            forcar: true
        });
    }


    async function atualizarDadosAdmin() {
        limparCacheAdmin();

        return carregarDados({
            forcar: true
        });
    }


    /* =====================================================
       TESTAR API
       ===================================================== */

    async function testarConexao() {
        return getRemote(
            "health",
            {},
            1
        );
    }


    /* =====================================================
       LOGIN

       O Código.gs V3 retorna os dados do painel
       junto com o login.

       Então:
       LOGIN = 1 requisição.

       O admin.js pode chamar carregarDados()
       depois e receberá o cache em memória.
       ===================================================== */

    async function loginAdmin(
        usuario,
        senha
    ) {
        usuario =
            String(
                usuario ||
                ""
            )
                .trim();


        senha =
            String(
                senha ||
                ""
            );


        if (
            !usuario ||
            !senha
        ) {
            throw new Error(
                "Informe usuário e senha."
            );
        }


        /*
           Limpa qualquer sessão antiga apenas
           neste navegador.
        */

        encerrarSessaoLocal();


        const resposta =
            await postRemote(
                "login",

                {
                    usuario,
                    senha
                }
            );


        if (
            !resposta.token
        ) {
            throw new Error(
                "O servidor não retornou uma sessão válida."
            );
        }


        salvarToken(
            resposta.token
        );


        /*
           Aproveita os dados que já vieram
           na resposta do login.
        */

        if (
            resposta.dados
        ) {
            definirCacheAdmin(
                resposta.dados
            );
        }


        return resposta;
    }


    /* =====================================================
       VALIDAR SESSÃO
       ===================================================== */

    async function validarSessao() {
        const token =
            obterToken();


        if (!token) {
            return false;
        }


        try {
            const resposta =
                await postRemote(
                    "validarSessao"
                );


            const valida =
                resposta.valida ===
                true;


            if (!valida) {
                encerrarSessaoLocal();
            }


            return valida;

        } catch (erro) {
            console.warn(
                "Sessão do HUBI inválida ou expirada.",
                erro
            );


            encerrarSessaoLocal();


            return false;
        }
    }


    /* =====================================================
       LOGOUT
       ===================================================== */

    async function logoutAdmin() {
        const token =
            obterToken();


        if (token) {
            try {
                await postRemote(
                    "logout"
                );

            } catch (erro) {
                console.warn(
                    "Não foi possível encerrar a sessão no servidor.",
                    erro
                );
            }
        }


        encerrarSessaoLocal();
    }


    /* =====================================================
       RESPOSTA DE SALVAR / EXCLUIR

       O Código.gs V3 devolve os dados atualizados.

       Assim:
       salvar = 1 requisição
       excluir = 1 requisição

       Nada de salvar e depois baixar tudo de novo.
       ===================================================== */

    function aplicarRespostaMutacao(
        resposta,
        entidade,
        tipo
    ) {
        /*
           O banco público mudou.
           Apaga o cache público deste navegador.
        */

        limparCachePublico();


        /*
           Caminho principal:
           usa o banco atualizado que veio do servidor.
        */

        if (
            resposta &&
            resposta.dados
        ) {
            definirCacheAdmin(
                resposta.dados
            );

            return resposta;
        }


        /*
           Fallback caso alguma versão antiga
           do backend não devolva `dados`.
        */

        if (!adminCache) {
            return resposta;
        }


        const nomes = {
            pergunta:
                "perguntas",

            turma:
                "turmas",

            sala:
                "salas",

            alteracao:
                "alteracoesSala",

            notificacao:
                "notificacoes"
        };


        const nomeArray =
            nomes[
                entidade
            ];


        if (!nomeArray) {
            return resposta;
        }


        const lista =
            Array.isArray(
                adminCache[
                    nomeArray
                ]
            )
                ?
                adminCache[
                    nomeArray
                ]
                :
                [];


        /* ---------------- SALVAR ---------------- */

        if (
            tipo ===
            "salvar"
            &&
            resposta.registro
        ) {
            const indice =
                lista.findIndex(
                    item =>
                        item.id ===
                        resposta.registro.id
                );


            if (
                indice >= 0
            ) {
                lista[indice] =
                    resposta.registro;
            } else {
                lista.push(
                    resposta.registro
                );
            }
        }


        /* ---------------- EXCLUIR ---------------- */

        if (
            tipo ===
            "excluir"
            &&
            resposta.removidoId
        ) {
            adminCache[
                nomeArray
            ] =
                lista.filter(
                    item =>
                        item.id !==
                        resposta.removidoId
                );

        } else {
            adminCache[
                nomeArray
            ] =
                lista;
        }


        return resposta;
    }


    /* =====================================================
       PERGUNTAS
       ===================================================== */

    async function salvarPergunta(
        pergunta
    ) {
        const resposta =
            await postRemote(
                "salvarPergunta",

                {
                    registro:
                        pergunta
                }
            );


        return aplicarRespostaMutacao(
            resposta,
            "pergunta",
            "salvar"
        );
    }


    async function excluirPergunta(
        id
    ) {
        const resposta =
            await postRemote(
                "excluirPergunta",

                {
                    id
                }
            );


        return aplicarRespostaMutacao(
            resposta,
            "pergunta",
            "excluir"
        );
    }


    /* =====================================================
       TURMAS
       ===================================================== */

    async function salvarTurma(
        turma
    ) {
        const resposta =
            await postRemote(
                "salvarTurma",

                {
                    registro:
                        turma
                }
            );


        return aplicarRespostaMutacao(
            resposta,
            "turma",
            "salvar"
        );
    }


    async function excluirTurma(
        id
    ) {
        const resposta =
            await postRemote(
                "excluirTurma",

                {
                    id
                }
            );


        return aplicarRespostaMutacao(
            resposta,
            "turma",
            "excluir"
        );
    }


    /* =====================================================
       SALAS / HORÁRIOS
       ===================================================== */

    async function salvarSala(
        sala
    ) {
        const resposta =
            await postRemote(
                "salvarSala",

                {
                    registro:
                        sala
                }
            );


        return aplicarRespostaMutacao(
            resposta,
            "sala",
            "salvar"
        );
    }


    /*
        Cadastro dos dois dias da turma em UMA única
        requisição ao Apps Script.
    */
    async function salvarSalasEmLote(
        salas
    ) {
        if (
            !Array.isArray(salas)
            ||
            salas.length === 0
        ) {
            throw new Error(
                "Nenhum horário foi informado."
            );
        }


        const resposta =
            await postRemote(
                "salvarSalasEmLote",

                {
                    registros:
                        salas
                }
            );


        limparCachePublico();


        if (
            resposta
            &&
            resposta.dados
        ) {
            definirCacheAdmin(
                resposta.dados
            );
        }


        return resposta;
    }


    async function excluirSala(
        id
    ) {
        const resposta =
            await postRemote(
                "excluirSala",

                {
                    id
                }
            );


        return aplicarRespostaMutacao(
            resposta,
            "sala",
            "excluir"
        );
    }


    /* =====================================================
       ALTERAÇÕES TEMPORÁRIAS
       ===================================================== */

    async function salvarAlteracaoSala(
        alteracao
    ) {
        const resposta =
            await postRemote(
                "salvarAlteracaoSala",

                {
                    registro:
                        alteracao
                }
            );


        return aplicarRespostaMutacao(
            resposta,
            "alteracao",
            "salvar"
        );
    }


    async function excluirAlteracaoSala(
        id
    ) {
        const resposta =
            await postRemote(
                "excluirAlteracaoSala",

                {
                    id
                }
            );


        return aplicarRespostaMutacao(
            resposta,
            "alteracao",
            "excluir"
        );
    }


    /* =====================================================
       NOTIFICAÇÕES
       ===================================================== */

    async function salvarNotificacao(
        notificacao
    ) {
        const resposta =
            await postRemote(
                "salvarNotificacao",

                {
                    registro:
                        notificacao
                }
            );


        return aplicarRespostaMutacao(
            resposta,
            "notificacao",
            "salvar"
        );
    }


    async function excluirNotificacao(
        id
    ) {
        const resposta =
            await postRemote(
                "excluirNotificacao",

                {
                    id
                }
            );


        return aplicarRespostaMutacao(
            resposta,
            "notificacao",
            "excluir"
        );
    }


    /* =====================================================
       UTILITÁRIOS
       ===================================================== */

    function esperar(ms) {
        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    ms
                )
        );
    }


    /* =====================================================
       FUNÇÕES DISPONÍVEIS
       ===================================================== */

    return {
        isRemoteConfigured,

        carregarDados,
        atualizarDadosPublicos,
        atualizarDadosAdmin,
        testarConexao,

        loginAdmin,
        validarSessao,
        logoutAdmin,
        encerrarSessaoLocal,

        salvarPergunta,
        excluirPergunta,

        salvarTurma,
        excluirTurma,

        salvarSala,
        salvarSalasEmLote,
        excluirSala,

        salvarAlteracaoSala,
        excluirAlteracaoSala,

        salvarNotificacao,
        excluirNotificacao,

        limparCachePublico,
        limparCacheAdmin,
        lerCacheAdmin
    };

})();