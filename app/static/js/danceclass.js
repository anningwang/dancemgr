
'use strict';

function danceCreateClassDatagrid(datagridId, url) {
    var _pageSize = 30;
    var _pageNo = 1;
    var ccId = 'cc' + datagridId;       // Combo box,姓名查找框ID
    var dg = $('#' + datagridId);

    $(dg).datagrid({
        // title: '班级信息',
        iconCls: 'icon-a_detail',
        fit: true,
        //fitColumns: true,
        pagination: true,   // True to show a pagination toolbar on datagrid bottom.
        // singleSelect: true, // True to allow selecting only one row.
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
                            console.log('del:' + ids);
                            $.ajax({
                                method: 'POST',
                                url: '/dance_del_data',
                                dataType: 'json',
                                data: {'ids': ids, 'who': 'DanceClass'},
                                success: function (data,status) {
                                    console.log('success in ajax. data.MSG=' + data.MSG + " status=" + status);
                                    if (data.ErrorCode != 0) {
                                        $.messager.alert({
                                            title: '错误',
                                            msg: data.MSG,
                                            icon:'error', // Available value are: error,question,info,warning.
                                            fn: function(){
                                                //...
                                            }
                                        });
                                        return false;
                                    }
                                    $(dg).datagrid('loading');
                                    var gridOpts = $(dg).datagrid('getPager').pagination('options');
                                    var _total = gridOpts.total - row.length;
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
            }
        }, '-',{
            text: '班级名称：<input id=' + ccId + ' name="dept" value="">'
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
            {field: 'cno', title: '班级编号', width: 100, align: 'center'},
            {field: 'school_name', title: '分校名称', width: 100, align: 'center'},
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
        // url: '/dance_search',
        prompt: '班名拼音首字母查找',
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
            },
            error: function () {
                console.log('error in ajax.');
            }
        });
    }

}