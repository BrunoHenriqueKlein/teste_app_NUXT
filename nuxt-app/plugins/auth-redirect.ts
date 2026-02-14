export default defineNuxtPlugin((nuxtApp) => {
    // Apenas no cliente
    if (process.server) return

    const { logout } = useAuth()
    const route = useRoute()

    // Sobrescrever o $fetch global para interceptar erros 401
    // Isso garante que qualquer requisição que falhe por token inválido redirecione para o login
    globalThis.$fetch = $fetch.create({
        async onResponseError({ response, request }) {
            // Ignorar erro 401 na própria tentativa de login (senha errada)
            // request pode ser objeto ou string, convertemos para string para verificar
            const requestUrl = typeof request === 'string' ? request : (request as any).toString()

            if (requestUrl.includes('/api/auth/login')) {
                return
            }

            if (response.status === 401) {
                // Se já estivermos na página de login, não precisa redirecionar
                if (route.path === '/login') return

                console.warn('⚠️ Sessão expirada ou não autorizada. Redirecionando para login...')
                logout()
            }
        }
    })
})
