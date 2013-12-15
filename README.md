layout-extractor
================

Open Devtools, Go to Console and paste this little snippet:

  (function(){var el = document.createElement('script'); el.src = 'http://localhost:4001/extract.js'; document.body.appendChild(el);})();

Don't forget to replace `http://localhost:4001/extract.js` with the actual link.
