//MARTÍNEZ LÓPEZ LUIS ÁNGEL
//HERNÁNDEZ TORIBIO MANUEL
//LÓPEZ HERNÁNDEZ JOSÉ MANUEL
//MURRIETA MATUS JESÚS ALFREDO
//MEDINA COXCA DANIEL SALVADOR

class ApiController {
    static BASE_URL = 'http://localhost:8080';
    static headers = {
        'Content-Type': 'application/json',
        'Authorization': ''
    };

    // Métodos de Autenticación
    static async login(correo, contrasenia) {
        try {
            const response = await fetch(`${this.BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ correo, contrasenia })
            });

            if (response.status === 204) {
                throw new Error('El servidor respondió con una respuesta vacía');
            }

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(data.error || 'Credenciales incorrectas');
            }

            console.log('Respuesta del login:', data); 

            const rol = data.usuario?.rol?.toLowerCase() || 'user';

            if (data.token) {
                this.setAuthToken(data.token);
            }

            return {
                token: data.token,
                nombre: data.usuario?.nombre || data.usuario?.descripcion_usuario || correo.split('@')[0],
                rol: rol,
                avatarUrl: data.usuario?.avatarUrl || 'default-avatar.png',
                responsableId: data.usuario?.responsableId
            };

        } catch (error) {
            console.error('Error en login:', error);
            throw new Error(error.message || 'Error al conectar con el servidor');
        }
    }

    // Métodos CRUD genéricos
    static async getEntidad(entidad, id = null, params = {}) {
        try {
            let endpoint = id ? `/${entidad}/${id}` : `/${entidad}`;

            // Agregar parámetros de consulta si existen
            const queryParams = new URLSearchParams();
            for (const key in params) {
                if (params[key] !== undefined && params[key] !== null) {
                    queryParams.append(key, params[key]);
                }
            }

            const queryString = queryParams.toString();
            if (queryString) {
                endpoint += `?${queryString}`;
            }

            return this._fetch(endpoint);
        } catch (error) {
            console.error(`Error en getEntidad para ${entidad}:`, error);
            throw error;
        }
    }

    static async createEntidad(entidad, data) {
        return this._fetch(`/${entidad}`, 'POST', data);
    }

    static async updateEntidad(entidad, id, data) {
        return this._fetch(`/${entidad}/${id}`, 'PUT', data);
    }

    static async deleteEntidad(entidad, id) {
        return this._fetch(`/${entidad}/${id}`, 'DELETE');
    }

    // Métodos específicos para Componentes
    static async getComponentes() {
        return this.getEntidad('componentes');
    }

    static async getComponente(id) {
        if (!id) {
            throw new Error('ID de componente es requerido');
        }
        try {
            const response = await this._fetch(`/componentes/${id}`);

            // Verificar si el componente existe
            if (!response) {
                throw new Error(`Componente con ID ${id} no encontrado`);
            }

            return response;
        } catch (error) {
            console.error(`Error al obtener componente ${id}:`, error);
            throw error;
        }
    }

    static async createComponente(data) {
        try {
            const requestData = {
                num_componente: data.numero,
                descripcion_componente: data.descripcion || data.descripcion_componente
            };

            console.log('Creando componente con datos:', requestData);
            const response = await this._fetch('/componentes', 'POST', requestData);

            if (!response || !response.id) {
                throw new Error('No se recibió una respuesta válida del servidor');
            }

            return response;
        } catch (error) {
            console.error('Error en createComponente:', error);
            throw error;
        }
    }

    static async updateComponente(id, data) {
        try {
            const requestData = {
                num_componente: data.numero,
                descripcion_componente: data.descripcion || data.descripcion_componente
            };

            console.log('Actualizando componente con datos:', requestData);
            const response = await this._fetch(`/componentes/${id}`, 'PUT', requestData);

            if (!response || !response.id) {
                throw new Error('No se recibió una respuesta válida del servidor');
            }

            return response;
        } catch (error) {
            console.error('Error en updateComponente:', error);
            throw error;
        }
    }

    static async deleteComponente(id) {
        return this.deleteEntidad('componentes', id);
    }

    // Métodos para Actividades
    static async getActividades(params = {}) {
        return this.getEntidad('actividades', null, params);
    }

    static async getActividad(id) {
        if (!id) {
            throw new Error('ID de actividad es requerido');
        }
        return this.getEntidad('actividades', id);
    }

    static async createActividad(actividadData) {
        // Validaciones básicas
        if (!actividadData.descripcion_actividad) {
            throw new Error('La descripción de la actividad es requerida');
        }

        // Estructura los datos para la API
        const requestData = {
            descripcion_actividad: actividadData.descripcion_actividad,
            componente: actividadData.id_componente ? { id: actividadData.id_componente } : null,
            medida: actividadData.id_medida ? { id: actividadData.id_medida } : null,
            objetivo: actividadData.id_objetivo ? { id: actividadData.id_objetivo } : null,
            planeacion: actividadData.id_planeacion ? { id: actividadData.id_planeacion } : null,
            responsable: actividadData.id_responsable ? { id: actividadData.id_responsable } : null
        };

        return this.createEntidad('actividades', requestData);
    }

    static async updateActividad(id, actividadData) {
        if (!id) {
            throw new Error('ID de actividad es requerido');
        }

        // Solo incluir campos que se van a actualizar
        const requestData = {};

        if (actividadData.descripcion_actividad !== undefined) {
            requestData.descripcion_actividad = actividadData.descripcion_actividad;
        }

        if (actividadData.id_componente !== undefined) {
            requestData.componente = actividadData.id_componente ? { id: actividadData.id_componente } : null;
        }

        if (actividadData.id_medida !== undefined) {
            requestData.medida = actividadData.id_medida ? { id: actividadData.id_medida } : null;
        }

        if (actividadData.id_objetivo !== undefined) {
            requestData.objetivo = actividadData.id_objetivo ? { id: actividadData.id_objetivo } : null;
        }

        if (actividadData.id_planeacion !== undefined) {
            requestData.planeacion = actividadData.id_planeacion ? { id: actividadData.id_planeacion } : null;
        }

        if (actividadData.id_responsable !== undefined) {
            requestData.responsable = actividadData.id_responsable ? { id: actividadData.id_responsable } : null;
        }

        return this.updateEntidad('actividades', id, requestData);
    }

    static async deleteActividad(id) {
        if (!id) {
            throw new Error('ID de actividad es requerido');
        }

        try {
            await this.deleteEntidad('actividades', id);
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar actividad:', error);
            return { success: false, message: error.message };
        }
    }

    // Métodos para Planeaciones
    static async getPlaneaciones() {
        return this.getEntidad('planeaciones');
    }

    static async getPlaneacion(id) {
        return this.getEntidad('planeaciones', id);
    }

    static async createPlaneacion(data) {
        return this.createEntidad('planeaciones', {
            unidad_responsable: data.unidad_responsable,
            jefe_unidad: data.jefe_unidad,
            medio_verificacion: data.medio_verificacion,
            objetivo_area: data.objetivo_area,
            responsable: data.responsable
        });
    }

    static async updatePlaneacion(id, data) {
        return this.updateEntidad('planeaciones', id, {
            unidad_responsable: data.unidad_responsable,
            jefe_unidad: data.jefe_unidad,
            medio_verificacion: data.medio_verificacion,
            objetivo_area: data.objetivo_area,
            responsable: data.responsable
        });
    }

    static async deletePlaneacion(id) {
        return this.deleteEntidad('planeaciones', id);
    }

    // Métodos para Medidas
    static async getMedidas() {
        return this.getEntidad('medidas');
    }

    static async getMedida(id) {
        return this.getEntidad('medidas', id);
    }

    static async createMedida(data) {
        try {
            const requestData = {
                descripcion_medida: data.descripcion || data.descripcion_medida
            };

            console.log('Creando medida con datos:', requestData);
            const response = await this._fetch('/medidas', 'POST', requestData);

            if (!response || !response.id) {
                throw new Error('No se recibió una respuesta válida del servidor');
            }

            return response;
        } catch (error) {
            console.error('Error en createMedida:', error);
            throw error;
        }
    }

    static async updateMedida(id, data) {
        try {
            const requestData = {
                descripcion_medida: data.descripcion || data.descripcion_medida
            };

            console.log('Actualizando medida con datos:', requestData);
            const response = await this._fetch(`/medidas/${id}`, 'PUT', requestData);

            if (!response || !response.id) {
                throw new Error('No se recibió una respuesta válida del servidor');
            }

            return response;
        } catch (error) {
            console.error('Error en updateMedida:', error);
            throw error;
        }
    }

    static async deleteMedida(id) {
        return this.deleteEntidad('medidas', id);
    }

    // Métodos para Objetivos
    static async getObjetivos() {
        return this.getEntidad('objetivos');
    }

    static async getObjetivo(id) {
        return this.getEntidad('objetivos', id);
    }

    static async createObjetivo(data) {
        try {
            const requestData = {
                nombre_objetivo: data.nombre || data.nombre_objetivo,
                descripcion_objetivo: data.descripcion || data.descripcion_objetivo
            };

            console.log('Creando objetivo con datos:', requestData);
            const response = await this._fetch('/objetivos', 'POST', requestData);

            if (!response || !response.id) {
                throw new Error('No se recibió una respuesta válida del servidor');
            }

            return response;
        } catch (error) {
            console.error('Error en createObjetivo:', error);
            throw error;
        }
    }

    static async updateObjetivo(id, data) {
        try {
            const requestData = {
                nombre_objetivo: data.nombre || data.nombre_objetivo,
                descripcion_objetivo: data.descripcion || data.descripcion_objetivo
            };

            console.log('Actualizando objetivo con datos:', requestData);
            const response = await this._fetch(`/objetivos/${id}`, 'PUT', requestData);

            if (!response || !response.id) {
                throw new Error('No se recibió una respuesta válida del servidor');
            }

            return response;
        } catch (error) {
            console.error('Error en updateObjetivo:', error);
            throw error;
        }
    }

    static async deleteObjetivo(id) {
        return this.deleteEntidad('objetivos', id);
    }

    // Métodos para Responsables
    static async getResponsables() {
        return this.getEntidad('responsables');
    }

    static async getResponsable(id) {
        return this.getEntidad('responsables', id);
    }

    static async createResponsable(data) {
        try {
            // Validación mejorada
            if (!data.nombre_responsable || data.nombre_responsable.trim().length < 3) {
                throw new Error('El nombre del responsable debe tener al menos 3 caracteres');
            }

            const requestData = {
                nombre_responsable: data.nombre_responsable.trim()
            };

            console.log('Creando responsable con datos:', requestData);
            const response = await this._fetch('/responsables', 'POST', requestData);

            if (!response || !response.id) {
                throw new Error('No se recibió una respuesta válida del servidor');
            }

            return response;
        } catch (error) {
            console.error('Error en createResponsable:', error);
            throw new Error(error.message || 'Error al crear responsable');
        }
    }

    static async updateResponsable(id, data) {
        try {
            // Validación igual que en creación
            if (!data.nombre_responsable || data.nombre_responsable.trim().length < 3) {
                throw new Error('El nombre del responsable debe tener al menos 3 caracteres');
            }

            const requestData = {
                nombre_responsable: data.nombre_responsable.trim()
            };

            console.log('Actualizando responsable con datos:', requestData);
            const response = await this._fetch(`/responsables/${id}`, 'PUT', requestData);

            if (!response || !response.id) {
                throw new Error('No se recibió una respuesta válida del servidor');
            }

            return response;
        } catch (error) {
            console.error('Error en updateResponsable:', error);
            throw new Error(error.message || 'Error al actualizar responsable');
        }
    }

    static async deleteResponsable(id) {
        return this.deleteEntidad('responsables', id);
    }

    // Métodos para Usuarios
    static async getUsuarios() {
        return this.getEntidad('usuarios');
    }

    static async getUsuario(id) {
        return this.getEntidad('usuarios', id);
    }

    static async updateUsuario(id, data) {
        try {
            // Validación mejorada de email si se está actualizando
            if (data.correo) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.correo)) {
                    throw new Error('El correo electrónico no es válido');
                }
            }

            const requestData = {
                correo: data.correo,
                contrasenia: data.contrasenia,
                descripcion_usuario: data.descripcion || '',
                responsable: data.responsable ? { id: parseInt(data.responsable) } : null
            };

            console.log('Actualizando usuario con datos:', requestData);
            const response = await this._fetch(`/usuarios/${id}`, 'PUT', requestData);

            if (!response || !response.id) {
                throw new Error('No se recibió una respuesta válida del servidor');
            }

            return response;
        } catch (error) {
            console.error('Error en updateUsuario:', error);
            throw new Error(error.message || 'Error al actualizar usuario');
        }
    }

    static async createUsuario(data) {
        try {
            // Validación mejorada de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.correo)) {
                throw new Error('El correo electrónico no es válido');
            }

            // Validación de contraseña
            if (!data.contrasenia || data.contrasenia.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }

            // Verificar que el responsable existe
            if (!data.responsable || isNaN(data.responsable)) {
                throw new Error('Debe seleccionar un responsable válido');
            }

            // Verificar si el responsable existe realmente
            try {
                await this.getResponsable(data.responsable);
            } catch (e) {
                throw new Error('El responsable seleccionado no existe');
            }

            const requestData = {
                correo: data.correo,
                contrasenia: data.contrasenia,
                descripcion_usuario: data.descripcion || '',
                responsable: { id: parseInt(data.responsable) }
            };

            console.log('Creando usuario con datos:', requestData);
            const response = await this._fetch('/usuarios', 'POST', requestData);

            if (!response || !response.id) {
                throw new Error('No se recibió una respuesta válida del servidor');
            }

            return response;
        } catch (error) {
            console.error('Error en createUsuario:', error);
            if (error.message.includes('duplicate')) {
                throw new Error('El correo electrónico ya está registrado');
            }
            throw new Error(error.message || 'Error al crear usuario');
        }
    }

    static async deleteUsuario(id) {
        return this.deleteEntidad('usuarios', id);
    }

    // Métodos para Roles
    static async getRoles() {
        return this.getEntidad('roles');
    }

    static async getRol(id) {
        return this.getEntidad('roles', id);
    }

    static async createRol(data) {
        try {
            if (!data.nombre || data.nombre.trim().length < 3) {
                throw new Error('El nombre del rol debe tener al menos 3 caracteres');
            }

            if (!data.permisos || data.permisos.length === 0) {
                throw new Error('Debe seleccionar al menos un permiso');
            }

            if (!data.responsable || isNaN(data.responsable)) {
                throw new Error('Debe seleccionar un responsable válido');
            }

            try {
                await this.getResponsable(data.responsable);
            } catch (e) {
                throw new Error('El responsable seleccionado no existe');
            }

            const requestData = {
                nombre_rol: data.nombre,
                descripcion_rol: data.descripcion || '',
                permisos: Array.isArray(data.permisos) ? data.permisos.join(',') : data.permisos,
                responsable: { id: parseInt(data.responsable) }
            };

            console.log('Creando rol con datos:', requestData);
            const response = await this._fetch('/roles', 'POST', requestData);

            if (!response || !response.id) {
                throw new Error('No se recibió una respuesta válida del servidor');
            }

            return response;
        } catch (error) {
            console.error('Error en createRol:', error);
            throw new Error(error.message || 'Error al crear rol');
        }
    }

    static async updateRol(id, data) {
        try {
            if (!data.nombre || data.nombre.trim().length < 3) {
                throw new Error('El nombre del rol debe tener al menos 3 caracteres');
            }

            if (!data.permisos || data.permisos.length === 0) {
                throw new Error('Debe seleccionar al menos un permiso');
            }

            if (!data.responsable || isNaN(data.responsable)) {
                throw new Error('Debe seleccionar un responsable válido');
            }

            try {
                await this.getResponsable(data.responsable);
            } catch (e) {
                throw new Error('El responsable seleccionado no existe');
            }

            const requestData = {
                nombre_rol: data.nombre,
                descripcion_rol: data.descripcion || '',
                permisos: Array.isArray(data.permisos) ? data.permisos.join(',') : data.permisos,
                responsable: { id: parseInt(data.responsable) }
            };

            console.log('Actualizando rol con datos:', requestData);
            const response = await this._fetch(`/roles/${id}`, 'PUT', requestData);

            if (!response || !response.id) {
                throw new Error('No se recibió una respuesta válida del servidor');
            }

            return response;
        } catch (error) {
            console.error('Error en updateRol:', error);
            throw new Error(error.message || 'Error al actualizar rol');
        }
    }

    static async deleteRol(id) {
        return this.deleteEntidad('roles', id);
    }

    // Métodos para Calendarios
    static async getCalendarios() {
        return this.getEntidad('calendarios');
    }

    static async getCalendariosPorActividad(actividadId) {
        return this._fetch(`/calendarios?actividadId=${actividadId}`);
    }

    

    // Método interno para fetch
    static async _fetch(endpoint, method = 'GET', body = null) {
        try {
            const options = {
                method,
                headers: this.headers
            };

            if (body) {
                options.body = JSON.stringify(body);
                console.log('Enviando cuerpo de la petición:', body);
            }

            console.log(`Enviando ${method} a ${endpoint}`);
            const response = await fetch(`${this.BASE_URL}${endpoint}`, options);

            // Manejar respuestas vacías (204 No Content)
            if (response.status === 204) {
                console.log('Respuesta vacía recibida (204 No Content)');
                return null;
            }

            // Verificar si la respuesta es OK
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { message: response.statusText };
                }

                console.error('Error en la respuesta:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData
                });

                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            // Intentar parsear JSON
            try {
                const responseData = await response.json();
                console.log('Respuesta recibida:', responseData);
                return responseData;
            } catch (e) {
                // Si la respuesta es 200 pero no tiene contenido
                if (response.status === 200 && response.headers.get('content-length') === '0') {
                    console.log('Respuesta vacía recibida con status 200');
                    return null;
                }

                console.error('Error al parsear JSON:', e);
                throw new Error('Respuesta del servidor no es un JSON válido');
            }

        } catch (error) {
            console.error(`API Error at ${endpoint}:`, error);
            throw error;
        }
    }
    
    // Manejo de autenticación
    static setAuthToken(token) {
        this.headers.Authorization = `Bearer ${token}`;
        sessionStorage.setItem('authToken', token);
        console.log('Token de autenticación establecido');
    }

    static loadToken() {
        const token = sessionStorage.getItem('authToken');
        if (token) {
            this.headers.Authorization = `Bearer ${token}`;
            console.log('Token de autenticación cargado desde sessionStorage');
        }
        return token;
    }

    // Limpiar autenticación
    static clearAuth() {
        this.headers.Authorization = '';
        sessionStorage.removeItem('authToken');
        console.log('Token de autenticación eliminado');
    }
}


// Inicializar token al cargar
ApiController.loadToken();