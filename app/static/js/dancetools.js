
'use strict';

var g_dc_username = '';

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
            var result = source;
            if(typeof(args) === "object"){
                if(args.length===undefined){
                    for (var key in args) {
                        if(args[key]!==undefined){
                            var reg = new RegExp("({" + key + "})", "g");
                            result = result.replace(reg, args[key]);
                        }
                    }
                }else{
                    for (var i = 0; i < args.length; i++) {
                        if (args[i] !== undefined) {
                            var reg = new RegExp("({[" + i + "]})", "g");
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

})(jQuery);


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

