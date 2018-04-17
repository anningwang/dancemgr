/**
 * Created by WXG on 2017/10/17.
 * 左侧功能导航树及入口函数
 */

'use strict';

$(function() {
    $('#treeStudent').tree({    // 学员管理
        animate:true,lines:true,
        onClick: function(node){
            var root = getRootNode(this, node);
            var tableRootId = this.id + root.id;
            var entrance = {
                10: {fn: danceAddTabStudentDatagrid},   // 学员列表
                30: {fn: danceAddTabFeeStudyDatagrid},  // 收费单（学费）
                40: {fn: danceAddTabFeeShowDatagrid},   // 收费单（演出）
                50: {fn: danceAddTabFeeOtherDatagrid},  // 收费单（普通）
                70: {fn: danceAddTabUpgClass},          // 集体续班
                80: {fn: danceAddTabClassCheckIn},      // 班级考勤
                90: {fn: danceAddTabReceiptStatByMonth}     // 收费月统计
            };

            if(root.id in entrance){
                entrance[root.id].fn(root.text, tableRootId, node.attributes);
            } else if (root.id == 60) {   // 班级学员统计
                danceAddTabClassStudentStat(root.text, node.attributes);
            } else {
                $.messager.alert('提示', ' 制作中...', 'info');
            }
        }
    });

    $('#treeTeacher').tree({    // 员工与老师
        animate:true,lines:true,
        onClick: function(node){
            var root = getRootNode(this, node);
            var tableRootId = this.id + root.id;
            console.log(root.text, ' tableRootId=', tableRootId);

            if(root.id == 10){
                danceAddTabTeacher(root.text, tableRootId, node.attributes);
            }else{
                $.messager.alert('提示', ' 制作中...', 'info');
            }
        }
    });

    $('#treeSchool').tree({     // 教学管理
        animate:true,lines:true,
        onClick:function (node) {
            var root = getRootNode(this, node);
            var entrance = {
                10: {fn: danceAddTabClassDatagrid},     // 班级信息
                20: {fn: danceAddTabCourse},            // 课程表
                30: {fn: danceAddTabRoom},              // 教室列表
                40: {fn: danceAddTabNotepad},           // 记事本
                2001:   {fn: danceAddTabCourseList}
            };

            if(node.id in entrance){
                entrance[node.id].fn(node.text, this.id + node.id, node.attributes);
            }else if(root.id in entrance){
                entrance[root.id].fn(root.text, this.id + root.id, node.attributes);
            } else {
                $.messager.alert('提示', ' 制作中...', 'info');
            }
        }
    });

    $('#treeAsset').tree({  // 物品管理
        animate:true,lines:true,
        onClick: function(node){
            var root = getRootNode(this, node);
            var tableRootId = this.id + root.id;
            console.log(root.text, ' tableRootId=', tableRootId);
            $.messager.alert('提示', ' 制作中...', 'info');
        }
    });

    $('#treeFinance').tree({    // 财务管理
        animate:true,lines:true,
        onClick: function(node){

            var root = getRootNode(this, node);
            var tableRootId = this.id + root.id;
            console.log(root.text, ' tableRootId=', tableRootId);

            var entrance = {
                2: {fn: danceAddTabHouseRent},      //  房租
                4: {fn: danceAddTabExpense}         //  其他支出
            };

            var openChild = {   // 仅仅打开子节点
            };

            if(root.id in entrance){
                entrance[root.id].fn(root.text, tableRootId, node.attributes);
            }else if(node.id in openChild){
                dcExpandOrCollapseNode('treeFinance', node);
            } else {
                $.messager.alert('提示', ' 制作中...', 'info');
            }
        }
    });

    $('#treeDb').tree({     // 数据管理
        animate:true,lines:true,
        onClick:function (node) {
            var tableId = this.id + node.id;
            var entrance = {
                51: {fn: danceAddTabFeeItem},               // 收费项目
                52: {fn: danceAddTabTeachingMaterial},      // 教材信息
                53: {fn: danceAddTabFeeMode},               // 收费方式
                54: {fn: danceAddTabClassType},             // 班级类型
                55: {fn: danceAddTabDegree},                // 文化程度
                56: {fn: danceAddTabJobTitle},              // 职位信息
                57: {fn: danceAddTabIntention},             // 意向程度
                58: {fn: danceAddTabInfoSrc},               // 信息来源
                59: {fn: danceAddTabConsultMode},           // 咨询方式
                3:  {fn: danceAddTabSchool},                // 分校信息
                4:  {fn: danceAddTabUsers},                 // 用户管理
                511:{fn: danceAddTabTestButtons},           // 表格行内菜单
                512:{fn: danceAddTabExpenseType}            // 支出类别
            };

            var openChild = {   // 仅仅打开子节点
                5: {}
            };

            if (node.text == '数据库备份') {
                danceOpenTab(node.text, '/static/html/_db_backup.html')
            }else if(node.id == 510){
                danceOpenTab(node.text, '/static/html/_pre_student_details.html')
            }else if(node.id in entrance){
                entrance[node.id].fn(node.text, tableId);
            }else if(node.id in openChild){
                dcExpandOrCollapseNode('treeDb', node);
            } else {
                $.messager.alert('提示', ' 制作中...', 'info');
            }
        }
    });

    dcLoadTree();
    

    $('#danceTabs').tabs({
        fit:true,border:false,plain:false,
        onBeforeClose: dcBeforeCloseTab
    }).tabs('add',{
        title:'主页', iconCls: 'icon-dc-home',
        content:'<div style="background:url(/static/img/hill-water.jpg) no-repeat fixed center; width: 100%; height: 100%"></div>',
        closable:false
    });
});


// 关闭Tab页前的处理
function dcBeforeCloseTab(title){   // , index
    if(title === '课程表'){
        $('#dance-course-mm').menu('destroy');
        /*
         var target = this;
         $.messager.confirm('确认','是否要关闭页面 '+title,function(r){
         if (r){
         var opts = $(target).tabs('options');
         var bc = opts.onBeforeClose;
         opts.onBeforeClose = function(){};  // allowed to close now
         $(target).tabs('close',index);
         opts.onBeforeClose = bc;  // restore the event function
         }
         });
         return false;	// prevent from closing
         */
        return true;
    }else
        return true;
}


function getRootNode(tree, curNode) {
    var root = curNode;
    var parentNode = $(tree).tree('getParent', root.target);
    while (parentNode) {
        root  = parentNode;
        parentNode = $(tree).tree('getParent', root.target);
    }
    return root;
}

/**
 * 点击tree节点，打开 或者 关闭 该节点下的 子树节点
 * @param treeId        tree id
 * @param node          节点
 */
function dcExpandOrCollapseNode(treeId, node) {
    var oTree = $('#'+treeId);
    if ( oTree.tree('isLeaf', node.target )) {  // is a leaf
        // do nothing
    } else {    // not a leaf
        if (node.state == 'open') {
            oTree.tree('collapse', node.target);
        } else {
            oTree.tree('expand', node.target);
        }
    }
}
