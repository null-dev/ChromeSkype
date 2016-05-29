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
`;
(document.head||document.documentElement).appendChild(s);
console.log("[CS] Notification interceptor script injected!");
