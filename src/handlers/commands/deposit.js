const Markup = require("telegraf/markup");
const { getSession } = require("../../dynamoDB");

module.exports.deposit = async ctx => {
  if (!ctx.session.wallet) await getSession(ctx.from.id);
  const SLPaddress = ctx.session.wallet.SLPaddress;

  ctx.replyWithMarkdown(
    `🔸*TRENKBOT HOW TO DEPOSIT*🔸\n${ctx.from.first_name} deposit Trenk from Badger Wallet ONLY 🦡 to this address:\n\n \`\`\`${SLPaddress}\`\`\``,
    Markup.keyboard([["/balance", "/help"], ["/deposit", "/withdraw"]])
      .oneTime()
      .resize()
      .extra()
  );
};
