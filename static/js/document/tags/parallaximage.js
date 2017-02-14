pimcore.registerNS('pimcore.document.tags.parallaximage');

pimcore.document.tags.parallaximage = Class.create(pimcore.document.tags.multihref, {

    updateLayout: function() {

        this.element.render(this.id);

    },

    initialize: function(id, name, options, data, inherited) {
        this.id = id;
        this.name = name;

        this.options = this.parseOptions(options);
        this.data = data;

        this.setupWrapper();

        var modelName = 'ParallaxImageMultihrefEntry';
        if(!Ext.ClassManager.isCreated(modelName) ) {
            Ext.define(modelName, {
                extend: 'Ext.data.Model',
                idProperty: 'rowId',
                fields: [
                    'id',
                    'path',
                    'type',
                    'subtype',
                    'parallaxPosition'
                ]
            });
        }

        this.store = new Ext.data.ArrayStore({
            data: this.data,
            model: modelName
        });


        var positionStoreElements = [];
        Ext.Object.each(this.options.position, function(k,v) {
            positionStoreElements.push({id: k, name: v})
        });

        var positionStore = Ext.create('Ext.data.Store',{
            fields: ['id', 'name'],
            data: positionStoreElements
        });

        var elementConfig = {
            store: this.store,
            bodyStyle: 'color:#000',
            selModel: Ext.create('Ext.selection.RowModel', {}),
            plugins: {
                ptype: 'cellediting',
                clicksToEdit: 1
            },
            viewConfig: {
                forceFit: true
            },
            columns: {
                defaults: {
                    sortable: false
                },
                items: [
                    {header: 'ID', dataIndex: 'id', width: 50},
                    {header: t('path'), dataIndex: 'path', flex: 200},
                    {
                        header: t('position'),
                        dataIndex: 'parallaxPosition',
                        flex: 100,
                        renderer: function(value, metadata, record, rowIndex) {

                            var assetObj = this.store.getAt(rowIndex);
                            if( assetObj ) {
                                assetObj.set('parallaxPosition', value);
                            }

                            var val = positionStore.findRecord('id', value);
                            if( val ) {
                                return val.get('name');
                            }

                            return 'Default';

                        }.bind(this),
                        editor: {
                            xtype: 'combobox',
                            listClass : 'x-combo-list-small',
                            forceSelection: true,
                            typeAhead: false,
                            triggerAction: 'all',
                            emptyText: 'Select action',
                            editable: false,
                            valueField:'id',
                            displayField:'name',
                            listeners: {
                                focus: function(obj) {
                                    obj.expand();
                                },select:function(obj) {
                                    obj.blur();
                                }
                            },
                            store: positionStore
                        }
                    },
                    {
                        xtype:'actioncolumn',
                        width:30,
                        items:[
                            {
                                tooltip:t('up'),
                                icon:'/pimcore/static6/img/flat-color-icons/up.svg',
                                handler:function (grid, rowIndex) {
                                    if (rowIndex > 0) {
                                        var rec = grid.getStore().getAt(rowIndex);
                                        grid.getStore().removeAt(rowIndex);
                                        grid.getStore().insert(rowIndex - 1, [rec]);
                                    }
                                }.bind(this)
                            }
                        ]
                    },
                    {
                        xtype:'actioncolumn',
                        width:30,
                        items:[
                            {
                                tooltip:t('down'),
                                icon:'/pimcore/static6/img/flat-color-icons/down.svg',
                                handler:function (grid, rowIndex) {
                                    if (rowIndex < (grid.getStore().getCount() - 1)) {
                                        var rec = grid.getStore().getAt(rowIndex);
                                        grid.getStore().removeAt(rowIndex);
                                        grid.getStore().insert(rowIndex + 1, [rec]);
                                    }
                                }.bind(this)
                            }
                        ]
                    },
                    {
                        xtype: 'actioncolumn',
                        width: 30,
                        items: [{
                            tooltip: t('open'),
                            icon: '/pimcore/static6/img/flat-color-icons/cursor.svg',
                            handler: function (grid, rowIndex) {
                                var data = grid.getStore().getAt(rowIndex);
                                var subtype = data.data.subtype;
                                if (data.data.type == 'object' && data.data.subtype != 'folder') {
                                    subtype = 'object';
                                }
                                pimcore.helpers.openElement(data.data.id, data.data.type, subtype);
                            }.bind(this)
                        }]
                    },
                    {
                        xtype: 'actioncolumn',
                        width: 30,
                        items: [{
                            tooltip: t('remove'),
                            icon: '/pimcore/static6/img/flat-color-icons/delete.svg',
                            handler: function (grid, rowIndex) {
                                grid.getStore().removeAt(rowIndex);
                            }.bind(this)
                        }]
                    }
                ]
            },
            tbar: null
        };

        // height specifics
        if(typeof this.options.height != 'undefined') {
            elementConfig.height = this.options.height;
        } else {
            elementConfig.autoHeight = true;
        }

        // width specifics
        if(typeof this.options.width != 'undefined') {
            elementConfig.width = this.options.width;
        }

        this.element = new Ext.grid.GridPanel(elementConfig);
        this.element.on('rowcontextmenu', this.onRowContextmenu.bind(this));
        this.element.on('render', function (el) {
            dndManager.addDropTarget(this.element.getEl(),
                this.onNodeOver.bind(this),
                this.onNodeDrop.bind(this));

        }.bind(this));
    },

    onNodeDrop: function (target, dd, e, data) {

        var record = data.records[0];

        if(!this.dndAllowed(this.getCustomPimcoreDropData(record))){
            return false;
        }

        var data = record.data,
            initData = {
            id: data.id,
            path: data.path,
            type: data.elementType,
            subtype: null
        };

        if (initData.type == 'object') {
            if (data.className) {
                initData.subtype = data.className;
            }
            else {
                initData.subtype = 'folder';
            }
        }

        if (initData.type == 'document' || initData.type == 'asset') {
            initData.subtype = data.type;
        }

        initData.parallaxPosition = 'default';

        if (!this.elementAlreadyExists(initData.id, initData.type)) {
            this.store.add(initData);
            return true;
        }

        return false;

    },


    onRowContextmenu: function (grid, record, tr, rowIndex, e, eOpts ) {

        var menu = new Ext.menu.Menu();

        menu.add(new Ext.menu.Item({
            text: t('remove'),
            iconCls: "pimcore_icon_delete",
            handler: this.removeElement.bind(this, rowIndex)
        }));

        menu.add(new Ext.menu.Item({
            text: t('open'),
            iconCls: "pimcore_icon_open",
            handler: function (record, item) {

                item.parentMenu.destroy();

                var subtype = record.data.subtype;
                if (record.data.type == "object" && record.data.subtype != "folder") {
                    subtype = "object";
                }
                pimcore.helpers.openElement(record.data.id, record.data.type, subtype);
            }.bind(this, record)
        }));

        if (pimcore.elementservice.showLocateInTreeButton("document")) {
            menu.add(new Ext.menu.Item({
                text: t('show_in_tree'),
                iconCls: "pimcore_icon_show_in_tree",
                handler: function (item) {
                    item.parentMenu.destroy();
                    pimcore.treenodelocator.showInTree(record.data.id, record.data.type);
                }.bind(this)
            }));
        }

        e.stopEvent();
        menu.showAt(e.pageX, e.pageY);
    },


    getType: function () {
        return 'parallaximage';
    }

});