var webview = document.querySelector("webview");

var messageHandler = function(event) {
	//Intercept event if it is asking us to open the ChromeSkype repo link!
	if(event.data.cmd === "OPEN_CHROMESKYPE_REPO_LINK") {
		window.open('https://github.com/null-dev/ChromeSkype');
		return;
	} else if(event.data.cmd === "OPEN_CHROMESKYPE_WEBSTORE_LINK") {
		window.open('https://chrome.google.com/webstore/detail/chromeskype/oghlgehncgibpgmdcblhkbgggeflacnd');
		return;
	} else if(event.data.cmd === "SEND_NOTIFICATION") {
		//Forward to background page
		chrome.runtime.sendMessage({cmd: "SEND_NOTIFICATION", notification: event.data.notification});
	} else if(event.data.cmd === "MESSAGE_COUNT") {
		//Notify background page
		var notificationCount = event.data.notificationCount;
		if(notificationCount === NaN) {
			notificationCount = 0;
		}
		document.title = "Skype - " + notificationCount + " New Messages";
		chrome.runtime.sendMessage({cmd: "MESSAGE_COUNT", notificationCount: notificationCount});
	}
};

function showWindow() {
	chrome.runtime.sendMessage({cmd: "SHOW_WINDOW"});
}

chrome.notifications.onClosed.addListener(function(notificationId, byUser) {
	if(notificationId.startsWith("call") && byUser) {
		rejectCall();
	}
});

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
	showWindow();
	if(notificationId.startsWith("call")) {
		if(buttonIndex === 0) {
			acceptAudioCall();
		} else if(buttonIndex === 1) {
			acceptVideoCall();
		}
	}
});

function rejectCall() {
	try {
        webview.contentWindow.postMessage("REJECT_CALL", "*");
    } catch (error) {
        console.log("Error accepting audio call! Error: " + error);
    }
}

function acceptAudioCall() {
	try {
        webview.contentWindow.postMessage("ACCEPT_AUDIO_CALL", "*");
    } catch (error) {
        console.log("Error accepting audio call! Error: " + error);
    }
}

function acceptVideoCall() {
	try {
        webview.contentWindow.postMessage("ACCEPT_VIDEO_CALL", "*");
    } catch (error) {
        console.log("Error accepting video call! Error: " + error);
    }
}

var loaded = false;
function requestNotificationCount() {
    try {
        webview.contentWindow.postMessage("REQUEST_MESSAGE_COUNT", "*");
    } catch (error) {
        console.log("Error requesting message count! Error: " + error);
    }
}
setInterval(requestNotificationCount,3000);

var lastClickLink = undefined;
function clearLastLinkClick() {
	lastClickLink = undefined;
}
webview.addEventListener("loadcommit", function() {
    webview.addContentScripts([ {
        name: "message_counter",
        matches: [ "http://web.skype.com/*", "https://web.skype.com/*" , "https://login.skype.com/*", "http://login.skype.com/*"],
        js: {
            files: [ "content.js" ]
        },
        run_at: "document_end"
    } ]);
    webview.addContentScripts([ {
        name: "notification_interceptor",
        matches: [ "http://web.skype.com/*", "https://web.skype.com/*" , "https://login.skype.com/*", "http://login.skype.com/*"],
        js: {
            files: [ "content_start.js" ]
        },
        run_at: "document_start"
    } ]);
    window.addEventListener("message", messageHandler, false);
    //Skype calls newwindow five (or more) times every one click (and I have no idea why)
    //This forces us to have to cache link clicks and to make sure only one browser tab is opened :/
    webview.addEventListener('newwindow', function(e) {
		if(lastClickLink !== e.targetUrl) {
			lastClickLink = e.targetUrl;
			setTimeout(clearLastLinkClick, 10);
			chrome.browser.openTab({url: e.targetUrl});
		}
		e.preventDefault();
	});
});
//Webview should allow all permission requests
webview.addEventListener('permissionrequest', function(e) {
	e.request.allow();
});
