-- Compiled with roblox-ts v2.3.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local Players = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").Players
local makeHello = TS.import(script, game:GetService("ReplicatedStorage"), "TS", "module").makeHello
print(makeHello("main.client.ts"))
print(Players.LocalPlayer.Name)
