/* =========================================================
   HUBI - PAINEL ADMINISTRATIVO
   Versão V3
   ========================================================= */

const HubiAdmin = (() => {
    const TOKEN_KEY = "hubi_admin_token";
    const FUSO_HUBI = "America/Campo_Grande";

    let banco = bancoVazio();
    let paginaAtual = "dashboard";
    let ultimoFoco = null;

    const el = {};

    function bancoVazio() {
        return {
            perguntas: [],
            turmas: [],
            salas: [],
            alteracoesSala: [],
            notificacoes: [],
            historico: []
        };
    }

    function cacheElementos() {
        el.loginScreen = document.getElementById("loginScreen");
        el.loginForm = document.getElementById("loginForm");
        el.loginUser = document.getElementById("loginUser");
        el.loginPassword = document.getElementById("loginPassword");
        el.loginButton = document.getElementById("loginButton");
        el.loginMessage = document.getElementById("loginMessage");
        el.togglePassword = document.getElementById("togglePassword");
        el.localModeBox = document.getElementById("localModeBox");

        el.adminApp = document.getElementById("adminApp");
        el.adminSidebar = document.getElementById("adminSidebar");
        el.adminSidebarOverlay = document.getElementById("adminSidebarOverlay");
        el.adminSidebarClose = document.getElementById("adminSidebarClose");
        el.adminMobileMenu = document.getElementById("adminMobileMenu");
        el.logoutButton = document.getElementById("logoutButton");
        el.logoutSidebarButton = document.getElementById("logoutSidebarButton");
        el.environmentBadge = document.getElementById("environmentBadge");
        el.pageTitle = document.getElementById("pageTitle");
        el.adminContent = document.getElementById("adminContent");

        el.modalOverlay = document.getElementById("adminModalOverlay");
        el.modalTitle = document.getElementById("adminModalTitle");
        el.modalContent = document.getElementById("adminModalContent");
        el.modalClose = document.getElementById("adminModalClose");
        el.toastContainer = document.getElementById("toastContainer");
    }


    /* =====================================================
       INICIALIZAÇÃO
       ===================================================== */

    function iniciar() {
        cacheElementos();
        configurarEventos();

        /*
            Sempre exige novo login ao abrir ou recarregar
            a área administrativa.
        */
        if (
            typeof SenacAPI !== "undefined" &&
            typeof SenacAPI.encerrarSessaoLocal === "function"
        ) {
            SenacAPI.encerrarSessaoLocal();
        } else {
            sessionStorage.removeItem(TOKEN_KEY);
        }

        el.localModeBox?.classList.add("hidden");

        el.environmentBadge.textContent = "Conectado";
        el.environmentBadge.classList.add("remote");

        el.loginScreen.classList.remove("hidden");
        el.adminApp.classList.add("hidden");

        el.loginPassword.value = "";

        /*
            Atualiza apenas as informações visuais
            do dashboard a cada 30 segundos.

            Não faz chamada ao Google.
        */
        setInterval(() => {
            if (
                paginaAtual === "dashboard" &&
                !el.adminApp.classList.contains("hidden")
            ) {
                renderDashboard();
            }
        }, 30000);

        el.loginUser.focus();
    }


    function configurarEventos() {
        el.loginForm.addEventListener(
            "submit",
            realizarLogin
        );

        el.togglePassword.addEventListener(
            "click",
            alternarSenha
        );

        el.logoutButton.addEventListener(
            "click",
            sairPainel
        );

        el.logoutSidebarButton.addEventListener(
            "click",
            sairPainel
        );

        el.adminMobileMenu.addEventListener(
            "click",
            abrirSidebar
        );

        el.adminSidebarClose.addEventListener(
            "click",
            fecharSidebar
        );

        el.adminSidebarOverlay.addEventListener(
            "click",
            fecharSidebar
        );

        el.modalClose.addEventListener(
            "click",
            fecharModal
        );

        el.modalOverlay.addEventListener(
            "click",
            eventoOverlayModal
        );

        document.addEventListener(
            "keydown",
            eventoTecladoGlobal
        );

        window.addEventListener(
            "pagehide",
            () => {
                if (
                    typeof SenacAPI !== "undefined" &&
                    typeof SenacAPI.encerrarSessaoLocal === "function"
                ) {
                    SenacAPI.encerrarSessaoLocal();
                } else {
                    sessionStorage.removeItem(TOKEN_KEY);
                }
            }
        );

        document
            .querySelectorAll(".admin-nav-item")
            .forEach(item => {
                item.addEventListener(
                    "click",
                    () => {
                        abrirPagina(
                            item.dataset.page || "dashboard"
                        );

                        fecharSidebar();
                    }
                );
            });

        el.adminContent.addEventListener(
            "click",
            eventoConteudo
        );

        el.adminContent.addEventListener(
            "input",
            eventoFiltro
        );
    }


    /* =====================================================
       LOGIN
       ===================================================== */

    async function realizarLogin(evento) {
        evento.preventDefault();

        const usuario =
            el.loginUser.value.trim();

        const senha =
            el.loginPassword.value;

        if (!usuario || !senha) {
            mensagemLogin(
                "Informe usuário e senha."
            );

            return;
        }

        el.loginButton.disabled = true;
        el.loginButton.textContent = "Entrando...";

        mensagemLogin("");

        try {
            /*
                IMPORTANTE:

                O Apps Script V3 já retorna todos os
                dados administrativos junto com o login.

                Portanto não precisamos:
                login -> Google
                dadosAdmin -> Google

                É apenas uma chamada.
            */
            const resposta =
                await SenacAPI.loginAdmin(
                    usuario,
                    senha
                );

            if (resposta?.dados) {
                aplicarBanco(
                    resposta.dados
                );
            } else {
                await atualizarBanco();
            }

            mensagemLogin(
                "Acesso autorizado.",
                true
            );

            el.loginScreen.classList.add(
                "hidden"
            );

            el.adminApp.classList.remove(
                "hidden"
            );

            abrirPagina(
                "dashboard"
            );

        } catch (erro) {
            if (
                typeof SenacAPI !== "undefined" &&
                typeof SenacAPI.encerrarSessaoLocal === "function"
            ) {
                SenacAPI.encerrarSessaoLocal();
            } else {
                sessionStorage.removeItem(
                    TOKEN_KEY
                );
            }

            mensagemLogin(
                erro.message ||
                "Não foi possível entrar."
            );

        } finally {
            el.loginButton.disabled = false;
            el.loginButton.textContent = "Entrar";
        }
    }


    function alternarSenha() {
        const mostrando =
            el.loginPassword.type === "text";

        el.loginPassword.type =
            mostrando
                ? "password"
                : "text";

        el.togglePassword.setAttribute(
            "aria-label",
            mostrando
                ? "Mostrar senha"
                : "Ocultar senha"
        );

        el.togglePassword.setAttribute(
            "title",
            mostrando
                ? "Mostrar senha"
                : "Ocultar senha"
        );
    }


    function mensagemLogin(
        texto,
        sucesso = false
    ) {
        el.loginMessage.textContent =
            texto;

        el.loginMessage.classList.toggle(
            "success",
            sucesso
        );
    }


    function sairPainel() {
        /*
            Faz o logout sem bloquear a interface.
        */
        SenacAPI
            .logoutAdmin()
            .catch(
                erro =>
                    console.warn(erro)
            );

        sessionStorage.removeItem(
            TOKEN_KEY
        );

        fecharSidebar();
        fecharModal();

        banco =
            bancoVazio();

        el.adminApp.classList.add(
            "hidden"
        );

        el.loginScreen.classList.remove(
            "hidden"
        );

        el.loginPassword.value = "";

        mensagemLogin("");

        setTimeout(
            () =>
                el.loginUser.focus(),
            50
        );
    }


    /* =====================================================
       BANCO LOCAL
       ===================================================== */

    function aplicarBanco(
        dados = {}
    ) {
        banco = {
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
                Array.isArray(
                    dados.historico
                )
                    ?
                    dados.historico
                    :
                    []
        };
    }


    async function atualizarBanco(
        opcoes = {}
    ) {
        const dados =
            await SenacAPI.carregarDados(
                opcoes
            );

        aplicarBanco(
            dados
        );
    }


    /*
        Depois de salvar ou excluir,
        api.js já recebeu o banco atualizado
        na MESMA resposta.

        Portanto pegamos os dados da memória
        em vez de consultar o Google novamente.
    */
    function sincronizarBancoDoCache() {
        if (
            typeof SenacAPI.lerCacheAdmin !==
            "function"
        ) {
            return false;
        }

        const dados =
            SenacAPI.lerCacheAdmin();

        if (!dados) {
            return false;
        }

        aplicarBanco(
            dados
        );

        return true;
    }


    /* =====================================================
       NAVEGAÇÃO
       ===================================================== */

    function abrirPagina(
        pagina
    ) {
        paginaAtual =
            pagina;

        document
            .querySelectorAll(
                ".admin-nav-item"
            )
            .forEach(item => {
                item.classList.toggle(
                    "active",
                    item.dataset.page === pagina
                );
            });

        if (pagina === "dashboard") {
            renderDashboard();
        }

        if (pagina === "perguntas") {
            renderPerguntas();
        }

        if (pagina === "turmas") {
            renderTurmas();
        }

        if (pagina === "salas") {
            renderSalas();
        }

        if (pagina === "alteracoes") {
            renderAlteracoes();
        }

        if (pagina === "notificacoes") {
            renderNotificacoes();
        }

        if (pagina === "historico") {
            renderHistorico();
        }
    }


    /* =====================================================
       DASHBOARD
       ===================================================== */

    function renderDashboard() {
        el.pageTitle.textContent =
            "Dashboard";

        const alteracoesHoje =
            obterAlteracoesHoje();

        const avisosAtivos =
            obterNotificacoesAtivas();

        const historico =
            banco.historico.slice(
                0,
                5
            );

        el.adminContent.innerHTML = `
            <div class="stats-grid">

                ${statCard(
                    "Perguntas",
                    banco.perguntas.length
                )}

                ${statCard(
                    "Turmas",
                    banco.turmas.length
                )}

                ${statCard(
                    "Salas e horários",
                    banco.salas.length
                )}

                ${statCard(
                    "Alterações hoje",
                    alteracoesHoje.length
                )}

                ${statCard(
                    "Avisos ativos",
                    avisosAtivos.length
                )}

            </div>


            <div class="dashboard-grid">

                <section class="panel">

                    <div class="panel-header">

                        <div>

                            <h2>
                                Alterações de sala de hoje
                            </h2>

                            <p>
                                Mudanças temporárias cadastradas
                                para a data atual.
                            </p>

                        </div>

                    </div>


                    ${
                        alteracoesHoje.length

                            ?

                            `
                            <div class="today-list">

                                ${
                                    alteracoesHoje
                                        .map(
                                            item => `
                                            <article class="today-item">

                                                <strong>
                                                    Turma
                                                    ${escapeHTML(
                                                        item.turma
                                                    )}
                                                    →
                                                    sala
                                                    ${escapeHTML(
                                                        item.salaNova
                                                    )}
                                                </strong>

                                                <span>
                                                    ${escapeHTML(
                                                        formatarIntervalo(
                                                            item.horarioInicio,
                                                            item.horarioFim
                                                        )
                                                    )}

                                                    ${
                                                        item.motivo

                                                            ?

                                                            ` • ${escapeHTML(
                                                                item.motivo
                                                            )}`

                                                            :

                                                            ""
                                                    }
                                                </span>

                                            </article>
                                        `
                                        )
                                        .join("")
                                }

                            </div>
                            `

                            :

                            estadoVazio(
                                "Nenhuma alteração de sala cadastrada para hoje."
                            )
                    }

                </section>


                <section class="panel">

                    <div class="panel-header">

                        <div>

                            <h2>
                                Atividade recente
                            </h2>

                            <p>
                                Últimas ações registradas pelo painel.
                            </p>

                        </div>

                    </div>


                    ${
                        historico.length

                            ?

                            `
                            <div class="recent-list">

                                ${
                                    historico
                                        .map(
                                            item => `
                                            <article class="recent-item">

                                                <strong>
                                                    ${escapeHTML(
                                                        item.tipo ||
                                                        "Ação"
                                                    )}
                                                </strong>

                                                <span>
                                                    ${escapeHTML(
                                                        item.descricao ||
                                                        ""
                                                    )}

                                                    •

                                                    ${escapeHTML(
                                                        formatarDataHora(
                                                            item.data
                                                        )
                                                    )}
                                                </span>

                                            </article>
                                        `
                                        )
                                        .join("")
                                }

                            </div>
                            `

                            :

                            estadoVazio(
                                "Ainda não há alterações registradas."
                            )
                    }

                </section>

            </div>
        `;
    }


    function statCard(
        titulo,
        valor
    ) {
        return `
            <article class="stat-card">

                <span>
                    ${escapeHTML(
                        titulo
                    )}
                </span>

                <strong>
                    ${Number(valor) || 0}
                </strong>

            </article>
        `;
    }


    /* =====================================================
       PERGUNTAS
       ===================================================== */

    function renderPerguntas() {
        el.pageTitle.textContent =
            "Perguntas";

        el.adminContent.innerHTML = `
            ${toolbar(
                "Perguntas e respostas",
                "Cadastre conteúdos institucionais usados pelo HUBI.",
                "perguntas",
                "+ Nova pergunta"
            )}

            <div id="tableArea">

                ${tabelaPerguntas(
                    banco.perguntas
                )}

            </div>
        `;
    }


    function tabelaPerguntas(
        lista
    ) {
        if (!lista.length) {
            return estadoVazio(
                "Nenhuma pergunta cadastrada ainda."
            );
        }

        return `
            <div class="table-wrapper">

                <table class="admin-table">

                    <thead>

                        <tr>

                            <th>
                                Pergunta
                            </th>

                            <th>
                                Categoria
                            </th>

                            <th>
                                Palavras-chave
                            </th>

                            <th>
                                Status
                            </th>

                            <th>
                                Ações
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${
                            lista
                                .map(
                                    item => `
                                    <tr>

                                        <td
                                            class="wrap"
                                            data-label="Pergunta"
                                        >
                                            ${escapeHTML(
                                                item.pergunta
                                            )}
                                        </td>


                                        <td
                                            data-label="Categoria"
                                        >
                                            ${escapeHTML(
                                                item.categoria ||
                                                "Geral"
                                            )}
                                        </td>


                                        <td
                                            class="wrap"
                                            data-label="Palavras-chave"
                                        >
                                            ${escapeHTML(
                                                (
                                                    item.palavrasChave ||
                                                    []
                                                )
                                                    .join(
                                                        ", "
                                                    )
                                            )}
                                        </td>


                                        <td
                                            data-label="Status"
                                        >
                                            ${statusBadge(
                                                item.ativo
                                            )}
                                        </td>


                                        <td
                                            data-label="Ações"
                                        >
                                            ${acoesTabela(
                                                "pergunta",
                                                item.id
                                            )}
                                        </td>

                                    </tr>
                                `
                                )
                                .join("")
                        }

                    </tbody>

                </table>

            </div>
        `;
    }


    /* =====================================================
       TURMAS
       ===================================================== */

    function renderTurmas() {
        el.pageTitle.textContent =
            "Turmas";

        el.adminContent.innerHTML = `
            ${toolbar(
                "Turmas",
                "Cadastre as turmas que poderão ser usadas em salas e alterações temporárias.",
                "turmas",
                "+ Nova turma"
            )}

            <div id="tableArea">

                ${tabelaTurmas(
                    banco.turmas
                )}

            </div>
        `;
    }


    function tabelaTurmas(
        lista
    ) {
        if (!lista.length) {
            return estadoVazio(
                "Nenhuma turma cadastrada ainda."
            );
        }

        const ordenada =
            [...lista]
                .sort(
                    (a, b) =>
                        String(
                            a.turma ||
                            ""
                        )
                            .localeCompare(
                                String(
                                    b.turma ||
                                    ""
                                ),
                                "pt-BR",
                                {
                                    numeric: true
                                }
                            )
                );

        return `
            <div class="table-wrapper">

                <table class="admin-table">

                    <thead>

                        <tr>

                            <th>
                                Turma
                            </th>

                            <th>
                                Status
                            </th>

                            <th>
                                Ações
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${
                            ordenada
                                .map(
                                    item => `
                                    <tr>

                                        <td
                                            data-label="Turma"
                                        >
                                            <strong>
                                                ${escapeHTML(
                                                    item.turma
                                                )}
                                            </strong>
                                        </td>


                                        <td
                                            data-label="Status"
                                        >
                                            ${statusBadge(
                                                item.ativo
                                            )}
                                        </td>


                                        <td
                                            data-label="Ações"
                                        >
                                            ${acoesTabela(
                                                "turma",
                                                item.id
                                            )}
                                        </td>

                                    </tr>
                                `
                                )
                                .join("")
                        }

                    </tbody>

                </table>

            </div>
        `;
    }


    /* =====================================================
       SALAS E HORÁRIOS
       ===================================================== */

    function renderSalas() {
        el.pageTitle.textContent =
            "Salas e horários";

        el.adminContent.innerHTML = `
            ${toolbar(
                "Salas e horários",
                "Cada turma possui dois dias semanais. Os dias podem ser qualquer combinação e cada dia fica salvo separadamente.",
                "salas",
                "+ Nova sala"
            )}

            <div id="tableArea">

                ${tabelaSalas(
                    banco.salas
                )}

            </div>
        `;
    }


    function tabelaSalas(
        lista
    ) {
        if (!lista.length) {
            return estadoVazio(
                "Nenhuma sala ou horário cadastrado ainda."
            );
        }

        const ordenada =
            [...lista]
                .sort(
                    ordenarSalas
                );

        return `
            <div class="table-wrapper">

                <table class="admin-table">

                    <thead>

                        <tr>

                            <th>
                                Turma
                            </th>

                            <th>
                                Dia
                            </th>

                            <th>
                                Vigência
                            </th>

                            <th>
                                Horário
                            </th>

                            <th>
                                Sala
                            </th>

                            <th>
                                Status
                            </th>

                            <th>
                                Ações
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${
                            ordenada
                                .map(
                                    item => `
                                    <tr>

                                        <td
                                            data-label="Turma"
                                        >
                                            <strong>
                                                ${escapeHTML(
                                                    item.turma
                                                )}
                                            </strong>
                                        </td>


                                        <td
                                            data-label="Dia"
                                        >
                                            ${escapeHTML(
                                                capitalizar(
                                                    item.diaSemana
                                                )
                                            )}
                                        </td>


                                        <td
                                            data-label="Vigência"
                                        >
                                            ${escapeHTML(
                                                formatarPeriodoDatas(
                                                    item.dataInicio,
                                                    item.dataFim
                                                )
                                            )}
                                        </td>


                                        <td
                                            data-label="Horário"
                                        >
                                            ${escapeHTML(
                                                formatarIntervalo(
                                                    item.horarioInicio,
                                                    item.horarioFim
                                                )
                                            )}
                                        </td>


                                        <td
                                            data-label="Sala"
                                        >
                                            ${escapeHTML(
                                                item.sala
                                            )}
                                        </td>


                                        <td
                                            data-label="Status"
                                        >
                                            ${statusBadge(
                                                item.ativo
                                            )}
                                        </td>


                                        <td
                                            data-label="Ações"
                                        >
                                            ${acoesTabela(
                                                "sala",
                                                item.id
                                            )}
                                        </td>

                                    </tr>
                                `
                                )
                                .join("")
                        }

                    </tbody>

                </table>

            </div>
        `;
    }


    /* =====================================================
       ALTERAÇÕES DE SALA
       ===================================================== */

    function renderAlteracoes() {
        el.pageTitle.textContent =
            "Alterações de sala";

        el.adminContent.innerHTML = `
            ${toolbar(
                "Alterações temporárias",
                "Use para uma troca excepcional de sala em uma data específica.",
                "alteracoes",
                "+ Nova alteração"
            )}

            <div id="tableArea">

                ${tabelaAlteracoes(
                    banco.alteracoesSala
                )}

            </div>
        `;
    }


    function tabelaAlteracoes(
        lista
    ) {
        if (!lista.length) {
            return estadoVazio(
                "Nenhuma alteração temporária cadastrada."
            );
        }

        const ordenada =
            [...lista]
                .sort(
                    (a, b) =>
                        `${b.data}${b.horarioInicio}`
                            .localeCompare(
                                `${a.data}${a.horarioInicio}`
                            )
                );

        return `
            <div class="table-wrapper">

                <table class="admin-table">

                    <thead>

                        <tr>

                            <th>
                                Turma
                            </th>

                            <th>
                                Data
                            </th>

                            <th>
                                Horário
                            </th>

                            <th>
                                Nova sala
                            </th>

                            <th>
                                Motivo
                            </th>

                            <th>
                                Status
                            </th>

                            <th>
                                Ações
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${
                            ordenada
                                .map(
                                    item => `
                                    <tr>

                                        <td
                                            data-label="Turma"
                                        >
                                            <strong>
                                                ${escapeHTML(
                                                    item.turma
                                                )}
                                            </strong>
                                        </td>


                                        <td
                                            data-label="Data"
                                        >
                                            ${escapeHTML(
                                                formatarData(
                                                    item.data
                                                )
                                            )}
                                        </td>


                                        <td
                                            data-label="Horário"
                                        >
                                            ${escapeHTML(
                                                formatarIntervalo(
                                                    item.horarioInicio,
                                                    item.horarioFim
                                                )
                                            )}
                                        </td>


                                        <td
                                            data-label="Nova sala"
                                        >
                                            ${escapeHTML(
                                                item.salaNova
                                            )}
                                        </td>


                                        <td
                                            class="wrap"
                                            data-label="Motivo"
                                        >
                                            ${escapeHTML(
                                                item.motivo ||
                                                "—"
                                            )}
                                        </td>


                                        <td
                                            data-label="Status"
                                        >
                                            ${statusBadge(
                                                item.ativo
                                            )}
                                        </td>


                                        <td
                                            data-label="Ações"
                                        >
                                            ${acoesTabela(
                                                "alteracao",
                                                item.id
                                            )}
                                        </td>

                                    </tr>
                                `
                                )
                                .join("")
                        }

                    </tbody>

                </table>

            </div>
        `;
    }


    /* =====================================================
       NOTIFICAÇÕES
       ===================================================== */

    function renderNotificacoes() {
        el.pageTitle.textContent =
            "Notificações";

        el.adminContent.innerHTML = `
            ${toolbar(
                "Avisos e eventos",
                "Publique notificações com período de exibição no horário de Campo Grande.",
                "notificacoes",
                "+ Nova notificação"
            )}

            <div id="tableArea">

                ${tabelaNotificacoes(
                    banco.notificacoes
                )}

            </div>
        `;
    }


    function tabelaNotificacoes(
        lista
    ) {
        if (!lista.length) {
            return estadoVazio(
                "Nenhuma notificação cadastrada ainda."
            );
        }

        const ordenada =
            [...lista]
                .sort(
                    (a, b) =>
                        dataMillis(
                            b.inicio
                        )
                        -
                        dataMillis(
                            a.inicio
                        )
                );

        return `
            <div class="table-wrapper">

                <table class="admin-table">

                    <thead>

                        <tr>

                            <th>
                                Título
                            </th>

                            <th>
                                Prioridade
                            </th>

                            <th>
                                Início
                            </th>

                            <th>
                                Fim
                            </th>

                            <th>
                                Status
                            </th>

                            <th>
                                Ações
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${
                            ordenada
                                .map(
                                    item => `
                                    <tr>

                                        <td
                                            class="wrap"
                                            data-label="Título"
                                        >
                                            <strong>
                                                ${escapeHTML(
                                                    item.titulo
                                                )}
                                            </strong>
                                        </td>


                                        <td
                                            data-label="Prioridade"
                                        >
                                            ${priorityBadge(
                                                item.prioridade
                                            )}
                                        </td>


                                        <td
                                            data-label="Início"
                                        >
                                            ${escapeHTML(
                                                formatarDataHora(
                                                    item.inicio
                                                )
                                            )}
                                        </td>


                                        <td
                                            data-label="Fim"
                                        >
                                            ${escapeHTML(
                                                formatarDataHora(
                                                    item.fim
                                                )
                                            )}
                                        </td>


                                        <td
                                            data-label="Status"
                                        >
                                            ${statusNotificacao(
                                                item
                                            )}
                                        </td>


                                        <td
                                            data-label="Ações"
                                        >
                                            ${acoesTabela(
                                                "notificacao",
                                                item.id
                                            )}
                                        </td>

                                    </tr>
                                `
                                )
                                .join("")
                        }

                    </tbody>

                </table>

            </div>
        `;
    }


    /* =====================================================
       HISTÓRICO
       ===================================================== */

    function renderHistorico() {
        el.pageTitle.textContent =
            "Histórico";

        el.adminContent.innerHTML = `
            <div class="page-toolbar">

                <div class="page-toolbar-copy">

                    <h2>
                        Histórico de alterações
                    </h2>

                    <p>
                        Registro das principais ações
                        realizadas no painel.
                    </p>

                </div>

            </div>


            ${
                banco.historico.length

                    ?

                    `
                    <div class="history-list">

                        ${
                            banco.historico
                                .map(
                                    item => `
                                    <article class="history-item">

                                        <strong>
                                            ${escapeHTML(
                                                item.tipo ||
                                                "Ação"
                                            )}
                                        </strong>

                                        <p>
                                            ${escapeHTML(
                                                item.descricao ||
                                                ""
                                            )}
                                        </p>

                                        <span>
                                            ${escapeHTML(
                                                formatarDataHora(
                                                    item.data
                                                )
                                            )}
                                        </span>

                                    </article>
                                `
                                )
                                .join("")
                        }

                    </div>
                    `

                    :

                    estadoVazio(
                        "Nenhuma alteração registrada ainda."
                    )
            }
        `;
    }


    /* =====================================================
       TOOLBAR
       ===================================================== */

    function toolbar(
        titulo,
        descricao,
        tipo,
        botaoTexto
    ) {
        return `
            <div class="page-toolbar">

                <div class="page-toolbar-copy">

                    <h2>
                        ${escapeHTML(
                            titulo
                        )}
                    </h2>

                    <p>
                        ${escapeHTML(
                            descricao
                        )}
                    </p>

                </div>


                <div class="page-toolbar-actions">

                    <input
                        class="search-field"
                        id="tableSearch"
                        type="search"
                        placeholder="Pesquisar..."
                        aria-label="Pesquisar registros"
                    >


                    <button
                        class="action-button"
                        type="button"
                        data-create="${escapeAttr(
                            tipo
                        )}"
                    >
                        ${escapeHTML(
                            botaoTexto
                        )}
                    </button>

                </div>

            </div>
        `;
    }


    /* =====================================================
       PESQUISA
       ===================================================== */

    function eventoFiltro(
        evento
    ) {
        if (
            evento.target.id !==
            "tableSearch"
        ) {
            return;
        }

        const termo =
            normalizar(
                evento.target.value
            );

        let html = "";


        if (
            paginaAtual ===
            "perguntas"
        ) {
            html =
                tabelaPerguntas(

                    banco.perguntas.filter(
                        item =>
                            normalizar(
                                `
                                    ${item.pergunta}
                                    ${item.categoria}
                                    ${
                                        (
                                            item.palavrasChave ||
                                            []
                                        )
                                            .join(" ")
                                    }
                                `
                            )
                                .includes(
                                    termo
                                )
                    )

                );
        }


        if (
            paginaAtual ===
            "turmas"
        ) {
            html =
                tabelaTurmas(

                    banco.turmas.filter(
                        item =>
                            normalizar(
                                item.turma
                            )
                                .includes(
                                    termo
                                )
                    )

                );
        }


        if (
            paginaAtual ===
            "salas"
        ) {
            html =
                tabelaSalas(

                    banco.salas.filter(
                        item =>
                            normalizar(
                                `
                                    ${item.turma}
                                    ${item.diaSemana}
                                    ${item.dataInicio}
                                    ${item.dataFim}
                                    ${item.horarioInicio}
                                    ${item.horarioFim}
                                    ${item.sala}
                                `
                            )
                                .includes(
                                    termo
                                )
                    )

                );
        }


        if (
            paginaAtual ===
            "alteracoes"
        ) {
            html =
                tabelaAlteracoes(

                    banco.alteracoesSala.filter(
                        item =>
                            normalizar(
                                `
                                    ${item.turma}
                                    ${item.data}
                                    ${item.salaNova}
                                    ${item.motivo}
                                `
                            )
                                .includes(
                                    termo
                                )
                    )

                );
        }


        if (
            paginaAtual ===
            "notificacoes"
        ) {
            html =
                tabelaNotificacoes(

                    banco.notificacoes.filter(
                        item =>
                            normalizar(
                                `
                                    ${item.titulo}
                                    ${item.mensagem}
                                    ${item.prioridade}
                                `
                            )
                                .includes(
                                    termo
                                )
                    )

                );
        }


        const area =
            document.getElementById(
                "tableArea"
            );

        if (area) {
            area.innerHTML =
                html;
        }
    }


    /* =====================================================
       CLIQUES DO CONTEÚDO
       ===================================================== */

    function eventoConteudo(
        evento
    ) {
        const criar =
            evento.target.closest(
                "[data-create]"
            );

        if (criar) {
            abrirFormulario(
                criar.dataset.create
            );

            return;
        }


        const editar =
            evento.target.closest(
                "[data-edit]"
            );

        if (editar) {
            abrirFormulario(
                editar.dataset.edit,
                editar.dataset.id
            );

            return;
        }


        const excluir =
            evento.target.closest(
                "[data-delete]"
            );

        if (excluir) {
            excluirRegistro(
                excluir.dataset.delete,
                excluir.dataset.id
            );
        }
    }


    function abrirFormulario(
        tipo,
        id = ""
    ) {
        if (
            tipo === "perguntas" ||
            tipo === "pergunta"
        ) {
            abrirFormularioPergunta(
                id
            );
        }


        if (
            tipo === "turmas" ||
            tipo === "turma"
        ) {
            abrirFormularioTurma(
                id
            );
        }


        if (
            tipo === "salas" ||
            tipo === "sala"
        ) {
            abrirFormularioSala(
                id
            );
        }


        if (
            tipo === "alteracoes" ||
            tipo === "alteracao"
        ) {
            abrirFormularioAlteracao(
                id
            );
        }


        if (
            tipo === "notificacoes" ||
            tipo === "notificacao"
        ) {
            abrirFormularioNotificacao(
                id
            );
        }
    }


    /* =====================================================
       FORMULÁRIO PERGUNTA
       ===================================================== */

    function abrirFormularioPergunta(
        id = ""
    ) {
        const item =
            banco.perguntas.find(
                registro =>
                    registro.id === id
            );

        el.modalTitle.textContent =
            item
                ? "Editar pergunta"
                : "Nova pergunta";

        el.modalContent.innerHTML = `
            <form
                class="admin-form"
                id="perguntaForm"
            >

                <div class="form-group">

                    <label
                        for="perguntaCategoria"
                    >
                        Categoria
                    </label>

                    <input
                        id="perguntaCategoria"
                        value="${escapeAttr(
                            item?.categoria ||
                            "Geral"
                        )}"
                        required
                    >

                </div>


                <div class="form-group">

                    <label
                        for="perguntaAtivo"
                    >
                        Status
                    </label>

                    <select
                        id="perguntaAtivo"
                    >

                        <option
                            value="true"
                            ${
                                item?.ativo !== false
                                    ? "selected"
                                    : ""
                            }
                        >
                            Ativa
                        </option>

                        <option
                            value="false"
                            ${
                                item?.ativo === false
                                    ? "selected"
                                    : ""
                            }
                        >
                            Inativa
                        </option>

                    </select>

                </div>


                <div class="form-group full">

                    <label
                        for="perguntaTexto"
                    >
                        Pergunta de referência
                    </label>

                    <input
                        id="perguntaTexto"
                        value="${escapeAttr(
                            item?.pergunta ||
                            ""
                        )}"
                        placeholder="Ex.: Onde fica a biblioteca?"
                        required
                    >

                </div>


                <div class="form-group full">

                    <label
                        for="perguntaKeywords"
                    >
                        Palavras-chave
                    </label>

                    <input
                        id="perguntaKeywords"
                        value="${escapeAttr(
                            (
                                item?.palavrasChave ||
                                []
                            )
                                .join(
                                    ", "
                                )
                        )}"
                        placeholder="biblioteca, livros, leitura, bib"
                        required
                    >

                    <span
                        class="form-help"
                    >
                        Separe por vírgulas.
                    </span>

                </div>


                <div class="form-group full">

                    <label
                        for="perguntaResposta"
                    >
                        Resposta
                    </label>

                    <textarea
                        id="perguntaResposta"
                        placeholder="Resposta que o HUBI deverá exibir"
                        required
                    >${escapeHTML(
                        item?.resposta ||
                        ""
                    )}</textarea>

                </div>


                ${formActions(
                    "Salvar pergunta"
                )}

            </form>
        `;


        abrirModal();


        document
            .getElementById(
                "perguntaForm"
            )
            .addEventListener(
                "submit",
                async evento => {

                    evento.preventDefault();


                    const registro = {

                        id:
                            item?.id ||
                            "",

                        categoria:
                            valor(
                                "perguntaCategoria"
                            ),

                        pergunta:
                            valor(
                                "perguntaTexto"
                            ),

                        palavrasChave:
                            valor(
                                "perguntaKeywords"
                            )
                                .split(",")
                                .map(
                                    texto =>
                                        texto.trim()
                                )
                                .filter(
                                    Boolean
                                ),

                        resposta:
                            valor(
                                "perguntaResposta"
                            ),

                        ativo:
                            valor(
                                "perguntaAtivo"
                            )
                            ===
                            "true"
                    };


                    if (
                        !registro
                            .palavrasChave
                            .length
                    ) {
                        toast(
                            "Cadastre pelo menos uma palavra-chave.",
                            "error"
                        );

                        return;
                    }


                    await executarSalvamento(

                        () =>
                            SenacAPI
                                .salvarPergunta(
                                    registro
                                ),

                        "Pergunta salva com sucesso.",

                        "perguntas"
                    );

                }
            );


        configurarCancelamento();
    }


    /* =====================================================
       FORMULÁRIO TURMA
       ===================================================== */

    function abrirFormularioTurma(
        id = ""
    ) {
        const item =
            banco.turmas.find(
                registro =>
                    registro.id === id
            );

        el.modalTitle.textContent =
            item
                ? "Editar turma"
                : "Nova turma";

        el.modalContent.innerHTML = `
            <form
                class="admin-form"
                id="turmaForm"
            >

                <div
                    class="form-group full"
                >

                    <label
                        for="turmaNome"
                    >
                        Turma
                    </label>

                    <input
                        id="turmaNome"
                        value="${escapeAttr(
                            item?.turma ||
                            ""
                        )}"
                        placeholder="Ex.: 2026.1.6"
                        required
                    >

                    <span
                        class="form-help"
                    >
                        Use exatamente o identificador
                        utilizado pelo Senac.
                    </span>

                </div>


                <div class="form-group">

                    <label
                        for="turmaAtivo"
                    >
                        Status
                    </label>

                    <select
                        id="turmaAtivo"
                    >

                        <option
                            value="true"
                            ${
                                item?.ativo !== false
                                    ? "selected"
                                    : ""
                            }
                        >
                            Ativa
                        </option>

                        <option
                            value="false"
                            ${
                                item?.ativo === false
                                    ? "selected"
                                    : ""
                            }
                        >
                            Inativa
                        </option>

                    </select>

                </div>


                ${formActions(
                    "Salvar turma"
                )}

            </form>
        `;


        abrirModal();


        document
            .getElementById(
                "turmaForm"
            )
            .addEventListener(
                "submit",
                async evento => {

                    evento.preventDefault();


                    const registro = {

                        id:
                            item?.id ||
                            "",

                        turma:
                            valor(
                                "turmaNome"
                            ),

                        ativo:
                            valor(
                                "turmaAtivo"
                            )
                            ===
                            "true"
                    };


                    await executarSalvamento(

                        () =>
                            SenacAPI
                                .salvarTurma(
                                    registro
                                ),

                        "Turma salva com sucesso.",

                        "turmas"
                    );

                }
            );


        configurarCancelamento();
    }


    /* =====================================================
       FORMULÁRIO SALA

       AO CRIAR:
       - exatamente dois dias;
       - qualquer combinação de dias;
       - cada dia pode ter sala diferente;
       - cada dia pode ter horário diferente.

       AO EDITAR:
       - apenas o registro escolhido.
       ===================================================== */

    function abrirFormularioSala(
        id = ""
    ) {
        const item =
            banco.salas.find(
                registro =>
                    registro.id === id
            );


        if (!banco.turmas.length) {
            toast(
                "Cadastre uma turma antes de criar uma sala.",
                "error"
            );

            abrirPagina(
                "turmas"
            );

            return;
        }


        if (item) {
            abrirFormularioSalaEdicao(
                item
            );
        } else {
            abrirFormularioSalaNovo();
        }
    }


    function abrirFormularioSalaNovo() {
        el.modalTitle.textContent =
            "Cadastrar os dois dias da turma";


        el.modalContent.innerHTML = `
            <form
                class="admin-form"
                id="salaForm"
            >

                <div class="form-group">

                    <label
                        for="salaTurma"
                    >
                        Turma
                    </label>

                    <select
                        id="salaTurma"
                        required
                    >
                        ${opcoesTurmas("")}
                    </select>

                </div>


                <div class="form-group">

                    <label
                        for="salaAtivo"
                    >
                        Status
                    </label>

                    <select
                        id="salaAtivo"
                    >

                        <option
                            value="true"
                            selected
                        >
                            Ativo
                        </option>

                        <option
                            value="false"
                        >
                            Inativo
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label
                        for="salaDataInicio"
                    >
                        Início da vigência
                    </label>

                    <input
                        id="salaDataInicio"
                        type="date"
                        required
                    >

                </div>


                <div class="form-group">

                    <label
                        for="salaDataFim"
                    >
                        Fim da vigência
                    </label>

                    <input
                        id="salaDataFim"
                        type="date"
                        required
                    >

                </div>


                ${blocoDiaSala(1)}

                ${blocoDiaSala(2)}


                <div
                    class="form-group full"
                >

                    <span
                        class="form-help"
                    >
                        Cada turma possui dois dias semanais,
                        mas os dias não são fixos.

                        Você escolhe os dois dias corretos
                        daquela turma.

                        Cada dia também pode ter horário
                        e sala diferentes.
                    </span>

                </div>


                ${formActions(
                    "Cadastrar os dois dias"
                )}

            </form>
        `;


        abrirModal();


        document
            .getElementById(
                "salaForm"
            )
            .addEventListener(
                "submit",
                async evento => {

                    evento.preventDefault();


                    const turma =
                        valor(
                            "salaTurma"
                        );

                    const dataInicio =
                        valor(
                            "salaDataInicio"
                        );

                    const dataFim =
                        valor(
                            "salaDataFim"
                        );

                    const ativo =
                        valor(
                            "salaAtivo"
                        )
                        ===
                        "true";


                    if (
                        !periodoValido(
                            dataInicio,
                            dataFim
                        )
                    ) {
                        toast(
                            "O fim da vigência não pode ser anterior ao início.",
                            "error"
                        );

                        return;
                    }


                    const primeiro =
                        lerBlocoDiaSala(
                            1
                        );

                    const segundo =
                        lerBlocoDiaSala(
                            2
                        );


                    if (
                        !primeiro.diaSemana ||
                        !segundo.diaSemana
                    ) {
                        toast(
                            "Selecione os dois dias da semana.",
                            "error"
                        );

                        return;
                    }


                    if (
                        normalizarDia(
                            primeiro.diaSemana
                        )
                        ===
                        normalizarDia(
                            segundo.diaSemana
                        )
                    ) {
                        toast(
                            "Os dois dias da semana precisam ser diferentes.",
                            "error"
                        );

                        return;
                    }


                    if (
                        !horarioValido(
                            primeiro.horarioInicio,
                            primeiro.horarioFim
                        )
                        ||
                        !horarioValido(
                            segundo.horarioInicio,
                            segundo.horarioFim
                        )
                    ) {
                        toast(
                            "Confira os horários. O horário final precisa ser maior que o inicial nos dois dias.",
                            "error"
                        );

                        return;
                    }


                    if (
                        !primeiro.sala ||
                        !segundo.sala
                    ) {
                        toast(
                            "Informe a sala dos dois dias.",
                            "error"
                        );

                        return;
                    }


                    const registros =
                        [
                            primeiro,
                            segundo
                        ]
                            .map(
                                dia => ({

                                    id:
                                        "",

                                    turma,

                                    diaSemana:
                                        normalizarDia(
                                            dia.diaSemana
                                        ),

                                    dataInicio,

                                    dataFim,

                                    horarioInicio:
                                        dia.horarioInicio,

                                    horarioFim:
                                        dia.horarioFim,

                                    sala:
                                        dia.sala,

                                    ativo
                                })
                            );


                    const conflitos =
                        registros.filter(
                            registro =>
                                existeConflitoSalaLocal(
                                    registro
                                )
                        );


                    if (
                        conflitos.length
                    ) {
                        toast(
                            `Já existe um horário sobreposto em ${
                                conflitos
                                    .map(
                                        registro =>
                                            capitalizar(
                                                registro.diaSemana
                                            )
                                    )
                                    .join(
                                        " e "
                                    )
                            }.`,
                            "error"
                        );

                        return;
                    }


                    if (
                        excedeDoisDiasTurmaLocal(
                            registros
                        )
                    ) {
                        toast(
                            "Essa turma já teria mais de dois dias de curso no mesmo período de vigência. Ajuste as datas ou os dias cadastrados.",
                            "error"
                        );

                        return;
                    }


                    await executarSalvamento(

                        async () => {

                            /*
                                Caminho V3.1: os dois dias são enviados
                                juntos em UMA única requisição.
                            */
                            if (
                                typeof SenacAPI.salvarSalasEmLote ===
                                "function"
                            ) {
                                return SenacAPI
                                    .salvarSalasEmLote(
                                        registros
                                    );
                            }


                            /*
                                Fallback apenas para compatibilidade com
                                uma API antiga ainda não atualizada.
                            */
                            await SenacAPI
                                .salvarSala(
                                    registros[0]
                                );

                            return SenacAPI
                                .salvarSala(
                                    registros[1]
                                );
                        },

                        "Os dois dias da turma foram cadastrados com sucesso.",

                        "salas"
                    );

                }
            );


        configurarCancelamento();
    }


    function blocoDiaSala(
        numero
    ) {
        return `
            <div
                class="form-group full"
                style="
                    border: 1px solid rgba(148, 163, 184, .25);
                    border-radius: 14px;
                    padding: 16px;
                    margin-top: 4px;
                "
            >

                <strong
                    style="
                        display: block;
                        margin-bottom: 14px;
                    "
                >
                    Dia ${numero}
                </strong>


                <div
                    style="
                        display: grid;
                        grid-template-columns:
                            repeat(
                                auto-fit,
                                minmax(180px, 1fr)
                            );
                        gap: 14px;
                    "
                >

                    <div class="form-group">

                        <label
                            for="salaDia${numero}"
                        >
                            Dia da semana
                        </label>

                        <select
                            id="salaDia${numero}"
                            required
                        >

                            <option
                                value=""
                                selected
                                disabled
                            >
                                Selecione
                            </option>

                            ${opcoesDias("")}

                        </select>

                    </div>


                    <div class="form-group">

                        <label
                            for="salaInicio${numero}"
                        >
                            Horário inicial
                        </label>

                        <input
                            id="salaInicio${numero}"
                            type="time"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label
                            for="salaFim${numero}"
                        >
                            Horário final
                        </label>

                        <input
                            id="salaFim${numero}"
                            type="time"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label
                            for="salaNumero${numero}"
                        >
                            Sala
                        </label>

                        <input
                            id="salaNumero${numero}"
                            placeholder="Ex.: 205"
                            required
                        >

                    </div>

                </div>

            </div>
        `;
    }


    function lerBlocoDiaSala(
        numero
    ) {
        return {

            diaSemana:
                valor(
                    `salaDia${numero}`
                ),

            horarioInicio:
                valor(
                    `salaInicio${numero}`
                ),

            horarioFim:
                valor(
                    `salaFim${numero}`
                ),

            sala:
                valor(
                    `salaNumero${numero}`
                )
        };
    }


    function abrirFormularioSalaEdicao(
        item
    ) {
        el.modalTitle.textContent =
            "Editar sala e horário";


        el.modalContent.innerHTML = `
            <form
                class="admin-form"
                id="salaForm"
            >

                <div class="form-group">

                    <label
                        for="salaTurma"
                    >
                        Turma
                    </label>

                    <select
                        id="salaTurma"
                        required
                    >
                        ${opcoesTurmas(
                            item.turma ||
                            ""
                        )}
                    </select>

                </div>


                <div class="form-group">

                    <label
                        for="salaDia"
                    >
                        Dia da semana
                    </label>

                    <select
                        id="salaDia"
                        required
                    >
                        ${opcoesDias(
                            item.diaSemana ||
                            ""
                        )}
                    </select>

                </div>


                <div class="form-group">

                    <label
                        for="salaDataInicio"
                    >
                        Início da vigência
                    </label>

                    <input
                        id="salaDataInicio"
                        type="date"
                        value="${escapeAttr(
                            item.dataInicio ||
                            ""
                        )}"
                        required
                    >

                </div>


                <div class="form-group">

                    <label
                        for="salaDataFim"
                    >
                        Fim da vigência
                    </label>

                    <input
                        id="salaDataFim"
                        type="date"
                        value="${escapeAttr(
                            item.dataFim ||
                            ""
                        )}"
                        required
                    >

                </div>


                <div class="form-group">

                    <label
                        for="salaInicio"
                    >
                        Horário inicial
                    </label>

                    <input
                        id="salaInicio"
                        type="time"
                        value="${escapeAttr(
                            item.horarioInicio ||
                            ""
                        )}"
                        required
                    >

                </div>


                <div class="form-group">

                    <label
                        for="salaFim"
                    >
                        Horário final
                    </label>

                    <input
                        id="salaFim"
                        type="time"
                        value="${escapeAttr(
                            item.horarioFim ||
                            ""
                        )}"
                        required
                    >

                </div>


                <div class="form-group">

                    <label
                        for="salaNumero"
                    >
                        Sala
                    </label>

                    <input
                        id="salaNumero"
                        value="${escapeAttr(
                            item.sala ||
                            ""
                        )}"
                        placeholder="Ex.: 205"
                        required
                    >

                </div>


                <div class="form-group">

                    <label
                        for="salaAtivo"
                    >
                        Status
                    </label>

                    <select
                        id="salaAtivo"
                    >

                        <option
                            value="true"
                            ${
                                item.ativo !== false
                                    ? "selected"
                                    : ""
                            }
                        >
                            Ativo
                        </option>

                        <option
                            value="false"
                            ${
                                item.ativo === false
                                    ? "selected"
                                    : ""
                            }
                        >
                            Inativo
                        </option>

                    </select>

                </div>


                <div
                    class="form-group full"
                >

                    <span
                        class="form-help"
                    >
                        Este registro representa apenas
                        um dos dois dias da turma.

                        O outro dia pode ser editado
                        separadamente na tabela.
                    </span>

                </div>


                ${formActions(
                    "Salvar alterações"
                )}

            </form>
        `;


        abrirModal();


        document
            .getElementById(
                "salaForm"
            )
            .addEventListener(
                "submit",
                async evento => {

                    evento.preventDefault();


                    const registro = {

                        id:
                            item.id,

                        turma:
                            valor(
                                "salaTurma"
                            ),

                        diaSemana:
                            normalizarDia(
                                valor(
                                    "salaDia"
                                )
                            ),

                        dataInicio:
                            valor(
                                "salaDataInicio"
                            ),

                        dataFim:
                            valor(
                                "salaDataFim"
                            ),

                        horarioInicio:
                            valor(
                                "salaInicio"
                            ),

                        horarioFim:
                            valor(
                                "salaFim"
                            ),

                        sala:
                            valor(
                                "salaNumero"
                            ),

                        ativo:
                            valor(
                                "salaAtivo"
                            )
                            ===
                            "true"
                    };


                    if (
                        !periodoValido(
                            registro.dataInicio,
                            registro.dataFim
                        )
                    ) {
                        toast(
                            "O fim da vigência não pode ser anterior ao início.",
                            "error"
                        );

                        return;
                    }


                    if (
                        !horarioValido(
                            registro.horarioInicio,
                            registro.horarioFim
                        )
                    ) {
                        toast(
                            "O horário final precisa ser maior que o horário inicial.",
                            "error"
                        );

                        return;
                    }


                    if (
                        excedeDoisDiasTurmaLocal(
                            [registro]
                        )
                    ) {
                        toast(
                            "Essa alteração faria a turma ficar com mais de dois dias de curso no mesmo período de vigência.",
                            "error"
                        );

                        return;
                    }


                    if (
                        existeConflitoSalaLocal(
                            registro
                        )
                    ) {
                        toast(
                            "Já existe um horário sobreposto para essa turma nesse dia.",
                            "error"
                        );

                        return;
                    }


                    await executarSalvamento(

                        () =>
                            SenacAPI
                                .salvarSala(
                                    registro
                                ),

                        "Sala e horário atualizados com sucesso.",

                        "salas"
                    );

                }
            );


        configurarCancelamento();
    }


    /* =====================================================
       FORMULÁRIO ALTERAÇÃO TEMPORÁRIA
       ===================================================== */

    function abrirFormularioAlteracao(
        id = ""
    ) {
        const item =
            banco.alteracoesSala.find(
                registro =>
                    registro.id === id
            );


        if (!banco.turmas.length) {
            toast(
                "Cadastre uma turma antes de criar uma alteração.",
                "error"
            );

            abrirPagina(
                "turmas"
            );

            return;
        }


        el.modalTitle.textContent =
            item
                ? "Editar alteração temporária"
                : "Nova alteração temporária";


        el.modalContent.innerHTML = `
            <form
                class="admin-form"
                id="alteracaoForm"
            >

                <div class="form-group">

                    <label
                        for="alteracaoTurma"
                    >
                        Turma
                    </label>

                    <select
                        id="alteracaoTurma"
                        required
                    >
                        ${opcoesTurmas(
                            item?.turma ||
                            ""
                        )}
                    </select>

                </div>


                <div class="form-group">

                    <label
                        for="alteracaoData"
                    >
                        Data
                    </label>

                    <input
                        id="alteracaoData"
                        type="date"
                        value="${escapeAttr(
                            item?.data ||
                            ""
                        )}"
                        required
                    >

                </div>


                <div class="form-group">

                    <label
                        for="alteracaoInicio"
                    >
                        Horário inicial
                    </label>

                    <input
                        id="alteracaoInicio"
                        type="time"
                        value="${escapeAttr(
                            item?.horarioInicio ||
                            ""
                        )}"
                        required
                    >

                </div>


                <div class="form-group">

                    <label
                        for="alteracaoFim"
                    >
                        Horário final
                    </label>

                    <input
                        id="alteracaoFim"
                        type="time"
                        value="${escapeAttr(
                            item?.horarioFim ||
                            ""
                        )}"
                        required
                    >

                </div>


                <div class="form-group">

                    <label
                        for="alteracaoNovaSala"
                    >
                        Nova sala
                    </label>

                    <input
                        id="alteracaoNovaSala"
                        value="${escapeAttr(
                            item?.salaNova ||
                            ""
                        )}"
                        placeholder="Ex.: 212"
                        required
                    >

                </div>


                <div class="form-group">

                    <label
                        for="alteracaoAtivo"
                    >
                        Status
                    </label>

                    <select
                        id="alteracaoAtivo"
                    >

                        <option
                            value="true"
                            ${
                                item?.ativo !== false
                                    ? "selected"
                                    : ""
                            }
                        >
                            Ativa
                        </option>

                        <option
                            value="false"
                            ${
                                item?.ativo === false
                                    ? "selected"
                                    : ""
                            }
                        >
                            Inativa
                        </option>

                    </select>

                </div>


                <div
                    class="form-group full"
                >

                    <label
                        for="alteracaoMotivo"
                    >
                        Motivo

                        <span
                            class="form-help"
                        >
                            (opcional)
                        </span>

                    </label>

                    <textarea
                        id="alteracaoMotivo"
                        placeholder="Ex.: manutenção na sala"
                    >${escapeHTML(
                        item?.motivo ||
                        ""
                    )}</textarea>

                </div>


                ${formActions(
                    "Salvar alteração"
                )}

            </form>
        `;


        abrirModal();


        document
            .getElementById(
                "alteracaoForm"
            )
            .addEventListener(
                "submit",
                async evento => {

                    evento.preventDefault();


                    const registro = {

                        id:
                            item?.id ||
                            "",

                        turma:
                            valor(
                                "alteracaoTurma"
                            ),

                        data:
                            valor(
                                "alteracaoData"
                            ),

                        horarioInicio:
                            valor(
                                "alteracaoInicio"
                            ),

                        horarioFim:
                            valor(
                                "alteracaoFim"
                            ),

                        salaNova:
                            valor(
                                "alteracaoNovaSala"
                            ),

                        motivo:
                            valor(
                                "alteracaoMotivo"
                            ),

                        ativo:
                            valor(
                                "alteracaoAtivo"
                            )
                            ===
                            "true"
                    };


                    if (
                        !horarioValido(
                            registro.horarioInicio,
                            registro.horarioFim
                        )
                    ) {
                        toast(
                            "O horário final precisa ser maior que o horário inicial.",
                            "error"
                        );

                        return;
                    }


                    await executarSalvamento(

                        () =>
                            SenacAPI
                                .salvarAlteracaoSala(
                                    registro
                                ),

                        "Alteração salva com sucesso.",

                        "alteracoes"
                    );

                }
            );


        configurarCancelamento();
    }


    /* =====================================================
       FORMULÁRIO NOTIFICAÇÃO
       ===================================================== */

    function abrirFormularioNotificacao(
        id = ""
    ) {
        const item =
            banco.notificacoes.find(
                registro =>
                    registro.id === id
            );


        el.modalTitle.textContent =
            item
                ? "Editar notificação"
                : "Nova notificação";


        el.modalContent.innerHTML = `
            <form
                class="admin-form"
                id="notificacaoForm"
            >

                <div
                    class="form-group full"
                >

                    <label
                        for="notificacaoTitulo"
                    >
                        Título
                    </label>

                    <input
                        id="notificacaoTitulo"
                        value="${escapeAttr(
                            item?.titulo ||
                            ""
                        )}"
                        placeholder="Ex.: Palestra no auditório"
                        maxlength="100"
                        required
                    >

                </div>


                <div class="form-group">

                    <label
                        for="notificacaoPrioridade"
                    >
                        Prioridade
                    </label>

                    <select
                        id="notificacaoPrioridade"
                    >

                        ${option(
                            "Informativo",
                            item?.prioridade
                        )}

                        ${option(
                            "Importante",
                            item?.prioridade
                        )}

                        ${option(
                            "Urgente",
                            item?.prioridade
                        )}

                    </select>

                </div>


                <div class="form-group">

                    <label
                        for="notificacaoAtivo"
                    >
                        Status
                    </label>

                    <select
                        id="notificacaoAtivo"
                    >

                        <option
                            value="true"
                            ${
                                item?.ativo !== false
                                    ? "selected"
                                    : ""
                            }
                        >
                            Ativa
                        </option>

                        <option
                            value="false"
                            ${
                                item?.ativo === false
                                    ? "selected"
                                    : ""
                            }
                        >
                            Inativa
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label
                        for="notificacaoInicio"
                    >
                        Início da exibição
                    </label>

                    <input
                        id="notificacaoInicio"
                        type="datetime-local"
                        value="${escapeAttr(
                            paraInputDataHora(
                                item?.inicio
                            )
                        )}"
                        required
                    >

                    <span
                        class="form-help"
                    >
                        Horário de Campo Grande/MS.
                    </span>

                </div>


                <div class="form-group">

                    <label
                        for="notificacaoFim"
                    >
                        Fim da exibição
                    </label>

                    <input
                        id="notificacaoFim"
                        type="datetime-local"
                        value="${escapeAttr(
                            paraInputDataHora(
                                item?.fim
                            )
                        )}"
                        required
                    >

                    <span
                        class="form-help"
                    >
                        Horário de Campo Grande/MS.
                    </span>

                </div>


                <div
                    class="form-group full"
                >

                    <label
                        for="notificacaoMensagem"
                    >
                        Mensagem
                    </label>

                    <textarea
                        id="notificacaoMensagem"
                        placeholder="Escreva o aviso que aparecerá para os alunos"
                        maxlength="500"
                        required
                    >${escapeHTML(
                        item?.mensagem ||
                        ""
                    )}</textarea>

                </div>


                ${formActions(
                    "Publicar notificação"
                )}

            </form>
        `;


        abrirModal();


        document
            .getElementById(
                "notificacaoForm"
            )
            .addEventListener(
                "submit",
                async evento => {

                    evento.preventDefault();


                    const inicio =
                        valor(
                            "notificacaoInicio"
                        );

                    const fim =
                        valor(
                            "notificacaoFim"
                        );


                    if (
                        !dataHoraLocalValida(
                            inicio,
                            fim
                        )
                    ) {
                        toast(
                            "O fim da notificação precisa ser posterior ao início.",
                            "error"
                        );

                        return;
                    }


                    const registro = {

                        id:
                            item?.id ||
                            "",

                        titulo:
                            valor(
                                "notificacaoTitulo"
                            ),

                        mensagem:
                            valor(
                                "notificacaoMensagem"
                            ),

                        prioridade:
                            valor(
                                "notificacaoPrioridade"
                            ),

                        inicio,

                        fim,

                        ativo:
                            valor(
                                "notificacaoAtivo"
                            )
                            ===
                            "true"
                    };


                    await executarSalvamento(

                        () =>
                            SenacAPI
                                .salvarNotificacao(
                                    registro
                                ),

                        "Notificação salva com sucesso.",

                        "notificacoes"
                    );

                }
            );


        configurarCancelamento();
    }


    /* =====================================================
       SALVAR
       ===================================================== */

    async function executarSalvamento(
        operacao,
        mensagem,
        pagina
    ) {
        const botao =
            el.modalContent.querySelector(
                ".form-submit"
            );

        const textoOriginal =
            botao?.textContent ||
            "Salvar";


        if (botao) {
            botao.disabled = true;
            botao.textContent =
                "Salvando...";
        }


        try {
            await operacao();


            /*
                api.js já atualizou o cache administrativo
                usando a própria resposta do servidor.

                Não fazemos outra chamada ao Google.
            */
            if (
                !sincronizarBancoDoCache()
            ) {
                await atualizarBanco();
            }


            fecharModal();

            toast(
                mensagem,
                "success"
            );

            abrirPagina(
                pagina
            );

        } catch (erro) {
            /*
                Se estivermos criando os dois dias e
                um deles salvar antes de ocorrer um erro,
                sincronizamos a tela com o servidor.
            */
            try {
                await atualizarBanco({
                    forcar: true
                });
            } catch {
                // mantém o erro original
            }


            toast(
                erro.message ||
                "Não foi possível salvar.",
                "error"
            );

        } finally {
            if (
                botao &&
                document.body.contains(
                    botao
                )
            ) {
                botao.disabled =
                    false;

                botao.textContent =
                    textoOriginal;
            }
        }
    }


    /* =====================================================
       EXCLUIR
       ===================================================== */

    async function excluirRegistro(
        tipo,
        id
    ) {
        if (!id) {
            return;
        }


        const nomes = {

            pergunta:
                "esta pergunta",

            turma:
                "esta turma",

            sala:
                "este cadastro de sala",

            alteracao:
                "esta alteração temporária",

            notificacao:
                "esta notificação"
        };


        if (
            !window.confirm(
                `Deseja realmente excluir ${
                    nomes[tipo] ||
                    "este registro"
                }?`
            )
        ) {
            return;
        }


        try {
            if (
                tipo ===
                "pergunta"
            ) {
                await SenacAPI
                    .excluirPergunta(
                        id
                    );
            }


            if (
                tipo ===
                "turma"
            ) {
                await SenacAPI
                    .excluirTurma(
                        id
                    );
            }


            if (
                tipo ===
                "sala"
            ) {
                await SenacAPI
                    .excluirSala(
                        id
                    );
            }


            if (
                tipo ===
                "alteracao"
            ) {
                await SenacAPI
                    .excluirAlteracaoSala(
                        id
                    );
            }


            if (
                tipo ===
                "notificacao"
            ) {
                await SenacAPI
                    .excluirNotificacao(
                        id
                    );
            }


            if (
                !sincronizarBancoDoCache()
            ) {
                await atualizarBanco();
            }


            toast(
                "Registro excluído com sucesso.",
                "success"
            );


            abrirPagina(
                paginaAtual
            );

        } catch (erro) {
            toast(
                erro.message ||
                "Não foi possível excluir o registro.",
                "error"
            );
        }
    }


    /* =====================================================
       SIDEBAR
       ===================================================== */

    function abrirSidebar() {
        el.adminSidebar.classList.add(
            "open"
        );

        el.adminSidebarOverlay.classList.add(
            "show"
        );
    }


    function fecharSidebar() {
        el.adminSidebar.classList.remove(
            "open"
        );

        el.adminSidebarOverlay.classList.remove(
            "show"
        );
    }


    /* =====================================================
       MODAL
       ===================================================== */

    function abrirModal() {
        ultimoFoco =
            document.activeElement;

        el.modalOverlay.classList.add(
            "show"
        );

        el.modalOverlay.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";

        setTimeout(
            () =>
                el.modalClose.focus(),
            40
        );
    }


    function fecharModal() {
        if (
            !el.modalOverlay
                .classList
                .contains(
                    "show"
                )
        ) {
            return;
        }

        el.modalOverlay.classList.remove(
            "show"
        );

        el.modalOverlay.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow =
            "";

        ultimoFoco?.focus?.();
    }


    function eventoOverlayModal(
        evento
    ) {
        if (
            evento.target ===
            el.modalOverlay
        ) {
            fecharModal();
        }
    }


    function eventoTecladoGlobal(
        evento
    ) {
        if (
            evento.key ===
            "Escape"
        ) {
            fecharModal();
            fecharSidebar();
        }
    }


    function configurarCancelamento() {
        el.modalContent
            .querySelector(
                ".form-cancel"
            )
            ?.addEventListener(
                "click",
                fecharModal
            );
    }


    /* =====================================================
       COMPONENTES
       ===================================================== */

    function estadoVazio(
        mensagem
    ) {
        return `
            <div class="empty-state">
                ${escapeHTML(
                    mensagem
                )}
            </div>
        `;
    }


    function statusBadge(
        ativo
    ) {
        return ativo !== false

            ?

            `
            <span
                class="status-badge active"
            >
                Ativo
            </span>
            `

            :

            `
            <span
                class="status-badge inactive"
            >
                Inativo
            </span>
            `;
    }


    function statusNotificacao(
        item
    ) {
        if (
            item.ativo === false
        ) {
            return `
                <span
                    class="status-badge inactive"
                >
                    Inativa
                </span>
            `;
        }


        const agora =
            Date.now();

        const inicio =
            dataMillis(
                item.inicio
            );

        const fim =
            dataMillis(
                item.fim
            );


        if (
            inicio &&
            agora < inicio
        ) {
            return `
                <span
                    class="status-badge inactive"
                >
                    Agendada
                </span>
            `;
        }


        if (
            fim &&
            agora > fim
        ) {
            return `
                <span
                    class="status-badge inactive"
                >
                    Encerrada
                </span>
            `;
        }


        return `
            <span
                class="status-badge active"
            >
                Ativa
            </span>
        `;
    }


    function priorityBadge(
        prioridade
    ) {
        const classe =
            normalizar(
                prioridade ||
                "Informativo"
            )
                .replaceAll(
                    " ",
                    "-"
                );

        return `
            <span
                class="priority-badge ${escapeAttr(
                    classe
                )}"
            >
                ${escapeHTML(
                    prioridade ||
                    "Informativo"
                )}
            </span>
        `;
    }


    function acoesTabela(
        tipo,
        id
    ) {
        return `
            <div class="table-actions">

                <button
                    class="edit-button"
                    type="button"
                    data-edit="${escapeAttr(
                        tipo
                    )}"
                    data-id="${escapeAttr(
                        id
                    )}"
                >
                    Editar
                </button>


                <button
                    class="delete-button"
                    type="button"
                    data-delete="${escapeAttr(
                        tipo
                    )}"
                    data-id="${escapeAttr(
                        id
                    )}"
                >
                    Excluir
                </button>

            </div>
        `;
    }


    function formActions(
        texto
    ) {
        return `
            <div class="form-actions">

                <button
                    class="form-cancel"
                    type="button"
                >
                    Cancelar
                </button>


                <button
                    class="form-submit"
                    type="submit"
                >
                    ${escapeHTML(
                        texto
                    )}
                </button>

            </div>
        `;
    }


    /* =====================================================
       OPÇÕES
       ===================================================== */

    function opcoesTurmas(
        selecionado = ""
    ) {
        const lista =
            banco.turmas
                .filter(
                    item =>
                        item.ativo !== false
                        ||
                        item.turma === selecionado
                )
                .sort(
                    (a, b) =>
                        String(
                            a.turma ||
                            ""
                        )
                            .localeCompare(
                                String(
                                    b.turma ||
                                    ""
                                ),
                                "pt-BR",
                                {
                                    numeric: true
                                }
                            )
                );


        return `
            <option
                value=""
                ${
                    selecionado
                        ? ""
                        : "selected"
                }
                disabled
            >
                Selecione a turma
            </option>


            ${
                lista
                    .map(
                        item => `
                        <option
                            value="${escapeAttr(
                                item.turma
                            )}"
                            ${
                                item.turma ===
                                selecionado
                                    ?
                                    "selected"
                                    :
                                    ""
                            }
                        >
                            ${escapeHTML(
                                item.turma
                            )}
                        </option>
                    `
                    )
                    .join("")
            }
        `;
    }


    function opcoesDias(
        selecionado = ""
    ) {
        const dias = [
            "segunda-feira",
            "terça-feira",
            "quarta-feira",
            "quinta-feira",
            "sexta-feira",
            "sábado",
            "domingo"
        ];


        return dias
            .map(
                dia => `
                <option
                    value="${escapeAttr(
                        dia
                    )}"
                    ${
                        normalizarDia(
                            dia
                        )
                        ===
                        normalizarDia(
                            selecionado
                        )
                            ?
                            "selected"
                            :
                            ""
                    }
                >
                    ${escapeHTML(
                        capitalizar(
                            dia
                        )
                    )}
                </option>
            `
            )
            .join("");
    }


    function option(
        valorOption,
        selecionado
    ) {
        return `
            <option
                value="${escapeAttr(
                    valorOption
                )}"
                ${
                    valorOption ===
                    selecionado
                        ?
                        "selected"
                        :
                        ""
                }
            >
                ${escapeHTML(
                    valorOption
                )}
            </option>
        `;
    }


    /* =====================================================
       CONFLITOS DE SALA
       ===================================================== */

    function existeConflitoSalaLocal(
        novo
    ) {
        if (
            novo.ativo === false
        ) {
            return false;
        }


        return banco.salas
            .some(
                item => {

                    if (
                        item.id === novo.id
                        ||
                        item.ativo === false
                    ) {
                        return false;
                    }


                    if (
                        normalizar(
                            item.turma
                        )
                        !==
                        normalizar(
                            novo.turma
                        )
                    ) {
                        return false;
                    }


                    if (
                        normalizarDia(
                            item.diaSemana
                        )
                        !==
                        normalizarDia(
                            novo.diaSemana
                        )
                    ) {
                        return false;
                    }


                    return (
                        periodosDatasSobrepoemLocal(
                            item.dataInicio,
                            item.dataFim,
                            novo.dataInicio,
                            novo.dataFim
                        )

                        &&

                        periodosHorasSobrepoemLocal(
                            item.horarioInicio,
                            item.horarioFim,
                            novo.horarioInicio,
                            novo.horarioFim
                        )
                    );
                }
            );
    }


    /*
        Garante a regra de negócio informada para o HUBI:
        uma turma pode ter no máximo dois dias de curso por
        semana em qualquer período de vigência ativo.
    */
    function excedeDoisDiasTurmaLocal(
        novosRegistros
    ) {
        const novos =
            Array.isArray(
                novosRegistros
            )
                ?
                novosRegistros.filter(
                    item =>
                        item
                        &&
                        item.ativo !== false
                )
                :
                [];


        if (
            !novos.length
        ) {
            return false;
        }


        const idsEditados =
            new Set(
                novos
                    .map(
                        item =>
                            item.id
                    )
                    .filter(
                        Boolean
                    )
            );


        const turmasAlvo =
            new Set(
                novos.map(
                    item =>
                        normalizar(
                            item.turma
                        )
                )
            );


        const todos = [
            ...banco.salas.filter(
                item =>
                    item.ativo !== false
                    &&
                    !idsEditados.has(
                        item.id
                    )
                    &&
                    turmasAlvo.has(
                        normalizar(
                            item.turma
                        )
                    )
            ),
            ...novos
        ];


        for (
            const turma
            of turmasAlvo
        ) {
            const registrosTurma =
                todos.filter(
                    item =>
                        normalizar(
                            item.turma
                        )
                        ===
                        turma
                );


            const pontos =
                new Set();


            registrosTurma.forEach(
                item => {
                    if (
                        item.dataInicio
                    ) {
                        pontos.add(
                            item.dataInicio
                        );
                    }


                    if (
                        item.dataFim
                    ) {
                        pontos.add(
                            item.dataFim
                        );

                        const seguinte =
                            adicionarDiasISOAdmin(
                                item.dataFim,
                                1
                            );

                        if (
                            seguinte
                        ) {
                            pontos.add(
                                seguinte
                            );
                        }
                    }
                }
            );


            if (
                !pontos.size
            ) {
                pontos.add(
                    formatarDataISO(
                        new Date()
                    )
                );
            }


            for (
                const data
                of [...pontos].sort()
            ) {
                const dias =
                    new Set(
                        registrosTurma
                            .filter(
                                item =>
                                    periodoContemDataLocal(
                                        item.dataInicio,
                                        item.dataFim,
                                        data
                                    )
                            )
                            .map(
                                item =>
                                    normalizarDia(
                                        item.diaSemana
                                    )
                            )
                            .filter(
                                Boolean
                            )
                    );


                if (
                    dias.size > 2
                ) {
                    return true;
                }
            }
        }


        return false;
    }


    function periodoContemDataLocal(
        inicio,
        fim,
        data
    ) {
        const limiteInicio =
            inicio ||
            "0000-01-01";

        const limiteFim =
            fim ||
            "9999-12-31";


        return (
            limiteInicio <= data
            &&
            data <= limiteFim
        );
    }


    function adicionarDiasISOAdmin(
        dataISO,
        quantidade
    ) {
        const match =
            String(
                dataISO ||
                ""
            )
                .match(
                    /^(\d{4})-(\d{2})-(\d{2})$/
                );


        if (
            !match
        ) {
            return "";
        }


        const data =
            new Date(
                Date.UTC(
                    Number(match[1]),
                    Number(match[2]) - 1,
                    Number(match[3]) + Number(quantidade || 0),
                    12
                )
            );


        return (
            `${data.getUTCFullYear()}-`
            +
            `${String(data.getUTCMonth() + 1).padStart(2, "0")}-`
            +
            `${String(data.getUTCDate()).padStart(2, "0")}`
        );
    }


    function periodosDatasSobrepoemLocal(
        inicioA,
        fimA,
        inicioB,
        fimB
    ) {
        const aInicio =
            inicioA ||
            "0000-01-01";

        const aFim =
            fimA ||
            "9999-12-31";

        const bInicio =
            inicioB ||
            "0000-01-01";

        const bFim =
            fimB ||
            "9999-12-31";


        return (
            aInicio <= bFim
            &&
            bInicio <= aFim
        );
    }


    function periodosHorasSobrepoemLocal(
        inicioA,
        fimA,
        inicioB,
        fimB
    ) {
        const aInicio =
            minutos(
                inicioA
            );

        const aFim =
            minutos(
                fimA
            );

        const bInicio =
            minutos(
                inicioB
            );

        const bFim =
            minutos(
                fimB
            );


        if (
            [
                aInicio,
                aFim,
                bInicio,
                bFim
            ]
                .some(
                    valor =>
                        valor < 0
                )
        ) {
            return false;
        }


        return (
            aInicio < bFim
            &&
            bInicio < aFim
        );
    }


    /* =====================================================
       DADOS / DATAS / HORÁRIOS
       ===================================================== */

    function obterAlteracoesHoje() {
        const hoje =
            formatarDataISO(
                new Date()
            );

        return banco.alteracoesSala
            .filter(
                item =>
                    item.ativo !== false
                    &&
                    item.data === hoje
            );
    }


    function obterNotificacoesAtivas() {
        const agora =
            Date.now();


        return banco.notificacoes
            .filter(
                item => {

                    if (
                        item.ativo === false
                    ) {
                        return false;
                    }


                    const inicio =
                        dataMillis(
                            item.inicio
                        );

                    const fim =
                        dataMillis(
                            item.fim
                        );


                    if (
                        inicio
                        &&
                        agora < inicio
                    ) {
                        return false;
                    }


                    if (
                        fim
                        &&
                        agora > fim
                    ) {
                        return false;
                    }


                    return true;
                }
            );
    }


    function ordenarSalas(
        a,
        b
    ) {
        const turma =
            String(
                a.turma ||
                ""
            )
                .localeCompare(
                    String(
                        b.turma ||
                        ""
                    ),
                    "pt-BR",
                    {
                        numeric: true
                    }
                );


        if (
            turma !== 0
        ) {
            return turma;
        }


        const data =
            String(
                a.dataInicio ||
                ""
            )
                .localeCompare(
                    String(
                        b.dataInicio ||
                        ""
                    )
                );


        if (
            data !== 0
        ) {
            return data;
        }


        const ordem = [
            "segunda-feira",
            "terça-feira",
            "quarta-feira",
            "quinta-feira",
            "sexta-feira",
            "sábado",
            "domingo"
        ];


        const diaA =
            ordem.indexOf(
                normalizarDia(
                    a.diaSemana
                )
            );

        const diaB =
            ordem.indexOf(
                normalizarDia(
                    b.diaSemana
                )
            );


        if (
            diaA !== diaB
        ) {
            return diaA - diaB;
        }


        return String(
            a.horarioInicio ||
            ""
        )
            .localeCompare(
                String(
                    b.horarioInicio ||
                    ""
                )
            );
    }


    function normalizarDia(
        valorDia
    ) {
        const n =
            normalizar(
                valorDia
            );


        const mapa = {

            segunda:
                "segunda-feira",

            "segunda feira":
                "segunda-feira",

            "segunda-feira":
                "segunda-feira",


            terca:
                "terça-feira",

            "terca feira":
                "terça-feira",

            "terca-feira":
                "terça-feira",


            quarta:
                "quarta-feira",

            "quarta feira":
                "quarta-feira",

            "quarta-feira":
                "quarta-feira",


            quinta:
                "quinta-feira",

            "quinta feira":
                "quinta-feira",

            "quinta-feira":
                "quinta-feira",


            sexta:
                "sexta-feira",

            "sexta feira":
                "sexta-feira",

            "sexta-feira":
                "sexta-feira",


            sabado:
                "sábado",


            domingo:
                "domingo"
        };


        return (
            mapa[n]

            ||

            String(
                valorDia ||
                ""
            )
                .toLowerCase()
        );
    }


    function horarioValido(
        inicio,
        fim
    ) {
        return (
            minutos(
                fim
            )
            >
            minutos(
                inicio
            )
        );
    }


    function minutos(
        hora
    ) {
        const match =
            String(
                hora ||
                ""
            )
                .match(
                    /^(\d{1,2}):(\d{2})$/
                );


        if (!match) {
            return -1;
        }


        const h =
            Number(
                match[1]
            );

        const m =
            Number(
                match[2]
            );


        if (
            h < 0
            ||
            h > 23
            ||
            m < 0
            ||
            m > 59
        ) {
            return -1;
        }


        return (
            h * 60
            +
            m
        );
    }


    function periodoValido(
        inicio,
        fim
    ) {
        if (
            !inicio
            ||
            !fim
        ) {
            return false;
        }


        return (
            String(
                fim
            )
            >=
            String(
                inicio
            )
        );
    }


    function dataHoraLocalValida(
        inicio,
        fim
    ) {
        if (
            !inicio
            ||
            !fim
        ) {
            return false;
        }


        /*
            datetime-local usa:
            yyyy-MM-ddTHH:mm

            Comparar como texto mantém exatamente
            o horário digitado e não depende do
            fuso do computador do administrador.

            O Apps Script depois interpreta esse
            horário como America/Campo_Grande.
        */
        return (
            String(
                fim
            )
            >
            String(
                inicio
            )
        );
    }


    function formatarPeriodoDatas(
        inicio,
        fim
    ) {
        if (
            !inicio
            &&
            !fim
        ) {
            return "Sem período";
        }


        if (
            inicio
            &&
            fim
        ) {
            return (
                `${formatarData(
                    inicio
                )} até ${formatarData(
                    fim
                )}`
            );
        }


        if (inicio) {
            return (
                `A partir de ${
                    formatarData(
                        inicio
                    )
                }`
            );
        }


        return (
            `Até ${
                formatarData(
                    fim
                )
            }`
        );
    }


    function formatarIntervalo(
        inicio,
        fim
    ) {
        if (
            inicio
            &&
            fim
        ) {
            return (
                `${inicio} às ${fim}`
            );
        }


        if (inicio) {
            return (
                `a partir de ${inicio}`
            );
        }


        if (fim) {
            return (
                `até ${fim}`
            );
        }


        return (
            "Horário não informado"
        );
    }


    function formatarData(
        data
    ) {
        if (!data) {
            return "—";
        }


        const match =
            String(
                data
            )
                .match(
                    /^(\d{4})-(\d{2})-(\d{2})$/
                );


        if (match) {
            return (
                `${match[3]}/${match[2]}/${match[1]}`
            );
        }


        return String(
            data
        );
    }


    function dataMillis(
        valorData
    ) {
        if (!valorData) {
            return 0;
        }


        const data =
            new Date(
                valorData
            );


        return Number.isNaN(
            data.getTime()
        )
            ?
            0
            :
            data.getTime();
    }


    function formatarDataHora(
        valorData
    ) {
        if (!valorData) {
            return "—";
        }


        const data =
            new Date(
                valorData
            );


        if (
            Number.isNaN(
                data.getTime()
            )
        ) {
            return String(
                valorData
            );
        }


        return data.toLocaleString(
            "pt-BR",
            {
                timeZone:
                    FUSO_HUBI,

                day:
                    "2-digit",

                month:
                    "2-digit",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hour12:
                    false
            }
        );
    }


    function paraInputDataHora(
        valorData
    ) {
        if (!valorData) {
            return "";
        }


        const bruto =
            String(
                valorData
            );


        /*
            Se o valor já veio como datetime-local
            sem timezone, não faz nenhuma conversão.
        */
        if (
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
                .test(
                    bruto
                )
        ) {
            return bruto;
        }


        const data =
            new Date(
                valorData
            );


        if (
            Number.isNaN(
                data.getTime()
            )
        ) {
            return bruto.slice(
                0,
                16
            );
        }


        const partes =
            partesDataHoraNoFuso(
                data
            );


        return (
            `${partes.ano}-${partes.mes}-${partes.dia}`
            +
            `T${partes.hora}:${partes.minuto}`
        );
    }


    function formatarDataISO(
        data
    ) {
        const partes =
            partesDataHoraNoFuso(
                data
            );


        return (
            `${partes.ano}-${partes.mes}-${partes.dia}`
        );
    }


    function partesDataHoraNoFuso(
        valorData
    ) {
        const data =
            valorData instanceof Date

                ?

                valorData

                :

                new Date(
                    valorData
                );


        const formatador =
            new Intl.DateTimeFormat(
                "pt-BR",
                {
                    timeZone:
                        FUSO_HUBI,

                    year:
                        "numeric",

                    month:
                        "2-digit",

                    day:
                        "2-digit",

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    hour12:
                        false
                }
            );


        const mapa = {};


        formatador
            .formatToParts(
                data
            )
            .forEach(
                parte => {

                    if (
                        parte.type !==
                        "literal"
                    ) {
                        mapa[
                            parte.type
                        ] =
                            parte.value;
                    }
                }
            );


        let hora =
            mapa.hour ||
            "00";


        /*
            Em alguns navegadores meia-noite
            pode aparecer como 24.
        */
        if (
            hora ===
            "24"
        ) {
            hora =
                "00";
        }


        return {

            ano:
                mapa.year,

            mes:
                mapa.month,

            dia:
                mapa.day,

            hora,

            minuto:
                mapa.minute
        };
    }


    /* =====================================================
       UTILITÁRIOS
       ===================================================== */

    function valor(
        id
    ) {
        const elemento =
            document.getElementById(
                id
            );


        if (!elemento) {
            return "";
        }


        return String(
            elemento.value ??
            ""
        )
            .trim();
    }


    function capitalizar(
        texto
    ) {
        const valorTexto =
            String(
                texto ||
                ""
            );


        return valorTexto

            ?

            (
                valorTexto
                    .charAt(0)
                    .toUpperCase()

                +

                valorTexto
                    .slice(1)
            )

            :

            "";
    }


    function normalizar(
        texto
    ) {
        return String(
            texto ||
            ""
        )

            .toLowerCase()

            .normalize(
                "NFD"
            )

            .replace(
                /[\u0300-\u036f]/g,
                ""
            )

            /*
                Mantemos ponto e hífen.

                Assim turmas como:
                2026.1.6
                continuam funcionando.
            */
            .replace(
                /[^\p{L}\p{N}\s.-]/gu,
                " "
            )

            .replace(
                /\s+/g,
                " "
            )

            .trim();
    }


    function escapeHTML(
        texto
    ) {
        const div =
            document.createElement(
                "div"
            );

        div.textContent =
            String(
                texto ??
                ""
            );

        return div.innerHTML;
    }


    function escapeAttr(
        texto
    ) {
        return String(
            texto ??
            ""
        )

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            );
    }


    function toast(
        mensagem,
        tipo = ""
    ) {
        const elemento =
            document.createElement(
                "div"
            );

        elemento.className =
            `toast ${tipo}`
                .trim();

        elemento.textContent =
            mensagem;

        el.toastContainer.appendChild(
            elemento
        );


        setTimeout(
            () => {

                elemento.style.opacity =
                    "0";

                elemento.style.transform =
                    "translateY(6px)";


                setTimeout(
                    () =>
                        elemento.remove(),
                    220
                );

            },
            3000
        );
    }


    return {
        iniciar
    };

})();


document.addEventListener(
    "DOMContentLoaded",
    HubiAdmin.iniciar
);