/**
 * Created by Administrator on 2017/10/9.
 */

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
            'queryText': '姓名：',
            'queryPrompt': '姓名拼音首字母查找',
            'who': module,
            'danceModuleName':module,
            'addEditFunc': danceTeacherDetailInfo,
            'page': '/static/html/_teacher_details.html',     // 上述函数的参数
            'columns': [[
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
 * @param uid           学员id，新增时，可以不传递此参数。
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
    var tch_tel = 'tel';
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
                $('#'+pager).pagination({
                    showRefresh: uid > 0,
                    buttons:[{ text:'保存', iconCls:'icon-save',  handler:onSave}],
                    total: 0, pageSize: 1,
                    beforePageText: '第', afterPageText: '条，总 {pages} 条',
                    showPageList: false, showPageInfo: false,
                    onSelectPage:function(pageNumber, pageSize){
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
                        {iconCls: 'icon-remove', text: '删除行', handler: danceDelRow}
                    ]
                });
                $('#'+dgWork).datagrid({
                    onClickCell: dgWorkClickCell,
                    onEndEdit : function onEndEdit(index, row){
                        var ed = $(this).datagrid('getEditor', {
                            index: index,
                            field: 'class_name'
                        });
                        row.class_name = $(ed.target).combobox('getText');
                    },
                    toolbar: [{iconCls: 'icon-add', text: '增加行', handler: function () {$('#'+dgWork).datagrid('appendRow', {});}},
                        {iconCls: 'icon-remove', text: '删除行', handler: danceDelRow}
                    ]
                });

                $('#'+panel).mousedown(function (event) {      // panel 鼠标按下事件
                    if (event.target.id === panel) {
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
            $.extend(true, oldStu, data);

            $('#'+tch_no).textbox('setText',data.row['teacher_no']);
            $('#'+tch_name).textbox('setText',data.row['name']).textbox('textbox').focus();
            $('#'+tch_joinDay).datebox('setValue',data.row['join_day']);
            $('#'+tch_birthday).datebox('setValue',data.row['birthday']);
            $('#'+tch_schoolName).combobox('loadData', [{school_id: data.row.school_id,
                school_name: data.row.school_name}]).combobox('setValue', data.row.school_id);
            $('#'+tch_idcard).textbox('setText',data.row['idcard']);     // 身份证号
            $('#'+tch_type).combobox('setText',data.row['te_type']);
            $('#'+tch_title).combobox('setText',data.row['te_title']);
            $('#'+tch_degree).combobox('setText',data.row['degree']);

            $('#'+tch_leaveDay).textbox('setText',data.row['leave_day']);
            $('#'+tch_recorder).textbox('setText',data.row['recorder']);
            $('#'+tch_gender).combobox('select',data.row['gender']);
            $('#'+tch_remark).textbox('setText',data.row['remark']);

            $('#'+pager).pagination({total: data.total, pageNumber:no===-2?data.row.no:no });

            dgLoadData(dgEdu, data['edu']);
            dgLoadData(dgWork, data['work']);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
            $.messager.alert('提示', msg, 'info');
        });
    }
    
    function dgLoadData(dgId, data) {
        var len = data.length;
        for(var i = 0; i< 3 - len; i++){ 
            data.push({});
        }
        $('#'+dgId).datagrid('loadData', data);
    }

    function newTeacher() {
        dgLoadData(dgWork, []);
        dgLoadData(dgEdu, []);

        //设置时间
        var curr_time = new Date();
        $("#"+tch_joinDay).datebox("setValue",danceFormatter(curr_time));
    }

    function dgWorkClickCell(index, field) {
        //console.log('dgWorkClickCell');
        if (edIdxWork !== index) {
            var dg = $('#'+dgWork);
            if (edIdxWork !== undefined) {
                $(dg).datagrid('endEdit', edIdxWork);
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
            edIdxWork = index;
        }
    }

    function dgEduClickCell(index, field) {
        if (edIdxEdu !== index) {
            endEditEdu();
            var dg = $('#'+dgEdu);
            $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);
            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            edIdxEdu = index;
        }
    }

    function ajaxTeacherExtras() {
        $.ajax({
            method: 'POST',
            url: '/dance_student_details_extras',
            async: true,
            dataType: 'json',
            data: {'student_id': uid, 'school_id': condition.school_id},
            success: function (data) {
                if(data.errorCode === 0) {
                    classlist = data['classlist'];
                    schoollist = data['schoollist'];
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
            $('#'+tch_schoolName).combobox('loadData', schoollist)
                .combobox('setValue', schoollist[0].school_id);
        }
    }

    function endEditWork(){
        if (edIdxWork !== undefined){
            $('#'+dgWork).datagrid('endEdit', edIdxWork);
            edIdxWork = undefined;
        }
    }

    function endEditEdu(){
        if (edIdxEdu !== undefined){
            $('#'+dgEdu).datagrid('endEdit', edIdxEdu)
                .datagrid('mergeCells', { index: 1, field: 'c2', colspan: 3});
            edIdxEdu = undefined;
        }
    }

    function onClickClass(record) {
        var dg = $('#'+dgWork);
        var row = $(dg).datagrid("getSelected");
        if (row) {
            row['class_id'] =  record['class_id'];
            row['class_name'] = record['class_name'];
            //row['status'] = '正常';
            //row['join_date'] = new Date();
            //console.info(row);
            var edStatus =  $(dg).datagrid('getEditor', {index:edIdxWork,field:'status'});
            if (edStatus && !$(edStatus.target).combobox('getValue')){
                $(edStatus.target).combobox('setValue', '正常');
            }
            var edJoin =  $(dg).datagrid('getEditor', {index:edIdxWork,field:'join_date'});
            if (edJoin && !$(edJoin.target).combobox('getValue')){
                $(edJoin.target).datebox('setValue', danceFormatter(new Date()));
            }

            $(dg).datagrid('updateRow', {index: edIdxWork, row: row});
            setTimeout(function(){
                endEditWork();
            },0);
        }
    }
    ////////////////////
    function onSave() {
        endEditEdu();
        endEditWork();
        if (!validateTeacherInfo()) {
            return false;
        }

        stuInfo = {'student': {}, 'class': []};
        packageTeacherInfo();
        //console.log(stuInfo);

        var url =  uid > 0 ? '/dance_student_modify' : '/dance_student_add';
        if (uid > 0) {
            stuInfo.student.id = oldStu.rows.id;
            // find student's class for delete
            var delClass = [];
            var m,n;
            for (m=0; m<oldStu.class_info.length; m++) {
                for (n=0; n<stuInfo.class.length; n++) {
                    if ('id' in stuInfo.class[n] && stuInfo.class[n].id === oldStu.class_info[m].id){
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
        if (!$('#'+tch_name).textbox('getText')) {
            $.messager.alert({ title: '提示',icon:'info', msg: '学员姓名不能为空！',
                fn: function(){
                    $('#'+tch_name).textbox('textbox').focus();
                }
            });
            return false;
        }

        return true;
    }

    function packageTeacherInfo() {
        stuInfo.student.name = $('#'+tch_name).textbox('getText');     // 姓名
        stuInfo.student.register_day = $('#'+tch_joinDay).datebox('getValue');   // 注册日期
        stuInfo.student.gender = $('#'+tch_gender).combobox('getValue');      // 性别
        stuInfo.student.school_id = $('#'+tch_schoolName).combobox('getValue');      // 所属分校 名称/id
        stuInfo.student.information_source = $('#'+tch_type).combobox('getText');   // 信息来源
        stuInfo.student.idcard = $('#'+tch_idcard).textbox('getText');   // 身份证
        stuInfo.student.counselor = $('#'+tch_title).combobox('getText');   // 咨询师
        stuInfo.student.degree = $('#'+tch_degree).combobox('getText');   // 文化程度
        stuInfo.student.birthday = $('#'+tch_birthday).datebox('getValue');   // 出生日期
        stuInfo.student.remark = $('#'+tch_remark).textbox('getText');   // 备注

        stuInfo.student.information_source = stuInfo.student.information_source.replace('　', '');    // 删除全角空格
        stuInfo.student.counselor = stuInfo.student.counselor.replace('　', '');
        stuInfo.student.degree = stuInfo.student.degree.replace('　', '');

        var dg = $('#'+dgWork);
        var data = dg.datagrid('getData');
        //console.log(data);
        for(var i = 0; i< data.rows.length; i++) {
            //console.log(data);
            if (data.rows[i].class_id) {
                stuInfo.class.push(data.rows[i]);
            }
        }

        var dgCnt = $('#'+dgEdu);
        var rows = dgCnt.datagrid('getRows');
        stuInfo.student.reading_school = rows[0].c2;
        stuInfo.student.grade = rows[0].c4;
        stuInfo.student.phone = rows[0].c6;
        stuInfo.student.tel = rows[0].c8;
    }

    function danceDelRow() {
        //console.log('del row');
        var dg = $('#'+dgWork);
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
        $('#'+tch_phone).attr('id', tch_phone+=uid);
        $('#'+tch_qq).attr('id', tch_qq+=uid);
        $('#'+tch_tel).attr('id', tch_tel+=uid);
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

    function resizeTextbox(width, height) {
        var tb = $('#'+tbLayout);
        var parent = $(tb).parent();
        tb.find('td.dcTdFixed').css('width', 202);
        var w = parseInt((parent.width() - 202) / 3);
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
        $('#'+tch_tel).textbox('resize', wd);
        $('#'+tch_zipcode).textbox('resize', wd);
        $('#'+tch_createAt).textbox('resize', wd);
        $('#'+tch_lastUpd).textbox('resize', wd);

        $('#'+tch_recorder).textbox('resize', 198);
        $('#'+tch_lastUser).textbox('resize', 198);

        $('#'+tch_remark).textbox('resize', parent.width() - 26);   // 硬编码 需要改进
    }
}

