// Library for all referenced extension functions / types

/**
 * @typedef {Object} ExtensionMessage An object pattern for extension background messaging.
 * @property {ExtensionMessage.Action?} action
 * @property {ExtensionMessage.Title?} title
 * @property {ExtensionMessage.Debug?} debug
 *
 * @typedef {Object} ExtensionMessage.Title
 * @property {String} content
 * @property {boolean} cache
 *
 * @typedef {any} ExtensionMessage.Debug
 *
 * @typedef {'title-update' | 'title-clear' | 'title-log' | 'log'} ExtensionMessage.Action
 */

/**
 * A utility class containing messaging / shortcut functions for the whole extension.
 */
class ExtensionActions {

    /**
     * Sends a title update request to all background script listeners.
     * 
     * @param {String} title New title to send
     * @param {boolean} checkCache True if the new title should be compared to a cached value
     */
    static updateTitle(title, checkCache = true) {
        this.sendRawMessage({ action: 'title-update', title: { content: title, cache: checkCache } })
    }

    /**
     * Sends a title clear request to all background script listeners.
     */
    static clearTitle() {
        this.sendRawMessage({ action: 'title-clear' })
    }

    /**
     * Sends a request for logging the currently cached title to console.
     */
    static logTitle() {
        this.sendRawMessage({ action: 'title-log' })
    }

    /**
     * Sends a message to the background console logger.
     * 
     * @param {any} content Message to log
     */
    static runtimeLog(content) {
        this.sendRawMessage({ action: 'log', debug: content })
    }

    /**
     * Sends a raw JSON message to all background script listeners.
     * 
     * @param {ExtensionMessage} message Message to send
     * @param callback Optional response callback
     */
    static sendRawMessage(message, callback = (response) => { }) {
        chrome.runtime.sendMessage(message, callback)
    }
}
