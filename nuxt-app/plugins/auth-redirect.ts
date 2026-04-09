export default defineNuxtPlugin((nuxtApp) => {
    // Apenas no cliente
    if (process.server) return

    const { logout, token } = useAuth()
    const route = useRoute()

    // Sobrescrever o $fetch global para interceptar erros 401 e injetar o token
    globalThis.$fetch = $fetch.create({
        onRequest({ request, options }) {
            // Injetar token se disponível
            if (token.value) {
                options.headers = options.headers || {}
                if (Array.isArray(options.headers)) {
                    options.headers.push(['Authorization', `Bearer ${token.value}`])
                } else if (options.headers instanceof Headers) {
                    options.headers.set('Authorization', `Bearer ${token.value}`)
                } else {
                    (options.headers as any).Authorization = `Bearer ${token.value}`
                }
            }
        },
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
