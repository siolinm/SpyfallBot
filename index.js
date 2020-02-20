const TelegramBot = require( `node-telegram-bot-api` )

/* variavel usada para leitura e escrita de arquivos*/
let fs = require('fs'); 

const token = fs.readFileSync('token.txt', 'utf8');

const bot = new TelegramBot( token.trim(), { polling: true } )

let timer;
let time_now = 0;
let places = [];
let jobs = [];
let number_players;
let espiao = -1;
let escolhido = -1;
let numvotos = 0;
let votosespiao = 0;
let lubo = 1;
/*
    -1 se não houve o comando /startSpyFall ainda.
    0 
*/
let match_started = -1;


class Player{  
    constructor(){
        this.username = "";
        this.is_confirmed = 0;
        this.chat_id = 0;
        this.job = "";
    }
};

let player = [];

let host_chat_id;

/*Envia o lugar ou se ele é o espião*/
function sendCard(){
    let indice = Math.floor(Math.random() * (places.length));
    let lugar = places[indice];
    espiao = Math.floor(Math.random() * (number_players));
    escolhido = indice;
   
    for(let i = 0; i < number_players; i++){
        var resistencia = jobs[indice][Math.floor(Math.random()*jobs[indice].length)];
        if(i == espiao){
            bot.sendMessage(player[i].chat_id, "Tu é o espião! Tente adivinhar o lugar secreto se for capaz!");
            player[i].job = 0;
        }
        else{
            bot.sendMessage(player[i].chat_id, "Lugar secreto: " + lugar + "\nProfissão: " + resistencia);
            player[i].job = 1;
        }
    }
}

/*Começa uma partida de spyfall e faz a verificação dos players*/ 
function startSpyfall(text){
    let start_str = text.split(" ");
        
    number_players = start_str.length - 1;
    
    for(let i = 1; i < number_players + 1; i++){
        player.push(new Player());
        
        player[i-1].username = start_str[i];
        player[i-1].is_confirmed = 0;
    }
    console.log(player);

    bot.sendMessage(host_chat_id, 'Players send a message to me in private with only /participate!');
}

/*Checa se o player que enviou a mensagem está na lista do host*/
function check_player(msg){
    for(let i = 0; i < number_players; i++){
        if(player[i].username == '@' + msg.from.username){
            player[i].is_confirmed = 1;
            bot.sendMessage(host_chat_id, player[i].username + ' confirmou');
            player[i].chat_id = msg.chat.id;
        }
    }
}

function all_confirmed(){
    for(let i = 0; i < number_players; i++)
        if(player[i].is_confirmed == 0)
            return 0;
    
    return 1;
}

/*
    Retorna -1 se não for um player.
    Caso contrário, retorna o índice no vetor player.
*/


function is_in(text, v){
    for(let i = 0; i < number_players; i++){
        if(v[i].username == '@' + text){
            return i;
        }
    }
    
    return -1;
}

/*Função que controla a porra toda*/
function central(msg){
    const start_pattern = /\/startSpyFall/g;
    const participate_pattern = /\/participate/g;
    const start_match_pattern = /\/startMatch/g;
    const end_pattern = /\/endSpyFall/g;
    const dash_pattern = /^\//g;
    const add_place_pattern = /\/addPlace/g;
    
    console.log(msg);
    bot.on("polling_error", (err) => console.log(err));    

    if((match = end_pattern.exec(msg.text)) != null && match_started != -1 && is_in(msg.from.username, player) != -1){
        bot.sendMessage(msg.chat.id, "OI");
        match_started = -1;
    }
    else if((match = start_pattern.exec(msg.text)) != null && match_started == -1){
        host_chat_id = msg.chat.id;
        startSpyfall(msg.text);
        match_started = 0;
    }
    else if((match = participate_pattern.exec(msg.text)) != null && match_started == 0 && is_in(msg.from.username, player) != -1 && msg.chat.id != host_chat_id){
        check_player(msg);
    }
    else if((match = start_match_pattern.exec(msg.text)) != null && match_started == 1 && is_in(msg.from.username, player) != -1){
        match_started = 2;
        bot.sendMessage(host_chat_id, "Discussion Started!");

        sendCard();
        startDiscussion(host_chat_id);
    }

    if(match_started == 0){
        if(all_confirmed()){
            bot.sendMessage(host_chat_id, "All players have already confirmed their participation!")
            bot.sendMessage(host_chat_id, "Should we \/startMatch?");
            match_started = 1;    
        }
    }
    /*
    else if((match = add_place_pattern.exec(msg.text)) != null && match_started == -1){
        bot.sendMessage(host_chat_id, "");
        
    }
    */
    let lusei = is_in(msg.from.username, player);

    if( lusei == espiao )
    {
        let lula = places.lastIndexOf(msg.text.slice(1))
        if(lula != -1)
        {
            if(lula == escolhido)
            {
                bot.sendMessage(host_chat_id, "O espião encontrou o lugar\nOtários");
            }
            else
            {
                bot.sendMessage(host_chat_id, "O espião errou o lugar\n");
            }
        }
    }
    else if(lusei != -1)
    {
        let lulb = is_in(msg.text.slice(1), player);
        if(lulb != -1)
        {
            numvotos++;
            if(lulb == espiao)
            {
                votosespiao++;
            }
        }

    }
    if (numvotos == number_players - 1 && lubo)
    {    
        lubo = 0;
        if(votosespiao >= (number_players-1)/2)
            bot.sendMessage(host_chat_id, "O espião foi pego, era " + player[espiao].username);
        else
            bot.sendMessage(host_chat_id, "O espião se safou, " + player[espiao].username + " conseguiu coletar as informações");

    }
}


bot.on('message', (msg) => {
    /*console.log(msg);*/   
    central(msg);  
})

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

function startDiscussion(chatId){
    time_now = 0;
    timer = setInterval(() => {        
        time_now += 1;
        
        if(time_now != 10)    
            bot.sendMessage(chatId, "Faltam " + (10-time_now).toString() + " minutos.");
        else{            
            bot.sendMessage(chatId, "O tempo acabou!");
            stopDiscussion();
        } 
    }, 30000);
}

function stopDiscussion(){
    clearInterval(timer);
    votation();
}

/******************************/

function votation()
{
    let barralugar = [];
    places.forEach (e =>{
        console.log(e);
        barralugar.push('\/'+ e);
    })
    console.log(barralugar);

    for(var i = 0;i < number_players; i++)
    {
        console.log(i+' '+espiao);
        if(i == espiao)
        {
            let lug = '';
            places.forEach(e =>{
                lug += '\/' + e + '\n';

            })
            bot.sendMessage(player[i].chat_id,"Escolha um lugar:\n");
            bot.sendMessage(player[i].chat_id,lug);
        }
        else
        {
            let lus = "Who is the spy? (hint: hiroshi)\n";
            for(var luaux = 0; luaux < number_players; luaux++)
            {
                let luba = player[luaux].username;
                if(luaux != i)
                {
                    lus += '\/' + luba.slice(1)+'\n';
                }
            }
            bot.sendMessage(player[i].chat_id,lus);
        }
    }
}