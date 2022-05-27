"use strict";

let currentTitle = ""
let isCleared = true
let startTimestamp = 0

/**
 * @param {ExtensionMessage} msg 
 * @param {chrome.runtime.MessageSender} sender 
 * @param {Function} sendRes
 */
function messageListener(msg, sender, sendRes) {
    if (!msg) return

    switch (msg.action) {
        case 'log':
            console.log(msg.debug)
            break

        case 'title-clear':
            currentTitle = ""
            isCleared = true
            break

        case 'title-update':
            if (currentTitle !== msg.title.content || !msg.title.cache)
                currentTitle = msg.title.content

            if (isCleared) {
                startTimestamp = Date.now()
                isCleared = false
            }
            break

        case 'title-log':
            console.log(currentTitle)
            break
    }
}

chrome.runtime.onMessage.addListener(messageListener)
