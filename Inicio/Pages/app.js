/* Script compartilhado: salva os dados no localStorage e monta cada página
   de acordo com o atributo data-page do <body>. */
(function () {
	'use strict';

	var KEY = { turmas: 'p1dtm_turmas', alunos: 'p1dtm_alunos', projetos: 'p1dtm_projetos' };

	function $(id) { return document.getElementById(id); }

	/* ---------- armazenamento ---------- */
	function ler(chave) {
		try {
			var v = JSON.parse(localStorage.getItem(KEY[chave]));
			return Array.isArray(v) ? v : [];
		} catch (e) { return []; }
	}

	function salvar(chave, lista) {
		try {
			localStorage.setItem(KEY[chave], JSON.stringify(lista));
			return true;
		} catch (e) { return false; }
	}

	function turmas() {
		var existe = null;
		try { existe = localStorage.getItem(KEY.turmas); } catch (e) {}
		if (existe === null) {
			var inicial = [{ nome: '1DTM' }, { nome: '2DTM' }];
			salvar('turmas', inicial);
			return inicial;
		}
		return ler('turmas');
	}

	/* ---------- utilidades de interface ---------- */
	function aviso(texto, ok) {
		var p = $('aviso');
		if (!p) return;
		p.textContent = texto;
		p.className = 'aviso ' + (ok ? 'ok' : 'erro');
	}

	function preencherTurmas(select) {
		turmas().forEach(function (t) {
			var op = document.createElement('option');
			op.value = t.nome;
			op.textContent = t.nome;
			select.appendChild(op);
		});
	}

	function renderTabela(tbody, colunas, linhas) {
		tbody.textContent = '';
		if (!linhas.length) {
			var tr = document.createElement('tr');
			var td = document.createElement('td');
			td.colSpan = colunas;
			td.className = 'vazio';
			td.textContent = 'Nenhum registro cadastrado.';
			tr.appendChild(td);
			tbody.appendChild(tr);
			return;
		}
		linhas.forEach(function (celulas) {
			var tr = document.createElement('tr');
			celulas.forEach(function (c) {
				var td = document.createElement('td');
				if (typeof c === 'string') td.textContent = c; else td.appendChild(c);
				tr.appendChild(td);
			});
			tbody.appendChild(tr);
		});
	}

	function lerArquivo(file, limite) {
		return new Promise(function (resolve) {
			if (!file || file.size > limite) return resolve(null);
			var r = new FileReader();
			r.onload = function () { resolve({ tipo: file.type, src: r.result }); };
			r.onerror = function () { resolve(null); };
			r.readAsDataURL(file);
		});
	}

	/* ---------- páginas ---------- */
	var paginas = {
		cadastroTurmas: function () {
			$('form-turma').addEventListener('submit', function (e) {
				e.preventDefault();
				var nome = $('nome').value.trim();
				var lista = turmas();
				if (!nome) return aviso('Informe o nome da turma.', false);
				var repetida = lista.some(function (t) { return t.nome.toLowerCase() === nome.toLowerCase(); });
				if (repetida) return aviso('Essa turma já está cadastrada.', false);
				lista.push({ nome: nome });
				if (!salvar('turmas', lista)) return aviso('Não foi possível salvar.', false);
				this.reset();
				aviso('Turma cadastrada com sucesso!', true);
			});
		},

		cadastroAlunos: function () {
			preencherTurmas($('turma'));
			$('form-aluno').addEventListener('submit', function (e) {
				e.preventDefault();
				var nome = $('nome').value.trim();
				var turma = $('turma').value;
				if (!nome || !turma) return aviso('Preencha o nome e escolha a turma.', false);
				var lista = ler('alunos');
				lista.push({ nome: nome, turma: turma });
				if (!salvar('alunos', lista)) return aviso('Não foi possível salvar.', false);
				this.reset();
				aviso('Aluno cadastrado com sucesso!', true);
			});
		},

		criarProjetos: function () {
			preencherTurmas($('turma'));
			$('form-projeto').addEventListener('submit', function (e) {
				e.preventDefault();
				var form = this;
				var alunos = $('alunos').value.split(',')
					.map(function (a) { return a.trim(); })
					.filter(Boolean);
				var arquivo = $('imagem').files[0];

				lerArquivo(arquivo, 1.5 * 1024 * 1024).then(function (midia) {
					var projeto = {
						id: Date.now().toString(36),
						nome: $('nome').value.trim(),
						descricao: $('descricao').value.trim(),
						linguagem: $('linguagem').value.trim(),
						turma: $('turma').value,
						alunos: alunos,
						midia: midia
					};
					var lista = ler('projetos');
					lista.push(projeto);
					if (!salvar('projetos', lista)) {
						return aviso('Não foi possível salvar (arquivo muito grande?).', false);
					}
					form.reset();
					var extra = (arquivo && !midia) ? ' O arquivo passou de 1,5 MB e não foi anexado.' : '';
					aviso('Projeto criado com sucesso!' + extra, true);
				});
			});
		},

		listarTurmas: function () {
			renderTabela($('lista'), 1, turmas().map(function (t) { return [t.nome]; }));
		},

		listarAlunos: function () {
			renderTabela($('lista'), 2, ler('alunos').map(function (a) { return [a.nome, a.turma]; }));
		},

		listarProjetos: function () {
			renderTabela($('lista'), 5, ler('projetos').map(function (p) {
				var link = document.createElement('a');
				link.href = 'projeto.html?id=' + encodeURIComponent(p.id);
				link.textContent = 'Visualizar';
				return [p.nome, p.descricao, p.alunos.join(', '), p.turma, link];
			}));
		},

		projeto: function () {
			var id = new URLSearchParams(location.search).get('id');
			var p = ler('projetos').filter(function (x) { return x.id === id; })[0];
			if (!p) {
				$('titulo').textContent = 'Projeto não encontrado';
				$('detalhes').hidden = true;
				return;
			}
			document.title = p.nome;
			$('titulo').textContent = p.nome;
			$('turma-projeto').textContent = 'Turma: ' + p.turma;
			$('descricao').textContent = p.descricao;
			$('linguagem').textContent = p.linguagem || 'Não informada.';

			var ul = $('alunos');
			p.alunos.forEach(function (a) {
				var li = document.createElement('li');
				li.textContent = a;
				ul.appendChild(li);
			});

			var m = p.midia, destino = $('midia');
			if (m && /^data:(image|video)\//.test(m.src)) {
				var el = document.createElement(m.tipo.indexOf('video/') === 0 ? 'video' : 'img');
				el.src = m.src;
				if (el.tagName === 'VIDEO') el.controls = true; else el.alt = 'Imagem do projeto ' + p.nome;
				destino.appendChild(el);
			} else {
				destino.textContent = 'Nenhuma imagem ou vídeo anexado.';
			}
		}
	};

	/* ---------- inicialização ---------- */
	var atual = location.pathname.split('/').pop();
	document.querySelectorAll('.menu a').forEach(function (a) {
		if (a.getAttribute('href') === atual) a.setAttribute('aria-current', 'page');
	});

	var pagina = document.body.getAttribute('data-page');
	if (paginas[pagina]) paginas[pagina]();
})();
