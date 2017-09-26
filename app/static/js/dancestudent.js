/**
 * dancestudent.js  界面实现 --by Anningwang
 */

'use strict';

var danceModuleName = 'danceStudent';       // 所在模块
var danceModuleTitle = '';                  // 导入、导出 窗口标题

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

/**
 * 向 datagrid的 rowIndex行，字段 fieldName 对应的单元格，设置文字
 * @param dg            datagrid id
 * @param rowIndex      行索引，从0开始
 * @param fieldName     字段名称
 * @param text          要设置的文字
 */
function setDgCellText(dg, rowIndex, fieldName, text) {
    var panel =  $(dg).datagrid('getPanel');
    var tr = panel.find('div.datagrid-body tr[id$="-2-' + rowIndex + '"]');
    var td = $(tr).children('td[field=' + fieldName + ']');
    td.children("div").text(text);
}


/**
 * 将float数 value 转换为小数点后保留2位。并过滤小数点后无效的0
 * @param value     要转换的float数或者字符串
 * @returns {string}    转换后的字符串
 */
function dcTrimZero(value) {
    if (!value) {  return '';  }
    var str = Number(value).toFixed(2);
    var i = str.lastIndexOf('.');
    if (i > 0) {
        while (str.charAt(str.length-1) == '0') {
            str = str.slice(0, str.length-1);
        }
    }
    if (str.charAt(str.length-1) == '.') {
        str = str.slice(0, str.length-1);
    }

    return str;
}


//----------------------------------------------
/**
 * 添加或者打开 班级学员名单 Tab 页
 * @param title             Tab页的标题
 * @param condition         查询条件
 */
function danceAddTabClassStudentStat(title, condition) {
    //console.log(condition);
    //condition.page = 1;
    //condition.rows = 100;
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


/**
 * danceAddTabStudentDatagrid 添加或者打开 学员列表 Tab页
 * @param divId             父节点Tabs对象ID
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabStudentDatagrid(divId, title, tableId, condition) {
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
                var cond = $(dg).datagrid('options').queryParams;
                //console.log(cond);
                danceAddStudentDetailInfo('/static/html/_student.html',url,cond.school_id);
            }
        }, {
            iconCls:'icon-edit', text:"编辑/查看",  ///@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
            handler:function(){
                var row = $(dg).datagrid('getSelections');
                if (row.length == 0) {
                    $.messager.alert('提示', '请选择要查看的行！' , 'info');
                    return false;
                } else {
                    var cond = $(dg).datagrid('options').queryParams;
                    //console.log(cond);
                    danceAddStudentDetailInfo('/static/html/_student.html', url, cond.school_id, row[0].id);
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
                                data: {'ids': ids, 'who': 'DanceStudent'}
                            }).done(function(data) {
                                if (data.errorCode == 0) {
                                    $(dg).datagrid('reload');
                                    $.messager.alert('提示', data.msg, 'info');
                                } else {
                                    $.messager.alert('错误', data.msg, 'error');
                                }
                            }).fail(function(jqXHR, textStatus, errorThrown) {
                                var msg = $.format("请求失败。错误码：{0}({1}) ", [jqXHR.status, errorThrown]);
                                $.messager.alert('提示', msg, 'info');
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
                danceModuleName = 'DanceStudent';
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
                danceModuleName = 'DanceStudent';
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
 * @param school_id     分校id，取值范围： all  or 具体分校id
 * @param uid           学员id，新增时，可以不传递此参数。
 */
function danceAddStudentDetailInfo( page, url, school_id, uid) {
    var title = '学员详细信息';
    uid = uid || 0;     // 第一次进入 学生详细信息页面 uid 有效，上下翻页时，无法提前获取上下记录的uid
    if (uid <= 0) {
        title +='[新增]'
    }

    var no = -2;    // 学员所在数据库中的序号，方便翻页。传递 -2 则根据 uid 查询该学员的序号

    var pagerStu = 'pagerStudent';
    var panelStu = 'panelStudent';
    var stu_sno = 'sno';
    var stu_name = 'name';
    var stu_gender = 'gender';
    var stu_register_day = 'register_day';
    var stu_school_name = 'school_name';
    var stu_information_source = 'information_source';
    var stu_idcard = 'idcard';        // 身份证
    var stu_counselor = 'counselor';
    var stu_degree = 'degree';
    var stu_former_name = 'former_name';
    var stu_birthday = 'birthday';
    var stu_recorder = 'recorder';
    var stu_remark = 'remark';
    var dgReceiptComm = 'dgStudent_contact';
    var dgStu_class = 'dgStudent_class';

    var editIndexClass = undefined;
    var edIndexContact = undefined;
    var classlist = [];
    var schoollist = [];
    var stuInfo = {'student': {}, 'class': []};
    var oldStu = {};        // 修改学员记录时，保存原始信息

    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
    } else {
        $(parentDiv).tabs('add', {
            title: title,
            href: page,
            closable: true,
            loadingMessage: '加载中...',
            onLoad : function (panel) {
                // console.log(panel);
                $('#'+pagerStu).pagination({
                    showRefresh: uid > 0,
                    buttons:[{ text:'保存', iconCls:'icon-save',  handler:onSave}],
                    total: 0, pageSize: 1,
                    beforePageText: '第', afterPageText: '条，总 {pages} 条',
                    showPageList: false, showPageInfo: false,
                    onSelectPage:function(pageNumber, pageSize){
                        if (uid> 0) {
                            no = pageNumber;
                            doAjaxStuDetail();
                        }
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
                $('#'+stu_idcard).attr('id', stu_idcard+=uid);
                $('#'+stu_counselor).attr('id', stu_counselor+=uid);
                $('#'+stu_degree).attr('id', stu_degree+=uid);
                $('#'+stu_former_name).attr('id', stu_former_name+=uid);
                $('#'+stu_birthday).attr('id', stu_birthday+=uid);
                $('#'+stu_remark).attr('id', stu_remark+=uid);
                $('#'+dgReceiptComm).attr('id', dgReceiptComm+=uid).datagrid({
                    onClickCell: onClickContactCell,
                    onLoadSuccess: function () {
                        $('#'+dgReceiptComm).datagrid('mergeCells', {
                            index: 1, field: 'c2', colspan: 3
                        })
                    },
                    onBeginEdit: function (index,row) {
                        if (index == 1) {   // 地址所在行
                            console.log(row);
                        } else {
                            //var rows = $(this).datagrid('getRows');
                            //console.log(rows[1]);
                        }
                    }
                });
                $('#'+dgStu_class).attr('id', dgStu_class+=uid).datagrid({
                    onClickCell: onClickCell,
                    onEndEdit : function onEndEdit(index, row){
                        var ed = $(this).datagrid('getEditor', {
                            index: index,
                            field: 'class_name'
                        });
                        row.class_name = $(ed.target).combobox('getText');
                    },
                    toolbar: [{iconCls: 'icon-add', text: '增加行', handler: danceAddRow},
                        {iconCls: 'icon-remove', text: '删除行', handler: danceDelRow}
                    ]
                });
                ajaxGetStudentExtras();
            }
        });
    }

    function doAjaxStuDetail() {
        $.ajax({
            method: 'POST',
            url: url + '_details_get',
            async: true,
            dataType: 'json',
            data: {'student_id': uid, 'page': no, 'rows': 1},
            success: function (data) {
                //console.log(data);
                $.extend(true, oldStu, data);

                $('#'+stu_sno).textbox('setText',data.rows['sno']);
                $('#'+stu_name).textbox('setText',data.rows['name']);
                $('#'+stu_register_day).datebox('setValue',data.rows['register_day']);
                $('#'+stu_birthday).datebox('setValue',data.rows['birthday']);
                $('#'+stu_school_name).combobox('loadData', [{school_id: data.rows.school_id,
                    school_name: data.rows.school_name}]).combobox('setValue', data.rows.school_id);
                $('#'+stu_idcard).textbox('setText',data.rows['idcard']);     // 身份证号
                $('#'+stu_information_source).combobox('setText',data.rows['information_source']);
                $('#'+stu_counselor).combobox('setText',data.rows['counselor']);
                $('#'+stu_degree).combobox('setText',data.rows['degree']);

                $('#'+stu_former_name).textbox('setText',data.rows['former_name']);
                $('#'+stu_recorder).textbox('setText',data.rows['recorder']);
                $('#'+stu_gender).combobox('select',data.rows['gender']);
                $('#'+stu_remark).textbox('setText',data.rows['remark']);

                // 更新翻页控件 页码
                $('#'+pagerStu).pagination({total: data.total, pageNumber:no==-2?data.rows.no:no });

                $('#student_rec_id').val(data.rows['id']);      // ID

                // 更新联系方式 table
                $('#'+dgReceiptComm).datagrid('updateRow',{
                    index: 0,
                    row: {
                        c2: data.rows['reading_school'],
                        c4: data.rows['grade'],
                        c6: data.rows['phone'],
                        c8: data.rows['tel']
                    }
                }).datagrid('updateRow', {
                    index: 1,
                    row: {
                        c2: data.rows['address'],
                        c6: data.rows['email'],
                        c8: data.rows['qq']
                    }
                }).datagrid('mergeCells', {
                    index: 1, field: 'c2', colspan: 3
                }).datagrid('updateRow', {
                    index: 2,
                    row: {
                        c2: data.rows['mother_name'],
                        c4: data.rows['mother_phone'],
                        c6: data.rows['mother_company'],
                        c8: data.rows['mother_wechat']
                    }
                }).datagrid('updateRow', {
                    index: 3,
                    row: {
                        c2: data.rows['father_name'],
                        c4: data.rows['father_phone'],
                        c6: data.rows['father_company'],
                        c8: data.rows['father_wechat']
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
            var dg = $('#'+dgStu_class);
            if (editIndexClass != undefined) {
                $(dg).datagrid('endEdit', editIndexClass);
            }
            $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);

            var classEd =  $(dg).datagrid('getEditor', {index:index,field:'class_name'});
            if (classEd){
                $(classEd.target).combobox('loadData' , classlist);
                $(classEd.target).combobox({
                    //data: classlist,
                    onClick: onClickClass
                });
                var row = $(dg).datagrid("getSelected");
                $(classEd.target).combobox('setValue', row['class_id']);
            }

            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            editIndexClass = index;
        }
    }

    function onClickContactCell(index, field) {
        if (edIndexContact != index) {
            endEditingContact();
            var dg = $('#'+dgReceiptComm);
            $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);
            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            edIndexContact = index;
        }
    }
    
    function ajaxGetStudentExtras() {
        $.ajax({
            method: 'POST',
            url: '/dance_student_details_extras',
            async: true,
            dataType: 'json',
            data: {'student_id': uid, 'school_id': school_id},
            success: function (data) {
                if(data.errorCode == 0) {
                    classlist = data['classlist'];
                    schoollist = data.schoollist;
                    setSchoolName(schoollist);
                } else {
                    $.messager.alert('错误',data.msg,'error');
                }
            }
        });
    }

    /**
     * 设置分校名称/id
     * @param schoollist        分校id,名称 列表
     */
    function setSchoolName(schoollist) {
        if (schoollist.length) {
            $('#'+stu_school_name).combobox('loadData', schoollist)
                .combobox('setValue', schoollist[0].school_id);
        }
    }

    function endEditingClass(){
        if (editIndexClass != undefined){
            $('#'+dgStu_class).datagrid('endEdit', editIndexClass);
            editIndexClass = undefined;
        }
    }

    function endEditingContact(){
        if (edIndexContact != undefined){
            $('#'+dgReceiptComm).datagrid('endEdit', edIndexContact)
                .datagrid('mergeCells', { index: 1, field: 'c2', colspan: 3});
            edIndexContact = undefined;
        }
    }

    function onClickClass(record) {
        var dg = $('#'+dgStu_class);
        var row = $(dg).datagrid("getSelected");
        if (row) {
            row['class_id'] =  record['class_id'];
            row['class_name'] = record['class_name'];
            //row['status'] = '正常';
            //row['join_date'] = new Date();
            //console.info(row);
            var edStatus =  $(dg).datagrid('getEditor', {index:editIndexClass,field:'status'});
            if (edStatus && !$(edStatus.target).combobox('getValue')){
                $(edStatus.target).combobox('setValue', '正常');
            }
            var edJoin =  $(dg).datagrid('getEditor', {index:editIndexClass,field:'join_date'});
            if (edJoin && !$(edJoin.target).combobox('getValue')){
                $(edJoin.target).datebox('setValue', danceFormatter(new Date()));
            }

            $(dg).datagrid('updateRow', {index: editIndexClass, row: row});
            setTimeout(function(){
                endEditingClass();
            },0);
        }
    }
    ////////////////////
    function onSave() {
        endEditingContact();
        endEditingClass();
        if (!validateStudentInfo()) {
            return false;
        }

        stuInfo = {'student': {}, 'class': []};
        packageStudentInfo();
        //console.log(stuInfo);

        var url =  uid > 0 ? '/dance_student_modify' : '/dance_student_add';
        if (uid > 0) {
            stuInfo.student.id = oldStu.rows.id;
            // find student's class for delete
            var delClass = [];
            var m,n;
            for (m=0; m<oldStu.class_info.length; m++) {
                for (n=0; n<stuInfo.class.length; n++) {
                    if ('id' in stuInfo.class[n] && stuInfo.class[n].id == oldStu.class_info[m].id){
                        break;
                    }
                }
                if (n>=stuInfo.class.length) {  // not find
                    delClass.push({'id': oldStu.class_info[m].id, 'oper': 2})
                }
            }
            for (n=0; n<delClass.length; n++){
                stuInfo.class.push(delClass[n]);
            }
        }

        $.ajax({
            method: "POST",
            url: url,
            data: { data: JSON.stringify(stuInfo) }
        }).done(function(data) {
            if (data.errorCode == 0) {
                if (uid > 0) {
                    doAjaxStuDetail();  // 更新学员信息
                }
                $.messager.alert('提示', data.msg, 'info');
            } else {
                $.messager.alert('提示', data.msg, 'info');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            var msg = $.format("请求失败。错误码：{1}({2}) ", [jqXHR.status, errorThrown]);
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
        stuInfo.student.name = $('#'+stu_name).textbox('getText');     // 姓名
        stuInfo.student.register_day = $('#'+stu_register_day).datebox('getValue');   // 注册日期
        stuInfo.student.gender = $('#'+stu_gender).combobox('getValue');      // 性别
        stuInfo.student.school_id = $('#'+stu_school_name).combobox('getValue');      // 所属分校 名称/id
        stuInfo.student.information_source = $('#'+stu_information_source).combobox('getText');   // 信息来源
        stuInfo.student.idcard = $('#'+stu_idcard).textbox('getText');   // 身份证
        stuInfo.student.counselor = $('#'+stu_counselor).combobox('getText');   // 咨询师
        stuInfo.student.degree = $('#'+stu_degree).combobox('getText');   // 文化程度
        stuInfo.student.birthday = $('#'+stu_birthday).datebox('getValue');   // 出生日期
        stuInfo.student.remark = $('#'+stu_remark).textbox('getText');   // 备注
        // 曾用名

        stuInfo.student.information_source = stuInfo.student.information_source.replace('　', '');    // 删除全角空格
        stuInfo.student.counselor = stuInfo.student.counselor.replace('　', '');
        stuInfo.student.degree = stuInfo.student.degree.replace('　', '');

        var dg = $('#'+dgStu_class);
        var data = dg.datagrid('getData');
        //console.log(data);
        for(var i = 0; i< data.rows.length; i++) {
            //console.log(data);
            if (data.rows[i].class_id) {
                stuInfo.class.push(data.rows[i]);
            }
        }

        var dgCnt = $('#'+dgReceiptComm);
        var rows = dgCnt.datagrid('getRows');
        stuInfo.student.reading_school = rows[0].c2;
        stuInfo.student.grade = rows[0].c4;
        stuInfo.student.phone = rows[0].c6;
        stuInfo.student.tel = rows[0].c8;

        stuInfo.student.address = rows[1].c2;
        stuInfo.student.email = rows[1].c6;
        stuInfo.student.qq = rows[1].c8;

        stuInfo.student.mother_name = rows[2].c2;
        stuInfo.student.mother_phone = rows[2].c4;
        stuInfo.student.mother_company = rows[2].c6;
        stuInfo.student.mother_wechat = rows[2].c8;

        stuInfo.student.father_name = rows[3].c2;
        stuInfo.student.father_phone = rows[3].c4;
        stuInfo.student.father_company = rows[3].c6;
        stuInfo.student.father_wechat = rows[3].c8;
    }

    function danceAddRow() {
        $('#'+dgStu_class).datagrid('appendRow', {});
    }

    function danceDelRow() {
        //console.log('del row');
        var dg = $('#'+dgStu_class);
        var rows = dg.datagrid('getRows');
        if (rows.length == 0) {
            $.messager.alert('提示','无数据可删！','info');
            return;
        }
        var row = dg.datagrid('getSelected');
        var rowToDel = row ? row : rows[rows.length-1]; // 删除选中行 或 最后一行
        var idx = dg.datagrid('getRowIndex', rowToDel);
        if (rowToDel.class_id) { // 本行有数据，询问是否要删除
            $.messager.confirm('确认删除', '确认删除第 '+(idx+1)+' 行数据吗？', function(r){
                if (r){
                    dg.datagrid('deleteRow', idx);
                }
            });
        } else {
            dg.datagrid('deleteRow', idx);
        }
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/**
 * 查看/新增 收费单（学费） 详细信息
 * @param page          学员详细信息页面
 * @param url           查询信息所用url
 * @param school_id     分校id，取回范围： all  or 具体分校id
 * @param uid           单据id（收费单id），新增时，可以不传递此参数。
 */
function danceAddReceiptStudyDetailInfo( page, url, school_id, uid) {
    var title = '收费单（学费）详细信息';
    uid = uid || 0;     // 第一次进入 学生详细信息页面 uid 有效，上下翻页时，无法提前获取上下记录的uid
    if (uid <= 0) {
        title +='[新增]'
    }

    var no = -2;    // 学员所在数据库中的序号，方便翻页。传递 -2 则根据 uid 查询该学员的序号

    var dgReceiptComm = 'dgReceipt_comm';
    var dgStudyFee = 'dgStudyFee';
    var dgTm = 'dgTm';
    var dgOtherFee = 'dgOtherFee';
    var pagerFee = 'pager';
    var footer = 'footer';
    var panelFee = 'panelReceipt';
    var dcMayHide = 'dcMayHide';

    var edIndexStudyFee = undefined;
    var edIndexContact = undefined;
    var classlist = [];
    var schoollist = [];
    var stuInfo = {'student': {}, 'class': []};
    var oldStu = {};        // 修改学员记录时，保存原始信息

    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
    } else {
        $(parentDiv).tabs('add', {
            title: title,
            href: page,
            closable: true,
            loadingMessage: '加载中...',
            onLoad : function (panel) {
                // console.log(panel);
                $('#'+pagerFee).pagination({
                    showRefresh: uid > 0,
                    buttons:[{ text:'保存', iconCls:'icon-save',  handler:onSave}],
                    total: 0, pageSize: 1,
                    beforePageText: '第', afterPageText: '条，总 {pages} 条',
                    showPageList: false, showPageInfo: false,
                    onSelectPage:function(pageNumber, pageSize){
                        if (uid> 0) {
                            no = pageNumber;
                            doAjaxReceiptDetail();
                        }
                    }
                }).attr('id', pagerFee+=uid);        // 更新ID
                $('#'+dcMayHide).attr('id', dcMayHide+=uid);
                $('#'+dgReceiptComm).attr('id', dgReceiptComm+=uid).datagrid({
                    //onClickCell: onClickContactCell,
                    onBeginEdit: function (index,row) {
                        if (index == 1) {   // 地址所在行
                            console.log(row);
                        } else {
                            //var rows = $(this).datagrid('getRows');
                            //console.log(rows[1]);
                        }
                    }
                });
                $('#'+dgStudyFee).attr('id', dgStudyFee+=uid).datagrid({    // 班级——学费
                    onClickCell: onClickCellStudyFee,
                    onBeginEdit: function (index,row) {
                        var editors = $(this).datagrid('getEditors', index);
                        $(editors[1].target).numberbox('setText', row.term);    // 学期长度
                    },
                    onEndEdit: function onEndEdit(index, row){
                        //console.log('onEndEdit', row);
                        var ed = $(this).datagrid('getEditor', {
                            index: index,
                            field: 'class_name'
                        });
                        row.class_name = $(ed.target).combobox('getText');

                        row.term = dcTrimZero(row.term);
                    },
                    onAfterEdit: function (index,row,changes) {
                        //console.log('onAfterEdit', row);
                        //dgStudyFeeUpdateCell(index, row, row.term);
                    },
                    toolbar: [{iconCls: 'icon-add', text: '增加行', handler:function(){$('#'+dgStudyFee).datagrid('appendRow', {})}},
                        {iconCls: 'icon-remove', text: '删除行', handler: function () { danceDelRow($('#'+dgStudyFee)); }}]
                });
                $('#'+dgTm).attr('id', dgTm+=uid).datagrid({       // 教材费
                    toolbar: [{iconCls: 'icon-add', text: '增加行', handler:function(){$('#'+dgTm).datagrid('appendRow', {})}},
                        {iconCls: 'icon-remove', text: '删除行', handler: function () { danceDelRow($('#'+dgTm)); }}]
                });
                if (uid > 0) {
                    $('#'+dgOtherFee).attr('id', dgOtherFee+=uid).datagrid({    // 其他费
                        toolbar: [{iconCls: 'icon-add', text: '增加行', handler:function(){$('#'+dgOtherFee).datagrid('appendRow', {})}},
                            {iconCls: 'icon-remove', text: '删除行', handler: function () { danceDelRow($('#'+dgOtherFee)); }}]
                    });
                }
                $('#'+footer).attr('id', footer+=uid);
                $('#'+panelFee).attr('id', panelFee+=uid);

                if (uid > 0) {  // 修改，查看
                    doAjaxReceiptDetail();
                } else {    // 新增
                    newReceipt();       // 该函数调用只能放到后面，否则会引起 新增 收据单 表格的表头和内容不对齐
                }
                ajaxGetReceiptExtras();
            }
        });
    }

    /**
     * 查询 收费单 详细信息
     */
    function doAjaxReceiptDetail() {
        $.ajax({
            url: url + '_details_get',
            async: true, dataType: 'json', method: 'POST',
            data: {'receipt_id': uid, 'page': no, 'rows': 1}
        }).done(function (data) {
            //console.log(data);
            $.extend(true, oldStu, data);
            // 更新翻页控件 页码
            $('#'+pagerFee).pagination({total: data.total, pageNumber:no==-2?data.row.no:no });

            // 更新联系方式 table
            $('#'+dgReceiptComm).datagrid('updateRow',{ index: 0,
                row: {c2: data.row['receipt_no'],
                    c4: data.row['school_name'],
                    c6: data.row['deal_date']
                }
            }).datagrid('updateRow', { index: 1,
                row: {c2: data.row['student_no'],
                    c4: data.row['student_name'],
                    c6: data.row['receivable_fee']
                }
            }).datagrid('updateRow', { index: 2,
                row: {c2: data.row['teaching_fee'],
                    c4: data.row['other_fee'],
                    c6: data.row['total']
                }
            }).datagrid('updateRow', { index: 3,
                row: {c2: data.row['real_fee'],
                    c4: data.row['arrearage'],
                    c6: data.row['counselor']
                }
            }).datagrid('updateRow', { index: 4,
                row: {c2: data.row['fee_mode'],
                    c4: 'test',     // 收据号
                    c6: data.row['recorder']
                }
            }).datagrid('updateRow', { index: 5,
                row: {c2: data.row['remark']
                }
            });

            // 更新 班级——学费 表
            $('#'+dgStudyFee).datagrid('loadData', data.class_receipt);

            // 更新 教材费 表
            $('#'+dgTm).datagrid('loadData', data.teach_receipt);

            if (data.other_fee.length == 0) {
                $('#'+dcMayHide).hide();    // 隐藏 其他费
            } else {
                $('#'+dcMayHide).show();
            }
            // 更新 其他费
            $('#'+dgOtherFee).datagrid('loadData', data.other_fee);
            var len = data['other_fee'].length;
            for(var i = 0; i < 2 - len; i++ ) {
                $('#'+dgOtherFee).datagrid('appendRow', {});
            }
            len = data['class_receipt'].length;
            for(i = 0; i < 2 - len; i++ ) {
                $('#'+dgStudyFee).datagrid('appendRow', {});
            }

            len = data['teach_receipt'].length;
            for(i = 0; i < 2 - len; i++ ) {
                $('#'+dgTm).datagrid('appendRow', {});
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var msg = $.format("请求失败。错误码：{0}({1}) ", [jqXHR.status, errorThrown]);
            $.messager.alert('提示', msg, 'info');
        });
    }

    function newReceipt() {
        var num = 3;
        var i;
        for(i = 0; i <num; i++ ) {
            $('#'+dgStudyFee).datagrid('appendRow', {});
        }
        for(i = 0; i < num; i++ ) {
            $('#'+dgTm).datagrid('appendRow', {});
        }

        // 不显示其他费
        $('#'+dcMayHide).hide();    // 隐藏 其他费

        /*
        //设置时间
        var curr_time = new Date();
        $("#"+stu_register_day).datebox("setValue",danceFormatter(curr_time));
        */
    }

    function onClickCell(index, field) {
        /*

        //console.log('onClickCell');
        if (editIndexClass != index) {
            var dg = $('#'+dgStu_class);
            if (editIndexClass != undefined) {
                $(dg).datagrid('endEdit', editIndexClass);
            }
            $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);

            var classEd =  $(dg).datagrid('getEditor', {index:index,field:'class_name'});
            if (classEd){
                $(classEd.target).combobox('loadData' , classlist);
                $(classEd.target).combobox({
                    //data: classlist,
                    onClick: onClickClass
                });
                var row = $(dg).datagrid("getSelected");
                $(classEd.target).combobox('setValue', row['class_id']);
            }

            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            editIndexClass = index;
        }
        */
    }

    /**
     * 班级——学费 编辑
     * @param index
     * @param field
     */
    function onClickCellStudyFee(index, field) {
        if (edIndexStudyFee != index) {
            var dg = $('#'+dgStudyFee);
            if (edIndexStudyFee != undefined) {
                $(dg).datagrid('endEdit', edIndexStudyFee);
            }
            $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);
            var row = $(dg).datagrid("getSelected");

            // 班级名称 editor
            var classEd =  $(dg).datagrid('getEditor', {index:index,field:'class_name'});
            if (classEd){
                $(classEd.target).combobox('loadData' , classlist);
                $(classEd.target).combobox({
                    onClick: dgStudyFeeOnClickClass
                });
                $(classEd.target).combobox('setValue', row['class_no']);
            }

            // 学期长度 editor
            var edTerm = $(dg).datagrid('getEditor', {index:index,field:'term'});
            if (edTerm) {
                $(edTerm.target).textbox('textbox').bind("input propertychange",function(){
                    var value=$(this).val();
                    dgStudyFeeUpdateCell(index, value);
                    //console.log('input', value, ' row.term=', row.term);
                });

                $(edTerm.target).textbox('textbox').bind("blur",function() {
                    var value=$(this).val();
                    //console.log('blur', value, ' row.term=', row.term);
                    $(edTerm.target).textbox('setText', dcTrimZero(value));
                    dgStudyFeeUpdateCell(index, value);
                });

                /*
                $(edTerm.target).textbox('textbox').bind("focus",function() {
                    $(edTerm.target).textbox('setText', dcTrimZero($(this).val()));
                });
                */
            }

            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            edIndexStudyFee = index;
        }
    }

    /**
     * 班级——学费 表格，根据 学期长度，更新 实收学费，应收学费等单元格
     * @param index     要更新的行索引，从0开始
     * @param row       当前行的内容
     * @param value     需求长度 的当前值
     */
    function dgStudyFeeUpdateCell(index,value) {
        var dg = $('#'+dgStudyFee);
        var rows = dg.datagrid('getRows');
        if (rows.length < index + 1) {  return; }
        var row = rows[index];
        if (row.cost) {
            row.sum = dcTrimZero(row.cost * value);     // 优惠前学费
            row.total = dcTrimZero(row.sum - (row.discount ? row.discount : 0));    // 应收学费
            row.real_fee = row.total; // 实收学费
            row.arrearage = row.total - row.real_fee;   // 学费欠费
            var edRealFee = $(dg).datagrid('getEditor', {index: index, field: 'real_fee'});
            if (edRealFee) {
                edRealFee.target.textbox('setValue', row.real_fee);
            } else {
                setDgCellText(dg, index, 'real_fee', row.real_fee);
            }
            setDgCellText(dg, index, 'sum', row.sum);
            setDgCellText(dg, index, 'total', row.total);
            setDgCellText(dg, index, 'arrearage', row.arrearage);
        }
    }

    function onClickContactCell(index, field) {
        if (edIndexContact != index) {
            endEditingContact();
            var dg = $('#'+dgReceiptComm);
            $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);
            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            edIndexContact = index;
        }
    }

    /**
     * 查询 收费单 附加信息
     */
    function ajaxGetReceiptExtras() {
        $.ajax({
            method: 'POST',
            url: '/dance_receipt_study_details_extras',
            async: true,
            dataType: 'json',
            data: {'student_id': uid, 'school_id': school_id},
            success: function (data) {
                if(data.errorCode == 0) {
                    classlist = data['classlist'];
                    schoollist = data.schoollist;
                    setSchoolName(schoollist);
                } else {
                    $.messager.alert('错误',data.msg,'error');
                }
            }
        });
    }

    /**
     * 设置分校名称/id
     * @param schoollist        分校id,名称 列表
     */
    function setSchoolName(schoollist) {
        /*
        if (schoollist.length) {
            $('#'+stu_school_name).combobox('loadData', schoollist)
                .combobox('setValue', schoollist[0].school_id);
        }*/
    }

    function dgStudyFeeEendEditing(){
        if (edIndexStudyFee != undefined){
            $('#'+dgStudyFee).datagrid('endEdit', edIndexStudyFee);
            edIndexStudyFee = undefined;
        }
    }

    function endEditingContact(){
        /*
        if (edIndexContact != undefined){
            $('#'+dgReceiptComm).datagrid('endEdit', edIndexContact)
                .datagrid('mergeCells', { index: 1, field: 'c2', colspan: 3});
            edIndexContact = undefined;
        }*/
    }

    function dgStudyFeeOnClickClass(record) {
        var dg = $('#'+dgStudyFee);
        var row = $(dg).datagrid("getSelected");
        if (row) {
            row['class_no'] =  record['class_no'];
            row['class_name'] = record['class_name'];
            row.cost_mode = record.cost_mode;
            row.cost = record.cost;
            /*
            var edStatus =  $(dg).datagrid('getEditor', {index:edIndexStudyFee,field:'status'});
            if (edStatus && !$(edStatus.target).combobox('getValue')){
                $(edStatus.target).combobox('setValue', '正常');
            }
            var edJoin =  $(dg).datagrid('getEditor', {index:editIndexClass,field:'join_date'});
            if (edJoin && !$(edJoin.target).combobox('getValue')){
                $(edJoin.target).datebox('setValue', danceFormatter(new Date()));
            }
            */
            $(dg).datagrid('updateRow', {index: edIndexStudyFee, row: row});
            setTimeout(function(){
                dgStudyFeeEendEditing();
            },0);
        }
    }
    ////////////////////
    function onSave() {
        endEditingContact();
        dgStudyFeeEendEditing();
        if (!validateStudentInfo()) {
            return false;
        }

        stuInfo = {'student': {}, 'class': []};
        packageStudentInfo();
        //console.log(stuInfo);

        var url =  uid > 0 ? '/dance_student_modify' : '/dance_student_add';
        if (uid > 0) {
            stuInfo.student.id = oldStu.rows.id;
            // find student's class for delete
            var delClass = [];
            var m,n;
            for (m=0; m<oldStu.class_info.length; m++) {
                for (n=0; n<stuInfo.class.length; n++) {
                    if ('id' in stuInfo.class[n] && stuInfo.class[n].id == oldStu.class_info[m].id){
                        break;
                    }
                }
                if (n>=stuInfo.class.length) {  // not find
                    delClass.push({'id': oldStu.class_info[m].id, 'oper': 2})
                }
            }
            for (n=0; n<delClass.length; n++){
                stuInfo.class.push(delClass[n]);
            }
        }

        $.ajax({
            method: "POST",
            url: url,
            data: { data: JSON.stringify(stuInfo) }
        }).done(function(data) {
            if (data.errorCode == 0) {
                if (uid > 0) {
                    doAjaxReceiptDetail();  // 更新 收费单 信息
                }
                $.messager.alert('提示', data.msg, 'info');
            } else {
                $.messager.alert('提示', data.msg, 'info');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log(jqXHR);
            var msg = $.format("请求失败。错误码：{1}({2}) ", [jqXHR.status, errorThrown]);
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
        // 曾用名
/*
        stuInfo.student.information_source = stuInfo.student.information_source.replace('　', '');    // 删除全角空格
        stuInfo.student.counselor = stuInfo.student.counselor.replace('　', '');
        stuInfo.student.degree = stuInfo.student.degree.replace('　', '');

        var dg = $('#'+dgStu_class);
        var data = dg.datagrid('getData');
        //console.log(data);
        for(var i = 0; i< data.rows.length; i++) {
            //console.log(data);
            if (data.rows[i].class_id) {
                stuInfo.class.push(data.rows[i]);
            }
        }

        var dgCnt = $('#'+dgReceiptComm);
        var rows = dgCnt.datagrid('getRows');
        stuInfo.student.reading_school = rows[0].c2;
        stuInfo.student.grade = rows[0].c4;
        stuInfo.student.phone = rows[0].c6;
        stuInfo.student.tel = rows[0].c8;

        stuInfo.student.address = rows[1].c2;
        stuInfo.student.email = rows[1].c6;
        stuInfo.student.qq = rows[1].c8;

        stuInfo.student.mother_name = rows[2].c2;
        stuInfo.student.mother_phone = rows[2].c4;
        stuInfo.student.mother_company = rows[2].c6;
        stuInfo.student.mother_wechat = rows[2].c8;

        stuInfo.student.father_name = rows[3].c2;
        stuInfo.student.father_phone = rows[3].c4;
        stuInfo.student.father_company = rows[3].c6;
        stuInfo.student.father_wechat = rows[3].c8;
        */
    }

    function danceDelRow(dg) {
        var rows = dg.datagrid('getRows');
        if (rows.length == 0) {
            $.messager.alert('提示','无数据可删！','info');
            return;
        }
        var row = dg.datagrid('getSelected');
        var rowToDel = row ? row : rows[rows.length-1]; // 删除选中行 或 最后一行
        var idx = dg.datagrid('getRowIndex', rowToDel);
        if (rowToDel.class_name || rowToDel.tm_name || rowToDel.fee_item) { // 本行有数据，询问是否要删除
            $.messager.confirm('确认删除', '确认删除第 '+(idx+1)+' 行数据吗？', function(r){
                if (r){
                    dg.datagrid('deleteRow', idx);
                }
            });
        } else {
            dg.datagrid('deleteRow', idx);
        }
    }

}


/**
 * 添加或者打开 收费单（学费） Tab页
 * @param divId             父节点Tabs对象ID
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabFeeStudyDatagrid(divId, title, tableId, condition) {
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

        var opts = {
            'queryText': '姓名：',
            'queryPrompt': '姓名拼音首字母查找',
            'who': 'DanceReceipt',
            'danceModuleName': 'DanceReceipt',
            'addEditFunc': danceAddReceiptStudyDetailInfo,
            'page': '/static/html/_receipt_study.html',     // 上述函数的参数
            'columns': [[
                {field: 'ck', checkbox:true },
                //{field: 'id', hidden:true },
                {field: 'receipt_no', title: '收费单号', width: 140, align: 'center'},
                {field: 'school_name', title: '分校名称', width: 110, align: 'center'},
                {field: 'student_sno', title: '学号', width: 140, align: 'center'},
                {field: 'student_name', title: '学员姓名', width: 80, align: 'center'},
                {field: 'deal_date', title: '收费日期', width: 90, align: 'center'},
                {field: 'receivable_fee', title: '应收学费', width: 80, align: 'center'},
                {field: 'teaching_fee', title: '教材费', width: 80, align: 'center'},
                {field: 'other_fee', title: '其他费', width: 80, align: 'center'},
                {field: 'total', title: '费用合计', width: 80, align: 'center'},
                {field: 'real_fee', title: '实收费', width: 80, align: 'center'},
                {field: 'arrearage', title: '学费欠费', width: 80, align: 'center'},
                {field: 'fee_mode', title: '收费方式', width: 70, align: 'center'},
                {field: 'counselor', title: '咨询师', width: 90, align: 'center'},
                {field: 'remark', title: '备注', width: 90, align: 'center'},
                {field: 'recorder', title: '录入员', width: 90, align: 'center'}
            ]]
        };

        danceCreateCommDatagrid(tableId, '/dance_receipt_study', condition, opts)
    }
}

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
    var dg = $('#' + datagridId);       // datagrid ID

    var dance_condition = '';               // 主datagrid表查询条件

    $(dg).datagrid({
        // title: '学员列表',
        iconCls: 'icon-a_detail',
        fit: true,
        url: url + '_get',
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
        queryParams: condition,
        toolbar: [{
            iconCls:'icon-add', text:"增加",      ///+++++++++++++++++++++++++++++++++++++++++++++
            handler:function(){
                var cond = $(dg).datagrid('options').queryParams;
                //console.log(cond);
                ////danceAddStudentDetailInfo('/static/html/_student.html',url,cond.school_id);
                options.addEditFunc(options.page, url, condition.school_id);
            }
        }, {
            iconCls:'icon-edit', text:"编辑/查看",  ///@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
            handler:function(){
                var row = $(dg).datagrid('getSelections');
                if (row.length == 0) {
                    $.messager.alert('提示', '请选择要查看的行！' , 'info');
                    return false;
                } else {
                    var cond = $(dg).datagrid('options').queryParams;
                    //console.log(cond);
                    ////danceAddStudentDetailInfo('/static/html/_student.html', url, cond.school_id, row[0].id);
                    options.addEditFunc(options.page, url, condition.school_id, row[0].id);
                }
            }
        },
            {iconCls:'icon-remove', text:"删除",  handler:doDel}, '-',
            {text: options.queryText + '<input id=' + ccId + '>'},
            {iconCls: 'icon-search', text:"查询", handler: function () {
                var cond = {};
                $.extend(cond, $(dg).datagrid('options').queryParams);
                cond['name'] = dance_condition;
                $(dg).datagrid('load', cond);
            }}
        ],
        columns: options.columns
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
                danceModuleName = options.danceModuleName;
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
        if (row.length == 0) {
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
                if (data.errorCode == 0) {
                    $(dg).datagrid('reload');
                    $.messager.alert('提示', data.msg, 'info');
                } else {
                    $.messager.alert('错误', data.msg, 'error');
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                var msg = $.format("请求失败。错误码：{0}({1}) ", [jqXHR.status, errorThrown]);
                $.messager.alert('提示', msg, 'info');
            });
        }
    }
}

//}(jQuery));