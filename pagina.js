document.addEventListener('DOMContentLoaded', function () {
    // Verificar autenticación
    if (!sessionStorage.getItem('auth')) {
        window.location.href = 'login.html';
        return;
    }

    if (typeof ApiController === 'undefined') {
        console.error('ApiController no está definido');
        Swal.fire({
            icon: 'error',
            title: 'Error crítico',
            text: 'No se pudo cargar el controlador de API',
        });
        return;
    }

    setupRaccoonCursor();//mapache
    // Cargar datos del usuario
    const userRole = sessionStorage.getItem('userRole')?.toLowerCase();
    switch (userRole) {
        case 'visualizador':
        case 'visualizador':
            roleMessage = 'Visualizador';
            break;
        case 'operador basico':
        case 'operador basico':
            roleMessage = 'Operador Básico';
            break;
        case 'operador avanzado':
        case 'operador avanzado':
            roleMessage = 'Operador Avanzado';
            break;
        case 'administrador':
        case 'administrador':
            roleMessage = 'Administrador';
            break;
        default:
            roleMessage = userRole;
            console.warn('Rol no reconocido:', userRole);
    }

    //aca
    function setupRaccoonCursor() {
        const body = document.body;
        let raccoonCount = 0;
        const maxRaccoons = 50;

        // Mover el cursor - mapaches pequeños
        document.addEventListener('mousemove', function (e) {
            if (raccoonCount >= maxRaccoons) return;

            // Crear un nuevo mapache solo en el 30% de los movimientos para no saturar
            if (Math.random() > 0.7) {
                createRaccoon(e.clientX, e.clientY, false);
            }
        });

        // Click del mouse - más mapaches
        document.addEventListener('click', function (e) {
            // Crear varios mapaches en el clic
            for (let i = 0; i < 5; i++) {
                createRaccoon(e.clientX, e.clientY, true);
            }
        });

        function createRaccoon(x, y, isClick) {
            if (raccoonCount >= maxRaccoons) return;

            const raccoon = document.createElement('div');
            raccoon.className = 'raccoon';
            raccoon.style.left = `${x - 20}px`;
            raccoon.style.top = `${y - 20}px`;

            // Configurar animación aleatoria
            const angle = Math.random() * Math.PI * 2;
            const distance = isClick ? 100 + Math.random() * 100 : 50 + Math.random() * 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance - 50;
            const rotation = (Math.random() - 0.5) * 360;

            raccoon.style.setProperty('--tx', `${tx}px`);
            raccoon.style.setProperty('--ty', `${ty}px`);
            raccoon.style.setProperty('--r', `${rotation}deg`);

            // Tamaño aleatorio para variedad
            const size = isClick ? 0.8 + Math.random() * 0.4 : 0.5 + Math.random() * 0.3;
            raccoon.style.transform = `scale(${size})`;

            body.appendChild(raccoon);
            raccoonCount++;

            // Eliminar el mapache después de la animación
            setTimeout(() => {
                raccoon.remove();
                raccoonCount--;
            }, 3000);
        }
    }
    //aca

    function checkPermissions() {
        const userRole = sessionStorage.getItem('userRole')?.toLowerCase();

        if (!userRole) {
            window.location.href = 'login.html';
            return;
        }

        // Deshabilitar secciones según el rol
        const restrictedSections = [];

        if (userRole === 'visualizador') {
            restrictedSections.push('#usuarios', '#reportes', '#otro');
        } else if (userRole === 'basico') {
            restrictedSections.push('#usuarios');
        }

        restrictedSections.forEach(section => {
            const navItem = document.querySelector(`.nav-link[href="${section}"]`);
            if (navItem) {
                navItem.parentElement.style.display = 'none';
            }
        });
    }

    // Llamar a la función después de verificar la autenticación
    checkPermissions();

    function showLoading(show) {
        const loadingElements = document.querySelectorAll('.loading-state');
        loadingElements.forEach(el => {
            el.style.display = show ? 'flex' : 'none';
        });
    }

    function showError(message) {
        if (message === "Error al cargar actividad: Actividad no encontrada") {
            console.warn(message);
            return;
        }

        console.error(message);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    }

    function showSuccess(message) {
        console.log(message);
        Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    }


    // Navegación
    function setupNavigation() {
        document.querySelectorAll('.app-content').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById('inicio').style.display = 'block';
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);

                if (!targetSection) {
                    console.error(`Sección no encontrada: ${targetId}`);
                    return;
                }

                document.querySelectorAll('.app-content').forEach(section => {
                    section.style.display = 'none';
                });
                targetSection.style.display = 'block';

                document.querySelectorAll('.nav-item').forEach(item => {
                    item.classList.remove('active');
                });
                this.parentElement.classList.add('active');

                // Cargar datos específicos
                switch (targetId) {
                    case 'actividades':
                        setupActivitySection();
                        break;
                    case 'planeacion':
                        setupPlanningSection();
                        break;
                    case 'usuarios':
                        loadUsuariosData();
                        break;
                    case 'reportes':
                        initReportesSection();
                        break;
                    case 'otro':
                        loadOtroData();
                        break;
                    default:
                        loadInitialData();
                }
            });
        });
    }

    // Carga inicial
    async function loadInitialData() {
        showLoading(true);

        try {
            const actividades = getActivitiesFromStorage(); // Obtener de localStorage
            const planeaciones = await ApiController.getPlaneaciones().catch(e => {
                showError('Error cargando planeaciones');
                return [];
            });

            updateDashboard(actividades, planeaciones);
            loadRecentReports();

        } catch (error) {
            showError('Error al cargar datos iniciales: ' + error.message);
        } finally {
            showLoading(false);
        }
    }

    function updateDateTime() {
        const now = new Date();
        const optionsDate = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = now.toLocaleDateString('es-ES', optionsDate);
        const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
        document.getElementById('current-time').textContent = now.toLocaleTimeString('es-ES', optionsTime);
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);

    function updateDashboard(actividades = [], planeaciones = []) {
        const upcomingEl = document.getElementById('upcoming-activities');
        if (upcomingEl) {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalizar la fecha actual

            const upcomingActivities = actividades
                .filter(act => {
                    try {
                        if (!act.fecha) return false;
                        const actDate = new Date(act.fecha);
                        actDate.setHours(0, 0, 0, 0);
                        return actDate >= today;
                    } catch (e) {
                        console.error("Error procesando fecha de actividad:", e);
                        return false;
                    }
                })
                .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                .slice(0, 3);

            if (upcomingActivities.length > 0) {
                upcomingEl.innerHTML = upcomingActivities.map(act => `
                <div class="upcoming-activity" data-id="${act.id}">
                    <div class="activity-header">
                        <h4 class="activity-title">${act.descripcion_actividad || 'Actividad sin nombre'}</h4>
                        <span class="activity-date">
                            ${formatDate(act.fecha)}
                        </span>
                    </div>
                    <div class="activity-details">
                        <div class="detail-item">
                            <i class="fas fa-cube"></i>
                            <span>${act.descripcion_actividad || 'No asignado'}</span>
                        </div>
                    </div>
                </div>
            `).join('');
            } else {
                upcomingEl.innerHTML = `
                <div class="no-activities">
                    <i class="fas fa-calendar-check"></i>
                    <p>No hay actividades próximas</p>
                </div>
            `;
            }
        }

        // Mostrar planeaciones recientes
        const planningEl = document.getElementById('planning-data');
        if (planningEl) {
            planningEl.innerHTML = planeaciones.slice(0, 5).map(p => `
            <tr>
                <td>PL-${p.id.toString().padStart(3, '0')}</td>
                <td>${p.unidad_responsable || 'Sin unidad'}</td>
                <td>${p.jefe_unidad || 'Sin jefe'}</td>
                <td>${p.objetivo_area || 'sin objetivo'}</td>
                <td>
                    <button class="table-btn view-btn" data-id="${p.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5">No hay planeaciones recientes</td></tr>';
        }

        // Agregar evento de clic a los botones de vista
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const planningId = this.getAttribute('data-id');
                showPlanningDetails(planningId, planeaciones);
            });
        });

        // Función auxiliar para formatear fechas
        function formatDate(dateString) {
            try {
                const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
                return new Date(dateString).toLocaleDateString('es-ES', options);
            } catch (e) {
                console.error("Error formateando fecha:", e);
                return dateString || 'Sin fecha';
            }
        }
    }

    function showPlanningDetails(planningId, planeaciones) {
        const planeacion = planeaciones.find(p => p.id == planningId);
        if (!planeacion) {
            showError('No se encontró la planeación solicitada');
            return;
        }

        // Crear el modal si no existe
        if (!document.getElementById('planning-details-modal')) {
            const modal = document.createElement('div');
            modal.id = 'planning-details-modal';
            modal.className = 'modal';
            modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <span class="close-modal">&times;</span>
                <h2>Detalles de Planeación</h2>
                <div class="planning-details">
                    <div class="detail-row">
                        <span class="detail-label">ID:</span>
                        <span class="detail-value" id="detail-id">PL-${planeacion.id.toString().padStart(3, '0')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Unidad Responsable:</span>
                        <span class="detail-value" id="detail-unidad">${planeacion.unidad_responsable || 'No especificado'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Jefe de Unidad:</span>
                        <span class="detail-value" id="detail-jefe">${planeacion.jefe_unidad || 'No especificado'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Medio de Verificación:</span>
                        <span class="detail-value" id="detail-medio">${planeacion.medio_verificacion || 'No especificado'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Objetivo de Área:</span>
                        <span class="detail-value" id="detail-objetivo">${planeacion.objetivo_area || 'No especificado'}</span>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary close-details">Cerrar</button>
                </div>
            </div>
        `;
            document.body.appendChild(modal);
        }

        // Mostrar el modal
        const modal = document.getElementById('planning-details-modal');
        modal.style.display = 'block';

        // Configurar eventos de cierre
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.querySelector('.close-details').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    function getActivitiesFromStorage() {
        const activities = localStorage.getItem('activities');
        return activities ? JSON.parse(activities) : [];
    }

    // Función para guardar actividades en localStorage
    function saveActivityToStorage(activity) {
        const actividades = getActivitiesFromStorage();

        // Asegurarse de que la actividad tenga todos los campos necesarios
        const completeActivity = {
            ...activity,
            id: activity.id || generateActivityId(),
            createdAt: activity.createdAt || new Date().toISOString()
        };

        actividades.push(completeActivity);
        localStorage.setItem('tec-actividades', JSON.stringify(actividades));

        // Actualizar el dashboard inmediatamente
        updateDashboard(actividades, []);
    }


    //local
    function getActivitiesFromStorage() {
        const actividades = localStorage.getItem('tec-actividades');
        return actividades ? JSON.parse(actividades) : [];
    }

    // Guardar una actividad en localStorage
    function saveActivityToStorage(activity) {
        const actividades = getActivitiesFromStorage();
        actividades.push(activity);
        localStorage.setItem('tec-actividades', JSON.stringify(actividades));
    }

    // Actualizar una actividad en localStorage
    function updateActivityInStorage(id, updatedActivity) {
        const actividades = getActivitiesFromStorage();
        const index = actividades.findIndex(a => a.id === id);

        if (index !== -1) {
            actividades[index] = updatedActivity;
            localStorage.setItem('tec-actividades', JSON.stringify(actividades));
            return true;
        }
        return false;
    }

    // Eliminar una actividad de localStorage
    function deleteActivityFromStorage(id) {
        const actividades = getActivitiesFromStorage();
        const filtered = actividades.filter(a => a.id !== id);
        localStorage.setItem('tec-actividades', JSON.stringify(filtered));
    }

    // Generar un ID único para nuevas actividades
    function generateActivityId() {
        return 'act-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }


    // Actividades
    async function setupActivitySection() {
        showLoading(true);

        try {
            const actividades = getActivitiesFromStorage();
            const [componentes, medidas, objetivos, responsables] = await Promise.all([
                ApiController.getComponentes().catch(() => []),
                ApiController.getMedidas().catch(() => []),
                ApiController.getObjetivos().catch(() => []),
                ApiController.getResponsables().catch(() => [])
            ]);

            // Rellenar selects con datos completos
            fillSelect('componente', componentes, 'id', 'descripcion_componente');
            fillSelect('medida', medidas, 'id', 'descripcion_medida');
            fillSelect('objetivo', objetivos, 'id', 'nombre_objetivo');
            fillSelect('responsable', responsables, 'id', 'nombre_responsable');

            renderActivitiesList(actividades);

            // Actualizar el dashboard con las actividades
            updateDashboard(actividades, []);

        } catch (error) {
            console.error("Error en setupActivitySection:", error);
            showError('Error al cargar actividades: ' + error.message);
        } finally {
            showLoading(false);
        }
    }


    function fillSelect(selectId, items, valueField, textField) {
        const select = document.getElementById(selectId);
        if (!select) {
            console.error(`Elemento select no encontrado: ${selectId}`);
            return;
        }

        // Guarda la selección actual
        const currentValue = select.value;

        // Limpia el select
        select.innerHTML = '';

        // Añade opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = items?.length ? 'Seleccionar...' : 'No hay datos';
        select.appendChild(defaultOption);

        // Añade items si existen
        if (items?.length) {
            items.forEach(item => {
                const option = document.createElement('option');
                option.value = item[valueField] || '';
                option.textContent = item[textField] || 'Sin nombre';
                select.appendChild(option);
            });

            // Restaura la selección previa si existe
            if (currentValue && select.querySelector(`option[value="${currentValue}"]`)) {
                select.value = currentValue;
            }
        }
    }

    function renderActivitiesList(actividades) {
        const container = document.getElementById('activities-list');
        if (!container) return;

        if (actividades.length === 0) {
            container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt empty-icon"></i>
                <p>No hay actividades registradas</p>
            </div>
        `;
        } else {
            container.innerHTML = actividades.map(actividad => `
            <div class="activity-card" data-id="${actividad.id}">
                <div class="activity-info">
                    <h4>${actividad.descripcion_actividad}</h4>
                    <div class="activity-meta">
                        ${actividad.cantidad_anual > 1 ?
                    `<span class="annual-count">Ejecuciones anuales: ${actividad.cantidad_anual}</span>` : ''}
                    </div>
                </div>
                <div class="activity-actions">
                    <button class="btn btn-outline edit-btn" data-id="${actividad.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-outline delete-btn" data-id="${actividad.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
        }
    }

    async function setupPlanningSection() {
        showLoading(true);

        try {
            const [planeaciones, responsables] = await Promise.all([
                ApiController.getPlaneaciones().catch(() => []),
                ApiController.getResponsables().catch(() => [])
            ]);

            fillSelect('planning-responsable', responsables, 'id', 'nombre_responsable');
            renderPlanningsList(planeaciones);

            // Configurar formulario y eventos
            setupPlanningForm();

            document.getElementById('filter-planning-unit')?.addEventListener('change', async (e) => {
                const unit = e.target.value;
                const status = document.getElementById('filter-planning-status').value;
                await filterPlannings(unit, status);
            });

            document.getElementById('filter-planning-status')?.addEventListener('change', async (e) => {
                const status = e.target.value;
                const unit = document.getElementById('filter-planning-unit').value;
                await filterPlannings(unit, status);
            });

        } catch (error) {
            console.error("Error en setupPlanningSection:", error);
            showError('Error al cargar planeación: ' + error.message);
        } finally {
            showLoading(false);
        }
    }

    // Función para renderizar la lista de planeaciones
    function renderPlanningsList(planeaciones) {
        const container = document.getElementById('plannings-list');
        if (!container) return;

        if (planeaciones.length === 0) {
            container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt empty-icon"></i>
                <p>No hay planeaciones registradas</p>
                <button id="create-first-planning" class="btn btn-outline">
                    <i class="fas fa-plus"></i> Crear primera planeación
                </button>
            </div>
        `;

            document.getElementById('create-first-planning')?.addEventListener('click', () => {
                document.getElementById('planning-form-content').style.display = 'block';
                document.querySelector('.empty-state').style.display = 'none';
            });
        } else {
            container.innerHTML = planeaciones.map(planeacion => `
            <div class="activity-card" data-id="${planeacion.id}">
                <div class="activity-info">
                    <h4>${planeacion.unidad_responsable || 'Planeación sin nombre'}</h4>
                    <div class="activity-meta">
                        <span>Jefe: ${planeacion.jefe_unidad || 'No asignado'}</span>
                        <span>Medio de verificación: ${planeacion.medio_verificacion || 'No asignado'}</span>
                    </div>
                </div>
                <div class="activity-actions">
                    <button class="btn btn-outline edit-planning" data-id="${planeacion.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-outline delete-planning" data-id="${planeacion.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
        }
    }

    // Función para configurar el formulario de planeación
    function setupPlanningForm() {
        const createBtn = document.querySelector('#planeacion #create-planning-btn');
        const createFirstBtn = document.querySelector('#planeacion #create-first-planning');
        const cancelBtn = document.querySelector('#planeacion #cancel-plan-btn');
        const saveBtn = document.querySelector('#planeacion #save-planning-btn');
        const formContent = document.querySelector('#planeacion #planning-form-content');
        const emptyState = document.querySelector('#planeacion .empty-state');

        let isSaving = false;

        if (saveBtn) {
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.replaceWith(newSaveBtn);
            newSaveBtn.addEventListener('click', async function (e) {
                e.preventDefault();
                if (isSaving) return;
                isSaving = true;
                try {
                    await handleSavePlanning();
                } finally {
                    isSaving = false;
                }
            });
        }

        // Botón "Crear primera planeación"
        if (createFirstBtn && formContent && emptyState) {
            createFirstBtn.addEventListener('click', function () {
                formContent.style.display = 'block';
                emptyState.style.display = 'none';
                resetPlanningForm();
            });
        }

        // Botón "Nueva Planeación"
        if (createBtn) {
            createBtn.addEventListener('click', function () {
                formContent.style.display = 'block';
                createBtn.style.display = 'none';
                resetPlanningForm();
            });
        }

        // Botón "Cancelar"
        if (cancelBtn && formContent && createBtn && dashboard) {
            cancelBtn.addEventListener('click', function (e) {
                e.preventDefault();

                formContent.style.display = 'none';

                if (createBtn) createBtn.style.display = 'flex';

                if (dashboard) dashboard.style.display = 'block';

                const planningsList = document.getElementById('plannings-list');
                if (planningsList && planningsList.children.length === 0 && emptyState) {
                    emptyState.style.display = 'flex';
                }

                resetPlanningForm();
                Swal.fire({
                    icon: 'info',
                    title: 'Operación cancelada',
                    showConfirmButton: false,
                    timer: 1500
                });
            });
        }


        function resetPlanningForm() {
            document.getElementById('planning-id').value = '';
            document.getElementById('jefe-unidad').value = '';
            document.getElementById('medio-verificacion').value = '';
            document.getElementById('objetivo-area').value = '';
            document.getElementById('planning-responsable').value = '';
        }

        // Manejar el guardado
        async function handleSavePlanning() {
            const planningId = document.getElementById('planning-id')?.value;
            const planningData = {
                unidad_responsable: document.getElementById('planning-responsable')?.value || '',
                jefe_unidad: document.getElementById('jefe-unidad')?.value || '',
                medio_verificacion: document.getElementById('medio-verificacion')?.value || '',
                objetivo_area: document.getElementById('objetivo-area')?.value || '',
                responsable_id: document.getElementById('planning-responsable')?.value || ''
            };

            const errors = [];
            if (!planningData.unidad_responsable) errors.push("Debe seleccionar una unidad responsable");
            if (!planningData.jefe_unidad) errors.push("El jefe de unidad es requerido");
            if (!planningData.medio_verificacion) errors.push("El medio de verificación es requerido");
            if (!planningData.objetivo_area) errors.push("El objetivo del área es requerido");

            if (errors.length > 0) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error de validación',
                    html: errors.join('<br>')
                });
                return;
            }

            showLoading(true);

            try {
                if (planningId) {
                    await ApiController.updatePlaneacion(planningId, planningData);
                    await Swal.fire({
                        icon: 'success',
                        title: '¡Actualizado!',
                        text: 'Planeación actualizada correctamente',
                        showConfirmButton: false,
                        timer: 1500
                    });
                } else {
                    await ApiController.createPlaneacion(planningData);
                    await Swal.fire({
                        icon: 'success',
                        title: '¡Creado!',
                        text: 'Planeación creada correctamente',
                        showConfirmButton: false,
                        timer: 1500
                    });
                }

                document.getElementById('planning-form-content').style.display = 'none';
                const createBtn = document.getElementById('create-planning-btn');
                if (createBtn) createBtn.style.display = 'flex';

                await setupPlanningSection();

            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al guardar planeación: ' + error.message,
                });
            } finally {
                showLoading(false);
            }
        }
    }

    // Filtrar planeaciones
    async function filterPlannings(unit, status) {
        showLoading(true);

        try {
            let planeaciones = await ApiController.getPlaneaciones();

            if (unit) {
                planeaciones = planeaciones.filter(p => p.unidad_responsable === unit);
            }

            if (status) {
                planeaciones = planeaciones.filter(p => p.estado === status);
            }

            renderPlanningsList(planeaciones);
        } catch (error) {
            showError('Error al filtrar planeaciones: ' + error.message);
        } finally {
            showLoading(false);
        }
    }

    // Editar una planeación
    async function editPlanning(id) {
        showLoading(true);

        try {
            const planeacion = await ApiController.getPlaneacion(id);

            const planningIdEl = document.getElementById('planning-id');
            if (planningIdEl) planningIdEl.value = planeacion.id;

            const unidadEl = document.getElementById('unidad-responsable');
            if (unidadEl) unidadEl.value = planeacion.unidad_responsable || '';

            const jefeEl = document.getElementById('jefe-unidad');
            if (jefeEl) jefeEl.value = planeacion.jefe_unidad || '';

            const medioEl = document.getElementById('medio-verificacion');
            if (medioEl) medioEl.value = planeacion.medio_verificacion || '';

            const objetivoEl = document.getElementById('objetivo-area');
            if (objetivoEl) objetivoEl.value = planeacion.objetivo_area || '';

            const responsableEl = document.getElementById('planning-responsable');
            if (responsableEl) responsableEl.value = planeacion.responsable?.id || '';

            document.getElementById('planning-form-content').style.display = 'block';
            const createBtn = document.getElementById('create-planning-btn');
            if (createBtn) createBtn.style.display = 'none';

        } catch (error) {
            showError('Error al cargar planeación: ' + error.message);
        } finally {
            showLoading(false);
        }

    }

    // Usuarios
    async function loadUsuariosData() {
        showLoading(true);

        try {
            const [usuarios, responsables] = await Promise.all([
                ApiController.getUsuarios(),
                ApiController.getResponsables().catch(() => [])
            ]);

            const usersDataContainer = document.getElementById('users-data');
            if (usersDataContainer) {
                usersDataContainer.innerHTML = usuarios.map(usuario => {
                    const responsable = responsables.find(r => r.id === usuario.responsableId);
                    const responsableNombre = responsable ?
                        (responsable.nombre_responsable || responsable.nombre || responsable.name || 'TEC') :
                        'TEC';
                    return `
                    <tr data-id="${usuario.id}">
                        <td>${usuario.id}</td>
                        <td>${usuario.correo || 'Sin correo'}</td>
                        <td>${responsableNombre}</td>
                        <td><span class="status-badge">Activo</span></td>
                        <td>
                            <button class="table-btn edit-btn edit-user" data-id="${usuario.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="table-btn delete-btn delete-user" data-id="${usuario.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
                }).join('') || '<tr><td colspan="5">No hay usuarios registrados</td></tr>';
            }

        } catch (error) {
            showError('Error al cargar usuarios: ' + error.message);
        } finally {
            showLoading(false);
        }
    }

    async function setupUserCrud() {
        async function loadResponsables() {
            try {
                const responsables = await ApiController.getResponsables();
                const select = document.getElementById('user-responsable');
                if (select) {
                    select.innerHTML = `
                    <option value="">Seleccionar responsable</option>
                    ${responsables.map(r =>
                        `<option value="${r.id}">${r.nombre_responsable}</option>`
                    ).join('')}
                `;
                }
            } catch (error) {
                console.error('Error al cargar responsables:', error);
            }
        }

        await loadResponsables();

        // Agregar usuario
        document.getElementById('add-user')?.addEventListener('click', function () {
            document.getElementById('user-modal-title').textContent = 'Nuevo Usuario';
            document.getElementById('user-email').value = '';
            document.getElementById('user-password').value = '';
            document.getElementById('user-description').value = '';
            document.getElementById('user-responsable').value = '';
            document.getElementById('user-modal').dataset.id = '';
            document.getElementById('user-modal').style.display = 'block';
        });

        // Guardar usuario
        document.getElementById('save-user')?.addEventListener('click', async function () {
            const id = document.getElementById('user-modal').dataset.id;
            const email = document.getElementById('user-email').value.trim();
            const password = document.getElementById('user-password').value.trim();
            const description = document.getElementById('user-description').value.trim();
            const responsableId = document.getElementById('user-responsable').value;

            if (!email || !password || !responsableId) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Campos requeridos',
                    text: 'Los campos marcados con * son obligatorios',
                });
                return;
            }

            showLoading(true);

            try {
                const userData = {
                    correo: email,
                    contrasenia: password,
                    descripcion: description,
                    responsable: responsableId
                };

                if (id) {
                    await ApiController.updateUsuario(id, userData);
                    await Swal.fire({
                        icon: 'success',
                        title: 'Usuario actualizado',
                        showConfirmButton: false,
                        timer: 1500
                    });
                } else {
                    await ApiController.createUsuario(userData);
                    await Swal.fire({
                        icon: 'success',
                        title: 'Usuario creado',
                        showConfirmButton: false,
                        timer: 1500
                    });
                }

                document.getElementById('user-modal').style.display = 'none';
                await loadUsuariosData();

            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al guardar usuario: ' + error.message,
                });
            } finally {
                showLoading(false);
            }
        });

        document.addEventListener('click', async function (e) {
            if (e.target.closest('.edit-user')) {
                const id = e.target.closest('tr').dataset.id;
                showLoading(true);
                try {
                    const usuario = await ApiController.getUsuario(id);
                    document.getElementById('user-modal-title').textContent = 'Editar Usuario';
                    document.getElementById('user-email').value = usuario.correo || '';
                    document.getElementById('user-password').value = usuario.password;
                    document.getElementById('user-description').value = usuario.descripcion || '';
                    document.getElementById('user-responsable').value = usuario.responsable || '';
                    document.getElementById('user-modal').dataset.id = id;
                    document.getElementById('user-modal').style.display = 'block';
                } catch (error) {
                    showError('Error al cargar usuario: ' + error.message);
                } finally {
                    showLoading(false);
                }
            }

            // Eliminar usuario
            if (e.target.closest('.delete-user')) {
                const id = e.target.closest('tr').dataset.id;

                const result = await Swal.fire({
                    title: 'Eliminar usuario',
                    text: '¿Está seguro de eliminar este usuario?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                });

                if (result.isConfirmed) {
                    showLoading(true);
                    try {
                        await ApiController.deleteUsuario(id);
                        await Swal.fire({
                            icon: 'success',
                            title: 'Usuario eliminado',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        await loadUsuariosData();
                    } catch (error) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Error al eliminar usuario: ' + error.message,
                        });
                    } finally {
                        showLoading(false);
                    }
                }
            }
        });
    }

    // Reportes
    function initReportesSection() {
        const today = new Date();
        const dateInput = document.getElementById('report-date');
        if (dateInput) {
            dateInput.value = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        }

        initImageUploader();
        initPdfModal();

        document.getElementById('add-activity-row')?.addEventListener('click', function () {
            const tbody = document.getElementById('activities-body');
            if (tbody) {
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td><input type="text" class="form-control activity-number" placeholder="Número"></td>
                    <td><input type="text" class="form-control activity-name" placeholder="Nombre de actividad"></td>
                    <td><input type="text" class="form-control activity-reporter" placeholder="Nombre de quien reporta"></td>
                `;
                tbody.appendChild(newRow);
            }
        });

        document.getElementById('export-btn')?.addEventListener('click', async function () {
            try {
                await generateAndDownloadPdf();
            } catch (error) {
                console.error('Error al generar PDF:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo generar el PDF: ' + error.message,
                });
            }
        });

        document.getElementById('view-reports-btn')?.addEventListener('click', function () {
            showReportsList();
        });

        document.getElementById('export-pdf-btn')?.addEventListener('click', function () {
            generateAndDownloadPdf();
        });

        document.getElementById('cancel-report-btn')?.addEventListener('click', function () {
            document.getElementById('report-date').value = '';
            document.getElementById('report-quarter').value = '';
            document.getElementById('activities-body').innerHTML = `
        <tr>
            <td><input type="text" class="form-control activity-number" placeholder="Número"></td>
            <td><input type="text" class="form-control activity-name" placeholder="Nombre de actividad"></td>
            <td><input type="text" class="form-control activity-reporter" placeholder="Nombre de quien reporta"></td>
        </tr>
    `;
            document.getElementById('report-activity-description').value = '';
            document.getElementById('photo-upload').value = '';
            document.getElementById('file-names').textContent = 'Sin archivos seleccionados';
            document.getElementById('image-preview').innerHTML = '';

            Swal.fire({
                icon: 'success',
                title: 'Formulario limpiado',
                text: 'Todos los campos han sido restablecidos',
                showConfirmButton: false,
                timer: 1500
            });
        });
    }

    function initImageUploader() {
        const uploader = document.getElementById('photo-upload');
        if (!uploader) return;

        uploader.addEventListener('change', function (e) {
            const files = Array.from(e.target.files).slice(0, 4);
            const container = document.getElementById('image-preview');
            if (!container) return;

            container.innerHTML = '';

            if (files.length > 0) {
                const fileNames = document.getElementById('file-names');
                if (fileNames) {
                    fileNames.textContent = `${files.length} imagen(es) seleccionada(s) (máx. 4)`;
                }

                files.forEach((file, index) => {
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        const div = document.createElement('div');
                        div.className = 'image-preview-item';
                        div.innerHTML = `
                            <img src="${event.target.result}" class="image-preview" data-index="${index}">
                            <input type="text" class="image-caption-input" data-index="${index}" 
                                   placeholder="Descripción de la imagen">
                        `;
                        container.appendChild(div);
                    };
                    reader.readAsDataURL(file);
                });
            } else {
                const fileNames = document.getElementById('file-names');
                if (fileNames) {
                    fileNames.textContent = 'Sin archivos seleccionados';
                }
            }
        });
    }

    function initPdfModal() {
        const modal = document.getElementById('pdf-preview-modal');
        if (!modal) return;

        const closeBtn = document.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.style.display = 'none');
        }

        window.addEventListener('click', (e) => e.target === modal ? modal.style.display = 'none' : null);

        const previewBtn = document.getElementById('preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', function () {
                generatePdfPreview();
                modal.style.display = 'block';
            });
        }

        const downloadBtn = document.getElementById('download-from-preview');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function () {
                generateAndDownloadPdf();
                modal.style.display = 'none';
            });
        }
    }

    function generatePdfPreview() {
        const previewContent = document.getElementById('pdf-preview-content');
        if (!previewContent) return;

        const reportData = getReportData();
        const images = Array.from(document.querySelectorAll('.image-preview')).map(img => img.src);
        const captions = Array.from(document.querySelectorAll('.image-caption-input')).map(input => input.value || `Imagen ${input.dataset.index + 1}`);

        while (images.length < 4) {
            images.push('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2RkZCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIj48L3JlY3Q+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIyLjUiPjwvY2lyY2xlPjxwb2x5bGluZSBwb2ludHM9IjIxIDE1IDE2IDEwIDUgMjEiPjwvcG9seWxpbmU+PC9zdmc+');
            captions.push(`Imagen ${images.length}`);
        }

        previewContent.innerHTML = `
        <div class="report-pdf">
            <img src="logo-tec.png" class="pdf-logo-left" alt="Logo izquierdo">
            <img src="logo-sistemas.png" class="pdf-logo-right" alt="Logo derecho">
            
            <div class="report-header">
                <h1 class="report-title">Reporte de Actividades</h1>
                <div class="report-date">Fecha: ${reportData.date}</div>
                <div class="report-date">Trimestre: ${reportData.quarter}</div>
            </div>
            
            <div class="report-section">
                <h2 class="section-title">Actividades Realizadas</h2>
                <table class="activity-table-pdf">
                    <thead>
                        <tr><th>No. Actividad</th><th>Nombre de Actividad</th><th>Reportante</th></tr>
                    </thead>
                    <tbody>
                        ${reportData.activities.map(a => `<tr><td>${a.number || ''}</td><td>${a.name || ''}</td><td>${a.reporter || ''}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="report-section">
                <h2 class="section-title">Informe de Actividades</h2>
                <p style="white-space: pre-line;">${reportData.description || 'No se proporcionó descripción.'}</p>
            </div>
            
            <div class="report-section">
                <h2 class="section-title">Evidencia Fotográfica</h2>
                <table class="evidence-grid">
                    <tr>
                        <td><img src="${images[0]}" class="pdf-image"><div class="image-caption">${captions[0]}</div></td>
                        <td><img src="${images[1]}" class="pdf-image"><div class="image-caption">${captions[1]}</div></td>
                    </tr>
                    <tr>
                        <td><img src="${images[2]}" class="pdf-image"><div class="image-caption">${captions[2]}</div></td>
                        <td><img src="${images[3]}" class="pdf-image"><div class="image-caption">${captions[3]}</div></td>
                    </tr>
                </table>
            </div>
            
            <div class="signature-section">
                <div class="signature-line"></div>
                <div class="signature-text">Firma</div>
            </div>
        </div>
    `;
    }

    async function generateAndDownloadPdf() {
        if (typeof window.jspdf === 'undefined') {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'La librería jsPDF no está cargada',
            });
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const reportData = getReportData();

        const mainActivityName = reportData.activities[0]?.name || 'Reporte_Actividades';
        const sanitizedActivityName = mainActivityName
            .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '')
            .trim()
            .replace(/\s+/g, '_');

        // Configuración inicial
        doc.setFont('helvetica');
        doc.setFontSize(12);
        doc.setTextColor(44, 62, 80);

        try {
            // Cargar logos
            const logoLeft = await loadImage('logo-tec.png');
            const logoRight = await loadImage('logo-sistemas.png');

            // Agregar logos
            doc.addImage(logoLeft, 'PNG', 15, 10, 30, 15);
            doc.addImage(logoRight, 'PNG', doc.internal.pageSize.width - 45, 10, 30, 15);
        } catch (error) {
            console.error('Error cargando logos:', error);

        }

        // Encabezado del reporte
        doc.setFontSize(14);
        doc.text('Reporte de Actividades', 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(127, 140, 141);
        doc.text(`Fecha: ${reportData.date}`, 105, 26, { align: 'center' });
        doc.text(`Trimestre: ${reportData.quarter}`, 105, 32, { align: 'center' });

        // Línea divisoria
        doc.setDrawColor(52, 152, 219);
        doc.setLineWidth(0.5);
        doc.line(20, 38, 190, 38);

        // Actividades realizadas
        doc.setFontSize(12);
        doc.setTextColor(44, 62, 80);
        doc.text('Actividades Realizadas', 20, 48);

        // Tabla de actividades
        doc.setFontSize(9);
        doc.setFillColor(245, 245, 245);
        doc.rect(20, 54, 170, 8, 'F');
        doc.text('No.', 25, 59);
        doc.text('Actividad', 45, 59);
        doc.text('Reportante', 140, 59);

        let y = 64;
        reportData.activities.forEach(activity => {
            const actividadAjustada = doc.splitTextToSize(activity.name || '', 90);
            const reporterAjustado = doc.splitTextToSize(activity.reporter || '', 40);

            doc.text(activity.number || '', 25, y);
            doc.text(actividadAjustada, 45, y);
            doc.text(reporterAjustado, 140, y);

            y += Math.max(actividadAjustada.length, reporterAjustado.length) * 5;
        });

        // Informe de actividades
        doc.setFontSize(12);
        doc.text('Informe de Actividades', 20, y + 10);

        doc.setFontSize(10);
        const descriptionLines = doc.splitTextToSize(reportData.description || 'No se proporcionó descripción.', 170);
        doc.text(descriptionLines, 20, y + 20);

        // Evidencia fotográfica
        const imgY = y + 20 + (descriptionLines.length * 5) + 15;
        doc.setFontSize(12);
        doc.text('Evidencia Fotográfica', 20, imgY);

        const imageElements = document.querySelectorAll('.image-preview');
        const imagePromises = Array.from(imageElements).map(async (img, index) => {
            try {
                if (img.src.startsWith('data:')) {
                    return {
                        src: img.src,
                        caption: document.querySelector(`.image-caption-input[data-index="${index}"]`)?.value || `Imagen ${index + 1}`
                    };
                }
                const base64 = await imageToBase64(img.src);
                return {
                    src: base64,
                    caption: document.querySelector(`.image-caption-input[data-index="${index}"]`)?.value || `Imagen ${index + 1}`
                };
            } catch (error) {
                console.error('Error procesando imagen:', error);
                return null;
            }
        });

        const images = (await Promise.all(imagePromises)).filter(img => img !== null);

        // Configuración de imágenes
        const imgWidth = 75;
        const imgHeight = 50;
        const startX = 25;
        const startY = imgY + 10;
        const gap = 10;

        // Agregar imágenes en matriz 2x2
        for (let i = 0; i < 4; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            if (images[i]) {
                doc.addImage(
                    images[i].src,
                    'JPEG',
                    startX + col * (imgWidth + gap),
                    startY + row * (imgHeight + gap),
                    imgWidth,
                    imgHeight
                );

                // Agregar descripción
                doc.setFontSize(8);
                doc.text(images[i].caption,
                    startX + col * (imgWidth + gap) + imgWidth / 2,
                    startY + row * (imgHeight + gap) + imgHeight + 5,
                    { align: 'center' }
                );
            } else {
                doc.setDrawColor(200, 200, 200);
                doc.rect(
                    startX + col * (imgWidth + gap),
                    startY + row * (imgHeight + gap),
                    imgWidth,
                    imgHeight
                );
                doc.text(`Imagen ${i + 1} no disponible`,
                    startX + col * (imgWidth + gap) + imgWidth / 2,
                    startY + row * (imgHeight + gap) + imgHeight / 2,
                    { align: 'center' }
                );
            }
        }

        // Pie de página
        const footerY = 280;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(105 - 25, footerY, 105 + 25, footerY);
        doc.setFontSize(10);
        doc.text("Firma", 105, footerY + 8, { align: "center" });

        // Guardar PDF
        const fileName = `${sanitizedActivityName}.pdf`;
        doc.save(fileName);

        saveReportToDashboard({
            name: fileName,
            date: new Date().toISOString(),
            activities: reportData.activities.map(a => a.name).filter(Boolean).join(', '),
            description: reportData.description
        });

        await Swal.fire({
            icon: 'success',
            title: 'PDF generado',
            text: 'El reporte se ha descargado correctamente',
            showConfirmButton: false,
            timer: 1500
        });
    }

    function saveReportToDashboard(report) {
        try {
            const reports = JSON.parse(localStorage.getItem('recentReports')) || [];
            reports.unshift(report);

            const recentReports = reports.slice(0, 5);

            localStorage.setItem('recentReports', JSON.stringify(recentReports));

            updateRecentReportsDashboard(recentReports);
        } catch (error) {
            console.error('Error al guardar reporte:', error);
        }
    }

    function updateRecentReportsDashboard(reports) {
        const container = document.getElementById('recent-reports');
        if (!container) return;

        if (!reports || reports.length === 0) {
            container.innerHTML = '<div class="empty-message">No hay reportes recientes</div>';
            return;
        }

        container.innerHTML = reports.map(report => `
        <div class="report-item clickable-report" data-target="#reportes">
            <div class="report-name">${report.name}</div>
            <div class="report-date">${new Date(report.date).toLocaleDateString()}</div>
            <div class="report-activities">${report.activities || 'Sin actividades'}</div>
        </div>
    `).join('');

        document.querySelectorAll('.clickable-report').forEach(item => {
            item.addEventListener('click', function () {
                const target = this.getAttribute('data-target');
                const navLink = document.querySelector(`.nav-link[href="${target}"]`);
                if (navLink) {
                    navLink.click();
                }
            });
        });
    }

    function loadRecentReports() {
        try {
            const reports = JSON.parse(localStorage.getItem('recentReports')) || [];
            updateRecentReportsDashboard(reports);
        } catch (error) {
            console.error('Error al cargar reportes:', error);
            document.getElementById('recent-reports').innerHTML =
                '<div class="error-message">Error al cargar reportes</div>';
        }
    }

    async function showReportsList() {
        document.getElementById('new-report-form').style.display = 'none';
        document.getElementById('reports-list-container').style.display = 'block';

        try {
            await loadExistingReports();
        } catch (error) {
            showError('Error al cargar los reportes: ' + error.message);
        }
    }

    async function deleteReport(reportId) {
        const result = await Swal.fire({
            title: 'Eliminar reporte',
            text: '¿Está seguro de eliminar este reporte? Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            showLoading(true);
            try {
                const reports = JSON.parse(localStorage.getItem('recentReports')) || [];

                const updatedReports = reports.filter(report => report.date !== reportId);

                localStorage.setItem('recentReports', JSON.stringify(updatedReports));

                await Swal.fire({
                    icon: 'success',
                    title: 'Reporte eliminado',
                    showConfirmButton: false,
                    timer: 1500
                });

                await loadExistingReports();

                updateRecentReportsDashboard(updatedReports);

            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar el reporte: ' + error.message,
                });
            } finally {
                showLoading(false);
            }
        }
    }

    async function loadExistingReports() {
        showLoading(true);
        const reportsGrid = document.getElementById('reports-grid');

        try {

            const reports = JSON.parse(localStorage.getItem('recentReports')) || [];

            if (reports.length === 0) {
                reportsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-alt empty-icon"></i>
                    <p>No hay reportes guardados</p>
                </div>
            `;
                return;
            }

            // Mostrar los reportes
            reportsGrid.innerHTML = reports.map(report => `
                <div class="report-card" data-id="${report.date}">
                    <div class="report-card-header">
                        <h3>${report.name}</h3>
                            <span class="report-date">${new Date(report.date).toLocaleDateString()}</span>
                    </div>
                    <div class="report-card-body">
                        <p class="report-activities">${report.activities || 'Sin actividades especificadas'}</p>
                        <p class="report-description">${report.description ? report.description.substring(0, 100) + '...' : 'Sin descripción'}</p>
                    </div>
                    <div class="report-card-actions">
                        <button class="btn btn-outline view-report-btn" data-id="${report.date}">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <button class="btn btn-outline download-report-btn" data-id="${report.date}">
                            <i class="fas fa-download"></i> Descargar
                        </button>
                        <button class="btn btn-outline delete-report-btn" data-id="${report.date}">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `).join('');

            document.querySelectorAll('.view-report-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const reportId = this.getAttribute('data-id');
                    viewReport(reportId);
                });
            });

            document.querySelectorAll('.download-report-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const reportId = this.getAttribute('data-id');
                    downloadReport(reportId);
                });
            });

            document.getElementById('back-to-new-report')?.addEventListener('click', function () {
                document.getElementById('reports-list-container').style.display = 'none';
                document.getElementById('new-report-form').style.display = 'block';
            });
            document.querySelectorAll('.delete-report-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const reportId = this.getAttribute('data-id');
                    deleteReport(reportId);
                });
            });

            document.getElementById('search-reports-btn')?.addEventListener('click', searchReports);
            document.getElementById('search-reports-input')?.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    searchReports();
                }
            });

        } catch (error) {
            reportsGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle error-icon"></i>
                <p>Error al cargar los reportes</p>
            </div>
        `;
            throw error;
        } finally {
            showLoading(false);
        }
    }

    function searchReports() {
        const searchTerm = document.getElementById('search-reports-input').value.toLowerCase();
        const reportCards = document.querySelectorAll('.report-card');

        reportCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('.report-description').textContent.toLowerCase();
            const activities = card.querySelector('.report-activities').textContent.toLowerCase();
            const date = card.querySelector('.report-date').textContent.toLowerCase();

            if (title.includes(searchTerm) || description.includes(searchTerm) ||
                activities.includes(searchTerm) || date.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    function viewReport(reportId) {

        const reports = JSON.parse(localStorage.getItem('recentReports')) || [];
        const report = reports.find(r => r.date === reportId);

        if (!report) {
            showError('No se encontró el reporte solicitado');
            return;
        }

        Swal.fire({
            title: report.name,
            html: `
            <div class="report-modal-content">
                <p><strong>Fecha:</strong> ${new Date(report.date).toLocaleDateString()}</p>
                <p><strong>Actividades:</strong> ${report.activities || 'No especificado'}</p>
                <div class="report-description-container">
                    <h4>Descripción:</h4>
                    <p>${report.description || 'No hay descripción disponible'}</p>
                </div>
            </div>
        `,
            width: '800px',
            showConfirmButton: false,
            showCloseButton: true
        });
    }

    function downloadReport(reportId) {


        const reports = JSON.parse(localStorage.getItem('recentReports')) || [];
        const report = reports.find(r => r.date === reportId);

        if (!report) {
            showError('No se encontró el reporte solicitado');
            return;
        }

        showSuccess(`Iniciando descarga del reporte: ${report.name}`);

    }


    // Función para cargar imágenes
    function loadImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => {
                console.error('Error al cargar la imagen:', url);
                resolve(null);
            };
            img.src = url;
        });
    }

    function getReportData() {
        const dateEl = document.getElementById('report-date');
        const quarterEl = document.getElementById('report-quarter');

        const date = dateEl ? dateEl.value : 'No especificada';
        const quarter = quarterEl ? quarterEl.options[quarterEl.selectedIndex].text : 'No especificado';

        const activities = [];
        const activityRows = document.querySelectorAll('#activities-body tr');
        if (activityRows) {
            activityRows.forEach(row => {
                const number = row.querySelector('.activity-number')?.value;
                const name = row.querySelector('.activity-name')?.value;
                const reporter = row.querySelector('.activity-reporter')?.value;
                if (number || name || reporter) activities.push({ number, name, reporter });
            });
        }

        const descriptionEl = document.getElementById("report-activity-description");
        const description = descriptionEl ? descriptionEl.value : '';

        return {
            date,
            quarter,
            activities,
            description
        };
    }

    // Formulario de actividades
    function setupActivityForm() {
        const createBtn = document.getElementById('create-planning-btn');
        const cancelBtn = document.getElementById('cancel-planning-btn');
        const saveBtn = document.getElementById('save-activity-btn');

        if (createBtn) {
            createBtn.addEventListener('click', () => {
                document.getElementById('planning-form-content').style.display = 'block';
                createBtn.style.display = 'none';
                resetActivityForm();
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.getElementById('planning-form-content').style.display = 'none';
                if (createBtn) createBtn.style.display = 'flex';
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const annualCount = parseInt(document.getElementById('activity-annual-count').value) || 1;

                if (annualCount > 1) {
                    // Preguntar si quiere programar fechas, pero siempre guardará solo una actividad
                    await askForMultipleDates(annualCount);
                } else {
                    // Guardar directamente
                    await handleSaveActivity();
                }
            });
        }

        // Validar que la cantidad anual sea al menos 1
        document.getElementById('activity-annual-count')?.addEventListener('change', function () {
            const count = parseInt(this.value) || 1;
            if (count < 1) this.value = 1;
        });
    }


    async function askForMultipleDates(count) {
        const { value: accept } = await Swal.fire({
            title: '¿Agregar programación detallada?',
            text: `Esta actividad tendrá ${count} ejecuciones al año. ¿Deseas programar las fechas y presupuestos ahora?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, programar ahora',
            cancelButtonText: 'No, solo guardar actividad',
            customClass: {
                container: 'custom-swal-container'
            }
        });

        if (accept) {
            // Aquí podrías mostrar un formulario para programar las fechas
            // pero no crearías múltiples actividades, solo guardarías la programación
            // como parte de la misma actividad
            Swal.fire({
                icon: 'info',
                title: 'Funcionalidad en desarrollo',
                text: 'La programación de fechas múltiples estará disponible pronto',
            });

            // Guardar la actividad de todos modos
            await handleSaveActivity();
        } else {
            // Guardar la actividad con la cantidad anual
            await handleSaveActivity();
        }
    }

    function showMultipleDateForm(count, planeaciones) {
        // Ocultar el formulario principal temporalmente
        const mainForm = document.getElementById('planning-form-content');
        mainForm.style.display = 'none';

        // Crear contenedor para los formularios múltiples
        const multiFormContainer = document.createElement('div');
        multiFormContainer.id = 'multi-date-form-container';
        multiFormContainer.className = 'multi-form-container';

        // Crear título
        const title = document.createElement('h3');
        title.textContent = `Ingrese las fechas y presupuestos para las ${count} actividades`;
        multiFormContainer.appendChild(title);

        // Add planeación select
        const planeacionGroup = document.createElement('div');
        planeacionGroup.className = 'form-group';
        planeacionGroup.innerHTML = `
        <label for="activity-planeacion">Planeación asociada</label>
        <select id="activity-planeacion" class="form-control" required>
            <option value="">Seleccionar planeación...</option>
            ${planeaciones.map(p =>
            `<option value="${p.id}">${p.unidad_responsable} - ${p.jefe_unidad}</option>`
        ).join('')}
        </select>
    `;
        multiFormContainer.appendChild(planeacionGroup);

        // Crear formularios individuales
        for (let i = 0; i < count; i++) {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group multi-form-group';

            formGroup.innerHTML = `
        <h4>Actividad ${i + 1}</h4>
        <div class="form-row">
            <div class="form-group" style="flex: 1;">
                <label for="activity-date-${i}">Fecha</label>
                <input type="date" id="activity-date-${i}" class="form-control" required>
            </div>
            <div class="form-group" style="flex: 1;">
                <label for="activity-budget-${i}">Presupuesto</label>
                <input type="number" id="activity-budget-${i}" class="form-control" placeholder="Monto presupuestado" required>
            </div>
        </div>
    `;

            multiFormContainer.appendChild(formGroup);
        }

        // Botones de acción
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        actionButtons.innerHTML = `
    <button id="save-multi-dates" class="btn btn-primary">
        <i class="fas fa-save"></i> Guardar todas
    </button>
    <button id="cancel-multi-dates" class="btn btn-secondary">
        <i class="fas fa-times"></i> Cancelar
    </button>
`;

        multiFormContainer.appendChild(actionButtons);

        // Insertar después del formulario principal
        mainForm.parentNode.insertBefore(multiFormContainer, mainForm.nextSibling);

        // Configurar eventos de los botones
        document.getElementById('save-multi-dates').addEventListener('click', () => {
            saveMultipleActivities(count);
        });

        document.getElementById('cancel-multi-dates').addEventListener('click', () => {
            multiFormContainer.remove();
            mainForm.style.display = 'block';
        });
    }

    function showBudgetOnlyForm(count, planeaciones) {
        // Ocultar el formulario principal temporalmente
        const mainForm = document.getElementById('planning-form-content');
        mainForm.style.display = 'none';

        // Crear contenedor para los formularios de presupuesto
        const budgetFormContainer = document.createElement('div');
        budgetFormContainer.id = 'budget-form-container';
        budgetFormContainer.className = 'multi-form-container';

        // Crear título
        const title = document.createElement('h3');
        title.textContent = `Ingrese los presupuestos para las ${count} actividades`;
        budgetFormContainer.appendChild(title);

        // Add planeación select
        const planeacionGroup = document.createElement('div');
        planeacionGroup.className = 'form-group';
        planeacionGroup.innerHTML = `
        <label for="activity-planeacion-budget">Planeación asociada</label>
        <select id="activity-planeacion-budget" class="form-control" required>
            <option value="">Seleccionar planeación...</option>
            ${planeaciones.map(p =>
            `<option value="${p.id}">${p.unidad_responsable} - ${p.jefe_unidad}</option>`
        ).join('')}
        </select>
    `;
        budgetFormContainer.appendChild(planeacionGroup);

        // Crear formularios individuales
        for (let i = 0; i < count; i++) {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group multi-form-group';

            formGroup.innerHTML = `
        <h4>Actividad ${i + 1}</h4>
        <div class="form-row">
            <div class="form-group" style="flex: 1;">
                <label for="activity-budget-only-${i}">Presupuesto</label>
                <input type="number" id="activity-budget-only-${i}" class="form-control" placeholder="Monto presupuestado" required>
            </div>
        </div>
    `;

            budgetFormContainer.appendChild(formGroup);
        }

        // Botones de acción
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        actionButtons.innerHTML = `
    <button id="save-budgets-only" class="btn btn-primary">
        <i class="fas fa-save"></i> Guardar todos
    </button>
    <button id="cancel-budgets-only" class="btn btn-secondary">
        <i class="fas fa-times"></i> Cancelar
    </button>
`;

        budgetFormContainer.appendChild(actionButtons);

        mainForm.parentNode.insertBefore(budgetFormContainer, mainForm.nextSibling);

        document.getElementById('save-budgets-only').addEventListener('click', () => {
            saveBudgetOnlyActivities(count);
        });

        document.getElementById('cancel-budgets-only').addEventListener('click', () => {
            budgetFormContainer.remove();
            mainForm.style.display = 'block';
        });
    }

    async function saveMultipleActivities(count) {
        const mainForm = document.getElementById('planning-form-content');
        const multiFormContainer = document.getElementById('multi-date-form-container');
        const activityData = getBaseActivityData();

        // Get planeación ID
        const planeacionId = document.getElementById('activity-planeacion')?.value;
        if (!planeacionId) {
            await Swal.fire({
                icon: 'error',
                title: 'Planeación requerida',
                text: 'Debe seleccionar una planeación asociada',
            });
            return;
        }

        showLoading(true);

        try {
            const activities = [];
            const errors = [];

            // Validación
            for (let i = 0; i < count; i++) {
                const dateInput = document.getElementById(`activity-date-${i}`);
                const budgetInput = document.getElementById(`activity-budget-${i}`);

                if (!dateInput.value) {
                    errors.push(`Por favor ingrese la fecha para la actividad ${i + 1}`);
                }

                if (!budgetInput.value || isNaN(parseFloat(budgetInput.value))) {
                    errors.push(`Por favor ingrese un presupuesto válido para la actividad ${i + 1}`);
                }
            }

            if (errors.length > 0) {
                throw new Error(errors.join('\n'));
            }

            // Crear actividades para guardar en localStorage
            for (let i = 0; i < count; i++) {
                const date = document.getElementById(`activity-date-${i}`).value;
                const budget = parseFloat(document.getElementById(`activity-budget-${i}`).value) || 0;

                activities.push({
                    ...activityData,
                    id: generateActivityId(),
                    fecha: date,
                    presupuesto: budget,
                    planeacion_id: planeacionId,
                    createdAt: new Date().toISOString()
                });
            }

            // Guardar todas las actividades en localStorage
            const currentActivities = getActivitiesFromStorage();
            const updatedActivities = [...currentActivities, ...activities];
            localStorage.setItem('tec-actividades', JSON.stringify(updatedActivities));

            await Swal.fire({
                icon: 'success',
                title: 'Actividades creadas',
                text: `Se han creado ${activities.length} actividades correctamente`,
                showConfirmButton: false,
                timer: 1500
            });

            if (multiFormContainer) {
                multiFormContainer.remove();
            }

            if (mainForm) {
                mainForm.style.display = 'block';
                resetActivityForm();
            }

            await setupActivitySection();

        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                html: error.message.replace(/\n/g, '<br>') || 'Error al guardar actividades',
            });
        } finally {
            showLoading(false);
        }
    }

    async function saveBudgetOnlyActivities(count) {
        const mainForm = document.getElementById('planning-form-content');
        const activityData = getBaseActivityData();
        const baseDate = document.getElementById('activity-date').value || new Date().toISOString().split('T')[0];

        // Get planeación ID
        const planeacionId = document.getElementById('activity-planeacion-budget')?.value;
        if (!planeacionId) {
            await Swal.fire({
                icon: 'error',
                title: 'Planeación requerida',
                text: 'Debe seleccionar una planeación asociada',
            });
            return;
        }

        showLoading(true);

        try {
            const activities = [];
            const budgets = [];

            for (let i = 0; i < count; i++) {
                const budget = parseFloat(document.getElementById(`activity-budget-only-${i}`).value) || 0;
                budgets.push(budget);

                activities.push({
                    ...activityData,
                    id: generateActivityId(),
                    fecha: baseDate,
                    presupuesto: budget,
                    planeacion_id: planeacionId,
                    createdAt: new Date().toISOString()
                });
            }

            // Guardar en localStorage
            const currentActivities = getActivitiesFromStorage();
            const updatedActivities = [...currentActivities, ...activities];
            localStorage.setItem('tec-actividades', JSON.stringify(updatedActivities));

            await Swal.fire({
                icon: 'success',
                title: 'Actividades creadas',
                text: `Se han creado ${activities.length} actividades con el mismo presupuesto`,
                showConfirmButton: false,
                timer: 1500
            });

            // Limpiar y volver
            document.getElementById('budget-form-container').remove();
            resetActivityForm();
            mainForm.style.display = 'block';
            await setupActivitySection();

        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error al guardar actividades',
            });
        } finally {
            showLoading(false);
        }
    }

    // Función auxiliar para obtener datos base de actividad
    function getBaseActivityData() {
        const componenteSelect = document.getElementById('componente');
        const responsableSelect = document.getElementById('responsable');

        return {
            descripcion_actividad: document.getElementById('activity-name').value,
            descripcion: document.getElementById('activity-description').value,
            fecha: document.getElementById('activity-date').value,
            cantidad_anual: parseInt(document.getElementById('activity-annual-count').value) || 1,
            componente: {
                id: componenteSelect.value,
                descripcion_componente: componenteSelect.options[componenteSelect.selectedIndex].text
            },
            medida: { id: document.getElementById('medida').value },
            objetivo: { id: document.getElementById('objetivo').value },
            responsable: {
                id: responsableSelect.value,
                nombre_responsable: responsableSelect.options[responsableSelect.selectedIndex].text
            }
        };
    }

    function resetActivityForm() {
        document.getElementById('activity-id').value = '';
        document.getElementById('activity-name').value = '';
        document.getElementById('activity-description').value = '';
        document.getElementById('activity-date').value = '';
        document.getElementById('activity-annual-count').value = '1';
        document.getElementById('componente').value = '';
        document.getElementById('medida').value = '';
        document.getElementById('objetivo').value = '';
        document.getElementById('responsable').value = '';
    }

    async function handleSaveActivity() {
        const activityId = document.getElementById('activity-id')?.value;
        const annualCount = parseInt(document.getElementById('activity-annual-count').value) || 1;

        const activityData = {
            id: activityId || generateActivityId(),
            descripcion_actividad: document.getElementById('activity-name')?.value || '',
            descripcion: document.getElementById('activity-description')?.value || '',
            fecha: document.getElementById('activity-date')?.value || '',
            componente: { id: document.getElementById('componente')?.value || '' },
            medida: { id: document.getElementById('medida')?.value || '' },
            objetivo: { id: document.getElementById('objetivo')?.value || '' },
            responsable: { id: document.getElementById('responsable')?.value || '' },
            cantidad_anual: annualCount,  // Aquí guardamos la cantidad anual
            createdAt: activityId ? undefined : new Date().toISOString()
        };

        // Validación
        if (!activityData.descripcion_actividad || !activityData.fecha ||
            !activityData.componente.id || !activityData.medida.id ||
            !activityData.objetivo.id || !activityData.responsable.id) {

            await Swal.fire({
                icon: 'error',
                title: 'Campos incompletos',
                text: 'Por favor complete todos los campos obligatorios',
            });
            return;
        }

        showLoading(true);

        try {
            if (activityId) {
                // Actualizar actividad existente
                const success = updateActivityInStorage(activityId, activityData);
                if (!success) throw new Error('No se encontró la actividad para actualizar');

                await Swal.fire({
                    icon: 'success',
                    title: '¡Actualizado!',
                    text: 'La actividad ha sido actualizada correctamente.',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                // Crear nueva actividad (siempre solo una)
                saveActivityToStorage(activityData);

                await Swal.fire({
                    icon: 'success',
                    title: '¡Creado!',
                    text: 'La actividad ha sido creada correctamente.',
                    showConfirmButton: false,
                    timer: 1500
                });
            }

            // Ocultar formulario y mostrar botón de creación
            document.getElementById('planning-form-content').style.display = 'none';
            const createBtn = document.getElementById('create-planning-btn');
            if (createBtn) createBtn.style.display = 'flex';

            // Recargar la lista de actividades
            await setupActivitySection();

        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al guardar actividad: ' + error.message,
            });
        } finally {
            showLoading(false);
        }
    }

    // Eventos dinámicos
    function setupDynamicEvents() {
        document.addEventListener('click', async (e) => {
            // Editar actividad
            if (e.target.closest('.edit-btn')) {
                const activityId = e.target.closest('.edit-btn').dataset.id;
                await editActivity(activityId);
            }

            // Eliminar actividad
            if (e.target.closest('.delete-btn')) {
                const activityId = e.target.closest('.delete-btn').dataset.id;

                const result = await Swal.fire({
                    title: 'Eliminar actividad',
                    text: '¿Está seguro de eliminar esta actividad?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                });

                if (result.isConfirmed) {
                    showLoading(true);
                    try {
                        // Eliminar de localStorage
                        deleteActivityFromStorage(activityId);

                        await Swal.fire({
                            icon: 'success',
                            title: '¡Eliminado!',
                            text: 'La actividad ha sido eliminada.',
                            showConfirmButton: false,
                            timer: 1500
                        });

                        await setupActivitySection();
                    } catch (error) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudo eliminar la actividad: ' + error.message,
                        });
                    } finally {
                        showLoading(false);
                    }
                }
            }
            if (e.target.closest('.view-btn')) {
                const planningId = e.target.closest('.view-btn').dataset.id;
                try {
                    const planeaciones = await ApiController.getPlaneaciones();
                    showPlanningDetails(planningId, planeaciones);
                } catch (error) {
                    showError('Error al cargar detalles de planeación: ' + error.message);
                }
            }

            // Editar planeación
            if (e.target.closest('.edit-planning')) {
                const planningId = e.target.closest('.edit-planning').dataset.id;
                await editPlanning(planningId);
            }

            // Eliminar planeación
            if (e.target.closest('.delete-planning')) {
                const planningId = e.target.closest('.delete-planning').dataset.id;

                const result = await Swal.fire({
                    title: 'Eliminar planeación',
                    text: '¿Está seguro de eliminar esta planeación?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                });

                if (result.isConfirmed) {
                    showLoading(true);
                    try {
                        await ApiController.deletePlaneacion(planningId);

                        await Swal.fire({
                            icon: 'success',
                            title: '¡Eliminado!',
                            text: 'La planeación ha sido eliminada.',
                            showConfirmButton: false,
                            timer: 1500
                        });

                        await setupPlanningSection();
                    } catch (error) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudo eliminar la planeación: ' + error.message,
                        });
                    } finally {
                        showLoading(false);
                    }
                }
            }
        });
        document.getElementById('logoutBtn')?.addEventListener('click', function (e) {
            e.preventDefault();

            Swal.fire({
                title: '¿Cerrar sesión?',
                text: '¿Estás seguro de que deseas salir del sistema?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, cerrar sesión',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                }
            });
        });
    }

    async function editActivity(id) {
        showLoading(true);

        try {
            // Obtener actividad de localStorage
            const actividades = getActivitiesFromStorage();
            const actividad = actividades.find(a => a.id === id);

            if (!actividad) {
                throw new Error('Actividad no encontrada');
            }

            // Rellenar formulario (igual que antes)
            document.getElementById('activity-id').value = actividad.id;
            document.getElementById('activity-name').value = actividad.descripcion_actividad || '';
            document.getElementById('activity-description').value = actividad.descripcion || '';
            document.getElementById('activity-date').value = actividad.fecha || '';
            document.getElementById('componente').value = actividad.componente?.id || '';
            document.getElementById('medida').value = actividad.medida?.id || '';
            document.getElementById('objetivo').value = actividad.objetivo?.id || '';
            document.getElementById('responsable').value = actividad.responsable?.id || '';

            document.getElementById('planning-form-content').style.display = 'block';
            const createBtn = document.getElementById('create-planning-btn');
            if (createBtn) createBtn.style.display = 'none';

        } catch (error) {
            console.error('Error al cargar actividad:', error);
            showError('Error al cargar actividad: ' + error.message);
        } finally {
            showLoading(false);
        }
    }

    // Otro
    async function loadOtroData() {
        showLoading(true);
        try {
            const [componentes, medidas, responsables, objetivos, roles, usuarios] = await Promise.all([
                ApiController.getComponentes().catch(e => {
                    console.error("Error cargando componentes:", e);
                    return [];
                }),
                ApiController.getMedidas().catch(e => {
                    console.error("Error cargando medidas:", e);
                    return [];
                }),
                ApiController.getResponsables().catch(e => {
                    console.error("Error cargando responsables:", e);
                    return [];
                }),
                ApiController.getObjetivos().catch(e => {
                    console.error("Error cargando objetivos:", e);
                    return [];
                }),
                ApiController.getRoles().catch(e => {
                    console.error("Error cargando roles:", e);
                    return [];
                }),
                ApiController.getUsuarios().catch(e => {
                    console.error("Error cargando usuarios:", e);
                    return [];
                })
            ]);

            renderComponentes(componentes);
            renderMedidas(medidas);
            renderResponsables(responsables);
            renderObjetivos(objetivos);
            renderRoles(roles, usuarios);

            // Cargar responsables para el modal de roles
            const rolResponsableSelect = document.getElementById('rol-responsable');
            if (rolResponsableSelect) {
                rolResponsableSelect.innerHTML = `
                    <option value="">Seleccionar responsable</option>
                    ${responsables.map(r =>
                    `<option value="${r.id}">${r.nombre_responsable}</option>`
                ).join('')}
                `;
            }

        } catch (error) {
            console.error("Error en loadOtroData:", error);
            showError('Error al cargar datos: ' + error.message);
        } finally {
            showLoading(false);
        }
    }

    function renderComponentes(data) {
        const container = document.getElementById('componente-data');
        if (!container) {
            console.error('Contenedor de componentes no encontrado');
            return;
        }

        container.innerHTML = data && data.length > 0 ? data.map(item => `
            <tr data-id="${item.id}">
                <td>${item.id}</td>
                <td>${item.numero || item.num_componente || ''}</td>
                <td>${item.descripcion || item.descripcion_componente || ''}</td>
                <td>
                    <button class="table-btn edit-btn edit-componente" data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-btn delete-btn delete-componente" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="4">No hay componentes registrados</td></tr>';
    }

    function renderMedidas(data) {
        const container = document.getElementById('medida-data');
        if (!container) {
            console.error('Contenedor de medidas no encontrado');
            return;
        }

        container.innerHTML = data && data.length > 0 ? data.map(item => `
            <tr data-id="${item.id}">
                <td>${item.id}</td>
                <td>${item.descripcion || item.descripcion_medida || ''}</td>
                <td>
                    <button class="table-btn edit-btn edit-medida" data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-btn delete-btn delete-medida" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="3">No hay medidas registradas</td></tr>';
    }

    function renderResponsables(data) {
        const container = document.getElementById('responsable-data');
        if (!container) {
            console.error('Contenedor de responsables no encontrado');
            return;
        }

        container.innerHTML = data && data.length > 0 ? data.map(item => `
            <tr data-id="${item.id}">
                <td>${item.id}</td>
                <td>${item.nombre_responsable || ''}</td>
                <td>
                    <button class="table-btn edit-btn edit-responsable" data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-btn delete-btn delete-responsable" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="3">No hay responsables registrados</td></tr>';
    }

    function renderObjetivos(data) {
        const container = document.getElementById('objetivo-data');
        if (!container) {
            console.error('Contenedor de objetivos no encontrado');
            return;
        }

        container.innerHTML = data && data.length > 0 ? data.map(item => `
            <tr data-id="${item.id}">
                <td>${item.id}</td>
                <td>${item.nombre_objetivo || ''}</td>
                <td>${item.descripcion_objetivo || 'No especificado'}</td>
                <td>
                    <button class="table-btn edit-btn edit-objetivo" data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-btn delete-btn delete-objetivo" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('') : '<tr><td colspan="4">No hay objetivos registrados</td></tr>';
    }

    function renderRoles(data, usuarios) {
        const container = document.getElementById('rol-data');
        if (!container) {
            console.error('Contenedor de roles no encontrado');
            return;
        }

        const permisosDescriptivos = {
            'read': 'Visualizador',
            'write': 'Operador Básico',
            'delete': 'Operador Avanzado',
            'admin': 'Administrador'
        };

        container.innerHTML = data && data.length > 0 ? data.map(item => {
            const permisosArray = item.permisos ? (Array.isArray(item.permisos) ? item.permisos : item.permisos.split(',')) : [];
            const permisosMostrar = permisosArray.map(p => permisosDescriptivos[p] || p).join(', ');

            return `
            <tr data-id="${item.id}">
                <td>${item.id}</td>
                <td>${item.nombre_rol || ''}</td>
                <td>${item.descripcion_rol || ''}</td>
                <td>${permisosMostrar}</td>
                <td>
                    <button class="table-btn edit-btn edit-rol" data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="table-btn delete-btn delete-rol" data-id="${item.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        }).join('') : '<tr><td colspan="6">No hay roles registrados</td></tr>';
    }

    function setupModals() {
        // Componente
        document.getElementById('add-componente')?.addEventListener('click', () => {
            document.getElementById('componente-modal-title').textContent = 'Nuevo Componente';
            document.getElementById('componente-numero').value = '';
            document.getElementById('componente-descripcion').value = '';
            document.getElementById('componente-modal').dataset.id = '';
            document.getElementById('componente-modal').style.display = 'block';
        });

        // Medida
        document.getElementById('add-medida')?.addEventListener('click', () => {
            document.getElementById('medida-modal-title').textContent = 'Nueva Medida';
            document.getElementById('medida-descripcion').value = '';
            document.getElementById('medida-modal').dataset.id = '';
            document.getElementById('medida-modal').style.display = 'block';
        });

        // Responsable
        document.getElementById('add-responsable')?.addEventListener('click', () => {
            document.getElementById('responsable-modal-title').textContent = 'Nuevo Responsable';
            document.getElementById('responsable-nombre').value = '';
            document.getElementById('responsable-modal').dataset.id = '';
            document.getElementById('responsable-modal').style.display = 'block';
        });

        // Objetivo
        document.getElementById('add-objetivo')?.addEventListener('click', () => {
            document.getElementById('objetivo-modal-title').textContent = 'Nuevo Objetivo';
            document.getElementById('objetivo-nombre').value = '';
            document.getElementById('objetivo-descripcion').value = '';
            document.getElementById('objetivo-modal').dataset.id = '';
            document.getElementById('objetivo-modal').style.display = 'block';
        });

        // Rol
        document.getElementById('add-rol')?.addEventListener('click', () => {
            document.getElementById('rol-modal-title').textContent = 'Nuevo Rol';
            document.getElementById('rol-nombre').value = '';
            document.getElementById('rol-descripcion').value = '';
            document.getElementById('rol-permisos').value = '';
            document.getElementById('rol-responsable').value = '';
            document.getElementById('rol-modal').dataset.id = '';
            document.getElementById('rol-modal').style.display = 'block';
        });

        document.querySelectorAll('.close-modal, .cancel-modal').forEach(btn => {
            btn.addEventListener('click', function () {
                this.closest('.modal').style.display = 'none';
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        document.getElementById('toggle-password')?.addEventListener('click', function () {
            const passwordInput = document.getElementById('user-password');
            const icon = this;

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    // Guardar Componente
    function setupCrudEvents() {
        document.getElementById('save-componente')?.addEventListener('click', async () => {
            const id = document.getElementById('componente-modal').dataset.id;
            const numero = document.getElementById('componente-numero').value.trim();
            const descripcion = document.getElementById('componente-descripcion').value.trim();

            if (!numero || !descripcion) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Campos requeridos',
                    text: 'Número y descripción son campos obligatorios',
                });
                return;
            }

            showLoading(true);

            try {
                if (id) {
                    await ApiController.updateComponente(id, {
                        numero,
                        descripcion_componente: descripcion
                    });
                    await Swal.fire({
                        icon: 'success',
                        title: 'Componente actualizado',
                        showConfirmButton: false,
                        timer: 1500
                    });
                } else {
                    await ApiController.createComponente({
                        numero,
                        descripcion_componente: descripcion
                    });
                    await Swal.fire({
                        icon: 'success',
                        title: 'Componente creado',
                        showConfirmButton: false,
                        timer: 1500
                    });
                }

                document.getElementById('componente-modal').style.display = 'none';
                await loadOtroData();

            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al guardar componente: ' + error.message,
                });
            } finally {
                showLoading(false);
            }
        });

        // Guardar Medida
        document.getElementById('save-medida')?.addEventListener('click', async () => {
            const id = document.getElementById('medida-modal').dataset.id;
            const descripcion = document.getElementById('medida-descripcion').value.trim();

            if (!descripcion) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Campo requerido',
                    text: 'La descripción es obligatoria',
                });
                return;
            }

            showLoading(true);

            try {
                if (id) {
                    await ApiController.updateMedida(id, {
                        descripcion_medida: descripcion
                    });
                    await Swal.fire({
                        icon: 'success',
                        title: 'Medida actualizada',
                        showConfirmButton: false,
                        timer: 1500
                    });
                } else {
                    await ApiController.createMedida({
                        descripcion_medida: descripcion
                    });
                    await Swal.fire({
                        icon: 'success',
                        title: 'Medida creada',
                        showConfirmButton: false,
                        timer: 1500
                    });
                }

                document.getElementById('medida-modal').style.display = 'none';
                await loadOtroData();

            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al guardar medida: ' + error.message,
                });
            } finally {
                showLoading(false);
            }
        });

        // Guardar Responsable
        document.getElementById('save-responsable')?.addEventListener('click', async () => {
            const id = document.getElementById('responsable-modal').dataset.id;
            const nombre = document.getElementById('responsable-nombre').value.trim();

            if (!nombre) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Campo requerido',
                    text: 'El nombre es obligatorio',
                });
                return;
            }

            showLoading(true);

            try {
                if (id) {
                    await ApiController.updateResponsable(id, {
                        nombre_responsable: nombre
                    });
                    await Swal.fire({
                        icon: 'success',
                        title: 'Responsable actualizado',
                        showConfirmButton: false,
                        timer: 1500
                    });
                } else {
                    await ApiController.createResponsable({
                        nombre_responsable: nombre
                    });
                    await Swal.fire({
                        icon: 'success',
                        title: 'Responsable creado',
                        showConfirmButton: false,
                        timer: 1500
                    });
                }

                document.getElementById('responsable-modal').style.display = 'none';
                await loadOtroData();

            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al guardar responsable: ' + error.message,
                });
            } finally {
                showLoading(false);
            }
        });

        // Guardar Objetivo
        document.getElementById('save-objetivo')?.addEventListener('click', async () => {
            const id = document.getElementById('objetivo-modal').dataset.id;
            const nombre = document.getElementById('objetivo-nombre').value.trim();
            const descripcion = document.getElementById('objetivo-descripcion').value.trim();

            if (!nombre) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Campo requerido',
                    text: 'El nombre es obligatorio',
                });
                return;
            }

            showLoading(true);

            try {
                if (id) {
                    await ApiController.updateObjetivo(id, {
                        nombre_objetivo: nombre,
                        descripcion_objetivo: descripcion
                    });
                    await Swal.fire({
                        icon: 'success',
                        title: 'Objetivo actualizado',
                        showConfirmButton: false,
                        timer: 1500
                    });
                } else {
                    await ApiController.createObjetivo({
                        nombre_objetivo: nombre,
                        descripcion_objetivo: descripcion
                    });
                    await Swal.fire({
                        icon: 'success',
                        title: 'Objetivo creado',
                        showConfirmButton: false,
                        timer: 1500
                    });
                }

                document.getElementById('objetivo-modal').style.display = 'none';
                await loadOtroData();

            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al guardar objetivo: ' + error.message,
                });
            } finally {
                showLoading(false);
            }
        });

        // Guardar Rol
        document.getElementById('save-rol')?.addEventListener('click', async () => {
            const id = document.getElementById('rol-modal').dataset.id;
            const nombre = document.getElementById('rol-nombre').value.trim();
            const descripcion = document.getElementById('rol-descripcion').value.trim();
            const permisos = Array.from(document.getElementById('rol-permisos').selectedOptions)
                .map(option => option.value);
            const responsable = document.getElementById('rol-responsable').value;

            // Validación mejorada
            if (!nombre || nombre.length < 3) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Nombre inválido',
                    text: 'El nombre del rol debe tener al menos 3 caracteres',
                });
                return;
            }

            if (!permisos) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Permisos requeridos',
                    text: 'Debe seleccionar al menos un permiso',
                });
                return;
            }

            if (!responsable) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Responsable requerido',
                    text: 'Debe seleccionar un responsable',
                });
                return;
            }

            showLoading(true);

            try {
                const rolData = {
                    nombre,
                    descripcion,
                    permisos,
                    responsable
                };

                if (id) {
                    await ApiController.updateRol(id, rolData);
                    await Swal.fire({
                        icon: 'success',
                        title: 'Rol actualizado',
                        showConfirmButton: false,
                        timer: 1500
                    });
                } else {
                    await ApiController.createRol(rolData);
                    await Swal.fire({
                        icon: 'success',
                        title: 'Rol creado',
                        showConfirmButton: false,
                        timer: 1500
                    });
                }

                document.getElementById('rol-modal').style.display = 'none';
                await loadOtroData();

            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al guardar rol: ' + error.message,
                });
            } finally {
                showLoading(false);
            }
        });

        document.addEventListener('click', async (e) => {
            // Editar Componente
            if (e.target.closest('.edit-componente')) {
                const row = e.target.closest('tr');
                const id = row.dataset.id;
                const numero = row.cells[1].textContent;
                const descripcion = row.cells[2].textContent;

                document.getElementById('componente-modal-title').textContent = 'Editar Componente';
                document.getElementById('componente-numero').value = numero;
                document.getElementById('componente-descripcion').value = descripcion;
                document.getElementById('componente-modal').dataset.id = id;
                document.getElementById('componente-modal').style.display = 'block';
            }

            // Eliminar Componente
            if (e.target.closest('.delete-componente')) {
                const id = e.target.closest('tr').dataset.id;

                const result = await Swal.fire({
                    title: 'Eliminar componente',
                    text: '¿Está seguro de eliminar este componente?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                });

                if (result.isConfirmed) {
                    showLoading(true);
                    try {
                        await ApiController.deleteComponente(id);
                        await Swal.fire({
                            icon: 'success',
                            title: 'Componente eliminado',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        await loadOtroData();
                    } catch (error) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Error al eliminar componente: ' + error.message,
                        });
                    } finally {
                        showLoading(false);
                    }
                }
            }

            // Editar Medida
            if (e.target.closest('.edit-medida')) {
                const row = e.target.closest('tr');
                const id = row.dataset.id;
                const descripcion = row.cells[1].textContent;

                document.getElementById('medida-modal-title').textContent = 'Editar Medida';
                document.getElementById('medida-descripcion').value = descripcion;
                document.getElementById('medida-modal').dataset.id = id;
                document.getElementById('medida-modal').style.display = 'block';
            }

            // Eliminar Medida
            if (e.target.closest('.delete-medida')) {
                const id = e.target.closest('tr').dataset.id;

                const result = await Swal.fire({
                    title: 'Eliminar medida',
                    text: '¿Está seguro de eliminar esta medida?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                });

                if (result.isConfirmed) {
                    showLoading(true);
                    try {
                        await ApiController.deleteMedida(id);
                        await Swal.fire({
                            icon: 'success',
                            title: 'Medida eliminada',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        await loadOtroData();
                    } catch (error) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Error al eliminar medida: ' + error.message,
                        });
                    } finally {
                        showLoading(false);
                    }
                }
            }

            // Editar Responsable
            if (e.target.closest('.edit-responsable')) {
                const row = e.target.closest('tr');
                const id = row.dataset.id;
                const nombre = row.cells[1].textContent;

                document.getElementById('responsable-modal-title').textContent = 'Editar Responsable';
                document.getElementById('responsable-nombre').value = nombre;
                document.getElementById('responsable-modal').dataset.id = id;
                document.getElementById('responsable-modal').style.display = 'block';
            }

            // Eliminar Responsable
            if (e.target.closest('.delete-responsable')) {
                const id = e.target.closest('tr').dataset.id;

                const result = await Swal.fire({
                    title: 'Eliminar responsable',
                    text: '¿Está seguro de eliminar este responsable?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                });

                if (result.isConfirmed) {
                    showLoading(true);
                    try {
                        await ApiController.deleteResponsable(id);
                        await Swal.fire({
                            icon: 'success',
                            title: 'Responsable eliminado',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        await loadOtroData();
                    } catch (error) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Error al eliminar responsable: ' + error.message,
                        });
                    } finally {
                        showLoading(false);
                    }
                }
            }

            // Editar Objetivo
            if (e.target.closest('.edit-objetivo')) {
                const row = e.target.closest('tr');
                const id = row.dataset.id;
                const nombre = row.cells[1].textContent;
                const descripcion = row.cells[2].textContent;

                document.getElementById('objetivo-modal-title').textContent = 'Editar Objetivo';
                document.getElementById('objetivo-nombre').value = nombre;
                document.getElementById('objetivo-descripcion').value = descripcion;
                document.getElementById('objetivo-modal').dataset.id = id;
                document.getElementById('objetivo-modal').style.display = 'block';
            }

            // Eliminar Objetivo
            if (e.target.closest('.delete-objetivo')) {
                const id = e.target.closest('tr').dataset.id;

                const result = await Swal.fire({
                    title: 'Eliminar objetivo',
                    text: '¿Está seguro de eliminar este objetivo?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                });

                if (result.isConfirmed) {
                    showLoading(true);
                    try {
                        await ApiController.deleteObjetivo(id);
                        await Swal.fire({
                            icon: 'success',
                            title: 'Objetivo eliminado',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        await loadOtroData();
                    } catch (error) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Error al eliminar objetivo: ' + error.message,
                        });
                    } finally {
                        showLoading(false);
                    }
                }
            }

            // Editar Rol
            if (e.target.closest('.edit-rol')) {
                const id = e.target.closest('tr').dataset.id;
                showLoading(true);
                try {
                    const rol = await ApiController.getRol(id);
                    document.getElementById('rol-modal-title').textContent = 'Editar Rol';
                    document.getElementById('rol-nombre').value = rol.nombre_rol || '';
                    document.getElementById('rol-descripcion').value = rol.descripcion_rol || '';
                    document.getElementById('rol-permisos').value = rol.permisos || '';
                    document.getElementById('rol-responsable').value = rol.responsable?.id || '';
                    document.getElementById('rol-modal').dataset.id = id;
                    document.getElementById('rol-modal').style.display = 'block';
                } catch (error) {
                    showError('Error al cargar rol: ' + error.message);
                } finally {
                    showLoading(false);
                }
            }

            // Eliminar Rol
            if (e.target.closest('.delete-rol')) {
                const id = e.target.closest('tr').dataset.id;

                const result = await Swal.fire({
                    title: 'Eliminar rol',
                    text: '¿Está seguro de eliminar este rol?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Sí, eliminar',
                    cancelButtonText: 'Cancelar'
                });

                if (result.isConfirmed) {
                    showLoading(true);
                    try {
                        await ApiController.deleteRol(id);
                        await Swal.fire({
                            icon: 'success',
                            title: 'Rol eliminado',
                            showConfirmButton: false,
                            timer: 1500
                        });
                        await loadOtroData();
                    } catch (error) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Error al eliminar rol: ' + error.message,
                        });
                    } finally {
                        showLoading(false);
                    }
                }
            }
        });
    }

    function setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                button.classList.add('active');

                const tabId = button.getAttribute('data-tab');
                const tabContent = document.getElementById(`${tabId}-tab`);
                if (tabContent) {
                    tabContent.classList.add('active');
                }
            });
        });
    }

    function setupSearch() {
        const searchInput = document.querySelector('.search-input');
        const searchBtn = document.querySelector('.search-btn');

        const searchTerms = {
            'inicio': { section: '#inicio', tab: null },
            'actividades': { section: '#actividades', tab: null },
            'planeacion': { section: '#planeacion', tab: null },
            'usuarios': { section: '#usuarios', tab: null },
            'reportes': { section: '#reportes', tab: null },
            'otros': { section: '#otro', tab: null },
            'componentes': { section: '#otro', tab: 'componentes' },
            'medidas': { section: '#otro', tab: 'medidas' },
            'responsables': { section: '#otro', tab: 'responsables' },
            'objetivos': { section: '#otro', tab: 'objetivos' },
            'roles': { section: '#otro', tab: 'roles' },
            'reportes existentes': {
                section: '#reportes',
                action: () => {
                    const verReportesBtn = Array.from(document.querySelectorAll('button'))
                        .find(btn => btn.textContent.trim().toLowerCase() === 'ver reportes');

                    if (verReportesBtn) {
                        verReportesBtn.click();
                    }
                }
            }
        };

        function handleSearch() {
            const searchTerm = searchInput.value.trim().toLowerCase();

            if (!searchTerm) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campo vacío',
                    text: 'Por favor ingrese un término de búsqueda',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });
                return;
            }

            for (const [term, { section, tab, action }] of Object.entries(searchTerms)) {
                if (searchTerm.includes(term)) {
                    const navLink = document.querySelector(`.nav-link[href="${section}"]`);
                    if (navLink) {
                        navLink.click();

                        setTimeout(() => {
                            if (tab) {
                                const tabButton = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
                                if (tabButton) tabButton.click();
                            }
                            if (action) action();
                        }, 500);

                        Swal.fire({
                            icon: 'success',
                            title: 'Redirigiendo',
                            text: `Navegando a la sección de ${term}`,
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 2000
                        });

                        searchInput.value = '';
                        return;
                    }
                }
            }

            Swal.fire({
                icon: 'error',
                title: 'No encontrado',
                text: 'No se encontraron resultados para su búsqueda',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000
            });
        }

        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }


    // ========= INICIALIZACIÓN ==========
    function init() {
        setupNavigation();
        setupActivityForm();
        setupPlanningForm();
        setupDynamicEvents();
        setupModals();
        setupSearch();
        setupCrudEvents();
        setupUserCrud();
        setupTabs();
        loadInitialData();
        loadOtroData();
    }
    init();
});