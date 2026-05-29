require("dotenv").config();

const fs = require("fs-extra");

const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

// COMMAND MENU RESMI TELEGRAM
bot.telegram.setMyCommands([
    {
        command: "search",
        description: "🔍 Cari partner"
    },
    {
        command: "next",
        description: "⏭️ Ganti partner"
    },
    {
        command: "stop",
        description: "⛔ Stop chat"
    },
    {
        command: "users",
        description: "📊 Statistik bot"
    },
    {
        command: "help",
        description: "ℹ️ Bantuan"
    }
]);


bot.command("help", (ctx) => {
    ctx.message.text = "ℹ️ Bantuan";
    bot.handleUpdate(ctx.update);
});

// Queue pencarian partner
let waitingUsers = [];

// Pasangan aktif
let activeChats = {};

// Semua user
let allUsers = new Set();

// Load user dari JSON
async function loadUsers() {

    try {

        allUsers =
            await fs.readJson(
                "./database/users.json"
            );

    } catch {

        allUsers = [];

    }

}

// Jalankan saat bot start
loadUsers();

async function saveUsers() {

    await fs.writeJson(
        "./database/users.json",
        allUsers,
        {
            spaces: 2
        }
    );

}

// MENU BUTTON
const menuKeyboard = Markup.keyboard([
    ["🔍 Cari Partner", "⏭️ Next"],
    ["⛔ Stop Chat", "📊 Statistik"],
    ["ℹ️ Bantuan"]
])
.resize();

// SAVE USER
bot.use(async (ctx, next) => {

    if (ctx.from) {

        const exists = allUsers.find(
            (u) => u.userId === ctx.from.id
        );

        if (!exists) {

            allUsers.push({

                userId: ctx.from.id,

                username:
                    ctx.from.username || "",

                firstName:
                    ctx.from.first_name || "",

                joinedAt:
                    new Date()

            });

            await saveUsers();

        }

    }

    return next();

});

// START
bot.start((ctx) => {
    ctx.reply(
`👋 Selamat datang di Anonymous Chat Bot

Gunakan tombol di bawah untuk mulai chat anonim.`,
        menuKeyboard
    );
});

// HELP
bot.hears("ℹ️ Bantuan", (ctx) => {
    ctx.reply(
`📖 Bantuan Bot

🔍 Cari Partner
Mencari partner random

⏭️ Next
Ganti partner baru

⛔ Stop Chat
Menghentikan chat

📊 Statistik
Melihat statistik bot`,
        menuKeyboard
    );
});

// SEARCH BUTTON
bot.hears("🔍 Cari Partner", (ctx) => {
    const userId = ctx.from.id;

    if (activeChats[userId]) {
        return ctx.reply("⚠️ Kamu masih dalam chat.");
    }

    if (waitingUsers.includes(userId)) {
        return ctx.reply("⏳ Sedang mencari partner...");
    }

    if (waitingUsers.length > 0) {
        const partnerId = waitingUsers.shift();

        if (partnerId === userId) {
            return waitingUsers.push(userId);
        }

        activeChats[userId] = partnerId;
        activeChats[partnerId] = userId;

        bot.telegram.sendMessage(userId, "✅ Partner ditemukan!");
        bot.telegram.sendMessage(partnerId, "✅ Partner ditemukan!");
    } else {
        waitingUsers.push(userId);

        ctx.reply("🔍 Mencari partner...");
    }
});

// STOP BUTTON
bot.hears("⛔ Stop Chat", (ctx) => {
    const userId = ctx.from.id;
    const partnerId = activeChats[userId];

    if (!partnerId) {
        return ctx.reply("❌ Kamu tidak sedang chat.");
    }

    delete activeChats[userId];
    delete activeChats[partnerId];

    bot.telegram.sendMessage(userId, "⛔ Chat dihentikan.");
    bot.telegram.sendMessage(userId, `
😞 Partner keluar dari obrolan

/search — cari partner baru  
/stop — chat berhenti
`);
});

// NEXT BUTTON
bot.hears("⏭️ Next", (ctx) => {
    const userId = ctx.from.id;
    const partnerId = activeChats[userId];

    if (partnerId) {
        delete activeChats[userId];
        delete activeChats[partnerId];

        bot.telegram.sendMessage(
            partnerId,
            "⏭️ Partner mencari orang baru."
        );
    }

    if (waitingUsers.length > 0) {
        const newPartner = waitingUsers.shift();

        if (newPartner === userId) {
        waitingUsers.push(userId);
        return ctx.reply(" Menunggu partner baru...");
        }

        activeChats[userId] = newPartner;
        activeChats[newPartner] = userId;

        bot.telegram.sendMessage(
            userId,
            "✅ Partner baru ditemukan!"
        );

        bot.telegram.sendMessage(
            newPartner,
            "✅ Partner ditemukan!"
        );
    } else {
        waitingUsers.push(userId);

        ctx.reply("🔍 Menunggu partner baru...");
    }
});

// STATISTIC BUTTON
bot.hears("📊 Statistik", (ctx) => {

    const waiting = waitingUsers.length;

    const chatting =
        Object.keys(activeChats).length / 2;

    ctx.reply(
`📊 Statistik Bot

👥 Total User: ${allUsers.length}
🔍 Sedang Mencari: ${waiting}
💬 Sedang Chat: ${chatting}`,
        menuKeyboard
    );
});

// COMMAND MANUAL
bot.command("search", (ctx) => {
    ctx.message.text = "🔍 Cari Partner";
    bot.handleUpdate(ctx.update);
});

bot.command("next", (ctx) => {
    ctx.message.text = "⏭️ Next";
    bot.handleUpdate(ctx.update);
});

bot.command("stop", (ctx) => {
    ctx.message.text = "⛔ Stop Chat";
    bot.handleUpdate(ctx.update);
});

bot.command("users", (ctx) => {
    ctx.message.text = "📊 Statistik";
    bot.handleUpdate(ctx.update);
});

const badWords = [
    "anjing",
    "bangsat",
    "kontol",
    "memek",
    "ngentot",
    "bajingan",
    "tolol",
    "goblok",
    "asu",
    "fuck",
    "bitch",
    "sange",
    "snge",
    "bitch",
    "bool",
    "s@n93",
    "54n93",
    "45u",
    "turuk",
    "fuckbitch"
]

async function updateBotBio() {

    try {

        await bot.telegram.setMyDescription(
`🤖 DannTalk Bot

👥 Total Pengguna: ${allUsers.length}
💬 Chat Random Aktif 24 Jam
👨‍💻 Developer @danntalk` //allUsers.size
        );

    } catch (err) {

        console.log(err);

    }
}

setInterval(() => {

    updateBotBio();

}, 60000);

function normalizeText(text) {
    return text
    .toLowerCase()
        .replace(/0/g, "o")
        .replace(/1/g, "i")
        .replace(/3/g, "e")
        .replace(/4/g, "a")
        .replace(/5/g, "s")
        .replace(/7/g, "t")

        .replace(/[^a-z]/g, "")
        .replace(/(.)\1+/g, "$1");
}

function contstainBadWords(text) {
   const normalized = normalizeText(text);

    return badWords.some(word => {

        const normalizedWord = normalizeText(word);

        return normalized.includes(normalizedWord);
    });
}

// FORWARD MESSAGE
bot.on("text", (ctx) => {

    const userId = ctx.from.id;
    const partnerId = activeChats[userId];

    if (!partnerId) return;

    const text = ctx.message.text;

    // Hindari tombol/menu
    const blockedButtons = [
        "🔍 Cari Partner",
        "⏭️ Next",
        "⛔ Stop Chat",
        "📊 Statistik",
        "ℹ️ Bantuan"
    ];

    if (
        text.startsWith("/") ||
        blockedButtons.includes(text)
    ) return;

    if (contstainBadWords(text)){
        return ctx.reply(
            "Pesan mengandung kata kasar dan tidak terkirim"
        )
    }

    bot.telegram.sendMessage(partnerId, text);
});

bot.launch(() => {

    console.log("✅ Bot berjalan...");

    updateBotBio();

});