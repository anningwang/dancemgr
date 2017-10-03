/**
 * 实现 收费单——演出 和 普通 功能。
 *  @author Anningwang
 */
'use strict';

/**
 * 添加或者打开 收费单（演出） Tab页
 * @param divId             父节点Tabs对象ID
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabFeeShowDatagrid(divId, title, tableId, condition) {
    var parentDiv = $('#'+divId);
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

        var opts = {
            'queryText': '姓名：',
            'queryPrompt': '姓名拼音首字母查找',
            'who': 'DcShowRecpt',
            'danceModuleName': 'DcShowRecpt',
            'addEditFunc': danceAddReceiptShowDetailInfo,
            'page': '/static/html/_receipt_show.html',     // 上述函数的参数
            'columns': [[
                {field: 'ck', checkbox:true },
                {field: 'show_recpt_no', title: '演出收费单编号', width: 140, align: 'center'},
                {field: 'show_name', title: '演出名称', width: 110, align: 'center'},
                {field: 'school_name', title: '分校名称', width: 110, align: 'center'},
                {field: 'student_no', title: '学号', width: 140, align: 'center'},
                {field: 'student_name', title: '学员姓名', width: 80, align: 'center'},
                {field: 'deal_date', title: '收费日期', width: 90, align: 'center'},
                {field: 'join_fee', title: '报名费', width: 80, align: 'center'},
                {field: 'other_fee', title: '其他费', width: 80, align: 'center'},
                {field: 'total', title: '费用合计', width: 80, align: 'center'},
                {field: 'fee_mode', title: '收费方式', width: 70, align: 'center'},
                {field: 'remark', title: '备注', width: 90, align: 'center'},
                {field: 'recorder', title: '录入员', width: 90, align: 'center'}
            ]]
        };

        danceCreateCommDatagrid(tableId, '/dance_receipt_show', condition, opts)
    }
}


////////////////// 收费单（演出）详细信息 begin ////////////////////////////////////////////////////////////////////////
/**
 * 查看/新增 收费单（学费） 详细信息
 * @param page          学员详细信息页面
 * @param url           查询信息所用url
 * @param condition     查询条件。
 *      school_id     分校id，取回范围： all  or 具体分校id
 * @param uid           单据id（收费单id），新增时，可以不传递此参数。
 */
function danceAddReceiptShowDetailInfo( page, url, condition, uid) {
    var title = '收费单（演出）详细信息';
    uid = uid || 0;     // 第一次进入 学生详细信息页面 uid 有效，上下翻页时，无法提前获取上下记录的uid
    if (uid <= 0) {
        title +='[新增]'
    }

    var no = -2;    // 收费单序号，方便翻页。传递 -2 则根据 uid 查询序号

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
                onSelectPage:function(pageNumber, pageSize){
                    if (uid> 0) {
                        no = pageNumber;
                        doAjaxReceiptDetail();
                    }
                }
            }).attr('id', pagerFee+=uid);        // 更新ID
            $('#'+dgRecptComm).attr('id', dgRecptComm+=uid).datagrid({  // 收费单（学费） ||||||||||||||||||||||
                onClickCell: dgRecptCommClickCell,
                onEndEdit: dgRecptCommEndEdit,
                onAfterEdit: dgRecptAfterEdit
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
        var cond = {'receipt_id': uid, 'page': no, 'rows': 1};
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

                // 更新 收费单（学费）基本信息
                $('#'+dgRecptComm).datagrid('updateRow',{ index: 0,
                    row: {c2: data.row['show_recpt_no'],
                        c4: data.row['school_name'],
                        c6: data.row['fee_mode'],
                        school_id: data.row.school_id,
                        fee_mode_id: data.row.fee_mode_id
                    }
                }).datagrid('updateRow', { index: 1,
                    row: {c2: data.row['student_no'],
                        c4: data.row['student_name'],
                        c6: data.row['receivable_fee'],
                        student_id: data.row.student_id
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
                    row: {c2: data.row['remark']
                    }
                });
                dcSetArrearageStyle();
                dgLoadData('#'+dgShow, data['showDetailFee']);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var msg = $.format("请求失败。错误码：{0}({1}) ", [jqXHR.status, errorThrown]);
            $.messager.alert('提示', msg, 'info');
        });
    }

    /**
     * 新增单据 —— 收费单（演出）
     */
    function newReceipt() {
        var num = 3;
        var i;

        $('#'+dgShow).datagrid('loadData', []);
        for(i = 0; i <num; i++ ) {
            $('#'+dgShow).datagrid('appendRow', {});
        }

        // 更新 收费单（演出）基本信息
        $('#'+dgRecptComm).datagrid('updateRow',{ index: 0,
            row: {c2: '[自动生成]',
                c6: danceFormatter(new Date())
            }
        }).datagrid('updateRow', { index: 1,
            row: {c2:  '[关联学员姓名]',
                c4: '',
                c6: '',
                student_id: undefined
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

        $('#'+btnAdd).linkbutton('disable');
        oldDetails = {};
        uid = 0;
    }

    /**
     * 收费单（学费） 单元格点击事件
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
                $(eds.target).combobox({
                    editable:false,panelHeight:'auto',
                    valueField: 'school_id',textField: 'school_name',
                    data:filterSchool(schoollist)
                }).combobox('setValue', row.school_id);
            }else if (index === 1) {
                var edname = $(this).datagrid('getEditor', {index:index,field:'c4'});
                $(edname.target).combobox({
                    valueField: 'name', textField: 'name', hasDownArrow: false,
                    onChange: function autoComplete (newValue,oldValue) {
                        //console.log('newValue=' + newValue + ' oldValue=' + oldValue);
                        var cond = $.trim(newValue);
                        var dcCond = {'name': cond, 'is_training': '是', 'school_id': condition.school_id };
                        if (newValue.length > 1) {
                            $.post('/api/dance_student_query',dcCond, function(data){
                                $(edname.target).combobox('loadData', data);
                            },'json');
                        }
                    },
                    onClick:function (record) {
                        //console.log(record);
                        var dg = $('#'+dgRecptComm);
                        setDgCellTextWithRowData(dg, 1, 'c2', record.code);
                        var row = $(dg).datagrid('getSelected');
                        row.student_id = record.id;
                        row.c4 = record.name;

                        $.ajax({
                            method: 'POST',
                            url: '/api/dance_class_by_student',
                            async: true,
                            dataType: 'json',
                            data: {student_no: record.code }
                        }).done(function(data) {
                            if (data.errorCode == 0) {
                                dgLoadData('#'+dgShow, data.cls, true);
                            } else {
                                $.messager.alert('提示', data.msg, 'info');
                            }
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            var msg = $.format("请求失败。错误码：{0}({1}) ", [jqXHR.status, errorThrown]);
                            $.messager.alert('提示', msg, 'info');
                        });
                    }
                }).combobox('setValue', row.c4);
            }

            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            dgParam[dgRecptComm].idx = index;
        }
    }

    function dgRecptCommEndEdit(index, row){
        var dg = $('#'+dgShow);
        if (index === 0) {
            var ed = $(dg).datagrid('getEditor', { index: index, field: 'c4' });
            row.c4 = $(ed.target).combobox('getText');
            row.school_id = parseInt($(ed.target).combobox('getValue'));
        }
    }

    function dgRecptAfterEdit() {
        dcSetArrearageStyle();    // 设置 欠费金额单元格的样式
    }


    /**
     * 收费单（学费）详细页面 新增/修改。 对某个表格重新加载数据，并计算收费单费用。
     * @param dg                表格
     * @param data              表格数据
     * @param calcFee           是否计算收费单基本情况中的费用， 可选参数，传递该参数则计算费用
     */
    function dgLoadData(dg, data, calcFee) {
        var diffWanted = 0;
        var diffReal = 0;
        var diffArrearage = 0;

        if (calcFee) {
            var rows = $(dg).datagrid('getRows');
            for(var m = 0; m < rows.length; m++){
                if (rows[m].cost && rows[m].term ){
                    diffWanted -= parseFloat(rows[m].total);
                    diffReal -= parseFloat(rows[m].real_fee);
                    diffArrearage -= parseFloat(rows[m].arrearage);
                }
            }
            dcCalcFeeByStudy(diffWanted, diffReal, diffArrearage);
        }

        $(dg).datagrid('loadData', data);
        var num = 3;
        var len = data.length;
        for(var i = 0; i < num - len; i++ ) {
            $(dg).datagrid('appendRow', {});
        }
    }

    /**
     * 班级——学费 编辑, 单元格点击事件。
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
            var editors = dg.datagrid('getEditors', index);

            // 演出名称
            var edx =  $(dg).datagrid('getEditor', {index:index,field:'show_name'});
            $(edx.target).combobox({
                url: '/api/dance_show_name_get',
                // iconAlign: 'left',
                iconWidth: 25,
                icons: [{
                    iconCls:'icon-add',
                    handler: function(e){
                        $(document.body).append('<div id="danceShowWindow"></div>');
                        $('#danceShowWindow').panel({
                            //width:900, height:700,
                            href:'/static/html/_dc_add_edit_show.html',
                            onDestroy: function () {
                                var dg = $('#'+dgShow);
                                $(dg).datagrid('reload');
                            }
                        });
                        $(e.data.target).textbox('setValue', 'Something added!');
                    }
                },{
                    iconCls:'icon-edit',
                    handler: function(e){
                        $(e.data.target).textbox('clear');
                    }
                }],
                onClick: dgShowOnClickShowName
            }).combobox('setValue', row['show_id']);

            var ed = $(dg).datagrid('getEditor', {index:index,field:field});
            if (ed){
                ($(ed.target).data('textbox') ? $(ed.target).textbox('textbox') : $(ed.target)).focus();
            }
            dgParam[dgShow].idx = index;
        }
    }

    function dgShowEndEdit(index, row){
        //console.log('onEndEdit', row);
        var dg = $('#'+dgShow);
        var ed = $(dg).datagrid('getEditor', { index: index, field: 'show_name' });
        row.show_name = $(ed.target).combobox('getText');

        ed = $(dg).datagrid('getEditor', { index: index, field: 'is_rcv_text' });
        row.is_rcv_text = $(ed.target).combobox('getText');
    }

    function dgShowAfterEdit(index,row,changes) {
        var dg = $('#'+dgShow);
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
    }

    /**
     * 设置 学费欠费 的样式。 当有欠费时，设置为红色背景。
     * @param val       欠费数额
     */
    function dcSetArrearageStyle(val) {
        var dgRc = $('#'+dgRecptComm);
        val = val || apiGetDgCellText(dgRc, 3, 'c4');
        if (val > 0) {
            setDgCellColorEx(dgRc, 3, 'c4', 'white', 'red');
        } else {
            clearDgCellColorEx(dgRc, 3, 'c4');
        }
    }

    /**
     * 教材费 表格，更新 “教材费”总金额。 --- 同时更新 收费单 基本信息中的 教材费、费用合计、实收费合计
     * @param index     行索引，从0开始
     * @param parms     单价，可选参数，例如： {price: 50, num: 1}
     */
    function dgTmUpdateCell(index, parms) {
        var dg = $('#'+dgTm);
        var rows = dg.datagrid('getRows');
        if (rows.length < index + 1) {  return; }
        var row = rows[index];
        var oldFee = row.fee;

        if (parms && (parms.price || parms.price === '')) {
            row.tm_price_sell = parms.price;
        } else {
            var edPrice = $(dg).datagrid('getEditor', {index: index, field: 'tm_price_sell'});  // 教材 单价
            if (edPrice) {
                row.tm_price_sell = $(edPrice.target).textbox('getValue');
            }
        }

        if (parms && (parms.num || parms.num === '')) {
            row.dt_num = parms.num;
        } else {
            var edNum = $(dg).datagrid('getEditor', {index: index, field: 'dt_num'});       // 教材 数量
            if (edNum) {
                row.dt_num = parseInt($(edNum.target).textbox('getValue'));
            }
        }

        if (row.tm_price_sell && row.dt_num){
            row.fee = dcTrimZero(row.tm_price_sell * row.dt_num);
            setDgCellTextEx(dg, index, 'fee', row.fee);
        } else {
            row.fee = '';
            setDgCellTextEx(dg, index, 'fee', row.fee);
        }

        // 同时更新 收费单 基本信息中的 教材费、费用合计、实收费合计
        if (oldFee != row.fee)
        {
            var oldFeeVal = (oldFee ? parseFloat(oldFee) : 0);
            var newFeeVal = (row.fee ? parseFloat(row.fee) : 0);
            var difference = newFeeVal - oldFeeVal;
            dcCalcFeeByTm(difference);
        }
    }

    /**
     * 根据教材费差值，更新 收费单（学费）的费用：教材费、费用合计、实收费合计
     * @param difference        教材费差值： 正 加金额，负 减金额。
     */
    function dcCalcFeeByTm(difference) {
        var dg = $('#'+dgRecptComm);
        var val;
        val = (val = apiGetDgCellText(dg, 2, 'c2')) ? parseFloat(val)+difference : difference;
        setDgCellTextWithRowData(dg, 2, 'c2', dcTrimZero(val)); // 教材费
        val = (val = apiGetDgCellText(dg, 2, 'c6')) ? parseFloat(val)+difference : difference;
        setDgCellTextWithRowData(dg, 2, 'c6', dcTrimZero(val)); // 费用合计
        val = (val = apiGetDgCellText(dg, 3, 'c2')) ? parseFloat(val)+difference : difference;
        setDgCellTextWithRowData(dg, 3, 'c2', dcTrimZero(val)); // 实收费合计
    }

    /**
     * 根据 其他费 差值，更新 收费单（学费）的费用：教材费、费用合计、实收费合计
     * @param difference        教材费差值： 正 加金额，负 减金额。
     */
    function dcCalcFeeByOth(difference) {
        var dg = $('#'+dgRecptComm);
        var val;
        val = (val = apiGetDgCellText(dg, 2, 'c4')) ? parseFloat(val)+difference : difference;
        setDgCellTextWithRowData(dg, 2, 'c4', dcTrimZero(val)); // 其他费
        val = (val = apiGetDgCellText(dg, 2, 'c6')) ? parseFloat(val)+difference : difference;
        setDgCellTextWithRowData(dg, 2, 'c6', dcTrimZero(val)); // 费用合计
        val = (val = apiGetDgCellText(dg, 3, 'c2')) ? parseFloat(val)+difference : difference;
        setDgCellTextWithRowData(dg, 3, 'c2', dcTrimZero(val)); // 实收费合计
    }

    /**
     * 班级——学费 表格，根据 学期长度，更新 实收学费，应收学费等单元格
     * @param index     要更新的行索引，从0开始
     * @param value     需求长度 的当前值
     */
    function dgShowUpdateCellByTerm(index,value) {
        var dg = $('#'+dgShow);
        var rows = dg.datagrid('getRows');
        if (rows.length < index + 1) {  return; }
        var row = rows[index];
        if (row.cost) {
            var oldWanted = row.total;
            var oldReal = row.real_fee;
            var oldArrearage = row.arrearage;

            row.sum = dcTrimZero(row.cost * value);     // 优惠前学费
            row.discount = row.discount_rate ? Math.round(row.sum *(1-row.discount_rate)) : '';
            if (row.discount === 0) {
                row.discount = '';
            }
            row.total = dcTrimZero(row.sum - (row.discount ? row.discount : 0));    // 应收学费
            row.real_fee = row.total; // 实收学费
            row.arrearage = row.total - row.real_fee;   // 学费欠费
            var edRealFee = $(dg).datagrid('getEditor', {index: index, field: 'real_fee'});
            if (edRealFee) {
                edRealFee.target.textbox('setValue', row.real_fee);
            } else {
                setDgCellText(dg, index, 'real_fee', row.real_fee);
            }
            setDgCellText(dg, index, 'sum', row.sum);
            setDgCellText(dg, index, 'total', row.total);
            setDgCellText(dg, index, 'arrearage', row.arrearage);
            var edDiscount = $(dg).datagrid('getEditor', {index: index, field: 'discount'});
            if (edDiscount) {
                $(edDiscount.target).textbox('setValue', row.discount);
            } else {
                setDgCellText(dg, index, 'discount', row.discount);
            }

            // 更新 收费单（学费）中的相关费用：应收学费、费用合计、实收费合计、学费欠费
            var oldWantedVal = (oldWanted ? parseFloat(oldWanted) : 0);
            var newWantedVal = (row.total ? parseFloat(row.total) : 0);
            var diffWanted = newWantedVal - oldWantedVal;
            var oldRealVal = (oldReal ? parseFloat(oldReal) : 0);
            var newRealVal = (row.real_fee ? parseFloat(row.real_fee) : 0);
            var diffReal = newRealVal - oldRealVal;
            var oldArrearageVal = (oldArrearage ? parseFloat(oldArrearage) : 0);
            var newArrearageVal = (row.arrearage ? parseFloat(row.arrearage) : 0);
            var diffArrearage = newArrearageVal - oldArrearageVal;
            dcCalcFeeByStudy(diffWanted,diffReal, diffArrearage);
        }
    }

    /**
     * 根据班级——学费，更新 收费单（学费）的费用：应收学费、费用合计、实收费合计、学费欠费
     * @param diffWanted        应收学费 差值。正 加金额，负 减金额。下同
     * @param diffReal          实收费合计 差值
     * @param diffArrearage     学费欠费 差值
     */
    function dcCalcFeeByStudy(diffWanted, diffReal, diffArrearage) {
        var dg = $('#'+dgRecptComm);
        var val;
        val = (val = apiGetDgCellText(dg, 1, 'c6')) ? parseFloat(val)+diffWanted : diffWanted;
        setDgCellTextWithRowData(dg, 1, 'c6', dcTrimZero(val)); // 应收学费
        val = (val = apiGetDgCellText(dg, 2, 'c6')) ? parseFloat(val)+diffWanted : diffWanted;
        setDgCellTextWithRowData(dg, 2, 'c6', dcTrimZero(val)); // 费用合计
        val = (val = apiGetDgCellText(dg, 3, 'c2')) ? parseFloat(val)+diffReal : diffReal;
        setDgCellTextWithRowData(dg, 3, 'c2', dcTrimZero(val));   // 实收费合计
        val = (val = apiGetDgCellText(dg, 3, 'c4')) ? parseFloat(val)+diffArrearage : diffArrearage;
        setDgCellTextWithRowData(dg, 3, 'c4', dcTrimZero(val));   // 学费欠费

        dcSetArrearageStyle();
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
     * 根据分校id（内部使用分校编号）过滤班级。 新增记录时，选择分校后，只能选择选定分校的班级。
     * @param classList     班级列表。可能属于多个分校。
     * @returns {*}
     */
    function filterClassBySchool(classList) {
        var school_id = apiGetDgCellText('#'+dgRecptComm, 0, 'school_id');

        var class_no_filter = null;
        for(var m = 0; m < schoollist.length; m++){
            if(school_id === schoollist[m].school_id){
                class_no_filter = schoollist[m]['school_no'] + '-BJ-';
                break;
            }
        }

        var rows = [];
        for (var i = 0; i < classList.length; i++) {
            if(classList[i].class_no.indexOf(class_no_filter) === 0){
                rows.push(classList[i]);
            }
        }
        return rows;
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
            var msg = $.format("请求失败。错误码：{0}({1}) ", [jqXHR.status, errorThrown]);
            $.messager.alert('提示', msg, 'info');
        });
        
    }

    /**
     * 班级——学费 表选中某个班级事件
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
            $.messager.alert('错误', '未找到演出信息[id=' + show_id + ']！', 'error');
        }

        var idx = dgParam[dgShow].idx;
        var oldIdx = idx;
        for(var i=0; i< dcShowCfg['shows'][j].cfg.length; i++){
            var addRow = {cost: dcShowCfg['shows'][j].cfg[i].cost,
                fee_item: dcShowCfg['shows'][j].cfg[i].fee_item,
                fee_item_id: dcShowCfg['shows'][j].cfg[i].fee_item_id,
                is_rcv: 1,
                is_rcv_text: '是',
                show_id: row.show_id,
                show_name: row.show_name};
            if(idx === oldIdx){
                var tmpRow = {};
                $.extend(tmpRow, addRow);
                setTimeout(function () {
                    $(dg).datagrid('updateRow', { index: oldIdx, row: tmpRow});
                    $(dg).datagrid('mergeCells', {
                        index: oldIdx,
                        field: 'show_name',
                        rowspan: dcShowCfg['shows'][j].cfg.length,
                        type: 'body'
                    });
                    dgParam[dgShow].idx = undefined;
                }, 30);

                // $(dg).datagrid('updateRow', { index: idx, row: addRow});

            } else if (idx >= ($(dg).datagrid('getRows').length)) {
                $(dg).datagrid('appendRow', addRow);
            } else {
                $(dg).datagrid('insertRow',{index: idx, row: addRow});
            }
            idx++;
        }

        var rowIdx = 'r' + oldIdx;
        if(dgParam[dgShow].mergeCell === undefined){
            dgParam[dgShow].mergeCell = {};
        }
        dgParam[dgShow].mergeCell[rowIdx] = {index: oldIdx, span: dcShowCfg['shows'][j].cfg.length};
/*
        $(dg).datagrid('mergeCells', {
            index: oldIdx,
            field: 'show_name',
            rowspan: dcShowCfg[j].cfg.length,
            type: 'body'
        });*/
    }

    /**
     * 保存 收费单（学费）详细信息
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
            url: '/dance_receipt_study_modify',
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
            var msg = $.format("请求失败。错误码：{0}({1}) ", [jqXHR.status, errorThrown]);
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
            $.messager.alert({ title: '提示',icon:'info', msg: '请输入学员姓名！',
                fn: function(){
                    //dgReceiptClickCell(1, 'c4', stuName);
                }
            });
            return false;
        }

        var realFee = apiGetDgCellText(dg, 3, 'c2');
        var arrearage = apiGetDgCellText(dg, 3, 'c4');
        if (realFee == 0 && arrearage == 0 ) {
            $.messager.alert({ title: '提示',icon:'info', msg: '实收费合计为 0，请输入学费或者教材费！'});
            return false;
        }

        return true;
    }

    /**
     * 打包 收费单（学费）
     * @returns {{row: {}, class_receipt: Array, teach_receipt: Array, other_fee: Array}}
     */
    function packageReceipt() {

        var i;
        var dgRecpt = $('#'+dgRecptComm);
        var rows = dgRecpt.datagrid('getRows');
        var recpt = {row: {}, class_receipt: [], teach_receipt: [], other_fee: []};
        recpt.row.id = oldDetails.row ? oldDetails.row.id : 0;
        recpt.row.school_id = rows[0].school_id;
        recpt.row.school_name = rows[0].c4;
        recpt.row.deal_date = rows[0].c6;
        recpt.row.student_id = rows[1].student_id;
        recpt.row.student_name = rows[1].c4;
        recpt.row.receivable_fee = rows[1].c6;
        recpt.row.teaching_fee = rows[2].c2;
        recpt.row.other_fee = rows[2].c4;
        recpt.row.total = rows[2].c6;
        recpt.row.real_fee = rows[3].c2;
        recpt.row.arrearage = rows[3].c4;
        recpt.row.counselor = rows[3].c6;
        recpt.row.fee_mode = rows[4].c2;
        recpt.row.paper_receipt = rows[4].c4;
        recpt.row.remark = rows[5].c2;

        var dgSty = $('#'+dgShow);
        var data = dgSty.datagrid('getData');
        for(i = 0; i< data.rows.length; i++) {
            if (data.rows[i].term) {
                recpt.class_receipt.push(data.rows[i]);
            }
        }

        var tm = $('#'+dgTm).datagrid('getRows');
        for(i = 0; i < tm.length; i++){
            if (tm[i].tm_name){
                recpt.teach_receipt.push(tm[i]);
            }
        }

        var oth = $('#'+dgOtherFee).datagrid('getRows');
        for(i = 0; i < oth.length; i++){
            if (oth[i].tm_name){
                recpt.other_fee.push(oth[i]);
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
        if (rowToDel.term || rowToDel.tm_name || rowToDel.fee_item) { // 本行有数据，询问是否要删除
            $.messager.confirm('确认删除', '确认删除第 '+(idx+1)+' 行数据吗？', function(r){
                if (r){
                    dcCalcFeeAfterDel(dg, rowToDel);
                    dg.datagrid('deleteRow', idx);
                }
            });
        } else {
            dcCalcFeeAfterDel(dg, rowToDel);
            dg.datagrid('deleteRow', idx);
        }
    }

    /**
     * 当删除表格（班级——学费，教材费、其他费）行时，更新收费单（学费）的费用。
     * @param dg
     * @param row
     */
    function dcCalcFeeAfterDel(dg, row) {
        var id = $(dg).attr('id');
        if (id === dgShow) {
            if(row.term){
                var diffWanted = 0 - parseFloat((row.total));
                var diffReal = 0 - parseFloat(row.real_fee);
                var diffArrearage = 0 - parseFloat(row.arrearage);
                dcCalcFeeByStudy(diffWanted, diffReal, diffArrearage);
            }
        } else if (id === dgTm) {
            if(row.fee) {
                var tmFee = 0 - parseFloat(row.fee);
                dcCalcFeeByTm(tmFee);
            }
        } else if (id === dgOtherFee) {
            if (row.real_fee){
                var othDiff = 0 - parseFloat(row.real_fee);
                dcCalcFeeByOth(othDiff);
            }
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
        {'c4': 'combobox'}, // 姓名， 收费方式
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
}
////////////////  收费单（演出） 详细信息 end //////////////////////////////////////////////////////////////////////////



/**
 * 添加或者打开 收费单（普通） Tab页
 * @param divId             父节点Tabs对象ID
 * @param title             新打开/创建 的 Tab页标题
 * @param tableId           Tab页内的Datagrid表格ID
 * @param condition         查询条件
 */
function danceAddTabFeeOtherDatagrid(divId, title, tableId, condition) {
    var parentDiv = $('#'+divId);
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

        var opts = {
            'queryText': '姓名：',
            'queryPrompt': '姓名拼音首字母查找',
            'who': 'DanceReceipt',
            'danceModuleName': 'DanceReceipt',
            'addEditFunc': danceAddReceiptStudyDetailInfo,
            'page': '/static/html/_receipt_study.html',     // 上述函数的参数
            'columns': [[
                {field: 'ck', checkbox:true },
                {field: 'show_recpt_no', title: '演出收费单编号', width: 140, align: 'center'},
                {field: 'show_name', title: '演出名称', width: 110, align: 'center'},
                {field: 'school_name', title: '分校名称', width: 110, align: 'center'},
                {field: 'student_no', title: '学号', width: 140, align: 'center'},
                {field: 'student_name', title: '学员姓名', width: 80, align: 'center'},
                {field: 'deal_date', title: '收费日期', width: 90, align: 'center'},
                {field: 'join_fee', title: '报名费', width: 80, align: 'center'},
                {field: 'other_fee', title: '其他费', width: 80, align: 'center'},
                {field: 'total', title: '费用合计', width: 80, align: 'center'},
                {field: 'fee_mode', title: '收费方式', width: 70, align: 'center'},
                {field: 'remark', title: '备注', width: 90, align: 'center'},
                {field: 'recorder', title: '录入员', width: 90, align: 'center'}
            ]]
        };

        danceCreateCommDatagrid(tableId, '/dance_receipt_study', condition, opts)
    }
}
