var webview = document.querySelector("webview");
var pop_webview = document.querySelector("#pop_webview");
var popup = document.querySelector("#popup");
var popup_close = document.querySelector("#popup_close");

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
	if(notificationId.startsWith("call")) {
		if(buttonIndex === 0) {
			acceptAudioCall();
		} else if(buttonIndex === 1) {
			acceptVideoCall();
		}
		showWindow();
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
function showPopup(url) {
	popup.style.opacity = 1;
	popup.style["pointer-events"] = "all";
	pop_webview.src = url;
}
function hidePopup() {
	popup.style.opacity = 0;
	popup.style["pointer-events"] = "none";
	pop_webview.src = "about:blank";
}
popup_close.onclick = hidePopup;
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
		console.log(e);
		if(lastClickLink !== e.targetUrl) {
			lastClickLink = e.targetUrl;
			//Proper image display
			if((lastClickLink.startsWith("https://api.asm.skype.com/") || lastClickLink.startsWith("http://api.asm.skype.com/")) && lastClickLink.endsWith("imgpsh_fullsize")) {
				showPopup(e.targetUrl);
			} else if(e.targetUrl !== 'about:blank') {
				chrome.browser.openTab({url: e.targetUrl});
			} else {
				//Redirector
				newWindow_openInTabAndInterceptRedirect(e.window);
			}
			setTimeout(clearLastLinkClick, 10);
		}
		e.preventDefault();
	});
});
/** http://stackoverflow.com/questions/18428668/how-to-open-a-new-window-from-a-link-in-a-webview-in-a-chrome-packaged-app **/
function newWindow_openInTabAndInterceptRedirect(newWindow) {
  // Create an invisible proxy webview to listen to redirect
  // requests from |newWindow| (the window that the guest is
  // trying to open). NOTE: The proxy webview currently has to
  // live somewhere in the DOM, so we append it to the body.
  // This requirement is in the process of being eliminated.
  var proxyWebview = document.createElement('webview');
  proxyWebview.style["pointer-events"] = "none";
  proxyWebview.style.opacity = 0;
  proxyWebview.style.width = "1px";
  proxyWebview.style.height = "1px";
  proxyWebview.style.position = "absolute";
  proxyWebview.style.top = 0;
  proxyWebview.style.left = 0;
  document.body.appendChild(proxyWebview);

  // Listen to onBeforeRequest event (chrome.webRequest API)
  // on proxyWebview in order to intercept newWindow's redirects.
  var onBeforeRequestListener = function(e) {
    // Only consider top-level non-blank redirects.
    if (e.type === "main_frame" && e.url !== 'about:blank') {
      chrome.browser.openTab({url: e.url});
      // Don't need proxyWebview anymore.
      document.body.removeChild(proxyWebview);
      // Handled this redirect: cancel further processing.
      return { cancel: true };
    } else {
      // Ignored this redirect: proceed with default processing.
      return { cancel: false };
    }
  };
  proxyWebview.request.onBeforeRequest.addListener(
    onBeforeRequestListener,
    { urls: [ "*://*/*" ] },
    [ 'blocking' ]
  );

  // Attach |newWindow| to proxyWebview. From the original
  // webview guest's point of view, the window is now opened
  // and ready to be redirected: when it does so, the redirect
  // will be intercepted by |onBeforeRequestListener|.
  newWindow.attach(proxyWebview);
}
//Webview should allow all permission requests
webview.addEventListener('permissionrequest', function(e) {
	e.request.allow();
});
