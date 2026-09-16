/* ============================================================
   SCRIPT PRINCIPAL - ZONAGAME
   Ubicación: assets/js/script.js
   Semana 6 - Carrito + Buscador + Fetch API
   ============================================================
   Este archivo contiene:
   1. Inicialización del DOM
   2. Carga de productos con Fetch API
   3. Renderizado dinámico de productos
   4. Carrito de compras (agregar, eliminar, vaciar)
   5. Buscador de productos
   6. Notificaciones al usuario
   ============================================================ */

// ============================================================
// VARIABLES GLOBALES
// ============================================================

let carrito = [];
let productosGlobales = [];

// ============================================================
// 1. INICIALIZACIÓN DEL DOM
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ DOM cargado correctamente');
    cargarProductos();
    inicializarEventos();
});

// ============================================================
// 2. CARGAR PRODUCTOS CON FETCH API
// ============================================================

function cargarProductos() {
    console.log('📦 Cargando productos desde JSON...');

    fetch('assets/data/productos.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(productos => {
            console.log('✅ Productos cargados:', productos.length);
            productosGlobales = productos;
            document.getElementById('mensaje-carga').style.display = 'none';
            renderizarProductos(productos);
        })
        .catch(error => {
            console.error('❌ Error al cargar productos:', error);
            document.getElementById('mensaje-carga').style.display = 'none';
            document.getElementById('mensaje-error').style.display = 'block';
        });
}

// ============================================================
// 3. RENDERIZAR PRODUCTOS EN EL DOM
// ============================================================

function renderizarProductos(productos) {
    const contenedor = document.getElementById('contenedor-productos');
    contenedor.innerHTML = '';

    if (productos.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5">
                <h4 class="text-muted">😢 No se encontraron productos</h4>
            </div>
        `;
        return;
    }

    productos.forEach(producto => {
        const columna = document.createElement('div');
        columna.className = 'col-12 col-md-6 col-lg-4';
        columna.innerHTML = `
            <div class="card h-100 shadow-sm">
                <img src="${producto.imagen}" class="card-img-top" alt="${producto.nombre}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${producto.nombre}</h5>
                    <p class="card-text text-muted">${producto.descripcion}</p>
                    <p class="precio mt-auto">💰 $${producto.precio.toLocaleString('es-CL')} CLP</p>
                    <button class="btn btn-primary-custom w-100 btn-agregar" data-id="${producto.id}">
                        Agregar al carrito 🛒
                    </button>
                </div>
            </div>
        `;
        contenedor.appendChild(columna);
    });

    asignarEventosAgregar();
}

// ============================================================
// 4. INICIALIZAR EVENTOS
// ============================================================

function inicializarEventos() {
    document.getElementById('btn-carrito').addEventListener('click', abrirModalCarrito);
    document.getElementById('btn-vaciar-carrito').addEventListener('click', vaciarCarrito);
    document.getElementById('btn-finalizar-compra').addEventListener('click', finalizarCompra);
    document.getElementById('formulario-busqueda').addEventListener('submit', buscarProductos);
    document.getElementById('formulario-contacto').addEventListener('submit', enviarContacto);
}

// ============================================================
// 5. ASIGNAR EVENTOS A BOTONES "AGREGAR AL CARRITO"
// ============================================================

function asignarEventosAgregar() {
    const botones = document.querySelectorAll('.btn-agregar');
    botones.forEach(boton => {
        boton.addEventListener('click', function () {
            const id = parseInt(this.getAttribute('data-id'));
            agregarAlCarrito(id);
        });
    });
}

// ============================================================
// 6. AGREGAR AL CARRITO
// ============================================================

function agregarAlCarrito(id) {
    const producto = productosGlobales.find(p => p.id === id);
    if (!producto) {
        mostrarNotificacion('❌ Producto no encontrado');
        return;
    }

    const existente = carrito.find(p => p.id === id);
    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            cantidad: 1
        });
    }

    actualizarContadorCarrito();
    mostrarNotificacion(`🛒 ${producto.nombre} agregado al carrito`);
}

// ============================================================
// 7. ACTUALIZAR CONTADOR DEL CARRITO
// ============================================================

function actualizarContadorCarrito() {
    const contador = document.getElementById('contador-carrito');
    const total = carrito.reduce((suma, item) => suma + item.cantidad, 0);
    contador.textContent = total;
}

// ============================================================
// 8. ABRIR MODAL DEL CARRITO
// ============================================================

function abrirModalCarrito() {
    const contenido = document.getElementById('contenido-carrito');
    const totalElemento = document.getElementById('total-carrito');

    if (carrito.length === 0) {
        contenido.innerHTML = `
            <p class="text-muted text-center py-4">🛒 Tu carrito está vacío</p>
        `;
        totalElemento.textContent = '0';
    } else {
        let html = `
            <table class="table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Cantidad</th>
                        <th>Subtotal</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
        `;

        let total = 0;
        carrito.forEach(item => {
            const subtotal = item.precio * item.cantidad;
            total += subtotal;
            html += `
                <tr>
                    <td>${item.nombre}</td>
                    <td>$${item.precio.toLocaleString('es-CL')}</td>
                    <td>${item.cantidad}</td>
                    <td>$${subtotal.toLocaleString('es-CL')}</td>
                    <td><button class="btn-eliminar" data-id="${item.id}">❌</button></td>
                </tr>
            `;
        });
        html += `</tbody></table>`;
        contenido.innerHTML = html;
        totalElemento.textContent = total.toLocaleString('es-CL');

        document.querySelectorAll('.btn-eliminar').forEach(boton => {
            boton.addEventListener('click', function () {
                const id = parseInt(this.getAttribute('data-id'));
                eliminarDelCarrito(id);
            });
        });
    }

    const modal = new bootstrap.Modal(document.getElementById('modal-carrito'));
    modal.show();
}

// ============================================================
// 9. ELIMINAR PRODUCTO DEL CARRITO
// ============================================================

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    actualizarContadorCarrito();
    abrirModalCarrito();
    mostrarNotificacion('🗑️ Producto eliminado');
}

// ============================================================
// 10. VACIAR CARRITO
// ============================================================

function vaciarCarrito() {
    if (carrito.length === 0) {
        mostrarNotificacion('⚠️ El carrito ya está vacío');
        return;
    }
    carrito = [];
    actualizarContadorCarrito();
    abrirModalCarrito();
    mostrarNotificacion('🗑️ Carrito vaciado completamente');
}

// ============================================================
// 11. FINALIZAR COMPRA
// ============================================================

function finalizarCompra() {
    if (carrito.length === 0) {
        mostrarNotificacion('⚠️ Tu carrito está vacío');
        return;
    }
    const total = carrito.reduce((suma, item) => suma + (item.precio * item.cantidad), 0);
    mostrarNotificacion(`✅ Compra realizada por $${total.toLocaleString('es-CL')} CLP`);
    carrito = [];
    actualizarContadorCarrito();
    abrirModalCarrito();
}

// ============================================================
// 12. BUSCADOR DE PRODUCTOS
// ============================================================

function buscarProductos(e) {
    e.preventDefault();
    const texto = document.getElementById('input-busqueda').value.toLowerCase().trim();

    if (texto === '') {
        renderizarProductos(productosGlobales);
        return;
    }

    const filtrados = productosGlobales.filter(p =>
        p.nombre.toLowerCase().includes(texto) ||
        p.descripcion.toLowerCase().includes(texto)
    );

    renderizarProductos(filtrados);
    document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
// 13. FORMULARIO DE CONTACTO
// ============================================================

function enviarContacto(e) {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value;
    mostrarNotificacion(`✅ ¡Gracias ${nombre}! Tu mensaje ha sido enviado.`);
    e.target.reset();
}

// ============================================================
// 14. NOTIFICACIONES FLOTANTES
// ============================================================

function mostrarNotificacion(mensaje) {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion';
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);

    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

// ============================================================
// FIN DEL SCRIPT
// ============================================================