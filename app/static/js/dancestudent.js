/**
 * dancestudent.js  界面实现 --by Anningwang
 */

'use strict';

//(function($){

/**
 * danceAddTab       增加tab标签
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


function danceAddDetailInfo( page, uid, no) {
    var title = '学员详细信息';
    uid = uid || 0;
    if (uid <= 0) {
        title +='[新曾]'
    }

    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
    } else {
        $(parentDiv).tabs('add', {
            title: title,
            // content: page,
            href: page,
            closable: true
        });

        $.parser.onComplete = function(){
            $('#pagerStudent').pagination({
                buttons:[{
                    text:'查找', iconCls:'icon-search', handler:function(){
                        alert('search');
                    }
                },{
                    text:'保存', iconCls:'icon-save',  handler:function(){
                        alert('search');
                    }
                },{
                    text:'增加', iconCls:'icon-add',  handler:function(){
                        alert('add');
                    }
                },{
                    text:'编辑', iconCls:'icon-edit', handler:function(){
                        alert('edit');
                    }
                }],
                onSelectPage:function(pageNumber, pageSize){
                    //$.messager.alert('提示', $('#student_rec_id').val() + 'pageNumber=' + pageNumber, 'info');
                    no = pageNumber;
                    doAjaxStuDetail();
                }
            });
        };
    }

    if (uid > 0) {
        doAjaxStuDetail();
    }

    function doAjaxStuDetail() {
        $.ajax({
            method: 'POST',
            url: '/dance_get_student_details',
            async: true,
            dataType: 'json',
            data: {'sno': uid, 'page': no},
            success: function (data) {
                console.log(data);
                console.log(data.total);
                console.log(data.rows[0].name);

                $('#sno').textbox('setText',data.rows[0].sno);
                $('#name').textbox('setText',data.rows[0].name);
                $('#register_day').textbox('setText',data.rows[0].register_day);
                $('#school_name').textbox('setText',data.rows[0].school_name);
                //$('#information_source').textbox('setText',data.rows[0].information_source);
                //$('#counselor').textbox('setText',data.rows[0].counselor);
                //$('#degree').textbox('setText',data.rows[0].degree);
                $('#former_name').textbox('setText',data.rows[0].former_name);
                $('#recorder').textbox('setText',data.rows[0].recorder);
                $('#gender').combobox('select',data.rows[0].gender);
                $('#remark').textbox('setText',data.rows[0].remark);

                $('#pagerStudent').pagination({total: data.total, pageNumber:no});  // 更新翻页控件 页码

                $('#student_rec_id').val(data.rows[0].id);      // 记录 ID

                // 更新联系方式 table
                $('#dgStudent_contact').datagrid('updateRow',{
                    index: 0,
                    row: {
                        c2: data.rows[0].reading_school,
                        c4: data.rows[0].grade,
                        c6: data.rows[0].phone,
                        c8: data.rows[0].tel
                    }
                }).datagrid('updateRow', {
                    index: 1,
                    row: {
                        c2: data.rows[0].address,
                        c6: data.rows[0].email,
                        c8: data.rows[0].qq
                    }
                }).datagrid('updateRow', {
                    index: 2,
                    row: {
                        c2: data.rows[0].mother_name,
                        c4: data.rows[0].mother_phone,
                        c6: data.rows[0].mother_company

                    }
                }).datagrid('updateRow', {
                    index: 3,
                    row: {
                        c2: data.rows[0].father_name,
                        c6: data.rows[0].father_phone,
                        c8: data.rows[0].father_company
                    }
                }).datagrid('mergeCells', {
                    index: 1, field: 'c2', colspan: 3
                });

            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log('error in ajax. XMLHttpRequest=', + XMLHttpRequest
                    + ' textStatus=' + textStatus + ' errorThrown=' + errorThrown);
            }
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
            iconCls:'icon-add', text:"增加",      ///+++++++++++++++++++++++++++++++++++++++++++++
            handler:function(){
                danceAddDetailInfo('/static/html/_student.html');
                //danceAddTab('danceTab', '学员详细信息', 'abcdefg', '/ttt');
            }
        }, {
            iconCls:'icon-edit', text:"编辑/查看",  ///@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
            handler:function(){
                var row = $(dg).datagrid('getSelections');
                if (row.length == 0) {
                    $.messager.alert('提示', '请选择要查看的行！' , 'info');
                    return false;
                } else {
                    danceAddDetailInfo('/static/html/_student.html', row[0].id, row[0].no);
                }
            }
        }, {
            iconCls:'icon-remove', text:"删除",  //////////////////////////////
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
                                data: {'ids': ids, 'who': 'DanceStudent'},
                                success: function (data,status) {
                                    console.log('success in ajax. data.MSG=' + data.msg + " status=" + status);
                                    if (data.errorCode != 0) {
                                        $.messager.alert({
                                            title: '错误',
                                            msg: data.msg,
                                            icon:'error', // Available value are: error,question,info,warning.
                                            fn: function(){
                                                //...
                                            }
                                        });
                                        return false;
                                    }
                                    $(dg).datagrid('reload');
                                    //doAjax();
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
        }, '-', {
            text: '姓名：<input id=' + ccId + ' name="dept">'
        },{
            iconCls: 'icon-search', text:"查询",  /// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
            handler: function () {
                alert('查询');
            }
        }],
        columns: [[
            {field: 'id', title: 'id',  width: 30, align: 'center'},   // id, hidden   hidden:true
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
        // url: '/dance_search',
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
}
//}(jQuery));