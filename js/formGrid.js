
var tip = ID("tooltip");
var c = ID("output");
var Instructions = ID("instructions");
var Options = ID("options");
var error = ID("error");
//var searchIN = ID("searchIN");
var changelog = ID("changelog");
var layout = [];
var constant = {};
var formula = {};
var missing = [];
var mouse = {
    down: false,
    d: [0, 0]
};
var bg = {
    img: new Image(),
    x: 30,
    y: 0,
    w: 0,
    h: 0,
    margin: 70,
    clear: function() {
        bg.img = new Image();
        bg.x=0;
        bg.y=0;
        bg.w=0;
        bg.h=0;
        drawAll();
    }
};
var form = {
	DOCI: "",
	STCD: "",
	RDAT: "",
	ALIS: "",
	DESC: "",
	DLRN: "",
	DATE: "",
	TIME: "",
	MLEN: 0,
	MWID: 0
}
var ctx = c.getContext("2d");
var rowH = 7;//6.86;
var rowW = 7; //needs to stay 7 for 12pt font
//ctx.translate(0.5, 0.5);
var options = {
    altparse: false,
    hideText: false,
    rental: false,
    checker:false,
};
var today = new Date();
var someday = new Date();
someday.setFullYear(2015, 9, 21); //month is 0-11
if (today < someday) {
    changelog.style.display = "block";
}
init();

function init() {
    ID("bgimage").style.display = "block";
    var a = ID("input").value.split("\n");
    parseInput(a);
    c.height = (form.MLEN > 130) ? Math.ceil((form.MLEN + 10) / 10) * 10 * rowH : 130 * rowH;
    c.width =  (form.MWID > 110) ? 30 + (Math.ceil(form.MWID / 10) * 10 * rowW) : 100 * rowW + 30;
    guessImage();
    drawAll();
    
    ListGlobal();
    testing();


}

function drawAll() {
    //clear everything first
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fillRect(0, 0, c.width, c.height);
    drawBG();
    drawGrid();
    //only draw the heading if there is no image
    if (bg.img.src == "") {
        drawHeading();
    }
    //write alias down center of page
    var center = ((c.width - 30) / 2) + 30;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,.06)';
    ctx.font = '180px Arial,"Helvetica Neue",Helvetica,sans-serif';
    var dist = 400;
    for (i = 0; i <= c.height; i = i + dist) {
        ctx.fillText(form.ALIS, center, i);
    }
    drawLayout();


    //set url of "save form" link
    var button = ID("btn-download");
    var dataURL = c.toDataURL();
    button.href = dataURL;
    button.download = form.ALIS + ".png";
    button.innerHTML = "Save " + form.ALIS;
}

function ID(a) {
    return document.getElementById(a);
}
c.onmouseout = function(e) {
    tip.style.display = "none";
}
c.onmousedown = function(e) {
    var downX = e.pageX - c.offsetLeft;
    var downY = e.pageY - c.offsetTop;
    mouse.d = {
        x: downX - bg.x,
        y: downY - bg.y
    };
    mouse.dBG = {
        x: bg.x,
        y: bg.y,
        w: bg.w,
        h: bg.h
    };
    
    mouse.down = mouseAction(downX, downY);



    var row = Math.ceil(downY / rowH);
    var col = Math.ceil((downX - 30) / rowW);


    for (i = 0; i < layout.length; i++) {
        var b = layout[i];
        if (b.LINE < row) {
            continue;
        }
        if (b.LINE > row) {
            break;
        }
        if (b.LINE == row) {
            if (col >= b.SPOS && col < b.SPOS + b.FLDN.length) {

                if(b.FLDN.charAt(0)=='Z' && b.RTYP !== ""&&b.FLDN!=="ZNA"&&b.FLDN!=="ZBLANK") {
                    showGlobal(b);
                }
            }
        }
    }

}

function mouseAction(X, Y) {
    var str = "";
    if (Y > bg.y && Y < bg.h + bg.y) {
        if (X > bg.x && X < bg.w + bg.x) {
            if (Y < bg.y + bg.margin) {
                str += "n";
            }
            else if (Y > bg.y + bg.h - bg.margin) {
                str += "s";
            }
            if (X < bg.x + bg.margin) {
                str += "w";
            }
            else if (X > bg.x + bg.w - bg.margin) {
                str += "e";
            }
            if (str == "") {
                str = "m";
            }
        }
    }
    return str == "" ? false : str;
}
window.onmouseup = function(e) {
    mouse.down = false;
};
c.onmousemove = function(e) {
    var offsetX = e.pageX - c.offsetLeft;
    var offsetY = e.pageY - c.offsetTop;
    var row = Math.ceil(offsetY / rowH);
    var col = Math.ceil((offsetX - 30) / rowW);
    //tip.style.width="100px";
    tip.innerHTML = [row, col] + "\n";
    var cur = "default";
    switch (mouseAction(offsetX, offsetY)) {
        case "m":
            cur = mouse.down ? "-webkit-grabbing" : "move";
            break
        case "n":
        case "s":
            cur = "ns-resize";
            break
        case "e":
        case "w":
            cur = "ew-resize";
            break
        case "ne":
        case "sw":
            cur = "nesw-resize";
            break
        case "nw":
        case "se":
            cur = "nwse-resize";
            break
    }
    c.style.cursor = cur;
    if (mouse.down) {
        switch (mouse.down) {
            case "m":
                bg.x = offsetX - mouse.d.x;
                bg.y = offsetY - mouse.d.y;
                break;
            case "n":
                bg.y = (offsetY - mouse.d.y);
                bg.h = mouse.dBG.h + mouse.dBG.y - (offsetY - mouse.d.y);
                break;
            case "s":
                bg.h = mouse.dBG.h - mouse.dBG.y + (offsetY - mouse.d.y);
                break;
            case "w":
                bg.x = (offsetX - mouse.d.x);
                bg.w = mouse.dBG.w + mouse.dBG.x - (offsetX - mouse.d.x);
                break;
            case "e":
                bg.w = mouse.dBG.w - mouse.dBG.x + (offsetX - mouse.d.x);
                break;
            case "nw":
                diff=((offsetY - mouse.d.y)+(offsetX - mouse.d.x))/2;
                bg.h = mouse.dBG.h - diff;
                bg.w = mouse.dBG.w * bg.h / mouse.dBG.h;
                bg.y = mouse.dBG.y + mouse.dBG.h - bg.h;
                bg.x = mouse.dBG.x + mouse.dBG.w - bg.w;

                break;
            case "ne":
                diff=((offsetY - mouse.d.y)-(offsetX - mouse.d.x))/2;
                bg.h = mouse.dBG.h - diff;
                bg.w = mouse.dBG.w * bg.h / mouse.dBG.h;
                bg.y = mouse.dBG.y + mouse.dBG.h - bg.h;

                break;
            case "sw":
                diff=((offsetY - mouse.d.y)-(offsetX - mouse.d.x))/2;
                bg.h = mouse.dBG.h + diff;
                bg.w = mouse.dBG.w * bg.h / mouse.dBG.h;
                bg.x = mouse.dBG.x + mouse.dBG.w - bg.w;

                break;
            case "se":
                diff=((offsetY - mouse.d.y)+(offsetX - mouse.d.x))/2;
                bg.h = mouse.dBG.h + diff;

                bg.w = mouse.dBG.w * bg.h / mouse.dBG.h;
                break;
        }
        drawAll();
    }
    var hover = false;
    for (i = 0; i < layout.length; i++) {
        var b = layout[i];
        if (b.LINE < row) {
            continue;
        }
        if (b.LINE > row) {
            break;
        }
        if (b.LINE == row) {
            if (col >= b.SPOS && col < b.SPOS + b.CHAR) {
                if (col >= b.SPOS && col < b.SPOS + b.FLDN.length) {
                    if(b.FLDN.charAt(0)=='Z' && b.RTYP !== ""&&b.FLDN!=="ZNA"&&b.FLDN!=="ZBLANK") {
                        hover = true;
                    }
                }
                FLDN = b.FLDN;
                tip.innerHTML += "\n" + b.LINE + "," + b.SPOS + " " + b.FLDN;
                tip.innerHTML += " [" + b.CHAR + "/" + b.FRMT + "] '" + b.DESC + "'\n";
                if (b.RTYP == "C") {
                    if (constant.hasOwnProperty(FLDN)) {
                        if (constant[FLDN].ACON !== "") {
                            tip.innerHTML += "   " + constant[FLDN].TYPE + " VALUE: " + constant[FLDN].ACON + "\n";
                        }
                        if (constant[FLDN].PRMT !== "") {
                            tip.innerHTML += "   " + constant[FLDN].TYPE + " PRMT: " + constant[FLDN].PRMT + "\n";
                        }
                    }
                }
                if (b.RTYP == "F") {
                    if (formula.hasOwnProperty(FLDN)) {
                        tip.innerHTML += "   FORMULA: " + formula[FLDN].TYPE + "/" + formula[FLDN].DECP + "\n";
                        for (var j = 0; j < formula[FLDN].LINE.length; j++) {
                            tip.innerHTML += "    ";
                            for (var k = 1; k <= 8; k++) {
                                tip.innerHTML += formula[FLDN].LINE[j]["FLD"+k]+" ";
                                tip.innerHTML += k!==8? formula[FLDN].LINE[j]["OPC"+k]+" ":"  ";
                                if(k==4){
                                    if (formula[FLDN].LINE[j].hasOwnProperty("FTC1"))
                                    {
                                        tip.innerHTML += "    ("+formula[FLDN].LINE[j].FTC1+" "+formula[FLDN].LINE[j].TST1+" "+formula[FLDN].LINE[j].CTF1+")";
                                    }
                                    tip.innerHTML += "\n    ";
                                }
                                if(k==8){
                                    if (formula[FLDN].LINE[j].hasOwnProperty("FTC2"))
                                    {
                                        tip.innerHTML += formula[FLDN].LINE[j].REL1 + " ("+formula[FLDN].LINE[j].FTC2+" "+formula[FLDN].LINE[j].TST2+" "+formula[FLDN].LINE[j].CTF2+")"; 
                                    }
                                }
                            }
                        }
                    }
                }
                for (j = 0; j < b.COND.length; j += 2) {
                    if (b.COND[j + 1]) {
                        tip.innerHTML += "   " + b.COND[j] + "\t" + b.COND[j + 1] + "\n";
                    }
                }
                //tip.innerHTML += b.join(" ") + "\n";
            }
        }
    }
    if (hover == true) {
        c.style.cursor = "pointer";
    }
    var tipX = e.pageX + tip.scrollWidth + 30 >= window.innerWidth ? window.innerWidth - tip.scrollWidth - 30 : e.pageX;
    tip.style.left = tipX + "px";
    tip.style.top = 15 + e.pageY + "px";
    tip.style.display = "block";
}

function updateOptions(cb) {
    switch (cb.id) {
        case "altparse":
        case "hideText":
        case "checker":
            options[cb.id] = cb.checked;
            break;
        case "hidefield":
            hidefield = cb.checked;
            var hf = ID("hidefieldtext");
            hf.disabled = !cb.checked;
            break;
        case "lastdigit":
        case "lines":
        case "rental":
            alert(cb.id + " is not yet finished.");
            cb.checked = false;
            break;
        default:
            alert(cb.id + " is unknown");
    }
    init();
}

function parseInput(a) {
    clearError();
    layout = [];
    constant = [];
    formula = [];
    var Type = "layout"; 
    //parse input
    form.MLEN = 0;
    form.MWID = 0;
    missing = [];
    //gather form information from line 3 and 1
    if ((a[1] && a[1].substring(0, 7).toString() == "DG3300R") && !options.altparse) {
        if (a[3]) {
            form.DOCI = a[3].substring(5, 18).trim();
            form.STCD = a[3].substring(28, 30).trim();
            form.RDAT = a[3].substring(43, 48).trim();
            form.ALIS = a[3].substring(58, 61).trim();
            form.DESC = a[3].substring(77).trim();
        }
        if (a[1]) {
            //print dealer information and timestamp
            form.DLRN = a[1].substring(10, 88).trim();
            form.DATE = a[1].substring(89, 97).trim();
            var newFormTIME = a[1].substring(99).trim();
            if (newFormTIME !== form.TIME && form.TIME !== "") {
                bg.img = new Image();
            }
            form.TIME = newFormTIME;
        }
    }
    else {
        form.DOCI = "";
        form.STCD = "";
        form.RDAT = "";
        form.ALIS = "";
        form.DESC = "";
        form.DLRN = "";
        form.DATE = "";
        form.TIME = "";
    }
    for (i = 0; i < a.length; i++) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000000';
        ctx.font = '12px "Courier New",Courier,"Lucida Sans Typewriter","Lucida Typewriter",monospace';
        if (a[i] == "Line   Pos   Field      C/F  Char   FM   Description                        Condition Test") {
            Type = "layout";
            continue;
        }
        if (a[i] == "Field    Type  Description                 Value                                      Prompt") {
            Type = "constant";
            continue;
        }
        if (a[i] == "Field      Description               Type  DP  Formula") {
            Type = "formula";
            continue;
        }
        if (a[i].trim().length == 0) {
            continue;
        }
        if ((a[1] && a[1].substring(0, 7).toString() == "DG3300R") && (a[i] == a[1] || a[i].substring(0, 90) == a[2].substring(0, 90) || a[i] == a[3] || a[i] == a[4])) {
            //ctx.fillText(Type,12*rowW,i*rowH);
            continue;
        }
        //ctx.fillText(Type,4*rowW,i*rowH);
        if (Type == "layout") {
            //Line   Pos   Field      C/F  Char   FM   Description                        Condition Test
            //  65    44   BMDTORDA           2   Z    Day of Origination Date           BMAPYL    NE  'Y'
            //                                                                     AND   BMDTORDA  LE  28.
            //0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
            //0         1         2         3         4         5         6         7         8         9
            //                                             Forms Layout                                          Page   1
            //APROMPT    A   ASSIGNMENT                                                             ASSIGNMENT 1-3:
            if (options.altparse !== true) {
                var b = {
                    LINE: parseInt(a[i].substring(0, 4).trim()), //[0] Line
                    SPOS: parseInt(a[i].substring(6, 9).trim()), //[1] Pos
                    FLDN: a[i].substring(11, 21).trim(), //[2] Field
                    RTYP: a[i].substring(22, 24).trim(), //[3] C/F
                    CHAR: parseInt(a[i].substring(28, 30).trim()), //[4] Char
                    FRMT: a[i].substring(32, 34).trim(), //[5] Fm
                    DESC: a[i].substring(37, 62).trim(), //[6] Description
                    COND: [a[i].substring(63, 64).trim(), //[7] RELATION
                        a[i].substring(65, 66).trim()
                    ], //[8] Condition Test
                    TEXT: a[i].replace(/\s+/g, ' ').trim() //TEXT from line a[I]
                };
                if (b.COND[1] !== "") {
                    b.COND[1] = "(" + b.COND[1] + ")";
                    b.COND[1] = b.COND[1].replace(/\s+/g, ' ');
                }
                //check if second line
                if (a[i].substring(0, 68).trim() == "") {
                    layout[layout.length - 1].COND.push(b.COND[0]);
                    layout[layout.length - 1].COND.push(b.COND[1]);
                    layout[layout.length - 1].TEXT += " ";
                    layout[layout.length - 1].TEXT += a[i].replace(/\s+/g, ' ').trim();
                    continue;
                }
                else {
                    layout.push(b);
                }
            }
            else //alternate parse
            {
                var c = a[i].trim().replace(/\s+/g, ' ').split(" ");
                if (!isNaN(c[3])) {
                    c.splice(3, 0, "");
                }
                var descr = c.slice(5).join(" ");
                c = c.slice(0, 5)
                c.push("", descr, "")
                if (a[i].trim().charAt(a[i].trim().length - 1) == "+") {
                    c.push("(condition unknown)");
                }
                else {
                    c.push("");
                }
                var b = {
                    LINE: parseInt(c[0]),
                    SPOS: parseInt(c[1]),
                    FLDN: c[2],
                    RTYP: c[3],
                    CHAR: parseInt(c[4]),
                    FRMT: c[5],
                    DESC: c[6],
                    COND: [c[7], c[8]],
                    TEXT: a[i].replace(/\s+/g, ' ').trim()
                };
                layout.push(b);
            }
            if (b.TEXT.toUpperCase().search("DMODOMIN") !== -1) {
                options.rental = true;
            }
            //check for *FIELD (missing description)
            if (!isNaN(b.LINE) && !b.DESC) {
                str=b.LINE + "\t" + b.SPOS + "\t";
                if (b.RTYP != "" && b.FLDN.charAt(0) == "Z") {
                    str+="<a href='#' onClick=\"javascript:showGlobal({FLDN:'"+b.FLDN+"',RTYP:'"+b.RTYP+"'})\">"+b.FLDN+"</a>";
                    if(b.FLDN=="ZLRBTE") {
                        str+="<BR />WHEN ADDING ZLRBTE, YOU MUST ALSO UPDATE <a href='#' onClick=\"javascript:showGlobal({FLDN:'Z1CASH',RTYP:'"+b.RTYP+"'})\">Z1CASH</a>";
                    }
                }
                else {
                    str+=b.FLDN;
                }

                missing.push(str);

                str = null;
            }
            if (b.FLDN == "BMGCAP") {
                showError("\n#WARNING#\nform is printing BMGCAP @ position " + b.LINE + "," + b.SPOS);
            }
            //check max height
            if (b.LINE > form.MLEN) {
                form.MLEN = b.LINE;
            }
            //check max width
            if (b.FRMT !== "") {
                if (b.SPOS + b.CHAR > form.MWID) {
                    form.MWID = b.SPOS + b.CHAR;
                }
            }
            else {
                if (b.SPOS + 8 > form.MWID) {
                    form.MWID = b.SPOS + 8;
                }
            }
        }
        else if (Type == "constant") {
            var FLDN = a[i].substring(0, 8).trim();//Field 
            var obj = {
                TYPE: a[i].substring(11, 12).trim(),//obj.Type 
                DESC: a[i].substring(15, 40).trim(),//obj.Description
                ACON: a[i].substring(43, 83).trim(),//obj.
                PRMT: a[i].substring(86, 106).trim()//obj.
            };
            constant[FLDN] = obj;
        }

//0         1         2         3         4         5         6         7         8         9         0
//01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
//AZZZZZZA   zaaaaaaaaaaaaaaaaaaaaaaaz   A   0   ZAAAAAAZ   +  ZAAAAAAZ   +  ZAAAAAAZ   +  ZAAAAAAZ   +
//                                               ZAAAAAAZ   +  ZAAAAAAZ   +  ZAAAAAAZ   +  ZAAAAAAZ
        else if (Type == "formula") {
            //check if second line
            if (a[i].substring(0, 45).trim() !== "") {
                var FLDN = a[i].substring(0, 8).trim();
                var obj = {
                    DESC: a[i].substring(11, 36).trim(),
                    TYPE: a[i].substring(39, 40),
                    DECP: a[i].substring(43, 44),
                    LINE: []
                }
                line={
                    FLD1: a[i].substring(47, 55),
                    OPC1: a[i].substring(58, 59),
                    FLD2: a[i].substring(61, 69),
                    OPC2: a[i].substring(72, 73),
                    FLD3: a[i].substring(75, 83),
                    OPC3: a[i].substring(86, 87),
                    FLD4: a[i].substring(89, 97),
                    OPC4: a[i].substring(100, 101),

                    FLD5: a[i+1].substring(47, 55),
                    OPC5: a[i+1].substring(58, 59),
                    FLD6: a[i+1].substring(61, 69),
                    OPC6: a[i+1].substring(72, 73),
                    FLD7: a[i+1].substring(75, 83),
                    OPC7: a[i+1].substring(86, 87),
                    FLD8: a[i+1].substring(89, 97),
                };

                if (!formula.hasOwnProperty(FLDN)) {
                    formula[FLDN] = obj;
                }

                formula[FLDN].LINE.push(line);

                if (formula[FLDN].LINE.length>1) {
                    for (var j = 0; j < formula[FLDN].LINE.length; j++) {
                        formula[FLDN].LINE[j].FTC1 = "CONDITON";
                        formula[FLDN].LINE[j].TST1 = "IS";
                        formula[FLDN].LINE[j].CTF1 = "MISSING"
                    }
                }
            }
        }
        else {
            //ctx.fillText("null",12*rowW,i*rowH);
        }
    } //the end of the parseInput FOR loop
}

function drawBG() {
    if (bg.img.src !== "") {
        //draw the BG image
        ctx.drawImage(bg.img, bg.x, bg.y, bg.w, bg.h);
        ctx.fillStyle = "rgba(255,255,255,.65)";
        ctx.fillRect(bg.x, bg.y, bg.w, bg.h);
        ctx.strokeStyle = "#888888";
        ctx.setLineDash([1,0]);
        ctx.lineWidth = .5;
        ctx.strokeRect(bg.x, bg.y, bg.w, bg.h);
        //ctx.translate(-0.5*rowW, +0.5*rowH);
        ctx.beginPath();
        //left
        ctx.moveTo(bg.x + bg.margin, bg.y);
        ctx.lineTo(bg.x + bg.margin, bg.y + bg.h);
        //right
        ctx.moveTo(bg.x + bg.w - bg.margin, bg.y);
        ctx.lineTo(bg.x + bg.w - bg.margin, bg.y + bg.h);
        //top
        ctx.moveTo(bg.x, bg.y + bg.margin);
        ctx.lineTo(bg.x + bg.w, bg.y + bg.margin);
        //bottom
        ctx.moveTo(bg.x, bg.y + bg.h - bg.margin);
        ctx.lineTo(bg.x + bg.w, bg.y + bg.h - bg.margin);
        ctx.stroke(); // Draw it
        //ctx.translate(+0.5*rowW, -0.5*rowH);
    }
}

function drawGrid() {
    if (options.checker){
        ctx.translate(30, 0);
        var img=new Image(14,14);
        img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAB3RJTUUH3wkdDhAmEo5TzwAAACRJREFUKM9jZGBg4GLADb7hkmBiIBOMasQDGAnIc42GKj01AgA6zgEl8r9JZAAAAABJRU5ErkJggg==";
        var pat=ctx.createPattern(img,"repeat");
        ctx.rect(0,0,c.width,c.height);
        ctx.fillStyle=pat;
        ctx.fill();
        ctx.translate(-30, 0);
    }

    //ctx.fillRect(0, 0, 30, c.height);
    //draw line along row 130
    ctx.strokeStyle = "#888888";
    ctx.beginPath();
    ctx.setLineDash([rowW]);
    ctx.moveTo(30, (130 * rowH));
    ctx.lineTo(30 + (100 * rowW), (130 * rowH));
    ctx.moveTo(30 + (100 * rowW) + 1, 0);
    ctx.lineTo(30 + (100 * rowW) + 1, c.height);
    ctx.stroke();
    //draw a grid VERTICAL
    for (i = 10; i < c.width / rowW; i += 10) {
        ctx.beginPath();
        ctx.lineWidth = ".5";
        ctx.moveTo((i - .5) * rowW + 30, 0 + .5 * rowH);
        ctx.lineTo((i - .5) * rowW + 30, c.height);
        ctx.setLineDash([rowH / 2, rowH * 9, rowH / 2, 0]);
        ctx.stroke();
    }
    //draw a grid HORIZONTAL
    for (i = 0; i < c.height / rowH; i += 10) {
        if (i % 50 == 0) {
            //vertical line numbers
            for (j = 10; j < c.width / rowW; j += 10) {
                ctx.fillStyle = '#ffffff';
                //ctx.clearRect(30+(j-1)*rowW,(i)*rowH,rowW,rowH)
                ctx.fillStyle = '#888888';
                ctx.font = '12px "Courier New",Courier,"Lucida Sans Typewriter","Lucida Typewriter",monospace';
                ctx.textAlign = 'right';
                ctx.fillText(j, 30 + j * rowW, (i + 1) * rowH);
            }
            //continue;
        }
        ctx.beginPath();
        ctx.lineWidth = ".5";
        ctx.moveTo(30 - .5 * rowW, (i + .5) * rowH);
        ctx.lineTo(c.width, (i + .5) * rowH);
        ctx.setLineDash([rowW / 2, rowW * 9, rowW / 2, 0]);
        ctx.stroke();
    }
    //draw line numbers down the left
    ctx.fillStyle = '#dddddd';
    ctx.fillRect(0, 0, 30, c.height);
    ctx.fillStyle = '#444444';
    for (i = 2; i <= c.height / rowH; i += 2) {
        ctx.textAlign = 'right';
        ctx.font = '12px "Courier New",Courier,"Lucida Sans Typewriter","Lucida Typewriter",monospace';
        var x = 30;
        var y = rowH * i;
        ctx.fillText(i, x, y);
    }
}

function drawHeading() {
    //draw form information from line 3 and 1
    if (form.ALIS != "") {
        document.title = form.ALIS + " - TV's Form Grid";
    }
    else {
        document.title = "TV's Form Grid";
    }
    form.ALIS = options.altparse ? "alt mode" : form.ALIS;
    //print form information at top center
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888888';
    ctx.font = '18px Arial,"Helvetica Neue",Helvetica,sans-serif';
    var center = ((c.width - 30) / 2) + 30;
    ctx.fillText(form.DESC, center, 30);
    var str = (form.DOCI != "") ? form.DOCI : " ";
    str += (form.STCD != "") ? " [" + form.STCD + "]" : "";
    str += (form.RDAT != "") ? " (" + form.RDAT + ")" : "";
    ctx.fillText(str, center, 50);
    //add to title of background DIV
    ID("formTitle").innerHTML = str;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial,"Helvetica Neue",Helvetica,sans-serif';
    ctx.fillText(form.DLRN, 40, 20);
    ctx.textAlign = 'right';
    ctx.fillText([form.DATE, form.TIME].join(" "), c.width - 10, 20);
}

function drawLayout() {
    if (layout.length > 0) {
        var searchBox = ID("search").value !=="" ? ID("search").value : "zzzzzz";
        for (i = 0; i < layout.length; i++) {
            var b = layout[i];
            var x = 30 + (rowW * (b.SPOS - 1));
            var y = rowH * b.LINE;
            //draw field BG
            if (options.rental) {
                if (b.TEXT.toUpperCase().search("DMODOMIN LE DMODOMOU") !== -1) //going out
                {
                    ctx.fillStyle = "rgba(0, 192, 64,.2)";
                }
                else if (b.TEXT.toUpperCase().search("DMODOMIN GT DMODOMOU") !== -1) //coming in
                {
                    ctx.fillStyle = "rgba(255,64,0,.2)";
                }
                else //not conditioned properly
                {
                    ctx.fillStyle = "rgba(192, 0, 192,.2)";
                }
            }
            else {
                ctx.fillStyle = b.COND.join("").trim() == "" ? "rgba(0,0,255,.1)" : "rgba(255,0,0,.1)";
            }
            if (b.TEXT.toUpperCase().search(searchBox.toUpperCase()) !== -1) {

                ctx.fillStyle = "rgba(255,255,0,.5)";
            }
            ctx.fillRect(x, y - rowH, (b.CHAR * rowW), rowH);
            //draw field text
            ctx.textAlign = 'left';
            ctx.fillStyle = '#000000';
            ctx.font = '12px "Courier New",Courier,"Lucida Sans Typewriter","Lucida Typewriter",monospace';
            //print for missing description (eg: *FIELD error)
            if (!isNaN(b.LINE) && !b.DESC) {
                ctx.fillStyle = '#000000';
            }
            if (b.FLDN == "BMGCAP") {
                ctx.fillStyle = '#000000';
            }
            if(!options.hideText){
                if(b.FLDN.charAt(0)=='Z' &&b.RTYP !== ""&&b.FLDN!=="ZNA"&&b.FLDN!=="ZBLANK") {
                    ctx.strokeStyle = '#0000FF';
                    ctx.setLineDash([1,0]);
                    ctx.beginPath();
                    ctx.moveTo(x,y+1.5);
                    ctx.lineTo(x+(b.FLDN.length * rowW),y+1.5);
                    ctx.stroke();
                }
                
                ctx.fillText(b.FLDN, x, y);
            }
        }
    }
}

function testing() {
    if (location.search.search("test") !== -1) {
        clearError();
        showError("form.MLEN = " + form.MLEN);
        showError("form.MWID = " + form.MWID);


showError(ParseObj({form:form,
            options:options,
            layout:layout,
            constant:constant,
            formula:formula}));

    }
}

function ParseObj(a,tab,path,last)
{

    tab=(tab==undefined)?"":tab+"\t";
    path=(path==undefined)?"-":path+' > '+last;
    last=(last==undefined)?"-":last;
    var objStr = '';
    for (var KEY in a)
    {

        type=typeof a[KEY];
        if(type=="string"&&a[KEY].replace(/\s+/g, ' ').trim()==""){
        continue;
        }
        objStr += (objStr ? ',\n': '')+ tab;
        if(!(Array.isArray(a))){
        objStr += KEY + ':';
        }

        switch (type)
        {
            case 'object':
                if(KEY=='ownerDocument'||KEY=='document'||KEY=='parent'||(KEY=='window'&&!(tab==""||tab=="\t"))||tab=="\t\t\t\t\t"||KEY==last){
                    objStr += "NOTDIVING IN HERE";
                }
                else{
                    objStr += "\n"+tab;
                    objStr += Array.isArray(a[KEY])?'[':'{';
                    objStr += '\n'+ParseObj(a[KEY],tab,path,KEY)+'\n'+tab;
                    objStr += Array.isArray(a[KEY])?']':'}';
                    //objStr += ' //end '+KEY;
                }
                break;
            case 'string':
                objStr += '"'+a[KEY].replace(/\s+/g, ' ').trim()+ '"';
                break;
            default:
                objStr += a[KEY] + '';
        }
        
    }
return objStr;
}

function showError(a) {
    ID("errorText").innerHTML += a + "\n";
    ID("error").style.display = "block";
}

function clearError() {
    ID("errorText").innerHTML = "";
    ID("error").style.display = "none";
}

function showHide(a)
{
    var b = ID(a);
    if(b.style.display == "block")
    {
        b.style.display = "none";
    }
    else
    {
        b.style.display = "block";
    }
}


var fileInput = ID('fileInput');
fileInput.addEventListener('change', function(e) {
    var file = fileInput.files[0];
    var imageType = /image.*/;
    if (file.type.match(imageType)) {
        var reader = new FileReader();
        reader.onload = function(e) {
            bg.img.src = reader.result;
            bg.x = 30;
            bg.y = 0;
            bg.w = 100 * rowW;
            bg.h = bg.img.height / bg.img.width * (100 * rowW);
            init();
        }
        reader.readAsDataURL(file);
    }
    else {
        alert("File not supported!");
    }
});

function changeImage() {
    var x = ID("imageSelect");
    bg.img = new Image();
    bg.img.onload = function() {

        //alert("image loaded!");
        //ctx.drawImage(bg.img, 100,100,200,200);
        bg.x = 30;
        bg.y = 0;
        bg.w = 100 * rowW;
        bg.h = bg.img.height / bg.img.width * (100 * rowW);
        drawAll();

    }
    uri="Forms Portal Images/" + x.value + ".jpg";
        console.log(uri);
    uri=encodeURI(uri);
        console.log(uri);
    uri=uri.replace('#','%23');
        console.log(uri);
    bg.img.src = uri;
}

function guessImage() {
    if (form.RDAT !== "") {
        var x = ID("imageSelect")
        while (x.length > 0) {
            x.remove(0);
        }
        var revision = form.RDAT.replace("/", "").split("");
        if (revision.length == 3) {
            revision.unshift("0");
        }
        revision = revision.join("");
        var docID = form.DOCI + " REV" + revision;
        docID = docID.replace(/([\(|\)|\#|\-|_|/|\\])/g, " ").replace(/\s+/g, ' ').trim().split(" ");
        var first = "~0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".search(docID[0].charAt(0));
        if(first==-1){return}
        var folders = ["!No Doc ID", "0's", "1's", "2's", "3's", "4's", "5's", "6's", "7's", "8's", "9's", "A's", "B's", "C's", "D's", "E's", "F's", "G's", "H's", "I's", "J,K's", "J,K's", "L's", "M's", "N's", "O's", "P,Q's", "P,Q's", "R's", "S's", "T's", "U's", "V's", "W's", "X,Y,Z's", "X,Y,Z's", "X,Y,Z's"];
        var found = [];
        var imageID = "";
        var max = 0;
        for (i = 0; i < images[first].length; i++) {
            imageID = images[first][i];
            imageID = imageID.replace(/([\(|\)|\#|\-|_|/|\\])/g, " ").replace(/\s+/g, ' ').trim().toUpperCase();
            for (j = 0; j < docID.length; j++) {
                if (imageID.search("\\b" + docID[j] + "\\b") !== -1) {
                    newFind = true;
                    if (found.length > 0) {
                        for (k = 0; k < found.length; k++) {
                            if (found[k][1].toString() == images[first][i].toString()) {
                                found[k][0]++;
                                if (found[k][0] > max) {
                                    max = found[k][0];
                                }
                                newFind = false;
                            }
                        }
                    }
                    if (newFind) {
                        found.push([1, images[first][i]]);
                    }
                }
            }
        }

        for (k = 0; k < found.length; k++) {
            if (found[k][0] >= max) {
                var option = document.createElement("option");
                option.value = folders[first] + "/" + found[k][1];
                option.text = found[k][1];
                x.add(option);
            }
        }
    }
}
function getVal(obj,key){
    if (obj.hasOwnProperty(key)) {

        if(obj[key]!=='undefined')
            {
                return obj[key];
            }
            else
            {
                return "";
            }
    }
    else
    {
        return "";
    }

}
function ListGlobal(b)
{



    var x = ID("globalConstant")
    while (x.length > 0) {
        x.remove(0);
    }

    for (var key in GLOBAL.constant)
    {
        var option = document.createElement("option");
        option.value = key;
        option.text = key;
        x.add(option);

    }

    var x = ID("globalFormula")
    while (x.length > 0) {
        x.remove(0);
    }

    for (var key in GLOBAL.formula)
    {
        var option = document.createElement("option");
        option.value = key;
        option.text = key;
        x.add(option);

    }


}
function showGlobal(b)
{
    ID("overlay").style.display = "block";
    if(b){
        var out = "";
        var FLDN = b.FLDN;
        if (b.RTYP == "C") {
            if (GLOBAL.constant.hasOwnProperty(FLDN)) {
    obj=GLOBAL.constant[FLDN];

                out +='<table>';
                out += '<tr><td>Field Name:</td> <td><input disabled size="8" value="'+FLDN+'" /></td></tr>';
                out += '<tr><td>Description:</td><td><input disabled size="25" value="'+getVal(obj,'DESC')+'" /></td></tr>';
                out += '<tr><td>Field Value:</td><td><input disabled size="40" value="'+getVal(obj,'ACON')+'" /></td></tr>';
                out += '<tr><td>Prompt:</td>     <td><input disabled size="20" value="'+getVal(obj,'PRMT')+'" /></td></tr>';
                out +='</table>';
            }
            else{
                out="<h1>I don't have the code for "+FLDN+".<br />Go let Ren know.</h1>";
            }
        }
        if (b.RTYP == "F") {
            if (GLOBAL.formula.hasOwnProperty(FLDN)) {
                obj=GLOBAL.formula[FLDN];
                out +='<table>';
                out += '<tr><td colspan="3">Field Name:</td>     <td colspan="9"><input disabled size="8" value="'+FLDN+'" /></td></tr>';
                out += '<tr><td colspan="3">Description:</td>     <td colspan="9"><input disabled size="25" value="'+getVal(obj,'DESC')+'" /></td></tr>';
                out += '<tr><td colspan="3">Type:</td>            <td colspan="9"><input disabled size="1" value="'+getVal(obj,'TYPE')+'" /></td></tr>';
                out += '<tr><td colspan="3">Decimal Position:</td><td colspan="9"><input disabled size="1" value="'+getVal(obj,'DECP')+'" /></td></tr>';
                for (var j = 0; j < GLOBAL.formula[FLDN].LINE.length; j++) {
                    line=GLOBAL.formula[FLDN].LINE[j];
                    out += '<tr>';
                    var l=1;
                    for (var k = 1; k <= 8; k++) {
                        out += '<td><input disabled size="8" value="';
                        out += getVal(line,'FLD'+k);
                        out += '" /></td><td>';
                        out += k!==8? '<input disabled size="1" value="'+getVal(line,'OPC'+k)+'" />':'';
                        out += '</td>';
                        if(k%4==0){
                            if (true)//(GLOBAL.formula[FLDN].LINE[j].hasOwnProperty('FTC'+l))
                            {
                                out += '<td>'+ (l==2?'<input disabled size="3" value="'+getVal(line,'REL1')+'" />':'') +'</td>';
                                out += '<td><input disabled size="8" value="'+getVal(line,'FTC'+l)+'" /></td>';
                                out += '<td><input disabled size="2" value="'+getVal(line,'TST'+l)+'" /></td>';
                                out += '<td><input disabled size="8" value="'+getVal(line,'CTF'+l)+'" /></td>';
                                out += l==1?'</tr><tr>':'';
                            }
                            l++;
                        }
    /*                    if(k==8){
                            if (GLOBAL.formula[FLDN].LINE[j].hasOwnProperty('FTC2'))
                            {
                                out += '<td>'+GLOBAL.formula[FLDN].LINE[j].REL1 + ' ('+GLOBAL.formula[FLDN].LINE[j].FTC2+' '+GLOBAL.formula[FLDN].LINE[j].TST2+' '+GLOBAL.formula[FLDN].LINE[j].CTF2+')</td>'; 
                            }
                        }*/
                    }
                    out += '</tr>';
                }
                out +='</table>';
            }
            else{
                out="<h1>I don't have the code for "+FLDN+".<br />Go let Ren know.</h1>";
            }
        }
        ID("overlayBottom").innerHTML = out;
        return
    }
}
