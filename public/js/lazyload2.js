var xhr;
xhr = new XMLHttpRequest();
xhr.open('GET', '/json/lazyload2.json', true);
xhr.responseType = 'json';
xhr.onload = function(e) {
  if (this.status == 200) {}
};
xhr.send();