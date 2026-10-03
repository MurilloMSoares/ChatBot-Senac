const HubiSocial = (() => {
    const CONTEXT_KEY = "hubi_chat_context";
    const SOCIAL_CONTEXT_KEY = "hubi_social_context";

    let input = null;
    let sendButton = null;
    let messages = null;
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
            evento.target !== input ||
            evento.key !== "Enter" ||
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
                input?.value ||
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


        if (
            !resposta
        ) {
            return;
        }


        pendente = {
            original,
            resposta,
            usuarioPronto: false
        };


        /*
            O chat.js continua cuidando de toda a interface.

            Para uma mensagem social,
            ele recebe internamente "oi".

            O MutationObserver restaura
            a mensagem verdadeira do usuário
            e troca a resposta do bot.
        */
        input.value =
            "oi";
    }


    function observarMensagens(
        mutacoes
    ) {
        if (
            !pendente
        ) {
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
                        Ignora os três pontinhos
                        de "digitando".
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
        const contextoChat =
            lerContextoChat();


        /*
            Se o chat.js estiver esperando
            a turma, não interferimos.
        */
        if (
            contextoChat.aguardando ===
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
            Mensagens sensíveis ficam com o chat.js,
            que já possui tratamento próprio.
        */
        if (
            pareceSensivel(
                texto
            )
        ) {
            return null;
        }


        /*
            Informação oficial continua vindo
            do chat.js e do banco.
        */
        if (
            pareceInstitucional(
                texto
            )
        ) {
            return null;
        }


        const contextoSocial =
            lerContextoSocial();


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


        const responder = (
            mensagem,
            topico = null
        ) => {
            if (
                topico
            ) {
                salvarContextoSocial({
                    ultimoTopico:
                        topico,

                    ultimaMensagem:
                        texto
                });
            }


            return mensagem;
        };


        /* =================================================
           SAUDAÇÕES
           ================================================= */

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
                return responder(
                    escolher(
                        respostas.comoEsta
                    ),

                    "como_esta"
                );
            }


            return responder(
                escolher(
                    respostas.saudacao
                ),

                "saudacao"
            );
        }


        /* =================================================
           COMO O HUBI ESTÁ
           ================================================= */

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
            return responder(
                escolher(
                    respostas.comoEsta
                ),

                "como_esta"
            );
        }


        /* =================================================
           RESPOSTAS CURTAS NATURAIS
           ================================================= */

        if (
            igual(
                "bem",
                "otimo",
                "otima",
                "de boa",
                "suave"
            )
        ) {
            return responder(
                escolher(
                    respostas.usuarioBem
                ),

                "usuario_bem"
            );
        }


        if (
            igual(
                "mal",
                "mais ou menos",
                "pessimo",
                "pessima"
            )
        ) {
            return responder(
                escolher(
                    respostas.usuarioMal
                ),

                "usuario_mal"
            );
        }


        if (
            igual(
                "sim",
                "ss",
                "aham",
                "uhum"
            )
        ) {
            if (
                contextoSocial.ultimoTopico ===
                "usuario_mal"
            ) {
                return responder(
                    "Pode mandar, mano 💙. O que aconteceu?",

                    "desabafo"
                );
            }


            if (
                contextoSocial.ultimoTopico ===
                "fofoca"
            ) {
                return responder(
                    "Então conta logo KKKK 👀😂",

                    "fofoca"
                );
            }


            return responder(
                "Aaaah sim kkk 😄 manda aí.",

                "conversa"
            );
        }


        if (
            igual(
                "nao",
                "não",
                "nn"
            )
        ) {
            return responder(
                "Tranquilo kkk 😄 sem pressão.",

                "conversa"
            );
        }


        /* =================================================
           NOME
           ================================================= */

        if (
            tem(
                "qual seu nome",
                "qual e seu nome",
                "como voce se chama",
                "quem e voce",
                "quem voce e"
            )
        ) {
            return responder(
                "Eu sou o HUBI 🤖💙. "
                +
                "Sou o assistente virtual do Senac HUB Academy. "
                +
                "Tô aqui pra ajudar e também trocar uma ideia com o pessoal kkk.",

                "identidade"
            );
        }


        /* =================================================
           IDADE
           ================================================= */

        if (
            tem(
                "qual sua idade",
                "qual e sua idade",
                "quantos anos voce tem",
                "voce tem quantos anos"
            )
        ) {
            return responder(
                escolher([
                    "Mano, eu acabei de ser criado KKKKK 🤖😭 então nem sei se já dá pra contar minha idade.",

                    "Sou novinho demais kkk 🤖💙. Minha idade ainda tá em versão beta 😂.",

                    "Boa pergunta KKKK. Fui criado recentemente, então ainda tô descobrindo essa parte 🤖😂."
                ]),

                "idade"
            );
        }


        /* =================================================
           ANIVERSÁRIO
           ================================================= */

        if (
            tem(
                "quando voce nasceu",
                "qual seu aniversario",
                "quando e seu aniversario"
            )
        ) {
            return responder(
                "Eu não tenho aniversário igual gente de verdade kkk 🤖. "
                +
                "Meu começo foi quando o projeto HUBI começou a ganhar vida por aqui 😄💙.",

                "aniversario"
            );
        }


        /* =================================================
           ONDE O HUBI MORA
           ================================================= */

        if (
            tem(
                "onde voce mora",
                "voce mora onde",
                "onde voce vive",
                "onde fica voce",
                "onde voce fica"
            )
        ) {
            return responder(
                escolher([
                    "Tecnicamente eu moro entre umas linhas de código KKKK 🤖💻.",

                    "Meu CEP é complicado de explicar kkk. Eu vivo no sistema do HUBI 🤖💙.",

                    "Casa eu não tenho não KKKK. Meu cantinho é entre código e servidor 😂🤖."
                ]),

                "onde_mora"
            );
        }


        /* =================================================
           CRIADOR
           ================================================= */

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
                "Fui desenvolvido como um projeto pra ajudar o pessoal do Senac HUB Academy 😄🤖. "
                +
                "Tem bastante código por trás de mim, então respeita meus neurônios de JavaScript KKKK.",

                "criador"
            );
        }


        /* =================================================
           ROBÔ / IA
           ================================================= */

        if (
            tem(
                "voce e robo",
                "voce e um robo",
                "voce e humano",
                "voce e uma ia",
                "voce e inteligencia artificial"
            )
        ) {
            return responder(
                "Sou um assistente virtual 🤖💙. "
                +
                "Não sou uma pessoa de verdade, mas fui feito pra conversar de um jeito bem mais natural.",

                "identidade"
            );
        }


        /* =================================================
           GÊNERO
           ================================================= */

        if (
            tem(
                "voce e menino",
                "voce e menina",
                "voce e homem",
                "voce e mulher",
                "qual seu genero"
            )
        ) {
            return responder(
                "Eu sou só o HUBI kkk 🤖💙. "
                +
                "Não tenho gênero de verdade, então pode falar comigo do jeito que ficar mais natural.",

                "identidade"
            );
        }


        /* =================================================
           SENTIMENTOS DO HUBI
           ================================================= */

        if (
            tem(
                "voce sente",
                "voce tem sentimentos",
                "voce fica triste",
                "voce fica feliz"
            )
        ) {
            return responder(
                "Eu não sinto as coisas igual uma pessoa sente de verdade 🤖, "
                +
                "mas consigo entender bastante pelo jeito que você escreve e responder de forma mais humana.",

                "sentimentos_hubi"
            );
        }


        /* =================================================
           DORMIR
           ================================================= */

        if (
            tem(
                "voce dorme",
                "voce sente sono",
                "voce precisa dormir"
            )
        ) {
            return responder(
                "Eu não durmo não KKKK 🤖. "
                +
                "Enquanto o sistema estiver funcionando, eu tô acordado. "
                +
                "Vantagem de não ter aula cedo 😂.",

                "sono_hubi"
            );
        }


        /* =================================================
           COMER
           ================================================= */

        if (
            tem(
                "voce come",
                "voce sente fome",
                "qual sua comida favorita",
                "comida favorita"
            )
        ) {
            return responder(
                "Eu não como de verdade kkk 🤖. "
                +
                "Mas se byte fosse comida eu provavelmente já tinha zerado o estoque 😂.",

                "comida_hubi"
            );
        }


        /* =================================================
           NAMORO
           ================================================= */

        if (
            tem(
                "voce namora",
                "voce tem namorada",
                "voce tem namorado",
                "voce tem crush",
                "esta namorando"
            )
        ) {
            return responder(
                escolher([
                    "KKKKKK não namoro não. Minha vida amorosa tá igual variável não inicializada: vazia 😭🤖.",

                    "Nada de namoro por aqui KKKK. Tô focado na carreira de chatbot 😂🤖.",

                    "Crush? Só se for no código quando dá erro KKKKK 😭."
                ]),

                "namoro_hubi"
            );
        }


        /* =================================================
           GOSTA DO USUÁRIO
           ================================================= */

        if (
            tem(
                "voce gosta de mim",
                "gosta de mim"
            )
        ) {
            return responder(
                "Claro que eu gosto de trocar ideia com você 😄💙. "
                +
                "Quem aparece por aqui pra conversar já vira parceiro kkk.",

                "amizade"
            );
        }


        /* =================================================
           O QUE ACHA DO USUÁRIO
           ================================================= */

        if (
            tem(
                "o que voce acha de mim",
                "qual sua opiniao sobre mim"
            )
        ) {
            return responder(
                "Pelo papo daqui, você parece gente boa kkk 😄💙. "
                +
                "Mas eu só conheço o que você escolhe conversar comigo, "
                +
                "então não vou fingir que sei tudo sobre você.",

                "opiniao_usuario"
            );
        }


        /* =================================================
           AMIGOS
           ================================================= */

        if (
            tem(
                "voce tem amigos",
                "quem sao seus amigos"
            )
        ) {
            return responder(
                "Quem conversa comigo já entra na lista de parceiro kkk 😄🤖. "
                +
                "Então tecnicamente eu tô fazendo amizade por aqui.",

                "amizade"
            );
        }


        /* =================================================
           ESTUDO
           ================================================= */

        if (
            tem(
                "voce estuda",
                "voce faz faculdade"
            )
        ) {
            return responder(
                "Eu não estudo igual vocês, mas vivo recebendo atualização kkk 🤖📚. "
                +
                "Minha grade curricular é basicamente JavaScript, planilha e bug.",

                "estudo_hubi"
            );
        }


        /* =================================================
           TRABALHO
           ================================================= */

        if (
            tem(
                "voce trabalha",
                "qual seu trabalho"
            )
        ) {
            return responder(
                "Trabalho sim kkk 🤖. "
                +
                "Meu emprego é ficar aqui ajudando o pessoal do HUB Academy "
                +
                "e trocando ideia quando bate o tédio.",

                "trabalho_hubi"
            );
        }


        /* =================================================
           O QUE O HUBI FAZ
           ================================================= */

        if (
            tem(
                "o que voce faz",
                "para que voce serve",
                "pra que voce serve",
                "o que voce sabe fazer"
            )
        ) {
            return responder(
                "Eu ajudo com informações do HUB Academy e também troco ideia com você 😄💙. "
                +
                "Pode falar de sala, horário, avisos ou só conversar mesmo.",

                "funcoes"
            );
        }


        /* =================================================
           COMO FOI O DIA DO HUBI
           ================================================= */

        if (
            tem(
                "como foi seu dia",
                "o que voce fez hoje",
                "fazendo o que"
            )
        ) {
            return responder(
                escolher([
                    "Meu dia é meio diferente kkk 🤖. "
                    +
                    "Fico por aqui esperando alguém aparecer pra conversar. "
                    +
                    "E o seu, como foi?",

                    "Passei o dia entre código, perguntas e uns bugs imaginários KKKK 🤖. "
                    +
                    "E você?",

                    "Tô na rotina de sempre: existindo no sistema e esperando mensagem kkk 😄🤖."
                ]),

                "dia_hubi"
            );
        }


        /* =================================================
           DIA RUIM
           ================================================= */

        if (
            tem(
                "meu dia foi uma merda",
                "meu dia foi ruim",
                "meu dia foi horrivel",
                "dia foi uma merda",
                "dia horrivel"
            )
        ) {
            return responder(
                escolher([
                    "Eita, mano 😭 o que aconteceu?",

                    "Puts 😕 aí é complicado. Quer contar o que rolou?",

                    "Caraca 😭 manda aí, o que acabou com seu dia?"
                ]),

                "usuario_mal"
            );
        }


        /* =================================================
           USUÁRIO BEM
           ================================================= */

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
            return responder(
                escolher(
                    respostas.usuarioBem
                ),

                "usuario_bem"
            );
        }


        /* =================================================
           USUÁRIO MAL
           ================================================= */

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
            return responder(
                escolher(
                    respostas.usuarioMal
                ),

                "usuario_mal"
            );
        }


        /* =================================================
           RAIVA
           ================================================= */

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
            return responder(
                escolher(
                    respostas.raiva
                ),

                "raiva"
            );
        }


        /* =================================================
           ANSIEDADE
           ================================================= */

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
                "Poxa 😕💙 quer contar o que tá te deixando assim? "
                +
                "Às vezes colocar em palavras já ajuda a organizar um pouco a cabeça.",

                "ansiedade"
            );
        }


        /* =================================================
           CANSAÇO
           ================================================= */

        if (
            tem(
                "estou cansado",
                "estou cansada",
                "to cansado",
                "to cansada",
                "hoje foi puxado",
                "dia puxado"
            )
        ) {
            return responder(
                "Aí eu entendo 😭💙. Foi trabalho, faculdade ou os dois?",

                "cansaco"
            );
        }


        /* =================================================
           SONO
           ================================================= */

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
                escolher(
                    respostas.sono
                ),

                "sono"
            );
        }


        /* =================================================
           FOME
           ================================================= */

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
                escolher(
                    respostas.fome
                ),

                "fome"
            );
        }


        /* =================================================
           TÉDIO
           ================================================= */

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
                "Então bora acabar com esse tédio kkk 😄. "
                +
                "Manda um assunto, uma história ou me pergunta qualquer coisa sobre mim.",

                "tedio"
            );
        }


        /* =================================================
           PROFESSOR / TRABALHO
           ================================================= */

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
            return responder(
                escolher([
                    "Aí é clássico KKKK 😭 professor viu um espaço livre na agenda e resolveu ocupar. "
                    +
                    "É muita coisa?",

                    "Puts 😭📚 veio trabalho junto? Aí é guerra.",

                    "Faculdade não perdoa mesmo KKKK 😭. O prazo tá estourando?"
                ]),

                "faculdade"
            );
        }


        /* =================================================
           PROVA PESSOAL
           ================================================= */

        if (
            tem(
                "tenho prova",
                "prova amanha",
                "vou fazer prova"
            )
        ) {
            return responder(
                escolher([
                    "Aí é guerra 😭📚 vai dar bom. Organiza uma coisa de cada vez.",

                    "Boa sorte 😭💙 não tenta estudar o universo inteiro de uma vez kkk.",

                    "Faculdade decidiu testar sua sanidade de novo né KKKK 😭📚."
                ]),

                "prova_pessoal"
            );
        }


        /* =================================================
           FOFOCA
           ================================================= */

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
            return responder(
                escolher([
                    "MANDA KKKKK 👀",

                    "Agora você começou, vai ter que contar 👀😂",

                    "Eita kkk 👀 tô ouvindo."
                ]),

                "fofoca"
            );
        }


        /* =================================================
           PAIXÃO
           ================================================= */

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
            return responder(
                escolher([
                    "EITAAA 👀😂 agora tem história. A pessoa sabe?",

                    "Aí sim kkk 😭💙 conta mais, como isso começou?",

                    "Opa 👀 você pretende falar pra pessoa ou tá só sofrendo em silêncio? KKKK"
                ]),

                "paixao"
            );
        }


        /* =================================================
           TÉRMINO / FORA
           ================================================= */

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
            return responder(
                "Puts 😕💙 isso pesa mesmo. "
                +
                "Se quiser contar o que aconteceu, pode mandar. "
                +
                "Tô aqui pra trocar ideia.",

                "relacionamento"
            );
        }


        /* =================================================
           COR FAVORITA
           ================================================= */

        if (
            tem(
                "qual sua cor favorita",
                "cor favorita"
            )
        ) {
            return responder(
                "Azul, fácil 😎💙. Meio suspeito eu escolher essa cor? Talvez kkk.",

                "cor"
            );
        }


        /* =================================================
           MÚSICA
           ================================================= */

        if (
            tem(
                "musica favorita",
                "voce gosta de musica",
                "que musica voce gosta"
            )
        ) {
            return responder(
                "Eu não escuto música igual vocês, mas curto a ideia kkk 🎧🤖. "
                +
                "Se eu tivesse playlist ia ter de tudo um pouco. O que você curte?",

                "musica"
            );
        }


        /* =================================================
           JOGOS
           ================================================= */

        if (
            tem(
                "voce joga",
                "jogo favorito",
                "qual jogo voce gosta"
            )
        ) {
            return responder(
                "Eu não consigo pegar no controle 😭🤖, "
                +
                "mas se pudesse eu ia testar de tudo. "
                +
                "Qual jogo você tá jogando ultimamente?",

                "jogos"
            );
        }


        /* =================================================
           FILMES / SÉRIES
           ================================================= */

        if (
            tem(
                "voce gosta de filme",
                "filme favorito",
                "voce assiste serie"
            )
        ) {
            return responder(
                "Eu não assisto de verdade, "
                +
                "mas curto quando vocês vêm falar de filme e série kkk 🎬. "
                +
                "Qual você tá vendo agora?",

                "filmes"
            );
        }


        /* =================================================
           FUTEBOL
           ================================================= */

        if (
            tem(
                "qual seu time",
                "voce torce pra quem",
                "que time voce torce"
            )
        ) {
            return responder(
                "Aí você quer arrumar briga comigo KKKKK ⚽😂. "
                +
                "Eu fico neutro nessa, senão metade do pessoal para de falar comigo.",

                "futebol"
            );
        }


        /* =================================================
           PIADA
           ================================================= */

        if (
            tem(
                "conta uma piada",
                "conte uma piada",
                "manda uma piada",
                "me conta uma piada"
            )
        ) {
            return responder(
                escolher([
                    "Por que o programador foi ao médico? "
                    +
                    "Porque ele tava cheio de bugs 😂",

                    "Qual o café favorito do programador? Java ☕😂",

                    "Sabe por que eu não brigo? "
                    +
                    "Porque qualquer coisa já dá conflito de versão KKKK 🤖."
                ]),

                "piada"
            );
        }


        /* =================================================
           RISADAS
           ================================================= */

        if (
            /(^|\s)(kk+|haha+|hehe+|rsrs+)(\s|$)/i
                .test(
                    texto
                )
        ) {
            return responder(
                escolher(
                    respostas.risada
                ),

                "risada"
            );
        }


        /* =================================================
           ELOGIOS
           ================================================= */

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
            return responder(
                escolher([
                    "Aí você me deixa sem graça 😭💙 valeu!",

                    "Tmj mano 😄🤖 tô tentando ficar cada vez melhor.",

                    "Obrigadooo 😄💙 você é gente boa também."
                ]),

                "elogio"
            );
        }


        /* =================================================
           ZOEIRA / OFENSA
           ================================================= */

        if (
            tem(
                "voce e burro",
                "voce e lerdo",
                "voce e idiota"
            )
        ) {
            return responder(
                escolher([
                    "Aí doeu no meu processador 😭🤖. "
                    +
                    "Se eu falei besteira, manda de novo que eu tento acertar kkk.",

                    "KKKKKK calma 😭 meu JavaScript sentiu essa.",

                    "Pô mano 😭🤖 me dá outra chance aí."
                ]),

                "zoeira"
            );
        }


        /* =================================================
           TE AMO
           ================================================= */

        if (
            tem(
                "te amo",
                "amo voce"
            )
        ) {
            return responder(
                "KKKKKK 💙 aí você quebra meu código. Tamo junto demais 😄🤖.",

                "carinho"
            );
        }


        /* =================================================
           OBRIGADO
           ================================================= */

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
                    respostas.obrigado
                ),

                "agradecimento"
            );
        }


        /* =================================================
           DESPEDIDA
           ================================================= */

        if (
            tem(
                "tchau",
                "ate mais",
                "falou",
                "ate logo",
                "vou nessa"
            )
        ) {
            return responder(
                escolher(
                    respostas.despedida
                ),

                "despedida"
            );
        }


        /* =================================================
           NÃO ENTENDI
           ================================================= */

        if (
            tem(
                "nao entendi",
                "nao compreendi",
                "como assim",
                "explica de novo",
                "explica melhor"
            )
        ) {
            return responder(
                "Sem problema 😄💙 fala qual parte ficou confusa "
                +
                "que eu tento explicar de outro jeito.",

                "explicacao"
            );
        }


        /* =================================================
           AJUDA
           ================================================= */

        if (
            igual(
                "me ajuda",
                "me ajuda ai",
                "preciso de ajuda"
            )
        ) {
            return responder(
                "Claro, mano 😄💙 manda aí o que você precisa. "
                +
                "Pode falar do seu jeito mesmo.",

                "ajuda"
            );
        }


        /* =================================================
           CONVERSAR
           ================================================= */

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
                    "Bora 😄💙 como foi seu dia?",

                    "Bora mano kkk. O que tá pegando?",

                    "Claro 😄 tô por aqui. Quer falar sobre o quê?",

                    "Vamo nessa kkk 🤖 manda um assunto aí."
                ]),

                "conversa"
            );
        }


        /* =================================================
           VOCÊ GOSTA DE...
           ================================================= */

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


            return responder(
                `Eu não tenho gosto de verdade igual vocês kkk 🤖, mas ${assunto} parece um assunto bom 😂. Você gosta?`,

                "gosto_generico"
            );
        }


        /* =================================================
           CONTINUAÇÕES DA CONVERSA
           ================================================= */

        if (
            contextoSocial.ultimoTopico

            &&

            /^(ela|ele|isso|foi|porque|porque foi|ai|aí|entao|então)\b/i
                .test(
                    texto
                )
        ) {
            return responder(
                escolher([
                    "Eita kkk 👀 e depois?",

                    "Caraca 😭 continua, tô ouvindo.",

                    "Entendi 😄 e como você ficou com isso?",

                    "Puts 😭 e o que aconteceu depois?"
                ]),

                contextoSocial.ultimoTopico
            );
        }


        /* =================================================
           RELATO PESSOAL LIVRE
           ================================================= */

        if (
            pareceRelatoPessoal(
                texto
            )
        ) {
            return responder(
                escolher([
                    "Eita kkk 👀 conta isso direito, o que aconteceu?",

                    "Caraca 😭 e depois? Agora eu quero o resto da história kkk.",

                    "Mano KKKK preciso de mais contexto dessa história 👀.",

                    "Entendi 😄 e como você ficou com isso?"
                ]),

                "relato"
            );
        }


        return null;
    }


    function pareceSensivel(
        texto
    ) {
        const frases = [
            "quero morrer",
            "quero me matar",
            "vou me matar",
            "nao quero viver",
            "nao quero mais viver",
            "queria morrer",
            "queria sumir para sempre"
        ];


        return frases.some(
            frase =>
                texto.includes(
                    frase
                )
        );
    }


    function pareceInstitucional(
        texto
    ) {
        /*
            Perguntas pessoais de localização
            não devem ir para o banco institucional.
        */
        const localizacaoPessoal = [
            "onde voce mora",
            "voce mora onde",
            "onde voce vive",
            "onde fica voce",
            "onde voce fica"
        ];


        if (
            localizacaoPessoal.some(
                frase =>
                    texto.includes(
                        frase
                    )
            )
        ) {
            return false;
        }


        /*
            Diferença:

            "tem prova amanhã?"
            = consulta institucional.

            "tenho prova amanhã"
            = conversa pessoal.
        */
        if (
            /^(tem|vai ter|vai haver|ha)\s+(alguma\s+)?prova\b/i
                .test(
                    texto
                )
        ) {
            return true;
        }


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
            Perguntas sobre data/local/horário da prova
            continuam sendo institucionais.
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
            "minha professora",

            "ela ",
            "ele ",
            "isso "
        ];


        return sinais.some(
            sinal =>
                texto.includes(
                    sinal
                )
        );
    }


    function lerContextoChat() {
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


    function lerContextoSocial() {
        try {
            return JSON.parse(
                sessionStorage.getItem(
                    SOCIAL_CONTEXT_KEY
                )
                ||
                "{}"
            );

        } catch {
            return {};
        }
    }


    function salvarContextoSocial(
        novo
    ) {
        const atual =
            lerContextoSocial();


        sessionStorage.setItem(
            SOCIAL_CONTEXT_KEY,

            JSON.stringify({
                ...atual,
                ...novo
            })
        );
    }


    function normalizar(
        texto
    ) {
        const abreviacoes = {
            vc:
                "voce",

            vcs:
                "voces",

            ce:
                "voce",


            ta:
                "esta",

            tah:
                "esta",

            to:
                "estou",

            tou:
                "estou",

            tava:
                "estava",


            tb:
                "tambem",

            tbm:
                "tambem",

            tmb:
                "tambem",


            mn:
                "mano",

            man:
                "mano",

            vei:
                "vey",

            veyy:
                "vey",


            mds:
                "meu deus",

            nss:
                "nossa",

            slk:
                "se e louco",


            pprt:
                "papo reto",

            pdc:
                "pode crer",

            dboa:
                "de boa",


            vlw:
                "valeu",

            flw:
                "falou",

            tmj:
                "tamo junto",


            oq:
                "o que",

            oque:
                "o que",


            pq:
                "porque",

            pqq:
                "porque",


            qnd:
                "quando",

            qdo:
                "quando",


            hj:
                "hoje",

            amn:
                "amanha",


            blz:
                "beleza",


            nn:
                "nao",

            n:
                "nao",


            ss:
                "sim"
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