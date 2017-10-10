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
            'addEditFunc': danceAddReceiptStudyDetailInfo,
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
