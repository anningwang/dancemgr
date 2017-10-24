/**
 * Created by Administrator on 2017/10/17.
 */

'use strict';

$(function() {
    $('#treeStudent').tree({
        animate:true,lines:true,
        onClick: function(node){
            var root = getRootNode(this, node);
            var tableRootId = this.id + root.id;
            var entrance = {
                10: {fn: danceAddTabStudentDatagrid},   // 学员列表
                30: {fn: danceAddTabFeeStudyDatagrid},
                40: {fn: danceAddTabFeeShowDatagrid},
                50: {fn: danceAddTabFeeOtherDatagrid},
                70: {fn: danceAddTabUpgClass},
                80: {fn: danceAddTabClassCheckIn}
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

    $('#treeTeacher').tree({
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

    $('#treeSchool').tree({
        animate:true,lines:true,
        onClick:function (node) {
            var root = getRootNode(this, node);
            var entrance = {
                10: {fn: danceAddTabClassDatagrid},     // 班级信息
                20: {fn: danceAddTabCourse},
                30: {fn: danceAddTabRoom},
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

    $('#treeAsset').tree({
        animate:true,lines:true,
        onClick: function(node){
            var root = getRootNode(this, node);
            var tableRootId = this.id + root.id;
            console.log(root.text, ' tableRootId=', tableRootId);
            $.messager.alert('提示', ' 制作中...', 'info');
        }
    });

    $('#treeFinance').tree({
        animate:true,lines:true,
        onClick: function(node){
            var root = getRootNode(this, node);
            var tableRootId = this.id + root.id;
            console.log(root.text, ' tableRootId=', tableRootId);
            $.messager.alert('提示', ' 制作中...', 'info');
        }
    });

    $('#treeDb').tree({
        animate:true,lines:true,
        onClick:function (node) {
            var tableId = this.id + node.id;
            var entrance = {
                51: {fn: danceAddTabFeeItem},               // 收费项目
                52: {fn: danceAddTabTeachingMaterial},
                53: {fn: danceAddTabFeeMode},
                54: {fn: danceAddTabClassType},
                55: {fn: danceAddTabDegree},
                56: {fn: danceAddTabJobTitle},
                57: {fn: danceAddTabIntention},
                58: {fn: danceAddTabInfoSrc},
                59: {fn: danceAddTabConsultMode},
                3:  {fn: danceAddTabSchool},
                4:  {fn: danceAddTabUsers},
                511:{fn: danceAddTabTestButtons}
            };

            if (node.text == '数据库备份') {
                danceOpenTab(node.text, '/static/html/_db_backup.html')
            }else if(node.id == 510){
                danceOpenTab(node.text, '/static/html/_pre_student_details.html')
            }else if(node.id in entrance){
                entrance[node.id].fn(node.text, tableId);
            }else {
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
