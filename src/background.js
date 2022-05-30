"use strict";

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
// Retrieve information from content script //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

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

// ~~~~~~~~~~~~~~~~~~~~~~~ //
// Update Discord Activity //
// ~~~~~~~~~~~~~~~~~~~~~~~ //

/**
 * 
 * @typedef ImplicitAuthResponse Object representing an API authorization response requested with the implicit authorization flow.
 * @property {String?} access_token Token for making subsequent requests to the API.
 * @property {String?} error Optional. Indicates the type of error that occurred.
 * @property {Number?} expires_in Seconds until the token is invalidated.
 * @property {String[]?} scopes Permission scope(s) granted for the token.
 * @property {String?} state Optional. Returns the 'state' parameter given in the request for validation.
 * @property {String?} token_type Type of the token. Should equal to 'Bearer'.
 * 
 * 
 * @typedef GatewayRequest Object representing a request to the Gateway API.
 * @property {Number} op Opcode to indicate the type of response. Must equal to one of {@link opcode}'s values.
 * @property {GatewayRequest.Data} d Request body in JSON format.
 * 
 * @typedef GatewayRequest.Data
 * @property {}
 * 
 * 
 * @typedef GatewayResponse Object representing a Gateway API response.
 * @property {Number} op Opcode to indicate the type of response. Must equal to one of {@link opcode}'s values.
 * @property {GatewayResponse.Data} d Response body in JSON format.
 * @property {Number?} s Sequence number used for resuming sessions and heartbeats. Only works with opcode 0.
 * @property {String?} t Event name for this payload. Only works with opcode 0.
 *
 * @typedef GatewayResponse.Data
 * @property {Number?} heartbeat_interval
 */

class Gateway extends WebSocket {
    /**
     * Transmits data using the WebSocket connection. data is a GatewayRequest object.
     * @param {GatewayRequest} data
     */
    send(data) {
        super.send.bind(this, JSON.stringify(data))()
        console.log(data)
    }

    sendHeartbeat() {
        super.send.bind(this, `{"op":${opcode.heartbeat},"d":{}}`)()
        const now = new Date(Date.now())
        console.log(`Heartbeat on ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`)
    }
}

/**
 * @typedef opcode
 */
const opcode = {
    dispatch: 0,
    heartbeat: 1,
    identify: 2,
    presence_update: 3,
    voice_state_update: 4,
    resume: 6,
    reconnect: 7,
    request_guild_members: 8,
    invalid_session: 9,
    hello: 10,
    heartbeat_ack: 11
}

/**
 * @param {String} url
 * @returns {ImplicitAuthResponse}
 */
function formatAuthURL(url) {
    /** @type {ImplicitAuthResponse} */
    let returnObj = {}

    const kvPairs = url.split('#', 2)[1].split('&').map((val) => val.split('='))
    kvPairs.forEach((kvArr) => returnObj[kvArr[0]] = kvArr[1])

    if (returnObj.expires_in) returnObj.expires_in = Number(returnObj.expires_in)
    if (returnObj.scope) {
        returnObj.scopes = returnObj.scope.split('+')
        delete returnObj.scope
    }

    return returnObj
}

const CLIENT_ID = '979375453460639774'
const SCOPES = ['rpc']//['activities.read', 'activities.write']
const authURL = `https://discord.com/api/v10/oauth2/authorize?response_type=token&client_id=${CLIENT_ID}&scope=${SCOPES.join('%20')}`

/** @type {Promise<ImplicitAuthResponse>} */
const token = new Promise((res, rej) => {
    chrome.tabs.create({ active: true, url: authURL }, (authTab) => {
        chrome.tabs.onUpdated.addListener((id, info, update) => {
            if (id == authTab.id && update.url.match(/(http|https):\/\/manucoding11\.github\.io\/netflix-rich-presence\/#.*/)) {
                res(formatAuthURL(update.url))
            }
        })
    })
})

token.then(async (tokenInfo) => {
    const gatewayLocation = new Promise(async (res) => {
        res(await (await fetch('https://discord.com/api/v10/gateway')).json())
    })

    const gateway = new Gateway((await gatewayLocation).url + '?v=9&encoding=json')

    let heartbeatInterval

    gateway.addEventListener("message", (msg_raw) => {
        /** @type {GatewayResponse} */
        const msg = JSON.parse(msg_raw.data)

        switch (msg.op) {
            case opcode.heartbeat:
                gateway.sendHeartbeat()
                break

            case opcode.hello:
                gateway.sendHeartbeat()
                heartbeatInterval = setInterval(gateway.sendHeartbeat.bind(gateway), msg.d.heartbeat_interval)
                break
        }

        console.log(msg)
    })

    gateway.addEventListener('close', (ev) => {
        clearInterval(heartbeatInterval)
        console.log('Gateway WebSocket closed.')
        console.log(ev)
    })
})
    .catch((reason) => console.error(reason))
