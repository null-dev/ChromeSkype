chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    notify(request.notificationCount);
});

var openWindow;

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
    }
}

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
