
'use strict';

var danceClassCallFunc = undefined;

function danceAddTabClassDatagrid(divId, title, tableId, condition) {
    //console.log(tableId);
    var parentDiv = $('#'+divId);
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
        danceClassCallFunc(condition);
    } else {
        var content = '<div style="min-width:1024px;width:100%;height:100%"><table id=' + tableId + '></table></div>';
        $(parentDiv).tabs('add', {
            title: title,
            content: content,
            closable: true
        });
        danceClassCallFunc = danceCreateClassDatagrid(tableId, '/dance_class', condition);
    }
}


function danceCreateClassDatagrid(datagridId, url, condition) {
    var _pageSize = 30;
    var _pageNo = 1;
    var ccId = 'cc' + datagridId;       // Combo box,班级名称查找框ID
    var sbId = 'sb' + datagridId;
    var dg = $('#' + datagridId);
    var queryCondition = {};

    $.extend(queryCondition, condition);
    $(dg).datagrid({
        // title: '班级信息',
        iconCls: 'icon-a_detail',
        fit: true,
        fitColumns: true,
        pagination: true,   // True to show a pagination toolbar on datagrid bottom.
        singleSelect: true, // True to allow selecting only one row.
        loadMsg: '正在加载数据...',
        border: false,
        striped: true,
        pageNumber: 1,
        pageSize: _pageSize,     //每页显示条数
        nowrap: true,   // True to display data in one line. Set to true can improve loading performance.
        pageList: [20, 30, 40, 50, 100],   //每页显示条数供选项
        rownumbers: true,   // True to show a row number column.
        toolbar: [{
            text:"增加", iconCls:'icon-add',
            handler:function(){
                alert('add');
            }
        }, {
            text:"编辑/查看", iconCls:'icon-edit',
            handler:function(){
                alert('edit');
            }
        }, {
            text:"删除", iconCls:'icon-remove',
            handler:function(){
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
                            //console.log('del:' + ids);
                            $.ajax({
                                method: 'POST',
                                url: '/dance_del_data',
                                dataType: 'json',
                                data: {'ids': ids, 'who': 'DanceClass'}
                            }).done(function(data) {
                                if (data.errorCode == 0) {
                                    $(dg).datagrid('loading');
                                    var gridOpts = $(dg).datagrid('getPager').pagination('options');
                                    var _total = gridOpts.total - row.length;
                                    if (_pageNo > 1 && (_pageNo-1)*_pageSize >= _total) { _pageNo--; }
                                    doAjaxGetData();
                                } else {
                                    $.messager.alert('提示', data.msg, 'error');
                                }
                            }).fail(function(jqXHR, textStatus, errorThrown) {
                                dg.datagrid('loaded');
                                var msg = "请求失败}。错误码：{0}({1})".format(jqXHR.status, errorThrown);
                                $.messager.alert('提示', msg, 'info');
                            });
                            // end of 删除数据 //////////////////////////////////////
                        }
                    });
                }
            }
        }, '-',{
            text: '班级名称：<input id=' + ccId + '>'
        },{
            iconCls: 'icon-search', text:"查询",  /// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
            handler: function () {
                alert('查询');
            }
        }, '-', {id: sbId}
        ],
        columns: [[
            {field: 'ck', checkbox:true },   // checkbox
            // {field: 'no', title: '序号',  width: 15, align: 'center' },  //能自动显示行号，则不再需要自己实现
            // {field: 'id', title: 'id',  width: 30, align: 'center' },
            {field: 'cno', title: '班级编号', width: 100, align: 'center'},
            {field: 'school_name', title: '分校名称', width: 140, align: 'center'},
            {field: 'class_name', title: '班级名称', width: 160, align: 'center'},
            {field: 'begin_year', title: '开班年份', width: 70, align: 'center'},
            {field: 'class_type', title: '班级类型', width: 70, align: 'center'},
            {field: 'class_style', title: '班级形式', width: 120, align: 'center'},
            {field: 'teacher', title: '授课老师姓名', width: 120, align: 'center'},
            {field: 'cost_mode', title: '收费模式', width: 120, align: 'center'},
            {field: 'cost', title: '收费标准', width: 70, align: 'center'}
        ]],
        onLoadSuccess: function () {
            $(dg).datagrid("fixRownumber");
            $(dg).datagrid('loaded');
        }
    });

    $('#'+ccId).combobox({     // 姓名 搜索框 combo box
        prompt: '班名拼音首字母查找',
        valueField: 'id',
        textField: 'text',
        width: 140,
        panelHeight: "auto"
    });

    $('#'+sbId).switchbutton({
        onText: '单选', offText: '多选', checked: true,
        onChange: function (checked) {
            var gridOpts = $(dg).datagrid('options');
            gridOpts.singleSelect = checked;
        }
    });

    var pager = $(dg).datagrid('getPager');
    $(pager).pagination({
        //pageSize: _pageSize,//每页显示的记录条数，默认为10
        //pageList: [20, 30, 40, 50],//可以设置每页记录条数的列表
        beforePageText: '第',//页数文本框前显示的汉字
        afterPageText: '页, 共 {pages} 页',
        displayMsg: '当前记录 {from} - {to} , 共 {total} 条记录',
        buttons:[{
            text:'导入', iconCls: 'icon-page_excel',
            handler:function(){
                danceModuleName = 'DanceClass';
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
                danceModuleName = 'DanceClass';
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
        }],
        onSelectPage: function (pageNumber, pageSize) {
            $(dg).datagrid('loading');  // 打开等待div
            //console.log('pageNo=' + pageNumber + " pageSize=" + pageSize);
            // 改变opts.pageNumber和opts.pageSize的参数值，用于下次查询传给数据层查询指定页码的数据
            //var gridOpts = $(dg).datagrid('options');
            //gridOpts.pageNumber = pageNumber;
            //gridOpts.pageSize = pageSize;

            _pageSize = pageSize;
            _pageNo = pageNumber;
            doAjaxGetData();
        }
    });

    // 先通过ajax获取数据，然后再传给datagrid
    var doAjaxGetData = function (cond) {
        if (cond) {
            queryCondition = {};
            $.extend(queryCondition, cond);
            queryCondition['rows'] = _pageSize;
            _pageNo = 1;
            queryCondition['page'] = _pageNo;
        } else {
            queryCondition['rows'] = _pageSize;
            queryCondition['page'] = _pageNo;
        }
        $.ajax({
            method: 'POST',
            url: url + '_get',
            async: true,
            dataType: 'json',
            data: queryCondition
        }).done(function(data) {
            if (data.errorCode == 0) {
                console.log(data);
                // 注意此处从数据库传来的data数据有记录总行数的total列和 rows
                var gridOpts = $(dg).datagrid('options');
                gridOpts.pageNumber = _pageNo;
                gridOpts.pageSize = _pageSize;
                var pagerOpts = $(dg).datagrid('getPager').pagination('options');
                pagerOpts.pageNumber = _pageNo;
                pagerOpts.pageSize = _pageSize;
            } else {
                $.messager.alert({title: '错误', msg: data.msg, icon:'error'});
            }
            dg.datagrid('loadData', data);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            //console.log(jqXHR);
            var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
            $.messager.alert('提示', msg, 'info');
        });
    };

    doAjaxGetData();
    
    return doAjaxGetData;
}