/**
 * dancestudent.js  界面实现 --by Anningwang
 */

'use strict';

var danceModuleName = 'danceStudent';       // 所在模块

(function($){
    $.extend({
        /** 使用方法：
         *  一，字面量版：$.format ( "为什么{language}没有format" , { language : "javascript" } );
         *  二，数组版：$.format ( "为什么{0}没有format" ,  [ "javascript" ] );
         * @param source
         * @param args
         * @returns {*}
         */
        format : function(source,args){
            var result = source;
            if(typeof(args) == "object"){
                if(args.length==undefined){
                    for (var key in args) {
                        if(args[key]!=undefined){
                            var reg = new RegExp("({" + key + "})", "g");
                            result = result.replace(reg, args[key]);
                        }
                    }
                }else{
                    for (var i = 0; i < args.length; i++) {
                        if (args[i] != undefined) {
                            var reg = new RegExp("({[" + i + "]})", "g");
                            result = result.replace(reg, args[i]);
                        }
                    }
                }
            }
            return result;
        }
    })
})(jQuery);

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
/**
 * 添加或者打开 班级学员名单 Tab 页
 * @param title         Tab页的标题
 */
function danceAddTabClassStudentStat(title, condition) {
    //console.log(condition);
    condition.page = 1;
    condition.rows = 200;
    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);

        var dgClass = $('#danceClassStudentStat');
        dgClass.datagrid({
            url: 'dance_class_get',
            queryParams: condition
        });
    } else {
        $(parentDiv).tabs('add', {
            title: title,
            href: '/static/html/_class_student_stat.html',
            closable: true,
            onLoad: function () {
                var dgClass = $('#danceClassStudentStat');
                dgClass.datagrid({
                    url: 'dance_class_get',
                    queryParams: condition
                });
            }
        });
    }
}

var danceStudentListQueryCondition = undefined;
/**
 * danceAddTabStudentDatagrid 添加或者打开 学员列表 Tab页
 * @param divId             父节点Tabs对象ID
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabStudentDatagrid(divId, title, tableId, condition) {
    //console.log(tableId);
    danceStudentListQueryCondition = {};
    $.extend(danceStudentListQueryCondition, condition);
    var parentDiv = $('#'+divId);
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
        $('#'+tableId).datagrid('load', condition);
    } else {
        var content = '<table id=' + tableId + '></table>';
        $(parentDiv).tabs('add', {
            title: title,
            content: content,
            closable: true
        });
        danceCreateStudentDatagrid(tableId, '/dance_student', condition)
    }
}

/**
 * danceCreateDatagrid       增加 Datagrid 组件，并格式化，包括列名，增/删/查等相应函数
 * @param datagridId        Datagrid id
 * @param url               从服务器获取数据的url
 * @param condition         表格数据查询参数
 */
function danceCreateStudentDatagrid(datagridId, url, condition) {
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
        queryParams: condition,
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
                                    // $(dg).datagrid('options').queryParams={'name': dance_condition};
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
                /*
                if (dance_condition) {
                    $(dg).datagrid('options').queryParams={'name': dance_condition};
                } else {
                    if ('name' in $(dg).datagrid('options').queryParams) {
                        delete $(dg).datagrid('options').queryParams['name'];
                    }
                }
                */
                var cond = $(dg).datagrid('options').queryParams;
                cond['name'] = dance_condition;

                // $(dg).datagrid('reload');
                $(dg).datagrid('load', cond);
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
        var queryCondition = {};
        $.extend(queryCondition, $(dg).datagrid('options').queryParams);
        queryCondition['name'] = dance_condition;
        $.post(url+'_query',queryCondition, function(data){
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
                danceModuleName = 'danceStudent';
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
                danceModuleName = 'danceStudent';
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
 * 格式化日期，将日期格式化为 年-月-日 形式的字符串。
 * @param date          日期, JavaScript Date() 对象
 * @returns {string}    格式化后的字符串 yyyy-mm-dd
 */
function danceFormatter(date){
    var y = date.getFullYear();
    var m = date.getMonth()+1;
    var d = date.getDate();
    return y+'-'+(m<10?('0'+m):m)+'-'+(d<10?('0'+d):d);
}

function danceParser(s){
    if (!s) return new Date();
    var ss = (s.split('-'));
    var y = parseInt(ss[0],10);
    var m = parseInt(ss[1],10);
    var d = parseInt(ss[2],10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)){
        return new Date(y,m-1,d);
    } else {
        return new Date();
    }
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

    var editIndexClass = undefined;
    var classlist = [];
    var stuInfo = {'student': {}, 'class': {}};

    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
    } else {
        $(parentDiv).tabs('add', {
            title: title,
            href: page,
            closable: true,
            onLoad : function (panel) {
                // console.log(panel);
                $('#'+pagerStu).pagination({
                    buttons:[
                        { text:'保存', iconCls:'icon-save',  handler:onSave
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

                if (uid > 0) {  // 修改，查看
                    doAjaxStuDetail();
                } else {    // 新增
                    newStudent()
                }
                $('#'+panelStu).attr('id', panelStu+=uid).find('div.datagrid-view2>div.datagrid-header').first().hide();
                $('#'+stu_recorder).attr('id', stu_recorder+=uid).textbox('textbox').css('background','#e4e4e4');
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
                $('#'+stu_remark).attr('id', stu_remark+=uid);
                $('#'+dgStu_contact).attr('id', dgStu_contact+=uid).datagrid('mergeCells', {
                    index: 1, field: 'c2', colspan: 3
                });
                $('#'+dgStu_class).attr('id', dgStu_class+=uid).datagrid({
                    onClickCell: onClickCell,
                    onEndEdit : function onEndEdit(index, row){
                        var ed = $(this).datagrid('getEditor', {
                            index: index,
                            field: 'class_name'
                        });
                        row.class_name = $(ed.target).combobox('getText');
                    }
                });
            }
        });

        ajaxGetStudentExtras();
    }

    function doAjaxStuDetail() {
        $.ajax({
            method: 'POST',
            url: url + '_get_details',
            async: true,
            dataType: 'json',
            data: {'sno': uid, 'page': no},
            success: function (data) {
                //console.log(data);
                //console.log(data.total);
                //console.log(data.rows[0]['name']);

                stuInfo['student'] = data.rows[0];

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

    function newStudent() {
        for(var i = 0; i < 3; i++ ) {
            $('#'+dgStu_class).datagrid('appendRow', {});
        }

        //设置时间
        var curr_time = new Date();
        $("#"+stu_register_day).datebox("setValue",danceFormatter(curr_time));
    }

    function onClickCell(index, field) {
        //console.log('onClickCell');
        if (editIndexClass != index) {
            if (editIndexClass != undefined) {
                $('#'+dgStu_class).datagrid('endEdit', editIndexClass);
            }
            $('#'+dgStu_class).datagrid('selectRow', index)
                .datagrid('beginEdit', index);

            var classEd =  $('#'+dgStu_class).datagrid('getEditor', {index:index,field:'class_name'});
            if (classEd){
                $(classEd.target).combobox('loadData' , classlist);
                $(classEd.target).combobox({
                    //data: classlist,
                    onClick: onClickClass
                });
                var row = $('#'+dgStu_class).datagrid("getSelected");
                $(classEd.target).combobox('setValue', row['class_id']);
            }

            var ed = $('#'+dgStu_class).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            editIndexClass = index;
        }
    }
    
    function ajaxGetStudentExtras() {
        $.ajax({
            method: 'POST',
            url: '/dance_student_details_extras',
            async: true,
            dataType: 'json',
            data: {'sno': uid, 'page': no},
            success: function (data) {
                if(data.errorCode == 0) {
                    classlist = data['classlist'];
                } else {
                    $.messager.alert('错误',data.msg,'error');
                }
            }
        });
    }

    function endEditingClass(){
        if (editIndexClass != undefined){
            $('#'+dgStu_class).datagrid('endEdit', editIndexClass);
            editIndexClass = undefined;
        }
    }
    function onClickClass(record) {
        var row = $('#'+dgStu_class).datagrid("getSelected");
        if (row) {
            row['class_id'] =  record['class_id'];
            row['class_name'] = record['class_name'];
            //console.info(row);
            $('#'+dgStu_class).datagrid('updateRow', {index: editIndexClass, row: row});
            setTimeout(function(){
                endEditingClass();
            },0);
        }
    }
    ////////////////////
    function onSave() {
        if (!validateStudentInfo()) {
            return false;
        }

        packageStudentInfo();
        //console.log(stuInfo);
        $.ajax({
            method: "POST",
            url: "/dance_student_add",
            data: { data: JSON.stringify(stuInfo) }
        }).done(function(data) {
            if (data.errorCode == 0) {
                $.messager.alert('提示', data.msg, 'info');
            } else {
                $.messager.alert('提示', data.msg, 'info');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            var msg = $.format("请求失败：{0}。错误码：{1}({2}) ", [textStatus, jqXHR.status, errorThrown]);
            $.messager.alert('提示', msg, 'info');
        });
    }

    function validateStudentInfo() {
        if (!$('#'+stu_name).textbox('getText')) {
            $.messager.alert({ title: '提示',icon:'info', msg: '学员姓名不能为空！',
                fn: function(){
                    $('#'+stu_name).textbox('textbox').focus();
                }
            });
            return false;
        }

        return true;
    }
    
    function packageStudentInfo() {
        $.extend(stuInfo['student'], {'name': $('#'+stu_name).textbox('getText')});
        stuInfo['student']['register_day'] = $('#'+stu_register_day).datebox('getValue');
        stuInfo['student']['gender'] = $('#'+stu_gender).combobox('getValue');
        stuInfo['student']['birthday'] = $('#'+stu_birthday).datebox('getValue');
    }
}

//}(jQuery));