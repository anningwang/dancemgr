/**
 * Created by Administrator on 2017/10/17.
 */

'use strict';

/**
 * 添加或者打开  集体续班 Tab页
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabUpgClass(title, tableId, condition) {
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

        var module = 'dance_upgrade_class';
        var opts = {
            queryText: '姓名：',
            queryPrompt: '姓名拼音首字母查找',
            who: module,
            danceModuleName:module,
            danceModuleTitle: title,          // 导入、导出 窗口 title
            addEditFunc: danceUpgClassDetailInfo,
            page: '/static/html/_upgradeclass.html',
            columns: [[
                {field: 'ck', checkbox:true },
                {field: 'school_name', title: '分校名称', width: 110, align: 'center', fixed:true},
                {field: 'code', title: '续班编号', width: 125, align: 'center', fixed:true},
                {field: 'upg_date', title: '续班日期', width: 80, align: 'center', fixed:true},
                {field: 'oldClassName', title: '原班级名称', width: 120, align: 'center'},
                {field: 'newClassName', title: '新班级名称', width: 120, align: 'center'},
                {field: 'student_no', title: '学号', width: 125, align: 'center', fixed:true},
                {field: 'student_name', title: '姓名', width: 80, align: 'center', fixed:true},
                {field: 'is_up', title: '是否续班', width: 60, align: 'center', fixed:true},
                {field: 'remark', title: '备注', width: 80, align: 'center'},
                {field: 'recorder', title: '录入员', width: 80, align: 'center',fixed:true}
            ]]
        };

        danceCreateCommDatagrid(tableId, '/'+module, condition, opts);
    }
}


/**
 * 查看/新增  集体续班 详细信息
 * @param page          详细信息页面
 * @param url           查询信息所用url
 * @param condition     查询条件：
 *      school_id     分校id，取值范围： all  or 具体分校id
 * @param uid           记录id，新增时，可以不传递此参数。
 */
function danceUpgClassDetailInfo( page, url, condition, uid) {
    var title = '集体续班信息';
    uid = uid || 0;     // 第一次进入 详细信息页面 uid 有效，上下翻页时，无法提前获取上下记录的 id(uid)
    if (uid <= 0) {
        title += '[新增]'
    }
    var no = -2;    // 记录所在数据库中的序号，方便翻页。传递 -2 则根据 uid 查询该记录的序号
    var darkColor = '#e4e4e4';      // disabled controls's color

    var pager = 'upgPager';     // 以下id从 html文件获取，故需要使用js修改id
    var panel = 'upgPanel';
    var footer = 'upgFooter';
    var dgStu = 'upgDgStu';
    
    var upgNo = 'upgNo';
    var upgDate = 'upgDate';
    var upgSchoolNo = 'upgSchoolNo';
    var upgOldClassNo = 'upgOldClassNo';
    var upgOldClassName = 'upgOldClassName';
    var upgSchoolName = 'upgSchoolName';
    var upgNewClassNo = 'upgNewClassNo';
    var upgNewClassName = 'upgNewClassName';
    var upgRecorder = 'upgRecorder';
    var edIdxStu = undefined;
    var classList = [];
    var schoolList = [];
    var btnAdd = 'addUpgClass'+uid;
    
    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
    } else {
        $(parentDiv).tabs('add', {
            title: title, closable: true, loadingMessage: '加载中...', href: page,
            onLoad: function () {
                changeId(uid);
                setCtrlEvent();

                if (uid > 0) { getDetail();}
                else { doNew();}
            }
        });
    }

    function getDetail() {      // 获取 集体续班 详细信息
        var cond = {id: uid, page: no, rows: 1};
        $.extend(cond, condition);

        $.ajax({
            method: 'POST',
            url: url + '_details_get',
            dataType: 'json',
            contentType: "application/json;charset=utf-8",
            data: JSON.stringify(cond)
        }).done(function (data) {
            if (data.errorCode == 0) {
                console.log('receive:', data);
                classList = data['class'];
                schoolList = data['school'];
                $('#'+upgNo).textbox('setValue', data.row.code);
                $('#'+upgDate).datebox('setValue', data.row.upg_date);
                $('#'+upgSchoolName).combobox('loadData', schoolList).combobox('setValue', data.row.school_id)
                    .textbox('disable');
                $('#'+upgSchoolNo).textbox('setValue', data.row.school_no);
                $('#'+upgOldClassNo).textbox('setValue', data.row.oldClassNo);
                $('#'+upgNewClassNo).textbox('setValue', data.row.newClassNo);
                $('#'+upgOldClassName).combobox('loadData', danceFilterClassByNo(classList, data.row.school_no))
                    .combobox('setValue', data.row.old_clsid).textbox('disable');
                $('#'+upgNewClassName).combobox('loadData', danceFilterClassByNo(classList, data.row.school_no))
                    .combobox('setValue', data.row.new_clsid);
                $('#'+upgRecorder).textbox('setValue', data.row['recorder']);
                danceDgLoadData(dgStu, data.upgItem);
                $('#'+pager).pagination({total: data.total, pageNumber:no===-2?data.row.no:no });
            } else {
                $.messager.alert('提示', data.msg, 'info');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
            $.messager.alert('提示', msg, 'info');
        });
    }

    function doNew() {
        danceDgLoadData(dgStu, []);
        $('#' + upgDate).datebox('setValue', danceGetDate());
        getExtras();
        $('#'+btnAdd).linkbutton('disable');
        uid = 0;
    }

    function getExtras() {
        $.ajax({
            method: 'POST',
            url: url+ '_details_extras',
            async: true,
            dataType: 'json',
            data: {'school_id': condition.school_id}
        }).done(function (data) {
            if(data.errorCode === 0) {
                classList = data['classlist'];
                schoolList = data['schoollist'];
                danceSetSchoolName(schoolList, upgSchoolName, upgSchoolNo);
                var school_no = $('#'+upgSchoolNo).textbox('getValue');
                $('#'+upgOldClassName).combobox('loadData', danceFilterClassByNo(classList, school_no));
                $('#'+upgNewClassName).combobox('loadData', danceFilterClassByNo(classList, school_no));
            } else {
                $.messager.alert('错误',data.msg,'error');
            }
        });
    }

    function doSave() {
        endEditingStu();
        if(!validate()) return false;

        var msgSend = packageMsg();
        console.log(msgSend);

        $.ajax({
            method: "POST",
            url: url + '_modify',
            contentType: "application/json;charset=utf-8",
            data: JSON.stringify(msgSend)
        }).done(function(data) {
            if (data.errorCode == 0) {
                if(uid <=0) {
                    $('#'+btnAdd).linkbutton('enable');
                    uid = data.id;
                }
                getDetail();
                $.messager.alert('提示', data.msg, 'info');
            } else {
                $.messager.alert('提示', data.msg, 'info');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
            $.messager.alert('提示', msg, 'info');
        });
    }


    function danceDelRow(dgId) {

    }
    
    
    function endEditingStu(){
        if (edIdxStu !== undefined){
            $('#'+dgStu).datagrid('endEdit', edIdxStu);
            edIdxStu = undefined;
        }
    }

    function setCtrlEvent() {
        $('#'+pager).pagination({
            showRefresh: uid > 0, total: 0, pageSize: 1, showPageList: false, showPageInfo: false,
            buttons: [{text: '保存', iconCls: 'icon-save', handler: doSave},
                { text:'新增', iconCls:'icon-add', id:btnAdd,  handler:doAdd}],
            beforePageText: '第', afterPageText: '条，总 {pages} 条',
            onSelectPage: function (pageNumber) {  // , pageSize 参数固定为 1
                if (uid > 0) {
                    no = pageNumber;
                    getDetail();
                }
            }
        });
        $('#'+dgStu).datagrid({
            onClickCell: dgStuClickCell,
            onBeginEdit: dgStuBeginEdit,
            onEndEdit: function (index, row){
                var dg = $('#'+dgStu);
                var eds = $(dg).datagrid('getEditors', index);
                for(var i=0; i< eds.length; i++){
                    if (eds[i].type === 'combobox'){
                        //console.log('eds[i].field', eds[i].field);
                        var textField = getTextField(eds[i].field);
                        row[textField] = $(eds[i].target).combobox('getText');
                    }
                }
            },
            //onResize: resizeTextbox,
            toolbar: [
                {iconCls: 'icon-add', text: '增加行', disabled:true, handler: function () {
                    $('#'+dgStu).datagrid('appendRow', {});}},
                {iconCls: 'icon-remove', text: '删除行',disabled:true, handler: function () { danceDelRow(dgStu);}}
            ]
        });
        $('#'+panel).mousedown(function (event) {      // panel 鼠标按下事件
            if (event.target.id === panel) {
                event.stopPropagation(); // 禁止冒泡执行事件
                endEditingStu();
            }
        });
        $('#'+upgSchoolName).combobox({
            onClick:function (record) {
                $('#'+upgSchoolNo).textbox('setValue', record['school_no']);
                $('#'+upgOldClassName).combobox('loadData', danceFilterClassByNo(classList, record['school_no']));
                $('#'+upgNewClassName).combobox('loadData', danceFilterClassByNo(classList, record['school_no']));
            }
        });
        $('#'+upgOldClassName).combobox({   // 原班级名称
            formatter: danceFormatterClass,
            onClick:function (record) {
                getStudent(record.class_id);
                $('#'+upgOldClassNo).textbox('setValue', record.class_no);
            }
        });
        $('#'+upgNewClassName).combobox({   // 新班级名称
            formatter: danceFormatterClass,
            onClick:function (record) {
                var dg = $('#'+dgStu);
                var rows = $(dg).datagrid('getRows');
                for (var i=0; i< rows.length; i++){
                    rows[i].class_name = record.class_name;
                    rows[i].class_id = record.class_id;
                    rows[i].class_no = record.class_no;
                    setDgCellTextEx(dg, i, 'class_id', record.class_name)
                }
                $('#'+upgNewClassNo).textbox('setValue', record.class_no);
            }
        });
    }

    function getStudent(classId) {
        $.ajax({
            method: 'POST',
            url: '/dance_class_student_get',
            async: true,
            dataType: 'json',
            data: {class_id: classId}
        }).done(function (data) {
            if(data.errorCode === 0) {
                var arr = [];
                for(var i=0; i< data.rows.length; i++){
                    arr.push({sno: data.rows[i].sno, stu_id: data.rows[i].id, student_name: data.rows[i].name,
                        is_up: 1, is_up_text: '是'});
                }
                danceDgLoadData(dgStu, {rows: arr, total: arr.length});
            } else {
                $.messager.alert('错误',data.msg,'error');
            }
        });
    }
    
    function dgStuClickCell(index,field) {
        if (edIdxStu != index){
            var dg = $('#'+dgStu);
            endEditingStu();
            $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);
            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            edIdxStu = index;
        }
    }
    
    function dgStuBeginEdit(index,row) {
        var dg = $('#'+dgStu);
        var school_no = $('#'+upgSchoolNo).textbox('getValue');
        var ed = $(dg).datagrid('getEditor', {index:index,field:'class_id'});
        if(ed){
            $(ed.target).combobox({
                data:danceFilterClassByNo(classList, school_no),
                formatter: danceFormatterClass,
                onSelect:function (record) {
                    var dg = $('#'+dgStu);
                    var row = $(dg).datagrid('getSelected');
                    row.class_no = record.class_no;
                }
            }).combobox('setValue', row.class_id);
        }
    }

    function validate() {
        if(!$('#'+upgOldClassName).combobox('getValue')){
            //$.messager.alert('提示', '请选择原班级！', 'info');
            $.messager.alert({ title: '提示',icon:'info', msg: '请选择原班级！',
                fn: function(){
                    $('#'+upgOldClassName).textbox('textbox').focus();
                }
            });
            return false;
        }

        return true;
    }

    /**
     * 打包发送给服务器的数据。
     * @returns {{row: {}, upgItem: Array}}
     */
    function packageMsg() {
        var msg = {row: {}, upgItem: []};
        msg.row.id = uid;
        msg.row.school_id = $('#'+upgSchoolName).combobox('getValue');
        msg.row.school_no = $('#'+upgSchoolNo).textbox('getValue');
        msg.row.upg_date = $('#'+upgDate).datebox('getValue');
        var oldClass = $('#'+upgOldClassName);
        msg.row.old_clsid = $(oldClass).combobox('getValue');
        msg.row.oldClassNo = $('#'+upgOldClassNo).textbox('getValue');
        msg.row.oldClassName = $(oldClass).combobox('getText');
        var newClass =  $('#'+upgNewClassName);
        msg.row.new_clsid = $(newClass).combobox('getValue');
        msg.row.newClassNo = $('#'+upgNewClassNo).textbox('getValue');
        msg.row.newClassName = $(newClass).combobox('getText');

        var dg = $('#'+dgStu);
        var rows = dg.datagrid('getRows');
        for(var i=0; i< rows.length; i++){
            msg.upgItem.push(rows[i]);
        }

        return msg;
    }

    function doAdd() {
        if (title.indexOf('[新增]') > 0 ){    // 在新增页面，更新当前页
            doNew();
        } else {
            danceUpgClassDetailInfo(page, url, condition);
        }
    }

    function changeId(uid) {
        $('#'+pager).attr('id', pager += uid);
        $('#'+panel).attr('id', panel += uid);
        $('#'+footer).attr('id', footer += uid);
        $('#'+dgStu).attr('id', dgStu += uid);

        $('#'+upgNo).attr('id', upgNo += uid).textbox('textbox').css('background',darkColor);
        $('#'+upgDate).attr('id', upgDate += uid);
        $('#'+upgSchoolNo).attr('id', upgSchoolNo += uid).textbox('textbox').css('background',darkColor);
        $('#'+upgOldClassNo).attr('id', upgOldClassNo += uid).textbox('textbox').css('background',darkColor);
        $('#'+upgOldClassName).attr('id', upgOldClassName += uid);
        $('#'+upgSchoolName).attr('id', upgSchoolName += uid);
        $('#'+upgNewClassNo).attr('id', upgNewClassNo += uid).textbox('textbox').css('background',darkColor);
        $('#'+upgNewClassName).attr('id', upgNewClassName += uid);
        $('#'+upgRecorder).attr('id', upgRecorder += uid).textbox('textbox').css('background',darkColor);
    }

}
