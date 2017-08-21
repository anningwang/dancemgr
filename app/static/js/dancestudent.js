/**
 * dancestudent.js  界面实现 --by Anningwang
 */

//(function($){

/**
 *  danceAddTab     增加tab标签
 * @param divId     父节点，在该节点上添加 Tab
 * @param title     Tab的标题
 * @param tableId   Datagrid id,创建在 table 上
 */
function danceAddTab(divId, title, tableId) {
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
    }
}


/**
 * danceCreateDatagrid       增加 Datagrid 组件，并格式化，包括列名，增/删/查等相应函数
 * @param datagridId        Datagrid id
 * @param url               从服务器获取数据的url
 */
function danceCreateStudentDatagrid(datagridId, url) {
    var _pageSize = 30;
    var _pageNo = 1;
    var dg = $('#' + datagridId);

    $(dg).datagrid({
        // title: '学员列表',
        iconCls: 'icon-a_detail',
        fit: true,
        fitColumns: true,
        pagination: true,   // True to show a pagination toolbar on datagrid bottom.
        // singleSelect: true, // True to allow selecting only one row.
        border: false,
        striped: true,
        pageNumber: 1,
        pageSize: _pageSize,     //每页显示条数
        nowrap: true,   // True to display data in one line. Set to true can improve loading performance.
        pageList: [20, 30, 40, 50, 100],   //每页显示条数供选项
        rownumbers: true,   // True to show a row number column.
        toolbar: [{
            iconCls:'icon-add',
            text:"增加",
            handler:function(){
                alert('add');
            }}, {
            iconCls:'icon-edit',
            text:"编辑/查看",
            handler:function(){
                alert('edit');
            }}, {
            iconCls:'icon-remove',
            text:"删除",
            handler:function(){
                alert('del');
            }}, '-', {
            text: '姓名：<select class="easyui-combobox" panelHeight="auto" style="width:100px"></select>'
        }, {
            iconCls: 'icon-search',
            text:"查询",
            handler: function () {
                alert('查询');
            }}
        ],
        columns: [[
            {field: 'ck', checkbox:true },   // checkbox
            {field: 'no', title: '序号',  width: 25, align: 'center' },
            {field: 'school_name', title: '所属分校',  width: 40, align: 'center' },
            {field: 'sno', title: '学号', width: 60, align: 'center'},
            {field: 'name', title: '姓名', width: 60, align: 'center'},
            {field: 'gender', title: '性别', width: 20, align: 'center'},
            {field: 'mother_phone', title: '母亲手机', width: 70, align: 'center'},
            {field: 'father_phone', title: '父亲手机', width: 70, align: 'center'},
            {field: 'phone', title: '本人手机', width: 70, align: 'center'},
            {field: 'register_day', title: '登记日期', width: 70, align: 'center'}
        ]]
    });

    var pager = dg.datagrid('getPager');
    $(pager).pagination({
        //pageSize: _pageSize,//每页显示的记录条数，默认为10
        //pageList: [20, 30, 40, 50],//可以设置每页记录条数的列表
        beforePageText: '第',//页数文本框前显示的汉字
        afterPageText: '页, 共 {pages} 页',
        displayMsg: '当前记录 {from} - {to} , 共 {total} 条记录',
        onBeforeRefresh: function () {
        },
        onChangePageSize: function () {
        },
        onSelectPage: function (pageNo, pageSize) {
            console.log('pageNo=' + pageNo + " pageSize=" + pageSize);
            _pageSize = pageSize;
            _pageNo = pageNo;
            doAjax();
        },
        onLoadSuccess : function () {
            $(this).datagrid("fixRownumber");
        }
    });

    // 先通过ajax获取数据，然后再传给datagrid
    var doAjax = function () {
        $.ajax({
            method: 'POST',
            url: url,
            async: true,
            dataType: 'json',
            data: {'pageSize': _pageSize, 'pageNo': _pageNo},
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

    doAjax();   // 获取数据
}
//}(jQuery));
