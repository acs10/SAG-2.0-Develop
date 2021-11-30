(function ($, go, GenogramLayout) {

    if ($ === undefined) {
        throw 'jQuery not installed';
    }
    if (go === undefined) {
        throw 'GoJS not installed';
    }
    if (GenogramLayout === undefined) {
        throw 'GenogramLayout (genogramLayout.js) not configured';
    }

    var $gomake = go.GraphObject.make;

    var genController = function (diagram, initial_data) {
        var self = this;

        self.selected_person = function () {
        };

        self._diagram = diagram;
        self._initial_data = initial_data || [];

        // tamanho mínimo dos links
        //  os links de casamentos são alterados no script 'genogramLeiayt.js'
        //  através de um Bind com 'SegmentLength'
        self.segmentLength = 30;

        self.setupDiagram();
        self.setupNodesTemplate();
        self.setupLinksTemplate();
        self.setupLinksTemplateRelation();
        self._setupData();
    };
    
    genController.prototype = {
        _nodeSelectionChanged: function (node) {
            var self = this;

            if (node.isSelected) {
                self.selected_person(node);
            } else {
                self.selected_person(null);
            }
        },
        _setupData: function () {
            var self = this;
            // configura a estrutura de dados
            // neste caso, GraphLinksModel:
            //  ele permite extrair, de uma única origem (nodeDataArray), os nodes e links
            self._diagram.model = go.GraphObject.make(
                go.GraphLinksModel,
                {
                    linkKeyProperty: 'identificacao',
                    nodeKeyProperty: 'identificacao',
                    linkLabelKeysProperty: 'labelKeys',
                    // Essa propriedade determina qual modelo é usado
                    linkCategoryProperty: 'categoria',
                    nodeCategoryProperty: 'genero',
                    // criar todos os nós para pessoas
                    nodeDataArray: [] //self._initial_data || []
                });

            self._diagram.zoomToFit();
        },
        setupData: function (dados, selected_id) {
            var self = this;

            self._diagram.model.linkDataArray = [];             // clear links
            self._diagram.model.nodeDataArray = [];             // clear nodes
            self._diagram.model.addNodeDataCollection(dados || []);    // seta os dados

            self.setupMarriages();
            self.setupParents();

            self.setupRelation();

            if (selected_id !== undefined) {
                var node = self._diagram.findNodeForKey(selected_id);
                if (node !== null) {
                    self._diagram.select(node);
                }
            }
            //self._diagram.zoomToFit();
        },

        setupDiagram: function () {
            var self = this;

            if (typeof self._diagram === "string") {
                self._diagram = $gomake(
                    go.Diagram,
                    self._diagram,
                    {
                        initialContentAlignment: go.Spot.Center,
                        initialAutoScale: go.Diagram.Uniform,
                        maxScale: 1,
                        contentAlignment: go.Spot.Center,
                        'undoManager.isEnabled': true,

                        // Quando um nó é selecionado, desenhe um grande círculo amarelo atrás dele
                        nodeSelectionAdornmentTemplate: $gomake(
                            go.Adornment,
                            'Auto',
                            {
                                layerName: 'Grid'   // a camada predefinida que está por trás de tudo o resto
                            },
                            $gomake(
                                go.Shape,
                                'Circle',
                                {
                                    fill: 'yellow',
                                    stroke: null
                                }
                            ),
                            $gomake(
                                go.Placeholder
                            )
                        )
                        ,
                        // usar um layout personalizado, definido abaixo
                        layout: $gomake(
                            GenogramLayout,
                            {
                                direction: 90,
                                layerSpacing: 10 + self.segmentLength * 2,
                                columnSpacing: 10
                            }
                        )
                    });
            }
        },

        setupNodesTemplate: function () {
            var self = this;
            var diagram = self._diagram;

            // modelos de nó diferentes, um para cada sexo,
            // nomeado pelo valor da categoria no objeto de dados do nó

            // Masculino
            diagram.nodeTemplateMap.add(
                "M",
                $gomake(
                    go.Node,
                    "Vertical",
                    {
                        locationSpot: go.Spot.Center,
                        locationObjectName: "ICON"
                    },
                    $gomake(
                        go.Panel,
                        {
                            name: "ICON"
                        },
                        $gomake(
                            go.Shape,
                            "Square",
                            {
                                width: 40,
                                height: 40,
                                strokeWidth: 2,
                                fill: "white",
                                portId: ""
                            }
                        ),
                        $gomake(
                            go.Panel,
                            {
                                itemTemplate: $gomake(
                                    go.Panel,
                                    $gomake(
                                        go.Shape,
                                        {
                                            stroke: null,
                                            strokeWidth: 0
                                        },
                                        new go.Binding("fill", "", $.proxy(self.characteristics_color, self)),
                                        new go.Binding("geometry", "", $.proxy(self.maleCharacteristics, self))
                                    )
                                ),
                                margin: 1
                            },
                            new go.Binding("itemArray", "patologias")
                        )
                    ),
                    $gomake(
                        go.TextBlock,
                        {
                            textAlign: "center",
                            maxSize: new go.Size(80, NaN)
                            , position: new go.Point(-50, -50)
                        },
                        new go.Binding("text", "nome")
                    ),
                    {
                        selectionChanged: $.proxy(self._nodeSelectionChanged, self)
                    }
                )
            );

            // Feminino
            diagram.nodeTemplateMap.add(
                "F",
                $gomake(
                    go.Node,
                    "Vertical", {
                    locationSpot: go.Spot.Center,
                    locationObjectName: "ICON"
                },
                    $gomake(
                        go.Panel,
                        {
                            name: "ICON"
                        },
                        $gomake(
                            go.Shape,
                            "Circle",
                            {
                                width: 40,
                                height: 40,
                                strokeWidth: 2,
                                fill: "white",
                                portId: ""
                            }
                        ),
                        $gomake(
                            go.Panel,
                            {
                                itemTemplate: $gomake(
                                    go.Panel,
                                    $gomake(
                                        go.Shape,
                                        {
                                            stroke: null,
                                            strokeWidth: 0
                                        },
                                        new go.Binding("fill", "", $.proxy(self.characteristics_color, self)),
                                        new go.Binding("geometry", "", $.proxy(self.femaleCharacteristics, self))
                                    )
                                ),
                                margin: 1
                            },
                            new go.Binding("itemArray", "patologias")
                        )
                    ),
                    $gomake(
                        go.TextBlock,
                        {
                            textAlign: "center",
                            maxSize: new go.Size(80, NaN)
                        },
                        new go.Binding("text", "nome")
                    ),
                    {
                        selectionChanged: $.proxy(self._nodeSelectionChanged, self)
                    }
                )
            );

            // Transsexuais (Mulher para homem)
            diagram.nodeTemplateMap.add(
                "MH",
                $gomake(
                    go.Node,
                    "Vertical",
                    {
                        locationSpot: go.Spot.Center,
                        locationObjectName: "ICON"
                    },
                    $gomake(
                        go.Panel,
                        {
                            name: "ICON"
                        },
                        $gomake(
                            go.Shape,
                            "Square",
                            {
                                width: 40,
                                height: 40,
                                strokeWidth: 2,
                                fill: "white",
                                portId: ""
                            }
                        ),
                        $gomake(
                            go.Shape,
                            "Circle",
                            {
                                width: 40,
                                height: 40,
                                strokeWidth: 2,
                                fill: "white",
                                portId: ""
                            }
                        ),
                        $gomake(
                            go.Panel,
                            {
                                itemTemplate: $gomake(
                                    go.Panel,
                                    $gomake(
                                        go.Shape,
                                        {
                                            stroke: null,
                                            strokeWidth: 0
                                        },
                                        new go.Binding("fill", "", $.proxy(self.characteristics_color, self)),
                                        new go.Binding("geometry", "", $.proxy(self.maleCharacteristics, self))
                                    )
                                ),
                                margin: 1
                            },
                            new go.Binding("itemArray", "patologias")
                        )
                    ),
                    $gomake(
                        go.TextBlock,
                        {
                            textAlign: "center",
                            maxSize: new go.Size(80, NaN)
                            , position: new go.Point(-50, -50)
                        },
                        new go.Binding("text", "nome")
                    ),
                    {
                        selectionChanged: $.proxy(self._nodeSelectionChanged, self)
                    }
                )
            );

            // Transsexuais (Homem para mulher)
            diagram.nodeTemplateMap.add(
                "HM",
                $gomake(
                    go.Node,
                    "Vertical",
                    {
                        locationSpot: go.Spot.Center,
                        locationObjectName: "ICON"
                    },
                    $gomake(
                        go.Panel,
                        {
                            name: "ICON"
                        },
                        $gomake(
                            go.Shape,
                            "Circle",
                            {
                                width: 40,
                                height: 40,
                                strokeWidth: 2,
                                fill: "white",
                                portId: ""
                            }
                        ),
                        $gomake(
                            go.Shape,
                            "Square",
                            {
                                width: 26,
                                height: 26,
                                strokeWidth: 2,
                                fill: "white",
                                portId: "",
                                position: new go.Point(7, 7)
                            }
                        ),
                        $gomake(
                            go.Panel,
                            {
                                itemTemplate: $gomake(
                                    go.Panel,
                                    $gomake(
                                        go.Shape,
                                        {
                                            stroke: null,
                                            strokeWidth: 0
                                        },
                                        new go.Binding("fill", "", $.proxy(self.characteristics_color, self)),
                                        new go.Binding("geometry", "", $.proxy(self.femaleCharacteristics, self))
                                    )
                                ),
                                margin: 1
                            },
                            new go.Binding("itemArray", "patologias")
                        )
                    ),
                    $gomake(
                        go.TextBlock,
                        {
                            textAlign: "center",
                            maxSize: new go.Size(80, NaN)
                        },
                        new go.Binding("text", "nome")
                    ),
                    {
                        selectionChanged: $.proxy(self._nodeSelectionChanged, self)
                    }
                )
            );

            // Homossexual
            diagram.nodeTemplateMap.add(
                "H",
                $gomake(
                    go.Node,
                    "Vertical",
                    {
                        locationSpot: go.Spot.Center,
                        locationObjectName: "ICON"
                    },
                    $gomake(
                        go.Panel,
                        {
                            name: "ICON"
                        },
                        $gomake(
                            go.Shape,
                            "Square",
                            {
                                width: 40,
                                height: 40,
                                strokeWidth: 2,
                                fill: "white",
                                portId: ""
                            }
                        ),
                        $gomake(
                            go.Shape,
                            "TriangleDown",
                            {
                                width: 30,
                                height: 30,
                                strokeWidth: 2,
                                fill: "white",
                                portId: "",
                                position: new go.Point(5, 5),
                            }
                        ),
                        $gomake(
                            go.Panel,
                            {
                                itemTemplate: $gomake(
                                    go.Panel,
                                    $gomake(
                                        go.Shape,
                                        {
                                            stroke: null,
                                            strokeWidth: 0
                                        },
                                        new go.Binding("fill", "", $.proxy(self.characteristics_color, self)),
                                        new go.Binding("geometry", "", $.proxy(self.maleCharacteristics, self))
                                    )
                                ),
                                margin: 1
                            },
                            new go.Binding("itemArray", "patologias")
                        )
                    ),
                    $gomake(
                        go.TextBlock,
                        {
                            textAlign: "center",
                            maxSize: new go.Size(80, NaN)
                        },
                        new go.Binding("text", "nome")
                    ),
                    {
                        selectionChanged: $.proxy(self._nodeSelectionChanged, self)
                    }
                )
            );

            // Lésbica
            diagram.nodeTemplateMap.add(
                "L",
                $gomake(
                    go.Node,
                    "Vertical",
                    {
                        locationSpot: go.Spot.Center,
                        locationObjectName: "ICON"
                    },
                    $gomake(
                        go.Panel,
                        {
                            name: "ICON"
                        },
                        $gomake(
                            go.Shape,
                            "Circle",
                            {
                                width: 40,
                                height: 40,
                                strokeWidth: 2,
                                fill: "white",
                                portId: ""
                            }
                        ),
                        $gomake(
                            go.Shape,
                            "TriangleDown",
                            {
                                width: 28,
                                height: 28,
                                strokeWidth: 2,
                                fill: "white",
                                portId: "",
                                position: new go.Point(6, 9)
                            }
                        ),
                        $gomake(
                            go.Panel,
                            {
                                itemTemplate: $gomake(
                                    go.Panel,
                                    $gomake(
                                        go.Shape,
                                        {
                                            stroke: null,
                                            strokeWidth: 0
                                        },
                                        new go.Binding("fill", "", $.proxy(self.characteristics_color, self)),
                                        new go.Binding("geometry", "", $.proxy(self.femaleCharacteristics, self))
                                    )
                                ),
                                margin: 1
                            },
                            new go.Binding("itemArray", "patologias")
                        )
                    ),
                    $gomake(
                        go.TextBlock,
                        {
                            textAlign: "center",
                            maxSize: new go.Size(80, NaN)
                        },
                        new go.Binding("text", "nome")
                    ),
                    {
                        selectionChanged: $.proxy(self._nodeSelectionChanged, self)
                    }
                )
            );

            // Bissexual (Masculino)
            diagram.nodeTemplateMap.add(
                "BM",
                $gomake(
                    go.Node,
                    "Vertical",
                    {
                        locationSpot: go.Spot.Center,
                        locationObjectName: "ICON"
                    },
                    $gomake(
                        go.Panel,
                        {
                            name: "ICON"
                        },
                        $gomake(
                            go.Shape,
                            "Square",
                            {
                                width: 40,
                                height: 40,
                                strokeWidth: 2,
                                fill: "white",
                                portId: ""
                            }
                        ),
                        $gomake(
                            go.Shape,
                            "TriangleDown",
                            {
                                width: 30,
                                height: 30,
                                strokeWidth: 2,
                                fill: "white",
                                portId: "",
                                position: new go.Point(5, 5),
                                strokeDashArray: [3, 3]
                            }
                        ),
                        $gomake(
                            go.Panel,
                            {
                                itemTemplate: $gomake(
                                    go.Panel,
                                    $gomake(
                                        go.Shape,
                                        {
                                            stroke: null,
                                            strokeWidth: 0
                                        },
                                        new go.Binding("fill", "", $.proxy(self.characteristics_color, self)),
                                        new go.Binding("geometry", "", $.proxy(self.maleCharacteristics, self))
                                    )
                                ),
                                margin: 1
                            },
                            new go.Binding("itemArray", "patologias")
                        )
                    ),
                    $gomake(
                        go.TextBlock,
                        {
                            textAlign: "center",
                            maxSize: new go.Size(80, NaN)
                        },
                        new go.Binding("text", "nome")
                    ),
                    {
                        selectionChanged: $.proxy(self._nodeSelectionChanged, self)
                    }
                )
            );

            // Bissexual (Feminino)
            diagram.nodeTemplateMap.add(
                "BF",
                $gomake(
                    go.Node,
                    "Vertical",
                    {
                        locationSpot: go.Spot.Center,
                        locationObjectName: "ICON"
                    },
                    $gomake(
                        go.Panel,
                        {
                            name: "ICON"
                        },
                        $gomake(
                            go.Shape,
                            "Circle",
                            {
                                width: 40,
                                height: 40,
                                strokeWidth: 2,
                                fill: "white",
                                portId: ""
                            }
                        ),
                        $gomake(
                            go.Shape,
                            "TriangleDown",
                            {
                                width: 26,
                                height: 26,
                                strokeWidth: 2,
                                fill: "white",
                                portId: "",
                                position: new go.Point(7, 10),
                                strokeDashArray: [3, 3]
                            }
                        ),
                        $gomake(
                            go.Panel,
                            {
                                itemTemplate: $gomake(
                                    go.Panel,
                                    $gomake(
                                        go.Shape,
                                        {
                                            stroke: null,
                                            strokeWidth: 0
                                        },
                                        new go.Binding("fill", "", $.proxy(self.characteristics_color, self)),
                                        new go.Binding("geometry", "", $.proxy(self.femaleCharacteristics, self))
                                    )
                                ),
                                margin: 1
                            },
                            new go.Binding("itemArray", "patologias")
                        )
                    ),
                    $gomake(
                        go.TextBlock,
                        {
                            textAlign: "center",
                            maxSize: new go.Size(80, NaN)
                        },
                        new go.Binding("text", "nome")
                    ),
                    {
                        selectionChanged: $.proxy(self._nodeSelectionChanged, self)
                    }
                )
            );

            // Bissexual (Feminino)
            diagram.nodeTemplateMap.add(
                "BF",
                $gomake(
                    go.Node,
                    "Vertical",
                    {
                        locationSpot: go.Spot.Center,
                        locationObjectName: "ICON"
                    },
                    $gomake(
                        go.Panel,
                        {
                            name: "ICON"
                        },
                        $gomake(
                            go.Shape,
                            "Circle",
                            {
                                width: 40,
                                height: 40,
                                strokeWidth: 2,
                                fill: "white",
                                portId: ""
                            }
                        ),
                        $gomake(
                            go.Shape,
                            "TriangleDown",
                            {
                                width: 26,
                                height: 26,
                                strokeWidth: 2,
                                fill: "white",
                                portId: "",
                                position: new go.Point(7, 10),
                                strokeDashArray: [3, 3]
                            }
                        ),
                        $gomake(
                            go.Panel,
                            {
                                itemTemplate: $gomake(
                                    go.Panel,
                                    $gomake(
                                        go.Shape,
                                        {
                                            stroke: null,
                                            strokeWidth: 0
                                        },
                                        new go.Binding("fill", "", $.proxy(self.characteristics_color, self)),
                                        new go.Binding("geometry", "", $.proxy(self.femaleCharacteristics, self))
                                    )
                                ),
                                margin: 1
                            },
                            new go.Binding("itemArray", "patologias")
                        )
                    ),
                    $gomake(
                        go.TextBlock,
                        {
                            textAlign: "center",
                            maxSize: new go.Size(80, NaN)
                        },
                        new go.Binding("text", "nome")
                    ),
                    {
                        selectionChanged: $.proxy(self._nodeSelectionChanged, self)
                    }
                )
            );

            // Animal de Estimação
            diagram.nodeTemplateMap.add(
                "AE",
                $gomake(
                    go.Node,
                    "Vertical", {
                    locationSpot: go.Spot.Center,
                    locationObjectName: "ICON"
                },
                    $gomake(
                        go.Panel,
                        {
                            name: "ICON"
                        },
                        $gomake(
                            go.Shape,
                            // "Triangle",
                            "Diamond",
                            // "Rectangle",
                            {
                                width: 60,
                                height: 40,
                                strokeWidth: 2,
                                fill: "white",
                                portId: ""
                            }
                        ),
                        $gomake(
                            go.Panel,
                            {
                                itemTemplate: $gomake(
                                    go.Panel,
                                    $gomake(
                                        go.Shape,
                                        {
                                            stroke: null,
                                            strokeWidth: 0
                                        },
                                        new go.Binding("fill", "", $.proxy(self.characteristics_color, self)),
                                        new go.Binding("geometry", "", $.proxy(self.aeCharacteristics, self))
                                    )
                                ),
                                margin: 1
                            },
                            new go.Binding("itemArray", "patologias")
                        )
                    ),
                    $gomake(
                        go.TextBlock,
                        {
                            textAlign: "center",
                            maxSize: new go.Size(80, NaN)
                        },
                        new go.Binding("text", "nome")
                    ),
                    {
                        selectionChanged: $.proxy(self._nodeSelectionChanged, self)
                    }
                )
            );
            // Terapia ou ligação a outras Instituiçõens
            diagram.nodeTemplateMap.add(
                "TLI",
                $gomake(
                    go.Node,
                    "Vertical", {
                    locationSpot: go.Spot.Center,
                    locationObjectName: "ICON"
                },
                    $gomake(
                        go.Panel,
                        {
                            name: "ICON"
                        },
                        $gomake(
                            go.Shape,
                            "Rectangle",
                            {
                                width: 60,
                                height: 40,
                                strokeWidth: 2,
                                fill: "white",
                                portId: ""
                            }
                        ),
                        $gomake(
                            go.Panel,
                            {
                                itemTemplate: $gomake(
                                    go.Panel,
                                    $gomake(
                                        go.Shape,
                                        {
                                            stroke: null,
                                            strokeWidth: 0
                                        },
                                        new go.Binding("fill", "", $.proxy(self.characteristics_color, self)),
                                        new go.Binding("geometry", "", $.proxy(self.tlsCharacteristics, self))
                                    )
                                ),
                                margin: 1
                            },
                        )
                    ),
                    $gomake(
                        go.TextBlock,
                        {
                            textAlign: "center",
                            maxSize: new go.Size(80, NaN)
                        },
                        new go.Binding("text", "nome")
                    ),
                    {
                        selectionChanged: $.proxy(self._nodeSelectionChanged, self)
                    }
                )
            );
            // Segredo da familia
            diagram.nodeTemplateMap.add(
                "SF",
                $gomake(
                    go.Node,
                    "Vertical", {
                    locationSpot: go.Spot.Center,
                    locationObjectName: "ICON"
                },
                    $gomake(
                        go.Panel,
                        {
                            name: "ICON"
                        },
                        $gomake(
                            go.Shape,
                            "Triangle",
                            {
                                width: 30,
                                height: 20,
                                strokeWidth: 2,
                                fill: "black",
                                portId: ""
                            }
                        ),
                        $gomake(
                            go.Panel,
                            {
                                itemTemplate: $gomake(
                                    go.Panel,
                                    $gomake(
                                        go.Shape,
                                        {
                                            stroke: null,
                                            strokeWidth: 0
                                        },
                                        new go.Binding("fill", "", $.proxy(self.characteristics_color, self)),
                                        new go.Binding("geometry", "", $.proxy(self.sfCharacteristics, self))
                                    )
                                ),
                                margin: 1
                            },
                        )
                    ),
                    $gomake(
                        go.TextBlock,
                        {
                            textAlign: "center",
                            maxSize: new go.Size(80, NaN)
                        },
                        new go.Binding("text", "nome")
                    ),
                    {
                        selectionChanged: $.proxy(self._nodeSelectionChanged, self)
                    }
                )
            );



            // a representação de cada nó de rótulo-nada mostra em um link de casamento
            diagram.nodeTemplateMap.add(
                "LinkLabel",
                $gomake(
                    go.Node,
                    {
                        selectable: false,
                        width: 1,
                        height: 1,
                        fromEndSegmentLength: self.segmentLength,
                        toEndSegmentLength: self.segmentLength,
                    }
                )
            );
        },
        setupLinksTemplate: function () {
            var self = this;
            var diagram = self._diagram;

            // para relacionamentos pais-filhos
            diagram.linkTemplate = $gomake(
                go.Link,
                {
                    routing: go.Link.Orthogonal,
                    curviness: 15,
                    layerName: 'Background',
                    selectable: false,
                    fromSpot: go.Spot.Bottom,
                    toSpot: go.Spot.Top,
                    fromEndSegmentLength: self.segmentLength,
                    toEndSegmentLength: self.segmentLength
                },
                $gomake(
                    go.Shape,
                    {
                        strokeWidth: 2
                    }
                )
            );

            // casado
            diagram.linkTemplateMap.add(
                'Marriage',
                $gomake(
                    go.Link,
                    {
                        fromEndSegmentLength: self.segmentLength,
                        toEndSegmentLength: self.segmentLength,
                        fromSpot: go.Spot.Bottom,
                        toSpot: go.Spot.Bottom,
                        selectable: false
                    },
                    $gomake(
                        go.Shape,
                        {
                            strokeWidth: 2
                        }
                    )
                )
            );

            // separado
            diagram.linkTemplateMap.add(
                'Separate',
                $gomake(
                    go.Link,
                    {
                        fromEndSegmentLength: self.segmentLength,
                        toEndSegmentLength: self.segmentLength,
                        routing: go.Link.AvoidsNodes,
                        fromSpot: go.Spot.Bottom,
                        toSpot: go.Spot.Bottom,
                        selectable: false
                    },
                    $gomake(
                        go.Shape,
                        {
                            strokeWidth: 2
                        }
                    ),
                    $gomake(go.Shape, {
                        geometryString: "m 0,-8 m -2,8 l 14,-8",
                        width: 20,
                        height: 20,
                        strokeWidth: 2,
                        stroke: "black"
                    })
                )
            );

            // divorciado
            diagram.linkTemplateMap.add(
                'ExMarriage',
                $gomake(
                    go.Link,
                    {
                        fromEndSegmentLength: self.segmentLength,
                        toEndSegmentLength: self.segmentLength,
                        routing: go.Link.AvoidsNodes,
                        fromSpot: go.Spot.Bottom,
                        toSpot: go.Spot.Bottom,
                        selectable: false
                    },
                    $gomake(
                        go.Shape,
                        {
                            strokeWidth: 2
                        }
                    ),
                    $gomake(go.Shape, {
                        geometryString: "m 0,8 l 14,-8 m -2,8 l 14,-8",
                        width: 20,
                        height: 20,
                        strokeWidth: 2,
                        stroke: "black"
                    })
                )
            );

            // Cuidador
            diagram.linkTemplateMap.add(
                'Cuidador',
                $gomake(
                    go.Link,
                    {
                        isLayoutPositioned: false,
                        fromSpot: go.Spot.Right,
                        toSpot: go.Spot.Left,
                        selectable: false,
                    },

                    $gomake(
                        go.Shape,
                        {
                            stroke: "black",
                            strokeWidth: 1,

                        }
                    ),

                    $gomake(go.Shape,
                        {
                            toArrow: "DoubleFeathers",
                            fill: "white",
                            stroke: "black",
                            scale: 2,
                           
                        }),

                )

            );

            // união estável
            diagram.linkTemplateMap.add(
                'UniaoEstavel',
                $gomake(
                    go.Link,
                    {
                        fromEndSegmentLength: self.segmentLength,
                        toEndSegmentLength: self.segmentLength,
                        routing: go.Link.AvoidsNodes,
                        fromSpot: go.Spot.Bottom,
                        toSpot: go.Spot.Bottom,
                        selectable: false
                    },
                    $gomake(
                        go.Shape,
                        {
                            strokeWidth: 2,
                            strokeDashArray: [3, 3]
                        }
                    )
                )
            );

            // Caso de Amor Secreto
            diagram.linkTemplateMap.add(
                'CasoAmor',
                $gomake(
                    go.Link,
                    {
                        fromEndSegmentLength: self.segmentLength,
                        toEndSegmentLength: self.segmentLength,
                        routing: go.Link.AvoidsNodes,
                        fromSpot: go.Spot.Bottom,
                        toSpot: go.Spot.Bottom,
                        selectable: false,
                    },
                    $gomake(
                        go.Shape,
                        {
                            strokeWidth: 2,
                            strokeDashArray: [5, 5]
                        }
                    ),
                    $gomake(
                        go.Shape, 
                        "Triangle",
                        {
                            width: 30,
                            height: 20,
                            strokeWidth: 2,
                            fill: "black",
                            portId: ""
                        }
                    ),
                )
            );

            // Relação Sexual Vivendo Juntos
            diagram.linkTemplateMap.add(
                'RelacaoSexual',
                $gomake(
                    go.Link,
                    {
                        fromEndSegmentLength: self.segmentLength,
                        toEndSegmentLength: self.segmentLength,
                        routing: go.Link.AvoidsNodes,
                        fromSpot: go.Spot.Bottom,
                        toSpot: go.Spot.Bottom,
                        selectable: false
                    },
                    $gomake(
                        go.Shape,
                        {
                            strokeWidth: 2,
                            strokeDashArray: [5, 5]
                        }
                    )
                )
            );

             //  Reconciliação Conjugal após separação
             diagram.linkTemplateMap.add(
                'Reconsiliacao',
                $gomake(
                    go.Link,
                    {
                        fromEndSegmentLength: self.segmentLength,
                        toEndSegmentLength: self.segmentLength,
                        routing: go.Link.AvoidsNodes,
                        fromSpot: go.Spot.Bottom,
                        toSpot: go.Spot.Bottom,
                        selectable: false
                    },
                    $gomake(
                        go.Shape,
                        {
                            strokeWidth: 2,
                            
                        }
                    ),
                    $gomake(go.Shape, "XLine", {
                        width: 20, height: 30, margin: 4, fill: null
                    },)
                )
            );

            //  Reconciliação após divorcio
            diagram.linkTemplateMap.add(
                'ReconsiliacaoAD',
                $gomake(
                    go.Link,
                    {
                        fromEndSegmentLength: self.segmentLength,
                        toEndSegmentLength: self.segmentLength,
                        routing: go.Link.AvoidsNodes,
                        fromSpot: go.Spot.Bottom,
                        toSpot: go.Spot.Bottom,
                        selectable: false
                    },
                    $gomake(
                        go.Shape,
                        {
                            strokeWidth: 2,
                            
                        }
                    ),
                    $gomake(go.Shape, {
                        geometryString: "m 0,8 l 14,-8 m -2,8 l 14,-8",
                        width: 20,  //tamanho
                        height: 20, //tamanho
                        margin: 4,
                        strokeWidth: 2, // grossura
                        stroke: "black" //cor do traçado
                    },),
                    $gomake(go.Shape, {
                        geometryString: "m 0,8 l -14,-8",
                        width: 20,  //tamanho
                        height: 20, //tamanho
                        margin: 4,
                        strokeWidth: 2, // grossura
                        stroke: "black" //cor do traçado
                    },)
                )
            );
        },


        setupLinksTemplateRelation: function () {
            var self = this;
            var diagram = self._diagram;

            // Proximo
            diagram.linkTemplateMap.add(
                'Proximo',
                $gomake(
                    go.Link,
                    {
                        isLayoutPositioned: false,
                        fromSpot: go.Spot.Right,
                        toSpot: go.Spot.Left,
                        selectable: false
                    },
                    $gomake(
                        go.Shape,
                        {
                            stroke: "transparent",
                            strokeWidth: 1,
                            pathPattern:
                                $gomake(
                                    go.Shape,
                                    {
                                        geometryString: "M0 0 L1 0 M0 3 L1 3",
                                        fill: "transparent",
                                        stroke: "black",
                                        strokeWidth: 1,
                                        strokeCap: "square"
                                    }
                                )
                        }
                    )
                )
            );

            // Unido
            diagram.linkTemplateMap.add(
                'Unido',
                $gomake(
                    go.Link,
                    {
                        isLayoutPositioned: false,
                        fromSpot: go.Spot.Right,
                        toSpot: go.Spot.Left,
                        selectable: false
                    },
                    $gomake(
                        go.Shape,
                        {
                            stroke: "transparent",
                            strokeWidth: 1,
                            pathPattern:
                                $gomake(
                                    go.Shape,
                                    {
                                        geometryString: "M0 0 L1 0 M0 3 L1 3 M0 6 L1 6",
                                        fill: "transparent",
                                        stroke: "black",
                                        strokeWidth: 1,
                                        strokeCap: "square"
                                    }
                                )
                        }
                    )
                )
            );

            // Hostil
            diagram.linkTemplateMap.add(
                'Hostil',
                $gomake(
                    go.Link,
                    {
                        isLayoutPositioned: false,
                        fromSpot: go.Spot.Right,
                        toSpot: go.Spot.Left,
                        selectable: false
                    },
                    $gomake(
                        go.Shape,
                        {
                            stroke: "transparent",
                            strokeWidth: 1,
                            pathPattern:
                                $gomake(
                                    go.Shape,
                                    {
                                        geometryString: "M0 4 L2 0 6 8 8 4",
                                        fill: "transparent",
                                        stroke: "black",
                                        strokeWidth: 1,
                                        strokeCap: "square"
                                    }
                                )
                        }
                    )
                )
            );

            // Distante
            diagram.linkTemplateMap.add(
                'Distante',
                $gomake(
                    go.Link,
                    {
                        isLayoutPositioned: false,
                        fromSpot: go.Spot.Right,
                        toSpot: go.Spot.Left,
                        selectable: false
                    },
                    $gomake(
                        go.Shape,
                        {
                            strokeWidth: 1,
                            strokeDashArray: [3, 3]
                        }
                    )
                )
            );

            // Relação Positiva
            diagram.linkTemplateMap.add(
                'RelacaoPositiva',
                $gomake(
                    go.Link,
                    {
                        isLayoutPositioned: false,
                        fromSpot: go.Spot.Right,
                        toSpot: go.Spot.Left,
                        selectable: false
                    },
                    $gomake(
                        go.Shape,
                        {
                            strokeWidth: 2
                        }
                    )
                )
            );

 // AbusoSexual
 diagram.linkTemplateMap.add(
    'AbusoSexual',
    $gomake(
        go.Link,
        {
            isLayoutPositioned: false,
            fromSpot: go.Spot.Right,
            toSpot: go.Spot.Left,
            selectable: false
        },
        $gomake(
            go.Shape,
            {
                stroke: "transparent",
                strokeWidth: 1,
                pathPattern:
                    $gomake(
                        go.Shape,
                        {
                            geometryString: "M23.25 12.25l-10.8 -11.51 -11.4 11.51 22.2 0zm-22.2 -11.82l22.2 0 ",
                            fill: "transparent",
                            stroke: "black",
                            strokeWidth: 1,
                            strokeCap: "square"
                        }
                    )
            }
        ),
        $gomake(go.Shape,
            {
                toArrow: "Triangle",
                fill: "black",
                scale: 1.5
            })
    )
);


            // AbusoFisico
            diagram.linkTemplateMap.add(
                'AbusoFisico',
                $gomake(
                    go.Link,
                    {
                        isLayoutPositioned: false,
                        fromSpot: go.Spot.Right,
                        toSpot: go.Spot.Left,
                        selectable: false
                    },
                    $gomake(
                        go.Shape,
                        {
                            stroke: "transparent",
                            strokeWidth: 1,
                            pathPattern:
                                $gomake(
                                    go.Shape,
                                    {
                                        geometryString: "M0 3 L1 0 3 6 4 3",
                                        fill: "transparent",
                                        stroke: "black",
                                        strokeWidth: 1,
                                        strokeCap: "square"
                                    }
                                )
                        }
                    ),
                    $gomake(go.Shape,
                        {
                            toArrow: "Standard",
                            scale: 1.5
                        })
                )
            );

            // FocadoEm
            diagram.linkTemplateMap.add(
                'FocadoEm',
                $gomake(
                    go.Link,
                    {
                        isLayoutPositioned: false,
                        fromSpot: go.Spot.Right,
                        toSpot: go.Spot.Left,
                        selectable: false
                    },
                    $gomake(
                        go.Shape,
                        {
                            stroke: "black",
                            strokeWidth: 1

                        }
                    ),
                    $gomake(go.Shape,
                        {
                            toArrow: "Triangle",
                            scale: 1.5
                        })
                )
            );

            // FocadoNegativamente
            diagram.linkTemplateMap.add(
                'FocadoNegativamente',
                $gomake(
                    go.Link,
                    {
                        isLayoutPositioned: false,
                        fromSpot: go.Spot.Right,
                        toSpot: go.Spot.Left,
                        selectable: false
                    },
                    $gomake(
                        go.Shape,
                        {
                            stroke: "black",
                            strokeWidth: 1,
                            pathPattern:
                                $gomake(
                                    go.Shape,
                                    {
                                        geometryString: "M0 4 L2 0 6 8 8 4",
                                        fill: "transparent",
                                        stroke: "black",
                                        strokeWidth: 1,
                                        strokeCap: "square"
                                    }
                                )
                        }
                    ),
                    $gomake(go.Shape,
                        {
                            toArrow: "Triangle",
                            scale: 1.5
                        })
                )
            );
            // Rompimento
            diagram.linkTemplateMap.add(
                'Rompimento',
                $gomake(
                    go.Link,
                    {
                        isLayoutPositioned: false,
                        fromSpot: go.Spot.Right,
                        toSpot: go.Spot.Left,
                        selectable: false
                    },

                    $gomake(
                        go.Shape,
                        {
                            stroke: "black",
                            strokeWidth: 1,

                        }
                    ),

                    $gomake(
                        go.TextBlock, "|   |",
                        {
                            position: new go.Point(50, 50),
                            background: "white",

                        }),

                    $gomake(go.Shape,
                        {
                            toArrow: "OpenTriangle",
                            scale: 1.5
                        })
                )
            );

            // RompimentoReparado
            diagram.linkTemplateMap.add(
                'RompimentoReparado',
                $gomake(
                    go.Link,
                    {
                        isLayoutPositioned: false,
                        fromSpot: go.Spot.Right,
                        toSpot: go.Spot.Left,
                        selectable: false
                    },

                    $gomake(
                        go.Shape,
                        {
                            stroke: "black",
                            strokeWidth: 1,

                        }
                    ),

                    $gomake(
                        go.TextBlock,
                        {
                            text: "|○|",
                            position: new go.Point(50, 50),
                            background: "white",
                            font: '14pt sans-serif',

                        }),

                    $gomake(go.Shape,
                        {
                            toArrow: "OpenTriangle",
                            scale: 1.5
                        })
                )
            );


// Próximo Hostil
diagram.linkTemplateMap.add(
    'ProximoHostil',
    $gomake(
        go.Link,
        {
            isLayoutPositioned: false,
            fromSpot: go.Spot.Right,
            toSpot: go.Spot.Left,
            selectable: false
        },

        $gomake(
            go.Shape,
            {
                stroke: "transparent",
                strokeWidth: 1,
                pathPattern:
                    $gomake(
                        go.Shape,
                        {
                            geometryString: "M23.25 12.25l-10.8 -11.51 -11.4 11.51 22.2 0zm-22.2 -11.82l22.2 0 ",
                            fill: "transparent",
                            stroke: "black",
                            strokeWidth: 1,
                            strokeCap: "square"
                        }
                    )
            }
        ),

    )

);

           // Conexão Espiritual
           diagram.linkTemplateMap.add(
            'ConexaoEspiritual',
            $gomake(
                go.Link,
                {
                    isLayoutPositioned: false,
                    fromSpot: go.Spot.Right,
                    toSpot: go.Spot.Left,
                    selectable: false
                },

                $gomake(
                    go.Shape,
                    {
                        stroke: "transparent",
                        strokeWidth: 1,
                        pathPattern:
                            $gomake(
                                go.Shape,
                                {
                                    geometryString: "M0.01 0.57c6.03,-0.13 6.92,7.15 11.49,9.52 6.46,3.34 9.47,-10.34 15.05,-9.52m-26.54 6.07c6.03,-0.13 6.92,7.15 11.49,9.52 6.46,3.34 9.47,-10.34 15.05,-9.52",
                                    fill: "transparent",
                                    stroke: "black",
                                    // fill: "none"
                                    strokeWidth: 1,

                                }
                            )
                    }
                ),

            )

        );
            // AbusoEmocional
            diagram.linkTemplateMap.add(
                'AbusoEmocional',
                $gomake(
                    go.Link,
                    {
                        isLayoutPositioned: false,
                        fromSpot: go.Spot.Right,
                        toSpot: go.Spot.Left,
                        selectable: false
                    },
                    $gomake(
                        go.Shape,
                        {
                            stroke: "transparent",
                            strokeWidth: 1,
                            pathPattern:
                                $gomake(
                                    go.Shape,
                                    {
                                        geometryString: "M0 4 L2 0 6 8 8 4",
                                        fill: "transparent",
                                        stroke: "black",
                                        strokeWidth: 1,
                                        strokeCap: "square"
                                    }
                                )
                        }
                    ),
                    $gomake(go.Shape,
                        {
                            toArrow: "Triangle",
                            fill: "#FEFFFD",
                            scale: 1.5
                        })
                )
            );
        },

        setupMarriages: function () {
            var self = this;
            var model = self._diagram.model;
            var nodeDataArray = model.nodeDataArray;

            for (var i = 0; i < nodeDataArray.length; i++) {
                var data = nodeDataArray[i];
                var key = data.identificacao;
                if (data.relacionamentos !== undefined) {
                    for (var j = 0; j < data.relacionamentos.length; j++) {
                        var relationship = data.relacionamentos[j];
                        var segmentLength = self.segmentLength + j * self.segmentLength / 2;

                        if (key === relationship.com) {
                            // ou avisar sem casamentos reflexivos
                            continue;
                        }
                        var link = self.findMarriage(key, relationship.com);
                        if (link === null) {
                            // Adicionar um nó de rótulo para o vínculo de casamento
                            var mlab = {
                                genero: 'LinkLabel',
                                pais: [] // evitar erro em setupParents
                            };
                            model.addNodeData(mlab);

                            // Adicionar o vínculo de casamento em si, também referindo-se ao nó de rótulo
                            // var mdata = {from: key, to: wife, labelKeys: [mlab.key], category: 'Marriage'};
                            var mdata = {
                                from: key,
                                to: relationship.com,
                                labelKeys: [mlab.identificacao],
                                categoria: relationship.categoria,
                                segmentLength: segmentLength
                            };
                            model.addLinkData(mdata);
                        }
                    }
                }
            }
        },

        setupParents: function () {
            var self = this;
            var model = self._diagram.model;
            var nodeDataArray = model.nodeDataArray;

            for (var i = 0; i < nodeDataArray.length; i++) {
                var data = nodeDataArray[i];
                var key = data.identificacao;

                var pais = data.pais
                    .filter(function (val) {
                        return ["", null].indexOf(val.com) === -1
                    })
                    .map(function (val) {
                        return val.com
                    });

                // pai/mae 2 ou +
                if (pais.length > 1) {
                    var link = self.findMarriage.apply(self, pais);
                    if (link === null) {
                        // pai(s) desconhecido(s)
                        self.logger('unknown marriage: ' + pais);
                        continue;
                    }
                    var cdata = { from: '', to: key };

                    if (link.isLabeledLink) {
                        var mdata = link.data;
                        var mlabkey = mdata.labelKeys[0];
                        cdata.from = mlabkey;
                    } else {
                        cdata.from = link.key;
                    }
                    model.addLinkData(cdata);
                }
            }
        },
        findMarriage: function (a, b) {
            var self = this;

            var nodeA = self._diagram.findNodeForKey(a);
            var nodeB = self._diagram.findNodeForKey(b);

            // casal
            if (nodeA !== null && nodeB !== null) {
                var it = nodeA.findLinksBetween(nodeB); // em qualquer direção
                while (it.next()) {
                    var link = it.value;
                    // Link.data.category === "Marriage" significa que é uma relação de casamento
                    if (
                        link.data !== null &&
                        (
                            link.data.categoria === 'Marriage' ||
                            link.data.categoria === 'Separate' ||
                            link.data.categoria === 'ExMarriage' ||
                            link.data.categoria === 'UniaoEstavel' ||
                            link.data.categoria === 'CasoAmor' ||
                            link.data.categoria === 'RelacaoSexual' ||
                            link.data.categoria === 'Reconsiliacao' ||
                            link.data.categoria === 'ReconsiliacaoAD'

                        )
                    )
                        return link;
                }
            }
            // apenas 1 pai/mae?
            else if (nodeA !== null || nodeB !== null) {
                return nodeA || nodeB;
            }
            return null;
        },

        //Relacionamento entre familiares
        setupRelation: function () {
            var self = this;
            var model = self._diagram.model;
            var nodeDataArray = model.nodeDataArray;

            for (var i = 0; i < nodeDataArray.length; i++) {
                var data = nodeDataArray[i];
                var key = data.identificacao;
                if (data.relacao !== undefined) {
                    for (var j = 0; j < data.relacao.length; j++) {
                        var relationship = data.relacao[j];

                        if (key === relationship.com) {
                            // ou avisar sem casamentos reflexivos
                            continue;
                        }
                        var link = self.findRelation(key, relationship.com);
                        if (link === null) {
                            // Adicionar um nó de rótulo para o vínculo de casamento
                            var mlab = {
                                genero: 'LinkLabel',
                                pais: [] // evitar erro em setupParents
                            };
                            model.addNodeData(mlab);

                            // Adicionar o vínculo de casamento em si, também referindo-se ao nó de rótulo
                            // var mdata = {from: key, to: wife, labelKeys: [mlab.key], category: 'Marriage'};
                            var mdata = {
                                from: key,
                                to: relationship.com,
                                labelKeys: [mlab.identificacao],
                                categoria: relationship.categoria
                            };
                            model.addLinkData(mdata);
                        }
                    }
                }
            }
        },
        findRelation: function (a, b) {
            var self = this;

            var nodeA = self._diagram.findNodeForKey(a);
            var nodeB = self._diagram.findNodeForKey(b);

            // casal
            if (nodeA !== null && nodeB !== null) {
                var it = nodeA.findLinksBetween(nodeB); // em qualquer direção
                while (it.next()) {
                    var link = it.value;
                    if (
                        link.data !== null &&
                        (
                            link.data.categoria === 'Hostil' ||
                            link.data.categoria === 'Distante' ||
                            link.data.categoria === 'abusosex' ||
                            link.data.categoria === 'AbusoFisico' ||
                            link.data.categoria === 'Unido' ||
                            link.data.categoria === 'Proximo' ||
                            link.data.categoria === 'RelacaoPositiva' ||
                            link.data.categoria === 'FocadoEm' ||
                            link.data.categoria === 'FocadoNegativamente' ||
                            link.data.categoria === 'Rompimento' ||
                            link.data.categoria === 'RompimentoReparado' ||
                            link.data.categoria === 'AbusoEmocional' ||
                            link.data.categoria === 'ProximoHostil' ||
                            link.data.categoria === 'ConexaoEspiritual' 
                        )
                    )
                        return link;
                }
            }
            // apenas 1 pai/mae?
            else if (nodeA !== null || nodeB !== null) {
                return nodeA || nodeB;
            }
            return null;
        },

        print: function () {
            var self = this;
            var diagram = self._diagram;

            var svgWindow = window.open();
            if (!svgWindow) return;  // failure to open a new Window

            var svg = diagram.makeSVG({
                document: svgWindow.document,
                scale: 1,
                maxSize: new go.Size(NaN, NaN)
            });
            svgWindow.document.body.appendChild(svg);
            setTimeout(function () {
                svgWindow.print();

            }, 1);
        },
        exportImg: function (event) {
            var self = this;
            var diagram = self._diagram;

            var svgWindow = window.open();
            if (!svgWindow) return;  // failure to open a new Window

            var svg = diagram.makeSvg({
                document: svgWindow.document,
                scale: 1,
                background: "white",
                maxSize: new go.Size(NaN, NaN)
            });
            var svgstr = new XMLSerializer().serializeToString(svg);
            var blob = new Blob([svgstr], { type: "image/svg+xml" });
            var url = window.URL.createObjectURL(blob);
            var filename = event + ".svg";

            var a = document.createElement("a");
            a.style = "display: none";
            a.href = url;
            a.download = filename;

            // IE 11
            if (window.navigator.msSaveBlob !== undefined) {
                window.navigator.msSaveBlob(blob, filename);
                return;
            }

            document.body.appendChild(a);
            requestAnimationFrame(function () {
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            });
        },
        logger: function (txt) {
            if (window.console)
                window.console.log(txt);
        },
        geometric_genres: {
            // generic
            g_slash: go.Geometry.parse('F M38 0 L40 0 40 2 2 40 0 40 0 38z'),

            // male
            m_tlsq: go.Geometry.parse('F M1 1 l19 0 0 19 -19 0z'),
            m_trsq: go.Geometry.parse('F M20 1 l19 0 0 19 -19 0z'),
            m_brsq: go.Geometry.parse('F M20 20 l19 0 0 19 -19 0z'),
            m_blsq: go.Geometry.parse('F M1 20 l19 0 0 19 -19 0z'),

            // AE
            m_tlsq0: go.Geometry.parse('F M1 1 l1 0 0 20 -29 0z'), //esquerda em cima
            m_trsq0: go.Geometry.parse('F M30 1 l29 20 0 0 -29 0z'), //direita em cima
            m_brsq0: go.Geometry.parse('F M30 40 l29 -20 0 0 -29 0z'), //direita em baixo  //ajustar
            m_blsq0: go.Geometry.parse('F M1 20 l29 0 0 19 -1 0z'), //esquerda em baixo

            // TLS
            m_tlsq1: go.Geometry.parse('F M1 1 l29 0 0 19 -29 0z'),
            m_trsq1: go.Geometry.parse('F M30 1 l29 0 0 19 -29 0z'),
            m_brsq1: go.Geometry.parse('F M30 20 l29 0 0 19 -29 0z'),
            m_blsq1: go.Geometry.parse('F M1 20 l29 0 0 19 -29 0z'),

            // SF
            m_tlsq2: go.Geometry.parse('F M1 1 l29 0 0 19 -29 0z'), //esquerda em cima
            m_trsq2: go.Geometry.parse('F M30 1 l29 0 0 19 -29 0z'), //direita em cima
            m_brsq2: go.Geometry.parse('F M30 20 l29 0 0 19 -29 0z'), //direita em baixo
            m_blsq2: go.Geometry.parse('F M0 -2 h-30 -24 30, v-10 -20,'), //esquerda em baixo

            // female
            f_tlarc: go.Geometry.parse('F M20 20 B 180 90 20 20 19 19 z'),
            f_trarc: go.Geometry.parse('F M20 20 B 270 90 20 20 19 19 z'),
            f_brarc: go.Geometry.parse('F M20 20 B 0 90 20 20 19 19 z'),
            f_blarc: go.Geometry.parse('F M20 20 B 90 90 20 20 19 19 z')
        },
        maleCharacteristics: function (c) {
            var self = this;

            switch (c) {
                case self.characteristics.A.id:
                    return self.geometric_genres.m_tlsq;
                case self.characteristics.B.id:
                    return self.geometric_genres.m_tlsq;
                case self.characteristics.C.id:
                    return self.geometric_genres.m_tlsq;
                case self.characteristics.D.id:
                    return self.geometric_genres.m_trsq;
                case self.characteristics.E.id:
                    return self.geometric_genres.m_trsq;
                case self.characteristics.F.id:
                    return self.geometric_genres.m_trsq;
                case self.characteristics.G.id:
                    return self.geometric_genres.m_brsq;
                case self.characteristics.H.id:
                    return self.geometric_genres.m_brsq;
                case self.characteristics.I.id:
                    return self.geometric_genres.m_brsq;
                case self.characteristics.J.id:
                    return self.geometric_genres.m_blsq;
                case self.characteristics.K.id:
                    return self.geometric_genres.m_blsq;
                case self.characteristics.L.id:
                    return self.geometric_genres.m_blsq;
                case self.characteristics.S.id:
                    return self.geometric_genres.g_slash;
                default:
                    return self.geometric_genres.m_tlsq;
            }
        },
        aeCharacteristics: function (c) {
            var self = this;

            switch (c) {
                case self.characteristics.A.id:
                    return self.geometric_genres.m_tlsq0;
                case self.characteristics.B.id:
                    return self.geometric_genres.m_tlsq0;
                case self.characteristics.C.id:
                    return self.geometric_genres.m_tlsq0;
                case self.characteristics.D.id:
                    return self.geometric_genres.m_trsq0;
                case self.characteristics.E.id:
                    return self.geometric_genres.m_trsq0;
                case self.characteristics.F.id:
                    return self.geometric_genres.m_trsq0;
                case self.characteristics.G.id:
                    return self.geometric_genres.m_brsq0;
                case self.characteristics.H.id:
                    return self.geometric_genres.m_brsq0;
                case self.characteristics.I.id:
                    return self.geometric_genres.m_brsq0;
                case self.characteristics.J.id:
                    return self.geometric_genres.m_blsq0;
                case self.characteristics.K.id:
                    return self.geometric_genres.m_blsq0;
                case self.characteristics.L.id:
                    return self.geometric_genres.m_blsq0;
                case self.characteristics.S.id:
                    return self.geometric_genres.g_slash;
                default:
                    return self.geometric_genres.m_tlsq0;
            }
        },
        tlsCharacteristics: function (c) {
            var self = this;

            switch (c) {
                case self.characteristics.A.id:
                    return self.geometric_genres.m_tlsq1;
                case self.characteristics.B.id:
                    return self.geometric_genres.m_tlsq1;
                case self.characteristics.C.id:
                    return self.geometric_genres.m_tlsq1;
                case self.characteristics.D.id:
                    return self.geometric_genres.m_trsq1;
                case self.characteristics.E.id:
                    return self.geometric_genres.m_trsq1;
                case self.characteristics.F.id:
                    return self.geometric_genres.m_trsq1;
                case self.characteristics.G.id:
                    return self.geometric_genres.m_brsq1;
                case self.characteristics.H.id:
                    return self.geometric_genres.m_brsq1;
                case self.characteristics.I.id:
                    return self.geometric_genres.m_brsq1;
                case self.characteristics.J.id:
                    return self.geometric_genres.m_blsq1;
                case self.characteristics.K.id:
                    return self.geometric_genres.m_blsq1;
                case self.characteristics.L.id:
                    return self.geometric_genres.m_blsq1;
                case self.characteristics.S.id:
                    return self.geometric_genres.g_slash;
                default:
                    return self.geometric_genres.m_tlsq1;
            }
        },
        sfCharacteristics: function (c) {
            var self = this;

            switch (c) {
                case self.characteristics.A.id:
                    return self.geometric_genres.m_tlsq2;
                case self.characteristics.B.id:
                    return self.geometric_genres.m_tlsq2;
                case self.characteristics.C.id:
                    return self.geometric_genres.m_tlsq2;
                case self.characteristics.D.id:
                    return self.geometric_genres.m_trsq2;
                case self.characteristics.E.id:
                    return self.geometric_genres.m_trsq2;
                case self.characteristics.F.id:
                    return self.geometric_genres.m_trsq2;
                case self.characteristics.G.id:
                    return self.geometric_genres.m_brsq2;
                case self.characteristics.H.id:
                    return self.geometric_genres.m_brsq2;
                case self.characteristics.I.id:
                    return self.geometric_genres.m_brsq2;
                case self.characteristics.J.id:
                    return self.geometric_genres.m_blsq2;
                case self.characteristics.K.id:
                    return self.geometric_genres.m_blsq2;
                case self.characteristics.L.id:
                    return self.geometric_genres.m_blsq2;
                case self.characteristics.S.id:
                    return self.geometric_genres.g_slash;
                default:
                    return self.geometric_genres.m_tlsq2;
            }
        },
        femaleCharacteristics: function (c) {
            var self = this;

            switch (c) {
                case self.characteristics.A.id:
                    return self.geometric_genres.f_tlarc;
                case self.characteristics.B.id:
                    return self.geometric_genres.f_tlarc;
                case self.characteristics.C.id:
                    return self.geometric_genres.f_tlarc;
                case self.characteristics.D.id:
                    return self.geometric_genres.f_trarc;
                case self.characteristics.E.id:
                    return self.geometric_genres.f_trarc;
                case self.characteristics.F.id:
                    return self.geometric_genres.f_trarc;
                case self.characteristics.G.id:
                    return self.geometric_genres.f_brarc;
                case self.characteristics.H.id:
                    return self.geometric_genres.f_brarc;
                case self.characteristics.I.id:
                    return self.geometric_genres.f_brarc;
                case self.characteristics.J.id:
                    return self.geometric_genres.f_blarc;
                case self.characteristics.K.id:
                    return self.geometric_genres.f_blarc;
                case self.characteristics.L.id:
                    return self.geometric_genres.f_blarc;
                case self.characteristics.S.id:
                    return self.geometric_genres.g_slash;
                default:
                    return self.geometric_genres.f_tlarc;
            }
        },
        characteristics_color: function (c) {
            var self = this;

            switch (c) {
                case self.characteristics.A.id:
                    return "grey";
                case self.characteristics.B.id:
                    return "lightblue";
                case self.characteristics.C.id:
                    return "pink";
                case self.characteristics.D.id:
                    return "darkblue";
                case self.characteristics.E.id:
                    return "purple";
                case self.characteristics.F.id:
                    return "red";
                case self.characteristics.G.id:
                    return "yellow";
                case self.characteristics.H.id:
                    return "lightgreen";
                case self.characteristics.I.id:
                    return "blue";
                case self.characteristics.J.id:
                    return "brown";
                case self.characteristics.K.id:
                    return "orange";
                case self.characteristics.L.id:
                    return "darkgreen";
                case self.characteristics.S.id:
                    return "red";
                default:
                    return "transparent";
            }
        },
        characteristics: {
            blank: {
                id: "",
                name: "blank",
                title: "Em Branco"
            },
            A: {
                id: "A",
                name: "a_grande",
                title: "A Grande"
            },
            B: {
                id: "B",
                name: "b_grande",
                title: "B Grande"
            },
            C: {
                id: "C",
                name: "c_grande",
                title: "C Grande"
            },
            D: {
                id: "D",
                name: "d_grande",
                title: "D Grande"
            },
            E: {
                id: "E",
                name: "e_grande",
                title: "E Grande"
            },
            F: {
                id: "F",
                name: "f_grande",
                title: "F Grande"
            },
            G: {
                id: "G",
                name: "g_grande",
                title: "G Grande"
            },
            H: {
                id: "H",
                name: "h_grande",
                title: "H Grande"
            },
            I: {
                id: "I",
                name: "i_grande",
                title: "I Grande"
            },
            J: {
                id: "J",
                name: "j_grande",
                title: "J Grande"
            },
            K: {
                id: "K",
                name: "k_grande",
                title: "K Grande"
            },
            L: {
                id: "L",
                name: "l_grande",
                title: "L Grande"
            },
            S: {
                id: "S",
                name: "s_grande",
                title: "S Grande"
            }
        }
    };

    window.GenControle = genController;

})(jQuery, window.go, window.GenogramLayout);
