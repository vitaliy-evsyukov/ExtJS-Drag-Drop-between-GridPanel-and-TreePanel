Ext.BLANK_IMAGE_URL = 'files/default/s.gif';

var d = [
['Товар1', 'шт', '1000'],
['Товар2', 'кг', '30'],
['Товар3', 'бут', '80']
];

var remove_catalogs = false;

var sm = new Ext.grid.RowSelectionModel({
    listeners: {
        beforerowselect: function(sm, rowIndex, ke, record){
            sm.grid.ddText = record.data.name;
        }
    }
})

var grid1 = new Ext.grid.GridPanel({
    store:new Ext.data.ArrayStore({
        fields: ['name', 'unit', 'price'],
        data: d
    }),
    columns:[
    {
        id: 'name_column',
        header:"Наименование",
        width:40,
        sortable:true,
        dataIndex:'name'
    },{
        id: 'unit_column',
        header:"Ед. изм.",
        width:20,
        sortable:true,
        dataIndex:'unit'
    },
    {
        id: 'price_column',
        header:"Цена",
        width:30,
        sortable:true,
        dataIndex:'price'
    }
    ],
    sm : sm,
    viewConfig:{
        forceFit:true
    },
    id:'grid',
    title:'Корзина',
    region:'center',
    layout:'fit',
    enableDragDrop:true,
    ddGroup:'grid2tree'
});

Ext.onReady(function() {

    var tree = new Ext.tree.TreePanel({
        root:{
            text:'Товары',
            id:'root',
            expanded:true,
            children:[{
                text:'Алкоголь',
                children:[{
                    text: 'Виски',
                    leaf: true,
                    price: 7000,
                    unit: 'бут'
                }, {
                    text: 'Коньяк',
                    leaf: true,
                    price: 5400,
                    unit: 'бут'
                }, {
                    text: 'Слабоалкогольные напитки',
                    children:[{
                        text: 'Пиво',
                        leaf: true,
                        price: 7000,
                        unit: 'бут'
                    }]
                }]
            },{
                text:'Продукты питания',
                children:[{
                    text: 'Яблоки',
                    leaf: true,
                    price: 800,
                    unit: 'кг'
                }]
            },{
                text:'Учебник по С++',
                leaf:true,
                price: 1200,
                unit: 'шт'
            }]
        },
        loader:new Ext.tree.TreeLoader({
            preloadChildren:true
        }) ,
        enableDD:true,
        ddGroup:'grid2tree',
        id:'tree',
        region:'east',
        title:'Список товаров',
        layout:'fit',
        width:300,
        split:true,
        collapsible:true,
        autoScroll:true,
        listeners:{
            beforenodedrop: function(e) {

                if(Ext.isArray(e.data.selections)) {
                    if (e.target == this.getRootNode()) {
                        return false;
                    }
                    e.cancel = false;
                    e.dropNode = [];
                    var r;
                    for(var i = 0; i < e.data.selections.length; i++) {
                        r = e.data.selections[i];
                        e.dropNode.push(this.loader.createNode({
                            text:r.get('name'),
                            leaf:true,
                            price:r.get('price'),
                            unit: r.get('unit')
                        }));
                        r.store.remove(r);
                    }
                    return true;
                }
            }
        }
    });

    var cb = new Ext.FormPanel({
        region: 'south',
        frame: true,
        height: 40,
        labelWidth: 200,
        labelPad: 0,
        items: [
        {
            xtype: 'checkbox',
            fieldLabel: 'Разрешить удалять каталоги',
            listeners: {
                check: function(cb, checked) {
                    remove_catalogs = checked;
                }
            }
        }
        ]
    });
    
    // create and show the window
    var win = new Ext.Window({
        title:'Управление товарами',
        id:'tree2divdrag',
        border:false,
        layout:'border',
        width:700,
        height:400,
        items:[tree, grid1, cb]
    });
    win.show();

    var populate = function(node) {
        if (!node.isLeaf()) return -1;
        var r = new Ext.data.Record();
        r.data.name = node.text;
        r.data.price = node.attributes.price;
        r.data.unit = node.attributes.unit;
        return r;
    }

    var removeChildNodes = function(node) {
        node.expand();
        for (var i = node.childNodes.length - 1; i >= 0; i--) {
            var currentNode = node.childNodes[i];
            if (currentNode.isLeaf() || remove_catalogs)
                node.removeChild(currentNode);
            else
                removeChildNodes(currentNode);
        }
    }

    var gridTargetEl =  grid1.getView().scroller.dom;
    var GridDropTarget = new Ext.dd.DropTarget(gridTargetEl, {
        ddGroup    : 'grid2tree',
        notifyDrop : function(ddSource, e, data) {
            e.cancel = false;
            var node = ddSource.dragData.node;
            if ( ( (node.parentNode == null)  || (!node.isLeaf() && !remove_catalogs) ) && !node.hasChildNodes() ) {
                e.cancel = true;
                return false;
            }

            var r = [];
            if (!node.isLeaf()) {
                node.cascade(function(n) {
                    var x = populate(n);
                    if (x != -1)
                        r.push(x);
                });
            }
            else
                r = populate(node);
            grid1.store.add(r);
            if ( (node.parentNode != null) && (remove_catalogs || !node.hasChildNodes()) ) {
                node.remove();
            }
            else {
                removeChildNodes(node);
            }
            return true;
        }
    });
});
