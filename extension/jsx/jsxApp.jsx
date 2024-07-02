﻿if (typeof JSON !== 'object') {    JSON = {};}(function() {    'use strict';    function f(n) {        // Format integers to have at least two digits.        return n < 10 ? '0' + n : n;    }    if (typeof Date.prototype.toJSON !== 'function') {        Date.prototype.toJSON = function() {            return isFinite(this.valueOf()) ? this.getUTCFullYear() + '-' + f(this.getUTCMonth() + 1) + '-' + f(this.getUTCDate()) + 'T' + f(this.getUTCHours()) + ':' + f(this.getUTCMinutes()) + ':' + f(this.getUTCSeconds()) + 'Z' : null;        };        String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function() {            return this.valueOf();        };    }    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,        gap,        indent,        meta = { // table of character substitutions            '\b': '\\b',            '\t': '\\t',            '\n': '\\n',            '\f': '\\f',            '\r': '\\r',            '"': '\\"',            '\\': '\\\\'        },        rep;    function quote(string) {        // If the string contains no control characters, no quote characters, and no        // backslash characters, then we can safely slap some quotes around it.        // Otherwise we must also replace the offending characters with safe escape        // sequences.        escapable.lastIndex = 0;        return escapable.test(string) ? '"' + string.replace(escapable, function(a) {            var c = meta[a];            return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);        }) + '"' : '"' + string + '"';    }    function str(key, holder) {        // Produce a string from holder[key].        var i, // The loop counter.            k, // The member key.            v, // The member value.            length,            mind = gap,            partial,            value = holder[key];        // If the value has a toJSON method, call it to obtain a replacement value.        if (value && typeof value === 'object' && typeof value.toJSON === 'function') {            value = value.toJSON(key);        }        // If we were called with a replacer function, then call the replacer to        // obtain a replacement value.        if (typeof rep === 'function') {            value = rep.call(holder, key, value);        }        // What happens next depends on the value's type.        switch (typeof value) {            case 'string':                return quote(value);            case 'number':                // JSON numbers must be finite. Encode non-finite numbers as null.                return isFinite(value) ? String(value) : 'null';            case 'boolean':            case 'null':                // If the value is a boolean or null, convert it to a string. Note:                // typeof null does not produce 'null'. The case is included here in                // the remote chance that this gets fixed someday.                return String(value);                // If the type is 'object', we might be dealing with an object or an array or                // null.            case 'object':                // Due to a specification blunder in ECMAScript, typeof null is 'object',                // so watch out for that case.                if (!value) {                    return 'null';                }                // Make an array to hold the partial results of stringifying this object value.                gap += indent;                partial = [];                // Is the value an array?                if (Object.prototype.toString.apply(value) === '[object Array]') {                    // The value is an array. Stringify every element. Use null as a placeholder                    // for non-JSON values.                    length = value.length;                    for (i = 0; i < length; i += 1) {                        partial[i] = str(i, value) || 'null';                    }                    // Join all of the elements together, separated with commas, and wrap them in                    // brackets.                    v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' : '[' + partial.join(',') + ']';                    gap = mind;                    return v;                }                // If the replacer is an array, use it to select the members to be stringified.                if (rep && typeof rep === 'object') {                    length = rep.length;                    for (i = 0; i < length; i += 1) {                        if (typeof rep[i] === 'string') {                            k = rep[i];                            v = str(k, value);                            if (v) {                                partial.push(quote(k) + (gap ? ': ' : ':') + v);                            }                        }                    }                } else {                    // Otherwise, iterate through all of the keys in the object.                    for (k in value) {                        if (Object.prototype.hasOwnProperty.call(value, k)) {                            v = str(k, value);                            if (v) {                                partial.push(quote(k) + (gap ? ': ' : ':') + v);                            }                        }                    }                }                // Join all of the member texts together, separated with commas,                // and wrap them in braces.                v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' : '{' + partial.join(',') + '}';                gap = mind;                return v;        }    }    // If the JSON object does not yet have a stringify method, give it one.    if (typeof JSON.stringify !== 'function') {        JSON.stringify = function(value, replacer, space) {            // The stringify method takes a value and an optional replacer, and an optional            // space parameter, and returns a JSON text. The replacer can be a function            // that can replace values, or an array of strings that will select the keys.            // A default replacer method can be provided. Use of the space parameter can            // produce text that is more easily readable.            var i;            gap = '';            indent = '';            // If the space parameter is a number, make an indent string containing that            // many spaces.            if (typeof space === 'number') {                for (i = 0; i < space; i += 1) {                    indent += ' ';                }                // If the space parameter is a string, it will be used as the indent string.            } else if (typeof space === 'string') {                indent = space;            }            // If there is a replacer, it must be a function or an array.            // Otherwise, throw an error.            rep = replacer;            if (replacer && typeof replacer !== 'function' && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {                throw new Error('JSON.stringify');            }            // Make a fake root object containing our value under the key of ''.            // Return the result of stringifying the value.            return str('', {                '': value            });        };    }    // If the JSON object does not yet have a parse method, give it one.    if (typeof JSON.parse !== 'function') {        JSON.parse = function(text, reviver) {            // The parse method takes a text and an optional reviver function, and returns            // a JavaScript value if the text is a valid JSON text.            var j;            function walk(holder, key) {                // The walk method is used to recursively walk the resulting structure so                // that modifications can be made.                var k, v, value = holder[key];                if (value && typeof value === 'object') {                    for (k in value) {                        if (Object.prototype.hasOwnProperty.call(value, k)) {                            v = walk(value, k);                            if (v !== undefined) {                                value[k] = v;                            } else {                                delete value[k];                            }                        }                    }                }                return reviver.call(holder, key, value);            }            // Parsing happens in four stages. In the first stage, we replace certain            // Unicode characters with escape sequences. JavaScript handles many characters            // incorrectly, either silently deleting them, or treating them as line endings.            text = String(text);            cx.lastIndex = 0;            if (cx.test(text)) {                text = text.replace(cx, function(a) {                    return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);                });            }            if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {                j = eval('(' + text + ')');                return typeof reviver === 'function' ? walk({                    '': j                }, '') : j;            }            throw new SyntaxError('JSON.parse');        };    }}());var debug = false;$._ext_IDSN = {    myAlert:function(msg)    {        alert(msg);    },    buildPlan:function(jsonString)    {            try{         var myData = JSON.parse(decodeURIComponent(jsonString));         createPlanPlaceholders(myData);         }catch(e){alert(e+":"+e.line)}         return true;    },        placeImages:function(jsonString)    {            try{         var myData = JSON.parse(decodeURIComponent(jsonString));         placeImagesToPlan(myData);         }catch(e){alert(e+":"+e.line)}         return true;    }    }function placeImagesToPlan(myData) {    app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;    if(!myData || !myData.length) return;         var docRef = app.activeDocument;        var imagesLayer = docRef.layers.itemByName("images_fp");    if(!imagesLayer.isValid) {        imagesLayer = docRef.layers.add();        imagesLayer.name = "images_fp";        var phLayer = docRef.layers.itemByName("placeholders_fp");        imagesLayer.move(LocationOptions.AFTER,phLayer);    }            for(var i=0;i<myData.length;i++) {        var currData = myData[i];                var currId = "mirabelPlaceholderId_"+currData.insertionId;        var currFile = File(currData.filePath);        if(!currFile.exists) continue;                var phFrame = docRef.pageItems.itemByName(currId);        if(!phFrame.isValid) continue;                        var myFrame = phFrame.parentPage.rectangles.add(imagesLayer,undefined,undefined,{geometricBounds:phFrame.geometricBounds});        myFrame.name = "mirabelImageId_"+currData.insertionId;                myFrame.place(currFile);    }}function createPlanPlaceholders(myData){app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;    var totalPages = 0;   for(var i=0;i<myData.Page.length;i++)   {    totalPages = Math.max(totalPages,Number(myData.Page[i].PgOrder));       }       app.scriptPreferences.measurementUnit = MeasurementUnits.POINTS;        if(!app.documents.length) {           var  docRef =app.documents.add(true,undefined,{documentPreferences:{facingPages:true,pageWidth:myData.pw+"pt",pageHeight:myData.ph+"pt",pagesPerDocument:totalPages},marginPreferences:{left:"0",right:"0",top:"0",bottom:"0"},documentBleedUniformSize:true,documentBleedTopOffset:"0mm"});         }     else     {     var docRef = app.activeDocument;     while(docRef.pages.length<totalPages)        docRef.pages.add();     }     var phLayer = docRef.layers.itemByName("placeholders_fp");    if(phLayer.isValid) phLayer.remove();        phLayer = docRef.layers.add();    phLayer.name = "placeholders_fp";            var tagStyle = docRef.paragraphStyles.itemByName("placeholder_tag");    if (!tagStyle.isValid)        tagStyle = docRef.paragraphStyles.add({            name: "placeholder_tag",            appliedFont: "Arial",            fontStyle: "Bold",            pointSize: 25,            justification: Justification.CENTER_ALIGN,            strokeWeight:0.75,            strokeColor:"Black",            fillColor:"Paper"            //TODO add fill and stroke            });                   var colors = [];       var no_of_colors = 100;                     for(var j =0; j<no_of_colors; j++){            var r = 100+Math.random() * 100;            var g = 100+Math.random() * 100;            var b = 100+Math.random() * 100;            colors.push(color_add (docRef, "random rgb color"+j, ColorModel.PROCESS, [r,g,b]));       };           for(var i=0;i<myData.Page.length;i++)   {    var currData = myData.Page[i];     var elements = currData.Element;    if(!elements) continue;    if(elements.constructor.name!="Array")        elements = [currData.Element];        var currPage = docRef.pages[Number(currData.PgOrder)-1];           var pb = currPage.bounds;                   for(var e=0;e<elements.length;e++)        try{                var currElem = elements[e];                                          var myFrame = currPage.textFrames.add(phLayer,undefined,undefined,                                {geometricBounds:[pb[0]+Number(currElem.y1),pb[1]+Number(currElem.x1),pb[0]+Number(currElem.y1)+Number(currElem.y2),pb[1]+Number(currElem.x1)+Number(currElem.x2)],                                    contents:[currElem.tag,currElem.AdSizeName,currElem.Notes].join("\r"),                                    textFramePreferences:{insetSpacing:10,verticalJustification:VerticalJustification.CENTER_ALIGN},                                    strokeWeight:0,fillColor:colors[Math.floor(Math.random()*no_of_colors)],                                    fillTransparencySettings:{blendingSettings:{opacity:20}}                                });                                                myFrame.parentStory.appliedParagraphStyle = tagStyle;                myFrame.label = "mirabelPlaceholderId_"+currElem.OrderID;                myFrame.name = "mirabelPlaceholderId_"+currElem.OrderID;                myFrame.insertLabel("mirabelElementData_v1",currElem.toSource());        }catch(e){alert(e+":"+e.line)}    }        return undefined;}function color_add(myDocument, myColorName, myColorModel, myColorValue){                  var result =  myDocument.colors.itemByName(myColorName);          if(result.isValid) return result;                      myColorSpace = ColorSpace.RGB;            myColor = myDocument.colors.add();            myColor.properties = {name:myColorName, model:myColorModel, space:myColorSpace ,colorValue:myColorValue};            return myColor;    }        function sendToLog(msg){	var csxsEvent = createCSXSEvent("flatplanLog", msg);	csxsEvent.dispatch();}function createCSXSEvent(type, data){	var csxsEvent = new CSXSEvent(); 	csxsEvent.type = type; 	csxsEvent.data = data; 	return csxsEvent;}function log(obj) {    return;}