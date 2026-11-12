/* Login de exemplo: só valida no navegador, sem segurança real. */
(function () {
	'use strict';

	var form = document.getElementById('loginForm');
	var usuarioInput = document.getElementById('usuario');
	var senhaInput = document.getElementById('senha');
	var erro = document.getElementById('erro');

	form.addEventListener('submit', function (event) {
		event.preventDefault();

		var usuario = usuarioInput.value.trim().toLowerCase();

		if (!usuario || !senhaInput.value) {
			erro.textContent = 'Preencha a matrícula e a senha.';
			return;
		}

		if (usuario.indexOf('senai') !== -1) {
			window.location.href = 'Inicio/index.html';
		} else {
			erro.textContent = 'Usuário inválido. Por favor, insira um usuário existente.';
			usuarioInput.focus();
		}
	});

	usuarioInput.addEventListener('input', function () { erro.textContent = ''; });
	senhaInput.addEventListener('input', function () { erro.textContent = ''; });
})();