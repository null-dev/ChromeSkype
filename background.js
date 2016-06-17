chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.cmd === "MESSAGE_COUNT") {
		//Prevent notifications when Skype's built-in notifications already include them
		if(enableNotifications) {
			notify(request.notificationCount);
		}
		enableNotifications = false;
	} else if(request.cmd === "SEND_NOTIFICATION") {
		notifyFull(request.notification);
	}
});

var enableNotifications = true;
var openWindow;
var windowShowing = false;
var windowMinimized = false;
var WINDOW_REFRESH_INTERVAL = 900000;

function createNewWindow(show) {
	enableNotifications = true;
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
            windowMinimized = false;
            window.onClosed.addListener(function() {
				windowMinimized = false;
                createNewWindow(false);
            });
            //Minimize and restore listeners
            window.onMinimized.addListener(function() {
				windowMinimized = true;
				windowShowing = false;
			});
			window.onRestored.addListener(function() {
				windowMinimized = false;
				windowShowing = true;
			});
	    }
    });
}

createNewWindow(false);

function showWindow() {
	//Clear all notifications
	chrome.notifications.getAll(function(all){
		var keys = Object.keys(all);
		for(var i = 0; i < keys.length; i++) {
			chrome.notifications.clear(keys[i]);
		}
	});
    if (openWindow === undefined) {
        createNewWindow(true);
    } else {
        openWindow.show();
        windowShowing = true;
        windowMinimized = false;
    }
}

//Required because sometimes when Skype starts when network is disconnected, it will never work again until it is completely restarted
function refreshSkypeWindow() {
	//Only do this if the window was never open (currently in the background)
	if(!windowShowing && !windowMinimized) {
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

function notifyFull(notification) {
    var xhr = new XMLHttpRequest();
    var parsed = new URL(notification.icon);
    var profileName = parsed.pathname.split('/')[2];
	xhr.open("GET", "https://api.skype.com/users/" + profileName + "/profile/avatar?returnDefaultImage=true");
	xhr.responseType = "blob";
	xhr.onload = function(){
		var blob = this.response;
		var iconUrl = window.URL.createObjectURL(blob);
		chrome.notifications.create(notification.title, {
			type: "basic",
        	title: notification.title,
        	message: notification.body,
        	iconUrl: iconUrl
        });
	};
	xhr.onerror = function(){
		chrome.notifications.create(notification.title, {
			type: "basic",
        	title: notification.title,
        	message: notification.body,
        	iconUrl: "icon.png"
        });
	};
	xhr.send(null);
}

function notify(notificationCount) {
	if(windowShowing) {
		return;
	}
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
