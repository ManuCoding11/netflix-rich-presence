"use strict";

/**
 * Attempts to query the name of the currently watched Netflix title.
 * @returns {String | null}
 */
function getTitleName() {
    for (let tag of document.getElementsByTagName('h4')) {
        if (tag.parentElement.classList.contains('medium')) return tag.innerText
    }

    return (document.querySelector('div.ltr-qnht66') ?? { firstChild: { innerText: null } }).firstChild.innerText
}

new window.MutationObserver((record, observer) => {
    if (!window.location.href.match(/(http|https):\/\/www\.netflix\.com\/watch(\/.*)?/)) {
        ExtensionActions.clearTitle()
        return
    }

    let title = getTitleName()
    if (title) {
        ExtensionActions.updateTitle(title, true)
        ExtensionActions.logTitle()
    }
}).observe(document.body, { childList: true, subtree: true })
