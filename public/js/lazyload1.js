var xhr;
xhr = new XMLHttpRequest();
xhr.open('GET', '/json/lazyload1.json', true);
xhr.responseType = 'json';
xhr.onload = function(e) {
  if (this.status == 200) {}
};
xhr.send();