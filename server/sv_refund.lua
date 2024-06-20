if Config.Framework == 'QBCore' then
    local QBCore = exports['qb-core']:GetCoreObject()

    RegisterCommand(Config.RefundCommand, function(source, args)
        local randomcode = args[1]
        if not randomcode then
            TriggerClientEvent(Config.NotificationQBCore, source, Config.CommandUsage)
            return
        end

        MySQL.Async.fetchAll('SELECT items FROM refunds WHERE randomcode = @code', {
            ['@code'] = randomcode
        }, function(results)
            if results and #results > 0 then
                local itemsData = results[1].items

                itemsData = itemsData:gsub("'", '"')

                local items = json.decode(itemsData)

                if items and next(items) then
                    local Player = QBCore.Functions.GetPlayer(source)
                    if Player then
                        for itemName, amount in pairs(items) do
                            amount = tonumber(amount) or 0

                            if amount > 0 then
                                Player.Functions.AddItem(itemName, amount)
                            else
                                TriggerClientEvent(Config.NotificationQBCore, source, Config.InvalidAmountFound)
                                return
                            end
                        end

                        MySQL.Async.execute('DELETE FROM refunds WHERE randomcode = @code', {
                            ['@code'] = randomcode
                        }, function(rowsChanged)
                            if rowsChanged > 0 then
                                TriggerClientEvent(Config.NotificationQBCore, source, Config.CodeFoundMessage)
                            else
                                TriggerClientEvent(Config.NotificationQBCore, source, Config.CodeNotFoundMessage)
                            end
                        end)
                    else
                        TriggerClientEvent(Config.NotificationQBCore, source, Config.PlayerDataNotFound)
                    end
                else
                    TriggerClientEvent(Config.NotificationQBCore, source, Config.InvalidDataFound)
                end
            else
                TriggerClientEvent(Config.NotificationQBCore, source, Config.CodeNotFoundMessage)
            end
        end)
    end, false)

elseif Config.Framework == 'ESX' then 
    local ESX = exports['es_extended']:getSharedObject()

    RegisterCommand(Config.RefundCommand, function(source, args)
        local randomcode = args[1]
        if not randomcode then
            TriggerClientEvent(Config.NotificationESX, source, Config.CommandUsage)
            return
        end
    
        MySQL.Async.fetchAll('SELECT items FROM refunds WHERE randomcode = @code', {
            ['@code'] = randomcode
        }, function(results)
            if results and #results > 0 then
                local itemsData = results[1].items

                itemsData = itemsData:gsub("'", '"')

                local items = json.decode(itemsData)

                if items and next(items) then
                    local Player = ESX.GetPlayerFromId(source)
                    if Player then
                        for itemName, amount in pairs(items) do
                            amount = tonumber(amount) or 0

                            if amount > 0 then
                                print("Adding item:", itemName, "Amount:", amount) -- Debugging
                                Player.addInventoryItem(itemName, amount)
                            else
                                TriggerClientEvent(Config.NotificationESX, source, Config.InvalidAmountFound)
                                return
                            end
                        end

                        MySQL.Async.execute('DELETE FROM refunds WHERE randomcode = @code', {
                            ['@code'] = randomcode
                        }, function(rowsChanged)
                            if rowsChanged > 0 then
                                TriggerClientEvent(Config.NotificationESX, source, Config.CodeFoundMessage)
                            else
                                TriggerClientEvent(Config.NotificationESX, source, Config.CodeNotFoundMessage)
                            end
                        end)
                    else
                        TriggerClientEvent(Config.NotificationESX, source, Config.PlayerDataNotFound)
                    end
                else
                    TriggerClientEvent(Config.NotificationESX, source, Config.InvalidDataFound)
                end
            else
                TriggerClientEvent(Config.NotificationESX, source, Config.CodeNotFoundMessage)
            end
        end)
    end, false)
end
