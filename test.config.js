require.config({
    baseUrl: 'node_modules',
     paths: {
         chai: 'chai/chai',
         TraceKit: 'tracekit/tracekit'
     }
});

require([
    '../dist/temp/exceptionless-browserspec'
], function() {
    
    if (typeof mochaPhantomJS !== "undefined") { mochaPhantomJS.run(); }
    else { 
        
        console.log('running mocha');
        mocha.run(); 
    }
});