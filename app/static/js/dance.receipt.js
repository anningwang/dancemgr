/**
 * 实现 收费单——演出 和 普通 功能。
 *  @author Anningwang
 *
 * 功能：
 * 学员管理
 *      收费单（演出）             danceAddTabFeeShowDatagrid
 *      收费单（考级）             danceAddTabFeeOtherDatagrid
 *
 */

'use strict';

/**
 * 添加或者打开 收费单（演出） Tab页
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabFeeShowDatagrid(title, tableId, condition) {
    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
        $('#'+tableId).datagrid('load', condition);
    } else {
        var content = '<table id=' + tableId + '></table>';
        $(parentDiv).tabs('add', {
            title: title,
            content: content,
            closable: true
        });

        var url = '/dance_receipt_show';
        var opts = {
            queryText:'姓名：',
            queryPrompt: '姓名拼音首字母查找',
            who: 'DcShowRecpt',
            danceModuleName: 'DcShowRecpt',
            danceModuleTitle: title,          // 导入、导出 窗口 title
            addEditFunc: danceAddReceiptShowDetailInfo,
            page: '/static/html/_receipt_show.html',     // 上述函数的参数
            url: url,
            columns: [[
                {field: 'ck', checkbox:true },
                {field: 'show_recpt_no', title: '演出收费单编号', width: 160, align: 'center'},
                {field: 'show_name', title: '演出名称', width: 180, align: 'center'},
                {field: 'school_name', title: '分校名称', width: 110, align: 'center'},
                {field: 'student_no', title: '学号', width: 140, align: 'center'},
                {field: 'student_name', title: '学员姓名', width: 80, align: 'center'},
                {field: 'deal_date', title: '收费日期', width: 90, align: 'center'},
                {field: 'join_fee', title: '报名费', width: 80, align: 'center'},
                {field: 'other_fee', title: '其他费', width: 80, align: 'center'},
                {field: 'total', title: '费用合计', width: 80, align: 'center'},
                {field: 'fee_mode', title: '收费方式', width: 70, align: 'center'},
                {field: 'paper_receipt', title: '收据号', width: 70, align: 'center'},
                {field: 'remark', title: '备注', width: 90, align: 'center'},
                {field: 'recorder', title: '录入员', width: 90, align: 'center'}
            ]]
        };

        danceCreateCommDatagrid(tableId, url, condition, opts)
    }
}


////////////////// 收费单（演出）详细信息 begin ////////////////////////////////////////////////////////////////////////
/**
 * 查看/新增 收费单（学费） 详细信息
 * @param condition     查询条件。
 *      school_id     分校id，取回范围： all  or 具体分校id
 * @param uid           单据id（收费单id），新增时，可以不传递此参数。
 * @param options       可选参数
 *      {
 *          tableId:    表格id，新增/修改 记录后，需要更新的表格
 *          page:       详细信息页面
 *          url:        查询信息所用url
 *      }
 */
function danceAddReceiptShowDetailInfo(condition, uid, options) {
    var title = '收费单（演出）详细信息';
    uid = uid || 0;     // 第一次进入 学生详细信息页面 uid 有效，上下翻页时，无法提前获取上下记录的uid
    if (uid <= 0) {
        title +='[新增]'
    }

    var no = -2;    // 收费单序号，方便翻页。传递 -2 则根据 uid 查询序号
    var page = options.page;
    var url = options.url;

    var dgRecptComm = 'dgRecptShowComm';   // 收费单（演出）基本信息
    var dgShow = 'dgShowFee';      // 演出费

    var pagerFee = 'pagerShow';
    var footer = 'footerShow';
    var panelFee = 'panelRecptShow';
    var dgParam = {};  // { dgId: {idx: 0, dg: JQuery Select) } }

    var classlist = [];
    var schoollist = [];

    var oldDetails = {};
    var btnAdd = 'addRecptShow'+uid;

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
        onLoad : function () {
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
            $('#'+dgRecptComm).attr('id', dgRecptComm+=uid).datagrid({  // 收费单（演出）基本信息 ||||||||||||||||||||||
                onClickCell: dgRecptCommClickCell,
                onEndEdit: dgRecptCommEndEdit
            });

            $('#'+dgShow).attr('id', dgShow+=uid).datagrid({    // 演出费 ==========================
                onClickCell: dgShowClickCell,
                onEndEdit: dgShowEndEdit,
                onAfterEdit: dgShowAfterEdit,
                toolbar: [{iconCls: 'icon-add', text: '增加行', handler:function(){
                    $('#'+dgShow).datagrid('appendRow', {})}},
                    {iconCls: 'icon-remove', text: '删除行', handler: function () {
                        dgEndEditing('#'+dgShow);
                        danceDelRow($('#'+dgShow));
                    }}
                ]
            });
            
            $('#'+footer).attr('id', footer+=uid);
            $('#'+panelFee).attr('id', panelFee+=uid).mousedown(function (event) {      // panel 鼠标按下事件
                //console.log(event);
                if (event.target.id === panelFee) {
                    dgEndEditing(dgRecptComm);
                    dgEndEditing(dgShow);
                }
            });

            dgParam[dgRecptComm] = {idx: undefined, dg: '#'+dgRecptComm};
            dgParam[dgShow] = {idx: undefined, dg: '#'+dgShow};

            setDgCellColor('#'+dgRecptComm, 0, 'c1', '#555');

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
        var cond = {'recpt_id': uid, 'page': no, 'rows': 1};
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

                // 更新 收费单（演出）基本信息
                $('#'+dgRecptComm).datagrid('updateRow',{ index: 0,
                    row: {c2: data.row['show_recpt_no'],
                        c4: data.row['school_name'],
                        c6: data.row['deal_date'],
                        school_id: data.row.school_id
                    }
                }).datagrid('updateRow', { index: 1,
                    row: {c2: data.row['student_no'],
                        c4: data.row['student_name'],
                        c6: data.row['fee_mode'],
                        student_id: data.row.student_id,
                        fee_mode_id: data.row.fee_mode_id
                    }
                }).datagrid('updateRow', { index: 2,
                    row: {c2: data.row['join_fee'],
                        c4: data.row['other_fee'],
                        c6: data.row['total']
                    }
                }).datagrid('updateRow', { index: 3,
                    row: {c2: data.row['remark'],
                        c4: data.row['paper_receipt'],
                        c6: data.row['recorder']
                    }
                }).datagrid('updateRow', { index: 4,
                    row: {c2: ''            // 已报名班级  *** 待实现 ***
                    }
                });
                
                dgLoadData(data['showDetail']);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.messager.alert('提示', "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown), 'info');
        });
    }

    /**
     * 新增单据 —— 收费单（演出）
     */
    function newReceipt() {
        var num = 3;
        danceDgLoadData(dgShow, [], num);

        // 更新 收费单（演出）基本信息
        var dg = $('#'+dgRecptComm);
        dg.datagrid('updateRow',{ index: 0,
            row: {c2: '[自动生成]',
                c6: danceFormatter(new Date())
            }
        }).datagrid('updateRow', { index: 1,
            row: {c2:  '[关联学员姓名]',
                c4: '',
                c6: '',
                student_id: undefined,
                fee_mode_id:undefined
            }
        }).datagrid('updateRow', { index: 2,
            row: {c2: '',
                c4: '',
                c6: ''
            }
        }).datagrid('updateRow', { index: 3,
            row: {c2: '',
                c4: '',
                c6: '[关联当前用户]'
            }
        }).datagrid('updateRow', { index: 4,
            row: {c2: '', c3: '', c4: ''
            }
        });

        danceSetDgWithRowData(dg, 1, 'fee_mode_id', '');        /// 新增 演出 收费单，需要重新选择 收费方式

        $('#'+btnAdd).linkbutton('disable');
        oldDetails = {};
        uid = 0;
    }

    /**
     * 收费单（演出）基本信息 单元格点击事件
     * @param index
     * @param field
     */
    function dgRecptCommClickCell(index,field) {
        dgEndEditing(dgShow);
        //console.log('index=',index, ' field=', field, ' value=', value);
        if (dgParam[dgRecptComm].idx !== index) {
            var dg = $('#'+dgRecptComm);
            dgEndEditing(dgRecptComm);
            $(dg).datagrid('removeEditor', ['c2', 'c4', 'c6']);
            dcAddRowEditors(dg, index);

            $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);
            var row = $(dg).datagrid("getSelected");

            if (index === 0){
                var eds = $(dg).datagrid('getEditor', {index:index,field:'c4'});
                $(eds.target).combobox({    // 分校名称
                    editable:false,panelHeight:'auto',
                    valueField: 'school_id',textField: 'school_name',
                    data:filterSchool(schoollist)
                }).combobox('setValue', row.school_id);
            }else if (index === 1) {
                var edname = $(this).datagrid('getEditor', {index:index,field:'c4'});
                $(edname.target).combobox({ // 学员姓名
                    valueField: 'name', textField: 'name', hasDownArrow: false,
                    panelHeight:'auto',
                    onChange: function autoComplete (newValue) {    // ,oldValue
                        //console.log('newValue=' + newValue + ' oldValue=' + oldValue);
                        var cond = $.trim(newValue);
                        var dcCond = {'name': cond, 'is_training': '是', 'school_id': condition.school_id };
                        if (newValue.length >= 1) {
                            $.post('/api/dance_student_query',dcCond, function(data){
                                $(edname.target).combobox('loadData', data);
                            },'json');
                        }
                    },
                    onClick:function (record) {
                        //console.log(record);
                        var dg = $('#'+dgRecptComm);
                        setDgCellTextWithRowData(dg, 1, 'c2', record.code); // 设置学号
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

                            } else {
                                $.messager.alert('提示', data.msg, 'info');
                            }
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            $.messager.alert('提示', "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown), 'info');
                        });
                    }
                }).combobox('setValue', row.c4);

                var edFee = $(dg).datagrid('getEditor', {index:index,field:'c6'});
                $(edFee.target).combobox({    // 收费方式
                    editable:false,panelHeight:'auto',
                    valueField: 'fee_mode_id',textField: 'fee_mode',
                    iconWidth:22,
                    icons: [{
                        iconCls:'icon-add', handler: function () {
                            dcNewWindow(dgRecptComm, 'dcFeeModeNewPanel', 'dcFeeModeNewWin',
                                       '/static/html/_add_fee_mode.html', 1, 'c6', '新增收费方式');
                        }
                    }],
                    url: '/api/dance_fee_mode_get'
                }).combobox('setValue', row.fee_mode_id);
            }

            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            dgParam[dgRecptComm].idx = index;
        }
    }

    function dgRecptCommEndEdit(index, row){
        var dg = $('#'+dgRecptComm);
        var ed = null;
        if (index === 0) {
            ed = $(dg).datagrid('getEditor', { index: index, field: 'c4' });
            row.c4 = $(ed.target).combobox('getText');
            row.school_id = parseInt($(ed.target).combobox('getValue'));
        } else if (index === 1){
            ed = $(dg).datagrid('getEditor', { index: index, field: 'c6' });
            row.c6 = $(ed.target).combobox('getText');
            row.fee_mode_id = $(ed.target).combobox('getValue');
        }
    }

    /**
     * 班级——演出, 单元格点击事件。
     * @param index
     * @param field
     */
    function dgShowClickCell(index, field) {
        console.log('dgShowClickCell, index:', index, ' field:', field);
        dgEndEditing(dgRecptComm);

        if (dgParam[dgShow].idx !== index) {
            getShowConfig();
            var dg = $('#'+dgShow);
            dgEndEditing(dgShow);
            $(dg).datagrid('selectRow', index).datagrid('beginEdit', index);
            var row = $(dg).datagrid("getSelected");
            //var editors = dg.datagrid('getEditors', index);

            // 演出名称
            var edx =  $(dg).datagrid('getEditor', {index:index,field:'show_name'});
            $(edx.target).combobox({
                url: '/api/dance_show_name_get',
                // iconAlign: 'left',
                iconWidth: 25,
                icons: [{
                    iconCls:'icon-add',
                    handler: function(){
                        // 关闭 新增 演出 窗口，重新加载 演出combobox中的演出名称。
                        dcNewWindow(dgShow, 'danceShowWindow', 'dcShowWinNew',
                            '/static/html/_dc_add_edit_show.html', index, field, '新增演出', function callback() {
                                getShowConfig();    // 重新读取演出配置
                            })
                    }
                },{
                    iconCls:'icon-edit',
                    handler: function(e){
                        $(e.data.target).textbox('clear');
                    }
                }],
                onClick: dgShowOnClickShowName
            }).combobox('setValue', row['show_id']);

            // 是否收取费用
            var ed_is_rcv =  $(dg).datagrid('getEditor', {index:index,field:'is_rcv_text'});
            $(ed_is_rcv.target).combobox({
                onClick: dgShowOnClickIsRcv
            }).combobox('setValue', row['is_rcv']);

            // 费用
            var ed_fee = $(dg).datagrid('getEditor', {index:index,field:'fee'});    // 收费金额
            $(ed_fee.target).textbox('textbox').bind("input propertychange",function(){
                row.fee =  $(this).val();
                if (isNaN(row.fee)) {
                    row.fee = 0;
                }
                dgShowCalcFee();
            });

            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            dgParam[dgShow].idx = index;
        }
    }

    /**
     * 收费单（演出）  “演出收费”datagrid 单元格 end edit 事件
     * @param index
     * @param row
     */
    function dgShowEndEdit(index, row){
        //console.log('onEndEdit', row);
        var dg = $('#'+dgShow);
        var ed = $(dg).datagrid('getEditor', { index: index, field: 'show_name' });
        row.show_name = $(ed.target).combobox('getText');

        ed = $(dg).datagrid('getEditor', { index: index, field: 'is_rcv_text' });
        row.is_rcv = parseInt($(ed.target).combobox('getValue'));
        row.is_rcv_text = $(ed.target).combobox('getText');

        // bug fix: 点击 演出名称时，由于时间差的问题，导致 combobox getValue 返回 NaN。这里修正该问题。
        if (isNaN(row.is_rcv)) {
            row.is_rcv = 1;
            row.is_rcv_text = '是';
        }
    }

    function dgShowAfterEdit() {    // index,row,changes
        var dg = $('#'+dgShow);
        console.log('dgShowAfterEdit', dgParam[dgShow].mergeCell);
        if(dgParam[dgShow].mergeCell)
        {
            for(var key in dgParam[dgShow].mergeCell){
                if(!dgParam[dgShow].mergeCell.hasOwnProperty(key))
                    continue;
                $(dg).datagrid('mergeCells', {
                    index: dgParam[dgShow].mergeCell[key].index,
                    field: 'show_name',
                    rowspan: dgParam[dgShow].mergeCell[key].span,
                    type: 'body'
                });
            }
        }
        dgParam[dgShow].idx = undefined;
    }

    // 更新演出收费单的 报名费、其他费和 费用合计
    function dgRecptCommSetFee(joinFee, otherFee, total) {
        var dg = $('#'+dgRecptComm);
        setDgCellTextWithRowData(dg, 2, 'c2', joinFee); // 报名费
        setDgCellTextWithRowData(dg, 2, 'c4', otherFee); // 其他费
        setDgCellTextWithRowData(dg, 2, 'c6', total); // 费用合计
    }

    // 计算演出收费单各项费用：报名费、其他费和 费用合计
    function dgShowCalcFee() {
        var dg = $('#'+dgShow);
        var rows = $(dg).datagrid('getRows');
        var joinFee = 0, otherFee = 0, total = 0;
        for(var i=0; i< rows.length; i++){
            if (rows[i].fee_item && rows[i].is_rcv_text == '是'){
                var val = parseFloat(rows[i].fee);
                if(rows[i].fee_item.indexOf('报名费') >=0){
                    joinFee += val;
                } else {
                    otherFee += val;
                }
                total += val;
            }
        }

        dgRecptCommSetFee(joinFee, otherFee, total);
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
            setDgCellTextWithRowData($('#'+dgRecptComm), 0, 'c4', schoollist[0].school_name);
            apiSetDgCellText('#'+dgRecptComm, 0, 'school_id', schoollist[0].school_id);
        }
    }


    /**
     * 根据分校id过滤分校信息。用于修改记录时，只保留学员所在的分校。即，学员报名后，不能修改学员的分校。
     * @param schoolList
     */
    function filterSchool(schoolList) {
        if (uid <= 0) {
            return schoolList;
        }
        var school_id = apiGetDgCellText('#'+dgRecptComm, 0, 'school_id');
        for(var m = 0; m < schoollist.length; m++){
            if(school_id == schoollist[m].school_id){
                return [schoollist[m]];
            }
        }
    }

    var dcShowCfg = {};
    function getShowConfig() {
        $.ajax({
            method: 'POST',
            url: '/api/dance_shows_cfg_get',
            dataType: 'json',
            data: {}
        }).done(function(data) {
            if (data.errorCode === 0) {
                // $.messager.alert('提示', data.msg, 'info');
                $.extend(true, dcShowCfg, data);
            } else {
                $.messager.alert('错误', data.msg, 'error');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var msg = "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown);
            $.messager.alert('提示', msg, 'info');
        });
        
    }

    /**
     * 班级——演出 演出名称点击事件
     * @param record
     */
    function dgShowOnClickShowName(record) {
        var dg = $('#'+dgShow);
        var row = $(dg).datagrid("getSelected");
        row.show_name =  record.show_name;
        row.show_id = record.show_id;

        var j = 0;
        for(; j< dcShowCfg['shows'].length; j++){
            if (row.show_id === dcShowCfg['shows'][j]['show_id']){
                break;
            }
        }
        if (j >= dcShowCfg['shows'].length){
            $.messager.alert('错误', '未找到演出信息[id=' + row.show_id + ']！', 'error');
            return;
        }

        var idx = dgParam[dgShow].idx;
        var k = idx;
        for(var i=0; i< dcShowCfg['shows'][j]['cfg'].length; i++){
            var addRow = {fee: dcShowCfg['shows'][j]['cfg'][i].cost,
                fee_item: dcShowCfg['shows'][j]['cfg'][i].fee_item,
                fee_item_id: dcShowCfg['shows'][j]['cfg'][i].fee_item_id,
                is_rcv: 1,
                is_rcv_text: '是',
                show_id: row.show_id,
                show_name: row.show_name};
            if(idx === k){
                var tmpRow = {};
                $.extend(tmpRow, addRow);
                const CUR_ROW = tmpRow;
                setTimeout(function () {
                    $(dg).datagrid('updateRow', { index: k, row: CUR_ROW});
                    dgParam[dgShow].idx = undefined;
                    $(dg).datagrid('beginEdit', k).datagrid('endEdit', k);  // 在结束编辑里面更新合并单元格。
                    dgShowCalcFee();
                }, 30);

                // $(dg).datagrid('updateRow', { index: idx, row: addRow});

            } else if (idx >= ($(dg).datagrid('getRows').length)) {
                $(dg).datagrid('appendRow', addRow);
            } else {
                $(dg).datagrid('insertRow',{index: idx, row: addRow});
            }
            idx++;
        }

        if(dgParam[dgShow].mergeCell === undefined){
            dgParam[dgShow].mergeCell = {};
        }
        var curNum = dcShowCfg['shows'][j]['cfg'].length;
        var oldNum = dgParam[dgShow].mergeCell[k] ? dgParam[dgShow].mergeCell[k].span : 1;
        dgParam[dgShow].mergeCell[k] = {index: k, span: curNum};

        // 更新 合并单元格下方所有 合并单元格的 起始索引
        var newMc = {};
        var diff = curNum - oldNum;
        for(j=0; oldNum> 1 && j < oldNum-1; j++){     // 删除 合并单元 变化后产生的多余行
            $(dg).datagrid('deleteRow', k+curNum);
        }
        for(var mc in dgParam[dgShow].mergeCell) {
            if(!dgParam[dgShow].mergeCell.hasOwnProperty(mc))
                continue;
            if (mc > k){
                var new_idx = parseInt(mc)+diff;
                newMc[new_idx] = {index: new_idx, span: dgParam[dgShow].mergeCell[mc].span};
            } else {
                newMc[mc] = {index: parseInt(mc), span: dgParam[dgShow].mergeCell[mc].span};
            }
        }

        dgParam[dgShow].mergeCell = newMc;
        console.log('new:', dgParam[dgShow].mergeCell);
    }

    /**
     * 班级——演出 "是否收取费用"单元格 点击事件
     * @param record
     */
    function dgShowOnClickIsRcv(record) {
        var dg = $('#' + dgShow);
        var row = $(dg).datagrid("getSelected");

        row.is_rcv_text = record.text;

        dgShowCalcFee();
    }

    /**
     * 保存 收费单（演出）详细信息
     */
    function onSave() {
        dgEndEditing(dgRecptComm);
        dgEndEditing(dgShow);

        if (!validateReceiptInfo()) {
            return false;
        }

        var newRecpt = packageReceipt();
        console.log(newRecpt);

        $.ajax({
            method: "POST",
            url: '/dance_receipt_show_modify',
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
        var dg = $('#'+dgRecptComm);
        var stuName = apiGetDgCellText(dg, 1, 'c4');
        if (!stuName) {
            $.messager.alert({ title: '提示',icon:'info', msg: '请输入学员姓名！', fn: function(){}
            });
            return false;
        }

        var fee_mode = apiGetDgCellText(dg, 1, 'c6');    // 收费模式
        if (!fee_mode) {
            $.messager.alert({ title: '提示',icon:'info', msg: '请选择收费模式'});
            return false;
        }

        var total = apiGetDgCellText(dg, 2, 'c6');    // 费用合计
        if (total == 0) {
            $.messager.alert({ title: '提示',icon:'info', msg: '实收费合计为 0，请录入演出收费！'});
            return false;
        }

        return true;
    }

    /**
     * 打包 收费单（学费）
     * @returns {{row: {}, showDetail: Array}}
     */
    function packageReceipt() {

        var i;
        var dgRecpt = $('#'+dgRecptComm);
        var rows = dgRecpt.datagrid('getRows');
        var recpt = {row: {}, showDetail: []};

        recpt.row.id = oldDetails.row ? oldDetails.row.id : 0;
        recpt.row.school_id = rows[0].school_id;
        recpt.row.school_name = rows[0].c4;
        recpt.row.deal_date = rows[0].c6;
        recpt.row.student_id = rows[1].student_id;
        recpt.row.student_name = rows[1].c4;
        recpt.row.fee_mode = rows[1].c6;
        recpt.row.fee_mode_id = rows[1].fee_mode_id;
        recpt.row.join_fee = rows[2].c2;
        recpt.row.other_fee = rows[2].c4;
        recpt.row.total = rows[2].c6;
        recpt.row.remark = rows[3].c2;
        recpt.row.paper_receipt = rows[3].c4;

        var dg = $('#'+dgShow);
        var data = $(dg).datagrid('getData');
        for(i = 0; i< data.rows.length; i++) {
            if (data.rows[i].show_name) {
                recpt.showDetail.push(data.rows[i]);
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
        if (rowToDel.show_name) { // 本行有数据，询问是否要删除
            var span = 1;
            for(var mc in dgParam[dgShow].mergeCell){
                if(!dgParam[dgShow].mergeCell.hasOwnProperty(mc))
                    continue;
                var num = dgParam[dgShow].mergeCell[mc].span;
                if (idx >= mc && idx < parseInt(mc)+num){    // idx行是否在 合并单元格内
                    idx = parseInt(mc);
                    span = num;
                    break;
                }
            }
            // var span = dgParam[dgShow].mergeCell[idx].span;
            console.log('span:',span);
            var msg = '确认删除第 {0}--{1} 行数据吗？'.format(idx+1, idx+span);
            $.messager.confirm('确认删除', msg, function(r){
                if (r){
                    for(var i = 0; i< span; i++){
                        dg.datagrid('deleteRow', idx);
                    }
                    dgShowCalcFee();

                    // 更新 合并单元格下方所有 合并单元格的 起始索引
                    var newMc = {};
                    var diff = 0 - span;
                    for(var mc in dgParam[dgShow].mergeCell) {
                        if(!dgParam[dgShow].mergeCell.hasOwnProperty(mc))
                            continue;
                        if (mc > idx){
                            var new_idx = parseInt(mc)+diff;
                            newMc[new_idx] = {index: new_idx, span: dgParam[dgShow].mergeCell[mc].span};
                        } else if( mc < idx) {
                            newMc[mc] = {index: parseInt(mc), span: dgParam[dgShow].mergeCell[mc].span};
                        }
                    }
                    dgParam[dgShow].mergeCell = newMc;
                    console.log('new:', dgParam[dgShow].mergeCell);
                }
            });
        } else {
            dg.datagrid('deleteRow', idx);
            dgShowCalcFee();
        }
    }


    function dgEndEditing(which) {
        if (dgParam.hasOwnProperty(which) && dgParam[which].idx !== undefined) {
            $(dgParam[which].dg).datagrid('endEdit', dgParam[which].idx);
            dgParam[which].idx = undefined;
        }
    }

    // 收费单（学费）基本信息中的 编辑器
    var editors = [ {'c4': 'combobox', 'c6': 'datebox' },   // 分校名称，收费日期
        {'c4': 'combobox', 'c6': 'combobox'}, // 姓名， 收费方式
        {},
        {'c2': 'textbox', 'c4': 'textbox'}      // 备注，收据号
    ];


    /**
     * 向datagrid 添加行 编辑器（多个），符合条件才添加。
     * @param dg
     * @param index
     */
    function dcAddRowEditors(dg, index) {
        if (index >= 0 && index < editors.length) {
            for(var key in editors[index]){
                if (editors[index].hasOwnProperty(key))
                    $(dg).datagrid('addEditor', {field:key, editor:editors[index][key]});
            }
        }
    }

    /**
     * 收费单（演出）详细页面，更新学员的 演出收费表
     * @param data              表格数据
     */
    function dgLoadData(data) {
        var dg = $('#'+dgShow);
        $(dg).datagrid('loadData', data);
        var num = 3;
        var len = data.length;
        for(var i = 0; i < num - len; i++ ) {
            $(dg).datagrid('appendRow', {});
        }
        // 更新合并单元格信息。并设置合并单元格。
        dgParam[dgShow].mergeCell = {};
        var show_id = -1, span = 1, idx = 0;
        for(var j=0; j< data.length; j++){
            if(show_id === data[j].show_id){
                span++;
            }else{
                if(j !== 0 && span > 1) {
                    dgParam[dgShow].mergeCell[idx] = {index:idx, span: span};
                    $(dg).datagrid('mergeCells', {
                        index: dgParam[dgShow].mergeCell[idx].index,
                        field: 'show_name',
                        rowspan: dgParam[dgShow].mergeCell[idx].span,
                        type: 'body'
                    });
                }
                show_id = data[j].show_id;
                span = 1;
                idx = j;
            }
        }
        if(j !== 0 && span > 1){
            dgParam[dgShow].mergeCell[idx] = {index:idx, span: span};
            $(dg).datagrid('mergeCells', {
                index: dgParam[dgShow].mergeCell[idx].index,
                field: 'show_name',
                rowspan: dgParam[dgShow].mergeCell[idx].span,
                type: 'body'
            });
        }

    }
    
}
////////////////  收费单（演出） 详细信息 end //////////////////////////////////////////////////////////////////////////



/**
 * 添加或者打开 收费单（普通） Tab页
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabFeeOtherDatagrid(title, tableId, condition) {
    var parentDiv = $('#danceTabs');
    if ($(parentDiv).tabs('exists', title)) {
        $(parentDiv).tabs('select', title);
        $('#'+tableId).datagrid('load', condition);
    } else {
        var content = '<table id=' + tableId + '></table>';
        $(parentDiv).tabs('add', {
            title: title,
            content: content,
            closable: true
        });

        var module = 'receipt_exam';
        var url = '/' + module;
        var opts = {
            queryText: '姓名：',
            queryPrompt: '姓名拼音首字母查找',
            who: module,
            danceModuleName: module,
            danceModuleTitle: title,          // 导入、导出 窗口 title
            addEditFunc: addEditReceiptExam,
            page: '',     // 上述函数的参数
            tableId: tableId,
            url: url,
            title: title,
            columns: [[
                {field: 'ck', checkbox:true },
                {field: 'code', title: '考级收费单号', width: 140, align: 'center'},
                {field: 'exam_name', title: '考级名称', width: 110, align: 'center'},
                {field: 'school_name', title: '分校名称', width: 110, align: 'center'},
                {field: 'student_no', title: '学号', width: 140, align: 'center'},
                {field: 'student_name', title: '学员姓名', width: 80, align: 'center'},
                {field: 'date', title: '收费日期', width: 90, align: 'center'},
                {field: 'fee', title: '报名费', width: 80, align: 'center'},
                {field: 'class_type_name', title: '班级类型', width: 80, align: 'center'},
                {field: 'degree', title: '等级', width: 80, align: 'center'},
                {field: 'fee_mode_name', title: '收费方式', width: 70, align: 'center'},
                {field: 'remark', title: '备注', width: 90, align: 'center'},
                {field: 'recorder', title: '录入员', width: 90, align: 'center'}
            ]]
        };

        danceCreateCommDatagrid(tableId, url, condition, opts);
    }
}


/**
 * 查看/新增  考级 收费单
 * @param condition     查询条件：
 *         school_id     分校id，取值范围： all  or 具体分校id
 * @param uid           记录id，新增时，可以不传递此参数。
 * @param options       可选参数
 *      {
 *          tableId:    表格id，新增/修改 考级收费单 后，需要更新的表格
 *          title:      窗口标题
 *          who:        模块名称
 *      }
 */
function addEditReceiptExam(condition, uid, options) {
    var title = '编辑/查看 ' + options.title;
    var dlgId = 'dlg-id-' + options.who;
    uid = uid || 0;
    if (uid <= 0) {
        title = '新增 ' + options.title;
        dlgId += '-new';
    }
    options.condition = condition;
    dcOpenDialogNewReceiptExam(dlgId, title, uid,  'icon-save', options);
}


/**
 * 新增 或者 编辑/查看  收费单考级 窗口
 * @param id        dialog id
 * @param title     dialog 标题
 * @param uuid      记录id，新增时 可以不填或者填写 <=0 ，修改记录时，必须填写记录的 ID
 * @param icon
 * @param options       扩展参数
 * {
 *      condition:      查询条件
 *      tableId:        本窗口 关闭后，要更新的 表格 id。
 *      url:            url 前缀
 * }
 */
function dcOpenDialogNewReceiptExam(id, title, uuid, icon, options){
    var d_receiptCode = 'receiptCode'+id;
    var d_date = 'date'+id;
    var d_schoolNo = 'schoolNo'+id;
    var d_schoolName = 'schoolName'+id;
    var d_studentNo = 'studentNo'+id;
    var d_studentName = 'studentName'+id;
    var d_examName = 'examName'+id;
    var d_classType = 'classType'+id;
    var d_degree = 'degree'+id;
    var d_fee = 'fee'+id;
    var d_feetMode = 'feeMode'+id;
    var d_isReceive = 'isReceive'+id;
    var d_paperReceipt = 'paperReceipt'+id;
    var d_recorder = 'recorder'+id;
    var d_remark = 'remark'+id;
    var d_uid = 'UUID_'+id;
    options = options || {};
    var dgId = options.tableId;
    var mm = 'menu-'+id;
    var mb = 'menubutton-'+id;

    var school_id = null;

    if (isOpen()) {
        if(uuid > 0)
            ajaxRequest();
        else
            $.messager.alert('提示', '[' + title + ']窗口已打开！', 'info');
        return;
    }
    $('body').append('<div id=' + id + ' style="padding:5px"></div>');

    var ctrls = '<div class="easyui-panel" data-options="fit:true" style="padding:10px;">';
    ctrls += '<input id='+d_receiptCode+'><input id='+d_date+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_schoolNo+'><input id='+d_schoolName+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_studentNo+'><input id='+d_studentName+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_examName+'><input id='+d_classType+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_degree+'><input id='+d_fee+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_feetMode+'><input id='+d_isReceive+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_paperReceipt+'><input id='+d_recorder+'>';
    ctrls += '<div style="height:3px"></div><input id='+d_remark+'>';
    ctrls += '<div style="height:3px"></div><div id='+mb+'></div><div id='+mm+'></div>';
    ctrls += '<input id=' + d_uid + ' type="hidden" value="0" />';
    ctrls += '</div>';

    $("#"+id).dialog({
        title:title,width:600,height:380,cache: false,iconCls:icon,content:ctrls,inline:true,
        collapsible: false, minimizable:false,maximizable: true, resizable: false,modal:false,closed:true,
        buttons: [{text:'保存',iconCls:'icon-ok',width:80,height:30,handler:save },
            {text:'关闭',iconCls:'icon-cancel',width:80,height:30,handler:function(){ $("#"+id).dialog('close'); }}],
        onOpen:function () {
            console.log('onOpen');
            $('#'+d_receiptCode).textbox({
                label:'考级收费单号：',labelAlign:'right',labelWidth:100,prompt:'自动生成',disabled:true,width:'48%'
            });
            $('#'+d_date).datebox({
                label:'收费日期：',labelAlign:'right',labelWidth:100,width:'48%'
            }).datebox('setValue', danceGetDate());


            $('#'+d_schoolNo).textbox({
                label:'分校编号：',labelAlign:'right',labelWidth:100,prompt:'关联分校名称',disabled:true,width:'48%'
            });
            $('#'+d_schoolName).combobox({
                label:'*分校名称：',labelAlign:'right',labelWidth:100,
                valueField:'school_id', textField:'school_name',editable:false,panelHeight:'auto',width:'48%',
                url: '/api/dance_school_get',
                onLoadSuccess: function () {
                    var data = $(this).combobox('getData');
                    if(data.length){
                        var idx = 0;
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
                        $('#'+d_schoolName).combobox('setValue', data[idx].school_id);
                        $('#'+d_schoolNo).textbox('setValue', data[idx]['school_no']);
                    }
                },
                onSelect:function (record) {
                    //console.log(record);
                    $('#'+d_schoolNo).textbox('setValue', record['school_no']);
                    school_id = record.school_id;
                }
            });

            $('#'+d_studentNo).textbox({
                label:'学号：',labelAlign:'right',labelWidth:100,prompt:'关联分校名称',disabled:true,width:'48%'
            });
            $('#'+d_studentName).combobox({
                label:'*学员姓名：',labelAlign:'right',prompt:'姓名拼音首字母',labelWidth:100,width:'48%',
                valueField: 'id', textField: 'name', hasDownArrow: false,
                onChange: function (newValue) {    // ,oldValue
                    //console.log('newValue=' + newValue + ' oldValue=' + oldValue);
                    //console.log('newValue=' + newValue);
                    var cond = $.trim(newValue);
                    var dcCond = {'name': cond, 'is_training': '是', 'school_id': school_id};
                    if (newValue.length >= 1) {    // 等于或者超过 1 个字符，才查询
                        $.post('/api/dance_student_query',dcCond, function(data){
                            $('#'+d_studentName).combobox('loadData', data);
                        },'json');
                    }
                },
                onClick:function (record) {
                    $('#'+d_studentNo).textbox('setValue', record.code);
                    console.log(record);
                    oMb.updateByStudentId(record.id);
                }
            });

            $('#'+d_examName).combogrid({
                label:'考级名称：',labelAlign:'right',labelWidth:100,editable:false,width:'48%',
                panelWidth:420,
                idField:'id',
                textField:'alias',
                url:'/exam_get',
                queryParams: {
                    valid: 1
                },
                columns:[[
                    {field:'name',title:'考级名称',width:120},
                    {field:'degree',title:'等级',width:50},
                    {field:'class_type_name',title:'班级类型',width:80},
                    {field:'fee',title:'考级费',width:60},
                    {field:'date',title:'考试时间',width:100},
                    {field:'remark',title:'备注',width:100, hidden:true,formatter: function(value,row){
                        return row.name + '(' + row.degree + ')';
                    }}
                ]],
                onSelect: function (index,record) {
                    $('#'+d_classType).textbox('setValue', record['class_type_name']);
                    $('#'+d_degree).textbox('setValue', record.degree);
                    $('#'+d_fee).textbox('setValue', record.fee);
                }
            });
            $('#'+d_classType).textbox({
                label:'*班级类型：',labelAlign:'right',labelWidth:100,prompt:'关联考级名称',disabled:true,width:'48%'
            });


            $('#'+d_degree).textbox({
                label:'等级：',labelAlign:'right',labelWidth:100,prompt:'关联考级名称',disabled:true,width:'48%'
            });
            $('#'+d_fee).textbox({
                label:'考级费：',labelAlign:'right',labelWidth:100,width:'48%'
            });

            $('#'+d_feetMode).combobox({
                label:'*收费方式：',labelAlign:'right',labelWidth:100,width:'48%',
                editable:false,panelHeight:'auto',
                valueField: 'fee_mode_id',textField: 'fee_mode',
                iconWidth:22,
                icons: [{
                    iconCls:'icon-add', handler: function () {
                        dcDialogFeeMode({callback: function () {
                            if (isOpen()){
                                $('#'+d_feetMode).combobox('reload');
                            }
                        }});
                    }
                }],
                url: '/api/dance_fee_mode_get'
            });

            $('#'+d_isReceive).combobox({
                label:'*是否收取：',labelAlign:'right',labelWidth:100,
                valueField:'value', textField:'text',editable:false,panelHeight:'auto',
                data:[{
                    value: 1,
                    text: '是'
                },{
                    value: 0,
                    text: '否'
                }],width:'48%'
            }).combobox('setValue', 1);

            $('#'+d_paperReceipt).textbox({
                label:'收据号：',labelAlign:'right',labelWidth:100,width:'48%'
            });
            $('#'+d_recorder).textbox({
                label:'录入员：',prompt:'自动生成',disabled:true,labelAlign:'right',labelWidth:100,width:'48%'
            });

            $('#'+d_remark).textbox({
                label:'备注：',labelAlign:'right',multiline:true,labelWidth:100,width:'96%', height:50
            });

            // 创建 menu button
            var oMb = new wmm.MbAttendClass(mb, mm, {
                onClick: function (item) {
                    console.log(item);
                },
                plain: false
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
                $('#'+d_receiptCode).textbox('setValue', data.row['code']);
                $('#'+d_date).datebox('setValue', data.row['date']);
                $('#'+d_schoolNo).textbox('setValue', data.row['school_no']);
                $('#'+d_schoolName).combobox('setValue', data.row.school_id).combobox('disable');
                $('#'+d_studentNo).textbox('setValue', data.row['student_no']);
                $('#'+d_studentName).combobox('setValue', data.row.student_name);
                $('#'+d_examName).combogrid('setValue', data.row['exam_id']);
                $('#'+d_classType).textbox('setValue', data.row['class_type_name']);
                $('#'+d_degree).textbox('setValue', data.row['degree']);
                $('#'+d_fee).textbox('setValue', data.row['fee']);
                $('#'+d_feetMode).combobox('setValue', data.row['fee_mode_id']);
                $('#'+d_isReceive).combobox('setValue', data.row['is_receive']);
                $('#'+d_paperReceipt).textbox('setValue', data.row['paper_receipt']);
                $('#'+d_recorder).textbox('setValue', data.row['recorder']);
                $('#'+d_remark).textbox('setValue', data.row.remark);
                $('#'+d_uid).val(data.row.id);
            }else {
                $.messager.alert('提示', data.msg, 'info');
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            $.messager.alert('提示', "请求失败。错误码：{0}({1})".format(jqXHR.status, errorThrown), 'info');
        });
    }

    function save() {

        // 校验数据是否合法
        var oStuName = $('#'+d_studentName);
        var studentName = $.trim(oStuName.textbox('getValue'));
        var studentId = oStuName.combobox('getValue');
        if(!studentName || !studentId) {
            $.messager.alert({title:'提示', msg:'“学员姓名”不能为空，且为已经报名学员！', icon: 'info',
                fn:function () {
                    $('#'+d_schoolName).textbox('textbox').focus();
                }
            });
            return false;
        }

        var examId = $('#'+d_examName).combogrid('getValue');
        if(!examId) {
            $.messager.alert({title:'提示', msg:'请选“考级名称及等级”！', icon: 'info',
                fn:function () {
                    $('#'+d_examName).textbox('textbox').focus();
                }
            });
            return false;
        }


        var fee = $('#'+d_fee).textbox('getValue');
        if(!fee){
            $.messager.alert({title:'提示', msg:'请输入“考级费”！', icon: 'info',
                fn:function () {
                    $('#'+d_fee).textbox('textbox').focus();
                }
            });
            return false;
        }


        var feeModeId = $('#'+d_feetMode).combobox('getValue');
        if(!feeModeId) {
            $.messager.alert({title:'提示', msg:'请输入“收费方式”。', icon: 'info',
                fn:function () {
                    $('#'+d_feetMode).textbox('textbox').focus();
                }
            });
            return false;
        }

        var paperReceipt = $('#'+d_paperReceipt).textbox('getValue');
        if(paperReceipt.length > 15) {
            $.messager.alert({title:'提示', msg:'“收据号”不能超过15字符。', icon: 'info',
                fn:function () {
                    $('#'+d_paperReceipt).textbox('textbox').focus();
                }
            });
            return false;
        }

        var remark = $('#'+d_remark).textbox('getValue');
        if(remark.length > 40) {
            $.messager.alert({title:'提示', msg:'“备注”不能超过40字符。', icon: 'info',
                fn:function () {
                    $('#'+d_remark).textbox('textbox').focus();
                }
            });
            return false;
        }

        // 打包数据
        var data = {id: $('#'+d_uid).val(),
            date: $('#'+d_date).datebox('getValue'),
            school_id: $('#'+d_schoolName).combobox('getValue'),
            student_id: studentId,
            student_name: studentName,
            exam_id: examId,
            fee: fee,
            fee_mode_id: feeModeId,
            is_receive: $('#'+d_isReceive).combobox('getValue'),
            paper_receipt: paperReceipt,
            remark: remark
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

    function isOpen() {
        return document.getElementById(id);
    }
}
