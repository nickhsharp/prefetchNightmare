var head, script, xhr;

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