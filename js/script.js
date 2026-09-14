/* ========================================
   MANIPULACIÓN DEL DOM - ZONAGAME
   Semana 5 - JavaScript
   ========================================
   Este archivo contiene:
   1. Inicialización del DOM
   2. Eventos (click, mouseover, submit)
   3. Fetch API (cargar productos)
   4. Funciones auxiliares
   ======================================== */

// ========================================
// 1. ESPERAR A QUE EL DOM ESTÉ LISTO
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM cargado correctamente');

    // Inicializar funcionalidades
    inicializarEventos();
    inicializarFormulario();
    cargarProductosDinamicos();
});

// ========================================
// 2. EVENTOS GENERALES (click y mouseover)
// ========================================
function inicializarEventos() {
    console.log('🎯 Inicializando eventos...');

    // 2.1 Evento CLICK en botones "Agregar al carrito"
    const botonesAgregar = document.querySelectorAll('.btn-agregar');
    botonesAgregar.forEach(boton => {
        boton.addEventListener('click', function() {
            const tarjeta = this.closest('.card');
            const nombreProducto = tarjeta.querySelector('.card-title').textContent;
            mostrarNotificacion(`🛒 ${nombreProducto} agregado al carrito`);
        });
    });

    // 2.2 Evento MOUSEOVER en tarjetas de productos
    const tarjetas = document.querySelectorAll('.card');
    tarjetas.forEach(tarjeta => {
        tarjeta.addEventListener('mouseover', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.transition = 'all 0.3s ease';
        });
        tarjeta.addEventListener('mouseout', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // 2.3 Evento CLICK en el botón "Ver más productos"
    const btnVerMas = document.querySelector('#btn-ver-mas');
    if (btnVerMas) {
        btnVerMas.addEventListener('click', function() {
            const seccionExtra = document.querySelector('#productos-extra');

            if (seccionExtra.style.display === 'none' || seccionExtra.style.display === '') {
                seccionExtra.style.display = 'block';
                this.textContent = '🔼 Ocultar productos';
            } else {
                seccionExtra.style.display = 'none';
                this.textContent = '🔽 Ver más productos';
            }
        });
    }
}

// ========================================
// 3. EVENTO SUBMIT EN FORMULARIO DE CONTACTO
// ========================================
function inicializarFormulario() {
    const formulario = document.querySelector('#formulario-contacto');

    if (formulario) {
        formulario.addEventListener('submit', function(e) {
            e.preventDefault(); // Evita que la página se recargue

            const nombre = document.querySelector('#nombre').value;

            if (nombre.trim() === '') {
                mostrarNotificacion('⚠️ Por favor, ingresa tu nombre');
                return;
            }

            mostrarNotificacion(`✅ ¡Gracias ${nombre}! Tu mensaje ha sido enviado.`);
            this.reset(); // Limpia el formulario
        });
    }
}

// ========================================
// 4. FETCH API - CARGAR PRODUCTOS DESDE JSON
// ========================================
function cargarProductosDinamicos() {
    console.log('📦 Cargando productos desde JSON...');

    fetch('data/productos.json')
        .then(response => {
            // Verificar si la respuesta es correcta
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(productos => {
            console.log('✅ Productos cargados:', productos.length);
            mostrarProductosEnDOM(productos);
        })
        .catch(error => {
            console.error('❌ Error al cargar productos:', error);
            mostrarNotificacion('❌ Error al cargar los productos');
        });
}

// ========================================
// 5. MOSTRAR PRODUCTOS EN EL DOM (createElement + appendChild)
// ========================================
function mostrarProductosEnDOM(productos) {
    // Crear contenedor si no existe
    let contenedor = document.querySelector('#productos-extra');

    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'productos-extra';
        contenedor.className = 'row g-4 mt-4';
        contenedor.style.display = 'none';

        const seccionProductos = document.querySelector('#productos');
        seccionProductos.appendChild(contenedor);
    }

    // Limpiar contenedor antes de agregar nuevos elementos
    contenedor.innerHTML = '';

    // Crear tarjetas dinámicamente con createElement
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
                    <button class="btn btn-primary-custom w-100 btn-agregar">Agregar al carrito 🛒</button>
                </div>
            </div>
        `;

        contenedor.appendChild(columna);
    });

    // Reactivar eventos en los nuevos botones
    inicializarEventos();
}

// ========================================
// 6. FUNCIÓN AUXILIAR: MOSTRAR NOTIFICACIONES
// ========================================
function mostrarNotificacion(mensaje) {
    // Crear elemento de notificación dinámicamente
    const notificacion = document.createElement('div');
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #6b46c1;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 9999;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;

    // Agregar al DOM
    document.body.appendChild(notificacion);

    // Eliminar después de 3 segundos
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

// ========================================
// 7. AGREGAR ANIMACIONES CSS DINÁMICAMENTE
// ========================================
const estilosAnimacion = document.createElement('style');
estilosAnimacion.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(estilosAnimacion);

// ========================================
// FIN DEL ARCHIVO
// ========================================