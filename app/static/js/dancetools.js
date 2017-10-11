
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

    /** @author  Anningwang
     * @requires jQuery,EasyUI
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
    // console.log('complete');
    if (loadComplete)
        clearTimeout(loadComplete);
    loadComplete = setTimeout(CloseMask, 500);
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


//   someName_text      <-- someName
//   school_name        <-- school_id
//   some               <-- some_value
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
    console.log('getTextField: textField=', textField, ' valField=', valField);
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

function dcPrecision(value) {
    var str = Number(value).toFixed(2);
    return parseFloat(str);
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

/**
 * 将日期字符串（格式：yyyy-mm-dd）转换为 日期 Date 对象。
 * @param s
 * @returns {Date}
 */
function danceParser(s){
    if (!s) return new Date();
    var ss = (s.split('-'));
    var y = parseInt(ss[0],10);
    var m = parseInt(ss[1],10);
    var d = parseInt(ss[2],10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)){
        return new Date(y,m-1,d);
    } else {
        return new Date();
    }
}

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
    var panelId = winId + '-Panel';
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
    if (_width == null)
        _width = 800;
    if (_height == null)
        _height = 500;

    $("#"+id).dialog({
        title: _title,
        width: _width,
        height: _height,
        cache: false,
        iconCls: _icon,
        href: _url,
        collapsible: false,
        minimizable:false,
        maximizable: true,
        resizable: false,
        modal: false,
        closed: true,
        buttons: [{
            text:'Ok',
            iconCls:'icon-ok',
            handler:function(){
                alert('ok');
            }
        },{
            text:'Cancel',
            handler:function(){
                alert('cancel');
            }
        }],
        //buttons: '#dlg-buttons',
        onBeforeClose: function () {
            $("#"+id).dialog('destroy');
        }
    }).dialog('open');
}

// 创建窗口
//createModalDialog("editForm","/static/html/_test.html","测试界面", 800, 600, 'icon-save');

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
        url: '/dance_tree_student',
        data: {}
    }).done(function(data) {
        if (data.errorCode === 0) {
            $('#treeStudent').tree('loadData', data['stu']);
            $('#treeDb').tree('loadData', data['db']);
        } else {
            $.messager.alert('提示', data.msg, 'info');
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
        $.messager.alert('提示', msg, 'info');
    });
}