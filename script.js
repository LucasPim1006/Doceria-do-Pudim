const urlBase = 'http://localhost:5024';

// 1. MODO ESCURO
const checkbox = document.getElementById("btnDark");
if (checkbox) {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark");
    checkbox.checked = true;
  }
  checkbox.addEventListener("change", function () {
    document.body.classList.toggle("dark", checkbox.checked);        
    localStorage.setItem("darkMode", checkbox.checked);
  });
}

// 2. CONTROLE DE SESSÃO
function atualizarBarraUsuario() {
  const usuarioSalvo = JSON.parse(localStorage.getItem('clienteLogado'));
  const linkEntrar = document.querySelector('.header-nav a[href="entrar.html"]');
  const btnSair = document.querySelector('.header-nav .Sair');

  if (usuarioSalvo && usuarioSalvo.nome) {
    if (linkEntrar) {
      linkEntrar.textContent = `Olá, ${usuarioSalvo.nome}`;
      linkEntrar.href = 'perfil.html';
    }
    if (btnSair) {
      btnSair.style.display = 'inline-block';
      btnSair.onclick = function (evento) {
        evento.preventDefault();
        localStorage.removeItem('clienteLogado');
        window.location.href = 'entrar.html';
      };
    }
  } else {
    if (linkEntrar) {
      linkEntrar.textContent = 'Entrar';
      linkEntrar.href = 'entrar.html';
    }
    if (btnSair) {
      btnSair.style.display = 'none';
    }
  }
}
atualizarBarraUsuario();

// 3. CADASTRO E LOGIN
const formAuth = document.querySelector('.auth-card');
if (formAuth && formAuth.tagName === 'FORM') {
  formAuth.addEventListener('submit', function(evento) {
    evento.preventDefault();
    const dados = new FormData(formAuth);
    const ehCadastro = formAuth.querySelector('input[name="cpf"]') !== null;

    if (ehCadastro) {
      const novoCliente = {
        nome: dados.get('nome'),
        sobrenome: dados.get('sobrenome'),
        cpf: dados.get('cpf'),
        telefone: dados.get('telefone'),
        email: dados.get('email'),
        senha: dados.get('senha')
      };

      fetch(`${urlBase}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoCliente)
      })
      .then(res => {
        if (res.ok) {
          alert('Cadastro realizado com sucesso! Agora faça seu login.');
          window.location.href = 'entrar.html';
        } else {
          alert('Erro ao cadastrar. Verifique os dados.');
        }
      })
      .catch(() => alert('Erro de conexão com o servidor C#.'));
    } else {
      const credenciais = {
        email: dados.get('email'),
        senha: dados.get('senha')
      };

      fetch(`${urlBase}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciais)
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Dados inválidos');
      })
      .then(cliente => {
        localStorage.setItem('clienteLogado', JSON.stringify(cliente));
        alert(`Bem-vindo de volta, ${cliente.nome}!`);
        window.location.href = 'index.html';
      })
      .catch(() => alert('E-mail ou senha incorretos!'));
    }
  });
}

// 4. SACOLA DE COMPRAS
let sacola = JSON.parse(localStorage.getItem('sacolaDoceria')) || [];
let descontoCupom = 0;

function salvarSacola() {
  localStorage.setItem('sacolaDoceria', JSON.stringify(sacola));
  atualizarContadorSacola();
}

function atualizarContadorSacola() {
  const totalItens = sacola.reduce((soma, item) => soma + item.quantidade, 0);
  const btnSacola = document.querySelector('.bag-button');
  if (btnSacola) {
    btnSacola.innerHTML = `<div class="img"></div> Sacola · ${totalItens}`;
  }
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Botões "+ Adicionar" dos doces
document.querySelectorAll('.product-bottom button').forEach(botao => {
  botao.addEventListener('click', function() {
    const card = this.closest('.product-card');
    const nome = card.querySelector('h3').textContent.trim();
    const descricao = card.querySelector('p') ? card.querySelector('p').textContent.trim() : 'Doce fresquinho da casa';
    const precoTexto = card.querySelector('.product-bottom strong').textContent;
    const preco = parseFloat(precoTexto.replace('R$', '').replace('.', '').replace(',', '.').trim());
    const imgElement = card.querySelector('.product-image img');
    const imagem = imgElement ? imgElement.getAttribute('src') : 'Logo.png';

    const itemExistente = sacola.find(item => item.nome === nome);
    if (itemExistente) {
      itemExistente.quantidade += 1;
    } else {
      sacola.push({ nome, descricao, preco, imagem, quantidade: 1 });
    }

    salvarSacola();

    const textoOriginal = this.textContent;
    this.textContent = '✓ Adicionado';
    setTimeout(() => { this.textContent = textoOriginal; }, 900);
  });
});

// 5. PÁGINA DA SACOLA
const ehPaginaSacola = window.location.pathname.includes('sacola') || document.querySelector('.resumo') !== null;

if (ehPaginaSacola) {
  const painelPedido = document.querySelector('.coluna .painel') || document.querySelector('.painel');

  function desenharSeuPedido() {
    if (!painelPedido) return;

    const totalUnidades = sacola.reduce((soma, item) => soma + item.quantidade, 0);
    let html = `
      <div class="painel-topo">
        <h2>Seu pedido</h2>
        <span class="muted">${totalUnidades} ${totalUnidades === 1 ? 'item' : 'itens'}</span>
      </div>
    `;

    if (sacola.length === 0) {
      html += `
        <div style="padding: 40px 28px; text-align: center;">
          <p class="muted" style="font-size: 15px; margin-bottom: 16px;">Sua sacola está vazia no momento.</p>
          <a href="doces.html" class="primary-button">Explorar doces</a>
        </div>
      `;
    } else {
      sacola.forEach((item, index) => {
        const subtotalItem = item.preco * item.quantidade;
        html += `
          <div class="item">
            <img src="${item.imagem}" alt="${item.nome}">
            <div>
              <h3>${item.nome}</h3>
              <p class="muted">${item.descricao}</p>
              <button type="button" class="remover" onclick="removerItem(${index})">Remover</button>
            </div>
            <div class="item-acoes">
              <strong>${formatarMoeda(subtotalItem)}</strong>
              <div class="quantidade">
                <button type="button" onclick="alterarQtd(${index}, -1)">−</button>
                <span>${item.quantidade}</span>
                <button type="button" onclick="alterarQtd(${index}, 1)">+</button>
              </div>
            </div>
          </div>
        `;
      });
    }

    painelPedido.innerHTML = html;
    atualizarResumoValores();
  }

  window.alterarQtd = function(index, delta) {
    sacola[index].quantidade += delta;
    if (sacola[index].quantidade <= 0) {
      sacola.splice(index, 1);
    }
    salvarSacola();
    desenharSeuPedido();
  };

  window.removerItem = function(index) {
    sacola.splice(index, 1);
    salvarSacola();
    desenharSeuPedido();
  };

  function atualizarResumoValores() {
    const subtotal = sacola.reduce((soma, item) => soma + (item.preco * item.quantidade), 0);
    const taxaEntrega = subtotal > 0 ? 4.90 : 0;
    const totalFinal = Math.max(0, subtotal + taxaEntrega - descontoCupom);

    const valoresDl = document.querySelectorAll('dl dd');
    if (valoresDl.length >= 2) {
      valoresDl[0].textContent = formatarMoeda(subtotal);
      valoresDl[1].textContent = formatarMoeda(taxaEntrega);
    }

    const totalStrong = document.querySelector('.total strong');
    if (totalStrong) {
      totalStrong.textContent = formatarMoeda(totalFinal);
    }
    return totalFinal;
  }

  // Cupom BOLO20
  const btnCupom = document.querySelector('.cupom button');
  const inputCupom = document.querySelector('.cupom input');
  if (btnCupom && inputCupom) {
    btnCupom.addEventListener('click', function(e) {
      e.preventDefault();
      const codigo = inputCupom.value.trim().toUpperCase();
      const subtotal = sacola.reduce((soma, item) => soma + (item.preco * item.quantidade), 0);

      if (codigo === 'BOLO20') {
        if (subtotal >= 40) {
          descontoCupom = 20;
          alert('Cupom BOLO20 aplicado! R$ 20,00 de desconto.');
          atualizarResumoValores();
        } else {
          alert('O cupom BOLO20 é válido apenas para pedidos acima de R$ 40,00.');
        }
      } else {
        alert('Cupom inválido.');
      }
    });
  }

  // Finalizar pedido
  const btnFinalizar = document.querySelector('.finalizar') || document.querySelector('.resumo button:last-of-type') || document.querySelector('.resumo a');
  if (btnFinalizar) {
    btnFinalizar.addEventListener('click', function(e) {
      e.preventDefault();

      const clienteLogado = JSON.parse(localStorage.getItem('clienteLogado'));
      if (!clienteLogado) {
        alert('Você precisa entrar na sua conta antes de finalizar o pedido!');
        window.location.href = 'entrar.html';
        return;
      }

      if (sacola.length === 0) {
        alert('Adicione pelo menos um doce na sacola antes de comprar.');
        return;
      }

      const opcaoPagamento = document.querySelector('input[type="radio"]:checked');
      const pagamento = opcaoPagamento ? opcaoPagamento.value.toUpperCase() : 'PIX';
      const campoObs = document.querySelector('textarea');
      const observacao = campoObs ? campoObs.value.trim() : '';
      const total = atualizarResumoValores();

      const pedidoPayload = {
        clienteId: clienteLogado.id,
        pagamento: pagamento,
        observacao: observacao,
        total: total,
        itens: sacola.map(i => ({
          nome: i.nome,
          quantidade: i.quantidade,
          preco: i.preco
        }))
      };

      fetch(`${urlBase}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedidoPayload)
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Erro ao registrar pedido');
      })
      .then(dados => {
        alert(`Pedido #${dados.pedidoId} realizado com sucesso! Já está salvo na sua conta.`);
        sacola = [];
        salvarSacola();
        window.location.href = 'pedidos.html';
      })
      .catch(err => {
        console.error(err);
        alert('Erro ao finalizar compra. Verifique se o Visual Studio está rodando na porta 5024.');
      });
    });
  }

  desenharSeuPedido();
}

atualizarContadorSacola();

// 6. IMAGEM DO DOCE
function obterImagemDoce(nomeDoce) {
  if (!nomeDoce) return 'Logo.png';
  const nome = nomeDoce.toLowerCase();

  if (nome.includes('nozes')) return 'bolo com nozes.png';
  if (nome.includes('cenoura')) return 'bolo de cenoura.png';
  if (nome.includes('bolo') && nome.includes('chocolate')) return 'bolo de chocolate.png';
  if (nome.includes('brigadeiro') && nome.includes('ninho')) return 'brigadeiro de ninho.png';
  if (nome.includes('brigadeiro')) return 'brigadeiro.png';
  if (nome.includes('brownie') && nome.includes('doce de leite')) return 'brownie com doce de leite.png';
  if (nome.includes('brownie')) return 'brownie.png';
  if (nome.includes('cupcake') || nome.includes('cupcacke')) return 'cupcackes.png';
  if (nome.includes('mousse') && nome.includes('chocolate')) return 'mousse de chocolate.png';
  if (nome.includes('mousse') && (nome.includes('maracuja') || nome.includes('maracujá'))) return 'mousse de maracuja.png';
  if (nome.includes('palha') && nome.includes('ninho')) return 'palha italiana de ninho.png';
  if (nome.includes('palha')) return 'palha italiana.png';
  if (nome.includes('pudim') && nome.includes('coco')) return 'pudim de coco.png';
  if (nome.includes('pudim')) return 'pudim2.png';

  return 'Logo.png';
}

// 7. HISTÓRICO DE PEDIDOS 
const containerPedidos = document.getElementById('lista-pedidos-container');

if (containerPedidos) {
  const clienteLogado = JSON.parse(localStorage.getItem('clienteLogado'));

  if (!clienteLogado) {
    containerPedidos.innerHTML = `
      <div class="painel" style="text-align: center; padding: 48px 24px;">
        <h2>Entre na sua conta</h2>
        <p class="muted" style="margin: 12px 0 24px;">Você precisa estar logado para visualizar seu histórico de pedidos.</p>
        <a href="entrar.html" class="primary-button">Ir para Login →</a>
      </div>
    `;
  } else {
    fetch(`${urlBase}/pedidos/${clienteLogado.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Erro ao buscar pedidos');
        return res.json();
      })
      .then(pedidos => {
        if (!pedidos || pedidos.length === 0) {
          containerPedidos.innerHTML = `
            <div class="painel" style="text-align: center; padding: 48px 24px;">
              <h2>Nenhum pedido por aqui ainda</h2>
              <p class="muted" style="margin: 12px 0 24px;">Que tal escolher seu primeiro doce da Doceria do Pudim?</p>
              <a href="doces.html" class="primary-button">Explorar doces →</a>
            </div>
          `;
          return;
        }

        const pedidoAtual = pedidos[0];
        const pedidosAntigos = pedidos.slice(1);

        let html = `
            <div class="order-summary">
              <div class="order-store">
                <strong>Doceria do Pudim</strong>
                <small>${pedidoAtual.itens ? pedidoAtual.itens.length : 0} item(ns)</small>
              </div>
        `;

        if (pedidoAtual.itens) {
          pedidoAtual.itens.forEach(item => {
            const imgDoce = obterImagemDoce(item.nome);
            html += `
              <div class="order-item">
                <img src="${imgDoce}" alt="${item.nome}">
                <span>
                  <strong>${item.quantidade}x ${item.nome}</strong>
                  <small>Feito na hora</small>
                </span>
                <b>${formatarMoeda(item.preco * item.quantidade)}</b>
              </div>
            `;
          });
        }

        html += `
              <div class="order-total">
                <span>
                  <strong>Total pago</strong>
                  <small>Taxa de entrega inclusa</small>
                </span>
                <strong>${formatarMoeda(pedidoAtual.total)}</strong>
              </div>
            </div>
          </article>
        `;

        if (pedidosAntigos.length > 0) {
          html += `<h2 style="margin-bottom:20px;" class="history-title">Pedidos anteriores</h2><div class="order-history">`;

          pedidosAntigos.forEach(pedido => {
            const temItens = pedido.itens && pedido.itens.length > 0;
            const primeiroItem = temItens ? `${pedido.itens[0].quantidade}x ${pedido.itens[0].nome}` : 'Doces variados';
            const qtdExtras = pedido.itens && pedido.itens.length > 1 ? ` + ${pedido.itens.length - 1} item(ns)` : '';
            const imgHistorico = temItens ? obterImagemDoce(pedido.itens[0].nome) : 'Logo.png';

            html += `
              <article class="history-card">
                <header>
                  <div>
                    <strong>Pedido #${pedido.id}</strong>
                    <small>Pagamento: ${pedido.pagamento || 'Pix'}</small>
                  </div>
                  <span class="status status-delivered">Entregue</span>
                </header>

                <div class="history-content">
                  <img src="${imgHistorico}" alt="${primeiroItem}">
                  <span>
                    <strong>${primeiroItem}${qtdExtras}</strong>
                    <small>Total: ${formatarMoeda(pedido.total)}</small>
                  </span>
                </div>

                <footer>
                  <span class="stars">★★★★★</span>
                  <a href="doces.html"><button type="button">Pedir novamente</button></a>
                </footer>
              </article>
            `;
          });

          html += `</div>`;
        }

        containerPedidos.innerHTML = html;
      })
      .catch(err => {
        console.error(err);
        containerPedidos.innerHTML = `
          <div class="painel" style="padding: 32px; text-align: center;">
            <p class="muted">Não foi possível carregar os pedidos. Verifique se o Visual Studio está rodando na porta 5024.</p>
          </div>
        `;
      });
  }
}

// 8. FILTRO DE DOCES
const barra = document.querySelector('.search-box input');
const botoes = document.querySelectorAll('.filters a');
const doces = document.querySelectorAll('.product-card');

let categoriaAtual = 'todos';

function filtrarDoces() {
  if (!barra) return;
  const busca = barra.value.toLowerCase();

  doces.forEach(function (doce) {
    const texto = doce.textContent.toLowerCase();
    const categoriaDoce = doce.querySelector('small').textContent.toLowerCase();

    const bateBusca = texto.includes(busca);
    const bateCategoria = categoriaAtual === 'todos' || categoriaDoce === categoriaAtual;

    doce.style.display = (bateBusca && bateCategoria) ? '' : 'none';
  });
}

if (barra) {
  barra.addEventListener('input', filtrarDoces);
}

botoes.forEach(function (botao) {
  botao.addEventListener('click', function (e) {
    e.preventDefault();

    botoes.forEach(b => b.classList.remove('active'));
    botao.classList.add('active');

    categoriaAtual = botao.textContent.toLowerCase().trim();
    filtrarDoces();
  });
});

// 9. MÁSCARAS DE INPUT
function mascara_cpf() {
  var cpf_formatado = document.getElementById("cpf").value;
  if (cpf_formatado[3] != ".") {
    if (cpf_formatado[3] != undefined) {
      document.getElementById("cpf").value = cpf_formatado.slice(0, 3) + "." + cpf_formatado[3];
    }
  }
  if (cpf_formatado[7] != ".") {
    if (cpf_formatado[7] != undefined) {
      document.getElementById("cpf").value = cpf_formatado.slice(0, 7) + "." + cpf_formatado[7];
    }
  }
  if (cpf_formatado[11] != "-") {
    if (cpf_formatado[11] != undefined) {
      document.getElementById("cpf").value = cpf_formatado.slice(0, 11) + "-" + cpf_formatado[11];
    }
  }
}

function mascara_tel() {
  var tel_formatado = document.getElementById("telefone").value;
  if (tel_formatado[0] != "(") {
    if (tel_formatado[0] != undefined) {
      document.getElementById("telefone").value = "(" + tel_formatado[0];
    }
  }
  if (tel_formatado[3] != ")") {
    if (tel_formatado[3] != undefined) {
      document.getElementById("telefone").value = tel_formatado.slice(0, 3) + ")" + tel_formatado[3];
    }
  }
  if (tel_formatado[9] != "-") {
    if (tel_formatado[9] != undefined) {
      document.getElementById("telefone").value = tel_formatado.slice(0, 9) + "-" + tel_formatado[9];
    }
  }
}


// 10. PÁGINA DE PERFIL DO USUÁRIO
const containerPerfil = document.getElementById('conteudo-perfil');
if (containerPerfil) {
  const usuarioSalvo = JSON.parse(localStorage.getItem('clienteLogado'));

  if (!usuarioSalvo) {
    window.location.href = 'entrar.html';
  } else {
    function preencherCamposPerfil(dados) {
      const nome = dados.nome || '';
      const sobrenome = dados.sobrenome || '';
      const iniciais = `${nome.charAt(0)}${sobrenome.charAt(0)}`.toUpperCase() || 'DP';

      document.getElementById('perfil-iniciais').textContent = iniciais;
      document.getElementById('perfil-titulo-nome').textContent = `${nome} ${sobrenome}`.trim();
      document.getElementById('perfil-subtitulo-email').textContent = dados.email || '';

      document.getElementById('perfil-nome').value = nome;
      document.getElementById('perfil-sobrenome').value = sobrenome;
      document.getElementById('perfil-cpf').value = dados.cpf || 'Não informado';
      document.getElementById('perfil-telefone').value = dados.telefone || '';
      document.getElementById('perfil-email').value = dados.email || '';
    }

    preencherCamposPerfil(usuarioSalvo);

    if (usuarioSalvo.id) {
      fetch(`${urlBase}/clientes/${usuarioSalvo.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(clienteAtualizado => {
          if (clienteAtualizado) {
            localStorage.setItem('clienteLogado', JSON.stringify(clienteAtualizado));
            preencherCamposPerfil(clienteAtualizado);
          }
        })
        .catch(() => console.log('Usando dados em cache do perfil.'));
    }

    const btnSairPerfil = document.getElementById('btn-sair-perfil');
    if (btnSairPerfil) {
      btnSairPerfil.addEventListener('click', function () {
        localStorage.removeItem('clienteLogado');
        window.location.href = 'entrar.html';
      });
    }
  }
}
