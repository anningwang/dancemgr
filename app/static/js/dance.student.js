/**
 * dancestudent.js  界面实现 --by Anningwang
 */

'use strict';

var danceModuleName = 'danceStudent';       // 所在模块
var danceModuleTitle = '';                  // 导入、导出 窗口标题


function danceOpenTab(title, url) {
    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
    } else {
        $(parentDiv).tabs('add', {
            title: title,
            //content: content,
            href: url,
            closable: true
        });
    }
}


/**
 * 将 value 转换为 保留小数点后4位的字符串 和 百分百字符串。
 * @param value
 * @returns {{value: string, text: string}}
 */
function dcCalcDiscountRate(value) {
    var str = Number(value).toFixed(4);
    str = dcTrimStringZero(str);
    return {'value': str, 'text': str * 100 + '%' };
}


//----------------------------------------------------------------------------------------------------------------------
/**
 * 添加或者打开 班级学员名单 Tab 页
 * @param title             Tab页的标题
 * @param condition         查询条件
 */
function danceAddTabClassStudentStat(title, condition) {
    //console.log(condition);
    var dg = '#danceClassStudentStat';
    var dgStu = '#danceStudentNum';
    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
        $(dg).datagrid('load', condition);
    } else {
        $(parentDiv).tabs('add', {
            title: title,
            href: '/static/html/_class_student_stat.html',
            closable: true,
            onLoad: function () {
                $(dg).datagrid({
                    url: 'dance_class_get',
                    queryParams: condition,
                    onLoadSuccess: dgClassLoadSuccess,
                    //onClickRow: getDgStuNum
                    onSelect : getDgStuNum
                });

                $(dgStu).datagrid({
                    onDblClickRow:function (index,row) {    // 双击打开 学员详细信息页
                        danceAddStudentDetailInfo('/static/html/_student.html', '/dance_student', {}, row.id);
                    }
                });
            }
        });
    }

    function dgClassLoadSuccess (data) {
        if (data.rows.length) {
            $(dg).datagrid('selectRow', 0);
        } else {
            $(dgStu).datagrid({title: '学员信息'});
        }
    }
    
    function getDgStuNum(index, row) {
        $.ajax({
            method: 'POST',
            url: '/dance_class_student_get',
            dataType: 'json',
            data: {class_id: row['id']}
        }).done(function(data) {
            if (data.errorCode === 0) {
                $(dgStu).datagrid('loadData', data);
            } else {
                $.messager.alert('错误', data.msg, 'error');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
            $.messager.alert('提示', msg, 'info');
            console.log(index);
        });

        var gridPanel = $(dgStu).datagrid("getPanel");
        gridPanel.panel('setTitle', '学员信息 [' + row['class_name']  + ']');

        var opts = $(dgStu).datagrid('options');
        opts.url = '/dance_class_student_get';
        opts.queryParams = {class_id: row['id']};
    }
}
//----------------------------------------------------------------------------------------------------------------------


/**
 * 添加或者打开 学员列表 Tab页
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabStudentDatagrid(title, tableId, condition) {
    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
        $('#'+tableId).datagrid('load', condition);
    } else {
        var content = '<div style="min-width:1024px;width:100%;height:100%"><table id=' + tableId + '></table></div>';
        $(parentDiv).tabs('add', {
            title: title,
            content: content,
            closable: true
        });

        var module = 'dance_student';
        var opts = {
            queryText: '姓名：',
            queryPrompt: '姓名拼音首字母查找',
            who: module,                // 删除数据时，判断模块
            danceModuleName: module,    // 导入、导出时，判断模块
            danceModuleTitle: title,    // 导入、导出 窗口 title
            url: '/'+module,            // 从服务器获取数据的url
            cond: condition,            // 表格数据查询参数
            addEditFunc: danceAddStudentDetailInfo,
            page: '/static/html/_student.html',     // 上述函数的参数
            funcOpts: {
                title: title,
                mmStudent: {mmFunc: danceMenuStudent}
            },
            columns: [[
                {field: 'ck', checkbox:true },   // checkbox
                {field: 'school_name', title: '所属分校',  width: 46, align: 'center' },
                {field: 'sno', title: '学号', width: 70, align: 'center'},
                {field: 'name', title: '姓名', width: 50, align: 'center',formatter:formatStudent},
                {field: 'gender', title: '性别', width: 20, align: 'center'},
                {field: 'mother_phone', title: '妈妈手机', width: 50, align: 'center'},
                {field: 'father_phone', title: '爸爸手机', width: 50, align: 'center'},
                {field: 'phone', title: '本人手机', width: 60, align: 'center'},
                {field: 'register_day', title: '登记日期', width: 60, align: 'center'}
            ]]
        };

        danceOpenCommonDg(tableId, opts)
    }

    function formatStudent(value,row) { // ,index
        return '<a class="danceui-menu-student" style="color:#0094ff" id='+ "student-" + row.id + '>'+value+'</a>';
    }
}


function danceMenuStudent(item, param) {
    // console.log(item, id);
    switch (item.id) {
        case 'dance-m-student-fee':
            // $.messager.alert('提示', id, 'info');
            danceAddTabFeeHistory(param);
            break;
        case 'dance-m-student-detail':
            danceAddStudentDetailInfo(param);
            break;
        default:
            break;
    }
}


/**
 * 查看/新增 学员 详细信息
 * @param opts:         输入参数，内容如下：
 * {
 *      page:       学员详细信息页面, 从服务器获取
 *      url:        查询信息所用url
 *      cond: {     查询条件：
 *          school_id     分校id，取值范围： all  or 具体分校id
 *       }
 *      uuid        学员id，新增时，可以不传递此参数。
 * }
 */
function danceAddStudentDetailInfo(opts) {
    var page = opts.page;
    var url = opts.url;
    var condition = opts.cond;
    var uid = opts.uuid;
    var title = '学员详细信息';
    if (uid <= 0) {
        title +='[新增]'
    }
    var no = opts.no ? opts.no : -2;

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
    var footerStu = 'footerStudent';
    var tbLayout = 'tableLayout';

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
            onLoad : function () {
                // console.log(panel);
                $('#'+pagerStu).pagination({
                    showRefresh: uid > 0,
                    buttons:[{ text:'保存', iconCls:'icon-save',  handler:onSave}],
                    total: 0, pageSize: 1,
                    beforePageText: '第', afterPageText: '条，总 {pages} 条',
                    showPageList: false, showPageInfo: false,
                    onSelectPage:function(pageNumber){  // , pageSize
                        if (uid> 0) {
                            no = pageNumber;
                            doAjaxStuDetail();
                        }
                    }
                }).attr('id', pagerStu+=uid);        // 更新ID

                $('#'+stu_recorder).attr('id', stu_recorder+=uid).textbox('textbox').css('background','#e4e4e4');
                // #ccc #fff #ffee00 #6293BB e4e4e4 #99ff99
                $('#'+stu_sno).attr('id', stu_sno+=uid).textbox('textbox').css('background','#e4e4e4');
                $('#'+stu_name).attr('id', stu_name+=uid).textbox('textbox').focus();
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
                $('#'+footerStu).attr('id', footerStu+=uid);
                $('#'+tbLayout).attr('id', tbLayout+=uid);
                $('#'+dgReceiptComm).attr('id', dgReceiptComm+=uid).datagrid({
                    onClickCell: onClickContactCell,
                    onResize: resizeTextbox,
                    onLoadSuccess: function () {
                        $('#'+dgReceiptComm).datagrid('mergeCells', {
                            index: 1, field: 'c2', colspan: 3
                        })
                    },
                    onBeginEdit: function (index,row) {
                        if (index === 1) {   // 地址所在行
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
                            field: 'class_id'
                        });
                        row.class_name = $(ed.target).combobox('getText');
                    },
                    toolbar: [{iconCls: 'icon-add', text: '增加行', handler: danceAddRow},
                        {iconCls: 'icon-remove', text: '删除行', handler: danceDelRow}
                    ]
                });

                $('#'+panelStu).attr('id', panelStu+=uid).mousedown(function (event) {      // panel 鼠标按下事件
                    if (event.target.id === panelStu) {
                        endEditingClass();
                        endEditingContact();
                    }
                });     // .find('div.datagrid-view2>div.datagrid-header').first().hide();

                if (uid > 0) {  // 修改，查看
                    doAjaxStuDetail();
                } else {    // 新增
                    newStudent()
                }
                ajaxGetStudentExtras();
            }
        });
    }

    function doAjaxStuDetail() {
        var cond = {'student_id': uid, 'page': no, 'rows': 1};
        $.extend(cond, condition);

        $.ajax({
            method: 'POST',
            url: url + '_details_get',
            async: true,
            dataType: 'json',
            data: cond
        }).done(function (data) {
            //console.log(data);
            $.extend(true, oldStu, data);

            $('#'+stu_sno).textbox('setText',data.rows['sno']);
            $('#'+stu_name).textbox('setText',data.rows['name']).textbox('textbox').focus();
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
            $('#'+pagerStu).pagination({total: data.total, pageNumber:data.rows.no});

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
            danceDgLoadData(dgStu_class, data['class_info']);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var msg = "请求失败}。错误码：{0}({1})".format(jqXHR.status, errorThrown);
            $.messager.alert('提示', msg, 'info');
        });
    }

    function newStudent() {
        danceDgLoadData(dgStu_class, []);

        //设置时间
        var curr_time = new Date();
        $("#"+stu_register_day).datebox("setValue",danceFormatter(curr_time));
    }

    function onClickCell(index, field) {
        //console.log('onClickCell');
        if (editIndexClass !== index) {
            var dg = $('#'+dgStu_class);
            if (editIndexClass !== undefined) {
                $(dg).datagrid('endEdit', editIndexClass);
            }
            $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);

            var classEd =  $(dg).datagrid('getEditor', {index:index,field:'class_id'});
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
        if (edIndexContact !== index) {
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
            data: {'student_id': uid, 'school_id': condition.school_id}
        }).done(function (data) {
            if(data.errorCode === 0) {
                classlist = data['classlist'];
                schoollist = data['schoollist'];
                danceSetSchoolName(schoollist, stu_school_name);
            } else {
                $.messager.alert('错误',data.msg,'error');
            }
        });
    }
    

    function endEditingClass(){
        if (editIndexClass !== undefined){
            $('#'+dgStu_class).datagrid('endEdit', editIndexClass);
            editIndexClass = undefined;
        }
    }

    function endEditingContact(){
        if (edIndexContact !== undefined){
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
            row.class_no = record.class_no;
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
            for (m=0; m<oldStu['class_info'].length; m++) {
                for (n=0; n<stuInfo.class.length; n++) {
                    if ('id' in stuInfo.class[n] && stuInfo.class[n].id === oldStu['class_info'][m].id){
                        break;
                    }
                }
                if (n>=stuInfo.class.length) {  // not find
                    delClass.push({'id': oldStu['class_info'][m].id, 'oper': 2})
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
            if (data.errorCode === 0) {
                if (uid > 0) {
                    doAjaxStuDetail();  // 更新学员信息
                }
                $.messager.alert('提示', data.msg, 'info');
            } else {
                $.messager.alert('提示', data.msg, 'info');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
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
        if (rows.length === 0) {
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

    var _p_w = null;    // 记录上次的宽度
    function resizeTextbox() {
        var tb = $('#'+tbLayout);
        var parent = $(tb).parent();
        var pw = parent.width();
        if(pw === _p_w)
            return;
        _p_w = pw;
        tb.find('td.dcTdFixed').css('width', 202);
        var w = parseInt((pw - 202) / 3);
        tb.find('td.dcTdPercent').css('width', w);

        var wd = w - 10;
        $('#'+stu_sno).textbox('resize', wd);
        $('#'+stu_register_day).textbox('resize', wd);
        $('#'+stu_idcard).textbox('resize', wd);
        $('#'+stu_former_name).textbox('resize', wd);

        $('#'+stu_name).textbox('resize', wd);
        $('#'+stu_school_name).textbox('resize', wd);
        $('#'+stu_counselor).textbox('resize', wd);
        $('#'+stu_birthday).textbox('resize', wd);

        $('#'+stu_gender).textbox('resize', wd);
        $('#'+stu_information_source).textbox('resize', wd);
        $('#'+stu_degree).textbox('resize', wd);
        $('#'+stu_recorder).textbox('resize', wd);

        $('#'+stu_remark).textbox('resize', parent.width() - 202 - 16);
    }
}



////////////////// 收费单（学费）详细信息 begin ////////////////////////////////////////////////////////////////////////
/**
 * 查看/新增 收费单（学费） 详细信息
 * @param page          学员详细信息页面
 * @param url           查询信息所用url
 * @param condition     查询条件。
 *      school_id     分校id，取回范围： all  or 具体分校id
 * @param uid           单据id（收费单id），新增时，可以不传递此参数。
 */
function danceAddReceiptStudyDetailInfo( page, url, condition, uid) {
    var title = '收费单（学费）详细信息';
    uid = uid || 0;     // 第一次进入 学生详细信息页面 uid 有效，上下翻页时，无法提前获取上下记录的uid
    if (uid <= 0) {
        title +='[新增]'
    }

    var no = -2;    // 收费单序号，方便翻页。传递 -2 则根据 uid 查询其序号

    var dgReceiptComm = 'dgReceipt_comm';   // 收费单（学费）基本信息
    var dgStudyFee = 'dgStudyFee';      // 班级——学费
    var dgTm = 'dgTm';                  // 教材费
    var dgOtherFee = 'dgOtherFee';      // 其他费
    var pagerFee = 'pager';
    var footer = 'footer';
    var panelFee = 'panelReceipt';
    var dcMayHide = 'dcMayHide';

    var dgParam = {};  // { dgReceiptComm: {idx: editIndex, dg: $('#'+dgReceiptComm) } }
    var edIndexStudyFee = undefined;
    var edIndexTm = undefined;

    var classlist = [];
    var schoollist = [];

    var dcDiscRateOrig = [ {value: '1', text:'100%' },    // 折扣率
        {value: '0.95', text:'95%' }];
    var dcDiscRate = dcDiscRateOrig.slice(0);
    var oldDetails = {}; // {"total": 100, "row": {}, 'errorCode': 0, 'msg': 'ok', 'class_receipt': [],'teach_receipt': [], 'other_fee': []}

    var mmClass = 'mmClass';    // 菜单id
    var mbClass = 'mbClass'+uid;    // 菜单按钮
    var mmTm = 'mmTm';
    var mbTm = 'mbTm'+uid;
    var mmOth = 'mmOth';
    var mbOth = 'mbOth'+uid;
    var btnAdd = 'addRecpt'+uid;

    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        if(uid > 0){
            $(parentDiv).tabs('close', title);
        } else {
            $(parentDiv).tabs('select', title);
            return;
        }
    }

    $(parentDiv).tabs('add', {
        title: title,
        href: page,
        closable: true,
        loadingMessage: '加载中...',
        onLoad : function () {  // panel
            // console.log(panel);
            $('#'+pagerFee).pagination({
                showRefresh: uid > 0,
                buttons:[{ text:'保存', iconCls:'icon-save',  handler:onSave},
                    { text:'新增', iconCls:'icon-add', id:btnAdd,  handler:onAdd}
                ],
                total: 0, pageSize: 1,
                beforePageText: '第', afterPageText: '条，总 {pages} 条',
                showPageList: false, showPageInfo: false,
                onSelectPage:function(pageNumber){  // , pageSize
                    if (uid> 0) {
                        no = pageNumber;
                        doAjaxReceiptDetail();
                    }
                }
            }).attr('id', pagerFee+=uid);        // 更新ID
            $('#'+dcMayHide).attr('id', dcMayHide+=uid);
            $('#'+dgReceiptComm).attr('id', dgReceiptComm+=uid).datagrid({  // 收费单（学费） ||||||||||||||||||||||
                onClickCell: dgReceiptClickCell,
                onEndEdit: function (index, row){
                    if (index === 0) {
                        var ed = $(this).datagrid('getEditor', { index: index, field: 'c4' });
                        row.c4 = $(ed.target).combobox('getText');
                        row.school_id = parseInt($(ed.target).combobox('getValue'));
                    }
                },
                onAfterEdit: function () {  // index,row,changes
                    dcSetArrearageStyle();    // 设置 欠费金额单元格的样式
                }
            });

            $('#'+dgStudyFee).attr('id', dgStudyFee+=uid).datagrid({    // 班级——学费 ==========================
                onClickCell: onClickCellStudyFee,
                onBeginEdit: function (index,row) {
                    var editors = $(this).datagrid('getEditors', index);
                    $(editors[1].target).numberbox('setText', row.term);    // 学期长度

                    $(editors[3].target).combobox({     // 折扣率
                        onClick: function (record) {    // 折扣率 combobox 点击事件
                            var dg = $('#'+dgStudyFee);
                            var row = $(dg).datagrid("getSelected");
                            row.discRateText =  record.text;
                            row.discount_rate = record.value;
                            var term = $(editors[1].target).textbox('getValue');
                            dgStudyFeeUpdateCellByTerm(edIndexStudyFee, term);
                        }
                    }).combobox('loadData', dcDiscRate).combobox('setValue', row['discount_rate']);
                },
                onEndEdit: function onEndEdit(index, row){
                    //console.log('onEndEdit', row);
                    var ed = $(this).datagrid('getEditor', { index: index, field: 'class_name' });
                    row.class_name = $(ed.target).combobox('getText');

                    var edDiscRate = $(this).datagrid('getEditor', { index: index, field: 'discRateText' });
                    row.discRateText = $(edDiscRate.target).combobox('getText');

                    row.term = dcTrimZero(row.term);
                },
                toolbar: [{iconCls: 'icon-add', text: '增加行', handler:function(){
                    $('#'+dgStudyFee).datagrid('appendRow', {})}},
                    {iconCls: 'icon-remove', text: '删除行', handler: function () {
                        dgStudyFeeEndEditing();
                        danceDelRow($('#'+dgStudyFee));
                    }},'-',{id :mbClass}
                ]
            });

            $('#'+mmClass).attr('id', mmClass+=uid).menu({
                onClick: function (item) {
                    console.log(item);
                    var dg = $('#'+dgStudyFee);
                    var rows = dg.datagrid('getRows');
                    var idx = null;
                    var i;
                    for (i=0; i< rows.length; i++) {
                        if (idx === null && !rows[i].class_name){
                            idx = i;
                        }
                        if (item.class_name === rows[i].class_name){
                            $.messager.alert('提示', '班级已经存在', 'info');
                            return;
                        }
                    }
                    var nd = {class_name: item.class_name, class_no: item.class_no, class_id:item.class_id,
                        cost_mode: item.cost_mode, cost:item.cost, cost_mode_text: getClassCostMode(item.cost_mode)};
                    if (idx !== null) {
                        dgStudyFeeEndEditing();
                        dg.datagrid('updateRow', {index:idx, row:nd});
                    }else{
                        dg.datagrid('appendRow',nd);
                    }
                }
            });

            $('#'+mbClass).menubutton({
                text: '已报班',
                iconCls: 'icon-ok',
                disabled: uid <= 0,
                menu: '#'+mmClass
            });

            $('#'+dgTm).attr('id', dgTm+=uid).datagrid({       // 教材费   -----------------------------------------
                onClickCell: function (index, field) {
                    dgEndEditing(dgReceiptComm);
                    dgStudyFeeEndEditing();
                    dgEndEditing(dgOtherFee);
                    if (edIndexTm !== index) {
                        var dg = $('#' + dgTm);
                        dgTmEndEditing();
                        $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);
                        var ed = $(dg).datagrid('getEditor', {index:index,field:field});
                        if (ed){
                            ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
                        }
                        edIndexTm = index;
                    }
                },
                onBeginEdit: function (index,row) {
                    var dg = $('#'+dgTm);
                    var editors = dg.datagrid('getEditors', index);
                    var edClass = editors[0].target;   // 注意序号 ***  班级名称
                    $(edClass).combogrid({
                        data: filterClassBySchool(classlist)
                    }).combogrid('setValue', row.class_id);

                    var edTmName = editors[1].target;   // 注意序号 *** 教材名称
                    $(edTmName).combogrid({
                        url:'/api/dance_tm_get',
                        onSelect: function (index,record) {
                            var dg = $('#'+dgTm);
                            var row = $(dg).datagrid("getSelected");
                            row.material_id = record.id;
                            row.tm_no = record.tm_no;
                            row.tm_unit = record.tm_unit;
                            row.tm_price_sell = record.tm_price_sell;
                            if (!row.dt_num) {
                                row.dt_num = 1;
                                setDgCellTextEx(dg, edIndexTm, 'dt_num', row.dt_num);
                            }
                            if (!row.is_got) {
                                row.is_got = '是';
                                setDgCellTextEx(dg, edIndexTm, 'is_got', row.is_got);
                            }
                            setDgCellText(dg, edIndexTm, 'tm_no', row.tm_no);
                            setDgCellText(dg, edIndexTm, 'tm_unit', row.tm_unit);
                            setDgCellTextEx(dg, edIndexTm, 'tm_price_sell', row.tm_price_sell);
                            dgTmUpdateCell(edIndexTm);
                        }
                    }).combogrid('setValue', row.material_id);

                    // 单价
                    $(editors[2].target).textbox('textbox').bind("input propertychange",function() {
                        dgTmUpdateCell(edIndexTm, {price: $(this).val()});
                    });

                    // 数量
                    $(editors[3].target).textbox('textbox').bind("input propertychange",function() {
                        dgTmUpdateCell(edIndexTm, {num: $(this).val()});
                    });
                },
                onEndEdit: function onEndEdit(index, row){
                    var ed = $(this).datagrid('getEditor', { index: index, field: 'tm_name' });
                    row.tm_name = $(ed.target).combobox('getText');
                    row.material_id = $(ed.target).combobox('getValue');

                    var edClass = $(this).datagrid('getEditor', { index: index, field: 'class_name' });
                    row.class_name = $(edClass.target).combobox('getText');
                    row.class_id = $(edClass.target).combobox('getValue');
                },
                toolbar: [{iconCls: 'icon-add', text: '增加行', handler:function(){
                    $('#'+dgTm).datagrid('appendRow', {})}},
                    {iconCls: 'icon-remove', text: '删除行', handler: function () {
                        dgTmEndEditing();
                        danceDelRow($('#'+dgTm));
                    }},'-',{id :mbTm}
                ]
            });

            $('#'+mmTm).attr('id', mmTm+=uid).menu({
                onClick: function (item) {
                    console.log(item);
                    var dg = $('#'+dgTm);
                    var rows = $(dg).datagrid('getRows');
                    var nd = {class_name: item.class_name, class_no: item.class_no, class_id : item.class_id };
                    for (var i=0; i< rows.length; i++) {
                        if (!rows[i].class_name){
                            var new_row = {};
                            $.extend(new_row, rows[i]);
                            $.extend(new_row, nd);
                            dgTmEndEditing();
                            $(dg).datagrid('updateRow', {index:i, row:new_row});
                            return;
                        }
                    }
                    $(dg).datagrid('appendRow', nd);
                }
            });

            $('#'+mbTm).menubutton({
                text: '已报班',
                iconCls: 'icon-ok',
                disabled: uid <= 0,
                menu: '#'+mmTm
            });

            $('#'+dgOtherFee).attr('id', dgOtherFee+=uid).datagrid({    // 其他费  +++++++++++++++++++++++++++++
                toolbar: [{iconCls: 'icon-add', text: '增加行', handler:function(){
                    $('#'+dgOtherFee).datagrid('appendRow', {})}},
                    {iconCls: 'icon-remove', text: '删除行', handler: function () {
                        danceDelRow($('#'+dgOtherFee)); }},'-',{id :mbOth}
                ],
                onClickCell: dgOthFeeClickCell,
                onEndEdit: dgOthFeeEndEdit
            });

            $('#'+mmOth).attr('id', mmOth+=uid).menu({
                onClick: function (item) {
                    console.log(item);
                    var dg = $('#'+dgOtherFee);
                    var rows = $(dg).datagrid('getRows');
                    var nd = {class_name: item.class_name, class_no: item.class_no, class_id : item.class_id };
                    for (var i=0; i< rows.length; i++) {
                        if (!rows[i].class_name){
                            var new_row = {};
                            $.extend(new_row, rows[i]);
                            $.extend(new_row, nd);
                            dgEndEditing('#'+dgOtherFee);
                            $(dg).datagrid('updateRow', {index:i, row:new_row});
                            return;
                        }
                    }
                    $(dg).datagrid('appendRow', nd);
                }
            });

            $('#'+mbOth).menubutton({
                text: '已报班',
                iconCls: 'icon-ok',
                disabled: uid <= 0,
                menu: '#'+mmOth
            });

            $('#'+footer).attr('id', footer+=uid);
            $('#'+panelFee).attr('id', panelFee+=uid).mousedown(function (event) {      // panel 鼠标按下事件
                //console.log(event);
                if (event.target.id === panelFee) {
                    dgEndEditing(dgReceiptComm);
                    dgStudyFeeEndEditing();
                    dgTmEndEditing();
                    dgEndEditing(dgOtherFee);
                }
            });

            dgParam[dgReceiptComm] = {idx: undefined, dg: '#'+dgReceiptComm};
            dgParam[dgStudyFee] = {idx: undefined, dg: '#'+dgStudyFee};
            dgParam[dgTm] = {idx: undefined, dg: '#'+dgTm};
            dgParam[dgOtherFee] = {idx: undefined, dg: '#'+dgOtherFee};

            setDgCellColor('#'+dgReceiptComm, 0, 'c1', '#555');

            if (uid > 0) {  // 修改，查看
                doAjaxReceiptDetail();
            } else {    // 新增
                newReceipt();       // 该函数调用只能放到后面，否则会引起 新增 收据单 表格的表头和内容不对齐
            }
            ajaxGetReceiptExtras();
        }   // end of onLoad
    });


    /**
     * 查询 收费单 详细信息
     */
    function doAjaxReceiptDetail() {
        var cond = {'receipt_id': uid, 'page': no, 'rows': 1};
        $.extend(cond, condition);

        $.ajax({
            url: url + '_details_get',
            async: true, dataType: 'json', method: 'POST',
            data: cond
        }).done(function (data) {
            console.log('recpt:', data);
            if(data.errorCode != 0 ){
                $.messager.alert('提示', data.msg, 'info');
            }else{
                // 更新翻页控件 页码
                $('#'+pagerFee).pagination({total: data.total, pageNumber:no===-2?data.row.no:no });

                $.extend(true, oldDetails, data);

                // 更新 收费单（学费）基本信息
                $('#'+dgReceiptComm).datagrid('updateRow',{ index: 0,
                    row: {c2: data.row['receipt_no'],
                        c4: data.row['school_name'],
                        c6: data.row['deal_date'],
                        school_id: data.row.school_id
                    }
                }).datagrid('updateRow', { index: 1,
                    row: {c2: data.row['student_no'],
                        c4: data.row['student_name'],
                        c6: data.row['receivable_fee'],
                        student_id: data.row.student_id
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
                        c4: data.row['paper_receipt'],     // 收据号
                        c6: data.row['recorder']
                    }
                }).datagrid('updateRow', { index: 5,
                    row: {c2: data.row['remark']
                    }
                });
                dcSetArrearageStyle();

                dgLoadData('#'+dgStudyFee, data['class_receipt']);  // 更新 班级——学费 表
                dgLoadData('#'+dgTm, data['teach_receipt']);        // 更新 教材费 表

                if (data['other_fee'].length === 0) {
                    $('#'+dcMayHide).hide();    // 隐藏 其他费
                } else {
                    $('#'+dcMayHide).show();
                    dgLoadData('#'+dgOtherFee, data['other_fee']);       // 更新 其他费
                }
                updateMenu(data.cls);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
            $.messager.alert('提示', msg, 'info');
        });
    }

    /**
     * 新增单据 —— 收费单（学费）
     */
    function newReceipt() {
        var num = 3;
        danceDgLoadData(dgStudyFee, [], num);
        danceDgLoadData(dgTm, [], num);
        $('#'+dcMayHide).hide();    // 隐藏 其他费

        // 更新 收费单（学费）基本信息
        $('#'+dgReceiptComm).datagrid('updateRow',{ index: 0,
            row: {c2: '[自动生成]',
                c6: danceFormatter(new Date())
            }
        }).datagrid('updateRow', { index: 1,
            row: {c2:  '[关联学员姓名]',
                c4: '',
                c6: '',
                student_id: undefined
            }
        }).datagrid('updateRow', { index: 2,
            row: {c2: '',
                c4: '',
                c6: ''
            }
        }).datagrid('updateRow', { index: 3,
            row: {c2: '',
                c4: '',
                c6: ''
            }
        }).datagrid('updateRow', { index: 4,
            row: {c2: '',
                c4: '',     // 收据号
                c6: '[关联当前用户]'
            }
        }).datagrid('updateRow', { index: 5,
            row: {c2: ''
            }
        });

        $('#'+btnAdd).linkbutton('disable');
        oldDetails = {};
        uid = 0;
        updateMenu([]);
    }

    /**
     * 收费单（学费） 单元格点击事件
     * @param index
     * @param field
     */
    function dgReceiptClickCell(index,field) {
        dgStudyFeeEndEditing();
        dgTmEndEditing();
        dgEndEditing('#'+dgOtherFee);
        //console.log('index=',index, ' field=', field, ' value=', value);
        if (dgParam[dgReceiptComm].idx !== index) {
            var dg = $(dgParam[dgReceiptComm].dg);
            dgEndEditing(dgReceiptComm);
            $(dg).datagrid('removeEditor', ['c2', 'c4', 'c6']);
            dcAddRowEditors(dg, index);

            $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);
            var row = $(dg).datagrid("getSelected");

            if (index === 0){
                var eds = $(dg).datagrid('getEditor', {index:index,field:'c4'});
                $(eds.target).combobox({
                    editable:false,panelHeight:'auto',
                    valueField: 'school_id',textField: 'school_name',
                    data:filterSchool(schoollist)
                }).combobox('setValue', row.school_id);
            }else if (index === 1) {
                var edname = $(this).datagrid('getEditor', {index:index,field:'c4'});
                $(edname.target).combobox({
                    valueField: 'name', textField: 'name', hasDownArrow: false,
                    onChange: function autoComplete (newValue) {    // ,oldValue
                        //console.log('newValue=' + newValue + ' oldValue=' + oldValue);
                        var cond = $.trim(newValue);
                        var dcCond = {'name': cond, 'is_training': '是', 'school_id': condition.school_id };
                        if (newValue.length > 1) {
                            $.post('/api/dance_student_query',dcCond, function(data){
                                $(edname.target).combobox('loadData', data);
                            },'json');
                        }
                    },
                    onClick:function (record) {
                        //console.log(record);
                        var dg = $('#'+dgReceiptComm);
                        setDgCellTextWithRowData(dg, 1, 'c2', record.code);
                        var row = $(dg).datagrid('getSelected');
                        row.student_id = record.id;
                        row.c4 = record.name;

                        $.ajax({
                            method: 'POST',
                            url: '/api/dance_class_by_student',
                            async: true,
                            dataType: 'json',
                            data: {student_id: record.id }
                        }).done(function(data) {
                            if (data.errorCode == 0) {
                                dgLoadData('#'+dgStudyFee, data.cls, true);
                                updateMenu(data.cls);
                            } else {
                                $.messager.alert('提示', data.msg, 'info');
                            }
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
                            $.messager.alert('提示', msg, 'info');
                        });
                    }
                }).combobox('setValue', row.c4);
            }

            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            dgParam[dgReceiptComm].idx = index;
        }
    }

    function dgOthFeeClickCell(index,field) {
        dgEndEditing(dgReceiptComm);
        dgStudyFeeEndEditing();
        dgTmEndEditing();
        if (dgParam[dgOtherFee].idx !== index) {
            var dg = $('#' + dgOtherFee);
            dgEndEditing(dgOtherFee);
            $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);
            var row = $(dg).datagrid("getSelected");
            var edc = $(dg).datagrid('getEditor', {index:index,field:'class_name'});
            $(edc.target).combogrid({       // 班级名称
                data: filterClassBySchool(classlist)
            }).combogrid('setValue', row.class_id);

            var edf = $(dg).datagrid('getEditor', {index:index,field:'fee_item'});
            $(edf.target).combobox({       // 收费项目
                valueField:'fee_id',
                textField:'fee_item',
                url: '/api/dance_fee_item_get'
            }).combobox('setValue', row.fee_item_id);

            var edRealFee = $(dg).datagrid('getEditor', {index:index,field:'real_fee'});    // 收费金额
            $(edRealFee.target).textbox('textbox').bind("input propertychange",function(){
                var row = $(dg).datagrid("getSelected");
                var newVal = $(this).val();
                var oldFee = row.real_fee ? parseFloat(row.real_fee) : 0;
                var newFee = newVal ? parseFloat(newVal) : 0;
                var diff = newFee - oldFee;
                dcCalcFeeByOth(diff);
                row.real_fee = newFee;
            });

            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            dgParam[dgOtherFee].idx = index;
        }
    }

    function dgOthFeeEndEdit(index, row){
        var ed = $(this).datagrid('getEditor', { index: index, field: 'fee_item' });
        row.fee_item = $(ed.target).combobox('getText');
        row.fee_item_id = $(ed.target).combobox('getValue');

        var edClass = $(this).datagrid('getEditor', { index: index, field: 'class_name' });
        row.class_name = $(edClass.target).combobox('getText');
        row.class_id = $(edClass.target).combobox('getValue');
    }

    // 以下对菜单的代码。当原菜单和要修改后的菜单相同时，会造成 mmTm为空，mmOth多一个（多了mmTm的菜单内容）
    var _oldMenuIds = {};
    function mmAddItems(mmId, data, mbId) {       // 菜单<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        if(!_oldMenuIds.hasOwnProperty(mmId)){
            _oldMenuIds[mmId] = [];
        }
        var i;
        var fa = [];
        for(i=0; i< data.length; i++){
            if (!data[i].class_name){   // 过滤名称为空的
                continue;
            }
            fa.push(data[i].class_no);
        }
        var change = dcFindChange(_oldMenuIds[mmId], fa);
        for(var m = 0; m < change[0].length; m++){ // 删除
            var itemEl = $('#'+change[0][m])[0];  // the menu item element
            $(mmId).menu('removeItem',itemEl);
        }
        for(i = 0; i < change[1].length; i++){ // 增加
            for(var j = 0; j < data.length; j++){
                if(change[1][i] === data[j].class_no){
                    $(mmId).menu('appendItem', {
                        text: data[j].class_name,
                        class_name:data[j].class_name,
                        iconCls: 'icon-ok',
                        id: data[j].class_no,
                        class_id: data[j].class_id,
                        class_no: data[j].class_no,
                        cost_mode: data[j].cost_mode,
                        cost: data[j].cost
                    });
                    break;
                }
            }
        }
        _oldMenuIds[mmId] = fa.slice(0);

        if (change[1].length || change[2].length) {
            $(mbId).menubutton('enable');
        }else {
            $(mbId).menubutton('disable');
        }
    }

    function updateMenu(data) {
        mmAddItems('#'+mmOth, data, '#'+mbOth);
        mmAddItems('#'+mmTm, data, '#'+mbTm);
        mmAddItems('#'+mmClass, data, '#'+mbClass);
    }

    /**
     * 收费单（学费）详细页面 新增/修改。 对某个表格重新加载数据，并计算收费单费用。
     * @param dg                表格
     * @param data              表格数据
     * @param calcFee           是否计算收费单基本情况中的费用， 可选参数，传递该参数则计算费用
     */
    function dgLoadData(dg, data, calcFee) {
        var diffWanted = 0;
        var diffReal = 0;
        var diffArrearage = 0;

        if (calcFee) {
            var rows = $(dg).datagrid('getRows');
            for(var m = 0; m < rows.length; m++){
                if (rows[m].cost && rows[m].term ){
                    diffWanted -= parseFloat(rows[m].total);
                    diffReal -= parseFloat(rows[m].real_fee);
                    diffArrearage -= parseFloat(rows[m].arrearage);
                }
            }
            dcCalcFeeByStudy(diffWanted, diffReal, diffArrearage);
        }

        $(dg).datagrid('loadData', data);
        var num = 3;
        var len = data.length;
        for(var i = 0; i < num - len; i++ ) {
            $(dg).datagrid('appendRow', {});
        }
    }

    /**
     * 班级——学费 编辑, 单元格点击事件。
     * @param index
     * @param field
     */
    function onClickCellStudyFee(index, field) {
        dgEndEditing(dgReceiptComm);
        dgTmEndEditing();
        dgEndEditing(dgOtherFee);
        if (edIndexStudyFee !== index) {
            var dg = $('#'+dgStudyFee);
            dgStudyFeeEndEditing();
            $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);
            var row = $(dg).datagrid("getSelected");
            var editors = dg.datagrid('getEditors', index);

            // 班级名称 editor
            var classEd =  $(dg).datagrid('getEditor', {index:index,field:'class_name'});
            if (classEd){
                $(classEd.target).combobox({
                    data: filterClassBySchool(classlist),
                    onClick: dgStudyFeeOnClickClass
                }).combobox('setValue', row['class_no']);
            }

            // 学期长度 editor
            var edTerm = $(dg).datagrid('getEditor', {index:index,field:'term'});
            if (edTerm) {
                $(edTerm.target).textbox('textbox').bind("input propertychange",function(){
                    dgStudyFeeUpdateCellByTerm(index, $(this).val());
                });

                $(edTerm.target).textbox('textbox').bind("blur",function() {
                    var value=$(this).val();
                    $(edTerm.target).textbox('setText', dcTrimZero(value));
                    dgStudyFeeUpdateCellByTerm(index, value);
                });
            }

            // 优惠金额，修改优惠金额后，更新 折扣率、应收金额、实收金额和学费欠费。
            $(editors[2].target).textbox('textbox').bind("input propertychange",function(){
                dgStudyFeeUpdateCellByDiscount(index, $(this).val());

                if (row.sum && row.sum > 0) {
                    // 以下更新折扣率。若相应折扣率存在，则不添加。否则添加新的折扣率
                    var rate = (row.sum-$(this).val())/row.sum;
                    var dr = dcCalcDiscountRate(rate);  // 折扣率
                    dcDiscRate = dcDiscRateOrig.slice();
                    var found = false;
                    for (var i = 0; i < dcDiscRate.length; i++) {
                        if (dr.text === dcDiscRate[i].text) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        dcDiscRate.push(dr);
                    }
                    $(editors[3].target).combobox('loadData', dcDiscRate).combobox('setValue', dr.value);
                    row.discRateText = dr.text;
                    row.discount_rate = dr.value;
                }
            });

            // 实收学费
            $(editors[4].target).textbox('textbox').bind("input propertychange",function(){
                var oldReal = row.real_fee ? parseFloat(row.real_fee) : 0;
                var oldArrearage = row.arrearage ? parseFloat(row.arrearage) : 0;

                row.real_fee = $(this).val();
                row.arrearage = row.total-row.real_fee;
                setDgCellText(dg, index, 'arrearage', row.arrearage);

                // 实收学费变化后，更新 收费单（学费） 的实收费合计 和 学费欠费。
                var newReal = row.real_fee ? parseFloat(row.real_fee) : 0;
                var diffReal =  newReal - oldReal;
                var newArrearage = row.arrearage ? parseFloat(row.arrearage) : 0;
                var diffArrearage = newArrearage - oldArrearage;

                var dgRc = $('#'+dgReceiptComm);
                var val;
                val = (val = apiGetDgCellText(dgRc, 3, 'c2')) ? parseFloat(val)+diffReal : diffReal;
                setDgCellTextWithRowData(dgRc, 3, 'c2', dcTrimZero(val));   // 实收费合计
                val = (val = apiGetDgCellText(dgRc, 3, 'c4')) ? parseFloat(val)+diffArrearage : diffArrearage;
                setDgCellTextWithRowData(dgRc, 3, 'c4', dcTrimZero(val));   // 学费欠费

                dcSetArrearageStyle(val);
            });

            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            edIndexStudyFee = index;
        }
    }

    /**
     * 设置 学费欠费 的样式。 当有欠费时，设置为红色背景。
     * @param val       欠费数额
     */
    function dcSetArrearageStyle(val) {
        var dgRc = $('#'+dgReceiptComm);
        val = val || apiGetDgCellText(dgRc, 3, 'c4');
        if (val > 0) {
            setDgCellColorEx(dgRc, 3, 'c4', 'white', 'red');
        } else {
            clearDgCellColorEx(dgRc, 3, 'c4');
        }
    }

    /**
     * 教材费 表格，更新 “教材费”总金额。 --- 同时更新 收费单 基本信息中的 教材费、费用合计、实收费合计
     * @param index     行索引，从0开始
     * @param parms     单价，可选参数，例如： {price: 50, num: 1}
     */
    function dgTmUpdateCell(index, parms) {
        var dg = $('#'+dgTm);
        var rows = dg.datagrid('getRows');
        if (rows.length < index + 1) {  return; }
        var row = rows[index];
        var oldFee = row.fee;

        if (parms && (parms.price || parms.price === '')) {
            row.tm_price_sell = parms.price;
        } else {
            var edPrice = $(dg).datagrid('getEditor', {index: index, field: 'tm_price_sell'});  // 教材 单价
            if (edPrice) {
                row.tm_price_sell = $(edPrice.target).textbox('getValue');
            }
        }

        if (parms && (parms.num || parms.num === '')) {
            row.dt_num = parms.num;
        } else {
            var edNum = $(dg).datagrid('getEditor', {index: index, field: 'dt_num'});       // 教材 数量
            if (edNum) {
                row.dt_num = parseInt($(edNum.target).textbox('getValue'));
            }
        }

        if (row.tm_price_sell && row.dt_num){
            row.fee = dcTrimZero(row.tm_price_sell * row.dt_num);
            setDgCellTextEx(dg, index, 'fee', row.fee);
        } else {
            row.fee = '';
            setDgCellTextEx(dg, index, 'fee', row.fee);
        }

        // 同时更新 收费单 基本信息中的 教材费、费用合计、实收费合计
        if (oldFee != row.fee)
        {
            var oldFeeVal = (oldFee ? parseFloat(oldFee) : 0);
            var newFeeVal = (row.fee ? parseFloat(row.fee) : 0);
            var difference = newFeeVal - oldFeeVal;
            dcCalcFeeByTm(difference);
        }
    }

    /**
     * 根据教材费差值，更新 收费单（学费）的费用：教材费、费用合计、实收费合计
     * @param difference        教材费差值： 正 加金额，负 减金额。
     */
    function dcCalcFeeByTm(difference) {
        var dg = $('#'+dgReceiptComm);
        var val;
        val = (val = apiGetDgCellText(dg, 2, 'c2')) ? parseFloat(val)+difference : difference;
        setDgCellTextWithRowData(dg, 2, 'c2', dcTrimZero(val)); // 教材费
        val = (val = apiGetDgCellText(dg, 2, 'c6')) ? parseFloat(val)+difference : difference;
        setDgCellTextWithRowData(dg, 2, 'c6', dcTrimZero(val)); // 费用合计
        val = (val = apiGetDgCellText(dg, 3, 'c2')) ? parseFloat(val)+difference : difference;
        setDgCellTextWithRowData(dg, 3, 'c2', dcTrimZero(val)); // 实收费合计
    }

    /**
     * 根据 其他费 差值，更新 收费单（学费）的费用：教材费、费用合计、实收费合计
     * @param difference        教材费差值： 正 加金额，负 减金额。
     */
    function dcCalcFeeByOth(difference) {
        var dg = $('#'+dgReceiptComm);
        var val;
        val = (val = apiGetDgCellText(dg, 2, 'c4')) ? parseFloat(val)+difference : difference;
        setDgCellTextWithRowData(dg, 2, 'c4', dcTrimZero(val)); // 其他费
        val = (val = apiGetDgCellText(dg, 2, 'c6')) ? parseFloat(val)+difference : difference;
        setDgCellTextWithRowData(dg, 2, 'c6', dcTrimZero(val)); // 费用合计
        val = (val = apiGetDgCellText(dg, 3, 'c2')) ? parseFloat(val)+difference : difference;
        setDgCellTextWithRowData(dg, 3, 'c2', dcTrimZero(val)); // 实收费合计
    }

    /**
     * 班级——学费 表格，根据 学期长度，更新 实收学费，应收学费等单元格
     * @param index     要更新的行索引，从0开始
     * @param value     需求长度 的当前值
     */
    function dgStudyFeeUpdateCellByTerm(index,value) {
        var dg = $('#'+dgStudyFee);
        var rows = dg.datagrid('getRows');
        if (rows.length < index + 1) {  return; }
        var row = rows[index];
        if (row.cost) {
            var oldWanted = row.total;
            var oldReal = row.real_fee;
            var oldArrearage = row.arrearage;

            row.sum = dcTrimZero(row.cost * value);     // 优惠前学费
            row.discount = row.discount_rate ? Math.round(row.sum *(1-row.discount_rate)) : '';
            if (row.discount === 0) {
                row.discount = '';
            }
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
            var edDiscount = $(dg).datagrid('getEditor', {index: index, field: 'discount'});
            if (edDiscount) {
                $(edDiscount.target).textbox('setValue', row.discount);
            } else {
                setDgCellText(dg, index, 'discount', row.discount);
            }

            // 更新 收费单（学费）中的相关费用：应收学费、费用合计、实收费合计、学费欠费
            var oldWantedVal = (oldWanted ? parseFloat(oldWanted) : 0);
            var newWantedVal = (row.total ? parseFloat(row.total) : 0);
            var diffWanted = newWantedVal - oldWantedVal;
            var oldRealVal = (oldReal ? parseFloat(oldReal) : 0);
            var newRealVal = (row.real_fee ? parseFloat(row.real_fee) : 0);
            var diffReal = newRealVal - oldRealVal;
            var oldArrearageVal = (oldArrearage ? parseFloat(oldArrearage) : 0);
            var newArrearageVal = (row.arrearage ? parseFloat(row.arrearage) : 0);
            var diffArrearage = newArrearageVal - oldArrearageVal;
            dcCalcFeeByStudy(diffWanted,diffReal, diffArrearage);
        }
    }

    /**
     * 根据班级——学费，更新 收费单（学费）的费用：应收学费、费用合计、实收费合计、学费欠费
     * @param diffWanted        应收学费 差值。正 加金额，负 减金额。下同
     * @param diffReal          实收费合计 差值
     * @param diffArrearage     学费欠费 差值
     */
    function dcCalcFeeByStudy(diffWanted, diffReal, diffArrearage) {
        var dg = $('#'+dgReceiptComm);
        var val;
        val = (val = apiGetDgCellText(dg, 1, 'c6')) ? parseFloat(val)+diffWanted : diffWanted;
        setDgCellTextWithRowData(dg, 1, 'c6', dcTrimZero(val)); // 应收学费
        val = (val = apiGetDgCellText(dg, 2, 'c6')) ? parseFloat(val)+diffWanted : diffWanted;
        setDgCellTextWithRowData(dg, 2, 'c6', dcTrimZero(val)); // 费用合计
        val = (val = apiGetDgCellText(dg, 3, 'c2')) ? parseFloat(val)+diffReal : diffReal;
        setDgCellTextWithRowData(dg, 3, 'c2', dcTrimZero(val));   // 实收费合计
        val = (val = apiGetDgCellText(dg, 3, 'c4')) ? parseFloat(val)+diffArrearage : diffArrearage;
        setDgCellTextWithRowData(dg, 3, 'c4', dcTrimZero(val));   // 学费欠费

        dcSetArrearageStyle();
    }

    /**
     * 班级——学费 表格，根据 优惠金额，更新 实收学费，应收学费单元格
     * @param index     要更新的行索引，从0开始
     * @param value     需求长度 的当前值
     */
    function dgStudyFeeUpdateCellByDiscount(index,value) {
        var dg = $('#'+dgStudyFee);
        var rows = dg.datagrid('getRows');
        if (rows.length < index + 1) {  return; }
        var row = rows[index];
        if (row.cost && row.term) {
            var oldWanted = row.total;
            var oldReal = row.real_fee;
            var oldArrearage = row.arrearage;

            row.discount = value;
            row.total = dcTrimZero(row.sum - (row.discount ? row.discount : 0));    // 应收学费
            row.real_fee = row.total; // 实收学费
            row.arrearage = row.total - row.real_fee;   // 学费欠费
            var edRealFee = $(dg).datagrid('getEditor', {index: index, field: 'real_fee'});
            if (edRealFee) {    //// 实收学费
                edRealFee.target.textbox('setValue', row.real_fee);
            } else {
                setDgCellText(dg, index, 'real_fee', row.real_fee);
            }
            setDgCellText(dg, index, 'total', row.total);   //// 应收学费
            setDgCellText(dg, index, 'arrearage', row.arrearage);   //// 学费欠费

            // 更新 收费单（学费）中的相关费用：应收学费、费用合计、实收费合计、学费欠费
            var oldWantedVal = (oldWanted ? parseFloat(oldWanted) : 0);
            var newWantedVal = (row.total ? parseFloat(row.total) : 0);
            var diffWanted = newWantedVal - oldWantedVal;
            var oldRealVal = (oldReal ? parseFloat(oldReal) : 0);
            var newRealVal = (row.real_fee ? parseFloat(row.real_fee) : 0);
            var diffReal = newRealVal - oldRealVal;
            var oldArrearageVal = (oldArrearage ? parseFloat(oldArrearage) : 0);
            var newArrearageVal = (row.arrearage ? parseFloat(row.arrearage) : 0);
            var diffArrearage = newArrearageVal - oldArrearageVal;
            dcCalcFeeByStudy(diffWanted,diffReal, diffArrearage);
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
            data: {'school_id': condition.school_id}
        }).done(function(data){
            if(data.errorCode === 0) {
                classlist = data['classlist'];
                schoollist = data['schoollist'];
                setSchoolName(schoollist);
            } else {
                $.messager.alert('错误',data.msg,'error');
            }
        });
    }

    /**
     * 设置分校名称/id。   新增收费单时，才 更新 分校名称
     * @param schoollist        分校id,名称 列表
     */
    function setSchoolName(schoollist) {
        if (uid <=0 && schoollist.length) {
            setDgCellTextWithRowData($('#'+dgReceiptComm), 0, 'c4', schoollist[0].school_name);
            apiSetDgCellText('#'+dgReceiptComm, 0, 'school_id', schoollist[0].school_id);
        }
    }

    /**
     * 根据分校id（内部使用分校编号）过滤班级。 新增记录时，选择分校后，只能选择选定分校的班级。
     * @param classList     班级列表。可能属于多个分校。
     * @returns {*}
     */
    function filterClassBySchool(classList) {
        var school_id = apiGetDgCellText('#'+dgReceiptComm, 0, 'school_id');

        var class_no_filter = null;
        for(var m = 0; m < schoollist.length; m++){
            if(school_id === schoollist[m].school_id){
                class_no_filter = schoollist[m]['school_no'] + '-BJ-';
                break;
            }
        }

        var rows = [];
        for (var i = 0; i < classList.length; i++) {
            if(classList[i].class_no.indexOf(class_no_filter) === 0){
                rows.push(classList[i]);
            }
        }
        return rows;
    }

    /**
     * 根据分校id过滤分校信息。用于修改记录时，只保留学员所在的分校。即，学员报名后，不能修改学员的分校。
     * @param schoolList
     */
    function filterSchool(schoolList) {
        if (uid <= 0) {
            return schoolList;
        }
        var school_id = apiGetDgCellText('#'+dgReceiptComm, 0, 'school_id');
        for(var m = 0; m < schoollist.length; m++){
            if(school_id == schoollist[m].school_id){
                return [schoollist[m]];
            }
        }
    }

    /**
     * 班级——学费 表选中某个班级事件
     * @param record
     */
    function dgStudyFeeOnClickClass(record) {
        var dg = $('#'+dgStudyFee);
        var row = $(dg).datagrid("getSelected");
        row['class_no'] =  record['class_no'];
        row['class_name'] = record['class_name'];
        row.class_id = record.class_id;
        row.cost_mode = record.cost_mode;
        row.cost_mode_text = getClassCostMode(row.cost_mode);
        row.cost = record.cost;

        setDgCellText(dg, edIndexStudyFee, 'cost_mode', row.cost_mode_text);
        setDgCellText(dg, edIndexStudyFee, 'cost', row.cost);

        var ed = dg.datagrid('getEditor', {index:edIndexStudyFee,field:'term'});
        var term = $(ed.target).textbox('getValue');
        dgStudyFeeUpdateCellByTerm(edIndexStudyFee, term);
    }

    /**
     * 保存 收费单（学费）详细信息
     */
    function onSave() {
        dgEndEditing(dgReceiptComm);
        dgStudyFeeEndEditing();
        dgTmEndEditing();

        if (!validateReceiptInfo()) {
            return false;
        }

        var newRecpt = packageReceipt();
        console.log(newRecpt);

        $.ajax({
            method: "POST",
            url: '/dance_receipt_study_modify',
            data: { data: JSON.stringify(newRecpt) }
        }).done(function(data) {
            if (data.errorCode == 0) {
                if(uid <=0) {
                    $('#'+btnAdd).linkbutton('enable');
                    uid = data.id;
                }
                $.messager.alert('提示', data.msg, 'info');
                doAjaxReceiptDetail();  // 更新 收费单 信息
            } else {
                $.messager.alert('提示', data.msg, 'info');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
            $.messager.alert('提示', msg, 'info');
        });
    }

    function onAdd() {
        if (title.indexOf('[新增]') > 0 ){
            newReceipt();
        } else {
            danceAddReceiptStudyDetailInfo('/static/html/_receipt_study.html', '/dance_receipt_study', condition);
        }
    }

    /**
     * 验证收费单是否有效
     * @returns {boolean}           true 有效。 false 无效
     */
    function validateReceiptInfo() {
        var dg = $('#'+dgReceiptComm);
        var stuName = apiGetDgCellText(dg, 1, 'c4');
        if (!stuName) {
            $.messager.alert({ title: '提示',icon:'info', msg: '请输入学员姓名！',
                fn: function(){
                    //dgReceiptClickCell(1, 'c4', stuName);
                }
            });
            return false;
        }

        var realFee = apiGetDgCellText(dg, 3, 'c2');
        var arrearage = apiGetDgCellText(dg, 3, 'c4');
        if (realFee == 0 && arrearage == 0 ) {
            $.messager.alert({ title: '提示',icon:'info', msg: '实收费合计为 0，请输入学费或者教材费！'});
            return false;
        }

        return true;
    }

    /**
     * 打包 收费单（学费）
     * @returns {{row: {}, class_receipt: Array, teach_receipt: Array, other_fee: Array}}
     */
    function packageReceipt() {

        var i;
        var dgRecpt = $('#'+dgReceiptComm);
        var rows = dgRecpt.datagrid('getRows');
        var recpt = {row: {}, class_receipt: [], teach_receipt: [], other_fee: []};
        recpt.row.id = oldDetails.row ? oldDetails.row.id : 0;
        recpt.row.school_id = rows[0].school_id;
        recpt.row.school_name = rows[0].c4;
        recpt.row.deal_date = rows[0].c6;
        recpt.row.student_id = rows[1].student_id;
        recpt.row.student_name = rows[1].c4;
        recpt.row.receivable_fee = rows[1].c6;
        recpt.row.teaching_fee = rows[2].c2;
        recpt.row.other_fee = rows[2].c4;
        recpt.row.total = rows[2].c6;
        recpt.row.real_fee = rows[3].c2;
        recpt.row.arrearage = rows[3].c4;
        recpt.row.counselor = rows[3].c6;
        recpt.row.fee_mode = rows[4].c2;
        recpt.row.paper_receipt = rows[4].c4;
        recpt.row.remark = rows[5].c2;

        var dgSty = $('#'+dgStudyFee);
        var data = dgSty.datagrid('getData');
        for(i = 0; i< data.rows.length; i++) {
            if (data.rows[i].term) {
                recpt.class_receipt.push(data.rows[i]);
            }
        }

        var tm = $('#'+dgTm).datagrid('getRows');
        for(i = 0; i < tm.length; i++){
            if (tm[i].tm_name){
                recpt.teach_receipt.push(tm[i]);
            }
        }

        var oth = $('#'+dgOtherFee).datagrid('getRows');
        for(i = 0; i < oth.length; i++){
            if (oth[i].fee_item){
                recpt.other_fee.push(oth[i]);
            }
        }

        return recpt;
    }

    /**
     * 删除表格中的一行数据
     * @param dg
     */
    function danceDelRow(dg) {
        var rows = dg.datagrid('getRows');
        if (rows.length === 0) {
            $.messager.alert('提示','无数据可删！','info');
            return;
        }
        var row = dg.datagrid('getSelected');
        var rowToDel = row ? row : rows[rows.length-1]; // 删除选中行 或 最后一行
        var idx = dg.datagrid('getRowIndex', rowToDel);
        if (rowToDel.term || rowToDel.tm_name || rowToDel.fee_item) { // 本行有数据，询问是否要删除
            $.messager.confirm('确认删除', '确认删除第 '+(idx+1)+' 行数据吗？', function(r){
                if (r){
                    dcCalcFeeAfterDel(dg, rowToDel);
                    dg.datagrid('deleteRow', idx);
                }
            });
        } else {
            dcCalcFeeAfterDel(dg, rowToDel);
            dg.datagrid('deleteRow', idx);
        }
    }

    /**
     * 当删除表格（班级——学费，教材费、其他费）行时，更新收费单（学费）的费用。
     * @param dg
     * @param row
     */
    function dcCalcFeeAfterDel(dg, row) {
        var id = $(dg).attr('id');
        if (id === dgStudyFee) {
            if(row.term){
                var diffWanted = 0 - parseFloat((row.total));
                var diffReal = 0 - parseFloat(row.real_fee);
                var diffArrearage = 0 - parseFloat(row.arrearage);
                dcCalcFeeByStudy(diffWanted, diffReal, diffArrearage);
            }
        } else if (id === dgTm) {
            if(row.fee) {
                var tmFee = 0 - parseFloat(row.fee);
                dcCalcFeeByTm(tmFee);
            }
        } else if (id === dgOtherFee) {
            if (row.real_fee){
                var othDiff = 0 - parseFloat(row.real_fee);
                dcCalcFeeByOth(othDiff);
            }
        }
    }

    function dgEndEditing(which) {
        if (dgParam.hasOwnProperty(which) && dgParam[which].idx !== undefined) {
            $(dgParam[which].dg).datagrid('endEdit', dgParam[which].idx);
            dgParam[which].idx = undefined;
        }
    }

    function dgStudyFeeEndEditing(){
        if (edIndexStudyFee !== undefined){
            $('#'+dgStudyFee).datagrid('endEdit', edIndexStudyFee);
            edIndexStudyFee = undefined;
        }
    }

    function dgTmEndEditing() {
        if (edIndexTm !== undefined) {
            $('#'+dgTm).datagrid('endEdit', edIndexTm);
            edIndexTm = undefined;
        }
    }

    // 收费单（学费）基本信息中的 编辑器
    var editors = [ {'c4': 'combobox', 'c6': 'datebox' },
        {'c4': 'combobox'},
        {},
        {'c6': 'combobox'},
        {'c2': 'combobox', 'c4': 'textbox'},
        {'c2': 'textbox'}
    ];

    /**
     * 向datagrid 添加行 编辑器（多个），符合条件才添加。
     * @param dg
     * @param index
     */
    function dcAddRowEditors(dg, index) {
        if (index >= 0 && index < editors.length) {
            for(var key in editors[index]){
                if (editors[index].hasOwnProperty(key)) {
                    $(dg).datagrid('addEditor', {field:key, editor:editors[index][key]});
                }
            }
        }
    }
}
////////////////  收费单（学费） 详细信息 end //////////////////////////////////////////////////////////////////////////



/**
 * 添加或者打开 收费单（学费） Tab页
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabFeeStudyDatagrid(title, tableId, condition) {
    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
        $('#'+tableId).datagrid('load', condition);
    } else {
        var content = '<div style="min-width:1024px;width:100%;height:100%"><table id=' + tableId + '></table></div>';
        $(parentDiv).tabs('add', {
            title: title,
            content: content,
            closable: true
        });

        var module = 'dance_receipt_study';
        var opts = {
            queryText: '姓名：',
            queryPrompt: '姓名拼音首字母查找',
            who: 'DanceReceipt',
            danceModuleName: 'DanceReceipt',
            danceModuleTitle: title,          // 导入、导出 窗口 title
            addEditFunc: danceAddReceiptStudyDetailInfo,
            page: '/static/html/_receipt_study.html',     // 上述函数的参数
            columns: [[
                {field: 'ck', checkbox:true },
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

        danceCreateCommDatagrid(tableId, '/'+module, condition, opts);
    }
}

function getClassCostMode(val) {
    return  val === 1 ? '按课次' : '按课时';
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function danceAddTabFeeHistory(opts) {
    var title = '学费交费记录';
    var tableId = opts.dgId + '-FeeHistory';
    var condition = {student_id: opts.uuid};

    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
        $('#'+tableId).datagrid('load', condition);
    } else {
        var content = '<div style="min-width:1024px;width:100%;height:100%"><table id=' + tableId + '></table></div>';
        $(parentDiv).tabs('add', {
            title: title,
            content: content,
            closable: true
        });

        var dg = $('#' + tableId);       // datagrid ID
        dg.datagrid({
            fit: true,
            url: '/dance_student_fee_history_get',
            fitColumns: true,
            pagination: true,   // True to show a pagination toolbar on datagrid bottom.
            singleSelect: true, // True to allow selecting only one row.
            loadMsg: '正在加载数据...',
            border: false,
            striped: true,
            pageNumber: 1,
            pageSize: 30,     //每页显示条数
            nowrap: true,   // True to display data in one line. Set to true can improve loading performance.
            pageList: [20, 30, 40, 50, 100],   //每页显示条数供选项
            rownumbers: true,   // True to show a row number column.
            queryParams: condition,
            columns: [[
                //{field: 'ck', checkbox:true },
                {field: 'deal_date', title: '收费日期', width: 90, align: 'center', fixed:true},
                {field: 'student_name', title: '学员姓名', width: 80, align: 'center',fixed:true},
                {field: 'class_name', title: '班级名称', width: 140, align: 'center', fixed:true},
                {field: 'cost_mode', title: '收费模式', width: 70, align: 'center', fixed:true},
                {field: 'term', title: '学期长度', width: 70, align: 'center', fixed:true},
                {field: 'cost', title: '收费标准', width: 70, align: 'center', fixed:true},
                {field: 'real_fee', title: '实收费', width: 70, align: 'center', fixed:true},
                {field: 'arrearage', title: '学费欠费', width: 70, align: 'center', fixed:true},

                {field: 'receipt_no', title: '收费单号', width: 140, align: 'center',fixed:true},
                {field: 'school_name', title: '分校名称', width: 110, align: 'center',fixed:true},
                {field: 'student_no', title: '学号', width: 140, align: 'center',fixed:true},
                {field: 'class_no', title: '班级编号', width: 110, align: 'center', fixed:true},
                {field: 'recorder', title: '录入员', width: 90, align: 'center'}
            ]]
        });

        var pager = dg.datagrid('getPager');
        $(pager).pagination({
            beforePageText: '第',
            afterPageText: '页, 共 {pages} 页',
            displayMsg: '当前记录 {from} - {to} , 共 {total} 条记录'
        });
    }
}
