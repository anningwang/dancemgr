/**
 * Created by Administrator on 2017/10/13.
 */

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
        var content = '<div id=div-'+tableId+' style="min-width:1024px;width:100%;height:100%">';
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
            'queryText': '姓名：',
            'queryPrompt': '姓名拼音首字母查找',
            'who': module,
            'danceModuleName':module,
            'addEditFunc': danceTeacherDetailInfo,
            'page': '/static/html/_teacher_details.html',     // 上述函数的参数
            'columns': [[
                {field: 'time', title: '时间', width: 80, align: 'center'},
                {field: 'w1', title: '周一', width: 150, align: 'center'},
                {field: 'w2', title: '周二', width: 150, align: 'center'},
                {field: 'w3', title: '周三', width: 150, align: 'center'},
                {field: 'w4', title: '周四', width: 150, align: 'center'},
                {field: 'w5', title: '周五', width: 150, align: 'center'},
                {field: 'w6', title: '周六', width: 150, align: 'center'},
                {field: 'w7', title: '周天', width: 150, align: 'center'}
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

    var dance_condition = '';               // 主datagrid表查询条件
    var WIN_TOP = 25;

    $(dg).datagrid({
        // title: '学员列表',
        iconCls: 'icon-a_detail',
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
                dcOpenDialogNewCourse('dc-add-course', '增加课程表', 'div-'+datagridId )
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
            {iconCls:'icon-remove', text:"删除",  handler:doDel}, '-',
            {text: options.queryText + '<input id=' + ccId + '>'},
            {iconCls: 'icon-search', text:"查询", handler: function () {
                var cond = {};
                $.extend(cond, $(dg).datagrid('options').queryParams);
                cond['name'] = dance_condition;
                $(dg).datagrid('load', cond);
            }}, '-',
            {text: '<input id=' + sbId + '>'}
        ],
        columns: options.columns,
        onDblClickCell: function (index) {
            var rows = $(dg).datagrid('getRows');
            var row = rows[index];
            var cond = $(dg).datagrid('options').queryParams;
            options.addEditFunc(options.page, url, cond, row.id);
        },
        onLoadSuccess:function () {
            //getDgCellCoord(dg, 0, 'time');
            //getDgCellCoord(dg, 0, 'w1');
            //getDgCellCoord(dg, 1, 'w1');
        },
        onResize:function (width, height) {
            var pos = $(pager).position();
            console.log('resize,w=', width,'h=', height, 'pos', pos);
            if(pos) {
                $('#'+divId).height(pos.top - 55 - 2);
            }
            console.log($('#'+divId).height());

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

    autoComplete(dance_condition,'');
    function autoComplete (newValue,oldValue) {
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

    var dcCourse = {};
    // {id: {time: '8:30-10:00', teacher: '李老师', room: '舞蹈1室', className: '17上美术', class_id: 12}};

    /**
     * 打开 新增 课程表 单项 窗口
     * @param parent        窗口的父节点
     * @param id
     * @param _title
     * @param _width
     * @param _height
     * @param _icon
     */
    function dcOpenDialogNewCourse(id, _title, parent, _width, _height, _icon){
        if (document.getElementById(id)) {
            $.messager.alert('提示', '[' + _title + ']窗口已打开！', 'info');
            return;
        }
        var pId = parent ? '#'+parent : 'body';
        $(pId).append('<div id=' + id + ' style="padding:5px"></div>');

        if (_width == null)
            _width = 360;
        if (_height == null)
            _height = 245;

        var name = 'className'+id;
        var shortName = 'shortName'+id;
        var wk = 'week'+id;
        var teacher = 'courseTeacher'+id;
        var room = 'courseRoom'+id;
        var time = 'courseTime'+id;
        var hours = 'courseHours'+id;

        var ctrls = '<div class="easyui-panel" data-options="fit:true" style="padding:10px;overflow: hidden">';
        ctrls += '<input id='+name+'>';
        ctrls += '<div style="height:3px"></div><input id='+shortName+'><input id='+wk+'>';
        ctrls += '<div style="height:3px"></div><input id='+teacher+'>';
        ctrls += '<div style="height:3px"></div><input id='+room+'>';
        ctrls += '<div style="height:3px"></div><input id='+time+'><input id='+hours+'>';

        ctrls += '</div>';

        $("#"+id).dialog({
            title:_title,width:_width,height:_height,cache:false,iconCls:_icon,
            content:ctrls,modal:false,closed:true,
            collapsible: false, minimizable:false,maximizable: false, resizable: false, inline:true,
            buttons: [{text:'保存',iconCls:'icon-ok',width:80,height:30,handler:save},
                {text:'关闭',iconCls:'icon-cancel',width:80,height:30,
                    handler:function(){ $("#"+id).dialog('close'); }}],
            onBeforeClose: function () { $("#"+id).dialog('destroy'); }
        }).dialog('open');

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
            ]]
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

        $('#'+teacher).textbox({
            label:'任课老师：',labelAlign:'right',labelWidth:100,width:'98%'
        });

        $('#'+room).textbox({
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

        var _courseId = 100;
        function save() {
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
                if(isNaN(r_minutes)) {
                    $.messager.alert({title:'提示', msg:'请输入分钟数。', icon: 'info',
                        fn:function () {
                            $(ctrlMinutes).textbox('textbox').focus();
                        }
                    });
                    return false;
                }
            }

            var r_Week = $('#'+wk).combobox('getValue');

            var win_h = 85;
            if(r_minutes <= 60)
                win_h = 60;
            else if (r_minutes > 90 && r_minutes <= 120)
                win_h = 115;

            var param = {p: divId, w: 100, h: win_h, teacher:tchName, room: roomText,  // parent
                time: formatTimeSpan(r_h, r_m, r_minutes)
            };
            var winId = 'cid'+_courseId;
            var win = dcOpenCourseWin(winId, ctrlName.combogrid('getText'), param);
            _courseId++;
            dcCourse[winId] = {};
            dcCourse[winId].param = param ;

           // var arr = param.p.split('-');
            //var dg = $('#'+arr[1]);
            var idx = getRowIndexByHM(r_h, r_m);
            var coord = getDgCellCoord(dg, idx,  'w'+r_Week);
            dcCourse[winId].idx = idx;
            dcCourse[winId].field = 'w'+r_Week;
            dcCourse[winId].mintues = r_minutes;

            var left = coord.pos.left + 32;
            var top = coord.pos.top - WIN_TOP;
            $(win).dialog('move',{left:left, top:top});


            /*
             // 打包数据
             var data = [{id: 0,  row: { name: typeName}}];
             console.log('send:', data);

             // 发送数据
             $.ajax({
             method: 'POST',
             url: '/dance_course_update',
             async: true,
             dataType: 'json',
             contentType: "application/json;charset=UTF-8",
             data: JSON.stringify(data)
             }).done(function(data) {
             $.messager.alert('提示', data.msg, 'info');
             }).fail(function(jqXHR, textStatus, errorThrown) {
             $.messager.alert('提示', "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown), 'info');
             });
             */
        }
    }


    function resizeCourse() {
        for(var win in dcCourse){
            if(!dcCourse.hasOwnProperty(win))
                continue;
            var coord = getDgCellCoord(dg, dcCourse[win].idx, dcCourse[win].field);
            $('#'+win).window('move', {left: coord.pos.left + 32, top: coord.pos.top - WIN_TOP});
        }
    }

    // 表格纵向滚动，触发 课程表小窗口 跟着滚动。
    var contents = $('#div-'+datagridId +' div.datagrid-body');
    contents.scroll(function () {
        //console.log('scroll');
        resizeCourse();
    });

}



function dcOpenCourseWin(id, _title, param){
    if (document.getElementById(id)) {
        $.messager.alert('提示', '[' + _title + ']窗口已打开！', 'info');
        return;
    }
    var pId = param.p ? '#'+ param.p : 'body';
    $(pId).append('<div id=' + id + '></div>');
    var name = 'courseName'+id;

    var ctrls = '<div class="easyui-panel" data-options="fit:true" style="padding:2px;">';
    ctrls += '<div id='+name+' ></div>';

    ctrls += '</div>';

    $("#"+id).dialog({
        title:_title,width: param.w ? param.w : 140,
        height: param.h ? param.h : 80,
        cache:false, content:ctrls,modal:false,closed:true,
        collapsible: false, minimizable:false,maximizable: false, resizable: false,
        cls: param.cls ? param.cls : 'c6',
        border:'thin', inline:true,
        onBeforeClose: function () { $("#"+id).dialog('destroy'); },
        onMove:function (left, top) {
            
        }
    }).dialog('open');

    $('#'+name).css({'font-size': '9px', "font-family":"宋体"})
        .append($('<div/>').text(param.time).html())
        .append('<br>'+param.teacher).append('<br>'+param.room);

    return '#'+id;
}


function getRowIndex(beginTm) {     // 时间字符串格式：hh:mm 12:30
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
    var hDf = parseInt(minutesDiff / 60);
    var mDf = minutesDiff % 60;

    m += mDf;
    h += hDf;
    if(m >= 60) {
        m -= 60;
        h++;
    }
    return tmStr + '-' + (h<10?'0'+h:h) + ':' + (m<10?'0'+m:m);
}

