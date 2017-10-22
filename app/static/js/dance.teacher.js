/**
 * Created by Administrator on 2017/10/9.
 */

'use strict';

/**
 * 添加或者打开  员工与老师 Tab页
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabTeacher(title, tableId, condition) {
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

        var module = 'dance_teacher';
        var opts = {
            queryText: '姓名：',
            queryPrompt: '姓名拼音首字母查找',
            who: module,
            danceModuleName:module,
            danceModuleTitle: title,          // 导入、导出 窗口 title
            addEditFunc: danceTeacherDetailInfo,
            page: '/static/html/_teacher_details.html',     // 上述函数的参数
            columns: [[
                {field: 'ck', checkbox:true },
                {field: 'school_name', title: '分校名称', width: 110, align: 'center'},
                {field: 'teacher_no', title: '员工与老师编号', width: 140, align: 'center'},
                {field: 'name', title: '姓名', width: 110, align: 'center'},
                {field: 'gender', title: '性别', width: 60, align: 'center'},
                {field: 'phone', title: '手机', width: 90, align: 'center'},
                {field: 'join_day', title: '入职日期', width: 80, align: 'center'},
                {field: 'te_type', title: '类别', width: 80, align: 'center'},
                {field: 'te_title', title: '职位', width: 80, align: 'center'},
                {field: 'in_job', title: '是否在职', width: 80, align: 'center'},
                {field: 'has_class', title: '是否授课', width: 80, align: 'center'},
                {field: 'is_assist', title: '是否咨询师', width: 80, align: 'center'},
                {field: 'nation', title: '民族', width: 80, align: 'center'},
                {field: 'birthday', title: '出生日期', width: 70, align: 'center'},
                {field: 'idcard', title: '身份证号', width: 90, align: 'center'},
                {field: 'recorder', title: '录入员', width: 90, align: 'center'}
            ]]
        };

        danceCreateCommDatagrid(tableId, '/'+module, condition, opts)
    }
}

/**
 * 查看/新增  员工与老师 详细信息
 * @param page          员工与老师详细信息页面
 * @param url           查询信息所用url
 * @param condition     查询条件：
 *      school_id     分校id，取值范围： all  or 具体分校id
 * @param uid           记录id，新增时，可以不传递此参数。
 */
function danceTeacherDetailInfo( page, url, condition, uid) {
    var title = '员工与老师详细信息';
    uid = uid || 0;     // 第一次进入 详细信息页面 uid 有效，上下翻页时，无法提前获取上下记录的 id(uid)
    if (uid <= 0) {
        title +='[新增]'
    }

    var no = -2;    // 记录所在数据库中的序号，方便翻页。传递 -2 则根据 uid 查询该记录的序号

    var pager = 'pagerTeacher';
    var panel = 'panelTeacher';
    
    var tch_no = 'teacherNo';
    var tch_name = 'name';
    var tch_gender = 'gender';
    var tch_joinDay = 'joinDay';
    var tch_schoolName = 'school_name';
    var tch_type = 'teacherType';
    var tch_idcard = 'idcard'; 
    var tch_title = 'teacherTitle';
    var tch_degree = 'degree';
    var tch_leaveDay = 'leaveDay';
    var tch_birthday = 'birthday';
    var tch_recorder = 'recorder';
    var tch_remark = 'remark';
    
    var tch_inJob = 'inJob';
    var tch_isAssist = 'isAssist';
    var tch_hasClass = 'hasClass';
    var tch_nation = 'nation';
    var tch_birthPlace = 'birthPlace';
    var tch_classType = 'classType';
    var tch_phone = 'phone';
    var tch_qq = 'qq';
    var tch_email = 'email';
    var tch_address = 'address';
    var tch_zipcode = 'zipcode';
    var tch_wechat = 'wechat';
    var tch_createAt = 'createAt';
    var tch_lastUpd = 'lastUpd';
    var tch_lastUser = 'lastUser';
    
    var dgEdu = 'dgTeacherEdu';
    var dgWork = 'dgTeacherWork';
    var footerStu = 'footerTeacher';
    var tbLayout = 'tableLayout';
    var edIdxWork = undefined;
    var edIdxEdu = undefined;
    var classlist = [];
    var schoollist = [];
    var teacher = {'student': {}, 'class': []};
    var oldTch = {};        // 修改学员记录时，保存原始信息

    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
    } else {
        $(parentDiv).tabs('add', {
            title: title, closable: true, loadingMessage: '加载中...', href: page,
            onLoad : function () {
                $('#'+pager).pagination({
                    showRefresh: uid > 0,  total: 0, pageSize: 1, showPageList: false, showPageInfo: false,
                    buttons:[{ text:'保存', iconCls:'icon-save',  handler:onSave}],
                    beforePageText: '第', afterPageText: '条，总 {pages} 条',
                    onSelectPage:function(pageNumber){  // , pageSize 参数固定为 1
                        if (uid> 0) {
                            no = pageNumber;
                            ajaxTeacherDetail();
                        }
                    }
                });
                changeId(uid);
                $('#'+dgEdu).datagrid({
                    onClickCell: dgEduClickCell,
                    onResize: resizeTextbox,
                    toolbar: [{iconCls: 'icon-add', text: '增加行', handler:function () {$('#'+dgEdu).datagrid('appendRow', {});}},
                        {iconCls: 'icon-remove', text: '删除行', handler: function () {danceDelRow(dgEdu);}}
                    ]
                });
                $('#'+dgWork).datagrid({
                    onClickCell: dgWorkClickCell,
                    toolbar: [{iconCls: 'icon-add', text: '增加行', handler: function () {$('#'+dgWork).datagrid('appendRow', {});}},
                        {iconCls: 'icon-remove', text: '删除行', handler: function () {danceDelRow(dgWork);}}
                    ]
                });

                $('#'+panel).mousedown(function (event) {      // panel 鼠标按下事件
                    if (event.target.id === panel) {
                        event.stopPropagation(); // 禁止冒泡执行事件
                        endEditWork();
                        endEditEdu();
                    }
                });
                
                if (uid > 0) {  // 修改，查看
                    ajaxTeacherDetail();
                } else {    // 新增
                    newTeacher()
                }
                ajaxTeacherExtras();
            }
        });
    }

    function ajaxTeacherDetail() {
        var cond = {'teacher_id': uid, 'page': no, 'rows': 1};
        $.extend(cond, condition);

        $.ajax({
            method: 'POST',
            url: url + '_details_get',
            async: true,
            dataType: 'json',
            data: cond
        }).done(function(data) {
            console.log(data);
            $.extend(true, oldTch, data);

            $('#'+tch_no).textbox('setValue',data.row['teacher_no']);
            $('#'+tch_name).textbox('setValue',data.row.name).textbox('textbox').focus();
            $('#'+tch_joinDay).datebox('setValue',data.row.join_day);
            $('#'+tch_birthday).datebox('setValue',data.row.birthday);
            $('#'+tch_schoolName).combobox('loadData', [{school_id: data.row.school_id,
                school_name: data.row.school_name}]).combobox('setValue', data.row.school_id);
            $('#'+tch_idcard).textbox('setValue',data.row.idcard);     // 身份证号
            $('#'+tch_type).combobox('setValue',data.row.te_type);
            $('#'+tch_title).combobox('setValue',data.row.te_title);
            $('#'+tch_degree).combobox('setValue',data.row.degree);
            $('#'+tch_classType).combobox('setValue',data.row.class_type);
            $('#'+tch_leaveDay).textbox('setValue',data.row.leave_day);
            $('#'+tch_recorder).textbox('setText',data.row['recorder']);
            $('#'+tch_gender).combobox('setValue',data.row.gender);
            $('#'+tch_inJob).combobox('setValue',data.row.in_job);
            $('#'+tch_isAssist).combobox('setValue',data.row.is_assist);
            $('#'+tch_hasClass).combobox('setValue',data.row.has_class);
            $('#'+tch_address).textbox('setValue',data.row.address);
            $('#'+tch_zipcode).textbox('setValue',data.row.zipcode);
            $('#'+tch_email).textbox('setValue',data.row.email);
            $('#'+tch_phone).textbox('setValue',data.row.phone);
            $('#'+tch_qq).textbox('setValue',data.row.qq);
            $('#'+tch_wechat).textbox('setValue',data.row.wechat);
            $('#'+tch_nation).textbox('setValue',data.row.nation);
            $('#'+tch_birthPlace).textbox('setValue',data.row.birth_place);
            $('#'+tch_remark).textbox('setValue',data.row.remark);
            $('#'+tch_createAt).textbox('setText',data.row['create_at']);
            $('#'+tch_lastUpd).textbox('setText',data.row['last_upd_at']);
            $('#'+tch_lastUser).textbox('setText',data.row['last_user']);

            $('#'+pager).pagination({total: data.total, pageNumber:no===-2?data.row.no:no });

            danceDgLoadData(dgEdu, data['edu']);
            danceDgLoadData(dgWork, data['work']);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
            $.messager.alert('提示', msg, 'info');
        });
    }

    function newTeacher() {
        danceDgLoadData(dgWork, []);
        danceDgLoadData(dgEdu, []);

        // 设置时间
        var curr_time = new Date();
        $("#"+tch_joinDay).datebox("setValue",danceFormatter(curr_time));
        $('#'+tch_isAssist).combobox('setValue', 0);    // 默认 不是咨询师
    }

    function dgWorkClickCell(index, field) {
        endEditEdu();
        if (edIdxWork !== index) {
            endEditWork();
            var dg = $('#'+dgWork);
            $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);
            dcFormatYM(dgWork, index);
            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            edIdxWork = index;
        }
    }


    function dgEduClickCell(index, field) {
        endEditWork();
        if (edIdxEdu !== index) {
            endEditEdu();
            var dg = $('#'+dgEdu);
            $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);
            dcFormatYM(dgEdu, index);
            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            edIdxEdu = index;
        }
    }

    // dg 必须处于编辑状态
    function dcFormatYM(dgId, index) {
        var dg = $('#'+dgId);
        var rows = $(dg).datagrid('getRows');
        var row = $(dg).datagrid('getSelected');
        var db = $(dg).datagrid('getEditor', {index:index,field:'begin_day'});
        var dbEnd = $(dg).datagrid('getEditor', {index:index,field:'end_day'});
        var arr = null;
        if(db) {
            dcDatebox(db.target, selectDate);
            if(!row['begin_day'] && index > 0) {    // 不是第一行，且 开始年月无值，则设置上一行结束年月的 下一月
                var endDay = rows[index-1]['end_day'];
                if(endDay){
                    arr = endDay.split('-');
                    var y = parseInt(arr[0]);
                    var m = parseInt(arr[1]);
                    if(m === 12) {
                        m = 1;
                        y++;
                    } else m++;
                    row.begin_day = y + '-' + (m<10?('0'+m):m);   // 下一月
                }
            }
            $(db.target).datebox('setValue', row['begin_day']);
        }
        if(dbEnd) {
            dcDatebox(dbEnd.target);
            if(row.begin_day && !row.end_day){  // 开始年月有值 且 结束年月无值，则设置为开始年月的 下一年
                arr = row.begin_day.split('-');
                row.end_day = (parseInt(arr[0]) +1) + '-' + arr[1];   // 下一年
            }
            $(dbEnd.target).datebox('setValue', row['end_day']);
        }

        function selectDate(ym){    // 开始年月选择日期后，设置 结束年月的 日期 为 下一年
            if(!row['end_day']) {
                arr = ym.split('-');
                var netYear = (parseInt(arr[0]) +1) + '-' + arr[1];   // 下一年
                if(dbEnd) {
                    row.end_day = netYear;
                    $(dbEnd.target).datebox('setValue', netYear);
                }
            }
        }

    }

    function ajaxTeacherExtras() {
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
                danceSetSchoolName(schoollist, tch_schoolName);
            } else {
                $.messager.alert('错误',data.msg,'error');
            }
        });

    }
    
    function endEditWork(){
        if (edIdxWork !== undefined){
            $('#'+dgWork).datagrid('endEdit', edIdxWork);
            edIdxWork = undefined;
        }
    }

    function endEditEdu(){
        if (edIdxEdu !== undefined){
            $('#'+dgEdu).datagrid('endEdit', edIdxEdu);
            edIdxEdu = undefined;
        }
    }
    
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    function onSave() {
        endEditEdu();
        endEditWork();
        if (!validateTeacherInfo()) {
            return false;
        }

        teacher = {row: {}, edu: [], work: []};
        packageTeacherInfo();
        console.log('send:', teacher);

        $.ajax({
            method: "POST",
            url: '/dance_teacher_modify',
            contentType: "application/json;charset=utf-8",
            data: JSON.stringify(teacher)
        }).done(function(data) {
            if (data.errorCode === 0) {
                if (uid > 0) {
                    ajaxTeacherDetail();  // 更新 教职工 信息
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

    function validateTeacherInfo() {
        if (!$('#'+tch_name).textbox('getValue')) {
            $.messager.alert({ title: '提示',icon:'info', msg: '姓名不能为空！',
                fn: function(){
                    $('#'+tch_name).textbox('textbox').focus();
                }
            });
            return false;
        }

        if (!$('#'+tch_schoolName).textbox('getValue')) {
            $.messager.alert({ title: '提示',icon:'info', msg: '请选择分校！',
                fn: function(){
                    $('#'+tch_schoolName).textbox('textbox').focus();
                }
            });
            return false;
        }

        if (!$('#'+tch_title).textbox('getValue')) {
            $.messager.alert({ title: '提示',icon:'info', msg: '请选择职位！',
                fn: function(){
                    $('#'+tch_title).textbox('textbox').focus();
                }
            });
            return false;
        }

        var rows = $('#'+dgEdu).datagrid('getRows');
        for(var i=0; i< rows.length; i++){
            if(!$.isEmptyObject(rows[i])){  // 非空对象
                if(!rows[i].begin_day || !rows[i].end_day || !rows[i]['school']) { // 三个字段 任何一个为空
                    $.messager.alert('提示', '请填写教育经历第 ' + (i + 1) + ' 行的必填字段', 'info');
                    return false;
                }

                if(rows[i].begin_day && rows[i].end_day && dcCompareYM(rows[i].begin_day, rows[i].end_day) >= 0){
                    $.messager.alert('提示', '教育经历第 ' + (i + 1) + ' 行结束年月须大于开始年月', 'info');
                    return false;
                }
            }
        }

        rows = $('#'+dgWork).datagrid('getRows');
        for(i=0; i< rows.length; i++){
            if(!$.isEmptyObject(rows[i])){  // 非空对象
                if(!rows[i].begin_day || !rows[i].end_day || !rows[i]['firm']) {
                    $.messager.alert('提示', '请填写工作经历第 ' + (i + 1) + ' 行的必填字段', 'info');
                    return false;
                }

                if(rows[i].begin_day && rows[i].end_day && dcCompareYM(rows[i].begin_day, rows[i].end_day) >= 0){
                    $.messager.alert('提示', '工作经历第 ' + (i + 1) + ' 行结束年月须大于开始年月', 'info');
                    return false;
                }
            }
        }

        return true;
    }

    function dcCompareYM(ym1, ym2) {    // ym1 为 yyyy-mm 格式的字符串
        var arr = ym1.split('-');
        var y1 = parseInt(arr[0]);
        var m1 = parseInt(arr[1]);

        arr = ym2.split('-');
        var y2 = parseInt(arr[0]);
        var m2 = parseInt(arr[1]);
        if(y1 !== y2) return y1-y2;
        return m1-m2;
    }

    function packageTeacherInfo() {
        if (uid > 0) {
            teacher.row.id = oldTch.row.id;
        }
        teacher.row.name = $('#'+tch_name).textbox('getText');     // 姓名
        teacher.row.gender = $('#'+tch_gender).combobox('getValue');      // 性别
        teacher.row.join_day = $('#'+tch_joinDay).datebox('getValue');
        teacher.row.school_id = $('#'+tch_schoolName).combobox('getValue');      // 所属分校 名称/id
        teacher.row.te_type = $('#'+tch_type).combobox('getValue');
        teacher.row.in_job = $('#'+tch_inJob).combobox('getValue');
        teacher.row.is_assist = $('#'+tch_isAssist).combobox('getValue');
        teacher.row.has_class = $('#'+tch_hasClass).combobox('getValue');
        teacher.row.idcard = $('#'+tch_idcard).textbox('getText');   // 身份证
        teacher.row.te_title = $('#'+tch_title).combobox('getValue');   // 咨询师
        teacher.row.degree = $('#'+tch_degree).combobox('getValue');// 文化程度
        teacher.row.nation = $('#'+tch_nation).textbox('getValue');
        teacher.row.birth_place = $('#'+tch_birthPlace).textbox('getValue');
        teacher.row.class_type = $('#'+tch_classType).combobox('getValue');
        teacher.row.phone = $('#'+tch_phone).textbox('getValue');
        teacher.row.qq = $('#'+tch_qq).textbox('getValue');
        teacher.row.email = $('#'+tch_email).textbox('getValue');
        teacher.row.birthday = $('#'+tch_birthday).datebox('getValue');   // 出生日期
        teacher.row.leave_day = $('#'+tch_leaveDay).datebox('getValue');
        teacher.row.zipcode = $('#'+tch_zipcode).textbox('getValue');
        teacher.row.address = $('#'+tch_address).textbox('getValue');
        teacher.row.wechat = $('#'+tch_wechat).textbox('getValue');
        teacher.row.remark = $('#'+tch_remark).textbox('getText');   // 备注

        var dg = $('#'+dgWork);
        var rows = dg.datagrid('getRows');
        //console.log(data);
        var i;
        for(i = 0; i< rows.length; i++) {
            //console.log(data);
            if (rows[i]['begin_day']) {
                teacher.work.push(rows[i]);
            }
        }

        var dgCnt = $('#'+dgEdu);
        rows = dgCnt.datagrid('getRows');
        for(i = 0; i< rows.length; i++) {
            if (rows[i]['begin_day']) {
                teacher.edu.push(rows[i]);
            }
        }
    }

    function danceDelRow(dgId) {
        //console.log('del row');
        endEditWork();
        endEditEdu();
        var dg = $('#'+dgId);
        var rows = dg.datagrid('getRows');
        if (rows.length === 0) {
            $.messager.alert('提示','无数据可删！','info');
            return;
        }
        var row = dg.datagrid('getSelected');
        var rowToDel = row ? row : rows[rows.length-1]; // 删除选中行 或 最后一行
        var idx = dg.datagrid('getRowIndex', rowToDel);
        if (rowToDel['begin_day']) { // 本行有数据，询问是否要删除
            $.messager.confirm('确认删除', '确认删除第 '+(idx+1)+' 行数据吗？', function(r){
                if (r){
                    dg.datagrid('deleteRow', idx);
                }
            });
        } else {
            dg.datagrid('deleteRow', idx);
        }
    }

    function changeId(uid) {
        $('#'+tch_recorder).attr('id', tch_recorder+=uid).textbox('textbox').css('background','#e4e4e4');
        $('#'+tch_no).attr('id', tch_no+=uid).textbox('textbox').css('background','#e4e4e4');
        $('#'+tch_name).attr('id', tch_name+=uid).textbox('textbox').focus();
        $('#'+tch_gender).attr('id', tch_gender+=uid);
        $('#'+tch_joinDay).attr('id', tch_joinDay+=uid);
        $('#'+tch_schoolName).attr('id', tch_schoolName+=uid);
        $('#'+tch_type).attr('id', tch_type+=uid);
        $('#'+tch_idcard).attr('id', tch_idcard+=uid);
        $('#'+tch_title).attr('id', tch_title+=uid);
        $('#'+tch_degree).attr('id', tch_degree+=uid);
        $('#'+tch_leaveDay).attr('id', tch_leaveDay+=uid);
        $('#'+tch_birthday).attr('id', tch_birthday+=uid);
        $('#'+tch_remark).attr('id', tch_remark+=uid);
        $('#'+tch_inJob).attr('id', tch_inJob+=uid);
        $('#'+tch_isAssist).attr('id', tch_isAssist+=uid);
        $('#'+tch_hasClass).attr('id', tch_hasClass+=uid);
        $('#'+tch_nation).attr('id', tch_nation+=uid);
        $('#'+tch_birthPlace).attr('id', tch_birthPlace+=uid);
        $('#'+tch_classType).attr('id', tch_classType+=uid);
        $('#'+tch_email).attr('id', tch_email+=uid);
        $('#'+tch_qq).attr('id', tch_qq+=uid);
        $('#'+tch_phone).attr('id', tch_phone+=uid);
        $('#'+tch_address).attr('id', tch_address+=uid);
        $('#'+tch_zipcode).attr('id', tch_zipcode+=uid);
        $('#'+tch_wechat).attr('id', tch_wechat+=uid);
        $('#'+tch_createAt).attr('id', tch_createAt+=uid).textbox('textbox').css('background','#e4e4e4');
        $('#'+tch_lastUpd).attr('id', tch_lastUpd+=uid).textbox('textbox').css('background','#e4e4e4');
        $('#'+tch_lastUser).attr('id', tch_lastUser+=uid).textbox('textbox').css('background','#e4e4e4');
        $('#'+footerStu).attr('id', footerStu+=uid);
        $('#'+tbLayout).attr('id', tbLayout+=uid);

        $('#'+pager).attr('id', pager+=uid);        // 更新ID
        $('#'+dgEdu).attr('id', dgEdu+=uid);
        $('#'+dgWork).attr('id', dgWork+=uid);
        $('#'+panel).attr('id', panel+=uid);
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

        var wd = w - 14;
        $('#'+tch_no).textbox('resize', wd);
        $('#'+tch_joinDay).textbox('resize', wd);
        $('#'+tch_inJob).textbox('resize', wd);
        $('#'+tch_idcard).textbox('resize', wd);
        $('#'+tch_nation).textbox('resize', wd);
        $('#'+tch_phone).textbox('resize', wd);
        $('#'+tch_address).textbox('resize', wd*2 + 6);
        $('#'+tch_wechat).textbox('resize', wd*2 + 6);
        $('#'+tch_leaveDay).textbox('resize', wd);

        $('#'+tch_name).textbox('resize', wd);
        $('#'+tch_schoolName).textbox('resize', wd);
        $('#'+tch_isAssist).textbox('resize', wd);
        $('#'+tch_title).textbox('resize', wd);
        $('#'+tch_birthPlace).textbox('resize', wd);
        $('#'+tch_qq).textbox('resize', wd);
        $('#'+tch_birthday).textbox('resize', wd);

        $('#'+tch_gender).textbox('resize', wd);
        $('#'+tch_type).textbox('resize', wd);
        $('#'+tch_hasClass).textbox('resize', wd);
        $('#'+tch_degree).textbox('resize', wd);
        $('#'+tch_classType).textbox('resize', wd);
        $('#'+tch_email).textbox('resize', wd);
        $('#'+tch_zipcode).textbox('resize', wd);
        $('#'+tch_createAt).textbox('resize', wd);
        $('#'+tch_lastUpd).textbox('resize', wd);

        $('#'+tch_recorder).textbox('resize', 198);
        $('#'+tch_lastUser).textbox('resize', 198);

        $('#'+tch_remark).textbox('resize', parent.width() - 26);   // 硬编码 需要改进
    }
}
