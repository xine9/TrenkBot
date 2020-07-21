const Markup = require("telegraf/markup");
const { getSession } = require("../dynamoDB");
const { sessionInit } = require("../sessionInit");
const { transactionInit } = require("../transactionInit");
const { dbLock } = require("../dbLock/dbLock");
const { toggleLock } = require("../dbLock/toggleLock");

module.exports.textHandler = async bot => {
  bot.on("text", async ctx => {
    if (ctx.chat.type == "private") { privateChat(ctx); } 
    else if (ctx.chat.type == "group" || "supergroup") { await groupChat(ctx); } }); };

// Default answer to unknown messages
const privateChat = ctx => {
  ctx.reply(`Hello ${ctx.from.first_name} this is TRENK tip bot.\See /help for more information.`,
    Markup.keyboard([["/balance", "/help"],["/deposit", "/withdraw"]]).oneTime().resize().extra()); };

const groupChat = async ctx => {

// const session = await getSession(ctx.from.id); if (!session.wallet.honkPoints) await sessionInit(ctx);
// const honkPoints = session.wallet.honkPoints; 
  // if(honkPoints<0.01) { ctx.message.text="ribbit"; }
  
// console.log(`Yo, ${fromUser.first_name} ${session.wallet.honkPoints}`);
  
  let dice=["🎲","⚀","⚁","⚂","⚃","⚄","⚅"]; 
  let slot=["🎰","🍒","🍇","🍋","🍊","🔔","🍀"]; 
  let slotResults=["🎰","🎰","🎰"];
  /// Listen for Tip Message from Group Chat  // RegEx "[number] cy";  // Example: "10 cy" , " 10cy" , "10 CyFrog";
  const re = /[0-9]+ *trenk/gi;  const reComma = /(\d{0,3},)?(\d{3},)?\d{0,3} *trenk/i;  const reDot = /\d*\.?\d* *trenk/gi;
  // const re = /rain [0-9]+/gi; 
  const reSlot = /🎰/g;   const reFaucet = /🚰/g; 
  const reClown = /🏆/g;  const reCircus = /🥈/g; const reFlower = /🥇/g; const reDice = /🎲/g;
  
  
  if (ctx.message.reply_to_message) {
    let text = ctx.message.text;
    if (parseFloat(text.match(reDot)) || parseFloat(text.match(reComma))) {
      text = text.includes(".") ? text.match(reDot)[0] : text.match(reComma)[0];
      if (text.includes(".")) {
        let amount = parseFloat(text.replace(/trenk/g, ""));
        const tipResult = await tip(ctx, amount); ctx.replyWithMarkdown(tipResult); }
      else if (text.includes(",")) {
        let amount = text.replace(/,/g, ""); const tipResult = await tip(ctx, amount); ctx.replyWithMarkdown(tipResult); }
      else if (text.match(re)) {
        let amount = ctx.message.text.match(re)[0].split(" ")[0];
        const tipResult = await tip(ctx, amount); ctx.replyWithMarkdown(tipResult); } }
    else if (text.match(reFaucet)) {
      let amount = 0.1; const tipResult = await tip(ctx, amount); ctx.replyWithMarkdown(tipResult); }  
    else if (text.match(reClown) || text.match(reCircus) || text.match(reFlower) || text.match(reDice) || text.match(reSlot)) {
      let amount = 0; 
      if (text.match(reClown)) { const matchArray = text.match(reClown);  amount += matchArray.length * 500; }
      if (text.match(reFlower)) { const matchArray = text.match(reFlower);  amount += matchArray.length * 100; }
      if (text.match(reCircus)){ const matchArray = text.match(reCircus); amount += matchArray.length * 50; }
      let diceText="";
        if (text.match(reDice)){ 
          const matchArray = text.match(reDice);
          for(i=0; i<matchArray.length; i++) { 
            dieRoll=parseInt((Math.random() * 6)+1);
            diceText+=dice[dieRoll]+" ";
            amount+=dieRoll * 0.01 ; } }

        if (text.match(reSlot)){ 
          const matchArray = text.match(reSlot); diceText=""; amount=0;
          for(i=0; i<3; i++) { 
            dieRoll=parseInt((Math.random() * 6)+1); slotResults[i]=slot[dieRoll]; diceText+=slotResults[i]; amount+=dieRoll; }
          if((slotResults[0]==slotResults[1])||(slotResults[1]==slotResults[2])||(slotResults[0]==slotResults[2])) { ; }
          else { amount=parseInt(amount/3); }      
          amount= amount* 0.01 ;
          if(diceText=="🍒🍒🍒") { amount=0.75; }
          if(diceText=="🍇🍇🍇") { amount=0.20; }
          if(diceText=="🍋🍋🍋") { amount=0.30; }
          if(diceText=="🍊🍊🍊") { amount=0.40; }
          if(diceText=="🔔🔔🔔") { amount=0.50; }
          if(diceText=="🍀🍀🍀") { amount=1.00; }
        }
      
      const tipResult = await tip(ctx, amount); ctx.replyWithMarkdown(tipResult+" "+diceText); } } };   

const tip = async (ctx, amount) => {
  amount = parseFloat(amount);
  const fromUser = ctx.from;
  const toUser = ctx.message.reply_to_message.from;

  if (fromUser.id === toUser.id) return `*${fromUser.first_name}*  👏`;
  try { await dbLock(ctx, fromUser.id); if (fromUser.id !== toUser.id) await dbLock(ctx, toUser.id); } catch (err) {
    console.log("testHandler:: 🗝 dbLock error while trying make tip:", err);
    return `*${fromUser.first_name}* sorry, try later.`; }

  await sessionInit(ctx);

  // Tip to bot deprecated
  if (toUser.is_bot) {
    if (fromUser.id !== toUser.id) toggleLock(ctx, toUser.id); toggleLock(ctx, fromUser.id);
    return `*${fromUser.first_name}* you can't tip to bot`; }
  const transactionSuccess = await transactionInit(amount, ctx, toUser);
  if (fromUser.id !== toUser.id) toggleLock(ctx, toUser.id); toggleLock(ctx, fromUser.id);
  let msg = "";
  if (transactionSuccess) {
    msg += `*${fromUser.first_name}* tipped ${amount.toLocaleString("en-US")} 🔸*TRENK*🔸 to *${toUser.first_name}*`; }
  else {
    console.log("Need more Trenk"); msg += `*${fromUser.first_name}* You need more 🔸*TRENK*🔸`; } 
  return msg; };
