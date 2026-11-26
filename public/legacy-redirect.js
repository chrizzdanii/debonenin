/* Old links (/?paid=..., /#/dashboard) belong to the app, so send them to /app.html. The home page stays clean for Google. */
(function(){var l=location;if(/[?&](paid|reference|trxref)=/.test(l.search)||/^#\//.test(l.hash)){l.replace('/app.html'+l.search+l.hash)}})();
