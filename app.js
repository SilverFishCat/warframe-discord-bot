const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");

const warframe_api = "https://api.warframestat.us/pc/";
const snekfetch = require("snekfetch");

function callWarframeAPI(noun) {
  return snekfetch.get(warframe_api + noun);
}

const MAX_ALERTS = 5;

client.on("ready", () => {
  
  console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`); 
  client.user.setActivity(`${config.prefix}help | In Dev`);
});

client.on("guildCreate", guild => {
  console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
  client.user.setActivity(`${config.prefix}help | In Dev`);
});

client.on("guildDelete", guild => {
  console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`${config.prefix}help | In Dev`);
});

client.on("message", async message => {

  if(message.author.bot) return;

  if(message.content.indexOf(config.prefix) !== 0) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if(command === "help") {
    message.author.send({embed: {
    color: 3447003,
    author: {
      name: client.user.username,
      icon_url: client.user.avatarURL
    },
    title: "Help command",
    description: "Help and information about the warframe bot.",
    fields: [{
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
    timestamp: new Date(), 
    footer: {
      icon_url: client.user.avatarURL,
    }
  }
});
  }

    if(command === "stat") {
        message.channel.send({embed: {
            color: 16716947,
            description: `I am serving ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`
        }}); 
    }

    if(command === "code") {
        message.channel.send({embed: {
            color: 16729344,
            description: `Check out the code over at [Github](https://github.com/zippy4/warframe-discord-bot)`
        }}); 
    }

    if(command === "farm") {
        message.channel.send(`https://youtu.be/60Lci-OcpFw`
          );
    }
    
 if(command === "void") {
    callWarframeAPI("voidTrader").then(r => {
      var voidTrader = r.body;
      message.channel.send({embed: {
    color: 3447003,
    author: {
      name: voidTrader.character,
      icon_url: client.user.avatarURL
    },
    title: "Location:",
    description: voidTrader.location,
    fields: [{
        name: "Time until arrival",
        value: voidTrader.startString
      }
    ],
  }
});
    });
  }

  if(command === "time") {
	  callWarframeAPI("cetusCycle").then(r => {
			var body = r.body.isDay;
      var shortString = r.body.shortString
    if (body == true) {
      message.channel.send({embed: {
    color: 16776960,
    author: {
      name: client.user.username,
      icon_url: client.user.avatarURL
    },
    title: "Time for",
    url: "",
    description: "Plains of Eidolon",
    fields: [{
        name: "What time is it?",
        value: ":sunny: It is currently day time! Happy fishing! :fish:"
      },
      {
        name: "Time until night:",
        value: shortString
      }
    ],
    timestamp: new Date(),
    footer: {
      icon_url: client.user.avatarURL,
      text: "Warframe Bot | Zippy"
    }
  }
});
    }else
      message.channel.send({embed: {
    color: 0,
    author: {
      name: client.user.username,
      icon_url: client.user.avatarURL
    },
    title: "Time for",
    url: "",
    description: "Plains of Eidolon",
    fields: [{
        name: "What time is it?",
        value: ":first_quarter_moon: It is currently night time, don't go out! :no_entry_sign:"
      },
      {
        name: "Time until day:",
        value: shortString
      }
    ],
    timestamp: new Date(),
    footer: {
      icon_url: client.user.avatarURL,
      text: "Warframe Bot | Zippy"
    }
  }
});
	  });
  }

  if(command === "alert") {
    callWarframeAPI("alerts").then(r => {
      let alerts = r.body;
      
      for (let i = 0; i < alerts.length && i < MAX_ALERTS; i++) {
        let alert = alerts[i];

        message.channel.send({embed: {
          color: 3447003,
          author: {
            name: `Alert #${i+1}`,
            icon_url: alert.mission.reward.thumbnail
          },
          title: `Type: ${alert.mission.type}`,
          description: alert.mission.node,
          fields: [
            {
              name: "Loot",
              value: alert.mission.reward.asString
            },
            {
              name: "Min Enemy Level",
              value: alert.mission.minEnemyLevel
            },
            {
              name: "Max Enemy Level",
              value: alert.mission.maxEnemyLevel
            }
          ],
          footer: {
            icon_url: alert.mission.reward.thumbnail,
            text: `Timeleft: ${alert.eta}`
          }
        }});
      }
    });

  }

  if(command === "purge") {

    const deleteCount = parseInt(args[0], 10);
    
    if(!deleteCount || deleteCount < 2 || deleteCount > 100)
      return message.reply("Please provide a number between 2 and 100 for the number of messages to delete");
    
    const fetched = await message.channel.fetchMessages({count: deleteCount});
    message.channel.bulkDelete(fetched)
      .catch(error => message.reply(`Couldn't delete messages because of: ${error}`));
  }
});

client.login(config.token);
           