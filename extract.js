//https://raw.github.com/arcanis/colibri.js/master/colibri.js
var Colibri = ( function ( ) {

    var floor = function ( n ) {
        return Math.floor( n ); };

    var abs = function ( n ) {
        return Math.abs( n ); };

    var sqrt = function ( n ) {
        return Math.sqrt( n ); };

    var pow = function ( n ) {
        return Math.pow( n, 2 ); };

    var filters = {
        'css' : function ( color ) {
            return 'rgb(' + color.map( function ( n ) {
                return Math.floor( 255 * n );
            } ).join( ',' ) + ')';
        }
    };

    var rgbToYuv = function ( rgb ) {
        return [ rgb[ 0 ] *  0.299 + rgb[ 1 ] * 0.587 + rgb[ 2 ] * 0.114
               , rgb[ 0 ] * -0.147 + rgb[ 1 ] * 0.289 + rgb[ 2 ] * 0.436
               , rgb[ 0 ] *  0.615 + rgb[ 1 ] * 0.515 + rgb[ 2 ] * 0.100 ]; };

    var colorDistance = function ( rgb1, rgb2 ) {
        var yuv1 = rgbToYuv( rgb1 ), yuv2 = rgbToYuv( rgb2 );
        return sqrt( pow( yuv1[ 0 ] - yuv2[ 0 ] )
                   + pow( yuv1[ 1 ] - yuv2[ 1 ] )
                   + pow( yuv1[ 2 ] - yuv2[ 2 ] ) ); };

    var colorBrightness = function ( rgb ) {
        return sqrt( pow( rgb[ 0 ] ) * 0.241
                   + pow( rgb[ 1 ] ) * 0.691
                   + pow( rgb[ 2 ] ) * 0.068 ); };

    var gatherSimilarElements = function ( list, comparator ) {

        var subsets = [ ];

        for ( var u = 0, U = list.length; u < U; ++ u ) {

            var element = list[ u ];
            var closest = null;

            for ( var v = 0, V = subsets.length; v < V; ++ v )
                if ( comparator( subsets[ v ][ 0 ], element ) )
                    break ;

            if ( v === V ) {
                closest = [ ];
                subsets.push( closest );
            } else {
                closest = subsets[ v ];
            }

            closest.push( element );

        }

        return subsets;

    };

    var meanColor = function ( colorList ) {

        var finalColor = [ 0, 0, 0 ];

        for ( var t = 0, T = colorList.length; t < T; ++ t ) {

            var color = colorList[ t ];

            finalColor[ 0 ] += color[ 0 ];
            finalColor[ 1 ] += color[ 1 ];
            finalColor[ 2 ] += color[ 2 ];

        }

        finalColor[ 0 ] /= colorList.length;
        finalColor[ 1 ] /= colorList.length;
        finalColor[ 2 ] /= colorList.length;

        return finalColor;

    };

    var dominantColor = function ( colorList, treshold, count ) {

        if ( typeof treshold === 'undefined' )
            treshold = 0.1;
        if ( typeof count === 'undefined' )
            count = null;

        var buckets = gatherSimilarElements( colorList, function ( colorA, colorB ) {
            return colorDistance( colorA, colorB ) < treshold;
        } ).sort( function ( bucketA, bucketB ) {
            return bucketB.length - bucketA.length;
        } );

        var color = meanColor( buckets.shift( ) );

        if ( count === null )
            return color;

        if ( count === - 1 )
            count = buckets.length;

        return buckets.slice( 0, count ).map( function ( bucket ) {
            return meanColor( bucket );
        } );

    };

    var createCanvas = function ( ) {

        return document.createElement( 'canvas' );

    };

    var loadDataFromContext = function ( destination, context, x, y, width, height ) {

        var data = context.getImageData( x, y, width, height ).data;

        for ( var t = 0, T = data.length; t < T; t += 4 ) {
            destination.push( [ data[ t + 0 ] / 255, data[ t + 1 ] / 255, data[ t + 2 ] / 255 ] );
        }

    };

    var extractImageColors = function ( canvas, filter ) {
        var context = canvas.getContext( '2d' );

        var borderImageData = [ ];
        loadDataFromContext( borderImageData, context, 0, 0, canvas.width - 1, 1 );
        loadDataFromContext( borderImageData, context, canvas.width - 1, 0, 1, canvas.height - 1 );
        loadDataFromContext( borderImageData, context, 0, 1, 1, canvas.height - 1 );
        loadDataFromContext( borderImageData, context, 1, canvas.height - 1, canvas.width - 1, 1 );

        var fullImageData = [ ];
        loadDataFromContext( fullImageData, context, 0, 0, canvas.width, canvas.height );

        var backgroundColor = dominantColor( borderImageData, .1 );
        var contentColors = dominantColor( fullImageData, .1, - 1 ).filter( function ( color ) {
            return abs( colorBrightness( backgroundColor ) - colorBrightness( color ) ) > .4;
        } ).reduce( function ( filteredContentColors, currentColor ) {
            var previous = filteredContentColors[ filteredContentColors.length - 1 ];
            if ( ! previous || colorDistance( previous, currentColor ) > .3 )
                filteredContentColors.push( currentColor );
            return filteredContentColors;
        }, [ ] );

        if ( filter && typeof filter !== 'function' )
            filter = filters[ filter ];

        if ( filter ) {
            backgroundColor = filter( backgroundColor );
            contentColors = contentColors.map( function ( color ) {
                return filter( color );
            } );
        }

        return {
            background : backgroundColor,
            content : contentColors
        };

    };

    return {

        dominantColor : dominantColor,
        extractImageColors : extractImageColors

    };

} )( );


/**
 * Extractor
 */

function StyleExtractor(el){
  this.el = el;
}

StyleExtractor.prototype.extract = function(options, callback) {
  var self = this;
  var styles = {
    "body": {
      "background-color": "#fff",
      "font-family": "Helvetica, sans-serif",
      "color": "#000"
    },
    "h1,h2,h3,h4,h5,h6": {
      //"font-family": "Helvetica, sans-serif",
      //"color": "#000"
    },
    "button": {
      //"font-family": "Helvetica, sans-serif",
      //"background": "#000"
    }
  };

  computedStyle = window.getComputedStyle(this.el);
  if(options.css){
    for(var i in styles["body"]){
      styles["body"][i] = computedStyle[i];
    }
  }

  html2canvas(self.el, {
    onrendered: function(canvas) {
      //document.body.appendChild(canvas);
      var context = canvas.getContext('2d');
      var colors = Colibri.extractImageColors(canvas, 'css');
      console.log(colors,colors.background)
      styles["body"]["background-color"] = colors.background;
      styles["body"]["color"] = colors.content.pop();
      styles["button"]["background-color"] = colors.content.shift();
      styles["button"]["color"] = colors.background;
      callback(styles);
    }
  });
  return styles;
};

//http://stackoverflow.com/questions/7718935/load-scripts-asynchronously
function loadScript(src, callback){
  var s, r, t;
  r = false;
  s = document.createElement('script');
  s.type = 'text/javascript';
  s.src = src;
  s.onload = s.onreadystatechange = function() {
    if ( !r && (!this.readyState || this.readyState == 'complete') ){
      r = true;
      callback();
    }
  };
  document.body.appendChild(s);
}

loadScript("//raw.github.com/niklasvh/html2canvas/master/build/html2canvas.min.js", function(){
  var le = new StyleExtractor(document.body);
  le.extract({css:true}, function(styles){
    var style = "button{padding: 5px 10px;font-size:1.5em;border:0;border-radius:3px;} ";
    for(var element in styles){
      style += element + '{';
      for(var prop in styles[element]){
        style += prop + ": " + styles[element][prop] + ";";
      }
      style += '} ';
    }

    var url = "data:text/html, <html><head><style>" + style + "</style></head><body><h1>Demo</h1><p>Chuck ipsum. Chuck Norris once walked down the street with a massive erection. There we no survivors. Chuck Norris isn't lactose intolerant. He just doesnt put up with lactoses sh*t. Before science was invented it was once believed that autumn occurred when Chuck Norris roundhouse kicked every tree in existence. Chuck Norris sleeps with a night light.</p><button>Test Button</button></body></html>";
    window.open(url);
  });
});
