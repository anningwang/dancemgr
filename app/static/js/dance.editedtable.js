
'use strict';

// 字段校验函数
// return value: true - check pass. false - not pass.
function checkNotEmpty(text) {
    return text;
}

function danceCreateEditedDatagrid(datagridId, url, options) {
    var _pageSize = 30;
    var _pageNo = 1;
    var _total = 0;
    var ccId = 'cc' + datagridId;   // Combo box,姓名查找框ID
    var dg = $('#' + datagridId);
    var editIndex = undefined;      // 被编辑行的索引
    var isEditStatus = false;      // 表格处于编辑状态
    var dataOriginal = {};          // 原始数据，未修改前的数据
    var dataChanged = [];           // 当编辑表格时，记录发生变化的行及变化内容

    var btnSave = 'save' + datagridId;      // 增加按钮 ID  datagrid toolbar
    var btnDel = 'del' + datagridId;        // 删除按钮 ID
    var btnEdit = 'edit' + datagridId;      // 编辑按钮 ID
    var btnUndo = 'undo' + datagridId;      // Undo button ID
    var btnAdd = 'add' + datagridId;        // Add button ID
    var btnSearch = 'search' + datagridId;  // Search button ID
    var fieldValidate = options.fieldValidate;  // 需要验证的字段

    var BTN_STATUS = {  EDIT: 1,  UNDO: 2,  SAVE: 3 };      // 状态机 EDIT<-> UNDO
    var dance_condition = '';               // 主datagrid表查询条件


    $(dg).datagrid({
        fit: true,
        fitColumns: true,
        pagination: true,   // True to show a pagination toolbar on datagrid bottom.
        //singleSelect: true, // True to allow selecting only one row.
        loadMsg: '正在加载数据...',
        border: false,
        striped: true,
        pageNumber: 1,
        pageSize: _pageSize,     //每页显示条数
        nowrap: true,   // True to display data in one line. Set to true can improve loading performance.
        pageList: [20, 30, 40, 50, 100],   //每页显示条数供选项
        rownumbers: true,   // True to show a row number column.
        toolbar: [
            {text:"增加行", iconCls:'icon-add',id:btnAdd,disabled:true, handler:onAdd},
            {text:"编辑表格", iconCls:'icon-edit_line', id:btnEdit, handler:onEdit},
            {text:"撤销编辑", iconCls:'icon-undo', id:btnUndo, handler:onUndo},
            {text:"删除", iconCls:'icon-remove', id:btnDel, handler: onDel},
            {text:"保存", iconCls:'icon-save', disabled:true, id:btnSave, handler: onSave}, '-',
            {text: options.queryText + '<input id=' + ccId + '>'},
            {iconCls: 'icon-search', text:"查询", id:btnSearch, handler: onSearch}
        ],
        columns: options.columns,
        onLoadSuccess: function () {
            $(dg).datagrid("fixRownumber");
            $(dg).datagrid('loaded');
            var panel =  $(dg).datagrid('getPanel');
            panel.mousedown(function (event) {      // panel 鼠标按下事件
                //console.log(event);
                if (event.target.className === 'datagrid-body') { // datagrid-toolbar, datagrid-header-inner
                    endEditing();
                }
            });

            $(".dance_button").linkbutton({});
            $(".dance_menu").splitbutton({
                text:'菜单测试', plain:false,
                iconCls: 'icon-ok',
                menu: '#mm'
            });

            $('#mm').menu({
                hideOnUnhover:false
            });
        },
        onClickCell: onClickCell,
        onAfterEdit: getChangedData,
        onBeforeEdit: function (index,row) {
            if (!(index in dataOriginal)) {     // 不存在，则保存原始数据
                dataOriginal[index] = {};
                $.extend(dataOriginal[index], row);
            }
        },
        onEndEdit : function (index, row){
            var eds = $(dg).datagrid('getEditors', index);
            for(var i=0; i< eds.length; i++){
                if (eds[i].type === 'combobox'){
                    console.log('eds[i].field', eds[i].field);
                    var textField = getTextField(eds[i].field);
                    row[textField] = $(eds[i].target).combobox('getText');
                }
            }
        }
    });

    $('#'+btnUndo).hide();      // 开始隐藏 Undo 按钮

    $('#'+ccId).combobox({     // 姓名 搜索框 combo box
        //url: url + '_query',
        prompt: options.queryPrompt,
        valueField: 'value',
        textField: 'text',
        width: 140,
        //panelHeight: "auto",
        onChange:autoComplete,
        onSelect:function(record) {
            //$('#'+ccId).focus();
            //doAjaxGetData();          // 1.52 当用户选择后，函数 onSelect 会执行两次!!!
        }
    });

    autoComplete(dance_condition,'');
    function autoComplete (newValue,oldValue) {
        console.log('newValue=' + newValue + ' oldValue=' + oldValue);
        dance_condition = $.trim(newValue);
        $.post(url+'_query',{'condition': dance_condition }, function(data){
            $('#'+ccId).combobox('loadData', data);
        },'json');
    }

    var pager = dg.datagrid('getPager');
    $(pager).pagination({
        beforePageText: '第',//页数文本框前显示的汉字
        afterPageText: '页, 共 {pages} 页',
        displayMsg: '当前记录 {from} - {to} , 共 {total} 条记录',
        onSelectPage: function (pageNumber, pageSize) {
            $(dg).datagrid('loading');  // 打开等待div
            console.log('pageNo=' + pageNumber + " pageSize=" + pageSize);
            // 改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
            var pagerOpts = $(pager).pagination('options');
            pagerOpts.pageNumber = pageNumber;
            pagerOpts.pageSize = pageSize;

            _pageSize = pageSize;
            _pageNo = pageNumber;
            doAjaxGetData();
        },
        buttons:[{
            text:'导入', iconCls: 'icon-page_excel',
            handler:function(){
                danceModuleName = options.danceModuleName;
                danceModuleTitle = options.danceModuleTitle;
                $(document.body).append('<div id="danceCommWin"></div>');
                $('#danceCommWin').panel({
                    href:'/static/html/_import_win.html',
                    onDestroy: function () {
                        doAjaxGetData();
                    }
                });
            }
        },{
            text:'导出', iconCls:' icon-page_white_excel ',
            handler:function(){
                danceModuleName = options.danceModuleName;
                danceModuleTitle = options.danceModuleTitle;
                $(document.body).append('<div id="danceCommWin"></div>');
                $('#danceCommWin').panel({
                    href:'/static/html/_export_win.html'
                });
            }
        },{
            text:'打印', iconCls:'icon-printer',
            handler:function(){
                alert('print');
            }
        }]
    });


    /// 增加行
    function onAdd() {
        endEditing();
        $(dg).datagrid('appendRow',{});
        //console.log($(dg).datagrid('getRows'));
        $(dg).datagrid('selectRow', $(dg).datagrid('getRows').length - 1);
    }

    //// 编辑datagrid begin //////////////////////////////////////////////////
    /// toolbar edit button
    function onEdit() {
        if (!isEditStatus) {     /// 未开启编辑
            btnStatus(BTN_STATUS.EDIT);
            var row = $(dg).datagrid('getSelected');
            if (row) {
                var rowIdx = $(dg).datagrid('getRowIndex', row);
                onClickCell(rowIdx, options.defaultSelField);
            }
        }
    }

    function onUndo() {
        if (isEditStatus) {
            endEditing();
            if (isDataChanged()) {      // 表格有变化
                $.messager.confirm({
                    title: '询问',
                    msg: '修改的内容将会丢失，确定不保存，继续撤销修改吗？',
                    fn: function(bOK) {if (bOK) {btnStatus(BTN_STATUS.UNDO)}}
                });
            } else {btnStatus(BTN_STATUS.UNDO)}
        }
    }

    function endEditing(){
        if (editIndex == undefined){return;}
        $(dg).datagrid('endEdit', editIndex);
        editIndex = undefined;
    }

    function onClickCell(index, field){
        if (!isEditStatus) { return; }
        if (editIndex != index){
            endEditing();
            $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);
            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            editIndex = index;
        }
    }

    function getChangedData(index,row){     // ,changes unused
        var i;
        for (i = 0; i< dataChanged.length; i++) {
            if (dataChanged[i].rowIndex == index) {
                break;    // 确定下标 i 的位置，找不到则在最后位置写入变化的值
            }
        }
        if (i == dataChanged.length) {
            // 按照 index 排序
            var p = 0;
            while (p < i && index > dataChanged[p].rowIndex) {p++;}
            //dataChanged.splice(p, 0, {'rowIndex': index, 'row': changes, 'id':row.id});
            dataChanged.splice(p, 0, {'rowIndex': index, 'row': row, 'id':row.id});
            i = p;
        }else {
            //$.extend( dataChanged[i].row, changes );
            $.extend( dataChanged[i].row, row );
        }

        var cmpChanges = {};
        for (var k in dataChanged[i].row) {
            if (dataChanged[i].row.hasOwnProperty(k)) {
                if ((dataOriginal[index][k] || dataChanged[i].row[k]) &&  dataOriginal[index][k] != dataChanged[i].row[k] ){
                    cmpChanges[k] = dataChanged[i].row[k];
                }
            }
        }
        if ($.isEmptyObject(cmpChanges)) {
            //dataChanged.pop();
            dataChanged.splice(i,1);
            // 清除样式，datagrid自动清理了。不需要再显示清理
        } else {
            dataChanged[i].row = cmpChanges;
            setCellStyle(dg, dataChanged[i], true);      // 给发生改变的单元格，增加颜色，以突出显示
        }
    }

    // 设置/清除 单元样式
    var _old_background = undefined;
    function setCellStyle(dg, fieldValue, bSet) {
        var panel =  $(dg).datagrid('getPanel');
        var tr = panel.find('div.datagrid-body tr[id$="-2-' + fieldValue.rowIndex + '"]');
        for (var kc in fieldValue.row) {
            if (!fieldValue.row.hasOwnProperty(kc)) { continue; }
            var td = $(tr).children('td[field=' + kc + ']');  // 取出行中这一列。
            if (bSet) {
                _old_background = td.children("div").css("background");
                td.children("div").css({"background": "red", "color": "white"});
            }else {  /// 清除
                td.children("div").css({"background": _old_background, "color": "black"});
            }
        }

        for (var check in fieldValidate) {
            if(!fieldValidate.hasOwnProperty(check))
                continue;
            if (bSet) {
                td = $(tr).children('td[field=' + check + ']');  // 取出行中这一列。
                var isChged = false;
                if (fieldValue.id === undefined) {   // 新增
                    if (!(check in fieldValue.row) || !fieldValidate[check](fieldValue.row[check]) ) {
                        isChged = true;
                    }
                } else {   // 修改记录
                    if (check in fieldValue.row && !fieldValidate[check](fieldValue.row[check]) ) {
                        isChged = true;
                    }
                }
                if (isChged) {
                    var textValue = td.children("div").text(); // 取出该列的值。
                    if (!textValue) {
                        td.children("div").text('[请填写]');
                    }
                    _old_background = td.children("div").css("background");
                    td.children("div").css({"background": "purple", "color": "white"});
                }
            } else {
                td.children("div").css({"background": _old_background, "color": "black"});
            }
        }
    }

    // 表格编辑后，是否有内容变化。 返回 true 有变化； 返回 false， 无变化
    function isDataChanged() {
        return dataChanged.length;
    }

    // 合法性校验，false: 返回第一个未通过的行号。true: 通过校验。
    var whichRowInvalid = undefined;
    function validateDatagrid() {
        endEditing();
        for (var i = 0; i < dataChanged.length; i++) {
            for (var field in fieldValidate) {
                if(!fieldValidate.hasOwnProperty(field))
                    continue;
                if (dataChanged[i].id === undefined ) {  // 新增
                    if (!(field in dataChanged[i].row) || !(fieldValidate[field](dataChanged[i].row[field]))) {
                        whichRowInvalid = dataChanged[i].rowIndex;
                        return false;
                    }
                } else {    // 修改
                    if (field in dataChanged[i].row && !(fieldValidate[field](dataChanged[i].row[field]))) {
                        whichRowInvalid = dataChanged[i].rowIndex;
                        return false;
                    }
                }
            }
        }
        return true;
    }

    // 保存单元格修改
    function onSave(){
        if (validateDatagrid()){
            console.log('onSave---');
            console.log(dataChanged);
            var dataToServer = [];
            for (var i = 0; i< dataChanged.length; i++) {
                dataToServer[i] = { 'id': dataChanged[i].id === undefined ? 0 : dataChanged[i].id ,
                    'row': dataChanged[i].row };
            }

            if (!dataToServer.length){
                $.messager.alert('提示', '内容无变化！', 'info');
                return false;
            }

            $.ajax({
                method: 'POST',
                url: url + '_update',
                dataType: 'json',
                data: {'data': JSON.stringify(dataToServer)}
            }).done(function(data) {
                if (data.errorCode == 0) {
                    // $.messager.alert('提示', data.msg, 'info');
                    $(dg).datagrid('loading');
                    var gridOpts = $(dg).datagrid('getPager').pagination('options');
                    var _total = gridOpts.total;
                    if (_pageNo > 1 && (_pageNo-1)*_pageSize >= _total) { _pageNo--; }
                    doAjaxGetData();
                    btnStatus(BTN_STATUS.SAVE);

                    if( options.who === 'DanceSchool')
                        dcLoadTree();
                } else {
                    $.messager.alert({title: '错误', msg: data.msg, icon:'error'});
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                //console.log(jqXHR);
                var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
                $.messager.alert('提示', msg, 'info');
            });
        } else {
            var msg = '信息不完整，请检查后再保存!';
            $.messager.alert('提示', msg, 'warning');
        }
    }
    // 编辑datagrid end //////////////////////////////////////////////////

    // 查询 $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
    function onSearch() {
        doAjaxGetData();
    }

    // 删除数据 //////////////////////////////////////
    function onDel() {
        var rows = $(dg).datagrid('getSelections');
        if (rows.length == 0) {
            $.messager.alert('提示', '请选择要删除的数据行！' , 'info');
            return false;
        } else {
            var text = '数据删除后不能恢复！是否要删除选中的 ' + rows.length + '条 数据？';
            $.messager.confirm('确认删除', text , function(r){
                if (r){
                    doDel(rows);
                }
            });
        }
    }   // end of 删除数据 //////////////////////////////////////

    function doDel(rows) {
        var ids = [];
        for (var i = 0; i < rows.length; i++) {
            ids.push(rows[i].id);
        }
        //console.log('del:' + ids);
        $.ajax({
            method: 'POST',
            url: '/dance_del_data',
            dataType: 'json',
            data: {'ids': ids, 'who': options.who}
        }).done(function (data) {
            console.log('success in ajax. data.msg=' + data.msg);
            if (data.errorCode != 0) {
                $.messager.alert({title: '错误', msg: data.msg, icon:'error'});
                return false;
            }
            if( options.who === 'DanceSchool')
                dcLoadTree();

            $(dg).datagrid('loading');
            _total -= rows.length;
            if (_pageNo > 1 && (_pageNo-1)*_pageSize >= _total) { _pageNo--; }
            doAjaxGetData();
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.messager.alert('提示', "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown), 'info');
        });
    }

    var __pagerHeight = 30;
    function btnStatus(action) {
        var gridOpts = $(dg).datagrid('options');
        if (action === BTN_STATUS.EDIT) {
            isEditStatus = true;
            gridOpts.singleSelect = true;       //  单选行
            $('#'+btnDel).linkbutton('disable');
            $('#'+btnSave).linkbutton('enable');
            $('#'+btnAdd).linkbutton('enable');
            $('#'+btnSearch).linkbutton('disable');
            $('#'+ccId).combobox('disable');
            $('#'+btnEdit).hide();
            $('#'+btnUndo).show();
            __pagerHeight = $(pager).height() ? $(pager).height() : 30;
            $(pager).animate({height:'0px'}, 0);
            $(dg).datagrid('resize');
        } else if (action === BTN_STATUS.UNDO) {
            isEditStatus = false;
            gridOpts.singleSelect = false;
            $('#'+btnDel).linkbutton('enable');
            $('#'+btnSave).linkbutton('disable');
            $('#'+btnAdd).linkbutton('disable');
            $('#'+btnSearch).linkbutton('enable');
            $('#'+ccId).combobox('enable');
            $('#'+btnUndo).hide();
            $('#'+btnEdit).show();
            $(pager).animate({height:__pagerHeight}, 0);
            $(dg).datagrid('resize');

            $(dg).datagrid('rejectChanges');
            editIndex = undefined;
            dataChanged = [];       /// 清空
            dataOriginal = {};
        } else if (action === BTN_STATUS.SAVE) {
            for (var i = 0; i <dataChanged.length; i++) {      /// 清除样式
                setCellStyle(dg, dataChanged[i], false);
            }
            dataChanged = [];       /// 清空
            dataOriginal = {};
            $(dg).datagrid('acceptChanges');
        } else {
            console.log('Unknown action:' + action );
        }
    }


    // 先通过ajax获取数据，然后再传给datagrid
    var doAjaxGetData = function (cond) {
        var queryCondition = {};
        if (cond) {
            $.extend(queryCondition, cond);
            queryCondition.rows = _pageSize;
            _pageNo = 1;
            queryCondition.page = _pageNo;
        } else {
            queryCondition.rows = _pageSize;
            queryCondition.page = _pageNo;
            queryCondition.condition = dance_condition
        }

        $.ajax({
            method: 'POST',
            url: url + '_get',
            async: true,
            dataType: 'json',
            data: queryCondition
        }).done(function(data) {
            console.log('edit table receive:', data);
            if (data.errorCode == 0) {
                // 注意此处从数据库传来的data数据有记录总行数的total列和 rows
                dg.datagrid('loadData', data);
                _total = data.total;
            } else {
                $.messager.alert('提示', data.msg, 'info');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
            $.messager.alert('提示', msg, 'info');
        }).always(function () {
            dg.datagrid('loaded');
        });
    };
    doAjaxGetData();
    return doAjaxGetData;        /// 开始打开页面，需要查询数据
}
