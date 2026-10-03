/* =========================================================
   HUBI - NOTIFICAÇÕES
   Versão V3
   ========================================================= */

const NotificationManager = (() => {
    const READ_STORAGE_KEY = "hubi_read_notifications";
    const CLOSED_SESSION_KEY = "hubi_closed_notifications";

    const FUSO_HUBI = "America/Campo_Grande";

    /*
        Revalidação local frequente:
        - não consulta o Google;
        - apenas confere início/fim das notificações já carregadas.
    */
    const INTERVALO_REVALIDACAO = 30000;

    /*
        Consulta leve para descobrir avisos criados depois
        que o aluno já abriu o site.
    */
    const INTERVALO_SINCRONIZACAO = 60000;

    /*
        Evita uma segunda leitura imediatamente após
        o carregamento inicial da página em navegadores
        que disparam eventos de foco/visibilidade cedo.
    */
    const INTERVALO_MINIMO_SINCRONIZACAO = 15000;

    let fonteNotificacoes = [];
    let notificacoes = [];
    let indiceAtual = 0;
    let touchStartX = null;

    let timerRevalidacao = null;
    let timerSincronizacao = null;
    let timerProximaMudanca = null;
    let sincronizando = false;
    let ultimaSincronizacao = 0;
    let configurado = false;

    const area =
        document.getElementById(
            "notificationArea"
        );

    const card =
        document.getElementById(
            "notificationCard"
        );

    const titulo =
        document.getElementById(
            "notificationTitle"
        );

    const mensagem =
        document.getElementById(
            "notificationMessage"
        );

    const prioridade =
        document.getElementById(
            "notificationPriority"
        );

    const contador =
        document.getElementById(
            "notificationCounter"
        );

    const badge =
        document.getElementById(
            "notificationBadge"
        );

    const mobileBadge =
        document.getElementById(
            "mobileNotificationBadge"
        );

    const anteriorButton =
        document.getElementById(
            "previousNotification"
        );

    const proximaButton =
        document.getElementById(
            "nextNotification"
        );

    const fecharButton =
        document.getElementById(
            "closeNotification"
        );


    /* =====================================================
       STORAGE
       ===================================================== */

    function obterSetStorage(
        storage,
        chave
    ) {
        try {
            const dados =
                JSON.parse(
                    storage.getItem(
                        chave
                    )
                    ||
                    "[]"
                );

            return new Set(
                Array.isArray(
                    dados
                )
                    ?
                    dados.map(
                        String
                    )
                    :
                    []
            );

        } catch {
            return new Set();
        }
    }


    function salvarSetStorage(
        storage,
        chave,
        set
    ) {
        try {
            storage.setItem(
                chave,
                JSON.stringify(
                    [...set]
                )
            );

        } catch (erro) {
            console.warn(
                `Não foi possível salvar ${chave}.`,
                erro
            );
        }
    }


    function obterLidas() {
        return obterSetStorage(
            localStorage,
            READ_STORAGE_KEY
        );
    }


    function salvarLidas(
        set
    ) {
        salvarSetStorage(
            localStorage,
            READ_STORAGE_KEY,
            set
        );
    }


    function obterFechadas() {
        return obterSetStorage(
            sessionStorage,
            CLOSED_SESSION_KEY
        );
    }


    function salvarFechadas(
        set
    ) {
        salvarSetStorage(
            sessionStorage,
            CLOSED_SESSION_KEY,
            set
        );
    }


    function marcarComoLida(
        id
    ) {
        if (!id) {
            return;
        }

        const lidas =
            obterLidas();

        lidas.add(
            String(id)
        );

        salvarLidas(
            lidas
        );
    }


    function marcarTodasComoLidas() {
        const lidas =
            obterLidas();

        notificacoes.forEach(
            item => {

                if (item.id) {
                    lidas.add(
                        String(
                            item.id
                        )
                    );
                }

            }
        );

        salvarLidas(
            lidas
        );
    }


    function isLida(
        id
    ) {
        if (!id) {
            return false;
        }

        return obterLidas()
            .has(
                String(id)
            );
    }


    /* =====================================================
       DATA / HORA
       ===================================================== */

    function parseDate(
        valor
    ) {
        if (!valor) {
            return null;
        }


        if (
            valor instanceof Date
        ) {
            return Number.isNaN(
                valor.getTime()
            )
                ?
                null
                :
                new Date(
                    valor.getTime()
                );
        }


        const bruto =
            String(
                valor
            )
                .trim();


        if (!bruto) {
            return null;
        }


        /*
            Se o Apps Script devolveu:

            2026-09-30T15:30:00-04:00

            ou:

            ...Z

            o instante já está completo.
        */
        if (
            /Z$/i.test(
                bruto
            )
            ||
            /[+-]\d{2}:?\d{2}$/
                .test(
                    bruto
                )
        ) {
            const data =
                new Date(
                    bruto
                );

            return Number.isNaN(
                data.getTime()
            )
                ?
                null
                :
                data;
        }


        /*
            Caso algum dado antigo esteja assim:

            2026-09-30T15:30

            sem timezone, ele NÃO será interpretado
            no fuso do computador do aluno.

            Será tratado como Campo Grande.
        */
        const match =
            bruto.match(
                /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/
            );


        if (match) {
            return dataCampoGrandeParaDate({

                ano:
                    Number(
                        match[1]
                    ),

                mes:
                    Number(
                        match[2]
                    ),

                dia:
                    Number(
                        match[3]
                    ),

                hora:
                    Number(
                        match[4]
                    ),

                minuto:
                    Number(
                        match[5]
                    ),

                segundo:
                    Number(
                        match[6]
                        ||
                        0
                    )

            });
        }


        const data =
            new Date(
                bruto
            );


        return Number.isNaN(
            data.getTime()
        )
            ?
            null
            :
            data;
    }


    function dataCampoGrandeParaDate(
        partes
    ) {
        const baseUTC =
            Date.UTC(
                partes.ano,
                partes.mes - 1,
                partes.dia,
                partes.hora,
                partes.minuto,
                partes.segundo || 0
            );


        let instante =
            baseUTC;


        /*
            Duas passagens permitem obter
            corretamente o offset do fuso.
        */
        for (
            let i = 0;
            i < 2;
            i++
        ) {
            const offset =
                obterOffsetFuso(
                    new Date(
                        instante
                    )
                );

            instante =
                baseUTC
                -
                offset;
        }


        const data =
            new Date(
                instante
            );


        return Number.isNaN(
            data.getTime()
        )
            ?
            null
            :
            data;
    }


    function obterOffsetFuso(
        data
    ) {
        const formatador =
            new Intl.DateTimeFormat(
                "en-CA",
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

                    second:
                        "2-digit",

                    hourCycle:
                        "h23"
                }
            );


        const partes = {};


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
                        partes[
                            parte.type
                        ] =
                            parte.value;
                    }

                }
            );


        const representacaoUTC =
            Date.UTC(

                Number(
                    partes.year
                ),

                Number(
                    partes.month
                )
                -
                1,

                Number(
                    partes.day
                ),

                Number(
                    partes.hour
                ),

                Number(
                    partes.minute
                ),

                Number(
                    partes.second
                )

            );


        return (
            representacaoUTC
            -
            data.getTime()
        );
    }


    /* =====================================================
       REGRAS DE EXIBIÇÃO
       ===================================================== */

    function estaAtiva(
        item,
        agoraMs = Date.now()
    ) {
        if (
            !item
            ||
            item.ativo === false
        ) {
            return false;
        }


        const inicio =
            parseDate(
                item.inicio
            );

        const fim =
            parseDate(
                item.fim
            );


        if (
            inicio
            &&
            agoraMs <
            inicio.getTime()
        ) {
            return false;
        }


        /*
            No instante exato do horário final
            o aviso já deixa de existir.
        */
        if (
            fim
            &&
            agoraMs >=
            fim.getTime()
        ) {
            return false;
        }


        return true;
    }


    function ordenar(
        a,
        b
    ) {
        const pesos = {

            urgente:
                3,

            importante:
                2,

            informativo:
                1

        };


        const pesoA =
            pesos[
                String(
                    a.prioridade ||
                    ""
                )
                    .toLowerCase()
            ]
            ||
            0;


        const pesoB =
            pesos[
                String(
                    b.prioridade ||
                    ""
                )
                    .toLowerCase()
            ]
            ||
            0;


        if (
            pesoA !==
            pesoB
        ) {
            return (
                pesoB
                -
                pesoA
            );
        }


        const inicioA =
            parseDate(
                a.inicio
            )
                ?.getTime()
            ||
            0;


        const inicioB =
            parseDate(
                b.inicio
            )
                ?.getTime()
            ||
            0;


        return (
            inicioB
            -
            inicioA
        );
    }


    /* =====================================================
       CONFIGURAÇÃO
       ===================================================== */

    function configurar(
        lista
    ) {
        /*
            IMPORTANTE:

            Aqui guardamos também as notificações
            FUTURAS.

            Não filtramos definitivamente agora.
        */
        fonteNotificacoes =
            Array.isArray(
                lista
            )
                ?
                lista.filter(
                    Boolean
                )
                :
                [];


        /*
            Os dados acabaram de chegar pelo carregamento
            inicial do chat; não precisamos buscá-los de novo.
        */
        ultimaSincronizacao =
            Date.now();

        configurado =
            true;


        recalcularNotificacoes();

        garantirTimers();
    }


    function recalcularNotificacoes() {
        const idAnterior =
            notificacoes[
                indiceAtual
            ]
                ?.id

                ?

                String(
                    notificacoes[
                        indiceAtual
                    ].id
                )

                :

                null;


        const agora =
            Date.now();


        notificacoes =
            fonteNotificacoes

                .filter(
                    item =>
                        estaAtiva(
                            item,
                            agora
                        )
                )

                .sort(
                    ordenar
                );


        /*
            Tenta manter o aviso que já
            estava sendo visualizado.
        */
        if (idAnterior) {
            const novoIndice =
                notificacoes
                    .findIndex(
                        item =>
                            String(
                                item.id
                            )
                            ===
                            idAnterior
                    );


            indiceAtual =
                novoIndice >= 0
                    ?
                    novoIndice
                    :
                    0;

        } else {
            indiceAtual =
                0;
        }


        if (
            indiceAtual >=
            notificacoes.length
        ) {
            indiceAtual =
                0;
        }


        limparFechadasExpiradas();

        atualizarBadge();

        renderizarAutomaticamente();

        agendarProximaMudanca();
    }


    function limparFechadasExpiradas() {
        const fechadas =
            obterFechadas();


        const idsAtivos =
            new Set(

                notificacoes

                    .filter(
                        item =>
                            item.id
                    )

                    .map(
                        item =>
                            String(
                                item.id
                            )
                    )

            );


        const novoSet =
            new Set(

                [...fechadas]
                    .filter(
                        id =>
                            idsAtivos.has(
                                id
                            )
                    )

            );


        salvarFechadas(
            novoSet
        );
    }


    function encontrarPrimeiraNaoFechada() {
        const fechadas =
            obterFechadas();


        return notificacoes
            .findIndex(
                item =>
                    !item.id
                    ||
                    !fechadas.has(
                        String(
                            item.id
                        )
                    )
            );
    }


    /* =====================================================
       BADGE
       ===================================================== */

    function atualizarBadge() {
        const quantidade =
            notificacoes.length;


        const display =
            quantidade > 0
                ?
                "flex"
                :
                "none";


        if (badge) {
            badge.textContent =
                quantidade;

            badge.style.display =
                display;

            badge.setAttribute(
                "aria-label",

                `${quantidade} aviso${
                    quantidade === 1
                        ? ""
                        : "s"
                }`
            );
        }


        if (mobileBadge) {
            mobileBadge.textContent =
                quantidade;

            mobileBadge.style.display =
                display;

            mobileBadge.setAttribute(
                "aria-label",

                `${quantidade} aviso${
                    quantidade === 1
                        ? ""
                        : "s"
                }`
            );
        }
    }


    /* =====================================================
       RENDERIZAÇÃO
       ===================================================== */

    function renderizarAutomaticamente() {
        if (!area) {
            return;
        }


        if (
            notificacoes.length === 0
        ) {
            area.classList.add(
                "hidden"
            );

            return;
        }


        const indiceNaoFechado =
            encontrarPrimeiraNaoFechada();


        /*
            O usuário já fechou todos os avisos
            atualmente ativos.
        */
        if (
            indiceNaoFechado < 0
        ) {
            area.classList.add(
                "hidden"
            );

            return;
        }


        const atual =
            notificacoes[
                indiceAtual
            ];


        const fechadas =
            obterFechadas();


        if (
            !atual
            ||
            (
                atual.id
                &&
                fechadas.has(
                    String(
                        atual.id
                    )
                )
            )
        ) {
            indiceAtual =
                indiceNaoFechado;
        }


        renderizar();
    }


    function renderizar() {
        if (
            !area
            ||
            !titulo
            ||
            !mensagem
            ||
            !prioridade
            ||
            !contador
            ||
            !anteriorButton
            ||
            !proximaButton
        ) {
            return;
        }


        if (
            notificacoes.length === 0
        ) {
            area.classList.add(
                "hidden"
            );

            return;
        }


        if (
            indiceAtual < 0
            ||
            indiceAtual >=
            notificacoes.length
        ) {
            indiceAtual =
                0;
        }


        const item =
            notificacoes[
                indiceAtual
            ];


        titulo.textContent =
            item.titulo
            ||
            "Aviso";


        mensagem.textContent =
            item.mensagem
            ||
            "";


        prioridade.textContent =
            item.prioridade
            ||
            "Informativo";


        prioridade.dataset.prioridade =
            String(
                item.prioridade
                ||
                "Informativo"
            )
                .toLowerCase();


        contador.textContent =
            notificacoes.length > 1

                ?

                `${indiceAtual + 1} de ${
                    notificacoes.length
                }`

                :

                "";


        anteriorButton.disabled =
            notificacoes.length <= 1;


        proximaButton.disabled =
            notificacoes.length <= 1;


        area.classList.remove(
            "hidden"
        );


        marcarComoLida(
            item.id
        );
    }


    /* =====================================================
       NAVEGAÇÃO
       ===================================================== */

    function proxima() {
        if (
            notificacoes.length <= 1
        ) {
            return;
        }


        indiceAtual =
            (
                indiceAtual
                +
                1
            )
            %
            notificacoes.length;


        renderizar();
    }


    function anterior() {
        if (
            notificacoes.length <= 1
        ) {
            return;
        }


        indiceAtual =
            (
                indiceAtual
                -
                1
                +
                notificacoes.length
            )
            %
            notificacoes.length;


        renderizar();
    }


    /* =====================================================
       FECHAR / ABRIR
       ===================================================== */

    function fecharBanner() {
        if (!area) {
            return;
        }


        const fechadas =
            obterFechadas();


        /*
            Marca somente os avisos ativos agora
            como fechados.

            Uma notificação que começar mais tarde
            NÃO estará aqui e aparecerá normalmente.
        */
        notificacoes.forEach(
            item => {

                if (item.id) {
                    fechadas.add(
                        String(
                            item.id
                        )
                    );
                }

            }
        );


        salvarFechadas(
            fechadas
        );


        area.classList.add(
            "hidden"
        );
    }


    function abrirBanner() {
        if (
            notificacoes.length === 0
            ||
            !area
        ) {
            return;
        }


        const fechadas =
            obterFechadas();


        notificacoes.forEach(
            item => {

                if (item.id) {
                    fechadas.delete(
                        String(
                            item.id
                        )
                    );
                }

            }
        );


        salvarFechadas(
            fechadas
        );


        indiceAtual =
            0;


        renderizar();
    }


    function obterNotificacoes() {
        return notificacoes
            .map(
                item => ({

                    ...item,

                    lida:
                        isLida(
                            item.id
                        )

                })
            );
    }


    /* =====================================================
       TIMERS
       ===================================================== */

    function garantirTimers() {
        if (
            !timerRevalidacao
        ) {
            timerRevalidacao =
                setInterval(
                    recalcularNotificacoes,
                    INTERVALO_REVALIDACAO
                );
        }


        if (
            !timerSincronizacao
        ) {
            timerSincronizacao =
                setInterval(
                    sincronizarComServidor,
                    INTERVALO_SINCRONIZACAO
                );
        }
    }


    function agendarProximaMudanca() {
        if (
            timerProximaMudanca
        ) {
            clearTimeout(
                timerProximaMudanca
            );

            timerProximaMudanca =
                null;
        }


        const agora =
            Date.now();


        const momentos =
            [];


        fonteNotificacoes
            .forEach(
                item => {

                    if (
                        !item
                        ||
                        item.ativo === false
                    ) {
                        return;
                    }


                    const inicio =
                        parseDate(
                            item.inicio
                        );


                    const fim =
                        parseDate(
                            item.fim
                        );


                    if (
                        inicio
                        &&
                        inicio.getTime() >
                        agora
                    ) {
                        momentos.push(
                            inicio.getTime()
                        );
                    }


                    if (
                        fim
                        &&
                        fim.getTime() >
                        agora
                    ) {
                        momentos.push(
                            fim.getTime()
                        );
                    }

                }
            );


        if (
            !momentos.length
        ) {
            return;
        }


        const proximo =
            Math.min(
                ...momentos
            );


        /*
            + 50 ms para garantir que já
            atravessamos o limite da data.
        */
        const espera =
            Math.max(
                0,
                proximo
                -
                agora
                +
                50
            );


        /*
            Limite máximo confiável do setTimeout.
        */
        if (
            espera >
            2147483000
        ) {
            return;
        }


        timerProximaMudanca =
            setTimeout(
                () => {

                    timerProximaMudanca =
                        null;

                    recalcularNotificacoes();

                },
                espera
            );
    }


    /* =====================================================
       SINCRONIZAÇÃO COM SERVIDOR
       ===================================================== */

    async function sincronizarComServidor() {
        const agora =
            Date.now();

        if (
            !configurado
            ||
            sincronizando
            ||
            agora - ultimaSincronizacao < INTERVALO_MINIMO_SINCRONIZACAO
            ||
            document.hidden
            ||
            typeof SenacAPI ===
            "undefined"
            ||
            typeof SenacAPI
                .atualizarDadosPublicos
            !==
            "function"
        ) {
            return;
        }


        sincronizando =
            true;


        try {
            /*
                Isso permite descobrir um aviso
                criado enquanto o aluno já está
                com a página aberta.
            */
            const dados =
                await SenacAPI
                    .atualizarDadosPublicos();


            if (
                dados
                &&
                typeof dados === "object"
            ) {
                /*
                    Compartilha a mesma atualização com o chat.
                    Assim mudanças de sala/perguntas também chegam
                    sem uma segunda chamada à API.
                */
                window.dispatchEvent(
                    new CustomEvent(
                        "hubi:dadosAtualizados",
                        {
                            detail:
                                dados
                        }
                    )
                );


                if (
                    Array.isArray(
                        dados.notificacoes
                    )
                ) {
                    fonteNotificacoes =
                        dados.notificacoes;


                    recalcularNotificacoes();
                }
            }

        } catch (erro) {
            /*
                Se a internet cair, não apagamos
                o que já estava carregado.
            */
            console.warn(
                "Não foi possível atualizar as notificações do HUBI agora.",
                erro
            );

        } finally {
            ultimaSincronizacao =
                Date.now();

            sincronizando =
                false;
        }
    }


    /* =====================================================
       TOUCH / SWIPE
       ===================================================== */

    function toqueInicio(
        evento
    ) {
        touchStartX =
            evento
                .changedTouches
                ?.[0]
                ?.clientX
            ??
            null;
    }


    function toqueFim(
        evento
    ) {
        if (
            touchStartX === null
        ) {
            return;
        }


        const finalX =
            evento
                .changedTouches
                ?.[0]
                ?.clientX;


        if (
            typeof finalX !==
            "number"
        ) {
            touchStartX =
                null;

            return;
        }


        const distancia =
            finalX
            -
            touchStartX;


        touchStartX =
            null;


        if (
            Math.abs(
                distancia
            )
            <
            45
        ) {
            return;
        }


        if (
            distancia < 0
        ) {
            proxima();

        } else {
            anterior();
        }
    }


    /* =====================================================
       EVENTOS
       ===================================================== */

    anteriorButton
        ?.addEventListener(
            "click",
            anterior
        );


    proximaButton
        ?.addEventListener(
            "click",
            proxima
        );


    fecharButton
        ?.addEventListener(
            "click",
            fecharBanner
        );


    card
        ?.addEventListener(
            "touchstart",
            toqueInicio,
            {
                passive: true
            }
        );


    card
        ?.addEventListener(
            "touchend",
            toqueFim,
            {
                passive: true
            }
        );


    /*
        Se o aluno deixou a aba em segundo plano,
        ao voltar recalculamos tudo imediatamente.
    */
    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                !document.hidden
            ) {
                recalcularNotificacoes();

                sincronizarComServidor();
            }

        }
    );


    window.addEventListener(
        "focus",
        recalcularNotificacoes
    );


    /* =====================================================
       API PÚBLICA
       ===================================================== */

    return {
        configurar,
        obterNotificacoes,
        abrirBanner,
        marcarComoLida,
        marcarTodasComoLidas,
        isLida
    };

})();