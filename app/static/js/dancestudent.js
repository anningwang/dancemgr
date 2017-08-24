/**
 * dancestudent.js  界面实现 --by Anningwang
 */

//(function($){

/**
 * danceAddTab       增加tab标签
 * @param divId     父节点，在该节点上添加 Tab
 * @param title     Tab的标题
 * @param tableId   Datagrid id,创建在 table 上
 * @param url       从服务器获取数据的url
 */
function danceAddTab(divId, title, tableId, url) {
    console.log(tableId);
    var parentDiv = $('#'+divId);
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
    } else {
        var content = '<table id=' + tableId + '></table>';
        $(parentDiv).tabs('add', {
            title: title,
            content: content,
            closable: true
        });

        danceCreateStudentDatagrid(tableId, url);
    }
}


function danceAddDetailInfo( page) {
    var parentDiv = $('#danceTabs');
    var title = '学员详细信息';
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
    } else {
        $(parentDiv).tabs('add', {
            title: title,
            content: 'abc',
            href: page,
            closable: true
        });
    }
}

/**
 * danceCreateDatagrid       增加 Datagrid 组件，并格式化，包括列名，增/删/查等相应函数
 * @param datagridId        Datagrid id
 * @param url               从服务器获取数据的url
 */
function danceCreateStudentDatagrid(datagridId, url) {
    var _pageSize = 30;
    // var _pageNo = 1;
    var ccId = 'cc' + datagridId;       // Combo box,姓名查找框ID
    var dg = $('#' + datagridId);       // datagrid ID

    $(dg).datagrid({
        // title: '学员列表',
        iconCls: 'icon-a_detail',
        fit: true,
        url: url,
        fitColumns: true,
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
            iconCls:'icon-add', text:"增加",
            handler:function(){
                danceAddDetailInfo('/static/html/_student.html');
                //danceAddTab('danceTab', '学员详细信息', 'abcdefg', '/ttt');
            }}, {
            iconCls:'icon-edit', text:"编辑/查看",
            handler:function(){
                alert('edit');
            }}, {
            iconCls:'icon-remove', text:"删除",
            handler:function(){
                var row = $(dg).datagrid('getSelections');
                if (row.length == 0) {
                    $.messager.alert('提示', '请选择要删除的数据行！' , 'info');
                    return false;
                } else {
                    var text = '数据删除后不能恢复！是否要删除选中的 ' + row.length + '条 数据？';
                    $.messager.defaults = { ok: "是", cancel: "否" };
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
                                data: {'ids': ids, 'who': datagridId},
                                success: function (data,status) {
                                    $(dg).datagrid('reload');
                                    //doAjax();
                                    console.log('success in ajax. data.msg=' + data.msg + " status=" + status)
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

            }}, '-', {
            text: '姓名：<input id=' + ccId + ' name="dept" value="">'
            },{
            iconCls: 'icon-search', text:"查询",
            handler: function () {
                alert('查询');
            }}
        ],
        columns: [[
            {field: 'id', hidden:true },   // id, hidden
            {field: 'ck', checkbox:true },   // checkbox
            // {field: 'no', title: '序号',  width: 26, align: 'center' }, // 能自动显示行号，则不再需要自己实现
            {field: 'school_name', title: '所属分校',  width: 46, align: 'center' },
            {field: 'sno', title: '学号', width: 70, align: 'center'},
            {field: 'name', title: '姓名', width: 50, align: 'center'},
            {field: 'gender', title: '性别', width: 20, align: 'center'},
            {field: 'mother_phone', title: '妈妈手机', width: 50, align: 'center'},
            {field: 'father_phone', title: '爸爸手机', width: 50, align: 'center'},
            {field: 'phone', title: '本人手机', width: 60, align: 'center'},
            {field: 'register_day', title: '登记日期', width: 60, align: 'center'}
        ]]
    });

    $('#'+ccId).combobox({     // 姓名 搜索框 combo box
        url: '/dance_search',
        prompt: '姓名拼音首字母查找',
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
        buttons:[{
            text:'导入', iconCls: 'icon-page_excel',
            handler:function(){
                var upload = '<input id="fb" type="text" style="width:540px">';
                $('#win').empty().css({'padding':'20px'}).window({
                    title:'导入信息',
                    iconCls:'icon-page_excel',
                    width:600,
                    height:400,
                    modal:true,
                    minimizable:false,
                    collapsible:false
                }).append(upload).window('open');
                $('#fb').filebox({
                    buttonText: '选择文件',
                    buttonAlign: 'left',
                    prompt:'请选择要导入的Excel文件...'
                })
            }
        },{
            text:'导出', iconCls:' icon-page_white_excel ',
            handler:function(){
                $('#winExport').panel({
                    href:'/static/html/_import_win.html',
                    onLoad:function(){
                        //alert('loaded successfully');
                    }
                });
            }
        },{
            text:'打印', iconCls:'icon-printer',
            handler:function(){
                alert('edit');
            }
        }]
    });
/*
    // 先通过ajax获取数据，然后再传给datagrid
    var doAjax = function () {
        $.ajax({
            method: 'POST',
            url: url,
            async: true,
            dataType: 'json',
            data: {'rows': _pageSize, 'page': _pageNo},
            success: function (data) {
                console.log(data);

                dg.datagrid('loadData', data);
                // 注意此处从数据库传来的data数据有记录总行数的total列
                var total = data.total;
                pager.pagination({          // 更新pagination的导航列表各参数
                    total: total,            // 总数
                    pageSize: _pageSize,    // 行数
                    pageNumber: _pageNo     // 页数
                });
            },
            error: function () {
                console.log('error in ajax.');
            }
        });
    };
    */

    // doAjax();   // 获取数据
/*
    var doAjaxDel = function (idList) {
        $.ajax({
            method: 'POST',
            url: url,
            async: true,
            dataType: 'json',
            data: {'id': idList, 'rows': _pageSize, 'page': _pageNo},
            success: function (data) {
                console.log(data);

                dg.datagrid('loadData', data);
                // 注意此处从数据库传来的data数据有记录总行数的total列
                var total = data.total;
                pager.pagination({          // 更新pagination的导航列表各参数
                    total: total,            // 总数
                    pageSize: _pageSize,    // 行数
                    pageNumber: _pageNo     // 页数
                });
            },
            error: function () {
                console.log('error in ajax.');
            }
        });
    };

    */
}
//}(jQuery));
