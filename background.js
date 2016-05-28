chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    notify(request.notificationCount);
});

var openWindow;
var windowShowing = false;
var WINDOW_REFRESH_INTERVAL = 900000;

function createNewWindow(show) {
	if(openWindow !== undefined) {
		openWindow.close();
		openWindow = undefined;
	}
    chrome.app.window.create("window.html", {
        outerBounds: {
            width: 400,
            height: 600
        },
        hidden: !show
    }, function(window) {
		if(openWindow !== undefined) {
			window.close()
		} else {
			windowShowing = show;
            openWindow = window;
            window.onClosed.addListener(function() {
                createNewWindow(false);
            });
	    }
    });
}

createNewWindow(false);

function showWindow() {
    if (openWindow === undefined) {
        createNewWindow(true);
    } else {
        openWindow.show();
        windowShowing = true;
    }
}

//Required because sometimes when Skype starts when network is disconnected, it will never work again until it is completely restarted
function refreshSkypeWindow() {
	//Only do this if the window was never open (currently in the background)
	if(!windowShowing) {
		createNewWindow(false);
	}
	setTimeout(refreshSkypeWindow, WINDOW_REFRESH_INTERVAL);
}
//We don't want to do this right away so use chained setTimeouts
setTimeout(refreshSkypeWindow, WINDOW_REFRESH_INTERVAL);

chrome.app.runtime.onLaunched.addListener(function() {
    showWindow();
});

chrome.notifications.onClicked.addListener(function(){
	showWindow();
});

var lastNotificationCount = 0;

var notificationId = "nc";

function notify(notificationCount) {
    var title = "Skype - " + notificationCount + " New";
    if (notificationCount > lastNotificationCount) {
        if (notificationCount == 0) {
            chrome.notifications.clear(notificationId);
        } else {
            chrome.notifications.create(notificationId, {
                type: "basic",
                title: title,
                message: "You have " + notificationCount + " new messages on Skype!",
                iconUrl: "icon.png"
            });
        }
    }
    lastNotificationCount = notificationCount;
}
