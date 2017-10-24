/**
 * Created by Administrator on 2017/10/22.
 */

/**
 * 增加 Datagrid 组件，并格式化，包括列名，增/删/查等相应函数
 * @param datagridId        Datagrid id
 * @param url               从服务器获取数据的url
 * @param condition         表格数据查询参数
 * @param options           创建表格所需要的 列名、查询提示文字、删除模块等信息
 */
function danceCreateCommDatagrid(datagridId, url, condition, options) {
    var _pageSize = 30;
    // var _pageNo = 1;
    var ccId = 'cc' + datagridId;       // Combo box,姓名查找框ID
    var sbId = 'sb' + datagridId;
    var dg = $('#' + datagridId);       // datagrid ID

    var dance_condition = '';               // 主datagrid表查询条件

    $(dg).datagrid({
        fit: true,
        url: url + '_get',
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
        queryParams: condition,
        toolbar: [{
            iconCls:'icon-add', text:"增加",      ///+++++++++++++++++++++++++++++++++++++++++++++
            handler:function(){
                var cond = $(dg).datagrid('options').queryParams;
                options.addEditFunc(options.page, url, cond);
            }}, {iconCls:'icon-edit', text:"编辑/查看",  ///@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
            handler:function(){
                var row = $(dg).datagrid('getSelections');
                if (row.length === 0) {
                    $.messager.alert('提示', '请选择要查看的行！' , 'info');
                    return false;
                } else {
                    var cond = $(dg).datagrid('options').queryParams;
                    options.addEditFunc(options.page, url, cond, row[0].id);
                }
            }},
            {iconCls:'icon-remove', text:"删除",  handler:doDel}, '-',
            {text: options.queryText + '<input id=' + ccId + '>'},
            {iconCls: 'icon-search', text:"查询", handler: function () {
                var cond = {};
                $.extend(cond, $(dg).datagrid('options').queryParams);
                cond.name = dance_condition;
                $(dg).datagrid('load', cond);
            }}, '-',
            {text: '<input id=' + sbId + '>'}
        ],
        columns: options.columns,
        onDblClickCell: function (index) {
            var rows = $(dg).datagrid('getRows');
            var row = rows[index];
            var cond = $(dg).datagrid('options').queryParams;
            options.addEditFunc(options.page, url, cond, row.id);
        }
    });

    $('#'+ccId).combobox({     // 搜索框 combo box
        prompt: options.queryPrompt,
        valueField: 'value',
        textField: 'text',
        width: 140,
        //panelHeight: "auto",
        onChange:autoComplete
    });

    autoComplete(dance_condition,'');
    function autoComplete (newValue) {  // ,oldValue
        //console.log('newValue=' + newValue + ' oldValue=' + oldValue);
        dance_condition = $.trim(newValue);
        var queryCondition = {};
        $.extend(queryCondition, $(dg).datagrid('options').queryParams);
        queryCondition.name = dance_condition;
        $.post(url+'_query',queryCondition, function(data){
            $('#'+ccId).combobox('loadData', data);
        },'json');
    }

    $('#'+sbId).switchbutton({
        onText: '单选', offText: '多选', checked: true,
        onChange: function (checked) {
            var gridOpts = $(dg).datagrid('options');
            gridOpts.singleSelect = checked;
        }
    });

    var pager = dg.datagrid('getPager');
    $(pager).pagination({
        //pageSize: _pageSize,//每页显示的记录条数，默认为10
        //pageList: [20, 30, 40, 50],//可以设置每页记录条数的列表
        beforePageText: '第',//页数文本框前显示的汉字
        afterPageText: '页, 共 {pages} 页',
        displayMsg: '当前记录 {from} - {to} , 共 {total} 条记录',
        buttons:[{
            text:'导入', iconCls: 'icon-page_excel',
            handler:function(){
                danceModuleName = options.danceModuleName;
                danceModuleTitle = options.danceModuleTitle;
                $(document.body).append('<div id="danceCommWin"></div>');
                $('#danceCommWin').panel({
                    href:'/static/html/_import_win.html',
                    onDestroy: function () {
                        $(dg).datagrid('reload');
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

    function doDel() {
        var row = $(dg).datagrid('getSelections');
        if (row.length === 0) {
            $.messager.alert('提示', '请选择要删除的数据行！' , 'info');
        } else {
            var text = '数据删除后不能恢复！是否要删除选中的 ' + row.length + '条 数据？';
            $.messager.confirm('确认删除', text , function(r){
                if (r){
                    ajaxDelData(row);
                }
            });
        }

        function ajaxDelData(row) {
            var ids = [];
            for (var i = 0; i < row.length; i++) {
                ids.push(row[i].id);
            }
            //console.log('del:' + ids);
            $.ajax({
                method: 'POST',
                url: '/dance_del_data',
                dataType: 'json',
                data: {'ids': ids, 'who': options.who}
            }).done(function(data) {
                if (data.errorCode === 0) {
                    $(dg).datagrid('reload');
                    $.messager.alert('提示', data.msg, 'info');
                } else {
                    $.messager.alert('错误', data.msg, 'error');
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
                $.messager.alert('提示', msg, 'info');
            });
        }
    }
}



// ---------------------------------------------------------------------------------------------------------------------
// 
// ---------------------------------------------------------------------------------------------------------------------
/**
 * 增加 Datagrid 组件，并格式化，包括列名，增/删/查等相应函数
 * @param datagridId        Datagrid id
 * @param options           创建表格所需要的 列名、查询提示文字、删除模块等信息
 */
function danceOpenCommonDg(datagridId, options) {
    var _pageSize = 30;
    // var _pageNo = 1;
    var url = options.url;
    var condition = options.cond;
    var ccId = 'cc' + datagridId;       // Combo box,姓名查找框ID
    var sbId = 'sb' + datagridId;
    var dg = $('#' + datagridId);       // datagrid ID

    var dance_condition = '';           // 主datagrid表查询条件

    $(dg).datagrid({
        fit: true,
        url: url + '_get',
        fitColumns: true,
        pagination: true,
        singleSelect: true,
        loadMsg: '正在加载数据...',
        border: false,
        striped: true,
        pageNumber: 1,
        pageSize: _pageSize,     //每页显示条数
        nowrap: true,   // True to display data in one line. Set to true can improve loading performance.
        pageList: [20, 30, 40, 50, 100],   //每页显示条数供选项
        rownumbers: true,   // True to show a row number column.
        queryParams: condition,
        toolbar: [{
            iconCls:'icon-add', text:"增加",      ///+++++++++++++++++++++++++++++++++++++++++++++
            handler:function(){
                var cond = $(dg).datagrid('options').queryParams;
                var param = {page: options.page, url: url, cond: cond, dgId: datagridId, uuid: 0};
                if(options.funcOpts){$.extend(param, options.funcOpts);}
                options.addEditFunc(param);
            }}, {iconCls:'icon-edit', text:"编辑/查看",  ///@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
            handler:function(){
                var row = $(dg).datagrid('getSelections');
                if (row.length === 0) {
                    $.messager.alert('提示', '请选择要查看的行！' , 'info');
                    return false;
                } else {
                    var cond = $(dg).datagrid('options').queryParams;
                    var param = {page: options.page, url: url, cond: cond, dgId: datagridId, uuid: row[0].id,
                        no: row[0].no};
                    if(options.funcOpts){$.extend(param, options.funcOpts);}
                    options.addEditFunc(param);
                }
            }},
            {iconCls:'icon-remove', text:"删除",  handler:doDel}, '-',
            {text: options.queryText + '<input id=' + ccId + '>'},
            {iconCls: 'icon-search', text:"查询", handler: function () {
                var cond = {};
                $.extend(cond, $(dg).datagrid('options').queryParams);
                cond['name'] = dance_condition;
                $(dg).datagrid('load', cond);
            }}, '-',
            {text: '<input id=' + sbId + '>'}
        ],
        columns: options.columns,
        onDblClickCell: function (index) {
            var rows = $(dg).datagrid('getRows');
            var param = {page: options.page, url: url, cond: $(dg).datagrid('options').queryParams,
                dgId: datagridId, uuid: rows[index].id, no:rows[index].no};
            if(options.funcOpts){$.extend(param, options.funcOpts);}
            options.addEditFunc(param);
        },
        onLoadSuccess: function () {
            if (options.funcOpts && options.funcOpts.mmStudent) {
                danceCreateMenuStudent();
                $(".danceui-menu-student").menubutton({
                    //plain:false,
                    menu: '#dance-menu-student'
                });
                dg.datagrid('resize');
            }
        }
    });

    $('#'+ccId).combobox({     // 搜索框 combo box
        prompt: options.queryPrompt,
        valueField: 'value',
        textField: 'text',
        width: 140,
        //panelHeight: "auto",
        onChange:autoComplete
    });

    autoComplete(dance_condition,'');
    function autoComplete (newValue) { // ,oldValue
        //console.log('newValue=' + newValue + ' oldValue=' + oldValue);
        dance_condition = $.trim(newValue);
        var queryCondition = {};
        $.extend(queryCondition, $(dg).datagrid('options').queryParams);
        queryCondition['name'] = dance_condition;
        $.post(url+'_query',queryCondition, function(data){
            $('#'+ccId).combobox('loadData', data);
        },'json');
    }

    $('#'+sbId).switchbutton({
        onText: '单选', offText: '多选', checked: true,
        onChange: function (checked) {
            var gridOpts = $(dg).datagrid('options');
            gridOpts.singleSelect = checked;
        }
    });

    var pager = dg.datagrid('getPager');
    $(pager).pagination({
        //pageSize: _pageSize,//每页显示的记录条数，默认为10
        //pageList: [20, 30, 40, 50],//可以设置每页记录条数的列表
        beforePageText: '第',//页数文本框前显示的汉字
        afterPageText: '页, 共 {pages} 页',
        displayMsg: '当前记录 {from} - {to} , 共 {total} 条记录',
        buttons:[{
            text:'导入', iconCls: 'icon-page_excel',
            handler:function(){
                danceModuleName = options.danceModuleName;
                danceModuleTitle = options.danceModuleTitle;
                $(document.body).append('<div id="danceCommWin"></div>');
                $('#danceCommWin').panel({
                    href:'/static/html/_import_win.html',
                    onDestroy: function () {
                        $(dg).datagrid('reload');
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

    function doDel() {
        var row = $(dg).datagrid('getSelections');
        if (row.length === 0) {
            $.messager.alert('提示', '请选择要删除的数据行！' , 'info');
        } else {
            var text = '数据删除后不能恢复！是否要删除选中的 ' + row.length + '条 数据？';
            $.messager.confirm('确认删除', text , function(r){
                if (r){
                    ajaxDelData(row);
                }
            });
        }

        function ajaxDelData(row) {
            var ids = [];
            for (var i = 0; i < row.length; i++) {
                ids.push(row[i].id);
            }
            //console.log('del:' + ids);
            $.ajax({
                method: 'POST',
                url: '/dance_del_data',
                dataType: 'json',
                data: {'ids': ids, 'who': options.who}
            }).done(function(data) {
                if (data.errorCode === 0) {
                    $(dg).datagrid('reload');
                    $.messager.alert('提示', data.msg, 'info');
                } else {
                    $.messager.alert('错误', data.msg, 'error');
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
                $.messager.alert('提示', msg, 'info');
            });
        }
    }

    /**
     * 创建 学员 菜单。
     */
    function danceCreateMenuStudent() {
        var mmId = 'dance-menu-student';
        if(!document.getElementById(mmId)){
            $(document.body).append('<div id=' + mmId +  '></div>');

            $('#'+mmId).menu({
                hideOnUnhover:false,
                onClick:function(item){
                    if(options.funcOpts && options.funcOpts.mmStudent){
                        var mmOpts = $('#'+mmId).menu('options');
                        var btn = mmOpts.alignTo;      // alignTo 是 未公开属性 wxg
                        var cond = $(dg).datagrid('options').queryParams;
                        var uuid = btn.attr('id').split('-')[1];
                        var param = {page: options.page, url: url, cond: cond, dgId: datagridId, uuid: uuid};
                        options.funcOpts.mmStudent.mmFunc(item, param);
                    }
                }
            }).menu('appendItem', {
                text: '学费交费记录',
                iconCls: 'icon-ok',
                id: 'dance-m-student-fee'
            }).menu('appendItem', {
                separator: true
            }).menu('appendItem', {
                text: '详细信息',
                iconCls: 'icon-ok',
                id: 'dance-m-student-detail'
            });
        }
    }
    
}
