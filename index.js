const TelegramBot = require(`node-telegram-bot-api`)

/* variavel usada para leitura e escrita de arquivos*/
let fs = require('fs');

const token = fs.readFileSync('token.txt', 'utf8');

const bot = new TelegramBot(token.trim(), { polling: true })

let timer;
let time_now = 0;
let places = [];
let jobs = [];
let number_players;
let num_spy = 1;
let espiao = [];
let escolhido = -1;
let numvotos = 0;
let votosespiao = [];
let votacaoAndamento = 1;
let acabou = 0;
/*
    -1 se não houve o comando /startspyfall ainda.
    0 
*/
let match_started = -1;
let end_discussion = 0;

class Player {
    constructor() {
        this.username = "";
        this.is_confirmed = 0;
        this.chat_id = 0;
        this.job = "";  //profissao
        this.votes = []; //players que esse player votou
        this.spy = 0; //se for espiao vale 1
    }
};

let player = [];

let host_chat_id;

/*Envia o lugar ou se ele é o espião*/
function sendCard() {
    let indice = Math.floor(Math.random() * (places.length));
    let lugar = places[indice];
    escolhido = indice;

    for (var auxi = 0; auxi < num_spy; auxi++) {
        var auxx = Math.floor(Math.random() * (number_players));

        while (player[auxx].spy)
            auxx = Math.floor(Math.random() * (number_players));

        espiao[auxi] = Math.floor(auxx);
        votosespiao[auxi] = 0;
        player[auxx].spy = 1;
    }

    for (let i = 0; i < number_players; i++) {
        var resistencia = jobs[indice][Math.floor(Math.random() * jobs[indice].length)];
        var indice_spy = espiao.indexOf(i);

        if (indice_spy != -1) {
            bot.sendMessage(player[i].chat_id, "Tu é o espião! Tente adivinhar o lugar secreto se for capaz!");
            player[i].job = 0;
        }
        else {
            bot.sendMessage(player[i].chat_id, "Lugar secreto: " + lugar + "\nProfissão: " + resistencia);
            player[i].job = 1;
        }
    }
}

/*Começa uma partida de spyfall e faz a verificação dos players*/
function startSpyfall(text) {
    let start_str = text.split(" ");

    number_players = start_str.length - 1;

    for (let i = 1; i < number_players + 1; i++) {
        player.push(new Player());

        player[i - 1].username = start_str[i];
        player[i - 1].is_confirmed = 0;
    }

    console.log(player);

    bot.sendMessage(host_chat_id, 'Players send a message to me in private with only /participate!');
}

/*Checa se o player que enviou a mensagem está na lista do host*/
function check_player(msg) {
    for (let i = 0; i < number_players; i++) {
        if (player[i].username == '@' + msg.from.username) {
            player[i].is_confirmed = 1;
            bot.sendMessage(host_chat_id, player[i].username + ' confirmou');
            player[i].chat_id = msg.chat.id;
        }
    }
}

function all_confirmed() {
    for (let i = 0; i < number_players; i++)
        if (player[i].is_confirmed == 0)
            return 0;

    return 1;
}

/*
    Retorna -1 se não for um player.
    Caso contrário, retorna o índice no vetor player.
*/


function is_in(text, v) {
    for (let i = 0; i < number_players; i++) {
        if (v[i].username == '@' + text) {
            return i;
        }
    }

    return -1;
}

/*Função que controla a porra toda*/
function central(msg) {
    const start_pattern = /\/startspyfall/g;
    const participate_pattern = /\/participate/g;
    const start_match_pattern = /\/startmatch/g;
    const end_pattern = /\/endspyfall/g;
    const dash_pattern = /^\//g;
    const add_place_pattern = /\/addplace/g;
    const stop_discussion_pattern = /\/stopdiscussion/g;

    console.log(msg);
    bot.on("polling_error", (err) => console.log(err));

    if ((match = end_pattern.exec(msg.text)) != null && match_started != -1 && is_in(msg.from.username, player) != -1) {
        bot.sendMessage(msg.chat.id, "OI");
        match_started = -1;
        time_now = 0;
        num_spy = 1;
        escolhido = -1;
        numvotos = 0;
        votacaoAndamento = 1;
        acabou = 0;
    }
    else if ((match = start_pattern.exec(msg.text)) != null && match_started == -1) {
        bot.sendMessage(msg.chat.id, "Carai");
        host_chat_id = msg.chat.id;
        startSpyfall(msg.text);
        match_started = 0;
    }
    else if ((match = participate_pattern.exec(msg.text)) != null && match_started == 0 && is_in(msg.from.username, player) != -1 && msg.chat.id != host_chat_id) {
        check_player(msg);
    }
    else if ((match = start_match_pattern.exec(msg.text)) != null && match_started == 1 && is_in(msg.from.username, player) != -1) {
        match_started = 2;
        bot.sendMessage(host_chat_id, "Discussion Started!");

        sendCard();
        startDiscussion(host_chat_id);
    }
    else if ((match = stop_discussion_pattern.exec(msg.text)) != null && match_started == 2) {
        stopDiscussion();
        acabou = 1;
        match_started = 3;
    }

    if (match_started == 0) {
        if (all_confirmed()) {
            bot.sendMessage(host_chat_id, "All players have already confirmed their participation!")
            bot.sendMessage(host_chat_id, "Should we \/startmatch?");
            match_started = 1;
        }
    }
    /*
    else if((match = add_place_pattern.exec(msg.text)) != null && match_started == -1){
        bot.sendMessage(host_chat_id, "");
        
    }
    */

    if (match_started == 3)
        votation(msg);
}


bot.on('message', (msg) => {
    /*console.log(msg);*/
    central(msg);
})

let arquivo = fs.readFileSync('teste.txt', 'utf8');

fs.readFile('teste.txt', function (err, data) {
    arquivo = arquivo.trim();
    let wordList = arquivo.split('\n');
    wordList.forEach(e => {
        let lulist = e.split('-');
        //console.log(lulist);
        places.push(lulist[0]);
        //lulist.shift()   
        //lulist.shift();    
        jobs.push(lulist.slice(1));
    })

    // console.log(places);
    //console.log(jobs);

});

function startDiscussion(chatId) {
    time_now = 0;
    timer = setInterval(() => {
        time_now += 1;

        if (time_now != 10 /*&& acabou == 1*/)
            bot.sendMessage(chatId, "Faltam " + (10 - time_now).toString() + " minutos.");
        else {
            stopDiscussion();
        }
    }, 60000);
}

function stopDiscussion() {
    clearInterval(timer);
    bot.sendMessage(host_chat_id, "O tempo acabou!");
    candidate();
    match_started = 3;
}

/******************************/

function candidate() {
    let barralugar = [];
    places.forEach(e => {
        console.log(e);
        barralugar.push('\/' + e);
    })
    console.log(barralugar);

    for (var i = 0; i < number_players; i++) {
        console.log(i + ' ' + espiao[0]);
        if (espiao.indexOf(i) != -1) {
            let lug = '';
            places.forEach(e => {
                lug += '\/' + e + '\n';

            })
            bot.sendMessage(player[i].chat_id, "Escolha um lugar:\n");
            bot.sendMessage(player[i].chat_id, lug);
        }
        else {
            let lus = "Who is the spy? (hint: hiroshi)\n";
            for (var luaux = 0; luaux < number_players; luaux++) {
                let luba = player[luaux].username;
                if (luaux != i) {
                    lus += '\/' + luba.slice(1) + '\n';
                }
            }
            bot.sendMessage(player[i].chat_id, lus);
        }
    }
}

function votation(msg) {
    let indicePlayer = is_in(msg.from.username, player);

    if (espiao.indexOf(indicePlayer) != -1) {
        let indiceLugar = places.lastIndexOf(msg.text.slice(1))

        if (indiceLugar != -1 && indiceLugar == escolhido)
            bot.sendMessage(host_chat_id, "O espião encontrou o lugar\nOtários");
        else if (indiceLugar != -1)
            bot.sendMessage(host_chat_id, "O espião errou o lugar\n");

    }
    else if (indicePlayer != -1) {
        let indicePlayerVoted = is_in(msg.text.slice(1), player);

        if (indicePlayerVoted != -1) {
            numvotos++;
            if (espiao.indexOf(indicePlayerVoted) != -1)
                votosespiao[espiao.indexOf(indicePlayerVoted)]++;
        }
    }

    if (numvotos == (number_players - num_spy) * num_spy && votacaoAndamento) {
        votacaoAndamento = 0;
        let spyCatched = 0;
        let lusa = '';
        let lusb = '';

        console.log(espiao);

        for (var lui = 0; lui < num_spy; lui++) {
            if (votosespiao[lui] >= (number_players - 1) / 2) {
                spyCatched++;
                lusa += '\n' + player[espiao[lui]].username;
            }
            else
                lusb += '\n' + player[espiao[lui]].username;
        }

        bot.sendMessage(host_chat_id, "spyCatched" + spyCatched);
        if (spyCatched == 1) {
            if (num_spy == 1)
                bot.sendMessage(host_chat_id, "O espião foi capturado" + lusa);
            else
                bot.sendMessage(host_chat_id, "Somente um espião foi capturado" + lusa);
        }
        else if (spyCatched > 1) {
            if (spyCatched == num_spy)
                bot.sendMessage(host_chat_id, "Os espiões foram encontrados: " + lusa);
            else
                bot.sendMessage(host_chat_id, "Alguns espiões foram encontrados: " + lusa);
        }

        if (spyCatched < num_spy) {
            if (num_spy - spyCatched == 1)
                bot.sendMessage(host_chat_id, "O espião " + lusb.slice(1) + " conseguiu fugir");
            else
                bot.sendMessage(host_chat_id, "Estes espiões escaparam: " + lusa);
        }
    }
}