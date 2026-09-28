/* ============================================================
   SCRIPT PRINCIPAL - ZONAGAME
   Ubicación: assets/js/script.js
   Semana 6 - Carrito + Buscador + Fetch + LocalStorage + Validaciones
   ============================================================
   Este archivo contiene:
   1. Inicialización del DOM
   2. Carga de productos con Fetch API (timeout + reintentos)
   3. Renderizado dinámico de productos
   4. Carrito de compras (agregar, eliminar, vaciar)
   5. Buscador de productos
   6. Notificaciones al usuario
   7. Persistencia del carrito con localStorage
   8. Validaciones del formulario de contacto
   ============================================================ */

// ============================================================
// VARIABLES GLOBALES
// ============================================================

let carrito = [];
let productosGlobales = [];

// Clave para guardar el carrito en localStorage
const CARRITO_KEY = 'zonagame_carrito';

// ============================================================
// 1. INICIALIZACIÓN DEL DOM
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ DOM cargado correctamente');

    // PRIMERO: Recuperar carrito guardado en localStorage
    cargarCarritoDesdeStorage();

    // DESPUÉS: Cargar productos y eventos
    cargarProductos();
    inicializarEventos();
    inicializarBotonReintentar();
    inicializarContadorMensaje();   // ← NUEVO
});

// ============================================================
// 2. CARGAR PRODUCTOS CON FETCH API (TIMEOUT + REINTENTOS)
// ============================================================

async function cargarProductos() {
    console.log('📦 Cargando productos desde JSON...');

    const url = 'assets/data/productos.json';
    const TIMEOUT_MS = 5000;
    const MAX_INTENTOS = 3;
    const ESPERA_MS = 2000;

    document.getElementById('mensaje-carga').style.display = 'block';
    document.getElementById('mensaje-error').style.display = 'none';

    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
        try {
            console.log(`🔄 Intento ${intento} de ${MAX_INTENTOS}...`);

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timer);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const productos = await response.json();

            console.log('✅ Productos cargados:', productos.length);
            productosGlobales = productos;
            document.getElementById('mensaje-carga').style.display = 'none';
            document.getElementById('mensaje-error').style.display = 'none';
            renderizarProductos(productos);
            return;

        } catch (error) {
            console.warn(`⚠️ Intento ${intento} falló:`, error.message);

            if (intento === MAX_INTENTOS) {
                console.error('❌ Todos los intentos fallaron');
                document.getElementById('mensaje-carga').style.display = 'none';
                document.getElementById('mensaje-error').style.display = 'block';
                return;
            }

            console.log(`⏳ Esperando ${ESPERA_MS / 1000} segundos...`);
            await new Promise(resolve => setTimeout(resolve, ESPERA_MS));
        }
    }
}

// ============================================================
// 2.1 ASIGNAR EVENTO AL BOTÓN DE REINTENTAR
// ============================================================

function inicializarBotonReintentar() {
    const btnReintentar = document.getElementById('btn-reintentar');
    if (btnReintentar) {
        btnReintentar.addEventListener('click', function () {
            console.log('🔁 Usuario hizo clic en Reintentar');
            cargarProductos();
        });
    }
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
    guardarCarritoEnStorage();
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
    guardarCarritoEnStorage();
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
    guardarCarritoEnStorage();
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
    guardarCarritoEnStorage();
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
// 13. FORMULARIO DE CONTACTO (CON VALIDACIONES)
// ============================================================

/**
 * Procesa el envío del formulario de contacto.
 * Valida los campos antes de enviar y muestra feedback visual.
 */
function enviarContacto(e) {
    e.preventDefault();

    const formulario = e.target;
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const mensaje = document.getElementById('mensaje').value.trim();

    // Validar que todos los campos estén correctos
    if (!formulario.checkValidity()) {
        formulario.classList.add('was-validated');
        mostrarNotificacion('⚠️ Por favor, corrige los errores del formulario');
        return;
    }

    // Validación extra: el email debe tener formato válido
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email)) {
        document.getElementById('email').setCustomValidity('Email inválido');
        formulario.classList.add('was-validated');
        mostrarNotificacion('⚠️ Ingresa un correo electrónico válido');
        return;
    }

    // ✅ Todo válido
    mostrarNotificacion(`✅ ¡Gracias ${nombre}! Tu mensaje ha sido enviado.`);
    console.log('📧 Formulario enviado:', { nombre, email, mensaje });

    // Limpiar formulario
    formulario.reset();
    formulario.classList.remove('was-validated');
    document.getElementById('contador-mensaje').textContent = '0';
}

// ============================================================
// 13.1 CONTADOR DE CARACTERES DEL MENSAJE
// ============================================================

/**
 * Actualiza el contador de caracteres del mensaje en tiempo real.
 */
function inicializarContadorMensaje() {
    const textareaMensaje = document.getElementById('mensaje');
    const contador = document.getElementById('contador-mensaje');

    if (textareaMensaje && contador) {
        textareaMensaje.addEventListener('input', function () {
            contador.textContent = this.value.length;
        });
    }
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
// 15. GUARDAR CARRITO EN LOCALSTORAGE
// ============================================================

function guardarCarritoEnStorage() {
    try {
        localStorage.setItem(CARRITO_KEY, JSON.stringify(carrito));
        console.log('💾 Carrito guardado en localStorage:', carrito.length, 'productos');
    } catch (error) {
        console.error('❌ Error al guardar carrito:', error);
    }
}

// ============================================================
// 16. CARGAR CARRITO DESDE LOCALSTORAGE
// ============================================================

function cargarCarritoDesdeStorage() {
    try {
        const carritoGuardado = localStorage.getItem(CARRITO_KEY);

        if (carritoGuardado) {
            carrito = JSON.parse(carritoGuardado);
            console.log('📦 Carrito recuperado:', carrito.length, 'productos');
            actualizarContadorCarrito();
        } else {
            console.log('📦 No hay carrito guardado, empezando de cero');
        }
    } catch (error) {
        console.error('❌ Error al cargar carrito:', error);
        carrito = [];
    }
}

// ============================================================
// FIN DEL SCRIPT
// ============================================================