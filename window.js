var webview = document.querySelector("webview");

var messageHandler = function(event) {
    var notificationCount = event.data;
    console.log("Received message count: " + notificationCount);
    document.title = "Skype - " + notificationCount + " New Messages";
    chrome.runtime.sendMessage({notificationCount: notificationCount});
};

var loaded = false;
function requestNotificationCount() {
    try {
        webview.contentWindow.postMessage("Requesting message count...", "*");
    } catch (error) {
        console.log("Error requesting message count! Error: " + error);
    }
}
setInterval(requestNotificationCount,3000);
webview.addEventListener("loadcommit", function() {
    webview.addContentScripts([ {
        name: "message_counter",
        matches: [ "http://web.skype.com/*", "https://web.skype.com/*" , "https://login.skype.com/*", "http://login.skype.com/*"],
        js: {
            files: [ "content.js" ]
        },
        run_at: "document_end"
    } ]);
    window.addEventListener("message", messageHandler, false);
});
