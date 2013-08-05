// ==UserScript==
// @name       Lifetime wiki vis.
// @namespace  https://github.com/protsenkovi
// @version    0.1
// @description  Lifetime periods visualisation.
// @match https://ru.wikipedia.org/wiki/*
// @match http://ru.wikipedia.org/wiki/*
// @match https://en.wikipedia.org/wiki/*
// @match http://en.wikipedia.org/wiki/*
// @copyright  2013, protsenkovi
// ==/UserScript==


var monthsRU = {"января":0, "февраля":1, "марта":2, "апреля":3, "мая":4, "июня":5, "июля":6, "августа":7, "сентября":8, "октября":9, "ноября":10, "декабря": 11};  
var monthsEN = {"January":0, "February":1, "March":2, "April":3, "May":4, "June":5, "July":6, "August":7, "September":8, "October":9, "November":10, "December": 11}; 

function strToDate(str, lang) {
    if(str == "alive")
        return new Date();
    var months;
    var pattGrigDate, pattYear, pattSimpleDate, pattSimpleMonth;
    if (lang == "ru") {
        pattGrigDate = new RegExp("\\(\\d{1,2}(\\s(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря))?(\\s\\d{4})?\\)");
        pattYear = new RegExp("\\d{4}");
        pattSimpleDate = new RegExp("\\d{1,2}\\s(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)");
        pattSimpleMonth = new RegExp("(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)");
        months = monthsRU;
    }
    if (lang == "en") {
        pattGrigDate = new RegExp("\\(\\d{1,2}(\\s(January|February|March|April|May|June|July|August|September|October|November|December))?(\\s\\d{4})?\\)");
        pattYear = new RegExp("\\d{4}");
        pattSimpleDate = new RegExp("\\d{1,2}\\s(January|February|March|April|May|June|July|August|September|October|November|December)");
        pattSimpleMonth = new RegExp("(January|February|March|April|May|June|July|August|September|October|November|December)");
        months = monthsEN;
    }
    var grigDate = pattGrigDate.exec(str);
    if (grigDate == null) {
        var result = pattSimpleDate.exec(str);
        grigDate = (result != null)?result[0].toString():"1 января";
    } else {
        grigDate = grigDate[0].toString();
        grigDate = grigDate.substring(1, grigDate.length-1);
    }
    grigDate = grigDate.split(' ');
    var grigday, grigmonth, grigyear;
    grigday = grigDate[0];
    if(grigDate.length > 1) {
        grigmonth = months[grigDate[1]];
    } else {
        grigmonth = months[pattSimpleMonth.exec(str)[0].toString()];
    }
    if (grigDate.length == 3) {
        grigyear = grigDate[2];
    } else {
        grigyear = pattYear.exec(str).toString(); 
    }
    return new Date(parseInt(grigyear), parseInt(grigmonth), parseInt(grigday)); 
}

function toDays(date) {
    var oneDay = 24*60*60*1000;
    var res = Math.round(date.getTime()/oneDay)
    return res;
}

function toMillis(days) {
    var oneDay = 24*60*60*1000;
    var res = days*oneDay;
    return res;
}

function dateToCanvasPosition(date, minDate, maxDate, canvas) {
    return (toDays(date) - toDays(minDate))/(toDays(maxDate) - toDays(minDate))*canvas.width;
}

function canvasPositionToDate(x_pos, minDate, maxDate, canvas) {
    return new Date(toMillis(x_pos/canvas.width*(toDays(maxDate) - toDays(minDate)) + toDays(minDate)));
}

function getFontSize(context) {
    var t = (new RegExp("(\\d*px)")).exec(context.font);
    return  parseInt(t[0].replace('px',''));
}

CanvasRenderingContext2D.prototype.fillTextCustom = function (text, x, y, options) {
    this.save();

    var options = options || {};
    var background = options.background || {};

    if (options.color != null) this.fillStyle = options.color;
    this.font = options.font || '14px Arial';
    
    var height = getFontSize(this) || 0;
    var width = this.measureText(text).width;
    var margin = background.margin || 2;
    var backgroundColor = background.color || 'white';

    this.save();
    this.fillStyle = backgroundColor;
    this.fillRect(x-margin, y-margin-height, width+margin, height+2*margin);
    this.restore();    

    this.fillText(text, x, y);
    this.restore();
}

function hline(date, minDate, maxDate, canvas, color, legend) {
    var ctx = canvas.getContext("2d");
    ctx.save();
    var legend = legend || {};
    var font = legend.font || ctx.font;

    var x_pos = dateToCanvasPosition(date, minDate, maxDate, canvas);
    var y_pos = 20;
    var x_margin = 5;
    var y_margin = 8;
    var fontSize = getFontSize(ctx);

    ctx.fillStyle = color || 'black';
    ctx.fillRect(x_pos,  0, 1, canvas.height);
   
    if (legend.color != null) ctx.fillStyle = legend.color;
    if(legend.dateFormat != null) {
        if (legend.dateFormat == "full")
            ctx.fillTextCustom(date.toDateString(), x_pos + x_margin, y_pos, {font:font});
        if (legend.dateFormat == "yy") 
            ctx.fillTextCustom(date.getFullYear().toString().substr(-2), x_pos + x_margin, y_pos, {font:font});
        if (legend.dateFormat == "yyyy") 
            ctx.fillTextCustom(date.getFullYear().toString(), x_pos + x_margin, y_pos, {font:font});
    } else {
        ctx.fillTextCustom(date.getFullYear().toString(), x_pos + x_margin, y_pos, {font:font});
    }

    if (legend.data != null) {
        var data = legend.data.split(';');
        for(var i = 0; i < data.length; i++) {
            y_pos += y_margin + fontSize;
            ctx.font = font;
            var text_width = ctx.measureText(data[i]).width;
            var x = x_pos + x_margin;
            if (x + text_width > canvas.width) x = x_pos - text_width - x_margin;
            ctx.fillTextCustom(data[i], x, y_pos);
        }
    } 
    ctx.restore();
}

function addYears(date, years) {                
    return new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
}

function exists(name, persons) {
    for(var i = 0; i < persons.length; i++) {
        var person = persons[i];
        if(person != null) {
            if(person.name == name)
                return true;
        }
    }
    return false;
}

function findPersonByName(name, persons) {
    for(var i = 0; i < persons.length; i++) {
        var person = persons[i];
        if(person != null) {
            if(person.name == name) 
                return person;
        }
    }
    return null;
}

function createRecord(name, bday, dday, lang) {
    return '{"name":"' + name + '","bday":"' + bday + '","dday":"' + dday + '"}';
}

window.addEventListener('load', function(e) {
        var cookie = $.cookie("persdates");
        if(cookie == null) {
            $.cookie("persdates", "");
            cookie = "";
        }
        var lang;
        if ((new RegExp("en.wikipedia.org")).exec(document.URL) != null) lang = "en";
        if ((new RegExp("ru.wikipedia.org")).exec(document.URL) != null) lang = "ru";

        var title = $("title").text();
        var name, birthdate, deathdate;
        if (lang == "ru") {
            name = title.substring(0, title.lastIndexOf('—')-1);
            var birthElts = $(".infobox tr:contains(Дата):contains(рождения)").find("td");
            if (birthElts.length > 0) {
                birthdate = strToDate(birthElts.text(), lang).toString();
            } else {
                birthElts = $(".infobox tr:contains(Рождение)").find("td");
                birthdate = (birthElts.length > 0)?  strToDate(birthElts.text(), lang).toString() : "";
            }
            var deathElts = $(".infobox tr:contains(Дата):contains(смерти)").find("td");
            if (deathElts.length > 0) {
                deathdate = strToDate(deathElts.text(), lang).toString();
            } else {
                deathElts = $(".infobox tr:contains(Смерть)").find("td");
                deathdate = (deathElts.length > 0)?  strToDate(deathElts.text(), lang).toString() : "alive";
            }
        }
        if (lang == "en") {
            name = title.substring(0, title.lastIndexOf('-')-1)
            var birthElts = $(".infobox tr:contains(Born)").find("td");
            birthdate = (birthElts.length > 0)?strToDate(birthElts.text(), lang).toString():"";
            var deathElts = $(".infobox tr:contains(Died)").find("td");
            deathdate =  (deathElts.length > 0)?strToDate(deathElts.text(), lang).toString():"alive";
        }
        
        var current_person = null;
        var persons = cookie.split(";").map(function(v) { try { return JSON.parse(v) } catch(e) { return null; }});
        if (!exists(name, persons) && (birthdate != "")) {
            if(deathdate == "") deathdate = "alive";
            if(cookie=="")
                $.cookie("persdates", cookie + createRecord(name, birthdate, deathdate));
            else
                $.cookie("persdates", cookie + ";" + createRecord(name, birthdate, deathdate));
        } 
        if (exists(name, persons)) {
           current_person = findPersonByName(name, persons); 
           current_person.bdayDate = new Date(current_person.bday);
           current_person.ddayDate = (current_person.dday == "alive")?new Date():new Date(current_person.dday);

           $("<span id='persdates' style='margin:5px'>[<a id='canv'>Chart</a><span id='chartrightbr'>]</span></span>").insertAfter("#toc");
           $("#persdates").mouseenter(function() { 
                $("#chartrightbr").before("<span id='chartmiddlsep'> | </span><a id='clearcookies'>Clear cookies</a>");
                $("#clearcookies").click(function () { 
                    var ok = confirm("Вы действительно хотите удалить все даты из базы?");
                    if (ok) $.cookie("persdates", ""); 
                });
            }).mouseleave(function() { $("#clearcookies").remove(); $("#chartmiddlsep").remove(); });

           $("#canv").click(function() {
                if($.cookie("persdates") != "") { //" + ($("#persdates").width() -  $(".infobox").width()) + "
                    $('#persdates').empty().append("<canvas id='canvas' width=800 height=480 style='margin:10px'/>");
                    $("#persdates").unbind("mouseenter");
                    initCanvas(current_person);            
                } else {
                    $('#canv').replaceWith("<a id='canv'>Показывать нечего</a>");
                }
           });
        }                
});



function initCanvas(current_person) { 
    var persons = $.cookie("persdates").split(";").map(function(v) { 
        try {
            var json = JSON.parse(v);
            json.bdayDate = new Date(json.bday);
            json.ddayDate = (json.dday == "alive")?new Date():new Date(json.dday);
            return json;
        } catch(e) { 
            return null; 
        }});

    
    var lp = (current_person != null)?current_person:persons[persons.length-1];
    var delta = 60;
    var minDate = new Date(lp.bdayDate.getFullYear() - delta, lp.bdayDate.getMonth(), lp.bdayDate.getDate());
    var maxDate = new Date(lp.ddayDate.getFullYear() + delta, lp.ddayDate.getMonth(), lp.ddayDate.getDate());

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");

    var visiblepersons = new Array();

    var heightPlusMargin, margin, y;
    var topBarHeight = 63;
    var bottomBarHeight = 50;

    calculateRepresentation();
    drawScale(minDate, maxDate, canvas);
    drawRepresentation();

    $("#canvas").mousemove(function(c) {
        var ctx = this.getContext("2d");
        ctx.clearRect(0, 0, this.width, this.height);                
        drawScale(minDate, maxDate, canvas);
        var x_pos = canvasPositionToDate(c.offsetX, minDate, maxDate, this);
        var important_date = null;
        var important_person_data = null;
        var glueRange = 8;
        for(var i = 0; i < visiblepersons.length; i++) {
            var rBday = Math.abs(visiblepersons[i].x - c.offsetX);
            var rDday = Math.abs(visiblepersons[i].x + visiblepersons[i].width - c.offsetX);
            if(rBday < glueRange) {
                if (important_date == null) {
                    important_date = visiblepersons[i].bdayDate;
                } else {
                    if ((c.offsetY > visiblepersons[i].y - margin/2) && (c.offsetY < (visiblepersons[i].y + visiblepersons[i].height + margin))) 
                        important_date = visiblepersons[i].bdayDate;
                }
            }
            if(rDday < glueRange) {
                if (important_date == null) {
                    important_date = visiblepersons[i].ddayDate;
                } else {
                    if ((c.offsetY > visiblepersons[i].y - margin/2) && (c.offsetY < (visiblepersons[i].y + visiblepersons[i].height + margin)))
                        important_date = visiblepersons[i].ddayDate;
                }
            }

            if ((c.offsetY > visiblepersons[i].y) && 
                (c.offsetY < (visiblepersons[i].y + visiblepersons[i].height)) && 
                (c.offsetX > visiblepersons[i].x) &&
                (c.offsetX < visiblepersons[i].x + visiblepersons[i].width)) {
                important_person_data = visiblepersons[i].name;
            }
        }

        if(important_date != null)            
            hline(important_date, minDate, maxDate, canvas, 'red', { font: "14px Arial", color: "black", dateFormat: "full", data:important_person_data});
        else
            hline(x_pos, minDate, maxDate, canvas, 'red', { font: "14px Arial", color: "black", dateFormat: "full", data:important_person_data});
        drawRepresentation();
    });

    function drawScale(minDate, maxDate, canvas) {
        ctx.save();
        var year = minDate.getFullYear() + 10; 
        while(year < maxDate.getFullYear() - 10) {
            hline(new Date(year,0,1), minDate, maxDate, canvas, '#F0F0F0', { font: "14px Arial", dateFormat: "yy"});
            year += 10;
        }
        hline(addYears(minDate, 10), minDate, maxDate, canvas, 'grey', { font: "14px Arial", color: "black"});
        hline(addYears(maxDate, -10), minDate, maxDate, canvas, 'grey', { font: "14px Arial", color: "black"});
        hline(new Date(), minDate, maxDate, canvas, 'green');
        ctx.restore();
    }

    function calculateRepresentation() {
        for(var i = 0; i < persons.length; i++) {
            persons[i].x = dateToCanvasPosition(persons[i].bdayDate, minDate, maxDate, canvas);
            persons[i].width = dateToCanvasPosition(persons[i].ddayDate, minDate, maxDate, canvas) - persons[i].x;
            if ((persons[i].bdayDate.getFullYear() < maxDate.getFullYear()) && (persons[i].ddayDate.getFullYear() > minDate.getFullYear())) 
                visiblepersons.push(persons[i]);
        }
        heightPlusMargin = (canvas.height-bottomBarHeight)/visiblepersons.length;
        margin =  Math.round(heightPlusMargin*0.3);
        y = topBarHeight;
        for(var i = 0; i < visiblepersons.length; i++) {               
            visiblepersons[i].height = heightPlusMargin - margin;
            visiblepersons[i].y = y;  
            visiblepersons[i].color = "black";
            y += heightPlusMargin;
        }
    }

    function drawRepresentation() {
        ctx.save();
        for(var i = 0; i < visiblepersons.length; i++) {
            ctx.fillStyle = visiblepersons[i].color;
            ctx.fillRect(visiblepersons[i].x,  visiblepersons[i].y, visiblepersons[i].width, visiblepersons[i].height);
            ctx.fillTextCustom(visiblepersons[i].name, visiblepersons[i].x+5, visiblepersons[i].y-5);
        }
        ctx.restore();
    }
}
