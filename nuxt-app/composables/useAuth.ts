import { ref, computed } from 'vue'

export const useAuth = () => {
    const user = useState('user', () => null)
    const token = useState('token', () => null)
    const loading = ref(false)
    const error = ref(null)

    // Inicialização (pode ser chamada no plugin ou middleware)
    const init = () => {
        if (process.client) {
            const savedUser = localStorage.getItem('user')
            const savedToken = localStorage.getItem('authToken')

            if (savedUser && savedToken) {
                user.value = JSON.parse(savedUser)
                token.value = savedToken
            }
        }
    }

    const isLoggedIn = computed(() => !!token.value)
    const isAdmin = computed(() => user.value?.role === 'ADMIN')

    const login = async (credentials) => {
        loading.value = true
        error.value = null
        try {
            const response = await $fetch('/api/auth/login', {
                method: 'POST',
                body: credentials
            })

            if (response.success) {
                user.value = response.user
                token.value = response.token

                if (process.client) {
                    localStorage.setItem('user', JSON.stringify(response.user))
                    localStorage.setItem('authToken', response.token)
                }
                return true
            }
        } catch (err) {
            error.value = err.data?.message || 'Erro ao fazer login'
            return false
        } finally {
            loading.value = false
        }
    }

    const register = async (userData) => {
        loading.value = true
        error.value = null
        try {
            const response = await $fetch('/api/auth/register', {
                method: 'POST',
                body: userData
            })
            return response
        } catch (err) {
            error.value = err.data?.message || 'Erro ao cadastrar'
            return null
        } finally {
            loading.value = false
        }
    }

    const logout = () => {
        user.value = null
        token.value = null
        if (process.client) {
            localStorage.removeItem('user')
            localStorage.removeItem('authToken')
            window.location.href = '/login'
        }
    }

    const updateProfile = async (data) => {
        loading.value = true
        error.value = null
        try {
            const response = await $fetch('/api/user/update-profile', {
                method: 'POST',
                body: data,
                headers: {
                    Authorization: `Bearer ${token.value}`
                }
            })

            if (response.success) {
                user.value = { ...user.value, ...response.user }
                if (process.client) {
                    localStorage.setItem('user', JSON.stringify(user.value))
                }
                return true
            }
        } catch (err) {
            error.value = err.data?.message || 'Erro ao atualizar perfil'
            return false
        } finally {
            loading.value = false
        }
    }

    const hasPermission = (moduleName, permissionType = 'canView') => {
        if (isAdmin.value) return true
        if (!user.value || !user.value.userModules) return false

        const module = user.value.userModules.find(m => m.module.nome === moduleName)
        return module ? !!module[permissionType] : false
    }

    return {
        user,
        token,
        loading,
        error,
        isLoggedIn,
        isAdmin,
        init,
        login,
        logout,
        register,
        updateProfile,
        hasPermission
    }
}
