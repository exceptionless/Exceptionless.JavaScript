/*
 TraceKit - Cross brower stack traces - github.com/occ/TraceKit
 MIT license
*/

(function(window, undefined) {


var TraceKit = {};
var _oldTraceKit = window.TraceKit;

// global reference to slice
var _slice = [].slice;
var UNKNOWN_FUNCTION = '?';


/**
 * _has, a better form of hasOwnProperty
 * Example: _has(MainHostObject, property) === true/false
 *
 * @param {Object} host object to check property
 * @param {string} key to check
 */
function _has(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function _isUndefined(what) {
    return typeof what === 'undefined';
}

/**
 * TraceKit.noConflict: Export TraceKit out to another variable
 * Example: var TK = TraceKit.noConflict()
 */
TraceKit.noConflict = function noConflict() {
    window.TraceKit = _oldTraceKit;
    return TraceKit;
};

/**
 * TraceKit.wrap: Wrap any function in a TraceKit reporter
 * Example: func = TraceKit.wrap(func);
 *
 * @param {Function} func Function to be wrapped
 * @return {Function} The wrapped func
 */
TraceKit.wrap = function traceKitWrapper(func) {
    function wrapped() {
        try {
            return func.apply(this, arguments);
        } catch (e) {
            TraceKit.report(e);
            throw e;
        }
    }
    return wrapped;
};

/**
 * TraceKit.report: cross-browser processing of unhandled exceptions
 *
 * Syntax:
 *   TraceKit.report.subscribe(function(stackInfo) { ... })
 *   TraceKit.report.unsubscribe(function(stackInfo) { ... })
 *   TraceKit.report(exception)
 *   try { ...code... } catch(ex) { TraceKit.report(ex); }
 *
 * Supports:
 *   - Firefox: full stack trace with line numbers, plus column number
 *              on top frame; column number is not guaranteed
 *   - Opera:   full stack trace with line and column numbers
 *   - Chrome:  full stack trace with line and column numbers
 *   - Safari:  line and column number for the top frame only; some frames
 *              may be missing, and column number is not guaranteed
 *   - IE:      line and column number for the top frame only; some frames
 *              may be missing, and column number is not guaranteed
 *
 * In theory, TraceKit should work on all of the following versions:
 *   - IE5.5+ (only 8.0 tested)
 *   - Firefox 0.9+ (only 3.5+ tested)
 *   - Opera 7+ (only 10.50 tested; versions 9 and earlier may require
 *     Exceptions Have Stacktrace to be enabled in opera:config)
 *   - Safari 3+ (only 4+ tested)
 *   - Chrome 1+ (only 5+ tested)
 *   - Konqueror 3.5+ (untested)
 *
 * Requires TraceKit.computeStackTrace.
 *
 * Tries to catch all unhandled exceptions and report them to the
 * subscribed handlers. Please note that TraceKit.report will rethrow the
 * exception. This is REQUIRED in order to get a useful stack trace in IE.
 * If the exception does not reach the top of the browser, you will only
 * get a stack trace from the point where TraceKit.report was called.
 *
 * Handlers receive a stackInfo object as described in the
 * TraceKit.computeStackTrace docs.
 */
TraceKit.report = (function reportModuleWrapper() {
    var handlers = [],
        lastException = null,
        lastExceptionStack = null;

    /**
     * Add a crash handler.
     * @param {Function} handler
     */
    function subscribe(handler) {
        installGlobalHandler();
        handlers.push(handler);
    }

    /**
     * Remove a crash handler.
     * @param {Function} handler
     */
    function unsubscribe(handler) {
        for (var i = handlers.length - 1; i >= 0; --i) {
            if (handlers[i] === handler) {
                handlers.splice(i, 1);
            }
        }
    }

    /**
     * Dispatch stack information to all handlers.
     * @param {Object.<string, *>} stack
     */
    function notifyHandlers(stack, windowError) {
        var exception = null;
        if (windowError && !TraceKit.collectWindowErrors) {
          return;
        }
        for (var i in handlers) {
            if (_has(handlers, i)) {
                try {
                    handlers[i].apply(null, [stack].concat(_slice.call(arguments, 2)));
                } catch (inner) {
                    exception = inner;
                }
            }
        }

        if (exception) {
            throw exception;
        }
    }

    var _oldOnerrorHandler, _onErrorHandlerInstalled;

    /**
     * Ensures all global unhandled exceptions are recorded.
     * Supported by Gecko and IE.
     * @param {string} message Error message.
     * @param {string} url URL of script that generated the exception.
     * @param {(number|string)} lineNo The line number at which the error
     * occurred.
     */
    function traceKitWindowOnError(message, url, lineNo, columnNo, errorObj) {
        var stack = null;

        if (errorObj) {
          stack = TraceKit.computeStackTrace(errorObj);
        }
        else
        {
            if (lastExceptionStack) {
                TraceKit.computeStackTrace.augmentStackTraceWithInitialElement(lastExceptionStack, url, lineNo, message);
                stack = lastExceptionStack;
                lastExceptionStack = null;
                lastException = null;
            } else {
                var location = {
                    'url': url,
                    'line': lineNo,
                    'column': columnNo
                };
                location.func = TraceKit.computeStackTrace.guessFunctionName(location.url, location.line);
                location.context = TraceKit.computeStackTrace.gatherContext(location.url, location.line);
                stack = {
                    'mode': 'onerror',
                    'message': message,
                    'url': document.location.href,
                    'stack': [location],
                    'useragent': navigator.userAgent
                };
            }
        }

        notifyHandlers(stack, 'from window.onerror');

        if (_oldOnerrorHandler) {
            return _oldOnerrorHandler.apply(this, arguments);
        }

        return false;
    }

    function installGlobalHandler ()
    {
        if (_onErrorHandlerInstalled === true) {
           return;
        }
        _oldOnerrorHandler = window.onerror;
        window.onerror = traceKitWindowOnError;
        _onErrorHandlerInstalled = true;
    }

    /**
     * Reports an unhandled Error to TraceKit.
     * @param {Error} ex
     */
    function report(ex) {
        var args = _slice.call(arguments, 1);
        if (lastExceptionStack) {
            if (lastException === ex) {
                return; // already caught by an inner catch block, ignore
            } else {
                var s = lastExceptionStack;
                lastExceptionStack = null;
                lastException = null;
                notifyHandlers.apply(null, [s, null].concat(args));
            }
        }

        var stack = TraceKit.computeStackTrace(ex);
        lastExceptionStack = stack;
        lastException = ex;

        // If the stack trace is incomplete, wait for 2 seconds for
        // slow slow IE to see if onerror occurs or not before reporting
        // this exception; otherwise, we will end up with an incomplete
        // stack trace
        window.setTimeout(function () {
            if (lastException === ex) {
                lastExceptionStack = null;
                lastException = null;
                notifyHandlers.apply(null, [stack, null].concat(args));
            }
        }, (stack.incomplete ? 2000 : 0));

        throw ex; // re-throw to propagate to the top level (and cause window.onerror)
    }

    report.subscribe = subscribe;
    report.unsubscribe = unsubscribe;
    return report;
}());

/**
 * TraceKit.computeStackTrace: cross-browser stack traces in JavaScript
 *
 * Syntax:
 *   s = TraceKit.computeStackTrace.ofCaller([depth])
 *   s = TraceKit.computeStackTrace(exception) // consider using TraceKit.report instead (see below)
 * Returns:
 *   s.name              - exception name
 *   s.message           - exception message
 *   s.stack[i].url      - JavaScript or HTML file URL
 *   s.stack[i].func     - function name, or empty for anonymous functions (if guessing did not work)
 *   s.stack[i].args     - arguments passed to the function, if known
 *   s.stack[i].line     - line number, if known
 *   s.stack[i].column   - column number, if known
 *   s.stack[i].context  - an array of source code lines; the middle element corresponds to the correct line#
 *   s.mode              - 'stack', 'stacktrace', 'multiline', 'callers', 'onerror', or 'failed' -- method used to collect the stack trace
 *
 * Supports:
 *   - Firefox:  full stack trace with line numbers and unreliable column
 *               number on top frame
 *   - Opera 10: full stack trace with line and column numbers
 *   - Opera 9-: full stack trace with line numbers
 *   - Chrome:   full stack trace with line and column numbers
 *   - Safari:   line and column number for the topmost stacktrace element
 *               only
 *   - IE:       no line numbers whatsoever
 *
 * Tries to guess names of anonymous functions by looking for assignments
 * in the source code. In IE and Safari, we have to guess source file names
 * by searching for function bodies inside all page scripts. This will not
 * work for scripts that are loaded cross-domain.
 * Here be dragons: some function names may be guessed incorrectly, and
 * duplicate functions may be mismatched.
 *
 * TraceKit.computeStackTrace should only be used for tracing purposes.
 * Logging of unhandled exceptions should be done with TraceKit.report,
 * which builds on top of TraceKit.computeStackTrace and provides better
 * IE support by utilizing the window.onerror event to retrieve information
 * about the top of the stack.
 *
 * Note: In IE and Safari, no stack trace is recorded on the Error object,
 * so computeStackTrace instead walks its *own* chain of callers.
 * This means that:
 *  * in Safari, some methods may be missing from the stack trace;
 *  * in IE, the topmost function in the stack trace will always be the
 *    caller of computeStackTrace.
 *
 * This is okay for tracing (because you are likely to be calling
 * computeStackTrace from the function you want to be the topmost element
 * of the stack trace anyway), but not okay for logging unhandled
 * exceptions (because your catch block will likely be far away from the
 * inner function that actually caused the exception).
 *
 * Tracing example:
 *     function trace(message) {
 *         var stackInfo = TraceKit.computeStackTrace.ofCaller();
 *         var data = message + "\n";
 *         for(var i in stackInfo.stack) {
 *             var item = stackInfo.stack[i];
 *             data += (item.func || '[anonymous]') + "() in " + item.url + ":" + (item.line || '0') + "\n";
 *         }
 *         if (window.console)
 *             console.info(data);
 *         else
 *             alert(data);
 *     }
 */
TraceKit.computeStackTrace = (function computeStackTraceWrapper() {
    var debug = false,
        sourceCache = {};

    /**
     * Attempts to retrieve source code via XMLHttpRequest, which is used
     * to look up anonymous function names.
     * @param {string} url URL of source code.
     * @return {string} Source contents.
     */
    function loadSource(url) {
        if (typeof url !== 'string') {
          return [];
        }
        
        if (!TraceKit.remoteFetching) { //Only attempt request if remoteFetching is on.
            return '';
        }
        try {
            var getXHR = function() {
                try {
                    return new window.XMLHttpRequest();
                } catch (e) {
                    // explicitly bubble up the exception if not found
                    return new window.ActiveXObject('Microsoft.XMLHTTP');
                }
            };

            var request = getXHR();
            request.open('GET', url, false);
            request.send('');
            return request.responseText;
        } catch (e) {
            return '';
        }
    }

    /**
     * Retrieves source code from the source code cache.
     * @param {string} url URL of source code.
     * @return {Array.<string>} Source contents.
     */
    function getSource(url) {
        if (!_has(sourceCache, url)) {
            // URL needs to be able to fetched within the acceptable domain.  Otherwise,
            // cross-domain errors will be triggered.
            var source = '';

            url = url || "";

            if (url.indexOf && url.indexOf(document.domain) !== -1) {
                source = loadSource(url);
            }
            sourceCache[url] = source ? source.split('\n') : [];
        }

        return sourceCache[url];
    }

    /**
     * Tries to use an externally loaded copy of source code to determine
     * the name of a function by looking at the name of the variable it was
     * assigned to, if any.
     * @param {string} url URL of source code.
     * @param {(string|number)} lineNo Line number in source code.
     * @return {string} The function name, if discoverable.
     */
    function guessFunctionName(url, lineNo) {
        var reFunctionArgNames = /function ([^(]*)\(([^)]*)\)/,
            reGuessFunction = /['"]?([0-9A-Za-z$_]+)['"]?\s*[:=]\s*(function|eval|new Function)/,
            line = '',
            maxLines = 10,
            source = getSource(url),
            m;

        if (!source.length) {
            return UNKNOWN_FUNCTION;
        }

        // Walk backwards from the first line in the function until we find the line which
        // matches the pattern above, which is the function definition
        for (var i = 0; i < maxLines; ++i) {
            line = source[lineNo - i] + line;

            if (!_isUndefined(line)) {
                if ((m = reGuessFunction.exec(line))) {
                    return m[1];
                } else if ((m = reFunctionArgNames.exec(line))) {
                    return m[1];
                }
            }
        }

        return UNKNOWN_FUNCTION;
    }

    /**
     * Retrieves the surrounding lines from where an exception occurred.
     * @param {string} url URL of source code.
     * @param {(string|number)} line Line number in source code to centre
     * around for context.
     * @return {?Array.<string>} Lines of source code.
     */
    function gatherContext(url, line) {
        var source = getSource(url);

        if (!source.length) {
            return null;
        }

        var context = [],
            // linesBefore & linesAfter are inclusive with the offending line.
            // if linesOfContext is even, there will be one extra line
            //   *before* the offending line.
            linesBefore = Math.floor(TraceKit.linesOfContext / 2),
            // Add one extra line if linesOfContext is odd
            linesAfter = linesBefore + (TraceKit.linesOfContext % 2),
            start = Math.max(0, line - linesBefore - 1),
            end = Math.min(source.length, line + linesAfter - 1);

        line -= 1; // convert to 0-based index

        for (var i = start; i < end; ++i) {
            if (!_isUndefined(source[i])) {
                context.push(source[i]);
            }
        }

        return context.length > 0 ? context : null;
    }

    /**
     * Escapes special characters, except for whitespace, in a string to be
     * used inside a regular expression as a string literal.
     * @param {string} text The string.
     * @return {string} The escaped string literal.
     */
    function escapeRegExp(text) {
        return text.replace(/[\-\[\]{}()*+?.,\\\^$|#]/g, '\\$&');
    }

    /**
     * Escapes special characters in a string to be used inside a regular
     * expression as a string literal. Also ensures that HTML entities will
     * be matched the same as their literal friends.
     * @param {string} body The string.
     * @return {string} The escaped string.
     */
    function escapeCodeAsRegExpForMatchingInsideHTML(body) {
        return escapeRegExp(body).replace('<', '(?:<|&lt;)').replace('>', '(?:>|&gt;)').replace('&', '(?:&|&amp;)').replace('"', '(?:"|&quot;)').replace(/\s+/g, '\\s+');
    }

    /**
     * Determines where a code fragment occurs in the source code.
     * @param {RegExp} re The function definition.
     * @param {Array.<string>} urls A list of URLs to search.
     * @return {?Object.<string, (string|number)>} An object containing
     * the url, line, and column number of the defined function.
     */
    function findSourceInUrls(re, urls) {
        var source, m;
        for (var i = 0, j = urls.length; i < j; ++i) {
            // console.log('searching', urls[i]);
            if ((source = getSource(urls[i])).length) {
                source = source.join('\n');
                if ((m = re.exec(source))) {
                    // console.log('Found function in ' + urls[i]);

                    return {
                        'url': urls[i],
                        'line': source.substring(0, m.index).split('\n').length,
                        'column': m.index - source.lastIndexOf('\n', m.index) - 1
                    };
                }
            }
        }

        // console.log('no match');

        return null;
    }

    /**
     * Determines at which column a code fragment occurs on a line of the
     * source code.
     * @param {string} fragment The code fragment.
     * @param {string} url The URL to search.
     * @param {(string|number)} line The line number to examine.
     * @return {?number} The column number.
     */
    function findSourceInLine(fragment, url, line) {
        var source = getSource(url),
            re = new RegExp('\\b' + escapeRegExp(fragment) + '\\b'),
            m;

        line -= 1;

        if (source && source.length > line && (m = re.exec(source[line]))) {
            return m.index;
        }

        return null;
    }

    /**
     * Determines where a function was defined within the source code.
     * @param {(Function|string)} func A function reference or serialized
     * function definition.
     * @return {?Object.<string, (string|number)>} An object containing
     * the url, line, and column number of the defined function.
     */
    function findSourceByFunctionBody(func) {
        var urls = [window.location.href],
            scripts = document.getElementsByTagName('script'),
            body,
            code = '' + func,
            codeRE = /^function(?:\s+([\w$]+))?\s*\(([\w\s,]*)\)\s*\{\s*(\S[\s\S]*\S)\s*\}\s*$/,
            eventRE = /^function on([\w$]+)\s*\(event\)\s*\{\s*(\S[\s\S]*\S)\s*\}\s*$/,
            re,
            parts,
            result;

        for (var i = 0; i < scripts.length; ++i) {
            var script = scripts[i];
            if (script.src) {
                urls.push(script.src);
            }
        }

        if (!(parts = codeRE.exec(code))) {
            re = new RegExp(escapeRegExp(code).replace(/\s+/g, '\\s+'));
        }

        // not sure if this is really necessary, but I don’t have a test
        // corpus large enough to confirm that and it was in the original.
        else {
            var name = parts[1] ? '\\s+' + parts[1] : '',
                args = parts[2].split(',').join('\\s*,\\s*');

            body = escapeRegExp(parts[3]).replace(/;$/, ';?'); // semicolon is inserted if the function ends with a comment.replace(/\s+/g, '\\s+');
            re = new RegExp('function' + name + '\\s*\\(\\s*' + args + '\\s*\\)\\s*{\\s*' + body + '\\s*}');
        }

        // look for a normal function definition
        if ((result = findSourceInUrls(re, urls))) {
            return result;
        }

        // look for an old-school event handler function
        if ((parts = eventRE.exec(code))) {
            var event = parts[1];
            body = escapeCodeAsRegExpForMatchingInsideHTML(parts[2]);

            // look for a function defined in HTML as an onXXX handler
            re = new RegExp('on' + event + '=[\\\'"]\\s*' + body + '\\s*[\\\'"]', 'i');

            if ((result = findSourceInUrls(re, urls[0]))) {
                return result;
            }

            // look for ???
            re = new RegExp(body);

            if ((result = findSourceInUrls(re, urls))) {
                return result;
            }
        }

        return null;
    }

    // Contents of Exception in various browsers.
    //
    // SAFARI:
    // ex.message = Can't find variable: qq
    // ex.line = 59
    // ex.sourceId = 580238192
    // ex.sourceURL = http://...
    // ex.expressionBeginOffset = 96
    // ex.expressionCaretOffset = 98
    // ex.expressionEndOffset = 98
    // ex.name = ReferenceError
    //
    // FIREFOX:
    // ex.message = qq is not defined
    // ex.fileName = http://...
    // ex.lineNumber = 59
    // ex.stack = ...stack trace... (see the example below)
    // ex.name = ReferenceError
    //
    // CHROME:
    // ex.message = qq is not defined
    // ex.name = ReferenceError
    // ex.type = not_defined
    // ex.arguments = ['aa']
    // ex.stack = ...stack trace...
    //
    // INTERNET EXPLORER:
    // ex.message = ...
    // ex.name = ReferenceError
    //
    // OPERA:
    // ex.message = ...message... (see the example below)
    // ex.name = ReferenceError
    // ex.opera#sourceloc = 11  (pretty much useless, duplicates the info in ex.message)
    // ex.stacktrace = n/a; see 'opera:config#UserPrefs|Exceptions Have Stacktrace'

    /**
     * Computes stack trace information from the stack property.
     * Chrome and Gecko use this property.
     * Added WinJS regex for Raygun4JS's offline caching support
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceFromStackProp(ex) {
        if (!ex.stack) {
            return null;
        }

        var chrome = /^\s*at (.*?) ?\(?((?:file|http|https|chrome-extension):.*?):(\d+)(?::(\d+))?\)?\s*$/i,
            gecko = /^\s*(.*?)(?:\((.*?)\))?@?((?:file|http|https|chrome):.*?):(\d+)(?::(\d+))?\s*$/i,
            winjs = /^\s*at (?:((?:\[object object\])?.+) )?\(?((?:ms-appx|http|https):.*?):(\d+)(?::(\d+))?\)?\s*$/i,
            lines = ex.stack.split('\n'),
            stack = [],
            parts,
            element,
            reference = /^(.*) is undefined$/.exec(ex.message);

        for (var i = 0, j = lines.length; i < j; ++i) {
            if ((parts = gecko.exec(lines[i]))) {
                element = {
                    'url': parts[3],
                    'func': parts[1] || UNKNOWN_FUNCTION,
                    'args': parts[2] ? parts[2].split(',') : '',
                    'line': +parts[4],
                    'column': parts[5] ? +parts[5] : null
                };
            } else if ((parts = chrome.exec(lines[i]))) {
                element = {
                    'url': parts[2],
                    'func': parts[1] || UNKNOWN_FUNCTION,
                    'line': +parts[3],
                    'column': parts[4] ? +parts[4] : null
                };
            } else if ((parts = winjs.exec(lines[i]))) {
              element = {
                'url': parts[2],
                'func': parts[1] || UNKNOWN_FUNCTION,
                'line': +parts[3],
                'column': parts[4] ? +parts[4] : null
              };
            } else {
                continue;
            }

            if (!element.func && element.line) {
                element.func = guessFunctionName(element.url, element.line);
            }

            if (element.line) {
                element.context = gatherContext(element.url, element.line);
            }

            stack.push(element);
        }

        if (stack[0] && stack[0].line && !stack[0].column && reference) {
            stack[0].column = findSourceInLine(reference[1], stack[0].url, stack[0].line);
        } else if (!stack[0].column && typeof ex.columnNumber !== 'undefined') {
            // Firefox column number
            stack[0].column = ex.columnNumber + 1;
        }

        if (!stack.length) {
            return null;
        }

        return {
            'mode': 'stack',
            'name': ex.name,
            'message': ex.message,
            'url': document.location.href,
            'stack': stack,
            'useragent': navigator.userAgent
        };
    }

    /**
     * Computes stack trace information from the stacktrace property.
     * Opera 10 uses this property.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceFromStacktraceProp(ex) {
        // Access and store the stacktrace property before doing ANYTHING
        // else to it because Opera is not very good at providing it
        // reliably in other circumstances.
        var stacktrace = ex.stacktrace;

        var testRE = / line (\d+), column (\d+) in (?:<anonymous function: ([^>]+)>|([^\)]+))\((.*)\) in (.*):\s*$/i,
            lines = stacktrace.split('\n'),
            stack = [],
            parts;

        for (var i = 0, j = lines.length; i < j; i += 2) {
            if ((parts = testRE.exec(lines[i]))) {
                var element = {
                    'line': +parts[1],
                    'column': +parts[2],
                    'func': parts[3] || parts[4],
                    'args': parts[5] ? parts[5].split(',') : [],
                    'url': parts[6]
                };

                if (!element.func && element.line) {
                    element.func = guessFunctionName(element.url, element.line);
                }
                if (element.line) {
                    try {
                        element.context = gatherContext(element.url, element.line);
                    } catch (exc) {}
                }

                if (!element.context) {
                    element.context = [lines[i + 1]];
                }

                stack.push(element);
            }
        }

        if (!stack.length) {
            return null;
        }

        return {
            'mode': 'stacktrace',
            'name': ex.name,
            'message': ex.message,
            'url': document.location.href,
            'stack': stack,
            'useragent': navigator.userAgent
        };
    }

    /**
     * NOT TESTED.
     * Computes stack trace information from an error message that includes
     * the stack trace.
     * Opera 9 and earlier use this method if the option to show stack
     * traces is turned on in opera:config.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack information.
     */
    function computeStackTraceFromOperaMultiLineMessage(ex) {
        // Opera includes a stack trace into the exception message. An example is:
        //
        // Statement on line 3: Undefined variable: undefinedFunc
        // Backtrace:
        //   Line 3 of linked script file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.js: In function zzz
        //         undefinedFunc(a);
        //   Line 7 of inline#1 script in file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.html: In function yyy
        //           zzz(x, y, z);
        //   Line 3 of inline#1 script in file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.html: In function xxx
        //           yyy(a, a, a);
        //   Line 1 of function script
        //     try { xxx('hi'); return false; } catch(ex) { TraceKit.report(ex); }
        //   ...

        var lines = ex.message.split('\n');
        if (lines.length < 4) {
            return null;
        }

        var lineRE1 = /^\s*Line (\d+) of linked script ((?:file|http|https)\S+)(?:: in function (\S+))?\s*$/i,
            lineRE2 = /^\s*Line (\d+) of inline#(\d+) script in ((?:file|http|https)\S+)(?:: in function (\S+))?\s*$/i,
            lineRE3 = /^\s*Line (\d+) of function script\s*$/i,
            stack = [],
            scripts = document.getElementsByTagName('script'),
            inlineScriptBlocks = [],
            parts,
            i,
            len,
            source;

        for (i in scripts) {
            if (_has(scripts, i) && !scripts[i].src) {
                inlineScriptBlocks.push(scripts[i]);
            }
        }

        for (i = 2, len = lines.length; i < len; i += 2) {
            var item = null;
            if ((parts = lineRE1.exec(lines[i]))) {
                item = {
                    'url': parts[2],
                    'func': parts[3],
                    'line': +parts[1]
                };
            } else if ((parts = lineRE2.exec(lines[i]))) {
                item = {
                    'url': parts[3],
                    'func': parts[4]
                };
                var relativeLine = (+parts[1]); // relative to the start of the <SCRIPT> block
                var script = inlineScriptBlocks[parts[2] - 1];
                if (script) {
                    source = getSource(item.url);
                    if (source) {
                        source = source.join('\n');
                        var pos = source.indexOf(script.innerText);
                        if (pos >= 0) {
                            item.line = relativeLine + source.substring(0, pos).split('\n').length;
                        }
                    }
                }
            } else if ((parts = lineRE3.exec(lines[i]))) {
                var url = window.location.href.replace(/#.*$/, ''),
                    line = parts[1];
                var re = new RegExp(escapeCodeAsRegExpForMatchingInsideHTML(lines[i + 1]));
                source = findSourceInUrls(re, [url]);
                item = {
                    'url': url,
                    'line': source ? source.line : line,
                    'func': ''
                };
            }

            if (item) {
                if (!item.func) {
                    item.func = guessFunctionName(item.url, item.line);
                }
                var context = gatherContext(item.url, item.line);
                var midline = (context ? context[Math.floor(context.length / 2)] : null);
                if (context && midline.replace(/^\s*/, '') === lines[i + 1].replace(/^\s*/, '')) {
                    item.context = context;
                } else {
                    // if (context) alert("Context mismatch. Correct midline:\n" + lines[i+1] + "\n\nMidline:\n" + midline + "\n\nContext:\n" + context.join("\n") + "\n\nURL:\n" + item.url);
                    item.context = [lines[i + 1]];
                }
                stack.push(item);
            }
        }
        if (!stack.length) {
            return null; // could not parse multiline exception message as Opera stack trace
        }

        return {
            'mode': 'multiline',
            'name': ex.name,
            'message': lines[0],
            'url': document.location.href,
            'stack': stack,
            'useragent': navigator.userAgent
        };
    }

    /**
     * Adds information about the first frame to incomplete stack traces.
     * Safari and IE require this to get complete data on the first frame.
     * @param {Object.<string, *>} stackInfo Stack trace information from
     * one of the compute* methods.
     * @param {string} url The URL of the script that caused an error.
     * @param {(number|string)} lineNo The line number of the script that
     * caused an error.
     * @param {string=} message The error generated by the browser, which
     * hopefully contains the name of the object that caused the error.
     * @return {boolean} Whether or not the stack information was
     * augmented.
     */
    function augmentStackTraceWithInitialElement(stackInfo, url, lineNo, message) {
        var initial = {
            'url': url,
            'line': lineNo
        };

        if (initial.url && initial.line) {
            stackInfo.incomplete = false;

            if (!initial.func) {
                initial.func = guessFunctionName(initial.url, initial.line);
            }

            if (!initial.context) {
                initial.context = gatherContext(initial.url, initial.line);
            }

            var reference = / '([^']+)' /.exec(message);
            if (reference) {
                initial.column = findSourceInLine(reference[1], initial.url, initial.line);
            }

            if (stackInfo.stack.length > 0) {
                if (stackInfo.stack[0].url === initial.url) {
                    if (stackInfo.stack[0].line === initial.line) {
                        return false; // already in stack trace
                    } else if (!stackInfo.stack[0].line && stackInfo.stack[0].func === initial.func) {
                        stackInfo.stack[0].line = initial.line;
                        stackInfo.stack[0].context = initial.context;
                        return false;
                    }
                }
            }

            stackInfo.stack.unshift(initial);
            stackInfo.partial = true;
            return true;
        } else {
            stackInfo.incomplete = true;
        }

        return false;
    }

    /**
     * Computes stack trace information by walking the arguments.caller
     * chain at the time the exception occurred. This will cause earlier
     * frames to be missed but is the only way to get any stack trace in
     * Safari and IE. The top frame is restored by
     * {@link augmentStackTraceWithInitialElement}.
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceByWalkingCallerChain(ex, depth) {
        var functionName = /function\s+([_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*)?\s*\(/i,
            stack = [],
            funcs = {},
            recursion = false,
            parts,
            item,
            source;

        for (var curr = computeStackTraceByWalkingCallerChain.caller; curr && !recursion; curr = curr.caller) {
            if (curr === computeStackTrace || curr === TraceKit.report) {
                // console.log('skipping internal function');
                continue;
            }

            item = {
                'url': null,
                'func': UNKNOWN_FUNCTION,
                'line': null,
                'column': null
            };

            if (curr.name) {
                item.func = curr.name;
            } else if ((parts = functionName.exec(curr.toString()))) {
                item.func = parts[1];
            }

            if (typeof item.func === 'undefined') {
              try {
                item.func = parts.input.substring(0, parts.input.indexOf('{'))
              } catch (e) { }
            }

            if ((source = findSourceByFunctionBody(curr))) {
                item.url = source.url;
                item.line = source.line;

                if (item.func === UNKNOWN_FUNCTION) {
                    item.func = guessFunctionName(item.url, item.line);
                }

                var reference = / '([^']+)' /.exec(ex.message || ex.description);
                if (reference) {
                    item.column = findSourceInLine(reference[1], source.url, source.line);
                }
            }

            if (funcs['' + curr]) {
                recursion = true;
            }else{
                funcs['' + curr] = true;
            }

            stack.push(item);
        }

        if (depth) {
            // console.log('depth is ' + depth);
            // console.log('stack is ' + stack.length);
            stack.splice(0, depth);
        }

        var result = {
            'mode': 'callers',
            'name': ex.name,
            'message': ex.message,
            'url': document.location.href,
            'stack': stack,
            'useragent': navigator.userAgent
        };
        augmentStackTraceWithInitialElement(result, ex.sourceURL || ex.fileName, ex.line || ex.lineNumber, ex.message || ex.description);
        return result;
    }

    /**
     * Computes a stack trace for an exception.
     * @param {Error} ex
     * @param {(string|number)=} depth
     */
    function computeStackTrace(ex, depth) {
        var stack = null;
        depth = (depth == null ? 0 : +depth);

        try {
            // This must be tried first because Opera 10 *destroys*
            // its stacktrace property if you try to access the stack
            // property first!!
            stack = computeStackTraceFromStacktraceProp(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceFromStackProp(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceFromOperaMultiLineMessage(ex);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        try {
            stack = computeStackTraceByWalkingCallerChain(ex, depth + 1);
            if (stack) {
                return stack;
            }
        } catch (e) {
            if (debug) {
                throw e;
            }
        }

        return {
            'mode': 'failed'
        };
    }

    /**
     * Logs a stacktrace starting from the previous call and working down.
     * @param {(number|string)=} depth How many frames deep to trace.
     * @return {Object.<string, *>} Stack trace information.
     */
    function computeStackTraceOfCaller(depth) {
        depth = (depth == null ? 0 : +depth) + 1; // "+ 1" because "ofCaller" should drop one frame
        try {
            throw new Error();
        } catch (ex) {
            return computeStackTrace(ex, depth + 1);
        }
    }

    computeStackTrace.augmentStackTraceWithInitialElement = augmentStackTraceWithInitialElement;
    computeStackTrace.guessFunctionName = guessFunctionName;
    computeStackTrace.gatherContext = gatherContext;
    computeStackTrace.ofCaller = computeStackTraceOfCaller;

    return computeStackTrace;
}());

/**
 * Extends support for global error handling for asynchronous browser
 * functions. Adopted from Closure Library's errorhandler.js
 */
TraceKit.extendToAsynchronousCallbacks = function () {
    var _helper = function _helper(fnName) {
        var originalFn = window[fnName];
        window[fnName] = function traceKitAsyncExtension() {
            // Make a copy of the arguments
            var args = _slice.call(arguments);
            var originalCallback = args[0];
            if (typeof (originalCallback) === 'function') {
                args[0] = TraceKit.wrap(originalCallback);
            }
            // IE < 9 doesn't support .call/.apply on setInterval/setTimeout, but it
            // also only supports 2 argument and doesn't care what "this" is, so we
            // can just call the original function directly.
            if (originalFn.apply) {
                return originalFn.apply(this, args);
            } else {
                return originalFn(args[0], args[1]);
            }
        };
    };

    _helper('setTimeout');
    _helper('setInterval');
};

//Default options:
if (!TraceKit.remoteFetching) {
  TraceKit.remoteFetching = true;
}
if (!TraceKit.collectWindowErrors) {
  TraceKit.collectWindowErrors = true;
}
if (!TraceKit.linesOfContext || TraceKit.linesOfContext < 1) {
  // 5 lines before, the offending line, 5 lines after
  TraceKit.linesOfContext = 11;
}



// Export to global object
window.TraceKit = TraceKit;

}(window));


(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require, exports, module);
  } else {
    root.Exceptionless = factory();
  }
}(this, function(require, exports, module) {
if (!exports) {
	var exports = {};
}
if (!require) {
	var require = function(){};
}


var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ContextData = (function () {
    function ContextData() {
    }
    ContextData.prototype.setException = function (exception) {
        if (exception) {
            this['@@_Exception'] = exception;
        }
    };
    Object.defineProperty(ContextData.prototype, "hasException", {
        get: function () {
            return !!this['@@_Exception'];
        },
        enumerable: true,
        configurable: true
    });
    ContextData.prototype.getException = function () {
        return this.hasException ? this['@@_Exception'] : null;
    };
    ContextData.prototype.markAsUnhandledError = function () {
        this['@@_IsUnhandledError'] = true;
    };
    Object.defineProperty(ContextData.prototype, "isUnhandledError", {
        get: function () {
            return !!this['@@_IsUnhandledError'];
        },
        enumerable: true,
        configurable: true
    });
    ContextData.prototype.setSubmissionMethod = function (method) {
        if (method && method.length > 0) {
            this['@@_SubmissionMethod'] = method;
        }
    };
    ContextData.prototype.getSubmissionMethod = function () {
        return !!this['@@_SubmissionMethod'] ? this['@@_SubmissionMethod'] : null;
    };
    return ContextData;
})();
exports.ContextData = ContextData;
var InMemoryLastReferenceIdManager = (function () {
    function InMemoryLastReferenceIdManager() {
        this._lastReferenceId = null;
    }
    InMemoryLastReferenceIdManager.prototype.getLast = function () {
        return this._lastReferenceId;
    };
    InMemoryLastReferenceIdManager.prototype.clearLast = function () {
        this._lastReferenceId = null;
    };
    InMemoryLastReferenceIdManager.prototype.setLast = function (eventId) {
        this._lastReferenceId = eventId;
    };
    return InMemoryLastReferenceIdManager;
})();
exports.InMemoryLastReferenceIdManager = InMemoryLastReferenceIdManager;
var ConsoleLog = (function () {
    function ConsoleLog() {
    }
    ConsoleLog.prototype.info = function (message) {
        this.log('info', message);
    };
    ConsoleLog.prototype.warn = function (message) {
        this.log('warn', message);
    };
    ConsoleLog.prototype.error = function (message) {
        this.log('error', message);
    };
    ConsoleLog.prototype.log = function (level, message) {
        if (console && console[level]) {
            console[level]("[" + level + "] Exceptionless: " + message);
        }
    };
    return ConsoleLog;
})();
exports.ConsoleLog = ConsoleLog;
var NullLog = (function () {
    function NullLog() {
    }
    NullLog.prototype.info = function (message) { };
    NullLog.prototype.warn = function (message) { };
    NullLog.prototype.error = function (message) { };
    return NullLog;
})();
exports.NullLog = NullLog;
var EventPluginContext = (function () {
    function EventPluginContext(client, event, contextData) {
        this.client = client;
        this.event = event;
        this.contextData = contextData ? contextData : new ContextData();
    }
    Object.defineProperty(EventPluginContext.prototype, "log", {
        get: function () {
            return this.client.config.log;
        },
        enumerable: true,
        configurable: true
    });
    return EventPluginContext;
})();
exports.EventPluginContext = EventPluginContext;
var EventPluginManager = (function () {
    function EventPluginManager() {
    }
    EventPluginManager.run = function (context, callback) {
        var wrap = function (plugin, next) {
            return function () {
                try {
                    if (!context.cancelled) {
                        plugin.run(context, next);
                    }
                }
                catch (ex) {
                    context.cancelled = true;
                    context.log.error("Error while running plugin '" + plugin.name + "': " + ex.message + ". This event will be discarded.");
                }
                if (context.cancelled && !!callback) {
                    callback(context);
                }
            };
        };
        var plugins = context.client.config.plugins;
        if (!!callback) {
            plugins.push({ name: 'callback', priority: 9007199254740992, run: callback });
        }
        var wrappedPlugins = [];
        for (var index = plugins.length - 1; index > -1; index--) {
            wrappedPlugins[index] = wrap(plugins[index], index < plugins.length - 1 ? wrappedPlugins[index + 1] : null);
        }
        wrappedPlugins[0]();
    };
    EventPluginManager.addDefaultPlugins = function (config) {
        config.addPlugin(new ConfigurationDefaultsPlugin());
        config.addPlugin(new ErrorPlugin());
        config.addPlugin(new DuplicateCheckerPlugin());
        config.addPlugin(new ModuleInfoPlugin());
        config.addPlugin(new RequestInfoPlugin());
        config.addPlugin(new EnvironmentInfoPlugin());
        config.addPlugin(new SubmissionMethodPlugin());
    };
    return EventPluginManager;
})();
exports.EventPluginManager = EventPluginManager;
var ReferenceIdPlugin = (function () {
    function ReferenceIdPlugin() {
        this.priority = 20;
        this.name = 'ReferenceIdPlugin';
    }
    ReferenceIdPlugin.prototype.run = function (context, next) {
        if ((!context.event.reference_id || context.event.reference_id.length === 0) && context.event.type === 'error') {
            context.event.reference_id = Utils.guid().replace('-', '').substring(0, 10);
        }
        if (next) {
            next();
        }
    };
    return ReferenceIdPlugin;
})();
exports.ReferenceIdPlugin = ReferenceIdPlugin;
var DefaultEventQueue = (function () {
    function DefaultEventQueue(config) {
        this._processingQueue = false;
        this._config = config;
    }
    DefaultEventQueue.prototype.enqueue = function (event) {
        this.ensureQueueTimer();
        if (this.areQueuedItemsDiscarded()) {
            this._config.log.info('Queue items are currently being discarded. The event will not be queued.');
            return;
        }
        var key = this.queuePath() + "-" + new Date().toJSON() + "-" + Utils.randomNumber();
        this._config.log.info("Enqueuing event: " + key + " type=" + event.type + " " + (!!event.reference_id ? 'refid=' + event.reference_id : ''));
        this._config.storage.save(key, event);
    };
    DefaultEventQueue.prototype.process = function () {
        var _this = this;
        this.ensureQueueTimer();
        if (this._processingQueue) {
            return;
        }
        this._config.log.info('Processing queue...');
        if (!this._config.enabled) {
            this._config.log.info('Configuration is disabled. The queue will not be processed.');
            return;
        }
        if (!this._config.apiKey || this._config.apiKey.length < 10) {
            this._config.log.info('ApiKey is not set. The queue will not be processed.');
            return;
        }
        this._processingQueue = true;
        try {
            var events = this._config.storage.get(this.queuePath(), this._config.submissionBatchSize);
            if (!events || events.length == 0) {
                this._config.log.info('There are currently no queued events to process.');
                this._processingQueue = false;
                return;
            }
            this._config.log.info("Sending " + events.length + " events to " + this._config.serverUrl + ".");
            this._config.submissionClient.submit(events, this._config, function (response) {
                _this.processSubmissionResponse(response, events);
                _this._config.log.info('Finished processing queue.');
                _this._processingQueue = false;
            });
        }
        catch (ex) {
            this._config.log.error("An error occurred while processing the queue: " + ex);
            this.suspendProcessing();
            this._processingQueue = false;
        }
    };
    DefaultEventQueue.prototype.processSubmissionResponse = function (response, events) {
        if (response.success) {
            this._config.log.info("Sent " + events.length + " events to " + this._config.serverUrl + ".");
            return;
        }
        if (response.serviceUnavailable) {
            this._config.log.error('Server returned service unavailable.');
            this.suspendProcessing();
            this.requeueEvents(events);
            return;
        }
        if (response.paymentRequired) {
            this._config.log.info('Too many events have been submitted, please upgrade your plan.');
            this.suspendProcessing(null, true, true);
            return;
        }
        if (response.unableToAuthenticate) {
            this._config.log.info('Unable to authenticate, please check your configuration. The event will not be submitted.');
            this.suspendProcessing(15);
            return;
        }
        if (response.notFound || response.badRequest) {
            this._config.log.error("Error while trying to submit data: " + response.message);
            this.suspendProcessing(60 * 4);
            return;
        }
        if (response.requestEntityTooLarge) {
            if (this._config.submissionBatchSize > 1) {
                this._config.log.error('Event submission discarded for being too large. The event will be retried with a smaller events size.');
                this._config.submissionBatchSize = Math.max(1, Math.round(this._config.submissionBatchSize / 1.5));
                this.requeueEvents(events);
            }
            else {
                this._config.log.error('Event submission discarded for being too large. The event will not be submitted.');
            }
            return;
        }
        if (!response.success) {
            this._config.log.error("An error occurred while submitting events: " + response.message);
            this.suspendProcessing();
            this.requeueEvents(events);
        }
    };
    DefaultEventQueue.prototype.ensureQueueTimer = function () {
        var _this = this;
        if (!this._queueTimer) {
            this._queueTimer = setInterval(function () { return _this.onProcessQueue(); }, 10000);
        }
    };
    DefaultEventQueue.prototype.onProcessQueue = function () {
        if (!this.isQueueProcessingSuspended() && !this._processingQueue) {
            this.process();
        }
    };
    DefaultEventQueue.prototype.suspendProcessing = function (durationInMinutes, discardFutureQueuedItems, clearQueue) {
        if (!durationInMinutes || durationInMinutes <= 0) {
            durationInMinutes = 5;
        }
        this._config.log.info("Suspending processing for " + durationInMinutes + " minutes.");
        this._suspendProcessingUntil = new Date(new Date().getTime() + (durationInMinutes * 60000));
        if (discardFutureQueuedItems) {
            this._discardQueuedItemsUntil = new Date(new Date().getTime() + (durationInMinutes * 60000));
        }
        if (!clearQueue) {
            return;
        }
        try {
            this._config.storage.clear(this.queuePath());
        }
        catch (Exception) { }
    };
    DefaultEventQueue.prototype.requeueEvents = function (events) {
        this._config.log.info("Requeuing " + events.length + " events.");
        for (var index = 0; index < events.length; index++) {
            this.enqueue(events[index]);
        }
    };
    DefaultEventQueue.prototype.isQueueProcessingSuspended = function () {
        return this._suspendProcessingUntil && this._suspendProcessingUntil > new Date();
    };
    DefaultEventQueue.prototype.areQueuedItemsDiscarded = function () {
        return this._discardQueuedItemsUntil && this._discardQueuedItemsUntil > new Date();
    };
    DefaultEventQueue.prototype.queuePath = function () {
        return 'ex-q';
    };
    return DefaultEventQueue;
})();
exports.DefaultEventQueue = DefaultEventQueue;
var InMemoryStorage = (function () {
    function InMemoryStorage() {
        this._items = {};
    }
    InMemoryStorage.prototype.save = function (path, value) {
        this._items[path] = value;
        return true;
    };
    InMemoryStorage.prototype.get = function (searchPattern, limit) {
        var results = [];
        var regex = new RegExp(searchPattern || '.*');
        for (var key in this._items) {
            if (results.length >= limit) {
                break;
            }
            if (regex.test(key)) {
                results.push(this._items[key]);
                delete this._items[key];
            }
        }
        return results;
    };
    InMemoryStorage.prototype.clear = function (searchPattern) {
        if (!searchPattern) {
            this._items = {};
            return;
        }
        var regex = new RegExp(searchPattern);
        for (var key in this._items) {
            if (regex.test(key)) {
                delete this._items[key];
            }
        }
    };
    InMemoryStorage.prototype.count = function (searchPattern) {
        var regex = new RegExp(searchPattern || '.*');
        var results = [];
        for (var key in this._items) {
            if (regex.test(key)) {
                results.push(key);
            }
        }
        return results.length;
    };
    return InMemoryStorage;
})();
exports.InMemoryStorage = InMemoryStorage;
var Utils = (function () {
    function Utils() {
    }
    Utils.getHashCode = function (source) {
        if (!source || source.length === 0) {
            return null;
        }
        var hash = 0;
        for (var index = 0; index < source.length; index++) {
            var character = source.charCodeAt(index);
            hash = ((hash << 5) - hash) + character;
            hash |= 0;
        }
        return hash.toString();
    };
    Utils.getCookies = function (cookies, separator) {
        var result = {};
        var parts = (cookies || '').split(separator || ', ');
        for (var index = 0; index < parts.length; index++) {
            var cookie = parts[index].split('=');
            result[cookie[0]] = cookie[1];
        }
        return result;
    };
    Utils.guid = function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    };
    Utils.merge = function (defaultValues, values) {
        var result = {};
        for (var key in defaultValues || {}) {
            if (!!defaultValues[key]) {
                result[key] = defaultValues[key];
            }
        }
        for (var key in values || {}) {
            if (!!values[key]) {
                result[key] = values[key];
            }
        }
        return result;
    };
    Utils.parseFunctionName = function (frame) {
        function isLowerCase(part) {
            for (var index = 0; index < (part || '').length; index++) {
                var code = part.charCodeAt(index);
                if (code >= 65 && code <= 90) {
                    return false;
                }
            }
            return true;
        }
        var anonymous = '<anonymous>';
        var parts = (frame || '').replace('?', anonymous).split('.');
        if (parts[0] === 'Array' || parts[0] === 'Function') {
            parts.shift();
        }
        var namespace = [];
        var type;
        var name = [parts.pop() || anonymous];
        for (var index = 0; index < parts.length; index++) {
            var part = parts[index];
            if (!type && index === (parts.length - 1)) {
                type = part;
                break;
            }
            var isLower = isLowerCase(part);
            if (isLower) {
                if (!type) {
                    namespace.push(part);
                }
                else {
                    name.unshift(part);
                }
                continue;
            }
            if (type) {
                namespace.push(type);
            }
            type = part;
        }
        var stackFrame = { name: name.join('.') };
        if (namespace.join('.').length > 0) {
            stackFrame.declaring_namespace = namespace.join('.');
        }
        if (!!type && type.length > 0) {
            stackFrame.declaring_type = type;
        }
        return stackFrame;
    };
    Utils.parseVersion = function (source) {
        if (!source) {
            return null;
        }
        var versionRegex = /(v?((\d+)\.(\d+)(\.(\d+))?)(?:-([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?(?:\+([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?)/;
        var matches = versionRegex.exec(source);
        if (matches && matches.length > 0) {
            return matches[0];
        }
        return null;
    };
    Utils.parseQueryString = function (query) {
        if (!query || query.length === 0) {
            return null;
        }
        var pairs = query.split('&');
        if (pairs.length === 0) {
            return null;
        }
        var result = {};
        for (var index = 0; index < pairs.length; index++) {
            var pair = pairs[index].split('=');
            result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
        return result;
    };
    Utils.randomNumber = function () {
        return Math.floor(Math.random() * 9007199254740992);
    };
    Utils.stringify = function (data) {
        var cache = [];
        return JSON.stringify(data, function (key, value) {
            if (typeof value === 'object' && value !== null) {
                if (cache.indexOf(value) !== -1) {
                    return;
                }
                cache.push(value);
            }
            return value;
        });
    };
    return Utils;
})();
exports.Utils = Utils;
var Configuration = (function () {
    function Configuration(settings) {
        this._enabled = true;
        this._serverUrl = 'https://collector.exceptionless.io';
        this._plugins = [];
        this.lastReferenceIdManager = new InMemoryLastReferenceIdManager();
        this.defaultTags = [];
        this.defaultData = {};
        function inject(fn) {
            return typeof fn === 'function' ? fn(this) : fn;
        }
        settings = Utils.merge(Configuration.defaults, settings);
        this.log = inject(settings.log) || new NullLog();
        this.apiKey = settings.apiKey;
        this.serverUrl = settings.serverUrl;
        this.environmentInfoCollector = inject(settings.environmentInfoCollector);
        this.errorParser = inject(settings.errorParser);
        this.lastReferenceIdManager = inject(settings.lastReferenceIdManager) || new InMemoryLastReferenceIdManager();
        this.moduleCollector = inject(settings.moduleCollector);
        this.requestInfoCollector = inject(settings.requestInfoCollector);
        this.submissionBatchSize = inject(settings.submissionBatchSize) || 50;
        this.submissionClient = inject(settings.submissionClient);
        this.storage = inject(settings.storage) || new InMemoryStorage();
        this.queue = inject(settings.queue) || new DefaultEventQueue(this);
        EventPluginManager.addDefaultPlugins(this);
    }
    Object.defineProperty(Configuration.prototype, "apiKey", {
        get: function () {
            return this._apiKey;
        },
        set: function (value) {
            this._apiKey = value || null;
            this.log.info("apiKey: " + this._apiKey);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "serverUrl", {
        get: function () {
            return this._serverUrl;
        },
        set: function (value) {
            if (!!value && value.length > 0) {
                this._serverUrl = value;
                this.log.info("serverUrl: " + this._serverUrl);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "enabled", {
        get: function () {
            return this._enabled;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "plugins", {
        get: function () {
            return this._plugins.sort(function (p1, p2) {
                return (p1.priority < p2.priority) ? -1 : (p1.priority > p2.priority) ? 1 : 0;
            });
        },
        enumerable: true,
        configurable: true
    });
    Configuration.prototype.addPlugin = function (pluginOrName, priority, pluginAction) {
        var plugin = !!pluginAction ? { name: pluginOrName, priority: priority, run: pluginAction } : pluginOrName;
        if (!plugin || !plugin.run) {
            this.log.error('Add plugin failed: No run method was defined.');
            return;
        }
        if (!plugin.name) {
            plugin.name = Utils.guid();
        }
        if (!plugin.priority) {
            plugin.priority = 0;
        }
        var pluginExists = false;
        for (var index = 0; index < this._plugins.length; index++) {
            if (this._plugins[index].name === plugin.name) {
                pluginExists = true;
                break;
            }
        }
        if (!pluginExists) {
            this._plugins.push(plugin);
        }
    };
    Configuration.prototype.removePlugin = function (pluginOrName) {
        var name = typeof pluginOrName === 'string' ? pluginOrName : pluginOrName.name;
        if (!name) {
            this.log.error('Remove plugin failed: No plugin name was defined.');
            return;
        }
        for (var index = 0; index < this._plugins.length; index++) {
            if (this._plugins[index].name === name) {
                this._plugins.splice(index, 1);
                break;
            }
        }
    };
    Configuration.prototype.setVersion = function (version) {
        if (!!version && version.length > 0) {
            this.defaultData['@version'] = version;
        }
    };
    Configuration.prototype.setUserIdentity = function (userInfoOrIdentity, name) {
        var userInfo = typeof userInfoOrIdentity !== 'string' ? userInfoOrIdentity : { identity: userInfoOrIdentity, name: name };
        var shouldRemove = !userInfo || (!userInfo.identity && !userInfo.name);
        if (shouldRemove) {
            delete this.defaultData['@user'];
        }
        else {
            this.defaultData['@user'] = userInfo;
        }
        this.log.info("user identity: " + (shouldRemove ? 'null' : userInfo.identity));
    };
    Configuration.prototype.useReferenceIds = function () {
        this.addPlugin(new ReferenceIdPlugin());
    };
    Configuration.prototype.useDebugLogger = function () {
        this.log = new ConsoleLog();
    };
    Object.defineProperty(Configuration, "defaults", {
        get: function () {
            if (Configuration._defaultSettings === null) {
                Configuration._defaultSettings = {};
            }
            return Configuration._defaultSettings;
        },
        enumerable: true,
        configurable: true
    });
    Configuration._defaultSettings = null;
    return Configuration;
})();
exports.Configuration = Configuration;
var EventBuilder = (function () {
    function EventBuilder(event, client, pluginContextData) {
        this.target = event;
        this.client = client;
        this.pluginContextData = pluginContextData || new ContextData();
    }
    EventBuilder.prototype.setType = function (type) {
        if (!!type && type.length > 0) {
            this.target.type = type;
        }
        return this;
    };
    EventBuilder.prototype.setSource = function (source) {
        if (!!source && source.length > 0) {
            this.target.source = source;
        }
        return this;
    };
    EventBuilder.prototype.setSessionId = function (sessionId) {
        if (!this.isValidIdentifier(sessionId)) {
            throw new Error("SessionId must contain between 8 and 100 alphanumeric or '-' characters.");
        }
        this.target.session_id = sessionId;
        return this;
    };
    EventBuilder.prototype.setReferenceId = function (referenceId) {
        if (!this.isValidIdentifier(referenceId)) {
            throw new Error("SessionId must contain between 8 and 100 alphanumeric or '-' characters.");
        }
        this.target.reference_id = referenceId;
        return this;
    };
    EventBuilder.prototype.setMessage = function (message) {
        if (!!message && message.length > 0) {
            this.target.message = message;
        }
        return this;
    };
    EventBuilder.prototype.setGeo = function (latitude, longitude) {
        if (latitude < -90.0 || latitude > 90.0)
            throw new Error('Must be a valid latitude value between -90.0 and 90.0.');
        if (longitude < -180.0 || longitude > 180.0)
            throw new Error('Must be a valid longitude value between -180.0 and 180.0.');
        this.target.geo = latitude + "," + longitude;
        return this;
    };
    EventBuilder.prototype.setUserIdentity = function (userInfoOrIdentity, name) {
        var userInfo = typeof userInfoOrIdentity !== 'string' ? userInfoOrIdentity : { identity: userInfoOrIdentity, name: name };
        if (!userInfo || (!userInfo.identity && !userInfo.name)) {
            return this;
        }
        this.setProperty('@user', userInfo);
        return this;
    };
    EventBuilder.prototype.setValue = function (value) {
        if (!!value) {
            this.target.value = value;
        }
        return this;
    };
    EventBuilder.prototype.addTags = function () {
        var tags = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tags[_i - 0] = arguments[_i];
        }
        if (!tags || tags.length === 0) {
            return this;
        }
        if (!this.target.tags) {
            this.target.tags = [];
        }
        for (var index = 0; index < tags.length; index++) {
            if (tags[index] && this.target.tags.indexOf(tags[index]) < 0) {
                this.target.tags.push(tags[index]);
            }
        }
        return this;
    };
    EventBuilder.prototype.setProperty = function (name, value) {
        if (!name || (value === undefined || value == null)) {
            return this;
        }
        if (!this.target.data) {
            this.target.data = {};
        }
        this.target.data[name] = value;
        return this;
    };
    EventBuilder.prototype.markAsCritical = function (critical) {
        if (critical) {
            this.addTags('Critical');
        }
        return this;
    };
    EventBuilder.prototype.addRequestInfo = function (request) {
        if (!!request) {
            this.pluginContextData['@request'] = request;
        }
        return this;
    };
    EventBuilder.prototype.submit = function (callback) {
        this.client.submitEvent(this.target, this.pluginContextData, callback);
    };
    EventBuilder.prototype.isValidIdentifier = function (value) {
        if (!value || !value.length) {
            return true;
        }
        if (value.length < 8 || value.length > 100) {
            return false;
        }
        for (var index = 0; index < value.length; index++) {
            var code = value.charCodeAt(index);
            var isDigit = (code >= 48) && (code <= 57);
            var isLetter = ((code >= 65) && (code <= 90)) || ((code >= 97) && (code <= 122));
            var isMinus = code === 45;
            if (!(isDigit || isLetter) && !isMinus) {
                return false;
            }
        }
        return true;
    };
    return EventBuilder;
})();
exports.EventBuilder = EventBuilder;
var ExceptionlessClient = (function () {
    function ExceptionlessClient(settingsOrApiKey, serverUrl) {
        // TODO: populate this in a plugin..
        //var settings = this.getSettingsFromScriptTag() || {};
        if (typeof settingsOrApiKey !== 'object') {
            this.config = new Configuration(settingsOrApiKey);
        }
        else {
            this.config = new Configuration({ apiKey: settingsOrApiKey, serverUrl: serverUrl });
        }
    }
    ExceptionlessClient.prototype.createException = function (exception) {
        var pluginContextData = new ContextData();
        pluginContextData.setException(exception);
        return this.createEvent(pluginContextData).setType('error');
    };
    ExceptionlessClient.prototype.submitException = function (exception, callback) {
        this.createException(exception).submit(callback);
    };
    ExceptionlessClient.prototype.createUnhandledException = function (exception, submissionMethod) {
        var builder = this.createException(exception);
        builder.pluginContextData.markAsUnhandledError();
        builder.pluginContextData.setSubmissionMethod(submissionMethod);
        return builder;
    };
    ExceptionlessClient.prototype.submitUnhandledException = function (exception, submissionMethod, callback) {
        this.createUnhandledException(exception, submissionMethod).submit(callback);
    };
    ExceptionlessClient.prototype.createFeatureUsage = function (feature) {
        return this.createEvent().setType('usage').setSource(feature);
    };
    ExceptionlessClient.prototype.submitFeatureUsage = function (feature, callback) {
        this.createFeatureUsage(feature).submit(callback);
    };
    ExceptionlessClient.prototype.createLog = function (sourceOrMessage, message, level) {
        var builder = this.createEvent().setType('log');
        if (sourceOrMessage && message && level) {
            builder = builder.setSource(sourceOrMessage).setMessage(message).setProperty('@level', level);
        }
        else if (sourceOrMessage && message) {
            builder = builder.setSource(sourceOrMessage).setMessage(message);
        }
        else {
            var source = (arguments.callee.caller).name;
            builder = builder.setSource(source).setMessage(sourceOrMessage);
        }
        return builder;
    };
    ExceptionlessClient.prototype.submitLog = function (sourceOrMessage, message, level, callback) {
        this.createLog(sourceOrMessage, message, level).submit(callback);
    };
    ExceptionlessClient.prototype.createNotFound = function (resource) {
        return this.createEvent().setType('404').setSource(resource);
    };
    ExceptionlessClient.prototype.submitNotFound = function (resource, callback) {
        this.createNotFound(resource).submit(callback);
    };
    ExceptionlessClient.prototype.createSessionStart = function (sessionId) {
        return this.createEvent().setType('start').setSessionId(sessionId);
    };
    ExceptionlessClient.prototype.submitSessionStart = function (sessionId, callback) {
        this.createSessionStart(sessionId).submit(callback);
    };
    ExceptionlessClient.prototype.createSessionEnd = function (sessionId) {
        return this.createEvent().setType('end').setSessionId(sessionId);
    };
    ExceptionlessClient.prototype.submitSessionEnd = function (sessionId, callback) {
        this.createSessionEnd(sessionId).submit(callback);
    };
    ExceptionlessClient.prototype.createEvent = function (pluginContextData) {
        return new EventBuilder({ date: new Date() }, this, pluginContextData);
    };
    ExceptionlessClient.prototype.submitEvent = function (event, pluginContextData, callback) {
        var _this = this;
        if (!event) {
            return;
        }
        if (!this.config.enabled) {
            return this.config.log.info('Event submission is currently disabled.');
        }
        if (!event.data) {
            event.data = {};
        }
        if (!event.tags || !event.tags.length) {
            event.tags = [];
        }
        var context = new EventPluginContext(this, event, pluginContextData);
        EventPluginManager.run(context, function (context) {
            if (!context.cancelled) {
                if (!event.type || event.type.length === 0) {
                    event.type = 'log';
                }
                if (!event.date) {
                    event.date = new Date();
                }
                _this.config.queue.enqueue(event);
                if (event.reference_id && event.reference_id.length > 0) {
                    _this.config.log.info("Setting last reference id '" + event.reference_id + "'");
                    _this.config.lastReferenceIdManager.setLast(event.reference_id);
                }
            }
            if (!!callback) {
                callback(context);
            }
        });
    };
    ExceptionlessClient.prototype.getLastReferenceId = function () {
        return this.config.lastReferenceIdManager.getLast();
    };
    Object.defineProperty(ExceptionlessClient, "default", {
        get: function () {
            if (ExceptionlessClient._instance === null) {
                ExceptionlessClient._instance = new ExceptionlessClient(null);
            }
            return ExceptionlessClient._instance;
        },
        enumerable: true,
        configurable: true
    });
    ExceptionlessClient._instance = null;
    return ExceptionlessClient;
})();
exports.ExceptionlessClient = ExceptionlessClient;
var ConfigurationDefaultsPlugin = (function () {
    function ConfigurationDefaultsPlugin() {
        this.priority = 10;
        this.name = 'ConfigurationDefaultsPlugin';
    }
    ConfigurationDefaultsPlugin.prototype.run = function (context, next) {
        var defaultTags = context.client.config.defaultTags || [];
        for (var index = 0; index < defaultTags.length; index++) {
            var tag = defaultTags[index];
            if (!!tag && context.event.tags.indexOf(tag) < 0) {
                context.event.tags.push(tag);
            }
        }
        var defaultData = context.client.config.defaultData || {};
        for (var key in defaultData) {
            if (!!defaultData[key]) {
                context.event.data[key] = defaultData[key];
            }
        }
        if (next) {
            next();
        }
    };
    return ConfigurationDefaultsPlugin;
})();
exports.ConfigurationDefaultsPlugin = ConfigurationDefaultsPlugin;
var ErrorPlugin = (function () {
    function ErrorPlugin() {
        this.priority = 30;
        this.name = 'ErrorPlugin';
    }
    ErrorPlugin.prototype.run = function (context, next) {
        var exception = context.contextData.getException();
        if (!!exception) {
            context.event.type = 'error';
            if (!context.event.data['@error']) {
                var parser = context.client.config.errorParser;
                if (!parser) {
                    throw new Error('No error parser was defined.');
                }
                parser.parse(context, exception);
            }
        }
        if (next) {
            next();
        }
    };
    return ErrorPlugin;
})();
exports.ErrorPlugin = ErrorPlugin;
var DuplicateCheckerPlugin = (function () {
    function DuplicateCheckerPlugin() {
        this.priority = 50;
        this.name = 'DuplicateCheckerPlugin';
    }
    DuplicateCheckerPlugin.prototype.run = function (context, next) {
        if (next) {
            next();
        }
    };
    return DuplicateCheckerPlugin;
})();
exports.DuplicateCheckerPlugin = DuplicateCheckerPlugin;
var ModuleInfoPlugin = (function () {
    function ModuleInfoPlugin() {
        this.priority = 40;
        this.name = 'ModuleInfoPlugin';
    }
    ModuleInfoPlugin.prototype.run = function (context, next) {
        var moduleCollector = context.client.config.moduleCollector;
        if (context.event.data['@error'] && !context.event.data['@error'].modules && !!moduleCollector) {
            var modules = moduleCollector.getModules(context);
            if (modules && modules.length > 0) {
                context.event.data['@error'].modules = modules;
            }
        }
        if (next) {
            next();
        }
    };
    return ModuleInfoPlugin;
})();
exports.ModuleInfoPlugin = ModuleInfoPlugin;
var RequestInfoPlugin = (function () {
    function RequestInfoPlugin() {
        this.priority = 60;
        this.name = 'RequestInfoPlugin';
    }
    RequestInfoPlugin.prototype.run = function (context, next) {
        var requestInfoCollector = context.client.config.requestInfoCollector;
        if (!context.event.data['@request'] && !!requestInfoCollector) {
            var ri = requestInfoCollector.getRequestInfo(context);
            if (!!ri) {
                context.event.data['@request'] = ri;
            }
        }
        if (next) {
            next();
        }
    };
    return RequestInfoPlugin;
})();
exports.RequestInfoPlugin = RequestInfoPlugin;
var EnvironmentInfoPlugin = (function () {
    function EnvironmentInfoPlugin() {
        this.priority = 70;
        this.name = 'EnvironmentInfoPlugin';
    }
    EnvironmentInfoPlugin.prototype.run = function (context, next) {
        if (!context.event.data['@environment'] && context.client.config.environmentInfoCollector) {
            var ei = context.client.config.environmentInfoCollector.getEnvironmentInfo(context);
            if (!!ei) {
                context.event.data['@environment'] = ei;
            }
        }
        if (next) {
            next();
        }
    };
    return EnvironmentInfoPlugin;
})();
exports.EnvironmentInfoPlugin = EnvironmentInfoPlugin;
var SubmissionMethodPlugin = (function () {
    function SubmissionMethodPlugin() {
        this.priority = 100;
        this.name = 'SubmissionMethodPlugin';
    }
    SubmissionMethodPlugin.prototype.run = function (context, next) {
        var submissionMethod = context.contextData.getSubmissionMethod();
        if (!!submissionMethod) {
            context.event.data['@submission_method'] = submissionMethod;
        }
        if (next) {
            next();
        }
    };
    return SubmissionMethodPlugin;
})();
exports.SubmissionMethodPlugin = SubmissionMethodPlugin;
var SettingsResponse = (function () {
    function SettingsResponse(success, settings, settingsVersion, exception, message) {
        if (settingsVersion === void 0) { settingsVersion = -1; }
        if (exception === void 0) { exception = null; }
        if (message === void 0) { message = null; }
        this.success = false;
        this.settingsVersion = -1;
        this.success = success;
        this.settings = settings;
        this.settingsVersion = settingsVersion;
        this.exception = exception;
        this.message = message;
    }
    return SettingsResponse;
})();
exports.SettingsResponse = SettingsResponse;
var SubmissionResponse = (function () {
    function SubmissionResponse(statusCode, message) {
        this.success = false;
        this.badRequest = false;
        this.serviceUnavailable = false;
        this.paymentRequired = false;
        this.unableToAuthenticate = false;
        this.notFound = false;
        this.requestEntityTooLarge = false;
        this.statusCode = statusCode;
        this.message = message;
        this.success = statusCode >= 200 && statusCode <= 299;
        this.badRequest = statusCode === 400;
        this.serviceUnavailable = statusCode === 503;
        this.paymentRequired = statusCode === 402;
        this.unableToAuthenticate = statusCode === 401 || statusCode === 403;
        this.notFound = statusCode === 404;
        this.requestEntityTooLarge = statusCode === 413;
    }
    return SubmissionResponse;
})();
exports.SubmissionResponse = SubmissionResponse;
var os = require('os');
var NodeEnvironmentInfoCollector = (function () {
    function NodeEnvironmentInfoCollector() {
    }
    NodeEnvironmentInfoCollector.prototype.getEnvironmentInfo = function (context) {
        if (!os) {
            return null;
        }
        var environmentInfo = {
            processor_count: os.cpus().length,
            total_physical_memory: os.totalmem(),
            available_physical_memory: os.freemem(),
            command_line: process.argv.join(' '),
            process_name: process.title,
            process_id: process.pid + '',
            process_memory_size: process.memoryUsage().heapTotal,
            architecture: os.arch(),
            o_s_name: os.type(),
            o_s_version: os.release(),
            ip_address: this.getIpAddresses(),
            machine_name: os.hostname(),
            runtime_version: process.version,
            data: {
                loadavg: os.loadavg(),
                platform: os.platform(),
                tmpdir: os.tmpdir(),
                uptime: os.uptime()
            }
        };
        if (os.endianness) {
            environmentInfo.data.endianness = os.endianness();
        }
        return environmentInfo;
    };
    NodeEnvironmentInfoCollector.prototype.getIpAddresses = function () {
        var ips = [];
        var interfaces = os.networkInterfaces();
        Object.keys(interfaces).forEach(function (name) {
            interfaces[name].forEach(function (iface) {
                if ('IPv4' === iface.family && !iface.internal) {
                    ips.push(iface.address);
                }
            });
        });
        return ips.join(', ');
    };
    return NodeEnvironmentInfoCollector;
})();
exports.NodeEnvironmentInfoCollector = NodeEnvironmentInfoCollector;
var nodestacktrace = require('stack-trace');
var NodeErrorParser = (function () {
    function NodeErrorParser() {
    }
    NodeErrorParser.prototype.parse = function (context, exception) {
        if (!nodestacktrace) {
            throw new Error('Unable to load the stack trace library.');
        }
        var stackFrames = nodestacktrace.parse(exception) || [];
        var error = {
            message: exception.message,
            stack_trace: this.getStackFrames(context, stackFrames)
        };
        context.event.data['@error'] = error;
    };
    NodeErrorParser.prototype.getStackFrames = function (context, stackFrames) {
        var frames = [];
        for (var index = 0; index < stackFrames.length; index++) {
            var frame = stackFrames[index];
            frames.push({
                name: frame.getMethodName() || frame.getFunctionName(),
                file_name: frame.getFileName(),
                line_number: frame.getLineNumber(),
                column: frame.getColumnNumber(),
                declaring_type: frame.getTypeName(),
                data: {
                    is_native: frame.isNative() || (!!frame.filename && frame.filename[0] !== '/' && frame.filename[0] !== '.')
                }
            });
        }
        return frames;
    };
    return NodeErrorParser;
})();
exports.NodeErrorParser = NodeErrorParser;
var NodeRequestInfoCollector = (function () {
    function NodeRequestInfoCollector() {
    }
    NodeRequestInfoCollector.prototype.getRequestInfo = function (context) {
        if (!context.contextData['@request']) {
            return null;
        }
        var request = context.contextData['@request'];
        var ri = {
            client_ip_address: request.ip,
            user_agent: request.headers['user-agent'],
            is_secure: request.secure,
            http_method: request.method,
            host: request.hostname || request.host,
            path: request.path,
            post_data: request.body,
            cookies: Utils.getCookies((request || {}).headers['cookie'], '; '),
            query_string: request.params
        };
        return ri;
    };
    return NodeRequestInfoCollector;
})();
exports.NodeRequestInfoCollector = NodeRequestInfoCollector;
var SubmissionClientBase = (function () {
    function SubmissionClientBase() {
    }
    SubmissionClientBase.prototype.submit = function (events, config, callback) {
        return this.sendRequest('POST', config.serverUrl, '/api/v2/events', config.apiKey, Utils.stringify(events), function (status, message, data) {
            callback(new SubmissionResponse(status, message));
        });
    };
    SubmissionClientBase.prototype.submitDescription = function (referenceId, description, config, callback) {
        var path = "/api/v2/events/by-ref/" + encodeURIComponent(referenceId) + "/user-description";
        return this.sendRequest('POST', config.serverUrl, path, config.apiKey, Utils.stringify(description), function (status, message, data) {
            callback(new SubmissionResponse(status, message));
        });
    };
    SubmissionClientBase.prototype.getSettings = function (config, callback) {
        return this.sendRequest('GET', config.serverUrl, '/api/v2/projects/config', config.apiKey, null, function (status, message, data) {
            if (status !== 200) {
                return callback(new SettingsResponse(false, null, -1, null, message));
            }
            var settings;
            try {
                settings = JSON.parse(data);
            }
            catch (e) {
                config.log.error("Unable to parse settings: '" + data + "'");
            }
            if (!settings || !settings.settings || !settings.version) {
                return callback(new SettingsResponse(false, null, -1, null, 'Invalid configuration settings.'));
            }
            callback(new SettingsResponse(true, settings.settings, settings.version));
        });
    };
    SubmissionClientBase.prototype.sendRequest = function (method, host, path, data, apiKey, callback) {
        callback(500, 'Not Implemented');
    };
    return SubmissionClientBase;
})();
exports.SubmissionClientBase = SubmissionClientBase;
var https = require('https');
var url = require('url');
var NodeSubmissionClient = (function (_super) {
    __extends(NodeSubmissionClient, _super);
    function NodeSubmissionClient() {
        _super.apply(this, arguments);
    }
    NodeSubmissionClient.prototype.sendRequest = function (method, host, path, apiKey, data, callback) {
        function complete(response, data) {
            var message;
            if (response.statusCode === 0) {
                message = 'Unable to connect to server.';
            }
            else if (response.statusCode < 200 || response.statusCode > 299) {
                message = response.statusMessage || response.message;
            }
            callback(response.statusCode || 500, message, data);
        }
        var parsedHost = url.parse(host);
        var options = {
            auth: "client:" + apiKey,
            hostname: parsedHost.hostname,
            method: method,
            port: parsedHost.port && parseInt(parsedHost.port),
            path: path
        };
        if (method === 'POST') {
            options.headers = {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            };
        }
        var request = https.request(options, function (response) {
            var body = '';
            response.on('data', function (chunk) { return body += chunk; });
            response.on('end', function () {
                complete(response, body);
            });
        });
        request.on('error', function (e) {
            callback(500, e.message);
        });
        request.write(data);
        request.end();
    };
    return NodeSubmissionClient;
})(SubmissionClientBase);
exports.NodeSubmissionClient = NodeSubmissionClient;
var NodeBootstrapper = (function () {
    function NodeBootstrapper() {
    }
    NodeBootstrapper.prototype.register = function () {
        var _this = this;
        if (!(typeof window === 'undefined' && typeof global !== 'undefined' && {}.toString.call(global) === '[object global]')) {
            return;
        }
        var configDefaults = Configuration.defaults;
        configDefaults.environmentInfoCollector = new NodeEnvironmentInfoCollector();
        configDefaults.errorParser = new NodeErrorParser();
        configDefaults.requestInfoCollector = new NodeRequestInfoCollector();
        configDefaults.submissionClient = new NodeSubmissionClient();
        process.on('uncaughtException', function (error) {
            ExceptionlessClient.default.submitUnhandledException(error, 'uncaughtException');
        });
        process.on('beforeExit', function (code) {
            var client = ExceptionlessClient.default;
            var message = _this.getExitCodeReason(code);
            if (message !== null) {
                client.submitLog('beforeExit', message, 'Error');
            }
            client.config.queue.process();
        });
    };
    NodeBootstrapper.prototype.getExitCodeReason = function (code) {
        if (code === 1) {
            return 'Uncaught Fatal Exception';
        }
        if (code === 3) {
            return 'Internal JavaScript Parse Error';
        }
        if (code === 4) {
            return 'Internal JavaScript Evaluation Failure';
        }
        if (code === 5) {
            return 'Fatal Exception';
        }
        if (code === 6) {
            return 'Non-function Internal Exception Handler ';
        }
        if (code === 7) {
            return 'Internal Exception Handler Run-Time Failure';
        }
        if (code === 8) {
            return 'Uncaught Exception';
        }
        if (code === 9) {
            return 'Invalid Argument';
        }
        if (code === 10) {
            return 'Internal JavaScript Run-Time Failure';
        }
        if (code === 12) {
            return 'Invalid Debug Argument';
        }
        if (code > 128) {
            return 'Signal Exits';
        }
        return null;
    };
    return NodeBootstrapper;
})();
exports.NodeBootstrapper = NodeBootstrapper;
var WebErrorParser = (function () {
    function WebErrorParser() {
    }
    WebErrorParser.prototype.parse = function (context, exception) {
        var stackTrace = !!context.contextData['@@_TraceKit.StackTrace']
            ? context.contextData['@@_TraceKit.StackTrace']
            : TraceKit.computeStackTrace(exception, 25);
        if (!stackTrace) {
            throw new Error('Unable to parse the exceptions stack trace.');
        }
        var error = {
            type: stackTrace.name,
            message: stackTrace.message || exception.message,
            stack_trace: this.getStackFrames(context, stackTrace.stack || [])
        };
        context.event.data['@error'] = error;
    };
    WebErrorParser.prototype.getStackFrames = function (context, stackFrames) {
        var frames = [];
        for (var index = 0; index < stackFrames.length; index++) {
            var frame = stackFrames[index];
            var parseResult = Utils.parseFunctionName(frame.func);
            frames.push({
                declaring_namespace: parseResult.declaring_namespace,
                declaring_type: parseResult.declaring_type,
                name: parseResult.name,
                parameters: this.getParameters(frame.args),
                file_name: frame.url,
                line_number: frame.line,
                column: frame.column,
                data: {
                    '@@original_name': frame.func
                }
            });
        }
        return frames;
    };
    WebErrorParser.prototype.getParameters = function (parameters) {
        var params = (typeof parameters === 'string' ? [parameters] : parameters) || [];
        var result = [];
        for (var index = 0; index < params.length; index++) {
            result.push({ name: params[index] });
        }
        return result;
    };
    return WebErrorParser;
})();
exports.WebErrorParser = WebErrorParser;
var WebModuleCollector = (function () {
    function WebModuleCollector() {
    }
    WebModuleCollector.prototype.getModules = function (context) {
        if (document && document.getElementsByTagName) {
            return null;
        }
        var modules = [];
        var scripts = document.getElementsByTagName('script');
        if (scripts && scripts.length > 0) {
            for (var index = 0; index < scripts.length; index++) {
                if (scripts[index].src) {
                    modules.push({
                        module_id: index,
                        name: scripts[index].src,
                        version: Utils.parseVersion(scripts[index].src)
                    });
                }
                else if (!!scripts[index].innerHTML) {
                    modules.push({
                        module_id: index,
                        name: 'Script Tag',
                        version: Utils.getHashCode(scripts[index].innerHTML)
                    });
                }
            }
        }
        return modules;
    };
    return WebModuleCollector;
})();
exports.WebModuleCollector = WebModuleCollector;
var WebRequestInfoCollector = (function () {
    function WebRequestInfoCollector() {
    }
    WebRequestInfoCollector.prototype.getRequestInfo = function (context) {
        if (!document || !navigator || !location) {
            return null;
        }
        var requestInfo = {
            user_agent: navigator.userAgent,
            is_secure: location.protocol === 'https:',
            host: location.hostname,
            port: location.port && location.port !== '' ? parseInt(location.port) : 80,
            path: location.pathname,
            cookies: Utils.getCookies(document.cookie, ', '),
            query_string: Utils.parseQueryString(location.search.substring(1))
        };
        if (document.referrer && document.referrer !== '') {
            requestInfo.referrer = document.referrer;
        }
    };
    return WebRequestInfoCollector;
})();
exports.WebRequestInfoCollector = WebRequestInfoCollector;
var DefaultSubmissionClient = (function (_super) {
    __extends(DefaultSubmissionClient, _super);
    function DefaultSubmissionClient() {
        _super.apply(this, arguments);
    }
    DefaultSubmissionClient.prototype.createRequest = function (method, url) {
        var xhr = new XMLHttpRequest();
        if ('withCredentials' in xhr) {
            xhr.open(method, url, true);
        }
        else if (typeof XDomainRequest != 'undefined') {
            xhr = new XDomainRequest();
            xhr.open(method, url);
        }
        else {
            xhr = null;
        }
        if (xhr) {
            if (method === 'POST' && xhr.setRequestHeader) {
                xhr.setRequestHeader('Content-Type', 'application/json');
            }
            xhr.timeout = 10000;
        }
        return xhr;
    };
    DefaultSubmissionClient.prototype.sendRequest = function (method, host, path, apiKey, data, callback) {
        var isCompleted = false;
        function complete(xhr) {
            if (isCompleted) {
                return;
            }
            else {
                isCompleted = true;
            }
            var message;
            if (xhr.status === 0) {
                message = 'Unable to connect to server.';
            }
            else if (xhr.status < 200 || xhr.status > 299) {
                if (!!xhr.responseBody && !!xhr.responseBody.message) {
                    message = xhr.responseBody.message;
                }
                else if (!!xhr.responseText && xhr.responseText.indexOf('message') !== -1) {
                    try {
                        message = JSON.parse(xhr.responseText).message;
                    }
                    catch (e) {
                        message = xhr.responseText;
                    }
                }
                else {
                    message = xhr.statusText;
                }
            }
            callback(xhr.status || 500, message, xhr.responseText);
        }
        var url = "" + host + path + "?access_token=" + encodeURIComponent(apiKey);
        var xhr = this.createRequest(method || 'POST', url);
        if (!xhr) {
            return callback(503, 'CORS not supported.');
        }
        if ('withCredentials' in xhr) {
            xhr.onreadystatechange = function () {
                if (xhr.readyState !== 4) {
                    return;
                }
                complete(xhr);
            };
        }
        xhr.ontimeout = function () { return complete(xhr); };
        xhr.onerror = function () { return complete(xhr); };
        xhr.onload = function () { return complete(xhr); };
        xhr.send(data);
    };
    return DefaultSubmissionClient;
})(SubmissionClientBase);
exports.DefaultSubmissionClient = DefaultSubmissionClient;
var WindowBootstrapper = (function () {
    function WindowBootstrapper() {
    }
    WindowBootstrapper.prototype.register = function () {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
        }
        var configDefaults = Configuration.defaults;
        var settings = this.getDefaultsSettingsFromScriptTag();
        if (settings && (settings.apiKey || settings.serverUrl)) {
            configDefaults.apiKey = settings.apiKey;
            configDefaults.serverUrl = settings.serverUrl;
        }
        configDefaults.errorParser = new WebErrorParser();
        configDefaults.moduleCollector = new WebModuleCollector();
        configDefaults.requestInfoCollector = new WebRequestInfoCollector();
        configDefaults.submissionClient = new DefaultSubmissionClient();
        TraceKit.report.subscribe(this.processUnhandledException);
        TraceKit.extendToAsynchronousCallbacks();
        if (typeof $ !== 'undefined' && $(document)) {
            $(document).ajaxError(this.processJQueryAjaxError);
        }
    };
    WindowBootstrapper.prototype.getDefaultsSettingsFromScriptTag = function () {
        if (!document || !document.getElementsByTagName) {
            return null;
        }
        var scripts = document.getElementsByTagName('script');
        for (var index = 0; index < scripts.length; index++) {
            if (scripts[index].src && scripts[index].src.indexOf('/exceptionless') > -1) {
                return Utils.parseQueryString(scripts[index].src.split('?').pop());
            }
        }
        return null;
    };
    WindowBootstrapper.prototype.processUnhandledException = function (stackTrace, options) {
        var builder = ExceptionlessClient.default.createUnhandledException(new Error(stackTrace.message || (options || {}).status || 'Script error'), 'onerror');
        builder.pluginContextData['@@_TraceKit.StackTrace'] = stackTrace;
        builder.submit();
    };
    WindowBootstrapper.prototype.processJQueryAjaxError = function (event, xhr, settings, error) {
        var client = ExceptionlessClient.default;
        if (xhr.status === 404) {
            client.submitNotFound(settings.url);
        }
        else if (xhr.status !== 401) {
            client.createUnhandledException(error, 'JQuery.ajaxError')
                .setSource(settings.url)
                .setProperty('status', xhr.status)
                .setProperty('request', settings.data)
                .setProperty('response', xhr.responseText && xhr.responseText.slice ? xhr.responseText.slice(0, 1024) : undefined)
                .submit();
        }
    };
    return WindowBootstrapper;
})();
exports.WindowBootstrapper = WindowBootstrapper;
new NodeBootstrapper().register();
new WindowBootstrapper().register();
Error.stackTraceLimit = Infinity;

return exports;

}));


//# sourceMappingURL=exceptionless.js.map