import { MODULE_SHORT, MODULE_TITLE } from "../module/const.js";
import { PatchingUtility } from "./patching.js";
import { CoreUtility } from "./core.js";
import { LogUtility } from "./log.js";
import { SettingsUtility, SETTING_NAMES } from "./settings.js";
import { RollUtility } from "./roll.js";
import { SheetUtility } from "./sheet.js";
import { ItemUtility } from "./item.js";

export const HOOKS_CORE = {
    INIT: "init",
    READY: "ready",
    CREATE_ITEM: "createItem",
    RENDER_CHAT_MSG: "renderChatMessage"
}

export const HOOKS_DND5E = {
    USE_ITEM: "dnd5e.useItem",
    RENDER_ITEM_SHEET: "renderItemSheet5e"
}

export const HOOKS_MODULE = {
    LOADED: `${MODULE_SHORT}.loaded`,
    CHAT_MSG: `${MODULE_SHORT}.chatMessage`,
    RENDER: `${MODULE_SHORT}.render`,
    PROCESSED_ROLL: `${MODULE_SHORT}.rollProcessed`
}

/**
 * Utility class to handle registering listeners for hooks needed throughout the module.
 */
export class HooksUtility {
    /**
     * Register all necessary hooks for the module as a whole.
     */
    static registerModuleHooks() {
        Hooks.once(HOOKS_CORE.INIT, () => {
            LogUtility.log(`Initialising ${MODULE_TITLE}`);

            if (!libWrapper.is_fallback && !libWrapper.version_at_least?.(1, 4, 0)) {
                Hooks.once(HOOKS_CORE.READY, () => {
                    const version = "v1.4.0.0";                    
                    LogUtility.logError(CoreUtility.localize(`${MODULE_SHORT}.messages.error.libWrapperMinVersion`, { version }));
                });        
                return;
            }

            SettingsUtility.registerSettings();
            PatchingUtility.patchActors();
            PatchingUtility.patchItems();
            PatchingUtility.patchItemSheets();
        });

        Hooks.on(HOOKS_CORE.READY, () => {
            Hooks.call(HOOKS_MODULE.LOADED);
        });

        Hooks.on(HOOKS_MODULE.LOADED, () => {          
            LogUtility.log(`Loaded ${MODULE_TITLE}`);
            CONFIG[MODULE_SHORT].combinedDamageTypes = foundry.utils.mergeObject(
                CONFIG.DND5E.damageTypes,
                CONFIG.DND5E.healingTypes,
                { recursive: false }
            );
            
            if (SettingsUtility.getSettingValue(SETTING_NAMES.OVERLAY_BUTTONS_ENABLED)) {
                HooksUtility.registerChatHooks();
            }

            if (SettingsUtility.getSettingValue(SETTING_NAMES.QUICK_ITEM_ENABLED)) { 
                HooksUtility.registerSheetHooks();
                HooksUtility.registerItemHooks();
            }
        });
    }

    /**
     * Register item specific hooks for module functionality.
     */
    static registerItemHooks() {
        Hooks.on(HOOKS_CORE.CREATE_ITEM, (item) => {
            ItemUtility.ensureFlagsOnitem(item);
        });

        Hooks.on(HOOKS_DND5E.USE_ITEM, (item, config, options) => {
            if (!options?.ignore) {
                RollUtility.rollItem(item, { ...config, ...options });
            }
        });
    }

    /**
     * Register chat specific hooks for module functionality.
     */
    static registerChatHooks() {

    }

    /**
     * Register sheet specific hooks for module functionality.
     */
    static registerSheetHooks() {
        Hooks.on(HOOKS_DND5E.RENDER_ITEM_SHEET, (app, html, data) => {
            SheetUtility.setAutoHeightOnSheet(app);
            SheetUtility.addModuleContentToSheet(app, html);
        });
    }
}