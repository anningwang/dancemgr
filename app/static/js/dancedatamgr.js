
'use strict';

/**
 * 打开 [分校信息] tab标签
 * @param title     Tab的标题
 * @param tableId   Datagrid id,创建在 table 上
 */
function danceAddTabSchool(title, tableId) {
    //console.log(tableId);
    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
    } else {
        //var content = '<table id=' + tableId + '></table>';
        var content = '<div style="min-width:1024px;width:100%;height:100%"><table id=' + tableId + '></table></div>';
        $(parentDiv).tabs('add', {
            title: title,
            content: content,
            closable: true
        });
        
        var module = 'dance_school';
        var opts_school = {
            'defaultSelField' : 'school_name',
            'fieldValidate' : {'school_name': checkNotEmpty},
            'queryText': '分校名称：',
            'queryPrompt': '校名拼音首字母查找',
            'who': 'DanceSchool',
            'danceModuleName': 'DanceSchool',   // 传递给 导入、导出 模块的身份标识
            'danceModuleTitle': title,          // 导入、导出 窗口 title
            'columns': [[
                {field: 'ck', checkbox:true },   // checkbox
                // {field: 'no', title: '序号',  width: 15, align: 'center' },  // 能自动显示行号，则不再需要自己实现
                // {field: 'id', title: 'id',  width: 30, align: 'center' },
                {field: 'school_no', title: '分校编号', width: 100, align: 'center'},
                {field: 'school_name', title: '分校名称*', width: 140, align: 'center', editor: 'textbox'},
                {field: 'address', title: '分校地址', width: 400, align: 'center', editor:'textbox'},
                {field: 'manager', title: '负责人姓名', width: 70, align: 'center', editor:'textbox'},
                {field: 'manager_phone', title: '负责人手机', width: 120, align: 'center', editor:'textbox'},
                {field: 'tel', title: '分校联系电话', width: 120, align: 'center', editor:'textbox'},
                {field: 'zipcode', title: '邮政编码', width: 70, align: 'center', editor:'textbox'},
                {field: 'remark', title: '备注', width: 200, align: 'center', editor:'textbox'},
                {field: 'recorder', title: '录入员', width: 90, align: 'center'}
            ]]
        };

        danceCreateEditedDatagrid(tableId, '/'+module, opts_school);
    }
}

/**
 * 打开 [分校信息] tab标签
 * @param title     Tab的标题
 * @param tableId   Datagrid id,创建在 table 上
 */
function danceAddTabUsers(title, tableId) {
    //console.log(tableId);
    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
    } else {
        //var content = '<table id=' + tableId + '></table>';
        var content = '<div style="min-width:1024px;width:100%;height:100%"><table id=' + tableId + '></table></div>';
        $(parentDiv).tabs('add', {
            title: title,
            content: content,
            closable: true
        });
        var module = 'dance_user';
        var opts_user = {
            'defaultSelField' : 'name',
            'fieldValidate' : {'name': checkNotEmpty},
            'queryText': '用户名：',
            'queryPrompt': '用户拼音首字母查找',
            'who': 'DanceUser',
            'danceModuleName': 'DanceUser',   // 传递给 导入、导出 模块的身份标识
            'danceModuleTitle': title,          // 导入、导出 窗口 title
            'columns': [[
                {field: 'ck', checkbox:true },   // checkbox
                {field: 'user_no', title: '用户编号', width: 100, align: 'center'},
                {field: 'name', title: '用户名称*', width: 140, align: 'center', editor: 'textbox'},
                {field: 'pwd', title: '用户密码', width: 100, align: 'center', editor:'textbox'},
                {field: 'phone', title: '联系电话', width: 140, align: 'center', editor:'textbox'},
                {field: 'role_id', title: '所属角色', width: 120, align: 'center', editor:'textbox'},
                {field: 'school_id', title: '允许管理分校', width: 400, align: 'center',
                    formatter:function(value,row){
                        return row.school_name;
                    },
                    editor: {
                        type:'combobox',
                        options:{
                            url:'/dance_school_list_get',
                            method:'post',
                            valueField:'school_id',
                            textField:'school_name',
                            multiple:true,
                            editable:false,
                            panelHeight:'auto'
                        }
                    }
                },
                {field: 'recorder', title: '录入员', width: 90, align: 'center'}
            ]]
        };

        danceCreateEditedDatagrid(tableId, '/dance_user', opts_user);
    }
}

/**
 * 打开 [收费项目] tab标签
 * @param title     Tab的标题
 * @param tableId   Datagrid id,创建在 table 上
 */
function danceAddTabFeeItem(title, tableId) {
    //console.log(tableId);
    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
    } else {
        //var content = '<table id=' + tableId + '></table>';
        var content = '<div style="min-width:1024px;width:100%;height:100%"><table id=' + tableId + '></table></div>';
        $(parentDiv).tabs('add', {
            title: title,
            content: content,
            closable: true
        });
        var module = 'dance_fee_item';
        var opts_feeitem = {
            'defaultSelField' : 'fee_item',
            'fieldValidate' : {'fee_item': checkNotEmpty},
            'queryText': '收费项目：',
            'queryPrompt': '收费项目拼音首字母查找',
            'who': module,
            'danceModuleName': module,   // 传递给 导入、导出 模块的身份标识
            'danceModuleTitle': title,          // 导入、导出 窗口 title
            'columns': [[
                {field: 'ck', checkbox:true },   // checkbox
                //{field: 'id', title: 'id',  width: 30, align: 'center' },
                {field: 'fee_item', title: '收费项目*', width: 160, align: 'center', editor: 'textbox'},
                {field: 'type_text', title: '类别*', width: 90, align: 'center', editor: {
                    type: 'combobox', options:{
                        valueField: 'type', textField:'type_text', editable:false,panelHeight:'auto',
                        data: [{
                            type: 1,
                            type_text: '学费'
                        },{
                            type: 2,
                            type_text: '演出费'
                        },{
                            type: 3,
                            type_text: '普通收费'
                        }]
                    }
                }},
                {field: 'create_at', title: '创建日期', width: 140, align: 'center'},
                {field: 'recorder', title: '录入员', width: 90, align: 'center'}
            ]]
        };
        
        danceCreateEditedDatagrid(tableId, '/'+module, opts_feeitem);
    }
}


/**
 * 打开 [教材信息] tab标签
 * @param title     Tab的标题
 * @param tableId   Datagrid id,创建在 table 上
 */
function danceAddTabTeachingMaterial(title, tableId) {
    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
    } else {
        //var content = '<table id=' + tableId + '></table>';
        var content = '<div style="min-width:1024px;width:100%;height:100%"><table id=' + tableId + '></table></div>';
        $(parentDiv).tabs('add', {
            title: title,
            content: content,
            closable: true
        });
        var module = 'dance_teaching_material';
        var optsTeachingMaterial = {
            'defaultSelField' : 'material_name',
            'fieldValidate' : {'material_name': checkNotEmpty},
            'queryText': '教材名称：',
            'queryPrompt': '名称拼音首字母查找',
            'who': module,     // 删除数据时，表明身份
            'danceModuleName': module,   // 传递给 导入、导出 模块的身份标识
            'danceModuleTitle': title,          // 导入、导出 窗口 title
            'columns': [[
                {field: 'ck', checkbox:true },   // checkbox
                {field: 'material_no', title: '教材编号', width: 100, align: 'center'},
                {field: 'material_name', title: '教材名称*', width: 180, halign: 'center', align: 'left', editor: 'textbox'},
                {field: 'unit', title: '单位', width: 60, align: 'center', editor:'textbox'},
                {field: 'tm_type', title: '类别', width: 60, align: 'center', editor:'textbox'},
                {field: 'price_buy', title: '进价', width: 70, align: 'center', editor:'textbox'},
                {field: 'price_sell', title: '售价', width: 120, align: 'center', editor:'textbox'},
                {field: 'summary', title: '内容简介', width: 300, align: 'center', editor:'textbox'},
                {field: 'is_use', title: '是否启用', width: 60, align: 'center', editor:'textbox'},
                {field: 'remark', title: '备注', width: 300, align: 'center', editor:'textbox'},
                {field: 'recorder', title: '录入员', width: 90, align: 'center'}
            ]]
        };

        danceCreateEditedDatagrid(tableId, '/'+module, optsTeachingMaterial);
    }
}


/**
 * 打开 [收费模式] tab标签
 * @param title     Tab的标题
 * @param tableId   Datagrid id,创建在 table 上
 */
function danceAddTabFeeMode(title, tableId) {
    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
    } else {
        //var content = '<table id=' + tableId + '></table>';
        var content = '<div style="min-width:1024px;width:100%;height:100%"><table id=' + tableId + '></table></div>';
        $(parentDiv).tabs('add', {
            title: title,
            content: content,
            closable: true
        });
        var module = 'dc_comm_fee_mode';
        var optsTeachingMaterial = {
            'defaultSelField' : 'fee_mode',
            'fieldValidate' : {'fee_mode': checkNotEmpty},
            'queryText': '收费方式：',
            'queryPrompt': '拼音首字母查找',
            'who': module,     // 删除数据时，表明身份
            'danceModuleName': module,   // 传递给 导入、导出 模块的身份标识
            'danceModuleTitle': title,          // 导入、导出 窗口 title
            'columns': [[
                {field: 'ck', checkbox:true },   // checkbox
                {field: 'fee_mode', title: '收费方式名称', width: 140, align: 'center', editor: 'textbox'},
                {field: 'disc_rate', title: '费率（%）', width: 80, halign: 'center', align: 'left',editor: 'textbox'},
                {field: 'create_at', title: '创建时间', width: 100, align: 'center'},
                {field: 'last_upd_at', title: '最后更新日期', width: 140, align: 'center'},
                {field: 'last_user', title: '最后更新人', width: 100, align: 'center'},
                {field: 'remark', title: '备注', width: 300, align: 'center', editor:'textbox'},
                {field: 'recorder', title: '录入员', width: 100, align: 'center'}
            ]]
        };

        danceCreateEditedDatagrid(tableId, '/'+module, optsTeachingMaterial);
    }
}
