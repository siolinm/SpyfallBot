const TelegramBot = require( `node-telegram-bot-api` )

/* variavel usada para leitura e escrita de arquivos*/
let fs = require('fs'); 

const token = fs.readFileSync('token.txt', 'utf8');

const bot = new TelegramBot( token.trim(), { polling: true } )

let places = [];
let jobs = [];
let number_players;
let player = [];
let player_confirmed = [];
let player_chat_id = [];

let host_chat_id;

/*Envia o lugar ou se ele é o espião*/
function sendCard(){

    let indice = Math.floor(Math.random() * (places.length));
    let lugar = places[indice];
    var espiao = Math.floor(Math.random() * (number_players));
   
    
    for(let i = 0; i < number_players; i++){
        var resistencia = jobs[indice][Math.floor(Math.random()*jobs[indice].length)];
        if(i == espiao)
            bot.sendMessage(player_chat_id[i], "Tu é o espião! Tente adivinhar o lugar secreto se for capaz!");
        else 
            bot.sendMessage(player_chat_id[i], "Lugar secreto: " + lugar + "\nProfissão: " + resistencia);
    }
}

/*Começa uma partida de spyfall e faz a verificação dos players*/ 
function startSpyfall(text){
    let start_str = text.split(" ");
        
    number_players = parseInt(start_str[1]);
    
    bot.sendMessage(host_chat_id, "Entrou");

    for(let i = 2; i < number_players + 2; i++){
        player[i-2] = start_str[i];
        player_confirmed[i-2] = 0;
    }
    console.log(player);

    bot.sendMessage(host_chat_id, 'Partida começou');
}

/*Checa se o player que enviou a mensagem está na lista do host*/
function check_player(msg){
    for(let i = 0; i < number_players; i++){
        if(player[i] == '@' + msg.from.username){
            player_confirmed[i] = 1;
            bot.sendMessage(host_chat_id, player[i] + ' confirmou');
            player_chat_id[i] = msg.chat.id;
        }
    }
}

function all_confirmed(){
    for(let i = 0; i < number_players; i++)
        if(player_confirmed[i] == 0)
            return 0;
    
    return 1;
}

/*Função que controla a porra toda*/
function central(msg){
    const start_pattern = /\/startSpyFall/g;
    const participate_pattern = /\/participate/g;

    console.log(msg);

    if((match = start_pattern.exec(msg.text)) != null){
        host_chat_id = msg.chat.id;
        startSpyfall(msg.text);
    }   
    else if((match = participate_pattern.exec(msg.text)) != null){
        check_player(msg);    
    }

    if(all_confirmed()){
        bot.sendMessage(host_chat_id, "Deu bom");
        sendCard();
    }
}

bot.on('message', (msg) => {
    //console.log(msg);    
    central(msg);
});

/* ler arquivo */

let arquivo = fs.readFileSync('teste.txt', 'utf8');

fs.readFile('teste.txt', function(err, data) {
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
  
