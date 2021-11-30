;
var placeholders = {
    pais: function () {
        return {
            categoria: '',
            com: ''
        };
    },
    relacionamentos: function () {
        return {
            categoria: '',
            com: ''
        };
    },
    relacao: function () {
        return {
            categoria: '',
            com: ''
        };
    },
    person: function () {
        return {
            identificacao: null,
            nome: '',
            sobrenome: '',
            genero: 'M',
            patologias: [],
            data_nascimento: '',
            data_falecimento: '',
            pais: [
                // {category: 'pai', com: 0}
                // {category: 'mae', com: 1}
            ],
            relacionamentos: [
                // {category: 'Marriage', com: 5}
                // {category: 'ExMarriage', com: 6}
            ],
            relacao: [
                // {category: 'Hostil', com: 8}
                // {category: 'AbusoSexual', com: 9}
            ]
        };
    },
};

(function ($) {
    $(function () {
        // inicialização do genograma
        window.gencontroller = new GenControle('myDiagramDiv');

        window.app = new Vue({
            el: '#controles-form',
            data: {
                person_selected: new placeholders.person(), // inicialização vazia
                people: {}, // edição
                patologias: [
                    ["I", "Alzheimer"],
                    ["A", "Artrite"],
                    ["B", "Autismo"],
                    ["C", "Câncer"],
                    ["D", "Depressão"],
                    ["E", "Diabete"],
                    ["F", "Doença Cardíaca"],
                    ["G", "DST"],
                    ["H", "Hepatite"],
                    ["J", "Hipertensão/Pressão Alta"],
                    ["K", "HIV/Aids"],
                    ["L", "Obesidade"],
                    ["M", "Outros"]
                ],
                nome_genogram: '',
                nome_genogram_export: '',
                file_input_id: '#file-' + new Date().getTime()
            },
            watch: {
                // --------------------------------------------
                // a ordem de execução no WHATCH é a ordem que
                // os 'watchers' estiverm definidos abaixo
                // --------------------------------------------
                'person_selected.data_falecimento': function (valNew, valOld) {
                    // busca a definição da FLAG equivalente à FALECIMENTO
                    var flag = 'S';

                    if (window.GenControle !== undefined) {
                        flag = window.GenControle.prototype.characteristics.S.id;
                    }

                    // a FLAG de pagologia foi configurada anteriormente...
                    if (
                        (typeof this.person_selected.patologias === "object") &&
                        (this.person_selected.patologias.indexOf(flag) > -1)
                    ) {
                        // yap... a flag está configurada.
                        // porém, deveria estar configurada?
                        if (["", null].indexOf(valNew) > -1) {

                            // não deveria... REMOVENDO
                            this.person_selected.patologias.splice(this.person_selected.patologias.indexOf(flag), 1);
                        }
                    } else {
                        // nope... a flag NÃO está configurada.
                        // porém, deveria estar configurada?
                        if (["", null].indexOf(valNew) === -1) {
                            // sim, deveria... ADICIONANDO
                            this.person_selected.patologias.push(flag);
                        }
                    }
                    // segue o jogo...
                },
                people: {
                    handler: function (newVal, oldVal) {
                        // se algum item for alterado...
                        // ...atualiza o GENOGRAMA
                        this.genogram_sync_people()
                    },
                    deep: true
                }
            },
            computed: {
                person_selected_patologias_sorted: {
                    // necessario para manter a ORDEM alfabética no ARRAY
                    // assim, a 'morte (S)' sempres ficará o FINAL do array
                    //
                    // durante a criação do SVG, pelo genogram, ele será o
                    // último item a ser criado, ficando no topo
                    get: function () {
                        return this.person_selected.patologias;
                    },
                    set: function (val) {
                        if (typeof val === "object" && typeof val.sort === "function") {
                            val.sort();
                        }

                        this.person_selected.patologias = val;
                    }
                }
            },
            methods: {
                disponible_person_for_parents: function (identificacao_atual) {
                    var self = this;

                    // retornar todas as pessoas que...
                    return Object.values(app.people).filter(function (value) {
                        // não seja a própria pessoa selecionada
                        if (value.identificacao === self.person_selected.identificacao) {
                            return false;
                        }
                        // seja especificado para permitir
                        if (
                            (identificacao_atual !== null) &&
                            (value.identificacao === identificacao_atual)
                        ) {
                            return true;
                        }

                        // e somente pessoa NÃO vinculada como parente
                        return self
                            .person_selected
                            .pais
                            .map(function (val) {
                                return val.com
                            })
                            .indexOf(value.identificacao) === -1;
                    });
                },
                disponible_person_for_relationships: function (identificacao_atual) {
                    var self = this;

                    // retornar todas as pessoas que...
                    return Object.values(app.people).filter(function (value) {
                        // não seja a própria pessoa selecionada
                        if (value.identificacao === self.person_selected.identificacao) {
                            return false;
                        }
                        // seja especificado para permitir
                        if (
                            (identificacao_atual !== null) &&
                            (value.identificacao === identificacao_atual)
                        ) {
                            return true;
                        }

                        // e somente pessoa NÃO vinculada como outras pessoas já relacionadas
                        return self
                            .person_selected
                            .relacionamentos
                            .map(function (val) {
                                return val.com
                            })
                            .indexOf(value.identificacao) === -1;
                    });
                },
                disponible_person_for_relation: function (identificacao_atual) {
                    var self = this;

                    // retornar todas as pessoas que...
                    return Object.values(app.people).filter(function (value) {
                        // não seja a própria pessoa selecionada
                        if (value.identificacao === self.person_selected.identificacao) {
                            return false;
                        }
                        // seja especificado para permitir
                        if (
                            (identificacao_atual !== null) &&
                            (value.identificacao === identificacao_atual)
                        ) {
                            return true;
                        }

                        // e somente pessoa NÃO vinculada como outras pessoas já relacionadas
                        return self
                            .person_selected
                            .relacao
                            .map(function (val) {
                                return val.com
                            })
                            .indexOf(value.identificacao) === -1;
                    });
                },
                person_new_id: function () {
                    // uuid-v4 -> random
                    return uuid.v4();
                },
                // familia start
                btn_family_new: function (event) {
                    this.person_selected.pais.push(
                        new placeholders.pais()
                    );
                },
                // familia end
                // relacionamentos start
                btn_relationships_new: function (event) {
                    this.person_selected.relacionamentos.push(
                        new placeholders.relacionamentos()
                    );
                },
                btn_relation_new: function (event) {
                    this.person_selected.relacao.push(
                        new placeholders.relacao()
                    );
                },
                // relacionamentos end
                btn_person_new: function (genero) {
                    this.person_selected = new placeholders.person();
                    this.person_selected.identificacao = this.person_new_id();
                    this.person_selected.genero = genero
                    // necessário para disparar Watchers
                    console.log("genero", genero)
                    Vue.set(this.people, this.person_selected.identificacao, this.person_selected, this.person_selected.genero);
                    // console.log(event)
                },
                btn_person_delete: function (event) {

                    if (this.person_selected.identificacao) {

                        var id = this.person_selected.identificacao;
                        this.person_selected = new placeholders.person();

                        // necessário para disparar Watchers
                        Vue.delete(this.people, id);
                    }
                },
                btn_print: function (event) {
                    gencontroller.print();
                },
                btn_export_img: function (event) {
                    gencontroller.exportImg(event);
                },
                btn_export_genogram: function (event) {
                    var data = 'text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(app.people));
                    var linkElement = document.createElement('a');
                    linkElement.href = 'data:' + data;
                    linkElement.download = event + '.json';
                    linkElement.click();
                },
                btn_data_load: function (event) {
                    var self = this;
                    // através o ID definido no campo 'file_input_id'
                    // vamos tentar localizar o INPUT na body
                    var $input = $(self.file_input_id);
                    // se não houver input...
                    if ($input.length === 0) {
                        // vamos criá-lo com alguns atributos especificados
                        $input = $("<input>")
                            .attr({
                                id: self.file_input_id.replace("#", ""),
                                type: 'file',
                                accept: '.json'
                            })
                            .css({
                                height: 0,
                                width: 0,
                                opacity: '0',
                                position: 'absolute',
                                top: -100,
                                left: -100
                            });
                        $input.appendTo("body");
                    }

                    var f_input_change = function (event) {
                        var self = this;
                        var input = event.target;
                        // caso, durante a chamada da função 'file_help_readText'
                        // retorne FALSE... talvez o Navegador não dê suporte
                        if (false === file_help_readText(input, function (content) {
                            try {
                                // vamos tentar fazer o PARSE em JSON
                                self.data_load(JSON.parse(content) || {});
                            } catch (e) {
                                alert("O arquivo informado é inválido!")
                            }
                        })) {
                            alert("Seu navegador não possui suporte necessário para utilizar esta função!")
                        }
                    };
                    // efetua um RESET da input (ela pode ter sido usada anteriormente e possui lixo)
                    $input
                        .off('change')
                        .val('')
                        // gera o BIND ao change e...
                        .on('change', $.proxy(f_input_change, self))
                        // clica no botão para abrir o POP-UP
                        .trigger('click');
                },
                data_load: function (dados) {

                    // deep copy
                    // o watch em 'people' irá disparar o 'genogram_sync_people'
                    this.people = $.extend({}, dados || {}, true);
                },
                genogram_select_person: function (node) {
                    var self = this;

                    if (node !== null) {
                        // find the person in "people"
                        // and select the person
                        self.person_selected = self.people[node.data.identificacao];
                    } else {
                        self.person_selected = new placeholders.person();
                    }
                },


                // atualiza toda a estrutura do GENOGRAM a partir dos dados internos
                genogram_sync_people: function () {
                    if (window.gencontroller !== undefined) {

                        // o STRINGIFY + PARSE é para regarar um novo objeto
                        // o VUEjs gera uma estrutura estranha para o GOjs
                        gencontroller.setupData(
                            Object.values(
                                JSON.parse(JSON.stringify(this.people))
                            ),
                            this.person_selected.identificacao
                        );
                    }
                }
            }
        });

        // 'bind' entre apps
        gencontroller.selected_person = app.genogram_select_person;
    });
})(jQuery);