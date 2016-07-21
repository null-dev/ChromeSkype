console.log("[CS] Script injected!");

var eventSource;
window.addEventListener("message", function(event) {
    eventSource = event.source;
    if(event.data === "REQUEST_MESSAGE_COUNT") {
		respondMessageCount(event);
	} else if(event.data === "ACCEPT_AUDIO_CALL") {
		changeCallState("acceptWithAudio");
	} else if(event.data === "ACCEPT_VIDEO_CALL") {
		changeCallState("acceptWithVideo");
	} else if(event.data === "REJECT_CALL") {
		changeCallState("reject");
	}
    //Also try to login using Microsoft Account automatically
    var msLink = document.getElementById("signInMSALink");
    if(msLink !== undefined && msLink !== null) {
		//Don't click on it when it is not visible
		var msWrapper = document.getElementById("signInMSA");
		if(msWrapper !== undefined && msWrapper !== null && msWrapper.style !== undefined && msWrapper.style !== null && msWrapper.style.display === "none") {
			console.log("[CS] Ignoring Microsoft Sign In Link!");
		} else {
			msLink.click();
		}
	}
}, false);

function changeCallState(action) {
	var possibleButtons = document.getElementsByClassName("btn primary circle");
	for(var i = 0; i < possibleButtons.length; i++) {
		var button = possibleButtons[i];
		var dataset = button.dataset;
		if(dataset !== undefined && dataset !== null) {
			if(dataset.click === action) {
				button.click();
			}
		}
	}
}

function respondMessageCount(event) {
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
}

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

var chromeSkypeGithubLinkId = "chromeSkypeGithubLink";
var chromeSkypeGithubLinkId2 = "chromeSkypeGithubLink2";
var chromeSkypeWebStoreLinkId = "chromeSkypeWebStoreLink";
var rightFooterContent = `
<p class="smaller">
	<!-- Single link for narrow layouts -->
	<span class="noShort noNarrow">ChromeSkype</span>
	<span class="noMedium noWide"><a id="` + chromeSkypeGithubLinkId + `">ChromeSkype</a></span>
</p>
<p class="smaller">·</p>
<!-- Long links for wide layouts-->
<span class="noShort noNarrow">
	<p class="smaller">
		<a id="` + chromeSkypeGithubLinkId2 + `">Github</a>
	</p>
	<p class="smaller">·</p>
	<p class="smaller">
		<a id="` + chromeSkypeWebStoreLinkId + `">Chrome Web Store</a>
	</p>
	<p class="smaller">·</p>
</span>
<p class="smaller">
	<span class="noShort noNarrow">© 2016 Skype and/or Microsoft.</span>
	<span class="noMedium noWide">© 2016 Skype/Microsoft.</span>
</p>`;
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
		wholeFooter.style["padding-right"] = "0.75em";
	}
	rightFooter = document.querySelector(".legal");
	if(rightFooter !== undefined) {
		rightFooter.innerHTML = rightFooterContent;
		//Hook links
		document.getElementById(chromeSkypeGithubLinkId).addEventListener('click', function() {
			openChromeSkypeRepo();
		});
		document.getElementById(chromeSkypeGithubLinkId2).addEventListener('click', function() {
			openChromeSkypeRepo();
		});
		document.getElementById(chromeSkypeWebStoreLinkId).addEventListener('click', function() {
			openChromeSkypeWebStore();
		});
	}
}

//Link open command senders
function openChromeSkypeRepo() {
	eventSource.postMessage({cmd: "OPEN_CHROMESKYPE_REPO_LINK"}, "*");
}
function openChromeSkypeWebStore() {
	eventSource.postMessage({cmd: "OPEN_CHROMESKYPE_WEBSTORE_LINK"}, "*");
}

document.addEventListener("SkypeLoaded", function(e) {
	console.log("[CS] Processing page footer...");
	removeFooterElements();
});

document.addEventListener("SkypeNotification", function(e) {
	eventSource.postMessage({cmd: "SEND_NOTIFICATION", notification: e.detail}, "*");
});
