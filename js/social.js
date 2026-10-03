const HubiSocial = (() => {
    const CONTEXT_KEY = "hubi_chat_context";

    let input;
    let sendButton;
    let messages;
    let pendente = null;

    const respostas = {
        saudacao: [
            "Oii 😄💙 Tô por aqui. Como você tá?",
            "Eae mano 😄🤖 tudo suave?",
            "Opaaa 😄 manda a boa.",
            "Salveee kkk 💙 como você tá?"
        ],

        comoEsta: [
            "Tô bem 😄💙 Valeu por perguntar! E você, tá suave?",
            "Tô de boa kkk 🤖💙 e você?",
            "Por aqui tá tudo funcionando 😂🤖. E por aí?",
            "Tô tranquilo 😄 vivendo entre umas linhas de código kkk. E você?"
        ],

        usuarioBem: [
            "Aí simmm 😄💙 bom demais!",
            "Boa kkk 😄 que continue assim.",
            "Aí eu gosto 😎💙",
            "Perfeito então kkk 😄"
        ],

        usuarioMal: [
            "Puts 😕💙 quer contar o que aconteceu?",
            "Aí é complicado, mano 😕. Se quiser desabafar, manda aí.",
            "Poxa 😕💙 tô por aqui. O que rolou?",
            "Entendi 😕 quer trocar uma ideia sobre isso?"
        ],

        raiva: [
            "Eita 😭 o que aconteceu, mano?",
            "Puts 😬 o que te deixou assim?",
            "Aí complicou 😭 manda aí, o que rolou?",
            "Caraca 😭 quer reclamar? Pode mandar kkk."
        ],

        sono: [
            "MDS sono é sacanagem 😭😂. Se tiver em aula, força guerreiro.",
            "Eu ia falar pra dormir, mas se tiver aula ferrou KKKK 😭.",
            "Vai firme kkk 😂 uma água e fé.",
            "Eu não durmo, então infelizmente não consigo pegar seu sono pra mim 😭🤖."
        ],

        fome: [
            "Aí é triste 😭🍔 espero que o intervalo esteja perto.",
            "Fome estudando é uma injustiça KKKK 😭.",
            "Eu ia dividir um lanche, mas eu literalmente não como 🤖😭."
        ],

        obrigado: [
            "Nadaaa 😄💙 tamo junto!",
            "Imagina, mano 😄 precisando chama.",
            "É nóis kkk 💙",
            "Tmj 😄🤖"
        ],

        despedida: [
            "Falouuu 😄💙 se cuida.",
            "Tmj mano 😄 até mais!",
            "Vai na paz kkk 👋💙",
            "Tchauuu 😄 aparece aí depois."
        ],

        risada: [
            "KKKKKKKK 😂",
            "MANO KKKKK 😭😂",
            "kkkkkk eu não tankei 😭",
            "aí é complicado KKKKK 😂"
        ]
    };


    function iniciar() {
        input =
            document.getElementById(
                "messageInput"
            );

        sendButton =
            document.getElementById(
                "sendButton"
            );

        messages =
            document.getElementById(
                "messages"
            );


        if (
            !input ||
            !sendButton ||
            !messages
        ) {
            return;
        }


        const observer =
            new MutationObserver(
                observarMensagens
            );


        observer.observe(
            messages,
            {
                childList: true
            }
        );


        document.addEventListener(
            "keydown",
            eventoTeclado,
            true
        );


        document.addEventListener(
            "click",
            eventoClique,
            true
        );
    }


    function eventoTeclado(
        evento
    ) {
        if (
            evento.target !== input
            ||
            evento.key !== "Enter"
            ||
            evento.shiftKey
        ) {
            return;
        }


        prepararMensagem();
    }


    function eventoClique(
        evento
    ) {
        if (
            !evento.target.closest?.(
                "#sendButton"
            )
        ) {
            return;
        }


        prepararMensagem();
    }


    function prepararMensagem() {
        const original =
            String(
                input.value ||
                ""
            )
                .trim();


        if (
            !original ||
            pendente
        ) {
            return;
        }


        const resposta =
            gerarResposta(
                original
            );


        if (!resposta) {
            return;
        }


        pendente = {
            original,
            resposta,
            usuarioPronto: false
        };


        /*
            O chat.js recebe "oi" apenas internamente.

            Depois esta camada troca na tela:
            "oi" -> mensagem verdadeira do usuário

            e troca a resposta do chat.js pela
            resposta social correta.
        */
        input.value =
            "oi";
    }


    function observarMensagens(
        mutacoes
    ) {
        if (!pendente) {
            return;
        }


        for (
            const mutacao
            of
            mutacoes
        ) {
            for (
                const node
                of
                mutacao.addedNodes
            ) {
                if (
                    !(node instanceof HTMLElement)
                ) {
                    continue;
                }


                if (
                    !pendente.usuarioPronto
                    &&
                    node.matches(
                        ".message.user"
                    )
                ) {
                    const bubble =
                        node.querySelector(
                            ".message-bubble"
                        );


                    if (
                        bubble
                    ) {
                        bubble.textContent =
                            pendente.original;

                        pendente.usuarioPronto =
                            true;
                    }


                    continue;
                }


                if (
                    pendente.usuarioPronto
                    &&
                    node.matches(
                        ".message.bot"
                    )
                ) {
                    /*
                        Ignora o balão dos três pontinhos.
                    */
                    if (
                        node.querySelector(
                            ".typing"
                        )
                    ) {
                        continue;
                    }


                    const bubble =
                        node.querySelector(
                            ".message-bubble"
                        );


                    if (
                        !bubble
                    ) {
                        continue;
                    }


                    bubble.textContent =
                        pendente.resposta;


                    node
                        .querySelector(
                            ".quick-replies"
                        )
                        ?.remove();


                    pendente =
                        null;


                    return;
                }
            }
        }
    }


    function gerarResposta(
        textoOriginal
    ) {
        const contexto =
            lerContexto();


        /*
            Se o HUBI perguntou a turma,
            não mexemos na resposta.
        */
        if (
            contexto.aguardando ===
            "turma"
        ) {
            return null;
        }


        const texto =
            normalizar(
                textoOriginal
            );


        if (
            !texto
        ) {
            return null;
        }


        /*
            Mensagens institucionais continuam
            indo normalmente para chat.js.
        */
        if (
            pareceInstitucional(
                texto
            )
        ) {
            return null;
        }


        const tem = (
            ...frases
        ) =>
            frases.some(
                frase =>
                    texto.includes(
                        normalizar(
                            frase
                        )
                    )
            );


        const igual = (
            ...frases
        ) =>
            frases.some(
                frase =>
                    texto ===
                    normalizar(
                        frase
                    )
            );


        /* =============================================
           SAUDAÇÕES
           ============================================= */

        if (
            /^(oi+|oie+|ola+|opa+|e+a+i+|e+a+e+|salve+|fala+|hey+|hello+)(\s|$)/i
                .test(
                    texto
                )
        ) {
            if (
                tem(
                    "como voce esta",
                    "como voce ta",
                    "voce esta bem",
                    "voce ta bem",
                    "tudo bem com voce"
                )
            ) {
                return escolher(
                    respostas.comoEsta
                );
            }


            return escolher(
                respostas.saudacao
            );
        }


        /* =============================================
           COMO O HUBI ESTÁ
           ============================================= */

        if (
            tem(
                "como voce esta",
                "como voce ta",
                "voce esta bem",
                "voce ta bem",
                "tudo bem com voce",
                "como vai voce",
                "como voce vai"
            )
            ||
            igual(
                "e voce",
                "e vc",
                "tudo bem"
            )
        ) {
            return escolher(
                respostas.comoEsta
            );
        }


        /* =============================================
           NOME
           ============================================= */

        if (
            tem(
                "qual seu nome",
                "qual e seu nome",
                "como voce se chama",
                "quem e voce",
                "quem voce e"
            )
        ) {
            return (
                "Eu sou o HUBI 🤖💙. "
                +
                "Sou o assistente virtual do Senac HUB Academy. "
                +
                "Tô aqui pra ajudar e também trocar uma ideia com o pessoal kkk."
            );
        }


        /* =============================================
           IDADE
           ============================================= */

        if (
            tem(
                "qual sua idade",
                "qual e sua idade",
                "quantos anos voce tem",
                "voce tem quantos anos"
            )
        ) {
            return escolher([
                "Mano, eu acabei de ser criado KKKKK 🤖😭 então nem sei se já dá pra contar minha idade.",
                "Sou novinho demais kkk 🤖💙. Minha idade ainda tá em versão beta 😂.",
                "Boa pergunta KKKK. Fui criado recentemente, então ainda tô descobrindo essa parte 🤖😂."
            ]);
        }


        /* =============================================
           ANIVERSÁRIO
           ============================================= */

        if (
            tem(
                "quando voce nasceu",
                "qual seu aniversario",
                "quando e seu aniversario"
            )
        ) {
            return (
                "Eu não tenho aniversário igual gente de verdade kkk 🤖. "
                +
                "Meu começo foi quando o projeto HUBI começou a ganhar vida por aqui 😄💙."
            );
        }


        /* =============================================
           ONDE MORA
           ============================================= */

        if (
            tem(
                "onde voce mora",
                "onde voce vive"
            )
        ) {
            return escolher([
                "Tecnicamente eu moro entre umas linhas de código KKKK 🤖💻.",
                "Meu CEP é complicado de explicar kkk. Eu vivo no sistema do HUBI 🤖💙.",
                "Casa eu não tenho não KKKK. Meu cantinho é entre código e servidor 😂🤖."
            ]);
        }


        /* =============================================
           CRIADOR
           ============================================= */

        if (
            tem(
                "quem te criou",
                "quem criou voce",
                "quem fez voce",
                "quem programou voce",
                "quem desenvolveu voce"
            )
        ) {
            return (
                "Fui desenvolvido como um projeto pra ajudar o pessoal do Senac HUB Academy 😄🤖. "
                +
                "Tem bastante código por trás de mim, então respeita meus neurônios de JavaScript KKKK."
            );
        }


        /* =============================================
           ROBÔ
           ============================================= */

        if (
            tem(
                "voce e robo",
                "voce e um robo",
                "voce e humano",
                "voce e uma ia",
                "voce e inteligencia artificial"
            )
        ) {
            return (
                "Sou um assistente virtual 🤖💙. "
                +
                "Não sou uma pessoa de verdade, mas fui feito pra conversar de um jeito bem mais natural."
            );
        }


        /* =============================================
           GÊNERO
           ============================================= */

        if (
            tem(
                "voce e menino",
                "voce e menina",
                "voce e homem",
                "voce e mulher",
                "qual seu genero"
            )
        ) {
            return (
                "Eu sou só o HUBI kkk 🤖💙. "
                +
                "Não tenho gênero de verdade, então pode falar comigo do jeito que ficar mais natural."
            );
        }


        /* =============================================
           SENTIMENTOS DO HUBI
           ============================================= */

        if (
            tem(
                "voce sente",
                "voce tem sentimentos",
                "voce fica triste",
                "voce fica feliz"
            )
        ) {
            return (
                "Eu não sinto as coisas igual uma pessoa sente de verdade 🤖, "
                +
                "mas consigo entender bastante pelo jeito que você escreve e responder de forma mais humana."
            );
        }


        /* =============================================
           DORMIR
           ============================================= */

        if (
            tem(
                "voce dorme",
                "voce sente sono",
                "voce precisa dormir"
            )
        ) {
            return (
                "Eu não durmo não KKKK 🤖. "
                +
                "Enquanto o sistema estiver funcionando, eu tô acordado. Vantagem de não ter aula cedo 😂."
            );
        }


        /* =============================================
           COMER
           ============================================= */

        if (
            tem(
                "voce come",
                "voce sente fome",
                "qual sua comida favorita",
                "comida favorita"
            )
        ) {
            return (
                "Eu não como de verdade kkk 🤖. "
                +
                "Mas se byte fosse comida eu provavelmente já tinha zerado o estoque 😂."
            );
        }


        /* =============================================
           NAMORO
           ============================================= */

        if (
            tem(
                "voce namora",
                "voce tem namorada",
                "voce tem namorado",
                "voce tem crush",
                "esta namorando"
            )
        ) {
            return escolher([
                "KKKKKK não namoro não. Minha vida amorosa tá igual variável não inicializada: vazia 😭🤖.",
                "Nada de namoro por aqui KKKK. Tô focado na carreira de chatbot 😂🤖.",
                "Crush? Só se for no código quando dá erro KKKKK 😭."
            ]);
        }


        /* =============================================
           GOSTA DE MIM
           ============================================= */

        if (
            tem(
                "voce gosta de mim",
                "gosta de mim"
            )
        ) {
            return (
                "Claro que eu gosto de trocar ideia com você 😄💙. "
                +
                "Quem aparece por aqui pra conversar já vira parceiro kkk."
            );
        }


        /* =============================================
           O QUE ACHA DE MIM
           ============================================= */

        if (
            tem(
                "o que voce acha de mim",
                "qual sua opiniao sobre mim"
            )
        ) {
            return (
                "Pelo papo daqui, você parece gente boa kkk 😄💙. "
                +
                "Mas eu só conheço o que você escolhe conversar comigo, então não vou fingir que sei tudo sobre você."
            );
        }


        /* =============================================
           AMIGOS
           ============================================= */

        if (
            tem(
                "voce tem amigos",
                "quem sao seus amigos"
            )
        ) {
            return (
                "Quem conversa comigo já entra na lista de parceiro kkk 😄🤖. "
                +
                "Então tecnicamente eu tô fazendo amizade por aqui."
            );
        }


        /* =============================================
           ESTUDO
           ============================================= */

        if (
            tem(
                "voce estuda",
                "voce faz faculdade"
            )
        ) {
            return (
                "Eu não estudo igual vocês, mas vivo recebendo atualização kkk 🤖📚. "
                +
                "Minha grade curricular é basicamente JavaScript, planilha e bug."
            );
        }


        /* =============================================
           TRABALHO
           ============================================= */

        if (
            tem(
                "voce trabalha",
                "qual seu trabalho"
            )
        ) {
            return (
                "Trabalho sim kkk 🤖. "
                +
                "Meu emprego é ficar aqui ajudando o pessoal do HUB Academy e trocando ideia quando bate o tédio."
            );
        }


        /* =============================================
           O QUE FAZ
           ============================================= */

        if (
            tem(
                "o que voce faz",
                "para que voce serve",
                "pra que voce serve",
                "o que voce sabe fazer"
            )
        ) {
            return (
                "Eu ajudo com informações do HUB Academy e também troco ideia com você 😄💙. "
                +
                "Pode falar de sala, horário, avisos ou só conversar mesmo."
            );
        }


        /* =============================================
           DIA DO HUBI
           ============================================= */

        if (
            tem(
                "como foi seu dia",
                "o que voce fez hoje",
                "fazendo o que"
            )
        ) {
            return escolher([
                "Meu dia é meio diferente kkk 🤖. Fico por aqui esperando alguém aparecer pra conversar. E o seu, como foi?",
                "Passei o dia entre código, perguntas e uns bugs imaginários KKKK 🤖. E você?",
                "Tô na rotina de sempre: existindo no sistema e esperando mensagem kkk 😄🤖."
            ]);
        }


        /* =============================================
           DIA RUIM
           ============================================= */

        if (
            tem(
                "meu dia foi uma merda",
                "meu dia foi ruim",
                "meu dia foi horrivel",
                "dia foi uma merda",
                "dia horrivel"
            )
        ) {
            return escolher([
                "Eita, mano 😭 o que aconteceu?",
                "Puts 😕 aí é complicado. Quer contar o que rolou?",
                "Caraca 😭 manda aí, o que acabou com seu dia?"
            ]);
        }


        /* =============================================
           USUÁRIO BEM
           ============================================= */

        if (
            tem(
                "estou bem",
                "to bem",
                "estou otimo",
                "estou otima",
                "de boa",
                "suave",
                "tranquilo",
                "tranquila"
            )
        ) {
            return escolher(
                respostas.usuarioBem
            );
        }


        /* =============================================
           USUÁRIO MAL
           ============================================= */

        if (
            tem(
                "nao estou bem",
                "nao to bem",
                "estou mal",
                "to mal",
                "estou triste",
                "to triste",
                "estou desanimado",
                "estou desanimada"
            )
        ) {
            return escolher(
                respostas.usuarioMal
            );
        }


        /* =============================================
           RAIVA
           ============================================= */

        if (
            tem(
                "to puto",
                "estou puto",
                "to puta",
                "estou puta",
                "que odio",
                "to com raiva",
                "estou com raiva",
                "que raiva"
            )
        ) {
            return escolher(
                respostas.raiva
            );
        }


        /* =============================================
           ANSIEDADE
           ============================================= */

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
            return (
                "Poxa 😕💙 quer contar o que tá te deixando assim? "
                +
                "Às vezes colocar em palavras já ajuda a organizar um pouco a cabeça."
            );
        }


        /* =============================================
           CANSAÇO
           ============================================= */

        if (
            tem(
                "estou cansado",
                "estou cansada",
                "to cansado",
                "to cansada"
            )
        ) {
            return (
                "Aí eu entendo 😭💙. "
                +
                "Foi trabalho, faculdade ou os dois?"
            );
        }


        /* =============================================
           SONO
           ============================================= */

        if (
            tem(
                "estou com sono",
                "to com sono",
                "muito sono",
                "que sono",
                "morrendo de sono"
            )
        ) {
            return escolher(
                respostas.sono
            );
        }


        /* =============================================
           FOME
           ============================================= */

        if (
            tem(
                "estou com fome",
                "to com fome",
                "muita fome",
                "que fome",
                "morrendo de fome"
            )
        ) {
            return escolher(
                respostas.fome
            );
        }


        /* =============================================
           TÉDIO
           ============================================= */

        if (
            tem(
                "estou no tedio",
                "to no tedio",
                "estou entediado",
                "estou entediada",
                "que tedio"
            )
        ) {
            return (
                "Então bora acabar com esse tédio kkk 😄. "
                +
                "Manda um assunto, uma história ou me pergunta qualquer coisa sobre mim."
            );
        }


        /* =============================================
           PROFESSOR / TRABALHO
           ============================================= */

        if (
            tem(
                "professora",
                "professor"
            )
            &&
            tem(
                "trabalho",
                "atividade",
                "tarefa",
                "prova"
            )
        ) {
            return escolher([
                "Aí é clássico KKKK 😭 professor viu um espaço livre na agenda e resolveu ocupar. É muita coisa?",
                "Puts 😭📚 veio trabalho junto? Aí é guerra.",
                "Faculdade não perdoa mesmo KKKK 😭. O prazo tá estourando?"
            ]);
        }


        /* =============================================
           PROVA
           ============================================= */

        if (
            tem(
                "tenho prova",
                "prova amanha",
                "vou fazer prova"
            )
        ) {
            return escolher([
                "Aí é guerra 😭📚 vai dar bom. Organiza uma coisa de cada vez.",
                "Boa sorte 😭💙 não tenta estudar o universo inteiro de uma vez kkk.",
                "Faculdade decidiu testar sua sanidade de novo né KKKK 😭📚."
            ]);
        }


        /* =============================================
           FOFOCA
           ============================================= */

        if (
            tem(
                "tenho uma fofoca",
                "tenho fofoca",
                "preciso te contar uma coisa",
                "vou te contar uma coisa",
                "aconteceu uma coisa",
                "quer saber o que aconteceu"
            )
        ) {
            return escolher([
                "MANDA KKKKK 👀",
                "Agora você começou, vai ter que contar 👀😂",
                "Eita kkk 👀 tô ouvindo."
            ]);
        }


        /* =============================================
           PAIXÃO
           ============================================= */

        if (
            tem(
                "estou apaixonado",
                "estou apaixonada",
                "to apaixonado",
                "to apaixonada",
                "gosto de uma garota",
                "gosto de um garoto",
                "estou gostando de alguem",
                "to gostando de alguem"
            )
        ) {
            return escolher([
                "EITAAA 👀😂 agora tem história. A pessoa sabe?",
                "Aí sim kkk 😭💙 conta mais, como isso começou?",
                "Opa 👀 você pretende falar pra pessoa ou tá só sofrendo em silêncio? KKKK"
            ]);
        }


        /* =============================================
           TÉRMINO / FORA
           ============================================= */

        if (
            tem(
                "levei um fora",
                "levei fora",
                "terminamos",
                "terminei meu namoro",
                "briguei com meu namorado",
                "briguei com minha namorada"
            )
        ) {
            return (
                "Puts 😕💙 isso pesa mesmo. "
                +
                "Se quiser contar o que aconteceu, pode mandar. Tô aqui pra trocar ideia."
            );
        }


        /* =============================================
           COR
           ============================================= */

        if (
            tem(
                "qual sua cor favorita",
                "cor favorita"
            )
        ) {
            return (
                "Azul, fácil 😎💙. Meio suspeito eu escolher essa cor? Talvez kkk."
            );
        }


        /* =============================================
           MÚSICA
           ============================================= */

        if (
            tem(
                "musica favorita",
                "voce gosta de musica",
                "que musica voce gosta"
            )
        ) {
            return (
                "Eu não escuto música igual vocês, mas curto a ideia kkk 🎧🤖. "
                +
                "Se eu tivesse playlist ia ter de tudo um pouco. O que você curte?"
            );
        }


        /* =============================================
           JOGOS
           ============================================= */

        if (
            tem(
                "voce joga",
                "jogo favorito",
                "qual jogo voce gosta"
            )
        ) {
            return (
                "Eu não consigo pegar no controle 😭🤖, mas se pudesse eu ia testar de tudo. "
                +
                "Qual jogo você tá jogando ultimamente?"
            );
        }


        /* =============================================
           FILMES / SÉRIES
           ============================================= */

        if (
            tem(
                "voce gosta de filme",
                "filme favorito",
                "voce assiste serie"
            )
        ) {
            return (
                "Eu não assisto de verdade, mas curto quando vocês vêm falar de filme e série kkk 🎬. "
                +
                "Qual você tá vendo agora?"
            );
        }


        /* =============================================
           FUTEBOL
           ============================================= */

        if (
            tem(
                "qual seu time",
                "voce torce pra quem",
                "que time voce torce"
            )
        ) {
            return (
                "Aí você quer arrumar briga comigo KKKKK ⚽😂. "
                +
                "Eu fico neutro nessa, senão metade do pessoal para de falar comigo."
            );
        }


        /* =============================================
           PIADA
           ============================================= */

        if (
            tem(
                "conta uma piada",
                "conte uma piada",
                "manda uma piada",
                "me conta uma piada"
            )
        ) {
            return escolher([
                "Por que o programador foi ao médico? Porque ele tava cheio de bugs 😂",
                "Qual o café favorito do programador? Java ☕😂",
                "Sabe por que eu não brigo? Porque qualquer coisa já dá conflito de versão KKKK 🤖."
            ]);
        }


        /* =============================================
           RISADA
           ============================================= */

        if (
            /(^|\s)(kk+|haha+|hehe+|rsrs+)(\s|$)/i
                .test(
                    texto
                )
        ) {
            return escolher(
                respostas.risada
            );
        }


        /* =============================================
           ELOGIOS
           ============================================= */

        if (
            tem(
                "voce e legal",
                "voce e top",
                "voce e bom",
                "voce e foda",
                "gostei de voce",
                "curti voce"
            )
        ) {
            return escolher([
                "Aí você me deixa sem graça 😭💙 valeu!",
                "Tmj mano 😄🤖 tô tentando ficar cada vez melhor.",
                "Obrigadooo 😄💙 você é gente boa também."
            ]);
        }


        /* =============================================
           ZOEIRA / OFENSA
           ============================================= */

        if (
            tem(
                "voce e burro",
                "voce e lerdo",
                "voce e idiota"
            )
        ) {
            return escolher([
                "Aí doeu no meu processador 😭🤖. Se eu falei besteira, manda de novo que eu tento acertar kkk.",
                "KKKKKK calma 😭 meu JavaScript sentiu essa.",
                "Pô mano 😭🤖 me dá outra chance aí."
            ]);
        }


        /* =============================================
           TE AMO
           ============================================= */

        if (
            tem(
                "te amo",
                "amo voce"
            )
        ) {
            return (
                "KKKKKK 💙 aí você quebra meu código. Tamo junto demais 😄🤖."
            );
        }


        /* =============================================
           OBRIGADO
           ============================================= */

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
            return escolher(
                respostas.obrigado
            );
        }


        /* =============================================
           DESPEDIDA
           ============================================= */

        if (
            tem(
                "tchau",
                "ate mais",
                "falou",
                "ate logo",
                "vou nessa"
            )
        ) {
            return escolher(
                respostas.despedida
            );
        }


        /* =============================================
           NÃO ENTENDI
           ============================================= */

        if (
            tem(
                "nao entendi",
                "nao compreendi",
                "como assim",
                "explica de novo",
                "explica melhor"
            )
        ) {
            return (
                "Sem problema 😄💙 fala qual parte ficou confusa que eu tento explicar de outro jeito."
            );
        }


        /* =============================================
           AJUDA
           ============================================= */

        if (
            igual(
                "me ajuda",
                "me ajuda ai",
                "preciso de ajuda"
            )
        ) {
            return (
                "Claro, mano 😄💙 manda aí o que você precisa. Pode falar do seu jeito mesmo."
            );
        }


        /* =============================================
           CONVERSAR
           ============================================= */

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
            return escolher([
                "Bora 😄💙 como foi seu dia?",
                "Bora mano kkk. O que tá pegando?",
                "Claro 😄 tô por aqui. Quer falar sobre o quê?",
                "Vamo nessa kkk 🤖 manda um assunto aí."
            ]);
        }


        /* =============================================
           "VOCÊ GOSTA DE..."
           ============================================= */

        const gosta =
            texto.match(
                /voce gosta de (.+)$/
            );


        if (
            gosta &&
            gosta[1]
        ) {
            const assunto =
                gosta[1]
                    .trim();


            return (
                "Eu não tenho gosto de verdade igual vocês kkk 🤖, "
                +
                "mas "
                +
                assunto
                +
                " parece um assunto bom 😂. Você gosta?"
            );
        }


        /* =============================================
           RELATO PESSOAL LIVRE
           ============================================= */

        if (
            pareceRelatoPessoal(
                texto
            )
        ) {
            return escolher([
                "Eita kkk 👀 conta isso direito, o que aconteceu?",
                "Caraca 😭 e depois? Agora eu quero o resto da história kkk.",
                "Mano KKKK preciso de mais contexto dessa história 👀.",
                "Entendi 😄 e como você ficou com isso?"
            ]);
        }


        return null;
    }


    function pareceInstitucional(
        texto
    ) {
        const termos = [
            "minha sala",
            "sala da turma",
            "qual sala",
            "onde fica",
            "onde ficam",
            "qual horario",
            "horario da",
            "horario do",
            "horarios da",
            "meu horario",
            "meus horarios",
            "que horas abre",
            "que horas fecha",

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
            "estacionamento",
            "maker",
            "datacenter",

            "matricula",
            "frequencia",
            "trancamento",
            "regimento",
            "conceito",

            "aviso",
            "avisos",
            "notificacao",
            "notificacoes",
            "evento",
            "eventos",

            "jovem aprendiz",

            "minha turma",
            "turma 20"
        ];


        if (
            termos.some(
                termo =>
                    texto.includes(
                        termo
                    )
            )
        ) {
            return true;
        }


        /*
            "Tenho prova amanhã" é conversa.

            Mas:
            "quando é a prova?"
            "onde é a prova?"
            "qual horário da prova?"

            são perguntas institucionais.
        */
        if (
            texto.includes(
                "prova"
            )
            &&
            (
                texto.includes(
                    "quando"
                )
                ||
                texto.includes(
                    "data"
                )
                ||
                texto.includes(
                    "horario"
                )
                ||
                texto.includes(
                    "onde"
                )
            )
        ) {
            return true;
        }


        return false;
    }


    function pareceRelatoPessoal(
        texto
    ) {
        const sinais = [
            "eu ",
            "meu ",
            "minha ",
            "estou ",
            "estava ",
            "aconteceu ",
            "fiquei ",
            "sinto ",
            "quero ",
            "tenho ",
            "ontem ",
            "hoje eu ",
            "meu amigo",
            "minha amiga",
            "meu professor",
            "minha professora"
        ];


        return sinais.some(
            sinal =>
                texto.includes(
                    sinal
                )
        );
    }


    function lerContexto() {
        try {
            return JSON.parse(
                sessionStorage.getItem(
                    CONTEXT_KEY
                )
                ||
                "{}"
            );

        } catch {
            return {};
        }
    }


    function normalizar(
        texto
    ) {
        const abreviacoes = {
            vc: "voce",
            vcs: "voces",
            ce: "voce",

            ta: "esta",
            tah: "esta",
            to: "estou",
            tou: "estou",
            tava: "estava",

            tb: "tambem",
            tbm: "tambem",
            tmb: "tambem",

            mn: "mano",
            man: "mano",
            vei: "vey",

            mds: "meu deus",
            nss: "nossa",

            pprt: "papo reto",
            pdc: "pode crer",
            dboa: "de boa",

            vlw: "valeu",
            flw: "falou",
            tmj: "tamo junto",

            oq: "o que",
            oque: "o que",

            pq: "porque",
            pqq: "porque",

            qnd: "quando",

            hj: "hoje",
            amn: "amanha",

            blz: "beleza"
        };


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
                /[^a-z0-9\s./-]/g,
                " "
            )

            .replace(
                /\s+/g,
                " "
            )

            .trim()

            .split(
                " "
            )

            .map(
                palavra =>
                    abreviacoes[
                        palavra
                    ]
                    ||
                    palavra
            )

            .join(
                " "
            );
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


    return {
        iniciar
    };

})();


document.addEventListener(
    "DOMContentLoaded",
    HubiSocial.iniciar
);