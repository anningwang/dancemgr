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

//----------------------------------------------
function danceAddTabClassStudentStat(title) {
    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
    } else {
        $(parentDiv).tabs('add', {
            title: title,
            href: '/static/html/_class_student_stat.html',
            closable: true
        });
    }
}
//----------------------------------------------


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

    var dance_condition = '';               // 主datagrid表查询条件

    $(dg).datagrid({
        // title: '学员列表',
        iconCls: 'icon-a_detail',
        fit: true,
        url: url + '_get',
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
                danceAddStudentDetailInfo('/static/html/_student.html',url);
            }
        }, {
            iconCls:'icon-edit', text:"编辑/查看",  ///@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
            handler:function(){
                var row = $(dg).datagrid('getSelections');
                if (row.length == 0) {
                    $.messager.alert('提示', '请选择要查看的行！' , 'info');
                    return false;
                } else {
                    danceAddStudentDetailInfo('/static/html/_student.html', url, row[0].id, -2); // row[0].no
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
                                    $(dg).datagrid('options').queryParams={'condition': dance_condition};
                                    $(dg).datagrid('reload');
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
            text: '姓名：<input id=' + ccId + ' name="nameQuery" value="">'
        },{
            iconCls: 'icon-search', text:"查询",  /// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
            handler: function () {
                $(dg).datagrid('options').queryParams={'condition': dance_condition};
                $(dg).datagrid('reload');
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
        prompt: '姓名拼音首字母查找',
        valueField: 'value',
        textField: 'text',
        width: 140,
        //panelHeight: "auto",
        onChange:autoComplete
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
        buttons:[{
            text:'导入', iconCls: 'icon-page_excel',
            handler:function(){
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
}


/**
 * 查看/新增 学员 详细信息
 * @param page          学员详细信息页面
 * @param url           查询信息所用url
 * @param uid           学员id，新增时，可以不传递此参数。
 * @param no            学员所在数据库中的序号，方便翻页。传递 -2 则根据 uid 查询该学员的序号
 */
function danceAddStudentDetailInfo( page, url, uid, no) {
    var title = '学员详细信息';
    uid = uid || 0;     // 第一次进入 学生详细信息页面 uid 有效，上下翻页时，无法提前获取上下记录的uid
    if (uid <= 0) {
        title +='[新增]'
    }

    var pagerStu = 'pagerStudent';
    var panelStu = 'panelStudent';
    var stu_sno = 'sno';
    var stu_name = 'name';
    var stu_gender = 'gender';
    var stu_register_day = 'register_day';
    var stu_school_name = 'school_name';
    var stu_information_source = 'information_source';
    var stu_people_id = 'people_id';
    var stu_counselor = 'counselor';
    var stu_degree = 'degree';
    var stu_former_name = 'former_name';
    var stu_birthday = 'birthday';
    var stu_recorder = 'recorder';
    var stu_remark = 'remark';
    var dgStu_contact = 'dgStudent_contact';
    var dgStu_class = 'dgStudent_class';


    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
    } else {
        $(parentDiv).tabs('add', {
            title: title,
            // content: page,
            href: page,
            closable: true,
            onLoad : function (panel) {
                // console.log(panel);
                $('#'+pagerStu).pagination({
                    buttons:[{
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
                        no = pageNumber;
                        doAjaxStuDetail();
                    }
                }).attr('id', pagerStu+=uid);        // 更新ID

                if (uid > 0) {
                    doAjaxStuDetail();
                }
                $('#'+panelStu).attr('id', panelStu+=uid).find('div.datagrid-view2>div.datagrid-header').first().hide();
                $('#recorder').textbox('textbox').css('background','#e4e4e4');
                // #ccc #fff #ffee00 #6293BB e4e4e4 #99ff99
                $('#'+stu_sno).attr('id', stu_sno+=uid).textbox('textbox').css('background','#e4e4e4');
                $('#'+stu_name).attr('id', stu_name+=uid);
                $('#'+stu_gender).attr('id', stu_gender+=uid);
                $('#'+stu_register_day).attr('id', stu_register_day+=uid);
                $('#'+stu_school_name).attr('id', stu_school_name+=uid);
                $('#'+stu_information_source).attr('id', stu_information_source+=uid);
                $('#'+stu_people_id).attr('id', stu_people_id+=uid);
                $('#'+stu_counselor).attr('id', stu_counselor+=uid);
                $('#'+stu_degree).attr('id', stu_degree+=uid);
                $('#'+stu_former_name).attr('id', stu_former_name+=uid);
                $('#'+stu_birthday).attr('id', stu_birthday+=uid);
                $('#'+stu_recorder).attr('id', stu_recorder+=uid);
                $('#'+stu_remark).attr('id', stu_remark+=uid);
                $('#'+dgStu_contact).attr('id', dgStu_contact+=uid);
                $('#'+dgStu_class).attr('id', dgStu_class+=uid);
            }
        });
    }

    function doAjaxStuDetail() {
        $.ajax({
            method: 'POST',
            url: url + '_get_details',
            async: true,
            dataType: 'json',
            data: {'sno': uid, 'page': no},
            success: function (data) {
                console.log(data);
                console.log(data.total);
                console.log(data.rows[0]['name']);

                $('#'+stu_sno).textbox('setText',data.rows[0]['sno']);
                $('#'+stu_name).textbox('setText',data.rows[0]['name']);
                $('#'+stu_register_day).textbox('setText',data.rows[0]['register_day']);
                $('#'+stu_birthday).textbox('setText',data.rows[0]['birthday']);
                $('#'+stu_school_name).textbox('setText',data.rows[0]['school_name']);
                $('#'+stu_people_id).textbox('setText',data.rows[0]['people_id']);

                $('#'+stu_information_source).textbox('setText',data.rows[0]['information_source']);
                $('#'+stu_counselor).textbox('setText',data.rows[0]['counselor']);
                $('#'+stu_degree).textbox('setText',data.rows[0]['degree']);

                $('#'+stu_former_name).textbox('setText',data.rows[0]['former_name']);
                $('#'+stu_recorder).textbox('setText',data.rows[0]['recorder']);
                $('#'+stu_gender).combobox('select',data.rows[0]['gender']);
                $('#'+stu_remark).textbox('setText',data.rows[0]['remark']);

                // 更新翻页控件 页码
                $('#'+pagerStu).pagination({total: data.total, pageNumber:no==-2?data.rows[0].no:no });

                $('#student_rec_id').val(data.rows[0]['id']);      // ID

                // 更新联系方式 table
                $('#'+dgStu_contact).datagrid('updateRow',{
                    index: 0,
                    row: {
                        c2: data.rows[0]['reading_school'],
                        c4: data.rows[0]['grade'],
                        c6: data.rows[0]['phone'],
                        c8: data.rows[0]['tel']
                    }
                }).datagrid('updateRow', {
                    index: 1,
                    row: {
                        c2: data.rows[0]['address'],
                        c6: data.rows[0]['email'],
                        c8: data.rows[0]['qq']
                    }
                }).datagrid('updateRow', {
                    index: 2,
                    row: {
                        c2: data.rows[0]['mother_name'],
                        c4: data.rows[0]['mother_phone'],
                        c6: data.rows[0]['mother_company']
                    }
                }).datagrid('updateRow', {
                    index: 3,
                    row: {
                        c2: data.rows[0]['father_name'],
                        c6: data.rows[0]['father_phone'],
                        c8: data.rows[0]['father_company']
                    }
                }).datagrid('mergeCells', {
                    index: 1, field: 'c2', colspan: 3
                });

                // 更新报班信息 table
                var len = data['class_info'].length;
                $('#'+dgStu_class).datagrid('loadData', data['class_info']);
                for(var i = 0; i < 3 - len; i++ ) {
                    $('#'+dgStu_class).datagrid('appendRow', {});
                }
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                console.log('error in ajax. XMLHttpRequest=', + XMLHttpRequest
                    + ' textStatus=' + textStatus + ' errorThrown=' + errorThrown);
            }
        });
    }
}

//}(jQuery));