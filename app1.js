/* ES5 - shared helpers */
var API = 'https://ytcat.anaku.web.id/api/';
var CNV = 'https://cnv1.ytcat.web.id/?id=';

function $(id){ return document.getElementById(id); }
function esc(s){
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function param(name){
  var q = window.location.search.substring(1).split('&');
  for (var i = 0; i < q.length; i++) {
    var p = q[i].split('=');
    if (decodeURIComponent(p[0]) === name) {
      return decodeURIComponent((p[1] || '').replace(/\+/g, ' '));
    }
  }
  return '';
}
function request(path, ok, fail){
  var x = new XMLHttpRequest();
  x.open('GET', API + path, true);
  x.timeout = 20000;
  x.onreadystatechange = function(){
    if (x.readyState !== 4) return;
    if (x.status >= 200 && x.status < 300) {
      var d;
      try { d = JSON.parse(x.responseText); } catch (e) { fail('Invalid API response.'); return; }
      ok(d);
    } else {
      fail('Failed to load data (code ' + x.status + ').');
    }
  };
  x.ontimeout = function(){ fail('Connection timed out. Please try again.'); };
  x.onerror = function(){ fail('Unable to connect to the server.'); };
  x.send();
}
/* 120px cover */
function thumb120(o){
  var t = o.thumbnails, i;
  if (t) for (i = 0; i < t.length; i++) if (t[i].width === 120) return t[i].url;
  return (o.cover_art || '').replace(/=w\d+-h\d+/, '=w120-h120');
}
function big(o){ return o.cover_art || ''; }
function lazyImg(src, alt, cls){
  return '<img class="lazy ' + (cls || '') + '" data-src="' + esc(src) + '" alt="' + esc(alt) +
    '" width="120" height="120" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">';
}
/* lazy load */
var lazyObs = null;
function loadImg(img){
  var s = img.getAttribute('data-src');
  if (!s) return;
  img.onload = function(){ img.className += ' loaded'; };
  img.onerror = function(){ img.className += ' loaded'; };
  img.src = s;
  img.removeAttribute('data-src');
}
function lazyInit(){
  var imgs = document.querySelectorAll('img[data-src]'), i;
  if ('IntersectionObserver' in window) {
    if (!lazyObs) {
      lazyObs = new IntersectionObserver(function(es){
        for (var k = 0; k < es.length; k++) if (es[k].isIntersecting) {
          loadImg(es[k].target); lazyObs.unobserve(es[k].target);
        }
      }, { rootMargin: '200px' });
    }
    for (i = 0; i < imgs.length; i++) lazyObs.observe(imgs[i]);
  } else {
    var check = function(){
      var rest = document.querySelectorAll('img[data-src]');
      for (var k = 0; k < rest.length; k++) {
        if (rest[k].getBoundingClientRect().top < window.innerHeight + 200) loadImg(rest[k]);
      }
    };
    window.onscroll = window.onresize = check; check();
  }
}
/* UI */
function artistLinks(s){
  var a = s.artists, out = [], i;
  if (a && a.length) {
    for (i = 0; i < a.length; i++) {
      out.push(a[i].id ? '<a href="page-artist.html?to-artist=' + encodeURIComponent(a[i].id) + '">' + esc(a[i].name) + '</a>' : esc(a[i].name));
    }
    return out.join(', ');
  }
  return esc(s.artist);
}
function albumLink(s){
  if (!s.album) return '';
  return s.album_id ? '<a href="page-album.html?to-album=' + encodeURIComponent(s.album_id) + '">' + esc(s.album) + '</a>' : esc(s.album);
}
function songRow(s, num, cover){
  var sub = artistLinks(s) + (s.album ? ' &bull; ' + albumLink(s) : '');
  return '<li class="row">' +
    (num ? '<span class="n">' + esc(num) + '</span>' : '') +
    '<a class="cv" href="page-song.html?to-song=' + encodeURIComponent(s.id) + '" aria-label="' + esc(s.title) + '">' +
    lazyImg(cover || thumb120(s), s.title, 'cover') + '</a>' +
    '<div class="info"><a class="t" href="page-song.html?to-song=' + encodeURIComponent(s.id) + '">' + esc(s.title) + '</a>' +
    '<div class="s">' + sub + '</div></div>' +
    '<span class="d">' + esc(s.duration) + '</span></li>';
}
function skeleton(n){ var h = '', i; for (i = 0; i < n; i++) h += '<div class="skel"></div>'; return h; }
function showError(el, msg, retry){
  el.innerHTML = '<div class="state"><p>' + esc(msg) + '</p><button class="btn" id="retry">Try again</button></div>';
  $('retry').onclick = retry;
}
function headerHtml(q){
  return '<header class="top"><div class="container"><a class="brand" href="index.html"><i class="fa-solid fa-music" aria-hidden="true"></i> <span>Gomuost</span></a>' +
    '<form class="search" action="page-search.html" method="get">' +
    '<input class="input" type="search" name="to-search" placeholder="Search songs or artists" value="' + esc(q || '') + '" aria-label="Search">' +
    '<button class="btn btn-primary" type="submit" aria-label="Search" title="Search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i></button></form></div></header>';
}
function mountHeader(q){ $('hdr').innerHTML = headerHtml(q); }
/* Breadcrumb: items = [{t:'Text', href:'url'}], last item = current page */
function crumbs(items){
  var h = '<nav class="bc" aria-label="Breadcrumb"><div class="container"><ol>', i, it, last;
  for (i = 0; i < items.length; i++) {
    it = items[i]; last = i === items.length - 1;
    h += '<li>' + (i ? '<i class="fa-solid fa-chevron-right sep" aria-hidden="true"></i>' : '') + (it.href && !last
      ? '<a href="' + esc(it.href) + '">' + esc(it.t) + '</a>'
      : '<span' + (last ? ' aria-current="page"' : '') + '>' + esc(it.t) + '</span>') + '</li>';
  }
  return h + '</ol></div></nav>';
}
function mountCrumbs(items){ $('bc').innerHTML = crumbs(items); }
function artistCrumb(o){
  var a = o.artists && o.artists[0], id = (a && a.id) || o.artist_id, name = (a && a.name) || o.artist;
  if (!name) return null;
  return { t: name, href: id ? 'page-artist.html?to-artist=' + encodeURIComponent(id) : '' };
}
