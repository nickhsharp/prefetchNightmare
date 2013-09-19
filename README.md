#Javascript Single Page Applications
##A prefetch and preload nightmare
####*Prefetch may EXECUTE your scripts... all aboard the Crazy Train!*

---

###TL;DR; - The Bloody Solution:
Use the Visibility API to avoid preFetch and preRender running your application code:
```javascript
if(!document.hidden) {
  init();
}
...
document.addEventListener("visibilityChange", function(e) {
  if(!document.hidden && !alreadyInited) {
    init();
  }
});
```
[MDN write-up]

---

###Tiny bit of Context for you:
Chrome prefetching actually excutes the linked Javascript files from a prefetched resource and will go so far as to open a webSocket connection and run a slew of GETs and POSTs.  **Exercise caution in your application init code!** 

So take advantage of the single not !@#$ way to avoid the execution of your preFetched assets by using the [Visibility API] - [Chrome], [FireFox] -  to only run your initialization code when the browser is actually running your application.

This will keep pushState, replaceState and people typing into the address bar from triggering complete loads of your application and even lazily loaded scripts and XHRs.

---

###You grock the context... lets go a bit deeper into the Why?
Chrome and FireFox are prefetching bosses. They can handle the rel="prefetch" and do their best to fetch not only the linked resource but also the resources linked directly by that resource.  Obviously when used with caution this can promote a far "snappier" feeling for the end user... Hooray!!! Right?

Chrome however takes a step down the road to crazy in that it also implements prefetching/prerendering when you type into the "OmniBox" ==> Address Bar. Pause there... think about that for a bit... think about server load, analytics etc... k, done shuddering? Carry on.

Then it goes full Crazy and also prefetches/prerenders "sometimes" when you do a History.pushState() or History.replaceState().

If you just shook your head and said WTF... then we are on the same page.  And if you are wondering why this bloody TL;DR; is so stinking long, it's because the coming article is going to get seriously ranty.

Now for the final step into the land of bat-!@#$ insanity... it then proceeds to execute all the linked scripts and will thus trigger most of your single page Application initialization code unless you take some serious steps to kill it with fire.

---

###Don't believe me? I don't blame you, thus... code examples!
You might want the following to really test this phenomenom for yourself

**Get [Node.js] then download our [Example App] **

If you are interested the example files are all inline here for your browsing pleasure.  The gist of it is the following:

First a fairly simple and standard HTML... loads a single .css and two .js with a little inline JavaScript.  This sucker should trigger a load of the following resources, with the subresources loaded by each script indented accordingly:
1. GET - index.hml
  2. GET - style.css
  3. GET - main.js
    4. GET - image.png
    5. GET - lazyload1.js
      6. GET - lazyload1.json
  7. GET - init.js
    8. (opens a websocket and send a message)
    9. GET - data.json 
  10. GET - lazyload2.js
    11. GET - lazyload2.json
  12. GET - api.json

So, feel free to peruse the content if you are wary of getting it from github... or you could just [skip to the analysis part] if that's more your cup of tea.

---

#####HTML
```html
<!DOCTYPE html>
<html class="no-js" lang="en">
    <head>
    <title>Prefetch Nightmare</title>
    <link rel="stylesheet" href="/public/css/styles.css">
  </head>
  <body>
    HELLO THE CRAZY
    <a class="pushState" title="#one" href="/one/one">pushState 1</a>
    <a class="pushState" title="#two" href="/two/two">pushState 2</a>
    <a class="pushState" title="#three" href="/three/three/things/2">pushState 3</a>
    <a class="replaceState" title="#four" href="/four/four">replaceState 4</a>
    <a class="pushState" title="#five" href="/five/five">pushState 5</a>
    <a class="back" title="#six" href="/six">back 6</a>
    <a class="back" title="#seven" href="/seven">back 7</a>
    <a class="forward" title="#eight" href="/eight">forward 8</a>
    <a class="forward" title="#nine" href="/nine">forward 9</a>

    <script src="/public/js/main.js"></script>
    <script src="/public/js/init.js"></script>
    <script>
      //Example of some Javascript that would load another script then hit an API... like GA
      var head, script1, xhr;
      head = document.getElementsByTagName("head").item(0);
      script = document.createElement("script");
      script.setAttribute("src", "public/js/lazyload2.js");
      head.appendChild(script);
      
      //How bout another Javascript that might hit a rate limited API... like a Twitter
      
      xhr = new XMLHttpRequest();
      xhr.open('GET', '/json/api.json', true);
      xhr.responseType = 'json';
      xhr.onload = function(e) {
        if (this.status == 200) {}
      };
      xhr.send();
      
    </script>
    <script>
      //setup the listener for those links
      document.addEventListener("click", function(e) {
        switch (e.target.className) {
          case "pushState":
            history.pushState({href:e.target.getAttribute("href")}, e.target.getAttribute("title"), e.target.getAttribute("href"));
            break;

          case "replaceState":
            history.replaceState({href:e.target.getAttribute("href")}, e.target.getAttribute("title"), e.target.getAttribute("href"));
            break;

          case "back":
            history.back();
            break;

          case "forward":
            history.forward();
            break;
        }
        
        e.preventDefault();
        return false;
      }, false);
      
      setTimeout(function() {
        //now lets play around with the history API a wee bit ourselves
        history.pushState({href:"/manually1"}, "Manually 1 Title", "/manually1");
        history.pushState({href:"/manually2"}, "Manually 2 Title", "/manually2");
        history.pushState({href:"/manually3"}, "Manually 3 Title", "/manually3/complex");
        history.replaceState({href:"/manually4"}, "Manually 4 Title", "/manually4");
        history.pushState({href:"/manually5"}, "Manually 5 Title", "/manually5");
        history.back();
        history.back();
        history.forward();
        history.forward();
      }, 500);
      
    </script>
  </body>
</html>
```

---
#####CSS
```css
body {
    color:red;
}
a {
    display:block;
}
```

---
#####JS (Browser)

**main.js**
```javascript
var head, script1, xhr;

//get an example image
xhr = new XMLHttpRequest();
xhr.open('GET', '/public/img/image1.png', true);
xhr.responseType = 'blob';
xhr.onload = function(e) {
  if (this.status == 200) {}
};
xhr.send();

//insert another script in standard fashion
head = document.getElementsByTagName("head").item(0);
script = document.createElement("script");
script.setAttribute("src", "/public/js/lazyload1.js");
head.appendChild(script);
```

**init.js**
```javascript
var ws, xhr;

//example open a websocket and send up a message
ws = new WebSocket("ws://localhost:1337");
ws.onopen = function(e){
    ws.send("START - "+ (new Date().getTime()));
  var count = 0;
  var timer = setInterval(function() {
    if(count >=5) {
      clearInterval(timer);
    }
    ws.send("ZOMBIE - "+ (new Date().getTime()));
    count++;
  },100)
  ws.onclose = function(e){
    console.log("WS closed: ", e);
  };
};
ws.onerror = function(e){
  console.log("Error with WS: ", e);
};
ws.onmessage = function(e){
  console.log("Message Received From WS: ", e);
}

//example get some data for a SPA
xhr = new XMLHttpRequest();
xhr.open('GET', '/json/data.json', true);
xhr.responseType = 'json';
xhr.onload = function(e) {
  if (this.status == 200) {}
};
xhr.send();
```

**lazyload1.js**
```javascript
var xhr;
xhr = new XMLHttpRequest();
xhr.open('GET', '/json/lazyload1.json', true);
xhr.responseType = 'json';
xhr.onload = function(e) {
  if (this.status == 200) {}
};
xhr.send();
```

**lazyload2.js**
```javascript
var xhr;
xhr = new XMLHttpRequest();
xhr.open('GET', '/json/lazyload2.json', true);
xhr.responseType = 'json';
xhr.onload = function(e) {
  if (this.status == 200) {}
};
xhr.send();
```
---
#####JS (Node)
**app.js**
```javascript
var express = require('express')
  , http = require('http')
  , https = require('https')
  , path = require('path')
  , fs = require('fs')
  , webSocket = require('ws')
    , webSocketServer = webSocket.Server
    

var app = express();

app.set('port', process.env.PORT || 1337);
app.use(express.errorHandler());
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('preFetch Nightmare'));
app.use(express.cookieSession());
app.use(app.router);

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.sendfile(__dirname + '/public/index.html');
});

app.get('/json/data.json', function(req,res) {
  console.log("Getting /json/data.json", new Date().getTime());
  res.setHeader('Content-Type', 'application/json');
  res.send('{"name":"data.json"}');
});

app.get('/json/api.json', function(req,res) {
  console.log("Getting /json/api.json", new Date().getTime());
  res.setHeader('Content-Type', 'application/json');
  res.send('{"name":"api.json"}');
});

app.get('/json/lazyload1.json', function(req,res) {
  console.log("Getting /json/lazyload1.json", new Date().getTime());
  res.setHeader('Content-Type', 'application/json');
  res.send('{"name":"lazyload1.json"}');
});

app.get('/json/lazyload2.json', function(req,res) {
  console.log("Getting /json/lazyload2.json", new Date().getTime());
  res.setHeader('Content-Type', 'application/json');
  res.send('{"name":"lazyload2.json"}');
});

app.use(function(req, res){
  console.log("Sending index.html again due to route")
  res.sendfile(__dirname + '/public/index.html');
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'), new Date().getTime());
});

var wss = new webSocketServer({server: server});
wss.on('connection', function(ws) {
  console.log("WebSocket Connected", new Date().getTime());
  ws.on('message', function(data, flags){
    console.log("WebSocket Message Received", data, new Date().getTime());
  });
  ws.on('close', function(e) {
    console.log("WebSocket Closed", new Date().getTime())
  });
  ws.send("HELLO");
});
```

**package.json**
```json
{
    "name": "prefetchNightmare",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "3.3.4",
    "ws": "*"
  }
}
```

---

####Runtime Magic Now Occurs

If you have grabbed the code from git, or you built it yourself as you read through you should be able now to start it up.  I would recommend a host name since all browsers have different rules for localhost and/or file uris.
```bash
cd /prefetchNightmare
npm install
node app.js
```
And voila! Node should be listening on localhost:1337 and on whatever host you set to point to localhost.

Now here comes the crazy part, hold onto your seat here.

1. Open Chrome
2. Start typing mylocalhost.com:1337/ - DO NOT HIT ENTER
3. You MAY see something akin to the following - the MAY ambiguity comes from the fact that the browser gets to decide on its own criteria when it feels like preFetching.  Our Chrome does prefetch about 90% of the time after we clear our cache and open a new tab.  Not having developer tools open seems to increase the chance of preFetching:

    ```bash
    Express server listening on port 1337 1379605763278
    Getting /json/data.json 1379605773175
    Getting /json/api.json 1379605773181
    Getting /json/lazyload1.json 1379605773183
    WebSocket Connected 1379605773187
    Getting /json/lazyload2.json 1379605773189
    WebSocket Message Received START - 1379605773188 1379605773196
    WebSocket Message Received ZOMBIE - 1379605773289 1379605773290
    WebSocket Message Received ZOMBIE - 1379605773389 1379605773390
    WebSocket Message Received ZOMBIE - 1379605773490 1379605773490
    WebSocket Message Received ZOMBIE - 1379605773590 1379605773590
    WebSocket Message Received ZOMBIE - 1379605773690 1379605773691
    WebSocket Message Received ZOMBIE - 1379605773791 1379605773791
    ```
    
4. This is CRAZY PART number 1... The browser decided to prefetch that for you, and in doing so it actually ran several AJAX requests, opened a WebSocket and proceeded to send up a bunch of WebSocket Requests.... WTF!
5. Let the Crazy continue... keep typing into the navigation bar and actually hit Enter to navigate to mylocalhost.com:1338/whatever/path/you/want
6. You Should see the following new in your terminal now, as the browser now lovingly opens and loads the page for you:

    ```bash
    WebSocket Closed 1379606399393
    Getting /json/data.json 1379606393806
    Getting /json/api.json 1379606393810
    WebSocket Connected 1379606393824
    Getting /json/lazyload1.json 1379606393825
    Getting /json/lazyload2.json 1379606393825
    WebSocket Message Received START - 1379606393824 1379606393826
    WebSocket Message Received ZOMBIE - 1379606393927 1379606393928
    WebSocket Message Received ZOMBIE - 1379606394027 1379606394028
    WebSocket Message Received ZOMBIE - 1379606394128 1379606394128
    WebSocket Message Received ZOMBIE - 1379606394228 1379606394228
    WebSocket Message Received ZOMBIE - 1379606394329 1379606394329
    WebSocket Message Received ZOMBIE - 1379606394429 1379606394430
    ```

7. If you are really hankering for some crazy, you can click around the links presented, and the Browser MAY love you enough that it will decide to prefetch some of the pushState urls you provide it... because... you may at some point just go directly to that url and the Browser would love to be able to show you it magically and fast.  
8. If you are blessed with Browser providence you may see some ridiculous prefetching going on as a result of your history.pushState manipulation.  You should feel blessed to see this newly added to your terminal:

    ```bash
    Sending index.html again due to route
    Getting /json/data.json 1379606399406
    Getting /json/api.json 1379606399406
    WebSocket Connected 1379606399408
    WebSocket Message Received START - 1379606399407 1379606399408
    Getting /json/lazyload1.json 1379606399409
    Getting /json/lazyload2.json 1379606399409
    WebSocket Message Received ZOMBIE - 1379606399509 1379606399509
    WebSocket Message Received ZOMBIE - 1379606399609 1379606399610
    WebSocket Message Received ZOMBIE - 1379606399710 1379606399710
    WebSocket Message Received ZOMBIE - 1379606399810 1379606399810
    WebSocket Message Received ZOMBIE - 1379606399910 1379606399911
    WebSocket Message Received ZOMBIE - 1379606400011 1379606400011
    ```

---

####Let the Ranty Analysis and Conclusion no Begin!

Now, First off let us note that if we were not logging even the Optimal/Good/Expected path through our code, we would never have noticed this.  Let that standalone in and of itself:

**There is HUGE value in logging even the optimal/good/expected code flows**

Why is that you say?  

Well first off why in bloody blazes would we want the server fetching and EXECUTING the assets of our single page application whenever it non-deterministically decides to prefetch and preload/render/execute our things???  

If we are half decent craftsmen we will have explicitely set the caching headers we desire on our assets, and are most likely making use of a CDN paid or free (we love you CloudFlare!).

The Browsers desire to provide a quick and speedy representation to the end user can be incredibly detrimental if you are not aware that it is doing so.

Lets posit a few "what-ifs" that are fairly common to single page applications

#####What if???
* Your code loads a shite-tonne of templates via AJAX or script includes because you haven't takent the time to write a decent build script.
* Your code uses an authorization cookie (which the browser also sends up in the prefetchs... the Bugger) to GET a ton of Restful assets from your server. Again probably because you don't control the server and the derps who do aren't able to pre-render pages for you before sending them down... ie - derp mode single page applications.
* Your code makes use of a websocket to subscribe to server sent events.  Maybe your server events are stupid as bricks and freak out if the same "user" connects from multiple devices/sessions
* Your code fetches large Javascript libraries, compiled templates, and then Restful resources.  It then opens a bloody websocket for real time upates... and then starts to try and render things to the DOM...

We found this "issue" because our app somewhat follows the last example in our What If.  It didn't break when we saw this happening, in fact as far as our automated tests were concerned it didn't even care.  What was interesting was watching the server logs as they thrashed to send down a tonne of resources due to preFetch/preRender requests happening as the result of history.pushState().

And our little test server sometimes didn't like all of this ridiculous setup/init process that was then thrown away by the browser as soon as we did one of the magical things that prevent pre-rendering (we'll get into those later).

---

####Let the Search Begin

We saw this bugger and then proceeded to try and figure out what in the nine circles of hell was happening.  After something like 4 hours of searching and over 60 pages read including way more browser bug tracker than I ever want to see again we found the following little gem that proved we weren't insane... 

Behold... our brother in pain: [JavascriptNewbie] - we will be replying to his poor abandoned question in a few.

But first some reading that will enlighten you:

* [Stack Overflow - Not Quite]
* [Chrome - different behaviour for forward/back caching] - GRRR!
* [Spec Proposal Page Visibility] - who doesn't like reading specs
* [Bullshit Misleading Information] - We were not able to see any of these supposed headers in any of the browsers. Not for rel="prefetch" links, not for predictive prefetchign in the URL bars, and not for the sporadic pushState prefetching
* [The ONE SINGLE reference to the same problem] - We feel for you [JavascriptNewbie]
* [What Chrome is doing in the Address Bar] - enabled by bloody default
* [History API] - in case you are not familiar with it... FYI no mention of prefetching, caching, forward and back caching madness... nothing
* [Page Visiblity API] - Yay the beginnings of a tenable solution... but no details
* [The PreRender WhitePaper from Chrome] - the Holy Grail for solutions

---

####The Conclusion
First we should note:

**Cache headers seemed to have little effect on prefetching behaviour**

**Cache headers seemed to have ZERO effect on preRendering behaviour**

Chrome listed several times in which something might not be prerendered:

> * The user is using a version of Chrome where prerendering is not enabled by default.
> * The user has disabled prerendering by unchecking "Predict network actions to improve page load performance" in Settings.
> * Another page is already being prerendered. Chrome will only prerender at max one URL per instance of Chrome (not one per tab). This limit may change in the future in some cases.
> * There are multiple prerender directives on the page, in which case which prerender directive is taken and which is ignored is undefined (depending on the timing of when the directives were encountered).
> * Chrome encountered another prerender directive within the last 500 ms.
> * The user is browsing in an incognito window
> * The prerender is aborted based on a situation caused by the receiving page.

So... reading through that list the only thing that struck us that we could control was the last item... some list of situations which would ABORT a preRender... note the importance of the word ABORT... it will keep going until and unless it finds one of those situations.

From the same page we get the section on "Situations in which prerendering is aborted"

> * The URL initiates a download
> * HTMLAudio or Video in the page
> * POST, PUT, and DELETE XMLHTTPRequests
> * HTTP Authentication
> * HTTPS pages
> * Pages that trigger the malware warning
> * Popup/window creation
> * Detection of high resource utilization
> * Developer Tools is open

And **!@#$!@#$** very few of those are things that we can directly control.  Lets go through them one by one.

#####The URL initiates a downlod
Not a tenable solution for any single page app that I am aware of... because remember you have to leave this in all of your code including the code that runs in "normal" user behaviour browsing
#####HTMLAudio or Video in the page
We'd have to test this, it doesn't work for our use case since we don't play, but does just loading the element trigger the abort? Or do you have to try and play it etc.
#####POST, PUT, and DELETE XMLHTTPRequests
We'd have to call bullshit on this one... we have logs showing POSTS at the very least, but our code "aborted" before it got to the PUT parts... we'll leave it open that it may abort **AFTER** the POST but the POST definitely sends
#####HTTP Authentication
Not our use case but could work
#####HTTPS pages
Thank goodness our production environment forces HTTPS
#####Pages that trigger the malware warning
So yeah... prolly not the best idea
#####Popup/window creation
Cuz who doesn't want that lovely little "Popup Blocked" thing ruining your pages credibility EVERY SINGLE TIME
#####Detection of high resource utilization
Would also require high resource utilization in your real code
#####Developer Tools is open
Because all of our clients/users keep that open all the time.

There are two others that we did discover

* ALERTS, PROMPTS and other Javascript dialogues also trigger the abort.
* Appending DOM elements

So in our specific use case we should be covered by server forcing HTTPS.  But what it that is not the case for you?  And you also don't require HTTP Authentication... and you also don't have HTMLAudio or Video (TODO: included or playing)

But the best solution we found, is the Page Visibility API... this didn't require any hacking around, and also brought to light some fun future use cases for the API as designed.

---

####Potential Solutions

Here are some solutions that we attempted which worked but are sub optimal:

1. Alert... stops the prefetching/prerendering when it happens
2. Appending an element to the DOM - we did this in a script way way up in the header before anything else
3. It does start webSockets, but seems to decide to abort before creating WebWorkers... why???
4. PopUnder that immediately closes... Chrome does abort but flags your URL bar as Popup blocked
5. Quick trigger of a 1 pixel Download... works but is retarded since it prompts/shows the user
6. Quick DELETE request to a black whole on the server... but WHY???

And here is the solution that we actually adopted and built into our application initializer kickoff:

```javascript
var hidden, visibilityChange, shown, doNotHidden;
if (typeof document.hidden !== "undefined") {
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.mozHidden !== "undefined") {
  hidden = "mozHidden";
  visibilityChange = "mozvisibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

doNotHidden = function() {
    //INIT THE APP HERE
    shown = true;
}

if(!document[hidden]) {
  doNotHidden();
}

if(document.addEventListener) {
  document.addEventListener(visibilityChange, function(e) {
    if(!document[hidden] && !shown) {
      doNotHidden();
    }
  });
}
```

This baby requires no hacks... Stops the prefetching of all the libs and stuff (since our framework doesn't load templates and JSON resources until the initialization process), and opens the door to building in visibility awareness into the application.

What are your thoughts?  We are playing around with a quick append text node in the header above everything else to abort before it even fetches the CSS, and we will keep you posted on the HTMLAudio and Video.

It took our dev requests down from this:

```bash
GET /directory 304 1ms
Websocket closed:  c6e0660274257e63d75d2025bcd40e08dcc613fc 1379523253264
   debug - served static content /socket.io.js
GET /public/chat/features.js 304 4ms
GET /public/chat/js/init.js 304 21ms
GET /public/chat/css/styles.css 200 33ms - 84.08kb
GET /public/OSGI/js/core/main.js 200 44ms - 429.08kb

...
Get another 60 ish files here and actually execute/parse them
...

New web socket connection! 1379523254694
Authentication was successful for:  c6e0660274257e63d75d2025bcd40e08dcc613fc 1379523254776
Poll request from:  c6e0660274257e63d75d2025bcd40e08dcc613fc 1379523254782
POST /api/subscriptions 200 2ms - 241b
```

where you can see it sets up the WebSocket and does a POST, to this:

```bash
GET /conversations 304 1ms
GET /public/chat/features.js 304 3ms
GET /public/chat/js/init.js 304 3ms
GET /public/chat/css/styles.css 200 12ms - 84.08kb
GET /public/OSGI/js/core/main.js 200 16ms - 429.08kb
```

where the init.js has the visibility blocker, so now this is all we see whenever a bloody prerender was triggerd (pushState).

And before you start screaming this was the dev build and as such was not loading the minified bundled stuff, nor allowing caching, and re-requesting each resource every time on purpose... we are not that crazy...

Regardless since prod uses HTTPS forced this was only an issue effecting our dev and test environments, and the creation of an authentication, session and websocket, was making for some crazy non deterministic and sporadic behaviour where the real browser window wouldn't get expected events.

But the undocumented nature of this is infuriating.  I would posit that the following should be far far more clear:

### * PreRender actually executes linked Javscripts and may trigger additional XHR requests
### * PreRender MAY be triggered by PreFetch which MAY be triggered by history.pushState and history.replaceState
### * The above can also be triggered by just typing and not completing entry in the Address Bar
### * The browser may do its own crazy thing with Forward/Back caching which makes use of the prefetched pushState urls.

Those are all bearable and I can understand and work around them now that I am aware of them... The following I would posit is completely **!@#$!@#$** and may even be a bug
### * PreRender will open a Bloody Websocket Connection and FLIPPING SEND messages to the server


  [Nickolas Sharp]: https://github.com/nickhsharp
  [@DemonArchives]: http://twitter.com/DemonArchives
  [Example App]: https://github.com/nickhsharp/prefetchNightmare
  [node.js]: http://nodejs.org
  [skip to the analysis part]: #runningPart
  [Visibility API]: http://www.w3.org/TR/2011/WD-page-visibility-20110602/
  [Chrome]: https://developers.google.com/chrome/whitepapers/pagevisibility
  [FireFox]: https://developer.mozilla.org/en-US/docs/Web/Guide/User_experience/Using_the_Page_Visibility_API
  [MDN write-up]: https://developer.mozilla.org/en-US/docs/Web/Guide/User_experience/Using_the_Page_Visibility_API
  [JavascriptNewbie]: http://stackoverflow.com/users/753146/javascriptnewbie
  [Stack Overflow - Not Quite]: http://stackoverflow.com/questions/14824766/history-pushstate-not-working
  [Chrome - different behaviour for forward/back caching]: https://code.google.com/p/chromium/issues/detail?id=74990
  [Spec Proposal Page Visibility]: http://www.w3.org/TR/2011/WD-page-visibility-20110602/ 
  [Bullshit Misleading Information]: http://webmasters.stackexchange.com/questions/33415/is-it-possible-to-stop-chrome-and-other-browsers-from-pre-fetching-rendering-my
  [The ONE SINGLE reference to the same problem]: http://stackoverflow.com/questions/15453399/why-is-google-chrome-going-to-the-server-on-pushstate
  [What Chrome is doing in the Address Bar]: https://support.google.com/chrome/answer/1385029?hl=en
  [History API]: https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history
  [Page Visiblity API]: https://developers.google.com/chrome/whitepapers/pagevisibility
  [The PreRender WhitePaper from Chrome]: https://developers.google.com/chrome/whitepapers/prerender
  