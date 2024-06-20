const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, GatewayIntentBits, CommandInteraction, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASS,
    database: process.env.DATABASE,
    port: process.env.PORT
};

let db;

async function connectToDatabase() {
    db = await mysql.createConnection(dbConfig);
}

async function insertData(items, code) {
    await db.execute('INSERT INTO refunds (items, randomcode) VALUES (?, ?)', [JSON.stringify(items), code]);
}

async function retrieveData() {
    try {
        const [rows] = await db.execute('SELECT * FROM refunds');
        return rows;
    } catch (error) {
        console.error('Error retrieving data:', error);
        return []; 
    }
}


const commands = [
    {
        name: 'refund',
        description: 'Add a refund to the database',
        options: [
            {
                name: 'items',
                description: 'Items in JSON format (e.g., {"item1":"1", "item2":"2"})',
                type: 3, 
                required: true,
            },
            {
                name: 'code',
                description: 'Code for the refund',
                type: 3,
                required: true,
            },
        ],
    },
    {
        name: 'retrieve',
        description: 'Retrieve refunds from the database',
    },
    {
        name: 'help',
        description: 'Use this to show available commands.',
    },
];

const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENTID, process.env.GUILDID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on('ready', async () => {
    await connectToDatabase();
    console.log(`Logged in as ${client.user.tag}!`);
});

async function formatDataAsEmbed() {
    const data = await retrieveData();

    const retrieveEmbedData = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Refunds Database');

    if (data.length > 0) {
        data.forEach(row => {
            try {
                const items = JSON.parse(row.items); 
                const itemsStr = Object.entries(items).map(([name, amount]) => `${name}: ${amount}`).join('\n');
                const code = row.randomcode;
                retrieveEmbedData.addFields(
                    { name: code, value: itemsStr, inline: false }
                );
            } catch (error) {
                retrieveEmbedData.addFields(
                    { name: `Error parsing items for refund with code ${row.randomcode}`, value: 'There was an issue parsing the items for this refund.' }
                );
            }
        });
    } else {
        retrieveEmbedData.setDescription('No refunds found in the database.');
    }

    return retrieveEmbedData;
}


client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, member } = interaction;

    const allowedRoles = [process.env.ALLOWEDUSER];
    const hasRequiredRole = member.roles.cache.some(role => allowedRoles.includes(role.id));

    if (!hasRequiredRole) {
        await interaction.reply('You do not have permission to use this command.');
        return;
    }

    if (commandName === 'refund') {
        const itemsStr = interaction.options.getString('items');
        const code = interaction.options.getString('code');

        try {
            const items = JSON.parse(itemsStr);
            await insertData(items, code);
            await interaction.reply('✅ Refund successfully added to the database.');
        } catch (error) {
            console.error(error);
            await interaction.reply('❌ Failed to parse items JSON. Please ensure it is in the correct format.');
        }
    } else if (commandName === 'retrieve') {
        const embed = await formatDataAsEmbed();
        await interaction.reply({ embeds: [embed] });
    } else if (commandName === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Bot Commands')
            .addFields(
                { name: '/refund', value: 'Add a refund to the database. Usage: `/refund items {"item1": 1, "item2": 2} code`' },
                { name: '/retrieve', value: 'Retrieve refunds from the database.' },
            )
            .setFooter({ text: 'Use these commands to interact with the bot.' });

        await interaction.reply({ embeds: [helpEmbed] });
    }
});

client.login(process.env.BOT_TOKEN);
