var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({__proto__: []} instanceof Array && function (d, b) {
                d.__proto__ = b;
            }) ||
            function (d, b) {
                for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
            };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);

        function __() {
            this.constructor = d;
        }

        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

(function () {
    'use strict';

    var go = window.go;

    // Um layout personalizado que mostra as duas famílias relacionadas aos pais de uma pessoa
    var GenogramLayout = /** @class */ (function (_super) {
        __extends(GenogramLayout, _super);

        function GenogramLayout() {
            var _this = _super.call(this) || this;
            _this.initializeOption = go.LayeredDigraphLayout.InitDepthFirstIn;
            _this.spouseSpacing = 40; // espaço mínimo entre cônjuges
            return _this;
        }

        GenogramLayout.prototype.makeNetwork = function (coll) {
            // gerar LayoutEdges para cada link pai-filho
            var net = this.createNetwork();
            if (coll instanceof go.Diagram) {
                this.add(net, coll.nodes, true);
                this.add(net, coll.links, true);
            } else if (coll instanceof go.Group) {
                this.add(net, coll.memberParts, false);
            } else if (coll.iterator) {
                this.add(net, coll.iterator, false);
            }
            return net;
        };
        // método interno para criar LayeredDigraphNetwork onde marido/esposa pares são representados
        // por um único LayeredDigraphVertex correspondente ao nó de rótulo no vínculo de casamento
        GenogramLayout.prototype.add = function (net, coll, nonmemberonly) {
            var multiSpousePeople = new go.Set();
            // considerar todos os nós na coleção determinada
            var it = coll.iterator;
            var _loop_1 = function () {
                var node = it.value;
                if (!(node instanceof go.Node))
                    return "continue";
                if (!node.isLayoutPositioned || !node.isVisible())
                    return "continue";
                if (nonmemberonly && node.containingGroup !== null)
                    return "continue";
                // Se for um nó não casado, ou se for um nó de rótulo de link, crie um LayoutVertex para ele
                if (node.isLinkLabel) {
                    // obter ligação de casamento
                    var link = node.labeledLink;
                    if (link) {
                        var spouseA = link.fromNode;
                        var spouseB = link.toNode;

                        // criar vértice representando marido e mulher
                        var vertex = net.addNode(node);
                        // agora definir o tamanho do vértice para ser grande o suficiente para manter ambos os cônjuges
                        if (spouseA && spouseB) {
                            vertex.width = spouseA.actualBounds.width + this_1.spouseSpacing + spouseB.actualBounds.width;
                            vertex.height = Math.max(spouseA.actualBounds.height, spouseB.actualBounds.height);
                            vertex.focus = new go.Point(spouseA.actualBounds.width + this_1.spouseSpacing / 2, vertex.height / 2);
                        }
                        // se possui EX?
                        if (
                            (typeof spouseA.data.relacionamentos === "object")
                            ||
                            (typeof spouseB.data.relacionamentos === "object")
                        ) {
                            if (
                                typeof spouseA.data.relacionamentos === "object" &&
                                spouseA.data.relacionamentos.length > 1
                            ) {
                                // vertex.width *= spouseA.data.vir.length + 1;
                                vertex.height *= 1.5;
                            }
                            if (
                                typeof spouseB.data.relacionamentos === "object" &&
                                spouseB.data.relacionamentos.length > 1
                            ) {
                                // vertex.width *= spouseB.data.vir.length + 1;
                                vertex.height *= 1.5;
                            }
                        }
                    }
                } else {
                    // Não adicione um vértice para qualquer pessoa casada!
                    // em vez disso, o código acima adiciona nó de rótulo para vínculo de casamento
                    // assumir um casamento link tem um rótulo node
                    var marriages_1 = 0;
                    node.linksConnected.each(function (l) {
                        if (l.isLabeledLink) marriages_1++;
                    });

                    if (marriages_1 === 0) {
                        var vertex = net.addNode(node);
                    } else if (marriages_1 > 1) {
                        multiSpousePeople.add(node);
                    }
                }
            };
            var this_1 = this;
            while (it.next()) {
                _loop_1();
            }
            // agora fazer todos os links
            it.reset();
            var _loop_2 = function () {
                var link = it.value;
                if (!(link instanceof go.Link)) {
                    return "continue";
                }
                if (!link.isLayoutPositioned || !link.isVisible())
                    return "continue";
                if (nonmemberonly && link.containingGroup !== null)
                    return "continue";

                // Se for um link pai-filho, adicione um LayoutEdge para ele
                if (!link.isLabeledLink) {
                    var fromNode = link.fromNode;
                    var toNode = link.toNode;   // sei que SEMPRE será filho por conta da função "setupParents"

                    if (fromNode !== null && toNode !== null) {
                        var parent_1 = net.findVertex(fromNode); // deve ser um nó de rótulo
                        var child = net.findVertex(toNode);

                        // criança nao casada
                        if (parent_1 !== null && child !== null) {
                            net.linkVertexes(parent_1, child, link);
                        }
                        // uma criança casada
                        else if (parent_1 !== null) {
                            toNode.linksConnected.each(function (l) {
                                if (!l.isLabeledLink)
                                    return; // Se ele não tem nenhum nó de rótulo, é um link pai-filho

                                // encontrou o link de casamento, agora obter o seu rótulo node
                                var mlab = l.labelNodes.first();

                                // link pai-filho deve se conectar com o nó de rótulo,
                                // para que o LayoutEdge deve se conectar com o LayoutVertex que representa o nó de rótulo
                                if (mlab !== null) {
                                    var mlabvert = net.findVertex(mlab);
                                    if (mlabvert !== null) {
                                        net.linkVertexes(parent_1, mlabvert, link);
                                    }
                                }
                            });
                        }
                    }
                }
            };
            while (it.next()) {
                _loop_2();
            }
            var _loop_3 = function () {
                // encontrar todas as coleções de pessoas que são indiretamente casados entre si
                var node = multiSpousePeople.first();
                var cohort = new go.Set();
                this_2.extendCohort(cohort, node);
                // em seguida, incentivá-los todos a ser a mesma geração, conectando-os todos com um vértice comum
                var dummyvert = net.createVertex();
                net.addVertex(dummyvert);
                var marriages = new go.Set();
                cohort.each(function (n) {
                    n.linksConnected.each(function (l) {
                        marriages.add(l);
                    });
                });
                marriages.each(function (link) {
                    // encontrar o vértice para o vínculo de casamento (ou seja, para o nó de rótulo)
                    var mlab = link.labelNodes.first();
                    if (mlab !== null) {
                        var v = net.findVertex(mlab);
                        if (v !== null) {
                            net.linkVertexes(dummyvert, v, null);
                        }
                    }
                });
                // feito com essas pessoas, agora ver se há qualquer outro múltiplo-casado pessoas
                multiSpousePeople.removeAll(cohort);
            };
            var this_2 = this;
            while (multiSpousePeople.count > 0) {
                _loop_3();
            }
        };
        // recolher todas as pessoas indiretamente casado com uma pessoa
        GenogramLayout.prototype.extendCohort = function (coll, node) {
            if (coll.contains(node)) {
                return;
            }
            coll.add(node);
            var lay = this;
            node.linksConnected.each(function (l) {
                if (l.isLabeledLink) { // Se é um vínculo de casamento, continuar com ambos os cônjuges
                    if (l.fromNode !== null)
                        lay.extendCohort(coll, l.fromNode);
                    if (l.toNode !== null)
                        lay.extendCohort(coll, l.toNode);
                }
            });
        };
        GenogramLayout.prototype.assignLayers = function () {
            _super.prototype.assignLayers.call(this);
            var horiz = this.direction === 0.0 || this.direction === 180.0;
            // para cada vértice, registre a largura ou a altura máxima do vértice para a camada do vértice
            var maxsizes = [];
            var net = this.network;
            if (net !== null) {
                var vit = net.vertexes.iterator;
                while (vit.next()) {
                    var v = vit.value;
                    var lay = v.layer;
                    var max = maxsizes[lay];
                    if (max === undefined)
                        max = 0;
                    var sz = (horiz ? v.width : v.height);
                    if (sz > max)
                        maxsizes[lay] = sz;
                }
                vit.reset();
                // Agora certifique-se de cada vértice tem a largura máxima ou altura de acordo com qual camada está em,
                // e alinhado à esquerda (se horizontal) ou superior (se vertical)
                while (vit.next()) {
                    var v = vit.value;
                    var lay = v.layer;
                    var max = maxsizes[lay];
                    if (horiz) {
                        v.focus = new go.Point(0, v.height / 2);
                        v.width = max;
                    } else {
                        v.focus = new go.Point(v.width / 2, 0);
                        v.height = max;
                    }
                }
                // a partir de agora, o LayeredDigraphLayout vai pensar que o nó é maior do que realmente é
                // (além daquelas que são as mais largas ou as mais altas em sua camada respectiva)
            }
        };
        GenogramLayout.prototype.commitNodes = function () {
            _super.prototype.commitNodes.call(this);
            var net = this.network;
            // posicionar nós regulares
            if (net !== null) {
                var vit = net.vertexes.iterator;
                while (vit.next()) {
                    var v = vit.value;
                    if (v.node !== null && !v.node.isLinkLabel) {
                        v.node.position = new go.Point(v.x, v.y);
                    }
                }
                vit.reset();
                // posição dos cônjuges de cada vértice casamento
                var layout = this;
                while (vit.next()) {
                    var v = vit.value;
                    if (v.node === null)
                        continue;
                    if (!v.node.isLinkLabel)
                        continue;
                    var labnode = v.node;
                    var lablink = labnode.labeledLink;
                    if (lablink !== null) {
                        // No caso de os cônjuges não são realmente movidos, precisamos ter o vínculo de casamento
                        // Posicione o nó de rótulo, porque LayoutVertex. Commit () foi chamado acima nesses vértices.
                        // Alternativamente, poderíamos substituir LayoutVetex. Commit para ser um não-op para vertexes de nó de rótulo.
                        lablink.invalidateRoute();
                        var spouseA = lablink.fromNode;
                        var spouseB = lablink.toNode;
                        if (spouseA !== null && spouseB != null) {
                            // preferem os pais à esquerda, as mães à direita
                            if (spouseA.data.genero === 'F') { // sexo é feminino
                                var temp = spouseA;
                                spouseA = spouseB;
                                spouseB = temp;
                            }
                            // Ver se os pais estão nos lados desejados, para evitar um cruzamento de link
                            var aParentsNode = layout.findParentsMarriageLabelNode(spouseA);
                            var bParentsNode = layout.findParentsMarriageLabelNode(spouseB);
                            if (aParentsNode !== null && bParentsNode !== null && aParentsNode.position.x > bParentsNode.position.x) {
                                // trocar os cônjuges
                                var temp = spouseA;
                                spouseA = spouseB;
                                spouseB = temp;
                            }
                            spouseA.position = new go.Point(v.x, v.y);
                            spouseB.position = new go.Point(v.x + spouseA.actualBounds.width + layout.spouseSpacing, v.y);
                            if (spouseA.opacity === 0) {
                                var pos = new go.Point(v.centerX - spouseA.actualBounds.width / 2, v.y);
                                spouseA.position = pos;
                                spouseB.position = pos;
                            } else if (spouseB.opacity === 0) {
                                var pos = new go.Point(v.centerX - spouseB.actualBounds.width / 2, v.y);
                                spouseA.position = pos;
                                spouseB.position = pos;
                            }
                        }
                    }
                }
                vit.reset();
                var _loop_4 = function () {
                    var v = vit.value;
                    if (v.node === null || v.node.linksConnected.count > 1)
                        return "continue";
                    var mnode = layout.findParentsMarriageLabelNode(v.node);
                    if (mnode !== null && mnode.linksConnected.count === 1) { // se apenas uma criança
                        if (layout.network === null)
                            return "continue";
                        var mvert = layout.network.findVertex(mnode);
                        if (mvert !== null) {
                            var newbnds = v.node.actualBounds.copy();
                            newbnds.x = mvert.centerX - v.node.actualBounds.width / 2;
                            // Ver se há algum espaço vazio no ponto médio horizontal nessa camada
                            if (layout.diagram !== null) {
                                var overlaps = layout.diagram.findObjectsIn(
                                    newbnds,
                                    function (x) {
                                        var p = x.part;
                                        return (p instanceof go.Part) ? p : null;
                                    },
                                    function (p) {
                                        return p !== v.node;
                                    },
                                    true
                                );
                                if (overlaps.count === 0) {
                                    v.node.move(newbnds.position);
                                }
                            }
                        }
                    }
                };
                // posição somente-nós filho para estar o nó de rótulo de casamento
                while (vit.next()) {
                    _loop_4();
                }
            }
        };
        GenogramLayout.prototype.findParentsMarriageLabelNode = function (node) {
            var it = node.findNodesInto();
            while (it.next()) {
                var n = it.value;
                if (n.isLinkLabel)
                    return n;
            }
            return null;
        };
        return GenogramLayout;
    }(go.LayeredDigraphLayout));
    window.GenogramLayout = GenogramLayout;
})();
// end GenogramLayout class
