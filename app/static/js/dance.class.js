
'use strict';

var danceClassCallFunc = undefined;

/**
 * 打开 班级信息 Tab页
 * @param title
 * @param tableId
 * @param condition
 */
function danceAddTabClassDatagrid(title, tableId, condition) {
    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
        danceClassCallFunc(condition);
    } else {
        var content = '<div style="min-width:1024px;width:100%;height:100%"><table id=' + tableId + '></table></div>';
        $(parentDiv).tabs('add', {
            title: title,
            content: content,
            closable: true
        });
        danceClassCallFunc = danceCreateClassDatagrid(tableId, '/dance_class', condition);
    }
}

/**
 * 创建 班级信息 Tab页的 datagrid 表格
 * @param datagridId
 * @param url
 * @param condition
 * @returns {doAjaxGetData}
 */
function danceCreateClassDatagrid(datagridId, url, condition) {
    var _pageSize = 30;
    var _pageNo = 1;
    var ccId = 'cc' + datagridId;       // Combo box,班级名称查找框ID
    var sbId = 'sb' + datagridId;
    var dg = $('#' + datagridId);
    var queryCondition = {};

    $.extend(queryCondition, condition);
    $(dg).datagrid({
        // title: '班级信息',
        // iconCls: 'icon-save',
        fit: true,
        fitColumns: true,
        pagination: true,   // True to show a pagination toolbar on datagrid bottom.
        singleSelect: true, // True to allow selecting only one row.
        loadMsg: '正在加载数据...',
        border: false,
        striped: true,
        pageNumber: 1,
        pageSize: _pageSize,     //每页显示条数
        nowrap: true,   // True to display data in one line. Set to true can improve loading performance.
        pageList: [20, 30, 40, 50, 100],   //每页显示条数供选项
        rownumbers: true,   // True to show a row number column.
        toolbar: [{
            text:"增加", iconCls:'icon-add',
            handler:function(){
                dcOpenDialogNewClass('dcNewClassWindow', '增加 班级', datagridId, 0, 'icon-save');
            }
        }, {
            text:"编辑/查看", iconCls:'icon-edit',
            handler:function(){
                var row = $(dg).datagrid('getSelected');
                if(row) {
                    dcOpenDialogNewClass('dcModifyClassWindow', '编辑/查看 班级', datagridId, row.id,  'icon-save');
                }else {
                    $.messager.alert('提示', '请选择要查看的数据行！' , 'info');
                }
            }
        }, {
            text:"删除", iconCls:'icon-remove',
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
                            //console.log('del:' + ids);
                            $.ajax({
                                method: 'POST',
                                url: '/dance_del_data',
                                dataType: 'json',
                                data: {'ids': ids, 'who': 'DanceClass'}
                            }).done(function(data) {
                                if (data.errorCode == 0) {
                                    $(dg).datagrid('loading');
                                    var gridOpts = $(dg).datagrid('getPager').pagination('options');
                                    var _total = gridOpts.total - row.length;
                                    if (_pageNo > 1 && (_pageNo-1)*_pageSize >= _total) { _pageNo--; }
                                    doAjaxGetData();
                                } else {
                                    $.messager.alert('提示', data.msg, 'error');
                                }
                            }).fail(function(jqXHR, textStatus, errorThrown) {
                                dg.datagrid('loaded');
                                var msg = "请求失败}。错误码：{0}({1})".format(jqXHR.status, errorThrown);
                                $.messager.alert('提示', msg, 'info');
                            });
                            // end of 删除数据 //////////////////////////////////////
                        }
                    });
                }
            }
        }, '-',{
            text: '班级名称：<input id=' + ccId + '>'
        },{
            iconCls: 'icon-search', text:"查询",  /// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
            handler: function () {
                alert('查询');
            }
        }, '-', {id: sbId}
        ],
        columns: [[
            {field: 'ck', checkbox:true },   // checkbox
            // {field: 'no', title: '序号',  width: 15, align: 'center' },  //能自动显示行号，则不再需要自己实现
            // {field: 'id', title: 'id',  width: 30, align: 'center' },
            {field: 'cno', title: '班级编号', width: 140, align: 'center'},
            {field: 'school_name', title: '分校名称', width: 140, align: 'center'},
            {field: 'class_name', title: '班级名称', width: 160, align: 'center'},
            {field: 'begin_year', title: '开班年份', width: 60, align: 'center'},
            {field: 'stuNum', title: '人数', width: 50, align: 'center'},   // stuNum   cur_students
            {field: 'class_type', title: '班级类型', width: 60, align: 'center'},
            {field: 'class_style', title: '班级形式', width: 60, align: 'center'},
            {field: 'teacher', title: '授课老师姓名', width: 100, align: 'center'},
            {field: 'cost_mode', title: '收费模式', width: 60, align: 'center'},
            {field: 'cost', title: '收费标准', width: 60, align: 'center'},
            {field: 'recorder', title: '记录员', width: 70, align: 'center'}
        ]],
        onLoadSuccess: function () {
            $(dg).datagrid("fixRownumber");
            $(dg).datagrid('loaded');
        }, onDblClickCell: function (index) {
            var rows = $(dg).datagrid('getRows');
            var row = rows[index];
            dcOpenDialogNewClass('dcModifyClassWindow', '编辑/查看 班级', datagridId, row.id,  'icon-save');
        }
    });

    $('#'+ccId).combobox({     // 姓名 搜索框 combo box
        prompt: '班名拼音首字母查找',
        valueField: 'id',
        textField: 'text',
        width: 140,
        panelHeight: "auto"
    });

    $('#'+sbId).switchbutton({
        onText: '单选', offText: '多选', checked: true,
        onChange: function (checked) {
            var gridOpts = $(dg).datagrid('options');
            gridOpts.singleSelect = checked;
        }
    });

    var pager = $(dg).datagrid('getPager');
    $(pager).pagination({
        //pageSize: _pageSize,//每页显示的记录条数，默认为10
        //pageList: [20, 30, 40, 50],//可以设置每页记录条数的列表
        beforePageText: '第',//页数文本框前显示的汉字
        afterPageText: '页, 共 {pages} 页',
        displayMsg: '当前记录 {from} - {to} , 共 {total} 条记录',
        buttons:[{
            text:'导入', iconCls: 'icon-page_excel',
            handler:function(){
                danceModuleName = 'DanceClass';
                $(document.body).append('<div id="danceCommWin"></div>');
                $('#danceCommWin').panel({
                    href:'/static/html/_import_win.html',
                    onDestroy: function () {
                        doAjaxGetData();
                    }
                });
            }
        },{
            text:'导出', iconCls:' icon-page_white_excel ',
            handler:function(){
                danceModuleName = 'DanceClass';
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
        }],
        onSelectPage: function (pageNumber, pageSize) {
            $(dg).datagrid('loading');  // 打开等待div
            _pageSize = pageSize;
            _pageNo = pageNumber;
            doAjaxGetData();
        }
    });

    // 先通过ajax获取数据，然后再传给datagrid
    var doAjaxGetData = function (cond) {
        if (cond) {
            queryCondition = {};
            $.extend(queryCondition, cond);
            queryCondition['rows'] = _pageSize;
            _pageNo = 1;
            queryCondition['page'] = _pageNo;
        } else {
            queryCondition['rows'] = _pageSize;
            queryCondition['page'] = _pageNo;
        }
        $.ajax({
            method: 'POST',
            url: url + '_get',
            async: true,
            dataType: 'json',
            data: queryCondition
        }).done(function(data) {
            if (data.errorCode == 0) {
                console.log('doAjaxGetData', data);
                // 注意此处从数据库传来的data数据有记录总行数的total列和 rows
                var gridOpts = $(dg).datagrid('options');
                gridOpts.pageNumber = _pageNo;
                gridOpts.pageSize = _pageSize;
                var pagerOpts = $(dg).datagrid('getPager').pagination('options');
                pagerOpts.pageNumber = _pageNo;
                pagerOpts.pageSize = _pageSize;
                dg.datagrid('loadData', data);
            } else {
                $.messager.alert({title: '错误', msg: data.msg, icon:'error'});
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
            $.messager.alert('提示', msg, 'info');
        }).always(function () {
            dg.datagrid('loaded');
        });
    };

    doAjaxGetData();
    
    return doAjaxGetData;
}

/**
 * 打开 新增班级 窗口
 * @param id
 * @param title
 * @param dgId      本窗口 关闭后，要更新的 表格 id。
 * @param uuid      记录id，新增时 可以不填或者填写 <=0 ，修改记录时，必须填写记录的 ID
 * @param icon
 */
function dcOpenDialogNewClass(id, title, dgId, uuid, icon){

    var classNo = 'classNo'+id;
    var schoolNo = 'schoolNo'+id;
    var className = 'className'+id;
    var schoolName = 'schoolName'+id;
    var classType = 'classType'+id;
    var classStyle = 'classStyle'+id;
    var teacher = 'teacher'+id;
    var beginYear = 'beginYear'+id;
    var costMode = 'costMode'+id;
    var classCost = 'classCost'+id;
    var planStudents = 'planStudents'+id;
    var curStudents = 'curStudents'+id;
    var isEnd = 'isEnd'+id;
    var recorder = 'classRecorder'+id;
    var remark = 'classRemark'+id;
    var uid = 'classUUID'+id;

    if (document.getElementById(id)) {
        if(uuid > 0)
            ajaxRequest();
        else
            $.messager.alert('提示', '[' + title + ']窗口已打开！', 'info');
        return;
    }
    $('body').append('<div id=' + id + ' style="padding:5px"></div>');

    var ctrls = '<div class="easyui-panel" data-options="fit:true" style="padding:10px;">';
    ctrls += '<input id='+classNo+'><input id='+schoolNo+'>';
    ctrls += '<div style="height:3px"></div><input id='+className+'><input id='+schoolName+'>';
    ctrls += '<div style="height:3px"></div><input id='+classType+'><input id='+classStyle+'>';
    ctrls += '<div style="height:3px"></div><input id='+teacher+'><input id='+beginYear+'>';
    ctrls += '<div style="height:3px"></div><input id='+costMode+'><input id='+classCost+'>';
    ctrls += '<div style="height:3px"></div><input id='+planStudents+'><input id='+curStudents+'>';
    ctrls += '<div style="height:3px"></div><input id='+isEnd+'><input id='+recorder+'>';
    ctrls += '<div style="height:3px"></div><input id='+remark+'>';

    ctrls += '<input id=' + uid + ' type="hidden" value="0" />';
    ctrls += '</div>';

    $("#"+id).dialog({
        title:title,width:600,height:360,cache: false,iconCls:icon,content:ctrls,
        collapsible: false, minimizable:false,maximizable: true, resizable: false,modal:false,closed:true,
        buttons: [{text:'保存',iconCls:'icon-ok',width:80,height:30,handler:save },
            {text:'关闭',iconCls:'icon-cancel',width:80,height:30,handler:function(){ $("#"+id).dialog('close'); }}],
        onOpen:function () {
            console.log('onOpen');
            if(uuid > 0){
                ajaxRequest();
            }
        },
        onBeforeClose: function () {
            if (dgId && document.getElementById(dgId)) {
                $('#'+dgId).datagrid('reload');
            }
            $("#"+id).dialog('destroy');
        }
    }).dialog('open');

    $('#'+classNo).textbox({
        label:'班级编号：',labelAlign:'right',labelWidth:100,prompt:'自动生成',disabled:true,width:'48%'
    });
    $('#'+schoolNo).textbox({
        label:'分校编号：',labelAlign:'right',labelWidth:100,prompt:'关联分校名称',disabled:true,width:'48%'
    });

    $('#'+className).textbox({
        label:'*班级名称：',labelAlign:'right',labelWidth:100,width:'48%'
    }).textbox('textbox').focus();
    $('#'+schoolName).combobox({
        label:'*分校名称：',labelAlign:'right',labelWidth:100,
        valueField:'school_id', textField:'school_name',editable:false,panelHeight:'auto',width:'48%',
        url: '/api/dance_school_get',
        onLoadSuccess: function () {
            var data = $(this).combobox('getData');
            if(data.length){
                $('#'+schoolName).combobox('setValue', data[0].school_id);
                $('#'+schoolNo).textbox('setValue', data[0]['school_no']);
            }
        },
        onSelect:function (record) {
            $('#'+schoolNo).textbox('setValue', record['school_no']);
        }
    });

    $('#'+classType).combobox({
        label:'*班级类型：',labelAlign:'right',labelWidth:100,
        valueField:'ct_id', textField:'ct_name',editable:false,panelHeight:'auto',width:'48%',
        url: '/api/dance_class_type_get',
        iconWidth:22,
        icons:[{
            iconCls:'icon-add',
            handler: function () {
                dcOpenDialogNewClassType('dcClassTypeNewWin', '新增班级类型');
            }
        }]
    });
    $('#'+classStyle).combobox({
        label:'授课形式：',labelAlign:'right',labelWidth:100,
        valueField:'type', textField:'type_text',editable:false,panelHeight:'auto',
        data:[{
            type: 1,
            type_text: '集体课'
        },{
            type: 2,
            type_text: '1对1'
        }],width:'48%'
    }).combobox('setValue', 1);

    $('#'+teacher).combobox({
        label:'授课老师：',labelAlign:'right',labelWidth:100,
        valueField:'type', textField:'type_text',editable:false,panelHeight:'auto',width:'48%'
    });
    $('#'+beginYear).textbox({
        label:'开班年份：',labelAlign:'right',labelWidth:100,width:'48%'
    }).textbox('setValue', (new Date().getFullYear()));

    $('#'+costMode).combobox({
        label:'*学费收费模式：',labelAlign:'right',labelWidth:100,
        valueField:'type', textField:'type_text',editable:false,panelHeight:'auto',
        data:[{
            type: 1,
            type_text: '按课次'
        },{
            type: 2,
            type_text: '按课时'
        }],width:'48%'
    }).combobox('setValue', 1);
    $('#'+classCost).textbox({
        label:'*学费收费标准：',labelAlign:'right',labelWidth:100,width:'48%'
    });

    $('#'+planStudents).textbox({
        label:'计划招生人数：',labelAlign:'right',labelWidth:100,width:'48%'
    });
    $('#'+curStudents).textbox({
        label:'当前人数：',labelAlign:'right',labelWidth:100,prompt:'根据报班学员计算',disabled:true,width:'48%'
    });

    $('#'+isEnd).combobox({
        label:'*是否结束：',labelAlign:'right',labelWidth:100,
        valueField:'is_ended', textField:'is_ended_text',editable:false,panelHeight:'auto',
        data:[{
            is_ended: 1,
            is_ended_text: '是'
        },{
            is_ended: 0,
            is_ended_text: '否'
        }],width:'48%'
    }).combobox('setValue', 0);
    $('#'+recorder).textbox({
        label:'录入员：',prompt:'自动生成',disabled:true,labelAlign:'right',labelWidth:100,width:'48%'
    });

    $('#'+remark).textbox({
        label:'备注：',labelAlign:'right',multiline:true,labelWidth:100,width:'96%', height:60
    });

    function ajaxRequest(){
        // 发送数据
        $.ajax({
            method: 'POST',
            url: '/dance_class_detail_get',
            async: true,
            dataType: 'json',
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify({id: uuid })
        }).done(function(data) {
            console.log('ajaxRequest', data);
            if(data.errorCode == 0)
            {
                $('#'+classNo).textbox('setValue', data.row['cno']);
                $('#'+className).textbox('setValue', data.row.class_name);
                $('#'+schoolName).combobox('setText', data.row.school_name)
                    .combobox('setValue', data.row.school_id).combobox('disable');
                $('#'+schoolNo).textbox('setValue', data.row['school_no']);
                $('#'+classType).textbox('setText', data.row.class_type).combobox('setValue', data.row['class_type_id']);
                $('#'+classStyle).combobox('setValue', data.row['class_style_value']);
                $('#'+teacher).textbox('setValue', data.row.teacher);
                $('#'+beginYear).textbox('setValue', data.row.begin_year);
                $('#'+costMode).combobox('setValue', data.row['cost_mode_value'])
                    .combobox(data.row.cur_students ? 'disable' : 'enable');
                $('#'+classCost).textbox('setValue', data.row.cost);
                $('#'+planStudents).textbox('setValue', data.row.plan_students);
                $('#'+curStudents).textbox('setValue', data.row['stuNum']);      // cur_students
                $('#'+isEnd).combobox('setValue', data.row.is_ended);
                $('#'+recorder).textbox('setValue', data.row['recorder']);
                $('#'+remark).textbox('setValue', data.row.remark);

                $('#'+uid).val(data.row.id);
            }else {
                $.messager.alert('提示', data.msg, 'info');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.messager.alert('提示', "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown), 'info');
        });
    }

    function save() {
        // 校验数据是否合法
        var name = $('#'+className).textbox('getValue');
        if(!name || name.length > 40) {
            $.messager.alert({title:'提示', msg:'班级名称不能为空，且不能大于40字符！', icon: 'info',
                fn:function () {
                    $('#'+className).textbox('textbox').focus();
                }
            });
            return false;
        }

        var c_type = $('#'+classType).textbox('getValue');
        if(!c_type) {
            $.messager.alert({title:'提示', msg:'请选择班级类型！', icon: 'info',
                fn:function () {
                    $('#'+classType).textbox('textbox').focus();
                }
            });
            return false;
        }

        var c_style = $('#'+classStyle).combobox('getValue');
        if(!c_style){
            $.messager.alert({title:'提示', msg:'请选择授课形式！', icon: 'info',
                fn:function () {
                    $('#'+classStyle).textbox('textbox').focus();
                }
            });
            return false;
        }

        var c_year = $('#'+beginYear).textbox('getValue');

        var c_mode = $('#'+costMode).combobox('getValue');
        if(!c_mode) {
            $.messager.alert({title:'提示', msg:'请选择学费收费模式！', icon: 'info',
                fn:function () {
                    $('#'+costMode).textbox('textbox').focus();
                }
            });
            return false;
        }

        var c_cost = $('#'+classCost).textbox('getValue');
        if(!c_cost || isNaN(parseFloat(c_cost))) {
            $.messager.alert({title:'提示', msg:'请输入学费收费标准！请输入数值。', icon: 'info',
                fn:function () {
                    $('#'+classType).textbox('textbox').focus();
                }
            });
            return false;
        }

        // 打包数据
        var data = {id: $('#'+uid).val(),
            class_name: name,
            begin_year: c_year,
            class_type:c_type,
            class_style: c_style,
            teacher: $('#'+teacher).combobox('getValue'),
            cost_mode: c_mode,
            cost: c_cost,
            plan_students: $('#'+planStudents).textbox('getValue'),
            cur_students: $('#'+curStudents).textbox('getValue'),
            is_ended: $('#'+isEnd).combobox('getValue'),
            remark: $('#'+remark).textbox('getValue'),
            school_id:$('#'+schoolName).combobox('getValue')
        };
        console.log('send:', data);

        // 发送数据
        $.ajax({
            method: 'POST',
            url: '/dance_class_modify',
            async: true,
            dataType: 'json',
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(data)
        }).done(function(data) {
            $.messager.alert('提示', data.msg, 'info');
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.messager.alert('提示', "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown), 'info');
        });
    }
}

/**
 * 打开 新增班级类型 窗口
 * @param id
 * @param _title
 * @param _width
 * @param _height
 * @param _icon
 */
function dcOpenDialogNewClassType(id, _title, _width, _height, _icon){
    if (document.getElementById(id)) {
        $.messager.alert('提示', '[' + _title + ']窗口已打开！', 'info');
        return;
    }
    $('body').append('<div id=' + id + ' style="padding:5px"></div>');

    if (_width == null)
        _width = 320;
    if (_height == null)
        _height = 205;

    var name = 'classTypeName'+id;
    var recorder = 'classTypeRecorder'+id;

    var ctrls = '<div class="easyui-panel" data-options="fit:true" style="padding:10px;">';
    ctrls += '<input id='+name+'>';
    ctrls += '<div style="height:3px"></div><input id='+recorder+'>';

    ctrls += '</div>';

    $("#"+id).dialog({
        title:_title,width:_width,height:_height,cache:false,iconCls:_icon,content:ctrls,modal:false,closed:true,
        collapsible: false, minimizable:false,maximizable: false, resizable: false,
        buttons: [{text:'保存',iconCls:'icon-ok',width:80,height:30,handler:save},
            {text:'关闭',iconCls:'icon-cancel',width:80,height:30,handler:function(){ $("#"+id).dialog('close'); }}],
        onBeforeClose: function () { $("#"+id).dialog('destroy'); }
    }).dialog('open');

    $('#'+name).textbox({
        label:'*班级类型：',labelAlign:'right',labelWidth:100,prompt:'不可重复',width:'98%'
    }).textbox('textbox').focus();

    $('#'+recorder).textbox({
        label:'录入员：',prompt:'自动生成',disabled:true,labelAlign:'right',labelWidth:100,width:'98%'
    });


    function save() {
        // 校验数据是否合法
        var typeName = $('#'+name).textbox('getValue');
        if(!typeName || typeName.length > 20) {
            $.messager.alert({title:'提示', msg:'班级类型名称不能为空，且不能大于20字符！', icon: 'info',
                fn:function () {
                    $('#'+name).textbox('textbox').focus();
                }
            });
            return false;
        }

        // 打包数据
        var data = [{id: 0,  row: { name: typeName}}];
        console.log('send:', data);

        // 发送数据
        $.ajax({
            method: 'POST',
            url: '/dc_class_type_update',
            async: true,
            dataType: 'json',
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(data)
        }).done(function(data) {
            $.messager.alert('提示', data.msg, 'info');
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.messager.alert('提示', "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown), 'info');
        });
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//----------------------------------------------------------------------------------------------------------------------

/**
 * 添加或者打开 班级考勤 Tab页
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabClassCheckIn(title, tableId, condition) {
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

        var module = 'dance_class_check_in';
        var opts = {
            queryText: '姓名：',
            queryPrompt: '姓名拼音首字母查找',
            who: module,
            danceModuleName: module,
            danceModuleTitle: title,          // 导入、导出 窗口 title
            url: '/'+module,        // 从服务器获取数据的url
            cond: condition,        // 表格数据查询参数
            addEditFunc: danceClassCheckIn,
            page: '/static/html/_class_check_in.html',     // 上述函数的参数
            funcOpts: {
                title: title
            },
            columns: [[
                {field: 'ck', checkbox:true },
                {field: 'code', title: '考勤编号', width: 140, align: 'center'},
                {field: 'school_name', title: '分校名称', width: 110, align: 'center'},
                {field: 'date', title: '上课日期', width: 140, align: 'center'},
                {field: 'class_name', title: '班级名称', width: 80, align: 'center'},
                {field: 'teacher_name', title: '老师名称', width: 90, align: 'center'},
                {field: 'time', title: '上课时间', width: 80, align: 'center'},
                {field: 'total', title: '班级总人数', width: 80, align: 'center'},
                {field: 'come', title: '出勤人数', width: 80, align: 'center'},
                {field: 'absent', title: '缺勤人数', width: 80, align: 'center'},
                {field: 'rate', title: '出勤率', width: 80, align: 'center'},
                {field: 'class_hours', title: '上课时长', width: 80, align: 'center'},
                {field: 'remark', title: '备注', width: 90, align: 'center'},
                {field: 'recorder', title: '录入员', width: 90, align: 'center'}
            ]]
        };

        danceOpenCommonDg(tableId, opts);
    }
}
/*
function danceClassCheckInInfo(param) {
    var wId = 'dcClassCheckInWindow';
    if(param.uuid > 0) {
        dcOpenDialogCourse(wId+'-Modify', '编辑/查看 '+param.title, param.dgId, param.uuid, 'icon-save');
    } else{
        dcOpenDialogCourse(wId+'-New', '增加 '+param.title, param.dgId, 0, 'icon-save');
    }
}
*/
function danceClassCheckIn(opts) {
    var title = opts.title + (opts.uuid > 0 ? '信息': '[新增]');
    var no = -2;    // 记录所在数据库中的序号，方便翻页。传递 -2 则根据 uid 查询该记录的序号
    var pager = 'chkPager';     // 以下id从 html文件获取，故需要使用js修改id
    var panel = 'chkPanel';
    var footer = 'chkFooter';
    var dgStu = 'chkDgStu';
    var dgOth = 'chkDgOth';

    var chkNo = 'no';
    var chkDate = 'date';
    var chkSchoolNo = 'schoolNo';
    var chkClassNo = 'classNo';
    var chkClassName = 'className';
    var chkSchoolName = 'schoolName';
    var chkClassType = 'class_type';
    var chk_teacher = 'teacher_id';
    var chk_recorder = 'recorder';
    var chk_rate = 'rate';
    var chk_total = 'total';
    var chk_come = 'come';
    var chk_absent = 'absent';
    var chk_class_hours = 'class_hours';
    var chk_remark = 'remark';
    var edIdxStu = undefined;
    var classList = [];
    var schoolList = [];
    var btnAdd = 'add'+danceGetId(opts.uuid);

    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
        changeVarId(opts.uuid);
    } else {
        $(parentDiv).tabs('add', {
            title: title, closable: true, loadingMessage: '加载中...', href: opts.page,
            onLoad: function () {
                changeId(opts.uuid);
                setCtrlEvent();

                if (opts.uuid > 0) { getDetail();}
                else { doNew();}
            }
        });
    }

    function getDetail() {

    }

    function doNew() {
        danceDgLoadData(dgStu, []);
        danceDgLoadData(dgOth, []);
        $('#'+chkDate).datebox('setValue', danceGetDate());
        getExtras();
        $('#'+btnAdd).linkbutton('disable');
    }

    function getExtras() {
        $.ajax({
            method: 'POST',
            url: opts.url+ '_details_extras',
            async: true,
            dataType: 'json',
            data: {'school_id': opts.cond.school_id}
        }).done(function (data) {
            if(data.errorCode === 0) {
                classList = data['classlist'];
                schoolList = data['schoollist'];
                danceSetSchoolName(schoolList, chkSchoolName, chkSchoolNo);
                var school_no = $('#'+chkSchoolNo).textbox('getValue');
                $('#'+chkClassName).combobox('loadData', danceFilterClassByNo(classList, school_no));
            } else {
                $.messager.alert('错误',data.msg,'error');
            }
        });
    }

    function doSave() {

    }

    function doAdd() {

    }

    function setCtrlEvent() {
        $('#'+pager).pagination({
            showRefresh: opts.uuid > 0, total: 0, pageSize: 1, showPageList: false, showPageInfo: false,
            buttons: [{text: '保存', iconCls: 'icon-save', handler: doSave},
                { text:'新增', iconCls:'icon-add', id:btnAdd,  handler:doAdd}],
            beforePageText: '第', afterPageText: '条，总 {pages} 条',
            onSelectPage: function (pageNumber) {
                if (opts.uuid > 0) {
                    no = pageNumber;
                    getDetail();
                }
            }
        });
        $('#'+dgStu).datagrid({
            onClickCell: dgStuClickCell,
            //onBeginEdit: dgStuBeginEdit,
            onEndEdit: function (index, row){
                var dg = $('#'+dgStu);
                var eds = $(dg).datagrid('getEditors', index);
                for(var i=0; i< eds.length; i++){
                    if (eds[i].type === 'combobox'){
                        var textField = getTextField(eds[i].field);
                        row[textField] = $(eds[i].target).combobox('getText');
                    }
                }
            },
            toolbar: [
                {iconCls: 'icon-add', text: '增加行', disabled:true, handler: function () {
                    $('#'+dgStu).datagrid('appendRow', {});}},
                {iconCls: 'icon-remove', text: '删除行',disabled:true, handler: function () { danceDelRow(dgStu);}}
            ]
        });
        $('#'+panel).mousedown(function (event) {      // panel 鼠标按下事件
            if (event.target.id === panel || event.target.className === 'datagrid-toolbar') {
                event.stopPropagation(); // 禁止冒泡执行事件
                endEditingStu();
            }
        });
        $('#'+chkSchoolName).combobox({     // 分校名称
            onClick:function (record) {
                $('#'+chkSchoolNo).textbox('setValue', record['school_no']);
                $('#'+chkClassName).combobox('loadData', danceFilterClassByNo(classList, record['school_no']));
            }
        });

        $('#'+chkClassName).combobox({   // 班级名称
            formatter: danceFormatterClass,
            onClick:function (record) {
                getStudent(record.class_id);
                $('#'+chkClassNo).textbox('setValue', record.class_no);
                $('#'+chkClassType).textbox('setText', record['class_type_text']);
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
                        is_attend: 1, is_attend_text:'√', is_usefee: 1, is_usefee_text:'是',
                        fee: 70
                    });
                }
                danceDgLoadData(dgStu, {rows: arr, total: arr.length});
                $('#'+chk_total).textbox('setValue', data.rows.length);
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

    function danceDelRow(dgId) {

    }


    function endEditingStu(){
        if (edIdxStu !== undefined){
            $('#'+dgStu).datagrid('endEdit', edIdxStu);
            edIdxStu = undefined;
        }
    }

    function changeId(uid) {
        $('#'+pager).attr('id', pager += danceGetId(uid));
        $('#'+panel).attr('id', panel += danceGetId(uid));
        $('#'+footer).attr('id', footer += danceGetId(uid));
        $('#'+dgStu).attr('id', dgStu += danceGetId(uid));
        $('#'+dgOth).attr('id', dgOth += danceGetId(uid));

        $('#'+chkNo).attr('id', chkNo += danceGetId(uid)).textbox('disable');
        $('#'+chkDate).attr('id', chkDate += danceGetId(uid));
        $('#'+chkSchoolNo).attr('id', chkSchoolNo += danceGetId(uid)).textbox('disable');
        $('#'+chkClassNo).attr('id', chkClassNo += danceGetId(uid)).textbox('disable');
        $('#'+chkClassName).attr('id', chkClassName += danceGetId(uid));
        $('#'+chkSchoolName).attr('id', chkSchoolName += danceGetId(uid));
        $('#'+chkClassType).attr('id', chkClassType += danceGetId(uid)).textbox('disable');
        $('#'+chk_teacher).attr('id', chk_teacher += danceGetId(uid));
        $('#'+chk_recorder).attr('id', chk_recorder += danceGetId(uid)).textbox('disable');

        $('#'+chk_rate).attr('id', chk_rate += danceGetId(uid)).textbox('disable');
        $('#'+chk_total).attr('id', chk_total += danceGetId(uid)).textbox('disable');
        $('#'+chk_come).attr('id', chk_come += danceGetId(uid)).textbox('disable');
        $('#'+chk_absent).attr('id', chk_absent += danceGetId(uid)).textbox('disable');
        $('#'+chk_class_hours).attr('id', chk_class_hours += danceGetId(uid)).textbox('disable');
        $('#'+chk_remark).attr('id', chk_remark += danceGetId(uid));
    }

    function changeVarId(uid) {
        pager += danceGetId(uid);
        panel += danceGetId(uid);
        footer += danceGetId(uid);
        dgStu += danceGetId(uid);
        dgOth += danceGetId(uid);

        chkNo += danceGetId(uid);
        chkDate += danceGetId(uid);
        chkSchoolNo += danceGetId(uid);
        chkClassNo += danceGetId(uid);
        chkClassName += danceGetId(uid);
        chkSchoolName += danceGetId(uid);
        chkClassType += danceGetId(uid);
        chk_teacher += danceGetId(uid);
        chk_recorder += danceGetId(uid);

        chk_rate += danceGetId(uid);
        chk_total += danceGetId(uid);
        chk_come += danceGetId(uid);
        chk_absent += danceGetId(uid);
        chk_class_hours += danceGetId(uid);
        chk_remark += danceGetId(uid);
    }

    function danceGetId(id) {
        return 'ClassChkIn' + (id > 0 ? '-Modify': '-New');
    }
}
