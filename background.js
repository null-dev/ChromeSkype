chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.cmd === "MESSAGE_COUNT") {
		//Prevent notifications when Skype's built-in notifications already include them
		if(enableNotifications) {
			notify(request.notificationCount);
		}
		enableNotifications = false;
	} else if(request.cmd === "SEND_NOTIFICATION") {
		notifyFull(request.notification);
	} else if(request.cmd === "SHOW_WINDOW") {
		showWindow();
	}
});

var enableNotifications = true;
var openWindow;
var windowShowing = false;
var windowMinimized = false;
var WINDOW_REFRESH_INTERVAL = 15;

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
}

chrome.alarms.create("REFRESH_SKYPE_WINDOW", {
	delayInMinutes: WINDOW_REFRESH_INTERVAL,
	periodInMinutes: WINDOW_REFRESH_INTERVAL
});
chrome.alarms.onAlarm.addListener(function(alarm) {
	if(alarm.name === "REFRESH_SKYPE_WINDOW") {
		refreshSkypeWindow();
	}
});

chrome.app.runtime.onLaunched.addListener(function() {
    showWindow();
});

chrome.notifications.onClicked.addListener(function() {
	showWindow();
});

var lastNotificationCount = 0;

var notificationId = "nc";

//All buttons should be tinted: #BFBFBF
function notifyFull(notification) {
    var xhr = new XMLHttpRequest();
    var notificationId = notification.title;
    var notificationOptions = {
		type: "basic",
        title: notification.title,
        message: notification.body,
        isClickable: true,
        contextMessage: "Skype, " + formatAMPM(new Date())
    };
    //Custom notification for calls
    if(notification.tag !== undefined && notification.tag !== null && notification.tag.startsWith("newCall")) {
		notificationOptions.title = "Incoming Call";
		notificationOptions.message = "Incoming call from: " + notification.title + ". Dismiss this notification to reject the call.";
		notificationOptions.buttons = [{ title: "Accept Voice Call", iconUrl: "icon/accept-voice.svg"}, { title: "Accept Video Call", iconUrl: "icon/accept-video.svg"}];
		notificationId = "call_" + notification.title;
	}
	xhr.open("GET", notification.icon);
	xhr.responseType = "blob";
	xhr.onload = function(){
		var blob = this.response;
		var iconUrl = window.URL.createObjectURL(blob);
		notificationOptions.iconUrl = iconUrl;
		chrome.notifications.create(notificationId, notificationOptions);
	};
	xhr.onerror = function(){
		notificationOptions.iconUrl = "icon/avatar_error.jpg";
		chrome.notifications.create(notificationId, notificationOptions);
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

/** Sourced from: http://stackoverflow.com/a/8888498/5054192 **/
function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}
