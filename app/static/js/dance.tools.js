
/**
 * dancetools.js  公共工具函数 --by Anningwang
 */
'use strict';

(function($){
    $.extend({
        /** 使用方法：
         *  一，字面量版：$.format ( "为什么{language}没有format" , { language : "javascript" } );
         *  二，数组版：$.format ( "为什么{0}没有format" ,  [ "javascript" ] );
         * @param source
         * @param args
         * @returns {*}
         */
        format : function(source,args){
            var result = source, reg = null;
            if(typeof(args) === "object"){
                if(args.length===undefined){
                    for (var key in args) {
                        if(args.hasOwnProperty(key) && args[key]!==undefined){
                            reg = new RegExp("({" + key + "})", "g");
                            result = result.replace(reg, args[key]);
                        }
                    }
                }else{
                    for (var i = 0; i < args.length; i++) {
                        if (args[i] !== undefined) {
                            reg = new RegExp("({[" + i + "]})", "g");
                            result = result.replace(reg, args[i]);
                        }
                    }
                }
            }
            return result;
        }
    });
    
    $.extend($.fn.datagrid.methods, {
        fixRownumber : function (jq) {
            return jq.each(function () {
                var panel = $(this).datagrid("getPanel");
                // 获取最后一行的number容器,并拷贝一份
                var clone = $(".datagrid-cell-rownumber", panel).last().clone();
                // 由于在某些浏览器里面,是不支持获取隐藏元素的宽度,所以取巧一下
                clone.css({
                    "position" : "absolute",
                    left : -1000
                }).appendTo("body");
                var width = clone.width("auto").width();
                // 默认宽度是25,所以只有大于25的时候才进行fix
                if (width > 25) {
                    // 多加5个像素,保持一点边距
                    $(".datagrid-header-rownumber,.datagrid-cell-rownumber", panel).width(width + 5);
                    // 修改了宽度之后,需要对容器进行重新计算,所以调用resize
                    $(this).datagrid("resize");
                } else {
                    // 还原成默认状态
                    $(".datagrid-header-rownumber,.datagrid-cell-rownumber", panel).removeAttr("style");
                }
                // 一些清理工作
                clone.remove();
                clone = null;
            });
        },

        // 扩展datagrid:动态添加删除editor
        addEditor : function(jq, param) {
            if (param instanceof Array) {
                $.each(param, function(index, item) {
                    var e = $(jq).datagrid('getColumnOption', item.field);
                    if(e){e.editor=item.editor;}
                });
            } else {
                var e = $(jq).datagrid('getColumnOption', param.field);
                if(e){e.editor=param.editor;}
            }
        },
        removeEditor : function(jq, param) {
            if (param instanceof Array) {
                $.each(param, function(index, item) {
                    var e = $(jq).datagrid('getColumnOption', item);
                    if (e){e.editor={};}
                });
            } else {
                var e = $(jq).datagrid('getColumnOption', param);
                if (e){e.editor={};}
            }
        }
    });

    // 用法 html: <input id="ym" >
    //      js:   $('#ym').combobox('yearMonth');
    $.extend($.fn.combobox.methods, {
        yearMonth: function (jq) { return jq.each(function () {
            var obj = $(this).combobox();
            var date = new Date();
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var table = $('<table>');
            var tr1 = $('<tr>');
            var tr1td1 = $('<td>', {
                text: '-',
                click: function () {
                    var y = $(this).next().html();
                    y = parseInt(y) - 1;
                    $(this).next().html(y);
                }
            });
            tr1td1.appendTo(tr1);
            var tr1td2 = $('<td>', {
                text: year
            }).appendTo(tr1);

            var tr1td3 = $('<td>', {
                text: '+',
                click: function () {
                    var y = $(this).prev().html();
                    y = parseInt(y) + 1;
                    $(this).prev().html(y);
                }
            }).appendTo(tr1);
            tr1.appendTo(table);

            var m_text = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
            var n = 1;
            for (var i = 1; i <= 4; i++) {
                var tr = $('<tr>');
                for (var m = 1; m <= 3; m++) {
                    var td = $('<td>', {
                        val: n,
                        text: m_text[n-1] + (n<11 ? '月' : ''),
                        click: function () {
                            var yyyy = $(table).find("tr:first>td:eq(1)").html();
                            //var cell = $(this).html();
                            var cell = $(this).val();
                            console.log(cell);
                            var v = yyyy + '-' + (cell.length < 2 ? '0' + cell : cell);
                            obj.combobox('setValue', v).combobox('hidePanel');
                        }
                    });
                    if (n == month) {
                        td.addClass('tdbackground');
                    }
                    td.appendTo(tr);
                    n++;
                }
                tr.appendTo(table);
            }
            table.addClass('mytable cursor');
            table.find('td').hover(function () {
                $(this).addClass('tdbackground');
            }, function () {
                $(this).removeClass('tdbackground');
            });
            table.appendTo(obj.combobox("panel"));
        });}
    });



    /** @author  Anningwang
     * @requires jQuery
     * 防止panel/window/dialog组件超出浏览器边界，将代码放到easyui.min.js后
     * @param left
     * @param top
     */
    function easyuiPanelOnMove(left, top) {
        //console.log('easyuiPanelOnMove:', left, ',', top);
        var l = left;
        var t = top;
        if (l < 1) {
            l = 1;
        }
        if (t < 1) {
            t = 1;
        }
        var width = parseInt($(this).parent().css('width')) + 14;
        var height = parseInt($(this).parent().css('height')) + 14;
        var right = l + width;
        var bottom = t + height;
        var browserWidth = $(window).width();
        var browserHeight = $(window).height();
        if (right > browserWidth) {
            l = browserWidth - width;
        }
        if (bottom > browserHeight) {
            t = browserHeight - height;
        }
        $(this).parent().css({
            left : l, top : t
        });
    }

    $.fn.dialog.defaults.onMove = easyuiPanelOnMove;
    $.fn.window.defaults.onMove = easyuiPanelOnMove;
    $.fn.panel.defaults.onMove = easyuiPanelOnMove;

})(jQuery);


// 页面加载等待特效 ----------------------------------------------------------------------------------------------------
var maskWidth = $(window).width();
var maskHeight = $(window).height();
var maskHtml = "<div id='maskLoading' class='panel-body' style='z-index:1000;position:absolute;left:0;width:100%;";
maskHtml += "height:" + maskHeight + "px;top:0'>";
maskHtml += "<div class='panel-header panel=loading' style='position:absolute;cursor:wait;left:" + ((maskWidth / 2) - 100) + "px;top:" + (maskHeight / 2 - 50) + "px;width:150px;height:16px;";
maskHtml += "padding:10px 5px 10px 30px;font-size:12px;border:1px solid #ccc;background-color:white;'>";
maskHtml += "页面加载中，请等待...";
maskHtml += "</div>";
maskHtml += "</div>";
document.write(maskHtml);
function CloseMask() {
    $('#maskLoading').fadeOut('fast', function () {
        $(this).remove();
    });
}
var loadComplete;
$.parser.onComplete = function () {
    //console.log('complete');
    if (loadComplete)
        clearTimeout(loadComplete);
    loadComplete = setTimeout(CloseMask, 300);
};
// 页面加载等待特效 end ------------------------------------------------------------------------------------------------


String.prototype.format = function(args) {
    var _dic = typeof args === "object" ? args : arguments;
    // 如果 args 不是对象，那就是数组了，虽然arguments是伪数组，但不需要用到数组方法。

    return this.replace(/\{([^}]+)\}/g, function(str, key) { // 替换 {任何字符} 这样的字符串
        return _dic[key] || str;    // 如果在 _dic 找不到对应的值，就返回原字符
    });
};

/**
 * 将 datebox 控件，只显示 年月 输入
 * @param obj       datebox 控件 jquery 选择器
 * @param func      选择月份后的回调函数。传入参数为 当前 年-月(yyyy-mm)
 */
function dcDatebox(obj, func) {
    var db = $(obj);
    var tds = null;    // 日期选择对象中月份
    db.datebox({
        onShowPanel: function () {  // 显示日期选择对象后再触发弹出月份层的事件，初始化时没有生成月份层
            var p = db.datebox('panel');                // 日期选择对象
            var span = p.find('span.calendar-text');    // 1.4.x +版本, span 为 显示月份控件
            span.trigger('click');   // 触发click事件弹出月份层
            if (!tds) setTimeout(function () {
                tds = p.find('div.calendar-menu-month-inner td');
                tds.click(function (e) {
                    e.stopPropagation(); // 禁止冒泡执行easyui给月份绑定的事件
                    var year = /\d{4}/.exec(span.html())[0];     // 得到年份
                    var month = parseInt($(this).attr('abbr'), 10); // 月份，这里不需要+1
                    db.datebox('hidePanel')     // 隐藏日期对象
                        .datebox('setValue', year + '-' + month); // 设置日期的值
                    if(func) func(db.datebox('getValue'));
                });
            }, 0);
        },
        parser: function (s) {
            if (!s) return new Date();
            var arr = s.split('-');
            return new Date(parseInt(arr[0], 10), parseInt(arr[1], 10) - 1, 1);
        },
        formatter: function (d) {
            var m = d.getMonth() + 1;
            return d.getFullYear() + '-' + (m<10?('0'+m):m);
        }, currentText: '本月'
    }).textbox({editable:false});
}


function addEvent(obj,xEvent,fn) {
    if(obj.attachEvent){
        obj.attachEvent('on'+xEvent,fn);
    }else{
        obj.addEventListener(xEvent,fn,false);
    }
}


/**
 * 更加text域返回value域。 用于 combobox。
 * 对value域赋值，值域为 someName_text, 则 value域为 someName。若值域不存在 _text，则值域固定为 value
 *      someName_text        -> someName
 *      school_name          -> school_id
 *      other                -> other_value
 * @param textField
 * @returns {*}
 */
function getValueField(textField) {
    var valField = textField;
    var idx = valField.lastIndexOf('_text');
    if(idx !== -1){
        valField = valField.slice(0, idx);
    } else if( (idx = valField.lastIndexOf('_name')) !== -1 ){
        valField = valField.slice(0, idx) + '_id';
    } else{
        valField += '_value'
    }
    console.log('getValueField: textField=', textField, ' valField=', valField);
    return valField
}


/**
 * 用于combobox， 根据 value域得到 text 域的名称， 转换规则如下
 *      school_name        <-- school_id        有_id后缀，则将 _id 转换为 _name
 *      some               <-- some_value       有_value后缀，则将 _value 后缀删除
 *      someName_text      <-- someName         其他情况，在value域基础上增加 _text 后缀
 * @param valField          value 域
 * @returns {*}             text 域
 */
function getTextField(valField) {
    var textField = valField;
    var idx = textField.lastIndexOf('_id');
    if(idx !== -1){
        textField = textField.slice(0, idx) + '_name';
    }else if( (idx = textField.lastIndexOf('_value')) !== -1 ){
        textField = valField.slice(0, idx);
    } else{
        textField += '_text'
    }
    //console.log('getTextField: textField=', textField, ' valField=', valField);
    return textField
}


/**
 * 向 datagrid的 rowIndex行，字段 fieldName 对应的单元格，设置文字。通用。不论该单元格是否处于编辑状态，都可以使用。
 * @param dg            datagrid 对象
 * @param rowIndex      行索引，从0开始
 * @param fieldName     字段名称
 * @param text          要设置的文字
 */
function setDgCellTextEx(dg, rowIndex, fieldName, text) {
    var ed = $(dg).datagrid('getEditor', {index:rowIndex,field:fieldName});
    if (ed){
        switch (ed.type) {
            case "textbox":
                $(ed.target).textbox('setValue', text);
                break;
            case "combobox":
            case "numberbox":
            case "combogrid":
                $(ed.target).textbox('setValue', text);
                break;
            default:
                console.log('unknown type:', ed.target.type);
                $(ed.target).textbox('setValue', text);
        }

    } else {
        setDgCellText(dg, rowIndex, fieldName, text);
    }
}

// 向 datagrid 某单元格设置文字，并对内部的row data赋值。
function danceSetDgWithRowData(dg, rowIndex, fieldName, text) {
    var rows = $(dg).datagrid('getRows');
    if (rowIndex < 0 || rowIndex >= rows.length ){
        return;
    }
    rows[rowIndex][fieldName] = text;

    setDgCellTextEx(dg, rowIndex, fieldName, text);
}

/**
 * 向 datagrid的 rowIndex行，字段 fieldName 对应的单元格，设置文字
 * @param dg            datagrid 对象
 * @param rowIndex      行索引，从0开始
 * @param fieldName     字段名称
 * @param text          要设置的文字
 */
function setDgCellText(dg, rowIndex, fieldName, text) {
    var panel =  $(dg).datagrid('getPanel');
    var tr = panel.find('div.datagrid-body tr[id$="-2-' + rowIndex + '"]');
    var td = $(tr).children('td[field=' + fieldName + ']');
    td.children("div").text(text);
}

/*
function setDgCellHtml(dg, rowIndex, fieldName, mark) {
    var panel =  $(dg).datagrid('getPanel');
    var tr = panel.find('div.datagrid-body tr[id$="-2-' + rowIndex + '"]');
    var td = $(tr).children('td[field=' + fieldName + ']');
    td.children("div").append(mark);
}*/

function getDgCellCoord(dg, rowIndex, fieldName) {
    var panel =  $(dg).datagrid('getPanel');
    var tr = panel.find('div.datagrid-body tr[id$="-2-' + rowIndex + '"]');
    var td = $(tr).children('td[field=' + fieldName + ']');
    var coord = {wOuter: $(td).outerWidth(), hOuter: $(td).outerHeight(),
        w: $(td).width(), h: $(td).height(),
        pos: $(td).position(), offset: $(td).offset()};
    //console.log('coord', coord);
    return coord;
}


// 设置表格 tr 高度，当表格有tr时才起作用。 但是 样式会被修改掉
/*function setDgCellHeight(dg, h) {
    var panel =  $(dg).datagrid('getPanel');
    var tr = panel.find('div.datagrid-body tr');
    tr.css('height', h+'px');
}*/
/*
function setDgCellHbyStyle(dgId, h) {
    var style = '<style>#'+dgId+' .datagrid-btable tr{height:'+h+'px;}</style>';
    $(body).append(style);
}*/

/**
 * 取表格中某个单元个的值。使用官方API
 * @param dg        表格JQuery选择器
 * @param index     表格行索引，从0开始
 * @param field     字段
 * @returns {*}     返回单元格（行 index， 字段 field）的值 
 */
function apiGetDgCellText(dg, index, field) {
    var rows = $(dg).datagrid('getRows');
    if (index>=0 && index < rows.length) {
        return rows[index][field];
    }
    return '';
}

/**
 * 设置表格中某个单元个内部存储单元的值。使用官方API
 * @param dg
 * @param index
 * @param field
 * @param text
 */
function apiSetDgCellText(dg, index, field, text) {
    var rows = $(dg).datagrid('getRows');
    if (index>=0 && index < rows.length) {
        rows[index][field] = text;
    }
}

/**
 * 向 datagrid的 rowIndex行，字段 fieldName 对应的单元格，设置文字，并设置datagrid内 row 的相应值。
 * @param dg
 * @param rowIndex
 * @param fieldName
 * @param text
 */
function setDgCellTextWithRowData(dg, rowIndex, fieldName, text) {
    var rows = $(dg).datagrid('getRows');
    if (rowIndex < 0 || rowIndex >= rows.length ){
        return;
    }
    rows[rowIndex][fieldName] = text;
    
    setDgCellText(dg, rowIndex, fieldName, text);
}

/**
 * 设置datagrid单元格的背景色和字体颜色。
 * @param dg
 * @param rowIndex
 * @param fieldName
 * @param color
 * @param background
 */
function setDgCellColor(dg, rowIndex, fieldName, color, background) {
    var panel =  $(dg).datagrid('getPanel');
    var tr = panel.find('div.datagrid-body tr[id$="-2-' + rowIndex + '"]');
    var td = $(tr).children('td[field=' + fieldName + ']');
    td.children("div").css({"background": background, "color": color});
}

/**
 * 设置表格单元格（TD）的背景和字体颜色。 不稳定。会被修改。
 * @param dg
 * @param rowIndex
 * @param fieldName
 * @param color
 * @param background
 */
function setDgCellColorEx(dg, rowIndex, fieldName, color, background) {
    var panel =  $(dg).datagrid('getPanel');
    var tr = panel.find('div.datagrid-body tr[id$="-2-' + rowIndex + '"]');
    var td = $(tr).children('td[field=' + fieldName + ']');
    td.css({"background": background, "color": color});
}

/**
 * 清除表格单元格（TD）的背景和字体颜色。
 * @param dg
 * @param rowIndex
 * @param fieldName
 */
function clearDgCellColorEx(dg, rowIndex, fieldName) {
    var panel =  $(dg).datagrid('getPanel');
    var tr = panel.find('div.datagrid-body tr[id$="-2-' + rowIndex + '"]');
    var td = $(tr).children('td[field=' + fieldName + ']');
    td.removeAttr("style");
}


/**
 * 将float数 value 转换为小数点后保留2位。并过滤小数点后无效的0
 * @param value     要转换的float数或者字符串
 * @returns {string}    转换后的字符串
 */
function dcTrimZero(value) {
    if (!value) {  return '';  }
    var str = Number(value).toFixed(2);
    return dcTrimStringZero(str);
}

/**
 * 删除浮点数字符串小数点最后多余的0.若为整数，同时删除小数点。
 * @param str
 * @returns {*}
 */
function dcTrimStringZero(str) {
    var i = str.lastIndexOf('.');
    if (i > 0) {
        while (str.charAt(str.length-1) === '0') {
            str = str.slice(0, str.length-1);
        }
    }
    if (str.charAt(str.length-1) === '.') {
        str = str.slice(0, str.length-1);
    }
    return str
}

/**
 * 格式化日期，将日期格式化为 年-月-日 形式的字符串。
 * @param date          日期, JavaScript Date() 对象
 * @returns {string}    格式化后的字符串 yyyy-mm-dd
 */
function danceFormatter(date){
    var y = date.getFullYear();
    var m = date.getMonth()+1;
    var d = date.getDate();
    return y+'-'+(m<10?('0'+m):m)+'-'+(d<10?('0'+d):d);
}

function danceGetDate() {
    return danceFormatter(new Date());
}

// datagrid methods
///////////////////////-------------------------------------------------------------------------------------------------
function danceDgLoadData(dgId, data, num) {
    num = num || 3;
    var len = data.length;
    for(var i = 0; i< num - len; i++){
        data.push({});
    }
    $('#'+dgId).datagrid('loadData', data);
}
///////////////////////-------------------------------------------------------------------------------------------------

// combobox methods
/**
 * 设置分校名称/id
 * @param schoolList        分校id,名称 列表 [{school_id: id, school_name: name, school_no: no}, ...]
 * @param cbId              combobox 组件 id
 * @param tbId              textbox 组件 id，设置分校名称，关联设置 分校编号
 */
function danceSetSchoolName(schoolList, cbId, tbId) {
    if (schoolList.length) {
        $('#'+cbId).combobox('loadData', schoolList)
            .combobox('setValue', schoolList[0].school_id);
        if(tbId) $('#'+tbId).textbox('setValue', schoolList[0]['school_no']);
    }
}

/**
 * combobox formatter 格式化班级名称和编号
 * @param row       row 必须含有 {class_name: name, class_no: no}
 * @returns {string}
 */
function danceFormatterClass(row){
    return '<span style="color:#888">' + row['class_no'] + '</span>&nbsp;' +
        '<span style="font-weight:bold">' + row['class_name'] + '</span>';
}


/**
 * 根据分校编号过滤班级。 新增记录时，选择分校后，只能选择选定分校的班级。
 * @param classList     班级列表。可能属于多个分校。  [{class_no: no, ...}, ...]
 *      必须存在 class_no 属性。
 * @param school_no     分校编号
 * @returns {*}
 */
function danceFilterClassByNo(classList, school_no) {
    var classNoFilter = school_no + '-BJ-';
    var rows = [];
    for (var i = 0; i < classList.length; i++) {
        if(classList[i].class_no.indexOf(classNoFilter) === 0){
            rows.push(classList[i]);
        }
    }
    return rows;
}

///////////////////////-------------------------------------------------------------------------------------------------

// 窗口操作 begin //////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * 打开url所指示的窗口。
 * @param dgId      父窗口datagrid id， 用于判断父窗口是否关闭，及操作 datagrid中的combobox重新加载数据
 * @param panelId   窗口所在的 panel id
 * @param winId     窗口 id
 * @param url       窗口 所在 html 文件
 * @param idx       dgId中要重新加载数据的combobox所在 行
 * @param field     dgId中要重新加载数据的combobox所在 字段
 * @param title     窗口标题，用于提示重复打开窗口
 */
function dcNewWindow(dgId, panelId, winId, url, idx, field, title) {
    if(!document.getElementById(panelId)){
        console.log('dcNewWindow append:', panelId);
        $(document.body).append('<div id=' + panelId +  '></div>');
    }
    if (document.getElementById(winId)) {
        $.messager.alert('提示', '[' + title + ']窗口已打开！', 'info');
        return;
    }
    $('#'+panelId).panel({
        href: url,
        onDestroy: function () {
            if(document.getElementById(dgId)) {    // 窗口未被关闭
                var dg = $('#'+dgId);
                var ed = $(dg).datagrid('getEditor', {index:idx,field:field});
                if(ed) {
                    $(ed.target).combobox('reload');
                }
            }
        }
    });
}

// 父窗口要刷新的combobox(id: ccId)。 panel id 在 winId的基础上加上 '-Panel'
function dcNewWindowEx(winId, url, title, ccId) {
    var panelId = dcGetPanelId(winId);
    if(!document.getElementById(panelId)){
        $(document.body).append('<div id=' + panelId +  '></div>');
    }
    if (document.getElementById(winId)) {
        $.messager.alert('提示', '[' + title + ']窗口已打开！', 'info');
        return;
    }
    $('#'+panelId).panel({
        href: url,
        onDestroy: function () {
            if(document.getElementById(ccId)) {    // 父窗口未被关闭
                $('#'+ccId).combobox('reload');
            }
        }
    });
}

function dcNewWindowDg(winId, url, title, dgId) {
    var panelId = dcGetPanelId(winId);
    if(!document.getElementById(panelId)){
        $(document.body).append('<div id=' + panelId +  '></div>');
    }
    if (document.getElementById(winId)) {
        $.messager.alert('提示', '[' + title + ']窗口已打开！', 'info');
        return;
    }
    $('#'+panelId).panel({
        href: url,
        onDestroy: function () {
            if(document.getElementById(dgId)) {    // 父窗口未被关闭
                $('#'+dgId).datagrid('reload');
            }
        }
    });
}


function dcGetPanelId(winId) {
    return winId + '-Panel';
}

/**
 * 创建一个模态 Dialog
 *
 * @param id divId
 * @param _url Div链接
 * @param _title 标题
 * @param _width 宽度
 * @param _height 高度
 * @param _icon ICON图标
 */
function createModalDialog(id, _url, _title, _width, _height, _icon){
    $('body').append('<div id=' + id + ' style="padding:10px"></div>');
    if (_width == null) _width = 800;
    if (_height == null) _height = 500;

    $("#"+id).dialog({
        title: _title,
        width: _width, height: _height,
        cache: false,
        iconCls: _icon,
        href: _url,
        collapsible: false,
        minimizable:false, maximizable: true, resizable: false,
        modal: false,
        closed: true,
        buttons: [{
            text:'Ok', iconCls:'icon-ok', handler:function(){
                alert('ok');
            }
        },{
            text:'关闭', handler:function(){
                $("#"+id).dialog('close');
            }
        }],
        onBeforeClose: function () {
            $("#"+id).dialog('destroy');
        }
    }).dialog('open');
}

// 窗口操作 end ////////////////////////////////////////////////////////////////////////////////////////////////////////



// 集合操作 begin //////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * 差集
 * @param a     集合a， Array 类型
 * @param b     集合b， Array 类型
 * @returns {*} a - b的结果，Array 类型
 */
function setDifference(a, b) {  // 差集 a - b
    var diff = a.slice(0);
    for(var i = 0; i < a.length; i++){
        for(var j = 0; j < b.length; j++){
            if(a[i] === b[j]){
                diff.splice(i, 1);
            }
        }
    }
    return diff;
}

/**
 * 交集
 * @param a     Array类型
 * @param b
 * @returns {Array}
 */
function setIntersection(a, b) { // 交集 a & b
    var result = [];
    for(var i = 0; i < a.length; i++) {
        for(var j = 0; j < b.length; j++) {
            if(a[i] === b[j]) {
                result.push(a[i]);
                break;
            }
        }
    }
    return result;
}

// 集合操作 end /////////////////////////////////////////////////////////////////////////////

/**
 * 用于记录的增量修改。原纪录为a，变为记录b。 求出 增加，删除及不变的记录。
 * @param a     原纪录， Array类型
 * @param b     变更后的记录， Array类型
 * @returns {*[]}   0, 需要删除的记录； 1，需要增加的记录；2，为改变的记录。
 */
function dcFindChange(a, b) {
    return [setDifference(a,b), setDifference(b,a), setIntersection(a,b)]
}

/**
 * 用于增量修改记录。判断在原纪录基础上的删、改、增情况。
 *      var aa = [{id: 1, name:'Tom'},{id:2, name:'Peter'}]; 原始记录
 *      var bb = [{name:'Alice'}, {id:2, name: 'PP'}];       最终记录。
 *      var chg = dcRecordsChanged(aa, bb, 'id')
 *      则需要增加bb中的第一条，修改为bb中第二条，删除aa中第一个条。
 *      返回值为 {add:[0], del:[0], upd:[1]}
 * @param oldR      原始记录 Array  [ {}, {}]
 * @param newR      修改后的记录 Array  [ {}, {}]
 * @param field     比较字段，用于判断增、改、删
 * @returns {{add: Array, del: Array, upd: Array}}
 */
function dcRecordsChanged(oldR, newR, field) {  // 求 增、改、删 记录的索引
    var addIdx = [];    // 要增加记录的下标数组
    var delIdx = [];
    var updIdx = [];
    var ori = [];   // 原始记录比较字段(field)数组
    var cur = [];   // 当前记录比较字段(field)数组
    var i, j;
    for(i=0; i< oldR.length; i++){
        if(oldR[i].hasOwnProperty(field)){
            ori.push(oldR[i][field]);
        }
    }
    for(i=0; i< newR.length; i++){
        if(newR[i].hasOwnProperty(field)){
            cur.push(newR[i][field]);
        } else {
            addIdx.push(i);
        }
    }
    var delK = setDifference(ori, cur);
    var updK = setIntersection(cur, ori);
    for(j=0; j< delK.length; j++){
        for(i=0; i< oldR.length; i++){
            if(oldR[i].hasOwnProperty(field) && oldR[i][field] === delK[j]){
                delIdx.push(i);
                break;
            }
        }
    }
    for(j=0; j< updK.length; j++){
        for(i=0; i<newR.length; i++){
            if(newR[i].hasOwnProperty(field) && newR[i][field] === updK[j]){
                updIdx.push(i);
                break;
            }
        }
    }

    return {add:addIdx, del:delIdx, upd:updIdx}
}


function dcLoadTree() {
    $.ajax({
        method: "POST",
        url: '/api/dance_tree_get',
        data: {}
    }).done(function(data) {
        if (data.errorCode === 0) {
            $('#treeStudent').tree('loadData', data['stu']);
            $('#treeDb').tree('loadData', data['db']);
            $('#treeTeacher').tree('loadData', data['teacher']);
            $('#treeSchool').tree('loadData', data['school']);
            $('#treeAsset').tree('loadData', data['asset']);
            $('#treeFinance').tree('loadData', data['finance']);
        } else {
            $.messager.alert('提示', data.msg, 'info');
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
        $.messager.alert('提示', msg, 'info');
    });
}