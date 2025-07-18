const { Client, GatewayIntentBits, Partials, EmbedBuilder, REST, Routes, SlashCommandBuilder, ActivityType } = require("discord.js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [Partials.GuildMember],
});

const guildId = process.env.GUILD_ID;
const roleId = process.env.ROLE_ID;
const adminRoleId = process.env.ADMIN_ROLE_ID;

const tagSources = {
  username: process.env.CHECK_USERNAME === "true",
  globalName: process.env.CHECK_GLOBAL_NAME === "true",
  customStatus: process.env.CHECK_CUSTOM_STATUS === "true",
};

const banSystemEnabled = process.env.ENABLE_BAN_SYSTEM === "true";

const tagsFile = path.join(__dirname, "tags.json");
const banlistFile = path.join(__dirname, "banlist.json");

// --- Dosya işlemleri
function getTags() {
  if (!fs.existsSync(tagsFile)) fs.writeFileSync(tagsFile, JSON.stringify([]));
  return JSON.parse(fs.readFileSync(tagsFile, "utf-8"));
}
function getBanList() {
  if (!fs.existsSync(banlistFile)) fs.writeFileSync(banlistFile, JSON.stringify([]));
  return JSON.parse(fs.readFileSync(banlistFile, "utf-8"));
}
function saveBanList(banList) {
  fs.writeFileSync(banlistFile, JSON.stringify(banList, null, 2));
}
function banUser(userId) {
  const banList = getBanList();
  if (!banList.includes(userId)) {
    banList.push(userId);
    saveBanList(banList);
  }
}
function unbanUser(userId) {
  const banList = getBanList();
  const index = banList.indexOf(userId);
  if (index !== -1) {
    banList.splice(index, 1);
    saveBanList(banList);
  }
}

// --- Tag kontrolü
function hasTag(member, tags) {
  const username = member.user.username?.toLowerCase() || "";
  const globalName = member.user.globalName?.toLowerCase() || "";
  const status = member.presence?.activities?.find(a => a.state)?.state?.toLowerCase() || "";

  return tags.some(tag =>
    (tagSources.username && username.includes(tag.toLowerCase())) ||
    (tagSources.globalName && globalName.includes(tag.toLowerCase())) ||
    (tagSources.customStatus && status.includes(tag.toLowerCase()))
  );
}

// --- Rol güncelleme
async function updateMemberRole(member) {
  const tags = getTags();
  const banned = getBanList().includes(member.id);
  const hasRole = member.roles.cache.has(roleId);
  const tagged = hasTag(member, tags);

  if (tagged && !hasRole && !banned) {
    try {
      await member.roles.add(roleId);
    } catch {}
  } else if (!tagged && hasRole) {
    try {
      await member.roles.remove(roleId);
      if (banSystemEnabled && !banned) {
        banUser(member.id);
      }
    } catch {}
  }
}

// --- Slash komut tanımları
const commands = [
  new SlashCommandBuilder()
    .setName("etiket-ekle")
    .setDescription("Bir etiketi listeye ekler.")
    .addStringOption(option =>
      option.setName("tag")
        .setDescription("Eklenecek etiket")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("etiket-kaldir")
    .setDescription("Listeden bir etiketi kaldırır.")
    .addStringOption(option =>
      option.setName("tag")
        .setDescription("Kaldırılacak etiket")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("etiketler")
    .setDescription("Tüm etiketleri listeler."),
  new SlashCommandBuilder()
    .setName("liste")
    .setDescription("Etiket durumu hakkında bilgi verir."),
  new SlashCommandBuilder()
    .setName("ban-list-ekle")
    .setDescription("Bir kullanıcıyı ban listesine ekler.")
    .addUserOption(option =>
      option.setName("kullanici")
        .setDescription("Ban listesine eklenecek kullanıcı")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("ban-list-kaldir")
    .setDescription("Ban listesinden bir kullanıcıyı kaldırır.")
    .addUserOption(option =>
      option.setName("kullanici")
        .setDescription("Ban listesinden kaldırılacak kullanıcı")
        .setRequired(true)
    ),
].map(c => c.toJSON());

// --- Komutları Discord'a yükleme fonksiyonu
async function deployCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    console.log("Slash komutları Discord'a yükleniyor...");
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
      { body: commands }
    );
    console.log("Slash komutları başarıyla yüklendi.");
  } catch (error) {
    console.error("Slash komutları yüklenirken hata:", error);
  }
}

// --- Bot hazır olduğunda
client.once("ready", async () => {
    console.log(`✅ Bot aktif: ${client.user.tag}`);

    // Slash komutları yükle
    await deployCommands();

    // Sunucudaki kullanıcıları çek ve rol kontrolü yap
    const guild = await client.guilds.fetch(guildId);
    const members = await guild.members.fetch();
    members.forEach(updateMemberRole);

    // Durum mesajları döngüsü
    const statuses = [
        '💎 | .gg/YAEjW6drVY',
        '👨‍💻 | By Zywexx'
    ];

    setInterval(() => {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        client.user.setPresence({
            activities: [{
                name: status,
                type: ActivityType.Watching
            }],
            status: 'idle'
        });
    }, 10000);
});


// --- Presence veya rol güncellemeleri
client.on("presenceUpdate", (_, newPresence) => {
  const member = newPresence.member;
  if (member) updateMemberRole(member);
});

client.on("guildMemberUpdate", (_, newMember) => {
  if (newMember) updateMemberRole(newMember);
});

// --- Slash komutları dinleme ve işleme
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.roles.cache.has(adminRoleId)) {
    return interaction.reply({ content: "❌ Bu komutu kullanma yetkin yok.", ephemeral: true });
  }

  const tags = getTags();
  const tag = interaction.options.getString("tag");
  const user = interaction.options.getUser("kullanici");
  const tagIndex = tag ? tags.indexOf(tag) : -1;

  switch (interaction.commandName) {
    case "etiket-ekle":
      if (tagIndex !== -1) {
        return interaction.reply({ content: "❗ Etiket zaten listede.", ephemeral: true });
      }
      tags.push(tag);
      fs.writeFileSync(tagsFile, JSON.stringify(tags, null, 2));
      await interaction.reply(`✅ Etiket eklendi: \`${tag}\``);
      break;

    case "etiket-kaldir":
      if (tagIndex === -1) {
        return interaction.reply({ content: "❗ Bu etiket listede yok.", ephemeral: true });
      }
      tags.splice(tagIndex, 1);
      fs.writeFileSync(tagsFile, JSON.stringify(tags, null, 2));
      await interaction.reply(`❌ Etiket kaldırıldı: \`${tag}\``);
      break;

    case "etiketler":
      {
        const list = tags.length > 0 ? tags.map(t => `• \`${t}\``).join("\n") : "Etiket listesi boş.";
        const embed = new EmbedBuilder()
          .setTitle("Etiket Listesi")
          .setColor("Blue")
          .setDescription(list);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
      break;

    case "liste":
      {
        const guild = await client.guilds.fetch(guildId);
        const members = await guild.members.fetch();
        const activeTags = getTags();
        const banList = getBanList();

        const taggedUsers = members.filter(m => hasTag(m, activeTags));
        const untaggedUsers = members.filter(m => !hasTag(m, activeTags));

        const newestTagged = taggedUsers.sort((a, b) => b.joinedTimestamp - a.joinedTimestamp).first(5);
        const newestList = newestTagged.length > 0
          ? newestTagged.map(m => `• ${m.user.tag}`).join("\n")
          : "Son eklenen kullanıcı yok.";

        const embedList = new EmbedBuilder()
          .setTitle("Etiket Durumu")
          .setColor("Green")
          .addFields(
            { name: "Etiketli Kullanıcı Sayısı", value: String(taggedUsers.size), inline: true },
            { name: "Etiketsiz Kullanıcı Sayısı", value: String(untaggedUsers.size), inline: true },
            { name: "Ban Listesi", value: `${banList.length} kullanıcı`, inline: true },
            { name: "Son Etiket Ekleyenler", value: newestList }
          );
        await interaction.reply({ embeds: [embedList], ephemeral: true });
      }
      break;

    case "ban-list-ekle":
      if (!user) return interaction.reply({ content: "❗ Bir kullanıcı belirtmelisin.", ephemeral: true });
      banUser(user.id);
      await interaction.reply({ content: `⛔ ${user.tag} ban listesine eklendi.`, ephemeral: true });
      break;

    case "ban-list-kaldir":
      if (!user) return interaction.reply({ content: "❗ Bir kullanıcı belirtmelisin.", ephemeral: true });
      unbanUser(user.id);
      await interaction.reply({ content: `✅ ${user.tag} ban listesinden kaldırıldı.`, ephemeral: true });
      break;
  }
});

client.login(process.env.TOKEN);
