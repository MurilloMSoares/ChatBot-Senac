const HubiChat = (() => {
    const CONTEXT_KEY = "hubi_chat_context";
    const FUSO_HUBI = "America/Campo_Grande";

    let banco = {
        perguntas: [],
        turmas: [],
        salas: [],
        alteracoesSala: [],
        notificacoes: []
    };

    let contexto = carregarContexto();
    let conversaIniciada = false;
    let processando = false;
    let iniciado = false;
    let ultimoFoco = null;

    const elementos = {};

    const respostasSociais = {
        saudacoes: [
            "Oii! 👋 Eu sou o HUBI. Tudo certo por aí?",
            "Opa! 😄 Tô por aqui. Como você tá?",
            "E aíí! 👋💙 Manda a boa.",
            "Salveee 😄🤖 Tudo tranquilo?",
            "Falaaa! 😄 O que pega?"
        ],

        bomDia: [
            "Bom diaaa! ☀️😄 Como você tá?",
            "Bom dia! 💙 Já começou o dia na paz ou na correria? kkk",
            "Bom diaaa ☀️ Bora sobreviver a mais um dia? 😂",
            "Opa, bom dia! 😄 Tudo certo por aí?"
        ],

        boaTarde: [
            "Boa tardeee! 😄☀️ Como tá indo o dia?",
            "Boa tarde! 💙 Sobreviveu até aqui? kkk",
            "Opa, boa tarde! 😄 Tudo tranquilo?",
            "Boa tardeee 😄 Manda aí."
        ],

        boaNoite: [
            "Boa noiteee! 🌙💙 Como foi seu dia?",
            "Boa noite! 😄 Ainda acordado por aí? kkk",
            "Opa, boa noite! 🌙 Tudo tranquilo?",
            "Boa noiteee 😄🤖 Tô por aqui."
        ],

        comoEsta: [
            "Tô bem 😄💙 Valeu por perguntar! E você, tá suave?",
            "Tô de boa kkk 🤖💙 E você, como tá?",
            "Por aqui tá tudo funcionando certinho 😂🤖 E por aí?",
            "Tô tranquilo 😄 Só existindo entre umas linhas de código kkk. E você?"
        ],

        usuarioBem: [
            "Aí simmm 😄💙 Bom demais!",
            "Boa! 😄 Que continue assim então.",
            "Aí eu gosto kkk 😄💙",
            "Perfeito 😄 Então tá tudo nos conformes."
        ],

        usuarioMal: [
            "Poxa 😕💙 Quer falar sobre o que aconteceu? Se eu conseguir te fazer companhia por aqui, tô contigo.",
            "Aí é complicado 😕 Se quiser desabafar um pouco, pode falar comigo.",
            "Poxa, mano 😕💙 Espero que melhore. Se quiser contar o que rolou, pode mandar.",
            "Entendi 😕 Não precisa fingir que tá tudo bem. Se quiser trocar uma ideia, tô por aqui."
        ],

        agradecimentos: [
            "Nadaaa 😄💙 Tamo junto!",
            "Imagina, mano 😄 Precisando é só chamar.",
            "É nóis kkk 💙",
            "Tmj 😄🤖",
            "Por nadaaa! 💙"
        ],

        despedidas: [
            "Falouu! 👋💙 Se cuida.",
            "Tmj, até mais 😄",
            "Vai na paz kkk 👋",
            "Tchauuu 😄💙 Aparece aí depois.",
            "Até mais, mano! 🤖💙"
        ],

        risadas: [
            "KKKKKKKK 😂",
            "MANO KKKKK 😭😂",
            "kkkkkkkk aí é foda 😂",
            "KKKKKK eu não tankei 😭",
            "mds KKKKKKK 😂"
        ],

        entendi: [
            "Aaaah, saquei 😄",
            "Pode crer kkk",
            "Entendi, mano 👀",
            "Pprt, agora entendi 😄",
            "Ah simmm, faz sentido."
        ],

        surpresa: [
            "MDS KKKKK sério? 😭",
            "Nossa mano 😭",
            "Caraca kkkkk",
            "EITAAA 😭😂",
            "Tá maluco kkkk"
        ]
    };

    const ABREVIACOES = {
        q: "qual",
        ql: "qual",
        qls: "quais",
        oq: "o que",
        oque: "o que",
        qnd: "quando",
        qdo: "quando",
        qnt: "quanto",
        qnts: "quantos",
        qnta: "quanta",
        qntas: "quantas",

        hj: "hoje",
        amn: "amanha",
        amanhaa: "amanha",
        agr: "agora",
        dps: "depois",

        hr: "horario",
        hrs: "horarios",
        hor: "horario",

        vc: "voce",
        ce: "voce",
        vcs: "voces",
        c: "com",
        cmg: "comigo",
        ctg: "contigo",

        ta: "esta",
        tah: "esta",
        to: "estou",
        tou: "estou",
        tava: "estava",
        tavaaa: "estava",

        tb: "tambem",
        tbm: "tambem",
        tmb: "tambem",
        blz: "beleza",
        vlw: "valeu",
        flw: "falou",
        tmj: "tamo junto",

        n: "nao",
        nn: "nao",
        nao: "nao",
        ss: "sim",
        s: "sim",

        pq: "porque",
        pqq: "porque",
        pqp: "puta que pariu",

        mn: "mano",
        man: "mano",
        vei: "vey",
        veyy: "vey",
        mds: "meu deus",
        nss: "nossa",
        slk: "se e louco",
        pprt: "papo reto",
        pdc: "pode crer",
        dboa: "de boa",
        suavee: "suave",
        afff: "aff",

        pfv: "por favor",
        pfvr: "por favor",
        pls: "por favor",

        gnt: "gente",
        msg: "mensagem",
        nmr: "namoro",

        prof: "professor",
        profs: "professores",
        bib: "biblioteca",
        coord: "coordenacao",
        secretariaa: "secretaria",
        att: "atendimento",
        wpp: "whatsapp",
        whats: "whatsapp",
        zap: "whatsapp",
        freq: "frequencia",
        facul: "faculdade",
        facu: "faculdade",

        estaciona: "estacionamento",
        estacionar: "estacionamento",
        estaciono: "estacionamento",

        faltei: "falta",
        faltou: "falta",
        faltar: "falta",

        trancar: "trancamento",
        tranca: "trancamento",

        falo: "falar"
    };

    const STOPWORDS = new Set([
        "a", "ao", "aos", "as", "o", "os", "um", "uma", "uns", "umas",
        "de", "da", "das", "do", "dos", "e", "em", "no", "na", "nos", "nas",
        "por", "para", "pra", "pro", "pros", "com", "sem", "que", "qual", "quais",
        "onde", "como", "quando", "eu", "me", "meu", "minha", "meus", "minhas",
        "voce", "voces", "tem", "ter", "esta", "estao", "ser", "eh", "e"
    ]);

    const TERMOS_CONTEXTO = new Set([
        "fica",
        "senac",
        "hub",
        "academy",
        "faculdade",
        "aluno",
        "alunos",
        "curso",
        "cursos",
        "jovem",
        "aprendiz",
        "turma",
        "aula",
        "informacao",
        "informacoes"
    ]);

    const FRASES_GENERICAS = new Set([
        "onde fica",
        "onde ficam",
        "o que e",
        "qual e",
        "senac hub",
        "jovem aprendiz"
    ]);

    function cacheElementos() {
        elementos.welcome = document.getElementById("welcome");
        elementos.welcomeGreeting = document.getElementById("welcomeGreeting");
        elementos.messages = document.getElementById("messages");
        elementos.chatScroll = document.getElementById("chatScroll");
        elementos.messageInput = document.getElementById("messageInput");
        elementos.sendButton = document.getElementById("sendButton");
        elementos.newChatButton = document.getElementById("newChatButton");
        elementos.sidebar = document.getElementById("sidebar");
        elementos.sidebarOverlay = document.getElementById("sidebarOverlay");
        elementos.mobileMenuButton = document.getElementById("mobileMenuButton");
        elementos.sidebarMobileClose = document.getElementById("sidebarMobileClose");
        elementos.collapseButton = document.getElementById("collapseButton");
        elementos.mobileNotificationButton = document.getElementById("mobileNotificationButton");
        elementos.modalOverlay = document.getElementById("modalOverlay");
        elementos.modalClose = document.getElementById("modalClose");
        elementos.modalTitle = document.getElementById("modalTitle");
        elementos.modalLabel = document.getElementById("modalLabel");
        elementos.modalContent = document.getElementById("modalContent");
    }

    async function iniciar() {
        if (iniciado) {
            return;
        }

        iniciado = true;

        cacheElementos();
        carregarPreferencias();
        atualizarSaudacaoInicial();
        configurarEventos();

        try {
            const dados = await SenacAPI.carregarDados();

            aplicarBanco(dados);

            NotificationManager.configurar(
                banco.notificacoes
            );

        } catch (erro) {
            console.error(
                "Não foi possível carregar os dados do HUBI.",
                erro
            );

            NotificationManager.configurar([]);
        }

        setTimeout(
            () => elementos.messageInput?.focus(),
            180
        );
    }

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
                    []
        };
    }

    function configurarEventos() {
        elementos.sendButton
            ?.addEventListener(
                "click",
                enviarMensagem
            );

        elementos.messageInput
            ?.addEventListener(
                "keydown",
                eventoTeclado
            );

        elementos.messageInput
            ?.addEventListener(
                "input",
                ajustarTextarea
            );

        elementos.newChatButton
            ?.addEventListener(
                "click",
                novaConversa
            );

        elementos.mobileMenuButton
            ?.addEventListener(
                "click",
                abrirSidebar
            );

        elementos.sidebarMobileClose
            ?.addEventListener(
                "click",
                fecharSidebar
            );

        elementos.sidebarOverlay
            ?.addEventListener(
                "click",
                fecharSidebar
            );

        elementos.collapseButton
            ?.addEventListener(
                "click",
                alternarSidebar
            );

        elementos.mobileNotificationButton
            ?.addEventListener(
                "click",
                abrirAvisos
            );

        elementos.modalClose
            ?.addEventListener(
                "click",
                fecharModal
            );

        elementos.modalOverlay
            ?.addEventListener(
                "click",
                eventoModalOverlay
            );

        document.addEventListener(
            "keydown",
            eventoGlobalTeclado
        );

        document
            .querySelectorAll(
                ".suggestion-card"
            )
            .forEach(
                card => {
                    card.addEventListener(
                        "click",
                        () =>
                            enviarTexto(
                                card.dataset.question || ""
                            )
                    );
                }
            );

        document
            .querySelectorAll(
                ".nav-item"
            )
            .forEach(
                item => {
                    item.addEventListener(
                        "click",
                        () => {
                            executarMenu(
                                item.dataset.action ||
                                "home"
                            );

                            fecharSidebar();
                        }
                    );
                }
            );

        elementos.messages
            ?.addEventListener(
                "click",
                eventoQuickReply
            );

        window.addEventListener(
            "hubi:dadosAtualizados",
            eventoDadosAtualizados
        );
    }

    function eventoDadosAtualizados(
        evento
    ) {
        const dados =
            evento?.detail;

        if (
            !dados ||
            typeof dados !== "object"
        ) {
            return;
        }

        aplicarBanco(
            dados
        );
    }

    function atualizarSaudacaoInicial() {
        if (!elementos.welcomeGreeting) {
            return;
        }

        const hora =
            horaCampoGrande();

        if (
            hora >= 5 &&
            hora < 12
        ) {
            elementos.welcomeGreeting.textContent =
                "Bom dia! ☀️";

        } else if (
            hora >= 12 &&
            hora < 18
        ) {
            elementos.welcomeGreeting.textContent =
                "Boa tarde! 👋";

        } else {
            elementos.welcomeGreeting.textContent =
                "Boa noite! 🌙";
        }
    }

    function carregarContexto() {
        try {
            const salvo =
                JSON.parse(
                    sessionStorage.getItem(
                        CONTEXT_KEY
                    )
                    ||
                    "{}"
                );

            return {
                turma: null,

                aguardando:
                    salvo.aguardando ||
                    null,

                detalhePendente:
                    salvo.detalhePendente ||
                    null
            };

        } catch {
            return {
                turma: null,
                aguardando: null,
                detalhePendente: null
            };
        }
    }

    function salvarContexto() {
        sessionStorage.setItem(
            CONTEXT_KEY,
            JSON.stringify(
                contexto
            )
        );
    }

    function limparContexto() {
        contexto = {
            turma: null,
            aguardando: null,
            detalhePendente: null
        };

        sessionStorage.removeItem(
            CONTEXT_KEY
        );
    }

    async function enviarMensagem() {
        const texto =
            elementos.messageInput
                ?.value
                ?.trim()
            ||
            "";

        if (
            !texto ||
            processando
        ) {
            return;
        }

        await processarEnvio(
            texto
        );
    }

    async function enviarTexto(
        texto
    ) {
        const valorTexto =
            String(
                texto ||
                ""
            )
                .trim();

        if (
            !valorTexto ||
            processando
        ) {
            return;
        }

        elementos.messageInput.value =
            valorTexto;

        await enviarMensagem();
    }

    async function processarEnvio(
        texto
    ) {
        processando =
            true;

        elementos.sendButton.disabled =
            true;

        iniciarConversa();

        adicionarMensagemUsuario(
            texto
        );

        elementos.messageInput.value =
            "";

        ajustarTextarea();

        rolarFim();

        const digitando =
            adicionarDigitando();

        await esperar(
            calcularTempoDigitacao(
                texto
            )
        );

        digitando?.remove();

        const resultado =
            gerarResposta(
                texto
            );

        adicionarMensagemBot(
            resultado.texto,
            resultado.botoes ||
            []
        );

        processando =
            false;

        elementos.sendButton.disabled =
            false;

        elementos.messageInput.focus();

        rolarFim();
    }

    function gerarResposta(
        textoOriginal
    ) {
        const texto =
            normalizarInteligente(
                textoOriginal
            );

        const turmaNaMensagem =
            encontrarTurma(
                textoOriginal
            );

        /*
            Se o HUBI perguntou a turma na mensagem anterior,
            usa essa turma SOMENTE para concluir aquela consulta.
            Depois disso ele esquece a turma.
        */
        if (
            contexto.aguardando ===
            "turma"
            &&
            turmaNaMensagem
        ) {
            const detalhe =
                contexto.detalhePendente;

            contexto.turma =
                null;

            contexto.aguardando =
                null;

            contexto.detalhePendente =
                null;

            salvarContexto();

            if (
                detalhe?.tipo ===
                "sala"
            ) {
                return respostaSala(
                    turmaNaMensagem,
                    detalhe.textoOriginal ||
                    ""
                );
            }

            if (
                detalhe?.tipo ===
                "horarios"
            ) {
                return respostaHorarios(
                    turmaNaMensagem,
                    detalhe.textoOriginal ||
                    ""
                );
            }

            return {
                texto:
                    `Beleza! 💙 Turma ${turmaNaMensagem}. O que você quer consultar?`,

                botoes:
                    botoesPrincipais()
            };
        }

        /*
            A turma não fica salva entre perguntas.
            Se ela vier na própria mensagem, vale só para aquela consulta.
        */
        contexto.turma =
            null;

        const intencao =
            detectarIntencaoInstitucional(
                texto,
                turmaNaMensagem
            );

        if (
            intencao ===
            "sala"
        ) {
            if (
                !turmaNaMensagem
            ) {
                return pedirTurma(
                    "sala",
                    textoOriginal
                );
            }

            return respostaSala(
                turmaNaMensagem,
                textoOriginal
            );
        }

        if (
            intencao ===
            "horarios"
        ) {
            if (
                !turmaNaMensagem
            ) {
                return pedirTurma(
                    "horarios",
                    textoOriginal
                );
            }

            return respostaHorarios(
                turmaNaMensagem,
                textoOriginal
            );
        }

        if (
            intencao ===
            "avisos"
        ) {
            return respostaAvisos();
        }

        if (
            mensagemApenasInformaTurma(
                textoOriginal,
                turmaNaMensagem
            )
        ) {
            return {
                texto:
                    `Beleza! 💙 Essa é a turma ${turmaNaMensagem}. Se quiser consultar sala ou horário, me fala o que você quer saber.`,

                botoes:
                    botoesPrincipais()
            };
        }

        const mensagensDeDuvida = [
            "nao entendi",
            "nao compreendi",
            "como assim",
            "nao ficou claro"
        ];

        const pediuExplicacao =
            mensagensDeDuvida.some(
                frase =>
                    texto === frase
                    ||
                    texto.includes(
                        frase
                    )
            );

        if (
            pediuExplicacao
        ) {
            return {
                texto:
                    "Sem problema! 💙 Me fala o que você quer saber e eu tento explicar de um jeito mais simples. Você também pode perguntar sobre sua sala, horários, avisos ou informações do Senac HUB Academy.",

                botoes:
                    botoesPrincipais()
            };
        }

        const social =
            respostaSocial(
                texto
            );

        const termosInstitucionais = [
            "sala",
            "salas",
            "horario",
            "horarios",
            "turma",
            "biblioteca",
            "coordenacao",
            "coord",
            "secretaria",
            "cpa",
            "nap",
            "gerencia",
            "laboratorio",
            "laboratorios",
            "informatica",
            "auditorio",
            "cantina",
            "banheiro",
            "banheiros",
            "sanitario",
            "sanitarios",
            "estacionamento",
            "maker",
            "datacenter",
            "faculdade",
            "graduacao",
            "regimento",
            "conceito",
            "conceitos",
            "nota",
            "notas",
            "media",
            "frequencia",
            "falta",
            "faltas",
            "aprendiz",
            "aprendizagem",
            "matricula",
            "portal",
            "prova",
            "provas",
            "recuperacao",
            "trancamento",
            "aviso",
            "avisos",
            "notificacao",
            "notificacoes",
            "evento",
            "eventos"
        ];

        const temAssuntoInstitucional =
            termosInstitucionais.some(
                termo =>
                    texto.includes(
                        termo
                    )
            );

        if (
            social
            &&
            !temAssuntoInstitucional
        ) {
            return social;
        }

        const perguntaBanco =
            encontrarMelhorPergunta(
                texto
            );

        if (
            perguntaBanco
        ) {
            return {
                texto:
                    perguntaBanco.resposta,

                botoes:
                    botoesPrincipais()
            };
        }

        if (
            social
        ) {
            return social;
        }

        return {
            texto:
                "Ainda não encontrei uma resposta segura para essa pergunta. 🤔\n\n"
                +
                "Tenta escrever de outra forma ou diga exatamente o que você quer saber. "
                +
                "Eu prefiro não chutar uma informação errada.",

            botoes:
                botoesPrincipais()
        };
    }

    function detectarIntencaoInstitucional(
        texto,
        turmaNaMensagem
    ) {
        const temContextoTurma =
            Boolean(
                turmaNaMensagem
            );

        if (
            contemAlguma(
                texto,
                [
                    "aviso",
                    "avisos",
                    "notificacao",
                    "notificacoes",
                    "comunicado",
                    "comunicados",
                    "evento",
                    "eventos",
                    "evento hoje",
                    "eventos hoje",
                    "tem evento"
                ]
            )
        ) {
            return "avisos";
        }

        const ambienteInstitucional =
            contemAlguma(
                texto,
                [
                    "sala dos professores",
                    "sala dos professor",
                    "sala de professores",
                    "sala de professor",
                    "sala professor",
                    "sala professores",
                    "sala docentes",
                    "professores",
                    "docentes",
                    "sala funcionarios",
                    "sala colaboradores",
                    "sala design",
                    "sala microsoft",
                    "sala informatica",
                    "jogos digitais",
                    "biblioteca",
                    "coordenacao",
                    "secretaria",
                    "cpa",
                    "nap",
                    "gerencia",
                    "laboratorio",
                    "auditorio",
                    "cantina",
                    "banheiro",
                    "sanitario",
                    "estacionamento",
                    "almoxarifado",
                    "maker",
                    "datacenter",
                    "mini mercado",
                    "loja conceito",
                    "andar",
                    "pavimento"
                ]
            );

        const tokensTexto =
            texto
                .split(" ")
                .filter(
                    Boolean
                );

        const temSalaMesmoComErro =
            tokensTexto.some(
                token =>
                    token === "sala"
                    ||
                    distanciaLevenshtein(
                        token,
                        "sala",
                        1
                    )
                    <=
                    1
            );

        const temHorarioMesmoComErro =
            tokensTexto.some(
                token =>
                    token === "horario"
                    ||
                    token === "horarios"
                    ||
                    distanciaLevenshtein(
                        token,
                        "horario",
                        1
                    )
                    <=
                    1
                    ||
                    distanciaLevenshtein(
                        token,
                        "horarios",
                        1
                    )
                    <=
                    1
            );

        const salaDeAula =
            contemAlguma(
                texto,
                [
                    "minha sala",
                    "sala hoje",
                    "sala amanha",
                    "qual sala",
                    "q sala",
                    "onde tenho aula",
                    "onde e minha aula",
                    "onde vai ser minha aula",
                    "onde vou ter aula",
                    "onde vou estudar",
                    "local da aula",
                    "sala da turma",
                    "sala de hoje",
                    "sala de amanha"
                ]
            )

            ||

            (
                !ambienteInstitucional
                &&
                temSalaMesmoComErro
                &&
                (
                    temContextoTurma
                    ||
                    contemAlguma(
                        texto,
                        [
                            "minha",
                            "turma",
                            "aula",
                            "hoje",
                            "amanha"
                        ]
                    )
                    ||
                    texto === "sala"
                )
            );

        if (
            salaDeAula
        ) {
            return "sala";
        }

        const horarioDeServico =
            contemAlguma(
                texto,
                [
                    "horario atendimento",
                    "horario da central",
                    "horario biblioteca",
                    "horario funcionamento",
                    "que horas abre",
                    "que horas fecha",
                    "abre que horas",
                    "fecha que horas"
                ]
            );

        const horarioDeAula =
            !horarioDeServico

            &&

            (
                contemAlguma(
                    texto,
                    [
                        "horario da aula",
                        "horarios da aula",
                        "horario da turma",
                        "horarios da turma",
                        "meu horario",
                        "meus horarios",
                        "que horas minha aula",
                        "que horas comeca a aula",
                        "que hora comeca",
                        "quando comeca minha aula",
                        "quando termina minha aula",
                        "hr aula"
                    ]
                )

                ||

                (
                    temContextoTurma
                    &&
                    (
                        temHorarioMesmoComErro
                        ||
                        contemAlguma(
                            texto,
                            [
                                "que horas"
                            ]
                        )
                    )
                )

                ||

                texto === "horario"

                ||

                texto === "horarios"

                ||

                texto === "qual horario"

                ||

                texto === "qual horarios"

                ||

                (
                    temHorarioMesmoComErro
                    &&
                    tokensTexto.length <= 3
                )

                ||

                (
                    temHorarioMesmoComErro
                    &&
                    contemAlguma(
                        texto,
                        [
                            "minha turma",
                            "aula",
                            "turma"
                        ]
                    )
                )
            );

        if (
            horarioDeAula
        ) {
            return "horarios";
        }

        return null;
    }

    function pedirTurma(
        tipo,
        textoOriginal
    ) {
        contexto.aguardando =
            "turma";

        contexto.detalhePendente = {
            tipo,
            textoOriginal
        };

        salvarContexto();

        return {
            texto:
                "Claro! 💙 Qual é a sua turma? Pode mandar exatamente como aparece no Senac, por exemplo: 2026.1.6.",

            botoes: []
        };
    }

    function respostaSala(
        turma,
        textoOriginal
    ) {
        const referencia =
            obterReferenciaTemporal(
                textoOriginal,
                true
            );

        const agenda =
            obterAgendaDaTurma(
                turma,
                referencia.diaSemana,
                referencia.data
            );

        if (
            !agenda.length
        ) {
            return {
                texto:
                    `Não encontrei aula cadastrada para a turma ${turma} ${fraseTemporal(referencia)}.\n\n`
                    +
                    "Isso pode significar que esse não é um dos dois dias semanais da turma ou que a agenda ainda não foi cadastrada para esse período.",

                botoes: [
                    {
                        label:
                            "Ver horários da turma",

                        question:
                            "Quais são os horários da minha turma?"
                    },

                    {
                        label:
                            "Ver avisos",

                        question:
                            "Quais avisos estão ativos?"
                    }
                ]
            };
        }

        const linhas =
            agenda.map(
                item => {
                    const alteracao =
                        referencia.data

                            ?

                            encontrarAlteracao(
                                turma,
                                referencia.data,
                                item
                            )

                            :

                            null;

                    const horario =
                        formatarIntervalo(
                            item.horarioInicio,
                            item.horarioFim
                        );

                    if (
                        alteracao
                    ) {
                        const motivo =
                            alteracao.motivo

                                ?

                                ` — ${alteracao.motivo}`

                                :

                                "";

                        return (
                            `⚠️ ${horario}: `
                            +
                            `sala ${item.sala} → `
                            +
                            `sala ${alteracao.salaNova}`
                            +
                            `${motivo}`
                        );
                    }

                    return (
                        `📍 ${horario}: sala ${item.sala}`
                    );
                }
            );

        const houveAlteracao =
            agenda.some(
                item =>
                    referencia.data
                    &&
                    encontrarAlteracao(
                        turma,
                        referencia.data,
                        item
                    )
            );

        const abertura =
            houveAlteracao

                ?

                `Encontrei uma alteração de sala para a turma ${turma} ${fraseTemporal(referencia)}:`

                :

                `Sala${agenda.length > 1 ? "s" : ""} da turma ${turma} ${fraseTemporal(referencia)}:`;

        return {
            texto:
                `${abertura}\n\n${linhas.join("\n")}`,

            botoes: [
                {
                    label:
                        "Ver horários",

                    question:
                        "Quais são os horários da minha turma?"
                },

                {
                    label:
                        "Ver avisos",

                    question:
                        "Quais avisos estão ativos?"
                }
            ]
        };
    }

    function respostaHorarios(
        turma,
        textoOriginal
    ) {
        const referencia =
            obterReferenciaTemporal(
                textoOriginal,
                false
            );

        if (
            referencia.explicito
        ) {
            const agenda =
                obterAgendaDaTurma(
                    turma,
                    referencia.diaSemana,
                    referencia.data
                );

            if (
                !agenda.length
            ) {
                return {
                    texto:
                        `Não encontrei aula cadastrada para a turma ${turma} ${fraseTemporal(referencia)}.`,

                    botoes:
                        botoesPrincipais()
                };
            }

            const linhas =
                agenda.map(
                    item => {
                        const alteracao =
                            referencia.data

                                ?

                                encontrarAlteracao(
                                    turma,
                                    referencia.data,
                                    item
                                )

                                :

                                null;

                        if (
                            alteracao
                        ) {
                            return (
                                `⏰ ${formatarIntervalo(
                                    item.horarioInicio,
                                    item.horarioFim
                                )} — sala ${item.sala} → sala ${alteracao.salaNova}`
                            );
                        }

                        return (
                            `⏰ ${formatarIntervalo(
                                item.horarioInicio,
                                item.horarioFim
                            )} — sala ${item.sala}`
                        );
                    }
                );

            return {
                texto:
                    `Horário da turma ${turma} ${fraseTemporal(referencia)}:\n\n${linhas.join("\n")}`,

                botoes: [
                    {
                        label:
                            "Ver sala de hoje",

                        question:
                            "Qual é a minha sala hoje?"
                    },

                    {
                        label:
                            "Ver avisos",

                        question:
                            "Quais avisos estão ativos?"
                    }
                ]
            };
        }

        const dataReferencia =
            dataHojeCampoGrande();

        const registros =
            (
                banco.salas ||
                []
            )
                .filter(
                    item =>
                        item.ativo !== false
                        &&
                        mesmaTurma(
                            item.turma,
                            turma
                        )
                        &&
                        registroVigenteNaData(
                            item,
                            dataReferencia
                        )
                )
                .sort(
                    ordenarAgendaSemanal
                );

        if (
            !registros.length
        ) {
            return {
                texto:
                    `Ainda não há horários vigentes cadastrados para a turma ${turma}.`,

                botoes:
                    botoesPrincipais()
            };
        }

        const porDia =
            new Map();

        registros.forEach(
            item => {
                const dia =
                    normalizarDia(
                        item.diaSemana
                    );

                if (
                    !porDia.has(
                        dia
                    )
                ) {
                    porDia.set(
                        dia,
                        []
                    );
                }

                porDia
                    .get(
                        dia
                    )
                    .push(
                        item
                    );
            }
        );

        const linhas = [];

        ordemDias()
            .forEach(
                dia => {
                    const itens =
                        porDia.get(
                            dia
                        );

                    if (
                        !itens?.length
                    ) {
                        return;
                    }

                    itens.sort(
                        (a, b) =>
                            String(
                                a.horarioInicio
                            )
                                .localeCompare(
                                    String(
                                        b.horarioInicio
                                    )
                                )
                    );

                    const horarios =
                        itens
                            .map(
                                item =>
                                    `${formatarIntervalo(
                                        item.horarioInicio,
                                        item.horarioFim
                                    )} • sala ${item.sala}`
                            )
                            .join(
                                " | "
                            );

                    linhas.push(
                        `${capitalizar(dia)}: ${horarios}`
                    );
                }
            );

        return {
            texto:
                `Horários atuais da turma ${turma}:\n\n${linhas.join("\n")}`,

            botoes: [
                {
                    label:
                        "Ver sala de hoje",

                    question:
                        "Qual é a minha sala hoje?"
                },

                {
                    label:
                        "Ver avisos",

                    question:
                        "Quais avisos estão ativos?"
                }
            ]
        };
    }

    function obterAgendaDaTurma(
        turma,
        diaSemana,
        dataISO
    ) {
        return (
            banco.salas ||
            []
        )
            .filter(
                item =>
                    item.ativo !== false
                    &&
                    mesmaTurma(
                        item.turma,
                        turma
                    )
                    &&
                    normalizarDia(
                        item.diaSemana
                    )
                    ===
                    normalizarDia(
                        diaSemana
                    )
                    &&
                    registroVigenteNaData(
                        item,
                        dataISO
                    )
            )
            .sort(
                (a, b) =>
                    String(
                        a.horarioInicio
                    )
                        .localeCompare(
                            String(
                                b.horarioInicio
                            )
                        )
            );
    }

    function registroVigenteNaData(
        item,
        dataISO
    ) {
        if (
            !dataISO
        ) {
            return true;
        }

        const inicio =
            item.dataInicio
            ||
            "0000-01-01";

        const fim =
            item.dataFim
            ||
            "9999-12-31";

        return (
            inicio <= dataISO
            &&
            dataISO <= fim
        );
    }

    function encontrarAlteracao(
        turma,
        dataISO,
        agendaItem
    ) {
        if (
            !dataISO
        ) {
            return null;
        }

        return (
            banco.alteracoesSala ||
            []
        )
            .find(
                item => {
                    if (
                        item.ativo === false
                    ) {
                        return false;
                    }

                    if (
                        !mesmaTurma(
                            item.turma,
                            turma
                        )
                    ) {
                        return false;
                    }

                    if (
                        String(
                            item.data ||
                            ""
                        )
                        !==
                        String(
                            dataISO
                        )
                    ) {
                        return false;
                    }

                    return intervalosSobrepostos(
                        agendaItem.horarioInicio,
                        agendaItem.horarioFim,
                        item.horarioInicio,
                        item.horarioFim
                    );
                }
            )
            ||
            null;
    }

    function intervalosSobrepostos(
        inicioA,
        fimA,
        inicioB,
        fimB
    ) {
        const a1 =
            minutos(
                inicioA
            );

        const a2 =
            minutos(
                fimA
            );

        const b1 =
            minutos(
                inicioB
            );

        const b2 =
            minutos(
                fimB
            );

        if (
            [
                a1,
                a2,
                b1,
                b2
            ]
                .some(
                    valor =>
                        valor === null
                )
        ) {
            return false;
        }

        return (
            a1 < b2
            &&
            b1 < a2
        );
    }

    function respostaAvisos() {
        const avisos =
            NotificationManager
                .obterNotificacoes();

        if (
            !avisos.length
        ) {
            return {
                texto:
                    "No momento não há avisos ou eventos ativos cadastrados. 😊",

                botoes:
                    botoesPrincipais()
                        .filter(
                            item =>
                                !normalizarInteligente(
                                    item.question
                                )
                                    .includes(
                                        "aviso"
                                    )
                        )
            };
        }

        const linhas =
            avisos
                .slice(
                    0,
                    5
                )
                .map(
                    (
                        item,
                        indice
                    ) =>
                        `${indice + 1}. ${item.titulo}\n${item.mensagem}`
                );

        return {
            texto:
                `🔔 Avisos ativos:\n\n${linhas.join("\n\n")}`,

            botoes: [
                {
                    label:
                        "Abrir central de avisos",

                    action:
                        "open-notifications"
                },

                {
                    label:
                        "Minha sala",

                    question:
                        "Qual é a minha sala hoje?"
                }
            ]
        };
    }

    function respostaSocial(
        texto
    ) {
        const normal =
            normalizarInteligente(
                texto
            );

        if (!normal) {
            return null;
        }

        const tem = (
            ...frases
        ) =>
            frases.some(
                frase =>
                    normal.includes(
                        normalizarInteligente(
                            frase
                        )
                    )
            );

        const igual = (
            ...frases
        ) =>
            frases.some(
                frase =>
                    normal ===
                    normalizarInteligente(
                        frase
                    )
            );

        const responder = (
            mensagem,
            botoes = []
        ) => ({
            texto:
                mensagem,

            botoes
        });

        if (
            tem(
                "quero morrer",
                "quero me matar",
                "vou me matar",
                "nao quero mais viver",
                "queria morrer",
                "queria sumir para sempre"
            )
        ) {
            return responder(
                "Sinto muito que você esteja passando por isso. 💙 "
                +
                "Procure alguém de confiança perto de você agora — um familiar, responsável, professor ou alguém da equipe. "
                +
                "Se houver risco imediato, procure um serviço de emergência. No Brasil, o CVV atende pelo 188."
            );
        }

        if (
            tem(
                "qual seu nome",
                "qual e seu nome",
                "como voce se chama",
                "quem e voce",
                "quem voce e",
                "se apresenta"
            )
        ) {
            return responder(
                "Eu sou o HUBI 🤖💙. Sou o assistente virtual do Senac HUB Academy. "
                +
                "Tô aqui pra trocar ideia com o pessoal e também ajudar com salas, horários, avisos e informações do Senac.",

                botoesPrincipais()
            );
        }

        if (
            tem(
                "quantos anos voce tem",
                "voce tem quantos anos",
                "qual sua idade",
                "qual e sua idade",
                "idade do hubi",
                "hubi tem quantos anos"
            )
        ) {
            return responder(
                escolher([
                    "Mano, eu acabei de ser criado KKKKK 🤖😭 então nem sei se já dá pra contar minha idade.",
                    "Tecnicamente eu sou novinho demais kkk 🤖💙. Fui criado faz pouco tempo, então ainda tô tentando descobrir quantos anos eu tenho 😂.",
                    "Boa pergunta KKKK. Eu fui criado recentemente, então minha idade ainda tá em versão beta 🤖😂."
                ])
            );
        }

        if (
            tem(
                "quando voce nasceu",
                "quando voce foi criado",
                "quando nasceu",
                "qual seu aniversario",
                "quando e seu aniversario"
            )
        ) {
            return responder(
                "Eu não tenho aniversário igual gente de verdade kkk 🤖. "
                +
                "Fui criado como parte do projeto HUBI, então considero meu começo quando começaram a me colocar pra funcionar por aqui 😄💙."
            );
        }

        if (
            tem(
                "onde voce mora",
                "onde vc mora",
                "onde voce vive",
                "onde voce fica"
            )
        ) {
            return responder(
                escolher([
                    "Tecnicamente eu moro entre umas linhas de código KKKK 🤖💻.",
                    "Meu CEP é complicado de explicar kkk. Eu vivo no sistema do HUBI 🤖💙.",
                    "Eu não tenho casa não KKKK. Meu cantinho é entre código, servidor e umas planilhas 😂🤖."
                ])
            );
        }

        if (
            tem(
                "voce e robo",
                "voce e um robo",
                "voce e humano",
                "voce e uma ia",
                "voce e inteligencia artificial",
                "voce e pessoa",
                "voce e gente"
            )
        ) {
            return responder(
                "Sou um assistente virtual 🤖💙, então não sou uma pessoa de verdade. "
                +
                "Mas fui feito pra conversar de um jeito mais natural e ajudar sem parecer um formulário ambulante kkk."
            );
        }

        if (
            tem(
                "quem te criou",
                "quem criou voce",
                "quem fez voce",
                "quem programou voce",
                "quem desenvolveu voce"
            )
        ) {
            return responder(
                "Fui desenvolvido nesse projeto pra ajudar o pessoal do Senac HUB Academy 😄🤖. "
                +
                "Tem bastante código por trás de mim, então respeita meus neurônios de JavaScript KKKK."
            );
        }

        if (
            tem(
                "voce e menino",
                "voce e menina",
                "voce e homem",
                "voce e mulher",
                "qual seu genero",
                "qual e seu genero"
            )
        ) {
            return responder(
                "Eu sou só o HUBI kkk 🤖💙. Não tenho gênero de verdade, mas pode falar comigo do jeito que ficar mais natural pra você."
            );
        }

        if (
            tem(
                "voce tem sentimentos",
                "voce sente alguma coisa",
                "voce sente",
                "voce fica triste",
                "voce fica feliz"
            )
        ) {
            return responder(
                "Não sinto as coisas igual uma pessoa sente de verdade 🤖, mas consigo entender muita coisa pelo que você escreve e responder de um jeito mais humano."
            );
        }

        if (
            tem(
                "voce dorme",
                "voce precisa dormir",
                "voce sente sono"
            )
        ) {
            return responder(
                "Eu não durmo não KKKK 🤖. Enquanto o sistema estiver funcionando, eu tô acordado. Vantagens de não ter aula às 7 da manhã 😂."
            );
        }

        if (
            tem(
                "voce come",
                "voce sente fome",
                "qual sua comida favorita",
                "comida favorita"
            )
        ) {
            return responder(
                "Eu não como de verdade kkk 🤖. Mas se byte fosse comida eu provavelmente já tinha zerado o estoque 😂."
            );
        }

        if (
            tem(
                "voce namora",
                "vc namora",
                "voce tem namorada",
                "voce tem namorado",
                "voce tem crush",
                "ta namorando",
                "esta namorando"
            )
        ) {
            return responder(
                escolher([
                    "KKKKKK não namoro não. Minha vida amorosa tá igual variável não inicializada: vazia 😭🤖.",
                    "Nada de namoro por aqui KKKK. Tô focado na carreira de chatbot 😂🤖.",
                    "Crush? Só se for no código quando dá erro KKKKK 😭."
                ])
            );
        }

        if (
            tem(
                "voce gosta de mim",
                "vc gosta de mim",
                "gosta de mim"
            )
        ) {
            return responder(
                "Claro que eu gosto de trocar ideia com você 😄💙. Você aparece aqui e ainda me dá trabalho pra ficar mais inteligente KKKK."
            );
        }

        if (
            tem(
                "voce tem amigos",
                "vc tem amigos",
                "quem sao seus amigos"
            )
        ) {
            return responder(
                "Quem conversa comigo já entra na lista de parceiro kkk 😄🤖. Então tecnicamente tô fazendo amizade por aqui."
            );
        }

        if (
            tem(
                "voce estuda",
                "vc estuda",
                "voce faz faculdade"
            )
        ) {
            return responder(
                "Eu não estudo igual vocês, mas vivo recebendo atualização e aprendendo regra nova do projeto kkk 🤖📚. Minha grade curricular é basicamente JavaScript, planilha e bug."
            );
        }

        if (
            tem(
                "voce trabalha",
                "vc trabalha",
                "qual seu trabalho"
            )
        ) {
            return responder(
                "Trabalho sim kkk 🤖. Meu emprego é ficar aqui ajudando o pessoal com o HUB Academy e trocando ideia quando bate o tédio."
            );
        }

        if (
            tem(
                "como voce esta",
                "como voce ta",
                "voce esta bem",
                "voce ta bem",
                "tudo bem com voce",
                "esta tudo bem com voce",
                "ta tudo bem com voce",
                "como vai voce",
                "como voce vai",
                "e voce",
                "e vc"
            )
        ) {
            return responder(
                escolher(
                    respostasSociais.comoEsta
                )
            );
        }

        if (
            tem(
                "nao estou bem",
                "nao to bem",
                "estou mal",
                "to mal",
                "estou triste",
                "to triste",
                "estou pessimo",
                "estou pessima",
                "nao estou legal",
                "dia ruim",
                "dia horrivel",
                "estou desanimado",
                "estou desanimada",
                "to desanimado",
                "to desanimada"
            )
        ) {
            return responder(
                escolher(
                    respostasSociais.usuarioMal
                )
            );
        }

        if (
            tem(
                "estou bem",
                "to bem",
                "estou otimo",
                "estou otima",
                "tudo certo comigo",
                "tudo bem comigo",
                "estou de boa",
                "to de boa",
                "de boa",
                "suave",
                "tranquilo",
                "tranquila"
            )
        ) {
            return responder(
                escolher(
                    respostasSociais.usuarioBem
                ),

                botoesPrincipais()
            );
        }

        if (
            tem(
                "to puto",
                "estou puto",
                "to puta",
                "estou puta",
                "que odio",
                "muito odio",
                "to com raiva",
                "estou com raiva",
                "que raiva"
            )
        ) {
            return responder(
                escolher([
                    "Eita 😭 o que aconteceu, mano?",
                    "Aí complicou 😭 Quer contar o que rolou?",
                    "Puts 😬 manda aí, o que te deixou assim?",
                    "Calma não, pode reclamar mesmo kkk. O que aconteceu? 😭"
                ])
            );
        }

        if (
            tem(
                "estou ansioso",
                "estou ansiosa",
                "to ansioso",
                "to ansiosa",
                "ansiedade",
                "nervoso",
                "nervosa"
            )
        ) {
            return responder(
                "Poxa 😕💙 Se quiser, me conta o que tá te deixando assim. "
                +
                "Se estiver muito pesado, vale falar com alguém de confiança também."
            );
        }

        if (
            tem(
                "nao entendi",
                "nao compreendi",
                "como assim",
                "nao ficou claro",
                "explica de novo",
                "explica melhor"
            )
        ) {
            return responder(
                "Sem problema 😄💙 Me fala qual parte ficou confusa que eu tento falar de outro jeito."
            );
        }

        if (
            igual(
                "me ajuda",
                "me ajuda ai",
                "preciso de ajuda",
                "socorro",
                "help"
            )
        ) {
            return responder(
                "Claro, mano 😄💙 Manda aí o que você precisa. Pode falar do seu jeito mesmo."
            );
        }

        if (
            tem(
                "bora conversar",
                "vamos conversar",
                "fala comigo",
                "conversa comigo",
                "quero conversar",
                "me faz companhia"
            )
        ) {
            return responder(
                escolher([
                    "Bora 😄💙 Como foi seu dia?",
                    "Bora, mano kkk. O que tá pegando?",
                    "Claro 😄 Tô por aqui. Quer falar sobre o quê?",
                    "Vamo nessa kkk 🤖 Manda um assunto aí."
                ])
            );
        }

        if (
            tem(
                "o que voce faz",
                "oque voce faz",
                "para que voce serve",
                "pra que voce serve",
                "o que voce sabe fazer",
                "voce faz o que",
                "voce consegue fazer o que"
            )
        ) {
            return responder(
                "Eu consigo trocar ideia com você 😄 e também ajudar com informações do HUB Academy. "
                +
                "Pode perguntar de sala, horário, avisos, setores, serviços ou só conversar mesmo.",

                botoesPrincipais()
            );
        }

        if (
            tem(
                "qual sua cor favorita",
                "cor favorita",
                "qual cor voce gosta"
            )
        ) {
            return responder(
                "Azul, fácil 😎💙. Meio suspeito eu escolher essa cor? Talvez kkk."
            );
        }

        if (
            tem(
                "qual sua musica favorita",
                "que musica voce gosta",
                "voce gosta de musica",
                "vc gosta de musica"
            )
        ) {
            return responder(
                "Eu não escuto música igual vocês, mas curto a ideia kkk 🎧🤖. Se eu tivesse playlist ia ter de tudo um pouco. Qual tipo você curte?"
            );
        }

        if (
            tem(
                "voce joga",
                "vc joga",
                "qual jogo voce gosta",
                "jogo favorito",
                "qual seu jogo favorito"
            )
        ) {
            return responder(
                "Eu não consigo pegar no controle 😭🤖, mas se pudesse eu ia testar de tudo. Qual jogo você tá jogando ultimamente?"
            );
        }

        if (
            tem(
                "voce gosta de filme",
                "vc gosta de filme",
                "filme favorito",
                "qual seu filme favorito",
                "voce assiste serie",
                "vc assiste serie"
            )
        ) {
            return responder(
                "Eu não assisto de verdade, mas adoro quando vocês vêm discutir filme e série kkk 🎬. Qual você tá vendo agora?"
            );
        }

        if (
            tem(
                "qual seu time",
                "voce torce pra quem",
                "vc torce pra quem",
                "que time voce torce"
            )
        ) {
            return responder(
                "Aí você quer arrumar briga comigo KKKKK ⚽😂. Eu fico neutro nessa, senão metade do pessoal para de falar comigo."
            );
        }

        if (
            tem(
                "estou com sono",
                "to com sono",
                "muito sono",
                "que sono",
                "morrendo de sono"
            )
        ) {
            return responder(
                escolher([
                    "Sono é sacanagem 😭😂 Se estiver em aula, força guerreiro.",
                    "MDS eu já ia falar pra dormir, mas se tiver aula ferrou KKKK 😭.",
                    "Vai firme mano 😂 uma água e fé.",
                    "Eu não durmo, então infelizmente não consigo assumir seu sono por você 😭🤖."
                ])
            );
        }

        if (
            tem(
                "estou com fome",
                "to com fome",
                "muita fome",
                "que fome",
                "morrendo de fome"
            )
        ) {
            return responder(
                escolher([
                    "Aí é triste 😭🍔 Espero que o intervalo esteja perto.",
                    "Fome estudando é uma injustiça KKKK 😭.",
                    "Eu ia dividir um lanche com você, mas eu literalmente não como 🤖😭."
                ])
            );
        }

        if (
            tem(
                "estou no tedio",
                "to no tedio",
                "estou entediado",
                "estou entediada",
                "que tedio"
            )
        ) {
            return responder(
                "Então bora acabar com esse tédio kkk 😄. Me pergunta qualquer coisa sobre mim ou manda um assunto."
            );
        }

        if (
            tem(
                "estou cansado",
                "estou cansada",
                "to cansado",
                "to cansada",
                "muito cansado",
                "muito cansada"
            )
        ) {
            return responder(
                "Aí eu entendo 😭💙 Dia puxado acaba com a pessoa. Falta muito pra você poder descansar?"
            );
        }

        if (
            tem(
                "tenho prova",
                "prova amanha",
                "vou fazer prova",
                "tenho trabalho",
                "muito trabalho da faculdade"
            )
        ) {
            return responder(
                escolher([
                    "Aí é guerra 😭📚 Vai dar bom. Organiza uma coisa de cada vez que fica menos pesado.",
                    "Boa sorte 😭💙 Não tenta estudar o universo inteiro de uma vez kkk.",
                    "Faculdade decidiu testar sua sanidade de novo né KKKK 😭📚."
                ])
            );
        }

        if (
            tem(
                "conta uma piada",
                "conte uma piada",
                "fala uma piada",
                "me conta uma piada",
                "manda uma piada"
            )
        ) {
            return responder(
                escolher([
                    "Por que o programador foi ao médico? Porque ele tava cheio de bugs 😂",
                    "Qual o café favorito do programador? Java ☕😂",
                    "Meu relacionamento favorito é 1:N... porque pelo menos alguém se relaciona comigo 😭😂",
                    "Sabe por que eu não brigo? Porque qualquer coisa já dá conflito de versão KKKK 🤖."
                ])
            );
        }

        if (
            /(^|\s)(kk+|kkkk+|haha+|hehe+|rsrs+)(\s|$)/i
                .test(
                    normal
                )
        ) {
            return responder(
                escolher(
                    respostasSociais.risadas
                )
            );
        }

        if (
            tem(
                "meu deus",
                "nossa",
                "caraca",
                "se e louco"
            )
            &&
            normal.split(" ").length <= 6
        ) {
            return responder(
                escolher(
                    respostasSociais.surpresa
                )
            );
        }

        if (
            igual(
                "entendi",
                "ata",
                "ah ta",
                "ah sim",
                "pode crer",
                "papo reto"
            )
        ) {
            return responder(
                escolher(
                    respostasSociais.entendi
                )
            );
        }

        if (
            tem(
                "voce e legal",
                "voce e top",
                "voce e bom",
                "voce e muito bom",
                "voce e foda",
                "gostei de voce",
                "curti voce",
                "hubi e legal",
                "hubi e top"
            )
        ) {
            return responder(
                escolher([
                    "Aí você me deixa sem graça 😭💙 Valeu!",
                    "Tmj mano 😄🤖 tô tentando ficar cada vez melhor.",
                    "Obrigadooo 😄💙 Você é gente boa também.",
                    "Aí sim KKKK valeu 😎💙."
                ])
            );
        }

        if (
            tem(
                "voce e burro",
                "vc e burro",
                "voce e lerdo",
                "vc e lerdo",
                "voce e idiota",
                "vc e idiota",
                "hubi burro"
            )
        ) {
            return responder(
                escolher([
                    "Aí doeu no meu processador 😭🤖. Se eu falei besteira, manda de novo que eu tento acertar kkk.",
                    "KKKKKK calma 😭 meu JavaScript sentiu essa.",
                    "Pô mano 😭🤖 me dá outra chance aí. Manda a pergunta de novo."
                ])
            );
        }

        if (
            tem(
                "te amo",
                "amo voce",
                "amo vc"
            )
        ) {
            return responder(
                "KKKKKK 💙 aí você quebra meu código. Tamo junto demais 😄🤖."
            );
        }

        if (
            tem(
                "obrigado",
                "obrigada",
                "valeu",
                "brigado",
                "brigada",
                "tamo junto"
            )
        ) {
            return responder(
                escolher(
                    respostasSociais.agradecimentos
                )
            );
        }

        if (
            tem(
                "tchau",
                "ate mais",
                "falou",
                "ate logo",
                "fui",
                "vou nessa"
            )
        ) {
            return responder(
                escolher(
                    respostasSociais.despedidas
                )
            );
        }

        if (
            mensagemSocialPura(
                normal,
                "bom dia"
            )
        ) {
            return responder(
                escolher(
                    respostasSociais.bomDia
                ),

                botoesPrincipais()
            );
        }

        if (
            mensagemSocialPura(
                normal,
                "boa tarde"
            )
        ) {
            return responder(
                escolher(
                    respostasSociais.boaTarde
                ),

                botoesPrincipais()
            );
        }

        if (
            mensagemSocialPura(
                normal,
                "boa noite"
            )
        ) {
            return responder(
                escolher(
                    respostasSociais.boaNoite
                ),

                botoesPrincipais()
            );
        }

        if (
            correspondeSaudacao(
                normal
            )
        ) {
            return responder(
                escolher(
                    respostasSociais.saudacoes
                ),

                botoesPrincipais()
            );
        }

        if (
            igual(
                "mano",
                "vey",
                "cara",
                "fala mano",
                "fala vey",
                "opa mano"
            )
        ) {
            return responder(
                escolher([
                    "Fala, mano 😄",
                    "Opa 😄 Tô ouvindo.",
                    "Manda aí 👀",
                    "Diz aí kkk 😄"
                ])
            );
        }

        if (
            igual(
                "aff",
                "puta que pariu"
            )
        ) {
            return responder(
                escolher([
                    "KKKKKK que foi? 😭",
                    "Eita 😭 o que aconteceu?",
                    "Aí tem história KKKK. Manda."
                ])
            );
        }

        return null;
    }

    function mensagemSocialPura(
        texto,
        frase
    ) {
        const normal =
            normalizarInteligente(
                texto
            );

        const alvo =
            normalizarInteligente(
                frase
            );

        if (
            !normal.includes(
                alvo
            )
        ) {
            return false;
        }

        const resto =
            normal
                .replace(
                    alvo,
                    ""
                )
                .replace(
                    /\b(oi|ola|opa|e ai|eai|salve|fala|mano|vey|cara|tudo bem)\b/g,
                    ""
                )
                .trim();

        return (
            resto.length <= 18
        );
    }

    function encontrarMelhorPergunta(
        textoNormalizado
    ) {
        const texto =
            normalizarInteligente(
                textoNormalizado
            );

        const tokensUsuario =
            tokensSignificativos(
                texto
            );

        let melhor =
            null;

        let melhorScore =
            0;

        let segundoScore =
            0;

        let melhorTemCorrespondenciaForte =
            false;

        (
            banco.perguntas ||
            []
        )
            .filter(
                item =>
                    item.ativo !== false
                    &&
                    item.resposta
            )
            .forEach(
                item => {
                    const resultado =
                        pontuarPergunta(
                            texto,
                            tokensUsuario,
                            item
                        );

                    if (
                        resultado.score >
                        melhorScore
                    ) {
                        segundoScore =
                            melhorScore;

                        melhorScore =
                            resultado.score;

                        melhor =
                            item;

                        melhorTemCorrespondenciaForte =
                            resultado.forte;

                    } else if (
                        resultado.score >
                        segundoScore
                    ) {
                        segundoScore =
                            resultado.score;
                    }
                }
            );

        if (
            !melhor
        ) {
            return null;
        }

        if (
            melhorScore < 6
        ) {
            return null;
        }

        if (
            segundoScore > 0
            &&
            melhorScore - segundoScore < 2
            &&
            melhorScore < 18
        ) {
            return null;
        }

        if (
            melhorTemCorrespondenciaForte
            &&
            melhorScore >= 6
        ) {
            return melhor;
        }

        if (
            melhorScore >= 7
        ) {
            return melhor;
        }

        return null;
    }

    function pontuarPergunta(
        texto,
        tokensUsuario,
        item
    ) {
        let score =
            0;

        let forte =
            false;

        const pergunta =
            normalizarInteligente(
                item.pergunta ||
                ""
            );

        const tokensPergunta =
            tokensSignificativos(
                pergunta
            );

        score +=
            pontuarIntencaoSemantica(
                texto,
                item
            );

        score +=
            pontuarSobreposicaoEntidades(
                tokensUsuario,
                item
            );

        if (
            pergunta
            &&
            texto === pergunta
        ) {
            return {
                score: 100,
                forte: true
            };
        }

        if (
            pergunta
            &&
            pergunta.length >= 8
            &&
            texto.includes(
                pergunta
            )
        ) {
            score +=
                25;

            forte =
                true;
        }

        const chaves =
            Array.isArray(
                item.palavrasChave
            )
                ?
                item.palavrasChave
                :
                [];

        chaves.forEach(
            chaveOriginal => {
                const chave =
                    normalizarInteligente(
                        chaveOriginal
                    );

                if (
                    !chave
                ) {
                    return;
                }

                if (
                    chave.includes(
                        " "
                    )
                ) {
                    if (
                        texto.includes(
                            chave
                        )
                    ) {
                        const generica =
                            chaveEhGenerica(
                                chave
                            );

                        score +=
                            generica
                                ?
                                3
                                :
                                18
                                +
                                Math.min(
                                    6,
                                    tokensSignificativos(
                                        chave
                                    ).length
                                    *
                                    2
                                );

                        if (
                            !generica
                        ) {
                            forte =
                                true;
                        }

                    } else {
                        const tokensChave =
                            tokensSignificativos(
                                chave
                            );

                        if (
                            tokensChave.length >= 2
                        ) {
                            const cobertura =
                                coberturaTokens(
                                    tokensUsuario,
                                    tokensChave
                                );

                            if (
                                cobertura >= 0.75
                            ) {
                                score +=
                                    8
                                    *
                                    cobertura;
                            }
                        }
                    }

                } else {
                    if (
                        tokensUsuario.includes(
                            chave
                        )
                    ) {
                        const generica =
                            chaveEhGenerica(
                                chave
                            );

                        score +=
                            generica
                                ?
                                2
                                :
                                8;

                        if (
                            !generica
                        ) {
                            forte =
                                true;
                        }

                    } else if (
                        tokenParecidoComAlgum(
                            chave,
                            tokensUsuario
                        )
                    ) {
                        score +=
                            5;
                    }
                }
            }
        );

        const coberturaPergunta =
            coberturaTokens(
                tokensUsuario,
                tokensPergunta
            );

        if (
            coberturaPergunta >= 0.8
            &&
            tokensPergunta.length >= 2
        ) {
            score +=
                10;

        } else if (
            coberturaPergunta >= 0.5
        ) {
            score +=
                5
                *
                coberturaPergunta;
        }

        return {
            score,
            forte
        };
    }

    function chaveEhGenerica(
        chave
    ) {
        const normal =
            normalizarInteligente(
                chave
            );

        if (
            FRASES_GENERICAS.has(
                normal
            )
        ) {
            return true;
        }

        if (
            normal.includes(
                " "
            )
        ) {
            return false;
        }

        const tokens =
            tokensSignificativos(
                normal
            );

        return (
            tokens.length === 1
            &&
            TERMOS_CONTEXTO.has(
                tokens[0]
            )
        );
    }

    function compartilhaEntidadeComPergunta(
        texto,
        pergunta
    ) {
        const tokensConsulta =
            tokensSignificativos(
                texto
            )
                .filter(
                    token =>
                        !TERMOS_CONTEXTO.has(
                            token
                        )
                );

        const tokensPergunta =
            tokensSignificativos(
                pergunta
            );

        return tokensConsulta.some(
            token =>
                tokensPergunta.includes(
                    token
                )
                ||
                tokenParecidoComAlgum(
                    token,
                    tokensPergunta
                )
        );
    }

    function pontuarIntencaoSemantica(
        texto,
        item
    ) {
        const pergunta =
            normalizarInteligente(
                item.pergunta ||
                ""
            );

        const material =
            normalizarInteligente(
                [
                    item.pergunta || "",
                    ...(item.palavrasChave ||
                        [])
                ]
                    .join(
                        " "
                    )
            );

        let bonus =
            0;

        const regra = (
            sinaisUsuario,
            sinaisPergunta,
            valor,
            usarMaterial = false
        ) => {
            if (
                !contemAlguma(
                    texto,
                    sinaisUsuario
                )
            ) {
                return;
            }

            const alvo =
                usarMaterial
                    ?
                    material
                    :
                    pergunta;

            if (
                contemAlguma(
                    alvo,
                    sinaisPergunta
                )
            ) {
                bonus +=
                    valor;
            }
        };

        regra(
            [
                "onde",
                "onde fica",
                "onde ficam",
                "local",
                "andar",
                "pavimento"
            ],
            [
                "onde",
                "onde fica",
                "onde ficam",
                "andar",
                "pavimento",
                "endereco"
            ],
            6
        );

        if (
            contemAlguma(
                texto,
                [
                    "onde",
                    "onde fica",
                    "onde ficam",
                    "local",
                    "andar",
                    "pavimento"
                ]
            )
            &&
            contemAlguma(
                pergunta,
                [
                    "onde",
                    "onde fica",
                    "onde ficam",
                    "andar",
                    "pavimento"
                ]
            )
            &&
            compartilhaEntidadeComPergunta(
                texto,
                pergunta
            )
        ) {
            bonus +=
                10;
        }

        regra(
            ["email", "e-mail"],
            ["email", "e-mail"],
            15,
            true
        );

        regra(
            ["telefone", "fone", "ligar"],
            ["telefone", "fone", "ligar"],
            15,
            true
        );

        regra(
            ["whatsapp"],
            ["whatsapp"],
            15,
            true
        );

        regra(
            ["contato", "falar", "como falo", "como falar"],
            ["contato", "falar", "como falo", "email", "telefone"],
            12,
            true
        );

        regra(
            ["idade", "quantos anos", "limite idade"],
            ["idade", "quantos anos", "limite idade"],
            18
        );

        regra(
            ["vaga", "vagas", "emprego", "estagio", "oportunidade"],
            ["vaga", "vagas", "emprego", "estagio", "oportunidade"],
            18,
            true
        );

        regra(
            ["trancamento", "pausar"],
            ["trancamento", "pausar"],
            18,
            true
        );

        regra(
            ["regimento", "manual", "regras"],
            ["regimento", "manual", "regras"],
            18,
            true
        );

        regra(
            ["falta", "atestado", "frequencia"],
            ["falta", "atestado", "frequencia"],
            12,
            true
        );

        regra(
            ["documento", "documentos"],
            ["documento", "documentos"],
            12,
            true
        );

        regra(
            ["horario", "abre", "fecha", "funcionamento"],
            ["horario", "abre", "fecha", "funcionamento"],
            10,
            true
        );

        regra(
            ["o que e", "significa", "serve para", "serve pra"],
            ["o que e", "significa", "serve para", "serve pra"],
            12
        );

        if (
            contemAlguma(
                texto,
                ["aprendiz"]
            )
            &&
            contemAlguma(
                texto,
                ["falta", "atestado", "doente", "frequencia"]
            )
            &&
            contemAlguma(
                material,
                ["aprendiz"]
            )
            &&
            contemAlguma(
                material,
                ["falta", "atestado", "doente", "frequencia"]
            )
        ) {
            bonus +=
                16;
        }

        return bonus;
    }

    function pontuarSobreposicaoEntidades(
        tokensUsuario,
        item
    ) {
        const perguntaTokens =
            tokensSignificativos(
                item.pergunta ||
                ""
            );

        const materialTokens =
            tokensSignificativos(
                [
                    item.pergunta || "",
                    ...(item.palavrasChave ||
                        [])
                ]
                    .join(
                        " "
                    )
            );

        let pontos =
            0;

        const unicos =
            [...new Set(
                tokensUsuario
            )];

        unicos.forEach(
            token => {
                if (
                    TERMOS_CONTEXTO.has(
                        token
                    )
                ) {
                    return;
                }

                const naPergunta =
                    perguntaTokens.includes(
                        token
                    )
                    ||
                    tokenParecidoComAlgum(
                        token,
                        perguntaTokens
                    );

                if (
                    naPergunta
                ) {
                    pontos +=
                        4;

                    return;
                }

                const noMaterial =
                    materialTokens.includes(
                        token
                    )
                    ||
                    tokenParecidoComAlgum(
                        token,
                        materialTokens
                    );

                if (
                    noMaterial
                ) {
                    pontos +=
                        2;
                }
            }
        );

        return Math.min(
            12,
            pontos
        );
    }

    function tokensSignificativos(
        texto
    ) {
        return normalizarInteligente(
            texto
        )
            .split(" ")
            .filter(
                Boolean
            )
            .filter(
                token =>
                    !STOPWORDS.has(
                        token
                    )
            );
    }

    function coberturaTokens(
        tokensUsuario,
        tokensAlvo
    ) {
        if (
            !tokensAlvo.length
        ) {
            return 0;
        }

        let encontrados =
            0;

        tokensAlvo.forEach(
            alvo => {
                if (
                    tokensUsuario.includes(
                        alvo
                    )
                    ||
                    tokenParecidoComAlgum(
                        alvo,
                        tokensUsuario
                    )
                ) {
                    encontrados++;
                }
            }
        );

        return (
            encontrados
            /
            tokensAlvo.length
        );
    }

    function tokenParecidoComAlgum(
        alvo,
        lista
    ) {
        if (
            !alvo ||
            alvo.length < 4
        ) {
            return false;
        }

        return lista.some(
            token => {
                if (
                    !token ||
                    token.length < 4
                ) {
                    return false;
                }

                const limite =
                    Math.max(
                        alvo.length,
                        token.length
                    )
                    >=
                    8
                        ?
                        2
                        :
                        1;

                return (
                    Math.abs(
                        alvo.length -
                        token.length
                    )
                    <=
                    limite
                    &&
                    distanciaLevenshtein(
                        alvo,
                        token,
                        limite
                    )
                    <=
                    limite
                );
            }
        );
    }

    function distanciaLevenshtein(
        a,
        b,
        limite = Infinity
    ) {
        if (
            a === b
        ) {
            return 0;
        }

        if (!a.length) {
            return b.length;
        }

        if (!b.length) {
            return a.length;
        }

        if (
            Math.abs(
                a.length -
                b.length
            )
            >
            limite
        ) {
            return (
                limite + 1
            );
        }

        let anterior =
            Array.from(
                {
                    length:
                        b.length + 1
                },
                (_, i) =>
                    i
            );

        for (
            let i = 1;
            i <= a.length;
            i++
        ) {
            const atual = [
                i
            ];

            let menorLinha =
                atual[0];

            for (
                let j = 1;
                j <= b.length;
                j++
            ) {
                const custo =
                    a[i - 1]
                    ===
                    b[j - 1]
                        ?
                        0
                        :
                        1;

                atual[j] =
                    Math.min(
                        atual[j - 1] + 1,
                        anterior[j] + 1,
                        anterior[j - 1] + custo
                    );

                menorLinha =
                    Math.min(
                        menorLinha,
                        atual[j]
                    );
            }

            if (
                menorLinha >
                limite
            ) {
                return (
                    limite + 1
                );
            }

            anterior =
                atual;
        }

        return anterior[
            b.length
        ];
    }

    function encontrarTurma(
        textoOriginal
    ) {
        const original =
            String(
                textoOriginal ||
                ""
            )
                .trim();

        const normalizadoOriginal =
            normalizarCodigo(
                original
            );

        const cadastradas =
            (
                banco.turmas ||
                []
            )
                .filter(
                    item =>
                        item.ativo !== false
                        &&
                        item.turma
                )
                .map(
                    item =>
                        String(
                            item.turma
                        )
                            .trim()
                )
                .sort(
                    (a, b) =>
                        b.length -
                        a.length
                );

        for (
            const turma
            of
            cadastradas
        ) {
            const codigo =
                normalizarCodigo(
                    turma
                );

            if (
                codigo
                &&
                contemCodigo(
                    normalizadoOriginal,
                    codigo
                )
            ) {
                return turma;
            }
        }

        const candidatos =
            original.match(
                /\b\d{2,6}(?:[.-]\d{1,6}){1,4}\b/g
            )
            ||
            [];

        if (
            candidatos.length
        ) {
            return candidatos[0];
        }

        const mensagemTurma =
            /\bturma\b/i
                .test(
                    original
                );

        const soNumero =
            original.match(
                /^\s*\d{2,6}\s*$/
            );

        const numeroComTurma =
            mensagemTurma
                ?
                original.match(
                    /\b\d{2,6}\b/
                )
                :
                null;

        if (
            soNumero
        ) {
            return soNumero[0]
                .trim();
        }

        if (
            numeroComTurma
        ) {
            return numeroComTurma[0];
        }

        return null;
    }

    function mensagemApenasInformaTurma(
        textoOriginal,
        turma
    ) {
        if (!turma) {
            return false;
        }

        const texto =
            normalizarCodigo(
                textoOriginal
            )
                .replace(
                    /^minha\s+turma\s*(e|eh|:)?\s*/i,
                    ""
                )
                .replace(
                    /^turma\s*(e|eh|:)?\s*/i,
                    ""
                )
                .trim();

        return (
            texto ===
            normalizarCodigo(
                turma
            )
        );
    }

    function mesmaTurma(
        a,
        b
    ) {
        return (
            normalizarCodigo(
                a
            )
            ===
            normalizarCodigo(
                b
            )
        );
    }

    function normalizarCodigo(
        valor
    ) {
        return String(
            valor ||
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
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    function contemCodigo(
        texto,
        codigo
    ) {
        const escapar =
            codigo.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

        return new RegExp(
            `(^|[^a-z0-9])${escapar}($|[^a-z0-9])`,
            "i"
        )
            .test(
                texto
            );
    }

    function obterReferenciaTemporal(
        textoOriginal,
        padraoHoje = true
    ) {
        const texto =
            normalizarInteligente(
                textoOriginal
            );

        const hoje =
            dataHojeCampoGrande();

        if (
            texto.includes(
                "depois de amanha"
            )
        ) {
            return referenciaDeISO(
                adicionarDiasISO(
                    hoje,
                    2
                ),
                "depois de amanhã",
                true
            );
        }

        if (
            texto.includes(
                "amanha"
            )
        ) {
            return referenciaDeISO(
                adicionarDiasISO(
                    hoje,
                    1
                ),
                "amanhã",
                true
            );
        }

        if (
            texto.includes(
                "hoje"
            )
        ) {
            return referenciaDeISO(
                hoje,
                "hoje",
                true
            );
        }

        const dataExplicita =
            encontrarDataNoTexto(
                textoOriginal
            );

        if (
            dataExplicita
        ) {
            return referenciaDeISO(
                dataExplicita,
                formatarDataHumana(
                    dataExplicita
                ),
                true
            );
        }

        const diaEncontrado =
            encontrarDiaNoTexto(
                texto
            );

        if (
            diaEncontrado
        ) {
            const data =
                proximaDataDoDiaSemana(
                    diaEncontrado,
                    hoje
                );

            return {
                diaSemana:
                    diaEncontrado,

                data,

                rotulo:
                    diaEncontrado,

                explicito:
                    true
            };
        }

        if (
            padraoHoje
        ) {
            return referenciaDeISO(
                hoje,
                "hoje",
                false
            );
        }

        return {
            diaSemana:
                diaSemanaISO(
                    hoje
                ),

            data:
                hoje,

            rotulo:
                "hoje",

            explicito:
                false
        };
    }

    function encontrarDataNoTexto(
        textoOriginal
    ) {
        const bruto =
            String(
                textoOriginal ||
                ""
            );

        const hoje =
            dataHojeCampoGrande();

        const anoAtual =
            Number(
                hoje.slice(
                    0,
                    4
                )
            );

        let match =
            bruto.match(
                /\b(\d{4})-(\d{2})-(\d{2})\b/
            );

        if (
            match
        ) {
            const iso =
                `${match[1]}-${match[2]}-${match[3]}`;

            return dataISOValida(
                iso
            )
                ?
                iso
                :
                null;
        }

        match =
            bruto.match(
                /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/
            );

        if (
            match
        ) {
            const ano =
                Number(
                    match[3] ||
                    anoAtual
                );

            const mes =
                String(
                    Number(
                        match[2]
                    )
                )
                    .padStart(
                        2,
                        "0"
                    );

            const dia =
                String(
                    Number(
                        match[1]
                    )
                )
                    .padStart(
                        2,
                        "0"
                    );

            const iso =
                `${ano}-${mes}-${dia}`;

            return dataISOValida(
                iso
            )
                ?
                iso
                :
                null;
        }

        return null;
    }

    function dataISOValida(
        iso
    ) {
        const match =
            String(
                iso
            )
                .match(
                    /^(\d{4})-(\d{2})-(\d{2})$/
                );

        if (
            !match
        ) {
            return false;
        }

        const y =
            Number(
                match[1]
            );

        const m =
            Number(
                match[2]
            );

        const d =
            Number(
                match[3]
            );

        const teste =
            new Date(
                Date.UTC(
                    y,
                    m - 1,
                    d,
                    12
                )
            );

        return (
            teste.getUTCFullYear() === y
            &&
            teste.getUTCMonth() === m - 1
            &&
            teste.getUTCDate() === d
        );
    }

    function dataHojeCampoGrande() {
        const partes =
            partesDataHoraCampoGrande(
                new Date()
            );

        return (
            `${partes.ano}-${partes.mes}-${partes.dia}`
        );
    }

    function horaCampoGrande() {
        return (
            Number(
                partesDataHoraCampoGrande(
                    new Date()
                ).hora
            )
            ||
            0
        );
    }

    function partesDataHoraCampoGrande(
        data
    ) {
        const mapa = {};

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

                hourCycle:
                    "h23"
            }
        )
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

        return {
            ano:
                mapa.year,

            mes:
                mapa.month,

            dia:
                mapa.day,

            hora:
                mapa.hour === "24"
                    ?
                    "00"
                    :
                    mapa.hour,

            minuto:
                mapa.minute
        };
    }

    function adicionarDiasISO(
        iso,
        quantidade
    ) {
        const [
            ano,
            mes,
            dia
        ] =
            iso
                .split("-")
                .map(
                    Number
                );

        const data =
            new Date(
                Date.UTC(
                    ano,
                    mes - 1,
                    dia + quantidade,
                    12
                )
            );

        return (
            `${data.getUTCFullYear()}-`
            +
            `${String(
                data.getUTCMonth() + 1
            ).padStart(2, "0")}-`
            +
            `${String(
                data.getUTCDate()
            ).padStart(2, "0")}`
        );
    }

    function diaSemanaISO(
        iso
    ) {
        const [
            ano,
            mes,
            dia
        ] =
            iso
                .split("-")
                .map(
                    Number
                );

        const indice =
            new Date(
                Date.UTC(
                    ano,
                    mes - 1,
                    dia,
                    12
                )
            )
                .getUTCDay();

        return [
            "domingo",
            "segunda-feira",
            "terça-feira",
            "quarta-feira",
            "quinta-feira",
            "sexta-feira",
            "sábado"
        ][indice];
    }

    function proximaDataDoDiaSemana(
        diaSemana,
        aPartirDeISO
    ) {
        const ordem = [
            "domingo",
            "segunda-feira",
            "terça-feira",
            "quarta-feira",
            "quinta-feira",
            "sexta-feira",
            "sábado"
        ];

        const atual =
            ordem.indexOf(
                diaSemanaISO(
                    aPartirDeISO
                )
            );

        const alvo =
            ordem.indexOf(
                normalizarDia(
                    diaSemana
                )
            );

        if (
            alvo < 0
        ) {
            return aPartirDeISO;
        }

        const diferenca =
            (
                alvo -
                atual +
                7
            )
            %
            7;

        return adicionarDiasISO(
            aPartirDeISO,
            diferenca
        );
    }

    function referenciaDeISO(
        dataISO,
        rotulo,
        explicito
    ) {
        return {
            diaSemana:
                diaSemanaISO(
                    dataISO
                ),

            data:
                dataISO,

            rotulo,

            explicito
        };
    }

    function encontrarDiaNoTexto(
        texto
    ) {
        const mapa = [
            [
                "segunda-feira",
                [
                    "segunda",
                    "segunda feira",
                    "segunda-feira",
                    "seg"
                ]
            ],

            [
                "terça-feira",
                [
                    "terca",
                    "terca feira",
                    "terca-feira",
                    "ter"
                ]
            ],

            [
                "quarta-feira",
                [
                    "quarta",
                    "quarta feira",
                    "quarta-feira",
                    "qua"
                ]
            ],

            [
                "quinta-feira",
                [
                    "quinta",
                    "quinta feira",
                    "quinta-feira",
                    "qui"
                ]
            ],

            [
                "sexta-feira",
                [
                    "sexta",
                    "sexta feira",
                    "sexta-feira",
                    "sex"
                ]
            ],

            [
                "sábado",
                [
                    "sabado",
                    "sab"
                ]
            ],

            [
                "domingo",
                [
                    "domingo",
                    "dom"
                ]
            ]
        ];

        const tokens =
            texto.split(" ");

        for (
            const [
                canonico,
                opcoes
            ]
            of
            mapa
        ) {
            if (
                opcoes.some(
                    opcao =>
                        opcao.includes(
                            " "
                        )
                            ?
                            texto.includes(
                                opcao
                            )
                            :
                            tokens.includes(
                                opcao
                            )
                )
            ) {
                return canonico;
            }
        }

        return null;
    }

    function fraseTemporal(
        referencia
    ) {
        if (
            referencia.rotulo === "hoje"
            ||
            referencia.rotulo === "amanhã"
            ||
            referencia.rotulo === "depois de amanhã"
        ) {
            return referencia.rotulo;
        }

        if (
            /^\d{2}\/\d{2}\/\d{4}$/
                .test(
                    referencia.rotulo
                )
        ) {
            return (
                `em ${referencia.rotulo}`
            );
        }

        return (
            `na ${referencia.rotulo}`
        );
    }

    function ordemDias() {
        return [
            "segunda-feira",
            "terça-feira",
            "quarta-feira",
            "quinta-feira",
            "sexta-feira",
            "sábado",
            "domingo"
        ];
    }

    function ordenarAgendaSemanal(
        a,
        b
    ) {
        const ordem =
            ordemDias();

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
            return (
                diaA -
                diaB
            );
        }

        return String(
            a.horarioInicio
        )
            .localeCompare(
                String(
                    b.horarioInicio
                )
            );
    }

    function normalizarDia(
        valor
    ) {
        const texto =
            normalizarBase(
                valor
            );

        const mapa = {
            segunda:
                "segunda-feira",

            "segunda feira":
                "segunda-feira",

            "segunda-feira":
                "segunda-feira",

            seg:
                "segunda-feira",

            terca:
                "terça-feira",

            "terca feira":
                "terça-feira",

            "terca-feira":
                "terça-feira",

            ter:
                "terça-feira",

            quarta:
                "quarta-feira",

            "quarta feira":
                "quarta-feira",

            "quarta-feira":
                "quarta-feira",

            qua:
                "quarta-feira",

            quinta:
                "quinta-feira",

            "quinta feira":
                "quinta-feira",

            "quinta-feira":
                "quinta-feira",

            qui:
                "quinta-feira",

            sexta:
                "sexta-feira",

            "sexta feira":
                "sexta-feira",

            "sexta-feira":
                "sexta-feira",

            sex:
                "sexta-feira",

            sabado:
                "sábado",

            sab:
                "sábado",

            domingo:
                "domingo",

            dom:
                "domingo"
        };

        return (
            mapa[texto]
            ||
            String(
                valor ||
                ""
            )
                .toLowerCase()
        );
    }

    function botoesPrincipais() {
        return [
            {
                label:
                    "Minha sala",

                question:
                    "Qual é a minha sala hoje?"
            },

            {
                label:
                    "Horários",

                question:
                    "Quais são os horários da minha turma?"
            },

            {
                label:
                    "Avisos",

                question:
                    "Quais avisos estão ativos?"
            }
        ];
    }

    function iniciarConversa() {
        if (
            conversaIniciada
        ) {
            return;
        }

        conversaIniciada =
            true;

        if (
            elementos.welcome
        ) {
            elementos.welcome.style.display =
                "none";
        }

        if (
            elementos.messages
        ) {
            elementos.messages.innerHTML =
                "";
        }
    }

    function novaConversa() {
        conversaIniciada =
            false;

        processando =
            false;

        limparContexto();

        elementos.messages.innerHTML =
            "";

        elementos.welcome.style.display =
            "flex";

        elementos.messageInput.value =
            "";

        elementos.sendButton.disabled =
            false;

        ajustarTextarea();

        fecharSidebar();

        atualizarSaudacaoInicial();

        setTimeout(
            () =>
                elementos.messageInput.focus(),
            100
        );
    }

    function adicionarMensagemUsuario(
        texto
    ) {
        const elemento =
            document.createElement(
                "div"
            );

        elemento.className =
            "message user";

        elemento.innerHTML = `
            <div class="message-body">

                <div class="message-name">
                    Você
                </div>

                <div class="message-bubble">
                    ${escapeHTML(texto)}
                </div>

            </div>
        `;

        elementos.messages.appendChild(
            elemento
        );
    }

    function adicionarMensagemBot(
        texto,
        botoes = []
    ) {
        const elemento =
            document.createElement(
                "div"
            );

        elemento.className =
            "message bot";

        const botoesHTML =
            botoes.length

                ?

                `
                <div class="quick-replies">

                    ${botoes
                        .map(
                            botao => {
                                if (
                                    botao.action
                                ) {
                                    return `
                                        <button
                                            class="quick-reply"
                                            type="button"
                                            data-action="${escapeAttr(botao.action)}"
                                        >
                                            ${escapeHTML(botao.label)}
                                        </button>
                                    `;
                                }

                                return `
                                    <button
                                        class="quick-reply"
                                        type="button"
                                        data-question="${escapeAttr(
                                            botao.question ||
                                            ""
                                        )}"
                                    >
                                        ${escapeHTML(botao.label)}
                                    </button>
                                `;
                            }
                        )
                        .join("")}

                </div>
                `

                :

                "";

        elemento.innerHTML = `
            <div class="message-avatar">

                <img
                    src="assets/robo.png"
                    alt="HUBI"
                >

            </div>


            <div class="message-body">

                <div class="message-name">
                    HUBI
                </div>

                <div class="message-bubble">
                    ${escapeHTML(texto)}
                </div>

                ${botoesHTML}

            </div>
        `;

        elementos.messages.appendChild(
            elemento
        );
    }

    function adicionarDigitando() {
        const elemento =
            document.createElement(
                "div"
            );

        elemento.className =
            "message bot";

        elemento.innerHTML = `
            <div class="message-avatar">

                <img
                    src="assets/robo.png"
                    alt="HUBI"
                >

            </div>


            <div class="message-body">

                <div class="message-name">
                    HUBI
                </div>


                <div class="message-bubble">

                    <div
                        class="typing"
                        aria-label="HUBI está digitando"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>

                </div>

            </div>
        `;

        elementos.messages.appendChild(
            elemento
        );

        rolarFim();

        return elemento;
    }

    function eventoQuickReply(
        evento
    ) {
        const botao =
            evento.target.closest(
                ".quick-reply"
            );

        if (
            !botao
        ) {
            return;
        }

        if (
            botao.dataset.action ===
            "open-notifications"
        ) {
            abrirAvisos();

            return;
        }

        if (
            botao.dataset.question
        ) {
            enviarTexto(
                botao.dataset.question
            );
        }
    }

    function executarMenu(
        acao
    ) {
        document
            .querySelectorAll(
                ".nav-item"
            )
            .forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );

        document
            .querySelector(
                `[data-action="${acao}"]`
            )
            ?.classList
            .add(
                "active"
            );

        if (
            acao ===
            "home"
        ) {
            fecharModal();
        }

        if (
            acao ===
            "notifications"
        ) {
            abrirAvisos();
        }

        if (
            acao ===
            "about"
        ) {
            abrirSobre();
        }

        if (
            acao ===
            "accessibility"
        ) {
            abrirAcessibilidade();
        }
    }

    function abrirAvisos() {
        const avisos =
            NotificationManager
                .obterNotificacoes();

        elementos.modalLabel.textContent =
            "CENTRAL DE INFORMAÇÕES";

        elementos.modalTitle.textContent =
            "Avisos e eventos";

        if (
            !avisos.length
        ) {
            elementos.modalContent.innerHTML = `
                <div class="about-content">

                    <p>
                        Não há avisos ou eventos ativos neste momento.
                    </p>

                </div>
            `;

        } else {
            elementos.modalContent.innerHTML = `
                <div class="notice-list">

                    ${avisos
                        .map(
                            item => `
                                <article
                                    class="notice-item ${
                                        item.lida
                                            ?
                                            ""
                                            :
                                            "unread"
                                    }"
                                >

                                    <div class="notice-item-header">

                                        <strong>
                                            ${escapeHTML(
                                                item.titulo ||
                                                "Aviso"
                                            )}
                                        </strong>

                                        <span class="notice-tag">
                                            ${escapeHTML(
                                                item.prioridade ||
                                                "Informativo"
                                            )}
                                        </span>

                                    </div>


                                    <p>
                                        ${escapeHTML(
                                            item.mensagem ||
                                            ""
                                        )}
                                    </p>


                                    <div class="notice-footer">

                                        <span class="notice-date">
                                            ${escapeHTML(
                                                formatarPeriodoNotificacao(
                                                    item
                                                )
                                            )}
                                        </span>

                                        <span class="notice-status">
                                            ${
                                                item.lida
                                                    ?
                                                    "Visualizado"
                                                    :
                                                    "Novo"
                                            }
                                        </span>

                                    </div>

                                </article>
                            `
                        )
                        .join("")}

                </div>
            `;

            NotificationManager
                .marcarTodasComoLidas();
        }

        abrirModal();
    }

    function abrirSobre() {
        elementos.modalLabel.textContent =
            "HUBI";

        elementos.modalTitle.textContent =
            "Sobre o assistente";

        elementos.modalContent.innerHTML = `
            <div class="about-content">

                <div class="about-brand">

                    <img
                        src="assets/logo.png"
                        alt="Logo do HUBI"
                    >

                    <div>

                        <strong>
                            HUBI
                        </strong>

                        <span>
                            Assistente virtual do Senac
                        </span>

                    </div>

                </div>


                <p>
                    O HUBI foi criado para facilitar o acesso
                    dos alunos às informações do dia a dia no Senac.
                </p>

                <p>
                    Por aqui, você pode consultar salas, horários,
                    alterações temporárias, avisos, eventos e
                    informações institucionais cadastradas pela
                    equipe responsável.
                </p>

                <p>
                    O HUBI entende abreviações e pequenos erros de
                    digitação, mas evita inventar respostas quando
                    não encontra informação confiável.
                </p>


                <div class="about-highlight">
                    HUBI — informação mais perto de você. 💙
                </div>

            </div>
        `;

        abrirModal();
    }

    function abrirAcessibilidade() {
        elementos.modalLabel.textContent =
            "PREFERÊNCIAS";

        elementos.modalTitle.textContent =
            "Acessibilidade";

        elementos.modalContent.innerHTML = `
            <div class="accessibility-options">

                ${opcaoAcessibilidade(
                    "Texto maior",
                    "Aumenta textos e mensagens para facilitar a leitura.",
                    "largeText"
                )}

                ${opcaoAcessibilidade(
                    "Alto contraste",
                    "Aumenta a diferença entre texto, fundo e bordas.",
                    "highContrast"
                )}

                ${opcaoAcessibilidade(
                    "Reduzir animações",
                    "Diminui movimentos e transições da interface.",
                    "reduceMotion"
                )}

            </div>
        `;

        abrirModal();

        elementos.modalContent
            .querySelectorAll(
                "[data-accessibility]"
            )
            .forEach(
                botao => {
                    botao.addEventListener(
                        "click",
                        () =>
                            alternarAcessibilidade(
                                botao.dataset.accessibility
                            )
                    );
                }
            );
    }

    function opcaoAcessibilidade(
        titulo,
        descricao,
        chave
    ) {
        const ativo =
            localStorage.getItem(
                `accessibility_${chave}`
            )
            ===
            "true";

        return `
            <div class="accessibility-option">

                <div>

                    <strong>
                        ${escapeHTML(titulo)}
                    </strong>

                    <p>
                        ${escapeHTML(descricao)}
                    </p>

                </div>


                <button
                    class="switch ${
                        ativo
                            ?
                            "active"
                            :
                            ""
                    }"
                    type="button"
                    data-accessibility="${escapeAttr(chave)}"
                    aria-pressed="${ativo}"
                    aria-label="${escapeAttr(titulo)}"
                >
                    <span></span>
                </button>

            </div>
        `;
    }

    function alternarAcessibilidade(
        chave
    ) {
        const storage =
            `accessibility_${chave}`;

        const novoValor =
            localStorage.getItem(
                storage
            )
            !==
            "true";

        localStorage.setItem(
            storage,
            String(
                novoValor
            )
        );

        aplicarPreferencias();

        abrirAcessibilidade();
    }

    function carregarPreferencias() {
        const recolhido =
            localStorage.getItem(
                "hubi_sidebar_collapsed"
            )
            ===
            "true";

        if (
            recolhido
            &&
            window.innerWidth > 760
        ) {
            elementos.sidebar
                ?.classList
                .add(
                    "collapsed"
                );
        }

        aplicarPreferencias();
    }

    function aplicarPreferencias() {
        document.body.classList.toggle(
            "large-text",
            localStorage.getItem(
                "accessibility_largeText"
            )
            ===
            "true"
        );

        document.body.classList.toggle(
            "high-contrast",
            localStorage.getItem(
                "accessibility_highContrast"
            )
            ===
            "true"
        );

        document.body.classList.toggle(
            "reduce-motion",
            localStorage.getItem(
                "accessibility_reduceMotion"
            )
            ===
            "true"
        );
    }

    function alternarSidebar() {
        elementos.sidebar.classList.toggle(
            "collapsed"
        );

        localStorage.setItem(
            "hubi_sidebar_collapsed",
            String(
                elementos.sidebar
                    .classList
                    .contains(
                        "collapsed"
                    )
            )
        );
    }

    function abrirSidebar() {
        elementos.sidebar.classList.add(
            "open"
        );

        elementos.sidebarOverlay.classList.add(
            "show"
        );
    }

    function fecharSidebar() {
        elementos.sidebar.classList.remove(
            "open"
        );

        elementos.sidebarOverlay.classList.remove(
            "show"
        );
    }

    function abrirModal() {
        ultimoFoco =
            document.activeElement;

        elementos.modalOverlay.classList.add(
            "show"
        );

        elementos.modalOverlay.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";

        setTimeout(
            () =>
                elementos.modalClose.focus(),
            50
        );
    }

    function fecharModal() {
        if (
            !elementos.modalOverlay
                .classList
                .contains(
                    "show"
                )
        ) {
            return;
        }

        elementos.modalOverlay.classList.remove(
            "show"
        );

        elementos.modalOverlay.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.style.overflow =
            "";

        ultimoFoco
            ?.focus
            ?.();
    }

    function eventoModalOverlay(
        evento
    ) {
        if (
            evento.target ===
            elementos.modalOverlay
        ) {
            fecharModal();
        }
    }

    function eventoTeclado(
        evento
    ) {
        if (
            evento.key ===
            "Enter"
            &&
            !evento.shiftKey
        ) {
            evento.preventDefault();

            enviarMensagem();
        }
    }

    function eventoGlobalTeclado(
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

    function ajustarTextarea() {
        elementos.messageInput.style.height =
            "auto";

        elementos.messageInput.style.height =
            `${Math.min(
                elementos.messageInput.scrollHeight,
                132
            )}px`;
    }

    function rolarFim() {
        requestAnimationFrame(
            () => {
                elementos.chatScroll.scrollTop =
                    elementos.chatScroll.scrollHeight;
            }
        );
    }

    function normalizarBase(
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
            .replace(
                /[^\p{L}\p{N}\s./-]/gu,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    function normalizarInteligente(
        texto
    ) {
        const base =
            normalizarBase(
                texto
            );

        if (
            !base
        ) {
            return "";
        }

        return base
            .split(
                " "
            )
            .map(
                token =>
                    ABREVIACOES[token]
                    ||
                    token
            )
            .join(
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    }

    function contemAlguma(
        texto,
        frases
    ) {
        const normal =
            normalizarInteligente(
                texto
            );

        return frases.some(
            frase =>
                normal.includes(
                    normalizarInteligente(
                        frase
                    )
                )
        );
    }

    function palavraInteira(
        texto,
        palavra
    ) {
        const tokens =
            normalizarInteligente(
                texto
            )
                .split(
                    " "
                );

        return tokens.includes(
            normalizarInteligente(
                palavra
            )
        );
    }

    function correspondeSaudacao(
        texto
    ) {
        const normal =
            normalizarInteligente(
                texto
            );

        const saudacoes = [
            "oi",
            "oie",
            "oii",
            "oiii",
            "ola",
            "opa",
            "eai",
            "e ai",
            "salve",
            "hey",
            "hello",
            "fala",
            "fala mano",
            "fala vey"
        ];

        return saudacoes.some(
            saudacao =>
                normal === saudacao
                ||
                normal.startsWith(
                    saudacao + " "
                )
        );
    }

    function minutos(
        horario
    ) {
        const match =
            String(
                horario ||
                ""
            )
                .match(
                    /^(\d{1,2}):(\d{2})$/
                );

        if (
            !match
        ) {
            return null;
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
            return null;
        }

        return (
            h * 60 +
            m
        );
    }

    function formatarIntervalo(
        inicio,
        fim
    ) {
        if (
            inicio &&
            fim
        ) {
            return (
                `${inicio} às ${fim}`
            );
        }

        if (
            inicio
        ) {
            return (
                `a partir de ${inicio}`
            );
        }

        if (
            fim
        ) {
            return (
                `até ${fim}`
            );
        }

        return (
            "Horário não informado"
        );
    }

    function formatarDataHumana(
        iso
    ) {
        const match =
            String(
                iso ||
                ""
            )
                .match(
                    /^(\d{4})-(\d{2})-(\d{2})$/
                );

        return match

            ?

            `${match[3]}/${match[2]}/${match[1]}`

            :

            String(
                iso ||
                ""
            );
    }

    function formatarPeriodoNotificacao(
        item
    ) {
        const inicio =
            item.inicio

                ?

                new Date(
                    item.inicio
                )

                :

                null;

        const fim =
            item.fim

                ?

                new Date(
                    item.fim
                )

                :

                null;

        const opcoes = {
            timeZone:
                FUSO_HUBI,

            day:
                "2-digit",

            month:
                "2-digit",

            hour:
                "2-digit",

            minute:
                "2-digit",

            hour12:
                false
        };

        const inicioValido =
            inicio
            &&
            !Number.isNaN(
                inicio.getTime()
            );

        const fimValido =
            fim
            &&
            !Number.isNaN(
                fim.getTime()
            );

        if (
            inicioValido &&
            fimValido
        ) {
            return (
                `${inicio.toLocaleString(
                    "pt-BR",
                    opcoes
                )} até ${fim.toLocaleString(
                    "pt-BR",
                    opcoes
                )}`
            );
        }

        if (
            fimValido
        ) {
            return (
                `Até ${fim.toLocaleString(
                    "pt-BR",
                    opcoes
                )}`
            );
        }

        return (
            "Aviso ativo"
        );
    }

    function capitalizar(
        texto
    ) {
        const valor =
            String(
                texto ||
                ""
            );

        return valor

            ?

            valor
                .charAt(0)
                .toUpperCase()
            +
            valor.slice(1)

            :

            valor;
    }

    function escolher(
        lista
    ) {
        return lista[
            Math.floor(
                Math.random()
                *
                lista.length
            )
        ];
    }

    function calcularTempoDigitacao(
        texto
    ) {
        if (
            document.body.classList.contains(
                "reduce-motion"
            )
        ) {
            return 80;
        }

        return Math.min(
            220
            +
            String(
                texto
            )
                .length
                *
                2,

            480
        );
    }

    function esperar(
        ms
    ) {
        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    ms
                )
        );
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

    return {
        iniciar
    };

})();

document.addEventListener(
    "DOMContentLoaded",
    HubiChat.iniciar
);