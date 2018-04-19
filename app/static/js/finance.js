/**
 * Created by WXG on 2018/04/08.
 * 左侧功能导航 财务管理 入口函数
 */

/**
 * ---Tab 页面---      ---入口函数---
 * 其他支出            danceAddTabExpense
 * 其他收入            danceAddTabIncome
 * 房租                danceAddTabHouseRent
 */


'use strict';

//**********************************************************************************************************************
// 其他收入 begin
/**
 * 添加或者打开  其他收入 Tab页
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabIncome(title, tableId, condition) {
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

        var module = 'income';
        var url = '/'+module;
        var opts = {
            queryText: '查询条件：',
            queryPrompt: '付款人 或 备注查找',
            who: module,
            danceModuleName:module,
            danceModuleTitle: title,          // 导入、导出 窗口 title
            addEditFunc: addEditIncome,
            page: '',     // 上述函数的参数
            tableId: tableId,
            url: url,
            query: false,       // 搜索框，不用实现自动完成功能。
            title: title,
            columns: [[
                {field: 'ck', checkbox:true },   // checkbox
                {field: 'code', title: '收入单号', width: 90, align: 'center'},
                {field: 'date', title: '收入日期', width: 60, align: 'center'},
                {field: 'school_no', title: '分校编号', width: 50, align: 'center'},
                {field: 'school_name', title: '分校名称', width: 95, align: 'center'},
                {field: 'type_text', title: '收入类别', width: 60, align: 'center'},
                {field: 'payer', title: '付款人', width: 100, align: 'center'},
                {field: 'cost', title: '收入金额', width: 80, align: 'center'},
                {field: 'fee_mode_text', title: '支付方式', width: 60, align: 'center'},
                {field: 'paper_receipt', title: '收据号', width: 60, align: 'center'},
                {field: 'remark', title: '备注', width: 100, align: 'center'},
                {field: 'recorder', title: '录入员', width: 70, align: 'center'}
            ]]
        };

        danceCreateCommDatagrid(tableId, url, condition, opts);
    }
}


/**
 * 查看/新增  其他收入 单
 * @param condition     查询条件：
 *         school_id     分校id，取值范围： all  or 具体分校id
 * @param uid           记录id，新增时，可以不传递此参数。
 * @param options       可选参数
 *      {
 *          tableId:    表格id，新增/修改 其他收入 单 后，需要更新的表格
 *      }
 */
function addEditIncome(condition, uid, options) {
    var title = '编辑/查看 ' + options.title;
    uid = uid || 0;     // 第一次进入 详细信息页面 uid 有效，上下翻页时，无法提前获取上下记录的 id(uid)
    if (uid <= 0) {
        title = '新增 ' + options.title
    }

    options.condition = condition;
    if (uid <=0) {
        dcOpenDialogNewIncome('dlg-id-new-income', title, 0, 'icon-save', options);
    }else {
        dcOpenDialogNewIncome('dlg-id-chg-income', title, uid, 'icon-save', options);
    }
}


/**
 * 打开 新增 或者 编辑/查看 其他收入 单 窗口
 * @param id        dialog id
 * @param title     dialog 标题
 * @param uuid      记录id，新增时 可以不填或者填写 <=0 ，修改记录时，必须填写记录的 ID
 * @param icon
 * @param options       扩展参数
 * {
 *      condition:      查询条件
 *      tableId:        本窗口 关闭后，要更新的 表格 id。
 * }
 */
function dcOpenDialogNewIncome(id, title, uuid, icon, options){

    var d_code = 'd_code'+id;       // d for dialog
    var d_date = 'd_date'+id;
    var d_recorder = 'd_recorder'+id;
    var d_school_no = 'd_school_no'+id;
    var d_school_name = 'd_school_name'+id;
    var d_type_text = 'd_type_text'+id;
    var d_fee_mode_text = 'd_fee_mode_text'+id;
    var d_cost = 'd_cost'+id;
    var d_payer = 'd_payer'+id;
    var d_remark = 'd_remark'+id;
    var d_paper_receipt = 'd_paper_receipt' + id;
    var uid = 'expenseUUID'+id;
    options = options || {};
    var dgId = options.tableId;

    if (document.getElementById(id)) {
        if(uuid > 0)
            ajaxRequest();
        else
            $.messager.alert('提示', '[' + title + ']窗口已打开！', 'info');
        return;
    }
    $('body').append('<div id=' + id + ' style="padding:5px"></div>');

    var ctrls = '<div class="easyui-panel" data-options="fit:true" style="padding:10px;">';
    ctrls += '<input id='+d_code+'><input id='+d_date+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_school_no+'><input id='+d_school_name+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_type_text+'><input id='+d_fee_mode_text+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_cost+'><input id='+d_recorder+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_payer+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_paper_receipt+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_remark+'>';

    ctrls += '<input id=' + uid + ' type="hidden" value="0" />';
    ctrls += '</div>';

    $("#"+id).dialog({
        title:title,width:600,height:360,cache: false,iconCls:icon,content:ctrls,
        collapsible: false, minimizable:false,maximizable: true, resizable: false,modal:false,closed:true,
        buttons: [{text:'保存',iconCls:'icon-ok',width:80,height:30,handler:save },
            {text:'关闭',iconCls:'icon-cancel',width:80,height:30,handler:function(){ $("#"+id).dialog('close'); }}],
        onOpen:function () {
            console.log('onOpen');
            $('#'+d_code).textbox({
                label:'收入单号：',labelAlign:'right',labelWidth:100,width:'48%',prompt:'自动生成',disabled:true
            });
            $('#'+d_date).datebox({
                label:'收入日期*：',labelAlign:'right',labelWidth:100,width:'48%'
            }).datebox('setValue', danceGetDate());

            $('#'+d_school_no).textbox({
                label:'分校编号*：',labelAlign:'right',labelWidth:100,prompt:'关联分校名称',disabled:true,width:'48%'
            });
            $('#'+d_school_name).combobox({
                label:'分校名称*：',labelAlign:'right',labelWidth:100,
                valueField:'school_id', textField:'school_name',editable:false,panelHeight:'auto',width:'48%',
                url: '/api/dance_school_get',
                onLoadSuccess: function () {
                    var data = $(this).combobox('getData');
                    if(data.length){
                        var school_id = null; var idx = 0;
                        if ('school_id' in options.condition) {
                            school_id = options.condition['school_id'];
                        }
                        if (school_id != 'all') {
                            for (var m=0; m<data.length; m++) {
                                if (data[m].school_id == school_id) {
                                    idx = m;
                                    break;
                                }
                            }
                        }
                        $('#'+d_school_name).combobox('setValue', data[idx].school_id);
                        $('#'+d_school_no).textbox('setValue', data[idx]['school_no']);
                    }
                },
                onSelect:function (record) {
                    $('#'+d_school_no).textbox('setValue', record['school_no']);
                }
            });

            $('#'+d_type_text).combobox({
                label:'收入类别*：',labelAlign:'right',labelWidth:100,width:'48%',editable:false,
                valueField: 'id',textField: 'text', panelHeight:'auto',
                iconWidth:22,
                icons: [{
                    iconCls:'icon-add', handler: function () {
                        dcDialogIncomeType({ id: 'dlg-id-new-income-type',
                            url:'', title:'新增 收入类别',
                            icon: 'icon-save',
                            callback: function () {
                                if(document.getElementById(id)) {    // 窗口未被关闭
                                    $('#'+d_type_text).combobox('reload');
                                }
                            }
                        });
                    }
                }],
                queryParams: {type: 8},     // 收入类别
                url: '/api/dc_common_get'
            });
            $('#'+d_fee_mode_text).combobox({
                label:'支付方式*：',labelAlign:'right',labelWidth:100,width:'48%',editable:false,
                valueField: 'fee_mode_id',textField: 'fee_mode', panelHeight:'auto',
                iconWidth:22,
                icons: [{
                    iconCls:'icon-add', handler: function () {
                        dcNewWindowFinal({
                            url:'/static/html/_add_fee_mode.html', title:'新增 收费方式',
                            winId: 'dcFeeModeNewWin', panelId: 'dcFeeModeNewPanel',
                            callback: function () {
                                if(document.getElementById(id)) {    // 窗口未被关闭
                                    $('#'+d_fee_mode_text).combobox('reload');
                                }
                            }
                        });
                    }
                }],
                url: '/api/dance_fee_mode_get'
            });


            $('#'+d_cost).textbox({
                label:'收入金额*：',labelAlign:'right',labelWidth:100,width:'48%'
            });
            $('#'+d_recorder).textbox({
                label:'录入员：',labelAlign:'right',labelWidth:100,width:'48%',prompt:'自动生成',disabled:true
            });

            $('#'+d_payer).textbox({
                label:'付款人*：',labelAlign:'right',labelWidth:100,width:'96%'
            });

            $('#'+d_paper_receipt).textbox({
                label:'收据号：',labelAlign:'right',labelWidth:100,width:'96%'
            });

            $('#'+d_remark).textbox({
                label:'备注：',labelAlign:'right',multiline:true,labelWidth:100,width:'96%', height:85
            });

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


    function ajaxRequest(){
        // 发送数据
        $.ajax({
            method: 'POST',
            url: options.url + '_detail_get',
            async: true,
            dataType: 'json',
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify({id: uuid })
        }).done(function(data) {
            console.log('ajaxRequest', data);
            if(data.errorCode == 0)
            {
                $('#'+d_code).textbox('setValue', data.row['code']);
                $('#'+d_school_name).combobox('setText', data.row.school_name)
                    .combobox('setValue', data.row.school_id).combobox('disable');
                $('#'+d_school_no).textbox('setValue', data.row['school_no']);
                $('#'+d_date).datebox('setValue', data.row['date']);
                $('#'+d_type_text).combobox('setValue', data.row['type_id']);
                $('#'+d_fee_mode_text).combobox('setValue', data.row['fee_mode_id']);
                $('#'+d_cost).textbox('setValue', data.row['cost']);
                $('#'+d_recorder).textbox('setValue', data.row['recorder']);
                $('#'+d_payer).textbox('setValue', data.row['payer']);
                $('#'+d_remark).textbox('setValue', data.row['remark']);
                $('#'+d_paper_receipt).textbox('setValue', data.row['paper_receipt']);

                $('#'+uid).val(data.row.id);
            }else {
                $.messager.alert('提示', data.msg, 'info');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.messager.alert('提示', "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown), 'info');
        });
    }

    function save() {

        // 校验数据是否合法     其他收入

        var payer = $('#'+d_payer).textbox('getValue');
        if(!payer || payer.length > 20) {
            $.messager.alert({title:'提示', msg:'“付款人”不能为空，且不能大于20字符！', icon: 'info',
                fn:function () {
                    $('#'+d_payer).textbox('textbox').focus();
                }
            });
            return false;
        }

        var remark = $('#'+d_remark).textbox('getValue');
        if(remark.length > 40) {
            $.messager.alert({title:'提示', msg:'备注不能大于40字符！', icon: 'info',
                fn:function () {
                    $('#'+d_remark).textbox('textbox').focus();
                }
            });
            return false;
        }

        var cost = $('#'+d_cost).textbox('getValue');
        var type_id = $('#'+d_type_text).combobox('getValue');
        if(!type_id) {
            $.messager.alert({title:'提示', msg:'请选择“收入类别”！', icon: 'info',
                fn:function () {
                    $('#'+d_type_text).textbox('textbox').focus();
                }
            });
            return false;
        }

        var fee_mode_id = $('#'+d_fee_mode_text).combobox('getValue');
        if(!fee_mode_id) {
            $.messager.alert({title:'提示', msg:'请选择“支付方式”！', icon: 'info',
                fn:function () {
                    $('#'+d_fee_mode_text).textbox('textbox').focus();
                }
            });
            return false;
        }

        var paper_receipt = $('#'+d_paper_receipt).textbox('getValue');
        if(paper_receipt.length > 15) {
            $.messager.alert({title:'提示', msg:'“收据号”不能大于15字符！', icon: 'info',
                fn:function () {
                    $('#'+d_paper_receipt).textbox('textbox').focus();
                }
            });
            return false;
        }

        // 打包数据
        var data = {id: $('#'+uid).val(),
            payer: payer,
            date: $('#'+d_date).datebox('getValue'),
            cost: cost,
            type_id: type_id,
            fee_mode_id: fee_mode_id,
            remark:remark,
            paper_receipt:paper_receipt,
            school_id:$('#'+d_school_name).combobox('getValue')
        };
        console.log('send:', data);

        // 发送数据
        $.ajax({
            method: 'POST',
            url: options.url + '_modify',
            async: true,
            dataType: 'json',
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(data)
        }).done(function(data) {
            $.messager.alert('提示', data.msg, 'info');
            if (dgId && document.getElementById(dgId)) {
                $('#'+dgId).datagrid('reload');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.messager.alert('提示', "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown), 'info');
        });
    }
}

// 其他收入 end
//**********************************************************************************************************************


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 其他支出 begin

/**
 * 添加或者打开  其他支出 Tab页
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabExpense(title, tableId, condition) {
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

        var module = 'expense';
        var url = '/'+module;
        var opts = {
            queryText: '查询条件：',
            queryPrompt: '收款人 或 备注查找',
            who: module,
            danceModuleName:module,
            danceModuleTitle: title,          // 导入、导出 窗口 title
            addEditFunc: addEditExpense,
            page: '',     // 上述函数的参数
            tableId: tableId,
            url: url,
            query: false,       // 搜索框，不用实现自动完成功能。
            title: title,
            columns: [[
                {field: 'ck', checkbox:true },   // checkbox
                {field: 'code', title: '支出单号', width: 90, align: 'center'},
                {field: 'date', title: '支出日期', width: 60, align: 'center'},
                {field: 'school_no', title: '分校编号', width: 50, align: 'center'},
                {field: 'school_name', title: '分校名称', width: 95, align: 'center'},
                {field: 'type_text', title: '支出类别', width: 80, align: 'center'},
                {field: 'payee', title: '收款人', width: 100, align: 'center'},
                {field: 'cost', title: '支出金额', width: 80, align: 'center'},
                {field: 'fee_mode_text', title: '支付方式', width: 80, align: 'center'},
                {field: 'remark', title: '备注', width: 100, align: 'center'},
                {field: 'recorder', title: '录入员', width: 70, align: 'center'}
            ]]
        };

        danceCreateCommDatagrid(tableId, url, condition, opts);
    }
}


/**
 * 查看/新增  其他支出 单
 * @param condition     查询条件：
 *         school_id     分校id，取值范围： all  or 具体分校id
 * @param uid           记录id，新增时，可以不传递此参数。
 * @param options       可选参数
 *      {
 *          tableId:    表格id，新增/修改 其他支出单 后，需要更新的表格
 *      }
 */
function addEditExpense(condition, uid, options) {
    var title = '编辑/查看 ' + options.title;
    uid = uid || 0;     // 第一次进入 详细信息页面 uid 有效，上下翻页时，无法提前获取上下记录的 id(uid)
    if (uid <= 0) {
        title = '新增 ' + options.title
    }

    options.condition = condition;
    if (uid <=0) {
        dcOpenDialogNewExpense('dlg-id-new-expense', title, 0, 'icon-save', options);
    }else {
        dcOpenDialogNewExpense('dlg-id-chg-expense', title, uid, 'icon-save', options);
    }
}


/**
 * 打开 新增 或者 编辑/查看 其他支出单 窗口
 * @param id        dialog id
 * @param title     dialog 标题
 * @param uuid      记录id，新增时 可以不填或者填写 <=0 ，修改记录时，必须填写记录的 ID
 * @param icon
 * @param options       扩展参数
 * {
 *      condition:      查询条件
 *      tableId:        本窗口 关闭后，要更新的 表格 id。
 * }
 */
function dcOpenDialogNewExpense(id, title, uuid, icon, options){

    var d_code = 'd_code'+id;       // d for dialog
    var d_date = 'd_date'+id;
    var d_recorder = 'd_recorder'+id;
    var d_school_no = 'd_school_no'+id;
    var d_school_name = 'd_school_name'+id;
    var d_type_text = 'd_type_text'+id;
    var d_fee_mode_text = 'd_fee_mode_text'+id;
    var d_cost = 'd_cost'+id;
    var d_payee = 'd_payee'+id;
    var d_remark = 'd_remark'+id;
    var uid = 'expenseUUID'+id;
    options = options || {};
    var dgId = options.tableId;

    if (document.getElementById(id)) {
        if(uuid > 0)
            ajaxRequest();
        else
            $.messager.alert('提示', '[' + title + ']窗口已打开！', 'info');
        return;
    }
    $('body').append('<div id=' + id + ' style="padding:5px"></div>');

    var ctrls = '<div class="easyui-panel" data-options="fit:true" style="padding:10px;">';
    ctrls += '<input id='+d_code+'><input id='+d_date+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_school_no+'><input id='+d_school_name+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_type_text+'><input id='+d_fee_mode_text+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_cost+'><input id='+d_recorder+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_payee+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_remark+'>';

    ctrls += '<input id=' + uid + ' type="hidden" value="0" />';
    ctrls += '</div>';

    $("#"+id).dialog({
        title:title,width:600,height:360,cache: false,iconCls:icon,content:ctrls,
        collapsible: false, minimizable:false,maximizable: true, resizable: false,modal:false,closed:true,
        buttons: [{text:'保存',iconCls:'icon-ok',width:80,height:30,handler:save },
            {text:'关闭',iconCls:'icon-cancel',width:80,height:30,handler:function(){ $("#"+id).dialog('close'); }}],
        onOpen:function () {
            console.log('onOpen');
            $('#'+d_code).textbox({
                label:'支出单号：',labelAlign:'right',labelWidth:100,width:'48%',prompt:'自动生成',disabled:true
            });
            $('#'+d_date).datebox({
                label:'支出日期*：',labelAlign:'right',labelWidth:100,width:'48%'
            }).datebox('setValue', danceGetDate());

            $('#'+d_school_no).textbox({
                label:'分校编号*：',labelAlign:'right',labelWidth:100,prompt:'关联分校名称',disabled:true,width:'48%'
            });
            $('#'+d_school_name).combobox({
                label:'分校名称*：',labelAlign:'right',labelWidth:100,
                valueField:'school_id', textField:'school_name',editable:false,panelHeight:'auto',width:'48%',
                url: '/api/dance_school_get',
                onLoadSuccess: function () {
                    var data = $(this).combobox('getData');
                    if(data.length){
                        var school_id = null; var idx = 0;
                        if ('school_id' in options.condition) {
                            school_id = options.condition['school_id'];
                        }
                        if (school_id != 'all') {
                            for (var m=0; m<data.length; m++) {
                                if (data[m].school_id == school_id) {
                                    idx = m;
                                    break;
                                }
                            }
                        }
                        $('#'+d_school_name).combobox('setValue', data[idx].school_id);
                        $('#'+d_school_no).textbox('setValue', data[idx]['school_no']);
                    }
                },
                onSelect:function (record) {
                    $('#'+d_school_no).textbox('setValue', record['school_no']);
                }
            });

            $('#'+d_type_text).combobox({
                label:'支出类别*：',labelAlign:'right',labelWidth:100,width:'48%',editable:false,
                valueField: 'id',textField: 'text', panelHeight:'auto',
                iconWidth:22,
                icons: [{
                    iconCls:'icon-add', handler: function () {
                        dcDialogExpenseType({ id: 'dlg-id-new-expense-type',
                            url:'', title:'新增 支出类别',
                            icon: 'icon-save',
                            callback: function () {
                                if(document.getElementById(id)) {    // 窗口未被关闭
                                    $('#'+d_type_text).combobox('reload');
                                }
                            }
                        });
                    }
                }],
                queryParams: {type: 7},
                url: '/api/dc_common_get'
            });
            $('#'+d_fee_mode_text).combobox({
                label:'支付方式*：',labelAlign:'right',labelWidth:100,width:'48%',editable:false,
                valueField: 'fee_mode_id',textField: 'fee_mode', panelHeight:'auto',
                iconWidth:22,
                icons: [{
                    iconCls:'icon-add', handler: function () {
                        dcNewWindowFinal({
                            url:'/static/html/_add_fee_mode.html', title:'新增 收费方式',
                            winId: 'dcFeeModeNewWin', panelId: 'dcFeeModeNewPanel',
                            callback: function () {
                                if(document.getElementById(id)) {    // 窗口未被关闭
                                    $('#'+d_fee_mode_text).combobox('reload');
                                }
                            }
                        });
                    }
                }],
                url: '/api/dance_fee_mode_get'
            });


            $('#'+d_cost).textbox({
                label:'支出金额*：',labelAlign:'right',labelWidth:100,width:'48%'
            });
            $('#'+d_recorder).textbox({
                label:'录入员：',labelAlign:'right',labelWidth:100,width:'48%',prompt:'自动生成',disabled:true
            });

            $('#'+d_payee).textbox({
                label:'收款人*：',labelAlign:'right',labelWidth:100,width:'96%'
            });

            $('#'+d_remark).textbox({
                label:'备注：',labelAlign:'right',multiline:true,labelWidth:100,width:'96%', height:110
            });

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


    function ajaxRequest(){
        // 发送数据
        $.ajax({
            method: 'POST',
            url: options.url + '_detail_get',
            async: true,
            dataType: 'json',
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify({id: uuid })
        }).done(function(data) {
            console.log('ajaxRequest', data);
            if(data.errorCode == 0)
            {
                $('#'+d_code).textbox('setValue', data.row['code']);
                $('#'+d_school_name).combobox('setText', data.row.school_name)
                    .combobox('setValue', data.row.school_id).combobox('disable');
                $('#'+d_school_no).textbox('setValue', data.row['school_no']);
                $('#'+d_date).datebox('setValue', data.row['date']);
                $('#'+d_type_text).combobox('setValue', data.row['type_id']);
                $('#'+d_fee_mode_text).combobox('setValue', data.row['fee_mode_id']);
                $('#'+d_cost).textbox('setValue', data.row['cost']);
                $('#'+d_recorder).textbox('setValue', data.row['recorder']);
                $('#'+d_payee).textbox('setValue', data.row['payee']);
                $('#'+d_remark).textbox('setValue', data.row['remark']);

                $('#'+uid).val(data.row.id);
            }else {
                $.messager.alert('提示', data.msg, 'info');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.messager.alert('提示', "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown), 'info');
        });
    }

    function save() {

        // 校验数据是否合法     其他支出

        var payee = $('#'+d_payee).textbox('getValue');
        if(!payee || payee.length > 20) {
            $.messager.alert({title:'提示', msg:'“收款人”不能为空，且不能大于20字符！', icon: 'info',
                fn:function () {
                    $('#'+d_payee).textbox('textbox').focus();
                }
            });
            return false;
        }

        var remark = $('#'+d_remark).textbox('getValue');
        if(remark.length > 40) {
            $.messager.alert({title:'提示', msg:'备注不能大于40字符！', icon: 'info',
                fn:function () {
                    $('#'+d_remark).textbox('textbox').focus();
                }
            });
            return false;
        }

        var cost = $('#'+d_cost).textbox('getValue');
        var type_id = $('#'+d_type_text).combobox('getValue');
        if(!type_id) {
            $.messager.alert({title:'提示', msg:'请选择“支出类别”！', icon: 'info',
                fn:function () {
                    $('#'+d_type_text).textbox('textbox').focus();
                }
            });
            return false;
        }

        var fee_mode_id = $('#'+d_fee_mode_text).combobox('getValue');
        if(!fee_mode_id) {
            $.messager.alert({title:'提示', msg:'请选择“支付方式”！', icon: 'info',
                fn:function () {
                    $('#'+d_fee_mode_text).textbox('textbox').focus();
                }
            });
            return false;
        }

        // 打包数据
        var data = {id: $('#'+uid).val(),
            payee: payee,
            date: $('#'+d_date).datebox('getValue'),
            cost: cost,
            type_id: type_id,
            fee_mode_id: fee_mode_id,
            remark:remark,
            school_id:$('#'+d_school_name).combobox('getValue')
        };
        console.log('send:', data);

        // 发送数据
        $.ajax({
            method: 'POST',
            url: options.url + '_modify',
            async: true,
            dataType: 'json',
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(data)
        }).done(function(data) {
            $.messager.alert('提示', data.msg, 'info');
            if (dgId && document.getElementById(dgId)) {
                $('#'+dgId).datagrid('reload');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.messager.alert('提示', "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown), 'info');
        });
    }
}

// 其他支出 end
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//----------------------------------------------------------------------------------------------------------------------
// 房租 begin

/**
 * 添加或者打开  房租 Tab页
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabHouseRent(title, tableId, condition) {
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

        var module = 'house_rent';
        var url = '/'+module;
        var opts = {
            queryText: '查询条件：',
            queryPrompt: '收款人 或 备注查找',
            who: module,
            danceModuleName:module,
            danceModuleTitle: title,          // 导入、导出 窗口 title
            addEditFunc: addEditHouseRent,
            page: '',     // 上述函数的参数
            tableId: tableId,
            url: url,
            query: false,       // 搜索框，不用实现自动完成功能。
            title: title,
            columns: [[
                {field: 'ck', checkbox:true },   // checkbox
                {field: 'code', title: '房租单号', width: 90, align: 'center'},
                {field: 'date', title: '交纳日期', width: 60, align: 'center'},
                {field: 'school_no', title: '分校编号', width: 50, align: 'center'},
                {field: 'school_name', title: '分校名称', width: 95, align: 'center'},
                {field: 'payee', title: '收款人', width: 100, align: 'center'},
                {field: 'cost', title: '租金金额', width: 80, align: 'center'},
                {field: 'begin_month', title: '开始月份', width: 80, align: 'center'},
                {field: 'month_num', title: '月数', width: 40, align: 'center'},
                {field: 'fee_mode_text', title: '支付方式', width: 80, align: 'center'},
                {field: 'remark', title: '备注', width: 100, align: 'center'},
                {field: 'recorder', title: '录入员', width: 70, align: 'center'}
            ]]
        };

        danceCreateCommDatagrid(tableId, url, condition, opts);
    }
}


/**
 * 查看/新增  房租
 * @param condition     查询条件：
 *         school_id     分校id，取值范围： all  or 具体分校id
 * @param uid           记录id，新增时，可以不传递此参数。
 * @param options       可选参数
 *      {
 *          tableId:    表格id，新增/修改 房租 后，需要更新的表格
 *      }
 */
function addEditHouseRent(condition, uid, options) {
    var title = '编辑/查看 ' + options.title;
    uid = uid || 0;     // 第一次进入 详细信息页面 uid 有效，上下翻页时，无法提前获取上下记录的 id(uid)
    if (uid <= 0) {
        title = '新增 ' + options.title
    }

    options.condition = condition;
    if (uid <=0) {
        dcOpenDialogNewHouseRent('dlg-id-new-house_rent', title, 0, 'icon-save', options);
    }else {
        dcOpenDialogNewHouseRent('dlg-id-chg-house_rent', title, uid, 'icon-save', options);
    }
}


/**
 * 打开 新增 或者 编辑/查看 房租 窗口
 * @param id        dialog id
 * @param title     dialog 标题
 * @param uuid      记录id，新增时 可以不填或者填写 <=0 ，修改记录时，必须填写记录的 ID
 * @param icon
 * @param options       扩展参数
 * {
 *      condition:      查询条件
 *      tableId:        本窗口 关闭后，要更新的 表格 id。
 * }
 */
function dcOpenDialogNewHouseRent(id, title, uuid, icon, options){

    var d_code = 'd_code'+id;       // d for dialog
    var d_date = 'd_date'+id;
    var d_recorder = 'd_recorder'+id;
    var d_school_no = 'd_school_no'+id;
    var d_school_name = 'd_school_name'+id;
    var d_begin_month = 'd_begin_month'+id;
    var d_month_num = 'd_month_num'+id;
    var d_fee_mode_text = 'd_fee_mode_text'+id;
    var d_cost = 'd_cost'+id;
    var d_payee = 'd_payee'+id;
    var d_remark = 'd_remark'+id;
    var uid = 'houseRentUUID'+id;
    options = options || {};
    var dgId = options.tableId;

    if (document.getElementById(id)) {
        if(uuid > 0)
            ajaxRequest();
        else
            $.messager.alert('提示', '[' + title + ']窗口已打开！', 'info');
        return;
    }
    $('body').append('<div id=' + id + ' style="padding:5px"></div>');

    var ctrls = '<div class="easyui-panel" data-options="fit:true" style="padding:10px;">';
    ctrls += '<input id='+d_code+'><input id='+d_date+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_school_no+'><input id='+d_school_name+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_cost+'><input id='+d_fee_mode_text+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_begin_month+'><input id='+d_month_num+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_payee+'><input id='+d_recorder+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_remark+'>';

    ctrls += '<input id=' + uid + ' type="hidden" value="0" />';
    ctrls += '</div>';

    $("#"+id).dialog({
        title:title,width:600,height:360,cache: false,iconCls:icon,content:ctrls,
        collapsible: false, minimizable:false,maximizable: true, resizable: false,modal:false,closed:true,
        buttons: [{text:'保存',iconCls:'icon-ok',width:80,height:30,handler:save },
            {text:'关闭',iconCls:'icon-cancel',width:80,height:30,handler:function(){ $("#"+id).dialog('close'); }}],
        onOpen:function () {
            console.log('onOpen');
            $('#'+d_code).textbox({
                label:'房租单号：',labelAlign:'right',labelWidth:100,width:'48%',prompt:'自动生成',disabled:true
            });
            $('#'+d_date).datebox({
                label:'交纳日期*：',labelAlign:'right',labelWidth:100,width:'48%'
            }).datebox('setValue', danceGetDate());

            $('#'+d_school_no).textbox({
                label:'分校编号*：',labelAlign:'right',labelWidth:100,prompt:'关联分校名称',disabled:true,width:'48%'
            });
            $('#'+d_school_name).combobox({
                label:'分校名称*：',labelAlign:'right',labelWidth:100,
                valueField:'school_id', textField:'school_name',editable:false,panelHeight:'auto',width:'48%',
                url: '/api/dance_school_get',
                onLoadSuccess: function () {
                    var data = $(this).combobox('getData');
                    if(data.length){
                        var school_id = null; var idx = 0;
                        if ('school_id' in options.condition) {
                            school_id = options.condition['school_id'];
                        }
                        if (school_id != 'all') {
                            for (var m=0; m<data.length; m++) {
                                if (data[m].school_id == school_id) {
                                    idx = m;
                                    break;
                                }
                            }
                        }
                        $('#'+d_school_name).combobox('setValue', data[idx].school_id);
                        $('#'+d_school_no).textbox('setValue', data[idx]['school_no']);
                    }
                },
                onSelect:function (record) {
                    $('#'+d_school_no).textbox('setValue', record['school_no']);
                }
            });


            $('#'+d_cost).textbox({
                label:'房租金额*：',labelAlign:'right',labelWidth:100,width:'48%'
            });
            $('#'+d_fee_mode_text).combobox({
                label:'支付方式*：',labelAlign:'right',labelWidth:100,width:'48%',editable:false,
                valueField: 'fee_mode_id',textField: 'fee_mode', panelHeight:'auto',
                iconWidth:22,
                icons: [{
                    iconCls:'icon-add', handler: function () {
                        dcNewWindowFinal({
                            url:'/static/html/_add_fee_mode.html', title:'新增 收费方式',
                            winId: 'dcFeeModeNewWin', panelId: 'dcFeeModeNewPanel',
                            callback: function () {
                                if(document.getElementById(id)) {    // 窗口未被关闭
                                    $('#'+d_fee_mode_text).combobox('reload');
                                }
                            }
                        });
                    }
                }],
                url: '/api/dance_fee_mode_get'
            });

            var oBeginMonth = $('#'+d_begin_month);
            oBeginMonth.datebox({
                label:'开始月份*：',labelAlign:'right',labelWidth:100,width:'48%'
            });
            dcDatebox(oBeginMonth, null);
            oBeginMonth.datebox('setValue', danceGetDate());
            
            $('#'+d_month_num).textbox({
                label:'月数*：',labelAlign:'right',labelWidth:100,width:'48%'
            }).textbox('setValue', 1);

            $('#'+d_payee).textbox({
                label:'收款人*：',labelAlign:'right',labelWidth:100,width:'48%'
            });
            $('#'+d_recorder).textbox({
                label:'录入员：',labelAlign:'right',labelWidth:100,width:'48%',prompt:'自动生成',disabled:true
            });

            $('#'+d_remark).textbox({
                label:'备注：',labelAlign:'right',multiline:true,labelWidth:100,width:'96%', height:110
            });

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


    function ajaxRequest(){
        // 发送数据
        $.ajax({
            method: 'POST',
            url: options.url + '_detail_get',
            async: true,
            dataType: 'json',
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify({id: uuid })
        }).done(function(data) {
            console.log('ajaxRequest', data);
            if(data.errorCode == 0)
            {
                $('#'+d_code).textbox('setValue', data.row['code']);
                $('#'+d_school_name).combobox('setText', data.row.school_name)
                    .combobox('setValue', data.row.school_id).combobox('disable');
                $('#'+d_school_no).textbox('setValue', data.row['school_no']);
                $('#'+d_date).datebox('setValue', data.row['date']);
                $('#'+d_begin_month).datebox('setValue', data.row['begin_month']);
                $('#'+d_month_num).textbox('setValue', data.row['month_num']);
                $('#'+d_fee_mode_text).combobox('setValue', data.row['fee_mode_id']);
                $('#'+d_cost).textbox('setValue', data.row['cost']);
                $('#'+d_recorder).textbox('setValue', data.row['recorder']);
                $('#'+d_payee).textbox('setValue', data.row['payee']);
                $('#'+d_remark).textbox('setValue', data.row['remark']);

                $('#'+uid).val(data.row.id);
            }else {
                $.messager.alert('提示', data.msg, 'info');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.messager.alert('提示', "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown), 'info');
        });
    }

    function save() {

        // 校验数据是否合法     房租

        var payee = $('#'+d_payee).textbox('getValue');
        if(!payee || payee.length > 20) {
            $.messager.alert({title:'提示', msg:'“收款人”不能为空，且不能大于20字符！', icon: 'info',
                fn:function () {
                    $('#'+d_payee).textbox('textbox').focus();
                }
            });
            return false;
        }

        var remark = $('#'+d_remark).textbox('getValue');
        if(remark.length > 400) {
            $.messager.alert({title:'提示', msg:'备注不能大于400字符！', icon: 'info',
                fn:function () {
                    $('#'+d_remark).textbox('textbox').focus();
                }
            });
            return false;
        }

        var cost = $('#'+d_cost).textbox('getValue');

        var fee_mode_id = $('#'+d_fee_mode_text).combobox('getValue');
        if(!fee_mode_id) {
            $.messager.alert({title:'提示', msg:'请选择“支付方式”！', icon: 'info',
                fn:function () {
                    $('#'+d_fee_mode_text).textbox('textbox').focus();
                }
            });
            return false;
        }

        // 打包数据
        var data = {id: $('#'+uid).val(),
            payee: payee,
            date: $('#'+d_date).datebox('getValue'),
            cost: cost,
            begin_month: $('#'+d_begin_month).datebox('getValue'),
            month_num: $('#'+d_month_num).textbox('getValue'),
            fee_mode_id: fee_mode_id,
            remark:remark,
            school_id:$('#'+d_school_name).combobox('getValue')
        };
        console.log('send:', data);

        // 发送数据
        $.ajax({
            method: 'POST',
            url: options.url + '_modify',
            async: true,
            dataType: 'json',
            contentType: "application/json;charset=UTF-8",
            data: JSON.stringify(data)
        }).done(function(data) {
            $.messager.alert('提示', data.msg, 'info');
            if (dgId && document.getElementById(dgId)) {
                $('#'+dgId).datagrid('reload');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.messager.alert('提示', "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown), 'info');
        });
    }
}

// 房租 end
//----------------------------------------------------------------------------------------------------------------------
