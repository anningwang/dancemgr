
'use strict';

function danceCreateSchoolDatagrid(datagridId, url) {
    var _pageSize = 30;
    var _pageNo = 1;
    var _total = 0;
    var ccId = 'cc' + datagridId;   // Combo box,姓名查找框ID
    var dg = $('#' + datagridId);
    var editIndex = undefined;      // 被编辑行的索引
    var isEditStatus = false;      // 表格处于编辑状态
    var dataOriginal = {};          // 原始数据，未修改前的数据
    var dataChanged = [];           // 当编辑表格时，记录发生变化的行及变化内容

    $(dg).datagrid({
        // title: '分校信息',
        iconCls: 'icon-a_detail',
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
            text:"增加行", iconCls:'icon-add',
            handler:function(){
                $(dg).datagrid('appendRow',{});
            }
        }, {
            text:"编辑行", iconCls:'icon-edit',
            handler:function(){
                isEditStatus = true;
                var row = $(dg).datagrid('getSelected');
                if (row) {
                    var rowIdx = $(dg).datagrid('getRowIndex', row);
                    onClickCell(rowIdx, 'school_name');     /// *** 修改点 ***
                }
            }
        }, {
            text:"删除", iconCls:'icon-remove', handler: onDel
        }, {
            text:"保存", iconCls:'icon-save', handler: onSave
        }, '-',{
            text: '分校名称：<input id=' + ccId + ' name="dept" value="">'
        },{
            iconCls: 'icon-search', text:"查询",  /// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
            handler: function () {
                alert('查询');
            }
        }],
        columns: [[
            {field: 'ck', checkbox:true },   // checkbox
            // {field: 'no', title: '序号',  width: 15, align: 'center' },  //能自动显示行号，则不再需要自己实现
            {field: 'id', title: 'id',  width: 30, align: 'center' },
            {field: 'school_no', title: '分校编号', width: 100, align: 'center'},
            {field: 'school_name', title: '分校名称', width: 140, align: 'center', editor: { type: 'validatebox', options: { required: true} }},
            {field: 'address', title: '分校地址', width: 400, align: 'center', editor:'textbox'},
            {field: 'manager', title: '负责人姓名', width: 70, align: 'center', editor:'textbox'},
            {field: 'manager_phone', title: '负责人手机', width: 120, align: 'center', editor:'textbox'},
            {field: 'tel', title: '分校联系电话', width: 120, align: 'center', editor:'textbox'},
            {field: 'zipcode', title: '邮政编码', width: 70, align: 'center', editor:'textbox'},
            {field: 'remark', title: '备注', width: 200, align: 'center', editor:'textbox'},
            {field: 'recorder', title: '录入员', width: 70, align: 'center'}
        ]],
        onLoadSuccess: function () {
            $(dg).datagrid("fixRownumber");
            $(dg).datagrid('loaded');
        },
        onClickCell: onClickCell,
        onEndEdit: function (index,row,changes) {
            ///console.info(index, row, changes);
        },
        onAfterEdit: getChangedData,
        onBeginEdit: function (index,row) {
            ///console.info(index, row);
        },
        onBeforeEdit: function (index,row) {
            ///console.info(index, row);
            if (!(index in dataOriginal)) {     // 不存在，则保存原始数据
                dataOriginal[index] = {};
                $.extend(dataOriginal[index], row);
            }
        },
        onCancelEdit: function (index,row) {
            ///console.info(index, row);
        }
    });

    $('#'+ccId).combobox({     // 姓名 搜索框 combo box
        // url: '/dance_search',
        prompt: '校名拼音首字母查找',
        valueField: 'id',
        textField: 'text',
        width: 140,
        panelHeight: "auto"
        // label: '姓名：'
    });

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

    doAjaxGetData();

    // 先通过ajax获取数据，然后再传给datagrid
    function doAjaxGetData () {
        $.ajax({
            method: 'POST',
            url: url,
            async: true,
            dataType: 'json',
            data: {'rows': _pageSize, 'page': _pageNo},
            success: function (data) {
                console.log(data);
                // 注意此处从数据库传来的data数据有记录总行数的total列和 rows
                dg.datagrid('loadData', data);
                _total = data.total;
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log('error in ajax. XMLHttpRequest=', + XMLHttpRequest
                    + ' textStatus=' + textStatus + ' errorThrown=' + errorThrown);
                dg.datagrid('loaded');
                $.messager.alert({
                    title: '错误',
                    msg: XMLHttpRequest,
                    icon:'error' // Available value are: error,question,info,warning.
                });
            }
        });
    }   /// end of doAjaxGetData()

    //// 编辑datagrid begin //////////////////////////////////////////////////
    function endEditing(){
        if (editIndex == undefined){return true}
        if ($(dg).datagrid('validateRow', editIndex)){
            $(dg).datagrid('endEdit', editIndex);
            editIndex = undefined;
            return true;
        } else {
            return false;
        }
    }   /// end of endEditing()

    function onClickCell(index, field){
        if (!isEditStatus) { return; }
        if (editIndex != index){
            var gridOpts = $(dg).datagrid('options');
            gridOpts.singleSelect = true;
            if (endEditing()){
                $(dg).datagrid('selectRow', index)
                    .datagrid('beginEdit', index);
                var ed = $(dg).datagrid('getEditor', {index:index,field:field});
                if (ed){
                    ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
                }
                editIndex = index;
            } else {
                setTimeout(function(){
                    $(dg).datagrid('selectRow', editIndex);
                },0);
            }
        }
    }   /// end of onClickCell()

    function getChangedData(index,row,changes){
        ///console.info(index, row, changes);
        var i;
        for (i = 0; i< dataChanged.length; i++) {
            if (dataChanged[i].rowIndex == index) {
                break;    // 确定下标 i 的位置，找不到则在最后位置写入变化的值
            }
        }
        if (i == dataChanged.length) {
            dataChanged[i]= {'rowIndex': index, 'row': changes};
        }else {
            $.extend( dataChanged[i].row, changes );
        }

        ///console.log(dataChanged);
        var cmpChanges = {};
        var bHasChg = false;
        for (var k in dataChanged[i].row) {
            if (!dataOriginal[index][k] && !dataChanged[i].row[k]) {

            } else {
                cmpChanges[k] = dataChanged[i].row[k];
                bHasChg = true;
            }
        }
        if (bHasChg) {
            dataChanged[i].row = cmpChanges;
            ///console.log(dataChanged);
            // 给发生改变的单元格，增加颜色，以突出显示
            setCellStyle(dg, cmpChanges, true);
        } else {
            dataChanged.pop();
        }
    }

    // 设置/清除 单元样式
    var _old_background = undefined;
    function setCellStyle(dg, fieldValue, bSet) {
        var panel =  $(dg).datagrid('getPanel');
        var tr = panel.find('div.datagrid-body tr');
        for (var kc in fieldValue) {
            if (!fieldValue.hasOwnProperty(kc)) { continue; }
            tr.each(function(){
                var td = $(this).children('td[field=' + kc + ']');  // 取出行中这一列。
                var textValue = td.children("div").text(); // 取出该列的值。
                if(textValue == fieldValue[kc]){    // 如果该值，符合某个条件
                    if (bSet) {
                        _old_background = td.children("div").css("background");
                        td.children("div").css({
                            "background": "red", "color": "blue"
                        });
                    } else {    /// 清除
                        td.children("div").css({
                            "background": _old_background, "color": "black"
                        });
                    }
                }
            });
        }
    }

    /// 保存单元格修改
    function onSave(){
        if (endEditing()){
            var rows = $(dg).datagrid('getChanges');
            ///alert(rows.length+' rows are changed!');
            console.log('onSave---');
            console.log(dataChanged);
            var dataToServer = [];
            for (var i = 0; i< dataChanged.length; i++) {

            }

            $.ajax({
                method: 'POST',
                url: '/dance_school_update',      /// *** 修改点 ***
                dataType: 'json',
                data: {'data': dataToServer },
                success: function (data,status) {
                    console.log('success in ajax. data.MSG=' + data.MSG + " status=" + status);
                    if (data.ErrorCode != 0) {
                        $.messager.alert({
                            title: '错误',
                            msg: data.MSG,
                            icon:'error', // Available value are: error,question,info,warning.
                        });
                        return false;
                    }
                    $(dg).datagrid('loading');
                    var gridOpts = $(dg).datagrid('getPager').pagination('options');
                    var _total = gridOpts.total;
                    if (_pageNo > 1 && (_pageNo-1)*_pageSize >= _total) { _pageNo--; }
                    doAjaxGetData();

                    for (var i = 0; i <dataChanged.length; i++) {
                        setCellStyle(dg, dataChanged[i].row, false);
                    }
                    dataChanged = [];       /// 清空
                    dataOriginal = {};
                    $(dg).datagrid('acceptChanges');
                    isEditStatus = false;
                    var gridOpts = $(dg).datagrid('options');
                    gridOpts.singleSelect = false;

                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log('error in ajax. XMLHttpRequest=', + XMLHttpRequest
                        + ' textStatus=' + textStatus + ' errorThrown=' + errorThrown);
                }
            });
        }
    }
    //// 编辑datagrid end //////////////////////////////////////////////////

    // 删除数据
    function onDel() {
        var row = $(dg).datagrid('getSelections');
        if (row.length == 0) {
            $.messager.alert('提示', '请选择要删除的数据行！' , 'info');
            return false;
        } else {
            var text = '数据删除后不能恢复！是否要删除选中的 ' + row.length + '条 数据？';
            $.messager.confirm('确认删除', text , function(r){
                if (r){
                    // 删除数据 //////////////////////////////////////
                    var ids = [];
                    for (var i = 0; i < row.length; i++) {
                        ids.push(row[i].id);
                    }
                    ///console.log('del:' + ids);
                    $.ajax({
                        method: 'POST',
                        url: '/dance_del_data',
                        dataType: 'json',
                        data: {'ids': ids, 'who': 'DanceSchool'},       /// *** 修改点 ***
                        success: function (data,status) {
                            console.log('success in ajax. data.MSG=' + data.MSG + " status=" + status);
                            if (data.ErrorCode != 0) {
                                $.messager.alert({
                                    title: '错误',
                                    msg: data.MSG,
                                    icon:'error', // Available value are: error,question,info,warning.
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
                    // end of 删除数据 //////////////////////////////////////
                }
            });
        }
    }   /// end of onDel()

}   /// end of danceCreateSchoolDatagrid()