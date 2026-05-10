export const TEXTURE_CDN_BASE = 'https://raw.githubusercontent.com/rom1504/minecraft-assets/master/data/1.18.2'

export function getBlockTextureURL(blockId: string): string {
  const textureName = blockId.replace('minecraft:', '')
  return `${TEXTURE_CDN_BASE}/textures/block/${textureName}.png`
}

export function getItemTextureURL(blockId: string): string {
  const textureName = blockId.replace('minecraft:', '')
  return `${TEXTURE_CDN_BASE}/textures/item/${textureName}.png`
}

export const BLOCK_TEXTURE_MAP: Record<string, string> = {
  'minecraft:stone': 'stone',
  'minecraft:cobblestone': 'cobblestone',
  'minecraft:oak_planks': 'oak_planks',
  'minecraft:spruce_planks': 'spruce_planks',
  'minecraft:birch_planks': 'birch_planks',
  'minecraft:dark_oak_planks': 'dark_oak_planks',
  'minecraft:bricks': 'bricks',
  'minecraft:stone_bricks': 'stone_bricks',
  'minecraft:glass': 'glass',
  'minecraft:tinted_glass': 'tinted_glass',
  'minecraft:white_wool': 'white_wool',
  'minecraft:concrete': 'white_concrete',
  'minecraft:obsidian': 'obsidian',
  'minecraft:crying_obsidian': 'crying_obsidian',
  'minecraft:grass_block': 'grass_block_top',
  'minecraft:dirt': 'dirt',
  'minecraft:oak_log': 'oak_log_top',
  'minecraft:spruce_log': 'spruce_log_top',
  'minecraft:sand': 'sand',
  'minecraft:gravel': 'gravel',
  'minecraft:end_stone': 'end_stone',
  'minecraft:netherrack': 'netherrack',
  'minecraft:basalt': 'basalt_top',
  'minecraft:blackstone': 'blackstone_top',
  'minecraft:redstone_block': 'redstone_block',
  'minecraft:redstone_wire': 'redstone_dust_line',
  'minecraft:redstone_torch': 'redstone_torch',
  'minecraft:repeater': 'repeater',
  'minecraft:comparator': 'comparator',
  'minecraft:lever': 'lever',
  'minecraft:stone_button': 'stone_button',
  'minecraft:oak_button': 'oak_button',
  'minecraft:piston': 'piston_top',
  'minecraft:sticky_piston': 'piston_top_sticky',
  'minecraft:observer': 'observer_top',
  'minecraft:hopper': 'hopper_top',
  'minecraft:dropper': 'dropper_front',
  'minecraft:dispenser': 'dispenser_front',
  'minecraft:trapped_chest': 'trapped_chest_front',
  'minecraft:daylight_detector': 'daylight_detector_top',
  'minecraft:heavy_weighted_pressure_plate': 'iron_block',
  'minecraft:light_weighted_pressure_plate': 'gold_block',
  'minecraft:stone_pressure_plate': 'stone',
  'minecraft:oak_pressure_plate': 'oak_planks',
  'minecraft:tripwire_hook': 'tripwire_hook',
  'minecraft:oak_stairs': 'oak_planks',
  'minecraft:spruce_stairs': 'spruce_planks',
  'minecraft:stone_stairs': 'stone_bricks',
  'minecraft:cobblestone_stairs': 'cobblestone',
  'minecraft:oak_slab': 'oak_planks',
  'minecraft:spruce_slab': 'spruce_planks',
  'minecraft:stone_slab': 'stone',
  'minecraft:cobblestone_slab': 'cobblestone',
  'minecraft:oak_door': 'oak_door_top',
  'minecraft:spruce_door': 'spruce_door_top',
  'minecraft:iron_door': 'iron_door_top',
  'minecraft:oak_trapdoor': 'oak_trapdoor',
  'minecraft:spruce_trapdoor': 'spruce_trapdoor',
  'minecraft:iron_trapdoor': 'iron_trapdoor',
  'minecraft:fence': 'oak_planks',
  'minecraft:spruce_fence': 'spruce_planks',
  'minecraft:nether_brick_fence': 'nether_bricks',
  'minecraft:glass_pane': 'glass',
  'minecraft:torch': 'torch',
  'minecraft:soul_torch': 'soul_torch',
  'minecraft:wall_torch': 'torch',
  'minecraft:redstone_wall_torch': 'redstone_torch',
  'minecraft:ladder': 'ladder',
  'minecraft:iron_bars': 'iron_bars',
  'minecraft:chain': 'chain',
  'minecraft:bell': 'bell',
  'minecraft:lightning_rod': 'lightning_rod',
  'minecraft:lantern': 'lantern',
  'minecraft:soul_lantern': 'soul_lantern',
  'minecraft:crafting_table': 'crafting_table_top',
  'minecraft:furnace': 'furnace_front',
  'minecraft:blast_furnace': 'blast_furnace_front',
  'minecraft:smoker': 'smoker_front',
  'minecraft:enchanting_table': 'enchanting_table_top',
  'minecraft:anvil': 'anvil_top',
  'minecraft:grindstone': 'grindstone_side',
  'minecraft:stonecutter': 'stonecutter_bottom',
  'minecraft:loom': 'loom_front',
  'minecraft:cartography_table': 'cartography_table_top',
  'minecraft:fletching_table': 'fletching_table_top',
  'minecraft:smithing_table': 'smithing_table_top',
  'minecraft:lectern': 'lectern_top',
  'minecraft:chest': 'chest_front',
  'minecraft:ender_chest': 'ender_chest_front',
  'minecraft:barrel': 'barrel_side',
  'minecraft:shulker_box': 'shulker_box',
  'minecraft:beehive': 'beehive_side',
  'minecraft:bee_nest': 'bee_nest_side',
  'minecraft:composter': 'composter_side',
  'minecraft:note_block': 'note_block',
  'minecraft:jukebox': 'jukebox',
  'minecraft:cauldron': 'cauldron_side',
  'minecraft:iron_block': 'iron_block',
  'minecraft:gold_block': 'gold_block',
  'minecraft:diamond_block': 'diamond_block',
  'minecraft:netherite_block': 'netherite_block',
  'minecraft:emerald_block': 'emerald_block',
  'minecraft:lapis_block': 'lapis_block',
  'minecraft:coal_block': 'coal_block',
  'minecraft:amethyst_block': 'amethyst_block',
  'minecraft:slime_block': 'slime_block',
  'minecraft:honey_block': 'honey_block_bottom',
  'minecraft:honeycomb_block': 'honeycomb_block',
  'minecraft:target': 'target_top',
  'minecraft:sculk_sensor': 'sculk_sensor_top',
  'minecraft:sculk_catalyst': 'sculk_catalyst_top',
  'minecraft:sculk_shrieker': 'sculk_shrieker_top',
  'minecraft:powered_rail': 'powered_rail',
  'minecraft:detector_rail': 'detector_rail',
  'minecraft:activator_rail': 'activator_rail',
  'minecraft:tripwire': 'tripwire',
}

export function getMCTextureURL(blockId: string): string {
  const textureName = BLOCK_TEXTURE_MAP[blockId]
  if (textureName) {
    return `https://raw.githubusercontent.com/Faithful-Pack/Default-Java/1.18.2/assets/minecraft/textures/block/${textureName}.png`
  }
  const simpleName = blockId.replace('minecraft:', '')
  return `https://raw.githubusercontent.com/Faithful-Pack/Default-Java/1.18.2/assets/minecraft/textures/block/${simpleName}.png`
}

export function getMCTextureURLProxy(blockId: string): string {
  const textureName = BLOCK_TEXTURE_MAP[blockId]
  if (textureName) {
    return `https://corsproxy.io/?https://raw.githubusercontent.com/Faithful-Pack/Default-Java/1.18.2/assets/minecraft/textures/block/${textureName}.png`
  }
  const simpleName = blockId.replace('minecraft:', '')
  return `https://corsproxy.io/?https://raw.githubusercontent.com/Faithful-Pack/Default-Java/1.18.2/assets/minecraft/textures/block/${simpleName}.png`
}

export function getMCItemTextureURL(itemId: string): string {
  const simpleName = itemId.replace('minecraft:', '')
  return `https://raw.githubusercontent.com/Faithful-Pack/Default-Java/1.18.2/assets/minecraft/textures/item/${simpleName}.png`
}
