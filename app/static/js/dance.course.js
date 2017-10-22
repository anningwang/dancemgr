/**
 * Created by Administrator on 2017/10/13.
 */

'use strict';

/**
 * 添加或者打开  课程表 Tab页
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabCourse(title, tableId, condition) {
    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
        $('#'+tableId).datagrid('load', condition);
    } else {
        var content = '<div id=div-'+tableId+' style="min-width:1440px;width:100%;height:100%">';
        // content += '<div id=courseMM' + tableId + '></div>';
        content += '<div id=dcDiv' + tableId + ' style="top:87px;height:700px;width:100%;position:absolute;overflow:hidden"></div>';
        content += '<table id=' + tableId + '></table> </div>';
        content +=  '<style> #div-'+tableId+' .datagrid-btable tr{height:30px;}</style>';
        $(parentDiv).tabs('add', {
            title: title,
            content: content,
            closable: true
        });

        var module = 'dance_course';
        var opts = {
            queryText: '姓名：',
            queryPrompt: '姓名拼音首字母查找',
            who: module,
            danceModuleName:module,
            danceModuleTitle: title,          // 导入、导出 窗口 title
            addEditFunc: danceTeacherDetailInfo,
            page: '/static/html/_teacher_details.html',     // 上述函数的参数
            columns: [[
                {field: 'time', title: '时间', width: 50, align: 'center', fixed:true},
                {field: 'w1', title: '周一', width: 95, align: 'center'},
                {field: 'w2', title: '周二', width: 95, align: 'center'},
                {field: 'w3', title: '周三', width: 95, align: 'center'},
                {field: 'w4', title: '周四', width: 95, align: 'center'},
                {field: 'w5', title: '周五', width: 95, align: 'center'},
                {field: 'w6', title: '周六', width: 95, align: 'center'},
                {field: 'w7', title: '周天', width: 95, align: 'center'}
            ]]
        };

        danceCreateCourseDatagrid(tableId, '/'+module, condition, opts)
    }
}

/**
 * 增加 Datagrid 组件，并格式化，包括列名，增/删/查等相应函数
 * @param datagridId        Datagrid id
 * @param url               从服务器获取数据的url
 * @param condition         表格数据查询参数
 * @param options           创建表格所需要的 列名、查询提示文字、删除模块等信息
 */
function danceCreateCourseDatagrid(datagridId, url, condition, options) {
    var _pageSize = 30;
    // var _pageNo = 1;
    var ccId = 'cc' + datagridId;       // Combo box,姓名查找框ID
    var sbId = 'sb' + datagridId;
    var dg = $('#' + datagridId);       // datagrid ID
    var divId = 'dcDiv' + datagridId;
    var bcId = 'courseName' + datagridId;
    var mmId = 'dance-course-mm';

    var dance_condition = '';               // 主datagrid表查询条件
    var WIN_TOP = 25;   // 表头高度
    var WIN_LEFT = 231; // 左侧偏移
    var COURSE_WIN_WIDTH = 90;      // 课程表窗口宽度
    var dcOriCoord = undefined;

    $(dg).datagrid({
        fit: true,
        url: url + '_get',
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
        queryParams: condition,
        toolbar: [{
            iconCls:'icon-add', text:"增加",      ///+++++++++++++++++++++++++++++++++++++++++++++
            handler:function(){
                //var cond = $(dg).datagrid('options').queryParams;
                //options.addEditFunc(options.page, url, cond);
                dcOpenDialogNewCourse('dc-add-course', '增加课程表', 'div-'+datagridId)
            }}, {iconCls:'icon-edit', text:"编辑/查看",  ///@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
            handler:function(){
                var row = $(dg).datagrid('getSelections');
                if (row.length === 0) {
                    $.messager.alert('提示', '请选择要查看的行！' , 'info');
                    return false;
                } else {
                    var cond = $(dg).datagrid('options').queryParams;
                    options.addEditFunc(options.page, url, cond, row[0].id);
                }
            }},
            {iconCls:'icon-remove', text:"删除",  handler:doDel},
            {iconCls:'icon-save', text:"保存",  handler:doSave},'-',
            {text: options.queryText + '<input id=' + ccId + '>'},
            {iconCls: 'icon-search', text:"查询", handler: function () {
                var cond = {};
                $.extend(cond, $(dg).datagrid('options').queryParams);
                cond['name'] = dance_condition;
                $(dg).datagrid('load', cond);
            }}, '-',
            {text: '<input id=' + sbId + '>'},
            {id: bcId}
        ],
        columns: options.columns,
        onDblClickCell: function (index) {
            var rows = $(dg).datagrid('getRows');
            var row = rows[index];
            var cond = $(dg).datagrid('options').queryParams;
            options.addEditFunc(options.page, url, cond, row.id);
        },
        onLoadSuccess:function (data) {
            var coord = getDgCellCoord(dg, 0, 'time');
            console.log('load(0,0):', coord);
            if(dcOriCoord === undefined){
                dcOriCoord = coord;
                WIN_TOP = coord.pos.top;
            }

            $('#'+divId).css('top', (60+coord.top+2)+'px')       // 60 == Tab头高度 30，dg表Toolbar高度 30
                .height($(pager).position().top - 30 - WIN_TOP - 2);    // Tab头高度 30
            $('#'+bcId).linkbutton({text: data['info'] ? data['info']['name'] : '无记录'});
            setTimeout(function () {putCourse();}, 0);
        },
        onResize:function () {  // width, height
            var panel = $('#dance-main-layout').layout('panel', 'center');
            var opts = panel.panel('options');
            //console.log('panel center left',opts.left);
            WIN_LEFT = opts.left;

            var pos = $(pager).position();
            if(!pos) return;
            $('#'+divId).height(pos.top - 30 - WIN_TOP - 2);
            resizeCourse();
        }
    });


    $('#'+ccId).combobox({     // 搜索框 combo box
        prompt: options.queryPrompt,
        valueField: 'value',
        textField: 'text',
        width: 140,
        //panelHeight: "auto",
        onChange:autoComplete
    });

    //autoComplete(dance_condition,'');
    function autoComplete (newValue) {  // ,oldValue
        //console.log('newValue=' + newValue + ' oldValue=' + oldValue);
        dance_condition = $.trim(newValue);
        var queryCondition = {};
        $.extend(queryCondition, $(dg).datagrid('options').queryParams);
        queryCondition['name'] = dance_condition;
        $.post(url+'_query',queryCondition, function(data){
            $('#'+ccId).combobox('loadData', data);
        },'json');
    }

    $('#'+sbId).switchbutton({
        onText: '单选', offText: '多选', checked: true,
        onChange: function (checked) {
            var gridOpts = $(dg).datagrid('options');
            gridOpts.singleSelect = checked;
        }
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
                danceModuleName = options.danceModuleName;
                danceModuleTitle = options.danceModuleTitle;
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
                danceModuleTitle = options.danceModuleTitle;
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

    createMenu(mmId);

    // pager position top是相对Tab页顶点的高度，left是距离 Tab 页 左侧的距离  {top: 758, left: 0}
    // offset top 是距离屏幕顶端的距离 (North:60, Tab头30)，left是距离屏幕左侧的距离 (左侧Tree 200px)
    // {top: 848, left: 201}
    //console.log($(pager).position(), $(pager).offset());
    $('#'+divId).height($(pager).position().top - 55 - 2);

    function doDel() {
        var row = $(dg).datagrid('getSelections');
        if (row.length === 0) {
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
                if (data.errorCode === 0) {
                    $(dg).datagrid('reload');
                    $.messager.alert('提示', data.msg, 'info');
                } else {
                    $.messager.alert('错误', data.msg, 'error');
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
                $.messager.alert('提示', msg, 'info');
            });
        }
    }

    function doSave() {
        var old = dg.datagrid('getData');
        // 打包数据
        var data = {
            row: {id: old['info'] ? old['info']['id'] : 0,
                school_id: old['info'] ? old['info']['school_id'] : 0},
            item:[]
        };
        if(data.row.id <=0){
            data.row.begin = danceGetDate();
            data.row.name = '未命名';
        }

        for(var win in _dcCourse){
            if(!_dcCourse.hasOwnProperty(win))
                continue;
            data.item.push(_dcCourse[win].param);
        }
        console.log('send:', data);

        // 发送数据
        $.ajax({
            method: 'POST',
            url: '/dance_course_modify',
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

    // 创建右键菜单
    function createMenu(mmId) {
        // $('body').append('<div id='+mmId+'></div>');
        $('#'+divId).append('<div id='+mmId+'></div>');
        $('#'+mmId).menu({
            hideOnUnhover:false,
            onClick:function(item){
                //console.log(item);
            }
        }).menu('appendItem', {  // append a top menu item
            text: '克隆',
            iconCls: 'icon-ok',
            id: 'm-course-copy',
            onclick: function(){
                if(!_curCourseId) return;
                var pr = {};
                $.extend(pr, _dcCourse[_curCourseId].param);
                pr.isCopy = true;
                addCourse(pr);
            }
        }).menu('appendItem', {  // append a menu separator
            separator: true
        }).menu('appendItem', {  // append a top menu item
            text: '增加 课程表',
            iconCls: 'icon-add',
            id: 'm-course-new',
            onclick: function(){
                dcOpenDialogNewCourse('dc-add-course', '增加课程表', 'div-'+datagridId)
            }
        }).menu('appendItem', {  // append a top menu item
            text: '删除',
            iconCls: 'icon-remove',
            id: 'm-course-del',
            onclick: function(){
                if(!_curCourseId) return;
                $('#'+ _curCourseId).dialog('close');
                delete _dcCourse[_curCourseId];
            }
        }).menu('appendItem', {  // append a top menu item
            text: '修改',
            iconCls: 'icon-ok',
            id: 'm-course-modify',
            onclick: function(){
                if(!_curCourseId) return;
                courseDbClick(_curCourseId);
            }
        });
    }


    /**
     * 打开 新增 课程表 单项 窗口
     * @param parent        窗口的父节点
     * @param id
     * @param title
     * @param pr
     */
    function dcOpenDialogNewCourse(id, title, parent, pr){
        var name = 'className'+id;
        var shortName = 'shortName'+id;
        var wk = 'week'+id;
        var teacher = 'courseTeacher'+id;
        var room = 'courseRoom'+id;
        var time = 'courseTime'+id;
        var hours = 'courseHours'+id;

        if (document.getElementById(id)) {
            if(pr)
                setData(pr);
            else
                $.messager.alert('提示', '[' + title + ']窗口已打开！', 'info');
            return;
        }
        var pId = parent ? '#'+parent : 'body';
        $(pId).append('<div id=' + id + ' style="padding:5px"></div>');

        var ctrls = '<div class="easyui-panel" data-options="fit:true" style="padding:10px;overflow: hidden">';
        ctrls += '<input id='+name+'>';
        ctrls += '<div style="height:3px"></div><input id='+shortName+'><input id='+wk+'>';
        ctrls += '<div style="height:3px"></div><input id='+teacher+'>';
        ctrls += '<div style="height:3px"></div><input id='+room+'>';
        ctrls += '<div style="height:3px"></div><input id='+time+'><input id='+hours+'>';
        ctrls += '</div>';

        $("#"+id).dialog({
            title:title,width:360,height:245,maximizable: false, resizable: false, inline:true,
            cache:false,iconCls:null,
            content:ctrls,modal:false,closed:true,
            collapsible: false, minimizable:false,
            buttons: [{text:'保存',iconCls:'icon-ok',width:80,height:30,handler:save},
                {text:'关闭',iconCls:'icon-cancel',width:80,height:30,
                    handler:function(){ $("#"+id).dialog('close'); }}],
            onBeforeClose: function () { $("#"+id).dialog('destroy'); }
        }).dialog('open');
        
        createCtrls();      // 生成控件
        setData(pr);        // 对控件赋值

        function save() {   // 保存按钮
            if(!validate()) return false;

            var r_minutes = $('#'+hours).combobox('getValue');
            var ctrlTime = $('#'+time);
            var r_h = $(ctrlTime).timespinner('getHours');
            var r_m = $(ctrlTime).timespinner('getMinutes');

            var param = {week: $('#'+wk).combobox('getValue'),
                minutes: r_minutes,
                room_id: $('#'+room).textbox('getValue'), room:  $('#'+room).textbox('getText'),
                class_id: $('#'+name).textbox('getValue'),
                teacher_id: $('#'+teacher).textbox('getValue'), teacher: $('#'+teacher).textbox('getText'),
                time: formatTimeSpan(r_h, r_m, r_minutes), hour:r_h, m: r_m,
                short_name: $('#'+shortName).textbox('getText')
            };
            if(pr) {
                $.extend(pr, param);
                modifyCourse(pr);
            }else
                addCourse(param);
        }

        //--------------------------------------------------------------------------------------------------------------
        // 窗口控件生成和赋值，校验等操作
        function createCtrls() {
            $('#'+name).combogrid({
                label:'*班级名称：',labelAlign:'right',labelWidth:100,prompt:'请选择班级',width:'98%',
                url:'/api/dance_class_get', editable:false,
                panelWidth:220,
                idField: 'id',
                textField: 'name',
                fitColumns: true,
                queryParams: {ctrl: 'combogrid'},
                columns:[[
                    {field:'no',title:'班级编号',width:80},
                    {field:'name',title:'班级名称',width:120}
                ]],
                iconWidth:22,
                icons:[{
                    iconCls:'icon-add',
                    handler: function () {
                        dcOpenDialogNewClass('dcCourse-NewClass', '新增 班级');
                    }
                }],
                onSelect:function (index, row) {
                    $('#'+shortName).textbox('setValue', row.name);
                }
            });

            $('#'+shortName).textbox({
                label:'班级名称简称：',labelAlign:'right',labelWidth:100,width:'64%'
            });
            $('#'+wk).combobox({
                label:'星期：',labelAlign:'right',labelWidth:'50',width:'34%',
                valueField:'id',
                textField:'text',
                panelHeight:'auto',
                data: [{"id":1, "text":"一", "selected":true},
                    {"id":2, "text":"二"},
                    {"id":3, "text":"三"},
                    {"id":4, "text":"四"},
                    {"id":5, "text":"五"},
                    {"id":6, "text":"六"},
                    {"id":7, "text":"天"}]
            });

            $('#'+teacher).combobox({
                label:'任课老师：',labelAlign:'right',labelWidth:100,width:'98%',
                url:'/api/dance_teacher_get', textField:'name', valueField:'id'
            });

            $('#'+room).combobox({
                label:'教室：',labelAlign:'right',labelWidth:100,width:'98%'
            });

            $('#'+time).timespinner({
                label:'开课时间：',labelAlign:'right',labelWidth:100,width:'64%',
                increment:1, required:true,min: '07:00', max:'22:30'
            });
            $('#'+hours).combobox({
                label:'分钟：',labelAlign:'right',labelWidth:'50',width:'34%',
                valueField:'id',
                textField:'text',
                panelHeight:'auto',
                data: [{"id":60, "text":"1 H"},
                    {"id":90, "text":"1.5 H", "selected":true},
                    {"id":120, "text":"2 H"},
                    {"id":150, "text":"2.5 H"},
                    {"id":180, "text":"3 H"}
                ]
            });
        }
        
        // 给 课程表明细 窗口 设置数据
        function setData(pr){
            if(!pr) return;
            $('#'+name).combogrid('setValue', pr.class_id);
            $('#'+shortName).textbox('setValue', pr.short_name);
            $('#'+wk).combobox('setValue', pr.week);
            $('#'+teacher).combobox('setValue', pr.teacher_id);
            $('#'+time).timespinner('setValue', pr.time.split('-')[0]);
            $('#'+hours).combobox('setValue', pr.minutes);
        }
        
        function validate() {
            // 校验数据是否合法
            var ctrlName = $('#'+name);
            var className = ctrlName.textbox('getValue');
            if(!className){
                $.messager.alert({title:'提示', msg:'请选择班级！', icon: 'info',
                    fn:function () {
                        $(ctrlName).textbox('textbox').focus();
                    }
                });
                return false;
            }

            var r_shortName = $('#'+shortName).textbox('getText');
            if(!r_shortName || r_shortName.length > 6){
                $.messager.alert({title:'提示', msg:'班级简称不能超过6个汉字!', icon: 'info',
                    fn:function () {
                        $('#'+shortName).textbox('textbox').focus();
                    }
                });
                return false;
            }

            var ctrlTch = $('#'+teacher);
            var tchName = ctrlTch.textbox('getText');

            var ctrlRoom = $('#'+room);
            var roomText = ctrlRoom.textbox('getText');

            var ctrlTime = $('#'+time);
            var r_h = $(ctrlTime).timespinner('getHours');
            var r_m = $(ctrlTime).timespinner('getMinutes');
            if(!r_h){
                $.messager.alert({title:'提示', msg:'请输入开课时间！', icon: 'info',
                    fn:function () {
                        $(ctrlTime).textbox('textbox').focus();
                    }
                });
                return false;
            }
            if(r_h < 8 || r_h > 21) {
                $.messager.alert({title:'提示', msg:'开课时间需在8~21点之间！', icon: 'info',
                    fn:function () {
                        $(ctrlTime).textbox('textbox').focus();
                    }
                });
                return false;
            }

            var ctrlMinutes = $('#'+hours);
            var r_minutes = $(ctrlMinutes).combobox('getValue');
            if(!r_minutes) {
                if (!r_minutes){
                    $.messager.alert({title:'提示', msg:'请输入班级时长。', icon: 'info',
                        fn:function () {
                            $(ctrlMinutes).textbox('textbox').focus();
                        }
                    });
                    return false;
                }

                r_minutes =  $(ctrlMinutes).combobox('getText');
                if(isNaN(parseInt(r_minutes))) {
                    $.messager.alert({title:'提示', msg:'请输入分钟数。', icon: 'info',
                        fn:function () {
                            $(ctrlMinutes).textbox('textbox').focus();
                        }
                    });
                    return false;
                }
            }
            return true;
        }
        //--------------------------------------------------------------------------------------------------------------
    } // end of dcOpenDialogNewCourse


    var _courseId = 100;
    var _dcCourse = {};      // {id: {time: '8:30-10:00', teacher: '李老师', room: '舞蹈1室', short_name: '17上美术'}};
    var _curCourseId = undefined;
    var _dcCoord = {w1: {}, w2:{}, w3:{}, w4:{}, w5:{}, w6:{}, w7:{}};

    /**
     * 打开 课程表明细 窗口
     * @param pr
     */
    function addCourse(pr) {
        var w_min = (pr.minutes) ? pr.minutes : 90;
        var w_h = 85;
        if(w_min <= 60) w_h = 60;
        else if (w_min > 90 && w_min <= 120) w_h = 115;

        pr.p = divId;
        pr.w = COURSE_WIN_WIDTH;
        pr.h = w_h;
        pr.winId = 'cid'+_courseId;
        _dcCourse[pr.winId] = {};

        _dcCourse[pr.winId].idx = getRowIndex(pr.time.split('-')[0]);
        _dcCourse[pr.winId].field = 'w'+pr.week;
        var co = getCourseLeftTop(_dcCourse[pr.winId].idx, _dcCourse[pr.winId].field);
        pr.left = co.left;
        pr.top = co.top;
        _dcCourse[pr.winId].param = pr ;

        dcAddCourseCoord(pr.winId);
        var win = dcOpenCourseWin(pr.winId, pr.short_name, pr);
        var panel = $(win).dialog('panel');
        panel.dblclick(function (e) {
            console.log(e);
            courseDbClick(pr.winId);
        });

        panel.contextmenu(function (e) {
            // console.log('right click:',pr.winId);
            _curCourseId = pr.winId;
            e.preventDefault();
            $('#'+mmId).menu('show', {
                left: e.pageX,
                top: e.pageY
            }).menu('enableItem',  $('#m-course-copy')[0])
                .menu('enableItem',  $('#m-course-del')[0])
                .menu('enableItem',  $('#m-course-modify')[0]);
        });

        _courseId++;
    }

    // 修改课程表明细
    function modifyCourse(pr) {
        var w_min = (pr.minutes) ? pr.minutes : 90;
        var w_h = 85;
        if(w_min <= 60) w_h = 60;
        else if (w_min > 90 && w_min <= 120) w_h = 115;
        pr.h = w_h;

        var oldWk = _dcCourse[pr.winId].field;
        _dcCourse[pr.winId].idx = getRowIndex(pr.time.split('-')[0]);
        _dcCourse[pr.winId].field = 'w'+pr.week;
        var co = getCourseLeftTop(_dcCourse[pr.winId].idx, _dcCourse[pr.winId].field);
        pr.left = co.left;
        pr.top = co.top;
        dcAddCourseCoord(pr.winId, oldWk);

        dcSetCourseContent(pr.winId, pr.time, pr.teacher, pr.room);
        $('#'+pr.winId).window('setTitle', pr.short_name)
            .window('resize', {width:pr.w, height:pr.h})
            .window('move', {left:pr.left, top: pr.top});
    }

    // 双击课程表明细事件，调出修改窗口
    function courseDbClick(cid) {
        console.log('panel db click', cid, _dcCourse[cid]);
        dcOpenDialogNewCourse('dc-modify-course', '修改课程表', 'div-'+datagridId, _dcCourse[cid].param);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 获取课程表明细坐标 -------------------=======================---------------------------=========================
    function getCourseLeftTop(idx, field) {
        var coord = getDgCellCoord(dg, idx,  field);
        return {left: coord.offset.left - WIN_LEFT,
            top: coord.pos.top - WIN_TOP};
    }

    // 调整课程表明细坐标
    function resizeCourse() {
        _dcCoord = {w1: {}, w2:{}, w3:{}, w4:{}, w5:{}, w6:{}, w7:{}};

        for(var win in _dcCourse){
            if(!_dcCourse.hasOwnProperty(win))
                continue;
            var co = getCourseLeftTop(_dcCourse[win].idx, _dcCourse[win].field);
            _dcCourse[win].param.left = co.left;
            _dcCourse[win].param.top = co.top;
            dcAddCourseCoord(_dcCourse[win].param.winId, _dcCourse[win].field);
            $('#'+win).window('move',{left: _dcCourse[win].param.left,
                top: _dcCourse[win].param.top});
        }
    }

    function putCourse() {
        // 删除原有课程表窗口
        for(var win in _dcCourse) {
            if (!_dcCourse.hasOwnProperty(win))
                continue;
            $('#'+win).window('close');
        }
        _dcCourse = {};
        _dcCoord = {w1: {}, w2:{}, w3:{}, w4:{}, w5:{}, w6:{}, w7:{}};

        var data = $(dg).datagrid('getData');
        for(var i=0; i<data['item'].length; i++){
            addCourse(data['item'][i]);
        }
    }

    // 表格纵向滚动，触发 课程表小窗口 跟着滚动。
    var contents = $('#div-'+datagridId +' div.datagrid-body');
    contents.scroll(function () {
        //console.log('scroll');
        resizeCourse();
    });


    // 横向滚动条联动
    var scrollH = $('#div-'+datagridId).parent();    // $('#dgId div.datagrid-view2 div.datagrid-header');
    scrollH.scroll(function () {
       resizeCourse();
    });


    contents.contextmenu(function (e) {
        e.preventDefault();          //对标准DOM 中断 默认点击右键事件处理函数
        _curCourseId = undefined;
        $('#'+mmId).menu('show', {
            left: e.pageX,
            top: e.pageY
        }).menu('disableItem',  $('#m-course-copy')[0])
            .menu('disableItem',  $('#m-course-del')[0])
            .menu('disableItem',  $('#m-course-modify')[0]);
    });


    // 对重叠的课程表，改变其位置（left）。
    function dcAddCourseCoord(idx, oldWk) {
        var pr =_dcCourse[idx].param;
        var r = {l: pr.left, t: pr.top, h: pr.h, w: pr.w};
        var wk = _dcCoord[_dcCourse[idx].field];
        var inter = false;
        do {
            inter = false;
            for(var r1 in wk){
                if (!wk.hasOwnProperty(r1))
                    continue;
                if(isIntersection(r, wk[r1])){
                    r.l += COURSE_WIN_WIDTH+1;
                    inter = true;
                    break;
                }
            }
        }while(inter);
        if(oldWk) delete _dcCoord[oldWk][idx];
        _dcCoord[_dcCourse[idx].field][idx] = r;

        _dcCourse[idx].param.left = r.l;
    }

}



function dcOpenCourseWin(id, title, param){
    if (document.getElementById(id)) {
        $.messager.alert('提示', '[' + title + ']窗口已打开！', 'info');
        return;
    }
    var pId = param.p ? '#'+ param.p : 'body';
    $(pId).append('<div id=' + id + '></div>');
    var name = 'courseName'+id;

    var ctrls = '<div class="easyui-panel" data-options="fit:true" style="padding:2px;overflow: hidden">';
    ctrls += '<div id='+name+' ></div>';
    ctrls += '</div>';

    $("#"+id).dialog({
        title:title,width: param.w ? param.w : 140,
        height: param.h ? param.h : 80, shadow:true,closable:false,
        cache:false, content:ctrls,modal:false,closed:true,
        collapsible: false, minimizable:false,maximizable: false, resizable: false,
        cls: param.cls ? param.cls : 'c6',
        left: param.left, top: param.top,
        border:'thin', inline:true,
        onBeforeClose: function () { $("#"+id).dialog('destroy'); },
        onMove:function (left, top) {
        }
    }).dialog('open');
    dcSetCourseContent(id, param.time, param.teacher, param.room);
    return '#'+id;
}

function dcSetCourseContent(id, time, teacher, room) {
    $('#courseName'+id).empty().css({'font-size': '9px', "font-family":"宋体"})
        .append(time).append('<br>'+(teacher?teacher:'老师:'))
        .append('<br>'+(room?room:'教室:'));

}

// 返回时间（字符串格式：hh:mm 12:30）所在的 dg 表格 行索引（从0开始）
function getRowIndex(beginTm) {
    var arr = beginTm.split(':');
    var h = parseInt(arr[0]);
    var m = parseInt(arr[1]);
    return getRowIndexByHM(h, m);
}

function getRowIndexByHM(h, m) {
    return (h-8)*2 + (m==30 ? 1:0);
}

function formatTimeSpan(h, m, minutesDiff) {
    var tmStr = (h<10?'0'+h:h) + ':' + (m<10?'0'+m:m);
    h += parseInt(minutesDiff / 60);
    m += minutesDiff % 60;
    if(m >= 60) {
        m -= 60;
        h++;
    }
    return tmStr + '-' + (h<10?'0'+h:h) + ':' + (m<10?'0'+m:m);
}

// 简单判断矩形相交。
function isIntersection(r1, r2) {
    return (r1.l===r2.l
        && ((r1.t>=r2.t && r1.t<=r2.t+r2.h)
            || r2.t>=r1.t && r2.t<=r1.t+r1.h));
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * 添加或者打开  课程表列表 Tab页
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabCourseList(title, tableId, condition) {
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

        var module = 'dance_course_list';
        var opts = {
            queryText: '分校：',
            queryPrompt: '分校拼音首字母查找',
            who: module,
            danceModuleName:module,
            url: '/'+module,        // 从服务器获取数据的url
            cond: condition,        // 表格数据查询参数
            addEditFunc: danceCourseInfo,
            page: '/static/html/_add_course.html',     // 上述函数的参数
            columns: [[
                {field: 'ck', checkbox:true },
                {field: 'code', title: '课程表编号', width: 120, align: 'center'},
                {field: 'name', title: '课程表名称', width: 120, align: 'center'},
                {field: 'school_name', title: '所属分校', width: 120, align: 'center'},
                {field: 'begin', title: '开始时间', width: 100, align: 'center'},
                {field: 'end', title: '结束时间', width: 100, align: 'center'},
                {field: 'valid_text', title: '是否结束', width: 60, align: 'center'},
                {field: 'last_t', title: '更新时间', width: 90, align: 'center'},
                {field: 'last_u', title: '更新人', width: 90, align: 'center'},
                {field: 'recorder', title: '记录员', width: 90, align: 'center'},
                {field: 'create_at', title: '创建时间', width: 90, align: 'center'}
            ]]
        };

        danceOpenCommonDg(tableId, opts);
    }
    
}


function danceCourseInfo(param) {
    if(param.uuid > 0) {
        dcOpenDialogCourse('dcModifyCourseWindow', '编辑/查看 课程表基本信息', param.dgId, param.uuid, 'icon-save');
    } else{
        dcOpenDialogCourse('dcNewCourseWindow', '增加 课程表基本信息', param.dgId, 0, 'icon-save');
    }
}


/**
 * 打开 新增/修改 课程表基本信息 窗口
 * @param id
 * @param title
 * @param dgId      窗口 关闭后，要更新的 表格 id。
 * @param uuid      记录id，新增时 可以不填或者填写 <=0 ，修改记录时，必须填写记录的 ID
 * @param icon
 */
function dcOpenDialogCourse(id, title, dgId, uuid, icon){
    var noId = 'courseNo'+id;
    var name = 'crsName'+id;
    var school = 'crsSchool'+id;
    var begin = 'crsBegin'+id;
    var end = 'crsEnd'+id;
    var uid = 'courseUUID'+id;

    if (document.getElementById(id)) {
        if(uuid > 0)
            ajaxRequest();
        else
            $.messager.alert('提示', '[' + title + ']窗口已打开！', 'info');
        return;
    }
    $('body').append('<div id=' + id + ' style="padding:5px"></div>');
    
    var ctrls = '<div class="easyui-panel" data-options="fit:true" style="padding:10px;overflow: hidden">';
    ctrls += '<input id='+noId+'>';
    ctrls += '<div style="height:3px"></div><input id='+name+'>';
    ctrls += '<div style="height:3px"></div><input id='+school+'>';
    ctrls += '<div style="height:3px"></div><input id='+begin+'>';
    ctrls += '<div style="height:3px"></div><input id='+end+'>';

    ctrls += '<input id=' + uid + ' type="hidden" value="0" />';    //  隐藏的 id
    ctrls += '</div>';

    $("#"+id).dialog({
        title:title,width:320,height:245,
        cache:false,iconCls:icon,content:ctrls,
        modal:false,closed:true,
        collapsible: false, minimizable:false,
        maximizable: false, resizable: false,
        buttons: [{text:'保存',iconCls:'icon-ok',width:80,height:30,handler:save},
            {text:'关闭',iconCls:'icon-cancel',width:80,height:30,
                handler:function(){
                    $("#"+id).dialog('close');
                }
            }],
        onOpen:function () {
            if(uuid > 0){
                ajaxRequest();
            }
        },
        onBeforeClose: function () {
            if (document.getElementById(dgId)) {
                $('#'+dgId).datagrid('reload');
            }
            $("#"+id).dialog('destroy');
        }
    }).dialog('open');

    $('#'+noId).textbox({
        label:'课程表编号：',labelAlign:'right',labelWidth:90,prompt:'自动生成',disabled:true,width:'98%'
    });
    $('#'+name).textbox({
        label:'*课程表名称：',labelAlign:'right',labelWidth:90,prompt:'不可重复',width:'98%'
    }).textbox('textbox').focus();

    $('#'+school).combobox({
        label:'*所属分校：', labelAlign:'right',labelWidth:90,width:'98%',
        valueField:'school_id', textField:'school_name',editable:false,panelHeight:'auto',url:'/api/dance_school_get',
        onLoadSuccess: function () {
            var data = $(this).combobox('getData');
            if(data.length){
                $('#'+school).combobox('setValue', data[0].school_id);
            }
        }
    });
    $('#'+begin).datebox({
        label:'*开始时间：',editable:false,labelAlign:'right',labelWidth:90,width:'98%'
    }).datebox('setValue', danceGetDate());
    $('#'+end).datebox({
        label:'结束时间：', editable:false,labelAlign:'right',labelWidth:90,width:'98%'
    });

    function ajaxRequest(){
        $.ajax({
            method: 'POST',
            url: '/dance_course_single_get',
            async: true,
            dataType: 'json',
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify({id: uuid })
        }).done(function(data) {
            console.log('ajaxRequest', data);
            if(data.errorCode == 0)
            {
                $('#'+noId).textbox('setValue', data.row.code);
                $('#'+name).textbox('setValue', data.row.name);
                $('#'+school).combobox('setValue', data.row.school_id);
                $('#'+begin).datebox('setValue', data.row.begin);
                $('#'+end).datebox('setValue', data.row.end);

                $('#'+uid).val(data.row.id);
            }else {
                $.messager.alert('提示', data.msg, 'info');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.messager.alert('提示', "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown), 'info');
        });
    }


    function save() {
        if (!validate()) {
            return;
        }

        var course = packet();
        console.log('send:', course);
        $.ajax({
            method: 'POST',
            url: '/dance_course_modify',
            async: true,
            dataType: 'json',
            data: {data: JSON.stringify({row: course})}
        }).done(function(data) {
            $.messager.alert('提示', data.msg, 'info');
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.messager.alert('提示', "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown), 'info');
        });
    }

    function validate() {
        var courseName = $('#'+name).textbox('getValue');
        if(!courseName || courseName.length > 20) {
            $.messager.alert({title:'提示', msg:'课程表名称不能为空，且不能大于20字符！', icon: 'info',
                fn:function () {
                    $('#'+name).textbox('textbox').focus();
                }
            });
            return false;
        }

        return true;
    }

    function packet() {
        var data = {};
        data.id = $('#'+uid).val();
        data.name = $('#'+name).textbox('getValue');
        data.school_id = $('#'+school).combobox('getValue');
        data.begin = $('#'+begin).datebox('getValue');
        data.end = $('#'+end).datebox('getValue');
        return data;
    }

}
