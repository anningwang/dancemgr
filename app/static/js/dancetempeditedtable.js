
'use strict';

var opts_school = {
    'defaultSelField' : 'school_name',
    'fieldValidate' : {'school_name': checkNotEmpty},
    'queryText': '分校名称',
    'queryPrompt': '校名拼音首字母查找',
    'who': 'DanceSchool',
    'columns': [[
        {field: 'ck', checkbox:true },   // checkbox
        // {field: 'no', title: '序号',  width: 15, align: 'center' },  // 能自动显示行号，则不再需要自己实现
        // {field: 'id', title: 'id',  width: 30, align: 'center' },
        {field: 'school_no', title: '分校编号', width: 100, align: 'center'},
        {field: 'school_name', title: '分校名称*', width: 140, align: 'center', editor: 'textbox'},
        {field: 'address', title: '分校地址', width: 400, align: 'center', editor:'textbox'},
        {field: 'manager', title: '负责人姓名', width: 70, align: 'center', editor:'textbox'},
        {field: 'manager_phone', title: '负责人手机', width: 120, align: 'center', editor:'textbox'},
        {field: 'tel', title: '分校联系电话', width: 120, align: 'center', editor:'textbox'},
        {field: 'zipcode', title: '邮政编码', width: 70, align: 'center', editor:'textbox'},
        {field: 'remark', title: '备注', width: 200, align: 'center', editor:'textbox'},
        {field: 'recorder', title: '录入员', width: 90, align: 'center'}
    ]]
};

var opts_user = {
    'defaultSelField' : 'name',
    'fieldValidate' : {'name': checkNotEmpty},
    'queryText': '用户名',
    'queryPrompt': '用户拼音首字母查找',
    'who': 'DanceUser',
    'columns': [[
        {field: 'ck', checkbox:true },   // checkbox
        {field: 'user_no', title: '用户编号', width: 100, align: 'center'},
        {field: 'name', title: '用户名称*', width: 140, align: 'center', editor: 'textbox'},
        {field: 'pwd', title: '用户密码', width: 100, align: 'center', editor:'textbox'},
        {field: 'phone', title: '联系电话', width: 140, align: 'center', editor:'textbox'},
        {field: 'role_id', title: '所属角色', width: 120, align: 'center', editor:'textbox'},
        {field: 'school_id', title: '允许管理分校', width: 400, align: 'center',
            formatter:function(value,row){
                return row.school_name;
            },
            editor: {
                type:'combobox',
                options:{
                    url:'/dance_school_list_get',
                    method:'post',
                    valueField:'school_id',
                    textField:'school_name',
                    multiple:true,
                    editable:false,
                    panelHeight:'auto'
                }
            }
        },
        {field: 'recorder', title: '录入员', width: 90, align: 'center'}
    ]]
};

// 字段校验函数 ////////////////////////////////////////////////////////////////////
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

    //var defaultSelField = 'school_name';     // 编辑表格时，默认选择的列
    //var fieldValidate = {'school_name': checkNotEmpty};     // 需要验证的字段
    var fieldValidate = options.fieldValidate;

    var BTN_STATUS = {  EDIT: 1,  UNDO: 2,  SAVE: 3 };      // 状态机 EDIT<-> UNDO
    var dance_condition = '';               // 主datagrid表查询条件


    $(dg).datagrid({
        // title: '分校信息',
        // iconCls: 'icon-a_detail',
        fit: true,
        //fitColumns: true,
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
        toolbar: [{
            text:"增加行", iconCls:'icon-add',id:btnAdd,disabled:true, handler:onAdd
        }, {
            text:"编辑表格", iconCls:'icon-edit_line', id:btnEdit, handler:onEdit
        }, {
            text:"撤销编辑", iconCls:'icon-undo', id:btnUndo, handler:onUndo
        }, {
            text:"删除", iconCls:'icon-remove', id:btnDel, handler: onDel
        }, {
            text:"保存", iconCls:'icon-save', disabled:true, id:btnSave, handler: onSave
        }, '-',{
            text: options.queryText + '：<input id=' + ccId + '>'
        },{
            iconCls: 'icon-search', text:"查询", id:btnSearch, handler: onSearch
        }],
        columns: options.columns,
        onLoadSuccess: function () {
            $(dg).datagrid("fixRownumber");
            $(dg).datagrid('loaded');
        },
        onClickCell: onClickCell,
        onAfterEdit: getChangedData,
        onBeforeEdit: function (index,row) {
            if (!(index in dataOriginal)) {     // 不存在，则保存原始数据
                dataOriginal[index] = {};
                $.extend(dataOriginal[index], row);
            }
        },
        onEndEdit : function onEndEdit(index, row){
            var ed = $(this).datagrid('getEditor', {
                index: index,
                field: 'school_id'
            });

            if (ed) {
                console.log($(ed.target).combobox('getText'));
                console.log(ed.type);
                row.school_name = $(ed.target).combobox('getText');
            }
        }
    });

    $('#'+btnUndo).hide();      // 开始隐藏 Undo 按钮

    $('#'+ccId).combobox({     // 姓名 搜索框 combo box
        //url: url + '_query',
        //method:'post',
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
        //pageSize: _pageSize,//每页显示的记录条数，默认为10
        //pageList: [20, 30, 40, 50],//可以设置每页记录条数的列表
        beforePageText: '第',//页数文本框前显示的汉字
        afterPageText: '页, 共 {pages} 页',
        displayMsg: '当前记录 {from} - {to} , 共 {total} 条记录',
        onSelectPage: function (pageNumber, pageSize) {
            $(dg).datagrid('loading');  // 打开等待div
            console.log('pageNo=' + pageNumber + " pageSize=" + pageSize);
            // 改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
            var gridOpts = $(dg).datagrid('options');
            gridOpts.pageNumber = pageNumber;
            gridOpts.pageSize = pageSize;

            _pageSize = pageSize;
            _pageNo = pageNumber;
            doAjaxGetData();
        }
    });

    doAjaxGetData();        /// 开始打开页面，需要查询数据

    // 先通过ajax获取数据，然后再传给datagrid
    function doAjaxGetData () {
        $.ajax({
            method: 'POST',
            url: url + '_get',
            async: true,
            dataType: 'json',
            data: {'rows': _pageSize, 'page': _pageNo, 'condition': dance_condition}
        }).done(function(data) {
            if (data.errorCode == 0) {
                // 注意此处从数据库传来的data数据有记录总行数的total列和 rows
                dg.datagrid('loadData', data);
                _total = data.total;
            } else {
                $.messager.alert('提示', data.msg, 'info');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            dg.datagrid('loaded');
            var msg = $.format("请求失败：{0}。错误码：{1}({2}) ", [textStatus, jqXHR.status, errorThrown]);
            $.messager.alert('提示', msg, 'info');
        });
    }


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
            $(dg).datagrid('selectRow', index)
                .datagrid('beginEdit', index);
            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            editIndex = index;
        }
    }

    function getChangedData(index,row,changes){
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
            dataChanged.splice(p, 0, {'rowIndex': index, 'row': changes, 'id':row.id});
            i = p;
        }else {
            $.extend( dataChanged[i].row, changes );
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

        // $('#'+btnSave).linkbutton(isDataChanged() ? 'enable':'disable');
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
            //var rows = $(dg).datagrid('getChanges');
            //alert(rows.length+' rows are changed!');
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
                } else {
                    $.messager.alert({title: '错误', msg: data.msg, icon:'error'});
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                //console.log(jqXHR);
                var msg = $.format("请求失败：{0}。错误码：{1}({2}) ", [textStatus, jqXHR.status, errorThrown]);
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
        var row = $(dg).datagrid('getSelections');
        if (row.length == 0) {
            $.messager.alert('提示', '请选择要删除的数据行！' , 'info');
            return false;
        } else {
            var text = '数据删除后不能恢复！是否要删除选中的 ' + row.length + '条 数据？';
            $.messager.confirm('确认删除', text , function(r){
                if (r){
                    var ids = [];
                    for (var i = 0; i < row.length; i++) {
                        ids.push(row[i].id);
                    }
                    //console.log('del:' + ids);
                    $.ajax({
                        method: 'POST',
                        url: '/dance_del_data',
                        dataType: 'json',
                        data: {'ids': ids, 'who':options.who},
                        success: function (data,status) {
                            console.log('success in ajax. data.msg=' + data.msg + " status=" + status);
                            if (data.errorCode != 0) {
                                $.messager.alert({
                                    title: '错误',
                                    msg: data.msg,
                                    icon:'error'
                                });
                                return false;
                            }
                            $(dg).datagrid('loading');
                            _total -= row.length;
                            if (_pageNo > 1 && (_pageNo-1)*_pageSize >= _total) { _pageNo--; }
                            doAjaxGetData();
                        },
                        error: function (XMLHttpRequest, textStatus, errorThrown) {
                            console.log('error in ajax. XMLHttpRequest=', + XMLHttpRequest
                                + ' textStatus=' + textStatus + ' errorThrown=' + errorThrown);
                        }
                    });
                }
            });
        }
    }   // end of 删除数据 //////////////////////////////////////

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
}
