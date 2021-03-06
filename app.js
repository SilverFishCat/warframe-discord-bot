const Discord = require("discord.js");
const snekfetch = require("snekfetch");
const fs = require('fs');
const numeral = require('numeral');

const warframe_api = "https://api.warframestat.us/pc/";
const MAX_ALERTS = 5;

if(!fs.existsSync("./config.json")) {
	console.error("config.json does not exists, bot will not run");
	return 1;
}
const config = require("./config.json");
if(!config.token) {
	console.error("config.json does not contain a bot token (/token in json structure)");
	return 1;
}
if(!config.prefix) {
	console.error("config.json does not contain a command prefix (/prefix in json structure)");
	return 1;
}

function formatNumber(number) {
	return numeral(number).format('0,0');
}

const client = new Discord.Client();

function callWarframeAPI(noun) {
	return snekfetch.get(warframe_api + noun).catch(reason => {
		console.error(`${noun} failed with exception: ${reason}`);
	});
}

function alertEmbed(alert) {
	var items = alert.mission.reward.items;
	items = items.concat(alert.mission.reward.countedItems.map(x => {
		if(x.count > 1)
			return `${formatNumber(x.count)} ${x.type}`;
		else
			return `${x.type}`;
	}));
	items.push(formatNumber(alert.mission.reward.credits) + "cr");
	
	return {embed: {
		color: 3447003,
		thumbnail: {url: alert.mission.reward.thumbnail},
		title: `${alert.mission.type} - ${alert.mission.node}`,
		description: items.join(" + "),
		fields: [
			{
				name: "Levels",
				value: `${alert.mission.minEnemyLevel}-${alert.mission.maxEnemyLevel}`
			}
		],
		footer: {
			text: `Timeleft: ${alert.eta}`
		}
	}};
}

let subscribed_users = [];

function startMonitoring() {
	client.setInterval(() => {
		console.log("---CHECKING---");
		
		callWarframeAPI("alerts").then((r) => {
			let alerts = r.body;
			
			for(let i=0; i<alerts.length; i++) {
				let alert = alerts[i];
				if(alert.mission.reward.items.indexOf("Orokin Catalyst") === -1 &&
					 alert.mission.reward.items.indexOf("Orokin Reactor") === -1 &&
					 alert.mission.reward.items.indexOf("Forma") === -1 &&
					 alert.mission.reward.items.indexOf("Orokin Catalyst Blueprint") === -1 &&
					 alert.mission.reward.items.indexOf("Orokin Reactor Blueprint") === -1 &&
					 alert.mission.reward.items.indexOf("Forma Blueprint") === -1) continue;
				let alert_embed = alertEmbed(alert);
				
				let users_it = subscribed_users.slice(); //de-alias
				for(let j=0; j<users_it.length; j++) {
					let user = users_it[j];
					
					user.send(alert_embed);
				}
				
				console.log(alert.mission.reward.itemString);
			}
		});
	}, 1000*60*30);
}

client.on("ready", () => {
	console.info(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
	client.user.setActivity(`${config.prefix}help | In Dev`);
	startMonitoring();
});

client.on("guildCreate", guild => {
	console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
});

client.on("guildDelete", guild => {
	console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
});

client.on("message", async message => {
	if(message.author.bot) return;
	if(message.content[0] !== config.prefix) return;

	const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	switch(command) {
	case "help":
		message.author.send({embed: {
			color: 3447003,
			title: "Help command",
			description: "Help and information about the warframe bot.",
			fields: [
				{
					name: "Commands",
					value: `Currently we only have ${config.prefix}time, ${config.prefix}alert, ${config.prefix}void, ${config.prefix}code, and ${config.prefix}farm`
				},
				{
					name: "Development",
					value: "We are constantly adding stuff, view the reddit or github for updates."
				},
				{
					name: "Links",
					value: "[Github](https://github.com/zippy4/warframe-discord-bot)"
				},
				{
					name: "API",
					value: "We use [warframestat.us](https://docs.warframestat.us)"
				}
			],
			footer: {
				icon_url: client.user.avatarURL,
			}
		}});
		break;

	case "stat":
		message.channel.send({embed: {
			color: 16716947,
			description: `I am serving ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`
		}}); 
		break;

	case "code":
		message.channel.send({embed: {
			color: 16729344,
			description: `Check out the code over at [Github](https://github.com/zippy4/warframe-discord-bot)`
		}}); 
		break;

	case "farm":
		message.channel.send(`https://youtu.be/60Lci-OcpFw`);
		break;
		
	case "void":
		callWarframeAPI("voidTrader").then(r => {
			var voidTrader = r.body;
			message.channel.send({embed: {
				color: 3447003,
				title: `${voidTrader.character} - ${voidTrader.location}`,
				fields: [{
						name: "Time until arrival",
						value: voidTrader.startString
					}
				],
			}});
		});
		break;

	case "time":
		callWarframeAPI("cetusCycle").then(r => {
			var isDay = r.body.isDay;
			var timeTillChange = r.body.shortString
			
			// If night
			var color = 0;
			var flavorText = ":first_quarter_moon: It is currently night time, don't go out! :no_entry_sign:";
			var timeUntil = "Time until day:";
			// If day
			if (isDay == true) {
				color = 16776960;
				var flavorText = ":sunny: It is currently day time! Happy fishing! :fish:";
				var timeUntil = "Time until night:";
			}
		
			message.channel.send({embed: {
				color: color,
				title: "What time is it in Cetus?",
				description: flavorText,
				fields: [
					{
						name: timeUntil,
						value: timeTillChange
					}
				]
			}});
		});
		break;

	case "alert":
		callWarframeAPI("alerts").then(r => {
			let alerts = r.body;
			
			for (let i = 0; i < alerts.length && i < MAX_ALERTS; i++) {
				let alert = alerts[i];

				message.channel.send(alertEmbed(alert));
			}
		});
		break;
	
	case "report":
		var index = subscribed_users.indexOf(message.channel);
		if(index === -1) {
			subscribed_users.push(message.channel);
			if(message.channel.name)
				console.log(`Channel ${message.channel.name} added to report list`);
			else
				console.log(`User ${message.author.username} added to report list`);
			message.channel.send("Added you!");
		}
		else {
			message.channel.send("You are already added.");
		}
		break;
	case "unreport":
		var index = subscribed_users.indexOf(message.channel);
		if (index > -1) {
			subscribed_users.splice(index, 1);
			if(message.channel.name)
				console.log(`Channel ${message.channel.name} removed from report list`);
			else
				console.log(`User ${message.author.username} removed from report list`);
			message.channel.send("Removed you!");
		}
		else {
			message.channel.send("You are not on the reporting list.");
		}
		break;

	case "purge":
		const deleteCount = parseInt(args[0], 10);
		
		if(!deleteCount || deleteCount < 2 || deleteCount > 100)
			return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");
		
		const fetched = await message.channel.fetchMessages({count: deleteCount});
		message.channel.bulkDelete(fetched)
			.catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
		break;
	}
});

let lastDate = false;
function restartClient() {
	let now = new Date();
	if(!lastDate || lastDate-Date > 60*5){
		console.info("Connecting to discord");
		client.login(config.token).catch((reason) => {
			console.error(`Unable to login to discord: ${reason}`);
		});
		lastDate = now;
	}
}

client.on("error", error => {
	restartClient();
});

restartClient();