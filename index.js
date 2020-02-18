const TelegramBot = require( `node-telegram-bot-api` )

const TOKEN = `956467020:AAFP588cd4rpbIEL0nANalcanEqAqyXnufg`

const bot = new TelegramBot( TOKEN, { polling: true } )

bot.onText(/Luciano/, (msg) => {
    console.log(msg);
    bot.sendMessage(msg.chat.id, "Ta puto o garoto")
})

//eae galera
//acho q ja comecou aqui o contest
//fala ai: 
// n to conseguindo salvar um arquivo aqui
// ta dando cota excedida, no cec
// Fala pro Bento 
//eu q sou jumento
//lixeira tava cheia
// Foda né

