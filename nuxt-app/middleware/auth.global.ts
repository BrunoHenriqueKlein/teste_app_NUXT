export default defineNuxtRouteMiddleware((to, from) => {
    const { isLoggedIn, init } = useAuth()

    // No lado do servidor, não temos localStorage, então pulamos a verificação para evitar loop de redirecionamento
    if (process.server) return

    // No lado do cliente, garantir que o estado do usuário esteja carregado
    init()

    // Rotas públicas que não requerem login
    const publicRoutes = ['/login', '/reset-password']

    if (!isLoggedIn.value && !publicRoutes.includes(to.path)) {
        return navigateTo('/login')
    }

    // Se já estiver logado e tentar ir para o login, vai para a home
    if (isLoggedIn.value && to.path === '/login') {
        return navigateTo('/')
    }
})
