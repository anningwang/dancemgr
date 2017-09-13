
'use strict';


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
        var content = '<table id=' + tableId + '></table>';
        $(parentDiv).tabs('add', {
            title: title,
            content: content,
            closable: true
        });
        danceCreateEditedDatagrid(tableId, '/dance_fee_item', opts_feeitem);
    }
}