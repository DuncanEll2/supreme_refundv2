fx_version 'cerulean'
game 'gta5'
name 'Refund'
version '1.0.0'
description 'Refund Bot'
lua54 'yes'

shared_script {
	'config/config.lua'
}

server_scripts {
	'@oxmysql/lib/MySQL.lua',
    'server/sv_refund.lua',
}

escrow_ignore {
	'server/sv_refund.lua',
	'config/config.lua'
  }
