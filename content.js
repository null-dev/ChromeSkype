console.log("[CS] Script injected!");

window.addEventListener("message", function(event) {
    console.log("[CS] Message count requested!");
    var notifications = document.getElementsByClassName("counter");
    found = 0;
    for (i = 0; i < notifications.length; i++) {
        currentNode = notifications[i];
        while (currentNode.children.length > 0) {
            currentNode = currentNode.children[0];
        }
        found += parseInt(currentNode.innerHTML);
    }
    console.log("[CS] Found " + found + " messages!");
    try {
        event.source.postMessage(found, "*");
    } catch (error) {
        console.log("[CS] Error sending response! Error: " + error);
    }
    //Also try to login using Microsoft Account automatically
    msLink = document.getElementById("signInMSALink");
    if(msLink !== undefined && msLink !== null) {
		msLink.click();
	}
}, false);
