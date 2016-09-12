var appendPlace = (document.head || document.documentElement);
var s = document.createElement("script");
s.innerHTML = `
	/* ==========[ChromeSkype Injected Script] ========== */
	console.log("[CS] Starting notification interceptor...");
	Notification.permission = "granted";
	var oldProto = Notification.prototype;
	Notification = function(title, options) {
		var tag;
		var icon;
		var body;
		if(options !== undefined) {
			tag = options.tag;
			icon = options.icon;
			body = options.body;
			this.body = body;
			this.tag = tag;
			this.icon = icon;
			console.log("[CS] Intercepted notification: " + title + ", " + tag + ", " + icon + ", " + body);
		} else {
			console.log("[CS] Intercepted notification: " + title);
		}
		this.title = title;
		this.requireInteraction = false;
		this.silent = false;
		this.timestamp = 0;
		//Close does nothing
		this.close = function(){};
		var customEvent = new CustomEvent("SkypeNotification", {
			'detail': {
				title: title,
				tag: tag,
				icon: icon,
				body: body
			}
		});
		document.dispatchEvent(customEvent);
	};
	//Calls only work on Linux and Mac OS X inside this extension (Skype on Windows tries to download their own extension)
	console.log("[CS] Modifying browser OS to make sure it is not Windows/Mac OS X...");
	var userAgent = window.navigator.userAgent;
	userAgent = userAgent.replace( new RegExp("(windows nt|windows|win32|macintosh|mac os x)", 'gi' ), "Linux" );
	/** http://stackoverflow.com/a/26888312/5054192 **/
	function setUserAgent(window, userAgent) {
		if (window.navigator.userAgent != userAgent) {
			var userAgentProp = { get: function () { return userAgent; } };
			try {
				Object.defineProperty(window.navigator, 'userAgent', userAgentProp);
			} catch (e) {
				window.navigator = Object.create(navigator, {
					userAgent: userAgentProp
				});
			}
		}
	}
	setUserAgent(window, userAgent);
`;
appendPlace.appendChild(s);
console.log("[CS] Notification interceptor script injected!");
