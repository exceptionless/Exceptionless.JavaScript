/*
 TraceKit - Cross brower stack traces - github.com/csnover/TraceKit
 MIT license
*/

(function(window, undefined) {
if (!window) {
    return;
}

var TraceKit = {};
var _oldTraceKit = window.TraceKit;

// global reference to slice
var _slice = [].slice;
var UNKNOWN_FUNCTION = '?';


/**
 * _has, a better form of hasOwnProperty
 * Example: _has(MainHostObject, property) === true/false
 *
 * @param {Object} object to check property
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
    function notifyHandlers(stack, isWindowError) {
        var exception = null;
        if (isWindowError && !TraceKit.collectWindowErrors) {
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
     * @param {?(number|string)} columnNo The column number at which the error
     * occurred.
     * @param {?Error} errorObj The actual Error object.
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
        if (typeof url !== 'string') {
            return [];
        }

        if (!_has(sourceCache, url)) {
            // URL needs to be able to fetched within the acceptable domain.  Otherwise,
            // cross-domain errors will be triggered.
            var source = '';

            url = url || '';
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
    // ex.columnNumber = 69
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
     * @param {Error} ex
     * @return {?Object.<string, *>} Stack trace information.
     */
    function computeStackTraceFromStackProp(ex) {
        if (!ex.stack) {
            return null;
        }

        var chrome = /^\s*at (.*?) ?\(?((?:file|https?|chrome-extension):.*?):(\d+)(?::(\d+))?\)?\s*$/i,
            gecko = /^\s*(.*?)(?:\((.*?)\))?@?((?:file|https?|chrome):.*?):(\d+)(?::(\d+))?\s*$/i,
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

        if (!stack.length) {
            return null;
        }

        if (stack[0] && stack[0].line && !stack[0].column && reference) {
            stack[0].column = findSourceInLine(reference[1], stack[0].url, stack[0].line);
        } else if (!stack[0].column && !_isUndefined(ex.columnNumber)) {
            // FireFox uses this awesome columnNumber property for its top frame
            // Also note, Firefox's column number is 0-based and everything else expects 1-based,
            // so adding 1
            stack[0].column = ex.columnNumber + 1;
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

        var lineRE1 = /^\s*Line (\d+) of linked script ((?:file|https?)\S+)(?:: in function (\S+))?\s*$/i,
            lineRE2 = /^\s*Line (\d+) of inline#(\d+) script in ((?:file|https?)\S+)(?:: in function (\S+))?\s*$/i,
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
                item.func = parts.input.substring(0, parts.input.indexOf('{'));
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
    computeStackTrace.getSource = getSource;

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

}(typeof window !== 'undefined' ? window : global));


(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require, exports, module);
  } else {
    root.exceptionless = factory();
  }
}(this, function(require, exports, module) {
if (!exports) {
	var exports = {};
}


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
        return this['@@_Exception'] || null;
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
        if (method) {
            this['@@_SubmissionMethod'] = method;
        }
    };
    ContextData.prototype.getSubmissionMethod = function () {
        return this['@@_SubmissionMethod'] || null;
    };
    return ContextData;
})();
exports.ContextData = ContextData;
var SettingsManager = (function () {
    function SettingsManager() {
    }
    SettingsManager.changed = function (config) {
        var handlers = this._handlers;
        for (var index = 0; index < handlers.length; index++) {
            handlers[index](config);
        }
    };
    SettingsManager.onChanged = function (handler) {
        !!handler && this._handlers.push(handler);
    };
    SettingsManager.applySavedServerSettings = function (config) {
        config.log.info('Applying saved settings.');
        config.settings = Utils.merge(config.settings, this.getSavedServerSettings(config));
        this.changed(config);
    };
    SettingsManager.getSavedServerSettings = function (config) {
        return config.storage.get(this._configPath) || {};
    };
    SettingsManager.checkVersion = function (version, config) {
        if (version) {
            var savedConfigVersion = parseInt(config.storage.get(this._configPath + "-version"));
            if (isNaN(savedConfigVersion) || version > savedConfigVersion) {
                config.log.info("Updating settings from v" + (!isNaN(savedConfigVersion) ? savedConfigVersion : 0) + " to v" + version);
                this.updateSettings(config);
            }
        }
    };
    SettingsManager.updateSettings = function (config) {
        var _this = this;
        if (!config.isValid) {
            config.log.error('Unable to update settings: ApiKey is not set.');
            return;
        }
        config.submissionClient.getSettings(config, function (response) {
            if (!response || !response.success || !response.settings) {
                return;
            }
            config.settings = Utils.merge(config.settings, response.settings);
            var savedServerSettings = SettingsManager.getSavedServerSettings(config);
            for (var key in savedServerSettings) {
                if (response.settings[key]) {
                    continue;
                }
                delete config.settings[key];
            }
            var path = SettingsManager._configPath;
            config.storage.save(path + "-version", response.settingsVersion);
            config.storage.save(path, response.settings);
            config.log.info('Updated settings');
            _this.changed(config);
        });
    };
    SettingsManager._configPath = 'ex-server-settings.json';
    SettingsManager._handlers = [];
    return SettingsManager;
})();
exports.SettingsManager = SettingsManager;
var DefaultLastReferenceIdManager = (function () {
    function DefaultLastReferenceIdManager() {
        this._lastReferenceId = null;
    }
    DefaultLastReferenceIdManager.prototype.getLast = function () {
        return this._lastReferenceId;
    };
    DefaultLastReferenceIdManager.prototype.clearLast = function () {
        this._lastReferenceId = null;
    };
    DefaultLastReferenceIdManager.prototype.setLast = function (eventId) {
        this._lastReferenceId = eventId;
    };
    return DefaultLastReferenceIdManager;
})();
exports.DefaultLastReferenceIdManager = DefaultLastReferenceIdManager;
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
                    context.log.error("Error running plugin '" + plugin.name + "': " + ex.message + ". Discarding Event.");
                }
                if (context.cancelled && !!callback) {
                    callback(context);
                }
            };
        };
        var plugins = context.client.config.plugins;
        var wrappedPlugins = [];
        if (!!callback) {
            wrappedPlugins[plugins.length] = wrap({ name: 'cb', priority: 9007199254740992, run: callback }, null);
        }
        for (var index = plugins.length - 1; index > -1; index--) {
            wrappedPlugins[index] = wrap(plugins[index], !!callback || (index < plugins.length - 1) ? wrappedPlugins[index + 1] : null);
        }
        wrappedPlugins[0]();
    };
    EventPluginManager.addDefaultPlugins = function (config) {
        config.addPlugin(new ConfigurationDefaultsPlugin());
        config.addPlugin(new ErrorPlugin());
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
        next && next();
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
        var config = this._config;
        this.ensureQueueTimer();
        if (this.areQueuedItemsDiscarded()) {
            config.log.info('Queue items are currently being discarded. The event will not be queued.');
            return;
        }
        var key = "ex-q-" + new Date().toJSON() + "-" + Utils.randomNumber();
        config.log.info("Enqueuing event: " + key + " type=" + event.type + " " + (!!event.reference_id ? 'refid=' + event.reference_id : ''));
        config.storage.save(key, event);
    };
    DefaultEventQueue.prototype.process = function () {
        var _this = this;
        function getEvents(events) {
            var items = [];
            for (var index = 0; index < events.length; index++) {
                items.push(events[index].value);
            }
            return items;
        }
        var queueNotProcessed = 'The queue will not be processed.';
        var config = this._config;
        var log = config.log;
        this.ensureQueueTimer();
        if (this._processingQueue) {
            return;
        }
        log.info('Processing queue...');
        if (!config.enabled) {
            log.info("Configuration is disabled. " + queueNotProcessed);
            return;
        }
        if (!config.isValid) {
            log.info("Invalid Api Key. " + queueNotProcessed);
            return;
        }
        this._processingQueue = true;
        try {
            var events = config.storage.getList('ex-q', config.submissionBatchSize);
            if (!events || events.length == 0) {
                this._processingQueue = false;
                return;
            }
            log.info("Sending " + events.length + " events to " + config.serverUrl + ".");
            config.submissionClient.postEvents(getEvents(events), config, function (response) {
                _this.processSubmissionResponse(response, events);
                log.info('Finished processing queue.');
                _this._processingQueue = false;
            });
        }
        catch (ex) {
            log.error("Error processing queue: " + ex);
            this.suspendProcessing();
            this._processingQueue = false;
        }
    };
    DefaultEventQueue.prototype.processSubmissionResponse = function (response, events) {
        var noSubmission = 'The event will not be submitted.';
        var config = this._config;
        var log = config.log;
        if (response.success) {
            log.info("Sent " + events.length + " events.");
            this.removeEvents(events);
            return;
        }
        if (response.serviceUnavailable) {
            log.error('Server returned service unavailable.');
            this.suspendProcessing();
            return;
        }
        if (response.paymentRequired) {
            log.info('Too many events have been submitted, please upgrade your plan.');
            this.suspendProcessing(null, true, true);
            return;
        }
        if (response.unableToAuthenticate) {
            log.info("Unable to authenticate, please check your configuration. " + noSubmission);
            this.suspendProcessing(15);
            this.removeEvents(events);
            return;
        }
        if (response.notFound || response.badRequest) {
            log.error("Error while trying to submit data: " + response.message);
            this.suspendProcessing(60 * 4);
            this.removeEvents(events);
            return;
        }
        if (response.requestEntityTooLarge) {
            var message = 'Event submission discarded for being too large.';
            if (config.submissionBatchSize > 1) {
                log.error(message + " Retrying with smaller batch size.");
                config.submissionBatchSize = Math.max(1, Math.round(config.submissionBatchSize / 1.5));
            }
            else {
                log.error(message + " " + noSubmission);
                this.removeEvents(events);
            }
            return;
        }
        if (!response.success) {
            log.error("Error submitting events: " + (response.message || 'Please check the network tab for more info.'));
            this.suspendProcessing();
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
        var config = this._config;
        if (!durationInMinutes || durationInMinutes <= 0) {
            durationInMinutes = 5;
        }
        config.log.info("Suspending processing for " + durationInMinutes + " minutes.");
        this._suspendProcessingUntil = new Date(new Date().getTime() + (durationInMinutes * 60000));
        if (discardFutureQueuedItems) {
            this._discardQueuedItemsUntil = new Date(new Date().getTime() + (durationInMinutes * 60000));
        }
        if (clearQueue) {
            this.removeEvents(config.storage.getList('ex-q'));
        }
    };
    DefaultEventQueue.prototype.removeEvents = function (events) {
        for (var index = 0; index < (events || []).length; index++) {
            this._config.storage.remove(events[index].path);
        }
    };
    DefaultEventQueue.prototype.isQueueProcessingSuspended = function () {
        return this._suspendProcessingUntil && this._suspendProcessingUntil > new Date();
    };
    DefaultEventQueue.prototype.areQueuedItemsDiscarded = function () {
        return this._discardQueuedItemsUntil && this._discardQueuedItemsUntil > new Date();
    };
    return DefaultEventQueue;
})();
exports.DefaultEventQueue = DefaultEventQueue;
var InMemoryStorage = (function () {
    function InMemoryStorage(maxItems) {
        this._items = [];
        this._maxItems = maxItems > 0 ? maxItems : 250;
    }
    InMemoryStorage.prototype.save = function (path, value) {
        if (!path || !value) {
            return false;
        }
        this.remove(path);
        if (this._items.push({ created: new Date().getTime(), path: path, value: value }) > this._maxItems) {
            this._items.shift();
        }
        return true;
    };
    InMemoryStorage.prototype.get = function (path) {
        var item = path ? this.getList("^" + path + "$", 1)[0] : null;
        return item ? item.value : null;
    };
    InMemoryStorage.prototype.getList = function (searchPattern, limit) {
        var items = this._items;
        if (!searchPattern) {
            return items.slice(0, limit);
        }
        var regex = new RegExp(searchPattern);
        var results = [];
        for (var index = 0; index < items.length; index++) {
            if (regex.test(items[index].path)) {
                results.push(items[index]);
                if (results.length >= limit) {
                    break;
                }
            }
        }
        return results;
    };
    InMemoryStorage.prototype.remove = function (path) {
        if (path) {
            var item = this.getList("^" + path + "$", 1)[0];
            if (item) {
                this._items.splice(this._items.indexOf(item), 1);
            }
        }
    };
    return InMemoryStorage;
})();
exports.InMemoryStorage = InMemoryStorage;
var Utils = (function () {
    function Utils() {
    }
    Utils.addRange = function (target) {
        var values = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
        }
        if (!target) {
            target = [];
        }
        if (!values || values.length === 0) {
            return target;
        }
        for (var index = 0; index < values.length; index++) {
            if (values[index] && target.indexOf(values[index]) < 0) {
                target.push(values[index]);
            }
        }
        return target;
    };
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
    Utils.getCookies = function (cookies) {
        var result = {};
        var parts = (cookies || '').split('; ');
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
    Utils.stringify = function (data, exclusions) {
        function checkForMatch(pattern, value) {
            if (!pattern || !value || typeof value !== 'string') {
                return false;
            }
            var trim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
            pattern = pattern.toLowerCase().replace(trim, '');
            value = value.toLowerCase().replace(trim, '');
            if (pattern.length <= 0) {
                return false;
            }
            var startsWithWildcard = pattern[0] === '*';
            if (startsWithWildcard) {
                pattern = pattern.slice(1);
            }
            var endsWithWildcard = pattern[pattern.length - 1] === '*';
            if (endsWithWildcard) {
                pattern = pattern.substring(0, pattern.length - 1);
            }
            if (startsWithWildcard && endsWithWildcard)
                return value.indexOf(pattern) !== -1;
            if (startsWithWildcard)
                return value.lastIndexOf(pattern, 0) !== -1;
            if (endsWithWildcard)
                return value.lastIndexOf(pattern) === (value.length - pattern.length);
            return value === pattern;
        }
        function stringifyImpl(data, exclusions) {
            var cache = [];
            return JSON.stringify(data, function (key, value) {
                for (var index = 0; index < (exclusions || []).length; index++) {
                    if (checkForMatch(exclusions[index], key)) {
                        return;
                    }
                }
                if (typeof value === 'object' && !!value) {
                    if (cache.indexOf(value) !== -1) {
                        return;
                    }
                    cache.push(value);
                }
                return value;
            });
        }
        if (({}).toString.call(data) === '[object Array]') {
            var result = [];
            for (var index = 0; index < data.length; index++) {
                result[index] = JSON.parse(stringifyImpl(data[index], exclusions || []));
            }
            return JSON.stringify(result);
        }
        return stringifyImpl(data, exclusions || []);
    };
    return Utils;
})();
exports.Utils = Utils;
var Configuration = (function () {
    function Configuration(configSettings) {
        this.defaultTags = [];
        this.defaultData = {};
        this.enabled = true;
        this.lastReferenceIdManager = new DefaultLastReferenceIdManager();
        this.settings = {};
        this._serverUrl = 'https://collector.exceptionless.io';
        this._dataExclusions = [];
        this._plugins = [];
        function inject(fn) {
            return typeof fn === 'function' ? fn(this) : fn;
        }
        configSettings = Utils.merge(Configuration.defaults, configSettings);
        this.log = inject(configSettings.log) || new NullLog();
        this.apiKey = configSettings.apiKey;
        this.serverUrl = configSettings.serverUrl;
        this.environmentInfoCollector = inject(configSettings.environmentInfoCollector);
        this.errorParser = inject(configSettings.errorParser);
        this.lastReferenceIdManager = inject(configSettings.lastReferenceIdManager) || new DefaultLastReferenceIdManager();
        this.moduleCollector = inject(configSettings.moduleCollector);
        this.requestInfoCollector = inject(configSettings.requestInfoCollector);
        this.submissionBatchSize = inject(configSettings.submissionBatchSize) || 50;
        this.submissionClient = inject(configSettings.submissionClient);
        this.storage = inject(configSettings.storage) || new InMemoryStorage();
        this.queue = inject(configSettings.queue) || new DefaultEventQueue(this);
        SettingsManager.applySavedServerSettings(this);
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
    Object.defineProperty(Configuration.prototype, "isValid", {
        get: function () {
            return !!this.apiKey && this.apiKey.length >= 10;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "serverUrl", {
        get: function () {
            return this._serverUrl;
        },
        set: function (value) {
            if (!!value) {
                this._serverUrl = value;
                this.log.info("serverUrl: " + this._serverUrl);
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Configuration.prototype, "dataExclusions", {
        get: function () {
            var exclusions = this.settings['@@DataExclusions'];
            return this._dataExclusions.concat(exclusions && exclusions.split(',') || []);
        },
        enumerable: true,
        configurable: true
    });
    Configuration.prototype.addDataExclusions = function () {
        var exclusions = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            exclusions[_i - 0] = arguments[_i];
        }
        this._dataExclusions = Utils.addRange.apply(Utils, [this._dataExclusions].concat(exclusions));
    };
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
            this.log.error('Add plugin failed: Run method not defined');
            return;
        }
        if (!plugin.name) {
            plugin.name = Utils.guid();
        }
        if (!plugin.priority) {
            plugin.priority = 0;
        }
        var pluginExists = false;
        var plugins = this._plugins;
        for (var index = 0; index < plugins.length; index++) {
            if (plugins[index].name === plugin.name) {
                pluginExists = true;
                break;
            }
        }
        if (!pluginExists) {
            plugins.push(plugin);
        }
    };
    Configuration.prototype.removePlugin = function (pluginOrName) {
        var name = typeof pluginOrName === 'string' ? pluginOrName : pluginOrName.name;
        if (!name) {
            this.log.error('Remove plugin failed: Plugin name not defined');
            return;
        }
        var plugins = this._plugins;
        for (var index = 0; index < plugins.length; index++) {
            if (plugins[index].name === name) {
                plugins.splice(index, 1);
                break;
            }
        }
    };
    Configuration.prototype.setVersion = function (version) {
        if (!!version) {
            this.defaultData['@version'] = version;
        }
    };
    Configuration.prototype.setUserIdentity = function (userInfoOrIdentity, name) {
        var USER_KEY = '@user';
        var userInfo = typeof userInfoOrIdentity !== 'string' ? userInfoOrIdentity : { identity: userInfoOrIdentity, name: name };
        var shouldRemove = !userInfo || (!userInfo.identity && !userInfo.name);
        if (shouldRemove) {
            delete this.defaultData[USER_KEY];
        }
        else {
            this.defaultData[USER_KEY] = userInfo;
        }
        this.log.info("user identity: " + (shouldRemove ? 'null' : userInfo.identity));
    };
    Object.defineProperty(Configuration.prototype, "userAgent", {
        get: function () {
            return 'exceptionless-js/0.9.1';
        },
        enumerable: true,
        configurable: true
    });
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
        this._validIdentifierErrorMessage = "must contain between 8 and 100 alphanumeric or '-' characters.";
        this.target = event;
        this.client = client;
        this.pluginContextData = pluginContextData || new ContextData();
    }
    EventBuilder.prototype.setType = function (type) {
        if (!!type) {
            this.target.type = type;
        }
        return this;
    };
    EventBuilder.prototype.setSource = function (source) {
        if (!!source) {
            this.target.source = source;
        }
        return this;
    };
    EventBuilder.prototype.setSessionId = function (sessionId) {
        if (!this.isValidIdentifier(sessionId)) {
            throw new Error("SessionId " + this._validIdentifierErrorMessage);
        }
        this.target.session_id = sessionId;
        return this;
    };
    EventBuilder.prototype.setReferenceId = function (referenceId) {
        if (!this.isValidIdentifier(referenceId)) {
            throw new Error("ReferenceId " + this._validIdentifierErrorMessage);
        }
        this.target.reference_id = referenceId;
        return this;
    };
    EventBuilder.prototype.setMessage = function (message) {
        if (!!message) {
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
        this.target.tags = Utils.addRange.apply(Utils, [this.target.tags].concat(tags));
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
        if (!value) {
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
var ExceptionlessClient = (function () {
    function ExceptionlessClient(settingsOrApiKey, serverUrl) {
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
        if (message && level) {
            builder = builder.setSource(sourceOrMessage).setMessage(message).setProperty('@level', level);
        }
        else if (message) {
            builder = builder.setSource(sourceOrMessage).setMessage(message);
        }
        else {
            var caller = arguments.callee.caller;
            builder = builder.setSource(caller && caller.name).setMessage(sourceOrMessage);
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
        function cancelled() {
            if (!!context) {
                context.cancelled = true;
            }
            return !!callback && callback(context);
        }
        if (!event) {
            return cancelled();
        }
        if (!this.config.enabled) {
            this.config.log.info('Event submission is currently disabled.');
            return cancelled();
        }
        if (!event.data) {
            event.data = {};
        }
        if (!event.tags || !event.tags.length) {
            event.tags = [];
        }
        var context = new EventPluginContext(this, event, pluginContextData);
        EventPluginManager.run(context, function (context) {
            var ev = context.event;
            if (!context.cancelled) {
                if (!ev.type || ev.type.length === 0) {
                    ev.type = 'log';
                }
                if (!ev.date) {
                    ev.date = new Date();
                }
                var config = context.client.config;
                config.queue.enqueue(ev);
                if (ev.reference_id && ev.reference_id.length > 0) {
                    context.log.info("Setting last reference id '" + ev.reference_id + "'");
                    config.lastReferenceIdManager.setLast(ev.reference_id);
                }
            }
            !!callback && callback(context);
        });
    };
    ExceptionlessClient.prototype.updateUserEmailAndDescription = function (referenceId, email, description, callback) {
        var _this = this;
        if (!referenceId || !email || !description || !this.config.enabled) {
            return !!callback && callback(new SubmissionResponse(500, 'cancelled'));
        }
        var userDescription = { email_address: email, description: description };
        var response = this.config.submissionClient.postUserDescription(referenceId, userDescription, this.config, function (response) {
            if (!response.success) {
                _this.config.log.error("Failed to submit user email and description for event '" + referenceId + "': " + response.statusCode + " " + response.message);
            }
            !!callback && callback(response);
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
        next && next();
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
        var ERROR_KEY = '@error';
        var exception = context.contextData.getException();
        if (!!exception) {
            context.event.type = 'error';
            if (!context.event.data[ERROR_KEY]) {
                var parser = context.client.config.errorParser;
                if (!parser) {
                    throw new Error('No error parser was defined.');
                }
                var result = parser.parse(context, exception);
                if (!!result) {
                    context.event.data[ERROR_KEY] = result;
                }
            }
        }
        next && next();
    };
    return ErrorPlugin;
})();
exports.ErrorPlugin = ErrorPlugin;
var ModuleInfoPlugin = (function () {
    function ModuleInfoPlugin() {
        this.priority = 40;
        this.name = 'ModuleInfoPlugin';
    }
    ModuleInfoPlugin.prototype.run = function (context, next) {
        var ERROR_KEY = '@error';
        var collector = context.client.config.moduleCollector;
        if (context.event.data[ERROR_KEY] && !context.event.data['@error'].modules && !!collector) {
            var modules = collector.getModules(context);
            if (modules && modules.length > 0) {
                context.event.data[ERROR_KEY].modules = modules;
            }
        }
        next && next();
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
        var REQUEST_KEY = '@request';
        var collector = context.client.config.requestInfoCollector;
        if (!context.event.data[REQUEST_KEY] && !!collector) {
            var requestInfo = collector.getRequestInfo(context);
            if (!!requestInfo) {
                context.event.data[REQUEST_KEY] = requestInfo;
            }
        }
        next && next();
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
        var ENVIRONMENT_KEY = '@environment';
        var collector = context.client.config.environmentInfoCollector;
        if (!context.event.data[ENVIRONMENT_KEY] && collector) {
            var environmentInfo = collector.getEnvironmentInfo(context);
            if (!!environmentInfo) {
                context.event.data[ENVIRONMENT_KEY] = environmentInfo;
            }
        }
        next && next();
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
        next && next();
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
var DefaultErrorParser = (function () {
    function DefaultErrorParser() {
    }
    DefaultErrorParser.prototype.parse = function (context, exception) {
        function getParameters(parameters) {
            var params = (typeof parameters === 'string' ? [parameters] : parameters) || [];
            var result = [];
            for (var index = 0; index < params.length; index++) {
                result.push({ name: params[index] });
            }
            return result;
        }
        function getStackFrames(context, stackFrames) {
            var ANONYMOUS = '<anonymous>';
            var frames = [];
            for (var index = 0; index < stackFrames.length; index++) {
                var frame = stackFrames[index];
                frames.push({
                    name: (frame.func || ANONYMOUS).replace('?', ANONYMOUS),
                    parameters: getParameters(frame.args),
                    file_name: frame.url,
                    line_number: frame.line || 0,
                    column: frame.column || 0
                });
            }
            return frames;
        }
        var TRACEKIT_STACK_TRACE_KEY = '@@_TraceKit.StackTrace';
        var stackTrace = !!context.contextData[TRACEKIT_STACK_TRACE_KEY]
            ? context.contextData[TRACEKIT_STACK_TRACE_KEY]
            : TraceKit.computeStackTrace(exception, 25);
        if (!stackTrace) {
            throw new Error('Unable to parse the exceptions stack trace.');
        }
        return {
            type: stackTrace.name,
            message: stackTrace.message || exception.message,
            stack_trace: getStackFrames(context, stackTrace.stack || [])
        };
    };
    return DefaultErrorParser;
})();
exports.DefaultErrorParser = DefaultErrorParser;
var DefaultModuleCollector = (function () {
    function DefaultModuleCollector() {
    }
    DefaultModuleCollector.prototype.getModules = function (context) {
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
    return DefaultModuleCollector;
})();
exports.DefaultModuleCollector = DefaultModuleCollector;
var DefaultRequestInfoCollector = (function () {
    function DefaultRequestInfoCollector() {
    }
    DefaultRequestInfoCollector.prototype.getRequestInfo = function (context) {
        if (!document || !navigator || !location) {
            return null;
        }
        var requestInfo = {
            user_agent: navigator.userAgent,
            is_secure: location.protocol === 'https:',
            host: location.hostname,
            port: location.port && location.port !== '' ? parseInt(location.port) : 80,
            path: location.pathname,
            cookies: Utils.getCookies(document.cookie),
            query_string: Utils.parseQueryString(location.search.substring(1))
        };
        if (document.referrer && document.referrer !== '') {
            requestInfo.referrer = document.referrer;
        }
        return requestInfo;
    };
    return DefaultRequestInfoCollector;
})();
exports.DefaultRequestInfoCollector = DefaultRequestInfoCollector;
var DefaultSubmissionClient = (function () {
    function DefaultSubmissionClient() {
        this.configurationVersionHeader = 'X-Exceptionless-ConfigVersion';
    }
    DefaultSubmissionClient.prototype.postEvents = function (events, config, callback) {
        var _this = this;
        return this.sendRequest(config, 'POST', '/api/v2/events', Utils.stringify(events, config.dataExclusions), function (status, message, data, headers) {
            var settingsVersion = headers && parseInt(headers[_this.configurationVersionHeader]);
            SettingsManager.checkVersion(settingsVersion, config);
            callback(new SubmissionResponse(status, message));
        });
    };
    DefaultSubmissionClient.prototype.postUserDescription = function (referenceId, description, config, callback) {
        var _this = this;
        var path = "/api/v2/events/by-ref/" + encodeURIComponent(referenceId) + "/user-description";
        return this.sendRequest(config, 'POST', path, Utils.stringify(description, config.dataExclusions), function (status, message, data, headers) {
            var settingsVersion = headers && parseInt(headers[_this.configurationVersionHeader]);
            SettingsManager.checkVersion(settingsVersion, config);
            callback(new SubmissionResponse(status, message));
        });
    };
    DefaultSubmissionClient.prototype.getSettings = function (config, callback) {
        return this.sendRequest(config, 'GET', '/api/v2/projects/config', null, function (status, message, data) {
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
            if (!settings || isNaN(settings.version)) {
                return callback(new SettingsResponse(false, null, -1, null, 'Invalid configuration settings.'));
            }
            callback(new SettingsResponse(true, settings.settings || {}, settings.version));
        });
    };
    DefaultSubmissionClient.prototype.sendRequest = function (config, method, path, data, callback) {
        var TIMEOUT = 'timeout';
        var LOADED = 'loaded';
        var WITH_CREDENTIALS = 'withCredentials';
        var isCompleted = false;
        var useSetTimeout = false;
        function complete(mode, xhr) {
            function parseResponseHeaders(headerStr) {
                var headers = {};
                var headerPairs = (headerStr || '').split('\u000d\u000a');
                for (var index = 0; index < headerPairs.length; index++) {
                    var headerPair = headerPairs[index];
                    var separator = headerPair.indexOf('\u003a\u0020');
                    if (separator > 0) {
                        headers[headerPair.substring(0, separator)] = headerPair.substring(separator + 2);
                    }
                }
                return headers;
            }
            if (isCompleted) {
                return;
            }
            isCompleted = true;
            var message = xhr.statusText;
            var responseText = xhr.responseText;
            var status = xhr.status;
            if (mode === TIMEOUT || status === 0) {
                message = 'Unable to connect to server.';
                status = 0;
            }
            else if (mode === LOADED && !status) {
                status = method === 'POST' ? 202 : 200;
            }
            else if (status < 200 || status > 299) {
                var responseBody = xhr.responseBody;
                if (!!responseBody && !!responseBody.message) {
                    message = responseBody.message;
                }
                else if (!!responseText && responseText.indexOf('message') !== -1) {
                    try {
                        message = JSON.parse(responseText).message;
                    }
                    catch (e) {
                        message = responseText;
                    }
                }
            }
            callback(status || 500, message || '', responseText, parseResponseHeaders(xhr.getAllResponseHeaders && xhr.getAllResponseHeaders()));
        }
        function createRequest(config, method, url) {
            var xhr = new XMLHttpRequest();
            if (WITH_CREDENTIALS in xhr) {
                xhr.open(method, url, true);
                xhr.setRequestHeader('X-Exceptionless-Client', config.userAgent);
                if (method === 'POST') {
                    xhr.setRequestHeader('Content-Type', 'application/json');
                }
            }
            else if (typeof XDomainRequest != 'undefined') {
                useSetTimeout = true;
                xhr = new XDomainRequest();
                xhr.open(method, location.protocol === 'http:' ? url.replace('https:', 'http:') : url);
            }
            else {
                xhr = null;
            }
            if (xhr) {
                xhr.timeout = 10000;
            }
            return xhr;
        }
        var url = "" + config.serverUrl + path + "?access_token=" + encodeURIComponent(config.apiKey);
        var xhr = createRequest(config, method || 'POST', url);
        if (!xhr) {
            return callback(503, 'CORS not supported.');
        }
        if (WITH_CREDENTIALS in xhr) {
            xhr.onreadystatechange = function () {
                if (xhr.readyState !== 4) {
                    return;
                }
                complete(LOADED, xhr);
            };
        }
        xhr.onprogress = function () { };
        xhr.ontimeout = function () { return complete(TIMEOUT, xhr); };
        xhr.onerror = function () { return complete('error', xhr); };
        xhr.onload = function () { return complete(LOADED, xhr); };
        if (useSetTimeout) {
            setTimeout(function () { return xhr.send(data); }, 500);
        }
        else {
            xhr.send(data);
        }
    };
    return DefaultSubmissionClient;
})();
exports.DefaultSubmissionClient = DefaultSubmissionClient;
function getDefaultsSettingsFromScriptTag() {
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
}
function processUnhandledException(stackTrace, options) {
    var builder = ExceptionlessClient.default.createUnhandledException(new Error(stackTrace.message || (options || {}).status || 'Script error'), 'onerror');
    builder.pluginContextData['@@_TraceKit.StackTrace'] = stackTrace;
    builder.submit();
}
function processJQueryAjaxError(event, xhr, settings, error) {
    var client = ExceptionlessClient.default;
    if (xhr.status === 404) {
        client.submitNotFound(settings.url);
    }
    else if (xhr.status !== 401) {
        client.createUnhandledException(error, 'JQuery.ajaxError')
            .setSource(settings.url)
            .setProperty('status', xhr.status)
            .setProperty('request', settings.data)
            .setProperty('response', xhr.responseText && xhr.responseText.slice && xhr.responseText.slice(0, 1024))
            .submit();
    }
}
var defaults = Configuration.defaults;
var settings = getDefaultsSettingsFromScriptTag();
if (settings && (settings.apiKey || settings.serverUrl)) {
    defaults.apiKey = settings.apiKey;
    defaults.serverUrl = settings.serverUrl;
}
defaults.errorParser = new DefaultErrorParser();
defaults.moduleCollector = new DefaultModuleCollector();
defaults.requestInfoCollector = new DefaultRequestInfoCollector();
defaults.submissionClient = new DefaultSubmissionClient();
TraceKit.report.subscribe(processUnhandledException);
TraceKit.extendToAsynchronousCallbacks();
if (typeof $ !== 'undefined' && $(document)) {
    $(document).ajaxError(processJQueryAjaxError);
}
Error.stackTraceLimit = Infinity;

return exports;

}));


//# sourceMappingURL=exceptionless.js.map