console.log("[CS] Script injected!");

var eventSource;
window.addEventListener("message", function(event) {
    eventSource = event.source;
    var notifications = document.getElementsByClassName("counter");
    found = 0;
    for (i = 0; i < notifications.length; i++) {
        currentNode = notifications[i];
        while (currentNode.children.length > 0) {
            currentNode = currentNode.children[0];
        }
        found += parseInt(currentNode.innerHTML);
    }
    try {
        event.source.postMessage({cmd: "MESSAGE_COUNT", notificationCount: found}, "*");
    } catch (error) {
        console.log("[CS] Error sending response! Error: " + error);
    }
    //Also try to login using Microsoft Account automatically
    msLink = document.getElementById("signInMSALink");
    if(msLink !== undefined && msLink !== null) {
		msLink.click();
	}
}, false);

//Watches the document until Skype is loaded
var skypeShellElement = document.getElementById("shellSplashScreen");
var documentObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (!mutation.addedNodes) return

    for (var i = 0; i < mutation.removedNodes.length; i++) {
      var node = mutation.removedNodes[i];
      if(node === skypeShellElement) {
		  documentObserver.disconnect();
		  console.log("[CS] Loading complete!");
		  onLoadedEvent = new CustomEvent("SkypeLoaded");
		  document.dispatchEvent(onLoadedEvent);
		  break;
	  }
    }
  })
})
documentObserver.observe(document.body, {
    childList: true
  , subtree: true
  , attributes: false
  , characterData: false
})

var chromeSkypeLinkId = "chromeSkypeLink";
var rightFooterContent = '<p class="smaller"><a id="' + chromeSkypeLinkId + '">ChromeSkype</a></p><p class="smaller">&nbsp;·&nbsp;</p><p class="smaller"><span class="noShort noNarrow">© 2016 Skype and/or Microsoft.</span><span class="noMedium noWide">© 2016 Skype/Microsoft.</span></p>';
//Remove unusable links and text at bottom of screen (and append ChromeSkype info)
function removeFooterElements() {
	leftFooter = document.querySelector(".app");
	if(leftFooter !== undefined) {
		toRemove = document.querySelectorAll(".app > .smaller");
		for (i = 0; i < toRemove.length; i++) {
			leftFooter.removeChild(toRemove[i]);
        }
	}
	wholeFooter = document.getElementById("footer");
	if(wholeFooter !== undefined) {
		wholeFooter.style["padding-left"] = "0.75em";
	}
	rightFooter = document.querySelector(".legal");
	if(rightFooter !== undefined) {
		rightFooter.innerHTML = rightFooterContent;
		document.getElementById(chromeSkypeLinkId).addEventListener('click', function() {
			openChromeSkypeRepo();
		});
	}
}

function openChromeSkypeRepo() {
	eventSource.postMessage({cmd: "OPEN_CHROMESKYPE_REPO_LINK"}, "*");
}

document.addEventListener("SkypeLoaded", function(e) {
	console.log("[CS] Processing page footer...");
	removeFooterElements();
});

document.addEventListener("SkypeNotification", function(e) {
	eventSource.postMessage({cmd: "SEND_NOTIFICATION", notification: e.detail}, "*");
});
