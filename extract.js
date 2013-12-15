function LayoutExtractor(el){
  this.el = el;
}

LayoutExtractor.prototype.extract = function() {
  var styles = {
    "background-color": "#fff",
    "font-family": "Helvetica, sans-serif",
    "color": "#333"
  };

  computedStyle = window.getComputedStyle(this.el);
  for(var i in styles){
    styles[i] = computedStyle[i];
  }

  return styles;
};



var le = new LayoutExtractor(document.body);
var styles = le.extract();

var style = "";
for(var i in styles){
  style += i + ": " + styles[i] + ";";
}
var url = "data:text/html, <html><head><style>body{" + style + "}</style></head><body><h1>Demo</h1><p>That's that</p></body></html>";
window.open(url);
